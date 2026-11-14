// What the player meant (docs/progress.md entry 97). A player's line is the written form of something they have in mind,
// and a lossy one: typing adds noise, and a speaker leaves out what they take the listener to know already. A listener gets
// the meaning back by weighing what the speaker probably meant against how that meaning would have come out in words: the
// noisy channel (Shannon 1948), which sentence comprehension follows (Levy 2008, "A noisy-channel model of rational human
// sentence comprehension under uncertain input", EMNLP; Gibson, Bergen & Piantadosi 2013, PNAS 110:8051, "Rational
// integration of noisy evidence and prior semantic expectations in sentence interpretation"). This layer reads the line the
// same way, before the grammar reads it (grammar.ts, frame.ts), with what the scene gives as the prior:
//  - noise in the words: a typed form that is no word is the word one slip away that the scene makes likeliest; a hand-over
//    with its "to" dropped ("I give the coin Tom") is read with it;
//  - what was just done: "again", "once more", "do it again" is the player's last act; "the same to Will" that act done to
//    Will (CGEL ch. 17 §7.6);
//  - who "him" or "her" is: the person the speaker takes to be at the centre of attention (Gundel, Hedberg & Zacharski 1993,
//    the Givenness Hierarchy), weighed as Kehler and Rohde's Bayesian pronoun model does, P(referent | pronoun) ∝
//    P(pronoun | referent) · P(referent); "back" after a blow is the one who struck first ("in repayment or retaliation");
//  - what the player is after: a goal they stated stays in force until they state another (the intentionality dimension of
//    the situation model, Zwaan & Radvansky 1998; goals inferred from what a person says and does, Baker, Saxe & Tenenbaum
//    2009), and fills what a later line leaves out ("I search the desk" after "I'm looking for the key").
// Each change is shown back under the line (ui.ts), so a wrong reconstruction is corrected by the next line.
import { isWord } from './lexicon.js';
import { VERBNET } from './data/verbnet.js';
import { GIVEN_NAMES } from './data/given-names.js';
import { lemmas } from './verbs.js';
import { noun, phrasesAfter, tokens, PREPOSITION } from './grammar.js';
import { wordSex } from './census.js';
import { nameSex } from './frame.js';
import { def, k } from './constants.js';
import { QUOTED, insideQuote } from './quotes.js';

export type Call = { tool: string; args: Record<string, unknown> };
/** What the scene gives this layer: the player's character, the people in the scene with their sex where known, the
 *  narrator's last messages (latest last), the player's earlier lines (latest last) and their calls of the last turn. */
export interface Situation { player: string; people: { name: string; sex?: string | null }[]; narration: string[]; earlier: string[]; lastCalls: Call[] }
/** One thing read into the line: what was written, what it was read as, why, and how likely. */
export interface Change { from: string; to: string; why: string; p: number }
/** For a pronoun this layer leaves open: each person it may be, with the share of belief in them. */
export interface Open { pronoun: string; weights: Record<string, number> }
export interface Meant { text: string; changes: Change[]; open: Open[]; goal: string | null }

// ------------------------------------------------------------------------------------------------- noise in the words
def({ id: 'sceneWordShare', value: 0.5, unit: 'prior share of a player\'s content words that are words of the scene (its people and what the narrator named)', status: 'assumed', src: 'a judgement: the prior of the noisy channel (Gibson et al. 2013) is what fits the context; no measured share for roleplay lines was found', range: [0.2, 0.8], file: 'intent.ts' });
def({ id: 'readAsMeantAt', value: 0.5, unit: 'share of belief a reconstruction needs to be read into the line', status: 'assumed', src: 'as askBelowSafe (ask.ts): the likelier half is taken and shown back', range: [0.4, 0.7], file: 'intent.ts' });
const LEXICON_SIZE = 39952; // data/lexicon.ts
/** The words one slip away from a typed form (Damerau 1964, CACM 7:171: a deletion, an insertion, a substitution or a swap
 *  of two neighbours). Typists leave 1.167 % of characters wrong (Dhakal, Feit, Kristensson & Oulasvirta 2018, CHI,
 *  168,960 typists, mean uncorrected error rate), so a second slip in one word is about (n − 1) · 0.0117 / 2 as likely as a
 *  first (3 % for six letters): the forms two slips away are left out. */
