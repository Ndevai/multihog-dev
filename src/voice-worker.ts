// The natural voice's worker (index.ts, rules/pocket.ts, rules/averaged-person.ts): Pocket TTS's five networks (the ONNX export KevinAHM/pocket-tts-onnx,
// english_2026-04, int8 where it exists) run by onnxruntime-web off the page's thread, so the box keeps typing while a line is
// made. The loop is the export's own (pocket_tts_onnx.py): a recording's 24 kHz samples → the Mimi encoder → a voice prompt the
// language model reads first; a line's tokens → the text conditioner → the language model, then one frame at a time: the model's
// conditioning and end-of-speech logit, a latent drawn by the flow network from noise of variance `temperature`, fed back; the
// latents → the Mimi decoder → 24 kHz audio. The language model's attention memory is sized to the line (the export fixes 1,000
// frames; a voice prompt fills 126 and a line rarely 150 more): the outputs are the same to the last bit at 256 as at 1,000.
type Tensor = { data: Float32Array | BigInt64Array | Uint8Array; dims: readonly number[] };
type Session = { run(feeds: Record<string, unknown>): Promise<Record<string, Tensor>> };
type Ort = {
    env: { wasm: { wasmPaths: string; numThreads: number } };
    Tensor: new (type: string, data: Float32Array | BigInt64Array | Uint8Array, dims: number[]) => Tensor;
    InferenceSession: { create(bytes: Uint8Array, opts?: Record<string, unknown>): Promise<Session> };
};
type Entry = { input_name: string; output_name: string; dtype: 'float32' | 'int64' | 'bool'; fill: 'nan' | 'zeros' | 'ones' | 'empty'; shape: number[] };
type State = Record<string, Tensor>;
type Chunk = { ids: number[]; framesAfterEos: number; maxFrames: number };
type Msg =
    | { type: 'load'; ortUrl: string; files: Record<string, ArrayBuffer> }
    | { type: 'person'; id: number; buffer: ArrayBuffer; family?: string }
    | { type: 'voice'; id: number; voice: string; samples?: Float32Array; embedding?: Float32Array; body?: BodyTarget; emotion?: { family: string; w: number } }
    | { type: 'speak'; id: number; voice: string; chunks: Chunk[]; temperature: number };
import { parseAveragedPerson, bodyRecording, type AveragedPerson, type BodyTarget } from './rules/averaged-person.js';
let person: AveragedPerson | null = null;
const emotions = new Map<string, AveragedPerson>();
const scope = globalThis as unknown as { onmessage: (e: { data: Msg }) => void; postMessage(m: unknown, transfer?: Transferable[]): void };

const LATENT = 32, COND = 1024, FULL = 1000, BLOCK = 32, DECODE_FRAMES = 15;
let ort: Ort, nets: Record<'encoder' | 'text' | 'main' | 'flow' | 'decoder', Session>, flowManifest: Entry[], mimiManifest: Entry[], bos: Float32Array;
const voices = new Map<string, { state: State; steps: number }>();
const roundUp = (n: number) => Math.ceil(n / BLOCK) * BLOCK;

