// Seeing a target at a distance (docs/df-body-engine.md §6.2). Light → luminance → acuity → cycles across the target →
// probability of detecting, recognizing and identifying it.
// Illuminance, lux (Wikipedia, Lux, examples; ranges at their geometric middle): luminance of the scene L = E ρ ÷ π with a
// diffuse reflectance ρ = 0.2 [ASSUMED].
export const LIGHT: Record<string, number> = { 'overcast starlight': 0.0001, 'clear starlight': 0.002, 'quarter moon': 0.01, 'full moon': 0.12,
    'civil twilight': 3.4, 'dim street or public lighting': 32, 'living room': 50, office: 400, 'overcast day': 1000,
    daylight: 15800, 'direct sunlight': 56600 };
// Acuity, highest resolvable grating (cycles/degree) by adaptation luminance: R = 17.25 arctan(1.4 log10 L + 0.35) + 25.72
// (Ward Larson, Rushmeier & Piatko 1997, IEEE TVCG 3:291, fit to Shlaer 1937; gives 49 c/deg at 10^3 and 2.6 at 10^−3.3 cd/m²,
// matching the 50 and 2 quoted by Ferwerda et al. 1996).
export const acuity = (lux: number) => 17.25 * Math.atan(1.4 * Math.log10(Math.max(1e-7, lux * 0.2 / Math.PI)) + 0.35) + 25.72;
// Johnson criteria: cycles across the target's smallest dimension for a 50 % chance: detection 1, recognition 4, identification
// 6.4 (Johnson 1958). Probability: target transfer probability function P = x^E ÷ (1 + x^E), x = N ÷ N50, E = 2.7 + 0.7 x
// (as used in the US Army NVESD models).
const N50: Record<'detect' | 'recognize' | 'identify', number> = { detect: 1, recognize: 4, identify: 6.4 };
// Written as 1 ÷ (1 + x^−E): the same value, and finite for a large or near target, where x^E overflows to Infinity and
// Infinity ÷ Infinity gave NaN (a 1.5 m window at 1 m was "missed").
const ttpf = (x: number) => { if (!(x > 0)) return 0; const e = 2.7 + 0.7 * x; return 1 / (1 + x ** -e); };

/**
 * { detect, recognize, identify } probabilities for a target of smallest dimension `size` m at `distance` m in `light`
 * (preset or lux), with meteorological visibility `visibility` m (beyond it, contrast is under the 2 % threshold, Koschmieder:
 * nothing is seen [ASSUMED cut-off]). acuityFactor scales the viewer's acuity (species, damaged eyes).
 */
export function see({ size = 0.5, distance = 10, light = 'daylight' as string | number, visibility = 20000, acuityFactor = 1 }) {
    const lux = typeof light === 'number' ? light : LIGHT[light] ?? LIGHT.daylight;
    if (distance >= visibility) return { detect: 0, recognize: 0, identify: 0, cycles: 0 };
    const deg = Math.atan(size / Math.max(0.1, distance)) * 180 / Math.PI;
    const cycles = Math.max(0, acuity(lux)) * acuityFactor * deg;
    const r = (k: keyof typeof N50) => Math.round(ttpf(cycles / N50[k]) * 100) / 100;
    return { detect: r('detect'), recognize: r('recognize'), identify: r('identify'), cycles: Math.round(cycles * 10) / 10 };
}

// Species acuity as a share of human (60 cycles/degree), Caves, Brandley & Johnsen 2018 (Trends Ecol Evol 33:358) as reported
// by Duke University (24 May 2018): chimpanzees and other primates about 60 (1); wedge-tailed eagle 140 (2.33; for the DF eagle
// [ASSUMED]); dogs and cats 4–7 times less (1 ÷ 5.5); rats 40–60 times less (1 ÷ 50); mice over 100 times less (1 ÷ 100);
// most birds under 30 (0.5 as a ceiling [ASSUMED]); the sharpest fish about 30 (0.5 ceiling [ASSUMED]). Cats for the big cats,
// dogs for wolves [ASSUMED family]. Unknown species: human. Same light dependence as humans [ASSUMED].
const ACUITY: Record<string, number> = { CHIMPANZEE: 1, BONOBO: 1, GORILLA: 1, ORANGUTAN: 1, MACAQUE_RHESUS: 1, BIRD_EAGLE: 140 / 60, DOG: 1 / 5.5, WOLF: 1 / 5.5,
    CAT: 1 / 5.5, LION: 1 / 5.5, TIGER: 1 / 5.5, LEOPARD: 1 / 5.5, JAGUAR: 1 / 5.5, COUGAR: 1 / 5.5, RAT: 1 / 50, MOUSE: 1 / 100 };
export function acuityOf(id: string | null | undefined = 'HUMAN'): number {
    const base = String(id).toUpperCase().replace(/^GIANT_/, '').replace(/_MAN$/, '');
    return ACUITY[base] ?? (base.startsWith('BIRD_') ? 0.5 : base.startsWith('FISH_') ? 0.5 : 1);
}
