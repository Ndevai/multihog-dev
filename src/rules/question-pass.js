// Question pass (docs/df-body-engine.md §7.3): before the narrator writes, a second model reads the player's message and the
// scene, asks which outcomes of the coming reply are in doubt, and names the rule tool that decides each; code runs those
// calls and the narrator receives the outcomes in [DECIDED]. Questions answered apart from the draft were answered more
// accurately than inside it (Chain-of-Verification, Dhuliawala et al. 2023: list precision 0.17 → 0.36), and a model that
// has written an outcome defends it (Zhang et al. 2023), so the questions come before the reply. The narrator still calls
// tools itself; a call already made here returns the same result (the turn's decision ledger).
import { turnKey } from './turn.js';
import { MAGIC_TOOLS, REGISTRY, LAST_DRAWS, clearDraws, store, storyTime, setStoryTime, scenePosition, setScenePosition } from './rules-tools.js';
import { parseStoryTime } from './clock.js';
import { worldHasMagic } from './world.js';
import { knowledgeBlock } from './knowledge.js';
import { loadColex } from './colex.js';
import { loadLanguageYears } from './languages.js';
import { loadChat } from './history.js';
import { loadPopulation } from './population.js';
import { loadThings, thingsIn, thingsBlock, setRead, READ } from './things.js';
// Calls run per turn, at most [ASSUMED]; scene messages shown and their length.
const MAX_CALLS = 8, SCENE_MESSAGES = 8, MESSAGE_CHARS = 1500, TRACKER_CHARS = 4000;
// Enums longer than this are shown as free text; the tool then names the valid values in its reply [ASSUMED].
const ENUM_SHOWN = 40;
const SKIP_ALWAYS = new Set(['BodyStatus']);
/** Tools the question model is not shown: BodyStatus always, magic tools in a world without magic. */
const SKIP = { has: (n) => SKIP_ALWAYS.has(n) || (MAGIC_TOOLS.has(n) && !worldHasMagic()) };
export const QUESTION_SYSTEM = `You prepare one turn of a roleplay for its narrator. Code decides outcomes with the tools listed below; the narrator then writes what they return.
Read the scene and the player's message. Find each outcome the next reply will need that is in doubt: an action that may fail, a blow that may land, a sound or sight that may be missed, a message that may not be understood, a person whose response is open, time that passes, a fact the scene establishes or a character learns.
Ask only about outcomes this reply must show. An outcome that follows from another one still in doubt (a blow after an order is obeyed, an answer after a call is heard, an animal's next move after a kick lands) goes in "then" as a question; you will get the results of the calls and write its call then.
A player's message that states something the story has not established about their own character (what they are, an item they have, an ability, something they did before, something outside their control happening to them now, something they know) → Claim, before the actions that rely on it. A sight or sound that would teach a fact (a secret overheard, a face recognized, a clue worked out) → Look, Listen or WorkOut with "reveals": the fact is learned only if perceived. A player's message that states the result of their character's action ("I climb the wall", "I knock him out") is an attempt: its outcome is a question. An item that changes hands, is found, made, lost or used up with nothing in doubt in this reply, or that did so in the last narrator message → Transfer. A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. Seasickness or sickness after surgery → Sickness. A character moving within the scene or changing posture (stepping out of a house, crossing a room, going upstairs, sitting down, standing up, reaching for something) → Act, so the clock moves by the action's time: be_at for where they start when [BODY] gives no spot, then walk_to with distance_m from the scene. Time passing → PassTime when the reply covers more than a few minutes (travel, waiting, work, sleep); an action that takes minutes to finish (crossing a river, picking a lock, writing a letter) can be interrupted, so PassTime goes before its outcome. A person the story has not described who acts or speaks in this reply → NewCharacter, once per person. The player's character feels and chooses what the player writes: Appraise and Choose are for the other characters. Dice → RollTheDice for a quantity or a table the scene calls for.
For each, write a question, then the tool call that answers it, with argument values taken from the scene. Use the character names as the scene writes them; "we", "us" and "they" become the names of everyone the scene puts in the group, the person addressed included only when the scene includes them. An action each member of a group does alone (jumping a gap, climbing a wall, swimming across) → one call per person. One call per question; calls run in the order given, so put time passing after the actions it follows.
When STORY STATE has no [TIME] and the scene, the cast or the scenario gives a date or hour, add "time": "1850-03-14 18:40" (or "Day 1 08:00" when only the hour is known). A scene set in the present day (cars, phones, buses) with no date given takes the date and hour in TODAY. When the scene's position is not yet known and the scene or scenario says where it is, add "at": [latitude, longitude]. Always add "present": the names of every character in the scene now, as the scene writes them.
First write QUESTIONS: one line per question. Then write the JSON {"calls":[{"tool":"ToolName","args":{...}}],"then":["follow-on question"],"need":["ToolName"]}. When nothing is in doubt, write {"calls":[]}.`;
// The second round: follow-on outcomes asked once the first calls have results (decide, look at the result, decide again:
// FLARE, Jiang et al. 2023; ReAct, Yao et al. 2023). At most one extra round per turn.
const FOLLOW_ON = `RESULTS SO FAR
{results}

FOLLOW-ON QUESTIONS
{then}

Write the calls for the follow-on questions these results leave in doubt; a question a result settles or rules out gets no call. Same format: QUESTIONS, then the JSON {"calls":[...]}.`;
// A call the tool refused (an argument missing or malformed) goes back once with the tool's own message, and so does a plan
// that cannot be read or leaves out the scene's position: the planner corrects its own call, as a tool error is fed back
// in ReAct (Yao et al. 2023). A London 1888 turn lost its Act and Look this way, and a London 1899 turn ran nothing.
const REPAIR = `YOUR LAST ANSWER
{problems}

Write the corrected calls only, same format: QUESTIONS, then the JSON {"calls":[...]} (with "at" and "time" when asked for above).`;
const REFUSED = /not run; fix and call again|Nothing recorded\.?\s*$|needs a calendar date/;
// The same call twice, or Weather twice (one day has one weather), runs once.
const dedupe = (list) => list.filter((c, i) => list.findIndex(d => d.tool === c.tool && (c.tool === 'Weather' || JSON.stringify(d.args) === JSON.stringify(c.args))) === i);
const pad2 = (n) => String(n).padStart(2, '0');
/** The real date and hour, for a present-day scene that gives none. */
const today = (d = new Date()) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
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
/** The tools as the question model reads them; * marks a required argument. With `only`, the others are named in one line
 *  each (their first sentence). */
