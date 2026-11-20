// The world year by year (2026-11-17, section 96; the player's ask: "a count of how many people exist which gets updated year
// from year, and the monster info"): for a seeded story, the people of England and Wales each year from the seed's year, how
// many of them are of the kind, and how many the kind killed, as the story's clock moves on.
//
// The people as they were: births and deaths each calendar year from the Registrar General's Annual Reports (1850–1920), and
// the censuses of 1881, 1891, 1901, 1911 and 1921, both as Vision of Britain tabulates them for England and Wales
// (visionofbritain.org.uk, unit 10001043: Births by sex, Total Deaths, Total Population). Between two censuses, births less
// deaths overshoot the next census by the people who left (and, in 1911–21, the soldiers who died abroad, whom the
// Registrar General's deaths do not hold): that difference is spread evenly over the decade's years. Each year's births,
// deaths and leaving are taken as shares of that year's real people, so a story whose people are fewer has fewer of each.
//
// The kind's own number (section 110; the sheet's Numbers, kind-sheet.ts): each of them lives a human's life (the sheet's
// lifespan), so they die and leave at the place's rates; new ones come by the kind's origin: born so, their children at the
// place's birth rate (the children of the others are human [ASSUMED: only the born pass it on]); made, kindMadeRate of their
// number a year, taken from the living; came back from death, kindReturnRate of the place's dead (the Registrar General's
// deaths; those the kind kills are its food [ASSUMED]); came from elsewhere, kindArriveRate of their number a year, new to the
// place. Each one kills what it needs of the living, or the seed's D for a kind that kills without eating; one that eats the
// dead takes the place's dead first. One that eats its own loses them at the rate that halves them (seed.ts outcomeFor). One
// whose food is the living and finds too few starves within the year in the share it cannot feed [derived: total starvation
// kills in 40–60 days, Tipton & Montgomery 2025, as body-engine.ts holds].
import { def, k } from './constants.js';
def({ id: 'kindMadeRate', value: 0.01, unit: 'of their number made from the living a year', status: 'assumed', src: 'kind-sheet.ts Numbers: 1 % a year [ASSUMED until a measured rate is found]', range: [0.001, 0.1], file: 'world-count.ts' });
def({ id: 'kindReturnRate', value: 0.01, unit: 'of the place\'s dead who come back as one of them', status: 'assumed', src: 'kind-sheet.ts Numbers: 1 %, as the returning dead of an outbreak model take such a rate as a parameter (Munz, Hudea, Imad & Smith? 2009, "When zombies attack!")', range: [0.001, 0.1], file: 'world-count.ts' });
def({ id: 'kindArriveRate', value: 0.01, unit: 'of their number arriving from elsewhere a year', status: 'assumed', src: 'kind-sheet.ts Numbers: 1 % a year [ASSUMED until a measured rate is found]', range: [0.001, 0.1], file: 'world-count.ts' });
/** How new ones of the kind come (kind-sheet.ts ORIGIN's four). */
export type Origin = 'born' | 'made' | 'returned' | 'arrived';
/** The rate a year a kind of `origin` gains new ones at, beside the born's birth rate: for the made and the arrived a share
 *  of their number, for the returned a share of the place's dead; null for the born. */
