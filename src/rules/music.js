// The music (docs/df-body-engine.md, "The music"; the player's picks, 2026-11-11): each of the player's songs measured from its
// own samples, as a vowel is placed by its formants, and the song nearest the scene's feelings played. Voice and music carry
// emotion in one code: across 104 studies of voices and 41 of music performance, the same acoustic changes convey the same
// emotion (Juslin & Laukka 2003, Psychol Bull 129:770), faster, louder and brighter going with higher activation; and in
// music made to vary one cue at a time, mode leads listeners' judgements, then tempo, register, dynamics, articulation and
// timbre, each cue's effect adding to the others' (Eerola, Friberg & Bresin 2013, Front Psychol 4:487). Free of SillyTavern
// and of the page: tests run it on arrays of samples.
import { def, peek } from './constants.js';
import { FEELING_VA } from './data/feeling-va.js';
// Frames below this level take no part in a song's brightness (its silences and fades have no timbre to hear); a judgement, registered below.
def({ id: 'musicSilenceDbfs', value: -60, unit: 'dB of a frame\'s RMS against full scale', status: 'assumed', src: 'a frame this far under full scale is silence or the tail of a fade', range: [-70, -50], file: 'music.ts' });
// The highest pitch a song's key is read from: C7; above it the spectrum is mostly upper partials and noise (registered below). The
// lowest is where one bin of the key's frames is half a semitone wide, so a tone's neighbouring bin stays in its own pitch
// class (keyFrames).
def({ id: 'musicChromaHighHz', value: 2093, unit: 'Hz, highest pitch read for the key (C7)', status: 'assumed', src: 'above C7 the spectrum is mostly partials and noise', range: [1046.5, 4186], file: 'music.ts' });
// The number of areas a large library falls into: k = √(n ÷ this), the rule of thumb k ≈ √(n/2) for n points (four at least,
// areasOf); a rule of thumb, registered below.
def({ id: 'musicAreaDivisor', value: 2, unit: 'songs, k = √(songs ÷ this)', status: 'assumed', src: 'the rule of thumb k ≈ √(n/2) for the number of clusters of n points', range: [1, 4], file: 'music.ts' });
// The player's weighting of a scene's feelings (sceneTarget): the strongest 0.9, the newest the rest.
def({ id: 'musicStrongestWeight', value: 0.9, unit: "share of the scene's point the strongest feeling takes", status: 'assumed', src: "the player's weighting, 2026-11-11: strongest 90 %, newest 10 %", range: [0.5, 1], file: 'music.ts' });
// How much nearer another song must be to take over inside one area (chooseSong): the player's pick, 2026-11-11.
def({ id: 'musicClearSd', value: 1.5, unit: 'standard deviations of the library, nearer to the scene', status: 'assumed', src: "the player's pick, 2026-11-11 (1 also offered)", range: [0.5, 2], file: 'music.ts' });
// One song gives way to the next over this time, equal-power (index.ts); a judgement, registered below.
def({ id: 'musicCrossfadeS', value: 4, unit: 's, crossfade between two songs', status: 'assumed', src: 'long enough that no gap or jump is heard, short enough to follow a change of scene', range: [1, 8], file: 'music.ts' });
/** ITU-R BS.1770's K-weighting at a sample rate: its shelving stage and its high-pass stage, from the analog parameters
 * libebur128 uses (ebur128.c, ebur128_init_filter), which give the Recommendation's tables at 48 kHz (b0 1.53512485958697,
 * a1 −1.69065929318241; a1 −1.99004745483398, a2 0.99007225036621; tests/music.test.mjs M1). */
export function kWeighting(fs) {
    let K = Math.tan(Math.PI * 1681.974450955533 / fs), Q = 0.7071752369554196;
    const Vh = 10 ** (3.999843853973347 / 20), Vb = Vh ** 0.4996667741545416, a0 = 1 + K / Q + K * K;
    const shelf = { b: [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], a: [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0] };
    K = Math.tan(Math.PI * 38.13547087602444 / fs);
    Q = 0.5003270373238773;
    const d = 1 + K / Q + K * K;
    return [shelf, { b: [1, -2, 1], a: [1, 2 * (K * K - 1) / d, (1 - K / Q + K * K) / d] }];
}
const filtered = (x, f) => {
    const y = new Float32Array(x.length), [b0, b1, b2] = f.b, [, a1, a2] = f.a;
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < x.length; i++) {
        const v = b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1;
        x1 = x[i];
        y2 = y1;
        y1 = v;
        y[i] = v;
    }
    return y;
};
/** Integrated loudness, LUFS (ITU-R BS.1770-4): each channel K-weighted, mean squares in 400 ms blocks overlapping by 75 %,
 * blocks under −70 LUFS left out, then blocks more than 10 LU under the mean of the rest; channels weighted 1 (left and
 * right). −Infinity for silence. */
