import { creature } from './df/index.js';
import { bodyWeapon, itemWeapon, momentum, penetrate, tissueOf } from './df/combat.js';
import { weaponOf, metalOf, armorOf } from './df/index.js';

export const DAY_MIN = 24 * 60;
const HOUR = 60 / DAY_MIN;

const BLEED = { femoral: [300, 600], limb_artery: [70, 170], small: [1, 10] };
const FRACTURE = {
    arm_spiral: [21, 42], arm_transverse: [42, 84],
    leg_spiral: [42, 84], leg_transverse: [84, 168],
};
const NONUNION = { default: 0.02, shin: 0.05, wrist: 0.125 };
const OPEN_FRACTURE_INFECTION = { I: 0.05, II: 0.08, IIIA: 0.12, IIIB: 0.25, IIIC: 0.40 };
// Rule 576, days. Missing types are OPEN-48/49: they do not close yet.
const CUT_HEAL = { eyes: [3, 5], mouth: [3, 5], head: [7, 10], arm: [7, 10], torso: [10, 14], leg: [10, 14], hand: [10, 14], foot: [10, 14] };
const BURN_HEAL = { superficial: [5, 10], partial: [7, 21], deep_partial: [21, 56], full: null };
const INFECTION_ONSET = { bite: 1, other: 10 };
const CROOKED_GRIP = 0.51;
const COST = [0, 40, 64, 107, 178, 297, 495, 825, 1375, 2292];
const FALL_ROWS = [[12.0, 0.44], [15.6, 0.56], [19.2, 0.78]];
// Abilities = share of working parts with a DF body-part flag (docs/df-body-engine.md §6).
export const FUNCTIONS = { grasp: 'GRASP', stance: 'STANCE', sight: 'SIGHT', hearing: 'HEAR', smell: 'SMELL', breathing: 'BREATHE' };
// DF part category → rule-576 healing row (cuts) and fracture row.
const CUT_ROW = { EYE: 'eyes', EYELID: 'eyes', MOUTH: 'mouth', LIP: 'mouth', TONGUE: 'mouth', TOOTH: 'mouth', HEAD: 'head', NOSE: 'head', EAR: 'head',
    CHEEK: 'head', BODY_UPPER: 'torso', BODY_LOWER: 'torso', BODY: 'torso', ARM_UPPER: 'arm', ARM_LOWER: 'arm', ARM: 'arm', HAND: 'hand', FINGER: 'hand',
    LEG_UPPER: 'leg', LEG_LOWER: 'leg', LEG: 'leg', LEG_FRONT: 'leg', LEG_REAR: 'leg', FOOT: 'foot', FOOT_FRONT: 'foot', FOOT_REAR: 'foot', TOE: 'foot' };
const BONE_ROW = { arm: 'arm', hand: 'arm', leg: 'leg', foot: 'leg' };
const rowOf = part => part?.cats?.map(k => CUT_ROW[k]).find(Boolean) ?? null;

const between = (rng, [a, b]) => a + (b - a) * rng();

