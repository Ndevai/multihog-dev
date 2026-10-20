import { NOISE, BARRIER, SOUNDS } from './acoustics.js';
import { judgeStatement, EVIDENCE, helpChance, OBEY, obeyShare, REFUSE_SPLIT, PUNISH_ONCE, SMALL_REQUEST_YES, interestChance, SITUATIONS, REQUESTERS, ORDERS, orderChance, asRequester, TRUST_REPAIR, trustAgain, GIVE_WAY_SIZES, GIVE_WAY_REASONS, giveWayChance } from './social.js';
import type { SocialTraits } from './social.js';
import { CONTACT_MATERIALS, REGION_WORDS, IMMERSION_WORDS } from './thermal/exposure.js';
import { SUBLOCATION_NAMES } from './df/sublocations.js';
import { findOccupation, drawPerson } from './census.js';
import { REGIONS } from './strength.js';
import { learn, knowledgeBlock, recalls } from './knowledge.js';
import { ABOUT, MATTERS, TYPES, occTypes, lastsWords, EMOTION_WORDS } from './emotion.js';
import { skyLight } from './sky.js';
import { LININGS, MATERIALS, GROUNDS, MATERIAL_NAMES, material, ropeBreakKg, rodBreakKg, plankBreakKg } from './materials.js';
import type { Way } from './acoustics.js';
import { findPlace, simulatePlaceYear, hourTemp, placeCountry } from './weather.js';
import { observedDay, cachedDay, reanalysisMissed } from './reanalysis.js';
import { NORMALS } from './data/wmo-normals.js';
import type { Place } from './weather.js';
import { price, poundSilver, PRICE_QUESTIONS, GOODS_LIST, TRADES, CITIES, BASKET_ONLY, basketWage } from './prices.js';
import { drawName } from './names.js';
import { bodySize, BUILDS, bmiZOf } from './body-size.js';
import { WATER_SOURCES, drinkWater } from './waterborne.js';
import { pigment } from './pigment.js';
import { TRAITS, LEVELS, POLES, STRENGTHS, BEHAVIOURS, SITUATIONS as SETTINGS, levelZ, stateShare, settingRatio, matchPastAct, pastActShare, pastActTrait } from './acts.js';
import type { Trait } from './acts.js';
import { DISEASES, INCUBATION, R0, incubationHours, attackShare, EPIDEMICS, EPIDEMIC_NAMES, deathCause } from './disease.js';
import { BATTLE_YEARS, attackWinShare, battleCost } from './battle.js';
import { CLIMBERS, gauss, person, addWound, treat, advanceAll, cast, fall, status, seededRng, strike, check, openWound, findPart, creatureOf, FUNCTIONS, communicate, intake, choke, setEnvironment, setAltitude, contactBurn, listen, look, holdLoad, chase } from './body-engine.js';
import { thermalCapable } from './thermal/exposure.js';
import { actTogether, honest, stepsFromWords, type Step } from './actions.js';
import { parseFormula, molarMass } from './substance.js';
import { airHook, inRoom, roomOf, describeAir, drawAch, exchangeM3s, FIRE_FUELS, OUT_O2, LINING, type Room } from './rooms.js';
import { formatStoryTime } from './clock.js';
import { diff, record, truncate, verify, type History } from './world-log.js';
import { violations } from './invariants.js';
import { mapOf, area, roomAt, straight } from './map.js';
import { loadDrugs, startDose } from './drugs.js';
import { resetUsed, fragileCandidates, withOverride } from './constants.js';
import { heatingValue, heatFromFormation, loadChem, findCompound, describe as describeCompound, loadFuels, describeFuel, describeMixture } from './chem.js';
import { TERRAIN, walkWatts, runWatts, metOf, walkSpeedKmh } from './work.js';
import { ENSEMBLES, GARMENTS } from './thermal/ensembles.js';
import { loadRaws, creatureId, creature, meleeWeaponNames, weaponMetalNames } from './df/index.js';
import { SKILL_LEVELS, STYLES } from './df/combat.js';
import { turnKey } from './turn.js';
import { prepareBleeding } from './pulse.js';
import { rollFormula, parseTable, pickTier } from './dice.js';
import { PROBLEMS, solveShare } from './thinking.js';
import { cannotExist, notYetIn } from './history.js';
import { strangerAgeSex, strangerWork, strangerHousehold, skillShare, spokenThere, speakShare, faithShare, survival, FAITHS, heightShift, wageRatio, activityMet, neverMarriedShare, climateShift, wageByTrade, countryFact, cityNear, cityPopulation } from './population.js';
import { H_YEARS } from './data/body-size.js';
import { CURRENT_BOOK, farFrom, worldHasMagic } from './world.js';
import { SICK_SITUATIONS, sickness } from './sickness.js';
import { HOW, transfer, give, account, possessionsBlock } from './possessions.js';
import { sharedIn, sharedWith, whisperedAs, noisyAs, languageCode, soundOf } from './colex.js';
import { resolveLanguage, stageKey } from './languages.js';
import { str, checkArgs } from './tool-schema.js';
import type { Props, ArgsOf } from './tool-schema.js';
import type { Rng, Person, RuleState } from './types.js';
import type { WeatherDay } from './weather.js';
import type { GearSpec, StrikeInput } from './body-engine.js';

/** chatMetadata.rulesEngine: the live state, a snapshot per chat position, the chat's seed, and this turn's decisions. */
export interface EngineStore {
    state: RuleState; snapshots: Record<number, { state: RuleState; calls: number }>; salt: string; calls?: number; version?: number;
    decided?: { turn: string; out: Record<string, string> } | null;
    /** Every state change as a diff, with its call (world-log.ts). */
    history?: History;
    /** The question pass of one turn: the calls asked for and what they returned (kept so a swipe reuses the same calls). */
    asked?: { turn: string; calls: { tool: string; args: Record<string, unknown> }[]; results: { tool: string; result: string; draws?: number[] }[]; time?: number | null; present?: string[];
        read?: { phrase: string; id: string; label: string; year: number | null }[] } | null;
}

export const TOOLS = ['Trust', 'Interpret', 'WorkOut', 'Sickness', 'Transfer', 'Claim', 'RollTheDice', 'Battle', 'BodyEnvironment', 'BodyChoke', 'BodyIntake', 'Communicate', 'Listen', 'Look', 'SocialResponse', 'NewCharacter', 'Break', 'RecordFact', 'Appraise', 'Price', 'PlaceProfile', 'NameCharacter', 'BodySize', 'Disease', 'Weather', 'Substance', 'Act', 'Room', 'Dose', 'Layout', 'Choose', 'HoldOn', 'Chase', 'BodyCheck', 'BodyWound', 'BodyStrike', 'BodyTreat', 'BodyContact', 'PassTime', 'CastSpell', 'BodyFall', 'BodyStatus'] as const;
type ToolName = typeof TOOLS[number];
const KEEP_SNAPSHOTS = 30;

/** A registered tool as the question pass sees it: its schema and the same guarded action the narrator's call runs. */
export interface RegisteredTool { name: ToolName; description: string; properties: Props; required: readonly string[]; exec: (args: Args) => Promise<unknown> }
/** Tools registered while the engine is on, by name. */
export const REGISTRY = new Map<string, RegisteredTool>();

/** Replays the history on its base: whether it rebuilds the current state exactly. */
export function historyCheck(): string {
    const s = store(), h = s.history;
    if (!h?.log.length) return 'No recorded changes yet.';
    const bad = verify(h, s.state);
    const tools = Object.entries(h.log.reduce((m, e) => (m[e.tool] = (m[e.tool] ?? 0) + 1, m), {} as Record<string, number>)).map(([t, n]) => `${t} ${n}`).join(', ');
    return `${h.log.length} recorded changes (${tools}). Replay ${bad ? `does NOT rebuild the state; differs at ${bad} (a change was made outside the tools)` : 'rebuilds the current state exactly'}.`;
}

/** Tools offered only in worlds whose book has magic (world.ts worldHasMagic). */
export const MAGIC_TOOLS = new Set(['CastSpell']);

export function store(): EngineStore {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.rulesEngine ??= { state: { people: {} }, snapshots: {}, version: STATE_VERSION };
    const s = ctx.chatMetadata.rulesEngine as EngineStore;
    s.salt ??= crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    if ((s.version ?? 1) < STATE_VERSION) { migrate(s.state); for (const snap of Object.values(s.snapshots ?? {})) migrate(snap.state); s.version = STATE_VERSION; }
    return s;
}

// State saved in a chat outlives the code that wrote it: each version step converts older state in place, idempotently.
// 2: a character's weather place became a place key ("wgen:Boston, MA", "wmo:<index>") instead of a WGEN station name.
const STATE_VERSION = 2;
function migrate(st: RuleState | undefined): void {
    for (const p of Object.values(st?.people ?? {})) if (p.weather && !p.weather.includes(':')) p.weather = `wgen:${p.weather}`;
}

function save() {
    const ctx = SillyTavern.getContext();
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
}

/**
 * GENERATION_STARTED. State is saved per chat position: the message about to be written sits at
 * chat.length, a swipe or regenerate rewrites the last one. After tool calls SillyTavern stores the
 * results as a message and starts a second 'normal' generation for the reply; that one is saved at
 * its own position, so a swipe of the reply keeps the tools' effects.
 */
export function onRulesGenerationStarted(type?: string): void {
    reshuffle(SHARES);
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return;
    const s = store();
    const chat = ctx.chat || [];
    const rewrites = (type === 'swipe' || type === 'regenerate') && chat.length && !chat[chat.length - 1].is_user;
    if (rewrites) {
        // GENERATION_STARTED of a normal turn fires before the player's message joins the chat, so that turn's snapshot sits at
        // the player's message (length − 2); one taken with the message already in sits at the reply (length − 1). A London
        // 1867 rewrite found neither under the old key alone and ran the turn's Act calls a second time on the moved clock.
        const snap = s.snapshots[chat.length - 1] ?? s.snapshots[chat.length - 2];
        if (snap) {
            s.state = structuredClone(snap.state ?? (snap as unknown as RuleState));
            s.calls = snap.calls ?? 0;
            if (s.history) truncate(s.history, chat.length - 1);
        }
        s.decided = null;
    } else if (!type || type === 'normal') {
        if (chat.at(-1)?.is_user) s.calls = 0;
        s.snapshots[chat.length] = { state: structuredClone(s.state), calls: s.calls || 0 };
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS)) delete s.snapshots[k];
    }
}

/** MESSAGE_RECEIVED: keep the state each swipe ended with. */
export function onRulesMessageReceived(messageId: number): void {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!ctx.chatMetadata || !msg || msg.is_user || msg.is_system) return;
    msg.extra ??= {};
    const results = (msg.extra.rulesResult ??= {}) as Record<number, RuleState>;
    results[msg.swipe_id ?? 0] = structuredClone(store().state);
    // The question pass's calls for this reply, for /rules-stats.
    const asked = store().asked;
    if (asked?.turn === turnKey(ctx.chat)) ((msg.extra.rulesAsked ??= {}) as Record<number, unknown>)[msg.swipe_id ?? 0] = asked.calls;
    (ctx.saveChatDebounced || ctx.saveChat)?.();
}

/** MESSAGE_SWIPED: returning to an earlier swipe restores the state it ended with. */
/** States each swipe of a reply ended with, by swipe id. */
const resultsOf = (m: STMessage | undefined) => m?.extra?.rulesResult as Record<number, RuleState> | undefined;

export function onRulesSwiped(messageId: number): void {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    const saved = resultsOf(msg)?.[msg?.swipe_id ?? 0];
    if (!ctx.chatMetadata || !saved) return;
    restore(saved);
}

const isReply = (m: STMessage | undefined) => !!m && !m.is_user && !m.is_system && !m.extra?.tool_invocations;

function restore(saved: RuleState) {
    const s = structuredClone(saved);
    migrate(s);
    store().state = s;
    save();
}

/** CHAT_CHANGED / MESSAGE_DELETED: state = what the last reply ended with, so a branch or deletion starts from its own point. */
export function syncRulesToChat(): void {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return;
    const msg = [...(ctx.chat || [])].reverse().find(isReply);
    const saved = resultsOf(msg)?.[msg?.swipe_id ?? 0];
    if (saved) restore(saved);
}

// The narrator gets the outcome only: chances, intermediate values and citations are salient details that anchor or
// leak into the narration (models are distracted by irrelevant context: Shi et al. 2023, ICML). The full text goes to the
// browser console.
const DETAIL = /\s*\([^()]*(?:%|\b(?:1[89]|20)\d\d\b|\bSII\b|chance)[^()]*\)/g;
const ODDS = /\b(?:death )?chance \d+(?:\.\d+)? ?%\s*(?:→|—)\s*/g;
export function plain(out: unknown): unknown {
    if (typeof out !== 'string') return out;
    const short = out.replace(DETAIL, '').replace(ODDS, '');
    if (short !== out) console.debug('[Rules engine]', out);
    return short;
}

// A decision tool called again in one turn for the same actor and act returns its first result, like RollTheDice's ledger,
// so an unwanted outcome cannot be re-rolled by calling again (models drop correct answers when pushed: Sharma et al. 2024).
const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
export type Args = Record<string, unknown>;
const DECIDES: Partial<Record<ToolName, (a: Args) => unknown[]>> = { RollTheDice: a => [a.who, a.for], Claim: a => [a.who, a.claim], Transfer: a => [a.item, a.from, a.to, a.how], WorkOut: a => [a.who, a.problem], Sickness: a => [a.who, a.situation], BodyCheck: a => [a.who, a.task], Communicate: a => [a.speaker, a.listener, a.means, a.effort], Interpret: a => [a.listener, a.speaker, a.word], Trust: a => [a.who, a.other, a.event], Listen: a => [a.listener, a.sound ?? a.spl_db],
    Look: a => [a.viewer, a.target ?? a.size_m], SocialResponse: a => [a.situation, a.who, a.speaker ?? a.request ?? ''],
    HoldOn: a => [a.who], Chase: a => [a.pursuer, a.fleeing],
    Weather: a => [a.place], Choose: a => [a.who, ...((a.options as { option?: string }[] | undefined) ?? []).map(o => o?.option).sort()], NewCharacter: a => [a.who], NameCharacter: a => [a.who], BodySize: a => [a.who], Disease: a => [a.question, a.disease, a.who ?? a.population], Battle: a => [a.place, a.year] };
const decisionKey = (name: ToolName, a: Args | undefined) => { const f = DECIDES[name]; return f ? [name, ...f(a ?? {})].map(norm).join('|') : null; };
function decisions(): Record<string, string> {
    const s = store(), turn = turnKey(SillyTavern.getContext().chat);
    if (s.decided?.turn !== turn) s.decided = { turn, out: {} };
    return s.decided.out;
}
const decided = (name: ToolName, a: Args) => { const k = decisionKey(name, a); return k ? decisions()[k] : null; };
// A refusal (an argument or the date missing) decides nothing, so a corrected call runs instead of repeating it.
const REFUSAL = /fix and call again|State unchanged\.?\s*$|needs a calendar date|^Give /;
function remember(name: ToolName, a: Args, out: unknown) { const k = decisionKey(name, a); if (k && typeof out === 'string' && !REFUSAL.test(out)) { decisions()[k] = out; save(); } }

// Same turn + same call order → same random draws, so a swipe repeats outcomes instead of re-rolling them.
// The draws each call used, kept with its result (question-pass.ts), so an outcome can be traced: same state, same
// draws, same result; /rules-log shows them.
export let LAST_DRAWS: number[] = [];
export const clearDraws = () => { LAST_DRAWS = []; };
function run<T>(fn: (st: RuleState, rng: Rng) => T): T {
    const s = store();
    s.calls = (s.calls || 0) + 1;
    const seeded = seededRng(`${s.salt}:${turnKey(SillyTavern.getContext().chat)}:${s.calls}`), draws: number[] = [];
    const rng = () => { const v = seeded(); draws.push(v); return v; };
    LAST_DRAWS = draws;
    const out = fn(s.state, rng);
    save();
    return out;
}

