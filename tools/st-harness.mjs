// Usage: import { call, m } from "./tools/st-harness.mjs"; m.setStoryTime(...); await call("Weather", { place: "Recife" }).
// Runs the extension's tools in Node the way SillyTavern would: a fake context, fetch read from the repo's files.
import fs from 'node:fs';
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
m.registerRulesTools(true);
export async function call(name, args) { ctx.chat.push({ mes: `turn ${++turn}`, is_user: true }); return tools.get(name).action(args); }
export { tools, ctx, m };
