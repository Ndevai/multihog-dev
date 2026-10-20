// Structured narration (docs/progress.md 2026-10-19 (32)): the narrator writes the reply as beats, each tied to the number of
// the [DECIDED] result it tells, or to 0 for what decides nothing (the place, the weather, people's looks and talk), and ends
// with the open questions the scene moves toward. Code joins the beats into the prose shown. The rule check then reads only
// the 0 beats, where an outcome no result decides could slip in, and the open questions go to the next turn's planner, so an
// outcome the narrator would have written becomes one the engine decides. The reverse of reading events back out of prose:
// the narrator says which result each passage tells, under constrained decoding (plan-schema.ts).
export interface Beat { result: number; text: string }
export interface Narration { beats: Beat[]; open?: string[] }

/** The reply's schema for `n` decided results. */
export const narrationSchema = (n: number) => ({
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
export function readNarration(text: unknown): Narration | null {
    const s = String(text ?? '').trim(), at = s.indexOf('{'), end = s.lastIndexOf('}');
    if (at < 0 || end <= at) return null;
    try {
        const o = JSON.parse(s.slice(at, end + 1));
        if (!Array.isArray(o.beats)) return null;
        const beats = o.beats.filter((b: unknown): b is Beat => !!b && typeof (b as Beat).text === 'string' && Number.isInteger((b as Beat).result));
        return beats.length ? { beats, open: Array.isArray(o.open) ? o.open.filter((q: unknown): q is string => typeof q === 'string' && !!q.trim()) : [] } : null;
    } catch { return null; }
}
/** The prose shown: the beats' texts in order, one paragraph each. */
export const proseOf = (n: Narration) => n.beats.map(b => b.text.trim()).filter(Boolean).join('\n\n');
/** The text the rule check reads: every beat. A beat tied to a result can still tell more than it (a story run tied a broken
 *  heel to a fall whose result said the bones held), so tying a beat to a result is no proof it matches. */
export const checkedText = proseOf;
