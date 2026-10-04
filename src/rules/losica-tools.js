import { person, addWound, treat, advanceAll, cast, fall, status, seededRng, strike } from './losica-engine.js';
import { turnKey } from '../state/dice-ledger.js';

const TOOLS = ['LosicaWound', 'LosicaStrike', 'LosicaTreat', 'LosicaTime', 'LosicaCast', 'LosicaFall', 'LosicaStatus'];
const KEEP_SNAPSHOTS = 30;

function store() {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.losicaRules ??= { state: { people: {} }, snapshots: {} };
    ctx.chatMetadata.losicaRules.salt ??= crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
    return ctx.chatMetadata.losicaRules;
}

function save() {
    const ctx = SillyTavern.getContext();
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
}

const userTurns = () => (SillyTavern.getContext().chat || []).filter(m => m.is_user).length;

export function onLosicaGenerationStarted(type) {
    if (!SillyTavern.getContext().chatMetadata) return;
    const s = store();
    const key = userTurns();
    if (type === 'swipe' || type === 'regenerate') {
        if (s.snapshots[key]) s.state = structuredClone(s.snapshots[key]);
        s.calls = 0;
        s.log = [];
    } else if (!type || type === 'normal') {
        s.calls = 0;
        s.log = [];
        s.snapshots[key] = structuredClone(s.state);
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS)) delete s.snapshots[k];
    }
}

/** MESSAGE_RECEIVED: keep the state each swipe ended with, like Multihog's rpgMemoResult. */
export function onLosicaMessageReceived(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    if (!ctx.chatMetadata || !msg || msg.is_user || msg.is_system) return;
    msg.extra ??= {};
    msg.extra.losicaResult ??= {};
    msg.extra.losicaResult[msg.swipe_id ?? 0] = structuredClone(store().state);
    (ctx.saveChatDebounced || ctx.saveChat)?.();
}

/** MESSAGE_SWIPED: returning to an earlier swipe restores the state it ended with. */
export function onLosicaSwiped(messageId) {
    const ctx = SillyTavern.getContext();
    const msg = ctx.chat?.[messageId];
    const saved = msg?.extra?.losicaResult?.[msg.swipe_id ?? 0];
    if (!ctx.chatMetadata || !saved) return;
    restore(saved);
}

const isReply = m => m && !m.is_user && !m.is_system && !m.extra?.tool_invocations;

function restore(saved) {
    store().state = structuredClone(saved);
    save();
}

/** CHAT_CHANGED / MESSAGE_DELETED: state = what the last reply ended with, so a branch or deletion starts from its own point. */
export function syncLosicaToChat() {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return;
    const msg = [...(ctx.chat || [])].reverse().find(isReply);
    const saved = msg?.extra?.losicaResult?.[msg.swipe_id ?? 0];
    if (saved) restore(saved);
}

/** Linear Stone restore: find the reply whose State Tracker result is this memo and take its Losica state. */
export function restoreLosicaForMemo(memo) {
    const ctx = SillyTavern.getContext();
    if (!ctx.chatMetadata) return false;
    for (const msg of [...(ctx.chat || [])].reverse()) {
        const results = msg?.extra?.rpgMemoResult;
        if (!isReply(msg) || !results) continue;
        const swipe = Object.keys(results).find(k => results[k] === memo && msg.extra.losicaResult?.[k]);
        if (swipe !== undefined) { restore(msg.extra.losicaResult[swipe]); return true; }
    }
    return false;
}

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

/** Tool results of the generation in progress, for the reply check. */
export function losicaTurnLog() {
    const ctx = SillyTavern.getContext();
    return ctx.chatMetadata?.losicaRules?.log || [];
}

export const LOSICA_BRIEF = `<rule_engine>
Outcomes come from the rule-engine tools; narrate what they return.
- An attack with fist, kick or blade → LosicaStrike; it decides whether it lands and the wound. Narrate what it returns.
- An attack by any other means (bow, sling, club, claw, firearm, thrown object) → RollTheDice kind "check", dc from range, cover, light and the attacker's training; a hit → LosicaWound with the part and wound type.
- A burn, a bite, an accident or a fall injury → LosicaWound.
- Someone falls → LosicaFall.
- Time passes in the story → LosicaTime with the minutes, before narrating the later moment. When it stops early, narrate the moment it reports.
- A spell is cast → LosicaCast. A treatment is applied → LosicaTreat.
- Any other action with an uncertain outcome → RollTheDice kind "check".
- Describe a character's injuries, blood loss or energy from LosicaStatus.
</rule_engine>`;

