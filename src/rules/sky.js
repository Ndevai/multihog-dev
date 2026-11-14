// Light from the sky at the story's date, hour and latitude (docs/df-body-engine.md §6.2), with the low-accuracy
// formulae of Meeus, Astronomical Algorithms (1991): Sun ch. 24, obliquity (21.2), equation of time (27.3, Smart),
// Moon's mean arguments ch. 45 and illuminated fraction (46.1, 46.4).
import { def, k } from './constants.js';
const rad = Math.PI / 180, deg = 180 / Math.PI;
const norm360 = (x) => ((x % 360) + 360) % 360;
/** Julian Day from story minutes counted from 0001-01-01 00:00 (proleptic Gregorian, as memo-processor parses dates). */
export const julianDay = (minutes) => 1721425.5 + minutes / 1440;
export function sun(jd) {
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
export function moon(jd, s = sun(jd)) {
    const T = s.T;
    const D = norm360(297.8502042 + 445267.1115168 * T - 0.0016300 * T * T + T ** 3 / 545868 - T ** 4 / 113065000);
    const M = norm360(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T + T ** 3 / 24490000);
    const Mp = norm360(134.9634114 + 477198.8676313 * T + 0.0089970 * T * T + T ** 3 / 69699 - T ** 4 / 14712000);
    const Lp = norm360(218.3164591 + 481267.88134236 * T - 0.0013268 * T * T + T ** 3 / 538841 - T ** 4 / 65194000);
    const r = (x) => Math.sin(x * rad);
    const i = 180 - D - 6.289 * r(Mp) + 2.100 * r(M) - 1.274 * r(2 * D - Mp) - 0.658 * r(2 * D) - 0.214 * r(2 * Mp) - 0.110 * r(D);
    const k = (1 + Math.cos(i * rad)) / 2;
    const phase = Math.abs(norm360(i + 180) - 180);
    // Longitude from the three largest periodic terms of Meeus Table 45.A; latitude (≤ 5.1°) and parallax (≤ 1°) left out [ASSUMED].
    const lon = norm360(Lp + 6.288774 * r(Mp) + 1.274027 * r(2 * D - Mp) + 0.658314 * r(2 * D));
    const dec = Math.asin(Math.sin(s.eps * rad) * Math.sin(lon * rad)) * deg;
    const ra = norm360(Math.atan2(Math.cos(s.eps * rad) * Math.sin(lon * rad), Math.cos(lon * rad)) * deg);
    return { D, M, Mp, Lp, i: phase, k, lon, dec, ra, waxing: norm360(D) < 180 };
}
const altitude = (lat, dec, H) => Math.asin(Math.sin(lat * rad) * Math.sin(dec * rad) + Math.cos(lat * rad) * Math.cos(dec * rad) * Math.cos(H * rad)) * deg;
// Illuminance on level ground, lux. The Wikipedia (Lux) anchors stay as the ends of the curve: sunrise or sunset 400, the end of
// civil twilight (Sun at −6°) 3.4, clear starlight 0.002 (Sun at −18° or lower). Between the anchors the Sun's altitude sets
// log lux linearly [ASSUMED form], so no minute changes the light by more than a few tens of percent.
def({ id: 'daylightEfficacy', value: 113, unit: 'lm per W of global horizontal irradiance', status: 'sourced', src: 'CIBSE, Solar radiation, long-wave radiation and daylight, Fig. 1: clear sky, Sun at 30°, global 113 lm/W (diffuse 104); one measured mean elsewhere 121.5 lm/W (Saint-Pierre, Réunion, arXiv 1212.5259)', range: [95, 125], file: 'sky.ts' });
def({ id: 'ktDefault', value: 0.18, unit: 'clear-sky index (global irradiance ÷ clear-sky irradiance)', status: 'assumed', src: 'no weather day held: the value that gives the earlier 15 800 lx at a Sun altitude of 50°', range: [0.05, 1], file: 'sky.ts' });
def({ id: 'moonExtinction', value: 0.2, unit: 'mag per air mass', status: 'assumed', src: 'extinction at low altitude; Krisciunas & Schaefer 1991 give 0.172 at 2 800 m', range: [0.12, 0.35], file: 'sky.ts' });
// Cloud: Kasten & Czeplak 1980 (Hamburg), hourly global irradiance ÷ clear-sky = 1 − 0.75 (N/8)^3.4, N the cloud amount in
// oktas (as CIBSE gives it, eq. 16; CIBSE restricts it to 7 oktas or less in the UK). Twilight and night light under full
// cover: 0.25 of clear down to −6° (the same relation [ASSUMED]), 0.05 at −18° and below (overcast starlight 0.0001 ÷ clear
// starlight 0.002 lux, the engine's presets from Wikipedia, Lux), log-linear between [ASSUMED], with the same (N/8)^3.4 shape.
def({ id: 'overcastNight', value: 0.05, unit: 'share of clear-sky night light under full cloud', status: 'assumed', src: 'overcast starlight 0.0001 ÷ clear starlight 0.002 lux (Wikipedia, Lux)', range: [0.02, 0.2], file: 'sky.ts' });
/** Global horizontal irradiance of a clear sky, W/m², Sun altitude h degrees (Haurwitz 1945: 1098 cos z exp(−0.059 / cos z), as pvlib implements it). */
export const haurwitz = (h) => h <= 0 ? 0 : 1098 * Math.sin(h * rad) * Math.exp(-0.059 / Math.sin(h * rad));
/** Relative air mass at altitude h degrees (Kasten & Young 1989; about 38 at the horizon). */
const airMass = (h) => 1 / (Math.sin(Math.max(0, h) * rad) + 0.50572 * (Math.max(0, h) + 6.07995) ** -1.6364);
/** Cloud cover share 0–1 → global irradiance ÷ clear sky (Kasten & Czeplak 1980). */
export const kastenCzeplak = (cover) => 1 - 0.75 * Math.min(1, Math.max(0, cover)) ** 3.4;
/** The cloud cover share that gives clear-sky index `kt` under Kasten & Czeplak (its inverse); 0 for kt ≥ 1. */
export const coverOfKt = (kt) => Math.min(1, Math.max(0, (1 - kt) / 0.75) ** (1 / 3.4));
/**
 * Moonlight on level ground, lux, for phase angle `phase` (0° full, 90° quarter) and altitude `alt` degrees. Magnitude
 * V = −12.73 + 0.026|α| + 4e−9 α⁴ (Krisciunas & Schaefer 1991, Eq. 9); a magnitude 0 source gives 2.54e−6 lx (Crumey 2014);
 * extinction k × air mass; the horizontal surface sees it times sin(altitude).
 */
export const moonLux = (phase, alt) => alt <= 0 ? 0
    : 2.54e-6 * 10 ** (-0.4 * (-12.73 + 0.026 * phase + 4e-9 * phase ** 4)) * 10 ** (-0.4 * k('moonExtinction') * airMass(alt)) * Math.sin(alt * rad);
/** The Sun's altitude, degrees, at `utc` story minutes (UTC) at latitude `lat` and longitude `east` (degrees east). */
export function sunAltUtc(utc, lat, east) {
    const s = sun(julianDay(utc));
    return altitude(lat, s.dec, 15 * (((utc % 1440) + 1440) % 1440 / 60 - 12) + east + s.eqTime);
}
/** Clear-sky global irradiation of the UTC day that holds `utc` story minutes, Wh/m² (Haurwitz, every 10 minutes). */
export function clearDayWh(utc, lat, east) {
    const d0 = Math.floor(utc / 1440) * 1440 - east * 4;
    let wh = 0;
    for (let q = 5; q < 1440; q += 10)
        wh += haurwitz(sunAltUtc(d0 + q, lat, east)) / 6;
    return wh;
}
export function skyLight(minutes, lat, { lon, utcOffsetH, kt, ghi, cloud } = {}) {
    const off = utcOffsetH ?? (lon ?? 0) / 15, east = lon ?? off * 15, utc = minutes - off * 60;
    const jd = julianDay(utc), s = sun(jd), m = moon(jd, s);
    const H = 15 * (((utc % 1440) + 1440) % 1440 / 60 - 12) + east + s.eqTime;
    const hs = altitude(lat, s.dec, H), hm = altitude(lat, m.dec, H + (s.ra - m.ra));
    const lit = m.k >= 0.9 ? 'full or nearly full' : m.k >= 0.6 ? 'gibbous' : m.k >= 0.4 ? 'half' : 'crescent';
    // The clock hour's mean clear-sky irradiance, from four points in the hour.
    const hour0 = utc - (((minutes % 60) + 60) % 60);
    const clear = [7.5, 22.5, 37.5, 52.5].reduce((t, q) => t + haurwitz(sunAltUtc(hour0 + q, lat, east)), 0) / 4;
    const measured = ghi != null && Number.isFinite(ghi) && clear >= 50 ? Math.min(1.1, Math.max(0.03, ghi / clear)) : null;
    const index = measured ?? (cloud != null && Number.isFinite(cloud) ? kastenCzeplak(cloud / 100) : kt ?? k('ktDefault'));
    const cover = cloud != null && Number.isFinite(cloud) ? Math.min(1, Math.max(0, cloud / 100)) : measured != null || kt != null ? coverOfKt(index) : 0;
    // Share of clear-sky light left under that cover for the Sun below 6°: 0.25 at full cover in twilight, 0.05 at night.
    const full = hs >= -6 ? 0.25 : hs <= -18 ? k('overcastNight') : 0.25 * (k('overcastNight') / 0.25) ** ((-6 - hs) / 12);
    const dim = 1 - (1 - full) * cover ** 3.4;
    const out = (lux, label) => ({ lux, label, sunAlt: hs, moonAlt: hm, moonLit: m.k, kt: Math.round(index * 1000) / 1000, cover: Math.round(cover * 100) / 100 });
    const sky = cloud != null && Number.isFinite(cloud) || measured != null ? (cover >= 0.75 ? 'overcast' : cover >= 0.3 ? 'partly cloudy' : 'clear') : '';
    const withSky = (label) => sky ? `${label}, ${sky}` : label;
    if (hs >= 0)
        return out(Math.max(400 * dim, index * haurwitz(hs) * k('daylightEfficacy')), withSky(hs >= 6 ? 'daylight' : 'low sun (sunrise or sunset)'));
    const ml = moonLux(m.i, hm);
    const dusk = hs <= -18 ? 0.002 : hs <= -6 ? 0.002 * (3.4 / 0.002) ** ((hs + 18) / 12) : 3.4 * (400 / 3.4) ** ((hs + 6) / 6);
    const lux = (dusk + ml) * dim;
    if (hs >= -6)
        return out(lux, withSky('civil twilight'));
    if (hs >= -12)
        return out(lux, withSky('nautical twilight'));
    if (hs > -18)
        return out(lux, withSky('astronomical twilight'));
    if (ml > 0.002)
        return out(lux, withSky(`night, ${m.waxing ? 'waxing' : 'waning'} ${lit} moon up`));
    return out(lux, withSky(hm > 0 ? `night, ${lit} moon up, mostly starlight` : 'night, moon down, starlight'));
}
