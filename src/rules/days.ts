// Each person's day (2026-11-17, section 94; the first part of time away from the player): when a person of the story rises,
// sleeps and works, so that while the player's character is elsewhere the people they left are asleep at night and at work
// by day, and their bodies follow (PassTime puts them asleep or at work by it), and the narrator knows where they are.
//
// England and Wales, 1841–1921 (the census window NewCharacter already uses):
// - Rising and sleep: Voth 1998 (J Econ Hist 58:29), witnesses before the Old Bailey. In 1800–03, 34 rose at 5:56 on
//   average, started work at 6:33 and slept 6 h 35 min. Of the 1750s sample, half rose between 5:00 and 7:00: an
//   interquartile range of 2 hours, a standard deviation of 2 / 1.349 = 1.48 h for a normal spread (that spread mixes people,
//   days and seasons; it is used as the spread between people [ASSUMED]). The earliest and latest risers in the samples: a
//   publican at 2:00 to go mowing, a servant until 10:30 on a Sunday; draws are kept between them. London's are the nearest
//   measured timings; none were found for 1881.
// - Hours of work: Huberman & Minns 2007 (Explor Econ Hist 44:538), Table 1, full-time production workers in the U.K.:
//   56.9 hours a week in 1870, 56.6 in 1880, 56.3 in 1890, 56.0 in 1900 and 1913, over 6 days; years between are read off the
//   line between, years outside take the nearest.
// - The working day: the Commons debate on the Factories and Workshops Bill, 11 February 1878 (Hansard): textile work between
//   6 A.M. and 6 P.M., or 7 A.M. and 7 P.M., a ten-hour day, and on Saturday six hours and half an hour for cleaning, ending no
//   later than two. So a worker starts at 6:00 or 7:00 (each as likely [ASSUMED]), works Saturday to 14:00, and on weekdays
//   works the week's other hours over five days inside a span 2 hours longer (the twelve-hour window around the ten-hour
//   day). A worker rises 37 minutes before starting, as the 1800–03 witnesses did (5:56 and 6:33).
// - Days off: Sundays; Good Friday and Christmas Day; from 1871 the Bank Holidays Act's days for England: Easter Monday, Whit
//   Monday, the first Monday in August and 26 December. Huberman & Minns count 14 days off a year in the U.K. in 1870; the
//   others are not placed.
// Those with an occupation work; the others are about between rising and sleep. A person the player plays has no day: the
// player decides what they do.
import type { Person } from './types.js';

type Rng = () => number;
const DAY = 1440;
export const RISE_MEAN = 5 * 60 + 56, RISE_SD = 120 / 1.349, RISE_MIN = 2 * 60, RISE_MAX = 10 * 60 + 30;
export const SLEEP_MIN = 6 * 60 + 35, TO_WORK = 37;
export const WEEK_HOURS: [number, number][] = [[1870, 56.9], [1880, 56.6], [1890, 56.3], [1900, 56.0], [1913, 56.0]];
export const SATURDAY_END = 14 * 60, SATURDAY_HOURS = 6.5, MEALS = 2;
export const DAY_YEARS: [number, number] = [1841, 1921];

/** A person's day: when they rise (minute of the day), how long they sleep, and when they work, if they do; `shift`, minutes
 *  the whole day runs later (720 for one of a kind that keeps the night, section 106). */
export interface Day { rise: number; sleep: number; work?: { start: number; end: number }; shift?: number }
// A kind active by night (kind-sheet.ts: the raws' NOCTURNAL, 54 of 767 creatures) keeps the night (2026-11-18, section 106):
// its whole day, rising, sleep and the hours of its trade, runs twelve hours later [ASSUMED: it passes for people on a night
// shift of the same trade; 1881 had them, bakehouses (the Bakehouses Regulation Act 1863 kept young persons out of their work
// between 9 at night and 5 in the morning) and the pits' night shifts]. Its Sundays and holidays fall where the shifted day
// puts them.
export const NIGHT_SHIFT = 12 * 60;

/** Weekly hours of work in the U.K. in `year` (Huberman & Minns 2007, Table 1). */
export function weekHours(year: number): number {
    const t = WEEK_HOURS;
    if (year <= t[0]![0]) return t[0]![1];
    for (let i = 1; i < t.length; i++) if (year <= t[i]![0]) { const [y0, h0] = t[i - 1]!, [y1, h1] = t[i]!; return h0 + (h1 - h0) * (year - y0) / (y1 - y0); }
    return t.at(-1)![1];
}
const gauss = (rng: Rng) => { let u = 0; while (u === 0) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); };

