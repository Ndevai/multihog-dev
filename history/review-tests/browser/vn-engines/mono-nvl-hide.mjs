import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
const vp = { width: 412, height: 915 };
const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('http://localhost:8102/'); await p.waitForTimeout(3500);
await p.locator('[data-action="start"]').first().click(); await p.waitForTimeout(2500);
const next = async (w = 2500) => { await p.mouse.click(206, 300); await p.waitForTimeout(w); };
await next(); await next(); await next(); // on glade line
await p.screenshot({ path: `${out}/mo-port-glade.png` });
await next(9000); await p.screenshot({ path: `${out}/mo-port-nvl.png` });
await next();
const act = async a => { const l = p.locator(`[data-action="${a}"]`).filter({ visible: true }).first(); if (await l.count()) { await l.click(); await p.waitForTimeout(1500); return true; } console.log('no action', a); return false; };
console.log(JSON.stringify(await p.evaluate(() => [...new Set([...document.querySelectorAll('[data-action]')].filter(e => e.getClientRects().length).map(e => e.dataset.action))])));
if (await act('distraction-free')) { await p.screenshot({ path: `${out}/mo-port-hide.png` }); await p.mouse.click(206, 300); await p.waitForTimeout(1000); }
if (await act('open-screen') || true) {}
await p.locator('[data-action="dialog-log"], [data-open="log"], [data-action="open-log"]').filter({ visible: true }).first().click().catch(e => console.log('log', e.message.slice(0, 80)));
await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/mo-port-log.png` });
await p.keyboard.press('Escape'); await p.waitForTimeout(800);
await p.locator('[data-open="settings"]').filter({ visible: true }).first().click().catch(e => console.log('settings', e.message.slice(0, 80)));
await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/mo-port-settings.png`, fullPage: false });
console.log('settings text', JSON.stringify(await p.evaluate(() => [...new Set([...document.querySelectorAll('h1,h2,h3,label,span,p,button')].filter(e => e.getClientRects().length && e.textContent.trim()).map(e => e.textContent.trim().slice(0, 40)))].slice(0, 50))));
console.log(errs.slice(0, 3).join(' | '));
await b.close();
