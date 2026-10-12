// Question pass (docs/df-body-engine.md §7.3): before the narrator writes, a second model reads the player's message and the
// scene, asks which outcomes of the coming reply are in doubt, and names the rule tool that decides each; code runs those
// calls and the narrator receives the outcomes in [DECIDED]. Questions answered apart from the draft were answered more
// accurately than inside it (Chain-of-Verification, Dhuliawala et al. 2023: list precision 0.17 → 0.36), and a model that
// has written an outcome defends it (Zhang et al. 2023), so the questions come before the reply. The narrator still calls
// tools itself; a call already made here returns the same result (the turn's decision ledger).
import { turnKey } from './turn.js';
import { REGISTRY, store, storyTime, setStoryTime, scenePosition, setScenePosition, type Args } from './rules-tools.js';
import { parseStoryTime } from './clock.js';
import { knowledgeBlock } from './knowledge.js';
import type { Prop } from './tool-schema.js';
import { loadColex } from './colex.js';
import { loadThings, thingsIn, thingsBlock, setRead, READ, type Found } from './things.js';

// Calls run per turn, at most [ASSUMED]; scene messages shown and their length.
const MAX_CALLS = 8, SCENE_MESSAGES = 8, MESSAGE_CHARS = 1500, TRACKER_CHARS = 4000;
// Enums longer than this are shown as free text; the tool then names the valid values in its reply [ASSUMED].
const ENUM_SHOWN = 40;
const SKIP = new Set(['BodyStatus']);

export const QUESTION_SYSTEM = `You prepare one turn of a roleplay for its narrator. Code decides outcomes with the tools listed below; the narrator then writes what they return.
Read the scene and the player's message. Find each outcome the next reply will need that is in doubt: an action that may fail, a blow that may land, a sound or sight that may be missed, a message that may not be understood, a person whose response is open, time that passes, a fact the scene establishes or a character learns.
Ask only about outcomes this reply must show. An outcome that follows from another one still in doubt (a blow after an order is obeyed, an answer after a call is heard, an animal's next move after a kick lands) goes in "then" as a question; you will get the results of the calls and write its call then.
A player's message that states something the story has not established about their own character (what they are, an item they have, an ability, something they did before, something outside their control happening to them now) → Claim, before the actions that rely on it. A player's message that states the result of their character's action ("I climb the wall", "I knock him out") is an attempt: its outcome is a question. An item that changes hands, is found, made, lost or used up with nothing in doubt in this reply, or that did so in the last narrator message → Transfer. A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. Seasickness or sickness after surgery → Sickness. Time passing → PassTime when the reply covers more than a few minutes (travel, waiting, work, sleep); an action that takes minutes to finish (crossing a river, picking a lock, writing a letter) can be interrupted, so PassTime goes before its outcome. A person the story has not described who acts or speaks in this reply → NewCharacter, once per person. The player's character feels and chooses what the player writes: Appraise and Choose are for the other characters. Dice → RollTheDice for a quantity or a table the scene calls for.
For each, write a question, then the tool call that answers it, with argument values taken from the scene. Use the character names as the scene writes them; "we", "us" and "they" become the names of everyone the scene puts in the group, the person addressed included only when the scene includes them. An action each member of a group does alone (jumping a gap, climbing a wall, swimming across) → one call per person. One call per question; calls run in the order given, so put time passing after the actions it follows.
When STORY STATE has no [TIME] and the scene, the cast or the scenario gives a date or hour, add "time": "1850-03-14 18:40" (or "Day 1 08:00" when only the hour is known). When the scene's position is not yet known and the scene or scenario says where it is, add "at": [latitude, longitude].
First write QUESTIONS: one line per question. Then write the JSON {"calls":[{"tool":"ToolName","args":{...}}],"then":["follow-on question"]}. When nothing is in doubt, write {"calls":[]}.`;

// The second round: follow-on outcomes asked once the first calls have results (decide, look at the result, decide again:
// FLARE, Jiang et al. 2023; ReAct, Yao et al. 2023). At most one extra round per turn.
const FOLLOW_ON = `RESULTS SO FAR
{results}

FOLLOW-ON QUESTIONS
{then}

Write the calls for the follow-on questions these results leave in doubt; a question a result settles or rules out gets no call. Same format: QUESTIONS, then the JSON {"calls":[...]}.`;

