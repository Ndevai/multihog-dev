import { describe, it, expect } from 'vitest';
import { newPerson, addWound, checkChance, check } from '../src/rules/losica-engine.js';

const hurt = (parts, type = 'fracture') => {
    const p = newPerson();
    for (const part of parts) addWound(p, { part, type }, () => 0.5);
    return p;
};

describe('checks: capacity against demand', () => {
    it('an unhurt body succeeds as often as people of its training do', () => {
        for (const share of [0.05, 0.5, 0.9]) expect(checkChance(newPerson(), { share, uses: ['lifting'] })).toBeCloseTo(share, 6);
    });

    it('a score of 0 in a used ability makes the task impossible', () => {
        expect(checkChance(hurt(['hand_l', 'hand_r']), { share: 0.99, uses: ['grip'] })).toBe(0);
    });

    it('half the lifting score: what most people lift is out of reach, what nearly everyone lifts is sometimes possible', () => {
        const p = hurt(['arm_l']);
        expect(checkChance(p, { share: 0.5, uses: ['lifting'] })).toBeLessThan(0.001);
        const easy = checkChance(p, { share: 0.99, uses: ['lifting'] });
        expect(easy).toBeGreaterThan(0.1);
        expect(easy).toBeLessThan(0.5);
    });

    it('a wound on an unused part changes nothing', () => {
        expect(checkChance(hurt(['leg_l']), { share: 0.7, uses: ['grip'] })).toBeCloseTo(0.7, 6);
    });

    it('blood loss: class II fails heavy exertion, class III fails tasks on foot, class IV fails everything', () => {
        const at = frac => { const p = newPerson(); p.lost = frac * p.mass * 70; return p; };
        expect(checkChance(at(0.2), { share: 0.9, exertion: 'heavy' })).toBe(0);
        expect(checkChance(at(0.2), { share: 0.9, exertion: 'light' })).toBeCloseTo(0.9, 6);
        expect(checkChance(at(0.35), { share: 0.9, on_feet: true })).toBe(0);
        expect(checkChance(at(0.35), { share: 0.9 })).toBeCloseTo(0.9, 6);
        expect(checkChance(at(0.45), { share: 0.9 })).toBe(0);
    });

    it('the dead do nothing', () => {
        const p = newPerson(); p.dead = 'fall';
        expect(checkChance(p, { share: 1 })).toBe(0);
    });

    it('the draw decides against the chance', () => {
        expect(check(newPerson(), { task: 'climb wall', share: 0.6 }, () => 0.59)).toBe('climb wall: chance 60% → SUCCESS.');
        expect(check(newPerson(), { task: 'climb wall', share: 0.6 }, () => 0.6)).toBe('climb wall: chance 60% → FAILURE.');
        expect(check(hurt(['hand_l', 'hand_r']), { task: 'hang on', share: 0.9, uses: ['grip'] }, () => 0)).toBe('hang on: chance 0% (grip 0%) → FAILURE.');
    });
});
