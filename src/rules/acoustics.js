// Speech and sound reaching a listener (docs/df-body-engine.md §4.3). Speech Intelligibility Index, ANSI/ASA S3.5-1997
// octave-band procedure, constants from Table 4 as packaged in the R package SII (Warnes & Shaver, CRAN): band centre, band
// width (10 log Hz), importance, speech spectrum levels at 1 m by vocal effort, reference internal noise.
import { def, k } from './constants.js';
const BANDS = [250, 500, 1000, 2000, 4000, 8000];
const DELTA = [22.48, 25.48, 28.48, 31.48, 34.48, 37.48];
const IMPORTANCE = [0.0617, 0.1671, 0.2373, 0.2648, 0.2142, 0.0549];
// Whisper: 26.8 dB below phonated speech aimed at the same distance (1.5 m), 21.5 dB below when aimed at 6 m (Eriksson &
// Traunmüller 1999, ICPhS, 2 speakers, vowel levels: phonated 55.7/52.5 dB, whispered 25.6/29.1 dB at 1.5 m; whispered
// 30.5/34.7 dB at 6 m); the normal spectrum shifted down [ASSUMED shape: whisper has no voice harmonics below 1 kHz].
const NORMAL = [34.75, 34.27, 25.01, 17.32, 9.33, 1.13];
export const SPEECH = {
    normal: NORMAL, raised: [38.98, 40.15, 33.86, 25.32, 16.78, 5.07],
    loud: [41.55, 44.85, 42.16, 34.39, 25.41, 11.39], shout: [42.50, 49.24, 51.31, 44.32, 34.41, 20.72],
    whisper: NORMAL.map(x => x - 26.8), 'loud whisper': NORMAL.map(x => x - 21.5),
};
export const SPEECH_SPL = { normal: 62.35, raised: 68.34, loud: 74.85, shout: 82.30, whisper: 62.35 - 26.8, 'loud whisper': 62.35 - 21.5 };
const XI = [-3.9, -9.7, -12.5, -17.7, -25.9, -7.1];
// Air absorption, dB/km, 10 °C and 70 % humidity (ISO 9613-2, Table 2).
const AIR = [1.0, 1.9, 3.7, 9.7, 32.8, 117];
// Background noise at the listener, overall dB SPL (Wikipedia, Sound pressure: examples), spread evenly over the six octaves
// (pink noise) [ASSUMED shape].
// Labels name a loudness class and its level; the measured examples stay in this comment, since a modern example in the label
// (television, traffic) drew modern scenes into historical ones (an 1820 inn read as "loud room (television)").
export const NOISE = { 'silent night (10 dB)': 10, 'quiet room (25 dB)': 25, 'conversation nearby (50 dB)': 50, 'busy street (68 dB)': 67.5,
    'loud room (75 dB)': 75, 'loud machine nearby (85 dB)': 85, 'pounding work close by (100 dB)': 100 };
// Sound sources, overall dB SPL at 1 m: Wikipedia "Sound pressure" examples (.30-06 rifle 171 at 1 m; jet engine 150 at 1 m;
// jackhammer 100 at 1 m; normal conversation 40–60 at 1 m → 50; vacuum cleaner 85 at 1.8 m → 90; passenger car at 30 km/h
// 65–70 at 10 m → 87.5); footsteps on gravel or sand about 60–62 dBA at the walker's ear (Larsson et al. 2015, Noise Health
// 17:227, citing earlier recordings), ear about 1.5 m from the feet → 64 at 1 m [ASSUMED distance].
export const SOUNDS = { 'gunshot (171 dB at 1 m)': 171, 'deafening roar (150 dB at 1 m)': 150, 'loud pounding (100 dB at 1 m)': 100,
    'loud drone (90 dB at 1 m)': 90, 'passing vehicle (88 dB at 1 m)': 87.5, 'footsteps on gravel or sand (64 dB at 1 m)': 64, 'quiet conversation (50 dB at 1 m)': 50 };
