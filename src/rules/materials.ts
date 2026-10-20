// What things are made of (docs/df-body-engine.md §6.23): one table of materials (data/materials.ts) under the parts of the
// engine that used numbers of their own: the mass of a wall a sound passes, the lining a room fire heats, the absorption
// that sets a room's echo, the load a plank or rope takes before it breaks, the force a fall puts through a leg. Each
// material is checked against laws that tie its numbers together (checkMaterial), as the chemicals table is (chem.ts).
import { MATERIALS_DATA } from './data/materials.js';
import { def, k } from './constants.js';

export interface Material { family: string; rho: number; E: number; strength: number; kind: 'bending' | 'tension' | 'compression'; compression?: number; k: number; cp: number; c?: number; alpha500?: number; resistivity?: number; rope?: string; src: Record<string, string> }
export const MATERIALS = MATERIALS_DATA.materials as unknown as Record<string, Material>;
export const WALLS = MATERIALS_DATA.walls as unknown as Record<string, { material: string; thickness_m: number }>;
export const LININGS = MATERIALS_DATA.linings as unknown as Record<string, { material: string; thickness_m: number }>;
export const MATERIAL_NAMES = Object.keys(MATERIALS);

/** A material by name, or by its first word ("oak" → oak (red)). */
export function material(name: string): Material | null {
    const n = name.trim().toLowerCase();
    return MATERIALS[n] ?? Object.entries(MATERIALS).find(([key]) => key.startsWith(n) || key.split(/[ (]/)[0] === n.split(' ')[0])?.[1] ?? null;
}
/** Surface mass of a wall or door, kg/m²: density × thickness. */
export function surfaceMass(wall: string): number {
    const w = WALLS[wall]; if (!w) return 0;
    const m = MATERIALS[w.material];
    return m ? m.rho * w.thickness_m : 0;
}
/** A room lining as rooms.ts uses it: k kW/(m·K), rho kg/m³, c kJ/(kg·K), d m. */
export function liningOf(name: string): { k: number; rho: number; c: number; d: number } | null {
    const l = LININGS[name], m = l && MATERIALS[l.material];
    return m ? { k: m.k / 1000, rho: m.rho, c: m.cp / 1000, d: l.thickness_m } : null;
}

// Laws that tie a material's numbers together. Each returns null when it holds or cannot be applied.
/** Speed of sound in a thin rod: c = √(E / ρ). Wood's static bending E runs below its dynamic E by about 10 % [Wood Handbook
 *  ch. 5], so a match within 20 % passes [ASSUMED tolerance]. */
export function soundLaw(m: Material): string | null {
    if (!m.c || !m.E) return null;
    const pred = Math.sqrt(m.E * 1e9 / m.rho), err = (pred - m.c) / m.c;
    return Math.abs(err) > 0.2 ? `speed of sound √(E/ρ) = ${Math.round(pred)} m/s against ${m.c} measured (${Math.round(err * 100)} %)` : null;
}
/** Wiedemann–Franz: a metal's heat and electric conduction are carried by the same electrons, k = L T / ρe with L = 2.44e-8
 *  W·Ω/K², T = 293 K. Alloys and cast iron also conduct heat by the lattice, so k above the prediction passes; below it by
 *  more than 30 % fails [ASSUMED tolerance]. */
export function wiedemannFranz(m: Material): string | null {
    if (m.family !== 'metal' || !m.resistivity) return null;
    const pred = 2.44e-8 * 293 / m.resistivity;
    return m.k < pred * 0.7 ? `heat conduction ${m.k} W/(m·K) against ${Math.round(pred)} from its resistivity (Wiedemann–Franz)` : null;
}
/** Strain at failure, strength ÷ E, inside the band its family takes (Ashby's material charts) [ASSUMED bands]. */
const STRAIN: Record<string, [number, number]> = { wood: [0.004, 0.014], metal: [0.0005, 0.01], ceramic: [0.0002, 0.002], masonry: [0.0002, 0.003], stone: [0.0005, 0.005], tissue: [0.003, 0.5], fibre: [0.001, 2] };
export function strainLaw(m: Material): string | null {
    const band = STRAIN[m.family]; if (!band || !m.E || !m.strength) return null;
    const eps = m.strength / (m.E * 1000);
    return eps < band[0] || eps > band[1] ? `strain at failure ${eps.toExponential(1)} outside the ${m.family} band ${band[0]}–${band[1]}` : null;
}
/** Every law a material breaks. */
export const checkMaterial = (m: Material) => [soundLaw(m), wiedemannFranz(m), strainLaw(m)].filter((x): x is string => !!x);

// Breaking.
/** Load at the middle of a beam or plank resting on two supports that breaks it, kg: σ = 3 F L / (2 b h²) (simple beam
 *  theory) at the material's bending strength (modulus of rupture). */
// Sawn timber breaks below clear wood: knots, slope of grain and checks lower it (Wood Handbook ch. 7 grades sawn lumber from
// clear-wood values); one factor for an ungraded board [ASSUMED].
def({ id: 'timberFactor', value: 0.5, unit: '× clear-wood bending strength', status: 'assumed', src: 'sawn, ungraded timber with knots against small clear specimens', range: [0.3, 0.8], file: 'materials.ts' });
export function plankBreakKg(m: Material, width_m: number, thickness_m: number, span_m: number): number {
    const mor = (m.kind === 'bending' || m.kind === 'tension' ? m.strength : m.strength / 10) * 1e6 * (m.family === 'wood' ? k('timberFactor') : 1);
    return 2 * mor * width_m * thickness_m ** 2 / (3 * span_m) / 9.81;
}
/** Breaking load of a fibre rope, kg: 900 lbf × C² with C the circumference in inches (the manila rule of thumb [RAW]). */
export const ropeBreakKg = (diameter_mm: number) => 900 * (Math.PI * diameter_mm / 25.4) ** 2 * 0.4536;
/** Load that pulls a solid rod or bar apart, kg: tensile strength × cross-section. */
export const rodBreakKg = (m: Material, diameter_mm: number) => (m.kind === 'tension' ? m.strength : m.strength / 10) * 1e6 * Math.PI * (diameter_mm / 2000) ** 2 / 9.81;

// A fall landed on the feet. The body's speed at impact, v = √(2 g h), is stopped over the legs' give plus the ground's;
// the average force over that stop, m g (h + d) / d, is split between both legs. Calcaneus and tibia fractured in impactor
// tests on isolated legs at axial loads from 3.8 to 9 kN (McMaster et al. 2000; Kitagawa et al. 1998, as cited by
// Kallieris et al., ESV 17, paper 212); the fracture chance is a lognormal over that range, its median at the geometric
// middle and the range taken as ±1.5 σ [fitted].
def({ id: 'legFractureKN', value: Math.sqrt(3.8 * 9), unit: 'kN axial, median', status: 'fitted', src: 'geometric middle of 3.8–9 kN calcaneal fracture loads (McMaster 2000; Kitagawa 1998)', range: [3.8, 9], file: 'materials.ts' });
def({ id: 'legGiveM', value: 0.25, unit: 'm of body travel, knees bending on landing', status: 'assumed', src: 'a bent-knee landing lowers the hips about a quarter metre', range: [0.1, 0.4], file: 'materials.ts' });
const GROUND_GIVE: Record<string, number> = { stone: 0, paving: 0.005, 'packed earth': 0.02, earth: 0.05, grass: 0.05, sand: 0.1, snow: 0.2, water: 1 };
export const GROUNDS = Object.keys(GROUND_GIVE);
def({ id: 'legFractureSigma', value: Math.log(9 / 3.8) / 3, unit: 'log-sd', status: 'fitted', src: '3.8–9 kN as ±1.5 σ', file: 'materials.ts' });
export function landing(massKg: number, height: number, ground = 'packed earth', stiff = false): { kNPerLeg: number; chance: number } {
    const d = (stiff ? 0.05 : k('legGiveM')) + (GROUND_GIVE[ground] ?? 0.02);
    const kn = massKg * 9.81 * (height + d) / d / 2 / 1000;
    const z = Math.log(kn / k('legFractureKN')) / k('legFractureSigma');
    return { kNPerLeg: Math.round(kn * 10) / 10, chance: 0.5 * (1 + erf(z / Math.SQRT2)) };
}
function erf(x: number): number {
    // Abramowitz & Stegun 7.1.26, error under 1.5e-7.
    const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
}
