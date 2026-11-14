// A person's voice from the articulatory synthesizer (artsynth.ts; docs/df-body-engine.md, "The voice from the body"). The
// speaker is built from the body and two draws kept with the person: the tract's size and the folds' habitual stretch
// (the player's picks, 2026-11-11: each spread drawn at its cause and sized so simulated people match measured voices; the
// stretch is a muscle setting the person speaks with). The lungs push to the pressure of ordinary speech, the folds'
// motion is integrated in time, and the pitch is read from that motion; the formants are the resonances of the tract the
// run uses. The layer used is tissue mechanics, airflow and tube acoustics; the next one down (the neural drive that sets
// the stretch, the hormones that grow the folds) has no model here yet.
import { def, peek } from './constants.js';
import { speakerOf, speakerToTubes, artIntoTubes, artAt, synthesizeAsync, type Speaker, type Artword, type Tube } from './artsynth.js';
import { seededRng } from './body-engine.js';
import { heightShare, malePuberty } from './growth.js';

// ------------------------------------------------------------------------------------------------ the measured voices
// What the simulated people are fitted to. Hillenbrand et al. 1995 (JASA 97:3099; the phonTools package's h95 data, 45 men
// and 48 women, 12 vowels each): per speaker, the geometric mean f0 over their vowels, and the tract length their formant
// spacing gives, c ÷ 2ΔF with ΔF = (F3 − F1) ÷ 2 per vowel, averaged (formant dispersion: Fitch 1997, JASA 102:1213;
// c = 353 m/s, the run's). Men: f0 130.9 Hz, SD of ln f0 0.153; tract 17.79 cm, SD 0.76. Women: 220.1 Hz, 0.094; 15.80 cm,
// 0.83. Peterson & Barney 1952 (pb52, 33 men and 28 women): 131.0 Hz, 0.127, 18.81 cm, 1.04; 222.3 Hz, 0.092, 16.06 cm,
// 0.84 (the ranges' other ends). Within a sex, formant-based tract length explains up to 10 % of the variance in height,
// and f0 under 2 % (Pisanski et al. 2014, Anim Behav 95:89, meta-analysis of 39 samples).
export const MEASURED = {
    male: { f0Hz: 130.9, lnF0Sd: 0.153, tractCm: 17.79, tractSd: 0.76 },
    female: { f0Hz: 220.1, lnF0Sd: 0.094, tractCm: 15.80, tractSd: 0.83 },
} as const;
// The speakers' heights: US adults born 1960, measured 1994 (body-size.ts), the cohort of Hillenbrand's speakers; within a
// sex, SD 7.59 cm for men and 7.07 for women (Jelenkovic et al. 2016, eLife 5:e14627, as body-size.ts holds them).
export const HEIGHT = { male: { mean: 177.24, sd: 7.59 }, female: { mean: 163.76, sd: 7.07 } } as const;
def({ id: 'voiceTractHeightShare', value: 0.10, unit: 'share of the variance in tract length that height explains, within a sex', status: 'assumed', src: 'the bound of Pisanski et al. 2014 ("up to 10 %") read as the value', range: [0.02, 0.10], file: 'voice-sound.ts' });
def({ id: 'voicePitchHeightShare', value: 0.02, unit: 'share of the variance in ln f0 that height explains, within a sex', status: 'assumed', src: 'the bound of Pisanski et al. 2014 ("under 2 %") read as the value', range: [0, 0.02], file: 'voice-sound.ts' });

// ------------------------------------------------------------------------------------------------------- the tract
/** What a speaker is built from: the body now (height, sex, age) and the person's draws (standard normal, kept with them):
 * the folds' habitual stretch, the tract's size, the timing of their growth. An age left out is an adult's. */
export interface BodyCauses { heightCm: number; male: boolean; age?: number; stretchZ?: number; tractZ?: number; timingZ?: number }
const sexOf = (c: { male: boolean }) => c.male ? 'male' as const : 'female' as const;
/** Where the person is in their growth (growth.ts): the share of their adult height they have, that adult height, and how
 * far a male's puberty has carried his larynx toward a man's (0 for females and before; 1 after). */
