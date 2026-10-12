// Question pass (docs/df-body-engine.md §7.3): before the narrator writes, a second model reads the player's message and the
// scene, asks which outcomes of the coming reply are in doubt, and names the rule tool that decides each; code runs those
// calls and the narrator receives the outcomes in [DECIDED]. Questions answered apart from the draft were answered more
// accurately than inside it (Chain-of-Verification, Dhuliawala et al. 2023: list precision 0.17 → 0.36), and a model that
// has written an outcome defends it (Zhang et al. 2023), so the questions come before the reply. The narrator still calls
// tools itself; a call already made here returns the same result (the turn's decision ledger).
import { turnKey } from './turn.js';
import { REGISTRY, store, storyTime, setStoryTime } from './rules-tools.js';
import { parseStoryTime } from './clock.js';
import { knowledgeBlock } from './knowledge.js';
// Calls run per turn, at most [ASSUMED]; scene messages shown and their length.
const MAX_CALLS = 8, SCENE_MESSAGES = 8, MESSAGE_CHARS = 1500, TRACKER_CHARS = 4000;
// Enums longer than this are shown as free text; the tool then names the valid values in its reply [ASSUMED].
const ENUM_SHOWN = 40;
const SKIP = new Set(['BodyStatus']);
export const QUESTION_SYSTEM = `You prepare one turn of a roleplay for its narrator. Code decides outcomes with the tools listed below; the narrator then writes what they return.
Read the scene and the player's message. Find each outcome the next reply will need that is in doubt: an action that may fail, a blow that may land, a sound or sight that may be missed, a message that may not be understood, a person whose response is open, time that passes, a fact the scene establishes or a character learns.
Ask only about outcomes this reply must show. An outcome that follows from another one still in doubt (a blow after an order is obeyed, an answer after a call is heard, an animal's next move after a kick lands) goes in "then" as a question; you will get the results of the calls and write its call then.
A player's message that states something the story has not established about their own character (what they are, an item they have, something they can do or did) → Claim, before the actions that rely on it. An item that changes hands, is found, made, lost or used up with nothing in doubt in this reply, or that did so in the last narrator message → Transfer. A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. Seasickness or sickness after surgery → Sickness. Time passing → PassTime when the reply covers more than a few minutes (travel, waiting, work, sleep). A person the story has not described who acts or speaks in this reply → NewCharacter, once per person. The player's character feels and chooses what the player writes: Appraise and Choose are for the other characters. Dice → RollTheDice for a quantity or a table the scene calls for.
For each, write a question, then the tool call that answers it, with argument values taken from the scene. Use the character names as the scene writes them. One call per question; calls run in the order given, so put time passing after the actions it follows.
When STORY STATE has no [TIME] and the scene, the cast or the scenario gives a date or hour, add "time": "1850-03-14 18:40" (or "Day 1 08:00" when only the hour is known).
First write QUESTIONS: one line per question. Then write the JSON {"calls":[{"tool":"ToolName","args":{...}}],"then":["follow-on question"]}. When nothing is in doubt, write {"calls":[]}.`;
// The second round: follow-on outcomes asked once the first calls have results (decide, look at the result, decide again:
// FLARE, Jiang et al. 2023; ReAct, Yao et al. 2023). At most one extra round per turn.
const FOLLOW_ON = `RESULTS SO FAR
{results}

FOLLOW-ON QUESTIONS
{then}

Write the calls for the follow-on questions these results leave in doubt; a question a result settles or rules out gets no call. Same format: QUESTIONS, then the JSON {"calls":[...]}.`;
/** One line per argument: name, * when required, type or allowed values, description. */
function describe(name, p, required, depth = 0) {
    const pad = '  '.repeat(depth + 1), req = required ? '*' : '';
    const doc = p.description ? ` — ${p.description}` : '';
    if (p.type === 'string') {
        const e = p.enum && p.enum.length <= ENUM_SHOWN ? `one of: ${p.enum.join(' | ')}` : 'text';
        return `${pad}${name}${req} (${e})${doc}`;
    }
    if (p.type === 'array') {
        const it = p.items;
        if (it.type === 'object')
            return [`${pad}${name}${req} (list of objects)${doc}`, ...Object.entries(it.properties).map(([k, q]) => describe(k, q, !!it.required?.includes(k), depth + 1))].join('\n');
        return `${pad}${name}${req} (list of ${it.type === 'string' && it.enum && it.enum.length <= ENUM_SHOWN ? it.enum.join(' | ') : it.type})${doc}`;
    }
    if (p.type === 'object')
        return [`${pad}${name}${req} (object)${doc}`, ...Object.entries(p.properties).map(([k, q]) => describe(k, q, !!p.required?.includes(k), depth + 1))].join('\n');
    return `${pad}${name}${req} (${p.type})${doc}`;
}
/** The tools as the question model reads them; * marks a required argument. */
export function toolCatalogue() {
    return [...REGISTRY.values()].filter(t => !SKIP.has(t.name)).map(t => `${t.name}: ${t.description}\n${Object.entries(t.properties).map(([k, p]) => describe(k, p, t.required.includes(k))).join('\n')}`).join('\n\n');
}
/** Every call in the model's text, unchecked: the last JSON object holding "calls" that parses. */
export function rawCalls(text) {
    return rawPlan(text).calls;
}
/** The last JSON object holding "calls" that parses: its calls, follow-on questions and story time, unchecked. */
export function rawPlan(text) {
    const s = String(text ?? '');
    const starts = [...s.matchAll(/\{\s*"calls"/g)].map(m => m.index).reverse();
    for (const at of starts) {
        let depth = 0, end = -1;
        for (let i = at; i < s.length && end < 0; i++) {
            if (s[i] === '{')
                depth++;
            else if (s[i] === '}' && --depth === 0)
                end = i;
        }
        if (end < 0)
            continue;
        try {
            const o = JSON.parse(s.slice(at, end + 1));
            if (!Array.isArray(o.calls))
                continue;
            return {
                calls: o.calls.filter((c) => !!c && typeof c.tool === 'string' && typeof c.args === 'object' && c.args !== null),
                then: Array.isArray(o.then) ? o.then.filter((q) => typeof q === 'string' && !!q.trim()) : [],
                time: typeof o.time === 'string' ? o.time : undefined,
            };
        }
        catch { /* try an earlier object */ }
    }
    return { calls: [], then: [] };
}
/** Calls to run: unknown tools and calls missing a required argument dropped, at most MAX_CALLS. */
export function parseCalls(text) {
    return validCalls(rawCalls(text));
}
function validCalls(calls) {
    return calls.filter(c => { const t = REGISTRY.get(c.tool); return !!t && !SKIP.has(c.tool) && t.required.every(k => c.args[k] !== undefined && c.args[k] !== ''); })
        .slice(0, MAX_CALLS);
}
/** The scene for the question model: the story state (time, place, bodies), [KNOWS], recent messages, the player's last. */
export function questionPrompt(chat, knows, tracker = '') {
    const recent = chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES)
        .map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const state = tracker.trim() ? `STORY STATE\n${tracker.trim().slice(0, TRACKER_CHARS)}\n\n` : '';
    return `TOOLS\n${toolCatalogue()}\n\n${state}${knows ? `${knows}\n\n` : ''}SCENE (the last message is the player's)\n${recent}`;
}
/**
 * Runs the question pass for a generation whose last message is the player's. A swipe of the same turn reuses the calls
 * asked the first time; the engine state was restored to the turn's start, so the same calls give the same outcomes.
 */
