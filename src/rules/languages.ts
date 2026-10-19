// Languages change over time: a language named in the story is the stage spoken in the story's year, with that stage's own
// word list (or none), and a stage or language that did not exist yet, or no longer had speakers, cannot be spoken.
// Stages of the best-documented languages, with the years their periodization gives (Wikipedia, 2026-10-12: Japanese
// language; Middle English; Old Mandarin; History of Standard Chinese; History of Portuguese); a boundary the source gives
// as a century or a reign is that century's or reign's first year. Word lists: CLICS⁴ Glottolog codes where the stage has
// one. Other languages: first and last years from Wikidata (start time, inception, end time, dissolved; exported
// 2026-10-12: 1,404 languages, constructed languages and extinctions included).
type Stage = { name: string; from: number | null; to: number | null; list: string | null };
const STAGES: Record<string, Stage[]> = {
    japanese: [
        { name: 'Old Japanese', from: null, to: 794, list: 'oldj1239' },
        { name: 'Early Middle Japanese', from: 794, to: 1185, list: null },
        { name: 'Late Middle Japanese', from: 1185, to: 1600, list: null },
        // "early 17th century – mid 19th century": the end taken at the Meiji Restoration, 1868 [ASSUMED].
        { name: 'Early Modern Japanese', from: 1600, to: 1868, list: null },
        { name: 'Modern Japanese', from: 1868, to: null, list: 'nucl1643' },
    ],
    english: [
        // Old English to the transition "by the 1150s to 1180s"; Early Modern English "in the 1540s" to "about 1650".
        { name: 'Old English', from: null, to: 1150, list: null },
        { name: 'Middle English', from: 1150, to: 1540, list: null },
        { name: 'Early Modern English', from: 1540, to: 1650, list: null },
        { name: 'Modern English', from: 1650, to: null, list: 'stan1293' },
    ],
    chinese: [
        // Middle Chinese from the Qieyun (601, Wikidata); Old Mandarin, the speech of northern China under the Jin (from 1115)
        // and Yuan (to 1368); Ming and Qing court speech (Guanhua) to the proclamation of Guoyu in 1909.
        { name: 'Old Chinese', from: null, to: 601, list: 'oldc1244' },
        { name: 'Middle Chinese', from: 601, to: 1115, list: null },
        { name: 'Old Mandarin', from: 1115, to: 1368, list: null },
        { name: 'Guanhua (Ming and Qing Mandarin)', from: 1368, to: 1909, list: null },
        { name: 'Modern Standard Chinese', from: 1909, to: null, list: 'mand1415' },
    ],
    portuguese: [
        { name: 'Galician-Portuguese', from: 1000, to: 1500, list: null },
        { name: 'Modern Portuguese', from: 1500, to: null, list: 'port1283' },
    ],
};
const ALIAS: Record<string, string> = { mandarin: 'chinese', 'mandarin chinese': 'chinese' };

let YEARS: Record<string, [number | null, number | null]> = {}, loading: Promise<void> | null = null;
export function loadLanguageYears(): Promise<void> {
    loading ??= fetch(new URL('../../rules/language-years.json', import.meta.url)).then(r => r.json()).then(d => { YEARS = d; })
        .catch(e => { console.warn('[Rules engine] language years not loaded:', e); loading = null; });
    return loading;
}

const key = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
const inside = (y: number, from: number | null, to: number | null) => (from === null || y >= from) && (to === null || y < to);
const span = (from: number | null, to: number | null) => from === null ? `until ${to}` : to === null ? `from ${from}` : `${from}–${to}`;

/** A named stage of a curated language ("late middle japanese"), with its language. */
function namedStage(name: string): { lang: string; stage: Stage } | null {
    for (const [lang, list] of Object.entries(STAGES)) for (const stage of list) if (key(stage.name) === key(name)) return { lang, stage };
    return null;
}

/** The name two speakers compare: a curated language's present stage keeps its plain name ("portuguese"), an older stage its own. */
export function stageKey(name: string, year: number | null): string {
    const k = ALIAS[key(name)] ?? key(name), r = resolveLanguage(k, year), lang = STAGES[k] ? k : namedStage(k)?.lang;
    return lang && key(r.label) === key(STAGES[lang][STAGES[lang].length - 1].name) ? lang : key(r.label);
}

/** What `name` means in `year`: the stage spoken then, whether it can be spoken, and its word list. A world-book entry
 *  naming the language (a time traveller's modern Japanese) lifts the refusal. */
export function resolveLanguage(name: string, year: number | null, book: { what: string }[] = []): { label: string; list: string | null | undefined; refused?: string } {
    const r = resolveAt(name, year);
    return r.refused && book.some(e => key(e.what).includes(key(name))) ? { label: r.label, list: r.list } : r;
}
function resolveAt(name: string, year: number | null): { label: string; list: string | null | undefined; refused?: string } {
    const k = ALIAS[key(name)] ?? key(name);
    const named = namedStage(k);
    if (named) {
        const s = named.stage;
        if (year !== null && !inside(year, s.from, s.to)) {
            const now = STAGES[named.lang].find(x => inside(year, x.from, x.to));
            return { label: s.name, list: s.list, refused: `${s.name} is spoken ${span(s.from, s.to)}; ${year} lies outside that span${now ? `; ${named.lang} in ${year} is ${now.name}` : ''}` };
        }
        return { label: s.name, list: s.list };
    }
    if (STAGES[k]) {
        if (year === null) { const last = STAGES[k][STAGES[k].length - 1]; return { label: last.name, list: last.list }; }
        const s = STAGES[k].find(x => inside(year, x.from, x.to));
        return s ? { label: s.name, list: s.list } : { label: name, list: null, refused: `${name}: unattested in ${year}` };
    }
    // Others: the modern word list (undefined: colex.ts matches by name), unless Wikidata dates the language.
    const y = YEARS[k];
    if (y && year !== null && !inside(year, y[0], y[1])) return { label: name, list: undefined, refused: `${name} is spoken ${span(y[0], y[1])}; ${year} lies outside that span` };
    return { label: name, list: undefined };
}
