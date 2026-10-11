// Daily weather from WGEN (Richardson & Wright 1984, USDA ARS-8; docs/df-body-engine.md §6.16). Rain: a first-order
// Markov chain for wet or dry days with monthly P(W/W) and P(W/D), amounts from a gamma distribution with monthly alpha and
// beta. Max and min temperature and solar radiation: residuals χ_i = A χ_{i−1} + B ε_i (eq. 3, A and B eqs. 10–11), value
// = m (χ c + 1) (eq. 13), m and c from seasonal harmonics u + C cos(0.0172 (i − T)) (eq. 14) on wet or dry days.
import { STATIONS } from './data/wgen-stations.js';
export const STATION_NAMES = Object.keys(STATIONS);
const A = [[0.567, 0.086, -0.002], [0.253, 0.504, -0.050], [-0.006, -0.039, 0.244]];
const B = [[0.781, 0, 0], [0.328, 0.637, 0], [0.238, -0.341, 0.873]];
const harm = (u, C, T, day) => u + C * Math.cos(0.0172 * (day - T));
const MONTH_START = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
const monthOf = (day) => MONTH_START.findLastIndex(s => day > s);
function normal(rng) {
    let u = 0;
    while (!u)
        u = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}
// Gamma(alpha, 1) by Marsaglia & Tsang 2000, with the alpha < 1 boost.
function gamma(alpha, rng) {
    if (alpha < 1)
        return gamma(alpha + 1, rng) * rng() ** (1 / alpha);
    const d = alpha - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
        const x = normal(rng), v = (1 + c * x) ** 3;
        if (v > 0 && Math.log(rng()) < x * x / 2 + d - d * v + d * Math.log(v))
            return d * v;
    }
}
const fToC = (f) => (f - 32) * 5 / 9;
// As in the WGEN program listing (Appendix C): residual normals beyond ±2.5 are redrawn, and coefficients of variation
// below 0.06 are raised to 0.06.
function residual(rng) {
    for (;;) {
        const v = normal(rng);
        if (Math.abs(v) <= 2.5)
            return v;
    }
}
const cvFloor = (c) => Math.max(0.06, c);
/** Days 1..`days` of one year at `station`: [{ wet, rainMm, tmaxC, tminC, radLy }]. */
export function simulateYear(station, days, rng) {
    const s = STATIONS[station], out = [];
    let wet = false, x = [0, 0, 0];
    for (let day = 1; day <= days; day++) {
        const m = monthOf(day);
        wet = rng() < (wet ? s.pww[m] : s.pwd[m]);
        const rainIn = wet ? gamma(s.alpha[m], rng) * s.beta[m] : 0;
        const e = [residual(rng), residual(rng), residual(rng)];
        x = [0, 1, 2].map(r => A[r][0] * x[0] + A[r][1] * x[1] + A[r][2] * x[2] + B[r][0] * e[0] + B[r][1] * e[1] + B[r][2] * e[2]);
        const w = wet ? 3 : 0;
        const mx = harm(s.tmax[w], s.tmax[w + 1], s.tmax[w + 2], day), cx = cvFloor(harm(s.tmaxCv[w], s.tmaxCv[w + 1], s.tmaxCv[w + 2], day));
        const mn = harm(s.tmin[0], s.tmin[1], s.tmin[2], day), cn = cvFloor(harm(s.tmin[3], s.tmin[4], s.tmin[5], day));
        const mr = harm(s.rad[w], s.rad[w + 1], s.rad[w + 2], day), cr = cvFloor(harm(s.radCv[w], s.radCv[w + 1], s.radCv[w + 2], day));
        let tmax = mx * (x[0] * cx + 1), tmin = mn * (x[1] * cn + 1);
        if (tmin > tmax)
            [tmin, tmax] = [tmax, tmin];
        out.push({ wet, rainMm: rainIn * 25.4, tmaxC: fToC(tmax), tminC: fToC(tmin), radLy: Math.max(0, mr * (x[2] * cr + 1)) });
    }
    return out;
}
// Air temperature through the day: lowest at 06:00, highest at 15:00, cosine between [ASSUMED].
export function hourTemp(d, hour) {
    const h = ((hour % 24) + 24) % 24;
    const f = h >= 6 && h <= 15 ? (1 - Math.cos(Math.PI * (h - 6) / 9)) / 2 : (1 + Math.cos(Math.PI * ((h < 6 ? h + 24 : h) - 15) / 15)) / 2;
    return d.tminC + f * (d.tmaxC - d.tminC);
}
