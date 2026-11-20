// The text box's rules (index.ts showBox; docs/df-body-engine.md, "The text box"). Free of SillyTavern and of the page, so tests
// run them on plain strings: who each stretch of a message belongs to, where a long stretch goes on in the next box, when each
// letter of a stretch appears, how long AUTO waits, and which words of a reply name what the engine decided.
//
// The reference (the player's, 2026-11-11: Danganronpa) sets "white text denoting that it's spoken aloud, blue text being internal
// dialogue, and all textboxes having the name of the current speaker" (Anderson 2022, "Interactive Fiction – UI Elements and
// Narrative in Danganronpa v3"); its narration is the main character's first-person thought, in the same blue (Let's Play
// Archive, Trigger Happy Havoc prologue: blue text "are the Main Character's inner thoughts", the narration among them), and
// "yellow text are important words or phrases the game calls out". The player chose no narrator, so here too every stretch
// that is not said belongs to the player's character.
import { def, peek } from './constants.js';
import './voice.js';
import { GIVEN_NAMES } from './data/given-names.js';
import { isWord, stems } from './lexicon.js';
import { nameSex } from './frame.js';
import { PREPOSITION, AUXILIARY, NOMINATIVE, noun } from './grammar.js';
import { QUOTED } from './quotes.js';

// Silent reading of English fiction: 260 words per minute, non-fiction 238 (Brysbaert 2019, J Mem Lang 109:104047, a
// meta-analysis of 190 studies). Text that is not said has no sound to time it by, so it appears at the reader's own pace.
def({ id: 'boxReadWpm', value: 260, unit: 'words per minute, silent reading of fiction', status: 'sourced', src: 'adult silent reading in English: fiction 260, non-fiction 238 words per minute (Brysbaert 2019, J Mem Lang 109:104047)', file: 'box.ts' });
// The box's height in lines: a stretch longer than this goes on in the next box. The reference's boxes hold one to two lines
// in the player's screenshots; four keeps a sentence of ordinary length whole on a phone (a judgement, registered below).
// A key word's weight when it is a noun, against 1 for another word of the result: the thing decided is mostly a thing or a
// body part, so a run with a noun wins a tie of words.
def({ id: 'boxKeyNounWeight', value: 1.5, unit: '× the weight of a matching word that is no noun', status: 'assumed', src: 'a noun names the thing decided; any value above 1 breaks a tie of matching words toward it', range: [1.1, 2], file: 'box.ts' });
def({ id: 'boxLines', value: 4, unit: 'lines of text in the box', status: 'assumed', src: "the reference's boxes hold 1–2 lines (the player's screenshots); 4 keeps an ordinary sentence whole at 412 px", range: [3, 6], file: 'box.ts' });

