import { describe, it, expect } from 'vitest';
import { newPerson, addWound, advance, treat, cast, fall, stage, bloodClass, status, DAY_MIN } from '../src/rules/body-engine.js';

const fixed = v => () => v;

describe('blood loss', () => {
    it('femoral bleed reaches class IV within 3-7 minutes', () => {
        const p = newPerson(70);
        addWound(p, { part: 'leg_l', type: 'cut', vessel: 'femoral' }, fixed(0.5));
        advance(p, 3, false, fixed(0.5));
        expect(bloodClass(p)).toBeLessThan(4);
        advance(p, 4, false, fixed(0.5));
        expect(bloodClass(p)).toBe(4);
    });

    it('dies within 30-60 min of class IV while still bleeding', () => {
        const p = newPerson(70);
        addWound(p, { part: 'leg_l', type: 'cut', vessel: 'femoral' }, fixed(0.5));
        advance(p, 90, false, fixed(0.5));
        expect(p.dead).toBe('blood loss');
    });

    it('stopped bleeding at class IV gives two hours, transfusion cancels', () => {
        const p = newPerson(70);
        const w = addWound(p, { part: 'leg_l', type: 'cut', vessel: 'femoral' }, fixed(0.5));
        advance(p, 7, false, fixed(0.5));
        treat(p, w.id, 'stop_bleeding');
        advance(p, 60, false, fixed(0.5));
        expect(p.dead).toBeNull();
        treat(p, 0, 'transfuse');
        advance(p, 120, false, fixed(0.5));
        expect(p.dead).toBeNull();
    });
});

describe('fractures', () => {
    it('arm spiral joins after 58.9 days', () => {
        const p = newPerson();
        const w = addWound(p, { part: 'arm_l', type: 'fracture', fracture: 'arm_spiral' }, fixed(0.9));
        advance(p, Math.ceil(58.9 * DAY_MIN), true, fixed(0.9));
        expect(w.fracture.joins).toBeLessThanOrEqual(0);
    });

    it('loading a splinted fracture adds no risk', () => {
        const p = newPerson();
        const w = addWound(p, { part: 'leg_r', type: 'fracture' }, fixed(0.9));
        treat(p, w.id, 'splint');
        treat(p, w.id, 'load', fixed(0));
        expect(w.fracture.crooked).toBe(false);
    });
});

describe('network', () => {
    it('stage follows N and C', () => {
        expect(stage({ C: 40, N: 0 }).max).toBe(1);
        expect(stage({ C: 200, N: 0 }).max).toBe(3);
        expect(stage({ C: 4000, N: 1 }).max).toBe(6);
    });

    it('over-complex cast fails and costs energy', () => {
        const p = newPerson();
        expect(cast(p, 2)).toMatch(/does not start/);
        p.net.C = 200; p.net.R = 200;
        expect(cast(p, 4)).toMatch(/fails/);
        expect(p.net.R).toBe(22);
    });

    it('full daily practice grows 40 to 200 conduits in about 117 days', () => {
        const p = newPerson();
        let days = 0;
        while (p.net.C < 200 && days < 400) {
            const n = p.net;
            n.E = 0.4278 * n.C;
            advance(p, Math.ceil(DAY_MIN), false);
            days++;
        }
        expect(days).toBeGreaterThan(100);
        expect(days).toBeLessThan(135);
    });

    it('resting recovers 5% of C per hour', () => {
        const p = newPerson();
        p.net.R = 0;
        advance(p, 60, true);
        expect(p.net.R).toBeCloseTo(2, 5);
    });
});

describe('falls', () => {
    it('uses the fall rows and shifts for head-first landings', () => {
        const p = newPerson();
        expect(fall(p, 4, {}, fixed(0))).toMatch(/0%/);
        expect(fall(newPerson(), 12, { headFirst: true }, fixed(0.99))).toMatch(/56%/);
    });
});

