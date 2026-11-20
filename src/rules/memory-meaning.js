// The memory of meaning (2026-11-17, section 97; the player's question, "do we really forget words?"). People keep what a
// sentence meant and lose its wording within moments (Sachs 1967, Percept Psychophys 2:437: after 80 syllables changes of
// wording went unnoticed and changes of meaning did not); what they mean and the word for it are separate steps (Levelt,
// Roelofs & Meyer 1999, Behav Brain Sci 22:1); and a memory goes wrong by meaning, to what lies near it (Roediger & McDermott
// 1995, J Exp Psychol LMC 21:803: a word never heard but near the list's words recalled 55 % of the time). So the engine keeps
// how a memory drifts in meaning, and the narrator puts it into words.
//
// Which details drift, and how many, stays as section 81 drew them (knowledge.ts driftOf: one fixed draw per detail against
// Talarico & Rubin's shares). What a drifted detail becomes is decided here, by what it means:
// - a noun (Open English WordNet 2024, its first sense; data/kinds.ts): left out, it is held at its basic level, the most
//   used word among it and the three kinds above it (since 2026-11-18, section 102: memory converges on the basic level,
//   Pansky & Koriat 2004, Psychol Sci 15:52, "jeans" recalled as "pants", a third of the shifted items at a week; the basic
//   level found as the most frequent word in WordNet's chain, Mills, Bond & Levow 2018, GWC, voting rule 40); a word that is
//   its own basic level ("town", "blood"), or whose basic level's word few use, is held as someone, something, somewhere or
//   some time by what it is, and its word is the narrator's to choose; changed, it comes out as another of the nearest kind at
//   or above its basic level whose word people use (Zipf 3.5, about 3 in a million words), which the narrator chooses
//   (another kind of worker); with none, in other words;
// - a word that stands with others for one thing (the names people use for the kind, RuleState.alike, which a story can set):
//   changed, it comes out as another of them;
// - a day of the week or a month: changed, its neighbour; left out, forgotten;
// - a year: changed, one off; another number: changed, to the nearest round number (to 5, or 10 from 30 up) [ASSUMED: people
//   recall and report numbers rounded, as age heaping shows, A'Hearn, Baten & Crayen 2009, J Econ Hist 69:783]; left out,
//   forgotten;
// - any other word (a verb, a name, a quality): left out, it is left out; changed, it is said in other words.
import { NOUNS } from './data/wordnet.js';
import { KINDS, KIND_FILES, NOUN_PARENTS } from './data/kinds.js';
import { VERBNET } from './data/verbnet.js';
import { PREPOSITION, AUXILIARY } from './grammar.js';
import { lemmas, pastForm } from './verbs.js';
import { def, k } from './constants.js';
// zipf: how often the word is used in this sense, a Zipf value times ten (log10 of uses per billion words; 0 for none).
let NOUN = null, KIND = [];
function load() {
    if (NOUN)
        return;
    const b = (x) => x ? parseInt(x, 36) : -1;
    KIND = KINDS.split('~').map(k => { const [name, p, f, z] = k.split('|'); return { name: name, parent: b(p), file: KIND_FILES[b(f)] ?? '', zipf: Math.max(0, b(z)) }; });
    const ws = NOUNS.split(' ').map(x => x.split(':')[0]), ps = NOUN_PARENTS.split(' ');
    NOUN = new Map(ws.map((w, i) => { const [p, f, z] = (ps[i] ?? '').split('.'); return [w, { parent: b(p), file: KIND_FILES[b(f)] ?? '', zipf: Math.max(0, b(z)) }]; }));
}
def({ id: 'everydayZipf', value: 3.5, unit: 'Zipf (log10 uses per billion words)', status: 'assumed', src: 'a word people use: about 3 in a million words or more; Van Heuven et al. 2014 (Q J Exp Psychol 67:1176) put low-frequency words at Zipf 1-3 and high-frequency at 4-7 [ASSUMED: the middle between]', range: [3, 4], file: 'memory-meaning.ts' });
// A word is held by its noun meaning only where the sentence uses it as a noun: the head of a phrase that a determiner, a
// possessive, a number or a preposition opens (up to three words of modifiers between), and that a stop closes: punctuation
// or the end, a preposition, a conjunction, an auxiliary, a determiner or pronoun, or a verb form (a past form, or a VerbNet
// verb ending in -s or -ing that is not itself a noun). "a domestic indoor servant," holds "servant", not "domestic"; "they
// call" holds no "call". A word read otherwise drifts in other words, which the narrator chooses [ASSUMED: a missed noun is
// safer than a wrong sense].
const OPENER = /^(?:the|a|an|his|her|their|its|my|your|our|this|that|these|those|some|any|no|every|each|another|one|two|three|several|many|few)$/i;
const CLOSER = /^(?:and|or|but|nor|yet|so|then|who|which|whom|whose|where|when|while|as|than|i|me|we|us|you|he|him|she|they|them|it)$/i;
const isNoun = (w) => !!singular(w);
const verbForm = (w) => { const l = w.toLowerCase(); return !isNoun(l) && (pastForm(l) || (/(?:s|ing)$/.test(l) && lemmas(l).some(x => x !== l && !!VERBNET[x]))); };
/** The words a sentence uses as head nouns, lower case. */
export function headNouns(text) {
    const toks = String(text).match(/[\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}]/gu) ?? [], out = new Set();
    const word = (t) => !!t && /^[\p{L}\p{N}]/u.test(t);
    // A verb here: a verb form, or a VerbNet verb in -s or -ing straight after a noun that is not a determiner's ("the debtor
    // wants", "the lodger pays": the noun's verb, not a second noun).
    const verbAt = (i) => {
        const t = toks[i];
        if (!t || !/^\p{L}+$/u.test(t))
            return false;
        if (verbForm(t))
            return true;
        const l = t.toLowerCase(), p = toks[i - 1];
        return /(?:s|ing)$/.test(l) && lemmas(l).some(x => x !== l && !!VERBNET[x]) && !!p && /^\p{L}+$/u.test(p) && isNoun(p) && !OPENER.test(p) && !PREPOSITION.test(p.toLowerCase());
    };
    for (let i = 0; i < toks.length; i++) {
        const t = toks[i];
        if (!/^\p{L}+$/u.test(t) || !isNoun(t) || PREPOSITION.test(t.toLowerCase()) || AUXILIARY.test(t) || OPENER.test(t) || CLOSER.test(t) || verbAt(i))
            continue;
        let j = i - 1, opened = false;
        for (let k = 0; k < 4 && j >= 0 && word(toks[j]); k++, j--) {
            const p = toks[j];
            if (OPENER.test(p) || PREPOSITION.test(p.toLowerCase()) || /^\d/.test(p)) {
                opened = true;
                break;
            }
            if (CLOSER.test(p) || AUXILIARY.test(p) || verbAt(j))
                break;
        }
        const n = toks[i + 1];
        const closed = !n || !word(n) || PREPOSITION.test(n.toLowerCase()) || CLOSER.test(n) || AUXILIARY.test(n) || OPENER.test(n) || verbAt(i + 1);
        if (opened && closed)
            out.add(t.toLowerCase());
    }
    return out;
}
/** The singular WordNet holds for a noun or its plural (the forms grammar.ts noun reads), or null. */
export function singular(word) {
    load();
    const w = word.toLowerCase();
    for (const f of [w, w.replace(/ies$/, 'y'), w.replace(/ves$/, 'f'), w.replace(/ves$/, 'fe'), w.replace(/(?:ch|sh|s|x|z)es$/, m => m.slice(0, -2)), w.replace(/s$/, ''), w.replace(/men$/, 'man')])
        if (NOUN.has(f))
            return f;
    return null;
}
// The plural of a kind's name: its head word, the one before "of" when it has one ("media of exchange").
const PLURAL_HEAD = { medium: 'media', criterion: 'criteria', phenomenon: 'phenomena', datum: 'data', person: 'people', child: 'children', foot: 'feet', tooth: 'teeth', mouse: 'mice' };
const plural = (kind) => kind.replace(/(\w+)(?=( of .*)?$)/, w => PLURAL_HEAD[w] ?? (/[^aeiou]y$/.test(w) ? `${w.slice(0, -1)}ies` : /(?:s|x|z|ch|sh)$/.test(w) ? `${w}es` : /^(man|woman)$/.test(w) ? w.replace(/an$/, 'en') : `${w}s`));
/** The kinds above a noun's first sense, nearest first (at most three), plural for a plural noun, or [] for a word WordNet
 *  does not hold as a noun. */
