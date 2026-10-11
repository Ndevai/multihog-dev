// New characters drawn from a census instead of picked by the narrator (docs/df-body-engine.md §6.11).
import { AGES, OCCUPATIONS } from './data/census-ew-1881.js';

const pick = (rows, weight, rng) => {
    let u = rng() * rows.reduce((s, r) => s + weight(r), 0);
    for (const r of rows) if ((u -= weight(r)) < 0) return r;
    return rows.at(-1);
};
const col = sex => sex === 'female' ? 2 : 1;
const norm = s => String(s ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
// Occupations go to people aged 15 and over: the table has no ages, and working children under 15 were a small share
// [ASSUMED]. Within a 5-year band ages are uniform [ASSUMED]. Age does not depend on occupation [ASSUMED: no age column].
const OCC_MIN_AGE = 15;
const occupied = sex => OCCUPATIONS.reduce((s, o) => s + (sex === 'female' ? o.f : o.m), 0)
    / AGES.filter(a => a[0] >= OCC_MIN_AGE).reduce((s, a) => s + a[col(sex)], 0);

export const findOccupation = text => {
    const t = norm(text);
    return t ? OCCUPATIONS.find(o => norm(o.name).split(' ').includes(t)) ?? OCCUPATIONS.find(o => norm(o.name).includes(t)) ?? null : null;
};

// Birthplace of people living in England and Wales, 1881 (Ravenstein 1885, "The Laws of Migration", J Stat Soc London
// 48:167, tables of the 1881 census): 25 974 439 residents; born in the county where enumerated 18 699 922, a border county
// 3 308 732, elsewhere in England and Wales 2 847 168, Scotland 253 528, Ireland 562 374, elsewhere 302 715. The country
// shares are used at any place [ASSUMED: towns drew more migrants].
export const BIRTHPLACES = [['this county', 18699922], ['a neighbouring county', 3308732], ['elsewhere in England or Wales', 2847168],
    ['Scotland', 253528], ['Ireland', 562374], ['abroad or at sea', 302715]];

/**
 * { sex, age, occupation, born } of a person in England and Wales, 1881. sex, occupation and minAge fix what the story already
 * says; an occupation sets the sex odds from its own men/women counts and an age of at least 15.
 */
export function drawPerson(opts = {}, rng = Math.random) {
    const r = drawBasics(opts, rng);
    return r.error ? r : { ...r, born: pick(BIRTHPLACES, b => b[1], rng)[0] };
}
function drawBasics({ sex = null, occupation = null, minAge = 0 } = {}, rng = Math.random) {
    const job = occupation ? findOccupation(occupation) : null;
    if (occupation && !job) return { error: `No 1881 census occupation matches "${occupation}". Call again with the nearest real trade, or without occupation.` };
    const s = sex ?? (job ? (rng() < job.m / (job.m + job.f) ? 'male' : 'female')
        : rng() < AGES.reduce((t, a) => t + a[1], 0) / AGES.reduce((t, a) => t + a[1] + a[2], 0) ? 'male' : 'female');
    const lo = Math.max(minAge, job ? OCC_MIN_AGE : 0);
    const band = pick(AGES.filter(a => a[0] + 5 > lo), a => a[col(s)], rng);
    const age = Math.max(lo, band[0] + Math.floor(rng() * 5));
    if (job) return { sex: s, age, occupation: job.name };
    if (age < OCC_MIN_AGE || rng() >= occupied(s)) return { sex: s, age, occupation: null };
    return { sex: s, age, occupation: pick(OCCUPATIONS, o => s === 'female' ? o.f : o.m, rng).name };
}
