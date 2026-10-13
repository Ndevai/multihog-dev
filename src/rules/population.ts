// How common a trait is among the people of a country in a year, from published series (docs/df-body-engine.md §11):
// literacy (Our World in Data, cross-country literacy rates: van Zanden et al. 2014 How Was Life?, Buringh & van Zanden
// 2009, UNESCO; 1475–2024, 218 countries), numeracy (Baten 2015, Clio Infra: share of people reporting their exact age,
// the ABCC index, by birth decade, 1500–1970), male height by birth decade (Baten & Blum 2015, Clio Infra, 1550–2000),
// labourers' real wages (de Zwart, van Leeuwen & van Leeuwen-Li 2015, Clio Infra, 1820–2008, comparable across countries).
// Where a language is spoken: Glottolog 5 (CLDF, countries of each language's speech communities; extinct and classical
// languages, which list a last year of documentation, left out).
type Series = Record<string, [number, number][]>;
let CLIO: { height: Series; numeracy: Series; wage: Series; literacy: Series } | null = null, GLOTTO: Record<string, string[]> = {}, CLDR: Record<string, Record<string, number>> = {};
let loading: Promise<void> | null = null;
export function loadPopulation(): Promise<void> {
    loading ??= Promise.all([
        fetch(new URL('../../rules/clio.json', import.meta.url)).then(r => r.json()).then(d => { CLIO = d; }),
        fetch(new URL('../../rules/glotto.json', import.meta.url)).then(r => r.json()).then(d => { GLOTTO = d; }),
        fetch(new URL('../../rules/cldr.json', import.meta.url)).then(r => r.json()).then(d => { CLDR = d; }),
    ]).then(() => undefined).catch(e => { console.warn('[Rules engine] population data not loaded:', e); loading = null; });
    return loading;
}

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)|,.*$/g, ' ').replace(/[^a-z]+/g, ' ').trim();
const ALIAS: Record<string, string> = { russia: 'russian federation', 'south korea': 'korea', 'north korea': 'korea democratic', uk: 'united kingdom',
    england: 'united kingdom', scotland: 'united kingdom', wales: 'united kingdom', britain: 'united kingdom', usa: 'united states', america: 'united states',
    holland: 'netherlands', persia: 'iran', burma: 'myanmar', siam: 'thailand', ceylon: 'sri lanka' };
/** The key of `names` that is country `c` (exact, then one name starting the other). */
function pick(names: string[], c: string): string | null {
    const n = ALIAS[norm(c)] ?? norm(c);
    return names.find(k => norm(k) === n) ?? names.find(k => norm(k).startsWith(n) || n.startsWith(norm(k))) ?? null;
}

/** Value of a series in `year`, linear between data years; outside them the nearest data year, with the year used. */
function at(s: [number, number][], year: number): { v: number; from: number | null } {
    if (year <= s[0][0]) return { v: s[0][1], from: year < s[0][0] ? s[0][0] : null };
    const last = s[s.length - 1];
    if (year >= last[0]) return { v: last[1], from: year > last[0] ? last[0] : null };
    const i = s.findIndex((x, k) => year >= x[0] && year <= s[k + 1][0]), [a, b] = [s[i], s[i + 1]];
    return { v: a[1] + (b[1] - a[1]) * (year - a[0]) / (b[0] - a[0]), from: null };
}

/** Share (0–1) of a country's people who can read and write in `year`, or who know their exact age (numeracy) by birth year. */
export function skillShare(skill: 'reading' | 'numeracy', country: string | null | undefined, year: number | null): { share: number; country: string; from: number | null } | null {
    const s = skill === 'reading' ? CLIO?.literacy : CLIO?.numeracy, c = s && country ? pick(Object.keys(s), country) : null;
    // Before a country's first figure nothing is said: the share rose over time, so a later figure overstates it.
    if (!c || year === null || year < s![c][0][0]) return null;
    const r = at(s![c], year);
    return { share: Math.min(1, r.v / 100), country: c, from: r.from };
}

/** cm to add to a height for births before `refBirth`: the change in male height in `country` from `birthYear` to `refBirth`. */
export function heightShift(country: string, birthYear: number, refBirth: number): number | null {
    const s = CLIO?.height, c = s ? pick(Object.keys(s), country) : null;
    return c ? at(s![c], birthYear).v - at(s![c], refBirth).v : null;
}

/** What a labourer's daily wage in `country` buys, as a share of what a British labourer's bought in the same year. */
export function wageRatio(country: string, year: number): { ratio: number; country: string } | { error: string } {
    const s = CLIO?.wage, c = s ? pick(Object.keys(s), country) : null, uk = s?.['United Kingdom'];
    if (!c || !uk) return { error: `No real wage series for "${country}".` };
    const own = at(s![c], year), base = at(uk, year);
    if (own.from !== null) return { error: `${c}'s real wage series covers ${s![c][0][0]}–${s![c][s![c].length - 1][0]}.` };
    if (base.from !== null) return { error: `The British real wage series covers ${uk[0][0]}–${uk[uk.length - 1][0]}.` };
    return { ratio: own.v / base.v, country: c };
}

/** Countries whose speech communities speak `language` (Glottolog), or null when the language is not listed. */
export function spokenIn(language: string): string[] | null {
    const k = language.trim().toLowerCase().replace(/^(modern|standard) /, '');
    return GLOTTO[k] ?? GLOTTO[`${k} chinese`] ?? GLOTTO[`standard ${k}`] ?? null;
}
/** Whether `language` is spoken by a community in `country`; null when either is unknown. */
export function spokenThere(language: string, country: string | null | undefined): boolean | null {
    const cs = spokenIn(language);
    return cs && country ? !!pick(cs, country) : null;
}

// Share of a country's people who speak a language, first or second (Unicode CLDR territoryInfo, languagePopulation
// _populationPercent, cldr-json main branch, 2026-10-13: 524 languages). Present-day estimates, so used from 1950 on [ASSUMED].
export function speakShare(language: string, country: string | null | undefined, year: number | null): { share: number; country: string } | null {
    if (!country || year === null || year < 1950) return null;
    const k = language.trim().toLowerCase().replace(/^(modern|standard) /, ''), t = CLDR[k] ?? CLDR[`${k} chinese`];
    const c = t ? pick(Object.keys(t), country) : null;
    return c ? { share: t![c] / 100, country: c } : null;
}
