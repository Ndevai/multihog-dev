// Contagious disease (docs/df-body-engine.md §6.15): when symptoms start, and how many in a community fall ill.
// Incubation periods are log-normal: median × s*^z, z ~ N(0, 1) (Sartwell 1950, 1952, as tabulated by Limpert, Stahel &
// Abbt 2001, BioScience 51:341, Table 2).
export const INCUBATION = {
    chickenpox: [14 * 24, 1.14], 'serum hepatitis': [100 * 24, 1.24], 'bacterial food poisoning': [2.3, 1.48],
    salmonellosis: [2.4 * 24, 1.47], poliomyelitis: [12.6 * 24, 1.50], 'amoebic dysentery': [21.4 * 24, 2.11],
    // Respiratory viruses: median days and dispersion of the fitted log-normal (Lessler et al. 2009, Lancet Infect Dis 9:291,
    // Table 3). Influenza A without the one experimental-infection study, which the table footnote sets apart (with it 1.4 d, 1.51).
    adenovirus: [5.6 * 24, 1.26], 'common cold coronavirus': [3.2 * 24, 1.15], SARS: [4.0 * 24, 1.81],
    'influenza A': [1.9 * 24, 1.23], 'influenza B': [0.6 * 24, 1.51], parainfluenza: [2.6 * 24, 1.35],
    'respiratory syncytial virus': [4.4 * 24, 1.24], rhinovirus: [1.9 * 24, 1.68], measles: [12.5 * 24, 1.23],
};
// Share of a whole population killed by historical epidemics, as ranges (Alfani & Murphy 2017, J Econ Hist 77:314, Table 1);
// a value is drawn uniformly within the range [ASSUMED].
export const EPIDEMICS = {
    'Antonine plague (smallpox), 160–180': { where: 'the Roman Empire', low: 0.10, high: 0.30 },
    'Plague of Cyprian, 249–270': { where: 'the Roman Empire', low: 0.15, high: 0.25 },
    'Plague of Justinian, 540–541': { where: 'the Mediterranean (50 % in Egypt and other dense areas)', low: 0.25, high: 0.50 },
    'Black Death, 1347–1352': { where: 'Europe and the Mediterranean', low: 0.35, high: 0.60 },
    'plague of 1623–1632, northern Italy': { where: 'northern Italy', low: 0.30, high: 0.35 },
    'plague of 1623–1632, Switzerland': { where: 'Switzerland', low: 0.20, high: 0.25 },
    'plague of 1623–1632, southern Germany, Rhineland, Alsace': { where: 'southern Germany, the Rhineland and Alsace', low: 0.12, high: 0.15 },
    'plague of 1623–1632, Dutch Republic': { where: 'the Dutch Republic', low: 0.08, high: 0.11 },
    'plague of 1647–1657, Kingdom of Naples': { where: 'the Kingdom of Naples', low: 0.30, high: 0.43 },
    'plague of 1647–1657, Catalonia': { where: 'Catalonia', low: 0.15, high: 0.20 },
};
export const EPIDEMIC_NAMES = Object.keys(EPIDEMICS);
// Basic reproduction number R0, middle of the range in Smieszek 2009 (Theor Biol Med Model 6:11, Table 1, citing Anderson
// & May 1991 for chickenpox 7–12, and later reviews for measles 15–17, mumps 10–12, whooping cough 15–17). Influenza (R0 2–3)
// is left out: the homogeneous final-size equation gives about 89 % infected, far above observed attack rates.
export const R0 = { chickenpox: 9.5, measles: 16, mumps: 11, 'whooping cough': 16 };
export const DISEASES = [...new Set([...Object.keys(INCUBATION), ...Object.keys(R0)])];
/** Hours from infection to the first symptoms, or null when no incubation data exist. */
export function incubationHours(disease, gauss) {
    const d = INCUBATION[disease];
    return d ? d[0] * d[1] ** gauss() : null;
}
/**
 * Share of the susceptible who fall ill over the whole outbreak in a closed, mixing population: z = 1 − e^(−R0 s z), s the
 * susceptible share (Kermack & McKendrick 1927: no epidemic unless R0 s > 1). Returns 0 below the threshold.
 */
export function attackShare(disease, susceptible = 1) {
    const r = (R0[disease] ?? 0) * susceptible;
    if (r <= 1)
        return 0;
    let z = 0.5;
    for (let k = 0; k < 100; k++)
        z = 1 - Math.exp(-r * z);
    return z;
}
// Causes of death among foragers and forager-horticulturalists (Gurven & Kaplan 2007, Popul Dev Rev 33:321, Table 5, pooled
// totals of 3,328 deaths in 13 groups): by age band illness / degenerative / accident / violence, under 15: 65.3, 9.5, 8.1,
// 17.1 %; 15–59: 60.5, 9.2, 12.9, 17.4 %; 60 and over: 54.6, 28.2, 10.3, 6.9 %. Within illness, all ages: respiratory 23.7,
// gastrointestinal 13.8, fever 7.3, other 16.6; within violence: homicide 6.3, warfare 5.2 (shares of all deaths, groups with
// good data only, so they are rescaled within their class [ASSUMED]).
const CAUSE_BY_AGE = [[15, [65.3, 9.5, 8.1, 17.1]], [60, [60.5, 9.2, 12.9, 17.4]], [Infinity, [54.6, 28.2, 10.3, 6.9]]];
const ILLNESS = [['a respiratory illness', 23.7], ['a gastrointestinal illness', 13.8], ['a fever', 7.3], ['another illness', 16.6]];
const VIOLENCE = [['homicide', 6.3], ['warfare', 5.2]];
const drawFrom = (rows, u) => { const t = rows.reduce((x, r) => x + r[1], 0); let v = u * t; for (const r of rows)
    if ((v -= r[1]) < 0)
        return r[0]; return rows[rows.length - 1][0]; };
export function deathCause(age, rng) {
    const shares = CAUSE_BY_AGE.find(([upTo]) => age < upTo)[1];
    const cls = drawFrom([['illness', shares[0]], ['degenerative disease (old age, heart, cancer)', shares[1]], ['an accident', shares[2]], ['violence', shares[3]]], rng());
    return cls === 'illness' ? drawFrom(ILLNESS, rng()) : cls === 'violence' ? drawFrom(VIOLENCE, rng()) : cls;
}
