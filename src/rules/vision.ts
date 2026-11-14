// Seeing a target at a distance (docs/df-body-engine.md §6.2). Light → luminance → acuity → cycles across the target →
// probability of detecting, recognizing and identifying it.
// Illuminance, lux (Wikipedia, Lux, examples; ranges at their geometric middle): luminance of the scene L = E ρ ÷ π with a
// diffuse reflectance ρ = 0.2 [ASSUMED].
import { def, k } from './constants.js';
def({ id: 'contrastThreshold', value: 0.02, unit: 'contrast', status: 'sourced', src: 'Koschmieder: the contrast at which a black target on the horizon sky is lost; it defines meteorological visibility (WMO)', file: 'vision.ts' });
def({ id: 'glanceCap', value: 10, unit: 'tries', status: 'assumed', src: 'a target that stays put is not a new chance at every fixation: its detectability is a property of the scene, so the tries are capped', range: [3, 30], file: 'vision.ts' });
def({ id: 'searchSeconds', value: 6, unit: 's', status: 'sourced', src: 'Blackwell 1946: thresholds measured with 6 s to find the target among 8 places', file: 'vision.ts' });
// Contrast threshold by target size and light (E07): Blackwell 1946 (J Opt Soc Am 36:624), Table III, log of the threshold
// contrast of a circular target brighter than its surround, 50 % detection corrected for chance, 6 s to find it among 8
// places, nine trained observers, about 220 000 observations; darker-than-surround targets gave nearly the same values (Table
// VI). Rows: target diameter 3.60, 9.68, 18.2, 55.2, 121.0 arcmin; columns: adaptation brightness 10², 10, 1, … 10⁻⁶
// footlamberts (1 fL = 3.426 cd/m²). Linear in log size and log brightness between points; held past 121′ and at both ends of
// brightness; below 3.6′ threshold × area held constant (Ricco's law, the trend of Blackwell's Fig. 12) [ASSUMED]; the 3.6′
// value at 100 fL, missing, is the 10 fL value [ASSUMED Weber region]. The target's smallest dimension is its diameter
// [ASSUMED]. Chance of detection: lognormal in contrast with P = 0.90 at 1.62 × threshold (Blackwell's conversion constant)
// [ASSUMED shape]. Laboratory thresholds × a field factor, fitted so that a large target in daylight has the 2 % that defines
// meteorological visibility: 0.02 ÷ 10^−2.132 = 2.71.
const BW_SIZE = [3.6, 9.68, 18.2, 55.2, 121.0];
const BW: number[][] = [
    [-1.111, -1.111, -0.812, -0.385, 0.182, 0.911, 1.410, 2.017, 2.821],
    [-1.730, -1.658, -1.437, -1.070, -0.526, 0.124, 0.615, 1.196, 1.950],
    [-1.889, -1.857, -1.738, -1.421, -0.928, -0.325, 0.137, 0.716, 1.467],
    [-2.062, -2.060, -2.020, -1.857, -1.500, -0.996, -0.590, -0.069, 0.666],
    [-2.132, -2.130, -2.114, -1.959, -1.640, -1.198, -0.910, -0.461, 0.238],
];
def({ id: 'fieldFactor', value: 2.71, unit: '× Blackwell laboratory threshold', status: 'fitted', src: 'a 121′ target at 100 fL meets the 2 % of meteorological visibility (0.02 ÷ 10^−2.132)', range: [1.5, 4], file: 'vision.ts' });
/** log10 of Blackwell's 50 % threshold contrast for a target of `arcmin` diameter at adaptation luminance `La` cd/m². */
export function logThreshold(arcmin: number, La: number): number {
    const lb = Math.max(-6, Math.min(2, Math.log10(Math.max(1e-12, La) / 3.426))), x = 2 - lb, j = Math.min(7, Math.floor(x)), f = x - j;
    const col = (r: number[]) => r[j] + (r[j + 1] - r[j]) * f;
    const s = Math.min(121, arcmin);
    if (s < BW_SIZE[0]) return col(BW[0]) + 2 * Math.log10(BW_SIZE[0] / Math.max(1e-6, s));
    const i = Math.min(3, BW_SIZE.findIndex((v, n) => s >= v && s <= BW_SIZE[n + 1]));
    const g = (Math.log10(s) - Math.log10(BW_SIZE[i])) / (Math.log10(BW_SIZE[i + 1]) - Math.log10(BW_SIZE[i]));
    return col(BW[i]) + (col(BW[i + 1]) - col(BW[i])) * g;
}
const phiV = (x: number) => { const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2); const e = 1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x / 2); return x >= 0 ? (1 + e) / 2 : (1 - e) / 2; };
/** Chance of detecting apparent contrast `C` on a target of `arcmin` at adaptation luminance `La` cd/m², a 6 s look. */
export function contrastChance(C: number, arcmin: number, La: number): number {
    if (!(C > 0)) return 0;
    const thr = k('fieldFactor') * 10 ** logThreshold(arcmin, La);
    return phiV(Math.log(C / thr) / (Math.log(1.62) / 1.2816));
}
// Dark adaptation (E10). After moving from bright to dim light the eye's sensitivity recovers over about 40 minutes, with
// the rod–cone break at 5–8 minutes (Webvision, Light and dark adaptation). Here the adaptation level moves from the earlier
// light toward the present one in log units: 40 % of the way by 7 minutes (the cones), the rest by 40 minutes (the rods),
// linear in each phase [ASSUMED shape]; light seen while adapted to La looks like lux² ÷ La [ASSUMED mapping], so the present
// light counts in full once adapted. Brighter light adapts at once [ASSUMED: within seconds].
def({ id: 'darkFullMin', value: 40, unit: 'min', status: 'sourced', src: 'dark adaptation complete in about 40 min (Webvision)', file: 'vision.ts' });
def({ id: 'rodConeMin', value: 7, unit: 'min', status: 'sourced', src: 'rod–cone break at 5–8 min (Webvision)', range: [5, 8], file: 'vision.ts' });
def({ id: 'coneShare', value: 0.4, unit: 'share of the log change done by the cones', status: 'assumed', src: 'cones recover first, rods do the rest', range: [0.2, 0.6], file: 'vision.ts' });
/**
 * The light that counts for seeing, lux, for a viewer whose eyes were last at `eye` (lux and story minute when they left it)
 * and now look at `lux` at minute `t`; and the eye state to keep.
 */