function oneSlip(w: string): Set<string> {
    const out = new Set<string>(), abc = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i <= w.length; i++) {
        if (i < w.length) out.add(w.slice(0, i) + w.slice(i + 1));
        if (i < w.length - 1) out.add(w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2));
        for (const c of abc) { out.add(w.slice(0, i) + c + w.slice(i)); if (i < w.length) out.add(w.slice(0, i) + c + w.slice(i + 1)); }
    }
    out.delete(w);
    return out;
}
/** The words of the scene: its people's names and the content words of the narrator's last messages. */
function sceneWords(sit: Situation): Set<string> {
    const out = new Set<string>();
    for (const p of sit.people) for (const w of p.name.toLowerCase().split(/\s+/)) if (w !== 'the') out.add(w);
    for (const t of sit.narration) for (const m of t.toLowerCase().matchAll(/[a-z]{4,}/g)) if (isWord(m[0])) out.add(m[0]);
    return out;
}
/** A typed form that is no word, read as the word one slip away the scene makes likeliest: P(word | typed) ∝ P(typed |
 *  word) · P(word), with P(typed | word) the same for every word one slip away and P(word) the scene's share spread over its
 *  words, the rest over the lexicon. Only forms of four letters or more and in lower case: a capitalised form may be a name
 *  the story has not met. */
function respell(text: string, sit: Situation, changes: Change[]): string {
    const scene = sceneWords(sit), share = k('sceneWordShare');
    return text.replace(/\b[a-z]{4,}\b/g, (typed, at: number) => {
        // A word: in the lexicon, a form of a VerbNet verb, a word of the scene, or a prefix and a word ("rebuilt").
        const rest = /^(?:re|un|dis|mis|over|under|out|pre|de|co)([a-z]{3,})$/.exec(typed)?.[1];
        if (insideQuote(text, at) || isWord(typed) || lemmas(typed).some(v => VERBNET[v]) || scene.has(typed) || (rest && isWord(rest))) return typed;
        let cands = [...oneSlip(typed)].filter(w => w.length >= 3 && (isWord(w) || scene.has(w)));
        if (!cands.length) return typed;
        // The grammar is part of the prior (Levy 2008): before a determiner a noun phrase begins, which after an object
        // needs a preposition to govern it (CGEL ch. 7 §2: a preposition takes an NP complement), so where some of the
        // words one slip away are prepositions, those are the ones that make a sentence ("I attack Tom wiht my knife").
        const preps = cands.filter(w => PREPOSITION.test(w));
        if (preps.length && /^\s+(?:the|a|an|my|his|her|their|our|your|this|that|its)\b/i.test(text.slice(at + typed.length))) cands = preps;
        const prior = (w: string) => scene.has(w) ? share / scene.size : (1 - share) / LEXICON_SIZE;
        const total = cands.reduce((s, w) => s + prior(w), 0), best = cands.sort((a, b) => prior(b) - prior(a))[0]!, p = prior(best) / total;
        if (p < k('readAsMeantAt') || cands.filter(w => prior(w) === prior(best)).length > 1) return typed;
        changes.push({ from: typed, to: best, why: scene.has(best) ? 'one slip from a word of the scene' : 'one slip from the only word that near', p: Math.round(p * 100) / 100 });
        return best;
    });
}
/** A hand-over whose "to" was dropped: give, hand, pass, offer, throw, toss or send with a thing and then a person and no
 *  preposition between ("I give the coin Tom"). Read literally it gives Tom to the coin, which cannot happen; one deleted
 *  word away it is the prepositional alternant (CGEL ch. 4 §4.3 [7]). Gibson et al. 2013 found such one-word deletions read
 *  away most readily: with the double-object and to alternation, readers took the plausible sentence a word away about half
 *  the time even when the literal one was merely odd. */
function droppedTo(text: string, sit: Situation, changes: Change[]): string {
    const toks = tokens(text);
    for (let i = 0; i < toks.length; i++) {
        if (!/^(?:give|gives|gave|hand|hands|handed|pass|passes|passed|offer|offers|offered|throw|throws|threw|toss|tosses|tossed|send|sends|sent)$/i.test(toks[i]!.t)) continue;
        const after = toks.slice(i + 1).map(x => x.t), o = phrasesAfter(after, false);
        if (!o || !o.det || o.recipient || !/[cnq]/.test(noun(o.head)?.kinds ?? '') || noun(o.head)?.kinds[0] === 'p') continue;
        const next = toks[i + 1 + o.end];
        if (!next) continue;
        const person = /^(?:him|her|them|me|us)$/i.test(next.t) || sit.people.some(p => p.name === next.t) || (/^[A-Z][a-z]+$/.test(next.t) && (GIVEN_NAMES[next.t.toLowerCase()] != null || !isWord(next.t)));
        if (!person) continue;
        changes.push({ from: `${toks[i]!.t} ${after.slice(0, o.end).join(' ')} ${next.t}`, to: `${toks[i]!.t} ${after.slice(0, o.end).join(' ')} to ${next.t}`, why: 'a hand-over with its "to" left out', p: 0.99 });
        return text.slice(0, next.at) + 'to ' + text.slice(next.at);
    }
    return text;
}

