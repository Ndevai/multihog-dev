// JSON Schema for tool parameters, and the argument type each schema describes, so a tool's action is checked against
// the schema the model sees (one source for both).

export type Prop =
    | { type: 'string'; enum?: readonly string[]; description?: string }
    | { type: 'number'; description?: string }
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
        if (typeof v !== 'string' && typeof v !== 'number') return { error: `${name} must be text` };
        const s = String(v);
        // An enum filled from data that has not loaded yet checks nothing.
        if (!p.enum || !p.enum.length) return { v: s };
        const key = (x: string) => x.toLowerCase().replace(/\s+/g, ' ').trim();
        const hit = p.enum.find(o => o === s) ?? p.enum.find(o => key(o) === key(s));
        if (hit) return { v: hit };
        // A labelled band ("50% half") also matches its words alone ("half").
        const words = (x: string) => key(x).replace(/^\d+(\.\d+)?\s*%\s*/, '');
        const label = p.enum.filter(o => words(o) === key(s));
        if (label.length === 1) return { v: label[0] };
        const starts = p.enum.filter(o => key(o).startsWith(key(s)));
        if (s.trim() && starts.length === 1) return { v: starts[0] };
        return { error: `${name} "${s}" is not an option (${p.enum.length <= SHOWN ? p.enum.join(' | ') : `${p.enum.slice(0, SHOWN).join(' | ')} …`})` };
    }
    if (p.type === 'array') {
        const list = Array.isArray(v) ? v : [v];
        const out: unknown[] = [], errs: string[] = [];
        list.forEach((x, i) => { const r = coerce(`${name}[${i}]`, p.items, x); if (r.error) errs.push(r.error); else out.push(r.v); });
        return errs.length ? { error: errs.join('; ') } : { v: out };
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
    for (const k of required) if (args[k] === undefined || args[k] === null || args[k] === '') errors.push(`${prefix}${k} is required`);
    for (const [k, p] of Object.entries(props)) {
        if (args[k] === undefined || args[k] === null) continue;
        const r = coerce(`${prefix}${k}`, p, args[k]);
        if (r.error) errors.push(r.error); else out[k] = r.v;
    }
    return { args: out, errors };
}
