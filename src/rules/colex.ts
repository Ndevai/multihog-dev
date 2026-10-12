// One word, several meanings: concepts a language says with the same word (colexifications), from CLICS⁴ (Tjuka, Forkel,
// Rzymski & List 2026, CC-BY-4.0: 1730 concepts, 51 562 concept pairs, 2163 languages by Glottolog code). The story is
// written in English; a message spoken in another language is said with that language's words, so a listener may take a
// word in a meaning the speaker did not intend (Portuguese says "love" and "want" with one word, querer; Sirionó says
// "friend" and "relatives" with one). Code finds the words; Interpret decides the listener's reading; a misreading is kept
// in [KNOWS] and shows through what they do.
// Limits: a pair is listed when one variety of the language has it (a dialect counts); a homophone counts like a polysemy;
// a concept missing from a language's word list gives no ambiguity.
interface Colex { concepts: string[]; pairs: [number, number][]; names: Record<string, string>; by: Record<string, number[]> }

let DATA: Colex | null = null, loading: Promise<void> | null = null;
let KEYS = new Map<string, number[]>();
const key = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (s: string) => s.length > 3 && s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;

export function loadColex(): Promise<void> {
    loading ??= fetch(new URL('../../rules/colex.json', import.meta.url)).then(r => r.json()).then((d: Colex) => {
        DATA = d;
        KEYS = new Map();
        d.concepts.forEach((c, i) => { const k = key(c); if (k) KEYS.set(k, [...(KEYS.get(k) ?? []), i]); });
    }).catch(e => { console.warn('[Rules engine] colexifications not loaded:', e); loading = null; });
    return loading;
}

/** Glottolog code of a language name ("Guaraní", "guarani"), or null when CLICS has none. */
export function languageCode(name: string): string | null {
    return DATA?.names[key(name)] ?? null;
}

/** Display of a concept gloss: "OLDER BROTHER (OF MAN)" → "older brother (of man)". */
const show = (c: string) => c.toLowerCase();

/** The other concepts language `code` says with the word for the concepts named `word`; [] when none or unknown. */
export function sharedWith(word: string, code: string): string[] {
    if (!DATA) return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Set<number>();
    for (const k of DATA.by[code] ?? []) {
        const [a, b] = DATA.pairs[k];
        if (ids.has(a) && !ids.has(b)) out.add(b); else if (ids.has(b) && !ids.has(a)) out.add(a);
    }
    return [...out].map(i => show(DATA!.concepts[i]));
}

export interface Shared { word: string; also: string[] }

/** Words of an English message (1–3-word phrases, longest first) that `language` says with a word that has other meanings. */
export function sharedIn(message: string, language: string, max = 3): Shared[] {
    const code = languageCode(language);
    if (!DATA || !code) return [];
    const w = key(message).split(' ').filter(Boolean), used = new Set<number>(), out: Shared[] = [];
    for (let n = 3; n >= 1; n--) for (let i = 0; i + n <= w.length && out.length < max; i++) {
        if ([...Array(n).keys()].some(j => used.has(i + j))) continue;
        const phrase = w.slice(i, i + n).join(' ');
        if (!KEYS.has(phrase) && !KEYS.has(singular(phrase))) continue;
        for (let j = 0; j < n; j++) used.add(i + j);
        const also = sharedWith(phrase, code);
        if (also.length) out.push({ word: phrase, also });
    }
    return out;
}
