import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { bodyBlock, losicaMemo } from '../src/rules/losica-sheet.js';
import { newPerson, addWound } from '../src/rules/losica-engine.js';

describe('the engine body state on the sheet', () => {
    it('adds a BODY block from the engine state', () => {
        const p = newPerson();
        addWound(p, { part: 'arm_l', type: 'cut', vessel: 'limb_artery' }, () => 0.5);
        const block = bodyBlock({ Ara: p });
        expect(block).toMatch(/^\[BODY\]\nAra: blood lost 0 L .*wound 1 arm_l cut, bleeding 120 mL\/min.*\n\[\/BODY\]$/);
        expect(bodyBlock({})).toBe('');
        expect(losicaMemo('[CHARACTER]\nAra (58 kg)\n[/CHARACTER]', { Ara: p })).toMatch(/\[\/CHARACTER\]\n\[BODY\]/);
    });

    it('is wired into the sheet and the narrator memo when the Losica rules are on', () => {
        const renderer = readFileSync(new URL('../renderer.js', import.meta.url), 'utf8');
        const hooks = readFileSync(new URL('../narrative-hooks.js', import.meta.url), 'utf8');
        expect(renderer.match(/if \(getSettings\(\)\.losicaRules && memo && memo\.trim\(\)\) memo = losicaMemo\(memo, trackedPeople\(\)\);/g)).toHaveLength(2);
        expect(hooks).toContain('settings.losicaRules ? losicaMemo(memoForGmContext(settings.currentMemo), trackedPeople()) : memoForGmContext(settings.currentMemo)');
    });
});
