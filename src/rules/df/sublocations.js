// Sub-locations of a part and their share of it: Cataclysm: Dark Days Ahead data/json/body_parts.json,
// sub_body_part max_coverage (CC BY-SA 3.0), keyed by DF part category. Sub-locations DF models as parts of
// their own (fingers, toes, throat, ears, face, upper/lower torso) are left out; the rest keep their CDDA weights.
export const SUBLOCATIONS = {
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
const SIDE = { forehead: 'front', nape: 'back', palm: 'front', 'back of hand': 'back' };
export const sideOf = name => SIDE[name] ?? 'both';

export const sublocationsOf = part => part.cats.map(k => SUBLOCATIONS[k]).find(Boolean) ?? null;

/** A sub-location of the part on the hit side, chosen with weight = its share (CDDA random_sub_part); null for a part without any. */
export function randomSublocation(part, rng, side = 'front') {
    const all = sublocationsOf(part);
    if (!all) return null;
    const subs = Object.fromEntries(Object.entries(all).filter(([k]) => sideOf(k) === 'both' || sideOf(k) === side));
    const total = Object.values(subs).reduce((s, x) => s + x, 0);
    let r = rng() * total;
    return Object.keys(subs).find(k => (r -= subs[k]) < 0) ?? Object.keys(subs).at(-1);
}

/** Share (0–1) of the part that a list of its sub-locations makes up; 1 for null (the whole part). */
export function shareOf(part, names) {
    const subs = sublocationsOf(part);
    if (!subs || !names) return 1;
    const total = Object.values(subs).reduce((s, x) => s + x, 0);
    return names.reduce((s, n) => s + (subs[n] ?? 0), 0) / total;
}