it('status reports a disabled part', () => {
    const p = newPerson();
    addWound(p, { part: 'hand_l', type: 'fracture' }, fixed(0.9));
    expect(status('Ara', p)).toMatch(/hand_l gives no grip\/manipulation\/swimming/);
});

describe('seeded draws', () => {
    it('repeats the same stream for the same seed and differs for another', async () => {
        const { seededRng } = await import('../src/rules/body-engine.js');
        const draw = seed => { const r = seededRng(seed); return [r(), r(), r()]; };
        expect(draw('salt:3:abc:1')).toEqual(draw('salt:3:abc:1'));
        expect(draw('salt:3:abc:1')).not.toEqual(draw('salt:3:abc:2'));
        expect(draw('x').every(v => v >= 0 && v < 1)).toBe(true);
    });

    it('gives the same fall outcome on a replayed call', async () => {
        const { newPerson, fall, seededRng } = await import('../src/rules/body-engine.js');
        const outcomes = new Set();
        for (let i = 0; i < 5; i++) outcomes.add(fall(newPerson(), 14, {}, seededRng('turn-7:1')));
        expect(outcomes.size).toBe(1);
    });
});

describe('rule 576 healing, onset, falls, crooked bones (2 Oct 2026 values)', () => {
    const E = 86400 / 30804;
    const days = n => Math.round(n * DAY_MIN);

    it('decides a bite infection at 1 Earth day and other wounds at 10', async () => {
        const { newPerson, addWound, advance } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'leg_l', type: 'bite' }, () => 0);
        addWound(p, { part: 'leg_r', type: 'cut' }, () => 0);
        advance(p, days(1 * E) - 2, false, () => 0);
        expect(p.wounds.map(w => w.infection)).toEqual([null, null]);
        advance(p, 4, false, () => 0);
        expect(p.wounds.map(w => w.infection)).toEqual([true, null]);
        advance(p, days(10 * E), false, () => 0);
        expect(p.wounds[1].infection).toBe(true);
    });

    it('closes cuts by part and burns by depth; full burns need a graft', async () => {
        const { newPerson, addWound, advance, status } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        const face = addWound(p, { part: 'mouth', type: 'cut' }, () => 0);
        const leg = addWound(p, { part: 'leg_l', type: 'cut' }, () => 0.999);
        const burn = addWound(p, { part: 'arm_r', type: 'burn', depth: 'full' }, () => 0);
        const punct = addWound(p, { part: 'torso', type: 'puncture' }, () => 0);
        expect(face.heals).toBeCloseTo(3 * E, 1);
        expect(leg.heals).toBeCloseTo(14 * E, 0);
        expect(burn.heals).toBeNull();
        expect(punct.heals).toBeNull();
        advance(p, days(3 * E) + 2, false, () => 0.99);
        expect(face.healed).toBe(true);
        expect(leg.healed).toBe(false);
        expect(status('X', p)).toMatch(/closes only with a skin graft/);
        expect(status('X', p)).not.toMatch(/wound 1 /);
    });

    it('fall deaths follow the table, interpolate 5.1–10.1 m, and kill all above 16.2 m', async () => {
        const { fallDeathChance } = await import('../src/rules/body-engine.js');
        expect(fallDeathChance(4)).toBe(0);
        expect(fallDeathChance(7.6)).toBeCloseTo(0.22, 5);
        expect(fallDeathChance(10.1)).toBe(0.44);
        expect(fallDeathChance(16.2)).toBe(0.78);
        expect(fallDeathChance(16.3)).toBe(1);
        expect(fallDeathChance(7.6, { headFirst: true })).toBe(0.44);
        expect(fallDeathChance(12, { soft: true })).toBe(0);
    });

    it('shows 51 % grip for a crooked arm or hand', async () => {
        const { newPerson, addWound, treat, status } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'hand_l', type: 'fracture' }, () => 0.5);
        treat(p, 1, 'load', () => 0);
        expect(status('X', p)).toMatch(/crooked: grip 51%/);
    });
});

