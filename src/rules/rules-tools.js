import { NOISE, BARRIER, SOUNDS } from './acoustics.js';
import { LIGHT } from './vision.js';
import { judgeStatement, helpChance, OBEY, SMALL_REQUEST_YES, interestChance, SITUATIONS } from './social.js';
import { CONTACT_MATERIALS } from './thermal/exposure.js';
import { drawPerson } from './census.js';
import { REGIONS } from './strength.js';
import { learn, knowledgeBlock } from './knowledge.js';
import { ABOUT, TYPES, occType } from './emotion.js';
import { skyLight } from './sky.js';
import { price, PRICE_QUESTIONS, GOODS_LIST, TRADES, CITIES } from './prices.js';
import { drawName } from './names.js';
import { DISEASES, INCUBATION, R0, incubationHours, attackShare } from './disease.js';
import { nowMinutes } from '../features/journal-calendar.js';
import { gauss, person, addWound, treat, advanceAll, cast, fall, status, seededRng, strike, check, openWound, findPart, creatureOf, FUNCTIONS, communicate, intake, choke, setEnvironment, setAltitude, contactBurn, listen, look, holdLoad, chase } from './body-engine.js';
import { thermalCapable } from './thermal/exposure.js';
import { TERRAIN, pandolf, runWatts, metOf } from './work.js';
import { ENSEMBLES, GARMENTS } from './thermal/ensembles.js';
import { loadRaws, creatureId, creature } from './df/index.js';
import { SKILL_LEVELS, STYLES } from './df/combat.js';
import { turnKey } from '../state/dice-ledger.js';
import { getSettings } from '../../state-manager.js';

const TOOLS = ['BodyEnvironment', 'BodyChoke', 'BodyIntake', 'Communicate', 'Listen', 'Look', 'JudgeStatement', 'Bystander', 'ObeyOrder', 'AskStranger', 'FirstImpression', 'NewCharacter', 'RecordFact', 'Appraise', 'Price', 'NameCharacter', 'Disease', 'HoldOn', 'Chase', 'BodyCheck', 'BodyWound', 'BodyStrike', 'BodyTreat', 'BodyContact', 'PassTime', 'CastSpell', 'BodyFall', 'BodyStatus'];
const KEEP_SNAPSHOTS = 30;

function store() {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.rulesEngine ??= { state: { people: {} }, snapshots: {} };
    ctx.chatMetadata.rulesEngine.salt ??= crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    return ctx.chatMetadata.rulesEngine;
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
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return;
    const s = store();
    const chat = ctx.chat || [];
    const rewrites = (type === 'swipe' || type === 'regenerate') && chat.length && !chat.at(-1).is_user;
    if (rewrites) {
        const snap = s.snapshots[chat.length - 1];
        if (snap) {
            s.state = structuredClone(snap.state ?? snap);
            s.calls = snap.calls ?? 0;
        }
        s.decided = null;
    } else if (!type || type === 'normal') {
        if (chat.at(-1)?.is_user) s.calls = 0;
        s.snapshots[chat.length] = { state: structuredClone(s.state), calls: s.calls || 0 };
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS)) delete s.snapshots[k];
    }
}

/** MESSAGE_RECEIVED: keep the state each swipe ended with, like Multihog's rpgMemoResult. */
export function onRulesMessageReceived(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!ctx.chatMetadata || !msg || msg.is_user || msg.is_system) return;
    msg.extra ??= {};
    msg.extra.rulesResult ??= {};
    msg.extra.rulesResult[msg.swipe_id ?? 0] = structuredClone(store().state);
    (ctx.saveChatDebounced || ctx.saveChat)?.();
}

/** MESSAGE_SWIPED: returning to an earlier swipe restores the state it ended with. */
export function onRulesSwiped(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    const saved = msg?.extra?.rulesResult?.[msg.swipe_id ?? 0];
    if (!ctx.chatMetadata || !saved) return;
    restore(saved);
}

const isReply = m => m && !m.is_user && !m.is_system && !m.extra?.tool_invocations;

function restore(saved) {
    store().state = structuredClone(saved);
    save();
}

/** CHAT_CHANGED / MESSAGE_DELETED: state = what the last reply ended with, so a branch or deletion starts from its own point. */
export function syncRulesToChat() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return;
    const msg = [...(ctx.chat || [])].reverse().find(isReply);
    const saved = msg?.extra?.rulesResult?.[msg.swipe_id ?? 0];
    if (saved) restore(saved);
}