/** A sound or noise class by its label, or by its words before the parenthesis (labels saved before the levels were added). */
export const classOf = (table, label) => {
    if (label == null)
        return undefined;
    if (label in table)
        return label;
    const head = (x) => x.toLowerCase().split('(')[0].trim();
    return Object.keys(table).find(k => head(k) === head(label));
};
// Walls and doors: field mass law, TL = 20 log10(m f) − 47 dB, m surface mass kg/m² (e.g. Long, Architectural Acoustics);
// surface masses from material density × thickness [ASSUMED values].
export const BARRIER = { none: 0, 'curtain or tent': 1, 'wooden door': 20, 'plaster wall': 25, 'brick wall': 200, 'stone wall': 500 };
const massLaw = (m, f) => m ? Math.max(0, 20 * Math.log10(m * f) - 47) : 0;
/**
 * Sound absorbed by the air, dB per km, from the air's temperature, humidity and pressure: ISO 9613-1:1993 (relaxation of
 * oxygen and nitrogen molecules, which take up the wave's energy and give it back as heat; water vapour shifts their
 * relaxation frequencies). Checked against ISO 9613-2 Table 2: 10 °C, 70 % gives 1.0, 1.9, 3.7, 9.7, 33.1, 118 dB/km at
 * 250 Hz–8 kHz (table 1.0, 1.9, 3.7, 9.7, 32.8, 117); 20 °C, 70 %: 1.1, 2.8, 5.0, 9.0, 23.1, 77.6 (1.1, 2.8, 5.0, 9.0,
 * 22.9, 76.6).
 */
export function airAbsorption(f, { tC = 10, rh = 70, kPa = 101.325 } = {}) {
    const T = tC + 273.15, T0 = 293.15, pr = 101.325, p = kPa / pr;
    const h = rh * 10 ** (-6.8346 * (273.16 / T) ** 1.261 + 4.6151) / p;
    const frO = p * (24 + 4.04e4 * h * (0.02 + h) / (0.391 + h));
    const frN = p * (T / T0) ** -0.5 * (9 + 280 * h * Math.exp(-4.170 * ((T / T0) ** (-1 / 3) - 1)));
    return 8686 * f * f * (1.84e-11 / p * (T / T0) ** 0.5 + (T / T0) ** -2.5 * (0.01275 * Math.exp(-2239.1 / T) / (frO + f * f / frO) + 0.1068 * Math.exp(-3352 / T) / (frN + f * f / frN)));
}
/** Speed of sound in air, m/s: c = 331.3 √(1 + t / 273.15) (ideal gas, dry air; humidity adds under 0.5 %). */
export const soundSpeed = (tC = 10) => 331.3 * Math.sqrt(1 + tC / 273.15);
/**
 * Ground effect, dB per band (negative = louder): ISO 9613-2:1996 §7.3.1, Table 3. The wave reflected by the ground meets
 * the direct one; hard ground adds up to 3 dB per end, porous ground cancels part of the middle bands (the "ground dip").
 * As and Ar for the source and listener regions; Am for the middle region, q = 0 when d ≤ 30 (hs + hr).
 */
export function groundEffect(f, d, G, hs = 1.5, hr = 1.5) {
    const e = 1 - Math.exp(-d / 50);
    const end = (h) => f <= 250 ? -1.5 + G * (1.5 + 8.6 * Math.exp(-0.09 * h * h) * e)
        : f <= 500 ? -1.5 + G * (1.5 + 14.0 * Math.exp(-0.46 * h * h) * e)
            : f <= 1000 ? -1.5 + G * (1.5 + 5.0 * Math.exp(-0.9 * h * h) * e) : -1.5 * (1 - G);
    const q = d <= 30 * (hs + hr) ? 0 : 1 - 30 * (hs + hr) / d;
    return end(hs) + end(hr) - 3 * q * (1 - G);
}
/**
 * An obstacle's screening, dB: ISO 9613-2 §7.4, Dz = 10 lg(3 + (C2/λ) C3 z Kmet), C2 = 20, C3 = 1 (one edge), z = path
 * difference over the top (here the top midway: z = 2√((d/2)² + h²) − d), Kmet = exp(−√(dss dsr d / (2 z)) / 2000),
 * capped at 20 dB. The wave bends over the edge, longer waves (low pitch) more.
 */
export function screening(f, d, h, tC = 10) {
    if (!(h > 0))
        return 0;
    const lambda = soundSpeed(tC) / f, half = Math.hypot(d / 2, h), z = 2 * half - d;
    const kmet = Math.exp(-Math.sqrt(half * half * d / (2 * z)) / 2000);
    return Math.min(20, 10 * Math.log10(3 + 20 / lambda * z * kmet));
}
/**
 * Upward refraction: where the sound speed falls with height (sunny day: air colder upward; upwind: wind slower near the
 * ground), rays bend up and leave a shadow zone. A linear gradient g bends rays into arcs of radius R = c/|g|; the last ray
 * that grazes the ground reaches r = √(2R)(√hs + √hr) (geometry of the arc, as in Embleton 1996, JASA 100:31). Gradient:
 * temperature dc/dz = (c / 2T) dT/dz; wind, log profile u(z) = u10 ln(z/z0) / ln(10/z0), du/dz = u10 / (z ln(10/z0)) at the
 * mean height, z0 = 0.05 m (short grass) [ASSUMED]. Returns the shadow's start, m, or null when the rays bend down.
 */