/** One line per argument: name, * when required, type or allowed values, description. */
function describe(name: string, p: Prop, required: boolean, depth = 0): string {
    const pad = '  '.repeat(depth + 1), req = required ? '*' : '';
    const doc = p.description ? ` — ${p.description}` : '';
    if (p.type === 'string') {
        const e = p.enum && p.enum.length <= ENUM_SHOWN ? `one of: ${p.enum.join(' | ')}` : 'text';
        return `${pad}${name}${req} (${e})${doc}`;
    }
    if (p.type === 'array') {
        const it = p.items;
        if (it.type === 'object') return [`${pad}${name}${req} (list of objects)${doc}`, ...Object.entries(it.properties).map(([k, q]) => describe(k, q, !!it.required?.includes(k), depth + 1))].join('\n');
        return `${pad}${name}${req} (list of ${it.type === 'string' && it.enum && it.enum.length <= ENUM_SHOWN ? it.enum.join(' | ') : it.type})${doc}`;
    }
    if (p.type === 'object') return [`${pad}${name}${req} (object)${doc}`, ...Object.entries(p.properties).map(([k, q]) => describe(k, q, !!p.required?.includes(k), depth + 1))].join('\n');
    return `${pad}${name}${req} (${p.type})${doc}`;
}

/** The tools as the question model reads them; * marks a required argument. */
export function toolCatalogue(): string {
    return [...REGISTRY.values()].filter(t => !SKIP.has(t.name)).map(t =>
        `${t.name}: ${t.description}\n${Object.entries(t.properties).map(([k, p]) => describe(k, p, t.required.includes(k))).join('\n')}`).join('\n\n');
}

type Call = { tool: string; args: Record<string, unknown> };
type Plan = { calls: Call[]; then: string[]; time?: string; at?: [number, number]; read: Record<string, string>; unsure: Record<string, string[]> };

/** Every call in the model's text, unchecked: the last JSON object holding "calls" that parses. */
export function rawCalls(text: unknown): Call[] {
    return rawPlan(text).calls;
}

/** The last JSON object holding "calls" that parses: its calls, follow-on questions and story time, unchecked. */
export function rawPlan(text: unknown): Plan {
    const s = String(text ?? '');
    const starts = [...s.matchAll(/\{\s*"calls"/g)].map(m => m.index!).reverse();
    for (const at of starts) {
        let depth = 0, end = -1;
        for (let i = at; i < s.length && end < 0; i++) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}' && --depth === 0) end = i;
        }
        if (end < 0) continue;
        try {
            const o = JSON.parse(s.slice(at, end + 1));
            if (!Array.isArray(o.calls)) continue;
            return {
                calls: o.calls.filter((c: unknown): c is Call => !!c && typeof (c as Call).tool === 'string' && typeof (c as Call).args === 'object' && (c as Call).args !== null),
                then: Array.isArray(o.then) ? o.then.filter((q: unknown): q is string => typeof q === 'string' && !!q.trim()) : [],
                time: typeof o.time === 'string' ? o.time : undefined,
                read: strings(o.read, v => typeof v === 'string') as Record<string, string>,
                unsure: strings(o.unsure, v => Array.isArray(v) && v.length >= 2 && v.every(x => typeof x === 'string')) as Record<string, string[]>,
                at: Array.isArray(o.at) && o.at.length === 2 && o.at.every((x: unknown) => typeof x === 'number' && Number.isFinite(x)) && Math.abs(o.at[0]) <= 90 && Math.abs(o.at[1]) <= 180 ? [o.at[0], o.at[1]] : undefined,
            };
        } catch { /* try an earlier object */ }
    }
    return { calls: [], then: [], read: {}, unsure: {} };
}
const strings = (o: unknown, ok: (v: unknown) => boolean) =>
    o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).filter(([, v]) => ok(v))) : {};

/** Who picks between two things that fit equally: the player (a popup in the interface); null leaves the word unread. */
export type Chooser = (phrase: string, options: Found['options']) => Promise<string | null>;

/** The things the model read, kept only when the id is one offered for that phrase; unsure phrases go to the player. */
async function resolveRead(found: Found[], plan: Plan, choose?: Chooser): Promise<typeof READ> {
    const out: typeof READ = [];
    for (const f of found) {
        const pick = (id: string | null | undefined) => f.options.find(o => o.id === id);
        let o = pick(plan.read[f.phrase]);
        const doubt = plan.unsure[f.phrase]?.map(pick).filter((x): x is Found['options'][number] => !!x) ?? [];
        if (!o && doubt.length >= 2) o = choose ? pick(await choose(f.phrase, doubt.slice(0, 2))) : undefined;
        if (o) out.push({ phrase: f.phrase, id: o.id, label: o.label, year: o.year });
    }
    return out;
}

