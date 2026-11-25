import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
const vp = { width: 915, height: 412 };
const ctx = await b.newContext({ viewport: vp, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 });
const p = await ctx.newPage();
await p.goto('http://localhost:8101/'); await p.waitForTimeout(2500);
await p.mouse.click(457, 206); await p.waitForTimeout(1500); await p.mouse.click(170, 117); await p.waitForTimeout(2500);
for (let i = 0; i < 12; i++) {
  const has = await p.evaluate(() => /moss/.test(document.body.innerText));
  if (has) { console.log('long at step', i); break; }
  await p.mouse.click(600, 150); await p.waitForTimeout(2000);
}
await p.waitForTimeout(30000);
console.log(JSON.stringify(await p.evaluate(() => { const box = [...document.querySelectorAll('*')].find(e => /textBox_main|TextBox_main/i.test(e.className) && e.getClientRects().length); const br = box?.getBoundingClientRect(); const sp = [...document.querySelectorAll('span')].filter(e => e.children.length === 0 && /inner/i.test(e.className)); const vis = sp.filter(e => { const r = e.getBoundingClientRect(); return br && r.bottom <= br.bottom - 2 && r.height > 0; }); const tops = [...new Set(sp.map(e => Math.round(e.getBoundingClientRect().top)))]; return { box: box?.className.slice(0, 40), boxBottom: br && Math.round(br.bottom), words: sp.length, wordsVisible: vis.length, lineTops: tops, text: sp.map(e => e.textContent).join(' ').length }; })));
console.log(JSON.stringify(await p.evaluate(() => { const t = document.body.innerText; const i = t.indexOf('The glade'); return t.slice(i, i + 600).replace(/\s+/g, ' ').slice(0, 400); })));
await b.close();
