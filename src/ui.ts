// What the player sees of the engine's reading and questions, drawn in the player's own SillyTavern theme (style.css). Kept
// free of SillyTavern so tests run it with a stand-in document.
//
// The reading of a line sits under that line in the chat, where it stays: a note about one message belongs next to it
// (Nielsen Norman Group, "Indicators, Validations, and Notifications"), and a message that vanishes after a few seconds with
// no other place to read it is a time limit (WCAG 2.2 SC 2.2.1, Understanding document). Interactive fiction prints its
// reading the same way: Inform writes "(the green box)" into the transcript when its parser chose for the player.
//
// The player's picks (2026-10-23): the most information in the fewest words, an aside in a book serif and italics, one
// colour per kind of rule, folded until opened, questions as prose with linked choices, type that follows the story's era.
// So each call is one line: a tag naming the kind of rule (Sight, Speech, Body…) in that kind's colour, then the call in
// the fewest words that decide it, the player's character (who makes every call shown) left out; folded, the note is one
// line holding the guess, if any, and the tagged calls. Colour is never the only carrier: each tag is also a word. The
// hues are Okabe & Ito's palette for colour-blind readers (Color Universal Design, 2008), mixed with the theme's own text
// colour so each stays legible on that theme (tests/ui.test.mjs checks 4.5:1, WCAG 1.4.3, on SillyTavern's shipped themes
// and a light one).
//
// A reading taken unasked ends in "or…", and opened offers the others as linked words ("Or did you mean to catch up with
// Tom?"); each link fills the input box with the player's correction ("no, catch up with Tom"), so a wrong guess is undone
// by the next line rather than warned about before (Raskin, "Never Use a Warning When You Mean Undo"). A question is a
// sentence with its choices linked, nothing focused or highlighted in advance: a choice shown pre-chosen is picked more often
// (the default effect; Johnson & Goldstein 2003, Science 302:1338).
import { correctionLine } from './rules/ask.js';
import { kindOf, type Kind, type Mode } from './rules/reading.js';
import { quotedWords } from './rules/quotes.js';
import { tokens, typeset, visible, CODE, WORD_PARTS } from './rules/voice-code.js';
import type { Mark } from './rules/prosody.js';
import { soundOf, loudnessRatio, pauseBeats, quantityOf, HELD_BEATS } from './rules/voice.js';
import { peek } from './rules/constants.js';

export interface Taken { label: string; others: string[] }
export interface Act { text: string; detail: string; kind?: Kind; brief?: string; mode?: Mode }
/** The note on one player's line; `line` is the text it read, so a line edited since shows no note. */
export interface ReadingNote { redone?: string | null; taken?: Taken | null; meant?: string[]; acts: Act[]; things: string[]; line?: string; voice?: string | null }

/** The story's era, for the type: bands by the type a book of that time was set in (era classes in style.css). */
export type Era = 'c16' | 'c17' | 'c18' | 'c19' | 'c20' | 'now';
export function eraOf(year: number | null): Era {
    if (year == null) return 'now';
    return year < 1600 ? 'c16' : year < 1750 ? 'c17' : year < 1800 ? 'c18' : year < 1920 ? 'c19' : year < 1970 ? 'c20' : 'now';
}
/** The mark pointing at a guessed reading: the manicule of manuscripts and print up to the early twentieth century, an arrow
 * after. */
export const markOf = (era: Era) => era === 'c20' || era === 'now' ? '→' : '☞';
/** Whether the theme's text is light (a dark theme) or dark, from its colour (rgb() or rgba()); each kind's colour is mixed
 * with the text colour in a share set for that tone (style.css). */
export function toneOf(textColour: string): 'dark' | 'light' {
    const [r = 220, g = 220, b = 210] = (textColour.match(/[\d.]+/g) ?? []).map(Number);
    const lin = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b) > 0.4 ? 'dark' : 'light';
}

export const TAG: Record<Kind, string> = { sight: 'Sight', sound: 'Sound', speech: 'Speech', body: 'Body', move: 'Move', mind: 'Mind', time: 'Time', thing: 'Thing' };
/** One colour per family of kinds: sight and sound share the senses' colour, their words tell them apart. */
export const FAMILY: Record<Kind, string> = { sight: 'sense', sound: 'sense', speech: 'speech', body: 'body', move: 'move', mind: 'mind', time: 'time', thing: 'thing' };

