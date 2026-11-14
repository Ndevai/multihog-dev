// A chat drawn with SillyTavern's own stylesheets and message template (read from a checkout of SillyTavern as files; none of
// its scripts run) and the extension loaded through its own index.js with a stand-in context, as toolbar.mjs does.
// Usage: node st-chat.mjs <repo root> <SillyTavern checkout> <out.png> [theme: a file name in default/content/themes, or light]
//        [display: flat|bubble|document] [width] [page: on|off] [measure or -] [box: off|voice|message|log] [taps on "next"]
//        [page colours: light|dark] [picture: none|large] [typing: off|on]
// With the box on, the chat keeps the height of a phone's screen and the picture is of that screen.
// With "measure" it prints one line per check and MISS <label> on a fault. RULES_PEOPLE (JSON) sets the engine's people,
// RULES_STATE (JSON) more of its state (the scene's setting, clock, latitude and longitude). RULES_EXTRA_CSS (a file) is
// added after the extension's stylesheet and RULES_BODY_CLASS to the body's classes, to draw a trial look. RULES_SETTINGS (JSON)
// overrides the extension's settings; RULES_ROUTES (JSON: [[regular expression, local path with $1…]]) answers outside URLs
// (the page's and its workers') from local files; RULES_VOICE_OUT (a file) receives the voice heard in the own-rate step.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, st, out, themeName = 'Dark Lite', display = 'flat', width = '412', pageArg = 'on', measure = '', boxArg = 'off', steps = '0', colours = 'light', picture = 'none', typingArg = 'off'] = process.argv.slice(2);
const pub = path.join(st, 'public');
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.wav': 'audio/wav', '.json': 'application/json', '.css': 'text/css', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.html': 'text/html', '.png': 'image/png', '.svg': 'image/svg+xml' };

// SillyTavern's page: the stylesheets its index.html links, in its order, and its message template.
const index = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const sheets = [...index.matchAll(/<link\b[^>]*>/g)].map(m => m[0]).filter(l => /rel="stylesheet"/.test(l)).map(l => /href="([^"]+)"/.exec(l)?.[1]).filter(Boolean);
const template = index.slice(index.indexOf('<div id="message_template"'), index.indexOf('<div id="group_avatars_template"'));
// A shipped theme as power-user.js applies it: the colours as variables on the root, the display settings as classes on the body.
// "light" is no shipped theme: SillyTavern's variables set to a light page, as tests/ui.test.mjs lists it.
const LIGHT = { main_text_color: 'rgba(30, 30, 30, 1)', italics_text_color: 'rgba(110, 110, 110, 1)', underline_text_color: 'rgba(60, 120, 90, 1)', quote_text_color: 'rgba(150, 80, 10, 1)', blur_tint_color: 'rgba(243, 241, 234, 1)',
    chat_tint_color: 'rgba(243, 241, 234, 1)', user_mes_blur_tint_color: 'rgba(255, 255, 255, 0.5)', bot_mes_blur_tint_color: 'rgba(255, 255, 255, 0.5)', shadow_color: 'rgba(0, 0, 0, 0)', border_color: 'rgba(0, 0, 0, 0.2)', shadow_width: 0, blur_strength: 0, font_scale: 1, noShadows: true, timestamps_enabled: true };
const theme = themeName === 'light' ? LIGHT : JSON.parse(fs.readFileSync(path.join(st, 'default/content/themes', `${themeName}.json`), 'utf8'));
const vars = { '--SmartThemeBodyColor': theme.main_text_color, '--SmartThemeEmColor': theme.italics_text_color, '--SmartThemeUnderlineColor': theme.underline_text_color, '--SmartThemeQuoteColor': theme.quote_text_color,
    '--SmartThemeBlurTintColor': theme.blur_tint_color, '--SmartThemeChatTintColor': theme.chat_tint_color, '--SmartThemeUserMesBlurTintColor': theme.user_mes_blur_tint_color, '--SmartThemeBotMesBlurTintColor': theme.bot_mes_blur_tint_color,
    '--SmartThemeShadowColor': theme.shadow_color, '--SmartThemeBorderColor': theme.border_color, '--fontScale': theme.font_scale ?? 1, '--blurStrength': theme.blur_strength ?? 10, '--shadowWidth': theme.shadow_width ?? 2 };