export function shadowStart(way, tC = 10) {
    const hs = way.hs ?? 1.5, hr = way.hr ?? 1.5, z = Math.max(0.5, (hs + hr) / 2), c = soundSpeed(tC);
    const dTdz = way.sunUp === undefined ? 0 : way.sunUp ? k('dayDTdz') : k('nightDTdz');
    const sign = way.wind === 'toward the listener' ? 1 : way.wind === 'toward the source' ? -1 : 0;
    const g = c / (2 * (tC + 273.15)) * dTdz + sign * (way.windMs ?? 0) / (z * Math.log(10 / 0.05));
    if (g >= 0)
        return null;
    return Math.sqrt(2 * c / -g) * (Math.sqrt(hs) + Math.sqrt(hr));
}
def({ id: 'dayDTdz', value: -0.1, unit: 'K/m near the ground, sun up', status: 'assumed', src: 'daytime lapse near sunlit ground, stronger than the adiabatic −0.0098 K/m', range: [-0.5, -0.01], file: 'acoustics.ts' });
def({ id: 'nightDTdz', value: 0.05, unit: 'K/m near the ground, sun down', status: 'assumed', src: 'night inversion over cooling ground', range: [0, 0.2], file: 'acoustics.ts' });
def({ id: 'shadowDb', value: 20, unit: 'dB beyond the shadow start', status: 'assumed', src: 'measured shadow-zone losses of 10–30 dB in the middle bands (Embleton 1996)', range: [10, 30], file: 'acoustics.ts' });
/**
 * Sound in a room, dB per band at the listener: the reverberant field of a diffuse room, Lrev = Lw + 10 lg(4/A)
 * (Sabine), with Lw = Lp(1 m) + 11 (free-field spreading over a sphere of 1 m); the part arriving after 50 ms blurs speech
 * like noise (Lochner & Burger 1964; Bradley's U50): its share of the reverberant energy is e^(−13.8 × 0.05 / T), T the
 * reverberation time 0.161 V / A.
 */
export function roomSound(levelAt1m, room) {
    const A = Math.max(1, room.absorption), T = 0.161 * room.m3 / A, rev = levelAt1m + 11 + 10 * Math.log10(4 / A), late = Math.exp(-0.69 / T);
    // The first 50 ms of reflections join the direct sound and help (Barron & Lee 1988); the rest blurs it.
    return { early: rev + 10 * Math.log10(1 - late), late: rev + 10 * Math.log10(late) };
}
const add = (a, b) => 10 * Math.log10(10 ** (a / 10) + 10 ** (b / 10));
/** Octave-band levels (dB spectrum level) of a sound of `effort` (or overall `spl` at 1 m, pink) after distance and barrier. */
// The Lombard effect: talkers raise their voices in noise without meaning to. Face to face (levels at 1 m), the voice stays
// near 55 dB until the background reaches about 48 dB, then rises about 0.6 dB per dB, levelling off near 67 dB around a
// 70 dB background (Pearsons, Bennett & Fidell 1977, EPA-600/1-77-025). Quiet-room levels at 1 m by effort: casual 52,
// normal 57, raised 64, loud 73, shout 85 dB. A talker at a chosen effort is raised further only when the noise asks for
// more than that effort gives over normal.
const PEARSONS = { normal: 57, raised: 64, loud: 73, shout: 85 };
export const lombardDb = (effort, noiseDb) => /whisper/.test(effort) ? 0 : Math.max(0, Math.min(12, 0.6 * (noiseDb - 48)) - ((PEARSONS[effort] ?? 57) - 57));
function arriving({ effort, spl, distance, barrier, air, way = {}, boost = 0 }) {
    const d = Math.max(1, distance), tC = air?.tC ?? 10;
    // A tone puts its energy in its own band; a noise spreads it evenly over the six (pink) [ASSUMED for noise].
    const tone = way.toneHz ? BANDS.reduce((b, f, i) => Math.abs(Math.log2(f / way.toneHz)) < Math.abs(Math.log2(BANDS[b] / way.toneHz)) ? i : b, 0) : -1;
    const src = effort ? SPEECH[effort].map(x => x + boost) : BANDS.map((_, i) => tone >= 0 ? (i === tone ? (spl ?? 0) - DELTA[i] : -99) : (spl ?? 0) - 10 * Math.log10(6) - DELTA[i]);
    const shadow = way.room ? null : shadowStart(way, tC);
    // The wave spreads over a sphere (−20 log10 d); the air takes energy per band; the ground's reflection adds or cancels;
    // an obstacle screens (its screening replaces the ground term, ISO 9613-2 §7.4); upward-bent rays leave a shadow; a wall
    // between rooms passes what the mass law lets through.
    return src.map((e, i) => {
        const f = BANDS[i], ground = way.ground != null && !way.room ? groundEffect(f, d, way.ground, way.hs, way.hr) : 0;
        const screen = way.obstacle_m ? Math.max(0, screening(f, d, way.obstacle_m, tC) - Math.max(0, ground)) : 0;
        const shade = shadow != null && d > shadow ? k('shadowDb') * Math.min(1, (d - shadow) / shadow) : 0;
        return e - 20 * Math.log10(d) - (air ? airAbsorption(f, air) : AIR[i]) * d / 1000 - (screen ? Math.max(ground, screen) : ground) - shade - massLaw(BARRIER[barrier] ?? 0, f);
    });
}
/**
 * What reaches a listener: { sii, words (share of key words understood in sentences with context: logistic link
 * p = 1 ÷ (1 + e^(−0.29 (30 SII − 15 + 2.70))), SPIN-High fit of 30 normal-hearing listeners, Shen & Kern 2018, Trends Hear
 * 22:2331216518761773), audible (speech or
 * sound peaks, 15 dB above the band average, exceed the disturbance in at least one band) }. shift: listener threshold above
 * normal human hearing, dB; deaf: band indices the listener cannot hear.
 */
