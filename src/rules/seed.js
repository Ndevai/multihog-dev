// The seed (the player's picks, 2026-11-16): one roll gives a start the player did not have to imagine, held in the engine's
// records, not in a text. A code of readable parts, PLACE+YEAR, LAW, N, D, K+count, salt (EW1881-BH.RA-N4-D2-K5-7f2c): the same code
// gives the same start, and a part changed changes its own part (each part draws from its own stream). What it fixes: the
// player's character, drawn from the 1881 census of England and Wales; the people around them, one under their roof; each
// person's want, from the 161 motives of Talevich et al. 2017, some kept secret; and one of them truly of the law's kind,
// hidden. The player is shown what their character knows; the rest is met in the story.
import { seededRng, KCAL_DAY } from './body-engine.js';
import { def, k, peek } from './constants.js';
import { drawPerson } from './census.js';
import { MOTIVES } from './data/motives.js';
import { BODY, tellsOf } from './tells.js';
import { rollSheet, sheetLines } from './kind-sheet.js';
import { ewYear } from './world-count.js';
const hex = (rng, n = 4) => Array.from({ length: n }, () => Math.floor(rng() * 16).toString(16)).join('');
// The world's kind, on axes (the player's pick, 2026-11-16: "visitor" is one point of a semantic space; decompose it). Body:
// the human functions it lacks, letters of tells.ts BODY (B breath, H warmth, S sleep, E food, D drink, P pain, F fear); the
// engine computes what shows of them. Origin: how one came to be (B born so, M made, R came back from death, E came from
// elsewhere). Passing: how it goes unnoticed (A looks like anyone, C copies one person, H keeps out of sight). Diet (the
// player's pick, 2026-11-16: a body that does not eat still needs energy, so its diet is stated with its minimum, and how
// deadly the kind is follows from it): a body that lacks food (E) lives on flesh or blood, and the engine computes the least it
// must take from what it charges any body, 1,400 kcal a day at rest (body-engine.ts KCAL_DAY, Tipton & Montgomery 2025). Flesh:
// about 32,000 kcal in an adult's skeletal muscle (Cole 2017, Sci Rep 7:44707, as reported by the University of Brighton and
// NPR; the paper's table not read), taken by killing. Blood: about 780 kcal a litre [ASSUMED: estimated from its normal
// make-up, haemoglobin about 150 g and plasma proteins about 70 g a litre of plasma, plasma 55 % of blood, at Atwater's 4 kcal
// a gram], taken by killing (the whole blood of a 70 kg adult, 70 mL a kilogram, body-engine.ts bloodVolume) or by draws of a
// donation's size, about 470 mL (NHS Blood and Transplant). Warmth, breath and sleep give a body no energy (heat at its own
// temperature does no work, the second law of thermodynamics), so lacking them takes nothing. No name is stored: a name is
// what people in the story call it. A law reads BH.RA (body letters, a dot, origin and passing), and BHE.RA.BK with a diet
// (a dot, F flesh or B blood, K kills to feed or S spares).
export const ORIGIN = { B: 'are born so', M: 'were made', R: 'came back from death', E: 'came from elsewhere' };
export const PASSING = { A: 'look like anyone', C: 'copy one person\'s face and voice', H: 'keep out of sight' };
export const FLESH_KCAL = 32000, BLOOD_KCAL_L = 780, BLOOD_L = 0.07 * 70, DRAW_L = 0.47;
// Size, warmth and prey (the player's point, 2026-11-16: one in fifty flesh-eaters can work: smaller, cannibals, other ways):
// energy scales with body mass to the 0.75 (Kleiber, as body-engine.ts kleiber); a body with no warmth of its own (H) rests at
// 10–20 % of a warm one's rate (Bennett & Ruben 1979, Science 206:649: endotherms' resting and maximal rates five- to tenfold
// ectotherms'), taken as 15 % [ASSUMED midpoint]. Prey: the living, killed (K) or spared (S, blood only); the dead (R, flesh
// only), whose supply is the place's deaths; or their own kind (O), which cannot keep them: about a tenth of the energy eaten
// passes to the eater (Pauly & Christensen 1995, Nature 374:255), and each meal costs one of them, so they thin.
export const COLD_SHARE = 0.15;
def({ id: 'coldMetShare', value: COLD_SHARE, unit: 'share of a warm body\'s heat production, at rest and at work', status: 'assumed', src: 'Bennett & Ruben 1979 (Science 206:649): endotherms\' resting and maximal rates five- to tenfold ectotherms\'; the midpoint', range: [0.1, 0.2], file: 'seed.ts' });
// England and Wales in 1881: 33.9 births and 18.9 deaths per 1,000 a year (the Registrar General's fourth quarterly return for
// 1881, as quoted in the London Medical Officer of Health reports).
export const EW_1881_RATES = { births: 33.9, deaths: 18.9 };
const round1 = (x) => Math.round(x * 10) / 10;
/** A day's energy, kcal, for a body of `massKg`, warm or with no warmth of its own. */
export const kcalDay = (massKg = 70, cold = false) => KCAL_DAY.rest * (massKg / 70) ** 0.75 * (cold ? peek('coldMetShare') : 1);
/** The least a body living on its diet takes, at rest: a day's amount in words, the bodies it needs a year, and how many of
 * the living it kills a year. */
