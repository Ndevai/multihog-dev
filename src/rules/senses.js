// Which senses of a verb a line can mean, read from what its object is (docs/df-body-engine.md §7.3, 2026-10-27 (107)).
// A verb's VerbNet classes are its senses, and each class says what its direct object must be (its selectional
// restrictions: "fire" as dismissing takes a person, animal or organization; "pick" as eating takes food); WordNet says what
// kinds of thing a noun names (a cook is a person, a pistol a gun and a weapon, a lock a solid object). A sense whose
// requirement the object cannot meet, or whose frames take no object where the line has one, is not what the line means.
// Code leaves out only those; among the senses left, the model reads which one the scene means.
import { NOUN_KINDS, VERB_SENSES } from './data/senses.js';
let KINDS = null;
/** The kinds of thing a noun names (all its common senses, and its first sense's), or null when the lexicon lacks it. */
export function kindsOf(word) {
    if (!KINDS) {
        KINDS = new Map();
        for (const [sig, words] of Object.entries(NOUN_KINDS)) {
            const [all, first] = sig.split('/');
            for (const w of words.split(' '))
                KINDS.set(w, { all: all, first: first ?? all });
        }
    }
    const w = word.toLowerCase().replace(/'s$/, '');
    // Plurals: -ies, -es after a sibilant, -s, -men, and the irregular children and people.
    return KINDS.get(w) ?? KINDS.get(w.replace(/ies$/, 'y')) ?? KINDS.get(w.replace(/(?:ches|shes|sses|xes)$/, m => m.slice(0, -2))) ?? KINDS.get(w.replace(/s$/, '')) ?? KINDS.get(w.replace(/men$/, 'man')) ?? KINDS.get(w === 'children' ? 'child' : w === 'people' ? 'person' : '') ?? null;
}
const PERSON_PRONOUN = /^(?:him|her|them|me|us|you|myself|himself|herself|themselves|ourselves|yourself|yourselves|everyone|everybody|someone|somebody|anyone|anybody|nobody)$/;
const DET = /^(?:the|a|an|my|his|her|their|our|your|its|this|that|these|those|some|any|every|each|no|one|two|three|four|five|six|seven|eight|nine|ten|another|other|both|all|several|few|many|\d+)$/;
// Prepositions, particles, conjunctions, and the adverbs of place and time that stand where an object would ("what does a
// smith earn here": the object is the fronted what).
const STOP = /^(?:at|to|into|onto|on|in|with|from|for|of|over|under|through|across|toward|towards|against|by|about|around|behind|before|after|off|out|away|down|up|back|upon|along|past|near|between|beside|inside|outside|without|within|like|as|and|or|but|then|so|while|until|when|if|because|here|there|now|today|tonight|tomorrow|yesterday|again|too|also|[,.;:!?])$/;
/** The direct object right after a verb ("the cook", "my sword", "him", "Tom"), whether a second object follows ("the cook
 *  a coin": NP V NP NP), or "none" when a preposition, a particle or the end comes first. `after` is the words after the
 *  verb, lower case; `raw` the line, for a name's capital; `people` the scene's names. */
export function objectAfter(after, raw = '', people = []) {
    let i = 0;
    const name = (w) => people.some(n => n.toLowerCase().split(' ').includes(w)) || new RegExp(`(?<![.!?]\\s)\\b${w.charAt(0).toUpperCase()}${w.slice(1)}\\b`).test(raw) && !/^(?:i)$/.test(w);
    const w0 = after[0];
    if (!w0 || STOP.test(w0))
        return 'none';
    // A person pronoun not followed by a noun is the object ("hit him"; "her coat" is a determiner and its noun). A second
    // object is a noun phrase, not a measure or a time ("I punched Tom two days ago": an adjunct, CGEL ch. 8, as for the
    // first object below).
    const second = (w, at = -1) => {
        if (!w || STOP.test(w) || !(DET.test(w) || !!kindsOf(w) || PERSON_PRONOUN.test(w)))
            return false;
        let j = at;
        while (j >= 0 && j < after.length && DET.test(after[j]))
            j++;
        const k = j >= 0 && j < after.length ? kindsOf(after[j]) : null;
        return !(k && !/[hxl$fce]/.test(k.first) && /i/.test(k.first));
    };
    if (PERSON_PRONOUN.test(w0) && !(w0 === 'her' && after[1] && kindsOf(after[1]) && !STOP.test(after[1])))
        return { head: w0, kinds: { all: 'hx', first: 'hx' }, dative: second(after[1], 1) };
    while (i < after.length && DET.test(after[i]))
        i++;
    const run = [];
    while (i < after.length && run.length < 4 && !STOP.test(after[i]) && !(run.length && DET.test(after[i]))) {
        run.push(after[i]);
        if (/'s$/.test(after[i])) {
            run.length = 0;
        }
        i++;
    }
    if (!run.length)
        return 'none';
    // A measure or a time after the verb is an adjunct, no object ("walk 10 m to the door", "wait an hour": CGEL ch. 8): WordNet's
    // noun.quantity and noun.time.
    const firstOf = kindsOf([...run].reverse().find(w => kindsOf(w)) ?? '');
    const counted = i > 0 && /^(?:\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|forty|fifty|hundred|a few|several)$/.test(after[i - run.length - 1] ?? '');
    // A unit symbol is a measure too (the router's words drop digits: "walk 10 m" reaches here as "walk m").
    if (/^(?:m|km|cm|mm|ft|yd|yds|mi|kg|g|lb|lbs|oz|h|hr|hrs|min|mins|s|sec|secs)$/.test(run[run.length - 1]))
        return 'none';
    if (firstOf && !/[hxl$fce]/.test(firstOf.first) && (/[iy]/.test(firstOf.first) || (counted && /[iy]/.test(firstOf.all))))
        return 'none';
    // The head is the last word of the phrase the lexicon knows ("the kitchen knife": knife); a name is a person.
    const head = [...run].reverse().find(w => kindsOf(w)) ?? run[run.length - 1];
    const kinds = run.some(name) && !kindsOf(head) ? { all: 'hx', first: 'hx' } : kindsOf(head);
    return { head, kinds, dative: second(after[i], i) };
}
const meets = (req, k) => req === '*' || req.split('|').some(g => {
    const lits = g.match(/!?./gu) ?? [];
    return lits.every(l => l.startsWith('!') ? !k.first.includes(l.slice(1)) : k.all.includes(l));
});
/** The senses (VerbNet classes) of `verb` the line can mean, each with how it fits: "match" when the object meets the
 *  class's stated requirement, "any" when the class leaves its object open or the line has none. Null when VerbNet gives
 *  the verb one class or none (nothing to choose); the verb's classes unfiltered when no class fits. */
// A particle after the verb makes a phrasal verb ("hold on to", "gobble down"); VerbNet lists those as members of their own
// (pick_up), and the base verb's frames do not describe them: no sense is left out.
const PARTICLE = /^(?:up|down|out|off|away|back|on|over|in|around|about|along|through|aside|together|apart|forth)$/;
export function readings(verb, after, raw = '', people = []) {
    const senses = VERB_SENSES[verb];
    if (!senses)
        return null;
    if (PARTICLE.test(after[0] ?? '')) {
        // A particle of direction before a place or a preposition of path is a motion's ("bolt down the alley", "paddle out to
        // the buoy": CGEL ch. 4 §6.1, an intransitive preposition): the senses that take no object stay, when some do. Before a
        // thing it is a phrasal verb's ("gobble down the stew"), and "on" is aspect ("hold on to the rope"): no sense is left out.
        const rest = after.slice(1), np = objectAfter(rest, raw, people);
        const path = after[0] !== 'on' && (/^(?:to|into|onto|toward|towards|across|through|from|along)$/.test(rest[0] ?? '') || (np !== 'none' && /l/.test(np.kinds?.first ?? '') && !/[hf]/.test(np.kinds?.first ?? '')));
        const bare = path ? Object.entries(senses).filter(([, spec]) => spec.split(';').slice(1).includes('b') || !spec.split(';')[0]).map(([cls]) => ({ cls, fit: 'any' })) : [];
        return bare.length ? bare : null;
    }
    const obj = objectAfter(after, raw, people);
    // The object's first sense first ("hold a meeting": an event, so no grip), its other senses when no class fits that one
    // ("fire an arrow": WordNet's first arrow is a mark; the projectile is a later sense).
    const fitWith = (kinds) => {
        const out = [];
        for (const [cls, spec] of Object.entries(senses)) {
            const [reqText, ...flags] = spec.split(';');
            const reqs = reqText ? reqText.split(',') : [];
            if (obj === 'none') {
                if (flags.includes('b') || !reqs.length)
                    out.push({ cls, fit: 'any' });
                continue;
            }
            if (!reqs.length)
                continue;
            if (obj.dative && !flags.includes('d'))
                continue;
            // "^" marks what the first of two objects must be (NP V NP NP: "cost me a shilling"); a line with one object is read
            // by the class's one-object frames ("carry the boy to the cart" is no cost to the boy).
            const own = reqs.filter(r => r.startsWith('^') === obj.dative).map(r => r.replace(/^\^/, ''));
            const use = own.length ? own : obj.dative ? reqs.filter(r => !r.startsWith('^')) : [];
            if (!use.length)
                continue;
            if (!kinds) {
                out.push({ cls, fit: 'any' });
                continue;
            }
            const hit = use.filter(r => meets(r, kinds));
            // A stated requirement that the object meets is a match; one that only says what it must not be ("not a person") is no
            // positive evidence.
            if (hit.length)
                out.push({ cls, fit: hit.some(r => /(?:^|\|)[^!|]|[^!|](?=\||$)/.test(r.replace(/!./g, '')) && r !== '*') ? 'match' : 'any' });
        }
        return out;
    };
    const k = obj === 'none' ? null : obj.kinds;
    const out = (k ? fitWith({ all: k.first, first: k.first }) : []).filter(r => r.fit === 'match').length ? fitWith({ all: k.first, first: k.first }) : fitWith(k);
    return out.length ? out : Object.keys(senses).map(cls => ({ cls, fit: 'any' }));
}