// -------------------------------------------------------------------------------------------------- what was just done
/** "Again", "once more", "do it again", "the same again": the player's last act (an anaphoric VP of the general agentive
 *  verb do, CGEL ch. 17 §7.6, p. 1532: do with it, that or the same is "anaphoric VP"); "the same to Will", "do that to
 *  Will": that act with Will as the one it is done to ([51], p. 1532: "I hope they don't do that to me" is "question me").
 *  Only for a line with no verb of its own besides do. */
function lastAct(text: string, sit: Situation, changes: Change[]): string {
    const prev = sit.earlier.at(-1);
    if (!prev) return text;
    const t = text.trim().replace(/^\*|\*$/g, '');
    const again = /^(?:(?:and\s+)?(?:again|once more|one more time)|(?:i|we)\s+(?:do|repeat)\s+(?:it|that|the same(?: thing)?)(?:\s+(?:again|once more))?|the same(?: again)?)[.!]*$/i.test(t);
    const to = /^(?:(?:i|we)\s+do\s+)?(?:(?:the\s+)?same(?: thing)?|that|it)\s+(?:again\s+)?to\s+((?:the\s+)?[A-Za-z]+(?:\s+[A-Za-z]+)?)[.!]*$/i.exec(t);
    if (!again && !to) return text;
    let meant = prev.trim();
    if (to) {
        // The one the last act was done to, by the argument naming them in the last turn's calls.
        const was = sit.lastCalls.map(c => c.args.who ?? c.args.target ?? c.args.listener ?? c.args.to).find(x => typeof x === 'string' && x !== sit.player) as string | undefined;
        if (!was || !meant.includes(was.replace(/^the /, ''))) return text;
        const plain = was.replace(/^the /, '');
        meant = meant.replace(new RegExp(String.raw`\b(?:the\s+)?${plain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`), to[1]!);
    }
    changes.push({ from: t, to: meant, why: to ? 'the last act, done to another' : 'the last act, again', p: 0.95 });
    return meant;
}

// -------------------------------------------------------------------------------------------------- who "him" or "her" is
// Gundel, Hedberg & Zacharski 1993 (Language 69:274): an unstressed pronoun codes a referent "in focus", "not only in
// short-term memory, but … at the current center of attention" (of 215 tokens of it in their English sample, 214 were in
// focus). Which of the people in the scene is in focus is what the speaker's choice of a pronoun says, weighed as Kehler
// and Rohde's Bayesian model has it (Kehler, Kertz, Rohde & Elman 2008; Rohde & Kehler 2014): P(referent | pronoun) ∝
// P(pronoun | referent) · P(referent), where P(pronoun | referent) is how often a speaker uses a pronoun for that person
// and P(referent) how likely the speaker is to mention them next, taken as flat: in story continuations whose verbs favour
// neither, subject and object are mentioned next about equally often (Bader & Portele 2019, German: 18 % and 20 %)
// [ASSUMED for English roleplay lines].
def({ id: 'pronounForSubject', value: 0.69, unit: 'share of references to the subject of the last sentence that are pronouns, two people of one sex', status: 'sourced', src: 'Rosa & Arnold 2017, J Mem Lang 94, Experiment 2 (written story continuation, 20 English speakers, 425 references): references to a same-gender context sentence\'s subject were pronouns 69 % of the time, as Goal and as Source', range: [0.59, 0.83], file: 'intent.ts' });
def({ id: 'pronounForOther', value: 0.185, unit: 'share of references to a non-subject of the last sentence that are pronouns, two people of one sex', status: 'sourced', src: 'Rosa & Arnold 2017, Experiment 2: 18 % (Goal) and 19 % (Source) for a same-gender context sentence\'s non-subject', range: [0.1, 0.33], file: 'intent.ts' });
def({ id: 'pronounForUnfocused', value: 0.01, unit: 'share of references to a person outside the latest sentence that names one of them that are pronouns', status: 'assumed', src: 'Gundel, Hedberg & Zacharski 1993: of 215 tokens of "it" in their English sample, 214 had a referent in focus and one a referent only activated; taken as the odds of an unstressed pronoun for a person no longer in focus', range: [0.001, 0.05], file: 'intent.ts' });
const SUBJECT_VERB = String.raw`(?:\s+(?:then|also|just|suddenly|quickly|slowly|\w+ly))?\s+[a-z]+(?:s|ed)\b`;
/** The people a pronoun of that sex may be, each with P(pronoun | person): the subject of the latest sentence (of the
 *  narrator's last message or the player's line before the pronoun) that names one of them, or the others. */
