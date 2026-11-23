// The Book tab's chapters (section 199): the chat split where the scene changes, by the same rule as the "Arriving.." and
// "Passing.." screens, each finished scene woven once into prose that keeps its spoken lines. Splitting needs no model call;
// weaving is one call per finished scene, sent with a plain-prose system prompt (Summaryception's finding: a roleplay preset
// under the weave makes the model go on roleplaying).
import { def, peek } from './constants.js';
import { TELLING_RULE } from './narration.js';
def({ id: 'sceneGapMin', value: 60, unit: 'min of story time between two lines that starts a new scene', status: 'assumed', src: 'the "Passing.." screen\'s gap since the box was built; an hour is longer than one conversation\'s pauses [ASSUMED]', range: [30, 120], file: 'book.ts' });
/** Whether the scene changes between two stamps: a new place ("Arriving.."), or the clock moved on by the gap or into a new
 * day ("Passing.."). An unknown place or time on either side changes nothing on that side. */
export function sceneBreak(prev, now) {
    if (now.place && prev.place && now.place !== prev.place)
        return 'arrive';
    if (now.t == null || prev.t == null)
        return null;
    const dt = now.t - prev.t, dayChanged = Math.floor(now.t / 1440) > Math.floor(prev.t / 1440);
    return dt >= peek('sceneGapMin') || (dayChanged && dt > 0) ? 'pass' : null;
}
/** A message's stamp: a player's line keeps one; a reply one per swipe (the swipe shown counts); older lines fall back to the
 * question pass's time, kept for the last 30 messages. */
export function stampOf(m) {
    const s = m.extra?.rulesScene;
    if (s && ('t' in s || 'place' in s))
        return s;
    if (s) {
        const v = s[m.swipe_id ?? 0];
        if (v)
            return v;
    }
    const t = m.is_user ? m.extra?.rulesPass?.time : null;
    return typeof t === 'number' ? { t, place: null } : null;
}
/** The chat as scenes, in order, each from the line where the scene changed to the line before the next change. */
export function scenesOf(chat) {
    const out = [];
    let last = { t: null, place: null }, cur = null;
    chat.forEach((m, i) => {
        if (m.is_system || !String(m.mes ?? '').trim())
            return;
        const st = stampOf(m), br = st ? sceneBreak(last, st) : null;
        if (!cur || br) {
            cur = { n: out.length + 1, from: i, to: i, cause: cur ? br : 'start', place: st?.place ?? last.place, t0: st?.t ?? last.t, t1: st?.t ?? last.t, lines: [], marks: [], live: false };
            out.push(cur);
        }
        cur.to = i;
        cur.lines.push(i);
        if (st?.place) {
            last.place = st.place;
            cur.place ??= st.place;
        }
        if (st?.t != null) {
            last.t = st.t;
            cur.t0 ??= st.t;
            cur.t1 = st.t;
        }
        last = { ...last };
        const keys = m.extra?.rulesKeys?.[m.swipe_id ?? 0] ?? [];
        for (const k of keys)
            cur.marks.push({ at: i, phrase: k.phrase, ...k.tool ? { tool: k.tool } : {} });
    });
    if (out.length)
        out.at(-1).live = true;
    return out;
}
/** A scene's text as the weave reads it, and a short hash of it: a chapter whose turns were edited, swiped or deleted since
 * it was woven no longer matches. */
export function spanText(chat, s, player, clean = t => t) {
    return s.lines.map(i => { const m = chat[i]; return `${m.is_user ? `${player} (the player)` : (m.name || 'Narrator')}: ${clean(String(m.mes ?? '')).trim()}`; }).join('\n');
}
export function hashOf(text) {
    // FNV-1a, 32 bits (Fowler, Noll & Vo): a change detector, not a security hash.
    let h = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}
export const MODE_NAME = { faithful: 'Faithful', novel: 'Novel', condensed: 'Condensed' };
const MODE_RULE = {
    faithful: 'Keep the second person and the present tense of the turns ("You open the door"). Keep every spoken line word for word.',
    novel: 'Write in the third person and the past tense throughout, naming the player\'s character ("{player} opened the door"). Keep every spoken line word for word, in quotation marks, with who says it.',
    condensed: 'Write one paragraph of 60–120 words in the third person and the past tense. Quote at most the two spoken lines that decide something.',
};
/** The weave's system prompt and message: the scene's turns, the chapter before it as what the reader already knows, and the
 * mode's person and tense. Asked back: a title line, the prose, and the scene's open threads. */
