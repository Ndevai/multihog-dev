// The path of a shot span (the player's pick, 2026-11-13): words selected in the chat return the chain of records that
// produced them, each step one relation that exists, told through the player's character, whom the box tells the story
// through. Each step is a record the engine kept: a decided result with its call (the line's question pass: its arguments
// and draws), a said line and its speaker, a fact with the source its knower learned it from (knowledge.ts; the sources are
// Aikhenvald's 2004 evidentials: seen, sensed, inferred, assumed, told, hearsay), and the story's clock for words of light
// and time. The steps name what the records hold; the path ends where they end.
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (t) => new Set(norm(t).split(' ').filter(w => w.length >= 3));
/** The relation a sense tool's result gives the one it decides for. */
const TOOL_REL = { Listen: 'heard', Look: 'saw', Communicate: 'told' };
/** A fact's source (knowledge.ts, rules-tools.ts KNOWN_HOW and the tools' own) as a relation and who it names. */
export function relOfSource(how) {
    const h = String(how ?? '').trim();
    let m;
    if (/^saw it/.test(h))
        return { rel: 'saw' };
    if (/^heard, smelled or felt/.test(h))
        return { rel: 'sensed' };
    if (/^inferred/.test(h))
        return { rel: 'worked out' };
    if (/^assumed/.test(h))
        return { rel: 'assumed' };
    if ((m = /^told by (.+)$/.exec(h)))
        return m[1] === 'someone' ? { rel: 'told' } : { rel: 'told', by: m[1] };
    if ((m = /^overheard (.+)$/.exec(h)))
        return { rel: 'overheard', by: m[1] };
    if (/^hearsay/.test(h))
        return { rel: 'hearsay' };
    if (/^found out/.test(h))
        return { rel: 'found out' };
    if (/^their own/.test(h))
        return { rel: 'their own' };
    if (/^remembers/.test(h))
        return { rel: 'remembers' };
    return { rel: 'knows' };
}
/** A call's arguments as measures: each named in plain words with its unit; the fact a call reveals is its own step. */
export function measuresOf(args, draws) {
    const out = Object.entries(args ?? {}).filter(([k, v]) => k !== 'reveals' && v != null && v !== '').map(([k, v]) => {
        const unit = /_m$/.test(k) ? ' m' : /_db$/.test(k) ? ' dB' : /_hz$/.test(k) ? ' Hz' : /_s$/.test(k) ? ' s' : '';
        const name = k.replace(/_(m|db|hz|s)$/, '').replace(/_/g, ' ');
        return `${name}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}${unit}`;
    });
    if (draws?.length)
        out.push(`chance: drawn ${draws.map(d => d.toFixed(2)).join(', ')} (of 0 to 1)`);
    return out;
}
/** Whether the shot words and a phrase share a stretch: one holds the other, or they share a word of three letters or more. */
const touches = (span, phrase) => {
    const a = norm(span), b = norm(phrase);
    if (!a || !b)
        return false;
    if (a.includes(b) || b.includes(a))
        return true;
    const w = words(phrase);
    return [...words(span)].some(x => w.has(x));
};
/** The fact the words state: of the facts the player's character holds, the one sharing the most words with the sentence,
 * at 60 % or more of the larger set (rules-tools.ts recordedFact's measure), or holding every word of the shot span. */
function factOf(input) {
    const p = norm(input.player), s = words(input.sentence), span = words(input.span);
    let best = null;
    for (const f of input.facts ?? []) {
        if (!f.everyone && !f.knowers.some(k => norm(k) === p))
            continue;
        const v = words(f.text), both = [...s].filter(x => v.has(x)).length, score = both / Math.max(s.size, v.size, 1);
        const holds = span.size > 0 && [...span].every(x => v.has(x));
        if ((score >= 0.6 || holds) && (!best || score > best.score))
            best = { f, score };
    }
    return best?.f ?? null;
}
/** Words of light and of the hour, whose setting the story's clock holds. */
const CLOCK_WORDS = /\b(sun|suns|sunlight|sunny|noon|midday|midnight|dawn|dusk|twilight|night|nights|dark|darkness|moon|moonlight|lamp|lamps|lantern|lanterns|candle|candles|evening|morning|afternoon|daylight|shadow|shadows|stars|starlight)\b/i;
/** The path of the shot words: the decided result they name, with its call; the said line they stand in; the fact they state;
 * else the narrator's words, with the clock for words of light and time. */
export function pathOf(input) {
    const steps = [], story = input.story ?? ((r) => r), pass = input.pass;
    // A key word: the decided result it names, and its call's measures.
    const key = (input.keys ?? []).find(k => touches(input.span, k.phrase));
    if (key) {
        const i = pass?.results.findIndex(r => (!key.tool || r.tool === key.tool) && story(r.result) === key.result) ?? -1;
        const tool = key.tool ?? (i >= 0 ? pass.results[i].tool : '');
        steps.push({ rel: TOOL_REL[tool] ?? 'decided', text: key.result, note: tool && !TOOL_REL[tool] ? tool : undefined, measures: i >= 0 ? measuresOf(pass.calls[i]?.args, pass.results[i].draws) : undefined });
        return steps;
    }
    // Said words: their speaker; a Communicate call that carried them to the player's character gives its measures.
    if (input.said) {
        const p = norm(input.player), own = norm(input.said) === p;
        const i = own ? -1 : pass?.calls.findIndex(c => c.tool === 'Communicate' && norm(c.args.speaker) === norm(input.said) && norm(c.args.listener) === p) ?? -1;
        steps.push(own ? { rel: 'said', text: `${input.player} says it` } : i >= 0
            ? { rel: 'told', text: `${input.said} told ${input.player}`, note: story(pass.results[i].result), measures: measuresOf(pass.calls[i].args, pass.results[i].draws) }
            : { rel: 'said', text: `${input.said} says it` });
        return steps;
    }
    // A fact the player's character holds: how they learned it, from whom, and when.
    const f = factOf(input);
    if (f) {
        const p = Object.keys(f.from ?? {}).find(k => k === norm(input.player)), src = p ? relOfSource(f.from[p]) : null, at = f.at?.[norm(input.player)];
        const when = at != null && input.when ? input.when(at) : undefined;
        steps.push(src ? { rel: src.rel, text: f.text, note: [src.by, when].filter(Boolean).join(', ') || undefined } : { rel: f.everyone ? 'everyone knows' : 'knows', text: f.text, note: when });
        return steps;
    }
    // The narrator's words, and the story's clock for words of light and time.
    steps.push({ rel: 'written', text: 'the narrator\'s words' });
    if (input.clock && (CLOCK_WORDS.test(input.span) || CLOCK_WORDS.test(input.sentence)))
        steps.push({ rel: 'clock', text: `${input.clock.when}${input.clock.place ? ` in ${input.clock.place}` : ''}${input.clock.sky ? `: ${input.clock.sky}` : ''}` });
    return steps;
}
/** The sentence of `text` that holds the character at `at` (sentence ends . ! ? … and the line's ends). */
export function sentenceAt(text, at) {
    const ends = /[.!?…]+["”’)]*\s+/g;
    let start = 0, m;
    while ((m = ends.exec(text))) {
        if (m.index + m[0].length > at)
            return text.slice(start, m.index + m[0].length).trim();
        start = m.index + m[0].length;
    }
    return text.slice(start).trim();
}
