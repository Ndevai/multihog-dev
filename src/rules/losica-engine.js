export const DAY_MIN = 30804 / 60;
const HOUR = 60 / DAY_MIN;

const BLEED = { femoral: [300, 600], limb_artery: [70, 170], small: [1, 10] };
const FRACTURE = {
    arm_spiral: [58.9, 117.8], arm_transverse: [117.8, 235.6],
    leg_spiral: [117.8, 235.6], leg_transverse: [235.6, 471.1],
};
const NONUNION = { default: 0.02, shin: 0.05, wrist: 0.125 };
const OPEN_FRACTURE_INFECTION = { I: 0.05, II: 0.08, IIIA: 0.12, IIIB: 0.25, IIIC: 0.40 };
const EARTH_DAY = 86400 / 30804;
// Rule 576, Earth days; converted with EARTH_DAY. Missing types are OPEN-48/49: they do not close yet.
const CUT_HEAL = { eyes: [3, 5], mouth: [3, 5], head: [7, 10], arm: [7, 10], torso: [10, 14], leg: [10, 14], hand: [10, 14], foot: [10, 14] };
const BURN_HEAL = { superficial: [5, 10], partial: [7, 21], deep_partial: [21, 56], full: null };
const INFECTION_ONSET = { bite: 1, other: 10 };
const CROOKED_GRIP = 0.51;
const COST = [0, 40, 64, 107, 178, 297, 495, 825, 1375, 2292];
const FALL_ROWS = [[10.1, 0.44], [13.2, 0.56], [16.2, 0.78]];
// Cataclysm: DDA body_parts.json limb_scores (commit 935fe5f). A person's score = sum over parts.
const PART_SCORES = {
    head: { reaction: 0.3 },
    eyes: { vision: 1, night_vision: 1, reaction: 0.7 },
    mouth: { breathing: 1, manipulation: 0.05, drinking: 1, eating: 1 },
    torso: { balance: 0.7 },
    arm: { manipulation: 0.1, lifting: 0.5, balance: 0.15, blocking: 1, swimming: 0.1, crawling: 0.3 },
    hand: { grip: 0.5, manipulation: 0.5, swimming: 0.15 },
    leg: { manipulation: 0.1, movement: 0.5, swimming: 0.15, blocking: 1, crawling: 0.2 },
    foot: { manipulation: 0.1, footing: 0.5, swimming: 0.1 },
};
const PAIRED = ['arm', 'hand', 'leg', 'foot'];
const WOUND_EXEMPT = ['balance'];

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

export function newPerson(massKg = 70) {
    return {
        mass: massKg, lost: 0, red: 0, wounds: [], nextId: 1, dead: null, deathIn: null, minute: 0,
        net: { C: 40, N: 0, R: 40, P: 1, F: 0, E: 0, width: 0, maxToday: false },
    };
}

export function person(state, who, massKg) {
    state.people ??= {};
    state.people[who] ??= newPerson(massKg);
    return state.people[who];
}

export const bloodVolume = p => p.mass * 70;
// Syverud 1989 (swine, steady femoral bleed 1.0 / 1.25 mL/kg/min): death at 50.2 / 49.8 mL/kg lost.
const LETHAL_LOSS_ML_KG = 50;
export const lossFraction = p => p.lost / bloodVolume(p);

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