describe('ability scores (Cataclysm: DDA limb scores, 935fe5f)', () => {
    it('an unhurt body has every score at 100 %', async () => {
        const { newPerson, abilities } = await import('../src/rules/body-engine.js');
        expect(Object.values(abilities(newPerson())).every(v => v === 1)).toBe(true);
    });

    it('a broken hand removes its share; balance stays for non-fracture wounds', async () => {
        const { newPerson, addWound, abilities } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'hand_l', type: 'fracture' }, () => 0.5);
        const a = abilities(p);
        expect(a.grip).toBe(0.5);
        expect(a.manipulation).toBeCloseTo((1.65 - 0.5) / 1.65, 2);
        expect(a.balance).toBe(1);
    });

    it('a crooked hand after joining keeps 51 % of its grip share', async () => {
        const { newPerson, addWound, treat, advance, abilities, DAY_MIN } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'hand_r', type: 'fracture' }, () => 0.5);
        treat(p, 1, 'load', () => 0);
        advance(p, Math.ceil(60 * DAY_MIN), true, () => 0.5);
        expect(abilities(p).grip).toBeCloseTo(0.5 + 0.5 * 0.51, 1);
    });

    it('cuts change no score until OPEN-51 is set', async () => {
        const { newPerson, addWound, abilities } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'hand_l', type: 'cut' }, () => 0.5);
        expect(abilities(p).grip).toBe(1);
    });
});

describe('strikes (rule 576)', () => {
    const mid = () => 0.5;

    it('scales force with skill, mass^(2/3) and the attacker\'s arm ability', async () => {
        const { strikeForce, newPerson, addWound } = await import('../src/rules/body-engine.js');
        const zero = (() => { const seq = [0.5, 0.25]; let i = 0; return () => seq[i++ % 2]; })();
        const f = strikeForce({ means: 'fist', skill: 'untrained', part: 'head' }, null, zero);
        expect(f).toBeCloseTo(2381, 0);
        expect(strikeForce({ means: 'fist', skill: 'untrained', mass: 300, part: 'head' }, null, zero)).toBeCloseTo(2381 * (300 / 70) ** (2 / 3), 0);
        const hurt = newPerson();
        addWound(hurt, { part: 'arm_r', type: 'fracture' }, mid);
        expect(strikeForce({ means: 'fist', part: 'head' }, hurt, zero)).toBeLessThan(f);
    });

    it('turns force into a fracture chance per part', async () => {
        const { fractureChance } = await import('../src/rules/body-engine.js');
        expect(fractureChance('head', 3944)).toBeCloseTo(0.5, 2);
        expect(fractureChance('eyes', 1890)).toBeCloseTo(0.5, 2);
        expect(fractureChance('arm', 1369)).toBe(0);
        expect(fractureChance('arm', 1370)).toBe(1);
        expect(fractureChance('torso', 9000)).toBeNull();
    });

    it('blunt blows record force and a bruise until OPEN-60 is calibrated', async () => {
        const { newPerson, strike } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        expect(strike(p, { part: 'mouth', means: 'kick', skill: 'elite', landed: true }, null, () => 0.01)).toMatch(/: \d+ N → bruise\. Wound 1\.$/);
        expect(p.wounds[0].type).toBe('blunt');
    });

    it('fractures of parts without a timetable stay unjoined (OPEN-58)', async () => {
        const { newPerson, addWound, abilities, status } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        addWound(p, { part: 'head', type: 'fracture' }, mid);
        expect(p.wounds[0].fracture.joins).toBeNull();
        expect(abilities(p).reaction).toBeCloseTo(0.7, 5);
        expect(status('X', p)).not.toMatch(/OPEN|joins in|healed/);
    });

    it('blades on limbs open a limb artery 12 % of the time', async () => {
        const { newPerson, strike } = await import('../src/rules/body-engine.js');
        const p = newPerson();
        expect(strike(p, { part: 'leg_l', means: 'blade_stab', landed: true }, null, () => 0.1)).toMatch(/limb artery opened/);
        expect(p.wounds[0].bleed).toBeGreaterThanOrEqual(70);
        expect(strike(p, { part: 'leg_l', means: 'blade_cut', landed: true }, null, () => 0.5)).toMatch(/small vessels/);
        expect(strike(p, { part: 'torso', means: 'blade_stab', landed: true }, null, () => 0.1)).toMatch(/^puncture to torso, small vessels\. Wound \d+\.$/);
    });
});

