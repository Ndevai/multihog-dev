import { aerobicFactor } from './thermal/altitude.js';
export const TERRAIN = { road: 1.0, 'dirt road': 1.1, 'light brush': 1.2, 'heavy brush': 1.5, swamp: 1.8, 'loose sand': 2.1,
    'snow 15 cm': 2.5, 'snow 25 cm': 3.3, 'snow 35 cm': 4.1 };
// Walking pace when the story gives none: Tobler's hiking function W = 6·e^(−3.5·|S + 0.05|) km/h, S = slope as rise ÷ run
// (Tobler 1993, NCGIA Technical Report 93-1, Fig. II, fitted to Imhof 1950); off roads × 0.6. Scaled by normal gait speed
// for age and sex ÷ Tobler's flat 5.04 km/h (Bohannon & Andrews 2011, Physiotherapy 97:182, Table 2, cm/s: men 20s 135.8,
// 30s 143.3, 40s 143.4, 50s 143.3, 60s 133.9, 70s 126.2, 80+ 96.8; women 134.1, 133.7, 139.0, 131.3, 124.1, 113.2, 94.3)
// [ASSUMED: the age-sex ratio carries over to slopes].
const GAIT = { male: [135.8, 143.3, 143.4, 143.3, 133.9, 126.2, 96.8], female: [134.1, 133.7, 139.0, 131.3, 124.1, 113.2, 94.3] };
// Pace of life by country: mean seconds for a lone adult to walk 60 ft (18.3 m) downtown on a clear summer working morning
// (Levine & Norenzayan 1999, J Cross-Cult Psychol 30:178, Table 1, about 1990s; 31 countries, mean 13.54 s). The walk
// is scaled by the 31-country mean ÷ the country's seconds: Ireland 11.13 s → × 1.19, Brazil 16.76 s → × 0.79 [ASSUMED:
// carries to other years, places outside downtowns and the age-sex gait above, whose samples are taken as the 31-country mean].
const PACE_S = { 'Switzerland': 11.80, 'Ireland': 11.13, 'Germany': 12.01, 'Japan': 12.11, 'Italy': 12.75, 'United Kingdom of Great Britain and Northern Ireland': 12.00, 'Sweden': 12.92, 'Austria': 14.08, 'Netherlands (Kingdom of the)': 11.45, 'Hong Kong, China': 13.10, 'France': 12.34, 'Poland': 12.90, 'Costa Rica': 13.33, 'Taiwan': 13.58, 'Singapore': 14.75, 'United States of America': 12.03, 'Canada': 12.86, 'Republic of Korea': 13.76, 'Hungary': 13.75, 'Czechia': 13.80, 'Greece': 13.10, 'Kenya': 12.58, 'China': 14.26, 'Bulgaria': 15.57, 'Romania': 16.72, 'Jordan': 15.79, 'Syrian Arab Republic': 15.95, 'El Salvador': 14.04, 'Brazil': 16.76, 'Indonesia': 14.82, 'Mexico': 13.56 };
const PACE_MEAN_S = Object.values(PACE_S).reduce((s, x) => s + x, 0) / Object.keys(PACE_S).length;
export function walkSpeedKmh(gradePct = 0, terrain = 'dirt road', age = 35, sex = 'male', country = null) {
    const tobler = 6 * Math.exp(-3.5 * Math.abs(gradePct / 100 + 0.05)) * (/road/.test(terrain) ? 1 : 0.6);
    const g = GAIT[sex === 'female' ? 'female' : 'male'][Math.max(0, Math.min(6, Math.floor(age / 10) - 2))];
    const pace = country && PACE_S[country] ? PACE_MEAN_S / PACE_S[country] : 1;
    return tobler * (g * 0.036) / 5.04 * pace;
}
// Downhill: Pandolf with the negative grade, minus the Santee et al. 2001 correction CF = η [G (W + L) V ÷ 3.5 − (W + L)
// (G + 6)² ÷ W + 25 − V²] (as recalled; −5 % at 1.34 m/s gives 82 % of level cost, −10 % gives 77 %) [ASSUMED: unverified].
/** Metabolic rate (W) walking. */
export function pandolf(bodyKg, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null)
        throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const W = bodyKg, L = loadKg || 0, V = speedMs, G = gradePct || 0;
    const m = 1.5 * W + 2.0 * (W + L) * (L / W) ** 2 + eta * (W + L) * (1.5 * V ** 2 + 0.35 * V * G);
    return G >= 0 ? m : m - eta * (G * (W + L) * V / 3.5 - (W + L) * (G + 6) ** 2 / W + 25 - V ** 2);
}
// Running: ACSM running equation, VO2 (mL/kg/min) = 0.2 v + 0.9 v × grade + 3.5, v in m/min, grade as a fraction (as given
// by Dugas et al. 2023, J Clin Med 12:7835, citing ACSM Guidelines). Load scales the cost by (body + load) ÷ body, terrain η
// multiplies the horizontal term, downhill counts as level [ASSUMED].
export function runWatts(bodyKg, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null)
        throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const v = speedMs * 60, vo2 = eta * 0.2 * v + 0.9 * v * Math.max(0, gradePct || 0) / 100 + 3.5;
    return vo2 / 3.5 * 1.163 * bodyKg * (bodyKg + (loadKg || 0)) / bodyKg;
}
/** METs of that work: W ÷ (1.163 W/kg × body kg) (1 MET = 1 kcal/kg/h). */
export const metOf = (watts, bodyKg) => watts / (1.163 * bodyKg);
// Endurance. VO2max of untrained people (Shvartz & Reibold 1990, Aviat Space Environ Med 61:3, review of direct measurements in
// the USA, Canada and 7 European countries): men 47.5 at age 6, peak 50 at 12–13, then linear to 25 at 75; women 42.5 at 6, peak
// 44 at 9, linear to 17.5 at 75 (mL/kg/min). Spread per person: SD 8.4 (men), 7.7 (women) (Loe et al. 2013, PLoS One 8:e64319,
// HUNT, 3816 people); each person keeps a z drawn once. Relative load = (METs − 1) ÷ (VO2max ÷ 3.5 − 1) [ASSUMED: heart-rate
// reserve share ≈ VO2 reserve share]. Maximum acceptable work time (h) = 26.12 × e^(−4.81 × relative load) (Wu & Wang 2002,
// Ergonomics 45:280, as given by Park et al. 2023, Ann Occup Environ Med 35:e24); time spent ÷ that time adds up, and at 1 the
// person is exhausted.
const lerp = (x, x0, y0, x1, y1) => y0 + (y1 - y0) * (Math.min(Math.max(x, x0), x1) - x0) / (x1 - x0);
export function vo2max(p, gauss) {
    if (p.fitZ == null && gauss)
        p.fitZ = Math.round(gauss() * 100) / 100;
    const female = p.sex === 'female', a = p.age ?? 25;
    const mean = female ? (a < 9 ? lerp(a, 6, 42.5, 9, 44) : lerp(a, 9, 44, 75, 17.5)) : (a < 12.5 ? lerp(a, 6, 47.5, 12.5, 50) : lerp(a, 12.5, 50, 75, 25));
    return mean + (p.fitZ ?? 0) * (female ? 7.7 : 8.4);
}
// Available VO2max: × the altitude factor (§6.6), minus 4 mL/min per g of haemoglobin missing (Schmidt & Prommer 2010, Exerc
// Sport Sci Rev 38:68). Haemoglobin 150 g/L men, 135 women [ASSUMED typical]; missing blood = lost + red-cell deficit (§5).
export function vo2avail(p, gauss) {
    const hbG = ((p.lost ?? 0) + (p.red ?? 0)) / 1000 * (p.sex === 'female' ? 135 : 150);
    return Math.max(3.5, vo2max(p, gauss) * aerobicFactor(p.altitude?.m ?? 0) - 4 * hbG / p.mass);
}
export const relativeLoad = (met, p, gauss) => Math.max(0, (met - 1) / (Math.max(10.5, vo2avail(p, gauss)) / 3.5 - 1));
export const mawtHours = (load) => 26.12 * Math.exp(-4.81 * load);
