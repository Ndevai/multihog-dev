// The NVIDIA (OpenAI-compatible) connection the Termux runners share. The key is read locally from NVIDIA_API_KEY, else
// from SillyTavern's secrets file (any saved key starting with "nvapi-"); it is sent only to the API.
import fs from 'node:fs';
import os from 'node:os';
import crypto from 'node:crypto';
export const BASE = process.env.EVAL_BASE_URL ?? 'https://integrate.api.nvidia.com/v1';
export const MODEL = process.env.EVAL_MODEL ?? 'z-ai/glm-5.3';
export function findKey() {
    // The key is read out of whatever the variable holds (a secret saved with its name in front of the key still works).
    if (process.env.NVIDIA_API_KEY) return process.env.NVIDIA_API_KEY.match(/nvapi-[A-Za-z0-9_\-]+/)?.[0] ?? process.env.NVIDIA_API_KEY.trim();
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
// Constrained decoding for the plan, as tools/probe-guided.mjs found the endpoint honours it: EVAL_GUIDED=nvext (nvext.guided_json),
// vllm (guided_json), openai (response_format json_schema, the default: the probe found it and guided_json honoured for
// GLM-5.3, nvext refused); EVAL_GUIDED=off sends no schema.
export const GUIDED = process.env.EVAL_GUIDED ?? 'openai';
const guide = schema => !schema || !GUIDED || GUIDED === 'off' ? {} : GUIDED === 'nvext' ? { nvext: { guided_json: schema } } : GUIDED === 'vllm' ? { guided_json: schema } : { response_format: { type: 'json_schema', json_schema: { name: 'plan', schema, strict: true } } };
// A refused or empty answer is never passed on as an answer: a 429 (rate limit) waits and retries, an empty reply (no text,
// or the whole budget spent thinking) is asked again, and after the last try the call throws with what happened, so a run
// shows "the model did not answer" instead of turns that silently ran nothing.
export const TRIES = Number(process.env.EVAL_TRIES ?? 5);
// Answers are kept in a file, keyed by everything the request sends (temperature 0, so the same request gets the same
// answer): a rerun after a fix asks the model only the calls whose prompt the fix changed, and replays the rest at once.
// EVAL_CACHE=off asks every call again.
export const CACHE = process.env.EVAL_CACHE ?? new URL('../answers-cache.jsonl', import.meta.url).pathname;
const cache = new Map(), use = CACHE !== 'off';
if (use && fs.existsSync(CACHE)) for (const line of fs.readFileSync(CACHE, 'utf8').split('\n')) { try { const { h, out } = JSON.parse(line); cache.set(h, out); } catch { /* blank or cut line */ } }
export const cacheCount = { hit: 0, asked: 0 };
export async function send(system, user, opts = {}, model = MODEL) {
    const h = crypto.createHash('sha256').update(JSON.stringify([model, EFFORT, system, user, opts?.schema ?? null])).digest('hex');
    if (use && cache.has(h)) { cacheCount.hit++; return cache.get(h); }
    cacheCount.asked++;
    const out = await ask(system, user, opts, model);
    if (use) { cache.set(h, out); fs.appendFileSync(CACHE, JSON.stringify({ h, out }) + '\n'); }
    return out;
}
async function ask(system, user, opts, model) {
    // Retries as Simulation Blackboard's retry.js decides them (src/rules/retry.ts): temporary errors only, the server's
    // Retry-After or 60 s doubling to 240 s, a cooldown over 10 minutes handed back. An empty answer is asked again.
    const { retryInfo, retryDelay } = await import('../src/rules/retry.js');
    let last = '';
    for (let attempt = 0; attempt < TRIES; attempt++) {
        let r;
        try {
            r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], temperature: 0, max_tokens: 8192, stream: true,
                    reasoning_effort: EFFORT, chat_template_kwargs: { reasoning_effort: EFFORT }, ...guide(opts?.schema) }) });
        } catch (e) { last = String(e.message ?? e); await new Promise(res => setTimeout(res, 5000 * (attempt + 1))); continue; }
        if (!r.ok) {
            const body = await r.text(), info = retryInfo(r.status, (() => { try { return JSON.parse(body); } catch { return body; } })(), r.headers.get('retry-after'));
            last = `${r.status} ${body.slice(0, 200)}`;
            const wait = retryDelay(info, attempt, TRIES - 1);
            if (wait === null) break;
            console.log(`  ${r.status}: waiting ${Math.round(wait / 1000)} s (try ${attempt + 1} of ${TRIES})`);
            await new Promise(res => setTimeout(res, wait)); continue;
        }
        let out = '', thought = 0, finish = '', buf = '';
        const dec = new TextDecoder();
        for await (const chunk of r.body) {
            buf += dec.decode(chunk, { stream: true });
            let i; while ((i = buf.indexOf('\n')) >= 0) {
                const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
                if (!line.startsWith('data:') || line === 'data: [DONE]') continue;
                try { const c = JSON.parse(line.slice(5)).choices?.[0]; out += c?.delta?.content ?? ''; thought += (c?.delta?.reasoning_content ?? c?.delta?.reasoning ?? '').length; finish = c?.finish_reason ?? finish; } catch { /* partial line */ }
            }
        }
        if (out.trim()) return out;
        last = `empty answer (finish ${finish || 'none'}, ${thought} characters of thinking)`;
        console.log(`  ${last}; asking again (try ${attempt + 1} of ${TRIES})`);
    }
    throw new Error(`the model did not answer after ${TRIES} tries: ${last}`);
}

