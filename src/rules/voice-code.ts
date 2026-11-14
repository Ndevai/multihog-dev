// The player's voice marks kept out of sight: each marked word carries an invisible block right after its last letter, in
// Unicode tag characters (U+E0020–U+E007E, the printable ASCII shifted to plane 14, closed by U+E007F CANCEL TAG). They
// are default-ignorable: they take no width and show nothing, and a browser treats them as part of the letter they follow,
// so the cursor steps over them. The words on screen are the player's own; the marks travel with them in the saved message,
// and code turns them into the notation prosody.ts reads (Jefferson's and VoQS's marks) before the engine or a model reads
// the line. Codes: L louder, Q quieter, W whisper, U pitch up, D pitch down, S stressed, R drawn out, F faster, O slower,
// B breathy, C creaky, X falsetto, M smiling, H laughing, I breath in before, E breath out after, K cut off, p. a short
// pause after, p0.5 a pause of 0.5 s after, f:anger the line's feeling.
import type { Mark, Feeling, Prosody, Word } from './prosody.js';

const TAG = 0xE0000, END = 0xE007F;
export const CODE: Record<Mark, string> = { loud: 'L', quiet: 'Q', whisper: 'W', up: 'U', down: 'D', stress: 'S', stretch: 'R', fast: 'F', slow: 'O', breathy: 'B',
    creaky: 'C', falsetto: 'X', smile: 'M', laugh: 'H', inbreath: 'I', outbreath: 'E', cut: 'K' };
const MARK_OF = Object.fromEntries(Object.entries(CODE).map(([m, c]) => [c, m as Mark])) as Record<string, Mark>;
/** A block of tag characters for codes, or '' for none. */
export function block(codes: Iterable<string>): string {
    const s = [...codes].join(',');
    return s ? [...s].map(ch => String.fromCodePoint(TAG + ch.charCodeAt(0))).join('') + String.fromCodePoint(END) : '';
}
const RUN = /[\u{E0020}-\u{E007E}]*\u{E007F}|[\u{E0020}-\u{E007E}]+/gu;
const decodeRun = (run: string) => [...run].filter(c => c.codePointAt(0)! !== END).map(c => String.fromCharCode(c.codePointAt(0)! - TAG)).join('').split(',').filter(Boolean);
/** Whether a text holds hidden marks. */
export const hasHidden = (t: string) => /[\u{E0020}-\u{E007F}]/u.test(t);
/** The text as it shows: hidden marks taken out. */
export const visible = (t: string) => t.replace(RUN, '');
/** Text for a model: no character of the Tags block at all (U+E0000–U+E007F; Wikipedia, "Tags (Unicode block)"). The player's
 *  marks reach a model as notation, written before (toNotation); a tag character still in a prompt is none the player meant a
 *  model to read, and it shows nothing, so a card, a fact or a reply could carry one unseen. Every way out to a model takes
 *  them out: the engine's own requests (send.ts), the narrator's prompt and the tools' results. */
export const untagged = (t: string) => t.replace(/[\u{E0000}-\u{E007F}]/gu, '');

export interface Token { start: number; end: number; text: string; word: string; codes: string[] }
/** A word's signs before and after its letters: quotation marks of every pair quotes.ts reads, brackets, and the dashes and
 * ellipsis after it; the marks' signs go on the letters between. */
