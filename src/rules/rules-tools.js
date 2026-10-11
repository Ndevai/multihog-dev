import { NOISE, BARRIER, SOUNDS } from './acoustics.js';
import { judgeStatement, helpChance, OBEY, SMALL_REQUEST_YES, interestChance, SITUATIONS } from './social.js';
import { CONTACT_MATERIALS } from './thermal/exposure.js';
import { drawPerson } from './census.js';
import { REGIONS } from './strength.js';
import { learn, knowledgeBlock } from './knowledge.js';
import { ABOUT, MATTERS, TYPES, occTypes } from './emotion.js';
import { skyLight } from './sky.js';
import { findPlace, simulatePlaceYear, hourTemp } from './weather.js';
import { price, PRICE_QUESTIONS, GOODS_LIST, TRADES, CITIES } from './prices.js';
import { drawName } from './names.js';
import { bodySize } from './body-size.js';
import { DISEASES, INCUBATION, R0, incubationHours, attackShare } from './disease.js';
import { BATTLE_YEARS, attackWinShare, battleCost } from './battle.js';
import { nowMinutes } from '../features/journal-calendar.js';
import { gauss, person, addWound, treat, advanceAll, cast, fall, status, seededRng, strike, check, openWound, findPart, creatureOf, FUNCTIONS, communicate, intake, choke, setEnvironment, setAltitude, contactBurn, listen, look, holdLoad, chase } from './body-engine.js';
import { thermalCapable } from './thermal/exposure.js';
import { TERRAIN, pandolf, runWatts, metOf } from './work.js';
import { ENSEMBLES, GARMENTS } from './thermal/ensembles.js';
import { loadRaws, creatureId, creature } from './df/index.js';
import { SKILL_LEVELS, STYLES } from './df/combat.js';
import { turnKey } from '../state/dice-ledger.js';
import { getSettings } from '../../state-manager.js';
import { str, checkArgs } from './tool-schema.js';
export const TOOLS = ['Battle', 'BodyEnvironment', 'BodyChoke', 'BodyIntake', 'Communicate', 'Listen', 'Look', 'SocialResponse', 'NewCharacter', 'RecordFact', 'Appraise', 'Price', 'NameCharacter', 'BodySize', 'Disease', 'Weather', 'Choose', 'HoldOn', 'Chase', 'BodyCheck', 'BodyWound', 'BodyStrike', 'BodyTreat', 'BodyContact', 'PassTime', 'CastSpell', 'BodyFall', 'BodyStatus'];
const KEEP_SNAPSHOTS = 30;
/** Tools registered while the engine is on, by name. */
export const REGISTRY = new Map();
export function store() {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.rulesEngine ??= { state: { people: {} }, snapshots: {}, version: STATE_VERSION };
    const s = ctx.chatMetadata.rulesEngine;
    s.salt ??= crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    if ((s.version ?? 1) < STATE_VERSION) {
        migrate(s.state);
        for (const snap of Object.values(s.snapshots ?? {}))
            migrate(snap.state);
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
export function onRulesGenerationStarted(type) {
    reshuffle(SHARES);
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return;
    const s = store();
    const chat = ctx.chat || [];
    const rewrites = (type === 'swipe' || type === 'regenerate') && chat.length && !chat[chat.length - 1].is_user;
    if (rewrites) {
        const snap = s.snapshots[chat.length - 1];
        if (snap) {
            s.state = structuredClone(snap.state ?? snap);
            s.calls = snap.calls ?? 0;
        }
        s.decided = null;
    }
    else if (!type || type === 'normal') {
        if (chat.at(-1)?.is_user)
            s.calls = 0;
        s.snapshots[chat.length] = { state: structuredClone(s.state), calls: s.calls || 0 };
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS))
            delete s.snapshots[k];
    }
}
/** MESSAGE_RECEIVED: keep the state each swipe ended with, like Multihog's rpgMemoResult. */
export function onRulesMessageReceived(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!ctx.chatMetadata || !msg || msg.is_user || msg.is_system)
        return;
    msg.extra ??= {};
    const results = (msg.extra.rulesResult ??= {});
    results[msg.swipe_id ?? 0] = structuredClone(store().state);
    (ctx.saveChatDebounced || ctx.saveChat)?.();
}
/** MESSAGE_SWIPED: returning to an earlier swipe restores the state it ended with. */
/** States each swipe of a reply ended with, by swipe id. */
const resultsOf = (m) => m?.extra?.rulesResult;
export function onRulesSwiped(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    const saved = resultsOf(msg)?.[msg?.swipe_id ?? 0];
    if (!ctx.chatMetadata || !saved)
        return;
    restore(saved);
}
const isReply = (m) => !!m && !m.is_user && !m.is_system && !m.extra?.tool_invocations;
function restore(saved) {
    const s = structuredClone(saved);
    migrate(s);
    store().state = s;
    save();
}
/** CHAT_CHANGED / MESSAGE_DELETED: state = what the last reply ended with, so a branch or deletion starts from its own point. */
export function syncRulesToChat() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return;
    const msg = [...(ctx.chat || [])].reverse().find(isReply);
    const saved = resultsOf(msg)?.[msg?.swipe_id ?? 0];
    if (saved)
        restore(saved);
}
/** Linear Stone restore: find the reply whose State Tracker result is this memo and take its rule-engine state. */
export function restoreRulesForMemo(memo) {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata)
        return false;
    for (const msg of [...(ctx.chat || [])].reverse()) {
        const results = msg?.extra?.rpgMemoResult, rules = resultsOf(msg);
        if (!isReply(msg) || !results || !rules)
            continue;
        const swipe = Object.keys(results).find(k => results[k] === memo && rules[Number(k)]);
        if (swipe !== undefined) {
            restore(rules[Number(swipe)]);
            return true;
        }
    }
    return false;
}
// The narrator gets the outcome only: chances, intermediate values and citations are salient details that anchor or
// leak into the narration (models are distracted by irrelevant context: Shi et al. 2023, ICML). The full text goes to the
// browser console.
const DETAIL = /\s*\([^()]*(?:%|\b(?:1[89]|20)\d\d\b|\bSII\b|chance)[^()]*\)/g;
const ODDS = /\b(?:death )?chance \d+(?:\.\d+)? ?%\s*(?:→|—)\s*/g;
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
const DECIDES = { BodyCheck: a => [a.who, a.task], Communicate: a => [a.speaker, a.listener, a.means], Listen: a => [a.listener, a.sound ?? a.spl_db],
    Look: a => [a.viewer, a.target ?? a.size_m], SocialResponse: a => [a.situation, a.who, a.speaker ?? a.request ?? ''],
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
function remember(name, a, out) { const k = decisionKey(name, a); if (k && typeof out === 'string') {
    decisions()[k] = out;
    save();
} }
// Same turn + same call order → same random draws, so a swipe repeats outcomes instead of re-rolling them.
function run(fn) {
    const s = store();
    s.calls = (s.calls || 0) + 1;
    const rng = seededRng(`${s.salt}:${turnKey(SillyTavern.getContext().chat)}:${s.calls}`);
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
const SOCIAL = ['a statement that might be a lie', 'an emergency they witness', 'an order to hurt someone', 'a small favour asked by a stranger', 'a brief first meeting'];
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
const species = str('DF creature of this character, by name or id (human, wolf, horse, giant wolf); read when the character first appears. Default human.');
const partArg = str('Body part by its name: e.g. head, throat, upper body, lower body, right upper arm, left hand, right lower leg, left eye.');
/** Species id from a tool argument: 'HUMAN' when absent, null when no DF creature matches. */
const speciesOf = (text) => text ? creatureId(text) : 'HUMAN';
const noSpecies = (text) => `No DF creature "${text}". Nothing recorded.`;
/** Species and mass from the State Tracker profile of `name`: its "Name (N kg)" header and the "Species:" line below it. */
function fromTracker(name) {
    const memo = String(getSettings()?.currentMemo || '');
    const esc = String(name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!esc)
        return {};
    const m = memo.match(new RegExp(`^[\\s*-]*${esc}\\s*\\(([\\d.]+)\\s*kg\\)[^\\n]*\\n((?:[^\\n]*\\S[^\\n]*(?:\\n|$)){0,12})`, 'mi'));
    if (!m)
        return {};
    const languages = m[2].match(/^\s*Languages?:\s*(.+)$/mi)?.[1]?.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    return { mass: Number(m[1]) || undefined, species: m[2].match(/^\s*Species:\s*(.+)$/mi)?.[1]?.trim(), languages };
}
/** The tracked person `name`; on first appearance species and mass come from the arguments, else the tracker, else human. */
function who(st, name, speciesArg, massArg) {
    if (!name)
        return { error: 'Give the character\'s name.' };
    const known = st.people?.[name];
    const t = known ? {} : fromTracker(name);
    const text = speciesArg || t.species;
    const sp = speciesOf(text);
    if (!sp)
        return { error: noSpecies(text) };
    // DF names some creatures only in legends ([DOES_NOT_EXIST], no body): chimera, centaur, griffon.
    if (!known && !creature(sp)?.parts.length)
        return { error: `DF defines no body for "${text}" (a creature of legend only). Nothing recorded.` };
    return { p: person(st, name, Number(massArg) || t.mass, sp) };
}
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
- A sound that might be heard → Listen. Something that might be seen → Look. A message whose arrival is in doubt, or that teaches a fact → Communicate.
People
- A character the story has not described → NewCharacter; their first name → NameCharacter; their height and mass → BodySize.
- A person's response to a possible lie, an emergency, an order to hurt someone, a stranger's small favour or a first meeting → SocialResponse.
- A character's pick among several real options → Choose. A character's feelings about something → Appraise.
- A fact the story establishes, or something a character learns → RecordFact.
World
- A price, a wage or a bill → Price. A contagious disease → Disease. An attack by one army or unit on a defended position → Battle. A spell → CastSpell. A random pick (a door, a coin, a card) → RollTheDice with kind "table".
Principles
- A character's species and mass come from their tracker profile ("Name (N kg)", "Species:"); give species in the first rule-tool call for a character without one.
- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now. Facts in [KNOWS] stay true.
- A player's message says what their character tries. Whether it works comes from the tools, also when the message states the result or disputes an earlier one; a result stands.
</rule_engine>`;
/** Story time in minutes: the tracker's [TIME] plus the minutes PassTime has run since [TIME] last changed; null without one. */
function storyNow(st) {
    const t = nowMinutes();
    if (t === null)
        return null;
    if (st.clock?.t !== t)
        st.clock = { t, add: 0 };
    return t + st.clock.add;
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
const NO_YEAR = 'Give year: [TIME] holds no calendar date.';
/** Remembers a place as the scene's setting, so later calls can leave place and country out. */
function setPlace(st, place) {
    st.setting = { place: place.key, label: place.label, country: place.country };
    if (place.lat != null)
        st.latitude = place.lat;
}
/** Weather at place key `place` (from findPlace) at story minute `t` (calendar dates only): the day, air now, date; or null. */
function weatherAt(place, t) {
    if (t === null || t / 1440 <= 146097)
        return null;
    const date = new Date(0, 0, 1);
    date.setFullYear(1, 0, 1);
    date.setDate(date.getDate() + Math.floor(t / 1440));
    const year = date.getFullYear(), jan1 = new Date(0, 0, 1);
    jan1.setFullYear(year, 0, 1);
    const doy = Math.min(365, Math.round((date.getTime() - jan1.getTime()) / 864e5) + 1);
    const days = simulatePlaceYear(place, doy, seededRng(`${store().salt}:weather:${place}:${year}`));
    if (!days)
        return null;
    const d = days[days.length - 1];
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
    return ctx.chatMetadata ? knowledgeBlock(store().state) : '';
}
export function registerRulesTools(enabled) {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool)
        return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    REGISTRY.clear();
    if (!enabled)
        return;
    // The action's argument type comes from the schema the model is given.
    const tool = (name, description, properties, required, action) => {
        const exec = async (raw) => {
            // Arguments are checked against the schema at the boundary; a call with errors runs nothing and says what to fix.
            const { args, errors } = checkArgs(properties, required, raw ?? {});
            if (errors.length)
                return `${name} not run; fix and call again: ${errors.join('; ')}.`;
            await loadRaws();
            const prior = decided(name, args);
            if (prior)
                return `Already decided this turn; this result stands. ${prior}`;
            const out = plain(await action(args));
            remember(name, args, out);
            globalThis._rpgRefreshRenderedView?.();
            return out;
        };
        REGISTRY.set(name, { name, description, properties, required, exec });
        registerFunctionTool({ name, displayName: name, description, parameters: { type: 'object', properties, required: [...required] }, action: exec, formatMessage: () => '' });
    };
    // Severity (vessel, fracture) is decided in code; the narrator names only the cause and place.
    tool('BodyWound', 'Record a wound the moment it happens when BodyStrike did not make it: a burn, a bite, an accident, a fall injury, or a hit by a weapon BodyStrike does not cover (arrow, bolt, bullet). Returns what the wound is and the body state.', {
        who: str('Character name'),
        species,
        part: partArg,
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'burn', 'bite'] },
        depth: { type: 'string', enum: ['superficial', 'partial', 'deep_partial', 'full'], description: 'Burns: superficial = red, no blisters; partial = blisters; deep_partial = pale, scars; full = through the skin.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species);
        if (!p)
            return error;
        const c = creatureOf(p), part = findPart(c, a.part);
        if (!part)
            return `${a.who} has no part "${a.part}". Parts: ${c.parts.map(x => x.name).join(', ')}. Nothing recorded.`;
        const w = ['cut', 'puncture', 'bite'].includes(a.type) ? openWound(p, part, a.type, rng) : addWound(p, { part, type: a.type, depth: a.depth }, rng);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));
    tool('BodyStrike', 'Resolve an attack before narrating it: whether it lands, which tissue layers it cuts or smashes, and the wounds it records. Narrate a miss as a miss.', {
        who: str('Character hit'),
        species,
        part: str('Body part aimed at, by name (head, throat, upper body, right upper arm, left eye…). Omit when the blow is not aimed at a part: the location is then drawn.'),
        attack: str('The attack: a natural attack of the attacker (punch, kick, bite, scratch, gore…) or, with a weapon, the weapon\'s attack (slash, stab, bash, hack…). Omit for a shot.'),
        weapon: str('Melee weapon used, if any: short sword, long sword, two-handed sword, scimitar, dagger, battle axe, great axe, war hammer, maul, mace, morningstar, flail, spear, pike, halberd, pick, whip, scourge.'),
        material: str('Material of the weapon or of the ammunition: iron, steel, bronze, bismuth bronze, copper, silver, bone, wood. Default iron.'),
        launcher: str('For a shot: bow, crossbow or blowgun (the ammunition is its arrow, bolt or dart in material). Call it after the shot is on target (BodyCheck for aim); the target can still dodge or block it.'),
        skill: { type: 'string', enum: SKILL_LEVELS, description: 'Attacker\'s fighting skill level. Dabbling = untrained.' },
        style: { type: 'string', enum: Object.keys(STYLES), description: 'quick = fast weak blow; heavy or wild = full-force blow.' },
        prone: { type: 'boolean', description: 'Target lying on the ground.' },
        from: { type: 'string', enum: ['front', 'back', 'left', 'right'], description: 'Where the attacker strikes from, relative to the way the target faces. Default: front, or back when facing is false.' },
        target_armor: {
            type: 'array',
            description: 'Every item the character hit wears or holds ready ([E] in [INVENTORY]): armour, clothing, a shield, a held board or door.',
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
                                sublocations: { type: 'array', items: { type: 'string' }, description: 'Covered sub-locations of the part; omit for the whole part.' },
                                sides: { type: 'array', items: { type: 'string', enum: ['front', 'back'] }, description: 'Covered side; omit for both (a breastplate without a back plate = front).' },
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
        attacker_species: str('Attacker\'s DF creature when the attacker is not tracked. Default human.'),
        attacker_mass_kg: { type: 'number', description: 'Attacker body mass in kg when not tracked; default the species\' adult mass.' },
        target_mass_kg: { type: 'number', description: 'Body mass of the character hit, in kg, the first time this character appears; default the species\' adult mass.' },
        awake: { type: 'boolean', description: 'Target awake. Default true.' },
        facing: { type: 'boolean', description: 'Target looking toward the attacker. Default true.' },
        lit: { type: 'boolean', description: 'Enough light for the target to see the attacker. Default true.' },
        noise_db: { type: 'number', description: 'Sound level of the attacker at the target in dB(A). 0 = silent.' },
        noise_sound: { type: 'string', enum: Object.keys(SOUNDS), description: 'The attacker\'s sound, when it is one of these (level at the target is computed from distance_m); use instead of noise_db.' },
        under_fire: { type: 'boolean', description: 'For a shot: the shooter is being shot at.' },
        noise_khz: { type: 'number', description: 'Main pitch of that sound in kHz, when it is a tone (whistle, ultrasonic call). Omit for ordinary noise.' },
        distance_m: { type: 'number', description: 'Distance between attacker and target when the attack starts. Omit when already within reach.' },
        approach_speed: { type: 'number', description: 'Attacker\'s speed in m/s while closing the distance.' },
        sense_range_m: { type: 'number', description: 'Range of any non-visual sense the target has that detects an approaching attacker (e.g. telepathy), in m.' },
        intent_visible: { type: 'boolean', description: 'The approach itself shows an attack is coming (charging, weapon raised). False when the attacker looks harmless until the strike starts. Default false.' },
    }, ['who', 'part'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species, a.target_mass_kg);
        if (!p)
            return error;
        const attacker = a.attacker && st.people?.[a.attacker] ? st.people[a.attacker] : null;
        const ta = attacker || !a.attacker ? {} : fromTracker(a.attacker);
        const asp = speciesOf(a.attacker_species || ta.species);
        if (!asp)
            return noSpecies(a.attacker_species || ta.species);
        const { weapon, launcher, material, skill, style, prone, from, awake, facing, lit, noise_db, noise_sound, under_fire, noise_khz, distance_m, approach_speed, sense_range_m, intent_visible } = a;
        const scene = { weapon, launcher, material, skill, style: style, prone, from, awake, facing, lit, noise_db, noise_sound,
            under_fire, noise_khz, distance_m, approach_speed, sense_range_m, intent_visible };
        const out = strike(p, { part: a.part, attack: a.attack, species: asp, mass: Number(a.attacker_mass_kg) || ta.mass, armor: a.target_armor,
            ...Object.fromEntries(Object.entries(scene).filter(([, v]) => v !== undefined)) }, attacker, rng);
        return `${out} ${status(a.who, p)}`;
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
        return `${choke(p, a.seconds, holder, rng)} ${status(a.who, p)}`;
    }));
    tool('BodyEnvironment', 'Set the air, water and clothing characters are in whenever they enter a different climate, go into or out of water, the weather changes, or they change clothes; PassTime then works out body temperature, sweating, hypothermia, heat stroke and frostbite. clear = back to unrecorded (comfortable) conditions.', {
        who: { type: 'array', items: { type: 'string' }, description: 'Characters in these conditions' },
        air_c: { type: 'number', description: 'Air temperature, °C' },
        radiant_c: { type: 'number', description: 'Mean radiant temperature, °C: about air temperature in shade or indoors; higher in strong sun or by a fire (desert sun 60–70), lower under a clear night sky' },
        humidity_pct: { type: 'number', description: 'Relative humidity, %. Default 50' },
        wind_kmh: { type: 'number', description: 'Weather wind speed outdoors (as forecast, at 10 m), km/h. 0 = calm' },
        air_speed_ms: { type: 'number', description: 'Indoors or sheltered: air speed at the body, m/s (still room 0.1)' },
        ensemble: { type: 'string', description: `Clothing as a measured ensemble when one matches: ${Object.keys(ENSEMBLES).join('; ')}` },
        garments: {
            type: 'array',
            description: 'Clothing as garments (alone or on top of an ensemble). Name from the list or clo for anything else; covers = body regions (head, neck, chest, back, torso, pelvis, shoulders, arms, forearms, hands, thighs, lower legs, legs, feet, or one side: left hand…)',
            items: { type: 'object', properties: { name: str(`Garment: ${Object.keys(GARMENTS).join('; ')}`), clo: { type: 'number', description: 'Insulation of a garment not in the list, clo' }, covers: { type: 'array', items: { type: 'string' } } }, required: ['covers'] },
        },
        water_c: { type: 'number', description: 'Water temperature, °C, when any body region is in water' },
        immersed: { type: 'array', items: { type: 'string' }, description: 'Regions in water: "whole body" (neck down, head out), "submerged" (head under too), or regions (legs, feet, torso, arms…)' },
        swimming: { type: 'boolean', description: 'Swimming (set met 6 unless faster); cold arms end swimming' },
        afloat: { type: 'boolean', description: 'Kept afloat with the head out by a life jacket, wreckage or a boat' },
        water_speed_ms: { type: 'number', description: 'Water moving past the body (current, swimming), m/s. Default 0' },
        immersion_suit: { type: 'boolean', description: 'Clothing is a dry suit or immersion suit that keeps water out' },
        face_covered: { type: 'boolean', description: 'Face covered (mask, balaclava, scarf over the face). Default false' },
        met: { type: 'number', description: 'Activity in METs for the whole span when fixed (Compendium of Physical Activities values: sleeping 0.95, sitting quietly 1.3, walking 3 mph 3.5). Omit to follow PassTime (sleeping 0.95, resting 1.3, active 3.5)' },
        altitude_m: { type: 'number', description: 'Altitude above sea level, m, whenever it changes by 500 m or more. 0 = sea level' },
        sudden_ascent: { type: 'boolean', description: 'Arrived at this altitude within minutes (aircraft, magic, a fall upward) rather than by climbing' },
        decompression: { type: 'boolean', description: 'A pressurized cabin or enclosure suddenly opened at this altitude (breath torn out; shorter time conscious)' },
        co_ppm: { type: 'number', description: 'Carbon monoxide in the air, ppm (fire smoke in a room 1000–10 000; car exhaust in a closed garage several thousand; a faulty heater 100–1000); 0 = fresh air' },
        o2_pct: { type: 'number', description: 'Oxygen in the air, % (normal 20.9; a fire-filled or sealed room or gas-displaced air lower); omit for normal air' },
        smoke: { type: 'boolean', description: 'Breathing fire smoke (causes inhalation injury)' },
        swimmer: { type: 'boolean', description: 'Whether the character can swim, when the story has established it; otherwise code draws it once (46 % of adults)' },
        deep_water: { type: 'boolean', description: 'Water over the head. Default true when immersed.' },
        clear: { type: 'boolean', description: 'Remove recorded conditions' },
        weather_place: str('Outdoors: the town or city the characters are in or nearest to ("Lyon", "Sydney, Australia"); air temperature then follows that place\'s weather as PassTime runs (air_c may be left out). Leave it out indoors.'),
        latitude: { type: 'number', description: 'With weather_place for a place not in the lists (fictional or remote): its latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, ['who'], a => run(st => {
        const out = [];
        for (const name of a.who) {
            const { p, error } = who(st, name);
            if (!p) {
                out.push(error);
                continue;
            }
            if (a.clear) {
                setEnvironment(p, null);
                out.push(`${name}: conditions cleared.`);
                continue;
            }
            if (a.altitude_m != null)
                setAltitude(p, a.altitude_m, !!a.sudden_ascent, !!a.decompression);
            const place = a.weather_place ? findPlace(a.weather_place, a.latitude, a.longitude) : null;
            if (a.weather_place && !place) {
                out.push(`No weather data for "${a.weather_place}": give the nearest real town, or latitude and longitude.`);
                continue;
            }
            const w = place ? weatherAt(place.key, storyNow(st)) : null;
            if (place && !w) {
                out.push('weather_place needs a calendar date (dd/mm/yyyy) and hour in [TIME].');
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
                out.push(`${name}: cold-blooded; body temperature not simulated; not recorded.`);
                continue;
            }
            try {
                setEnvironment(p, { ...a, air_c: a.air_c, clothing: { ensemble: a.ensemble, garments: a.garments } });
            }
            catch (e) {
                return `${e.message} Nothing recorded.`;
            }
            out.push(status(name, p));
        }
        return out.join('\n');
    }));
    tool('BodyIntake', 'Record drinking or eating the moment it happens.', {
        who: str('Character name'),
        water_l: { type: 'number', description: 'Water drunk, litres (a cup 0.25, a bottle 0.5–1)' },
        food_kcal: { type: 'number', description: 'Food energy eaten, kcal (bread slice 80, apple 95, meal 600–900)' },
        alcohol_g: { type: 'number', description: 'Pure alcohol drunk, grams (beer 330 mL 13 g, wine glass 150 mL 14 g, spirit shot 40 mL 13 g)' },
    }, ['who'], a => run(st => {
        const { p, error } = who(st, a.who);
        if (!p)
            return error;
        intake(p, a);
        return status(a.who, p);
    }));
    tool('Communicate', 'Decide what a message carries from one character to another (speech or gesture) before narrating a reply or reaction. Returns whether the words, only the tone, or nothing reaches the listener.', {
        speaker: str('Character sending the message'),
        listener: str('Character receiving it'),
        means: { type: 'string', enum: ['speech', 'gesture'] },
        lit: { type: 'boolean', description: 'Enough light to see a gesture. Default true.' },
        distance_m: { type: 'number', description: 'Distance between them, m. Default 1.' },
        effort: { type: 'string', enum: ['normal', 'raised', 'loud', 'shout'], description: 'Vocal effort. Default normal; whisper is not modelled.' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between them. Default none.' },
        speaker_species: str('Speaker\'s DF creature when it has no tracker profile.'),
        listener_species: str('Listener\'s DF creature when it has no tracker profile.'),
        message: str('What the message says, one short sentence. When it reaches the listener, the listener comes to know it.'),
    }, ['speaker', 'listener'], a => run(st => {
        const s = who(st, a.speaker, a.speaker_species), l = who(st, a.listener, a.listener_species);
        if (!s.p || !l.p)
            return s.error || l.error;
        const langs = [fromTracker(a.speaker).languages, fromTracker(a.listener).languages];
        const out = communicate(a.speaker, s.p, a.listener, l.p, { means: a.means, lit: a.lit !== false, languages: langs, distance: a.distance_m ?? 1, effort: a.effort ?? 'normal', noise: a.noise ?? 'quiet room', barrier: a.barrier ?? 'none' });
        if (!a.message || !/makes out (every word|most words|some words)|sees the gesture/.test(out) || /language it does not know/.test(out))
            return out;
        learn(st, a.message, [a.speaker, a.listener], false, { [a.listener]: `told by ${a.speaker}` });
        return `${out} ${a.listener} now knows: ${a.message}`;
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
    }, ['who', 'about', 'matters'], a => run(() => {
        const types = occTypes({ about: a.about, good: a.good !== false, wants: a.wants_it_for_them !== false, cameTrue: a.came_true !== false,
            praiseworthy: a.praiseworthy !== false, result: a.result_for_them ?? 'none', appealing: a.appealing !== false });
        if (!types)
            return `Unknown appraisal "${a.about}". Use one of: ${ABOUT.join('; ')}.`;
        if (a.matters === MATTERS[0])
            return `${a.who} feels nothing in particular${a.target ? ` about ${a.target}` : ''}: below the threshold of an emotion.`;
        const strong = a.matters === MATTERS[2];
        const words = (t) => { const w = TYPES[t].words.split(', '), h = Math.ceil(w.length / 2); return (strong ? w.slice(h - 1) : w.slice(0, h)).join(', '); };
        const [main, ...with_] = types;
        return `${a.who} feels ${main}${with_.length ? `, together with ${with_.join(' and ')}` : ''}${a.target ? ` (${a.target})` : ''}. Words at this strength: ${words(main)}; it grows stronger ${TYPES[main].stronger}.`;
    }));
    tool('Price', 'Decide what goods cost, what a day of work pays, or what a year of necessities costs, in a European city between 1500 and 1913, before narrating a sale, a wage or a bill. Returns grams of silver and the days a building labourer works to earn it.', {
        question: { type: 'string', enum: PRICE_QUESTIONS },
        item: { type: 'string', enum: GOODS_LIST, description: 'For the price of goods' },
        quantity: { type: 'number', description: 'Units of the item (kg, litres, eggs, metres) or days of work. Default 1.' },
        trade: { type: 'string', enum: TRADES, description: 'For a daily wage. Default building labourer.' },
        city: { type: 'string', enum: CITIES, description: 'The city, or the nearest listed one in the same country' },
        year: { type: 'number', description: 'Story year. Default: the year in [TIME].' },
    }, ['question', 'city'], a => run(st => {
        const year = a.year ?? storyYear(st);
        if (year == null)
            return NO_YEAR;
        const r = price(a.question, a.item, a.trade, Number(a.quantity) || 1, a.city, year);
        if ('error' in r)
            return r.error;
        const g = r.silver >= 10 ? Math.round(r.silver) : Math.round(r.silver * 100) / 100;
        const days = r.labourDays == null ? '' : `; a building labourer earns that in ${r.labourDays >= 10 ? Math.round(r.labourDays) : Math.round(r.labourDays * 10) / 10} days`;
        return `${r.what} in ${a.city}, ${year}: ${g} g of silver${days}${r.note ? ` (${r.note})` : ''}.`;
    }));
    tool('NameCharacter', 'Give a first name to a character in an American setting whose name the story has not fixed, before naming them. Drawn by how many US babies of that sex got the name in their birth decade (1910–2029).', {
        who: str('Label of the character (e.g. "the waitress")'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth (story year minus age)' },
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const n = drawName(a.sex, Number(a.birth_year), rng);
        return n ? `${a.who}: first name ${n}.` : 'US name data cover births 1910–2029.';
    }));
    tool('BodySize', 'Decide the height and body mass of an adult character the story has not described, before describing them, from their country, sex and birth year. Records the mass for the body rules.', {
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
            return 'Give country: no place is set yet.';
        const r = bodySize(country, a.sex, a.birth_year, year, () => gauss(rng));
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
        return `${a.who}: ${Math.round(r.heightCm)} cm, ${p.mass} kg. Write "${a.who} (${p.mass} kg)" in the tracker profile.`;
    }));
    tool('Disease', 'Decide the course of a contagious disease before narrating it: when a character who caught it first shows symptoms, or how many people in a community fall ill over the whole outbreak.', {
        disease: { type: 'string', enum: DISEASES },
        question: { type: 'string', enum: ['when symptoms start', 'how many fall ill'] },
        who: str('For "when symptoms start": the character who caught it'),
        population: { type: 'number', description: 'For "how many fall ill": people in the community who mix with each other' },
        immune_share: { type: 'number', description: 'Share 0–1 already immune (had it before or vaccinated). Default 0.' },
    }, ['disease', 'question'], a => run((st, rng) => {
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
        surprise: { type: 'boolean', description: 'The defenders were unaware of the attack until it struck (no warning from sentries or scouts)' },
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
    tool('Weather', 'Decide the day\'s weather at the story\'s place from the date and hour in [TIME], before describing it: rain, snow or dry, the amount, the day\'s high and low and the temperature now. The same date always gives the same weather.', {
        place: str('The town or city the scene is in or nearest to ("Lyon", "Kyoto", "Sydney, Australia"); for a fictional or remote place, the nearest real town or give latitude and longitude. Default: the last place given.'),
        latitude: { type: 'number', description: 'For a place with no data: latitude; the nearest listed city is used' },
        longitude: { type: 'number', description: 'Longitude, with latitude' },
    }, [], a => run(st => {
        const known = st.setting?.place && !a.place && a.latitude == null ? { key: st.setting.place, label: st.setting.label ?? '', lat: st.latitude ?? null, country: st.setting.country ?? null } : null;
        const place = known ?? findPlace(a.place, a.latitude, a.longitude);
        if (!place)
            return a.place ? `No weather data for "${a.place}": give the nearest real town, or latitude and longitude.` : 'Give place: no place is set yet.';
        const w = weatherAt(place.key, storyNow(st));
        if (!w)
            return 'Weather needs a calendar date (dd/mm/yyyy) and hour in [TIME].';
        setPlace(st, place);
        const { d, date } = w, r = (x) => Math.round(x);
        const amount = `${d.rainMm >= 10 ? r(d.rainMm) : Math.round(d.rainMm * 10) / 10} mm`;
        const sky = !d.wet ? 'dry' : (d.tmaxC + d.tminC) / 2 <= 1.0 ? `snow, ${amount} of water over the day` : `rain, ${amount} over the day`;
        return `${place.label}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}: ${sky}; high ${r(d.tmaxC)} °C, low ${r(d.tminC)} °C; now about ${r(w.tempC)} °C.`;
    }));
    // A character's pick among options is drawn, weighted by how many people in their place would take each one: weighted
    // random from all choices (Mark 2009, Behavioral Mathematics for Game AI, ch. 16), probabilistic choice as in McFadden's
    // conditional logit (1974); the narrator states the shares, code draws (models are biased random generators: Van
    // Koevering & Kleinberg 2024).
    tool('Choose', 'Decide what a character does when they have several real options (fight, flee or bargain; which road; whom to trust), before narrating it. Give each option with how many people in their place would take it; code draws one.', {
        who: str('The character choosing'),
        options: { type: 'array', items: { type: 'object', properties: { option: { type: 'string' }, share: { type: 'string', enum: SHARES } }, required: ['option', 'share'] }, description: 'Two or more distinct options (not two wordings of one), each with the share of people in this character\'s place who would take it' },
    }, ['who', 'options'], a => run((st, rng) => {
        const seen = new Set(), opts = (a.options ?? []).filter(o => o?.option && !seen.has(o.option.toLowerCase().trim()) && seen.add(o.option.toLowerCase().trim()));
        if (opts.length < 2)
            return 'Give two or more options.';
        const w = opts.map(o => Math.max(0.01, shareOf(o.share))), total = w.reduce((x, y) => x + y, 0);
        let u = rng() * total, pick = opts[opts.length - 1];
        for (let i = 0; i < opts.length; i++)
            if ((u -= w[i]) < 0) {
                pick = opts[i];
                break;
            }
        return `${a.who} chooses: ${pick.option}.`;
    }));
    tool('RecordFact', 'Fix a fact the moment the story establishes it (a place, an object, a person, a secret, an event) and record who knows it: those who saw it, heard it, read it or were told it. A recorded fact stays true for the rest of the story and appears in [KNOWS].', {
        fact: str('The fact, one short sentence'),
        known_by: { type: 'array', items: { type: 'string' }, description: 'Characters who know it' },
        common_knowledge: { type: 'boolean', description: 'Known to everyone in the setting (a public event, a famous place, a well-known custom)' },
        how: str('How the knowers learned it, when they learned it the same way: saw it, heard it, read it, told by a named person, rumour'),
    }, ['fact'], a => run(st => {
        const f = learn(st, a.fact, a.known_by ?? [], !!a.common_knowledge, a.how ? Object.fromEntries((a.known_by ?? []).map(k => [k, a.how])) : {});
        return `Fact ${f.id} recorded: ${f.text.replace(/[.!?]?$/, '.')} Known by ${f.everyone ? 'everyone' : f.knowers.join(', ') || 'no one yet'}.`;
    }));
    tool('Listen', 'Decide whether a character hears a sound (a shot, footsteps, hoofbeats, an engine) before narrating whether they react. Code decides from loudness, distance, background noise, walls and the listener\'s hearing.', {
        listener: str('Character who might hear it'),
        listener_species: str('Listener\'s DF creature when it has no tracker profile.'),
        sound: { type: 'string', enum: Object.keys(SOUNDS) },
        spl_db: { type: 'number', description: 'Loudness at 1 m, dB SPL, for a sound that fits no class in the list (from a published measurement)' },
        distance_m: { type: 'number', description: 'Distance from the sound, m' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between. Default none.' },
    }, ['listener', 'distance_m'], a => run(st => {
        const l = who(st, a.listener, a.listener_species);
        if (!l.p)
            return l.error;
        return listen(a.listener, l.p, { sound: a.sound, spl_db: a.spl_db ?? null, distance: a.distance_m, noise: a.noise ?? 'quiet room', barrier: a.barrier ?? 'none' });
    }));
    tool('Look', 'Decide whether a character sees something at a distance (a person, an animal, a vehicle) before narrating it. Code rolls notice / recognize / identify from size, distance, light and visibility.', {
        viewer: str('Character who might see it'),
        viewer_species: str('Viewer\'s DF creature when it has no tracker profile.'),
        target: str('What might be seen, a few words'),
        size_m: { type: 'number', description: 'Smallest visible dimension of the target, m (standing person 0.5, horse 0.6, wagon or car 1.5)' },
        distance_m: { type: 'number', description: 'Distance, m' },
        light: { type: 'string', enum: ['overcast day', 'dim street or public lighting', 'living room', 'office'], description: 'Only for an overcast sky or artificial light. Leave it out otherwise: code takes daylight, twilight, moonlight or starlight from the date, hour and latitude.' },
        latitude: { type: 'number', description: 'Latitude of the place, degrees (north +, south −), when the story moves to a new region. Kept for later calls.' },
        visibility_m: { type: 'number', description: 'Meteorological visibility, m (clear air 20000; haze 5000; mist 2000; fog 500; thick fog 50)' },
    }, ['viewer', 'size_m', 'distance_m'], a => run((st, rng) => {
        const v = who(st, a.viewer, a.viewer_species);
        if (!v.p)
            return v.error;
        if (Number.isFinite(a.latitude))
            st.latitude = a.latitude;
        // Story dates (dd/mm/yyyy) parse to minutes from year 1; a bare "Day N" count stays below 146 097 days (400 years) [ASSUMED].
        const t = storyNow(st);
        const sky = !a.light && t !== null && t / 1440 > 146097 && st.latitude != null && Number.isFinite(st.latitude) ? skyLight(t, st.latitude) : null;
        return look(a.viewer, v.p, { size_m: a.size_m, distance_m: a.distance_m, light: sky?.lux ?? a.light ?? 'daylight', lightLabel: sky?.label ?? null, visibility_m: a.visibility_m ?? 20000 }, rng);
    }));
    // One tool for a person's social response, the situation as an enum (as RPG-MCP consolidated 195 tools into 36 with action
    // enums; function-calling accuracy drops as the number of functions grows, Patil et al. 2025, BFCL).
    tool('SocialResponse', 'Decide how a person responds in a social situation whose outcome is in doubt, before narrating it: whether they take a statement for a lie, step in to help in an emergency, carry out an order to hurt someone, grant a stranger a small favour, or want to see someone again after a first meeting.', {
        situation: { type: 'string', enum: SOCIAL },
        who: str('The person whose response is decided'),
        speaker: str('For a statement: who made it'),
        is_lie: { type: 'boolean', description: 'For a statement: whether it is in fact a lie (known from the story)' },
        statement: str('For a statement: the statement in a few words'),
        others: { type: 'number', description: 'For an emergency: how many other people the person believes also witness it' },
        emergency: { type: 'string', enum: SITUATIONS, description: 'For an emergency. Default victim in danger.' },
        order: { type: 'string', enum: Object.keys(OBEY), description: 'For an order to hurt someone: its circumstances' },
        request: str('For a favour: the request in a few words'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'For a first meeting: sex of the person whose interest is decided' },
        many_options: { type: 'boolean', description: 'For a first meeting: they meet many prospective partners at once (15 or more)' },
    }, ['situation', 'who'], a => run((st, rng) => {
        switch (a.situation) {
            case SOCIAL[0]: {
                const l = who(st, a.who), s = who(st, a.speaker);
                const r = judgeStatement(!!a.is_lie, rng, { speaker: (s.p ?? null), listener: (l.p ?? null) });
                return `${a.who} ${r.judgedLie ? 'judges it a lie' : 'believes it'}, from ${a.speaker ?? 'the speaker'}'s manner alone: no proof either way.`;
            }
            case SOCIAL[1]: {
                const n = Number(a.others) || 0, p = helpChance(n, a.emergency ?? 'victim in danger');
                return `${a.who} ${rng() < p ? 'steps in to help' : 'does not step in'} (${n > 0 ? `with ${n} other${n > 1 ? 's' : ''} watching` : 'alone with it'}).`;
            }
            case SOCIAL[2]: {
                if (!a.order || !OBEY[a.order])
                    return `Give order, one of: ${Object.keys(OBEY).join('; ')}.`;
                return `${a.who} ${rng() < OBEY[a.order] ? 'carries the order out to the end' : 'refuses before the end'} (${a.order}).`;
            }
            case SOCIAL[3]: return `${a.who} ${rng() < SMALL_REQUEST_YES ? 'agrees' : 'declines'}${a.request ? ` (${a.request})` : ''}.`;
            case SOCIAL[4]: {
                if (!a.sex)
                    return 'Give sex for a first meeting.';
                const pr = interestChance(a.sex, !!a.many_options);
                return `${a.who} ${rng() < pr ? 'is interested and would meet again' : 'is not interested'}${a.many_options ? ' (one of many suitors met at once)' : ''}.`;
            }
            default: return `Give situation, one of: ${SOCIAL.join('; ')}.`;
        }
    }));
    tool('HoldOn', 'Decide whether a person can hang on by their hands (a ledge, a rope, a branch) or carry a load by its handles, before narrating it.', {
        who: str('Character holding on'),
        hanging: { type: 'boolean', description: 'Hanging by the hands: the load is the character\'s own body' },
        load_kg: { type: 'number', description: 'Mass carried by handles, kg (when not hanging)' },
        hands: { type: 'number', description: 'Hands used, 1 or 2. Default 2.' },
        seconds: { type: 'number', description: 'How long the hold must last, s (until help arrives, to cross the gap)' },
        region: { type: 'string', enum: Object.keys(REGIONS), description: 'World region the character grew up in, when known. Kept for later calls.' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (!p)
            return error;
        if (a.region)
            p.region = a.region;
        return holdLoad(a.who, p, { load_kg: a.load_kg, hands: a.hands ?? 2, hanging: !!a.hanging, seconds: a.seconds ?? null }, rng);
    }));
    tool('Chase', 'Decide whether a pursuer catches someone running away over open ground, from their species\' top speeds and leg injuries.', {
        pursuer: str('Character chasing'), pursuer_species: str('Pursuer\'s DF creature when it has no tracker profile.'),
        fleeing: str('Character running away'), fleeing_species: str('Fleeing character\'s DF creature when it has no tracker profile.'),
        gap_m: { type: 'number', description: 'Head start, m' },
    }, ['pursuer', 'fleeing', 'gap_m'], a => run(st => {
        const p = who(st, a.pursuer, a.pursuer_species), f = who(st, a.fleeing, a.fleeing_species);
        if (!p.p || !f.p)
            return p.error || f.error;
        return chase(a.pursuer, p.p, a.fleeing, f.p, a.gap_m);
    }));
    tool('NewCharacter', 'Decide the sex, age, occupation and birthplace of a character who appears for the first time and whom the story has not described (a stranger, a passer-by, the person behind the counter), before describing them. Drawn from the 1881 census of England and Wales.', {
        who: str('Name or label for the character (e.g. "the innkeeper", "stranger 2")'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'Only when the story already fixes it' },
        occupation: str('Only when the story already fixes it, in a word or two (innkeeper, carter, blacksmith, servant)'),
        min_age: { type: 'number', description: 'Only when the story already fixes it (e.g. 18 for someone serving drinks)' },
    }, ['who'], a => run((st, rng) => {
        const r = drawPerson({ sex: a.sex ?? null, occupation: a.occupation ?? null, minAge: Number(a.min_age) || 0 }, rng);
        if ('error' in r)
            return r.error;
        const { p } = who(st, a.who);
        if (p)
            Object.assign(p, { age: r.age, sex: r.sex });
        const noun = r.age < 15 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
        return `${a.who}: a ${r.age}-year-old ${noun}; ${r.occupation ? `occupation: ${r.occupation}` : r.age < 15 ? 'a child, no occupation' : 'no stated occupation'}; born in ${r.born}.`;
    }));
    tool('BodyCheck', 'Resolve an action with an uncertain outcome that no other rule tool resolves, before narrating it. The body state in [BODY] is applied in code.', {
        who: str('Character acting'),
        species,
        task: str('The task in a few words. A real second attempt names it ("pick lock, 2nd try"); the same task again this turn returns the first result.'),
        reference_class: str('The wider class of attempts this one belongs to (e.g. "amateurs picking an old door lock")'),
        base_share: { type: 'string', enum: SHARES, description: 'How many attempts in that reference class succeed.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this attempt: how many people with this character\'s training succeed at it in these conditions, unhurt.' },
        uses: { type: 'array', items: { type: 'string', enum: [...Object.keys(FUNCTIONS), 'alertness'] }, description: 'Body abilities the task depends on: grasp (hands, claws that hold), stance (feet), sight, hearing, smell, breathing; alertness for tasks needing attention, judgment or quick reactions (driving, aiming, spotting, fine work).' },
        exertion: { type: 'string', enum: ['none', 'light', 'heavy'] },
        on_feet: { type: 'boolean', description: 'The task needs standing or walking unaided' },
        timed: { type: 'boolean', description: 'The task must be done within a time that leaves no slack (a lock picked before the guard turns, a sum shouted in a race)' },
        fine: { type: 'boolean', description: 'The task needs fine finger work with bare fingers (tying a knot, loading a cartridge, picking a lock, writing)' },
        override: { type: 'boolean', description: 'Set only after BodyCheck named another tool and the task is genuinely not what that tool decides' },
    }, ['who', 'task', 'reference_class', 'base_share', 'share'], a => run((st, rng) => check((who(st, a.who, a.species).p ?? person(st, a.who)), { ...a, share: combined(a) }, rng)));
    tool('BodyTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id (not needed for antivenom, antibiotics, laparotomy, oxygen or transfuse)' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load', 'antivenom', 'antibiotics', 'laparotomy', 'oxygen', 'hyperbaric_oxygen'] },
        training: { type: 'string', enum: ['untrained', 'instructions', 'trained'], description: 'For stop_bleeding: the person treating has no first-aid training, has written or phone instructions, or has formal bleeding-control training (medic, Stop the Bleed course). Default untrained.' },
    }, ['who', 'treatment'], a => run((st, rng) => {
        const p = (who(st, a.who).p ?? person(st, a.who));
        return `${treat(p, Number(a.wound), a.treatment, rng, { training: a.training ?? 'untrained' })} ${status(a.who, p)}`;
    }));
    tool('BodyContact', 'Skin touches something hot (a stove, a pot handle, spilled hot water or oil) for a stated time. Code decides any burn.', {
        who: str('Character name'),
        species,
        regions: { type: 'array', items: { type: 'string' }, description: 'Body regions touching it: right hand, left hand, face, chest, back, left foot, …' },
        material: { type: 'string', enum: CONTACT_MATERIALS },
        temp_c: { type: 'number', description: 'Temperature of the object or liquid, °C' },
        seconds: { type: 'number', description: 'Contact time in seconds' },
    }, ['who', 'regions', 'material', 'temp_c', 'seconds'], a => run((st, rng) => {
        const p = (who(st, a.who, a.species).p ?? person(st, a.who));
        return `${contactBurn(p, a.regions, a.material, a.temp_c, a.seconds, rng)} ${status(a.who, p)}`;
    }));
    tool('PassTime', 'Advance story time for every tracked character. Call before narrating any time passing. List who is active (working, fighting) and who sleeps; walkers go in walking with speed, load, slope and terrain. Time stops early when someone\'s condition changes; narrate that moment, then call again for the remaining minutes.', {
        minutes: { type: 'number', description: 'Minutes that pass' },
        resting: { type: 'array', items: { type: 'string' }, description: 'Characters not casting or fighting during this time' },
        active: { type: 'array', items: { type: 'string' }, description: 'Characters walking, working, fighting or in heat during this time (more water and food used)' },
        sleeping: { type: 'array', items: { type: 'string' }, description: 'Characters asleep during this time' },
        walking: {
            type: 'array',
            description: 'Characters walking or marching during this time, with pace, load and ground; sets their energy use, heat and distance covered',
            items: { type: 'object', properties: {
                    who: str('Character'), speed_kmh: { type: 'number', description: 'Walking speed, km/h (stroll 3, normal 5, brisk 6.5)' },
                    load_kg: { type: 'number', description: 'Carried load, kg' }, grade_pct: { type: 'number', description: 'Slope, % (uphill positive)' },
                    terrain: { type: 'string', enum: Object.keys(TERRAIN) },
                    running: { type: 'boolean', description: 'Running rather than walking' },
                }, required: ['who', 'speed_kmh'] },
        },
    }, ['minutes'], a => run((st, rng) => {
        const asked = Math.max(0, Math.round(a.minutes));
        const walkers = [];
        for (const w of a.walking || []) {
            const p = st.people?.[w.who];
            if (!p)
                continue;
            try {
                p.workMet = metOf((w.running ? runWatts : pandolf)(p.mass, w.load_kg, w.speed_kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road'), p.mass);
            }
            catch (e) {
                return `${e.message} Nothing recorded.`;
            }
            walkers.push([w.who, p, w.speed_kmh]);
        }
        // Characters outdoors at a weather station: time runs in hour steps, each taking the air temperature at its start.
        const t0 = storyNow(st), weathered = t0 !== null && Object.values(st.people || {}).some(p => p.weather && p.env);
        let elapsed = 0, events = [];
        do {
            if (weathered)
                applyWeather(st.people, t0 + elapsed);
            const step = weathered ? Math.min(60, asked - elapsed) : asked - elapsed;
            const r = advanceAll(st.people || {}, step, new Set(a.resting || []), rng, { active: new Set(a.active || []), sleeping: new Set(a.sleeping || []) });
            elapsed += r.elapsed;
            events = r.events;
            if (events.length || r.elapsed < step)
                break;
        } while (elapsed < asked);
        if (t0 !== null && st.clock)
            st.clock.add += elapsed;
        const walked = walkers.map(([n, p, kmh]) => { const met = p.workMet ?? 0; delete p.workMet; return `${n} walked ${Math.round(kmh * elapsed / 60 * 10) / 10} km at ${Math.round(met * 10) / 10} MET`; });
        const head = (events.length
            ? `Time stopped after ${elapsed} of ${asked} minutes: ${events.join('; ')}. ${asked - elapsed} minutes remain.`
            : `${elapsed} minutes passed.`) + (walked.length ? ` ${walked.join('; ')}.` : '');
        const lines = Object.entries(st.people || {}).map(([who, p]) => status(who, p));
        return [head, ...lines].join('\n');
    }));
    tool('CastSpell', 'Resolve a spell cast before narrating it.', {
        who: str('Caster name'),
        complexity: { type: 'number', description: 'Spell complexity 1-9' },
    }, ['who', 'complexity'], a => run(st => {
        const p = (who(st, a.who).p ?? person(st, a.who));
        return `${cast(p, Math.max(1, Math.min(9, Math.round(a.complexity))))} ${status(a.who, p)}`;
    }));
    tool('BodyFall', 'Resolve a fall before narrating its outcome.', {
        who: str('Character name'),
        species,
        height_m: { type: 'number', description: 'Height fallen, m' },
        soft: { type: 'boolean', description: 'Soft ground: water, snow, foliage' },
        head_first: { type: 'boolean', description: 'Landed head first' },
    }, ['who', 'height_m'], a => run((st, rng) => {
        const p = (who(st, a.who, a.species).p ?? person(st, a.who));
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first }, rng);
    }));
    tool('BodyStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
        species,
    }, ['who'], a => run(st => status(a.who, (who(st, a.who, a.species).p ?? person(st, a.who)))));
}