export function growthOf(c: BodyCauses): { share: number; adultCm: number; puberty: number } {
    const t = c.age ?? 30, share = heightShare(c.male, t, c.timingZ ?? 0);
    return { share, adultCm: c.heightCm / share, puberty: malePuberty(c.male, t, c.timingZ ?? 0) };
}
// The tract grows with the body, faster in boys: CT and MRI of 605 people aged 0–19 give a tract (glottis to lips) of 12.69 cm
// (boys) and 12.49 (girls) at 5–9 years, 13.92 and 13.92 at 10–14, 17.04 and 15.14 at 15–19 (Vorperian et al. 2011, J Speech
// Lang Hear Res 54:995, Table 1). Against the share of adult height at the groups' middle ages (7.5 and 17.5 years, growth.ts),
// the tract goes as share^0.842 (boys) and share^0.664 (girls). Checked: Hillenbrand et al.'s 27 boys and 19 girls aged
// 10–12 have tracts of 14.77 and 13.96 cm by formant spacing; at 11 the rule gives 14.8 and 14.4.
def({ id: 'voiceTractGrowthMale', value: 0.842, unit: "power of the share of adult height that a boy's tract length follows", status: 'fitted', src: 'Vorperian et al. 2011 Table 1: 12.69 cm at 5–9 years, 17.04 at 15–19; Preece & Baines shares 0.702 and 0.997', range: [0.75, 0.95], file: 'voice-sound.ts' });
def({ id: 'voiceTractGrowthFemale', value: 0.664, unit: "power of the share of adult height that a girl's tract length follows", status: 'fitted', src: 'Vorperian et al. 2011 Table 1: 12.49 cm at 5–9 years, 15.14 at 15–19; Preece & Baines shares 0.748 and 0.999', range: [0.6, 0.75], file: 'voice-sound.ts' });
/** The tract length (cm, as formant spacing measures it) of a person: the adult one (the sex's mean and SD, MEASURED; the
 * adult height carrying voiceTractHeightShare of the variance and the person's own draw the rest) × the share of adult
 * height they have, to the sex's growth power. */
export function tractCmOf(c: BodyCauses): number {
    const m = MEASURED[sexOf(c)], h = HEIGHT[sexOf(c)], share = peek('voiceTractHeightShare'), g = growthOf(c);
    const adult = m.tractCm + m.tractSd * (Math.sqrt(share) * (g.adultCm - h.mean) / h.sd + Math.sqrt(1 - share) * (c.tractZ ?? 0));
    return adult * g.share ** peek(c.male ? 'voiceTractGrowthMale' : 'voiceTractGrowthFemale');
}
// Each sex's tract size (Praat's relativeSize: 1 is Mermelstein's tract, a 15.65 cm midline) for the mean speaker, fitted
// so the tube chain's formant spacing gives the measured mean tract length (17.79, 15.80 cm: spacing = 15.19 cm × size);
// the range's other end gives Peterson & Barney's (18.81, 16.06 cm).
def({ id: 'voiceTractSizeMale', value: 1.1706, unit: "relativeSize of the mean man's tract", status: 'fitted', src: "the tube chain's formant spacing = Hillenbrand et al. 1995 men's 17.79 cm; Peterson & Barney 1952: 18.81 cm", range: [1.1706, 1.2376], file: 'voice-sound.ts' });
def({ id: 'voiceTractSizeFemale', value: 1.0396, unit: "relativeSize of the mean woman's tract", status: 'fitted', src: "the tube chain's formant spacing = Hillenbrand et al. 1995 women's 15.80 cm; Peterson & Barney 1952: 16.06 cm", range: [1.0396, 1.0565], file: 'voice-sound.ts' });

// ------------------------------------------------------------------------------------------------------- the folds
/** The membranous vocal folds' length from height, mm: cadaver larynges, 22 men and 17 women ("Length of the Human Vocal
 * Folds: Proposal of Mathematical Equations as a Function of Gender and Body Height", Ann Otol Rhinol Laryngol):
 * 0.18 h − 15.8 for men, 0.24 h − 28.1 for women, h in cm. Used at each sex's mean height (16.10 and 11.20 mm). */
