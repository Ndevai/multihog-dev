// Speech as it sounds: the marks a player puts on their line (by hand or with the mark bar under the input box, src/ui.ts)
// read in code, so how a line is said is exact rather than guessed from its words. The marks are conversation analysis's
// (Gail Jefferson's transcription conventions, as in the CA appendices after Atkinson & Heritage 1984): (.) a micropause of
// under 0.2 s, (0.5) a timed pause in seconds, ↑ ↓ a marked shift of pitch up or down, CAPITALS louder than the speaker's
// surrounding talk, °…° distinctly quieter, a colon a prolonged sound (wo::rd), a hyphen an abrupt cut-off (Sto-), hhh an
// audible out-breath and .hhh an in-breath, (h) laughter within a word, faster and slower stretches, smile voice, ((…)) a
// description. Two are written otherwise so that SillyTavern keeps them: ☺…☺ for smile voice (the Danish conventions' sign;
// $ and £ are currencies) and the IPA's ˈ before a stressed word (underlining does not survive plain text; * and _ already
// mean actions and italics). Faster and slower come from the toolbar alone (voice-code.ts): typed › ‹ are quotation marks
// (German, Swiss and French inner quotes), as Jefferson's > < would be HTML tags.
// Voice quality is VoQS's (Ball, Esling & Dickson 1995, JIPA): {V̤ … V̤} breathy, {V̰ … V̰} creaky, {W … W} whisper,
// {F … F} falsetto. A feeling is a description, ((angry)): one of the five a meta-analysis measured listeners hearing.
//
// Text without marks reads as before: ordinary colons, hyphens, numbers, currency, single parentheses, guillemets, and words
// in capitals that are no common word (abbreviations, names) stay as they are.
import { isWord } from './lexicon.js';
import { QUOTED, OPENS, CLOSES } from './quotes.js';
/** Words a ((…)) description may give for each feeling of Juslin & Laukka's five (2003, Psychol Bull 129:770). */
const FEELING_WORDS = [
    ['anger', /^(anger|angry|angrily|furious|furiously|mad|irritated|irritably|annoyed)$/],
    ['fear', /^(fear|fearful|fearfully|afraid|scared|frightened|terrified|nervous|nervously)$/],
    ['happiness', /^(happiness|happy|happily|joy|joyful|joyfully|cheerful|cheerfully|glad|gladly|delighted)$/],
    ['sadness', /^(sadness|sad|sadly|sorrowful|sorrowfully|grieving|mournful|mournfully)$/],
    ['tenderness', /^(tenderness|tender|tenderly|loving|lovingly|affectionate|affectionately|fond|fondly|gentle|gently)$/],
];
export const feelingOf = (w) => FEELING_WORDS.find(([, re]) => re.test(w.trim().toLowerCase()))?.[0];
// Capitals that are abbreviations, not loudness [ASSUMED list]: an abbreviation missing from it reads as loud, and the note
// under the line shows it.
const ABBREVIATIONS = new Set(['I', 'OK', 'TV', 'UK', 'US', 'USA', 'EU', 'UN', 'FBI', 'CIA', 'KGB', 'NASA', 'ID', 'AM', 'PM', 'AD', 'BC', 'CEO', 'DNA', 'GPS', 'PC', 'MP', 'DJ', 'VIP', 'RSVP', 'ASAP',
    'II', 'III', 'IV', 'VI', 'VII', 'VIII', 'IX', 'XI', 'XII', 'HQ', 'POW', 'MIA', 'SOS', 'MD', 'PhD', 'RAF', 'SS', 'NCO', 'AWOL', 'LOL', 'OMG',
    // Letters the lexicon also holds as a word no one says louder (la, dc, hr, pr, er, aids, sim): AIDS and SIM are dictionary
    // nouns written in capitals (Merriam-Webster, "AIDS" noun; "SIM card", variant "SIM").
    'LA', 'DC', 'HR', 'PR', 'ER', 'AIDS', 'SIM']);