export function loudness(channels, fs) {
    const [s1, s2] = kWeighting(fs), w = channels.map(c => filtered(filtered(c, s1), s2));
    const size = Math.round(0.4 * fs), step = Math.round(0.1 * fs), n = w[0]?.length ?? 0;
    const blocks = [];
    for (let at = 0; at + size <= n; at += step) {
        let z = 0;
        for (const c of w) {
            let s = 0;
            for (let i = at; i < at + size; i++)
                s += c[i] * c[i];
            z += s / size;
        }
        blocks.push(z);
    }
    const lufs = (z) => -0.691 + 10 * Math.log10(z);
    const mean = (zs) => zs.reduce((s, z) => s + z, 0) / zs.length;
    const loud = blocks.filter(z => lufs(z) > -70);
    if (!loud.length)
        return -Infinity;
    const gate = lufs(mean(loud)) - 10, kept = loud.filter(z => lufs(z) > gate);
    return lufs(mean(kept));
}
// ------------------------------------------------------------------------------------------------------------- spectrum
const FRAME = 2048, HOP = 512;
/** The key's frames: 16384 samples every 8192, so at 44.1 kHz a bin is 2.7 Hz wide and pitch classes stay apart down to
 * (bin width) ÷ (2^(1/24) − 1) = 92 Hz (100 Hz at 48 kHz); a Hann window's neighbouring bin holds a quarter of a tone's
 * energy (−6 dB), the next none. */
export const KEY_FRAME = 16384;
export const chromaLowHz = (fs) => fs / KEY_FRAME / (2 ** (1 / 24) - 1);
/** In-place radix-2 FFT of a power-of-two length (Cooley & Tukey 1965). */
export function fft(re, im) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
        let bit = n >> 1;
        for (; j & bit; bit >>= 1)
            j ^= bit;
        j ^= bit;
        if (i < j) {
            [re[i], re[j]] = [re[j], re[i]];
            [im[i], im[j]] = [im[j], im[i]];
        }
    }
    for (let len = 2; len <= n; len <<= 1) {
        const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
        for (let i = 0; i < n; i += len) {
            let cr = 1, ci = 0;
            for (let k = 0; k < len / 2; k++) {
                const ar = re[i + k], ai = im[i + k], br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
                re[i + k] = ar + br;
                im[i + k] = ai + bi;
                re[i + k + len / 2] = ar - br;
                im[i + k + len / 2] = ai - bi;
                [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
            }
        }
    }
}
/** Krumhansl & Kessler's (1982, Psychol Rev 89:334) probe-tone ratings of the twelve pitch classes from the tonic, in a major
 * and a minor key, as music21 lists them (analysis/discrete.py, KrumhanslSchmuckler). */
export const KK = { major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], minor: [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17] };
const PITCH = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const pearson = (x, y) => {
    const mx = x.reduce((s, v) => s + v, 0) / x.length, my = y.reduce((s, v) => s + v, 0) / y.length;
    let sxy = 0, sxx = 0, syy = 0;
    x.forEach((v, i) => { sxy += (v - mx) * (y[i] - my); sxx += (v - mx) ** 2; syy += (y[i] - my) ** 2; });
    return sxx && syy ? sxy / Math.sqrt(sxx * syy) : 0;
};
/** A song's key by the Krumhansl–Schmuckler method: its pitch-class profile against the 24 rotated key profiles, the best
 * correlation taken; its majorness, the best major key's correlation less the best minor key's (above 0: major). */
export function keyOf(chroma) {
    let best = { r: -2, tonic: 0, mode: 'major' }, major = -2, minor = -2;
    for (const mode of ['major', 'minor'])
        for (let t = 0; t < 12; t++) {
            const r = pearson(chroma, KK[mode].map((_, i) => KK[mode][(i - t + 12) % 12]));
            if (mode === 'major')
                major = Math.max(major, r);
            else
                minor = Math.max(minor, r);
            if (r > best.r)
                best = { r, tonic: t, mode };
        }
    return { key: `${PITCH[best.tonic]} ${best.mode}`, mode: best.mode, majorness: Math.round((major - minor) * 1000) / 1000 };
}
/** Tempo, beats per minute, from an onset envelope (one value per hop of `hopS` seconds): its autocorrelation over the whole
 * song, the period chosen as librosa chooses it (McFee et al. 2015, feature/rhythm.py tempo, after Ellis 2007, J New Music
 * Res 36:51): log(1 + 10⁶ × the autocorrelation) plus a log-normal prior centred on 120 BPM, one octave of standard
 * deviation, up to 320 BPM; refined between lags by the parabola through the peak and its neighbours. */