/** Calls to run: unknown tools and calls missing a required argument dropped, at most MAX_CALLS. */
export function parseCalls(text: unknown): Call[] {
    return validCalls(rawCalls(text));
}
function validCalls(calls: Call[]): Call[] {
    return calls.filter(c => { const t = REGISTRY.get(c.tool); return !!t && !SKIP.has(c.tool) && t.required.every(k => c.args[k] !== undefined && c.args[k] !== ''); })
        .slice(0, MAX_CALLS);
}

/** The scene for the question model: the story state (time, place, bodies), [KNOWS], recent messages, the player's last. */
export function questionPrompt(chat: STMessage[], knows: string, tracker = ''): string {
    const recent = chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES)
        .map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const state = tracker.trim() ? `STORY STATE\n${tracker.trim().slice(0, TRACKER_CHARS)}\n\n` : '';
    return `TOOLS\n${toolCatalogue()}\n\n${state}${knows ? `${knows}\n\n` : ''}SCENE (the last message is the player's)\n${recent}`;
}

/**
 * Runs the question pass for a generation whose last message is the player's. A swipe of the same turn reuses the calls
 * asked the first time; the engine state was restored to the turn's start, so the same calls give the same outcomes.
 */
export async function runQuestionPass(chat: STMessage[], send: (system: string, user: string) => Promise<string>, tracker = '', choose?: Chooser): Promise<typeof READ> {
    const ctx = SillyTavern.getContext();
    setRead([]);
    if (!ctx.chatMetadata || !chat.length || !chat[chat.length - 1].is_user || !REGISTRY.size) return [];
    const s = store(), turn = turnKey(ctx.chat);
    const results: { tool: string; result: string }[] = [];
    const runAll = async (list: Call[]) => { for (const c of list) results.push({ tool: c.tool, result: String(await REGISTRY.get(c.tool)!.exec(c.args as Args)) }); };
    let calls: Call[], time: number | null = null;
    if (s.asked?.turn === turn) {
        calls = s.asked.calls; time = s.asked.time ?? null;
        setRead(s.asked.read ?? []);
        if (time !== null && storyTime() === null) setStoryTime(time);
        await runAll(calls);
    }
    else {
        await Promise.all([loadThings(), loadColex()]);
        const found = thingsIn(String(chat[chat.length - 1].mes ?? ''));
        const prompt = [questionPrompt(chat, knowledgeBlock(s.state), tracker), thingsBlock(found)].filter(Boolean).join('\n\n');
        const plan = rawPlan(await send(QUESTION_SYSTEM, prompt));
        setRead(await resolveRead(found, plan, choose));
        time = plan.time && storyTime() === null ? parseStoryTime(plan.time) : null;
        if (time !== null) setStoryTime(time);
        if (plan.at && !scenePosition()) setScenePosition(plan.at[0], plan.at[1]);
        calls = validCalls(plan.calls);
        await runAll(calls);
        if ((plan.then.length || results.some(r => /Call Interpret/.test(r.result))) && calls.length < MAX_CALLS) {
            const follow = FOLLOW_ON.replace('{results}', results.map((x, i) => `${i + 1}. ${x.tool}: ${x.result}`).join('\n') || '(none)')
                .replace('{then}', [...plan.then, ...results.some(r => /Call Interpret/.test(r.result)) ? ['Which meaning does each listener take from the words a result names?'] : []].map(q => `- ${q}`).join('\n'));
            const more = validCalls(rawCalls(await send(QUESTION_SYSTEM, `${prompt}\n\n${follow}`))).slice(0, MAX_CALLS - calls.length);
            await runAll(more);
            calls = [...calls, ...more];
        }
    }
    s.asked = { turn, calls, results, time, read: READ };
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
    console.debug('[Rules engine] question pass', calls, results, READ);
    return READ;
}

/** This turn's question-pass results, for the check pass. */
export function askedResults(): { tool: string; result: string }[] {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return [];
    const a = store().asked;
    return a && a.turn === turnKey(ctx.chat) ? a.results : [];
}

/** The [DECIDED] block for the narrator, '' when the pass decided nothing this turn. */
export function decidedInjection(): string {
    const r = askedResults();
    if (!r.length) return '';
    return `[DECIDED]\nOutcomes the rule engine decided for this reply. Narrate them as given; they stand.\n${r.map(x => `- ${x.tool}: ${x.result}`).join('\n')}\n[/DECIDED]`;
}
