// JSON Schema for tool parameters, and the argument type each schema describes, so a tool's action is checked against
// the schema the model sees (one source for both).
export const str = (description) => ({ type: 'string', description });
const SHOWN = 30;
/** The value as the property wants it, or an error. Numbers and booleans sent as text are read; an enum value matches
 * ignoring case and spacing, by a band's words without its share, or as the start of exactly one option. */
function coerce(name, p, v) {
    if (p.type === 'number') {
        const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN;
        return Number.isFinite(n) ? { v: n } : { error: `${name} must be a number` };
    }
    if (p.type === 'boolean') {
        if (typeof v === 'boolean')
            return { v };
        if (v === 'true' || v === 'false')
            return { v: v === 'true' };
        return { error: `${name} must be true or false` };
    }
    if (p.type === 'string') {
        if (typeof v !== 'string' && typeof v !== 'number')
            return { error: `${name} must be text` };
        const s = String(v);
        // An enum filled from data that has not loaded yet checks nothing.
        if (!p.enum || !p.enum.length)
            return { v: s };
        const key = (x) => x.toLowerCase().replace(/\s+/g, ' ').trim();
        const hit = p.enum.find(o => o === s) ?? p.enum.find(o => key(o) === key(s));
        if (hit)
            return { v: hit };
        // A labelled band ("50% half") also matches its words alone ("half").
        const words = (x) => key(x).replace(/^\d+(\.\d+)?\s*%\s*/, '');
        const label = p.enum.filter(o => words(o) === key(s));
        if (label.length === 1)
            return { v: label[0] };
        const starts = p.enum.filter(o => key(o).startsWith(key(s)));
        if (s.trim() && starts.length === 1)
            return { v: starts[0] };
        return { error: `${name} "${s}" is not an option (${p.enum.length <= SHOWN ? p.enum.join(' | ') : `${p.enum.slice(0, SHOWN).join(' | ')} …`})` };
    }
    if (p.type === 'array') {
        const list = Array.isArray(v) ? v : [v];
        const out = [], errs = [];
        list.forEach((x, i) => { const r = coerce(`${name}[${i}]`, p.items, x); if (r.error)
            errs.push(r.error);
        else
            out.push(r.v); });
        return errs.length ? { error: errs.join('; ') } : { v: out };
    }
    if (typeof v !== 'object' || v === null || Array.isArray(v))
        return { error: `${name} must be an object` };
    const r = checkArgs(p.properties, p.required ?? [], v, `${name}.`);
    return r.errors.length ? { error: r.errors.join('; ') } : { v: r.args };
}
/**
 * Arguments as the schema wants them: required ones present, each value of its type (read from text where it can be),
 * keys the schema does not list dropped. Errors name each argument to fix.
 */
export function checkArgs(props, required, args, prefix = '') {
    const out = {}, errors = [];
    for (const k of required)
        if (args[k] === undefined || args[k] === null || args[k] === '')
            errors.push(`${prefix}${k} is required`);
    for (const [k, p] of Object.entries(props)) {
        if (args[k] === undefined || args[k] === null)
            continue;
        const r = coerce(`${prefix}${k}`, p, args[k]);
        if (r.error)
            errors.push(r.error);
        else
            out[k] = r.v;
    }
    return { args: out, errors };
}
