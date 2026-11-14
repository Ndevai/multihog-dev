// Draws the player's marked lines as the chat shows them, in Chromium, from a given tree of the extension.
// Usage: node specimen.mjs <repo root> <out.png> [look: distinct|plain] [font] [theme: dark|light] [width]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, out, look = 'distinct', font = 'Inter', theme = 'dark', width = '760'] = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff': 'font/woff', '.html': 'text/html' };

// SillyTavern's default theme variables and message type (public/style.css :root, .mes_text), written from its stylesheet.
const dark = `--SmartThemeBodyColor: rgb(220,220,210); --SmartThemeEmColor: rgb(145,145,145); --SmartThemeUnderlineColor: rgb(188,231,207); --SmartThemeQuoteColor: rgb(225,138,36);
  --SmartThemeBlurTintColor: rgba(23,23,23,1); --SmartThemeBorderColor: rgba(0,0,0,0.5); --page: #171717; --bubble: rgba(0,0,0,0.3);`;
const light = `--SmartThemeBodyColor: rgb(40,40,40); --SmartThemeEmColor: rgb(110,110,110); --SmartThemeUnderlineColor: rgb(60,120,90); --SmartThemeQuoteColor: rgb(150,80,10);
  --SmartThemeBlurTintColor: rgba(245,245,240,1); --SmartThemeBorderColor: rgba(0,0,0,0.2); --page: #f3f2ee; --bubble: rgba(255,255,255,0.6);`;
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><style>
:root { ${theme === 'light' ? light : dark} --mainFontSize: 15px; --interactable-outline-color: #888; }
body { margin: 0; padding: 14px 18px; background: var(--page); color: var(--SmartThemeBodyColor); font-family: '${font}', sans-serif; font-size: var(--mainFontSize); }
#chat { max-width: ${Number(width) - 36}px; }
.mes { padding: 8px 12px 2px; margin-bottom: 6px; background: var(--bubble); border-radius: 8px; }
.mes_text { font-weight: 500; line-height: calc(var(--mainFontSize) + .5rem); padding: 5px 0; overflow-wrap: anywhere; }
.mes_text p { margin: 0 0 6px; }
.cap { font: 11px/1.3 monospace; color: var(--SmartThemeEmColor); margin: 0 0 3px; opacity: .8 }
h4 { font: 600 12px/1.2 sans-serif; margin: 10px 0 6px; color: var(--SmartThemeEmColor); letter-spacing: .04em; text-transform: uppercase }
</style></head><body class="${look === 'distinct' ? 'rules-distinct' : ''}"><div id="chat"></div></body></html>`;

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: 2 })).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await page.route('http://rules.test/**', route => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    if (u === '/__page.html') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
    const f = path.join(root, u);
    if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: types[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
await page.goto('http://rules.test/__page.html');
const lines = JSON.parse(fs.readFileSync(new URL('./lines.json', import.meta.url), 'utf8'));
const info = await page.evaluate(async ({ lines }) => {
    const VC = await import('/src/rules/voice-code.js'), U = await import('/src/ui.js');
    // A line's marks: [words, mark] pairs; the words are found in the text and marked as the toolbar marks a selection.
    const mark = (t, pairs) => {
        for (const [w, id] of pairs) {
            const vis = VC.visible(t), i = vis.indexOf(w);
            if (i < 0) throw new Error(`no "${w}" in "${vis}"`);
            // Positions in the text with its hidden codes: walk the visible index to the raw one.
            let raw = 0, seen = 0; const cps = [...t];
            const isTag = c => { const p = c.codePointAt(0); return p >= 0xE0020 && p <= 0xE007F; };
            const rawAt = n => { let r = 0, s = 0; for (const c of cps) { if (!isTag(c)) { if (s === n) break; s += c.length; } r += c.length; } return r; };
            const s0 = rawAt(i), e0 = rawAt(i + w.length);
            const r = VC.markWords(t, s0, e0, id);
            if (!r) throw new Error(`no mark ${id} on ${w}`);
            t = t.slice(0, r.from) + r.insert + t.slice(r.to);
        }
        return t;
    };
    const chat = document.getElementById('chat');
    for (const l of lines) {
        if (l.h) { const h = document.createElement('h4'); h.textContent = l.h; chat.appendChild(h); continue; }
        const mes = document.createElement('div'); mes.className = 'mes'; mes.setAttribute('is_user', 'true');
        if (l.cap) { const c = document.createElement('p'); c.className = 'cap'; c.textContent = l.cap; mes.appendChild(c); }
        const mt = document.createElement('div'); mt.className = 'mes_text';
        const p = document.createElement('p'); p.append(...U.drawVoice(document, mark(l.t, l.m ?? [])));
        mt.appendChild(p); mes.appendChild(mt); chat.appendChild(mes);
        const f = mt.querySelector('.rules-v-add-feeling[data-feeling]')?.getAttribute('data-feeling');
        if (f) mt.setAttribute('data-rules-feeling', f);
    }
    // The extension's own pass over the drawn chat (index.ts): the earlier tree measures squeezed words, the later one sets
    // the look's sizes and the theme's tone on the page.
    if (U.lookVars) { for (const [k, v] of Object.entries(U.lookVars())) document.body.style.setProperty(`--rules-${k}`, String(v)); document.body.setAttribute('data-rules-tone', U.toneOf(getComputedStyle(document.documentElement).getPropertyValue('--SmartThemeBodyColor'))); }
    else for (const e of document.querySelectorAll('#chat .rules-v-falsetto')) e.style.setProperty('--rules-w', `${e.offsetWidth}px`);
    await document.fonts.ready;
    return { font: getComputedStyle(document.body).fontFamily };
}, { lines });
await page.waitForTimeout(150);
await page.screenshot({ path: out, fullPage: true });
console.log(out, JSON.stringify(info), errs.join(' | ') || 'no page errors');
await browser.close();
