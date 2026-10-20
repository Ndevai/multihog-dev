import { REGISTRY } from './rules-tools.js';
/** One argument's schema; long lists of options stay as text (the tool answers with the nearest options). */
export function propSchema(p, enumMax = 200) {
    if (p.type === 'string')
        return p.enum && p.enum.length && p.enum.length <= enumMax ? { type: 'string', enum: [...p.enum] } : { type: 'string' };
    if (p.type === 'number')
        return { type: 'number' };
    if (p.type === 'boolean')
        return { type: 'boolean' };
    if (p.type === 'array')
        return { type: 'array', items: propSchema(p.items, enumMax), maxItems: 12 };
    return { type: 'object', properties: Object.fromEntries(Object.entries(p.properties).map(([k, q]) => [k, propSchema(q, enumMax)])), required: [...(p.required ?? [])], additionalProperties: false };
}
/** The argument that names what a call is about: one call per tool and subject in a turn (one Act per person, one Price per
 *  good, one Communicate per speaker). A plan written as a list let one turn ask the ale's price in five cities and split one
 *  walk into three Acts; keyed by subject, a plan holds each question once by its shape. Tools with none of these take one call. */
const SUBJECT_KEYS = ['who', 'speaker', 'listener', 'viewer', 'item', 'room', 'fact'];
export function subjectOf(tool) {
    if (tool === 'Price')
        return 'item';
    const t = REGISTRY.get(tool);
    return t ? SUBJECT_KEYS.find(k => k in t.properties) ?? null : null;
}
/** A keyed plan's calls as a list, in the order written: {"Act": {"Mara": {...}}, "Weather": {...}} → [{tool, args}]. Price's
 *  key is the good, or the question when it is one ("daily wage"). */
export function callsFromKeyed(calls) {
    const out = [];
    for (const [tool, v] of Object.entries(calls ?? {})) {
        if (!v || typeof v !== 'object' || Array.isArray(v))
            continue;
        const key = subjectOf(tool);
        if (!key) {
            out.push({ tool, args: v });
            continue;
        }
        for (const [subject, args] of Object.entries(v)) {
            if (!args || typeof args !== 'object' || Array.isArray(args))
                continue;
            const questions = tool === 'Price' ? REGISTRY.get('Price')?.properties.question?.enum ?? [] : [];
            out.push({ tool, args: tool === 'Price' && questions.includes(subject) ? { question: subject, ...args } : { [key]: subject, ...args } });
        }
    }
    return out;
}
/** The keys a person-keyed tool takes: a name as the story writes it ("Mara", "Will Doyle") or a role ("the innkeeper", "the
 *  man by the fire"): capitalized words, or "the" and up to four lower-case words. The people the story already holds are
 *  listed as fixed keys, so their names are written as stored. */
export const PERSON_KEY = "^(?:[A-Z][A-Za-z'-]*(?: [A-Z][A-Za-z'-]*){0,2}|the(?: [a-z0-9'-]+){1,4})$";
const PERSON_ARGS = new Set(['who', 'speaker', 'listener', 'viewer']);
/** The plan: one entry per tool (of the named tools, all when none named), each holding one call per subject; follow-on
 *  questions, each with the tool that answers it; tools wanted next; time, place, people. In a follow-on round, `require`
 *  names the tools the last round's questions asked for: the plan holds a call of each. */
export function planSchema(only, opts = {}) {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const argsOf = (t, drop) => ({
        type: 'object', additionalProperties: false, required: t.required.filter(k => k !== drop),
        properties: Object.fromEntries(Object.entries(t.properties).filter(([k]) => k !== drop).map(([k, p]) => [k, propSchema(p)])),
    });
    const require = new Set((opts.require ?? []).filter(n => tools.some(t => t.name === n)));
    const entry = (t) => {
        const key = subjectOf(t.name);
        if (!key)
            return argsOf(t, null);
        const args = argsOf(t, key), min = require.has(t.name) ? { minProperties: 1 } : {};
        // A subject with a fixed list (Price's goods) takes those keys only.
        const listed = t.properties[key]?.enum;
        if (listed?.length)
            return { type: 'object', properties: Object.fromEntries(listed.map(v => [v, args])), additionalProperties: false, maxProperties: 6, ...min };
        // Bounded: under constrained decoding a model can repeat one call until the token limit cuts the JSON.
        if (PERSON_ARGS.has(key))
            return { type: 'object', properties: Object.fromEntries((opts.people ?? []).map(n => [n, args])), additionalProperties: args, propertyNames: opts.people?.length ? { anyOf: [{ enum: opts.people }, { pattern: PERSON_KEY }] } : { pattern: PERSON_KEY }, maxProperties: 6, ...min };
        return { type: 'object', additionalProperties: args, maxProperties: 6, ...min };
    };
    return {
        type: 'object', additionalProperties: false, required: ['calls'],
        properties: {
            calls: { type: 'object', additionalProperties: false, properties: Object.fromEntries(tools.map(t => [t.name, entry(t)])), required: [...require] },
            then: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['question', 'tool'], properties: { question: { type: 'string' }, tool: { type: 'string', enum: [...REGISTRY.keys()] } } }, maxItems: 4 },
            need: { type: 'array', items: { type: 'string', enum: [...REGISTRY.keys()] }, maxItems: 6 },
            time: { type: 'string', pattern: '^(\\d{4}-\\d{2}-\\d{2}|Day \\d+) \\d{2}:\\d{2}$' },
            at: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            present: { type: 'array', items: { type: 'string' }, maxItems: 12 },
        },
    };
}