/** Linear Stone restore: find the reply whose State Tracker result is this memo and take its rule-engine state. */
export function restoreRulesForMemo(memo) {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return false;
    for (const msg of [...(ctx.chat || [])].reverse()) {
        const results = msg?.extra?.rpgMemoResult;
        if (!isReply(msg) || !results) continue;
        const swipe = Object.keys(results).find(k => results[k] === memo && msg.extra.rulesResult?.[k]);
        if (swipe !== undefined) { restore(msg.extra.rulesResult[swipe]); return true; }
    }
    return false;
}

// The narrator gets the outcome only: chances, intermediate values and citations are salient details that anchor or
// leak into the narration (models are distracted by irrelevant context: Shi et al. 2023, ICML). The full text goes to the
// browser console.
const DETAIL = /\s*\([^()]*(?:%|\b(?:1[89]|20)\d\d\b|\bSII\b|chance)[^()]*\)/g;
const ODDS = /\b(?:death )?chance \d+(?:\.\d+)? ?%\s*(?:→|—)\s*/g;
export function plain(out) {
    if (typeof out !== 'string') return out;
    const short = out.replace(DETAIL, '').replace(ODDS, '');
    if (short !== out) console.debug('[Rules engine]', out);
    return short;
}

// A decision tool called again in one turn for the same actor and act returns its first result, like RollTheDice's ledger,
// so an unwanted outcome cannot be re-rolled by calling again (models drop correct answers when pushed: Sharma et al. 2024).
const norm = v => String(v ?? '').toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim();
const DECIDES = { BodyCheck: a => [a.who, a.task], Communicate: a => [a.speaker, a.listener, a.means], Listen: a => [a.listener, a.sound ?? a.spl_db],
    Look: a => [a.viewer, a.target ?? a.size_m], JudgeStatement: a => [a.listener, a.speaker, a.statement], Bystander: a => [a.who],
    ObeyOrder: a => [a.who], AskStranger: a => [a.who, a.request], HoldOn: a => [a.who], Chase: a => [a.pursuer, a.fleeing], FirstImpression: a => [a.who],
    NewCharacter: a => [a.who], NameCharacter: a => [a.who], Disease: a => [a.question, a.disease, a.who ?? a.population] };
const decisionKey = (name, a) => DECIDES[name] && [name, ...DECIDES[name](a ?? {})].map(norm).join('|');
function decisions() {
    const s = store(), turn = turnKey(SillyTavern.getContext().chat);
    if (s.decided?.turn !== turn) s.decided = { turn, out: {} };
    return s.decided.out;
}
const decided = (name, a) => { const k = decisionKey(name, a); return k ? decisions()[k] : null; };
function remember(name, a, out) { const k = decisionKey(name, a); if (k && typeof out === 'string') { decisions()[k] = out; save(); } }

// Same turn + same call order → same random draws, so a swipe repeats outcomes instead of re-rolling them.
function run(fn) {
    const s = store();
    s.calls = (s.calls || 0) + 1;
    const rng = seededRng(`${s.salt}:${turnKey(SillyTavern.getContext().chat)}:${s.calls}`);
    const out = fn(s.state, rng);
    save();
    return out;
}

