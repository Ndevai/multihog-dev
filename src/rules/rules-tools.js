import { isAdjacentNameTypo } from './keyboard.js';
import { NOISE, BARRIER, SOUNDS, phi as phiN } from './acoustics.js';
import { judgeStatement, EVIDENCE, helpChance, OBEY, obeyShare, REFUSE_SPLIT, PUNISH_ONCE, SMALL_REQUEST_YES, interestChance, SITUATIONS, REQUESTERS, ORDERS, orderChance, asRequester, TRUST_REPAIR, trustAgain, GIVE_WAY_SIZES, GIVE_WAY_REASONS, giveWayChance, trustMeans, shareAround, MISINFO_TAKEN, FALSE_EVENT_TAKEN, CORRECTION_TAKEN, CORRECTION_EXPLAINED_TAKEN, WVS_ACTS, wvsFor, conformShare, faceStrength, lineupPick, FITD_EARLIER, fitdChance, ditfChance } from './social.js';
import { CONTACT_MATERIALS, REGION_WORDS, IMMERSION_WORDS } from './thermal/exposure.js';
import { SUBLOCATION_NAMES } from './df/sublocations.js';
import { findOccupation, drawPerson, wordSex } from './census.js';
import { REGIONS } from './strength.js';
import { learn, knowledgeBlock, recalls, heldOfMessage, unlearn } from './knowledge.js';
import { drawTrait, traitMean } from './personality.js';
import { OPTION_KINDS, optionFactor } from './choice.js';
import { jumpDistanceM, liftCapacityKg, featChance, featZ, JUMP_MIN_AGE, handgunHitChance } from './feats.js';
import { evacuate, PACES } from './crowd.js';
import { ABOUT, MATTERS, TYPES, occTypes, lastsWords, EMOTION_WORDS, EMOTION_HOURS, LASTS_H } from './emotion.js';
import { stateKey, conduciveness, jointOf } from './expression-set.js';
import { skyLight, clearDayWh } from './sky.js';
import { fetchZone, civilOffsetH } from './zone.js';
import { LININGS, MATERIALS, GROUNDS, MATERIAL_NAMES, material, ropeBreakKg, rodBreakKg, plankBreakKg } from './materials.js';
import { findPlace, simulatePlaceYear, hourTemp, placeCountry, rainBoxes, rainNow, fold } from './weather.js';
import { observedDay, cachedDay, reanalysisMissed } from './reanalysis.js';
import { NORMALS } from './data/wmo-normals.js';
import { price, poundSilver, PRICE_QUESTIONS, GOODS_LIST, TRADES, CITIES, BASKET_ONLY, basketWage, referencePrice } from './prices.js';
import { drawName } from './names.js';
import { bodySize, BUILDS, bmiZOf } from './body-size.js';
import { WATER_SOURCES, drinkWater } from './waterborne.js';
import { pigment } from './pigment.js';
import { TRAITS, LEVELS, POLES, STRENGTHS, BEHAVIOURS, SITUATIONS as SETTINGS, levelZ, stateShare, settingRatio, matchPastAct, pastActShare, pastActTrait } from './acts.js';
import { DISEASES, INCUBATION, R0, incubationHours, attackShare, EPIDEMICS, EPIDEMIC_NAMES, deathCause } from './disease.js';
import { BATTLE_YEARS, attackWinShare, battleCost } from './battle.js';
import { CLIMBERS, gauss, person, seeLux, addWound, treat, advanceAll, cast, fall, status, seededRng, strike, reachOf, check, checkChance, openWound, findPart, creatureOf, FUNCTIONS, communicate, intake, choke, setEnvironment, setAltitude, swimShare, contactBurn, listen, look, holdLoad, chase, hearChance, topSpeedKmh } from './body-engine.js';
import { thermalCapable } from './thermal/exposure.js';
import { actTogether, honest, stepsFromWords, MOTION_START } from './actions.js';
import { see, LIGHT, adaptedLux, DRESSED, AGAINST, figureContrast, diffuseShare, acuityOf, ageAcuity } from './vision.js';
import { tellsShown, kindsWithTells } from './tells.js';
import { GIVEN_NAMES } from './data/given-names.js';
import { sizeOf, SIZE_KINDS } from './sizes.js';
import { NAMED_AS } from './kinds.js';
import { TITLE } from './frame.js';
import { parseFormula, molarMass } from './substance.js';
import { airHook, inRoom, roomOf, describeAir, drawAch, exchangeM3s, FIRE_FUELS, OUT_O2, LINING } from './rooms.js';
import { formatStoryTime, spokenTime } from './clock.js';
import { drawDay, daysHold, doingAt, nextChange, whereBlock, NIGHT_SHIFT } from './days.js';
import { hungerFor, feed, release } from './hunger.js';
import { meetRate, meetChance, meet } from './meetings.js';
import { townWork } from './town.js';
import { diff, apply, record, truncate, truncateTo, verify, rebuilt } from './world-log.js';
import { violations } from './invariants.js';
import { mapOf, area, roomAt, straight } from './map.js';
import { loadDrugs, startDose } from './drugs.js';
import { resetUsed, fragileCandidates, withOverride, def, memo, k as kc, peek, reaches } from './constants.js';
import { TASK_KINDS } from './verbs.js';
import { heatingValue, heatFromFormation, loadChem, findCompound, describe as describeCompound, loadFuels, describeFuel, describeMixture } from './chem.js';
import { CONTENTS } from './freezing.js';
import { TERRAIN, walkWatts, runWatts, metOf, walkSpeedKmh } from './work.js';
import { ENSEMBLES, GARMENTS } from './thermal/ensembles.js';
import { loadRaws, creatureId, creature, meleeWeaponNames, weaponMetalNames } from './df/index.js';
import { SKILL_LEVELS, STYLES } from './df/combat.js';
import { turnKey, placeOf, lineOf } from './turn.js';
import { prepareBleeding } from './pulse.js';
import { rollFormula, parseTable, pickTier } from './dice.js';
import { PROBLEMS, solveShare, isIntention, studentZ } from './thinking.js';
import { cannotExist, notYetIn } from './history.js';
import { strangerAgeSex, strangerWork, strangerHousehold, skillShare, spokenThere, speakShare, faithShare, survival, FAITHS, heightShift, wageRatio, activityMet, neverMarriedShare, climateShift, wageByTrade, countryFact, cityNear, cityPopulation, eisnerHomicide } from './population.js';
import { H_YEARS } from './data/body-size.js';
import { CURRENT_BOOK, farFrom, worldHasMagic } from './world.js';
import { SICK_SITUATIONS, sickness } from './sickness.js';
import { HOW, transfer, give, account, possessionsBlock } from './possessions.js';
import { sharedIn, sharedWith, whisperedAs, noisyAs, languageCode, soundOf } from './colex.js';
import { resolveLanguage, stageKey } from './languages.js';
import { str, checkArgs } from './tool-schema.js';
import { FEELINGS, heardRight } from './prosody.js';
import { untagged } from './voice-code.js';
import { fitProps, GUN_YEAR } from './scene-fit.js';
import { routedTools } from './router.js';
export const TOOLS = ['Trust', 'Interpret', 'WorkOut', 'Sickness', 'Transfer', 'Claim', 'RollTheDice', 'Battle', 'BodyEnvironment', 'BodyChoke', 'BodyIntake', 'Communicate', 'Listen', 'Look', 'SocialResponse', 'NewCharacter', 'Break', 'RecordFact', 'Appraise', 'Price', 'PlaceProfile', 'NameCharacter', 'BodySize', 'Disease', 'Weather', 'Substance', 'Act', 'Room', 'Dose', 'Layout', 'Choose', 'HoldOn', 'Chase', 'BodyCheck', 'BodyWound', 'BodyStrike', 'BodyTreat', 'BodyContact', 'PassTime', 'CastSpell', 'BodyFall', 'BodyStatus', 'TrueNature', 'Touch'];
const KEEP_SNAPSHOTS = 30;
/** Tools registered while the engine is on, by name. */
export const REGISTRY = new Map();
/** The scene the tools' words are fitted to: the story's year and whether its world has magic (scene-fit.ts). */
export const sceneNow = () => ({ year: storyYearNow(), magic: worldHasMagic(), country: SillyTavern.getContext().chatMetadata ? store().state.setting?.country ?? null : null });
const FITTED = new Map();
/** A tool as the scene allows it (its options, arguments and its use: scene-fit.ts), or null when it has no use there. */
export function fittedTool(name, scene = sceneNow()) {
    const t = REGISTRY.get(name);
    if (!t)
        return null;
    const key = `${name}|${scene.year}|${scene.magic}|${scene.country ?? ''}|${REGISTRY.size}`;
    if (!FITTED.has(key)) {
        const props = MAGIC_TOOLS.has(name) && !scene.magic ? null : fitProps(name, t.properties, t.required, scene);
        FITTED.set(key, props ? (props === t.properties ? t : { ...t, properties: props, required: t.required.filter(k => k in props) }) : null);
    }
    return FITTED.get(key);
}
/** The World Values Survey act that words name (WVS_ACTS index), or -1: the act's own words, else the one act sharing the
 *  most content words with them (stems of 4 letters or more), with a few everyday names [ASSUMED list]. The list goes to the
 *  model only when its words match none, so a scene is shown the acts it names. */
const ACT_NAMES = [[/\b(kill(s|ed|ing)? (him|her|my|them|your|one)sel(f|ves)|take (his|her|their|my) own life)\b/, 10], [/\b(gay|homosexual|same-sex)\b/, 5], [/\b(bribe|bribes|bribed|bribery)\b/, 4], [/\b(fare[- ]dodg|jump(ed|ing)? the fare)/, 1], [/\b(execution|hang(ing)? (him|her|them)|capital punishment)\b/, 18]];
export function surveyAct(text) {
    const t = text.toLowerCase().trim(), exact = WVS_ACTS.indexOf(t);
    if (exact >= 0)
        return exact;
    for (const [re, i] of ACT_NAMES)
        if (re.test(t))
            return i;
    const stems = (x) => new Set((x.match(/[a-z]{4,}/g) ?? []).filter(w => !/^(with|from|that|their|them|they|other|given|chance|course|ones?|people)$/.test(w)).map(w => w.slice(0, 5)));
    const mine = stems(t), score = WVS_ACTS.map(a => [...stems(a)].filter(w => mine.has(w)).length), best = Math.max(...score);
    return best > 0 && score.filter(x => x === best).length === 1 ? score.indexOf(best) : -1;
}
/** The tools the narrator is offered when the question pass did not run: those the router finds in the player's last line,
 *  with the ones every turn may need, or every tool the scene has a use for when it finds none (function-calling accuracy
 *  falls as the functions offered grow: Patil et al. 2025, BFCL). */
function offeredNow() {
    const chat = (SillyTavern.getContext().chat ?? []).filter(m => !m.is_system), at = chat.map(m => !!m.is_user).lastIndexOf(true);
    const last = at >= 0 ? String(chat[at].mes ?? '') : '', prior = at > 0 ? chat.slice(Math.max(0, at - 2), at) : [];
    return routedTools(last, n => !!fittedTool(n), [], prior.map(m => String(m.mes ?? '')), prior.filter(m => !m.is_user).map(m => String(m.mes ?? ''))) ?? new Set(sceneTools().map(t => t.name));
}
/** Every tool the scene has a use for, as the scene allows it. */
export const sceneTools = (scene = sceneNow()) => [...REGISTRY.keys()].map(n => fittedTool(n, scene)).filter((t) => !!t);
/** Replays the history on its base: whether it rebuilds the current state exactly. */
export function historyCheck() {
    const s = store(), h = s.history;
    if (!h?.log.length)
        return 'No recorded changes yet.';
    const bad = verify(h, s.state);
    const tools = Object.entries(h.log.reduce((m, e) => (m[e.tool] = (m[e.tool] ?? 0) + 1, m), {})).map(([t, n]) => `${t} ${n}`).join(', ');
    return `${h.log.length} recorded changes (${tools}). Replay ${bad ? `does NOT rebuild the state; differs at ${bad} (a change was made outside the tools)` : 'rebuilds the current state exactly'}.`;
}
/** Tools offered only in worlds whose book has magic (world.ts worldHasMagic). */
export const MAGIC_TOOLS = new Set(['CastSpell']);
export function store() {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.rulesEngine ??= { state: { people: {} }, snapshots: {}, version: STATE_VERSION };
    const s = ctx.chatMetadata.rulesEngine;
    s.salt ??= crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    if ((s.version ?? 1) < STATE_VERSION) {
        migrate(s.state);
        for (const snap of Object.values(s.snapshots ?? {}))
            migrate(snap.state);
        if (s.lineStart)
            migrate(s.lineStart.state);
        s.version = STATE_VERSION;
    }
    return s;
}
// State saved in a chat outlives the code that wrote it: each version step converts older state in place, idempotently.
// 2: a character's weather place became a place key ("wgen:Boston, MA", "wmo:<index>") instead of a WGEN station name.
const STATE_VERSION = 2;
function migrate(st) {
    for (const p of Object.values(st?.people ?? {}))
        if (p.weather && !p.weather.includes(':'))
            p.weather = `wgen:${p.weather}`;
}
/** Saves the engine's state of this chat (for a change made outside a tool call, as the seed's wants). */
export const saveState = () => save();
function save() {
    const ctx = SillyTavern.getContext();
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
}
const startOf = (m) => m?.extra?.rulesStart;
/** Keeps on the player's line at chat index `i` the world now, as the world it starts from (its first pass is about to run;
 * a correction's, once the world is put back). A line edited in place keeps the start it has, unless `put` (a correction
 * put the world back before the line it corrects: that world is the line's start now). */
export function keepStart(i, put = false) {
    const m = SillyTavern.getContext().chat?.[i];
    if (!m || (startOf(m) && !put))
        return;
    const s = store();
    m.extra ??= {};
    m.extra.rulesStart = { state: structuredClone(s.state), calls: s.calls ?? 0, n: s.history?.n ?? 0 };
    prune(i);
}
/** The question pass of the player's line at chat index `i`, kept on it (`extra.rulesPass`) as the store keeps the latest. */
export function keepPass(i, asked) {
    const m = SillyTavern.getContext().chat?.[i];
    if (!m)
        return;
    m.extra ??= {};
    m.extra.rulesPass = structuredClone(asked);
}
export const keptPass = (i) => SillyTavern.getContext().chat?.[i]?.extra?.rulesPass;
/** Whether the player's line at chat index `i` has had a first pass (it keeps its start). */
export const hasStart = (i) => !!startOf(SillyTavern.getContext().chat?.[i]);
/** Puts the world back at `start`, its record cut to the changes it held then (or, for a start without that count, to chat
 * index `cut`), so the record rebuilds the world (settle; the entry belongs to message `at`). */
function restoreAt(start, at, cut) {
    const s = store();
    s.state = structuredClone(start.state ?? start);
    s.calls = start.calls ?? 0;
    if (s.history) {
        if (start.n != null)
            truncateTo(s.history, start.n, s.state);
        else
            truncate(s.history, cut, s.state);
        settle(s.history, at);
    }
}
/** Puts the world back as it stood before the player's line at chat index `userIndex` was acted on (the start it keeps; for a
 * chat from before lines kept one, the snapshot taken when that turn began), for a correction of that line
 * (question-pass.ts): its record of changes goes with it. False when no start is held. The correction's own line then keeps
 * this world as its start, so a swipe or a regenerate of its reply starts here too. */
export function restoreTurnStart(userIndex) {
    const s = store(), chat = SillyTavern.getContext().chat ?? [];
    const snap = startOf(chat[userIndex]) ?? s.snapshots[userIndex] ?? s.snapshots[userIndex + 1];
    if (!snap)
        return false;
    restoreAt(snap, userIndex - 1, userIndex + 1);
    s.decided = null;
    save();
    return true;
}
/** Puts the world back as it stood when the player's line at chat index `userIndex` began, before its question pass runs its
 * calls again (question-pass.ts): the start the line keeps (whichever order SillyTavern added it in, and after later lines
 * are deleted: a correction's start stays the world it put back). For a chat from before lines kept one: the start the
 * engine kept for the latest line then, else the world the message before the line ended with, else the snapshot taken as
 * the line joined. The reply's place takes the same start, so a swipe of it does too. */
export function restoreLineStart(userIndex) {
    const s = store(), chat = SillyTavern.getContext().chat ?? [];
    const before = chat[userIndex - 1], prior = savedOf(before);
    const kept = startOf(chat[userIndex]) ?? (s.lineStart && s.lineStart.place === placeOf(turnKey(chat)) ? s.lineStart
        : prior ? { state: prior, calls: 0, n: before.extra?.rulesLog?.[keyOf(before)] } : null);
    const snap = kept ?? s.snapshots[userIndex];
    if (!snap)
        return false;
    restoreAt(snap, userIndex, userIndex + 1);
    s.snapshots[userIndex + 1] = { state: structuredClone(s.state), calls: s.calls ?? 0 };
    s.decided = null;
    save();
    return true;
}
/**
 * GENERATION_STARTED. State is saved per chat position: the message about to be written sits at
 * chat.length, a swipe or regenerate rewrites the last one. After tool calls SillyTavern stores the
 * results as a message and starts a second 'normal' generation for the reply; that one is saved at
 * its own position, so a swipe of the reply keeps the tools' effects.
 */
export function onRulesGenerationStarted(type) {
    reshuffle(SHARES);
    reshuffle(TASK_KINDS);
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return;
    const s = store();
    const chat = ctx.chat || [];
    const rewrites = (type === 'swipe' || type === 'regenerate') && chat.length && !chat[chat.length - 1].is_user;
    if (rewrites) {
        // The reply is rewritten from the world before it: after the narrator's tool calls, the last one's (their messages stay
        // in the chat); right after the player's line, the start the line keeps (a correction's: the world it put back, which
        // the snapshot by chat position, taken before the correction ran, did not hold). For a chat from before lines kept
        // starts: GENERATION_STARTED of a normal turn fires before the player's message joins the chat, so that turn's
        // snapshot sits at the player's message (length − 2); one taken with the message already in sits at the reply
        // (length − 1). A London 1867 rewrite found neither under the old key alone and ran the turn's Act calls a second time
        // on the moved clock.
        const prev = chat[chat.length - 2], log = prev?.extra?.rulesLog;
        const from = prev && !prev.is_user && savedOf(prev) ? { state: savedOf(prev), calls: s.calls ?? 0, n: log?.[keyOf(prev)] } : prev?.is_user ? startOf(prev) : undefined;
        const snap = from ?? s.snapshots[chat.length - 1] ?? s.snapshots[chat.length - 2];
        if (snap)
            restoreAt(snap, chat.length - 2, chat.length - 1);
        s.decided = null;
    }
    else if ((type === 'swipe' || type === 'regenerate') && chat.at(-1)?.is_user) {
        // A regenerate of a turn that has no reply (the request failed or was stopped after the question pass ran) starts from
        // the line's start (restoreLineStart); the pass replays the turn's calls on that state.
        restoreLineStart(chat.length - 1);
        s.decided = null;
    }
    else if (!type || type === 'normal') {
        if (chat.at(-1)?.is_user)
            s.calls = 0;
        s.snapshots[chat.length] = { state: structuredClone(s.state), calls: s.calls || 0 };
        // The last message that is no player's line, with no line after it holding a result: the world it ended with, kept
        // on it if it has none (the greeting: the start; a narrator's tool call: its effect), for a deletion back to it.
        let last = chat.length - 1;
        while (last >= 0 && chat[last]?.is_user)
            last--;
        if (last >= 0 && !savedOf(chat[last]) && chat.slice(last + 1).every(m => !savedOf(m)))
            keepResult(last);
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS))
            delete s.snapshots[k];
    }
}
/** MESSAGE_RECEIVED: keep the state each swipe ended with. */
export function onRulesMessageReceived(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!ctx.chatMetadata || !msg || msg.is_user || msg.is_system)
        return;
    countLooks(messageId);
    keepResult(messageId);
    // The question pass's calls for this reply, for /rules-stats.
    const asked = store().asked;
    if (asked?.turn === turnKey(ctx.chat))
        (msg.extra.rulesAsked ??= {})[msg.swipe_id ?? 0] = asked.calls;
    (ctx.saveChatDebounced || ctx.saveChat)?.();
}
/** The looks' counts (expression-set.ts, section 111): each tracked person's look state as a reply comes, the one they show
 *  while it is read; kept with the world and in the record, so a swipe or a deletion takes its count with it. */
function countLooks(messageId) {
    const s = store(), before = structuredClone(s.state), now = storyTime();
    for (const p of Object.values(s.state.people ?? {})) {
        if (p.dead)
            continue;
        const key = jointOf(p, now);
        (s.state.faced ??= {})[key] = (s.state.faced[key] ?? 0) + 1;
    }
    const ops = diff(before, s.state);
    if (ops.length) {
        s.history ??= { base: before, log: [], n: 0 };
        record(s.history, { msg: messageId, tool: 'looks counted', args: {}, draws: [], ops });
    }
}
/** MESSAGE_SWIPED: returning to an earlier swipe restores the state it ended with. */
/** States each swipe of a reply ended with, by swipe id; a player's line (its pass) and a narrator's tool call by 0: kept in
 * the chat's world archive by id (`extra.rulesWorld`), or whole on a message kept before the archive (`extra.rulesResult`). */
const resultsOf = (m) => m?.extra?.rulesResult;
const worldIdsOf = (m) => m?.extra?.rulesWorld;
const keyOf = (m) => m.is_user || m.is_system ? 0 : m.swipe_id ?? 0;
/** The world a message ended with in swipe `k`, or undefined. */
const savedFor = (m, k) => { const id = worldIdsOf(m)?.[k]; return id ? worldOf(id) ?? undefined : resultsOf(m)?.[k]; };
/** The world a message ended with (the swipe shown, for a reply), or undefined. */
const savedOf = (m) => m ? savedFor(m, keyOf(m)) : undefined;
// The world archive: each world a message keeps is stored as the changes from the world stored before it (world-log.ts diff),
// whole every WORLD_CHAIN worlds, so a long chat keeps one world per reply at the size of what changed in it (the chat had
// grown with the square of its length: 1.09 MB at 120 turns, each reply holding the whole world). Messages hold ids, so a
// deletion anywhere leaves every other message's world readable; worlds no message reaches go (collectWorlds).
const WORLD_CHAIN = 50; // [ASSUMED: reading a world applies at most 50 diffs, a few milliseconds]
// Worlds read, by archive (a chat loaded or branched has its own) and id; read only (restore and restoreAt copy them).
const WORLD_CACHE = new WeakMap();
function worldOf(id) {
    const s = store();
    if (!s.worlds)
        return null;
    const cache = WORLD_CACHE.get(s.worlds) ?? WORLD_CACHE.set(s.worlds, new Map()).get(s.worlds), hit = cache.get(id);
    if (hit)
        return hit;
    const chain = [];
    for (let at = id; at; at = s.worlds?.[at]?.base) {
        const w = s.worlds?.[at];
        if (!w)
            return null;
        chain.push(w);
        if (w.full)
            break;
    }
    if (!chain.at(-1)?.full)
        return null;
    const out = chain.reverse().reduce((st, w) => w.full ? structuredClone(w.full) : apply(st, w.ops ?? []), {});
    if (cache.size > 64)
        cache.clear();
    cache.set(id, out);
    return out;
}
function putWorld(state) {
    const s = store(), worlds = s.worlds ??= {}, id = `w${s.worldSeq = (s.worldSeq ?? 0) + 1}`;
    const head = s.worldHead && worlds[s.worldHead] ? s.worldHead : undefined, base = head ? worldOf(head) : null, depth = head ? worlds[head].depth + 1 : 0;
    worlds[id] = base && depth < WORLD_CHAIN ? { base: head, ops: diff(base, state), depth } : { full: structuredClone(state), depth: 0 };
    s.worldHead = id;
    if (s.worldSeq % 25 === 0)
        collectWorlds();
    return id;
}
/** Drops the worlds no message of the chat reaches (directly or as the base of one that does), the latest kept. */
function collectWorlds() {
    const s = store(), worlds = s.worlds;
    if (!worlds)
        return;
    const keep = new Set(), mark = (id) => { while (id && !keep.has(id) && worlds[id]) {
        keep.add(id);
        id = worlds[id].base;
    } };
    for (const m of SillyTavern.getContext().chat ?? [])
        for (const id of Object.values(worldIdsOf(m) ?? {}))
            mark(id);
    mark(s.worldHead);
    for (const id of Object.keys(worlds))
        if (!keep.has(id))
            delete worlds[id];
}
/** After the world is put back and its record cut to match: when the record no longer rebuilds it (a change it kept went
 * with a later cut, as a swipe's turn goes when another swipe is made), one entry holds the difference, so /rules-replay
 * rebuilds the world shown; it belongs to message `msg`, so a later cut at or before it takes it too. */
function settle(h, msg, tool = 'restored', args = {}) {
    const ops = diff(rebuilt(h), store().state);
    if (ops.length)
        record(h, { msg, tool, args, draws: [], ops });
}
/** Whether a question pass has run for the player's line at chat index `i` (it keeps the world its pass left). */
export const passRanFor = (i) => !!savedOf(SillyTavern.getContext().chat?.[i]);
/** Keeps on the message at chat index `i` the world now, by its id in the archive, and how many changes the record held then
 * (`extra.rulesWorld`, `extra.rulesLog`): a reply's swipe when it is received, a player's line when its pass has run, a
 * narrator's tool call and the greeting when a generation starts from them. */
export function keepResult(i) {
    const m = SillyTavern.getContext().chat?.[i];
    if (!m)
        return;
    const s = store(), k = keyOf(m);
    m.extra ??= {};
    (m.extra.rulesWorld ??= {})[k] = putWorld(s.state);
    if (resultsOf(m)?.[k])
        delete resultsOf(m)[k];
    (m.extra.rulesLog ??= {})[k] = s.history?.n ?? 0;
    prune(i);
}
/** Player's lines and narrator's tool calls more than KEEP_SNAPSHOTS messages before chat index `i` let go of the worlds they
 * keep: only the latest turns are redone, and a deletion that far back starts from the reply before. Replies keep the world of
 * the swipe shown, for a deletion back to one or a branch from it; their other swipes' worlds go, since only the last message
 * can be swiped (a swipe back to another swipe of a reply that far back, once deleted back to, keeps the world shown). */
function prune(i) {
    const chat = SillyTavern.getContext().chat ?? [];
    for (let j = 0; j < i - KEEP_SNAPSHOTS; j++) {
        const m = chat[j];
        if (!m?.extra)
            continue;
        if (!(m.is_user || m.is_system)) {
            const k = keyOf(m), r = m.extra.rulesResult, l = m.extra.rulesLog, w = worldIdsOf(m);
            if (r?.[k] && Object.keys(r).length > 1)
                m.extra.rulesResult = { [k]: r[k] };
            if (w?.[k] && Object.keys(w).length > 1)
                m.extra.rulesWorld = { [k]: w[k] };
            if (l?.[k] != null && Object.keys(l).length > 1)
                m.extra.rulesLog = { [k]: l[k] };
            continue;
        }
        delete m.extra.rulesResult;
        delete m.extra.rulesWorld;
        delete m.extra.rulesLog;
        delete m.extra.rulesStart;
        delete m.extra.rulesPass;
    }
}
export function onRulesSwiped(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    const saved = ctx.chatMetadata ? savedFor(msg, msg?.swipe_id ?? 0) : undefined;
    if (!ctx.chatMetadata || !saved)
        return;
    restore(saved);
    // The record of changes follows the swipe shown: the turn's changes, as the swipe made last left them, go, and one entry
    // holds what the swipe shown changed in the turn, so /rules-replay rebuilds the world shown (its calls one by one are not
    // kept: the reply keeps only the state it ended with).
    const s = store(), h = s.history;
    if (!h)
        return;
    const line = (ctx.chat ?? []).slice(0, messageId).map((m, i) => m?.is_user ? i : -1).filter(i => i >= 0).pop() ?? -1;
    const n = startOf(ctx.chat?.[line])?.n;
    if (n != null)
        truncateTo(h, n, s.state);
    else
        truncate(h, line + 1, s.state);
    settle(h, messageId, 'swipe shown', { swipe: msg?.swipe_id ?? 0 });
    save();
}
function restore(saved) {
    const s = structuredClone(saved);
    migrate(s);
    store().state = s;
    save();
}
/** CHAT_CHANGED / MESSAGE_DELETED: state = what the last message holding a result ended with (a reply's shown swipe, a
 * player's line, a narrator's tool call, the greeting), so a branch or deletion starts from its own point: a line left with
 * no reply after it keeps its outcome, as it stays in the chat for the narrator to read. With none holding a result (a chat
 * from before results were kept on lines), the latest snapshot at or before the chat's end. */
export function syncRulesToChat() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return;
    const chat = ctx.chat || [];
    let at = chat.length - 1;
    while (at >= 0 && !savedOf(chat[at]))
        at--;
    const msg = at >= 0 ? chat[at] : undefined, saved = savedOf(msg), n = msg ? msg.extra?.rulesLog?.[keyOf(msg)] : undefined;
    const s = store();
    collectWorlds();
    // A line deleted takes its pass with it: a new line at its place is a new turn, not that line edited (question-pass.ts).
    if (s.asked && Number(placeOf(s.asked.turn)) > chat.filter(m => m?.is_user).length) {
        s.asked = undefined;
        s.lineStart = undefined;
    }
    // The record keeps the changes it held when that message's world was kept; a reply kept before that, the changes up to
    // its turn (its calls ran with the chat at its index).
    if (saved) {
        restore(saved);
        if (s.history) {
            if (n != null)
                truncateTo(s.history, n, s.state);
            else
                truncate(s.history, at + 1, s.state);
            settle(s.history, at);
        }
        return;
    }
    const from = Object.keys(s.snapshots ?? {}).map(Number).filter(k => k <= chat.length).sort((a, b) => b - a)[0];
    if (from == null)
        return;
    const snap = s.snapshots[from];
    restore(snap.state ?? snap);
    if (s.history)
        truncate(s.history, from + 1, s.state);
}
// The narrator gets the outcome only: chances, intermediate values and citations are salient details that anchor or
// leak into the narration (models are distracted by irrelevant context: Shi et al. 2023, ICML), and so are a sound's
// level in dB and a value's status tag. The full text goes to the browser console.
const DETAIL = /\s*\([^()]*(?:%|\b(?:1[89]|20)\d\d\b|\bSII\b|chance|\bdB\b)[^()]*\)|\s*\[(?:ASSUMED|FITTED|RAW|estimated|from its)\b[^\]]*\]/g;
const ODDS = /\b(?:death )?chance \d+(?:\.\d+)? ?%\s*(?:→|—)\s*/g;
/** A result as the story reads it: the sensitivity note ("Fragile: …") is for the log and the player's note; a narrator
 *  that read one told the other outcome as fact. */
export const storyText = (r) => r.replace(/\s*Fragile: the outcome changes[\s\S]*$/, '');
export function plain(out) {
    if (typeof out !== 'string')
        return out;
    const short = out.replace(DETAIL, '').replace(ODDS, '');
    if (short !== out)
        console.debug('[Rules engine]', out);
    return short;
}
// A decision tool called again in one turn for the same actor and act returns its first result, like RollTheDice's ledger,
// so an unwanted outcome cannot be re-rolled by calling again (models drop correct answers when pushed: Sharma et al. 2024).
const norm = (v) => String(v ?? '').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
const DECIDES = { RollTheDice: a => [a.who, a.for], Claim: a => [a.who, a.claim], Transfer: a => [a.item, a.from, a.to, a.how], WorkOut: a => [a.who, a.problem], Sickness: a => [a.who, a.situation], BodyCheck: a => [a.who, a.task], Communicate: a => [a.speaker, a.listener, a.means, a.effort], Interpret: a => [a.listener, a.speaker, a.word], Trust: a => [a.who, a.other, a.event], Listen: a => [a.listener, a.sound ?? a.spl_db],
    Look: a => [a.viewer, a.target ?? a.size_m], SocialResponse: a => [a.situation, a.who, a.speaker ?? a.request ?? '', a.act ?? '', a.statement ?? '', a.target_who ?? '', a.culprit_present ?? '', a.sequential ?? '', a.other_group ?? '', a.earlier ?? '', a.later_day ?? '', a.same_requester ?? ''],
    HoldOn: a => [a.who], Chase: a => [a.pursuer, a.fleeing],
    Weather: a => [a.place], Choose: a => [a.who, ...(a.options ?? []).map(o => o?.option).sort()], NewCharacter: a => [a.who], NameCharacter: a => [a.who], BodySize: a => [a.who], Disease: a => [a.question, a.disease, a.who ?? a.population], Battle: a => [a.place, a.year] };
