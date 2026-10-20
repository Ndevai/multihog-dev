// The plan as a JSON schema built from the tools' own argument schemas, for constrained decoding: the server lets the model
// write only tokens that keep the output valid against the schema (Willard & Louf 2023, Outlines; Dong et al. 2024,
// XGrammar), so a call has the arguments its tool takes in the shapes it takes them, instead of code reading them back out of
// free text afterwards. The calls are keyed by tool, then by the person or thing each is about (subjectOf).
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
/** The argument that names what a call is about: one call per tool and subject in a turn (one Act per person, one Price per
 *  good, one Communicate per speaker). A plan written as a list let one turn ask the ale's price in five cities and split one
 *  walk into three Acts; keyed by subject, a plan holds each question once by its shape. Tools with none of these take one call. */
const SUBJECT_KEYS = ['who', 'speaker', 'listener', 'viewer', 'item', 'room', 'fact'];
export function subjectOf(tool: string): string | null {
    if (tool === 'Price') return 'item';
    const t = REGISTRY.get(tool);
    return t ? SUBJECT_KEYS.find(k => k in t.properties) ?? null : null;
}
/** A keyed plan's calls as a list, in the order written: {"Act": {"Mara": {...}}, "Weather": {...}} → [{tool, args}]. Price's
 *  key is the good, or the question when it is one ("daily wage"). */
export function callsFromKeyed(calls: Record<string, unknown>): { tool: string; args: Record<string, unknown> }[] {
    const out: { tool: string; args: Record<string, unknown> }[] = [];
    for (const [tool, v] of Object.entries(calls ?? {})) {
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
        const key = subjectOf(tool);
        if (!key) { out.push({ tool, args: v as Record<string, unknown> }); continue; }
        for (const [subject, args] of Object.entries(v as Record<string, unknown>)) {
            if (!args || typeof args !== 'object' || Array.isArray(args)) continue;
            const questions = tool === 'Price' ? (REGISTRY.get('Price')?.properties.question as { enum?: string[] } | undefined)?.enum ?? [] : [];
            out.push({ tool, args: tool === 'Price' && questions.includes(subject) ? { question: subject, ...args } : { [key]: subject, ...args } });
        }
    }
    return out;
}
/** The plan: one entry per tool (of the named tools, all when none named), each holding one call per subject; follow-on
 *  questions, tools wanted next, time, place, people. */
export function planSchema(only?: Set<string>): Schema {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const argsOf = (t: (typeof tools)[number], drop: string | null): Schema => ({
        type: 'object', additionalProperties: false, required: t.required.filter(k => k !== drop),
        properties: Object.fromEntries(Object.entries(t.properties).filter(([k]) => k !== drop).map(([k, p]) => [k, propSchema(p as Prop)])),
    });
    const entry = (t: (typeof tools)[number]): Schema => {
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
