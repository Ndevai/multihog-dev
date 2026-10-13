let CLIO = null, GLOTTO = {}, CLDR = {};
let loading = null;
export function loadPopulation() {
    loading ??= Promise.all([
        fetch(new URL('../../rules/clio.json', import.meta.url)).then(r => r.json()).then(d => { CLIO = d; }),
        fetch(new URL('../../rules/glotto.json', import.meta.url)).then(r => r.json()).then(d => { GLOTTO = d; }),
        fetch(new URL('../../rules/cldr.json', import.meta.url)).then(r => r.json()).then(d => { CLDR = d; }),
    ]).then(() => undefined).catch(e => { console.warn('[Rules engine] population data not loaded:', e); loading = null; });
    return loading;
}
const norm = (s) => s.toLowerCase().replace(/\(.*?\)|,.*$/g, ' ').replace(/[^a-z]+/g, ' ').trim();
const ALIAS = { russia: 'russian federation', 'south korea': 'korea', 'north korea': 'korea democratic', uk: 'united kingdom',
    england: 'united kingdom', scotland: 'united kingdom', wales: 'united kingdom', britain: 'united kingdom', usa: 'united states', america: 'united states',
    holland: 'netherlands', persia: 'iran', burma: 'myanmar', siam: 'thailand', ceylon: 'sri lanka' };
/** The key of `names` that is country `c` (exact, then one name starting the other). */
function pick(names, c) {
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
