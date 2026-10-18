import { hourTemp } from './weather.js';
const ERA5_FROM = Date.UTC(1940, 0, 1);
const LAG_DAYS = 6; // ERA5 reaches Open-Meteo about 5 days late [Open-Meteo docs]; one day of margin [ASSUMED]
const cache = new Map();
const iso = (y, m, d) => `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const key = (lat, lon, y, m, d) => `${lat.toFixed(2)},${lon.toFixed(2)},${iso(y, m, d)}`;
/** True when ERA5 can hold this calendar day. */
export function inReanalysis(y, m, d) {
    const t = Date.UTC(y, m - 1, d);
    return y >= 1940 && t >= ERA5_FROM && t <= Date.now() - LAG_DAYS * 864e5;
}
/** The day already fetched for these coordinates, or undefined when not fetched yet. */
export function cachedDay(lat, lon, y, m, d) {
    return cache.get(key(lat, lon, y, m, d));
}
/** Fetches the observed day at `lat`, `lon`; null when outside ERA5 or the call fails. Each day is fetched once per session. */
export async function observedDay(lat, lon, y, m, d) {
    const k = key(lat, lon, y, m, d);
    if (cache.has(k))
        return cache.get(k);
    if (y >= 1851 && y < 1940) {
        await twentiethCentury(lat, lon, y);
        return cache.get(k) ?? null;
    }
    if (!inReanalysis(y, m, d))
        return null;
    const day = iso(y, m, d);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${day}&end_date=${day}`
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,shortwave_radiation_sum'
        + '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=ms&timezone=auto&models=era5';
    let out = null;
    try {
        const r = await fetch(url);
        if (r.ok) {
            const j = await r.json();
            const dl = j.daily ?? {}, hr = j.hourly ?? {};
            const tmax = dl.temperature_2m_max?.[0], tmin = dl.temperature_2m_min?.[0], rain = dl.precipitation_sum?.[0] ?? 0;
            const temps = (hr.temperature_2m ?? []).filter((x) => x != null);
            if (tmax != null && tmin != null && temps.length === 24) {
                const mean = (a) => { const v = (a ?? []).filter((x) => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };
                // A wet day is one with at least 0.1 mm, WGEN's threshold (Richardson & Wright 1984). Radiation MJ/m² → langleys (× 23.9).
                out = {
                    day: { wet: rain >= 0.1, rainMm: rain, tmaxC: tmax, tminC: tmin, radLy: (dl.shortwave_radiation_sum?.[0] ?? 0) * 23.9 },
                    snowCm: dl.snowfall_sum?.[0] ?? 0, hourlyC: temps, windMs: mean(hr.wind_speed_10m), humidity: mean(hr.relative_humidity_2m), source: 'ERA5',
                };
            }
        }
    }
    catch {
        out = null;
    }
    cache.set(k, out);
    return out;
}
// 1851–1939: NOAA-CIRES-DOE Twentieth Century Reanalysis version 3 (the service returns no daily values before 1851) (Slivinski et al. 2019, Q J R Meteorol Soc 145:2876),
// daily 2 m maximum and minimum temperature and precipitation rate at the grid point nearest the place (about 1°), through
// NOAA PSL's daily time-series service, one call per variable for the whole year. Only surface pressure is assimilated, so
// temperature and rain are the model's reconstruction. Air temperature through the day follows the generator's curve; snow
// is the day's precipitation as snow at 10 mm of snow per mm of water when the day's mean is at or below 1.0 °C [ASSUMED];
// wind and humidity are not taken. The service sends no CORS header, so a browser reads it through SillyTavern's CORS proxy
// (/proxy/, config.yaml enableCorsProxy: true).
const PSL = 'https://psl.noaa.gov/cgi-bin/data/timeseries/getdaily.pl';
const years = new Set();
async function getText(url) {
    for (const u of [url, `/proxy/${url}`]) {
        try {
            const r = await fetch(u);
            if (r.ok) {
                const t = await r.text();
                if (/\d{4},\d{2},\d{2},/.test(t))
                    return t;
            }
        }
        catch { /* next route */ }
    }
    return null;
}
async function series(lat, lon, y, v) {
    const t = await getText(`${PSL}?typeTS=3&variabletwentcv3=${v}&lat1=${lat.toFixed(2)}&lon1=${lon.toFixed(2)}&mon1=1&mon2=12&ipos%5B1%5D=${y}&ipos%5B2%5D=${y}&anom=0&gettimevar=get_timeseries&Submit=Submit`);
    if (!t)
        return null;
    const m = new Map();
    for (const x of t.matchAll(/(\d{4}),(\d{2}),(\d{2}),\s*(-?[\d.]+)/g))
        m.set(`${x[1]}-${x[2]}-${x[3]}`, Number(x[4]));
    return m.size ? m : null;
}
async function twentiethCentury(lat, lon, y) {
    const yk = `${lat.toFixed(2)},${lon.toFixed(2)},${y}`;
    if (years.has(yk))
        return;
    years.add(yk);
    const [hi, lo, pr] = await Promise.all(['tmax.2m', 'tmin.2m', 'prate'].map(v => series(lat, lon, y, v)));
    if (!hi || !lo || !pr)
        return;
    for (const [day, kmax] of hi) {
        const kmin = lo.get(day), rate = pr.get(day);
        if (kmin == null || rate == null)
            continue;
        const [yy, mm, dd] = day.split('-').map(Number), rain = Math.max(0, rate * 86400);
        const w = { wet: rain >= 0.1, rainMm: rain, tmaxC: kmax - 273.15, tminC: kmin - 273.15, radLy: NaN };
        cache.set(key(lat, lon, yy, mm, dd), { day: w, snowCm: w.wet && (w.tmaxC + w.tminC) / 2 <= 1.0 ? rain : 0,
            hourlyC: Array.from({ length: 24 }, (_, h) => hourTemp(w, h)), windMs: NaN, humidity: NaN, source: '20CRv3' });
    }
}