function pronounWeights(pronoun: string, before: string, sit: Situation): Record<string, number> | null {
    const want = /^her$/i.test(pronoun) ? 'female' : 'male';
    const sexOf = (p: { name: string; sex?: string | null }) => p.sex ?? wordSex(p.name.toLowerCase());
    const fits = sit.people.filter(p => p.name !== sit.player && (!sexOf(p) || sexOf(p) === want));
    if (fits.length < 2) return null;
    const sentences = [...sit.narration.slice(-1), before].join(' ').replace(QUOTED, ' ').split(/(?<=[.!?])\s+/).filter(Boolean);
    const esc = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (let i = sentences.length - 1; i >= 0; i--) {
        const s = sentences[i]!, named = fits.filter(p => new RegExp(String.raw`\b${esc(p.name)}\b`, 'i').test(s));
        if (!named.length) continue;
        // The subject: the one named first in the sentence, before a finite verb ("Will glares at Tom").
        const subject = named.map(p => ({ p, at: s.search(new RegExp(String.raw`\b${esc(p.name)}\b`, 'i')) })).sort((a, b) => a.at - b.at)[0]!;
        const isSubject = new RegExp(String.raw`^(?:[^,;]*?\s)?${esc(subject.p.name)}${SUBJECT_VERB}`, 'i').test(s.slice(Math.max(0, subject.at - 40)));
        // Rosa & Arnold's setting: two people in the context sentence. One outside it is no longer in focus.
        return Object.fromEntries(fits.map(p => [p.name, !named.includes(p) ? k('pronounForUnfocused') : isSubject && p === subject.p ? k('pronounForSubject') : k('pronounForOther')]));
    }
    return Object.fromEntries(fits.map(p => [p.name, k('pronounForUnfocused')]));
}
/** "Back" after a verb with a person ("I hit him back"): "in repayment or retaliation" (Open English WordNet 2024, back,
 *  adverb: "he hit me and I hit him back"), so the person is the one who did that to the player last: in the narrator's last
 *  message, the subject of a sentence whose object is "you", "your" or the player's character. */
function returnedTo(sit: Situation): string | null {
    const me = String.raw`(?:you|your|yours|${sit.player.split(/\s+/).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`;
    const sentences = sit.narration.slice(-1).join(' ').replace(QUOTED, ' ').split(/(?<=[.!?])\s+/).reverse();
    for (const s of sentences) for (const p of sit.people) {
        if (p.name === sit.player) continue;
        if (new RegExp(String.raw`\b${p.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b(?:\s+\w+){0,2}?${SUBJECT_VERB}(?:\s+\w+){0,2}?\s+${me}\b`, 'i').test(s)) return p.name;
    }
    return null;
}
function pronouns(text: string, sit: Situation, changes: Change[], open: Open[]): string {
    return text.replace(/\b([a-z]+)\s+(?:(?:at|to|with|toward|towards|after)\s+)?(him|her)\b(\s+back\b)?/gi, (all, verb: string, pro: string, back: string | undefined, at: number) => {
        if (!lemmas(verb.toLowerCase()).some(v => VERBNET[v])) return all;
        const before = text.slice(0, at);
        // Named before it in the line, one whose sex fits the pronoun (or is not known): the frame reader settles it (frame.ts
        // personFor). A woman named before "him" leaves him open ("I nod to Ann and hit him back").
        const want = /^her$/i.test(pro) ? 'female' : 'male', sexOf = (p: { name: string; sex?: string | null }) => p.sex ?? wordSex(p.name.toLowerCase());
        if (sit.people.some(p => p.name !== sit.player && (!sexOf(p) || sexOf(p) === want) && new RegExp(String.raw`\b${p.name.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`, 'i').test(before))) return all;
        if (back) {
            const who = returnedTo(sit);
            if (who) { changes.push({ from: `${pro} back`, to: `${who} back`, why: `${who} did it to you last ("back": in return)`, p: 0.95 }); return all.replace(new RegExp(String.raw`\b${pro}\b`), who); }
        }
        const w = pronounWeights(pro, before, sit);
        if (w) open.push({ pronoun: pro.toLowerCase(), weights: w });
        return all;
    });
}