const decisionKey = (name, a) => { const f = DECIDES[name]; return f ? [name, ...f(a ?? {})].map(norm).join('|') : null; };
function decisions() {
    const s = store(), turn = turnKey(SillyTavern.getContext().chat);
    if (s.decided?.turn !== turn)
        s.decided = { turn, out: {} };
    return s.decided.out;
}
const decided = (name, a) => { const k = decisionKey(name, a); return k ? decisions()[k] : null; };
// A refusal (an argument or the date missing) decides nothing, so a corrected call runs instead of repeating it.
const REFUSAL = /fix and call again|State unchanged\.?\s*$|needs a calendar date|^Give /;
function remember(name, a, out) { const k = decisionKey(name, a); if (k && typeof out === 'string' && !REFUSAL.test(out)) {
    decisions()[k] = out;
    save();
} }
// Same turn + same call order → same random draws, so a swipe repeats outcomes instead of re-rolling them. The turn is its
// line's words (turn.ts lineOf), not its place: a deletion before the line moves its place, and a swipe after it re-rolled.
// The call count tells apart two lines of the same words.
// The draws each call used, kept with its result (question-pass.ts), so an outcome can be traced: same state, same
// draws, same result; /rules-log shows them.
export let LAST_DRAWS = [];
export const clearDraws = () => { LAST_DRAWS = []; };
// The chat a running call belongs to: a call whose action waited (weather, sky, bleeding, chemistry data) writes nothing once
// another chat is open.
let CALLING = null;
function run(fn) {
    if (CALLING && SillyTavern.getContext().chatMetadata !== CALLING)
        throw new Error('[Rules engine] another chat was opened while a tool waited; nothing was decided');
    const s = store();
    s.calls = (s.calls || 0) + 1;
    const seeded = seededRng(`${s.salt}:${lineOf(turnKey(SillyTavern.getContext().chat))}:${s.calls}`), draws = [];
    const rng = () => { const v = seeded(); draws.push(v); return v; };
    LAST_DRAWS = draws;
    // Every body reads the story clock (alertness follows the time of day).
    const now = s.state ? storyNow(s.state) : null;
    if (now != null)
        for (const p of Object.values(s.state.people ?? {}))
            p.clockMin = now;
    // What a feeding left (hunger.ts) is common knowledge once it has been found.
    if (now != null && s.state)
        release(s.state, now);
    const out = fn(s.state, rng);
    save();
    return out;
}
// BodyCheck's success share as labelled bands: words and bands are the verbal-confidence form models can be taught to
// calibrate (Lin, Hilton & Evans 2022, TMLR); band values [ASSUMED]. A bare number is still read. Models prefer options by
// position and label rather than content (selection bias, Zheng et al. 2024, ICLR): each band carries its meaning in its text.
const shuffled = (list) => list.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
// Reshuffled in place before every generation, so the order changes per call rather than per load (Zheng et al. 2024).
const reshuffle = (list) => { const o = shuffled(list); list.splice(0, list.length, ...o); };
// Closed lists from the DF raws (melee weapons; weapon metals plus bone and wood for ammunition), filled after load.
const MELEE = [], WEAPON_MATERIALS = [];
// How a character came to know a fact: Aikhenvald's (2004, Evidentiality) six sources marked by the world's evidential
// systems (visual, non-visual sensory, inference, assumption, hearsay, quotative).
const KNOWN_HOW = ['saw it', 'heard, smelled or felt it', 'inferred from what they saw', 'assumed from what they know', 'told by someone', 'hearsay'];
// Every sense writes to the same knowledge: what Look identifies, Listen hears and Communicate carries is learned with its
// source, so a secret reaches another character only through a perception the engine decided.
function learnt(st, fact, who, how) {
    const f = learn(st, fact, [who], false, { [who]: how });
    return f.text.replace(/[.!?]?$/, '.');
}
// A recorded fact the claim names: most of its words (≥ 60 % of the longer one's, [ASSUMED]) in common.
const words = (t) => new Set(t.toLowerCase().match(/\p{L}{3,}/gu) ?? []);
function recordedFact(st, text) {
    const w = words(text);
    return (st.facts ?? []).find(f => { const v = words(f.text); const both = [...w].filter(x => v.has(x)).length; return both / Math.max(w.size, v.size, 1) >= 0.6; });
}
// Body parts and kin are possessed without being owned or handed over (inalienable possession: Nichols 1988, the classes
// languages most often mark apart), and a tracked person is a character, not an item.
/** "a 24", "an 80", "an 18", "an 11": the article as the number is said. */
const aYears = (n) => `${/^8/.test(String(n)) || n === 11 || n === 18 ? 'an' : 'a'} ${n}`;
const ITEM_IS = ['a thing (a severed or preserved body part counts)', 'a person or animal', 'a part of a living body'];
function inalienable(st, item, is) {
    const t = item.trim().toLowerCase().replace(/^(?:my|his|her|their|our|your|a|an|the) /, '');
    if (is === ITEM_IS[1] || Object.keys(st.people ?? {}).some(n => n.toLowerCase() === t))
        return `"${item}" is a person; their moves come from the story and the people tools`;
    if (is === ITEM_IS[2])
        return `"${item}" is a body part; it goes with the body (BodyWound, BodyStrike, BodyTreat)`;
    return '';
}
const SOCIAL = ['a statement that might be a lie', 'an emergency they witness', 'an order to hurt someone', 'a small favour asked by a stranger', 'a brief first meeting', 'an order from a stranger', 'a stranger asks to go first', 'an offered split they can refuse so neither gets anything', 'a chance to punish someone who cheated the group, at a cost to themselves', 'a chance to hand something of value to a stranger who could keep it', 'a chance to give back part of what a trusting stranger handed them', 'told a false detail about an event they saw', 'urged to remember a made-up event from their own past', 'an act they see or hear of that they may condemn outright', 'a group around them all state something they can see is wrong', 'a witness looks over a lineup of six for someone they saw', 'asked a bigger favour after a small one for the same cause', 'asked a small favour right after refusing a large one', 'sees, reads or hears something that shows what they remember is wrong'];
const SHARES = shuffled(['95% nearly everyone', '80% most', '65% more than half', '50% half', '35% fewer than half', '20% few', '5% almost no one']);
const shareOf = (v) => typeof v === 'number' ? v : (parseFloat(String(v)) || 0) / 100;
// The chance for this attempt combines the narrator's estimate with the share of its reference class, asked for first:
// an equal-weight average in log-odds. Averaging a model's forecast with a reference forecast beat the model's own updating
// (Schoenegger et al. 2024, Sci Adv eadp1528); combine in log-odds rather than probability (Satopää et al. 2014;
// Lichtendahl et al. 2020); the reference class comes before the estimate (Kahneman & Tversky 1977, steps 1–3). Language
// models already hedge toward the middle (Halawi et al. 2024; Baron et al. 2012), so no further shrinking is applied.
const logit = (p) => Math.log(p / (1 - p)), clamp01 = (p) => Math.min(0.995, Math.max(0.005, p));
function combined(a) {
    const est = shareOf(a.share);
    if (a.base_share == null)
        return est;
    const z = (logit(clamp01(est)) + logit(clamp01(shareOf(a.base_share)))) / 2;
    return 1 / (1 + Math.exp(-z));
}
const species = str('Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.');
const partArg = str('Body part by its name: e.g. head, throat, upper body, lower body, right upper arm, left hand, right lower leg, left eye.');
/** Infer a non-human DF creature id from a descriptive noun phrase (e.g. "the white cat" -> CAT) when species is omitted. */
function inferSpeciesFromName(name) {
    const clean = name.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean)
        return undefined;
    const words = clean.split(" ");
    // Only infer from multi-word descriptive phrases (e.g. "the cat", "white cat") or lowercase common nouns, not capitalized proper names like "Robin" or "Wolf".
    const hasDeterminerOrLower = words.length > 1 || /^[a-z]/.test(name.trim());
    if (!hasDeterminerOrLower)
        return undefined;
    for (let i = 0; i < words.length; i++) {
        const tail = words.slice(i).join(" ");
        const id = creatureId(tail);
        if (id && id !== "HUMAN" && creature(id)?.parts.length)
            return id;
    }
    const last = words[words.length - 1];
    const lastId = creatureId(last);
    if (lastId && lastId !== "HUMAN" && creature(lastId)?.parts.length)
        return lastId;
    return undefined;
}
/** Species id from a tool argument: 'HUMAN' when absent, null when no DF creature matches. */
const speciesOf = (text) => text ? creatureId(text) : 'HUMAN';
const noSpecies = (text) => `No creature named "${text}" in the creature list. State unchanged.`;
/** What the engine has recorded about `name`: species, mass and languages; {} for a character it has not met. */
function recorded(name) {
    const p = name ? store().state.people?.[name] : undefined;
    return p ? { mass: p.mass, species: p.species, languages: p.languages } : {};
}
/** The tracked person `name`; on first appearance species and mass come from the arguments, else what the engine recorded, else human. */
// Names differing by one letter (Mara, Mary) from a recorded one, in names of 4 letters or more, are taken for a misspelling
// unless the call gives a species, which starts a separate record. Numbered labels (stranger 1, stranger 2) are separate people.
function editDistance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++)
        d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
}
/** Keeps `name`'s family as the story fixes it: a mother and father by name; a brother or sister, whose family they share
 *  (the sibling's own, or one named after the sibling, given to both). */
export function recordKin(st, name, mother, father, siblingOf) {
    if (!mother && !father && !siblingOf)
        return;
    // The person, made here when they are new (as NewCharacter would make them a moment later).
    const p = who(st, name).p;
    if (!p)
        return;
    // A name as the story's people already have it, in whatever case or spacing it is given.
    const key = (x) => x.toLowerCase().replace(/\s+/g, ' ').trim(), named = (x) => { const t = String(x).trim(); return Object.keys(st.people ?? {}).find(n => key(n) === key(t)) ?? t; };
    const kin = p.kin ??= {};
    if (mother)
        kin.mother = named(mother);
    if (father)
        kin.father = named(father);
    const sib = siblingOf ? named(siblingOf) : '', q = sib ? st.people?.[sib] : undefined;
    if (sib) {
        const family = q?.kin?.family ?? kin.family ?? sib;
        kin.family = family;
        if (q) {
            q.kin ??= {};
            q.kin.family = family;
            kin.mother ??= q.kin.mother;
            kin.father ??= q.kin.father;
        }
    }
}
function who(st, rawName, speciesArg, massArg) {
    if (!rawName)
        return { error: 'Give the character\'s name.' };
    const key = (x) => x.toLowerCase().replace(/\s+/g, ' ').trim();
    const names = Object.keys(st.people ?? {});
    // The same name in other case or spacing is the same person.
    const name = names.find(n => key(n) === key(rawName)) ?? rawName.trim();
    const near = !st.people?.[name] && !speciesArg && name.length >= 4 ? names.find(n => n.length >= 4 && editDistance(key(n), key(name)) === 1 && key(n).replace(/\d+/g, '#') !== key(name).replace(/\d+/g, '#') && isAdjacentNameTypo(key(name), key(n))) : undefined;
    if (near)
        return { error: `No record of "${name}"; ${near} is on record. Call again with ${near}, or give species to start a separate character.` };
    const known = st.people?.[name];
    const t = known ? {} : recorded(name);
    const inferred = !known && !speciesArg && !t.species ? inferSpeciesFromName(name) : undefined;
    const text = speciesArg || t.species || inferred;
    const sp = speciesOf(text);
    if (!sp)
        return { error: noSpecies(text) };
    // DF names some creatures only in legends ([DOES_NOT_EXIST], no body): chimera, centaur, griffon.
    if (!known && !creature(sp)?.parts.length)
        return { error: `"${text}" is a creature of legend in DF, bodiless there. State unchanged.` };
    return { p: person(st, name, Number(massArg) || t.mass, sp) };
}
/** who() for tools that act on anyone: a creature name the raws lack falls back to human; a misspelt name stays an error. */
function whoAny(st, name, speciesArg) {
    const r = who(st, name, speciesArg);
    return r.p || r.error.startsWith('No record of') ? r : { p: person(st, name) };
}
// Principles shared by both briefs.
const RULES_PRINCIPLES = `Principles
- Every result is told in the story's own words: what happens, as the people there see and hear it.
- The world is real history with the additions in [WORLD]; everything else is as in real history.
- Humans talk, and so do the peoples [WORLD] adds and the bodies it marks as talking; an animal makes the sounds and movements of its species.
- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now. Facts in [KNOWS] stay true. A character uses and hands over only what [HAS] or the scene gives them.
- A player's message says what their character tries. Whether it works comes from the rule engine, also when the message states the result or disputes an earlier one; a result stands. What it states about the character holds as [DECIDED] or [KNOWS] gives it; the world is as the scenario and the world's facts give it.
- Clock times and durations in the narration are the ones in [TIME] and in Act and PassTime results; the rest of the passing of time is told in words (a while, at once).
- A character who took a word in another meaning ([KNOWS]: "took … to mean …") acts on that meaning; the narration keeps the English word as spoken, and may quote the words as they sounded, spelled as [KNOWS] gives them, when the misunderstanding comes out.`;
/** The brief when the question pass has decided this turn: the narrator writes [DECIDED] and calls nothing. */
export const RULES_BRIEF_DECIDED = `<rule_engine>
Outcomes in [DECIDED] come from the rule engine; narrate each as given, in the order it happens.
An action [DECIDED] leaves open is narrated up to the moment its outcome would show; the next turn decides it.
${RULES_PRINCIPLES}
</rule_engine>`;
/** The narrator's brief when it calls the tools itself. A line about a tool goes only where the scene has a use for that tool
 *  (scene-fit.ts): a world without magic is told of no spell, a scene before 1600 of no battle tool. */
export function rulesBrief(scene = sceneNow()) {
    const has = (n) => !REGISTRY.has(n) || !!fittedTool(n, scene);
    const after = (y) => scene.year == null || scene.year >= y;
    const lines = [
        'Outcomes come from the rule-engine tools: call the tool before narrating the outcome, then narrate what it returns.',
        'Body',
        '- An attack with the body or a melee weapon → BodyStrike.',
        '- A shot with a bow, crossbow or blowgun → BodyCheck for the aim, then BodyStrike on target.',
        after(GUN_YEAR) ? '- A handgun shot → BodyCheck with shot_m, then BodyWound on a hit.' : '',
        '- An attack by any other means → BodyCheck, then BodyWound on a hit.',
        '- An injury from a burn, a bite or an accident → BodyWound. A fall → BodyFall. A choke → BodyChoke. Skin on something hot → BodyContact.',
        '- A treatment → BodyTreat. Eating or drinking → BodyIntake.',
        '- Holding on or carrying by hand → HoldOn. A chase on foot → Chase.',
        '- Any other action with an uncertain outcome → BodyCheck.',
        '- Injuries, blood loss and energy → BodyStatus.',
        'Surroundings',
        '- The day\'s weather → Weather. A change of climate, weather, clothing, water or air → BodyEnvironment.',
        '- Time passing → PassTime; when it stops early, narrate the moment it reports.',
        'Senses',
        '- A sound that might be heard → Listen. Something that might be seen → Look. A message whose arrival is in doubt, or that teaches a fact → Communicate; a word it names as having several meanings → Interpret.',
        'People',
        `- A new character, at first appearance → NewCharacter${has('NameCharacter') ? '; their first name → NameCharacter' : ''}; their height and mass → BodySize.`,
        '- A person\'s response to a possible lie, an emergency, an order to hurt someone, a stranger\'s small favour, order or request to go first, or a first meeting → SocialResponse.',
        '- A betrayal, a promise or apology after one, faith kept, or whether the betrayed one trusts the betrayer again → Trust.',
        '- A character\'s pick among several real options → Choose. A character\'s feelings about something → Appraise.',
        '- A fact the story establishes, or something a character learns → RecordFact.',
        `- A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. ${after(1846) ? 'Seasickness or sickness after surgery' : 'Seasickness'} → Sickness.`,
        '- An item changing hands, found, made, lost or used up → Transfer, once the story has it happen.',
        '- A player\'s message stating something new about their own character (what they are, an item they have, something they can do or did) → Claim, before the actions that rely on it.',
        '- Give a character\'s species, and their mass when the story states it, in the first rule-tool call about them; the engine keeps both after that.',
        'World',
        `- ${[has('Price') ? 'A price, a wage or a bill → Price.' : '', 'A contagious disease → Disease.', has('Battle') ? 'An attack by one army or unit on a defended position → Battle.' : '', has('CastSpell') ? 'A spell → CastSpell.' : '',
            'A random pick (a door, a coin, a card) or a table of finds or events → RollTheDice with kind "table"; a quantity → kind "amount".'].filter(Boolean).join(' ')}`,
    ];
    return `<rule_engine>\n${lines.filter(Boolean).join('\n')}\n${RULES_PRINCIPLES}\n</rule_engine>`;
}
/** The brief for an unknown year in a world with magic: every line (tools/prompt-audit.mjs reads it). */
export const RULES_BRIEF = rulesBrief({ year: null, magic: true });
/** Between two people placed on the map: straight distance, their rooms, and whether an open doorway joins them. */
/** Act's steps as the planner sends them: steps nested one level too deep, or a step written as words, made into steps. */
function prepareAct(raw) {
    // A list of actor objects sent as "action" or "actions" is the actors.
    for (const key of ['action', 'actions']) {
        const v = raw[key];
        if (Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object') && !raw.actors) {
            raw = { ...raw, actors: v };
            delete raw[key];
        }
    }
    const fix = (list, who) => !Array.isArray(list) ? list : list.flatMap((s) => {
        if (s && !s.do && Array.isArray(s.steps))
            return fix(s.steps, who);
        if (s && !s.do && typeof s.action === 'string') {
            const r = stepsFromWords(s.action, who, (s.distance_m ?? raw.distance_m));
            return 'error' in r ? [s] : r.steps;
        }
        return [s];
    });
    const out = { ...raw, steps: fix(raw.steps, String(raw.who ?? 'they')) };
    if (Array.isArray(raw.actors))
        out.actors = raw.actors.map((x) => x && typeof x === 'object' ? { ...x, steps: fix(x.steps, String(x.who ?? 'they')) } : x);
    if (out.steps === undefined)
        delete out.steps;
    return out;
}
/** Moves the story clock by an action's seconds; the body runs in whole minutes, so seconds wait until they make one. */
function passSeconds(st, seconds, names, rng) {
    if (!st.clock)
        return ' The story clock is still open ([TIME] unset): durations given, the clock stays where it is.';
    let tail = '';
    st.clock.add += seconds / 60;
    st.clock.sec = (st.clock.sec ?? 0) + seconds;
    const mins = Math.floor(st.clock.sec / 60);
    if (mins > 0) {
        st.clock.sec -= mins * 60;
        const others = new Set(Object.keys(st.people ?? {}).filter(n => !names.has(n)));
        const ev = advanceAll(st.people || {}, mins, others, rng, { active: names, eachMinute: airHook(st) });
        if (ev.events.length)
            tail = ` Meanwhile: ${ev.events.join('; ')}.`;
    }
    return ` Clock now ${formatStoryTime(storyNow(st))} (${spokenTime(storyNow(st))}).` + tail;
}
// Speaking takes time: English conversation runs at about 196 words a minute over the whole conversation time (Yuan,
// Liberman & Cieri 2006, Switchboard; 214 in CallHome, 193 in Fisher).
const WORDS_PER_S = 196 / 60;
// A price in the coins of the place, so the narration names what changes hands: English money by the pound's silver that
// year (Lindert 2006 from Jastram 1981, the series behind "value of English money"); the French franc of 7 Germinal an XI
// (1803–1914): 5 g of silver at 9/10 fine, 4.5 g of fine silver.
function coinsOf(g, city, year) {
    if (city === 'London') {
        const perPound = poundSilver(1, year);
        if (!perPound)
            return '';
        const d = g / (perPound / 240);
        const q = Math.round(d * 4), frac = ['', '¼', '½', '¾'][q % 4];
        if (d < 12)
            return ` (about ${Math.floor(q / 4) || ''}${frac || (q < 4 ? '¼' : '')} d)`;
        const sh = Math.floor(d / 12), dd = Math.round(d - sh * 12);
        return sh < 20 ? ` (about ${sh} s ${dd} d)` : ` (about £${Math.floor(sh / 20)} ${sh % 20} s)`;
    }
    if (city === 'Paris' && year >= 1803 && year <= 1914) {
        const c = Math.round(g / 4.5 * 100);
        return c < 100 ? ` (about ${c} centimes)` : ` (about ${Math.round(c) / 100} francs)`;
    }
    return '';
}
// The way a sound travels (acoustics.ts Way): the ground, an obstacle, the wind and sun for outdoors; the room's volume and
// absorption when both are in one. Absorption: walls, floor and ceiling of a square room times the lining's coefficient at
// 500 Hz–1 kHz (brick 0.03, concrete 0.02, gypsum board 0.05, wood 0.10), furnishing 0.1 per m² of floor, 0.45 m² per person
// [ASSUMED typical values from absorption tables].
const ALPHA = Object.fromEntries(Object.entries(LININGS).filter(([n]) => !n.startsWith('_')).map(([n, l]) => [n, MATERIALS[l.material]?.alpha500 ?? 0.03]));
const GROUND = { 'paved, water or ice': 0, mixed: 0.5, 'grass, fields or soil': 1 };
const WAY_PROPS = {
    ground: { type: 'string', enum: Object.keys(GROUND), description: 'Outdoors: the ground between them. Default mixed.' },
    obstacle_m: { type: 'number', description: 'Outdoors: how far a wall, house or crest between them rises above the straight line from source to ear, m' },
    wind: { type: 'string', enum: ['toward the listener', 'across', 'toward the source'], description: 'Outdoors: which way the wind blows along the way. Default across.' },
    wind_ms: { type: 'number', description: 'Wind speed at 10 m, m/s, when the story sets it. Default: the recorded day\'s wind where known.' },
    source_height_m: { type: 'number', description: 'Height of the source above the ground, m (a voice 1.6, a bell tower 20). Default 1.5.' },
};
function wayFor(st, l, a, sameRoom) {
    const room = roomOf(st, l);
    if (room && sameRoom) {
        const F = room.floor ?? (room.m3 / (room.h ?? 2.5)), h = room.h ?? 2.5, S = 2 * F + 4 * Math.sqrt(F) * h;
        const people = Object.values(st.people ?? {}).filter(p => roomOf(st, p) === room).length;
        return { room: { m3: room.m3, absorption: S * (ALPHA[room.lining ?? 'brick'] ?? 0.03) + 0.1 * F + 0.45 * people }, toneHz: a.tone_hz };
    }
    const t = storyNow(st), s = t !== null ? skyAt(st, t) : null, sun = s ? s.sunAlt >= 0 : undefined;
    const obs = l.weather ? weatherAt(l.weather, t)?.observed : undefined;
    return { ground: GROUND[a.ground ?? 'mixed'] ?? 0.5, obstacle_m: a.obstacle_m, wind: a.wind ?? 'across', windMs: a.wind_ms ?? obs?.windMs, sunUp: sun, hs: a.source_height_m, hr: 1.5, toneHz: a.tone_hz };
}
function between(st, a, b) {
    if (!st.map || !a.at || !b.at)
        return null;
    const ra = roomAt(st.map, a.at) ?? (st.rooms?.[a.at] ? a.at : null), rb = roomAt(st.map, b.at) ?? (st.rooms?.[b.at] ? b.at : null);
    const open = !!(st.openings ?? []).some(o => (o.a === ra && o.b === rb) || (o.a === rb && o.b === ra));
    const d = straight(st.map, a.at, b.at);
    return { d: d == null ? null : Math.round(d * 10) / 10, ra, rb, open };
}
/** Two people's places on the map, for a tool that also takes a distance from the model: the map's distance is the record and
 *  is kept (as Act keeps a recorded walk and BodyFall the height stood at), and `note` names a given distance it replaced;
 *  `wall` names the rooms when a wall with every doorway shut stands between. Null when either is off the map. */
function placed(st, a, b, given) {
    const geo = between(st, a, b);
    if (!geo || geo.d == null)
        return null;
    const g = Number(given), note = given != null && Number.isFinite(g) && Math.round(g * 10) / 10 !== geo.d ? ` (map distance ${geo.d} m kept; ${g} m ignored)` : '';
    return { d: geo.d, wall: geo.ra && geo.rb && geo.ra !== geo.rb && !geo.open ? `${geo.ra} and ${geo.rb}, every doorway shut` : null, same: geo.ra === geo.rb, note };
}
/** The first sentence of b that a does not contain (the changed outcome). */
const firstDiff = (a, b) => { const sa = new Set(a.split(/(?<=[.;])\s+/).map(x => x.replace(/-?\d+(\.\d+)?/g, '#'))); return b.split(/(?<=[.;])\s+/).find(x => !sa.has(x.replace(/-?\d+(\.\d+)?/g, '#')))?.slice(0, 160) ?? b.slice(0, 160); };
/** Minutes as "49 min 23 s" (whole minutes shown bare). */
const mmss = (m) => { const s = Math.round(m * 60), mm = Math.floor(s / 60), ss = s % 60; return ss ? `${mm} min ${ss} s` : `${mm} min`; };
/** Story time in minutes (see clock.ts): the time set with /rules-time plus the minutes PassTime has run since; null when unset. */
function storyNow(st) {
    return st.clock ? st.clock.t + st.clock.add : null;
}
/** Who is in this turn's scene (the question pass's plan) and the player's character, set before the pass's calls run: the
 * people with a day who are away from the scene follow it while time passes (days.ts). Unknown: nobody follows a day. */
let PRESENT, PLAYER = null;
export function setPresent(present, player) { PRESENT = present; PLAYER = player; }
const isHere = (n) => !!PRESENT?.some(x => x.toLowerCase() === n.toLowerCase());
/** Sets the story time (minutes, clock.ts) for this chat. */
export function setStoryTime(t) {
    const s = store(), before = structuredClone(s.state);
    s.state.clock = { t, add: 0 };
    s.history ??= { base: before, log: [], n: 0 };
    record(s.history, { msg: SillyTavern.getContext().chat?.length ?? 0, tool: 'set time', args: { t }, draws: [], ops: diff(before, s.state) });
    save();
}
/** The story time now, minutes, or null when unset. */
export function storyTime() {
    return SillyTavern.getContext().chatMetadata ? storyNow(store().state) : null;
}
/** Weather at `station` at story minute `t` (calendar dates only): { d (the day), tempC (air now), date }, or null. */
/** Story year from a calendar date in [TIME]; null for a bare day count or no [TIME]. */
function storyYear(st) {
    const t = storyNow(st);
    if (t === null || t / 1440 <= 146097)
        return null;
    const date = new Date(0, 0, 1);
    date.setFullYear(1, 0, 1);
    date.setDate(date.getDate() + Math.floor(t / 1440));
    return date.getFullYear();
}
/** The story's year now (for the interface's period type, src/ui.ts), or null without a calendar date. */
export function storyYearNow() {
    return SillyTavern.getContext().chatMetadata ? storyYear(store().state) : null;
}
const NO_YEAR = 'Give year: [TIME] holds no calendar date.';
/** Remembers a place as the scene's setting, so later calls can leave place and country out. */
function setPlace(st, place) {
    st.setting = { place: place.key, label: place.label, country: place.country };
    if (place.lat != null)
        st.latitude = place.lat;
    if (place.lon != null)
        st.longitude = place.lon;
    if (place.lat != null && place.lon != null) {
        COORDS.set(place.key, [place.lat, place.lon]);
        void fetchZone(place.lat, place.lon);
    }
}
// Coordinates of places seen this session, for the observed weather of real days (reanalysis.ts).
const COORDS = new Map();
function coordsOf(key) {
    const c = COORDS.get(key);
    if (c)
        return c;
    const st = store().state;
    return st.setting?.place === key && st.latitude != null && st.longitude != null ? [st.latitude, st.longitude] : null;
}
/** Calendar date of story minute `t`, or null for a bare day count. */
function dateOf(t) {
    if (t === null || t / 1440 <= 146097)
        return null;
    const date = new Date(0, 0, 1);
    date.setFullYear(1, 0, 1);
    date.setDate(date.getDate() + Math.floor(t / 1440));
    return date;
}
/** Fetches the observed day for a place before a tool runs, so the synchronous weather lookups find it. */
async function prefetchWeather(place, t) {
    const date = dateOf(t), c = place?.lat != null && place.lon != null ? [place.lat, place.lon] : place ? coordsOf(place.key) : null;
    if (place && c)
        COORDS.set(place.key, c);
    if (c)
        await fetchZone(c[0], c[1]);
    if (date && c)
        await observedDay(c[0], c[1], date.getFullYear(), date.getMonth() + 1, date.getDate());
}
/** Fetches the scene's time zone and observed day before a tool reads the sky (latitude: one the call is about to set). */
async function prefetchSky(latitude) {
    const st = store().state, t = storyNow(st), lat = Number.isFinite(latitude) ? latitude : st.latitude, lon = st.longitude;
    if (t === null || lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon))
        return;
    await fetchZone(lat, lon);
    const date = dateOf(t);
    if (date)
        await observedDay(lat, lon, date.getFullYear(), date.getMonth() + 1, date.getDate());
}
// A day without hourly cloud (1851–1939 reanalysis, generated weather) takes the clear-sky index of its kind of day: the mean
// over the year of the dry-day and wet-day solar radiation of the 28 WGEN stations (Richardson & Wright 1984, harmonics of
// Tables 1–5) ÷ Haurwitz clear-sky radiation at each station's latitude, stations weighted equally [fitted here]; a WGEN
// station's own day keeps its own radiation.
def({ id: 'fearWm', value: 0.334, unit: 'g, anxiety against working-memory performance', status: 'sourced', src: 'Moran 2016, Psychol Bull 142:831 (177 samples)', range: [0.25, 0.42], file: 'rules-tools.ts' });
def({ id: 'ktDry', value: 0.89, unit: 'clear-sky index of a dry day', status: 'fitted', src: 'WGEN dry-day radiation of 28 US stations ÷ Haurwitz clear sky (station means 0.78–1.02)', range: [0.78, 1.02], file: 'rules-tools.ts' });
def({ id: 'ktWet', value: 0.55, unit: 'clear-sky index of a wet day', status: 'fitted', src: 'WGEN wet-day radiation of 28 US stations ÷ Haurwitz clear sky (station means 0.41–0.75)', range: [0.41, 0.75], file: 'rules-tools.ts' });
/**
 * Natural light at the scene at story minute `t` (calendar dates only): the place's own clock (zone.ts) and, for the hour, the
 * observed cloud and radiation (ERA5); a day without them takes its own radiation or its dry or wet index. Null without a
 * latitude.
 */
function skyAt(st, t) {
    if (t / 1440 <= 146097 || st.latitude == null || !Number.isFinite(st.latitude))
        return null;
    const lat = st.latitude, lon = st.longitude != null && Number.isFinite(st.longitude) ? st.longitude : undefined, opts = {};
    if (lon != null) {
        opts.lon = lon;
        opts.utcOffsetH = civilOffsetH(t, lat, lon);
    }
    const date = dateOf(t), h = Math.floor((((t % 1440) + 1440) % 1440) / 60);
    const obs = date && lon != null ? cachedDay(lat, lon, date.getFullYear(), date.getMonth() + 1, date.getDate()) : null;
    if (obs?.ghiH) {
        opts.ghi = obs.ghiH[h];
        opts.cloud = obs.cloudH?.[h];
    }
    else {
        const d = obs?.day ?? (st.setting?.place ? weatherAt(st.setting.place, t)?.d : undefined);
        if (d)
            opts.kt = Number.isFinite(d.radLy) && d.radLy > 0 && lon != null
                // Langleys to Wh/m² (1 ly = 41 840 J/m²).
                ? Math.min(1.1, d.radLy * 11.622 / Math.max(1, clearDayWh(t - (opts.utcOffsetH ?? 0) * 60, lat, lon)))
                : d.wet ? kc('ktWet') : kc('ktDry');
    }
    return skyLight(t, lat, opts);
}
// Light at a person (E13, E14): outdoors the sky; in a room set up with Room, its flames plus the daylight through windows.
// A flame's light from its fuel: a paraffin candle gives about 1 cd (12.6 lm) burning about 7 g an hour, and every flame is
// taken at that light per kg burnt [ASSUMED]; the room's illuminance is the flames' flux over its surfaces, raised by the
// light the surfaces send back, 1 ÷ (1 − ρ) with ρ = 0.3 [ASSUMED integrating-room approximation]; daylight indoors is 1.5 %
// of the outdoor light (BS 8206-2:2008's minimum average daylight factor for a living room; kitchens 2 %, bedrooms 1 %). No flame and no daylight: no light.
def({ id: 'flameLmPerKgH', value: 1800, unit: 'lm per kg/h of fuel', status: 'assumed', src: 'a paraffin candle, about 12.6 lm at about 7 g/h, for every flame', range: [500, 4000], file: 'rules-tools.ts' });
def({ id: 'roomReflectance', value: 0.3, unit: 'mean reflectance of a room', status: 'assumed', src: 'typical plaster, wood and furnishing', range: [0.1, 0.6], file: 'rules-tools.ts' });
def({ id: 'daylightFactor', value: 0.015, unit: 'indoor ÷ outdoor illuminance', status: 'sourced', src: 'BS 8206-2:2008 minimum average daylight factor for living rooms (kitchens 2 %, bedrooms 1 %), as quoted in BRE Site Layout Planning for Daylight and Sunlight', range: [0.005, 0.05], file: 'rules-tools.ts' });
/** Where a tell's bearer stands, for its condition (tells.ts): the light there, the sun's altitude, and whether a room is
 * around them; null where the story's time and place leave it open. */