export const foldMmOf = (heightCm: number, male: boolean) => male ? 0.18 * heightCm - 15.8 : 0.24 * heightCm - 28.1;
// Within a sex the folds' length follows height by a slope fitted so height explains voicePitchHeightShare of the variance
// in ln f0: √share × SD ln f0 ÷ (SD height × |the run's elasticity of f0 to fold length|). The cadaver slopes (0.011 and
// 0.021 per cm in ln terms) would make height explain 15–40 %, against the measured < 2 %.
def({ id: 'voiceFoldPerHeightMale', value: 0.0057, unit: 'ln fold length per cm of height, men', status: 'fitted', src: '√0.02 × 0.153 ÷ (7.59 cm × 0.50, the run\'s elasticity at Q 0.86 and 1.48)', range: [0, 0.0057], file: 'voice-sound.ts' });
def({ id: 'voiceFoldPerHeightFemale', value: 0.0041, unit: 'ln fold length per cm of height, women', status: 'fitted', src: '√0.02 × 0.094 ÷ (7.07 cm × 0.46, the run\'s elasticity at Q 1.06 and 1.43)', range: [0, 0.0041], file: 'voice-sound.ts' });
// The folds' stretch Q, Ishizaka & Flanagan's tension parameter (1972, Bell Syst Tech J 51:1233), introduced there to stand
// for the laryngeal muscles' pull: stretched folds are stiffer (springs × Q) and move less of their tissue (masses ÷ Q).
// I&F also thin them by 1 ÷ Q; the thickness here stays Praat's, so the thinnest tube stays inside the run's stability
// bound (353 m/s ÷ the thinnest mass ≤ 22 050 × 25 Hz). Praat's own cricothyroid term stiffens the springs only and stays
// at 0. A person's habitual stretch is the sex's mean × e^(spread × stretchZ); mean and spread fitted so 40 simulated
// people at the stratified draws (the normal's quantiles at (i − 0.5) ÷ 40), mean height, have the measured mean f0 and
// SD of ln f0 (the share height explains taken out). Women fit both. Men cannot: at 637 Pa the run's male folds vibrate
// unsteadily between Q 0.95 and 1.28, where they would give 103–130 Hz, so men there steer down to about 102 Hz; the
// mean is fitted and the SD comes out 0.184 against 0.152. The same folds are steady with a tract 0.8 or 1.4 times the
// size (96–136 Hz), so the band comes from the tract loading the folds (source–tract interaction; Titze 2008, JASA
// 123:2733), at about 4 f0 = F1 for the neutral vowel the run holds.
def({ id: 'voiceStretchMale', value: 1.3826, unit: "Q of the mean man's folds", status: 'fitted', src: '40 stratified men: mean f0 130.5 Hz against 130.9; the fit\'s other rounds 1.35–1.53', range: [1.35, 1.53], file: 'voice-sound.ts' });
def({ id: 'voiceStretchFemale', value: 1.4596, unit: "Q of the mean woman's folds", status: 'fitted', src: '40 stratified women: mean f0 219.7 Hz against 220.1; the fit\'s other rounds 1.43–1.46', range: [1.43, 1.48], file: 'voice-sound.ts' });
def({ id: 'voiceStretchSpreadMale', value: 0.15, unit: 'SD of ln Q among men', status: 'fitted', src: '40 stratified men: SD of ln f0 0.184 against 0.152 (the run\'s gap, below); the fit\'s other rounds 0.12–0.19', range: [0.12, 0.19], file: 'voice-sound.ts' });
def({ id: 'voiceStretchSpreadFemale', value: 0.2714, unit: 'SD of ln Q among women', status: 'fitted', src: '40 stratified women: SD of ln f0 0.096 against 0.093; the fit\'s other rounds 0.26–0.27', range: [0.26, 0.28], file: 'voice-sound.ts' });

/** A speaker from a body: the tract Praat's of the person's sex, scaled so its formant spacing is the person's tract length;
 * the folds the length the body gives, their masses in proportion to it and their springs in inverse proportion (a string's
 * first mode: stiffness π²T ÷ 2L at a tension T, mass μL ÷ 2; Fletcher & Rossing 1998, The Physics of Musical Instruments,
 * §2.1), then stretched by Q (`lnQ`: the habitual stretch unless given).
 * Growing: a girl's folds are her adult length × her share of adult height. Before puberty a boy's folds and their tissue
 * are a girl's of his height [ASSUMED: the sexes' larynges alike before puberty, as their tracts are to age 14 (Vorperian et
 * al. 2011) and their speaking pitch nearly so to 10: 247 Hz for boys, 253 for girls (Vuorenkoski et al. 1978, Arch Dis
 * Child 53:201, 374 people aged 6 to adult)]; across his puberty (growth.ts) each quantity moves from that to a man's,
 * geometrically: length, mass and spring per length, thickness, mean stretch. */
