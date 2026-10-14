// Observed weather of a real day, 1940 to about 5 days ago: ERA5 (Hersbach et al. 2020, Q J R Meteorol Soc 146:1999;
// 0.25° grid, hourly) through the Open-Meteo historical weather API (free for non-commercial use, no key; CC BY 4.0;
// 600 calls/min, 10,000/day). Local time of the place (timezone=auto). A day without data, a future day or a failed call
// gives null, and the weather generator (weather.ts) answers instead.
import type { WeatherDay } from './weather.js';

export interface ObservedDay { day: WeatherDay; snowCm: number; hourlyC: number[]; windMs: number; humidity: number }

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
export async function observedDay(lat: number, lon: number, y: number, m: number, d: number): Promise<ObservedDay | null> {
    const k = key(lat, lon, y, m, d);
    if (cache.has(k)) return cache.get(k)!;
    if (!inReanalysis(y, m, d)) return null;
    const day = iso(y, m, d);
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&start_date=${day}&end_date=${day}`
        + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,shortwave_radiation_sum'
        + '&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m&wind_speed_unit=ms&timezone=auto&models=era5';
    let out: ObservedDay | null = null;
    try {
        const r = await fetch(url);
        if (r.ok) {
            const j = await r.json() as { daily?: Record<string, (number | null)[]>; hourly?: Record<string, (number | null)[]> };
            const dl = j.daily ?? {}, hr = j.hourly ?? {};
            const tmax = dl.temperature_2m_max?.[0], tmin = dl.temperature_2m_min?.[0], rain = dl.precipitation_sum?.[0] ?? 0;
            const temps = (hr.temperature_2m ?? []).filter((x): x is number => x != null);
            if (tmax != null && tmin != null && temps.length === 24) {
                const mean = (a: (number | null)[] | undefined) => { const v = (a ?? []).filter((x): x is number => x != null); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0; };
                // A wet day is one with at least 0.1 mm, WGEN's threshold (Richardson & Wright 1984). Radiation MJ/m² → langleys (× 23.9).
                out = {
                    day: { wet: rain >= 0.1, rainMm: rain, tmaxC: tmax, tminC: tmin, radLy: (dl.shortwave_radiation_sum?.[0] ?? 0) * 23.9 },
                    snowCm: dl.snowfall_sum?.[0] ?? 0, hourlyC: temps, windMs: mean(hr.wind_speed_10m), humidity: mean(hr.relative_humidity_2m),
                };
            }
        }
    } catch { out = null; }
    cache.set(k, out);
    return out;
}