/** Choices said as one sentence: the words every choice opens with said once ("hit Tom or Will"), the rest linked. */
export function shared(labels: string[]): { lead: string; items: string[] } {
    const words = labels.map(l => `${l.charAt(0).toLowerCase()}${l.slice(1)}`.split(' '));
    let k = 0;
    while (words.every(w => w.length > k + 1 && w[k] === words[0]![k])) k++;
    return { lead: words[0]!.slice(0, k).join(' '), items: words.map(w => w.slice(k).join(' ')) };
}
const or = (n: number, i: number) => i === 0 ? '' : i === n - 1 ? (n > 2 ? ', or ' : ' or ') : ', ';

export type Row = { kind: Kind; tag: string; text: string; detail?: string };
/** What the note shows: the correction it redid, the guess (with the others while the line is the player's latest), one row
 * per call, the things read. Null when the line was read as nothing. */
export interface NoteView { redone?: string; taken?: string; meant?: string; alts?: { lead: string; items: string[]; lines: string[] }; rows: Row[] }
export function noteView(n: ReadingNote, latest: boolean): NoteView | null {
    const lower = (t: string) => `${t.charAt(0).toLowerCase()}${t.slice(1)}`;
    const rows: Row[] = [
        // How the line was said, read from the player's marks (prosody.ts deliveryOf).
        ...n.voice ? [{ kind: 'speech' as const, tag: 'Voice', text: n.voice }] : [],
        ...n.acts.map(a => { const kind = a.kind ?? kindOf(a.detail.split(':')[0] ?? ''); return { kind, tag: TAG[kind], text: a.brief ?? a.text, detail: a.detail }; }),
        ...n.things.map(t => ({ kind: 'thing' as const, tag: TAG.thing, text: t })),
    ];
    const others = latest && n.taken?.others.length ? n.taken.others : null;
    const view: NoteView = {
        ...n.redone ? { redone: n.redone.replace(/^The player corrects their last line: /, '').replace(/\.$/, '') } : {},
        ...n.taken ? { taken: lower(n.taken.label) } : {},
        // What the words were read as (intent.ts): "punhc → punch", "him back → Tom back", "again → I punch Tom".
        ...n.meant?.length ? { meant: n.meant.join('; ') } : {},
        ...others ? { alts: { ...shared(others), lines: others.map(correctionLine) } } : {},
        rows,
    };
    return view.redone || view.taken || view.meant || rows.length ? view : null;
}

/** Where the note is kept: on the player's message, extra.rulesReading (saved with the chat, as extra.rulesNarration). */
export const NOTE_KEY = 'rulesReading';
type Msg = { is_user?: boolean; mes?: string; extra?: Record<string, unknown> } | undefined;
/** "Say it another way": the player's line the reply was for, to take out of the chat and put back in the input box with its
 * marks, so the next line replaces it; null when the chat no longer ends with it. */
export function lineToTakeBack(chat: Msg[]): { index: number; text: string } | null {
    const i = chat.length - 1, m = chat[i];
    return m?.is_user && typeof m.mes === 'string' ? { index: i, text: m.mes } : null;
}
/** The notes to draw: each player's message that holds one for its present words; the others offered on the player's latest
 * line only, the one a correction in the next line can redo (question-pass.ts). */
export function notesOf(chat: Msg[]): { index: number; view: NoteView }[] {
    let latest = -1;
    chat.forEach((m, i) => { if (m?.is_user) latest = i; });
    return chat.flatMap((m, i) => {
        const held = m?.is_user ? m.extra?.[NOTE_KEY] as ReadingNote | undefined : undefined;
        const note = held && (held.line == null || held.line === m?.mes) ? held : undefined;
        const view = note ? noteView(note, i === latest) : null;
        return view ? [{ index: i, view }] : [];
    });
}

// The name plate: after the player's name, what their character is doing in the line, in one English word, so the plate
// reads as a clause ("Mara speaking", "Mara thinking"), as a visual novel's text box names the speaker and tags the line. The
// word is the call's primitive act (rules/reading.ts modeOf): it states what the engine decided, and the call is its hover text.
export interface PlateMode { mode: Mode; title: string }
/** A line's modes, speaking before thinking, each once. Speaking: a call that makes sounds with the voice, or words in
 * quotation marks (rules/quotes.ts: what is said in them is speech), also on a line no call was made for. Thinking: a call
 * that works something out. A note kept before modes were recorded names each call's tool in `detail`. */
