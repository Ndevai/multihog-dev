import { REGISTRY } from './rules-tools.js';
/** One argument's schema; long lists of options stay as text (the tool answers with the nearest options). */
export function propSchema(p, enumMax = 200) {
    if (p.type === 'string')
        return p.enum && p.enum.length && p.enum.length <= enumMax ? { type: 'string', enum: [...p.enum] } : p.pattern ? { type: 'string', pattern: p.pattern } : { type: 'string' };
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
    // A blow is keyed by who strikes it, the one acting; its who is the one struck (a plan keyed by the struck wrote Jack's
    // punch as the sailor's).
    if (tool === 'BodyStrike')
        return 'attacker';
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
            out.push({ tool, args: tool === 'Price' && subject === 'other good' ? { ...args } : tool === 'Price' && questions.includes(subject) ? { question: subject, ...args } : { [key]: subject, ...args } });
        }
    }
    return out;
}
/** A person as a call names them: a name as the story writes it ("Mara", "Will Doyle") or a role ("the innkeeper", "the man by
 *  the fire"): capitalized words, or "the" and up to four lower-case words. The people the story already holds are listed as
 *  fixed keys in the schema, so their names are written as stored. */
export const PERSON_KEY = "^(?:[A-Z][A-Za-z'-]*\\.?(?: [A-Z][A-Za-z'-]*){0,2}|the(?: [a-z0-9'-]+){1,4})$";
const PERSON_ARGS = new Set(['who', 'speaker', 'listener', 'viewer', 'attacker']);
const PERSON_VALUE = new Set(['who', 'speaker', 'listener', 'viewer', 'attacker', 'pursuer', 'fleeing', 'target_who', 'requester_name']);
/** The plan: one entry per tool (of the named tools, all when none named), each holding one call per subject; follow-on
 *  questions, each with the tool that answers it; tools wanted next; time, place, people. In a follow-on round, `require`
 *  names the tools the last round's questions asked for: the plan holds a call of each. */
/** Tools for a body's own effort and motion. In a turn's first round their keys are the people the player's message moves
 *  (the player's character and anyone the message names); another person's climb or walk follows from their choice, in a
 *  later round. A first round copied Mara's climb under "the merchant", and the reply had to tell him climbing a wall. */
export const ACTOR_TOOLS = new Set(['Act', 'BodyCheck', 'BodyFall', 'HoldOn', 'Chase', 'BodyIntake', 'WorkOut', 'BodyStrike']);
export function planSchema(only, opts = {}) {
    const tools = [...REGISTRY.values()].filter(t => !only || only.has(t.name));
    const people = opts.people ?? [];
    // A person argument inside a call (the listener, the target) takes one of the scene's people.
    const argsOf = (t, drop, self) => ({
        type: 'object', additionalProperties: false, required: t.required.filter(k => k !== drop),
        properties: Object.fromEntries(Object.entries(t.properties).filter(([k]) => k !== drop).map(([k, p]) => [k, people.length && PERSON_VALUE.has(k) && p.type === 'string' ? { type: 'string', enum: people.filter(n => n !== self) } : propSchema(p)])),
    });
    const require = new Set((opts.require ?? []).filter(n => tools.some(t => t.name === n)));
    const entry = (t) => {
        const key = subjectOf(t.name);
        if (!key)
            return argsOf(t, null);
        const used = opts.used?.get(t.name) ?? new Set();
        // A tool is required only while it has a key left to write under.
        const open = PERSON_ARGS.has(key) ? (ACTOR_TOOLS.has(t.name) && opts.actors?.length ? opts.actors : people).some(n => !used.has(n)) || !people.length || t.name === 'NewCharacter' : true;
        const args = argsOf(t, key), min = require.has(t.name) && open ? { minProperties: 1 } : {};
        if (require.has(t.name) && !open)
            require.delete(t.name);
        // A subject with a fixed list (Price's goods) takes those keys only.
        const listed = t.properties[key]?.enum;
        // Price also takes "other good": a good outside the list, with good and like (vodka was keyed under apples for want of it).
        if (listed?.length)
            return { type: 'object', properties: { ...Object.fromEntries(listed.filter(v => !used.has(v)).map(v => [v, args])), ...t.name === 'Price' ? { 'other good': { ...args, required: [...args.required, 'good', 'like'] } } : {} }, additionalProperties: false, maxProperties: 6, ...min };
        // Bounded: under constrained decoding a model can repeat one call until the token limit cuts the JSON.
        // The scene's people (scene-people.ts) are the keys a person-keyed tool takes; NewCharacter also takes a new one. The
        // endpoint refuses propertyNames (tools/probe-schema.mjs: HTTP 400), so the closed set is written as fixed properties.
        // Under each person's key, the other person a call names (the listener, the attacker, the one chased) is one of the
        // others: a speaker's listener list leaves the speaker out.
        // A later round of the same turn (repair, follow-on) holds the keys its earlier rounds left: one call per tool and
        // person in the whole turn (a repair added a second BodyFall for Mara after the first had run).
        const keys = ACTOR_TOOLS.has(t.name) && opts.actors?.length ? opts.actors : people;
        if (PERSON_ARGS.has(key))
            return keys.length
                ? { type: 'object', properties: Object.fromEntries(keys.filter(n => !used.has(n)).map(n => [n, argsOf(t, key, n)])), additionalProperties: t.name === 'NewCharacter' ? args : false, maxProperties: 6, ...min }
                : { type: 'object', additionalProperties: args, maxProperties: 6, ...min };
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
