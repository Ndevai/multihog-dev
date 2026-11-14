// Usage: import { call, m } from "./tools/st-harness.mjs"; m.setStoryTime(...); await call("Weather", { place: "Recife" }).
// Runs the extension's tools in Node the way SillyTavern would: a fake context, fetch read from the repo's files.
import fs from 'node:fs';
// Runs repeat: each chat's salt (crypto.getRandomValues) and Math.random come from one fixed seed (mulberry32), so a
// statistical check counts the same sample on every run and a test result never depends on the run. RULES_TEST_SEED=<n>
// takes another sample; RULES_TEST_SEED=random draws afresh, to look for checks whose bounds sit too close.
const SEED = process.env.RULES_TEST_SEED ?? '1';
if (SEED !== 'random') {
    let a = (Number(SEED) >>> 0) || 1;
    const next = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    Math.random = next;
    const real = globalThis.crypto.getRandomValues.bind(globalThis.crypto);
    globalThis.crypto.getRandomValues = arr => { if (!(arr instanceof Uint32Array)) return real(arr); for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(next() * 4294967296); return arr; };
}
const REPO = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const tools = new Map(); let turn = 0;
const ctx = { chatMetadata: {}, chat: [{ mes: 'start', is_user: true }], registerFunctionTool: t => tools.set(t.name, t), unregisterFunctionTool: n => tools.delete(n),
    saveMetadata: () => {}, saveMetadataDebounced: () => {}, extensionSettings: {}, eventSource: { on() {}, emit() {} }, event_types: {} };
globalThis.SillyTavern = { getContext: () => ctx };
const realFetch = globalThis.fetch;
globalThis.fetch = async (u, o) => {
    const s = String(u);
    if (s.startsWith('file:')) { const f = new URL(s).pathname; if (!fs.existsSync(f)) return { ok: false, status: 404, json: async () => null, text: async () => '' }; const b = fs.readFileSync(f); return { ok: true, status: 200, json: async () => JSON.parse(b), text: async () => String(b), arrayBuffer: async () => b }; }
    if (/^https?:/.test(s)) return realFetch(u, o);
    const p = s.replace(/^.*?\/(rules|src|data)\//, (m, d) => `${REPO}/${d}/`).replace(/^\//, REPO + '/');
    const f = [p, `${REPO}/${s.replace(/^\.?\//, '')}`, `${REPO}/src/rules/${s.replace(/^.*\//, '')}`].find(x => fs.existsSync(x));
    if (!f) return { ok: false, status: 404, json: async () => null, text: async () => '' };
    const b = fs.readFileSync(f);
    return { ok: true, status: 200, json: async () => JSON.parse(b), text: async () => String(b), arrayBuffer: async () => b };
};
const m = await import(`${REPO}/src/rules/rules-tools.js`);
// The data the extension loads at start-up (src/index.ts).
const R = `${REPO}/src/rules`;
await Promise.all([(await import(`${R}/things.js`)).loadThings(), (await import(`${R}/colex.js`)).loadColex(), (await import(`${R}/languages.js`)).loadLanguageYears(),
    (await import(`${R}/history.js`)).loadChat(), (await import(`${R}/population.js`)).loadPopulation()]);
m.registerRulesTools(true);
export async function call(name, args) { ctx.chat.push({ mes: `turn ${++turn}`, is_user: true }); return tools.get(name).action(args); }
export { tools, ctx, m };
