// The music's whole path in Chromium (section 51, docs/progress.md (118)): four synthetic songs (WAV, written here) added
// through the settings' file input, uploaded to a stand-in of SillyTavern's /api/files/upload, decoded and measured by the
// browser, listed with their areas; then the song chosen as the scene's feelings change: none, the player's line marked sad,
// Tom's appraised joy, and Tom's joy with a set named after him. The extension loads through src/index.js with a stand-in
// context, as voice-look/st-chat.mjs does.
// Usage: node flow.mjs <repo root>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const root = process.argv[2];
const rate = 22050, hz = m => 440 * 2 ** ((m - 69) / 12);
// A 16-bit mono WAV: a chord of sine partials and a burst of noise on each beat.
const wav = (bpm, notes, amp, burst, sec = 20) => {
    const n = rate * sec, data = Buffer.alloc(n * 2), beat = 60 / bpm, fsq = notes.map(hz);
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
    for (let i = 0; i < n; i++) { const t = i / rate, ph = t % beat; let v = 0; for (const f of fsq) v += Math.sin(2 * Math.PI * f * t) / fsq.length; v = amp * (0.6 * v + (ph < 0.03 ? burst * rnd() * 2 * (1 - ph / 0.03) : 0)); data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), i * 2); }
    const h = Buffer.alloc(44);
    h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
    h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40);
    return Buffer.concat([h, data]);
};
const songs = [['Calm minor.wav', wav(66, [57, 60, 64], 0.08, 0.2)], ['Calm major.wav', wav(70, [60, 64, 67], 0.08, 0.2)], ['Intense minor.wav', wav(150, [64, 67, 71], 0.5, 1.5)], ['Intense major.wav', wav(146, [62, 66, 69], 0.5, 1.5)]];
const stored = new Map();
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<div id="sheld"><div id="chat"></div><div id="form_sheld"><form id="send_form"><textarea id="send_textarea"></textarea><div id="rightSendForm"></div></form></div></div>
<div id="extensions_settings2"></div>
<script>
window.toastr = { info(){}, warning(t){ (window.__warn ??= []).push(t); }, success(){} }; window.__h = {};
// Each audio element the extension plays, kept to read its state.
window.__media = new Set(); const play0 = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__media.add(this); return play0.call(this); };
const ctx = { name1: 'Mara', name2: 'Narrator', chatMetadata: { rulesEngine: { state: { people: {} } } }, chat: [], extensionSettings: { 'rules-engine': { box: false } },
  eventSource: { on(e, f) { (window.__h[e] ??= []).push(f); } },
  eventTypes: { MESSAGE_RECEIVED: 'mr', CHAT_CHANGED: 'cc', USER_MESSAGE_RENDERED: 'umr', CHARACTER_MESSAGE_RENDERED: 'cmr', MESSAGE_UPDATED: 'mu', MESSAGE_DELETED: 'md', MESSAGE_SWIPED: 'ms', GENERATION_STARTED: 'gs', MORE_MESSAGES_LOADED: 'mml' },
  setExtensionPrompt() {}, saveSettingsDebounced() {}, registerFunctionTool() {}, unregisterFunctionTool() {}, saveMetadata: async () => {}, saveMetadataDebounced() {},
  renderExtensionTemplateAsync: async () => (await fetch('http://rules.test/ext/settings.html')).text(), POPUP_TYPE: { TEXT: 1, INPUT: 2 }, callGenericPopup: async () => null,
  getCurrentChatId: () => 'c1', characters: [], writeExtensionField: async () => {}, generate: async () => {}, getRequestHeaders: () => ({ 'Content-Type': 'application/json' }) };
