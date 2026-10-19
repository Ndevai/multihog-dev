// The plan as a JSON schema built from the tools' own argument schemas, for constrained decoding: the server lets the model
// write only tokens that keep the output valid against the schema (Willard & Louf 2023, Outlines; Dong et al. 2024,
// XGrammar), so a call has the arguments its tool takes in the shapes it takes them, instead of code reading them back out of
// free text afterwards. Each call is one of the tools: {"tool": its name, "args": its arguments}.
import type { Prop } from './tool-schema.js';
import { REGISTRY } from './rules-tools.js';

type Schema = Record<string, unknown>;
/** One argument's schema; long lists of options stay as text (the tool answers with the nearest options). */
export function propSchema(p: Prop, enumMax = 200): Schema {
    if (p.type === 'string') return p.enum && p.enum.length && p.enum.length <= enumMax ? { type: 'string', enum: [...p.enum] } : { type: 'string' };
    if (p.type === 'number') return { type: 'number' };
    if (p.type === 'boolean') return { type: 'boolean' };
    if (p.type === 'array') return { type: 'array', items: propSchema(p.items, enumMax), maxItems: 12 };
    return { type: 'object', properties: Object.fromEntries(Object.entries(p.properties).map(([k, q]) => [k, propSchema(q, enumMax)])), required: [...(p.required ?? [])], additionalProperties: false };
}
/** The plan: calls of the named tools (all when none named), follow-on questions, tools wanted next, time, place, people. */
export function planSchema(only?: Set<string>): Schema {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const call = (t: (typeof tools)[number]): Schema => ({
        type: 'object', additionalProperties: false, required: ['tool', 'args'],
        properties: { tool: { const: t.name }, args: { type: 'object', additionalProperties: false, required: [...t.required], properties: Object.fromEntries(Object.entries(t.properties).map(([k, p]) => [k, propSchema(p as Prop)])) } },
    });
    return {
        type: 'object', additionalProperties: false, required: ['calls'],
        properties: {
            // Bounded lists: under constrained decoding a model can repeat one call until the token limit cuts the JSON (a Room
            // call 30 times over in a York inn turn, BodyFall in Lisbon), and the plan is lost.
            calls: { type: 'array', items: tools.length ? { anyOf: tools.map(call) } : {}, maxItems: 8 },
            then: { type: 'array', items: { type: 'string' }, maxItems: 4 },
            need: { type: 'array', items: { type: 'string', enum: [...REGISTRY.keys()] }, maxItems: 6 },
            time: { type: 'string', pattern: '^(\\d{4}-\\d{2}-\\d{2}|Day \\d+) \\d{2}:\\d{2}$' },
            at: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
            present: { type: 'array', items: { type: 'string' }, maxItems: 12 },
        },
    };
}