// The box's type size. Print is read at full speed down to the critical print size, an x-height of about 0.2° for normal
// vision, and at the same speed up to 2° (Legge & Bigelow 2011, J Vis 11(5):8). Phones are held 17.5–58 cm from the eyes for
// a text message, 36.2 cm on average (Bababekova, Rosenfield, Hue & Huang 2011, Optom Vis Sci 88:795, 129 people). One CSS
// pixel of a phone is 0.160 mm [ASSUMED: a 6.3-inch 1080 × 2400 screen at 416 ppi shown at a device pixel ratio of 2.625,
// 412 CSS pixels across]. So an x-height of 0.2° for the farthest reader, 580 mm × tan 0.2° = 2.02 mm, is 12.7 CSS pixels;
// SillyTavern's own text (Noto Sans, x 0.547 em of 15 px) is 8.2, 0.2° only to 38 cm. The box keeps the player's size when
// larger. The box, with room to spare on a phone, takes the floor; the log keeps the player's size.
def({ id: 'boxCriticalPrintDeg', value: 0.2, unit: '° of x-height, the smallest print read at full speed', status: 'sourced', src: 'critical print size of normal vision (Legge & Bigelow 2011)', file: 'box.ts' });
def({ id: 'boxFarReadCm', value: 58, unit: 'cm from the eyes, the farthest a phone was held to read', status: 'sourced', src: 'text messages, 129 people: 17.5–58 cm, mean 36.2 (Bababekova et al. 2011)', file: 'box.ts' });
def({ id: 'cssPxMm', value: 0.160, unit: 'mm per CSS pixel on a phone', status: 'assumed', src: 'a 6.3-inch 1080 × 2400 screen at 416 ppi, device pixel ratio 2.625', range: [0.14, 0.18], file: 'box.ts' });
/** The x-height (CSS px) that gives the farthest phone reader the critical print size. */
export const boxMinXPx = () => peek('boxFarReadCm') * 10 * Math.tan(peek('boxCriticalPrintDeg') * Math.PI / 180) / peek('cssPxMm');
/** The box's font size (CSS px) for a face whose x-height is `xRatio` of its size: the page's, or the floor above. */
export const boxFontPx = (pagePx: number, xRatio = 0.46) => Math.max(pagePx, boxMinXPx() / xRatio);
/** The box's lines at that size: boxLines lines of the page's size hold as many letters as this many of the box's (a line's
 * letters go as 1 ÷ the size), so a box carries what it carried before. */
export const boxLinesAt = (pagePx: number, boxPx: number) => Math.max(peek('boxLines'), Math.round(peek('boxLines') * boxPx / pagePx));
/** The scene as a badge's three lines: the clock, the date, and where with its light (the story clock's "Sunday 15 July 1990,
 * 18:20" or "Day 2, 07:00" split at its last comma). */
export function sceneBadge(place: string | null | undefined, time: string | null | undefined, light: string | null | undefined): { clock: string; date: string; where: string } {
    const t = String(time ?? ''), at = t.lastIndexOf(', ');
    return { clock: at < 0 ? t : t.slice(at + 2), date: at < 0 ? '' : t.slice(0, at), where: [place, light].filter((x): x is string => !!x && !!x.trim()).join(' · ') };
}
/** The first-meeting card's line under the name: the person's trade as the story gave it, else their age and what the words for
 * them fix ("17-year-old girl"), else nothing. */
export function cardRole(p: { occupation?: string; age?: number; sex?: string } | undefined): string {
    if (!p) return '';
    if (p.occupation) return p.occupation;
    if (p.age == null) return '';
    const noun = p.age < 18 ? (p.sex === 'female' ? 'girl' : p.sex === 'male' ? 'boy' : 'child') : p.sex === 'female' ? 'woman' : p.sex === 'male' ? 'man' : 'adult';
    return `${Math.floor(p.age)}-year-old ${noun}`;
}
/** Whether `who` spoke before message `at` of the whole chat, not only the part SillyTavern draws (by default its last 100
 * messages): a message of theirs, or a quotation the reply named as theirs (readReply's speakers, the swipe shown). The
 * first-meeting card needs it: the first of their lines drawn on the page is their first in the chat only when no earlier
 * message holds one. */
export function metBefore(chat: { is_user?: boolean; name?: string; swipe_id?: number; extra?: Record<string, unknown> }[], at: number, who: string): boolean {
    for (let i = 0; i < Math.min(at, chat.length); i++) {
        const m = chat[i]!;
        if (!m.is_user && m.name === who) return true;
        if ((m.extra?.rulesSpeakers as Record<number, { who: string }[]> | undefined)?.[m.swipe_id ?? 0]?.some(s => s.who === who)) return true;
    }
    return false;
}
/** The scene above the box, as a visual novel's background tells it: where, when, and the light there (the engine's place,
 * story clock and sky; any of them left out when unknown). */
export const sceneLine = (place: string | null | undefined, time: string | null | undefined, light: string | null | undefined) =>
    [place, time, light].filter((x): x is string => !!x && !!x.trim()).join(' · ');

