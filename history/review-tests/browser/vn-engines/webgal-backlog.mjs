import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
const vp = { width: 915, height: 412 };
const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
await p.goto('http://localhost:8101/'); await p.waitForTimeout(2500);
await p.mouse.click(457, 206); await p.waitForTimeout(1500); await p.mouse.click(170, 117); await p.waitForTimeout(2500);
for (let i = 0; i < 4; i++) { await p.mouse.click(600, 150); await p.waitForTimeout(2500); }
const r = await p.evaluate(() => { const e = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.trim() === 'Backlog' && e.getClientRects().length); const b = e.getBoundingClientRect(); return [b.x + b.width / 2, b.y + b.height / 2]; });
await p.mouse.click(...r); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/wg-backlog.png` });
// Tap the jump button on the Mara row (third row).
const btns = await p.evaluate(() => [...document.querySelectorAll('[class*="backlog_func"], [class*="backlog_item_button"], [class*="jump"]')].filter(e => e.getClientRects().length).map(e => { const b = e.getBoundingClientRect(); return [e.className.slice(0, 40), Math.round(b.x + b.width / 2), Math.round(b.y + b.height / 2)]; }));
console.log(JSON.stringify(btns));
const rows = btns.filter(b => b[1] < 250).sort((a, c) => a[2] - c[2]);
if (rows[2]) { await p.mouse.click(rows[2][1], rows[2][2]); await p.waitForTimeout(2500); await p.screenshot({ path: `${out}/wg-backlog-jump.png` }); }
await b.close();
