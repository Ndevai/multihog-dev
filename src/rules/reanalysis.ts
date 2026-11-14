// Observed weather of a real day, 1940 to about 5 days ago: ERA5 (Hersbach et al. 2020, Q J R Meteorol Soc 146:1999, from
// 1950; extended back to 1940 by Soci et al. 2024, Q J R Meteorol Soc 150:4014; 0.25° grid, hourly) through the Open-Meteo historical weather API (free for non-commercial use, no key; CC BY 4.0;
// 600 calls/min, 10,000/day). The hours are read as Unix times (timeformat=unixtime) and set on the place's own clock on that
// date (zone.ts: the zone's historical offset, summer time included), because the API applies one fixed offset, the one at the
// time of the request, to every date (its documentation). A day without data, a future day or a failed call gives null, and
// the weather generator (weather.ts) answers instead.
import type { WeatherDay } from './weather.js';
import { hourTemp } from './weather.js';
import { setZone, civilOffsetH, MS_YEAR1 } from './zone.js';

/**
 * hourlyC: air temperature at each clock hour h:00 of the day (index h). ERA5 days also give, for each clock hour from h:00:
 * cloudH cloud cover % (at h:30), ghiH global horizontal irradiance W/m² (ERA5's mean of the hour ending at h+1:00, so the
 * clock hour's own mean), windH wind at 10 m m/s and humH relative humidity % (at h:00).
 */
export interface ObservedDay { day: WeatherDay; snowCm: number; hourlyC: number[]; windMs: number; humidity: number; source: 'ERA5' | '20CRv3'; cloudH?: number[]; ghiH?: number[]; windH?: number[]; humH?: number[] }

const ERA5_FROM = Date.UTC(1940, 0, 1);
const LAG_DAYS = 6; // ERA5 reaches Open-Meteo about 5 days late [Open-Meteo docs]; one day of margin [ASSUMED]
const cache = new Map<string, ObservedDay | null>();

const iso = (y: number, m: number, d: number) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const key = (lat: number, lon: number, y: number, m: number, d: number) => `${lat.toFixed(2)},${lon.toFixed(2)},${iso(y, m, d)}`;

/** True when ERA5 can hold this calendar day. */
export function inReanalysis(y: number, m: number, d: number): boolean {
    const t = Date.UTC(y, m - 1, d);
    return y >= 1940 && t >= ERA5_FROM && t <= Date.now() - LAG_DAYS * 864e5;
}

/** The day already fetched for these coordinates, or undefined when not fetched yet. */
export function cachedDay(lat: number, lon: number, y: number, m: number, d: number): ObservedDay | null | undefined {
    return cache.get(key(lat, lon, y, m, d));
}

