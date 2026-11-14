// The world's history as diffs (docs/df-body-engine.md §6.21, world-log.ts; borrowed from the plan → diff → validate → apply cycle of
// Huang, Li & Fang 2026, "Orchestrated Reality", arXiv 2606.16014). Every tool call that changes the state stores what it
// changed (paths and new values), with the call, its arguments and its random draws. Replaying the diffs on the stored base
// must rebuild the current state exactly: that is the check that the world is the sum of its recorded steps, nothing else.
import type { RuleState } from './types.js';

export type Op = { p: (string | number)[]; v?: unknown; del?: true };
export interface Entry { n: number; msg: number; tool: string; args: unknown; draws: number[]; ops: Op[] }
/** baseMsg: the latest message whose changes the base holds (entries folded into it past KEEP_ENTRIES); baseN: the number of
 * the latest entry folded into it. */
export interface History { base: RuleState; log: Entry[]; n: number; baseMsg?: number; baseN?: number }
export const KEEP_ENTRIES = 400;

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
/** Paths that differ between a and b, with b's value (or a deletion). Arrays and objects are compared by key. */
export function diff(a: unknown, b: unknown, p: (string | number)[] = [], out: Op[] = []): Op[] {
    if (Object.is(a, b)) return out;
    if (!isObj(a) || !isObj(b) || Array.isArray(a) !== Array.isArray(b)) { out.push({ p, v: structuredClone(b) }); return out; }
    // A shorter array is stored whole; a longer one by its changed and added items (an appended fact is one op).
    if (Array.isArray(a) && Array.isArray(b) && a.length > b.length) { out.push({ p, v: structuredClone(b) }); return out; }
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        const ka = Array.isArray(a) ? Number(k) : k;
        if (!(k in b)) out.push({ p: [...p, ka], del: true });
        else if (!(k in a)) out.push({ p: [...p, ka], v: structuredClone((b as Record<string, unknown>)[k]) });
        else diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], [...p, ka], out);
    }
    return out;
}
export function apply(st: RuleState, ops: Op[]): RuleState {
    let root: unknown = st;
    for (const o of ops) {
        if (!o.p.length) { root = structuredClone(o.v); continue; }
        let cur = root as Record<string | number, unknown>;
        for (let i = 0; i < o.p.length - 1; i++) { const k = o.p[i]; if (!isObj(cur[k])) cur[k] = typeof o.p[i + 1] === 'number' ? [] : {}; cur = cur[k] as Record<string | number, unknown>; }
        const last = o.p[o.p.length - 1];
        if (o.del) delete cur[last]; else cur[last] = structuredClone(o.v);
    }
    return root as RuleState;
}

export function record(h: History, e: Omit<Entry, 'n'>): void {
    if (!e.ops.length) return;
    h.log.push({ ...e, n: ++h.n });
    while (h.log.length > KEEP_ENTRIES) { const old = h.log.shift()!; h.base = apply(h.base, old.ops); h.baseMsg = Math.max(h.baseMsg ?? -1, old.msg); h.baseN = old.n; }
}
/** A swipe rewrites message `msg`: its calls leave the history. When the base already holds changes from `msg` on (a
 * deletion back past the folded entries), the base starts again from `state`, the world as restored, with an empty log, so
 * the replay rebuilds it. */
export function truncate(h: History, msg: number, state?: RuleState): void {
    if (state && h.baseMsg != null && h.baseMsg >= msg) { h.base = structuredClone(state); h.log = []; h.baseMsg = msg - 1; return; }
    h.log = h.log.filter(e => e.msg < msg);
}
/** The record as it stood when it held `n` entries in all: the later ones go. When the base already holds a later one (folded
 * past KEEP_ENTRIES), the base starts again from `state`, the world as restored, with an empty log. */
export function truncateTo(h: History, n: number, state?: RuleState): void {
    if (state && (h.baseN ?? 0) > n) { h.base = structuredClone(state); h.log = []; h.baseN = h.n; return; }
    h.log = h.log.filter(e => e.n <= n);
}
/** The world the record rebuilds: the log replayed on the base. */
export const rebuilt = (h: History): RuleState => h.log.reduce((s, e) => apply(s, e.ops), structuredClone(h.base));
/** Replays the log on the base; null when it rebuilds `state` exactly, else the first differing paths. */
export function verify(h: History, state: RuleState): string | null {
    const d = diff(rebuilt(h), state);
    return d.length ? d.slice(0, 5).map(o => o.p.join('.')).join(', ') : null;
}
