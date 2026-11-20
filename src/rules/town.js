import { placeWord } from './seed.js';
import { learn } from './knowledge.js';
import { formatStoryTime } from './clock.js';
import { spread } from './retell.js';
import { foundAt, victimOf } from './hunger.js';
import { seenPer100k } from './society.js';
const YEAR = 365 * 1440;
/** The town of a seed's start: its people, what the living find a year per 100,000, and what is found. */
export function townOf(plan) {
    const diet = plan.law?.diet;
    const how = !diet ? 'unknown' : diet.prey === 'R' ? 'grave' : diet.food === 'blood' ? 'blood' : 'flesh';
    return { people: plan.town, seen: seenPer100k(plan.law, plan.share, plan.deaths), how };
}
/** The kind's kills (or graves opened) a minute in the town, less the circle's own feeders'. */
export function townRate(st) {
    const t = st.town;
    if (!t)
        return 0;
    const own = Object.values(st.people ?? {}).reduce((s, p) => s + (p.hunger && !p.dead && (p.hunger.prey === 'K' || p.hunger.prey === 'R') ? YEAR / p.hunger.every : 0), 0);
    return Math.max(0, t.people * t.seen / 1e5 - own) / YEAR;
}
/** The town's next kill after story minute `t`: an exponential wait at the town's rate; Infinity at none. */
export const nextKill = (st, t, rng) => { const r = townRate(st); return r > 0 ? t - Math.log(1 - rng()) / r : Infinity; };
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const count = (n) => WORDS[n] ?? String(n);
const LEFT = { blood: ['drained of blood', 'drained of blood'], flesh: ['much of its flesh gone', 'much of their flesh gone'], unknown: ['and no one can say what killed them', 'and no one can say what killed them'] };
/** What is found on one morning: the world's record, heard by the circle. */
function report(st, rng) {
    const town = st.town, g = town.found, where = `in the ${placeWord(town.people)}`;
    delete town.found;
    const day = formatStoryTime(g.at).replace(/, \d\d:\d\d(:\d\d)?$/, '');
    let text;
    if (town.how === 'grave')
        text = g.n === 1 ? `A fresh grave ${where} was found opened on the morning of ${day}, the body gone` : `${count(g.n)} fresh graves ${where} were found opened on the morning of ${day}, the bodies gone`;
    else if (g.n === 1) {
        text = `The body of ${victimOf(rng)} was found ${where} on the morning of ${day}, ${LEFT[town.how][0]}`.replace(/,,/g, ',');
    }
    else
        text = `The bodies of ${count(g.n)} people were found ${where} on the morning of ${day}, ${LEFT[town.how][1]}`;
    const w = learn(st, `${text[0].toUpperCase()}${text.slice(1)}`, [], false);
    w.imp = 7;
    spread(st, w, g.at);
}
/** The kind's work in the town up to story minute `until`: each kill waits to be found the next morning with the others
 *  found then; a morning that has come is reported. */
export function townWork(st, until, rng) {
    const town = st.town;
    if (!town)
        return;
    town.next ??= nextKill(st, until, rng);
    while (town.next <= until) {
        const at = foundAt(town.next);
        if (town.found && town.found.at !== at)
            report(st, rng);
        town.found = { at, n: (town.found?.n ?? 0) + 1 };
        town.killed = (town.killed ?? 0) + 1;
        town.next = nextKill(st, town.next, rng);
    }
    if (town.found && town.found.at <= until)
        report(st, rng);
}
