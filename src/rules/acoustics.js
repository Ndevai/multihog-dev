// Speech and sound reaching a listener (docs/df-body-engine.md §4.3). Speech Intelligibility Index, ANSI/ASA S3.5-1997
// octave-band procedure, constants from Table 4 as packaged in the R package SII (Warnes & Shaver, CRAN): band centre, band
// width (10 log Hz), importance, speech spectrum levels at 1 m by vocal effort, reference internal noise.
const BANDS = [250, 500, 1000, 2000, 4000, 8000];
const DELTA = [22.48, 25.48, 28.48, 31.48, 34.48, 37.48];
const IMPORTANCE = [0.0617, 0.1671, 0.2373, 0.2648, 0.2142, 0.0549];
export const SPEECH = {
    normal: [34.75, 34.27, 25.01, 17.32, 9.33, 1.13], raised: [38.98, 40.15, 33.86, 25.32, 16.78, 5.07],
    loud: [41.55, 44.85, 42.16, 34.39, 25.41, 11.39], shout: [42.50, 49.24, 51.31, 44.32, 34.41, 20.72],
};
export const SPEECH_SPL = { normal: 62.35, raised: 68.34, loud: 74.85, shout: 82.30 };
const XI = [-3.9, -9.7, -12.5, -17.7, -25.9, -7.1];
// Air absorption, dB/km, 10 °C and 70 % humidity (ISO 9613-2, Table 2).
const AIR = [1.0, 1.9, 3.7, 9.7, 32.8, 117];
// Background noise at the listener, overall dB SPL (Wikipedia, Sound pressure: examples), spread evenly over the six octaves
// (pink noise) [ASSUMED shape].
// Labels name a loudness class, with the measured example in parentheses.
export const NOISE = { 'silent night': 10, 'quiet room': 25, 'conversation nearby': 50, 'busy street (traffic)': 67.5,
    'loud room (television)': 75, 'loud machine nearby (vacuum cleaner)': 85, 'pounding work close by (jackhammer)': 100 };
// Sound sources, overall dB SPL at 1 m: Wikipedia "Sound pressure" examples (.30-06 rifle 171 at 1 m; jet engine 150 at 1 m;
// jackhammer 100 at 1 m; normal conversation 40–60 at 1 m → 50; vacuum cleaner 85 at 1.8 m → 90; passenger car at 30 km/h
// 65–70 at 10 m → 87.5); footsteps on gravel or sand about 60–62 dBA at the walker's ear (Larsson et al. 2015, Noise Health
// 17:227, citing earlier recordings), ear about 1.5 m from the feet → 64 at 1 m [ASSUMED distance].
export const SOUNDS = { 'gunshot (rifle)': 171, 'deafening roar (jet engine)': 150, 'loud pounding (jackhammer)': 100,
    'loud drone (vacuum cleaner)': 90, 'passing vehicle (car at 30 km/h)': 87.5, 'footsteps on gravel or sand': 64, 'quiet conversation': 50 };
// Walls and doors: field mass law, TL = 20 log10(m f) − 47 dB, m surface mass kg/m² (e.g. Long, Architectural Acoustics);
// surface masses from material density × thickness [ASSUMED values].
export const BARRIER = { none: 0, 'curtain or tent': 1, 'wooden door': 20, 'plaster wall': 25, 'brick wall': 200, 'stone wall': 500 };
const massLaw = (m, f) => m ? Math.max(0, 20 * Math.log10(m * f) - 47) : 0;
/** Octave-band levels (dB spectrum level) of a sound of `effort` (or overall `spl` at 1 m, pink) after distance and barrier. */
function arriving({ effort, spl, distance, barrier }) {
    const d = Math.max(1, distance);
    const src = effort ? SPEECH[effort] : BANDS.map((_, i) => (spl ?? 0) - 10 * Math.log10(6) - DELTA[i]);
    return src.map((e, i) => e - 20 * Math.log10(d) - AIR[i] * d / 1000 - massLaw(BARRIER[barrier] ?? 0, BANDS[i]));
}
/**
 * What reaches a listener: { sii, words (share of key words understood in sentences with context: logistic link
 * p = 1 ÷ (1 + e^(−0.29 (30 SII − 15 + 2.70))), SPIN-High fit of 30 normal-hearing listeners, Shen & Kern 2018, Trends Hear
 * 22:2331216518761773), audible (speech or
 * sound peaks, 15 dB above the band average, exceed the disturbance in at least one band) }. shift: listener threshold above
 * normal human hearing, dB; deaf: band indices the listener cannot hear.
 */
export function reach({ effort = 'normal', spl = null, distance = 1, barrier = 'none', noise = 'quiet room', noiseDb = null, shift = 0, deaf = [] }) {
    const e = arriving({ effort: spl == null ? effort : null, spl, distance, barrier });
    const nDb = noiseDb ?? NOISE[noise] ?? 25;
    const n = BANDS.map((_, i) => nDb - 10 * Math.log10(6) - DELTA[i]);
    let sii = 0, audible = false;
    e.forEach((ei, i) => {
        if (deaf.includes(i))
            return;
        const z = Math.max(n[i], ei - 24), d = Math.max(z, XI[i] + (Array.isArray(shift) ? shift[i] : shift));
        const l = Math.min(1, 1 - (ei - SPEECH.normal[i] - 10) / 160);
        const k = Math.min(1, Math.max(0, (ei - d + 15) / 30));
        sii += IMPORTANCE[i] * l * k;
        if (ei + 15 > d)
            audible = true;
    });
    sii = Math.round(sii * 1000) / 1000;
    return { sii, words: Math.round(100 / (1 + Math.exp(-0.29 * (30 * sii - 15 + 2.70)))) / 100, audible };
}
export const BAND_HZ = BANDS;
/** Whether a sound of overall `spl` dB at 1 m is heard: { audible, margin } with margin = best band peak − disturbance, dB. */
export function hearSound({ spl, distance = 1, barrier = 'none', noise = 'quiet room', noiseDb = null, shift = 0, deaf = [] }) {
    const e = arriving({ spl, distance, barrier });
    const nDb = noiseDb ?? NOISE[noise] ?? 25;
    let margin = -Infinity;
    e.forEach((ei, i) => {
        if (deaf.includes(i))
            return;
        const n = nDb - 10 * Math.log10(6) - DELTA[i];
        margin = Math.max(margin, ei + 15 - Math.max(n, XI[i] + (Array.isArray(shift) ? shift[i] : shift)));
    });
    return { audible: margin > 0, margin: Math.round(margin) };
}