export function dietMinimum(d, massKg = 70, cold = false) {
    const kcal = kcalDay(massKg, cold);
    if (d.food === 'flesh') {
        const bodies = 365 * kcal / FLESH_KCAL;
        return { perDay: `one adult's muscle every ${Math.round(FLESH_KCAL / kcal)} days`, bodiesYear: bodies, killsYear: d.prey === 'K' ? bodies : 0 };
    }
    const l = kcal / BLOOD_KCAL_L, bodies = 365 * kcal / (BLOOD_KCAL_L * BLOOD_L);
    return { perDay: `${round1(l)} L of blood a day${d.prey === 'S' ? `, about ${Math.round(l / DRAW_L)} donation-sized draws` : ''}`, bodiesYear: bodies, killsYear: d.prey === 'K' ? bodies : 0 };
}
const PREY_SAYS = { K: 'of the living, and kill to take it', S: 'of the living, taken without killing', R: 'of the dead', O: 'of their own kind' };
/** The world-book entry a law on axes gives for a body of `massKg`, or the reason it does not read. */
export function readLaw(law, massKg = 70) {
    const m = /^([BHSEDPF]+)\.([BMRE])([ACH])(?:\.([FB])([KSRO]))?$/.exec(law);
    if (!m)
        return { error: `The law ${law} does not read: body letters BHSEDPF, a dot, origin BMRE and passing ACH, and with E a dot and the diet (F flesh or B blood; K the living, killed; S the living, spared; R the dead; O their own kind).` };
    const body = [...new Set(m[1].split(''))].filter(x => BODY[x]);
    if (body.includes('E') !== !!m[4])
        return { error: body.includes('E') ? `A body that does not eat (E) lives on something else: add its diet, ${law}.FK, .FR, .FO, .BK, .BS or .BO.` : `Only a body that does not eat (E) has a diet of its own (${law}).` };
    if (m[4] === 'F' && m[5] === 'S')
        return { error: 'Flesh cannot be taken while sparing the living: FK, FR (the dead) or FO (their own kind).' };
    if (m[4] === 'B' && m[5] === 'R')
        return { error: 'Blood is taken from the living, or from their own kind: BK, BS or BO.' };
    const diet = m[4] ? { food: m[4] === 'F' ? 'flesh' : 'blood', prey: m[5], kills: m[5] === 'K' } : undefined;
    const min = diet ? dietMinimum(diet, massKg, body.includes('H')) : null;
    const list = (xs) => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs.at(-1)}` : xs[0] ?? '';
    const size = massKg !== 70 ? `; they weigh about ${massKg} kg` : '';
    const eats = diet ? `; they live on ${diet.food} ${PREY_SAYS[diet.prey]}, at least ${min.perDay}` : '';
    const what = `people who ${ORIGIN[m[2]]}; they ${list(body.map(x => BODY[x].says))}${size}; they ${PASSING[m[3]]}${eats}`;
    return { what, kind: 'people', worldwide: true, cause: `Some people ${ORIGIN[m[2]]}.`, reaches: ['religion and folklore', 'daily life'], reflections: [],
        body: body.map(x => BODY[x].token), origin: ORIGIN[m[2]], passing: PASSING[m[3]], need: diet ? `${diet.food}: ${min.perDay}` : 'nothing', ...diet ? { diet } : {}, ...massKg !== 70 ? { mass: massKg } : {} };
}
/** The world-book entry a law on axes gives, or null for a law that does not read. */
export const kindOf = (law) => { const r = readLaw(law); return 'error' in r ? null : r; };
// Names (the player's point, 2026-11-16: "someone must've come with a name"): a name is first said by one person, who noticed
// one side of the kind; whether it takes hold is decided by the many who take it up. The same idea is often had by several
// people independently (Ogburn & Thomas 1922 listed 148 inventions made twice or more; Merton 1961 called such multiples the
// dominant pattern), and the number of independent finders follows a Poisson distribution (Simonton 1978, Soc Stud Sci 8:521):
// 1 + Poisson(1) coiners [ASSUMED mean: the paper's fit not read]. The kind first appeared 1–100 years before the story [ASSUMED,
// evenly]; each coiner, a census adult, names it after one feature, each feature equally likely to be the one noticed
// [ASSUMED], at a year between its appearance and the story [ASSUMED, evenly]; the word is the plain word for that feature.
// A name spreads as new products do (the Bass model: p = 0.03, q = 0.38 a year, the averages of Mahajan, Muller & Bass 1995,
// Marketing Science 14:G79 [ASSUMED: a name spreads like a product]); a person knows it with the share who have taken it up,
// and calls the kind by the most widespread name they know. Everyone counts as able to hear a name [ASSUMED: the model's market
// potential set to all]; how far word of a rare kind travels, by how many there are and how many they kill, is still to be
// researched.
const NAME_OF = { 'body B': 'the breathless', 'body H': 'the cold ones', 'body S': 'the sleepless', 'body E': 'the fasting', 'body D': 'the dry ones', 'body P': 'the unfeeling', 'body F': 'the fearless',
    'diet F': 'the flesh-eaters', 'diet B': 'the blood-drinkers', 'origin B': 'the born ones', 'origin M': 'the made', 'origin R': 'the returned', 'origin E': 'the incomers', 'passing A': 'the lookalikes', 'passing C': 'the doubles', 'passing H': 'the hidden' };
export const bassShare = (years, p = 0.03, q = 0.38) => years <= 0 ? 0 : (1 - Math.exp(-(p + q) * years)) / (1 + (q / p) * Math.exp(-(p + q) * years));
const poisson = (rng, mean) => { let k = 0, t = Math.exp(-mean), u = rng(), c = t; while (u > c && k < 50) {
    k++;
    t *= mean / k;
    c += t;
} return k; };
/** A law drawn on the axes: each body switch on with an even chance, at least one; origin and passing each as likely
 * [ASSUMED]. */
export function rollLaw(rng) {
    let body = Object.keys(BODY).filter(() => rng() < 0.5).join('');
    if (!body)
        body = Object.keys(BODY)[Math.floor(rng() * 7)];
    const o = Object.keys(ORIGIN), p = Object.keys(PASSING), diets = ['FK', 'FR', 'FO', 'BK', 'BS', 'BO'];
    return `${body}.${o[Math.floor(rng() * o.length)]}${p[Math.floor(rng() * p.length)]}${body.includes('E') ? `.${diets[Math.floor(rng() * diets.length)]}` : ''}`;
}
// Two ratings place a world on one map whatever its story (the player's picks, 2026-11-16: "1–10 is arbitrary"; "it should
// also be percentage because year 1000 pop differs from 2026"): each step ten times the last, and each a share of the people
// alive there and then, so a rating means the same in any year and the counts follow the place's population. N, how many:
// one person in 10^N is one of the kind (N0 all, N7 one in ten million). D, how deadly: 10^(D−1) deaths they cause per
// 100,000 people a year (D0 0.1, D4 1,000), the unit of the homicide rates the engine holds (Eisner 2003: Europe 41 in the
// 1400s, 2.6 in the 1800s, 1.4 in the 1900s). Together they give how many people each one of them kills a year, D ÷ (share ×
// 100,000).
export const shareOfN = (n) => 10 ** -n;
export const deathsOfD = (d) => 10 ** (d - 1);
export const killsEach = (n, d) => deathsOfD(d) / (shareOfN(n) * 1e5);
// A roll keeps to worlds where each one kills at most one person a day [ASSUMED edge], each step of N (1–7) and D (0–4) as
// likely as another among those [ASSUMED]. Where feeding kills (prey K, or R beyond what the dead supply), D is not given: it
// follows from the diet. No world is refused for its numbers: the engine says what it does to the living (below). A roll keeps
// to worlds of at most D4's 1,000 deaths per 100,000 a year [ASSUMED].
const MAX_KILLS_EACH = 365, MAX_DEATHS = 1000;
/** The parts of a code, or the reason it cannot be read. Years within 40 of 1881, the span the engine reads the census for. */
export function parseSeed(code) {
    const m = /^\s*(EW)(\d{4})[-\s]+([BHSEDPF]+\.[BMRE][ACH](?:\.[FB][KSRO])?|WB\d+)(?:[-\s]+W(\d{1,3}))?[-\s]+N(\d)(?:[-\s]+D(\d))?[-\s]+K(\d)[-\s]+([0-9a-f]{4,12})\s*$/i.exec(code.replace(/^(\s*EW\d{4}[-\s]+)([a-z.]+)/i, (_, a, l) => a + l.toUpperCase()));
    if (!m)
        return { error: 'A seed reads like EW1881-BH.RA-N4-D2-K5-7f2c: place and year; the law (body letters BHSEDPF, a dot, origin BMRE and passing ACH, or WB1… for the world book\'s kinds); how many (N); how deadly (D); K and the number of people; the draw.' };
    const year = Number(m[2]), mass = m[4] == null ? 70 : Number(m[4]), n = Number(m[5]), d = m[6] == null ? null : Number(m[6]), count = Number(m[7]), law = m[3].toUpperCase();
    // Size: 10–200 kg [ASSUMED range, from a child's mass to a large man's].
    if (mass < 10 || mass > 200)
        return { error: `W gives their mass, 10 to 200 kg (got ${mass}).` };
    if (Math.abs(year - 1881) > 40)
        return { error: `EW seeds hold the years 1841–1921, the span the engine reads the 1881 census for (got ${year}).` };
    if (n > 7)
        return { error: `N gives 0 (all) to 7 (one in ten million) (got ${n}).` };
    if (d != null && d > 4)
        return { error: `D gives 0 (0.1 deaths per 100,000 a year) to 4 (1,000) (got ${d}).` };
    if (count < 3 || count > 7)
        return { error: `K gives 3 to 7 people around you (got ${count}).` };
    return { place: 'EW', year, law, mass, n, d, count, salt: m[8].toLowerCase() };
}
export const seedText = (s) => `${s.place}${s.year}-${s.law}${s.mass === 70 ? '' : `-W${s.mass}`}-N${s.n}${s.d == null ? '' : `-D${s.d}`}-K${s.count}-${s.salt}`;
/** A new code: England and Wales 1881, the card's first kind with tells (WB1) or one of this project's own, the two ratings,
 * five people, a fresh draw. */
export function rollSeed(rng, bookKinds) {
    const law = bookKinds ? 'WB1' : rollLaw(rng), kind = bookKinds ? null : kindOf(law);
    if (kind?.diet && (kind.diet.prey === 'K' || kind.diet.prey === 'R')) {
        const need = dietMinimum(kind.diet, 70, !!kind.body?.includes('NO_HEAT')), ns = [1, 2, 3, 4, 5, 6, 7].filter(n => feedingDeaths(kind.diet, need.bodiesYear, shareOfN(n)) <= MAX_DEATHS);
        return seedText({ place: 'EW', year: 1881, law, mass: 70, n: ns.length ? ns[Math.floor(rng() * ns.length)] : 7, d: null, count: 5, salt: hex(rng, 4) });
    }
    const pairs = [];
    for (let n = 1; n <= 7; n++)
        for (let d = 0; d <= 4; d++)
            if (killsEach(n, d) <= MAX_KILLS_EACH)
                pairs.push([n, d]);
    const [n, d] = pairs[Math.floor(rng() * pairs.length)];
    return seedText({ place: 'EW', year: 1881, law, mass: 70, n, d, count: 5, salt: hex(rng, 4) });
}
// The town the player's character lives in (2026-11-17, section 101): how the people of England and Wales lived in 1881
// (The Statesman's Year-Book 1899, p. 359, from the census): 29.6 % in the 20 towns of over 100,000 and 56.3 % in the 303
// towns of over 10,000; the 26.7 points between split as 1891's 29.9 were (towns of over 50,000 9.0, over 20,000 12.6, over
// 10,000 8.3; the same page) [ASSUMED: 1881 split as 1891]; the other 43.7 % in smaller towns and villages. Within a band the
// size is drawn even on a log scale [ASSUMED], the smallest places from 500 [ASSUMED], the largest to 4 million (London had
// 3.8 million in 1881). Its own stream, so the draws before section 101 stay as they were.
const scaled = (x) => x * 26.7 / 29.9;
def({ id: 'smallestPlace', value: 500, unit: 'people in the smallest place drawn', status: 'assumed', src: 'a hamlet of some hundred households [ASSUMED]', range: [100, 1000], file: 'seed.ts' });
/** The bands of 1891 (the same page, read directly): 31.6 % in towns of over 100,000, 40.6 over 50,000, 53.2 over 20,000,
 *  61.5 over 10,000; a seed from 1886 on draws by them, 1901 and 1911 as 1891 [ASSUMED: the nearest census the page gives]. */
export const TOWN_BANDS_1891 = [[0.316, 100_000, 4_500_000], [0.090, 50_000, 100_000], [0.126, 20_000, 50_000], [0.083, 10_000, 20_000], [0.385, 0, 10_000]];
/** The 1881 bands: the share of people, the band's smallest place (0: smallestPlace) and largest. */
export const TOWN_BANDS = [[0.296, 100_000, 4_000_000], [scaled(0.090), 50_000, 100_000], [scaled(0.126), 20_000, 50_000], [scaled(0.083), 10_000, 20_000], [0.437, 0, 10_000]];
/** A town's people, drawn as a person of the seed's year would live in one (1881's bands before 1886, 1891's from then; for
 *  1841–1880, 1881's [ASSUMED: the nearest census given; the 1871 General Report's table of 103 large towns would give the
 *  larger bands for 1851–1871, the smaller ones not]). */
export function drawTown(rng, year = 1881) {
    const bands = year >= 1886 ? TOWN_BANDS_1891 : TOWN_BANDS;
    let u = rng() * bands.reduce((s, b) => s + b[0], 0);
    for (const [share, low, hi] of bands) {
        const lo = low || k('smallestPlace');
        if (u < share)
            return Math.round(Math.exp(Math.log(lo) + rng() * (Math.log(hi) - Math.log(lo))));
        u -= share;
    }
    return 5000;
}
def({ id: 'villageUnder', value: 2000, unit: 'people: a place smaller is a village', status: 'assumed', src: 'the 1881 census drew no line by size; a village of up to some hundreds of households [ASSUMED]', range: [1000, 5000], file: 'seed.ts' });
def({ id: 'cityFrom', value: 100_000, unit: 'people: a place this large or larger is a city', status: 'assumed', src: 'the Statesman\'s Year-Book\'s top band of towns [ASSUMED as the word people use]', range: [50_000, 200_000], file: 'seed.ts' });
/** What a place of so many people is called: a village, a town or a city (villageUnder, cityFrom; read with peek, as the
 *  town's finds name it inside PassTime, where a sensitivity rerun per judged value would cost too much). */
export const placeWord = (people) => people < peek('villageUnder') ? 'village' : people >= peek('cityFrom') ? 'city' : 'town';
/** "a town of about 23,000 people": the size to two figures. */
export const townWords = (people) => `a ${placeWord(people)} of about ${Number(people.toPrecision(2)).toLocaleString('en-GB')} people`;
// The people around the player: the closest circle people keep is about five (the support clique of the hierarchy of group
// sizes, Zhou, Sornette, Hill & Dunbar 2005, Proc R Soc B 272:439); K sets it, 3 to 7 [ASSUMED range]. One lives under
// their roof, by a tie their age allows; the others are tied by work, neighbourhood or money [ASSUMED lists, each tie equally
// likely among those that fit]. Ages for the household tie [ASSUMED]: a spouse within 5 years and of the other sex, a parent
// 20–40 years older, a sibling within 10, a child 18–40 years younger and 8 or older, a lodger 16 or older.
const HOME = [
    { name: ['husband', 'wife'], fits: a => a >= 18, age: y => [y - 5, y + 5], other: true },
    { name: ['father', 'mother'], fits: a => a <= 50, age: y => [y + 20, y + 40] },
    { name: ['brother', 'sister'], fits: () => true, age: y => [y - 10, y + 10] },
    { name: ['son', 'daughter'], fits: a => a >= 26, age: y => [Math.max(8, y - 40), y - 18] },
    { name: ['lodger', 'lodger'], fits: () => true, age: () => [16, 80] },
];
// A work tie needs the player to have an occupation: a workmate is drawn from the census's people of that trade. The census
// does not say who employs whom, so no employer is drawn.
// An old friend is within 10 years of the player's age [ASSUMED]. Each tie also reads in the third person, {me} the player's
// character, for the record.
const TIES = [['the workmate', 'works beside you', true, 'works beside {me}'], ['the neighbour', 'lives next door', false, 'lives next door to {me}'],
    ['the creditor', 'is owed money by you', false, 'is owed money by {me}'], ['the debtor', 'owes you money', false, 'owes {me} money'], ['the old friend', 'has been your friend for years', false, 'has been {me}\'s friend for years']];
// Motives about another person (Avoid Rejections V17, Avoid Conflict V18, Interpersonally Effective V21, Social Life &
// Friendship V22, Liked V23, Sexual and Emotional Intimacy V24–V25, Better than Others V28, Control of Others V29, Leadership
// V30) aim at someone of the circle or the player, each as likely [ASSUMED]; the paper gives no frequencies of a person's
// strongest motive, so each of the 161 is equally likely [ASSUMED]; half are kept secret [ASSUMED].
const TOWARD = /V(1[78]|2[1-5]|2[89]|30)$/;
/** A person drawn by the census within an age window, of a sex and trade when given, with an occupation when `working`
 * (rejection sampling, 400 tries, then the last draw kept within the window). */
function drawIn(rng, lo, hi, sex, opts = {}) {
    const one = () => drawPerson({ sex, minAge: Math.max(0, lo), occupation: opts.occupation ?? null }, rng);
    let r = one();
    for (let i = 0; i < 400 && (r.age > hi || opts.working && !r.occupation); i++)
        r = one();
    return { sex: r.sex, age: Math.min(hi, r.age), occupation: r.occupation, born: r.born };
}
function drawWant(rng, others) {
    const [motive, text, cluster] = MOTIVES[Math.floor(rng() * MOTIVES.length)];
    const toward = TOWARD.test(cluster) ? others[Math.floor(rng() * others.length)] : undefined;
    return { motive, text, cluster, ...toward ? { toward } : {}, secret: rng() < 0.5 };
}
/** The start a code gives. `book`: the card's world book (WB codes take its kinds with tells, in order). */
export function drawStart(code, book = []) {
    const s = parseSeed(code);
    if ('error' in s)
        return s;
    const kinds = book.filter(e => e.tells?.length || e.body?.length);
    const read = /^WB\d+$/.test(s.law) ? kinds[Number(s.law.slice(2)) - 1] ?? { error: `The world book holds ${kinds.length} kind(s) with tells; ${s.law} names none.` } : readLaw(s.law, s.mass);
    if ('error' in read)
        return read;
    const stream = (part) => seededRng(`${s.salt}:${part}`);
    // Every kind gets its sheet, every field filled (kind-sheet.ts), from its own stream: a world-book kind keeps one it has.
    const law = { ...read, sheet: read.sheet ?? rollSheet(read, s.mass, tellsOf(read).map(t => t.sign), stream('sheet')) }, diet = law.diet, share = shareOfN(s.n);
    const need = diet ? dietMinimum(diet, s.mass, !!law.body?.includes('NO_HEAT')) : null, derived = !!diet && (diet.prey === 'K' || diet.prey === 'R');
    if (derived && s.d != null)
        return { error: `This kind's feeding sets how deadly it is: leave D out (${seedText({ ...s, d: null })}).` };
    if (!derived && s.d == null)
        return { error: 'Give D, how deadly they are: D0 (0.1 deaths per 100,000 a year) to D4 (1,000).' };
    // The dead feed as many as the place's deaths allow, counted as adults' muscle (an upper bound: many of the dead are
    // children); the rest kill [ASSUMED: those the dead cannot feed take the living].
    // The seed's own year's births and deaths (section 109): the dead it leaves, and what the living can bear.
    const rates = ewYear(s.year), deadSupply = (rates?.deaths ?? EW_1881_RATES.deaths) * 100;
    const deaths = !derived ? deathsOfD(s.d) : feedingDeaths(diet, need.bodiesYear, share, rates?.deaths);
    const each = derived ? deaths / (share * 1e5) : killsEach(s.n, s.d);
    const outcome = outcomeFor(deaths, diet, need, share, deadSupply, rates);
    const d = stream('date'), dayOfYear = Math.floor(d() * 365), date = new Date(Date.UTC(s.year, 0, 1 + dayOfYear));
    const you = drawIn(stream('you'), 16, 90, null);
    const people = [], none = { motive: '', text: '', cluster: '', secret: false };
    {
        const r = stream('home'), fits = HOME.filter(h => h.fits(you.age)), h = fits[Math.floor(r() * fits.length)], [lo, hi] = h.age(you.age);
        const x = drawIn(r, lo, hi, h.other ? (you.sex === 'male' ? 'female' : 'male') : null), name = h.name[x.sex === 'male' ? 0 : 1];
        people.push({ label: `the ${name}`, relation: name === 'lodger' ? 'lodges under your roof' : `your ${name}, under your roof`, tie: name === 'lodger' ? 'lodges under {me}\'s roof' : `is {me}'s ${name}, under {me}'s roof`, ...x, want: none });
    }
    for (let i = 1; i < s.count; i++) {
        const ties = TIES.filter(t => !t[2] || you.occupation), r = stream(`p${i}`), [label, relation, , tie] = ties[Math.floor(r() * ties.length)];
        const n = people.filter(p => p.label.replace(/^the (second |third |fourth )/, 'the ') === label).length;
        const x = label === 'the workmate' ? drawIn(r, 16, 80, null, { occupation: you.occupation }) : label === 'the old friend' ? drawIn(r, Math.max(16, you.age - 10), you.age + 10, null) : drawIn(r, 16, 80, null);
        people.push({ label: n ? label.replace(/^the /, `the ${['second', 'third', 'fourth'][n - 1]} `) : label, relation, tie, ...x, want: none });
    }
    for (let i = 0; i < s.count; i++)
        people[i].want = drawWant(stream(`want${i}`), ['you', ...people.filter((_, j) => j !== i).map(p => p.label)]);
    // Each person is truly of the law's kind with the world's share, N, each from their own stream: in a world of one in ten
    // thousand most circles hold none, and the kind is met, if at all, beyond them.
    for (let i = 0; i < s.count; i++)
        if (stream(`truly${i}`)() < shareOfN(s.n))
            people[i].truly = true;
    // The kind's names, their coiners and how far each has spread (above); for a world-book kind with no axes, its own name.
    const ns = stream('names'), since = s.year - (1 + Math.floor(ns() * 100)), names = [];
    const m = /^([BHSEDPF]+)\.([BMRE])([ACH])(?:\.([FB])[KS])?$/.exec(s.law), features = m ? [...[...new Set(m[1].split(''))].map(x => `body ${x}`), `origin ${m[2]}`, `passing ${m[3]}`, ...m[4] ? [`diet ${m[4]}`] : []] : [];
    const coiners = features.length ? 1 + poisson(ns, 1) : 0;
    for (let i = 0; i < coiners; i++) {
        const r = stream(`coiner${i}`), noticed = features[Math.floor(r() * features.length)], name = NAME_OF[noticed];
        if (names.some(x => x.name === name))
            continue;
        const year = since + Math.floor(r() * (s.year - since)), c = drawIn(r, 16, 80, null);
        names.push({ name, noticed, year, coiner: { sex: c.sex, age: c.age, occupation: c.occupation }, share: bassShare(s.year - year) });
    }
    if (!m && law)
        names.push({ name: law.what, noticed: 'the world book', year: since, coiner: { sex: 'male', age: 0, occupation: null }, share: 1 });
    names.sort((a, b) => b.share - a.share);
    const knows = {};
    for (const who of ['you', ...people.map(p => p.label)]) {
        const r = stream(`knows:${who}`);
        knows[who] = names.filter(x => r() < x.share).map(x => x.name);
    }
    return { code: seedText(s), year: s.year, month: date.getUTCMonth() + 1, day: date.getUTCDate(), law, lawKey: s.law, mass: s.mass, n: s.n, d: s.d, share, deaths, killsEach: each, outcome, since, names, knows, you, people, town: drawTown(stream('town'), s.year) };
}
/** What the player's character knows of the start: themselves, each person's tie, age, sex and work, and the wants they
 * show; the secret wants and who is truly of the kind stay out. */
