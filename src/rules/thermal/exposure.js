// Air exposure of a tracked person through JOS-3 (docs/df-body-engine.md §6.4): clothing, activity, water lost by sweating and
// breathing, core-temperature stages and freezing skin.
import { createBody, step, coreOf, skinOf, basalMet, SEGMENTS, LOCAL_BSA } from './jos3.js';
import { ENSEMBLES, GARMENTS } from './ensembles.js';

// Body plans DF builds like the human one use the human model [ASSUMED]; other species are not simulated (OPEN-82).
const HUMANLIKE = new Set(['HUMAN', 'DWARF', 'ELF', 'GOBLIN']);
export const thermalCapable = species => HUMANLIKE.has(String(species ?? 'HUMAN').toUpperCase());

// Compendium of Physical Activities (Ainsworth et al. 2011): sleeping 0.95 MET, sitting quietly 1.3, walking 3.0 mph 3.5.
const MET = { sleeping: 0.95, resting: 1.3, active: 3.5 };
// Danielsson 1996 (J Appl Physiol 81:2666): frostbite risk rises from 5 % to 95 % as skin falls from −4.8 to −7.8 °C, a normal
// spread of freezing temperatures: mean −6.3 °C, SD 3 ÷ 3.29 = 0.91 °C.
const FREEZE_MEAN = -6.3, FREEZE_SD = 0.91;
// Weather wind (10 m) to the air speed at the body (1.1 m): logarithmic profile, open terrain z0 = 0.01 m (Oke 1987, as in
// pythermalcomfort scale_wind_speed_log): ln(1.1 / 0.01) ÷ ln(10 / 0.01) = 0.68.
export const BODY_WIND = Math.log(1.1 / 0.01) / Math.log(10 / 0.01);
// Bare skin in wind: Canadian wind chill index (JAG/TI 2001; valid at or below 10 °C with wind of at least 4.8 km/h), and the
// time for exposed skin to freeze by index range (Environment and Climate Change Canada categories, as published by the
// Coaching Association of Canada): −28 to −39: 10–30 min; −40 to −47: 5–10; −48 to −54: 2–5; −55 or colder: under 2.
export const windChill = (t, kmh) => t > 10 || kmh < 4.8 ? null : 13.12 + 0.6215 * t - 11.37 * kmh ** 0.16 + 0.3965 * t * kmh ** 0.16;
const FREEZE_MIN = [[-55, [0, 2]], [-48, [2, 5]], [-40, [5, 10]], [-28, [10, 30]]];
const freezeMinutes = wci => wci == null ? null : FREEZE_MIN.find(([lim]) => wci <= lim)?.[1] ?? null;

const REGION = {
    head: ['head'], face: ['head'], neck: ['neck'], chest: ['chest'], back: ['back'], pelvis: ['pelvis'], hips: ['pelvis'],
    'upper body': ['chest', 'back'], 'lower body': ['pelvis'], torso: ['chest', 'back', 'pelvis'],
    shoulders: ['left_shoulder', 'right_shoulder'], 'upper arms': ['left_shoulder', 'right_shoulder'], forearms: ['left_arm', 'right_arm'],
    'lower arms': ['left_arm', 'right_arm'], arms: ['left_shoulder', 'left_arm', 'right_shoulder', 'right_arm'], hands: ['left_hand', 'right_hand'],
    thighs: ['left_thigh', 'right_thigh'], 'upper legs': ['left_thigh', 'right_thigh'], 'lower legs': ['left_leg', 'right_leg'],
    shins: ['left_leg', 'right_leg'], legs: ['left_thigh', 'left_leg', 'right_thigh', 'right_leg'], feet: ['left_foot', 'right_foot'],
};
function segmentsOf(word) {
    const w = String(word).toLowerCase().trim();
    if (REGION[w]) return REGION[w];
    const seg = w.replace(/\s+/g, '_').replace(/upper_arm$/, 'shoulder').replace(/lower_arm$/, 'arm').replace(/upper_leg$/, 'thigh').replace(/lower_leg$/, 'leg');
    if (SEGMENTS.includes(seg)) return [seg];
    throw new Error(`Unknown body region "${word}". Use: ${[...Object.keys(REGION), ...SEGMENTS.map(s => s.replace('_', ' '))].join(', ')}.`);
}

/**
 * Local clo for the 17 segments. clothing: { ensemble } (a measured ensemble), and/or { garments: [{ name | clo, covers }] }:
 * a garment's whole-body clo spread over the segments it covers, local clo = clo × body area ÷ covered area (keeps the
 * area-weighted mean) [ASSUMED]; garments add up (ASHRAE 55 summation).
 */
