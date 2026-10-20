// Who has what: the ledger possession changes are written to (Conceptual Dependency ATRANS, Schank 1975). Whether a
// change happens is decided by the tool that governs how it happens (SocialResponse or Choose for an agreement, Look for
// a theft that may be seen, HoldOn or BodyStrike for a struggle); this ledger only records the result, so an item stays
// where the story last put it.
// Holding and owning are kept apart (Heine 1997, Possession: physical, temporary and permanent possession). Ownership passes
// only from the owner: a thief or borrower who sells or gives an item passes the holding, not the ownership (nemo dat quod
// non habet, Roman and common law). Owner is stored only when it differs from the holder.
import type { RuleState } from './types.js';

export const HOW = ['given', 'sold', 'bought', 'lent', 'returned', 'stolen', 'taken by force', 'found', 'made', 'lost', 'used up', 'dropped'] as const;
type Held = { item: string; qty: number; owner?: string };
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/^(a|an|the|some)\s+/, '').trim();
/** Same item, singular or plural ("shilling", "Shillings", "boxes"). */
const same = (a: string, b: string) => { const x = norm(a), y = norm(b); return x === y || `${x}s` === y || `${y}s` === x || `${x}es` === y || `${y}es` === x; };
const count = (n: number, item: string) => n === 1 ? item : /(s|pence)$/.test(item) ? `${n} ${item}` : `${n} ${item}s`;

function holding(st: RuleState, who: string): Held[] {
    st.items ??= {};
    return (st.items[who] ??= []);
}

/** Whether who's belongings are on record and leave out item: a hand-over of it needs a Claim first. */
export function unrecorded(st: RuleState, who: string, item: string): boolean {
    return !!st.accounted?.includes(who) && !holding(st, who).some(x => same(x.item, item));
}

/** Marks who's belongings as accounted: from now on they give only what is on record. */
export function account(st: RuleState, who: string): void {
    st.accounted ??= [];
    if (!st.accounted.includes(who)) st.accounted.push(who);
    holding(st, who);
}

/** Adds quantity of item to who, owned by owner (default who). */
export function give(st: RuleState, who: string, item: string, qty = 1, owner = who): void {
    const o = owner === who ? undefined : owner;
    const list = holding(st, who), have = list.find(x => same(x.item, item) && x.owner === o);
    if (have) have.qty += qty; else list.push(o ? { item: item.trim(), qty, owner: o } : { item: item.trim(), qty });
}

/** Who owns what moves: the giver passes ownership only when they own it; a loan, theft or seizure keeps the owner. */
function ownerAfter(how: string, owner: string | undefined, from: string | undefined, to: string): string {
    if (how === 'made' || how === 'found') return to;
    if (['given', 'sold', 'bought'].includes(how)) return !owner || owner === from ? to : owner;
    return owner ?? from ?? to;
}

/**
 * Moves an item. from/to absent = the world (found, made, bought from no one tracked; lost, used up, sold away).
 * A holder whose belongings are accounted (a player's character, after Claim decided something they have) gives only
 * what is on record; anyone else is taken at the story's word: a baker has bread without a list of it.
 */
