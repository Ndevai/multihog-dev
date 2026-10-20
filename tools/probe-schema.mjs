// Checks which JSON-schema features the endpoint's constrained decoding takes, one feature per request, each in a schema
// whose answer shows whether the feature held. Writes probe-result.txt. Usage: node tools/probe-schema.mjs
import fs from 'node:fs';
const { findKey, BASE, MODEL } = await import('./nvidia.mjs');
const key = findKey();
await import('./st-harness.mjs');
const T = await import('../src/rules/rules-tools.js'); T.registerRulesTools(true);
const P = await import('../src/rules/plan-schema.js');
const obj = (properties, extra = {}) => ({ type: 'object', properties, ...extra });
const args = obj({ n: { type: 'integer' } }, { required: ['n'], additionalProperties: false });
const cases = {
    'plain keyed (additionalProperties schema)': [obj({ people: { type: 'object', additionalProperties: args, maxProperties: 3 } }, { required: ['people'], additionalProperties: false }), o => !!o.people],
    'propertyNames pattern': [obj({ people: { type: 'object', additionalProperties: args, propertyNames: { pattern: P.PERSON_KEY }, maxProperties: 3 } }, { required: ['people'], additionalProperties: false }), o => Object.keys(o.people).every(k => new RegExp(P.PERSON_KEY).test(k))],
    'propertyNames enum': [obj({ people: { type: 'object', additionalProperties: args, propertyNames: { enum: ['Mara', 'Tom'] }, maxProperties: 3 } }, { required: ['people'], additionalProperties: false }), o => Object.keys(o.people).every(k => ['Mara', 'Tom'].includes(k))],
    'propertyNames anyOf': [obj({ people: { type: 'object', additionalProperties: args, propertyNames: { anyOf: [{ enum: ['Mara'] }, { pattern: P.PERSON_KEY }] }, maxProperties: 3 } }, { required: ['people'], additionalProperties: false }), o => !!o.people],
    'minProperties': [obj({ people: { type: 'object', additionalProperties: args, minProperties: 1, maxProperties: 3 } }, { required: ['people'], additionalProperties: false }), o => Object.keys(o.people).length >= 1],
    'fixed properties, additionalProperties false': [obj({ people: { type: 'object', properties: { Mara: args, Tom: args }, additionalProperties: false } }, { required: ['people'], additionalProperties: false }), o => Object.keys(o.people).every(k => ['Mara', 'Tom'].includes(k))],
    'the plan schema (Act, Price, Look, Choose; people; Choose required)': [P.planSchema(new Set(['Act', 'Price', 'Look', 'Choose']), { people: ['Mara', 'Tom'], require: ['Choose'] }), o => !!o.calls],
    'the plan schema, no people, nothing required': [P.planSchema(new Set(['Act', 'Price', 'Look', 'Choose'])), o => !!o.calls],
};
const lines = [];
for (const [name, [schema, ok]] of Object.entries(cases)) {
    const t0 = Date.now();
    try {
        const r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'Mara and Tom are at an inn. Write the JSON the format asks for; for people use Mara and "the innkeeper"; n is any number.' }], max_tokens: 3000, temperature: 0, reasoning_effort: 'low', chat_template_kwargs: { reasoning_effort: 'low' }, response_format: { type: 'json_schema', json_schema: { name: 'probe', schema, strict: true } } }) });
        const text = await r.text();
        let out = ''; try { const j = JSON.parse(text); out = String(j.choices?.[0]?.message?.content ?? j.error?.message ?? text); } catch { out = text; }
        let pass = false; try { pass = ok(JSON.parse(out)); } catch { /* not JSON */ }
        lines.push(`${pass ? 'WORKS' : 'no   '} ${name.padEnd(62)} ${r.status} ${Math.round((Date.now() - t0) / 1000)} s → ${out.slice(0, 160).replace(/\n/g, ' ')}`);
    } catch (e) { lines.push(`error ${name}: ${e.message}`); }
    console.log(lines[lines.length - 1]);
    await new Promise(res => setTimeout(res, 3000));
}
fs.writeFileSync(new URL('../probe-result.txt', import.meta.url), lines.join('\n') + '\n');
