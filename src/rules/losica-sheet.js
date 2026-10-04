// With the Losica rules on, wounds replace hit points on the sheet and in the narrator's state memo.
import { status } from './losica-engine.js';

/** Removes hit-point lines ("Health: 45/100", "HP: 12/12") and inline "26/45 HP" values. */
export function stripHitPoints(memo) {
    return String(memo ?? '')
        .split('\n')
        .filter(line => !/^\s*(\(\([^)]*\)\)\s*)?(health|hp|hit points)\s*:/i.test(line))
        .map(line => line
            .replace(/\s*[|,;]?\s*\b\d+\s*\/\s*\d+\s*HP\b\s*([|,;]\s*)?/gi, (m, after) => (after ? ' | ' : ''))
            .replace(/:\s*\|\s*/, ': ')
            .replace(/\s*\|\s*$/, '')
            .replace(/:\s*$/, ''))
        .join('\n');
}

/** "[BODY] … [/BODY]" with one line per tracked character, or '' when nobody is tracked. */
export function bodyBlock(people) {
    const lines = Object.entries(people || {}).map(([who, p]) => status(who, p).replace(/\.$/, ''));
    return lines.length ? `[BODY]\n${lines.join('\n')}\n[/BODY]` : '';
}

export function losicaMemo(memo, people) {
    const body = bodyBlock(people);
    const stripped = stripHitPoints(memo);
    return body ? `${stripped.trimEnd()}\n${body}` : stripped;
}

export function trackedPeople() {
    return globalThis.SillyTavern?.getContext?.()?.chatMetadata?.losicaRules?.state?.people || {};
}
