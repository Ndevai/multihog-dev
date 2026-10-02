// hybrid: tool outside combat, queue in combat. strict: tool always, no queue. legacy: queue only. none: no RNG.

export const RNG_MODES = Object.freeze(['hybrid', 'strict', 'legacy', 'none']);

export function getRngMode(settings) {
    if (!settings?.rngEnabled) return 'none';
    if (!settings.diceFunctionTool) return 'legacy';
    return settings.strictDiceCommit ? 'strict' : 'hybrid';
}

export function applyRngMode(settings, mode) {
    const value = RNG_MODES.includes(mode) ? mode : 'hybrid';
    settings.rngEnabled = value !== 'none';
    settings.diceFunctionTool = value === 'hybrid' || value === 'strict';
    settings.strictDiceCommit = value === 'strict';
    return settings;
}

export function shouldUseRngQueue(settings, inCombat) {
    if (!settings?.rngEnabled) return false;
    if (!settings.diceFunctionTool) return true;
    return !!inCombat && !settings.strictDiceCommit;
}

export function autoSelectRngTools(settings) {
    if (!settings.rngEnabled) {
        settings.rngToolD20 = false;
        settings.rngToolD100 = false;
        settings.rngQueueD20 = false;
        settings.rngQueueD100 = false;
        return settings;
    }
    const d100 = !!settings.diceD100Mode;
    if (!settings.diceFunctionTool) {
        settings.rngToolD20 = false;
        settings.rngToolD100 = false;
        settings.rngQueueD20 = !d100;
        settings.rngQueueD100 = d100;
        return settings;
    }
    const queue = !settings.strictDiceCommit;
    settings.rngToolD20 = !d100;
    settings.rngToolD100 = d100;
    settings.rngQueueD20 = !d100 && queue;
    settings.rngQueueD100 = d100 && queue;
    return settings;
}
