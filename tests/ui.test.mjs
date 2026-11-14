// What the player sees (src/ui.ts, style.css): the reading note under their line, its other readings, the question popup,
// the kind colours and the period type. Run with a stand-in document, so it needs no browser; SillyTavern draws the same
// elements.
import fs from 'node:fs';
const U = await import('../src/ui.js');
const A = await import('../src/rules/ask.js');
const R = await import('../src/rules/reading.js');
const ROOT = new URL('..', import.meta.url).pathname;
let miss = 0, n = 0;
const ok = (c, m, got = '') => { n++; if (!c) { miss++; console.log(`MISS ${m}${got ? `: ${got}` : ''}`); } };

// A stand-in document: elements keep their children, attributes, listeners and text; setting innerHTML is counted, since the
// note's words are the player's and the model's and are set as text only.
let htmlSet = 0;
const el = tag => {
    const e = { tag, className: '', textContent: null, title: '', type: undefined, children: [], attrs: {}, on: {},
        appendChild(c) { this.children.push(c); return c; }, setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(t, f) { (this.on[t] ??= []).push(f); },
        click() { for (const f of this.on.click ?? []) f(); } };
    Object.defineProperty(e, 'innerHTML', { set() { htmlSet++; }, get() { return ''; } });
    return e;
};
const doc = { createElement: el, createTextNode: t => ({ ...el('#text'), textContent: t }) };
const all = (e, out = []) => { out.push(e); for (const c of e.children) all(c, out); return out; };
const byClass = (e, c) => all(e).filter(x => x.className.split(' ').includes(c));
const text = e => e.children.length ? e.children.map(text).join('') : e.textContent ?? '';
// A drawn word's own letters: what the typesetting adds (class rules-v-add) left out.
const own = e => e.className?.split(' ').includes('rules-v-add') ? '' : e.children.length ? e.children.map(own).join('') : e.textContent ?? '';

// U1: each call is one line, a tag naming its kind of rule and the call in the fewest words, the player's character left out
// (it makes every call shown); things read are tagged Thing; the guess is shown lowercased, with the others only while the
// line is the player's latest; a correction's note loses its framing.
const calls = [{ tool: 'Act', args: { who: 'Ann', action: 'walks after Tom', distance_m: 12 } }, { tool: 'Look', args: { viewer: 'Ann', target: 'Tom', distance_m: 12 } },
    { tool: 'Communicate', args: { speaker: 'Ann', listener: 'the guard', effort: 'whisper', message: 'Open the gate' } }];
const acts = R.readingItems(calls, 'Ann');
const note = { redone: 'The player corrects their last line: it meant Will.', taken: { label: 'Walk after Tom in the open', others: ['Catch up with Tom', 'Keep behind Tom, out of sight'] },
    acts, things: ['lamp → Argand lamp (1780)'] };
const v = U.noteView(note, true), old = U.noteView(note, false);
const rows = v.rows.map(r => `${r.tag} ${r.text}`);
ok(JSON.stringify(rows) === JSON.stringify(['Move walks after Tom · 12 m', 'Sight Tom · 12 m', 'Speech whisper → the guard: “Open the gate”', 'Thing lamp → Argand lamp (1780)']) && !rows.some(r => /Ann/.test(r)),
    'tagged rows, actor left out', JSON.stringify(rows));
ok(v.taken === 'walk after Tom in the open' && v.redone === 'it meant Will' && JSON.stringify(v.alts?.lines) === JSON.stringify(['no, catch up with Tom', 'no, keep behind Tom, out of sight']) && !old.alts,
    'guess and others on the latest line only', JSON.stringify([v.taken, v.redone, v.alts, old.alts]));
ok(U.noteView({ acts: [], things: [] }, true) === null && R.kindOf('BodyStrike') === 'body' && R.kindOf('Listen') === 'sound' && R.kindOf('PassTime') === 'time', 'an empty reading draws nothing; kinds');
// An older note, kept before kinds were stored, still gets its tag from the call.
ok(U.noteView({ acts: [{ text: 'Ann looks at Tom', detail: 'Look: viewer Ann, target Tom' }], things: [] }, true).rows[0].tag === 'Sight', 'old note tagged from its call');

// U2: drawn, the note is a <details> folded to one line (the guess with "or…", then each tag and its words), opened to one
// row per call with the call as hover text and the others as linked words, each filling the message box with its
// correction; every word is set as text (markup in a name stays letters); the era and the tone are on the element.
let filled = null;
const evil = U.noteView({ acts: [{ text: 'x', brief: '<img src=x onerror=alert(1)>', detail: 'Look: target <img>', kind: 'sight' }], things: [], taken: { label: 'Hit <b>Tom</b>', others: ['Hit Will'] } }, true);
const box = U.drawNote(doc, v, { era: 'c19', tone: 'dark' }, t => { filled = t; });
const sum = byClass(box, 'rules-reading-sum')[0], alts = byClass(box, 'rules-reading-alts')[0];
const links = byClass(alts ?? el('x'), 'rules-link');
ok(box.tag === 'details' && /rules-era-c19/.test(box.className) && box.attrs['data-tone'] === 'dark' && sum?.tag === 'summary', 'folded details with era and tone', `${box.tag} ${box.className}`);
ok(/^Redone: it meant Will☞ walk after Tom in the open— or…Move walks after Tom · 12 mSight Tom · 12 m/.test(text(sum)) && byClass(sum, 'rules-reading-or').length === 1, 'folded line', text(sum));
ok(text(alts) === 'Or did you mean to catch up with Tom or keep behind Tom, out of sight?' && links.length === 2, 'others as linked words', text(alts));
links[1]?.click();
ok(filled === 'no, keep behind Tom, out of sight' && all(box).some(x => x.title === 'Look: viewer Ann, target Tom, distance_m 12'), 'link fills the line; call on hover', String(filled));
const evilBox = U.drawNote(doc, evil, { era: 'now', tone: 'light' }, () => {});
ok(htmlSet === 0 && text(evilBox).includes('<img src=x onerror=alert(1)>') && /→ hit <b>Tom<\/b>/.test(text(evilBox)), 'note drawn as text', `${htmlSet} innerHTML sets`);
const tags = byClass(box, 'rules-tag').map(t => `${t.textContent}:${t.className.split(' ').find(c => c.startsWith('rules-k-'))}`);
ok(tags.includes('Sight:rules-k-sense') && tags.includes('Speech:rules-k-speech') && tags.includes('Thing:rules-k-thing') && tags.includes('Move:rules-k-move'), 'tags carry word and colour family', tags.join());

// U3: notes are kept on the player's messages and offer the others on the latest only; a narrator's message holding the key
// is not a player's line; a line edited since its reading shows none.
const chat = [{ is_user: true, mes: 'I follow Tom.', extra: { rulesReading: { ...note, line: 'I follow Tom.' } } }, { is_user: false, extra: { rulesReading: note } },
    { is_user: true, mes: 'I hit him.', extra: { rulesReading: note } }, { is_user: false }, { is_user: true, mes: 'I follow Will.', extra: { rulesReading: { ...note, line: 'I follow Tom.' } } }];
const drawn = U.notesOf(chat), drawnOld = U.notesOf(chat.slice(0, 4));
ok(JSON.stringify(drawn.map(d => d.index)) === '[0,2]' && !drawn[1].view.alts && !!drawnOld[1].view.alts && !drawnOld[0].view.alts, 'notes on player lines, others on the latest', JSON.stringify([drawn.map(d => d.index), drawnOld.map(d => [d.index, !!d.view.alts])]));

