// Names on the tip of the tongue (2026-11-18, section 103; the player's point, 2026-11-17: "I can have something in mind and
// putting it to words is another step"). Knowing who someone is and finding their name are separate steps (Levelt, Roelofs &
// Meyer 1999); when the second fails, the person knows who they mean and feels the name is about to come: a tip-of-the-tongue
// state. People have one about once a week as young adults and about once a day as older adults (diary studies: Heine, Ober &
// Shenaut 1999; reviewed by Schwartz & Metcalfe 2011, Mem Cogn 39:737); names of acquaintances not met lately are the largest
// share of them (Burke, MacKay, Worthley & Wade 1991, J Mem Lang 30:542), because a link used rarely or long ago is weak. In
// one, people can often tell the name's first letter (57 % of the states that could be scored) and how many syllables it has
// (47 %) (Brown & McNeill 1966, J Verbal Learn Verbal Behav 5:325).
//
// The engine: for each person of the story with a proper name that a character holds in memory (a fact they hold names
// them), the chance that the name will not come when they reach for it now = totBase × (1 − how strongly they hold the
// strongest fact that names them, knowledge.ts recallStrength) × the age factor: 1 at 20 years, totAgeRatio (7: once a day
// against once a week) at 70, log-linear between [ASSUMED shape between the published ends]. One draw per name and story hour,
// so a name stays out of reach for the hour and may come back the next [ASSUMED: most states resolve within the hour].
// What they can still tell of it: its first letter and its syllables, each by its own fixed draw against Brown & McNeill's
// shares.
import type { Fact, RuleState } from './types.js';
import { def, k } from './constants.js';
import { heldFacts, recallStrength } from './knowledge.js';

def({ id: 'totBase', value: 0.1, unit: 'chance a name held as weakly as can be will not come, at 20 years', status: 'assumed', src: 'no per-attempt rate for acquaintances\' names was found; famous names prompted in the lab give states on a tenth or more of the trials (Brown 1991 review)', range: [0.03, 0.3], file: 'tongue.ts' });
def({ id: 'totAgeRatio', value: 7, unit: 'states at 70 years over states at 20', status: 'sourced', src: 'about once a day for older adults against once a week for young adults (Schwartz & Metcalfe 2011, after Heine, Ober & Shenaut 1999)', range: [4, 10], file: 'tongue.ts' });
def({ id: 'totFirstLetter', value: 0.57, unit: 'share of states with the first letter right', status: 'sourced', src: 'Brown & McNeill 1966, scorable states', range: [0.5, 0.65], file: 'tongue.ts' });
def({ id: 'totSyllables', value: 0.47, unit: 'share of states with the number of syllables right', status: 'sourced', src: 'Brown & McNeill 1966', range: [0.4, 0.55], file: 'tongue.ts' });

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const draw = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
/** A person's proper name: capitalized, not a role ("the lodger"). */
export const properName = (n: string) => /^\p{Lu}/u.test(n) && !/^(?:the|a|an)\s/i.test(n);
/** Syllables by vowel groups, a final silent "e" not counted ("Pike" one, "Thomas" two, "Mary" two). */
export function syllables(name: string): number {
    return name.split(/\s+/).reduce((s, w) => { const l = w.toLowerCase(), n = (l.match(/[aeiouy]+/g) ?? []).length; return s + Math.max(1, n - (/[^aeiouy]e$/.test(l) && !/le$/.test(l) && n > 1 ? 1 : 0)); }, 0);
}
/** The age factor: 1 at 20 years, totAgeRatio at 70, log-linear between, held at the ends. */
export const ageFactor = (age = 30) => k('totAgeRatio') ** ((Math.min(70, Math.max(20, age)) - 20) / 50);
/** The facts `who` holds now, their own (not common knowledge): `held` when the caller has them. */
const holds = (st: RuleState, who: string, held?: Fact[]) => held ?? heldFacts(st, who, (st.facts ?? []).filter(f => !f.everyone));
/** The chance that `name` will not come to `who` when they reach for it now; `held`, the facts `who` holds, when known. */
export function totChance(st: RuleState, who: string, name: string, held?: Fact[]): number {
    const key = ` ${norm(name)} `, naming = holds(st, who, held).filter(f => ` ${norm(f.text)} `.includes(key));
    if (!naming.length) return 0;
    const s = Math.max(...naming.map(f => recallStrength(st, f, who)));
    return Math.min(1, k('totBase') * (1 - s) * ageFactor(st.people?.[who]?.age));
}
export interface Tot { name: string; first?: string; syllables?: number }
/** The names on the tip of `who`'s tongue in this story hour: those whose draw for the hour falls under their chance; `held`,
 *  the facts `who` holds, when the caller has them. */
export function onTheTongue(st: RuleState, who: string, held?: Fact[]): Tot[] {
    const now = st.clock ? st.clock.t + st.clock.add : null;
    if (now === null) return [];
    const hour = Math.floor(now / 60), out: Tot[] = [], mine = holds(st, who, held);
    for (const name of Object.keys(st.people ?? {})) {
        if (!properName(name) || norm(name) === norm(who)) continue;
        const p = totChance(st, who, name, mine), key = `${norm(who)}|${norm(name)}`;
        if (!(p > 0 && draw(`${key}|tot|${hour}`) < p)) continue;
        out.push({ name, ...draw(`${key}|first|${hour}`) < k('totFirstLetter') ? { first: name[0]!.toUpperCase() } : {}, ...draw(`${key}|syllables|${hour}`) < k('totSyllables') ? { syllables: syllables(name) } : {} });
    }
    return out;
}
/** The words for a name on the tip of the tongue: the narrator's [KNOWS] line ("they"), the player's sheet ("you"). */
export function totPhrase(t: Tot, who: 'they' | 'you' = 'they'): string {
    const n = t.syllables, partial = [t.first ? `it starts with ${t.first}` : '', n ? `it has ${['', 'one', 'two', 'three', 'four', 'five', 'six'][n] ?? n} syllable${n === 1 ? '' : 's'}` : ''].filter(Boolean);
    return `${t.name}'s name will not come (${who} know who; ${partial.length ? `${who} can tell ${partial.join(' and ')}` : 'nothing of it comes'})`;
}