export function clothingClo(clothing = {}) {
    const out = new Array(SEGMENTS.length).fill(0);
    if (clothing.ensemble) {
        const key = Object.keys(ENSEMBLES).find(k => k.toLowerCase() === String(clothing.ensemble).toLowerCase());
        if (!key) throw new Error(`Unknown ensemble "${clothing.ensemble}". Known: ${Object.keys(ENSEMBLES).join('; ')}.`);
        ENSEMBLES[key][1].forEach((x, i) => { out[i] += x; });
    }
    const total = LOCAL_BSA.reduce((s, x) => s + x, 0);
    for (const g of clothing.garments ?? []) {
        const clo = g.clo ?? GARMENTS[String(g.name).toLowerCase()];
        if (clo == null) throw new Error(`Unknown garment "${g.name}". Give its clo, or one of: ${Object.keys(GARMENTS).join('; ')}.`);
        const segs = [...new Set((g.covers ?? []).flatMap(segmentsOf))];
        if (!segs.length) throw new Error(`Garment "${g.name ?? g.clo}" needs covers (body regions).`);
        const area = segs.reduce((s, x) => s + LOCAL_BSA[SEGMENTS.indexOf(x)], 0);
        for (const x of segs) out[SEGMENTS.indexOf(x)] += clo * total / area;
    }
    return out;
}

// Water: still fresh water 220 W/m²K (range 100–230); moving 427 at 0.5 m/s to 580 at 0.75 m/s (Junaid et al. 2024, Heliyon
// e33022, citing Nadel et al. 1974). Clothing under water: its insulation is trapped air; water conducts 0.6 W/mK against air
// 0.026, so wet-through clothing keeps clo × 0.026 ÷ 0.6 [stated process].
export function waterHc(speed = 0) {
    if (speed < 0.5) return 220 + (427 - 220) * Math.max(0, speed) / 0.5;
    return Math.min(580, 427 + (580 - 427) * (speed - 0.5) / 0.25);
}
const WET_CLO = 0.026 / 0.6;
export function immersion(regions = []) {
    const segs = new Array(SEGMENTS.length).fill(false);
    const words = regions.map(r => String(r).toLowerCase());
    const all = words.includes('whole body') || words.includes('neck down');
    const under = words.includes('submerged') || words.includes('head');
    for (const s of all || under ? SEGMENTS.filter(x => x !== 'head') : words.flatMap(segmentsOf)) segs[SEGMENTS.indexOf(s)] = true;
    if (under) segs[0] = true;
    return segs;
}

const models = new Map();
function modelOf(params) {
    const key = JSON.stringify(params);
    if (!models.has(key)) {
        const body = createBody(params);
        // Water the model evaporates at its set point (neutral, nude, resting): the share of the 1.5 L/day resting loss
        // that is skin and breath; the rest (urine, stool) stays constant.
        body.neutralWaterGs = step({ ...body, t: [...body.t] }, body.neutral, 60, { passive: true }).waterGs;
        models.set(key, body);
    }
    return models.get(key);
}

/** JOS-3 body parameters: the person's mass (20–200 kg), height by geometric similarity from 1.72 m at 74.43 kg [ASSUMED]. */
function paramsOf(p) {
    const weight = Math.min(200, Math.max(20, p.mass || 70));
    return { height: Math.round(1.72 * (weight / 74.43) ** (1 / 3) * 1000) / 1000, weight, age: p.age ?? 20, sex: p.sex ?? 'male' };
}

/**
 * One minute in p.env. Returns { core, skin[17], waterL (all water lost this minute, given restL per minute at rest), frozen
 * (segments whose skin fell below the person's freezing temperature this minute) }.
 */
