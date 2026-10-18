// How common a trait is among the people of a country in a year, from published series (docs/df-body-engine.md §11):
// literacy (Our World in Data, cross-country literacy rates: van Zanden et al. 2014 How Was Life?, Buringh & van Zanden
// 2009, UNESCO; 1475–2024, 218 countries), numeracy (Baten 2015, Clio Infra: share of people reporting their exact age,
// the ABCC index, by birth decade, 1500–1970), male height by birth decade (Baten & Blum 2015, Clio Infra, 1550–2000),
// labourers' real wages (de Zwart, van Leeuwen & van Leeuwen-Li 2015, Clio Infra, 1820–2008, comparable across countries).
// Where a language is spoken: Glottolog 5 (CLDF, countries of each language's speech communities; extinct and classical
// languages, which list a last year of documentation, left out).
import { SINGLE } from './data/hajnal.js';
let CLIO = null, GLOTTO = {}, CLDR = {};
let LIFE = null;
let CITIES = [], ISCO = [];
let OWW = {};
let FAITH = {};
let ILO = null;
let loading = null;
export function loadPopulation() {
    loading ??= Promise.all([
        fetch(new URL('../../rules/clio.json', import.meta.url)).then(r => r.json()).then(d => { CLIO = d; }),
        fetch(new URL('../../rules/glotto.json', import.meta.url)).then(r => r.json()).then(d => { GLOTTO = d; }),
        fetch(new URL('../../rules/cldr.json', import.meta.url)).then(r => r.json()).then(d => { CLDR = d; }),
        fetch(new URL('../../rules/lifetables.json', import.meta.url)).then(r => r.json()).then(d => { LIFE = d; }),
        fetch(new URL('../../rules/cities.json', import.meta.url)).then(r => r.json()).then(d => { CITIES = d; }),
        fetch(new URL('../../rules/isco.json', import.meta.url)).then(r => r.json()).then(d => { ISCO = d; }),
        fetch(new URL('../../rules/oww.json', import.meta.url)).then(r => r.json()).then(d => { OWW = d; }),
        fetch(new URL('../../rules/religion.json', import.meta.url)).then(r => r.json()).then(d => { FAITH = d.shares; }),
        fetch(new URL('../../rules/compendium.json', import.meta.url)).then(r => r.json()).then(d => { COMPENDIUM = d; }),
        fetch(new URL('../../rules/berkeley.json', import.meta.url)).then(r => r.json()).then(d => { BERKELEY = d; }),
        fetch(new URL('../../rules/ilo.json', import.meta.url)).then(r => r.json()).then(d => { ILO = d; }),
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
// Before the life tables (they start 1751): the Siler hazard a1·e^(−b1 x) + a2 + a3·e^(b3 x) fitted to Sweden 1751–59, the
// only agrarian population in Gurven & Kaplan 2007 (Popul Dev Rev 33:321, Table 2: a1 0.400, b1 1.074, a2 0.008, a3 2.01e-4,
// b3 0.083; both sexes; gives l15 0.607, l45 0.435 against the table's 0.60, 0.43). Used for story years before 1751 when
// no table lies within 25 years [ASSUMED: one agrarian schedule for all places and sexes].
const SILER = { a1: 0.400, b1: 1.074, a2: 0.008, a3: 2.01e-4, b3: 0.083 };
const silerL = (x) => Math.exp(-((SILER.a1 / SILER.b1) * (1 - Math.exp(-SILER.b1 * x)) + SILER.a2 * x + (SILER.a3 / SILER.b3) * (Math.exp(SILER.b3 * x) - 1)));
export function survival(country, sex, year, from, to) {
    const r = survivalTable(country, sex, year, from, to);
    if (r || year === null || year >= 1751)
        return r;
    return { share: Math.min(1, silerL(Math.min(110, to)) / silerL(Math.max(0, from))), country: 'a pre-industrial farming population', years: 'Siler fit to Sweden 1751–59' };
}
function survivalTable(country, sex, year, from, to) {
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
export function countryFact(fact, country, year) {
    const s = CLIO?.[fact], c = s && country ? pick(Object.keys(s), country) : null;
    if (!c || year === null)
        return null;
    const r = at(s[c], year), d = r.from === null ? year : r.from;
    return Math.abs(d - year) > 25 ? null : { v: r.v, country: c, year: d };
}
// Cities: Modelski (ancient 3700 BC–AD 1000; modern AD 2000) and Chandler (AD 100–1975) as spatialized by Reba, Reitsma & Seto
// 2016 (Sci Data 3:160034): 1,725 cities with population by year. A city's population in `year` is log-linear between its
// listed years, none outside the span of its list.
function popAt(p, year) {
    if (year < p[0][0] || year > p[p.length - 1][0])
        return null;
    const i = p.findIndex((x, k) => year >= x[0] && (k === p.length - 1 || year <= p[k + 1][0]));
    if (i === p.length - 1 || p[i][0] === year)
        return p[i][1];
    const [a, b] = [p[i], p[i + 1]];
    return Math.exp(Math.log(a[1]) + (Math.log(b[1]) - Math.log(a[1])) * (year - a[0]) / (b[0] - a[0]));
}
const fold = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
/** The listed city called `name` (or the biggest in `year` of those so called) and its population in `year`. */
export function cityPopulation(name, year) {
    const k = fold(name), hits = CITIES.filter(c => fold(c.n) === k).map(c => ({ name: c.n, country: c.k, pop: popAt(c.p, year) })).filter((x) => x.pop !== null);
    return hits.sort((a, b) => b.pop - a.pop)[0] ?? null;
}
/** The largest listed city within 100 km of a point in `year`, with the distance. */
export function cityNear(lat, lon, year) {
    const rad = Math.PI / 180, d = (c) => 6371 * Math.acos(Math.min(1, Math.sin(lat * rad) * Math.sin(c.la * rad) + Math.cos(lat * rad) * Math.cos(c.la * rad) * Math.cos((c.lo - lon) * rad)));
    return CITIES.map(c => ({ name: c.n, country: c.k, pop: popAt(c.p, year), km: d(c) })).filter((x) => x.pop !== null && x.km <= 100)
        .sort((a, b) => b.pop - a.pop)[0] ?? null;
}
// Pay by trade, 1953–2008 (Occupational Wages around the World, Oostendorp, version 3: 206,449 rows, 192 countries; hourly wage
// in US dollars of that year, series hw4, mean of its lower and upper bound [ASSUMED: the file has no codebook]). Trades are found
// by title in the ILO's ISCO-08/88 index (7,011 titles → 385 ISCO-88 unit groups); the year is the nearest within 5 years; a trade the survey lacks takes its 3-digit minor group.
export function wageByTrade(trade, country, year) {
    const q = fold(trade), words = q.split(' ').filter(Boolean);
    const exact = ISCO.filter(([t]) => fold(t) === q), part = ISCO.filter(([t]) => words.length && words.every(w => fold(t).split(' ').includes(w)));
    const hits = exact.length ? exact : part, count = {};
    for (const [, c] of hits)
        count[c] = (count[c] ?? 0) + 1;
    const top = Math.max(0, ...Object.values(count)), codes = Object.keys(count).filter(c => count[c] >= Math.max(1, top / 2)).slice(0, 4);
    if (!codes.length)
        return { error: `No trade called "${trade}" in the ISCO index; try a plainer name (welder, nurse, baker).` };
    const c = pick(Object.keys(OWW), country);
    if (!c)
        return { error: `No wage data for "${country}" (1953–2008, 192 countries).` };
    const ys = Object.keys(OWW[c]).map(Number), near = ys.reduce((b, y) => Math.abs(y - year) < Math.abs(b - year) ? y : b, ys[0]);
    if (Math.abs(near - year) > 5)
        return { error: `${c}: wage data for ${ys[0]}–${ys[ys.length - 1]}, none within 5 years of ${year}.` };
    const [median, rows] = OWW[c][near], by = (n) => rows.filter(([k]) => k.split('/').some(x => codes.some(y => y.slice(0, n) === x.slice(0, n)))).map(r => r[1]);
    const v = by(4).length ? by(4) : by(3);
    if (!v.length)
        return { error: `${c} ${near}: no figure for ${trade} (ISCO-88 ${codes.join(', ')}).` };
    const usd = v.reduce((t, x) => t + x, 0) / v.length;
    return { codes, usd, relative: usd / median, year: near, country: c };
}
// Activities: the 2024 Adult Compendium of Physical Activities (Herrmann et al. 2024, J Sport Health Sci 13:6; table PDF from
// pacompendium.com, 1,111 of its 1,114 rows parsed): code, MET, heading, description. 1 MET ≈ 1 kcal/kg/h; adults 19–59.
// An activity named in words takes the row sharing the most of its words (a word matches a longer one it begins, "horse" →
// "horseback"), ties broken by how informative the shared words are (log of rows ÷ rows containing the word), then by the
// shorter description; half or fewer of the words matched gives none, and the narrator gives met [matching ASSUMED].
let COMPENDIUM = [];
let WORDS = [], DF = new Map();
const stem = (x) => x.replace(/(ing|ed|es|s)$/, '');
const hit = (q, d) => d === q || (q.length >= 4 && d.startsWith(q));
export function activityMet(text) {
    if (WORDS.length !== COMPENDIUM.length) {
        WORDS = COMPENDIUM.map(r => [...new Set(fold(r[3]).split(' ').filter(x => x.length > 2).map(stem))]);
        DF = new Map();
        for (const ws of WORDS)
            for (const x of ws)
                DF.set(x, (DF.get(x) ?? 0) + 1);
    }
    const w = [...new Set(fold(text).split(' ').filter(x => x.length > 2 && !['the', 'and', 'with', 'for', 'into', 'from'].includes(x)).map(stem))];
    if (!w.length)
        return null;
    let best = -1, key = [0, 0, 0];
    COMPENDIUM.forEach((r, i) => {
        const m = w.filter(x => WORDS[i].some(d => hit(x, d)));
        const k = [m.length, m.reduce((t, x) => t + Math.log(COMPENDIUM.length / (DF.get(x) ?? 1)), 0), -r[3].length];
        if (k[0] > key[0] || (k[0] === key[0] && (k[1] > key[1] || (k[1] === key[1] && k[2] > key[2])))) {
            best = i;
            key = k;
        }
    });
    return best >= 0 && key[0] * 2 > w.length ? { met: COMPENDIUM[best][1], code: COMPENDIUM[best][0], description: COMPENDIUM[best][3] } : null;
}
// Never married: the share of a country's men or women of an age who are single, from census tables 1891–1952 (data/hajnal.ts).
// Linear between the age bands' midpoints, held beyond the last; none under 20 (no band), none further than 30 years from
// the census [ASSUMED], the nearest census when a country has two.
export function neverMarriedShare(country, sex, age, year) {
    if (!country || year === null || !(age >= 20))
        return null;
    const c = pick([...new Set(SINGLE.map(r => r[0]))], country);
    if (!c)
        return null;
    const r = SINGLE.filter(x => x[0] === c).reduce((b, x) => Math.abs(x[1] - year) < Math.abs(b[1] - year) ? x : b);
    if (Math.abs(r[1] - year) > 30)
        return null;
    const [, y, mids, men, women] = r, v = sex === 'female' ? women : men;
    let pct = v[v.length - 1];
    if (age <= mids[0])
        pct = v[0];
    else
        for (let i = 0; i < mids.length - 1; i++)
            if (age <= mids[i + 1]) {
                pct = v[i] + (v[i + 1] - v[i]) * (age - mids[i]) / (mids[i + 1] - mids[i]);
                break;
            }
    return { share: pct / 100, country: c, year: y };
}
// The climate of past months: Berkeley Earth land-surface temperature by country (Rohde & Hausfather 2020, Earth Syst Sci Data
// 12:3469; regional files of the January 2021 run, 143 countries, monthly 1750–2020 where coverage allows), as the month's
// anomaly against that calendar month's 1991–2020 mean, the base period of the WMO normals the generator uses. Months whose
// 95 % uncertainty exceeds 2 °C are left out [ASSUMED].
let BERKELEY = {};
export function climateShift(country, year, month) {
    if (!country)
        return null;
    const c = BERKELEY[country] ? country : pick(Object.keys(BERKELEY), country);
    const r = c ? BERKELEY[c] : null;
    const row = r ? r[1][year - r[0]] : null;
    return row?.[month - 1] ?? null;
}
// A stranger's age and sex where no census file covers the scene: the stable population of the country's life table
// (Lotka): people aged x are in proportion to l(x)·e^(−r·x), r = the yearly growth of the country's population over the
// 10 years before the story year (Clio Infra total population) [stated process; ASSUMED: a stable population, no
// migration]. Sex: men and women in proportion to their own l(x)·e^(−r·x) summed over ages, with 105 boys born per 100 girls
// (the sex ratio at birth of human populations without sex selection [ASSUMED value]). Ages 0–100, one-year steps.
export function strangerAgeSex(country, year, rng, { sex = null, minAge = 0 } = {}) {
    if (!country || year === null || !survival(country, 'male', year, 0, 1))
        return null;
    const p0 = countryFact('population', country, year - 10), p1 = countryFact('population', country, year);
    const r = p0 && p1 && p1.year > p0.year ? Math.log(p1.v / p0.v) / (p1.year - p0.year) : 0;
    const w = (s) => Array.from({ length: 101 }, (_, x) => x < minAge ? 0 : (survival(country, s, year, 0, x)?.share ?? 0) * Math.exp(-r * x) * (s === 'male' ? 1.05 : 1));
    const wm = w('male'), wf = w('female'), sm = wm.reduce((a, b) => a + b, 0), sf = wf.reduce((a, b) => a + b, 0);
    const s = sex ?? (rng() * (sm + sf) < sm ? 'male' : 'female'), ws = s === 'male' ? wm : wf, tot = s === 'male' ? sm : sf;
    let u = rng() * tot, age = 100;
    for (let x = 0; x <= 100; x++)
        if ((u -= ws[x]) < 0) {
            age = x;
            break;
        }
    return { age, sex: s, country: survival(country, s, year, 0, 1).country, growth: r };
}
// Whether a stranger aged 15 or over works, and in which occupation group: ILOSTAT (ILO), national labour force surveys and
// censuses as reported to the ILO, 1969–2025, 200 countries (rules/ilo.json, downloaded 2026-10-18 from sdmx.ilo.org:
// DF_EMP_DWAP_SEX_AGE_RT, employment-to-population ratio by sex and 10-year age band; DF_EMP_TEMP_SEX_OCU_NB, employment by
// sex and ISCO-08 major group, else ISCO-88, the source with most groups). Works with the band's ratio, then a major group
// by its share of the employed of that sex. The nearest survey year within 25 years [ASSUMED, as for the other series].
export function strangerWork(country, sex, age, year, rng) {
    if (!ILO || !country || year === null || age < 15)
        return null;
    const c = pick(Object.keys(ILO.epr), country), s = sex === 'female' ? 'f' : 'm';
    const near = (rows) => rows?.length ? rows.reduce((b, r) => Math.abs(Number(r[0]) - year) < Math.abs(Number(b[0]) - year) ? r : b) : null;
    const e = c ? near(ILO.epr[c]?.[s]) : null;
    if (!c || !e || Math.abs(Number(e[0]) - year) > 25)
        return null;
    const band = ILO.bands.reduce((k, b, i) => age >= b ? i : k, 0), employed = Number(e[1 + band]);
    if (rng() >= employed)
        return { works: false, group: null, employed, year: Number(e[0]), country: c };
    const o = ILO.occ[c] ? near(ILO.occ[c][s]) : null;
    if (!o || Math.abs(Number(o[0]) - year) > 25)
        return { works: true, group: null, employed, year: Number(e[0]), country: c };
    let u = rng(), g = 9;
    for (let i = 0; i < 10; i++)
        if ((u -= Number(o[2 + i])) < 0) {
            g = i;
            break;
        }
    return { works: true, group: ILO.groups[g], employed, year: Number(e[0]), country: c };
}
