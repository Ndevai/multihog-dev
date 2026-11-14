import { gripNorm } from './strength.js';
import { def, k } from './constants.js';
const phi = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
};
const lerp = (xs, ys, x) => {
    if (x <= xs[0])
        return ys[0];
    const i = xs.findIndex((v, j) => x >= v && x <= (xs[j + 1] ?? Infinity));
    if (i === xs.length - 1 || i < 0) {
        const n = xs.length - 1;
        return ys[n] + (ys[n] - ys[n - 1]) * (x - xs[n]) / (xs[n] - xs[n - 1]);
    }
    return ys[i] + (ys[i + 1] - ys[i]) * (x - xs[i]) / (xs[i + 1] - xs[i]);
};
// Jumping across a gap. Vertical (countermovement) jump of adults 20–39, Xi'an 2010 fitness monitoring, 2,586 adults (ICSSTE
// 2015 proceedings, Atlantis Press article 18807, Table 3): men 35.8, 33.6, 32.1, 30.3 cm at 20–24, 25–29, 30–34, 35–39; women 25.6, 22.5, 21.1, 20.0. Past
// 40 it falls as relative jump power does in 386 adults of Pune (J Musculoskelet Neuronal Interact 24:243,
// Table 6: men 41.0, 37.2, 32.2 W/kg at 31–40, 41–50, 51–60; women 29.2, 25.2, 21.8), continued in a line after 60
// [ASSUMED: height ∝ relative power]. Spread 18 % of the mean (the table's 25–39 SDs) and one z per person [ASSUMED].
const JUMP_AGES = [22, 27, 32, 37], JUMP = { male: [35.8, 33.6, 32.1, 30.3], female: [25.6, 22.5, 21.1, 20.0] };
const POWER_AGES = [35.5, 45.5, 55.5], POWER = { male: [41.0, 37.2, 32.2], female: [29.2, 25.2, 21.8] };
/** The jump norms start at 20: under 18 the jump is not worked out from them. */
export const JUMP_MIN_AGE = 18;
export function jumpHeightM(p) {
    const s = p.sex === 'female' ? 'female' : 'male', a = p.age ?? 30;
    const base = a <= 37 ? lerp(JUMP_AGES, JUMP[s], a) : JUMP[s][3] * Math.max(0.3, lerp(POWER_AGES, POWER[s], a) / lerp(POWER_AGES, POWER[s], 37));
    return Math.max(0.03, base * (1 + 0.18 * (p.jumpZ ?? 0)) / 100);
}
// The jump as a projectile: take-off vertical speed √(2 g h), flight 2 v_z / g (landing as high as the take-off). Horizontal
// speed with a run-up: a share of the person's own top speed (Chase), less on a short run-up as √(run-up ÷ full run-up)
// [ASSUMED constant acceleration]; standing, the push is as fast forward as up (45°) [ASSUMED]. Distance = v_x × flight + the
// body's reach (feet behind at take-off, ahead at landing) of 0.33 × stature [FITTED: a man of 25 then jumps about 2.0 m
// standing, the middle of the usual adult range]. Each try varies by 5 % of the distance [ASSUMED].
def({ id: 'takeoffShare', value: 0.75, unit: 'take-off speed ÷ top running speed', status: 'assumed', src: 'elite long jumpers reach 95–99 % of top speed and keep 83 % of it through take-off (10.6 → 8.8 m/s men, 9.5 → 8.0 women; Linthorne 2007), about 0.81; untrained jumpers lose more aiming for the edge', range: [0.6, 0.81], file: 'feats.ts' });
def({ id: 'fullRunUpM', value: 15, unit: 'm of run-up to reach take-off speed', status: 'assumed', src: 'sprinters reach most of their speed within about 15–30 m', range: [8, 25], file: 'feats.ts' });
def({ id: 'jumpReach', value: 0.33, unit: '× stature added to the flight', status: 'fitted', src: 'standing long jump about 2 m for a young man (adult norm tables)', range: [0.25, 0.42], file: 'feats.ts' });
export function jumpDistanceM(p, runUpM, topSpeedMs) {
    const vz = Math.sqrt(2 * 9.81 * jumpHeightM(p)), t = 2 * vz / 9.81;
    const vx = runUpM >= 1 ? k('takeoffShare') * topSpeedMs * Math.min(1, Math.sqrt(runUpM / k('fullRunUpM'))) : vz;
    return vx * t + k('jumpReach') * (p.heightCm ?? (p.sex === 'female' ? 162.6 : 175.5)) / 100;
}
def({ id: 'tryCv', value: 0.05, unit: 'spread of one try at a feat, × the capacity', status: 'assumed', src: 'a judgement: repeated jumps and lifts of one person vary by a few per cent', range: [0.03, 0.08], file: 'feats.ts' });
export const featChance = (capacity, demand) => phi((capacity - demand) / (k('tryCv') * capacity));
// Lifting a load from the floor to waist height, once: the Liberty Mutual manual-handling tables (Snook & Ciriello 1991, as
// tabulated by T. Bernard, USF, 2022: floor to knuckle, once per 8 h, hands 17 cm in front, 51 cm lift): 22 kg acceptable to
// 75 % of women; men 2 × (44 kg, 75 %) and about 2.7 × (59 kg, 25 %). Men's capacity normal through those two points: median
// 51.5 kg, SD 11.1; women's the same spread relative to the mean: median 25.7, SD 5.6 [FITTED]. These are loads lifted without
// overexertion, not a one-off all-out lift. Age by the grip norms (Dodds 2014) against the person's sex at 30 [ASSUMED]; each
// person's own capacity correlates 0.6 with their grip [ASSUMED].
def({ id: 'liftGripR', value: 0.6, unit: 'correlation of a person\'s lifting capacity with their grip', status: 'assumed', src: 'a judgement: grip tracks overall strength', range: [0.4, 0.8], file: 'feats.ts' });
export function liftCapacityKg(p) {
    const f = p.sex === 'female', median = f ? 25.7 : 51.5, sd = f ? 5.6 : 11.1;
    const age = gripNorm(p.age ?? 30, f ? 'female' : 'male').mean / gripNorm(30, f ? 'female' : 'male').mean;
    const r = k('liftGripR'), z = r * (p.gripZ ?? 0) + Math.sqrt(1 - r * r) * (p.liftZ ?? 0);
    return Math.max(1, (median + z * sd) * age);
}
/** Draws a person's own jump and lift z once. */
export function featZ(p, gauss) {
    // The grip z is drawn here when no grip has been asked yet, so the lift's share of it stays fixed (strength.ts draws it the
    // same way).
    p.gripZ ??= Math.round(gauss() * 100) / 100;
    p.jumpZ ??= Math.round(gauss() * 100) / 100;
    p.liftZ ??= Math.round(gauss() * 100) / 100;
}
// A handgun shot at a person (BodyCheck `shot_m`): the shots spread around the aim point by an angle, so the chance of landing
// on the body is 1 − e^(−(R ÷ σ d)²), d the distance and R the radius of a disc of the target's frontal area, 0.6 m² for an 80
// kg adult, scaled by mass^(2/3) [ASSUMED]; the same law as for arrows (§4.4b). The spread σ is fitted so that, over the
// distances at which New York police fired in 2011 (1–5 yards 53 %, 6–15 yards 38 %, 16–25 yards 9 %; NYPD Annual Firearms
// Discharge Report 2011), 30 % of shots hit, the NYPD rate when the officers were not fired upon (RAND 2008; Dallas 2003–2017:
// 35 % of 354 rounds, Donner & Popovich 2019): σ = 0.185 rad [FITTED]. Fired upon, × 0.6 (18 % against 30 %, RAND 2008). The
// shooter is taken as a trained police officer [ASSUMED]; daylight raised hits in Dallas, by an amount not given (left out).
def({ id: 'handgunSigma', value: 0.185, unit: 'rad, spread of handgun shots in a real shooting', status: 'fitted', src: 'NYPD 2011 shooting distances, 30 % of shots hit when not fired upon (RAND 2008)', range: [0.15, 0.22], file: 'feats.ts' });
def({ id: 'frontAreaM2', value: 0.6, unit: 'm², frontal area of an 80 kg adult', status: 'assumed', src: 'a standing adult seen from the front', range: [0.45, 0.75], file: 'feats.ts' });
export function handgunHitChance(distanceM, targetMassKg = 80, underFire = false) {
    const R = Math.sqrt(k('frontAreaM2') * (Math.max(5, targetMassKg) / 80) ** (2 / 3) / Math.PI), sr = k('handgunSigma') * Math.max(0.3, distanceM);
    return (1 - Math.exp(-((R / sr) ** 2))) * (underFire ? 0.6 : 1);
}
