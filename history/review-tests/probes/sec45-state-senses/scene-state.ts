// Whether the scene's state allows a verb's reading (docs/df-body-engine.md §7.3, 2026-10-28 (111)). A sentence's meaning is
// built from what the things it names afford in the situation, not from the words alone: readers judged "used a newspaper to
// shield his face from the wind" sensible (4.32 of 7) and the same with a matchbook not (1.31), while word co-occurrence
// (LSA) gave both the same cosine, .06 (Glenberg & Robertson 2000, J Mem Lang 43:379, Experiment 1). So the reading is checked
// against the scene: VerbNet states what each class needs before the act (data/verb-pre.ts: give-13.1 needs the giver to have
// the thing, fire-10.10 needs the one who fires to have authority over the one fired, throw-17.1 needs the thrower in contact
// with what is thrown), and the engine's state answers what it holds: who has what (possessions.ts) and where each person is.
// The reading's chance from the words is then multiplied by its chance in the state (Ahn et al. 2022, SayCan: the language
// model's probability times the affordance function's, planning success 67 % → 84 %).
import { PRE_STATE } from './data/verb-pre.js';
import { kindsOf } from './senses.js';

/** What the state holds for checking a reading: the actor, what each holder carries, whose belongings are on record (they
 *  have only what is listed), and the spot each person is at. */
export interface SceneView { actor: string; items: Record<string, string[]>; accounted: string[]; spot: Record<string, string> }
export type Verdict = 'holds' | 'fails' | 'open';
export interface Check { pred: string; verdict: Verdict; says: string }

const norm = (s: string) => s.toLowerCase().replace(/^(?:the|a|an|my|his|her|their|our|your|some)\s+/, '').trim();
const sameThing = (a: string, b: string) => { const x = norm(a), y = norm(b); return x === y || x.endsWith(` ${y}`) || y.endsWith(` ${x}`) || `${x}s` === y || `${y}s` === x || `${x}es` === y || `${y}es` === x; };
const MONEY = /^(?:money|coins?|silver|gold|shillings?|pence|penn(?:y|ies)|pounds?|crowns?|florins?|sovereigns?|guineas?|farthings?|dollars?|cents?|francs?|ducats?|marks?)$/;
const key = (n: string) => n.toLowerCase().replace(/^the\s+/, '');

/** The shape of the line: no object, one, or two (NP V NP NP). */
export type Frame = 'none' | 'one' | 'two';
/** The line's objects, in order: the first after the verb, and the second of two. */
export interface Fill { object?: string; second?: string }

/** Each checkable pre-state of class `cls` in this line, with what the scene says of it; an empty list when VerbNet states none
 *  the engine's state can answer. */
export function preState(cls: string, frame: Frame, fill: Fill, view: SceneView): Check[] {
    const spec = PRE_STATE[cls]?.[frame] ?? (frame === 'two' ? PRE_STATE[cls]?.one : undefined);
    if (!spec) return [];
    const person = (w?: string) => !!w && (/h/.test(kindsOf(w.split(' ').pop() ?? w)?.first ?? '') || Object.keys(view.spot).some(n => key(n) === key(w)));
    // The roles come from the frame's syntax: its subject is the actor, its objects the line's objects in order ("give-13.1" NP V
    // NP NP: Agent V Recipient Theme; "pelt-17.2" NP V NP: Agent V Destination). A role the line does not fill stays unbound.
    const words = [view.actor, fill.object, fill.second];
    const bind = (role: string) => { const i = spec.np.indexOf(role); return i < 0 ? undefined : words[i]; };
    const has = (holder: string, thing: string | undefined, role: string): Verdict => {
        const list = view.items[holder] ?? Object.entries(view.items).find(([n]) => key(n) === key(holder))?.[1] ?? [];
        const asset = role === 'Asset' && (!thing || MONEY.test(norm(thing)));
        const held = asset ? list.some(x => MONEY.test(norm(x).split(' ').pop() ?? '')) : !!thing && list.some(x => sameThing(x, thing));
        if (held) return 'holds';
        return view.accounted.some(n => key(n) === key(holder)) && (asset || !!thing) ? 'fails' : 'open';
    };
    const out: Check[] = [];
    for (const p of spec.pre) {
        const [raw, ...roles] = p.split(/\s+/), neg = raw!.startsWith('!'), name = raw!.replace(/^!/, '');
        if (name === 'has_possession' && roles.length >= 2) {
            // An Asset is money (VerbNet's role for a currency); a person in the Asset slot is no asset, so the check is for money.
            const holder = bind(roles[0]!), bound = bind(roles[1]!), thing = roles[1] === 'Asset' && person(bound) ? undefined : bound;
            // Only the actor's belongings are checked: another's are the story's word (possessions.ts).
            if (holder !== view.actor || (!thing && roles[1] !== 'Asset')) continue;
            const v = has(holder, thing, roles[1]!), verdict: Verdict = v === 'open' ? 'open' : (v === 'holds') !== neg ? 'holds' : 'fails';
            const what = thing ?? 'money', state = v === 'holds' ? `${holder} has ${what}` : v === 'fails' ? `${holder} has no ${what} on record` : `${holder}'s ${what} is not on record`;
            out.push({ pred: p, verdict, says: `needs ${holder} ${neg ? 'not to have' : 'to have'} ${what}; ${state}` });
        } else if (name === 'contact' && !neg && bind(roles[0]!) === view.actor) {
            // The actor touches the other during the act without moving to it: two bodies touch at one place, so the other is in
            // the actor's hands or at the actor's spot.
            const thing = bind(roles[1]!);
            if (!thing) continue;
            const inHand = has(view.actor, thing, 'Theme') === 'holds';
            const at = view.spot[view.actor], there = Object.entries(view.spot).find(([n]) => key(n) === key(thing))?.[1];
            const verdict: Verdict = inHand || (at && there && at === there) ? 'holds' : at && there && at !== there ? 'fails' : 'open';
            out.push({ pred: p, verdict, says: `needs ${view.actor} in contact with ${thing}; ${verdict === 'holds' ? (inHand ? `${view.actor} holds it` : `both are at ${at}`) : verdict === 'fails' ? `${thing} is at ${there}, ${view.actor} at ${at}` : 'where they stand is not on record'}` });
        } else if (name === 'authority_relationship' && !neg && bind(roles[0]!) === view.actor) {
            // The engine keeps no record of who has authority over whom: the condition goes to the planner, open.
            const over = bind(roles[1]!);
            if (over) out.push({ pred: p, verdict: 'open', says: `needs ${view.actor} to have authority over ${over}; the scene does not record who has authority over whom` });
        }
    }
    return out;
}
