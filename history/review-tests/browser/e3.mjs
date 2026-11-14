// Usage: node serve.mjs <repo root> 8765 &  then  node e3.mjs 8765   (prints MISS <label> on a failed check)
// The extension's request hook in a browser page: a chat-completion payload with hidden marks leaves as notation.
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch(), page = await (await browser.newContext()).newPage(), errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.goto(`http://localhost:${process.argv[2] ?? '8765'}/__page.html`); await page.evaluate(() => window.__ready);
const out = await page.evaluate(async () => {
  window.__h.ccs = undefined;
  const VC = await import('/src/rules/voice-code.js');
  const r = VC.markWords('I say stop now', 6, 10, 'loud'), t = 'I say stop now'.slice(0, r.from) + r.insert + 'I say stop now'.slice(r.to);
  const data = { messages: [{ role: 'user', content: t }] };
  for (const f of window.__h['ccsr'] ?? []) f(data);
  return { content: data.messages[0].content, handlers: (window.__h['ccsr'] ?? []).length };
});
console.log(JSON.stringify(out), errs.join(' | ') || 'no page errors');
if (out.content !== 'I say STOP now') console.log('MISS a chat-completion request leaves with notation');
await browser.close();
