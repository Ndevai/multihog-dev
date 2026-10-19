import { creature } from './df/index.js';
import { bodyWeapon, itemWeapon, momentum, penetrate, tissueOf, liveLayers, shot, SKILL_LEVELS } from './df/combat.js';
import { weaponOf, metalOf, armorOf, customGearOf, gearMaterialOf, ammoOf } from './df/index.js';
import { sublocationsOf, randomHitPart } from './df/sublocations.js';
import { hearingShift, inRange, hearingOf, bandShift } from './hearing.js';
import { reach, hearSound, SOUNDS, BAND_HZ, SPEECH_SPL, classOf } from './acoustics.js';
import { see, acuityOf } from './vision.js';
import { grip, gripNorm } from './strength.js';
import { endothermMinute } from './thermal/endotherm.js';
import { envenom, baseVenom, symptoms, activeSymptoms } from './venom.js';
import { relativeLoad, mawtHours, vo2max, vo2avail } from './work.js';
import { foodEnergy } from './substance.js';
import { drugMinute, drugStatus } from './drugs.js';
import { def, k } from './constants.js';
import { worldHasMagic } from './world.js';
import type { Creature, Part, Layer, Tissue } from './df/raws.js';
import type { StrikeWeapon, Shot, WornItem, Portion, Style } from './df/combat.js';
import type { Side } from './df/sublocations.js';
import type { Rng, Person, Wound, WoundSpec, WoundType, BurnDepth, Vessel, Net } from './types.js';
import { equivalentAltitude, pressureTorr, aerobicFactor, amsChance, haceChance, hapeChance, HACE_DEATH_H, tucRange } from './thermal/altitude.js';
import type { Clothing } from './thermal/exposure.js';
import type { Effort } from './acoustics.js';
import { relatedShare } from './intelligibility.js';
import { pulseWound } from './pulse.js';
import { thermalCapable, thermalMinute, coreStage, clothingClo, BODY_WIND, immersion, limbCold, forceFactor, speedFactor, NERVE_PER_C, handSkin, fineFactor, burnDose, contactTemp, burnedTBSA } from './thermal/exposure.js';

export const DAY_MIN = 24 * 60;
const HOUR = 60 / DAY_MIN;

