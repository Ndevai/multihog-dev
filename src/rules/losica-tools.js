import { person, addWound, treat, advance, cast, fall, status } from './losica-engine.js';

const TOOLS = ['LosicaWound', 'LosicaTreat', 'LosicaTime', 'LosicaCast', 'LosicaFall', 'LosicaStatus'];
const KEEP_SNAPSHOTS = 30;

function store() {
    const ctx = SillyTavern.getContext();
    ctx.chatMetadata.losicaRules ??= { state: { people: {} }, snapshots: {} };
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
    } else if (!type || type === 'normal') {
        s.snapshots[key] = structuredClone(s.state);
        const keys = Object.keys(s.snapshots).map(Number).sort((a, b) => a - b);
        for (const k of keys.slice(0, -KEEP_SNAPSHOTS)) delete s.snapshots[k];
    }
}

function run(fn) {
    const s = store();
    const out = fn(s.state);
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
    }, ['who', 'part', 'type'], a => run(st => {
        const p = person(st, a.who);
        const w = addWound(p, a);
        return `Wound ${w.id} recorded. ${status(a.who, p)}`;
    }));

    tool('LosicaTreat', 'Apply a treatment to a wound. load = putting weight on a fractured part.', {
        who: str('Character name'),
        wound: { type: 'number', description: 'Wound id' },
        treatment: { type: 'string', enum: ['stop_bleeding', 'clean', 'splint', 'transfuse', 'load'] },
    }, ['who', 'wound', 'treatment'], a => run(st => {
        const p = person(st, a.who);
        return `${treat(p, Number(a.wound), a.treatment)} ${status(a.who, p)}`;
    }));

    tool('LosicaTime', 'Advance story time for every tracked character. Call before narrating any time passing.', {
        minutes: { type: 'number', description: 'Minutes that pass' },
        resting: { type: 'array', items: { type: 'string' }, description: 'Characters not casting or fighting during this time' },
    }, ['minutes'], a => run(st => {
        const resting = new Set(a.resting || []);
        const lines = Object.entries(st.people || {}).map(([who, p]) => {
            advance(p, Math.max(0, Math.round(a.minutes)), resting.has(who));
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
    }, ['who', 'height_m'], a => run(st => {
        const p = person(st, a.who);
        return fall(p, Number(a.height_m), { soft: !!a.soft, headFirst: !!a.head_first });
    }));

    tool('LosicaStatus', 'Read a character\'s body and network state.', {
        who: str('Character name'),
    }, ['who'], a => run(st => status(a.who, person(st, a.who))));
}
