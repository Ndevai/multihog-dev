import { learn } from './knowledge.js';
import { formatStoryTime } from './clock.js';
import { def, peek } from './constants.js';
export const PER_DAY = 7.4 * 14 / 16 / 14;
def({ id: 'householdMeals', value: 3, unit: 'meetings a day under one roof', status: 'assumed', src: `meals; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [2, 4], file: 'meetings.ts' });
def({ id: 'wakingHours', value: 16, unit: 'hours a day awake', status: 'assumed', src: `about 8 hours asleep; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [14, 17.5], file: 'meetings.ts' });
/** The rate two people meet, a waking day. */
export const meetRate = (a, b) => a.home && b.home && a.home === b.home ? peek('householdMeals') : PER_DAY;
/** The chance they meet in `minutes` both spend awake, away and free. */
export const meetChance = (rate, minutes) => 1 - Math.exp(-rate * minutes / (peek('wakingHours') * 60));
const part = (t) => { const h = (((t % 1440) + 1440) % 1440) / 60; return h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night'; };
/** A meeting of `who` with the one they want something toward, at story minute `t`, `player` away. */
export function meet(st, who, p, other, t, player) {
    const day = formatStoryTime(t).replace(/, \d\d:\d\d(:\d\d)?$/, ''), when = `${day}, in the ${part(t)}`;
    const both = learn(st, `${who} and ${other} met on ${when}${player ? `, ${player} not there` : ''}`, [who, other], false, { [who]: 'their own', [other]: 'their own' });
    both.imp = 4;
    const w = p.want, act = learn(st, `${who} acted on what they want (${w.text.replace(/\.$/, '').replace(/^To /, 'to ').replace(/^(\p{Lu})/u, c => c.toLowerCase())}) when meeting ${other} on ${when}`, [who], false, { [who]: 'their own' });
    act.imp = 6;
    if (w.secret)
        act.secret = true;
    p.want.met = (p.want.met ?? 0) + 1;
}
