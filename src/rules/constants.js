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
    return OVERRIDE.get(id) ?? c.value;
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