// Abbreviations that are nouns written in capitals and also spell a verb said louder ("PIN him!", "SWAT it!", "He LED them!"):
// after a determiner or a possessive they name the thing ("my PIN", "the SWAT team", "an LED lamp") (Oxford Learner's
// Dictionaries, "PIN" noun, personal identification number; Merriam-Webster, "SWAT" noun, often attributive, and "LED" noun).
const NOUN_ABBREVIATIONS = new Set(['PIN', 'SWAT', 'LED']);
// Pronouns do not permit determiners ("*the they": CGEL ch. 5 §10.2, p. 429), and a conjunction or an auxiliary heads no noun
// phrase, so capitals spelling one after a determiner are an abbreviation ("the WHO", "the IT desk", "the OR"), not that word
// said louder; without a determiner they read as louder ("WHO did this?", "Get IT away!").
const DETERMINER = /^(?:the|a|an|this|that|these|those|my|your|his|her|its|our|their)$/i;
const NO_NOUN = /^(?:it|who|whom|or|nor|we|me|him|them|they|he|she|am|is|are|was|were|of)$/;
// Voice quality spans, VoQS: opener and closer tokens.
const VOQS = [['breathy', '{V̤', 'V̤}'], ['creaky', '{V̰', 'V̰}'], ['whisper', '{W', 'W}'], ['falsetto', '{F', 'F}']];
const GLUED_OPENER = new RegExp(`^(.*[\\p{L}\\p{N}].*[—–…])(${VOQS.map(([, o]) => o.replace('{', '\\{')).join('|')})$`, 'u');
// Spans marked by a character at a word's start and end: quieter, smile voice.
const LEAD = { '°': 'quiet', '☺': 'smile' };
const TRAIL = { '°': 'quiet', '☺': 'smile' };
/** The marks on a line: each word with its marks and the pause after it, the feeling a ((…)) names, other ((…))
 * descriptions, and the line without its marks (for reading its verbs and names). */