export function tempoOf(env, hopS) {
    const n = env.length, mean = env.reduce((s, v) => s + v, 0) / Math.max(1, n), x = env.map(v => v - mean);
    const ac0 = x.reduce((s, v) => s + v * v, 0) || 1;
    const lo = Math.max(1, Math.floor(60 / (320 * hopS))), hi = Math.min(n - 1, Math.ceil(60 / (30 * hopS)));
    const score = (lag) => {
        let s = 0;
        for (let i = 0; i + lag < n; i++)
            s += x[i] * x[i + lag];
        const bpm = 60 / (lag * hopS);
        return Math.log1p(1e6 * Math.max(0, s / ac0)) - 0.5 * (Math.log2(bpm) - Math.log2(120)) ** 2;
    };
    let bestLag = lo, best = -Infinity;
    const scores = new Map();
    for (let lag = lo; lag <= hi; lag++) {
        const s = score(lag);
        scores.set(lag, s);
        if (s > best) {
            best = s;
            bestLag = lag;
        }
    }
    const l = scores.get(bestLag - 1), r = scores.get(bestLag + 1);
    const shift = l != null && r != null && l - 2 * best + r < 0 ? 0.5 * (l - r) / (l - 2 * best + r) : 0;
    return 60 / ((bestLag + shift) * hopS);
}
/** The onset envelope's rate for the tempo: 250 Hz, as Ellis 2007 computes it (and Ellis & Poliner 2007). A frame of the
 * spectrum every 512 samples is 11.6 ms at 44.1 kHz and 23.2 ms at 22.05 kHz, so a beat that falls between two frames splits
 * its peak over two lags and the double period can win; the envelope read between frames (linear interpolation) places
 * each beat to 4 ms. */
const ENV_S = 0.004;
export function at250(env, hopS) {
    const out = [];
    for (let t = 0; t <= (env.length - 1) * hopS; t += ENV_S) {
        const x = t / hopS, i = Math.floor(x), f = x - i;
        out.push(env[i] * (1 - f) + (env[i + 1] ?? env[i]) * f);
    }
    return out;
}
/** A song measured from its samples (the channels as decoded, at their rate): its integrated loudness (BS.1770), its tempo
 * (tempoOf, over an onset envelope of rectified rises in log power, as librosa's onset strength, in frames of 2048 samples
 * every 512, read at 250 Hz: at250), its brightness (the spectral centroid, Σ f·|X| ÷ Σ |X|, the median over frames above musicSilenceDbfs; brightness
 * follows the centroid: Grey & Gordon 1978, JASA 63:1493; Schubert & Wolfe 2006, Acta Acust 92:820) and its key (keyOf,
 * over the magnitudes from chromaLowHz to C7 summed by pitch class in KEY_FRAME frames, A4 at 440 Hz). `pause` lets the page draw between stretches. */
