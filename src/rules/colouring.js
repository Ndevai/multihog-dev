// How one the engine made looks where their record is silent (2026-11-20, sections 114, 118 and 119; the player's picks: their
// colouring from what causes it rather than from how often each colour was seen; dress by their trade and the year; the
// narrator told, so the story and the picture agree; a card's character left as their card shows them).
//
// Eyes from genes (section 119). Each person carries two copies of six DNA variants that do most of the work on the iris's
// melanin, the IrisPlex set (Walsh et al. 2011, Forensic Sci Int Genet 5:170, after Liu et al. 2009, Curr Biol 19:R192): HERC2
// rs12913832 (the switch for OCA2 in the iris: its A allele, brown), OCA2 rs1800407, SLC24A4 rs12896399, SLC45A2 rs16891982,
// TYR rs1393350, IRF4 rs12203592. The odds of blue, intermediate and brown eyes follow from the counts of one allele at each, by
// the model's own multinomial logistic regression. Its numbers were recovered from the 105 Slovenes of Kastelic et al. 2013
// (Croat Med J 54:381, Supplementary Table 3: each person's six genotypes and the probabilities the IrisPlex model gave them;
// 46 distinct genotypes): least squares on the log odds reproduce all 315 published probabilities within 0.0007, the table's
// rounding, so they are the model's. Counted alleles (forward strand, matched by frequency): rs16891982 C, rs12203592 T,
// rs1800407 T, rs12913832 A, rs12896399 T, rs1393350 A.
// Where the alleles come from: each copy drawn at the frequency of the people the person grew up among, the six loci apart
// [ASSUMED: no linkage between them; rs1800407 and rs12913832 lie 135 kb apart on chromosome 15]: 1000 Genomes phase 3
// (Ensembl, read 2026-11-20) for England (GBR, 91 people of England and Scotland, for a seeded story's people and Europe and
// North America [ASSUMED: today's frequencies stand for 1881's]), Africa (AFR), China (CHB), South East Asia (KHV), South Asia
// (SAS) and South America (AMR, today's mixed peoples [ASSUMED]); gnomAD v4 genomes' Middle Eastern group (147 people) for the
// Middle East. Run over England's frequencies the model gives 69.9 % blue, 8.7 % intermediate and 21.4 % brown eyes, where
// Beddoe counted 60.9 % light and 39.1 % hazel, brown or dark among 9,080 recruits (below); over the Middle East's, 6.7, 4.8
// and 88.5 %, where he counted 13.2 % light, 10.1 % neutral and 76.7 % dark among 546 Levantines. A child's copies are one from
// each parent (childGenotype), from the family the story fixes (section 120, genotypeOf).
// A blue eye is drawn blue or grey, an intermediate one dark grey, green or light hazel, evenly [ASSUMED: the model joins them]:
// "blue eyes" (2,547,927 posts), "grey eyes" (301,468), "green eyes" (1,235,578), "brown eyes" (1,118,234; Danbooru has no
// hazel tag).
// Hair: no open model from genes was found: the HIrisPlex hair model's numbers are not published (its own papers cite them
// without printing them), and Sturm et al. 2008, whose 3,011 twins had hair recorded, tabulates eyes alone. So hair stays
// with the counts, but given the eyes the genes made, which share its causes: of those with eyes like theirs, as many of each
// hair colour as Beddoe counted. England and Wales: the 9,080 recruits of the Hue and Cry, young men of 21, over about fifteen
// years before 1885 (Beddoe 1885, The Races of Britain, "Military Statistics", pp. 190–192, row "England and Wales, total";
// read from the page images of archive.org racesofbritainco00bedd, 2026-11-20), eyes in two classes, blue, gray or light, and
// hazel, brown or dark (an intermediate eye takes the second [ASSUMED: hazel is in it]); hair in five:
//   light eyes: red 237, fair or light brown 1,665, brown 2,465, dark 1,052, black 100 (5,519);
//   dark eyes:  red 91, fair or light brown 399, brown 1,577, dark 1,223, black 251 (3,541; the table prints 3,561, its
//   England row's cells summing 20 short of its total; the cells agree with the England and Wales rows, so they are used).
// The Middle East: Beddoe's own observations in the Levant (p. 216): Turkish soldiers at Constantinople (200), Osmanli of
// Constantinople and Brusa (150) and Armenians of five towns (196), 546 men, eyes in three classes, light, neutral ("dark gray,
// brownish-gray, very light hazel or yellow, hazel-gray … and most shades of green", p. 3) and dark:
//   light: red 1, fair 10, brown 26, dark 30, black 5 (72); neutral: red 1, fair 3, brown 15.5, dark 28.5, black 7 (55);
//   dark: red 1, fair 0.5, brown 28.5, dark 148, black 241 (419) (his halves are his own, a case between two classes).
// The same shares for women, girls and the old [ASSUMED: the tables hold men]. For the other regions no hair counts were
// found (Katsara & Nothnagel 2019, Forensic Sci Int Genet 39:109: "a quite low amount of available data, especially outside
// Europe"), so the image model chooses the hair there. In the picture: red "red hair" (760,095); fair or light brown, the one
// drawn of the two, "blonde hair" (2,246,150) or "brown hair" (2,153,494); brown and dark brown "brown hair" (no tag for light
// or dark brown); black "black hair" (2,276,179).
// Greying: the age at which a person's hair is half grey is drawn once, from a normal of width greyHalfSd whose share by 50
// is greyHalfAt50 (Panhard, Lozano & Loussouarn 2012, Br J Dermatol 167:865; 4,192 people: 6–23 % with at least half their
// hair grey at 50 by origin, those of Asian and African descent less grey than those of European [ASSUMED: the top of the range
// for Europe, the Middle East and South America, the bottom, greyHalfAt50Low, for Africa and the Asias]). From that age the
// picture draws "grey hair" (1,065,380 posts) and the narrator reads "grey hair, once …".
// Dress: the working dress of their trade in the story's year, as the trade and year are named to the picture; no count of
// dress exists, so neither the picture nor the narrator is told more than the trade and the year.
import { seededRng, gauss } from './body-engine.js';
import { def, k } from './constants.js';
def({ id: 'greyHalfAt50', value: 0.23, unit: 'share with at least half their hair grey at 50', status: 'sourced', src: 'Panhard, Lozano & Loussouarn 2012, Br J Dermatol 167:865: 6–23 % by origin, the European the greyest [ASSUMED: the top of the range]', range: [0.06, 0.23], file: 'colouring.ts' });
def({ id: 'greyHalfAt50Low', value: 0.06, unit: 'share with at least half their hair grey at 50, among peoples who grey least', status: 'sourced', src: 'Panhard, Lozano & Loussouarn 2012, Br J Dermatol 167:865: 6–23 % by origin, Asian and African descent the least grey [ASSUMED: the bottom of the range]', range: [0.03, 0.12], file: 'colouring.ts' });
def({ id: 'greyHalfSd', value: 12, unit: 'years, spread of the age at which hair is half grey', status: 'assumed', src: 'the one share the survey gives (by 50) needs a spread [ASSUMED]', range: [8, 16], file: 'colouring.ts' });
/** England and Wales's hair counts given the eyes: [eyes][hair], eyes light then dark, hair red, fair or light brown, brown,
 *  dark or dark brown, black. */
