// Altitude (docs/df-body-engine.md §6.6).
// Air pressure: West 1996 (J Appl Physiol 81:1850): PB (Torr) = exp(6.63268 − 0.1112 h − 0.00149 h²), h in km; inspired O2
// = 0.2095 × (PB − 47).
export const pressureTorr = m => Math.exp(6.63268 - 0.1112 * (m / 1000) - 0.00149 * (m / 1000) ** 2);
export const inspiredO2 = m => 0.2095 * (pressureTorr(m) - 47);

// Aerobic capacity: VO2max −6.3 % per 1000 m above 300 m (Wehrlin & Hallén 2006, Eur J Appl Physiol 96:404; measured to
// 2800 m, linear beyond [ASSUMED]).
export const aerobicFactor = m => Math.max(0, 1 - 0.063 * Math.max(0, m - 300) / 1000);

// Acute mountain sickness after a night at the altitude (Maggiorini et al. 1990, BMJ 301:853, 466 climbers in Swiss Alps
// huts): 2850 m 9 %, 3050 m 13 %, 3650 m 34 %, 4559 m 53 %; linear between; 0 below 2500 m [ASSUMED]; held above 4559 m.
// High-altitude pulmonary or cerebral oedema: 11 of 209 at 4559 m (5.3 %).
const AMS = [[2500, 0], [2850, 0.09], [3050, 0.13], [3650, 0.34], [4559, 0.53]];
export function amsChance(m) {
    if (m <= AMS[0][0]) return 0;
    for (let i = 1; i < AMS.length; i++) if (m <= AMS[i][0]) {
        const [a, pa] = AMS[i - 1], [b, pb] = AMS[i];
        return pa + (pb - pa) * (m - a) / (b - a);
    }
    return AMS.at(-1)[1];
}
export const oedemaChance = m => m >= 4559 ? 11 / 209 : 0;

// Time of useful consciousness after sudden exposure (no acclimatization), sitting quietly: FAA AC 61-107B, Figure 2-3.
const TUC = [[18000, 20 * 60, 30 * 60], [22000, 600, 600], [25000, 180, 300], [28000, 150, 180], [30000, 60, 120], [35000, 30, 60], [40000, 15, 20], [43000, 9, 12]];
/** Seconds of useful consciousness at m metres after a sudden arrival; null below 18 000 ft. Linear in feet between rows. */
export function tucRange(m) {
    const ft = m / 0.3048;
    if (ft < TUC[0][0]) return null;
    for (let i = 1; i < TUC.length; i++) if (ft <= TUC[i][0]) {
        const [a, a1, a2] = TUC[i - 1], [b, b1, b2] = TUC[i], f = (ft - a) / (b - a);
        return [a1 + (b1 - a1) * f, a2 + (b2 - a2) * f];
    }
    return [9, 12];
}
