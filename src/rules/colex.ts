// One word, several meanings: concepts a language says with the same word (colexifications), from CLICS⁴ (Tjuka, Forkel,
// Rzymski & List 2026, CC-BY-4.0: 1730 concepts, 51 562 concept pairs, 2163 languages by Glottolog code). The story is
// written in English; a message spoken in another language is said with that language's words, so a listener may take a
// word in a meaning the speaker did not intend (Portuguese says "love" and "want" with one word, querer; Sirionó says
// "friend" and "relatives" with one). Code finds the words; Interpret decides the listener's reading; a misreading is kept
// in [KNOWS] and shows through what they do.
// Limits: a pair is listed when one variety of the language has it (a dialect counts); a homophone counts like a polysemy;
// a concept missing from a language's word list gives no ambiguity.
// Whispered words: a speaker without vocal-fold vibration (laryngectomy, both folds paralysed) whispers; vowels and place
// of articulation carry, pitch and voicing do not. Pairs of words in a language that differ only in the voicing of up to
// two obstruents (IPA voiced/voiceless pairs at the same place and manner, from the CLICS⁴ word list of the language's
// largest variety), each with the share of whispers heard as the other word: word-initial and medial 28 % per sound
// (Tartter 1989, JASA 86:1678: voicing 72 % right in whispered syllables; medial [ASSUMED] as initial), word-final 4 %
// (Baker & Whiteside 1994, Proc IOA: 96 %); two sounds multiply [ASSUMED independent]. Mandarin words that differ in tone
// use the whispered-tone confusions ('Whispered tones revisited', UCL manuscript, Table 6: 49.9 % of tones right, 96.4 %
// voiced), said → heard; Cantonese (Guangzhou) the six-tone confusions of Lam 2010 (HKU BSc dissertation, Table 3: 31.3 %
// right, 93.7 % voiced); Thai 33.9 % right for isolated words (Abramson 1972 as reported by Lam 2010), the rest spread
// evenly [ASSUMED]; a tone language uses its variety whose list writes the most tones. English vowels whispered: Tartter
// 1991 (Percept Psychophys 49:365, Table 2: 10 vowels, 81.6 % right, 92 % voiced), said → heard.
// Consonants in noise: pairs of words in a language that differ in one of 16 consonants (p t k f θ s ʃ b d g v ð z ʒ m n),
// heard as the other at the share Miller & Nicely 1955 measured at that speech-to-noise ratio (JASA 27:338, Tables I–VI,
// −18 to +12 dB, 200–6500 Hz; nonsense syllables, so the rates are for words the scene does not settle; English listeners'
// rates used for every language [ASSUMED]); linear between the measured ratios, none above +12 dB [ASSUMED: past the data].
// Read from the PDF text; a few single counts lost in extraction (checked against the page image at 0 dB).
interface Colex { concepts: string[]; pairs: [number, number][]; names: Record<string, string>; by: Record<string, number[]>;
    whisper: Record<string, [number, number, number, number][]>; noise: Record<string, [number, number, number, number][]>; noiseTables: Record<string, number[][]> }

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
// Names the word lists file under a city or variety name.
const ALIAS: Record<string, string> = { cantonese: 'guan1279', 'yue chinese': 'guan1279', mandarin: 'mand1415' };
export function languageCode(name: string): string | null {
    return ALIAS[key(name)] ?? DATA?.names[key(name)] ?? null;
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

/** Words the whispered word for `word` can be heard as in language `code`, each with the share heard so. */
export function whisperedAs(word: string, code: string): { concept: string; rate: number }[] {
    if (!DATA) return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Map<number, number>();
    for (const [a, b, ab, ba] of DATA.whisper[code] ?? []) {
        const [other, r] = ids.has(a) && !ids.has(b) ? [b, ab] : ids.has(b) && !ids.has(a) ? [a, ba] : [-1, 0];
        if (other >= 0 && r > 0) out.set(other, Math.max(out.get(other) ?? 0, r));
    }
    return [...out].map(([i, rate]) => ({ concept: show(DATA!.concepts[i]), rate }));
}

const SNRS = [-18, -12, -6, 0, 6, 12];
/** Share of consonant `a` heard as `b` (Miller & Nicely indices) at `snr` dB; 0 at or above +12 dB. */
function heardAs(a: number, b: number, snr: number): number {
    if (!DATA || snr >= 12) return 0;
    const at = (k: number) => { const m = DATA!.noiseTables[String(SNRS[k])]; const row = m[a]; return row[b] / row.reduce((x, y) => x + y, 0); };
    if (snr <= SNRS[0]) return at(0);
    const k = SNRS.findIndex(x => x > snr) - 1;
    return at(k) + (at(k + 1) - at(k)) * (snr - SNRS[k]) / 6;
}

/** Words the word for `word` can be misheard as in language `code` at speech-to-noise ratio `snr` dB, with the share. */
export function noisyAs(word: string, code: string, snr: number): { concept: string; rate: number }[] {
    if (!DATA || snr >= 12) return [];
    const ids = new Set(KEYS.get(key(word)) ?? KEYS.get(singular(key(word))) ?? []), out = new Map<number, number>();
    for (const [a, b, ca, cb] of DATA.noise[code] ?? []) {
        const [other, r] = ids.has(a) && !ids.has(b) ? [b, heardAs(ca, cb, snr)] : ids.has(b) && !ids.has(a) ? [a, heardAs(cb, ca, snr)] : [-1, 0];
        if (other >= 0 && r >= 0.01) out.set(other, Math.max(out.get(other) ?? 0, r));
    }
    return [...out].map(([i, rate]) => ({ concept: show(DATA!.concepts[i]), rate }));
}

export interface Shared { word: string; also: string[] }

/** Words of an English message (1–3-word phrases, longest first) that `language` says with a word that has other meanings. */
export function sharedIn(message: string, language: string, max = 3, whispered = false, list?: string | null, snr = Infinity): Shared[] {
    const code = list === undefined ? languageCode(language) : list;
    if (!DATA || !code) return [];
    const w = key(message).split(' ').filter(Boolean), used = new Set<number>(), out: Shared[] = [];
    for (let n = 3; n >= 1; n--) for (let i = 0; i + n <= w.length && out.length < max; i++) {
        if ([...Array(n).keys()].some(j => used.has(i + j))) continue;
        const phrase = w.slice(i, i + n).join(' ');
        if (!KEYS.has(phrase) && !KEYS.has(singular(phrase))) continue;
        for (let j = 0; j < n; j++) used.add(i + j);
        const also = [...whispered ? whisperedAs(phrase, code).map(x => `${x.concept} if whispered`) : [], ...noisyAs(phrase, code, snr).map(x => `${x.concept} if misheard`),
            ...language === 'english' ? [] : sharedWith(phrase, code)];
        if (also.length) out.push({ word: phrase, also });
    }
    return out;
}
