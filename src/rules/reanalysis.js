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
                    snowCm: dl.snowfall_sum?.[0] ?? 0, hourlyC: temps, windMs: mean(hr.wind_speed_10m), humidity: mean(hr.relative_humidity_2m),
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
