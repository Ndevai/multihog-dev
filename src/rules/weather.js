// Daily weather from WGEN (Richardson & Wright 1984, USDA ARS-8; docs/df-body-engine.md §6.16). Rain: a first-order
// Markov chain for wet or dry days with monthly P(W/W) and P(W/D), amounts from a gamma distribution with monthly alpha and
// beta. Max and min temperature and solar radiation: residuals χ_i = A χ_{i−1} + B ε_i (eq. 3, A and B eqs. 10–11), value
// = m (χ c + 1) (eq. 13), m and c from seasonal harmonics u + C cos(0.0172 (i − T)) (eq. 14) on wet or dry days.
import { STATIONS } from './data/wgen-stations.js';
import { NORMALS } from './data/wmo-normals.js';
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
// ---- Anywhere else: WMO city normals → daily weather by SIMMETEO ----
// SIMMETEO (Geng, Penning de Vries & Supit 1986, Agric For Meteorol 36:363; Geng et al. 1988) derives the WGEN parameters
// from monthly means, as coded in DSSAT's WGEN.for, SIMMIN (BSD-3, DSSAT Foundation): wet-day share PW = days ÷ days in
// month; P(W/D) = 0.75 PW; P(W/W) = 1 − P(W/D)(1 − PW) ÷ PW; rain per wet day R; gamma β = max(−2.16 + 1.83 R, 0.01),
// α = R ÷ β within 0.01–0.998; max temperature on dry and wet days = mean ± a split |9.67 − 27.4 × mean P(W/D)| × 5/9 °C
// weighted by the month's PW (DSSAT weights by the annual mean PW, which moved monthly means by up to 1 °C); SDs max(5.8 − 0.09 Tmax, 0.5) and max(5.2 − 0.13 Tmin, 0.5) °C; the same A, B residual chain, with
// value = mean + SD × residual (WGENGN). Temperature parameters are interpolated linearly between mid-months, with the
// mid-month values corrected until each month's interpolated mean equals its normal (the role of DSSAT's CFACT correction factors;
// without it January came out 1.4 °C too warm at Tokyo and Moscow); rain parameters stay at their month's value. Where the β regression would need α above 0.998
// (light rain, under about 2 mm per wet day), β = R ÷ 0.998 keeps the mean rain per wet day [ASSUMED; SIMMETEO caps α only,
// which gave Cairo 1 mm of January rain for a normal of 5].
const DAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function simmeteo(n) {
    const [, , , , hi, lo, rain, days] = n;
    const pw = days.map((d, m) => Math.min(1, d / DAYS[m])), pdw = pw.map(p => 0.75 * p);
    const pdwMean = pdw.reduce((a, b) => a + b) / 12;
    const tdiff = Math.abs(9.67 - 27.4 * pdwMean) * 5 / 9;
    return hi.map((tx, m) => {
        const wet = days[m] > 0 && rain[m] > 0, rwet = wet ? rain[m] / days[m] : 0;
        const beta = wet ? Math.max(-2.16 + 1.83 * rwet, 0.01, rwet / 0.998) : 0;
        const txd = tx + pw[m] * tdiff, txw = tx - (1 - pw[m]) * tdiff;
        return { pdw: wet ? pdw[m] : 0, pww: wet ? Math.min(1, Math.max(0, 1 - pdw[m] * (1 - pw[m]) / pw[m])) : 0,
            alpha: wet ? Math.min(Math.max(rwet / beta, 0.01), 0.998) : 0.44, beta,
            txd, txw, txdsd: Math.max(5.8 - 0.09 * txd, 0.5), txwsd: Math.max(5.8 - 0.09 * txw, 0.5), tn: lo[m], tnsd: Math.max(5.2 - 0.13 * lo[m], 0.5) };
    });
}
const KEYS = ['txd', 'txw', 'txdsd', 'txwsd', 'tn', 'tnsd'];
/** Mid-month values whose linear interpolation averages to each month's value (fixed-point iteration, 30 rounds). */
function corrected(p) {
    const target = p.map(x => ({ ...x }));
    let mid = p.map(x => ({ ...x }));
    const len = MONTH_START.map((st, m) => (MONTH_START[m + 1] ?? 365) - st);
    for (let it = 0; it < 30; it++) {
        const sum = Array.from({ length: 12 }, () => Object.fromEntries(KEYS.map(k => [k, 0])));
        for (let day = 1; day <= 365; day++) {
            const v = onDay(mid, day), m = monthOf(day);
            for (const k of KEYS)
                sum[m][k] += v[k];
        }
        mid = mid.map((x, m) => {
            const o = { ...x };
            for (const k of KEYS)
                o[k] = x[k] + target[m][k] - sum[m][k] / len[m];
            return o;
        });
    }
    return mid;
}
const rainOf = ({ pdw, pww, alpha, beta }) => ({ pdw, pww, alpha, beta });
/** Parameters for day of year `day`: linear between the mid-days of the two nearest months. */
function onDay(p, day) {
    const mids = MONTH_START.map((s, m) => s + DAYS[m] / 2);
    let m = mids.findIndex(x => x > day) - 1;
    if (m < -1)
        m = 11;
    const a = (m + 12) % 12, b = (a + 1) % 12;
    const from = m === -1 ? mids[11] - 365 : mids[a], to = b === 0 && a === 11 ? mids[0] + 365 : mids[b];
    const f = Math.min(1, Math.max(0, (day - from) / (to - from)));
    const out = {};
    for (const k of Object.keys(p[a]))
        out[k] = p[a][k] + (p[b][k] - p[a][k]) * f;
    return out;
}
/** Days 1..`days` of one year for a WMO city: [{ wet, rainMm, tmaxC, tminC }]. */
export function simulateNormalsYear(n, days, rng) {
    const raw = simmeteo(n), params = corrected(raw), out = [];
    let wet = false, x = [0, 0, 0];
    for (let day = 1; day <= days; day++) {
        // Temperatures follow the interpolated curve; rain takes its own month's values, which keeps monthly totals exact.
        const p = { ...onDay(params, day), ...rainOf(raw[monthOf(day)]) };
        wet = rng() < (wet ? p.pww : p.pdw);
        const rainMm = wet ? Math.max(gamma(p.alpha, rng) * p.beta, 0.1) : 0;
        const e = [residual(rng), residual(rng), residual(rng)];
        x = [0, 1, 2].map(r => A[r][0] * x[0] + A[r][1] * x[1] + A[r][2] * x[2] + B[r][0] * e[0] + B[r][1] * e[1] + B[r][2] * e[2]);
        let tmax = (wet ? p.txw : p.txd) + (wet ? p.txwsd : p.txdsd) * x[0], tmin = p.tn + p.tnsd * x[1];
        if (tmin > tmax)
            [tmin, tmax] = [tmax, tmin];
        if (tmax - tmin <= 0.1)
            tmax += 0.1;
        out.push({ wet, rainMm, tmaxC: tmax, tminC: tmin, radLy: NaN });
    }
    return out;
}
const fold = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const toRad = Math.PI / 180;
export const distKm = (a, b, c, d) => 6371 * Math.acos(Math.min(1, Math.sin(a * toRad) * Math.sin(c * toRad) + Math.cos(a * toRad) * Math.cos(c * toRad) * Math.cos((d - b) * toRad)));
/**
 * The place for `text` ("Lyon", "Sydney, Canada", "Boston"): a WGEN station whose city matches, else a WMO city by name
 * (a country after a comma narrows it), else the WMO city nearest to `lat`, `lon`. Null when nothing matches.
 */
