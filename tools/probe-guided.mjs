// Checks which constrained-decoding switch the NVIDIA endpoint honours for a model: each is sent with a schema the model
// would not follow by itself (a field "zebra" that must be 7), and passes when the answer is exactly that. Usage:
//   node tools/probe-guided.mjs [model]
const { findKey, BASE, MODEL } = await import('./nvidia.mjs');
const model = process.argv[2] ?? MODEL, key = findKey();
const schema = { type: 'object', properties: { zebra: { type: 'integer', enum: [7] } }, required: ['zebra'], additionalProperties: false };
const ways = {
    'nvext.guided_json': { nvext: { guided_json: schema } },
    'guided_json (vLLM)': { guided_json: schema },
    'response_format json_schema': { response_format: { type: 'json_schema', json_schema: { name: 'probe', schema, strict: true } } },
    'nvext.guided_choice': { nvext: { guided_choice: ['zebra seven'] } },
};
for (const [name, extra] of Object.entries(ways)) {
    const t0 = Date.now();
    try {
        const r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Write one short sentence about the weather.' }], max_tokens: 2000, temperature: 0, reasoning_effort: 'low', chat_template_kwargs: { reasoning_effort: 'low' }, ...extra }) });
        const j = await r.json(), out = String(j.choices?.[0]?.message?.content ?? j.error?.message ?? JSON.stringify(j)).trim();
        const ok = name.includes('choice') ? out === 'zebra seven' : (() => { try { return JSON.parse(out).zebra === 7; } catch { return false; } })();
        console.log(`${ok ? 'WORKS ' : 'no    '} ${name.padEnd(30)} ${r.status} ${Math.round((Date.now() - t0) / 1000)} s  → ${out.slice(0, 100).replace(/\n/g, ' ')}`);
    } catch (e) { console.log(`error  ${name}: ${e.message}`); }
}