/** The world count's origins (world-count.ts) for the law's; a world-book kind of another origin counts as born so, as its
 *  sheet's Numbers reads (kind-sheet.ts). */
const ORIGIN_OF = { [ORIGIN.B]: 'born', [ORIGIN.M]: 'made', [ORIGIN.R]: 'returned', [ORIGIN.E]: 'arrived' };
/** How the kind's number changes in the world count (world-count.ts, section 110): its origin, from the law; what each one
 *  kills a year, its need where it lives on its kills (prey K, or R beyond the dead) or the seed's D otherwise; one that eats
 *  its own thins at the rate its outcome gives. */
export function kindGrowth(p) {
    const diet = p.law?.diet, need = diet ? dietMinimum(diet, p.mass, !!p.law?.body?.includes('NO_HEAT')) : null;
    const derived = !!diet && (diet.prey === 'K' || diet.prey === 'R');
    return { origin: ORIGIN_OF[p.law?.origin ?? ''] ?? 'born', killsEach: derived ? need.bodiesYear : p.killsEach, eatsDead: diet?.prey === 'R', feeds: derived, eatsOwn: diet?.prey === 'O' ? need.bodiesYear : 0 };
}
/** Deaths per 100,000 a year that a kind's feeding causes: each body it needs from the living (K), or what the dead of the
 * place cannot supply (R). */