window.SillyTavern = { getContext: () => ctx };
window.__ready = import('http://rules.test/ext/src/index.js').then(() => new Promise(r => { const t = setInterval(() => { if (document.getElementById('rules_engine_music_add')) { clearInterval(t); r(true); } }, 50); }));
</script></body></html>`;
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await (await browser.newContext()).newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
await page.route('http://rules.test/**', async route => {
    const req = route.request(), u = decodeURIComponent(new URL(req.url()).pathname);
    if (u === '/__page.html') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
    if (u === '/api/files/upload') { const b = JSON.parse(req.postData()); if (!/^[a-zA-Z0-9_\-.]+$/.test(b.name)) return route.fulfill({ status: 400, body: 'Illegal character in filename' }); stored.set(`user/files/${b.name}`, Buffer.from(b.data, 'base64')); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ path: `user/files/${b.name}` }) }); }
    if (u === '/api/files/delete') { const b = JSON.parse(req.postData()); stored.delete(b.path); return route.fulfill({ status: 200, body: 'OK' }); }
    if (stored.has(u.slice(1))) return route.fulfill({ status: 200, contentType: 'audio/wav', body: stored.get(u.slice(1)) });
    const f = u.startsWith('/ext/') ? path.join(root, u.slice(5)) : '';
    if (!f || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: { '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.html': 'text/html' }[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
await page.goto('http://rules.test/__page.html');
await page.evaluate(() => window.__ready);
const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'songs-'));
for (const [name, data] of songs) fs.writeFileSync(path.join(dir, name), data);
const t0 = Date.now();
await page.setInputFiles('#rules_engine_music_files', songs.map(([name]) => path.join(dir, name)));
await page.waitForFunction(() => document.querySelectorAll('.rules-song').length === 4 && !document.getElementById('rules_engine_music_status').textContent, null, { timeout: 120000 });
console.log(`added 4 songs in ${Date.now() - t0} ms; uploaded: ${[...stored.keys()].join(', ')}`);
for (const row of await page.$$eval('.rules-song', rs => rs.map(r => `${r.querySelector('.rules-song-name').textContent}: ${r.querySelector('.rules-song-cues').textContent}`))) console.log(`  ${row}`);
console.log(`  areas: ${(await page.$$eval('.rules-area input', is => is.map(i => i.value))).join(' | ')}`);
const now = () => page.$eval('#rules_engine_music_now', e => e.textContent);
const fire = (e, arg) => page.evaluate(([e, arg]) => { for (const f of window.__h[e] ?? []) f(arg); }, [e, arg]);
console.log(`no feeling: ${await now()}`);
await page.evaluate(async () => {
    const VC = await import('http://rules.test/ext/src/rules/voice-code.js'), c = window.SillyTavern.getContext(), t = 'I sit down by the window.';
    const r = VC.markWords(t, 0, 1, 'feeling:sadness');
    c.chat.push({ is_user: true, name: 'Mara', mes: t.slice(0, r.from) + r.insert + t.slice(r.to) });
});
await fire('umr', 0);
console.log(`Mara's line marked sad: ${await now()}`);
await page.evaluate(() => { const c = window.SillyTavern.getContext(); c.chat.push({ is_user: true, name: 'Mara', mes: 'I open the letter.' }); c.chatMetadata.rulesEngine.state.people.Tom = { feelings: [{ type: 'joy', left: 120 }] }; });
await fire('mr', 1);
console.log(`Tom's joy: ${await now()}`);
await page.fill('.rules-song:nth-child(2) .rules-song-set', 'Tom');
await page.dispatchEvent('.rules-song:nth-child(2) .rules-song-set', 'change');
console.log(`Tom's joy, "Calm major" in Tom's set: ${await now()}`);
await page.waitForTimeout(4500);
const audio = await page.evaluate(() => [...window.__media].map(a => `${decodeURIComponent(a.src.split('/').pop()).replace(/^rules-song-\d+-/, '')} ${a.paused ? 'paused' : 'playing'} at volume ${a.volume.toFixed(2)}, ${a.currentTime.toFixed(1)} s`).join('; '));
console.log(`after the crossfade: ${audio}`);
await page.click('.rules-song:nth-child(4) .rules-song-remove');
await page.waitForFunction(() => document.querySelectorAll('.rules-song').length === 3);
console.log(`removed one: ${stored.size} files kept, ${await page.$$eval('.rules-song', r => r.length)} songs listed`);
console.log(errs.join(' | ') || 'no page errors', (await page.evaluate(() => window.__warn ?? [])).join(' | ') || 'no warnings');
await browser.close();
fs.rmSync(dir, { recursive: true });