/** A state as the manifest describes it, the language model's memory `cache` frames long. */
function freshState(manifest: Entry[], cache = FULL): State {
    const st: State = {};
    for (const e of manifest) {
        const dims = e.shape.map(d => d === FULL ? cache : d), n = dims.reduce((a, b) => a * b, 1);
        const data = e.dtype === 'int64' ? new BigInt64Array(n) : e.dtype === 'bool' ? new Uint8Array(n).fill(e.fill === 'ones' ? 1 : 0) : new Float32Array(n).fill(e.fill === 'nan' ? NaN : e.fill === 'ones' ? 1 : 0);
        st[e.input_name] = new ort.Tensor(e.dtype, data, dims);
    }
    return st;
}
const nextState = (manifest: Entry[], out: Record<string, Tensor>): State => Object.fromEntries(manifest.map(e => [e.input_name, out[e.output_name]!]));
/** A memory widened to `cache` frames, the frames past the old length unfilled (NaN, as a fresh state's). */
function widen(st: State, cache: number): State {
    const out: State = {};
    for (const e of flowManifest) {
        const t = st[e.input_name]!;
        if (!e.shape.includes(FULL)) { out[e.input_name] = t; continue; }
        const old = t.dims[2]!, per = t.data.length / 2, nPer = per / old * cache, data = new Float32Array(2 * nPer).fill(NaN);
        for (let h = 0; h < 2; h++) data.set((t.data as Float32Array).subarray(h * per, (h + 1) * per), h * nPer);
        out[e.input_name] = new ort.Tensor('float32', data, [t.dims[0]!, t.dims[1]!, cache, ...t.dims.slice(3)]);
    }
    return out;
}
const f32 = (data: Float32Array, dims: number[]) => new ort.Tensor('float32', data, dims);
async function main(seq: Float32Array, seqLen: number, text: Float32Array, textLen: number, st: State) {
    const out = await nets.main.run({ sequence: f32(seq, [1, seqLen, LATENT]), text_embeddings: f32(text, [1, textLen, COND]), ...st });
    return { cond: out['conditioning']!.data as Float32Array, eos: (out['eos_logit']!.data as Float32Array)[0]!, state: nextState(flowManifest, out) };
}
/** A voice: the recording's encoding after the model's start-of-voice vector, read once; kept as its memory (128 frames). */
async function makeVoice(name: string, emb: Float32Array): Promise<void> {
    const t = emb.length / COND, text = new Float32Array((t + 1) * COND);
    text.set(bos); text.set(emb, COND);
    const r = await main(new Float32Array(0), 0, text, t + 1, freshState(flowManifest, roundUp(t + 1)));
    voices.set(name, { state: r.state, steps: t + 1 });
}
/** Standard normal draws (Box–Muller). */
function normal(n: number, sd: number): Float32Array {
    const x = new Float32Array(n);
    for (let i = 0; i < n; i += 2) {
        const r = Math.sqrt(-2 * Math.log(1 - Math.random())) * sd, a = 2 * Math.PI * Math.random();
        x[i] = r * Math.cos(a); if (i + 1 < n) x[i + 1] = r * Math.sin(a);
    }
    return x;
}
/** One stretch's latents (_run_flow_lm_chunk, one flow step). */
async function latentsOf(voice: { state: State; steps: number }, c: Chunk, temperature: number): Promise<Float32Array[]> {
    let st = widen(voice.state, roundUp(voice.steps + c.ids.length + c.maxFrames + 2));
    const te = await nets.text.run({ token_ids: new ort.Tensor('int64', BigInt64Array.from(c.ids.map(BigInt)), [1, c.ids.length]) });
    st = (await main(new Float32Array(0), 0, te['embeddings']!.data as Float32Array, c.ids.length, st)).state;
    const out: Float32Array[] = [];
    let curr: Float32Array = new Float32Array(LATENT).fill(NaN), eosAt = -1;
    for (let step = 0; step < c.maxFrames; step++) {
        const r = await main(curr, 1, new Float32Array(0), 0, st);
        st = r.state;
        if (r.eos > -4 && eosAt < 0) eosAt = step;
        if (eosAt >= 0 && step >= eosAt + c.framesAfterEos) break;
        const x = temperature > 0 ? normal(LATENT, Math.sqrt(temperature)) : new Float32Array(LATENT);
        const f = await nets.flow.run({ c: f32(r.cond, [1, COND]), s: f32(new Float32Array([0]), [1, 1]), t: f32(new Float32Array([1]), [1, 1]), x: f32(x, [1, LATENT]) });
        const flow = f['flow_dir']!.data as Float32Array;
        for (let i = 0; i < LATENT; i++) x[i] += flow[i]!;
        out.push(x); curr = x;
    }
    return out;
}
/** Latents → audio, 15 frames a pass (decode_latents). */
async function decode(lat: Float32Array[]): Promise<Float32Array> {
    let st = freshState(mimiManifest);
    const parts: Float32Array[] = [];
    for (let i = 0; i < lat.length; i += DECODE_FRAMES) {
        const k = Math.min(DECODE_FRAMES, lat.length - i), x = new Float32Array(k * LATENT);
        for (let j = 0; j < k; j++) x.set(lat[i + j]!, j * LATENT);
        const out = await nets.decoder.run({ latent: f32(x, [1, k, LATENT]), ...st });
        parts.push(out['audio_frame']!.data as Float32Array); st = nextState(mimiManifest, out);
    }
    const all = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
    let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
    return all;
}

