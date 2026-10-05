// Walking with a load (docs/df-body-engine.md §6.7): Pandolf, Givoni & Goldman 1977 (J Appl Physiol 43:577), as given on
// Wikipedia "Pandolf equation": M (W) = 1.5 W + 2.0 (W + L)(L / W)² + η (W + L)(1.5 V² + 0.35 V G); W body kg, L load kg,
// V m/s, G grade %. Terrain η: Soule & Goldman 1972 (J Appl Physiol 32:706).
export const TERRAIN = { road: 1.0, 'dirt road': 1.1, 'light brush': 1.2, 'heavy brush': 1.5, swamp: 1.8, 'loose sand': 2.1,
    'snow 15 cm': 2.5, 'snow 25 cm': 3.3, 'snow 35 cm': 4.1 };

/** Metabolic rate (W) walking; downhill grades count as level [ASSUMED: Pandolf is for level and uphill]. */
export function pandolf(bodyKg, loadKg, speedMs, gradePct = 0, terrain = 'dirt road') {
    const eta = TERRAIN[terrain];
    if (eta == null) throw new Error(`Unknown terrain "${terrain}". Known: ${Object.keys(TERRAIN).join(', ')}.`);
    const W = bodyKg, L = loadKg || 0, V = speedMs, G = Math.max(0, gradePct || 0);
    return 1.5 * W + 2.0 * (W + L) * (L / W) ** 2 + eta * (W + L) * (1.5 * V ** 2 + 0.35 * V * G);
}

/** METs of that work: W ÷ (1.163 W/kg × body kg) (1 MET = 1 kcal/kg/h). */
export const metOf = (watts, bodyKg) => watts / (1.163 * bodyKg);