export function registerLosicaRulesTools(enabled) {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool) return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    if (!enabled) return;

    const tool = (name, description, properties, required, action) => registerFunctionTool({
        name, displayName: name, description,
        parameters: { type: 'object', properties, required },
        action: async args => {
            const out = await action(args);
            const s = store();
            (s.log ??= []).push({ tool: name, args, result: out });
            save();
            globalThis._rpgRefreshRenderedView?.();
            return out;
        },
        formatMessage: () => '',
    });

    // Severity (vessel, fracture) is decided in code; the narrator names only the cause and place.
    tool('LosicaWound', 'Record a wound the moment it happens when LosicaStrike did not make it: a burn, a bite, an accident, a fall injury, or a hit by a weapon LosicaStrike does not cover (arrow, club, bullet). Returns what the wound is and the body state.', {
        who: str('Character name'),
        part: { type: 'string', enum: ['head', 'eyes', 'mouth', 'torso', 'arm_l', 'arm_r', 'hand_l', 'hand_r', 'leg_l', 'leg_r', 'foot_l', 'foot_r'] },
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'burn', 'bite'] },
        depth: { type: 'string', enum: ['superficial', 'partial', 'deep_partial', 'full'], description: 'Burns: superficial = red, no blisters; partial = blisters; deep_partial = pale, scars; full = through the skin.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const p = person(st, a.who);
        if (a.type === 'cut' || a.type === 'puncture') {
            return `${strike(p, { part: a.part, means: a.type === 'cut' ? 'blade_cut' : 'blade_stab', landed: true }, null, rng)} ${status(a.who, p)}`;
        }
        const w = addWound(p, { part: a.part, type: a.type, depth: a.depth, vessel: a.type === 'bite' ? 'small' : undefined }, rng);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));

    tool('LosicaStrike', 'Resolve an attack before narrating it: whether it lands, its force and the wound it records. Narrate a miss as a miss.', {
        who: str('Character hit'),
        part: { type: 'string', enum: ['head', 'eyes', 'mouth', 'torso', 'arm_l', 'arm_r', 'hand_l', 'hand_r', 'leg_l', 'leg_r', 'foot_l', 'foot_r'] },
        means: { type: 'string', enum: ['fist', 'kick', 'blade_cut', 'blade_stab'] },
        attacker: str('Attacker name; a tracked attacker strikes weaker with wounded arms or legs'),
        attacker_mass_kg: { type: 'number', description: 'Attacker body mass in kg; 70 for an average adult human. Mass sets reach, swing time and force for any creature.' },
        target_mass_kg: { type: 'number', description: 'Body mass of the character hit, in kg, the first time this character appears; sets reaction and movement speed.' },
        skill: { type: 'string', enum: ['untrained', 'trained', 'elite'], description: 'Fighting training of the attacker' },
        awake: { type: 'boolean', description: 'Target awake. Default true.' },
        facing: { type: 'boolean', description: 'Target looking toward the attacker. Default true.' },
        lit: { type: 'boolean', description: 'Enough light for the target to see the attacker. Default true.' },
        noise_db: { type: 'number', description: 'Sound level of the attacker at the target in dB(A). 0 = silent.' },
        distance_m: { type: 'number', description: 'Distance between attacker and target when the attack starts. Omit when already within arm\'s reach.' },
        approach_speed: { type: 'number', description: 'Attacker\'s speed in m/s while closing the distance.' },
        sense_range_m: { type: 'number', description: 'Range of any non-visual sense the target has that detects an approaching attacker (e.g. telepathy), in m.' },
        intent_visible: { type: 'boolean', description: 'The approach itself shows an attack is coming (charging, weapon raised). False when the attacker looks harmless until the strike starts. Default false.' },
    }, ['who', 'part', 'means'], a => run((st, rng) => {
        const p = person(st, a.who, Number(a.target_mass_kg) || undefined);
        const attacker = a.attacker && st.people?.[a.attacker] ? st.people[a.attacker] : null;
        const scene = ['awake', 'facing', 'lit', 'noise_db', 'distance_m', 'approach_speed', 'sense_range_m', 'intent_visible'];
        const out = strike(p, { part: a.part, means: a.means, skill: a.skill, mass: Number(a.attacker_mass_kg) || 70,
            ...Object.fromEntries(scene.filter(k => a[k] !== undefined).map(k => [k, a[k]])) }, attacker, rng);
        return `${out} ${status(a.who, p)}`;
    }));

    tool('LosicaTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load'] },
    }, ['who', 'wound', 'treatment'], a => run((st, rng) => {
        const p = person(st, a.who);
        return `${treat(p, Number(a.wound), a.treatment, rng)} ${status(a.who, p)}`;
    }));

    tool('LosicaTime', 'Advance story time for every tracked character. Call before narrating any time passing. Time stops early when someone\'s condition changes; narrate that moment, then call again for the remaining minutes.', {
        minutes: { type: 'number', description: 'Minutes that pass' },
        resting: { type: 'array', items: { type: 'string' }, description: 'Characters not casting or fighting during this time' },
    }, ['minutes'], a => run((st, rng) => {
        const asked = Math.max(0, Math.round(a.minutes));
        const { elapsed, events } = advanceAll(st.people || {}, asked, new Set(a.resting || []), rng);
        const head = events.length
            ? `Time stopped after ${elapsed} of ${asked} minutes: ${events.join('; ')}. ${asked - elapsed} minutes remain.`
            : `${elapsed} minutes passed.`;
        const lines = Object.entries(st.people || {}).map(([who, p]) => status(who, p));
        return [head, ...lines].join('\n');
    }));

    tool('LosicaCast', 'Resolve a spell cast before narrating it.', {
        who: str('Caster name'),
        complexity: { type: 'number', description: 'Spell complexity 1-9' },
    }, ['who', 'complexity'], a => run(st => {
        const p = person(st, a.who);
        return `${cast(p, Math.max(1, Math.min(9, Math.round(a.complexity))))} ${status(a.who, p)}`;
    }));

    tool('LosicaFall', 'Resolve a fall before narrating its outcome.', {
        who: str('Character name'),
        height_m: { type: 'number' },
        soft: { type: 'boolean', description: 'Soft ground: water, snow, foliage' },
        head_first: { type: 'boolean' },
    }, ['who', 'height_m'], a => run((st, rng) => {
        const p = person(st, a.who);
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first }, rng);
    }));

    tool('LosicaStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
    }, ['who'], a => run(st => status(a.who, person(st, a.who))));
}
