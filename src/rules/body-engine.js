import { creature } from './df/index.js';
import { bodyWeapon, itemWeapon, momentum, penetrate, tissueOf, liveLayers, shot } from './df/combat.js';
import { weaponOf, metalOf, armorOf, customGearOf, gearMaterialOf, ammoOf } from './df/index.js';
import { sublocationsOf, randomHitPart } from './df/sublocations.js';
import { hearingShift, inRange } from './hearing.js';
import { thermalCapable, thermalMinute, coreStage, clothingClo, BODY_WIND, limbCold, forceFactor, speedFactor, NERVE_PER_C } from './thermal/exposure.js';

export const DAY_MIN = 24 * 60;
const HOUR = 60 / DAY_MIN;

const BLEED = { femoral: [300, 600], limb_artery: [70, 170], small: [1, 10] };
const FRACTURE = {
    arm_spiral: [21, 42], arm_transverse: [42, 84],
    leg_spiral: [42, 84], leg_transverse: [84, 168],
    // Ribs: "at least 6 weeks", complete by 12 weeks (Guttentag & Salwen 1999). Nose: stable 3–5 weeks, fused 4–8 weeks
    // (Wikipedia "Nasal fracture"); midpoints.
    rib: [42, 84], nose: [28, 42],
};
// Small-vessel bleeding stops by clotting within the normal bleeding time: under 5 min, up to 8 min in some texts (Ivy and
// template methods). A bruise clears in 13 days (mild contusion, Jackson & Feagin classification).
const CLOT_MIN = [0, 8];
const INFECTION_DELAY_DAYS = 10.5;
const BRUISE_DAYS = [13, 13];
const NONUNION = { default: 0.02, shin: 0.05, wrist: 0.125 };
const OPEN_FRACTURE_INFECTION = { I: 0.05, II: 0.08, IIIA: 0.12, IIIB: 0.25, IIIC: 0.40 };
// Rule 576, days. Missing types are OPEN-48/49: they do not close yet.
const CUT_HEAL = { eyes: [3, 5], mouth: [3, 5], head: [7, 10], arm: [7, 10], torso: [10, 14], leg: [10, 14], hand: [10, 14], foot: [10, 14] };
const BURN_HEAL = { superficial: [5, 10], partial: [7, 21], deep_partial: [21, 56], full: null };
// Frostbite (superficial): no healing timetable found; the partial-thickness burn row stands in [ASSUMED proxy].
const FROSTBITE_HEAL = BURN_HEAL.partial;
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
    const healRange = w.type === 'blunt' && !w.functionLost ? BRUISE_DAYS
        : ['cut', 'puncture', 'bite', 'blunt'].includes(w.type) || w.functionLost ? CUT_HEAL[row] : w.type === 'burn' ? BURN_HEAL[w.depth]
        : w.type === 'frostbite' ? FROSTBITE_HEAL : null;
    if (w.type === 'burn') wound.depth = BURN_HEAL[w.depth] !== undefined ? w.depth : null;
    // DF HEALING_RATE scales the human days: soft tissue relative to 100, bone relative to 1000 (human templates).
    const factor = w.healFactor ?? 1;
    if (healRange) wound.heals = round(between(rng, healRange) * factor);
    if (w.vessel && BLEED[w.vessel] && bloodVolume(p)) wound.bleed = round(between(rng, BLEED[w.vessel]));
    if (w.vessel === 'small' && wound.bleed) wound.clotIn = Math.round(between(rng, CLOT_MIN));
    if (w.functionLost) wound.functionLost = true;
    if (w.permanent) wound.permanent = true;
    if (w.type === 'severed') wound.severed = true;
    if (w.type === 'fracture') {
        // Parts outside the arm and leg rows have no timetable (OPEN-58): joins stays null.
        const kind = w.part.cats.some(k => k.startsWith('RIB_')) ? 'rib' : w.part.cats.includes('NOSE') ? 'nose'
            : BONE_ROW[row] ? `${BONE_ROW[row]}_${w.fracture || 'transverse'}` : null;
        const bone = w.part.cats.includes('LEG_LOWER') ? 'shin' : 'default';
        wound.fracture = { kind, joins: kind ? FRACTURE[kind][0] * factor : null, full: kind ? FRACTURE[kind][1] * factor : null, crooked: false,
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

export function advance(p, minutes, resting, rng = Math.random, { active = false, sleeping = false } = {}) {
    if (p.dead) return;
    const net = p.net;
    const c = creatureOf(p);
    const needs = !c || c.blood;
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    const n = p.needs;
    n.waterDeath ??= 15 + 5 * rng();
    n.foodDeath ??= 40 + 20 * rng();
    // A knockout lasts until story time passes (its length is OPEN-81).
    if (minutes > 0 && (p.unconscious === 'knocked out' || p.unconscious === 'choked')) p.unconscious = null;
    for (let t = 0; t < minutes; t++) {
        checkDeath(p);
        if (p.apnea != null && ++p.apnea >= APNEA_DEATH_MIN) { p.dead = 'suffocation'; return; }
        const heat = p.env && thermalCapable(p.species) ? thermalMinute(p, { active, sleeping, restL: WATER_L_DAY.rest / DAY_MIN }, rng, () => gauss(rng)) : null;
        if (heat) {
            const st = coreStage(heat.core);
            if (st === 'hypothermia IV') { p.dead = 'hypothermia'; return; }
            if (st === 'hypothermia III') p.unconscious ??= 'hypothermia';
            else if (p.unconscious === 'hypothermia') p.unconscious = null;
            for (const seg of heat.frozen) for (const part of frostParts(c, seg)) addWound(p, { part, type: 'frostbite' }, rng);
        }
        if (needs) {
            n.waterL += heat ? heat.waterL : WATER_L_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            n.kcal += heat ? heat.kcal : KCAL_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            if (sleeping) { if (++n.slept >= SLEEP_RESET_MIN) n.awake = 0; } else { n.slept = 0; n.awake += 1; }
            if (n.alcohol) n.alcohol = Math.max(0, n.alcohol - ELIM_PER_MIN);
            if (n.waterL / p.mass * 100 >= n.waterDeath) { p.dead = 'dehydration'; return; }
            if (n.kcal >= n.foodDeath * KCAL_DAY.rest * kleiber(p)) { p.dead = 'starvation'; return; }
        }
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
            if (w.clotIn != null && w.bleed && --w.clotIn <= 0) { w.bleed = 0; w.clotIn = null; }
            const onset = INFECTION_ONSET[w.type === 'bite' ? 'bite' : 'other'];
            if (w.open && w.infection === null && w.age >= onset) {
                w.infection = rng() < infectionChance(w);
                // An infected wound closes 10.5 days later (surgical-site infection adds 10–11 hospital days; StatPearls,
                // Berríos-Torres 2017 — hospital stay as the proxy for healing).
                if (w.infection && w.heals !== null) { w.heals = Math.max(w.heals, w.age) + INFECTION_DELAY_DAYS; w.healed = false; }
            }
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
        if (w.severed || (fr && (fr.never || fr.joins === null || fr.joins > 0)) || (w.functionLost && (!w.healed || w.permanent))) down.add(w.pid);
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

/** Dies when a THOUGHT part stops working; stops breathing (unconscious) when every BREATHE part stops working. */
function checkDeath(p) {
    const c = creatureOf(p);
    if (!c || p.dead) return;
    const works = worksFn(p, c);
    const brains = c.parts.filter(x => x.flags.includes('THOUGHT'));
    if (brains.length && brains.every(b => !works(b))) { p.dead = 'brain destroyed'; return; }
    const lungs = c.parts.filter(x => x.flags.includes('BREATHE'));
    const apneic = lungs.length > 0 && !c.flags.includes('NOBREATHE') && lungs.every(l => !works(l));
    if (apneic && p.apnea == null) { p.apnea = 0; p.unconscious = 'not breathing'; }
    if (!apneic && p.apnea != null) { p.apnea = null; if (p.unconscious === 'not breathing') p.unconscious = null; }
}

// Frostbite most often strikes cheeks, ears, nose, fingers and toes (Wikipedia "Frostbite", citing McIntosh 2014): when the
// head, a hand or a foot segment's skin freezes, those DF parts take it; other segments freeze as their DF part [ASSUMED].
const SEG_CATS = { head: ['NOSE', 'EAR', 'CHEEK'], neck: ['NECK'], chest: ['BODY_UPPER'], back: ['BODY_UPPER'], pelvis: ['BODY_LOWER'],
    shoulder: ['ARM_UPPER'], arm: ['ARM_LOWER'], hand: ['FINGER'], thigh: ['LEG_UPPER'], leg: ['LEG_LOWER'], foot: ['TOE'] };
function frostParts(c, seg) {
    if (!c) return [];
    const [side, name] = seg.includes('_') ? seg.split('_') : [null, seg];
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const sideOf = part => { for (let q = part; q; q = byId[q.parent]) for (const f of ['LEFT', 'RIGHT']) if (q.flags.includes(f)) return f; return null; };
    return c.parts.filter(x => SEG_CATS[name].some(k => x.cats.includes(k)) && (!side || sideOf(x) === side.toUpperCase()));
}

/**
 * Sets (or clears, env = null) the air a person is in: { air_c, radiant_c, humidity_pct, wind_kmh (weather, 10 m) or air_speed_ms
 * (at the body, indoors), clothing: { ensemble, garments }, face_covered, met, posture }. Throws on unknown clothing.
 */
export function setEnvironment(p, env) {
    if (!env) { p.env = null; return; }
    const cl = env.clothing ?? {};
    const covers = region => (cl.garments ?? []).some(g => (g.covers ?? []).some(x => String(x).toLowerCase().includes(region)));
    p.env = { tdb: env.air_c, tr: env.radiant_c ?? env.air_c, rh: env.humidity_pct ?? 50,
        v: env.air_speed_ms ?? Math.max(0.1, (env.wind_kmh ?? 0) / 3.6 * BODY_WIND), wind10: env.air_speed_ms != null ? 0 : env.wind_kmh ?? 0,
        clo: clothingClo(cl), met: env.met ?? null, posture: env.posture ?? null,
        faceBare: !env.face_covered, handsBare: !(/gloves/i.test(cl.ensemble ?? '') || covers('hand')) };
    if (p.thermal) { p.thermal.bareDose = 0; }
    if (p.env.met == null) delete p.env.met;
    if (p.env.posture == null) delete p.env.posture;
}

export function status(who, p) {
    if (p.dead) return `${who}: dead (${p.dead}).`;
    const out = [];
    if (p.apnea != null) out.push(`${who}: not breathing, unconscious; dies in ${APNEA_DEATH_MIN - p.apnea} min`);
    else if (p.unconscious) out.push(`${who}: unconscious (${p.unconscious})`);
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
        if (w.functionLost && w.permanent) bits.push('function lost for good (tissue that never heals)');
        else if (w.functionLost && !w.healed) bits.push('function lost until it closes');
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
    if (p.needs) {
        const nd = p.needs, pct = nd.waterL / p.mass * 100, hours = nd.awake / 60;
        if (pct >= 2) out.push(`water lost ${round(nd.waterL, 1)} L (${round(pct)} % of body mass${pct >= 8 ? ': weak, dizzy, faint; heavy exertion fails' : pct >= 5 ? ': headache, irritable, light-headed' : ''})`);
        if (nd.kcal >= KCAL_DAY.rest * kleiber(p)) out.push(`food deficit ${Math.round(nd.kcal)} kcal (${round(nd.kcal / (KCAL_DAY.rest * kleiber(p)), 1)} days without food at rest)`);
        if (hours >= 10) out.push(`awake ${round(hours)} h: performs like blood alcohol ${round(awakeBac(hours), 3)} %`);
        if (nd.alcohol > 0) out.push(`blood alcohol ${round(nd.alcohol, 3)} %`);
    }
    const th = p.thermal;
    if (p.env && th?.core != null) {
        const st = coreStage(th.core);
        out.push(`core ${th.core} °C${st ? ` (${st})` : ''}, coldest skin ${th.skinMin} °C (${th.coldest.replace('_', ' ')})`);
    }
    const n = p.net, s = stage(n);
    out.push(`network: C ${n.C}, N ${n.N}, stage ${s.stage} (max complexity ${s.max}), R ${Math.floor(n.R)}/${n.C} PE, P ${Math.round(n.P * 100)}%`);
    return out.join('. ') + '.';
}

// Knockout: a blunt blow to a HEAD part knocks out when the momentum reaching the head's tissue (after armour) is at least
// this value. Fit (docs/df-body-engine.md §6.1): a Professional 70 kg punch knocks out on 0.743 % of landed head punches
// (97 KOs in 222 BKFC 2022 bouts). Without breathing: death after 5 min (Merck Manual, respiratory arrest).
const KO_MOMENTUM = 158.0;
// Chokes: unconscious after 6.2–10.5 s of a locked hold on the neck (by choke type; mean 9.0 s, 81 chokes on fully resisting
// trained fighters, Int J Perf Anal Sport 2020); held 5 min → dead (no gas exchange, as APNEA_DEATH_MIN).
const CHOKE_LOC_S = [6.2, 10.5];
// Default face area of held DF items: shield Ø 85 cm (Viking round shields 80–90 cm, Hurstwic); buckler Ø 30 cm
// (reenactment guidance "10–12 in upwards", Vikings wiki). Thickness 0.9 cm (surviving shields 6–12 mm, Hurstwic).
const HELD_FACE_CM2 = { ITEM_SHIELD_SHIELD: Math.PI * 42.5 ** 2, ITEM_SHIELD_BUCKLER: Math.PI * 15 ** 2 };
const HELD_THICK_CM = 0.9;
const APNEA_DEATH_MIN = 5;
// Survival (Tipton & Montgomery 2025, Exp Physiol "The physiology of survival: fluid and food"): net water loss 1.5 L/day at
// rest, 4 L/day active or in heat; water lost 5 % of body mass → headache, light-headedness; 8 % → performance significantly
// impaired; death at 15–20 %. Energy use 1400 kcal/day at rest, 2400 active; total starvation kills in 40–60 days.
// Awake hours (NIOSH, from Dawson & Reid 1997): 17 h ≈ BAC 0.05 %, 24 h ≈ 0.10 %. Sleep of 7 h (AASM adult minimum) resets.
const WATER_L_DAY = { rest: 1.5, active: 4 };
const KCAL_DAY = { rest: 1400, active: 2400 };
const SLEEP_RESET_MIN = 7 * 60;
// Other body masses scale water and energy use by (mass ÷ 70 kg)^0.75 (Kleiber's metabolic scaling law).
const kleiber = p => (p.mass / 70) ** 0.75;
// Alertness: impairment as blood-alcohol level = drinking (Widmark: grams ÷ (0.68 × body g) × 100, eliminated 0.015 %/h)
// + hours awake. Odds of failing × the crash odds ratio exp(40.7 × BAC^1.345), the curve through NHTSA 2015 (Compton & Berning,
// case-control) adjusted odds ratios 2.07 at 0.05 % and 3.93 at 0.08 %, and 1 at 0.
const WIDMARK_R = 0.68, ELIM_PER_MIN = 0.015 / 60;
export const crashRisk = bac => Math.exp(40.7 * Math.max(0, bac) ** 1.345);
export const impairmentBac = p => (p.needs?.alcohol || 0) + awakeBac((p.needs?.awake || 0) / 60);
export const awakeBac = h => Math.max(0, 0.05 + (h - 17) * 0.05 / 7);
// Flight speed of a shot: 47.23 m/s, a 102 g arrow from a 144 lbf yew self bow (Stretton et al. 2010), for every launcher.
const SHOT_MPS = 47.23;

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
    // Through every layer: organ (FUNCTIONAL) tissue stops working, for good when it has no HEALING_RATE (as in strike).
    const organ = liveLayers(c, part).map(l => tissueOf(c, l)).filter(t => t?.flags.includes('FUNCTIONAL'));
    const w = addWound(p, { part, type, vessel: vesselOf(c, part.layers, rng), functionLost: organ.length > 0,
        permanent: organ.some(t => t.HEALING_RATE == null) }, rng);
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
const LIMB_MOVE_S = 0.242;                              // VencesBrito 2011 karate punch: moving a limb (block)
const BODY_MOVE_S = 0.715;                              // Wakatsuki & Yamada 2020: reactive side-step movement time (dodge)
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
    if (defender?.unconscious) return Infinity;
    const awake = a.awake !== false;
    const dist = a.distance_m ?? t.reach;
    const intentFrom = a.intent_visible ? 0 : t.approach;
    const m = defender?.mass ?? REF_MASS;
    const body = defender?.body || {};
    const nerve = Math.max(1, (body.nerve_mps ?? NERVE_MPS) - NERVE_PER_C * limbCold(defender, 'arm'));
    const motor = SYNAPSE_S + (body.limb_m ?? REACH_M * size(m, EXP_LENGTH)) / nerve + twitch(m);
    const rt = channel => ((body.sense_s?.[channel] ?? SENSE_S[channel]) + (body.decide_s ?? DECIDE_S) + motor)
        * Math.max(0.5, 1 + RT_CV * gauss(rng));
    const done = [];
    const perceive = (from, reaction) => done.push(Math.max(from, intentFrom) + reaction);
    // Sense organs. Human monocular field 107° temporal, 60° nasal (Rönne 1915): a blow from the side (90°) is seen only by
    // the eye on that side, from behind by none. One ear lost: thresholds +3 dB (binaural summation, Baker et al. 2020).
    const c = defender ? creatureOf(defender) : null;
    const works = c ? worksFn(defender, c) : () => true;
    const organs = flag => c ? c.parts.filter(x => x.flags.includes(flag)) : [{ flags: [] }];
    const eyes = organs('SIGHT').filter(works), ears = organs('HEAR'), earsOk = ears.filter(works).length;
    const dir = a.from ?? (a.facing === false ? 'back' : 'front');
    const sideFlag = { left: 'LEFT', right: 'RIGHT' }[dir];
    const eyeSees = e => sideFlag ? e.flags.includes(sideFlag) || !e.flags.some(f => f === 'LEFT' || f === 'RIGHT') : a.facing !== false;
    const sees = a.lit !== false && dir !== 'back' && eyes.some(eyeSees);
    const db = a.noise_db || 0, level = db - hearingShift(defender?.species) - (earsOk < ears.length ? 3 : 0);
    const audible = earsOk > 0 && inRange(defender?.species, db, a.noise_khz);
    if (awake && sees) perceive(0, rt('sight'));
    if (awake && audible && level > HEAR_DB) perceive(0, rt('hearing'));
    if (!awake && audible && level >= WAKE_DB) {
        const woke = WAKE_MIN_S + rng() * (WAKE_MAX_S - WAKE_MIN_S);
        // Once awake the target sees or hears like anyone awake, slowed by sleep inertia.
        perceive(woke, rt(sees ? 'sight' : 'hearing') / INERTIA_SPEED);
    }
    const r = a.sense_range_m || 0;
    if (awake && r > 0) {
        // Senses during sleep: OPEN-63. A range sense perceives the attacker (or its hand) within r.
        const enter = dist <= r ? 0 : r >= t.reach ? (dist - r) / a.approach_speed : t.approach + t.strike * (t.reach - r) / t.reach;
        perceive(enter, rt('sight'));
    }
    return done.length ? Math.min(...done) : Infinity;
}

/** Seconds a defensive move takes: a limb (block) or the whole body (dodge), ÷ the ability that drives it. */
function moveTime(defender, kind) {
    const ab = defender ? abilities(defender) : {};
    const key = kind === 'block' ? 'grasp' : 'stance';
    const capacity = (key in ab ? ab[key] : kind === 'block' ? 0 : 1) * speedFactor(limbCold(defender, kind === 'block' ? 'arm' : 'leg'));
    if (capacity <= 0) return Infinity;
    return (kind === 'block' ? LIMB_MOVE_S : BODY_MOVE_S) * size(defender?.mass ?? REF_MASS, EXP_MOVE) / capacity;
}

/**
 * An attack (docs/df-body-engine.md §4–5). a: { part, attack, weapon?, material?, armor? (worn items, text), skill?, style?, prone?, species?, mass?,
 * landed?, scene fields }. The attacker's species and mass come from the tracked attacker when there is one.
 */
export function strike(target, a, attacker = null, rng = Math.random) {
    const tc = creatureOf(target);
    const ac = creature(attacker?.species ?? a.species ?? 'HUMAN');
    if (!tc || !ac) return 'Creature data is not loaded. Nothing recorded.';
    const aMass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    let part = a.part ? findPart(tc, a.part)
        : randomHitPart(tc, rng, { attackerCm3: aMass * 1000, flies: ac.parts.some(x => x.flags.includes('FLIER')) });
    if (!part || part.flags.includes('INTERNAL')) return `${tc.name} has no part "${a.part}" to aim at. Parts: ${aimable(tc).join(', ')}. Nothing recorded.`;
    const mass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    const iSize = mass * 1000;
    const worn = [];
    // Worn gear: a DF item ("iron helm") gives the defaults; covers (CDDA-style portions: part, sub-locations, coverage %,
    // material), layer and flexible replace them.
    const pct = x => Math.max(0, Math.min(150, Number(x)));
    const works = worksFn(target, tc);
    const notes = [];
    for (const g of a.armor || []) {
        const spec = typeof g === 'string' ? { item: g } : g || {};
        const it = armorOf(spec.item) ?? (spec.covers?.length || spec.held_in || spec.size_cm ? customGearOf(spec.item) : null);
        if (!it) return `No gear "${spec.item}": name a DF item with its material ("iron helm", "leather armor"), or give covers, held_in or size_cm with a material first ("iron skullcap"). Nothing recorded.`;
        // Held: in the named part, else a working GRASP part for DF shields; dropped from the hit when no holding part works.
        if (spec.held_in || it.kind === 'ITEM_SHIELD') {
            const holder = spec.held_in ? findPart(tc, spec.held_in) : tc.parts.find(x => x.flags.includes('GRASP') && works(x));
            if (spec.held_in && !holder) return `${tc.name} has no part "${spec.held_in}". Nothing recorded.`;
            if (!holder || !works(holder)) { notes.push(`${it.name} not held (no working hand)`); continue; }
            it.held = holder;
            const dims = (spec.size_cm || []).map(Number).filter(x => x > 0);
            const face = dims.length >= 2 ? dims[0] * dims[1] : dims.length === 1 ? Math.PI * (dims[0] / 2) ** 2
                : HELD_FACE_CM2[it.id] ?? null;
            if (!face) return `${it.name}: give size_cm (diameter, or width and height). Nothing recorded.`;
            it.face = face;
            it.thick = Number(spec.thickness_cm) || HELD_THICK_CM;
        }
        if (spec.layer) it.layer = spec.layer;
        if (spec.flexible !== undefined) it.elastic = !!spec.flexible;
        if (spec.covers?.length) {
            it.parts = {};
            for (const cv of spec.covers) {
                const pt = findPart(tc, cv.part);
                if (!pt) return `${tc.name} has no part "${cv.part}" for ${it.name}. Nothing recorded.`;
                const known = Object.keys(sublocationsOf(pt) || {});
                const subs = cv.sublocations?.length ? cv.sublocations.map(x => String(x).trim().toLowerCase()) : null;
                const bad = subs?.find(x => !known.includes(x));
                if (bad) return `${pt.name} has no sub-location "${bad}"${known.length ? ` (${known.join(', ')})` : ''}. Nothing recorded.`;
                const mat = cv.material ? gearMaterialOf(cv.material) : null;
                if (cv.material && !mat) return `No material "${cv.material}". Nothing recorded.`;
                const sides = cv.sides?.length ? cv.sides.filter(x => x === 'front' || x === 'back') : null;
                (it.parts[pt.id] ??= []).push({ subs, sides, coverage: pct(cv.coverage ?? 100), ...(mat ? { mat, elastic: mat.kind === 'thread' } : {}) });
            }
        }
        // A held item without covers guards the front of the holding limb, torso and head: coverage = its face area ÷ their
        // frontal area, each part's frontal area = (part size cm³)^(2/3) [geometric similarity].
        if (it.held && !spec.covers?.length) {
            const chain = [];
            for (let q = it.held; q && !q.flags.includes('UPPERBODY'); q = tc.parts.find(x => x.id === q.parent)) chain.push(q);
            const guarded = [...chain, ...tc.parts.filter(x => ['UPPERBODY', 'LOWERBODY', 'HEAD'].some(f => x.flags.includes(f)))];
            const front = guarded.reduce((s, x) => s + (target.mass * 1000 * x.relsize / tc.relTotal) ** (2 / 3), 0);
            const cov = Math.min(100, 100 * it.face / front);
            it.parts = Object.fromEntries(guarded.map(x => [x.id, [{ subs: null, sides: ['front'], coverage: cov }]]));
            it.size = it.face * it.thick;
        }
        worn.push(it);
    }
    let w, verb, means, bite = false;
    if (a.launcher) {
        const lw = weaponOf(a.launcher);
        if (!lw?.ranged) return `No DF launcher "${a.launcher}" (bow, crossbow, blowgun). Nothing recorded.`;
        const am = ammoOf(lw.ranged.ammoClass);
        const mat = gearMaterialOf(a.material || 'iron');
        if (!am || !mat) return `No ammunition for ${a.launcher}${a.material ? ` in ${a.material}` : ''}. Nothing recorded.`;
        w = shot(lw, am, mat);
        verb = 'shot';
        means = 'shot';
    } else if (a.weapon) {
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
        const t = means === 'shot'
            ? { approach: 0, reach: a.distance_m ?? 10, strike: (a.distance_m ?? 10) / SHOT_MPS }
            : impactTime(at, rng);
        if (!t) return `${verb} at ${part.name}: out of reach (${a.distance_m} m, no approach). Nothing lands.`;
        const impact = t.approach + t.strike;
        // The defender reacts at `ready`, then moves: a dodge moves the body out of the way; a block puts a limb in the
        // blow's way (with the held item, else the forearm itself).
        const ready = defenceDone(at, t, target, rng);
        const works = worksFn(target, tc);
        const held = worn.find(x => x.held);
        const forearm = tc.parts.find(x => x.flags.includes('LIMB') && works(x) && tc.parts.some(g => g.parent === x.id && g.flags.includes('GRASP') && works(g)));
        const blockAt = held || forearm ? ready + moveTime(target, 'block') : Infinity;
        const dodgeAt = ready + moveTime(target, 'dodge');
        const at2 = s => `${s.toFixed(2)} s, impact at ${impact.toFixed(2)} s`;
        // Least harm first: a dodge that finishes in time, else a block with a held item, else with the forearm.
        if (dodgeAt <= impact) return `${verb} at ${part.name}: dodged (dodge done at ${at2(dodgeAt)}).`;
        if (blockAt <= impact) {
            if (held) { held.blocking = true; notes.push(`blocked with ${held.name} (block done at ${at2(blockAt)})`); }
            else { notes.push(`blocked with the ${forearm.name} (block done at ${at2(blockAt)})`); part = forearm; }
        }
    }
    const M = means === 'shot' ? w.M : momentum(ac, iSize, w, a) * Math.max(0, 1 + SPREAD * gauss(rng));
    // Side hit: the one facing the attacker; a blow from the left or right lands front or back alike (equal halves).
    const from = a.from ?? (a.facing === false ? 'back' : 'front');
    const side = from === 'front' || from === 'back' ? from : rng() < 0.5 ? 'front' : 'back';
    const r = penetrate(tc, part, target.mass * 1000, w, M, rng, worn, side);
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
        // DF HEALING_RATE: lower heals faster, absent never heals (wiki Tissue definition token).
        const rate = h => h.layer.healing ?? tissueOf(tc, h.layer)?.HEALING_RATE;
        const slowest = (hs, ref) => hs.length && hs.every(h => rate(h) != null) ? Math.max(...hs.map(rate)) / ref : 1;
        const permanent = hits.some(h => flags(h).includes('FUNCTIONAL') && rate(h) == null);
        if (soft.length || severed) {
            const type = severed ? 'severed' : cuts.length ? (bite ? 'bite' : w.piercing ? 'puncture' : 'cut') : 'blunt';
            made.push(addWound(target, { part: hp, type, vessel: cuts.length ? vesselOf(tc, cuts, rng) : undefined, functionLost, permanent,
                healFactor: slowest(soft.filter(h => rate(h) != null), 100) }, rng));
        }
        if (hits.some(rigid)) made.push(addWound(target, { part: hp, type: 'fracture', open: cuts.length > 0, healFactor: slowest(hits.filter(rigid).filter(h => rate(h) != null), 1000) }, rng));
    }
    checkDeath(target);
    const ko = !target.dead && part.flags.includes('HEAD') && !r.first.edged && r.first.M >= KO_MOMENTUM;
    if (ko && !target.unconscious) target.unconscious = 'knocked out';
    const parts = [...new Set(r.tested.map(t => t.part))];
    const layers = parts.map(pt => `${pt.name}: ${r.tested.filter(t => t.part === pt).map(t => `${t.layer.tissue.toLowerCase()} ${t.result}`).join(', ')}`).join('; ');
    const wounds = made.length ? ` Wound${made.length > 1 ? 's' : ''} ${made.map(x => x.id).join(', ')}.` : ' No wound.';
    return `${notes.length ? `${notes.join('; ')}. ` : ''}${verb} (${w.name}) to ${part.name} (${[r.side, r.sub].filter(Boolean).join(', ')}): momentum ${round(M)}. ${layers}${r.severed ? `; ${part.name} severed` : ''}.${wounds}${ko ? ' Knocked out.' : ''}`;
}

/**
 * What a message carries from speaker to listener. Speech: the speaker's species can talk (DF CAN_SPEAK, or INTELLIGENT =
 * CAN_SPEAK + CAN_LEARN), it is conscious, a BREATHE part and a MOUTH part work (a TONGUE part not working slurs it);
 * the listener is conscious with a working HEAR part; words carry meaning only to a species that can talk and, when both
 * know their languages, share one. Gesture: the listener has a working SIGHT part and light.
 */
/** A choke held for `seconds` on a creature with a neck: unconscious past its threshold, dead past 5 min. */
export function choke(p, seconds, holder = null, rng = Math.random) {
    const c = creatureOf(p);
    if (!c?.parts.some(x => x.cats.includes('NECK') || x.flags.includes('THROAT'))) return 'No neck to choke.';
    if (holder && abilities(holder).grasp === 0) return 'The holder has no working hand to hold a choke.';
    if (p.dead) return 'Already dead.';
    const s = Math.max(0, Number(seconds) || 0);
    const at = between(rng, CHOKE_LOC_S);
    if (s >= APNEA_DEATH_MIN * 60) { p.dead = 'strangulation'; return `Choke held ${s} s: dead (strangulation).`; }
    if (s >= at) { p.unconscious = 'choked'; return `Choke held ${s} s: unconscious at ${round(at)} s.`; }
    return `Choke held ${s} s: still conscious (would black out at ${round(at)} s).`;
}

/** Drinking and eating: water in L, food in kcal, taken off the deficits (never below 0). */
export function intake(p, { water_l = 0, food_kcal = 0, alcohol_g = 0 } = {}) {
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    p.needs.alcohol = (p.needs.alcohol || 0) + Math.max(0, Number(alcohol_g) || 0) / (WIDMARK_R * p.mass * 1000) * 100;
    p.needs.waterL = Math.max(0, p.needs.waterL - Math.max(0, Number(water_l) || 0));
    p.needs.kcal = Math.max(0, p.needs.kcal - Math.max(0, Number(food_kcal) || 0));
}

export function communicate(sp, s, ls, l, { means = 'speech', lit = true, languages = [null, null] } = {}) {
    const sc = creatureOf(s), lc = creatureOf(l);
    if (!sc || !lc) return 'Creature data is not loaded.';
    const talks = c => c.flags.includes('CAN_SPEAK') || c.flags.includes('INTELLIGENT');
    const anyWorks = (p, c, test) => { const parts = c.parts.filter(test); const w = worksFn(p, c); return parts.length ? parts.some(w) : null; };
    const flag = f => x => x.flags.includes(f);
    if (l.dead || l.unconscious) return `${ls} perceives nothing (${l.dead ? 'dead' : 'unconscious'}).`;
    if (means === 'gesture') {
        if (anyWorks(l, lc, flag('SIGHT')) === false || !lit) return `${ls} cannot see the gesture.`;
        return `${ls} sees the gesture${talks(lc) ? '' : `; it reads posture and movement as its species does (${lc.name}: cannot talk)`}.`;
    }
    if (s.dead || s.unconscious) return `${sp} makes no sound (${s.dead ? 'dead' : 'unconscious'}).`;
    if (!talks(sc)) return `${sp} cannot produce speech (${sc.name}: cannot talk); it makes its species' own sounds.`;
    if (anyWorks(s, sc, flag('BREATHE')) === false) return `${sp} has no voice: not breathing.`;
    if (anyWorks(s, sc, flag('MOUTH')) === false) return `${sp}'s speech is unintelligible: mouth not working.`;
    const slurred = anyWorks(s, sc, x => x.cats.includes('TONGUE')) === false;
    if (anyWorks(l, lc, flag('HEAR')) === false) return `${ls} cannot hear it.`;
    if (!talks(lc)) return `${ls} hears the sounds and their tone; the words carry no meaning (${lc.name}: cannot talk).`;
    const [a, b] = languages;
    if (a?.length && b?.length && !a.some(x => b.includes(x))) return `${ls} hears speech in a language it does not know (${a.join(', ')}); only tone and gestures carry.`;
    return `${ls} hears and understands ${sp}${slurred ? ', slurred (tongue not working): short, simple words only' : ''}.`;
}

// Interruptions (NetHack occupations, Pathos Interrupt): time stops at the first change in anyone's condition.
const waterStage = p => { const pct = p.needs ? p.needs.waterL / p.mass * 100 : 0; return pct >= 8 ? 2 : pct >= 5 ? 1 : 0; };
const watch = p => ({
    dead: p.dead, cls: bloodClass(p), dying: p.deathIn !== null, out: p.unconscious ?? null, thirst: waterStage(p),
    heat: coreStage(p.thermal?.core), core: p.thermal?.core, frost: p.wounds.filter(w => w.type === 'frostbite').map(w => w.part),
    infected: p.wounds.filter(w => w.infection === true).map(w => w.id),
});

function changes(who, a, b) {
    const out = [];
    if (b.dead && !a.dead) out.push(`${who} dies (${b.dead})`);
    else {
        if (b.cls > a.cls) out.push(`${who} reaches blood-loss class ${['I', 'II', 'III', 'IV'][b.cls - 1]}`);
        if (b.dying && !a.dying) out.push(`${who} is dying`);
        if (a.out && !b.out) out.push(`${who} comes to`);
        if (b.thirst > a.thirst) out.push(`${who} is ${b.thirst === 2 ? 'severely dehydrated (8 % of body mass)' : 'dehydrated (5 % of body mass)'}`);
        if (!a.out && b.out) out.push(`${who} loses consciousness (${b.out})`);
        for (const id of b.infected) if (!a.infected.includes(id)) out.push(`${who}: wound ${id} is infected`);
        if (b.heat !== a.heat) out.push(`${who}: ${b.heat ?? 'core temperature between 35 and 40 °C'} (core ${b.core} °C)`);
        const frost = b.frost.filter(x => !a.frost.includes(x));
        if (frost.length) out.push(`${who}: frostbite on ${frost.join(', ')}`);
    }
    return out;
}

/** Advances everyone minute by minute; stops at the end of the first minute in which a condition changes. */
export function advanceAll(people, minutes, resting = new Set(), rng = Math.random, { active = new Set(), sleeping = new Set() } = {}) {
    const total = Math.max(0, Math.round(minutes));
    for (let m = 1; m <= total; m++) {
        const events = [];
        for (const [who, p] of Object.entries(people)) {
            const before = watch(p);
            advance(p, 1, resting.has(who), rng, { active: active.has(who), sleeping: sleeping.has(who) });
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
    if (p.unconscious) return { chance: 0, limit: `unconscious (${p.unconscious})` };
    if (exertion === 'heavy' && p.needs && p.needs.waterL / p.mass * 100 >= 8) return { chance: 0, limit: 'dehydrated 8 % of body mass' };
    const cls = bloodClass(p);
    if (cls === 4 || (cls >= 3 && on_feet) || cls >= (EXERTION_FAILS_AT[exertion] ?? 5)) return { chance: 0, limit: `blood-loss class ${['I', 'II', 'III', 'IV'][cls - 1]}` };
    const scores = abilities(p);
    // Cold limbs lower force capacity (§6.4).
    if ('grasp' in scores) scores.grasp *= forceFactor(limbCold(p, 'arm'));
    if ('stance' in scores) scores.stance *= forceFactor(limbCold(p, 'leg'));
    const lacking = uses.find(u => u in FUNCTIONS && !(u in scores));
    if (lacking) return { chance: 0, limit: `no ${lacking}` };
    const used = uses.filter(u => u in scores);
    const risk = uses.includes('alertness') ? crashRisk(impairmentBac(p)) : 1;
    const zero = used.find(u => scores[u] === 0);
    if (zero) return { chance: 0, limit: `${zero} 0%` };
    const force = used.filter(u => FORCE_SCORES.includes(u)).sort((x, y) => scores[x] - scores[y])[0];
    const s = force ? scores[force] : 1;
    const base = Math.max(0, Math.min(1, Number(share) || 0));
    const alert = (r, limit) => risk > 1.005
        ? { chance: r >= 1 ? 1 : r / (r + (1 - r) * risk), limit: [limit, `alertness: blood alcohol equivalent ${round(impairmentBac(p), 3)} %, odds of failing × ${round(risk, 2)}`].filter(Boolean).join('; ') }
        : { chance: r, limit };
    if (s >= 1 || base === 0) return alert(base);
    const demand = 1 - normInv(Math.min(0.999, base)) * CAPACITY_CV;
    return alert(normCdf((s - demand) / (s * CAPACITY_CV)), `${force} ${Math.round(s * 100)}%`);
}

export const checkChance = (p, task) => checkOdds(p, task).chance;

export function check(p, task, rng = Math.random) {
    const { chance, limit } = checkOdds(p, task);
    const ok = rng() < chance;
    return `${task.task}: chance ${round(chance * 100, chance < 0.01 && chance > 0 ? 2 : 0)}%${limit ? ` (${limit})` : ''} → ${ok ? 'SUCCESS' : 'FAILURE'}.`;
}