function tellPlace(st, p, t) {
    const sky = t !== null ? skyAt(st, t) : null, room = roomOf(st, p), lit = lightAt(st, p, t);
    return { lux: lit?.lux ?? null, sunAlt: sky?.sunAlt ?? null, indoors: room ? true : sky ? false : null };
}
function lightAt(st, p, t) {
    const sky = t !== null ? skyAt(st, t) : null, room = roomOf(st, p);
    // Outdoors with the sun up, the share of light on a figure's shaded side (vision.ts diffuseShare); otherwise all diffuse.
    if (!room)
        return sky ? { lux: sky.lux, label: sky.label, shade: sky.sunAlt > 0 ? diffuseShare(sky.kt ?? 1) : 1 } : null;
    const F = room.floor ?? room.m3 / (room.h ?? 2.5), h = room.h ?? 2.5, S = 2 * F + 4 * Math.sqrt(F) * h;
    const flame = room.fires.reduce((s, f) => s + f.kgh, 0) * kc('flameLmPerKgH') / S / (1 - kc('roomReflectance'));
    const day = sky && sky.sunAlt > -6 ? sky.lux * kc('daylightFactor') : 0;
    const lux = flame + day;
    return { lux, label: `indoors, ${room.fires.length ? `lit by ${room.fires.map(f => f.fuel).join(' and ')}` : 'no flame burning'}${day > 0.5 ? ', daylight from the windows' : ''}` };
}
// The talk of a crowd in a room (E17): Rindel's model for eating places, L = 93 − 20 lg(g A ÷ N) dB(A), A the absorption area
// with people, N the people present, g = 3.5 per talking group (Rindel 2010, Appl Acoust 71:1156; Acoustics in Practice 7:1,
// 2019: a diffuse room, checked on 50–540 people, stated valid from about 30). Used from 10 people [ASSUMED extension].
function crowdDb(st, p) {
    const room = roomOf(st, p);
    if (!room)
        return null;
    const N = (room.crowd ?? 0) + Object.values(st.people ?? {}).filter(q => !q.dead && roomOf(st, q) === room).length;
    if (N < 10)
        return null;
    const F = room.floor ?? (room.m3 / (room.h ?? 2.5)), h = room.h ?? 2.5, S = 2 * F + 4 * Math.sqrt(F) * h;
    const A = S * (ALPHA[room.lining ?? 'brick'] ?? 0.03) + 0.1 * F + 0.45 * N;
    return 93 - 20 * Math.log10(3.5 * A / N);
}
const sumDb = (...l) => 10 * Math.log10(l.reduce((s, x) => s + (x == null ? 0 : 10 ** (x / 10)), 0) || 1);
// Bystanders perceive what the actors do (E21): each tracked person on the map who is not acting, awake and alive hears the
// actors' footsteps (64 dB at 1 m on gravel or sand, the Listen preset; creeping −10 dB, running +6, sprinting +8 [ASSUMED])
// from the nearer of each actor's start and end spot, over their background, through a plaster wall between two rooms, or a
// room and outdoors, with no open doorway [ASSUMED, as Communicate]; and sees them in the same room or outdoors with the light there (one glance at a
// person-sized target). One draw each; [PERCEIVED] tells the narrator.
def({ id: 'creepStepDb', value: -10, unit: 'dB on the walking footstep', status: 'assumed', src: 'stealthy steps are quieter than a walk (no measured value held)', range: [-20, -5], file: 'rules-tools.ts' });
def({ id: 'runStepDb', value: 6, unit: 'dB on the walking footstep', status: 'assumed', src: 'running steps land harder (no measured value held)', range: [3, 10], file: 'rules-tools.ts' });
// A fall on the level (BodyFall): the share of the 65-and-over rate under 45 and at 45–64.
def({ id: 'slipUnder45', value: 0.025, unit: 'share of falls on the level under 45 ending in a serious injury', status: 'assumed', src: 'the 0.10 at 65 and over (Tinetti 2003, NEJM 348:42) ÷ about 4, the fracture ratio at 45 and over against under 45 (3.35–4.75, McNamee et al. 1997, Occup Environ Med 54:785) taken for serious injury; range 0.10 ÷ 4.75 to 0.10 ÷ 3.35', range: [0.021, 0.030], file: 'rules-tools.ts' });
def({ id: 'slipMiddleAge', value: 0.05, unit: 'share of falls on the level at 45–64 ending in a serious injury', status: 'assumed', src: 'half the 0.10 at 65 and over (Tinetti 2003); range from the share under 45 to the share at 65 and over', range: [0.025, 0.10], file: 'rules-tools.ts' });
function perceivedBy(st, actors, before, rng) {
    if (!st.map)
        return '';
    const t = storyNow(st), lines = [];
    const paceDb = { walk: 0, creep: kc('creepStepDb'), run: kc('runStepDb'), sprint: kc('runStepDb') + 2 };
    for (const [name, q] of Object.entries(st.people ?? {})) {
        if (actors.some(x => x.who === name) || q.dead || q.unconscious || !q.at)
            continue;
        const heard = [], seen = [], noise = sumDb(NOISE['quiet room (25 dB)'] ?? 25, crowdDb(st, q));
        for (const x of actors) {
            const walk = x.steps.filter(s => s.do === 'walk_to');
            if (!walk.length || !x.p.at)
                continue;
            const pace = walk[walk.length - 1].pace ?? 'walk';
            const ds = [before.get(x.who), x.p.at].filter((s) => !!s).map(s => straight(st.map, q.at, s)).filter((d) => d != null);
            if (!ds.length)
                continue;
            const d = Math.max(1, Math.min(...ds)), geo = between(st, x.p, q), wall = !!(geo && (geo.ra || geo.rb) && geo.ra !== geo.rb && !geo.open);
            if (rng() < hearChance(q, { spl: 64 + (paceDb[pace] ?? 0), distance: d, barrier: wall ? 'plaster wall' : 'none', noiseDb: noise }))
                heard.push(`${x.who} (${pace}, ${Math.round(d)} m${wall ? ', through a wall' : ''})`);
            // Seeing takes the light on the one seen (where the actor ends up), not at the onlooker.
            const onActor = lightAt(st, x.p, t);
            if (!wall && onActor && rng() < see({ size: 0.5, distance: d, light: seeLux(q, onActor.lux) }).detect)
                seen.push(`${x.who} (${Math.round(d)} m)`);
        }
        if (heard.length || seen.length)
            lines.push(`${name}${heard.length ? ` hears the footsteps of ${heard.join(', ')}` : ''}${heard.length && seen.length ? ' and' : ''}${seen.length ? ` sees ${seen.join(', ')}` : ''}`);
    }
    return lines.length ? ` [PERCEIVED] ${lines.join('; ')}.` : '';
}
/** The scene's place as the story named it (the last place a tool was given), or null. */
export const scenePlace = () => SillyTavern.getContext().chatMetadata ? store().state.setting?.label ?? null : null;
/** Natural light at the scene now (index.ts: day and night for the world book), or null. */
export function sceneSky(t) {
    return SillyTavern.getContext().chatMetadata ? skyAt(store().state, t) : null;
}
/** Weather at place key `place` (from findPlace) at story minute `t` (calendar dates only): the day, air now, date; or null. */
// weatherAt is null without a calendar date, or for a place without climate normals; each gets its own answer, the date in
// the form the question pass writes it (QUESTION_SYSTEM: "time" as YYYY-MM-DD HH:MM).
const NO_DATE = (what) => `${what} needs a calendar date and hour in [TIME]: add "time" as YYYY-MM-DD HH:MM.`;
const noClimate = (where) => `No climate data for ${where}: give the nearest listed town, or latitude and longitude.`;
function weatherAt(place, t) {
    const date = dateOf(t);
    if (t === null || !date)
        return null;
    // The observed day (ERA5) where it was fetched; the generator otherwise.
    const c = coordsOf(place), obs = c ? cachedDay(c[0], c[1], date.getFullYear(), date.getMonth() + 1, date.getDate()) : null;
    // Wind and humidity of the hour where the day has them (ERA5), the day's mean otherwise.
    const h = Math.min(23, Math.floor((t % 1440) / 60)), hourly = (a, mean) => Number.isFinite(a?.[h]) ? a[h] : mean;
    if (obs)
        return { d: obs.day, tempC: obs.hourlyC[h], date, observed: { snowCm: obs.snowCm, windMs: hourly(obs.windH, obs.windMs), humidity: hourly(obs.humH, obs.humidity), source: obs.source } };
    const year = date.getFullYear(), jan1 = new Date(0, 0, 1);
    jan1.setFullYear(year, 0, 1);
    const doy = Math.min(365, Math.round((date.getTime() - jan1.getTime()) / 864e5) + 1);
    const days = simulatePlaceYear(place, doy, seededRng(`${store().salt}:weather:${place}:${year}`));
    if (!days)
        return null;
    // A past month runs warmer or colder than the 1991–2020 normals by the country's recorded anomaly (population.ts).
    const off = climateShift(placeCountry(place), year, date.getMonth() + 1) ?? 0, g = days[days.length - 1];
    const d = off ? { ...g, tmaxC: g.tmaxC + off, tminC: g.tminC + off } : g;
    return { d, tempC: hourTemp(d, (t % 1440) / 60), date };
}
/** Characters outdoors at a weather station take its air temperature at story minute `t`. */
function applyWeather(people, t) {
    for (const p of Object.values(people)) {
        if (!p.weather || !p.env)
            continue;
        const w = weatherAt(p.weather, t);
        if (w) {
            p.env.tdb = w.tempC;
            p.env.tr = w.tempC;
        }
    }
}
/** The per-turn [KNOWS] block for the current chat, '' when nothing is recorded. */
export function knowledgeInjection() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return '';
    const a = store().asked;
    const scene = (ctx.chat ?? []).slice(-2).map((m) => m.mes ?? '').join(' ');
    return knowledgeBlock(store().state, a?.turn === turnKey(ctx.chat) ? a.present : undefined, scene);
}
/** The per-turn [WHERE] block (days.ts): where the people away from this turn's scene are by their usual day; '' when none. */
export function whereInjection() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return '';
    const s = store(), a = s.asked, people = Object.fromEntries(Object.entries(s.state.people ?? {}).filter(([n]) => n !== PLAYER));
    return whereBlock(people, storyNow(s.state), a?.turn === turnKey(ctx.chat) ? a.present : undefined);
}
/** Sets the scene's position (and the latitude light and weather use). */
export function setScenePosition(lat, lon) {
    const st = store().state;
    st.latitude = lat;
    st.longitude = lon;
    if (st.setting)
        delete st.setting.place;
    void fetchZone(lat, lon);
    save();
}
/** Where the scene is, from the last place a tool was given (a WMO city, or latitude and longitude); null when unknown. */
export function scenePosition() {
    if (!SillyTavern.getContext().chatMetadata)
        return null;
    const st = store().state, key = st.setting?.place;
    const n = key?.startsWith('wmo:') ? NORMALS[Number(key.slice(4))] : null;
    if (n)
        return { lat: n[2], lon: n[3] };
    return st.latitude != null && st.longitude != null ? { lat: st.latitude, lon: st.longitude } : null;
}
/** The per-turn [HAS] block for the current chat, '' when nothing is recorded. */
export function possessionsInjection() {
    return SillyTavern.getContext().chatMetadata ? possessionsBlock(store().state) : '';
}
/**
 * Whether the question pass ran for this turn. The narrator then gets [DECIDED] and no tool schemas (about 12,000 tokens
 * for 28 tools, plus a second request per tool call), so a large model on a shared endpoint answers before its gateway closes.
 */