export function weavePrompt(mode, player, head, transcript, prior) {
    const system = [
        'You turn one finished scene of a played story into a chapter of a book. You write prose only; you do not continue the story or speak to anyone.',
        `Rules:
- Tell only what the turns show, in their order. Every event, name, number and object comes from the turns.
- Spoken lines (in quotation marks) are the chapter's backbone: keep them.
- Each line of the player is what their character does or says: write it as that action, not as a request.
- ${MODE_RULE[mode].replace('{player}', player)}
- The chapter before is what the reader already knows: tell only what changes in this scene (what is done, decided, found out, who arrives or leaves), and repeat none of its setting.`,
        TELLING_RULE,
        `Answer in this form:
TITLE: a title of 2–6 words
<the chapter's paragraphs>
OPEN: each question the scene leaves open (a promise, a danger, someone expected, a thing not yet found), one per line starting "- "; "OPEN: none" when the scene closes all.`,
    ].join('\n\n');
    const user = `${prior ? `THE CHAPTER BEFORE\n${prior}\n\n` : ''}THIS SCENE (${head})\n${transcript}`;
    return { system, user };
}
/** The weave's answer read back: its title, paragraphs and open threads. Text without the labels is all prose. */
export function readWeave(text) {
    let s = String(text ?? '').replace(/\r/g, '').trim();
    const t = s.match(/^\s*TITLE:\s*(.+)$/m), title = t ? t[1].trim().replace(/^["*]+|["*]+$/g, '') : '';
    if (t)
        s = s.replace(t[0], '');
    const o = s.search(/^\s*OPEN:/m);
    const open = o >= 0 ? s.slice(o) : '', prose = (o >= 0 ? s.slice(0, o) : s).trim();
    const threads = open.replace(/^\s*OPEN:\s*/, '').split('\n').map(l => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(l => l && !/^none\.?$/i.test(l));
    return { title, prose, threads };
}
/** The scene's heading: "Chapter 2 · Recife · 14:00–14:40 · turns 17–30". */
export function sceneHead(s, fmt, title) {
    const when = s.t0 != null ? (s.t1 != null && s.t1 !== s.t0 ? `${fmt(s.t0)} – ${fmt(s.t1)}` : fmt(s.t0)) : '';
    return [`Chapter ${s.n}${title ? `: ${title}` : ''}`, s.place ?? '', when, `turns ${s.from + 1}–${s.to + 1}`].filter(Boolean).join(' · ');
}
/** The woven chapters as one Markdown file, in story order. */
export function bookMarkdown(title, chapters) {
    const parts = [`# ${title}`];
    for (const c of chapters)
        parts.push(`## ${c.title || c.at || 'Chapter'}`, ...c.title && c.at ? [`*${c.at}*`] : [], c.prose.trim());
    return `${parts.join('\n\n')}\n`;
}
/** Unresolved threads across woven chapters, in order, with any threads the player marked resolved left out. */
export function openThreadsOf(chapters) {
    const out = [], seen = new Set();
    for (const c of chapters) {
        const done = new Set(c.done ?? []);
        for (const t of c.threads ?? []) {
            const k = t.trim();
            if (!k || done.has(k) || seen.has(k))
                continue;
            seen.add(k);
            out.push(k);
        }
    }
    return out;
}
/** Story memory built from woven chapters and their unresolved threads, sent to the narrator as [BOOK]. */
export function bookBlock(chapters) {
    const prose = chapters.filter(c => c.prose?.trim()).map(c => {
        const head = [c.title, c.at].filter(Boolean).join(' · ');
        return head ? `${head}\n${c.prose.trim()}` : c.prose.trim();
    });
    const open = openThreadsOf(chapters);
    if (!prose.length && !open.length)
        return '';
    const parts = [...prose, ...open.length ? [`Left open:\n${open.map(t => `- ${t}`).join('\n')}`] : []];
    return `[BOOK]\n${parts.join('\n\n')}\n[/BOOK]`;
}
/** Chat indexes of finished scenes covered by a non-stale woven chapter, for non-destructive prompt ghosting. */
export function ghostIndices(chat, chapters, player, clean = t => t) {
    const out = [];
    for (const sc of scenesOf(chat)) {
        if (sc.live)
            continue;
        const ch = chapters.find(c => c.from === sc.from && c.to === sc.to && !!c.prose?.trim());
        if (!ch || ch.hash !== hashOf(spanText(chat, sc, player, clean)))
            continue;
        for (const i of sc.lines)
            if (i < chat.length - 1)
                out.push(i);
    }
    return out.sort((a, b) => a - b);
}
