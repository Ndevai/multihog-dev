import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
for (const [tag, vp] of [['port', { width: 412, height: 915 }], ['land', { width: 915, height: 412 }]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8102/'); await p.waitForTimeout(3500);
  await p.locator('[data-action="start"]').first().click(); await p.waitForTimeout(2500);
  const shots = [];
  for (let i = 1; i <= 6; i++) {
    await p.waitForTimeout(i === 5 ? 9000 : 2500);
    await p.screenshot({ path: `${out}/mo-${tag}-line${i}.png` });
    if (i === 2) console.log(tag, JSON.stringify(await p.evaluate(() => {
      const el = document.querySelector('[data-content="dialog"], text-box [data-content="text"]') || [...document.querySelectorAll('*')].find(e => /awake at last/.test(e.textContent || '') && e.children.length < 3 && e.getClientRects().length);
      if (!el) return null; const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      const tb = el.closest('text-box') || el.parentElement; const tbs = getComputedStyle(tb);
      return { font: cs.fontSize, family: cs.fontFamily.slice(0, 50), color: cs.color, lh: cs.lineHeight, w: Math.round(r.width), tbBg: tbs.backgroundColor, lines: Math.round(r.height / parseFloat(cs.lineHeight || cs.fontSize)) };
    })));
    await p.mouse.click(vp.width * 0.5, vp.height * 0.3); await p.waitForTimeout(300);
  }
  console.log(tag, errs.slice(0, 2).join(' | '));
  await ctx.close();
}
await b.close();