/** Fetches the observed day at `lat`, `lon`; null when outside ERA5 or the call fails. Each day is fetched once per session. */
/** True when the day's reanalysis was tried and could not be read (service or proxy unreachable). */
export function reanalysisMissed(lat: number, lon: number, y: number): boolean {
    return y >= 1851 && y < 1940 && years.has(`${lat.toFixed(2)},${lon.toFixed(2)},${y}`) && !reached.has(`${lat.toFixed(2)},${lon.toFixed(2)},${y}`);
}
export async function observedDay(lat: number, lon: number, y: number, m: number, d: number): Promise<ObservedDay | null> {
    const k = key(lat, lon, y, m, d);
    if (cache.has(k)) return cache.get(k)!;
    if (y >= 1851 && y < 1940) { await twentiethCentury(lat, lon, y); return cache.get(k) ?? null; }
    if (!inReanalysis(y, m, d)) return null;
    // The day before and after too, so the place's clock day lies inside the series whatever the offset.
    const near = (n: number) => { const x = new Date(0); x.setUTCFullYear(y, m - 1, d + n); return [x.getUTCFullYear(), x.getUTCMonth() + 1, x.getUTCDate()] as const; };
    const [a0, a1] = [near(-1), near(1)].map(([yy, mm, dd]) => inReanalysis(yy, mm, dd) ? iso(yy, mm, dd) : iso(y, m, d));
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${a0}&end_date=${a1}`
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,shortwave_radiation_sum'
        + '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,cloud_cover,shortwave_radiation&wind_speed_unit=ms&timezone=auto&timeformat=unixtime&models=era5';
    let out: ObservedDay | null = null;
    try {
        const r = await fetch(url);
        if (r.ok) out = readEra5(await r.json(), lat, lon, y, m, d);
    } catch { out = null; }
    cache.set(k, out);
    return out;
}

type Series = (number | string | null)[];
/** The day on the place's clock from an Open-Meteo archive response (exported for the tests). */
export function readEra5(j: { timezone?: unknown; utc_offset_seconds?: number; daily?: Record<string, Series>; hourly?: Record<string, Series> }, lat: number, lon: number, y: number, m: number, d: number): ObservedDay | null {
    setZone(lat, lon, j.timezone);
    const dl = j.daily ?? {}, hr = j.hourly ?? {}, fixed = j.utc_offset_seconds ?? 0;
    // Times as Unix seconds (ISO strings, if sent, are local at the fixed offset).
    const sec = (v: unknown) => typeof v === 'number' ? v : typeof v === 'string' ? Date.parse(`${v}Z`) / 1000 - fixed : NaN;
    const ht = (hr.time ?? []).map(sec), dt = (dl.time ?? []).map(sec);
    const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v) ? v : NaN;
    // Linear between the hourly values; NaN outside the series or next to a missing value.
    const at = (name: string, u: number) => {
        const v = hr[name] ?? [], i = ht.findIndex(x => x >= u);
        if (i < 0 || (i === 0 && ht[0] > u)) return NaN;
        if (ht[i] === u) return num(v[i]);
        const w = (u - ht[i - 1]) / (ht[i] - ht[i - 1]);
        return num(v[i - 1]) * (1 - w) + num(v[i]) * w;
    };
    // Clock hour h of the date on the place's own clock, as a Unix time.
    const x = new Date(0); x.setUTCFullYear(y, m - 1, d);
    const civil0 = (x.getTime() - MS_YEAR1) / 60000;
    const hourU = (h: number) => { const c = civil0 + 60 * h; return (MS_YEAR1 + (c - civilOffsetH(c, lat, lon) * 60) * 60000) / 1000; };
    const hours = Array.from({ length: 24 }, (_, h) => hourU(h));
    const hourlyC = hours.map(u => at('temperature_2m', u));
    if (!hourlyC.every(Number.isFinite)) return null;
    // The daily window that starts nearest the clock day's midnight.
    const di = dt.reduce((b, t, i) => Math.abs(t - hours[0]) < Math.abs(dt[b] - hours[0]) ? i : b, 0);
    const tmax = num(dl.temperature_2m_max?.[di]), tmin = num(dl.temperature_2m_min?.[di]), rain = num(dl.precipitation_sum?.[di]) || 0;
    if (!Number.isFinite(tmax) || !Number.isFinite(tmin)) return null;
    const windH = hours.map(u => at('wind_speed_10m', u)), humH = hours.map(u => at('relative_humidity_2m', u));
    const mean = (a: number[]) => { const v = a.filter(Number.isFinite); return v.length ? v.reduce((s, z) => s + z, 0) / v.length : 0; };
    // A wet day is one with at least 0.1 mm, WGEN's threshold (Richardson & Wright 1984). Radiation MJ/m² → langleys (× 23.9).
    return {
        day: { wet: rain >= 0.1, rainMm: rain, tmaxC: tmax, tminC: tmin, radLy: (num(dl.shortwave_radiation_sum?.[di]) || 0) * 23.9 },
        snowCm: num(dl.snowfall_sum?.[di]) || 0, hourlyC, windMs: mean(windH), humidity: mean(humH), source: 'ERA5',
        cloudH: hours.map(u => at('cloud_cover', u + 1800)), ghiH: hours.map(u => at('shortwave_radiation', u + 3600)), windH, humH,
    };
}

// 1851–1939: NOAA-CIRES-DOE Twentieth Century Reanalysis version 3 (the service returns no daily values before 1851) (Slivinski et al. 2019, Q J R Meteorol Soc 145:2876),
// daily 2 m maximum and minimum temperature and precipitation rate at the grid point nearest the place (about 1°), through
// NOAA PSL's daily time-series service, one call per variable for the whole year. Only surface pressure is assimilated, so
// temperature and rain are the model's reconstruction. Air temperature through the day follows the generator's curve; snow
// is the day's precipitation as snow at 10 mm of snow per mm of water when the day's mean is at or below 1.0 °C [ASSUMED];
// wind and humidity are not taken. The service sends no CORS header, so a browser reads it through SillyTavern's CORS proxy
// (/proxy/, config.yaml enableCorsProxy: true).
const PSL = 'https://psl.noaa.gov/cgi-bin/data/timeseries/getdaily.pl';
const years = new Set<string>(), reached = new Set<string>();
async function getText(url: string): Promise<string | null> {
    // SillyTavern's proxy reads the target from the path, so the query string travels encoded inside it.
    for (const u of [url, `/proxy/${encodeURIComponent(url)}`, `/proxy/${url}`]) {
        try { const r = await fetch(u); if (r.ok) { const t = await r.text(); if (/\d{4},\d{2},\d{2},/.test(t)) return t; } } catch { /* next route */ }
    }
    return null;
}
async function series(lat: number, lon: number, y: number, v: string): Promise<Map<string, number> | null> {
    const t = await getText(`${PSL}?typeTS=3&variabletwentcv3=${v}&lat1=${lat.toFixed(2)}&lon1=${lon.toFixed(2)}&mon1=1&mon2=12&ipos%5B1%5D=${y}&ipos%5B2%5D=${y}&anom=0&gettimevar=get_timeseries&Submit=Submit`);
    if (!t) return null;
    const m = new Map<string, number>();
    for (const x of t.matchAll(/(\d{4}),(\d{2}),(\d{2}),\s*(-?[\d.]+)/g)) m.set(`${x[1]}-${x[2]}-${x[3]}`, Number(x[4]));
    return m.size ? m : null;
}
async function twentiethCentury(lat: number, lon: number, y: number): Promise<void> {
    const yk = `${lat.toFixed(2)},${lon.toFixed(2)},${y}`;
    if (years.has(yk)) return;
    years.add(yk);
    const [hi, lo, pr] = await Promise.all(['tmax.2m', 'tmin.2m', 'prate'].map(v => series(lat, lon, y, v)));
    if (!hi || !lo || !pr) return;
    reached.add(yk);
    for (const [day, kmax] of hi) {
        const kmin = lo.get(day), rate = pr.get(day);
        if (kmin == null || rate == null) continue;
        const [yy, mm, dd] = day.split('-').map(Number), rain = Math.max(0, rate * 86400);
        const w: WeatherDay = { wet: rain >= 0.1, rainMm: rain, tmaxC: kmax - 273.15, tminC: kmin - 273.15, radLy: NaN };
        cache.set(key(lat, lon, yy, mm, dd), { day: w, snowCm: w.wet && (w.tmaxC + w.tminC) / 2 <= 1.0 ? rain : 0,
            hourlyC: Array.from({ length: 24 }, (_, h) => hourTemp(w, h)), windMs: NaN, humidity: NaN, source: '20CRv3' });
    }
}
