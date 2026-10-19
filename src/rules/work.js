import { aerobicFactor } from './thermal/altitude.js';
import { def, k } from './constants.js';
export const TERRAIN = { road: 1.0, 'dirt road': 1.1, 'light brush': 1.2, 'heavy brush': 1.5, swamp: 1.8, 'loose sand': 2.1,
    'snow 15 cm': 2.5, 'snow 25 cm': 3.3, 'snow 35 cm': 4.1 };
// Walking cost: Load Carriage Decision Aid (Looney et al. 2022, Med Sci Sports Exerc 54:1251, PMC8919998, Eq. 4; bias
// −0.08 ± 0.59 W/kg on 7 outside data sets, speeds 0.45–1.97 m/s, backpacks to 66 % of body mass):
// M (W/kg body) = rest + [0.19 + η (1.78 S^0.58 + 0.27 S⁴ + 34 S G (1 − 1.05^(1 − 1.1^(100 G + 32))))] × (1 + 1.96 (L/W)^1.36),
// S m/s, G rise ÷ run, η Soule & Goldman terrain. The grade term (LCDA graded walking) was not validated in that study.
// Rest: Cunningham 500 + 22 × lean kg kcal/day (as used there), lean share 0.80 men, 0.70 women, at 70 kg [ASSUMED] → 1.20 / 1.09 W/kg.
export function walkWkg(sex, loadShare, speedMs, grade, eta) {
    const rest = (500 + 22 * (sex === 'female' ? 0.70 : 0.80) * 70) * 4184 / 86400 / 70;
    const g = 34 * speedMs * grade * (1 - 1.05 ** (1 - 1.1 ** (100 * grade + 32)));
    return rest + (0.19 + eta * (1.78 * speedMs ** 0.58 + 0.27 * speedMs ** 4 + g)) * (1 + 1.96 * Math.max(0, loadShare) ** 1.36);
}
/** Metabolic rate (W) walking. */
export function walkWatts(p, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null)
        throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    return walkWkg(p.sex, (loadKg || 0) / p.mass, speedMs, (gradePct || 0) / 100, eta) * p.mass;
}
// Cheapest speed per metre: the S that minimises M ÷ S (golden-section search, 0.2–2.5 m/s). Level road, no load: 1.31 m/s men.
export function cheapestMs(sex, loadShare, grade, eta) {
    const f = (v) => walkWkg(sex, loadShare, v, grade, eta) / v;
    let lo = 0.2, hi = 2.5;
    const k = (Math.sqrt(5) - 1) / 2;
    for (let i = 0; i < 60; i++) {
        const a = hi - k * (hi - lo), b = lo + k * (hi - lo);
        if (f(a) < f(b))
            hi = b;
        else
            lo = a;
    }
    return (lo + hi) / 2;
}
// Walking pace when the story gives none (docs/df-body-engine.md §6.7a). Level road, no load: normal gait speed by age and
// sex (Bohannon & Andrews 2011, Physiotherapy 97:182, Table 2, cm/s: men 20s 135.8, 30s 143.3, 40s 143.4, 50s 143.3, 60s
// 133.9, 70s 126.2, 80+ 96.8; women 134.1, 133.7, 139.0, 131.3, 124.1, 113.2, 94.3) × the country's pace of life. Measured
// speed wins over the energy optimum (1.31 m/s men), which it matches within 10 % from 20 to 69.
// Ground and load: the speed moves with the cheapest speed, × cheapest(η, load) ÷ cheapest(road, none).
// Slope and heavy going: the walker spends at most the larger of (a) the power of their level walk and (b) the power they
// could keep up for H hours (Wu & Wang 2002 time limit on their own VO2max, §6.7b); speed falls until the cost fits.
// H = WALK_HOURS = 2.8 h, fitted to Tobler's hiking function (Tobler 1993, NCGIA TR 93-1) for a man of 35 at 0–30 % uphill (RMS error 0.39 km/h)
// [ASSUMED: fitted]. Downhill steeper than −5 %: × Tobler's fall from its −5 % peak (footing and braking, not energy) [ASSUMED].
const GAIT = { male: [135.8, 143.3, 143.4, 143.3, 133.9, 126.2, 96.8], female: [134.1, 133.7, 139.0, 131.3, 124.1, 113.2, 94.3] };
// Pace of life by country: mean seconds for a lone adult to walk 60 ft (18.3 m) downtown on a clear summer working morning
// (Levine & Norenzayan 1999, J Cross-Cult Psychol 30:178, Table 1, about 1990s; 31 countries, mean 13.54 s). The walk
// is scaled by the 31-country mean ÷ the country's seconds: Ireland 11.13 s → × 1.19, Brazil 16.76 s → × 0.79 [ASSUMED:
// carries to other years, places outside downtowns and the age-sex gait above, whose samples are taken as the 31-country mean].
const PACE_S = { 'Switzerland': 11.80, 'Ireland': 11.13, 'Germany': 12.01, 'Japan': 12.11, 'Italy': 12.75, 'United Kingdom of Great Britain and Northern Ireland': 12.00, 'Sweden': 12.92, 'Austria': 14.08, 'Netherlands (Kingdom of the)': 11.45, 'Hong Kong, China': 13.10, 'France': 12.34, 'Poland': 12.90, 'Costa Rica': 13.33, 'Taiwan': 13.58, 'Singapore': 14.75, 'United States of America': 12.03, 'Canada': 12.86, 'Republic of Korea': 13.76, 'Hungary': 13.75, 'Czechia': 13.80, 'Greece': 13.10, 'Kenya': 12.58, 'China': 14.26, 'Bulgaria': 15.57, 'Romania': 16.72, 'Jordan': 15.79, 'Syrian Arab Republic': 15.95, 'El Salvador': 14.04, 'Brazil': 16.76, 'Indonesia': 14.82, 'Mexico': 13.56 };
const PACE_MEAN_S = Object.values(PACE_S).reduce((s, x) => s + x, 0) / Object.keys(PACE_S).length;
def({ id: 'walkHours', value: 2.8, unit: 'h', status: 'fitted', src: "fitted to Tobler's hiking function, man of 35, 0–30 % uphill (RMS 0.39 km/h)", range: [2, 4], file: 'work.ts' });
export const WALK_HOURS = 2.8;
const tobler = (G) => 6 * Math.exp(-3.5 * Math.abs(G + 0.05));
export function walkSpeedKmh(p, gradePct = 0, terrain = 'dirt road', loadKg = 0, country = null, hoursIn) {
    const hours = hoursIn ?? k('walkHours');
    const eta = TERRAIN[terrain];
    if (eta == null)
        throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const age = p.age ?? 35, sex = p.sex ?? 'male', G = gradePct / 100, Ls = (loadKg || 0) / p.mass;
    const pace = country && PACE_S[country] ? PACE_MEAN_S / PACE_S[country] : 1;
    const level = GAIT[sex === 'female' ? 'female' : 'male'][Math.max(0, Math.min(6, Math.floor(age / 10) - 2))] / 100 * pace;
    const want = level * cheapestMs(sex, Ls, 0, eta) / cheapestMs(sex, 0, 0, 1);
    const rl = Math.log(26.12 / hours) / 4.81, sustain = (1 + rl * (Math.max(10.5, vo2avail(p)) / 3.5 - 1)) * 1.163;
    const cap = Math.max(walkWkg(sex, 0, level, 0, 1), sustain);
    let v = want;
    if (walkWkg(sex, Ls, v, G, eta) > cap) {
        let lo = 0.05, hi = v;
        for (let i = 0; i < 50; i++) {
            const m = (lo + hi) / 2;
            if (walkWkg(sex, Ls, m, G, eta) > cap)
                hi = m;
            else
                lo = m;
        }
        v = lo;
    }
    if (G < -0.05)
        v *= tobler(G) / tobler(-0.05);
    return v * 3.6;
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