/** A person's day in `year`: a worker's from the hours of work, anyone else's rising drawn from the London witnesses. */
export function drawDay(rng: Rng, year: number, works: boolean): Day {
    if (works) {
        const start = (rng() < 0.5 ? 6 : 7) * 60, weekday = (weekHours(year) - SATURDAY_HOURS) / 5;
        return { rise: start - TO_WORK, sleep: SLEEP_MIN, work: { start, end: Math.round(start + (weekday + MEALS) * 60) } };
    }
    const rise = Math.round(Math.min(RISE_MAX, Math.max(RISE_MIN, RISE_MEAN + RISE_SD * gauss(rng))));
    return { rise, sleep: SLEEP_MIN };
}

/** Days since 1 January of year 1 (proleptic Gregorian) of a date. */
function epochDay(y: number, m: number, d: number): number {
    const t = new Date(0), e = new Date(0);
    t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1);
    return Math.round((t.getTime() - e.getTime()) / 864e5);
}
/** The date of an epoch day. */
function dateOf(day: number): { y: number; m: number; d: number } {
    const t = new Date(0); t.setUTCFullYear(1, 0, 1); t.setUTCDate(t.getUTCDate() + day);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
/** Easter Sunday of a year (the Gregorian computus, Meeus's form of the anonymous algorithm), as an epoch day. */
export function easter(y: number): number {
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return epochDay(y, month, day);
}
/** 1 January of year 1 was a Monday: 0 Monday … 6 Sunday. */
export const weekday = (day: number) => ((day % 7) + 7) % 7;
/** Whether a person who works has the day off: a Sunday, Good Friday, Christmas Day, and from 1871 the bank holidays. */
export function dayOff(day: number): boolean {
    if (weekday(day) === 6) return true;
    const { y, m, d } = dateOf(day), e = easter(y);
    if (day === e - 2 || (m === 12 && d === 25)) return true;
    if (y < 1871) return false;
    if (day === e + 1 || day === e + 50 || (m === 12 && d === 26)) return true;
    return m === 8 && weekday(day) === 0 && d <= 7;
}

export type Doing = 'asleep' | 'at work' | 'about';
/** What a person with `day` is doing at story minute `t` (a calendar time): asleep, at work, or about. */
export function doingAt(day: Day, t: number): Doing {
    t -= day.shift ?? 0;
    const dn = Math.floor(t / DAY), m = t - dn * DAY, bed = day.rise - day.sleep;
    const asleep = bed >= 0 ? m >= bed && m < day.rise : m >= bed + DAY || m < day.rise;
    if (asleep) return 'asleep';
    if (day.work && !dayOff(dn) && m >= day.work.start && m < (weekday(dn) === 5 ? SATURDAY_END : day.work.end)) return 'at work';
    return 'about';
}
/** The next story minute after `t` at which what they are doing changes (within two days). */
export function nextChange(day: Day, t: number): number {
    if (day.shift) return nextChange({ ...day, shift: 0 }, t - day.shift) + day.shift;
    const now = doingAt(day, t), dn = Math.floor(t / DAY), marks: number[] = [];
    for (let k = 0; k <= 2; k++) {
        const base = (dn + k) * DAY;
        marks.push(base + day.rise, base + day.rise - day.sleep, ...day.work ? [base + day.work.start, base + day.work.end, base + SATURDAY_END] : []);
    }
    for (const c of marks.filter(c => c > t).sort((a, b) => a - b)) if (doingAt(day, c) !== now) return c;
    return t + DAY;
}

/** Whether a scene's place and year have the people's days (England and Wales, the census window). */
export const daysHold = (country: string | null | undefined, year: number | null) => (!country || /united kingdom|england|wales/i.test(country)) && year !== null && year >= DAY_YEARS[0] && year <= DAY_YEARS[1];

const clock = (m: number) => { const x = ((Math.round(m) % DAY) + DAY) % DAY; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
/** The narrator's [WHERE] block: for each person with a day who is not in the scene, what they are doing now and until when.
 * Empty when no one is away. */
export function whereBlock(people: Record<string, Person>, t: number | null, present: string[] | undefined): string {
    if (t === null || !present) return '';
    const here = new Set(present.map(x => x.toLowerCase()));
    const lines = Object.entries(people).filter(([n, p]) => p.day && !p.dead && !here.has(n.toLowerCase())).map(([n, p]) => {
        const what = doingAt(p.day!, t), until = clock(nextChange(p.day!, t));
        return `${n}: ${what === 'asleep' ? 'asleep at home' : what === 'at work' ? `at work${p.occupation ? ` (${p.occupation})` : ''}` : 'awake, not at work'} until ${until}`;
    });
    return lines.length ? `[WHERE]\nWhere the people not in this scene are now, by their usual day (rising, sleep and hours of work of the time and place). Someone sought out is found so, unless the story has moved them.\n${lines.join('\n')}` : '';
}
