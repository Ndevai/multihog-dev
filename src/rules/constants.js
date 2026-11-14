// Constants with their origin (docs/df-body-engine.md §6.21). A number the rules use is declared once with its value, unit,
// status (sourced: read from a cited source; fitted: fitted here to cited data; assumed: a judgement; raw: recalled, not
// checked) and, for assumed or fitted ones, the range it could reasonably take. Reading a constant through `k()` records that
// the current call used it, so a result can say which assumptions it rests on, and the engine can rerun the call at the ends of
// each range to see whether the outcome changes (sensitivity). docs/constants.md is generated from this registry
// (tools/constants-doc.mjs), so the document and the code cannot disagree.
export const REGISTRY_K = new Map();
const OVERRIDE = new Map();
export let USED = new Set();
export function def(c) { REGISTRY_K.set(c.id, c); return c; }
/** The constant's value for this call (an override during a sensitivity rerun), recording that it was used. */
export function k(id) {
    const c = REGISTRY_K.get(id);
    if (!c)
        throw new Error(`Unknown constant ${id}`);
    USED.add(id);
    const v = OVERRIDE.get(id) ?? c.value;
    READS?.set(id, v);
    return v;
}
/** The value for this call without recording a read: for a computation that records the read (with `k`) only once the
 * value can change its result, so a run the value cannot change does not list it, nor rerun over its range. */
export function peek(id) {
    const c = REGISTRY_K.get(id);
    if (!c)
        throw new Error(`Unknown constant ${id}`);
    return OVERRIDE.get(id) ?? c.value;
}
/** Whether `x` reaches the constant (x ≥ its value for this call). Counted as used only when x lies within the range, where
 * a value in it could answer the other way; outside it every value in the range answers alike. */
export function reaches(id, x) {
    const c = REGISTRY_K.get(id);
    if (!c)
        throw new Error(`Unknown constant ${id}`);
    const v = peek(id), lo = Math.min(v, ...(c.range ?? [])), hi = Math.max(v, ...(c.range ?? []));
    if (x < lo)
        return false;
    if (x >= hi)
        return true;
    return x >= k(id);
}
// Memo for a costly pure computation (the crowd leaving a room): its result is kept with the constants it read and their
// values, and given back when the same inputs come with those constants at the same values. A sensitivity rerun that
// varies a constant the computation never read then gets the first result at once, and a rerun that varies one it read
// computes afresh. Twelve results are kept [ASSUMED: one call's reruns are at most 6 × 2].
let READS = null;
const MEMO = new Map();
let MEMO_N = 0;
export const MEMO_STATS = { hits: 0, misses: 0 };
const current = (id) => OVERRIDE.get(id) ?? REGISTRY_K.get(id).value;
export function memo(key, fn) {
    const outer = READS;
    const hit = MEMO.get(key)?.find(e => e.reads.every(([id, v]) => current(id) === v));
    if (hit) {
        MEMO_STATS.hits++;
        for (const [id, v] of hit.reads) {
            USED.add(id);
            outer?.set(id, v);
        }
        return hit.value;
    }
    MEMO_STATS.misses++;
    READS = new Map();
    try {
        const value = fn(), reads = [...READS];
        if (MEMO_N >= 12) {
            const first = MEMO.keys().next().value;
            MEMO_N -= MEMO.get(first).length;
            MEMO.delete(first);
        }
        (MEMO.get(key) ?? MEMO.set(key, []).get(key)).push({ reads, value });
        MEMO_N++;
        for (const [id, v] of reads)
            outer?.set(id, v);
        return value;
    }
    finally {
        READS = outer;
    }
}
export const resetUsed = () => { USED = new Set(); };
export const withOverride = async (id, v, fn) => {
    OVERRIDE.set(id, v);
    try {
        return await fn();
    }
    finally {
        OVERRIDE.delete(id);
    }
};
/** The used constants that are judgements with a range: what a rerun should vary. */
export const fragileCandidates = () => [...USED].map(id => REGISTRY_K.get(id)).filter(c => c.range && c.status !== 'sourced');