export async function measureSong(channels, fs, pause = async () => { }) {
    const n = channels[0]?.length ?? 0, mono = new Float32Array(n);
    for (const c of channels)
        for (let i = 0; i < n; i++)
            mono[i] = mono[i] + c[i] / channels.length;
    const hann = Float64Array.from({ length: FRAME }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (FRAME - 1)));
    const re = new Float64Array(FRAME), im = new Float64Array(FRAME), half = FRAME / 2;
    const centroids = [], env = [];
    let prev = null;
    for (let at = 0, frame = 0; at + FRAME <= n; at += HOP, frame++) {
        let sq = 0;
        for (let i = 0; i < FRAME; i++) {
            const v = mono[at + i];
            sq += v * v;
            re[i] = v * hann[i];
            im[i] = 0;
        }
        fft(re, im);
        const power = new Float64Array(half + 1);
        let num = 0, den = 0, rise = 0;
        for (let k = 0; k <= half; k++) {
            const m = Math.hypot(re[k], im[k]);
            power[k] = 10 * Math.log10(m * m + 1e-10);
            if (k) {
                num += k * fs / FRAME * m;
                den += m;
            }
            if (prev)
                rise += Math.max(0, power[k] - prev[k]);
        }
        env.push(prev ? rise / (half + 1) : 0);
        prev = power;
        if (10 * Math.log10(sq / FRAME + 1e-20) > peek('musicSilenceDbfs') && den > 0)
            centroids.push(num / den);
        if (frame % 2000 === 1999)
            await pause();
    }
    centroids.sort((a, b) => a - b);
    // The key from its own longer frames (KEY_FRAME): each bin's magnitude added to its pitch class.
    const kr = new Float64Array(KEY_FRAME), ki = new Float64Array(KEY_FRAME), kh = Float64Array.from({ length: KEY_FRAME }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (KEY_FRAME - 1)));
    const lowBin = Math.ceil(chromaLowHz(fs) * KEY_FRAME / fs), highBin = Math.min(KEY_FRAME / 2, Math.floor(peek('musicChromaHighHz') * KEY_FRAME / fs));
    const chroma = new Array(12).fill(0);
    for (let at = 0, frame = 0; at + KEY_FRAME <= n; at += KEY_FRAME / 2, frame++) {
        for (let i = 0; i < KEY_FRAME; i++) {
            kr[i] = mono[at + i] * kh[i];
            ki[i] = 0;
        }
        fft(kr, ki);
        for (let b = lowBin; b <= highBin; b++)
            chroma[((Math.round(69 + 12 * Math.log2(b * fs / KEY_FRAME / 440)) % 12) + 12) % 12] += Math.hypot(kr[b], ki[b]);
        if (frame % 100 === 99)
            await pause();
    }
    const k = keyOf(chroma);
    return { lufs: Math.round(loudness(channels, fs) * 10) / 10, bpm: Math.round(tempoOf(at250(env, HOP / fs), ENV_S) * 10) / 10,
        centroidHz: Math.round(centroids[Math.floor(centroids.length / 2)] ?? 0), key: k.key, majorness: k.majorness, seconds: Math.round(n / fs) };
}
const zs = (xs) => {
    const m = xs.reduce((s, x) => s + x, 0) / Math.max(1, xs.length), sd = Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, xs.length));
    return xs.map(x => sd > 0 ? (x - m) / sd : 0);
};
/** Each song's point, against the player's own library (as a voice's marks are measured against the speaker's own speech):
 * arousal from its tempo (log2 BPM, as tempo is heard in ratios), its loudness (LUFS) and its brightness (log2 of the
 * centroid), taken equally [ASSUMED weights], the common code's activation cues; valence from its majorness, the cue that
 * leads happy against sad. Each axis in standard deviations of the library. */
export function songPoints(songs) {
    const t = zs(songs.map(s => Math.log2(Math.max(1, s.bpm)))), l = zs(songs.map(s => Number.isFinite(s.lufs) ? s.lufs : -70)), b = zs(songs.map(s => Math.log2(Math.max(1, s.centroidHz))));
    const a = zs(songs.map((_, i) => (t[i] + l[i] + b[i]) / 3)), v = zs(songs.map(s => s.majorness));
    return songs.map((_, i) => ({ v: v[i], a: a[i] }));
}
/** A feeling's point (data/feeling-va.ts, Warriner et al. 2013), in standard deviations of all the feelings the table holds,
 * so a feeling stands among feelings as a song among songs; null for a feeling the table lacks. A voice mark's feeling is
 * read as `voice:anger`, an appraised one by its OCC type. */
const ALL = Object.values(FEELING_VA), FV = zs(ALL.map(f => f.v)), FA = zs(ALL.map(f => f.a)), KEYS = Object.keys(FEELING_VA);
export function feelingPoint(type) {
    const i = KEYS.indexOf(type);
    return i < 0 ? null : { v: FV[i], a: FA[i] };
}
/** The scene's point (the player's weighting, 2026-11-11): the strongest feeling, the one farthest from the middle, weighs
 * musicStrongestWeight (0.9) and the newest, the one recorded in the latest turn, the rest (the strongest of them when
 * several share it); the strongest one's holder names the set that applies. Null when no feeling the table holds is in
 * the scene. */
