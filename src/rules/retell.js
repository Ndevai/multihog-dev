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
const draw = (s) => { let h = 2166136261; for (const c of s)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
/** When a person hears news found at story minute `found`, from a fixed draw `u` (and `v` for the moment within the day), or
 *  null when they never do. */
export function hearsAt(found, u, v) {
    const day0 = Math.floor(found / DAY) * DAY, waking = (d, from) => day0 + d * DAY + from + v * Math.max(0, 22 * 60 - from);
    if (u < 0.5)
        return waking(0, Math.max(8 * 60, found - day0));
    if (u < 0.9)
        return waking(1, 8 * 60);
    if (u < 0.93)
        return waking(2, 8 * 60);
    return null;
}
/** How many tellers news found at `found` has passed through by `at`. */
export const tellersBy = (found, at) => 1 + Math.min(peek('tellersMax') - 1, Math.floor(Math.max(0, at - found) / (peek('tellerHours') * 60)));
/** A fact as it reaches someone through `tellers` tellings: each detail kept with KEEP at each, a lost one changed a third of
 *  the time and left out otherwise, by meaning; `key` fixes the draws for this hearer. */
export function retold(text, tellers, key, alike = []) {
    const nouns = headNouns(text), held = retellFates(text, tellers, key).flatMap(x => x.fate === 'kept' ? [] : [heldBy(x.word, x.fate, draw(`${key}|${x.i}|way`), alike, nouns.has(x.word))]);
    return held.length ? heldText(text, held) : text;
}
/** Each detail's fate after `tellers` tellings, by its fixed draw: kept, changed or left out. */
export function retellFates(text, tellers, key) {
    const keep = keepEach() ** tellers, changed = peek('retellChanged');
    return detailsOf(text).map((word, i) => { const u = draw(`${key}|${i}`); return { word, i, fate: u < keep ? 'kept' : u < keep + (1 - keep) * changed ? 'changed' : 'left' }; });
}
/** The schedule of a world fact found at `found` reaching each person who can hear it: one pending item each. */
export function spread(st, fact, found, skip = []) {
    for (const [who, p] of Object.entries(st.people ?? {})) {
        if (p.dead || skip.includes(who))
            continue;
        const at = hearsAt(found, draw(`${fact.id}|${who}|when`), draw(`${fact.id}|${who}|moment`));
        if (at !== null)
            (st.pending ??= []).push({ at: Math.round(at), text: fact.text, who, of: fact.id, chain: tellersBy(found, at) });
    }
}
export { draw as retellDraw };