/** Deterministic [0, 1) stream from a string seed (FNV-1a hash into mulberry32). */
export function seededRng(seed) {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.codePointAt(0), 16777619);
    let a = h >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const round = (x, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

export function newPerson(massKg = 70, species = 'HUMAN') {
    return {
        species, mass: massKg, lost: 0, red: 0, wounds: [], nextId: 1, dead: null, deathIn: null, minute: 0,
        net: { C: 40, N: 0, R: 40, P: 1, F: 0, E: 0, width: 0, maxToday: false },
    };
}

export const creatureOf = p => creature(p?.species ?? 'HUMAN');

export function person(state, who, massKg, species = 'HUMAN') {
    state.people ??= {};
    if (!state.people[who]) {
        const c = creature(species);
        state.people[who] = newPerson(massKg || (c ? c.size / 1000 : 70), species);
    }
    return state.people[who];
}

export const bloodVolume = p => creatureOf(p)?.blood === false ? 0 : p.mass * 70;
// Syverud 1989 (swine, steady femoral bleed 1.0 / 1.25 mL/kg/min): death at 50.2 / 49.8 mL/kg lost.
const LETHAL_LOSS_ML_KG = 50;
export const lossFraction = p => bloodVolume(p) ? p.lost / bloodVolume(p) : 0;

export function bloodClass(p) {
    const f = lossFraction(p);
    return f > 0.4 ? 4 : f >= 0.3 ? 3 : f >= 0.15 ? 2 : 1;
}

export function stage(net) {
    if (net.N >= 13) return { stage: 5, max: 9 };
    if (net.N >= 2) return { stage: 4, max: 9 };
    if (net.N === 1) return { stage: 3, max: 6 };
    return net.C >= 200 ? { stage: 2, max: 3 } : { stage: 1, max: 1 };
}

/** w.part = a DF part of the person's creature. */
export function addWound(p, w, rng = Math.random) {
    const row = rowOf(w.part);
    const wound = { id: p.nextId++, part: w.part.name, pid: w.part.id, type: w.type, bleed: 0, age: 0, cleanedAt: null, infection: null, splinted: false, heals: null, healed: false };
    const healRange = ['cut', 'puncture', 'bite', 'blunt'].includes(w.type) || w.functionLost ? CUT_HEAL[row] : w.type === 'burn' ? BURN_HEAL[w.depth] : null;
    if (w.type === 'burn') wound.depth = BURN_HEAL[w.depth] !== undefined ? w.depth : null;
    if (healRange) wound.heals = round(between(rng, healRange));
    if (w.vessel && BLEED[w.vessel] && bloodVolume(p)) wound.bleed = round(between(rng, BLEED[w.vessel]));
    if (w.functionLost) wound.functionLost = true;
    if (w.type === 'severed') wound.severed = true;
    if (w.type === 'fracture') {
        // Parts outside the arm and leg rows have no timetable (OPEN-58): joins stays null.
        const kind = BONE_ROW[row] ? `${BONE_ROW[row]}_${w.fracture || 'transverse'}` : null;
        const bone = w.part.cats.includes('LEG_LOWER') ? 'shin' : 'default';
        wound.fracture = { kind, joins: kind ? FRACTURE[kind][0] : null, full: kind ? FRACTURE[kind][1] : null, crooked: false,
            never: kind ? rng() < NONUNION[bone] : false };
        if (w.openGrade && OPEN_FRACTURE_INFECTION[w.openGrade]) wound.openGrade = w.openGrade;
    }
    if (['cut', 'puncture', 'bite', 'burn', 'severed'].includes(w.type) || wound.openGrade || w.open) wound.open = true;
    p.wounds.push(wound);
    return wound;
}

function infectionChance(w) {
    if (w.openGrade) return OPEN_FRACTURE_INFECTION[w.openGrade];
    const late = w.cleanedAt === null || w.cleanedAt > 8 * HOUR;
    if (w.type === 'bite') return late ? 0.22 : 0.05;
    return late ? 0.15 : 0.03;
}

export function treat(p, id, treatment, rng = Math.random) {
    const w = p.wounds.find(x => x.id === id);
    if (treatment === 'transfuse') { p.lost = 0; p.deathIn = null; return 'Blood volume replaced.'; }
    if (!w) return `No wound ${id}.`;
    if (treatment === 'stop_bleeding') { w.bleed = 0; return `Wound ${id}: bleeding stopped.`; }
    if (treatment === 'clean') { w.cleanedAt ??= w.age; return `Wound ${id}: cleaned.`; }
    if (treatment === 'splint') { w.splinted = true; return `Wound ${id}: splinted.`; }
    if (treatment === 'load') {
        if (!w.fracture || w.fracture.joins <= 0 || w.splinted) return `Wound ${id}: loaded, no added risk.`;
        if (rng() < 0.325) { w.fracture.crooked = true; return `Wound ${id}: bone shifted; it will heal crooked.`; }
        return `Wound ${id}: loaded; bone held.`;
    }
    return `Unknown treatment "${treatment}".`;
}

function endDay(net) {
    const gain = net.E > 0 ? 0.5366 * net.E ** 0.4063 : 0;
    net.width += gain;
    const grown = Math.floor(net.width);
    net.width -= grown;
    net.C += grown;
    if (net.maxToday && net.F >= 1.2 * net.C && net.C >= 4000 * (net.N + 1) && net.N < 12) net.N += 1;
    net.F = 0; net.E = 0; net.maxToday = false;
}

export function advance(p, minutes, resting, rng = Math.random) {
    if (p.dead) return;
    const net = p.net;
    for (let t = 0; t < minutes; t++) {
        const bleeding = p.wounds.reduce((s, w) => s + w.bleed, 0);
        p.lost += bleeding;
        if (p.lost >= LETHAL_LOSS_ML_KG * p.mass) { p.lost = LETHAL_LOSS_ML_KG * p.mass; p.dead = 'blood loss'; return; }
        if (bloodClass(p) === 4) {
            const mode = bleeding > 0 ? 'bleeding' : 'stopped';
            if (p.deathIn === null || p.deathMode !== mode) p.deathIn = mode === 'bleeding' ? Math.round(between(rng, [30, 60])) : 120;
            p.deathMode = mode;
            if (--p.deathIn <= 0) { p.dead = 'blood loss'; return; }
        } else p.deathIn = null;
        if (bleeding === 0 && p.lost > 0) {
            const refill = Math.min(p.lost, bloodVolume(p) * 0.4 / (1.5 * DAY_MIN));
            p.lost -= refill; p.red += refill;
        }
        p.red = Math.max(0, p.red - 500 / (35 * DAY_MIN));
        if (resting) net.R = Math.min(net.C, net.R + 0.05 * net.C / 60);
        for (const w of p.wounds) {
            w.age += 1 / DAY_MIN;
            if (w.fracture && !w.fracture.never && w.fracture.joins !== null) { w.fracture.joins -= 1 / DAY_MIN; w.fracture.full -= 1 / DAY_MIN; }
            if (w.heals !== null && !w.healed && w.age >= w.heals) { w.healed = true; w.bleed = 0; }
            const onset = INFECTION_ONSET[w.type === 'bite' ? 'bite' : 'other'];
            if (w.open && w.infection === null && w.age >= onset) w.infection = rng() < infectionChance(w);
        }
        if (++p.minute >= DAY_MIN) { p.minute -= DAY_MIN; endDay(net); }
    }
}

export function cast(p, complexity) {
    const net = p.net;
    const { stage: st, max } = stage(net);
    let cost = COST[complexity] ?? COST[9];
    if (st === 5 && complexity === 9) cost /= 2;
    cost = Math.round(cost / net.P);
    if (net.R < cost) return `Cast does not start: needs ${cost} PE, has ${Math.floor(net.R)}.`;
    net.R -= cost;
    if (complexity > max) return `Cast fails: complexity ${complexity} exceeds stage ${st} max ${max}. ${cost} PE lost.`;
    net.F += cost; net.E += cost;
    if (complexity === max) net.maxToday = true;
    return `Cast succeeds: ${cost} PE spent, ${Math.floor(net.R)} PE left.`;
}

// Rows: < 12 m (0 % below 6 m, straight line to 44 % at 12 m), 12, 15.6, exactly 19.2, above 19.2 (all).
export function fallDeathChance(height, { soft = false, headFirst = false } = {}) {
    const chances = [null, ...FALL_ROWS.map(r => r[1]), 1];
    let row = FALL_ROWS.filter(([h]) => height >= h).length;
    if (height > FALL_ROWS.at(-1)[0]) row = chances.length - 1;
    const shifted = headFirst ? Math.min(row + 1, chances.length - 1) : soft ? Math.max(row - 1, 0) : row;
    if (shifted > 0) return chances[shifted];
    if (row > 0 || height < 6) return 0;
    return FALL_ROWS[0][1] * (height - 6) / (FALL_ROWS[0][0] - 6);
}

export function fall(p, height, opts = {}, rng = Math.random) {
    const chance = fallDeathChance(height, opts);
    if (chance > 0 && rng() < chance) { p.dead = 'fall'; return `Fall ${height} m: death chance ${Math.round(chance * 1000) / 10}% — dies.`; }
    return `Fall ${height} m: death chance ${Math.round(chance * 1000) / 10}% — survives. Injuries: narrate, then record with BodyWound.`;
}

/** part → whether it works: no severing, unjoined fracture or lost function on it or above it on its CON chain. */
export function worksFn(p, c = creatureOf(p)) {
    if (!c) return () => true;
    const down = new Set();
    for (const w of p.wounds) {
        const fr = w.fracture;
        if (w.severed || (fr && (fr.never || fr.joins === null || fr.joins > 0)) || (w.functionLost && !w.healed)) down.add(w.pid);
    }
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const chain = part => { for (let q = part; q; q = byId[q.parent]) if (down.has(q.id)) return false; return true; };
    const nerves = c.parts.filter(x => x.flags.includes('NERVOUS') && !chain(x));
    const neck = nerves.some(n => byId[n.parent]?.cats.includes('NECK'));
    return part => chain(part) && !(nerves.length && part.flags.includes('STANCE')) && !(neck && part.flags.includes('GRASP'));
}

/** Each ability as the share of the creature's parts with its flag that work; absent when the creature has none. */
export function abilities(p) {
    const c = creatureOf(p);
    if (!c) return {};
    const works = worksFn(p, c);
    const out = {};
    for (const [name, flag] of Object.entries(FUNCTIONS)) {
        const parts = c.parts.filter(x => x.flags.includes(flag));
        if (parts.length) out[name] = round(parts.filter(works).length / parts.length, 2);
    }
    return out;
}

/** Dies when a THOUGHT part stops working. */
function checkDeath(p) {
    const c = creatureOf(p);
    if (!c || p.dead) return;
    const works = worksFn(p, c);
    const brains = c.parts.filter(x => x.flags.includes('THOUGHT'));
    if (brains.length && brains.every(b => !works(b))) p.dead = 'brain destroyed';
}

export function status(who, p) {
    if (p.dead) return `${who}: dead (${p.dead}).`;
    const out = [];
    const f = lossFraction(p);
    const c = creatureOf(p);
    out.push(bloodVolume(p) ? `${who} (${c?.name ?? p.species}): blood lost ${round(p.lost / 1000, 2)} L (${round(f * 100)}%, class ${['I', 'II', 'III', 'IV'][bloodClass(p) - 1]})` : `${who} (${c?.name ?? p.species}): no blood`);
    if (p.deathIn !== null) out.push(`dies in ${p.deathIn} min unless ${p.wounds.some(w => w.bleed) ? 'bleeding stops and blood is replaced' : 'blood is replaced'}`);
    if (p.red > 0) out.push(`red-cell deficit ${Math.round(p.red)} mL: endurance lowered`);
    for (const w of p.wounds) {
        if (w.healed && !w.infection) continue;
        const bits = [`wound ${w.id} ${w.part} ${w.type}${w.depth ? ` (${w.depth.replace('_', ' ')})` : ''}`];
        if (w.bleed) bits.push(`bleeding ${w.bleed} mL/min`);
        if (w.heals !== null && !w.healed) bits.push(`closes in ${round(w.heals - w.age)} days`);
        if (w.type === 'burn' && w.depth === 'full') bits.push('closes only with a skin graft');
        if (w.fracture) {
            const fr = w.fracture;
            if (fr.joins !== null) bits.push(fr.never ? 'will not join' : fr.joins > 0 ? `joins in ${round(fr.joins)} days` : fr.full > 0 ? `light use; full in ${round(fr.full)} days` : 'healed');
            if (fr.crooked) bits.push(/arm|hand|finger/.test(w.part) ? `crooked: grip ${CROOKED_GRIP * 100}%` : 'crooked');
        }
        if (w.functionLost && !w.healed) bits.push('function lost until it closes');
        if (w.infection) bits.push('infected');
        out.push(bits.join(', '));
    }
    if (c) {
        const works = worksFn(p, c);
        const down = c.parts.filter(x => !works(x) && (x.flags.some(f => Object.values(FUNCTIONS).includes(f)) || x.flags.includes('LIMB')));
        if (down.length) out.push(`not working: ${down.map(x => x.name).join(', ')}`);
    }
    const reduced = Object.entries(abilities(p)).filter(([, v]) => v < 1);
    if (reduced.length) out.push(`abilities: ${reduced.map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`);
    const n = p.net, s = stage(n);
    out.push(`network: C ${n.C}, N ${n.N}, stage ${s.stage} (max complexity ${s.max}), R ${Math.floor(n.R)}/${n.C} PE, P ${Math.round(n.P * 100)}%`);
    return out.join('. ') + '.';
}

// Spread of a blow's momentum: Walilko 2005 punch force SD ÷ mean (rule 576), applied to every attack.
const SPREAD = 0.237;
const BLADE_LIMB_ARTERY = 0.12;
const REF_MASS = 70;

function gauss(rng) {
    return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

const norm = t => String(t || '').trim().toLowerCase().replace(/[_\s]+/g, ' ');

/** A part of creature c by name or DF id ("right upper arm", "RUA"); null when none. */
export function findPart(c, text) {
    const key = norm(text);
    return c.parts.find(x => norm(x.name) === key) ?? c.parts.find(x => norm(x.id) === key) ?? null;
}

export const aimable = c => c.parts.filter(x => !x.flags.includes('INTERNAL')).map(x => x.name);

/** Vessel class of the cut layers (rule 576 rates; DF marks which layers carry arteries). */
function vesselOf(c, layers, rng) {
    const tis = l => c.tissues[l.tissue];
    if (layers.some(l => l.major)) return 'femoral';
    if (layers.some(l => tis(l)?.flags.includes('ARTERIES')) && rng() < BLADE_LIMB_ARTERY) return 'limb_artery';
    return layers.some(l => (tis(l)?.VASCULAR ?? 0) > 0) ? 'small' : undefined;
}

/** A cut, puncture or bite through every layer of a part, recorded without an attack (BodyWound). */
export function openWound(p, part, type, rng = Math.random) {
    const c = creatureOf(p);
    const w = addWound(p, { part, type, vessel: vesselOf(c, part.layers, rng) }, rng);
    checkDeath(p);
    return w;
}

// Whether an attack lands: it does unless the target detects it and finishes a defensive move before impact.
// Seconds. Sources and proxies: rule 576 reference.
const REACH_M = 0.88;                                   // FAA 2006-08 functional reach, men 50th %ile
const STRIKE_S = { fist: [0.357, 0.178], kick: [0.477, 0.203], blade_cut: [0.357, 0.178], blade_stab: [0.357, 0.178] }; // Piorkowski 2011 jab; kick = hook, blade = jab (proxies)
// Reaction = sense organ → cortex + brain decision + synapse + nerve path ÷ conduction speed + muscle activation + force rise.
// Human check: sight 0.056 + 0.204 + 0.070 = 0.330 s (measured 0.331); hearing 0.011 + 0.204 + 0.070 = 0.285 s (measured 0.284).
const SENSE_S = { sight: 0.056, hearing: 0.0109 };     // Foxe & Simpson 2002 V1 onset; Brugge 2008 A1 onset
const DECIDE_S = 0.2037;                               // human: measured RT minus all other parts, sight 0.2046 / hearing 0.2027
const NERVE_MPS = 49;                                  // Chen 2016 AANEM: median/ulnar motor conduction lower limit
const SYNAPSE_S = 0.0007;                              // More & Donelan 2018
const twitch = mass => 0.0043 * mass ** 0.21 + 0.0176 * mass ** 0.20; // More & Donelan 2018: electromechanical + force generation
const RT_CV = 36.42 / 297;                              // Petri 2020 spread
const MOVE_S = 0.242;                                   // VencesBrito 2011 karate punch, proxy for a defensive move
const HEAR_DB = 25;                                     // WHO: normal hearing threshold at or below 25 dB
const WAKE_DB = 55, WAKE_MAX_S = 21;                    // young adults: all woke to a 55 dBA alarm within 21 s
const WAKE_MIN_S = 1.59;                                // Oudiette 2023: median response time from N2 sleep
const INERTIA_SPEED = 0.79;                             // Newman 2013: response speed 79 % right after waking
// Body size, not species: the human values above are the 70 kg point of mammal scaling laws (5 g – 5000 kg).
const EXP_MOVE = 0.15;    // Heglund & Taylor 1988: stride period ∝ M^0.150–0.156
const EXP_LENGTH = 1 / 3; // geometric similarity
const size = (mass, exp) => ((mass || REF_MASS) / REF_MASS) ** exp;

/** Seconds from the start of the attack to impact, or null when the attacker never comes within reach. */
function impactTime(a, rng) {
    const reach = REACH_M * size(a.mass, EXP_LENGTH);
    const dist = a.distance_m ?? reach;
    const approach = dist <= reach ? 0 : a.approach_speed > 0 ? (dist - reach) / a.approach_speed : null;
    if (approach === null) return null;
    const [mean, sd] = STRIKE_S[a.means] || STRIKE_S.fist;
    return { approach, reach, strike: Math.max(0.05, mean + sd * gauss(rng)) * size(a.mass, EXP_MOVE) };
}

/**
 * Earliest second (from attack start) at which the target finishes a defensive move, or Infinity.
 * A channel perceives the attacker from some second on; the attack itself is recognisable from second 0
 * when intent is visible, otherwise only once the strike starts (t.approach).
 */
function defenceDone(a, t, defender, rng) {
    const awake = a.awake !== false;
    const dist = a.distance_m ?? t.reach;
    const intentFrom = a.intent_visible ? 0 : t.approach;
    const m = defender?.mass ?? REF_MASS;
    const body = defender?.body || {};
    const motor = SYNAPSE_S + (body.limb_m ?? REACH_M * size(m, EXP_LENGTH)) / (body.nerve_mps ?? NERVE_MPS) + twitch(m);
    const rt = channel => ((body.sense_s?.[channel] ?? SENSE_S[channel]) + (body.decide_s ?? DECIDE_S) + motor)
        * Math.max(0.5, 1 + RT_CV * gauss(rng));
    const ab = defender ? abilities(defender) : {};
    const capacity = 'grasp' in ab || 'stance' in ab ? Math.max(ab.grasp ?? 0, ab.stance ?? 0) : 1;
    if (capacity <= 0) return Infinity;
    const move = MOVE_S * size(m, EXP_MOVE) / capacity;
    const done = [];
    const perceive = (from, reaction) => done.push(Math.max(from, intentFrom) + reaction);
    if (awake && a.facing !== false && a.lit !== false) perceive(0, rt('sight'));
    if (awake && (a.noise_db || 0) > HEAR_DB) perceive(0, rt('hearing'));
    if (!awake && (a.noise_db || 0) >= WAKE_DB) {
        const woke = WAKE_MIN_S + rng() * (WAKE_MAX_S - WAKE_MIN_S);
        // Once awake the target sees or hears like anyone awake, slowed by sleep inertia.
        perceive(woke, rt(a.facing !== false && a.lit !== false ? 'sight' : 'hearing') / INERTIA_SPEED);
    }
    const r = a.sense_range_m || 0;
    if (awake && r > 0) {
        // Senses during sleep: OPEN-63. A range sense perceives the attacker (or its hand) within r.
        const enter = dist <= r ? 0 : r >= t.reach ? (dist - r) / a.approach_speed : t.approach + t.strike * (t.reach - r) / t.reach;
        perceive(enter, rt('sight'));
    }
    return done.length ? Math.min(...done) + move : Infinity;
}

/**
 * An attack (docs/df-body-engine.md §4–5). a: { part, attack, weapon?, material?, armor? (worn items, text), skill?, style?, prone?, species?, mass?,
 * landed?, scene fields }. The attacker's species and mass come from the tracked attacker when there is one.
 */
export function strike(target, a, attacker = null, rng = Math.random) {
    const tc = creatureOf(target);
    const ac = creature(attacker?.species ?? a.species ?? 'HUMAN');
    if (!tc || !ac) return 'Creature data is not loaded. Nothing recorded.';
    const part = findPart(tc, a.part);
    if (!part || part.flags.includes('INTERNAL')) return `${tc.name} has no part "${a.part}" to aim at. Parts: ${aimable(tc).join(', ')}. Nothing recorded.`;
    const mass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    const iSize = mass * 1000;
    const worn = [];
    for (const text of a.armor || []) {
        const it = armorOf(text);
        if (!it) return `No DF armor "${text}" (material + item, e.g. "iron breastplate", "leather armor", "steel helm"). Nothing recorded.`;
        worn.push(it);
    }
    let w, verb, means, bite = false;
    if (a.weapon) {
        const wp = weaponOf(a.weapon);
        if (!wp) return `No weapon "${a.weapon}". Nothing recorded.`;
        const metal = metalOf(a.material || 'iron');
        if (!metal) return `No metal "${a.material}". Nothing recorded.`;
        const atk = wp.attacks.find(x => norm(x.verb) === norm(a.attack)) ?? wp.attacks[0];
        w = itemWeapon(wp, atk, metal);
        w.piercing = atk.contact < atk.penetration;
        verb = atk.verb;
        means = 'blade_cut';
    } else {
        const atk = ac.attacks.find(x => norm(x.id) === norm(a.attack) || norm(x.verb) === norm(a.attack));
        if (!atk) return `${ac.name} has no attack "${a.attack}". Attacks: ${ac.attacks.map(x => x.verb).join(', ') || 'none'}. Nothing recorded.`;
        w = bodyWeapon(ac, atk, iSize, attacker ? worksFn(attacker, ac) : () => true);
        if (!w) return `The attacker cannot ${atk.verb} now: no working part for it. Nothing recorded.`;
        w.piercing = atk.contactPerc < atk.penetrationPerc;
        verb = atk.verb;
        bite = atk.id === 'BITE';
        means = atk.sel[1] === 'STANCE' ? 'kick' : 'fist';
    }
    if (!a.landed) {
        const at = { ...a, means, mass };
        const t = impactTime(at, rng);
        if (!t) return `${verb} at ${part.name}: out of reach (${a.distance_m} m, no approach). Nothing lands.`;
        const impact = t.approach + t.strike;
        const done = defenceDone(at, t, target, rng);
        if (done <= impact) return `${verb} at ${part.name}: avoided (defence done at ${done.toFixed(2)} s, impact at ${impact.toFixed(2)} s).`;
    }
    const M = momentum(ac, iSize, w, a) * Math.max(0, 1 + SPREAD * gauss(rng));
    const r = penetrate(tc, part, target.mass * 1000, w, M, rng, worn);
    const made = [];
    const touched = [...new Set(r.hits.map(h => h.part))];
    for (const hp of touched) {
        const hits = r.hits.filter(h => h.part === hp);
        const flags = h => tissueOf(tc, h.layer)?.flags || [];
        const rigid = h => flags(h).includes('STRUCTURAL') && !flags(h).includes('FUNCTIONAL');
        const cuts = hits.filter(h => h.result === 'cut').map(h => h.layer);
        const soft = hits.filter(h => !rigid(h));
        const functionLost = hits.some(h => flags(h).includes('FUNCTIONAL'));
        const severed = r.severed && hp === part;
        if (soft.length || severed) {
            const type = severed ? 'severed' : cuts.length ? (bite ? 'bite' : w.piercing ? 'puncture' : 'cut') : 'blunt';
            made.push(addWound(target, { part: hp, type, vessel: cuts.length ? vesselOf(tc, cuts, rng) : undefined, functionLost }, rng));
        }
        if (hits.some(rigid)) made.push(addWound(target, { part: hp, type: 'fracture', open: cuts.length > 0 }, rng));
    }
    checkDeath(target);
    const parts = [...new Set(r.tested.map(t => t.part))];
    const layers = parts.map(pt => `${pt.name}: ${r.tested.filter(t => t.part === pt).map(t => `${t.layer.tissue.toLowerCase()} ${t.result}`).join(', ')}`).join('; ');
    const wounds = made.length ? ` Wound${made.length > 1 ? 's' : ''} ${made.map(x => x.id).join(', ')}.` : ' No wound.';
    return `${verb} (${w.name}) to ${part.name}: momentum ${round(M)}. ${layers}${r.severed ? `; ${part.name} severed` : ''}.${wounds}`;
}

// Interruptions (NetHack occupations, Pathos Interrupt): time stops at the first change in anyone's condition.
const watch = p => ({
    dead: p.dead, cls: bloodClass(p), dying: p.deathIn !== null,
    infected: p.wounds.filter(w => w.infection === true).map(w => w.id),
});

function changes(who, a, b) {
    const out = [];
    if (b.dead && !a.dead) out.push(`${who} dies (${b.dead})`);
    else {
        if (b.cls > a.cls) out.push(`${who} reaches blood-loss class ${['I', 'II', 'III', 'IV'][b.cls - 1]}`);
        if (b.dying && !a.dying) out.push(`${who} is dying`);
        for (const id of b.infected) if (!a.infected.includes(id)) out.push(`${who}: wound ${id} is infected`);
    }
    return out;
}

/** Advances everyone minute by minute; stops at the end of the first minute in which a condition changes. */
export function advanceAll(people, minutes, resting = new Set(), rng = Math.random) {
    const total = Math.max(0, Math.round(minutes));
    for (let m = 1; m <= total; m++) {
        const events = [];
        for (const [who, p] of Object.entries(people)) {
            const before = watch(p);
            advance(p, 1, resting.has(who), rng);
            events.push(...changes(who, before, watch(p)));
        }
        if (events.length) return { elapsed: m, events };
    }
    return { elapsed: total, events: [] };
}

// Checks: success when capacity ≥ demand (stress–strength interference; IRT normal ogive). `share` = fraction of
// people with the actor's training who succeed unhurt; demand sits where that share of capacities lies above it.
const CAPACITY_CV = 0.19;  // Dodds 2014 grip: peak 51 / 31 kg, weak cut 27 / 16 kg = peak − 2.5 SD → SD / mean 0.19
const FORCE_SCORES = ['grasp', 'stance'];
const EXERTION_FAILS_AT = { heavy: 2 };  // blood-loss class II: heavy exertion fails

// Abramowitz & Stegun 7.1.26 (error < 1.5e-7); Acklam's inverse (relative error < 1.2e-9).
function normCdf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const e = 1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x / 2);
    return x >= 0 ? (1 + e) / 2 : (1 - e) / 2;
}
function normInv(p) {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const tail = q => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
    if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** Chance of success and the ability that limits it. Non-force abilities between 0 and 1 change nothing yet (OPEN-66). */
function checkOdds(p, { share, uses = [], exertion = 'none', on_feet = false }) {
    if (p.dead) return { chance: 0 };
    const cls = bloodClass(p);
    if (cls === 4 || (cls >= 3 && on_feet) || cls >= (EXERTION_FAILS_AT[exertion] ?? 5)) return { chance: 0, limit: `blood-loss class ${['I', 'II', 'III', 'IV'][cls - 1]}` };
    const scores = abilities(p);
    const lacking = uses.find(u => u in FUNCTIONS && !(u in scores));
    if (lacking) return { chance: 0, limit: `no ${lacking}` };
    const used = uses.filter(u => u in scores);
    const zero = used.find(u => scores[u] === 0);
    if (zero) return { chance: 0, limit: `${zero} 0%` };
    const force = used.filter(u => FORCE_SCORES.includes(u)).sort((x, y) => scores[x] - scores[y])[0];
    const s = force ? scores[force] : 1;
    const base = Math.max(0, Math.min(1, Number(share) || 0));
    if (s >= 1 || base === 0) return { chance: base };
    const demand = 1 - normInv(Math.min(0.999, base)) * CAPACITY_CV;
    return { chance: normCdf((s - demand) / (s * CAPACITY_CV)), limit: `${force} ${Math.round(s * 100)}%` };
}

export const checkChance = (p, task) => checkOdds(p, task).chance;

export function check(p, task, rng = Math.random) {
    const { chance, limit } = checkOdds(p, task);
    const ok = rng() < chance;
    return `${task.task}: chance ${round(chance * 100, chance < 0.01 && chance > 0 ? 2 : 0)}%${limit ? ` (${limit})` : ''} → ${ok ? 'SUCCESS' : 'FAILURE'}.`;
}
