// The natural voice (the player's picks, 2026-11-12): Pocket TTS (Kyutai 2026, 100M parameters, the ONNX export
// KevinAHM/pocket-tts-onnx, CC BY 4.0) speaks a said stretch in a voice computed from the speaker's body: the averaged person
// (averaged-person.ts: 16 speakers' movement of speech) reshaped to the body's pitch, tract and pace, then copied. The networks
// run in the worker (voice-worker.ts); this file holds what they need around them: the text's tokens, the stretches the model
// takes at once, a recording's samples at 24 kHz, the body's target.
import { POCKET_PIECES } from './data/pocket-tokenizer.js';
import { MEASURED } from './voice-sound.js';
import { def, peek } from './constants.js';

// ------------------------------------------------------------------------------------------------------------ the text
// SentencePiece's unigram tokenizer (Kudo 2018), as the model's own (identity normalizer, a "▁" before the text and for each
// space, byte fallback): the split of the text into pieces with the greatest summed log probability; a character no piece
// covers costs the least piece score less 10 (SentencePiece's kUnkPenalty) and becomes its UTF-8 bytes.
const PIECE_ID = new Map<string, number>(), BYTE_ID = new Map<number, number>();
let MAX_PIECE = 1, MIN_SCORE = 0;
POCKET_PIECES.forEach(([p, score, type], id) => {
    if (type === 1) { PIECE_ID.set(p, id); MAX_PIECE = Math.max(MAX_PIECE, [...p].length); MIN_SCORE = Math.min(MIN_SCORE, score); }
    else if (type === 6) BYTE_ID.set(parseInt(p.slice(3, 5), 16), id);
});
/** The model's token ids for a text. */
export function pocketTokens(text: string): number[] {
    const cs = [...('▁' + text.replace(/ /g, '▁'))], n = cs.length, unk = MIN_SCORE - 10;
    const best = new Array<number>(n + 1).fill(-Infinity), from = new Array<number>(n + 1).fill(-1), piece = new Array<number>(n + 1).fill(-1);
    best[0] = 0;
    for (let i = 0; i < n; i++) {
        if (best[i] === -Infinity) continue;
        let single = false;
        for (let len = 1, s = ''; len <= MAX_PIECE && i + len <= n; len++) {
            s += cs[i + len - 1];
            const id = PIECE_ID.get(s);
            if (id === undefined) continue;
            if (len === 1) single = true;
            const sc = best[i]! + POCKET_PIECES[id]![1];
            if (sc > best[i + len]!) { best[i + len] = sc; from[i + len] = i; piece[i + len] = id; }
        }
        if (!single && best[i]! + unk > best[i + 1]!) { best[i + 1] = best[i]! + unk; from[i + 1] = i; piece[i + 1] = -1; }
    }
    const out: number[][] = [];
    for (let j = n; j > 0; j = from[j]!) {
        const id = piece[j]!;
        out.push(id >= 0 ? [id] : [...new TextEncoder().encode(cs[j - 1]!)].map(b => BYTE_ID.get(b) ?? 0));
    }
    return out.reverse().flat();
}
/** The text as the model is given it (pocket_tts_onnx.py _prepare_text_prompt): one line, a capital first, a full stop when it
 * ends in a letter or digit; and the frames it speaks on after its end-of-speech signal (3 for four words or fewer, else 1,
 * plus 2). */
export function pocketPrepare(text: string): { text: string; framesAfterEos: number } {
    let t = text.trim().replace(/[\n\r]/g, ' ').replace(/ {2}/g, ' ');
    if (!t) return { text: '', framesAfterEos: 0 };
    const words = t.split(/\s+/).length;
    t = t[0]!.toUpperCase() + t.slice(1);
    if (/[\p{L}\p{N}]$/u.test(t)) t += '.';
    return { text: t, framesAfterEos: (words <= 4 ? 3 : 1) + 2 };
}
/** The stretches the model says at once (_split_into_best_sentences): sentences, each split at , ; : when it passes 50 tokens,
 * joined again while they stay within 50. */