export const comeRate = (origin: Origin): number | null => origin === 'made' ? k('kindMadeRate') : origin === 'returned' ? k('kindReturnRate') : origin === 'arrived' ? k('kindArriveRate') : null;
/** How the kind's number changes and what it takes (seed.ts kindGrowth reads it from the seed's plan). */
export interface KindGrowth {
    origin: Origin;
    /** The living each one kills a year: what it needs of them (prey K, R), or the seed's D for one that kills without eating. */
    killsEach: number;
    /** It eats the dead (prey R): the place's dead feed it first, and it kills only for the rest. */
    eatsDead: boolean;
    /** Its kills are its food: what it cannot find, it starves for. */
    feeds: boolean;
    /** It eats its own (prey O): the rate a year that thins them, ln 2 over the years they take to halve. */
    eatsOwn: number;
}
const VITAL: Record<number, [number, number]> = {
    1850: [593422, 368995], 1851: [615865, 395396], 1852: [624012, 407135], 1853: [612391, 421097], 1854: [634405, 437905], 1855: [635043, 425703], 1856: [657453, 390506], 1857: [663071, 419815], 1858: [655481, 449656], 1859: [689881, 440781],
    1860: [684048, 422721], 1861: [696406, 435114], 1862: [712684, 436566], 1863: [727417, 473837], 1864: [740275, 495531], 1865: [748069, 490909], 1866: [753870, 500689], 1867: [768349, 471073], 1868: [786858, 480622], 1869: [773381, 494828],
    1870: [792787, 515329], 1871: [797428, 514879], 1872: [825907, 492265], 1873: [829778, 492520], 1874: [854956, 526632], 1875: [850607, 546453], 1876: [887968, 510315], 1877: [888200, 500496], 1878: [891906, 539872], 1879: [880389, 526255],
    1880: [881643, 528624],
    1881: [883642, 491935], 1882: [889014, 516654], 1883: [890722, 522997], 1884: [906750, 530828], 1885: [894270, 522750], 1886: [903866, 537276], 1887: [886331, 530758], 1888: [879868, 510971], 1889: [885944, 518353], 1890: [869937, 562248],
    1891: [914157, 587925], 1892: [897957, 559684], 1893: [914542, 569958], 1894: [890289, 498827], 1895: [922291, 568997], 1896: [915309, 526727], 1897: [921693, 541487], 1898: [923265, 552141], 1899: [928646, 581799], 1900: [927062, 587830],
    1901: [929807, 551585], 1902: [940509, 535538], 1903: [948271, 514628], 1904: [945389, 549784], 1905: [929293, 520031], 1906: [935081, 531281], 1907: [918042, 524221], 1908: [940383, 520456], 1909: [914472, 518003], 1910: [896962, 483247],
    1911: [881138, 527810], 1912: [872537, 486939], 1913: [881890, 504975], 1914: [879096, 516742], 1915: [813147, 552543], 1916: [785520, 496704], 1917: [668346, 486965], 1918: [662661, 587828], 1919: [692438, 495478], 1920: [957782, 464680],
};
// Since section 109 the count runs from 1841: the censuses of 1841, 1851, 1861 and 1871 (Vision of Britain, Total Population),
// births and deaths from 1850; for 1841–1849, before the tabulated record, each year's births and deaths are 1850's per person
// [ASSUMED: the nearest year recorded], and the decade's leavers close it on the 1851 census as for every decade.
export const CENSUS: Record<number, number> = { 1841: 15916388, 1851: 17927385, 1861: 20066224, 1871: 22712266, 1881: 25974439, 1891: 29003520, 1901: 32469338, 1911: 36065951, 1921: 37886720 };
export const COUNT_YEARS: [number, number] = [1841, 1921];
/** A year's births and deaths: as recorded from 1850, before then at 1850's rate per person of the year's people. */
const vitalOf = (y: number, people: number, ref: number): [number, number] => VITAL[y] ?? [VITAL[1850]![0] * people / ref, VITAL[1850]![1] * people / ref];

/** The real people of each year from 1841 to 1921 (each census, then births less deaths less the decade's leavers), and the
 *  year's births, deaths and leavers. */
function realYears(): Record<number, { people: number; births: number; deaths: number; left: number }> {
    const out: Record<number, { people: number; births: number; deaths: number; left: number }> = {};
    // 1850's people for its rate per person, the 1841–1851 decade read geometrically between its censuses [ASSUMED]
    const ref = CENSUS[1841]! * (CENSUS[1851]! / CENSUS[1841]!) ** 0.9, guess = (y: number) => CENSUS[1841]! * (CENSUS[1851]! / CENSUS[1841]!) ** ((y - 1841) / 10);
    for (let c = COUNT_YEARS[0]; c < COUNT_YEARS[1]; c += 10) {
        let natural = 0;
        for (let y = c; y < c + 10; y++) { const [b, d] = vitalOf(y, guess(y), ref); natural += b - d; }
        const left = (CENSUS[c]! + natural - CENSUS[c + 10]!) / 10;
        let people = CENSUS[c]!;
        for (let y = c; y < c + 10; y++) { const [births, deaths] = vitalOf(y, guess(y), ref); out[y] = { people, births, deaths, left }; people += births - deaths - left; }
    }
    out[COUNT_YEARS[1]] = { people: CENSUS[COUNT_YEARS[1]]!, births: 0, deaths: 0, left: 0 };
    return out;
}

