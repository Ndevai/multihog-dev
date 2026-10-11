import type { Creature, Part } from './raws.js';
import type { Rng } from '../types.js';

// Sub-locations of a part and their share of it: Cataclysm: Dark Days Ahead data/json/body_parts.json,
// sub_body_part max_coverage (CC BY-SA 3.0), keyed by DF part category. Sub-locations DF models as parts of
// their own (fingers, toes, throat, ears, face, upper/lower torso) are left out; the rest keep their CDDA weights.
export const SUBLOCATIONS: Record<string, Record<string, number>> = {
    HEAD: { forehead: 15, crown: 25, nape: 20 },
    ARM_UPPER: { shoulder: 20, 'upper arm': 40 },
    ARM_LOWER: { elbow: 5, forearm: 35 },
    HAND: { wrist: 10, palm: 20, 'back of hand': 20 },
    LEG_UPPER: { hip: 20, thigh: 40 },
    LEG_LOWER: { knee: 5, shin: 35 },
    FOOT: { sole: 25, arch: 25, ankle: 20, heel: 20 },
};

// Side of a sub-location; others face both ways. Front and back halves are equal in area for every region (rule of
// nines, adult: head 4.5/4.5 %, torso 18/18 %, each arm 4.5/4.5 %, each leg 9/9 %).
/** Every sub-location name, for the covers of worn gear. */
export const SUBLOCATION_NAMES = (): string[] => [...new Set(Object.values(SUBLOCATIONS).flatMap(o => Object.keys(o)))];
export type Side = 'front' | 'back' | 'both';
const SIDE: Record<string, Side> = { forehead: 'front', nape: 'back', palm: 'front', 'back of hand': 'back' };
export const sideOf = (name: string): Side => SIDE[name] ?? 'both';

// Hit sizes of whole regions (CDDA body_parts.json hit_size): torso 36, head 4, eyes 0.5, mouth 0.5, each arm 13, hand 1.5,
// leg 13, foot 2. A region DF splits into several parts shares its size by DF relsize. Parts outside these regions (neck,
// fingers, ears…) are hit only when aimed. CDDA anatomy::select_body_part: weight = hit size; an attacker of 46.25 L or less
// that does not fly cannot reach the head, eyes or mouth and hits legs and feet × 3.
const HIT_REGION: Record<string, [string, number]> = { BODY_UPPER: ['torso', 36], BODY_LOWER: ['torso', 36], HEAD: ['head', 4], EYE: ['eyes', 0.5], MOUTH: ['mouth', 0.5],
    ARM_UPPER: ['arm', 13], ARM_LOWER: ['arm', 13], HAND: ['hand', 1.5], LEG_UPPER: ['leg', 13], LEG_LOWER: ['leg', 13], FOOT: ['foot', 2] };
const UPPER = ['head', 'eyes', 'mouth'], LOWER = ['leg', 'foot'];

/** A body part for a blow that is not aimed; null when the creature has no part to hit. */
export function randomHitPart(c: Creature, rng: Rng, { attackerCm3 = Infinity, flies = false } = {}): Part | null {
    const regionOf = (p: Part) => p.cats.map(k => HIT_REGION[k]).find(Boolean);
    const short = attackerCm3 <= 46250 && !flies;
    const humanShaped = c.parts.some(p => regionOf(p)?.[0] === 'torso') && c.parts.some(p => regionOf(p)?.[0] === 'arm');
    let parts: Part[], weights: number[];
    if (humanShaped) {
        // CDDA region sizes; a region on one side (or unsided) shares its size among its DF parts by relsize.
        parts = c.parts.filter(p => regionOf(p) && !p.flags.includes('INTERNAL'));
        const key = (p: Part) => `${regionOf(p)![0]}:${p.flags.includes('LEFT') ? 'L' : p.flags.includes('RIGHT') ? 'R' : ''}`;
        const rel: Record<string, number> = {};
        for (const p of parts) rel[key(p)] = (rel[key(p)] || 0) + p.relsize;
        weights = parts.map(p => {
            const [region, size] = regionOf(p)!;
            if (short && UPPER.includes(region)) return 0;
            // eyes: the pair has size 0.5, one per side
            const share = size * p.relsize / rel[key(p)] * (region === 'eyes' ? 0.5 : 1);
            return short && LOWER.includes(region) ? share * 3 : share;
        });
    } else {
        // Other bodies: DF relsize of the main outer parts (not INTERNAL, EMBEDDED or SMALL) [ASSUMED].
        parts = c.parts.filter(p => !['INTERNAL', 'EMBEDDED', 'SMALL'].some(f => p.flags.includes(f)) && p.relsize > 0);
        weights = parts.map(p => {
            if (short && p.flags.includes('HEAD')) return 0;
            return short && (p.flags.includes('STANCE') || p.cats.some(k => k.startsWith('LEG'))) ? p.relsize * 3 : p.relsize;
        });
    }
    const total = weights.reduce((s, w) => s + w, 0);
    if (!total) return null;
    let r = rng() * total;
    return parts.find((p, i) => (r -= weights[i]) < 0) ?? parts.at(-1) ?? null;
}

export const sublocationsOf = (part: Part): Record<string, number> | null => part.cats.map(k => SUBLOCATIONS[k]).find(Boolean) ?? null;

/** A sub-location of the part on the hit side, chosen with weight = its share (CDDA random_sub_part); null for a part without any. */
export function randomSublocation(part: Part, rng: Rng, side: Side = 'front'): string | null {
    const all = sublocationsOf(part);
    if (!all) return null;
    const subs = Object.fromEntries(Object.entries(all).filter(([k]) => sideOf(k) === 'both' || sideOf(k) === side));
    const total = Object.values(subs).reduce((s, x) => s + x, 0);
    let r = rng() * total;
    return Object.keys(subs).find(k => (r -= subs[k]) < 0) ?? Object.keys(subs).at(-1) ?? null;
}

/** Share (0–1) of the part that a list of its sub-locations makes up; 1 for null (the whole part). */
export function shareOf(part: Part, names: string[] | null | undefined): number {
    const subs = sublocationsOf(part);
    if (!subs || !names) return 1;
    const total = Object.values(subs).reduce((s, x) => s + x, 0);
    return names.reduce((s, n) => s + (subs[n] ?? 0), 0) / total;
}