export function modesOf(note: ReadingNote | null | undefined, line: string): PlateMode[] {
    const of = (a: Act): Mode | undefined => a.mode ?? (/^Communicate: /.test(a.detail) && !/\bmeans gesture\b/.test(a.detail) ? 'speaking' : /^WorkOut: /.test(a.detail) ? 'thinking' : undefined);
    const call = (m: Mode) => note?.acts.find(a => of(a) === m), said = quotedWords(visible(line));
    const speaking = call('speaking'), thinking = call('thinking');
    return [...speaking ? [{ mode: 'speaking' as const, title: speaking.text }] : said ? [{ mode: 'speaking' as const, title: `Said: “${said}”` }] : [],
        ...thinking ? [{ mode: 'thinking' as const, title: thinking.text }] : []];
}
/** The modes of each player's line in the chat; a line edited since its reading keeps only what its own words show. */
export function platesOf(chat: Msg[]): { index: number; modes: PlateMode[] }[] {
    return chat.flatMap((m, i) => {
        if (!m?.is_user) return [];
        const held = m.extra?.[NOTE_KEY] as ReadingNote | undefined;
        const modes = modesOf(held && (held.line == null || held.line === m.mes) ? held : null, String(m.mes ?? ''));
        return modes.length ? [{ index: i, modes }] : [];
    });
}
/** The modes as an element for the name plate: one word each, set as text, the call it rests on as its hover text. */
export function drawModes(doc: Doc, modes: PlateMode[]): El {
    const box = doc.createElement('span'); box.className = 'rules-modes';
    for (const m of modes) { const e = doc.createElement('span'); e.className = `rules-mode rules-mode-${m.mode}`; e.textContent = m.mode; e.title = m.title; box.appendChild(e); }
    return box;
}

// The box: one unit of the chat on screen at a time (index.ts showBox). A unit is a stretch of text with one value of
// [±voiced]: words that leave a mouth as sound, or text that does not. Quoted words are the voiced ones (rules/quotes.ts);
// SillyTavern's formatting sets them in <q> elements, so a paragraph's parts arrive marked.
export interface VoiceUnit { said: boolean; from: number; to: number }
/** A paragraph's parts (its child nodes in order, `said` for quoted words) as units by change of voice: each quoted part is a
 * unit, the parts between two of them are one unit, and a stretch without a letter or digit (the comma or full stop left
 * between two quotations) joins the unit before it, or the one after it at the paragraph's start. Ranges are [from, to). */
export function voiceUnits(parts: { said: boolean; text: string }[]): VoiceUnit[] {
    const out: VoiceUnit[] = [];
    let lead = 0;
    for (let i = 0; i < parts.length;) {
        let j = i + 1;
        if (!parts[i]!.said) while (j < parts.length && !parts[j]!.said) j++;
        const worded = parts[i]!.said || /[\p{L}\p{N}]/u.test(parts.slice(i, j).map(p => p.text).join(''));
        if (worded) { out.push({ said: parts[i]!.said, from: lead, to: j }); lead = j; }
        else if (out.length) { out.at(-1)!.to = j; lead = j; }
        i = j;
    }
    // A paragraph with no letter in it (an ellipsis, a rule of dashes) is one unit.
    return out.length || !parts.length ? out : [{ said: false, from: 0, to: parts.length }];
}

/** The parts of a document the note uses (a browser's, or a test's stand-in). */
export interface Doc { createElement(tag: string): El; createTextNode(t: string): El }
export interface El {
    className: string; textContent: string | null; title: string; type?: string;
    appendChild(c: El): El; setAttribute(k: string, v: string): void; addEventListener(e: string, f: () => void): void;
}
export interface Look { era: Era; tone: 'dark' | 'light' }
/** The note as an element: a <details> folded to one line (the guess and the tagged calls), opened to a line per call and the
 * other readings as linked words, each handing its correction to `fill`. Every text is set as text. */