export function speakerOfBody(c: BodyCauses, lnQ = lnStretchOf(c)): Speaker {
    const sex = sexOf(c), g = growthOf(c), P = g.puberty, F = speakerOf('female'), M = speakerOf('male'), hf = HEIGHT.female;
    const size = peek(c.male ? 'voiceTractSizeMale' : 'voiceTractSizeFemale') * tractCmOf(c) / MEASURED[sex].tractCm, sp = speakerOf(sex, size);
    const adultL = (male: boolean, adultCm: number) => foldMmOf(HEIGHT[sexOf({ male })].mean, male) / 1000 * Math.exp(peek(male ? 'voiceFoldPerHeightMale' : 'voiceFoldPerHeightFemale') * (adultCm - HEIGHT[sexOf({ male })].mean));
    const mix = (a: number, b: number) => a ** (1 - P) * b ** P;
    // A girl's folds, or a boy's before puberty: a woman's at the mean height, in proportion to the height now.
    const childL = c.male ? adultL(false, hf.mean) * c.heightCm / hf.mean : adultL(false, g.adultCm) * g.share;
    const L = c.male ? mix(childL, adultL(true, g.adultCm) * g.share) : childL, Q = Math.exp(lnQ);
    sp.cordLength = L;
    for (const k of ['lowerCord', 'upperCord'] as const) {
        const f = F[k], m = M[k];
        const perL = { mass: mix(f.mass / F.cordLength, m.mass / M.cordLength), k1: mix(f.k1 * F.cordLength, m.k1 * M.cordLength), thickness: mix(f.thickness, m.thickness) };
        sp[k] = { thickness: perL.thickness, mass: perL.mass * L / Q, k1: perL.k1 / L * Q };
    }
    return sp;
}
/** The person's habitual stretch, ln Q: across a male's puberty the mean and spread move from a woman's to a man's. */
export function lnStretchOf(c: BodyCauses): number {
    const P = growthOf(c).puberty, lerp = (f: string, m: string) => (1 - P) * Math.log(peek(f)) + P * Math.log(peek(m));
    return lerp('voiceStretchFemale', 'voiceStretchMale') + Math.exp(lerp('voiceStretchSpreadFemale', 'voiceStretchSpreadMale')) * (c.stretchZ ?? 0);
}
/** The lungs' push for ordinary pressure: the sex's (moving with a male's puberty) × the mean speaker's tract size ÷ the
 * person's: the run's airways scale with that size, and the pressure under the folds with it (582, 603 and 639 Pa at sizes
 * 0.947, 0.973 and 1.040, the same push and a woman's folds). */
export function lungsOf(c: BodyCauses): number {
    const P = growthOf(c).puberty, sp = speakerOfBody(c);
    const mean = (1 - P) * peek('voiceTractSizeFemale') + P * peek('voiceTractSizeMale');
    return ((1 - P) * peek('voiceLungsFemale') + P * peek('voiceLungsMale')) * mean / sp.relativeSize;
}