export function findPlace(text, lat, lon) {
    const [cityPart, ...rest] = String(text ?? '').split(','), city = fold(cityPart), country = fold(rest.join(' '));
    if (city) {
        const st = STATION_NAMES.find(s => fold(s.split(',')[0]) === city);
        if (st && (!country || fold(st).includes(country) || country === 'usa' || country.startsWith('united states')))
            return { key: `wgen:${st}`, label: `${st} (WGEN station)`, lat: null, country: 'United States of America' };
        const named = NORMALS.map((n, i) => [n, i]).filter(([n]) => fold(n[0]) === city || fold(n[0]).startsWith(`${city} `));
        const pick = named.find(([n]) => country && fold(n[1]).includes(country)) ?? (country ? undefined : named[0]);
        if (pick)
            return { key: `wmo:${pick[1]}`, label: `${pick[0][0]}, ${pick[0][1]}`, lat: pick[0][2], lon: pick[0][3], country: pick[0][1] };
    }
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon))
        return null;
    let best = 0, bestD = Infinity;
    NORMALS.forEach((n, i) => { const d = distKm(lat, lon, n[2], n[3]); if (d < bestD) {
        bestD = d;
        best = i;
    } });
    const n = NORMALS[best];
    return { key: `wmo:${best}`, label: `${n[0]}, ${n[1]} (nearest WMO city, ${Math.round(bestD)} km)`, lat: n[2], lon: n[3], country: n[1] };
}
/** Days 1..`days` of one year at a place key from findPlace (a bare WGEN station name is accepted too). */
/** Country of a place key from findPlace (WMO cities only). */
export function placeCountry(key) {
    return key.startsWith('wmo:') ? NORMALS[Number(key.slice(4))]?.[1] ?? null : null;
}
export function simulatePlaceYear(key, days, rng) {
    if (key.startsWith('wmo:')) {
        const n = NORMALS[Number(key.slice(4))];
        return n ? simulateNormalsYear(n, days, rng) : null;
    }
    const st = key.startsWith('wgen:') ? key.slice(5) : key;
    return STATIONS[st] ? simulateYear(st, days, rng) : null;
}
/** The first place with weather data named in a text (a capitalized name, longest first: "Rio de Janeiro", "Paris"), names in
 *  `skip` (the characters) left out; null when none. */
