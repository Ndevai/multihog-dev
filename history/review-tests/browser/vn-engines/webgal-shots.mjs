import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
async function run(vp, tag) {
  const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage();
  const find = (t, nth = 0) => p.evaluate(([t, nth]) => { const els = [...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() === t && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden'); const e = els[nth]; if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; }, [t, nth]);
  const tapText = async t => { const r = await find(t); if (!r) { console.log(tag, 'no', t); return false; } await p.mouse.click(r.x, r.y); return true; };
  const mid = vp.width > vp.height ? [vp.width * 0.65, vp.height * 0.35] : [vp.width * 0.65, vp.height * 0.6];
  const next = async (wait = 2500) => { await p.mouse.click(...mid); await p.waitForTimeout(wait); };
  await p.goto('http://localhost:8101/'); await p.waitForTimeout(2500);
  await p.mouse.click(vp.width / 2, vp.height / 2); await p.waitForTimeout(1500);
  if (vp.width > vp.height) await p.mouse.click(170, 117); else await p.mouse.click(412 - 117, 170); await p.waitForTimeout(2500);
  await next(); await next(); await next(); await next(); // line 4: glade
  await p.screenshot({ path: `${out}/wg-${tag}-glade.png` });
  if (tag !== 'land') { await ctx.close(); return; }
  await next(12000); await p.screenshot({ path: `${out}/wg-land-long.png` });
  await tapText('Hide'); await p.waitForTimeout(1200); await p.screenshot({ path: `${out}/wg-land-hide.png` }); await p.mouse.click(...mid); await p.waitForTimeout(1200);
  await tapText('Options'); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/wg-land-options.png` });
  console.log('options text', JSON.stringify(await p.evaluate(() => [...new Set([...document.querySelectorAll('*')].filter(e => e.children.length === 0 && e.textContent.trim() && e.getClientRects().length).map(e => e.textContent.trim()))].slice(0, 80))));
  for (const t of ['Display', 'Text', 'Sound', 'Other']) { if (await tapText(t)) { await p.waitForTimeout(1000); await p.screenshot({ path: `${out}/wg-land-opt-${t}.png` }); } }
  await ctx.close();
}
await run({ width: 915, height: 412 }, 'land');
await run({ width: 412, height: 915 }, 'port');
await b.close();