// --------------------------------------------------------------------------------------------------- the formants
// The resting articulation: Praat's tutorial vowel (interarytenoid 0.5 closes the glottis to vibrate, levator palatini 1
// closes the nose), every other muscle relaxed: the tract in Mermelstein's neutral shape.
const restingWord = (lungs: number, dur: number): Artword => ({ totalTime: dur, targets: { Interarytenoid: [[0, 0.5], [dur, 0.5]], LevatorPalatini: [[0, 1], [dur, 1]], Lungs: [[0, lungs], [0.1, 0]] } });
const RHO = 1.14, C = 353, MU = 1.86e-5, DYMIN = 1e-5;
type Cx = [number, number];
const cmul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cdiv = (a: Cx, b: Cx): Cx => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
const cadd = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const csqrt = (a: Cx): Cx => { const r = Math.hypot(a[0], a[1]), re = Math.sqrt((r + a[0]) / 2), im = Math.sqrt(Math.max(0, (r - a[0]) / 2)); return [re, a[1] < 0 ? -im : im]; };
const cexp = (a: Cx): Cx => { const e = Math.exp(a[0]); return [e * Math.cos(a[1]), e * Math.sin(a[1])]; };
/** The tract's tubes (38–64, glottis to lips) in the resting articulation. */
export function restingTract(sp: Speaker): Tube[] {
    const T = speakerToTubes(sp);
    artIntoTubes(artAt(restingWord(0, 0.3), 0.15), sp, T);
    return T.slice(38, 65) as Tube[];
}
/** The run's equations, linearised around rest, as a chain of two-ports (Fant 1960, Acoustic Theory of Speech Production):
 * |U at the lips ÷ U at the glottis| at frequency f. Each tube: series impedance (R + jωρ) ÷ A per metre, R the run's
 * friction (eq. 5.23: 12μ ÷ width² + 0.3 ÷ width); shunt admittance jωA ÷ ρc² per metre plus its walls', which move as the
 * run's mass on a spring (m ÿ + B ẏ + k y = 2 P Dz Dx, B = 2 Brel √(m k)), taking in Dz Dx ẏ. At the lips the run's
 * radiation (eqs. 5.135–5.136: dP/dt + (2c ÷ 0.02 m) P = c dp/dt) is the impedance (ρc ÷ A) · jx ÷ (1 + jx) with
 * x = ω · 0.01 m ÷ c. */
export function transferAt(tubes: Tube[], f: number): number {
    const w = 2 * Math.PI * f;
    let K11: Cx = [1, 0], K12: Cx = [0, 0], K21: Cx = [0, 0], K22: Cx = [1, 0];
    let Alast = 1;
    for (const t of tubes) {
        const Dy = t.Dyeq, A = t.Dzeq * (Dy >= DYMIN ? Dy + DYMIN : DYMIN), l = t.Dxeq;
        const R = 12 * MU / ((Math.max(Dy, 0) + DYMIN) ** 2 + DYMIN * DYMIN) + 0.3 * t.Dzeq / A;
        const Z: Cx = [R / A, w * RHO / A];
        const B = 2 * t.Brel * Math.sqrt(t.mass * t.k1), wall = cdiv([0, 2 * (t.Dzeq * l) ** 2 * w], [t.k1 - w * w * t.mass, w * B]);
        const Y: Cx = [wall[0] / l, w * A / (RHO * C * C) + wall[1] / l];
        const g = csqrt(cmul(Z, Y)), Zc = csqrt(cdiv(Z, Y)), gl: Cx = [g[0] * l, g[1] * l];
        const e = cexp(gl), ei = cdiv([1, 0], e), ch: Cx = [(e[0] + ei[0]) / 2, (e[1] + ei[1]) / 2], sh: Cx = [(e[0] - ei[0]) / 2, (e[1] - ei[1]) / 2];
        const a: Cx = ch, b = cmul(Zc, sh), c = cdiv(sh, Zc), d: Cx = ch;
        [K11, K12, K21, K22] = [cadd(cmul(K11, a), cmul(K12, c)), cadd(cmul(K11, b), cmul(K12, d)), cadd(cmul(K21, a), cmul(K22, c)), cadd(cmul(K21, b), cmul(K22, d))];
        Alast = A;
    }
    const x = w * 0.01 / C, Zr = cmul([RHO * C / Alast, 0], cdiv([0, x], [1, x]));
    const den = cadd(cmul(K21, Zr), K22);
    return 1 / Math.hypot(den[0], den[1]);
}
/** The formants: the first `n` peaks of the transfer above, 100–5000 Hz (a 5 Hz scan, each peak refined by golden-section
 * search to 0.1 Hz). */
