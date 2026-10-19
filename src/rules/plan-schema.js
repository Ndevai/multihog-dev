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
        return { type: 'array', items: propSchema(p.items, enumMax) };
    return { type: 'object', properties: Object.fromEntries(Object.entries(p.properties).map(([k, q]) => [k, propSchema(q, enumMax)])), required: [...(p.required ?? [])], additionalProperties: false };
}
/** The plan: calls of the named tools (all when none named), follow-on questions, tools wanted next, time, place, people. */
export function planSchema(only) {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const call = (t) => ({
        type: 'object', additionalProperties: false, required: ['tool', 'args'],
        properties: { tool: { const: t.name }, args: { type: 'object', additionalProperties: false, required: [...t.required], properties: Object.fromEntries(Object.entries(t.properties).map(([k, p]) => [k, propSchema(p)])) } },
    });
    return {
        type: 'object', additionalProperties: false, required: ['calls'],
        properties: {
            calls: { type: 'array', items: tools.length ? { anyOf: tools.map(call) } : {} },
            then: { type: 'array', items: { type: 'string' } },
            need: { type: 'array', items: { type: 'string', enum: [...REGISTRY.keys()] } },
            time: { type: 'string', pattern: '^(\\d{4}-\\d{2}-\\d{2}|Day \\d+) \\d{2}:\\d{2}$' },
            at: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            present: { type: 'array', items: { type: 'string' } },
        },
    };
}
