// Retelling (2026-11-17, section 98; society's news, which travels from teller to teller): what the town finds reaches each
// person of the story at a time of their own, through a chain of tellers, and each telling drops and bends some of it, by
// meaning (memory-meaning.ts), so each holds their own version of the world's fact.
//
// When: the diffusion of a major news story in four American towns, 1957–58 (Deutschmann & Danielson 1960, Journalism
// Quarterly 37:345): about half knew by bedtime of the first day (Explorer I), two thirds of Lansing by the first evening for
// Eisenhower's stroke; a second day was needed every time to reach 90 %; 93 % knew in the end. Taken here: half hear on the
// day it is found, by ten at night; four tenths more the next day, between eight and ten; three in a hundred on the third;
// seven in a hundred never [ASSUMED shape between those points; those towns had radio and television, 1881 had neither, so
// this is at best as fast as news ran then].
// How many tellers: one for whoever hears it the first hours, one more for each four hours after [ASSUMED].
// What is lost: in Allport & Postman's serial retellings (1945, "The basic psychology of rumor", Trans N Y Acad Sci 8:61; The
// Psychology of Rumor, 1947), about 70 % of the details were gone after five or six tellings, as they report it (the figure
// is from my memory of the text, not checked against it); so each telling keeps a detail with 0.3^(1/5.5) = 0.80 [ASSUMED:
// the same share at every telling]. Field rumours drift less than the laboratory's (Rumor, Wikipedia, on later studies).
// Of what a telling does not keep, a third comes out changed (Allport & Postman's assimilation: bent toward what the teller
// expects) and the rest is left out (their levelling) [ASSUMED split].
import type { RuleState } from './types.js';
import { detailsOf } from './memory-drift.js';
import { heldBy, heldText, headNouns } from './memory-meaning.js';
import { def, peek } from './constants.js';

const DAY = 1440;
def({ id: 'retellLost', value: 0.7, unit: 'share of a story\'s details lost after five or six tellings', status: 'raw', src: 'Allport & Postman 1947, from memory of the text, not checked against it', range: [0.6, 0.8], file: 'retell.ts' });
def({ id: 'retellChanged', value: 1 / 3, unit: 'share of lost details changed rather than left out', status: 'assumed', src: 'Allport & Postman\'s sharpening and assimilation against levelling, no split given', range: [0.2, 0.5], file: 'retell.ts' });
def({ id: 'tellerHours', value: 4, unit: 'hours for each teller more', status: 'assumed', src: `news passes on as people meet; read with peek: each PassTime step reads it, and a sensitivity rerun of a day-long PassTime per judged value costs a phone too much`, range: [2, 8], file: 'retell.ts' });
def({ id: 'tellersMax', value: 6, unit: 'tellings at most', status: 'assumed', src: 'Allport & Postman\'s chains ran to six or seven', range: [4, 8], file: 'retell.ts' });
/** Each telling keeps a detail with this: (1 − retellLost)^(1/5.5). */
const keepEach = () => (1 - peek('retellLost')) ** (1 / 5.5);
const draw = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };

/** When a person hears news found at story minute `found`, from a fixed draw `u` (and `v` for the moment within the day), or
 *  null when they never do. */
export function hearsAt(found: number, u: number, v: number): number | null {
    const day0 = Math.floor(found / DAY) * DAY, waking = (d: number, from: number) => day0 + d * DAY + from + v * Math.max(0, 22 * 60 - from);
    if (u < 0.5) return waking(0, Math.max(8 * 60, found - day0));
    if (u < 0.9) return waking(1, 8 * 60);
    if (u < 0.93) return waking(2, 8 * 60);
    return null;
}
/** How many tellers news found at `found` has passed through by `at`. */
export const tellersBy = (found: number, at: number) => 1 + Math.min(peek('tellersMax') - 1, Math.floor(Math.max(0, at - found) / (peek('tellerHours') * 60)));

/** A fact as it reaches someone through `tellers` tellings: each detail kept with KEEP at each, a lost one changed a third of
 *  the time and left out otherwise, by meaning; `key` fixes the draws for this hearer. */
export function retold(text: string, tellers: number, key: string, alike: string[][] = []): string {
    const nouns = headNouns(text), held = retellFates(text, tellers, key).flatMap(x => x.fate === 'kept' ? [] : [heldBy(x.word, x.fate, draw(`${key}|${x.i}|way`), alike, nouns.has(x.word))]);
    return held.length ? heldText(text, held) : text;
}
/** Each detail's fate after `tellers` tellings, by its fixed draw: kept, changed or left out. */
export function retellFates(text: string, tellers: number, key: string): { word: string; i: number; fate: 'kept' | 'changed' | 'left' }[] {
    const keep = keepEach() ** tellers, changed = peek('retellChanged');
    return detailsOf(text).map((word, i) => { const u = draw(`${key}|${i}`); return { word, i, fate: u < keep ? 'kept' : u < keep + (1 - keep) * changed ? 'changed' : 'left' }; });
}
/** The schedule of a world fact found at `found` reaching each person who can hear it: one pending item each. */
export function spread(st: RuleState, fact: { id: number; text: string }, found: number, skip: string[] = []): void {
    for (const [who, p] of Object.entries(st.people ?? {})) {
        if (p.dead || skip.includes(who)) continue;
        const at = hearsAt(found, draw(`${fact.id}|${who}|when`), draw(`${fact.id}|${who}|moment`));
        if (at !== null) (st.pending ??= []).push({ at: Math.round(at), text: fact.text, who, of: fact.id, chain: tellersBy(found, at) });
    }
}
export { draw as retellDraw };
