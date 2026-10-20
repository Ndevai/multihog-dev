// Which tools a turn needs, read by code from the player's message (docs/progress.md entry 36). Each row is a class of verb
// and the tool whose outcome it asks for; the model's tool picker is asked only when no row matches. The tools always
// offered cover what any turn can bring: a fact stated, time passing, a person met.
import { stepsFromWords } from './actions.js';

/** A verb class: its words (each also matched with -s, -es, -ed, -ing; irregular forms listed), and the tool it asks for. */
const VERBS: [tool: string, words: string[]][] = [
    ['Communicate', ['say', 'said', 'ask', 'tell', 'told', 'call to', 'call out', 'called to', 'called out', 'shout', 'yell', 'whisper', 'greet', 'reply', 'replied', 'answer', 'speak', 'spoke', 'talk', 'cry out', 'cried out', 'order', 'beg', 'plead', 'explain', 'warn', 'introduce', 'thank', 'promise', 'lie to', 'lied to', 'sing', 'sang', 'scream']],
    ['SocialResponse', ['ask for', 'asked for', 'ask him', 'ask her', 'ask them', 'request', 'beg', 'plead', 'persuade', 'convince', 'bargain', 'haggle', 'offer', 'demand', 'threaten', 'flirt', 'bribe', 'invite', 'call for', 'called for']],
    ['Listen', ['listen', 'overhear', 'overheard', 'eavesdrop', 'hear', 'heard']],
    ['Look', ['look', 'watch', 'peer', 'see', 'saw', 'seen', 'search', 'spot', 'observe', 'glance', 'examine', 'inspect', 'spy', 'spied', 'peek', 'scan', 'study', 'studied', 'check']],
    ['Price', ['buy', 'bought', 'pay', 'paid', 'purchase', 'price', 'cost', 'how much', 'sell', 'sold', 'hire', 'rent', 'for a pint', 'a pound of']],
    ['Transfer', ['give', 'gave', 'given', 'hand over', 'hand him', 'hand her', 'hand it', 'hand the', 'buy', 'bought', 'pay', 'paid', 'sell', 'sold', 'take', 'took', 'taken', 'steal', 'stole', 'lend', 'lent', 'borrow', 'pass him', 'pass her', 'pocket']],
    ['BodyCheck', ['climb', 'jump', 'leap', 'leapt', 'lift', 'swim', 'swam', 'force', 'push', 'pull', 'vault', 'scale', 'balance', 'throw', 'threw', 'thrown', 'break open', 'pry', 'pried', 'squeeze through', 'hold my breath']],
    ['BodyFall', ['fall', 'fell', 'fallen', 'drop down', 'dropped down', 'jump down', 'jumped down', 'leap down', 'jump off', 'jumped off', 'slip', 'trip', 'tripped', 'stumble']],
    ['BodyStrike', ['hit', 'punch', 'kick', 'stab', 'strike', 'struck', 'slap', 'shoot', 'shot', 'attack', 'fight', 'fought', 'club', 'cut', 'slash', 'shove', 'tackle', 'headbutt', 'bite', 'bit']],
    ['BodyIntake', ['eat', 'ate', 'eaten', 'drink', 'drank', 'drunk', 'swallow', 'sip', 'bite into', 'taste']],
    ['PassTime', ['wait', 'sleep', 'slept', 'rest', 'spend', 'spent', 'stay', 'linger', 'doze', 'nap', 'until', 'hours', 'all night', 'all day']],
    ['Chase', ['chase', 'flee', 'fled', 'run away', 'ran away', 'pursue', 'escape', 'run after', 'ran after', 'outrun', 'outran']],
    ['HoldOn', ['hold on', 'held on', 'hang on', 'hung on', 'cling', 'clung', 'grip']],
    ['BodyTreat', ['bandage', 'treat', 'stitch', 'splint', 'dress the wound', 'tend']],
    ['Break', ['break', 'broke', 'broken', 'smash', 'snap', 'kick in', 'kicked in', 'kick open', 'kick down', 'the door in', 'shatter']],
];
/** Whether the action reader finds a motion in the words. */
export function movesIn(text: string): boolean {
    const r = stepsFromWords(text, 'x');
    return 'steps' in r || /needs distance_m/.test(r.error);
}
const ALWAYS = ['RecordFact', 'PassTime', 'NewCharacter'];

const forms = (w: string) => {
    const [head, ...rest] = w.split(' '), tail = rest.length ? `\\s+${rest.join('\\s+')}` : '';
    const stem = head.endsWith('e') ? head.slice(0, -1) : head;
    const ends = head.endsWith('e') ? '(?:e|es|ed|ing)' : /[^aeiou][aeiou][bdgmnpt]$/.test(head) ? `(?:s|es|ed|ing|${head.slice(-1)}ed|${head.slice(-1)}ing)?` : '(?:s|es|ed|ing)?';
    return `${head.endsWith('y') && !/[aeiou]y$/.test(head) ? `${head.slice(0, -1)}(?:y|ies|ied|ying)` : `${stem}${ends}`}${tail}`;
};
const PATTERN = VERBS.map(([tool, words]) => [tool, new RegExp(`\\b(?:${words.map(forms).join('|')})\\b`, 'i')] as const);

export interface Route { tools: string[]; why: Record<string, string> }
/** The tools the player's message asks for, each with the words that asked; empty when no verb class matches. */
export function routeTurn(text: string): Route {
    const why: Record<string, string> = {};
    for (const [tool, re] of PATTERN) { const m = text.match(re); if (m) why[tool] = m[0]; }
    // Speech in quotes is a message.
    if (!why.Communicate && /["“][^"”]{2,}["”]/.test(text)) why.Communicate = 'quoted words';
    // A motion the action reader recognizes is an Act; a walk whose distance the words leave out still is (the scene gives it).
    if (movesIn(text)) why.Act = 'motion';
    if (why.Communicate) why.Interpret = 'with Communicate';
    return { tools: Object.keys(why), why };
}
/** The tool set offered to the planner: the routed tools and the ones every turn may need, or null to ask the model. */
export function routedTools(text: string, has: (name: string) => boolean): Set<string> | null {
    const r = routeTurn(text).tools.filter(has);
    return r.length ? new Set([...r, ...ALWAYS.filter(has)]) : null;
}
