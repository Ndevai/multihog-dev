import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
const vp = { width: 412, height: 915 };
async function fresh() {
  const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8102/'); await p.waitForTimeout(3500);
  await p.locator('[data-action="start"]').first().click(); await p.waitForTimeout(2500);
  for (let i = 0; i < 3; i++) { await p.mouse.click(206, 300); await p.waitForTimeout(2500); }
  return [ctx, p];
}
let [ctx, p] = await fresh();
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('[data-action="open-screen"]')].map(e => e.dataset.open + ':' + !!e.getClientRects().length))));
await p.evaluate(() => document.querySelector('[data-action="dialog-log"]').click()); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/mo-port-log.png` }); await ctx.close();
[ctx, p] = await fresh();
await p.evaluate(() => document.querySelector('[data-action="open-screen"][data-open="settings"]').click()); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/mo-port-settings.png` });
console.log('settings', JSON.stringify(await p.evaluate(() => [...new Set([...document.querySelectorAll('h1,h2,h3,label,span,p,button,option')].filter(e => e.getClientRects().length && e.textContent.trim()).map(e => e.textContent.trim().slice(0, 40)))].slice(0, 50))));
const h = await p.evaluate(() => document.querySelector('settings-screen, [data-screen="settings"]')?.scrollHeight);
console.log('settings height', h);
await ctx.close(); await b.close();