export function pocketChunks(text: string, maxTokens = 50): string[] {
    const t = pocketPrepare(text).text;
    if (!t) return [];
    const sentences = t.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*\s*|$)/g)?.map(s => s.trim()).filter(Boolean) ?? [t];
    const parts: [number, string][] = [];
    for (const s of sentences) {
        const n = pocketTokens(s).length;
        if (n <= maxTokens) { parts.push([n, s]); continue; }
        const subs = s.match(/[^,;:]+(?:[,;:]+\s*|$)/g)?.map(x => x.trim()).filter(Boolean) ?? [s];
        for (const x of subs.length > 1 ? subs : [s]) parts.push([pocketTokens(x).length, x]);
    }
    const out: string[] = [];
    let cur = '', count = 0;
    for (const [n, s] of parts) {
        if (cur && count + n > maxTokens) { out.push(cur); cur = s; count = n; }
        else { cur = cur ? `${cur} ${s}` : s; count += n; }
    }
    if (cur) out.push(cur);
    return out;
}
/** The frames a stretch may run to (_estimate_max_gen_len): 3 tokens a second, 2 s more, at 12.5 frames a second. */
export const pocketMaxFrames = (tokens: number) => Math.ceil((tokens / 3 + 2) * 12.5);

// ------------------------------------------------------------------------------------------------------- the body's target
// The engine's voices are on Hillenbrand et al.'s scale (isolated words: the mean man 130.9 Hz and 17.79 cm, the mean woman
// 220.1 Hz and 15.80 cm; voice-sound.ts MEASURED); free speech is lower (EARS's native English speakers as Pocket TTS copies
// them, 37 men and 56 women: medians 105.4 Hz and 18.92 cm, 171.5 Hz and 16.78 cm, measured in Praat). A computed voice is put
// on that scale by the line through the two sexes' means (ln f0 and tract; derived). The pitch is then raised to connected
// speech's register (speechRegister: the player heard the woman at 200 Hz as more natural than at 172; adult women's connected
// speech near 200 Hz against EARS's relaxed monologues at 172, a general benchmark [ASSUMED]).
export const EARS_MEDIANS = { male: { f0: 105.4, tract: 18.92 }, female: { f0: 171.5, tract: 16.78 } } as const;
def({ id: 'speechRegister', value: 1.16, unit: "× free speech's pitch, for connected speech", status: 'assumed', src: "adult women's connected speech near 200 Hz against EARS's monologues at 172 (200 ÷ 172); the player's ear preferred it", range: [1, 1.25], file: 'pocket.ts' });
const lnLine = (x: number, x0: number, x1: number, y0: number, y1: number) => y0 + (x - x0) * (y1 - y0) / (x1 - x0);
/** A computed pitch (Hz) and tract (cm) on free speech's scale. */
export function onCopiesScale(f0Hz: number, tractCm: number): { f0: number; tract: number } {
    const m = MEASURED.male, w = MEASURED.female, em = EARS_MEDIANS.male, ew = EARS_MEDIANS.female;
    return { f0: Math.exp(lnLine(Math.log(f0Hz), Math.log(m.f0Hz), Math.log(w.f0Hz), Math.log(em.f0), Math.log(ew.f0))), tract: lnLine(tractCm, m.tractCm, w.tractCm, em.tract, ew.tract) };
}
/** What the averaged person is reshaped to for a body (averaged-person.ts): its pitch in connected speech, its tract, its pace. */
export function bodyTarget(f0Hz: number, tractCm: number, sylPerS: number): { f0: number; tractCm: number; sylPerS: number } {
    const c = onCopiesScale(f0Hz, tractCm);
    return { f0: Math.round(c.f0 * peek('speechRegister') * 10) / 10, tractCm: Math.round(c.tract * 100) / 100, sylPerS: Math.round(sylPerS * 100) / 100 };
}
// ------------------------------------------------------------------------------------------------------------ the habits
// Speaking habits that differ between people of the same body and feeling, measured on one minute from each of two free
// monologues of 96 native English EARS speakers (history/review-tests/causal-voice/habits2.py): melody range (Praat, 5-95 %,
// semitones), the share of time in pauses (150 ms or more, Mahr et al. 2021's floor), breathiness (WORLD's aperiodicity, 500-3000 Hz, voiced).
// A person's habit is the mean of their two minutes; the spread between people is with the two minutes' disagreement taken
// out (var(true) = var(mean) - var(difference) / 4), within each sex. Filled from the measurement: HABITS.
// Measured (n = 38 men, 58 women): melody range men 8.31 (SD between people 1.31; raw 1.54, noise 0.81, the two minutes r 0.58),
// women 8.96 (2.35; r 0.70); pause share men 0.393 (0.071; r 0.49), women 0.417 (0.098; r 0.63); breathiness men -28.5 dB
// (1.03; r 0.89), women -30.0 (1.03; r 0.82). The habits are nearly independent of each other (|r| 0.19 at most, within sex)
// and of height and age (|r| 0.12 at most), so they are drawn apart. Pauses by Praat's silence finder (To TextGrid
// (silences), -25 dB under the loudest point, its default, as De Jong & Wempe 2009 take it; 0.15 s or more).
export const HABITS = {
    male: { span: { mean: 8.31, sd: 1.31 }, pause: { mean: 0.393, sd: 0.071 }, breath: { mean: -28.5, sd: 1.03 } },
    female: { span: { mean: 8.96, sd: 2.35 }, pause: { mean: 0.417, sd: 0.098 }, breath: { mean: -30.0, sd: 1.03 } },
} as const;
/** A person's habits from their draws (standard normal, against people of their sex): the melody range as a factor of the
 * averaged person's, the time in pauses as a factor (the odds of the person's pause share over the odds of their sex's mean),
 * and the breathiness as a shift (dB). An unknown sex takes the two sexes' mean. */