export const WORD_PARTS = /^(["“„‚'‘(\[«»‹›]*)(.*?)([,.;:!?"”“'’)\]»«›‹—–…]*)$/su;
/** The text's words (runs without white space), each with its visible form and the codes its hidden blocks hold. */
export function tokens(t: string): Token[] {
    return [...t.matchAll(/\S+/g)].map(m => {
        const codes: string[] = [];
        for (const r of m[0].match(RUN) ?? []) for (const c of decodeRun(r)) if (!codes.includes(c)) codes.push(c);
        return { start: m.index!, end: m.index! + m[0].length, text: m[0], word: m[0].replace(RUN, ''), codes };
    });
}
/** A word rewritten with one block holding `codes`, set right after its last letter or digit (punctuation and quotation
 * marks after it stay after it); a word with no letter keeps no block. */
function rewrite(word: string, codes: string[]): string {
    const at = word.search(/[\p{L}\p{N}][^\p{L}\p{N}]*$/u);
    if (at < 0 || !codes.length) return word;
    const cut = at + [...word.slice(at)][0]!.length;
    return word.slice(0, cut) + block(codes) + word.slice(cut);
}
const LINE = /^f:/;
/** A mark put on or taken off the words a selection touches (or the word at the cursor): on all of them when any lacks it,
 * off all of them when all have it. A pause or a breath out goes on the last word; a breath in on the first; a feeling
 * ('feeling:anger') belongs to the line and goes on its first word, replacing another. Returns the replacement of
 * [from, to) and the selection after it, or null when no word is there. */
export function markWords(t: string, s0: number, e0: number, id: string): { from: number; to: number; insert: string; selStart: number; selEnd: number } | null {
    const all = tokens(t).filter(k => /[\p{L}\p{N}]/u.test(k.word));
    if (!all.length) return null;
    const s = Math.min(s0, e0), e = Math.max(s0, e0);
    let hit = all.filter(k => s === e ? k.start <= s && s <= k.end : k.end > s && k.start < e);
    if (!hit.length) return null;
    let code: string;
    if (id.startsWith('feeling:')) { code = `f:${id.slice(8)}`; hit = [all[0]!]; }
    else if (id === 'micro' || id === 'pause') { code = id === 'micro' ? 'p.' : 'p0.5'; hit = [hit.at(-1)!]; }
    else if (id === 'outbreath') { code = CODE.outbreath; hit = [hit.at(-1)!]; }
    else if (id === 'inbreath') { code = CODE.inbreath; hit = [hit[0]!]; }
    else { const c = CODE[id as Mark]; if (!c) return null; code = c; }
    const on = !hit.every(k => k.codes.includes(code));
    const from = hit[0]!.start, to = hit.at(-1)!.end;
    let insert = '', cursor = from;
    for (const k of hit) {
        insert += t.slice(cursor, k.start);
        let codes = k.codes.filter(c => c !== code && !(on && LINE.test(code) && LINE.test(c)) && !(on && /^p/.test(code) && /^p/.test(c)));
        if (on) codes = [...codes, code];
        insert += rewrite(k.word, codes);
        cursor = k.end;
    }
    // A feeling goes on the line's first word; the words the player selected stay selected for the next mark.
    if (LINE.test(code)) { const d = insert.length - (to - from); return { from, to, insert, selStart: s >= to ? s + d : from, selEnd: e >= to ? e + d : from + insert.length }; }
    return { from, to, insert, selStart: from, selEnd: from + insert.length };
}

/** The line in the notation the models read: each word's hidden marks written as Jefferson's and VoQS's signs, the spans
 * (quieter, faster, slower, smiling, breathy, creaky, whispered, falsetto) around each run of words that carry them; text
 * without hidden marks comes back as it is. prosody.ts reads the same signs when a player types them, all but › ‹ (faster,
 * slower), which typed are quotation marks; the engine reads a toolbar line from its codes (marksOf), never from this. */
const SPAN: [string, string, string][] = [['Q', '°', '°'], ['F', '›', '‹'], ['O', '‹', '›'], ['M', '☺', '☺'], ['B', '{V̤ ', ' V̤}'], ['C', '{V̰ ', ' V̰}'], ['W', '{W ', ' W}'], ['X', '{F ', ' F}']];
const FEELING_WORD: Record<string, string> = { anger: 'angry', fear: 'afraid', happiness: 'happy', sadness: 'sad', tenderness: 'tender' };
export function toNotation(t: string): string {
    if (!hasHidden(t)) return t;
    const ks = tokens(t);
    let out = '', cursor = 0, feeling: string | null = null;
    ks.forEach((k, i) => {
        out += t.slice(cursor, k.start).replace(RUN, ''); cursor = k.end;
        const has = (c: string) => k.codes.includes(c), prev = (c: string) => i > 0 && ks[i - 1]!.codes.includes(c) && t.slice(ks[i - 1]!.end, k.start).indexOf('\n') < 0, next = (c: string) => i < ks.length - 1 && ks[i + 1]!.codes.includes(c) && t.slice(k.end, ks[i + 1]!.start).indexOf('\n') < 0;
        for (const c of k.codes) if (LINE.test(c) && !feeling) feeling = c.slice(2);
        const m = WORD_PARTS.exec(k.word)!;
        let lead = m[1] ?? '', core = m[2] ?? '', tail = m[3] ?? '';
        if (!core) { out += k.word; return; }
        let open = '', close = '';
        for (const [c, o, cl] of SPAN) { if (has(c) && !prev(c)) open += o; if (has(c) && !next(c)) close = cl + close; }
        if (has('L')) core = core.toUpperCase();
        if (has('R')) { const v = core.search(/[aeiouyAEIOUY](?=[^aeiouyAEIOUY]*$)/); const at = v >= 0 ? v + 1 : core.length; core = `${core.slice(0, at)}::${core.slice(at)}`; }
        if (has('H')) { const v = core.search(/[aeiouAEIOU]/); const at = v >= 0 ? v + 1 : 1; core = `${core.slice(0, at)}(h)${core.slice(at)}`; }
        if (has('K')) core += '-';
        // Pitch arrows in the order the player put them: ↑↓ a rise-fall, ↓↑ a fall-rise (two tunes with different uses: Ward &
        // Hirschberg 1985, Language 61:747, on the fall-rise); the model reads the shape and the context decides its meaning.
        const pitch = k.codes.filter(c => c === 'U' || c === 'D').map(c => c === 'U' ? '↑' : '↓').join('');
        const pre = `${has('I') ? '.hhh ' : ''}${open}${pitch}${has('S') ? 'ˈ' : ''}`;
        const pause = k.codes.find(c => /^p/.test(c));
        out += `${lead}${pre}${core}${close}${tail}${has('E') ? ' hhh' : ''}${pause ? ` (${pause.slice(1)})` : ''}`;
    });
    out += t.slice(cursor).replace(RUN, '');
    return feeling ? `((${FEELING_WORD[feeling] ?? feeling})) ${out}` : out;
}

/** The marks on a line read straight from its hidden codes, in prosody.ts's form: each word as shown with its marks and the
 * pause after it, the line's feeling, the line as shown. Only the codes are read: quotation marks, capitals, colons and
 * guillemets the player typed stay words. */
export function marksOf(t: string): Prosody {
    const words: Word[] = [];
    let feeling: Feeling | undefined;
    for (const k of tokens(t)) {
        const f = k.codes.find(c => LINE.test(c)), p = k.codes.find(c => /^p/.test(c));
        if (f && !feeling && f.slice(2) in FEELING_WORD) feeling = f.slice(2) as Feeling;
        words.push({ word: k.word, marks: k.codes.map(c => MARK_OF[c]).filter((m): m is Mark => !!m), ...p ? { pause: p === 'p.' ? 0.1 : Number(p.slice(1)) } : {} });
    }
    return { plain: visible(t), words, ...feeling ? { feeling } : {}, notes: [], marked: !!feeling || words.some(w => w.marks.length || w.pause) };
}
/** Before a model reads the chat (SillyTavern's prompt copy of it): each player's line with hidden codes becomes the
 * notation, and keeps its codes in `voiced` for the engine's own reading (marksOf). */
export function notateChat(chat: { is_user?: boolean; mes?: string; voiced?: string }[]): void {
    for (const m of chat) if (m?.is_user && hasHidden(String(m.mes ?? ''))) { m.voiced = String(m.mes); m.mes = toNotation(m.voiced); }
}

/** A request on its way to a model, whoever built it (SillyTavern's CHAT_COMPLETION_SETTINGS_READY and
 * TEXT_COMPLETION_SETTINGS_READY carry every request: the reply's, a quiet prompt's and an extension's raw prompt, such as the
 * summary's "raw" builder, which reads the saved chat): each text with hidden marks becomes the notation, line by line, and no
 * other tag character stays. */
export function notateRequest(data: { messages?: unknown; prompt?: unknown } | null | undefined): void {
    if (!data) return;
    const fix = (t: string) => hasHidden(t) ? untagged(t.split('\n').map(toNotation).join('\n')) : t;
    if (Array.isArray(data.messages)) for (const m of data.messages as { content?: unknown }[]) {
        if (!m || typeof m !== 'object') continue;
        if (typeof m.content === 'string') m.content = fix(m.content);
        else if (Array.isArray(m.content)) for (const part of m.content as { text?: unknown }[]) if (part && typeof part.text === 'string') part.text = fix(part.text);
    }
    if (typeof data.prompt === 'string') data.prompt = fix(data.prompt);
}

/** What the chat shows for a run of text with hidden marks: plain text, each marked word with its marks, and the small words
 * the typesetting adds (a pause's dot, "inhales", "exhales", the line's feeling, laughter's "ha", a cut-off's dash). */
export type Seg = { text: string; marks?: Mark[]; add?: 'pause' | 'micro' | 'inhales' | 'exhales' | 'feeling' | 'ha' | 'cut'; seconds?: number; feeling?: Feeling };
export function typeset(t: string): Seg[] {
    if (!hasHidden(t)) return [{ text: t }];
    const out: Seg[] = [];
    let cursor = 0;
    for (const k of tokens(t)) {
        if (k.start > cursor) out.push({ text: t.slice(cursor, k.start).replace(RUN, '') });
        cursor = k.end;
        const marks = k.codes.map(c => MARK_OF[c]).filter((m): m is Mark => !!m);
        const f = k.codes.find(c => LINE.test(c)), p = k.codes.find(c => /^p/.test(c));
        if (f) out.push({ text: FEELING_LY[f.slice(2) as Feeling] ?? f.slice(2), add: 'feeling', ...f.slice(2) in FEELING_LY ? { feeling: f.slice(2) as Feeling } : {} }, { text: ' ' });
        if (marks.includes('inbreath')) out.push({ text: 'inhales', add: 'inhales' }, { text: ' ' });
        const m = WORD_PARTS.exec(k.word)!;
        if (m[1]) out.push({ text: m[1] });
        out.push({ text: m[2] ?? '', marks: marks.filter(x => x !== 'inbreath' && x !== 'outbreath') });
        if (marks.includes('cut')) out.push({ text: '—', add: 'cut' });
        if (marks.includes('laugh')) out.push({ text: 'ha', add: 'ha' });
        if (m[3]) out.push({ text: m[3] });
        if (marks.includes('outbreath')) out.push({ text: ' ' }, { text: 'exhales', add: 'exhales' });
        if (p) out.push(p === 'p.' ? { text: ' ·', add: 'micro' } : { text: ' —', add: 'pause', seconds: Number(p.slice(1)) });
    }
    if (cursor < t.length) out.push({ text: t.slice(cursor).replace(RUN, '') });
    return out.filter(x => x.text !== '' || x.marks?.length);
}
const FEELING_LY: Record<Feeling, string> = { anger: 'angrily', fear: 'fearfully', happiness: 'happily', sadness: 'sadly', tenderness: 'tenderly' };

/** What Backspace or Delete does next to hidden marks: the letter they follow goes as one character and the marks stay with
 * the word's next letter, or go too when the word is left with no letter. The edit replaces [from, to), a whole letter with
 * its marks (a browser snaps a cut inside it to the whole), by `insert`, the marks alone or nothing; null leaves the key to
 * the browser (which would take one invisible character at a time). */
export function keyDelete(t: string, caret: number, back: boolean): { from: number; to: number; insert: string } | null {
    const isTag = (i: number) => { const c = t.codePointAt(i); return c != null && c >= 0xE0020 && c <= END; };
    // Whether the word (a run without white space, as tokens() reads it) keeps a letter or digit once [a, b) is gone: the
    // marks stay only then, as rewrite() sets a block only on a word with one ("I—", "I…", "«I»" are left with none).
    const keeps = (a: number, b: number) => {
        let s = a, e = b;
        while (s > 0 && !/\s/.test(t[s - 1]!)) s--;
        while (e < t.length && !/\s/.test(t[e]!)) e++;
        return /[\p{L}\p{N}]/u.test(visible(t.slice(s, a) + t.slice(b, e)));
    };
    if (back) {
        let runStart = caret;
        while (runStart >= 2 && isTag(runStart - 2)) runStart -= 2;
        if (runStart === caret) return null;
        const cp = runStart >= 2 && /[\uDC00-\uDFFF]/.test(t[runStart - 1]!) ? 2 : 1, letterStart = runStart - cp;
        if (letterStart < 0) return { from: 0, to: caret, insert: '' };
        return { from: letterStart, to: caret, insert: keeps(letterStart, caret) ? t.slice(runStart, caret) : '' };
    }
    const cp = t.codePointAt(caret);
    if (cp == null) return null;
    const len = cp > 0xFFFF ? 2 : 1;
    let runEnd = caret + len;
    while (isTag(runEnd)) runEnd += 2;
    if (runEnd === caret + len) return null;
    return { from: caret, to: runEnd, insert: keeps(caret, runEnd) ? t.slice(caret + len, runEnd) : '' };
}