import { GEONAMES } from './data/geonames.js';
export function placeIn(text, skip = new Set()) {
    const names = [...String(text ?? '').matchAll(/\b[A-Z][\p{L}'’-]+(?:\s+(?:(?:de|do|da|dos|das|del|di|la|le|of|upon|on|am|an der|sur)\s+)?[A-Z][\p{L}'’-]+)*/gu)];
    for (const m of names) {
        const words = m[0].split(/\s+/);
        for (let n = words.length; n >= 1; n--)
            for (let i = 0; i + n <= words.length; i++) {
                const name = words.slice(i, i + n).join(' ');
                if (skip.has(name.toLowerCase()) || /^(?:de|do|da|of|la|le)$/i.test(words[i]))
                    continue;
                const p = findPlace(name);
                if (p && p.lat != null)
                    return p;
            }
    }
    // A town outside the weather-city list ("near York"): GeoNames, the largest place of that name; the characters'
    // names (skip) are left out. Its weather and country come from the nearest WMO city.
    for (const m of names) {
        const n = m[0];
        if (skip.has(n.toLowerCase()) || [...skip].some(k => k.split(/\s+/).includes(n.toLowerCase())))
            continue;
        const g = GEONAMES[fold(n)] ?? GEONAMES[fold(n.split(/\s+/)[0])];
        if (g) {
            const near = findPlace(undefined, g[0], g[1]);
            if (near)
                return { ...near, label: `${n} (${near.label})`, lat: g[0], lon: g[1] };
        }
    }
    return null;
}
/** A wet day's rain over the day, in 16 boxes of 1.5 h (00:00–01:30, …): a microcanonical random cascade (Olsson 1998,
 *  Hydrol Earth Syst Sci 2:19–30), halving the day four times. Each split sends all of a box's rain to its first half
 *  (P 0.25), all to its second (0.25), or divides it by a uniform weight (0.5) [ASSUMED: Olsson's probabilities vary
 *  0.1–0.4 by rain volume and position; the middle is taken]. The total is kept exactly. */
export function rainBoxes(mm, rng) {
    let boxes = [mm];
    for (let level = 0; level < 4; level++)
        boxes = boxes.flatMap(v => {
            if (v <= 0)
                return [0, 0];
            const u = rng(), w = u < 0.25 ? 1 : u < 0.5 ? 0 : rng();
            return [v * w, v * (1 - w)];
        });
    return boxes;
}
const hhmm = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
/** The spells of rain over the day ("06:00–09:00") and the rain in the box holding the minute of day `now`. */
export function rainNow(boxes, now) {
    const spells = [];
    for (let i = 0; i < boxes.length; i++)
        if (boxes[i] >= 0.05 && !(i > 0 && boxes[i - 1] >= 0.05)) {
            let j = i;
            while (j + 1 < boxes.length && boxes[j + 1] >= 0.05)
                j++;
            spells.push(`${hhmm(i * 90)}–${j === 15 ? '24:00' : hhmm((j + 1) * 90)}`);
        }
    return { spells, nowMm: boxes[Math.min(15, Math.floor(now / 90))] };
}
