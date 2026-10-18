// Infection from drinking untreated water (docs/df-body-engine.md §6.3): quantitative microbial risk assessment with WHO's
// three reference pathogens, one each for bacteria, viruses and protozoa.
// Concentrations per litre by water source (log10 range; WHO 2011 Guidelines for drinking-water quality Table 7.6, which lists
// high detected concentrations, so its river and sewage rows stand for water fouled by people or animals; WHO GDWQ
// 2004, KWR 2016.081, Sales Ortells 2015, as compiled in the kwb.qmra / qmra.db database, KWB Berlin). A concentration is
// drawn log-uniform within the range; a range starting at 0 starts at 1/1000 of its top [both ASSUMED].
// Dose-response, human feeding trials (QMRA Wiki, Michigan State Univ.): Campylobacter beta-Poisson α 0.144, N50 890 CFU
// (Black et al. 1988); rotavirus beta-Poisson α 0.253, N50 6.17 FFU (Ward et al. 1986); Cryptosporidium exponential
// k 0.0572 per oocyst (Messner et al. 2001). Illness given infection: Campylobacter 0.3, Cryptosporidium 0.7 (Australian
// Drinking Water Guidelines A3.8, Table A3.5), rotavirus 0.5 (WHO 2011 Table 7.4).
export const WATER_SOURCES = ['raw sewage', 'contaminated river or lake', 'river or lake with people or herds upstream', 'protected river or reservoir', 'groundwater (well, spring)', 'rooftop rainwater', 'stormwater'];
const CONC = {
    'raw sewage': [[100, 1e6], [50, 5000], [1, 1e4]],
    'contaminated river or lake': [[90, 2500], [30, 60], [2, 480]],
    'river or lake with people or herds upstream': [[100, 1e4], [0.01, 100], [0, 1000]],
    'protected river or reservoir': [[0, 1100], [0, 3], [2, 240]],
    'groundwater (well, spring)': [[0, 10], [0, 2], [0, 1]],
    'rooftop rainwater': [[0, 24], [0, 0.01], [0, 0.19]],
    'stormwater': [[13.87, 287.0], [9.745, 64.75], [0.0000452, 0.0881]],
};
const PATHOGENS = [
    { name: 'campylobacteriosis (Campylobacter)', p: (d) => 1 - (1 + d * (2 ** (1 / 0.144) - 1) / 890) ** -0.144, ill: 0.3 },
    { name: 'rotavirus gastroenteritis', p: (d) => 1 - (1 + d * (2 ** (1 / 0.253) - 1) / 6.17) ** -0.253, ill: 0.5 },
    { name: 'cryptosporidiosis (Cryptosporidium)', p: (d) => 1 - Math.exp(-0.0572 * d), ill: 0.7 },
];
/** Infections and illnesses from drinking `litres` of untreated water from `source`. */
export function drinkWater(source, litres, rng) {
    const c = CONC[source];
    if (!c || !(litres > 0))
        return null;
    const out = { infected: [], ill: [] };
    PATHOGENS.forEach((g, i) => {
        const [lo0, hi] = c[i], lo = lo0 > 0 ? lo0 : hi / 1000;
        const conc = 10 ** (Math.log10(lo) + (Math.log10(hi) - Math.log10(lo)) * rng());
        if (rng() < g.p(conc * litres)) {
            out.infected.push(g.name);
            if (rng() < g.ill)
                out.ill.push(g.name);
        }
    });
    return out;
}
/** Mean infection chance for one pathogen over the source's range (for checks). */
export function meanRisk(source, litres, n = 20000) {
    const c = CONC[source];
    return PATHOGENS.map((g, i) => {
        const [lo0, hi] = c[i], lo = lo0 > 0 ? lo0 : hi / 1000;
        let s = 0;
        for (let k = 0; k < n; k++)
            s += g.p(10 ** (Math.log10(lo) + (Math.log10(hi) - Math.log10(lo)) * (k + 0.5) / n) * litres);
        return s / n;
    });
}