export function toolCatalogue(only) {
    const tools = [...REGISTRY.values()].filter(t => !SKIP.has(t.name));
    const full = tools.filter(t => !only || only.has(t.name)).map(t => `${t.name}: ${t.description}\n${Object.entries(t.properties).map(([k, p]) => describe(k, p, t.required.includes(k))).join('\n')}`).join('\n\n');
    const rest = only ? tools.filter(t => !only.has(t.name)) : [];
    return rest.length ? `${full}\n\nOTHER TOOLS (arguments not shown: to use one, add its name to "need" and its question to "then")\n${rest.map(oneLine).join('\n')}` : full;
}
const oneLine = (t) => `${t.name}: ${t.description.split(/(?<=\.)\s/)[0]}`;
// Which tools a turn needs, asked first: every tool's arguments come to about 10,500 tokens, most turns use two to four
// tools, and function-calling accuracy falls as the number of functions offered grows (Patil et al. 2025, BFCL), so the
// question model gets the full arguments of the tools named here and one line for the rest. A tool it then needs is added
// for the follow-on round ("need").
const PICK_SYSTEM = `You choose which rule tools the next reply of a roleplay may need. Code decides outcomes with these tools. Read the scene and the player's message and name every tool whose outcome the reply may need: an action that may fail, a blow, a sound or sight that may be missed, a message, a person's open response, time passing, an item changing hands, a fact established or learned, something the player states about their own character, a new person. When unsure whether a tool applies, include it. Write only the JSON {"tools":["Name", ...]}.`;
const PICK_MESSAGES = 3;
/** The tools the question model asks for, or null when its answer cannot be read (then every tool is shown). */
export async function pickTools(chat, send) {
    const index = [...REGISTRY.values()].filter(t => !SKIP.has(t.name)).map(oneLine).join('\n');
    const recent = chat.filter(m => !m.is_system).slice(-PICK_MESSAGES).map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const text = String(await send(PICK_SYSTEM, `TOOLS\n${index}\n\nSCENE (the last message is the player's)\n${recent}`) ?? '');
    const m = [...text.matchAll(/\{\s*"tools"\s*:\s*\[[^\]]*\]\s*\}/g)].pop();
    if (!m)
        return null;
    try {
        const names = JSON.parse(m[0]).tools.filter((x) => typeof x === 'string' && REGISTRY.has(x) && !SKIP.has(x));
        const out = new Set(names);
        if (out.has('Communicate'))
            out.add('Interpret');
        return out;
    }
    catch {
        return null;
    }
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
                need: Array.isArray(o.need) ? o.need.filter((x) => typeof x === 'string' && REGISTRY.has(x)) : [],
                present: Array.isArray(o.present) ? o.present.filter((x) => typeof x === 'string' && !!x.trim()) : undefined,
                read: strings(o.read, v => typeof v === 'string'),
                unsure: strings(o.unsure, v => Array.isArray(v) && v.length >= 2 && v.every(x => typeof x === 'string')),
                at: Array.isArray(o.at) && o.at.length === 2 && o.at.every((x) => typeof x === 'number' && Number.isFinite(x)) && Math.abs(o.at[0]) <= 90 && Math.abs(o.at[1]) <= 180 ? [o.at[0], o.at[1]] : undefined,
            };
        }
        catch { /* try an earlier object */ }
    }
    return { calls: [], then: [], read: {}, unsure: {}, need: [] };
}
const strings = (o, ok) => o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries(Object.entries(o).filter(([, v]) => ok(v))) : {};
/** The things the model read, kept only when the id is one offered for that phrase; unsure phrases go to the player. */
async function resolveRead(found, plan, choose) {
    const out = [];
    for (const f of found) {
        const pick = (id) => f.options.find(o => o.id === id);
        let o = pick(plan.read[f.phrase]);
        const doubt = plan.unsure[f.phrase]?.map(pick).filter((x) => !!x) ?? [];
        if (!o && doubt.length >= 2)
            o = choose ? pick(await choose(f.phrase, doubt.slice(0, 2))) : undefined;
        if (o)
            out.push({ phrase: f.phrase, id: o.id, label: o.label, year: o.year });
    }
    return out;
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
export function questionPrompt(chat, knows, tracker = '', only) {
    const recent = chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES)
        .map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const state = tracker.trim() ? `STORY STATE\n${tracker.trim().slice(0, TRACKER_CHARS)}\n\n` : '';
    const now = /\[TIME\]/.test(tracker) ? '' : `TODAY\n${today()}\n\n`;
    return `TOOLS\n${toolCatalogue(only)}\n\n${state}${now}${knows ? `${knows}\n\n` : ''}SCENE (the last message is the player's)\n${recent}`;
}
/**
 * Runs the question pass for a generation whose last message is the player's. A swipe of the same turn reuses the calls
 * asked the first time; the engine state was restored to the turn's start, so the same calls give the same outcomes.
 */
