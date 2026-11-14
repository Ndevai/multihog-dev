// Growth from childhood to adulthood (docs/df-body-engine.md, "Growth"). An age is evidence, not a stage: the player
// (2026-11-11) named "teenager" a label with several sources behind it, so what is kept is each person's causes: their
// adult height (body-size.ts) and the timing of their growth, one draw (timingZ) against their sex. Height at an age, the
// male puberty's progress, and through them the tract and the folds (voice-sound.ts) are computed from those. The layer used
// is the growth curve of stature; the next one down (the hormones that set its timing and the larynx's growth) has no model.
import { def, peek } from './constants.js';
import { WHO_GROWTH } from './data/who-growth.js';
// Preece & Baines 1978 Model 1 (Ann Hum Biol 5:1, Table 7; the Harpenden Growth Study, 35 boys and 23 girls measured to
// adulthood): h = h1 − 2 (h1 − hθ) ÷ (e^(s0 (t − θ)) + e^(s1 (t − θ))), t in years, fitted from age 2. Means (SD): boys h1
// 174.6 (6.0), hθ 162.9 (5.6), s0 0.1124, s1 1.2397, θ 14.60 (0.93); girls 163.4 (5.1), 152.7 (5.2), 0.1320, 1.1785, 12.49
// (0.74). h1 and hθ correlate 0.97, h1 and θ 0.07 (boys) and 0.11 (girls): the curve's shape is kept as the share of adult
// height (hθ ÷ h1) and the person's own adult height and θ are drawn apart. Their mean age at peak height velocity is 14.17
// (boys) and 11.87 (girls) (Table 11, 12); a Wrocław cohort measured 2008–16 gives 14.06 ± 1.11 and 11.89 ± 1.00 (Kozieł
// & Malina 2018, Sports Med 48:221, PMC5752743).
export const PB1 = {
    male: { h1: 174.6, hTheta: 162.9, s0: 0.1124, s1: 1.2397, theta: 14.60, thetaSd: 0.93 },
    female: { h1: 163.4, hTheta: 152.7, s0: 0.1320, s1: 1.1785, theta: 12.49, thetaSd: 0.74 },
};
const sexKey = (male) => male ? 'male' : 'female';
const pbShare = (male, t, theta) => {
    const p = PB1[sexKey(male)];
    return 1 - 2 * (1 - p.hTheta / p.h1) / (Math.exp(p.s0 * (t - theta)) + Math.exp(p.s1 * (t - theta)));
};
/** The centre of the person's growth spurt, years: the sex's θ + its SD × timingZ. */
export const thetaOf = (male, timingZ = 0) => PB1[sexKey(male)].theta + PB1[sexKey(male)].thetaSd * timingZ;
/** A WHO reference's value at age t (years) and z: M (1 + L S z)^(1/L), L, M and S linear between the tabled ages (Cole 1990,
 * Eur J Clin Nutr 44:45); outside 0–19 the nearest end. */
export function whoAt(measure, male, t, z = 0) {
    const rows = WHO_GROWTH[measure][male ? 'M' : 'F'], x = Math.min(Math.max(t, rows[0][0]), rows[rows.length - 1][0]);
    let i = 0;
    while (i < rows.length - 2 && x > rows[i + 1][0])
        i++;
    const [a0, L0, M0, S0] = rows[i], [a1, L1, M1, S1] = rows[i + 1], w = a1 > a0 ? (x - a0) / (a1 - a0) : 0;
    const L = L0 + (L1 - L0) * w, M = M0 + (M1 - M0) * w, S = S0 + (S1 - S0) * w;
    return Math.abs(L) < 1e-6 ? M * Math.exp(S * z) : M * (1 + L * S * z) ** (1 / L);
}
/** The share of their adult height a person has at age t: Preece & Baines's curve from 5 years (its fit is poorest in the
 * youngest years: at 2.5 its mean curve gives boys 83 cm against WHO's 92); under 5, WHO's median height shape joined to it
 * at 5. */
export function heightShare(male, t, timingZ = 0) {
    const theta = thetaOf(male, timingZ);
    if (t >= 5)
        return pbShare(male, t, theta);
    return pbShare(male, 5, theta) * whoAt('hgt', male, Math.max(0, t)) / whoAt('hgt', male, 5);
}
/** The person's age at peak height velocity: where their share of adult height grows fastest (0.01-year steps). */
export function aphvOf(male, timingZ = 0) {
    const theta = thetaOf(male, timingZ);
    let best = theta, v = -Infinity;
    for (let t = theta - 4; t <= theta + 1; t += 0.01) {
        const d = pbShare(male, t + 0.005, theta) - pbShare(male, t - 0.005, theta);
        if (d > v) {
            v = d;
            best = t;
        }
    }
    return Math.round(best * 100) / 100;
}
// A boy's voice changes across puberty: speaking pitch falls between ages 12 and 15 (Lee, Potamianos & Narayanan 1999,
// JASA 105:1455, 436 children aged 5–17), most steeply between genital stages G3 and G4 and with testis volume (Harries et
// al. 1997, Arch Dis Child 77:445, 26 boys followed); boys reach peak height velocity at 14.06–14.17 on average (above).
// The change is placed from 2 years before the person's own peak height velocity to 1 year after, linear across it
// [ASSUMED: the 12–15 span set around the mean peak at 14].
def({ id: 'malePubertyFromPhv', value: -2, unit: "years from the person's peak height velocity when the male voice change starts", status: 'assumed', src: 'Lee et al. 1999: pitch falls from age 12; mean peak height velocity 14.1', range: [-3, -1], file: 'growth.ts' });
def({ id: 'malePubertyToPhv', value: 1, unit: "years from the person's peak height velocity when the male voice change ends", status: 'assumed', src: 'Lee et al. 1999: pitch reaches the adult range by 15; mean peak height velocity 14.1', range: [0, 2], file: 'growth.ts' });
/** How far a male's puberty has carried his larynx toward the adult man's: 0 before, 1 after. 0 for females. */
export function malePuberty(male, t, timingZ = 0) {
    if (!male)
        return 0;
    const phv = aphvOf(true, timingZ), a = phv + peek('malePubertyFromPhv'), b = phv + peek('malePubertyToPhv');
    return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a);
}
