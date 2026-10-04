// With the Losica rules on, the engine's body state is shown on the sheet and in the narrator's state memo.
import { status } from './losica-engine.js';

/** "[BODY] … [/BODY]" with one line per tracked character, or '' when nobody is tracked. */
export function bodyBlock(people) {
    const lines = Object.entries(people || {}).map(([who, p]) => status(who, p).replace(/\.$/, ''));
    return lines.length ? `[BODY]\n${lines.join('\n')}\n[/BODY]` : '';
}

export function losicaMemo(memo, people) {
    const body = bodyBlock(people);
    const text = String(memo ?? '');
    return body ? `${text.trimEnd()}\n${body}` : text;
}

export function trackedPeople() {
    return globalThis.SillyTavern?.getContext?.()?.chatMetadata?.losicaRules?.state?.people || {};
}