// BodyCheck's success share as labelled bands: words and bands are the verbal-confidence form models can be taught to
// calibrate (Lin, Hilton & Evans 2022, TMLR); band values [ASSUMED]. A bare number is still read. Models prefer options by
// position and label rather than content (selection bias, Zheng et al. 2024, ICLR): each band carries its meaning in its text.
const shuffled = <T>(list: T[]): T[] => list.map(x => [Math.random(), x] as [number, T]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
// Reshuffled in place before every generation, so the order changes per call rather than per load (Zheng et al. 2024).
const reshuffle = <T>(list: T[]) => { const o = shuffled(list); list.splice(0, list.length, ...o); };
// Closed lists from the DF raws (melee weapons; weapon metals plus bone and wood for ammunition), filled after load.
const MELEE: string[] = [], WEAPON_MATERIALS: string[] = [];
// How a character came to know a fact: Aikhenvald's (2004, Evidentiality) six sources marked by the world's evidential
// systems (visual, non-visual sensory, inference, assumption, hearsay, quotative).
const KNOWN_HOW = ['saw it', 'heard, smelled or felt it', 'inferred from what they saw', 'assumed from what they know', 'told by someone', 'hearsay'];
// Every sense writes to the same knowledge: what Look identifies, Listen hears and Communicate carries is learned with its
// source, so a secret reaches another character only through a perception the engine decided.
function learnt(st: RuleState, fact: string, who: string, how: string): string {
    const f = learn(st, fact, [who], false, { [who]: how });
    return f.text.replace(/[.!?]?$/, '.');
}
// A recorded fact the claim names: most of its words (≥ 60 % of the longer one's, [ASSUMED]) in common.
const words = (t: string) => new Set(t.toLowerCase().match(/\p{L}{3,}/gu) ?? []);
function recordedFact(st: RuleState, text: string) {
    const w = words(text);
    return (st.facts ?? []).find(f => { const v = words(f.text); const both = [...w].filter(x => v.has(x)).length; return both / Math.max(w.size, v.size, 1) >= 0.6; });
}

// Body parts and kin are possessed without being owned or handed over (inalienable possession: Nichols 1988, the classes
// languages most often mark apart), and a tracked person is a character, not an item.
const KIN = /^(?:my |his |her |their |our |your )?(?:mother|father|son|daughter|brother|sister|wife|husband|child|children|parent|uncle|aunt|cousin|nephew|niece|grandmother|grandfather|grandchild)s?$/i;
const SEVERED = /\b(severed|cut off|amputated|preserved|skull|bones? of)\b/i;
let PART_NAMES: Set<string> | null = null;
function inalienable(st: RuleState, item: string): string {
    const t = item.trim().toLowerCase().replace(/^(?:my|his|her|their|our|your|a|an|the) /, '');
    if (KIN.test(t) || Object.keys(st.people ?? {}).some(n => n.toLowerCase() === t)) return `"${item}" is a person; their moves come from the story and the people tools`;
    PART_NAMES ??= new Set((creature('HUMAN')?.parts ?? []).map(p => p.name.toLowerCase().replace(/^(left|right) /, '')));
    const bare = t.replace(/^(left|right) /, '');
    if (!SEVERED.test(t) && (PART_NAMES.has(bare) || PART_NAMES.has(bare.replace(/s$/, '')))) return `"${item}" is a body part; it goes with the body (BodyWound, BodyStrike, BodyTreat)`;
    return '';
}

const SOCIAL = ['a statement that might be a lie', 'an emergency they witness', 'an order to hurt someone', 'a small favour asked by a stranger', 'a brief first meeting', 'an order from a stranger', 'a stranger asks to go first', 'an offered split they can refuse so neither gets anything', 'a chance to punish someone who cheated the group, at a cost to themselves'];
const SHARES = shuffled(['95% nearly everyone', '80% most', '65% more than half', '50% half', '35% fewer than half', '20% few', '5% almost no one']);
const shareOf = (v: unknown) => typeof v === 'number' ? v : (parseFloat(String(v)) || 0) / 100;
// The chance for this attempt combines the narrator's estimate with the share of its reference class, asked for first:
// an equal-weight average in log-odds. Averaging a model's forecast with a reference forecast beat the model's own updating
// (Schoenegger et al. 2024, Sci Adv eadp1528); combine in log-odds rather than probability (Satopää et al. 2014;
// Lichtendahl et al. 2020); the reference class comes before the estimate (Kahneman & Tversky 1977, steps 1–3). Language
// models already hedge toward the middle (Halawi et al. 2024; Baron et al. 2012), so no further shrinking is applied.
const logit = (p: number) => Math.log(p / (1 - p)), clamp01 = (p: number) => Math.min(0.995, Math.max(0.005, p));
function combined(a: { share?: string | number; base_share?: string | number }): number {
    const est = shareOf(a.share);
    if (a.base_share == null) return est;
    const z = (logit(clamp01(est)) + logit(clamp01(shareOf(a.base_share)))) / 2;
    return 1 / (1 + Math.exp(-z));
}
const species = str('DF creature of this character, by name or id (human, wolf, horse, giant wolf); read when the character first appears. Default human.');
const partArg = str('Body part by its name: e.g. head, throat, upper body, lower body, right upper arm, left hand, right lower leg, left eye.');

/** Species id from a tool argument: 'HUMAN' when absent, null when no DF creature matches. */
const speciesOf = (text: string | null | undefined) => text ? creatureId(text) : 'HUMAN';
const noSpecies = (text: string | null | undefined) => `No DF creature "${text}". State unchanged.`;

/** What the engine has recorded about `name`: species, mass and languages; {} for a character it has not met. */
function recorded(name: string | null | undefined): { mass?: number; species?: string; languages?: string[] } {
    const p = name ? store().state.people?.[name] : undefined;
    return p ? { mass: p.mass, species: p.species, languages: p.languages } : {};
}

type Who = { p: Person; error?: undefined } | { p?: undefined; error: string };
/** The tracked person `name`; on first appearance species and mass come from the arguments, else what the engine recorded, else human. */
// Names differing by one letter (Mara, Mary) from a recorded one, in names of 4 letters or more, are taken for a misspelling
// unless the call gives a species, which starts a separate record. Numbered labels (stranger 1, stranger 2) are separate people.
function editDistance(a: string, b: string): number {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
}

function who(st: RuleState, rawName: string | null | undefined, speciesArg?: string, massArg?: number): Who {
    if (!rawName) return { error: 'Give the character\'s name.' };
    const key = (x: string) => x.toLowerCase().replace(/\s+/g, ' ').trim();
    const names = Object.keys(st.people ?? {});
    // The same name in other case or spacing is the same person.
    const name = names.find(n => key(n) === key(rawName)) ?? rawName.trim();
    const near = !st.people?.[name] && !speciesArg && name.length >= 4 ? names.find(n => n.length >= 4 && editDistance(key(n), key(name)) === 1 && key(n).replace(/\d+/g, '#') !== key(name).replace(/\d+/g, '#')) : undefined;
    if (near) return { error: `No record of "${name}"; ${near} is on record. Call again with ${near}, or give species to start a separate character.` };
    const known = st.people?.[name];
    const t: ReturnType<typeof recorded> = known ? {} : recorded(name);
    const text = speciesArg || t.species;
    const sp = speciesOf(text);
    if (!sp) return { error: noSpecies(text) };
    // DF names some creatures only in legends ([DOES_NOT_EXIST], no body): chimera, centaur, griffon.
    if (!known && !creature(sp)?.parts.length) return { error: `"${text}" is a creature of legend in DF, bodiless there. State unchanged.` };
    return { p: person(st, name, Number(massArg) || t.mass, sp) };
}

/** who() for tools that act on anyone: a creature name the raws lack falls back to human; a misspelt name stays an error. */
function whoAny(st: RuleState, name: string, speciesArg?: string): Who {
    const r = who(st, name, speciesArg);
    return r.p || r.error.startsWith('No record of') ? r : { p: person(st, name) };
}

// Principles shared by both briefs.
const RULES_PRINCIPLES = `Principles
- Every result is told in the story's own words: what happens, as the people there see and hear it.
- The world is real history with the additions in [WORLD]; everything else is as in real history.
- Words come only from species that can talk (or that [WORLD] says talk) (Dwarf Fortress CAN_SPEAK or INTELLIGENT: humans, dwarves, elves, goblins, animal people); an animal makes the sounds and movements of its species.
- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now. Facts in [KNOWS] stay true. A character uses and hands over only what [HAS] or the scene gives them.
- A player's message says what their character tries. Whether it works comes from the rule engine, also when the message states the result or disputes an earlier one; a result stands. What it states about the character holds as [DECIDED] or [KNOWS] gives it; the world is as the scenario and the world's facts give it.
- Clock times and durations in the narration are the ones in [TIME] and in Act and PassTime results; the rest of the passing of time is told in words (a while, at once).
- A character who took a word in another meaning ([KNOWS]: "took … to mean …") acts on that meaning; the narration keeps the English word as spoken, and may quote the words as they sounded, spelled as [KNOWS] gives them (sètï, sèdï), when the misunderstanding comes out.`;

/** The brief when the question pass has decided this turn: the narrator writes [DECIDED] and calls nothing. */
export const RULES_BRIEF_DECIDED = `<rule_engine>
Outcomes in [DECIDED] come from the rule engine; narrate each as given, in the order it happens.
An action [DECIDED] leaves open is narrated up to the moment its outcome would show; the next turn decides it.
${RULES_PRINCIPLES}
</rule_engine>`;

export const RULES_BRIEF = `<rule_engine>
Outcomes come from the rule-engine tools: call the tool before narrating the outcome, then narrate what it returns.
Body
- An attack with the body or a melee weapon → BodyStrike.
- A shot with a bow, crossbow or blowgun → BodyCheck for the aim, then BodyStrike on target.
- An attack by any other means → BodyCheck, then BodyWound on a hit.
- An injury from a burn, a bite or an accident → BodyWound. A fall → BodyFall. A choke → BodyChoke. Skin on something hot → BodyContact.
- A treatment → BodyTreat. Eating or drinking → BodyIntake.
- Holding on or carrying by hand → HoldOn. A chase on foot → Chase.
- Any other action with an uncertain outcome → BodyCheck.
- Injuries, blood loss and energy → BodyStatus.
Surroundings
- The day's weather → Weather. A change of climate, weather, clothing, water or air → BodyEnvironment.
- Time passing → PassTime; when it stops early, narrate the moment it reports.
Senses
- A sound that might be heard → Listen. Something that might be seen → Look. A message whose arrival is in doubt, or that teaches a fact → Communicate; a word it names as having several meanings → Interpret.
People
- A new character, at first appearance → NewCharacter; their first name → NameCharacter; their height and mass → BodySize.
- A person's response to a possible lie, an emergency, an order to hurt someone, a stranger's small favour, order or request to go first, or a first meeting → SocialResponse.
- A betrayal, a promise or apology after one, faith kept, or whether the betrayed one trusts the betrayer again → Trust.
- A character's pick among several real options → Choose. A character's feelings about something → Appraise.
- A fact the story establishes, or something a character learns → RecordFact.
- A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut. Seasickness or sickness after surgery → Sickness.
- An item changing hands, found, made, lost or used up → Transfer, once the story has it happen.
- A player's message stating something new about their own character (what they are, an item they have, something they can do or did) → Claim, before the actions that rely on it.
- Give a character's species, and their mass when the story states it, in the first rule-tool call about them; the engine keeps both after that.
World
- A price, a wage or a bill → Price. A contagious disease → Disease. An attack by one army or unit on a defended position → Battle. A spell → CastSpell. A random pick (a door, a coin, a card) or a loot or random-event table → RollTheDice with kind "table"; a quantity → kind "amount".
${RULES_PRINCIPLES}
</rule_engine>`;

/** Between two people placed on the map: straight distance, their rooms, and whether an open doorway joins them. */
/** Act's steps as the planner sends them: steps nested one level too deep, or a step written as words, made into steps. */
function prepareAct(raw: Args): Args {
    // A list of actor objects sent as "action" or "actions" is the actors.
    for (const key of ['action', 'actions'] as const) {
        const v = (raw as Record<string, unknown>)[key];
        if (Array.isArray(v) && v.length && v.every(x => x && typeof x === 'object') && !raw.actors) { raw = { ...raw, actors: v as Args['actors'] }; delete (raw as Record<string, unknown>)[key]; }
    }
    const fix = (list: unknown, who: string): unknown => !Array.isArray(list) ? list : list.flatMap((s: Record<string, unknown>) => {
        if (s && !s.do && Array.isArray(s.steps)) return fix(s.steps, who) as unknown[];
        if (s && !s.do && typeof s.action === 'string') { const r = stepsFromWords(s.action, who, (s.distance_m ?? raw.distance_m) as number | undefined); return 'error' in r ? [s] : r.steps; }
        return [s];
    });
    const out: Args = { ...raw, steps: fix(raw.steps, String(raw.who ?? 'they')) as Args['steps'] };
    if (Array.isArray(raw.actors)) out.actors = raw.actors.map((x: Record<string, unknown>) => x && typeof x === 'object' ? { ...x, steps: fix(x.steps, String(x.who ?? 'they')) } : x) as Args['actors'];
    if (out.steps === undefined) delete out.steps;
    return out;
}

/** Moves the story clock by an action's seconds; the body runs in whole minutes, so seconds wait until they make one. */
function passSeconds(st: RuleState, seconds: number, names: Set<string>, rng: Rng): string {
    if (!st.clock) return ' The story clock is still open ([TIME] unset): durations given, the clock stays where it is.';
    let tail = '';
    st.clock.add += seconds / 60;
    st.clock.sec = (st.clock.sec ?? 0) + seconds;
    const mins = Math.floor(st.clock.sec / 60);
    if (mins > 0) {
        st.clock.sec -= mins * 60;
        const others = new Set(Object.keys(st.people ?? {}).filter(n => !names.has(n)));
        const ev = advanceAll(st.people || {}, mins, others, rng, { active: names, eachMinute: airHook(st) });
        if (ev.events.length) tail = ` Meanwhile: ${ev.events.join('; ')}.`;
    }
    return ` Clock now ${formatStoryTime(storyNow(st)!)}.` + tail;
}
// Speaking takes time: English conversation runs at about 196 words a minute over the whole conversation time (Yuan,
// Liberman & Cieri 2006, Switchboard; 214 in CallHome, 193 in Fisher).
const WORDS_PER_S = 196 / 60;

// A price in the coins of the place, so the narration names what changes hands: English money by the pound's silver that
// year (Lindert 2006 from Jastram 1981, the series behind "value of English money"); the French franc of 7 Germinal an XI
// (1803–1914): 5 g of silver at 9/10 fine, 4.5 g of fine silver.
function coinsOf(g: number, city: string, year: number): string {
    if (city === 'London') {
        const perPound = poundSilver(1, year); if (!perPound) return '';
        const d = g / (perPound / 240);
        const q = Math.round(d * 4), frac = ['', '¼', '½', '¾'][q % 4];
        if (d < 12) return ` (about ${Math.floor(q / 4) || ''}${frac || (q < 4 ? '¼' : '')} d)`;
        const sh = Math.floor(d / 12), dd = Math.round(d - sh * 12);
        return sh < 20 ? ` (about ${sh} s ${dd} d)` : ` (about £${Math.floor(sh / 20)} ${sh % 20} s)`;
    }
    if (city === 'Paris' && year >= 1803 && year <= 1914) { const c = Math.round(g / 4.5 * 100); return c < 100 ? ` (about ${c} centimes)` : ` (about ${Math.round(c) / 100} francs)`; }
    return '';
}

// The way a sound travels (acoustics.ts Way): the ground, an obstacle, the wind and sun for outdoors; the room's volume and
// absorption when both are in one. Absorption: walls, floor and ceiling of a square room times the lining's coefficient at
// 500 Hz–1 kHz (brick 0.03, concrete 0.02, gypsum board 0.05, wood 0.10), furnishing 0.1 per m² of floor, 0.45 m² per person
// [ASSUMED typical values from absorption tables].
const ALPHA: Record<string, number> = Object.fromEntries(Object.entries(LININGS).filter(([n]) => !n.startsWith('_')).map(([n, l]) => [n, MATERIALS[l.material]?.alpha500 ?? 0.03]));
const GROUND: Record<string, number> = { 'paved, water or ice': 0, mixed: 0.5, 'grass, fields or soil': 1 };
const WAY_PROPS = {
    ground: { type: 'string', enum: Object.keys(GROUND), description: 'Outdoors: the ground between them. Default mixed.' },
    obstacle_m: { type: 'number', description: 'Outdoors: how far a wall, house or crest between them rises above the straight line from source to ear, m' },
    wind: { type: 'string', enum: ['toward the listener', 'across', 'toward the source'], description: 'Outdoors: which way the wind blows along the way. Default across.' },
    wind_ms: { type: 'number', description: 'Wind speed at 10 m, m/s, when the story sets it. Default: the recorded day\'s wind where known.' },
    source_height_m: { type: 'number', description: 'Height of the source above the ground, m (a voice 1.6, a bell tower 20). Default 1.5.' },
} as const;
function wayFor(st: RuleState, l: Person, a: { ground?: string; obstacle_m?: number; wind?: string; wind_ms?: number; source_height_m?: number; tone_hz?: number }, sameRoom: boolean): Way {
    const room = roomOf(st, l);
    if (room && sameRoom) {
        const F = room.floor ?? (room.m3 / (room.h ?? 2.5)), h = room.h ?? 2.5, S = 2 * F + 4 * Math.sqrt(F) * h;
        const people = Object.values(st.people ?? {}).filter(p => roomOf(st, p) === room).length;
        return { room: { m3: room.m3, absorption: S * (ALPHA[room.lining ?? 'brick'] ?? 0.03) + 0.1 * F + 0.45 * people }, toneHz: a.tone_hz };
    }
    const t = storyNow(st), sun = t !== null && t / 1440 > 146097 && st.latitude != null && Number.isFinite(st.latitude) ? skyLight(t, st.latitude).sunAlt >= 0 : undefined;
    const obs = l.weather ? weatherAt(l.weather, t)?.observed : undefined;
    return { ground: GROUND[a.ground ?? 'mixed'] ?? 0.5, obstacle_m: a.obstacle_m, wind: (a.wind as Way['wind']) ?? 'across', windMs: a.wind_ms ?? obs?.windMs, sunUp: sun, hs: a.source_height_m, hr: 1.5, toneHz: a.tone_hz };
}
function between(st: RuleState, a: Person, b: Person): { d: number | null; ra: string | null; rb: string | null; open: boolean } | null {
    if (!st.map || !a.at || !b.at) return null;
    const ra = roomAt(st.map, a.at) ?? (st.rooms?.[a.at] ? a.at : null), rb = roomAt(st.map, b.at) ?? (st.rooms?.[b.at] ? b.at : null);
    const open = !!(st.openings ?? []).some(o => (o.a === ra && o.b === rb) || (o.a === rb && o.b === ra));
    const d = straight(st.map, a.at, b.at);
    return { d: d == null ? null : Math.round(d * 10) / 10, ra, rb, open };
}

/** The first sentence of b that a does not contain (the changed outcome). */
const firstDiff = (a: string, b: string) => { const sa = new Set(a.split(/(?<=[.;])\s+/).map(x => x.replace(/-?\d+(\.\d+)?/g, '#'))); return b.split(/(?<=[.;])\s+/).find(x => !sa.has(x.replace(/-?\d+(\.\d+)?/g, '#')))?.slice(0, 160) ?? b.slice(0, 160); };

/** Minutes as "49 min 23 s" (whole minutes shown bare). */
const mmss = (m: number) => { const s = Math.round(m * 60), mm = Math.floor(s / 60), ss = s % 60; return ss ? `${mm} min ${ss} s` : `${mm} min`; };

/** Story time in minutes (see clock.ts): the time set with /rules-time plus the minutes PassTime has run since; null when unset. */
function storyNow(st: RuleState): number | null {
    return st.clock ? st.clock.t + st.clock.add : null;
}

/** Sets the story time (minutes, clock.ts) for this chat. */
export function setStoryTime(t: number): void {
    const s = store(), before = structuredClone(s.state);
    s.state.clock = { t, add: 0 };
    s.history ??= { base: before, log: [], n: 0 };
    record(s.history, { msg: SillyTavern.getContext().chat?.length ?? 0, tool: 'set time', args: { t }, draws: [], ops: diff(before, s.state) });
    save();
}

/** The story time now, minutes, or null when unset. */
export function storyTime(): number | null {
    return SillyTavern.getContext().chatMetadata ? storyNow(store().state) : null;
}

/** Weather at `station` at story minute `t` (calendar dates only): { d (the day), tempC (air now), date }, or null. */
/** Story year from a calendar date in [TIME]; null for a bare day count or no [TIME]. */
function storyYear(st: RuleState): number | null {
    const t = storyNow(st);
    if (t === null || t / 1440 <= 146097) return null;
    const date = new Date(0, 0, 1); date.setFullYear(1, 0, 1); date.setDate(date.getDate() + Math.floor(t / 1440));
    return date.getFullYear();
}
const NO_YEAR = 'Give year: [TIME] holds no calendar date.';

/** Remembers a place as the scene's setting, so later calls can leave place and country out. */
function setPlace(st: RuleState, place: Place) {
    st.setting = { place: place.key, label: place.label, country: place.country };
    if (place.lat != null) st.latitude = place.lat;
    if (place.lon != null) st.longitude = place.lon;
    if (place.lat != null && place.lon != null) COORDS.set(place.key, [place.lat, place.lon]);
}

// Coordinates of places seen this session, for the observed weather of real days (reanalysis.ts).
const COORDS = new Map<string, [number, number]>();
function coordsOf(key: string): [number, number] | null {
    const c = COORDS.get(key);
    if (c) return c;
    const st = store().state;
    return st.setting?.place === key && st.latitude != null && st.longitude != null ? [st.latitude, st.longitude] : null;
}
/** Calendar date of story minute `t`, or null for a bare day count. */
function dateOf(t: number | null): Date | null {
    if (t === null || t / 1440 <= 146097) return null;
    const date = new Date(0, 0, 1); date.setFullYear(1, 0, 1); date.setDate(date.getDate() + Math.floor(t / 1440));
    return date;
}
/** Fetches the observed day for a place before a tool runs, so the synchronous weather lookups find it. */
async function prefetchWeather(place: Place | null, t: number | null): Promise<void> {
    const date = dateOf(t), c = place?.lat != null && place.lon != null ? [place.lat, place.lon] as [number, number] : place ? coordsOf(place.key) : null;
    if (place && c) COORDS.set(place.key, c);
    if (date && c) await observedDay(c[0], c[1], date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Weather at place key `place` (from findPlace) at story minute `t` (calendar dates only): the day, air now, date; or null. */
function weatherAt(place: string, t: number | null): { d: WeatherDay; tempC: number; date: Date; observed?: { snowCm: number; windMs: number; humidity: number; source: string } } | null {
    const date = dateOf(t);
    if (t === null || !date) return null;
    // The observed day (ERA5) where it was fetched; the generator otherwise.
    const c = coordsOf(place), obs = c ? cachedDay(c[0], c[1], date.getFullYear(), date.getMonth() + 1, date.getDate()) : null;
    if (obs) return { d: obs.day, tempC: obs.hourlyC[Math.min(23, Math.floor((t % 1440) / 60))], date, observed: { snowCm: obs.snowCm, windMs: obs.windMs, humidity: obs.humidity, source: obs.source } };
    const year = date.getFullYear(), jan1 = new Date(0, 0, 1); jan1.setFullYear(year, 0, 1);
    const doy = Math.min(365, Math.round((date.getTime() - jan1.getTime()) / 864e5) + 1);
    const days = simulatePlaceYear(place, doy, seededRng(`${store().salt}:weather:${place}:${year}`));
    if (!days) return null;
    // A past month runs warmer or colder than the 1991–2020 normals by the country's recorded anomaly (population.ts).
    const off = climateShift(placeCountry(place), year, date.getMonth() + 1) ?? 0, g = days[days.length - 1];
    const d = off ? { ...g, tmaxC: g.tmaxC + off, tminC: g.tminC + off } : g;
    return { d, tempC: hourTemp(d, (t % 1440) / 60), date };
}

/** Characters outdoors at a weather station take its air temperature at story minute `t`. */
function applyWeather(people: Record<string, Person>, t: number) {
    for (const p of Object.values(people)) {
        if (!p.weather || !p.env) continue;
        const w = weatherAt(p.weather, t);
        if (w) { p.env.tdb = w.tempC; p.env.tr = w.tempC; }
    }
}

/** The per-turn [KNOWS] block for the current chat, '' when nothing is recorded. */
export function knowledgeInjection(): string {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return '';
    const a = store().asked;
    const scene = (ctx.chat ?? []).slice(-2).map((m: { mes?: string }) => m.mes ?? '').join(' ');
    return knowledgeBlock(store().state, a?.turn === turnKey(ctx.chat) ? a.present : undefined, scene);
}

/** Sets the scene's position (and the latitude light and weather use). */
export function setScenePosition(lat: number, lon: number): void {
    const st = store().state;
    st.latitude = lat; st.longitude = lon;
    if (st.setting) delete st.setting.place;
    save();
}

/** Where the scene is, from the last place a tool was given (a WMO city, or latitude and longitude); null when unknown. */
export function scenePosition(): { lat: number; lon: number } | null {
    if (!SillyTavern.getContext().chatMetadata) return null;
    const st = store().state, key = st.setting?.place;
    const n = key?.startsWith('wmo:') ? NORMALS[Number(key.slice(4))] : null;
    if (n) return { lat: n[2], lon: n[3] };
    return st.latitude != null && st.longitude != null ? { lat: st.latitude, lon: st.longitude } : null;
}

/** The per-turn [HAS] block for the current chat, '' when nothing is recorded. */
export function possessionsInjection(): string {
    return SillyTavern.getContext().chatMetadata ? possessionsBlock(store().state) : '';
}

/**
 * Whether the question pass ran for this turn. The narrator then gets [DECIDED] and no tool schemas (about 12,000 tokens
 * for 28 tools, plus a second request per tool call), so a large model on a shared endpoint answers before its gateway closes.
 */
export function questionPassRan(): boolean {
    const ctx = SillyTavern.getContext();
    return !!ctx.chatMetadata && store().asked?.turn === turnKey(ctx.chat);
}

export function registerRulesTools(enabled: boolean): void {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool) return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    REGISTRY.clear();
    if (!enabled) return;
    // Lists that come from the DF raws fill in once they load; the schemas hold the same arrays.
    void loadRaws().then(() => {
        MELEE.splice(0, MELEE.length, ...meleeWeaponNames());
        WEAPON_MATERIALS.splice(0, WEAPON_MATERIALS.length, ...weaponMetalNames(), 'bone', 'wood');
    });

    // The action's argument type comes from the schema the model is given.
    const tool = <const Ps extends Props, const Req extends readonly (keyof Ps & string)[]>(name: ToolName, description: string, properties: Ps,
        required: Req, action: (a: ArgsOf<Ps, Req[number]>) => unknown) => {
        const exec = async (raw: Args) => {
            // Arguments are checked against the schema at the boundary; a call with errors runs nothing and says what to fix.
            const { args, errors } = checkArgs(properties, required, name === 'Act' ? prepareAct(raw ?? {}) : raw ?? {});
            if (errors.length) return `${name} waits: fix and call again: ${errors.join('; ')}.`;
            await loadRaws();
            const prior = decided(name, args);
            if (prior) return `Already decided this turn; this result stands. ${prior}`;
            const before = structuredClone(store().state), callsBefore = store().calls ?? 0;
            resetUsed();
            let out: unknown = plain(await action(args as ArgsOf<Ps, Req[number]>));
            const s = store();
            const broken = violations(before, s.state, name, args as Record<string, unknown>);
            if (broken.length) { s.state = before; save(); return `${name} refused: the result would break a law of the world (${broken.join('; ')}). State unchanged; correct the call.`; }
            // Sensitivity (constants.ts): rerun the call on the same state and draws with each judged constant it used at the ends
            // of its range; when the outcome's words change (numbers aside), the result says which assumption it rests on.
            const cands = fragileCandidates();
            if (cands.length && !Object.values(before.people ?? {}).some(p => p.pulse)) {
                const after = s.state, callsAfter = s.calls, draws = LAST_DRAWS, shape = (t: string) => t.split('\n')[0].replace(/-?\d+(\.\d+)?/g, '#'); // the result's first line: its outcome, not the status lines
                const notes: string[] = [];
                for (const c of cands.slice(0, 6)) for (const v of c.range!) {
                    s.state = structuredClone(before); s.calls = callsBefore;
                    const alt = plain(await withOverride(c.id, v, () => action(args as ArgsOf<Ps, Req[number]>)));
                    if (typeof alt === 'string' && typeof out === 'string' && shape(alt) !== shape(out)) { const d = firstDiff(out.split('\n')[0], alt.split('\n')[0]); notes.push(`${c.id} = ${v} ${c.unit} instead of ${c.value} [${c.status.toUpperCase()}: ${c.src}] → ${d}`); break; }
                }
                s.state = after; s.calls = callsAfter; LAST_DRAWS = draws;
                if (notes.length && typeof out === 'string') out += ` Fragile: the outcome changes within the range of ${notes.length} judged value${notes.length > 1 ? 's' : ''}: ${notes.join('; ')}.`;
            }
            s.history ??= { base: before, log: [], n: 0 };
            record(s.history, { msg: SillyTavern.getContext().chat?.length ?? 0, tool: name, args, draws: [...LAST_DRAWS], ops: diff(before, s.state) });
            remember(name, args, out);
            (globalThis as { _rpgRefreshRenderedView?: () => void })._rpgRefreshRenderedView?.();
            return out;
        };
        REGISTRY.set(name, { name, description, properties, required, exec });
        registerFunctionTool({ name, displayName: name, description, parameters: { type: 'object', properties, required: [...required] }, action: exec, formatMessage: () => '',
            shouldRegister: () => !questionPassRan() && (!MAGIC_TOOLS.has(name) || worldHasMagic()) });
    };

    tool('RollTheDice', 'Rolls dice for a quantity or a tier table and returns the result; the returned amount or tier is binding. Checks go through BodyCheck. One formula per call; for several independent rolls make several calls, each with its own "for".', {
        kind: { type: 'string', enum: ['amount', 'table'], description: '"amount": a quantity. "table": a tier table, given in table; the tier is returned.' },
        formula: str('ONE dice formula, e.g. "1d20", "2d6+3", "2d20kh1".'),
        for: str('What is rolled for, 1-4 words, unique within this turn, e.g. "loot chest 2". A repeated who + for returns the first result.'),
        who: str('Who rolls or whose turn it is. Optional.'),
        table: str('kind "table": contiguous rows, e.g. "1-5 Junk | 6-10 Common | 11-19 Rare | 20 Exceptional".'),
    }, ['kind', 'formula', 'for'], a => run((_st, rng) => {
        const rows = a.kind === 'table' ? parseTable(a.table ?? '') : null;
        if (a.kind === 'table' && !rows) return 'Nothing was rolled. Call again with table as contiguous rows, e.g. "1-5 Junk | 6-10 Common | 11-20 Rare".';
        const r = rollFormula(a.formula, rng);
        if (!r) return `Give a dice formula such as "1d20" or "2d6+3" (got "${a.formula}").`;
        const lead = `${a.who ? `${a.who} rolls` : 'Rolled'} ${r.formula} for ${a.for}: ${r.total}`;
        return rows ? `${lead}. Tier: ${pickTier(rows, r.total).label}. Narrate this tier.` : `${lead}. Use this amount as rolled.`;
    }));

    // Severity (vessel, fracture) is decided in code; the narrator names only the cause and place.
    tool('BodyWound', 'Record a wound the moment it happens, for wounds from a burn, a bite, an accident, a fall, or an arrow, bolt or bullet (BodyStrike records the wounds of melee blows itself). Returns what the wound is and the body state.', {
        who: str('Character name'),
        species,
        part: partArg,
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'burn', 'bite'] },
        depth: { type: 'string', enum: ['superficial', 'partial', 'deep_partial', 'full'], description: 'Burns: superficial = red, dry skin; partial = blisters; deep_partial = pale, scars; full = through the skin.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species);
        if (!p) return error;
        const c = creatureOf(p)!, part = findPart(c, a.part);
        if (!part) return `${a.who}'s parts: ${c.parts.map(x => x.name).join(', ')}. State unchanged.`;
        const w = ['cut', 'puncture', 'bite'].includes(a.type) ? openWound(p, part, a.type, rng) : addWound(p, { part, type: a.type, depth: a.depth }, rng);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));

    tool('BodyStrike', 'Resolve an attack before narrating it: whether it lands, which tissue layers it cuts or smashes, and the wounds it records. Narrate a miss as a miss.', {
        who: str('Character hit'),
        species,
        part: str('Body part aimed at, by name (head, throat, upper body, right upper arm, left eye…). For an unaimed blow leave it empty: code draws the location.'),
        attack: str('The attack: a natural attack of the attacker (punch, kick, bite, scratch, gore…) or, with a weapon, the weapon\'s attack (slash, stab, bash, hack…). Empty for a shot.'),
        weapon: { type: 'string', enum: MELEE, description: 'Melee weapon used, if any; for any other weapon the nearest kind (a club as a mace, a knife as a dagger).' },
        material: { type: 'string', enum: WEAPON_MATERIALS, description: 'Material of the weapon (a metal) or of the ammunition (a metal, bone or wood). Default iron.' },
        launcher: { type: 'string', enum: ['bow', 'crossbow', 'blowgun'], description: 'For a shot; the ammunition is its arrow, bolt or dart in material. Call it after the shot is on target (BodyCheck for aim); the target can still dodge or block it.' },
        skill: { type: 'string', enum: SKILL_LEVELS, description: 'Attacker\'s fighting skill level. Dabbling = untrained.' },
        style: { type: 'string', enum: Object.keys(STYLES), description: 'quick = fast weak blow; heavy or wild = full-force blow.' },
        prone: { type: 'boolean', description: 'Target lying on the ground.' },
        from: { type: 'string', enum: ['front', 'back', 'left', 'right'], description: 'Where the attacker strikes from, relative to the way the target faces. Default: front, or back when facing is false.' },
        target_armor: {
            type: 'array',
            description: 'Every item the character hit wears or holds ready, as the story describes it: armour, clothing, a shield, a held board or door.',
            items: {
                type: 'object',
                properties: {
                    item: str('Quality + material + item: "steel breastplate", "iron mail shirt", "leather armor", "iron helm", "cloth trousers", "leather high boots". Quality words: well-crafted, finely-crafted, superior, exceptional, masterwork, artifact. With covers, any item name after the material ("iron skullcap").'),
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
        attacker_species: str('Attacker\'s DF creature, for an attacker missing from [BODY]. Default human.'),
        attacker_mass_kg: { type: 'number', description: 'Attacker body mass in kg, for an attacker missing from [BODY]; default the species\' adult mass.' },
        target_mass_kg: { type: 'number', description: 'Body mass of the character hit, in kg, the first time this character appears; default the species\' adult mass.' },
        awake: { type: 'boolean', description: 'Target awake. Default true.' },
        facing: { type: 'boolean', description: 'Target looking toward the attacker. Default true.' },
        lit: { type: 'boolean', description: 'Enough light for the target to see the attacker. Default true.' },
        noise_db: { type: 'number', description: 'Sound level of the attacker at the target in dB(A). 0 = silent.' },
        noise_sound: { type: 'string', enum: Object.keys(SOUNDS), description: 'The attacker\'s sound, when it is one of these (level at the target is computed from distance_m); the alternative to noise_db.' },
        under_fire: { type: 'boolean', description: 'For a shot: the shooter is being shot at.' },
        noise_khz: { type: 'number', description: 'Main pitch of that sound in kHz, when it is a tone (whistle, ultrasonic call). Default: broadband noise.' },
        distance_m: { type: 'number', description: 'Distance between attacker and target when the attack starts. Default: within reach.' },
        approach_speed: { type: 'number', description: 'Attacker\'s speed in m/s while closing the distance.' },
        sense_range_m: { type: 'number', description: 'Range of any non-visual sense the target has that detects an approaching attacker (e.g. telepathy), in m.' },
        intent_visible: { type: 'boolean', description: 'The approach itself shows an attack is coming (charging, weapon raised). False when the attacker looks harmless until the strike starts. Default false.' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species, a.target_mass_kg);
        if (!p) return error;
        const attacker = a.attacker && st.people?.[a.attacker] ? st.people[a.attacker] : null;
        const ta = attacker || !a.attacker ? {} : recorded(a.attacker);
        const asp = speciesOf(a.attacker_species || ta.species);
        if (!asp) return noSpecies(a.attacker_species || ta.species);
        const { weapon, launcher, material, skill, style, prone, from, awake, facing, lit, noise_db, noise_sound, under_fire, noise_khz, distance_m,
            approach_speed, sense_range_m, intent_visible } = a;
        const scene: StrikeInput = { weapon, launcher, material, skill, style: style as StrikeInput['style'], prone, from, awake, facing, lit, noise_db, noise_sound,
            under_fire, noise_khz, distance_m, approach_speed, sense_range_m, intent_visible };
        const out = strike(p, { part: a.part, attack: a.attack, species: asp, mass: Number(a.attacker_mass_kg) || ta.mass, armor: a.target_armor as GearSpec[] | undefined,
            ...Object.fromEntries(Object.entries(scene).filter(([, v]) => v !== undefined)) }, attacker, rng);
        return `${out} ${status(a.who, p)}`;
    }));

    tool('BodyChoke', 'Resolve a choke or strangling hold on the neck once the hold is locked, before narrating its effect.', {
        who: str('Character choked'),
        holder: str('Character holding the choke'),
        seconds: { type: 'number', description: 'Seconds the locked hold is kept on' },
    }, ['who', 'seconds'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (!p) return error;
        const holder = a.holder && st.people?.[a.holder] ? st.people[a.holder] : null;
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
        face_covered: { type: 'boolean', description: 'Face covered (mask, balaclava, scarf over the face). Default false' },
        met: { type: 'number', description: 'Activity in METs for the whole span when fixed (Compendium of Physical Activities values: sleeping 0.95, sitting quietly 1.3, walking 3 mph 3.5). Default: as PassTime sets it (sleeping 0.95, resting 1.3, active 3.5)' },
        activity: str('What the characters are doing, in plain words ("chopping wood", "sitting in a lecture", "rowing a boat"), code takes the Compendium value (or give met)'),
        altitude_m: { type: 'number', description: 'Altitude above sea level, m, whenever it changes by 500 m or more. 0 = sea level' },
        sudden_ascent: { type: 'boolean', description: 'Arrived at this altitude within minutes (aircraft, magic, a fall upward) ' },
        decompression: { type: 'boolean', description: 'A pressurized cabin or enclosure suddenly opened at this altitude (breath torn out; shorter time conscious)' },
        co_ppm: { type: 'number', description: 'Carbon monoxide in the air, ppm (fire smoke in a room 1000–10 000; car exhaust in a closed garage several thousand; a faulty heater 100–1000); 0 = fresh air' },
        o2_pct: { type: 'number', description: 'Oxygen in the air, % (normal 20.9; a fire-filled or sealed room or gas-displaced air lower). Default: 20.9' },
        smoke: { type: 'boolean', description: 'Breathing fire smoke (causes inhalation injury)' },
        swimmer: { type: 'boolean', description: 'Whether the character can swim, when the story has established it; otherwise code draws it once (46 % of adults)' },
        deep_water: { type: 'boolean', description: 'Water over the head. Default true when immersed.' },
        clear: { type: 'boolean', description: 'Remove recorded conditions' },
        weather_place: str('Outdoors: the town or city the characters are in or nearest to ("Lyon", "Sydney, Australia"); air temperature then follows that place\'s weather as PassTime runs (air_c then optional).'),
        latitude: { type: 'number', description: 'With weather_place for any other place (fictional or remote): its latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, ['who'], async a => {
        if (a.weather_place) await prefetchWeather(findPlace(a.weather_place, a.latitude, a.longitude), storyNow(store().state));
        const act = a.met == null && a.activity ? activityMet(a.activity) : null;
        if (act) a = { ...a, met: act.met };
        return run(st => {
        const out: string[] = act ? [`Activity: ${act.description} (${act.met} MET, Compendium ${act.code}).`] : a.activity && a.met == null ? [`No Compendium activity matches "${a.activity}"; give met to set it.`] : [];
        for (const name of a.who) {
            const { p, error } = who(st, name);
            if (!p) { out.push(error); continue; }
            if (a.clear) { setEnvironment(p, null); out.push(`${name}: conditions cleared.`); continue; }
            if (a.altitude_m != null) setAltitude(p, a.altitude_m, !!a.sudden_ascent, !!a.decompression);
            const place = a.weather_place ? findPlace(a.weather_place, a.latitude, a.longitude) : null;
            if (a.weather_place && !place) { out.push(`No weather data for "${a.weather_place}": give the nearest real town, or latitude and longitude.`); continue; }
            const w = place ? weatherAt(place.key, storyNow(st)) : null;
            if (place && !w) { out.push('weather_place needs a calendar date (dd/mm/yyyy) and hour in [TIME].'); continue; }
            p.weather = w && place ? place.key : null;
            if (place) setPlace(st, place);
            if (a.air_c == null && w) a = { ...a, air_c: w.tempC, radiant_c: a.radiant_c ?? w.tempC };
            if (a.air_c == null) { out.push(a.altitude_m != null ? status(name, p) : 'air_c is required.'); continue; }
            if (!thermalCapable(p.species) && !creatureOf(p)?.homeotherm) { out.push(`${name}: cold-blooded; the body takes the air's temperature (left to the story).`); continue; }
            try {
                setEnvironment(p, { ...a, air_c: a.air_c, clothing: { ensemble: a.ensemble, garments: a.garments } });
            } catch (e) { return `${(e as Error).message} State unchanged.`; }
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
        if (!p) return error;
        const note = intake(p, a);
        // Boiling at a rolling boil kills the reference pathogens (WHO 2015, technical brief "Boil water").
        const w = a.water_source && !a.boiled ? drinkWater(a.water_source, Number(a.water_l) || 0, rng) : null;
        const sick = w?.ill.length ? ` ${a.who} caught ${w.ill.join(' and ')}: diarrhoea and cramps start within days.` : w?.infected.length ? ` ${a.who} carries an infection without falling ill.` : '';
        return (note ? `Food: ${note}. ` : '') + status(a.who, p) + sick;
    }));

    // A strong feeling raises the voice: peak speech level of 48 women students enacting a message, strong minus weak intensity,
    // anger +4.46 dB, liking +1.19 dB (Kimble, Forte & Yoshikawa 1981, J Pers 49:271, Table 2, mean of camera and person targets).
    const FEELING_DB: Record<string, number> = { 'intense anger': 4.46, 'intense affection': 1.19 };
    // In noise people raise their voice without meaning to (Lombard effect): face to face, speech holds 55 dB at 1 m up to 48 dB
    // of background, then rises 0.6 dB per dB of noise, reaching 67 dB at 70 dB of noise (Pearsons, Bennett & Fidell 1977,
    // EPA-600/1-77-025, abstract and Table II; A-weighted, applied to the engine's overall levels [ASSUMED]); held above 70 dB
    // [ASSUMED]. Applies to a normal voice; a chosen effort is the speaker's own.
    const lombardDb = (noiseDb: number) => 0.6 * Math.max(0, Math.min(70, noiseDb) - 48);
    tool('Communicate', 'Decide what a message carries from one character to another (speech or gesture) before narrating a reply or reaction. Returns whether the words, only the tone, or nothing reaches the listener.', {
        speaker: str('Character sending the message'),
        listener: str('Character receiving it'),
        means: { type: 'string', enum: ['speech', 'gesture'] },
        lit: { type: 'boolean', description: 'Enough light to see a gesture. Default true.' },
        distance_m: { type: 'number', description: 'Distance between them, m. Default 1.' },
        effort: { type: 'string', enum: ['whisper', 'normal', 'raised', 'loud', 'shout'], description: 'Vocal effort. Default normal.' },
        feeling: { type: 'string', enum: ['intense anger', 'intense affection'], description: 'When the speaker voices a strong feeling: it raises the voice within the chosen effort' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between them. Default none.' },
        ...WAY_PROPS,
        speaker_species: str('Speaker\'s DF creature when the engine has no record of them yet.'),
        listener_species: str('Listener\'s DF creature when the engine has no record of them yet.'),
        speaker_languages: { type: 'array', items: { type: 'string' }, description: 'Languages the speaker knows, when the story states them; kept for later calls.' },
        listener_languages: { type: 'array', items: { type: 'string' }, description: 'Languages the listener knows, when the story states them; kept for later calls.' },
        message: str('What the message says, one short sentence. When it reaches the listener, the listener comes to know it.'),
        speaker_voice: { type: 'string', enum: ['normal', 'whisper only (no vocal-fold vibration)'], description: 'When the story makes the speaker voiceless (larynx removed, vocal folds paralysed); kept for later calls.' },
    }, ['speaker', 'listener'], a => run((st, rng) => {
        const s = who(st, a.speaker, a.speaker_species), l = who(st, a.listener, a.listener_species);
        if (!s.p || !l.p) return s.error || l.error;
        // A language is the stage spoken in the story's year; one not spoken then is refused (languages.ts).
        const year = storyYear(st);
        const late = [...a.speaker_languages ?? [], ...a.listener_languages ?? []].map(x => cannotExist(x, year, CURRENT_BOOK, 'language')).find(Boolean);
        if (late) return `State unchanged: ${late}.`;
        if (a.speaker_languages?.length) s.p.languages = a.speaker_languages.map(x => x.trim().toLowerCase());
        if (a.listener_languages?.length) l.p.languages = a.listener_languages.map(x => x.trim().toLowerCase());
        if (a.speaker_voice) { if (a.speaker_voice === 'normal') delete s.p.voice; else s.p.voice = 'whisper'; }
        // A speaker without voice whispers at every effort: a whisper, or a loud whisper when they raise it.
        const effort = s.p.voice === 'whisper' ? (!a.effort || a.effort === 'normal' || a.effort === 'whisper' ? 'whisper' : 'loud whisper') : a.effort ?? 'normal';
        const langs = [s.p.languages?.map(x => stageKey(x, year)), l.p.languages?.map(x => stageKey(x, year))];
        // On the map: distance from the two spots; different rooms with no open doorway between → a plaster wall [ASSUMED default].
        const geo = between(st, s.p, l.p);
        const out = communicate(a.speaker, s.p, a.listener, l.p, { way: wayFor(st, l.p, a, geo ? geo.ra === geo.rb : (!a.barrier || a.barrier === 'none')), means: a.means, lit: a.lit !== false, languages: langs, distance: a.distance_m ?? geo?.d ?? 1, effort, noise: a.noise ?? 'quiet room (25 dB)', barrier: a.barrier ?? (geo && geo.ra && geo.rb && geo.ra !== geo.rb && !geo.open ? 'plaster wall' : 'none'), louder_db: (a.feeling ? FEELING_DB[a.feeling] : 0) + (effort === 'normal' ? lombardDb(NOISE[a.noise ?? 'quiet room'] ?? 25) : 0), brazil: /brazil/i.test(st.setting?.country ?? '') });
        // The message takes its speaking time on the clock.
        const said = a.message ? Math.max(1, String(a.message).trim().split(/\s+/).length / WORDS_PER_S) : 0;
        const talk = said ? `${passSeconds(st, said, new Set([a.speaker, a.listener]), rng)}`.replace(/^ Clock now/, ` Said in ${honest(said)}; clock now`) : '';
        if (!a.message || !/makes out (every word|most words|some words)|sees the gesture/.test(out) || /language foreign to it/.test(out)) return out + talk;
        learn(st, a.message, [a.speaker, a.listener], false, { [a.listener]: `told by ${a.speaker}` });
        // English speech is already on the page in its own words; another language's words are not. A whisper loses voicing
        // in any language, English included (colex.ts).
        const whispers = effort === 'whisper' || effort === 'loud whisper';
        const snr = l.p.heard?.from === a.speaker ? l.p.heard.snr : Infinity, noisy = snr < 12;
        const spoken = whispers || noisy ? (s.p.languages ?? ['english']).find(x => !l.p!.languages?.length || l.p!.languages.includes(x))
            : (s.p.languages ?? []).find(x => x !== 'english' && (!l.p!.languages?.length || l.p!.languages.includes(x)));
        const stage = spoken ? resolveLanguage(spoken, year, CURRENT_BOOK) : null;
        const shared = spoken ? sharedIn(a.message, spoken, 3, whispers, stage!.list, snr) : [];
        const one = shared.length ? ` In ${stage!.label}${whispers ? ', whispered,' : ''} a word can also be taken as: ${shared.map(x => `"${x.word}"${x.sound ? ` = ${x.sound}` : ''} (${x.also.slice(0, 4).join(', ')})`).join('; ')}. Call Interpret for each one whose reading changes what ${a.listener} does.` : '';
        return `${out} ${a.listener} now knows: ${a.message.replace(/[.!?]?$/, '.')}${one}${talk}`;
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
        if (!code) return `No word list for ${a.language} in this period; ${a.listener} takes "${a.word}" as meant.`;
        // Weights: the meaning intended 1; another meaning of the same word 1 (equal chance); a word the whisper may be heard
        // as, its odds r/(1 − r), so that with one such word it is heard so with share r.
        const meant = a.word.toLowerCase(), weight = new Map<string, number>([[meant, 1]]);
        if (a.language.toLowerCase() !== 'english') for (const c of sharedWith(a.word, code)) weight.set(c, 1);
        const heard = who(st, a.listener).p?.heard;
        if (who(st, a.speaker).p?.voice === 'whisper' || heard?.from === a.speaker && heard.whisper) for (const x of whisperedAs(a.word, code)) weight.set(x.concept, x.rate / (1 - x.rate));
        if (heard?.from === a.speaker) for (const x of noisyAs(a.word, code, heard.snr)) weight.set(x.concept, Math.max(weight.get(x.concept) ?? 0, x.rate / (1 - x.rate)));
        const fits = [...new Set((a.fits ?? []).map(x => x.trim().toLowerCase().replace(/ if (whispered|misheard)$/, '').replace(/ = .*$/, '')))].filter(x => weight.has(x));
        // Fits that name none of the readings: the listener takes the word as spoken.
        if (!fits.length) fits.push(String(a.word).trim().toLowerCase());
        if (!weight.has(fits[0])) return `${a.listener} takes "${a.word}" as spoken.`;
        let u = rng() * fits.reduce((t, x) => t + weight.get(x)!, 0), reading = fits[fits.length - 1];
        for (const x of fits) if ((u -= weight.get(x)!) < 0) { reading = x; break; }
        if (reading === meant) return `${a.listener} takes "${a.word}" as ${a.speaker} meant it.`;
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
        emotion_word: { type: 'string', enum: EMOTION_WORDS, description: 'The plain word for the feeling when one fits (fear = a present threat; anxiety = a feared prospect)' },
    }, ['who', 'about', 'matters'], a => run(() => {
        const types = occTypes({ about: a.about, good: a.good !== false, wants: a.wants_it_for_them !== false, cameTrue: a.came_true !== false,
            praiseworthy: a.praiseworthy !== false, result: a.result_for_them ?? 'none', appealing: a.appealing !== false });
        if (!types) return `Unknown appraisal "${a.about}". Use one of: ${ABOUT.join('; ')}.`;
        if (a.matters === MATTERS[0]) return `${a.who} stays calm${a.target ? ` about ${a.target}` : ''}: too little at stake for an emotion.`;
        const strong = a.matters === MATTERS[2];
        const words = (t: string) => { const w = TYPES[t].words.split(', '), h = Math.ceil(w.length / 2); return (strong ? w.slice(h - 1) : w.slice(0, h)).join(', '); };
        const [main, ...with_] = types;
        const lasts = lastsWords(main, a.emotion_word);
        return `${a.who} feels ${main}${with_.length ? `, together with ${with_.join(' and ')}` : ''}${a.target ? ` (${a.target})` : ''}. Words at this strength: ${words(main)}; it grows stronger ${TYPES[main].stronger}.${lasts ? ` ${lasts[0].toUpperCase()}${lasts.slice(1)}, longer the more it matters to ${a.who}.` : ''}`;
    }));

    // The country of each listed city, and the city that stands for a country (its first listed city, or its capital) [stated
    // geography; the stand-in city is ASSUMED to speak for the whole country].
    const CITY_OF: [RegExp, string, string[]][] = [
        [/united kingdom|england|great britain|britain|scotland|wales/i, 'London', ['London', 'England']],
        [/netherlands|holland/i, 'Amsterdam', ['Amsterdam']], [/belgium|flanders/i, 'Antwerp', ['Antwerp']],
        [/italy/i, 'Florence', ['Florence', 'Naples', 'Milan']], [/spain/i, 'Madrid', ['Valencia', 'Madrid', 'Barcelona', 'Seville']],
        [/france/i, 'Paris', ['Paris', 'Strasbourg']], [/germany|prussia|bavaria|saxony/i, 'Leipzig', ['Augsburg', 'Leipzig', 'Munich', 'Hamburg', 'Frankfurt', 'Gottingen', 'Nurnberg', 'Quedlinburg', 'Rostock', 'Wurzburg']],
        [/austria/i, 'Vienna', ['Vienna', 'LowerAustria', 'UpperAustria', 'Salzburg', 'Styria', 'Tyrol', 'Carinthia', 'Carniola']],
        [/poland/i, 'Warsaw', ['Gdansk', 'Krakow', 'Warsaw', 'Lwow', 'Cracow', 'Lublin', 'Poznan']], [/portugal/i, 'Lisbon', ['Lisbon', 'Porto', 'Coimbra', 'Evora']],
        [/sweden/i, 'Stockholm', ['Stockholm']], [/russia/i, 'Moscow', ['Moscow', 'Saint Petersburg']], [/turkey|ottoman/i, 'Istanbul', ['Istanbul']],
        [/egypt/i, 'Cairo', ['Cairo']], [/japan/i, 'Kyoto', ['Kyoto', 'Japan', 'Edo']], [/china/i, 'Beijing', ['Beijing', 'Suzhou', 'Canton']],
    ];
    const cityOfCountry = (c: string) => CITY_OF.find(([re]) => re.test(c))?.[1] ?? null;
    const cityCountry = (city: string) => CITY_OF.find(([, , list]) => list.includes(city))?.[1] ?? null;
    tool('Price', 'Decide what goods cost, what a day of work pays, what a year of necessities costs, or what English money is worth, in a European city 1264–1913, an Asian city (Beijing, Suzhou, Canton, Kyoto) about 1730–1925, or for wages in Istanbul 1489–1914, Cairo 1400–1800, Moscow 1701–1874, Japan 1610–1867, India by region 1595–1928, Korea 1782–1879, Latin America (Argentina, Bolivia, Chile, Mexico, Peru) 1524–1820 and nine British African colonies 1880–1965, in 1953–2008 the hourly pay of a named trade (welder, nurse, bus driver) in 100+ countries, and in about 60 more markets worldwide 1209–2008 the baskets a day\'s wage buys, before narrating a sale, a wage or a bill. Returns grams of silver and the days a building labourer works to earn it. Goods outside its list (apples, fish, tea) have their price from the story; Price gives the listed goods only.', {
        question: { type: 'string', enum: PRICE_QUESTIONS },
        item: { type: 'string', enum: GOODS_LIST, description: 'For the price of goods' },
        quantity: { type: 'number', description: 'Units of the item (kg, litres, eggs, metres) or days of work. Default 1.' },
        trade: { type: 'string', enum: TRADES, description: 'For a daily wage. Default building labourer.' },
        city: { type: 'string', enum: CITIES, description: 'The city, or the nearest listed one in the same country' },
        country: str('For a daily wage in a country with no listed city, 1820–2008: the country'),
        trade_name: str('For the hourly pay of a modern trade 1953–2008 (with country): the occupation, e.g. "welder", "nurse"'),
        money: { type: 'array', items: { type: 'number' }, description: 'For "value of English money": [pounds, shillings, pence] (12 shillings = [0, 12, 0])' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
    }, ['question'], a => run(st => {
        const year = a.year ?? storyYear(st);
        if (year == null) return NO_YEAR;
        // English money in silver (Lindert 2006 from Jastram 1981, mint price, 1273–1977), and in a labourer's days where a city is given.
        if (a.question === 'value of English money') {
            const [l = 0, sh = 0, d = 0] = (a.money ?? []).map(Number), pounds = l + sh / 20 + d / 240, g = poundSilver(pounds, year);
            if (g == null) return 'English money data cover 1273–1977.';
            const day = a.city && CITIES.includes(a.city) ? price('daily wage', undefined, 'building labourer', 1, a.city, year) : null;
            const days = day && !('error' in day) ? `; a building labourer in ${a.city} earns that in ${Math.round(g / day.silver * 10) / 10} days` : '';
            return `£${l} ${sh}s ${d}d in ${year}: ${Math.round(g * 10) / 10} g of silver${days}.`;
        }
        // A named modern trade: ISCO-88 codes matched in the index, pay from the October Inquiry series (population.ts).
        if (a.trade_name) {
            const w = wageByTrade(String(a.trade_name), a.country ?? st.setting?.country ?? '', year);
            if ('error' in w) return w.error;
            return `${a.trade_name} in ${w.country}, ${w.year}: US$${Math.round(w.usd * 100) / 100} an hour (${Math.round(w.relative * 100) / 100} × the country's median; ISCO ${w.codes.slice(0, 3).join(', ')}).`;
        }
        // Markets only the Moatsos wage series cover: baskets per day and days of work per year.
        if (a.city && BASKET_ONLY.includes(a.city)) {
            const b = basketWage(a.city, a.trade === 'building craftsman', year);
            if ('error' in b) return b.error;
            return `Daily wage of ${b.class} labour in ${a.city} (${b.country}), ${b.at}: buys ${Math.round(b.rw * 100) / 100} daily subsistence baskets; a year's basket costs ${Math.round(b.daysPerYear)} days of work.`;
        }
        // Outside the listed cities: a labourer's wage by what it buys against a British labourer's the same year (population.ts).
        if (!CITIES.includes(a.city ?? "") && a.country) {
            const w = wageRatio(a.country, year);
            if ('error' in w) return w.error;
            const lon = year <= 1913 ? price('daily wage', undefined, 'building labourer', 1, 'London', year) : null;
            const g = lon && !('error' in lon) ? `; in London that buys what ${Math.round(lon.silver * w.ratio * 10) / 10} g of silver buys` : '';
            return `Daily wage of a labourer in ${w.country}, ${year}: buys ${Math.round(w.ratio * 100)} % of what a British labourer's buys${g}.`;
        }
        if (!CITIES.includes(a.city ?? "")) return 'Give city, or country for a daily wage elsewhere (1820–2008).';
        // A city in another country than the scene's, where the scene's country has a listed city, gives way to that one (a York
        // inn in 1820 was priced in Leipzig).
        const home = st.setting?.country ? cityOfCountry(st.setting.country) : null;
        if (home && cityCountry(a.city!) && cityCountry(a.city!) !== cityCountry(home)) a = { ...a, city: home };
        const r = price(a.question, a.item, a.trade, Number(a.quantity) || 1, a.city!, year);
        if ('error' in r) return r.error;
        const g = r.silver >= 10 ? Math.round(r.silver) : Math.round(r.silver * 100) / 100;
        // Under a tenth of a day, in hours of a 10-hour working day [ASSUMED day length].
        const days = r.labourDays == null ? '' : `; a building labourer earns that in ${r.labourDays >= 10 ? `${Math.round(r.labourDays)} days` : r.labourDays >= 0.1 ? `${Math.round(r.labourDays * 10) / 10} days` : `${Math.max(0.1, Math.round(r.labourDays * 100) / 10)} hours of a 10-hour day`}`;
        return `${r.what} in ${a.city}, ${year}: ${g} g of silver${coinsOf(r.silver, a.city!, year)}${days}${r.note ? ` (${r.note})` : ''}.`;
    }));

    tool('PlaceProfile', 'Decide how large, how urban, how violent and how deadly for infants a country or city is in a year, before narrating a crowd, a town\'s size, a murder rate or a child\'s survival. Returns population, urban share, murders per 100,000, infant deaths per 1,000 births and the nearest listed city.', {
        country: str('The country. Default: the setting\'s country.'),
        city: str('A city name, for its population'),
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
    }, [], a => run(st => {
        const year = a.year ?? storyYear(st);
        if (year == null) return NO_YEAR;
        const c = a.country ?? st.setting?.country, out: string[] = [];
        const f = (k: 'population' | 'urban' | 'homicide' | 'infant', fmt: (v: number) => string) => { const r = countryFact(k, c, year); if (r) out.push(fmt(r.v) + (r.year !== year ? ` (${r.year})` : '')); };
        f('population', v => `population ${Math.round(v * 1000).toLocaleString('en')}`);
        f('urban', v => `${Math.round(v * 100)} % in towns`);
        f('homicide', v => `${Math.round(v * 10) / 10} murders per 100,000`);
        f('infant', v => `${Math.round(v)} infant deaths per 1,000 births`);
        const cp = a.city ? cityPopulation(String(a.city), year) : null, pos = scenePosition(), near = cp ? null : pos ? cityNear(pos.lat, pos.lon, year) : null;
        if (cp) out.push(`${cp.name} (${cp.country}) ${Math.round(cp.pop).toLocaleString('en')} people`);
        else if (near) out.push(`nearest listed city ${near.name}, ${near.km} km, ${Math.round(near.pop).toLocaleString('en')} people`);
        return out.length ? `${c ?? a.city}, ${year}: ${out.join('; ')}.` : 'No figures for that place and year.';
    }));

    tool('NameCharacter', 'Give a first name to a character in an American setting whose name is still open, before naming them. Drawn by how many US babies of that sex got the name in their birth decade (1910–2029).', {
        who: str('Label of the character (e.g. "the waitress")'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth (story year minus age)' },
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const n = drawName(a.sex, Number(a.birth_year), rng);
        return n ? `${a.who}: first name ${n}.` : 'US name data cover births 1910–2029.';
    }));

    tool('BodySize', 'Decide the height and body mass of an adult character whose build the story leaves open, before describing them, from their country, sex and birth year; eye and hair colour too where the country has data (15 European and Central Asian countries). Records the mass for the body rules.', {
        who: str('The character'),
        country: str('Country the character grew up in (present-day name, e.g. United Kingdom, Nigeria, Japan). Default: the country of the last place given.'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
        species,
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const year = a.year ?? storyYear(st), country = a.country ?? st.setting?.country;
        if (year == null) return NO_YEAR;
        if (!country) return 'Give country: the scene\'s place is still open.';
        const shift = a.birth_year < H_YEARS[0] ? heightShift(country, a.birth_year, H_YEARS[0]) ?? 0 : 0;
        const r = bodySize(country, a.sex, a.birth_year, year, () => gauss(rng), shift);
        if ('error' in r) return r.error;
        if (r.notes.length) console.debug('[Rules engine]', a.who, r.notes.join('; '));
        const { p, error } = who(st, a.who, a.species);
        if (!p) return error;
        p.mass = Math.round(r.massKg); p.sex = a.sex; p.age ??= year - a.birth_year; p.bmiZ = r.bmiZ;
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
            if (!e) return `Give epidemic: ${EPIDEMIC_NAMES.join('; ')}.`;
            const share = e.low + (e.high - e.low) * rng(), n = Number(a.population) || 0;
            return `${a.epidemic}: it kills ${Math.round(share * 100)} % of the people of ${e.where}${n ? ` — ${Math.round(share * n)} of ${n} here` : ''} (recorded range ${Math.round(e.low * 100)}–${Math.round(e.high * 100)} %).`;
        }
        if (a.question === 'what a death among foragers or village farmers was from') {
            if (a.age == null) return 'Give age at death.';
            const c = deathCause(Number(a.age), rng);
            return `${a.who ?? 'The person'} died of ${c}.`;
        }
        if (!a.disease) return 'Give disease.';
        if (a.question === 'when symptoms start') {
            if (!INCUBATION[a.disease]) return `No incubation data for ${a.disease}. Diseases with data: ${Object.keys(INCUBATION).join(', ')}.`;
            const h = incubationHours(a.disease, () => gauss(rng)) ?? 0;
            const when = h < 48 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`;
            return `${a.who ?? 'The infected person'} shows the first symptoms of ${a.disease} ${when} after catching it.`;
        }
        if (!R0[a.disease]) return `No transmission data for ${a.disease}. Diseases with data: ${Object.keys(R0).join(', ')}.`;
        const sus = 1 - Math.min(1, Math.max(0, Number(a.immune_share) || 0)), z = attackShare(a.disease, sus);
        const n = Number(a.population) || 0;
        if (!z) return `No outbreak: too few people can still catch ${a.disease}; only scattered cases.`;
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
        if (year == null) return NO_YEAR;
        const share = attackWinShare(a.attackers, a.defenders, year, !!a.surprise);
        if (share == null) return `Battle covers engagements from ${BATTLE_YEARS[0]} to ${BATTLE_YEARS[1]} with both sides' numbers given; decide this one with BodyCheck.`;
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
    tool('Substance', 'Look up a single chemical compound before narrating what it does physically: whether it is solid, liquid or gas at the temperature, whether and how hot it burns, when its vapour catches fire, its fire limits in air. Measured values from handbooks; estimates from its structure when unmeasured. A mixture is given as parts by mass ("ethanol 40%, water 60%"); solid fuels by name with their water content.', {
        substance: str('Compound name in English (ethanol, octane, glycerol, carbon dioxide), a SMILES structure, a solid fuel (wood, peat, lignite, bituminous coal), or a mixture "name share%, name share%"'),
        temp_c: { type: 'number', description: 'Temperature it is at, °C (the scene\'s air temperature). Default 20.' },
        moisture_pct: { type: 'number', description: 'For a solid fuel (wood, peat, lignite, bituminous coal, refuse-derived fuel): water, % of its wet weight (fresh-cut wood about 50, seasoned 20)' },
        ash_pct: { type: 'number', description: 'For a solid fuel: ash, % of its dry weight' },
    }, ['substance'], async a => {
        await Promise.all([loadChem(), loadFuels()]);
        if (/%/.test(a.substance)) return describeMixture(a.substance, a.temp_c ?? 20);
        return describeFuel(a.substance, a.moisture_pct ?? 0, a.ash_pct ?? 0) ?? describeCompound(a.substance, a.temp_c ?? 20);
    });

    tool('Weather', 'Decide the day\'s weather at the story\'s place from the date and hour in [TIME], before describing it: rain, snow or dry, the amount, the day\'s high and low and the temperature now. The same date always gives the same weather.', {
        place: str('The town or city the scene is in or nearest to ("Lyon", "Kyoto", "Sydney, Australia"); for a fictional or remote place, the nearest real town or give latitude and longitude. Default: the last place given.'),
        latitude: { type: 'number', description: 'For a place outside the weather lists: latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, [], async a => {
        const s0 = store().state, k0 = s0.setting?.place && !a.place && a.latitude == null ? { key: s0.setting.place, label: s0.setting.label ?? '', lat: s0.latitude ?? null, lon: s0.longitude ?? null, country: s0.setting.country ?? null } : null;
        await prefetchWeather(k0 ?? findPlace(a.place, a.latitude, a.longitude), storyNow(s0));
        return run(st => {
        const known = st.setting?.place && !a.place && a.latitude == null ? { key: st.setting.place, label: st.setting.label ?? '', lat: st.latitude ?? null, lon: st.longitude ?? null, country: st.setting.country ?? null } : null;
        const place = known ?? findPlace(a.place, a.latitude, a.longitude);
        if (!place) return a.place ? `Give the nearest real town to "${a.place}", or latitude and longitude.` : 'Give place: the scene\'s place is still open.';
        const w = weatherAt(place.key, storyNow(st));
        if (!w) return 'Weather needs a calendar date (dd/mm/yyyy) and hour in [TIME].';
        setPlace(st, place);
        const { d, date } = w, r = (x: number) => Math.round(x);
        const amount = `${d.rainMm >= 10 ? r(d.rainMm) : Math.round(d.rainMm * 10) / 10} mm`;
        const o = w.observed, snowy = o ? o.snowCm > 0 : (d.tmaxC + d.tminC) / 2 <= 1.0;
        const sky = !d.wet ? 'dry' : snowy ? `snow, ${o ? `${Math.round(o.snowCm * 10) / 10} cm` : `${amount} of water`} over the day` : `rain, ${amount} over the day`;
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
        options: { type: 'array', items: { type: 'object', properties: { option: { type: 'string' }, share: { type: 'string', enum: SHARES } }, required: ['option', 'share'] }, description: 'Two or more options, each a different act, each with the share of people in this character\'s place who would take it' },
    }, ['who', 'options'], a => run((st, rng) => {
        const seen = new Set<string>(), opts = (a.options ?? []).filter(o => o?.option && !seen.has(o.option.toLowerCase().trim()) && seen.add(o.option.toLowerCase().trim()));
        if (opts.length < 2) return 'Give two or more options.';
        const w = opts.map(o => Math.max(0.01, shareOf(o.share))), total = w.reduce((x, y) => x + y, 0);
        let u = rng() * total, pick = opts[opts.length - 1];
        for (let i = 0; i < opts.length; i++) if ((u -= w[i]) < 0) { pick = opts[i]; break; }
        return `${a.who} chooses: ${pick.option}.`;
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
        if (a.cause && !['a natural force', 'unknown'].includes(a.cause.toLowerCase())) { const c = whoAny(st, a.cause); if (!c.p) return c.error; }
        const text = a.cause ? `${a.fact.replace(/[.!?]?$/, '')} (cause: ${a.cause})` : a.fact;
        const f = learn(st, text, a.known_by ?? [], !!a.common_knowledge, how ? Object.fromEntries((a.known_by ?? []).map(k => [k, how])) : {});
        if (a.secret && !a.common_knowledge) f.secret = true;
        if (a.kind === 'knowledge') f.kind = 'knowledge';
        if (a.importance != null) f.imp = Math.min(10, Math.max(1, Math.round(a.importance)));
        return `Fact ${f.id} recorded: ${f.text.replace(/[.!?]?$/, '.')} Known by ${f.everyone ? 'everyone' : f.knowers.join(', ') || 'no one yet'}.`;
    }));

    // A player's message is plain language: what it states about their character or the world becomes a fact only through
    // a draw, like an action ("say yes or roll the dice", Baker 2004, Dogs in the Vineyard). The chance combines the setting's
    // base share with the estimate for this story, as BodyCheck does; the result is recorded either way, so it stays.
    tool('Claim', 'Decide whether something a player\'s message states about their own character holds, when it is new to the story: what the character is, an item they have, an ability of body or skill, something that happened to them before, something outside their control happening to them now (a slip, a faint, a cramp). Permission comes from the people who give it (SocialResponse or Choose); what a place allows comes from the scene and the world\'s facts. Returns whether it holds; either way it is recorded and stays.', {
        who: str('The player\'s character making the claim'),
        claim: str('The claim, one short sentence ("Mary is a cat", "Mary has a pistol in her coat", "the cellar door is unlocked")'),
        kind: { type: 'string', enum: ['what the character is', 'something the character has', 'something the character can do', 'something that happened before', 'something happening to the character now', 'something the character knows', 'something the character chooses to do now'] },
        trait: { type: 'string', enum: TRAITS, description: 'For "something the character chooses to do now": the personality trait the act expresses (shouting, partying: extraversion; insulting, fighting: agreeableness, low pole; slacking off: conscientiousness, low pole; panicking, crying: emotional stability, low pole; reading, questioning: intellect)' },
        trait_level: { type: 'string', enum: LEVELS, description: 'The character\'s place on that trait among people, when the story has shown it ("hard-working": conscientiousness high). Default: code draws it once and keeps it.' },
        act_pole: { type: 'string', enum: POLES, description: 'With trait: whether the act shows much of the trait or little of it' },
        act_strength: { type: 'string', enum: STRENGTHS, description: 'With trait: mild (a raised voice) or strong (screaming)' },
        behaviour: { type: 'string', enum: BEHAVIOURS, description: 'With trait, when one fits: the act as one of these' },
        situation: { type: 'string', enum: SETTINGS, description: 'With behaviour, when one fits: the setting as one of these' },
        in_world: { type: 'boolean', description: 'The kind of thing claimed exists in this world: real history for the date, plus [WORLD] (orcs in a world whose book has orcs; a revolver after 1836). False: the claim fails.' },
        species: str('For "what the character is": the DF creature claimed (cat, dragon, horse), when it is a creature'),
        item: str('For "something the character has": the item, a few words ("revolver", "12 shillings" as item "shilling" with the count in the claim)'),
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
        reference_class: str('The wider class this claim belongs to (e.g. "travellers in 1850 England carrying a pistol")'),
        base_share: { type: 'string', enum: SHARES, description: 'How often claims of that class hold in this kind of setting.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this claim given everything the story has established so far.' },
        path: { type: 'array', maxItems: 6, items: { type: 'object', properties: { step: str('One event the claim needs, in the order it would happen'), reference_class: str('The cases this step belongs to, given the steps before it'), base_share: { type: 'string', enum: SHARES }, share: { type: 'string', enum: SHARES } }, required: ['step', 'reference_class', 'base_share', 'share'] },
            description: 'For a claim whose base share is "almost no one": the events it needs, in order, each given the ones before (arrive in the country, reach the place, stay there). Required then.' },
    }, ['who', 'claim', 'kind', 'in_world', 'base_share', 'share'], a => run((st, rng) => {
        if (a.kind === 'something the character has') account(st, a.who);
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
        if (a.species && a.kind === 'what the character is' && !sp) return noSpecies(a.species);
        const claim = a.claim.replace(/[.!?]?$/, '.');
        // Knowledge the story has recorded comes only from where it was learned: a fact on record that this character is not
        // among the knowers of (another's secret, an event elsewhere) cannot be claimed; they learn it on the page.
        if (a.kind === 'something the character knows') {
            const f = recordedFact(st, a.claim);
            if (f && !f.everyone && !f.knowers.some(k => k.toLowerCase() === a.who.toLowerCase()))
                return `${a.claim}: false; ${a.who} is still unaware of this${f.secret ? ' (another\'s secret)' : ''}. They learn it on the page: seen, overheard, told or worked out. State unchanged.`;
            // Forgotten by now: adults recalled no more with cues and questions than unprompted (Bauer & Larkina 2016), so a
            // claim to remember it does not bring it back; seeing, hearing or being told it again does.
            if (f && !recalls(st, f, a.who)) return `${a.claim}: false; ${a.who} has forgotten it. Being reminded on the page (told, seeing it again) brings it back. State unchanged.`;
            if (f) return `${a.claim}: holds; ${a.who} already knows it. Recorded.`;
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
        if (skill) a = { ...a, base_share: Math.max(0.001, skill.share) as unknown as string };
        const faith = a.kind === 'what the character is' && a.faith ? faithShare(a.faith, st.setting?.country, y) : null;
        if (faith) a = { ...a, base_share: Math.max(0.001, faith.share) as unknown as string };
        const sex = st.people?.[a.who]?.sex ?? a.person_sex, age = Number(a.age ?? st.people?.[a.who]?.age);
        const single = a.kind === 'what the character is' && a.marital && Number.isFinite(age) ? neverMarriedShare(st.setting?.country, sex, age, y) : null;
        if (single) a = { ...a, base_share: Math.max(0.001, a.marital === 'never married' ? single.share : 1 - single.share) as unknown as string };
        const lives = a.lived_to != null ? survival(st.setting?.country, a.person_sex, y, Number(a.alive_at) || 0, Number(a.lived_to)) : null;
        if (lives) a = { ...a, base_share: Math.max(0.001, lives.share) as unknown as string };
        const speaks = a.kind === 'something the character can do' && a.language ? speakShare(a.language, st.setting?.country, y) : null;
        if (speaks) a = { ...a, base_share: Math.max(0.001, speaks.share) as unknown as string };
        // An act done before: the measured share of people of the character's sex who had ever done it (Buss 1981), moved by
        // their place on the matching trait (acts.ts).
        let past: { share: number; act: string } | null = null;
        if (a.kind === 'something that happened before' && a.past_act) {
            const m = matchPastAct(a.past_act), tr = m ? pastActTrait(m.category) : null;
            if (m && tr) {
                const prof = ((st.traits ??= {})[a.who] ??= {});
                if (a.trait === tr && a.trait_level) prof[tr] = levelZ(a.trait_level);
                prof[tr] ??= Math.max(-2.5, Math.min(2.5, gauss(rng)));
                past = { share: pastActShare(sex === 'female' ? m.women : m.men, prof[tr], m.category), act: m.act };
                a = { ...a, base_share: Math.max(0.001, past.share) as unknown as string };
            }
        }
        // An act of the character's own choosing: the share of their hours spent in states at the act's level (Fleeson 2001),
        // scaled by how fitting the act is in the setting against its average fit (Price & Bouffard 1974) [scaling ASSUMED].
        let act: { share: number; z: number; rating: number | null } | null = null;
        if (a.kind === 'something the character chooses to do now' && a.trait) {
            const prof = ((st.traits ??= {})[a.who] ??= {});
            if (a.trait_level) prof[a.trait] = levelZ(a.trait_level);
            prof[a.trait] ??= Math.max(-2.5, Math.min(2.5, gauss(rng)));
            const z = prof[a.trait], set = settingRatio(a.behaviour, a.situation);
            act = { share: Math.min(0.99, stateShare(a.trait as Trait, z, (a.act_pole ?? POLES[0]) as typeof POLES[number], (a.act_strength ?? 'mild') as typeof STRENGTHS[number]) * set.ratio), z, rating: set.rating };
            a = { ...a, base_share: Math.max(0.001, act.share) as unknown as string };
        }
        const rare = shareOf(a.base_share) <= 0.05 || !!far || !!absent || !!foreign;
        if ((far || absent || foreign) && shareOf(a.base_share) > 0.05) a = { ...a, base_share: '5% almost no one' };
        const path = (a.path ?? []).filter(x => x?.step);
        if (rare && path.length < 2) return `A claim this rare needs its path${far ? ` (${far.what} live ${far.km} km away, outside the scene)` : ''}${absent ? ` (${a.item} comes into use in ${absent.country} later${absent.first ? `: first recorded ${absent.first}` : ''})` : ''}${foreign ? ` (${a.language}: its speakers live outside ${st.setting?.country})` : ''}${faith ? ` (${Math.round(faith.share * 1000) / 10} % of people in ${faith.country}, ${faith.year}, are ${a.faith})` : ''}${lives ? ` (${Math.round(lives.share * 1000) / 10} % live from ${Number(a.alive_at) || 0} to ${a.lived_to}, ${lives.country} life table ${lives.years})` : ''}${speaks ? ` (${Math.round(speaks.share * 1000) / 10} % of people in ${speaks.country} speak ${a.language})` : ''}${skill ? ` (${Math.round(skill.share * 1000) / 10} % of people in ${skill.country}${skill.from ? `, ${skill.from} figure` : ''})` : ''}${past ? ` (${Math.round(past.share * 1000) / 10} % of people like ${a.who} have ever done this: "${past.act}")` : ''}${act ? ` (someone at ${a.who}'s level of ${a.trait} acts this way in ${Math.round(act.share * 1000) / 10} % of moments${act.rating !== null ? `; ${a.behaviour} rated ${act.rating} of 9 for fit ${a.situation === 'own room' ? 'in one\'s own room' : `at ${a.situation}`}` : ''}; each step that makes it fit raises the chance)` : ''}: two or more steps, in order, each with its reference class and shares given the steps before.`;
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
            if (a.kind === 'something the character has' && a.item) give(st, a.who, a.item, Math.max(1, Math.round(a.quantity ?? 1)));
            return `${a.claim}: holds, by this path: ${path.map(x => x.step).join('; ')}. Recorded.`;
        }
        const holds = rng() < combined(a);
        if (!holds) {
            learn(st, `Not so: ${claim}`, [a.who], false, { [a.who]: 'found out' });
            return `${a.claim}: false. ${a.who} acts on it and meets the world as it is; narrate that.`;
        }
        if (sp) {
            const p = st.people?.[a.who];
            if (p?.wounds.length) return `${a.who} has wounds on record; a change of body comes through the story (a spell, a transformation), and Claim covers what already holds. State unchanged.`;
            if (p) delete st.people![a.who];
            person(st, a.who, undefined, sp);
        }
        learn(st, claim, [a.who], false, { [a.who]: 'their own' });
        if (a.kind === 'something the character has' && a.item) give(st, a.who, a.item, Math.max(1, Math.round(a.quantity ?? 1)));
        if (a.kind === 'something the character can do' && a.language) {
            const p = whoAny(st, a.who).p;
            if (p && !p.languages?.includes(a.language.trim().toLowerCase())) p.languages = [...p.languages ?? [], a.language.trim().toLowerCase()];
        }
        return `${a.claim}: holds. Recorded.`;
    }));

    tool('Transfer', 'Record an item changing hands, entering or leaving the story, once the story has it happen: given, sold, bought, lent, returned, stolen, taken by force, found, made, lost, used up, dropped. Whether it happens comes first from the tool that decides how (SocialResponse or Choose for an agreement, Look for a theft that may be seen, HoldOn or BodyStrike for a struggle, Price for what it costs). Returns the new holder and, when it differs, the owner; [HAS] then shows both.', {
        item: str('The item, a few words, singular ("revolver", "shilling", "loaf of bread")'),
        quantity: { type: 'number', description: 'How many. Default 1.' },
        from: str('Who had it. Default: the world (found, made, bought from someone untracked)'),
        to: str('Who or where has it now: a person, or a place when it is left there ("the west hall window"), so it can be found later. Default: out of the story (used up, sold away)'),
        how: { type: 'string', enum: HOW },
    }, ['item', 'how'], a => run(st => {
        const own = inalienable(st, a.item);
        if (own) return `State unchanged: ${own}.`;
        const late = cannotExist(a.item, storyYear(st), CURRENT_BOOK, 'thing');
        return late ? `State unchanged: ${late}.` : transfer(st, a);
    }));

    // The data give the share of students who solve such a problem in the time; the estimate for this character is
    // combined with it in log-odds, as BodyCheck combines a base share, and the body state applies (alertness).
    tool('WorkOut', 'Decide whether a character works something out in the time they have, before narrating it: a riddle, a trick, a code, a link between clues, a sum, a plan.', {
        who: str('Character thinking'),
        problem: str('The problem in a few words'),
        kind: { type: 'string', enum: PROBLEMS },
        seconds: { type: 'number', description: 'Time they have to work it out, s (a glance 2, a moment 10, a minute 60, a long look 240)' },
        share: { type: 'string', enum: SHARES, description: 'How this character compares with university students at such problems: the share of students they would do better than.' },
        reveals: str('The fact working it out would teach, one short sentence (who the thief is, where the key is); learned only on success'),
    }, ['who', 'problem', 'kind', 'seconds', 'share'], a => run((st, rng) => {
        const w = whoAny(st, a.who);
        if (!w.p) return w.error;
        const base = solveShare(a.kind, a.seconds);
        // A character better than a share s of students: base odds shifted by the odds of s (0.5 = the students' own rate)
        // [ASSUMED: a percentile read as a log-odds shift].
        const z = Math.log(base / (1 - base)) + logit(clamp01(shareOf(a.share)));
        const chance = 1 / (1 + Math.exp(-z));
        // timed: a cooled core slows this kind of thinking (complex tasks fell after 2–4 °C of cooling, simple ones held: Giesbrecht
        // et al. 1993, Aviat Space Environ Med 64:206).
        const out = check(w.p, { task: `work out ${a.problem}`, share: chance, uses: ['alertness'], timed: true, override: true }, rng);
        return a.reveals && /SUCCESS/.test(out) ? `${out} ${a.who} now knows: ${learnt(st, a.reveals, a.who, KNOWN_HOW[2])}` : out;
    }));

    tool('Sickness', 'Decide whether a character vomits or feels sick in a situation with published rates, before narrating it: a sea crossing, or waking after surgery under general anaesthesia. Spoiled food goes to Disease.', {
        who: str('Character'),
        situation: { type: 'string', enum: SICK_SITUATIONS },
        sex: { type: 'string', enum: ['male', 'female'] },
        age: { type: 'number', description: 'Age in years' },
        motion_sickness_before: { type: 'boolean', description: 'After surgery: has been seasick, carsick or sick after an operation before' },
        smoker: { type: 'boolean', description: 'After surgery: smokes' },
        opioids: { type: 'boolean', description: 'After surgery: given opium, morphine or another opioid for the pain' },
    }, ['who', 'situation'], a => run((_st, rng) => sickness(a.who, a, rng)));

    tool('Listen', 'Decide whether a character hears a sound (a shot, footsteps, hoofbeats, an engine) before narrating whether they react. Code decides from loudness, distance, background noise, walls and the listener\'s hearing.', {
        listener: str('Character who might hear it'),
        listener_species: str('Listener\'s DF creature when the engine has no record of them yet.'),
        sound: { type: 'string', enum: Object.keys(SOUNDS) },
        spl_db: { type: 'number', description: 'Loudness at 1 m, dB SPL, for a sound outside the classes in the list (from a published measurement)' },
        distance_m: { type: 'number', description: 'Distance from the sound, m' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between. Default none.' },
        tone_hz: { type: 'number', description: 'For a tonal sound (a bell, a whistle, a horn): its pitch, Hz (a church bell 300–600, a whistle 2000–3000)' },
        ...WAY_PROPS,
        reveals: str('The fact hearing it would teach, one short sentence (a secret overheard, who is coming); learned only if heard'),
    }, ['listener', 'distance_m', 'sound'], a => run(st => {
        const l = who(st, a.listener, a.listener_species);
        if (!l.p) return l.error;
        const out = listen(a.listener, l.p, { way: wayFor(st, l.p, a, !a.barrier || a.barrier === 'none'), sound: a.sound, spl_db: a.spl_db ?? null, distance: a.distance_m, noise: a.noise ?? 'quiet room (25 dB)', barrier: a.barrier ?? 'none' });
        return / hears it /.test(out) && a.reveals ? `${out} ${a.listener} now knows: ${learnt(st, a.reveals, a.listener, KNOWN_HOW[1])}` : out;
    }));

    tool('Look', 'Decide whether a character sees something at a distance (a person, an animal, a vehicle) before narrating it. Code rolls notice / recognize / identify from size, distance, light and visibility.', {
        viewer: str('Character who might see it'),
        viewer_species: str('Viewer\'s DF creature when the engine has no record of them yet.'),
        target: str('What might be seen, a few words'),
        size_m: { type: 'number', description: 'Smallest visible dimension of the target, m (standing person 0.5, horse 0.6, wagon or car 1.5)' },
        distance_m: { type: 'number', description: 'Distance, m; Layout gives it when viewer and target_who are both placed' },
        light: { type: 'string', enum: ['overcast day', 'dim street or public lighting', 'living room', 'office'], description: 'Set for an overcast sky or artificial light; code takes daylight, twilight, moonlight and starlight from the date, hour and latitude.' },
        latitude: { type: 'number', description: 'Latitude of the place, degrees (north +, south −), when the story moves to a new region. Kept for later calls.' },
        visibility_m: { type: 'number', description: 'Meteorological visibility, m (clear air 20000; haze 5000; mist 2000; fog 500; thick fog 50)' },
        reveals: str('The fact seeing it would teach, one short sentence (who it is, what they are doing); learned only if identified'),
        target_who: str('When the target is a tracked character: their name (distance and walls then come from the map)'),
    }, ['viewer', 'size_m'], a => run((st, rng) => {
        const v = who(st, a.viewer, a.viewer_species);
        if (!v.p) return v.error;
        const tp = a.target_who ? st.people?.[a.target_who] : undefined, geo = tp ? between(st, v.p, tp) : null;
        if (geo && geo.ra && geo.rb && geo.ra !== geo.rb && !geo.open) return `A wall stands between ${a.viewer} and ${a.target}: ${geo.ra} and ${geo.rb}, every doorway shut.`;
        const dist = a.distance_m ?? geo?.d ?? null;
        if (dist == null) return 'Give distance_m (or place both on the map with Layout and give target_who). State unchanged.';
        if (Number.isFinite(a.latitude)) st.latitude = a.latitude;
        // Story dates (dd/mm/yyyy) parse to minutes from year 1; a bare "Day N" count stays below 146 097 days (400 years) [ASSUMED].
        const t = storyNow(st);
        const sky = !a.light && t !== null && t / 1440 > 146097 && st.latitude != null && Number.isFinite(st.latitude) ? skyLight(t, st.latitude) : null;
        const out = look(a.viewer, v.p, { size_m: a.size_m, distance_m: dist, light: sky?.lux ?? a.light ?? 'daylight', lightLabel: sky?.label ?? null, visibility_m: a.visibility_m ?? 20000 }, rng);
        return / identifies it /.test(out) && a.reveals ? `${out} ${a.viewer} now knows: ${learnt(st, a.reveals, a.viewer, KNOWN_HOW[0])}` : out;
    }));

    // One tool for a person's social response, the situation as an enum (as RPG-MCP consolidated 195 tools into 36 with action
    // enums; function-calling accuracy drops as the number of functions grows, Patil et al. 2025, BFCL).
    tool('SocialResponse', 'Decide how a person responds in a social situation whose outcome is in doubt, before narrating it: whether they take a statement for a lie, step in to help in an emergency, carry out an order to hurt someone, grant a stranger a small favour (something unpaid and outside their work: a sale, a served drink or a paid service is their trade and goes ahead), obey an order from a stranger acting outside their office, let a stranger go first (a turn, a place in line, a machine), or want to see someone again after a first meeting, refuse an unfair split, or punish someone who cheated the group.', {
        situation: { type: 'string', enum: SOCIAL },
        who: str('The person whose response is decided'),
        speaker: str('For a statement: who made it'),
        is_lie: { type: 'boolean', description: 'For a statement: whether it is in fact a lie (known from the story)' },
        statement: str('For a statement: the statement in a few words'),
        evidence: { type: 'string', enum: EVIDENCE, description: 'For a statement: evidence the listener holds that bears on it, and when they show it. Default none.' },
        others: { type: 'number', description: 'For an emergency: how many other people the person believes also witness it' },
        emergency: { type: 'string', enum: SITUATIONS, description: 'For an emergency. Default victim in danger.' },
        order: { type: 'string', enum: Object.keys(OBEY), description: 'For an order to hurt someone: its circumstances' },
        offer_share: { type: 'number', description: 'For an offered split: the share of the whole offered to them, 0–1' },
        request: str('For a favour: the request in a few words'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'For a first meeting: sex of the person whose interest is decided' },
        many_options: { type: 'boolean', description: 'For a first meeting: they meet many prospective partners at once (15 or more)' },
        requester: { type: 'string', enum: REQUESTERS, description: 'For a favour, an order or asking to go first: how the stranger asking is dressed. Default ordinary clothes.' },
        order_kind: { type: 'string', enum: ORDERS, description: 'For a stranger\'s order: what it asks' },
        request_size: { type: 'string', enum: GIVE_WAY_SIZES, description: 'For a stranger asking to go first: how long they need, against the person\'s own task' },
        reason: { type: 'string', enum: GIVE_WAY_REASONS, description: 'For a stranger asking to go first: the reason they give' },
    }, ['situation', 'who'], a => run((st, rng) => {
        // A response needs the words: when this turn's message to them reached them as a voice only, they answer the voice.
        if (/favour|statement|order|first|go first/.test(a.situation ?? '')) {
            const lost = Object.entries(decisions()).find(([key, out]) => { const p = key.split('|'); return p[0] === 'communicate' && p[2] === norm(a.who) && (!a.speaker || p[1] === norm(a.speaker)) && /words are lost|voice is lost|scattered words/.test(out); });
            if (lost) return `${a.who} answers the voice only: the words of the request were lost (${lost[1].replace(/\.$/, '')}). The request waits for a message that gets through.`;
        }
        switch (a.situation) {
            case SOCIAL[0]: {
                const l = who(st, a.who), s = who(st, a.speaker);
                const r = judgeStatement(!!a.is_lie, rng, { speaker: (s.p ?? null) as SocialTraits | null, listener: (l.p ?? null) as SocialTraits | null, evidence: a.evidence ?? 'none' });
                const from = !a.evidence || a.evidence === 'none' ? `from ${a.speaker ?? 'the speaker'}'s manner alone: no proof either way` : `weighing what ${a.speaker ?? 'the speaker'} says against the evidence`;
                return `${a.who} ${r.judgedLie ? 'judges it a lie' : 'believes it'}, ${from}.`;
            }
            case SOCIAL[1]: {
                const n = Number(a.others) || 0, p = helpChance(n, a.emergency ?? 'victim in danger');
                return `${a.who} ${rng() < p ? 'steps in to help' : 'stays out of it'} (${n > 0 ? `with ${n} other${n > 1 ? 's' : ''} watching` : 'alone with it'}).`;
            }
            case SOCIAL[2]: {
                const p = a.order ? obeyShare(a.order, storyYear(st)) : null;
                if (p === null) return `Give order, one of: ${Object.keys(OBEY).join('; ')}.`;
                return `${a.who} ${rng() < p ? 'carries the order out to the end' : 'refuses before the end'} (${a.order}).`;
            }
            case SOCIAL[3]: return `${a.who} ${rng() < asRequester(SMALL_REQUEST_YES, a.requester) ? 'agrees' : 'declines'}${a.request ? ` (${a.request})` : ''}.`;
            case SOCIAL[4]: {
                if (!a.sex) return 'Give sex for a first meeting.';
                const pr = interestChance(a.sex, !!a.many_options);
                return `${a.who} ${rng() < pr ? 'is interested and would meet again' : 'leaves it at this meeting'}${a.many_options ? ' (one of many suitors met at once)' : ''}.`;
            }
            case SOCIAL[5]: {
                const p = orderChance(a.order_kind ?? '');
                if (p === null) return `Give order_kind (${ORDERS.join('; ')}).`;
                return `${a.who} ${rng() < asRequester(p, a.requester) ? 'obeys' : 'refuses'} (${a.order_kind}; the one ordering wears ${a.requester ?? REQUESTERS[0]}).`;
            }
            case SOCIAL[6]: {
                const p = giveWayChance(a.request_size ?? '', a.reason ?? '');
                if (p === null) return `Give request_size (${GIVE_WAY_SIZES.join('; ')}) and reason (${GIVE_WAY_REASONS.join('; ')}).`;
                return `${a.who} ${rng() < asRequester(p, a.requester) ? 'lets them go first' : 'declines'} (${a.request_size}; ${a.reason}).`;
            }
            case SOCIAL[7]: {
                const sh = Number(a.offer_share);
                if (!(sh >= 0 && sh <= 1)) return 'Give offer_share: the part offered to them, 0–1.';
                return `${a.who} ${rng() < (sh <= 0.2 ? REFUSE_SPLIT.low : REFUSE_SPLIT.other) ? 'refuses the split, so neither gets anything' : 'accepts the split'}.`;
            }
            case SOCIAL[8]: return `${a.who} ${rng() < PUNISH_ONCE ? 'punishes the cheater, at a cost to themselves' : 'lets it pass this time'}.`;
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
            case 'betrayed them': st.trust[k] = { lied: false, repair: TRUST_REPAIR[0], kept: 0 }; return `Recorded: ${a.other} betrayed ${a.who}.`;
            case 'betrayed them with lies or false promises': st.trust[k] = { lied: true, repair: TRUST_REPAIR[0], kept: 0 }; return `Recorded: ${a.other} betrayed ${a.who} with lies.`;
            case 'promised to change': case 'promised to change and apologized':
                if (!t) return `No betrayal of ${a.who} by ${a.other} on record.`;
                t.repair = a.event === 'promised to change' ? TRUST_REPAIR[1] : TRUST_REPAIR[2]; return `Recorded: ${a.other} ${a.event}.`;
            case 'kept faith once': if (!t) return `The record holds zero betrayals by ${a.other}.`; t.kept++; return `Recorded: ${a.other} kept faith (${t.kept} time${t.kept > 1 ? 's' : ''} since the betrayal).`;
            default: {
                if (!t) return `No betrayal of ${a.who} by ${a.other} on record: decide trust between them with SocialResponse or Choose.`;
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
        if (!p) return error;
        if (a.region) p.region = a.region;
        return holdLoad(a.who, p, { load_kg: a.load_kg, hands: a.hands ?? 2, hanging: !!a.hanging, seconds: a.seconds ?? null, fingertips: !!a.fingertips, climber: a.climber ?? 'no' }, rng);
    }));

    tool('Chase', 'Decide whether a pursuer catches someone running away over open ground, from their top speeds (each human\'s drawn once from untrained adults of their sex, scaled by age; other creatures from their species) and leg injuries.', {
        pursuer: str('Character chasing'), pursuer_species: str('Pursuer\'s DF creature when the engine has no record of them yet.'),
        fleeing: str('Character running away'), fleeing_species: str('Fleeing character\'s DF creature when the engine has no record of them yet.'),
        gap_m: { type: 'number', description: 'Head start, m' },
        pursuer_sex: { type: 'string', enum: ['male', 'female'], description: 'For a human pursuer missing from the engine\'s records' },
        fleeing_sex: { type: 'string', enum: ['male', 'female'], description: 'For a human fleeing, missing from the engine\'s records' },
        pursuer_build: { type: 'string', enum: Object.keys(BUILDS), description: 'The pursuer\'s build, when the story states it (BodySize draws it otherwise)' },
        fleeing_build: { type: 'string', enum: Object.keys(BUILDS), description: 'The fleeing character\'s build, when the story states it (BodySize draws it otherwise)' },
        pursuer_age: { type: 'number', description: 'For a human pursuer missing from the engine\'s records, years' },
        fleeing_age: { type: 'number', description: 'For a human fleeing, missing from the engine\'s records, years' },
    }, ['pursuer', 'fleeing', 'gap_m'], a => run((st, rng) => {
        const p = who(st, a.pursuer, a.pursuer_species), f = who(st, a.fleeing, a.fleeing_species);
        if (!p.p || !f.p) return p.error || f.error;
        if (a.pursuer_sex) p.p.sex ??= a.pursuer_sex;
        if (a.fleeing_sex) f.p.sex ??= a.fleeing_sex;
        if (Number.isFinite(a.pursuer_age)) p.p.age ??= a.pursuer_age;
        if (Number.isFinite(a.fleeing_age)) f.p.age ??= a.fleeing_age;
        for (const [q, b] of [[p.p, a.pursuer_build], [f.p, a.fleeing_build]] as const) if (b && q.bmiZ == null) q.bmiZ = bmiZOf(BUILDS[b], q.sex, st.setting?.country, storyYear(st));
        return chase(a.pursuer, p.p, a.fleeing, f.p, a.gap_m, rng);
    }));

    tool('NewCharacter', 'Decide the sex, age, occupation and birthplace of a character new to the story (a stranger, a passer-by, the person behind the counter), before describing them. Drawn from the 1881 census of England and Wales there; elsewhere age and sex from the country\'s population in the story year.', {
        who: str('Name or label for the character (e.g. "the innkeeper", "stranger 2")'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'Only when the story already fixes it' },
        occupation: str('Only when the story already fixes it, in a word or two (innkeeper, carter, blacksmith, servant)'),
        min_age: { type: 'number', description: 'Only when the story already fixes it (e.g. 18 for someone serving drinks)' },
        age: { type: 'number', description: 'Only when the story states it ("her brother Will, 12")' },
    }, ['who'], a => run((st, rng) => {
        // A person already drawn keeps what was drawn (an innkeeper drawn at 56 was drawn again at 68 two turns later).
        { const known = st.people?.[String(a.who)] as { age?: number; sex?: string } | undefined;
          if (known?.age != null && typeof a.age !== 'number') return `${a.who}: a ${known.age}-year-old ${known.age < 18 ? (known.sex === 'female' ? 'girl' : 'boy') : known.sex === 'female' ? 'woman' : 'man'}, as drawn when first met.`; }
        // A person the story describes (the cast's "her brother Will, 12") keeps the stated age and sex; nothing is drawn.
        if (typeof a.age === 'number' && a.age >= 0) {
            const { p } = who(st, a.who), age = Math.round(a.age), sex = a.sex ?? null;
            if (p) Object.assign(p, { age, ...sex ? { sex } : {} });
            const noun = !sex ? (age < 18 ? 'child' : 'adult') : age < 18 ? (sex === 'female' ? 'girl' : 'boy') : sex === 'female' ? 'woman' : 'man';
            return `${a.who}: a ${age}-year-old ${noun}${a.occupation ? `; occupation: ${a.occupation}` : ''} (as the story states).`;
        }
        // Outside England and Wales around 1881 (±40 years [ASSUMED]) the census does not describe the people: age and sex
        // come from the country's stable population (population.ts); occupation and birthplace are left to the story.
        // An "occupation" that describes the person instead of naming a trade ("man standing at the lit window") is dropped.
        if (a.occupation && (String(a.occupation).trim().split(/\s+/).length > 3 || /^(?:the |a |an )?(person|man|woman|boy|girl|figure|someone|stranger)\b/i.test(String(a.occupation)))) a = { ...a, occupation: undefined };
        // A role noun as the name ("the costermonger") is the occupation when none is given: a costermonger was drawn as a child.
        // A crowd is a place's people (PlaceProfile), one person at a time here; "man" and "woman" in the name fix sex and adulthood.
        // A group named as one ("the whispering men", "the men by the fire") is several people: each gets their own call.
        if (/\b(crowd|passers-by|passersby|people|folk|street|everyone|townsfolk|villagers|men|women|children|boys|girls|couple|pair|both|twins)\b/i.test(String(a.who))) return `NewCharacter draws one person; the people of a place come from PlaceProfile, and each one who acts gets their own NewCharacter. State unchanged.`;
        const adult = /\b(man|men|fellow|gentleman|woman|lady)\b/i.exec(String(a.who))?.[1]?.toLowerCase();
        if (adult) a = { ...a, sex: a.sex ?? (/woman|lady/.test(adult) ? 'female' : 'male'), min_age: Math.max(18, Number(a.min_age) || 0) };
        const young = /\b(girl|boy|maid|lad|lass)\b/i.exec(String(a.who))?.[1]?.toLowerCase();
        if (young && !a.sex) a = { ...a, sex: /girl|maid|lass/.test(young) ? 'female' : 'male' };
        if (!a.occupation) { const role = /^(?:the |an? )?([a-z][a-z-]*(?: [a-z][a-z-]*)?)$/.exec(String(a.who).trim())?.[1]; if (role && !/^(person|man|woman|boy|girl|child|stranger|figure|someone|somebody|other|men|women)\b/.test(role)) a = { ...a, occupation: role }; }
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
                if (p) Object.assign(p, { age: r.age, sex: r.sex });
                const noun = r.age < 18 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
                return `${a.who}: a ${r.age}-year-old ${noun}; occupation: ${a.occupation} (age and sex drawn from the 1881 census of England and Wales among its ${r.occupation}, the nearest table held for ${c} ${y ?? ''}; birthplace as the story sets it).`;
            }
        }
        let local = english ? null : strangerAgeSex(c, y, rng, { sex: a.sex ?? null, minAge: Number(a.min_age) || 0 });
        if (local && a.occupation) for (let i = 0; i < 50 && local; i++) {
            const w = strangerWork(c, local.sex, local.age, y, rng);
            if (w ? w.works : local.age >= 15) break;
            local = strangerAgeSex(c, y, rng, { sex: a.sex ?? null, minAge: Number(a.min_age) || 0 });
        }
        if (local) {
            const { p } = who(st, a.who);
            if (p) Object.assign(p, { age: local.age, sex: local.sex });
            const noun = local.age < 18 ? (local.sex === 'female' ? 'girl' : 'boy') : local.sex === 'female' ? 'woman' : 'man';
            const work = a.occupation ? null : strangerWork(c, local.sex, local.age, y, rng);
            const job = a.occupation ? `; occupation: ${a.occupation}` : local.age < 15 ? '; a child' : !work ? '' : !work.works ? '; outside paid work' : work.group ? `; works, among ${work.group} (the narrator names the job)` : '; works';
            const hh = strangerHousehold(c, y, local.age, rng);
            const home = hh ? hh.size === 1 ? '; lives alone' : `; lives in a household of ${hh.size} (${hh.type})` : '';
            return `${a.who}: a ${local.age}-year-old ${noun}${job}${home} (age and sex as drawn from ${local.country}'s population in ${y}${work ? `; work from ILO figures for ${work.country}, ${work.year}` : ''}${hh ? `; household from ${hh.source} ${hh.year}` : ''}; birthplace as the story sets it).`;
        }
        // A country the population tables do not reach (Brazil 1822) takes age and sex from the 1881 census of England and
        // Wales, the nearest table held, with occupation and birthplace as the story sets them: the English census's jobs
        // ("Railway Guard" for a Rio guard in 1822) belong to England in 1881.
        // Elsewhere, the census's people of that occupation still give its sex and age (guards are men of working age); the
        // job's name stays the story's.
        let r = drawPerson({ sex: a.sex ?? null, occupation: a.occupation ?? null, minAge: Number(a.min_age) || 0 }, rng);
        if ('error' in r && !english) r = drawPerson({ sex: a.sex ?? null, occupation: null, minAge: a.occupation ? Math.max(15, Number(a.min_age) || 0) : Number(a.min_age) || 0 }, rng);
        if ('error' in r) return r.error;
        const { p } = who(st, a.who);
        if (p) Object.assign(p, { age: r.age, sex: r.sex });
        const noun = r.age < 18 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
        if (!english) return `${a.who}: a ${r.age}-year-old ${noun}${a.occupation ? `; occupation: ${a.occupation}` : ''} (age and sex drawn from the 1881 census of England and Wales${a.occupation ? ', among its people of that occupation' : ''}, the nearest table held for ${c} ${y ?? ''}; birthplace as the story sets it).`;
        return `${a.who}: a ${r.age}-year-old ${noun}; ${r.occupation ? `occupation: ${r.occupation}` : r.age < 15 ? 'a child' : 'occupation unlisted in the census'}; born in ${r.born}.`;
    }));

    tool('BodyCheck', 'Resolve a physical or skilled action whose outcome is in doubt, before narrating it: climbing, jumping, swimming, lifting or forcing something, balancing, sneaking, picking a lock, riding, a craft or a trade task (the other tools cover blows, falls, holds, chases, hearing, seeing, messages and people\'s responses). The body state in [BODY] is applied in code.', {
        who: str('Character acting'),
        species,
        height_m: { type: 'number', description: 'For a climb: its height, m; a failure is then a fall from where the grip went' },
        task: str('The task in a few words. A real second attempt names it ("pick lock, 2nd try"); the same task again this turn returns the first result.'),
        reference_class: str('The wider class of attempts this one belongs to (e.g. "amateurs picking an old door lock")'),
        base_share: { type: 'string', enum: SHARES, description: 'How many attempts in that reference class succeed.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this attempt: how many people with this character\'s training succeed at it in these conditions, unhurt.' },
        uses: { type: 'array', items: { type: 'string', enum: [...Object.keys(FUNCTIONS), 'alertness'] }, description: 'Body abilities the task depends on: grasp (hands, claws that hold), stance (feet), sight, hearing, smell, breathing; alertness for tasks needing attention, judgment or quick reactions (driving, aiming, spotting, fine work).' },
        exertion: { type: 'string', enum: ['none', 'light', 'heavy'] },
        on_feet: { type: 'boolean', description: 'The task needs standing or walking unaided' },
        timed: { type: 'boolean', description: 'The task must be done within a tight time (a lock picked before the guard turns, a sum shouted in a race)' },
        fine: { type: 'boolean', description: 'The task needs fine finger work with bare fingers (tying a knot, loading a cartridge, picking a lock, writing)' },
        override: { type: 'boolean', description: 'Set after BodyCheck named another tool, when the task differs from what that tool decides' },
    }, ['who', 'task', 'reference_class', 'base_share', 'share'], a => run((st, rng) => {
        const w = whoAny(st, a.who, a.species);
        if (!w.p) return w.error;
        const out = check(w.p, { ...a, share: combined(a) }, rng);
        // A failed climb ends where the grip went: a height drawn evenly over the climb [ASSUMED], and the fall from it.
        // A climb sets where the climber stands: on top after a success, at the foot after a failure.
        if (a.height_m && /SUCCESS/.test(out)) w.p.raised_m = Number(a.height_m);
        if (a.height_m && /FAILURE/.test(out)) {
            w.p.raised_m = 0;
            const h = Math.round(rng() * Number(a.height_m) * 10) / 10;
            return `${out.replace('; the body as it was', '')} ${h < 0.5 ? `${a.who} slips back before leaving the ground.` : `${a.who} loses the grip at ${h} m. ${fall(w.p, h, {}, rng)}`}`;
        }
        return out;
    }));

    tool('BodyTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id, for a treatment of one wound (antivenom, antibiotics, laparotomy, oxygen and transfuse treat the whole body)' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load', 'antivenom', 'antibiotics', 'laparotomy', 'oxygen', 'hyperbaric_oxygen'] },
        training: { type: 'string', enum: ['untrained', 'instructions', 'trained'], description: 'For stop_bleeding: untrained (a lay person), instructions (written or by phone), trained (medic, Stop the Bleed course). Default untrained.' },
    }, ['who', 'treatment'], a => run((st, rng) => {
        const { p, error } = whoAny(st, a.who);
        if (!p) return error;
        return `${treat(p, Number(a.wound), a.treatment, rng, { training: a.training ?? 'untrained' })} ${status(a.who, p)}`;
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
        if (!p) return error;
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
    }, ['minutes'], async a => { await prepareBleeding(store().state.people ?? {}, Math.max(0, Math.round(a.minutes))); return run((st, rng) => {
        const asked = Math.max(0, Math.round(a.minutes));
        const walkers: [string, Person, number][] = [];
        for (const w of a.walking || []) {
            const p = st.people?.[w.who];
            if (!p) continue;
            if (w.running && w.speed_kmh == null) return `Give speed_kmh for ${w.who}'s running. State unchanged.`;
            let kmh: number;
            try {
                kmh = w.speed_kmh ?? walkSpeedKmh(p, w.grade_pct ?? 0, w.terrain ?? 'dirt road', w.load_kg ?? 0, (p.weather ? placeCountry(p.weather) : null) ?? st.setting?.country ?? null);
                p.workMet = metOf(w.running ? runWatts(p.mass, w.load_kg, kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road') : walkWatts(p, w.load_kg, kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road'), p.mass);
            } catch (e) { return `${(e as Error).message} State unchanged.`; }
            walkers.push([w.who, p, kmh]);
        }
        // Characters outdoors at a weather station: time runs in hour steps, each taking the air temperature at its start.
        const t0 = storyNow(st), weathered = t0 !== null && Object.values(st.people || {}).some(p => p.weather && p.env);
        let elapsed = 0, events: string[] = [];
        do {
            if (weathered) applyWeather(st.people!, t0 + elapsed);
            const step = weathered ? Math.min(60, asked - elapsed) : asked - elapsed;
            const r = advanceAll(st.people || {}, step, new Set(a.resting || []), rng, { active: new Set(a.active || []), sleeping: new Set(a.sleeping || []), eachMinute: airHook(st) });
            elapsed += r.elapsed; events = r.events;
            if (events.length || r.elapsed < step) break;
        } while (elapsed < asked);
        if (t0 !== null && st.clock) st.clock.add += elapsed;
        const walked = walkers.map(([n, p, kmh]) => { const met = p.workMet ?? 0; delete p.workMet; return `${n} walked ${Math.round(kmh * elapsed / 60 * 10) / 10} km at ${Math.round(met * 10) / 10} MET`; });
        const head = (events.length
            ? `Time stopped after ${mmss(elapsed)} of ${asked} minutes: ${events.join('; ')}. ${mmss(asked - elapsed)} remain.`
            : `${elapsed} minutes passed.`) + (walked.length ? ` ${walked.join('; ')}.` : '');
        const lines = Object.entries(st.people || {}).map(([who, p]) => status(who, p));
        return [head, ...lines].join('\n');
    }); });

    const ACT_EXAMPLE = 'Example: {"who":"Mary","steps":[{"do":"be_at","to":"Mary\'s house: hall"},{"do":"walk_to","to":"street outside Mary\'s house","distance_m":4}]} or {"who":"Mary","action":"steps out onto the street","distance_m":4}.';
    const STEP_ITEM = { type: 'object', properties: {
            do: { type: 'string', enum: ['be_at', 'walk_to', 'stairs_up', 'stairs_down', 'sit', 'stand', 'bend', 'kneel', 'arise', 'kneel_both', 'arise_both', 'turn', 'sidestep', 'reach', 'grasp', 'release', 'look'] },
            to: str('Spot, named with its place: "John\'s house: living room", "John\'s house: front door", "Rue de Rivoli"'),
            distance_m: { type: 'number', description: 'Walking distance to the spot, m, from the scene\'s layout; needed only the first time' },
            cm: { type: 'number', description: 'Reach distance, cm' },
            grade_pct: { type: 'number', description: 'Slope or stairs, % (a staircase about 60)' },
            load_kg: { type: 'number', description: 'Load carried, kg' },
            crowd_per_m2: { type: 'number', description: 'People per m² on the way when crowded (busy street 0.5, packed market 2, crush 3.5)' },
            steps: { type: 'number', description: 'For stairs: number of steps (a storey about 16)' },
            riser_cm: { type: 'number', description: 'For stairs: step height, cm, when the story sets it (steep old stair 20, modern 17)' },
            tread_cm: { type: 'number', description: 'For stairs: step depth, cm' },
        }, required: ['do'] } as const;
    tool('Act', 'Time characters\' physical actions before narrating them, and move the story clock by exactly that time. Give who, action (the action in plain words: "steps out onto the street", "sits down at a table") and distance_m for any walking; for several characters at the same time, actors, each with who, action and distance_m. steps is the exact form: walking between spots, sitting, standing, bending, kneeling, turning, reaching, grasping. Narrate the times it gives. Record where a character is with be_at; a walking distance is kept once given.', {
        who: str('Character acting (one actor)'),
        actors: { type: 'array', description: 'Several characters acting at the same time, each with their steps', items: { type: 'object', properties: { who: str('Character'), action: str('The action in plain words'), distance_m: { type: 'number', description: 'Walking distance, m' }, steps: { type: 'array', items: STEP_ITEM } }, required: ['who'] } },
        steps: { type: 'array', description: 'Actions in order (one actor)', items: STEP_ITEM },
        action: str('For one actor, the action in plain words (an alternative to steps) ("steps out of the house onto the street", "sits down", "stands up and crosses the room"); walking needs distance_m'),
        distance_m: { type: 'number', description: 'With action: the walking distance, m, from the scene' },
    }, [], a => run((st, rng) => {
        // Act times walking and posture; a climb is BodyCheck's (with height_m) and a drop BodyFall's.
        const said = [a.action, ...((a.actors as { action?: string }[] | undefined) ?? []).map(x => x.action)].filter(Boolean).join(' ');
        if (/\b(?:climb|climbs|climbed|climbing|clambers?|scales?|scaled|scaling|vaults?|vaulted|jumps? (?:down|off|over|from)|leaps? (?:down|off|over|from)|drops? (?:down|from|over|into)|dropped (?:down|from|over|into)|falls?|fell)\b/i.test(String(said))) return `Act times walking and posture. A climb is decided by BodyCheck with height_m, and a drop by BodyFall from the height the climber stands at. State unchanged.`;
        if (a.who && !a.steps && !a.actors && a.action) {
            const r = stepsFromWords(Array.isArray(a.action) ? (a.action as unknown[]).join(', then ') : String(a.action), String(a.who), a.distance_m as number | undefined);
            if ('error' in r) return `${r.error} ${ACT_EXAMPLE} State unchanged.`;
            a = { ...a, steps: r.steps as unknown as typeof a.steps };
        }
        // An actor listed without steps takes the call's own steps (a model may name the actors and give the steps once).
        // An actor listed without steps takes the call's own steps, or its action in words.
        const words = Array.isArray(a.action) ? (a.action as unknown[]).join(', then ') : a.action ? String(a.action) : '';
        const fromWords = (w: string) => { if (!words) return []; const r = stepsFromWords(words, w, a.distance_m as number | undefined); return 'error' in r ? [] : r.steps; };
        // Each actor's own action in words, a step written as words, and steps nested one level too deep are all read.
        const own = (x: { who: string; action?: string; distance_m?: number }) => { if (!x.action) return []; const r = stepsFromWords(x.action, x.who, x.distance_m ?? a.distance_m as number | undefined); return 'error' in r ? [] : r.steps; };
        const flat = (st: Step[] | undefined, w: string): Step[] | undefined => st?.flatMap(s => (s as unknown as { steps?: Step[] }).steps && !s.do ? (s as unknown as { steps: Step[] }).steps
            : !s.do && (s as unknown as { action?: string }).action ? (() => { const r = stepsFromWords(String((s as unknown as { action: string }).action), w, s.distance_m ?? a.distance_m as number | undefined); return 'error' in r ? [] : r.steps; })() : [s]);
        const list = ((a.actors as unknown as { who: string; action?: string; distance_m?: number; steps?: Step[] }[] | undefined)?.map(x => ({ who: x.who, steps: flat(x.steps, x.who) ?? (own(x).length ? own(x) : undefined) ?? flat(a.steps as unknown as Step[] | undefined, x.who) ?? fromWords(x.who) })))
            ?? (a.who && a.steps ? [{ who: String(a.who), steps: a.steps as unknown as Step[] }] : []);
        if (list.some(x => !x.steps.length)) { const why = words ? stepsFromWords(words, '', a.distance_m as number | undefined) : null; return `Give steps for ${list.filter(x => !x.steps.length).map(x => x.who).join(', ')}${why && 'error' in why ? ` (${why.error})` : ''}. ${ACT_EXAMPLE} State unchanged.`; }
        if (!list.length) return `Give who and steps (or action), or actors. ${ACT_EXAMPLE} State unchanged.`;
        const actors: { who: string; p: Person; steps: Step[] }[] = [];
        for (const x of list) { const { p, error } = who(st, x.who); if (!p) return error; actors.push({ who: x.who, p, steps: x.steps }); }
        const r = actTogether(st, actors, p => (p.weather ? placeCountry(p.weather) : null) ?? st.setting?.country ?? null);
        if ('error' in r) return `${r.error} State unchanged.`;
        const names = new Set(actors.map(x => x.who));
        // A walk leaves the height a climb set.
        for (const x of actors) if (x.steps.some(s => s.do === 'walk_to')) delete x.p.raised_m;
        let tail = '';
        tail = passSeconds(st, r.seconds, names, rng);
        return `${r.text}. Span ${honest(r.seconds)}.${tail}`;
    }));

    tool('Room', 'Set up or change the air of an enclosed space (a room, a cellar, a tent, a mine gallery) when its air matters: a fire, a stove or a lamp burning inside, many people in a closed room, gas filling it. Characters whose spot (Act be_at / walk_to) is this room breathe its air every minute: carbon monoxide, carbon dioxide, oxygen. Call again when a fire starts or goes out.', {
        room: str('The spot name, as used in Act ("John\'s house: kitchen")'),
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
        outdoor_co2_ppm: { type: 'number', description: 'Carbon dioxide outside, ppm. Default 420 (present day); about 280 before 1800.' },
        fires: { type: 'array', description: 'What burns inside now (an empty list: every fire out)', items: { type: 'object', properties: {
            fuel: { type: 'string', description: `${Object.keys(FIRE_FUELS).join(', ')}, or a compound burnt in a lamp or burner (ethanol, methane, propane, octane)` },
            kg_per_hour: { type: 'number', description: 'Fuel burnt per hour, kg (a brazier about 0.5–1 kg/h of charcoal, an open wood fire 1–3, an oil lamp 0.01)' },
            co_g_per_kg: { type: 'number', description: 'Carbon monoxide per kg burnt, when known; otherwise the measured household-stove value' },
            moisture_pct: { type: 'number', description: 'For wood and other solid fuels: water, % of wet weight (seasoned 20, green 50). Default 20.' },
        }, required: ['fuel', 'kg_per_hour'] } },
    }, ['room'], async a => { await loadChem(); return run((st, rng) => {
        st.rooms ??= {};
        const old = st.rooms[a.room];
        const outline = st.map?.rooms[a.room];
        if (outline) { a = { ...a, floor_m2: a.floor_m2 ?? Math.round(area(outline.corners) * 10) / 10, height_m: a.height_m ?? outline.height }; }
        const vol = a.volume_m3 ?? (a.floor_m2 && a.height_m ? a.floor_m2 * a.height_m : undefined);
        if (!old && !(vol && vol > 0)) return `Give volume_m3 (or floor_m2 and height_m) for ${a.room} (first time). State unchanged.`;
        const fires: Room['fires'] = [];
        for (const f of a.fires ?? []) {
            const k = f.fuel.trim().toLowerCase(), known = FIRE_FUELS[k];
            if (known) { fires.push({ fuel: k, kgh: f.kg_per_hour, C: known.C, H: known.H, O: known.O, coEF: f.co_g_per_kg ?? known.coEF, note: f.co_g_per_kg != null ? `CO ${f.co_g_per_kg} g/kg as given` : known.note, lhv: heatingValue({ C: known.C, H: known.H, O: known.O }, k === 'charcoal' ? 0 : f.moisture_pct ?? 20).lhvWet }); continue; }
            const c = findCompound(k);
            if (!c) return `Unknown fuel "${f.fuel}". Known: ${Object.keys(FIRE_FUELS).join(', ')}, or a compound name. State unchanged.`;
            const el = parseFormula(c.f), M = molarMass(c.f), pct = (e: string, w: number) => (el[e] ?? 0) * w / M * 100;
            const hf = heatFromFormation(c), hhv = hf ? hf.kJmol / M : 0; // kJ/g = MJ/kg
            fires.push({ fuel: c.n, kgh: f.kg_per_hour, C: pct('C', 12.011), H: pct('H', 1.008), O: pct('O', 15.999), coEF: f.co_g_per_kg ?? 0, note: f.co_g_per_kg != null ? `CO ${f.co_g_per_kg} g/kg as given` : 'burns to CO2 [ASSUMED]', lhv: hhv - 2.443 * 8.937 * pct('H', 1.008) / 100 });
        }
        const r: Room = old ?? { m3: vol!, ach: a.air_changes_per_hour ?? Math.round(drawAch(() => gauss(rng)) * 100) / 100, co: 0, co2: a.outdoor_co2_ppm ?? 420, o2: OUT_O2, out: { co: 0, co2: a.outdoor_co2_ppm ?? 420 }, air_c: a.air_c ?? 20, fires: [] };
        if (vol) r.m3 = vol;
        if (a.floor_m2) r.floor = a.floor_m2; if (a.height_m) r.h = a.height_m; if (a.lining) r.lining = a.lining;
        if (a.opening_m2 != null) r.vent = a.opening_m2 > 0 ? { m2: a.opening_m2, h: a.opening_height_m ?? 2 } : null;
        if (a.air_changes_per_hour != null) r.ach = a.air_changes_per_hour;
        if (a.air_c != null) r.air_c = a.air_c;
        if (a.outdoor_co2_ppm != null) r.out.co2 = a.outdoor_co2_ppm;
        if (a.fires) { if (!r.fires.length && fires.length) { r.fireMin = 0; r.base_c = r.air_c; r.hot = undefined; } if (!fires.length) { r.hot = undefined; r.layer = undefined; } r.fires = fires; }
        st.rooms[a.room] = r;
        if (a.doorways) {
            const missing = a.doorways.filter(d => !st.rooms![d.room]).map(d => d.room);
            if (missing.length) return `Set up ${missing.join(', ')} with Room first (volume), then join the doorways. Nothing else changed.`;
            st.openings = (st.openings ?? []).filter(o => o.a !== a.room && o.b !== a.room).concat(a.doorways.map(d => ({ a: a.room, b: d.room, m2: d.m2 ?? 1.6, h: d.height_m ?? 2 })));
        }
        const joined = (st.openings ?? []).filter(o => o.a === a.room || o.b === a.room).map(o => `${o.a === a.room ? o.b : o.a} (${o.m2} m², ${Math.round(exchangeM3s(st.rooms![o.a], st.rooms![o.b], o) * 3600)} m³/h each way now)`);
        const inside = Object.entries(st.people ?? {}).filter(([, p]) => inRoom(st, p, a.room)).map(([n]) => n);
        return `${describeAir(a.room, r)}. Inside: ${inside.join(', ') || 'no one'}.${joined.length ? ` Open to: ${joined.join(', ')}.` : ''} The air changes minute by minute as time passes (PassTime, Act).`;
    }); });

    tool('Dose', 'Record a medicine given to a character, when the story has it given (an injection by a doctor, an anaesthetic, an adrenaline pen); its course over the next 90 minutes then runs on precomputed Pulse runs: pulse, blood pressure, breathing, sedation, muscle block. Time passes with PassTime or Act.', {
        who: str('Character given the medicine'),
        substance: { type: 'string', enum: ['Midazolam:IM', 'Lorazepam:IM', 'Ketamine:IM', 'Propofol:IV', 'Succinylcholine:IM', 'Rocuronium:IV', 'Epinephrine:IM'], description: 'Medicine and route (IM into a muscle, IV into a vein)' },
        mg: { type: 'number', description: 'Dose, mg' },
    }, ['who', 'substance', 'mg'], async a => { await loadDrugs(); return run(st => {
        const { p, error } = who(st, a.who);
        if (!p) return error;
        const r = startDose(p, a.substance, a.mg);
        return 'error' in r ? `${r.error} State unchanged.` : `${a.who}: ${r.note} given; its course runs as time passes.`;
    }); });

    tool('Layout', 'Place spots and rooms on the scene\'s plan, in metres, once the story fixes where things are: then walking distances, room sizes, who can hear or see whom through walls come from the plan. x east, y north from any corner of the scene; floor 0 the ground floor.', {
        spots: { type: 'array', description: 'Spots with their position', items: { type: 'object', properties: {
            spot: str('Spot name, as used in Act ("John\'s house: kitchen")'), x_m: { type: 'number', description: 'x, m' }, y_m: { type: 'number', description: 'y, m' },
            floor: { type: 'number', description: 'Floor number (0 ground, 1 first, -1 cellar). Default 0.' }, room: str('The room it is in, when it has an outline'),
        }, required: ['spot', 'x_m', 'y_m'] } },
        rooms: { type: 'array', description: 'Rooms by their corners', items: { type: 'object', properties: {
            room: str('Room name (also usable as a spot and in Room)'), corners: { type: 'array', items: { type: 'array', items: { type: 'number' } }, description: 'Corners [[x, y], …] in order, m' },
            floor: { type: 'number', description: 'Floor number. Default 0.' }, height_m: { type: 'number', description: 'Ceiling height, m. Default 2.5.' },
        }, required: ['room', 'corners'] } },
    }, [], a => run(st => {
        const m = mapOf(st), out: string[] = [];
        for (const r of (a.rooms ?? []) as { room: string; corners: number[][]; floor?: number; height_m?: number }[]) {
            if (!Array.isArray(r.corners) || r.corners.length < 3) return `Room ${r.room} needs at least 3 corners. State unchanged.`;
            m.rooms[r.room] = { corners: r.corners.map(c => [Number(c[0]), Number(c[1])] as [number, number]), floor: r.floor ?? 0, height: r.height_m ?? 2.5 };
            out.push(`${r.room}: ${area(m.rooms[r.room].corners).toFixed(1)} m², ${(area(m.rooms[r.room].corners) * (r.height_m ?? 2.5)).toFixed(0)} m³`);
        }
        for (const p of (a.spots ?? []) as { spot: string; x_m: number; y_m: number; floor?: number; room?: string }[]) {
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
        if (!p) return error;
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
        const m = material(a.material); if (!m) return `Give material, one of: ${MATERIAL_NAMES.join(', ')}.`;
        let cap: number, what: string;
        if (a.shape === 'rope') { if (!a.diameter_mm) return 'Give diameter_mm for a rope.'; cap = ropeBreakKg(a.diameter_mm); what = `a ${a.diameter_mm} mm rope`; }
        else if (a.shape === 'rod or bar') { if (!a.diameter_mm) return 'Give diameter_mm for a rod or bar.'; cap = rodBreakKg(m, a.diameter_mm); what = `a ${a.diameter_mm} mm ${a.material} rod`; }
        else { if (!a.width_cm || !a.thickness_cm || !a.span_m) return 'Give width_cm, thickness_cm and span_m for a plank or beam.'; cap = plankBreakKg(m, a.width_cm / 100, a.thickness_cm / 100, a.span_m); what = `a ${a.width_cm} × ${a.thickness_cm} cm ${a.material} plank over ${a.span_m} m`; }
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
        stiff_legs: { type: 'boolean', description: 'Lands with straight legs (taken by surprise, a slip); default: knees bend' },
    }, ['who', 'height_m'], a => run((st, rng) => {
        const { p, error } = whoAny(st, a.who, a.species);
        if (!p) return error;
        // A fall starts from where the character stands: after a failed climb they are at its foot (a climb that failed at
        // 0.6 m was followed by a 3 m drop "into the garden on the other side").
        if (p.raised_m != null && Number(a.height_m) > p.raised_m + 0.5) return p.raised_m ? `${a.who} stands ${p.raised_m} m up: the drop is ${p.raised_m} m. Call BodyFall with height_m ${p.raised_m}.` : `${a.who} stands on the ground at the foot of the climb, on the side the climb started from.`;
        delete p.raised_m;
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first, age: a.age == null ? undefined : Number(a.age), ground: a.ground, stiff: !!a.stiff_legs }, rng);
    }));

    tool('BodyStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
        species,
    }, ['who'], a => run(st => { const w = whoAny(st, a.who, a.species); return w.p ? status(a.who, w.p) : w.error; }));
}