export async function runQuestionPass(chat, send, tracker = '', choose) {
    const ctx = SillyTavern.getContext();
    setRead([]);
    if (!ctx.chatMetadata || !chat.length || !chat[chat.length - 1].is_user || !REGISTRY.size)
        return [];
    const s = store(), turn = turnKey(ctx.chat);
    const results = [];
    const runAll = async (list) => { for (const c of list) {
        clearDraws();
        const result = String(await REGISTRY.get(c.tool).exec(c.args));
        results.push({ tool: c.tool, result, draws: LAST_DRAWS.map(x => Math.round(x * 1e4) / 1e4) });
    } };
    let calls, time = null, present;
    if (s.asked?.turn === turn) {
        calls = s.asked.calls;
        time = s.asked.time ?? null;
        present = s.asked.present;
        setRead(s.asked.read ?? []);
        if (time !== null && storyTime() === null)
            setStoryTime(time);
        await runAll(calls);
    }
    else {
        await Promise.all([loadThings(), loadColex(), loadLanguageYears(), loadChat(), loadPopulation()]);
        const found = thingsIn(String(chat[chat.length - 1].mes ?? ''));
        const only = await pickTools(chat, send) ?? undefined;
        const prompt = [questionPrompt(chat, knowledgeBlock(s.state), tracker, only), thingsBlock(found)].filter(Boolean).join('\n\n');
        const lastPlanText = String(await send(QUESTION_SYSTEM, prompt) ?? '');
        const plan = rawPlan(lastPlanText);
        setRead(await resolveRead(found, plan, choose));
        present = plan.present;
        time = plan.time && storyTime() === null ? parseStoryTime(plan.time) : null;
        if (time !== null)
            setStoryTime(time);
        if (plan.at && !scenePosition())
            setScenePosition(plan.at[0], plan.at[1]);
        const valid = validCalls(plan.calls), dropped = plan.calls.filter(c => !valid.includes(c));
        calls = dedupe(valid);
        const unread = !/\{\s*"calls"/.test(lastPlanText);
        const noPlace = !scenePosition() && (time !== null || storyTime() !== null) && (storyTime() ?? 0) / 1440 > 146097;
        if (unread || dropped.length || noPlace) {
            const problems = [unread ? 'It had no readable {"calls":[...]} JSON.' : '',
                ...dropped.map(c => `${c.tool} ${JSON.stringify(c.args)}: ${REGISTRY.has(c.tool) ? `missing ${REGISTRY.get(c.tool).required.filter(k => c.args[k] === undefined || c.args[k] === '').join(', ')}` : 'no such tool'}.`),
                noPlace ? 'It gave no "at": add [latitude, longitude] of the scene from the scene or scenario.' : ''].filter(Boolean);
            const fix = rawPlan(await send(QUESTION_SYSTEM, `${prompt}\n\n${REPAIR.replace('{problems}', problems.join('\n'))}`));
            if (fix.at && !scenePosition())
                setScenePosition(fix.at[0], fix.at[1]);
            if (fix.time && storyTime() === null) {
                time = parseStoryTime(fix.time);
                if (time !== null)
                    setStoryTime(time);
            }
            calls = dedupe([...calls, ...validCalls(fix.calls)]).slice(0, MAX_CALLS);
            plan.then.push(...fix.then);
        }
        // The day's weather is decided by code every turn the story has a calendar date and a place, whether or not the
        // question model asked: a narrator describes the sky unasked (a reply set in Rio, April 1822, had no Weather call).
        const pos = scenePosition(), now = storyTime();
        if (pos && now !== null && now / 1440 > 146097 && !calls.some(c => c.tool === 'Weather') && REGISTRY.has('Weather'))
            calls.push({ tool: 'Weather', args: { latitude: pos.lat, longitude: pos.lon } });
        await runAll(calls);
        // Refused calls: the tool's message goes back once; a corrected call's result replaces the refusal.
        const bad = results.map((r, i) => ({ r, i })).filter(x => REFUSED.test(x.r.result));
        if (bad.length) {
            const fp = rawPlan(await send(QUESTION_SYSTEM, `${prompt}\n\n${REPAIR.replace('{problems}', bad.map(({ r, i }) => `${r.tool} ${JSON.stringify(calls[i].args)} → ${r.result}${/calendar date/.test(r.result) ? ' Add "time" with the date (TODAY for a present-day scene).' : ''}`).join('\n'))}`));
            if (fp.at && !scenePosition())
                setScenePosition(fp.at[0], fp.at[1]);
            if (fp.time && storyTime() === null) {
                time = parseStoryTime(fp.time);
                if (time !== null)
                    setStoryTime(time);
            }
            const fixed = validCalls(fp.calls);
            // A call refused only for want of a date runs again once the date is set.
            if (time !== null)
                for (const { i } of bad)
                    if (/calendar date/.test(results[i]?.result ?? '') && !fixed.some(c => c.tool === calls[i].tool))
                        fixed.push(calls[i]);
            const keep = results.filter(r => !REFUSED.test(r.result)), keptCalls = calls.filter((_, i) => !REFUSED.test(results[i].result));
            results.length = 0;
            results.push(...keep);
            const fresh = dedupe([...keptCalls, ...fixed]).slice(keptCalls.length);
            await runAll(fresh);
            calls = [...keptCalls, ...fresh];
        }
        if ((plan.then.length || plan.need.length || results.some(r => /Call Interpret/.test(r.result))) && calls.length < MAX_CALLS) {
            // Tools asked for by name in "need", and Interpret when a result calls for it, get their arguments now.
            const extra = only ? [...new Set([...plan.need, ...results.some(r => /Call Interpret/.test(r.result)) ? ['Interpret'] : []])].filter(n => !only.has(n)) : [];
            const added = extra.length ? `MORE TOOLS\n${toolCatalogue(new Set(extra)).split('\n\nOTHER TOOLS')[0]}\n\n` : '';
            const follow = FOLLOW_ON.replace('{results}', results.map((x, i) => `${i + 1}. ${x.tool}: ${x.result}`).join('\n') || '(none)')
                .replace('{then}', [...plan.then, ...results.some(r => /Call Interpret/.test(r.result)) ? ['Which meaning does each listener take from the words a result names?'] : []].map(q => `- ${q}`).join('\n'));
            const more = validCalls(rawCalls(await send(QUESTION_SYSTEM, `${prompt}\n\n${added}${follow}`))).slice(0, MAX_CALLS - calls.length);
            await runAll(more);
            calls = [...calls, ...more];
        }
    }
    s.asked = { turn, calls, results, time, read: READ, present };
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
    console.debug('[Rules engine] question pass', calls, results, READ);
    return READ;
}
/** "/rules-log": this turn's calls, each with its arguments, the draws it used (0–1) and its result. */
export function turnLog() {
    const a = store().asked;
    if (!a || a.turn !== turnKey(SillyTavern.getContext().chat))
        return 'No question pass this turn.';
    return a.calls.map((c, i) => `${i + 1}. ${c.tool} ${JSON.stringify(c.args)}\n   draws: ${a.results[i]?.draws?.join(', ') || 'none'}\n   → ${a.results[i]?.result ?? ''}`).join('\n');
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
