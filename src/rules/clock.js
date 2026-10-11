// Story time as minutes. A calendar date counts from 1 January of year 1 (proleptic Gregorian, the epoch weatherAt and
// storyYear read); a bare day count ("Day 3") counts from day 1 and stays below 146,097 days, the length of 400 years,
// which is how the engine tells the two apart.
const DAY = 1440, CALENDAR_FROM = 146097;
function epochDays(y, m, d) {
    const t = new Date(0), e = new Date(0);
    t.setUTCFullYear(y, m - 1, d);
    e.setUTCFullYear(1, 0, 1);
    return Math.round((t.getTime() - e.getTime()) / 864e5);
}
/** Minutes for "1850-03-14 18:40", "1850-03-14", "Day 3 07:15" or "Day 3"; null when the text is none of these. */
export function parseStoryTime(text) {
    const s = String(text ?? '').trim();
    const hm = s.match(/(\d{1,2}):(\d{2})\s*$/);
    const minutes = hm ? Number(hm[1]) * 60 + Number(hm[2]) : 0;
    if (hm && (Number(hm[1]) > 23 || Number(hm[2]) > 59))
        return null;
    const date = s.match(/^(-?\d{1,4})-(\d{1,2})-(\d{1,2})\b/);
    if (date) {
        const [y, m, d] = date.slice(1).map(Number);
        if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1)
            return null;
        const days = epochDays(y, m, d);
        return days >= CALENDAR_FROM ? days * DAY + minutes : null;
    }
    const day = s.match(/^day\s+(\d+)\b/i);
    if (day && Number(day[1]) >= 1 && Number(day[1]) < CALENDAR_FROM)
        return (Number(day[1]) - 1) * DAY + minutes;
    return null;
}
/** "Thursday 14 March 1850, 18:40" for a calendar time, "Day 3, 07:15" for a day count. */
export function formatStoryTime(t) {
    const days = Math.floor(t / DAY), min = Math.round(t - days * DAY);
    const clock = `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
    if (days < CALENDAR_FROM)
        return `Day ${days + 1}, ${clock}`;
    const d = new Date(0);
    d.setUTCFullYear(1, 0, 1);
    d.setUTCDate(d.getUTCDate() + days);
    const label = d.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `${label.replace(/,/g, '')}, ${clock}`;
}