export function thermalMinute(p, { active = false, sleeping = false, restL = 0 } = {}, rng, gauss) {
    const th = p.thermal ??= { params: paramsOf(p), t: null, freezeC: null, frozen: [], bareDose: 0, bareQ: null };
    const body = modelOf(th.params);
    th.t ??= [...body.t];
    th.freezeC ??= Math.round((FREEZE_MEAN + FREEZE_SD * gauss()) * 100) / 100;
    th.bareQ ??= rng();  // where in each time range this person's skin freezes, uniform [ASSUMED]
    const e = p.env;
    const met = e.met ?? p.workMet ?? (sleeping ? MET.sleeping : active ? MET.active : MET.resting);
    // MET → multiple of basal metabolism: 1 MET = 1.163 W per kg (1 kcal/kg/h); JOS-3 needs at least 1.
    const par = Math.max(1, met * 1.163 * th.params.weight / basalMet(th.params.height, th.params.weight, th.params.age, th.params.sex));
    const posture = e.posture ?? (sleeping ? 'lying' : active ? 'standing' : 'sitting');
    const run = { ...body, t: th.t };
    // Shivering stops below 32 °C core (Swiss stage II: drowsy, not shivering; Brown et al. 2012).
    const water = e.water ? { tc: e.water.tc, hc: waterHc(e.water.speed), segs: e.water.segs } : null;
    const clo = (Array.isArray(e.clo) ? e.clo : new Array(SEGMENTS.length).fill(e.clo ?? 0)).map((c, i) => water?.segs[i] && !e.water.suit ? c * WET_CLO : c);
    const r = step(run, { tdb: e.tdb, tr: e.tr ?? e.tdb, rh: e.rh ?? 50, v: e.v ?? 0.1, clo, par, posture, water }, 60, { shivStopsBelow: 32 });
    th.t = run.t;
    const skin = skinOf(run);
    const frozen = SEGMENTS.filter((s, i) => skin[i] < th.freezeC && !th.frozen.includes(s));
    // Bare face and hands in wind: dose 1 ÷ (freezing time) per minute; above −28 the dose resets [ASSUMED rewarming].
    const range = freezeMinutes(windChill(e.tdb, e.wind10 ?? 0));
    if (!range) th.bareDose = 0;
    else {
        th.bareDose += 1 / Math.max(0.5, range[0] + th.bareQ * (range[1] - range[0]));
        if (th.bareDose >= 1) {
            th.bareDose = 0;
            for (const s of [...(e.faceBare ? ['head'] : []), ...(e.handsBare ? ['left_hand', 'right_hand'] : [])]) if (!th.frozen.includes(s) && !frozen.includes(s)) frozen.push(s);
        }
    }
    th.frozen.push(...frozen);
    th.core = Math.round(coreOf(run)[4] * 100) / 100;
    th.skinMin = Math.round(Math.min(...skin) * 10) / 10;
    th.coldest = SEGMENTS[skin.indexOf(Math.min(...skin))];
    const waterL = Math.max(0, restL - body.neutralWaterGs * 60 / 1000) + r.waterGs * 60 / 1000;
    // Food energy: JOS-3 total metabolic heat (basal, work, shivering, non-shivering), W × 60 s ÷ 4184 J/kcal.
    return { core: th.core, skin, waterL, frozen, kcal: r.qTotal * 60 / 4184 };
}

// Core temperature stages (pelvis core node as rectal temperature [ASSUMED]). Hypothermia: Brown et al. 2012, NEJM 367:1930
// (Swiss staging): I 35–32 °C awake, shivering; II 32–28 drowsy; III 28–24 unconscious; IV < 24 no vital signs.
// Heat stroke: core > 40 °C with nervous-system dysfunction (Gaudio & Grissom 2016, J Emerg Med 50:607, via Wikipedia "Heat stroke").
export function coreStage(core) {
    if (core == null) return null;
    if (core < 24) return 'hypothermia IV';
    if (core < 28) return 'hypothermia III';
    if (core < 32) return 'hypothermia II';
    if (core < 35) return 'hypothermia I';
    if (core > 40) return 'heat stroke';
    return null;
}

// Limb temperature effects (JOS-3 limb core node as muscle temperature [ASSUMED]): per °C below the model's set point, maximal
// isometric force −2 % and power and speed −4 to −6 % (5 % used) (Bergh & Ekblom 1979, Acta Physiol Scand 107:33, muscle
// 30–39 °C); motor nerve conduction −2.2 m/s (median nerve correction, Notermans et al. 1994, Muscle Nerve 17:516).
const LIMBS = { arm: ['left_arm', 'right_arm'], leg: ['left_leg', 'right_leg'] };
export function limbCold(p, limb) {
    const th = p?.thermal;
    if (!p?.env || !th?.t) return 0;
    const body = modelOf(th.params);
    const idx = LIMBS[limb].map(s => SEGMENTS.indexOf(s));
    const core = coreOf({ t: th.t });
    return Math.max(0, idx.reduce((a, i) => a + body.setCr[i] - core[i], 0) / idx.length);
}
export const forceFactor = dT => Math.max(0, 1 - 0.02 * dT);
export const speedFactor = dT => Math.max(0, 1 - 0.05 * dT);
export const NERVE_PER_C = 2.2;

export { SEGMENTS };
