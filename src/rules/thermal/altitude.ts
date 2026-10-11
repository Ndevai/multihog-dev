// Altitude (docs/df-body-engine.md §6.6).
// Air pressure: West 1996 (J Appl Physiol 81:1850): PB (Torr) = exp(6.63268 − 0.1112 h − 0.00149 h²), h in km; inspired O2
// = 0.2095 × (PB − 47).
export const pressureTorr = (m: number) => Math.exp(6.63268 - 0.1112 * (m / 1000) - 0.00149 * (m / 1000) ** 2);
export const inspiredO2 = (m: number) => 0.2095 * (pressureTorr(m) - 47);

// Aerobic capacity: VO2max −6.3 % per 1000 m above 300 m (Wehrlin & Hallén 2006, Eur J Appl Physiol 96:404; measured to
// 2800 m, linear beyond [ASSUMED]).
export const aerobicFactor = (m: number) => Math.max(0, 1 - 0.063 * Math.max(0, m - 300) / 1000);

// Acute mountain sickness after a night at the altitude (Maggiorini et al. 1990, BMJ 301:853, 466 climbers in Swiss Alps
// huts): 2850 m 9 %, 3050 m 13 %, 3650 m 34 %, 4559 m 53 %; linear between; 0 below 2500 m [ASSUMED]; held above 4559 m.
// Oedema (Adhikari & Zimmer 2026, BMJ, summarizing the WMS 2024 guidelines): cerebral (HACE) in up to 1 % at 4000–5000 m,
// pulmonary (HAPE) in up to 6 % at 4500 m; held above [ASSUMED]. Untreated HACE: coma and death within 12–24 h without
// descent; untreated HAPE: mortality up to 50 % (timing not given).
const AMS: [number, number][] = [[2500, 0], [2850, 0.09], [3050, 0.13], [3650, 0.34], [4559, 0.53]];
export function amsChance(m: number): number {
    if (m <= AMS[0][0]) return 0;
    for (let i = 1; i < AMS.length; i++) if (m <= AMS[i][0]) {
        const [a, pa] = AMS[i - 1], [b, pb] = AMS[i];
        return pa + (pb - pa) * (m - a) / (b - a);
    }
    return AMS.at(-1)![1];
}
export const haceChance = (m: number) => m >= 4000 ? 0.01 : 0;
export const hapeChance = (m: number) => m >= 4500 ? 0.06 : 0;
export const HACE_DEATH_H = [12, 24];

// Time of useful consciousness after sudden exposure (no acclimatization), sitting quietly: FAA AC 61-107B, Figure 2-3.
const TUC_QUIET: [number, number, number][] = [[18000, 20 * 60, 30 * 60], [22000, 600, 600], [25000, 180, 300], [28000, 150, 180], [30000, 60, 120], [35000, 30, 60], [40000, 15, 20], [43000, 9, 12]];
// Following rapid decompression (same figure): 18 000 ft 10–15 min, 22 000 ft 5–6 min, 25 000 ft 1.5–2.5 min, 28 000 ft 1–1.5 min,
// 30 000 ft 30–60 s, 35 000 ft 15–30 s; above, given as "nominal": the 40 000 ft quiet values are used [ASSUMED].
const TUC_DECOMP: [number, number, number][] = [[18000, 600, 900], [22000, 300, 360], [25000, 90, 150], [28000, 60, 90], [30000, 30, 60], [35000, 15, 30], [40000, 15, 20], [43000, 9, 12]];
/** Seconds of useful consciousness at m metres after a sudden arrival; null below 18 000 ft. Linear in feet between rows. */
export function tucRange(m: number, decompression = false): [number, number] | null {
    const TUC = decompression ? TUC_DECOMP : TUC_QUIET;
    const ft = m / 0.3048;
    if (ft < TUC[0][0]) return null;
    for (let i = 1; i < TUC.length; i++) if (ft <= TUC[i][0]) {
        const [a, a1, a2] = TUC[i - 1], [b, b1, b2] = TUC[i], f = (ft - a) / (b - a);
        return [a1 + (b1 - a1) * f, a2 + (b2 - a2) * f];
    }
    return [9, 12];
}

/** Altitude (m) whose air gives the same inspired oxygen as `o2Pct` % oxygen at `baseM` m (hypoxic-room equivalence). */
export function equivalentAltitude(o2Pct: number, baseM = 0): number {
    const target = o2Pct / 100 * (pressureTorr(baseM) - 47);
    let lo = 0, hi = 20000;
    for (let k = 0; k < 50; k++) { const mid = (lo + hi) / 2; if (inspiredO2(mid) > target) lo = mid; else hi = mid; }
    return Math.round((lo + hi) / 2);
}