export function drawNote(doc: Doc, v: NoteView, look: Look, fill: (text: string) => void): El {
    const el = (tag: string, cls: string, text?: string) => { const e = doc.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
    const tag = (r: Row) => el('span', `rules-tag rules-k-${FAMILY[r.kind]}`, r.tag);
    const box = el('details', `rules-reading rules-era-${look.era}`);
    box.setAttribute('data-tone', look.tone);
    const sum = el('summary', 'rules-reading-sum');
    sum.setAttribute('aria-label', 'How the rule engine read this line');
    if (v.redone) sum.appendChild(el('span', 'rules-reading-redone', `Redone: ${v.redone}`));
    if (v.meant) sum.appendChild(el('span', 'rules-reading-meant', `${markOf(look.era)} ${v.meant}`));
    if (v.taken) sum.appendChild(el('span', 'rules-reading-taken', `${markOf(look.era)} ${v.taken}`));
    // "or…" stays whole when the guess is cut short on a narrow screen: it says other readings are offered.
    if (v.taken && v.alts) sum.appendChild(el('span', 'rules-reading-or', '— or…'));
    // Folded, each kind of step once, in order (the player's review of 2026-11-17: every step on the one line was cut short
    // with "…"); the steps themselves stand in the opened rows.
    const list = el('span', 'rules-reading-list'), kinds = new Set<string>();
    for (const r of v.rows) { if (kinds.has(r.tag)) continue; kinds.add(r.tag); const item = el('span', 'rules-reading-item'); item.appendChild(tag(r)); list.appendChild(item); }
    sum.appendChild(list);
    sum.appendChild(el('span', 'rules-reading-label', 'read as'));
    box.appendChild(sum);
    const body = el('div', 'rules-reading-body');
    for (const r of v.rows) {
        const row = el('div', 'rules-reading-row');
        row.appendChild(tag(r));
        const text = el('span', 'rules-reading-text', r.text);
        if (r.detail) text.title = r.detail;
        row.appendChild(text);
        body.appendChild(row);
    }
    if (v.alts) {
        const p = el('p', 'rules-reading-alts');
        p.appendChild(doc.createTextNode(`Or did you mean to ${v.alts.lead ? `${v.alts.lead} ` : ''}`));
        v.alts.items.forEach((t, i) => {
            if (i) p.appendChild(doc.createTextNode(or(v.alts!.items.length, i)));
            const b = el('button', 'rules-link', t);
            b.type = 'button';
            b.title = `Puts "${v.alts!.lines[i]}" in your message box`;
            b.addEventListener('click', () => fill(v.alts!.lines[i]!));
            p.appendChild(b);
        });
        p.appendChild(doc.createTextNode('?'));
        body.appendChild(p);
    }
    box.appendChild(body);
    return box;
}

const esc = (t: string) => t.replace(/[&<>"']/g, ch => `&#${ch.charCodeAt(0)};`);
/** The answer "say it another way" returns; choices return OPTION + their index. */
export const OTHER = 9, OPTION = 10;
type Popup = { dlg?: { addEventListener(e: string, f: (ev: { key: string; preventDefault(): void }) => void): void; querySelectorAll(s: string): ArrayLike<{ addEventListener(e: string, f: () => void): void; getAttribute(k: string): string | null }> }; complete(r: number): unknown };
/** A question's popup: the player's words, then one sentence with every choice a link in the same form (numbered, picked by
 * its number key or a click), "say it another way" last; the sentence holds the focus, so Enter picks nothing. `notes`
 * (the things' descriptions) follow each choice. Arguments for callGenericPopup(content, POPUP_TYPE.TEXT, '', options). */
export function askPopup(q: { said: string; choices: string[]; notes?: string[]; things?: boolean }, o: { era?: Era; reduced?: boolean } = {}): { content: string; options: Record<string, unknown> } {
    const s = q.things ? { lead: '', items: q.choices } : shared(q.choices);
    const links = s.items.map((t, i) => `${or(s.items.length, i)}<button type="button" class="rules-link rules-ask-choice" data-choice="${i}"><sup>${i + 1}</sup>${esc(t)}</button>${q.notes?.[i] ? ` <span class="rules-ask-note">(${esc(q.notes[i]!)})</span>` : ''}`).join('');
    const sentence = q.things ? `Do you mean ${links}?` : `Do you mean to ${s.lead ? `${esc(s.lead)} ` : ''}${links}?`;
    return {
        content: `<div class="rules-ask rules-era-${o.era ?? 'now'}"><p class="rules-ask-said">“${esc(q.said)}”</p><p class="rules-ask-prose" tabindex="-1" autofocus>${sentence}</p>`
            + `<p class="rules-ask-foot"><button type="button" class="rules-link rules-ask-choice" data-choice="other">Say it another way</button></p></div>`,
        options: {
            okButton: false, cancelButton: false, allowVerticalScrolling: true, animation: o.reduced ? 'none' : 'fast',
            onOpen: (p: Popup) => {
                const all = p.dlg?.querySelectorAll('.rules-ask-choice');
                for (let i = 0; i < (all?.length ?? 0); i++) {
                    const b = all![i]!, c = b.getAttribute('data-choice');
                    b.addEventListener('click', () => { void p.complete(c === 'other' ? OTHER : OPTION + Number(c)); });
                }
                // Number keys pick (1 for the first choice), as in Disco Elysium's and 80 Days' choice lists.
                p.dlg?.addEventListener('keydown', ev => {
                    const n = Number(ev.key);
                    if (Number.isInteger(n) && n >= 1 && n <= q.choices.length) { ev.preventDefault(); void p.complete(OPTION + n - 1); }
                });
            },
        },
    };
}
/** The choice a popup's result picked, or null (said another way, closed, or escaped). */
export function askAnswer(result: unknown, n: number): number | null {
    return typeof result === 'number' && result >= OPTION && result < OPTION + n ? result - OPTION : null;
}
/** The player's words a question quotes ('"Follow the thief": which do you mean?' → Follow the thief). */
export const saidOf = (question: string) => /^"([^"]+)"/.exec(question)?.[1] ?? question;

// The voice toolbar: plain words, each written in the effect it names ("louder" in small capitals, "rises" lifted), in
// groups, each group with one soft colour that also underlines its marked words in the message box. Picking one marks the
// selected words with hidden codes (src/rules/voice-code.ts): the player sees their own words, never a sign.
export type Family = 'sense' | 'body' | 'move' | 'mind' | 'time' | 'speech';
export interface VoiceItem { id: string; label: string; mark?: Mark }
export const VOICE_GROUPS: { group: string; family: Family; items: VoiceItem[] }[] = [
    { group: 'Pitch', family: 'sense', items: [{ id: 'up', label: 'rises', mark: 'up' }, { id: 'down', label: 'falls', mark: 'down' }] },
    { group: 'Volume', family: 'body', items: [{ id: 'loud', label: 'louder', mark: 'loud' }, { id: 'quiet', label: 'softer', mark: 'quiet' }, { id: 'whisper', label: 'whispered', mark: 'whisper' }] },
    { group: 'Pace', family: 'move', items: [{ id: 'fast', label: 'faster', mark: 'fast' }, { id: 'slow', label: 'slower', mark: 'slow' }, { id: 'stretch', label: 'drawn out', mark: 'stretch' },
        { id: 'micro', label: 'short pause' }, { id: 'pause', label: 'pause' }, { id: 'cut', label: 'cut off', mark: 'cut' }] },
    { group: 'Voice', family: 'mind', items: [{ id: 'breathy', label: 'breathy', mark: 'breathy' }, { id: 'creaky', label: 'creaky', mark: 'creaky' }, { id: 'falsetto', label: 'falsetto', mark: 'falsetto' },
        { id: 'smile', label: 'smiling', mark: 'smile' }, { id: 'laugh', label: 'laughing', mark: 'laugh' }] },
    { group: 'Breath', family: 'time', items: [{ id: 'inbreath', label: 'breath in', mark: 'inbreath' }, { id: 'outbreath', label: 'breath out', mark: 'outbreath' }] },
    { group: 'Weight', family: 'speech', items: [{ id: 'stress', label: 'stressed', mark: 'stress' }] },
    { group: 'Feeling', family: 'speech', items: [{ id: 'feeling:anger', label: 'angry' }, { id: 'feeling:fear', label: 'afraid' }, { id: 'feeling:happiness', label: 'happy' },
        { id: 'feeling:sadness', label: 'sad' }, { id: 'feeling:tenderness', label: 'tender' }] },
];
/** Each mark's plain name and the colour family of its group. */
export const MARK_NAME: Record<string, string> = Object.fromEntries(VOICE_GROUPS.flatMap(g => g.items.map(i => [i.id, i.label])));
const FAMILY_OF: Record<string, Family> = Object.fromEntries(VOICE_GROUPS.flatMap(g => g.items.map(i => [i.id, g.family])));
/** The family a word's codes take their soft colour from (the first mark's), and the marks named for its hover text. */
export function voiceLook(codes: string[]): { family: Family; title: string } | null {
    const ids = codes.map(c => c.startsWith('f:') ? `feeling:${c.slice(2)}` : c === 'p.' ? 'micro' : c.startsWith('p') ? 'pause' : (Object.entries(CODE).find(([, v]) => v === c)?.[0] ?? '')).filter(Boolean);
    if (!ids.length) return null;
    return { family: FAMILY_OF[ids[0]!] ?? 'speech', title: ids.map(i => MARK_NAME[i] ?? i).join(', ') };
}
/** The message box's layer: the box's text exactly (hidden codes included, so every letter falls where the box has it), each
 * marked word in a span coloured by its family. */
export function mirrorParts(text: string): { text: string; family?: Family; title?: string }[] {
    const out: { text: string; family?: Family; title?: string }[] = [];
    let cursor = 0;
    for (const k of tokens(text)) {
        const look = voiceLook(k.codes);
        if (!look) continue;
        if (k.start > cursor) out.push({ text: text.slice(cursor, k.start) });
        // The colour under the word's letters: its quotation marks and punctuation stay plain.
        const m = WORD_PARTS.exec(k.text)!;
        if (m[1]) out.push({ text: m[1] });
        out.push({ text: m[2] ?? '', family: look.family, title: look.title });
        if (m[3]) out.push({ text: m[3] });
        cursor = k.end;
    }
    if (cursor < text.length) out.push({ text: text.slice(cursor) });
    // A last line break needs a character after it to take its height in the layer.
    if (text.endsWith('\n')) out.push({ text: '\u200b' });
    return out;
}
/** A word's pitch marks in the order given: 'up', 'down', 'updown' (rise-fall) or 'downup' (fall-rise); '' for none. */
export const pitchOf = (marks: Mark[]) => marks.filter(m => m === 'up' || m === 'down').join('');

// The multiple-distinctions look takes its sizes from the sound of each mark (rules/voice.ts), so a size states a quantity.
// Each part of the voice has a place of its own around the word: above it the melody, in its letters the loudness, under it
// the phonation, along the line the time, at the message's edge the feeling.
// Time runs along the line: the further time a syllable takes (1 ÷ rate − 1) widens the gaps between the words and, less,
// the letters, as slower speech is mostly more pausing (Goldman-Eisler 1968, as Trouvain 2004, Phonus 8, quotes her); a
// faster word also leans forward, since letters can close up by little before they touch, and a half-size width step is
// recognized by 55 % of readers against 78 % for the full one (Bessemans et al. 2019, Visible Language 53.3).
// Loudness is the word's ink: its weight and size rise and its opacity falls with how many times as loud the level sounds
// (voice.ts loudnessRatio). The three vary together because cues that vary together are told apart better than one alone
// (4.1 against about 2.7 bits for size, brightness and hue varied together or one at a time: Eriksen, as Miller 1956,
// Psychol Rev 63:81, reports).
// The gains and bounds below are [ASSUMED] for legibility: TRACK_EM and GAP_EM, em per unit of further time, keep letter
// spacing near the standard, where reading is fastest (Yu, Cheung, Legge & Chung 2007, J Vis 7(2):2: 25 % slower at twice
// the standard spacing), and GAP_MIN_EM keeps the space that parts two faster words; INK_FLOOR is the lowest opacity at
// which SillyTavern's shipped themes keep 4.5:1 (WCAG 1.4.3; tests/ui.test.mjs R32); the SIZE bounds keep a whisper at
// 12 px or more of a 15 px line.
const TRACK_EM = 0.08, GAP_EM = 0.3, GAP_MIN_EM = -0.03, LEAN_DEG = 50, PITCH_EM = 0.05, PITCH_MAX_EM = 0.36;
const BASE_WEIGHT = 500, WEIGHT_MIN = 300, WEIGHT_MAX = 900, INK_POWER = 0.37, INK_FLOOR = 0.78, SIZE_POWER = 0.27, SIZE_MIN = 0.82, SIZE_MAX = 1.12;
/** The look's sizes as CSS custom properties (name without the leading --rules-, unitless value): index.ts sets them on the
 * page, and style.css holds the same values as fallbacks (tests/ui.test.mjs R32 keeps the two equal). */
export function lookVars(): Record<string, number> {
    const time = (m: Mark) => 1 / soundOf([m]).rate - 1, loud = (m: Mark) => loudnessRatio(soundOf([m]).db);
    const r = (x: number, d: number) => Math.round(x * 10 ** d) / 10 ** d, clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
    const weight = (l: number) => Math.round(clamp(BASE_WEIGHT * l, WEIGHT_MIN, WEIGHT_MAX)), ink = (l: number) => r(clamp(l ** INK_POWER, INK_FLOOR, 1), 2), size = (l: number) => r(clamp(l ** SIZE_POWER, SIZE_MIN, SIZE_MAX), 2);
    return {
        'fast-track': r(TRACK_EM * time('fast'), 3), 'slow-track': r(TRACK_EM * time('slow'), 3), 'fast-gap': r(Math.max(GAP_MIN_EM, GAP_EM * time('fast')), 3), 'slow-gap': r(GAP_EM * time('slow'), 3),
        'fast-lean': r(LEAN_DEG * time('fast'), 1),
        'loud-weight': weight(loud('loud')), 'quiet-weight': weight(loud('quiet')), 'whisper-weight': weight(loud('whisper')),
        'loud-size': size(loud('loud')), 'quiet-size': size(loud('quiet')), 'whisper-size': size(loud('whisper')),
        'quiet-ink': ink(loud('quiet')), 'whisper-ink': ink(loud('whisper')),
        'pitch-rise': r(Math.min(PITCH_MAX_EM, PITCH_EM * peek('voicePitchSemitones')), 2),
    };
}

const VOWEL = /[aeiouyAEIOUY](?=[^aeiouyAEIOUY]*$)/;
/** A drawn-out word in parts: up to and with its last vowel (the one toNotation stretches), that vowel written again once per
 * further beat it is held ("Nooo", "NOOO"; "Oh" is held as "Oooh"), as writers lengthen a word, and the rest; null for a
 * word without a vowel. */
export function heldParts(word: string): { head: string; again: string; tail: string } | null {
    const v = word.search(VOWEL);
    if (v < 0) return null;
    const vowel = word.charAt(v), letters = word.replace(/[^\p{L}]/gu, '');
    return { head: word.slice(0, v + 1), again: (letters.length > 1 && letters === letters.toUpperCase() ? vowel : vowel.toLowerCase()).repeat(HELD_BEATS), tail: word.slice(v + 1) };
}
/** The marks drawn over a run of words as one (its ink, and the rule under it): a softer or whispered voice and the phonation.
 * Words side by side with the same ones stand in one span (class rules-run), so the rule runs on under the spaces. */
export const RUN_MARKS: Mark[] = ['quiet', 'creaky', 'breathy', 'whisper'];
const runOf = (marks: Mark[]) => RUN_MARKS.filter(m => marks.includes(m)).join(' ');
/** The chat's typesetting of a run of text with hidden marks (voice-code.ts typeset) as elements: each marked word a span with
 * a class per mark, its marks and their quantities named on hover (voice.ts quantityOf), the small added words (a pause's dot,
 * "inhales", the feeling) muted. For the multiple-distinctions look (style.css, body.rules-distinct) a word also carries its
 * pitch order (data-pitch); a stressed word has the IPA stress mark before it; a drawn-out word has its last vowel (the one
 * toNotation stretches) in a span of its own and written again once per further beat; a timed pause has a dot per syllable of
 * silence beside its dash; the space between two words that are both faster or both slower is a span, so the gap takes the
 * tempo; words side by side that share a softer voice or a phonation stand in one span (rules-run); the feeling carries its
 * name (data-feeling). The plain look hides what the other look adds. */
export function drawVoice(doc: Doc, text: string): El[] {
    const segs = typeset(text);
    // The tempo two neighbouring words share, for the space between them: only spaces and punctuation lie between the two.
    const word = (from: number, step: number) => { for (let i = from + step; i >= 0 && i < segs.length; i += step) { const s = segs[i]!; if (s.marks) return s.marks; if (s.add || /\s/.test(s.text)) return null; } return null; };
    const tempoOf = (ms: Mark[] | null) => !ms || ms.includes('slow') === ms.includes('fast') ? null : ms.includes('slow') ? 'slow' : 'fast';
    const drawn = segs.map((seg, i): El[] => {
        if (seg.add) {
            const e = doc.createElement('span'); e.className = `rules-v-add rules-v-add-${seg.add}`; e.textContent = seg.text;
            if (seg.add === 'micro' || seg.add === 'pause') e.title = seg.add === 'micro' ? 'short pause' : seg.seconds === 0.5 ? 'pause, half a second' : `pause, ${seg.seconds} s`;
            if (seg.feeling) e.setAttribute('data-feeling', seg.feeling);
            if (seg.add !== 'pause') return [e];
            // The silence in the syllables it would have held: time along the line, apart from a cut-off's dash.
            const rest = doc.createElement('span'); rest.className = 'rules-v-add rules-v-add-rest'; rest.textContent = ` ${'·'.repeat(pauseBeats(seg.seconds ?? 0))}`; rest.title = e.title;
            return [e, rest];
        }
        if (!seg.marks?.length) {
            const tempo = !seg.marks && /^ +$/.test(seg.text) ? tempoOf(word(i, -1)) : null;
            if (!tempo || tempo !== tempoOf(word(i, 1))) return [doc.createTextNode(seg.text)];
            const gap = doc.createElement('span'); gap.className = `rules-v-gap rules-v-gap-${tempo}`; gap.textContent = seg.text;
            return [gap];
        }
        const e = doc.createElement('span'); e.className = ['rules-v', ...seg.marks.map(m => `rules-v-${m}`)].join(' ');
        e.title = seg.marks.map(m => { const q = quantityOf(m); return `${MARK_NAME[m] ?? m}${q ? ` (${q})` : ''}`; }).join(', ');
        const pitch = pitchOf(seg.marks);
        if (pitch) e.setAttribute('data-pitch', pitch);
        const parts = seg.marks.includes('stretch') ? heldParts(seg.text) : null;
        if (!parts) e.textContent = seg.text;
        else {
            // The vowel in a span of its own, then written again: the added letters are the typesetting's, so a copied line
            // keeps the player's spelling.
            const long = doc.createElement('span'); long.className = 'rules-v-long'; long.textContent = parts.head.slice(-1);
            const held = doc.createElement('span'); held.className = 'rules-v-add rules-v-add-held'; held.textContent = parts.again;
            if (parts.head.length > 1) e.appendChild(doc.createTextNode(parts.head.slice(0, -1)));
            e.appendChild(long); e.appendChild(held);
            if (parts.tail) e.appendChild(doc.createTextNode(parts.tail));
        }
        if (!seg.marks.includes('stress')) return [e];
        // The IPA's stress mark before the word (IPA chart: ˈ primary stress).
        const tick = doc.createElement('span'); tick.className = 'rules-v-add rules-v-add-tick'; tick.textContent = 'ˈ';
        return [tick, e];
    });
    // Runs: from a word to the last word after it with the same run marks, every word between having them too; what lies
    // between the words (spaces, punctuation, a pause) is inside, what follows the last word is outside.
    const out: El[] = [];
    for (let i = 0; i < segs.length; i++) {
        const run = segs[i]!.marks ? runOf(segs[i]!.marks!) : '';
        if (!run) { out.push(...drawn[i]!); continue; }
        let end = i;
        for (let j = i + 1; j < segs.length; j++) { const ms = segs[j]!.marks; if (!ms) continue; if (runOf(ms) !== run) break; end = j; }
        const span = doc.createElement('span'); span.className = ['rules-run', ...run.split(' ').map(m => `rules-run-${m}`)].join(' ');
        for (let j = i; j <= end; j++) for (const e of drawn[j]!) span.appendChild(e);
        out.push(span);
        i = end;
    }
    return out;
}
