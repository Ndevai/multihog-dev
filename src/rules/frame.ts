// Tool calls written by code from the player's message (docs/progress.md entry 40): where the words give every argument a
// tool requires, code writes the call and the planner model is asked only for the tools left open. The verb, the person
// spoken to, the words said, the distance walked, the time waited and the thing handed over are read here; what only the
// scene gives (how far, how loud the room, how hard a climb) stays with the planner.
import { distanceIn, legsIn, motionAt, stepsFromWords, undone } from './actions.js';
import { movesIn, senseConflict } from './router.js';
import { objectAfter } from './senses.js';
import { senseOdds, shareOf } from './sense-odds.js';
import { k } from './constants.js';
import { VERBNET } from './data/verbnet.js';
import { verbsAt, lemmas, creatureAfter, LOOK_VERBS, BLOW_VERBS, KNOWN_VERBS } from './verbs.js';
import { GIVEN_NAMES } from './data/given-names.js';
import { wordSex } from './census.js';
import { peopleGroup } from './nouns.js';
import { isWord } from './lexicon.js';
import { lightReading, phrasesAfter, sayLight, tokens, antecedent, COMPLEX_TO, COMPLEX_BARE, OBLIQUE_CONTROL, PASSIVE_AUX, ENTAILING_COMPLEX, noun, pluralNoun, canonical, subjectAfterFront, vocativeImperative } from './grammar.js';
import { QUOTED, OPENS, CLOSES, quotedWords } from './quotes.js';

export type Call = { tool: string; args: Record<string, unknown> };
const PRONOUN = /^(?:him|her|them|it)$/i;
// A person named after a verb or preposition: "the innkeeper", "Will", "the old man".
// A title belongs to the name it leads ("Mr. Abbott", "Monsieur Dufour", "Senhor Abreu"); its full stop ends no sentence.
export const TITLE = String.raw`(?:Mr|Mrs|Ms|Miss|Dr|Mister|Master|Mistress|Madam|Madame|Mme|Mademoiselle|Monsieur|M|Herr|Frau|Fräulein|Senhor|Senhora|Señor|Señora|Signor|Signora|Don|Dona|Doña|Sir|Lady|Lord|Captain|Father|Sister|Brother|Mother)\.?`;
const PERSON = String.raw`((?:the |an? )?(?:[a-z]+ ){0,2}?[a-z]+|(?:${TITLE} )?[A-Z][a-z]+(?: [A-Z][a-z]+)?)`;
const ROLE = /^(?:the |an? )?(?:[a-z]+ ){0,2}[a-z]+$/i;

/** The people the message names before position i, in order: a phrase after a word that takes a person (to, at, with,
 *  tell, ask, give…), a title with its name, or a capitalized name inside a sentence. */
const STOP = /\s+(?:and|for|what|that|to|then|with|about|is|are|was|were|if|who|on|in|at|by|near)\b.*$/;
function namedBefore(text: string, before: number): { at: number; p: string }[] {
    const head = text.slice(0, before), found: { at: number; p: string }[] = [];
    // The phrase's second word is read ahead, not taken, so a word that takes a person there starts the next phrase ("at the bar
    // with my brother").
    for (const m of head.matchAll(/\b(?:to|at|with|from|ask|asks|asked|tell|tells|told|greet|greets|greeted|give|gives|gave)\s+((?:the\s+)?[a-z]+)(?=(\s+[a-z]+)?)/g)) {
        // The phrase names one when its words name a person or an animal (verbs.ts creatureAfter: "to the guard", "with a monk";
        // not "with a lantern", "at the bar"), and is not a pronoun, which points back to one named before (him, her). Named
        // again, one met as "a monk" is "the monk" (CGEL ch. 5 §6.1 [6iii], p. 370).
        const p = (m[1] + (m[2] ?? '')).replace(STOP, '').replace(/^an?\s+/, 'the ');
        if (creatureAfter(p.split(' '), text) && !/\b(?:me|you|him|her|them|us|it|myself|yourself|himself|herself|ourselves|themselves)$/.test(p))
            found.push({ at: m.index!, p: /^(?:the|my|your|his|her|our|their)\s/.test(p) ? p : `the ${p}` });
    }
    for (const m of head.matchAll(new RegExp(String.raw`\b(${TITLE}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)`, 'g'))) found.push({ at: m.index!, p: m[1].replace(/\s+/g, ' ') });
    const bare = head.replace(new RegExp(String.raw`\b${TITLE}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?`, 'g'), x => ' '.repeat(x.length));
    for (const m of bare.matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]+)\b/g)) if (!/^(?:I|The|A|An|My)$/.test(m[1])) found.push({ at: m.index!, p: m[1] });
    // A capitalised word opening a sentence is a name when it is a given name or no common word ("Tom punches me.").
    for (const m of bare.matchAll(/(?:[.!?]\s+|^)\b([A-Z][a-z]+)\b/g)) if (GIVEN_NAMES[m[1]!.toLowerCase()] != null || !isWord(m[1]!)) found.push({ at: m.index! + m[0].length - m[1]!.length, p: m[1]! });
    // Any noun phrase of one person, wherever it stands (CGEL ch. 5 §6.1 [6iii], p. 370: "the first sentence introduces a
    // particular cat into the discourse, so the referent of the cat in the second is identifiable by virtue of this prior
    // mention"): "A man walks in. I punch him." — him is the man. Its head is the phrase's last word, a noun whose first
    // WordNet sense is a person, in the singular.
    // The head is the last of the person nouns that follow the determiner ("the drunk sailor", "a man walks in": man; up to three
    // words, which is where the verb after them stops).
    const toks = tokens(head.replace(QUOTED, q => ' '.repeat(q.length)));
    const isPerson = (w: string | undefined) => !!w && /^[a-z]+$/.test(w) && noun(w)?.kinds[0] === 'p';
    for (let k = 0; k < toks.length; k++) {
        if (!/^(?:the|a|an|this|that)$/i.test(toks[k]!.t)) continue;
        let e = k + 1, h = -1;
        for (; e <= k + 3 && /^[a-z]+$/.test(toks[e]?.t ?? ''); e++) { if (isPerson(toks[e]!.t)) h = e; else if (h > 0) break; }
        const w = toks[h]?.t;
        if (h < 0 || !w || pluralNoun(w) || found.some(f => f.p.split(' ').at(-1) === w)) continue;
        found.push({ at: toks[k]!.at, p: `the ${toks.slice(k + 1, h + 1).map(x => x.t).join(' ')}` });
    }
    return found.sort((x, y) => x.at - y.at);
}
/** Who "him" or "her" at position i is (grammar.ts antecedent: CGEL ch. 17 §3.1 and agreement): the one person named before it
 *  whose sex fits, not the subject of the pronoun's own clause, nor the player in a line written in the first person; null
 *  when none or more than one fits, for the scene to settle. */
