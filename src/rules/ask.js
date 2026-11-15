// What the player's line leaves open, and whether to ask (src/index.ts shows the question as a popup). The prose stays the
// player's; a choice that changes the outcome is made exact. The decision follows the mixed-initiative rule (Horvitz 1999,
// CHI, "Principles of mixed-initiative user interfaces"): act on the likeliest reading when its probability passes a threshold
// that rises with the cost of a wrong act, ask when it does not. Readings are weighed as interactive-fiction parsers rank the
// objects a word may mean (Inform's "does the player mean" rules; Hugo gives the object last referred to +1): the person the
// player last acted on, the one the narrator named last, the one at the player's spot; a verb's senses by what the scene
// shows (someone fleeing; soldiers about). Who "him" or "her" is, the intent layer weighs by the Bayesian pronoun model
// (intent.ts: P(pronoun | person) for the one in focus) when the narrator's last message names the candidates. A reading taken without asking is shown back with the rest of the line's reading
// (reading.ts), so the player corrects it in the next line: implicit confirmation, the cheaper grounding (Clark & Brennan
// 1991); a question is explicit confirmation, kept for when a wrong guess would hurt someone.
// Asked, the options read alike (one form, no default) and come in a fresh order: how an option looks sways the pick
// (position and label bias, Zheng et al. 2024). Closing the popup is the way out: the player says it another way.
import { verbsAt, BEFORE, LOOK_VERBS, BLOW_VERBS, KNOWN_VERBS } from './verbs.js';
import { wordSex } from './census.js';
import { byPlayer } from './frame.js';
import { def, k } from './constants.js';
import { OPENS } from './quotes.js';
import { faithNeeds, faithOf } from './faith.js';
import { wordSlipLikelihood } from './keyboard.js';
def({ id: 'askBelowHarm', value: 0.9, unit: 'share the likeliest reading needs to be taken unasked, when a reading harms someone', status: 'assumed', src: 'a judgement in the mixed-initiative rule (Horvitz 1999 gives the form, no values)', range: [0.8, 0.97], file: 'ask.ts' });
def({ id: 'askBelowSafe', value: 0.5, unit: 'share the likeliest reading needs to be taken unasked, when none harms anyone', status: 'assumed', src: 'a judgement: the likelier half is taken and shown back', range: [0.4, 0.7], file: 'ask.ts' });
def({ id: 'weightLastTarget', value: 2, unit: 'weight added to the person the player acted on last turn', status: 'assumed', src: 'Hugo ranks the object last referred to +1; a judgement on the scale here', range: [1, 3], file: 'ask.ts' });
def({ id: 'weightNamedLast', value: 1, unit: 'weight added to a person the narrator\'s last message names', status: 'assumed', src: 'a judgement: the most recent mention is the likeliest referent', range: [0.5, 2], file: 'ask.ts' });
def({ id: 'weightSameSpot', value: 1, unit: 'weight added to a person at the player\'s spot', status: 'assumed', src: 'a judgement: a blow or a word reaches someone near', range: [0.5, 2], file: 'ask.ts' });
def({ id: 'weightSceneCue', value: 3, unit: 'weight added to a verb\'s sense the scene shows (someone fleeing; soldiers about)', status: 'assumed', src: 'a judgement', range: [2, 5], file: 'ask.ts' });
const POSITION = /\b(bridge|gate|gates|hill|ridge|fort|redoubt|trench|wall|walls|tower|village|camp|battery|crossroads|ford|pass|heights)\b/i;
const FORCE = /\b(attack|assault|storm|charge|fight|men|troops|company|regiment|platoon|squad|soldiers|by force|with my|with our|guns|rifles|muskets|bayonets)\b/i;
const ARMED = /\b(soldiers?|troops|garrison|regiment|company|platoon|sentr(y|ies)|guards? (?:hold|holds|on)|enemy|militia|musketeers|riflemen|cannon|guns)\b/i;
const FLEEING = /\b(fle(e|es|eing|d)|runs? (?:off|away)|running (?:off|away)|bolts?|escap(e|es|ing|ed)|dash(es|ed)? (?:off|away)|makes? off)\b/i;
const STEALTH = /\b(sneak|sneaks|creep|creeps|unseen|unnoticed|hidden|in the shadows|quietly|careful not to be seen|out of sight)\b/i;
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const named = (name, text) => new RegExp(`\\b${name.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text);
/** A verb whose senses go to different tools, with nothing in the line to say which: follow (catch up, keep out of sight,
 * walk after), take or hold a position (a fight for it, or going onto it) [ASSUMED list]. The plain sense is the default
 * reading (an interpretation rule, as Attempto Controlled English fixes one per construction); the scene can outweigh it. */
function senseQuestion(said, player, has, cues) {
    // A sense is the player's to choose only for their own act (frame.ts byPlayer): "Will follows the thief" asks nothing.
    const head = verbsAt(said, KNOWN_VERBS).find(x => !BEFORE.has(x.verb));
    if (!head || !byPlayer(said, head.at, player))
        return null;
    // The object: the words after the verb up to the next clause or a phrase of place ("the thief through the market").
    const rest = said.slice(head.end).trim().replace(/[.!?]+$/, '');
    const obj = (rest.split(/,|\s+(?:and|then|through|into|onto|to|across|down|up|along|past|around|out|from|towards?|over|under|behind|before)\s+/i)[0] ?? '').trim();
    const scene = cues.narration.join(' '), cue = k('weightSceneCue');
    if (/^(follow|tail|shadow|trail)$/.test(head.verb) && obj && !/\b(unseen|quietly|sneak|hidden|at a distance|run|running|catch|chase|out of sight)\b/i.test(said)) {
        const who = obj.replace(/^(him|her|them)\b/i, m => m.toLowerCase());
        return { text: `"${cap(head.word)} ${obj}": which do you mean?`, options: [
                ...has('Chase') ? [{ label: `Catch up with ${who}`, weight: 1 + (FLEEING.test(scene) ? cue : 0), harm: false, fix: { require: 'Chase', note: `${player} means to catch up with ${who}: a chase on foot (Chase, ${player} the pursuer).` } }] : [],
                ...has('Look') ? [{ label: `Keep behind ${who}, out of sight`, weight: 1 + (STEALTH.test(scene) ? cue : 0), harm: false, fix: { require: 'Look', note: `${player} means to follow ${who} unseen: whether ${who} sees ${player} (Look, ${who} the viewer).` } }] : [],
                ...has('Act') ? [{ label: `Walk after ${who} in the open`, weight: 2, harm: false, fix: { require: 'Act', note: `${player} means to walk after ${who} in the open (Act).` } }] : [],
            ] };
    }
    if (/^(take|hold|seize|capture)$/.test(head.verb) && POSITION.test(obj) && !FORCE.test(said) && has('Battle')) {
        return { text: `"${cap(head.word)} ${obj}": which do you mean?`, options: [
                { label: `Fight for ${obj} with armed men`, weight: 0.2 + (ARMED.test(scene) ? cue : 0), harm: true, fix: { require: 'Battle', note: `${player} means to take ${obj} by force: an attack on a defended position (Battle).` } },
                ...has('Act') ? [{ label: `Go onto ${obj} and stand there`, weight: 2, harm: false, fix: { require: 'Act', note: `${player} means to go onto ${obj}, with no fight (Act).` } }] : [],
            ] };
    }
    return null;
}
/** A blow, a look or words at "him" or "her" with no one, or two or more, named before it in the line who could be meant, or a
 * blow with no one named at all (the attack frame's victim left out: "I strike"), and two or more people it could be. People of the
 * pronoun's sex come first; when the story holds no one's sex, anyone fits. "Them" is a group: no single person is asked for. */
function targetQuestion(said, player, people, cues) {
    for (const v of verbsAt(said, KNOWN_VERBS)) {
        const tool = BLOW_VERBS.has(v.verb) ? 'BodyStrike' : LOOK_VERBS.has(v.verb) ? 'Look' : /^(say|tell|ask|whisper|shout|call|greet|beg|warn|thank|answer|reply)$/.test(v.verb) ? 'Communicate' : null;
        if (!tool || !byPlayer(said, v.at, player))
            continue;
        const pro = v.after.find((w, i) => i < 3 && /^(him|her)$/.test(w));
        // A blow with nothing after it but an end, "out", "wildly" or "at once": the victim is left out.
        const bare = tool === 'BodyStrike' && !pro && (v.after.length === 0 || /^(out|wildly|blindly|first|now|at|[,.;:!?])$/.test(v.after[0] ?? '') && !v.after.slice(1, 3).some(w => /^[a-z]/.test(w) && w !== 'once'));
        if (!pro && !bare)
            continue;
        const before = said.slice(0, v.at), sex = pro === 'him' ? 'male' : pro === 'her' ? 'female' : null;
        // Of the people a set, those of the pronoun's sex, else those whose sex the story does not hold.
        const fitting = (set) => { const known = sex ? set.filter(p => p.sex === sex) : set; return sex ? (known.length ? known : set.filter(p => !p.sex)) : set; };
        // "Him" with one person named before it who fits is that person (frame.ts reads it); with two or more ("I look at Tom
        // and Will, then I punch him"), it is one of them, and the line leaves which open (grammar.ts antecedent). With
        // none named, it is one of the scene's others.
        const inLine = pro ? fitting(people.filter(p => p.name !== player && named(p.name, before))) : [];
        if (inLine.length === 1)
            continue;
        const fits = inLine.length >= 2 ? inLine : fitting(people.filter(p => p.name !== player && !named(p.name, before)));
        if (fits.length < 2)
            return null;
        const arg = tool === 'BodyStrike' ? 'who' : tool === 'Look' ? 'target' : 'listener';
        const doing = tool === 'BodyStrike' ? cap(v.word) : tool === 'Look' ? `${cap(v.word)} at` : /^(say|whisper|shout|call|reply)$/.test(v.verb) ? `${cap(v.word)} to` : cap(v.word);
        const last = cues.narration.at(-1) ?? '';
        // For "him" or "her", the weights of the Bayesian pronoun model when the intent layer gave them (intent.ts:
        // P(pronoun | person), the speaker's choice of a pronoun for the one in focus); else the parsers' cues.
        const bayes = pro ? cues.pronouns?.[pro] : undefined;
        const weight = (p) => bayes ? bayes[p.name] ?? Math.min(...Object.values(bayes)) : 1 + (cues.lastTargets.includes(p.name) ? k('weightLastTarget') : 0) + (named(p.name, last) ? k('weightNamedLast') : 0)
            + (cues.spot && p.spot && p.spot === cues.spot ? k('weightSameSpot') : 0);
        return { text: `"${cap(v.word)}${pro ? ` ${pro}` : ''}": who?`, options: fits.slice(0, 4).map(p => ({ label: `${doing} ${p.name}`, weight: weight(p), harm: tool === 'BodyStrike',
                fix: { tool, arg, value: p.name, note: `${pro ? `"${pro}" in the player's line` : `The one the player's character strikes at`} is ${p.name} (${tool} ${arg}).` } })) };
    }
    return null;
}
/** Whether to ask, and what: the likeliest reading is taken when its share of the weight passes the threshold (higher when a
 * reading harms someone), else the player is asked, the options in a fresh order. Null when the line leaves nothing open.
 * The line's knob (faith.ts) moves the threshold: below 1.0 the likeliest is taken, a tie included; above 1.0 the player is
 * asked whenever two readings fit. */
export function decide(said, player, people, has, cues = { narration: [], lastTargets: [] }, rng = Math.random, faith = 1) {
    const q = senseQuestion(said, player, has, cues) ?? targetQuestion(said, player, people, cues);
    if (!q || q.options.length < 2)
        return null;
    const total = q.options.reduce((s, o) => s + o.weight, 0), top = [...q.options].sort((a, b) => b.weight - a.weight)[0];
    const tied = q.options.filter(o => o.weight === top.weight).length > 1;
    const over = faithNeeds(faithOf(faith)), needs = over ?? (q.options.some(o => o.harm) ? k('askBelowHarm') : k('askBelowSafe'));
    if ((over === 0 || !tied) && top.weight / total >= needs)
        return { take: top, question: q };
    q.options = q.options.map(o => [rng(), o]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    return { ask: q };
}
/** The question alone, whatever the weights say (for a caller that always asks). */
export function openQuestion(said, player, people, has, rng = Math.random) {
    const d = decide(said, player, people, has, { narration: [], lastTargets: [] }, rng);
    if (!d)
        return null;
    if ('ask' in d)
        return d.ask;
    d.question.options = d.question.options.map(o => [rng(), o]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    return d.question;
}
/** A scene person's sex, from what the story holds or the words naming them (wordSex: the landlady, the potman). */
export const personSex = (name, held) => held ?? wordSex(name);
/** Applies a chosen or taken reading to the turn's calls: the argument on the player's calls of that tool. */
export function applyFix(calls, fix, player) {
    if (!fix.tool || !fix.arg || fix.value == null)
        return;
    const actor = { BodyStrike: 'attacker', Look: 'viewer', Communicate: 'speaker' };
    for (const c of calls)
        if (c.tool === fix.tool && c.args[actor[fix.tool] ?? 'who'] === player)
            c.args[fix.arg] = fix.value;
}
// A correction of the last turn's reading, written as the player's next line: "no, Will", "I meant Will", "no, I meant to
// keep out of sight" (Elgohary et al. 2020, ACL: people fixed a wrong reading in plain words; 81.5 % of such corrections
// set the reading right when people applied them). Read only when short, unquoted, and naming a person or a sense the last
// line could have meant; anything else is an ordinary line.
const CORRECTION = /^\s*(?:no|nope|not (?:him|her|that|them|that one))\b[\s,:;.!—–-]*(?:i meant|i mean)?\s*(.*)$|^\s*(?:i meant|i mean)\b[\s,:;—–-]*(.*)$/i;
/** The next line that says another reading was meant ("no, keep behind Tom, out of sight"): what the reading note's
 * "change" puts in the player's input box, in the player's own words, read by correctionOf and correctionFix below. */
export const correctionLine = (label) => `no, ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
// Without "I meant", a correction names the reading, a person or an act ("no, Will"; "no, keep out of sight"); a clause with
// its own subject ("No, I don't think Will did it"; "No, Will is lying") is an ordinary line.
const CLAUSE = [/^(?:i|you|he|she|it|we|they|this|that|there)\b/i, /^[A-Z][\w'-]*(?: [A-Z][\w'-]*)? (?:is|was|were|are|am|did|does|do|has|had|have|will|would|can|could|should|must|may|might|isn't|wasn't|didn't|doesn't|hasn't|won't|can't|[a-z]+s|[a-z]+ed)\b/];
export function correctionOf(line) {
    // Quoted words are speech (quotes.ts: "…", „…“, «…», ›…‹ and the rest): a line that quotes is an ordinary line.
    if (OPENS.test(line))
        return null;
    const m = CORRECTION.exec(line.trim());
    const rest = (m?.[1] ?? m?.[2] ?? '').trim().replace(/[.!]+$/, '');
    if (m && !/\bi mean(?:t)?\b/i.test(line) && CLAUSE.some(re => re.test(rest)))
        return null;
    return m && rest && rest.split(/\s+/).length <= 12 ? rest : null;
}
const SENSE_WORDS = [[/\b(sneak|unseen|hidden|quiet|quietly|out of sight|shadow|unnoticed)\b/i, /out of sight/], [/\b(catch|chase|run|running|after him|after her)\b/i, /^Catch up/],
    [/\b(walk|openly|in the open|stroll)\b/i, /^Walk after/], [/\b(fight|attack|storm|assault|force|battle)\b/i, /^Fight for/], [/\b(go onto|stand|cross|walk onto|go on)\b/i, /^Go onto/]];
/** What a correction fixes for the last line: a person it names (the first not after "not"), set on the player's call of
 * the tool that took one; or a sense of the last line's verb it names. Null when it names neither. */
export function correctionFix(corr, lastLine, player, people, lastCalls, has, keyboard = 'auto') {
    const others = people.filter(p => p.name !== player);
    const exactPerson = others.map(p => ({ p, at: corr.search(new RegExp(`\\b${p.name.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')) }))
        .filter(x => x.at >= 0 && !/\bnot\s+(?:the\s+)?$/i.test(corr.slice(0, x.at))).sort((a, b) => a.at - b.at)[0]?.p;
    const slipPerson = !exactPerson ? others
        .map(p => ({ p, score: Math.max(...corr.split(/\s+/).map(w => wordSlipLikelihood(w, p.name.replace(/^the /i, ''), keyboard))) }))
        .filter(x => x.score >= 0.22)
        .sort((a, b) => b.score - a.score)[0]?.p : undefined;
    const person = exactPerson ?? slipPerson;
    if (person) {
        const keys = [['BodyStrike', 'attacker', 'who'], ['Look', 'viewer', 'target'], ['Communicate', 'speaker', 'listener']];
        for (const [tool, actor, arg] of keys) {
            const c = lastCalls.find(x => x.tool === tool && x.args[actor] === player);
            if (c && c.args[arg] !== person.name)
                return { tool, arg, value: person.name, note: `The player corrects their last line: it meant ${person.name} (${tool} ${arg}).`, plain: `The player corrects their last line: it meant ${person.name}.` };
        }
    }
    const q = senseQuestion(lastLine, player, has, { narration: [], lastTargets: [] });
    for (const [words, label] of SENSE_WORDS)
        if (words.test(corr)) {
            const o = q?.options.find(x => label.test(x.label));
            if (o) {
                const meant = `${o.label.charAt(0).toLowerCase()}${o.label.slice(1)}`;
                return { ...o.fix, note: `The player corrects their last line: ${meant}. ${o.fix.note}`, plain: `The player corrects their last line: they meant to ${meant}.` };
            }
        }
    return null;
}
