// Seeing a target at a distance (docs/df-body-engine.md §6.2). Light → luminance → acuity → cycles across the target →
// probability of detecting, recognizing and identifying it.
// Illuminance, lux (Wikipedia, Lux, examples; ranges at their geometric middle): luminance of the scene L = E ρ ÷ π with a
// diffuse reflectance ρ = 0.2 [ASSUMED].
export const LIGHT = { 'overcast starlight': 0.0001, 'clear starlight': 0.002, 'quarter moon': 0.01, 'full moon': 0.12,
    'civil twilight': 3.4, 'dim street or public lighting': 32, 'living room': 50, office: 400, 'overcast day': 1000,
    daylight: 15800, 'direct sunlight': 56600 };
// Acuity, highest resolvable grating (cycles/degree) by adaptation luminance: R = 17.25 arctan(1.4 log10 L + 0.35) + 25.72
// (Ward Larson, Rushmeier & Piatko 1997, IEEE TVCG 3:291, fit to Shlaer 1937; gives 49 c/deg at 10^3 and 2.6 at 10^−3.3 cd/m²,
// matching the 50 and 2 quoted by Ferwerda et al. 1996).
export const acuity = lux => 17.25 * Math.atan(1.4 * Math.log10(Math.max(1e-7, lux * 0.2 / Math.PI)) + 0.35) + 25.72;
// Johnson criteria: cycles across the target's smallest dimension for a 50 % chance: detection 1, recognition 4, identification
// 6.4 (Johnson 1958). Probability: target transfer probability function P = x^E ÷ (1 + x^E), x = N ÷ N50, E = 2.7 + 0.7 x
// (as used in the US Army NVESD models).
const N50 = { detect: 1, recognize: 4, identify: 6.4 };
const ttpf = x => { const e = 2.7 + 0.7 * x, p = x ** e; return p / (1 + p); };

/**
 * { detect, recognize, identify } probabilities for a target of smallest dimension `size` m at `distance` m in `light`
 * (preset or lux), with meteorological visibility `visibility` m (beyond it, contrast is under the 2 % threshold, Koschmieder:
 * nothing is seen [ASSUMED cut-off]). acuityFactor scales the viewer's acuity (species, damaged eyes).
 */
export function see({ size = 0.5, distance = 10, light = 'daylight', visibility = 20000, acuityFactor = 1 }) {
    const lux = typeof light === 'number' ? light : LIGHT[light] ?? LIGHT.daylight;
    if (distance >= visibility) return { detect: 0, recognize: 0, identify: 0, cycles: 0 };
    const deg = Math.atan(size / Math.max(0.1, distance)) * 180 / Math.PI;
    const cycles = Math.max(0, acuity(lux)) * acuityFactor * deg;
    const r = k => Math.round(ttpf(cycles / N50[k]) * 100) / 100;
    return { detect: r('detect'), recognize: r('recognize'), identify: r('identify'), cycles: Math.round(cycles * 10) / 10 };
}
