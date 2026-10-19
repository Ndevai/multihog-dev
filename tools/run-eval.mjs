// Runs /rules-eval in Termux instead of the browser, so it keeps going when you switch apps. It calls the model directly
// (OpenAI-compatible API, NVIDIA by default) with the same two steps as play, prints the report and saves it to eval-result.txt.
// Usage (in Termux, from the extension folder):
//   node tools/run-eval.mjs [scenes] [model]        e.g. node tools/run-eval.mjs 10 z-ai/glm-5.3
// The API key is read from NVIDIA_API_KEY, else from SillyTavern's secrets file (any saved key starting with "nvapi-").
import fs from 'node:fs';
import os from 'node:os';
const [nArg = '10', model = 'z-ai/glm-5.3'] = process.argv.slice(2);
const BASE = process.env.EVAL_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';

function findKey() {
    if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY;
    for (const f of [`${os.homedir()}/SillyTavern/data/default-user/secrets.json`, `${os.homedir()}/SillyTavern/secrets.json`]) {
        if (!fs.existsSync(f)) continue;
        const m = fs.readFileSync(f, 'utf8').match(/nvapi-[A-Za-z0-9_\-]+/);
        if (m) return m[0];
    }
    return null;
}
const key = findKey();
if (!key) { console.log('No NVIDIA key found. Run: NVIDIA_API_KEY=nvapi-... node tools/run-eval.mjs 10'); process.exit(1); }

await import('./st-harness.mjs');
const E = await import('../src/rules/eval.js'), S = await import('../src/rules/eval-scenes.js');

// Streaming, so the connection is not dropped while the model thinks (a non-streamed answer sends no headers until it is
// finished: scene 2 timed out after 300 s). GLM-5.3 has no switch to turn thinking off; its chat template reads
// reasoning_effort ('low' or 'high'; anything else is maximum) (vLLM issue 54744). EVAL_EFFORT=high to test the default.
const EFFORT = process.env.EVAL_EFFORT ?? 'low';
async function send(system, user) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0, max_tokens: 8192, stream: true,
                    reasoning_effort: EFFORT, chat_template_kwargs: { reasoning_effort: EFFORT } }) });
            if (r.status === 429) { await new Promise(res => setTimeout(res, 15000 * attempt)); continue; }
            if (!r.ok) throw new Error(`${r.status} ${(await r.text()).slice(0, 200)}`);
            let out = '', buf = '';
            const dec = new TextDecoder();
            for await (const chunk of r.body) {
                buf += dec.decode(chunk, { stream: true });
                let i; while ((i = buf.indexOf('\n')) >= 0) {
                    const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
                    if (!line.startsWith('data:') || line === 'data: [DONE]') continue;
                    try { out += JSON.parse(line.slice(5)).choices?.[0]?.delta?.content ?? ''; } catch { /* partial line */ }
                }
            }
            return out;
        } catch (e) { if (attempt === 3) throw e; await new Promise(res => setTimeout(res, 5000)); }
    }
    return '';
}

const scenes = S.EVAL_SCENES.slice(0, Number(nArg) || 10);
const t0 = Date.now();
const report = await E.runEval(send, scenes, (d, t) => console.log(`scene ${d}/${t} done (${Math.round((Date.now() - t0) / 1000)} s)`));
const text = `${model}, reasoning ${EFFORT}, ${Math.round((Date.now() - t0) / 60000)} min, ${new Date().toISOString()}\n${E.reportText(report)}`;
fs.writeFileSync(new URL('../eval-result.txt', import.meta.url), text + '\n');
console.log('\n' + text + '\n\nSaved to eval-result.txt');
