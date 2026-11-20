// People meet while the player's character is away (2026-11-17, section 100; time away, part B): a person of the story who
// wants something toward another of them (the seed's want, Talevich et al. 2017's motives about another person) acts on it
// when they meet, and they meet while both are away from the scene, awake and not at work.
//
// How often: college students kept the Rochester Interaction Record for two weeks (Wheeler & Nezlek 1977, J Pers Soc Psychol
// 35:742): 7.4 interactions of ten minutes or more a day, with 16 different people over the fortnight; so one of those
// people is met 7.4 × 14 / 16 / 14 = 0.46 times a day [ASSUMED: spread evenly over them, where real contact is uneven; and
// students of 1977 for people of 1881]. Two who live under the player's roof meet three times a day [ASSUMED: meals]. A day
// here is the waking hours both share (16 hours [ASSUMED]): the chance of meeting in a stretch both spend awake, away and not
// at work is 1 − e^(−rate × minutes / 960).
// What it leaves: that they met, held by both; that the one who wanted acted on it with the other, held by them (secret when
// the want is). What was said is the story's to tell when it surfaces, by what each now holds.
import type { RuleState, Person } from './types.js';
import { learn } from './knowledge.js';
import { formatStoryTime } from './clock.js';
import { def, peek } from './constants.js';

export const PER_DAY = 7.4 * 14 / 16 / 14;
def({ id: 'householdMeals', value: 3, unit: 'meetings a day under one roof', status: 'assumed', src: `meals; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [2, 4], file: 'meetings.ts' });
def({ id: 'wakingHours', value: 16, unit: 'hours a day awake', status: 'assumed', src: `about 8 hours asleep; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [14, 17.5], file: 'meetings.ts' });
/** The rate two people meet, a waking day. */
export const meetRate = (a: Person, b: Person) => a.home && b.home && a.home === b.home ? peek('householdMeals') : PER_DAY;
/** The chance they meet in `minutes` both spend awake, away and free. */
export const meetChance = (rate: number, minutes: number) => 1 - Math.exp(-rate * minutes / (peek('wakingHours') * 60));

const part = (t: number) => { const h = (((t % 1440) + 1440) % 1440) / 60; return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; };
/** A meeting of `who` with the one they want something toward, at story minute `t`, `player` away. */
export function meet(st: RuleState, who: string, p: Person, other: string, t: number, player: string | null): void {
    const day = formatStoryTime(t).replace(/, \d\d:\d\d(:\d\d)?$/, ''), when = `${day}, in the ${part(t)}`;
    const both = learn(st, `${who} and ${other} met on ${when}${player ? `, ${player} not there` : ''}`, [who, other], false, { [who]: 'their own', [other]: 'their own' });
    both.imp = 4;
    const w = p.want!, act = learn(st, `${who} acted on what they want (${w.text.replace(/\.$/, '').replace(/^To /, 'to ').replace(/^(\p{Lu})/u, c => c.toLowerCase())}) when meeting ${other} on ${when}`, [who], false, { [who]: 'their own' });
    act.imp = 6; if (w.secret) act.secret = true;
    p.want!.met = (p.want!.met ?? 0) + 1;
}
