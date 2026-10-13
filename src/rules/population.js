let CLIO = null, GLOTTO = {}, CLDR = {};
let LIFE = null;
let FAITH = {};
let loading = null;
export function loadPopulation() {
    loading ??= Promise.all([
        fetch(new URL('../../rules/clio.json', import.meta.url)).then(r => r.json()).then(d => { CLIO = d; }),
        fetch(new URL('../../rules/glotto.json', import.meta.url)).then(r => r.json()).then(d => { GLOTTO = d; }),
        fetch(new URL('../../rules/cldr.json', import.meta.url)).then(r => r.json()).then(d => { CLDR = d; }),
        fetch(new URL('../../rules/lifetables.json', import.meta.url)).then(r => r.json()).then(d => { LIFE = d; }),
        fetch(new URL('../../rules/religion.json', import.meta.url)).then(r => r.json()).then(d => { FAITH = d.shares; }),
    ]).then(() => undefined).catch(e => { console.warn('[Rules engine] population data not loaded:', e); loading = null; });
    return loading;
}
const norm = (s) => s.toLowerCase().replace(/\(.*?\)|,.*$/g, ' ').replace(/[^a-z]+/g, ' ').trim();
const ALIAS = { russia: 'russian federation', 'south korea': 'korea', 'north korea': 'korea democratic', uk: 'united kingdom',
    england: 'united kingdom', scotland: 'united kingdom', wales: 'united kingdom', britain: 'united kingdom', usa: 'united states', america: 'united states',
    holland: 'netherlands', persia: 'iran', burma: 'myanmar', siam: 'thailand', ceylon: 'sri lanka' };
/** The key of `names` that is country `c` (exact, then one name starting the other). */
function pick(names, c) {
    const exact = names.find(k => norm(k) === norm(c));
    if (exact)
        return exact;
    const n = ALIAS[norm(c)] ?? norm(c);
    return names.find(k => norm(k) === n) ?? names.find(k => norm(k).startsWith(n) || n.startsWith(norm(k))) ?? null;
}
/** Value of a series in `year`, linear between data years; outside them the nearest data year, with the year used. */
function at(s, year) {
    if (year <= s[0][0])
        return { v: s[0][1], from: year < s[0][0] ? s[0][0] : null };
    const last = s[s.length - 1];
    if (year >= last[0])
        return { v: last[1], from: year > last[0] ? last[0] : null };
    const i = s.findIndex((x, k) => year >= x[0] && year <= s[k + 1][0]), [a, b] = [s[i], s[i + 1]];
    return { v: a[1] + (b[1] - a[1]) * (year - a[0]) / (b[0] - a[0]), from: null };
}
/** Share (0–1) of a country's people who can read and write in `year`, or who know their exact age (numeracy) by birth year. */
export function skillShare(skill, country, year) {
    const s = skill === 'reading' ? CLIO?.literacy : CLIO?.numeracy, c = s && country ? pick(Object.keys(s), country) : null;
    // Before a country's first figure nothing is said: the share rose over time, so a later figure overstates it.
    if (!c || year === null || year < s[c][0][0])
        return null;
    const r = at(s[c], year);
    return { share: Math.min(1, r.v / 100), country: c, from: r.from };
}
/** cm to add to a height for births before `refBirth`: the change in male height in `country` from `birthYear` to `refBirth`. */
export function heightShift(country, birthYear, refBirth) {
    const s = CLIO?.height, c = s ? pick(Object.keys(s), country) : null;
    return c ? at(s[c], birthYear).v - at(s[c], refBirth).v : null;
}
/** What a labourer's daily wage in `country` buys, as a share of what a British labourer's bought in the same year. */
export function wageRatio(country, year) {
    const s = CLIO?.wage, c = s ? pick(Object.keys(s), country) : null, uk = s?.['United Kingdom'];
    if (!c || !uk)
        return { error: `No real wage series for "${country}".` };
    const own = at(s[c], year), base = at(uk, year);
    if (own.from !== null)
        return { error: `${c}'s real wage series covers ${s[c][0][0]}–${s[c][s[c].length - 1][0]}.` };
    if (base.from !== null)
        return { error: `The British real wage series covers ${uk[0][0]}–${uk[uk.length - 1][0]}.` };
    return { ratio: own.v / base.v, country: c };
}
/** Countries whose speech communities speak `language` (Glottolog), or null when the language is not listed. */
export function spokenIn(language) {
    const k = language.trim().toLowerCase().replace(/^(modern|standard) /, '');
    return GLOTTO[k] ?? GLOTTO[`${k} chinese`] ?? GLOTTO[`standard ${k}`] ?? null;
}
/** Whether `language` is spoken by a community in `country`; null when either is unknown. */
export function spokenThere(language, country) {
    const cs = spokenIn(language);
    return cs && country ? !!pick(cs, country) : null;
}
// Share of a country's people who speak a language, first or second (Unicode CLDR territoryInfo, languagePopulation
// _populationPercent, cldr-json main branch, 2026-10-13: 524 languages). Present-day estimates, so used from 1950 on [ASSUMED].
export function speakShare(language, country, year) {
    if (!country || year === null || year < 1950)
        return null;
    const k = language.trim().toLowerCase().replace(/^(modern|standard) /, ''), t = CLDR[k] ?? CLDR[`${k} chinese`];
    const c = t ? pick(Object.keys(t), country) : null;
    return c ? { share: t[c] / 100, country: c } : null;
}
// Religion: share of a country's people of each faith, every 5 years 1945–2010 (World Religion Project, National Religion
// Dataset, Maoz & Henderson 2013, via ARDA; 201 countries); the nearest 5-year figure, the last after 2010, none before 1945.
export const FAITHS = ['protestant christian', 'catholic christian', 'orthodox christian', 'anglican christian', 'other christian', 'christian (any)',
    'jewish', 'sunni muslim', 'shia muslim', 'ibadi muslim', 'alawite muslim', 'ahmadiyya muslim', 'other muslim', 'muslim (any)', 'mahayana buddhist',
    'theravada buddhist', 'other buddhist', 'buddhist (any)', 'hindu', 'sikh', 'jain', 'zoroastrian', 'shinto', 'taoist', 'confucian', "baha'i",
    'syncretic religion', 'animist', 'no religion'];
