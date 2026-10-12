import { roman } from './roman.js';
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
// Names the word lists file under a city or variety name.
const ALIAS = { cantonese: 'guan1279', 'yue chinese': 'guan1279', mandarin: 'mand1415' };
export function languageCode(name) {
    return ALIAS[key(name)] ?? DATA?.names[key(name)] ?? null;
}
/** How the word for `word` sounds in language `code`, in letters (roman.ts), or '' when its form is not kept. */
export function soundOf(word, code) {
    const ids = KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? [];
    const f = ids.map(i => DATA?.forms?.[code]?.[i]).find(Boolean);
    return f ? roman(f) : '';
}
const formOf = (i, code) => { const f = DATA?.forms?.[code]?.[i]; return f ? roman(f) : ''; };
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
/** Words the whispered word for `word` can be heard as in language `code`, each with the share heard so. */
export function whisperedAs(word, code) {
    if (!DATA)
        return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Map();
    for (const [a, b, ab, ba] of DATA.whisper[code] ?? []) {
        const [other, r] = ids.has(a) && !ids.has(b) ? [b, ab] : ids.has(b) && !ids.has(a) ? [a, ba] : [-1, 0];
        if (other >= 0 && r > 0)
            out.set(other, Math.max(out.get(other) ?? 0, r));
    }
    return [...out].map(([i, rate]) => ({ concept: show(DATA.concepts[i]), rate, sound: formOf(i, code) }));
}
const SNRS = [-18, -12, -6, 0, 6, 12];
/** Share of consonant `a` heard as `b` (Miller & Nicely indices) at `snr` dB; 0 at or above +12 dB. */
function heardAs(a, b, snr) {
    if (!DATA || snr >= 12)
        return 0;
    const at = (k) => { const m = DATA.noiseTables[String(SNRS[k])]; const row = m[a]; return row[b] / row.reduce((x, y) => x + y, 0); };
    if (snr <= SNRS[0])
        return at(0);
    const k = SNRS.findIndex(x => x > snr) - 1;
    return at(k) + (at(k + 1) - at(k)) * (snr - SNRS[k]) / 6;
}
/** Words the word for `word` can be misheard as in language `code` at speech-to-noise ratio `snr` dB, with the share. */
export function noisyAs(word, code, snr) {
    if (!DATA || snr >= 12)
        return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Map();
    for (const [a, b, ca, cb] of DATA.noise[code] ?? []) {
        const [other, r] = ids.has(a) && !ids.has(b) ? [b, heardAs(ca, cb, snr)] : ids.has(b) && !ids.has(a) ? [a, heardAs(cb, ca, snr)] : [-1, 0];
        if (other >= 0 && r >= 0.01)
            out.set(other, Math.max(out.get(other) ?? 0, r));
    }
    return [...out].map(([i, rate]) => ({ concept: show(DATA.concepts[i]), rate, sound: formOf(i, code) }));
}
/** Words of an English message (1–3-word phrases, longest first) that `language` says with a word that has other meanings. */
export function sharedIn(message, language, max = 3, whispered = false, list, snr = Infinity) {
    const code = list === undefined ? languageCode(language) : list;
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
            const said = (x, how) => `${x.concept}${x.sound ? ` = ${x.sound}` : ''} ${how}`;
            const also = [...whispered ? whisperedAs(phrase, code).map(x => said(x, 'if whispered')) : [], ...noisyAs(phrase, code, snr).map(x => said(x, 'if misheard')),
                ...language === 'english' ? [] : sharedWith(phrase, code)];
            if (also.length)
                out.push({ word: phrase, sound: soundOf(phrase, code), also });
        }
    return out;
}
