// With the rules engine on, the engine's body state is shown on the sheet and in the narrator's state memo.
import { status } from './body-engine.js';
import { voiceOf, voiceLine, voiceFactsOf } from './voice-body.js';
import type { Person } from './types.js';

/** "[BODY] … [/BODY]" with one line per tracked character, or '' when nobody is tracked. */
export function bodyBlock(people: Record<string, Person> | null | undefined): string {
    const lines = Object.entries(people || {}).flatMap(([who, p]) => [status(who, p).replace(/\.$/, ''),
        // The voice the body gives (voice-body.ts), once BodySize has placed the person: the narrator describes it from these numbers.
        ...p.heightCm && p.sex && !p.dead ? [`${who}'s voice: ${voiceLine(voiceOf(voiceFactsOf(p)))}`] : []]);
    return lines.length ? `[BODY]\n${lines.join('\n')}\n[/BODY]` : '';
}

export function bodyMemo(memo: string | null | undefined, people: Record<string, Person> | null | undefined): string {
    const body = bodyBlock(people);
    const text = String(memo ?? '');
    return body ? `${text.trimEnd()}\n${body}` : text;
}

export function trackedPeople(): Record<string, Person> {
    return (globalThis as { SillyTavern?: typeof SillyTavern }).SillyTavern?.getContext?.()?.chatMetadata?.rulesEngine?.state?.people || {};
}
