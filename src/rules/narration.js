/** The reply's schema for `n` decided results: the setting in one bounded passage, then one passage per result, each
 *  required and each written once, then the open questions. Across today's twelve runs, two thirds of the faults left were
 *  events the narrator wrote with no result behind them (a sound heard, a coin paid, a fall), and every one sat in prose the
 *  schema left unbounded. Here the only free passage is the setting, held to a few sentences; an event has a place to be
 *  written only under the result that decides it, or as an open question. */
export const SCENE_CHARS = 420;
export const narrationSchema = (n) => ({
    type: 'object', additionalProperties: false, required: ['scene', 'results', 'open'],
    properties: {
        scene: { type: 'string', maxLength: SCENE_CHARS },
        results: { type: 'object', additionalProperties: false, required: Array.from({ length: n }, (_, i) => String(i + 1)), properties: Object.fromEntries(Array.from({ length: n }, (_, i) => [String(i + 1), { type: 'string' }])) },
        open: { type: 'array', maxItems: 4, items: { type: 'string' } },
    },
});
/** The narrator's instruction for the structured reply. */
export const NARRATION_RULE = `<reply_form>
Write the reply as the JSON {"scene":"…","results":{"1":"…","2":"…"},"open":["…"]}.
- "scene": the place, the light and the weather as [DECIDED] gives them, in two or three sentences.
- "results": for each numbered result in [DECIDED], the passage that tells that outcome in the story's words; the passages run in the order the events happen. People's looks and words that change nothing go in the passage they belong to.
- The reply's events are the results. Where the scene moves toward something no result decides (a person's reaction, a sound someone may hear, a payment, a door that may open), the passage ends before it and "open" names it as a question for the next turn; the next turn decides it.
- The scene and the passages, joined in order, read as the whole reply: full paragraphs, third person, past tense.
</reply_form>`;
/** The narration read from the model's JSON, or null when the text is plain prose. */
export function readNarration(text) {
    const s = String(text ?? '').trim(), at = s.indexOf('{'), end = s.lastIndexOf('}');
    if (at < 0)
        return null;
    // A reply cut off by its length limit, or with a broken character, is not valid JSON; its finished passages are read
    // one by one, so the player sees prose instead of raw JSON.
    const salvage = () => {
        if (!/^\s*\{\s*"(?:scene|results|beats)"/.test(s.slice(at)))
            return null;
        const beats = [...s.slice(at).matchAll(/"(scene|\d+|text)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m, i) => { try {
            return { result: m[1] === 'scene' ? 0 : /^\d+$/.test(m[1]) ? Number(m[1]) : i, text: JSON.parse(`"${m[2]}"`) };
        }
        catch {
            return null;
        } }).filter((b) => !!b && !!b.text.trim());
        return beats.length ? { beats, open: [] } : null;
    };
    if (end <= at)
        return salvage();
    try {
        const o = JSON.parse(s.slice(at, end + 1));
        // The scene-and-results form: the scene is beat 0, each result's passage the beat with its number.
        if (!Array.isArray(o.beats) && o.results && typeof o.results === 'object')
            o.beats = [
                ...typeof o.scene === 'string' && o.scene.trim() ? [{ result: 0, text: o.scene }] : [],
                ...Object.entries(o.results).filter(([k, v]) => /^\d+$/.test(k) && typeof v === 'string').sort((x, y) => Number(x[0]) - Number(y[0])).map(([k, v]) => ({ result: Number(k), text: v }))
            ];
        if (!Array.isArray(o.beats))
            return null;
        const beats = o.beats.filter((b) => !!b && typeof b.text === 'string' && Number.isInteger(b.result));
        return beats.length ? { beats, open: Array.isArray(o.open) ? o.open.filter((q) => typeof q === 'string' && !!q.trim()) : [] } : null;
    }
    catch {
        return salvage();
    }
}
/** The prose shown: the beats' texts in order, one paragraph each. */
export const proseOf = (n) => n.beats.map(b => b.text.trim()).filter(Boolean).join('\n\n');
/** The text the rule check reads: every beat. A beat tied to a result can still tell more than it (a story run tied a broken
 *  heel to a fall whose result said the bones held), so tying a beat to a result is no proof it matches. */
export const checkedText = proseOf;
