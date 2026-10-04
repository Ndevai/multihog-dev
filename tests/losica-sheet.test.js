import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stripHitPoints, bodyBlock, losicaMemo } from '../src/rules/losica-sheet.js';
import { newPerson, addWound } from '../src/rules/losica-engine.js';

describe('wounds replace hit points', () => {
    it('removes every hit-point format the State Tracker writes', () => {
        const memo = '[CHARACTER]\nName: Ara\n((B)) Health: 45/100\nHP: 12/12\nLevel: 2\n[/CHARACTER]\n[PARTY]Elara (Ranger): 26/45 HP\n[/PARTY]\n[COMBAT]\nBandit: 18/18 HP | Longsword\n[/COMBAT]';
        const out = stripHitPoints(memo);
        expect(out).not.toMatch(/\bHP\b|Health/);
        expect(out).toContain('Name: Ara');
        expect(out).toContain('Level: 2');
        expect(out).toContain('Elara (Ranger)');
        expect(out).toContain('Bandit: Longsword');
    });

    it('adds a BODY block from the engine state', () => {
        const p = newPerson();
        addWound(p, { part: 'arm_l', type: 'cut', vessel: 'limb_artery' }, () => 0.5);
        const block = bodyBlock({ Ara: p });
        expect(block).toMatch(/^\[BODY\]\nAra: blood lost 0 L .*wound 1 arm_l cut, bleeding 120 mL\/min.*\n\[\/BODY\]$/);
        expect(bodyBlock({})).toBe('');
        expect(losicaMemo('[CHARACTER]\nHP: 3/9\n[/CHARACTER]', { Ara: p })).toMatch(/\[\/CHARACTER\]\n\[BODY\]/);
    });

    it('is wired into the sheet and the narrator memo when the Losica rules are on', () => {
        const renderer = readFileSync(new URL('../renderer.js', import.meta.url), 'utf8');
        const hooks = readFileSync(new URL('../narrative-hooks.js', import.meta.url), 'utf8');
        expect(renderer.match(/if \(getSettings\(\)\.losicaRules && memo && memo\.trim\(\)\) memo = losicaMemo\(memo, trackedPeople\(\)\);/g)).toHaveLength(2);
        expect(hooks).toContain('settings.losicaRules ? losicaMemo(memoForGmContext(settings.currentMemo), trackedPeople()) : memoForGmContext(settings.currentMemo)');
    });

    it('the narrator footer asks for wounds instead of HP', async () => {
        const src = readFileSync(new URL('../game-systems.js', import.meta.url), 'utf8');
        expect(src).toContain("(Status: [{{user}}\\'s wounds and blood-loss class from BODY, a few words])");
    });
});