// English money, in pence, by coin (the coinage of 1816–1971: farthing ¼ d, halfpenny ½ d, penny, threepence, sixpence,
// shilling 12 d, florin 24 d from 1849, half-crown 30 d, crown 60 d, sovereign 240 d).
const COIN_D: [RegExp, number, string][] = [[/^farthings?$/, 0.25, 'farthing'], [/^half ?penn(?:y|ies)$|^ha'?penn(?:y|ies)$/, 0.5, 'halfpenny'], [/^penn(?:y|ies)$|^pence$/, 1, 'penny'],
    [/^threepences?$|^thruppences?$/, 3, 'threepence'], [/^sixpences?$/, 6, 'sixpence'], [/^shillings?$/, 12, 'shilling'], [/^florins?$/, 24, 'florin'],
    [/^half[- ]crowns?$/, 30, 'half-crown'], [/^crowns?$/, 60, 'crown'], [/^sovereigns?$|^guineas?$/, 240, 'sovereign']];
const coinOf = (item: string) => COIN_D.find(([re]) => re.test(norm(item)));
const NUMW: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
/** An amount of English money in words, in pence: "a penny and a half" 1.5, "three halfpence" 1.5, "twopence" 2, "1s 6d" 18,
 *  "two shillings" 24; null when the words name no amount. */
export function moneyIn(text: string): number | null {
    const t = ` ${text.toLowerCase()} `.replace(/tuppence/g, 'two pence').replace(/thruppence/g, 'three pence')
        .replace(/\b(two|three|four|five|six|seven|eight|nine|ten|eleven)pence\b/g, '$1 pence').replace(/(\d+)\s*s\b/g, '$1 shillings').replace(/(\d+)\s*d\b/g, '$1 pence');
    let total = 0, found = false;
    for (const m of t.matchAll(/(?:\b(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+|\b)(farthings?|half ?penn(?:y|ies)|halfpence|ha'?pence|penn(?:y|ies)|pence|shillings?|florins?|half[- ]crowns?|crowns?|sovereigns?|pounds?(?!\s+of\b))\b(\s+and\s+a\s+half)?/g)) {
        const n = m[1] == null ? 1 : /\d/.test(m[1]) ? Number(m[1]) : NUMW[m[1]], unit = m[2];
        const d = /^far/.test(unit) ? 0.25 : /^half ?penn|halfpence|ha'?pence/.test(unit) ? 0.5 : /^penn|^pence/.test(unit) ? 1 : /^shil/.test(unit) ? 12 : /^flor/.test(unit) ? 24 : /^half[- ]crown/.test(unit) ? 30 : /^crown/.test(unit) ? 60 : 240;
        total += n * d + (m[3] ? d / 2 : 0); found = true;
    }
    return found ? total : null;
}
/** Pays an amount from the coins someone holds, the fewest coins that cover it, and takes the change back in the largest
 *  coins (the receiver, a trader, is taken to hold change [ASSUMED]). */
function pay(st: RuleState, from: string, to: string | undefined, pence: number, how: string): string | null {
    const purse = holding(st, from).map(x => ({ x, c: coinOf(x.item) })).filter(y => y.c);
    const coins = purse.flatMap(({ x, c }) => Array.from({ length: x.qty }, () => ({ held: x, d: c![1], name: c![2] }))).sort((p, q) => q.d - p.d);
    const have = coins.reduce((s0, c) => s0 + c.d, 0);
    if (have + 1e-9 < pence) return `${from} has ${have} d in coin, short of ${pence} d. State unchanged.`;
    // Fewest coins covering the amount: take from the largest down, then trim coins the sum no longer needs.
    let used: typeof coins = [], sum = 0;
    for (const c of coins) { if (sum + 1e-9 >= pence) break; used.push(c); sum += c.d; }
    used = used.sort((p, q) => q.d - p.d);
    for (const c of [...used].reverse()) if (sum - c.d + 1e-9 >= pence) { used.splice(used.indexOf(c), 1); sum -= c.d; }
    for (const c of used) { c.held.qty -= 1; if (c.held.qty <= 0) holding(st, from).splice(holding(st, from).indexOf(c.held), 1); if (to) give(st, to, c.name); }
    let change = Math.round((sum - pence) * 4) / 4;
    const back: string[] = [];
    for (const [, d, name] of [...COIN_D].sort((p, q) => q[1] - p[1])) while (change + 1e-9 >= d && d <= 240) { change -= d; give(st, from, name); back.push(name); if (to) { const t = holding(st, to).find(x => x.item === name); if (t) { t.qty -= 1; if (!t.qty) holding(st, to).splice(holding(st, to).indexOf(t), 1); } } }
    return `${pence} d ${how} from ${from}${to ? ` to ${to}` : ''}: ${used.map(c => c.name).join(', ')}${back.length ? `, change ${back.join(', ')}` : ''}. Recorded.`;
}

export function transfer(st: RuleState, a: { item: string; quantity?: number; from?: string; to?: string; how: string }): string {
    // A sum of money named in words ("a penny and a half") is paid in coin, with change.
    const pence = a.from && !coinOf(a.item) ? moneyIn(a.item) : null;
    if (pence && a.from && holding(st, a.from).some(x => coinOf(x.item))) { const r = pay(st, a.from, a.to, pence, a.how); if (r) return r; }
    const qty = Math.max(1, Math.round(a.quantity ?? 1));
    let owner: string | undefined;
    if (a.from) {
        const list = holding(st, a.from), have = list.find(x => same(x.item, a.item));
        owner = have ? have.owner ?? a.from : a.from;
        if (!have && st.accounted?.includes(a.from)) return `${a.from}'s belongings on record: ${list.map(x => count(x.qty, x.item)).join(', ') || 'empty hands'}; ${a.item} is outside them. State unchanged.`;
        if (have && have.qty < qty) return `${a.from} has only ${count(have.qty, have.item)}. State unchanged.`;
        if (have) { have.qty -= qty; if (!have.qty) list.splice(list.indexOf(have), 1); }
    }
    const owns = a.to ? ownerAfter(a.how, owner, a.from, a.to) : undefined;
    if (a.to) give(st, a.to, a.item, qty, owns);
    const where = a.to ? `${a.to} now has it${owns !== a.to ? `; it is still ${owns}'s` : ''}` : 'it is gone from the story';
    return `${count(qty, a.item)} ${a.how}${a.from ? ` from ${a.from}` : ''}${a.to ? ` to ${a.to}` : ''}; ${where}. Recorded.`;
}

/** "[HAS] … [/HAS]", one line per holder, or '' when nothing is recorded. */
export function possessionsBlock(st: RuleState): string {
    const lines = Object.entries(st.items ?? {}).filter(([, l]) => l.length).map(([who, l]) => `${who}: ${l.map(x => `${count(x.qty, x.item)}${x.owner ? ` (${x.owner}'s)` : ''}`).join(', ')}`);
    return lines.length ? `[HAS]\nWhat each character carries, as the story last recorded it; (X's) marks an item someone else owns.\n${lines.join('\n')}\n[/HAS]` : '';
}
