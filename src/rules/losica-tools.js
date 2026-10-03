import { person, addWound, treat, advance, cast, fall, status, seededRng } from './losica-engine.js';
import { turnKey } from '../state/dice-ledger.js';

const TOOLS = ['LosicaWound', 'LosicaTreat', 'LosicaTime', 'LosicaCast', 'LosicaFall', 'LosicaStatus'];
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
    } else if (!type || type === 'normal') {
        s.calls = 0;
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
    store().state = structuredClone(saved);
    save();
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

export function registerLosicaRulesTools(enabled) {
    const { registerFunctionTool, unregisterFunctionTool } = SillyTavern.getContext();
    if (!registerFunctionTool || !unregisterFunctionTool) return;
    TOOLS.forEach(n => unregisterFunctionTool(n));
    if (!enabled) return;

    const tool = (name, description, properties, required, action) => registerFunctionTool({
        name, displayName: name, description,
        parameters: { type: 'object', properties, required },
        action, formatMessage: () => '',
    });

    tool('LosicaWound', 'Record a wound the moment it happens. Returns the body state.', {
        who: str('Character name'),
        part: { type: 'string', enum: ['head', 'eyes', 'mouth', 'torso', 'arm_l', 'arm_r', 'hand_l', 'hand_r', 'leg_l', 'leg_r', 'foot_l', 'foot_r'] },
        type: { type: 'string', enum: ['cut', 'puncture', 'blunt', 'fracture', 'burn', 'bite'] },
        vessel: { type: 'string', enum: ['none', 'small', 'limb_artery', 'femoral'], description: 'Vessel opened. femoral = groin, armpit or neck.' },
        fracture: { type: 'string', enum: ['arm_spiral', 'arm_transverse', 'leg_spiral', 'leg_transverse'] },
        bone: { type: 'string', enum: ['default', 'shin', 'wrist'] },
        openGrade: { type: 'string', enum: ['none', 'I', 'II', 'IIIA', 'IIIB', 'IIIC'], description: 'Fracture through the skin: I small wound … IIIC with artery damage.' },
    }, ['who', 'part', 'type'], a => run((st, rng) => {
        const p = person(st, a.who);
        const w = addWound(p, a, rng);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));

    tool('LosicaTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load'] },
    }, ['who', 'wound', 'treatment'], a => run((st, rng) => {
        const p = person(st, a.who);
        return `${treat(p, Number(a.wound), a.treatment, rng)} ${status(a.who, p)}`;
    }));

    tool('LosicaTime', 'Advance story time for every tracked character. Call before narrating any time passing.', {
        minutes: { type: 'number', description: 'Minutes that pass' },
        resting: { type: 'array', items: { type: 'string' }, description: 'Characters not casting or fighting during this time' },
    }, ['minutes'], a => run((st, rng) => {
        const resting = new Set(a.resting || []);
        const lines = Object.entries(st.people || {}).map(([who, p]) => {
            advance(p, Math.max(0, Math.round(a.minutes)), resting.has(who), rng);
            return status(who, p);
        });
        return lines.join('\n') || 'No tracked characters.';
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