export async function runQuestionPass(chat, send, tracker = '') {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata || !chat.length || !chat[chat.length - 1].is_user || !REGISTRY.size)
        return;
    const s = store(), turn = turnKey(ctx.chat);
    const results = [];
    const runAll = async (list) => { for (const c of list)
        results.push({ tool: c.tool, result: String(await REGISTRY.get(c.tool).exec(c.args)) }); };
    let calls, time = null;
    if (s.asked?.turn === turn) {
        calls = s.asked.calls;
        time = s.asked.time ?? null;
        if (time !== null && storyTime() === null)
            setStoryTime(time);
        await runAll(calls);
    }
    else {
        const prompt = questionPrompt(chat, knowledgeBlock(s.state), tracker);
        const plan = rawPlan(await send(QUESTION_SYSTEM, prompt));
        time = plan.time && storyTime() === null ? parseStoryTime(plan.time) : null;
        if (time !== null)
            setStoryTime(time);
        calls = validCalls(plan.calls);
        await runAll(calls);
        if (plan.then.length && calls.length < MAX_CALLS) {
            const follow = FOLLOW_ON.replace('{results}', results.map((x, i) => `${i + 1}. ${x.tool}: ${x.result}`).join('\n') || '(none)')
                .replace('{then}', plan.then.map(q => `- ${q}`).join('\n'));
            const more = validCalls(rawCalls(await send(QUESTION_SYSTEM, `${prompt}\n\n${follow}`))).slice(0, MAX_CALLS - calls.length);
            await runAll(more);
            calls = [...calls, ...more];
        }
    }
    s.asked = { turn, calls, results, time };
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
    console.debug('[Rules engine] question pass', calls, results);
}
/** This turn's question-pass results, for the check pass. */
export function askedResults() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return [];
    const a = store().asked;
    return a && a.turn === turnKey(ctx.chat) ? a.results : [];
}
/** The [DECIDED] block for the narrator, '' when the pass decided nothing this turn. */
export function decidedInjection() {
    const r = askedResults();
    if (!r.length)
        return '';
    return `[DECIDED]\nOutcomes the rule engine decided for this reply. Narrate them as given; they stand.\n${r.map(x => `- ${x.tool}: ${x.result}`).join('\n')}\n[/DECIDED]`;
}
