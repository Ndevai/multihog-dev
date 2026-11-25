// Real SillyTavern (ST_URL, default http://127.0.0.1:8000) with the extension linked as data/default-user/extensions/multihog-dev:
// EXT_BEFORE or EXT_AFTER (two checkouts of this repository; git worktree gives the earlier one). ST_DIR is SillyTavern's checkout.
// Usage: ST_DIR=… EXT_BEFORE=… EXT_AFTER=… node shoot.mjs <variant: before|after> <outdir>
// The phone's keyboard is drawn later (compose.mjs); here it is the viewport's height: open = screen − keyboard, as Android
// Chrome gives SillyTavern's page (interactive-widget=resizes-content). Open only while #send_textarea has the focus.
import fs from 'fs';
import { seed } from './seed.mjs';
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const [variant, out] = process.argv.slice(2);
const EXT = { before: process.env.EXT_BEFORE, after: process.env.EXT_AFTER }[variant], ST = process.env.ST_DIR, URL = process.env.ST_URL ?? 'http://127.0.0.1:8000/';
const link = `${ST}/data/default-user/extensions/multihog-dev`;
fs.rmSync(link, { force: true }); fs.symlinkSync(EXT, link);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const meta = [];
async function open(w, h) {
  // Each page starts from the same settings and chat: a tap on AUTO is saved to SillyTavern's settings, a step to the chat.
  await seed(ST);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForSelector('.recentChat .characterName', { timeout: 60000 });
  await page.click('.recentChat .characterName');
  await page.waitForFunction(() => document.querySelectorAll('#chat .mes').length >= 5 && document.querySelector('#chat .rules-unit-now'), null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  return { ctx, page };
}
const tapEl = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(500); };
async function beat(page, which) {
  // The NVL beat opens first (the last message's first box); the short beat is message 3 ("You are in my glade").
  for (let i = 0; i < 12 && which === 'short'; i++) { if ((await page.textContent('#rules-box-count')).startsWith('3 /')) break; await page.evaluate(() => document.getElementById('rules-box-back').click()); await page.waitForTimeout(250); }
}
async function typing(page, w, hOpen) {
  await page.focus('#send_textarea'); await page.keyboard.type('I open the shutters');
  await page.setViewportSize({ width: w, height: hOpen }); await page.waitForTimeout(700);
}
async function shot(page, name, w, hFull, hOpen, note) {
  const st = await page.evaluate(() => {
    const ta = document.getElementById('send_textarea'), r = s => document.querySelector(s)?.getBoundingClientRect();
    const chat = r('#chat'), tag = r('#chat .rules-now .rules-who'), form = r('#send_form');
    return { focused: document.activeElement === ta, nvl: document.body.classList.contains('rules-box-nvl'), count: document.getElementById('rules-box-count')?.textContent,
      tagTop: tag && chat ? Math.round(tag.top - chat.top) : null, formBottom: Math.round(form.bottom), vh: innerHeight, folded: document.body.classList.contains('rules-top-folded') };
  });
  // Keyboard closed (focus gone): the page gets the whole screen back, as on the phone.
  if (!st.focused && st.vh !== hFull) { await page.setViewportSize({ width: w, height: hFull }); await page.waitForTimeout(600); st.vh = hFull; }
  await page.screenshot({ path: `${out}/${name}.png`, caret: 'initial' });
  meta.push({ name, w, hFull, keyboard: st.focused ? hFull - hOpen : 0, note, ...st });
}
// Sheet A: small phones with the keyboard open (keyboard heights [ASSUMED]: what is left of the screen under the page).
for (const [b, hFull, hOpen] of [['short', 720, 380], ['short', 640, 340], ['nvl', 640, 340], ['nvl', 720, 480]]) {
  const { ctx, page } = await open(360, hFull); await beat(page, b); await typing(page, 360, hOpen);
  await shot(page, `A-${b}-${hOpen}`, 360, hFull, hOpen, `${b === 'nvl' ? 'NVL beat' : 'short beat'}: 360 × ${hFull} screen, page ${hOpen} px with the keyboard open`);
  meta.at(-1).pillEnd = await page.evaluate(() => { const p = document.querySelector('#chat .rules-now button.rules-mode'); if (!p) return null; const r = p.getBoundingClientRect(), e = document.elementFromPoint(r.right - 6, r.top + r.height / 2); return { x: r.right - 6, y: r.top + r.height / 2, to: e?.closest?.('#rules-top-fold') ? '▲' : e?.closest?.('button.rules-mode') ? 'SPEAKING' : (e?.id || e?.className || '').toString().slice(0, 40) }; });
  await ctx.close();
}
// Sheet C: the welcome screen (no chat open) on a 360 × 640 phone.
{
  await seed(ST);
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); await page.goto(URL); await page.waitForSelector('.recentChat .characterName'); await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/C-welcome.png` });
  const bar = await page.evaluate(() => { const b = document.getElementById('rules-box-bar'); return !!b && !b.hidden && getComputedStyle(b).display !== 'none'; });
  meta.push({ name: 'C-welcome', w: 360, hFull: 640, vh: 640, keyboard: 0, note: `SillyTavern's welcome screen, no chat open: the box's menu ${bar ? 'drawn over the recent chats' : 'not drawn'}` });
  await ctx.close();
}
// Sheet B: a 412 × 915 phone typing (keyboard 330 px [ASSUMED], page 585 px), then a tap on ▲, AUTO, Story.
{
  const { ctx, page } = await open(412, 915); await beat(page, 'short'); await typing(page, 412, 585);
  await shot(page, 'B-0-typing', 412, 915, 585, 'typing');
  for (const [i, sel, label] of [[1, '#rules-top-fold', 'tap ▲'], [2, '#rules-box-auto', 'tap AUTO'], [3, '#rules-box-next', 'tap ▶'], [4, '#rules-box-story', 'tap Story']]) {
    if (!(await page.evaluate(() => document.activeElement === document.getElementById('send_textarea')))) { await page.setViewportSize({ width: 412, height: 915 }); await page.focus('#send_textarea'); await page.setViewportSize({ width: 412, height: 585 }); await page.waitForTimeout(500); }
    await tapEl(page, sel); await shot(page, `B-${i}`, 412, 915, 585, label);
    if (sel === '#rules-box-story') break;
  }
  await ctx.close();
}
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 1));
console.log(meta.map(m => `${m.name}: ${m.note} | focused=${m.focused} kb=${m.keyboard} tagTop=${m.tagTop} formBottom=${m.formBottom}/${m.vh} nvl=${m.nvl} ${m.count} folded=${m.folded}`).join('\n'));
await browser.close();
