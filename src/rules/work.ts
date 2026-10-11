import { aerobicFactor } from './thermal/altitude.js';
// Walking with a load (docs/df-body-engine.md §6.7): Pandolf, Givoni & Goldman 1977 (J Appl Physiol 43:577), as given on
// Wikipedia "Pandolf equation": M (W) = 1.5 W + 2.0 (W + L)(L / W)² + η (W + L)(1.5 V² + 0.35 V G); W body kg, L load kg,
// V m/s, G grade %. Terrain η: Soule & Goldman 1972 (J Appl Physiol 32:706).
import type { Person, Gauss } from './types.js';

export const TERRAIN: Record<string, number> = { road: 1.0, 'dirt road': 1.1, 'light brush': 1.2, 'heavy brush': 1.5, swamp: 1.8, 'loose sand': 2.1,
    'snow 15 cm': 2.5, 'snow 25 cm': 3.3, 'snow 35 cm': 4.1 };

// Downhill: Pandolf with the negative grade, minus the Santee et al. 2001 correction CF = η [G (W + L) V ÷ 3.5 − (W + L)
// (G + 6)² ÷ W + 25 − V²] (as recalled; −5 % at 1.34 m/s gives 82 % of level cost, −10 % gives 77 %) [ASSUMED: unverified].
/** Metabolic rate (W) walking. */
export function pandolf(bodyKg: number, loadKg: number | null | undefined, speedMs: number, gradePct: number | null | undefined = 0, terrain = 'dirt road'): number {
    const eta = TERRAIN[terrain];
    if (eta == null) throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const W = bodyKg, L = loadKg || 0, V = speedMs, G = gradePct || 0;
    const m = 1.5 * W + 2.0 * (W + L) * (L / W) ** 2 + eta * (W + L) * (1.5 * V ** 2 + 0.35 * V * G);
    return G >= 0 ? m : m - eta * (G * (W + L) * V / 3.5 - (W + L) * (G + 6) ** 2 / W + 25 - V ** 2);
}

// Running: ACSM running equation, VO2 (mL/kg/min) = 0.2 v + 0.9 v × grade + 3.5, v in m/min, grade as a fraction (as given
// by Dugas et al. 2023, J Clin Med 12:7835, citing ACSM Guidelines). Load scales the cost by (body + load) ÷ body, terrain η
// multiplies the horizontal term, downhill counts as level [ASSUMED].
export function runWatts(bodyKg: number, loadKg: number | null | undefined, speedMs: number, gradePct: number | null | undefined = 0, terrain = 'dirt road'): number {
    const eta = TERRAIN[terrain];
    if (eta == null) throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const v = speedMs * 60, vo2 = eta * 0.2 * v + 0.9 * v * Math.max(0, gradePct || 0) / 100 + 3.5;
    return vo2 / 3.5 * 1.163 * bodyKg * (bodyKg + (loadKg || 0)) / bodyKg;
}

/** METs of that work: W ÷ (1.163 W/kg × body kg) (1 MET = 1 kcal/kg/h). */
export const metOf = (watts: number, bodyKg: number) => watts / (1.163 * bodyKg);

// Endurance. VO2max of untrained people (Shvartz & Reibold 1990, Aviat Space Environ Med 61:3, review of direct measurements in
// the USA, Canada and 7 European countries): men 47.5 at age 6, peak 50 at 12–13, then linear to 25 at 75; women 42.5 at 6, peak
// 44 at 9, linear to 17.5 at 75 (mL/kg/min). Spread per person: SD 8.4 (men), 7.7 (women) (Loe et al. 2013, PLoS One 8:e64319,
// HUNT, 3816 people); each person keeps a z drawn once. Relative load = (METs − 1) ÷ (VO2max ÷ 3.5 − 1) [ASSUMED: heart-rate
// reserve share ≈ VO2 reserve share]. Maximum acceptable work time (h) = 26.12 × e^(−4.81 × relative load) (Wu & Wang 2002,
// Ergonomics 45:280, as given by Park et al. 2023, Ann Occup Environ Med 35:e24); time spent ÷ that time adds up, and at 1 the
// person is exhausted.
const lerp = (x: number, x0: number, y0: number, x1: number, y1: number) => y0 + (y1 - y0) * (Math.min(Math.max(x, x0), x1) - x0) / (x1 - x0);
export function vo2max(p: Person, gauss?: Gauss): number {
    if (p.fitZ == null && gauss) p.fitZ = Math.round(gauss() * 100) / 100;
    const female = p.sex === 'female', a = p.age ?? 25;
    const mean = female ? (a < 9 ? lerp(a, 6, 42.5, 9, 44) : lerp(a, 9, 44, 75, 17.5)) : (a < 12.5 ? lerp(a, 6, 47.5, 12.5, 50) : lerp(a, 12.5, 50, 75, 25));
    return mean + (p.fitZ ?? 0) * (female ? 7.7 : 8.4);
}
// Available VO2max: × the altitude factor (§6.6), minus 4 mL/min per g of haemoglobin missing (Schmidt & Prommer 2010, Exerc
// Sport Sci Rev 38:68). Haemoglobin 150 g/L men, 135 women [ASSUMED typical]; missing blood = lost + red-cell deficit (§5).
export function vo2avail(p: Person, gauss?: Gauss): number {
    const hbG = ((p.lost ?? 0) + (p.red ?? 0)) / 1000 * (p.sex === 'female' ? 135 : 150);
    return Math.max(3.5, vo2max(p, gauss) * aerobicFactor(p.altitude?.m ?? 0) - 4 * hbG / p.mass);
}
export const relativeLoad = (met: number, p: Person, gauss?: Gauss) => Math.max(0, (met - 1) / (Math.max(10.5, vo2avail(p, gauss)) / 3.5 - 1));
export const mawtHours = (load: number) => 26.12 * Math.exp(-4.81 * load);