// ------------------------------------------------------------------------------------------------------------- speakers
/** One stretch of a paragraph: said (quoted words) or not, its text, and for a said stretch the name the reply wrote before
 * it ([Mara] "No."), if any. */
export interface Stretch { said: boolean; text: string; tag?: string | null }
/** Who a message can name: the player's character, the message's author (for the player's own line, the same), the cast by
 * name (the player's character, the character cards in the chat). */
export interface Cast { player: string; author: string; names: string[] }

// The closed word classes (CGEL ch. 5, 7, 3: pronouns, determinatives, prepositions, coordinators and subordinators,
// auxiliaries), which never name a person, and the deictic adverbs a sentence can open with. A capitalised word outside them
// names a person when it is a given name (Social Security Administration, as frame.ts reads them) or no common English
// word (lexicon.ts, SCOWL): "Tom", "Kyoko" are names; "Silence", "Nothing", "Below" are not.
const CLOSED = /^(?:the|a|an|this|that|these|those|my|your|his|her|its|our|their|some|any|no|every|each|all|both|either|neither|another|other|such|what|which|whose|who|whom|me|him|us|them|it|itself|myself|yourself|himself|herself|ourselves|themselves|one|nothing|nobody|someone|somebody|something|everyone|everybody|everything|anyone|anybody|anything|none|and|but|or|nor|so|yet|if|when|whenever|while|as|because|though|although|unless|since|once|whether|then|now|there|here|still|just|only|even|also|too|again|soon|later|finally|suddenly|instead|meanwhile|perhaps|maybe|not|never|always|yes|oh|ah|well)$/i;
const closed = (w: string) => CLOSED.test(w) || PREPOSITION.test(w) || AUXILIARY.test(w) || NOMINATIVE.test(w);
/** A front adverb: a closed word, or an -ly adverb ("Slowly, Tom stands"). */
const front = (w: string) => closed(w) || /^[A-Za-z]{3,}ly$/.test(w);
const capital = (w: string) => /^\p{Lu}[\p{Ll}'’-]/u.test(w);
/** Whether a capitalised word names a person. */
export const personName = (w: string) => capital(w) && !closed(w) && (GIVEN_NAMES[w.toLowerCase()] != null || !isWord(w));
/** A given name that is also a closed word (Will, May, Can) names a person where the closed word cannot stand: inside a
 * sentence, or opening one before a finite verb ("Will does not look up", "Will has been counting"); a question opening on
 * the auxiliary has its subject next ("Will you come?"). */
const nameAt = (ws: string[], i: number, sentenceStart: boolean) => personName(ws[i]!) || (capital(ws[i]!) && GIVEN_NAMES[ws[i]!.toLowerCase()] != null
    && (!sentenceStart || (!!ws[i + 1] && !NOMINATIVE.test(ws[i + 1]!) && (AUXILIARY.test(ws[i + 1]!) || /^\p{Ll}+(?:s|ed)$/u.test(ws[i + 1]!)))));

// A title before a name is part of it ("Mrs Pike", "Dr Ward"): the plate reads the two words, not the title alone. A title
// with no capitalised word after it is left to the rules below (a common word, "Mother sighs", names no one).
const TITLE = /^(?:Mr|Mrs|Miss|Ms|Mx|Dr|Sir|Dame|Lady|Lord|Madam|Madame|Master|Mistress|Rev|Reverend|Father|Mother|Sister|Brother|Uncle|Aunt|Captain|Inspector|Sergeant|Constable|Professor|Old|Young)\.?$/;
const titled = (ws: string[], i: number) => TITLE.test(ws[i]!) && !!ws[i + 1] && capital(ws[i + 1]!) && !closed(ws[i + 1]!) ? `${ws[i]} ${ws[i + 1]}` : null;
const SENTENCE_END = /[.!?…]+["”’)\]*_]*(?:\s+|$)/g;
const words = (t: string) => [...t.matchAll(/[\p{L}\p{N}'’-]+/gu)].map(m => m[0]);

/** The person a stretch's last sentence is about: its subject, the first name or nominative pronoun among its first three
 * words, read past front adverbs ("Then Tom looks up", "Slowly she turns"; CGEL ch. 4 §3.1: the subject stands just before
 * the verb, adjuncts in front of it). A pronoun is the player's character for I, we and you (the box's main character), and
 * for he, she or they the person last named whose given name's sex does not differ (frame.ts nameSex); null when none is
 * named, or when the sentence opens on a noun phrase ("The old man coughs"). */
export function subjectOf(sentence: string, names: Map<string, string>, player: string, named: string[]): string | null {
    const ws = words(sentence).map(w => w.replace(/['’]s$/, ''));
    for (let i = 0; i < Math.min(3, ws.length); i++) {
        const w = ws[i]!;
        if (NOMINATIVE.test(w)) {
            const p = w.toLowerCase().replace(/['’].*$/, '');
            if (p === 'i' || p === 'we' || p === 'you') return player;
            const want = p === 'he' ? 'male' : p === 'she' ? 'female' : null;
            for (let j = named.length - 1; j >= 0; j--) { const n = named[j]!, s = nameSex(n.split(' ')[0]!); if (n !== player && (!want || !s || s === want)) return n; }
            return null;
        }
        const t = titled(ws, i);
        if (t) return names.get(t) ?? [...names.values()].find(n => n.endsWith(` ${ws[i + 1]}`) || n === t) ?? t;
        if (capital(w) && (names.has(w) || nameAt(ws, i, i === 0))) return names.get(w) ?? w;
        // An article opens a noun phrase that names someone without a name ("The old guard says"): its words up to the verb
        // (a word in -s or -ed after the first) or a closed word, three at most, so the plate reads "The old guard".
        if (/^(?:the|a|an|this|that)$/i.test(w)) {
            const np: string[] = [];
            for (const x of ws.slice(i + 1, i + 4)) { if (closed(x) || (np.length && /(?:s|ed)$/.test(x))) break; np.push(x.toLowerCase()); }
            return np.length ? `${w[0]!.toUpperCase()}${w.slice(1).toLowerCase()} ${np.join(' ')}` : null;
        }
        if (!front(w)) return null;
    }
    return null;
}

/** Who each stretch of a message belongs to, paragraph by paragraph. IF the reply wrote the speaker's name before a quotation
 * → THEN that name. IF the quotation runs on into a speech tag (it ends on a comma, or the words after it open in lower case:
 * "No," Mara says / "No!" she says) → THEN the tag's subject. ELSE the subject of the last sentence before it in its paragraph
 * (Tom looks up. "Sit."), ELSE the speaker of the quotation before it in the paragraph, ELSE the message's author. A stretch
 * that is not said belongs to the player's character: the box has no narrator (the player's pick, 2026-11-11), as the
 * reference's narration is its main character's. `named` carries the people named so far (the chat's earlier messages), for
 * a pronoun. */
export function speakersOf(paragraphs: Stretch[][], cast: Cast, named: string[] = []): string[][] {
    const names = new Map<string, string>();
    for (const n of [...cast.names, cast.player, cast.author]) for (const w of words(n)) if (capital(w) && !closed(w)) names.set(w, n);
    const note = (text: string) => {
        for (const sentence of text.split(SENTENCE_END)) {
            const ws = words(sentence).map(x => x.replace(/['’]s$/, ''));
            ws.forEach((w, i) => { const t = titled(ws, i); if (t) named.push(names.get(t) ?? t); else if (capital(w) && !(i > 0 && titled(ws, i - 1)) && (names.has(w) || nameAt(ws, i, i === 0))) named.push(names.get(w) ?? w); });
        }
    };
    return paragraphs.map(p => {
        let lastSaid: string | null = null;
        return p.map((s, i) => {
            if (!s.said) { note(s.text.replace(QUOTED, ' ')); return cast.player; }
            const after = p[i + 1], before = p[i - 1];
            const runsOn = !!after && !after.said && (/[,—–-]\s*["”’»›]*\s*$/.test(s.text) || /^\s*[,—–-]?\s*\p{Ll}/u.test(after.text));
            const who = s.tag?.trim() || (runsOn ? subjectOf(after!.text.replace(/^[\s,—–-]+/, ''), names, cast.player, named) : null)
                || (before && !before.said ? subjectOf(before.text.trim().split(SENTENCE_END).filter(x => x.trim()).pop() ?? '', names, cast.player, named) : null)
                || lastSaid || cast.author;
            if (who !== cast.player) named.push(who);
            lastSaid = who;
            return who;
        });
    });
}

/** The names a reply wrote before its quotations ([Mara] "No.", as SPEAKER_RULE asks), each with the quotation it stands
 * before, and the reply without them. A bracket stands for a name only directly before an opening quotation mark. */
export function takeSpeakers(text: string): { text: string; said: { q: string; who: string }[] } {
    const marker = /\[([^[\]\n]{1,40})\][ \t]*(?=["“„«‹])/g, at: { pos: number; who: string }[] = [];
    let out = '', last = 0;
    for (const m of text.matchAll(marker)) { out += text.slice(last, m.index); at.push({ pos: out.length, who: m[1]!.trim() }); last = m.index! + m[0].length; }
    out += text.slice(last);
    const said = [...out.matchAll(QUOTED)].flatMap(m => { const a = at.find(x => x.pos === m.index); return a ? [{ q: m[0], who: a.who }] : []; });
    return { text: out, said };
}
/** The narrator's instruction while the box is on: the name before each quotation, so the box's plate names who says it. */
export const SPEAKER_RULE = `<speakers>
Before each quotation, write the name of the one who says it in square brackets, as in: Tom looks up. [Tom] "Sit." Code takes the brackets out before the reply is shown, so the sentences around them read as ordinary prose.
</speakers>`;

// ------------------------------------------------------------------------------------------------------------- the box
/** Where a long stretch is cut so each piece fits the box: after a sentence's end, each piece `budget` characters or fewer
 * where a sentence's end allows it (a sentence longer than the budget stays whole). Offsets into the text, in order. */
export function cutsOf(text: string, budget: number): number[] {
    const ends = [...text.matchAll(SENTENCE_END)].map(m => m.index! + m[0].length).filter(e => e < text.trimEnd().length);
    const cuts: number[] = [];
    for (let start = 0; text.length - start > budget;) {
        const fit = ends.filter(e => e > start && e - start <= budget), next = fit.at(-1) ?? ends.find(e => e > start);
        if (next == null) break;
        cuts.push(next); start = next;
    }
    return cuts;
}

/** A word's syllables, by a stated count (vowel letters, not a dictionary's syllables): its groups of vowel letters (y among
 * them), less a final silent e (one at least for a word with a letter); a number, one per digit. */
export function syllables(word: string): number {
    const w = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (/^\d+$/.test(w)) return w.length;
    if (!w) return 0;
    let n = (w.match(/[aeiouy]+/g) ?? []).length;
    if (n > 1 && /[^aeiouyl]e$/.test(w)) n--;
    return Math.max(1, n);
}
/** When each letter of a stretch appears, ms from its start (one entry per UTF-16 unit of the text). Said words appear at the
 * speaker's own speaking rate (voice.ts voiceSyllablesPerS, × `rate` for a marked tempo), each word's letters spread over its
 * syllables; text that is not said appears at the reader's silent-reading rate (boxReadWpm), one word at a time. What lies
 * between two words appears with the word before it. */
// Speech stops between words where the text marks a boundary. Silent pauses in read speech fall in two groups, brief ones
// near 100 ms and medium ones near 500 ms (Campione & Véronis 2002, five languages, about 6000 pauses; Goldman et al. 2010;
// as Godde et al. 2022 sum them up), and their length follows the boundary's rank: against a paragraph's, a sentence's is
// about 0.6 and a clause's about 0.2 (Strangert 1991, ICPhS 12, ten readers of Swedish news). A sentence end (. ! ?) takes the
// medium pause, 500 ms; a clause or phrase mark (, ; : — –) 0.2 ÷ 0.6 of it, 167 ms. Slower speakers pause longer (Strangert
// 1991): the pause goes with the speaker's own pace, as their syllables do [ASSUMED: in the same proportion].
def({ id: 'boxSentencePauseMs', value: 500, unit: 'ms of silence after a sentence in speech, at the unmarked rate', status: 'sourced', src: 'the medium mode of pauses in read speech, near 500 ms (Campione & Véronis 2002)', file: 'box.ts' });
def({ id: 'boxClauseShare', value: 1 / 3, unit: "a clause boundary's pause ÷ a sentence's", status: 'sourced', src: 'Strangert 1991: clause 0.2 and sentence 0.6 of the paragraph pause', file: 'box.ts' });
/** The silence (ms) the text between two words marks in speech: a sentence end, a clause mark, or none. */
export function pauseMs(between: string, rate = 1): number {
    const sentence = peek('boxSentencePauseMs') / rate;
    return /[.!?…]/.test(between) ? sentence : /[,;:—–]/.test(between) ? sentence * peek('boxClauseShare') : 0;
}
export function revealTimes(text: string, said: boolean, rate = 1): number[] {
    const out = new Array<number>(text.length).fill(0);
    let t = 0, prevEnd = 0;
    for (const m of text.matchAll(/[\p{L}\p{N}'’-]+/gu)) {
        const start = m.index!, len = m[0].length;
        for (let i = prevEnd; i < start; i++) out[i] = t;
        if (said && prevEnd > 0) t += pauseMs(text.slice(prevEnd, start), rate);
        const dur = said ? 1000 * syllables(m[0]) / (peek('voiceSyllablesPerS') * rate) : 60000 / peek('boxReadWpm');
        for (let i = 0; i < len; i++) out[start + i] = t + dur * (i + 1) / len;
        t += dur; prevEnd = start + len;
    }
    for (let i = prevEnd; i < text.length; i++) out[i] = t;
    return out;
}
/** How long AUTO waits after a stretch has appeared: what reading it takes beyond its appearing (silent reading, boxReadWpm),
 * and one word's reading more, as the reader's eyes follow the newest word. */
export function autoWait(text: string, appearMs: number): number {
    const perWord = 60000 / peek('boxReadWpm');
    return Math.max(0, words(text).length * perWord - appearMs) + perWord;
}

/** The word on the plate's right, beside the speaker's name, for the stretch shown: what the colour does not already say. A
 * said stretch is "speaking", or "whispering" when its words carry the whisper's mark (no voicing: a different act of the
 * larynx, voice.ts phonation); a stretch not said is "thinking" when the engine made a WorkOut call for the line, and has no
 * word when it is a description. AUTO, while the box moves on by itself, stands beside it. */
export type SlotWord = 'speaking' | 'whispering' | 'thinking' | 'auto';
export function slotOf(o: { said: boolean; whispered: boolean; thinking: boolean; auto: boolean }): SlotWord[] {
    const word: SlotWord | null = o.said ? (o.whispered ? 'whispering' : 'speaking') : o.thinking ? 'thinking' : null;
    return [...word ? [word] : [], ...o.auto ? ['auto' as const] : []];
}

// ------------------------------------------------------------------------------------------------------------- key words
const content = (w: string) => !closed(w) && /\p{L}{3,}|\p{N}/u.test(w);
const same = (a: string, b: string) => { const x = new Set(stems(a.toLowerCase())); return stems(b.toLowerCase()).some(s => x.has(s)); };
/** The words of a reply that name what one decided result says, as the reference sets important words in yellow: the longest
 * run of the reply's words that are content words of the result (one of its words in any inflection: "heel bone" for "the
 * right heel bone breaks"), nouns weighing more, joined by at most two closed words ("riddle on the door"), people's names left out (they are in
 * every result). The result's bracketed gloss (the kind of problem) is no story word. Null when the reply names none. */
export function keyPhrase(result: string, reply: string, people: string[]): string | null {
    const gist = result.replace(/\([^)]*\)/g, ' ');
    const want = words(gist).filter(w => content(w) && !personName(w) && !people.some(p => words(p).includes(w)));
    if (!want.length) return null;
    const toks = [...reply.matchAll(/[\p{L}\p{N}'’-]+|[^\s\p{L}\p{N}]/gu)].map(m => ({ w: m[0], at: m.index! }));
    // A run's weight: its matching words, a noun (WordNet) counting boxKeyNounWeight, as the thing decided is mostly a thing or
    // a body part ("the whisper" before "hears"); equal weights, the longer run.
    const weight = (w: string) => noun(w) ? peek('boxKeyNounWeight') : 1;
    let best: { from: number; to: number; score: number; len: number } | null = null;
    for (let i = 0; i < toks.length; i++) {
        if (!content(toks[i]!.w) || !want.some(w => same(w, toks[i]!.w))) continue;
        let j = i, score = weight(toks[i]!.w);
        for (let k = i + 1, gap = 0; k < toks.length && gap <= 2; k++) {
            const w = toks[k]!.w;
            if (content(w) && want.some(x => same(x, w))) { j = k; score += weight(w); gap = 0; }
            else if (/^[\p{L}'’-]+$/u.test(w) && closed(w)) gap++;
            else break;
        }
        const len = toks[j]!.at + toks[j]!.w.length - toks[i]!.at;
        if (!best || score > best.score || (score === best.score && len > best.len)) best = { from: i, to: j, score, len };
        i = j;
    }
    return best ? reply.slice(toks[best.from]!.at, toks[best.to]!.at + toks[best.to]!.w.length) : null;
}
/** The night tag's smallest size (CSS px) for a face whose capitals stand `capShare` of its size: the tag is set in capitals,
 * so its letters' height is the capitals', held at the critical print size (boxMinXPx): 16.0 px for Baskerville (0.79) to
 * 19.2 px for Georgia (0.66), the caps measured in Chromium (history/review-tests/browser/voice-look). */
export const tagFloorPx = (capShare: number) => boxMinXPx() / capShare;
/** A held word's explanation as [name, detail] pairs, for the box's menu line: a marked word's title lists its marks
 * ("louder (about 6 dB above your normal voice), slower (about 0.8 times your own pace)", ui.ts), each its name and size. */
export const explainParts = (title: string): [string, string][] =>
    title.split(/,\s*(?![^()]*\))/).map(p => p.trim()).filter(Boolean).map(p => { const m = /^(.*?)\s*\((.*)\)$/.exec(p); return m ? [m[1]!, m[2]!] : [p, '']; });

const HIGH_FREQ_CONSONANTS = /^[bcdfghjklmnpqrstvwxyz]$/i;
/** Masks high-frequency consonants proportionally to (1 - sii) when speech is partially muffled (0.15 <= sii < 0.75). */
export function muffleSpeech(text: string, sii: number): string {
    if (sii >= 0.75) return text;
    if (sii < 0.15) return text.replace(/\p{L}+/gu, w => '·'.repeat(Math.min(w.length, 4)));
    return text.replace(/\p{L}+/gu, (word, offset: number) => {
        if (word.length <= 2) return word;
        return [...word].map((ch, i) => {
            if (!HIGH_FREQ_CONSONANTS.test(ch)) return ch;
            const slot = ((offset + i * 7) % 10) / 10;
            return slot >= sii ? '·' : ch;
        }).join('');
    });
}
