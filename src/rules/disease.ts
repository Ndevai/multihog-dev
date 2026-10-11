// Contagious disease (docs/df-body-engine.md §6.15): when symptoms start, and how many in a community fall ill.
// Incubation periods are log-normal: median × s*^z, z ~ N(0, 1) (Sartwell 1950, 1952, as tabulated by Limpert, Stahel &
// Abbt 2001, BioScience 51:341, Table 2).
export const INCUBATION: Record<string, [number, number]> = {
    chickenpox: [14 * 24, 1.14], 'serum hepatitis': [100 * 24, 1.24], 'bacterial food poisoning': [2.3, 1.48],
    salmonellosis: [2.4 * 24, 1.47], poliomyelitis: [12.6 * 24, 1.50], 'amoebic dysentery': [21.4 * 24, 2.11],
};
// Basic reproduction number R0, middle of the range in Smieszek 2009 (Theor Biol Med Model 6:11, Table 1, citing Anderson
// & May 1991 for chickenpox 7–12, and later reviews for measles 15–17, mumps 10–12, whooping cough 15–17). Influenza (R0 2–3)
// is left out: the homogeneous final-size equation gives about 89 % infected, far above observed attack rates.
export const R0: Record<string, number> = { chickenpox: 9.5, measles: 16, mumps: 11, 'whooping cough': 16 };
export const DISEASES = [...new Set([...Object.keys(INCUBATION), ...Object.keys(R0)])];

/** Hours from infection to the first symptoms, or null when no incubation data exist. */
export function incubationHours(disease: string, gauss: () => number): number | null {
    const d = INCUBATION[disease];
    return d ? d[0] * d[1] ** gauss() : null;
}

/**
 * Share of the susceptible who fall ill over the whole outbreak in a closed, mixing population: z = 1 − e^(−R0 s z), s the
 * susceptible share (Kermack & McKendrick 1927: no epidemic unless R0 s > 1). Returns 0 below the threshold.
 */
export function attackShare(disease: string, susceptible = 1): number {
    const r = (R0[disease] ?? 0) * susceptible;
    if (r <= 1) return 0;
    let z = 0.5;
    for (let k = 0; k < 100; k++) z = 1 - Math.exp(-r * z);
    return z;
}