export function habitsOf(sex: string | undefined, spanZ = 0, pauseZ = 0, breathZ = 0): { span: number; pause: number; breathDb: number } {
    const m = /^m/i.test(sex ?? ''), f = /^(f|w)/i.test(sex ?? ''), pick = (k: keyof typeof HABITS.male) => m ? HABITS.male[k] : f ? HABITS.female[k] : { mean: (HABITS.male[k].mean + HABITS.female[k].mean) / 2, sd: (HABITS.male[k].sd + HABITS.female[k].sd) / 2 };
    const sp = pick('span'), pa = pick('pause'), br = pick('breath'), odds = (p: number) => p / (1 - p);
    const share = Math.min(0.6, Math.max(0.01, pa.mean + pa.sd * pauseZ));
    return { span: Math.round(Math.max(0.3, 1 + spanZ * sp.sd / sp.mean) * 100) / 100, pause: Math.round(odds(share) / odds(pa.mean) * 100) / 100, breathDb: Math.round(br.sd * breathZ * 10) / 10 };
}

/** The networks and their settings: the export's English bundle (english_2026-04) at a fixed revision, int8 where it exists
 * (163 MB in all), 24 kHz, temperature 0.7 (the export's default). */
export const POCKET_MODEL = {
    base: 'https://huggingface.co/KevinAHM/pocket-tts-onnx/resolve/58a6d00cf13d239b6748cb0769f35c580a8f606c/onnx/english_2026-04/',
    files: ['bundle.json', 'bos_before_voice.npy', 'mimi_encoder.onnx', 'text_conditioner.onnx', 'flow_lm_main_int8.onnx', 'flow_lm_flow_int8.onnx', 'mimi_decoder_int8.onnx'],
    megabytes: 165, sampleRate: 24000, temperature: 0.7,
} as const;
/** The words the model is given for a said stretch: its quotation marks taken out (a mark the model would read as text). */
const DOUBLE_ROOTS = /^(?:too|see|boo|coo|moo|woo|zoo|wee|bee|fee|free|tree|three|good|cool|fool|pool|room|soon|moon|look|book|took|feel|keep|deep|sleep|need|seem|week|meet|feet|sweet|street|green|queen|screen|speed|cheer|deer|beer|peer|steer|door|floor|poor|blood|flood|food|mood|wood|foot|root|boot|shoot|proof|roof|smooth|tooth|loose|choose|goose|moose|off|all|call|fall|tall|wall|small|ball|hall|bell|fell|sell|tell|well|yell|hell|shell|smell|spell|swell|ill|bill|fill|hill|kill|mill|pill|skill|still|will|chill|drill|grill|spill|thrill|doll|roll|full|pull|bull|dull|skull|add|odd|egg|err|inn|ebb|buzz|fizz|fuzz|jazz|pass|lass|mass|grass|class|glass|brass|less|mess|bless|dress|press|stress|kiss|miss|hiss|boss|loss|toss|cross|gloss|fuss|plus)$/i;
export const spokenText = (text: string) => text
    .replace(/["“”«»„]/g, '')
    .replace(/\b([\p{L}]+)\b/gu, w => w.replace(/([\p{L}])\1{2,}/gu, (run, ch) => {
        const stem = w.slice(0, w.indexOf(run)) + ch + ch;
        const maxLen = DOUBLE_ROOTS.test(stem) ? 4 : 3;
        return ch.repeat(Math.min(run.length, maxLen));
    }))
    .replace(/\s+/g, ' ')
    .trim();
/** A said stretch as the worker takes it: each part's token ids, frames after its end and frame limit. */
export const pocketJob = (text: string) => pocketChunks(spokenText(text)).map(c => {
    const p = pocketPrepare(c), ids = pocketTokens(p.text);
    return { ids, framesAfterEos: p.framesAfterEos, maxFrames: pocketMaxFrames(ids.length) };
});

// ------------------------------------------------------------------------------------------------- the model's memory
/** The language model with its attention memory's length left free: the export declares its state inputs and outputs
 * [2, 1, 1000, 16, 64], and onnxruntime refuses any other length. In the ONNX file (protobuf: ModelProto field 7 the graph,
 * GraphProto fields 11 and 12 its inputs and outputs, each a ValueInfoProto named by field 1) the length is a dimension
 * written 03 08 E8 07 (3 bytes: dim_value 1000); 03 12 01 63 (dim_param "c") is as long, so the named inputs' and outputs'
 * bytes are patched in place and nothing else moves. Returns the number of dimensions freed. */
export function freeCacheLength(model: Uint8Array, names: string[]): number {
    const want = new Set(names);
    const varint = (p: number): [number, number] => { let v = 0, m = 1; for (;;) { const b = model[p++]!; v += (b & 0x7f) * m; m *= 128; if (b < 0x80) return [v, p]; } };
    /** Each field of the message in [from, to): its number, wire type and (for length-delimited fields) its bytes' range. */
    function* fields(from: number, to: number): Generator<[number, number, number, number]> {
        for (let p = from; p < to;) {
            const [key, q] = varint(p), f = Math.floor(key / 8), w = key & 7;
            if (w === 0) { p = varint(q)[1]; continue; }
            if (w === 1) { p = q + 8; continue; }
            if (w === 5) { p = q + 4; continue; }
            if (w !== 2) throw new Error(`wire type ${w}`);
            const [len, r] = varint(q);
            yield [f, w, r, r + len]; p = r + len;
        }
    }
    let n = 0;
    for (const [f, , gs, ge] of fields(0, model.length)) {
        if (f !== 7) continue;
        for (const [g, , vs, ve] of fields(gs, ge)) {
            if (g !== 11 && g !== 12) continue;
            let named = false;
            for (const [h, , s, e] of fields(vs, ve)) if (h === 1) named = want.has(new TextDecoder().decode(model.subarray(s, e)));
            if (!named) continue;
            for (let k = vs; k + 3 < ve; k++)
                if (model[k] === 0x03 && model[k + 1] === 0x08 && model[k + 2] === 0xe8 && model[k + 3] === 0x07) { model[k + 1] = 0x12; model[k + 2] = 0x01; model[k + 3] = 0x63; n++; }
        }
    }
    return n;
}
