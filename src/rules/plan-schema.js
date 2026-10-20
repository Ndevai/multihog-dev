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
/** The plan: one entry per tool (of the named tools, all when none named), each holding one call per subject; follow-on
 *  questions, tools wanted next, time, place, people. */
export function planSchema(only) {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const argsOf = (t, drop) => ({
        type: 'object', additionalProperties: false, required: t.required.filter(k => k !== drop),
        properties: Object.fromEntries(Object.entries(t.properties).filter(([k]) => k !== drop).map(([k, p]) => [k, propSchema(p)])),
    });
    const entry = (t) => {
        const key = subjectOf(t.name);
        // Bounded: under constrained decoding a model can repeat one call until the token limit cuts the JSON.
        return key ? { type: 'object', additionalProperties: argsOf(t, key), maxProperties: 6 } : argsOf(t, null);
    };
    return {
        type: 'object', additionalProperties: false, required: ['calls'],
        properties: {
            calls: { type: 'object', additionalProperties: false, properties: Object.fromEntries(tools.map(t => [t.name, entry(t)])) },
            then: { type: 'array', items: { type: 'string' }, maxItems: 4 },
            need: { type: 'array', items: { type: 'string', enum: [...REGISTRY.keys()] }, maxItems: 6 },
            time: { type: 'string', pattern: '^(\\d{4}-\\d{2}-\\d{2}|Day \\d+) \\d{2}:\\d{2}$' },
            at: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            present: { type: 'array', items: { type: 'string' }, maxItems: 12 },
        },
    };
}