export function formantsOfTubes(tubes: Tube[], n = 3): number[] {
    const out: number[] = [];
    let a = transferAt(tubes, 95), b = transferAt(tubes, 100);
    for (let f = 105; f <= 5000 && out.length < n; f += 5) {
        const c = transferAt(tubes, f);
        if (b > a && b >= c) {
            let lo = f - 10, hi = f;
            const g = (Math.sqrt(5) - 1) / 2;
            while (hi - lo > 0.1) { const m1 = hi - g * (hi - lo), m2 = lo + g * (hi - lo); if (transferAt(tubes, m1) > transferAt(tubes, m2)) hi = m2; else lo = m1; }
            out.push(Math.round((lo + hi) / 2));
        }
        a = b; b = c;
    }
    return out;
}
export const formantsOfSpeaker = (sp: Speaker, n = 3) => formantsOfTubes(restingTract(sp), n);
/** The tract length formant spacing gives (Fitch 1997): c ÷ 2ΔF, ΔF = (F3 − F1) ÷ 2, in cm. */
export const spacingCmOf = (f: number[]) => C * 100 / (f[2]! - f[0]!);
/** The resonances of a lossless chain of sections (area m², length m), closed at the glottis, the lips' pressure 0: the
 * zeros of the chain matrix's last element (Fant 1960). For checking the chain against a quarter-wave tube. */
export function resonancesOfTubes(tubes: { A: number; l: number }[], n = 3, c = C): number[] {
    const d = (f: number) => {
        const k = 2 * Math.PI * f / c;
        let a = 1, b = 0, cc = 0, dd = 1;
        for (const t of tubes) {
            const co = Math.cos(k * t.l), si = Math.sin(k * t.l), z = 1 / t.A;
            [a, b, cc, dd] = [a * co - b * si / z, a * z * si + b * co, cc * co + dd * si / z, -cc * z * si + dd * co];
        }
        return dd;
    };
    const out: number[] = [];
    let prev = d(50);
    for (let f = 55; f < 6000 && out.length < n; f += 5) {
        const cur = d(f);
        if (Math.sign(cur) !== Math.sign(prev)) {
            let lo = f - 5, hi = f;
            for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (Math.sign(d(mid)) === Math.sign(d(lo))) lo = mid; else hi = mid; }
            out.push(Math.round((lo + hi) / 2));
        }
        prev = cur;
    }
    return out;
}

// ------------------------------------------------------------------------------------------------------ the pitch
// The pressure under the folds in ordinary speech: 6.21 cm H2O (SD 2.38) for males and 6.67 (2.10) for females aged 4–24,
// by noninvasive interruption (Lamb, Scholp & Jiang 2021, J Voice; sex had little effect), within the 5–10 cm H2O named
// normal; 6.5 cm H2O, 637 Pa, for both.
def({ id: 'voiceSubglottalPa', value: 637, unit: 'Pa below the folds, ordinary speech', status: 'assumed', src: 'about 6.5 cm H2O: 6.21 and 6.67 cm H2O measured (Lamb, Scholp & Jiang 2021), normal range 5–10 cm H2O', range: [490, 980], file: 'voice-sound.ts' });
// The lungs' activity (Praat's Lungs muscle, pushed at 0 s and let recoil by 0.1 s) that gives voiceSubglottalPa under the
// mean speaker's folds, measured in the trachea (tube 35) over the window below; the pressure grows in proportion to it.
def({ id: 'voiceLungsMale', value: 0.1046, unit: "lungs' activity for ordinary pressure, men", status: 'fitted', src: '0.11 × 637 ÷ 670 Pa measured under the mean man\'s folds; 630–650 Pa over his steady stretches', range: [0.1, 0.11], file: 'voice-sound.ts' });
def({ id: 'voiceLungsFemale', value: 0.1123, unit: "lungs' activity for ordinary pressure, women", status: 'fitted', src: '0.116 × 637 ÷ 658 Pa measured under the mean woman\'s folds; 617–640 Pa over her steady stretches', range: [0.11, 0.116], file: 'voice-sound.ts' });
// A voice is steady when its periods and amplitudes repeat: jitter (local), the mean absolute difference of consecutive
// periods over the mean period, under 1.040 %, and shimmer (local), the same for the amplitudes, under 3.810 %: the
// thresholds for pathology MDVP gives, as Praat's manual quotes them ("Voice 2. Jitter", "Voice 3. Shimmer").
def({ id: 'voiceJitterSteady', value: 1.04, unit: '% jitter (local), the most a steady voice has', status: 'sourced', src: 'MDVP threshold for pathology, %Jitt (Praat manual, Voice 2. Jitter)', file: 'voice-sound.ts' });
def({ id: 'voiceShimmerSteady', value: 3.81, unit: '% shimmer (local), the most a steady voice has', status: 'sourced', src: 'MDVP threshold for pathology, %Shim (Praat manual, Voice 3. Shimmer)', file: 'voice-sound.ts' });
// A speaker whose folds vibrate unsteadily at their habitual stretch speaks at the nearest stretch that is steady: people
// hear their own pitch and correct it (a shifted pitch in the ears is opposed within 100–150 ms: Burnett et al. 1998, JASA
// 103:3153). The search steps ln Q by 0.05 [ASSUMED: the grid the stretch–pitch curves were mapped at] down to 0.6 below
// the habitual stretch, then up to 0.6 above it [ASSUMED: the lesser pull first; a nearest-first search sent a woman
// above her unsteady band to a 436 Hz mode, a register no one speaks in at rest].
def({ id: 'voiceSteerStep', value: 0.05, unit: 'ln Q per step of the search for a steady stretch', status: 'assumed', src: 'the resolution of the mapped stretch–pitch curves', range: [0.025, 0.1], file: 'voice-sound.ts' });
/** The run's length and the window measured: the push ends at 0.1 s; from 0.15 s the folds' motion has settled. */
export const RUN_S = 0.35, MEASURE_FROM_S = 0.15;
/** The glottis's cycles: air passes only where both fold masses are apart, so the opening is the smaller of the two widths
 * (tubes 36 and 37); a cycle starts each time it crosses from closed (≤ 0) to open, or, for folds that never close, its
 * range's midpoint upward. Per cycle: its period (s) and the radiated sound's peak (|Pa|). */
