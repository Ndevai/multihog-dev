const ANSUR = { male: { body: 0.509, head: 0.154, hand: 0.088, stature: 175.5 }, female: { body: 0.450, head: 0.147, hand: 0.078, stature: 162.6 } };
const PART_OF = { 'a person': 'body', 'a head or face': 'head', 'a hand': 'hand' };
const THINGS = {
    'a penny (British, 1860–1970)': [0.0308, '30.81 mm (Royal Mint)'], 'a halfpenny (British, 1860–1970)': [0.0255, '25.48 mm (Royal Mint)'],
    'a farthing (British, 1860–1956)': [0.0203, '20.19 mm (Royal Mint)'], 'a shilling (British, 1816–1970)': [0.0236, '23.6 mm (Royal Mint)'],
    'a sovereign (British gold)': [0.0221, '22.05 mm (Royal Mint)'], 'another coin': [0.025, '25 mm, the middle of the British coins above [ASSUMED]'],
    'a door or doorway': [0.762, '2 ft 6 in, the common house door [ASSUMED]'], 'a window': [0.6, 'a sash opening about 2 ft [ASSUMED]'],
    'a horse or other large beast': [0.6, 'about 0.6 m across the body [ASSUMED]'], 'a dog or similar animal': [0.25, 'about 0.25 m across [ASSUMED]'],
    'a cat or small animal': [0.12, 'about 0.12 m across [ASSUMED]'], 'a sheet of paper, letter or book': [0.2, 'quarto, 8 × 10 in [ASSUMED]'],
    'a blade or tool': [0.025, 'a blade about 25 mm wide [ASSUMED]'], 'a key, ring or small object': [0.02, 'about 20 mm [ASSUMED]'],
    'a cup, bottle or lamp': [0.08, 'about 80 mm across [ASSUMED]'], 'a cart, carriage or sledge': [1.5, 'about 1.5 m wide [ASSUMED]'],
    'a boat or ship': [4, 'about 4 m in the beam [ASSUMED]'],
};
export const SIZE_KINDS = [...Object.keys(PART_OF), ...Object.keys(THINGS), 'something else (give size_m)'];
/** The smallest dimension of a kind of thing, m, and its source; null for "something else". A person's parts take the sex
 *  and height on record; with neither, the mean of the men's and women's medians [ASSUMED]. */
export function sizeOf(kind, person) {
    const part = PART_OF[kind];
    if (part) {
        const sexes = person?.sex === 'female' || person?.sex === 'male' ? [ANSUR[person.sex]] : [ANSUR.male, ANSUR.female];
        const k = person?.heightCm ? person.heightCm / (sexes.reduce((s, a) => s + a.stature, 0) / sexes.length) : 1;
        const m = Math.round(sexes.reduce((s, a) => s + a[part], 0) / sexes.length * k * 1000) / 1000;
        return { m, source: `${Math.round(m * 1000)} mm, ANSUR II median${sexes.length > 1 ? 's of men and women' : ''}${k !== 1 ? `, scaled to ${person.heightCm} cm` : ''}` };
    }
    const row = THINGS[kind];
    return row ? { m: row[0], source: row[1] } : null;
}
