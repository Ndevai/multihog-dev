/**
 * RNG mode helpers.
 *
 * Modes:
 * - hybrid: RollTheDice tool outside combat, pre-seeded RNG queue during combat.
 * - strict: RollTheDice tool everywhere, including combat. The model never sees
 *   a dice value before it has committed the DC in the tool call, so it cannot
 *   pick difficulties, targets or actions to fit dice it has already seen.
 * - legacy: pre-seeded RNG queue only.
 * - none:   no RNG; the model invents numbers.
 */

export const RNG_MODES = Object.freeze(['hybrid', 'strict', 'legacy', 'none']);

/** Reads the active RNG mode from settings. */
export function getRngMode(settings) {
    if (!settings?.rngEnabled) return 'none';
    if (!settings.diceFunctionTool) return 'legacy';
    return settings.strictDiceCommit ? 'strict' : 'hybrid';
}

/** Writes the flags for an RNG mode into settings. Unknown modes fall back to hybrid. */
export function applyRngMode(settings, mode) {
    const value = RNG_MODES.includes(mode) ? mode : 'hybrid';
    settings.rngEnabled = value !== 'none';
    settings.diceFunctionTool = value === 'hybrid' || value === 'strict';
    settings.strictDiceCommit = value === 'strict';
    return settings;
}

/**
 * True when the pre-seeded RNG queue should be in the narrator's prompt.
 * Strict mode keeps the queue out even during combat.
 */
export function shouldUseRngQueue(settings, inCombat) {
    if (!settings?.rngEnabled) return false;
    if (!settings.diceFunctionTool) return true;
    return !!inCombat && !settings.strictDiceCommit;
}

/**
 * Sets which dice tools and queues are active for the current RNG mode.
 * Strict mode never injects the queue, so its queue flags stay off.
 */
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