describe('blood loss stays within the body (audit 3 Oct 2026)', () => {
    it('dies at 50 mL/kg lost and never reports more than that', async () => {
        const { newPerson, addWound, advance, lossFraction } = await import('../src/rules/body-engine.js');
        const run = vessel => {
            const p = newPerson(70);
            addWound(p, { part: 'leg_l', type: 'cut', vessel }, () => 0.5);
            let m = 0;
            while (!p.dead && m < 600) { advance(p, 1, false, () => 0.5); m++; }
            return { m, f: lossFraction(p) };
        };
        const fem = run('femoral');
        expect(fem.m).toBe(8);
        expect(fem.f).toBeCloseTo(50 / 70, 3);
        const limb = run('limb_artery');
        expect(limb.m).toBeGreaterThanOrEqual(29);
        expect(limb.m).toBeLessThanOrEqual(30);
        expect(limb.f).toBeLessThanOrEqual(50 / 70 + 1e-9);
    });
});

describe('interruptions (NetHack/Pathos structure)', () => {
    it('stops time at the minute a bleed crosses into class II', async () => {
        const { newPerson, addWound, advanceAll, bloodClass } = await import('../src/rules/body-engine.js');
        const p = newPerson(70);
        addWound(p, { part: 'arm_l', type: 'cut', vessel: 'limb_artery' }, () => 0.5);
        const { elapsed, events } = advanceAll({ Mira: p }, 600, new Set(), () => 0.5);
        expect(events).toEqual(['Mira reaches blood-loss class II']);
        expect(elapsed).toBe(Math.ceil(0.15 * 4900 / 120));
        expect(bloodClass(p)).toBe(2);
    });

    it('stops for every tracked person at the same minute, and reports infection and death', async () => {
        const { newPerson, addWound, advanceAll } = await import('../src/rules/body-engine.js');
        const a = newPerson(), b = newPerson();
        addWound(b, { part: 'leg_l', type: 'bite' }, () => 0);
        const r = advanceAll({ A: a, B: b }, 10 * 513, new Set(), () => 0);
        expect(r.events).toEqual(['B: wound 1 is infected']);
        expect(a.minute).toBe(b.minute);
        const c = newPerson();
        addWound(c, { part: 'leg_l', type: 'cut', vessel: 'femoral' }, () => 0.5);
        const seen = [];
        let left = 60;
        while (left > 0) { const s = advanceAll({ C: c }, left, new Set(), () => 0.5); seen.push(...s.events); left -= s.elapsed; if (!s.events.length) break; }
        expect(seen.at(-1)).toBe('C dies (blood loss)');
    });

    it('runs the full span when nothing changes', async () => {
        const { newPerson, advanceAll } = await import('../src/rules/body-engine.js');
        expect(advanceAll({ A: newPerson() }, 300)).toEqual({ elapsed: 300, events: [] });
    });
});



describe('narrator-facing text', () => {
    it('tool results and the lorebook copy name no OPEN ids', async () => {
        const { readFileSync } = await import('node:fs');
        const src = readFileSync(new URL('../src/rules/body-engine.js', import.meta.url), 'utf8');
        const strings = src.split('\n').filter(l => !l.trim().startsWith('//') && !l.trim().startsWith('*') && !l.trim().startsWith('/**'));
        expect(strings.join('\n')).not.toMatch(/['`][^'`]*OPEN-\d+/);
    });
});