const str = d => ({ type: 'string', description: d });
// BodyCheck's success share as labelled options: models are calibrated on multiple-choice questions with the options shown
// (Kadavath et al. 2022, arXiv 2207.05221); band values [ASSUMED]. A bare number is still read.
// Option order is shuffled at each load: models prefer options by position and label rather than content (selection bias,
// Zheng et al. 2024, ICLR; their remedy permutes the options).
const shuffled = list => list.map(x => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
const SHARES = shuffled(['95% nearly everyone', '80% most', '65% more than half', '50% half', '35% fewer than half', '20% few', '5% almost no one']);
const shareOf = v => typeof v === 'number' ? v : (parseFloat(v) || 0) / 100;
// Intuitive estimates are not regressive enough; corrected = class share + ρ × (estimate − class share), with ρ ≈ τ = 2p − 1
// from p, the share of pairs whose order one would predict correctly (Kahneman & Tversky 1977, "Intuitive prediction: biases
// and corrective procedures", steps 1–5).
const ORDERING = shuffled(['50% (no better than chance)', '60% of pairs', '70% of pairs', '80% of pairs', '90% of pairs']);
function regressive(a) {
    const est = shareOf(a.share);
    if (a.base_share == null) return est;
    const base = shareOf(a.base_share), rho = Math.max(0, 2 * ((parseFloat(a.ordering) || 50) / 100) - 1);
    return base + rho * (est - base);
}
const species = str('DF creature of this character, by name or id (human, wolf, horse, giant wolf); read when the character first appears. Default human.');
const partArg = str('Body part by its name: e.g. head, throat, upper body, lower body, right upper arm, left hand, right lower leg, left eye.');

/** Species id from a tool argument: 'HUMAN' when absent, null when no DF creature matches. */
const speciesOf = text => text ? creatureId(text) : 'HUMAN';
const noSpecies = text => `No DF creature "${text}". Nothing recorded.`;

/** Species and mass from the State Tracker profile of `name`: its "Name (N kg)" header and the "Species:" line below it. */
function fromTracker(name) {
    const memo = String(getSettings()?.currentMemo || '');
    const esc = String(name || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!esc) return {};
    const m = memo.match(new RegExp(`^[\\s*-]*${esc}\\s*\\(([\\d.]+)\\s*kg\\)[^\\n]*\\n((?:[^\\n]*\\S[^\\n]*(?:\\n|$)){0,12})`, 'mi'));
    if (!m) return {};
    const languages = m[2].match(/^\s*Languages?:\s*(.+)$/mi)?.[1]?.split(',').map(x => x.trim().toLowerCase()).filter(Boolean);
    return { mass: Number(m[1]) || undefined, species: m[2].match(/^\s*Species:\s*(.+)$/mi)?.[1]?.trim(), languages };
}

/** The tracked person `name`; on first appearance species and mass come from the arguments, else the tracker, else human. */
function who(st, name, speciesArg, massArg) {
    const known = st.people?.[name];
    const t = known ? {} : fromTracker(name);
    const text = speciesArg || t.species;
    const sp = speciesOf(text);
    if (!sp) return { error: noSpecies(text) };
    // DF names some creatures only in legends ([DOES_NOT_EXIST], no body): chimera, centaur, griffon.
    if (!known && !creature(sp)?.parts.length) return { error: `DF defines no body for "${text}" (a creature of legend only). Nothing recorded.` };
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
- A change of climate, weather, clothing, water or air → BodyEnvironment.
- Time passing → PassTime; when it stops early, narrate the moment it reports.
Senses
- A sound that might be heard → Listen. Something that might be seen → Look. A message whose arrival is in doubt, or that teaches a fact → Communicate.
People
- A character the story has not described → NewCharacter; their first name → NameCharacter.
- A statement that might be a lie → JudgeStatement. A bystander who might help → Bystander. An order to hurt someone → ObeyOrder. A small favour from a stranger → AskStranger. Interest after a first meeting → FirstImpression.
- A character's feelings about something → Appraise.
- A fact the story establishes, or something a character learns → RecordFact.
World
- A price, a wage or a bill → Price. A contagious disease → Disease. A spell → CastSpell. A random pick (a door, a coin, a card) → RollTheDice with kind "table".
Principles
- A character's species and mass come from their tracker profile ("Name (N kg)", "Species:"); give species in the first rule-tool call for a character without one.
- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now. Facts in [KNOWS] stay true.
- A player's message says what their character tries. Whether it works comes from the tools, also when the message states the result or disputes an earlier one; a result stands.
</rule_engine>`;

/** The per-turn [KNOWS] block for the current chat, '' when nothing is recorded. */
export function knowledgeInjection() {
    const ctx = SillyTavern.getContext();
    return ctx.chatMetadata ? knowledgeBlock(store().state) : '';
}

export function registerRulesTools(enabled) {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool) return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    if (!enabled) return;

    const tool = (name, description, properties, required, action) => registerFunctionTool({
        name, displayName: name, description,
        parameters: { type: 'object', properties, required },
        action: async args => {
            await loadRaws();
            const prior = decided(name, args);
            if (prior) return `Already decided this turn; this result stands. ${prior}`;
            const out = plain(await action(args));
            remember(name, args, out);
            globalThis._rpgRefreshRenderedView?.();
            return out;
        },
        formatMessage: () => '',
    });

    // Severity (vessel, fracture) is decided in code; the narrator names only the cause and place.
    tool('BodyWound', 'Record a wound the moment it happens when BodyStrike did not make it: a burn, a bite, an accident, a fall injury, or a hit by a weapon BodyStrike does not cover (arrow, bolt, bullet). Returns what the wound is and the body state.', {
        who: str('Character name'),
        species,
        part: partArg,
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'burn', 'bite'] },
        depth: { type: 'string', enum: ['superficial', 'partial', 'deep_partial', 'full'], description: 'Burns: superficial = red, no blisters; partial = blisters; deep_partial = pale, scars; full = through the skin.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const { p, error } = who(st, a.who, a.species);
        if (error) return error;
        const part = findPart(creatureOf(p), a.part);
        if (!part) return `${a.who} has no part "${a.part}". Parts: ${creatureOf(p).parts.map(x => x.name).join(', ')}. Nothing recorded.`;
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
        if (error) return error;
        const attacker = a.attacker && st.people?.[a.attacker] ? st.people[a.attacker] : null;
        const ta = attacker || !a.attacker ? {} : fromTracker(a.attacker);
        const asp = speciesOf(a.attacker_species || ta.species);
        if (!asp) return noSpecies(a.attacker_species || ta.species);
        const keys = ['weapon', 'launcher', 'material', 'skill', 'style', 'prone', 'from', 'awake', 'facing', 'lit', 'noise_db', 'noise_sound', 'under_fire', 'noise_khz', 'distance_m', 'approach_speed', 'sense_range_m', 'intent_visible'];
        const out = strike(p, { part: a.part, attack: a.attack, species: asp, mass: Number(a.attacker_mass_kg) || ta.mass, armor: a.target_armor,
            ...Object.fromEntries(keys.filter(k => a[k] !== undefined).map(k => [k, a[k]])) }, attacker, rng);
        return `${out} ${status(a.who, p)}`;
    }));

    tool('BodyChoke', 'Resolve a choke or strangling hold on the neck once the hold is locked, before narrating its effect.', {
        who: str('Character choked'),
        holder: str('Character holding the choke'),
        seconds: { type: 'number', description: 'Seconds the locked hold is kept on' },
    }, ['who', 'seconds'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (error) return error;
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
    }, ['who'], a => run(st => {
        const out = [];
        for (const name of a.who) {
            const { p, error } = who(st, name);
            if (error) { out.push(error); continue; }
            if (a.clear) { setEnvironment(p, null); out.push(`${name}: conditions cleared.`); continue; }
            if (a.altitude_m != null) setAltitude(p, a.altitude_m, !!a.sudden_ascent, !!a.decompression);
            if (a.air_c == null) { out.push(a.altitude_m != null ? status(name, p) : 'air_c is required.'); continue; }
            if (!thermalCapable(p.species) && !creatureOf(p)?.homeotherm) { out.push(`${name}: cold-blooded; body temperature not simulated; not recorded.`); continue; }
            try {
                setEnvironment(p, { ...a, clothing: { ensemble: a.ensemble, garments: a.garments } });
            } catch (e) { return `${e.message} Nothing recorded.`; }
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
        if (error) return error;
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
        if (s.error || l.error) return s.error || l.error;
        const langs = [fromTracker(a.speaker).languages, fromTracker(a.listener).languages];
        const out = communicate(a.speaker, s.p, a.listener, l.p, { means: a.means, lit: a.lit !== false, languages: langs, distance: a.distance_m ?? 1, effort: a.effort ?? 'normal', noise: a.noise ?? 'quiet room', barrier: a.barrier ?? 'none' });
        if (!a.message || !/makes out (every word|most words|some words)|sees the gesture/.test(out) || /language it does not know/.test(out)) return out;
        learn(st, a.message, [a.speaker, a.listener]);
        return `${out} ${a.listener} now knows: ${a.message}`;
    }));

    tool('Appraise', 'Decide which emotion a character feels about something, before narrating their feelings. The answers describe how the character sees it; the emotion type follows from them.', {
        who: str('Character feeling it'),
        about: { type: 'string', enum: ABOUT },
        target: str('The person, thing or event it is about, a few words'),
        good: { type: 'boolean', description: 'The event is (or would be) good for the one it affects. For an action: not used.' },
        likes_them: { type: 'boolean', description: 'For an event that affects someone else: the character likes that person' },
        came_true: { type: 'boolean', description: 'For a hoped-for or feared event: it came true' },
        praiseworthy: { type: 'boolean', description: 'For an action: the character judges it praiseworthy (false: blameworthy)' },
        result_for_them: { type: 'string', enum: ['good', 'bad', 'none'], description: 'For an action: what its result means for the character. Default none.' },
        appealing: { type: 'boolean', description: 'For a person or thing encountered: the character finds it appealing' },
    }, ['who', 'about'], a => run(() => {
        const type = occType({ about: a.about, good: a.good !== false, likes: a.likes_them !== false, cameTrue: a.came_true !== false,
            praiseworthy: a.praiseworthy !== false, result: a.result_for_them ?? 'none', appealing: a.appealing !== false });
        if (!type) return `Unknown appraisal "${a.about}". Use one of: ${ABOUT.join('; ')}.`;
        return `${a.who} feels ${type}${a.target ? ` (${a.target})` : ''}. Words for this emotion: ${TYPES[type].words}; it is stronger ${TYPES[type].stronger}.`;
    }));

    tool('Price', 'Decide what goods cost, what a day of work pays, or what a year of necessities costs, in a European city between 1500 and 1913, before narrating a sale, a wage or a bill. Returns grams of silver and the days a building labourer works to earn it.', {
        question: { type: 'string', enum: PRICE_QUESTIONS },
        item: { type: 'string', enum: GOODS_LIST, description: 'For the price of goods' },
        quantity: { type: 'number', description: 'Units of the item (kg, litres, eggs, metres) or days of work. Default 1.' },
        trade: { type: 'string', enum: TRADES, description: 'For a daily wage. Default building labourer.' },
        city: { type: 'string', enum: CITIES, description: 'The city, or the nearest listed one in the same country' },
        year: { type: 'number', description: 'Story year' },
    }, ['question', 'city', 'year'], a => run(() => {
        const r = price(a.question, a.item, a.trade, Number(a.quantity) || 1, a.city, Number(a.year));
        if (r.error) return r.error;
        const g = r.silver >= 10 ? Math.round(r.silver) : Math.round(r.silver * 100) / 100;
        const days = r.labourDays == null ? '' : `; a building labourer earns that in ${r.labourDays >= 10 ? Math.round(r.labourDays) : Math.round(r.labourDays * 10) / 10} days`;
        return `${r.what} in ${a.city}, ${a.year}: ${g} g of silver${days}${r.note ? ` (${r.note})` : ''}.`;
    }));

    tool('NameCharacter', 'Give a first name to a character in an American setting whose name the story has not fixed, before naming them. Drawn by how many US babies of that sex got the name in their birth decade (1910–2029).', {
        who: str('Label of the character (e.g. "the waitress")'),
        sex: { type: 'string', enum: ['male', 'female'] },
        birth_year: { type: 'number', description: 'Year of birth (story year minus age)' },
    }, ['who', 'sex', 'birth_year'], a => run((st, rng) => {
        const n = drawName(a.sex, Number(a.birth_year), rng);
        return n ? `${a.who}: first name ${n}.` : 'US name data cover births 1910–2029.';
    }));

    tool('Disease', 'Decide the course of a contagious disease before narrating it: when a character who caught it first shows symptoms, or how many people in a community fall ill over the whole outbreak.', {
        disease: { type: 'string', enum: DISEASES },
        question: { type: 'string', enum: ['when symptoms start', 'how many fall ill'] },
        who: str('For "when symptoms start": the character who caught it'),
        population: { type: 'number', description: 'For "how many fall ill": people in the community who mix with each other' },
        immune_share: { type: 'number', description: 'Share 0–1 already immune (had it before or vaccinated). Default 0.' },
    }, ['disease', 'question'], a => run((st, rng) => {
        if (a.question === 'when symptoms start') {
            if (!INCUBATION[a.disease]) return `No incubation data for ${a.disease}. Diseases with data: ${Object.keys(INCUBATION).join(', ')}.`;
            const h = incubationHours(a.disease, () => gauss(rng));
            const when = h < 48 ? `${Math.round(h)} hours` : `${Math.round(h / 24)} days`;
            return `${a.who ?? 'The infected person'} shows the first symptoms of ${a.disease} ${when} after catching it.`;
        }
        if (!R0[a.disease]) return `No transmission data for ${a.disease}. Diseases with data: ${Object.keys(R0).join(', ')}.`;
        const sus = 1 - Math.min(1, Math.max(0, Number(a.immune_share) || 0)), z = attackShare(a.disease, sus);
        const n = Number(a.population) || 0;
        if (!z) return `No outbreak: too few people can still catch ${a.disease}; only scattered cases.`;
        return `Over the outbreak, ${Math.round(z * sus * n)} of ${n} people fall ill with ${a.disease}${z > 0.9 ? ', nearly everyone who could catch it' : ''}.`;
    }));

    tool('RecordFact', 'Fix a fact the moment the story establishes it (a place, an object, a person, a secret, an event) and record who knows it: those who saw it, heard it, read it or were told it. A recorded fact stays true for the rest of the story and appears in [KNOWS].', {
        fact: str('The fact, one short sentence'),
        known_by: { type: 'array', items: { type: 'string' }, description: 'Characters who know it' },
        common_knowledge: { type: 'boolean', description: 'Known to everyone in the setting (a public event, a famous place, a well-known custom)' },
    }, ['fact'], a => run(st => {
        const f = learn(st, a.fact, a.known_by ?? [], !!a.common_knowledge);
        return `Fact ${f.id} recorded: ${f.text} Known by ${f.everyone ? 'everyone' : f.knowers.join(', ') || 'no one yet'}.`;
    }));

    tool('Listen', 'Decide whether a character hears a sound (a shot, footsteps, an engine) before narrating whether they react. Code decides from loudness, distance, background noise, walls and the listener\'s hearing.', {
        listener: str('Character who might hear it'),
        listener_species: str('Listener\'s DF creature when it has no tracker profile.'),
        sound: { type: 'string', enum: Object.keys(SOUNDS) },
        spl_db: { type: 'number', description: 'Loudness at 1 m, dB SPL, for a sound not in the list (from a published measurement)' },
        distance_m: { type: 'number', description: 'Distance from the sound, m' },
        noise: { type: 'string', enum: Object.keys(NOISE), description: 'Background sound at the listener. Default quiet room.' },
        barrier: { type: 'string', enum: Object.keys(BARRIER), description: 'What lies between. Default none.' },
    }, ['listener', 'distance_m'], a => run(st => {
        const l = who(st, a.listener, a.listener_species);
        if (l.error) return l.error;
        return listen(a.listener, l.p, { sound: a.sound, spl_db: a.spl_db, distance: a.distance_m, noise: a.noise ?? 'quiet room', barrier: a.barrier ?? 'none' });
    }));

    tool('Look', 'Decide whether a character sees something at a distance (a person, an animal, a vehicle) before narrating it. Code rolls notice / recognize / identify from size, distance, light and visibility.', {
        viewer: str('Character who might see it'),
        viewer_species: str('Viewer\'s DF creature when it has no tracker profile.'),
        target: str('What might be seen, a few words'),
        size_m: { type: 'number', description: 'Smallest visible dimension of the target, m (standing person 0.5, car 1.5, horse 0.6)' },
        distance_m: { type: 'number', description: 'Distance, m' },
        light: { type: 'string', enum: ['overcast day', 'dim street or public lighting', 'living room', 'office'], description: 'Only for an overcast sky or artificial light. Leave it out otherwise: code takes daylight, twilight, moonlight or starlight from the date, hour and latitude.' },
        latitude: { type: 'number', description: 'Latitude of the place, degrees (north +, south −), when the story moves to a new region. Kept for later calls.' },
        visibility_m: { type: 'number', description: 'Meteorological visibility, m (clear air 20000; haze 5000; mist 2000; fog 500; thick fog 50)' },
    }, ['viewer', 'size_m', 'distance_m'], a => run((st, rng) => {
        const v = who(st, a.viewer, a.viewer_species);
        if (v.error) return v.error;
        if (Number.isFinite(a.latitude)) st.latitude = a.latitude;
        // Story dates (dd/mm/yyyy) parse to minutes from year 1; a bare "Day N" count stays below 146 097 days (400 years) [ASSUMED].
        const t = nowMinutes();
        const sky = !a.light && t !== null && t / 1440 > 146097 && Number.isFinite(st.latitude) ? skyLight(t, st.latitude) : null;
        return look(a.viewer, v.p, { size_m: a.size_m, distance_m: a.distance_m, light: sky?.lux ?? a.light ?? 'daylight', lightLabel: sky?.label ?? null, visibility_m: a.visibility_m ?? 20000 }, rng);
    }));

    tool('JudgeStatement', 'Decide whether a character takes a statement they just heard as a lie or as true, before narrating their reaction. Use when someone could be lying or could be suspected of lying, and the listener has no proof either way.', {
        listener: str('Character judging the statement'),
        speaker: str('Character who made it'),
        is_lie: { type: 'boolean', description: 'Whether the statement is in fact a lie (known from the story)' },
        statement: str('The statement in a few words'),
    }, ['listener', 'speaker', 'is_lie'], a => run((st, rng) => {
        const l = who(st, a.listener), s = who(st, a.speaker);
        const r = judgeStatement(!!a.is_lie, rng, { speaker: s.p ?? null, listener: l.p ?? null });
        return `${a.listener} ${r.judgedLie ? 'judges it a lie' : 'believes it'}, from ${a.speaker}'s manner alone: no proof either way. Narrate ${a.listener}'s reaction from that judgment.`;
    }));

    tool('Bystander', 'Decide whether an uninvolved character steps in to help in an emergency they witness (someone collapses, is attacked, cries for help).', {
        who: str('The bystander'),
        others: { type: 'number', description: 'How many other people the bystander believes also witness it' },
        situation: { type: 'string', enum: SITUATIONS, description: 'Default victim in danger' },
    }, ['who', 'others'], a => run((st, rng) => {
        const p = helpChance(a.others, a.situation ?? 'victim in danger');
        const others = a.others > 0 ? `with ${a.others} other${a.others > 1 ? 's' : ''} watching` : 'alone with it';
        return `${a.who} ${rng() < p ? 'steps in to help' : 'does not step in'} (${others}).`;
    }));

    tool('ObeyOrder', 'Decide whether a character carries out an order from an authority to hurt someone, all the way, when they have no personal stake in it.', {
        who: str('The character given the order'),
        situation: { type: 'string', enum: Object.keys(OBEY) },
    }, ['who', 'situation'], a => run((st, rng) => {
        const p = OBEY[a.situation];
        return `${a.who} ${rng() < p ? 'carries the order out to the end' : 'refuses before the end'} (${a.situation}).`;
    }));

    tool('AskStranger', 'Decide whether a stranger agrees to a small direct request (a few minutes of time, lending something briefly, showing the way) before narrating the answer.', {
        who: str('The stranger asked'),
        request: str('The request in a few words'),
    }, ['who'], a => run((st, rng) => `${a.who} ${rng() < SMALL_REQUEST_YES ? 'agrees' : 'declines'}${a.request ? ` (${a.request})` : ''}.`));

    tool('HoldOn', 'Decide whether a person can hang on by their hands (a ledge, a rope, a branch) or carry a load by its handles, before narrating it.', {
        who: str('Character holding on'),
        hanging: { type: 'boolean', description: 'Hanging by the hands: the load is the character\'s own body' },
        load_kg: { type: 'number', description: 'Mass carried by handles, kg (when not hanging)' },
        hands: { type: 'number', description: 'Hands used, 1 or 2. Default 2.' },
        seconds: { type: 'number', description: 'How long the hold must last, s (until help arrives, to cross the gap)' },
        region: { type: 'string', enum: Object.keys(REGIONS), description: 'World region the character grew up in, when known. Kept for later calls.' },
    }, ['who'], a => run((st, rng) => {
        const { p, error } = who(st, a.who);
        if (error) return error;
        if (a.region) p.region = a.region;
        return holdLoad(a.who, p, { load_kg: a.load_kg, hands: a.hands ?? 2, hanging: !!a.hanging, seconds: a.seconds ?? null }, rng);
    }));

    tool('Chase', 'Decide whether a pursuer catches someone running away over open ground, from their species\' top speeds and leg injuries.', {
        pursuer: str('Character chasing'), pursuer_species: str('Pursuer\'s DF creature when it has no tracker profile.'),
        fleeing: str('Character running away'), fleeing_species: str('Fleeing character\'s DF creature when it has no tracker profile.'),
        gap_m: { type: 'number', description: 'Head start, m' },
    }, ['pursuer', 'fleeing', 'gap_m'], a => run(st => {
        const p = who(st, a.pursuer, a.pursuer_species), f = who(st, a.fleeing, a.fleeing_species);
        if (p.error || f.error) return p.error || f.error;
        return chase(a.pursuer, p.p, a.fleeing, f.p, a.gap_m);
    }));

    tool('NewCharacter', 'Decide the sex, age and occupation of a character who appears for the first time and whom the story has not described (a stranger, a passer-by, the person behind the counter), before describing them. Drawn from the 1881 census of England and Wales.', {
        who: str('Name or label for the character (e.g. "the innkeeper", "stranger 2")'),
        sex: { type: 'string', enum: ['male', 'female'], description: 'Only when the story already fixes it' },
        occupation: str('Only when the story already fixes it, in a word or two (innkeeper, carter, blacksmith, servant)'),
        min_age: { type: 'number', description: 'Only when the story already fixes it (e.g. 18 for someone serving drinks)' },
    }, ['who'], a => run((st, rng) => {
        const r = drawPerson({ sex: a.sex ?? null, occupation: a.occupation ?? null, minAge: Number(a.min_age) || 0 }, rng);
        if (r.error) return r.error;
        const { p } = who(st, a.who);
        if (p) Object.assign(p, { age: r.age, sex: r.sex });
        const noun = r.age < 15 ? (r.sex === 'female' ? 'girl' : 'boy') : r.sex === 'female' ? 'woman' : 'man';
        return `${a.who}: a ${r.age}-year-old ${noun}; ${r.occupation ? `occupation: ${r.occupation}` : r.age < 15 ? 'a child, no occupation' : 'no stated occupation'}.`;
    }));

    tool('FirstImpression', 'Decide whether a character, after a brief first meeting, wants to see someone again romantically, before narrating their reaction.', {
        who: str('Character whose interest is decided'),
        sex: { type: 'string', enum: ['male', 'female'] },
        many_options: { type: 'boolean', description: 'They are meeting many prospective partners at once (15 or more), e.g. a ball, a festival, a dating event' },
    }, ['who', 'sex'], a => run((st, rng) => {
        const pr = interestChance(a.sex, !!a.many_options);
        return `${a.who} ${rng() < pr ? 'is interested and would meet again' : 'is not interested'}${a.many_options ? ' (one of many suitors met at once)' : ''}.`;
    }));

    tool('BodyCheck', 'Resolve an action with an uncertain outcome that no other rule tool resolves, before narrating it. The body state in [BODY] is applied in code.', {
        who: str('Character acting'),
        species,
        task: str('The task in a few words. A real second attempt names it ("pick lock, 2nd try"); the same task again this turn returns the first result.'),
        reference_class: str('The wider class of attempts this one belongs to (e.g. "amateurs picking an old door lock")'),
        base_share: { type: 'string', enum: SHARES, description: 'How many attempts in that reference class succeed.' },
        share: { type: 'string', enum: SHARES, description: 'Your estimate for this attempt: how many people with this character\'s training succeed at it in these conditions, unhurt.' },
        ordering: { type: 'string', enum: ORDERING, description: 'Given two such attempts, how often you would correctly say which one succeeds.' },
        uses: { type: 'array', items: { type: 'string', enum: [...Object.keys(FUNCTIONS), 'alertness'] }, description: 'Body abilities the task depends on: grasp (hands, claws that hold), stance (feet), sight, hearing, smell, breathing; alertness for tasks needing attention, judgment or quick reactions (driving, aiming, spotting, fine work).' },
        exertion: { type: 'string', enum: ['none', 'light', 'heavy'] },
        on_feet: { type: 'boolean', description: 'The task needs standing or walking unaided' },
        timed: { type: 'boolean', description: 'The task must be done within a time that leaves no slack (a lock picked before the guard turns, a sum shouted in a race)' },
        fine: { type: 'boolean', description: 'The task needs fine finger work with bare fingers (tying a knot, loading a cartridge, picking a lock, writing)' },
        override: { type: 'boolean', description: 'Set only after BodyCheck named another tool and the task is genuinely not what that tool decides' },
    }, ['who', 'task', 'reference_class', 'base_share', 'share', 'ordering'], a => run((st, rng) => check((who(st, a.who, a.species).p ?? person(st, a.who)), { ...a, share: regressive(a) }, rng)));

    tool('BodyTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id (not needed for antivenom, antibiotics, laparotomy, oxygen or transfuse)' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load', 'antivenom', 'antibiotics', 'laparotomy', 'oxygen', 'hyperbaric_oxygen'] },
        training: { type: 'string', enum: ['untrained', 'instructions', 'trained'], description: 'For stop_bleeding: the person treating has no first-aid training, has written or phone instructions, or has formal bleeding-control training (medic, Stop the Bleed course). Default untrained.' },
    }, ['who', 'treatment'], a => run((st, rng) => {
        const p = (who(st, a.who, a.species).p ?? person(st, a.who));
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
            if (!p) continue;
            try { p.workMet = metOf((w.running ? runWatts : pandolf)(p.mass, w.load_kg, w.speed_kmh / 3.6, w.grade_pct, w.terrain ?? 'dirt road'), p.mass); }
            catch (e) { return `${e.message} Nothing recorded.`; }
            walkers.push([w.who, p, w.speed_kmh]);
        }
        const { elapsed, events } = advanceAll(st.people || {}, asked, new Set(a.resting || []), rng, { active: new Set(a.active || []), sleeping: new Set(a.sleeping || []) });
        const walked = walkers.map(([n, p, kmh]) => { const met = p.workMet; delete p.workMet; return `${n} walked ${Math.round(kmh * elapsed / 60 * 10) / 10} km at ${Math.round(met * 10) / 10} MET`; });
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
        const p = (who(st, a.who, a.species).p ?? person(st, a.who));
        return `${cast(p, Math.max(1, Math.min(9, Math.round(a.complexity))))} ${status(a.who, p)}`;
    }));

    tool('BodyFall', 'Resolve a fall before narrating its outcome.', {
        who: str('Character name'),
        species,
        height_m: { type: 'number' },
        soft: { type: 'boolean', description: 'Soft ground: water, snow, foliage' },
        head_first: { type: 'boolean' },
    }, ['who', 'height_m'], a => run((st, rng) => {
        const p = (who(st, a.who, a.species).p ?? person(st, a.who));
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first }, rng);
    }));

    tool('BodyStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
        species,
    }, ['who'], a => run(st => status(a.who, (who(st, a.who, a.species).p ?? person(st, a.who)))));
}