/** England and Wales in `year` (1841–1921): its people at the year's census day, and births and deaths per 1,000 of them
 *  (1921 takes 1920's rates, the last recorded); null outside the records. */
export function ewYear(year: number): { people: number; births: number; deaths: number } | null {
    if (year < COUNT_YEARS[0] || year > COUNT_YEARS[1]) return null;
    const real = realYears(), r = real[Math.min(year, COUNT_YEARS[1] - 1)]!;
    return { people: real[year]!.people, births: r.births / r.people * 1000, deaths: r.deaths / r.people * 1000 };
}
/** One year of the story's world: the people at its start, those of the kind among them, and through the year the births,
 *  the other deaths, those who left, and the kind's kills. */
export interface CountRow { year: number; people: number; kind: number; births: number; deaths: number; left: number; killed: number }
/** The kind's share of the people and the living it killed per 100,000 in `year`, as the count has them (section 118: the
 *  stage, the narrator's society block and the town follow the count's year; before, they kept the seed's year's for good).
 *  The records' last year, a census with no year after it, takes the year before; outside the count, the seed's own. */
export function figuresIn(rows: CountRow[] | null, year: number, seed: { share: number; deaths: number }): { share: number; deaths: number } {
    const at = (y: number) => rows?.find(r => r.year === y), r = year >= COUNT_YEARS[1] ? at(COUNT_YEARS[1] - 1) : at(year);
    return r && r.people > 0 ? { share: r.kind / r.people, deaths: r.killed / r.people * 1e5 } : { share: seed.share, deaths: seed.deaths };
}
/** The story's world from `from` (the seed's year) to `to`, at most the records' last year: the kind `share` of the people
 *  in the seed's year, then as `growth` says (without it: born so, each killing `deathsPer100k` ÷ (share × 100,000) a year
 *  and not living on it); null outside the records (England and Wales, 1841–1921). */
export function yearByYear(from: number, to: number, share: number, deathsPer100k: number, growth?: KindGrowth): CountRow[] | null {
    if (from < COUNT_YEARS[0] || from > COUNT_YEARS[1]) return null;
    const g: KindGrowth = growth ?? { origin: 'born', killsEach: share > 0 ? deathsPer100k / (share * 1e5) : 0, eatsDead: false, feeds: false, eatsOwn: 0 };
    const real = realYears(), rows: CountRow[] = [], last = Math.min(Math.max(from, to), COUNT_YEARS[1]);
    let people = real[from]!.people, kind = people * share;
    for (let y = from; y <= last; y++) {
        // The year's births, deaths and leaving as shares of the people (the kind's among them); the records' last year, a census
        // with no year after it, has none.
        const r = real[y]!, s = people / r.people, living = people - kind, births = r.births * s, deaths = r.deaths * s, left = r.left * s;
        const end = y >= COUNT_YEARS[1], perHead = (x: number) => people > 0 ? x / people : 0;
        // The kind kills only the living who are not of it, the dead first for one that eats them; what it cannot find it
        // starves for, if its kills are its food.
        const wanted = kind * g.killsEach, dead = g.eatsDead ? Math.min(deaths, wanted) : 0;
        const killed = end ? 0 : Math.min(living, wanted - dead);
        const fed = !g.feeds || wanted <= 0 || end ? 1 : (dead + killed) / wanted;
        rows.push({ year: y, people, kind, births, deaths, left, killed });
        if (end) break;
        // New ones by origin (the sheet's Numbers); the kind lives, dies and leaves as people do; of those the year leaves, the
        // share it could feed lives on (its newborn and new-made with it), and one that eats its own keeps e^−rate of them.
        const rate = comeRate(g.origin), born = g.origin === 'born' ? kind * perHead(births) : 0;
        const made = g.origin === 'made' ? Math.min(living - killed, rate! * kind) : 0, back = g.origin === 'returned' ? rate! * deaths : 0, came = g.origin === 'arrived' ? rate! * kind : 0;
        // Once the kind has killed all the living, no one of them is left to bear children: the living end at none.
        const livingNext = killed >= living ? 0 : Math.max(0, living + births - born - living * (perHead(deaths) + perHead(left)) - killed - made);
        kind = Math.max(0, kind + born + made + back + came - kind * (perHead(deaths) + perHead(left))) * fed * Math.exp(-g.eatsOwn);
        people = livingNext + kind;
    }
    return rows;
}