function personFor(pron: string, text: string, at: number, player: string): string | null {
    const sexOf = (p: string) => { const m = new RegExp(String.raw`^(?:(${TITLE})\s+)?(?:the\s+)?([A-Za-z]+)`).exec(p); return m ? nameSex(m[2]!.replace(/^./, c => c.toUpperCase()), m[1]?.replace(/\.$/, '')) ?? wordSex(p.toLowerCase()) : null; };
    const named = namedBefore(text, at).map(n => ({ name: n.p, at: n.at, sex: player.split(/\s+/).includes(n.p) ? PLAYER_SEX : sexOf(n.p) }));
    const clause = text.slice(0, at).split(/[.!?;]|\b(?:and|but|then|while|when|who)\b/).pop() ?? '';
    const subject = new RegExp(String.raw`^\s*(?:${TITLE}\s+)?([A-Z][a-z]+)`).exec(clause)?.[1];
    const firstPerson = /\b(?:I|me|my|we|us|our)\b/.test(text.replace(QUOTED, ' '));
    return antecedent(named, pron, [...subject ? [subject] : [], ...firstPerson ? player.split(/\s+/) : []]);
}
const clean = (p: string) => p.replace(/^(?:an? )/i, 'the ').trim();

// Who acts at a position in the line: the subject of its clause, the first word before the verb (adverbs aside); a clause
// without one ("I walk to Tom and punch him") takes the last clause's; a sentence without one ("*punches the guard*") is the
// player's. The player is "I", "we", "my" or the character's own name; any other subject ("Tom punches Mara", "who walks
// 10 m") is someone else, whose act the planner writes from the scene.
const JOIN = new Set(['and', 'then', 'but', 'as', 'while', 'whilst', 'when', 'because', 'so', 'until', 'before', 'after', 'who', 'which', 'that', 'if', 'though', 'although', 'or', 'nor', 'once', 'since', 'whereupon']);
const SUBORDINATE = new Set(['as', 'while', 'whilst', 'when', 'because', 'until', 'before', 'after', 'who', 'which', 'that', 'if', 'though', 'although', 'once', 'since', 'whereupon']);
const TITLE_WORD = new RegExp(String.raw`^${TITLE.replace(/\\\.\?$/, '')}$`);
const ADVERB = /^(?:then|also|just|still|again|now|soon|suddenly|finally|instead|almost|already)$|ly$/i;
const isVerb = (w: string) => lemmas(w.toLowerCase()).some(v => !!VERBNET[v]);
/** A verb in its plain form (the imperative's, CGEL ch. 10 §9.2): a VerbNet lemma itself. */
const plainVerb = (w: string) => !!VERBNET[w.toLowerCase()];
/** A capitalised word that is a name: a given name, or no common word (as namedBefore reads one opening a sentence). */
const nameLike = (w: string) => GIVEN_NAMES[w.toLowerCase()] != null || !isWord(w);
// The sex a name in the line gives: its title (Mr, Mrs, Senhora…), else the share of girls among US births given that first
// name (Social Security Administration, 1880–2008: 90 % or more a woman's, 10 % or less a man's), else a word that names it
// (the maid, the landlord); null when none does.
const MALE_TITLE = /^(?:Mr|Mister|Master|Sir|Lord|Monsieur|M|Herr|Senhor|Señor|Signor|Don|Father|Brother|Captain)$/, FEMALE_TITLE = /^(?:Mrs|Ms|Miss|Madam|Madame|Mme|Mademoiselle|Mistress|Lady|Frau|Fräulein|Senhora|Señora|Signora|Dona|Doña|Sister|Mother)$/;
export function nameSex(name: string, title?: string): string | null {
    if (title && MALE_TITLE.test(title)) return 'male';
    if (title && FEMALE_TITLE.test(title)) return 'female';
    const share = GIVEN_NAMES[name.toLowerCase()];
    return share == null ? wordSex(name) : share >= 0.9 ? 'female' : share <= 0.1 ? 'male' : null;
}
// "He" or "she" as a subject: in a line written in the third person (no I, me, my or we outside quotes), the last name before
// it whose sex fits it, the player's character among them, or, with none, the player's character when the pronoun fits their
// sex ("She walks to the door"); in a line written in the first person, someone else.
let PLAYER_SEX: string | null = null;
function pronounIsPlayer(pron: string, plain: string, at: number, player: string): boolean {
    if (/\b(?:I|me|my|mine|myself|we|us|our|ours|ourselves)\b/.test(plain)) return false;
    const want = /^she/i.test(pron) ? 'female' : 'male', mine = new Set(player.split(/\s+/));
    const fits = (sex: string | null) => !sex || sex === want;
    let found: boolean | null = null;
    for (const m of plain.slice(0, at).matchAll(/(?:\b([A-Z][a-z]+)\.?\s+)?\b([A-Z][a-z]+)\b/g)) {
        const title = m[1] && TITLE_WORD.test(m[1]) ? m[1] : undefined, name = m[2]!, startsSentence = new RegExp(`(?:^|[.!?]${CLOSES}?\\s+)$`).test(plain.slice(0, m.index! + (m[0].length - name.length)));
        // A capitalised word opening a sentence is a name only when it is no common word ("Then", "The"; "Mara" is a name).
        if (/^(?:He|She|They|It|I|We|You)$/.test(name) || (startsSentence && !title && isWord(name))) continue;
        const own = mine.has(name);
        if (fits(own ? PLAYER_SEX : nameSex(name, title))) found = own;
    }
    return found ?? fits(PLAYER_SEX);
}
// An act the line says is not done (actions.ts undone).
export { undone };
/** The player's own act at a position, said as done. */
const own = (text: string, at: number, player: string) => byPlayer(text, at, player) && !undone(text, at);
/** A passive verb at a position (CGEL ch. 16 §10, pp. 1427–1430: be or get and a past participle; the subject undergoes the
 *  act, the agent is the complement of by): its agent and its subject, or null for an active verb. A participle after 's is
 *  passive only with a by phrase ("Tom's hit by me"; "He's walked home" is the perfect). */
