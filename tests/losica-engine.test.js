import { describe, it, expect } from 'vitest';
import { newPerson, addWound, advance, treat, cast, fall, stage, bloodClass, status, DAY_MIN } from '../src/rules/losica-engine.js';

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
    it('uses Losica rows and shifts for head-first landings', () => {
        const p = newPerson();
        expect(fall(p, 4, {}, fixed(0))).toMatch(/0%/);
        expect(fall(newPerson(), 12, { headFirst: true }, fixed(0.99))).toMatch(/56%/);
    });
});

it('status reports a disabled part', () => {
    const p = newPerson();
    addWound(p, { part: 'hand_l', type: 'fracture' }, fixed(0.9));
    expect(status('Ara', p)).toMatch(/hand_l gives no grip\/fine manipulation/);
});