export function adaptedLux(eye: { lux: number; t: number } | undefined, lux: number, t: number | null): { lux: number; eye: { lux: number; t: number } | undefined; dark: boolean } {
    if (t === null || !(lux > 0)) return { lux, eye, dark: false };
    if (!eye || lux >= eye.lux || t < eye.t) return { lux, eye: { lux, t }, dark: false };
    const m = t - eye.t, full = k('darkFullMin'), b = k('rodConeMin'), c = k('coneShare');
    const left = m >= full ? 0 : m <= b ? 1 - c * m / b : (1 - c) * (1 - (m - b) / (full - b));
    if (left <= 0) return { lux, eye: { lux, t }, dark: false };
    const La = 10 ** (Math.log10(lux) + (Math.log10(eye.lux) - Math.log10(lux)) * left);
    return { lux: lux * lux / La, eye, dark: true };
}
// Acuity by age (E11): no change from 25 to 54 (better eye −0.18 ± 0.05 logMAR; ETDRS 2000 charts, 200 people aged 25–74,
// break point at 55–59), and a population over 75 losing 5.2 letters in 5 years (Beaver Dam Eye Study; 5 letters = 0.1 logMAR),
// about 0.02 logMAR a year. Between 55 and 75 the yearly loss rises linearly from 0 to that rate, and holds after 75
// [ASSUMED interpolation]. Resolved cycles scale as 10^(−loss).
export function ageAcuity(age: number | null | undefined): number {
    if (age == null || age <= 55) return 1;
    const r = 0.104 / 5, a = Math.min(age, 75) - 55;
    const loss = r * a * a / 40 + r * Math.max(0, age - 75);
    return 10 ** -loss;
}
export const LIGHT: Record<string, number> = { 'overcast starlight': 0.0001, 'clear starlight': 0.002, 'quarter moon': 0.01, 'full moon': 0.12,
    'civil twilight': 3.4, 'dim street or public lighting': 32, 'living room': 50, office: 400, 'overcast day': 1000,
    daylight: 15800, 'direct sunlight': 56600 };
