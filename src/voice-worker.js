import { parseAveragedPerson, bodyRecording } from './rules/averaged-person.js';
let person = null;
const emotions = new Map();
const scope = globalThis;
const LATENT = 32, COND = 1024, FULL = 1000, BLOCK = 32, DECODE_FRAMES = 15;
let ort, nets, flowManifest, mimiManifest, bos;
const voices = new Map();
const roundUp = (n) => Math.ceil(n / BLOCK) * BLOCK;
/** A state as the manifest describes it, the language model's memory `cache` frames long. */
function freshState(manifest, cache = FULL) {
    const st = {};
    for (const e of manifest) {
        const dims = e.shape.map(d => d === FULL ? cache : d), n = dims.reduce((a, b) => a * b, 1);
        const data = e.dtype === 'int64' ? new BigInt64Array(n) : e.dtype === 'bool' ? new Uint8Array(n).fill(e.fill === 'ones' ? 1 : 0) : new Float32Array(n).fill(e.fill === 'nan' ? NaN : e.fill === 'ones' ? 1 : 0);
        st[e.input_name] = new ort.Tensor(e.dtype, data, dims);
    }
    return st;
}
const nextState = (manifest, out) => Object.fromEntries(manifest.map(e => [e.input_name, out[e.output_name]]));
/** A memory widened to `cache` frames, the frames past the old length unfilled (NaN, as a fresh state's). */
function widen(st, cache) {
    const out = {};
    for (const e of flowManifest) {
        const t = st[e.input_name];
        if (!e.shape.includes(FULL)) {
            out[e.input_name] = t;
            continue;
        }
        const old = t.dims[2], per = t.data.length / 2, nPer = per / old * cache, data = new Float32Array(2 * nPer).fill(NaN);
        for (let h = 0; h < 2; h++)
            data.set(t.data.subarray(h * per, (h + 1) * per), h * nPer);
        out[e.input_name] = new ort.Tensor('float32', data, [t.dims[0], t.dims[1], cache, ...t.dims.slice(3)]);
    }
    return out;
}
const f32 = (data, dims) => new ort.Tensor('float32', data, dims);
async function main(seq, seqLen, text, textLen, st) {
    const out = await nets.main.run({ sequence: f32(seq, [1, seqLen, LATENT]), text_embeddings: f32(text, [1, textLen, COND]), ...st });
    return { cond: out['conditioning'].data, eos: out['eos_logit'].data[0], state: nextState(flowManifest, out) };
}
/** A voice: the recording's encoding after the model's start-of-voice vector, read once; kept as its memory (128 frames). */
async function makeVoice(name, emb) {
    const t = emb.length / COND, text = new Float32Array((t + 1) * COND);
    text.set(bos);
    text.set(emb, COND);
    const r = await main(new Float32Array(0), 0, text, t + 1, freshState(flowManifest, roundUp(t + 1)));
    voices.set(name, { state: r.state, steps: t + 1 });
}
/** Standard normal draws (Box–Muller). */
function normal(n, sd) {
    const x = new Float32Array(n);
    for (let i = 0; i < n; i += 2) {
        const r = Math.sqrt(-2 * Math.log(1 - Math.random())) * sd, a = 2 * Math.PI * Math.random();
        x[i] = r * Math.cos(a);
        if (i + 1 < n)
            x[i + 1] = r * Math.sin(a);
    }
    return x;
}
/** One stretch's latents (_run_flow_lm_chunk, one flow step). */
async function latentsOf(voice, c, temperature) {
    let st = widen(voice.state, roundUp(voice.steps + c.ids.length + c.maxFrames + 2));
    const te = await nets.text.run({ token_ids: new ort.Tensor('int64', BigInt64Array.from(c.ids.map(BigInt)), [1, c.ids.length]) });
    st = (await main(new Float32Array(0), 0, te['embeddings'].data, c.ids.length, st)).state;
    const out = [];
    let curr = new Float32Array(LATENT).fill(NaN), eosAt = -1;
    for (let step = 0; step < c.maxFrames; step++) {
        const r = await main(curr, 1, new Float32Array(0), 0, st);
        st = r.state;
        if (r.eos > -4 && eosAt < 0)
            eosAt = step;
        if (eosAt >= 0 && step >= eosAt + c.framesAfterEos)
            break;
        const x = temperature > 0 ? normal(LATENT, Math.sqrt(temperature)) : new Float32Array(LATENT);
        const f = await nets.flow.run({ c: f32(r.cond, [1, COND]), s: f32(new Float32Array([0]), [1, 1]), t: f32(new Float32Array([1]), [1, 1]), x: f32(x, [1, LATENT]) });
        const flow = f['flow_dir'].data;
        for (let i = 0; i < LATENT; i++)
            x[i] += flow[i];
        out.push(x);
        curr = x;
    }
    return out;
}
/** Latents → audio, 15 frames a pass (decode_latents). */
async function decode(lat) {
    let st = freshState(mimiManifest);
    const parts = [];
    for (let i = 0; i < lat.length; i += DECODE_FRAMES) {
        const k = Math.min(DECODE_FRAMES, lat.length - i), x = new Float32Array(k * LATENT);
        for (let j = 0; j < k; j++)
            x.set(lat[i + j], j * LATENT);
        const out = await nets.decoder.run({ latent: f32(x, [1, k, LATENT]), ...st });
        parts.push(out['audio_frame'].data);
        st = nextState(mimiManifest, out);
    }
    const all = new Float32Array(parts.reduce((s, p) => s + p.length, 0));
    let o = 0;
    for (const p of parts) {
        all.set(p, o);
        o += p.length;
    }
    return all;
}
let queue = Promise.resolve();
scope.onmessage = e => {
    const m = e.data;
    queue = queue.then(async () => {
        try {
            if (m.type === 'load') {
                ort = await import(`${m.ortUrl}ort.wasm.min.mjs`);
                ort.env.wasm.wasmPaths = m.ortUrl;
                ort.env.wasm.numThreads = 1;
                const bundle = JSON.parse(new TextDecoder().decode(m.files['bundle.json']));
                flowManifest = bundle.flow_lm_state_manifest;
                mimiManifest = bundle.mimi_state_manifest;
                // bos_before_voice.npy: a float32 array after its header (the 10-byte preamble and the header's own length).
                const npy = m.files['bos_before_voice.npy'], hl = new DataView(npy).getUint16(8, true);
                bos = new Float32Array(npy.slice(10 + hl));
                const make = (f) => ort.InferenceSession.create(new Uint8Array(m.files[f]));
                nets = { encoder: await make('mimi_encoder.onnx'), text: await make('text_conditioner.onnx'), main: await make('flow_lm_main_int8.onnx'), flow: await make('flow_lm_flow_int8.onnx'), decoder: await make('mimi_decoder_int8.onnx') };
                scope.postMessage({ type: 'loaded' });
            }
            else if (m.type === 'person') {
                if (m.family)
                    emotions.set(m.family, parseAveragedPerson(m.buffer));
                else
                    person = parseAveragedPerson(m.buffer);
                scope.postMessage({ type: 'personed', id: m.id });
            }
            else if (m.type === 'voice') {
                let emb = m.embedding;
                if (!emb) {
                    // A body's voice: the averaged person spoken with the body's causes (averaged-person.ts), then encoded.
                    const e = m.emotion ? emotions.get(m.emotion.family) : undefined;
                    const samples = m.samples ?? (m.body && person ? bodyRecording(person, m.body, 1, e && m.emotion ? { e, w: m.emotion.w } : undefined) : null);
                    if (!samples)
                        throw new Error('no recording and no averaged person');
                    const out = await nets.encoder.run({ audio: f32(samples, [1, 1, samples.length]) });
                    emb = Float32Array.from(out['latents'].data);
                }
                await makeVoice(m.voice, emb);
                scope.postMessage({ type: 'voiced', id: m.id, embedding: m.embedding ? undefined : emb });
            }
            else {
                const v = voices.get(m.voice);
                if (!v)
                    throw new Error(`no voice ${m.voice}`);
                const lat = [];
                for (const c of m.chunks)
                    lat.push(...await latentsOf(v, c, m.temperature));
                const audio = await decode(lat);
                scope.postMessage({ type: 'audio', id: m.id, audio }, [audio.buffer]);
            }
        }
        catch (err) {
            scope.postMessage(m.type === 'load' ? { type: 'error', error: String(err) } : { type: m.type === 'voice' ? 'voiced' : m.type === 'person' ? 'personed' : 'audio', id: m.id, error: String(err) });
        }
    });
};
