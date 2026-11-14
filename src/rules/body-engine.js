import { creature } from './df/index.js';
import { bodyWeapon, itemWeapon, momentum, penetrate, tissueOf, liveLayers, shot, SKILL_LEVELS } from './df/combat.js';
import { weaponOf, metalOf, armorOf, customGearOf, gearMaterialOf, ammoOf } from './df/index.js';
import { sublocationsOf, randomHitPart } from './df/sublocations.js';
import { hearingShift, inRange, hearingOf, bandShift } from './hearing.js';
import { landing } from './materials.js';
import { reach, hearSound, SOUNDS, BAND_HZ, classOf, soundSpeed } from './acoustics.js';
import { see, acuityOf, ageAcuity } from './vision.js';
import { grip, gripNorm } from './strength.js';
import { endothermMinute } from './thermal/endotherm.js';
import { envenom, baseVenom, symptoms, activeSymptoms } from './venom.js';
import { relativeLoad, mawtHours, vo2max, vo2avail } from './work.js';
import { foodEnergy } from './substance.js';
import { drugMinute, drugStatus } from './drugs.js';
import { def, k, reaches } from './constants.js';
import { drmRow, drmLine } from './mood.js';
import { worldHasMagic } from './world.js';
import { equivalentAltitude, pressureTorr, aerobicFactor, amsChance, haceChance, hapeChance, HACE_DEATH_H, tucRange } from './thermal/altitude.js';
import { relatedShare } from './intelligibility.js';
import { kindRoute } from './verbs.js';
import { pulseWound } from './pulse.js';
import { thermalCapable, thermalMinute, coreStage, clothingClo, BODY_WIND, immersion, limbCold, forceFactor, speedFactor, NERVE_PER_C, handSkin, fineFactor, burnDose, contactTemp, burnedTBSA } from './thermal/exposure.js';
export const DAY_MIN = 24 * 60;
const HOUR = 60 / DAY_MIN;
const BLEED = { femoral: [300, 600], limb_artery: [70, 170], small: [1, 10] };
const FRACTURE = {
    arm_spiral: [21, 42], arm_transverse: [42, 84],
    leg_spiral: [42, 84], leg_transverse: [84, 168],
    // Ribs: "at least 6 weeks", complete by 12 weeks (Guttentag & Salwen 1999). Nose: stable 3–5 weeks, fused 4–8 weeks
    // (Wikipedia "Nasal fracture"); midpoints.
    rib: [42, 84], nose: [28, 42],
    // Joints and spine, as [weight-bearing or cast off, healed]: wrist (distal radius) cast 6 weeks, healing "a year or two";
    // ankle weight off 6 weeks, significant recovery within 4 months; hip 3–6 months (Wikipedia: Distal radius, Ankle, Hip
    // fracture). Spine: pain eases at about 4 weeks, resolves at about 12 (Merck, vertebral compression fractures) [ASSUMED pain
    // course = healing].
    wrist: [42, 365], ankle: [42, 120], hip: [90, 180], spine: [28, 84],
    // Elbow (olecranon) and knee (patella) immobilized 3 weeks (Wikipedia: Olecranon, Patellar fracture); healed at the humerus
    // shaft's "up to 12 weeks" (Wikipedia: Humerus fracture); shoulder as elbow [ASSUMED].
    elbow: [21, 84], knee: [21, 84], shoulder: [21, 84],
};
// Small-vessel bleeding stops by clotting within the normal bleeding time: under 5 min, up to 8 min in some texts (Ivy and
// template methods). A bruise clears in 13 days (mild contusion, Jackson & Feagin classification).
const CLOT_MIN = [0, 8];
const INFECTION_DELAY_DAYS = 10.5;
const BRUISE_DAYS = [13, 13];
const NONUNION = { default: 0.02, shin: 0.05, wrist: 0.125 };
const SOLID = { cut: [[28, 119], [42, 203]], blunt: [[28, 119], [42, 203]] };
const ORGAN_HEAL = { SPLEEN: SOLID, LIVER: SOLID, KIDNEY: SOLID, LUNG: { blunt: [[5, 7], [5, 7]], cut: [[21, 35], [21, 35]] } };
const OPEN_FRACTURE_INFECTION = { I: 0.05, II: 0.08, IIIA: 0.12, IIIB: 0.25, IIIC: 0.40 };
// Rule 576, days. Missing types are OPEN-48/49: they do not close yet.
const CUT_HEAL = { eyes: [3, 5], mouth: [3, 5], head: [7, 10], arm: [7, 10], torso: [10, 14], leg: [10, 14], hand: [10, 14], foot: [10, 14],
    // Suture-removal times: neck 5–7, over a joint 14 days (Trott 2012, as tabled by askmygp.com.au).
    neck: [5, 7], joint: [14, 14] };
const BURN_HEAL = { superficial: [5, 10], partial: [7, 21], deep_partial: [21, 56], full: null };
// Frostbite (superficial): no healing timetable found; the partial-thickness burn row stands in [ASSUMED proxy].
const FROSTBITE_HEAL = BURN_HEAL.partial;
const INFECTION_ONSET = { bite: 1, other: 10 };
const CROOKED_GRIP = 0.51;
const COST = [0, 40, 64, 107, 178, 297, 495, 825, 1375, 2292];
const FALL_ROWS = [[12.0, 0.44], [15.6, 0.56], [19.2, 0.78]];
export const FUNCTIONS = { grasp: 'GRASP', stance: 'STANCE', sight: 'SIGHT', hearing: 'HEAR', smell: 'SMELL', breathing: 'BREATHE' };
// DF part category → rule-576 healing row (cuts) and fracture row.
const CUT_ROW = { EYE: 'eyes', EYELID: 'eyes', MOUTH: 'mouth', LIP: 'mouth', TONGUE: 'mouth', TOOTH: 'mouth', HEAD: 'head', NOSE: 'head', EAR: 'head',
    CHEEK: 'head', BODY_UPPER: 'torso', BODY_LOWER: 'torso', BODY: 'torso', ARM_UPPER: 'arm', ARM_LOWER: 'arm', ARM: 'arm', HAND: 'hand', FINGER: 'hand',
    LEG_UPPER: 'leg', LEG_LOWER: 'leg', LEG: 'leg', LEG_FRONT: 'leg', LEG_REAR: 'leg', FOOT: 'foot', FOOT_FRONT: 'foot', FOOT_REAR: 'foot', TOE: 'foot',
    NECK: 'neck', THROAT: 'neck', JOINT: 'joint' };
