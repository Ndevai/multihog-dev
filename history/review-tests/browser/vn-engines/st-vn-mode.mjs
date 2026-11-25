import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
const { chromium } = createRequire(import.meta.url)('playwright');
const ST = '/home/user/st/SillyTavern', EXT = '/home/user/multihog-src/multihog-dev-rules-standalone';
const { seed } = await import(EXT + '/history/review-tests/browser/real-st/seed.mjs');
const out = '/home/user/vn-shots';
const b = await chromium.launch();
for (const vn of [false, true]) {
  await seed(ST, EXT);
  const sf = path.join(ST, 'data/default-user/settings.json'), s = JSON.parse(fs.readFileSync(sf, 'utf8'));
  s.power_user.waifuMode = vn; s.extension_settings = s.extension_settings || {}; s.extension_settings.expressions = { ...(s.extension_settings.expressions || {}), api: 99, fallback_expression: 'joy' };
  fs.writeFileSync(sf, JSON.stringify(s, null, 4));
  const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1.5 }); const p = await ctx.newPage();
  await p.goto('http://localhost:8000/'); await p.waitForSelector('.recentChat .characterName', { timeout: 60000 }); await p.click('.recentChat .characterName');
  await p.waitForTimeout(6000);
  const info = await p.evaluate(() => { const h = document.querySelector('#expression-holder, .expression-holder'); const img = document.querySelector('#expression-image'); const box = document.querySelector('#chat .mes.rules-now .mes_text'); const r = e => e ? (({ top, bottom, left, right }) => ({ top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right) }))(e.getBoundingClientRect()) : null;
    return { waifu: document.body.classList.contains('waifuMode'), holderShown: !!h && getComputedStyle(h).display !== 'none', img: img?.getAttribute('src')?.slice(0, 60), imgRect: r(img), sheld: r(document.getElementById('sheld')), box: r(box) }; });
  console.log(vn ? 'VN on ' : 'VN off', JSON.stringify(info));
  await p.screenshot({ path: `${out}/st-vn-${vn ? 'on' : 'off'}.png` }); await ctx.close();
}
await b.close();
