// The civil clock of a place on a date (docs/df-body-engine.md §6.2). The place's time zone is an IANA name from the tz
// database, which keeps each zone's history: local mean time before standard time, the switches, summer time, war time.
// Open-Meteo resolves the name from the coordinates (timezone=auto; the ERA5 call returns it, and a forecast call does for
// any other date); the offset on a date comes from the browser's Intl, which carries the database. Before a zone took a
// standard offset each town kept its own local mean time, so the place's own longitude ÷ 15 h stands then (the database's
// first offset is its reference city's mean time). With no zone known the same longitude rule stands [ASSUMED for dates after
// standard time]. The tz database records history before 1970 reliably for its reference cities only (its own note).
/** Story minutes count from 0001-01-01 00:00 (proleptic Gregorian); this is that instant in Unix milliseconds. */
export const MS_YEAR1 = -62135596800000;
const zones = new Map();
const zkey = (lat, lon) => `${lat.toFixed(2)},${lon.toFixed(2)}`;
const valid = (z) => { try {
    new Intl.DateTimeFormat('en-US', { timeZone: z });
    return true;
}
catch {
    return false;
} };
/** The zone recorded for these coordinates: a name, null when a lookup failed, undefined when none was tried. */
export const cachedZone = (lat, lon) => zones.get(zkey(lat, lon));
/** Records the zone a weather call returned for these coordinates. */
export function setZone(lat, lon, zone) {
    if (typeof zone === 'string' && valid(zone))
        zones.set(zkey(lat, lon), zone);
}
/** Looks the zone up once per session (Open-Meteo forecast API, timezone=auto); null when the call fails. */
export async function fetchZone(lat, lon) {
    const k = zkey(lat, lon);
    if (zones.has(k))
        return zones.get(k) ?? null;
    zones.set(k, null);
    try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&timezone=auto&forecast_days=1&current=temperature_2m`, { signal: AbortSignal.timeout(8000) });
        if (r.ok) {
            const j = await r.json();
            setZone(lat, lon, j.timezone);
        }
    }
    catch { /* offline: the longitude rule stands */ }
    return zones.get(k) ?? null;
}
/** Minutes east of UTC of `zone` at the instant `ms` (Unix milliseconds); null when the browser lacks the zone. */
export function zoneOffsetMin(zone, ms) {
    try {
        const v = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(new Date(ms)).find(p => p.type === 'timeZoneName')?.value ?? '';
        const m = /^GMT(?:([+-])(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?)?$/.exec(v);
        if (!m)
            return null;
        return m[1] ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0) + Number(m[4] ?? 0) / 60) : 0;
    }
    catch {
        return null;
    }
}
const EARLY = (() => { const d = new Date(0); d.setUTCFullYear(1500, 0, 1); return d.getTime(); })();
/**
 * Hours east of UTC of the clock at the place (`lat`, `lon` degrees east) at story minute `civil` (read on that clock):
 * the zone's offset then, or the place's local mean time (lon ÷ 15) before the zone's first standard offset or with no zone.
 */
export function civilOffsetH(civil, lat, lon) {
    const zone = cachedZone(lat, lon), lmt = lon / 15;
    if (!zone)
        return lmt;
    const first = zoneOffsetMin(zone, EARLY);
    let off = lmt * 60;
    // The offset depends on the instant, which depends on the offset: two rounds settle it outside the hour of a switch.
    for (let i = 0; i < 2; i++) {
        const o = zoneOffsetMin(zone, MS_YEAR1 + (civil - off) * 60000);
        if (o == null)
            return lmt;
        off = o;
    }
    // A first offset in whole quarter hours is a zone defined by its standard time (UTC, GMT), not a city's mean time.
    return first != null && Math.abs(first % 15) > 1e-6 && Math.abs(off - first) < 1e-6 ? lmt : off / 60;
}
