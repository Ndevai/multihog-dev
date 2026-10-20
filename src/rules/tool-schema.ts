// JSON Schema for tool parameters, and the argument type each schema describes, so a tool's action is checked against
// the schema the model sees (one source for both).

export type Prop =
    | { type: 'string'; enum?: readonly string[]; pattern?: string; description?: string }
    | { type: 'number'; minimum?: number; description?: string }
    | { type: 'boolean'; description?: string }
    | { type: 'array'; items: Prop; description?: string }
    | { type: 'object'; properties: Record<string, Prop>; required?: readonly string[]; description?: string };
export type Props = Record<string, Prop>;

/** The value a property describes. A string enum built from a runtime list types as string. */
export type ValueOf<P> =
    P extends { type: 'string'; enum: readonly (infer E)[] } ? E
    : P extends { type: 'string' } ? string
    : P extends { type: 'number' } ? number
    : P extends { type: 'boolean' } ? boolean
    : P extends { type: 'array'; items: infer I } ? ValueOf<I>[]
    : P extends { type: 'object'; properties: infer Q; required: readonly (infer R)[] } ? ArgsOf<Q, R & string>
    : P extends { type: 'object'; properties: infer Q } ? ArgsOf<Q, never>
    : unknown;

type Simplify<T> = { [K in keyof T]: T[K] } & {};
/** Arguments of a schema: required keys present, the rest optional. */
export type ArgsOf<Ps, R extends string> = Simplify<
    { [K in keyof Ps & R]: ValueOf<Ps[K]> } & { [K in Exclude<keyof Ps, R>]?: ValueOf<Ps[K]> }
>;

export const str = (description: string) => ({ type: 'string' as const, description });

const SHOWN = 30;
/** The value as the property wants it, or an error. Numbers and booleans sent as text are read; an enum value matches
 * ignoring case and spacing, by a band's words without its share, or as the start of exactly one option. */
function coerce(name: string, p: Prop, v: unknown): { v?: unknown; error?: string } {
    if (p.type === 'number') {
        const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
        return Number.isFinite(n) ? { v: n } : { error: `${name} must be a number` };
    }
    if (p.type === 'boolean') {
        if (typeof v === 'boolean') return { v };
        if (v === 'true' || v === 'false') return { v: v === 'true' };
        return { error: `${name} must be true or false` };
    }
    if (p.type === 'string') {
        // A one-item list where one value is wanted (who: ["Mary"]) is that value.
        if (Array.isArray(v) && v.length === 1 && (typeof v[0] === 'string' || typeof v[0] === 'number')) v = v[0];
        // Several texts where one is wanted (action: ["steps out", "walks to the stop"]) are one text, in their order.
        else if (Array.isArray(v) && v.length > 1 && v.every(x => typeof x === 'string')) v = v.join('; ');
        if (typeof v !== 'string' && typeof v !== 'number') return { error: `${name} must be text` };
        const s = String(v);
        // An enum filled from data that has not loaded yet checks nothing.
        if (!p.enum || !p.enum.length) return { v: s };
        const key = (x: string) => x.toLowerCase().replace(/\s+/g, ' ').trim();
        const head = (x: string) => key(x).split('(')[0].trim();
        const hit = p.enum.find(o => o === s) ?? p.enum.find(o => key(o) === key(s)) ?? (p.enum.filter(o => head(o) === head(s)).length === 1 ? p.enum.find(o => head(o) === head(s)) : undefined);
        if (hit) return { v: hit };
        // A labelled band ("50% half") also matches its words alone ("half").
        const words = (x: string) => key(x).replace(/^\d+(\.\d+)?\s*%\s*/, '');
        const label = p.enum.filter(o => words(o) === key(s));
        if (label.length === 1) return { v: label[0] };
        const starts = p.enum.filter(o => key(o).startsWith(key(s)));
        if (s.trim() && starts.length === 1) return { v: starts[0] };
        // A long list is shown as the options nearest the given words (shared words, then shorter first), so the call can be
        // corrected from what it meant ("dress (long sleeve, long)" → the long-sleeve dresses and gowns), not from the list's start.
        if (p.enum.length <= SHOWN) return { error: `${name}: choose from ${p.enum.join(' | ')} (got "${s}")` };
        const ws = (x: string) => new Set(key(x).split(/[^a-z0-9]+/).filter(w => w.length > 1));
        const want = ws(s), near = p.enum.map(o => { const ow = ws(o); return { o, n: [...want].filter(w => ow.has(w) || [...ow].some(v => v.includes(w) || w.includes(v))).length, l: o.length }; })
            .filter(x => x.n > 0).sort((a, b) => b.n - a.n || a.l - b.l).slice(0, 10).map(x => x.o);
        return { error: `${name}: choose from the nearest options to "${s}": ${near.length ? near.join(' | ') : p.enum.slice(0, SHOWN).join(' | ')} (${p.enum.length} options in all)` };
    }
    if (p.type === 'array') {
        const list = Array.isArray(v) ? v : [v];
        const out: unknown[] = [], errs: string[] = [];
        list.forEach((x, i) => { const r = coerce(`${name}[${i}]`, p.items, x); if (r.error) errs.push(r.error); else out.push(r.v); });
        return errs.length ? { error: errs.join('; ') } : { v: out };
    }
    // Models sometimes send an object as JSON text, or a name where an object with a "who" is expected.
    // Models sometimes send an object as JSON text, or the object's one main text where the object is wanted (a name for
    // {who}, an option's words for {option}): that text fills the first required text field.
    if (typeof v === 'string') {
        const t = v.trim(); try { const o = JSON.parse(t); if (o && typeof o === 'object' && !Array.isArray(o)) v = o; } catch { /* not JSON */ }
        const main = p.properties.who ? 'who' : (p.required ?? []).find(q => p.properties[q]?.type === 'string');
        if (typeof v === 'string' && main && t) v = { [main]: t };
    }
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return { error: `${name} must be an object` };
    const r = checkArgs(p.properties, p.required ?? [], v as Record<string, unknown>, `${name}.`);
    return r.errors.length ? { error: r.errors.join('; ') } : { v: r.args };
}

/**
 * Arguments as the schema wants them: required ones present, each value of its type (read from text where it can be),
 * keys the schema does not list dropped. Errors name each argument to fix.
 */
export function checkArgs(props: Props, required: readonly string[], args: Record<string, unknown>, prefix = ''): { args: Record<string, unknown>; errors: string[] } {
    const out: Record<string, unknown> = {}, errors: string[] = [];
    // An argument named a little off ("actions" for "action", "Who", "distance" for "distance_m") is read as the listed one
    // when exactly one listed name matches and that one is not given.
    const norm = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(es|s)$/, '');
    for (const k of Object.keys(args)) {
        if (k in props) continue;
        const hits = Object.keys(props).filter(q => norm(q) === norm(k) || norm(q) === `${norm(k)}m` || norm(q).replace(/(m|kg|c|pct|s)$/, '') === norm(k));
        if (hits.length === 1 && args[hits[0]] === undefined) args = { ...args, [hits[0]]: args[k] };
    }
    for (const k of required) if (args[k] === undefined || args[k] === null || args[k] === '') errors.push(`${prefix}${k} is required`);
    for (const [k, p] of Object.entries(props)) {
        if (args[k] === undefined || args[k] === null) continue;
        const r = coerce(`${prefix}${k}`, p, args[k]);
        if (r.error) errors.push(r.error); else out[k] = r.v;
    }
    return { args: out, errors };
}