export function addWound(p, w, rng = Math.random) {
    const wound = { id: p.nextId++, part: w.part, type: w.type, bleed: 0, age: 0, cleanedAt: null, infection: null, splinted: false, heals: null, healed: false };
    const healRange = w.type === 'cut' ? CUT_HEAL[w.part.replace(/_(l|r)$/, '')] : w.type === 'burn' ? BURN_HEAL[w.depth] : null;
    if (w.type === 'burn') wound.depth = BURN_HEAL[w.depth] !== undefined ? w.depth : null;
    if (healRange) wound.heals = round(between(rng, healRange) * EARTH_DAY);
    if (w.vessel && BLEED[w.vessel]) wound.bleed = round(between(rng, BLEED[w.vessel]));
    if (w.type === 'fracture') {
        // Head, eyes, mouth and torso have no timetable (OPEN-58): joins stays null.
        const limb = /arm|hand|leg|foot/.test(w.part);
        const kind = FRACTURE[w.fracture] ? w.fracture : !limb ? null : /leg|foot/.test(w.part) ? 'leg_spiral' : 'arm_spiral';
        wound.fracture = { kind, joins: kind ? FRACTURE[kind][0] : null, full: kind ? FRACTURE[kind][1] : null, crooked: false,
            never: kind ? rng() < (NONUNION[w.bone] ?? NONUNION.default) : false };
        if (w.openGrade && OPEN_FRACTURE_INFECTION[w.openGrade]) wound.openGrade = w.openGrade;
    }
    if (['cut', 'puncture', 'bite', 'burn'].includes(w.type) || wound.openGrade) wound.open = true;
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
    const gain = net.E > 0 ? 0.2909 * net.E ** 0.4063 : 0;
    net.width += gain;
    const grown = Math.floor(net.width);
    net.width -= grown;
    net.C += grown;
    if (net.maxToday && net.F >= 0.4278 * net.C && net.C >= 4000 * (net.N + 1) && net.N < 12) net.N += 1;
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
            const refill = Math.min(p.lost, bloodVolume(p) * 0.4 / (4.2 * DAY_MIN));
            p.lost -= refill; p.red += refill;
        }
        p.red = Math.max(0, p.red - 500 / (98.2 * DAY_MIN));
        if (resting) net.R = Math.min(net.C, net.R + 0.05 * net.C / 60);
        for (const w of p.wounds) {
            w.age += 1 / DAY_MIN;
            if (w.fracture && !w.fracture.never && w.fracture.joins !== null) { w.fracture.joins -= 1 / DAY_MIN; w.fracture.full -= 1 / DAY_MIN; }
            if (w.heals !== null && !w.healed && w.age >= w.heals) { w.healed = true; w.bleed = 0; }
            const onset = INFECTION_ONSET[w.type === 'bite' ? 'bite' : 'other'] * EARTH_DAY;
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

// Rows: < 10.1 m (0 % below 5.1 m, straight line to 44 % at 10.1 m), 10.1, 13.2, exactly 16.2, above 16.2 (all).
export function fallDeathChance(height, { soft = false, headFirst = false } = {}) {
    const chances = [null, ...FALL_ROWS.map(r => r[1]), 1];
    let row = FALL_ROWS.filter(([h]) => height >= h).length;
    if (height > FALL_ROWS.at(-1)[0]) row = chances.length - 1;
    const shifted = headFirst ? Math.min(row + 1, chances.length - 1) : soft ? Math.max(row - 1, 0) : row;
    if (shifted > 0) return chances[shifted];
    if (row > 0 || height < 5.1) return 0;
    return FALL_ROWS[0][1] * (height - 5.1) / (FALL_ROWS[0][0] - 5.1);
}

export function fall(p, height, opts = {}, rng = Math.random) {
    const chance = fallDeathChance(height, opts);
    if (chance > 0 && rng() < chance) { p.dead = 'fall'; return `Fall ${height} m: death chance ${Math.round(chance * 1000) / 10}% — dies.`; }
    return `Fall ${height} m: death chance ${Math.round(chance * 1000) / 10}% — survives. Injuries: narrate, then record with LosicaWound.`;
}

const baseOf = part => part.replace(/_(l|r)$/, '');

/** Penalty a wound takes off one score of its part (0–1). Other wound types: OPEN-51. */
export function woundPenalty(w, score) {
    const fr = w.fracture;
    if (fr && (fr.never || fr.joins === null || fr.joins > 0)) return 1;
    if (fr?.crooked && score === 'grip' && /arm|hand/.test(w.part)) return 1 - CROOKED_GRIP;
    return 0;
}

/** Each score as a fraction of an unhurt body: part base × max(0, 1 − Σ penalties); balance ignores non-fracture wounds. */
export function abilities(p) {
    const total = {}, normal = {};
    for (const [base, scores] of Object.entries(PART_SCORES)) {
        const parts = PAIRED.includes(base) ? [`${base}_l`, `${base}_r`] : [base];
        for (const part of parts) {
            const wounds = p.wounds.filter(w => w.part === part && !(w.healed && !w.fracture));
            for (const [score, value] of Object.entries(scores)) {
                const penalty = wounds.reduce((s, w) => s + (WOUND_EXEMPT.includes(score) && !w.fracture ? 0 : woundPenalty(w, score)), 0);
                total[score] = (total[score] || 0) + value * Math.max(0, 1 - penalty);
                normal[score] = (normal[score] || 0) + value;
            }
        }
    }
    return Object.fromEntries(Object.keys(normal).map(k => [k, round(total[k] / normal[k], 2)]));
}

export function status(who, p) {
    if (p.dead) return `${who}: dead (${p.dead}).`;
    const out = [];
    const f = lossFraction(p);
    out.push(`${who}: blood lost ${round(p.lost / 1000, 2)} L (${round(f * 100)}%, class ${['I', 'II', 'III', 'IV'][bloodClass(p) - 1]})`);
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
            bits.push(fr.never ? 'will not join' : fr.joins === null ? 'healing time not set (OPEN-58)' : fr.joins > 0 ? `joins in ${round(fr.joins)} days` : fr.full > 0 ? `light use; full in ${round(fr.full)} days` : 'healed');
            if (fr.crooked) bits.push(/arm|hand/.test(w.part) ? `crooked: grip ${CROOKED_GRIP * 100}%` : 'crooked');
            if ((fr.joins === null || fr.joins > 0) && !fr.never) bits.push(`${w.part} gives no ${Object.keys(PART_SCORES[baseOf(w.part)] || {}).join('/')}`);
        }
        if (w.infection) bits.push('infected');
        out.push(bits.join(', '));
    }
    const reduced = Object.entries(abilities(p)).filter(([, v]) => v < 1);
    if (reduced.length) out.push(`abilities: ${reduced.map(([k, v]) => `${k.replace('_', ' ')} ${Math.round(v * 100)}%`).join(', ')}`);
    const n = p.net, s = stage(n);
    out.push(`network: C ${n.C}, N ${n.N}, stage ${s.stage} (max complexity ${s.max}), R ${Math.floor(n.R)}/${n.C} PE, P ${Math.round(n.P * 100)}%`);
    return out.join('. ') + '.';
}