// Acuity, highest resolvable grating (cycles/degree) by adaptation luminance: R = 17.25 arctan(1.4 log10 L + 0.35) + 25.72
// (Ward Larson, Rushmeier & Piatko 1997, IEEE TVCG 3:291, fit to Shlaer 1937; gives 49 c/deg at 10^3 and 2.6 at 10^−3.3 cd/m²,
// matching the 50 and 2 quoted by Ferwerda et al. 1996).
export const acuity = (lux: number) => 17.25 * Math.atan(1.4 * Math.log10(Math.max(1e-7, lux * 0.2 / Math.PI)) + 0.35) + 25.72;
// Johnson criteria: cycles across the target's smallest dimension for a 50 % chance: detection 1, recognition 4, identification
// 6.4 (Johnson 1958). Probability: target transfer probability function P = x^E ÷ (1 + x^E), x = N ÷ N50, E = 2.7 + 0.7 x
// (as used in the US Army NVESD models).
const N50: Record<'detect' | 'recognize' | 'identify', number> = { detect: 1, recognize: 4, identify: 6.4 };
// Written as 1 ÷ (1 + x^−E): the same value, and finite for a large or near target, where x^E overflows to Infinity and
// Infinity ÷ Infinity gave NaN (a 1.5 m window at 1 m was "missed").
const ttpf = (x: number) => { if (!(x > 0)) return 0; const e = 2.7 + 0.7 * x; return 1 / (1 + x ** -e); };

/**
 * { detect, recognize, identify } probabilities for a target of smallest dimension `size` m at `distance` m in `light`
 * (preset or lux), with meteorological visibility `visibility` m. The contrast of the target against its background
 * (`contrast`, 1 for a black target on the horizon sky, which is how visibility is defined) falls with distance as
 * e^(−3.912 d / V) (Koschmieder), so it is 2 % at d = V. The odds of seeing it follow the same transfer function as the
 * contrast threshold for the target's size and the light (Blackwell 1946, above) [ASSUMED: the contrast and resolution terms
 * multiply]; they fall smoothly through V and with the light. acuityFactor scales the viewer's acuity (species, damaged
 * eyes, age). One try is a 6 s look, as in Blackwell's sessions; `seconds` of looking give one try per 6 s, independent
 * [ASSUMED], at most 10.
 */
export function see({ size = 0.5, distance = 10, light = 'daylight' as string | number, visibility = 20000, acuityFactor = 1, contrast = 1, seconds = 0 }) {
    const lux = typeof light === 'number' ? light : LIGHT[light] ?? LIGHT.daylight;
    // No light at all (a shut room with no flame at night): nothing to see, whatever the acuity formula gives at its floor.
    if (!(lux > 0)) return { detect: 0, recognize: 0, identify: 0, cycles: 0 };
    const thr = k('contrastThreshold');
    const C = visibility > 0 ? Math.abs(contrast) * Math.exp(-Math.log(1 / thr) * distance / visibility) : 0;
    const deg = Math.atan(size / Math.max(0.1, distance)) * 180 / Math.PI;
    const gate = contrastChance(C, deg * 60, lux * 0.2 / Math.PI);
    const cycles = Math.max(0, acuity(lux)) * acuityFactor * deg;
    const tries = Math.min(k('glanceCap'), Math.max(1, Math.round(seconds / k('searchSeconds'))));
    const r = (n: keyof typeof N50) => { const p = ttpf(cycles / N50[n]) * gate; return Math.round((1 - (1 - p) ** tries) * 100) / 100; };
    return { detect: r('detect'), recognize: r('recognize'), identify: r('identify'), cycles: Math.round(cycles * 10) / 10 };
}

// Species acuity as a share of human (60 cycles/degree), Caves, Brandley & Johnsen 2018 (Trends Ecol Evol 33:358) as reported
// by Duke University (24 May 2018): chimpanzees and other primates about 60 (1); wedge-tailed eagle 140 (2.33; for the DF eagle
// [ASSUMED]); dogs and cats 4–7 times less (1 ÷ 5.5); rats 40–60 times less (1 ÷ 50); mice over 100 times less (1 ÷ 100);
// most birds under 30 (0.5 as a ceiling [ASSUMED]); the sharpest fish about 30 (0.5 ceiling [ASSUMED]). Cats for the big cats,
// dogs for wolves [ASSUMED family]. Unknown species: human. Same light dependence as humans [ASSUMED].
const ACUITY: Record<string, number> = { CHIMPANZEE: 1, BONOBO: 1, GORILLA: 1, ORANGUTAN: 1, MACAQUE_RHESUS: 1, BIRD_EAGLE: 140 / 60, DOG: 1 / 5.5, WOLF: 1 / 5.5,
    CAT: 1 / 5.5, LION: 1 / 5.5, TIGER: 1 / 5.5, LEOPARD: 1 / 5.5, JAGUAR: 1 / 5.5, COUGAR: 1 / 5.5, RAT: 1 / 50, MOUSE: 1 / 100 };
