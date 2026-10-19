// The NVIDIA (OpenAI-compatible) connection the Termux runners share. The key is read locally from NVIDIA_API_KEY, else
// from SillyTavern's secrets file (any saved key starting with "nvapi-"); it is sent only to the API.
import fs from 'node:fs';
import os from 'node:os';
export const BASE = process.env.EVAL_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
export const MODEL = process.env.EVAL_MODEL ?? 'z-ai/glm-5.3';
export function findKey() {
    if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY;
    for (const f of [`${os.homedir()}/SillyTavern/data/default-user/secrets.json`, `${os.homedir()}/SillyTavern/secrets.json`]) {
        if (!fs.existsSync(f)) continue;
        const m = fs.readFileSync(f, 'utf8').match(/nvapi-[A-Za-z0-9_\-]+/);
        if (m) return m[0];
    }
    return null;
}
const key = findKey();
if (!key) { console.log('No NVIDIA key found. Run: NVIDIA_API_KEY=nvapi-... node tools/<runner>.mjs'); process.exit(1); }

// Streaming, so the connection is not dropped while the model thinks (a non-streamed answer sends no headers until it is
// finished: scene 2 timed out after 300 s). GLM-5.3 has no switch to turn thinking off; its chat template reads
// reasoning_effort ('low' or 'high'; anything else is maximum) (vLLM issue 54744). EVAL_EFFORT=high to test the default.
export const EFFORT = process.env.EVAL_EFFORT ?? 'low';
export async function send(system, user, model = MODEL) {
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

