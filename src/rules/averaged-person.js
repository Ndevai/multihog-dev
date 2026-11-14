// The averaged person (the player's picks, 2026-11-12: a voice is computed from the body's causes, not chosen from recorded
// people; the movement of speech averaged over many speakers; the average made outside the extension from EARS and kept out of
// its repository, CC BY-NC 4.0). The file (voices/averaged-person.bin, made by history/review-tests/causal-voice/avg_prompt.py)
// holds 16 speakers' speech movement on one passage as WORLD features: voicing and melody (ln f0 about its own level) per 5 ms
// frame, the envelope and the aperiodicity. A body's recording is that movement spoken with the body's causes: its pitch level
// (folds), its tract (every frequency of the envelope scaled by the averaged person's tract over the body's) and its pace;
// WORLD's synthesis (world-vocoder.ts) makes the sound, which Pocket TTS then copies for every line (pocket.ts, voice-worker.ts).
import { synthesize } from './world-vocoder.js';
/** The file's parts: "RVAP", the header's length (uint32), the header (JSON), voicing (uint8 a frame), melody (float32 a frame),
 * envelope (int16 1000 × ln, envBins a frame: every second WORLD bin), aperiodicity (uint8 4 × −dB, apBins a frame: every
 * eighth); an emotion's file (header.dur), then each frame's duration (float32), its frames those of the neutral file. */
export function parseAveragedPerson(buf) {
    const b = new Uint8Array(buf);
    if (String.fromCharCode(b[0], b[1], b[2], b[3]) !== 'RVAP')
        throw new Error('not an averaged-person file');
    const hl = new DataView(buf).getUint32(4, true), header = JSON.parse(new TextDecoder().decode(b.subarray(8, 8 + hl)));
    const n = header.frames, at0 = 8 + hl, copy = (from, bytes) => buf.slice(from, from + bytes);
    const voiced = new Uint8Array(copy(at0, n)), melody = new Float32Array(copy(at0 + n, 4 * n));
    const at1 = at0 + 5 * n + 2 * n * header.envBins, env = new Int16Array(copy(at0 + 5 * n, 2 * n * header.envBins)), ap = new Uint8Array(copy(at1, n * header.apBins));
    const dur = header.dur ? new Float32Array(copy(at1 + n * header.apBins, 4 * n)) : null;
    return { fs: header.fs, framePeriodMs: header.framePeriodMs, fftSize: header.fftSize, frames: n, envBins: header.envBins, apBins: header.apBins, own: header.own, voiced, melody, env, ap, header, dur };
}
/** Frame s's envelope over WORLD's bins 0..fftSize/2 for a tract k times the averaged person's: the stored envelope (ln) read at
 * bin × k, between its stored bins; past the top, the top's. */
export function envelopeRow(p, s, k) {
    const half = p.fftSize / 2, step = half / (p.envBins - 1), row = s * p.envBins, e = new Float64Array(half + 1);
    for (let bin = 0; bin <= half; bin++) {
        const x = Math.min(p.envBins - 1, bin * k / step), j = Math.min(p.envBins - 2, Math.floor(x)), w = x - j;
        e[bin] = Math.exp(((1 - w) * p.env[row + j] + w * p.env[row + j + 1]) / 1000);
    }
    return e;
}
/** Frame s's aperiodicity over WORLD's bins, between its stored bins (stored as 4 × −dB). */
export function aperiodicityRow(p, s) {
    const half = p.fftSize / 2, step = half / (p.apBins - 1), row = s * p.apBins, a = new Float64Array(half + 1);
    for (let bin = 0; bin <= half; bin++) {
        const y = bin / step, m = Math.min(p.apBins - 2, Math.floor(y)), v = y - m;
        a[bin] = 10 ** (-((1 - v) * p.ap[row + m] + v * p.ap[row + m + 1]) / 4 / 20);
    }
    return a;
}
const pauseCache = new WeakMap();
/** The averaged person's pause frames: unvoiced, 25 dB or more under its loudest frame (the envelope's power), in a run of 30
 * frames (150 ms) or more, as the habits were measured (Praat's silence threshold, Mahr et al. 2021's pause floor). */