export function questionPassRan() {
    const ctx = SillyTavern.getContext();
    return !!ctx.chatMetadata && store().asked?.turn === turnKey(ctx.chat);
}
export function registerRulesTools(enabled) {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool)
        return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    REGISTRY.clear();
    FITTED.clear();
    if (!enabled)
        return;
    // Lists that come from the DF raws fill in once they load; the schemas hold the same arrays.
    void loadRaws().then(() => {
        MELEE.splice(0, MELEE.length, ...meleeWeaponNames());
        WEAPON_MATERIALS.splice(0, WEAPON_MATERIALS.length, ...weaponMetalNames(), 'bone', 'wood');
        FITTED.clear();
    });
    // The action's argument type comes from the schema the model is given.
    const tool = (name, description, properties, required, action) => {
        const exec = async (raw) => {
            const was = CALLING;
            CALLING = SillyTavern.getContext().chatMetadata;
            try {
                return await execIn(raw);
            }
            finally {
                CALLING = was;
            }
        };
        const execIn = async (raw) => {
            // Arguments are checked against the schema at the boundary; a call with errors runs nothing and says what to fix.
            const { args, errors } = checkArgs(properties, required, name === 'Act' ? prepareAct(raw ?? {}) : raw ?? {});
            if (errors.length)
                return `${name} waits: fix and call again: ${errors.join('; ')}.`;
            await loadRaws();
            const prior = decided(name, args);
            if (prior)
                return `Already decided this turn; this result stands. ${prior}`;
            const before = structuredClone(store().state), callsBefore = store().calls ?? 0;
            resetUsed();
            let out = plain(await action(args));
            const s = store();
            const broken = violations(before, s.state, name, args);
            if (broken.length) {
                s.state = before;
                save();
                return `${name} refused: the result would break a law of the world (${broken.join('; ')}). State unchanged; correct the call.`;
            }
            // Sensitivity (constants.ts): rerun the call on the same state and draws with each judged constant it used at the ends
            // of its range; when the outcome's words change (numbers aside), the result says which assumption it rests on.
            const cands = fragileCandidates();
            if (cands.length && !Object.values(before.people ?? {}).some(p => p.pulse)) {
                const after = s.state, callsAfter = s.calls, draws = LAST_DRAWS, shape = (t) => t.split('\n')[0].replace(/-?\d+(\.\d+)?/g, '#'); // the result's first line: its outcome, not the status lines
                const notes = [];
                for (const c of cands.slice(0, 6))
                    for (const v of c.range) {
                        s.state = structuredClone(before);
                        s.calls = callsBefore;
                        const alt = plain(await withOverride(c.id, v, () => action(args)));
                        if (typeof alt === 'string' && typeof out === 'string' && shape(alt) !== shape(out)) {
                            const d = firstDiff(out.split('\n')[0], alt.split('\n')[0]);
                            notes.push(`${c.id} = ${v} ${c.unit} instead of ${c.value} [${c.status.toUpperCase()}: ${c.src}] → ${d}`);
                            break;
                        }
                    }
                s.state = after;
                s.calls = callsAfter;
                LAST_DRAWS = draws;
                if (notes.length && typeof out === 'string')
                    out += ` Fragile: the outcome changes within the range of ${notes.length} judged value${notes.length > 1 ? 's' : ''}: ${notes.join('; ')}.`;
            }
            s.history ??= { base: before, log: [], n: 0 };
            record(s.history, { msg: SillyTavern.getContext().chat?.length ?? 0, tool: name, args, draws: [...LAST_DRAWS], ops: diff(before, s.state) });
            remember(name, args, out);
            globalThis._rpgRefreshRenderedView?.();
            // A result goes to a model (the narrator's tool call, the [DECIDED] block): no hidden tag character in it.
            return typeof out === 'string' ? untagged(out) : out;
        };
        REGISTRY.set(name, { name, description, properties, required, exec });
        // The narrator reads a tool's parameters as the scene allows them; SillyTavern awaits shouldRegister and then reads this
        // object (tool-calling.js, registerFunctionToolsOpenAI), so it is set there for the request being built.
        const shown = { type: 'object', properties, required: [...required] };
        registerFunctionTool({ name, displayName: name, description, parameters: shown, action: async (a) => { const r = await exec(a); return typeof r === 'string' ? storyText(r) : r; }, formatMessage: () => '',
            shouldRegister: () => {
                const f = questionPassRan() ? null : fittedTool(name);
                if (!f || !offeredNow().has(name))
                    return false;
                shown.properties = f.properties;
                shown.required = [...f.required];
                return true;
            } });
    };
    tool('RollTheDice', 'Rolls dice for a quantity or a tier table and returns the result; the returned amount or tier is binding. Checks go through BodyCheck. One formula per call; for several independent rolls make several calls, each with its own "for".', {
        kind: { type: 'string', enum: ['amount', 'table'], description: '"amount": a quantity. "table": a tier table, given in table; the tier is returned.' },
        formula: str('ONE dice formula, e.g. "1d20", "2d6+3", "2d20kh1".'),
        for: str('What is rolled for, 1-4 words in the scene\'s own words, unique within this turn. A repeated who + for returns the first result.'),
        who: str('Who rolls or whose turn it is. Optional.'),
        table: str('kind "table": contiguous rows written "1-3 <result> | 4-6 <result>", each result in the scene\'s words.'),
    }, ['kind', 'formula', 'for'], a => run((_st, rng) => {
        const rows = a.kind === 'table' ? parseTable(a.table ?? '') : null;
        if (a.kind === 'table' && !rows)
            return 'Nothing was rolled. Call again with table as contiguous rows, e.g. "1-5 Junk | 6-10 Common | 11-20 Rare".';
        const r = rollFormula(a.formula, rng);
        if (!r)
            return `Give a dice formula such as "1d20" or "2d6+3" (got "${a.formula}").`;
        const lead = `${a.who ? `${a.who} rolls` : 'Rolled'} ${r.formula} for ${a.for}: ${r.total}`;
        return rows ? `${lead}. Tier: ${pickTier(rows, r.total).label}. Narrate this tier.` : `${lead}. Use this amount as rolled.`;
    }));
    // Severity (vessel, fracture) is decided in code; the narrator names only the cause and place.
    tool('BodyWound', 'Record a wound the moment it happens, for wounds from a burn, a bite, an accident, a fall, or a bullet (BodyStrike records the wounds of blows and of arrows, bolts and darts itself). Returns what the wound is and the body state.', {
        who: str('Character name'),
        species,
        part: partArg,
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'burn', 'bite'] },
        depth: { type: 'string', enum: ['superficial', 'partial', 'deep_partial', 'full'], description: 'Burns: superficial = red, dry skin; partial = blisters; deep_partial = pale, scars; full = through the skin.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species);
        if (!p)
            return error;
        const c = creatureOf(p), part = findPart(c, a.part);
        if (!part)
            return `${a.who}'s parts: ${c.parts.map(x => x.name).join(', ')}. State unchanged.`;
        const w = ['cut', 'puncture', 'bite'].includes(a.type) ? openWound(p, part, a.type, rng) : addWound(p, { part, type: a.type, depth: a.depth }, rng);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));
    tool('BodyStrike', 'Resolve an attack before narrating it: whether it lands, which tissue layers it cuts or smashes, and the wounds it records. Narrate a miss as a miss.', {
        who: str('The one struck'),
        species,
        part: str('Body part aimed at, by name (head, throat, upper body, right upper arm, left eye…). For an unaimed blow leave it empty: code draws the location.'),
        attack: str('The attack: a natural attack of the attacker (punch, kick, bite, scratch, gore…) or, with a weapon, the weapon\'s attack (slash, stab, bash, hack…). Empty for a shot.'),
        weapon: { type: 'string', enum: MELEE, description: 'Melee weapon used, if any; for any other weapon the nearest kind (a club as a mace, a knife as a dagger).' },
        material: { type: 'string', enum: WEAPON_MATERIALS, description: 'Material of the weapon (a metal) or of the ammunition (a metal, bone or wood). Default iron.' },
        launcher: { type: 'string', enum: ['bow', 'crossbow', 'blowgun'], description: 'For a shot; the ammunition is its arrow, bolt or dart in material. Call it after the shot is on target (BodyCheck for aim); the target can still dodge or block it.' },
        skill: { type: 'string', enum: SKILL_LEVELS, description: 'Attacker\'s fighting skill level. Dabbling = untrained.' },
        defender_expert: { type: 'boolean', description: 'The one struck is an expert of a combat sport or of fighting (years of training, bouts fought): they see a blow coming sooner.' },
        style: { type: 'string', enum: Object.keys(STYLES), description: 'quick = fast weak blow; heavy or wild = full-force blow.' },
        prone: { type: 'boolean', description: 'Target lying on the ground.' },
        from: { type: 'string', enum: ['front', 'back', 'left', 'right'], description: 'Where the attacker strikes from, relative to the way the target faces. Default: front, or back when facing is false.' },
        target_armor: {
            type: 'array',
            description: 'Every item the character hit wears or holds ready, as the story describes it: armour, clothing, a shield, a held board or door.',
            items: {
                type: 'object',
                properties: {
                    item: str('Quality + material + item, "<quality> <material> <item>" as the scene names them. Quality words: well-crafted, finely-crafted, superior, exceptional, masterwork, artifact. With covers, any item name after the material.'),
                    covers: {
                        type: 'array',
                        description: 'What the item physically covers, from its description, as portions. Give it whenever the item differs from the standard one (holes, damage, cut-outs, odd shapes). A helm open at the back = {part: head, sublocations: [forehead, crown], coverage: 100}. Sub-locations: head forehead/crown/nape; upper arm shoulder/upper arm; lower arm elbow/forearm; hand wrist/palm/back of hand; upper leg hip/thigh; lower leg knee/shin; foot sole/arch/ankle/heel.',
                        items: {
                            type: 'object',
                            properties: {
                                part: str('Body part name'),
                                sublocations: { type: 'array', items: { type: 'string', enum: SUBLOCATION_NAMES() }, description: 'Covered sub-locations of the part. Default: the whole part.' },
                                sides: { type: 'array', items: { type: 'string', enum: ['front', 'back'] }, description: 'Covered side. Default: both (a breastplate alone = front).' },
                                coverage: { type: 'number', description: '% of those sub-locations the portion covers (gaps, holes, mesh); default 100.' },
                                material: str('Material of this portion when it differs from the item\'s (a leather nape guard on an iron helm).'),
                            },
                            required: ['part'],
                        },
                    },
                    layer: { type: 'string', enum: ['UNDER', 'OVER', 'ARMOR', 'COVER'], description: 'Worn under clothing, over it, as armour, or as an outer cover.' },
                    held_in: str('Body part holding the item ready (left hand); a held item guards what it is in front of, and a defence in time puts it in the blow\'s way.'),
                    size_cm: { type: 'array', items: { type: 'number' }, description: 'Held item size: [diameter] or [width, height] in cm (round shield [85], door [80, 200]).' },
                    thickness_cm: { type: 'number', description: 'Held item thickness in cm; default 0.9.' },
                    flexible: { type: 'boolean', description: 'Woven or linked (mail, cloth): a blow it stops still passes through as blunt force.' },
                },
                required: ['item'],
            },
        },
        attacker: str('Attacker name; a tracked attacker uses its own species, mass and wounds'),
        attacker_species: str('Attacker\'s species, for an attacker missing from [BODY]. Default human.'),
        attacker_mass_kg: { type: 'number', description: 'Attacker body mass in kg, for an attacker missing from [BODY]; default the species\' adult mass.' },
        target_mass_kg: { type: 'number', description: 'Body mass of the character hit, in kg, the first time this character appears; default the species\' adult mass.' },
        awake: { type: 'boolean', description: 'Target awake. Default true.' },
        facing: { type: 'boolean', description: 'Target looking toward the attacker. Default true.' },
        lit: { type: 'boolean', description: 'Set when the story fixes it: false for darkness, true for lamplight. Default: the light at the target (the sky outdoors, the room\'s flames in a Room), from which code decides whether the target sees the attacker.' },
        noise_db: { type: 'number', description: 'Sound level of the attacker at the target in dB(A). 0 = silent.' },
        noise_sound: { type: 'string', enum: Object.keys(SOUNDS), description: 'The attacker\'s sound, when it is one of these (level at the target is computed from distance_m); the alternative to noise_db.' },
        background: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the target, which can cover the attacker\'s sound. Default quiet room.' },
        under_fire: { type: 'boolean', description: 'For a shot: the shooter is being shot at.' },
        noise_khz: { type: 'number', description: 'Main pitch of that sound in kHz, when it is a tone (whistle, ultrasonic call). Default: broadband noise.' },
        distance_m: { type: 'number', description: 'Distance between attacker and target when the attack starts. Default: from where both stand on the map, else within reach.' },
        approach_speed: { type: 'number', description: 'Attacker\'s speed in m/s while closing the distance.' },
        sense_range_m: { type: 'number', description: 'Range of a sense beyond sight and hearing that the target has (from its species or [WORLD]) and that detects an approaching attacker, m.' },
        intent_visible: { type: 'boolean', description: 'The approach itself shows an attack is coming (charging, weapon raised). False when the attacker looks harmless until the strike starts. Default false.' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species, a.target_mass_kg);
        if (!p)
            return error;
        const attacker = a.attacker && st.people?.[a.attacker] ? st.people[a.attacker] : null;
        const ta = attacker || !a.attacker ? {} : recorded(a.attacker);
        const asp = speciesOf(a.attacker_species || ta.species);
        if (!asp)
            return noSpecies(a.attacker_species || ta.species);
        const { weapon, launcher, material, skill, style, prone, from, awake, facing, lit, noise_db, noise_sound, background, under_fire, noise_khz, approach_speed, sense_range_m, intent_visible, defender_expert } = a;
        // Where both stand is the state's: the map's distance replaces a given one, and a shut wall between stops the attack.
        const map = attacker ? placed(st, attacker, p, a.distance_m) : null;
        if (map?.wall)
            return `A wall stands between ${a.attacker} and ${a.who}: ${map.wall}. State unchanged.`;
        const distance_m = map ? map.d : a.distance_m;
        const scene = { weapon, launcher, material, skill, style: style, prone, from, awake, facing, lit, noise_db, noise_sound, background,
            under_fire, noise_khz, distance_m, approach_speed, sense_range_m, intent_visible, defender_expert };
        if (lit === undefined) {
            const L = lightAt(st, p, storyNow(st));
            if (L)
                scene.lux = L.lux;
        }
        {
            const c = crowdDb(st, p);
            if (c != null)
                scene.background_db = sumDb(NOISE[background ?? 'quiet room (25 dB)'] ?? 25, c);
        }
        const out = strike(p, { part: a.part, attack: a.attack, species: asp, mass: Number(a.attacker_mass_kg) || ta.mass, armor: a.target_armor,
            ...Object.fromEntries(Object.entries(scene).filter(([, v]) => v !== undefined)) }, attacker, rng);
        const short = map && / stays out of reach /.test(out) ? ` On the map ${a.attacker} stands at ${attacker.at} and ${a.who} at ${p.at}: an Act walk_to "${p.at}" closes the distance first, or approach_speed makes it a charge.` : '';
        return `${out}${map?.note ?? ''}${short} ${status(a.who, p)}`;
    }));
    tool('BodyChoke', 'Resolve a choke or strangling hold on the neck once the hold is locked, before narrating its effect.', {
        who: str('Character choked'),
        holder: str('Character holding the choke'),
        seconds: { type: 'number', description: 'Seconds the locked hold is kept on' },
    }, ['who', 'seconds'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (!p)
            return error;
        const holder = a.holder && st.people?.[a.holder] ? st.people[a.holder] : null;
        // A hold needs the holder's arms on the neck: on the map, the two stand within the holder's reach (0.88 m at 70 kg).
        const map = holder ? placed(st, holder, p, undefined) : null;
        if (map && (map.wall || map.d > reachOf(holder.mass)))
            return `${a.holder} stands at ${holder.at} and ${a.who} at ${p.at}, ${map.wall ? `a wall between (${map.wall})` : `${map.d} m apart on the map`}: no hold. An Act walk_to "${p.at}" brings ${a.holder} there first. State unchanged.`;
        return `${choke(p, a.seconds, holder, rng)} ${status(a.who, p)}`;
    }));
    tool('BodyEnvironment', 'Set the air, water and clothing characters are in whenever they enter a different climate, go into or out of water, the weather changes, or they change clothes; PassTime then works out body temperature, sweating, hypothermia, heat stroke and frostbite. clear = back to unrecorded (comfortable) conditions.', {
        who: { type: 'array', items: { type: 'string' }, description: 'Characters in these conditions' },
        air_c: { type: 'number', description: 'Air temperature, °C' },
        radiant_c: { type: 'number', description: 'Mean radiant temperature, °C: about air temperature in shade or indoors; higher in strong sun or by a fire (desert sun 60–70), lower under a clear night sky' },
        humidity_pct: { type: 'number', description: 'Relative humidity, %. Default 50' },
        wind_kmh: { type: 'number', description: 'Weather wind speed outdoors (as forecast, at 10 m), km/h. 0 = calm' },
        air_speed_ms: { type: 'number', description: 'Indoors or sheltered: air speed at the body, m/s (still room 0.1)' },
        ensemble: { type: 'string', enum: Object.keys(ENSEMBLES), description: 'Clothing as a measured ensemble when one matches' },
        garments: {
            type: 'array',
            description: 'Clothing as garments (alone or on top of an ensemble). Name from the list or clo for anything else; covers = body regions (head, neck, chest, back, torso, pelvis, shoulders, arms, forearms, hands, thighs, lower legs, legs, feet, or one side: left hand…)',
            items: { type: 'object', properties: { name: { type: 'string', enum: Object.keys(GARMENTS), description: 'Garment from the list; for any other garment, its clo' }, clo: { type: 'number', description: 'Insulation of any other garment, clo' }, covers: { type: 'array', items: { type: 'string', enum: REGION_WORDS } } }, required: ['covers'] },
        },
        water_c: { type: 'number', description: 'Water temperature, °C, when any body region is in water' },
        immersed: { type: 'array', items: { type: 'string', enum: IMMERSION_WORDS }, description: 'Regions in water: "whole body" (neck down, head out), "submerged" (head under too), or regions (legs, feet, torso, arms…)' },
        swimming: { type: 'boolean', description: 'Swimming (met 6 for ordinary swimming, higher for faster); cold arms end swimming' },
        afloat: { type: 'boolean', description: 'Kept afloat with the head out by a life jacket, wreckage or a boat' },
        water_speed_ms: { type: 'number', description: 'Water moving past the body (current, swimming), m/s. Default 0' },
        immersion_suit: { type: 'boolean', description: 'Clothing is a dry suit or immersion suit that keeps water out' },
        face_covered: { type: 'boolean', description: 'Face covered (a mask or a scarf over the face). Default false' },
        met: { type: 'number', description: 'Activity in METs for the whole span when fixed (Compendium of Physical Activities values: sleeping 0.95, sitting quietly 1.3, walking 3 mph 3.5). Default: as PassTime sets it (sleeping 0.95, resting 1.3, active 3.5)' },
        activity: str('What the characters are doing, in plain words ("chopping wood", "sitting in a lecture", "rowing a boat"), code takes the Compendium value (or give met)'),
        altitude_m: { type: 'number', description: 'Altitude above sea level, m, whenever it changes by 500 m or more. 0 = sea level' },
        sudden_ascent: { type: 'boolean', description: 'Arrived at this altitude within minutes' },
        decompression: { type: 'boolean', description: 'A pressurized cabin or enclosure suddenly opened at this altitude (breath torn out; shorter time conscious)' },
        co_ppm: { type: 'number', description: 'Carbon monoxide in the air, ppm (fire smoke in a room 1000–10 000; a faulty stove or heater 100–1000); 0 = fresh air' },
        o2_pct: { type: 'number', description: 'Oxygen in the air, % (normal 20.9; a fire-filled or sealed room or gas-displaced air lower). Default: 20.9' },
        smoke: { type: 'boolean', description: 'Breathing fire smoke (causes inhalation injury)' },
        swimmer: { type: 'boolean', description: 'Whether the character can swim, when the story has established it; otherwise code draws it once (46 % of adults)' },
        deep_water: { type: 'boolean', description: 'Water over the head. Default true when immersed.' },
        clear: { type: 'boolean', description: 'Remove recorded conditions' },
        weather_place: str('Outdoors: the town or city the characters are in or nearest to ("<town>" or "<town>, <country>"); air temperature then follows that place\'s weather as PassTime runs (air_c then optional).'),
        latitude: { type: 'number', description: 'With weather_place for any other place (fictional or remote): its latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, ['who'], async (a) => {
        if (a.weather_place)
            await prefetchWeather(findPlace(a.weather_place, a.latitude, a.longitude), storyNow(store().state));
        const act = a.met == null && a.activity ? activityMet(a.activity) : null;
        if (act)
            a = { ...a, met: act.met };
        return run((st, rng) => {
            const out = act ? [`Activity: ${act.description} (${act.met} MET, Compendium ${act.code}).`] : a.activity && a.met == null ? [`No Compendium activity matches "${a.activity}"; give met to set it.`] : [];
            for (const name of a.who) {
                const { p, error } = who(st, name);
                if (!p) {
                    out.push(error);
                    continue;
                }
                if (a.clear) {
                    setEnvironment(p, null);
                    delete p.doing;
                    out.push(`${name}: conditions cleared.`);
                    continue;
                }
                if (a.activity)
                    p.doing = String(a.activity);
                // Into water: whether they can swim, drawn once from their sex and country (body-engine swimShare), unless the story says.
                if (a.immersed?.length && a.swimmer == null && p.canSwim == null && (!p.species || /^human$/i.test(p.species)))
                    p.canSwim = rng() < swimShare(p.sex, p.country ?? st.setting?.country);
                if (a.altitude_m != null)
                    setAltitude(p, a.altitude_m, !!a.sudden_ascent, !!a.decompression);
                const place = a.weather_place ? findPlace(a.weather_place, a.latitude, a.longitude) : null;
                if (a.weather_place && !place) {
                    out.push(`No weather data for "${a.weather_place}": give the nearest real town, or latitude and longitude.`);
                    continue;
                }
                const w = place ? weatherAt(place.key, storyNow(st)) : null;
                if (place && !w) {
                    out.push(dateOf(storyNow(st)) ? noClimate(place.label || place.key) : NO_DATE('weather_place'));
                    continue;
                }
                p.weather = w && place ? place.key : null;
                if (place)
                    setPlace(st, place);
                if (a.air_c == null && w)
                    a = { ...a, air_c: w.tempC, radiant_c: a.radiant_c ?? w.tempC };
                if (a.air_c == null) {
                    out.push(a.altitude_m != null ? status(name, p) : 'air_c is required.');
                    continue;
                }
                if (!thermalCapable(p.species) && !creatureOf(p)?.homeotherm) {
                    out.push(`${name}: cold-blooded; the body takes the air's temperature (left to the story).`);
                    continue;
                }
                try {
                    setEnvironment(p, { ...a, air_c: a.air_c, clothing: { ensemble: a.ensemble, garments: a.garments } });
                }
                catch (e) {
                    return `${e.message} State unchanged.`;
                }
                out.push(status(name, p));
            }
            return out.join('\n');
        });
    });
    tool('BodyIntake', 'Record drinking or eating the moment it happens; untreated water may carry infection.', {
        who: str('Character name'),
        water_l: { type: 'number', description: 'Water drunk, litres (a cup 0.25, a bottle 0.5–1)' },
        food_kcal: { type: 'number', description: 'Food energy eaten, kcal (bread slice 80, apple 95, meal 600–900)' },
        food_g: { type: 'number', description: 'Weight of food eaten, g, when known' },
        carb_g: { type: 'number', description: 'Carbohydrate in it, g, when known (code computes the energy and checks food_kcal)' },
        protein_g: { type: 'number', description: 'Protein in it, g, when known' },
        fat_g: { type: 'number', description: 'Fat in it, g, when known' },
        alcohol_g: { type: 'number', description: 'Pure alcohol drunk, grams (beer 330 mL 13 g, wine glass 150 mL 14 g, spirit shot 40 mL 13 g)' },
        water_source: { type: 'string', enum: WATER_SOURCES, description: 'Where untreated water came from (river, well, rain barrel). Default: treated tap or bottled water' },
        boiled: { type: 'boolean', description: 'The water was brought to a rolling boil first' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (!p)
            return error;
        const note = intake(p, a);
        // Boiling at a rolling boil kills the reference pathogens (WHO 2015, technical brief "Boil water").
        const w = a.water_source && !a.boiled ? drinkWater(a.water_source, Number(a.water_l) || 0, rng) : null;
        const sick = w?.ill.length ? ` ${a.who} caught ${w.ill.join(' and ')}: diarrhoea and cramps start within days.` : w?.infected.length ? ` ${a.who} carries an infection without falling ill.` : '';
        return (note ? `Food: ${note}. ` : '') + status(a.who, p) + sick;
    }));
    // A strong feeling raises the voice: peak speech level of 48 women students enacting a message, strong minus weak intensity,
    // anger +4.46 dB, liking +1.19 dB (Kimble, Forte & Yoshikawa 1981, J Pers 49:271, Table 2, mean of camera and person targets).
    const FEELING_DB = { 'intense anger': 4.46, 'intense affection': 1.19 };
    // The rise of a voice in noise (Lombard effect) is acoustics.ts lombardDb, applied in reach() on the speech spectrum.
    tool('Communicate', 'Decide what a message carries from one character to another (speech or gesture) before narrating a reply or reaction. Returns whether the words, only the tone, or nothing reaches the listener.', {
        speaker: str('Character sending the message'),
        listener: str('Character receiving it'),
        means: { type: 'string', enum: ['speech', 'gesture'] },
        lit: { type: 'boolean', description: 'Enough light to see a gesture. Default true.' },
        distance_m: { type: 'number', description: 'Distance between them, m. Default: from where both stand on the map, else 1.' },
        effort: { type: 'string', enum: ['whisper', 'normal', 'raised', 'loud', 'shout'], description: 'Vocal effort. Default normal.' },
        feeling: { type: 'string', enum: ['intense anger', 'intense affection'], description: 'When the speaker voices a strong feeling: it raises the voice within the chosen effort' },
        voice_feeling: { type: 'string', enum: FEELINGS, description: 'The feeling the speaker\'s voice carries, when the player\'s marks or the story give one: the listener may hear another' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between them. Default none.' },
        ...WAY_PROPS,
        speaker_species: str('Speaker\'s species, when the engine has no record of them yet.'),
        listener_species: str('Listener\'s species, when the engine has no record of them yet.'),
        speaker_languages: { type: 'array', items: { type: 'string' }, description: 'Languages the speaker knows, when the story states them; kept for later calls.' },
        listener_languages: { type: 'array', items: { type: 'string' }, description: 'Languages the listener knows, when the story states them; kept for later calls.' },
        message: str('What the message says, one short sentence. When it reaches the listener, the listener comes to know it.'),
        speaker_voice: { type: 'string', enum: ['normal', 'whisper only (no vocal-fold vibration)'], description: 'When the story makes the speaker voiceless (larynx removed, vocal folds paralysed); kept for later calls.' },
    }, ['speaker', 'listener'], a => run((st, rng) => {
        const s = who(st, a.speaker, a.speaker_species), l = who(st, a.listener, a.listener_species);
        if (!s.p || !l.p)
            return s.error || l.error;
        // A language is the stage spoken in the story's year; one not spoken then is refused (languages.ts).
        const year = storyYear(st);
        const late = [...a.speaker_languages ?? [], ...a.listener_languages ?? []].map(x => cannotExist(x, year, CURRENT_BOOK, 'language')).find(Boolean);
        if (late)
            return `State unchanged: ${late}.`;
        if (a.speaker_languages?.length)
            s.p.languages = a.speaker_languages.map(x => x.trim().toLowerCase());
        if (a.listener_languages?.length)
            l.p.languages = a.listener_languages.map(x => x.trim().toLowerCase());
        if (a.speaker_voice) {
            if (a.speaker_voice === 'normal')
                delete s.p.voice;
            else
                s.p.voice = 'whisper';
        }
        // A speaker without voice whispers at every effort: a whisper, or a loud whisper when they raise it.
        const effort = s.p.voice === 'whisper' ? (!a.effort || a.effort === 'normal' || a.effort === 'whisper' ? 'whisper' : 'loud whisper') : a.effort ?? 'normal';
        const langs = [s.p.languages?.map(x => stageKey(x, year)), l.p.languages?.map(x => stageKey(x, year))];
        // On the map: distance from the two spots; different rooms with no open doorway between → a plaster wall [ASSUMED default].
        const geo = between(st, s.p, l.p);
        // A gesture is made out when the listener recognizes a hand-sized shape (0.088 m, ANSUR II) at the distance in the light
        // there, one draw (E13), unless the story says whether it is lit.
        const L = a.means === 'gesture' && a.lit === undefined ? lightAt(st, l.p, storyNow(st)) : null;
        const map = placed(st, s.p, l.p, a.distance_m), distance = map?.d ?? a.distance_m ?? 1;
        const lit = a.lit ?? (L ? rng() < see({ size: 0.088, distance, light: seeLux(l.p, L.lux) }).recognize : true);
        const crowd = crowdDb(st, l.p);
        let out = communicate(a.speaker, s.p, a.listener, l.p, { way: wayFor(st, l.p, a, geo ? geo.ra === geo.rb : (!a.barrier || a.barrier === 'none')), means: a.means, lit, languages: langs, distance, effort, noise: a.noise ?? 'quiet room (25 dB)', ...crowd == null ? {} : { noise_db: sumDb(NOISE[a.noise ?? 'quiet room (25 dB)'] ?? 25, crowd) }, barrier: a.barrier ?? (geo && geo.ra && geo.rb && geo.ra !== geo.rb && !geo.open ? 'plaster wall' : 'none'), louder_db: a.feeling ? FEELING_DB[a.feeling] : 0, brazil: /brazil/i.test(st.setting?.country ?? '') });
        if (map?.note)
            out = out.replace(/\.?$/, `${map.note}.`);
        // Bystanders on the map overhear (E21): each tracked person awake there, other than the two, is a listener at their own
        // distance from the speaker, through a wall between a room and another or the outdoors with no open doorway [ASSUMED, as
        // for footsteps], over the
        // background there; one who makes out words comes to know the message as overheard. At most 8, nearest first.
        const overheard = [];
        if (st.map && s.p.at && a.means !== 'gesture') {
            const near = Object.entries(st.people ?? {}).filter(([n, q]) => n !== a.speaker && n !== a.listener && q.at && !q.dead && !q.unconscious)
                .map(([n, q]) => ({ n, q, g: between(st, s.p, q) })).filter(x => x.g?.d != null).sort((x, y) => x.g.d - y.g.d).slice(0, 8);
            for (const { n, q, g } of near) {
                const wall = !!((g.ra || g.rb) && g.ra !== g.rb && !g.open), qCrowd = crowdDb(st, q);
                const r = communicate(a.speaker, s.p, n, q, { way: wayFor(st, q, a, !wall), means: 'speech', lit: true, languages: [langs[0], q.languages?.map(x => stageKey(x, year))], distance: Math.max(1, g.d), effort, noise: a.noise ?? 'quiet room (25 dB)', ...qCrowd == null ? {} : { noise_db: sumDb(NOISE[a.noise ?? 'quiet room (25 dB)'] ?? 25, qCrowd) }, barrier: wall ? 'plaster wall' : 'none', louder_db: a.feeling ? FEELING_DB[a.feeling] : 0, brazil: /brazil/i.test(st.setting?.country ?? '') });
                if (!/\bhears\b/.test(r))
                    continue;
                overheard.push(`${r.split(' (')[0].replace(/\.$/, '')} (${Math.round(g.d)} m${wall ? ', through a wall' : ''})`);
                if (a.message && /makes out (every word|most words|some words)/.test(r) && !/language foreign/.test(r))
                    learn(st, String(a.message), [n], false, { [n]: `overheard ${a.speaker}` }, 'said');
            }
        }
        const over = overheard.length ? ` [OVERHEARD] ${overheard.join('; ')}.` : '';
        // A feeling in the voice is heard right as often as listeners hear it in a voice: Juslin & Laukka 2003's accuracy for
        // that feeling (prosody.ts heardRight), across cultures when speaker and listener share no language they are known to
        // speak; otherwise one of the other four feelings is heard, each as likely [ASSUMED equal confusions]: the meta-analysis
        // gives accuracy, not the confusions. Only a voice that is heard carries it.
        if (a.voice_feeling && FEELINGS.includes(a.voice_feeling) && /\bhears\b/.test(out)) {
            const meant = a.voice_feeling, sl = s.p.languages, ll = l.p.languages;
            const same = !sl?.length || !ll?.length || sl.some(x => ll.includes(x));
            const heard = rng() < heardRight(meant, same) ? meant : FEELINGS.filter(f => f !== meant)[Math.floor(rng() * 4)];
            out = `${out.replace(/\.$/, '')}; in the voice ${a.listener} hears ${heard}${heard === meant ? '' : ` (${a.speaker} meant ${meant})`}.`;
        }
        // The message takes its speaking time on the clock.
        const said = a.message ? Math.max(1, String(a.message).trim().split(/\s+/).length / WORDS_PER_S) : 0;
        const talk = said ? `${passSeconds(st, said, new Set([a.speaker, a.listener]), rng)}`.replace(/^ Clock now/, ` Said in ${honest(said)}; clock now`) : '';
        if (!a.message || !/makes out (every word|most words|some words)|sees the gesture/.test(out) || /language foreign to it/.test(out))
            return out + talk + over;
        // A list longer than the listener's working memory is kept in part (knowledge.ts heldOfMessage); the speaker keeps it whole.
        l.p.span ??= 4 + Math.max(-2, Math.min(2, gauss(rng)));
        const held = heldOfMessage(a.message, l.p.span);
        // What was said is a saying ([as said] in [KNOWS]): the world holds it where a fact of its own says the same.
        if (held.dropped) {
            learn(st, a.message, [a.speaker], false, {}, 'said');
            learn(st, held.kept, [a.listener], false, { [a.listener]: `told by ${a.speaker}` }, 'said');
        }
        else
            learn(st, a.message, [a.speaker, a.listener], false, { [a.listener]: `told by ${a.speaker}` }, 'said');
        // The listener has now heard this speaker (a baseline for judging them later, SocialResponse statements).
        (st.acquainted ??= {})[`${norm(a.listener)}|${norm(a.speaker)}`] = true;
        // English speech is already on the page in its own words; another language's words are not. A whisper loses voicing
        // in any language, English included (colex.ts).
        const whispers = effort === 'whisper' || effort === 'loud whisper';
        const snr = l.p.heard?.from === a.speaker ? l.p.heard.snr : Infinity, noisy = snr < 12;
        const spoken = whispers || noisy ? (s.p.languages ?? ['english']).find(x => !l.p.languages?.length || l.p.languages.includes(x))
            : (s.p.languages ?? []).find(x => x !== 'english' && (!l.p.languages?.length || l.p.languages.includes(x)));
        const stage = spoken ? resolveLanguage(spoken, year, CURRENT_BOOK) : null;
        const shared = spoken ? sharedIn(a.message, spoken, 3, whispers, stage.list, snr) : [];
        const one = shared.length ? ` In ${stage.label}${whispers ? ', whispered,' : ''} a word can also be taken as: ${shared.map(x => `"${x.word}"${x.sound ? ` = ${x.sound}` : ''} (${x.also.slice(0, 4).join(', ')})`).join('; ')}. Call Interpret for each one whose reading changes what ${a.listener} does.` : '';
        const knowsNow = held.dropped ? `${held.kept}. Heard once, a list of ${held.total} items: ${a.listener} holds ${held.total - held.dropped} of them (working memory)` : a.message.replace(/[.!?]?$/, '');
        return `${out} ${a.listener} now knows: ${knowsNow}.${one}${talk}${over}`;
    }));
    // A listener takes a word that has several meanings in the spoken language in the one the scene supports; when the scene
    // supports more than one, each is equally likely [ASSUMED: no published rate of misreading per context]. Context usually
    // settles a word of several meanings (Piantadosi, Tily & Gibson 2012, Cognition 122:280), so most calls give the meaning
    // intended. A misreading is kept as the listener's own fact: it shows only when the story reaches what depends on it.
    tool('Interpret', 'Decide which meaning a listener takes from a word that has several meanings in the language spoken, or that sounds like another word when whispered, after Communicate names it, before narrating their response.', {
        speaker: str('Who said it'),
        listener: str('Who heard it'),
        language: str('The language spoken'),
        word: str('The English word as the speaker meant it, as Communicate names it'),
        fits: { type: 'array', items: { type: 'string' }, description: 'Every meaning, from the word and those Communicate lists, that what the listener knows and sees in the scene leaves possible' },
    }, ['speaker', 'listener', 'language', 'word', 'fits'], a => run((st, rng) => {
        const list = resolveLanguage(a.language, storyYear(st), CURRENT_BOOK).list, code = list === undefined ? languageCode(a.language) : list;
        if (!code)
            return `No word list for ${a.language} in this period; ${a.listener} takes "${a.word}" as meant.`;
        // Weights: the meaning intended 1; another meaning of the same word 1 (equal chance); a word the whisper may be heard
        // as, its odds r/(1 − r), so that with one such word it is heard so with share r.
        const meant = a.word.toLowerCase(), weight = new Map([[meant, 1]]);
        if (a.language.toLowerCase() !== 'english')
            for (const c of sharedWith(a.word, code))
                weight.set(c, 1);
        const heard = who(st, a.listener).p?.heard;
        if (who(st, a.speaker).p?.voice === 'whisper' || heard?.from === a.speaker && heard.whisper)
            for (const x of whisperedAs(a.word, code))
                weight.set(x.concept, x.rate / (1 - x.rate));
        if (heard?.from === a.speaker)
            for (const x of noisyAs(a.word, code, heard.snr))
                weight.set(x.concept, Math.max(weight.get(x.concept) ?? 0, x.rate / (1 - x.rate)));
        const fits = [...new Set((a.fits ?? []).map(x => x.trim().toLowerCase().replace(/ if (whispered|misheard)$/, '').replace(/ = .*$/, '')))].filter(x => weight.has(x));
        // Fits that name none of the readings: the listener takes the word as spoken.
        if (!fits.length)
            fits.push(String(a.word).trim().toLowerCase());
        if (!weight.has(fits[0]))
            return `${a.listener} takes "${a.word}" as spoken.`;
        let u = rng() * fits.reduce((t, x) => t + weight.get(x), 0), reading = fits[fits.length - 1];
        for (const x of fits)
            if ((u -= weight.get(x)) < 0) {
                reading = x;
                break;
            }
        if (reading === meant)
            return `${a.listener} takes "${a.word}" as ${a.speaker} meant it.`;
        const why = weight.get(reading) === 1 ? `one word in ${a.language}` : `heard as that word in ${a.language}`;
        const s1 = soundOf(a.word, code), s2 = soundOf(reading, code);
        learn(st, `${a.listener} took ${a.speaker}'s word for "${a.word}"${s1 ? ` (${s1})` : ''} to mean "${reading}"${s2 && s2 !== s1 ? ` (${s2})` : ''} (${why})`, [a.listener], false, { [a.listener]: 'heard it' });
        return `${a.listener} takes "${a.word}" to mean "${reading}"; ${a.speaker} is unaware of it. Narrate the English word as spoken; the misreading shows only through what ${a.listener} says and does, now or when it comes to matter.`;
    }));
    tool('Appraise', 'Decide which emotions a character feels about something, before narrating their feelings. The answers describe how the character sees it; the emotion types follow from them.', {
        who: str('Character feeling it'),
        about: { type: 'string', enum: ABOUT },
        target: str('The person, thing or event it is about, a few words'),
        matters: { type: 'string', enum: MATTERS, description: 'How much it touches the character\'s goals, standards or tastes' },
        good: { type: 'boolean', description: 'For an event or prospect: it is (or would be) good for the one it affects' },
        wants_it_for_them: { type: 'boolean', description: 'For an event that affects someone else: the character wants that outcome for them' },
        came_true: { type: 'boolean', description: 'For a hoped-for or feared event: it came true' },
        praiseworthy: { type: 'boolean', description: 'For an action: the character judges it praiseworthy (false: blameworthy)' },
        result_for_them: { type: 'string', enum: ['good', 'bad', 'none'], description: 'For an action: what its result means for the character. Default none.' },
        appealing: { type: 'boolean', description: 'For a person or thing encountered: the character finds it appealing' },
        sudden: { type: 'boolean', description: 'It came suddenly and unexpectedly' },
        can_be_changed: { type: 'boolean', description: 'For a bad outcome: someone could still change or stop it (false: nothing anyone does will change it)' },
        they_can_change_it: { type: 'boolean', description: 'For a bad outcome someone could change: the character could change or stop it themselves' },
        emotion_word: { type: 'string', enum: EMOTION_WORDS, description: 'The plain word for the feeling when one fits (fear = a present threat; anxiety = a feared prospect)' },
    }, ['who', 'about', 'matters'], a => run((st, rng) => {
        const types = occTypes({ about: a.about, good: a.good !== false, wants: a.wants_it_for_them !== false, cameTrue: a.came_true !== false,
            praiseworthy: a.praiseworthy !== false, result: a.result_for_them ?? 'none', appealing: a.appealing !== false });
        if (!types)
            return `Unknown appraisal "${a.about}". Use one of: ${ABOUT.join('; ')}.`;
        if (a.matters === MATTERS[0])
            return `${a.who} stays calm${a.target ? ` about ${a.target}` : ''}: too little at stake for an emotion.`;
        const strong = a.matters === MATTERS[2];
        const words = (t) => { const w = TYPES[t].words.split(', '), h = Math.ceil(w.length / 2); return (strong ? w.slice(h - 1) : w.slice(0, h)).join(', '); };
        const [main, ...with_] = types;
        const lasts = lastsWords(main, a.emotion_word);
        // A tracked character keeps the feeling for a drawn time: exponential with the measured median duration (Verduyn &
        // Lavrijsen 2015, the hours behind lastsWords) [ASSUMED shape]; [BODY] shows it until it runs out (E30). The same study:
        // across emotions, mean log10(duration, s) rose 0.14 per point of event importance (0–6 scale; B = .14, p = .018), and
        // women's emotions lasted longer than men's (mean log10 4.42 against 4.04; medians 5.04 h and 2 h; 112 women, 118 men).
        // So the median × 10^(0.14 (I − 4.5)) with I = 3 when the event touches a goal and 6 when it is central [ASSUMED mapping
        // and midpoint], × 10^(4.42 − 4.225) for a woman and 10^(4.04 − 4.225) for a man (4.225, the sample's pooled mean).
        const kept = st.people?.[String(a.who)], medianH = (a.emotion_word ? EMOTION_HOURS[a.emotion_word] : undefined) ?? LASTS_H[main];
        const scale = 10 ** (0.14 * ((strong ? 6 : 3) - 4.5)) * (kept?.sex === 'female' ? 10 ** (4.42 - 4.225) : kept?.sex === 'male' ? 10 ** (4.04 - 4.225) : 1);
        // Its strength, for the voice (index.ts feelingOf): 1 when the event is central to a goal, standard or taste, less when it
        // only touches one (emotion.ts voiceFeelingTouched).
        // The appraisal itself, as answered (expression-set.ts, section 111), kept on the feeling: its look is read from the input,
        // not from the type's name.
        const ix = ABOUT.indexOf(a.about), answers = { about: a.about, strength: strong ? 1 : 0.5, sudden: a.sudden === true,
            ...ix === 0 || ix === 2 ? { good: a.good !== false } : {}, ...ix === 1 ? { good: a.good !== false, wants: a.wants_it_for_them !== false } : {},
            ...ix === 3 ? { good: a.good !== false, cameTrue: a.came_true !== false } : {}, ...ix === 4 || ix === 5 ? { praiseworthy: a.praiseworthy !== false, result: a.result_for_them ?? 'none' } : {},
            ...ix === 6 ? { appealing: a.appealing !== false } : {} };
        // For a bad outcome, how the character can cope with it, where the narrator says (the face's control and power).
        if (conduciveness(answers) < 0 && a.can_be_changed != null) {
            answers.control = a.can_be_changed;
            if (a.can_be_changed && a.they_can_change_it != null)
                answers.power = a.they_can_change_it;
        }
        const key = stateKey(answers);
        if (kept && medianH)
            kept.feelings = [...(kept.feelings ?? []).filter(f => f.type !== main), { type: main, strength: strong ? 1 : peek('voiceFeelingTouched'), state: key, ...a.target ? { about: String(a.target) } : {}, left: medianH * scale * 60 * Math.log2(1 / Math.max(1e-9, rng())), turn: (globalThis.SillyTavern?.getContext?.()?.chat ?? []).filter(m => m.is_user).length }];
        return `${a.who} feels ${main}${with_.length ? `, together with ${with_.join(' and ')}` : ''}${a.target ? ` (${a.target})` : ''}. Words at this strength: ${words(main)}; it grows stronger ${TYPES[main].stronger}.${lasts ? ` ${lasts[0].toUpperCase()}${lasts.slice(1)}, longer the more it matters to ${a.who}.` : ''}`;
    }));
    // The country of each listed city, and the city that stands for a country (its first listed city, or its capital) [stated
    // geography; the stand-in city is ASSUMED to speak for the whole country].
    const CITY_OF = [
        [/united kingdom|england|great britain|britain|scotland|wales/i, 'London', ['London', 'England']],
        [/netherlands|holland/i, 'Amsterdam', ['Amsterdam']], [/belgium|flanders/i, 'Antwerp', ['Antwerp']],
        [/italy/i, 'Florence', ['Florence', 'Naples', 'Milan']], [/spain/i, 'Madrid', ['Valencia', 'Madrid', 'Barcelona', 'Seville']],
        [/france/i, 'Paris', ['Paris', 'Strasbourg']], [/germany|prussia|bavaria|saxony/i, 'Leipzig', ['Augsburg', 'Leipzig', 'Munich', 'Hamburg', 'Frankfurt', 'Gottingen', 'Nurnberg', 'Quedlinburg', 'Rostock', 'Wurzburg']],
        [/austria/i, 'Vienna', ['Vienna', 'LowerAustria', 'UpperAustria', 'Salzburg', 'Styria', 'Tyrol', 'Carinthia', 'Carniola']],
        [/poland/i, 'Warsaw', ['Gdansk', 'Krakow', 'Warsaw', 'Lwow', 'Cracow', 'Lublin', 'Poznan']], [/portugal/i, 'Lisbon', ['Lisbon', 'Porto', 'Coimbra', 'Evora']],
        [/sweden/i, 'Stockholm', ['Stockholm']], [/russia/i, 'Moscow', ['Moscow', 'Saint Petersburg']], [/turkey|ottoman/i, 'Istanbul', ['Istanbul']],
        [/egypt/i, 'Cairo', ['Cairo']], [/japan/i, 'Kyoto', ['Kyoto', 'Japan', 'Edo']], [/china/i, 'Beijing', ['Beijing', 'Suzhou', 'Canton']],
    ];
    const cityOfCountry = (c) => CITY_OF.find(([re]) => re.test(c))?.[1] ?? null;
    const cityCountry = (city) => CITY_OF.find(([, , list]) => list.includes(city))?.[1] ?? null;
    // Work time as a person says it: minutes under an hour, to the nearest five ("about 20 minutes of a 10-hour day"); a
    // narrator turning "0.3 hours" into words wrote "a quarter hour".
    const spokenWork = (hours) => hours < 1 ? `about ${Math.max(5, Math.round(hours * 12) * 5)} minutes of a 10-hour day` : `about ${Math.round(hours * 2) / 2} hours of a 10-hour day`;
    // Preparation before contact (after Simulation Blackboard's review rule, "facts established before a dependent outcome"):
    // what a look, a listen or a deduction can find is the fact itself, fixed before the check decides whether it is found.
    // A reveals written as a question left the finding to the narrator ("Mara now knows: who is inside the lit room").
    const asQuestion = (r) => typeof r === 'string' && /^\s*(?:who|what|whether|if|where|how|which|why|when|anything|anyone|someone)\b/i.test(r);
    const REVEALS_FACT = 'reveals is the fact itself as the scene holds it, written before the check decides whether it is found ("a grey-haired man counting coins into an iron box at a desk"). State unchanged.';
    // The markets and years the data cover are the city list's (fitted to the story's year: scene-fit.ts).
    tool('Price', 'Decide what goods cost, what a day of work pays, what a year of necessities costs, or what English money is worth, before narrating a sale, a wage or a bill. Returns grams of silver and the days a building labourer works to earn it. A good outside the list is priced with good and like, from the listed good it is most like.', {
        question: { type: 'string', enum: PRICE_QUESTIONS },
        item: { type: 'string', enum: GOODS_LIST, description: 'For the price of goods: a listed good' },
        good: str('For goods outside the list: the good in the story\'s words; give like with it'),
        like: { type: 'string', enum: GOODS_LIST, description: 'With good: the listed good it is most like (a fruit: apples; a malt drink: beer)' },
        quantity: { type: 'number', description: 'Units of the item (kg, litres, eggs, metres) or days of work. Default 1.' },
        trade: { type: 'string', enum: TRADES, description: 'For a daily wage. Default building labourer.' },
        city: { type: 'string', enum: CITIES, description: 'The city, or the nearest listed one in the same country' },
        country: str('For a daily wage in a country with no listed city, 1820–2008: the country'),
        trade_name: str('For the hourly pay of a modern trade 1953–2008 (with country): the occupation, e.g. "welder", "nurse"'),
        money: { type: 'array', items: { type: 'number' }, description: 'For "value of English money": [pounds, shillings, pence] (12 shillings = [0, 12, 0])' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
    }, ['question'], a => run(st => {
        const year = a.year ?? storyYear(st);
        if (year == null)
            return NO_YEAR;
        // English money in silver (Lindert 2006 from Jastram 1981, mint price, 1273–1977), and in a labourer's days where a city is given.
        if (a.question === 'value of English money') {
            const [l = 0, sh = 0, d = 0] = (a.money ?? []).map(Number), pounds = l + sh / 20 + d / 240, g = poundSilver(pounds, year);
            if (g == null)
                return 'English money data cover 1273–1977.';
            const day = a.city && CITIES.includes(a.city) ? price('daily wage', undefined, 'building labourer', 1, a.city, year) : null;
            const days = day && !('error' in day) ? `; a building labourer in ${a.city} earns that in ${Math.round(g / day.silver * 10) / 10} days` : '';
            return `£${l} ${sh}s ${d}d in ${year}: ${Math.round(g * 10) / 10} g of silver${days}.`;
        }
        // A named modern trade: ISCO-88 codes matched in the index, pay from the October Inquiry series (population.ts).
        if (a.trade_name) {
            const w = wageByTrade(String(a.trade_name), a.country ?? st.setting?.country ?? '', year);
            if ('error' in w)
                return w.error;
            return `${a.trade_name} in ${w.country}, ${w.year}: US$${Math.round(w.usd * 100) / 100} an hour (${Math.round(w.relative * 100) / 100} × the country's median; ISCO ${w.codes.slice(0, 3).join(', ')}).`;
        }
        // Markets only the Moatsos wage series cover: baskets per day and days of work per year.
        if (a.city && BASKET_ONLY.includes(a.city)) {
            const b = basketWage(a.city, a.trade === 'building craftsman', year);
            if ('error' in b)
                return b.error;
            return `Daily wage of ${b.class} labour in ${a.city} (${b.country}), ${b.at}: buys ${Math.round(b.rw * 100) / 100} daily subsistence baskets; a year's basket costs ${Math.round(b.daysPerYear)} days of work.`;
        }
        // Outside the listed cities: a labourer's wage by what it buys against a British labourer's the same year (population.ts).
        if (!CITIES.includes(a.city ?? "") && a.country) {
            const w = wageRatio(a.country, year);
            if ('error' in w)
                return w.error;
            const lon = year <= 1913 ? price('daily wage', undefined, 'building labourer', 1, 'London', year) : null;
            const g = lon && !('error' in lon) ? `; in London that buys what ${Math.round(lon.silver * w.ratio * 10) / 10} g of silver buys` : '';
            return `Daily wage of a labourer in ${w.country}, ${year}: buys ${Math.round(w.ratio * 100)} % of what a British labourer's buys${g}.`;
        }
        // No city given: the scene country's listed city.
        // A city the price series holds stands for the country's prices; the scene keeps its own town (a York inn priced "at
        // London prices", not "in London", which moved the scene).
        const inScene = !!a.city && !!st.setting?.label && fold(String(st.setting.label)).startsWith(fold(String(a.city)));
        if (!a.city && st.setting?.country && cityOfCountry(st.setting.country))
            a = { ...a, city: cityOfCountry(st.setting.country) };
        if (!CITIES.includes(a.city ?? ""))
            return 'Give city, or country for a daily wage elsewhere (1820–2008).';
        // A city in another country than the scene's, where the scene's country has a listed city, gives way to that one (a York
        // inn in 1820 was priced in Leipzig).
        const home = st.setting?.country ? cityOfCountry(st.setting.country) : null;
        if (home && cityCountry(a.city) && cityCountry(a.city) !== cityCountry(home))
            a = { ...a, city: home };
        // A good outside the list: priced from the listed good it is most like, the same way each time it is asked (kept in
        // the story: the first answer stands).
        let ref = null;
        if (a.good && referencePrice(String(a.good))?.source !== 'listed')
            a = { ...a, item: undefined };
        if (!a.item && a.good) {
            const kept = st.goodsRef ??= {};
            const k = String(a.good).toLowerCase().trim();
            ref = kept[k] ?? referencePrice(String(a.good), a.like);
            if (!ref)
                return `Give like (the listed good ${a.good} is most like): ${GOODS_LIST.join(', ')}.`;
            kept[k] = ref;
        }
        const r0 = price(a.question, ref?.item ?? a.item, a.trade, Number(a.quantity) || 1, a.city, year);
        if ('error' in r0)
            return r0.error;
        const r = ref && ref.source !== 'listed' ? { ...r0, silver: r0.silver * ref.ratio, labourDays: r0.labourDays == null ? null : r0.labourDays * ref.ratio, what: `${Number(a.quantity) || 1} ${ref.item.startsWith('beans or peas') ? 'kg' : ref.item.match(/\((\w+)/)?.[1] === 'each' ? '×' : ref.item.match(/\((\w+)/)?.[1] ?? '×'} of ${a.good}`, note: [r0.note, ref.source].filter(Boolean).join('; ') } : r0;
        const g = r.silver >= 10 ? Math.round(r.silver) : Math.round(r.silver * 100) / 100;
        // Under a tenth of a day, in hours of a 10-hour working day [ASSUMED day length].
        const days = r.labourDays == null ? '' : `; a building labourer earns that in ${r.labourDays >= 10 ? `${Math.round(r.labourDays)} days` : r.labourDays >= 0.1 ? `${Math.round(r.labourDays * 10) / 10} days` : spokenWork(r.labourDays * 10)}`;
        const at = inScene || (st.setting?.label && fold(String(st.setting.label)).startsWith(fold(String(a.city)))) ? `in ${a.city}` : `at ${a.city} prices`;
        return `${r.what} ${at}, ${year}: ${g} g of silver${coinsOf(r.silver, a.city, year)}${days}${r.note ? ` (${r.note})` : ''}.`;
    }));
    tool('PlaceProfile', 'Decide how large, how urban, how violent and how deadly for infants a country or city is in a year, before narrating a crowd, a town\'s size, a murder rate or a child\'s survival. Returns population, urban share, murders per 100,000, infant deaths per 1,000 births and the nearest listed city.', {
        country: str('The country. Default: the setting\'s country.'),
        city: str('A city name, for its population'),
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
    }, [], a => run(st => {
        const year = a.year ?? storyYear(st);
        if (year == null)
            return NO_YEAR;
        const c = a.country ?? st.setting?.country, out = [];
        const f = (k, fmt) => { const r = countryFact(k, c, year); if (r)
            out.push(fmt(r.v) + (r.year !== year ? ` (${r.year})` : '')); };
        f('population', v => `population ${Math.round(v * 1000).toLocaleString('en')}`);
        f('urban', v => `${Math.round(v * 100)} % in towns`);
        f('homicide', v => `${Math.round(v * 10) / 10} murders per 100,000`);
        // Before the national series: Eisner's regional means (population.ts eisnerHomicide).
        const eh = countryFact('homicide', c, year) ? null : eisnerHomicide(c, year);
        if (eh)
            out.push(`about ${eh.v} murders per 100,000 a year (${eh.where}${eh.few ? ', few estimates' : ''})`);
        // Trust and religion as people there answered the World Values Survey wave 7 (social.ts wvsFor), for years from 2000.
        const wv = year >= 2000 ? wvsFor(c) : null;
        if (wv?.trustMost != null)
            out.push(`${Math.round(wv.trustMost * 100)} % say most people can be trusted${wv.religion != null ? `, ${Math.round(wv.religion * 100)} % call religion important in their life` : ''} (survey ${wv.year})`);
        f('infant', v => `${Math.round(v)} infant deaths per 1,000 births`);
        const cp = a.city ? cityPopulation(String(a.city), year) : null, pos = scenePosition(), near = cp ? null : pos ? cityNear(pos.lat, pos.lon, year) : null;
        if (cp)
            out.push(`${cp.name} (${cp.country}) ${Math.round(cp.pop).toLocaleString('en')} people`);
        else if (near)
            out.push(`nearest listed city ${near.name}, ${near.km} km, ${Math.round(near.pop).toLocaleString('en')} people`);
        return out.length ? `${c ?? a.city}, ${year}: ${out.join('; ')}.` : 'No figures for that place and year.';
    }));
    tool('NameCharacter', 'Give a first name to a character in an American setting whose name is still open, before naming them. Drawn by how many US babies of that sex got the name in their birth decade (1910–2029).', {
        who: str('Label of the character, as the scene names them ("the <role>")'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth (story year minus age)' },
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const n = drawName(a.sex, Number(a.birth_year), rng);
        return n ? `${a.who}: first name ${n}.` : 'US name data cover births 1910–2029.';
    }));
    tool('BodySize', 'Decide the height and body mass of a character whose build the story leaves open (any age: under 19 their height for their age and growth), before describing them, from their country, sex and birth year; eye and hair colour too where the country has data (15 European and Central Asian countries). Records the mass for the body rules.', {
        who: str('The character'),
        country: str('Country the character grew up in (present-day name, e.g. United Kingdom, Nigeria, Japan). Default: the country of the last place given.'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
        species,
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const year = a.year ?? storyYear(st), country = a.country ?? st.setting?.country;
        if (year == null)
            return NO_YEAR;
        if (!country)
            return 'Give country: the scene\'s place is still open.';
        const shift = a.birth_year < H_YEARS[0] ? heightShift(country, a.birth_year, H_YEARS[0]) ?? 0 : 0;
        // The timing of the person's growth (growth.ts), drawn once from a stream of its own: under 19 it sets their height now.
        const known = st.people?.[String(a.who)], timingZ = known?.timingZ ?? gauss(seededRng(`${store().salt}:timing:${a.who}`));
        const r = bodySize(country, a.sex, a.birth_year, year, () => gauss(rng), shift, timingZ);
        if ('error' in r)
            return r.error;
        if (r.notes.length)
            console.debug('[Rules engine]', a.who, r.notes.join('; '));
        const { p, error } = who(st, a.who, a.species);
        if (!p)
            return error;
        p.mass = Math.round(r.massKg);
        p.sex = a.sex;
        p.age ??= year - a.birth_year;
        p.bmiZ = r.bmiZ;
        p.heightCm = Math.round(r.heightCm);
        p.timingZ = timingZ;
        // The person's own speech rate against their language's (voice-body.ts), drawn once from a stream of its own.
        p.rateZ ??= gauss(seededRng(`${store().salt}:rate:${a.who}`));
        // The folds' habitual stretch and the tract's size (voice-sound.ts), the causes the voice is computed from.
        p.stretchZ ??= gauss(seededRng(`${store().salt}:stretch:${a.who}`));
        p.tractZ ??= gauss(seededRng(`${store().salt}:tract:${a.who}`));
        // The person's speaking habits (pocket.ts HABITS): melody range, time in pauses, breathiness, each from a stream of its own.
        p.spanZ ??= gauss(seededRng(`${store().salt}:span:${a.who}`));
        p.pauseZ ??= gauss(seededRng(`${store().salt}:pause:${a.who}`));
        p.breathZ ??= gauss(seededRng(`${store().salt}:breath:${a.who}`));
        const col = pigment(country, rng), looks = [col.eyes && `${col.eyes} eyes`, col.hair && `${col.hair} hair`].filter(Boolean).join(', ');
        return `${a.who}: ${Math.round(r.heightCm)} cm, ${p.mass} kg${looks ? `, ${looks}` : ''}.`;
    }));
    tool('Disease', 'Decide the course of a contagious disease before narrating it: when a character who caught it first shows symptoms, how many people in a community fall ill over the whole outbreak, or what share of a population a historical epidemic (Antonine plague to the plagues of the 1600s) kills.', {
        disease: { type: 'string', enum: DISEASES },
        question: { type: 'string', enum: ['when symptoms start', 'how many fall ill', 'how many die in a historical epidemic', 'what a death among foragers or village farmers was from'] },
        age: { type: 'number', description: 'For "what a death … was from": age at death' },
        epidemic: { type: 'string', enum: EPIDEMIC_NAMES, description: 'For "how many die in a historical epidemic"' },
        who: str('For "when symptoms start": the character who caught it'),
        population: { type: 'number', description: 'For "how many fall ill": people in the community who mix with each other' },
        immune_share: { type: 'number', description: 'Share 0–1 already immune (had it before or vaccinated). Default 0.' },
    }, ['question'], a => run((st, rng) => {
        if (a.question === 'how many die in a historical epidemic') {
            const e = a.epidemic ? EPIDEMICS[a.epidemic] : null;
            if (!e)
                return `Give epidemic: ${EPIDEMIC_NAMES.join('; ')}.`;
            const share = e.low + (e.high - e.low) * rng(), n = Number(a.population) || 0;
            return `${a.epidemic}: it kills ${Math.round(share * 100)} % of the people of ${e.where}${n ? ` — ${Math.round(share * n)} of ${n} here` : ''} (recorded range ${Math.round(e.low * 100)}–${Math.round(e.high * 100)} %).`;
        }
        if (a.question === 'what a death among foragers or village farmers was from') {
            if (a.age == null)
                return 'Give age at death.';
            const c = deathCause(Number(a.age), rng);
            return `${a.who ?? 'The person'} died of ${c}.`;
        }
        if (!a.disease)
            return 'Give disease.';
        if (a.question === 'when symptoms start') {
            if (!INCUBATION[a.disease])
                return `No incubation data for ${a.disease}. Diseases with data: ${Object.keys(INCUBATION).join(', ')}.`;
            const h = incubationHours(a.disease, () => gauss(rng)) ?? 0;
            const when = h < 48 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`;
            return `${a.who ?? 'The infected person'} shows the first symptoms of ${a.disease} ${when} after catching it.`;
        }
        if (!R0[a.disease])
            return `No transmission data for ${a.disease}. Diseases with data: ${Object.keys(R0).join(', ')}.`;
        const sus = 1 - Math.min(1, Math.max(0, Number(a.immune_share) || 0)), z = attackShare(a.disease, sus);
        const n = Number(a.population) || 0;
        if (!z)
            return `No outbreak: too few people can still catch ${a.disease}; only scattered cases.`;
        return `Over the outbreak, ${Math.round(z * sus * n)} of ${n} people fall ill with ${a.disease}${z > 0.9 ? ', nearly everyone who could catch it' : ''}.`;
    }));
    tool('Battle', 'Decide whether an attack on a defended position succeeds, for a battle or engagement between armies or units from 1600 to 1991, before narrating its result. Code decides from the numbers on each side and the year.', {
        attackers: { type: 'number', description: 'Soldiers in the attacking force' },
        defenders: { type: 'number', description: 'Soldiers defending' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
        place: str('The position attacked, a few words'),
        surprise: { type: 'boolean', description: 'The defenders were unaware of the attack until it struck (unwarned by sentries or scouts)' },
    }, ['attackers', 'defenders'], a => run((st, rng) => {
        const year = a.year ?? storyYear(st);
        if (year == null)
            return NO_YEAR;
        const share = attackWinShare(a.attackers, a.defenders, year, !!a.surprise);
        if (share == null)
            return `Battle covers engagements from ${BATTLE_YEARS[0]} to ${BATTLE_YEARS[1]} with both sides' numbers given; decide this one with BodyCheck.`;
        const r = a.attackers / a.defenders, where = a.place ? ` ${a.place}` : ' the position';
        const odds = r < 1 ? 'outnumbered by the defenders' : r < 1.5 ? 'at roughly equal strength' : r < 3 ? 'outnumbering the defenders' : 'outnumbering the defenders many times over';
        const era = (a.surprise ? ', and catching the defenders by surprise' : '') + (year <= 1900 ? '; in battles of this era numbers decided little, and leadership, ground and morale decided the rest' : '');
        const won = rng() < share, c = battleCost(a.attackers, a.defenders, year, won, rng);
        const span = c.hours < 1.5 ? 'about an hour' : c.hours < 36 ? `about ${Math.round(c.hours)} hours` : `about ${Math.round(c.hours / 24)} days`;
        return `The attack on${where} ${won ? 'succeeds' : 'fails'}, the attackers ${odds}${era}. The fighting lasts ${span}. Killed, wounded and captured: attackers ${c.attackerLoss}, defenders ${c.defenderLoss}.`;
    }));
    // Snow or rain: precipitation falls as snow when the day's mean air temperature is at or below 1.0 °C, the Northern
    // Hemisphere mean of the 50 % rain–snow air-temperature threshold (Jennings et al. 2018, Nat Commun 9:1148; range −0.4 to
    // 2.4 °C by region) [day mean as the air temperature: ASSUMED].
    tool('Substance', 'Look up a single chemical compound before narrating what it does physically: whether it is solid, liquid or gas at the temperature (and, for liquid water cooled below its melting point, whether it freezes, from how much there is and what is in it), whether and how hot it burns, when its vapour catches fire, its fire limits in air. Measured values from handbooks; estimates from its structure when unmeasured. A mixture is given as parts by mass ("ethanol 40%, water 60%"); solid fuels by name with their water content.', {
        substance: str('Compound name in English (ethanol, octane, glycerol, carbon dioxide), a SMILES structure, a solid fuel (wood, peat, lignite, bituminous coal), or a mixture "name share%, name share%"'),
        temp_c: { type: 'number', description: 'Temperature it is at, °C (the scene\'s air temperature). Default 20.' },
        moisture_pct: { type: 'number', description: 'For a solid fuel (wood, peat, lignite, bituminous coal, refuse-derived fuel): water, % of its wet weight (fresh-cut wood about 50, seasoned 20)' },
        ash_pct: { type: 'number', description: 'For a solid fuel: ash, % of its dry weight' },
        volume_ml: { type: 'number', description: 'For liquid water cooled below its melting point: how much of it, mL (a cloud droplet 0.0000005, a raindrop 0.03, a cup 250, a bucket 10000); code decides whether it freezes' },
        contents: { type: 'string', enum: [...CONTENTS], description: 'With volume_ml: what the water holds or touches. Default natural water.' },
        minutes: { type: 'number', description: 'With volume_ml: minutes it has been at that temperature' },
    }, ['substance'], async (a) => {
        await Promise.all([loadChem(), loadFuels()]);
        if (/%/.test(a.substance))
            return describeMixture(a.substance, a.temp_c ?? 20);
        const fuel = describeFuel(a.substance, a.moisture_pct ?? 0, a.ash_pct ?? 0);
        if (fuel)
            return fuel;
        // Water cooled below its melting point freezes only once a crystal starts in it: a draw (freezing.ts).
        if (!(Number(a.volume_ml) > 0))
            return describeCompound(a.substance, a.temp_c ?? 20);
        return run((_st, rng) => describeCompound(a.substance, a.temp_c ?? 20, { volumeMl: Number(a.volume_ml), minutes: a.minutes, contents: a.contents, draw: rng }));
    });
    tool('Weather', 'Decide the day\'s weather at the story\'s place from the date and hour in [TIME], before describing it: rain, snow or dry, the amount, the day\'s high and low and the temperature now. The same date always gives the same weather.', {
        place: str('The town or city the scene is in or nearest to ("<town>" or "<town>, <country>"); for a fictional or remote place, the nearest real town or give latitude and longitude. Default: the last place given.'),
        latitude: { type: 'number', description: 'For a place outside the weather lists: latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, [], async (a) => {
        const s0 = store().state, k0 = s0.setting?.place && !a.place && a.latitude == null ? { key: s0.setting.place, label: s0.setting.label ?? '', lat: s0.latitude ?? null, lon: s0.longitude ?? null, country: s0.setting.country ?? null } : null;
        await prefetchWeather(k0 ?? findPlace(a.place, a.latitude, a.longitude), storyNow(s0));
        return run(st => {
            const known = st.setting?.place && !a.place && a.latitude == null ? { key: st.setting.place, label: st.setting.label ?? '', lat: st.latitude ?? null, lon: st.longitude ?? null, country: st.setting.country ?? null } : null;
            const place = known ?? findPlace(a.place, a.latitude, a.longitude);
            if (!place)
                return a.place ? `Give the nearest real town to "${a.place}", or latitude and longitude.` : 'Give place: the scene\'s place is still open.';
            const w = weatherAt(place.key, storyNow(st));
            if (!w)
                return dateOf(storyNow(st)) ? noClimate(place.label || place.key) : NO_DATE('Weather');
            setPlace(st, place);
            const { d, date } = w, r = (x) => Math.round(x);
            const amount = `${d.rainMm >= 10 ? r(d.rainMm) : Math.round(d.rainMm * 10) / 10} mm`;
            const o = w.observed, snowy = o ? o.snowCm > 0 : (d.tmaxC + d.tminC) / 2 <= 1.0;
            // When in the day it falls: the day's total spread over the hours by a rain cascade (weather.ts rainBoxes), fixed for
            // the place and date so every turn of the day reads the same hours.
            const wet = d.wet ? rainNow(rainBoxes(d.rainMm, seededRng(`${store().salt}:rain:${place.key}:${date.toDateString()}`)), Math.floor((storyNow(st) % 1440))) : null;
            const when = wet ? ` (${wet.spells.join(', ')}); ${wet.nowMm >= 0.05 ? `falling now, ${Math.round(wet.nowMm * 10) / 10} mm this hour and a half` : 'none falling now'}` : '';
            const sky = !d.wet ? 'dry' : snowy ? `snow, ${o ? `${Math.round(o.snowCm * 10) / 10} cm` : `${amount} of water`} over the day${when}` : `rain, ${amount} over the day${when}`;
            const c = coordsOf(place.key), missed = !o && c && reanalysisMissed(c[0], c[1], date.getFullYear());
            const extra = missed ? ' (generated: the 20th Century Reanalysis was unreachable; is enableCorsProxy on in SillyTavern\'s config.yaml?)' : !o ? '' : o.source === 'ERA5' ? `; wind ${Math.round(o.windMs)} m/s, humidity ${r(o.humidity)} % (the recorded weather of that day, ERA5)` : ' (that day\'s weather as reconstructed from pressure records, 20th Century Reanalysis)';
            return `${place.label}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}: ${sky}; high ${r(d.tmaxC)} °C, low ${r(d.tminC)} °C; now about ${r(w.tempC)} °C${extra}.`;
        });
    });
    // A character's pick among options is drawn, weighted by how many people in their place would take each one: weighted
    // random from all choices (Mark 2009, Behavioral Mathematics for Game AI, ch. 16), probabilistic choice as in McFadden's
    // conditional logit (1974); the narrator states the shares, code draws (models are biased random generators: Van
    // Koevering & Kleinberg 2024).
    tool('Choose', 'Decide what a character does when they have several real options (fight, flee or bargain; which road; whom to trust), before narrating it. Give each option with how many people in their place would take it; code draws one.', {
        who: str('The character choosing'),
        options: { type: 'array', items: { type: 'object', properties: { option: { type: 'string' }, share: { type: 'string', enum: SHARES }, kind: { type: 'string', enum: [...OPTION_KINDS], description: 'What sort of act it is; code moves the share by the character\'s traits, feelings and drink' } }, required: ['option', 'share'] }, description: 'Two or more options, each a different act, each with the share of people in this character\'s place who would take it' },
    }, ['who', 'options'], a => run((st, rng) => {
        const seen = new Set(), opts = (a.options ?? []).filter(o => o?.option && !seen.has(o.option.toLowerCase().trim()) && seen.add(o.option.toLowerCase().trim()));
        if (opts.length < 2)
            return 'Give two or more options.';
        // The character as the engine holds them (choice.ts): traits drawn once around their sex and age, feelings still
        // running, blood alcohol; an option the body cannot carry out (fighting or running with legs or blood that cannot
        // keep them on their feet) drops out.
        const me = st.people?.[String(a.who)], prof = ((st.traits ??= {})[String(a.who)] ??= {});
        for (const o of opts) {
            const t = o.kind && { 'attack or fight': 'agreeableness', 'run, hide or keep away': 'emotional stability', 'help someone': 'agreeableness', 'talk, bargain or give way': 'extraversion', 'play safe or wait': 'conscientiousness' }[o.kind];
            if (t)
                prof[t] ??= drawTrait(t, me?.sex, me?.age, () => gauss(rng));
        }
        const chooser = { traits: prof, sex: me?.sex, feelings: me?.feelings?.map(f => f.type), bac: me?.needs?.alcohol ?? 0 };
        const cannot = (k) => !!me && (k === 'attack or fight' || k === 'run, hide or keep away') && checkChance(me, { share: 1, uses: ['stance'], exertion: 'heavy', on_feet: true }) === 0;
        const w = opts.map(o => cannot(o.kind) ? 0 : Math.max(0.01, shareOf(o.share)) * optionFactor(o.kind, chooser).factor);
        if (w.every(x => x === 0))
            return `${a.who} can carry out none of these: the body cannot keep them on their feet.`;
        const total = w.reduce((x, y) => x + y, 0);
        let u = rng() * total, pick = opts[opts.length - 1];
        for (let i = 0; i < opts.length; i++)
            if ((u -= w[i]) < 0) {
                pick = opts[i];
                break;
            }
        if (w[opts.indexOf(pick)] === 0)
            pick = opts[w.findIndex(x => x > 0)];
        const why = optionFactor(pick.kind, chooser).why;
        return `${a.who} chooses: ${pick.option}.${why.length ? ` What weighed: ${why.join(', ')}.` : ''}${opts.some(o => cannot(o.kind)) ? ` Out of reach for the body now: ${opts.filter(o => cannot(o.kind)).map(o => o.option).join('; ')}.` : ''}`;
    }));
    // What a tracked character truly is (tells.ts): fixed in the world's record and kept hidden; it shows only through its
    // kind's tells, in what others see (Look) and feel (Touch).
    tool('TrueNature', 'Fix what a tracked character truly is, when the world book has a kind that passes for another (a thing that looks human) and the story makes them one, before anything shows it. Kept hidden; it shows only through its kind\'s tells when others look at or touch them.', {
        who: str('The tracked character'),
        kind: str('The world-book entry they truly are, by its name'),
    }, ['who', 'kind'], a => run((st, rng) => {
        const w = who(st, a.who);
        if (!w.p)
            return w.error;
        const e = CURRENT_BOOK.find(x => x.what.toLowerCase() === String(a.kind).trim().toLowerCase());
        if (!e)
            return `No world-book entry named "${a.kind}". Entries: ${CURRENT_BOOK.map(x => x.what).join('; ') || 'none'}.`;
        w.p.truly = e.what;
        if (e.body?.length || e.sheet?.resists.length || e.sheet?.senses?.dark)
            w.p.bodyFlags = [...new Set([...e.body ?? [], ...e.sheet?.resists ?? [], ...e.sheet?.senses?.dark ? ['EXTRAVISION'] : []])];
        if (e.sheet)
            w.p.attrs = { ...e.sheet.attrs };
        // A kind that lives on flesh or blood feeds as often as its body needs (hunger.ts), counted from now.
        {
            const now = storyNow(st);
            if (e.diet && now !== null && !w.p.hunger)
                w.p.hunger = hungerFor(e.diet, e.mass ?? 70, !!e.body?.includes('NO_HEAT'), now, rng);
        }
        // A kind active by night keeps the night: their day runs twelve hours later (days.ts, section 106).
        if (e.sheet?.active === 'night' && w.p.day && !w.p.day.shift)
            w.p.day.shift = NIGHT_SHIFT;
        const of = /^the\s/i.test(e.what) ? e.what : `the ${e.what}`;
        const f = learn(st, `${a.who} is truly one of ${of}`, [a.who], false, { [a.who]: 'their own' }, 'world');
        f.secret = true;
        return `Recorded and kept hidden: ${a.who} is truly one of ${of}. It shows only through its tells.`;
    }));
    tool('Touch', 'Decide what a character feels when they touch another tracked character (a hand on the chest, a handshake, a hand on the skin), before narrating it, when the world book gives a kind tells to the touch.', {
        who: str('The one who touches'),
        target_who: str('The tracked character touched'),
    }, ['who', 'target_who'], a => run((st, rng) => {
        const w = who(st, a.who), t = who(st, a.target_who);
        if (!w.p)
            return w.error;
        if (!t.p)
            return t.error;
        const map = placed(st, w.p, t.p, null);
        // Contact needs the other within reach: about an arm's length, 1 m [ASSUMED].
        if (map && map.d > 1)
            return `${a.target_who} is ${map.d} m from ${a.who}: out of reach.`;
        const r = tellsShown(CURRENT_BOOK, t.p, 'touch', rng, undefined, tellPlace(st, t.p, storyNow(st)));
        for (const x of r.shown)
            learnt(st, `${a.target_who}: ${x.text}`, a.who, KNOWN_HOW[1]);
        return r.shown.length ? `${a.who} feels of ${a.target_who}: ${r.shown.map(x => x.text).join('; ')}.` : `${a.who} touches ${a.target_who}; nothing the world's laws name shows to the touch.`;
    }));
    tool('RecordFact', 'Fix a fact the moment the story establishes it (a place, an object, a person, a secret, an event) and record who knows it: those who saw it, heard it, read it or were told it. A recorded fact stays true for the rest of the story and appears in [KNOWS].', {
        fact: str('The fact, one short sentence'),
        known_by: { type: 'array', items: { type: 'string' }, description: 'Characters who know it' },
        common_knowledge: { type: 'boolean', description: 'Known to everyone in the setting (a public event, a famous place, a well-known custom)' },
        how: { type: 'string', enum: KNOWN_HOW, description: 'How the knowers learned it, when they learned it the same way' },
        told_by: str('For "told by someone": who told them'),
        cause: str('For an event: who or what caused it, as the story has it: a character\'s name, "a natural force", or "unknown"'),
        secret: { type: 'boolean', description: 'The knowers keep it hidden from others (an affair, a crime, a plan)' },
        kind: { type: 'string', enum: ['event', 'knowledge'], description: 'event: something that happened or was said (default); knowledge: something learned by study or training (a name, a concept, a craft\'s facts), which fades less and then holds' },
        importance: { type: 'number', description: 'How much it matters to the knowers, 1–10: 1 purely mundane (brushing teeth, a meal), 10 extremely poignant (a death, a break-up, a betrayal, an acceptance)' },
    }, ['fact'], a => run(st => {
        const how = a.how === KNOWN_HOW[4] && a.told_by ? `told by ${a.told_by}` : a.how;
        if (a.cause && !['a natural force', 'unknown'].includes(a.cause.toLowerCase())) {
            const c = whoAny(st, a.cause);
            if (!c.p)
                return c.error;
        }
        const text = a.cause ? `${a.fact.replace(/[.!?]?$/, '')} (cause: ${a.cause})` : a.fact;
        const f = learn(st, text, a.known_by ?? [], !!a.common_knowledge, how ? Object.fromEntries((a.known_by ?? []).map(k => [k, how])) : {}, 'world');
        if (a.secret && !a.common_knowledge)
            f.secret = true;
        if (a.kind === 'knowledge')
            f.kind = 'knowledge';
        if (a.importance != null)
            f.imp = Math.min(10, Math.max(1, Math.round(a.importance)));
        return `Fact ${f.id} recorded: ${f.text.replace(/[.!?]?$/, '.')} Known by ${f.everyone ? 'everyone' : f.knowers.join(', ') || 'no one yet'}.`;
    }));
    // A player's message is plain language: what it states about their character or the world becomes a fact only through
    // a draw, like an action ("say yes or roll the dice", Baker 2004, Dogs in the Vineyard). The chance combines the setting's
    // base share with the estimate for this story, as BodyCheck does; the result is recorded either way, so it stays.
    tool('Claim', 'Decide whether something a player\'s message states about their own character holds, when it is new to the story: what the character is, an item they have, an ability of body or skill, something that happened to them before, something outside their control happening to them now (a slip, a faint, a cramp). Permission comes from the people who give it (SocialResponse or Choose); what a place allows comes from the scene and the world\'s facts. Returns whether it holds; either way it is recorded and stays.', {
        who: str('The player\'s character making the claim'),
        claim: str('The claim, one short sentence with the character\'s name and what is claimed, in the player\'s words'),
        kind: { type: 'string', enum: ['what the character is', 'something the character has', 'something the character can do', 'something that happened before', 'something happening to the character now', 'something the character knows', 'something the character chooses to do now'] },
        trait: { type: 'string', enum: TRAITS, description: 'For "something the character chooses to do now": the personality trait the act expresses (shouting, partying: extraversion; insulting, fighting: agreeableness, low pole; slacking off: conscientiousness, low pole; panicking, crying: emotional stability, low pole; reading, questioning: intellect)' },
        trait_level: { type: 'string', enum: LEVELS, description: 'The character\'s place on that trait among people, when the story has shown it ("hard-working": conscientiousness high). Default: code draws it once and keeps it.' },
        act_pole: { type: 'string', enum: POLES, description: 'With trait: whether the act shows much of the trait or little of it' },
        act_strength: { type: 'string', enum: STRENGTHS, description: 'With trait: mild (a raised voice) or strong (screaming)' },
        behaviour: { type: 'string', enum: BEHAVIOURS, description: 'With trait, when one fits: the act as one of these' },
        situation: { type: 'string', enum: SETTINGS, description: 'With behaviour, when one fits: the setting as one of these' },
        in_world: { type: 'boolean', description: 'The kind of thing claimed exists in this world: real history for the date, plus [WORLD]. False: the claim fails.' },
        species: str('For "what the character is": the creature claimed, as a creature name (cat, horse, wolf), when it is a creature'),
        item: str('For "something the character has": the item, a few words, singular; a number of them is counted in the claim'),
        language: str('For "something the character can do" when it is speaking a language: the language as named ("japanese", "modern japanese", "old mandarin")'),
        skill: { type: 'string', enum: ['reading and writing', 'counting and simple sums'], description: 'For "something the character can do" when it is one of these' },
        faith: { type: 'string', enum: FAITHS, description: 'For "what the character is" when it is a religion' },
        past_act: str('For "something that happened before" when it is something the character once did ("hit someone who annoyed me", "asked someone out on a date"): the act in a few words, first person'),
        marital: { type: 'string', enum: ['never married', 'married now or before'], description: 'For "what the character is" when it is their marital state' },
        age: { type: 'number', description: 'With marital: the character\'s age' },
        lived_to: { type: 'number', description: 'For a claim that needs someone to have lived to an age (the character\'s own age; a parent alive now): that age' },
        alive_at: { type: 'number', description: 'With lived_to: the age at which that person was last known alive (0 = from birth)' },
        person_sex: { type: 'string', enum: ['male', 'female'], description: 'With lived_to or marital: that person\'s sex' },
        quantity: { type: 'number', description: 'For "something the character has": how many. Default 1.' },
        reference_class: str('The wider class this claim belongs to: people like the character, with place and year ("<people> in <place>, <year>, <doing what the claim says>")'),
        base_share: { type: 'string', enum: SHARES, description: 'How often claims of that class hold in this kind of setting.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this claim given everything the story has established so far.' },
        path: { type: 'array', maxItems: 6, items: { type: 'object', properties: { step: str('One event the claim needs, in the order it would happen'), reference_class: str('The cases this step belongs to, given the steps before it'), base_share: { type: 'string', enum: SHARES }, share: { type: 'string', enum: SHARES } }, required: ['step', 'reference_class', 'base_share', 'share'] },
            description: 'For a claim whose base share is "almost no one": the events it needs, in order, each given the ones before (arrive in the country, reach the place, stay there). Required then.' },
        against_interest: { type: 'boolean', description: 'By meaning: the claim harms the claimer (a slip, a fall, a fever, a loss, a wound)' },
    }, ['who', 'claim', 'kind', 'in_world', 'base_share', 'share', 'against_interest'], a => run((st, rng) => {
        // A player's statement against their own character's interest (a slip, a fever, a loss) stands: it gains them nothing a
        // draw would guard against. The tools that decide its effects (BodyFall, Sickness) still decide those.
        if (a.against_interest && a.in_world !== false && (a.kind === 'something happening to the character now' || a.kind === 'something that happened before'))
            return `${a.claim}: holds (stated against the character's own interest). Recorded.`;
        if (a.kind === 'something the character has')
            account(st, a.who);
        // A thing not yet invented at the story's date, or never made in this world, cannot be had (world-log.ts).
        const y = storyYear(st);
        const late = a.kind === 'something the character has' && a.item ? cannotExist(a.item, y, CURRENT_BOOK, 'thing')
            : a.kind === 'something the character can do' && a.language ? cannotExist(a.language, y, CURRENT_BOOK, 'language')
                : a.kind === 'what the character is' && a.species ? cannotExist(a.species, y, CURRENT_BOOK, 'being') : '';
        if (late) {
            learn(st, `Not so: ${a.claim.replace(/[.!?]?$/, '.')}`, [a.who], false, { [a.who]: 'found out' });
            return `${a.claim}: false; ${late}. ${a.who} acts on it and meets the world as it is; narrate that.`;
        }
        if (!a.in_world) {
            learn(st, `Not so: ${a.claim.replace(/[.!?]?$/, '.')}`, [a.who], false, { [a.who]: 'found out' });
            return `${a.claim}: false; this world lacks such a thing. ${a.who} acts on it and meets the world as it is; narrate that.`;
        }
        const sp = a.kind === 'what the character is' && a.species ? creatureId(a.species) : null;
        if (a.species && a.kind === 'what the character is' && !sp)
            return noSpecies(a.species);
        const claim = a.claim.replace(/[.!?]?$/, '.');
        // Knowledge the story has recorded comes only from where it was learned: a fact on record that this character is not
        // among the knowers of (another's secret, an event elsewhere) cannot be claimed; they learn it on the page.
        if (a.kind === 'something the character knows') {
            const f = recordedFact(st, a.claim);
            if (f && !f.everyone && !f.knowers.some(k => k.toLowerCase() === a.who.toLowerCase()))
                return `${a.claim}: false; ${a.who} is still unaware of this${f.secret ? ' (another\'s secret)' : ''}. They learn it on the page: seen, overheard, told or worked out. State unchanged.`;
            // Forgotten by now: adults recalled no more with cues and questions than unprompted (Bauer & Larkina 2016), so a
            // claim to remember it does not bring it back; seeing, hearing or being told it again does.
            if (f && !recalls(st, f, a.who))
                return `${a.claim}: false; ${a.who} has forgotten it. Being reminded on the page (told, seeing it again) brings it back. State unchanged.`;
            if (f)
                return `${a.claim}: holds; ${a.who} already knows it. Recorded.`;
        }
        // A claim rarer than the lowest band is decomposed into the chain of events it needs, each a share given the ones
        // before; the chance is their product, at most the claim's own (the chain refines a rare claim, it cannot raise
        // it). A detailed story reads as more likely while being less likely (conjunction fallacy, Tversky & Kahneman 1983,
        // Psychol Rev 90:293; GPT-3 commits it too: Binz & Schulz 2023, PNAS 120:e2218523120), so each step is drawn,
        // not judged for how convincing it is. Drawn in order: the first step that fails is what the world holds instead.
        // A world-book being claimed outside its area is rare there whatever share the model gave: it needs its path.
        const far = a.kind === 'what the character is' && a.species ? farFrom(a.species, CURRENT_BOOK, scenePosition()) : null;
        const absent = a.kind === 'something the character has' && a.item ? notYetIn(a.item, storyYear(st), st.setting?.country) : null;
        // A language with no speech community in the scene's country (Glottolog) is rare there, as a thing not yet adopted is.
        const foreign = a.kind === 'something the character can do' && a.language && y !== null && y < 1950 && spokenThere(a.language, st.setting?.country) === false;
        // Reading and counting: the base share is the measured share of the country's people (population.ts); counting by
        // the character's birth decade, age 30 when unknown [ASSUMED].
        const skill = a.kind === 'something the character can do' && a.skill
            ? skillShare(a.skill === 'reading and writing' ? 'reading' : 'numeracy', st.setting?.country, y === null ? null : a.skill === 'reading and writing' ? y : y - (st.people?.[a.who]?.age ?? 30)) : null;
        if (skill)
            a = { ...a, base_share: Math.max(0.001, skill.share) };
        const faith = a.kind === 'what the character is' && a.faith ? faithShare(a.faith, st.setting?.country, y) : null;
        if (faith)
            a = { ...a, base_share: Math.max(0.001, faith.share) };
        const sex = st.people?.[a.who]?.sex ?? a.person_sex, age = Number(a.age ?? st.people?.[a.who]?.age);
        const single = a.kind === 'what the character is' && a.marital && Number.isFinite(age) ? neverMarriedShare(st.setting?.country, sex, age, y) : null;
        if (single)
            a = { ...a, base_share: Math.max(0.001, a.marital === 'never married' ? single.share : 1 - single.share) };
        const lives = a.lived_to != null ? survival(st.setting?.country, a.person_sex, y, Number(a.alive_at) || 0, Number(a.lived_to)) : null;
        if (lives)
            a = { ...a, base_share: Math.max(0.001, lives.share) };
        const speaks = a.kind === 'something the character can do' && a.language ? speakShare(a.language, st.setting?.country, y) : null;
        if (speaks)
            a = { ...a, base_share: Math.max(0.001, speaks.share) };
        // An act done before: the measured share of people of the character's sex who had ever done it (Buss 1981), moved by
        // their place on the matching trait (acts.ts).
        let past = null;
        if (a.kind === 'something that happened before' && a.past_act) {
            const m = matchPastAct(a.past_act), tr = m ? pastActTrait(m.category) : null;
            if (m && tr) {
                const prof = ((st.traits ??= {})[a.who] ??= {});
                if (a.trait === tr && a.trait_level)
                    prof[tr] = levelZ(a.trait_level);
                // Drawn around the mean of the character's sex and age (personality.ts); Buss's shares are per sex, so the act
                // takes the character's place among their own sex.
                prof[tr] ??= drawTrait(tr, sex, Number.isFinite(age) ? age : null, () => gauss(rng));
                past = { share: pastActShare(sex === 'female' ? m.women : m.men, prof[tr] - traitMean(tr, sex).sexPart, m.category), act: m.act };
                a = { ...a, base_share: Math.max(0.001, past.share) };
            }
        }
        // An act of the character's own choosing: the share of their hours spent in states at the act's level (Fleeson 2001),
        // scaled by how fitting the act is in the setting against its average fit (Price & Bouffard 1974) [scaling ASSUMED].
        let act = null;
        if (a.kind === 'something the character chooses to do now' && a.trait) {
            const prof = ((st.traits ??= {})[a.who] ??= {});
            if (a.trait_level)
                prof[a.trait] = levelZ(a.trait_level);
            prof[a.trait] ??= drawTrait(a.trait, sex, Number.isFinite(age) ? age : null, () => gauss(rng));
            const z = prof[a.trait], set = settingRatio(a.behaviour, a.situation);
            act = { share: Math.min(0.99, stateShare(a.trait, z, (a.act_pole ?? POLES[0]), (a.act_strength ?? 'mild')) * set.ratio), z, rating: set.rating };
            a = { ...a, base_share: Math.max(0.001, act.share) };
        }
        const rare = shareOf(a.base_share) <= 0.05 || !!far || !!absent || !!foreign;
        if ((far || absent || foreign) && shareOf(a.base_share) > 0.05)
            a = { ...a, base_share: '5% almost no one' };
        const path = (a.path ?? []).filter(x => x?.step);
        if (rare && path.length < 2)
            return `A claim this rare needs its path${far ? ` (${far.what} live ${far.km} km away, outside the scene)` : ''}${absent ? ` (${a.item} comes into use in ${absent.country} later${absent.first ? `: first recorded ${absent.first}` : ''})` : ''}${foreign ? ` (${a.language}: its speakers live outside ${st.setting?.country})` : ''}${faith ? ` (${Math.round(faith.share * 1000) / 10} % of people in ${faith.country}, ${faith.year}, are ${a.faith})` : ''}${lives ? ` (${Math.round(lives.share * 1000) / 10} % live from ${Number(a.alive_at) || 0} to ${a.lived_to}, ${lives.country} life table ${lives.years})` : ''}${speaks ? ` (${Math.round(speaks.share * 1000) / 10} % of people in ${speaks.country} speak ${a.language})` : ''}${skill ? ` (${Math.round(skill.share * 1000) / 10} % of people in ${skill.country}${skill.from ? `, ${skill.from} figure` : ''})` : ''}${past ? ` (${Math.round(past.share * 1000) / 10} % of people like ${a.who} have ever done this: "${past.act}")` : ''}${act ? ` (someone at ${a.who}'s level of ${a.trait} acts this way in ${Math.round(act.share * 1000) / 10} % of moments${act.rating !== null ? `; ${a.behaviour} rated ${act.rating} of 9 for fit ${a.situation === 'own room' ? 'in one\'s own room' : `at ${a.situation}`}` : ''}; each step that makes it fit raises the chance)` : ''}: two or more steps, in order, each with its reference class and shares given the steps before.`;
        if (rare) {
            const cap = combined(a), each = path.map(x => combined(x)), product = each.reduce((t, x) => t * x, 1);
            const scale = product > cap ? (cap / product) ** (1 / each.length) : 1;
            const failed = path.findIndex((_, i) => rng() >= each[i] * scale);
            if (failed >= 0) {
                const got = path.slice(0, failed).map(x => x.step);
                learn(st, `Not so: ${claim}${got.length ? ` (${got.join('; ')}: yes; ${path[failed].step}: no)` : ''}`, [a.who], false, { [a.who]: 'found out' });
                return `${a.claim}: false. ${got.length ? `What holds: ${got.join('; ')}. ` : ''}What did not happen: ${path[failed].step}. ${a.who} acts on it and meets the world as it is; narrate that.`;
            }
            learn(st, `${claim} (${path.map(x => x.step).join('; ')})`, [a.who], false, { [a.who]: 'their own' });
            if (a.kind === 'something the character has' && a.item)
                give(st, a.who, a.item, Math.max(1, Math.round(a.quantity ?? 1)));
            return `${a.claim}: holds, by this path: ${path.map(x => x.step).join('; ')}. Recorded.`;
        }
        const holds = rng() < combined(a);
        if (!holds) {
            learn(st, `Not so: ${claim}`, [a.who], false, { [a.who]: 'found out' });
            return `${a.claim}: false. ${a.who} acts on it and meets the world as it is; narrate that.`;
        }
        if (sp) {
            const p = st.people?.[a.who];
            if (p?.wounds.length)
                return `${a.who} has wounds on record; a change of body comes through the story (a spell, a transformation), and Claim covers what already holds. State unchanged.`;
            if (p)
                delete st.people[a.who];
            person(st, a.who, undefined, sp);
        }
        learn(st, claim, [a.who], false, { [a.who]: 'their own' });
        if (a.kind === 'something the character has' && a.item)
            give(st, a.who, a.item, Math.max(1, Math.round(a.quantity ?? 1)));
        if (a.kind === 'something the character can do' && a.language) {
            const p = whoAny(st, a.who).p;
            if (p && !p.languages?.includes(a.language.trim().toLowerCase()))
                p.languages = [...p.languages ?? [], a.language.trim().toLowerCase()];
        }
        return `${a.claim}: holds. Recorded.`;
    }));
    tool('Transfer', 'Record an item changing hands, entering or leaving the story, once the story has it happen: given, sold, bought, lent, returned, stolen, taken by force, found, made, lost, used up, dropped. Whether it happens comes first from the tool that decides how (SocialResponse or Choose for an agreement, Look for a theft that may be seen, HoldOn or BodyStrike for a struggle, Price for what it costs). Returns the new holder and, when it differs, the owner; [HAS] then shows both.', {
        item: str('The item, a few words, singular, as the scene names it'),
        quantity: { type: 'number', description: 'How many. Default 1.' },
        from: str('Who had it. Default: the world (found, made, bought from someone untracked)'),
        to: str('Who or where has it now: a person, or a place when it is left there ("the west hall window"), so it can be found later. Default: out of the story (used up, sold away)'),
        how: { type: 'string', enum: HOW },
        item_is: { type: 'string', enum: ITEM_IS, description: 'What the item is, by meaning' },
    }, ['item', 'how'], a => run(st => {
        const own = inalienable(st, a.item, a.item_is);
        if (own)
            return `State unchanged: ${own}.`;
        const late = cannotExist(a.item, storyYear(st), CURRENT_BOOK, 'thing');
        return late ? `State unchanged: ${late}.` : transfer(st, a);
    }));
    // The data give the share of students who solve such a problem in the time; the estimate for this character is
    // combined with it in log-odds, as BodyCheck combines a base share, and the body state applies (alertness).
    tool('WorkOut', 'Decide whether a character works something out in the time they have, before narrating it: a riddle, a trick, a code, a link between clues, a sum, a plan; or whether they remember to do what they meant to when its moment comes.', {
        who: str('Character thinking'),
        problem: str('The problem in a few words'),
        kind: { type: 'string', enum: PROBLEMS },
        seconds: { type: 'number', description: 'For a problem: time they have to work it out, s (a glance 2, a moment 10, a minute 60, a long look 240)' },
        share: { type: 'string', enum: SHARES, description: 'Only when the story establishes how able the character is at such problems: the share of university students they would do better than. Otherwise code uses the character\'s own ability, drawn once.' },
        reveals: str('The fact itself, as the scene holds it, set before the outcome: one sentence with its people and things as the scene names them; learned only on success'),
    }, ['who', 'problem', 'kind'], a => run((st, rng) => {
        if (asQuestion(a.reveals))
            return REVEALS_FACT;
        if (a.seconds == null && !isIntention(a.kind))
            return 'Give seconds: the time they have to work it out.';
        const w = whoAny(st, a.who);
        if (!w.p)
            return w.error;
        const base = solveShare(a.kind, a.seconds ?? 0);
        // A character better than a share s of students: base odds shifted by the odds of s (0.5 = the students' own rate)
        // [ASSUMED: a percentile read as a log-odds shift].
        // Without the story's word, the character's own general ability gZ (drawn once, normal among people) places them among
        // students, who stood 0.41 SD (word-link norms, 2003) or 0.24 SD (insight and step-by-step norms, 2016) above everyone
        // (thinking.ts studentZ, Uttl et al. 2024) (E28).
        w.p.gZ ??= Math.max(-3, Math.min(3, gauss(rng)));
        // Intentions take the measured rate as it is: remembering them tracks reasoning ability little (and old adults do as well
        // in daily life as the young) [ASSUMED: no shift].
        const among = a.share != null ? shareOf(a.share) : isIntention(a.kind) ? 0.5 : phiN(w.p.gZ - studentZ(a.kind));
        // Fear while thinking (Moran 2016, Psychol Bull 142:831, 177 samples): anxiety went with poorer working-memory
        // performance, g = −0.334, for state and trait anxiety alike; as log odds 1.81 g (Chinn 2000) on a problem, while the
        // character feels fear. Intentions keep their rate [ASSUMED]. Sadness enters nothing: no meta-analytic effect on such
        // tasks was found, and a sad-mood induction left working memory unchanged (Valenti, Garcia & Galera 2021, n = 27).
        const afraid = !isIntention(a.kind) && !!w.p.feelings?.some(f => f.type === 'fear');
        const z = Math.log(base / (1 - base)) + logit(clamp01(among)) - (afraid ? 1.81 * kc('fearWm') : 0);
        const chance = 1 / (1 + Math.exp(-z));
        // timed: a cooled core slows this kind of thinking (complex tasks fell after 2–4 °C of cooling, simple ones held: Giesbrecht
        // et al. 1993, Aviat Space Environ Med 64:206).
        const out = check(w.p, { task: isIntention(a.kind) ? `remember to ${a.problem}` : `work out ${a.problem}`, share: chance, uses: ['alertness'], timed: !isIntention(a.kind), override: true }, rng);
        const said = afraid ? `${out} Fear crowded the thinking.` : out;
        return a.reveals && /SUCCESS/.test(out) ? `${said} ${a.who} now knows: ${learnt(st, a.reveals, a.who, KNOWN_HOW[2])}` : said;
    }));
    tool('Sickness', 'Decide whether a character vomits or feels sick in a situation with published rates, before narrating it; situation names it. Spoiled food goes to Disease.', {
        who: str('Character'),
        situation: { type: 'string', enum: SICK_SITUATIONS },
        sex: { type: 'string', enum: ['male', 'female'] },
        age: { type: 'number', description: 'Age in years' },
        motion_sickness_before: { type: 'boolean', description: 'After surgery: has been seasick, carsick or sick after an operation before' },
        smoker: { type: 'boolean', description: 'After surgery: smokes' },
        opioids: { type: 'boolean', description: 'After surgery: given opium, morphine or another opioid for the pain' },
    }, ['who', 'situation'], a => run((_st, rng) => sickness(a.who, a, rng)));
    tool('Listen', 'Decide whether a character hears a sound (footsteps, a voice, hoofbeats, a bell) before narrating whether they react. Code decides from loudness, distance, background noise, walls and the listener\'s hearing.', {
        listener: str('Character who might hear it'),
        listener_species: str('Listener\'s species, when the engine has no record of them yet.'),
        sound: { type: 'string', enum: Object.keys(SOUNDS) },
        spl_db: { type: 'number', description: 'Loudness at 1 m, dB SPL, for a sound outside the classes in the list (from a published measurement)' },
        distance_m: { type: 'number', description: 'Distance from the sound, m' },
        source_who: str('The character making the sound, when it is one: code takes the distance and any wall from where both stand on the map'),
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between. Default none.' },
        tone_hz: { type: 'number', description: 'For a tonal sound (a bell, a whistle, a horn): its pitch, Hz (a church bell 300–600, a whistle 2000–3000)' },
        ...WAY_PROPS,
        reveals: str('The fact itself, as the scene holds it, set before the outcome: one sentence with its people, act and place as the scene names them; learned only if heard'),
    }, ['listener', 'sound'], a => run((st, rng) => {
        if (asQuestion(a.reveals))
            return REVEALS_FACT;
        const l = who(st, a.listener, a.listener_species);
        if (!l.p)
            return l.error;
        const crowd = crowdDb(st, l.p), noise = a.noise ?? 'quiet room (25 dB)';
        // A source on the map: its distance is kept over a given one; a shut wall between is a plaster wall [ASSUMED default, as
        // for Communicate].
        const src = a.source_who ? st.people?.[String(a.source_who)] : undefined, map = src ? placed(st, l.p, src, a.distance_m) : null;
        const distance = map?.d ?? a.distance_m;
        if (distance == null)
            return 'Give distance_m (or place both on the map with Layout and give source_who). State unchanged.';
        const barrier = a.barrier ?? (map?.wall ? 'plaster wall' : 'none');
        const heard = listen(a.listener, l.p, { way: wayFor(st, l.p, a, map ? map.same && barrier === 'none' : barrier === 'none'), sound: a.sound, spl_db: a.spl_db ?? null, distance: map ? Math.max(1, distance) : distance, noise: crowd == null ? noise : `${noise} with the room's talk`, noise_db: crowd == null ? null : sumDb(NOISE[noise] ?? 25, crowd), barrier }, rng);
        const out = map?.note ? heard.replace(/\.?$/, `${map.note}.`) : heard;
        return / hears it /.test(out) && a.reveals ? `${out} ${a.listener} now knows: ${learnt(st, a.reveals, a.listener, KNOWN_HOW[1])}` : out;
    }));
    tool('Look', 'Decide whether a character sees something at a distance (a person, an animal, a vehicle) before narrating it. Code rolls notice / recognize / identify from size, distance, light and visibility.', {
        viewer: str('Character who might see it'),
        viewer_species: str('Viewer\'s species, when the engine has no record of them yet.'),
        target: str('What might be seen, a few words'),
        kind: { type: 'string', enum: SIZE_KINDS, description: 'What the target is, by meaning: the nearest kind in the list. Code takes its size from it.' },
        size_m: { type: 'number', description: 'For kind "something else": the smallest visible dimension of the target, m' },
        distance_m: { type: 'number', description: 'Distance, m; the map gives it when viewer and target_who are both placed, and its distance is kept' },
        light: { type: 'string', enum: ['overcast day', 'dim street or public lighting', 'living room', 'office'], description: 'Set for an overcast sky or artificial light; code takes daylight, twilight, moonlight and starlight from the date, hour and latitude.' },
        latitude: { type: 'number', description: 'Latitude of the place, degrees (north +, south −), when the story moves to a new region. Kept for later calls.' },
        visibility_m: { type: 'number', description: 'Meteorological visibility, m (clear air 20000; haze 5000; mist 2000; fog 500; thick fog 50)' },
        water_visibility_m: { type: 'number', description: 'Viewer and target under water: how far a dark object can be made out across this water, m (clear open ocean 30 or more; coastal sea 5–15; harbour or lake 1–3; muddy river under 0.5)' },
        reveals: str('The fact itself, as the scene holds it, set before the outcome: one sentence with its people, act and place as the scene names them; learned only if identified'),
        target_who: str('When the target is a tracked character: their name (distance and walls then come from the map)'),
        weapon_in_view: { type: 'boolean', description: 'With target_who: they hold a weapon in plain view' },
        dressed: { type: 'string', enum: Object.keys(DRESSED), description: 'For a person: how dark their clothes are, when the story says' },
        against: { type: 'string', enum: Object.keys(AGAINST), description: 'What lies behind the target as the viewer sees it, when the story says' },
        seconds: { type: 'number', description: 'How long the viewer keeps looking, s, when it is more than a glance (a watch from cover 60, a long stare 120)' },
    }, ['viewer', 'kind', 'distance_m'], async (a) => {
        if (!a.light)
            await prefetchSky(a.latitude);
        return run((st, rng) => {
            if (asQuestion(a.reveals))
                return REVEALS_FACT;
            const whoSeen = a.target_who ? st.people?.[String(a.target_who)] : undefined;
            const sized = sizeOf(String(a.kind ?? ''), whoSeen ?? null);
            if (sized)
                a = { ...a, size_m: sized.m };
            if (!(Number(a.size_m) > 0))
                return `Give size_m: the smallest dimension of ${a.target ?? 'what is seen'}, m. State unchanged.`;
            const v = who(st, a.viewer, a.viewer_species);
            if (!v.p)
                return v.error;
            const tp = a.target_who ? st.people?.[a.target_who] : undefined, map = tp ? placed(st, v.p, tp, a.distance_m) : null;
            if (map?.wall)
                return `A wall stands between ${a.viewer} and ${a.target}: ${map.wall}.`;
            const dist = map?.d ?? a.distance_m ?? null;
            if (dist == null)
                return 'Give distance_m (or place both on the map with Layout and give target_who). State unchanged.';
            if (Number.isFinite(a.latitude))
                st.latitude = a.latitude;
            // Story dates (dd/mm/yyyy) parse to minutes from year 1; a bare "Day N" count stays below 146 097 days (400 years) [ASSUMED].
            const t = storyNow(st);
            // The light at the viewer (sky outdoors, flames and windows in a Room), or the light the call names; the viewer's eyes
            // count it as adapted (vision.ts adaptedLux: after brighter light, the dark is darker for up to 40 minutes).
            const here = !a.light ? lightAt(st, v.p, t) : null, lux0 = here?.lux ?? LIGHT[a.light ?? 'daylight'] ?? LIGHT.daylight;
            const ad = adaptedLux(v.p.eye, lux0, t);
            v.p.eye = ad.eye;
            const dark = seeLux(v.p, 1) > 1, label = `${here?.label ?? a.light ?? 'daylight'}${ad.dark ? ', eyes still used to brighter light' : ''}${dark ? `, eyes that see in the dark (as ${Math.round(seeLux(v.p, 1))} times the light)` : ''}`;
            // Under water a target's contrast falls with distance by the same law as in air, e^(−3.912 d/v), v the water's
            // hydrological range, the distance at which a black object fades to the 2 % threshold (Duntley 1960, The Visibility of
            // Submerged Objects, Scripps Institution of Oceanography, eq. 1.29): the water's range stands in for visibility.
            const vis = Number(a.water_visibility_m) > 0 ? Number(a.water_visibility_m) : a.visibility_m ?? 20000;
            // The figure against its background (vision.ts figureContrast), and the time spent looking (one try per 6 s, up to 10).
            const contrast = figureContrast(a.dressed, a.against, here?.shade ?? 1), contrastLabel = a.dressed && a.against ? `${a.dressed.replace(/ \(.*\)$/, '')} against ${a.against.replace(/ \(.*\)$/, '')}, contrast ${Math.round(contrast * 100) / 100}` : null;
            const out = look(a.viewer, v.p, { size_m: a.size_m, distance_m: dist, light: seeLux(v.p, ad.lux), lightLabel: label, visibility_m: vis, contrast, seconds: Number(a.seconds) || 0, contrastLabel }, rng);
            // A sighting of a tracked person is kept for a later lineup (SocialResponse): when, and whether the face was made out.
            // A closer look later replaces a vaguer one; the latest look at the face counts.
            if (a.target_who) {
                const seen = ((st.sightings ??= {})[String(a.viewer)] ??= {}), was = seen[String(a.target_who)], id = / identifies it /.test(out);
                if (id || !was?.identified)
                    seen[String(a.target_who)] = { t: t ?? null, identified: id, ...(v.p.feelings?.some(f => f.type === 'fear') ? { stressed: true } : {}), ...(a.weapon_in_view ? { weapon: true } : {}) };
            }
            const said = map?.note ? out.replace(/\.?$/, `${map.note}.`) : out;
            // The world's tells (tells.ts): a tracked person the viewer makes out shows, for each sight tell whose condition holds
            // and whose sign the viewer's eyes resolve, the sign if they truly are of its kind and the ordinary otherwise.
            let tells = '';
            if (tp && !/ misses it /.test(out) && kindsWithTells(CURRENT_BOOK).length) {
                const r = tellsShown(CURRENT_BOOK, tp, 'sight', rng, { distance_m: dist, light: seeLux(v.p, ad.lux), visibility_m: vis, contrast, seconds: Number(a.seconds) || 0, acuityFactor: acuityOf(v.p.species) * (!v.p.species || /^human$/i.test(v.p.species) ? ageAcuity(v.p.age) : 1) }, tellPlace(st, tp, t));
                for (const x of r.shown)
                    learnt(st, `${a.target_who}: ${x.text}`, a.viewer, KNOWN_HOW[0]);
                tells = `${r.shown.length ? ` ${a.viewer} sees of ${a.target_who}: ${r.shown.map(x => x.text).join('; ')}.` : ''}${r.open.length ? ` Whether this shows stays open, since what it needs where ${a.target_who} stands is not on record (the story's time and place; the air, BodyEnvironment): ${r.open.join('; ')}.` : ''}`;
            }
            return / identifies it /.test(out) && a.reveals ? `${said}${tells} ${a.viewer} now knows: ${learnt(st, a.reveals, a.viewer, KNOWN_HOW[0])}` : `${said}${tells}`;
        });
    });
    // One tool for a person's social response, the situation as an enum (as RPG-MCP consolidated 195 tools into 36 with action
    // enums; function-calling accuracy drops as the number of functions grows, Patil et al. 2025, BFCL).
    tool('SocialResponse', 'Decide how a person responds in a social situation whose outcome is in doubt, before narrating it; situation names the kind. A sale, a served drink or a paid service is the person\'s trade: it goes ahead, and Transfer or Price records it.', {
        situation: { type: 'string', enum: SOCIAL },
        who: str('The person whose response is decided'),
        speaker: str('For a statement or a false detail: who said it'),
        is_lie: { type: 'boolean', description: 'For a statement: whether it is in fact a lie (known from the story)' },
        statement: str('For a statement, a false detail or a made-up event: it in a few words'),
        evidence: { type: 'string', enum: EVIDENCE, description: 'For a statement: evidence the listener holds that bears on it, and when they show it. Default none.' },
        knows_speaker: { type: 'boolean', description: 'For a statement: the listener has heard the speaker talk before. Default: from the messages on record.' },
        expert_listener: { type: 'boolean', description: 'For a statement: the listener questions people for a living (an interrogator, a judge, a customs officer)' },
        high_stakes: { type: 'boolean', description: 'For a statement: the speaker has much to lose if disbelieved' },
        others: { type: 'number', description: 'For an emergency: how many other people the person believes also witness it; for a group stating something wrong: how many state it. Default: from the tracked people on the map.' },
        victim: str('For an emergency or an order to hurt someone: the tracked character in danger or to be hurt; where they are sets the circumstances'),
        emergency: { type: 'string', enum: SITUATIONS, description: 'For an emergency. Default victim in danger.' },
        order: { type: 'string', enum: Object.keys(OBEY), description: 'For an order to hurt someone: its circumstances. Default with a placed victim: from where the victim is (the same room, or out of sight).' },
        offer_share: { type: 'number', description: 'For an offered split: the share of the whole offered to them, 0–1' },
        request: str('For a favour: the request in a few words'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'For a first meeting: sex of the person whose interest is decided' },
        many_options: { type: 'boolean', description: 'For a first meeting: they meet many prospective partners at once (15 or more)' },
        requester: { type: 'string', enum: REQUESTERS, description: 'For a favour, an order or asking to go first: how the stranger asking is dressed. Default ordinary clothes.' },
        order_kind: { type: 'string', enum: ORDERS, description: 'For a stranger\'s order: what it asks' },
        request_size: { type: 'string', enum: GIVE_WAY_SIZES, description: 'For a stranger asking to go first: how long they need, against the person\'s own task' },
        reason: { type: 'string', enum: GIVE_WAY_REASONS, description: 'For a stranger asking to go first: the reason they give' },
        event_fact: str('For a false detail: the recorded fact of the event they witnessed, as recorded'),
        shown: str('For something that shows what they remember is wrong: what they see, read or hear, as the world holds it (the receipt reads 4 shillings); statement: what they remember'),
        explains_why: str('For something that shows what they remember is wrong, when it also shows how they came to remember it wrong: how, in a few words (the innkeeper was never there to see it). Leave out otherwise'),
        act: str('For an act they may condemn: the act, in a few words'),
        ally: { type: 'boolean', description: 'For a group stating something wrong: one other person sides with what they see' },
        target_who: str('For a lineup: the tracked person the witness saw, whose face they look for'),
        culprit_present: { type: 'boolean', description: 'For a lineup: whether target_who stands in it' },
        other_group: { type: 'boolean', description: 'For a lineup: target_who is of a people the witness has seldom met (another race or origin)' },
        earlier: { type: 'string', enum: [...FITD_EARLIER], description: 'For a bigger favour: what they did with the small one. Default: from the small favour SocialResponse decided for them.' },
        same_requester: { type: 'boolean', description: 'For a bigger favour: the same person asks both times. Default true.' },
        later_day: { type: 'boolean', description: 'For a bigger favour: it comes on a later day than the small one' },
        sequential: { type: 'boolean', description: 'For a lineup: the faces are shown one at a time and the witness decides on each in turn' },
    }, ['situation', 'who'], a => run((st, rng) => {
        // A response needs the words: when this turn's message to them reached them as a voice only, they answer the voice.
        if (/favour|statement|order|first|go first/.test(a.situation ?? '')) {
            const lost = Object.entries(decisions()).find(([key, out]) => { const p = key.split('|'); return p[0] === 'communicate' && p[2] === norm(a.who) && (!a.speaker || p[1] === norm(a.speaker)) && /words are lost|voice is lost|scattered words/.test(out); });
            if (lost)
                return `${a.who} answers the voice only: the words of the request were lost (${lost[1].replace(/\.$/, '')}). The request waits for a message that gets through.`;
        }
        switch (a.situation) {
            case SOCIAL[0]: {
                const l = who(st, a.who), s = who(st, a.speaker);
                // Has the listener heard this speaker before (a message between them on record), unless the call says.
                const knows = a.knows_speaker ?? !!st.acquainted?.[`${norm(a.who)}|${norm(a.speaker)}`];
                const r = judgeStatement(!!a.is_lie, rng, { speaker: (s.p ?? null), listener: (l.p ?? null), evidence: a.evidence ?? 'none', knows, expert: !!a.expert_listener, stakes: !!a.high_stakes });
                const from = !a.evidence || a.evidence === 'none' ? `from ${a.speaker ?? 'the speaker'}'s manner alone: no proof either way` : `weighing what ${a.speaker ?? 'the speaker'} says against the evidence`;
                return `${a.who} ${r.judgedLie ? 'judges it a lie' : 'believes it'}, ${from}.`;
            }
            case SOCIAL[1]: {
                // Bystanders from the scene (E35): when the call gives no number, each tracked person on the map (not the helper or the
                // victim, awake) who is in the same room, or outdoors within sight (one glance at a person-sized target in the light
                // there), counts as a witness the helper knows of [ASSUMED: seeing them is believing they witness it].
                const me = st.people?.[String(a.who)], t0 = storyNow(st);
                const seenBy = (q) => {
                    if (!me?.at || !q.at || !st.map)
                        return false;
                    const g = between(st, me, q);
                    if (!g || g.d == null)
                        return false;
                    if (g.ra || g.rb)
                        return g.ra === g.rb;
                    const L = lightAt(st, q, t0);
                    return !!L && see({ size: 0.5, distance: Math.max(1, g.d), light: L.lux }).detect >= 0.5;
                };
                const counted = a.others == null && me?.at ? Object.entries(st.people ?? {}).filter(([n, q]) => n !== a.who && n !== a.victim && !q.dead && !q.unconscious && seenBy(q)).length : null;
                const n = counted ?? (Number(a.others) || 0), p = helpChance(n, a.emergency ?? 'victim in danger');
                return `${a.who} ${rng() < p ? 'steps in to help' : 'stays out of it'} (${n > 0 ? `with ${n} other${n > 1 ? 's' : ''} watching` : 'alone with it'}).`;
            }
            case SOCIAL[2]: {
                // The circumstances from the scene (E34): with no `order` and a victim placed on the map, the same room as the
                // victim is Milgram's proximity condition and any other place his baseline (victim out of sight, heard through the wall).
                const me = st.people?.[String(a.who)], vic = a.victim ? st.people?.[String(a.victim)] : undefined, g = me && vic ? between(st, me, vic) : null;
                if (!a.order && g)
                    a = { ...a, order: g.ra && g.ra === g.rb || (!g.ra && !g.rb && (g.d ?? 99) <= 5) ? 'victim in the same room' : 'victim out of sight' };
                const p = a.order ? obeyShare(a.order, storyYear(st)) : null;
                if (p === null)
                    return `Give order, one of: ${Object.keys(OBEY).join('; ')}.`;
                return `${a.who} ${rng() < p ? 'carries the order out to the end' : 'refuses before the end'} (${a.order}).`;
            }
            case SOCIAL[3]: {
                // Kept for a bigger favour later (foot in the door, SOCIAL[16]).
                const yes = rng() < asRequester(SMALL_REQUEST_YES, a.requester);
                (st.favours ??= {})[String(a.who)] = { agreed: yes, t: storyNow(st) ?? null, by: a.speaker ?? null };
                return `${a.who} ${yes ? 'agrees' : 'declines'}${a.request ? ` (${a.request})` : ''}.`;
            }
            case SOCIAL[4]: {
                // The person's sex as the story holds it (a drawn maid is a woman); the argument fills it when the story holds none.
                const sex = st.people?.[String(a.who)]?.sex ?? a.sex;
                if (!sex)
                    return 'Give sex for a first meeting.';
                const pr = interestChance(sex, !!a.many_options);
                return `${a.who} ${rng() < pr ? 'is interested and would meet again' : 'leaves it at this meeting'}${a.many_options ? ' (one of many suitors met at once)' : ''}.`;
            }
            case SOCIAL[5]: {
                const p = orderChance(a.order_kind ?? '');
                if (p === null)
                    return `Give order_kind (${ORDERS.join('; ')}).`;
                return `${a.who} ${rng() < asRequester(p, a.requester) ? 'obeys' : 'refuses'} (${a.order_kind}; the one ordering wears ${a.requester ?? REQUESTERS[0]}).`;
            }
            case SOCIAL[6]: {
                const p = giveWayChance(a.request_size ?? '', a.reason ?? '');
                if (p === null)
                    return `Give request_size (${GIVE_WAY_SIZES.join('; ')}) and reason (${GIVE_WAY_REASONS.join('; ')}).`;
                return `${a.who} ${rng() < asRequester(p, a.requester) ? 'lets them go first' : 'declines'} (${a.request_size}; ${a.reason}).`;
            }
            case SOCIAL[7]: {
                const sh = Number(a.offer_share);
                if (!(sh >= 0 && sh <= 1))
                    return 'Give offer_share: the part offered to them, 0–1.';
                return `${a.who} ${rng() < (sh <= 0.2 ? REFUSE_SPLIT.low : REFUSE_SPLIT.other) ? 'refuses the split, so neither gets anything' : 'accepts the split'}.`;
            }
            case SOCIAL[8]: return `${a.who} ${rng() < PUNISH_ONCE ? 'punishes the cheater, at a cost to themselves' : 'lets it pass this time'}.`;
            case SOCIAL[9]:
            case SOCIAL[10]: {
                // Trust games (social.ts trustMeans): the country of the person, else of the scene.
                const m = trustMeans(st.people?.[String(a.who)]?.country ?? st.setting?.country), sent = a.situation === SOCIAL[9];
                const sh = shareAround(sent ? m.sent : m.returned, () => gauss(rng)), pct = Math.round(sh * 100);
                return sent ? `${a.who} hands over ${pct} % of what they could${pct === 0 ? ': nothing' : pct === 100 ? ': all of it' : ''} (trust games, ${m.where}: mean ${Math.round(m.sent * 100)} %).`
                    : `${a.who} gives back ${pct} % of what they now hold${pct === 0 ? ': nothing' : ''} (trust games, ${m.where}: mean ${Math.round(m.returned * 100)} %).`;
            }
            case SOCIAL[11]: {
                if (!a.statement)
                    return 'Give statement: the false detail they are told.';
                const ev = a.event_fact ? (st.facts ?? []).find(f => norm(f.text) === norm(a.event_fact) && f.knowers.some(k => norm(k) === norm(a.who))) : undefined;
                const faded = !!ev && !recalls(st, ev, a.who);
                const taken = faded || rng() < MISINFO_TAKEN;
                // The false detail is a version either way (the world holds otherwise): taken in, it stands in their memory for
                // the event's own fact; refused, they hold it as what the speaker said.
                const v = learn(st, a.statement, [a.who], false, { [a.who]: taken ? 'saw it (as they now remember it)' : `told by ${a.speaker ?? 'someone'}` }, 'version');
                if (taken && ev)
                    v.versionOf = ev.id;
                return taken ? `${a.who} now remembers it as part of what they saw: ${a.statement}${faded ? ' (their own memory of it had faded)' : ''}.`
                    : `${a.who} keeps their own memory of the event; they know only that ${a.speaker ?? 'they were'}${a.speaker ? ' said' : ' told'} ${a.statement}.`;
            }
            case SOCIAL[13]: {
                const i = surveyAct(String(a.act ?? ''));
                if (i < 0)
                    return `No act of the World Values Survey matches "${a.act ?? ''}". Give act as one of: ${WVS_ACTS.join('; ')}.`;
                a.act = WVS_ACTS[i];
                const y = storyYear(st), w = wvsFor(st.setting?.country);
                if (y == null || y < 2000)
                    return `No measure of how people judged ${a.act} in ${y ?? 'an unset year'}: the World Values Survey answers held here are from 2017–2022. Decide it from the story's world.`;
                if (!w || w.never[i] == null)
                    return `No World Values Survey answer on ${a.act} for ${st.setting?.country ?? 'an unset country'}: decide it from the story's world.`;
                return `${a.who} ${rng() < w.never[i] ? 'condemns it outright: never justifiable' : 'does not condemn it outright'} (${a.act}; in ${w.name}, ${Math.round(w.never[i] * 100)} % call it never justifiable, ${w.year}).`;
            }
            case SOCIAL[14]: {
                // The majority from the scene when the call gives none: tracked people on the map in the same room (awake).
                const me = st.people?.[String(a.who)];
                const counted = a.others == null && me?.at ? Object.entries(st.people ?? {}).filter(([n, q]) => n !== a.who && !q.dead && !q.unconscious && q.at && (() => { const g = between(st, me, q); return !!g && (g.ra ? g.ra === g.rb : (g.d ?? 99) <= 5); })()).length : null;
                // Counted from the map, the ally stands among them and does not state it.
                const m = counted != null ? Math.max(0, counted - (a.ally ? 1 : 0)) : (Number(a.others) || 0);
                if (!m)
                    return 'Give others: how many people around them state it.';
                const p = conformShare(m, !!a.ally, me?.sex ?? a.sex, storyYear(st));
                return `${a.who} ${rng() < p ? 'goes along with the group, against what they see' : 'says what they see'} (${m} stating it${a.ally ? ', one person siding with them' : ''}).`;
            }
            case SOCIAL[15]: {
                // The lineup (social.ts lineupPick): the witness's memory of the face from their Look at target_who, faded by the
                // hours since; the culprit stands in it or does not.
                if (!a.target_who)
                    return 'Give target_who: the tracked person the witness saw (the culprit), and culprit_present.';
                if (a.culprit_present == null)
                    return 'Give culprit_present: whether the person they saw stands in the lineup.';
                const seen = st.sightings?.[String(a.who)]?.[String(a.target_who)], now = storyNow(st);
                const hours = seen?.t != null && now != null ? (now - seen.t) / 60 : 0;
                const d = faceStrength(!!seen?.identified, hours, { stressed: seen?.stressed, weapon: seen?.weapon, otherGroup: !!a.other_group });
                const r = lineupPick(d, !!a.culprit_present, () => gauss(rng), { sequential: !!a.sequential, otherGroup: !!a.other_group, uniform: rng });
                const memo = !seen ? `${a.who} never looked at ${a.target_who} (no Look on record), so the face is a guess`
                    : !seen.identified ? `${a.who} never made out ${a.target_who}'s face` : seen.t == null || now == null ? `${a.who} saw the face (no story clock: taken as just now)`
                        : `${a.who} saw the face ${hours < 1 ? 'less than an hour' : hours < 48 ? `${Math.round(hours)} hours` : `${Math.round(hours / 24)} days`} ago`;
                const said = r.pick === 'none' ? 'says the one they saw is not there' : r.pick === 'culprit' ? `picks ${a.target_who}, ${r.confidence === 'high' ? 'sure of it' : r.confidence === 'medium' ? 'fairly sure' : 'unsure'}`
                    : `picks someone else in the line, an innocent, ${r.confidence === 'high' ? 'sure of it' : r.confidence === 'medium' ? 'fairly sure' : 'unsure'}`;
                const weak = [seen?.stressed && 'afraid when they saw it', seen?.weapon && 'a weapon drew the eye', a.other_group && 'a face of a people they have seldom met'].filter(Boolean);
                return `${a.who} ${said} (${memo}${weak.length ? `; ${weak.join('; ')}` : ''}${a.sequential ? '; faces shown one at a time' : ''}).`;
            }
            case SOCIAL[16]: {
                // The small favour as decided earlier for this person (the decision log), when the call gives none.
                // The small favour as decided earlier for this person (SOCIAL[3] keeps it), when the call gives none; a later
                // day from the story clock when both times are known, the same requester when both name a speaker.
                const past = st.favours?.[String(a.who)], now = storyNow(st);
                const earlier = a.earlier ?? (past ? (past.agreed ? FITD_EARLIER[0] : FITD_EARLIER[2]) : undefined);
                // A later day of the story calendar (story minutes count civil time, so whole days are whole multiples of 1440).
                const later = a.later_day ?? (past?.t != null && now != null ? Math.floor(now / 1440) > Math.floor(past.t / 1440) : false);
                const same = a.same_requester ?? (past?.by && a.speaker ? norm(past.by) === norm(a.speaker) : true);
                const p = earlier ? fitdChance(earlier, same, later) : null;
                if (p == null)
                    return `Give earlier: ${FITD_EARLIER.join('; ')}.`;
                return `${a.who} ${rng() < asRequester(p, a.requester) ? 'agrees to the bigger favour' : 'declines the bigger favour'}${a.request ? ` (${a.request})` : ''}; earlier they ${earlier}${later ? ', on an earlier day' : ''}${same ? '' : ', asked by someone else'}.`;
            }
            case SOCIAL[17]: {
                const d = ditfChance(asRequester(SMALL_REQUEST_YES, a.requester)), u = rng();
                return `${a.who} ${u < d.does ? 'agrees and does it' : u < d.yes ? 'agrees, but when the time comes leaves it undone' : 'declines this one too'}${a.request ? ` (${a.request})` : ''}.`;
            }
            case SOCIAL[12]: {
                if (!a.statement)
                    return 'Give statement: the event they are urged to remember.';
                const taken = rng() < FALSE_EVENT_TAKEN;
                if (taken)
                    learn(st, a.statement, [a.who], false, { [a.who]: 'remembers it happening (in part)' }, 'version');
                return taken ? `${a.who} comes to remember it, at least in part: ${a.statement}.` : `${a.who} does not remember it and doubts it happened.`;
            }
            case SOCIAL[18]: {
                // A memory the world holds otherwise, met with what the world holds (the player's pick, 2026-11-16, decided by
                // Claude): it gives way with CORRECTION_TAKEN, or CORRECTION_EXPLAINED_TAKEN when what they meet also shows how
                // they came to remember it wrong (social.ts, Blank & Launay 2014); otherwise they hold both, what they were
                // shown and their own version.
                if (!a.statement || !a.shown)
                    return 'Give statement: what they remember, and shown: what they see, read or hear against it.';
                const w = words(a.statement), mine = (st.facts ?? []).filter(f => f.standing === 'version' && f.knowers.some(k => norm(k) === norm(a.who)))
                    .map(f => { const v = words(f.text), both = [...w].filter(x => v.has(x)).length; return { f, score: both / Math.max(w.size, v.size, 1) }; })
                    .filter(x => x.score >= 0.6).sort((x, y) => y.score - x.score)[0]?.f;
                learn(st, a.shown, [a.who], false, { [a.who]: 'saw it' });
                if (!mine)
                    return `${a.who} holds no memory on record that the world holds otherwise matching "${a.statement}": what they were shown is learned (${a.shown}); what they remember stands as the world's or as they were told it.`;
                const own = mine.versionOf != null ? (st.facts ?? []).find(f => f.id === mine.versionOf) : undefined;
                if (rng() < (a.explains_why ? CORRECTION_EXPLAINED_TAKEN : CORRECTION_TAKEN)) {
                    unlearn(mine, a.who);
                    if (own)
                        learn(st, own.text, [a.who], false, { [a.who]: 'found out' });
                    return `${a.who} takes it in: their memory gives way to what they were shown (${a.shown}${a.explains_why ? `; ${a.explains_why}` : ''})${own ? `; they now hold ${own.text.replace(/[.!?]?$/, '')}` : ''}.`;
                }
                return `${a.who} still remembers it their own way (${mine.text.replace(/[.!?]?$/, '')}), and holds what they were shown beside it (${a.shown}).`;
            }
            default: return `Give situation, one of: ${SOCIAL.join('; ')}.`;
        }
    }));
    tool('Trust', 'Record what one character did to another\'s trust (betrayed it, betrayed it with lies, promised to change, apologized, kept faith), or decide whether the betrayed one makes themselves vulnerable to the betrayer again (lends, confides, relies on them), before narrating it.', {
        who: str('The one whose trust is at stake'),
        other: str('The one who betrayed or must be trusted'),
        event: { type: 'string', enum: ['betrayed them', 'betrayed them with lies or false promises', 'promised to change', 'promised to change and apologized', 'kept faith once', 'do they trust them now?'] },
    }, ['who', 'other', 'event'], a => run((st, rng) => {
        const k = `${a.who}→${a.other}`, t = (st.trust ??= {})[k];
        switch (a.event) {
            case 'betrayed them':
                st.trust[k] = { lied: false, repair: TRUST_REPAIR[0], kept: 0 };
                return `Recorded: ${a.other} betrayed ${a.who}.`;
            case 'betrayed them with lies or false promises':
                st.trust[k] = { lied: true, repair: TRUST_REPAIR[0], kept: 0 };
                return `Recorded: ${a.other} betrayed ${a.who} with lies.`;
            case 'promised to change':
            case 'promised to change and apologized':
                if (!t)
                    return `No betrayal of ${a.who} by ${a.other} on record.`;
                t.repair = a.event === 'promised to change' ? TRUST_REPAIR[1] : TRUST_REPAIR[2];
                return `Recorded: ${a.other} ${a.event}.`;
            case 'kept faith once':
                if (!t)
                    return `The record holds zero betrayals by ${a.other}.`;
                t.kept++;
                return `Recorded: ${a.other} kept faith (${t.kept} time${t.kept > 1 ? 's' : ''} since the betrayal).`;
            default: {
                if (!t)
                    return `No betrayal of ${a.who} by ${a.other} on record: decide trust between them with SocialResponse or Choose.`;
                const p = trustAgain(t.lied, t.repair, t.kept);
                return `${a.who} ${rng() < p ? 'trusts' : 'keeps their guard up with'} ${a.other} this time (betrayed${t.lied ? ' with lies' : ''}; ${t.repair === 'none' ? 'promised nothing' : t.repair}; good faith kept ${t.kept} time${t.kept === 1 ? '' : 's'} since).`;
            }
        }
    }));
    tool('HoldOn', 'Decide whether a person can hang on by their hands (a ledge, a rope, a branch) or carry a load by its handles, before narrating it.', {
        who: str('Character holding on'),
        hanging: { type: 'boolean', description: 'Hanging by the hands: the load is the character\'s own body' },
        load_kg: { type: 'number', description: 'Mass carried by handles, kg (carrying)' },
        hands: { type: 'number', description: 'Hands used, 1 or 2. Default 2.' },
        seconds: { type: 'number', description: 'How long the hold must last, s (until help arrives, to cross the gap)' },
        fingertips: { type: 'boolean', description: 'Only the fingertips hold: a ledge, a window sill, a narrow edge' },
        climber: { type: 'string', enum: CLIMBERS, description: 'With fingertips: climbing training. Default no.' },
        region: { type: 'string', enum: Object.keys(REGIONS), description: 'World region the character grew up in, when known. Kept for later calls.' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (!p)
            return error;
        if (a.region)
            p.region = a.region;
        return holdLoad(a.who, p, { load_kg: a.load_kg, hands: a.hands ?? 2, hanging: !!a.hanging, seconds: a.seconds ?? null, fingertips: !!a.fingertips, climber: a.climber ?? 'no' }, rng);
    }));
    tool('Chase', 'Decide whether a pursuer catches someone running away over open ground, from their top speeds (each human\'s drawn once from untrained adults of their sex, scaled by age; other creatures from their species) and leg injuries.', {
        pursuer: str('Character chasing'), pursuer_species: str('Pursuer\'s species, when the engine has no record of them yet.'),
        fleeing: str('Character running away'), fleeing_species: str('Fleeing character\'s species, when the engine has no record of them yet.'),
        gap_m: { type: 'number', description: 'Head start, m. Default: from where both stand on the map, and the map\'s distance is kept' },
        pursuer_sex: { type: 'string', enum: ['male', 'female'], description: 'For a human pursuer missing from the engine\'s records' },
        fleeing_sex: { type: 'string', enum: ['male', 'female'], description: 'For a human fleeing, missing from the engine\'s records' },
        pursuer_build: { type: 'string', enum: Object.keys(BUILDS), description: 'The pursuer\'s build, when the story states it (BodySize draws it otherwise)' },
        fleeing_build: { type: 'string', enum: Object.keys(BUILDS), description: 'The fleeing character\'s build, when the story states it (BodySize draws it otherwise)' },
        pursuer_age: { type: 'number', description: 'For a human pursuer missing from the engine\'s records, years' },
        fleeing_age: { type: 'number', description: 'For a human fleeing, missing from the engine\'s records, years' },
    }, ['pursuer', 'fleeing'], a => run((st, rng) => {
        const p = who(st, a.pursuer, a.pursuer_species), f = who(st, a.fleeing, a.fleeing_species);
        if (!p.p || !f.p)
            return p.error || f.error;
        const map = placed(st, p.p, f.p, a.gap_m), gap = map?.d ?? a.gap_m;
        if (gap == null)
            return 'Give gap_m (or place both on the map with Layout). State unchanged.';
        if (a.pursuer_sex)
            p.p.sex ??= a.pursuer_sex;
        if (a.fleeing_sex)
            f.p.sex ??= a.fleeing_sex;
        if (Number.isFinite(a.pursuer_age))
            p.p.age ??= a.pursuer_age;
        if (Number.isFinite(a.fleeing_age))
            f.p.age ??= a.fleeing_age;
        for (const [q, b] of [[p.p, a.pursuer_build], [f.p, a.fleeing_build]])
            if (b && q.bmiZ == null)
                q.bmiZ = bmiZOf(BUILDS[b], q.sex, st.setting?.country, storyYear(st));
        const out = chase(a.pursuer, p.p, a.fleeing, f.p, gap, rng);
        return map?.note ? `${out}${map.note}` : out;
    }));
    /** A person's usual day (days.ts), drawn once where the time and place have it, after the call's other draws; never for the
     *  player's character, whose day the player decides. */
    const dayFor = (st, p, name, works, rng) => {
        const y = storyYear(st);
        if (p && !p.day && name !== PLAYER && daysHold(st.setting?.country, y))
            p.day = drawDay(rng, y, works);
    };
    tool('NewCharacter', 'Decide the sex, age, occupation and birthplace of a character new to the story (a stranger, a passer-by, the person behind the counter), before describing them. Drawn from the 1881 census of England and Wales there; elsewhere age and sex from the country\'s population in the story year.', {
        who: str('Name or label for the character (e.g. "the innkeeper", "stranger 2")'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'Only when the story already fixes it' },
        named_as: { type: 'string', enum: NAMED_AS, description: 'By meaning: what the words naming them fix, in any language (the landlady: a woman; the lad: a boy; the men by the fire: several people)' },
        occupation: str('Only when the story already fixes it, in a word or two, as the scene names it'),
        min_age: { type: 'number', description: 'Only when the story already fixes it (e.g. 18 for someone serving drinks)' },
        age: { type: 'number', description: 'Only when the story states it ("her brother Will, 12")' },
        mother: str('Their mother\'s name, when the story names her as one of its people'),
        father: str('Their father\'s name, when the story names him as one of its people'),
        sibling_of: str('The name of a brother or sister of theirs in the story ("her brother Will": Will is sibling_of her)'),
    }, ['who'], a => run((st, rng) => {
        // Family as the story fixes it (section 120): kept on the person, before anything else is decided, so a person met before
        // gets it too; their genes, and so their colouring, come from it (colouring.ts genotypeOf).
        recordKin(st, String(a.who), a.mother, a.father, a.sibling_of);
        // A person already drawn keeps what was drawn (an innkeeper drawn at 56 was drawn again at 68 two turns later).
        {
            const known = st.people?.[String(a.who)];
            if (known?.age != null && typeof a.age !== 'number')
                return `${a.who}: ${aYears(known.age)}-year-old ${known.age < 18 ? (known.sex === 'female' ? 'girl' : 'boy') : known.sex === 'female' ? 'woman' : 'man'}, as drawn when first met.`;
        }
        // A person the story describes (the cast's "her brother Will, 12") keeps the stated age and sex; nothing is drawn.
        if (typeof a.age === 'number' && a.age >= 0) {
            const { p } = who(st, a.who), age = Math.round(a.age), sex = a.sex ?? null;
            if (p)
                Object.assign(p, { age, ...sex ? { sex } : {}, ...a.occupation ? { occupation: String(a.occupation) } : {} });
            dayFor(st, p, String(a.who), !!a.occupation, rng);
            const noun = !sex ? (age < 18 ? 'child' : 'adult') : age < 18 ? (sex === 'female' ? 'girl' : 'boy') : sex === 'female' ? 'woman' : 'man';
            return `${a.who}: ${aYears(age)}-year-old ${noun}${a.occupation ? `; occupation: ${a.occupation}` : ''} (as the story states).`;
        }
        // Outside England and Wales around 1881 (±40 years [ASSUMED]) the census does not describe the people: age and sex
        // come from the country's stable population (population.ts); occupation and birthplace are left to the story.
        // An "occupation" that describes the person instead of naming a trade ("man standing at the lit window") is dropped.
        if (a.occupation && (String(a.occupation).trim().split(/\s+/).length > 3 || /^(?:the |a |an )?(person|man|woman|boy|girl|figure|someone|stranger)\b/i.test(String(a.occupation))))
            a = { ...a, occupation: undefined };
        // A role noun as the name ("the costermonger") is the occupation when none is given: a costermonger was drawn as a child.
        // A crowd is a place's people (PlaceProfile), one person at a time here; "man" and "woman" in the name fix sex and adulthood.
        // A group named as one ("the whispering men", "the men by the fire") is several people: each gets their own call.
        if (a.named_as === 'several people')
            return `NewCharacter draws one person; the people of a place come from PlaceProfile, and each one who acts gets their own NewCharacter. State unchanged.`;
        const named = { 'a man': ['male', 18], 'a woman': ['female', 18], 'a boy': ['male', 0], 'a girl': ['female', 0] }[String(a.named_as)];
        if (named)
            a = { ...a, sex: a.sex ?? named[0], min_age: Math.max(named[1], Number(a.min_age) || 0) };
        // A trade word that names the sex (the maidservant, a waitress, the potman) fixes it, as named_as does (census.ts).
        if (!a.sex) {
            const ws = wordSex(String(a.occupation ?? '')) ?? wordSex(String(a.who));
            if (ws)
                a = { ...a, sex: ws };
        }
        // A given name sets the sex by the share of girls among the births it was given to (SSA 1880–2008; data/given-names.ts):
        // a draw against that share, so "Josiah Crake" is a man and "Leslie" a woman 54 % of the time.
        const given = /^([A-Z][a-z]+)\b/.exec(String(a.who).replace(new RegExp(String.raw `^${TITLE}\s+`), ''))?.[1]?.toLowerCase(), share = given ? GIVEN_NAMES[given] : undefined;
        if (!a.sex && share != null)
            a = { ...a, sex: rng() < share ? 'female' : 'male' };
        if (!a.occupation) {
            const role = /^(?:the |an? )?([a-z][a-z-]*(?: [a-z][a-z-]*)?)$/.exec(String(a.who).trim())?.[1];
            if (role && !/^(person|man|woman|boy|girl|child|stranger|figure|someone|somebody|other|men|women)\b/.test(role))
                a = { ...a, occupation: role };
        }
        const c = st.setting?.country, y = storyYear(st);
        const english = !c || (/united kingdom|england|wales/i.test(c) && (y === null || Math.abs(y - 1881) <= 40));
        // A stated occupation means a person at work: age and sex are drawn from the people who work there and then, each draw
        // kept with the ILO share of its sex and age in work (rejection sampling); 50 tries, then the last draw.
        // A trade the census lists draws sex and age from its people, wherever the story is (a landlord came out a girl of 17
        // from the general population with ILO work shares); the country's tables serve the rest.
        if (!english && a.occupation && findOccupation(String(a.occupation))) {
            const r = drawPerson({ sex: a.sex ?? null, occupation: a.occupation, minAge: Number(a.min_age) || 0 }, rng);
            if (!('error' in r)) {
                const { p } = who(st, a.who);
                if (p)
                    Object.assign(p, { age: r.age, sex: r.sex, ...a.occupation ? { occupation: String(a.occupation) } : {} });
                const noun = r.age < 18 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
                return `${a.who}: ${aYears(r.age)}-year-old ${noun}; occupation: ${a.occupation} (age and sex drawn from the 1881 census of England and Wales among its ${r.occupation}, the nearest table held for ${c} ${y ?? ''}; birthplace as the story sets it).`;
            }
        }
        let local = english ? null : strangerAgeSex(c, y, rng, { sex: a.sex ?? null, minAge: Number(a.min_age) || 0 });
        if (local && a.occupation)
            for (let i = 0; i < 50 && local; i++) {
                const w = strangerWork(c, local.sex, local.age, y, rng);
                if (w ? w.works : local.age >= 15)
                    break;
                local = strangerAgeSex(c, y, rng, { sex: a.sex ?? null, minAge: Number(a.min_age) || 0 });
            }
        if (local) {
            const { p } = who(st, a.who);
            if (p)
                Object.assign(p, { age: local.age, sex: local.sex, ...a.occupation ? { occupation: String(a.occupation) } : {} });
            const noun = local.age < 18 ? (local.sex === 'female' ? 'girl' : 'boy') : local.sex === 'female' ? 'woman' : 'man';
            const work = a.occupation ? null : strangerWork(c, local.sex, local.age, y, rng);
            const job = a.occupation ? `; occupation: ${a.occupation}` : local.age < 15 ? '; a child' : !work ? '' : !work.works ? '; outside paid work' : work.group ? `; works, among ${work.group} (the narrator names the job)` : '; works';
            const hh = strangerHousehold(c, y, local.age, rng);
            const home = hh ? hh.size === 1 ? '; lives alone' : `; lives in a household of ${hh.size} (${hh.type})` : '';
            return `${a.who}: ${aYears(local.age)}-year-old ${noun}${job}${home} (age and sex as drawn from ${local.country}'s population in ${y}${work ? `; work from ILO figures for ${work.country}, ${work.year}` : ''}${hh ? `; household from ${hh.source} ${hh.year}` : ''}; birthplace as the story sets it).`;
        }
        // A country the population tables do not reach (Brazil 1822) takes age and sex from the 1881 census of England and
        // Wales, the nearest table held, with occupation and birthplace as the story sets them: the English census's jobs
        // ("Railway Guard" for a Rio guard in 1822) belong to England in 1881.
        // Elsewhere, the census's people of that occupation still give its sex and age (guards are men of working age); the
        // job's name stays the story's.
        let r = drawPerson({ sex: a.sex ?? null, occupation: a.occupation ?? null, minAge: Number(a.min_age) || 0 }, rng);
        if ('error' in r && !english)
            r = drawPerson({ sex: a.sex ?? null, occupation: null, minAge: a.occupation ? Math.max(15, Number(a.min_age) || 0) : Number(a.min_age) || 0 }, rng);
        if ('error' in r)
            return r.error;
        const { p } = who(st, a.who);
        if (p)
            Object.assign(p, { age: r.age, sex: r.sex, ...a.occupation ? { occupation: String(a.occupation) } : {} });
        if (english)
            dayFor(st, p, String(a.who), !!(a.occupation ?? r.occupation), rng);
        const noun = r.age < 18 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
        if (!english)
            return `${a.who}: ${aYears(r.age)}-year-old ${noun}${a.occupation ? `; occupation: ${a.occupation}` : ''} (age and sex drawn from the 1881 census of England and Wales${a.occupation ? ', among its people of that occupation' : ''}, the nearest table held for ${c} ${y ?? ''}; birthplace as the story sets it).`;
        return `${a.who}: ${aYears(r.age)}-year-old ${noun}; ${r.occupation ? `occupation: ${r.occupation}` : r.age < 15 ? 'a child' : 'occupation unlisted in the census'}; born in ${r.born}.`;
    }));
    tool('BodyCheck', 'Resolve a physical or skilled action whose outcome is in doubt, before narrating it: climbing, jumping, swimming, lifting or forcing something, balancing, sneaking, picking a lock, riding, a craft or a trade task (the other tools cover blows, falls, holds, chases, hearing, seeing, messages and people\'s responses). The body state in [BODY] is applied in code.', {
        who: str('Character acting'),
        species,
        height_m: { type: 'number', description: 'For a climb: its height, m; a failure is then a fall from where the grip went' },
        task: str('The task in a few words. A real second attempt names it ("pick lock, 2nd try"); the same task again this turn returns the first result.'),
        task_kind: { type: 'string', enum: TASK_KINDS, description: 'What the task is. A task another tool decides (seeing, hearing, a blow, a chase…) goes to that tool; BodyCheck decides a skill or effort of the body.' },
        reference_class: str('The wider class of attempts this one belongs to (e.g. "amateurs picking an old door lock")'),
        base_share: { type: 'string', enum: SHARES, description: 'How many attempts in that reference class succeed.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this attempt: how many people with this character\'s training succeed at it in these conditions, unhurt.' },
        uses: { type: 'array', items: { type: 'string', enum: [...Object.keys(FUNCTIONS), 'alertness'] }, description: 'Body abilities the task depends on: grasp (hands, claws that hold), stance (feet), sight, hearing, smell, breathing; alertness for tasks needing attention, judgment or quick reactions (driving, aiming, spotting, fine work).' },
        exertion: { type: 'string', enum: ['none', 'light', 'heavy'] },
        on_feet: { type: 'boolean', description: 'The task needs standing or walking unaided' },
        timed: { type: 'boolean', description: 'The task must be done within a tight time (a lock picked before the guard turns, a sum shouted in a race)' },
        fine: { type: 'boolean', description: 'The task needs fine finger work with bare fingers (tying a knot, threading a needle, picking a lock, writing)' },
        override: { type: 'boolean', description: 'Set after BodyCheck named another tool, when the task differs from what that tool decides' },
        gap_m: { type: 'number', description: 'For a jump across a gap or ditch: its width, m; code works the jump out from the body, so share and base_share can go unset' },
        run_up_m: { type: 'number', description: 'With gap_m: room to run before the edge, m (0 = a standing jump)' },
        lift_kg: { type: 'number', description: 'For lifting a load from the floor to waist height: its mass, kg; code works the lift out from the body, so share and base_share can go unset' },
        shot_m: { type: 'number', description: 'For a shot with a handgun at a person: the distance, m; code works the hit out from the distance and the target\'s size, so share and base_share can go unset' },
        shot_at: str('With shot_m: the tracked person shot at, whose size sets the target'),
        under_fire: { type: 'boolean', description: 'With shot_m: the shooter is being shot at' },
    }, ['who', 'task', 'task_kind'], a => run((st, rng) => {
        const w = whoAny(st, a.who, a.species);
        if (!w.p)
            return w.error;
        // Jumps and lifts of humans come from the body (feats.ts): the person's own jump, top speed and lifting capacity.
        const human = !w.p.species || /^human$/i.test(w.p.species);
        // A handgun shot (feats.ts handgunHitChance): from the distance and the size of the one shot at; aiming takes the eyes, the
        // hands and alertness, so drink, lost sleep, injuries and the dark of the eyes all bear on it.
        if (Number(a.shot_m) > 0 && (a.share == null || a.base_share == null)) {
            const tgt = a.shot_at ? st.people?.[String(a.shot_at)] : undefined;
            // Shooter and target on the map: the map's distance is kept, and a shut wall between stops the shot.
            const map = tgt ? placed(st, w.p, tgt, a.shot_m) : null;
            if (map?.wall)
                return `A wall stands between ${a.who} and ${a.shot_at}: ${map.wall}. State unchanged.`;
            const chance = handgunHitChance(map ? Math.max(1, map.d) : Number(a.shot_m), tgt?.mass ?? 80, !!a.under_fire);
            const out = check(w.p, { task: a.task, share: chance, uses: ['alertness', 'grasp', 'sight'], override: true }, rng);
            return map?.note ? `${out}${map.note}` : out;
        }
        const childJump = Number(a.gap_m) > 0 && w.p.age != null && w.p.age < JUMP_MIN_AGE;
        if (childJump && (a.share == null || a.base_share == null))
            return `The jump norms start at age 20; for ${a.who}, aged ${w.p.age}, give base_share and share.`;
        if (human && !childJump && (Number(a.gap_m) > 0 || Number(a.lift_kg) > 0)) {
            featZ(w.p, () => gauss(rng));
            const jump = Number(a.gap_m) > 0;
            const cap = jump ? jumpDistanceM(w.p, Number(a.run_up_m) || 0, topSpeedKmh(w.p, rng) / 3.6) : liftCapacityKg(w.p);
            const chance = featChance(cap, jump ? Number(a.gap_m) : Number(a.lift_kg));
            return check(w.p, { task: a.task, share: chance, uses: jump ? ['stance'] : ['grasp', 'stance'], exertion: 'heavy', on_feet: true, override: true }, rng);
        }
        if (a.share == null || a.base_share == null)
            return 'Give base_share and share (or gap_m for a jump, lift_kg for a lift, shot_m for a handgun shot).';
        const out = check(w.p, { ...a, share: combined(a) }, rng);
        // A failed climb ends where the grip went: a height drawn evenly over the climb [ASSUMED], and the fall from it.
        // A climb sets where the climber stands: on top after a success, at the foot after a failure.
        if (a.height_m && /SUCCESS/.test(out))
            w.p.raised_m = Number(a.height_m);
        if (a.height_m && /FAILURE/.test(out)) {
            w.p.raised_m = 0;
            const h = Math.round(rng() * Number(a.height_m) * 10) / 10;
            return `${out.replace('; the body as it was', '')} ${h < 0.5 ? `${a.who} slips back before leaving the ground.` : `${a.who} loses the grip at ${h} m. ${fall(w.p, h, {}, rng)}`}`;
        }
        return out;
    }));
    tool('BodyTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id, for a treatment of one wound (stop_bleeding, clean, splint, load)' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load', 'antivenom', 'antibiotics', 'laparotomy', 'oxygen', 'hyperbaric_oxygen'] },
        training: { type: 'string', enum: ['untrained', 'instructions', 'trained'], description: 'For stop_bleeding: untrained (a lay person), instructions (told how, in writing or aloud), trained (taught to stop bleeding: a medic, a surgeon). Default untrained.' },
    }, ['who', 'treatment'], a => run((st, rng) => {
        const { p, error } = whoAny(st, a.who);
        if (!p)
            return error;
        // No wound named and one open wound: that wound.
        const open = p.wounds.filter(x => !x.healed), id = a.wound != null && Number.isFinite(Number(a.wound)) ? Number(a.wound) : open.length === 1 ? open[0].id : NaN;
        return `${treat(p, id, a.treatment, rng, { training: a.training ?? 'untrained' })} ${status(a.who, p)}`;
    }));
    tool('BodyContact', 'Skin touches something hot (a stove, a pot handle, spilled hot water or oil) for a stated time. Code decides any burn.', {
        who: str('Character name'),
        species,
        regions: { type: 'array', items: { type: 'string', enum: REGION_WORDS }, description: 'Body regions touching it' },
        material: { type: 'string', enum: CONTACT_MATERIALS },
        temp_c: { type: 'number', description: 'Temperature of the object or liquid, °C' },
        seconds: { type: 'number', description: 'Contact time in seconds' },
    }, ['who', 'regions', 'material', 'temp_c', 'seconds'], a => run((st, rng) => {
        const { p, error } = whoAny(st, a.who, a.species);
        if (!p)
            return error;
        return `${contactBurn(p, a.regions, a.material, a.temp_c, a.seconds, rng)} ${status(a.who, p)}`;
    }));
    tool('PassTime', 'Advance story time for every tracked character. Call before narrating any time passing. List who is active (working, fighting) and who sleeps; walkers go in walking with speed, load, slope and terrain. Time stops early when someone\'s condition changes; narrate that moment, then call again for the remaining minutes.', {
        minutes: { type: 'number', description: 'Minutes that pass' },
        resting: { type: 'array', items: { type: 'string' }, description: 'Characters at rest during this time' },
        active: { type: 'array', items: { type: 'string' }, description: 'Characters walking, working, fighting or in heat during this time (more water and food used)' },
        sleeping: { type: 'array', items: { type: 'string' }, description: 'Characters asleep during this time' },
        walking: {
            type: 'array',
            description: 'Characters walking or marching during this time, with pace, load and ground; sets their energy use, heat and distance covered',
            items: { type: 'object', properties: {
                    who: str('Character'), speed_kmh: { type: 'number', description: 'Walking speed, km/h, when the story sets it (stroll 3, brisk 6.5). Default: the normal pace for the slope, ground, age and sex' },
                    load_kg: { type: 'number', description: 'Carried load, kg' }, grade_pct: { type: 'number', description: 'Slope, % (uphill positive)' },
                    terrain: { type: 'string', enum: Object.keys(TERRAIN) },
                    running: { type: 'boolean', description: 'Running pace' },
                }, required: ['who'] },
        },
    }, ['minutes'], async (a) => {
        await prepareBleeding(store().state.people ?? {}, Math.max(0, Math.round(a.minutes)));
        return run((st, rng) => {
            const asked = Math.max(0, Math.round(a.minutes));
            const walkers = [];
            for (const w of a.walking || []) {
                const p = st.people?.[w.who];
                if (!p)
                    continue;
                if (w.running && w.speed_kmh == null)
                    return `Give speed_kmh for ${w.who}'s running. State unchanged.`;
                let kmh;
                try {
                    kmh = w.speed_kmh ?? walkSpeedKmh(p, w.grade_pct ?? 0, w.terrain ?? 'dirt road', w.load_kg ?? 0, (p.weather ? placeCountry(p.weather) : null) ?? st.setting?.country ?? null);
                    p.workMet = metOf(w.running ? runWatts(p.mass, w.load_kg, kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road') : walkWatts(p, w.load_kg, kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road'), p.mass);
                }
                catch (e) {
                    return `${e.message} State unchanged.`;
                }
                walkers.push([w.who, p, kmh]);
            }
            // Characters outdoors at a weather station: time runs in hour steps, each taking the air temperature at its start.
            const t0 = storyNow(st), weathered = t0 !== null && Object.values(st.people || {}).some(p => p.weather && p.env);
            // The people away from the scene, with a usual day and not named in this call, follow it (days.ts): asleep in their
            // hours of sleep, active in their hours of work; time runs in steps that end where one of them changes.
            const named = new Set([...a.resting || [], ...a.active || [], ...a.sleeping || [], ...(a.walking || []).map(w => w.who)]);
            const away = t0 === null || !PRESENT ? [] : Object.entries(st.people || {}).filter(([n, p]) => p.day && !p.dead && n !== PLAYER && !named.has(n) && !isHere(n));
            // One truly of a kind that feeds (hunger.ts), away from the scene, feeds when it is due and they are not at work.
            // One who wants something toward another of the story, both away (meetings.ts), meets them in the stretches both spend
            // awake and free.
            const awayNow = (n, p) => !p.dead && n !== PLAYER && !named.has(n) && !isHere(n);
            const pairs = t0 === null || !PRESENT ? [] : Object.entries(st.people || {}).flatMap(([n, p]) => { const o = p.want?.toward, q = o ? st.people?.[o] : undefined; return p.want && o && q && o !== PLAYER && awayNow(n, p) && awayNow(o, q) ? [[n, p, o, q]] : []; });
            const feeders = t0 === null || !PRESENT ? [] : Object.entries(st.people || {}).filter(([n, p]) => p.hunger && !p.dead && n !== PLAYER && !named.has(n) && !isHere(n));
            let elapsed = 0, events = [];
            // The kind's work in the town (town.ts), wherever the player's character is, up to each step's end.
            if (t0 !== null)
                townWork(st, t0, rng);
            do {
                if (weathered)
                    applyWeather(st.people, t0 + elapsed);
                const now = (t0 ?? 0) + elapsed;
                // Feeding needs the feeder awake and free (since section 106: before, one asleep by their day could feed).
                for (const [n, p] of feeders)
                    if (now >= p.hunger.next && (!p.day || doingAt(p.day, now) === 'about'))
                        feed(st, n, p, now, rng);
                const turns = [...away.map(([, p]) => Math.max(1, Math.ceil(nextChange(p.day, now) - now))), ...feeders.filter(([, p]) => p.hunger.next > now).map(([, p]) => Math.max(1, Math.ceil(p.hunger.next - now)))];
                const step = Math.min(weathered ? 60 : Infinity, asked - elapsed, ...turns);
                const free = (p) => !p.day || doingAt(p.day, now) === 'about';
                for (const [n, p, o, q] of pairs)
                    if (free(p) && free(q) && rng() < meetChance(meetRate(p, q), step))
                        meet(st, n, p, o, Math.round(now + rng() * step), PLAYER);
                const sleeping = new Set([...a.sleeping || [], ...away.filter(([, p]) => doingAt(p.day, now) === 'asleep').map(([n]) => n)]);
                const active = new Set([...a.active || [], ...away.filter(([, p]) => doingAt(p.day, now) === 'at work').map(([n]) => n)]);
                const r = advanceAll(st.people || {}, step, new Set(a.resting || []), rng, { active, sleeping, eachMinute: airHook(st) });
                elapsed += r.elapsed;
                events = r.events;
                if (t0 !== null)
                    townWork(st, t0 + elapsed, rng);
                if (events.length || r.elapsed < step)
                    break;
            } while (elapsed < asked);
            if (t0 !== null && st.clock) {
                st.clock.add += elapsed;
                release(st, storyNow(st));
            }
            const walked = walkers.map(([n, p, kmh]) => { const met = p.workMet ?? 0; delete p.workMet; return `${n} walked ${Math.round(kmh * elapsed / 60 * 10) / 10} km at ${Math.round(met * 10) / 10} MET`; });
            const head = (events.length
                ? `Time stopped after ${mmss(elapsed)} of ${asked} minutes: ${events.join('; ')}. ${mmss(asked - elapsed)} remain.`
                : `${elapsed} minutes passed.`) + (walked.length ? ` ${walked.join('; ')}.` : '');
            const lines = Object.entries(st.people || {}).map(([who, p]) => status(who, p));
            return [head, ...lines].join('\n');
        });
    });
    const ACT_EXAMPLE = 'Example: {"who":"Mary","steps":[{"do":"be_at","to":"Mary\'s house: hall"},{"do":"walk_to","to":"street outside Mary\'s house","distance_m":4}]} or {"who":"Mary","action":"steps out onto the street","distance_m":4}.';
    const STEP_ITEM = { type: 'object', properties: {
            pace: { type: 'string', enum: ['walk', 'creep', 'brisk', 'run', 'sprint'], description: 'With walk_to: the pace (brisk: hurrying, the fastest walk). Default walk.' },
            do: { type: 'string', enum: ['be_at', 'walk_to', 'stairs_up', 'stairs_down', 'sit', 'stand', 'bend', 'kneel', 'arise', 'kneel_both', 'arise_both', 'turn', 'sidestep', 'reach', 'grasp', 'release', 'look'] },
            to: str('Spot, named with its place in the scene\'s words: "<place>: <part>" (a house and its room or door), or a street\'s name'),
            distance_m: { type: 'number', description: 'Walking distance to the spot, m, from the scene\'s layout; needed only the first time' },
            cm: { type: 'number', description: 'Reach distance, cm' },
            grade_pct: { type: 'number', description: 'Slope or stairs, % (a staircase about 60)' },
            load_kg: { type: 'number', description: 'Load carried, kg' },
            crowd_per_m2: { type: 'number', description: 'People per m² on the way when crowded (busy street 0.5, packed market 2, crush 3.5)' },
            steps: { type: 'number', description: 'For stairs: number of steps (a storey about 16)' },
            riser_cm: { type: 'number', description: 'For stairs: step height, cm, when the story sets it (steep old stair 20, modern 17)' },
            tread_cm: { type: 'number', description: 'For stairs: step depth, cm' },
        }, required: ['do'] };
    tool('Act', 'Time characters\' physical actions before narrating them, and move the story clock by exactly that time. Give who, action (the action in plain words: "steps out onto the street", "sits down at a table") and distance_m for any walking; for several characters at the same time, actors, each with who, action and distance_m. steps is the exact form: walking between spots, sitting, standing, bending, kneeling, turning, reaching, grasping. Narrate the times it gives. Record where a character is with be_at; a walking distance is kept once given.', {
        who: str('Character acting (one actor)'),
        actors: { type: 'array', description: 'Several characters acting at the same time, each with their steps', items: { type: 'object', properties: { who: str('Character'), action: { type: 'string', pattern: MOTION_START, description: 'The action in plain words, beginning with its motion or posture verb' }, distance_m: { type: 'number', description: 'Walking distance, m' }, steps: { type: 'array', items: STEP_ITEM } }, required: ['who'] } },
        steps: { type: 'array', description: 'Actions in order (one actor)', items: STEP_ITEM },
        action: { type: 'string', pattern: MOTION_START, description: 'For one actor, the action in plain words, beginning with its motion or posture verb (an alternative to steps) ("steps out of the house onto the street", "sits down", "stands up and crosses the room"); walking needs distance_m' },
        distance_m: { type: 'number', description: 'With action: the walking distance, m, from the scene' },
        level: { type: 'string', enum: ['on the level, stairs or a change of posture', 'a climb, jump or drop'], description: 'By meaning: whether the action climbs, jumps or drops' },
        pace: { type: 'string', enum: ['walk', 'creep', 'brisk', 'run', 'sprint'], description: 'By meaning: the pace of the walking in the action (brisk: hurrying, the fastest walk). Default walk.' },
    }, ['level'], a => run((st, rng) => {
        // Act times walking and posture; a climb is BodyCheck's (with height_m) and a drop BodyFall's.
        if (a.level === 'a climb, jump or drop')
            return `Act times walking and posture. A climb is decided by BodyCheck with height_m, and a drop by BodyFall from the height the climber stands at. State unchanged.`;
        if (a.who && !a.steps && !a.actors && a.action) {
            const r = stepsFromWords(Array.isArray(a.action) ? a.action.join(', then ') : String(a.action), String(a.who), a.distance_m);
            if ('error' in r)
                return `${r.error} ${ACT_EXAMPLE} State unchanged.`;
            a = { ...a, steps: r.steps };
        }
        if (a.pace && Array.isArray(a.steps))
            a = { ...a, steps: a.steps.map(s => s.do === 'walk_to' && !s.pace ? { ...s, pace: a.pace } : s) };
        // An actor listed without steps takes the call's own steps (a model may name the actors and give the steps once).
        // An actor listed without steps takes the call's own steps, or its action in words.
        const words = Array.isArray(a.action) ? a.action.join(', then ') : a.action ? String(a.action) : '';
        const fromWords = (w) => { if (!words)
            return []; const r = stepsFromWords(words, w, a.distance_m); return 'error' in r ? [] : r.steps; };
        // Each actor's own action in words, a step written as words, and steps nested one level too deep are all read.
        const own = (x) => { if (!x.action)
            return []; const r = stepsFromWords(x.action, x.who, x.distance_m ?? a.distance_m); return 'error' in r ? [] : r.steps; };
        const flat = (st, w) => st?.flatMap(s => s.steps && !s.do ? s.steps
            : !s.do && s.action ? (() => { const r = stepsFromWords(String(s.action), w, s.distance_m ?? a.distance_m); return 'error' in r ? [] : r.steps; })() : [s]);
        const list = (a.actors?.map(x => ({ who: x.who, steps: flat(x.steps, x.who) ?? (own(x).length ? own(x) : undefined) ?? flat(a.steps, x.who) ?? fromWords(x.who) })))
            ?? (a.who && a.steps ? [{ who: String(a.who), steps: a.steps }] : []);
        if (list.some(x => !x.steps.length)) {
            const why = words ? stepsFromWords(words, '', a.distance_m) : null;
            return `Give steps for ${list.filter(x => !x.steps.length).map(x => x.who).join(', ')}${why && 'error' in why ? ` (${why.error})` : ''}. ${ACT_EXAMPLE} State unchanged.`;
        }
        if (!list.length)
            return `Give who and steps (or action), or actors. ${ACT_EXAMPLE} State unchanged.`;
        const actors = [];
        for (const x of list) {
            const { p, error } = who(st, x.who);
            if (!p)
                return error;
            actors.push({ who: x.who, p, steps: x.steps });
        }
        const before = new Map(actors.map(x => [x.who, x.p.at]));
        const r = actTogether(st, actors, p => (p.weather ? placeCountry(p.weather) : null) ?? st.setting?.country ?? null);
        if ('error' in r)
            return `${r.error} State unchanged.`;
        const names = new Set(actors.map(x => x.who));
        // A walk leaves the height a climb set.
        for (const x of actors)
            if (x.steps.some(s => s.do === 'walk_to'))
                delete x.p.raised_m;
        let tail = '';
        tail = passSeconds(st, r.seconds, names, rng);
        return `${r.text}. Span ${honest(r.seconds)}.${tail}${perceivedBy(st, actors, before, rng)}`;
    }));
    tool('Room', 'Set up or change the air of an enclosed space (a room, a cellar, a tent, a mine gallery) when its air matters: a fire, a stove or a lamp burning inside, many people in a closed room, gas filling it; or decide how a crowd gets out through one exit. Characters whose spot (Act be_at / walk_to) is this room breathe its air every minute: carbon monoxide, carbon dioxide, oxygen. Call again when a fire starts or goes out.', {
        room: str('The spot name, as used in Act ("<place>: <part>")'),
        volume_m3: { type: 'number', description: 'Volume, m³ (floor area × ceiling height; a 4 × 4 m room with a 2.5 m ceiling is 40). Needed the first time, or floor_m2 and height_m.' },
        floor_m2: { type: 'number', description: 'Floor area, m² (needed for a fire\'s heat and smoke)' },
        height_m: { type: 'number', description: 'Ceiling height, m (needed for a fire\'s heat and smoke)' },
        lining: { type: 'string', enum: Object.keys(LINING), description: 'What the walls and ceiling are made of. Default brick.' },
        opening_m2: { type: 'number', description: 'Area of an open door or window, m² (a door about 1.6; 0 when all are shut)' },
        opening_height_m: { type: 'number', description: 'Height of that opening, m (a door about 2)' },
        doorways: { type: 'array', description: 'Open doorways from this room into other rooms set up with Room (replaces this room\'s list; empty when all are shut)', items: { type: 'object', properties: {
                    room: str('The other room'), m2: { type: 'number', description: 'Opening area, m² (a door about 1.6)' }, height_m: { type: 'number', description: 'Opening height, m (a door about 2)' },
                }, required: ['room'] } },
        air_changes_per_hour: { type: 'number', description: 'Only when the story sets it (sealed 0, window wide open about 5); otherwise code draws a house\'s typical leak rate once' },
        air_c: { type: 'number', description: 'Air temperature inside, °C. Default 20.' },
        people: { type: 'number', description: 'People in the room besides the tracked characters (drinkers in a tavern, a congregation); their talk sets the room\'s noise' },
        exit_width_m: { type: 'number', description: 'When everyone in the room tries to get out through one exit: its width, m (a house door 0.8–0.9, double doors 1.6–2)' },
        exit_pace: { type: 'string', enum: Object.keys(PACES), description: 'With exit_width_m: how hard the crowd presses toward the exit. Default normal.' },
        outdoor_co2_ppm: { type: 'number', description: 'Carbon dioxide outside, ppm. Default 420 (present day); about 280 before 1800.' },
        fires: { type: 'array', description: 'What burns inside now (an empty list: every fire out)', items: { type: 'object', properties: {
                    fuel: { type: 'string', description: `${Object.keys(FIRE_FUELS).join(', ')}, or a compound burnt in a lamp or burner, by name (ethanol, methane)` },
                    kg_per_hour: { type: 'number', description: 'Fuel burnt per hour, kg (a brazier about 0.5–1 kg/h of charcoal, an open wood fire 1–3, an oil lamp 0.01)' },
                    co_g_per_kg: { type: 'number', description: 'Carbon monoxide per kg burnt, when known; otherwise the measured household-stove value' },
                    moisture_pct: { type: 'number', description: 'For wood and other solid fuels: water, % of wet weight (seasoned 20, green 50). Default 20.' },
                }, required: ['fuel', 'kg_per_hour'] } },
    }, ['room'], async (a) => {
        await loadChem();
        return run((st, rng) => {
            st.rooms ??= {};
            const old = st.rooms[a.room];
            const outline = st.map?.rooms[a.room];
            if (outline) {
                a = { ...a, floor_m2: a.floor_m2 ?? Math.round(area(outline.corners) * 10) / 10, height_m: a.height_m ?? outline.height };
            }
            const vol = a.volume_m3 ?? (a.floor_m2 && a.height_m ? a.floor_m2 * a.height_m : undefined);
            if (!old && !(vol && vol > 0))
                return `Give volume_m3 (or floor_m2 and height_m) for ${a.room} (first time). State unchanged.`;
            const fires = [];
            for (const f of a.fires ?? []) {
                const k = f.fuel.trim().toLowerCase(), known = FIRE_FUELS[k];
                if (known) {
                    fires.push({ fuel: k, kgh: f.kg_per_hour, C: known.C, H: known.H, O: known.O, coEF: f.co_g_per_kg ?? known.coEF, note: f.co_g_per_kg != null ? `CO ${f.co_g_per_kg} g/kg as given` : known.note, lhv: heatingValue({ C: known.C, H: known.H, O: known.O }, k === 'charcoal' ? 0 : f.moisture_pct ?? 20).lhvWet });
                    continue;
                }
                const c = findCompound(k);
                if (!c)
                    return `Unknown fuel "${f.fuel}". Known: ${Object.keys(FIRE_FUELS).join(', ')}, or a compound name. State unchanged.`;
                const el = parseFormula(c.f), M = molarMass(c.f), pct = (e, w) => (el[e] ?? 0) * w / M * 100;
                const hf = heatFromFormation(c), hhv = hf ? hf.kJmol / M : 0; // kJ/g = MJ/kg
                fires.push({ fuel: c.n, kgh: f.kg_per_hour, C: pct('C', 12.011), H: pct('H', 1.008), O: pct('O', 15.999), coEF: f.co_g_per_kg ?? 0, note: f.co_g_per_kg != null ? `CO ${f.co_g_per_kg} g/kg as given` : 'burns to CO2 [ASSUMED]', lhv: hhv - 2.443 * 8.937 * pct('H', 1.008) / 100 });
            }
            const r = old ?? { m3: vol, ach: a.air_changes_per_hour ?? Math.round(drawAch(() => gauss(rng)) * 100) / 100, co: 0, co2: a.outdoor_co2_ppm ?? 420, o2: OUT_O2, out: { co: 0, co2: a.outdoor_co2_ppm ?? 420 }, air_c: a.air_c ?? 20, fires: [] };
            if (vol)
                r.m3 = vol;
            if (a.floor_m2)
                r.floor = a.floor_m2;
            if (a.height_m)
                r.h = a.height_m;
            if (a.lining)
                r.lining = a.lining;
            if (a.opening_m2 != null)
                r.vent = a.opening_m2 > 0 ? { m2: a.opening_m2, h: a.opening_height_m ?? 2 } : null;
            if (a.air_changes_per_hour != null)
                r.ach = a.air_changes_per_hour;
            if (a.air_c != null)
                r.air_c = a.air_c;
            if (a.outdoor_co2_ppm != null)
                r.out.co2 = a.outdoor_co2_ppm;
            if (a.people != null)
                r.crowd = Math.max(0, Math.round(a.people));
            if (a.fires) {
                if (!r.fires.length && fires.length) {
                    r.fireMin = 0;
                    r.base_c = r.air_c;
                    r.hot = undefined;
                }
                if (!fires.length) {
                    r.hot = undefined;
                    r.layer = undefined;
                }
                r.fires = fires;
            }
            st.rooms[a.room] = r;
            if (a.doorways) {
                const missing = a.doorways.filter(d => !st.rooms[d.room]).map(d => d.room);
                if (missing.length)
                    return `Set up ${missing.join(', ')} with Room first (volume), then join the doorways. Nothing else changed.`;
                st.openings = (st.openings ?? []).filter(o => o.a !== a.room && o.b !== a.room).concat(a.doorways.map(d => ({ a: a.room, b: d.room, m2: d.m2 ?? 1.6, h: d.height_m ?? 2 })));
            }
            const joined = (st.openings ?? []).filter(o => o.a === a.room || o.b === a.room).map(o => `${o.a === a.room ? o.b : o.a} (${o.m2} m², ${Math.round(exchangeM3s(st.rooms[o.a], st.rooms[o.b], o) * 3600)} m³/h each way now)`);
            const inside = Object.entries(st.people ?? {}).filter(([, p]) => inRoom(st, p, a.room)).map(([n]) => n);
            // Everyone leaving through one exit (crowd.ts, Helbing's social force model): the room's crowd plus the tracked people
            // inside, on its floor area.
            let leave = '';
            if (Number(a.exit_width_m) > 0) {
                const alive = inside.filter(x => !st.people?.[x]?.dead), n = (r.crowd ?? 0) + alive.length, floor = a.floor_m2 ?? r.floor ?? (r.m3 ? r.m3 / (r.h ?? 2.5) : undefined);
                if (!n)
                    leave = ' No one is inside to leave.';
                else if (!floor)
                    leave = ' Give floor_m2 to work out the way out.';
                else {
                    // One draw seeds the crowd (crowd.ts); the same room, crowd and seed give the same run, kept for the reruns.
                    const seed = rng(), w = Number(a.exit_width_m), v0 = PACES[a.exit_pace ?? 'normal (1 m/s)'] ?? 1;
                    const e = memo(`evacuate|${n}|${floor}|${w}|${v0}|${seed}`, () => evacuate(n, floor, w, v0, seed));
                    const shown = e.people < n ? ` (the first ${e.people} of ${n} worked out)` : '';
                    const packed = e.floorM2 > floor + 1 ? ` (packed tighter than the model holds, about 2 a square metre: worked out over ${Math.round(e.floorM2)} m² back from the exit)` : '';
                    const still = e.people - e.out - e.crushed - e.dead;
                    // The tracked people inside are among those worked out, each at a place in the crowd drawn at random; their end is
                    // theirs: dead in the press, crushed and down (a blunt injury to the chest), out after so many seconds, or still inside.
                    const slots = Array.from({ length: e.people }, (_, i) => i);
                    for (let i = slots.length - 1; i > 0; i--) {
                        const j = Math.floor(rng() * (i + 1));
                        [slots[i], slots[j]] = [slots[j], slots[i]];
                    }
                    const fates = alive.slice(0, e.people).map((name, i) => {
                        const q = st.people[name], f = e.fates[slots[i]];
                        if (f === 3) {
                            q.dead = 'crushed in a crowd (compressive asphyxia)';
                            return `${name} dies in the press`;
                        }
                        if (f === 2) {
                            const c = creatureOf(q), chest = c ? findPart(c, 'upper body') : null;
                            if (chest)
                                addWound(q, { part: chest, type: 'blunt' }, rng);
                            return `${name} is crushed and goes down in the press, chest hurt`;
                        }
                        if (f === 1)
                            return `${name} gets out after ${Math.round(e.outAtS[slots[i]] ?? 0)} s`;
                        return `${name} is still inside after 10 minutes`;
                    });
                    leave = ` Leaving through the ${a.exit_width_m} m exit${shown}${packed}: ${e.out} out${e.seconds != null ? `, the last after ${Math.round(e.seconds)} s` : e.lastOutS != null ? `, the last of them after ${Math.round(e.lastOutS)} s` : ''}${e.crushed ? `; ${e.crushed} crushed and down in the press, alive` : ''}${e.dead ? `; ${e.dead} dead in the press, crushed breathless` : ''}${still > 0 ? `; ${still} still inside after 10 minutes` : ''}; about ${Math.round(e.flow * 10) / 10} people a second through the exit.${fates.length ? ` ${fates.join('; ')}.` : ''}`;
                }
            }
            return `${describeAir(a.room, r)}. Inside: ${inside.join(', ') || 'no one'}.${joined.length ? ` Open to: ${joined.join(', ')}.` : ''} The air changes minute by minute as time passes (PassTime, Act).${leave}`;
        });
    });
    tool('Dose', 'Record a medicine given to a character, when the story has it given (an injection, an anaesthetic); its effects over the next 90 minutes then follow: pulse, blood pressure, breathing, sedation, muscle block. Time passes with PassTime or Act.', {
        who: str('Character given the medicine'),
        substance: { type: 'string', enum: ['Midazolam:IM', 'Lorazepam:IM', 'Ketamine:IM', 'Propofol:IV', 'Succinylcholine:IM', 'Rocuronium:IV', 'Epinephrine:IM'], description: 'Medicine and route (IM into a muscle, IV into a vein)' },
        mg: { type: 'number', description: 'Dose, mg' },
    }, ['who', 'substance', 'mg'], async (a) => {
        await loadDrugs();
        return run(st => {
            const { p, error } = who(st, a.who);
            if (!p)
                return error;
            const r = startDose(p, a.substance, a.mg);
            return 'error' in r ? `${r.error} State unchanged.` : `${a.who}: ${r.note} given; its course runs as time passes.`;
        });
    });
    tool('Layout', 'Place spots and rooms on the scene\'s plan, in metres, once the story fixes where things are: then walking distances, room sizes, who can hear or see whom through walls come from the plan. x east, y north from any corner of the scene; floor 0 the ground floor.', {
        spots: { type: 'array', description: 'Spots with their position', items: { type: 'object', properties: {
                    spot: str('Spot name, as used in Act ("<place>: <part>")'), x_m: { type: 'number', description: 'x, m' }, y_m: { type: 'number', description: 'y, m' },
                    floor: { type: 'number', description: 'Floor number (0 ground, 1 first, -1 cellar). Default 0.' }, room: str('The room it is in, when it has an outline'),
                }, required: ['spot', 'x_m', 'y_m'] } },
        rooms: { type: 'array', description: 'Rooms by their corners', items: { type: 'object', properties: {
                    room: str('Room name (also usable as a spot and in Room)'), corners: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: 'Corners [[x, y], …] in order, m' },
                    floor: { type: 'number', description: 'Floor number. Default 0.' }, height_m: { type: 'number', description: 'Ceiling height, m. Default 2.5.' },
                }, required: ['room', 'corners'] } },
    }, [], a => run(st => {
        const m = mapOf(st), out = [];
        for (const r of (a.rooms ?? [])) {
            if (!Array.isArray(r.corners) || r.corners.length < 3)
                return `Room ${r.room} needs at least 3 corners. State unchanged.`;
            m.rooms[r.room] = { corners: r.corners.map(c => [Number(c[0]), Number(c[1])]), floor: r.floor ?? 0, height: r.height_m ?? 2.5 };
            out.push(`${r.room}: ${area(m.rooms[r.room].corners).toFixed(1)} m², ${(area(m.rooms[r.room].corners) * (r.height_m ?? 2.5)).toFixed(0)} m³`);
        }
        for (const p of (a.spots ?? [])) {
            m.spots[p.spot] = { x: p.x_m, y: p.y_m, floor: p.floor ?? 0, ...(p.room ? { room: p.room } : {}) };
            out.push(`${p.spot} at (${p.x_m}, ${p.y_m}) floor ${p.floor ?? 0}${roomAt(m, p.spot) ? `, in ${roomAt(m, p.spot)}` : ''}`);
        }
        return out.length ? `Placed: ${out.join('; ')}.` : 'Nothing given.';
    }));
    tool('CastSpell', 'Resolve a spell cast before narrating it.', {
        who: str('Caster name'),
        complexity: { type: 'number', description: 'Spell complexity 1-9' },
    }, ['who', 'complexity'], a => run(st => {
        const { p, error } = whoAny(st, a.who);
        if (!p)
            return error;
        return `${cast(p, Math.max(1, Math.min(9, Math.round(a.complexity))))} ${status(a.who, p)}`;
    }));
    tool('Break', 'Decide whether a thing gives way under a load before narrating it: a plank or beam someone stands or jumps on, a shelf, a rope someone hangs from, an iron bar or chain link pulled. Code compares the load with the material\'s strength for that shape.', {
        material: { type: 'string', enum: MATERIAL_NAMES, description: 'What it is made of' },
        shape: { type: 'string', enum: ['plank or beam', 'rope', 'rod or bar'], description: 'Its shape' },
        width_cm: { type: 'number', description: 'Plank or beam: width, cm' },
        thickness_cm: { type: 'number', description: 'Plank or beam: thickness (depth under the load), cm' },
        span_m: { type: 'number', description: 'Plank or beam: distance between its supports, m (the load at the middle)' },
        diameter_mm: { type: 'number', description: 'Rope, rod or bar: diameter, mm' },
        load_kg: { type: 'number', description: 'The load, kg (a person\'s mass; twice it for a jump or a drop onto it [ASSUMED])' },
    }, ['material', 'shape', 'load_kg'], a => {
        const m = material(a.material);
        if (!m)
            return `Give material, one of: ${MATERIAL_NAMES.join(', ')}.`;
        let cap, what;
        if (a.shape === 'rope') {
            if (!a.diameter_mm)
                return 'Give diameter_mm for a rope.';
            cap = ropeBreakKg(a.diameter_mm);
            what = `a ${a.diameter_mm} mm rope`;
        }
        else if (a.shape === 'rod or bar') {
            if (!a.diameter_mm)
                return 'Give diameter_mm for a rod or bar.';
            cap = rodBreakKg(m, a.diameter_mm);
            what = `a ${a.diameter_mm} mm ${a.material} rod`;
        }
        else {
            if (!a.width_cm || !a.thickness_cm || !a.span_m)
                return 'Give width_cm, thickness_cm and span_m for a plank or beam.';
            cap = plankBreakKg(m, a.width_cm / 100, a.thickness_cm / 100, a.span_m);
            what = `a ${a.width_cm} × ${a.thickness_cm} cm ${a.material} plank over ${a.span_m} m`;
        }
        const load = Number(a.load_kg);
        return load >= cap ? `${what} breaks under ${load} kg (it gives at about ${Math.round(cap)} kg).` : `${what} holds ${load} kg (it gives at about ${Math.round(cap)} kg).`;
    });
    tool('BodyFall', 'Resolve a fall before narrating its outcome.', {
        who: str('Character name'),
        species,
        height_m: { type: 'number', description: 'Height fallen, m' },
        soft: { type: 'boolean', description: 'Soft ground: water, snow, foliage' },
        head_first: { type: 'boolean', description: 'Landed head first' },
        age: { type: 'number', description: 'Age in years, when known' },
        ground: { type: 'string', enum: GROUNDS, description: 'What the feet land on. Default packed earth.' },
        stiff_legs: { type: 'boolean', description: 'Lands with straight legs (taken by surprise); default: knees bend' },
        slip: { type: 'boolean', description: 'A slip or trip on level ground (ice, a wet floor): the body goes down from its own height, not onto the feet; give height_m 0' },
    }, ['who', 'height_m'], a => run((st, rng) => {
        const { p, error } = whoAny(st, a.who, a.species);
        if (!p)
            return error;
        // A fall starts from where the character stands: after a failed climb they are at its foot (a climb that failed at
        // 0.6 m was followed by a 3 m drop "into the garden on the other side").
        if (!a.slip && p.raised_m != null && (p.raised_m === 0 || Number(a.height_m) > p.raised_m + 0.5))
            return p.raised_m ? `${a.who} stands ${p.raised_m} m up: the drop is ${p.raised_m} m. Call BodyFall with height_m ${p.raised_m}.` : `${a.who} stands on the ground at the foot of the climb, on the side the climb started from.`;
        // A fall on the level, from the body's own height: about 1 in 10 such falls at 65 or over ends in a serious injury (a
        // fracture, a head injury or a serious bruise) (Tinetti 2003, NEJM 348:42, citing Nevitt 1991, Sattin 1992, Tinetti
        // 1995). Fractures after a fall on the level were 3.35–4.75 times as frequent at 45 and over as under 45 (McNamee et al.
        // 1997, Occup Environ Med 54:785), so under 45 the share is a quarter of that, 45–64 half (slipUnder45, slipMiddleAge:
        // registered judgements, so a draw inside their ranges reports the outcome as fragile). Most such fractures are of the
        // wrist from a hand thrown out, and of the hip at 75 and over.
        // A fall from half a metre or less is a fall on the level: the body goes down from its own height.
        if (a.slip || Number(a.height_m) <= 0.5) {
            const age = Number(a.age ?? p.age ?? 35), judged = age >= 65 ? null : age >= 45 ? 'slipMiddleAge' : 'slipUnder45';
            const draw = rng(), chance = judged ? peek(judged) : 0.10;
            const hurt = judged ? !reaches(judged, draw) : draw < chance, part = age >= 75 ? 'hip' : 'wrist';
            const side = rng() < 0.5 ? 'left' : 'right', c = creatureOf(p);
            const body = hurt ? (part === 'hip' ? c?.parts.find(x => x.name === `${side} upper leg`) : c?.parts.find(x => x.name === `${side} hand`) ?? c?.parts.find(x => x.name === `${side} lower arm`)) : undefined;
            if (body)
                addWound(p, { part: body, type: 'fracture', fracture: 'transverse' }, rng);
            p.posture = 'lying';
            return `${a.who} slips and goes down from standing onto the side and the hands: ${hurt ? `a serious injury, the ${side} ${part} broken (fracture recorded${body ? ` on the ${body.name}` : ''})` : 'bruised and shaken, nothing broken'} (a fall on the level at ${age}: ${Math.round(chance * 100)} % end in a serious injury). ${a.who} is on the ground.`;
        }
        delete p.raised_m;
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first, age: a.age == null ? undefined : Number(a.age), ground: a.ground, stiff: !!a.stiff_legs }, rng);
    }));
    tool('BodyStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
        species,
    }, ['who'], a => run(st => { const w = whoAny(st, a.who, a.species); return w.p ? status(a.who, w.p) : w.error; }));
}