export function kindsAbove(word) { return chainOf(word).slice(1).map(x => x.name); }
/** A noun and the kinds above its first sense (at most three), each with how often its word is used (Zipf times ten); the
 *  noun itself first, as written; [] for a word WordNet does not hold as a noun. */
export function chainOf(word) {
    load();
    const one = singular(word), many = !!one && one !== word.toLowerCase(), n = one ? NOUN.get(one) : undefined;
    if (!n)
        return [];
    const out = [{ name: word, zipf: n.zipf }];
    for (let i = n.parent; i >= 0 && out.length < 4; i = KIND[i].parent)
        out.push({ name: many ? plural(KIND[i].name) : KIND[i].name, zipf: KIND[i].zipf });
    return out;
}
/** Where a noun's chain has its basic level: the most used word, the nearest of equals (Mills, Bond & Levow 2018). */
export const basicAt = (chain) => chain.reduce((best, x, i) => x.zipf > chain[best].zipf ? i : best, 0);
/** What a noun is, by WordNet's file (person, time, location…), or ''. */
export const fileOf = (word) => { load(); const one = singular(word); return one ? NOUN.get(one)?.file ?? '' : ''; };
const VAGUE = { person: 'someone', time: 'some time', location: 'somewhere', group: 'some people' };
const vague = (w) => VAGUE[fileOf(w)] ?? 'something';
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
// The parts of a day in their order [ASSUMED: a part of the day misremembered is one beside it].
const PARTS = ['dawn', 'morning', 'noon', 'afternoon', 'evening', 'night', 'midnight'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const cap = (w) => w ? `${w[0].toUpperCase()}${w.slice(1)}` : w;
/** "an" before a vowel, and before a number said with one (8, 11, 18, 80–89: "an 18-year-old"). */
export const anBefore = (w) => /^[aeiou]/i.test(w) || /^(8\d?|1[18])(?!\d)/.test(w);
// A date as the engine writes one: "on the morning of Sunday 13 February 1881", "on Monday 12 September 1881", "in 1881".
const DATE = new RegExp(`\\b(on|in) (?:the (${PARTS.join('|')}) of )?(?:(${DAYS.join('|')})\\s?)?(?:(\\d{1,2})\\s)?(?:(${MONTHS.join('|')})\\s?)?(\\d{4})?`, 'gi');
/** What is left of a date, said as people say it [ASSUMED forms]: a day of the month is nothing without its month; a weekday
 *  without its date is "one Sunday"; a part of the day without a date is "one morning". */
export function datePhrase(c) {
    const day = c.month ? c.day : undefined, date = [day, c.month, c.year].filter(Boolean).join(' '), at = !!c.part && /^(dawn|noon|midnight)$/i.test(c.part);
    if (day) {
        const when = [c.weekday, date].filter(Boolean).join(' ');
        return !c.part ? `on ${when}` : at ? `at ${c.part} on ${when}` : `on the ${c.part} of ${when}`;
    }
    const within = date ? ` in ${date}` : '';
    if (c.weekday)
        return !c.part ? `one ${c.weekday}${within}` : at ? `at ${c.part} one ${c.weekday}${within}` : `one ${c.weekday} ${c.part}${within}`;
    if (c.part)
        return at ? `at ${c.part} one day${within}` : `one ${c.part}${within}`;
    return date ? `in ${date}` : '';
}
const round = (n) => { const step = n >= 30 ? 10 : 5, r = Math.round(n / step) * step; return r !== n ? r : n + step; };
// The story's own links (links.ts, section 104): the card's and chat's lorebook groups and /memory-link's, set by the page.
let STORY = { same: [], kinds: {} };
/** Sets the story's own links for every memory read after (index.ts refreshLinks). */
export const setLinks = (l) => { STORY = { same: l.same.map(g => g.map(w => w.toLowerCase())), kinds: Object.fromEntries(Object.entries(l.kinds).map(([a, b]) => [a.toLowerCase(), b])) }; };
/** One detail's drift by meaning; `u` a fixed draw for its way (which neighbour, which name). */
export function heldBy(word, fate, u, links = [], noun = true) {
    const w = word.toLowerCase(), d = DAYS.indexOf(w), m = MONTHS.indexOf(w), side = u < 0.5 ? -1 : 1;
    if (d >= 0)
        return fate === 'changed' ? { word, fate, as: cap(DAYS[(d + side + 7) % 7]), how: 'as the day beside it' } : { word, fate, as: '', how: 'the day forgotten' };
    const pt = PARTS.indexOf(w);
    // the part beside it, the other side at either end
    if (pt >= 0)
        return fate === 'changed' ? { word, fate, as: PARTS[pt + side >= 0 && pt + side < PARTS.length ? pt + side : pt - side], how: 'as the part of the day beside it' } : { word, fate, as: '', how: 'the time of day forgotten' };
    if (m >= 0)
        return fate === 'changed' ? { word, fate, as: cap(MONTHS[(m + side + 12) % 12]), how: 'as the month beside it' } : { word, fate, as: '', how: 'the month forgotten' };
    if (/^\d+$/.test(w)) {
        const n = Number(w), year = w.length === 4 && n >= 1000 && n <= 2100;
        if (fate === 'left')
            return { word, fate, as: '', how: year ? 'the year forgotten' : 'the number forgotten' };
        return year ? { word, fate, as: String(n + side), how: 'as a year off' } : { word, fate, as: String(round(n)), how: 'as a round number' };
    }
    const group = [...links, ...STORY.same].find(g => g.some(x => x.toLowerCase() === w));
    if (group && fate === 'changed') {
        const others = group.filter(x => x.toLowerCase() !== w);
        if (others.length) {
            const o = others[Math.floor(u * others.length)];
            return { word, fate, as: o, how: 'as another word for the same' };
        }
    }
    // A kind the story sets for a word (links.ts): held as it, or as another of it, before any kind WordNet knows.
    const own = STORY.kinds[w] ?? STORY.kinds[singular(w) ?? ''];
    if (own) {
        const another = singular(w) && singular(w) !== w ? 'other' : 'another';
        return fate === 'left' ? { word, fate, as: own, how: `held only as ${own}` } : { word, fate, as: `${another} ${own}`, how: `as ${another} ${own}` };
    }
    // A span of time (years, weeks: WordNet's time file) is held only as some time; its kinds (time period) read as no one
    // speaks [ASSUMED].
    if (noun && fileOf(w) === 'time')
        return fate === 'left' ? { word, fate, as: 'some time', how: 'held only as some time' } : { word, fate, as: word, how: 'in other words' };
    const chain = noun ? chainOf(w) : [];
    const another = singular(w) !== w ? 'other' : 'another';
    if (chain.length > 1) {
        const basic = basicAt(chain);
        if (fate === 'left')
            return basic > 0 && chain[basic].zipf >= k('everydayZipf') * 10 ? { word, fate, as: chain[basic].name, how: `held only as ${chain[basic].name}` } : { word, fate, as: vague(w), how: `held only as ${vague(w)}` };
        const to = chain.find((x, i) => i >= Math.max(basic, 1) && x.zipf >= k('everydayZipf') * 10);
        return to ? { word, fate, as: `${another} ${to.name}`, how: `as ${another} ${to.name}` } : { word, fate, as: word, how: 'in other words' };
    }
    if (noun && fileOf(w))
        return { word, fate, as: vague(w), how: `held only as ${vague(w)}` };
    return fate === 'left' ? { word, fate, as: '', how: 'left out' } : { word, fate, as: word, how: 'in other words' };
}
/** A fact as its holder keeps it now: its words with each drifted detail put as it is held (a noun left out as its kind, a
 *  day as its neighbour, a forgotten number left out), "a"/"an" fitted before a word that changed. Words the telling chooses
 *  (another of a kind, other words) stay as written, as do the vaguest gists (someone, something) and the words inside a
 *  compound ("27-year-old" keeps its "year"; its number can still change). */
export function heldText(text, held) {
    const by = new Map(held.map(h => [h.word.toLowerCase(), h]));
    // A date is held as a whole (2026-11-17, section 101): each of its parts as it is held, then said as people say what is
    // left of one ("one Sunday morning in February 1881", "in 1881"); set aside while the other words are put.
    const dates = [];
    text = String(text).replace(DATE, (all, on, part, wd, day, month, year) => {
        if (!wd && !month && !year)
            return all;
        const kept = (w) => { if (!w)
            return undefined; const h = by.get(w.toLowerCase()); return !h || h.how === 'in other words' || h.how === 'left out' ? w : h.as || undefined; };
        const said = datePhrase({ part: kept(part), weekday: kept(wd), day: kept(day), month: kept(month), year: kept(year) });
        dates.push(said && /^O|^I/.test(on) ? cap(said) : said);
        return `\u0001${'\u0002'.repeat(dates.length)}\u0001${/\s$/.test(all) ? ' ' : ''}`;
    });
    const parts = text.split(/([\p{L}\p{N}]+)/u);
    for (let i = 1; i < parts.length; i += 2) {
        const tok = parts[i], h = by.get(tok.toLowerCase());
        // Kept as written: what the telling words (other words, another of a kind: the narrator chooses) and the vaguest gist.
        if (!h || h.how === 'in other words' || h.how === 'left out' || /^(another|other) /.test(h.as) || Object.values(VAGUE).includes(h.as) || h.as === 'something')
            continue;
        const inCompound = /-$/.test(parts[i - 1] ?? '') || /^-/.test(parts[i + 1] ?? '');
        if (inCompound && !/^\d+$/.test(tok))
            continue;
        const word = h.as, keepCase = DAYS.includes(word.toLowerCase()) || MONTHS.includes(word.toLowerCase());
        if (word === '') {
            // A forgotten word goes with what only it held: a number with its compound ("27-year-old"), a word with the
            // preposition or article straight before it ("at midnight", "the morning"), and an article before them.
            parts[i] = '';
            if (inCompound) {
                for (let j = i + 1; j < parts.length && !/\s/.test(parts[j]); j++)
                    parts[j] = '';
                // the article before it fitted to the word now after it ("an 18-year-old woman" as "a woman")
                const k = parts.findIndex((x, n) => n > i && n % 2 === 1 && !!x);
                if (k > 0 && /^ $/.test(parts[i - 1] ?? '') && /^(a|an)$/i.test(parts[i - 2] ?? ''))
                    parts[i - 2] = `${/^A/.test(parts[i - 2]) ? 'A' : 'a'}${anBefore(parts[k]) ? 'n' : ''}`;
                continue;
            }
            const before = (j) => /^ $/.test(parts[j + 1] ?? '') ? parts[j] ?? '' : '';
            const next = parts[i + 2] ?? '', gap = parts[i + 1] ?? '', of = /^ $/.test(gap) && /^of$/i.test(next);
            // Outside a date (a date is held whole, above), "the morning of the fire" forgotten as morning is the day of it.
            if (of && PARTS.includes(tok.toLowerCase())) {
                parts[i] = 'day';
                continue;
            }
            let j = i - 2;
            if (/^(?:the|a|an)$/i.test(before(j))) {
                parts[j] = '';
                parts[j + 1] = '';
                j -= 2;
            }
            // "the 3 of them", the number forgotten: some of them.
            if (of && /^\d+$/.test(tok)) {
                parts[i] = 'some';
                continue;
            }
            if (of) {
                parts[i + 1] = '';
                parts[i + 2] = '';
            }
            else if (/^(?:at|on|in|by|to|of)$/i.test(before(j)) && (!/^ $/.test(gap) || PREPOSITION.test(next.toLowerCase()) || CLOSER.test(next))) {
                parts[j] = '';
                parts[j + 1] = '';
            }
            continue;
        }
        parts[i] = /^\p{Lu}/u.test(tok) && !keepCase ? cap(word) : word;
        // "a"/"an" before the new word
        if (word && /^ $/.test(parts[i - 1] ?? '') && /^(a|an)$/i.test(parts[i - 2] ?? '')) {
            const an = anBefore(word);
            parts[i - 2] = `${/^A/.test(parts[i - 2]) ? 'A' : 'a'}${an ? 'n' : ''}`;
        }
    }
    // A date left with its month alone reads "in February 1881", not "on"; a preposition or article left before a comma
    // ("on , drained") goes before the space is closed up.
    return parts.join('').replace(/\u0001(\u0002+)\u0001/g, (_, k) => dates[k.length - 1]).replace(/ {2,}/g, ' ').replace(/\b([Oo])n (?=(?:January|February|March|April|May|June|July|August|September|October|November|December)\b(?! \d{1,2}\b))/g, (_, o) => o === 'O' ? 'In ' : 'in ').replace(/\b(the|of|on|in|at)\s+(?=[,.;:]|$)/gi, '').replace(/\s+([,.;:])/g, '$1').replace(/,\s*,/g, ',').trim();
}
/** A drifted detail as the narrator is told it: "servant" held only as worker, "Saturday" as Friday, "27" forgotten,
 *  "drained" in other words, "servant" as another worker (the narrator chooses which). */
export function toldPhrase(h) {
    const w = `"${h.word}"`;
    if (h.how.startsWith('held only as') || /^as (another|other) /.test(h.how) && h.how !== 'as another word for the same')
        return `${w} ${h.how}`;
    if (/forgotten$/.test(h.how))
        return `${w} forgotten`;
    if (h.how === 'left out' || h.how === 'in other words')
        return `${w} ${h.how}`;
    return `${w} as ${h.as}`;
}
