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
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const monthNo = (w) => MONTHS.indexOf(w.slice(0, 3).toLowerCase()) + 1;
// The written forms a date takes in a scene or a model's answer: 1899-09-19, 19/09/1899 (day first, as the Weather tool
// asks), 19 September 1899, 19th of September 1899, September 19, 1899. The year is four digits.
const DATE_FORMS = [
    [/\b(\d{4})-(\d{1,2})-(\d{1,2})(?=\b|T)/, m => [+m[1], +m[2], +m[3]]],
    [/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b/, m => [+m[3], +m[2], +m[1]]],
    [new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+${MONTH}\\.?,?\\s+(\\d{4})\\b`, 'i'), m => [+m[3], monthNo(m[2]), +m[1]]],
    [new RegExp(`\\b${MONTH}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'i'), m => [+m[3], monthNo(m[1]), +m[2]]],
];
const HOUR_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const MIN_WORDS = { five: 5, ten: 10, 'a quarter': 15, quarter: 15, twenty: 20, 'twenty-five': 25, 'twenty five': 25, half: 30 };
/** A clock time in words ("a quarter past six", "half past three", "ten to nine", "six o'clock"), as minutes of a 12-hour
 *  clock; the part of the day nearby decides morning or afternoon. */
function wordClock(s) {
    const t = s.toLowerCase(), H = Object.keys(HOUR_WORDS).join('|'), M = Object.keys(MIN_WORDS).sort((a, b) => b.length - a.length).join('|');
    let m = t.match(new RegExp(`\\b(${M})\\s+(?:minutes\\s+)?(past|after|to|before)\\s+(${H}|\\d{1,2})\\b`));
    let min = null;
    if (m) {
        const h = HOUR_WORDS[m[3]] ?? Number(m[3]), d = MIN_WORDS[m[1]];
        min = /to|before/.test(m[2]) ? ((h + 11) % 12) * 60 + 60 - d : (h % 12) * 60 + d;
    }
    else if ((m = t.match(new RegExp(`\\b(${H}|\\d{1,2})\\s+o'?\\s?clock\\b`))))
        min = ((HOUR_WORDS[m[1]] ?? Number(m[1])) % 12) * 60;
    if (min === null)
        return null;
    const pm = /\b(afternoon|evening|night|p\.?m\.?)\b/.test(t) && !/\b(morning|a\.?m\.?)\b/.test(t);
    return pm && !(/\bnight\b/.test(t) && min < 4 * 60) ? min + 12 * 60 : min;
}
/** Hour and minute written after a date: 14:20, 2:20 pm, 2 pm, 14h20. */
function clockIn(s) {
    const m = s.match(/\b(\d{1,2})(?:[:h](\d{2})(?::(\d{2}))?)?\s*([ap])\.?m\b/i) ?? s.match(/\b(\d{1,2})[:h](\d{2})(?::(\d{2}))?\b/);
    if (!m)
        return null;
    let h = +m[1];
    const mi = +(m[2] ?? 0), se = +(m[3] ?? 0);
    if (m[4]) {
        if (h < 1 || h > 12)
            return null;
        h = h % 12 + (m[4].toLowerCase() === 'p' ? 12 : 0);
    }
    return h > 23 || mi > 59 || se > 59 ? null : h * 60 + mi + se / 60;
}
// A part of the day written near a date, as an hour [ASSUMED: the middle of each part as commonly meant]. A Lisbon night
// scene read as noon made the narrator's dark sky contradict the clock.
const DAY_PARTS = [[/\bmidnight\b/i, 0], [/\b(dawn|daybreak|sunrise)\b/i, 6 * 60], [/\bnoon|midday\b/i, 12 * 60],
    [/\b(dusk|sunset|twilight)\b/i, 18 * 60 + 30], [/\bafternoon\b/i, 15 * 60], [/\bmorning\b/i, 9 * 60], [/\bevening\b/i, 19 * 60], [/\bnight\b/i, 22 * 60]];
