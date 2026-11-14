// Whether a word is a common English word (data/lexicon.ts, from SCOWL's Hunspell dictionaries), with its inflections taken
// off: plurals and third persons (-s, -es, -ies), past tenses (-ed, -ied, a doubled consonant), -ing, comparatives (-er,
// -est), -ly and 's. A run of three or more of one letter, a shout drawn out ("NOOOO"), counts as one or two of it.
import { LEXICON } from './data/lexicon.js';
// The prefixed words the lexicon's build kept only as stems ("return", "unable", "recover"), restored from WordNet
// (tools/build-wordnet.mjs PREFIXED).
import { PREFIXED } from './data/wordnet.js';
// The prepositions of the grammar (grammar.ts PREPOSITION): Hunspell's dictionaries lack "into" among them.
import { PREPOSITION } from './grammar.js';
let WORDS = null;
export const stems = (w) => {
    const out = [w];
    const add = (s) => { if (s.length >= 2)
        out.push(s); };
    if (w.endsWith("'s"))
        add(w.slice(0, -2));
    if (w.endsWith('ies') || w.endsWith('ied'))
        add(`${w.slice(0, -3)}y`);
    for (const suf of ['es', 's', 'ed', 'd', 'ing', 'er', 'est', 'ly'])
        if (w.endsWith(suf)) {
            const s = w.slice(0, -suf.length);
            add(s);
            add(`${s}e`);
            if (/([b-df-hj-np-tv-z])\1$/.test(s))
                add(s.slice(0, -1));
            if (suf === 'ly' && s.endsWith('i'))
                add(`${s.slice(0, -1)}y`);
        }
    return out;
};
export function isWord(word) {
    WORDS ??= new Set([...LEXICON.split(' '), ...PREFIXED.split(' '), ...PREPOSITION.source.replace(/^\^\(\?:|\)\$$/g, '').split('|')]);
    const w = word.toLowerCase().replace(/’/g, "'");
    const forms = new Set([w, w.replace(/(\p{L})\1{2,}/gu, '$1'), w.replace(/(\p{L})\1{2,}/gu, '$1$1')]);
    return [...forms].some(f => stems(f).some(s => WORDS.has(s)));
}
