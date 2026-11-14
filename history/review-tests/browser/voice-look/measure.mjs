// Measures the chat's marked lines in Chromium: line spacing, word overlap, blur and empty letters.
// Usage: node measure.mjs <repo root> [look: distinct|plain] [font] [width]   prints MISS <label> on a failed check.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, look = 'distinct', font = 'Inter', width = '760'] = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff': 'font/woff' };
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><style>
:root { --SmartThemeBodyColor: rgb(220,220,210); --SmartThemeEmColor: rgb(145,145,145); --SmartThemeUnderlineColor: rgb(188,231,207); --SmartThemeQuoteColor: rgb(225,138,36);
  --SmartThemeBlurTintColor: rgba(23,23,23,1); --SmartThemeBorderColor: rgba(0,0,0,0.5); --mainFontSize: 15px; }
body { margin: 0; padding: 14px 18px; background: #171717; color: var(--SmartThemeBodyColor); font-family: '${font}', sans-serif; font-size: var(--mainFontSize); }
#chat { max-width: ${Number(width) - 36}px; } .mes { padding: 8px 12px 2px; margin-bottom: 6px; }
.mes_text { font-weight: 500; line-height: calc(var(--mainFontSize) + .5rem); padding: 5px 0; overflow-wrap: anywhere; } .mes_text p { margin: 0 0 6px; }
</style></head><body class="${look === 'distinct' ? 'rules-distinct' : ''}"><div id="chat"></div></body></html>`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 1 })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.route('http://rules.test/**', route => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    if (u === '/__page.html') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
    const f = path.join(root, u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: types[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
await page.goto('http://rules.test/__page.html');
const lines = JSON.parse(fs.readFileSync(new URL('./lines.json', import.meta.url), 'utf8')).filter(l => l.t);
const out = await page.evaluate(async ({ lines }) => {
    const VC = await import('/src/rules/voice-code.js'), U = await import('/src/ui.js');
    const isTag = c => { const p = c.codePointAt(0); return p >= 0xE0020 && p <= 0xE007F; };
    const mark = (t, pairs) => { for (const [w, id] of pairs) { const i = VC.visible(t).indexOf(w), cps = [...t];
        const rawAt = n => { let r = 0, s = 0; for (const c of cps) { if (!isTag(c)) { if (s === n) break; s += c.length; } r += c.length; } return r; };
        const r = VC.markWords(t, rawAt(i), rawAt(i + w.length), id); t = t.slice(0, r.from) + r.insert + t.slice(r.to); } return t; };
    const chat = document.getElementById('chat');
    const add = (nodes, feeling) => { const mes = document.createElement('div'); mes.className = 'mes'; const mt = document.createElement('div'); mt.className = 'mes_text'; const p = document.createElement('p'); p.append(...nodes); mt.appendChild(p); mes.appendChild(mt); chat.appendChild(mes);
        const f = feeling && mt.querySelector('.rules-v-add-feeling[data-feeling]')?.getAttribute('data-feeling'); if (f) mt.setAttribute('data-rules-feeling', f); return p; };
    if (U.lookVars) { for (const [k, v] of Object.entries(U.lookVars())) document.body.style.setProperty(`--rules-${k}`, String(v)); document.body.setAttribute('data-rules-tone', 'dark'); }
    await document.fonts.ready;
    const res = [];
    for (const l of lines) {
        // The marked line, and the same words unmarked (what the typesetting adds taken out), set in the same width.
        const marked = add(U.drawVoice(document, mark(l.t, l.m ?? [])), true), plain = add([document.createTextNode(l.t)], false);
        if (!U.lookVars) for (const e of marked.querySelectorAll('.rules-v-falsetto')) e.style.setProperty('--rules-w', `${e.offsetWidth}px`);
        // Each line of text: the tops of the boxes of its words, grouped by baseline row (a row is one line-height apart).
        const lh = parseFloat(getComputedStyle(plain).lineHeight);
        const rows = marked.getBoundingClientRect().height / lh;
        // Words drawn over each other: each marked word's box against the next text to its right on the same row.
        const overlaps = [];
        const spans = [...marked.querySelectorAll('.rules-v')];
        for (const s of spans) {
            const a = s.getBoundingClientRect(); let n = s.nextSibling; while (n && n.nodeType === 3 && !n.nodeValue.trim()) n = n.nextSibling;
            if (!n) continue; const range = document.createRange(); range.selectNodeContents(n); const b = range.getClientRects()[0];
            if (b && Math.abs(b.top - a.top) < lh / 2 && b.left < a.right - 1.5) overlaps.push(`${s.textContent}|${n.textContent.slice(0, 8)} ${(a.right - b.left).toFixed(1)}px`);
        }
        const styles = spans.concat([...marked.querySelectorAll('.rules-run')]).map(s => getComputedStyle(s));
        res.push({ cap: l.cap, lh, rows, plainRows: plain.getBoundingClientRect().height / lh, overlaps,
            blur: styles.filter(c => c.textShadow !== 'none' || c.filter !== 'none').length, hollow: styles.filter(c => c.webkitTextFillColor === 'rgba(0, 0, 0, 0)').length,
            hue: [...marked.querySelectorAll('.rules-v[data-pitch]')].map(s => getComputedStyle(s, '::before').backgroundColor).filter((v, i, a) => a.indexOf(v) === i),
            sizes: [...new Set(spans.map(s => Math.round(parseFloat(getComputedStyle(s).fontSize) * 100) / 100))] });
    }
    return res;
}, { lines });
let miss = 0;
const bad = (label, got) => { miss++; console.log(`MISS ${label}: ${got}`); };
for (const r of out) {
    const whole = Math.abs(r.rows - Math.round(r.rows)) < 0.02;
    console.log(`${(r.cap ?? '').slice(0, 58).padEnd(58)} rows ${r.rows.toFixed(3)} (unmarked ${r.plainRows.toFixed(3)})  overlaps ${r.overlaps.length}  blur ${r.blur}  hollow ${r.hollow}  curve ${r.hue.join(' ') || '-'}`);
    if (!whole) bad('every line keeps the line spacing', `${r.cap}: ${r.rows.toFixed(3)} rows of ${r.lh}px`);
    if (r.overlaps.length) bad('no word drawn over the next', `${r.cap}: ${r.overlaps.join('; ')}`);
    if (look === 'distinct' && (r.blur || r.hollow)) bad('no blurred or empty letters', `${r.cap}: blur ${r.blur}, hollow ${r.hollow}`);
}
console.log(`${look} look, ${font}, ${width}px: ${out.length - new Set(out.filter(r => Math.abs(r.rows - Math.round(r.rows)) >= 0.02 || r.overlaps.length || (look === 'distinct' && (r.blur || r.hollow))).map(r => r.cap)).size} of ${out.length} lines clean; ${errs.join(' | ') || 'no page errors'}`);
await browser.close();
process.exitCode = miss ? 1 : 0;
