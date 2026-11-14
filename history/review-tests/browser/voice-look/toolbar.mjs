// The extension loaded as SillyTavern loads it (a stand-in page and context, as history/review-tests/browser/page.html), to
// draw the voice toolbar and a chat line through index.js itself. Usage: node toolbar.mjs <repo root> <out.png> [font]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, out, font = 'Inter'] = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff': 'font/woff', '.html': 'text/html' };
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="/style.css"><style>
:root { --SmartThemeBodyColor: rgb(220,220,210); --SmartThemeEmColor: rgb(145,145,145); --SmartThemeUnderlineColor: rgb(188,231,207); --SmartThemeQuoteColor: rgb(225,138,36);
  --SmartThemeBlurTintColor: rgba(23,23,23,1); --SmartThemeBorderColor: rgba(0,0,0,0.5); --mainFontSize: 15px; --interactable-outline-color: #888; }
body { margin: 0; padding: 14px 18px; background: #171717; color: var(--SmartThemeBodyColor); font-family: '${font}', sans-serif; font-size: var(--mainFontSize); width: 900px }
.mes { padding: 8px 12px 2px; margin-bottom: 10px; background: rgba(0,0,0,.3); border-radius: 8px } .mes_block { padding-left: 10px; overflow-x: hidden }
.mes_text { font-weight: 500; line-height: calc(var(--mainFontSize) + .5rem); padding: 5px 0; overflow-wrap: anywhere; } .mes_text p { margin: 0 }
#send_form{display:flex; border: 1px solid #333; border-radius: 0 0 10px 10px} #nonQRFormItems{display:flex;flex:1} textarea{flex:1;height:44px;font:15px '${font}';background:#111;color:inherit;border:0;padding:8px}
</style></head><body>
<div id="chat"><div class="mes" mesid="0" is_user="true"><div class="mes_block"><div class="mes_text"></div></div></div></div>
<div id="form_sheld"><form id="send_form"><div id="nonQRFormItems"><div id="leftSendForm"><div id="options_button" tabindex="0">≡</div></div>
<textarea id="send_textarea"></textarea><div id="rightSendForm"><div id="send_but" tabindex="0">send</div></div></div></form></div><div id="extensions_settings2"></div>
<script>
window.toastr = { info(){}, warning(){}, success(){} }; window.__h = {};
const ctx = { chatMetadata: {}, chat: [], extensionSettings: {}, eventSource: { on(e, f) { (window.__h[e] ??= []).push(f); } },
  eventTypes: { MESSAGE_RECEIVED: 'mr', CHAT_COMPLETION_SETTINGS_READY: 'ccsr', TEXT_COMPLETION_SETTINGS_READY: 'tcsr', GENERATION_STARTED: 'gs', MESSAGE_SWIPED: 'ms', CHAT_CHANGED: 'cc', MESSAGE_DELETED: 'md', USER_MESSAGE_RENDERED: 'umr', CHARACTER_MESSAGE_RENDERED: 'cmr', MESSAGE_UPDATED: 'mu', MORE_MESSAGES_LOADED: 'mml' },
  setExtensionPrompt() {}, saveSettingsDebounced() {}, registerFunctionTool() {}, unregisterFunctionTool() {}, saveMetadata: async () => {}, saveMetadataDebounced() {},
  renderExtensionTemplateAsync: async () => (await fetch('/settings.html')).text(), POPUP_TYPE: { TEXT: 1, INPUT: 2 }, callGenericPopup: async () => null,
  getCurrentChatId: () => 'c1', characters: [], writeExtensionField: async () => {}, generate: async () => {} };
window.SillyTavern = { getContext: () => ctx };
window.__ready = import('/src/index.js').then(() => new Promise(r => { const t = setInterval(() => { if (document.getElementById('rules-voice')) { clearInterval(t); r(true); } }, 50); }));
</script></body></html>`;
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 940, height: 500 }, deviceScaleFactor: 2 })).newPage();
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
await page.evaluate(() => window.__ready);
const info = await page.evaluate(async () => {
    const VC = await import('/src/rules/voice-code.js');
    // A player's line with marks, drawn by the extension's own handler for a rendered message.
    let t = 'Fine. I never said that, and you know it.';
    for (const [w, id] of [['never', 'up'], ['never', 'down'], ['never', 'loud'], ['know', 'stress'], ['Fine', 'feeling:anger']]) { const i = VC.visible(t).indexOf(w); let raw = 0, seen = 0; for (const c of t) { const p = c.codePointAt(0); if (!(p >= 0xE0020 && p <= 0xE007F)) { if (seen === i) break; seen += c.length; } raw += c.length; } const r = VC.markWords(t, raw + 1, raw + 1, id); t = t.slice(0, r.from) + r.insert + t.slice(r.to); }
    document.querySelector('.mes_text').textContent = t;
    window.SillyTavern.getContext().chat.push({ is_user: true, mes: t });
    for (const f of window.__h['umr'] ?? []) f(0);
    document.getElementById('rules-voice').hidden = false;
    const mt = document.querySelector('.mes_text');
    return { body: document.body.className, tone: document.body.getAttribute('data-rules-tone'), vars: document.body.getAttribute('style'), feeling: mt.getAttribute('data-rules-feeling'), html: mt.innerHTML.replace(/[\u{E0000}-\u{E007F}]/gu, '').slice(0, 900),
        title: mt.querySelector('.rules-v')?.title, bar: document.getElementById('rules-voice').getBoundingClientRect().height };
});
await page.waitForTimeout(150);
await page.screenshot({ path: out, fullPage: true });
console.log(JSON.stringify(info, null, 1), errs.join(' | ') || 'no page errors');
await browser.close();