const ADVERB_IN = /^(?:not|never|also|just|then|again|suddenly|almost|nearly|\w+ly)$/i;
function passiveAt(text: string, at: number): { agent: string | null; subject: string | null } | null {
    const plain = text.replace(QUOTED, q => ','.padEnd(q.length)), toks = [...plain.matchAll(/[A-Za-z'’]+|[,.;:!?]/g)].map(t => t[0]);
    const offs = [...plain.matchAll(/[A-Za-z'’]+|[,.;:!?]/g)].map(t => t.index!);
    const v = offs.findIndex(o => o >= at); if (v < 1) return null;
    const w = toks[v]!.toLowerCase();
    if (/(?:ing|s)$/.test(w) || !isVerb(w)) return null;
    let k = v - 1; while (k > 0 && ADVERB_IN.test(toks[k]!) && !PASSIVE_AUX.test(toks[k]!)) k--;
    const aux = toks[k] ?? '', contracted = /['’](?:m|s|re)$/i.test(aux);
    if (!PASSIVE_AUX.test(aux) && !contracted) return null;
    let agent: string | null = null;
    for (let j = v + 1; j < Math.min(toks.length, v + 6) && !/^[,.;:!?]$/.test(toks[j]!); j++) if (toks[j]!.toLowerCase() === 'by') { agent = /^(?:the|a|an)$/i.test(toks[j + 1] ?? '') ? `${toks[j + 1]} ${toks[j + 2] ?? ''}`.trim() : toks[j + 1] ?? null; break; }
    if (/['’]s$/i.test(aux) && !agent) return null;
    const subject = contracted ? aux.replace(/['’](?:m|s|re)$/i, '') : /^(?:the|a|an)$/i.test(toks[k - 2] ?? '') ? `${toks[k - 2]} ${toks[k - 1]}` : toks[k - 1] ?? null;
    return { agent, subject: subject && /^[A-Za-z]/.test(subject) ? subject : null };
}
export function byPlayer(text: string, at: number, player: string): boolean {
    if (at < 0) return true;
    const plain = text.replace(QUOTED, q => ','.padEnd(q.length)), toks = [...plain.matchAll(/[A-Za-z'’]+|[,.;:!?]/g)];
    let v = toks.findIndex(t => t.index! >= at); if (v < 0) v = toks.length;
    // A passive verb is its agent's act ("I am hit by Tom" is Tom's; "Tom is hit by me" mine); with none named, not the player's.
    const pas = passiveAt(text, at);
    if (pas) return !!pas.agent && (/^(?:me|us)$/i.test(pas.agent) || player.toLowerCase().split(/\s+/).includes(pas.agent.toLowerCase()));
    // The sentence: back to the last full stop that ends one (not a title's: "Mr. Abbott").
    let start = 0;
    for (let i = v - 1; i >= 0; i--) if (/^[.!?;]$/.test(toks[i]![0]) && !(toks[i]![0] === '.' && TITLE_WORD.test(toks[i - 1]?.[0] ?? ''))) { start = i + 1; break; }
    // The understood subject of a non-finite clause (CGEL ch. 14 §§1.7, 3, 5; grammar.ts): in the complex catenative
    // construction it is the NP between the verbs ("I tell Will to wait an hour", "I watch Tom climb the wall", "I make Tom
    // walk", "I rely on Tom to keep watch"), the player's own act only when that NP is "me" or their name; "promise" keeps
    // its subject ("I promise Tom to wait"). With no NP between, the subject's ("I want to wait").
    const isTo = toks[v - 1]?.[0].toLowerCase() === 'to', mine = (obj: string[]) => obj.some(o => o === 'me' || o === 'us' || player.toLowerCase().split(/\s+/).includes(o));
    const np = (obj: string[]) => obj.length >= 1 && obj.length <= 4 && obj.every(o => /^[a-z'’]+$/i.test(o) && !JOIN.has(o.toLowerCase())) && (/^(?:me|him|her|them|us|you|it|the|a|an|this|that|my|his|their|our|your)$/i.test(obj[0]!) || /^[A-Z]/.test(obj[0]!)) && !/^(?:the|a|an|this|that|my|his|their|our|your|its)$/i.test(obj.at(-1)!);
    for (let k = v - (isTo ? 3 : 2); k >= start && k >= v - 8 && !/^[,.;:!?]$/.test(toks[k]![0]); k--) {
        const ls = lemmas(toks[k]![0].toLowerCase()), obj = toks.slice(k + 1, isTo ? v - 1 : v).map(t => t[0]);
        const prep = ls.map(x => OBLIQUE_CONTROL[x]).find(Boolean);
        if (isTo && prep && obj[0]?.toLowerCase() === prep && np(obj.slice(1))) return mine(obj.slice(1).map(o => o.toLowerCase()));
        // The NP's act is done only after a verb that says it is ("I make Tom walk", "Tom makes me walk"); wanting, telling or
        // asking someone to act does not ("Tom wants me to walk to the door"; grammar.ts ENTAILING_COMPLEX).
        if ((isTo ? ls.some(x => COMPLEX_TO.has(x)) : ls.some(x => COMPLEX_BARE.has(x))) && np(obj)) return mine(obj.map(o => o.toLowerCase())) && ls.some(x => ENTAILING_COMPLEX.has(x));
        // After a verb with two objects ("I offer the guard two silver coins to look the other way", "I pay him a shilling to
        // wait"), the infinitival is a purpose adjunct whose doer the grammar leaves to the meaning (CGEL ch. 14 §4.4, and [17]
        // of §5.3: "They paid her $100 to dance naked" against "… to see her dance naked"): no act of the player's for code
        // to write. The verbs that take two objects here [ASSUMED list]: give, offer, hand, pass, send, pay, lend, bring, show,
        // sell, throw, promise.
        if (isTo && ls.some(x => /^(?:give|offer|hand|pass|send|pay|lend|bring|show|sell|throw|promise)$/.test(x)) && obj.length >= 2) return false;
    }
    // Clauses, each with the word that opens it: a subordinate clause ("that the ship is leaking", "who walks") lends no subject
    // to a clause joined after it ("… and hand him the log" is the teller's).
    const clauses: string[][] = [[]], opener: string[] = [''], where = new Map<string[], number[]>([[clauses[0]!, []]]);
    for (let i = start; i < v; i++) {
        const w = toks[i]![0];
        if (w === '.') continue;
        // "Mara and Tom walk": two names joined before a verb are one subject.
        if (w.toLowerCase() === 'and' && clauses.at(-1)!.length && clauses.at(-1)!.every(x => /^[A-Z]/.test(x) && !isVerb(x) || /^(?:I|we|he|she)$/i.test(x)) && /^[A-Z]|^(?:I|me)$/.test(toks[i + 1]?.[0] ?? '')) { clauses.at(-1)!.push(w); where.get(clauses.at(-1)!)!.push(toks[i]!.index!); continue; }
        if (/^[,:]$/.test(w) || JOIN.has(w.toLowerCase())) { const c = /^(?:who|which|that)$/i.test(w) ? [w] : []; clauses.push(c); where.set(c, c.length ? [toks[i]!.index!] : []); opener.push(w.toLowerCase()); continue; }
        clauses.at(-1)!.push(w); where.get(clauses.at(-1)!)!.push(toks[i]!.index!);
    }
    const names = new Set(player.toLowerCase().split(/\s+/));
    for (let c = clauses.length - 1; c >= 0; c--) {
        // The subject stands just before its verb; an adjunct in front position comes before it ("Today I walk", "In the
        // morning I punch Tom": grammar.ts subjectAfterFront, CGEL ch. 4 §3.1, ch. 8 §20.1).
        const all0 = clauses[c]!.filter(w => !ADVERB.test(w)), front = subjectAfterFront(all0, c === clauses.length - 1 ? toks[v]?.[0] : undefined, isVerb);
        const all = front > 0 ? all0.slice(front) : all0, words = TITLE_WORD.test(all[0] ?? '') && all.length > 1 ? all.slice(1) : all;
        if (!words.length || (c < clauses.length - 1 && SUBORDINATE.has(opener[c]!))) continue;
        const first = words[0]!, next = words[1] ?? (c === clauses.length - 1 ? toks[v]?.[0] : undefined);
        // A verb opening its clause has no subject ("Walk to the door and knock"), unless another verb follows ("Will gives").
        if (isVerb(first) && !(next && isVerb(next) && /^[A-Z]/.test(first))) { if (c === clauses.length - 1) return true; continue; }
        // A compound subject ("Mara and Tom") holds the player when any of its names is theirs.
        if (words.includes('and') && words.slice(0, words.indexOf('and') + 2).some(x => names.has(x.toLowerCase()) || /^(?:i|we)$/i.test(x))) return true;
        const s = first.toLowerCase().replace(/['’](?:s|ll|d)$/, '');
        if (s === 'he' || s === 'she') return pronounIsPlayer(s, plain, where.get(clauses[c]!)![clauses[c]!.indexOf(first)] ?? at, player);
        return ['i', 'we', 'my', "i'm", "i'll", "we're", "we'll"].includes(s) || names.has(s);
    }
    return true;
}

/** Communicate: speaker the player, listener the person spoken to, the words said, how loud the verb says. */
function speech(text: string, player: string): Call | null {
    // A directive to the person a vocative names, said without quotes ("Tom, walk to the door!"), is speech to them.
    for (const m of text.matchAll(new RegExp(`(?:^|[.!?]${CLOSES}?\\s+)(?=\\S)`, 'g'))) {
        const voc = vocativeImperative(text.slice(m.index! + m[0].length), plainVerb, nameLike);
        if (voc && !player.split(/\s+/).includes(voc.listener) && !OPENS.test(text)) return placed(m.index! + m[0].length, { tool: 'Communicate', args: { speaker: player, listener: nameLike(voc.listener.split(/\s+/)[0]!) ? voc.listener : `the ${voc.listener.replace(/^(?:the|my)\s+/i, '').toLowerCase()}`, means: 'speech', effort: 'normal', message: voc.message } });
    }
    const quoted = quotedWords(text);
    const verb = text.match(/\b(whisper|murmur|mutter|say|said|tell|told|ask|asked|call|called|shout|shouted|yell|yelled|scream|screamed|bellow|bellowed|cry|cried|greet|greeted|reply|replied|answer|answered|talk|talked|speak|spoke|chat|chatted|beg|begged|plead|pleaded|implore|implored|urge|urged|promise|promised|thank|thanked|warn|warned|order|ordered|command|commanded)s?\b/i);
    if (!verb && !quoted) return null;
    if (verb && !own(text, verb.index!, player)) return null;
    const at = verb?.index ?? 0, rest = text.slice(at + (verb?.[0].length ?? 0));
    let listener = rest.match(new RegExp(String.raw`^\s+(?:out\s+)?(?:to|at|with)\s+${PERSON}`, 'i'))?.[1]
        ?? (/^(?:tell|told|ask|asked|greet|greeted|answer|answered|beg|begged|implore|implored|urge|urged|promise|promised|thank|thanked|warn|warned|order|ordered|command|commanded)/i.test(verb?.[1] ?? '') ? rest.match(new RegExp(String.raw`^\s+${PERSON}`))?.[1] : undefined)
        ?? text.match(new RegExp(String.raw`\b(?:to|at)\s+${PERSON}\s*[.!?]?\s*$`))?.[1];
    if (listener && PRONOUN.test(listener.split(' ').pop()!)) listener = personFor(listener.split(' ').pop()!, text, at, player) ?? undefined;
    // The one spoken to is a noun phrase whose head may follow up to two modifiers ("the old blind beggar"): of the words after
    // the article, up to three and none a preposition or a conjunction, the run that ends at the last one naming a person, an
    // animal or a group of people (the head ends the NP; "blind" alone names the blind). PERSON's own match stops at the
    // first word ("the old").
    if (listener && /^(?:the |an? )?[a-z]+$/.test(listener)) {
        const art = /^(?:the |an? )?/.exec(listener)![0], from = rest.indexOf(listener) + art.length;
        const words = (rest.slice(from).match(/^[a-z]+(?: [a-z]+){0,2}/)?.[0].split(' ') ?? []);
        const stop = words.findIndex(w => /^(?:to|and|or|nor|but|for|about|what|that|who|which|with|at|in|on|of|from|by|then)$/.test(w));
        const run = stop >= 0 ? words.slice(0, stop) : words;
        const k = run.map(w => creatureAfter([w], text) || peopleGroup(w)).lastIndexOf(true);
        if (k >= 0) listener = art + run.slice(0, k + 1).join(' ');
    }
    if (!listener || !(ROLE.test(listener) || new RegExp(String.raw`^(?:${TITLE} )?[A-Z][a-z]+(?: [A-Z][a-z]+)?$`).test(listener))) return null;
    // One spoken to is a person or an animal (verbs.ts creatureAfter): "the truth", "the top of my lungs", "for directions" or
    // the verb of an infinitive ("give the order to fire") is no listener.
    if (/^[a-z]/.test(listener) && !creatureAfter(listener.split(' '), text) && !peopleGroup(listener.split(' ').pop()!)) return null;
    listener = listener.split(/ (?:for|about|what|that|to|and)\b/)[0];
    const v = (verb?.[1] ?? '').toLowerCase();
    const effort = /^(whisper|murmur|mutter)/.test(v) ? 'whisper' : /^(shout|yell|scream|bellow)/.test(v) ? 'shout' : /^(call|cr)/.test(v) ? 'loud' : 'normal';
    const message0 = quoted ?? rest.replace(new RegExp(String.raw`^\s+(?:out\s+)?(?:to|at|with)?\s*(?:${listener.replace(/^the /, '(?:the )?')}|him|her|them)\b`, 'i'), '').replace(/^[\s,]+|[.!?]+$/g, '').trim();
    // A place phrase after the listener is where, not what ("call out to Tom across the square"); so are a manner ("with all my
    // might") and a topic ("about my plan"): the words said are the planner's to give.
    const message = !quoted && /^(?:with|without|about|across|through|over|from|under|behind|in|into|toward|towards|down|up|along|near|beside|outside|inside|at|on|by|past|around)\b/i.test(message0) ? '' : message0;
    // The words end where the next action begins ("ask the costermonger for apples and pay him").
    // So do they where a clause with its own pronoun subject is joined on after a comma ("ask Tom for the key, and he gives it to
    // me"); a name after "and" may be part of the words ("tell Will that Tom and Ann left").
    const said = message.replace(/,?\s+(?:and|then)\s+(?:then\s+)?([a-z]+)\b.*$/, (all, w: string) => VERBNET[w] || VERBNET[w.replace(/e?s$/, '')] ? '' : all)
        .replace(/,\s+(?:and|then|but)\s+(?:then\s+)?(?:he|she|they|we)\s+([a-z]+)\b.*$/, (all: string, w: string) => lemmas(w).some(v => VERBNET[v]) ? '' : all);
    return placed(verb?.index ?? text.search(OPENS), { tool: 'Communicate', args: { speaker: player, listener: /^[A-Z]/.test(listener) ? listener : clean(listener), means: 'speech', effort, ...said ? { message: said } : {} } });
}

/** Act: the player's motion in their own words, with the distance the words give. A walk the words give no distance for
 *  is left to the planner, which reads it from the scene. */
function motion(text: string, player: string): Call | null {
    // The move's verb, read outside quoted words.
    const plainText = text.replace(QUOTED, q => ' '.repeat(q.length)), at = motionAt(plainText);
    if (!movesIn(text) || at < 0 || !own(text, at, player)) return null;
    // The action in the player's words from its motion verb, as the Act tool takes it (actions.ts MOTION_START: "Today I walk
    // 10 m to the gate" is "walk 10 m to the gate", "I punch Tom. I walk 10 m to the door" is "walk 10 m to the door"),
    // without its markup (*…*, _…_), its quoted words or the sentences after it that make no move ("Hello there.").
    const sentences = plainText.slice(at).replace(/[*_]+/g, '').split(/(?<=[.!?])\s+/);
    const last = sentences.map(x => motionAt(x) >= 0).lastIndexOf(true);
    const action = sentences.slice(0, Math.max(last, 0) + 1).join(' ').replace(/\s+/g, ' ').trim(), legs = legsIn(action);
    const d = legs.length > 1 ? Math.round(legs.reduce((t, l) => t + l.distance_m, 0) * 10) / 10 : distanceIn(text);
    return 'steps' in stepsFromWords(action, player, d ?? undefined) ? placed(at, { tool: 'Act', args: { who: player, action, level: 'on the level, stairs or a change of posture', ...d ? { distance_m: d } : {} } }) : null;
}

/** PassTime: a wait the words time ("wait an hour", "sleep for eight hours", "rest twenty minutes"). */
const UNITS: Record<string, number> = { minute: 1, minutes: 1, hour: 60, hours: 60, day: 1440, days: 1440 };
const COUNT: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'half an': 0.5, 'a quarter of an': 0.25 };
function waiting(text: string, player: string): Call | null {
    // A posture held or a place kept for a timed while is a wait too ("I sit by the fire for an hour": a for-phrase gives the
    // duration of a state or an activity, CGEL ch. 3 §3.2.3, as for walkingFor below).
    const m = text.match(/\b(wait|waits|waited|sleep|sleeps|slept|rest|rests|rested|stay|stays|stayed|linger|lingers|lingered|sit|sits|sat|stand|stands|stood|lie|lies|lay|kneel|kneels|knelt|crouch|crouches|crouched|hide|hides|hid|remain|remains|remained)\b(?:\s+(?!for\b)[a-z']+){0,5}?\s+(?:for\s+)?(\d+(?:\.\d+)?|half an|a quarter of an|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty)\s+(minutes?|hours?|days?)\b/i);
    if (!m || !own(text, m.index!, player)) return null;
    const n = /\d/.test(m[2]) ? Number(m[2]) : COUNT[m[2].toLowerCase()];
    const minutes = Math.round(n * UNITS[m[3].toLowerCase()]);
    const sleeping = /^sle|^slept/i.test(m[1]);
    return minutes > 0 ? placed(m.index!, { tool: 'PassTime', args: { minutes, [sleeping ? 'sleeping' : 'resting']: [player] } }) : null;
}

/** PassTime with the player walking: a walk the words time and do not end ("I walk for an hour", "I walk along the river for
 *  an hour", "I run for ten minutes"). A for-phrase gives the duration of an activity; a goal or a distance makes the walk an
 *  accomplishment, which takes no for-phrase (CGEL ch. 3 §3.2.3 [18], p. 122: "He played tennis for an hour", "*He walked a
 *  mile for an hour"; ch. 8 §4.3 [21], p. 684: a goal bounds the walk, a path does not, "She walked through the forest for
 *  eight hours"). */
function walkingFor(text: string, player: string): Call | null {
    const m = text.match(/\b(walk|walks|walked|march|marches|marched|stroll|strolls|strolled|wander|wanders|wandered|roam|roams|roamed|hike|hikes|hiked|pace|paces|paced|run|runs|ran|jog|jogs|jogged)\b([^.!?;"“]*?)\bfor\s+(\d+(?:\.\d+)?|half an|a quarter of an|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty)\s+(minutes?|hours?|days?)\b/i);
    if (!m || !own(text, m.index!, player)) return null;
    if (distanceIn(m[2]!) != null || /\b(?:into|onto|home)\b|\bto\s+(?:the|a|an|my|his|her|their|our|[A-Z])/.test(m[2]!)) return null;
    const n = /\d/.test(m[3]!) ? Number(m[3]) : COUNT[m[3]!.toLowerCase()]!, minutes = Math.round(n * UNITS[m[4]!.toLowerCase()]!);
    return minutes > 0 ? placed(m.index!, { tool: 'PassTime', args: { minutes, walking: [{ who: player, ...(/^(?:run|ran|jog)/i.test(m[1]!) ? { running: true } : {}) }] } }) : null;
}

/** Transfer: "give Will one of the apples", "hand her the letter". Give is read by its construction (grammar.ts
 *  lightReading: CGEL ch. 4 §7): only its ordinary use hands a thing over ("give the guard a coin", "give Tom a slice of pie"),
 *  not its light use ("give Tom a hug", "give him a nod") nor a use that could be either ("give her a ring"), which the scene
 *  settles. Hand and pass are no light verbs: they always hand over. */
function handing(text: string, player: string): Call | null {
    const toks = tokens(text);
    for (let k = 0; k < toks.length; k++) {
        const w = toks[k]!.t.toLowerCase();
        if (!/^(?:give|gives|gave|giving|hand|hands|handed|handing|pass|passes|passed|passing)$/.test(w) || !own(text, toks[k]!.at, player)) continue;
        const after = toks.slice(k + 1).map(x => x.t);
        const r = /^g/.test(w) ? lightReading(w, after) : null, o = /^g/.test(w) ? r?.kind === 'ordinary' ? r.object : null : phrasesAfter(after, true);
        // The recipient: the indirect object ("give Tom the coin"), or the complement of to in the prepositional alternant ("give
        // the coin to Tom": grammar.ts phrasesAfter, CGEL ch. 4 §4.3 [7]).
        let to = o?.recipient ?? o?.to;
        if (!o || !to) continue;
        if (PRONOUN.test(to)) { const p = personFor(to, text, toks[k]!.at, player); if (!p) continue; to = p; }
        // "It" or "them" handed over is the thing named before it (thingFor); "this" or "that" points at what only the scene shows.
        let item = o.item, quantity = o.quantity;
        if (/^(?:this|that|these|those)$/i.test(item)) continue;
        if (/^(?:it|them)$/i.test(item)) { const t = thingFor(item, text, toks[k]!.at); if (!t) continue; ({ item, quantity } = t); }
        return placed(toks[k]!.at, { tool: 'Transfer', args: { item, quantity, from: player, to: /^(?:a|an)\s/i.test(to) ? clean(to) : to, how: 'given' } });
    }
    return null;
}
/** What "it" or "them" before position i names (CGEL ch. 5 §17.2.2, p. 488: it "for entities which are neither male nor
 *  female", animals among them — "Have you seen my diary? I had it a few minutes ago"): the one thing or animal the line names
 *  before it with a determiner, its head agreeing in number (them with a number: "two apples"); null when none or more than one
 *  does, for the scene to settle, as for him and her (grammar.ts antecedent). */
function thingFor(pron: string, text: string, at: number): { item: string; quantity: number } | null {
    const toks = tokens(text.slice(0, at).replace(QUOTED, q => ' '.repeat(q.length))).map(x => x.t), many = /^them$/i.test(pron);
    const found = new Map<string, number>();
    // A noun phrase after a verb, a preposition or a coordinator is an object or a complement, which the next preposition,
    // coordinator or stop ends (grammar.ts phrasesAfter); any other is a subject, which ends where its verb starts ("A coin
    // fell at my feet": the coin, no "coin fell"; CGEL ch. 4 §3.1).
    for (let k = 0; k < toks.length; k++) {
        if (!/^(?:the|a|an|my|his|her|their|our|your|this|that|these|those|some|one|two|three|four|five|six)$/i.test(toks[k]!)) continue;
        let o = phrasesAfter(toks.slice(k), false);
        if (o && !(k > 0 && (isVerb(toks[k - 1]!) || /^(?:up|down|out|off|on|over|in|at|from|with|into|onto|for|of|and|or)$/i.test(toks[k - 1]!)))) {
            const cut = o.item.split(' ').findIndex((w, i) => i > 0 && isVerb(w));
            if (cut > 0) o = phrasesAfter(toks.slice(k, k + 1 + cut), false);
        }
        const n = o ? noun(o.of?.head ?? o.head) : null;
        if (!o || !n || n.kinds[0] === 'p' || !/[cnq]/.test(n.kinds) || pluralNoun(o.of?.head ?? o.head) !== many) continue;
        if (many && !/^(?:two|three|four|five|six)$/i.test(o.det)) continue;
        found.set(o.item, o.quantity);
    }
    return found.size === 1 ? { item: [...found.keys()][0]!, quantity: [...found.values()][0]! } : null;
}

/** BodyStrike: the player's blow at a person the words name ("I punch the sailor in the jaw"): attacker the player, who
 *  the one struck, attack the verb's, part the words'. How far and how they stand stay with the scene. */
// The kind of blow and the part struck are the planner's, chosen by meaning from BodyStrike's lists.
function striking(text: string, player: string): Call | null {
    // A verb of blows where the line puts a verb (verbs.ts, from VerbNet's hitting, swatting, poking, attacking, killing and
    // cutting classes), then the person struck.
    // The one struck: a phrase with its article ("the sailor"), a name, or a pronoun; not a possessive, a number or a place
    // ("kick his knee", "knock three times on the door", "jump to the next roof").
    const after = new RegExp(String.raw`^\s+((?:the |an? |this |that )(?:[a-z]+ ){0,2}?[a-z]+|(?:${TITLE} )?[A-Z][a-z]+(?: [A-Z][a-z]+)?|him|her|them|it|myself|himself|herself)\b`);
    // A passive blow of the player's strikes its subject ("Tom is hit by me").
    for (const v of verbsAt(text, KNOWN_VERBS)) if ((BLOW_VERBS.has(v.verb) || v.verb === 'headbutt') && own(text, v.at, player)) { const p = passiveAt(text, v.at); if (p?.subject && !/^(?:I|me|we)$/i.test(p.subject)) return placed(v.at, { tool: 'BodyStrike', args: { attacker: player, who: /^[A-Z]/.test(p.subject) ? p.subject : clean(p.subject) } }); }
    // A reflexive object is the subject of its own verb (CGEL ch. 17 §3.1 [3i], p. 1484: "Ann blames herself"), so the player's
    // own blow with "myself", or with "himself" or "herself" in a line about the player's character, strikes the player.
    // A blow verb with another sense the object fits and that names another tool ("I charge the cook": attack, or bill him) is
    // no blow code can draft: the planner reads the sense from the scene (router.ts senseConflict, senses.ts). Nor is one with
    // two objects ("I cut the cook a slice of bread": VerbNet's NP V NP NP, the first object the one it is done for).
    // With another sense in the way, the scene's cues may still settle it (sense-odds.ts): a fight going on and a sword in hand
    // make "I charge the cook" the blow when its chance reaches senseDraftShare.
    const hit = verbsAt(text, KNOWN_VERBS).filter(v => (BLOW_VERBS.has(v.verb) || v.verb === 'headbutt') && own(text, v.at, player) && (creatureAfter(objectOf(v.after), text) || /^(?:myself|himself|herself)$/i.test(v.after[0] ?? '')) && (!senseConflict(v.verb, v.after, text, 'BodyStrike') || shareOf(senseOdds(v.verb, v.after, text) ?? [], 'BodyStrike') >= k('senseDraftShare')) && !(o => o !== 'none' && o.dative)(objectAfter(v.after, text))).map(v => ({ v, m: after.exec(text.slice(v.end))?.[1] })).find(x => x.m);
    if (!hit) return null;
    const m = hit.m!;
    if (/^(?:myself|himself|herself)$/i.test(m)) return placed(hit.v.at, { tool: 'BodyStrike', args: { attacker: player, who: player } });
    // "Tom punches me. I hit him back.": the pronoun's person by the grammar's rules (personFor), else the scene's.
    if (PRONOUN.test(m)) { const p = personFor(m, text, hit.v.end, player); return p ? placed(hit.v.at, { tool: 'BodyStrike', args: { attacker: player, who: p } }) : null; }
    const who = m.split(/ (?:in|on|with|across|and)\b/)[0];
    return placed(hit.v.at, { tool: 'BodyStrike', args: { attacker: player, who: /^[A-Z]/.test(who) ? who : clean(who) } });
}

/** Tools whose outcome turns on numbers only the scene gives (how far, how loud the room, how large the thing seen): code
 *  writes the words' part and the planner still answers for them; its call by the same person is completed from code's.
 *  The value is the argument naming that person. */
export const SCENE_TOOLS = new Map([['Communicate', 'speaker'], ['Listen', 'listener'], ['Look', 'viewer'], ['BodyStrike', 'attacker']]);
/** Listen and Look: the player's character listening or looking, at what the words name. */
function perceiving(text: string, player: string): Call[] {
    const out: Call[] = [];
    const ear = text.search(/\b(?:listen|listens|listened|listening|overhear|overhears|overheard|eavesdrop|eavesdrops|eavesdropped|hear|hears|heard)\b/i);
    if (ear >= 0 && own(text, ear, player) && !/\btell\b.*\bwhat I heard\b/i.test(text)) out.push(placed(ear, { tool: 'Listen', args: { listener: player } }));
    // Any verb of looking or searching where the line puts a verb (verbs.ts, from VerbNet: glimpse, observe, scan, stare…).
    const lv = verbsAt(text, KNOWN_VERBS).find(v => LOOK_VERBS.has(v.verb) && own(text, v.at, player));
    const look = lv ? text.slice(lv.end).match(/^\s*(?:(?:through|at|into|in|around|over|for|toward|towards|out of)\s+)?((?:the |a |an |my |his |her )?[a-z]+(?: (?!of\b)[a-z]+)?(?: of (?:the |a |an |my |his |her )?[a-z]+)?)?/i) : null;
    // A direction is no target ("look away", "look around"); a target ends before a verb ("see Tom enter the room").
    const target = look?.[1] && !/^(?:away|around|about|back|up|down|out|round|here|there|everywhere|ahead|behind|aside)$/i.test(look[1].split(' ')[0]!) && !JOIN.has(look[1].split(' ')[0]!.toLowerCase()) ? look[1].replace(/\s+(?:to|and|for|then|on|in|at|by|near|from|with|across|over)$/, '').replace(/^(\S+)\s+(\S+)$/, (all, a: string, b: string) => /^[A-Z]/.test(a) && isVerb(b) ? a : all) : null;
    // Coordinated noun phrases are one target ("I see Tom and Will": CGEL ch. 15 §1 [2i], p. 1275, "Kim and Pat" is an
    // NP-coordination, "functionally like an NP").
    const both = target ? new RegExp(String.raw`^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\s+and\s+((?:the\s+)?[A-Z]?[a-z]+)\b`).exec(text.slice(lv!.end).replace(/^\s*(?:(?:through|at|into|in|around|over|for|toward|towards|out of)\s+)?/i, '')) : null;
    const seen = both && (/^[A-Z]/.test(both[1]!) && /^[A-Z]/.test(target!) || /^the\s/.test(both[1]!) && /^the\s/i.test(target!)) ? `${target} and ${both[1]}` : target;
    // "Him" or "her" looked at is the person the grammar finds for it (personFor), else left to the scene ("I glare at him").
    const at = seen && PRONOUN.test(seen) ? personFor(seen, text, lv!.end, player) : seen;
    if (look) out.push(placed(lv!.at, { tool: 'Look', args: { viewer: player, ...at ? { target: at } : {} } }));
    return out;
}
/** The line without out-of-character asides: "(OOC: …)", "[OOC …]", "((OOC …))" and lines that open with "OOC:" are talk to
 *  the narrator about the game, no act in the story. */
/** Markdown emphasis is how a line is set, not its words ("I punch **Tom**", "*Tom walks in.*": in SillyTavern * and _
 *  mark actions and italics, prosody.ts): a run of one to three * or _ paired around words goes, a _ only at a word's edge,
 *  so snake_case stays (CommonMark Spec 0.31.2, §6.2, rules 1–4: "foo_bar_" is not emphasis); a lone * stays (2*3). */
// Runs of three, then two, then one: an emphasis inside another ("*I punch **Tom**.*") goes before the one around it, and a
// run's words neither start nor end with its own sign.
export const unEmphasis = (text: string) => [3, 2, 1].reduce((t, n) => t.replace(new RegExp(String.raw`(\*{${n}})(?=[^\s*])([^*\n]*?[^*\s])\1`, 'g'), '$2')
    .replace(new RegExp(String.raw`(?<![\p{L}\p{N}_])(_{${n}})(?=[^\s_])([^_\n]*?[^_\s])\1(?![\p{L}\p{N}_])`, 'gu'), '$2'), text);
export const inStory = (text: string) => unEmphasis(text).replace(/\(\(?\s*OOC\b[^)]*\)\)?|\[\s*OOC\b[^\]]*\]|^\s*OOC\s*:.*$/gim, ' ').replace(/[ \t]{2,}/g, ' ').trim();
/** The words of a verb's object: up to the next joining word, preposition or stop ("the eggs" in "beat the eggs and cook"). */
const objectOf = (after: string[]) => { const i = after.findIndex(w => /^(?:and|or|but|then|with|in|on|at|to|into|onto|for|from|by|across|over|under|until|while|as|so|[,.;:!?])$/.test(w)); return i < 0 ? after : after.slice(0, i); };
/** The calls code can write from this message, and the routed tools they settle (the planner skips those). */
export function framedCalls(text: string, player: string, sex: string | null = null): { calls: Call[]; covered: Set<string> } {
    PLAYER_SEX = sex;
    text = unEmphasis(text);
    // A cleft is read as its basic counterpart ("It is Tom that I hit" as "I hit Tom": grammar.ts canonical, CGEL ch. 16 §9),
    // and a light verb's act as its associated verb (grammar.ts sayLight: "I give Tom a kick" as "I kick Tom").
    const basic = canonical(text), said = sayLight(basic);
    const calls = [motion(said, player), speech(said, player), waiting(said, player), walkingFor(said, player), handing(basic, player), striking(said, player), ...perceiving(said, player)].filter((c): c is Call => !!c);
    // The acts in the order the line tells them: coordinated clauses that report occurrences give them in the order they happen
    // (CGEL ch. 15 §2.2.3, pp. 1299–1300: "He got up and had breakfast" is "He got up and then had breakfast"; across sentences
    // too). An act in a clause opened by "before" comes after its sentence's other acts, one opened by "after" before them.
    const key = (c: Call) => { const p = AT.get(c) ?? 0, head = said.slice(0, p), opener = /\b(before|after)\b[^.!?;,]*$/i.exec(head)?.[1]?.toLowerCase(); const end = said.slice(p).search(/[.!?;]/), start = Math.max(...['.', '!', '?', ';'].map(x => head.lastIndexOf(x))); return opener === 'before' ? (end < 0 ? said.length : p + end) + p / 1e6 : opener === 'after' ? start + p / 1e6 : p; };
    calls.sort((a, b) => key(a) - key(b));
    // A timed walk is the walk: the Act it routes is settled by the PassTime that walks the player.
    const walked = calls.some(c => c.tool === 'PassTime' && Array.isArray(c.args.walking));
    return { calls, covered: new Set([...calls.map(c => c.tool).filter(t => !SCENE_TOOLS.has(t)), ...walked ? ['Act'] : []]) };
}
/** Where in the line each drafted call's verb stands, for the order of the acts. */
const AT = new WeakMap<Call, number>();
const placed = (pos: number, c: Call): Call => { AT.set(c, pos); return c; };
/** The planner's calls with code's words filled in: a planner call of a scene tool by the same person takes code's arguments
 *  it left out and replaces code's call; code's call stands when the planner gave none (and runs only once complete). */
/** Whether a planner call is by the same person as code's draft of that scene tool. */
export const sameSubject = (c: Call, p: Call) => c.tool === p.tool && SCENE_TOOLS.has(c.tool) && (p.args[SCENE_TOOLS.get(c.tool)!] ?? c.args[SCENE_TOOLS.get(c.tool)!]) === c.args[SCENE_TOOLS.get(c.tool)!];
export function mergeCalls(code: Call[], planned: Call[]): Call[] {
    const same = (c: Call, p: Call) => c.tool === p.tool && SCENE_TOOLS.has(c.tool) && (p.args[SCENE_TOOLS.get(c.tool)!] ?? c.args[SCENE_TOOLS.get(c.tool)!]) === c.args[SCENE_TOOLS.get(c.tool)!];
    const out = planned.map(p => { const c = code.find(x => same(x, p)); return c ? { tool: p.tool, args: { ...c.args, ...p.args } } : p; });
    return [...code.filter(c => !planned.some(p => same(c, p))), ...out];
}
/** The player's character: SillyTavern's persona name, else the cast line marked "(the player's character)". */
export function playerName(name1: unknown, cast: string): string | null {
    const fromCast = cast.match(/^\s*([A-Z][\w'-]*(?: [A-Z][\w'-]*)?)\s*\(the player's character\)/m)?.[1];
    return fromCast ?? (typeof name1 === 'string' && name1.trim() && name1 !== 'User' ? name1.trim() : null);
}