export function feedingDeaths(diet, bodiesYear, share, deathsPer1000 = EW_1881_RATES.deaths) {
    const wanted = share * 1e5 * bodiesYear;
    return diet.prey === 'K' ? wanted : diet.prey === 'R' ? Math.max(0, wanted - deathsPer1000 * 100) : 0;
}
/** What a world does to the living, in words: steady, a slow decline or a collapse, against England and Wales's births and
 * deaths of the seed's year (world-count.ts ewYear; before section 109, 1881's only); for a kind that eats its own, how fast
 * they thin. */
function outcomeFor(deaths, diet, need, share, deadSupply, rates) {
    const parts = [];
    if (diet?.prey === 'R') {
        const fed = Math.min(1, deadSupply / Math.max(1e-9, share * 1e5 * need.bodiesYear));
        parts.push(fed >= 1 ? `the dead feed all of them (at most ${num(deadSupply)} bodies per 100,000 a year), and they kill no one to eat` : `the dead feed ${Math.round(fed * 100)} % of them; the rest kill`);
    }
    if (diet?.prey === 'O')
        parts.push(`they eat each other and thin: their number halves every ${num(Math.log(2) / Math.max(1e-9, need.bodiesYear))} years`);
    if (!rates)
        return parts.join('; ');
    const net = rates.births - rates.deaths - deaths / 100;
    parts.push(deaths >= 1e5 ? 'the living are gone within a year' : net >= 0 ? `the living still grow ${round1(net / 10)} % a year` : `the living fall ${round1(-net / 10)} % a year and halve in ${num(Math.log(2) / (-net / 1000))} years`);
    return parts.join('; ');
}
const num = (x) => x >= 100 ? Math.round(x).toLocaleString('en-GB') : x >= 1 ? String(Math.round(x * 10) / 10) : String(Number(x.toPrecision(2)));
const pct = (x) => `${Number((x * 100).toPrecision(2))} %`;
const ratio = (x) => x >= 1 ? 'everyone' : `one person in ${Math.round(1 / x).toLocaleString('en-GB')}`;
/** England and Wales in 1881: 25,974,439 people (Ravenstein 1885, J Stat Soc London 48:167, from the census). */
export const EW_1881 = 25_974_439;
/** What the player is shown of a start, in parts (the start's card, start-card.ts; knownStart joins them as text). */
export function startParts(p, population = ewYear(p.year) ? { people: Math.round(ewYear(p.year).people), where: 'England and Wales' } : null) {
    const job = (x) => x.occupation ?? (x.age < 15 ? 'a child' : 'no occupation the census lists');
    const sexAge = (x) => `${x.sex === 'female' ? (x.age < 18 ? 'girl' : 'woman') : x.age < 18 ? 'boy' : 'man'}, ${x.age}`;
    const cap = (t) => `${t[0].toUpperCase()}${t.slice(1)}`;
    return {
        code: p.code, where: 'England and Wales', town: townWords(p.town),
        when: `${p.day} ${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][p.month - 1]} ${p.year}, nine at night`,
        you: `${sexAge(p.you)}; ${job(p.you)}; born in ${p.you.born}`,
        people: p.people.map(x => ({ who: cap(x.label), relation: x.relation, line: `${sexAge(x)}; ${job(x)}`,
            wants: x.want.secret ? null : `${x.want.text.replace(/\.$/, '').toLowerCase()}${x.want.toward ? ` (toward ${x.want.toward})` : ''}` })),
        names: p.knows.you?.length ? { main: p.knows.you[0], also: p.knows.you.slice(1) } : null,
        law: p.law?.what ?? null,
        sheet: p.law?.sheet ? sheetLines(p.law.sheet) : [],
        ratings: `how many, ${ratio(p.share)} (${pct(p.share)}); how deadly, ${num(p.deaths)} death${p.deaths === 1 ? '' : 's'} per 100,000 people a year (${pct(p.deaths / 1e5)} a year)${p.d == null ? ', following from what each must eat' : ''}; each one kills about ${num(p.killsEach)} a year`,
        outcome: p.outcome,
        among: population ? `Among the ${population.people.toLocaleString('en-GB')} people of ${population.where} in ${p.year}: about ${num(population.people * p.share)} of them, and ${num(population.people * p.deaths / 1e5)} deaths a year. In your ${placeWord(p.town)}: about ${num(p.town * p.share)} of them.` : null,
    };
}
export function knownStart(p, population = ewYear(p.year) ? { people: Math.round(ewYear(p.year).people), where: 'England and Wales' } : null) {
    const s = startParts(p, population);
    const lines = [`Seed ${s.code} · ${s.town} in ${s.where}, ${s.when}.`,
        `You: ${s.you}.`,
        ...s.people.map(x => `${x.who} (${x.relation}): ${x.line}.${x.wants ? ` Wants: ${x.wants}.` : ''}`),
        s.names ? `What you call them: ${s.names.main}${s.names.also.length ? ` (you have also heard ${s.names.also.join(', ')})` : ''}.` : 'You have no name for them: you have never heard of them.',
        `The seed's law, which your character may not know: ${s.law}.`,
        ...s.sheet.length ? ['Its sheet:', ...s.sheet.map(l => `  ${l}`)] : [],
        `Its ratings: ${s.ratings}. What it does: ${s.outcome}.${s.among ? ` ${s.among}` : ''}`];
    return lines.join('\n');
}
/** The tool calls that write a start into the engine's records, as the story would: the player's character and each person
 * with what the code drew (NewCharacter), their birthplace, ties and wants (RecordFact; a secret want known to its keeper
 * alone), and who is truly of the law's kind (TrueNature). `me`: the player's character's name. */
