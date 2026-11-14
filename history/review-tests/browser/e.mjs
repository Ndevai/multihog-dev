// Area E in a real browser (Chromium via Playwright): the extension's index.js loaded in a stand-in SillyTavern page.
// Usage: node serve.mjs <repo root> 8765 &  then  node e.mjs 8765   (prints MISS <label> on a failed check)
import { createRequire } from 'node:module'; const { chromium } = createRequire(import.meta.url)('playwright');
const port = process.argv[2] ?? '8765';
const browser = await chromium.launch();
const out = (k, v) => console.log(`${k}: ${v}`);
async function open(opts = {}) {
  const ctx = await browser.newContext(opts), page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e))); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://localhost:${port}/__page.html`); await page.evaluate(() => window.__ready);
  return { page, errs, ctx };
}
const TAGS = s => [...s].filter(c => c.codePointAt(0) >= 0xE0020 && c.codePointAt(0) <= 0xE007F).length;
{ // E1 keyboard: words selected in the box, Tab
  const { page, errs } = await open();
  await page.focus('#send_textarea'); await page.keyboard.type('I say stop now');
  await page.evaluate(() => { const b = document.getElementById('send_textarea'); b.setSelectionRange(6, 10); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForTimeout(50);
  const shown = await page.evaluate(() => !document.getElementById('rules-voice').hidden);
  await page.keyboard.press('Tab'); await page.waitForTimeout(50);
  const after = await page.evaluate(() => ({ focus: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName, inBar: document.getElementById('rules-voice').contains(document.activeElement), hidden: document.getElementById('rules-voice').hidden }));
  out('E1 toolbar shown with words selected', shown); out('E1 after Tab', JSON.stringify(after));
  if (!after.inBar) console.log('MISS Tab from the box enters the toolbar while it shows');
  // Shift+Tab steps
  await page.focus('#send_textarea'); await page.evaluate(() => { const b = document.getElementById('send_textarea'); b.setSelectionRange(6, 10); document.dispatchEvent(new Event('selectionchange')); });
  const path = [];
  for (let i = 0; i < 4; i++) { await page.keyboard.press('Shift+Tab'); await page.waitForTimeout(30); path.push(await page.evaluate(() => `${document.activeElement?.id || document.activeElement?.textContent?.slice(0, 12)}${document.getElementById('rules-voice').hidden ? '' : '[bar shown]'}`)); }
  out('E1 Shift+Tab path', path.join(' → ')); if (errs.length) out('E1 errors', errs.join(' | ').slice(0, 300));
}
{ // E2 mark by mouse, then Backspace and Delete next to the marks
  const { page } = await open();
  await page.focus('#send_textarea'); await page.keyboard.type('I say stop now');
  await page.evaluate(() => { const b = document.getElementById('send_textarea'); b.setSelectionRange(6, 10); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForTimeout(50);
  await page.click('#rules-voice button[title="Volume: louder"]');
  const v1 = await page.$eval('#send_textarea', b => b.value);
  out('E2 marked', JSON.stringify([...v1].map(c => c.codePointAt(0) > 0xE0000 ? `<${String.fromCharCode(c.codePointAt(0) - 0xE0000)}>` : c).join('')));
  // caret right after the block (end of "stop" + block)
  await page.evaluate(() => { const b = document.getElementById('send_textarea'); const i = b.value.indexOf(' now'); b.focus(); b.setSelectionRange(i, i); });
  await page.keyboard.press('Backspace');
  const v2 = await page.$eval('#send_textarea', b => b.value);
  out('E2 after Backspace', JSON.stringify([...v2].map(c => c.codePointAt(0) > 0xE0000 ? `<${String.fromCharCode(c.codePointAt(0) - 0xE0000)}>` : c).join('')));
  await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowLeft');
  const caret = await page.$eval('#send_textarea', b => b.selectionStart);
  out('E2 caret after two ArrowLeft from after the block', caret);
  await page.keyboard.press('Control+z');
  const v3 = await page.$eval('#send_textarea', b => b.value);
  out('E2 after undo', JSON.stringify([...v3].map(c => c.codePointAt(0) > 0xE0000 ? `<${String.fromCharCode(c.codePointAt(0) - 0xE0000)}>` : c).join('')));
}
{ // E3 touch: words selected, the toolbar button tapped
  const { page } = await open({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 800 } });
  await page.tap('#send_textarea'); await page.keyboard.type('I say stop now');
  await page.evaluate(() => { const b = document.getElementById('send_textarea'); b.setSelectionRange(6, 10); document.dispatchEvent(new Event('selectionchange')); });
  await page.waitForTimeout(50);
  const vis = await page.evaluate(() => !document.getElementById('rules-voice').hidden);
  const box = await page.$('#rules-voice button[title="Volume: louder"]');
  await box.tap(); await page.waitForTimeout(100);
  const v = await page.$eval('#send_textarea', b => b.value);
  out('E3 touch: bar shown before tap', vis); out('E3 touch: hidden codes after tapping "louder"', TAGS(v));
  if (!TAGS(v)) console.log('MISS a touch tap on the toolbar marks the selected words');
  out('E3 focus after tap', await page.evaluate(() => document.activeElement?.id));
}
{ // E4 typeset twice, re-render
  const { page } = await open();
  const res = await page.evaluate(async () => {
    const VC = await import('/src/rules/voice-code.js');
    const r = VC.markWords('I say stop now', 6, 10, 'loud'), mes = 'I say stop now'.slice(0, r.from) + r.insert + 'I say stop now'.slice(r.to);
    const t = document.querySelector('#chat .mes_text'); t.textContent = mes;
    const fire = e => (window.__h[e] ?? []).forEach(f => f());
    fire('umr'); const a = t.innerHTML; fire('umr'); fire('cmr'); const b = t.innerHTML;
    return { same: a === b, spans: t.querySelectorAll('.rules-v').length, html: b.slice(0, 160) };
  });
  out('E4 typeset idempotent', JSON.stringify(res));
}
await browser.close();