const classes = [theme.noShadows ? 'noShadows' : '', theme.fast_ui_mode ? 'no-blur' : '', display === 'bubble' ? 'bubblechat' : display === 'document' ? 'documentstyle' : '', theme.timer_enabled ? '' : 'no-timer',
    theme.timestamps_enabled === false ? 'no-timestamps' : '', theme.mesIDDisplay_enabled ? '' : 'no-mesIDDisplay', theme.message_token_count_enabled ? '' : 'no-tokenCount', theme.hideChatAvatars_enabled ? 'hideChatAvatars' : ''].filter(Boolean).join(' ');
// The chat stands in the page's flow, so one screenshot holds all of it; a grey wallpaper stands behind a see-through chat tint.
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><base href="http://rules.test/st/">
${sheets.map(h => `<link rel="stylesheet" href="${h}">`).join('\n')}
<link rel="stylesheet" href="http://rules.test/ext/style.css">${process.env.RULES_EXTRA_CSS ? `<style>${fs.readFileSync(process.env.RULES_EXTRA_CSS, 'utf8')}</style>` : ''}
<style>:root { ${Object.entries(vars).map(([k, v]) => `${k}: ${v};`).join(' ')} }
html, body { height: auto; overflow: visible; } body { background: linear-gradient(160deg, #3b4252, #20242c); }
#sheld { position: static; height: auto; max-height: none; margin: 0 auto; width: min(100vw, 800px); max-width: 100vw; } #chat { max-height: none; overflow: visible; }
#form_sheld { position: static; } #send_textarea { min-height: 2.6em; }${boxArg !== 'off' ? ' #chat { height: 560px; max-height: 560px; overflow-y: auto; }' : ''}</style></head><body class="${classes} ${process.env.RULES_BODY_CLASS ?? ''}">
<div id="sheld"><div id="chat"></div>
<div id="form_sheld"><form id="send_form" class="no-connection"><div id="nonQRFormItems"><div id="leftSendForm" class="alignContentCenter"><div id="options_button" class="fa-solid fa-bars interactable" tabindex="0"></div></div>
<textarea id="send_textarea" name="text" class="mdHotkeys" placeholder="Type a message"></textarea><div id="rightSendForm" class="alignContentCenter"><div id="send_but" class="fa-solid fa-paper-plane interactable" tabindex="0"></div></div></div></form></div></div>
<div id="extensions_settings2" style="display:none"></div><div id="tpl" style="display:none">${template}</div>
<script>
window.toastr = { info(){}, warning(){}, success(){} }; window.__h = {};
const ctx = { name1: 'Mara', name2: 'Narrator', chatMetadata: ${JSON.stringify(process.env.RULES_PEOPLE || process.env.RULES_STATE ? { rulesEngine: { state: { people: JSON.parse(process.env.RULES_PEOPLE ?? '{}'), ...JSON.parse(process.env.RULES_STATE ?? '{}') } } } : {})}, chat: [], extensionSettings: ${JSON.stringify({ 'rules-engine': { page: pageArg !== 'off', pageColours: colours, box: boxArg !== 'off', boxUnit: boxArg === 'message' ? 'message' : 'voice', boxPicture: picture, boxTyping: typingArg === 'on', ...JSON.parse(process.env.RULES_SETTINGS ?? '{}') } })}, eventSource: { on(e, f) { (window.__h[e] ??= []).push(f); } },
  eventTypes: { MESSAGE_RECEIVED: 'mr', CHAT_COMPLETION_SETTINGS_READY: 'ccsr', TEXT_COMPLETION_SETTINGS_READY: 'tcsr', GENERATION_STARTED: 'gs', MESSAGE_SWIPED: 'ms', CHAT_CHANGED: 'cc', MESSAGE_DELETED: 'md', USER_MESSAGE_RENDERED: 'umr', CHARACTER_MESSAGE_RENDERED: 'cmr', MESSAGE_UPDATED: 'mu', MORE_MESSAGES_LOADED: 'mml' },
  setExtensionPrompt() {}, saveSettingsDebounced() {}, registerFunctionTool() {}, unregisterFunctionTool() {}, saveMetadata: async () => {}, saveMetadataDebounced() {},
  renderExtensionTemplateAsync: async () => (await fetch('http://rules.test/ext/settings.html')).text(), POPUP_TYPE: { TEXT: 1, INPUT: 2 }, callGenericPopup: async () => null,
  getCurrentChatId: () => 'c1', characters: [{ name: 'Kyoko', avatar: 'Kyoko.png' }], writeExtensionField: async () => {}, generate: async () => {} };
window.SillyTavern = { getContext: () => ctx };
window.__ready = import('http://rules.test/ext/src/index.js').then(() => new Promise(r => { const t = setInterval(() => { if (document.getElementById('rules-voice')) { clearInterval(t); r(true); } }, 50); }));
</script></body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: Number(width), height: 900 }, deviceScaleFactor: measure === 'measure' ? 1 : 2 }), page = await context.newPage();
// Outside URLs answered from local files (the voice's networks and recordings), for the page and its workers alike.
for (const [re, to] of JSON.parse(process.env.RULES_ROUTES ?? '[]')) await context.route(new RegExp(re), route => {
    const f = route.request().url().replace(new RegExp(re), to);
    return fs.existsSync(f) ? route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: types[path.extname(f)] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } }) : route.fulfill({ status: 404, body: '' });
});
const errs = [];
page.on('pageerror', e => errs.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); if (m.type() === 'warning' && /\[Rules engine\]/.test(m.text())) console.log('warning:', m.text()); });
await context.route('http://rules.test/**', route => {
    const u = decodeURIComponent(new URL(route.request().url()).pathname);
    if (u === '/__page.html') return route.fulfill({ status: 200, contentType: 'text/html', body: html });
    // A character card's picture at full size (the box's large picture).
    if (u.startsWith('/st/characters/')) return route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 100"><rect width="60" height="100" fill="#8a7fa8"/><circle cx="30" cy="22" r="12" fill="#eee"/><rect x="12" y="38" width="36" height="62" rx="8" fill="#eee"/></svg>' });
    const [base, rel] = u.startsWith('/ext/') ? [root, u.slice(5)] : u.startsWith('/st/') ? [pub, u.slice(4)] : [null, ''];
    const f = base ? path.join(base, rel) : '';
    // Of SillyTavern only stylesheets, fonts and pictures are served: its scripts stay unread.
    if (!base || !f.startsWith(base) || (base === pub && path.extname(f) === '.js') || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ status: 200, contentType: types[path.extname(f)] ?? 'application/octet-stream', body: fs.readFileSync(f) });
});
await page.goto('http://rules.test/__page.html');
await page.evaluate(() => window.__ready);
const info = await page.evaluate(async () => {
    const VC = await import('http://rules.test/ext/src/rules/voice-code.js'), U = await import('http://rules.test/ext/src/ui.js'), R = await import('http://rules.test/ext/src/rules/reading.js');
    // A line's marks: [words, mark] pairs, set as the toolbar sets them on a selection (specimen.mjs).
    const mark = (t, pairs) => {
        for (const [w, id] of pairs) {
            const i = VC.visible(t).indexOf(w), cps = [...t];
            if (i < 0) throw new Error(`no "${w}"`);
            const isTag = c => { const p = c.codePointAt(0); return p >= 0xE0020 && p <= 0xE007F; };
            const rawAt = n => { let r = 0, s = 0; for (const c of cps) { if (!isTag(c)) { if (s === n) break; s += c.length; } r += c.length; } return r; };
            const r = VC.markWords(t, rawAt(i), rawAt(i + w.length), id);
            t = t.slice(0, r.from) + r.insert + t.slice(r.to);
        }
        return t;
    };
    const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    // A message's text as SillyTavern's formatting writes it: paragraphs, quoted words in <q>, *words* in <em>.
    const format = t => t.split('\n\n').map(p => `<p>${esc(p).replace(/"[^"]*"/g, q => `<q>${q}</q>`).replace(/\*([^*]+)\*/g, '<em>$1</em>')}</p>`).join('');
    const note = calls => ({ acts: R.readingItems(calls, 'Mara'), things: [] });
    const lines = [
        { name: 'Narrator', t: 'The tavern door bangs shut behind you. Tom looks up from the dice and pushes a stool out with his boot. "You are late," he says, *not quite smiling*. "Sit. Will has been counting the same six coins since noon."\n\nWill does not look up. A candle gutters between them, and past the back door someone drags a crate over stone.' },
        { user: true, t: mark('I lean in close to Tom. "They are right behind that door. Do not make a sound."', [['I', 'feeling:fear'], ['"They are right behind that door. Do not make a sound."', 'whisper'], ['Do not make a sound."', 'slow'], ['right', 'stress']]),
            calls: [{ tool: 'Communicate', args: { speaker: 'Mara', listener: 'Tom', means: 'speech', effort: 'whisper', message: 'They are right behind that door. Do not make a sound.' } }] },
        { name: 'Narrator', t: 'Tom\'s hand stops over the dice. He hears you: the whisper carries the half metre between you and no further. "How many?" he breathes.' },
        { user: true, t: 'Mara tries to work out the riddle chalked on the door before the guard comes back.',
            calls: [{ tool: 'WorkOut', args: { who: 'Mara', problem: 'the riddle chalked on the door', kind: 'a riddle or trick that needs a new view', seconds: 60 } }] },
        { user: true, t: mark('I stand up. "Get out of my house, right now, before I throw you out myself. No. Not one more word."', [['I', 'feeling:anger'], ['right now', 'loud'], ['now', 'up'], ['now', 'down'], ['myself', 'stress'], ['No', 'stretch'], ['house', 'pause'], ['Not one more word', 'creaky'], ['word', 'down']]),
            calls: [{ tool: 'Communicate', args: { speaker: 'Mara', listener: 'Tom', means: 'speech', effort: 'loud', message: 'Get out of my house, right now, before I throw you out myself.' } }, { tool: 'Act', args: { who: 'Mara', action: 'stands up' } }] },
        { user: true, t: 'I walk to the back door and listen for a while before I open it.', calls: [{ tool: 'Listen', args: { listener: 'Mara', sound: 'steps behind the door', distance_m: 2 } }] },
        // Section 50: a quotation whose speaker only the reply's own name gives (rulesSpeakers), two speakers acting in one
        // paragraph, a key word (rulesKeys), and a paragraph longer than the box.
        { name: 'Narrator', t: '"Who set all this up?"\n\nKyoko frowns at the door. "And why did they choose us?" Mara shrugs. "No idea."\n\nThe lock gives with a dry click and the door swings inward on a dark stair. Dust lies thick on every step, and the air that rises from below smells of wet stone and old smoke. Somewhere far down, water drips in a slow and even beat, and a draught bends the candle flame sideways. Nothing else stirs on the stair.',
            extra: { rulesSpeakers: { 0: [{ q: '"Who set all this up?"', who: 'Kyoko' }] }, rulesKeys: { 0: [{ phrase: 'lock gives', result: 'The lock gives' }] } } },
        { name: 'Narrator', html: '<p>Nothing moves. On the door someone has chalked:</p><blockquote><p>What has keys but opens no locks?</p></blockquote><p>Below it, <u>underlined twice</u>, a tally: <code>IIII II</code>, and <strong>one word</strong> rubbed out.</p>' },
    ];
    const chat = document.getElementById('chat'), c = window.SillyTavern.getContext();
    lines.forEach((l, i) => {
        const mes = document.querySelector('#tpl .mes').cloneNode(true);
        mes.setAttribute('mesid', String(i)); mes.setAttribute('ch_name', l.user ? 'Mara' : l.name); mes.setAttribute('is_user', String(!!l.user)); mes.setAttribute('is_system', 'false');
        mes.querySelector('.name_text').textContent = l.user ? 'Mara' : l.name; mes.querySelector('.timestamp').textContent = 'November 11, 2026 9:41 AM';
        mes.querySelector('.avatar img').src = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" fill="${l.user ? '#7a6a58' : '#56677a'}"/><circle cx="25" cy="20" r="9" fill="#ddd"/><rect x="9" y="33" width="32" height="20" rx="10" fill="#ddd"/></svg>`)}`;
        mes.querySelector('.mes_text').innerHTML = l.html ?? format(l.t);
        if (i === lines.length - 1) mes.classList.add('last_mes');
        chat.appendChild(mes);
        c.chat.push({ is_user: !!l.user, name: l.user ? 'Mara' : l.name, mes: l.t ?? '', ...l.calls || l.extra ? { extra: { ...l.extra ?? {}, ...l.calls ? { [U.NOTE_KEY]: { ...note(l.calls), line: l.t } } : {} } } : {} });
    });
    for (const f of window.__h['cc'] ?? []) f();
    await document.fonts.ready;
    return { body: document.body.className, tone: document.body.getAttribute('data-rules-tone'), font: getComputedStyle(document.querySelector('.mes_text')).fontFamily.slice(0, 60) };
});
await page.waitForTimeout(200);
if (boxArg !== 'off') {
    // The box as the player drives it: the chat opens at its newest message; "back" to the first, then the taps asked for.
    // The place, the plate as drawn (the name shown, the words at its right), the unit's colour and its first words; with the
    // large picture, the picture's source.
    const place = () => page.evaluate(() => {
        const mes = document.querySelector('#chat .rules-now'), shown = e => !!e && e.getClientRects().length > 0;
        const name = [...mes.querySelectorAll('.name_text, .rules-who')].find(shown)?.textContent;
        const words = [...mes.querySelectorAll('.rules-mode')].filter(shown).map(e => `[${e.textContent}]`).join('');
        const unit = mes.querySelector('.rules-unit-now'), fig = document.getElementById('rules-box-figure');
        return `${document.getElementById('rules-box-count')?.textContent} | ${name}${words ? ` ${words}` : ''} | ${unit ? getComputedStyle(unit).color : ''} | ${(unit?.textContent ?? mes.querySelector('.mes_text').textContent).trim().slice(0, 48)}${mes.querySelector('.rules-unit-now mark.rules-key') ? ' | key: ' + mes.querySelector('.rules-unit-now mark.rules-key').textContent : ''}${shown(fig) ? ` | picture ${fig.getAttribute('src').slice(0, 24)}` : ''}`;
    });
    for (let i = 0; i < 40; i++) await page.click('#rules-box-back');
    console.log(`first: ${await place()}`);
    for (let i = 0; i < Number(steps); i++) { await page.keyboard.press('ArrowRight'); console.log(`${i + 1}: ${await place()}`); }
    if (typingArg === 'on') {
        // Letters one by one: after a step, the letters not yet shown are a highlight range; it shrinks as time passes, a tap
        // shows the rest, and left alone it ends when box.ts revealTimes says the last letter appears. Then AUTO.
        const hidden = () => page.evaluate(() => { const h = CSS.highlights.get('rules-unshown'); return h ? [...h][0].toString().length : 0; });
        for (let i = 0; i < 40; i++) await page.click('#rules-box-back');
        await page.keyboard.press('ArrowRight');
        const a = await hidden(); await page.waitForTimeout(400); const b = await hidden();
        await page.keyboard.press('ArrowRight'); const c = await hidden(), at = await place();
        console.log(`typing: ${a} letters unshown at once, ${b} after 400 ms; a tap shows the rest: ${c} unshown, still at ${at.split(' | ')[0]}`);
        await page.keyboard.press('ArrowRight');
        const t0 = Date.now(), want = await page.evaluate(async () => { const B = await import('http://rules.test/ext/src/rules/box.js'); const u = document.querySelector('.rules-unit-now'); return Math.round(B.revealTimes(u.textContent, u.getAttribute('data-said') === 'true').at(-1)); });
        while (await hidden() && Date.now() - t0 < 20000) await page.waitForTimeout(20);
        console.log(`typing: the unit appeared in ${Date.now() - t0} ms (revealTimes ${want} ms)`);
        await page.click('#rules-box-auto');
        const from = (await place()).split(' | ')[0], t1 = Date.now();
        while ((await place()).split(' | ')[0] === from && Date.now() - t1 < 30000) await page.waitForTimeout(20);
        console.log(`auto: from ${from} to ${(await place()).split(' | ')[0]} after ${Date.now() - t1} ms; plate ${(await place()).split(' | ')[1]}`);
        await page.click('#rules-box-auto');
        // Said words at the speaker's own rate (voice-body.ts) when the engine tracks the speaker (RULES_PEOPLE): the next said unit.
        while ((await page.evaluate(() => document.querySelector('.rules-unit-now')?.getAttribute('data-said'))) !== 'true') { await page.keyboard.press('ArrowRight'); if (await hidden()) await page.keyboard.press('ArrowRight'); }
        while (await hidden()) await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft'); await page.keyboard.press('ArrowRight');
        await page.evaluate(() => { window.__played = []; const start = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { if (this.buffer) window.__played.push({ wall: Date.now(), s: this.buffer.duration, rate: this.buffer.sampleRate, samples: Array.from(this.buffer.getChannelData(0)) }); return start.apply(this, a); }; });
        const t2 = Date.now(), own = await page.evaluate(async () => {
            const B = await import('http://rules.test/ext/src/rules/box.js'), V = await import('http://rules.test/ext/src/rules/voice-body.js'), u = document.querySelector('.rules-unit-now'), who = u.getAttribute('data-who');
            const p = window.SillyTavern.getContext().chatMetadata?.rulesEngine?.state?.people?.[who], v = p ? V.voiceOf({ heightCm: p.heightCm, sex: p.sex, age: p.age, language: p.languages?.[0], rateZ: p.rateZ }) : null;
            return { who, text: u.textContent.slice(0, 30), rate: v?.sylPerS ?? null, ms: Math.round(B.revealTimes(u.textContent, true, v ? v.sylPerS / 5 : 1).at(-1)), plain: Math.round(B.revealTimes(u.textContent, true, 1).at(-1)), title: document.querySelector('.rules-now .rules-who')?.title ?? '' };
        });
        while (await hidden() && Date.now() - t2 < (process.env.RULES_ROUTES ? 120000 : 20000)) await page.waitForTimeout(20);
        const typedAt = Date.now();
        // The voice heard: when it began against the moment the unit was entered, its length against the typing's end.
        const heard = await page.evaluate(() => window.__played.map(p => ({ ...p, samples: undefined, n: p.samples.length })));
        if (heard.length) {
            const last = heard.at(-1);
            console.log(`voice: ${heard.length} sound(s); the line's ${last.s.toFixed(2)} s at ${last.rate} Hz began ${last.wall - t2} ms after the unit was entered; typing ended ${typedAt - last.wall - Math.round(last.s * 1000)} ms from the sound's end`);
            if (process.env.RULES_VOICE_OUT) {
                const a = await page.evaluate(() => window.__played.at(-1).samples), pcm = Buffer.alloc(a.length * 2), pk = Math.max(...a.map(Math.abs)) || 1;
                a.forEach((v, i) => pcm.writeInt16LE(Math.round(v / pk * 0.9 * 32767), i * 2));
                const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(last.rate, 24); h.writeUInt32LE(last.rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
                fs.writeFileSync(process.env.RULES_VOICE_OUT, Buffer.concat([h, pcm]));
            }
        } else if (process.env.RULES_ROUTES) console.log('MISS voice: nothing was played');
        console.log(`own rate: ${own.who} "${own.text}…" appeared in ${Date.now() - t2} ms (at ${own.rate ?? 'the unmarked'} syllables/s: ${own.ms} ms; at the unmarked 5: ${own.plain} ms); plate hover: ${own.title || '(none)'}`);
    }
    if (boxArg === 'log') await page.click('#rules-box-log');
    const drawn = await page.evaluate(() => ({ messages: [...document.querySelectorAll('#chat .mes')].filter(m => m.getClientRects().length).length, pictures: [...document.querySelectorAll('#chat .mesAvatarWrapper')].filter(m => m.getClientRects().length).length }));
    console.log(`drawn: ${drawn.messages} message(s), ${drawn.pictures} picture(s)`);
}
if (measure === 'measure') {
    // What the look has to hold inside SillyTavern's own type: every line of a message at one height, no word drawn over the
    // next, no letter shadow or blur on a marked word, each text at 4.5:1 or more on what lies behind it (WCAG 1.4.3).
    const faults = await page.evaluate(() => {
        const out = [], px = v => parseFloat(v) || 0;
        // A colour as sRGB with its alpha, whatever notation the computed style gives it in (rgb, oklch, color-mix): painted on a
        // canvas and read back.
        const cv = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
        const rgba = s => { cv.clearRect(0, 0, 1, 1); cv.fillStyle = '#000'; cv.fillStyle = s; cv.fillRect(0, 0, 1, 1); const d = cv.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
        const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
        const over = (t, b) => [0, 1, 2].map(i => t[i] * t[3] + b[i] * (1 - t[3]));
        // What lies behind an element: its ancestors' background colours laid over each other, over the wallpaper's mean grey.
        const behind = e => { const stack = []; for (let n = e; n && n.nodeType === 1; n = n.parentElement) { const b = rgba(getComputedStyle(n).backgroundColor); if (b[3] > 0) stack.push(b); } return stack.reverse().reduce((bg, t) => over(t, bg), [45, 51, 63]); };
        const inkOf = e => { let o = 1; for (let n = e; n && n.nodeType === 1; n = n.parentElement) o *= px(getComputedStyle(n).opacity) || 1; const c = rgba(getComputedStyle(e).color); return [c[0], c[1], c[2], c[3] * o]; };
        const contrast = e => { const bg = behind(e), fg = over(inkOf(e), bg), [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
        let lowest = 99, lowestAt = '', lowestMark = 99;
        const strokes = [];
        for (const mes of document.querySelectorAll('#chat .mes')) {
            const id = mes.getAttribute('mesid');
            for (const p of mes.querySelectorAll('.mes_text > p')) {
                // Line heights: the distance between the tops of the line boxes of the paragraph's own text.
                // Text of another size (a mark, code, small print) sits lower in its line and is left out.
                const lh = px(getComputedStyle(p).lineHeight), r = document.createRange(), tops = new Set();
                const walk = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
                for (let n = walk.nextNode(); n; n = walk.nextNode()) { if (n.parentElement.closest('.rules-v, .rules-v-add, .rules-run, code, sub, sup, small')) continue; r.selectNodeContents(n); for (const b of r.getClientRects()) tops.add(Math.round(b.top * 4) / 4); }
                const ys = [...tops].sort((a, b) => a - b), gaps = ys.slice(1).map((y, i) => y - ys[i]).filter(g => g > lh / 2);
                // A line of marked words only has no text of its own to measure: the gap over it is a whole number of lines.
                const bad = gaps.filter(g => Math.abs(g - lh * Math.round(g / lh)) > 0.5);
                if (bad.length) out.push(`MISS line height: message ${id}, ${bad.map(g => g.toFixed(2)).join(' ')} px against ${lh} px`);
            }
            // A pitch stroke lies in the room between the lines: it stays clear of the letters of the line above.
            for (const w of mes.querySelectorAll('.rules-v[data-pitch]')) {
                const a = w.getBoundingClientRect(), em = px(getComputedStyle(w).fontSize), top = a.top - (0.03 + (px(getComputedStyle(document.body).getPropertyValue('--rules-pitch-rise')) || 0.3)) * em;
                const r = document.createRange(), walk = document.createTreeWalker(w.closest('p'), NodeFilter.SHOW_TEXT);
                let over = 0, room = 99;
                for (let n = walk.nextNode(); n; n = walk.nextNode()) { r.selectNodeContents(n); for (const b of r.getClientRects()) if (b.bottom <= a.top + 1 && b.right > a.left && b.left < a.right && b.bottom > a.top - 3 * em) { over = Math.max(over, b.bottom - top); room = Math.min(room, top - b.bottom); } }
                if (over > 0.5) out.push(`MISS stroke in the line above: "${w.textContent}" in message ${id} by ${over.toFixed(1)} px`);
                else if (room < 99) strokes.push(room / em);
            }
            // A pause's sign follows its word on the word's own line.
            for (const d of mes.querySelectorAll('.rules-v-add-micro, .rules-v-add-pause, .rules-v-add-rest')) {
                const b = [...d.getClientRects()].pop(), r = document.createRange();
                if (!b) continue;
                // The nearest thing before it that is drawn (the other look's sign for the same pause is not).
                let prev = d.previousSibling, last;
                for (; prev; prev = prev.previousSibling) { r.selectNodeContents(prev); last = [...r.getClientRects()].pop(); if (last) break; }
                if (last && Math.abs(last.bottom - b.bottom) > last.height / 2) out.push(`MISS pause away from its word: after "${prev.textContent.slice(-12)}" in message ${id}`);
            }
            for (const w of mes.querySelectorAll('.rules-v')) {
                const a = w.getBoundingClientRect(), n = w.nextSibling, s = getComputedStyle(w);
                if (n && n.nodeType === 3 && n.nodeValue.trim()) { const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 1); const b = r.getBoundingClientRect(); if (b.top < a.bottom - 2 && b.bottom > a.top + 2 && b.left < a.right - 1.5) out.push(`MISS over the next: "${w.textContent}" in message ${id} by ${(a.right - b.left).toFixed(1)} px`); }
                if (s.textShadow !== 'none' && !/rgba\([^)]*, 0\)/.test(s.textShadow)) out.push(`MISS letter shadow: "${w.textContent}" in message ${id}: ${s.textShadow}`);
                if (s.filter !== 'none') out.push(`MISS blur: "${w.textContent}" in message ${id}`);
            }
            for (const e of mes.querySelectorAll('.name_text, .rules-who, .timestamp, .mes_text p, .mes_text q, .mes_text em, .mes_text u, .mes_text code, .mes_text blockquote p, .rules-unit, mark.rules-key, .rules-v, .rules-v-add, .rules-run, .rules-mode, .rules-reading, .rules-tag, .rules-reading-taken')) {
                if (!e.textContent.trim() || !e.getClientRects().length) continue;
                const k = contrast(e);
                if (k < lowest) { lowest = k; lowestAt = `${e.className || e.tagName.toLowerCase()} in message ${id}`; }
                if (/\brules-(v|run)\b/.test(e.className)) lowestMark = Math.min(lowestMark, k);
                if (k < 4.5) out.push(`MISS contrast: ${e.className || e.tagName.toLowerCase()} "${e.textContent.trim().slice(0, 24)}" in message ${id}, ${k.toFixed(2)}:1`);
            }
        }
        out.unshift(`lowest contrast ${lowest.toFixed(2)}:1 (${lowestAt}), of a marked word ${lowestMark.toFixed(2)}:1${strokes.length ? `; least room over a pitch stroke ${Math.min(...strokes).toFixed(2)} em` : ''}`);
        return out;
    });
    console.log(`${themeName}, ${display}, ${width} px, page ${pageArg}: ${faults.filter(f => f.startsWith('MISS')).length} miss(es); ${faults[0]}`);
    for (const f of faults.slice(1)) console.log(`  ${f}`);
}
if (out && out !== '-') await page.screenshot({ path: out, fullPage: true });
console.log(out, JSON.stringify(info), errs.join(' | ') || 'no page errors');
await browser.close();