// Rule 576 strikes. Forces: Smith 2000 punches (untrained/trained/elite = novice/intermediate/elite),
// spread = Walilko 2005 SD/mean; O'Sullivan 2009 turning kicks (elite), lower skill scaled by the punch ratio.
const FIST = { untrained: 2381, trained: 3722, elite: 4800 };
const FIST_CV = 811 / 3427;
const KICK_ELITE = { high: 5419, body: 6400 };
const KICK_CV = 898 / 6400;
const HIGH_PARTS = ['head', 'eyes', 'mouth'];
// Fracture force per part: normal [mean, SD], uniform [min, max] (range only), or fixed mean. Missing parts: OPEN-57.
const BREAK = {
    head: { normal: [3944, 1287] },
    eyes: { uniform: [930, 2850] },
    mouth: { uniform: [625, 1980] },
    arm: { fixed: 1370 },
    leg: { uniform: [1190, 7070] },
};
const BLADE_LIMB_ARTERY = 0.12;
// OPEN-60: rigid-impactor thresholds vs real blows. Uncalibrated, an untrained punch breaks a jaw 94 % of the time;
// bare-knuckle bouts show 27 facial fractures in 301 bouts. Until set, blunt strikes record bruises only.
const BLUNT_CALIBRATION = null;
const REF_MASS = 70;

function gauss(rng) {
    return Math.sqrt(-2 * Math.log(1 - rng())) * Math.cos(2 * Math.PI * rng());
}

function phi(z) {
    const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
    const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z / 2);
    return z >= 0 ? (1 + erf) / 2 : (1 - erf) / 2;
}

