// Question pass (docs/df-body-engine.md §7.3): before the narrator writes, a second model reads the player's message and the
// scene, asks which outcomes of the coming reply are in doubt, and names the rule tool that decides each; code runs those
// calls and the narrator receives the outcomes in [DECIDED]. Questions answered apart from the draft were answered more
// accurately than inside it (Chain-of-Verification, Dhuliawala et al. 2023: list precision 0.17 → 0.36), and a model that
// has written an outcome defends it (Zhang et al. 2023), so the questions come before the reply. The narrator still calls
// tools itself; a call already made here returns the same result (the turn's decision ledger).
import { turnKey } from './turn.js';
import { MAGIC_TOOLS, REGISTRY, LAST_DRAWS, clearDraws, store, storyTime, setStoryTime, scenePosition, setScenePosition } from './rules-tools.js';
import { parseStoryTime, findStoryTime } from './clock.js';
import { placeIn } from './weather.js';
import { takeFlags } from './audit-flags.js';
import { planSchema, callsFromKeyed, PERSON_KEY, subjectOf } from './plan-schema.js';
import { routedTools, movesIn, ALWAYS } from './router.js';
import { framedCalls, playerName, mergeCalls, sameSubject } from './frame.js';
import { scenePeople } from './scene-people.js';
import { unrecorded } from './possessions.js';
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
Read the scene and the player's message. Find each thing the next reply will state that code decides. Two kinds: outcomes in doubt (an action that may fail, a blow that may land, whether a sound is heard or a sight seen, whether a message is understood, how a person responds), and facts code fixes even when nothing is in doubt (the time an action or a wait takes, the day's weather, an item changing hands, a new person's age and sex, a fact the scene establishes or a character learns).
Ask about the things this reply shows. An outcome that follows from another one still in doubt (a blow after an order is obeyed, an answer after a call is heard, an animal's next move after a kick lands) goes in "then" as a question; you will get the results of the calls and write its call then.
A player's message that states something new about their own character (what they are, an item they have, an ability, something they did before, something outside their control happening to them now, something they know) → Claim, before the actions that rely on it. A sight or sound that would teach a fact (a secret overheard, a face recognized, a clue worked out) → Look, Listen or WorkOut with "reveals": the fact is learned only if perceived. A player's message that states the result of their character's action ("I climb the wall", "I knock him out") is an attempt: its outcome is a question. An item that changes hands, is found, made, lost or used up with nothing in doubt in this reply, or that did so in the last narrator message → Transfer. A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. Seasickness or sickness after surgery → Sickness. A character moving within the scene or changing posture (stepping out of a house, crossing a room, going upstairs, sitting down, standing up, reaching for something) → Act, so the clock moves by the action's time: be_at for where they start when [BODY] gives no spot, then walk_to with distance_m from the scene. Time passing → PassTime when the reply covers more than a few minutes (travel, waiting, work, sleep); an action that takes minutes to finish (crossing a river, picking a lock, writing a letter) can be interrupted, so PassTime goes before its outcome. A new person who first acts or speaks in this reply → NewCharacter, once per person. The player's character feels and chooses what the player writes: Appraise and Choose are for the other characters. Dice → RollTheDice for a quantity or a table the scene calls for.
For each, write a question, then the tool call that answers it, with argument values taken from the scene. Use the character names as the scene writes them; "we", "us" and "they" become the names of everyone the scene puts in the group, the person addressed included only when the scene includes them. An action each member of a group does alone (jumping a gap, climbing a wall, swimming across) → one entry per person. The calls are grouped by tool, and within a tool keyed by the person or thing the call is about (the actor, the speaker, the listener, the viewer, the good priced, the item handed over): each person's motions this turn go in their one Act, in order; each good has one Price. A tool about no one in particular (Weather, PassTime) takes its arguments directly. Tools run in the order written, so put time passing after the actions it follows.
When STORY STATE has no [TIME] and the scene, the cast or the scenario gives a date or hour, add "time": the scene's date and hour as YYYY-MM-DD HH:MM (or "Day 1 HH:MM" when only the hour is known). A scene set in the present day (cars, phones, buses) with no date given takes the date and hour in TODAY. The first time the scene or scenario says where the scene is, add "at": [latitude, longitude]. Always add "present": the names of every character in the scene now, as the scene writes them; and "named_as": for each person new to the story, what the words naming them fix, by meaning, in any language.
First write QUESTIONS: one line per question. Then write the JSON {"calls":{"ToolName":{"person or thing it is about":{...arguments}}},"then":[{"question":"follow-on question","tool":"the tool that answers it"}],"need":["ToolName"]}. A plan with zero calls is {"calls":{}}.`;
// The second round: follow-on outcomes asked once the first calls have results (decide, look at the result, decide again:
// FLARE, Jiang et al. 2023; ReAct, Yao et al. 2023). At most one extra round per turn.
export const FOLLOW_ON = `RESULTS SO FAR
{results}

FOLLOW-ON QUESTIONS
{then}

Write a call for each follow-on question these results leave open. Same format: QUESTIONS, then the JSON {"calls":{...}}.`;
// A call the tool refused (an argument missing or malformed) goes back once with the tool's own message, and so does a plan
// that cannot be read or leaves out the scene's position: the planner corrects its own call, as a tool error is fed back
// in ReAct (Yao et al. 2023). A London 1888 turn lost its Act and Look this way, and a London 1899 turn ran nothing.
export const REPAIR = `YOUR LAST ANSWER
{problems}

Write the corrected calls only, same format: QUESTIONS, then the JSON {"calls":{...}} (with "at" and "time" when asked for above). A value that depends on another call's result (a fall's height after a failed climb) goes in "then" as a question; you will get that result first.`;
/** A plan that puts the story time or the scene's position inside a call's arguments ("time" on Weather or Act) gives them
 *  as the plan's own. */
function hoist(plan) {
    for (const c of plan.calls) {
        if (!plan.time && typeof c.args.time === 'string')
            plan.time = c.args.time;
        if (!plan.at && typeof c.args.latitude === 'number' && typeof c.args.longitude === 'number')
            plan.at = [c.args.latitude, c.args.longitude];
    }
    return plan;
}
const REFUSED = /fix and call again|State unchanged\.?\s*$|needs a calendar date/;
// The same call twice, or Weather twice (one day has one weather), runs once.
// Calls that ask the same question once: Weather once a turn; Price once per item, quantity and year whatever the city (the scene's
// country decides it: one turn asked the ale's price in five cities).
const sameAsk = (c) => c.tool === 'Weather' ? 'Weather' : c.tool === 'Price' ? `Price ${JSON.stringify({ ...c.args, city: undefined, country: undefined })}` : `${c.tool} ${JSON.stringify(c.args)}`;
export const dedupe = (list) => list.filter((c, i) => list.findIndex(d => sameAsk(d) === sameAsk(c)) === i);
const pad2 = (n) => String(n).padStart(2, '0');
/** What the cast states about a person: an age written beside the name ("Will, 12", "Will (12)", "Will, a 12-year-old") and a
 *  sex from a kin or person word beside it (brother, sister, wife, man…). */
export function castPerson(name, cast) {
    const n = name.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = new RegExp(`(?:\\b(\\w+)\\s+)?\\b${n}\\b[,:]?\\s*(?:\\(|,\\s*)?(?:an?\\s+)?(\\d{1,3})\\b(?:-year-old)?(?:\\s+(\\w+))?`, 'i').exec(cast);
    if (!m)
        return {};
    const kin = `${m[1] ?? ''} ${m[3] ?? ''}`.toLowerCase();
    const sex = /\b(brother|son|father|husband|uncle|nephew|grandson|grandfather|man|boy)\b/.test(kin) ? 'male' : /\b(sister|daughter|mother|wife|aunt|niece|granddaughter|grandmother|woman|girl)\b/.test(kin) ? 'female' : undefined;
    return { age: Number(m[2]), ...sex ? { sex } : {} };
}
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
    return rest.length ? `${full}\n\nOTHER TOOLS (arguments on request: to use one, add its name to "need" and its question to "then")\n${rest.map(oneLine).join('\n')}` : full;
}
const oneLine = (t) => `${t.name}: ${t.description.split(/(?<=\.)\s/)[0]}`;
// Which tools a turn needs, asked first: every tool's arguments come to about 10,500 tokens, most turns use two to four
// tools, and function-calling accuracy falls as the number of functions offered grows (Patil et al. 2025, BFCL), so the
// question model gets the full arguments of the tools named here and one line for the rest. A tool it then needs is added
// for the follow-on round ("need").
export const PICK_SYSTEM = `You choose which rule tools the next reply of a roleplay may need. Code decides outcomes with these tools. Read the scene and the player's message and name every tool whose outcome the reply may need: an action that may fail, a blow, a sound or sight, a message, a person's response, the time an action takes, time passing, the weather, an item changing hands, a fact established or learned, something the player states about their own character, a new person. When unsure whether a tool applies, include it. Write only the JSON {"tools":["Name", ...]}.`;
const PICK_MESSAGES = 3;
/** The picker's answer as a schema: names of offered tools only. */
const pickSchema = () => ({ type: 'object', additionalProperties: false, required: ['tools'], properties: { tools: { type: 'array', maxItems: 10, items: { type: 'string', enum: [...REGISTRY.values()].filter(t => !SKIP.has(t.name)).map(t => t.name) } } } });
/** The tools the question model asks for, or null when its answer cannot be read (then every tool is shown). */
export async function pickTools(chat, send) {
    const index = [...REGISTRY.values()].filter(t => !SKIP.has(t.name)).map(oneLine).join('\n');
    const recent = chat.filter(m => !m.is_system).slice(-PICK_MESSAGES).map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const open = OPEN.length ? `OPEN FROM THE LAST REPLY\n${OPEN.map(q => `- ${q}`).join('\n')}\n\n` : '';
    const text = String(await send(PICK_SYSTEM, `TOOLS\n${index}\n\n${open}SCENE (the last message is the player's)\n${recent}`) ?? '');
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
            // The keyed form (plan-schema.ts) is read as the list the rest of the pass takes; the list form still reads.
            if (o.calls && typeof o.calls === 'object' && !Array.isArray(o.calls))
                o.calls = callsFromKeyed(o.calls);
            if (!Array.isArray(o.calls))
                continue;
            return {
                calls: o.calls.filter((c) => !!c && typeof c.tool === 'string' && typeof c.args === 'object' && c.args !== null),
                // A follow-on question is text, or {question, tool}: the tool that answers it is required next round.
                then: Array.isArray(o.then) ? o.then.map((q) => typeof q === 'string' ? q : q?.question).filter((q) => typeof q === 'string' && !!q.trim()) : [],
                thenTools: Array.isArray(o.then) ? o.then.map((q) => q?.tool).filter((x) => typeof x === 'string' && REGISTRY.has(x)) : [],
                time: typeof o.time === 'string' ? o.time : undefined,
                need: Array.isArray(o.need) ? o.need.filter((x) => typeof x === 'string' && REGISTRY.has(x)) : [],
                named_as: o.named_as && typeof o.named_as === 'object' ? strings(o.named_as, v => typeof v === 'string') : undefined,
                present: Array.isArray(o.present) ? o.present.filter((x) => typeof x === 'string' && !!x.trim()) : undefined,
                read: strings(o.read, v => typeof v === 'string'),
                unsure: strings(o.unsure, v => Array.isArray(v) && v.length >= 2 && v.every(x => typeof x === 'string')),
                at: Array.isArray(o.at) && o.at.length === 2 && o.at.every((x) => typeof x === 'number' && Number.isFinite(x)) && Math.abs(o.at[0]) <= 90 && Math.abs(o.at[1]) <= 180 ? [o.at[0], o.at[1]] : undefined,
            };
        }
        catch { /* try an earlier object */ }
    }
    return { calls: [], then: [], thenTools: [], read: {}, unsure: {}, need: [] };
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
    return calls.filter(c => { const t = REGISTRY.get(c.tool); return !!t && !SKIP.has(c.tool) && t.required.every(k => c.args[k] !== undefined && c.args[k] !== '') && !badPeople(c).length; })
        .slice(0, MAX_CALLS);
}
// A person enters a call by a name or a role (plan-schema.ts PERSON_KEY), or as the story already holds them.
const PERSON_ARG_KEYS = ['who', 'speaker', 'listener', 'viewer', 'attacker', 'pursuer', 'fleeing', 'target_who', 'requester_name'];
let KNOWN_PEOPLE = new Set();
const personRe = new RegExp(PERSON_KEY);
/** The person arguments of a call that name no one: a description where a name or role belongs. */
export function badPeople(c) {
    return PERSON_ARG_KEYS.filter(k => typeof c.args[k] === 'string' && !KNOWN_PEOPLE.has(c.args[k]) && !personRe.test(c.args[k]));
}
/** The scene for the question model: the story state (time, place, bodies), [KNOWS], recent messages, the player's last. */
/** Questions the last reply left open (narration.ts), for this turn's plan; set when a reply is read. */
let OPEN = [];
export const setOpen = (q) => { OPEN = q.slice(0, 4); };
export function questionPrompt(chat, knows, tracker = '', only) {
    const recent = chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES)
        .map(m => `${m.is_user ? 'PLAYER' : (m.name || 'NARRATOR')}: ${String(m.mes ?? '').slice(0, MESSAGE_CHARS)}`).join('\n\n');
    const state = tracker.trim() ? `STORY STATE\n${tracker.trim().slice(0, TRACKER_CHARS)}\n\n` : '';
    const now = /\[TIME\]/.test(tracker) ? '' : `TODAY\n${today()}\n\n`;
    const open = OPEN.length ? `OPEN FROM THE LAST REPLY (the scene was moving toward these; decide each this reply shows)\n${OPEN.map(q => `- ${q}`).join('\n')}\n\n` : '';
    return `TOOLS\n${toolCatalogue(only)}\n\n${state}${now}${knows ? `${knows}\n\n` : ''}${open}SCENE (the last message is the player's)\n${recent}`;
}
/** Constrained decoding for the plan (plan-schema.ts): set when the connection honours a JSON schema (tools/probe-guided.mjs). */
export let GUIDED = false;
export const setGuided = (v) => { GUIDED = v; };
// Under constrained decoding the answer is the JSON plan alone; the model's reasoning carries the questions.
const GUIDED_SYSTEM = () => QUESTION_SYSTEM.replace(/First write QUESTIONS:[^\n]*$/, 'Write the plan as the JSON {"calls":{"ToolName":{"person or thing it is about":{...arguments}}},"then":[{"question":"follow-on question","tool":"the tool that answers it"}],"need":["ToolName"]}; a plan with zero calls is {"calls":{}}.');
export async function runQuestionPass(chat, sendRaw, tracker = '', choose) {
    const planTools = { current: undefined, people: [], actors: [], require: [] };
    const send = (system, user) => !GUIDED ? sendRaw(system, user)
        : system === QUESTION_SYSTEM ? sendRaw(GUIDED_SYSTEM(), user, { schema: planSchema(planTools.current, { people: planTools.people, actors: planTools.actors, require: planTools.require, used: usedKeys() }) })
            : system === PICK_SYSTEM ? sendRaw(system, user, { schema: pickSchema() }) : sendRaw(system, user);
    const ctx = SillyTavern.getContext();
    setRead([]);
    if (!ctx.chatMetadata || !chat.length || !chat[chat.length - 1].is_user || !REGISTRY.size)
        return [];
    const s = store(), turn = turnKey(ctx.chat);
    const results = [];
    // The tool and subject of each call that has run this turn and stands (a refused call leaves its key open).
    const used = new Map(), usedKeys = () => used;
    const markUsed = (c, result) => { const k = subjectOf(c.tool); if (!k || REFUSED.test(result))
        return; (used.get(c.tool) ?? used.set(c.tool, new Set()).get(c.tool)).add(String(c.args[k] ?? c.args.question ?? '')); };
    const runAll = async (list) => { for (const c of list) {
        clearDraws();
        const result = String(await REGISTRY.get(c.tool).exec(c.args));
        results.push({ tool: c.tool, result, draws: LAST_DRAWS.map(x => Math.round(x * 1e4) / 1e4) });
        markUsed(c, result);
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
        // A rewrite after the rule check: each flagged event gets its tool run now, from the results so far.
        const flags = takeFlags().filter(f => REGISTRY.has(f.tool));
        if (flags.length && calls.length < MAX_CALLS) {
            await Promise.all([loadThings(), loadColex(), loadLanguageYears(), loadChat(), loadPopulation()]);
            const tools = new Set(flags.map(f => f.tool));
            planTools.current = tools;
            const prompt = questionPrompt(chat, knowledgeBlock(s.state), tracker, tools);
            const follow = FOLLOW_ON.replace('{results}', results.map((x, i) => `${i + 1}. ${x.tool}: ${storyResult(x.result)}`).join('\n') || '(none)')
                .replace('{then}', flags.map(f => `- The reply needs: "${f.quote}" (${f.tool})`).join('\n'));
            const more = dedupe(validCalls(rawCalls(await send(QUESTION_SYSTEM, `${prompt}\n\n${follow}`))).filter(c => tools.has(c.tool))).slice(0, MAX_CALLS - calls.length);
            await runAll(more);
            calls = [...calls, ...more];
        }
    }
    else {
        await Promise.all([loadThings(), loadColex(), loadLanguageYears(), loadChat(), loadPopulation()]);
        const found = thingsIn(String(chat[chat.length - 1].mes ?? ''));
        // Code reads the tools from the player's verbs (router.ts) and writes every call whose arguments the words give
        // (frame.ts); the planner is asked only for the tools left open, and skipped when none are. The model picks the
        // tools only when no verb maps to one.
        const said0 = String(chat[chat.length - 1].mes ?? ''), has = (n) => REGISTRY.has(n) && !SKIP.has(n);
        const player = playerName(ctx.name1, tracker);
        const framed = player ? framedCalls(said0, player) : { calls: [], covered: new Set() };
        framed.calls = framed.calls.filter(c => has(c.tool));
        framed.covered = new Set([...framed.covered].filter(has));
        // The people the story holds, as keys the plan writes them by (plan-schema.ts PERSON_KEY).
        const sceneTexts = [said0, tracker.match(/\[CAST\][\s\S]*?\[\/CAST\]/)?.[0] ?? '', ...chat.filter(m => !m.is_system).slice(-3, -1).map(m => String(m.mes ?? ''))];
        planTools.people = scenePeople(sceneTexts, [...player ? [player] : [], ...Object.keys(s.state.people ?? {}), ...[...tracker.matchAll(/^([A-Z][\w'-]*(?: [A-Z][\w'-]*)?)\s*[(:]/gm)].map(m => m[1]).filter(n => !/^(?:Scenario|Cast|Time|Place|Weather|Story|Body|Knows)$/i.test(n))]);
        KNOWN_PEOPLE = new Set(planTools.people);
        // The first round's actors: the player's character and the people the player's message names.
        planTools.actors = [...new Set([...player ? [player] : [], ...planTools.people.filter(n => n !== player && new RegExp(`\\b${n.replace(/^the /, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(said0))])];
        const routed = routedTools(said0, has);
        const left = routed ? [...routed].filter(t => !framed.covered.has(t) && !ALWAYS.includes(t)) : null;
        const only = routed ? new Set([...left, ...ALWAYS.filter(has)]) : await pickTools(chat, send) ?? undefined;
        planTools.current = only;
        const settled = framed.calls.filter(c => framed.covered.has(c.tool)), drafts = framed.calls.filter(c => !framed.covered.has(c.tool));
        const already = (settled.length ? `\n\nCODE HAS ALREADY CALLED (from the player's words; these results come back with yours)\n${settled.map(c => `- ${c.tool} ${JSON.stringify(c.args)}`).join('\n')}` : '')
            + (drafts.length ? `\n\nCODE READ FROM THE PLAYER'S WORDS (call these with the scene's numbers added: distance_m, noise, barrier)\n${drafts.map(c => `- ${c.tool} ${JSON.stringify(c.args)}`).join('\n')}` : '');
        const prompt = [questionPrompt(chat, knowledgeBlock(s.state), tracker, only) + already, thingsBlock(found)].filter(Boolean).join('\n\n');
        const skipPlanner = !!routed && left.length === 0 && framed.calls.length > 0;
        // A scene tool code drafted is written by the plan: its schema requires a call of it (the planner left Mary's words
        // to the costermonger at their defaults, 1 m in a quiet room, on a busy street).
        planTools.require = [...new Set(drafts.map(d => d.tool))];
        const lastPlanText = skipPlanner ? '{"calls":{}}' : String(await send(QUESTION_SYSTEM, prompt) ?? '');
        planTools.require = [];
        const plan = hoist(rawPlan(lastPlanText));
        plan.calls = plan.calls.filter(c => !framed.covered.has(c.tool));
        setRead(await resolveRead(found, plan, choose));
        present = plan.present;
        // A date the player wrote is read by code and wins over the plan's; the plan's comes next, then the cast and scene.
        const written = storyTime() === null ? findStoryTime(String(chat[chat.length - 1].mes ?? '')) : null;
        time = written ?? (plan.time && storyTime() === null ? parseStoryTime(plan.time) : null);
        // A date written in the player's message, the cast and scenario, or the recent scene sets the clock when the plan
        // gives none (a London 1899 date stated by the player reached no tool).
        if (time === null && storyTime() === null) {
            const texts = [String(chat[chat.length - 1].mes ?? ''), tracker, ...chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES).reverse().map(m => String(m.mes ?? ''))];
            for (const t of texts) {
                const f = findStoryTime(t);
                if (f !== null) {
                    time = f;
                    break;
                }
            }
        }
        if (time !== null)
            setStoryTime(time);
        if (plan.at && !scenePosition())
            setScenePosition(plan.at[0], plan.at[1]);
        // A place named in the player's message, the cast and scenario or the scene places it when the plan gives no position.
        if (!scenePosition()) {
            const skip = new Set([...(plan.present ?? []), ...[...tracker.matchAll(/^([^:\n(]+?)\s*(?:\(|:)/gm)].map(m => m[1].trim())].map(x => x.toLowerCase()));
            for (const t of [String(chat[chat.length - 1].mes ?? ''), tracker, ...chat.filter(m => !m.is_system).slice(-SCENE_MESSAGES).reverse().map(m => String(m.mes ?? ''))]) {
                const pl = placeIn(t, skip);
                if (pl && pl.lat != null && pl.lon != null) {
                    setScenePosition(pl.lat, pl.lon);
                    break;
                }
            }
        }
        const valid = validCalls(plan.calls), dropped = plan.calls.filter(c => !valid.includes(c));
        calls = dedupe(mergeCalls(framed.calls, valid));
        const unread = !/\{\s*"calls"/.test(lastPlanText);
        // A motion the player's message names (step out, sit down, cross the room) needs its time: code reads the verb.
        const said = String(chat[chat.length - 1].mes ?? ''), motion = !calls.some(c => c.tool === 'Act' || (c.tool === 'PassTime' && Array.isArray(c.args.walking))) && REGISTRY.has('Act') && movesIn(said);
        const noPlace = !scenePosition() && (time !== null || storyTime() !== null) && (storyTime() ?? 0) / 1440 > 146097;
        // A scene tool code drafted (Communicate) that the plan left out still needs the scene's numbers.
        const sceneOpen = drafts.filter(d => !valid.some(c => sameSubject(d, c)));
        if (unread || dropped.length || noPlace || motion || sceneOpen.length) {
            const problems = [unread ? 'Write the plan as the JSON {"calls":{...}}.' : '',
                ...dropped.map(c => `${c.tool} ${JSON.stringify(c.args)}: ${!REGISTRY.has(c.tool) ? 'unknown tool' : badPeople(c).length ? `${badPeople(c).join(', ')} takes a person's name or role, as in "Mara" or "the innkeeper"` : `missing ${REGISTRY.get(c.tool).required.filter(k => c.args[k] === undefined || c.args[k] === '').join(', ')}`}.`),
                noPlace ? 'Add "at": [latitude, longitude] of the scene, from the scene or scenario.' : '',
                motion ? `The player's message moves their character ("${said.slice(0, 120)}"): add Act with action and distance_m from the scene.` : '',
                ...sceneOpen.map(d => `${d.tool} ${JSON.stringify(d.args)}: call it with ${[...REGISTRY.get(d.tool).required.filter(k => d.args[k] === undefined), 'noise', 'barrier'].join(', ')} from the scene${d.tool === 'Communicate' ? ', and effort when the scene sets how loud the words are' : ''}.`)].filter(Boolean);
            planTools.require = [...new Set(sceneOpen.map(d => d.tool))];
            const fix = hoist(rawPlan(await send(QUESTION_SYSTEM, `${prompt}\n\n${REPAIR.replace('{problems}', problems.join('\n'))}`)));
            planTools.require = [];
            if (fix.at && !scenePosition())
                setScenePosition(fix.at[0], fix.at[1]);
            if (fix.time && storyTime() === null) {
                time = parseStoryTime(fix.time);
                if (time !== null)
                    setStoryTime(time);
            }
            // The answer replaces only what was asked: every call when the plan was unreadable, the dropped tools' calls otherwise
            // (asked only for "at", a model rewrote the whole plan and its Act ran twice).
            const asked = new Set([...dropped.map(c => c.tool), ...motion ? ['Act'] : [], ...sceneOpen.map(d => d.tool)]);
            calls = dedupe(mergeCalls(calls, validCalls(fix.calls).filter(c => unread || asked.has(c.tool)))).slice(0, MAX_CALLS);
            plan.then.push(...fix.then);
            plan.thenTools.push(...fix.thenTools);
        }
        // The day's weather is decided by code every turn the story has a calendar date and a place, whether or not the
        // question model asked: a narrator describes the sky unasked (a reply set in Rio, April 1822, had no Weather call).
        const pos = scenePosition(), now = storyTime();
        if (pos && now !== null && now / 1440 > 146097 && !calls.some(c => c.tool === 'Weather') && REGISTRY.has('Weather'))
            calls.push({ tool: 'Weather', args: { latitude: pos.lat, longitude: pos.lon } });
        // Every person a call names who is new to the story and outside the cast gets NewCharacter first, drawn by code: a role
        // noun is their occupation ("the innkeeper" → innkeeper). An innkeeper the plan used without one was a blank body.
        if (REGISTRY.has('NewCharacter')) {
            // "target" is left out: Look's target is a thing seen ("Tom getting up and going to the bar" became a 7-year-old boy).
            const PERSON = ['who', 'speaker', 'listener', 'viewer', 'pursuer', 'fleeing', 'other', 'attacker', 'requester_name'];
            const known = new Set([...Object.keys(s.state.people ?? {}), String(ctx.name1 ?? '')].map(x => x.toLowerCase()));
            const castText = tracker.toLowerCase();
            const named = new Set(calls.filter(c => c.tool === 'NewCharacter').map(c => String(c.args.who ?? '').toLowerCase()));
            const fresh = [];
            // A hand-over's from and to are people when the plan names them as people (named_as or present); else places.
            const isPerson = (v) => !!plan.named_as?.[v] || (plan.present ?? []).some(x => x.toLowerCase() === v.toLowerCase());
            for (const c of calls)
                for (const k of [...PERSON, ...c.tool === 'Transfer' ? ['from', 'to'] : []]) {
                    const v = c.args[k];
                    if (typeof v !== 'string' || !v.trim())
                        continue;
                    if ((k === 'from' || k === 'to') && !isPerson(v))
                        continue;
                    const n = v.trim(), low = n.toLowerCase();
                    // A person is named in a few words ("the young man by the fire"); a phrase over 8 words or with a verb in -ing describes an event.
                    if (n.split(/\s+/).length > 8 || /\b\w+ing (?:up|down|out|in|to|the|a|an|at|from|toward|towards|and|his|her|their)\b/.test(low))
                        continue;
                    if (known.has(low) || named.has(low) || castText.includes(`${low} (`) || castText.includes(`${low}:`) || (present ?? []).some(x => x.toLowerCase() === low && castText.includes(low)))
                        continue;
                    const role = /^(?:the |an? )?([a-z][a-z -]*)$/.exec(n)?.[1];
                    named.add(low);
                    const as = plan.named_as?.[n];
                    fresh.push({ tool: 'NewCharacter', args: { who: n, ...role ? { occupation: role } : {}, ...as ? { named_as: as } : {} } });
                }
            calls = [...fresh, ...calls];
            // A person the cast describes takes the cast's age and sex (Will, "her brother Will, 12", came out a blacksmith of 19).
            calls = calls.map(c => c.tool !== 'NewCharacter' || typeof c.args.who !== 'string' ? c : { ...c, args: { ...c.args, ...castPerson(c.args.who, tracker) } });
        }
        // A drafted scene call that never got its scene numbers (Listen with no distance) stays unrun: a call runs complete.
        calls = calls.filter(c => { const t = REGISTRY.get(c.tool); return !t || t.required.every(k => c.args[k] !== undefined && c.args[k] !== ''); });
        // Weather fixes the setting's country, which other results read (walking pace by country: an Act before Weather walked
        // Mary at 1.43 m/s, the same Act after it at 1.62), so it runs first.
        calls = dedupe([...calls.filter(c => c.tool === 'Weather'), ...calls.filter(c => c.tool !== 'Weather')]);
        // A wait the player names after other actions ("I punch him, pay and wait ten minutes") runs after them: ten minutes
        // had passed before the punch. A message that opens with the wait keeps it first.
        {
            const w = /\b(?:wait|waits|waited|rest|rests|sleep|sleeps)\b/i.exec(said);
            if (w && w.index > 12)
                calls = [...calls.filter(c => c.tool !== 'PassTime' || Array.isArray(c.args.walking)), ...calls.filter(c => c.tool === 'PassTime' && !Array.isArray(c.args.walking))];
        }
        // A thing the player's character hands over that their recorded belongings leave out ("I offer him my silver
        // thimble") is first claimed: Claim decides whether they have it, then the hand-over runs on what it decided. The
        // share is an ordinary personal item's [ASSUMED: more than half of people in such a scene carry one].
        if (player && REGISTRY.has('Claim'))
            for (const c of [...calls])
                if (c.tool === 'Transfer' && c.args.from === player && typeof c.args.item === 'string' && unrecorded(s.state, player, c.args.item) && !calls.some(d => d.tool === 'Claim' && String(d.args.item ?? '') === c.args.item))
                    calls.splice(calls.indexOf(c), 0, { tool: 'Claim', args: { who: player, claim: `${player} has ${c.args.item}`, kind: 'something the character has', against_interest: false, item: c.args.item, in_world: true, base_share: '65% more than half', share: '65% more than half' } });
        // A climb comes before a drop by the same person: the drop starts from the height the climb reached (a keyed plan
        // lists BodyFall before BodyCheck when written in that order, and the 2nd try ran after the drop it made possible).
        for (const climb of calls.filter(c => c.tool === 'BodyCheck' && c.args.height_m)) {
            const drop = calls.findIndex(c => c.tool === 'BodyFall' && c.args.who === climb.args.who);
            if (drop >= 0 && drop < calls.indexOf(climb)) {
                calls.splice(calls.indexOf(climb), 1);
                calls.splice(drop, 0, climb);
            }
        }
        await runAll(calls);
        // Refused calls: the tool's message goes back once; a corrected call's result replaces the refusal.
        const bad = results.map((r, i) => ({ r, i })).filter(x => REFUSED.test(x.r.result));
        if (bad.length) {
            const fp = hoist(rawPlan(await send(QUESTION_SYSTEM, `${prompt}\n\n${REPAIR.replace('{problems}', bad.map(({ r, i }) => `${r.tool} ${JSON.stringify(calls[i].args)} → ${r.result}${/calendar date/.test(r.result) ? ' Add "time" with the date (TODAY for a present-day scene).' : ''}`).join('\n'))}`)));
            if (fp.at && !scenePosition())
                setScenePosition(fp.at[0], fp.at[1]);
            if (fp.time && storyTime() === null) {
                time = parseStoryTime(fp.time);
                if (time !== null)
                    setStoryTime(time);
            }
            const refusedTools = new Set(bad.map(({ r }) => r.tool)), fixed = validCalls(fp.calls).filter(c => refusedTools.has(c.tool));
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
            // A tool code settled this turn (framed.covered) is answered; a follow-on round takes the others.
            const extra = only ? [...new Set([...plan.need, ...results.some(r => /Call Interpret/.test(r.result)) ? ['Interpret'] : []])].filter(n => !only.has(n) && !framed.covered.has(n)) : [];
            if (only)
                planTools.current = new Set([...only, ...extra]);
            // The tools the open questions named are written this round (a question about the costermonger's apples named
            // Choose and came back with zero calls).
            // Required: the tools the open questions name ("need" only offers tools; requiring them forced a second climb
            // under the merchant's key once Mara's climb had used hers).
            planTools.require = [...new Set(plan.thenTools)];
            // A later round follows the first round's results: anyone in the scene may act in it.
            planTools.actors = [];
            // People drawn this turn (NewCharacter) are keys for the follow-on round.
            planTools.people = [...new Set([...planTools.people, ...Object.keys(store().state.people ?? {})])].slice(0, 32);
            KNOWN_PEOPLE = new Set(planTools.people);
            const added = extra.length ? `MORE TOOLS\n${toolCatalogue(new Set(extra)).split('\n\nOTHER TOOLS')[0]}\n\n` : '';
            const follow = FOLLOW_ON.replace('{results}', results.map((x, i) => `${i + 1}. ${x.tool}: ${storyResult(x.result)}`).join('\n') || '(none)')
                .replace('{then}', [...plan.then, ...results.some(r => /Call Interpret/.test(r.result)) ? ['Which meaning does each listener take from the words a result names?'] : []].map(q => `- ${q}`).join('\n'));
            // A follow-on call that asks again what a call already asked (the ale's price in four more cities) is left out.
            const more = dedupe(validCalls(rawCalls(await send(QUESTION_SYSTEM, `${prompt}\n\n${added}${follow}`))).filter(c => !calls.some(d => sameAsk(d) === sameAsk(c)))).slice(0, MAX_CALLS - calls.length);
            await runAll(more);
            calls = [...calls, ...more];
        }
    }
    // The day's weather is told once: a turn whose Weather result gives the same day's weather as the turn before keeps it
    // in the results for the check and out of [DECIDED] (a reply per result made every reply open on the same rain).
    const day = (r) => r.replace(/;?\s*now about [^;(]*/, '').replace(/\s*\(.*$/, '').trim();
    const w = results.find(r => r.tool === 'Weather'), told = s.weatherTold;
    const prev = told?.turn === turn ? told.prev : told?.key ?? null, key = w ? day(w.result) : prev;
    s.weatherTold = { turn, prev, key };
    s.asked = { turn, calls, results, time, read: READ, present, weatherRepeat: !!w && key === prev };
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
/** This turn's call arguments, in the order of its results. */
export function askedArgs() {
    const ctx = SillyTavern.getContext();
    const a = ctx.chatMetadata ? store().asked : null;
    return a && a.turn === turnKey(ctx.chat) ? a.calls.map(c => c.args) : [];
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
/** A perception that did not happen: the narrator's silence about it says as much (Grice, Quantity), and naming the missed
 *  sound or sight would put it in the reply. Kept in the turn's results for the rule check. */
export const isMiss = (tool, result, args) => !args?.reveals && (tool === 'Listen' || tool === 'Look') && /misses it/.test(result);
/** A result as [DECIDED] lists it: the tool and the person or thing it is about ("BodyFall (the merchant)"), so a result whose
 *  text names no one ("Fall 3 m: lands on the feet") is told of the right person; a merchant's fall was told as Mara's. */
const labelled = (x, args) => { const k = subjectOf(x.tool), v = k && args?.[k]; return typeof v === 'string' && v ? `${x.tool} (${v})` : x.tool; };
const repeatWeather = (tool) => tool === 'Weather' && !!store().asked?.weatherRepeat;
export function decidedInjection() {
    const args = askedArgs(), r = askedResults().map((x, i) => ({ ...x, args: args[i] })).filter(x => !isMiss(x.tool, x.result, x.args) && !repeatWeather(x.tool));
    // The day's weather, told in an earlier reply, holds as an unnumbered line: it bounds what the reply says of the sky and
    // needs no passage of its own (left out entirely, the reply made the mist stop).
    const still = askedResults().find(x => repeatWeather(x.tool));
    if (!r.length && !still)
        return '';
    return `[DECIDED]\nOutcomes the rule engine decided for this reply, numbered. Narrate them as given; they stand.\n${r.map((x, i) => `${i + 1}. ${labelled(x, x.args)}: ${storyResult(x.result)}`).join('\n')}${still ? `\nStill so from earlier (the sky and air as the reply mentions them): ${storyResult(still.result)}` : ''}\n[/DECIDED]`;
}
/** This turn's [DECIDED] results, in their numbered order. */
export function decidedResults() {
    return askedResults().filter((x, i) => !isMiss(x.tool, x.result, askedArgs()[i]) && !repeatWeather(x.tool)).map(x => ({ ...x, result: storyResult(x.result) }));
}
/** A result as the story reads it: the sensitivity note ("Fragile: … → the right heel bone breaks") is for the log, and a
 *  narrator that read one told the other outcome as fact. */
export const storyResult = (r) => r.replace(/\s*Fragile: the outcome changes[\s\S]*$/, '');