export const BEDDOE_EW = [[237, 1665, 2465, 1052, 100], [91, 399, 1577, 1223, 251]];
/** The Levant's (section 118): [eyes][hair], eyes light, neutral and dark, hair as above. */
export const BEDDOE_LEVANT = [[1, 10, 26, 30, 5], [1, 3, 15.5, 28.5, 7], [1, 0.5, 28.5, 148, 241]];
/** The IrisPlex eye model: the log odds of blue, then of intermediate, against brown eyes: an intercept, then one coefficient
 *  for each copy of the counted allele at rs16891982, rs12203592, rs1800407, rs12913832, rs12896399, rs1393350. */
export const IRISPLEX = { snps: ['rs16891982', 'rs12203592', 'rs1800407', 'rs12913832', 'rs12896399', 'rs1393350'], counted: ['C', 'T', 'T', 'A', 'T', 'A'],
    blue: [3.8487, -1.5305, 0.5961, 1.1538, -4.8807, -0.5261, 0.4428], intermediate: [0.3776, -0.7363, 0.6862, 1.0522, -1.994, -0.0081, 0.2586] };
/** The counted alleles' frequencies, in the order of IRISPLEX.snps, by the people someone grew up among. */
export const ALLELES = {
    GBR: [0.022, 0.1813, 0.0714, 0.1813, 0.3901, 0.2747], MID: [0.5306, 0.0442, 0.0272, 0.7891, 0.2313, 0.1952], AFR: [0.9644, 0.0083, 0.0015, 0.972, 0.0212, 0.0083],
    CHB: [0.9854, 0, 0.0049, 1, 0.2913, 0], KHV: [0.9899, 0, 0, 1, 0.3485, 0.0152], SAS: [0.9407, 0.0061, 0.0266, 0.9294, 0.3272, 0.0542], AMR: [0.536, 0.072, 0.0317, 0.7983, 0.2522, 0.1225],
};
const REGION_PEOPLE = { 'Europe/North America': 'GBR', 'Middle East': 'MID', Africa: 'AFR', China: 'CHB', 'South East Asia': 'KHV', 'South Asia': 'SAS', 'South America': 'AMR' };
/** The people someone of `region` grew up among, for their alleles (a seeded story's people, region unset, England's). */
export const peopleOf = (region) => !region ? 'GBR' : REGION_PEOPLE[region] ?? null;
/** The hair counts given the eyes, by people: England and Wales's for England, the Levant's for the Middle East. */
export const hairCountsFor = (people) => people === 'GBR' ? BEDDOE_EW : people === 'MID' ? BEDDOE_LEVANT : null;
/** Two copies drawn at each locus: the number of counted alleles, 0 to 2. */
export const drawGenotype = (rng, freqs) => freqs.map(f => (rng() < f ? 1 : 0) + (rng() < f ? 1 : 0));
/** A child's genotype: one copy from each parent, either of theirs alike. */
export const childGenotype = (a, b, rng) => a.map((x, i) => (rng() < x / 2 ? 1 : 0) + (rng() < b[i] / 2 ? 1 : 0));
/** The odds of blue, intermediate and brown eyes for a genotype (IRISPLEX). */
export function eyeOdds(g) {
    const lin = (c) => c[0] + g.reduce((s, x, i) => s + c[i + 1] * x, 0), b = Math.exp(lin(IRISPLEX.blue)), m = Math.exp(lin(IRISPLEX.intermediate)), t = 1 + b + m;
    return [b / t, m / t, 1 / t];
}
/** Draws a colouring for someone of `people` with `rng`: their genotype (or the one given), their eyes by its odds, their hair
 *  by the counts given those eyes, and, given an age, whether the hair is grey by then. */
