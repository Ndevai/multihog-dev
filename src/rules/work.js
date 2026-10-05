// Walking with a load (docs/df-body-engine.md §6.7): Pandolf, Givoni & Goldman 1977 (J Appl Physiol 43:577), as given on
// Wikipedia "Pandolf equation": M (W) = 1.5 W + 2.0 (W + L)(L / W)² + η (W + L)(1.5 V² + 0.35 V G); W body kg, L load kg,
// V m/s, G grade %. Terrain η: Soule & Goldman 1972 (J Appl Physiol 32:706).
export const TERRAIN = { road: 1.0, 'dirt road': 1.1, 'light brush': 1.2, 'heavy brush': 1.5, swamp: 1.8, 'loose sand': 2.1,
    'snow 15 cm': 2.5, 'snow 25 cm': 3.3, 'snow 35 cm': 4.1 };

/** Metabolic rate (W) walking; downhill grades count as level [ASSUMED: Pandolf is for level and uphill]. */
export function pandolf(bodyKg, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null) throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const W = bodyKg, L = loadKg || 0, V = speedMs, G = Math.max(0, gradePct || 0);
    return 1.5 * W + 2.0 * (W + L) * (L / W) ** 2 + eta * (W + L) * (1.5 * V ** 2 + 0.35 * V * G);
}

// Running: ACSM running equation, VO2 (mL/kg/min) = 0.2 v + 0.9 v × grade + 3.5, v in m/min, grade as a fraction (as given
// by Dugas et al. 2023, J Clin Med 12:7835, citing ACSM Guidelines). Load scales the cost by (body + load) ÷ body, terrain η
// multiplies the horizontal term, downhill counts as level [ASSUMED].
export function runWatts(bodyKg, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null) throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const v = speedMs * 60, vo2 = eta * 0.2 * v + 0.9 * v * Math.max(0, gradePct || 0) / 100 + 3.5;
    return vo2 / 3.5 * 1.163 * bodyKg * (bodyKg + (loadKg || 0)) / bodyKg;
}

/** METs of that work: W ÷ (1.163 W/kg × body kg) (1 MET = 1 kcal/kg/h). */
export const metOf = (watts, bodyKg) => watts / (1.163 * bodyKg);

// Endurance. VO2max: healthy Norwegians 20–29 y, men 54.4, women 43.0 mL/kg/min, −3.5 per decade (Loe et al. 2013, PLoS One
// 8:e64319, HUNT, 3816 people). Relative load = (METs − 1) ÷ (VO2max ÷ 3.5 − 1) [ASSUMED: heart-rate reserve share ≈ VO2
// reserve share]. Maximum acceptable work time (h) = 26.12 × e^(−4.81 × relative load) (Wu & Wang 2002, Ergonomics 45:280, as
// given by Park et al. 2023, Ann Occup Environ Med 35:e24); time spent ÷ that time adds up, and at 1 the person is exhausted.
// Each person keeps a fitness z drawn once from N(0, 1): SD 8.4 (men) and 7.7 (women) mL/kg/min (same study).
export function vo2max(p, gauss) {
    if (p.fitZ == null && gauss) p.fitZ = Math.round(gauss() * 100) / 100;
    const female = p.sex === 'female';
    return (female ? 43.0 : 54.4) + (p.fitZ ?? 0) * (female ? 7.7 : 8.4) - 3.5 * Math.max(0, ((p.age ?? 25) - 25) / 10);
}
export const relativeLoad = (met, p, gauss) => Math.max(0, (met - 1) / (Math.max(10.5, vo2max(p, gauss)) / 3.5 - 1));
export const mawtHours = load => 26.12 * Math.exp(-4.81 * load);
