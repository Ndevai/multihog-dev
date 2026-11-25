# Two open-source visual-novel engines, run beside the box

Made 2026-11-25 (progress entries 210–211) so the box can be compared with real visual-novel screens. Results: `docs/vn-interface-survey.md`, sections "Measured in two open-source engines" and "Published games".

## What is here
- `webgal-game/`: the game folder for WebGAL 4.6.7 (`config.txt`, `scene/start.txt`): SillyTavern's background, Seraphina's sprites, the lines of `../real-st/seed.mjs`.
- `monogatari/script.js`: the same scene for Monogatari 2.8.1 (replaces `dist/js/script.js`).
- `webgal-*.mjs`, `mono-*.mjs`: the Playwright scripts that took the screens and measurements (write PNGs to `/home/user/vn-shots`).
- `page/template.html`: the comparison page ("Box Beside the Genre", a private Claude artifact) with `{{key}}` image slots; `page/wikipedia-files.tsv`: the published games' screenshot URLs on upload.wikimedia.org (index, site, URL).

## How to run (a cloud container, about 10 minutes)
1. Engines from npm (GitHub is blocked here; the npm registry is open), each unpacked in its own empty folder:
   `curl -O https://registry.npmjs.org/webgal-engine/-/webgal-engine-4.6.7.tgz` and `https://registry.npmjs.org/@monogatari/core/-/core-2.8.1.tgz`, then `tar xzf`.
2. WebGAL: copy `webgal-game/` to `package/dist/game/`, add `background/bg.jpg` (SillyTavern `default/content/backgrounds/landscape autumn great tree.jpg`), `figure/sera.png` and `figure/sera2.png` (`default/content/Seraphina/neutral.png`, `caring.png`), `animation/animationTable.json` = `[]`, `template/template.json` = `{}`, an empty `userStyleSheet.css`. Serve `package/dist` on port 8101 (`python3 -I -m http.server 8101 --directory ...`).
3. Monogatari: copy `monogatari/script.js` to `package/dist/js/`, the background to `assets/scenes/glade.jpg`, the two sprites to `assets/characters/sera/`. Serve `package/dist` on port 8102.
4. Run the scripts from a folder where `require('playwright')` resolves (here `/home/user/st`).

## Quirks met
- WebGAL's start button does not take Playwright's `click()`; tap by position: (170, 117) in 915 × 412, (295, 170) upright.
- WebGAL's Escape and right-click open its "panic" screen (a fake search page); close the backlog with its ×.
- WebGAL's text spans come in pairs (outer and inner stroke), so word counts are doubled.
- A tap while a line types finishes it; the next tap advances. Wait 2.5 s a line, 30 s for the 342-character sentence.
- Monogatari's buttons answer `element.click()` in `page.evaluate`; its `nvl` keyword gives the NVL page without a name colon.
- Wikipedia: send a User-Agent; the API answered 429 after about 10 requests, and upload.wikimedia.org after about 8. Download files straight by path (`/wikipedia/en/<md5[0]>/<md5[0:2]>/<File_name>`, else `/wikipedia/commons/...`) with 15 s between requests. The environment's allowed hosts now include en.wikipedia.org and upload.wikimedia.org (added 2026-11-25).