export function sceneTarget(feelings) {
    const ps = feelings.flatMap(f => { const p = feelingPoint(f.type); return p ? [{ ...f, p, d: Math.hypot(p.v, p.a), t: f.turn ?? 0 }] : []; });
    if (!ps.length)
        return null;
    const strongest = ps.reduce((m, f) => f.d > m.d ? f : m), last = Math.max(...ps.map(f => f.t));
    const newest = ps.filter(f => f.t === last).reduce((m, f) => f.d > m.d ? f : m), w = peek('musicStrongestWeight');
    return { at: { v: w * strongest.p.v + (1 - w) * newest.p.v, a: w * strongest.p.a + (1 - w) * newest.p.a }, who: strongest.who };
}
/** The areas a library falls into, as vowels fall into regions of formant space: k centres, four at least (the two axes'
 * four quarters, as the vowel chart's close and open, front and back; Russell 1980's quadrants) or √(n ÷ musicAreaDivisor)
 * where that is more, and never more than the songs, chosen
 * farthest-first from the song nearest the middle (Gonzalez 1985, Theor Comput Sci 38:293), then moved to their songs' mean
 * until no song changes area (Lloyd 1982, IEEE Trans Inf Theory 28:129). An area index per song. */
export function areasOf(points) {
    const n = points.length;
    if (!n)
        return [];
    const k = Math.min(n, Math.max(4, Math.round(Math.sqrt(n / peek('musicAreaDivisor')))));
    const d = (p, q) => Math.hypot(p.v - q.v, p.a - q.a);
    const first = points.reduce((m, p, i) => Math.hypot(p.v, p.a) < Math.hypot(points[m].v, points[m].a) ? i : m, 0);
    const centres = [points[first]];
    while (centres.length < k)
        centres.push(points.reduce((m, p) => Math.min(...centres.map(c => d(p, c))) > Math.min(...centres.map(c => d(m, c))) ? p : m));
    let area = points.map(() => -1);
    for (let it = 0; it < 100; it++) {
        const next = points.map(p => centres.reduce((m, c, j) => d(p, c) < d(p, centres[m]) ? j : m, 0));
        if (next.every((x, i) => x === area[i]))
            break;
        area = next;
        centres.forEach((_, j) => { const in_ = points.filter((_, i) => area[i] === j); if (in_.length)
            centres[j] = { v: in_.reduce((s, p) => s + p.v, 0) / in_.length, a: in_.reduce((s, p) => s + p.a, 0) / in_.length }; });
    }
    return area;
}
/** An area's name until the player gives one: its middle in words, by terciles of a standard normal axis (±0.43): calm,
 * moderate or intense; minor, mixed or major. */
export function areaWords(points) {
    const v = points.reduce((s, p) => s + p.v, 0) / points.length, a = points.reduce((s, p) => s + p.a, 0) / points.length, t = 0.4307;
    return `${a > t ? 'intense' : a < -t ? 'calm' : 'moderate'}, ${v > t ? 'major' : v < -t ? 'minor' : 'mixed'}`;
}
/** The song to play. IF a song's set names the one whose feeling leads the scene → THEN the songs of that set (a character's
 * theme, the player's own category); ELSE IF a set's name stands in the name of the place the player's character is at →
 * THEN that set (a place's theme); ELSE the songs in no set, ELSE all. Of those, the one nearest the scene's point (the
 * middle when no feeling is in it and nothing plays). The song playing gives way (the player's picks, 2026-11-11) when the
 * nearest one lies in another area, or when the nearest one is musicClearSd (1.5) standard deviations nearer to the scene
 * than it; else it stays, so the music changes when the scene moves, not at every line. Null without songs. */
export function chooseSong(o) {
    const all = o.points.map((_, i) => i), set = (s) => s.trim().toLowerCase(), place = set(o.place ?? '');
    const byWho = o.target ? all.filter(i => set(o.sets[i] ?? '') && set(o.sets[i]) === set(o.target.who)) : [];
    const named = byWho.length ? byWho : place ? all.filter(i => set(o.sets[i] ?? '') && place.includes(set(o.sets[i]))) : [];
    const free = all.filter(i => !set(o.sets[i] ?? ''));
    const pool = named.length ? named : free.length ? free : all;
    if (!pool.length)
        return null;
    // No feeling in the scene: what plays goes on.
    if (!o.target && o.current != null && pool.includes(o.current))
        return o.current;
    const at = o.target?.at ?? { v: 0, a: 0 };
    const near = pool.reduce((m, i) => Math.hypot(o.points[i].v - at.v, o.points[i].a - at.a) < Math.hypot(o.points[m].v - at.v, o.points[m].a - at.a) ? i : m);
    if (o.current == null || !pool.includes(o.current))
        return near;
    const gain = Math.hypot(o.points[o.current].v - at.v, o.points[o.current].a - at.a) - Math.hypot(o.points[near].v - at.v, o.points[near].a - at.a);
    return o.areas[o.current] !== o.areas[near] || gain >= peek('musicClearSd') ? near : o.current;
}