// --------------------------------------------------------------------------------------------------- what the player is after
/** The goal the player stated last: "I'm looking for the key", "I want to find the thief", "I need to reach the gate",
 *  "I search for the letter", the thing or person it is after. A later line stating another goal replaces it. */
export function statedGoal(earlier: string[]): string | null {
    for (const line of [...earlier].reverse()) {
        const plain = line.replace(QUOTED, ' ');
        const m = /\b(?:I|we)(?:'m|’m| am| are|'re)?\s+(?:still\s+)?(?:looking|searching|hunting)\s+for\s+((?:the|a|an|my|his|her|their|some)\s+[a-z]+(?:\s+[a-z]+)?|[A-Z][a-z]+)/.exec(plain)
            ?? /\b(?:I|we)\s+(?:want|need|have|mean|intend|plan|hope|try|am trying|'m trying)\s+to\s+(?:find|get|reach|catch|steal|take|buy|see|meet|speak to|talk to)\s+((?:the|a|an|my|his|her|their|some)\s+[a-z]+(?:\s+[a-z]+)?|[A-Z][a-z]+)/.exec(plain)
            ?? /\b(?:I|we)\s+(?:search|look|hunt)\s+(?:everywhere\s+|around\s+)?for\s+((?:the|a|an|my|his|her|their|some)\s+[a-z]+(?:\s+[a-z]+)?|[A-Z][a-z]+)/.exec(plain);
        if (m) return m[1]!.replace(/\s+(?:and|then|in|on|at|to|from)$/, '');
    }
    return null;
}
/** A search with no "for" while a goal is in force: what it is for is the goal ("I search the desk" → "for the key"). */
function forTheGoal(text: string, goal: string | null, changes: Change[]): string {
    if (!goal) return text;
    return text.replace(/\b(search|searches|searched|rummage through|rummages through|go through|goes through|look through|looks through|look in|looks in|check|checks|checked)\s+((?:the|a|an|my|his|her|their)\s+[a-z]+(?:\s+[a-z]+)?)(?!\s+for\b)(?=\s*(?:[.,;!?]|$))/i, (all, verb: string, place: string) => {
        changes.push({ from: `${verb} ${place}`, to: `${verb} ${place} for ${goal}`, why: `you said you were after ${goal}`, p: 0.9 });
        return `${verb} ${place} for ${goal}`;
    });
}

/** The people the narrator's messages name that the scene list may lack: a capitalised word that is a given name or no
 *  common word, wherever it stands (a sentence's first word included: "Tom shoves you"), as frame.ts reads names. */
function namedIn(sit: Situation): Situation['people'] {
    const have = new Set(sit.people.map(p => p.name)), out = [...sit.people];
    for (const t of sit.narration) for (const m of t.replace(QUOTED, ' ').matchAll(/\b([A-Z][a-z]+)\b/g)) {
        const n = m[1]!;
        if (have.has(n) || /^(?:I|The|A|An|My|You|Your|He|She|They|It|We|His|Her|Their|Its|Our|This|That|Then|There)$/.test(n) || !(GIVEN_NAMES[n.toLowerCase()] != null || !isWord(n))) continue;
        have.add(n); out.push({ name: n, sex: nameSex(n) });
    }
    return out;
}
/** The line as the player meant it: the words they slipped on respelt, a dropped "to" put back, "again" read as the last
 *  act, "him back" as the one who did it, a search's goal filled; the pronouns left open with their weights, for ask.ts to
 *  take or ask; and the goal in force, for the planner. */
export function understand(line: string, sit: Situation): Meant {
    const changes: Change[] = [], open: Open[] = [];
    sit = { ...sit, people: namedIn(sit) };
    let text = respell(line, sit, changes);
    text = lastAct(text, sit, changes);
    text = droppedTo(text, sit, changes);
    const goal = statedGoal(sit.earlier);
    text = forTheGoal(text, goal, changes);
    text = pronouns(text, sit, changes, open);
    return { text, changes, open, goal };
}