export function pauseFrames(p) {
    let out = pauseCache.get(p);
    if (out)
        return out;
    const db = new Float64Array(p.frames);
    for (let f = 0; f < p.frames; f++) {
        let pw = 0;
        for (let b = 0; b < p.envBins; b++)
            pw += Math.exp(2 * p.env[f * p.envBins + b] / 1000);
        db[f] = 10 * Math.log10(pw + 1e-30);
    }
    const top = Math.max(...db), quiet = (f) => !p.voiced[f] && db[f] < top - 25;
    out = new Uint8Array(p.frames);
    for (let f = 0; f < p.frames;) {
        if (!quiet(f)) {
            f++;
            continue;
        }
        let g = f;
        while (g < p.frames && quiet(g))
            g++;
        if (g - f >= 30)
            out.fill(1, f, g);
        f = g;
    }
    pauseCache.set(p, out);
    return out;
}
/** The averaged person's movement spoken by a body: frames repeated or skipped to the body's pace, the melody about the body's
 * pitch, the envelope read at f × (the body's tract ÷ the averaged person's), so a tract k times shorter puts every resonance k
 * times higher (F ∝ 1 ÷ L, a tube's resonances), the aperiodicity as it was. With a feeling (`emotion`: a family's file aligned
 * to the neutral one, and its weight w from 0 to 1), each frame is the neutral one moved w of the way to the emotion's: its
 * duration, its melody (the emotion's rise or fall from the speakers' own neutral included), its envelope (in ln), its
 * aperiodicity, its voicing (voiced past halfway). */
export function bodyRecording(p, t, seed = 1, emotion) {
    const e = emotion?.e && emotion.e.frames === p.frames ? emotion.e : null, w = e ? Math.max(0, Math.min(1, emotion.w)) : 0;
    const start = new Float64Array(p.frames + 1), pauses = t.pause != null && t.pause !== 1 ? pauseFrames(p) : null;
    for (let i = 0; i < p.frames; i++)
        start[i + 1] = start[i] + (e?.dur ? (1 - w) + w * e.dur[i] : 1) * (pauses?.[i] ? t.pause : 1);
    const stretch = p.own.sylPerS / t.sylPerS, T = Math.max(2, Math.round(start[p.frames] * stretch)), k = t.tractCm / p.own.tractCm;
    const f0 = new Float64Array(T), sp = [], ap = [];
    for (let i = 0, s = 0; i < T; i++) {
        const at = i / stretch;
        while (s < p.frames - 1 && start[s + 1] <= at)
            s++;
        const voiced = e ? (1 - w) * p.voiced[s] + w * e.voiced[s] > 0.5 : p.voiced[s] === 1, mel = e ? (1 - w) * p.melody[s] + w * e.melody[s] : p.melody[s];
        f0[i] = voiced ? Math.exp(mel * (t.span ?? 1) + Math.log(t.f0)) : 0;
        const en = envelopeRow(p, s, k), an = aperiodicityRow(p, s);
        if (e && w > 0) {
            const ee = envelopeRow(e, s, k), ae = aperiodicityRow(e, s);
            for (let b = 0; b < en.length; b++) {
                en[b] = en[b] ** (1 - w) * ee[b] ** w;
                an[b] = (1 - w) * an[b] + w * ae[b];
            }
        }
        if (voiced && t.breathDb) {
            const g = 10 ** (t.breathDb / 20);
            for (let b = 0; b < an.length; b++)
                an[b] = Math.min(0.999, an[b] * g);
        }
        sp.push(en);
        ap.push(an);
    }
    const y = synthesize(f0, sp, ap, p.fftSize, p.framePeriodMs, p.fs, Math.round(T * p.framePeriodMs * p.fs / 1000), seed);
    let peak = 0;
    for (const v of y)
        peak = Math.max(peak, Math.abs(v));
    if (peak > 0)
        for (let i = 0; i < y.length; i++)
            y[i] = y[i] * 0.9 / peak;
    return y;
}
