// Plain-sense cases for "does an attack land", written before the rule.
// A blow lands unless the target detects it in time AND can move out of the way.
import { describe, it, expect } from 'vitest';
import { newPerson, addWound, strike, seededRng } from '../src/rules/body-engine.js';

const fist = extra => ({ part: 'torso', means: 'fist', ...extra });
const lands = out => !/avoided|out of reach/.test(out);

function rate(attack, n = 4000, target = () => newPerson()) {
    const rng = seededRng(`avoid:${JSON.stringify(attack)}`);
    let avoided = 0;
    for (let i = 0; i < n; i++) if (!lands(strike(target(), attack, null, rng))) avoided++;
    return avoided / n;
}

describe('a blow lands unless the target notices in time and can move', () => {
    it('1. sleeper, silent attacker in reach → always lands', () => {
        expect(rate(fist({ awake: false, noise_db: 0 }))).toBe(0);
    });

    it('2a. sleeper with a 1 m sense → lands while senses-in-sleep is undecided (OPEN-63)', () => {
        expect(rate(fist({ awake: false, sense_range_m: 1, distance_m: 3, approach_speed: 0.3 }))).toBe(0);
    });

    it('2b. awake target facing away, 1 m sense, slow approach from 3 m → usually avoids', () => {
        expect(rate(fist({ facing: false, sense_range_m: 1, distance_m: 3, approach_speed: 0.3, intent_visible: true }))).toBeGreaterThan(0.6);
    });

    it('3. sleeper woken by a loud strike already in reach → lands', () => {
        expect(rate(fist({ awake: false, noise_db: 70 }))).toBe(0);
    });

    it('3b. sleeper hearing a loud approach from far away → can wake in time', () => {
        expect(rate(fist({ awake: false, noise_db: 70, distance_m: 40, approach_speed: 1.4, intent_visible: true }))).toBeGreaterThan(0.5);
    });

    it('4. alert, facing, punch from within reach → mostly lands (no time to react)', () => {
        const r = rate(fist({}));
        expect(r).toBeGreaterThan(0.03);
        expect(r).toBeLessThan(0.3);
    });

    it('5. alert, facing, attacker charging from 3 m → mostly avoided', () => {
        expect(rate(fist({ distance_m: 3, approach_speed: 3, intent_visible: true }))).toBeGreaterThan(0.85);
    });

    it('6. arms and legs all broken → cannot avoid even with warning', () => {
        const broken = () => {
            const p = newPerson();
            for (const part of ['arm_l', 'arm_r', 'leg_l', 'leg_r']) addWound(p, { part, type: 'fracture' }, () => 0.5);
            return p;
        };
        expect(rate(fist({ distance_m: 3, approach_speed: 3, intent_visible: true }), 500, broken)).toBe(0);
    });

    it('7. facing away in the dark: silent charge lands, noisy charge is heard', () => {
        expect(rate(fist({ facing: false, lit: false, distance_m: 3, approach_speed: 3, noise_db: 0 }))).toBe(0);
        expect(rate(fist({ facing: false, lit: false, distance_m: 3, approach_speed: 3, noise_db: 40, intent_visible: true }))).toBeGreaterThan(0.85);
    });

    it('9. calm walk-up with hidden intent (sucker punch) → lands about as often as a punch from reach', () => {
        const sucker = rate(fist({ distance_m: 3, approach_speed: 1.4 }));
        expect(sucker).toBeLessThan(0.3);
        expect(Math.abs(sucker - rate(fist({})))).toBeLessThan(0.05);
    });

    it('8. attacker out of reach with no approach → nothing lands and the tool says why', () => {
        expect(strike(newPerson(), fist({ distance_m: 5 }), null, () => 0.5)).toMatch(/out of reach/);
    });

    it('10. a 5 kg body with a human-speed mind dodges a human punch more often (shorter nerves, faster muscles)', () => {
        expect(rate(fist({}), 4000, () => newPerson(5))).toBeGreaterThan(rate(fist({})) + 0.05);
    });

    it('10b. decision time belongs to the mind: the same body with a faster brain dodges more', () => {
        const quick = () => Object.assign(newPerson(70), { body: { decide_s: 0.1 } });
        expect(rate(fist({}), 4000, quick)).toBeGreaterThan(rate(fist({})) + 0.1);
    });

    it('11. a 2000 kg attacker swings slower: a human avoids its blow from reach more often than a human punch', () => {
        expect(rate(fist({ mass: 2000 }))).toBeGreaterThan(rate(fist({})) + 0.05);
    });

    it('12. a 300 kg attacker reaches 1.2 m without stepping in; a 70 kg one does not', () => {
        expect(strike(newPerson(), fist({ mass: 300, distance_m: 1.2 }), null, () => 0.5)).not.toMatch(/out of reach/);
        expect(strike(newPerson(), fist({ distance_m: 1.2 }), null, () => 0.5)).toMatch(/out of reach/);
    });
});