export function readProsody(line, names = []) {
    // The story's people, by the words of their names: a name in capitals is louder and still a name ("I SHOUT AT WILL").
    const nameWords = new Set(names.flatMap(n => n.toLowerCase().split(/\s+/)).filter(w => w && w !== 'the'));
    const notes = [];
    let feeling;
    // ((…)): a feeling, or a description kept as a note.
    let text = line.replace(/\(\(\s*([^()]+?)\s*\)\)/g, (_, d) => { const f = feelingOf(d); if (f && !feeling)
        feeling = f;
    else
        notes.push(d); return ' '; });
    const words = [], open = new Set();
    let pendingIn = false, marked = !!feeling || notes.length > 0, quote = '';
    // A word a dash or an ellipsis joins to a VoQS opener is a word of its own ('"Wait—{W not now W}"').
    const raws = text.split(/\s+/).filter(Boolean).flatMap(r => { const m = GLUED_OPENER.exec(r); return m ? [m[1], m[2]] : [r]; });
    for (const [i, raw] of raws.entries()) {
        // Pauses and breaths stand alone, after or before a word. A timed pause is written in seconds with its decimal point,
        // (0.5), (2.0); a whole number in brackets is ordinary writing ("Tom (35)", "the year (1850)", "items (1) and (2)").
        const pause = /^\((\d*\.\d+|\.)\)([,.;:!?]*)$/.exec(raw);
        if (pause) {
            const last = words.at(-1);
            if (last) {
                last.pause = (last.pause ?? 0) + (pause[1] === '.' ? 0.1 : Number(pause[1]));
                last.word += pause[2] ?? '';
            }
            marked = true;
            continue;
        }
        if (/^[.·]h{2,}$/i.test(raw)) {
            pendingIn = true;
            marked = true;
            continue;
        }
        if (/^h{2,}[,.;:!?]*$/i.test(raw)) {
            words.at(-1)?.marks.push('outbreath');
            marked = true;
            continue;
        }
        // VoQS braces stand apart from the words, each label written apart from what it brackets ("{3V! ... 3V!}" in the
        // examples of Wikipedia, Voice Quality Symbols: "{WhelloW}" is no span, as "{Fred}" is none); quotation marks,
        // brackets, dashes and ellipses may cling to them ("{W meet me W}", '({W …', '—{W … W}—').
        const vo = /^([(\["“'‘—–…]*)(.+)$/.exec(raw), voqsOpen = VOQS.find(([, o]) => vo[2] === o);
        if (voqsOpen) {
            open.add(voqsOpen[0]);
            quote += vo[1];
            marked = true;
            continue;
        }
        const vc = /^(.+?)([,.;:!?"”'’)\]—–…]*)$/.exec(raw), voqsClose = VOQS.find(([, , c]) => vc[1] === c);
        if (voqsClose) {
            open.delete(voqsClose[0]);
            const last = words.at(-1);
            if (last)
                last.word += vc[2] ?? '';
            marked = true;
            continue;
        }
        let w = quote + raw;
        quote = '';
        const marks = new Set(), closing = [];
        // Leading signs (after an opening quotation mark or bracket): span openers, pitch, stress.
        const lead = /^["“‘'(\[]*/.exec(w)[0];
        w = w.slice(lead.length);
        for (;;) {
            const c = w.charAt(0);
            // A degree sign before C, F or K is a temperature's unit ("20 °C"), no quieter span.
            if (LEAD[c] && w.length > 1 && !(c === '°' && /^°[CFK](?!\p{L})/u.test(w))) {
                open.add(LEAD[c]);
                w = w.slice(1);
                marked = true;
                continue;
            }
            if (c === '↑' || c === '↓') {
                marks.add(c === '↑' ? 'up' : 'down');
                w = w.slice(1);
                marked = true;
                continue;
            }
            if (c === 'ˈ') {
                marks.add('stress');
                w = w.slice(1);
                marked = true;
                continue;
            }
            break;
        }
        w = lead + w;
        // Trailing signs (before or after the punctuation): span closers.
        for (;;) {
            const m = /^(.*?)([°☺])([,.;:!?"”'’)\]]*)$/.exec(w);
            if (!m || !m[1] || !TRAIL[m[2]])
                break;
            // A closer closes only a span this word or an earlier one opened ("30°" is a temperature).
            const k = TRAIL[m[2]];
            if (!open.has(k))
                break;
            closing.push(k);
            w = m[1] + (m[3] ?? '');
            marked = true;
        }
        // Within the word: laughter, stretched sounds, a cut-off, loudness.
        if (/\(h+\)/i.test(w)) {
            marks.add('laugh');
            w = w.replace(/\(h+\)/gi, '');
            marked = true;
        }
        // A drawn-out sound is two colons or more (wo::rd); one colon between letters is ordinary writing (Re:Zero).
        if (/\p{L}:{2,}/u.test(w)) {
            marks.add('stretch');
            w = w.replace(/(\p{L}):{2,}/gu, '$1');
            marked = true;
        }
        // A word left hanging by a hyphen is cut off, unless it shares its ending with a hyphened word after "and", "or" or
        // "to" ("pre- and post-war", "two- or three-year-olds"). A colon after the hyphen is a face drawn in letters (D-:), not
        // the end of a clause; a closing quotation mark or bracket ends the word as the line's end does ("›War-‹", "(wai-)").
        if (/\p{L}-[,.;!?"”'’›‹»«)\]]*$/u.test(w) && !(/^(?:and|or|nor|to)$/i.test(raws[i + 1] ?? '') && /\p{L}-\p{L}/u.test(raws[i + 2] ?? ''))) {
            marks.add('cut');
            marked = true;
        }
        // Capitals are louder on a common word (STOP, NOOOO) and stay as written on an abbreviation or a name (NATO, ICU).
        const letters = w.replace(/[^\p{L}]/gu, ''), spelled = w.replace(/[^\p{L}'’]/gu, '');
        const named = DETERMINER.test(words.at(-1)?.word.replace(/^["“‘'(]+/, '') ?? '') && (NO_NOUN.test(letters.toLowerCase()) || NOUN_ABBREVIATIONS.has(letters));
        if (letters.length >= 2 && letters === letters.toUpperCase() && letters !== letters.toLowerCase() && !ABBREVIATIONS.has(letters) && !named && (isWord(spelled) || isWord(letters))) {
            marks.add('loud');
            marked = true;
            // Lower case for reading, the first letter kept where a sentence starts.
            const starts = !words.length || new RegExp(`[.!?](?:${CLOSES}|')?$`).test(words.at(-1).word) || new RegExp(`^${OPENS.source}`).test(w);
            w = w.replace(/\p{L}+/gu, s => s.toLowerCase());
            if (starts || nameWords.has(letters.toLowerCase()))
                w = w.replace(/\p{L}/u, c => c.toUpperCase());
        }
        if (pendingIn) {
            marks.add('inbreath');
            pendingIn = false;
        }
        for (const k of open)
            marks.add(k);
        for (const k of closing) {
            marks.add(k);
            open.delete(k);
        }
        words.push({ word: w, marks: [...marks] });
    }
    // A plain line keeps its own spacing; a marked one is rejoined from its words.
    const plain = marked ? words.map(x => x.word).join(' ') : line;
    return { plain, words, ...feeling ? { feeling } : {}, notes, marked };
}
/** The words in quotes (quotes.ts: "…", „…“, «…», ›…‹ and the rest), when the line quotes its speech; else every word. A
 *  quote left open runs to the line's end. */
function spoken(p) {
    const text = p.words.map(w => w.word).join(' '), spans = [...text.matchAll(QUOTED)].map(m => [m.index, m.index + m[0].length]);
    const open = text.replace(QUOTED, q => ' '.repeat(q.length)).search(OPENS);
    if (open >= 0)
        spans.push([open, text.length]);
    if (!spans.length)
        return p.words;
    const out = [];
    let at = 0;
    for (const w of p.words) {
        const end = at + w.word.length;
        if (spans.some(([a, b]) => at < b && end > a))
            out.push(w);
        at = end + 1;
    }
    return out.length ? out : p.words;
}
/** The vocal effort the marks fix for the player's speech (Communicate's effort), or null when they fix none: every spoken word
 * whispered ({W … W}): whisper; every spoken word louder (capitals): loud; some words louder: raised [ASSUMED mapping].
 * Jefferson's capitals are louder than the speaker's surrounding talk; a whole line louder is taken as a loud voice, a word
 * or two as a raised one. */
export function effortOf(p) {
    const ws = spoken(p).filter(w => /\p{L}/u.test(w.word));
    if (!ws.length)
        return null;
    if (ws.every(w => w.marks.includes('whisper')))
        return 'whisper';
    if (ws.every(w => w.marks.includes('loud')))
        return 'loud';
    if (ws.some(w => w.marks.includes('loud')))
        return 'raised';
    return null;
}
const SAY = { stress: 'stressed', stretch: 'drawn out', up: 'pitch up on', down: 'pitch down on', loud: 'louder', quiet: 'quieter', fast: 'faster', slow: 'slower',
    breathy: 'breathy', creaky: 'creaky', whisper: 'whispered', falsetto: 'in falsetto', smile: 'smiling', laugh: 'laughing through', inbreath: 'a breath in before', outbreath: 'a breath out after', cut: 'cut off' };
const ORDER = ['loud', 'quiet', 'whisper', 'up', 'down', 'stress', 'stretch', 'fast', 'slow', 'breathy', 'creaky', 'falsetto', 'smile', 'laugh', 'inbreath', 'outbreath', 'cut'];
const bare = (w) => w.replace(/^["“'(]+|[,.;:!?"”')]+$/g, '');
/** The delivery in the fewest words, for the note and the narrator: each mark with the words it covers, in runs, then the
 * pauses ("louder: Stop · pause 0.5 s after me · pitch up on think · slower: literally"). */
export function deliveryOf(p) {
    const parts = [];
    if (p.feeling)
        parts.push(`feeling: ${p.feeling}`);
    // A word with both pitch marks carries one tune, named by their order (rise-fall: up first; fall-rise: down first); its
    // shape is said, not a meaning, so the context decides what it does.
    const both = (w) => w.marks.includes('up') && w.marks.includes('down');
    const tune = (w) => w.marks.indexOf('up') < w.marks.indexOf('down') ? 'rise-fall' : 'fall-rise';
    const has = (w, k) => w.marks.includes(k) && !((k === 'up' || k === 'down') && both(w));
    for (const k of ORDER) {
        const runs = [];
        p.words.forEach((w, i) => { if (!has(w, k))
            return; if (i > 0 && has(p.words[i - 1], k) && runs.length)
            runs.at(-1).push(bare(w.word));
        else
            runs.push([bare(w.word)]); });
        if (runs.length)
            parts.push(`${SAY[k]}${/ (on|before|after|through)$/.test(SAY[k]) ? ' ' : ': '}${runs.map(r => r.join(' ')).join(', ')}`);
        if (k === 'down')
            for (const t of ['rise-fall', 'fall-rise']) {
                const ws = p.words.filter(w => both(w) && tune(w) === t).map(w => bare(w.word));
                if (ws.length)
                    parts.push(`${t} on ${ws.join(', ')}`);
            }
    }
    p.words.forEach(w => { if (w.pause)
        parts.push(`${w.pause < 0.2 ? 'short pause' : `pause ${w.pause} s`} after ${bare(w.word)}`); });
    for (const n of p.notes)
        parts.push(n);
    return parts.join(' · ');
}
// Listeners' accuracy in hearing each feeling in a voice: Juslin & Laukka 2003 (Psychol Bull 129:770), Table 4, unweighted
// mean pi (Rosenthal & Rubin's proportion index: .50 is chance, 1.00 perfect on a two-way choice), within one culture and
// across cultures (overall .90 and .84; tenderness across cultures rests on one study). Weighted means: anger .91/.90,
// happiness .83/.74, tenderness .83/.71, the rest as here.
export const VOCAL_PI = { anger: [0.93, 0.91], fear: [0.88, 0.82], happiness: [0.87, 0.74], sadness: [0.93, 0.91], tenderness: [0.82, 0.71] };
/** The share of listeners choosing among the five feelings who hear the one meant: pi converted to k = 5 alternatives,
 * p = pi / ((k − 1) − pi (k − 2)) (Rosenthal & Rubin 1989's pi = p (k − 1) / (1 + p (k − 2)), solved for p). */
export function heardRight(f, sameCulture, k = 5) {
    const pi = VOCAL_PI[f][sameCulture ? 0 : 1];
    return pi / ((k - 1) - pi * (k - 2));
}
export const FEELINGS = Object.keys(VOCAL_PI);