export function seedCalls(p, me) {
    const job = (x) => x.occupation ? { occupation: x.occupation } : {};
    const calls = [
        { tool: 'NewCharacter', args: { who: me, age: p.you.age, sex: p.you.sex, ...job(p.you) } },
        { tool: 'RecordFact', args: { fact: `${me} was born in ${p.you.born}`, known_by: [me], importance: 3 } }
    ];
    for (const x of p.people) {
        const toward = x.want.toward ? ` (toward ${x.want.toward === 'you' ? me : x.want.toward})` : '';
        calls.push({ tool: 'NewCharacter', args: { who: x.label, age: x.age, sex: x.sex, ...job(x) } }, { tool: 'RecordFact', args: { fact: `${x.label} ${x.tie.replace(/\{me\}/g, me)}`, known_by: [x.label, me], importance: 6 } }, { tool: 'RecordFact', args: { fact: `${x.label} wants: ${x.want.text.replace(/\.$/, '').toLowerCase()}${toward}`, known_by: x.want.secret ? [x.label] : [x.label, me], secret: x.want.secret, importance: 7 } });
        if (x.truly && p.law)
            calls.push({ tool: 'TrueNature', args: { who: x.label, kind: p.law.what } });
    }
    for (const n of p.names) {
        const who = Object.entries(p.knows).filter(([, ns]) => ns.includes(n.name)).map(([k]) => k === 'you' ? me : k);
        if (who.length)
            calls.push({ tool: 'RecordFact', args: { fact: `People call them "${n.name}"${p.law?.what ? `: ${p.law.what}` : ''}`, known_by: who, importance: 6 } });
        if (n.coiner.age)
            calls.push({ tool: 'RecordFact', args: { fact: `"${n.name}" was first said in ${n.year} by ${/^(8\d?|1[18])$/.test(String(n.coiner.age)) ? 'an' : 'a'} ${n.coiner.age}-year-old ${n.coiner.sex === 'female' ? 'woman' : 'man'}${n.coiner.occupation ? `, ${n.coiner.occupation}` : ''}, who had noticed that they ${n.noticed.startsWith('body') ? BODY[n.noticed.slice(5)].says : n.noticed.startsWith('origin') ? ORIGIN[n.noticed.slice(7)] : PASSING[n.noticed.slice(8)]}`, importance: 4 } });
    }
    return calls;
}