export function reach({ effort = 'normal', spl = null, distance = 1, barrier = 'none', noise = 'quiet room (25 dB)', noiseDb = null, shift = 0, deaf = [], air, way }) {
    const nDb = noiseDb ?? NOISE[classOf(NOISE, noise) ?? ''] ?? 25;
    const e = arriving({ effort: spl == null ? effort : null, spl, distance, barrier, air, way, boost: spl == null ? lombardDb(effort, nDb) : 0 });
    // In a room, the late part of the speaker's own sound adds to the noise band by band.
    const src1 = spl == null ? SPEECH[effort] : BANDS.map((_, i) => spl - 10 * Math.log10(6) - DELTA[i]);
    const n = BANDS.map((_, i) => { const b = nDb - 10 * Math.log10(6) - DELTA[i]; return way?.room ? add(b, roomSound(src1[i], way.room).late) : b; });
    if (way?.room)
        e.forEach((v, i) => { e[i] = add(v, roomSound(src1[i], way.room).early); });
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
    // Speech-to-noise ratio over the six bands, dB: band level = spectrum level + 10 log bandwidth.
    const sum = (x) => 10 * Math.log10(x.reduce((t, v) => t + 10 ** (v / 10), 0));
    const snr = Math.round(sum(e.map((v, i) => v + DELTA[i])) - sum(n.map((v, i) => v + DELTA[i])));
    return { sii, words: Math.round(100 / (1 + Math.exp(-0.29 * (30 * sii - 15 + 2.70)))) / 100, audible, snr };
}
export const BAND_HZ = BANDS;
/** Whether a sound of overall `spl` dB at 1 m is heard: { audible, margin } with margin = best band peak − disturbance, dB. */
export function hearSound({ spl, distance = 1, barrier = 'none', noise = 'quiet room (25 dB)', noiseDb = null, shift = 0, deaf = [], air, way }) {
    const e = arriving({ spl, distance, barrier, air, way });
    if (way?.room)
        e.forEach((v, i) => { e[i] = add(v, roomSound(spl - 10 * Math.log10(6) - DELTA[i], way.room).early); });
    const nDb = noiseDb ?? NOISE[classOf(NOISE, noise) ?? ''] ?? 25;
    let margin = -Infinity;
    e.forEach((ei, i) => {
        if (deaf.includes(i))
            return;
        const n = nDb - 10 * Math.log10(6) - DELTA[i];
        margin = Math.max(margin, ei + 15 - Math.max(n, XI[i] + (Array.isArray(shift) ? shift[i] : shift)));
    });
    return { audible: margin > 0, margin: Math.round(margin) };
}
