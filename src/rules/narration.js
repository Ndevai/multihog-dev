/** The reply's schema for `n` decided results. */
export const narrationSchema = (n) => ({
    type: 'object', additionalProperties: false, required: ['beats', 'open'],
    properties: {
        beats: { type: 'array', minItems: 1, maxItems: 14, items: { type: 'object', additionalProperties: false, required: ['result', 'text'], properties: { result: { type: 'integer', minimum: 0, maximum: Math.max(0, n) }, text: { type: 'string' } } } },
        open: { type: 'array', maxItems: 4, items: { type: 'string' } },
    },
});
/** The narrator's instruction for the structured reply. */
export const NARRATION_RULE = `<reply_form>
Write the reply as the JSON {"beats":[{"result":1,"text":"…"}],"open":["…"]}.
- Each result in [DECIDED] gets a beat with its number; the beat's text tells that outcome in the story's words, in the order it happens.
- A beat with result 0 holds what decides nothing: the place, the weather as [DECIDED] gives it, how people look, what they say that changes nothing.
- The reply's events are the results. Where the scene moves toward something no result decides (a person's reaction, a sound someone may hear, a door that may open), the text stops before it and "open" names it as a question for the next turn.
- The beats' texts, joined in order, read as the whole reply: full paragraphs, third person, past tense.
</reply_form>`;
/** The narration read from the model's JSON, or null when the text is plain prose. */
export function readNarration(text) {
    const s = String(text ?? '').trim(), at = s.indexOf('{'), end = s.lastIndexOf('}');
    if (at < 0 || end <= at)
        return null;
    try {
        const o = JSON.parse(s.slice(at, end + 1));
        if (!Array.isArray(o.beats))
            return null;
        const beats = o.beats.filter((b) => !!b && typeof b.text === 'string' && Number.isInteger(b.result));
        return beats.length ? { beats, open: Array.isArray(o.open) ? o.open.filter((q) => typeof q === 'string' && !!q.trim()) : [] } : null;
    }
    catch {
        return null;
    }
}
/** The prose shown: the beats' texts in order, one paragraph each. */
export const proseOf = (n) => n.beats.map(b => b.text.trim()).filter(Boolean).join('\n\n');
/** The text the rule check reads: the beats that tell no result. */
export const unbackedText = (n) => n.beats.filter(b => b.result === 0).map(b => b.text.trim()).join('\n\n');
