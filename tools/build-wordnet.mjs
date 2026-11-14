// Builds src/rules/data/wordnet.ts from Open English WordNet 2024 (english-wordnet-2024.xml.gz, CC BY 4.0,
// https://github.com/globalwordnet/english-wordnet; McCrae et al. 2019). The reader (src/rules/grammar.ts) applies the
// grammar's rules; WordNet supplies only the facts about single words those rules ask:
//  - for each common noun (one in the SCOWL lexicon), the kinds of its senses in WordNet's order: a = an act, event,
//    communication, process, state, feeling or thought whose sense is derived from a verb sense (the 'associated verb' of
//    Huddleston & Pullum 2002, ch. 4 §7), c = a concrete thing, a substance, a possession or a quantity of one (the senses a
//    hand-over can move: n = an animal, q = a quantity, c = any other), p = a person, g = a group, h = a group of people (a
//    group sense WordNet files under social group, "people sharing some social relation", or people: crew, patrol,
//    council, crowd; not table, class or herd), t = a time (WordNet's
//    noun.time: the day, the morning, a week; the head of a time adjunct in front position, CGEL ch. 8 §20.1), o = any
//    other abstract sense; and, for the first a-sense, the verb it is
//    derived from and that verb sense's lexicographer file (35 = contact: the physical acts of Huddleston & Pullum's [11]);
//  - the light-verb idioms WordNet lists as single verbs (give chase, give way, take a breath, have a look…), each with a
//    one-word verb of the same sense when WordNet has one.
// Usage: node tools/build-wordnet.mjs <path to english-wordnet-2024.xml.gz>
import fs from 'node:fs';
import zlib from 'node:zlib';
import readline from 'node:readline';
import { LEXICON } from '../src/rules/data/lexicon.js';

const src = process.argv[2];
if (!src) { console.log('Usage: node tools/build-wordnet.mjs <english-wordnet-2024.xml.gz>'); process.exit(1); }
const common = new Set(LEXICON.split(' '));
// Lexicographer files (WordNet's lexnames): nouns 03–28, verbs 29–43. Acts: act, cognition, communication, event, feeling,
// process, state; things: animal, artifact, body, food, object, plant, possession, quantity, substance [ASSUMED grouping].
const ACTION = new Set([4, 9, 10, 11, 12, 22, 26]), CONCRETE = new Set([5, 6, 8, 13, 17, 20, 21, 23, 27]);
const kind = (lf, fromVerb) => ACTION.has(lf) && fromVerb ? 'a' : lf === 5 ? 'n' : lf === 23 ? 'q' : CONCRETE.has(lf) ? 'c' : lf === 18 ? 'p' : lf === 14 ? 'g' : lf === 28 ? 't' : 'o';
const unescape = (id) => id.replace(/^oewn-/, '').replace(/__.*$/, '').replace(/-ap-/g, "'").replace(/_/g, ' ');
const fileOf = (senseId) => Number(/__\d\.(\d\d)\./.exec(senseId)?.[1]);

