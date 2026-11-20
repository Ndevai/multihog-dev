// The kind's hunger (2026-11-17, section 95; time away from the player, part C): a person of the story who is truly of a kind
// that lives on flesh or blood feeds as often as its body needs, while the player's character is elsewhere, and the town finds
// what a feeding leaves. The player's character learns of it only through the story (the player's pick, 2026-11-17): what
// the town finds becomes common knowledge, which the people of the story hold and may speak of; the feeding itself is the
// feeder's secret.
//
// How often: the seed's own minimum (seed.ts dietMinimum: the body's resting need, Kleiber-scaled to its mass, 15 % of it for
// a body with no warmth of its own; an adult's muscle 32,000 kcal, blood 780 kcal a litre, 4.9 litres a body, a draw 0.47
// litres). A kind that kills takes one body each time; one that spares the living takes one draw; one that eats the dead
// takes one body; one that eats its own kind, one of its own. The need runs steadily, so the feedings fall evenly, the first
// at a drawn point of the first interval [ASSUMED: a steady need gives an even spacing].
// When: at the time it is due, if the feeder is away from the scene (not among this turn's people, not named in the call)
// and not at their work; otherwise at the first moment they are [ASSUMED: unseen by the player, outside their working hours].
// What it leaves: a kill leaves a body, a stranger of the place drawn from the 1881 census of England and Wales (the seed's
// people), found by eight the next morning [ASSUMED]; a body taken from the dead leaves an opened grave, found the same way
// [ASSUMED]; a draw from the living leaves a stranger weakened who does not know why, and nothing the town finds; a feeding on
// the kind's own leaves nothing people see.
import type { Person, RuleState } from './types.js';
import { dietMinimum, DRAW_L, BLOOD_KCAL_L, kcalDay, type Diet } from './seed.js';
import { drawPerson } from './census.js';
import { learn } from './knowledge.js';
import { formatStoryTime } from './clock.js';
import { spread, retold } from './retell.js';
import { anBefore } from './memory-meaning.js';
import { def, peek } from './constants.js';

type Rng = () => number;
const DAY = 1440, YEAR = 365 * DAY;
def({ id: 'foundHour', value: 8, unit: 'hour of the morning a body or an opened grave is found', status: 'assumed', src: `the household and the street about by then; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [6, 11], file: 'hunger.ts' });

/** Feedings a year for a diet: bodies for a kind that kills, eats the dead or eats its own; draws for one that spares. */
export function feedsYear(d: Diet, massKg = 70, cold = false): number {
    if (d.food === 'blood' && d.prey === 'S') return 365 * kcalDay(massKg, cold) / BLOOD_KCAL_L / DRAW_L;
    return dietMinimum(d, massKg, cold).bodiesYear;
}

/** A feeder's clock: minutes between feedings, the next one due (story minute), and the diet. */
export type Hunger = NonNullable<Person['hunger']>;
export function hungerFor(d: Diet, massKg: number, cold: boolean, now: number, rng: Rng): Hunger {
    const every = YEAR / feedsYear(d, massKg, cold);
    return { every, next: now + rng() * every, food: d.food, prey: d.prey };
}

const noun = (age: number, sex: string) => age < 18 ? (sex === 'female' ? 'girl' : 'boy') : sex === 'female' ? 'woman' : 'man';
/** A stranger of the place, drawn from the 1881 census: "an 18-year-old woman, a dressmaker,"; one under a year, "a baby
 *  girl". */
export function victimOf(rng: Rng): string {
    const v = drawPerson({}, rng);
    if ('error' in v) return 'a stranger';
    const age = Math.floor(v.age), job = v.occupation?.toLowerCase();
    if (age < 1) return `a baby ${noun(v.age, v.sex)}`;
    return `${anBefore(String(age)) ? 'an' : 'a'} ${age}-year-old ${noun(v.age, v.sex)}${job ? `, ${anBefore(job) ? 'an' : 'a'} ${job},` : ''}`;
}
/** The morning after `t`, at eight: when what a feeding leaves is found. */
export const foundAt = (t: number) => { const at = peek('foundHour') * 60, d = Math.floor(t / DAY); return (t - d * DAY < at ? d : d + 1) * DAY + at; };
const dateOf = (t: number) => formatStoryTime(t).replace(/, \d\d:\d\d(:\d\d)?$/, '');

/** One feeding by `who` at story minute `t`: the feeder's secret, and what the town is to find (kept until it is found). */
export function feed(st: RuleState, who: string, p: Person, t: number, rng: Rng): void {
    t = Math.round(t);
    const h = p.hunger!, where = st.setting?.place ?? st.setting?.label ?? null, inPlace = where ? ` in ${where}` : ' nearby';
    let secret: string, found: string | null = null;
    if (h.prey === 'K') {
        const victim = victimOf(rng);
        secret = `${who} killed ${victim}${inPlace} on ${formatStoryTime(t)} and fed on their ${h.food}`;
        found = `The body of ${victim} was found${inPlace} on the morning of ${dateOf(foundAt(t))}, ${h.food === 'blood' ? 'drained of blood' : 'much of its flesh gone'}`;
    } else if (h.prey === 'R') {
        secret = `${who} opened a fresh grave${inPlace} on ${formatStoryTime(t)} and fed on the dead`;
        found = `A fresh grave${inPlace} was found opened on the morning of ${dateOf(foundAt(t))}, the body gone`;
    } else if (h.prey === 'S') {
        secret = `${who} drew blood from a sleeping stranger${inPlace} on ${formatStoryTime(t)}, who woke weak and did not know why`;
    } else {
        secret = `${who} fed on one of their own kind${inPlace} on ${formatStoryTime(t)}`;
    }
    const f = learn(st, secret, [who], false, { [who]: 'their own' });
    f.secret = true; f.imp = 8;
    // What is found is the world's fact; each person of the story hears it in their own time, through tellers, in their own
    // version (retell.ts); the feeder holds the truth already.
    if (found) { const w = learn(st, found, [], false); w.imp = 7; spread(st, w, foundAt(t), [who]); }
    // The need starts again from this feeding [ASSUMED: one held back by the player's presence is not made up at once].
    h.next = t + h.every;
    h.fed = (h.fed ?? 0) + 1;
}

/** News due by story minute `t` reaches its hearers (retell.ts); an item kept from before section 98 becomes common
 *  knowledge. */
export function release(st: RuleState, t: number): void {
    if (!st.pending?.length) return;
    const due = st.pending.filter(x => x.at <= t);
    if (!due.length) return;
    st.pending = st.pending.filter(x => x.at > t);
    for (const x of due) {
        if (!x.who) { const f = learn(st, x.text, [], true); f.imp = 7; continue; }
        // A person hears the news: the world's own words if the tellings kept them all, else their version of it.
        const told = retold(x.text, x.chain ?? 1, `${x.of}|${x.who}`, st.alike ?? []);
        const f = learn(st, told, [x.who], false, { [x.who]: 'hearsay' }, told === x.text ? undefined : 'version');
        f.imp = 7; if (told !== x.text && x.of != null) f.versionOf = x.of;
        // heard at the time drawn for them, not when the passing of time that carried it ended
        if (f.at) { const k = x.who.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); if (k in f.at) f.at[k] = x.at; }
    }
    if (!st.pending.length) delete st.pending;
}
