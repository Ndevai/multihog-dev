import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bodyBlock, bodyMemo } from '../src/rules/body-sheet.js';
import { newPerson, addWound } from '../src/rules/body-engine.js';

describe('the engine body state on the sheet', () => {
    it('adds a BODY block from the engine state', () => {
        const p = newPerson();
        addWound(p, { part: 'arm_l', type: 'cut', vessel: 'limb_artery' }, () => 0.5);
        const block = bodyBlock({ Ara: p });
        expect(block).toMatch(/^\[BODY\]\nAra: blood lost 0 L .*wound 1 arm_l cut, bleeding 120 mL\/min.*\n\[\/BODY\]$/);
        expect(bodyBlock({})).toBe('');
        expect(bodyMemo('[CHARACTER]\nAra (58 kg)\n[/CHARACTER]', { Ara: p })).toMatch(/\[\/CHARACTER\]\n\[BODY\]/);
    });

    it('is wired into the sheet and the narrator memo when the rules engine are on', () => {
        const renderer = readFileSync(new URL('../renderer.js', import.meta.url), 'utf8');
        const hooks = readFileSync(new URL('../narrative-hooks.js', import.meta.url), 'utf8');
        expect(renderer.match(/if \(getSettings\(\)\.rulesEngine && memo && memo\.trim\(\)\) memo = bodyMemo\(memo, trackedPeople\(\)\);/g)).toHaveLength(2);
        expect(hooks).toContain('settings.rulesEngine ? bodyMemo(memoForGmContext(settings.currentMemo), trackedPeople()) : memoForGmContext(settings.currentMemo)');
    });
});
