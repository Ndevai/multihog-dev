// What happens to a person's inventions when the person is gone from history (dies or never lives) before making them.
// The number of independent inventors of one invention follows a Poisson distribution: mean 1.4 fitted to Merton and
// Barber's 264 multiples, 1.2 to Ogburn and Thomas's 148 (Simonton 1979, J Pers Soc Psychol 37:1603, as reported by
// Garfield 1980, Current Contents 44:5); "somewhat more than unity and definitely less than two". Taking 1.3, the mean of
// the two fits: by the Poisson splitting property the other inventors of an invention, given one, are Poisson(1.3) too, so
// with that one removed nobody else makes it in e^−1.3 = 27 % of cases. A known multiple is made anyway by its other
// inventor. When someone else does make it, the delay is a draw from the gaps between the first two discoverers of listed
// multiples (median 1 year; 90 % within 25 years).
import { INVENTIONS, MULTIPLES, GAPS } from './data/inventions.js';
import { WD_INVENTIONS, PEOPLE } from './data/wikidata-inventions.js';
import { PARENTS } from './data/wikidata-parents.js';
import type { Rng } from './types.js';

export const MEAN_INVENTORS = 1.3;
const CLOSE_LOSS = 0.122;
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Both lists, one row per invention (same name and year once).
const ALL = (() => {
    const seen = new Set<string>(), out: [number, string, string[]][] = [];
    for (const r of [...INVENTIONS, ...WD_INVENTIONS]) { const k = `${r[0]}|${fold(r[1])}`; if (!seen.has(k)) { seen.add(k); out.push(r); } }
    return out;
})();
const matches = (p: string, n: string) => fold(p) === n || (!n.includes(' ') && fold(p).split(' ').pop() === n);

/** Inventions credited to `name` (full name, or a surname alone), made in or after `year`. */
export function inventionsOf(name: string, year: number): { year: number; what: string; by: string[] }[] {
    const n = fold(name.trim());
    return ALL.filter(([y, , by]) => y >= year && by.some(p => matches(p, n))).map(([y, what, by]) => ({ year: y, what, by }));
}

/** Birth year of `name` from Wikidata, or null. */
export function bornIn(name: string): number | null {
    const n = fold(name.trim()), k = Object.keys(PEOPLE).find(p => matches(p, n));
    return k ? PEOPLE[k][0] : null;
}

/** The paragraph listing this invention as a multiple: it names the person's surname, a word of the invention and a year
 * within 10 of it. */
function multipleOf(person: string, what: string, year: number): string | null {
    const surname = fold(person).split(' ').pop()!;
    const words = fold(what).split(/[^a-z]+/).filter(w => w.length >= 5);
    const near = (p: string) => (p.match(/\b(1[5-9]\d\d|20[0-2]\d)\b/g) ?? []).some(y => Math.abs(Number(y) - year) <= 10);
    return MULTIPLES.find(p => { const f = fold(p); return f.includes(surname) && words.some(w => f.includes(w)) && near(p); }) ?? null;
}

export interface Outcome { what: string; year: number; result: 'made by another inventor' | 'made later by someone else' | 'never made'; newYear?: number }

/** Each invention of `name` from `year` on: made anyway (a known multiple), made later, or never made, drawn once. */
export function removePerson(name: string, year: number, rng: Rng, gone: Set<string> = new Set([fold(name)])): Outcome[] {
    return inventionsOf(name, year).map(inv => {
        // A co-inventor goes on without them: collaborators of 112 scientists who died suddenly lost 5–8 % of their
        // quality-adjusted output for good, those closest in field 12.2 % (Azoulay, Graff Zivin & Wang 2010, Q J Econ
        // 125:549; NBER w14577 Table and text). The joint work is still done with probability 1 − 0.122 [ASSUMED: output
        // loss read as the chance of not reaching this result]; otherwise it falls to anyone else, as for a sole inventor.
        const others = inv.by.filter(p => fold(p) !== fold(name) && !gone.has(fold(p)));
        if (others.length && rng() >= CLOSE_LOSS) return { what: inv.what, year: inv.year, result: 'made by another inventor', newYear: inv.year };
        const para = multipleOf(name, inv.what, inv.year);
        if (para) {
            const ys = [...new Set((para.match(/\b(1[5-9]\d\d|20[0-2]\d)\b/g) ?? []).map(Number))].filter(y => y !== inv.year).sort((a, b) => a - b);
            return { what: inv.what, year: inv.year, result: 'made by another inventor', newYear: ys.find(y => y >= inv.year) ?? ys[0] ?? inv.year };
        }
        if (rng() < Math.exp(-MEAN_INVENTORS)) return { what: inv.what, year: inv.year, result: 'never made' };
        return { what: inv.what, year: inv.year, result: 'made later by someone else', newYear: inv.year + GAPS[Math.floor(rng() * GAPS.length)] };
    });
}

/**
 * A person gone from `year` and everyone who therefore never lives: a child whose recorded parent is gone before the child's
 * conception (born more than a year after; year resolution), then that child's children in turn. Each person with the year
 * they are gone from (a child: their birth year).
 */
export function goneWith(name: string, year: number): { name: string; from: number; parent?: string }[] {
    const out: { name: string; from: number; parent?: string }[] = [{ name, from: year }], seen = new Set([fold(name)]);
    for (let i = 0; i < out.length; i++) {
        const p = out[i];
        for (const [child, [born, parents]] of Object.entries(PARENTS)) {
            if (born == null || seen.has(fold(child)) || born <= p.from + 1 || !parents.some(q => fold(q) === fold(p.name))) continue;
            seen.add(fold(child));
            out.push({ name: child, from: born, parent: p.name });
        }
    }
    return out;
}

/** Everyone gone with `name` from `year`, and what becomes of each one's inventions, drawn once. */
export function removeWithDescendants(name: string, year: number, rng: Rng): { people: string[]; outcomes: Outcome[] } {
    const gone = goneWith(name, year), names = new Set(gone.map(g => fold(g.name)));
    return {
        people: gone.slice(1).map(g => `${g.name} is never born (a child of ${g.parent}).`),
        outcomes: gone.flatMap(g => removePerson(g.name, g.from, rng, names)),
    };
}

/** One sentence per outcome, for the world book. */
// Discoveries and inventions share the lists, so the wording covers both. "Never" is within the history so far: Simonton's
// "undiscoveries" are passed over in the period, not impossible.
export function outcomeLine(o: Outcome): string {
    const w = `${o.what[0].toUpperCase()}${o.what.slice(1)}`;
    if (o.result === 'never made') return `${w}: nobody has made or found it.`;
    if (o.result === 'made by another inventor') return `${w}: made or found by someone else${o.newYear && o.newYear !== o.year ? `, in ${o.newYear}` : ', at the same time'}.`;
    return `${w}: made or found by someone else, in ${o.newYear}.`;
}