export function fractureChance(base, force) {
    const b = BREAK[base];
    if (!b) return null;
    if (b.normal) return phi((force - b.normal[0]) / b.normal[1]);
    if (b.uniform) return Math.min(1, Math.max(0, (force - b.uniform[0]) / (b.uniform[1] - b.uniform[0])));
    return force >= b.fixed ? 1 : 0;
}

/** Peak force (N): skill mean × (mass ÷ 70)^(2/3) × attacker's lifting (fist) or movement (kick) × (1 + CV·z). */
export function strikeForce({ means, skill = 'untrained', mass = REF_MASS, part }, attacker, rng) {
    const fist = FIST[skill] ?? FIST.untrained;
    const kick = means === 'kick';
    const mean = kick ? KICK_ELITE[HIGH_PARTS.includes(baseOf(part)) ? 'high' : 'body'] * fist / FIST.elite : fist;
    const ability = attacker ? abilities(attacker)[kick ? 'movement' : 'lifting'] : 1;
    return Math.max(0, mean * (mass / REF_MASS) ** (2 / 3) * ability * (1 + (kick ? KICK_CV : FIST_CV) * gauss(rng)));
}

// NetHack 3.6 uhitm.c find_roll_to_hit / weapon.c weapon_hit_bonus: hit when 1 + target AC + skill + state > d20.
// Unarmoured target AC 10 (armour: OPEN-61). Level, Luck and attribute bonuses have no Losica counterpart.
const UNARMOURED_AC = 10;
const SKILL_TO_HIT = {
    bare: { untrained: 1, trained: 3, elite: 5 },
    blade: { untrained: -4, trained: 0, elite: 3 },
};
const STATE_TO_HIT = { stunned: 2, fleeing: 2, asleep: 2, helpless: 4 };

export function toHit({ means, skill = 'untrained', states = [] }) {
    const table = means === 'blade_cut' || means === 'blade_stab' ? SKILL_TO_HIT.blade : SKILL_TO_HIT.bare;
    return 1 + UNARMOURED_AC + (table[skill] ?? table.untrained)
        + [...new Set(states)].reduce((sum, st) => sum + (STATE_TO_HIT[st] || 0), 0);
}

/** An attack: rolls whether it lands (unless a.landed), then records the wound on the target. */
export function strike(target, a, attacker = null, rng = Math.random) {
    if (!a.landed) {
        const need = toHit(a);
        const d20 = 1 + Math.floor(rng() * 20);
        if (!(need > d20)) return `${a.means} at ${a.part}: misses (to-hit ${need} vs d20 ${d20}).`;
    }
    const base = baseOf(a.part);
    if (a.means === 'blade_cut' || a.means === 'blade_stab') {
        const type = a.means === 'blade_cut' ? 'cut' : 'puncture';
        const artery = ['arm', 'hand', 'leg', 'foot'].includes(base) && rng() < BLADE_LIMB_ARTERY;
        const w = addWound(target, { part: a.part, type, vessel: artery ? 'limb_artery' : 'small' }, rng);
        const organs = ['arm', 'hand', 'leg', 'foot'].includes(base) ? '' : ' Organ and deep-vessel damage: not set (OPEN-56).';
        return `${type} to ${a.part}${artery ? ', limb artery opened' : ', small vessels'}. Wound ${w.id}.${organs}`;
    }
    const force = strikeForce(a, attacker, rng);
    const chance = BLUNT_CALIBRATION === null ? null : fractureChance(base, force);
    const broke = chance !== null && rng() < chance;
    const kind = base === 'arm' ? 'arm_transverse' : base === 'leg' ? 'leg_transverse' : undefined;
    const w = addWound(target, broke ? { part: a.part, type: 'fracture', fracture: kind } : { part: a.part, type: 'blunt' }, rng);
    const odds = BLUNT_CALIBRATION === null ? 'fracture from blows not set (OPEN-60)'
        : chance === null ? 'fracture threshold not set (OPEN-57)' : `fracture chance ${Math.round(chance * 100)}%`;
    return `${a.means} to ${a.part}: ${Math.round(force)} N, ${odds} → ${broke ? 'fracture' : 'bruise'}. Wound ${w.id}.`;
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
