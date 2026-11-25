// The screens added in v20–v24 (the clock chip, the scene screens, the Story sheet's Memory, Time and Book, a person's card, the
// log, the draft sheet), each drawn in real SillyTavern for one checkout of this repository, with the measures that judge them.
// Usage: ST_DIR=… EXT_BEFORE=… EXT_AFTER=… node tour.mjs <before|after> <outdir>; then compose.mjs <dir> D|E|F.
import fs from 'fs';
import { seed } from './seed.mjs';
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const [variant, out] = process.argv.slice(2);
const EXT = { before: process.env.EXT_BEFORE, after: process.env.EXT_AFTER }[variant], ST = process.env.ST_DIR, URL = process.env.ST_URL ?? 'http://127.0.0.1:8000/';
const link = `${ST}/data/default-user/extensions/multihog-dev`;
fs.rmSync(link, { force: true }); fs.symlinkSync(EXT, link); fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch(), meta = [], only = (process.env.TOUR_ONLY ?? 'D,E,F,G,H,I,J,K').split(','), run = g => only.includes(g);
async function open(w = 412, h = 915) {
  await seed(ST);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage(); const errors = [];
  page.on('pageerror', e => { if (!/Internal S/.test(e.message)) errors.push(e.message); }); page.on('console', m => { if (m.type() === 'error' && /rules|Rules/.test(m.text())) errors.push(m.text().slice(0, 160)); });
  await page.goto(URL); await page.waitForSelector('.recentChat .characterName', { timeout: 60000 }); await page.click('.recentChat .characterName');
  await page.waitForFunction(() => document.querySelectorAll('#chat .mes').length >= 5 && document.querySelector('#chat .rules-unit-now'), null, { timeout: 30000 });
  await page.waitForTimeout(1200);
  return { ctx, page, errors };
}
const tap = async (page, sel, opt) => { const l = opt ? page.locator(sel, opt).first() : page.locator(sel).first(); const b = await l.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(700); };
const toShort = async page => { for (let i = 0; i < 12; i++) { if ((await page.textContent('#rules-box-count')).startsWith('3 /')) break; await page.evaluate(() => document.getElementById('rules-box-back').click()); await page.waitForTimeout(250); } };
// Redraw the box as a reply would, without a step: a setting turned off and on again (each runs showBox).
const redraw = page => page.evaluate(() => { const c = document.getElementById('rules_engine_page'); for (let i = 0; i < 2; i++) { c.checked = !c.checked; c.dispatchEvent(new Event('change')); } });
async function shot(page, errors, name, note, extra = {}) {
  const m = await page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight, over = [];
    // Visible text that runs past the screen's edges, or is cut by its box (a scroll box's own overflow is its scroll).
    for (const e of document.querySelectorAll('#rules-sheet *, #rules-interstitial *, #rules-box-scene *, #rules-draft-sheet *, #rules-person *, .rules-card *')) {
      const r = e.getBoundingClientRect(); if (!r.width || getComputedStyle(e).visibility === 'hidden') continue;
      if ((r.right > vw + 1 || r.left < -1) && e.children.length === 0 && e.textContent.trim()) over.push(`${e.className || e.tagName}: ${Math.round(r.left)}–${Math.round(r.right)}`);
    }
    return { vw, vh, over: over.slice(0, 6) };
  });
  await page.screenshot({ path: `${out}/${name}.png`, caret: 'initial' });
  meta.push({ name, w: m.vw, hFull: extra.hFull ?? m.vh, vh: m.vh, keyboard: extra.keyboard ?? 0, note, overflow: m.over, errors: [...errors] });
}
if (run('D')) {
// D: the box. The NVL beat and a short beat with the clock chip; the scene screens as a reply that moves the story brings them.
{ const { ctx, page, errors } = await open(); await shot(page, errors, 'D-1', 'The last message: an NVL beat, the clock chip at the top');
  await toShort(page); await shot(page, errors, 'D-2', 'A short spoken beat'); await ctx.close(); }
// The first change after the chat opens, then a second one after Continue.
{ const { ctx, page, errors } = await open();
  await page.evaluate(() => { const s = SillyTavern.getContext().chatMetadata.rulesEngine.state; s.setting = { place: 'igarassu', label: 'Igarassu', country: 'Brazil' }; s.clock = { t: s.clock.t + 50, add: 0 }; });
  await redraw(page); await page.waitForTimeout(900); await shot(page, errors, 'D-3', 'First change after opening the chat: a new place ("Arriving..")');
  if (await page.locator('body.rules-interstitial-on .rules-interstitial-btn').count()) await tap(page, '.rules-interstitial-btn');
  await page.evaluate(() => { const s = SillyTavern.getContext().chatMetadata.rulesEngine.state; s.clock = { t: s.clock.t + 185, add: 0 }; });
  await redraw(page); await page.waitForTimeout(900); await shot(page, errors, 'D-4', 'Second change: three hours later ("Passing..")'); await ctx.close(); }
}
if (run('E')) {
// E: the Story sheet (Memory, Time, Book) and a person's card.
{ const { ctx, page, errors } = await open();
  await tap(page, '#rules-box-story'); await shot(page, errors, 'E-1', 'Story: Memory');
  await tap(page, '.rules-sheet-tabs button', { hasText: 'Time' }); await shot(page, errors, 'E-2', 'Story: Time (the timeline)');
  const prev = page.locator('#rules-sheet button[aria-label*="arlier" i], #rules-sheet .rules-time-step, #rules-sheet button:has-text("‹")').first();
  if (await prev.count()) { const b = await prev.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(700); await shot(page, errors, 'E-2b', 'Time: one step back (‹)'); }
  await tap(page, '.rules-sheet-tabs button', { hasText: 'Book' }); await shot(page, errors, 'E-3', 'Story: Book (two scenes; the first woven, folded)');
  await page.evaluate(() => { const d = document.querySelector('#rules-sheet details.rules-chron-scene:not(.is-live)'); if (d) d.open = true; const t = d?.querySelector('details.rules-chron-threads'); if (t) t.open = true; });
  await page.waitForTimeout(300);
  if (await page.locator('#rules-sheet .rules-chron-thread').count()) await tap(page, '#rules-sheet .rules-chron-thread');
  await page.evaluate(() => document.querySelector('#rules-sheet .rules-chron-threads')?.scrollIntoView({ block: 'center' })); await page.waitForTimeout(400);
  await shot(page, errors, 'E-4', 'Book: chapter 1 open, its first thread ticked'); await ctx.close(); }
{ const { ctx, page, errors } = await open(); await toShort(page);
  await tap(page, '#chat .rules-now .rules-who'); await shot(page, errors, 'E-5', "Seraphina's card (a tap on the name tag)"); await ctx.close(); }
}
if (run('F')) {
// F: the log and the draft sheet.
{ const { ctx, page, errors } = await open(); await tap(page, '#rules-box-log'); await page.waitForTimeout(500); await shot(page, errors, 'F-1', 'The log (the whole chat)'); await ctx.close(); }
{ const { ctx, page, errors } = await open();
  await page.focus('#send_textarea'); await page.keyboard.type('I take the bowl in both hands and drink slowly, watching Seraphina move about the room, and then I ask her, quietly, what it was that found me in the forest, and whether it will come back for me tonight.');
  await page.setViewportSize({ width: 412, height: 585 }); await page.waitForTimeout(700);
  await shot(page, errors, 'F-2', 'Typing a long line: ⤢ opens the draft sheet', { hFull: 915, keyboard: 330 });
  if (await page.locator('#rules-draft-expand:not([hidden])').count()) { await tap(page, '#rules-draft-expand'); await shot(page, errors, 'F-3', 'The draft sheet', { hFull: 915, keyboard: 330 }); }
  await ctx.close(); }
}
// G: what moves. A drag along the timeline, held and then let go; a tap ring caught while the finger is down; the stage's
// vignette and grain, measured with and without their layer. Touches go through CDP, as a phone's do.
if (run('G')) {
  // One CDP session per page: a touch's start, moves and end belong to the session that began it.
  const sessions = new Map(), touch = async (page, type, x, y) => { if (!sessions.has(page)) sessions.set(page, await page.context().newCDPSession(page)); await sessions.get(page).send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] }); };
  { const { ctx, page, errors } = await open(); await tap(page, '#rules-box-story'); await tap(page, '.rules-sheet-tabs button', { hasText: 'Time' });
    const b = await page.locator('#rules-sheet .rules-time').boundingBox(), y = b.y + b.height / 2;
    await touch(page, 'touchStart', b.x + b.width - 8, y); for (let x = b.x + b.width - 8; x > b.x + 4; x -= 24) { await touch(page, 'touchMove', x, y); await page.waitForTimeout(30); }
    await touch(page, 'touchMove', b.x + 6, y); await page.waitForTimeout(300);
    const held = await page.evaluate(() => ({ scrubbing: !!document.querySelector('#rules-sheet .rules-time.rules-scrubbing'), head: document.querySelector('#rules-sheet .rules-time-head, #rules-sheet [class*=time-now]')?.textContent?.trim().slice(0, 40) }));
    await shot(page, errors, 'G-1', `Timeline: dragged to its left end, finger still down${held.scrubbing ? '' : ' (no drag state)'}`);
    await touch(page, 'touchEnd'); await page.waitForTimeout(800);
    const after = await page.evaluate(() => ({ count: document.getElementById('rules-box-count')?.textContent, sheet: !document.getElementById('rules-sheet')?.hidden }));
    await shot(page, errors, 'G-2', `Timeline: let go (the box at ${after.count}${after.sheet ? ', the sheet open' : ''})`); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await toShort(page);
    const b = await page.locator('#rules-box-next').boundingBox(); await touch(page, 'touchStart', b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(120);
    const clip = { x: Math.max(0, b.x - 70), y: Math.max(0, b.y - 30), width: 200, height: b.height + 60 };
    await page.screenshot({ path: `${out}/G-3.png`, clip }); await touch(page, 'touchEnd');
    meta.push({ name: 'G-3', w: clip.width * 2, hFull: clip.height * 2, vh: clip.height * 2, keyboard: 0, note: '▶ held down for 120 ms (2×)', overflow: [], errors: [...errors] });
    // The stage above the box: its pixels' spread with the vignette and grain, and without them.
    const area = { x: 40, y: 140, width: 200, height: 120 };
    const spread = async () => { const png = await page.screenshot({ clip: area }); return png; };
    const a = await spread(); await page.evaluate(() => { const e = document.getElementById('rules-stage-atmo'); if (e) e.style.display = 'none'; }); const n = await spread();
    fs.writeFileSync(`${out}/G-4-with.png`, a); fs.writeFileSync(`${out}/G-4-without.png`, n);
    await page.screenshot({ path: `${out}/G-4.png`, clip: area });
    await page.evaluate(() => { const e = document.getElementById('rules-stage-atmo'); if (e) e.style.display = ''; }); await page.screenshot({ path: `${out}/G-4.png`, clip: area });
    meta.push({ name: 'G-4', w: area.width * 2, hFull: area.height * 2, vh: area.height * 2, keyboard: 0, note: 'The stage above the box with its vignette and grain (2×)', overflow: [], errors: [...errors] });
    await ctx.close(); }
}
// H: the rest. The Book with woven turns archived ("ghosting"), the extension's settings, a slash command that fails, the log in
// the dark page colours, the box's page look, and a desktop window.
if (run('H')) {
  const choose = (page, id, value) => page.evaluate(([id, value]) => { const e = document.getElementById(id); if (!e) return false; if (e.type === 'checkbox') e.checked = value; else e.value = value; e.dispatchEvent(new Event('change')); return true; }, [id, value]);
  { const { ctx, page, errors } = await open(); await tap(page, '#rules-box-story'); await tap(page, '.rules-sheet-tabs button', { hasText: 'Book' });
    await choose(page, 'rules_engine_book_ghost', true); await page.waitForTimeout(600);
    await page.evaluate(() => { const d = document.querySelector('#rules-sheet details.rules-chron-scene:not(.is-live)'); if (d) d.open = true; d?.querySelector('.rules-chron-archived')?.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(400);
    const label = await page.evaluate(() => document.querySelector('#rules-sheet .rules-chron-archived')?.textContent ?? 'none');
    await shot(page, errors, 'H-1', `Book with "Ghost woven turns" on (label: ${label})`); await ctx.close(); }
  { const { ctx, page, errors } = await open();
    await page.click('#extensions-settings-button .drawer-toggle'); await page.waitForTimeout(700);
    const head = page.locator('.rules-engine-settings .inline-drawer-toggle').first(); await head.scrollIntoViewIfNeeded(); await head.click(); await page.waitForTimeout(600);
    const box = page.locator('#rules_engine_box').first(); await box.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    await page.evaluate(() => document.getElementById('rules_engine_box')?.closest('label')?.scrollIntoView({ block: 'start' })); await page.waitForTimeout(300);
    await shot(page, errors, 'H-2', 'The extension\'s settings: Box & page'); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await page.fill('#send_textarea', '/notacommand'); await page.evaluate(() => document.getElementById('send_but').click()); await page.waitForTimeout(700);
    const cmd = await page.evaluate(() => document.getElementById('rules-cmd-bar')?.getAttribute('data-cmd') ?? 'none');
    const r = await page.locator('#send_form').boundingBox(), clip = { x: 0, y: Math.max(0, r.y - 10), width: 412, height: Math.min(140, r.height + 20) };
    await page.screenshot({ path: `${out}/H-3.png`, clip });
    meta.push({ name: 'H-3', w: clip.width * 2, hFull: clip.height * 2, vh: clip.height * 2, keyboard: 0, note: `/notacommand sent: the line over the message box (state: ${cmd}) (2×)`, overflow: [], errors: [...errors] }); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await choose(page, 'rules_engine_page_colours', 'dark'); await tap(page, '#rules-box-log'); await page.waitForTimeout(500);
    await shot(page, errors, 'H-4', 'The log in the dark page colours'); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await choose(page, 'rules_engine_box_look', 'page'); await page.waitForTimeout(500); await toShort(page);
    await shot(page, errors, 'H-5', 'The box in the page look'); await ctx.close(); }
  { const { ctx, page, errors } = await open(360, 720); await choose(page, 'rules_engine_box_look', 'page'); await page.waitForTimeout(500); await toShort(page);
    await page.focus('#send_textarea'); await page.setViewportSize({ width: 360, height: 380 }); await page.waitForTimeout(700);
    const hit = await page.evaluate(() => { const p = document.querySelector('#chat .rules-now button.rules-mode'); if (!p) return 'no pill'; const r = p.getBoundingClientRect(), e = document.elementFromPoint(r.right - 6, r.top + r.height / 2); return e?.closest?.('#rules-top-fold') ? '▲' : e?.closest?.('button.rules-mode') ? 'SPEAKING' : 'other'; });
    await shot(page, errors, 'H-7', `The page look, keyboard open (360 × 720, page 380 px): a tap on SPEAKING's end → ${hit}`, { hFull: 720, keyboard: 340 }); await ctx.close(); }
  { await seed(ST); const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const errors = [];
    page.on('pageerror', e => { if (!/Internal S/.test(e.message)) errors.push(e.message); });
    await page.goto(URL); await page.waitForSelector('.recentChat .characterName'); await page.click('.recentChat .characterName');
    await page.waitForFunction(() => document.querySelector('#chat .rules-unit-now')); await page.waitForTimeout(1200); await toShort(page);
    await page.screenshot({ path: `${out}/H-6.png` }); meta.push({ name: 'H-6', w: 1280 / 2, hFull: 400, vh: 400, keyboard: 0, note: 'A desktop window, 1280 × 800 (half size)', overflow: [], errors: [...errors] }); await ctx.close(); }
}
// I: the older screens. A marked word held (its marks in the menu line), a key word selected (its path), the voice toolbar
// and a word marked louder, the faith knob turned, the log with the typeset line and its reading note, the first-meeting
// card, and the stage's grain three ways (as it is, six times stronger, and gone) for the player to judge.
if (run('I')) {
  const sessions = new Map(), touch = async (page, type, x, y) => { if (!sessions.has(page)) sessions.set(page, await page.context().newCDPSession(page)); await sessions.get(page).send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] }); };
  const toMes = async (page, n) => { for (let i = 0; i < 14; i++) { if ((await page.textContent('#rules-box-count')).startsWith(`${n} /`)) break; await page.evaluate(() => document.getElementById('rules-box-back').click()); await page.waitForTimeout(220); } };
  { const { ctx, page, errors } = await open(); await toMes(page, 2);
    const w = page.locator('#chat .rules-now .rules-v[title]').first();
    if (await w.count()) { const b = await w.boundingBox(); await touch(page, 'touchStart', b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(800);
      const said = await page.evaluate(() => document.getElementById('rules-box-explain')?.textContent?.trim().slice(0, 80) ?? '');
      await shot(page, errors, 'I-1', `"Where" held: its marks in the menu line (${said ? 'shown' : 'nothing shown'})`); await touch(page, 'touchEnd'); }
    else await shot(page, errors, 'I-1', 'No marked word drawn on "Where am I?"');
    await ctx.close(); }
  { const { ctx, page, errors } = await open();
    await page.evaluate(() => { const m = [...document.querySelectorAll('#chat .rules-now mark, #chat .rules-now .rules-key')].find(e => /warm broth/.test(e.textContent)); if (!m) return; m.scrollIntoView({ block: 'center' }); const r = document.createRange(); r.selectNodeContents(m); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); });
    await page.waitForTimeout(700); const why = await page.evaluate(() => { const w = document.getElementById('rules-why'); return w && !w.hidden ? 'shown' : 'not shown'; });
    await shot(page, errors, 'I-2', `"warm broth" selected: its path (${why})`); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await page.focus('#send_textarea'); await page.keyboard.type('I open the shutters');
    await page.setViewportSize({ width: 412, height: 585 }); await page.waitForTimeout(500);
    await page.evaluate(() => { const t = document.getElementById('send_textarea'); t.setSelectionRange(2, 6); document.dispatchEvent(new Event('selectionchange')); }); await page.waitForTimeout(500);
    await shot(page, errors, 'I-3', 'The voice toolbar: "open" selected', { hFull: 915, keyboard: 330 });
    const louder = page.locator('#rules-voice button', { hasText: 'louder' }).first();
    if (await louder.count()) { const b = await louder.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(600); }
    await page.evaluate(() => { const t = document.getElementById('send_textarea'); t.setSelectionRange(t.value.length, t.value.length); }); await page.waitForTimeout(400);
    await shot(page, errors, 'I-4', '"open" marked louder: underlined in the message box', { hFull: 915, keyboard: 330 });
    const k = await page.locator('#rules-faith').boundingBox(); await page.touchscreen.tap(k.x + k.width / 2, k.y + k.height / 2); await page.waitForTimeout(500);
    const stop = await page.evaluate(() => document.getElementById('rules-faith')?.getAttribute('data-faith'));
    await shot(page, errors, 'I-5', `The faith knob tapped once: ${stop}`, { hFull: 915, keyboard: 330 }); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await tap(page, '#rules-box-log'); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('#chat .mes[mesid="2"]')?.scrollIntoView({ block: 'start' })); await page.waitForTimeout(400);
    const note = await page.evaluate(() => !!document.querySelector('#chat .rules-reading'));
    await shot(page, errors, 'I-6', `The log: "Where am I?" typeset, the knob's 1.5 after Mara's name, the reading note ${note ? 'under her line' : 'missing'}`); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await page.fill('#send_textarea', '/del 4'); await page.evaluate(() => document.getElementById('send_but').click()); await page.waitForTimeout(1500);
    // Her first line opens on narration (no speaker); the card comes with her first said words, one step on.
    for (let i = 0; i < 3 && !(await page.evaluate(() => document.body.classList.contains('rules-card-on'))); i++) { await tap(page, '#rules-box-next'); }
    const card = await page.evaluate(() => document.body.classList.contains('rules-card-on'));
    await shot(page, errors, 'I-7', `Seraphina's first line: the first-meeting card (${card ? 'shown' : 'not shown'})`); await ctx.close(); }
  { const { ctx, page, errors } = await open(); await toMes(page, 3); const area = { x: 20, y: 160, width: 180, height: 140 };
    for (const [n, css, note] of [['I-8a', '', 'Grain as it is (2×)'], ['I-8b', '#rules-stage-atmo::after { opacity: 0.27 !important; }', 'Grain six times stronger (2×)'], ['I-8c', '#rules-stage-atmo::after { display: none !important; }', 'No grain (2×)']]) {
      await page.evaluate(css => { let st = document.getElementById('tour-grain'); if (!st) { st = document.createElement('style'); st.id = 'tour-grain'; document.head.append(st); } st.textContent = css; }, css); await page.waitForTimeout(200);
      await page.screenshot({ path: `${out}/${n}.png`, clip: area }); meta.push({ name: n, w: area.width * 2, hFull: area.height * 2, vh: area.height * 2, keyboard: 0, note, overflow: [], errors: [...errors] }); }
    await ctx.close(); }
}
// J: the screens no earlier chat reached. The Map tab (a room, the bed, the door, Mara and Seraphina on it), the World tab (a
// seed's counts year by year), and the question popup in both its forms (whom a word means; which thing a word names, with notes).
if (run('J')) {
  const plant = page => page.evaluate(() => {
    const s = SillyTavern.getContext().chatMetadata.rulesEngine.state;
    s.map = { spots: { bed: { x: 2, y: 2, floor: 0 }, door: { x: 7, y: 3, floor: 0 }, window: { x: 1, y: 5, floor: 0 } }, rooms: { 'The cottage room': { floor: 0, corners: [[0, 0], [8, 0], [8, 6], [0, 6]] } } };
    s.people = { ...s.people, Mara: { ...(s.people.Mara ?? {}), at: 'bed' }, Seraphina: { ...(s.people.Seraphina ?? {}), at: 'door' } };
    s.seed = 'EW1881-BH.RA-N4-D2-K5-7f2c';
  });
  { const { ctx, page, errors } = await open(); await plant(page); await tap(page, '#rules-box-story');
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.rules-sheet-tabs button')].map(b => b.textContent.trim()).join(', '));
    for (const [name, label] of [['J-1', 'Map'], ['J-2', 'World']]) {
      const t = page.locator('.rules-sheet-tabs button', { hasText: label });
      if (await t.count()) { await tap(page, '.rules-sheet-tabs button', { hasText: label }); await shot(page, errors, name, `Story: ${label}`); }
      else await shot(page, errors, name, `Story: no ${label} tab (tabs: ${tabs})`);
    }
    await ctx.close(); }
  const popup = async (name, q, note) => { const { ctx, page, errors } = await open();
    await page.evaluate(async q => { const U = await import('/scripts/extensions/third-party/multihog-dev/src/ui.js'); const c = SillyTavern.getContext(); const p = U.askPopup(q, { era: U.eraOf(1990), reduced: false }); void c.callGenericPopup(p.content, c.POPUP_TYPE.TEXT, '', p.options); }, q);
    await page.waitForTimeout(900); await shot(page, errors, name, note); await ctx.close(); };
  await popup('J-3', { said: 'I hand <her> the bowl', choices: ['Hand Seraphina the bowl', 'Hand the girl at the door the bowl'] }, 'The question popup: whom "her" means');
  await popup('J-4', { said: 'the lamp', choices: ['Argand lamp (1780)', 'oil lamp'], notes: ['a hollow wick, a glass chimney', 'a wick in oil, an open flame'], things: true }, 'The question popup: which thing "lamp" names');
}
// K: the phone held sideways (915 × 412), the box on a short and an NVL beat, and with the keyboard open (the page about 180 px
// tall [ASSUMED: a landscape keyboard takes over half the height]).
if (run('K')) {
  for (const [name, beat, kb, note] of [['K-1', 'short', 0, 'Held sideways: a short beat'], ['K-2', 'nvl', 0, 'Held sideways: the NVL beat'], ['K-3', 'short', 232, 'Held sideways, keyboard open: a short beat']]) {
    const { ctx, page, errors } = await open(915, 412); if (beat === 'short') await toShort(page);
    if (kb) { await page.focus('#send_textarea'); await page.setViewportSize({ width: 915, height: 412 - kb }); await page.waitForTimeout(700); }
    const m = await page.evaluate(() => { const c = document.querySelector('#chat')?.getBoundingClientRect(), t = document.querySelector('#chat .rules-now .rules-who')?.getBoundingClientRect(), f = document.getElementById('send_form')?.getBoundingClientRect(); return { tag: t && c && t.width ? Math.round(t.top - c.top) : null, form: f ? Math.round(innerHeight - f.bottom) : null }; });
    await shot(page, errors, name, `${note} (tag ${m.tag ?? '—'} px from the chat's top; input bar ${m.form} px above the bottom)`, kb ? { hFull: 412, keyboard: kb } : {}); await ctx.close();
  }
}
fs.writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 1));
for (const m of meta) console.log(`${m.name}: ${m.note}${m.overflow.length ? ' | OVERFLOW ' + m.overflow.join('; ') : ''}${m.errors.length ? ' | ERRORS ' + m.errors.join('; ') : ''}`);
await browser.close();