export function glottalCycles(lower: ArrayLike<number>, upper: ArrayLike<number>, sound: ArrayLike<number>, fs: number, fromS = MEASURE_FROM_S): { periods: number[]; peaks: number[] } {
    const at = Math.round(fromS * fs), n = lower.length - at, g = new Float64Array(n);
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < n; i++) { g[i] = Math.min(lower[at + i]!, upper[at + i]!); lo = Math.min(lo, g[i]!); hi = Math.max(hi, g[i]!); }
    const mark = lo <= 0 ? 0 : (lo + hi) / 2, ups: number[] = [];
    if (hi - lo > 1e-5) for (let i = 1; i < n; i++) if (g[i - 1]! <= mark && g[i]! > mark) ups.push(i - 1 + (mark - g[i - 1]!) / (g[i]! - g[i - 1]!));
    const periods: number[] = [], peaks: number[] = [];
    for (let k = 1; k < ups.length; k++) {
        periods.push((ups[k]! - ups[k - 1]!) / fs);
        let p = 0;
        for (let i = Math.ceil(ups[k - 1]!); i < ups[k]!; i++) p = Math.max(p, Math.abs(sound[at + i]!));
        peaks.push(p);
    }
    return { periods, peaks };
}
/** Pitch, jitter and shimmer (local, %) of the cycles; steady when there are at least 4 cycles and both stay under their
 * thresholds. Unlike Praat's measure, pairs of periods more than 1.3 apart are kept: they are the unsteadiness sought. */
export function steadinessOf(cy: { periods: number[]; peaks: number[] }) {
    const { periods: T, peaks: A } = cy, mean = (x: number[]) => x.reduce((s, v) => s + v, 0) / Math.max(1, x.length);
    const step = (x: number[]) => mean(x.slice(1).map((v, i) => Math.abs(v - x[i]!))) / (mean(x) || 1) * 100;
    const jitterPct = T.length > 1 ? step(T) : 100, shimmerPct = A.length > 1 ? step(A) : 100, f0Hz = T.length ? 1 / mean(T) : 0;
    return { f0Hz, jitterPct, shimmerPct, steady: T.length >= 4 && jitterPct < peek('voiceJitterSteady') && shimmerPct < peek('voiceShimmerSteady') };
}
/** One run of a speaker at rest (the resting articulation, the lungs' push given), the turbulence noise from `rng`: the folds'
 * steadiness and pitch, and the pressure under them (Pa, tube 35, over the window). */
