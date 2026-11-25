// Before/after sheets from shoot.mjs's screenshots: each frame is the phone's screen, the page on top and, while the message
// box has the focus, a drawn keyboard under it (the keyboard is not part of SillyTavern's page, so no screenshot holds it).
import fs from 'fs';
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
// Usage: node compose.mjs <shots dir, holding before/ and after/ from shoot.mjs> <sheet: A|B|C> <title> <out.png>
const [shots, sheet, title, outFile] = process.argv.slice(2);
const rows = [['before', 'Before: the zip as uploaded (v24)'], ['after', 'After: this zip (v33)']];
const kb = h => `<div class="kb" style="height:${h}px"><div class="sugg"><span>shutters</span><span>shutter</span><span>shut</span></div>${['qwertyuiop', 'asdfghjkl', '⇧zxcvbnm⌫', '?123 , space . ⏎'].map(r => `<div class="row">${(r.includes(' ') ? r.split(' ') : [...r]).map(k => `<i class="${k === 'space' ? 'sp' : ''}">${k === 'space' ? '' : k}</i>`).join('')}</div>`).join('')}</div>`;
const frame = (v, m) => {
  const img = fs.readFileSync(`${shots}/${v}/${m.name}.png`).toString('base64');
  const kbOpen = m.keyboard > 0;
  const verdict = m.name.startsWith('B-') && m.name !== 'B-0-typing' ? (kbOpen ? '<b class="ok">keyboard stays open</b>' : '<b class="bad">keyboard closes</b>') : '';
  return `<figure><div class="phone" style="width:${m.w}px;height:${m.hFull}px"><img src="data:image/png;base64,${img}" style="width:${m.w}px;height:${m.vh}px">${kbOpen ? kb(m.keyboard) : ''}</div>
    <figcaption>${m.note}${verdict ? '<br>' + verdict : ''}${m.pillEnd ? `<br>tap on SPEAKING's right end → ${m.pillEnd.to === 'SPEAKING' ? '<b class="ok">SPEAKING</b>' : `<b class="bad">${m.pillEnd.to === '▲' ? '▲' : "SillyTavern's top bar"}</b>`}` : ''}</figcaption></figure>`;
};
// A corner of a frame at 2.5× with the tapped point ringed.
const zoom = (v, m, [cx, cy, cw, ch], k = 2.5) => {
  const img = fs.readFileSync(`${shots}/${v}/${m.name}.png`).toString('base64');
  const ring = m.pillEnd ? `<span class="ring" style="left:${(m.pillEnd.x - cx) * k - 14}px;top:${(m.pillEnd.y - cy) * k - 14}px"></span>` : '';
  return `<figure><div class="zoom" style="width:${cw * k}px;height:${ch * k}px;background-image:url(data:image/png;base64,${img});background-size:${m.w * k}px ${m.vh * k}px;background-position:${-cx * k}px ${-cy * k}px">${ring}</div>
    <figcaption>The top right corner of “${m.note.split(':')[0]}, page ${m.vh} px” at 2.5×; the ring is the tap.<br>tap → ${m.pillEnd?.to === 'SPEAKING' ? '<b class="ok">SPEAKING</b>' : `<b class="bad">${m.pillEnd?.to === '▲' ? '▲ (folds the top bar)' : "SillyTavern's top bar"}</b>`}</figcaption></figure>`;
};
const body = rows.map(([v, label]) => {
  const all = JSON.parse(fs.readFileSync(`${shots}/${v}/meta.json`, 'utf8'));
  if (sheet === 'C') { const w = all.find(m => m.name === 'C-welcome'), s = all.find(m => m.name === 'A-short-380');
    return `<h2>${label}</h2><div class="strip">${frame(v, w)}${frame(v, s)}${zoom(v, s, [200, 28, 160, 70])}</div>`; }
  const meta = all.filter(m => m.name.startsWith(sheet + '-'));
  return `<h2>${label}</h2><div class="strip">${meta.map(m => frame(v, m)).join('')}</div>`;
}).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
body { margin: 0; padding: 24px; background: #f4f2ee; font: 15px/1.35 system-ui, sans-serif; color: #222; width: max-content; }
h1 { font-size: 22px; margin: 0 0 4px; } p.sub { margin: 0 0 12px; color: #555; } h2 { font-size: 17px; margin: 18px 0 8px; }
.strip { display: flex; gap: 18px; align-items: flex-start; } figure { margin: 0; }
.phone { position: relative; overflow: hidden; border: 6px solid #111; border-radius: 22px; background: #000; box-shadow: 0 6px 18px rgba(0,0,0,.25); }
.phone img { display: block; } figcaption { max-width: 360px; margin-top: 8px; font-size: 14px; }
.zoom { position: relative; border: 6px solid #111; border-radius: 12px; background-repeat: no-repeat; } .ring { position: absolute; width: 22px; height: 22px; border: 3px solid #ffd400; border-radius: 50%; box-shadow: 0 0 0 2px #000; }
.ok { color: #1a7f37; } .bad { color: #c62828; }
.kb { position: absolute; left: 0; right: 0; bottom: 0; background: #2a2b2f; display: flex; flex-direction: column; justify-content: space-evenly; padding: 4px 3px 10px; box-sizing: border-box; }
.kb .sugg { display: flex; justify-content: space-around; color: #ddd; font-size: 14px; border-bottom: 1px solid #444; padding: 6px 0; }
.kb .row { display: flex; gap: 5px; justify-content: center; } .kb i { font-style: normal; flex: 0 0 9%; height: 42px; display: grid; place-items: center; background: #46474c; color: #eee; border-radius: 6px; font-size: 17px; }
.kb i.sp { flex: 0 0 45%; } .kb .row:last-child i { flex: 0 0 auto; padding: 0 10px; }
</style><h1>${title}</h1><p class="sub">Real SillyTavern 1.19.1 with the extension, Chromium at phone size. The keyboard is drawn while the message box has the focus; the page above it is the height Android gives it then.</p>${body}`;
const browser = await chromium.launch(); const page = await browser.newPage({ deviceScaleFactor: 2 });
await page.setContent(html); const size = await page.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
await page.setViewportSize({ width: size.w + 48, height: size.h + 10 });
await page.screenshot({ path: outFile, fullPage: true }); await browser.close(); console.log(outFile, size);
