// Measures whether two NVIDIA keys share one rate limit: 50 one-token requests in a burst on key A alone, then (after a
// minute's rest) 25 on A and 25 on B at once. Separate limits: the split burst gets fewer 429s than the single one.
// Reads NVIDIA_KEY_A and NVIDIA_KEY_B. Writes probe-result.txt. Usage: node tools/probe-rate.mjs
import fs from 'node:fs';
const BASE = 'https://integrate.api.nvidia.com/v1', MODEL = process.env.EVAL_MODEL ?? 'z-ai/glm-5.3';
const pick = v => String(v ?? '').match(/nvapi-[A-Za-z0-9_\-]+/)?.[0];
const A = pick(process.env.NVIDIA_KEY_A), B = pick(process.env.NVIDIA_KEY_B);
const lines = [];
const say = s => { console.log(s); lines.push(s); };
if (!A || !B) { say(`needs two keys: A ${A ? 'found' : 'missing'}, B ${B ? 'found' : 'missing'}`); fs.writeFileSync(new URL('../probe-result.txt', import.meta.url), lines.join('\n') + '\n'); process.exit(0); }
const one = key => fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: 'Say ok.' }], max_tokens: 1, temperature: 0 }) }).then(r => r.status).catch(() => 0);
const burst = async keys => { const s = await Promise.all(keys.map(one)); return { n: s.length, ok: s.filter(x => x === 200).length, limited: s.filter(x => x === 429).length, other: s.filter(x => x !== 200 && x !== 429).join(',') }; };
const single = await burst(Array(50).fill(A));
say(`50 on key A alone: ${single.ok} answered, ${single.limited} rate-limited ${single.other ? `(other: ${single.other})` : ''}`);
await new Promise(r => setTimeout(r, 70000));
const split = await burst([...Array(25).fill(A), ...Array(25).fill(B)]);
say(`25 on A + 25 on B: ${split.ok} answered, ${split.limited} rate-limited ${split.other ? `(other: ${split.other})` : ''}`);
say(single.limited === 0 ? 'No limit reached with 50: the test is too small to tell.' : split.limited < single.limited / 2 ? 'The two keys have separate limits.' : 'The two keys share one limit.');
fs.writeFileSync(new URL('../probe-result.txt', import.meta.url), lines.join('\n') + '\n');