export async function restAt(sp: Speaker, lungs: number, rng: () => number) {
    const run = await synthesizeAsync(restingWord(lungs, RUN_S), sp, { rng, watch: [36, 37], watchP: [35] });
    const fs = 22050, at = Math.round(MEASURE_FROM_S * fs), p = run.pressures[0]!.subarray(at);
    return { ...steadinessOf(glottalCycles(run.widths[0]!, run.widths[1]!, run.sound, fs)), subglottalPa: p.reduce((s, v) => s + v, 0) / p.length };
}
/** A person's resting voice: their pitch at the habitual stretch, or at the nearest steady one. */
export interface RestingVoice { f0Hz: number; lnStretch: number; lnStretchDrawn: number; steady: boolean; jitterPct: number; shimmerPct: number; subglottalPa: number }
/** The search: the habitual stretch, then one step lower, two steps lower … to 0.6 below, then one step higher … to 0.6
 * above, until a run is steady; the habitual stretch's run when none is. The noise is seeded from the speaker, so the same
 * body gives the same voice. */
export async function restingVoiceOfCauses(c: BodyCauses): Promise<RestingVoice> {
    const drawn = lnStretchOf(c), step = peek('voiceSteerStep');
    let first: (Awaited<ReturnType<typeof restAt>> & { ln: number }) | null = null;
    const n = Math.round(0.6 / step);
    for (let i = 0; i <= 2 * n; i++) {
        const ln = drawn + (i <= n ? -i : i - n) * step, sp = speakerOfBody(c, ln);
        const r = { ...await restAt(sp, lungsOf(c), seededRng(`voice:${keyOf(sp)}`)), ln };
        first ??= r;
        if (r.steady) return voiceFrom(r, drawn);
    }
    return voiceFrom(first!, drawn);
}
const voiceFrom = (r: { f0Hz: number; jitterPct: number; shimmerPct: number; subglottalPa: number; steady: boolean; ln: number }, drawn: number): RestingVoice =>
    ({ f0Hz: Math.round(r.f0Hz * 10) / 10, lnStretch: r.ln, lnStretchDrawn: drawn, steady: r.steady, jitterPct: Math.round(r.jitterPct * 100) / 100, shimmerPct: Math.round(r.shimmerPct * 100) / 100, subglottalPa: Math.round(r.subglottalPa) });

// ------------------------------------------------------------------------------------------------- kept per session
/** A speaker's key: the numbers its run depends on, so a changed constant gives another run. */
const keyOf = (sp: Speaker) => JSON.stringify([sp.relativeSize, sp.cordLength, sp.lowerCord, sp.upperCord].map(x => typeof x === 'number' ? +x.toPrecision(9) : Object.values(x).map(v => +v.toPrecision(9))));
const causesKey = (c: BodyCauses) => JSON.stringify([keyOf(speakerOfBody(c)), lungsOf(c), peek('voiceSteerStep'), peek('voiceJitterSteady'), peek('voiceShimmerSteady')]);
const voices = new Map<string, RestingVoice>(), running = new Map<string, Promise<RestingVoice>>(), formants = new Map<string, number[]>();
/** The person's resting voice, run once per session for their causes. */
export function restingVoiceOf(c: BodyCauses): Promise<RestingVoice> {
    const key = causesKey(c), done = voices.get(key);
    if (done) return Promise.resolve(done);
    let p = running.get(key);
    if (!p) {
        p = restingVoiceOfCauses(c).then(v => { voices.set(key, v); running.delete(key); return v; });
        running.set(key, p);
    }
    return p;
}
/** The resting voice when its run has finished, else undefined (and the run started). */
export function restingVoiceNow(c: BodyCauses): RestingVoice | undefined {
    const v = voices.get(causesKey(c));
    if (!v) void restingVoiceOf(c);
    return v;
}
/** The person's formants (Hz), kept per session. */
export function formantsOfBody(c: BodyCauses): number[] {
    const sp = speakerOfBody(c), key = keyOf(sp);
    let f = formants.get(key);
    if (!f) { f = formantsOfSpeaker(sp); formants.set(key, f); }
    return f;
}
