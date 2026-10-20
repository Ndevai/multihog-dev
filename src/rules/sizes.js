const ANSUR = { male: { body: 0.509, head: 0.154, hand: 0.088, stature: 175.5 }, female: { body: 0.450, head: 0.147, hand: 0.078, stature: 162.6 } };
const PERSON = /\b(?:man|woman|men|women|boy|girl|child|person|people|figure|someone|somebody|stranger|occupant|guard|soldier|sailor|servant|maid|merchant|thief|rider|lady|gentleman|innkeeper|landlord|landlady|baker|surgeon|nurse|watchman|constable|priest|boatman|coachman|drover|traveller|customer|patient)\b/;
// [pattern, smallest dimension m, source]
const THINGS = [
    [/\bpenn(?:y|ies)\b/, 0.0308, 'British bronze penny 1860–1970, 30.81 mm (Royal Mint)'], [/\bhalfpenn(?:y|ies)\b/, 0.0255, 'bronze halfpenny 1860–1970, 25.48 mm (Royal Mint)'],
    [/\bfarthings?\b/, 0.0203, 'bronze farthing 1860–1956, 20.19 mm (Royal Mint)'], [/\bshillings?\b/, 0.0236, 'silver shilling 1816–1970, 23.6 mm (Royal Mint)'],
    [/\bsovereigns?\b/, 0.0221, 'gold sovereign from 1817, 22.05 mm (Royal Mint)'], [/\bcoins?\b/, 0.025, 'a coin of 20–31 mm, the range of the British coins above [ASSUMED middle]'],
    [/\bdoors?\b|\bdoorway\b/, 0.762, 'a door 2 ft 6 in (762 mm) wide, the common British house door [ASSUMED standard]'],
    [/\bwindows?\b|\bpane\b/, 0.6, 'a sash window opening about 2 ft (0.6 m) wide [ASSUMED]'],
    [/\bhorses?\b|\bmares?\b|\bponies\b|\bpony\b/, 0.6, 'a horse about 0.6 m across the body, seen from the front [ASSUMED]'],
    [/\bdogs?\b|\bhounds?\b/, 0.25, 'a medium dog about 0.25 m across [ASSUMED]'], [/\bcats?\b/, 0.12, 'a cat about 0.12 m across [ASSUMED]'],
    [/\b(?:letter|note|paper|page|sheet)s?\b/, 0.2, 'a sheet about 0.2 m wide (quarto, 8 × 10 in) [ASSUMED]'],
    [/\b(?:knife|knives|dagger)\b/, 0.025, 'a knife blade about 25 mm wide [ASSUMED]'], [/\b(?:key|keys)\b/, 0.02, 'a door key about 20 mm across its bow [ASSUMED]'],
    [/\b(?:carriages?|coach|coaches|carts?|wagons?|sledges?|sleighs?)\b/, 1.5, 'a cart or carriage about 1.5 m wide [ASSUMED]'],
    [/\b(?:ships?|boats?|barges?)\b/, 4, 'a boat or small ship about 4 m in the beam [ASSUMED]'],
    [/\b(?:lamp|lantern|candle)s?\b/, 0.15, 'a lamp or lantern about 0.15 m across [ASSUMED]'], [/\b(?:bottle|mug|cup|glass|tankard)s?\b/, 0.08, 'a cup, mug or bottle about 80 mm across [ASSUMED]'],
];
const sexOf = (s, sex) => sex === 'female' || (!sex && /\b(?:woman|women|girl|lady|maid|landlady|nurse)\b/.test(s)) ? 'female' : 'male';
/** The smallest dimension of what a target names, m, and the reason; null when nothing in the table fits. */
export function sizeOf(target, person) {
    const t = target.toLowerCase();
    const part = /\b(?:face|head)\b/.test(t) ? 'head' : /\b(?:hand|hands|glove|gloves)\b/.test(t) ? 'hand' : null;
    if (part || person || PERSON.test(t)) {
        const sex = sexOf(t, person?.sex), a = ANSUR[sex], k = person?.heightCm ? person.heightCm / a.stature : 1;
        const which = part ?? 'body', m = Math.round(a[which] * k * 1000) / 1000;
        return { m, source: `${which === 'body' ? 'a person seen from the front' : `a ${which === 'head' ? 'head or face' : 'hand or glove'}`}, ${Math.round(m * 1000)} mm: ANSUR II ${sex === 'female' ? 'women' : 'men'}'s median${k !== 1 ? `, scaled to a height of ${person.heightCm} cm` : ''}` };
    }
    const row = THINGS.find(([re]) => re.test(t));
    return row ? { m: row[1], source: row[2] } : null;
}