const nouns = new Map();      // lemma -> [{ k, verb, vfile }]
const lemmasAll = new Set();   // every lower-case one-word lemma, of any part of speech
const synsetVerbs = new Map(); // verb synset -> its one-word members, in WordNet's order (the first is the most typical)
const hypernyms = new Map();   // noun synset -> its hypernyms
let synset = null;
const idioms = [];             // [lemma, synsets]
let entry = null, sense = null;
const rl = readline.createInterface({ input: fs.createReadStream(src).pipe(zlib.createGunzip()), crlfDelay: Infinity });
for await (const line of rl) {
    let m;
    if ((m = /<Synset id="([^"]+-v)"[^>]*members="([^"]+)"/.exec(line))) { synsetVerbs.set(m[1], m[2].split(' ').filter(x => !x.includes('_')).map(x => unescape(x).replace(/-[nvars](?:-\d+)?$/, ''))); continue; }
    if ((m = /<Synset id="([^"]+-n)"/.exec(line))) { synset = m[1]; hypernyms.set(synset, []); continue; }
    if (synset && (m = /<SynsetRelation relType="(?:hypernym|instance_hypernym)" target="([^"]+)"/.exec(line))) { hypernyms.get(synset).push(m[1]); continue; }
    if (/<\/Synset>/.test(line)) { synset = null; continue; }
    if ((m = /<LexicalEntry id="([^"]+)"/.exec(line))) { entry = { senses: [] }; continue; }
    if (!entry) continue;
    if ((m = /<Lemma writtenForm="([^"]*)" partOfSpeech="(\w)"/.exec(line))) { entry.lemma = m[1].replace(/&apos;/g, "'"); entry.pos = m[2]; continue; }
    if ((m = /<Sense id="([^"]+)"[^>]*synset="([^"]+)"/.exec(line))) { sense = { id: m[1], synset: m[2], derived: [] }; entry.senses.push(sense); continue; }
    if (sense && (m = /<SenseRelation relType="derivation" target="([^"]+)"/.exec(line))) { sense.derived.push(m[1]); continue; }
    if (/<\/LexicalEntry>/.test(line)) {
        const { lemma, pos, senses } = entry;
        if (/^[a-z]+$/.test(lemma)) lemmasAll.add(lemma);
        if (pos === 'v') {
            if (lemma.includes(" ") && /^(?:give|take|have|make|do|pay|offer|put|raise) (?!(?:up|down|in|out|off|on|over|away|back|about|around|after|apart|across|along|aside|for|to|into|onto|through|by|forth|under|with|as|if|it on|it away|it off)\b)/.test(lemma)) idioms.push([lemma, senses.map(s => s.synset)]);
        }
        if (pos === 'n' && /^[a-z]+$/.test(lemma) && common.has(lemma)) {
            const list = nouns.get(lemma) ?? [];
            for (const s of senses) {
                const verb = s.derived.find(t => /__2\.\d\d\./.test(t));
                list.push({ k: kind(fileOf(s.id), !!verb), verb: verb ? unescape(verb) : null, vfile: verb ? fileOf(verb) : null, synset: s.synset });
            }
            nouns.set(lemma, list);
        }
        entry = null; sense = null;
    }
}
// Groups of people: a group sense below social group (oewn-07967506-n, "people sharing some social relation") or people
// (oewn-07958392-n, "any group of human beings … collectively").
const PEOPLE_ROOTS = new Set(['oewn-07967506-n', 'oewn-07958392-n']), ofPeople = new Map();
const peopleGroup = (s, seen = new Set()) => {
    if (PEOPLE_ROOTS.has(s)) return true;
    if (ofPeople.has(s)) return ofPeople.get(s);
    seen.add(s);
    const r = (hypernyms.get(s) ?? []).some(h => !seen.has(h) && peopleGroup(h, seen));
    ofPeople.set(s, r);
    return r;
};
for (const senses of nouns.values()) for (const s of senses) if (s.k === 'g' && peopleGroup(s.synset)) s.k = 'h';
const out = [];
for (const [lemma, senses] of [...nouns].sort(([a], [b]) => a.localeCompare(b))) {
    const kinds = senses.map(s => s.k).join('').replace(/(.)\1+/g, '$1');
    const act = senses.find(s => s.k === 'a');
    out.push(act ? `${lemma}:${kinds}:${act.verb.replace(/ /g, '_')}:${act.vfile}` : `${lemma}:${kinds}`);
}
const light = idioms.sort(([a], [b]) => a.localeCompare(b)).map(([lemma, synsets]) => {
    // The idiom's first (most frequent) sense, and its first one-word member that is no light verb.
    const verb = (synsetVerbs.get(synsets[0]) ?? []).find(v => !/^(?:give|take|have|make|do|pay|offer|put|raise|get)$/.test(v)) ?? '';
    return `${lemma}=${verb}`;
});
// The prefixed words of the Hunspell dictionaries the lexicon comes from: there they are stems with prefix flags (re-, un-,
// in-, dis-, de-, mis-, non-, pre-, over-, under-, out-, co-, anti-, fore-, inter-, sub-, super-, trans-), which
// tools/build-lexicon.mjs keeps as the bare stem, so "return", "unable", "dishonest", "recover" were no words to isWord.
// Restored where WordNet lists the prefixed word and the lexicon holds the rest.
const PREFIXES = ['re', 'un', 'in', 'im', 'il', 'ir', 'dis', 'de', 'mis', 'non', 'pre', 'over', 'under', 'out', 'co', 'anti', 'fore', 'inter', 'sub', 'super', 'trans'];
const prefixed = [...lemmasAll].filter(w => !common.has(w) && PREFIXES.some(p => w.startsWith(p) && w.length - p.length >= 3 && common.has(w.slice(p.length)))).sort();
fs.writeFileSync(new URL('../src/rules/data/wordnet.ts', import.meta.url), `// Built by tools/build-wordnet.mjs from Open English WordNet 2024 (https://github.com/globalwordnet/english-wordnet;
// McCrae, Rademaker, Bond, Rudnicka & Fellbaum 2019, "English WordNet 2019 – An Open-Source WordNet for English", Proc.
// 10th Global WordNet Conference), licensed CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/); derived from Princeton
// WordNet 3.0 (Fellbaum 1998). ${out.length} common nouns, ${light.length} light-verb idioms.
/** Noun: the kinds of its senses in WordNet's order (a act derived from a verb; n animal, q quantity, c other thing,
 *  substance or possession; p person, g group, h group of people, t time, o other), then, with an a-sense, the verb it comes from and that verb's
 *  lexicographer file. */
export const NOUNS = ${JSON.stringify(out.join(' '))};
/** Light-verb idioms WordNet lists as verbs, each with a one-word verb of the same sense ('' when it has none). */
export const LIGHT_IDIOMS = ${JSON.stringify(light.join('|'))};
/** Prefixed words (re-, un-, dis-…) WordNet lists whose rest the lexicon holds, the forms the lexicon's build dropped. */
export const PREFIXED = ${JSON.stringify(prefixed.join(' '))};
`);
console.log(`${out.length} nouns, ${light.length} idioms, ${prefixed.length} prefixed words`);