// U4: the question is a sentence: the player's words, then the choices linked alike and numbered, the words they share said
// once ("hit Tom or Will"); no OK, Cancel or other buttons, the sentence holding the focus (Enter picks nothing); clicks and
// number keys pick, "Say it another way" returns none.
const p = U.askPopup({ said: 'Hit <him>', choices: ['Hit Tom', 'Hit Will'] }, { era: 'c17', reduced: true });
const choiceTags = [...p.content.matchAll(/<button[^>]*rules-ask-choice[^>]*>/g)].map(m => m[0].replace(/data-choice="[^"]*"/, ''));
ok(/Do you mean to hit <button[^>]*><sup>1<\/sup>Tom<\/button> or <button[^>]*><sup>2<\/sup>Will<\/button>\?/.test(p.content) && new Set(choiceTags).size === 1 && choiceTags.length === 3,
    'choices in one sentence, alike', p.content);
ok(/<p class="rules-ask-prose" tabindex="-1" autofocus>/.test(p.content) && /“Hit &#60;him&#62;”/.test(p.content) && /rules-era-c17/.test(p.content) && p.options.okButton === false && p.options.cancelButton === false && !p.options.customButtons && p.options.animation === 'none',
    'no default; words escaped; period; still', p.content);
const done = [], keys = {}, fakes = ['0', '1', 'other'].map(c => ({ c, on: {}, getAttribute() { return this.c; }, addEventListener(t, f) { this.on[t] = f; } }));
p.options.onOpen({ dlg: { addEventListener: (t, f) => { keys[t] = f; }, querySelectorAll: () => fakes }, complete: r => done.push(r) });
fakes[1].on.click(); fakes[2].on.click();
for (const key of ['1', '3', 'Enter']) keys.keydown?.({ key, preventDefault() {} });
ok(JSON.stringify(done) === JSON.stringify([11, U.OTHER, 10]), 'clicks and number keys pick', JSON.stringify(done));
ok(U.askAnswer(11, 2) === 1 && U.askAnswer(U.OTHER, 2) === null && U.askAnswer(null, 2) === null && U.askAnswer(12, 2) === null, 'answers map back');
const things = U.askPopup({ said: 'lamp', choices: ['Argand lamp (1780)', 'oil lamp'], notes: ['a <hollow> wick', 'a wick in oil'], things: true });
ok(/Do you mean <button[^>]*><sup>1<\/sup>Argand lamp \(1780\)<\/button> <span class="rules-ask-note">\(a &#60;hollow&#62; wick\)<\/span> or <button/.test(things.content), 'things with their descriptions', things.content);
const sh = U.shared(['Catch up with Tom', 'Keep behind Tom, out of sight', 'Walk after Tom in the open']), sh2 = U.shared(['Look at Tom', 'Look at Will']);
ok(sh.lead === '' && sh.items[0] === 'catch up with Tom' && sh2.lead === 'look at' && sh2.items.join() === 'Tom,Will' && U.saidOf('"Follow the thief": which do you mean?') === 'Follow the thief', 'shared words said once', JSON.stringify([sh, sh2]));

// U5: each reading not taken, sent as its line, is read back as that reading (ask.ts correctionOf, correctionFix).
const has = () => true, ppl = [{ name: 'the thief' }, { name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }];
const round = [];
for (const line of ['I follow the thief through the market.', 'I take the bridge.', 'I hit him.']) {
    const q = A.openQuestion(line, 'Jack', ppl, has);
    for (const o of q?.options ?? []) {
        const last = o.fix.tool ? [{ tool: o.fix.tool, args: { attacker: 'Jack', [o.fix.arg]: q.options.find(x => x !== o).fix.value } }] : [];
        const f = A.correctionFix(A.correctionOf(A.correctionLine(o.label)) ?? '', line, 'Jack', ppl, last, has);
        const same = f && (o.fix.require ? f.require === o.fix.require : f.tool === o.fix.tool && f.arg === o.fix.arg && f.value === o.fix.value);
        if (!same) round.push(`${line} / ${o.label} → ${JSON.stringify(f)}`);
    }
}
ok(round.length === 0, 'change lines read back as their reading', round.join('; '));

// U6: the era from the story's year (the type a book of that time was set in), the mark for a guess, the theme's tone.
const eras = [1500, 1599, 1600, 1749, 1750, 1799, 1800, 1919, 1920, 1969, 1970, null].map(U.eraOf).join();
ok(eras === 'c16,c16,c17,c17,c18,c18,c19,c19,c20,c20,now,now' && U.markOf('c19') === '☞' && U.markOf('now') === '→' && U.toneOf('rgb(220, 220, 210)') === 'dark' && U.toneOf('rgba(30, 30, 30, 1)') === 'light', 'era, mark and tone', eras);

// U7: every kind's colour, as style.css mixes it with the theme's text colour, reads at 4.5:1 or more (WCAG 1.4.3) on each of
// SillyTavern's shipped themes (default/content/themes: text, chat tint and user message tint over black) and on a light
// theme; the hues are Okabe & Ito's.
const css = fs.readFileSync(`${ROOT}/style.css`, 'utf8');
const rgba = s => s.match(/[\d.]+/g).map(Number), hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const over = (t, b) => [0, 1, 2].map(i => t[i] * (t[3] ?? 1) + b[i] * (1 - (t[3] ?? 1)));
const lum = c => { const f = x => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const THEMES = { dark: [['Azure', 'rgba(171, 198, 223, 1)', 'rgba(23, 23, 23, 0)', 'rgba(0, 28, 174, 0.2)'], ['Cappuccino', 'rgba(235, 235, 235, 1)', 'rgba(50, 45, 50, 0.75)', 'rgba(34, 30, 32, 0.75)'],
    ['Celestial Macaron', 'rgba(229, 175, 162, 1)', 'rgba(18, 26, 40, 0.9)', 'rgba(51, 67, 90, 0.7)'], ['Dark Lite', 'rgba(220, 220, 210, 1)', 'rgba(23, 23, 23, 1)', 'rgba(30, 30, 30, 0.9)'],
    ['Dark V 1.0', 'rgba(207, 207, 197, 1)', 'rgba(29, 33, 40, 0.9)', 'rgba(29, 33, 40, 0.9)']], light: [['light', 'rgba(30, 30, 30, 1)', 'rgba(243, 241, 234, 1)', 'rgba(255, 255, 255, 0.5)']] };
// The dialogue page is one more light ground (style.css, body.rules-page): its inks and its ground are named colours (CSS
// Color 4, named colours), set as SillyTavern's theme variables inside each message, so U7 and R32 hold on it as on a theme.
const NAMED = { black: [0, 0, 0], white: [255, 255, 255], ivory: [255, 255, 240], dimgray: [105, 105, 105], silver: [192, 192, 192], darkslateblue: [72, 61, 139],
    lightskyblue: [135, 206, 250], gold: [255, 215, 0], darkgray: [169, 169, 169] };
const pageBlock = /body\.rules-page #chat \.mes \{([^}]*)\}/.exec(css)?.[1] ?? '';
const pageInk = k => NAMED[new RegExp(`--SmartTheme${k}: (\\w+);`).exec(pageBlock)?.[1] ?? ''], pageGround = NAMED[/background-color: (\w+);/.exec(pageBlock)?.[1] ?? ''];
if (pageInk('BodyColor') && pageGround) THEMES.light.push(['the dialogue page', `rgba(${pageInk('BodyColor').join(', ')}, 1)`, `rgba(${pageGround.join(', ')}, 1)`, `rgba(${pageGround.join(', ')}, 1)`]);
// The page's dark colours (style.css body.rules-page-dark) are one more dark ground, so U7 and R32 hold the kind and feeling
// colours on it too.
const darkBlock = /body\.rules-page\.rules-page-dark #chat \.mes \{([^}]*)\}/.exec(css)?.[1] ?? '';
const darkInk = k => NAMED[new RegExp(`--SmartTheme${k}: (\\w+);`).exec(darkBlock)?.[1] ?? ''], darkGround = NAMED[/background-color: (\w+);/.exec(darkBlock)?.[1] ?? ''];
if (darkInk('BodyColor') && darkGround) THEMES.dark.push(['the dark page', `rgba(${darkInk('BodyColor').join(', ')}, 1)`, `rgba(${darkGround.join(', ')}, 1)`, `rgba(${darkGround.join(', ')}, 1)`]);
const OKABE_ITO = ['#56B4E9', '#009E73', '#D55E00', '#E69F00', '#CC79A7', '#F0E442', '#0072B2'];
const shares = [...css.matchAll(/\[data-tone="(dark|light)"\] \.rules-k-(\w+) \{ color: color-mix\(in srgb, (#[0-9A-F]{6}) (\d+)%, var\(--SmartThemeBodyColor\)\); \}/g)];
const low = [];
for (const [, tone, fam, h, pct] of shares) for (const [name, body, chat, user] of THEMES[tone]) {
    const bg = over(rgba(user), over(rgba(chat), [0, 0, 0])), b = rgba(body), c = [0, 1, 2].map(i => hex(h)[i] * pct / 100 + b[i] * (1 - pct / 100));
    const r = contrast(c, bg); if (r < 4.5) low.push(`${tone} ${fam} on ${name}: ${r.toFixed(2)}`);
}
const fams = new Set(Object.values(U.FAMILY));
ok(shares.length === 14 && low.length === 0 && shares.every(s => OKABE_ITO.includes(s[3])) && [...fams].every(f => shares.filter(s => s[2] === f).length === 2), 'kind colours legible on every theme', `${shares.length} rules; ${low.join('; ')}`);

// U8: each period face style.css loads is in fonts/, each family has its licence, and no face is named with a Reserved Font
// Name (Libre Baskerville's subset is renamed, as the OFL asks of modified versions).
const urls = [...css.matchAll(/url\('([^']+)'\)/g)].map(m => m[1]), missing = urls.filter(u => !fs.existsSync(`${ROOT}/${u}`));
const licences = ['EBGaramond', 'IMFellEnglish', 'LibreBaskerville', 'OldStandard', 'LibreCaslonText'].filter(l => !fs.existsSync(`${ROOT}/fonts/OFL-${l}.txt`));
const families = [...css.matchAll(/font-family: '([^']+)'/g)].map(m => m[1]);
ok(urls.length === 10 && !missing.length && !licences.length && !families.some(f => /Libre Baskerville/.test(f)), 'period faces present, licensed, renamed', `${missing.join()} ${licences.join()} ${families.join()}`);

// P1: the player's marks read in code (src/rules/prosody.ts): each word with its marks and pauses, the feeling a ((…)) names,
// the line without its marks for reading its verbs, the effort the marks fix, the delivery in a few words.
const P = await import('../src/rules/prosody.js');
const line = '((angry)) "STOP looking at me, (.) who do you ↑think I am? You literally cannot keep your eyes off ˈme."';
const pr = P.readProsody(line), mk = w => pr.words.find(x => x.word.replace(/[^\p{L}]/gu, '').toLowerCase() === w)?.marks ?? [];
ok(pr.feeling === 'anger' && pr.plain === '"Stop looking at me, who do you think I am? You literally cannot keep your eyes off me."' && mk('stop').includes('loud') && mk('think').includes('up')
    && pr.words.find(x => /^me,/.test(x.word))?.pause === 0.1 && P.effortOf(pr) === 'raised', 'marks read in code', JSON.stringify(pr.words.filter(x => x.marks.length || x.pause)));
ok(P.deliveryOf(pr) === 'feeling: anger · louder: Stop · pitch up on think · stressed: me · short pause after me', 'delivery in few words', P.deliveryOf(pr));
const voqs = P.readProsody('I whisper to Tom, "{W meet me at the gate W}" .hhh {V̤ please V̤} hhh ☺fine☺ °no° Sto- wo::rd la(h)ter (0.5)');
const vm = w => voqs.words.find(x => x.word.replace(/[^\p{L}]/gu, '').toLowerCase() === w)?.marks ?? [];
ok(P.effortOf(voqs) === 'whisper' && vm('gate').includes('whisper') && vm('please').join() === 'inbreath,breathy,outbreath' && vm('fine').includes('smile') && vm('no').includes('quiet')
    && vm('sto').includes('cut') && vm('word').includes('stretch') && vm('later').includes('laugh') && voqs.words.at(-1).pause === 0.5, 'every mark read', JSON.stringify(voqs.words.map(x => [x.word, x.marks])));
// P2: ordinary text reads as it is: currency, times, a temperature, hyphenated words, a colon before speech, single
// parentheses, abbreviations in capitals, a plain sentence.
const plainLines = ['It cost £5 at 3:30, a well-known man said: (laughs) OK, the FBI was at 30° today.', 'Mr. Smith - no, I said "fine".', 'I hit him.', 'Shh, quiet! Hmm. I saw the USA team on TV.', '<b>bold</b> and (aside) text', 'We flew back to the US at 9 AM.'];
const moved = plainLines.filter(l => { const x = P.readProsody(l); return x.marked || x.plain !== l || x.words.some(w => w.marks.length); });
ok(moved.length === 0, 'ordinary text unread', moved.join(' | '));
// P3: no signs on screen (src/rules/voice-code.ts): every choice of the toolbar marks the word with hidden codes; the words
// shown stay the player's own, exactly; the engine reads the mark back on that word from its codes;
// choosing it again takes it off; quotation marks and punctuation stay where they were; a feeling replaces the line's last.
const VC = await import('../src/rules/voice-code.js');
const back = [], ids = U.VOICE_GROUPS.flatMap(g => g.items.map(i => i.id)).filter(i => !i.startsWith('feeling:'));
for (const id of ids) {
    const text = '"Stop looking at me," she said.', at = text.indexOf('looking') + 2;
    const r = VC.markWords(text, at, at, id), out = r ? text.slice(0, r.from) + r.insert + text.slice(r.to) : text;
    const x = VC.marksOf(out), word = x.words.find(w => /looking/i.test(w.word));
    const got = id === 'micro' || id === 'pause' ? word?.pause > 0 : (word?.marks ?? []).includes(id);
    const r2 = VC.markWords(out, at, at, id), off = r2 ? out.slice(0, r2.from) + r2.insert + out.slice(r2.to) : out;
    if (!got || VC.visible(out) !== text || off !== text) back.push(`${id}: ${VC.toNotation(out)} → ${JSON.stringify(word)}; off ${off === text}`);
}
const fA = VC.markWords('I go.', 0, 0, 'feeling:anger'), tA = fA.insert + 'I go.'.slice(fA.to), fB = VC.markWords(tA, 0, 0, 'feeling:fear'), tB = fB.insert + tA.slice(fB.to);
ok(back.length === 0 && ids.length === 19 && VC.marksOf(tB).feeling === 'fear' && VC.visible(tB) === 'I go.' && !/\(\(/.test(VC.visible(tB)), 'each toolbar choice marks its word unseen and reads back', back.join(' | ') + ` ${VC.toNotation(tB)}`);
// A selection marks every word it touches; a word with no letter takes none; the caret between words marks nothing.
const sel = VC.markWords('"one two," three', 1, 8, 'quiet'), selT = sel.insert, selN = VC.toNotation('"one two," three'.slice(0, sel.from) + selT + '"one two," three'.slice(sel.to));
ok(selN === '"°one two°," three' && VC.markWords('a  b', 2, 2, 'stress') === null && VC.markWords('— !', 0, 3, 'loud') === null, 'a selection marks every word; nothing between words', selN);
// P3b: Backspace and Delete take a marked letter as one character; a word left with no letter loses its marks.
const mk1 = (t, w, id) => { const i = t.indexOf(w) + 1, r = VC.markWords(t, i, i, id); return t.slice(0, r.from) + r.insert + t.slice(r.to); };
const apply = (s, r) => s.slice(0, r.from) + r.insert + s.slice(r.to), caretOf = r => r.from + r.insert.length;
const tm = mk1('at me, now', 'me', 'loud'), d1 = VC.keyDelete(tm, tm.indexOf(','), true), after1 = apply(tm, d1);
const d2 = VC.keyDelete(after1, caretOf(d1), true), after2 = apply(after1, d2);
const tf = mk1('a me b', 'me', 'up'), df = VC.keyDelete(tf, 3, false), afterF = apply(tf, df);
const ti = mk1('a I b', 'I', 'up'), di = VC.keyDelete(ti, 2, false), afterI = apply(ti, di);
ok(VC.visible(after1) === 'at m, now' && VC.tokens(after1).find(k => k.word === 'm,')?.codes.join() === 'L' && after2 === 'at , now' && VC.visible(afterF) === 'a m b' && VC.tokens(afterF).find(k => k.word === 'm')?.codes.join() === 'U'
    && afterI === 'a  b' && VC.keyDelete(tf, 2, false) === null && VC.keyDelete('plain', 3, true) === null && d1.from === tm.indexOf('me') + 1 && d1.to === tm.indexOf(','),
    'backspace takes a marked letter whole', JSON.stringify([VC.visible(after1), after2, VC.visible(afterF), afterI]));
// P3c: the box's layer holds the box's text exactly (each letter where the box has it), marked words in their group's
// colour; the chat's typesetting gives each marked word its marks' classes and adds the pause's dot and the feeling.
let line2 = '"Stop looking at me, who do you think I am?"';
for (const [w, id] of [['Stop', 'loud'], ['me,', 'micro'], ['think', 'up'], ['Stop', 'feeling:anger']]) line2 = mk1(line2, w, id);
const parts = U.mirrorParts(line2);
const typed = U.drawVoice(doc, line2), cls = typed.filter(x => x.className).map(x => `${x.className}:${x.textContent}`);
ok(parts.map(p => p.text).join('') === line2 && parts.find(p => p.family)?.family === 'body' && parts.filter(p => p.family).length === 3
    && cls.join('|') === 'rules-v-add rules-v-add-feeling:angrily|rules-v rules-v-loud:Stop|rules-v-add rules-v-add-micro: ·|rules-v rules-v-up:think' && typed.map(x => x.textContent).join('') === 'angrily "Stop looking at me, · who do you think I am?"',
    'box layer and chat typesetting', JSON.stringify([parts.map(p => p.family ?? '-').join(','), cls, typed.map(x => x.textContent).join('')]));
// The notation a model reads, and the reading of the voice, from a line marked unseen.
ok(VC.toNotation(line2) === '((angry)) "STOP looking at me, (.) who do you ↑think I am?"' && VC.toNotation('plain words') === 'plain words', 'unseen marks become the notation', VC.toNotation(line2));

// P4: the feeling heard in a voice: Juslin & Laukka 2003 Table 4's unweighted mean pi, within and across cultures, read as
// the share right among five feelings (pi = p(k − 1)/(1 + p(k − 2)) solved for p).
const pi = JSON.stringify(P.VOCAL_PI), five = P.heardRight('anger', true), back5 = five * 4 / (1 + five * 3);
ok(pi === '{"anger":[0.93,0.91],"fear":[0.88,0.82],"happiness":[0.87,0.74],"sadness":[0.93,0.91],"tenderness":[0.82,0.71]}' && Math.abs(back5 - 0.93) < 1e-9 && Math.abs(five - 0.7686) < 1e-3 && P.heardRight('happiness', false) < P.heardRight('happiness', true),
    'feeling heard at the measured rate', `${pi} ${five}`);
// R10: typed signs after an opening quotation mark or bracket are read (the first word of speech), VoQS braces with a bracket
// clinging to them too; one colon between letters is ordinary writing.
const q1 = P.readProsody('I tell him, "↑Stop that, °please°." \'({W meet me W})\' I read Re:Zero.'), qm = w => q1.words.find(x => x.word.replace(/[^\p{L}]/gu, '') === w)?.marks ?? [];
ok(qm('Stop').includes('up') && qm('please').includes('quiet') && qm('meet').includes('whisper') && qm('me').includes('whisper') && !qm('ReZero').length && /Re:Zero/.test(q1.plain) && !/\{W|W\}/.test(q1.plain), 'typed signs after a quotation mark', JSON.stringify(q1.words.filter(x => x.marks.length)));
// R11: Backspace after a marked one-letter word in quotes takes its marks with it.
{
  const VCb = await import('../src/rules/voice-code.js');
  const r = VCb.markWords('"I"', 1, 1, 'up'), t = '"I"'.slice(0, r.from) + r.insert + '"I"'.slice(r.to), d = VCb.keyDelete(t, t.length - 1, true), after = t.slice(0, d.from) + d.insert + t.slice(d.to);
  ok(after === '""', 'Backspace in quotes takes the marks', JSON.stringify(after));
}
// R26: a word left with no letter or digit loses its marks whatever punctuation stays ("I—", "I…", "«I»", "[I]"); one that
// keeps a letter keeps them ("U.S.A." less its A, "x—I" less its I).
{
  const del = (t, w, back) => { const m = mk1(t, w, 'up'), i = m.indexOf(w) + (back ? w.length : 0), at = back ? m.slice(i).search(/[^\u{E0020}-\u{E007F}]|$/u) + i : i, d = VC.keyDelete(m, at, back); return d ? apply(m, d) : null; };
  const gone = [['I—', 'I', true], ['I…', 'I', true], ['«I»', 'I', true], ['[I]', 'I', false], ['go I—', 'I', false]].map(([t, w, b]) => del(t, w, b));
  const kept = [['U.S.A.', 'A', true], ['x—I', 'I', true]].map(([t, w, b]) => del(t, w, b));
  ok(gone.every(x => x !== null && !VC.hasHidden(x)) && JSON.stringify(gone) === '["—","…","«»","[]","go —"]' && kept.every(x => x && VC.hasHidden(x) && VC.tokens(x)[0].codes.join() === 'U'),
      'a word with no letter left loses its marks', JSON.stringify([gone, kept.map(x => x && VC.toNotation(x))]));
}
// R27: VoQS braces a dash or an ellipsis clings to are read as braces ('"Wait—{W not now W}," she says', '—{W go W}…');
// braces with the label glued to a word are no span ("{WhelloW}", as "{Fred}" is none) and stay as typed.
{
  const a = P.readProsody('"Wait—{W not now W}," she says.'), b = P.readProsody('—{W go away W}…'), c = P.readProsody('"{WhelloW}"');
  const wh = p => p.words.filter(w => w.marks.includes('whisper')).map(w => w.word.replace(/[^\p{L}]/gu, '')).join(' ');
  ok(wh(a) === 'not now' && !/\{W|W\}/.test(a.plain) && /Wait—/.test(a.plain) && wh(b) === 'go away' && b.plain === '—go away…' && c.plain === '"{WhelloW}"' && !c.marked,
      'VoQS braces with a dash clinging', JSON.stringify([a.plain, wh(a), b.plain, wh(b), c.plain]));
}
// R28: a timed pause is titled by its own length (the toolbar's is half a second).
{
  const title = code => U.drawVoice(doc, 'Wait' + VC.block([code]) + ' now').find(x => x.className?.includes('rules-v-add-pause'))?.title;
  ok(title('p2') === 'pause, 2 s' && title('p0.5') === 'pause, half a second', 'a pause titled by its length', JSON.stringify([title('p2'), title('p0.5')]));
}
// R29: capitals spelling a pronoun, a conjunction or an auxiliary after a determiner are an abbreviation ("the WHO", "the IT
// desk", "the OR"), and LA, DC, HR, PR, ER are listed; without a determiner a pronoun in capitals is said louder.
{
  const loud = l => P.readProsody(l).words.filter(w => w.marks.includes('loud')).map(w => w.word.replace(/[^\p{L}]/gu, '')).join(',');
  const quiet = ['the WHO says so.', 'I sit at the IT desk.', 'They wheel him into the OR.', 'I called the ER.', 'I flew to LA.', 'I work in HR.'].filter(l => loud(l));
  ok(!quiet.length && loud('WHO did this?') === 'Who' && loud('Get IT away!') === 'it' && loud('"MA! Come here!"') === 'Ma' && loud('the BIG dog') === 'big' && P.readProsody('the WHO says so.').plain === 'the WHO says so.',
      'abbreviations after a determiner', JSON.stringify([quiet, loud('WHO did this?'), loud('Get IT away!')]));
}
// R30: the words the typesetting adds are not selected with the line, so a line copied from the chat is the player's own.
{
  const css = fs.readFileSync(`${ROOT}/style.css`, 'utf8');
  ok(/\.rules-v-add\s*\{[^}]*(?<!-webkit-)user-select:\s*none/.test(css) && /\.rules-v-add\s*\{[^}]*-webkit-user-select:\s*none/.test(css), 'added voice words left out of a copied line');
}
// R12: the ♪ button is a button from the keyboard (Enter, Space), and the toolbar stays open while it holds the focus.
{
  const js = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  ok(/note\.setAttribute\('role', 'button'\)/.test(js) && /e\.key === 'Enter' \|\| e\.key === ' '/.test(js) && /bar\.contains\(focus\)/.test(js), 'voice button works from the keyboard');
}
// R20: "Say it another way" takes the line back: the chat's last line, the player's, returns to the input box with its marks.
{
  const back = U.lineToTakeBack([{ is_user: false, mes: 'Tom and Will stand there.' }, { is_user: true, mes: 'I hit him.' }]);
  const js = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  ok(back?.index === 1 && back.text === 'I hit him.' && U.lineToTakeBack([{ is_user: true, mes: 'x' }, { is_user: false, mes: 'y' }]) === null && /if \(rephraseAsked\(\)\) \{\s*takeBack\(\);/.test(js) && /fillInput\(back\.text\)/.test(js), 'say it another way takes the line back');
}
// R21: typed guillemets are quotation marks, capitals are louder on a common word only, and a hyphen shared with a hyphened word
// after "and" or "or" is no cut-off.
{
  const plain = ['Er sagte: ›Komm sofort her!‹', 'Sie flüsterte: ‹Nicht jetzt›.', 'I ask the NATO officer about the ICU.', 'I wave at the pre- and post-war crowd.', 'Two- or three-year-olds play.'].filter(l => { const x = P.readProsody(l); return x.marked || x.plain !== l; });
  const loud = ['"STOP," I say.', '"NOOOO!" I scream.', "I yell, \"DON'T!\"", '"You IDIOTS," I mutter.'].filter(l => !P.readProsody(l).words.some(w => w.marks.includes('loud')));
  const cut = P.readProsody('"Sto- stop it," I say.').words.some(w => w.marks.includes('cut'));
  ok(!plain.length && !loud.length && cut, 'guillemets, capitals and hyphens read as written', `${plain.join(' | ')} || ${loud.join(' | ')} || cut ${cut}`);
}
// R49: abbreviations that are dictionary nouns stay as written (AIDS, SIM; PIN, SWAT and LED after a determiner or a
// possessive) and are louder as a verb ("PIN him down!"); a hyphen before a colon is a face (D-:), not a cut-off.
{
  const read = l => P.readProsody(l), still = ['The SWAT team arrives; I enter my PIN. D-:', 'She has AIDS.', 'An LED lamp glows.', 'My SIM card.'].filter(l => { const x = read(l); return x.marked || x.plain !== l; });
  const pin = read('PIN him down!');
  ok(!still.length && pin.plain === 'Pin him down!' && pin.words[0].marks.includes('loud'), 'abbreviations that are nouns; faces', `${still.join(' | ')} || ${pin.plain}`);
}
// R50: a line added to the world book is read in its words: the voice marks hidden in it do not reach the model or the entry.
{
  const js = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  const body = /async function addEntry\(text\) \{([\s\S]*?)\n\}/.exec(js)?.[1] ?? '';
  ok(/const line = visible\(text\);/.test(body) && !/\btext\b/.test(body.replace('visible(text)', '')), 'world-book line without hidden marks', body.slice(0, 120));
}
// R60: a cut-off before a closing quotation mark or bracket is a cut-off ("›War-‹", "(wai-)", "‘Sto-’", "«Sto-»").
{
  const missed = ['Er rief: ›War-‹', '(wai-)', 'He said ‘Sto-’', '«Sto-»', '"Sto-"', '[sto-]'].filter(t => !P.readProsody(t).words.some(w => w.marks.includes('cut')));
  ok(!missed.length && !P.readProsody('D-:').marked, 'cut-offs before closing marks', missed.join(' | '));
}
// R61: speech in guillemets is the speech whose loudness counts: «STOP!» I shout is loud speech, as "STOP!" I shout is.
{
  const eff = ['«STOP!» I shout.', '»STOP!« I shout.', '„STOP!“ I shout.', '"STOP!" I shout.'].map(t => P.effortOf(P.readProsody(t)));
  // A quote left open runs to the line's end; a word opening one starts a sentence (its capital kept).
  const open = P.effortOf(P.readProsody('"STOP!" I shout, "now')), plain = P.readProsody('I shout «STOP!»').plain;
  ok(eff.every(e => e === 'loud') && open === 'raised' && plain === 'I shout «Stop!»', 'speech in any quotes', `${eff.join()} ${open} ${plain}`);
}
// R62: the narrator's prompt carries no hidden tag character.
{
  const js = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  ok(/c\.setExtensionPrompt\(KEY, untagged\(parts\.filter\(Boolean\)\.join\('\\n\\n'\)\)/.test(js), 'narrator prompt without tag characters');
}
// P5: the note shows the voice as its first row, tagged Voice in speech's colour.
const vv = U.noteView({ acts: [], things: [], voice: 'louder: Stop · pitch up on think' }, true);
ok(vv?.rows[0]?.tag === 'Voice' && vv.rows[0].kind === 'speech' && vv.rows[0].text === 'louder: Stop · pitch up on think', 'voice row in the note', JSON.stringify(vv));

// What the words were read as (intent.ts) shows on the note's line, ahead of a guess.
const mv = U.noteView({ acts: [], things: [], meant: ['punhc → punch', 'him back → Tom back'] }, true);
ok(mv?.meant === 'punhc → punch; him back → Tom back', 'the line as meant on the note', JSON.stringify(mv));

// Ordinary writing stays words: a whole number in brackets ("Tom (35)", "the year (1850)") and a temperature ("20 °C").
{
  const plainOnes = ['John Smith (35) checks items (1) and (2).', 'The year (1850) was cold.', 'It is 20 °C outside.', 'Set the oven to 180 °C, Tom.', 'It is -5 °F.'];
  const read = plainOnes.filter(l => { const x = P.readProsody(l); return x.marked || x.plain !== l; });
  ok(!read.length && P.readProsody('Wait (0.5) what?').words[0]?.pause === 0.5 && P.readProsody('The °old° man.').words[1]?.marks.includes('quiet'), 'numbers in brackets and temperatures stay words', read.map(l => `${l} → ${P.deliveryOf(P.readProsody(l))}`).join(' | '));
}
// A mark on a word in guillemets or before a dash sits on its letters: «Stop-», the underline under Stop only.
{
  const r = VC.markWords('«Stop»', 1, 5, 'cut'), t = '«Stop»'.slice(0, r.from) + r.insert + '«Stop»'.slice(r.to), parts = U.mirrorParts(t);
  ok(VC.toNotation(t) === '«Stop-»' && parts[0]?.text === '«' && !parts[0]?.family && VC.typeset(t).map(x => x.text).join('') === '«Stop—»', 'marks on the letters inside guillemets', `${VC.toNotation(t)} ${JSON.stringify(parts.map(p => p.text))}`);
}
// A line that quotes, in any quotation marks, is no correction ("No, Will, ›run!‹" is said to Will).
ok(['No, Will, ›run!‹', 'No, Will «stop»', 'No, Will "stop"'].every(l => A.correctionOf(l) === null) && A.correctionOf('no, Will') === 'Will', 'a line that quotes is no correction', ['No, Will, ›run!‹', 'No, Will «stop»'].map(l => A.correctionOf(l)).join(' | '));
// Every request to a model leaves with hidden marks as notation, whoever built it (a summary's raw prompt reads the saved chat).
{
  const r = VC.markWords('I say stop now', 6, 10, 'loud'), t = 'I say stop now'.slice(0, r.from) + r.insert + 'I say stop now'.slice(r.to);
  const d = { messages: [{ role: 'user', content: `Narrator:\nHello.\n\nMara:\n${t}` }, { role: 'user', content: [{ type: 'text', text: t }] }], prompt: `Mara: ${t}` };
  VC.notateRequest?.(d);
  ok(!VC.hasHidden(JSON.stringify(d)) && d.messages[0].content.endsWith('I say STOP now') && d.messages[1].content[0].text === 'I say STOP now' && d.prompt === 'Mara: I say STOP now', 'a request leaves with notation', JSON.stringify(d));
}
// A name in a line shouted in capitals keeps its capital: "I SHOUT AT WILL TO RUN!" is said to Will.
ok(P.readProsody('I SHOUT AT WILL TO RUN!', ['Will', 'Mara']).plain === 'I shout at Will to run!' && P.readProsody('I SHOUT AT WILL TO RUN!').plain === 'I shout at will to run!', 'a shouted name keeps its capital', P.readProsody('I SHOUT AT WILL TO RUN!', ['Will']).plain);
// A feeling marks the line and keeps the player's selection, so the next mark goes on the words they chose.
{
  const t0 = 'I say stop now', r = VC.markWords(t0, 6, 10, 'feeling:anger'), t = t0.slice(0, r.from) + r.insert + t0.slice(r.to);
  ok(VC.visible(t.slice(r.selStart, r.selEnd)) === 'stop', 'a feeling keeps the selection', JSON.stringify(VC.visible(t.slice(r.selStart, r.selEnd))));
}
// R31: pitch marks keep their order, as a rise-fall and a fall-rise are two tunes: the notation writes the arrows as given,
// the delivery names the tune's shape, and the chat carries the order (data-pitch) for the multiple-distinctions look, with
// the IPA stress mark before a stressed word, a drawn-out word's last vowel in its own span and the feeling's name.
{
  const rf = mk1(mk1('I never said', 'never', 'up'), 'never', 'down'), fr = mk1(mk1('I never said', 'never', 'down'), 'never', 'up');
  const said = d => P.deliveryOf(VC.marksOf(d));
  ok(VC.toNotation(rf) === 'I ↑↓never said' && VC.toNotation(fr) === 'I ↓↑never said', 'pitch order in the notation', `${VC.toNotation(rf)} | ${VC.toNotation(fr)}`);
  ok(said(rf) === 'rise-fall on never' && said(fr) === 'fall-rise on never' && P.deliveryOf(P.readProsody('I ↓↑never said')) === 'fall-rise on never'
      && said(mk1('I never said', 'never', 'up')) === 'pitch up on never', 'pitch order in the delivery', `${said(rf)} | ${said(fr)}`);
  const line = mk1(mk1(mk1(fr, 'said', 'stress'), 'never', 'stretch'), 'I', 'feeling:anger'), typed = U.drawVoice(doc, line);
  const word = typed.find(x => x.className?.includes('rules-v-up')), at = typed.findIndex(x => x.className?.includes('rules-v-stress'));
  const feel = typed.find(x => x.className?.includes('rules-v-add-feeling'));
  ok(word?.attrs['data-pitch'] === 'downup' && byClass(word, 'rules-v-long')[0]?.textContent === 'e' && own(word) === 'never' && typed[at - 1]?.className === 'rules-v-add rules-v-add-tick'
      && typed[at - 1]?.textContent === 'ˈ' && feel?.attrs['data-feeling'] === 'anger', 'chat marks for the distinct look', JSON.stringify([word?.attrs, typed.map(x => x.className ?? '#')]));
  const css = fs.readFileSync(`${ROOT}/style.css`, 'utf8');
  ok(/\.rules-v-add-tick, \.rules-v-add-held, \.rules-v-add-rest \{ display: none; \}/.test(css) && /body\.rules-distinct \.rules-v\[data-pitch="downup"\]::before/.test(css) && /body\.rules-distinct \[data-feeling="anger"\], body\.rules-distinct \[data-rules-feeling="anger"\]/.test(css),
      'distinct look styled, stress mark hidden in the plain look');
}
// R32: the multiple-distinctions look draws the sound's quantities (src/rules/voice.ts): the sizes style.css holds are the
// ones ui.ts lookVars derives from each mark's level and tempo, in the sound's order; the levels are acoustics.ts's; the
// palest ink still reads at 4.5:1 on every shipped theme; and the look blurs, empties and colours nothing.
{
  const V = await import('../src/rules/voice.js'), AC = await import('../src/rules/acoustics.js');
  const css = fs.readFileSync(`${ROOT}/style.css`, 'utf8'), look = css.slice(css.indexOf('/* The multiple-distinctions look'), css.indexOf('/* The dialogue page')), L = U.lookVars();
  const near = (a, b) => Math.abs(a - b) < 0.011;
  ok(near(V.soundOf(['loud']).db, AC.SPEECH_SPL.raised - AC.SPEECH_SPL.normal) && near(V.soundOf(['whisper']).db, AC.SPEECH_SPL.whisper - AC.SPEECH_SPL.normal) && V.soundOf(['quiet']).db < 0
      && V.soundOf(['whisper', 'loud']).db === V.soundOf(['whisper']).db && V.soundOf(['fast']).rate > 1 && V.soundOf(['slow']).rate < 1 && V.soundOf(['fast', 'slow']).rate === 1
      && JSON.stringify([V.soundOf(['up']).pitch, V.soundOf(['down', 'up']).pitch.map(Math.sign), V.soundOf(['creaky']).phonation, V.soundOf(['whisper', 'breathy']).phonation, V.soundOf(['falsetto']).register, V.soundOf(['stretch']).held])
          === JSON.stringify([[0, V.soundOf(['up']).pitch[1]], [0, -1, 0], 'creaky', 'whisper', 'falsetto', V.HELD_BEATS]) && V.soundOf(['up']).pitch[1] > 0,
      "each mark's sound in numbers", JSON.stringify(['loud', 'quiet', 'whisper', 'fast', 'slow', 'up'].map(m => V.soundOf([m]))));
  const held = [...look.matchAll(/var\(--rules-([a-z-]+), (-?[\d.]+)\)/g)].map(m => [m[1], Number(m[2])]);
  const drift = held.filter(([k, v]) => L[k] !== v).map(([k, v]) => `${k}: style.css ${v}, the sound ${L[k]}`), unused = Object.keys(L).filter(k => !held.some(h => h[0] === k));
  ok(held.length >= Object.keys(L).length && !drift.length && !unused.length, "the look's sizes are the sound's", [...drift, ...unused.map(k => `${k} unused`)].join('; '));
  ok(L['loud-weight'] > 500 && 500 > L['quiet-weight'] && L['quiet-weight'] >= L['whisper-weight'] && L['loud-size'] > 1 && 1 > L['quiet-size'] && L['quiet-size'] > L['whisper-size'] && 1 > L['quiet-ink'] && L['quiet-ink'] > L['whisper-ink']
      && L['slow-gap'] > 0 && 0 > L['fast-gap'] && L['slow-track'] > 0 && 0 > L['fast-track'] && L['slow-track'] > -L['fast-track'] && L['fast-lean'] < 0 && L['pitch-rise'] > 0 && L['whisper-size'] * 15 >= 12,
      "the look's sizes follow the sound's order", JSON.stringify(L));
  const pale = [];
  for (const tone of ['dark', 'light']) for (const [name, body, chat, user] of THEMES[tone]) {
      const bg = over(rgba(user), over(rgba(chat), [0, 0, 0])), r = contrast(over([...rgba(body).slice(0, 3), L['whisper-ink']], bg), bg);
      if (r < 4.5) pale.push(`${name}: ${r.toFixed(2)}`);
  }
  ok(!pale.length, 'the palest ink reads on every theme', pale.join('; '));
  const stroke = /body\.rules-distinct \.rules-v\[data-pitch\]::before \{[^}]*\}/.exec(look)?.[0] ?? '', pitched = /body\.rules-distinct \.rules-v\[data-pitch\] \{[^}]*\}/.exec(look)?.[0] ?? '';
  ok(!/text-shadow: (?!none)/.test(look) && !/filter:|text-fill-color|text-stroke|--rules-w\b/.test(look) && /background-color: currentColor;/.test(stroke) && !/#[0-9A-Fa-f]{6}/.test(stroke) && !/padding-top|top: -?0\.\d/.test(pitched)
      && /line-height: 1;/.test(pitched) && !/fitSqueezed|offsetWidth/.test(fs.readFileSync(`${ROOT}/src/index.js`, 'utf8').split('function typesetChat')[1]?.split('function registerTimeCommand')[0] ?? 'x'),
      'the distinct look blurs, empties and colours nothing', `${stroke.slice(0, 160)} | ${pitched}`);
  // The feeling colours, as OKLCH coordinates (Ottosson 2020, "A perceptual color space for image processing"): each reads at
  // 4.5:1 on every theme of its tone, any two are 40 CIELUV units apart or more (Carter & Carter 1982), chroma follows the
  // feeling's activation and lightness its valence.
  const oklch = (l, c, h) => { const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180), x = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3, y = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3, z = (l - 0.0894841775 * a - 1.2914855480 * b) ** 3;
      return [4.0767416621 * x - 3.3077115913 * y + 0.2309699292 * z, -1.2684380046 * x + 2.6097574011 * y - 0.3413193965 * z, -0.0041960863 * x - 0.7034186147 * y + 1.7076147010 * z]; };
  const enc = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055), dec = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const luv = c => { const [r, g, b] = c.map(dec), X = 0.4124 * r + 0.3576 * g + 0.1805 * b, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = 0.0193 * r + 0.1192 * g + 0.9505 * b, d = X + 15 * Y + 3 * Z || 1, l = Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
      return [l, 13 * l * (4 * X / d - 0.1978), 13 * l * (9 * Y / d - 0.4683)]; };
  const apart = (a, b) => Math.hypot(...luv(a).map((v, i) => v - luv(b)[i]));
  const felt = { dark: {}, light: {} };
  for (const m of look.matchAll(/body\.rules-distinct(\[data-rules-tone="light"\])? \[data-feeling="(\w+)"\], [^{]*\{ --rules-felt: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\); \}/g)) felt[m[1] ? 'light' : 'dark'][m[2]] = [Number(m[3]), Number(m[4]), Number(m[5])];
  const wrong = [];
  for (const tone of ['dark', 'light']) {
      const f = felt[tone], names = Object.keys(f), rgb = Object.fromEntries(names.map(k => [k, oklch(...f[k])]));
      if (names.sort().join() !== [...P.FEELINGS].sort().join()) { wrong.push(`${tone}: ${names.join()}`); continue; }
      for (const k of names) { if (rgb[k].some(v => v < -0.002 || v > 1.002)) wrong.push(`${tone} ${k} outside sRGB`); for (const th of THEMES[tone]) { const r = contrast(rgb[k].map(enc), over(rgba(th[3]), over(rgba(th[2]), [0, 0, 0]))); if (r < 4.5) wrong.push(`${tone} ${k} on ${th[0]}: ${r.toFixed(2)}`); } }
      for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) { const d = apart(rgb[names[i]].map(enc), rgb[names[j]].map(enc)); if (d < 40) wrong.push(`${tone} ${names[i]}–${names[j]}: ${d.toFixed(0)} apart`); }
      if (!(Math.min(f.anger[1], f.fear[1], f.happiness[1]) > Math.max(f.sadness[1], f.tenderness[1]))) wrong.push(`${tone}: chroma does not follow activation`);
      if (!(Math.min(f.happiness[0], f.tenderness[0]) > Math.max(f.anger[0], f.fear[0], f.sadness[0]))) wrong.push(`${tone}: lightness does not follow valence`);
  }
  ok(!wrong.length, 'feeling colours legible and apart', wrong.join('; '));
}
// R33: what the chat draws for the time and for a run of words: a drawn-out vowel written again once per further beat, in the
// word's own case, and left out of the player's own text; a timed pause as a dot per syllable of silence beside its dash; the
// space between two slower (or two faster) words as a span of that tempo; words side by side that share a softer voice or
// a phonation in one span, the comma after the last left outside; each mark's quantity in the word's hover text.
{
  const V = await import('../src/rules/voice.js');
  const mkAll = (t, id) => { const r = VC.markWords(t, 0, t.length, id); return t.slice(0, r.from) + r.insert + t.slice(r.to); };
  const held = w => { const e = U.drawVoice(doc, mk1(w, w, 'stretch'))[0]; return [text(e), own(e), byClass(e, 'rules-v-add-held')[0]?.textContent]; };
  ok(JSON.stringify([held('No'), held('NO'), held('Oh'), held('really'), held('Hmm')]) === JSON.stringify([['Nooo', 'No', 'oo'], ['NOOO', 'NO', 'OO'], ['Oooh', 'Oh', 'oo'], ['reallyyy', 'really', 'yy'], ['Hmm', 'Hmm', undefined]])
      && V.HELD_BEATS === 2 && VC.toNotation(mk1('No', 'No', 'stretch')) === 'No::', 'a drawn-out vowel is written again', JSON.stringify([held('No'), held('NO'), held('Oh'), held('really'), held('Hmm')]));
  const rest = code => { const t = U.drawVoice(doc, 'Wait' + VC.block([code]) + ' now'), r = t.find(x => x.className === 'rules-v-add rules-v-add-rest'); return [r?.textContent, r?.title, t.some(x => x.className === 'rules-v-add rules-v-add-pause')]; };
  ok(JSON.stringify([rest('p0.5'), rest('p1'), rest('p9')]) === JSON.stringify([[' ···', 'pause, half a second', true], [' ·····', 'pause, 1 s', true], [` ${'·'.repeat(12)}`, 'pause, 9 s', true]]) && V.pauseBeats(0.1) === 1
      && !U.drawVoice(doc, 'Wait' + VC.block(['p.']) + ' now').some(x => x.className?.includes('rules-v-add-rest')), 'a pause is a dot per syllable of silence', JSON.stringify([rest('p0.5'), rest('p1'), rest('p9')]));
  const classes = t => U.drawVoice(doc, t).map(x => x.className || '#');
  const slow = classes(mkAll('one two, three', 'slow') + ' four'), mixed = classes(mk1(mk1('one two', 'one', 'slow'), 'two', 'fast')), both = classes(mkAll(mkAll('one two', 'slow'), 'fast'));
  ok(slow.join('|') === 'rules-v rules-v-slow|rules-v-gap rules-v-gap-slow|rules-v rules-v-slow|#|rules-v-gap rules-v-gap-slow|rules-v rules-v-slow|#|#' && !mixed.some(c => c.includes('gap')) && !both.some(c => c.includes('gap'))
      && classes(mkAll('one two', 'fast'))[1] === 'rules-v-gap rules-v-gap-fast', 'the space between two slower words takes the tempo', JSON.stringify([slow, mixed, both]));
  const run = U.drawVoice(doc, `${mkAll('meet me, now', 'whisper')}, ${mk1('then go', 'then', 'breathy')}`), inside = e => e.children.map(c => c.className || c.textContent);
  ok(run.length === 6 && run[0].className === 'rules-run rules-run-whisper' && JSON.stringify(inside(run[0])) === JSON.stringify(['rules-v rules-v-whisper', ' ', 'rules-v rules-v-whisper', ',', ' ', 'rules-v rules-v-whisper']) && text(run[0]) === 'meet me, now'
      && run[1].textContent === ',' && run[3].className === 'rules-run rules-run-breathy' && text(run[3]) === 'then' && run.map(text).join('') === 'meet me, now, then go'
      && U.drawVoice(doc, mkAll(mkAll('so tired', 'quiet'), 'creaky'))[0].className === 'rules-run rules-run-quiet rules-run-creaky' && JSON.stringify(U.RUN_MARKS) === JSON.stringify(['quiet', 'creaky', 'breathy', 'whisper']),
      'words that share a phonation stand in one run', JSON.stringify(run.map(e => [e.className, inside(e)])));
  const title = (w, id) => U.drawVoice(doc, mk1(w, w, id)).flatMap(e => [e, ...e.children]).find(x => x.className?.startsWith('rules-v '))?.title;
  ok(title('Stop', 'loud') === 'louder (about 6 dB above your normal voice)' && title('Stop', 'whisper') === 'whispered (about 27 dB below your normal voice)' && title('Stop', 'fast') === 'faster (about 1.3 times your own pace)'
      && title('Stop', 'slow') === 'slower (about 0.6 times your own pace)' && title('Stop', 'up') === 'rises (about 6 semitones up)' && title('Stop', 'stress') === 'stressed', "a mark's quantity on hover",
      JSON.stringify(['loud', 'whisper', 'fast', 'slow', 'up', 'stress'].map(id => title('Stop', id))));
}
// R34: the name plate says what the player's character is doing in the line, in one word after their name. The word is the
// call's primitive act (reading.ts modeOf; docs/df-body-engine.md §11): speaking for sounds made with the voice, thinking for
// something worked out, nothing for any other act; quoted words are said (quotes.ts), with a call or without; a note kept
// before modes were recorded gives them from its calls; a line edited since its reading keeps what its own words show.
{
  const say = { tool: 'Communicate', args: { speaker: 'Ann', listener: 'Tom', means: 'speech', effort: 'whisper', message: 'Go' } }, think = { tool: 'WorkOut', args: { who: 'Ann', problem: 'the riddle on the door', kind: 'a riddle or trick that needs a new view', seconds: 60 } };
  const modes = [say, { ...say, args: { ...say.args, means: 'gesture' } }, { tool: 'Communicate', args: { speaker: 'Ann', listener: 'Tom' } }, think, { tool: 'Look', args: { viewer: 'Ann' } }, { tool: 'Listen', args: { listener: 'Ann' } }, { tool: 'Interpret', args: { listener: 'Ann' } }].map(R.modeOf);
  ok(JSON.stringify(modes) === JSON.stringify(['speaking', undefined, 'speaking', 'thinking', undefined, undefined, undefined]), 'a call\'s mode is its primitive act', JSON.stringify(modes));
  const items = R.readingItems([think, say, { tool: 'Act', args: { who: 'Ann', action: 'stands up' } }], 'Ann');
  ok(R.kindOf('WorkOut') === 'mind' && items.map(i => i.mode).join() === 'thinking,speaking,' && items[0].text === 'Ann works out the riddle on the door (a riddle or trick that needs a new view), 60 s' && items[0].brief === 'the riddle on the door · 60 s'
      && U.noteView({ acts: items, things: [] }, true).rows[0].tag === 'Mind', 'working something out is the mind\'s, said in words', JSON.stringify(items[0]));
  const names = (note, line) => U.modesOf(note, line).map(m => `${m.mode}: ${m.title}`);
  const old = { acts: [{ text: 'Ann says to Tom', detail: 'Communicate: speaker Ann, listener Tom, means speech' }, { text: 'Ann waves', detail: 'Communicate: speaker Ann, listener Tom, means gesture' }, { text: 'Ann works it out', detail: 'WorkOut: who Ann' }], things: [] };
  ok(JSON.stringify(names({ acts: items, things: [] }, 'x')) === JSON.stringify(['speaking: Ann whispers to Tom: "Go"', 'thinking: Ann works out the riddle on the door (a riddle or trick that needs a new view), 60 s'])
      && JSON.stringify(names(old, 'x')) === JSON.stringify(['speaking: Ann says to Tom', 'thinking: Ann works it out']) && names({ acts: [old.acts[1]], things: [] }, 'I wave').length === 0
      && JSON.stringify(names(null, `I nod. "Follow${VC.block(['L'])} me," I say.`)) === JSON.stringify(['speaking: Said: “Follow me,”']) && names(null, 'I walk to the door.').length === 0 && names(null, "the guards' door").length === 0,
      'modes from the calls, an older note and quoted words', JSON.stringify([names({ acts: items, things: [] }, 'x'), names(old, 'x'), names(null, 'I nod. "Follow me," I say.')]));
  const chat = [{ is_user: false, mes: '"Halt," he says.' }, { is_user: true, mes: 'I think it over.', extra: { [U.NOTE_KEY]: { acts: [items[0]], things: [], line: 'I think it over.' } } },
      { is_user: true, mes: 'I walk on.', extra: { [U.NOTE_KEY]: { acts: [items[1]], things: [], line: 'I tell Tom to go.' } } }, { is_user: true, mes: 'I climb.' }, { is_user: true, mes: '"Wait!"' }];
  const plates = U.platesOf(chat).map(p => `${p.index}:${p.modes.map(m => m.mode).join('+')}`);
  ok(plates.join() === '1:thinking,4:speaking', 'plates on the player\'s lines, by the line as it stands', plates.join());
  const box = U.drawModes(doc, U.modesOf({ acts: items, things: [] }, 'x'));
  ok(box.className === 'rules-modes' && box.children.map(c => `${c.tag}.${c.className}:${c.textContent}`).join('|') === 'span.rules-mode rules-mode-speaking:speaking|span.rules-mode rules-mode-thinking:thinking'
      && box.children[0].title === 'Ann whispers to Tom: "Go"' && htmlSet === 0, 'modes drawn as words, the call on hover', box.children.map(c => `${c.className}:${c.textContent}:${c.title}`).join('|'));
}
// R35: the dialogue page (style.css, body.rules-page): SillyTavern's theme variables set again inside each message, as named
// colours; each ink reads at 4.5:1 or more on the page's ground (WCAG 1.4.3), the ground is every message's and the letter
// shadow is none; the type keeps SillyTavern's x-height (0.547 em of its Noto Sans over the serifs' 0.46) and its lines stand
// further apart than SillyTavern's (0.5rem over a 15 px size: 1.53); the modes take no hue; a pause's sign does not break
// from its word.
{
  const inks = ['BodyColor', 'QuoteColor', 'UnderlineColor', 'EmColor'].map(k => [k, pageInk(k)]), low = inks.filter(([, c]) => !c || !pageGround || contrast(c, pageGround) < 4.5).map(([k, c]) => `${k} ${c && pageGround ? contrast(c, pageGround).toFixed(2) : 'no named colour'}`);
  ok(!low.length && ['BlurTintColor', 'BotMesBlurTintColor', 'UserMesBlurTintColor'].every(k => pageInk(k)?.join() === pageGround?.join()) && /--SmartThemeShadowColor: transparent;/.test(pageBlock) && !/#[0-9A-Fa-f]{3,6}|rgb|oklch/.test(pageBlock)
      && THEMES.light.some(t => t[0] === 'the dialogue page'), 'the page\'s inks on its ground', `${low.join('; ')} | ${pageBlock.replace(/\s+/g, ' ').slice(0, 200)}`);
  const type = /body\.rules-page #chat \.mes_text \{ font-size: calc\(var\(--mainFontSize\) \* ([\d.]+)\); font-size-adjust: ([\d.]+); font-weight: 400; line-height: ([\d.]+); \}/.exec(css);
  ok(type && Number(type[1]) === Math.round(0.547 / Number(type[2]) * 100) / 100 && Number(type[2]) === 0.46 && Number(type[3]) > (15 + 8) / 15 && Number(type[3]) <= 1.8, 'the page\'s type', type?.slice(1).join(' '));
  const mode = css.split('.rules-modes {')[1] ?? '';
  ok(/\.rules-mode-speaking \{ background-color: var\(--SmartThemeBodyColor\); color: black; \}/.test(mode) && /body\[data-rules-tone="light"\] \.rules-mode-speaking \{ color: white; \}/.test(mode) && !/#[0-9A-Fa-f]{3,6}|rgb|oklch|color-mix/.test(mode)
      && /\.rules-v-add-micro, \.rules-v-add-pause, \.rules-v-add-rest \{ white-space: nowrap; \}/.test(css), 'the modes take no hue; a pause stays by its word', mode.slice(0, 160));
}
// R36: the box (style.css body.rules-box, index.ts showBox): one unit of the chat on screen at a time. A unit is a stretch
// with one value of [±voiced]: each quoted part of a paragraph, or the parts between two of them; a stretch with no letter
// joins the unit before it (after it at the paragraph's start). Text that is not voiced takes a named colour that reads at
// 4.5:1 or more on the page; the box draws the current message and unit only, without the picture; its buttons are 44 px.
{
  const units = parts => U.voiceUnits(parts.map(([said, text]) => ({ said, text }))).map(u => `${u.said ? 'S' : 'n'}${u.from}-${u.to}`).join(' ');
  const got = [units([[false, 'Tom looks up. '], [true, '"You are late,"'], [false, ' he says. '], [true, '"Sit."']]), units([[true, '"Sit,"'], [false, ' '], [true, '"Now."']]), units([[false, ' — '], [true, '"Go"'], [false, '.']]),
      units([[false, 'He '], [false, 'almost'], [false, ' smiles.']]), units([[false, '…']]), units([])];
  ok(JSON.stringify(got) === JSON.stringify(['n0-1 S1-2 n2-3 S3-4', 'S0-2 S2-3', 'S0-3', 'n0-3', 'n0-1', '']), 'units by change of voice', JSON.stringify(got));
  const unvoiced = NAMED[/body\.rules-page #chat span\.rules-unit\[data-said="false"\] \{ color: (\w+); \}/.exec(css)?.[1] ?? ''];
  ok(unvoiced && pageGround && contrast(unvoiced, pageGround) >= 4.5 && contrast(unvoiced, pageInk('BodyColor')) > 1.5, 'text that is not voiced reads on the page, apart from the ink', unvoiced && pageGround ? contrast(unvoiced, pageGround).toFixed(2) : 'no named colour');
  ok(/body\.rules-box #chat \.mesAvatarWrapper \{ display: none; \}/.test(css) && /body\.rules-box:not\(\.rules-box-log\) #chat \.mes:not\(\.rules-now\) \{ display: none; \}/.test(css)
      && /body\.rules-box:not\(\.rules-box-log\) #chat \.mes:has\(\.rules-unit-now\) \.mes_text \.rules-unit:not\(\.rules-unit-now\) \{ display: none; \}/.test(css)
      && /body\.rules-box:not\(\.rules-box-log\) #chat \.rules-modes \{ display: none; \}/.test(css) && /#rules-box-bar button \{ min-width: 44px; min-height: 44px;/.test(css), 'the box draws one message and one unit, no picture', '');
}
// R37: the page's dark colours (style.css body.rules-page-dark), the reference's: said words white, text that is not said light
// blue, key words gold, asides darkgray, all on black at 4.5:1 or more; the dark page counts as a dark ground for the kind and
// feeling colours (U7, R32). Key words elsewhere: black on a gold ground, and the blue of text not said on gold.
{
  const named = re => NAMED[re.exec(css)?.[1] ?? ''];
  const unsaidDark = named(/body\.rules-page\.rules-page-dark #chat span\.rules-unit\[data-said="false"\] \{ color: (\w+); \}/), keyDark = named(/body\.rules-page\.rules-page-dark #chat mark\.rules-key \{ background-color: transparent; color: (\w+);/);
  const keyGround = named(/mark\.rules-key \{ background-color: (\w+); color: \w+;/), keyInk = named(/mark\.rules-key \{ background-color: \w+; color: (\w+);/);
  const unsaidLight = named(/body\.rules-page #chat span\.rules-unit\[data-said="false"\] \{ color: (\w+); \}/);
  const pairs = [['ink', darkInk('BodyColor'), darkGround], ['aside', darkInk('EmColor'), darkGround], ['not said', unsaidDark, darkGround], ['key word', keyDark, darkGround], ['key word on its ground', keyInk, keyGround], ['not said on a key ground', unsaidLight, keyGround]];
  const low = pairs.filter(([, a, b]) => !a || !b || contrast(a, b) < 4.5).map(([k, a, b]) => `${k} ${a && b ? contrast(a, b).toFixed(2) : 'no named colour'}`);
  ok(!low.length && THEMES.dark.some(t => t[0] === 'the dark page') && contrast(unsaidDark, darkInk('BodyColor')) > 1.5, 'the dark page reads, apart from its ink', low.join('; ') || pairs.map(([k, a, b]) => `${k} ${contrast(a, b).toFixed(2)}`).join('; '));
}
// R38: who each stretch belongs to (box.ts speakersOf, takeSpeakers): the name the reply wrote before a quotation; a speech tag
// after it; the subject of the sentence before it (a name, a given name that is also a closed word, I for the player, he or
// she by the sex of the last name, a noun phrase); the speaker before; the author; and the player's character for every
// stretch that is not said.
{
  const B = await import('../src/rules/box.js');
  const P = t => { const out = []; let last = 0; for (const m of t.matchAll(/"[^"]*"/g)) { if (m.index > last) out.push({ said: false, text: t.slice(last, m.index) }); out.push({ said: true, text: m[0] }); last = m.index + m[0].length; } if (last < t.length) out.push({ said: false, text: t.slice(last) }); return out; };
  const said = (paras, cast = { player: 'Mara', author: 'Narrator', names: ['Mara'] }, tags = {}) => { const ps = paras.map(P); ps.flat().forEach(s => { if (tags[s.text]) s.tag = tags[s.text]; }); const who = B.speakersOf(ps, cast); return ps.flatMap((p, i) => p.map((s, j) => s.said ? who[i][j] : s.text.trim() && who[i][j] !== cast.player ? `!${who[i][j]}` : null)).filter(Boolean).join(' '); };
  const got = [
    said(['Tom looks up from the dice. "You are late," he says, not quite smiling. "Sit."', 'Will does not look up. "Seven," he says.']),
    said(['Kyoko frowns. "Who set all this up?" I shrug. "No idea."'], { player: 'Makoto Naegi', author: 'Makoto Naegi', names: ['Makoto Naegi', 'Kyoko Kirigiri'] }),
    said(['Anna nods to Tom. She smiles. "Thank you."', 'The old guard coughs. "Papers." "Fine," a voice behind the door says.', '"Sit."']),
    said(['"Who set all this up?"', 'Tom laughs. "Me."'], undefined, { '"Who set all this up?"': 'Kyoko' }),
  ];
  ok(JSON.stringify(got) === JSON.stringify(['Tom Tom Will', 'Kyoko Kirigiri Makoto Naegi', 'Anna The old guard A voice Narrator', 'Kyoko Tom']), 'who says each stretch', JSON.stringify(got));
  const tk = B.takeSpeakers('Tom looks up. [Tom] "Sit." Mara laughs. [Mara]"No." [a note] stays.');
  ok(tk.text === 'Tom looks up. "Sit." Mara laughs. "No." [a note] stays.' && JSON.stringify(tk.said) === JSON.stringify([{ q: '"Sit."', who: 'Tom' }, { q: '"No."', who: 'Mara' }]) && /\[Tom\] "Sit\."/.test(B.SPEAKER_RULE), 'the names before quotations leave the text', JSON.stringify(tk));
}
// R39: the box's time and size (box.ts): a long stretch is cut after a sentence's end so each piece fits; said words appear at
// the speaker's syllables per second (voice.ts voiceSyllablesPerS, 5), with a pause of 500 ms after a sentence and 167 after a
// clause mark, longer for a slower speaker (Campione & Véronis 2002; Strangert 1991), other text at 260 words a minute (Brysbaert 2019);
// AUTO waits what reading takes beyond the appearing, and one word more.
{
  const B = await import('../src/rules/box.js');
  const cuts = B.cutsOf('One short sentence. Another one here. A third sentence that is a bit longer than the others. Last.', 40);
  const syl = ['the', 'make', 'little', 'riddle', 'beautiful', '60'].map(B.syllables);
  const sit = B.revealTimes('"Sit, Anna."', true), plain = B.revealTimes('He waits by the door.', false);
  const near = (a, b) => Math.abs(a - b) < 0.5;
  ok(JSON.stringify(cuts) === JSON.stringify([38, 93]) && JSON.stringify(syl) === JSON.stringify([1, 1, 2, 2, 3, 2]), 'a long stretch goes on after a sentence', JSON.stringify([cuts, syl]));
  ok(near(sit.at(-1), 600 + 500 / 3) && sit[0] === 0 && near(sit[4], 200) && near(sit[6], 200 + 500 / 3 + 100) && near(B.pauseMs(' — '), 500 / 3) && near(B.pauseMs('. ', 0.5), 1000) && B.pauseMs(' ') === 0 && near(plain.at(-1), 5 * 60000 / 260) && near(B.autoWait('He waits by the door.', plain.at(-1)), 60000 / 260)
      && near(B.autoWait('"Sit, Anna."', 600), 60000 / 260) && near(B.autoWait('"Sit, Anna."', 0), 3 * 60000 / 260), 'letters appear at the pace of speech or of reading', JSON.stringify([sit.at(-1), plain.at(-1), B.autoWait('"Sit, Anna."', 0)]));
}
// R40: key words (box.ts keyPhrase): the reply's longest run of the result's own words, nouns first, the result's gloss and
// people's names left out; the slot's words (box.ts slotOf); the box's plate, picture, highlight and key-word rules, and the
// wiring that names speakers, strips their names and toggles Auto on one settings object (src/index.js).
{
  const B = await import('../src/rules/box.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8'), html = fs.readFileSync(`${ROOT}/settings.html`, 'utf8');
  const keys = [B.keyPhrase('The right heel bone breaks', 'She lands hard and her right heel bone gives with a crack.', ['Mara']),
    B.keyPhrase('Mara works out the riddle on the door (a riddle or trick that needs a new view), 60 s', 'Mara stares at the riddle on the door: a trick that needs a new view.', ['Mara']),
    B.keyPhrase('Tom hears the whisper at 0.5 m', 'Tom hears you: the whisper carries.', ['Mara', 'Tom']), B.keyPhrase('Mara rests', 'Nothing else stirs.', ['Mara'])];
  ok(JSON.stringify(keys) === JSON.stringify(['right heel bone', 'riddle on the door', 'whisper', null]), 'key words name what was decided', JSON.stringify(keys));
  const slots = [B.slotOf({ said: true, whispered: false, thinking: false, auto: false }), B.slotOf({ said: true, whispered: true, thinking: true, auto: true }), B.slotOf({ said: false, whispered: false, thinking: true, auto: false }), B.slotOf({ said: false, whispered: false, thinking: false, auto: false })];
  ok(JSON.stringify(slots) === JSON.stringify([['speaking'], ['whispering', 'auto'], ['thinking'], []]), "the plate's word says what the colour does not", JSON.stringify(slots));
  ok(/body\.rules-box:not\(\.rules-box-log\) #chat \.mes\.rules-now \.name_text \{ display: none; \}/.test(css) && /\.mes\.rules-now \.rules-who \{ display: inline; \}/.test(css)
      && /::highlight\(rules-unshown\) \{ color: transparent;/.test(css) && /#rules-box-figure:not\(\[hidden\]\) \{ display: block;/.test(css)
      && /boxOn\(\) \? SPEAKER_RULE : ''/.test(idx) && /msg\.mes = sp\.text;/.test(idx) && /const s = settings\(\);\s*s\.boxAuto = !s\.boxAuto;/.test(idx)
      && ['rules_engine_page_colours', 'rules_engine_box_picture', 'rules_engine_box_typing'].every(id => html.includes(`id="${id}"`)), 'the box names, types and moves on as set', '');
}
// R41: the box's type and scene (box.ts boxFontPx, boxLinesAt, sceneLine; style.css; src/index.js): the x-height a phone held
// 58 cm away needs for the critical print size (0.2°) at 0.160 mm a CSS pixel is 12.65 px, so a face with x 0.46 em is set at
// 27.5 px unless the page's is larger; the box's lines grow with the size (4 at 17.85 px → 6 at 27.5), so a box holds the same
// letters; the scene line joins place, story time and light, leaving out what is unknown; the box drops the device's clock,
// keeps a scroll inside it, counts its lines in its own line height (1lh), and stops at 60 % of the screen or where the chat
// ends (the chat a size container, 100cqh), whichever is less, so a short screen keeps the box's top in view.
{
  const B = await import('../src/rules/box.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  const f = B.boxFontPx(17.85), big = B.boxFontPx(30);
  ok(Math.abs(B.boxMinXPx() - 12.65) < 0.01 && Math.abs(f - 27.51) < 0.02 && big === 30 && B.boxLinesAt(17.85, f) === 6 && B.boxLinesAt(30, 30) === 4
      && B.sceneLine('Recife', 'Sunday 15 July 1990, 18:20', 'nautical twilight') === 'Recife · Sunday 15 July 1990, 18:20 · nautical twilight' && B.sceneLine(null, 'Day 2, 07:00', '') === 'Day 2, 07:00',
      "the box's type and the scene line", JSON.stringify([B.boxMinXPx(), f, B.boxLinesAt(17.85, f)]));
  ok(/\.mes\.rules-now \.mes_text \{ font-size: var\(--rules-box-font, 1em\); overscroll-behavior: contain; \}/.test(css) && /\.mes\.rules-now \.timestamp \{ display: none; \}/.test(css)
      && /min-height: min\(calc\(var\(--rules-box-lines\) \* 1lh\), 60vh, var\(--rules-box-room\)\); max-height: min\(60vh, var\(--rules-box-room\)\);/.test(css)
      && /--rules-box-room: calc\(100cqh - var\(--rules-box-chrome/.test(css) && /#chat \{ justify-content: flex-end; overflow: hidden; background-color: transparent; container-type: size; \}/.test(css) && /boxLinesNow = boxLinesAt\(page, box\)/.test(idx) && /args = \[scenePlace\(\), t === null \? null : formatStoryTime\(t\), t === null \? null : sceneSky\(t\)\?\.label\]/.test(idx) && /sceneLine\(\.\.\.args\)/.test(idx)
      && /cutsOf\(words, Math\.floor\(words\.length \* boxLinesNow \/ lines\)\)/.test(idx), "the box's rules and wiring", '');
}
// R42: the box's night look (style.css body.rules-box-night; src/index.js; settings.html), the player's pick of three: on by
// default; the dark page's colours inside the panel and the tone dark while it shows; the panel's top colour over a white
// background showing through (alpha 0.74, see-through) still carries white at 4.5:1 or more and light sky blue too; the tag's white on
// the accent (#d93167) 4.5:1 or more, so the tag may be set smaller; key words in gold letters, 4.5:1 or more on the panel's
// top; the ▼ only once a stretch has appeared, still for reduced motion; the accent's ink (the menu's pressed word, 12 px, and the ▼) 4.5:1 or more where the panel's foot lets a white
// background through; the scene badge on its dark ground whatever the page's colours; a long name wraps upward, off the text.
{
  const idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8'), html = fs.readFileSync(`${ROOT}/settings.html`, 'utf8');
  const panel = over([18, 20, 34, 0.74], [255, 255, 255]), sky = [135, 206, 250];
  const night = 'body.rules-box-night.rules-box:not(.rules-box-log)';
  const has = t => css.includes(t);
  ok(/boxLook: 'night',/.test(idx) && /settings\(\)\.boxLook === 'night' \? 'dark'/.test(idx) && /classList\.toggle\('rules-box-night', on && settings\(\)\.boxLook === 'night'\);\s*toneLook\(\);/.test(idx)
      && /classList\.add\('rules-typing'\)/.test(idx) && /classList\?\.remove\('rules-typing'\)/.test(idx) && /id="rules_engine_box_look"/.test(html),
      'the night look is the default and dark while it shows', '');
  const foot = over([8, 9, 16, 0.8], [255, 255, 255]), accent = /--rules-accent: (#[0-9a-f]{6});/.exec(css)?.[1] ?? '', ink = /--rules-accent-ink: (#[0-9a-f]{6});/.exec(css)?.[1] ?? '';
  ok(contrast([255, 255, 255], panel) >= 4.5 && contrast(sky, panel) >= 4.5 && accent === '#d93167' && contrast([255, 255, 255], hex(accent)) >= 4.5 && contrast([255, 215, 0], panel) >= 4.5 && !!ink && contrast(hex(ink), foot) >= 4.5
      && has(`${night} #chat .mes.rules-now {\n    --SmartThemeBodyColor: white;`) && has('background: var(--rules-accent); color: white; font: 700 max(19px, ')
      && has('#chat .mes.rules-now::after { content: \'▼\';') && /::after \{ content: '▼';[^}]*color: var\(--rules-accent-ink\);/.test(css) && /button\[aria-pressed="true"\] \{ color: var\(--rules-accent-ink\);/.test(css)
      && has(`${night} #chat .mes.rules-now mark.rules-key { background-color: transparent; color: gold; padding: 0; }`)
      && has('rules-page-dark:not(.rules-box-log):not(.rules-box-night) #rules-box-scene:not(:empty)') && has('.ch_name { position: absolute; bottom: calc(100% - 16px);') && has(`${night} #chat .mes.rules-now span.rules-unit[data-said="false"] { color: lightskyblue; }`)
      && has(`body.rules-box-night.rules-box.rules-typing:not(.rules-box-log) #chat .mes.rules-now::after { content: none; }`) && /prefers-reduced-motion: reduce\) \{ body\.rules-box-night/.test(css)
      && has(`${night} #rules-box-scene:not(:empty) { width: fit-content;`) && /--rules-night-ground: rgba\(8, 9, 16, 0\.72\);/.test(css) && /color: white; background: var\(--rules-night-ground\);/.test(css),
      "the night look's colours and parts", JSON.stringify([contrast([255, 255, 255], panel), contrast(sky, panel), accent && contrast([255, 255, 255], hex(accent)), ink && contrast(hex(ink), foot)]));
}
// R43: the first-meeting card, the date badge and the menu inside the box (box.ts cardRole, sceneBadge; src/index.js showBox,
// showCard; style.css): the card's line is the trade the story gave, else age and noun; it shows once per character, at their
// first line in the chat going forward, and the next step takes it away before going on; the badge splits the story clock at
// its last comma; the menu stands above SillyTavern's chat layer (30) so its taps reach it; the card's name stands on its own
// white label (black on white at any length), turned 4° under a hard shadow, and the trade is white on the accent.
{
  const B = await import('../src/rules/box.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  const badge = B.sceneBadge('Recife', 'Sunday 15 July 1990, 18:20', 'nautical twilight'), day = B.sceneBadge(null, 'Day 2, 07:00', null);
  ok(B.cardRole({ occupation: 'innkeeper', age: 34, sex: 'male' }) === 'innkeeper' && B.cardRole({ age: 16.4, sex: 'female' }) === '16-year-old girl' && B.cardRole({ age: 40 }) === '40-year-old adult' && B.cardRole(undefined) === ''
      && JSON.stringify(badge) === JSON.stringify({ clock: '18:20', date: 'Sunday 15 July 1990', where: 'Recife · nautical twilight' }) && JSON.stringify(day) === JSON.stringify({ clock: '07:00', date: 'Day 2', where: '' }),
      "the card's line and the badge's parts", JSON.stringify([badge, day]));
  ok(/!metShown\.has\(who\) && hasCard\(who\)\s*&& document\.querySelector\(`#chat \.rules-unit\[data-who="\$\{CSS\.escape\(who\)\}"\]`\) === now\)/.test(idx) && /stepDir !== -1/.test(idx) && /if \(d === 1 && hideCard\(\)\)\s*return;/.test(idx) && /metShown\.clear\(\)/.test(idx)
      && /#rules-box-bar \{ position: relative; z-index: 31;/.test(css) && /body\.rules-box\.rules-card-on:not\(\.rules-box-log\) #rules-box-card \{ display: flex; position: absolute; inset: 0; z-index: 40;/.test(css),
      'the card once, the menu above the chat', '');
  ok(/const hasCard = \(who\) => !!ctx\(\)\.characters\?\.some\(c => c\.name === who\)/.test(idx) && /rgba\(18, 20, 34, 0\.74\), rgba\(8, 9, 16, 0\.82\)/.test(css) && /linear-gradient\(white, white\) bottom right \/ 3px 34px no-repeat/.test(css)
      && /#rules-box-card \.rules-card-name::before \{ z-index: -1; background: white; \}/.test(css)
      && /#rules-box-card \.rules-card-role \{ font: italic 700 19px\/1\.2 [^}]*color: white; transform: rotate\(-4deg\);/.test(css)
      && /transform: rotate\(-4deg\); transform-origin: 100% 50%;/.test(css) && /#rules-box-card \.rules-card-name::after \{ z-index: -2; background: #111; translate: 4px 4px; \}/.test(css), 'cards only for card characters; the see-through bracketed panel', '');
}
// R44: the night tag fitted, and hold to explain (box.ts tagFloorPx, explainParts; src/index.js fitTag, showExplain, hintHold;
// style.css), the player's picks of 2026-11-13. The tag's floor is the critical print size read as its capitals' height
// (17.3 px for a face whose capitals stand 0.73 of its size, 19.2 px for Georgia's 0.66), and a name that does not fit even
// there keeps the full size; a marked word's title splits into its marks' names and sizes; a held word explains in the menu
// line, the tap that ends the hold does not step on, and a mouse keeps its hover.
{
  const B = await import('../src/rules/box.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  const parts = B.explainParts('louder (about 6 dB above your normal voice), slower (about 0.8 times your own pace)');
  ok(Math.abs(B.tagFloorPx(0.73) - 17.33) < 0.02 && Math.abs(B.tagFloorPx(0.66) - 19.17) < 0.02
      && JSON.stringify(parts) === JSON.stringify([['louder', 'about 6 dB above your normal voice'], ['slower', 'about 0.8 times your own pace']])
      && JSON.stringify(B.explainParts('short pause')) === JSON.stringify([['short pause', '']]),
      'the tag floor and the explanation', JSON.stringify([B.tagFloorPx(0.73), parts]));
  ok(/floor = Math\.min\(full, tagFloorPx\(capShare\(cs\.fontFamily\)\)\)/.test(idx) && /if \(!fitsBox\(el\)\)\s*el\.style\.fontSize = '';/.test(idx)
      && /fitCardName\(n\);/.test(idx) && /el\.style\.overflowWrap = 'normal';\s*el\.style\.transform = 'none';/.test(idx)
      && /e\.pointerType === 'mouse'/.test(idx) && /if \(performance\.now\(\) < swallowUntil\)\s*return;/.test(idx) && /hintHold\(now\);/.test(idx)
      && /#rules-box-bar\.rules-explaining > :not\(#rules-box-explain\) \{ visibility: hidden; \}/.test(css),
      'hold to explain', '');
}
// R45: shoot a word (rules/why.ts pathOf; src/index.js showWhy; style.css #rules-why), the player's pick of 2026-11-13: a
// selected span returns its path, each step one relation that exists. A key word gives the decided result it names, its
// relation from its tool (Listen: heard) and its call's measures with the draw; said words give their speaker, or the
// telling a Communicate call decided; a fact the player's character holds gives the source it was learned from, who and
// when; other words are the narrator's, with the story's clock for words of light and time.
{
  const W = await import('../src/rules/why.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8');
  const pass = { calls: [{ tool: 'Listen', args: { listener: 'Mara', sound: 'footsteps', distance_m: 6, barrier: 'plaster wall', reveals: 'Tom walks the round' } }, { tool: 'Communicate', args: { speaker: 'Tom', listener: 'Mara', message: 'The gate is locked' } }],
    results: [{ tool: 'Listen', result: 'Mara hears it (footsteps at 6 m, rain, through plaster wall).', draws: [0.31] }, { tool: 'Communicate', result: 'Mara makes out every word.', draws: [0.12] }] };
  const keys = [{ phrase: 'hears footsteps', result: 'Mara hears it (footsteps at 6 m, rain, through plaster wall).', tool: 'Listen' }];
  const facts = [{ text: 'The watchman walks this round every night', knowers: ['Mara'], from: { mara: 'told by the innkeeper' }, at: { mara: 600 } }, { text: 'Tom keeps a knife in his boot', knowers: ['Tom'] }];
  const base = { player: 'Mara', keys, pass, facts, clock: { when: 'Sunday 15 July 1990, 18:20', place: 'Recife', sky: 'nautical twilight' }, when: m => `minute ${m}` };
  const heard = W.pathOf({ ...base, span: 'hears', sentence: 'Mara hears footsteps beyond the wall.' });
  const told = W.pathOf({ ...base, span: 'locked', sentence: 'The gate is locked.', said: 'Tom' });
  const fact = W.pathOf({ ...base, span: 'walks this round', sentence: 'The watchman walks this round, she knows.' });
  const lamps = W.pathOf({ ...base, span: 'The lamps burn low.', sentence: 'The lamps burn low.' });
  const cat = W.pathOf({ ...base, span: 'ginger', sentence: 'The innkeeper\'s cat is ginger.' });
  const knife = W.pathOf({ ...base, span: 'knife', sentence: 'Tom keeps a knife in his boot.' });
  ok(heard.length === 1 && heard[0].rel === 'heard' && heard[0].measures.includes('distance: 6 m') && heard[0].measures.includes('chance: drawn 0.31 (of 0 to 1)') && !heard[0].measures.some(m => /reveals/.test(m))
      && told[0].rel === 'told' && told[0].text === 'Tom told Mara' && told[0].note === 'Mara makes out every word.'
      && fact[0].rel === 'told' && fact[0].note === 'the innkeeper, minute 600'
      && lamps.map(s => s.rel).join() === 'written,clock' && lamps[1].text === 'Sunday 15 July 1990, 18:20 in Recife: nautical twilight'
      && cat.map(s => s.rel).join() === 'written' && knife.map(s => s.rel).join() === 'written'
      && W.relOfSource('heard, smelled or felt it').rel === 'sensed' && W.relOfSource('overheard Tom').by === 'Tom' && W.relOfSource('inferred from what they saw').rel === 'worked out',
      'the path of a shot word', JSON.stringify([heard, told, fact, lamps, cat, knife]));
  ok(/document\.addEventListener\('selectionchange'/.test(idx) && /if \(hideWhy\(\)\)\s*return;\s*stepBox\(1\);/.test(idx) && /tool: r\.tool \}\] : \[\];/.test(idx)
      && /#rules-why \{ position: absolute; z-index: 35;/.test(css), 'the path panel', '');
}
// R46: the knob (rules/faith.ts; ask.ts decide; question-pass.ts; rules-audit.ts; src/index.js; style.css #rules-faith), the
// player's pick of 2026-11-13: five stops, each setting how the line is read, how the narrator writes the player's character's
// turn and what the rule check holds the reply to. Below 1.0 the likeliest reading is taken, a tie included ("I hit him" with
// Tom and Will); at 1.0 as before (a look at him takes Tom, a blow at him asks); above 1.0 the player is asked whenever two
// readings fit (the look asks too). The check adds its kinds from 1.0; the line sent keeps the stop and the knob returns to 1.0.
{
  const F = await import('../src/rules/faith.js'), A = await import('../src/rules/ask.js'), Au = await import('../src/rules/rules-audit.js');
  const idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8'), qp = fs.readFileSync(`${ROOT}/src/rules/question-pass.js`, 'utf8');
  const men = [{ name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }], cues = { narration: ['Will waits by the door.', 'Tom leans on the bar.'], lastTargets: [] };
  const took = x => x && 'take' in x ? x.take.label : x && 'ask' in x ? 'ask' : null, d = (t, f) => took(A.decide(t, 'Jack', men, () => true, cues, () => 0.5, f));
  const got = [d('I hit him.', 0.5), d('I hit him.', 1), d('I look at him.', 1), d('I look at him.', 1.5), d('I look at him.', 2), d('I hit him.', 0)];
  ok(got[0] !== 'ask' && got[1] === 'ask' && got[2] !== 'ask' && got[3] === 'ask' && got[4] === 'ask' && got[5] !== 'ask'
      && F.faithOf('1.5') === 1.5 && F.faithOf(7) === 1 && F.faithOf(undefined) === 1 && F.nextFaith(2) === 0 && F.nextFaith(1) === 1.5
      && /begin the reply after it/.test(F.faithLine(2, 'Mara')) && /exactly the acts and words Mara's line gives them/.test(F.faithLine(1, 'Mara')) && /your own way/.test(F.faithLine(0, 'Mara'))
      && F.faithAudit(0.5, 'Mara', 'I slam the door.') === '' && /added_act/.test(F.faithAudit(1, 'Mara', 'I slam the door.')) && !/changed_words/.test(F.faithAudit(1, 'Mara', 'x'))
      && /changed_words/.test(F.faithAudit(1.5, 'Mara', 'x')) && /retold_line/.test(F.faithAudit(2, 'Mara', 'x'))
      && /give the player's character the acts and words of their line/.test(Au.correctionNote([{ quote: 'pours a drink', tool: 'FAITH', problem: 'added_act' }]))
      && Au.parseAudit('{"events":[{"quote":"pours a drink","tool":"FAITH","problem":"added_act"}]}')?.length === 1,
      'the knob reads, writes and checks by its stop', JSON.stringify(got));
  ok(/\.rulesFaith = faithNow;/.test(idx) && /faithNow = 1;\s*drawFaithKnob\(\);/.test(idx) && /faithLine\(faithOf\(line\.extra\?\.rulesFaith\), playerName\(\)\)/.test(idx)
      && /Math\.random, lineAt == null \? 1 : \(ctx\.chat \?\? \[\]\)\[lineAt\]\?\.extra\?\.rulesFaith\)/.test(qp) && /#rules-faith \{ position: relative;/.test(css), 'the knob by the message box', '');
}
// R47: the story's sheet (rules/views.ts; src/index.js; style.css), the player's picks of six drawn ideas, 2026-11-13: what the
// player's character remembers (their facts and common knowledge, the strongest first, another's fact left to them); what
// they remember of a person; a voice in plain words; the feeling a picture takes; the timeline from each line's pass; the
// plan on the player's floor with whom they heard; the hearing and sight of the turn.
{
  const V = await import('../src/rules/views.js'), idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8'), now = 1000000;
  const st = { clock: { t: now, add: 0 }, facts: [
      { id: 1, text: 'The watchman walks this round', knowers: ['Mara'], everyone: false, from: { mara: 'told by the innkeeper' }, at: { mara: now - 600 } },
      { id: 2, text: 'Tom keeps a knife in his boot', knowers: ['Tom'], everyone: false },
      { id: 3, text: 'Tom owes the baker three shillings', knowers: ['Mara'], everyone: false, from: { mara: 'overheard Tom' }, at: { mara: now - 3 * 1440 } },
      { id: 4, text: 'Rain falls on Recife in July', knowers: [], everyone: true }],
    people: { Mara: { at: 'inn: hall' }, Tom: { at: 'inn: kitchen', feelings: [{ type: 'anger', left: 3, turn: 5, strength: 0.8 }] }, Will: { at: 'inn: loft' } },
    map: { spots: { 'inn: hall': { x: 2, y: 2, floor: 0 }, 'inn: kitchen': { x: 8, y: 3, floor: 0 }, 'inn: loft': { x: 9, y: 1, floor: 1 } }, rooms: { hall: { corners: [[0, 0], [5, 0], [5, 5], [0, 5]], floor: 0, height: 2.5 } } } };
  const mem = V.memoryOf(st, 'Mara'), about = V.memoryAbout(st, 'Mara', 'Tom'), map = V.mapView(st, 'Mara', ['Tom'], []);
  const sensed = V.sensedThisTurn({ calls: [{ tool: 'Listen', args: { listener: 'Mara', source_who: 'Tom' } }, { tool: 'Look', args: { viewer: 'Mara', target_who: 'Will' } }], results: [{ tool: 'Listen', result: 'Mara hears it (footsteps at 6 m).' }, { tool: 'Look', result: 'Mara identifies it (a person).' }] }, 'Mara');
  ok(mem.map(r => r.text).join('|') === 'Rain falls on Recife in July|The watchman walks this round|Tom owes the baker three shillings' && mem[1].rel === 'told' && mem[1].by === 'the innkeeper' && mem[2].rel === 'overheard'
      && about.length === 1 && about[0].text === 'Tom owes the baker three shillings' && V.voiceWords(112, 3.6) === 'low voice, slow speech' && V.pictureFeeling(st.people.Tom) === 'anger'
      && JSON.stringify(V.timelineOf([{ is_user: true, extra: { rulesPass: { time: 600 } } }, { is_user: false }, { is_user: true, extra: { rulesPass: { time: 900 } } }])) === '[{"index":0,"time":600},{"index":2,"time":900}]'
      && map && map.people.map(p => `${p.name}:${p.player ? 'me' : ''}${p.heard ? 'heard' : ''}`).join() === 'Mara:me,Tom:heard' && map.rooms.length === 1 && JSON.stringify(sensed) === '{"heard":["Tom"],"seen":["Will"]}',
      "the story's sheet", JSON.stringify([mem.map(r => [r.text, r.strength.toFixed(3)]), about, map?.people, sensed]));
  ok(/openTab\(mapNow\(\) \? 'map' : 'memory'\)/.test(idx) && /scene\.addEventListener\('click', \(\) => openTab\('time'\)\)/.test(idx) && /fig\.setAttribute\('data-feeling', felt\)/.test(idx)
      && /showPerson\(tag\.textContent/.test(idx) && /#rules-box-figure\[data-feeling="anger"\] \{ filter:/.test(css), "the sheet's wiring", '');
}
console.log(`ui: ${n - miss} of ${n}`); process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