let queue: Promise<unknown> = Promise.resolve();
scope.onmessage = e => {
    const m = e.data;
    queue = queue.then(async () => {
        try {
            if (m.type === 'load') {
                ort = await import(`${m.ortUrl}ort.wasm.min.mjs`) as Ort;
                ort.env.wasm.wasmPaths = m.ortUrl; ort.env.wasm.numThreads = 1;
                const bundle = JSON.parse(new TextDecoder().decode(m.files['bundle.json'])) as { flow_lm_state_manifest: Entry[]; mimi_state_manifest: Entry[] };
                flowManifest = bundle.flow_lm_state_manifest; mimiManifest = bundle.mimi_state_manifest;
                // bos_before_voice.npy: a float32 array after its header (the 10-byte preamble and the header's own length).
                const npy = m.files['bos_before_voice.npy']!, hl = new DataView(npy).getUint16(8, true);
                bos = new Float32Array(npy.slice(10 + hl));
                const make = (f: string) => ort.InferenceSession.create(new Uint8Array(m.files[f]!));
                nets = { encoder: await make('mimi_encoder.onnx'), text: await make('text_conditioner.onnx'), main: await make('flow_lm_main_int8.onnx'), flow: await make('flow_lm_flow_int8.onnx'), decoder: await make('mimi_decoder_int8.onnx') };
                scope.postMessage({ type: 'loaded' });
            } else if (m.type === 'person') {
                if (m.family) emotions.set(m.family, parseAveragedPerson(m.buffer)); else person = parseAveragedPerson(m.buffer);
                scope.postMessage({ type: 'personed', id: m.id });
            } else if (m.type === 'voice') {
                let emb = m.embedding;
                if (!emb) {
                    // A body's voice: the averaged person spoken with the body's causes (averaged-person.ts), then encoded.
                    const e = m.emotion ? emotions.get(m.emotion.family) : undefined;
                    const samples = m.samples ?? (m.body && person ? bodyRecording(person, m.body, 1, e && m.emotion ? { e, w: m.emotion.w } : undefined) : null);
                    if (!samples) throw new Error('no recording and no averaged person');
                    const out = await nets.encoder.run({ audio: f32(samples, [1, 1, samples.length]) });
                    emb = Float32Array.from(out['latents']!.data as Float32Array);
                }
                await makeVoice(m.voice, emb);
                scope.postMessage({ type: 'voiced', id: m.id, embedding: m.embedding ? undefined : emb });
            } else {
                const v = voices.get(m.voice);
                if (!v) throw new Error(`no voice ${m.voice}`);
                const lat: Float32Array[] = [];
                for (const c of m.chunks) lat.push(...await latentsOf(v, c, m.temperature));
                const audio = await decode(lat);
                scope.postMessage({ type: 'audio', id: m.id, audio }, [audio.buffer]);
            }
        } catch (err) {
            scope.postMessage(m.type === 'load' ? { type: 'error', error: String(err) } : { type: m.type === 'voice' ? 'voiced' : m.type === 'person' ? 'personed' : 'audio', id: m.id, error: String(err) });
        }
    });
};