const BLEED: Record<Vessel, [number, number]> = { femoral: [300, 600], limb_artery: [70, 170], small: [1, 10] };
const FRACTURE: Record<string, [number, number]> = {
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
const CLOT_MIN: [number, number] = [0, 8];
const INFECTION_DELAY_DAYS = 10.5;
const BRUISE_DAYS: [number, number] = [13, 13];
const NONUNION: Record<string, number> = { default: 0.02, shin: 0.05, wrist: 0.125 };
// Organs, days [function kept, function lost]. Spleen: healed on ultrasound grade 1 at 4–12 weeks, grade 2 at 6–17, grade 3 at
// 6–29 (68 children; Radiology 1999, 212:515); kept = grades 1–2, lost = grade 3; liver and kidney as spleen [ASSUMED]. Lung
// contusion resolves in 5–7 days; lacerations heal in 3–5 weeks (Wikipedia, Pulmonary contusion, Pulmonary laceration).
type HealRow = Record<'cut' | 'blunt', [[number, number], [number, number]]>;
const SOLID: HealRow = { cut: [[28, 119], [42, 203]], blunt: [[28, 119], [42, 203]] };
const ORGAN_HEAL: Record<string, HealRow> = { SPLEEN: SOLID, LIVER: SOLID, KIDNEY: SOLID, LUNG: { blunt: [[5, 7], [5, 7]], cut: [[21, 35], [21, 35]] } };
const OPEN_FRACTURE_INFECTION: Record<string, number> = { I: 0.05, II: 0.08, IIIA: 0.12, IIIB: 0.25, IIIC: 0.40 };
// Rule 576, days. Missing types are OPEN-48/49: they do not close yet.
const CUT_HEAL: Record<string, [number, number]> = { eyes: [3, 5], mouth: [3, 5], head: [7, 10], arm: [7, 10], torso: [10, 14], leg: [10, 14], hand: [10, 14], foot: [10, 14],
    // Suture-removal times: neck 5–7, over a joint 14 days (Trott 2012, as tabled by askmygp.com.au).
    neck: [5, 7], joint: [14, 14] };
const BURN_HEAL: Record<BurnDepth, [number, number] | null> = { superficial: [5, 10], partial: [7, 21], deep_partial: [21, 56], full: null };
// Frostbite (superficial): no healing timetable found; the partial-thickness burn row stands in [ASSUMED proxy].
const FROSTBITE_HEAL = BURN_HEAL.partial;
const INFECTION_ONSET: Record<'bite' | 'other', number> = { bite: 1, other: 10 };
const CROOKED_GRIP = 0.51;
const COST = [0, 40, 64, 107, 178, 297, 495, 825, 1375, 2292];
const FALL_ROWS: [number, number][] = [[12.0, 0.44], [15.6, 0.56], [19.2, 0.78]];
// Abilities = share of working parts with a DF body-part flag (docs/df-body-engine.md §6).
export type Ability = 'grasp' | 'stance' | 'sight' | 'hearing' | 'smell' | 'breathing';
export const FUNCTIONS: Record<Ability, string> = { grasp: 'GRASP', stance: 'STANCE', sight: 'SIGHT', hearing: 'HEAR', smell: 'SMELL', breathing: 'BREATHE' };
// DF part category → rule-576 healing row (cuts) and fracture row.
const CUT_ROW: Record<string, string> = { EYE: 'eyes', EYELID: 'eyes', MOUTH: 'mouth', LIP: 'mouth', TONGUE: 'mouth', TOOTH: 'mouth', HEAD: 'head', NOSE: 'head', EAR: 'head',
    CHEEK: 'head', BODY_UPPER: 'torso', BODY_LOWER: 'torso', BODY: 'torso', ARM_UPPER: 'arm', ARM_LOWER: 'arm', ARM: 'arm', HAND: 'hand', FINGER: 'hand',
    LEG_UPPER: 'leg', LEG_LOWER: 'leg', LEG: 'leg', LEG_FRONT: 'leg', LEG_REAR: 'leg', FOOT: 'foot', FOOT_FRONT: 'foot', FOOT_REAR: 'foot', TOE: 'foot',
    NECK: 'neck', THROAT: 'neck', JOINT: 'joint' };
const BONE_ROW: Record<string, string> = { arm: 'arm', hand: 'arm', leg: 'leg', foot: 'leg' };
const rowOf = (part: Part | null | undefined): string | null => part?.cats?.map(k => CUT_ROW[k]).find(Boolean) ?? null;

const between = (rng: Rng, [a, b]: readonly [number, number]) => a + (b - a) * rng();

/** Deterministic [0, 1) stream from a string seed (FNV-1a hash into mulberry32). */
export function seededRng(seed: unknown): Rng {
    let h = 2166136261;
    for (const ch of String(seed)) h = Math.imul(h ^ ch.codePointAt(0)!, 16777619);
    let a = h >>> 0;
    return () => {
        a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const round = (x: number, d = 1) => Math.round(x * 10 ** d) / 10 ** d;

export function newPerson(massKg = 70, species = 'HUMAN'): Person {
    return {
        species, mass: massKg, lost: 0, red: 0, wounds: [], nextId: 1, dead: null, deathIn: null, minute: 0,
        net: { C: 40, N: 0, R: 40, P: 1, F: 0, E: 0, width: 0, maxToday: false },
    };
}

export const creatureOf = (p: Person | null | undefined): Creature | null => creature(p?.species ?? 'HUMAN');
// DF creature tokens that switch off a need or an effect: NOBREATHE, NO_EAT, NO_DRINK, NO_SLEEP, NOEXERT, NOSTUN, and the
// syndrome immunities NOPAIN, NO_DIZZINESS, NO_FEVERS, NONAUSEA, PARALYZEIMMUNE [RAW].
const has = (p: Person, flag: string) => !!creatureOf(p)?.flags?.includes(flag);

export function person(state: { people?: Record<string, Person> }, who: string, massKg?: number | null, species = 'HUMAN'): Person {
    state.people ??= {};
    if (!state.people[who]) {
        const c = creature(species);
        state.people[who] = newPerson(massKg || (c ? c.size / 1000 : 70), species);
    }
    return state.people[who];
}

export const bloodVolume = (p: Person) => creatureOf(p)?.blood === false ? 0 : p.mass * 70;
// Syverud 1989 (swine, steady femoral bleed 1.0 / 1.25 mL/kg/min): death at 50.2 / 49.8 mL/kg lost.
const LETHAL_LOSS_ML_KG = 50;
export const lossFraction = (p: Person) => bloodVolume(p) ? p.lost / bloodVolume(p) : 0;

// Signs by class of blood loss (Gutierrez, Reines & Wulf-Gutierrez 2004, Crit Care 8:373, Table 1).
const SHOCK_SIGNS = [
    'pulse under 100, blood pressure normal, breathing 14–20/min, mind normal',
    'pulse over 100, blood pressure falling, breathing 20–30/min, anxious',
    'pulse over 120, blood pressure low, breathing 30–40/min, little urine, confused',
    'pulse over 140, blood pressure low, breathing over 35/min, no urine, lethargic',
];
export function bloodClass(p: Person): 1 | 2 | 3 | 4 {
    const f = lossFraction(p);
    return f > 0.4 ? 4 : f >= 0.3 ? 3 : f >= 0.15 ? 2 : 1;
}

export function stage(net: Net) {
    if (net.N >= 13) return { stage: 5, max: 9 };
    if (net.N >= 2) return { stage: 4, max: 9 };
    if (net.N === 1) return { stage: 3, max: 6 };
    return net.C >= 200 ? { stage: 2, max: 3 } : { stage: 1, max: 1 };
}

/** w.part = a DF part of the person's creature. */
export function addWound(p: Person, w: WoundSpec, rng: Rng = Math.random): Wound {
    const row = rowOf(w.part);
    const wound: Wound = { id: p.nextId++, part: w.part.name, pid: w.part.id, type: w.type, bleed: 0, age: 0, cleanedAt: null, infection: null, splinted: false, heals: null, healed: false };
    const organ = w.part.cats.find(k => ORGAN_HEAL[k]);
    const healRange = organ && ['cut', 'puncture', 'bite', 'blunt'].includes(w.type)
        ? ORGAN_HEAL[organ][w.type === 'blunt' ? 'blunt' : 'cut']?.[w.functionLost ? 1 : 0] ?? null
        : w.type === 'blunt' && !w.functionLost ? BRUISE_DAYS
        : ['cut', 'puncture', 'bite', 'blunt'].includes(w.type) || w.functionLost ? CUT_HEAL[row ?? ''] : w.type === 'burn' && w.depth ? BURN_HEAL[w.depth]
        : w.type === 'frostbite' ? FROSTBITE_HEAL : null;
    if (w.type === 'burn') wound.depth = w.depth && BURN_HEAL[w.depth] !== undefined ? w.depth : null;
    // DF HEALING_RATE scales the human days: soft tissue relative to 100, bone relative to 1000 (human templates).
    const factor = w.healFactor ?? 1;
    if (healRange) wound.heals = round(between(rng, healRange) * factor);
    if (w.vessel) wound.vessel = w.vessel;
    if (w.vessel && BLEED[w.vessel] && bloodVolume(p)) wound.bleed = round(between(rng, BLEED[w.vessel]));
    if (w.vessel === 'small' && wound.bleed) wound.clotIn = Math.round(between(rng, CLOT_MIN));
    // Gut or stomach opened: peritonitis. Without surgery 87 % die (penetrating abdominal gunshot wounds, Civil War); after
    // laparotomy 4.5 % (Vietnam) (Manring et al. 2009, Clin Orthop 467:2168); death 1–7 days after the wound [ASSUMED].
    if (['cut', 'puncture', 'bite'].includes(w.type) && w.part.cats.some(k => k === 'GUTS' || k === 'STOMACH') && !p.peritonitis)
        p.peritonitis = { fatal: rng() < 0.87, min: 0, deathMin: Math.round((1 + rng() * 6) * DAY_MIN) };
    if (w.functionLost) wound.functionLost = true;
    if (w.permanent) wound.permanent = true;
    if (w.type === 'severed') wound.severed = true;
    if (w.type === 'fracture') {
        // The skull has no timetable (OPEN-58): joins stays null.
        const joint = w.part.cats.includes('JOINT') && ['wrist', 'ankle', 'hip', 'elbow', 'knee', 'shoulder'].find(j => w.part.name.includes(j));
        const kind = w.part.cats.some(k => k.startsWith('RIB_')) ? 'rib' : w.part.cats.includes('NOSE') ? 'nose'
            : joint ? joint : w.part.cats.includes('SPINE') ? 'spine' : row && BONE_ROW[row] ? `${BONE_ROW[row]}_${w.fracture || 'transverse'}` : null;
        const bone = w.part.cats.includes('LEG_LOWER') ? 'shin' : joint === 'wrist' ? 'wrist' : 'default';
        wound.fracture = { kind, joins: kind ? FRACTURE[kind][0] * factor : null, full: kind ? FRACTURE[kind][1] * factor : null, crooked: false,
            never: kind ? rng() < NONUNION[bone] : false };
        if (w.openGrade && OPEN_FRACTURE_INFECTION[w.openGrade]) wound.openGrade = w.openGrade;
    }
    if (['cut', 'puncture', 'bite', 'burn', 'severed'].includes(w.type) || wound.openGrade || w.open) wound.open = true;
    p.wounds.push(wound);
    return wound;
}

function infectionChance(w: Wound): number {
    if (w.openGrade) return OPEN_FRACTURE_INFECTION[w.openGrade];
    const late = w.cleanedAt === null || w.cleanedAt > 8 * HOUR;
    if (w.type === 'bite') return late ? 0.22 : 0.05;
    return late ? 0.15 : 0.03;
}

// Burn death: revised Baux score = age + % body surface burned (partial or full thickness) (Osler et al. 2010, J Trauma 68:690;
// inhalation injury +17 not modelled); mortality by inverse logit with the score at 50 % = 135, the middle of the 130–140
// reported for well-performing burn units (Wikipedia, Baux score), slope 0.058 per point [ASSUMED, recalled from Osler 2010].
// Re-rolled on the added risk when the burned area grows; death 1–14 days after the burn [ASSUMED timing].
function burnRisk(p: Person, rng: Rng) {
    const pr = 1 / (1 + Math.exp(-0.058 * ((p.age ?? 25) + burnedTBSA(p) + (p.inhalation ? 17 : 0) - 135))), old = p.burnDeath?.p ?? 0;
    if (pr <= old || burnedTBSA(p) === 0) return;
    const b = p.burnDeath ??= { p: 0, fatal: false, min: 0, deathMin: null };
    if (!b.fatal && rng() < (pr - old) / (1 - old)) { b.fatal = true; b.deathMin = b.min + Math.round((1 + 13 * rng()) * DAY_MIN); }
    b.p = pr;
}

/** Skin of the given regions touches `material` at temp_c for `seconds` (Henriques burn dose, §6.4). Returns a report line. */
export function contactBurn(p: Person, regions: string[], material: string, tempC: number, seconds: number, rng: Rng = Math.random): string {
    const ti = contactTemp(material, tempC);
    const segs = immersion(regions);
    const made: Wound[] = [];
    segs.forEach((on, i) => { if (on) for (const b of burnDose(p, i, ti, seconds)) for (const part of frostParts(creatureOf(p), b.seg)) made.push(addWound(p, { part, type: 'burn', depth: b.depth }, rng)); });
    burnRisk(p, rng);
    return `Skin surface at ${round(ti, 1)} °C for ${seconds} s: ${made.length ? `${made.length} ${made[0].depth ?? ''} burn wound(s) on ${[...new Set(made.map(w => w.part))].join(', ')}` : 'no burn'}.`;
}

export type Training = 'untrained' | 'instructions' | 'trained';
export function treat(p: Person, id: number, treatment: string, rng: Rng = Math.random, { training = 'untrained' as Training } = {}): string {
    const w = p.wounds.find(x => x.id === id);
    if (treatment === 'transfuse') { p.lost = 0; p.deathIn = null; return 'Blood volume replaced.'; }
    // Antivenom before death stops a fatal course; breathing returns, consciousness when time passes [ASSUMED].
    // Antibiotics for a bloodstream infection: case fatality 15–50 % (Wikipedia, Staphylococcus aureus), drawn uniform.
    if (treatment === 'antibiotics') {
        if (!p.sepsis) return 'Antibiotics given; no bloodstream infection recorded.';
        if (!p.sepsis.treated) { p.sepsis.treated = true; p.sepsis.fatal = p.sepsis.fatal && rng() < (0.15 + rng() * 0.35) / 0.8; }
        return 'Antibiotics given for the bloodstream infection.';
    }
    if (treatment === 'laparotomy') {
        if (!p.peritonitis) return 'Laparotomy: no opened gut recorded.';
        if (!p.peritonitis.repaired) { p.peritonitis.repaired = true; p.peritonitis.fatal = p.peritonitis.fatal && rng() < 0.045 / 0.87; }
        return 'Laparotomy: the opened gut is repaired.';
    }
    if (treatment === 'oxygen' || treatment === 'hyperbaric_oxygen') {
        if (!p.co) return 'Oxygen given; no carbon monoxide recorded.';
        p.co.o2 = treatment === 'oxygen' ? 'oxygen' : 'hyperbaric';
        return `${treatment === 'oxygen' ? '100 % oxygen' : 'Hyperbaric oxygen'} given: carboxyhaemoglobin half-life ${CO_HALF[p.co.o2 as keyof typeof CO_HALF]} min once out of the gas.`;
    }
    if (treatment === 'antivenom') {
        if (!p.venom) return 'No venom recorded.';
        p.venom.fatal = false;
        if (p.paralysed) { p.paralysed = false; p.apnea = null; }
        return 'Antivenom given: the venom course stops.';
    }
    if (!w) return `No wound ${id}.`;
    // Arterial bleeding on a limb takes a tourniquet (Combat Application Tourniquet), success by training (Bordonaro et al. 2025,
    // Adv Simul 10:57, systematic review of 10 trials): no training 16.3–20.4 % in three studies → 18.35 %; with a just-in-time
    // instruction card 44.14 % (Goolsby et al. 2015, inside the review's 21.9–69.8 % for point-of-care aids); formal bleeding-
    // control training 87.7 % and 92.2 % → 90 %. A failed attempt leaves the bleeding; it can be tried again. Other bleeding: stopped.
    if (treatment === 'stop_bleeding') {
        if ((w.vessel === 'femoral' || w.vessel === 'limb_artery') && w.bleed > 0) {
            const pr = ({ untrained: 0.1835, instructions: 0.4414, trained: 0.90 } as Record<string, number>)[training] ?? 0.1835;
            if (rng() >= pr) return `Wound ${id}: the bleeding goes on under the tourniquet (applied by someone ${training === 'trained' ? 'trained in bleeding control' : training === 'instructions' ? 'following instructions' : 'untrained'}); still ${w.bleed} mL/min.`;
            w.bleed = 0; return `Wound ${id}: tourniquet on, bleeding stopped.`;
        }
        w.bleed = 0; return `Wound ${id}: bleeding stopped.`;
    }
    if (treatment === 'clean') { w.cleanedAt ??= w.age; return `Wound ${id}: cleaned.`; }
    if (treatment === 'splint') { w.splinted = true; return `Wound ${id}: splinted.`; }
    if (treatment === 'load') {
        if (!w.fracture || (w.fracture.joins ?? 0) <= 0 || w.splinted) return `Wound ${id}: loaded, no added risk.`;
        if (rng() < 0.325) { w.fracture.crooked = true; return `Wound ${id}: bone shifted; it will heal crooked.`; }
        return `Wound ${id}: loaded; bone held.`;
    }
    return `Unknown treatment "${treatment}".`;
}

function endDay(net: Net) {
    const gain = net.E > 0 ? 0.5366 * net.E ** 0.4063 : 0;
    net.width += gain;
    const grown = Math.floor(net.width);
    net.width -= grown;
    net.C += grown;
    if (net.maxToday && net.F >= 1.2 * net.C && net.C >= 4000 * (net.N + 1) && net.N < 12) net.N += 1;
    net.F = 0; net.E = 0; net.maxToday = false;
}

export function advance(p: Person, minutes: number, resting: boolean, rng: Rng = Math.random, { active = false, sleeping = false } = {}): void {
    if (p.dead) return;
    const net = p.net;
    const c = creatureOf(p);
    const needs = !c || c.blood;
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    const n = p.needs;
    const waterDeath = n.waterDeath ??= 15 + 5 * rng();
    const foodDeath = n.foodDeath ??= 40 + 20 * rng();
    // A knockout lasts until story time passes (its length is OPEN-81).
    if (minutes > 0 && (p.unconscious === 'knocked out' || p.unconscious === 'choked')) p.unconscious = null;
    for (let t = 0; t < minutes; t++) {
        checkDeath(p);
        drugMinute(p);
        if (p.apnea != null && ++p.apnea >= APNEA_DEATH()) { p.dead = p.drowning ? 'drowning' : 'suffocation'; return; }
        altitudeMinute(p, rng);
        // Smoke breathed in: inhalation injury, +17 on the burn score (Osler et al. 2010) once any burn exists.
        if (p.env?.smoke && !p.inhalation && !has(p, 'NOBREATHE')) { p.inhalation = true; burnRisk(p, rng); }
        coMinute(p);
        if (p.dead) return;
        if (p.sepsis && ++p.sepsis.min >= p.sepsis.deathMin && p.sepsis.fatal) { p.dead = 'sepsis'; return; }
        if (p.peritonitis && ++p.peritonitis.min >= p.peritonitis.deathMin && p.peritonitis.fatal) { p.dead = 'peritonitis'; return; }
        if (p.burnDeath && ++p.burnDeath.min >= (p.burnDeath.deathMin ?? Infinity) && p.burnDeath.fatal) { p.dead = 'burns'; return; }
        venomMinute(p);
        let heat: { core: number; frozen: string[]; kcal: number; waterL: number; burned?: { seg: string; depth: BurnDepth }[] } | null = null;
        if (p.env && thermalCapable(p.species)) heat = thermalMinute(p, { active, sleeping, restL: WATER_L_DAY.rest / DAY_MIN }, rng, () => gauss(rng));
        else if (p.env && c?.homeotherm) {
            const r = endothermMinute(p, c, { met: p.env.met ?? p.workMet ?? (sleeping ? 0.95 : active ? 3.5 : 1.3) });
            // Stages at the human distances from the set point (−2, −5, −9, −13, +3 °C) [ASSUMED].
            const stageCore = (p.thermal ??= {}).stageCore = round(r.core - r.set + 37, 2);
            heat = { core: stageCore, frozen: [], kcal: r.kcal, waterL: WATER_L_DAY.rest * kleiber(p) / DAY_MIN + r.evapL };
        }
        if (p.env?.water && !thermalCapable(p.species)) water(p, rng);
        if (heat) {
            const st = coreStage(heat.core);
            if (st === 'hypothermia IV') { p.dead = 'hypothermia'; return; }
            // Above the highest core temperature anyone survived, 46.5 °C (Wikipedia, Hyperthermia: 10 July 1980) → dead [ASSUMED ceiling].
            if (heat.core > k('heatDeathCore')) { p.dead = 'hyperthermia'; return; }
            // Heat stroke: survived when core is back under 40 °C within 30 min (PMC11438465); past that, death 26.5 % if
            // exertional, 63.2 % classic (MedLink), 1–3 days later [ASSUMED timing]. The roll stands after cooling.
            if (st === 'heat stroke' || (p.heatStroke?.min ?? 0) >= 30) {
                const hs = p.heatStroke ??= { min: 0, exertional: !!(p.workMet || active) };
                if (++hs.min === 30) { hs.fatal = rng() < (hs.exertional ? 0.265 : 0.632); hs.deathMin = 30 + Math.round((1 + 2 * rng()) * DAY_MIN); }
                if (hs.fatal && hs.min >= (hs.deathMin ?? Infinity)) { p.dead = 'heat stroke'; return; }
            } else p.heatStroke = null;
            if (st === 'hypothermia III') p.unconscious ??= 'hypothermia';
            else if (p.unconscious === 'hypothermia') p.unconscious = null;
            for (const seg of heat.frozen) for (const part of frostParts(c, seg)) addWound(p, { part, type: 'frostbite' }, rng);
            for (const b of heat.burned ?? []) for (const part of frostParts(c, b.seg)) addWound(p, { part, type: 'burn', depth: b.depth }, rng);
            if (heat.burned?.length) burnRisk(p, rng);
            if (thermalCapable(p.species)) water(p, rng);
        }
        if (needs) {
            n.waterL += heat ? heat.waterL : WATER_L_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            n.kcal += heat ? heat.kcal : p.workMet ? p.workMet * 1.163 * p.mass * 60 / 4184 : KCAL_DAY[active ? 'active' : 'rest'] * kleiber(p) / DAY_MIN;
            if (sleeping) {
                if (n.slept === 0) n.debt = Math.max(0, (n.debt ?? 0) + n.awake / 60 - CRITICAL_WAKE_H);
                n.slept += 1;
            } else if (!has(p, 'NO_SLEEP')) {
                if (n.slept >= SLEEP_WAKE_END_MIN) { n.debt = Math.max(0, (n.debt ?? 0) - Math.max(0, n.slept / 60 - SLEEP_NEED_H)); n.awake = 0; }
                n.slept = 0; n.awake += 1;
            }
            // Work done against the maximum acceptable work time (§6.7). At rest or asleep it is paid back as muscle glycogen
            // returns: 5 %/h fed, 2 %/h with over a day's food missing; exhaustion ends at 90 % [ASSUMED].
            // In the water: swimming leisurely 6.0 MET (Compendium of Physical Activities, Ainsworth et al. 2011); keeping afloat by
            // treading water 7.5 MET (VO2 23.2–29.4 mL/kg/min across four techniques in 21 skilled treaders, midpoint; van Duijn
            // et al. 2021, Front Physiol 12:719788), unless held afloat by something.
            const w = p.env?.water, inWater = w && !w.afloat && thermalCapable(p.species);
            const met = p.workMet ?? (inWater ? (w!.swimming ? 6.0 : 7.5) : active ? 3.5 : null);
            if (met && !sleeping && !has(p, 'NOEXERT')) { n.work = (n.work ?? 0) + 1 / 60 / mawtHours(relativeLoad(met, p, () => gauss(rng))); if (n.work >= 1) p.exhausted = true; }
            else if ((n.work ?? 0) > 0) {
                n.work = Math.max(0, n.work! - (n.kcal < KCAL_DAY.rest * kleiber(p) ? 0.05 : 0.02) / 60);
                if (n.work <= 0.9) p.exhausted = false;
            }
            if (n.alcohol) n.alcohol = Math.max(0, n.alcohol - ELIM_PER_MIN);
            if (has(p, 'NO_DRINK')) n.waterL = 0;
            if (has(p, 'NO_EAT')) n.kcal = 0;
            if (n.waterL / p.mass * 100 >= waterDeath) { p.dead = 'dehydration'; return; }
            if (n.kcal >= foodDeath * KCAL_DAY.rest * kleiber(p)) { p.dead = 'starvation'; return; }
        }
        // Limb arteries: the flow Pulse computed for this minute (pulse.ts), while its track lasts; then each such wound keeps
        // its share of Pulse's last flow under the engine's rules.
        let bleeding = p.wounds.reduce((s, w) => s + w.bleed, 0);
        // A stopped bleed (pressure, tourniquet) ends the Pulse track at once.
        if ((p.pulse || p.pulseLast) && !p.wounds.some(pulseWound)) { p.pulse = null; p.pulseLast = null; }
        if (p.pulse && p.pulse.at < p.pulse.track.length) {
            const m = p.pulse.track[p.pulse.at++], ws = p.wounds.filter(pulseWound), own = ws.reduce((s, w) => s + w.bleed, 0);
            bleeding += m.rate - own;
            const { rate: _r, dies, ...vitals } = m; p.pulseLast = vitals;
            for (const w of ws) w.bleed = round(own > 0 ? m.rate * w.bleed / own : m.rate / ws.length, 1);
            if (p.pulse.table && p.pulseTab) p.pulseTab.minute++;
            if (p.pulse.at >= p.pulse.track.length) p.pulse = null;
            // Pulse's irreversible state at the end of a precomputed run is death from blood loss.
            if (dies) { p.lost += bleeding; p.dead = 'blood loss'; return; }
        }
        p.lost += bleeding;
        if (p.lost >= LETHAL_LOSS_ML_KG * p.mass) { p.lost = LETHAL_LOSS_ML_KG * p.mass; p.dead = 'blood loss'; return; }
        // While a Pulse run carries the bleed, Pulse decides when it kills; the class IV timer is for the rules' own bleeds.
        if (bloodClass(p) === 4 && !p.pulse && !(p.pulseTab && p.wounds.some(pulseWound))) {
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
            if (w.fracture && !w.fracture.never && w.fracture.joins !== null) { w.fracture.joins -= 1 / DAY_MIN; w.fracture.full = (w.fracture.full ?? 0) - 1 / DAY_MIN; }
            if (w.heals !== null && !w.healed && w.age >= w.heals) { w.healed = true; w.bleed = 0; }
            if (w.clotIn != null && w.bleed && --w.clotIn <= 0) { w.bleed = 0; w.clotIn = null; }
            const onset = INFECTION_ONSET[w.type === 'bite' ? 'bite' : 'other'];
            if (w.open && w.infection === null && w.age >= onset) {
                w.infection = rng() < infectionChance(w);
                // An infected wound closes 10.5 days later (surgical-site infection adds 10–11 hospital days; StatPearls,
                // Berríos-Torres 2017 — hospital stay as the proxy for healing).
                if (w.infection && w.heals !== null) { w.heals = Math.max(w.heals, w.age) + INFECTION_DELAY_DAYS; w.healed = false; }
                // Bloodstream spread: 8.5 % of adults under 65 hospitalized with skin and soft-tissue infection (Taniguchi et al.
                // 2022, Open Forum Infect Dis 9:ofac317) [as the rate for infected wounds]. Untreated S. aureus bacteraemia
                // killed about 80 % (Wikipedia, Staphylococcus aureus); death within 30 days, uniform [ASSUMED].
                if (w.infection && !p.sepsis && rng() < ((p.age ?? 25) >= 65 ? 0.253 : 0.085)) p.sepsis = { fatal: rng() < 0.8, min: 0, deathMin: Math.round((1 + rng() * 29) * DAY_MIN) };
            }
        }
        if (++p.minute >= DAY_MIN) { p.minute -= DAY_MIN; endDay(net); }
    }
}

export function cast(p: Person, complexity: number): string {
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
// Age: odds of death × 1.05 per year of age (Lapostolle et al. 2005, Crit Care Med 33:1239, multivariate, 287 falls over 3 m),
// centred on the sample's mean age 37.2 (41.6 in the 34 % who died, 34.9 in survivors) [centring ASSUMED].
export function fallDeathChance(height: number, { soft = false, headFirst = false, age }: { soft?: boolean; headFirst?: boolean; age?: number } = {}): number {
    const base = fallBase(height, soft, headFirst);
    if (age == null || !Number.isFinite(age) || base <= 0 || base >= 1) return base;
    const lo = Math.log(base / (1 - base)) + Math.log(1.05) * (age - 37.2);
    return 1 / (1 + Math.exp(-lo));
}
function fallBase(height: number, soft: boolean, headFirst: boolean): number {
    const chances: number[] = [0, ...FALL_ROWS.map(r => r[1]), 1];
    let row = FALL_ROWS.filter(([h]) => height >= h).length;
    if (height > FALL_ROWS.at(-1)![0]) row = chances.length - 1;
    const shifted = headFirst ? Math.min(row + 1, chances.length - 1) : soft ? Math.max(row - 1, 0) : row;
    if (shifted > 0) return chances[shifted];
    if (row > 0 || height < 6) return 0;
    return FALL_ROWS[0][1] * (height - 6) / (FALL_ROWS[0][0] - 6);
}

export function fall(p: Person, height: number, opts: { soft?: boolean; headFirst?: boolean; age?: number } = {}, rng: Rng = Math.random): string {
    const chance = fallDeathChance(height, opts);
    console.debug?.('[Rules engine]', `fall ${height} m: death chance ${Math.round(chance * 1000) / 10} %`);
    if (chance > 0 && rng() < chance) { p.dead = 'fall'; return `Fall ${height} m: dies.`; }
    return `Fall ${height} m: survives. Injuries: narrate, then record with BodyWound.`;
}

/** part → whether it works: no severing, unjoined fracture or lost function on it or above it on its CON chain. */
export function worksFn(p: Person, c: Creature | null = creatureOf(p)): (part: Part) => boolean {
    if (!c) return () => true;
    const down = new Set<string>();
    for (const w of p.wounds) {
        const fr = w.fracture;
        if (w.severed || (fr && (fr.never || fr.joins === null || fr.joins > 0)) || (w.functionLost && (!w.healed || w.permanent))) down.add(w.pid);
    }
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const chain = (part: Part) => { for (let q: Part | undefined = part; q; q = q.parent ? byId[q.parent] : undefined) if (down.has(q.id)) return false; return true; };
    const nerves = c.parts.filter(x => x.flags.includes('NERVOUS') && !chain(x));
    const neck = nerves.some(n => n.parent && byId[n.parent]?.cats.includes('NECK'));
    return part => chain(part) && !(nerves.length && part.flags.includes('STANCE')) && !(neck && part.flags.includes('GRASP'));
}

export type Scores = Partial<Record<Ability | 'thinking' | 'aerobic', number>>;
/** Each ability as the share of the creature's parts with its flag that work; absent when the creature has none. */
export function abilities(p: Person): Scores {
    const c = creatureOf(p);
    if (!c) return {};
    const works = worksFn(p, c);
    const out: Scores = {};
    for (const [name, flag] of Object.entries(FUNCTIONS) as [Ability, string][]) {
        const parts = c.parts.filter(x => x.flags.includes(flag));
        if (parts.length) out[name] = round(parts.filter(works).length / parts.length, 2);
    }
    return out;
}

/** Dies when a THOUGHT part stops working; stops breathing (unconscious) when every BREATHE part stops working. */
function checkDeath(p: Person) {
    const c = creatureOf(p);
    if (!c || p.dead) return;
    const works = worksFn(p, c);
    const brains = c.parts.filter(x => x.flags.includes('THOUGHT'));
    if (brains.length && brains.every(b => !works(b))) { p.dead = 'brain destroyed'; return; }
    const lungs = c.parts.filter(x => x.flags.includes('BREATHE'));
    const apneic = lungs.length > 0 && !c.flags.includes('NOBREATHE') && lungs.every(l => !works(l));
    if (apneic && p.apnea == null) { p.apnea = 0; p.unconscious = 'not breathing'; }
    if (!apneic && p.apnea != null && !p.drowning && !p.paralysed) { p.apnea = null; if (p.unconscious === 'not breathing') p.unconscious = null; }
}

/**
 * °C the core is below 36.7 (humans: JOS-3 core; animals: the same distance below their own set point). Coleshaw et al. 1983
 * (J Appl Physiol 55:27): from 36.7 °C new-information registration and calculation speed fall; at 34–35 °C 70 % of new
 * information is lost and speed is −50 %; recall and accuracy hold. Linear to 34.5 °C, held there below [ASSUMED].
 */
function coolCore(p: Person): number {
    const t = p.env ? p.thermal?.stageCore ?? p.thermal?.core : null;
    return t == null ? 0 : Math.min(2.2, Math.max(0, 36.7 - t));
}
const thinkSpeed = (p: Person) => 1 - 0.5 * coolCore(p) / 2.2;
const keepsNew = (p: Person) => 1 - 0.7 * coolCore(p) / 2.2;

// Frostbite most often strikes cheeks, ears, nose, fingers and toes (Wikipedia "Frostbite", citing McIntosh 2014): when the
// head, a hand or a foot segment's skin freezes, those DF parts take it; other segments freeze as their DF part [ASSUMED].
const SEG_CATS: Record<string, string[]> = { head: ['NOSE', 'EAR', 'CHEEK'], neck: ['NECK'], chest: ['BODY_UPPER'], back: ['BODY_UPPER'], pelvis: ['BODY_LOWER'],
    shoulder: ['ARM_UPPER'], arm: ['ARM_LOWER'], hand: ['FINGER'], thigh: ['LEG_UPPER'], leg: ['LEG_LOWER'], foot: ['TOE'] };
function frostParts(c: Creature | null, seg: string): Part[] {
    if (!c) return [];
    const [side, name] = seg.includes('_') ? seg.split('_') : [null, seg];
    const byId = Object.fromEntries(c.parts.map(x => [x.id, x]));
    const sideOf = (part: Part) => { for (let q: Part | undefined = part; q; q = q.parent ? byId[q.parent] : undefined) for (const f of ['LEFT', 'RIGHT']) if (q.flags.includes(f)) return f; return null; };
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
const BREATH_HOLD_S = [24.3, 11.4];
/** An attack as BodyStrike gives it: what strikes, where, and the scene facts that decide whether it lands. */
export interface StrikeInput {
    part?: string; attack?: string; weapon?: string; material?: string; launcher?: string; armor?: (string | GearSpec)[];
    skill?: string; style?: Style; prone?: boolean; species?: string; mass?: number; landed?: boolean; under_fire?: boolean;
    distance_m?: number; approach_speed?: number; intent_visible?: boolean; awake?: boolean; facing?: boolean;
    from?: 'front' | 'back' | 'left' | 'right'; lit?: boolean; noise_sound?: string; noise_db?: number; noise_khz?: number;
    sense_range_m?: number; means?: string;
}
/** Worn or held gear: a DF item name with material, or custom gear with what it covers. */
export interface GearSpec {
    item: string; covers?: { part: string; sublocations?: string[]; sides?: string[]; coverage?: number; material?: string }[];
    held_in?: string; size_cm?: number[]; thickness_cm?: number; layer?: string; flexible?: boolean;
}
type Timing = { approach: number; reach: number; strike: number };
function water(p: Person, rng: Rng) {
    const w = p.env?.water;
    if (!w || has(p, 'NOBREATHE')) return;
    // Other creatures: DF SWIMS_INNATE, AQUATIC or AMPHIBIOUS keep the head up; the rest go under unless afloat [RAW flags].
    const c = creatureOf(p), human = thermalCapable(p.species);
    if (!human && !c?.flags?.some(f => ['SWIMS_INNATE', 'SWIMS_LEARNED', 'AQUATIC', 'AMPHIBIOUS'].includes(f))) p.swimFailed = true;
    // Can this person swim at all: 46 % of US adults can do all five water-safety skills (jump in over the head, surface and
    // float or tread 1 min, turn and find the exit, swim 25 yards, get out; American Red Cross survey, 2014), drawn once unless
    // the story says (BodyEnvironment `swimmer`). A non-swimmer in deep water goes under unless afloat.
    if (human) { p.canSwim ??= rng() < 0.46; if (!p.canSwim && w.deep !== false) p.swimFailed = true; }
    if (human && w.swimming && w.tc <= SWIM_COLD_C) {
        w.swimMin = (w.swimMin ?? 0) + 1;
        const clo: number[] | number = p.env!.clo, clothed = Array.isArray(clo) ? clo.some(c => c > 0.1) : clo > 0.1;
        w.swimLimit ??= Math.max(5, clothed ? 39 + 19 * gauss(rng) : 52 + 18 * gauss(rng));
        if (!p.swimFailed && w.swimMin >= w.swimLimit!) p.swimFailed = true;
    }
    // Exhausted (§6.7 maximum acceptable work time used up) and not held afloat: the head goes under [ASSUMED].
    if (human && p.exhausted && !w.afloat) p.swimFailed = true;
    const under = w.segs[0] || (p.swimFailed && !w.afloat) || (p.unconscious && !w.afloat);
    if (under && p.apnea == null) {
        p.breathHold ??= Math.max(5, BREATH_HOLD_S[0] + BREATH_HOLD_S[1] * gauss(rng));
        p.underS = (p.underS ?? 0) + 60;
        if (p.underS >= p.breathHold) { p.apnea = 0; p.drowning = true; p.unconscious = 'drowning'; }
    } else if (!under) {
        p.underS = 0; p.breathHold = null;
        if (p.drowning) { p.apnea = null; p.drowning = false; p.unconscious ??= 'near-drowning'; }
    }
}

/** Venom course (§5.2): neurotoxic → breathing stops at collapse (not-breathing rule); haemotoxic → shock, then death. */
function venomMinute(p: Person) {
    const v = p.venom;
    if (!v) return;
    v.min += 1;
    // DF effects with an engine mechanism (DF wiki, Syndrome): UNCONSCIOUSNESS "renders the creature unconscious"; BLEEDING
    // "causes the targeted body part to start bleeding": small-vessel rate 1–10 mL/min scaled by SEV ÷ 100 [ASSUMED].
    const act = activeSymptoms(v);
    if (act.some(e => e.kind === 'unconsciousness')) p.unconscious ??= 'venom';
    else if (p.unconscious === 'venom') p.unconscious = null;
    const bl = act.find(e => e.kind === 'bleeding');
    if (bl && bloodVolume(p)) p.lost += 5.5 * (bl.sev ?? 0) / 100;
    if (!v.fatal) return;
    if (v.kind === 'neuro' && v.min >= (v.collapse ?? Infinity) && p.apnea == null && !has(p, 'NOBREATHE')) { p.apnea = 0; p.paralysed = true; p.unconscious = 'paralysed by venom'; }
    if (v.kind === 'hemo') {
        if (v.min >= (v.shock ?? Infinity)) p.unconscious ??= 'venom shock';
        if (v.min >= (v.death ?? Infinity)) p.dead = 'envenomation';
    }
}

/** Altitude (§6.6): AMS and oedema rolled after the first night (12 h) at a new altitude; sudden arrival above 18 000 ft
 * (aircraft, magic) → unconscious once the time of useful consciousness runs out. */
// Carbon monoxide (§6.8). Uptake: Coburn-Forster-Kane equation, d[COHb]/dt = Vco/Vb + PICO/(B Vb) − [COHb] PcO2/(M B Vb [O2Hb]),
// B = 1/DL + PL/VA; DL 30 mL/min/mmHg, PL 713 mmHg, M 218, PcO2 100 mmHg, Vco 0.007 mL/min, O2 capacity 0.207 mL/mL, blood
// volume as §5, VA 6000 mL/min × METs × (mass ÷ 70 kg)^0.75 (ventilation follows metabolic rate, Kleiber) [ASSUMED scaling]; PICO = ppm × (PB − 47). With no CO in the air, COHb falls with the
// half-life 320 min on room air, 80 on 100 % oxygen, 23 hyperbaric (Wikipedia, Carbon monoxide poisoning). Unconscious at
// 30 % ("30 % COHb is considered severe"; fits 800 ppm "insensible within 2 hours": 97 min), dead at 40 % (fits 3200 ppm
// "death within 30 minutes": 29 min) [fit].
const CO_HALF: Record<'air' | 'oxygen' | 'hyperbaric', number> = { air: 320, oxygen: 80, hyperbaric: 23 };
function coMinute(p: Person) {
    const ppm = p.env?.co ?? 0, c = p.co;
    if (!ppm && !c) return;
    if (has(p, 'NOBREATHE') || !bloodVolume(p)) return;
    const k = p.co ??= { hb: 0, o2: 'air' as const }, cap = 0.207, vb = bloodVolume(p);
    if (ppm > 0) {
        const pb = p.altitude ? pressureTorr(p.altitude.m) : 760, va = 6000 * kleiber(p) * Math.max(1, p.env?.met ?? p.workMet ?? 1);
        const B = 1 / 30 + 713 / va, co = k.hb * cap;
        k.hb = Math.min(0.99, (co + 0.007 / vb + ppm * 1e-6 * (pb - 47) / (B * vb) - co * 100 / (218 * B * vb * (cap - co))) / cap);
    } else k.hb *= 0.5 ** (1 / CO_HALF[k.o2]);
    if (k.hb >= 0.40) { p.dead = 'carbon monoxide'; return; }
    if (k.hb >= 0.30) p.unconscious ??= 'carbon monoxide';
    else if (p.unconscious === 'carbon monoxide') p.unconscious = null;
    if (!ppm && k.hb < 0.005) p.co = null;
}

function altitudeMinute(p: Person, rng: Rng) {
    const a = p.altitude;
    if (!a || has(p, 'NOBREATHE')) return;
    a.min = (a.min ?? 0) + 1;
    // Acclimatization (§6.6): risk follows the gain over the acclimatized altitude, which starts at 2500 m and rises 457 m
    // (1500 ft) per day spent above it, up to the current altitude (WMS pace, StatPearls NBK560677) [ASSUMED].
    p.acclim ??= 2500;
    a.acc0 ??= p.acclim;
    if (a.m > p.acclim && a.min % DAY_MIN === 0) p.acclim = Math.min(a.m, p.acclim + 457);
    if (a.min === 12 * 60 && a.ams == null) {
        const eff = a.m - a.acc0 + 2500;
        a.ams = rng() < amsChance(eff);
        if (a.ams) a.amsEnd = a.min + Math.round((24 + rng() * 24) * 60);
        a.hace = rng() < haceChance(eff);
        if (rng() < hapeChance(eff)) a.hapeAt = Math.round((1 + rng() * 4) * DAY_MIN);
        if (a.hace) a.haceDeath = a.min + Math.round((HACE_DEATH_H[0] + rng() * (HACE_DEATH_H[1] - HACE_DEATH_H[0])) * 60);
        a.oedema = a.hace;
    }
    if (a.ams && a.min >= (a.amsEnd ?? Infinity)) a.ams = false;
    // HAPE: half die without descent (WMS), "fatal within a few hours" (Medscape 300716): 2–6 h after onset [ASSUMED range].
    if (a.hapeAt && a.min >= a.hapeAt) { a.hape = true; a.oedema = true; a.hapeAt = null; if (rng() < 0.5) a.hapeDeath = a.min + Math.round((2 + 4 * rng()) * 60); }
    if (a.hapeDeath && a.min >= a.hapeDeath) p.dead = 'high-altitude pulmonary oedema';
    if (a.hace && a.min >= (a.haceDeath ?? Infinity) - 60) p.unconscious ??= 'cerebral oedema';
    if (a.hace && a.min >= (a.haceDeath ?? Infinity)) p.dead = 'high-altitude cerebral oedema';
    if (a.sudden && a.tuc === undefined) { const r = tucRange(a.m, a.decompression); a.tuc = r ? r[0] + rng() * (r[1] - r[0]) : null; }
    if (a.tuc != null && a.min * 60 >= a.tuc) p.unconscious ??= 'hypoxia';
}

/** Sets the altitude (m) and how the person got there; m = 0 clears. */
export function setAltitude(p: Person, m: number, sudden = false, decompression = false): void {
    if (p.unconscious === 'hypoxia') p.unconscious = null;
    const old = p.altitude;
    // Descent below where oedema began stops its course [ASSUMED]; the conditions remain until time passes.
    const keep = old && m < old.m && old.oedema ? { hace: false, hape: old.hape, oedema: old.hape ?? null, ams: old.ams } : {};
    p.altitude = m > 0 ? { m, sudden: sudden || decompression, decompression, min: 0, ams: null, oedema: null, ...keep } : null;
    if (p.unconscious === 'cerebral oedema') p.unconscious = null;
}

export interface EnvInput {
    air_c: number; radiant_c?: number; humidity_pct?: number; wind_kmh?: number; air_speed_ms?: number;
    clothing?: Clothing; face_covered?: boolean; met?: number | null; posture?: 'standing' | 'sitting' | 'lying' | null;
    co_ppm?: number; smoke?: boolean; o2_pct?: number | null; water_c?: number | null; water_speed_ms?: number; immersed?: string[];
    immersion_suit?: boolean; swimming?: boolean; afloat?: boolean; deep_water?: boolean; swimmer?: boolean | null;
}
/**
 * Sets (or clears, env = null) the air a person is in: { air_c, radiant_c, humidity_pct, wind_kmh (weather, 10 m) or air_speed_ms
 * (at the body, indoors), clothing: { ensemble, garments }, face_covered, met, posture }. Throws on unknown clothing.
 */
export function setEnvironment(p: Person, env: EnvInput | null): void {
    if (!env) { p.env = null; return; }
    const cl: Clothing = env.clothing ?? {};
    const covers = (region: string) => (cl.garments ?? []).some(g => (g.covers ?? []).some(x => String(x).toLowerCase().includes(region)));
    p.env = { tdb: env.air_c, tr: env.radiant_c ?? env.air_c, rh: env.humidity_pct ?? 50,
        v: env.air_speed_ms ?? Math.max(0.1, (env.wind_kmh ?? 0) / 3.6 * BODY_WIND), wind10: env.air_speed_ms != null ? 0 : env.wind_kmh ?? 0,
        clo: clothingClo(cl), met: env.met ?? null, posture: env.posture ?? null, co: env.co_ppm ?? 0, smoke: !!env.smoke,
        faceBare: !env.face_covered, handsBare: !(/gloves/i.test(cl.ensemble ?? '') || covers('hand')),
        water: env.water_c != null && env.immersed?.length ? { tc: env.water_c, speed: env.water_speed_ms ?? 0, segs: immersion(env.immersed), suit: !!env.immersion_suit,
            swimming: !!env.swimming, afloat: !!env.afloat, deep: env.deep_water !== false } : null };
    if (env.swimmer != null) p.canSwim = !!env.swimmer;
    if (!p.env!.water) { p.swimFailed = false; p.underS = 0; p.breathHold = null; if (p.drowning) { p.apnea = null; p.drowning = false; p.unconscious ??= 'near-drowning'; } }
    if (p.thermal) { p.thermal.bareDose = 0; }
    // Low oxygen (fire, sealed room, gas displacing air): the altitude with the same inspired oxygen pressure, entered suddenly
    // (§6.6 rules apply; hypoxic air and altitude are equivalent by inspired PO2) [ASSUMED equivalence].
    if (env.o2_pct != null && env.o2_pct < 20.9) {
        p.baseAlt ??= p.altitude?.m ?? 0;
        const m = equivalentAltitude(env.o2_pct, p.baseAlt);
        if (p.altitude?.m !== m) setAltitude(p, m, true);
    } else if (p.baseAlt != null) { setAltitude(p, p.baseAlt); p.baseAlt = null; }
    if (p.env!.met == null) delete p.env!.met;
    if (p.env!.posture == null) delete p.env!.posture;
}

export function status(who: string, p: Person): string {
    if (p.dead) return `${who}: dead (${p.dead}).`;
    const out: string[] = [];
    if (p.apnea != null) out.push(`${who}: not breathing, unconscious; dies in ${APNEA_DEATH() - p.apnea} min`);
    else if (p.unconscious) out.push(`${who}: unconscious (${p.unconscious})`);
    const f = lossFraction(p);
    const c = creatureOf(p);
    const v = p.pulseLast;
    const signs = v ? `pulse ${Math.round(v.hr)}/min, blood pressure ${Math.round(v.sys)}/${Math.round(v.dia)} mmHg, breathing ${Math.round(v.rr)}/min, oxygen ${Math.round(v.spo2 * 100)} % (Pulse)` : null;
    out.push(bloodVolume(p) ? `${who} (${c?.name ?? p.species}): blood lost ${round(p.lost / 1000, 2)} L (${round(f * 100)}%, class ${['I', 'II', 'III', 'IV'][bloodClass(p) - 1]}${p.lost > 0 ? `: ${signs ?? SHOCK_SIGNS[bloodClass(p) - 1]}` : ''})` : `${who} (${c?.name ?? p.species}): no blood`);
    if (p.deathIn !== null) out.push(`dies in ${p.deathIn} min unless ${p.wounds.some(w => w.bleed) ? 'bleeding stops and blood is replaced' : 'blood is replaced'}`);
    if (p.red > 0 || p.lost > 0) out.push(`aerobic capacity ${Math.round(vo2avail(p) / vo2max(p) * 100)} % (altitude and missing red cells)`);
    for (const w of p.wounds) {
        if (w.healed && !w.infection) continue;
        const bits: string[] = [`wound ${w.id} ${w.part} ${w.type}${w.depth ? ` (${w.depth.replace('_', ' ')})` : ''}`];
        if (w.bleed) bits.push(`bleeding ${w.bleed} mL/min`);
        if (w.heals !== null && !w.healed) bits.push(`closes in ${round(w.heals - w.age)} days`);
        if (w.type === 'burn' && w.depth === 'full') bits.push('closes only with a skin graft');
        if (w.fracture) {
            const fr = w.fracture;
            if (fr.joins !== null) bits.push(fr.never ? 'will not join' : fr.joins > 0 ? `joins in ${round(fr.joins)} days` : (fr.full ?? 0) > 0 ? `light use; full in ${round(fr.full ?? 0)} days` : 'healed');
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
    const reduced = (Object.entries(abilities(p)) as [string, number][]).filter(([, v]) => v < 1);
    if (reduced.length) out.push(`abilities: ${reduced.map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', ')}`);
    if (p.needs) {
        const nd = p.needs, pct = nd.waterL / p.mass * 100, hours = wakeHours(p);
        if (pct >= 2) out.push(`water lost ${round(nd.waterL, 1)} L (${round(pct)} % of body mass${pct >= 8 ? ': weak, dizzy, faint; heavy exertion fails' : pct >= 5 ? ': headache, irritable, light-headed' : ': thirsty'})`);
        if (nd.kcal >= KCAL_DAY.rest * kleiber(p)) out.push(`food deficit ${Math.round(nd.kcal)} kcal (${round(nd.kcal / (KCAL_DAY.rest * kleiber(p)), 1)} days without food at rest)`);
        if (hours >= 10) out.push(`awake ${round(nd.awake / 60)} h${(nd.debt ?? 0) >= 1 ? ` plus ${round(nd.debt ?? 0)} h of sleep debt` : ''}: performs like blood alcohol ${round(awakeBac(hours), 3)} %${(nd.debt ?? 0) >= 1 ? '; feels less sleepy than that (sleepiness rises little under chronic restriction)' : ''}`);
        if ((nd.alcohol ?? 0) > 0) out.push(`blood alcohol ${round(nd.alcohol ?? 0, 3)} %`);
    }
    if ((p.needs?.work ?? 0) > 0) out.push(p.exhausted ? 'exhausted: exertion fails until a full sleep' : `work done today: ${Math.round(p.needs!.work! * 100)} % of what can be kept up`);
    if ((p.heatStroke?.min ?? 0) >= 30) out.push(`heat stroke not cooled within 30 min: about ${p.heatStroke!.exertional ? '1 in 4' : '2 in 3'} die within days`);
    if (p.burnDeath) out.push(`burned ${burnedTBSA(p)} % of body surface: about ${Math.round(p.burnDeath.p * 100)} % of such patients die within 2 weeks`);
    if (p.co) out.push(`carboxyhaemoglobin ${Math.round(p.co.hb * 100)} %${p.co.hb >= 0.3 ? ' (unconscious)' : p.co.hb >= 0.1 ? ' (headache, dizziness, nausea)' : ''}; unconscious at 30 %, dead at 40 %`);
    if (p.peritonitis) out.push(`gut opened (peritonitis): belly pain, fever${p.peritonitis.repaired ? '; repaired by laparotomy' : '; without surgery about 9 in 10 die within a week'}`);
    if (p.sepsis) out.push(`bloodstream infection (sepsis): fever, weak; heavy exertion fails${p.sepsis.treated ? '; on antibiotics' : '; untreated, about 4 in 5 die within 30 days'}`);
    if (p.venom) {
        const v = p.venom;
        const sy = activeSymptoms(v).map(e => `${e.kind} ${e.sev}`).join(', ');
        if (sy) out.push(`venom symptoms (DF severity 0–100): ${sy}${activeSymptoms(v).some(e => e.kind === 'paralysis') ? '; paralysed: cannot move, still breathing' : ''}`);
        if (v.kind === 'df') out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')} (${v.min} min ago): fictional venom, DF symptoms only`);
        else if (v.kind === 'pain') out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')}: severe local pain and swelling; not lethal to a healthy adult`);
        else out.push(`envenomed by ${v.species.toLowerCase().replace(/_/g, ' ')} (${v.mg} mg, ${v.ratio} × the lethal dose)${v.fatal ? (v.kind === 'neuro' ? `: paralysis stops breathing at ${v.collapse} min` : `: shock at ${v.shock} min, death at ${v.death} min`) + ` (now ${v.min} min) unless antivenom` : ': survives without antivenom; local pain and swelling'}`);
    }
    const al = p.altitude;
    if (al) {
        out.push(`altitude ${al.m} m: aerobic capacity ${Math.round(aerobicFactor(al.m) * 100)} %${al.ams ? '; acute mountain sickness (headache, insomnia, nausea; heavy exertion fails)' : ''}${al.hace ? `; high-altitude cerebral oedema: unsteady, confused; coma and death in ${round(((al.haceDeath ?? 0) - al.min) / 60, 1)} h without descent` : ''}${al.hape ? '; high-altitude pulmonary oedema: breathless on mild exertion, cough; up to half die without descent' : ''}${al.ams === false ? '; acclimatizing without sickness' : ''}`);
    }
    const th = p.thermal;
    if (p.env && th?.core != null) {
        const st = coreStage(th.stageCore ?? th.core);
        const cc = coolCore(p);
        if (cc > 0) out.push(`cold brain: mental tasks take ${round(1 / thinkSpeed(p), 2)} × as long (accuracy holds), keeps ${Math.round(keepsNew(p) * 100)} % of new information (recall of known things intact)`);
        out.push(`core ${round(th.core, 1)} °C${th.set != null ? ` (normal ${round(th.set, 1)})` : ''}${st ? ` (${st})` : ''}${th.coldest ? `, coldest skin ${th.skinMin} °C (${th.coldest.replace('_', ' ')})` : ''}`);
    }
    if (worldHasMagic()) { const n = p.net, s = stage(n); out.push(`network: C ${n.C}, N ${n.N}, stage ${s.stage} (max complexity ${s.max}), R ${Math.floor(n.R)}/${n.C} PE, P ${Math.round(n.P * 100)}%`); }
    { const d = drugStatus(p); if (d) out.push(d); }
    if (p.at) out.push(`at ${p.at}`);
    return out.join('. ') + '.';
}

// Knockout: a blunt blow to a HEAD part knocks out when the momentum reaching the head's tissue (after armour) is at least
// this value. Fit (docs/df-body-engine.md §6.1): a Professional 70 kg punch knocks out on 0.743 % of landed head punches
// (97 KOs in 222 BKFC 2022 bouts). Without breathing: death after 5 min (Merck Manual, respiratory arrest).
const KO_MOMENTUM = 158.0;
// Chokes: unconscious after 6.2–10.5 s of a locked hold on the neck (by choke type; mean 9.0 s, 81 chokes on fully resisting
// trained fighters, Int J Perf Anal Sport 2020); held 5 min → dead (no gas exchange, as apneaDeathMin).
const CHOKE_LOC_S = [6.2, 10.5];
// Default face area of held DF items: shield Ø 85 cm (Viking round shields 80–90 cm, Hurstwic); buckler Ø 30 cm
// (reenactment guidance "10–12 in upwards", Vikings wiki). Thickness 0.9 cm (surviving shields 6–12 mm, Hurstwic).
const HELD_FACE_CM2: Record<string, number> = { ITEM_SHIELD_SHIELD: Math.PI * 42.5 ** 2, ITEM_SHIELD_BUCKLER: Math.PI * 15 ** 2 };
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
const kleiber = (p: Person) => (p.mass / 70) ** 0.75;
// Alertness: impairment as blood-alcohol level = drinking (Widmark: grams ÷ (0.68 × body g) × 100, eliminated 0.015 %/h, the
// population mean for moderate drinkers; range 0.010–0.035 %/h, 0.015–0.020 fed, 0.025–0.035 in alcoholics: Jones 2010,
// Forensic Sci Int 200:1)
// + hours awake. Odds of failing × the crash odds ratio exp(40.7 × BAC^1.345), the curve through NHTSA 2015 (Compton & Berning,
// case-control) adjusted odds ratios 2.07 at 0.05 % and 3.93 at 0.08 %, and 1 at 0.
const WIDMARK_R = 0.68, ELIM_PER_MIN = 0.015 / 60;
export const crashRisk = (bac: number) => Math.exp(40.7 * Math.max(0, bac) ** 1.345);
export const impairmentBac = (p: Person) => (p.needs?.alcohol || 0) + awakeBac(wakeHours(p));
/** Hours awake now plus sleep debt carried from short nights. */
export const wakeHours = (p: Person) => (p.needs?.awake || 0) / 60 + (p.needs?.debt || 0);
export const awakeBac = (h: number) => Math.max(0, 0.05 + (h - 17) * 0.05 / 7);
// Flight speed of a shot: 47.23 m/s, a 102 g arrow from a 144 lbf yew self bow (Stretton et al. 2010), for every launcher.
const SHOT_MPS = 47.23;
const SHOT_HC = [101, 95, 89, 83, 77, 71, 65, 59, 53];

// Spread of a blow's momentum: Walilko 2005 punch force SD ÷ mean (rule 576), applied to every attack.
const SPREAD = 0.237;
const BLADE_LIMB_ARTERY = 0.12;
const REF_MASS = 70;

export function gauss(rng: Rng): number {
    return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

const norm = (t: unknown) => String(t || '').trim().toLowerCase().replace(/[_\s]+/g, ' ');

/** A part of creature c by name or DF id ("right upper arm", "RUA"); null when none. */
export function findPart(c: Creature, text: string | null | undefined): Part | null {
    const key = norm(text);
    return c.parts.find(x => norm(x.name) === key) ?? c.parts.find(x => norm(x.id) === key) ?? null;
}

export const aimable = (c: Creature) => c.parts.filter(x => !x.flags.includes('INTERNAL')).map(x => x.name);

/** Vessel class of the cut layers (rule 576 rates; DF marks which layers carry arteries). */
function vesselOf(c: Creature, layers: Layer[], rng: Rng): Vessel | undefined {
    const tis = (l: Layer) => c.tissues[l.tissue];
    if (layers.some(l => l.major)) return 'femoral';
    if (layers.some(l => tis(l)?.flags.includes('ARTERIES')) && rng() < BLADE_LIMB_ARTERY) return 'limb_artery';
    return layers.some(l => (tis(l)?.VASCULAR ?? 0) > 0) ? 'small' : undefined;
}

/** A cut, puncture or bite through every layer of a part, recorded without an attack (BodyWound). */
export function openWound(p: Person, part: Part, type: WoundType, rng: Rng = Math.random): Wound {
    const c = creatureOf(p)!;
    // Through every layer: organ (FUNCTIONAL) tissue stops working, for good when it has no HEALING_RATE (as in strike).
    const organ = liveLayers(c, part).map(l => tissueOf(c, l)).filter((t): t is Tissue => !!t?.flags.includes('FUNCTIONAL'));
    const w = addWound(p, { part, type, vessel: vesselOf(c, part.layers, rng), functionLost: organ.length > 0,
        permanent: organ.some(t => t.HEALING_RATE == null) }, rng);
    checkDeath(p);
    return w;
}

// Whether an attack lands: it does unless the target detects it and finishes a defensive move before impact.
// Seconds. Sources and proxies: rule 576 reference.
const REACH_M = 0.88;                                   // FAA 2006-08 functional reach, men 50th %ile
const STRIKE_S: Record<string, [number, number]> = { fist: [0.357, 0.178], kick: [0.477, 0.203], blade_cut: [0.357, 0.178], blade_stab: [0.357, 0.178] }; // Piorkowski 2011 jab; kick = hook, blade = jab (proxies)
// Reaction = sense organ → cortex + brain decision + synapse + nerve path ÷ conduction speed + muscle activation + force rise.
// Human check: sight 0.056 + 0.204 + 0.070 = 0.330 s (measured 0.331); hearing 0.011 + 0.204 + 0.070 = 0.285 s (measured 0.284).
const SENSE_S: Record<'sight' | 'hearing', number> = { sight: 0.056, hearing: 0.0109 };     // Foxe & Simpson 2002 V1 onset; Brugge 2008 A1 onset
const DECIDE_S = 0.2037;                               // human: measured RT minus all other parts, sight 0.2046 / hearing 0.2027
const NERVE_MPS = 49;                                  // Chen 2016 AANEM: median/ulnar motor conduction lower limit
const SYNAPSE_S = 0.0007;                              // More & Donelan 2018
const twitch = (mass: number) => 0.0043 * mass ** 0.21 + 0.0176 * mass ** 0.20; // More & Donelan 2018: electromechanical + force generation
const RT_CV = 36.42 / 297;                              // Petri 2020 spread
// Simple reaction time by age and sex (Der & Deary 2006, Psychol Aging 21:62, Table 1, 7,130 adults 18–94): the table's
// Box–Cox polynomial y = b0 + b1 a + b2 a² + b3 a³ + man × (bs + b4 a + b5 a²), a = age − 44.9, inverted as ms = (1 + λy)^(1/λ),
// λ = −1.65. Gives men 277, 281, 290, 324, 399 ms and women 295, 294, 301, 344, 462 ms at ages 18, 30, 45, 65, 80; held
// below 18 and above 85, where the cubic runs toward the transform's pole (women 567 ms at 85, 833 at 90) [ASSUMED cut]. Scales the reaction ÷ a man of 30 [reference ASSUMED].
const RT_B = [0.6060111935, 0.0000002515, 0.0000000097, 0.0000000001, -0.0000029779, 0.0000000044, -0.0000000031];
const rtMs = (age: number, sex: string) => { const a = Math.max(18, Math.min(85, age)) - 44.9, m = sex === 'female' ? 0 : 1;
    const y = RT_B[0] + RT_B[1] * a + RT_B[2] * a * a + RT_B[3] * a ** 3 + m * (RT_B[4] + RT_B[5] * a + RT_B[6] * a * a);
    return (1 - 1.65 * y) ** (-1 / 1.65); };
export const reactionFactor = (p: Person | null | undefined) => p?.age == null ? 1 : rtMs(p.age, p.sex ?? 'male') / rtMs(30, 'male');
const LIMB_MOVE_S = 0.242;                              // VencesBrito 2011 karate punch: moving a limb (block)
const BODY_MOVE_S = 0.715;                              // Wakatsuki & Yamada 2020: reactive side-step movement time (dodge)
const HEAR_DB = 25;                                     // WHO: normal hearing threshold at or below 25 dB
const WAKE_DB = 55, WAKE_MAX_S = 21;                    // young adults: all woke to a 55 dBA alarm within 21 s
const WAKE_MIN_S = 1.59;                                // Oudiette 2023: median response time from N2 sleep
const INERTIA_SPEED = 0.79;                             // Newman 2013: response speed 79 % right after waking
// Body size, not species: the human values above are the 70 kg point of mammal scaling laws (5 g – 5000 kg).
const EXP_MOVE = 0.15;    // Heglund & Taylor 1988: stride period ∝ M^0.150–0.156
const EXP_LENGTH = 1 / 3; // geometric similarity
const size = (mass: number | null | undefined, exp: number) => ((mass || REF_MASS) / REF_MASS) ** exp;

/** Seconds from the start of the attack to impact, or null when the attacker never comes within reach. */
function impactTime(a: StrikeInput, rng: Rng): Timing | null {
    const reach = REACH_M * size(a.mass, EXP_LENGTH);
    const dist = a.distance_m ?? reach;
    const approach = dist <= reach ? 0 : (a.approach_speed ?? 0) > 0 ? (dist - reach) / a.approach_speed! : null;
    if (approach === null) return null;
    const [mean, sd] = STRIKE_S[a.means ?? 'fist'] || STRIKE_S.fist;
    return { approach, reach, strike: Math.max(0.05, mean + sd * gauss(rng)) * size(a.mass, EXP_MOVE) };
}

/**
 * Earliest second (from attack start) at which the target finishes a defensive move, or Infinity.
 * A channel perceives the attacker from some second on; the attack itself is recognisable from second 0
 * when intent is visible, otherwise only once the strike starts (t.approach).
 */
function defenceDone(a: StrikeInput, t: Timing, defender: Person | null, rng: Rng): number {
    if (defender?.unconscious) return Infinity;
    const awake = a.awake !== false;
    const dist = a.distance_m ?? t.reach;
    const intentFrom = a.intent_visible ? 0 : t.approach;
    const m = defender?.mass ?? REF_MASS;
    const body = defender?.body ?? {};
    const nerve = Math.max(1, (body.nerve_mps ?? NERVE_MPS) - NERVE_PER_C * limbCold(defender, 'arm'));
    const motor = SYNAPSE_S + (body.limb_m ?? REACH_M * size(m, EXP_LENGTH)) / nerve + twitch(m);
    const rt = (channel: 'sight' | 'hearing') => ((body.sense_s?.[channel] ?? SENSE_S[channel]) + (body.decide_s ?? DECIDE_S) + motor)
        * reactionFactor(defender) * Math.max(0.5, 1 + RT_CV * gauss(rng));
    const done: number[] = [];
    const perceive = (from: number, reaction: number) => done.push(Math.max(from, intentFrom) + reaction);
    // Sense organs. Human monocular field 107° temporal, 60° nasal (Rönne 1915): a blow from the side (90°) is seen only by
    // the eye on that side, from behind by none. One ear lost: thresholds +3 dB (binaural summation, Baker et al. 2020).
    const c = defender ? creatureOf(defender) : null;
    const works: (x: { flags: string[] }) => boolean = c && defender ? worksFn(defender, c) as (x: { flags: string[] }) => boolean : () => true;
    const organs = (flag: string): { flags: string[] }[] => c ? c.parts.filter(x => x.flags.includes(flag)) : [{ flags: [] }];
    const eyes = organs('SIGHT').filter(works), ears = organs('HEAR'), earsOk = ears.filter(works).length;
    const dir = a.from ?? (a.facing === false ? 'back' : 'front');
    const sideFlag = dir === 'left' ? 'LEFT' : dir === 'right' ? 'RIGHT' : undefined;
    const eyeSees = (e: { flags: string[] }) => sideFlag ? e.flags.includes(sideFlag) || !e.flags.some(f => f === 'LEFT' || f === 'RIGHT') : a.facing !== false;
    const sees = a.lit !== false && dir !== 'back' && eyes.some(eyeSees);
    // A named sound source (Listen presets) at the attack's starting distance gives the level by spherical spreading.
    const db = a.noise_sound && SOUNDS[classOf(SOUNDS, a.noise_sound) ?? ''] != null ? SOUNDS[classOf(SOUNDS, a.noise_sound)!] - 20 * Math.log10(Math.max(1, a.distance_m ?? 1)) : a.noise_db || 0, level = db - hearingShift(defender?.species) - (earsOk < ears.length ? 3 : 0);
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
        const enter = dist <= r ? 0 : r >= t.reach ? (dist - r) / (a.approach_speed ?? Infinity) : t.approach + t.strike * (t.reach - r) / t.reach;
        perceive(enter, rt('sight'));
    }
    return done.length ? Math.min(...done) : Infinity;
}

/** Seconds a defensive move takes: a limb (block) or the whole body (dodge), ÷ the ability that drives it. */
function moveTime(defender: Person | null, kind: 'block' | 'dodge'): number {
    const ab = defender ? abilities(defender) : {};
    const key = kind === 'block' ? 'grasp' : 'stance';
    const capacity = (ab[key] ?? (kind === 'block' ? 0 : 1)) * speedFactor(limbCold(defender, kind === 'block' ? 'arm' : 'leg'));
    if (capacity <= 0) return Infinity;
    return (kind === 'block' ? LIMB_MOVE_S : BODY_MOVE_S) * size(defender?.mass ?? REF_MASS, EXP_MOVE) / capacity;
}

/**
 * An attack (docs/df-body-engine.md §4–5). a: { part, attack, weapon?, material?, armor? (worn items, text), skill?, style?, prone?, species?, mass?,
 * landed?, scene fields }. The attacker's species and mass come from the tracked attacker when there is one.
 */
export function strike(target: Person, a: StrikeInput, attacker: Person | null = null, rng: Rng = Math.random): string {
    const tc = creatureOf(target);
    const ac = creature(attacker?.species ?? a.species ?? 'HUMAN');
    if (!tc || !ac) return 'Creature data is not loaded. Nothing recorded.';
    const aMass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    let part = a.part ? findPart(tc, a.part)
        : randomHitPart(tc, rng, { attackerCm3: aMass * 1000, flies: ac.parts.some(x => x.flags.includes('FLIER')) });
    if (!part || part.flags.includes('INTERNAL')) return `${tc.name} has no part "${a.part}" to aim at. Parts: ${aimable(tc).join(', ')}. Nothing recorded.`;
    const mass = attacker?.mass ?? a.mass ?? ac.size / 1000;
    const iSize = mass * 1000;
    const worn: WornItem[] = [];
    // Worn gear: a DF item ("iron helm") gives the defaults; covers (CDDA-style portions: part, sub-locations, coverage %,
    // material), layer and flexible replace them.
    const pct = (x: unknown) => Math.max(0, Math.min(150, Number(x)));
    const works = worksFn(target, tc);
    const notes: string[] = [];
    for (const g of a.armor || []) {
        const spec: GearSpec = typeof g === 'string' ? { item: g } : g;
        const it: WornItem | null = armorOf(spec.item) ?? (spec.covers?.length || spec.held_in || spec.size_cm ? customGearOf(spec.item) : null);
        if (!it) return `No gear "${spec.item}": name a DF item with its material ("iron helm", "leather armor"), or give covers, held_in or size_cm with a material first ("iron skullcap"). Nothing recorded.`;
        // Held: in the named part, else a working GRASP part for DF shields; dropped from the hit when no holding part works.
        if (spec.held_in || it.kind === 'ITEM_SHIELD') {
            const holder = spec.held_in ? findPart(tc, spec.held_in) : tc.parts.find(x => x.flags.includes('GRASP') && works(x));
            if (spec.held_in && !holder) return `${tc.name} has no part "${spec.held_in}". Nothing recorded.`;
            if (!holder || !works(holder)) { notes.push(`${it.name} not held (no working hand)`); continue; }
            it.held = holder;
            const dims = (spec.size_cm || []).map(Number).filter(x => x > 0);
            const face = dims.length >= 2 ? dims[0] * dims[1] : dims.length === 1 ? Math.PI * (dims[0] / 2) ** 2
                : HELD_FACE_CM2[it.id ?? ''] ?? null;
            if (!face) return `${it.name}: give size_cm (diameter, or width and height). Nothing recorded.`;
            it.face = face;
            it.thick = Number(spec.thickness_cm) || HELD_THICK_CM;
        }
        if (spec.layer) it.layer = spec.layer;
        if (spec.flexible !== undefined) it.elastic = !!spec.flexible;
        if (spec.covers?.length) {
            const portions: Record<string, Portion[]> = it.parts = {};
            for (const cv of spec.covers) {
                const pt = findPart(tc, cv.part);
                if (!pt) return `${tc.name} has no part "${cv.part}" for ${it.name}. Nothing recorded.`;
                const known = Object.keys(sublocationsOf(pt) || {});
                const subs = cv.sublocations?.length ? cv.sublocations.map(x => String(x).trim().toLowerCase()) : null;
                const bad = subs?.find(x => !known.includes(x));
                if (bad) return `${pt.name} has no sub-location "${bad}"${known.length ? ` (${known.join(', ')})` : ''}. Nothing recorded.`;
                const mat = cv.material ? gearMaterialOf(cv.material) : null;
                if (cv.material && !mat) return `No material "${cv.material}". Nothing recorded.`;
                const sides = cv.sides?.length ? cv.sides.filter((x): x is Side => x === 'front' || x === 'back') : undefined;
                (portions[pt.id] ??= []).push({ subs, sides, coverage: pct(cv.coverage ?? 100), ...(mat ? { mat, elastic: mat.kind === 'thread' } : {}) });
            }
        }
        // A held item without covers guards the front of the holding limb, torso and head: coverage = its face area ÷ their
        // frontal area, each part's frontal area = (part size cm³)^(2/3) [geometric similarity].
        if (it.held && !spec.covers?.length) {
            const chain: Part[] = [];
            for (let q: Part | undefined = it.held; q && !q.flags.includes('UPPERBODY'); q = tc.parts.find(x => x.id === q!.parent)) chain.push(q);
            const guarded = [...chain, ...tc.parts.filter(x => ['UPPERBODY', 'LOWERBODY', 'HEAD'].some(f => x.flags.includes(f)))];
            const front = guarded.reduce((s, x) => s + (target.mass * 1000 * x.relsize / (tc.relTotal ?? 1)) ** (2 / 3), 0);
            const face = it.face ?? 0, cov = Math.min(100, 100 * face / front);
            it.parts = Object.fromEntries(guarded.map(x => [x.id, [{ subs: null, sides: ['front' as Side], coverage: cov }]]));
            it.size = face * (it.thick ?? HELD_THICK_CM);
        }
        worn.push(it);
    }
    let w: StrikeWeapon | Shot, verb: string, means: string, bite = false, inject = false;
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
        w = { ...itemWeapon(wp, atk, metal), piercing: atk.contact < atk.penetration };
        verb = atk.verb;
        means = 'blade_cut';
    } else {
        const atk = ac.attacks.find(x => norm(x.id) === norm(a.attack) || norm(x.verb) === norm(a.attack));
        if (!atk) return `${ac.name} has no attack "${a.attack}". Attacks: ${ac.attacks.map(x => x.verb).join(', ') || 'none'}. Nothing recorded.`;
        const bw = bodyWeapon(ac, atk, iSize, attacker ? worksFn(attacker, ac) : () => true);
        if (!bw) return `The attacker cannot ${atk.verb} now: no working part for it. Nothing recorded.`;
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
        const pHit = (r: number) => (1 - Math.exp(-(((r + 0.00275) / sr) ** 2))) * (a.under_fire ? 0.6 : 1);
        const vol = target.mass / 1000, area = (p: Part) => (vol * p.relsize / (tc.relTotal ?? 1)) ** (2 / 3);
        const bodyA = tc.parts.filter(x => !x.flags.includes('INTERNAL')).reduce((t, x) => t + area(x), 0);
        const onPart = pHit(Math.sqrt(area(part) / Math.PI)), onBody = pHit(Math.sqrt(bodyA / Math.PI));
        const u = rng();
        console.debug?.('[Rules engine]', `shot spread ${round(sr * 100)} cm at ${d} m; on part ${Math.round(onPart * 100)} %, on body ${Math.round(onBody * 100)} %`);
        if (u >= onBody) return `shot at ${part.name}: misses, wide of the body${a.under_fire ? ', the shooter under fire' : ''}.`;
        if (u >= onPart) { const was = part.name; part = randomHitPart(tc, rng, { attackerCm3: aMass * 1000 }) ?? part; notes.push(`aimed at ${was}, struck ${part.name}`); }
    }
    if (!a.landed) {
        const at: StrikeInput = { ...a, means, mass };
        const t: Timing | null = means === 'shot'
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
        const at2 = (s: number) => `${s.toFixed(2)} s, impact at ${impact.toFixed(2)} s`;
        // Least harm first: a dodge that finishes in time, else a block with a held item, else with the forearm.
        if (dodgeAt <= impact) return `${verb} at ${part.name}: dodged (dodge done at ${at2(dodgeAt)}).`;
        if (blockAt <= impact) {
            if (held) { held.blocking = true; notes.push(`blocked with ${held.name} (block done at ${at2(blockAt)})`); }
            else if (forearm) { notes.push(`blocked with the ${forearm.name} (block done at ${at2(blockAt)})`); part = forearm; }
        }
    }
    const M = 'M' in w ? w.M : momentum(ac, iSize, w, a) * Math.max(0, 1 + SPREAD * gauss(rng));
    // Side hit: the one facing the attacker; a blow from the left or right lands front or back alike (equal halves).
    const from = a.from ?? (a.facing === false ? 'back' : 'front');
    const side: Side = from === 'front' || from === 'back' ? from : rng() < 0.5 ? 'front' : 'back';
    const r = penetrate(tc, part, target.mass * 1000, w, M, rng, worn, side);
    const made: Wound[] = [];
    const touched = [...new Set(r.hits.map(h => h.part))];
    for (const hp of touched) {
        const hits = r.hits.filter(h => h.part === hp);
        type Hit = (typeof hits)[number];
        const flags = (h: Hit) => tissueOf(tc, h.layer as Layer)?.flags || [];
        const rigid = (h: Hit) => flags(h).includes('STRUCTURAL') && !flags(h).includes('FUNCTIONAL');
        const cuts = hits.filter(h => h.result === 'cut').map(h => h.layer as Layer);
        const soft = hits.filter(h => !rigid(h));
        const functionLost = hits.some(h => flags(h).includes('FUNCTIONAL'));
        const severed = r.severed && hp === part;
        // DF HEALING_RATE: lower heals faster, absent never heals (wiki Tissue definition token).
        const rate = (h: Hit) => (h.layer as Layer).healing ?? tissueOf(tc, h.layer as Layer)?.HEALING_RATE;
        const slowest = (hs: Hit[], ref: number) => hs.length && hs.every(h => rate(h) != null) ? Math.max(...hs.map(h => rate(h)!)) / ref : 1;
        const permanent = hits.some(h => flags(h).includes('FUNCTIONAL') && rate(h) == null);
        if (soft.length || severed) {
            const type: WoundType = severed ? 'severed' : cuts.length ? (bite ? 'bite' : w.piercing ? 'puncture' : 'cut') : 'blunt';
            made.push(addWound(target, { part: hp, type, vessel: cuts.length ? vesselOf(tc, cuts, rng) : undefined, functionLost, permanent,
                healFactor: slowest(soft.filter(h => rate(h) != null), 100) }, rng));
        }
        if (hits.some(rigid)) made.push(addWound(target, { part: hp, type: 'fracture', open: cuts.length > 0, healFactor: slowest(hits.filter(rigid).filter(h => rate(h) != null), 1000) }, rng));
    }
    // Venom enters when the bite breaks the skin, cut or smashed (§5.2) [ASSUMED: DF fangs rarely cut by the edge test].
    if (inject && !target.venom && r.tested.some(x => /SKIN/.test(x.layer.tissue) && x.result !== 'held')) {
        const b = baseVenom(ac.id), bc = b && b !== ac.id ? creature(b) : null, scale = bc?.size ? ac.size / bc.size : 1;
        const v = envenom(ac.id, target.mass, () => gauss(rng), scale) ?? (symptoms(ac).length ? { species: ac.id, kind: 'df', fatal: false, min: 0 } : null);
        const immune: Record<string, string> = { pain: 'NOPAIN', dizziness: 'NO_DIZZINESS', fever: 'NO_FEVERS', nausea: 'NONAUSEA', paralysis: 'PARALYZEIMMUNE' };
        if (v) { v.symptoms = symptoms(ac).filter(e => !(immune[e.kind] && has(target, immune[e.kind]))); v.part = part.name; target.venom = v; }
    }
    checkDeath(target);
    const ko = !target.dead && part.flags.includes('HEAD') && !r.first.edged && r.first.M >= KO_MOMENTUM;
    if (ko && !target.unconscious && !has(target, 'NOSTUN')) target.unconscious = 'knocked out';
    const parts = [...new Set(r.tested.map(t => t.part))];
    const layers = parts.map((pt: Part) => `${pt.name}: ${r.tested.filter(t => t.part === pt).map(t => `${t.layer.tissue.toLowerCase()} ${t.result}`).join(', ')}`).join('; ');
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
export function choke(p: Person, seconds: number, holder: Person | null = null, rng: Rng = Math.random): string {
    const c = creatureOf(p);
    if (!c?.parts.some(x => x.cats.includes('NECK') || x.flags.includes('THROAT'))) return 'No neck to choke.';
    if (holder && abilities(holder).grasp === 0) return 'The holder has no working hand to hold a choke.';
    if (p.dead) return 'Already dead.';
    const s = Math.max(0, Number(seconds) || 0);
    const at = between(rng, CHOKE_LOC_S as [number, number]);
    if (s >= APNEA_DEATH() * 60) { p.dead = 'strangulation'; return `Choke held ${s} s: dead (strangulation).`; }
    if (s >= at) { p.unconscious = 'choked'; return `Choke held ${s} s: unconscious at ${round(at)} s.`; }
    return `Choke held ${s} s: still conscious (would black out at ${round(at)} s).`;
}

/** Drinking and eating: water in L, food energy (kcal, or from its composition, §6.19; alcohol 7 kcal/g), taken off the
 * deficits (never below 0). Returns a note when the stated energy contradicts the composition. */
export function intake(p: Person, a: { water_l?: number; food_kcal?: number; alcohol_g?: number; food_g?: number; carb_g?: number; protein_g?: number; fat_g?: number } = {}): string | null {
    p.needs ??= { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null };
    p.needs.alcohol = (p.needs.alcohol || 0) + Math.max(0, Number(a.alcohol_g) || 0) / (WIDMARK_R * p.mass * 1000) * 100;
    p.needs.waterL = Math.max(0, p.needs.waterL - Math.max(0, Number(a.water_l) || 0));
    const e = foodEnergy(a);
    p.needs.kcal = Math.max(0, p.needs.kcal - e.kcal);
    return e.note;
}

/** Listener hearing for acoustics.js: { shift, deaf } (species threshold, one of two ears lost +3 dB, bands out of range). */
function earOf(l: Person, lc: Creature) {
    const ears = lc.parts.filter(x => x.flags.includes('HEAR')), earsOk = ears.filter(worksFn(l, lc)).length;
    const h = hearingOf(l.species);
    const deaf = h?.lo ? BAND_HZ.map((f, i) => f < h.lo! || f > (h.hi ?? Infinity) ? i : -1).filter(i => i >= 0) : [];
    const one = ears.length > 1 && earsOk < ears.length ? 3 : 0;
    return { shift: bandShift(l.species).map(x => x + one), deaf, earsOk, ears: ears.length };
}

/** Whether `vs` sees a target of smallest dimension `size_m` at `distance_m` (§6.2): one roll against the Johnson
 * probabilities; returns the deepest level reached (identified ⊂ recognized ⊂ detected). */
export function look(vs: string, v: Person, { size_m = 0.5, distance_m = 10, light = 'daylight' as string | number, lightLabel = null as string | null, visibility_m = 20000 } = {}, rng: Rng = Math.random): string {
    const vc = creatureOf(v);
    if (!vc) return 'Creature data is not loaded.';
    if (v.dead || v.unconscious) return `${vs} perceives nothing (${v.dead ? 'dead' : 'unconscious'}).`;
    const eyes = vc.parts.filter(x => x.flags.includes('SIGHT'));
    if (eyes.length && !eyes.some(worksFn(v, vc))) return `${vs} cannot see (no working eye).`;
    const r = see({ size: size_m, distance: distance_m, light, visibility: visibility_m, acuityFactor: acuityOf(v.species) });
    const u = rng();
    const what = `${size_m} m target at ${distance_m} m, ${lightLabel ?? light}${visibility_m < 20000 ? `, visibility ${visibility_m} m` : ''}`;
    const level = u < r.identify ? 'identifies it (can tell which individual or exact kind)' : u < r.recognize ? 'recognizes what kind of thing it is (a person, a horse) but not which one'
        : u < r.detect ? 'notices something there but cannot tell what' : 'does not see it';
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
export const CLIMBERS = ['no', 'recreational', 'expert'] as const;
const FINGERTIP_SHARE: Record<string, number> = { no: 309 / 440, recreational: 359 / 445, expert: 447 / 526 };

export function holdLoad(who: string, p: Person, { load_kg = null as number | null, hands = 2, hanging = false, seconds = null as number | null, fingertips = false, climber = 'no' as string } = {}, rng: Rng = Math.random): string {
    if (!thermalCapable(p.species)) return `${who}: grip norms exist for humans only; use BodyCheck.`;
    if (p.dead || p.unconscious) return `${who} cannot hold anything (${p.dead ? 'dead' : 'unconscious'}).`;
    const c = creatureOf(p)!, works = worksFn(p, c);
    const n = Math.min(hands, c.parts.filter(x => x.flags.includes('GRASP') && works(x)).length);
    if (!n) return `${who} has no working hand to hold with.`;
    const g = grip(p, () => gauss(rng)) * forceFactor(limbCold(p, 'arm')) * (fingertips ? FINGERTIP_SHARE[climber] ?? FINGERTIP_SHARE.no : 1);
    const load = hanging ? p.mass : load_kg ?? 0, per = load / n;
    const norm = gripNorm(p.age, p.sex, p.region ?? null);
    const cold = forceFactor(limbCold(p, 'arm')) < 1 ? ', hands weakened by cold' : '';
    const hand = `${n === 1 ? 'one hand' : `${n} hands`}${fingertips ? ', fingertips only' : ''}${cold}`;
    console.debug?.('[Rules engine]', who, `${round(per)} kg per hand; grip ${round(g)} kg; norm ${round(norm.mean)} ± ${round(norm.sd)} kg`);
    if (per > g) return `${who} cannot hold it: too heavy for ${p.sex === 'female' ? 'her' : 'his'} grip (${hand}).`;
    // Hold time at a share f of maximal grip: ET = 33.55 f^−1.61 s (grip power model, Frey Law & Avin 2010, Ergonomics 53:109,
    // Table 2, meta-analysis of static endurance; R² 0.748).
    const et = 33.55 * Math.max(0.05, per / g) ** -1.61;
    if (seconds != null) return `${who} ${et >= seconds ? `holds it for the ${seconds} s` : `lets go after ${round(et)} s: the grip tires`} (${hand}).`;
    return `${who} holds it, for about ${round(et)} s before the grip gives out (${hand}).`;
}

// Running speed (§6.7): the creature's fastest DF walking gait [RAW]; DF gait value v (ticks per 100 tiles) → km/h = 8775 ÷ v,
// the constant matching the speeds written beside the gait variations in the DF raws (human 225 → 39 km/h, dog 149 → 59, horse
// 125 → 70). × the share of working legs (stance) [ASSUMED proportional]; no legs → 0.
// Humans: flying 20 m sprint of untrained adults, 3.6 ± 0.4 s for 149 women and 2.9 ± 0.3 s for 84 men, mean age 43
// (Manderoos 2020, Univ. Helsinki doctoral thesis, Study II, Table 4): 20.0 ± 2.2 and 24.8 ± 2.6 km/h (SD by the delta
// method). Each person keeps one draw (runZ); sex unknown takes the mean.
const HUMAN_RUN: Record<string, { mean: number; sd: number }> = { female: { mean: 20.0, sd: 2.2 }, male: { mean: 24.8, sd: 2.6 } };
// Age: World Masters Athletics 100 m age factors (2023 edition, five-year table): the best time at an age is the open best ÷
// the factor, so speed scales with it; 1 up to 35, linear between the listed ages. The sample's mean age 43 is the base
// [ASSUMED: untrained people decline with age as the age records do]; under 18 has no factor here.
const AGES = [35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110];
const AGE_100M: Record<string, number[]> = {
    female: [1, .9810, .9441, .9080, .8726, .8379, .8038, .7705, .7377, .7040, .6590, .6011, .5302, .4464, .3497, .2400],
    male: [.9999, .9668, .9345, .9031, .8726, .8429, .8139, .7858, .7584, .7317, .6946, .6396, .5666, .4757, .3669, .2400],
};
function ageFactor(sex: string, age: number): number {
    const f = AGE_100M[sex] ?? AGE_100M.female.map((x, i) => (x + AGE_100M.male[i]) / 2);
    if (age <= AGES[0]) return f[0];
    if (age >= AGES[AGES.length - 1]) return f[f.length - 1];
    const i = AGES.findIndex(a => a > age) - 1;
    return f[i] + (f[i + 1] - f[i]) * (age - AGES[i]) / 5;
}

export function topSpeedKmh(p: Person, rng: Rng = Math.random): number {
    const c = creatureOf(p);
    const g = c?.gaits?.filter(x => x.type === 'WALK') ?? [];
    if (!g.length || p.dead || p.unconscious) return 0;
    const st = abilities(p).stance ?? 1;
    if (p.species === 'HUMAN') {
        // Body fat and sprint time correlate r = 0.50 (20 m, 23 male college soccer players: Ishida, Travis & Stone 2021,
        // J Funct Morphol Kinesiol 6:7); within 12 elite female sprinters followed 5–10 years, partial r = 0.46–0.50 (abstract,
        // authors not on record). BMI stands for body fat [ASSUMED]: speed z = −0.5 BMI z + √0.75 × own draw, when BMI z is known.
        p.runZ ??= Math.max(-3, Math.min(3, p.bmiZ == null ? gauss(rng) : -0.5 * p.bmiZ + Math.sqrt(0.75) * gauss(rng)));
        const n = HUMAN_RUN[p.sex ?? ''] ?? { mean: (20.0 + 24.8) / 2, sd: (2.2 + 2.6) / 2 };
        const age = p.age != null && p.age >= 18 ? ageFactor(p.sex ?? '', p.age) / ageFactor(p.sex ?? '', 43) : 1;
        return Math.max(3, (n.mean + p.runZ * n.sd) * age) * st;
    }
    return 8775 / Math.min(...g.map(x => x.max)) * st;
}

/** A chase over open ground: does the pursuer catch the one fleeing, starting `gap_m` apart, both at full speed? */
export function chase(pn: string, pursuer: Person, fn: string, fleeing: Person, gap_m: number, rng: Rng = Math.random): string {
    const vp = topSpeedKmh(pursuer, rng) / 3.6, vf = topSpeedKmh(fleeing, rng) / 3.6;
    const lame = (q: Person) => (abilities(q).stance ?? 1) < 1 ? ', slowed by injured legs' : '';
    console.debug?.('[Rules engine]', `${pn} ${round(vp * 3.6)} km/h, ${fn} ${round(vf * 3.6)} km/h`);
    if (vp <= vf) return `${fn} gets away: ${pn} is not faster${lame(pursuer)}.`;
    return `${pn} catches ${fn} after ${round(gap_m / (vp - vf), 1)} s, ${round(vp * gap_m / (vp - vf))} m run: ${pn} is faster${lame(fleeing)}.`;
}

/** Whether `ls` hears a sound (preset `sound` or `spl_db` at 1 m) at `distance` m (§6.2). */
export function listen(ls: string, l: Person, { sound = undefined as string | undefined, spl_db = null as number | null, distance = 1, noise = 'quiet room (25 dB)', barrier = 'none' } = {}): string {
    const lc = creatureOf(l);
    if (!lc) return 'Creature data is not loaded.';
    if (l.dead || l.unconscious) return `${ls} perceives nothing (${l.dead ? 'dead' : 'unconscious'}).`;
    const spl = spl_db ?? (sound ? SOUNDS[classOf(SOUNDS, sound) ?? ''] : undefined);
    if (spl == null) return `Unknown sound "${sound}". Known: ${Object.keys(SOUNDS).join(', ')}; or give spl_db at 1 m.`;
    const ear = earOf(l, lc);
    if (ear.ears && !ear.earsOk) return `${ls} cannot hear (no working ear).`;
    const r = hearSound({ spl, distance, barrier, noise, ...ear });
    const what = `${sound ?? `${spl} dB at 1 m`} at ${distance} m, ${noise}${barrier !== 'none' ? `, through ${barrier}` : ''}`;
    console.debug?.('[Rules engine]', ls, `margin ${r.margin} dB`);
    return r.audible ? `${ls} hears it (${what}).` : `${ls} does not hear it: too faint over the background (${what}).`;
}

export interface MessageInput {
    means?: 'speech' | 'gesture'; lit?: boolean; languages?: (string[] | null | undefined)[]; distance?: number; effort?: Effort;
    noise?: string; noise_db?: number | null; barrier?: string; louder_db?: number; brazil?: boolean;
}

/** Species whose speech the world book sets against the DF raws (trolls that talk), by DF creature id. */
export const SPEECH_OVERRIDE: Record<string, boolean> = {};

export function communicate(sp: string, s: Person, ls: string, l: Person, { means = 'speech', lit = true, languages = [null, null], distance = 1, effort = 'normal', noise = 'quiet room (25 dB)', noise_db = null, barrier = 'none', louder_db = 0, brazil = false }: MessageInput = {}): string {
    const sc = creatureOf(s), lc = creatureOf(l);
    if (!sc || !lc) return 'Creature data is not loaded.';
    const talks = (c: Creature) => SPEECH_OVERRIDE[c.id] ?? (c.flags.includes('CAN_SPEAK') || c.flags.includes('INTELLIGENT'));
    const anyWorks = (p: Person, c: Creature, test: (x: Part) => boolean) => { const parts = c.parts.filter(test); const w = worksFn(p, c); return parts.length ? parts.some(w) : null; };
    const flag = (f: string) => (x: Part) => x.flags.includes(f);
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
    // Distance, background noise and walls (§4.3 Speech Intelligibility Index): one working ear of two hears 3 dB worse
    // (binaural summation); bands outside the species' 60-dB range are not heard.
    const r = reach({ effort, spl: louder_db && !/whisper/.test(effort) ? SPEECH_SPL[effort] + louder_db : null, distance, barrier, noise, noiseDb: noise_db, ...earOf(l, lc) });
    l.heard = { from: sp, snr: r.snr, whisper: /whisper/.test(effort) };
    const where = `${/whisper/.test(effort) ? effort : `${effort} voice`} at ${distance} m, ${noise_db ?? noise}${barrier !== 'none' ? `, through ${barrier}` : ''}`;
    if (!r.audible) return `${ls} goes on as before; ${sp}'s voice is lost in the background (${where}).`;
    console.debug?.('[Rules engine]', ls, `words ${Math.round(r.words * 100)} %, SII ${r.sii}`);
    if (r.words < 0.2) return `${ls} hears ${sp}'s voice; the words are lost in the noise (${where}).`;
    if (!talks(lc)) return `${ls} hears the sounds and their tone; the words carry no meaning (${lc.name}: cannot talk).`;
    const [a, b] = languages;
    let words = r.words, related = '';
    if (a?.length && b?.length && !a.some(x => b.includes(x))) {
        // A related language the listener knows carries part of the words (intelligibility.ts).
        const rel = relatedShare(b, a, brazil);
        if (!rel) return `${ls} hears speech in a language it does not know (${a.join(', ')}); only tone and gestures carry.`;
        words *= rel.share;
        related = `; ${rel.heard} understood through ${rel.from}`;
    }
    // Share of key words → plain words (bands [ASSUMED]): the narrator gets how much of the message carries, not a figure.
    const heard = words >= 0.95 ? 'every word' : words >= 0.7 ? 'most words; a few are lost' : words >= 0.4 ? 'some words; the gist only' : 'scattered words; not the meaning';
    return `${ls} hears ${sp} and makes out ${heard} (${where}${related})${slurred ? '; slurred (tongue not working): short, simple words only' : ''}.`;
}

// Interruptions (NetHack occupations, Pathos Interrupt): time stops at the first change in anyone's condition.
const waterStage = (p: Person) => { const pct = p.needs ? p.needs.waterL / p.mass * 100 : 0; return pct >= 8 ? 3 : pct >= 5 ? 2 : pct >= 2 ? 1 : 0; };
type Watch = ReturnType<typeof watch>;
const watch = (p: Person) => ({
    dead: p.dead, cls: bloodClass(p), dying: p.deathIn !== null, out: p.unconscious ?? null, thirst: waterStage(p),
    exhausted: !!p.exhausted, ams: !!p.altitude?.ams, oedema: !!p.altitude?.oedema,
    heat: coreStage(p.thermal?.stageCore ?? p.thermal?.core), core: p.thermal?.core, swim: !!p.swimFailed, frost: p.wounds.filter(w => w.type === 'frostbite').map(w => w.part),
    infected: p.wounds.filter(w => w.infection === true).map(w => w.id), sepsis: !!p.sepsis, peritonitis: !!p.peritonitis,
});

// Quantities whose thresholds mark events, and the thresholds: blood lost share (classes at 15, 30, 40 %), carboxyhaemoglobin
// (unconscious 30 %, dead 40 %), water deficit as % of body mass (thirst 2, 5, 8), work done ÷ the day's limit (exhausted at 1),
// core temperature (heat stroke above 40 °C rising; hypothermia stages below 35, 32, 28, 24 falling).
type Levels = Record<'loss' | 'hb' | 'water' | 'work' | 'core', number>;
const levels = (p: Person): Levels => ({ loss: lossFraction(p), hb: p.co?.hb ?? 0, water: p.needs ? p.needs.waterL / p.mass * 100 : 0, work: p.needs?.work ?? 0, core: p.thermal?.stageCore ?? p.thermal?.core ?? 37 });
const UP: Partial<Record<keyof Levels, number[]>> = { loss: [0.15, 0.3, 0.4], hb: [0.3, 0.4], water: [2, 5, 8], work: [1], core: [40] };
const DOWN: Partial<Record<keyof Levels, number[]>> = { core: [35, 32, 28, 24] };
function crossing(a: Levels, b: Levels): number {
    let f = 1;
    for (const key of Object.keys(a) as (keyof Levels)[]) {
        for (const t of UP[key] ?? []) if (a[key] < t && b[key] >= t) f = Math.min(f, (t - a[key]) / (b[key] - a[key]));
        for (const t of DOWN[key] ?? []) if (a[key] >= t && b[key] < t) f = Math.min(f, (a[key] - t) / (a[key] - b[key]));
    }
    return f;
}

function changes(who: string, a: Watch, b: Watch): string[] {
    const out: string[] = [];
    if (b.dead && !a.dead) out.push(`${who} dies (${b.dead})`);
    else {
        if (b.cls > a.cls) out.push(`${who} reaches blood-loss class ${['I', 'II', 'III', 'IV'][b.cls - 1]}`);
        if (b.dying && !a.dying) out.push(`${who} is dying`);
        if (a.out && !b.out) out.push(`${who} comes to`);
        if (b.thirst > a.thirst) out.push(`${who} is ${b.thirst === 3 ? 'severely dehydrated (8 % of body mass)' : b.thirst === 2 ? 'dehydrated (5 % of body mass)' : 'thirsty (2 % of body mass lost)'}`);
        if (!a.out && b.out) out.push(`${who} loses consciousness (${b.out})`);
        for (const id of b.infected) if (!a.infected.includes(id)) out.push(`${who}: wound ${id} is infected`);
        if (b.sepsis && !a.sepsis) out.push(`${who}: the infection has reached the blood (sepsis)`);
        if (b.peritonitis && !a.peritonitis) out.push(`${who}: the gut is opened (peritonitis)`);
        if (b.heat !== a.heat) out.push(`${who}: ${b.heat ?? 'core temperature between 35 and 40 °C'} (core ${b.core} °C)`);
        if (b.exhausted && !a.exhausted) out.push(`${who} is exhausted and cannot keep working or walking`);
        if (b.ams && !a.ams) out.push(`${who} has acute mountain sickness`);
        if (b.oedema && !a.oedema) out.push(`${who} has high-altitude pulmonary or cerebral oedema`);
        if (b.swim && !a.swim) out.push(`${who}: arms too cold to keep swimming`);
        const frost = b.frost.filter(x => !a.frost.includes(x));
        if (frost.length) out.push(`${who}: frostbite on ${frost.join(', ')}`);
    }
    return out;
}

/** Advances everyone minute by minute; stops at the end of the first minute in which a condition changes. */
export function advanceAll(people: Record<string, Person>, minutes: number, resting: Set<string> = new Set(), rng: Rng = Math.random, { active = new Set<string>(), sleeping = new Set<string>(), eachMinute = null as null | (() => void) } = {}): { elapsed: number; events: string[] } {
    const total = Math.max(0, Math.round(minutes));
    for (let m = 1; m <= total; m++) {
        eachMinute?.();
        const events: string[] = [];
        let frac = 1;
        for (const [who, p] of Object.entries(people)) {
            const before = watch(p), lv = levels(p);
            advance(p, 1, resting.has(who), rng, { active: active.has(who), sleeping: sleeping.has(who) });
            const ev = changes(who, before, watch(p));
            if (ev.length) { events.push(...ev); frac = Math.min(frac, crossing(lv, levels(p))); }
        }
        // The event's moment inside the minute: where the first quantity that crossed its threshold crossed it, the quantity taken
        // as changing evenly over the minute [ASSUMED]; events with no such quantity count at the minute's end.
        if (events.length) return { elapsed: m - 1 + frac, events };
    }
    return { elapsed: total, events: [] };
}

// Checks: success when capacity ≥ demand (stress–strength interference; IRT normal ogive). `share` = fraction of
// people with the actor's training who succeed unhurt; demand sits where that share of capacities lies above it.
const CAPACITY_CV = 0.19;  // Dodds 2014 grip: peak 51 / 31 kg, weak cut 27 / 16 kg = peak − 2.5 SD → SD / mean 0.19
const FORCE_SCORES = ['grasp', 'stance'];
const EXERTION_FAILS_AT: Record<string, number> = { heavy: 2 };  // blood-loss class II: heavy exertion fails

// Abramowitz & Stegun 7.1.26 (error < 1.5e-7); Acklam's inverse (relative error < 1.2e-9).
function normCdf(x: number): number {
    const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
    const e = 1 - t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x / 2);
    return x >= 0 ? (1 + e) / 2 : (1 - e) / 2;
}
function normInv(p: number): number {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const tail = (q: number) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
    if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
    const q = p - 0.5, r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/** A BodyCheck task: the success share, abilities used, exertion and conditions. */
export interface Task {
    task?: string; share?: number | string; uses?: string[]; exertion?: 'none' | 'light' | 'heavy'; on_feet?: boolean; timed?: boolean; fine?: boolean; override?: boolean;
}
type Odds = { chance: number; limit?: string };
/** Chance of success and the ability that limits it. Non-force abilities between 0 and 1 change nothing yet (OPEN-66). */
function checkOdds(p: Person, { share, uses = [], exertion = 'none', on_feet = false, timed = false, fine = false }: Task): Odds {
    if (p.dead) return { chance: 0 };
    if (p.unconscious) return { chance: 0, limit: `unconscious (${p.unconscious})` };
    if (exertion === 'heavy' && p.needs && p.needs.waterL / p.mass * 100 >= 8) return { chance: 0, limit: 'dehydration' };
    const cls = bloodClass(p);
    if (cls === 4 || (cls >= 3 && on_feet) || cls >= (EXERTION_FAILS_AT[exertion] ?? 5)) return { chance: 0, limit: `blood-loss class ${['I', 'II', 'III', 'IV'][cls - 1]}` };
    const scores = abilities(p);
    // Cold limbs lower force capacity (§6.4).
    if (scores.grasp != null) scores.grasp *= forceFactor(limbCold(p, 'arm'));
    if (scores.stance != null) scores.stance *= forceFactor(limbCold(p, 'leg'));
    // Fine finger work: × finger dexterity at the hand skin temperature (Daanen 2009) (§6.4).
    if (fine && scores.grasp != null) scores.grasp *= fineFactor(handSkin(p));
    // Low core temperature slows thinking; accuracy holds given time (Coleshaw et al. 1983). A timed task treats the speed
    // as a capacity with the force spread [ASSUMED].
    if (timed && uses.includes('alertness') && coolCore(p) > 0) scores.thinking = thinkSpeed(p);
    // Altitude: heavy exertion is limited by aerobic capacity (§6.6); acute mountain sickness: symptoms that force a reduction
    // in activity (Maggiorini et al. 1998) → heavy exertion fails [ASSUMED].
    if (p.sepsis && exertion === 'heavy') return { chance: 0, limit: 'sepsis' };
    // Peritonitis: abdominal rigidity and pain on movement (its defining signs) → heavy exertion fails [ASSUMED].
    if (p.peritonitis && !p.peritonitis.repaired && exertion === 'heavy') return { chance: 0, limit: 'peritonitis' };
    if (p.exhausted && exertion !== 'none') return { chance: 0, limit: 'exhausted' };
    if (p.altitude && exertion === 'heavy' && (p.altitude.ams || p.altitude.oedema)) return { chance: 0, limit: 'altitude sickness' };
    if (exertion === 'heavy' && thermalCapable(p.species)) { const a = vo2avail(p) / vo2max(p); if (a < 1) scores.aerobic = a; }
    // Heat: no slowing measured at 38.6 °C core (reaction 40 ms faster; Barry et al. 2022, Appl Physiol Nutr Metab 47:261);
    // heat stroke is defined by nervous-system dysfunction (disorientation): attention tasks fail [ASSUMED from the definition].
    if (uses.includes('alertness') && p.env && coreStage(p.thermal?.stageCore ?? p.thermal?.core) === 'heat stroke') return { chance: 0, limit: 'heat stroke: disoriented' };
    // Hypothermia II is defined by impaired consciousness (Swiss staging, Brown et al. 2012): attention tasks fail [ASSUMED].
    if (uses.includes('alertness') && p.env && coreStage(p.thermal?.stageCore ?? p.thermal?.core) === 'hypothermia II') return { chance: 0, limit: 'hypothermia II: impaired consciousness' };
    type Key = keyof Scores;
    const lacking = uses.find(u => u in FUNCTIONS && !(u in scores));
    if (lacking) return { chance: 0, limit: `no ${lacking}` };
    const used = uses.filter((u): u is Key => u in scores);
    const risk = uses.includes('alertness') ? crashRisk(impairmentBac(p)) : 1;
    const zero = used.find(u => scores[u] === 0);
    if (zero) return { chance: 0, limit: `no working ${zero}` };
    for (const k of ['thinking', 'aerobic'] as const) if (k in scores) used.push(k);
    const force = used.filter(u => FORCE_SCORES.includes(u) || u === 'thinking' || u === 'aerobic').sort((x, y) => scores[x]! - scores[y]!)[0];
    const s = force ? scores[force]! : 1;
    const base = Math.max(0, Math.min(1, Number(share) || 0));
    const alert = (r: number, limit?: string): Odds => risk > 1.005
        ? { chance: r >= 1 ? 1 : r / (r + (1 - r) * risk), limit: [limit, 'impaired alertness'].filter(Boolean).join('; ') }
        : { chance: r, limit };
    const demand = 1 - normInv(Math.min(0.999, base)) * CAPACITY_CV;
    const out = s >= 1 || base === 0 ? alert(base) : alert(normCdf((s - demand) / (s * CAPACITY_CV)), `reduced ${force}`);
    // Hand work under sight with some eyes lost: grasp errors × 4 and grasping 56 % slower with one eye (Mroczkowski &
    // Niechwiej-Szwedo 2021, Exp Brain Res 239:1345, precision reach-to-grasp, 20 people).
    // DF paralysis syndrome (giant cave spider): the body cannot move [RAW CE_PARALYSIS].
    if (p.venom && (uses.includes('grasp') || uses.includes('stance') || exertion !== 'none') && activeSymptoms(p.venom).some(e => e.kind === 'paralysis'))
        return { chance: 0, limit: 'paralysed by venom' };
    // DIZZINESS: "occasional fainting and a general slowdown" → checks on feet fail [ASSUMED].
    if (p.venom && on_feet && activeSymptoms(p.venom).some(e => e.kind === 'dizziness')) return { chance: 0, limit: 'dizzy from venom' };
    if (uses.includes('sight') && uses.includes('grasp') && scores.sight != null && scores.sight > 0 && scores.sight < 1)
        return { chance: Math.max(0, 1 - 4 * (1 - out.chance)), limit: [out.limit, 'sight from one eye only'].filter(Boolean).join('; ') };
    return out;
}

export const checkChance = (p: Person, task: Task) => checkOdds(p, task).chance;

// Tasks a specialist tool decides from data (§7.1): BodyCheck refuses them so the narrator's `share` estimate is not used.
const ROUTES: [RegExp, string][] = [[/\b(hear|hears|heard|listen|overhear|noise)\b/i, 'Listen (sounds) or Communicate (speech)'],
    [/\b(see|sees|spot|spots|notice|notices|recogni[sz]e|identify|sight)\b/i, 'Look'],
    [/\b(swim|swims|drown|tread water)\b/i, 'BodyEnvironment (immersed, swimming, swimmer)'],
    [/\b(hang|hangs|hold on|holding on|carry|carries|grip)\b/i, 'HoldOn'],
    [/\b(chase|outrun|catch up|run away|flee|escape on foot)\b/i, 'Chase'],
    [/\b(lie|lying|deceive|bluff|believe)\b/i, 'SocialResponse (a statement that might be a lie)'],
    [/\b(shoot|shot|arrow|bolt|aim)\b/i, 'BodyStrike (launcher, skill, distance_m)'],
    [/\b(tourniquet|stop the bleeding|bleed)\b/i, 'BodyTreat (stop_bleeding, training)'],
    [/\b(attracted|interested in|ask (him|her|them) out|date)\b/i, 'SocialResponse (a brief first meeting)'],
    [/\b(battle|assault|storm(s|ing)? the|take the (fort|town|hill|bridge|trench|position))\b/i, 'Battle (attackers, defenders, year)']];

export function check(p: Person, task: Task, rng: Rng = Math.random): string {
    const route = ROUTES.find(([re]) => re.test(task.task ?? ''));
    if (route && !task.override) return `${task.task}: decided by ${route[1]}, not BodyCheck. Call that tool. (If this task is genuinely different, call BodyCheck again with override: true.)`;
    const { chance, limit } = checkOdds(p, task);
    const ok = rng() < chance;
    console.debug?.('[Rules engine]', task.task, `chance ${round(chance * 100, 2)} %`);
    // The cause is stated either way: an outcome without one invites the narrator to invent it.
    return ok ? `${task.task}: SUCCESS${limit ? `, despite ${limit}` : ''}.`
        : `${task.task}: FAILURE, ${limit ? `because of ${limit}` : 'an ordinary failure: no injury or condition caused it'}.`;
}