const BONE_ROW = { arm: 'arm', hand: 'arm', leg: 'leg', foot: 'leg' };
const rowOf = (part) => part?.cats?.map(k => CUT_ROW[k]).find(Boolean) ?? null;
const between = (rng, [a, b]) => a + (b - a) * rng();
/** Deterministic [0, 1) stream from a string seed (FNV-1a hash into mulberry32). */
export function seededRng(seed) {
    let h = 2166136261;
    for (const ch of String(seed))
        h = Math.imul(h ^ ch.codePointAt(0), 16777619);
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
export const creatureOf = (p) => creature(p?.species ?? 'HUMAN');
// DF creature tokens that switch off a need or an effect: NOBREATHE, NO_EAT, NO_DRINK, NO_SLEEP, NOEXERT, NOSTUN, and the
// syndrome immunities NOPAIN, NO_DIZZINESS, NO_FEVERS, NONAUSEA, PARALYZEIMMUNE [RAW].
const has = (p, flag) => !!creatureOf(p)?.flags?.includes(flag);
export function person(state, who, massKg, species = 'HUMAN') {
    state.people ??= {};
    if (!state.people[who]) {
        const c = creature(species);
        state.people[who] = newPerson(massKg || (c ? c.size / 1000 : 70), species);
    }
    return state.people[who];
}
export const bloodVolume = (p) => creatureOf(p)?.blood === false ? 0 : p.mass * 70;
// Syverud 1989 (swine, steady femoral bleed 1.0 / 1.25 mL/kg/min): death at 50.2 / 49.8 mL/kg lost.
const LETHAL_LOSS_ML_KG = 50;
export const lossFraction = (p) => bloodVolume(p) ? p.lost / bloodVolume(p) : 0;
// Signs by class of blood loss (Gutierrez, Reines & Wulf-Gutierrez 2004, Crit Care 8:373, Table 1).
const SHOCK_SIGNS = [
    'pulse under 100, blood pressure normal, breathing 14–20/min, mind normal',
    'pulse over 100, blood pressure falling, breathing 20–30/min, anxious',
    'pulse over 120, blood pressure low, breathing 30–40/min, little urine, confused',
    'pulse over 140, blood pressure low, breathing over 35/min, no urine, lethargic',
];
export function bloodClass(p) {
    const f = lossFraction(p);
    return f > 0.4 ? 4 : f >= 0.3 ? 3 : f >= 0.15 ? 2 : 1;
}
export function stage(net) {
    if (net.N >= 13)
        return { stage: 5, max: 9 };
    if (net.N >= 2)
        return { stage: 4, max: 9 };
    if (net.N === 1)
        return { stage: 3, max: 6 };
    return net.C >= 200 ? { stage: 2, max: 3 } : { stage: 1, max: 1 };
}
/** w.part = a DF part of the person's creature. */
export function addWound(p, w, rng = Math.random) {
    const row = rowOf(w.part);
    const wound = { id: p.nextId++, part: w.part.name, pid: w.part.id, type: w.type, bleed: 0, age: 0, cleanedAt: null, infection: null, splinted: false, heals: null, healed: false };
    const organ = w.part.cats.find(k => ORGAN_HEAL[k]);
    const healRange = organ && ['cut', 'puncture', 'bite', 'blunt'].includes(w.type)
        ? ORGAN_HEAL[organ][w.type === 'blunt' ? 'blunt' : 'cut']?.[w.functionLost ? 1 : 0] ?? null
        : w.type === 'blunt' && !w.functionLost ? BRUISE_DAYS
            : ['cut', 'puncture', 'bite', 'blunt'].includes(w.type) || w.functionLost ? CUT_HEAL[row ?? ''] : w.type === 'burn' && w.depth ? BURN_HEAL[w.depth]
                : w.type === 'frostbite' ? FROSTBITE_HEAL : null;
    if (w.type === 'burn')
        wound.depth = w.depth && BURN_HEAL[w.depth] !== undefined ? w.depth : null;
    // DF HEALING_RATE scales the human days: soft tissue relative to 100, bone relative to 1000 (human templates).
    const factor = w.healFactor ?? 1;
    if (healRange)
        wound.heals = round(between(rng, healRange) * factor);
    if (w.vessel)
        wound.vessel = w.vessel;
    if (w.vessel && BLEED[w.vessel] && bloodVolume(p))
        wound.bleed = round(between(rng, BLEED[w.vessel]));
    if (w.vessel === 'small' && wound.bleed)
        wound.clotIn = Math.round(between(rng, CLOT_MIN));
    // Gut or stomach opened: peritonitis. Without surgery 87 % die (penetrating abdominal gunshot wounds, Civil War); after
    // laparotomy 4.5 % (Vietnam) (Manring et al. 2009, Clin Orthop 467:2168); death 1–7 days after the wound [ASSUMED].
    if (['cut', 'puncture', 'bite'].includes(w.type) && w.part.cats.some(k => k === 'GUTS' || k === 'STOMACH') && !p.peritonitis)
        p.peritonitis = { fatal: rng() < 0.87, min: 0, deathMin: Math.round((1 + rng() * 6) * DAY_MIN) };
    if (w.functionLost)
        wound.functionLost = true;
    if (w.permanent)
        wound.permanent = true;
    if (w.type === 'severed')
        wound.severed = true;
    if (w.type === 'fracture') {
        // The skull has no timetable (OPEN-58): joins stays null.
        const joint = w.part.cats.includes('JOINT') && ['wrist', 'ankle', 'hip', 'elbow', 'knee', 'shoulder'].find(j => w.part.name.includes(j));
        const kind = w.part.cats.some(k => k.startsWith('RIB_')) ? 'rib' : w.part.cats.includes('NOSE') ? 'nose'
            : joint ? joint : w.part.cats.includes('SPINE') ? 'spine' : row && BONE_ROW[row] ? `${BONE_ROW[row]}_${w.fracture || 'transverse'}` : null;
        const bone = w.part.cats.includes('LEG_LOWER') ? 'shin' : joint === 'wrist' ? 'wrist' : 'default';
        wound.fracture = { kind, joins: kind ? FRACTURE[kind][0] * factor : null, full: kind ? FRACTURE[kind][1] * factor : null, crooked: false,
            never: kind ? rng() < NONUNION[bone] : false };
        if (w.openGrade && OPEN_FRACTURE_INFECTION[w.openGrade])
            wound.openGrade = w.openGrade;
    }
    if (['cut', 'puncture', 'bite', 'burn', 'severed'].includes(w.type) || wound.openGrade || w.open)
        wound.open = true;
    p.wounds.push(wound);
    return wound;
}
function infectionChance(w) {
    if (w.openGrade)
        return OPEN_FRACTURE_INFECTION[w.openGrade];
    const late = w.cleanedAt === null || w.cleanedAt > 8 * HOUR;
    if (w.type === 'bite')
        return late ? 0.22 : 0.05;
    return late ? 0.15 : 0.03;
}
// Burn death: revised Baux score = age + % body surface burned (partial or full thickness) (Osler et al. 2010, J Trauma 68:690;
// inhalation injury +17 not modelled); mortality by inverse logit with the score at 50 % = 135, the middle of the 130–140
// reported for well-performing burn units (Wikipedia, Baux score), slope 0.058 per point [ASSUMED, recalled from Osler 2010].
// Re-rolled on the added risk when the burned area grows; death 1–14 days after the burn [ASSUMED timing].
function burnRisk(p, rng) {
    const pr = 1 / (1 + Math.exp(-0.058 * ((p.age ?? 25) + burnedTBSA(p) + (p.inhalation ? 17 : 0) - 135))), old = p.burnDeath?.p ?? 0;
    if (pr <= old || burnedTBSA(p) === 0)
        return;
    const b = p.burnDeath ??= { p: 0, fatal: false, min: 0, deathMin: null };
    if (!b.fatal && rng() < (pr - old) / (1 - old)) {
        b.fatal = true;
        b.deathMin = b.min + Math.round((1 + 13 * rng()) * DAY_MIN);
    }
    b.p = pr;
}
/** Skin of the given regions touches `material` at temp_c for `seconds` (Henriques burn dose, §6.4). Returns a report line. */
export function contactBurn(p, regions, material, tempC, seconds, rng = Math.random) {
    const ti = contactTemp(material, tempC);
    const segs = immersion(regions);
    const made = [];
    segs.forEach((on, i) => { if (on)
        for (const b of burnDose(p, i, ti, seconds))
            for (const part of frostParts(creatureOf(p), b.seg))
                made.push(addWound(p, { part, type: 'burn', depth: b.depth }, rng)); });
    burnRisk(p, rng);
    return `Skin surface at ${round(ti, 1)} °C for ${seconds} s: ${made.length ? `${made.length} ${made[0].depth ?? ''} burn wound(s) on ${[...new Set(made.map(w => w.part))].join(', ')}` : 'skin unharmed'}.`;
}
export function treat(p, id, treatment, rng = Math.random, { training = 'untrained' } = {}) {
    const w = p.wounds.find(x => x.id === id);
    if (treatment === 'transfuse') {
        p.lost = 0;
        p.deathIn = null;
        return 'Blood volume replaced.';
    }
    // Antivenom before death stops a fatal course; breathing returns, consciousness when time passes [ASSUMED].
    // Antibiotics for a bloodstream infection: case fatality 15–50 % (Wikipedia, Staphylococcus aureus), drawn uniform.
    if (treatment === 'antibiotics') {
        if (!p.sepsis)
            return 'Antibiotics given; the blood is clear of infection on record.';
        if (!p.sepsis.treated) {
            p.sepsis.treated = true;
            p.sepsis.fatal = p.sepsis.fatal && rng() < (0.15 + rng() * 0.35) / 0.8;
        }
        return 'Antibiotics given for the bloodstream infection.';
    }
    if (treatment === 'laparotomy') {
        if (!p.peritonitis)
            return 'Laparotomy: the gut is intact on record.';
        if (!p.peritonitis.repaired) {
            p.peritonitis.repaired = true;
            p.peritonitis.fatal = p.peritonitis.fatal && rng() < 0.045 / 0.87;
        }
        return 'Laparotomy: the opened gut is repaired.';
    }
    if (treatment === 'oxygen' || treatment === 'hyperbaric_oxygen') {
        if (!p.co)
            return 'Oxygen given; the blood holds zero carbon monoxide on record.';
        p.co.o2 = treatment === 'oxygen' ? 'oxygen' : 'hyperbaric';
        return `${treatment === 'oxygen' ? '100 % oxygen' : 'Hyperbaric oxygen'} given: carboxyhaemoglobin half-life ${CO_HALF[p.co.o2]} min once out of the gas.`;
    }
    if (treatment === 'antivenom') {
        if (!p.venom)
            return 'No venom recorded.';
        p.venom.fatal = false;
        if (p.paralysed) {
            p.paralysed = false;
            p.apnea = null;
        }
        return 'Antivenom given: the venom course stops.';
    }
    // The wound treated: the one named, else the only open wound; a body with none holds no wound to treat.
    if (!w) {
        const open = p.wounds.filter(x => !x.healed);
        return open.length ? `Give wound, one of: ${open.map(x => `${x.id} (${x.type}, ${x.part})`).join('; ')}. State unchanged.` : 'The body holds no wound on record to treat; the treatment changes nothing.';
    }
    // Arterial bleeding on a limb takes a tourniquet (Combat Application Tourniquet), success by training (Bordonaro et al. 2025,
    // Adv Simul 10:57, systematic review of 10 trials): no training 16.3–20.4 % in three studies → 18.35 %; with a just-in-time
    // instruction card 44.14 % (Goolsby et al. 2015, inside the review's 21.9–69.8 % for point-of-care aids); formal bleeding-
    // control training 87.7 % and 92.2 % → 90 %. A failed attempt leaves the bleeding; it can be tried again. Other bleeding: stopped.
    if (treatment === 'stop_bleeding') {
        if ((w.vessel === 'femoral' || w.vessel === 'limb_artery') && w.bleed > 0) {
            const pr = { untrained: 0.1835, instructions: 0.4414, trained: 0.90 }[training] ?? 0.1835;
            if (rng() >= pr)
                return `Wound ${id}: the bleeding goes on under the tourniquet (applied by someone ${training === 'trained' ? 'trained in bleeding control' : training === 'instructions' ? 'following instructions' : 'untrained'}); still ${w.bleed} mL/min.`;
            w.bleed = 0;
            return `Wound ${id}: tourniquet on, bleeding stopped.`;
        }
        w.bleed = 0;
        return `Wound ${id}: bleeding stopped.`;
    }
    if (treatment === 'clean') {
        w.cleanedAt ??= w.age;
        return `Wound ${id}: cleaned.`;
    }
    if (treatment === 'splint') {
        w.splinted = true;
        return `Wound ${id}: splinted.`;
    }
    if (treatment === 'load') {
        if (!w.fracture || (w.fracture.joins ?? 0) <= 0 || w.splinted)
            return `Wound ${id}: loaded; the risk stays as it was.`;
        if (rng() < 0.325) {
            w.fracture.crooked = true;
            return `Wound ${id}: bone shifted; it will heal crooked.`;
        }
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
    if (net.maxToday && net.F >= 1.2 * net.C && net.C >= 4000 * (net.N + 1) && net.N < 12)
        net.N += 1;
    net.F = 0;
    net.E = 0;
    net.maxToday = false;
}
export function advance(p, minutes, resting, rng = Math.random, { active = false, sleeping = false } = {}) {
    if (p.dead)
        return;
    if (p.clockMin != null)
        p.clockMin += minutes;
    const net = p.net;
    const c = creatureOf(p);
    const needs = !c || c.blood;
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    const n = p.needs;
    const waterDeath = n.waterDeath ??= 15 + 5 * rng();
    const foodDeath = n.foodDeath ??= 40 + 20 * rng();
    // A knockout or a choke lasts its drawn time (koLeft, minutes; none on record: it ends now, as before); a knockout then
    // leaves the person concussed, and the concussion fades (concussedMin counts from waking).
    if (minutes > 0 && (p.unconscious === 'knocked out' || p.unconscious === 'choked')) {
        p.koLeft = (p.koLeft ?? 0) - minutes;
        if (p.koLeft <= 0) {
            if (p.unconscious === 'knocked out')
                p.concussedMin = Math.max(0, -p.koLeft);
            p.unconscious = null;
            delete p.koLeft;
        }
    }
    else if (minutes > 0 && p.concussedMin != null) {
        p.concussedMin += minutes;
        if (concussionRisk(p) < 1.01)
            delete p.concussedMin;
    }
    // Feelings run their drawn time (Appraise).
    if (minutes > 0 && p.feelings?.length) {
        p.feelings = p.feelings.map(f => ({ ...f, left: f.left - minutes })).filter(f => f.left > 0);
        if (!p.feelings.length)
            delete p.feelings;
    }
    for (let t = 0; t < minutes; t++) {
        checkDeath(p);
        drugMinute(p);
        if (p.drowning && !p.env?.water) {
            resolveDrowning(p, rng);
            if (p.dead)
                return;
        }
        if (p.apnea != null && ++p.apnea >= (p.drowning ? Math.max(1, DROWN_FATAL_MIN - (p.underS ?? 0) / 60) : APNEA_DEATH())) {
            p.dead = p.drowning ? 'drowning' : 'suffocation';
            return;
        }
        altitudeMinute(p, rng);
        // Smoke breathed in: inhalation injury, +17 on the burn score (Osler et al. 2010) once any burn exists.
        if (p.env?.smoke && !p.inhalation && !has(p, 'NOBREATHE')) {
            p.inhalation = true;
            burnRisk(p, rng);
        }
        coMinute(p);
        if (p.dead)
            return;
        if (p.sepsis && ++p.sepsis.min >= p.sepsis.deathMin && p.sepsis.fatal) {
            p.dead = 'sepsis';
            return;
        }
        if (p.peritonitis && ++p.peritonitis.min >= p.peritonitis.deathMin && p.peritonitis.fatal) {
            p.dead = 'peritonitis';
            return;
        }
        if (p.burnDeath && ++p.burnDeath.min >= (p.burnDeath.deathMin ?? Infinity) && p.burnDeath.fatal) {
            p.dead = 'burns';
            return;
        }
        venomMinute(p);
        let heat = null;
        if (p.env && thermalCapable(p.species))
            heat = thermalMinute(p, { active, sleeping, restL: WATER_L_DAY.rest / DAY_MIN }, rng, () => gauss(rng));
        else if (p.env && c?.homeotherm) {
            const r = endothermMinute(p, c, { met: p.env.met ?? p.workMet ?? (sleeping ? 0.95 : active ? 3.5 : 1.3) });
            // Stages at the human distances from the set point (−2, −5, −9, −13, +3 °C) [ASSUMED].
            const stageCore = (p.thermal ??= {}).stageCore = round(r.core - r.set + 37, 2);
            heat = { core: stageCore, frozen: [], kcal: r.kcal, waterL: WATER_L_DAY.rest * kleiber(p) / DAY_MIN + r.evapL };
        }
        if (p.env?.water && !thermalCapable(p.species))
            water(p, rng);
        if (heat) {
            const st = coreStage(heat.core);
            if (st === 'hypothermia IV') {
                p.dead = 'hypothermia';
                return;
            }
            // Above the highest core temperature anyone survived, 46.5 °C (Wikipedia, Hyperthermia: 10 July 1980) → dead [ASSUMED ceiling].
            if (heat.core > k('heatDeathCore')) {
                p.dead = 'hyperthermia';
                return;
            }
            // Heat stroke: survived when core is back under 40 °C within 30 min (PMC11438465); past that, death 26.5 % if
            // exertional, 63.2 % classic (MedLink), 1–3 days later [ASSUMED timing]. The roll stands after cooling.
            if (st === 'heat stroke' || (p.heatStroke?.min ?? 0) >= 30) {
                const hs = p.heatStroke ??= { min: 0, exertional: !!(p.workMet || active) };
                if (++hs.min === 30) {
                    hs.fatal = rng() < (hs.exertional ? 0.265 : 0.632);
                    hs.deathMin = 30 + Math.round((1 + 2 * rng()) * DAY_MIN);
                }
                if (hs.fatal && hs.min >= (hs.deathMin ?? Infinity)) {
                    p.dead = 'heat stroke';
                    return;
                }
            }
            else
                p.heatStroke = null;
            if (st === 'hypothermia III')
                p.unconscious ??= 'hypothermia';
            else if (p.unconscious === 'hypothermia')
                p.unconscious = null;
            for (const seg of heat.frozen)
                for (const part of frostParts(c, seg))
                    addWound(p, { part, type: 'frostbite' }, rng);
            for (const b of heat.burned ?? [])
                for (const part of frostParts(c, b.seg))
                    addWound(p, { part, type: 'burn', depth: b.depth }, rng);
            if (heat.burned?.length)
                burnRisk(p, rng);
            if (thermalCapable(p.species))
                water(p, rng);
        }
        if (needs) {
            n.waterL += heat ? heat.waterL : WATER_L_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            let spent = heat ? heat.kcal : p.workMet ? p.workMet * 1.163 * p.mass * 60 / 4184 : KCAL_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            if ((n.surplus ?? 0) > 0) {
                const take = Math.min(n.surplus, spent);
                n.surplus -= take;
                spent -= take;
            }
            n.kcal += spent;
            if (sleeping) {
                if (n.slept === 0)
                    n.debt = Math.max(0, (n.debt ?? 0) + n.awake / 60 - CRITICAL_WAKE_H);
                n.slept += 1;
            }
            else if (!has(p, 'NO_SLEEP')) {
                if (n.slept >= SLEEP_WAKE_END_MIN) {
                    n.debt = Math.max(0, (n.debt ?? 0) - Math.max(0, n.slept / 60 - SLEEP_NEED_H));
                    n.awake = 0;
                }
                n.slept = 0;
                n.awake += 1;
            }
            // Work done against the maximum acceptable work time (§6.7). At rest or asleep it is paid back as muscle glycogen
            // returns: 5 %/h fed, 2 %/h with over a day's food missing; exhaustion ends at 90 % [ASSUMED].
            // In the water: swimming leisurely 6.0 MET (Compendium of Physical Activities, Ainsworth et al. 2011); keeping afloat by
            // treading water 7.5 MET (VO2 23.2–29.4 mL/kg/min across four techniques in 21 skilled treaders, midpoint; van Duijn
            // et al. 2021, Front Physiol 12:719788), unless held afloat by something.
            const w = p.env?.water, inWater = w && !w.afloat && thermalCapable(p.species);
            const met = p.workMet ?? (inWater ? (w.swimming ? 6.0 : 7.5) : active ? 3.5 : null);
            // Time on task (§6.3 work): minutes of work since the last break of 15 min or more, and since the last sleep. A task is
            // any activity at 1.5 MET or more (the Compendium's line between sedentary and light activity: desk work counts,
            // sitting quietly does not), unless the character is listed at rest or the activity is a break by its kind (eating,
            // relaxing, socializing, watching TV, intimacy, from the activity's words) [ASSUMED].
            const breakKind = /^(eating|relaxing|socializing|watching TV|intimate relations)$/.test(drmRow(p.doing)?.label ?? '');
            const taskMet = resting || breakKind ? null : met ?? (p.env?.met != null && p.env.met >= 1.5 ? p.env.met : null);
            if (taskMet && !sleeping) {
                n.onTask = (n.onTask ?? 0) + 1;
                n.duty = (n.duty ?? 0) + 1;
                n.restRun = 0;
            }
            else {
                n.restRun = (n.restRun ?? 0) + 1;
                if (n.restRun >= k('breakMin'))
                    n.onTask = 0;
                if (sleeping && n.slept >= SLEEP_WAKE_END_MIN)
                    n.duty = 0;
            }
            if (met && !sleeping && !has(p, 'NOEXERT')) {
                n.work = (n.work ?? 0) + 1 / 60 / mawtHours(relativeLoad(met, p, () => gauss(rng)));
                if (n.work >= 1)
                    p.exhausted = true;
            }
            else if ((n.work ?? 0) > 0) {
                n.work = Math.max(0, n.work - (n.kcal < KCAL_DAY.rest * kleiber(p) ? 0.05 : 0.02) / 60);
                if (n.work <= 0.9)
                    p.exhausted = false;
            }
            // A drink reaches the blood over the next hour (absorption, below), then leaves at the elimination rate.
            if ((n.gut ?? 0) > 1e-6) {
                const take = n.gut * (1 - Math.exp(-((n.sinceMeal ?? Infinity) < k('fedWindowMin') ? k('absorbFedPerMin') : k('absorbFastPerMin'))));
                n.gut -= take;
                n.alcohol = (n.alcohol ?? 0) + take;
            }
            else if (n.gut)
                delete n.gut;
            n.sinceMeal = (n.sinceMeal ?? Infinity) + 1;
            // Eliminated faster just after a meal: 0.015–0.020 %/h fed against 0.015 fasted (Jones 2010), the middle of that range.
            if (n.alcohol)
                n.alcohol = Math.max(0, n.alcohol - ((n.sinceMeal ?? Infinity) < k('fedWindowMin') ? ELIM_FED_PER_MIN : ELIM_PER_MIN));
            if (has(p, 'NO_DRINK'))
                n.waterL = 0;
            if (has(p, 'NO_EAT'))
                n.kcal = 0;
            if (n.waterL / p.mass * 100 >= waterDeath) {
                p.dead = 'dehydration';
                return;
            }
            if (n.kcal >= foodDeath * KCAL_DAY.rest * kleiber(p)) {
                p.dead = 'starvation';
                return;
            }
            settleMass(p);
            if (p.stores && n.kcal > 0) {
                const st0 = p.stores;
                st0.lethalBmi ??= lethalBmi(p, rng);
                const ht = (p.heightCm ?? (p.sex === 'female' ? 162.6 : 175.5)) / 100;
                if (p.mass / ht ** 2 <= st0.lethalBmi) {
                    p.dead = 'starvation';
                    return;
                }
            }
        }
        // Limb arteries: the flow Pulse computed for this minute (pulse.ts), while its track lasts; then each such wound keeps
        // its share of Pulse's last flow under the engine's rules.
        let bleeding = p.wounds.reduce((s, w) => s + w.bleed, 0);
        // A stopped bleed (pressure, tourniquet) ends the Pulse track at once.
        if ((p.pulse || p.pulseLast) && !p.wounds.some(pulseWound)) {
            p.pulse = null;
            p.pulseLast = null;
        }
        if (p.pulse && p.pulse.at < p.pulse.track.length) {
            const m = p.pulse.track[p.pulse.at++], ws = p.wounds.filter(pulseWound), own = ws.reduce((s, w) => s + w.bleed, 0);
            bleeding += m.rate - own;
            const { rate: _r, dies, ...vitals } = m;
            p.pulseLast = vitals;
            for (const w of ws)
                w.bleed = round(own > 0 ? m.rate * w.bleed / own : m.rate / ws.length, 1);
            if (p.pulse.table && p.pulseTab)
                p.pulseTab.minute++;
            if (p.pulse.at >= p.pulse.track.length)
                p.pulse = null;
            // Pulse's irreversible state at the end of a precomputed run is death from blood loss.
            if (dies) {
                p.lost += bleeding;
                p.dead = 'blood loss';
                return;
            }
        }
        p.lost += bleeding;
        if (p.lost >= LETHAL_LOSS_ML_KG * p.mass) {
            p.lost = LETHAL_LOSS_ML_KG * p.mass;
            p.dead = 'blood loss';
            return;
        }
        // While a Pulse run carries the bleed, Pulse decides when it kills; the class IV timer is for the rules' own bleeds.
        if (bloodClass(p) === 4 && !p.pulse && !(p.pulseTab && p.wounds.some(pulseWound))) {
            const mode = bleeding > 0 ? 'bleeding' : 'stopped';
            if (p.deathIn === null || p.deathMode !== mode)
                p.deathIn = mode === 'bleeding' ? Math.round(between(rng, [30, 60])) : 120;
            p.deathMode = mode;
            if (--p.deathIn <= 0) {
                p.dead = 'blood loss';
                return;
            }
        }
        else
            p.deathIn = null;
        if (bleeding === 0 && p.lost > 0) {
            const refill = Math.min(p.lost, bloodVolume(p) * 0.4 / (1.5 * DAY_MIN));
            p.lost -= refill;
            p.red += refill;
        }
        p.red = Math.max(0, p.red - 500 / (35 * DAY_MIN));
        if (resting)
            net.R = Math.min(net.C, net.R + 0.05 * net.C / 60);
        for (const w of p.wounds) {
            w.age += 1 / DAY_MIN;
            if (w.fracture && !w.fracture.never && w.fracture.joins !== null) {
                w.fracture.joins -= 1 / DAY_MIN;
                w.fracture.full = (w.fracture.full ?? 0) - 1 / DAY_MIN;
            }
            if (w.heals !== null && !w.healed && w.age >= w.heals) {
                w.healed = true;
                w.bleed = 0;
            }
            if (w.clotIn != null && w.bleed && --w.clotIn <= 0) {
                w.bleed = 0;
                w.clotIn = null;
            }
            const onset = INFECTION_ONSET[w.type === 'bite' ? 'bite' : 'other'];
            if (w.open && w.infection === null && w.age >= onset) {
                w.infection = rng() < infectionChance(w);
                // An infected wound closes 10.5 days later (surgical-site infection adds 10–11 hospital days; StatPearls,
                // Berríos-Torres 2017 — hospital stay as the proxy for healing).
                if (w.infection && w.heals !== null) {
                    w.heals = Math.max(w.heals, w.age) + INFECTION_DELAY_DAYS;
                    w.healed = false;
                }
                // Bloodstream spread: 8.5 % of adults under 65 hospitalized with skin and soft-tissue infection (Taniguchi et al.
                // 2022, Open Forum Infect Dis 9:ofac317) [as the rate for infected wounds]. Untreated S. aureus bacteraemia
                // killed about 80 % (Wikipedia, Staphylococcus aureus); death within 30 days, uniform [ASSUMED].
                if (w.infection && !p.sepsis && rng() < ((p.age ?? 25) >= 65 ? 0.253 : 0.085))
                    p.sepsis = { fatal: rng() < 0.8, min: 0, deathMin: Math.round((1 + rng() * 29) * DAY_MIN) };
            }
        }
        if (++p.minute >= DAY_MIN) {
            p.minute -= DAY_MIN;
            endDay(net);
        }
    }
}
export function cast(p, complexity) {
    const net = p.net;
    const { stage: st, max } = stage(net);
    let cost = COST[complexity] ?? COST[9];
    if (st === 5 && complexity === 9)
        cost /= 2;
    cost = Math.round(cost / net.P);
    if (net.R < cost)
        return `Too little PE to cast: needs ${cost}, has ${Math.floor(net.R)}.`;
    net.R -= cost;
    if (complexity > max)
        return `Cast fails: complexity ${complexity} exceeds stage ${st} max ${max}. ${cost} PE lost.`;
    net.F += cost;
    net.E += cost;
    if (complexity === max)
        net.maxToday = true;
    return `Cast succeeds: ${cost} PE spent, ${Math.floor(net.R)} PE left.`;
}
// Rows: < 12 m (0 % below 6 m, straight line to 44 % at 12 m), 12, 15.6, exactly 19.2, above 19.2 (all).
// Age: odds of death × 1.05 per year of age (Lapostolle et al. 2005, Crit Care Med 33:1239, multivariate, 287 falls over 3 m),
// centred on the sample's mean age 37.2 (41.6 in the 34 % who died, 34.9 in survivors) [centring ASSUMED].
export function fallDeathChance(height, { soft = false, headFirst = false, age } = {}) {
    const base = fallBase(height, soft, headFirst);
    if (age == null || !Number.isFinite(age) || base <= 0 || base >= 1)
        return base;
    const lo = Math.log(base / (1 - base)) + Math.log(1.05) * (age - 37.2);
    return 1 / (1 + Math.exp(-lo));
}
function fallBase(height, soft, headFirst) {
    const chances = [0, ...FALL_ROWS.map(r => r[1]), 1];
    let row = FALL_ROWS.filter(([h]) => height >= h).length;
    if (height > FALL_ROWS.at(-1)[0])
        row = chances.length - 1;
    // Rule 576: head first, one row deadlier; soft ground, one row less deadly; both, the row itself.
    const shifted = Math.min(Math.max(row + (headFirst ? 1 : 0) - (soft ? 1 : 0), 0), chances.length - 1);
    if (row > 0 && shifted > 0)
        return chances[shifted];
    // Below the first row the deaths lie on the line from 0 % at 6 m, where a row is one storey, 3.6 m (the rows' spacing)
    // [ASSUMED]: head first counts one storey higher, up to the first row (a head-first fall from 1.5 m is not one from 12 m);
    // soft ground one storey lower.
    const storey = FALL_ROWS[1][0] - FALL_ROWS[0][0];
    const h = Math.min(height + (headFirst ? storey : 0) - (soft ? storey : 0), FALL_ROWS[0][0]);
    if (h < 6)
        return 0;
    return FALL_ROWS[0][1] * (h - 6) / (FALL_ROWS[0][0] - 6);
}
export function fall(p, height, opts = {}, rng = Math.random) {
    const chance = fallDeathChance(height, opts);
    console.debug?.('[Rules engine]', `fall ${height} m: death chance ${Math.round(chance * 1000) / 10} %`);
    if (chance > 0 && rng() < chance) {
        p.dead = 'fall';
        return `Fall ${height} m: dies.`;
    }
    if (opts.headFirst)
        return `Fall ${height} m: survives; its injuries come from BodyWound.`;
    // Feet first: the force through each leg, against the loads that break the heel bone and tibia (materials.ts landing).
    const l = landing(p.mass, height, opts.soft ? 'grass' : opts.ground ?? 'packed earth', !!opts.stiff);
    if (rng() < l.chance) {
        const side = rng() < 0.5 ? 'left' : 'right', c = creatureOf(p);
        const part = c?.parts.find(x => x.name === `${side} foot`) ?? c?.parts.find(x => x.name === `${side} lower leg`);
        if (part)
            addWound(p, { part, type: 'fracture', fracture: 'transverse' }, rng);
        return `Fall ${height} m: lands on the feet, ${l.kNPerLeg} kN through each leg; the ${side} heel bone breaks (fracture recorded${part ? ` on the ${part.name}` : ''}).`;
    }
    return `Fall ${height} m: lands on the feet, ${l.kNPerLeg} kN through each leg; the bones hold, the legs and feet jarred.`;
}
/** part → whether it works: no severing, unjoined fracture or lost function on it or above it on its CON chain. */
export function worksFn(p, c = creatureOf(p)) {
    if (!c)
        return () => true;
    const down = new Set();
    for (const w of p.wounds) {
        const fr = w.fracture;
        if (w.severed || (fr && (fr.never || fr.joins === null || fr.joins > 0)) || (w.functionLost && (!w.healed || w.permanent)))
            down.add(w.pid);
    }
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const chain = (part) => { for (let q = part; q; q = q.parent ? byId[q.parent] : undefined)
        if (down.has(q.id))
            return false; return true; };
    const nerves = c.parts.filter(x => x.flags.includes('NERVOUS') && !chain(x));
    const neck = nerves.some(n => n.parent && byId[n.parent]?.cats.includes('NECK'));
    return part => chain(part) && !(nerves.length && part.flags.includes('STANCE')) && !(neck && part.flags.includes('GRASP'));
}
/** Each ability as the share of the creature's parts with its flag that work; absent when the creature has none. */
export function abilities(p) {
    const c = creatureOf(p);
    if (!c)
        return {};
    const works = worksFn(p, c);
    const out = {};
    for (const [name, flag] of Object.entries(FUNCTIONS)) {
        const parts = c.parts.filter(x => x.flags.includes(flag));
        if (parts.length)
            out[name] = round(parts.filter(works).length / parts.length, 2);
    }
    return out;
}
/** Dies when a THOUGHT part stops working; stops breathing (unconscious) when every BREATHE part stops working. */
function checkDeath(p) {
    const c = creatureOf(p);
    if (!c || p.dead)
        return;
    const works = worksFn(p, c);
    const brains = c.parts.filter(x => x.flags.includes('THOUGHT'));
    if (brains.length && brains.every(b => !works(b))) {
        p.dead = 'brain destroyed';
        return;
    }
    const lungs = c.parts.filter(x => x.flags.includes('BREATHE'));
    const apneic = lungs.length > 0 && !c.flags.includes('NOBREATHE') && lungs.every(l => !works(l));
    if (apneic && p.apnea == null) {
        p.apnea = 0;
        p.unconscious = 'not breathing';
    }
    if (!apneic && p.apnea != null && !p.drowning && !p.paralysed) {
        p.apnea = null;
        if (p.unconscious === 'not breathing')
            p.unconscious = null;
    }
}
/**
 * °C the core is below 36.7 (humans: JOS-3 core; animals: the same distance below their own set point). Coleshaw et al. 1983
 * (J Appl Physiol 55:27): from 36.7 °C new-information registration and calculation speed fall; at 34–35 °C 70 % of new
 * information is lost and speed is −50 %; recall and accuracy hold. Linear to 34.5 °C, held there below [ASSUMED].
 */
function coolCore(p) {
    const t = p.env ? p.thermal?.stageCore ?? p.thermal?.core : null;
    return t == null ? 0 : Math.min(2.2, Math.max(0, 36.7 - t));
}
const thinkSpeed = (p) => 1 - 0.5 * coolCore(p) / 2.2;
const keepsNew = (p) => 1 - 0.7 * coolCore(p) / 2.2;
// Frostbite most often strikes cheeks, ears, nose, fingers and toes (Wikipedia "Frostbite", citing McIntosh 2014): when the
// head, a hand or a foot segment's skin freezes, those DF parts take it; other segments freeze as their DF part [ASSUMED].
const SEG_CATS = { head: ['NOSE', 'EAR', 'CHEEK'], neck: ['NECK'], chest: ['BODY_UPPER'], back: ['BODY_UPPER'], pelvis: ['BODY_LOWER'],
    shoulder: ['ARM_UPPER'], arm: ['ARM_LOWER'], hand: ['FINGER'], thigh: ['LEG_UPPER'], leg: ['LEG_LOWER'], foot: ['TOE'] };
function frostParts(c, seg) {
    if (!c)
        return [];
    const [side, name] = seg.includes('_') ? seg.split('_') : [null, seg];
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const sideOf = (part) => { for (let q = part; q; q = q.parent ? byId[q.parent] : undefined)
        for (const f of ['LEFT', 'RIGHT'])
            if (q.flags.includes(f))
                return f; return null; };
    return c.parts.filter(x => SEG_CATS[name].some(k => x.cats.includes(k)) && (!side || sideOf(x) === side.toUpperCase()));
}
// Swim failure in cold water (≤ 14 °C): a time drawn per immersion from N(52, 18) min swimming in a bathing suit, N(39, 19) clothed
// (at least 5 min); 10 unhabituated men in 12 °C water stopped from exhaustion before hypothermia (Bowes et al. 2016,
// Eur J Appl Physiol 116:759); swim failure in 10–14 °C water averaged 47 min (Ducharme & Lounsbury 2007, Appl Physiol
// Nutr Metab 32:799). Above 14 °C only the work-time exhaustion of §6.7 applies [ASSUMED scope of the data].
const SWIM_COLD_C = 14;
// Head under water: breath held for N(24.3, 11.4) s, then water is breathed in (maximal breath-hold on immersion in 11 °C
// water, 32 subjects, 24.0 ± 6.7 and 24.7 ± 14.6 s; Barwood et al. 2006, Aviat Space Environ Med 77:1136); from then on the
// not-breathing rule: unconscious, dead after 5 min.
// Breath held on going under, by water temperature (Hayward et al. 1984, as given in Survival in Cold Waters, a report prepared
// for Transport Canada): 19, 24, 28 and 38 s in water of 5, 10, 15 and 25 °C, linear between, held at 5 and 25 °C [ASSUMED]
// (Barwood et al. 2006 found 24.3 s at 11 °C; Cheung et al. 2001 39.8 s at 25 °C); spread 11.4 ÷ 24.3 = 47 % of the mean
// (Barwood's SD) [ASSUMED for every temperature]. Before, the 11 °C value held for warm water too.
const HOLD_BY_C = [[5, 19], [10, 24], [15, 28], [25, 38]];
export function breathHoldMeanS(waterC) {
    const t = Math.max(5, Math.min(25, waterC)), i = Math.min(HOLD_BY_C.length - 2, HOLD_BY_C.findIndex(([c], j) => t >= c && t <= HOLD_BY_C[j + 1][0]));
    const [c0, s0] = HOLD_BY_C[i], [c1, s1] = HOLD_BY_C[i + 1];
    return s0 + (s1 - s0) * (t - c0) / (c1 - c0);
}
def({ id: 'breathHoldCv', value: 11.4 / 24.3, unit: 'SD ÷ mean of the breath held on going under', status: 'assumed', src: "Barwood et al. 2006's spread at 11 °C (24.3 ± 11.4 s) taken for every temperature", range: [0.28, 0.6], file: 'body-engine.ts' });
function water(p, rng) {
    const w = p.env?.water;
    if (!w || has(p, 'NOBREATHE'))
        return;
    // Other creatures: DF SWIMS_INNATE, AQUATIC or AMPHIBIOUS keep the head up; the rest go under unless afloat [RAW flags].
    const c = creatureOf(p), human = thermalCapable(p.species);
    if (!human && !c?.flags?.some(f => ['SWIMS_INNATE', 'SWIMS_LEARNED', 'AQUATIC', 'AMPHIBIOUS'].includes(f)))
        p.swimFailed = true;
    // Can this person swim at all: drawn once by BodyEnvironment from their sex and country (swimShare, below) unless the story
    // says (`swimmer`); with neither known, 46 % (the US five-skills share). A non-swimmer in deep water goes under unless afloat.
    if (human) {
        p.canSwim ??= rng() < 0.46;
        if (!p.canSwim && w.deep !== false)
            p.swimFailed = true;
    }
    if (human && w.swimming && w.tc <= SWIM_COLD_C) {
        w.swimMin = (w.swimMin ?? 0) + 1;
        const clo = p.env.clo, clothed = Array.isArray(clo) ? clo.some(c => c > 0.1) : clo > 0.1;
        w.swimLimit ??= Math.max(5, clothed ? 39 + 19 * gauss(rng) : 52 + 18 * gauss(rng));
        if (!p.swimFailed && w.swimMin >= w.swimLimit)
            p.swimFailed = true;
    }
    // Exhausted (§6.7 maximum acceptable work time used up) and not held afloat: the head goes under [ASSUMED].
    if (human && p.exhausted && !w.afloat)
        p.swimFailed = true;
    const under = w.segs[0] || (p.swimFailed && !w.afloat) || (p.unconscious && !w.afloat);
    if (under && p.apnea == null) {
        {
            const m = breathHoldMeanS(w.tc);
            p.breathHold ??= Math.max(5, m * (1 + k('breathHoldCv') * gauss(rng)));
        }
        p.underS = (p.underS ?? 0) + 60;
        if (p.underS >= p.breathHold) {
            p.apnea = 0;
            p.drowning = true;
            p.unconscious = 'drowning';
        }
    }
    else if (!under) {
        if (p.drowning)
            resolveDrowning(p, rng);
        p.underS = 0;
        p.breathHold = null;
    }
}
// A drowning person brought out of the water (or the head back above it): whether they come through with a sound mind, by the
// time under water (ILCOR 2020 drowning CoSTR, Bierens et al., pooled cohorts): submerged under 5–6 min, 943 of 1,075 (87.7 %)
// had a good neurological outcome; longer, 139 of 1,238 (11.2 %); under 10 min 787 of 1,019 (77.2 %), longer 36 of 962
// (3.7 %); past 25 min invariably fatal (Quan et al. 2016). By band: to 5.5 min 87.7 %, 5.5–10 min 18.7 %, 10–25 min 3.7 %,
// past 25 none. The 5.5–10 band is derived: the longer-than-5.5 group read as half 5.5–10 and half past 10, x = 2 × 11.2 −
// 3.7, a judgement registered as drownMidGood; a quarter to three quarters in 5.5–10 gives 33.7 % to 13.7 %, its range. The two splits come from
// different pools of cohorts (1,075 + 1,238 = 2,313 people against 1,019 + 962 = 1,981, and 1,019 under 10 min against 1,075
// under 5.5 min), so one cannot be subtracted from the other. No difference with water
// temperature or age was found (same reviews). The rest are taken as dead [ASSUMED: the few who live with severe brain injury
// counted with them].
// Other creatures take the human bands [ASSUMED]; a check: of 25 dogs and 3 cats brought to hospital after freshwater submersion,
// 64 % lived to discharge, all the cats died (Heffner et al. 2008, J Am Vet Med Assoc 232:244), between the human 88 % and 19 %. Time under water = the breath held before the first gasp + the minutes not breathing.
export const DROWN_FATAL_MIN = 25;
def({ id: 'drownMidGood', value: 2 * 0.112 - 0.037, unit: 'share with a good outcome after 5.5–10 min under water', status: 'assumed', src: 'ILCOR 2020 drowning CoSTR pooled cohorts: 11.2 % past 5–6 min, 3.7 % past 10 min; the past-5.5 group read as half 5.5–10 and half past 10; range: a quarter to three quarters in 5.5–10', range: [0.137, 0.337], file: 'body-engine.ts' });
export function drownedGoodOutcome(minutesUnder) {
    return minutesUnder <= 5.5 ? 0.877 : minutesUnder <= 10 ? k('drownMidGood') : minutesUnder <= DROWN_FATAL_MIN ? 0.037 : 0;
}
function resolveDrowning(p, rng) {
    const under = (p.underS ?? 0) / 60 + (p.apnea ?? 0);
    p.underS = 0;
    p.breathHold = null;
    if (rng() < drownedGoodOutcome(under)) {
        p.apnea = null;
        p.drowning = false;
        p.unconscious = 'near-drowning, breathing again';
    }
    else
        p.dead = 'drowning';
}
/** Venom course (§5.2): neurotoxic → breathing stops at collapse (not-breathing rule); haemotoxic → shock, then death. */
function venomMinute(p) {
    const v = p.venom;
    if (!v)
        return;
    v.min += 1;
    // DF effects with an engine mechanism (DF wiki, Syndrome): UNCONSCIOUSNESS "renders the creature unconscious"; BLEEDING
    // "causes the targeted body part to start bleeding": small-vessel rate 1–10 mL/min scaled by SEV ÷ 100 [ASSUMED].
    const act = activeSymptoms(v);
    if (act.some(e => e.kind === 'unconsciousness'))
        p.unconscious ??= 'venom';
    else if (p.unconscious === 'venom')
        p.unconscious = null;
    const bl = act.find(e => e.kind === 'bleeding');
    if (bl && bloodVolume(p))
        p.lost += 5.5 * (bl.sev ?? 0) / 100;
    if (!v.fatal)
        return;
    if (v.kind === 'neuro' && v.min >= (v.collapse ?? Infinity) && p.apnea == null && !has(p, 'NOBREATHE')) {
        p.apnea = 0;
        p.paralysed = true;
        p.unconscious = 'paralysed by venom';
    }
    if (v.kind === 'hemo') {
        if (v.min >= (v.shock ?? Infinity))
            p.unconscious ??= 'venom shock';
        if (v.min >= (v.death ?? Infinity))
            p.dead = 'envenomation';
    }
}
/** Altitude (§6.6): AMS and oedema rolled after the first night (12 h) at a new altitude; sudden arrival above 18 000 ft
 * (aircraft, magic) → unconscious once the time of useful consciousness runs out. */
// Carbon monoxide (§6.8). Uptake: Coburn-Forster-Kane equation, d[COHb]/dt = Vco/Vb + PICO/(B Vb) − [COHb] PcO2/(M B Vb [O2Hb]),
// B = 1/DL + PL/VA; DL 30 mL/min/mmHg (Coburn et al. 1965, J Clin Invest 44:1899, measured 20.5–32), PL 713 mmHg, M 218 (the
// later Haldane constant; Coburn took 250), PcO2 100 mmHg, Vco 0.007 mL/min (their normal 0.42 mL/h), O2 capacity 0.207 mL/mL, blood
// volume as §5, VA 6000 mL/min × METs × (mass ÷ 70 kg)^0.75 (ventilation follows metabolic rate, Kleiber) [ASSUMED scaling]; PICO = ppm × (PB − 47). With no CO in the air, COHb falls with the
// half-life 320 min on room air, 80 on 100 % oxygen, 23 hyperbaric (Wikipedia, Carbon monoxide poisoning). Unconscious at
// 30 % ("30 % COHb is considered severe"; fits 800 ppm "insensible within 2 hours": 97 min), dead at 40 % (fits 3200 ppm
// "death within 30 minutes": 29 min) [fit].
const CO_HALF = { air: 320, oxygen: 80, hyperbaric: 23 };
function coMinute(p) {
    const ppm = p.env?.co ?? 0, c = p.co;
    if (!ppm && !c)
        return;
    if (has(p, 'NOBREATHE') || !bloodVolume(p))
        return;
    const k = p.co ??= { hb: 0, o2: 'air' }, cap = 0.207, vb = bloodVolume(p);
    if (ppm > 0) {
        const pb = p.altitude ? pressureTorr(p.altitude.m) : 760, va = 6000 * kleiber(p) * Math.max(1, p.env?.met ?? p.workMet ?? 1);
        const B = 1 / 30 + 713 / va, co = k.hb * cap;
        k.hb = Math.min(0.99, (co + 0.007 / vb + ppm * 1e-6 * (pb - 47) / (B * vb) - co * 100 / (218 * B * vb * (cap - co))) / cap);
    }
    else
        k.hb *= 0.5 ** (1 / CO_HALF[k.o2]);
    if (k.hb >= 0.40) {
        p.dead = 'carbon monoxide';
        return;
    }
    if (k.hb >= 0.30)
        p.unconscious ??= 'carbon monoxide';
    else if (p.unconscious === 'carbon monoxide')
        p.unconscious = null;
    if (!ppm && k.hb < 0.005)
        p.co = null;
}
function altitudeMinute(p, rng) {
    const a = p.altitude;
    if (!a || has(p, 'NOBREATHE'))
        return;
    a.min = (a.min ?? 0) + 1;
    // Acclimatization (§6.6): risk follows the gain over the acclimatized altitude, which starts at 2500 m and rises 500 m
    // per day spent above it, up to the current altitude: the Wilderness Medical Society's safe pace, sleeping elevation up by no
    // more than 500 m a day above 3000 m (Luks et al. 2019, Wilderness Environ Med 30:S3; StatPearls NBK560677 gives 1500 ft)
    // [ASSUMED: the safe pace taken as the pace of acclimatization].
    p.acclim ??= 2500;
    a.acc0 ??= p.acclim;
    if (a.m > p.acclim && a.min % DAY_MIN === 0)
        p.acclim = Math.min(a.m, p.acclim + 500);
    if (a.min === 12 * 60 && a.ams == null) {
        const eff = a.m - a.acc0 + 2500;
        a.ams = rng() < amsChance(eff);
        if (a.ams)
            a.amsEnd = a.min + Math.round((24 + rng() * 24) * 60);
        a.hace = rng() < haceChance(eff);
        if (rng() < hapeChance(eff))
            a.hapeAt = Math.round((1 + rng() * 4) * DAY_MIN);
        if (a.hace)
            a.haceDeath = a.min + Math.round((HACE_DEATH_H[0] + rng() * (HACE_DEATH_H[1] - HACE_DEATH_H[0])) * 60);
        a.oedema = a.hace;
    }
    if (a.ams && a.min >= (a.amsEnd ?? Infinity))
        a.ams = false;
    // HAPE: half die without descent (WMS), "fatal within a few hours" (Medscape 300716): 2–6 h after onset [ASSUMED range].
    if (a.hapeAt && a.min >= a.hapeAt) {
        a.hape = true;
        a.oedema = true;
        a.hapeAt = null;
        if (rng() < 0.5)
            a.hapeDeath = a.min + Math.round((2 + 4 * rng()) * 60);
    }
    if (a.hapeDeath && a.min >= a.hapeDeath)
        p.dead = 'high-altitude pulmonary oedema';
    if (a.hace && a.min >= (a.haceDeath ?? Infinity) - 60)
        p.unconscious ??= 'cerebral oedema';
    if (a.hace && a.min >= (a.haceDeath ?? Infinity))
        p.dead = 'high-altitude cerebral oedema';
    if (a.sudden && a.tuc === undefined) {
        const r = tucRange(a.m, a.decompression);
        a.tuc = r ? r[0] + rng() * (r[1] - r[0]) : null;
    }
    if (a.tuc != null && a.min * 60 >= a.tuc)
        p.unconscious ??= 'hypoxia';
}
/** Sets the altitude (m) and how the person got there; m = 0 clears. */
export function setAltitude(p, m, sudden = false, decompression = false) {
    if (p.unconscious === 'hypoxia')
        p.unconscious = null;
    const old = p.altitude;
    // Descent below where oedema began stops its course [ASSUMED]; the conditions remain until time passes.
    const keep = old && m < old.m && old.oedema ? { hace: false, hape: old.hape, oedema: old.hape ?? null, ams: old.ams } : {};
    p.altitude = m > 0 ? { m, sudden: sudden || decompression, decompression, min: 0, ams: null, oedema: null, ...keep } : null;
    if (p.unconscious === 'cerebral oedema')
        p.unconscious = null;
}
/**
 * Sets (or clears, env = null) the air a person is in: { air_c, radiant_c, humidity_pct, wind_kmh (weather, 10 m) or air_speed_ms
 * (at the body, indoors), clothing: { ensemble, garments }, face_covered, met, posture }. Throws on unknown clothing.
 */
export function setEnvironment(p, env) {
    if (!env) {
        p.env = null;
        return;
    }
    const cl = env.clothing ?? {};
    const covers = (region) => (cl.garments ?? []).some(g => (g.covers ?? []).some(x => String(x).toLowerCase().includes(region)));
    p.env = { tdb: env.air_c, tr: env.radiant_c ?? env.air_c, rh: env.humidity_pct ?? 50,
        v: env.air_speed_ms ?? Math.max(0.1, (env.wind_kmh ?? 0) / 3.6 * BODY_WIND), wind10: env.air_speed_ms != null ? 0 : env.wind_kmh ?? 0,
        clo: clothingClo(cl), met: env.met ?? null, posture: env.posture ?? null, co: env.co_ppm ?? 0, smoke: !!env.smoke,
        faceBare: !env.face_covered, handsBare: !(/gloves/i.test(cl.ensemble ?? '') || covers('hand')),
        water: env.water_c != null && env.immersed?.length ? { tc: env.water_c, speed: env.water_speed_ms ?? 0, segs: immersion(env.immersed), suit: !!env.immersion_suit,
            swimming: !!env.swimming, afloat: !!env.afloat, deep: env.deep_water !== false } : null };
    if (env.swimmer != null)
        p.canSwim = !!env.swimmer;
    // A drowning person taken out stays not breathing until the next minute decides how they come through (resolveDrowning).
    if (!p.env.water) {
        p.swimFailed = false;
        if (!p.drowning) {
            p.underS = 0;
            p.breathHold = null;
        }
    }
    if (p.thermal) {
        p.thermal.bareDose = 0;
    }
    // Low oxygen (fire, sealed room, gas displacing air): the altitude with the same inspired oxygen pressure, entered suddenly
    // (§6.6 rules apply; hypoxic air and altitude are equivalent by inspired PO2) [ASSUMED equivalence].
    if (env.o2_pct != null && env.o2_pct < 20.9) {
        p.baseAlt ??= p.altitude?.m ?? 0;
        const m = equivalentAltitude(env.o2_pct, p.baseAlt);
        if (p.altitude?.m !== m)
            setAltitude(p, m, true);
    }
    else if (p.baseAlt != null) {
        setAltitude(p, p.baseAlt);
        p.baseAlt = null;
    }
    if (p.env.met == null)
        delete p.env.met;
    if (p.env.posture == null)
        delete p.env.posture;
}
export function status(who, p) {
    if (p.dead)
        return `${who}: dead (${p.dead}).`;
    const out = [];
    if (p.apnea != null && p.drowning) {
        const m = (p.underS ?? 0) / 60 + p.apnea;
        out.push(`${who}: drowning, under water ${Math.round(m)} min, not breathing; brought out now, ${Math.round(drownedGoodOutcome(m + 1) * 100)} % come through with a sound mind`);
    }
    else if (p.apnea != null)
        out.push(`${who}: breath stopped, unconscious; dies in ${APNEA_DEATH() - p.apnea} min`);
    else if (p.unconscious)
        out.push(`${who}: unconscious (${p.unconscious})`);
    if (!p.unconscious && p.concussedMin != null) {
        const m = p.concussedMin, ago = m < 1 ? 'just now' : m < 90 ? `${Math.round(m)} min ago` : `${Math.round(m / 60)} h ago`;
        out.push(`${who}: concussed (knocked out, came to ${ago}): dazed, slow, may not recall the blow`);
    }
    if (p.feelings?.length)
        out.push(`${who} still feels ${p.feelings.map(f => f.about ? `${f.type} (${f.about})` : f.type).join(', ')}`);
    // The typical mood of the activity, while the character is awake and at it (asleep or unconscious: none).
    {
        const d = p.doing && !p.unconscious && !(p.needs?.slept) ? drmRow(p.doing) : null;
        if (d)
            out.push(drmLine(who, d));
    }
    const f = lossFraction(p);
    const c = creatureOf(p);
    const v = p.pulseLast;
    const signs = v ? `pulse ${Math.round(v.hr)}/min, blood pressure ${Math.round(v.sys)}/${Math.round(v.dia)} mmHg, breathing ${Math.round(v.rr)}/min, oxygen ${Math.round(v.spo2 * 100)} %` : null;
    out.push(bloodVolume(p) ? `${who} (${c?.name ?? p.species}): blood lost ${round(p.lost / 1000, 2)} L${p.lost > 0 ? ` (${round(f * 100)}%, class ${['I', 'II', 'III', 'IV'][bloodClass(p) - 1]}: ${signs ?? SHOCK_SIGNS[bloodClass(p) - 1]})` : ''}` : `${who} (${c?.name ?? p.species}): bloodless`);
    if (p.deathIn !== null)
        out.push(`dies in ${p.deathIn} min unless ${p.wounds.some(w => w.bleed) ? 'bleeding stops and blood is replaced' : 'blood is replaced'}`);
    if (p.red > 0 || p.lost > 0)
        out.push(`aerobic capacity ${Math.round(vo2avail(p) / vo2max(p) * 100)} % (altitude and missing red cells)`);
    for (const w of p.wounds) {
        if (w.healed && !w.infection)
            continue;
        const bits = [`wound ${w.id} ${w.part} ${w.type}${w.depth ? ` (${w.depth.replace('_', ' ')})` : ''}`];
        if (w.bleed)
            bits.push(`bleeding ${w.bleed} mL/min`);
        if (w.heals !== null && !w.healed)
            bits.push(`closes in ${round(w.heals - w.age)} days`);
        if (w.type === 'burn' && w.depth === 'full')
            bits.push('closes only with a skin graft');
        if (w.fracture) {
            const fr = w.fracture;
            if (fr.joins !== null)
                bits.push(fr.never ? 'stays broken for good' : fr.joins > 0 ? `joins in ${round(fr.joins)} days` : (fr.full ?? 0) > 0 ? `light use; full in ${round(fr.full ?? 0)} days` : 'healed');
            if (fr.crooked)
                bits.push(/arm|hand|finger/.test(w.part) ? `crooked: grip ${CROOKED_GRIP * 100}%` : 'crooked');
        }
        if (w.functionLost && w.permanent)
            bits.push('function lost for good (tissue that stays as it is)');
        else if (w.functionLost && !w.healed)
            bits.push('function lost until it closes');
        if (w.infection)
            bits.push('infected');
        out.push(bits.join(', '));
    }
    if (c) {
        const works = worksFn(p, c);
        const down = c.parts.filter(x => !works(x) && (x.flags.some(f => Object.values(FUNCTIONS).includes(f)) || x.flags.includes('LIMB')));
        if (down.length)
            out.push(`out of action: ${down.map(x => x.name).join(', ')}`);
    }
    const reduced = Object.entries(abilities(p)).filter(([, v]) => v < 1);
    if (reduced.length)
        out.push(`abilities: ${reduced.map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`);
    if (p.needs) {
        const nd = p.needs, pct = nd.waterL / p.mass * 100, hours = wakeHours(p);
        if (pct >= 2)
            out.push(`water lost ${round(nd.waterL, 1)} L (${round(pct)} % of body mass${pct >= 8 ? ': weak, dizzy, faint; heavy exertion fails' : pct >= 5 ? ': headache, irritable, light-headed' : ': thirsty'})`);
        if (nd.kcal >= KCAL_DAY.rest * kleiber(p))
            out.push(`food deficit ${Math.round(nd.kcal)} kcal (${round(nd.kcal / (KCAL_DAY.rest * kleiber(p)), 1)} days without food at rest)${p.stores && p.stores.mass0 - p.mass >= 0.5 ? `; weighs ${round(p.mass, 1)} kg, ${round(p.stores.mass0 - p.mass, 1)} kg down` : ''}`);
        if (nd.kcal < KCAL_DAY.rest * kleiber(p) && p.stores && p.mass - p.stores.mass0 >= 0.5)
            out.push(`weighs ${round(p.mass, 1)} kg, ${round(p.mass - p.stores.mass0, 1)} kg up`);
        // Felt sleepiness follows the hours awake now, not the debt (it rises little under chronic restriction, Van Dongen 2003).
        const clockH = p.clockMin != null ? hourOfDay(p.clockMin) : null, perf = clockH != null ? clockAwakeBac(hours, clockH) : awakeBac(hours);
        const kss = clockH != null ? Math.round(sleepinessKss(nd.awake / 60, clockH)) : null;
        if (clockH != null ? perf > 0 || (kss ?? 0) >= 6 : hours >= 10)
            out.push(`awake ${round(nd.awake / 60)} h${(nd.debt ?? 0) >= 1 ? ` plus ${round(nd.debt ?? 0)} h of sleep debt` : ''}: performs like blood alcohol ${round(perf, 3)} %${kss != null ? `; feels ${KSS_WORDS[kss - 1]} (KSS ${kss})` : ''}${(nd.debt ?? 0) >= 1 ? '; feels less sleepy than the debt makes them (sleepiness rises little under chronic restriction)' : ''}`);
        if ((nd.alcohol ?? 0) > 0 || (nd.gut ?? 0) > 0.001)
            out.push(`blood alcohol ${round(nd.alcohol ?? 0, 3)} %${(nd.gut ?? 0) > 0.001 ? `, rising: ${round(nd.gut, 3)} % more still being absorbed` : ''}`);
    }
    if ((p.needs?.work ?? 0) > 0)
        out.push(p.exhausted ? 'exhausted: exertion fails until a full sleep' : `work done today: ${Math.round(p.needs.work * 100)} % of what can be kept up`);
    if ((p.heatStroke?.min ?? 0) >= 30)
        out.push(`heat stroke uncooled for 30 min: about ${p.heatStroke.exertional ? '1 in 4' : '2 in 3'} die within days`);
    // The engine draws whether the burns kill (advance: fatal, deathMin); the line gives their extent, no chance.
    if (p.burnDeath)
        out.push(`burned ${burnedTBSA(p)} % of body surface`);
    if (p.co)
        out.push(`carboxyhaemoglobin ${Math.round(p.co.hb * 100)} %${p.co.hb >= 0.3 ? ' (unconscious)' : p.co.hb >= 0.1 ? ' (headache, dizziness, nausea)' : ''}; unconscious at 30 %, dead at 40 %`);
    if (p.peritonitis)
        out.push(`gut opened (peritonitis): belly pain, fever${p.peritonitis.repaired ? '; repaired by laparotomy' : '; without surgery about 9 in 10 die within a week'}`);
    if (p.sepsis)
        out.push(`bloodstream infection (sepsis): fever, weak; heavy exertion fails${p.sepsis.treated ? '; on antibiotics' : '; untreated, about 4 in 5 die within 30 days'}`);
    if (p.venom) {
        const v = p.venom;
        const sy = activeSymptoms(v).map(e => `${e.kind} ${e.sev}`).join(', ');
        if (sy)
            out.push(`venom symptoms (DF severity 0–100): ${sy}${activeSymptoms(v).some(e => e.kind === 'paralysis') ? '; paralysed: motionless, still breathing' : ''}`);
        if (v.kind === 'df')
            out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')} (${v.min} min ago): fictional venom, DF symptoms only`);
        else if (v.kind === 'pain')
            out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')}: severe local pain and swelling; not lethal to a healthy adult`);
        else
            out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')} (${v.mg} mg, ${v.ratio} × the lethal dose)${v.fatal ? (v.kind === 'neuro' ? `: paralysis stops breathing at ${v.collapse} min` : `: shock at ${v.shock} min, death at ${v.death} min`) + ` (now ${v.min} min) unless antivenom` : ': survives without antivenom; local pain and swelling'}`);
    }
    const al = p.altitude;
    if (al) {
        out.push(`altitude ${al.m} m: aerobic capacity ${Math.round(aerobicFactor(al.m) * 100)} %${al.ams ? '; acute mountain sickness (headache, insomnia, nausea; heavy exertion fails)' : ''}${al.hace ? `; high-altitude cerebral oedema: unsteady, confused; coma and death in ${round(((al.haceDeath ?? 0) - al.min) / 60, 1)} h without descent` : ''}${al.hape ? '; high-altitude pulmonary oedema: breathless on mild exertion, cough; up to half die without descent' : ''}${al.ams === false ? '; acclimatizing without sickness' : ''}`);
    }
    const th = p.thermal;
    if (p.env && th?.core != null) {
        const st = coreStage(th.stageCore ?? th.core);
        const cc = coolCore(p);
        if (cc > 0)
            out.push(`cold brain: mental tasks take ${round(1 / thinkSpeed(p), 2)} × as long (accuracy holds), keeps ${Math.round(keepsNew(p) * 100)} % of new information (recall of known things intact)`);
        out.push(`core ${round(th.core, 1)} °C${th.set != null ? ` (normal ${round(th.set, 1)})` : ''}${st ? ` (${st})` : ''}${th.coldest ? `, coldest skin ${th.skinMin} °C (${th.coldest.replace('_', ' ')})` : ''}`);
    }
    if (worldHasMagic()) {
        const n = p.net, s = stage(n);
        out.push(`network: C ${n.C}, N ${n.N}, stage ${s.stage} (max complexity ${s.max}), R ${Math.floor(n.R)}/${n.C} PE, P ${Math.round(n.P * 100)}%`);
    }
    {
        const d = drugStatus(p);
        if (d)
            out.push(d);
    }
    if (p.at)
        out.push(`at ${p.at}`);
    return out.join('. ') + '.';
}
// Knockout: a blunt blow to a HEAD part knocks out when the momentum reaching the head's tissue (after armour) is at least
// this value. Fit (docs/df-body-engine.md §6.1): a Professional 70 kg punch knocks out on 0.743 % of landed head punches
// (97 KOs in 222 BKFC 2022 bouts). Without breathing: death after 5 min (Merck Manual, respiratory arrest).
def({ id: 'koMomentum', value: 158.0, unit: 'momentum at the head', status: 'fitted', src: 'a Professional 70 kg punch knocks out on 0.743 % of landed head punches (97 KOs, BKFC 2022); range: the threshold at the ends of that share\'s 95 % interval (Wilson), 0.59–0.89 %', range: [156.3, 159.7], file: 'body-engine.ts' });
// How long a knockout or a choke keeps a person out, and the concussion after a knockout (docs/credibility-edits.md E22). No
// published distribution of the length was found (OPEN-81): lognormal with a stated median and spread [ASSUMED]. After a
// knockout the person is awake but impaired for hours and not fully alert for days (a ringside doctor's account: J H Fleming,
// WBA convention 2006): tasks that need alertness carry an odds factor of failing that halves over a stated time [ASSUMED].
def({ id: 'koMedianMin', value: 1, unit: 'min', status: 'assumed', src: 'median time unconscious after a knockout; no published distribution found (OPEN-81); "consciousness is typically regained spontaneously within a few minutes or less" (Hånell & Rostami 2020, Front Neurol 11:570566, a review; no measured times)', range: [0.2, 10], file: 'body-engine.ts' });
def({ id: 'chokeMedianMin', value: 0.3, unit: 'min', status: 'assumed', src: 'median time unconscious after a choke is released; no published distribution found', range: [0.1, 1], file: 'body-engine.ts' });
def({ id: 'unconsciousSdLog', value: 0.8, unit: 'SD of ln minutes', status: 'assumed', src: 'spread of the time unconscious', range: [0.4, 1.2], file: 'body-engine.ts' });
def({ id: 'concussionOdds', value: 3, unit: 'odds ratio of failing a task that needs alertness, on waking', status: 'assumed', src: 'impaired consciousness for hours after a knockout (Fleming 2006, WBA)', range: [1.5, 6], file: 'body-engine.ts' });
def({ id: 'concussionHalfH', value: 12, unit: 'h', status: 'assumed', src: 'not fully alert for a few days after a knockout (Fleming 2006, WBA)', range: [4, 48], file: 'body-engine.ts' });
const outFor = (median, rng) => median * Math.exp(k('unconsciousSdLog') * gauss(rng));
/** Odds factor of failing a task that needs alertness, from a concussion (1 without one). */
export const concussionRisk = (p) => p.concussedMin == null ? 1 : 1 + (k('concussionOdds') - 1) * 0.5 ** (p.concussedMin / 60 / k('concussionHalfH'));
// Chokes: unconscious after 6.2–10.5 s of a locked hold on the neck (by choke type; mean 9.0 s, 81 chokes on fully resisting
// trained fighters, Int J Perf Anal Sport 2020); held 5 min → dead (no gas exchange, as apneaDeathMin).
const CHOKE_LOC_S = [6.2, 10.5];
// Default face area of held DF items: shield Ø 85 cm (Viking round shields 80–90 cm, Hurstwic); buckler Ø 30 cm
// (reenactment guidance "10–12 in upwards", Vikings wiki). Thickness 0.9 cm (surviving shields 6–12 mm, Hurstwic).
const HELD_FACE_CM2 = { ITEM_SHIELD_SHIELD: Math.PI * 42.5 ** 2, ITEM_SHIELD_BUCKLER: Math.PI * 15 ** 2 };
const HELD_THICK_CM = 0.9;
def({ id: 'apneaDeathMin', value: 5, unit: 'min without breath', status: 'assumed', src: 'death after minutes without gas exchange (no source recorded; anoxic brain injury begins within minutes)', range: [4, 10], file: 'body-engine.ts' });
def({ id: 'heatDeathCore', value: 46.5, unit: '°C core', status: 'sourced', src: 'highest core temperature survived (Wikipedia, Hyperthermia: 10 July 1980), taken as the ceiling', file: 'body-engine.ts' });
const APNEA_DEATH = () => k('apneaDeathMin');
// Survival (Tipton & Montgomery 2025, Exp Physiol "The physiology of survival: fluid and food"): net water loss 1.5 L/day at
// rest, 4 L/day active or in heat; water lost 5 % of body mass → headache, light-headedness; 8 % → performance significantly
// impaired; death at 15–20 %. Energy use 1400 kcal/day at rest, 2400 active; total starvation kills in 40–60 days.
// Awake hours (NIOSH, from Dawson & Reid 1997): 17 h ≈ BAC 0.05 %, 24 h ≈ 0.10 %.
// Sleep debt (Van Dongen et al. 2003, Sleep 26:117): performance follows cumulative wake beyond a critical 15.84 h a day
// (daily sleep need 8.16 h); 14 nights of 6 h equal 1 night without sleep, of 4 h 2 nights. On falling asleep the wake
// beyond 15.84 h is added to the debt (wake under it pays back); sleep beyond 8.16 h pays back hour for hour [ASSUMED: the
// paper gives no recovery rate]. A sleep of 1 h or more ends the wake spell [ASSUMED]. Impairment uses wake + debt.
// Thirst begins at a water loss of 2 % of body mass, where plasma osmolality has risen about 2 % (Cheuvront et al.,
// "Physiologic basis for understanding quantitative dehydration assessment", Am J Clin Nutr; loss by sweat or no drinking).
const WATER_L_DAY = { rest: 1.5, active: 4 };
const KCAL_DAY = { rest: 1400, active: 2400 };
const SLEEP_WAKE_END_MIN = 60, CRITICAL_WAKE_H = 15.84, SLEEP_NEED_H = 8.16;
// Other body masses scale water and energy use by (mass ÷ 70 kg)^0.75 (Kleiber's metabolic scaling law).
const kleiber = (p) => (p.mass / 70) ** 0.75;
// Alertness: impairment as blood-alcohol level = drinking (grams through the body's water, below; eliminated 0.015 %/h, the
// population mean for moderate drinkers; range 0.010–0.035 %/h, 0.015–0.020 fed, 0.025–0.035 in alcoholics: Jones 2010,
// Forensic Sci Int 200:1)
// + hours awake. Odds of failing × the crash odds ratio exp(40.7 × BAC^1.345), the curve through NHTSA 2015 (Compton & Berning,
// case-control) adjusted odds ratios 2.07 at 0.05 % and 3.93 at 0.08 %, and 1 at 0.
const WIDMARK_R = 0.68, ELIM_PER_MIN = 0.015 / 60, ELIM_FED_PER_MIN = 0.0175 / 60;
// A person's dose spreads through their own body water rather than a fixed share of mass: total body water, L, from 458 men
// and 265 women measured by dilution (Watson, Watson & Batt 1980, Am J Clin Nutr 33:27): men 2.447 − 0.09516 age + 0.1074
// height cm + 0.3362 kg (SD 3.76 L), women −2.097 + 0.1069 height + 0.2466 kg (SD 3.60 L; age adds nothing in women). Blood
// is 80 % water, so BAC g/100 mL = grams × 0.8 ÷ (TBW L × 10) (Watson et al. 1981, J Stud Alcohol 42:547). Height unknown:
// the ANSUR II median of the sex (175.5, 162.6 cm); age unknown: 25. Other species keep Widmark's 0.68 of mass.
def({ id: 'bloodWater', value: 0.8, unit: 'share of blood that is water', status: 'sourced', src: 'Watson, Watson & Batt 1981, J Stud Alcohol 42:547 (BAC from total body water)', range: [0.78, 0.82], file: 'body-engine.ts' });
/** Total body water, L (Watson 1980 for a human; 0.68 × mass for others). */
export function bodyWaterL(p) {
    if (p.species && !/^human$/i.test(p.species))
        return WIDMARK_R * p.mass;
    const f = p.sex === 'female', ht = p.heightCm ?? (f ? 162.6 : 175.5), age = p.age ?? 25;
    const tbw = f ? -2.097 + 0.1069 * ht + 0.2466 * p.mass : 2.447 - 0.09516 * age + 0.1074 * ht + 0.3362 * p.mass;
    return Math.max(0.3 * p.mass, tbw);
}
// Absorption (Jones 1991, J Forensic Sci Soc 31:429: two beers, peak blood alcohol at a mean 41 min on an empty stomach, 32 min
// with a meal and about 25 % lower: 32 → 24 and 37 → 28 mg/100 mL; and Jones, Jönsson & Neri 1991, J Forensic Sci 36:376: the
// peak within 45 min in 77 % and within 60 min of the end of drinking in 92 % of 152 fasted men). First-order absorption from
// the stomach, eliminated at 0.015 %/h meanwhile: empty stomach k = 0.062 per min (half absorbed in 11 min); with a meal k =
// 0.078 and 76 % of the dose reaching the blood (fitted to the two profiles with the dose free) [FITTED]. A meal is food of 200
// kcal or more within the hour before or with the drink [ASSUMED].
def({ id: 'absorbFastPerMin', value: 0.062, unit: '1/min, alcohol absorption on an empty stomach', status: 'fitted', src: 'Jones 1991: peak at a mean 41 min fasted', range: [0.04, 0.1], file: 'body-engine.ts' });
def({ id: 'absorbFedPerMin', value: 0.078, unit: '1/min, alcohol absorption after a meal', status: 'fitted', src: 'Jones 1991: peak at a mean 32 min with food, 25 % lower', range: [0.05, 0.12], file: 'body-engine.ts' });
def({ id: 'fedBioavailable', value: 0.76, unit: 'share of a drink reaching the blood after a meal', status: 'fitted', src: 'Jones 1991: peak 25 % lower with food', range: [0.65, 0.9], file: 'body-engine.ts' });
def({ id: 'mealKcal', value: 200, unit: 'kcal of food (net of the drink) that makes a meal for absorption', status: 'assumed', src: 'the fed-state studies served full meals; a snack is taken as not slowing the stomach', range: [100, 400], file: 'body-engine.ts' });
def({ id: 'fedWindowMin', value: 60, unit: 'min after a meal that the stomach counts as fed', status: 'assumed', src: 'a meal empties from the stomach over a few hours; the studies drank with or just after it', range: [30, 180], file: 'body-engine.ts' });
/** Blood alcohol, g/100 mL, that `grams` of alcohol raise in this person once absorbed. */
export const bacOfGrams = (p, grams) => grams * k('bloodWater') / (bodyWaterL(p) * 10);
export const crashRisk = (bac) => Math.exp(40.7 * Math.max(0, bac) ** 1.345);
export const impairmentBac = (p) => (p.needs?.alcohol || 0) + (p.clockMin != null ? clockAwakeBac(wakeHours(p), hourOfDay(p.clockMin)) : awakeBac(wakeHours(p)));
// Time on task (Tucker, Folkard, Lombardi & Macdonald 2003, Occup Environ Med 60:433, as modelled by Folkard & Lombardi 2006,
// Am J Ind Med 49:953): within a spell of work between breaks of 15 minutes, the risk of an incident rose about linearly and
// had doubled by the last 30 minutes of a 2-hour spell: odds of failing × (1 + minutes ÷ 105), held past 2 h [ASSUMED]; over
// the day's work, 10-hour shifts carried 13.0 % more risk than 8-hour ones and 12-hour shifts 27.5 % more: × 1.275^((hours −
// 8) ÷ 4) past 8 hours worked since the last sleep [ASSUMED: the shift-length risk applied hour by hour].
def({ id: 'breakMin', value: 15, unit: 'min of rest that ends a spell of work', status: 'sourced', src: 'Tucker et al. 2003, 15-minute breaks after each 2 h', range: [10, 30], file: 'body-engine.ts' });
def({ id: 'workDoublingMin', value: 105, unit: 'min on a task by which the odds of failing double', status: 'fitted', src: 'doubled by the last 30 minutes of a 2-hour spell (Tucker et al. 2003)', range: [90, 120], file: 'body-engine.ts' });
export const workRisk = (p) => {
    const n = p.needs;
    if (!n)
        return 1;
    const spell = 1 + Math.min(120, n.onTask ?? 0) / k('workDoublingMin'), day = (n.duty ?? 0) / 60 > 8 ? 1.275 ** (((n.duty ?? 0) / 60 - 8) / 4) : 1;
    return spell * day;
};
// Dehydration and the mind (Wittbrodt & Millard-Stafford 2018, Med Sci Sports Exerc 50:2360, 33 studies): with more than 2 %
// of body mass lost, performance fell by ES −0.28 overall, attention −0.52, motor coordination −0.40; at 2 % or less −0.14.
// Odds of failing × e^(1.81 × |ES|) (Chinn 2000's conversion of a standardized difference to log odds): attention tasks take
// the attention ES, hand tasks the motor ES, from 1 % lost [ASSUMED onset]. Hunger is left out on purpose: across 222 effect
// sizes and 3,484 people, fasted and fed did not differ (g = 0.02; Bamberg et al. 2025, Psychol Bull); nor is pain an input:
// induced pain slowed alerting by 9 ms and left other attention unchanged (meta-analysis, J Pain Res 12, 2019).
// Heat and cold of the surroundings (Pilcher, Nadler & Busch 2002, Ergonomics 45:682, 22 studies, 515 effect sizes): against
// neutral rooms, performance fell by d = 0.382 at WBGT 32.22 °C or more, 0.189 at 26.67–32.22, 0.197 at 10–18.33 °C and 0.356 at
// 10 °C or less (21.11–26.61: 0.02, left out). Odds of failing an alertness task × e^(1.81 d) (Chinn 2000). WBGT in the shade
// from air temperature and humidity: 0.567 T + 0.393 e + 3.94, e the vapour pressure in hPa (Australian Bureau of Meteorology's
// approximation). The cold bands are air temperatures, and taken to apply to people dressed under 1 clo on average, as the
// studies' subjects were [ASSUMED]; in the water the body's own cooling rules stand instead.
export function climateRisk(p) {
    const e = p.env;
    if (!e || e.water)
        return 1;
    const ta = e.tdb, vp = (e.rh ?? 50) / 100 * 6.105 * Math.exp(17.27 * ta / (237.7 + ta)), wbgt = 0.567 * ta + 0.393 * vp + 3.94;
    const clo = Array.isArray(e.clo) && e.clo.length ? e.clo.reduce((s, c) => s + c, 0) / e.clo.length : 0;
    const d = wbgt >= 32.22 ? 0.382 : wbgt >= 26.67 ? 0.189 : clo < 1 ? (ta <= 10 ? 0.356 : ta <= 18.33 ? 0.197 : 0) : 0;
    return Math.exp(1.81 * d);
}
def({ id: 'thirstOnsetPct', value: 1, unit: '% of body mass lost as water from which the mind is slowed', status: 'assumed', src: 'the meta-analysis pools losses of 2 % or less; its smallest losses were about 1 %', range: [0.5, 2], file: 'body-engine.ts' });
export function thirstRisk(p, kind) {
    const pct = p.needs ? p.needs.waterL / p.mass * 100 : 0;
    if (!reaches('thirstOnsetPct', pct))
        return 1;
    const es = pct > 2 ? (kind === 'attention' ? 0.52 : 0.40) : 0.14;
    return Math.exp(1.81 * es);
}
/** Hours awake now plus sleep debt carried from short nights. */
export const wakeHours = (p) => (p.needs?.awake || 0) / 60 + (p.needs?.debt || 0);
export const awakeBac = (h) => Math.max(0, 0.05 + (h - 17) * 0.05 / 7);
// Alertness by the clock (docs/df-body-engine.md §6.3 sleep): the three-process model of Åkerstedt & Folkard with the
// parameters validated on 136 aircrew (Ingre et al. 2014, PLoS ONE 9:e108679): alertness = S + C (1–21 scale; 7 = the
// sleepiness threshold), S = 2.4 + (14 − 2.4)·e^(−0.0353 h) after h hours awake from a full night, C = 2.5·cos(π(t − 16.8)/12)
// at clock hour t; felt sleepiness KSS = 9.68 − 0.46 × alertness (their best model, S + C, residual SD 1.42). The 12-h term
// and sleep inertia are left out: neither improved the fit there. Performance as blood alcohol keeps the Dawson & Reid
// protocol that set awakeBac (awake from 08:00: 0.05 % at 17 h, 0.10 % at 24 h): BAC = κ(A* − alertness), κ and A* solved
// from those two points [FITTED], so the protocol is reproduced and the clock moves it. The body clock is taken as set to the
// local clock (no jet lag). Clock unknown: awakeBac stands.
def({ id: 'tpmDecay', value: 0.0353, unit: '1/h, fall of alertness S while awake', status: 'sourced', src: 'Ingre et al. 2014, PLoS ONE 9:e108679 (three-process model)', range: [0.03, 0.04], file: 'body-engine.ts' });
def({ id: 'tpmAmp', value: 2.5, unit: 'alertness units, circadian amplitude', status: 'sourced', src: 'Ingre et al. 2014 (three-process model, C)', range: [1.5, 3.5], file: 'body-engine.ts' });
def({ id: 'tpmPhase', value: 16.8, unit: 'clock hour of peak alertness', status: 'sourced', src: 'Ingre et al. 2014 default (their aircrew data put it near 15 h)', range: [15, 18], file: 'body-engine.ts' });
const tpmS = (h) => 2.4 + (14 - 2.4) * Math.exp(-k('tpmDecay') * Math.max(0, h));
const tpmC = (clockH) => k('tpmAmp') * Math.cos(Math.PI * (clockH - k('tpmPhase')) / 12);
/** Three-process alertness (1–21) after `h` hours awake at clock hour `clockH`. */
export const alertness = (h, clockH) => tpmS(h) + tpmC(clockH);
/** Hour of the day (0–24) of a story minute. */
export const hourOfDay = (min) => ((min / 60) % 24 + 24) % 24;
/** Performance as blood alcohol, % (0 when rested), after `h` hours awake (plus debt) at clock hour `clockH`. */
export function clockAwakeBac(h, clockH) {
    const a17 = alertness(17, 1), a24 = alertness(24, 8), kappa = 0.05 / (a17 - a24);
    return Math.max(0, kappa * (a17 + 0.05 / kappa - alertness(h, clockH)));
}
/** Felt sleepiness on the Karolinska scale (1 extremely alert … 7 sleepy, some effort to keep awake … 9 fighting sleep). */
export const sleepinessKss = (h, clockH) => Math.min(9, Math.max(1, 9.68 - 0.46 * alertness(h, clockH)));
const KSS_WORDS = ['extremely alert', 'very alert', 'alert', 'rather alert', 'neither alert nor sleepy', 'some signs of sleepiness', 'sleepy, no effort to keep awake', 'sleepy, some effort to keep awake', 'very sleepy, fighting sleep'];
// Flight speed of a shot: 47.23 m/s, a 102 g arrow from a 144 lbf yew self bow (Stretton et al. 2010), for every launcher.
const SHOT_MPS = 47.23;
const SHOT_HC = [101, 95, 89, 83, 77, 71, 65, 59, 53];
// Spread of a blow's momentum: Walilko 2005 punch force SD ÷ mean (rule 576), applied to every attack.
const SPREAD = 0.237;
const BLADE_LIMB_ARTERY = 0.12;
const REF_MASS = 70;
export function gauss(rng) {
    return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}
const norm = (t) => String(t || '').trim().toLowerCase().replace(/[_\s]+/g, ' ');
/** A part of creature c by name or DF id ("right upper arm", "RUA"); null when none. */
export function findPart(c, text) {
    const key = norm(text);
    return c.parts.find(x => norm(x.name) === key) ?? c.parts.find(x => norm(x.id) === key) ?? null;
}
export const aimable = (c) => c.parts.filter(x => !x.flags.includes('INTERNAL')).map(x => x.name);
/** Vessel class of the cut layers (rule 576 rates; DF marks which layers carry arteries). */
function vesselOf(c, layers, rng) {
    const tis = (l) => c.tissues[l.tissue];
    if (layers.some(l => l.major))
        return 'femoral';
    if (layers.some(l => tis(l)?.flags.includes('ARTERIES')) && rng() < BLADE_LIMB_ARTERY)
        return 'limb_artery';
    return layers.some(l => (tis(l)?.VASCULAR ?? 0) > 0) ? 'small' : undefined;
}
/** A cut, puncture or bite through every layer of a part, recorded without an attack (BodyWound). */
export function openWound(p, part, type, rng = Math.random) {
    const c = creatureOf(p);
    // Through every layer: organ (FUNCTIONAL) tissue stops working, for good when it has no HEALING_RATE (as in strike).
    const organ = liveLayers(c, part).map(l => tissueOf(c, l)).filter((t) => !!t?.flags.includes('FUNCTIONAL'));
    const w = addWound(p, { part, type, vessel: vesselOf(c, part.layers, rng), functionLost: organ.length > 0,
        permanent: organ.some(t => t.HEALING_RATE == null) }, rng);
    checkDeath(p);
    return w;
}
// Whether an attack lands: it does unless the target detects it and finishes a defensive move before impact.
// Seconds. Sources and proxies: rule 576 reference.
const REACH_M = 0.88; // FAA 2006-08 functional reach, men 50th %ile
const STRIKE_S = { fist: [0.357, 0.178], kick: [0.477, 0.203], blade_cut: [0.357, 0.178], blade_stab: [0.357, 0.178] }; // Piorkowski 2011 jab; kick = hook, blade = jab (proxies)
// Reaction = sense organ → cortex + brain decision + synapse + nerve path ÷ conduction speed + muscle activation + force rise.
// Human check: sight 0.056 + 0.204 + 0.070 = 0.330 s (measured 0.331); hearing 0.011 + 0.204 + 0.070 = 0.285 s (measured 0.284).
const SENSE_S = { sight: 0.056, hearing: 0.0109 }; // Foxe & Simpson 2002 V1 onset; Brugge 2008 A1 onset
const DECIDE_S = 0.2037; // human: measured RT minus all other parts, sight 0.2046 / hearing 0.2027
const NERVE_MPS = 49; // Chen 2016 AANEM: median/ulnar motor conduction lower limit
const SYNAPSE_S = 0.0007; // More & Donelan 2018
const twitch = (mass) => 0.0043 * mass ** 0.21 + 0.0176 * mass ** 0.20; // More & Donelan 2018: electromechanical + force generation
const RT_CV = 36.42 / 297; // Petri 2020 spread
// An expert of a combat sport responds faster to an opponent's move: experts against non-experts, response time Hedges'
// g = −0.91 (95 % CI −1.08 to −0.73; Zhang, Piras, Chen, Kong & Wang 2022, Front Psychol 13:961960, random effects, combat
// sports). An expert defender's reaction is that many of the engine's reaction SDs (RT_CV) faster [ASSUMED: the gap to the
// untrained at least that of experts to novices].
def({ id: 'expertRtSd', value: 0.91, unit: 'reaction SDs faster for an expert defender', status: 'assumed', src: 'experts against non-experts of combat sports, response time g = −0.91 (Zhang et al. 2022), taken against the untrained', range: [0.73, 1.08], file: 'body-engine.ts' });
// Simple reaction time by age and sex (Der & Deary 2006, Psychol Aging 21:62, Table 1, 7,130 adults 18–94): the table's
// Box–Cox polynomial y = b0 + b1 a + b2 a² + b3 a³ + man × (bs + b4 a + b5 a²), a = age − 44.9, inverted as ms = (1 + λy)^(1/λ),
// λ = −1.65. Gives men 277, 281, 290, 324, 399 ms and women 295, 294, 301, 344, 462 ms at ages 18, 30, 45, 65, 80; held
// below 18 and above 85, where the cubic runs toward the transform's pole (women 567 ms at 85, 833 at 90) [ASSUMED cut]. Scales the reaction ÷ a man of 30 [reference ASSUMED].
const RT_B = [0.6060111935, 0.0000002515, 0.0000000097, 0.0000000001, -0.0000029779, 0.0000000044, -0.0000000031];
const rtMs = (age, sex) => {
    const a = Math.max(18, Math.min(85, age)) - 44.9, m = sex === 'female' ? 0 : 1;
    const y = RT_B[0] + RT_B[1] * a + RT_B[2] * a * a + RT_B[3] * a ** 3 + m * (RT_B[4] + RT_B[5] * a + RT_B[6] * a * a);
    return (1 - 1.65 * y) ** (-1 / 1.65);
};
export const reactionFactor = (p) => p?.age == null ? 1 : rtMs(p.age, p.sex ?? 'male') / rtMs(30, 'male');
const LIMB_MOVE_S = 0.242; // VencesBrito 2011 karate punch: moving a limb (block)
const BODY_MOVE_S = 0.715; // Wakatsuki & Yamada 2020: reactive side-step movement time (dodge)
const WAKE_DB = 55, WAKE_MAX_S = 21; // young adults: all woke to a 55 dBA alarm within 21 s
const WAKE_MIN_S = 1.59; // Oudiette 2023: median response time from N2 sleep
const INERTIA_SPEED = 0.79; // Newman 2013: response speed 79 % right after waking
// Body size, not species: the human values above are the 70 kg point of mammal scaling laws (5 g – 5000 kg).
const EXP_MOVE = 0.15; // Heglund & Taylor 1988: stride period ∝ M^0.150–0.156
const EXP_LENGTH = 1 / 3; // geometric similarity
const size = (mass, exp) => ((mass || REF_MASS) / REF_MASS) ** exp;
/** How far a body of `mass` kg reaches with an arm, m: the 70 kg functional reach scaled by length (geometric similarity). */
export const reachOf = (mass) => REACH_M * size(mass, EXP_LENGTH);
/** Seconds from the start of the attack to impact, or null when the attacker never comes within reach. */
function impactTime(a, rng) {
    const reach = reachOf(a.mass);
    const dist = a.distance_m ?? reach;
    const approach = dist <= reach ? 0 : (a.approach_speed ?? 0) > 0 ? (dist - reach) / a.approach_speed : null;
    if (approach === null)
        return null;
    const [mean, sd] = STRIKE_S[a.means ?? 'fist'] || STRIKE_S.fist;
    return { approach, reach, strike: Math.max(0.05, mean + sd * gauss(rng)) * size(a.mass, EXP_MOVE) };
}
/**
 * Earliest second (from attack start) at which the target finishes a defensive move, or Infinity.
 * A channel perceives the attacker from some second on; the attack itself is recognisable from second 0
 * when intent is visible, otherwise only once the strike starts (t.approach).
 */
function defenceDone(a, t, defender, rng) {
    if (defender?.unconscious)
        return Infinity;
    const awake = a.awake !== false;
    const dist = a.distance_m ?? t.reach;
    const intentFrom = a.intent_visible ? 0 : t.approach;
    const m = defender?.mass ?? REF_MASS;
    const body = defender?.body ?? {};
    const nerve = Math.max(1, (body.nerve_mps ?? NERVE_MPS) - NERVE_PER_C * limbCold(defender, 'arm'));
    const motor = SYNAPSE_S + (body.limb_m ?? REACH_M * size(m, EXP_LENGTH)) / nerve + twitch(m);
    const rt = (channel) => ((body.sense_s?.[channel] ?? SENSE_S[channel]) + (body.decide_s ?? DECIDE_S) + motor)
        * reactionFactor(defender) * (a.defender_expert ? 1 - k('expertRtSd') * RT_CV : 1) * Math.max(0.5, 1 + RT_CV * gauss(rng));
    const done = [];
    const perceive = (from, reaction) => done.push(Math.max(from, intentFrom) + reaction);
    // Sense organs. Human monocular field 107° temporal, 60° nasal (Rönne 1915): a blow from the side (90°) is seen only by
    // the eye on that side, from behind by none. One ear lost: thresholds +3 dB (binaural summation, Baker et al. 2020).
    const c = defender ? creatureOf(defender) : null;
    const works = c && defender ? worksFn(defender, c) : () => true;
    const organs = (flag) => c ? c.parts.filter(x => x.flags.includes(flag)) : [{ flags: [] }];
    const eyes = organs('SIGHT').filter(works), ears = organs('HEAR'), earsOk = ears.filter(works).length;
    const dir = a.from ?? (a.facing === false ? 'back' : 'front');
    const sideFlag = dir === 'left' ? 'LEFT' : dir === 'right' ? 'RIGHT' : undefined;
    const eyeSees = (e) => sideFlag ? e.flags.includes(sideFlag) || !e.flags.some(f => f === 'LEFT' || f === 'RIGHT') : a.facing !== false;
    // Light (E13): with `lux` (the sky or the room, when the story did not say whether it is lit) the target sees the attacker
    // with the chance of noticing a person-sized target (vision.ts, 0.5 m) at the starting distance, one draw.
    const sees = a.lit !== false && dir !== 'back' && eyes.some(eyeSees) && (a.lit === true || a.lux == null || rng() < see({ size: 0.5, distance: Math.max(0.5, dist), light: a.lux }).detect);
    // A named sound source (Listen presets) at the attack's starting distance gives the level by spherical spreading.
    const db = a.noise_sound && SOUNDS[classOf(SOUNDS, a.noise_sound) ?? ''] != null ? SOUNDS[classOf(SOUNDS, a.noise_sound)] - 20 * Math.log10(Math.max(1, a.distance_m ?? 1)) : a.noise_db || 0, level = db - hearingShift(defender?.species) - (earsOk < ears.length ? 3 : 0);
    const audible = earsOk > 0 && inRange(defender?.species, db, a.noise_khz);
    if (awake && sees)
        perceive(0, rt('sight'));
    // Hearing the attacker over the background (E18): the band rule of Listen at the target (level at 1 m, the species and
    // one-ear shifts already taken off), heard with the chance Φ(margin ÷ σ), one draw (before: any level above 25 dB).
    if (awake && audible && rng() < hearSound({ spl: level, distance: 1, noise: a.background ?? 'quiet room (25 dB)', noiseDb: a.background_db ?? null }).p)
        perceive(0, rt('hearing'));
    if (!awake && audible && level >= WAKE_DB) {
        const woke = WAKE_MIN_S + rng() * (WAKE_MAX_S - WAKE_MIN_S);
        // Once awake the target sees or hears like anyone awake, slowed by sleep inertia.
        perceive(woke, rt(sees ? 'sight' : 'hearing') / INERTIA_SPEED);
    }
    const r = a.sense_range_m || 0;
    if (awake && r > 0) {
        // Senses during sleep: OPEN-63. A range sense perceives the attacker (or its hand) within r.
        const enter = dist <= r ? 0 : r >= t.reach ? (dist - r) / (a.approach_speed ?? Infinity) : t.approach + t.strike * (t.reach - r) / t.reach;
        perceive(enter, rt('sight'));
    }
    return done.length ? Math.min(...done) : Infinity;
}
/** Seconds a defensive move takes: a limb (block) or the whole body (dodge), ÷ the ability that drives it. */
function moveTime(defender, kind) {
    const ab = defender ? abilities(defender) : {};
    const key = kind === 'block' ? 'grasp' : 'stance';
    const capacity = (ab[key] ?? (kind === 'block' ? 0 : 1)) * speedFactor(limbCold(defender, kind === 'block' ? 'arm' : 'leg'));
    if (capacity <= 0)
        return Infinity;
    return (kind === 'block' ? LIMB_MOVE_S : BODY_MOVE_S) * size(defender?.mass ?? REF_MASS, EXP_MOVE) / capacity;
}
/**
 * An attack (docs/df-body-engine.md §4–5). a: { part, attack, weapon?, material?, armor? (worn items, text), skill?, style?, prone?, species?, mass?,
 * landed?, scene fields }. The attacker's species and mass come from the tracked attacker when there is one.
 */
export function strike(target, a, attacker = null, rng = Math.random) {
    const tc = creatureOf(target);
    const ac = creature(attacker?.species ?? a.species ?? 'HUMAN');
    if (!tc || !ac)
        return 'Creature data is still loading. State unchanged.';
    const aMass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    let part = a.part ? findPart(tc, a.part)
        : randomHitPart(tc, rng, { attackerCm3: aMass * 1000, flies: ac.parts.some(x => x.flags.includes('FLIER')) });
    if (!part || part.flags.includes('INTERNAL'))
        return `Aim at one of ${tc.name}'s parts: ${aimable(tc).join(', ')}. State unchanged.`;
    const mass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    const iSize = mass * 1000;
    const worn = [];
    // Worn gear: a DF item ("iron helm") gives the defaults; covers (CDDA-style portions: part, sub-locations, coverage %,
    // material), layer and flexible replace them.
    const pct = (x) => Math.max(0, Math.min(150, Number(x)));
    const works = worksFn(target, tc);
    const notes = [];
    for (const g of a.armor || []) {
        const spec = typeof g === 'string' ? { item: g } : g;
        const it = armorOf(spec.item) ?? (spec.covers?.length || spec.held_in || spec.size_cm ? customGearOf(spec.item) : null);
        if (!it)
            return `No gear "${spec.item}": name a DF item with its material ("iron helm", "leather armor"), or give covers, held_in or size_cm with a material first ("iron skullcap"). State unchanged.`;
        // Held: in the named part, else a working GRASP part for DF shields; dropped from the hit when no holding part works.
        if (spec.held_in || it.kind === 'ITEM_SHIELD') {
            const holder = spec.held_in ? findPart(tc, spec.held_in) : tc.parts.find(x => x.flags.includes('GRASP') && works(x));
            if (spec.held_in && !holder)
                return `Give held_in as one of ${tc.name}'s parts. State unchanged.`;
            if (!holder || !works(holder)) {
                notes.push(`${it.name} lies unheld: the hands are out of action`);
                continue;
            }
            it.held = holder;
            const dims = (spec.size_cm || []).map(Number).filter(x => x > 0);
            const face = dims.length >= 2 ? dims[0] * dims[1] : dims.length === 1 ? Math.PI * (dims[0] / 2) ** 2
                : HELD_FACE_CM2[it.id ?? ''] ?? null;
            if (!face)
                return `${it.name}: give size_cm (diameter, or width and height). State unchanged.`;
            it.face = face;
            it.thick = Number(spec.thickness_cm) || HELD_THICK_CM;
        }
        if (spec.layer)
            it.layer = spec.layer;
        if (spec.flexible !== undefined)
            it.elastic = !!spec.flexible;
        if (spec.covers?.length) {
            const portions = it.parts = {};
            for (const cv of spec.covers) {
                const pt = findPart(tc, cv.part);
                if (!pt)
                    return `Give the part ${it.name} covers as one of ${tc.name}'s parts. State unchanged.`;
                const known = Object.keys(sublocationsOf(pt) || {});
                const subs = cv.sublocations?.length ? cv.sublocations.map(x => String(x).trim().toLowerCase()) : null;
                const bad = subs?.find(x => !known.includes(x));
                if (bad)
                    return `${pt.name}'s sub-locations: ${known.join(', ') || 'the whole part only'}. State unchanged.`;
                const mat = cv.material ? gearMaterialOf(cv.material) : null;
                if (cv.material && !mat)
                    return `No material "${cv.material}". State unchanged.`;
                const sides = cv.sides?.length ? cv.sides.filter((x) => x === 'front' || x === 'back') : undefined;
                (portions[pt.id] ??= []).push({ subs, sides, coverage: pct(cv.coverage ?? 100), ...(mat ? { mat, elastic: mat.kind === 'thread' } : {}) });
            }
        }
        // A held item without covers guards the front of the holding limb, torso and head: coverage = its face area ÷ their
        // frontal area, each part's frontal area = (part size cm³)^(2/3) [geometric similarity].
        if (it.held && !spec.covers?.length) {
            const chain = [];
            for (let q = it.held; q && !q.flags.includes('UPPERBODY'); q = tc.parts.find(x => x.id === q.parent))
                chain.push(q);
            const guarded = [...chain, ...tc.parts.filter(x => ['UPPERBODY', 'LOWERBODY', 'HEAD'].some(f => x.flags.includes(f)))];
            const front = guarded.reduce((s, x) => s + (target.mass * 1000 * x.relsize / (tc.relTotal ?? 1)) ** (2 / 3), 0);
            const face = it.face ?? 0, cov = Math.min(100, 100 * face / front);
            it.parts = Object.fromEntries(guarded.map(x => [x.id, [{ subs: null, sides: ['front'], coverage: cov }]]));
            it.size = face * (it.thick ?? HELD_THICK_CM);
        }
        worn.push(it);
    }
    let w, verb, means, bite = false, inject = false;
    if (a.launcher) {
        const lw = weaponOf(a.launcher);
        if (!lw?.ranged)
            return `No DF launcher "${a.launcher}" (bow, crossbow, blowgun). State unchanged.`;
        const am = ammoOf(lw.ranged.ammoClass);
        const mat = gearMaterialOf(a.material || 'iron');
        if (!am || !mat)
            return `No ammunition for ${a.launcher}${a.material ? ` in ${a.material}` : ''}. State unchanged.`;
        w = shot(lw, am, mat);
        verb = 'shot';
        means = 'shot';
    }
    else if (a.weapon) {
        const wp = weaponOf(a.weapon);
        if (!wp)
            return `No weapon "${a.weapon}". State unchanged.`;
        const metal = metalOf(a.material || 'iron');
        if (!metal)
            return `No metal "${a.material}". State unchanged.`;
        const atk = wp.attacks.find(x => norm(x.verb) === norm(a.attack)) ?? wp.attacks[0];
        w = { ...itemWeapon(wp, atk, metal), piercing: atk.contact < atk.penetration };
        verb = atk.verb;
        means = 'blade_cut';
    }
    else {
        const atk = ac.attacks.find(x => norm(x.id) === norm(a.attack) || norm(x.verb) === norm(a.attack));
        if (!atk)
            return `${ac.name}'s attacks: ${ac.attacks.map(x => x.verb).join(', ') || 'none'}. State unchanged.`;
        const bw = bodyWeapon(ac, atk, iSize, attacker ? worksFn(attacker, ac) : () => true);
        if (!bw)
            return `The attacker's parts for ${atk.verb} are all out of action. State unchanged.`;
        w = { ...bw, piercing: atk.contactPerc < atk.penetrationPerc };
        verb = atk.verb;
        bite = atk.id === 'BITE';
        inject = !!atk.inject;
        means = atk.sel[1] === 'STANCE' ? 'kick' : 'fist';
    }
    // Aim (§4.4b): a shot at a named part lands on it with P = 1 − e^(−((R + arrow radius) ÷ σr)²), σr = distance × σt,
    // σt = 5e−4 × 1.035^(h + 6) × e^(0.00365 d) rad (Archery GB 2023 handicap scheme, archeryutils). Handicap h from DF skill by the
    // Archery GB outdoor longbow classification thresholds 101 (Archer 3rd class) … 53 (Elite Master Bowman) [ASSUMED mapping, one
    // class per skill level from Dabbling; Expert and above EMB]. R = √(A ÷ π), A = part volume^(2/3) (as for armour, §4.5).
    // A miss on the part still lands elsewhere with the same law for the whole body (sum of outer parts' areas); else it misses.
    if (means === 'shot' && !a.landed && a.part) {
        const d = a.distance_m ?? 10, h = SHOT_HC[Math.min(SHOT_HC.length - 1, Math.max(0, SKILL_LEVELS.indexOf(a.skill ?? 'Dabbling')))];
        const sr = d * 5e-4 * 1.035 ** (h + 6) * Math.exp(0.00365 * d);
        // Shooter under fire: hit chances × 0.6 (police hit 18 % in gunfights against 30 % when not fired upon; RAND 2008).
        const pHit = (r) => (1 - Math.exp(-(((r + 0.00275) / sr) ** 2))) * (a.under_fire ? 0.6 : 1);
        const vol = target.mass / 1000, area = (p) => (vol * p.relsize / (tc.relTotal ?? 1)) ** (2 / 3);
        const bodyA = tc.parts.filter(x => !x.flags.includes('INTERNAL')).reduce((t, x) => t + area(x), 0);
        const onPart = pHit(Math.sqrt(area(part) / Math.PI)), onBody = pHit(Math.sqrt(bodyA / Math.PI));
        const u = rng();
        console.debug?.('[Rules engine]', `shot spread ${round(sr * 100)} cm at ${d} m; on part ${Math.round(onPart * 100)} %, on body ${Math.round(onBody * 100)} %`);
        if (u >= onBody)
            return `shot at ${part.name}: misses, wide of the body${a.under_fire ? ', the shooter under fire' : ''}.`;
        if (u >= onPart) {
            const was = part.name;
            part = randomHitPart(tc, rng, { attackerCm3: aMass * 1000 }) ?? part;
            notes.push(`aimed at ${was}, struck ${part.name}`);
        }
    }
    if (!a.landed) {
        const at = { ...a, means, mass };
        const t = means === 'shot'
            ? { approach: 0, reach: a.distance_m ?? 10, strike: (a.distance_m ?? 10) / SHOT_MPS }
            : impactTime(at, rng);
        if (!t)
            return `${verb} at ${part.name}: stays out of reach (${a.distance_m} m); the blow falls short.`;
        const impact = t.approach + t.strike;
        // The defender reacts at `ready`, then moves: a dodge moves the body out of the way; a block puts a limb in the
        // blow's way (with the held item, else the forearm itself).
        const ready = defenceDone(at, t, target, rng);
        const works = worksFn(target, tc);
        const held = worn.find(x => x.held);
        const forearm = tc.parts.find(x => x.flags.includes('LIMB') && works(x) && tc.parts.some(g => g.parent === x.id && g.flags.includes('GRASP') && works(g)));
        const blockAt = held || forearm ? ready + moveTime(target, 'block') : Infinity;
        const dodgeAt = ready + moveTime(target, 'dodge');
        const at2 = (s) => `${s.toFixed(2)} s, impact at ${impact.toFixed(2)} s`;
        // Least harm first: a dodge that finishes in time, else a block with a held item, else with the forearm.
        if (dodgeAt <= impact)
            return `${verb} at ${part.name}: dodged (dodge done at ${at2(dodgeAt)}).`;
        if (blockAt <= impact) {
            if (held) {
                held.blocking = true;
                notes.push(`blocked with ${held.name} (block done at ${at2(blockAt)})`);
            }
            else if (forearm) {
                notes.push(`blocked with the ${forearm.name} (block done at ${at2(blockAt)})`);
                part = forearm;
            }
        }
    }
    const M = 'M' in w ? w.M : momentum(ac, iSize, w, a) * Math.max(0, 1 + SPREAD * gauss(rng));
    // Side hit: the one facing the attacker; a blow from the left or right lands front or back alike (equal halves).
    const from = a.from ?? (a.facing === false ? 'back' : 'front');
    const side = from === 'front' || from === 'back' ? from : rng() < 0.5 ? 'front' : 'back';
    const r = penetrate(tc, part, target.mass * 1000, w, M, rng, worn, side);
    const made = [];
    const touched = [...new Set(r.hits.map(h => h.part))];
    for (const hp of touched) {
        const hits = r.hits.filter(h => h.part === hp);
        const flags = (h) => tissueOf(tc, h.layer)?.flags || [];
        const rigid = (h) => flags(h).includes('STRUCTURAL') && !flags(h).includes('FUNCTIONAL');
        const cuts = hits.filter(h => h.result === 'cut').map(h => h.layer);
        const soft = hits.filter(h => !rigid(h));
        const functionLost = hits.some(h => flags(h).includes('FUNCTIONAL'));
        const severed = r.severed && hp === part;
        // DF HEALING_RATE: lower heals faster, absent never heals (wiki Tissue definition token).
        const rate = (h) => h.layer.healing ?? tissueOf(tc, h.layer)?.HEALING_RATE;
        const slowest = (hs, ref) => hs.length && hs.every(h => rate(h) != null) ? Math.max(...hs.map(h => rate(h))) / ref : 1;
        const permanent = hits.some(h => flags(h).includes('FUNCTIONAL') && rate(h) == null);
        if (soft.length || severed) {
            const type = severed ? 'severed' : cuts.length ? (bite ? 'bite' : w.piercing ? 'puncture' : 'cut') : 'blunt';
            made.push(addWound(target, { part: hp, type, vessel: cuts.length ? vesselOf(tc, cuts, rng) : undefined, functionLost, permanent,
                healFactor: slowest(soft.filter(h => rate(h) != null), 100) }, rng));
        }
        if (hits.some(rigid))
            made.push(addWound(target, { part: hp, type: 'fracture', open: cuts.length > 0, healFactor: slowest(hits.filter(rigid).filter(h => rate(h) != null), 1000) }, rng));
    }
    // Venom enters when the bite breaks the skin, cut or smashed (§5.2) [ASSUMED: DF fangs rarely cut by the edge test].
    if (inject && !target.venom && r.tested.some(x => /SKIN/.test(x.layer.tissue) && x.result !== 'held')) {
        const b = baseVenom(ac.id), bc = b && b !== ac.id ? creature(b) : null, scale = bc?.size ? ac.size / bc.size : 1;
        const v = envenom(ac.id, target.mass, () => gauss(rng), scale) ?? (symptoms(ac).length ? { species: ac.id, kind: 'df', fatal: false, min: 0 } : null);
        const immune = { pain: 'NOPAIN', dizziness: 'NO_DIZZINESS', fever: 'NO_FEVERS', nausea: 'NONAUSEA', paralysis: 'PARALYZEIMMUNE' };
        if (v) {
            v.symptoms = symptoms(ac).filter(e => !(immune[e.kind] && has(target, immune[e.kind])));
            v.part = part.name;
            target.venom = v;
        }
    }
    checkDeath(target);
    const ko = !target.dead && part.flags.includes('HEAD') && !r.first.edged && reaches('koMomentum', r.first.M);
    if (ko && !target.unconscious && !has(target, 'NOSTUN')) {
        target.unconscious = 'knocked out';
        target.koLeft = outFor(k('koMedianMin'), rng);
    }
    const parts = [...new Set(r.tested.map(t => t.part))];
    const layers = parts.map((pt) => `${pt.name}: ${r.tested.filter(t => t.part === pt).map(t => `${t.layer.tissue.toLowerCase()} ${t.result}`).join(', ')}`).join('; ');
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
    if (!c?.parts.some(x => x.cats.includes('NECK') || x.flags.includes('THROAT')))
        return 'No neck to choke.';
    if (holder && abilities(holder).grasp === 0)
        return 'The holder\'s hands are out of action for a choke.';
    if (p.dead)
        return 'Already dead.';
    const s = Math.max(0, Number(seconds) || 0);
    const at = between(rng, CHOKE_LOC_S);
    if (s >= APNEA_DEATH() * 60) {
        p.dead = 'strangulation';
        return `Choke held ${s} s: dead (strangulation).`;
    }
    if (s >= at) {
        p.unconscious = 'choked';
        p.koLeft = outFor(k('chokeMedianMin'), rng);
        return `Choke held ${s} s: unconscious at ${round(at)} s.`;
    }
    return `Choke held ${s} s: still conscious (would black out at ${round(at)} s).`;
}
// Weight follows the food deficit (Hall et al. 2011, Lancet 378:826; Hall 2010, Am J Physiol Endocrinol Metab 298:E449). The
// deficit is drawn first from glycogen: 500 g at 4.18 kcal/g, each gram held with 2.7 g of water (Hall 2010 Table 1), so the
// first 2,090 kcal take 1.85 kg [ASSUMED order: in fact it runs down over the first day or two alongside fat]. Past that, of
// each kg lost the share 10.4 ÷ (10.4 + fat kg) is lean (Forbes's curve, as Hall 2008 used it, Int J Obes 32:573), at 7.6 MJ/kg
// for lean and 39.5 MJ/kg for fat (Hall 2008): a lean person loses more weight per kcal and more of it muscle. Fat at the start
// from BMI, age and sex: % = 1.39 BMI + 0.16 age − 10.34 (men) − 9 (Jackson et al. 2002, Int J Obes 26:789, the equation Hall
// 2010 used). Eating restores glycogen first (refeeding refills it within a day), then fat and lean by the same partition at the
// same densities; food beyond the day's need is kept as a surplus that later spending draws on first, and while it stands the
// body gains by the same path [ASSUMED: Hall's small synthesis costs, 0.18 kcal/g fat and 0.86 kcal/g protein, left out].
// Humans only. Starvation also kills at the body's own limit: men die at a BMI of about 13 (CV 8.7 %), women about 11 (CV
// 14 %), drawn once per person (Henry 2001, Nutrition Bulletin 26:205, as summarised by ENN Field Exchange 15), whichever
// comes first with the deficit clock (40–60 resting days).
def({ id: 'glycogenG', value: 500, unit: 'g of body glycogen when fed', status: 'sourced', src: 'Hall 2010, Am J Physiol Endocrinol Metab 298:E449, Table 1', range: [300, 700], file: 'body-engine.ts' });
def({ id: 'forbesC', value: 10.4, unit: 'kg (lean share of weight change = C ÷ (C + fat kg))', status: 'sourced', src: 'Forbes 1987, as used by Hall 2008, Int J Obes 32:573', range: [8, 13], file: 'body-engine.ts' });
const RHO_LEAN = 7.6e3 / 4.184, RHO_FAT = 39.5e3 / 4.184, RHO_GLY = 4.18, H2O_GLY = 2.7;
/** Fat mass, kg, of an adult from mass, height, age and sex (Jackson et al. 2002). */
export function fatKgOf(p) {
    const f = p.sex === 'female', ht = (p.heightCm ?? (f ? 162.6 : 175.5)) / 100, bmi = p.mass / ht ** 2;
    const pct = Math.min(60, Math.max(3, 1.39 * bmi + 0.16 * (p.age ?? 25) - (f ? 0 : 10.34) - 9));
    return p.mass * pct / 100;
}
/** The BMI at which this person dies of starvation, drawn once (Henry 2001). */
export function lethalBmi(p, rng) {
    const f = p.sex === 'female', m = f ? 11 : 13, cv = f ? 0.14 : 0.087;
    return p.stores?.lethalBmi ?? Math.max(8, m * (1 + cv * gauss(rng)));
}
/** Moves body mass to match the energy balance on record: the deficit less any surplus (see above). */
export function settleMass(p) {
    const n = p.needs;
    if (!n || (p.species && !/^human$/i.test(p.species)))
        return;
    const net = n.kcal - (n.surplus ?? 0);
    if (!p.stores) {
        if (Math.abs(net) < 1e-9)
            return;
        p.stores = { mass0: p.mass, fatKg: fatKgOf(p), glycogenG: k('glycogenG'), applied: 0 };
    }
    const s = p.stores;
    const d = net - s.applied;
    if (Math.abs(d) < 1e-9)
        return;
    s.applied = net;
    const g0 = k('glycogenG');
    // Glycogen moves first both ways; past it, fat and lean.
    const glyStep = (kcal) => {
        const g = Math.max(-s.glycogenG, Math.min(g0 - s.glycogenG, -kcal / RHO_GLY));
        s.glycogenG += g;
        p.mass += g * (1 + H2O_GLY) / 1000;
        return kcal + g * RHO_GLY;
    };
    let left = glyStep(d);
    for (let i = 0; i < 400 && Math.abs(left) > 1e-6; i++) {
        const lean = k('forbesC') / (k('forbesC') + Math.max(0.5, s.fatKg)), rho = lean * RHO_LEAN + (1 - lean) * RHO_FAT;
        const kg = Math.sign(left) * Math.min(Math.abs(left), 500) / rho;
        p.mass -= kg;
        s.fatKg = Math.max(0.5, s.fatKg - (1 - lean) * kg);
        left -= kg * rho;
    }
    if (Math.abs(net) < 1e-6 && s.glycogenG >= g0 - 1e-6 && Math.abs(p.mass - s.mass0) < 0.05) {
        p.mass = s.mass0;
        delete p.stores;
    }
}
/** Drinking and eating: water in L, food energy (kcal, or from its composition, §6.19; alcohol 7 kcal/g), taken off the
 * deficits (never below 0). Returns a note when the stated energy contradicts the composition. */
export function intake(p, a = {}) {
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    // The drink goes to the stomach, to be absorbed over the next hour (advance); with a meal, less of it reaches the blood.
    // A meal is food, not the drink's own energy (7 kcal per g of alcohol).
    const meal = reaches('mealKcal', (foodEnergy(a).kcal ?? 0) - 7 * Math.max(0, Number(a.alcohol_g) || 0));
    if (meal)
        p.needs.sinceMeal = 0;
    const dose = bacOfGrams(p, Math.max(0, Number(a.alcohol_g) || 0));
    if (dose > 0)
        p.needs.gut = (p.needs.gut ?? 0) + dose * ((p.needs.sinceMeal ?? Infinity) < k('fedWindowMin') ? k('fedBioavailable') : 1);
    p.needs.waterL = Math.max(0, p.needs.waterL - Math.max(0, Number(a.water_l) || 0));
    const e = foodEnergy(a);
    // Food beyond the deficit is kept as a surplus (settleMass).
    const extra = Math.max(0, e.kcal - p.needs.kcal);
    p.needs.kcal = Math.max(0, p.needs.kcal - e.kcal);
    if (extra > 0)
        p.needs.surplus = (p.needs.surplus ?? 0) + extra;
    settleMass(p);
    return e.note;
}
/** Listener hearing for acoustics.js: { shift, deaf } (species threshold, one of two ears lost +3 dB, bands out of range). */
function earOf(l, lc) {
    const ears = lc.parts.filter(x => x.flags.includes('HEAR')), earsOk = ears.filter(worksFn(l, lc)).length;
    const h = hearingOf(l.species);
    const deaf = h?.lo ? BAND_HZ.map((f, i) => f < h.lo || f > (h.hi ?? Infinity) ? i : -1).filter(i => i >= 0) : [];
    const one = ears.length > 1 && earsOk < ears.length ? 3 : 0;
    return { shift: bandShift(l.species).map(x => x + one), deaf, earsOk, ears: ears.length };
}
/** Whether `vs` sees a target of smallest dimension `size_m` at `distance_m` (§6.2): one roll against the Johnson
 * probabilities; returns the deepest level reached (identified ⊂ recognized ⊂ detected). */
export function look(vs, v, { size_m = 0.5, distance_m = 10, light = 'daylight', lightLabel = null, visibility_m = 20000, contrast = 1, seconds = 0, contrastLabel = null } = {}, rng = Math.random) {
    const vc = creatureOf(v);
    if (!vc)
        return 'Creature data is still loading.';
    if (v.dead || v.unconscious)
        return `${vs} is ${v.dead ? 'dead' : 'unconscious'}.`;
    const eyes = vc.parts.filter(x => x.flags.includes('SIGHT'));
    if (eyes.length && !eyes.some(worksFn(v, vc)))
        return `${vs} is blind (eyes out of action).`;
    const r = see({ size: size_m, distance: distance_m, light, visibility: visibility_m, contrast, seconds, acuityFactor: acuityOf(v.species) * (!v.species || /^human$/i.test(v.species) ? ageAcuity(v.age) : 1) });
    const u = rng();
    const what = `${size_m} m target at ${distance_m} m, ${lightLabel ?? light}${visibility_m < 20000 ? `, visibility ${visibility_m} m` : ''}${contrastLabel ? `, ${contrastLabel}` : ''}${seconds >= 12 ? `, ${Math.round(seconds)} s of looking` : ''}`;
    const level = u < r.identify ? 'identifies it (can tell which individual or exact kind)' : u < r.recognize ? 'recognizes what kind of thing it is (a person, a horse); which one stays unclear'
        : u < r.detect ? 'notices something there; what it is stays unclear' : 'misses it';
    return `${vs} ${level} (${what}).`;
}
/**
 * Holding a load by the hands (§6.19): hanging by the hands (load = own body mass) or carrying something by handles. Holds
 * when the per-hand load ≤ grip strength × the hand's working capacity (grasp ability, cold forearm force factor). Humans only
 * (Dodds 2014 norms); hands counted from working GRASP parts.
 */
// Fingertips on an edge: four-fingertip force against grip, non-climbers 309 / 440 N, recreational climbers 359 / 445 N,
// elite climbers 447 / 526 N (Grant et al. 1996, J Sports Sci 14:301, 30 men, means adjusted for body mass; fingertips right
// hand, grip left hand).
export const CLIMBERS = ['no', 'recreational', 'expert'];
const FINGERTIP_SHARE = { no: 309 / 440, recreational: 359 / 445, expert: 447 / 526 };
export function holdLoad(who, p, { load_kg = null, hands = 2, hanging = false, seconds = null, fingertips = false, climber = 'no' } = {}, rng = Math.random) {
    if (!thermalCapable(p.species))
        return `${who}: grip norms exist for humans only; use BodyCheck.`;
    if (p.dead || p.unconscious)
        return `${who} is ${p.dead ? 'dead' : 'unconscious'}: the hands hang slack.`;
    const c = creatureOf(p), works = worksFn(p, c);
    const n = Math.min(hands, c.parts.filter(x => x.flags.includes('GRASP') && works(x)).length);
    if (!n)
        return `${who}'s hands are out of action.`;
    const g = grip(p, () => gauss(rng)) * forceFactor(limbCold(p, 'arm')) * (fingertips ? FINGERTIP_SHARE[climber] ?? FINGERTIP_SHARE.no : 1);
    const load = hanging ? p.mass : load_kg ?? 0, per = load / n;
    const norm = gripNorm(p.age, p.sex, p.region ?? null);
    const cold = forceFactor(limbCold(p, 'arm')) < 1 ? ', hands weakened by cold' : '';
    const hand = `${n === 1 ? 'one hand' : `${n} hands`}${fingertips ? ', fingertips only' : ''}${cold}`;
    console.debug?.('[Rules engine]', who, `${round(per)} kg per hand; grip ${round(g)} kg; norm ${round(norm.mean)} ± ${round(norm.sd)} kg`);
    if (per > g)
        return `${who} loses hold: too heavy for ${p.sex === 'female' ? 'her' : 'his'} grip (${hand}).`;
    // Hold time at a share f of maximal grip: ET = 33.55 f^−1.61 s (grip power model, Frey Law & Avin 2010, Ergonomics 53:109,
    // Table 2, meta-analysis of static endurance; R² 0.748).
    const et = 33.55 * Math.max(0.05, per / g) ** -1.61;
    if (seconds != null)
        return `${who} ${et >= seconds ? `holds it for the ${seconds} s` : `lets go after ${round(et)} s: the grip tires`} (${hand}).`;
    return `${who} holds it, for about ${round(et)} s before the grip gives out (${hand}).`;
}
// Running speed (§6.7): the creature's fastest DF walking gait [RAW]; DF gait value v (ticks per 100 tiles) → km/h = 8775 ÷ v,
// the constant matching the speeds written beside the gait variations in the DF raws (human 225 → 39 km/h, dog 149 → 59, horse
// 125 → 70). × the share of working legs (stance) [ASSUMED proportional]; no legs → 0.
// Humans: flying 20 m sprint of untrained adults, 3.6 ± 0.4 s for 149 women and 2.9 ± 0.3 s for 84 men, mean age 43
// (Manderoos 2020, Univ. Helsinki doctoral thesis, Study II, Table 4): 20.0 ± 2.2 and 24.8 ± 2.6 km/h (SD by the delta
// method). Each person keeps one draw (runZ); sex unknown takes the mean.
const HUMAN_RUN = { female: { mean: 20.0, sd: 2.2 }, male: { mean: 24.8, sd: 2.6 } };
// Age: World Masters Athletics 100 m age factors (2023 edition, five-year table): the best time at an age is the open best ÷
// the factor, so speed scales with it; 1 up to 35, linear between the listed ages. The sample's mean age 43 is the base
// [ASSUMED: untrained people decline with age as the age records do]; under 18, childSpeedShare below.
const AGES = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110];
const AGE_100M = {
    female: [1, .9810, .9441, .9080, .8726, .8379, .8038, .7705, .7377, .7040, .6590, .6011, .5302, .4464, .3497, .2400],
    male: [.9999, .9668, .9345, .9031, .8726, .8429, .8139, .7858, .7584, .7317, .6946, .6396, .5666, .4757, .3669, .2400],
};
function ageFactor(sex, age) {
    const f = AGE_100M[sex] ?? AGE_100M.female.map((x, i) => (x + AGE_100M.male[i]) / 2);
    if (age <= AGES[0])
        return f[0];
    if (age >= AGES[AGES.length - 1])
        return f[f.length - 1];
    const i = AGES.findIndex(a => a > age) - 1;
    return f[i] + (f[i + 1] - f[i]) * (age - AGES[i]) / 5;
}
export function topSpeedKmh(p, rng = Math.random) {
    const c = creatureOf(p);
    const g = c?.gaits?.filter(x => x.type === 'WALK') ?? [];
    if (!g.length || p.dead || p.unconscious)
        return 0;
    const st = abilities(p).stance ?? 1;
    if (p.species === 'HUMAN') {
        // Body fat and sprint time correlate r = 0.50 (20 m, 23 male college soccer players: Ishida, Travis & Stone 2021,
        // J Funct Morphol Kinesiol 6:7); within 12 elite female sprinters followed 5–10 years, partial r = 0.46–0.50 (abstract,
        // authors not on record). BMI stands for body fat [ASSUMED]: speed z = −0.5 BMI z + √0.75 × own draw, when BMI z is known.
        p.runZ ??= Math.max(-3, Math.min(3, p.bmiZ == null ? gauss(rng) : -0.5 * p.bmiZ + Math.sqrt(0.75) * gauss(rng)));
        const n = HUMAN_RUN[p.sex ?? ''] ?? { mean: (20.0 + 24.8) / 2, sd: (2.2 + 2.6) / 2 };
        // Under 18: the 18-year-old's speed × the measured share of it at that age (childSpeedShare); before, a child ran as fast
        // as the 43-year-old the norms are set at.
        const age = p.age != null && p.age >= 18 ? ageFactor(p.sex ?? '', p.age) / ageFactor(p.sex ?? '', 43)
            : p.age != null ? ageFactor(p.sex ?? '', 18) / ageFactor(p.sex ?? '', 43) * childSpeedShare(p.age) : 1;
        return Math.max(3, (n.mean + p.runZ * n.sd) * age) * st;
    }
    return 8775 / Math.min(...g.map(x => x.max)) * st;
}
// Top running speed of children and adolescents: boys' peak speed in a 100 m sprint, 117 German schoolboys (Bleeker & Siener
// 2025, Front Sports Act Living 7:1701476, Table): 22.55, 23.64, 26.70, 28.37, 29.70 km/h at mean ages 10.9, 12.6, 14.5, 16.5,
// 18.2; as shares of the 18.2-year-old's, 0.759, 0.796, 0.899, 0.955, 1. Girls take the same shares of their own adult speed
// [ASSUMED: no girls' series found]; below 10.9 the share falls on with the slope between 10.9 and 12.6 (0.022 a year), held at
// age 3 [ASSUMED extrapolation].
const CHILD_RUN = [[10.9, 22.55 / 29.70], [12.6, 23.64 / 29.70], [14.5, 26.70 / 29.70], [16.5, 28.37 / 29.70], [18.2, 1]];
export function childSpeedShare(age) {
    const a = Math.max(3, age);
    if (a >= 18.2)
        return 1;
    if (a <= CHILD_RUN[0][0]) {
        const [a0, s0] = CHILD_RUN[0], [a1, s1] = CHILD_RUN[1];
        return s0 - (s1 - s0) / (a1 - a0) * (a0 - a);
    }
    const i = CHILD_RUN.findIndex(([x], j) => a >= x && a <= CHILD_RUN[j + 1][0]);
    const [x0, y0] = CHILD_RUN[i], [x1, y1] = CHILD_RUN[i + 1];
    return y0 + (y1 - y0) * (a - x0) / (x1 - x0);
}
// Who can swim (World Risk Poll 2019, Lloyd's Register Foundation and Gallup, over 150,000 people aged 15 and over in 142
// countries, "Are you able to swim without any assistance at all?", as reported by Gallup 2021): worldwide men 57 %, women 32 %;
// men and women in Northern and Western Europe 89 and 85 %, Australia and New Zealand 90 and 85, Central Asia 79 and 31, Latin
// America and the Caribbean 71 and 33. Saying so is more than doing it: of the 80 % of US adults who said they could swim, 56 %
// could do all five water-safety skills (American Red Cross 2014), so each share × 0.56 [ASSUMED: the US ratio everywhere];
// the US itself 46 % (both skills surveys). Countries outside those regions take the world's shares; the poll is of 2019 and
// earlier centuries take it too [ASSUMED].
const SWIM_REGION = [
    [/^(united kingdom|england|scotland|wales|ireland|france|germany|netherlands|belgium|luxembourg|switzerland|austria|denmark|norway|sweden|finland|iceland)/i, 0.89, 0.85],
    [/^(australia|new zealand)/i, 0.90, 0.85],
    [/^(kazakhstan|kyrgyzstan|tajikistan|turkmenistan|uzbekistan)/i, 0.79, 0.31],
    [/^(mexico|guatemala|honduras|el salvador|nicaragua|costa rica|panama|cuba|haiti|dominican republic|jamaica|trinidad|colombia|venezuela|ecuador|peru|bolivia|brazil|paraguay|uruguay|argentina|chile)/i, 0.71, 0.33],
];
def({ id: 'swimSkillsShare', value: 0.56, unit: 'share of those who say they can swim who can do the five water-safety skills', status: 'assumed', src: 'the US figure (American Red Cross 2014) taken for every country', range: [0.4, 0.75], file: 'body-engine.ts' });
export function swimShare(sex, country) {
    const c = String(country ?? '').trim();
    if (/^united states/i.test(c))
        return 0.46;
    const r = SWIM_REGION.find(([re]) => re.test(c)), [m, w] = r ? [r[1], r[2]] : [0.57, 0.32];
    return k('swimSkillsShare') * (sex === 'female' ? w : sex === 'male' ? m : (m + w) / 2);
}
/** A chase over open ground: does the pursuer catch the one fleeing, starting `gap_m` apart, both at full speed? */
export function chase(pn, pursuer, fn, fleeing, gap_m, rng = Math.random) {
    const vp = topSpeedKmh(pursuer, rng) / 3.6, vf = topSpeedKmh(fleeing, rng) / 3.6;
    const lame = (q) => (abilities(q).stance ?? 1) < 1 ? ', slowed by injured legs' : '';
    console.debug?.('[Rules engine]', `${pn} ${round(vp * 3.6)} km/h, ${fn} ${round(vf * 3.6)} km/h`);
    if (vp <= vf)
        return `${fn} gets away: ${fn} runs as fast as ${pn} or faster${lame(pursuer)}.`;
    return `${pn} catches ${fn} after ${round(gap_m / (vp - vf), 1)} s, ${round(vp * gap_m / (vp - vf))} m run: ${pn} is faster${lame(fleeing)}.`;
}
/** Chance that `l` hears a sound of `spl` dB at 1 m from `distance` m over `noiseDb` (their ears and species), 0 when deaf. */
export function hearChance(l, { spl, distance, barrier = 'none', noiseDb = 25 }) {
    const lc = creatureOf(l);
    if (!lc || l.dead || l.unconscious)
        return 0;
    const ear = earOf(l, lc);
    if (ear.ears && !ear.earsOk)
        return 0;
    return hearSound({ spl, distance, barrier, noiseDb, ...ear, air: l.env ? { tC: l.env.tdb, rh: l.env.rh } : undefined }).p;
}
/** Whether `ls` hears a sound (preset `sound` or `spl_db` at 1 m) at `distance` m (§6.2). */
export function listen(ls, l, { sound = undefined, spl_db = null, distance = 1, noise = 'quiet room (25 dB)', noise_db = null, barrier = 'none', way = undefined } = {}, rng) {
    const lc = creatureOf(l);
    if (!lc)
        return 'Creature data is still loading.';
    if (l.dead || l.unconscious)
        return `${ls} is ${l.dead ? 'dead' : 'unconscious'}.`;
    const spl = spl_db ?? (sound ? SOUNDS[classOf(SOUNDS, sound) ?? ''] : undefined);
    if (spl == null)
        return `Unknown sound "${sound}". Known: ${Object.keys(SOUNDS).join(', ')}; or give spl_db at 1 m.`;
    const ear = earOf(l, lc);
    if (ear.ears && !ear.earsOk)
        return `${ls} is deaf (ears out of action).`;
    const air = l.env ? { tC: l.env.tdb, rh: l.env.rh } : undefined;
    const r = hearSound({ spl, distance, barrier, noise, noiseDb: noise_db, ...ear, air, way });
    const what = `${sound ?? `${spl} dB at 1 m`} at ${distance} m, ${noise}${barrier !== 'none' ? `, through ${barrier}` : ''}`;
    console.debug?.('[Rules engine]', ls, `margin ${r.margin} dB, chance of hearing ${r.p}`);
    // With a draw (the tool passes the engine's seeded one) the chance is Φ(margin ÷ σ); without, the margin's sign decides.
    const heard = rng ? rng() < r.p : r.audible;
    return heard ? `${ls} hears it${distance >= 170 ? `, ${Math.round(distance / soundSpeed(l.env?.tdb ?? 10) * 10) / 10} s after it is made` : ''} (${what}).` : `${ls} misses it: too faint over the background (${what}).`;
}
/** Species whose speech the world book sets against the DF raws (trolls that talk), by DF creature id. */
export const SPEECH_OVERRIDE = {};
export function communicate(sp, s, ls, l, { means = 'speech', lit = true, languages = [null, null], distance = 1, effort = 'normal', noise = 'quiet room (25 dB)', noise_db = null, barrier = 'none', louder_db = 0, brazil = false, way } = {}) {
    const sc = creatureOf(s), lc = creatureOf(l);
    if (!sc || !lc)
        return 'Creature data is still loading.';
    const talks = (c) => SPEECH_OVERRIDE[c.id] ?? (c.flags.includes('CAN_SPEAK') || c.flags.includes('INTELLIGENT'));
    const anyWorks = (p, c, test) => { const parts = c.parts.filter(test); const w = worksFn(p, c); return parts.length ? parts.some(w) : null; };
    const flag = (f) => (x) => x.flags.includes(f);
    if (l.dead || l.unconscious)
        return `${ls} is ${l.dead ? 'dead' : 'unconscious'}.`;
    if (means === 'gesture') {
        if (anyWorks(l, lc, flag('SIGHT')) === false || !lit)
            return `${ls} misses the gesture (${!lit ? 'too dark' : 'eyes out of action'}).`;
        return `${ls} sees the gesture${talks(lc) ? '' : `; it reads posture and movement as its species does (${lc.name}: a speechless species)`}.`;
    }
    if (s.dead || s.unconscious)
        return `${sp} is ${s.dead ? 'dead' : 'unconscious'}: silent.`;
    if (!talks(sc))
        return `${sp} makes its species' own sounds (${sc.name}: a speechless species).`;
    if (anyWorks(s, sc, flag('BREATHE')) === false)
        return `${sp} is voiceless: breath stopped.`;
    if (anyWorks(s, sc, flag('MOUTH')) === false)
        return `${sp}'s speech is unintelligible: mouth not working.`;
    const slurred = anyWorks(s, sc, x => x.cats.includes('TONGUE')) === false;
    if (anyWorks(l, lc, flag('HEAR')) === false)
        return `${ls} is deaf to it (ears out of action).`;
    // Distance, background noise and walls (§4.3 Speech Intelligibility Index): one working ear of two hears 3 dB worse
    // (binaural summation); bands outside the species' 60-dB range are not heard.
    const r = reach({ effort, raise: /whisper/.test(effort) ? 0 : louder_db, distance, barrier, noise, noiseDb: noise_db, ...earOf(l, lc), air: l.env ? { tC: l.env.tdb, rh: l.env.rh } : undefined, way });
    l.heard = { from: sp, snr: r.snr, whisper: /whisper/.test(effort) };
    const where = `${/whisper/.test(effort) ? effort : `${effort} voice`} at ${distance} m, ${noise_db ?? noise}${barrier !== 'none' ? `, through ${barrier}` : ''}`;
    if (!r.audible)
        return `${ls} goes on as before; ${sp}'s voice is lost in the background (${where}).`;
    console.debug?.('[Rules engine]', ls, `words ${Math.round(r.words * 100)} %, SII ${r.sii}`);
    if (r.words < 0.2)
        return `${ls} hears ${sp}'s voice; the words are lost in the noise (${where}).`;
    if (!talks(lc))
        return `${ls} hears the sounds and their tone; words are beyond its species (${lc.name}: a speechless species).`;
    const [a, b] = languages;
    let words = r.words, related = '';
    if (a?.length && b?.length && !a.some(x => b.includes(x))) {
        // A related language the listener knows carries part of the words (intelligibility.ts).
        const rel = relatedShare(b, a, brazil);
        if (!rel)
            return `${ls} hears speech in a language foreign to it (${a.join(', ')}); tone and gestures carry.`;
        words *= rel.share;
        related = `; ${rel.heard} understood through ${rel.from}`;
    }
    // Share of key words → plain words (bands [ASSUMED]): the narrator gets how much of the message carries, not a figure.
    const heard = words >= 0.95 ? 'every word' : words >= 0.7 ? 'most words; a few are lost' : words >= 0.4 ? 'some words; the gist only' : 'scattered words; the meaning is lost';
    return `${ls} hears ${sp} and makes out ${heard} (${where}${related})${slurred ? '; slurred (tongue out of action): short, simple words carry' : ''}.`;
}
// Interruptions (NetHack occupations, Pathos Interrupt): time stops at the first change in anyone's condition.
const waterStage = (p) => { const pct = p.needs ? p.needs.waterL / p.mass * 100 : 0; return pct >= 8 ? 3 : pct >= 5 ? 2 : pct >= 2 ? 1 : 0; };
const watch = (p) => ({
    dead: p.dead, cls: bloodClass(p), dying: p.deathIn !== null, out: p.unconscious ?? null, thirst: waterStage(p),
    exhausted: !!p.exhausted, ams: !!p.altitude?.ams, oedema: !!p.altitude?.oedema,
    heat: coreStage(p.thermal?.stageCore ?? p.thermal?.core), core: p.thermal?.core, swim: !!p.swimFailed, frost: p.wounds.filter(w => w.type === 'frostbite').map(w => w.part),
    infected: p.wounds.filter(w => w.infection === true).map(w => w.id), sepsis: !!p.sepsis, peritonitis: !!p.peritonitis,
});
const levels = (p) => ({ loss: lossFraction(p), hb: p.co?.hb ?? 0, water: p.needs ? p.needs.waterL / p.mass * 100 : 0, work: p.needs?.work ?? 0, core: p.thermal?.stageCore ?? p.thermal?.core ?? 37 });
const UP = { loss: [0.15, 0.3, 0.4], hb: [0.3, 0.4], water: [2, 5, 8], work: [1], core: [40] };
const DOWN = { core: [35, 32, 28, 24] };
function crossing(a, b) {
    let f = 1;
    for (const key of Object.keys(a)) {
        for (const t of UP[key] ?? [])
            if (a[key] < t && b[key] >= t)
                f = Math.min(f, (t - a[key]) / (b[key] - a[key]));
        for (const t of DOWN[key] ?? [])
            if (a[key] >= t && b[key] < t)
                f = Math.min(f, (a[key] - t) / (a[key] - b[key]));
    }
    return f;
}
function changes(who, a, b) {
    const out = [];
    if (b.dead && !a.dead)
        out.push(`${who} dies (${b.dead})`);
    else {
        if (b.cls > a.cls)
            out.push(`${who} reaches blood-loss class ${['I', 'II', 'III', 'IV'][b.cls - 1]}`);
        if (b.dying && !a.dying)
            out.push(`${who} is dying`);
        if (a.out && !b.out)
            out.push(`${who} comes to`);
        if (b.thirst > a.thirst)
            out.push(`${who} is ${b.thirst === 3 ? 'severely dehydrated (8 % of body mass)' : b.thirst === 2 ? 'dehydrated (5 % of body mass)' : 'thirsty (2 % of body mass lost)'}`);
        if (!a.out && b.out)
            out.push(`${who} loses consciousness (${b.out})`);
        for (const id of b.infected)
            if (!a.infected.includes(id))
                out.push(`${who}: wound ${id} is infected`);
        if (b.sepsis && !a.sepsis)
            out.push(`${who}: the infection has reached the blood (sepsis)`);
        if (b.peritonitis && !a.peritonitis)
            out.push(`${who}: the gut is opened (peritonitis)`);
        if (b.heat !== a.heat)
            out.push(`${who}: ${b.heat ?? 'core temperature between 35 and 40 °C'} (core ${b.core} °C)`);
        if (b.exhausted && !a.exhausted)
            out.push(`${who} is exhausted and stops working and walking`);
        if (b.ams && !a.ams)
            out.push(`${who} has acute mountain sickness`);
        if (b.oedema && !a.oedema)
            out.push(`${who} has high-altitude pulmonary or cerebral oedema`);
        if (b.swim && !a.swim)
            out.push(`${who}: arms too cold to keep swimming`);
        const frost = b.frost.filter(x => !a.frost.includes(x));
        if (frost.length)
            out.push(`${who}: frostbite on ${frost.join(', ')}`);
    }
    return out;
}
/** Advances everyone minute by minute; stops at the end of the first minute in which a condition changes. */
export function advanceAll(people, minutes, resting = new Set(), rng = Math.random, { active = new Set(), sleeping = new Set(), eachMinute = null } = {}) {
    const total = Math.max(0, Math.round(minutes));
    for (let m = 1; m <= total; m++) {
        eachMinute?.();
        const events = [];
        let frac = 1;
        for (const [who, p] of Object.entries(people)) {
            const before = watch(p), lv = levels(p), ko = p.koLeft;
            advance(p, 1, resting.has(who), rng, { active: active.has(who), sleeping: sleeping.has(who) });
            const ev = changes(who, before, watch(p));
            // A knockout or choke ends when its drawn time runs out, inside the minute (koLeft, minutes).
            const woke = ko != null && ko > 0 && ko <= 1 && p.koLeft == null ? ko : 1;
            if (ev.length) {
                events.push(...ev);
                frac = Math.min(frac, crossing(lv, levels(p)), woke);
            }
        }
        // The event's moment inside the minute: where the first quantity that crossed its threshold crossed it, the quantity taken
        // as changing evenly over the minute [ASSUMED]; events with no such quantity count at the minute's end.
        if (events.length)
            return { elapsed: m - 1 + frac, events };
    }
    return { elapsed: total, events: [] };
}
// Checks: success when capacity ≥ demand (stress–strength interference; IRT normal ogive). `share` = fraction of
// people with the actor's training who succeed unhurt; demand sits where that share of capacities lies above it.
const CAPACITY_CV = 0.19; // Dodds 2014 grip: peak 51 / 31 kg, weak cut 27 / 16 kg = peak − 2.5 SD → SD / mean 0.19
const FORCE_SCORES = ['grasp', 'stance'];
const EXERTION_FAILS_AT = { heavy: 2 }; // blood-loss class II: heavy exertion fails
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
    const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p < 0.02425)
        return tail(Math.sqrt(-2 * Math.log(p)));
    if (p > 1 - 0.02425)
        return -tail(Math.sqrt(-2 * Math.log(1 - p)));
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
const onAlert = (uses) => uses.includes('alertness');
export const ODDS_FACTORS = [
    // Drink and time awake, as the blood alcohol that impairs alike (crashRisk, impairmentBac).
    { id: 'impairment', applies: onAlert, risk: p => crashRisk(impairmentBac(p)), shows: 1.005, name: () => 'impaired alertness' },
    { id: 'concussion', applies: onAlert, risk: p => concussionRisk(p), shows: 1.005, name: () => 'impaired alertness after a concussion' },
    { id: 'work', applies: onAlert, risk: p => workRisk(p), shows: 1.05, name: () => 'hours on the task' },
    { id: 'thirst-attention', applies: onAlert, risk: p => thirstRisk(p, 'attention'), shows: 1, name: () => 'dehydration' },
    // Motor effects of dehydration on hand work that is not an attention task (Wittbrodt & Millard-Stafford 2018).
    { id: 'thirst-motor', applies: (uses, fine) => fine || (uses.includes('grasp') && !onAlert(uses)), risk: p => thirstRisk(p, 'motor'), shows: 1, name: () => 'dehydration' },
    { id: 'climate', applies: onAlert, risk: p => climateRisk(p), shows: 1.01, name: p => p.env && p.env.tdb > 20 ? 'the heat' : 'the cold' },
];
/** Chance of success and the ability that limits it. Non-force abilities between 0 and 1 change nothing yet (OPEN-66). */
export function checkOdds(p, { share, uses = [], exertion = 'none', on_feet = false, timed = false, fine = false }) {
    if (p.dead)
        return { chance: 0 };
    if (p.unconscious)
        return { chance: 0, limit: `unconscious (${p.unconscious})` };
    if (exertion === 'heavy' && p.needs && p.needs.waterL / p.mass * 100 >= 8)
        return { chance: 0, limit: 'dehydration' };
    const cls = bloodClass(p);
    if (cls === 4 || (cls >= 3 && on_feet) || cls >= (EXERTION_FAILS_AT[exertion] ?? 5))
        return { chance: 0, limit: `blood-loss class ${['I', 'II', 'III', 'IV'][cls - 1]}` };
    const scores = abilities(p);
    // Cold limbs lower force capacity (§6.4).
    if (scores.grasp != null)
        scores.grasp *= forceFactor(limbCold(p, 'arm'));
    if (scores.stance != null)
        scores.stance *= forceFactor(limbCold(p, 'leg'));
    // Fine finger work: × finger dexterity at the hand skin temperature (Daanen 2009) (§6.4).
    if (fine && scores.grasp != null)
        scores.grasp *= fineFactor(handSkin(p));
    // Low core temperature slows thinking; accuracy holds given time (Coleshaw et al. 1983). A timed task treats the speed
    // as a capacity with the force spread [ASSUMED].
    if (timed && uses.includes('alertness') && coolCore(p) > 0)
        scores.thinking = thinkSpeed(p);
    // Altitude: heavy exertion is limited by aerobic capacity (§6.6); acute mountain sickness: symptoms that force a reduction
    // in activity (Maggiorini et al. 1998) → heavy exertion fails [ASSUMED].
    if (p.sepsis && exertion === 'heavy')
        return { chance: 0, limit: 'sepsis' };
    // Peritonitis: abdominal rigidity and pain on movement (its defining signs) → heavy exertion fails [ASSUMED].
    if (p.peritonitis && !p.peritonitis.repaired && exertion === 'heavy')
        return { chance: 0, limit: 'peritonitis' };
    if (p.exhausted && exertion !== 'none')
        return { chance: 0, limit: 'exhausted' };
    if (p.altitude && exertion === 'heavy' && (p.altitude.ams || p.altitude.oedema))
        return { chance: 0, limit: 'altitude sickness' };
    if (exertion === 'heavy' && thermalCapable(p.species)) {
        const a = vo2avail(p) / vo2max(p);
        if (a < 1)
            scores.aerobic = a;
    }
    // Heat: no slowing measured at 38.6 °C core (reaction 40 ms faster; Barry et al. 2022, Appl Physiol Nutr Metab 47:261);
    // heat stroke is defined by nervous-system dysfunction (disorientation): attention tasks fail [ASSUMED from the definition].
    if (uses.includes('alertness') && p.env && coreStage(p.thermal?.stageCore ?? p.thermal?.core) === 'heat stroke')
        return { chance: 0, limit: 'heat stroke: disoriented' };
    // Hypothermia II is defined by impaired consciousness (Swiss staging, Brown et al. 2012): attention tasks fail [ASSUMED].
    if (uses.includes('alertness') && p.env && coreStage(p.thermal?.stageCore ?? p.thermal?.core) === 'hypothermia II')
        return { chance: 0, limit: 'hypothermia II: impaired consciousness' };
    const lacking = uses.find(u => u in FUNCTIONS && !(u in scores));
    if (lacking)
        return { chance: 0, limit: `lacking ${lacking}` };
    const used = uses.filter((u) => u in scores);
    // The odds factors that apply, multiplied (ODDS_FACTORS).
    const acting = ODDS_FACTORS.filter(f => f.applies(uses, fine)).map(f => ({ f, r: f.risk(p) }));
    const risk = acting.reduce((x, a) => x * a.r, 1);
    const zero = used.find(u => scores[u] === 0);
    if (zero)
        return { chance: 0, limit: `${zero} out of action` };
    for (const k of ['thinking', 'aerobic'])
        if (k in scores)
            used.push(k);
    const force = used.filter(u => FORCE_SCORES.includes(u) || u === 'thinking' || u === 'aerobic').sort((x, y) => scores[x] - scores[y])[0];
    const s = force ? scores[force] : 1;
    const base = Math.max(0, Math.min(1, Number(share) || 0));
    // Named: each factor past its threshold; when only their product passes, the largest of them.
    const shown = acting.filter(a => a.r > a.f.shows), top = [...acting].sort((x, y) => y.r - x.r)[0];
    const why = [...new Set((shown.length ? shown : top ? [top] : []).map(a => a.f.name(p)))].join('; ');
    const alert = (r, limit) => risk > 1.005
        ? { chance: r >= 1 ? 1 : r / (r + (1 - r) * risk), limit: [limit, why].filter(Boolean).join('; ') }
        : { chance: r, limit };
    const demand = 1 - normInv(Math.min(0.999, base)) * CAPACITY_CV;
    const out = s >= 1 || base === 0 ? alert(base) : alert(normCdf((s - demand) / (s * CAPACITY_CV)), `reduced ${force}`);
    // Hand work under sight with some eyes lost: grasp errors × 4 and grasping 56 % slower with one eye (Mroczkowski &
    // Niechwiej-Szwedo 2021, Exp Brain Res 239:1345, precision reach-to-grasp, 20 people).
    // DF paralysis syndrome (giant cave spider): the body cannot move [RAW CE_PARALYSIS].
    if (p.venom && (uses.includes('grasp') || uses.includes('stance') || exertion !== 'none') && activeSymptoms(p.venom).some(e => e.kind === 'paralysis'))
        return { chance: 0, limit: 'paralysed by venom' };
    // DIZZINESS: "occasional fainting and a general slowdown" → checks on feet fail [ASSUMED].
    if (p.venom && on_feet && activeSymptoms(p.venom).some(e => e.kind === 'dizziness'))
        return { chance: 0, limit: 'dizzy from venom' };
    if (uses.includes('sight') && uses.includes('grasp') && scores.sight != null && scores.sight > 0 && scores.sight < 1)
        return { chance: Math.max(0, 1 - 4 * (1 - out.chance)), limit: [out.limit, 'sight from one eye only'].filter(Boolean).join('; ') };
    return out;
}
export const checkChance = (p, task) => checkOdds(p, task).chance;
// Tasks a specialist tool decides from data (§7.1): BodyCheck refuses them so the narrator's `share` estimate is not used; the
// tool is read from the task's own verb by its meaning, else from words naming that tool's question (verbs.ts, taskRoute).
export function check(p, task, rng = Math.random) {
    const route = kindRoute(task.task ?? '', task.task_kind, !!task.override);
    if (route)
        return route;
    const { chance, limit } = checkOdds(p, task);
    const ok = rng() < chance;
    console.debug?.('[Rules engine]', task.task, `chance ${round(chance * 100, 2)} %`);
    // The cause is stated either way: an outcome without one invites the narrator to invent it.
    return ok ? `${task.task}: SUCCESS${limit ? `, despite ${limit}` : ''}.`
        : `${task.task}: FAILURE, ${limit ? `because of ${limit}` : 'an ordinary failure: chance alone; the body as it was'}.`;
}
