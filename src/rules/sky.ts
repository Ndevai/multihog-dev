// Light from the sky at the story's date, hour and latitude (docs/df-body-engine.md §6.2), with the low-accuracy
// formulae of Meeus, Astronomical Algorithms (1991): Sun ch. 24, obliquity (21.2), equation of time (27.3, Smart),
// Moon's mean arguments ch. 45 and illuminated fraction (46.1, 46.4).
const rad = Math.PI / 180, deg = 180 / Math.PI;
const norm360 = (x: number) => ((x % 360) + 360) % 360;

/** Julian Day from story minutes counted from 0001-01-01 00:00 (proleptic Gregorian, as memo-processor parses dates). */
export const julianDay = (minutes: number) => 1721425.5 + minutes / 1440;

export interface Sun { T: number; L0: number; M: number; e: number; lon: number; eps: number; dec: number; ra: number; eqTime: number }
export function sun(jd: number): Sun {
    const T = (jd - 2451545) / 36525;
    const L0 = norm360(280.46645 + 36000.76983 * T + 0.0003032 * T * T);
    const M = norm360(357.52910 + 35999.05030 * T - 0.0001559 * T * T - 0.00000048 * T ** 3);
    const e = 0.016708617 - 0.000042037 * T - 0.0000001236 * T * T;
    const C = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * rad) + (0.019993 - 0.000101 * T) * Math.sin(2 * M * rad) + 0.000290 * Math.sin(3 * M * rad);
    const lon = norm360(L0 + C);
    const eps = 23.4392911 - (46.8150 * T + 0.00059 * T * T - 0.001813 * T ** 3) / 3600;
    const dec = Math.asin(Math.sin(eps * rad) * Math.sin(lon * rad)) * deg;
    const ra = norm360(Math.atan2(Math.cos(eps * rad) * Math.sin(lon * rad), Math.cos(lon * rad)) * deg);
    const y = Math.tan(eps * rad / 2) ** 2, l = L0 * rad, m = M * rad;
    const E = (y * Math.sin(2 * l) - 2 * e * Math.sin(m) + 4 * e * y * Math.sin(m) * Math.cos(2 * l) - y * y / 2 * Math.sin(4 * l) - 1.25 * e * e * Math.sin(2 * m)) * deg;
    return { T, L0, M, e, lon, eps, dec, ra, eqTime: E };
}

export function moon(jd: number, s: Sun = sun(jd)) {
    const T = s.T;
    const D = norm360(297.8502042 + 445267.1115168 * T - 0.0016300 * T * T + T ** 3 / 545868 - T ** 4 / 113065000);
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000);
    const Mp = norm360(134.9634114 + 477198.8676313 * T + 0.0089970 * T * T + T ** 3 / 69699 - T ** 4 / 14712000);
    const Lp = norm360(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T + T ** 3 / 538841 - T ** 4 / 65194000);
    const r = (x: number) => Math.sin(x * rad);
    const i = 180 - D - 6.289 * r(Mp) + 2.100 * r(M) - 1.274 * r(2 * D - Mp) - 0.658 * r(2 * D) - 0.214 * r(2 * Mp) - 0.110 * r(D);
    const k = (1 + Math.cos(i * rad)) / 2;
    const phase = Math.abs(norm360(i + 180) - 180);
    // Longitude from the three largest periodic terms of Meeus Table 45.A; latitude (≤ 5.1°) and parallax (≤ 1°) left out [ASSUMED].
    const lon = norm360(Lp + 6.288774 * r(Mp) + 1.274027 * r(2 * D - Mp) + 0.658314 * r(2 * D));
    const dec = Math.asin(Math.sin(s.eps * rad) * Math.sin(lon * rad)) * deg;
    const ra = norm360(Math.atan2(Math.cos(s.eps * rad) * Math.sin(lon * rad), Math.cos(lon * rad)) * deg);
    return { D, M, Mp, Lp, i: phase, k, lon, dec, ra, waxing: norm360(D) < 180 };
}

const altitude = (lat: number, dec: number, H: number) => Math.asin(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(H * rad)) * deg;

// Illuminance, lux (Wikipedia, Lux): sunrise or sunset on a clear day 400, held while the Sun is below 6° [ASSUMED band,
// the photographers' "golden hour"]; full daylight 15 800; civil twilight (Sun 0° to −6°) 3.4; full Moon 0.12; quarter
// Moon 0.01; clear starlight 0.002. Moonlight between full and quarter is interpolated in log lux by phase angle and
// continued at the same slope beyond quarter [ASSUMED].
const moonLux = (i: number) => 0.12 * (0.01 / 0.12) ** (i / 90);

export interface SkyLight { lux: number; label: string; sunAlt: number; moonAlt: number; moonLit: number }
/**
 * { lux, label } of natural light for story time `minutes` (calendar dates only) at latitude `lat` (degrees, north +).
 * The story clock is taken as local mean solar time [ASSUMED: time zones ignored].
 */
export function skyLight(minutes: number, lat: number): SkyLight {
    const jd = julianDay(minutes), s = sun(jd), m = moon(jd, s);
    const clock = ((minutes % 1440) + 1440) % 1440 / 60;
    const H = 15 * (clock - 12) + s.eqTime;
    const hs = altitude(lat, s.dec, H), hm = altitude(lat, m.dec, H + (s.ra - m.ra));
    const lit = m.k >= 0.9 ? 'full or nearly full' : m.k >= 0.6 ? 'gibbous' : m.k >= 0.4 ? 'half' : 'crescent';
    if (hs >= 6) return { lux: 15800, label: 'daylight', sunAlt: hs, moonAlt: hm, moonLit: m.k };
    if (hs >= 0) return { lux: 400, label: 'low sun (sunrise or sunset)', sunAlt: hs, moonAlt: hm, moonLit: m.k };
    if (hs >= -6) return { lux: 3.4, label: 'civil twilight', sunAlt: hs, moonAlt: hm, moonLit: m.k };
    const ml = hm > 0 ? moonLux(m.i) : 0;
    if (ml > 0.002) return { lux: ml, label: `night, ${m.waxing ? 'waxing' : 'waning'} ${lit} moon up`, sunAlt: hs, moonAlt: hm, moonLit: m.k };
    return { lux: 0.002, label: hm > 0 ? `night, ${lit} moon up, mostly starlight` : 'night, moon down, starlight', sunAlt: hs, moonAlt: hm, moonLit: m.k };
}