export function drawColouring(rng, people = 'GBR', age, genotype) {
    const g = genotype ?? drawGenotype(rng, ALLELES[people] ?? ALLELES.GBR), [pb, pm] = eyeOdds(g), u = rng(), eye = u < pb ? 0 : u < pb + pm ? 1 : 2, part = rng();
    const eyeWords = eye === 0 ? (part < 0.5 ? ['blue eyes', 'blue eyes'] : ['grey eyes', 'grey eyes']) : eye === 2 ? ['brown eyes', 'brown eyes']
        : part < 1 / 3 ? ['dark grey eyes', 'grey eyes'] : part < 2 / 3 ? ['green eyes', 'green eyes'] : ['light hazel eyes', 'brown eyes'];
    // Hair by the counts of those with eyes like these: England's two classes (an intermediate eye with the dark), the
    // Levant's three.
    const counts = hairCountsFor(people), row = counts ? counts[counts.length === 2 ? Math.min(eye, 1) : eye] : null, total = row?.reduce((a, b) => a + b, 0) ?? 0;
    let r = rng() * total, hair = 0;
    if (row) {
        for (hair = 0; hair < 4; hair++) {
            r -= row[hair];
            if (r < 0)
                break;
        }
    }
    const half = rng() < 0.5;
    const hairWords = row ? [['red hair', 'red hair'], half ? ['fair hair', 'blonde hair'] : ['light brown hair', 'brown hair'], ['brown hair', 'brown hair'], ['dark brown hair', 'brown hair'], ['black hair', 'black hair']][hair] : null;
    // The age the hair is half grey, drawn always so the rest of the draw stays the same with or without an age.
    const low = ['AFR', 'CHB', 'KHV', 'SAS'].includes(people), sd = k('greyHalfSd'), halfGrey = 50 - sd * probit(k(low ? 'greyHalfAt50Low' : 'greyHalfAt50')) + sd * gauss(rng);
    const grey = age != null && age >= halfGrey, base = { eyes: eyeWords[0], eyeTag: eyeWords[1], genotype: g };
    if (grey)
        return { ...base, hair: hairWords ? `grey hair, once ${hairWords[0].replace(/ hair$/, '')}` : 'grey hair', hairTag: 'grey hair', grey };
    return hairWords ? { ...base, hair: hairWords[0], hairTag: hairWords[1] } : base;
}
/** The standard normal's quantile (Acklam's rational approximation, relative error under 1.2e-9). */
export function probit(p) {
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const lo = 0.02425, q = p < lo ? Math.sqrt(-2 * Math.log(p)) : p > 1 - lo ? Math.sqrt(-2 * Math.log(1 - p)) : 0;
    if (p < lo)
        return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    if (p > 1 - lo)
        return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
    const m = p - 0.5, r = m * m;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * m / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
/** The colouring of one the engine made, `who` in the chat `chatId`, at `age`, or null where no alleles fit (no seeded story, or
 *  grown up where none were found). Fixed by the chat and the name, so every reading gives the same; their genes, when given,
 *  from their family (genotypeOf). */
export function colouringOf(who, chatId, region, seeded, age, genotype) {
    const people = peopleOf(region);
    if (!seeded || !people)
        return null;
    return drawColouring(seededRng(`colouring\n${chatId}\n${who}`), people, age, genotype);
}
/** `who`'s genes (section 120): one copy at each locus from each parent, where the story has the parent among its people
 *  (their own genes, found the same way). Brothers and sisters whose parents the story never shows share two unseen ones: the
 *  first of them recorded (the family's key) keeps the genes they were drawn with, and each unseen parent gave them one of their
 *  two copies and carries another drawn from their people, so the first stays as described and the rest inherit from the same
 *  two. A parent the story does not show, beside one it does, is drawn from the people `who` grew up among; with no family,
 *  `who` is drawn from that people as anyone is. Fixed by the chat and the names. */
export function genotypeOf(who, chatId, people, seen = new Set()) {
    const p = people[who], freqs = ALLELES[peopleOf(p?.region) ?? 'GBR'] ?? ALLELES.GBR;
    const fresh = (key) => drawGenotype(seededRng(`genes\n${chatId}\n${key}`), freqs);
    seen.add(who);
    const kin = p?.kin, shown = (name) => !!name && !!people[name] && !seen.has(name);
    if (!kin || (!kin.mother && !kin.father && !kin.family))
        return fresh(who);
    const fam = kin.family, first = fam ? people[fam] : undefined;
    // The family's first keeps theirs, unless the story shows their parents.
    if (fam === who && !shown(kin.mother) && !shown(kin.father))
        return fresh(who);
    // The family's unseen parents, from its first: each gave them one copy (a single copy, from either alike) and carries another.
    const unseen = () => {
        const g = fam && first && !seen.has(fam) ? genotypeOf(fam, chatId, people, new Set(seen)) : fresh(`${fam ?? who}\nfirst`);
        const r = seededRng(`family\n${chatId}\n${fam ?? who}`), m = [], f = [];
        g.forEach((c, i) => { const fromM = c === 2 || (c === 1 && r() < 0.5) ? 1 : 0, fromF = c - fromM; m.push(fromM + (r() < freqs[i] ? 1 : 0)); f.push(fromF + (r() < freqs[i] ? 1 : 0)); });
        return [m, f];
    };
    // A family's shown parent is the first's too (recordKin copies it across); one shown parent and one unseen, the unseen from
    // the family's pair where there is a family, else drawn.
    const famParents = fam && fam !== who && !(first?.kin?.mother && shown(first.kin.mother)) ? unseen() : null;
    const mother = shown(kin.mother) ? genotypeOf(kin.mother, chatId, people, new Set(seen)) : famParents?.[0] ?? fresh(`${fam ?? who}\nmother`);
    const father = shown(kin.father) ? genotypeOf(kin.father, chatId, people, new Set(seen)) : famParents?.[1] ?? fresh(`${fam ?? who}\nfather`);
    return childGenotype(mother, father, seededRng(`inherit\n${chatId}\n${who}`));
}
/** What they wear, in words: the working dress of their trade in the year, or the everyday dress of the year. */
export const dressOf = (occupation, year) => `${occupation ? `the working dress of a ${occupation.toLowerCase()}` : 'everyday dress'}${year != null ? ` of ${year}` : ''}`;
