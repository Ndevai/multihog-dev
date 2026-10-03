import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { RNG_MODES, getRngMode, applyRngMode, shouldUseRngQueue, autoSelectRngTools } from '../src/state/rng-mode.js';

describe('RNG mode flags', () => {
    it('round-trips every mode through applyRngMode and getRngMode', () => {
        for (const mode of RNG_MODES) {
            expect(getRngMode(applyRngMode({}, mode))).toBe(mode);
        }
    });

    it('falls back to hybrid for an unknown mode', () => {
        expect(getRngMode(applyRngMode({}, 'bogus'))).toBe('hybrid');
    });

    it('reads settings saved before strict mode existed as hybrid or legacy', () => {
        expect(getRngMode({ rngEnabled: true, diceFunctionTool: true })).toBe('hybrid');
        expect(getRngMode({ rngEnabled: true, diceFunctionTool: false })).toBe('legacy');
        expect(getRngMode({ rngEnabled: false, diceFunctionTool: true, strictDiceCommit: true })).toBe('none');
    });
});

describe('RNG queue visibility (dice leak)', () => {
    const settings = mode => applyRngMode({}, mode);

    it('strict mode never shows the queue, in or out of combat', () => {
        expect(shouldUseRngQueue(settings('strict'), false)).toBe(false);
        expect(shouldUseRngQueue(settings('strict'), true)).toBe(false);
    });

    it('hybrid mode keeps its existing behavior: queue only in combat', () => {
        expect(shouldUseRngQueue(settings('hybrid'), false)).toBe(false);
        expect(shouldUseRngQueue(settings('hybrid'), true)).toBe(true);
    });

    it('legacy mode keeps the queue everywhere, none mode never', () => {
        expect(shouldUseRngQueue(settings('legacy'), false)).toBe(true);
        expect(shouldUseRngQueue(settings('legacy'), true)).toBe(true);
        expect(shouldUseRngQueue(settings('none'), true)).toBe(false);
    });
});

describe('autoSelectRngTools', () => {
    it('strict mode turns the dice tool on and every queue off', () => {
        const d20 = autoSelectRngTools(applyRngMode({ diceD100Mode: false }, 'strict'));
        expect(d20).toMatchObject({ rngToolD20: true, rngToolD100: false, rngQueueD20: false, rngQueueD100: false });
        const d100 = autoSelectRngTools(applyRngMode({ diceD100Mode: true }, 'strict'));
        expect(d100).toMatchObject({ rngToolD20: false, rngToolD100: true, rngQueueD20: false, rngQueueD100: false });
    });

    it('hybrid and legacy keep their previous tool and queue selection', () => {
        expect(autoSelectRngTools(applyRngMode({}, 'hybrid')))
            .toMatchObject({ rngToolD20: true, rngToolD100: false, rngQueueD20: true, rngQueueD100: false });
        expect(autoSelectRngTools(applyRngMode({ diceD100Mode: true }, 'hybrid')))
            .toMatchObject({ rngToolD20: false, rngToolD100: true, rngQueueD20: false, rngQueueD100: true });
        expect(autoSelectRngTools(applyRngMode({}, 'legacy')))
            .toMatchObject({ rngToolD20: false, rngToolD100: false, rngQueueD20: true, rngQueueD100: false });
        expect(autoSelectRngTools(applyRngMode({}, 'none')))
            .toMatchObject({ rngToolD20: false, rngToolD100: false, rngQueueD20: false, rngQueueD100: false });
    });
});

describe('strict mode is wired into every queue decision', () => {
    const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

    it('queue injection, tool registration and the narrator prompt use shouldUseRngQueue', () => {
        const hooks = read('../narrative-hooks.js');
        expect(hooks).toContain('const injectRngQueue = shouldUseRngQueue(settings, isCombatActive(settings.currentMemo));');
        expect(hooks).toContain('if (!manageHybrid || !shouldUseRngQueue(getSettings(), isCombatActive(memo))) {');
        const systems = read('../game-systems.js');
        expect(systems).toContain('if (!shouldUseRngQueue(settings, inCombat)) {');
    });

    it('strict mode is selectable in the sidebar and onboarding, and persists per chat and cartridge', () => {
        expect(read('../settings.html')).toContain('value="strict" id="rpg_rng_strict"');
        expect(read('../renderer.js')).toContain('value="strict" id="rt_onboarding_rng_strict"');
        expect(read('../src/state/chat-setup.js')).toContain("'strictDiceCommit',");
        expect(read('../src/state/factory-and-diff.js')).toContain("'strictDiceCommit',");
        expect(read('../src/state/defaults.js')).toContain('strictDiceCommit: false');
    });

    it('onboarding RNG radios call a function that exists in card-events', () => {
        const cardEvents = read('../src/ui/panel/card-events.js');
        expect(cardEvents).toContain("import { getRngMode, applyRngMode, autoSelectRngTools } from '../../state/rng-mode.js';");
        expect(cardEvents).not.toContain('autoSelectRngToolsFromMode(');
    });
});