export function acuityOf(id: string | null | undefined = 'HUMAN'): number {
    const base = String(id).toUpperCase().replace(/^GIANT_/, '').replace(/_MAN$/, '');
    return ACUITY[base] ?? (base.startsWith('BIRD_') ? 0.5 : base.startsWith('FISH_') ? 0.5 : 1);
}

// A target's contrast against what lies behind it (Look `dressed`, `against`), both lit alike: Weber contrast |ρt − ρb| ÷ ρb
// of their reflectances. Clothing by its Munsell value, luminous reflectance Y from the value by ASTM D1535's polynomial: dark
// (value 2) 3.1 %, mid-tone (5) 19.8 %, light (9) 78.7 % [ASSUMED: the value of each kind of clothing]. Ground reflectances
// (Page & Lebens, Climate in the UK, as tabled by IES VE): grass 0.25, crops and woodland 0.2, fresh snow 0.8–0.9 (0.85), old
// snow 0.45–0.7 (0.575), water 0.1–0.2 (0.15), asphalt 0.15, concrete 0.3, brick 0.2–0.4 (0.3). On the skyline the horizon
// sky is taken as bright as a white surface under it, ρb = 1 [ASSUMED], so a dark figure there keeps the contrast of 1 that
// defines visibility. Without either, the contrast stays 1 (a black target on the skyline), as before.
const munsellY = (V: number) => (1.2219 * V - 0.23111 * V ** 2 + 0.23951 * V ** 3 - 0.021009 * V ** 4 + 0.0008404 * V ** 5) / 100;
export const DRESSED: Record<string, number> = { 'dark clothes or coat (black, navy, brown)': munsellY(2), 'mid-tone clothes (grey, khaki, red, blue)': munsellY(5), 'light clothes (white, cream, pale)': munsellY(9) };
export const AGAINST: Record<string, number> = { 'the sky (on the skyline)': 1, 'grass or fields': 0.25, 'woodland or crops': 0.2, 'fresh snow': 0.85, 'old snow': 0.575, 'water': 0.15, 'an asphalt road': 0.15, 'concrete or stone paving': 0.3, 'a brick or stone wall': 0.3 };
// A body is not flat: in sunshine its side away from the sun is lit by the sky alone, so the figure shows the larger of the
// two contrasts, lit side and shaded side [ASSUMED: the background keeps its sunlit level]. The shaded side's share of the
// light is the diffuse fraction of global light, from the clearness index by Erbs, Klein & Duffie 1982 (Sol Energy 28:293):
// 1 − 0.09 kT to 0.22; 0.9511 − 0.1604 kT + 4.388 kT² − 16.638 kT³ + 12.336 kT⁴ to 0.80; 0.165 above (as given in the
// DNV SolarFarmer calculation reference, Decomposition). The clearness index from
// the engine's clear-sky index × 0.75 [ASSUMED: a clear sky passes about 75 % of the light above the air]. Clear sun: 0.18;
// overcast: about 1, no shaded side, and a grey figure against woodland all but vanishes, as camouflage does under cloud.
export function diffuseShare(clearSkyIndex: number): number {
    const kT = Math.max(0, Math.min(1, 0.75 * clearSkyIndex));
    return kT <= 0.22 ? 1 - 0.09 * kT : kT <= 0.8 ? 0.9511 - 0.1604 * kT + 4.388 * kT ** 2 - 16.638 * kT ** 3 + 12.336 * kT ** 4 : 0.165;
}
/** The contrast of a dressed figure against a background (shade: the light share of its side away from the sun), or 1 when either is unknown. */
export function figureContrast(dressed?: string, against?: string, shade = 1): number {
    const t = dressed ? DRESSED[dressed] : undefined, b = against ? AGAINST[against] : undefined;
    return t == null || b == null ? 1 : Math.max(Math.abs(t - b), Math.abs(shade * t - b)) / b;
}