const dayPart = (s) => DAY_PARTS.find(([re]) => re.test(s))?.[1] ?? null;
/** The first calendar date written anywhere in a text, with the hour written after it, else a part of the day written near it (morning, evening, night), else noon [ASSUMED]; null when none. */
export function findStoryTime(text) {
    const s = String(text ?? '');
    let best = null;
    for (const [re, get] of DATE_FORMS) {
        const m = s.match(re);
        if (!m || m.index == null)
            continue;
        const [y, mo, d] = get(m);
        if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 400)
            continue;
        const days = epochDays(y, mo, d);
        if (days < CALENDAR_FROM)
            continue;
        const after = s.slice(m.index + m[0].length, m.index + m[0].length + 25).replace(/^T/, ' '), near = s.slice(Math.max(0, m.index - 60), m.index + m[0].length + 80);
        const hm = clockIn(after) ?? wordClock(near) ?? dayPart(s.slice(Math.max(0, m.index - 40), m.index + m[0].length + 60));
        if (!best || m.index < best.at)
            best = { at: m.index, t: days * DAY + (hm ?? 720) };
    }
    return best?.t ?? null;
}
/** Minutes for "1850-03-14 18:40", "1850-03-14", "Day 3 07:15" or "Day 3", or a written date (findStoryTime); else null. */
export function parseStoryTime(text) {
    const strict = parseStrict(text);
    return strict ?? findStoryTime(text);
}
function parseStrict(text) {
    const s = String(text ?? '').trim();
    const hm = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*$/);
    const minutes = hm ? Number(hm[1]) * 60 + Number(hm[2]) + (hm[3] ? Number(hm[3]) / 60 : 0) : 0;
    if (hm && (Number(hm[1]) > 23 || Number(hm[2]) > 59 || Number(hm[3] ?? 0) > 59))
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
    // Seconds appear once an action (actions.ts) has moved the clock by less than a minute; otherwise hh:mm.
    const totalS = Math.round(t * 60), days = Math.floor(totalS / 86400), s = totalS - days * 86400;
    const hh = String(Math.floor(s / 3600)).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = s % 60;
    const clock = `${hh}:${mm}${ss ? ':' + String(ss).padStart(2, '0') : ''}`;
    if (days < CALENDAR_FROM)
        return `Day ${days + 1}, ${clock}`;
    const d = new Date(0);
    d.setUTCFullYear(1, 0, 1);
    d.setUTCDate(d.getUTCDate() + days);
    const label = d.toLocaleDateString('en-GB', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return `${label.replace(/,/g, '')}, ${clock}`;
}
/** The clock as a person in the story says it, to the nearest five minutes: "about twenty past six in the evening". A result
 *  gives this beside the exact time, so the reply reads the hour as the result gives it (a narrator rounding 18:18 its own
 *  way wrote "a quarter past six"). */
export function spokenTime(t) {
    const s = Math.round(t * 60) % 86400, exact = s / 60, m5 = Math.round(exact / 5) * 5, h24 = Math.floor(m5 / 60) % 24, m = m5 % 60;
    const NUM = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
    const hourWord = (h) => NUM[h % 12];
    const MIN = { 5: 'five', 10: 'ten', 15: 'a quarter', 20: 'twenty', 25: 'twenty-five', 30: 'half' };
    const said = m === 0 ? `${hourWord(h24)} o'clock` : m <= 30 ? `${MIN[m]} past ${hourWord(h24)}` : `${MIN[60 - m]} to ${hourWord(h24 + 1)}`;
    const hNext = m > 30 ? (h24 + 1) % 24 : h24;
    const part = hNext < 5 || hNext >= 22 ? 'at night' : hNext < 12 ? 'in the morning' : hNext < 17 ? 'in the afternoon' : 'in the evening';
    const noon = m === 0 && (hNext === 12 || hNext === 0) ? (hNext === 12 ? 'noon' : 'midnight') : null;
    return `${Math.abs(exact - m5) >= 0.5 ? 'about ' : ''}${noon ?? `${said} ${part}`}`;
}