export function faithShare(faith, country, year) {
    const c = country ? pick(Object.keys(FAITH), country) : null;
    if (!c || year === null || year < 1945)
        return null;
    const ys = Object.keys(FAITH[c]).map(Number).sort((a, b) => a - b), at = ys.reduce((b, y) => Math.abs(y - year) < Math.abs(b - year) ? y : b, ys[0]);
    return { share: (FAITH[c][at][faith] ?? 0) / 100, country: c, year: at };
}
// Survival: share of people alive at age `from` who are still alive at age `to`, l(to)/l(from), from the national life
// table of the person's sex nearest the year (Human Life-Table Database, 2026 release: 131 countries, England, Scotland, Wales, Northern Ireland and East Germany, 1751–2024; l(x) at
// 0, 1, 5, …, 100, log-linear between the table's ages). A period table stands for the person's own cohort [ASSUMED].
export function survival(country, sex, year, from, to) {
    const t = LIFE?.tables, c = t && country ? pick(Object.keys(t), country) : null;
    if (!c || year === null)
        return null;
    const list = t[c][sex === 'female' ? '2' : '1'];
    if (!list?.length)
        return null;
    const best = list.reduce((b, x) => Math.abs((x[0] + x[1]) / 2 - year) < Math.abs((b[0] + b[1]) / 2 - year) ? x : b);
    // A table more than 25 years from the story year says nothing [ASSUMED].
    if (Math.abs((best[0] + best[1]) / 2 - year) > 25)
        return null;
    const [y1, y2, lx] = list.reduce((b, x) => Math.abs((x[0] + x[1]) / 2 - year) < Math.abs((b[0] + b[1]) / 2 - year) ? x : b);
    const ages = LIFE.ages, l = (x) => {
        const i = Math.min(ages.length - 2, ages.findIndex((a, k) => x >= a && x <= ages[k + 1]));
        const [a, b] = [lx[i], lx[i + 1]];
        if (a == null || b == null || i < 0)
            return null;
        return Math.exp(Math.log(Math.max(a, 1e-6)) + (Math.log(Math.max(b, 1e-6)) - Math.log(Math.max(a, 1e-6))) * (x - ages[i]) / (ages[i + 1] - ages[i]));
    };
    const lf = l(Math.max(0, from)), lt = l(Math.min(100, to));
    return lf && lt != null ? { share: Math.min(1, lt / lf), country: c, years: y1 === y2 ? `${y1}` : `${y1}–${y2}` } : null;
}
