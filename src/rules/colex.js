let DATA = null, loading = null;
let KEYS = new Map();
const key = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (s) => s.length > 3 && s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;
export function loadColex() {
    loading ??= fetch(new URL('../../rules/colex.json', import.meta.url)).then(r => r.json()).then((d) => {
        DATA = d;
        KEYS = new Map();
        d.concepts.forEach((c, i) => { const k = key(c); if (k)
            KEYS.set(k, [...(KEYS.get(k) ?? []), i]); });
    }).catch(e => { console.warn('[Rules engine] colexifications not loaded:', e); loading = null; });
    return loading;
}
/** Glottolog code of a language name ("Guaraní", "guarani"), or null when CLICS has none. */
export function languageCode(name) {
    return DATA?.names[key(name)] ?? null;
}
/** Display of a concept gloss: "OLDER BROTHER (OF MAN)" → "older brother (of man)". */
const show = (c) => c.toLowerCase();
/** The other concepts language `code` says with the word for the concepts named `word`; [] when none or unknown. */
export function sharedWith(word, code) {
    if (!DATA)
        return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Set();
    for (const k of DATA.by[code] ?? []) {
        const [a, b] = DATA.pairs[k];
        if (ids.has(a) && !ids.has(b))
            out.add(b);
        else if (ids.has(b) && !ids.has(a))
            out.add(a);
    }
    return [...out].map(i => show(DATA.concepts[i]));
}
/** Words of an English message (1–3-word phrases, longest first) that `language` says with a word that has other meanings. */
export function sharedIn(message, language, max = 3) {
    const code = languageCode(language);
    if (!DATA || !code)
        return [];
    const w = key(message).split(' ').filter(Boolean), used = new Set(), out = [];
    for (let n = 3; n >= 1; n--)
        for (let i = 0; i + n <= w.length && out.length < max; i++) {
            if ([...Array(n).keys()].some(j => used.has(i + j)))
                continue;
            const phrase = w.slice(i, i + n).join(' ');
            if (!KEYS.has(phrase) && !KEYS.has(singular(phrase)))
                continue;
            for (let j = 0; j < n; j++)
                used.add(i + j);
            const also = sharedWith(phrase, code);
            if (also.length)
                out.push({ word: phrase, also });
        }
    return out;
}
