// Substance records checked against their composition (docs/df-body-engine.md §6.19). A record is a name, a formula and
// measured values; code derives what the atoms fix (molar mass, oxygen to burn it, heat of burning) and compares.
// Atomic weights: IUPAC standard atomic weights, conventional/abridged values (H 1.008, C 12.011, N 14.007, O 15.999, …).
// Heat of burning from oxygen demand: ΔHc ≈ k × mol O2, mol O2 = C + H ÷ 4 − O ÷ 2 (products CO2, liquid H2O, N2)
// (Thornton 1917 rule; k fitted here as the median over the 68 measured records with 2 or more carbons, 442 kJ per mol O2;
// leave-one-out median error 1.8 %, 90 % within 7.1 %, propyne left out). One-carbon molecules and H2 sit 11–29 % off (their
// bonds differ from C–C and C–H chains), so they are not judged. Verdict: within 10 % ok, 10–20 % suspect, beyond 20 %
// contradiction (the record is refused and the estimate used) [ASSUMED: thresholds above the leave-one-out spread].
// A family (fatty acid, alcohol, amino acid, …) with 3 or more measured members fills a gap with its own median k.
import { parseSmiles, formulaOf, formulaString, jobackGroups, jobackProps, combustionKJmol, hazards, loadJoback } from './structure.js';
export interface Substance { name: string; formula: string; smiles?: string; state?: string; dHc_kJmol?: number; dHc_kJg?: number; family?: string; src?: string }
const WEIGHT: Record<string, number> = { H: 1.008, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Na: 22.990, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, K: 39.098, Ca: 40.078, Fe: 55.845, Cu: 63.546, Zn: 65.38, Br: 79.904, Ag: 107.87, Sn: 118.71, I: 126.90, Hg: 200.59, Pb: 207.2 };

export function parseFormula(f: string): Record<string, number> {
    const out: Record<string, number> = {};
    const clean = f.replace(/\s+/g, '');
    if (!/^([A-Z][a-z]?\d*)+$/.test(clean)) throw new Error(`Formula "${f}" is not a plain element formula (e.g. C6H12O6).`);
    for (const [, e, n] of clean.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[e] = (out[e] ?? 0) + (n ? Number(n) : 1);
    return out;
}
export function molarMass(f: string): number {
    return Object.entries(parseFormula(f)).reduce((s, [e, n]) => {
        if (WEIGHT[e] == null) throw new Error(`Element ${e} has no weight here.`);
        return s + WEIGHT[e] * n;
    }, 0);
}
export const o2Mol = (f: string) => { const c = parseFormula(f); return (c.C ?? 0) + (c.H ?? 0) / 4 - (c.O ?? 0) / 2; };
const measuredKJmol = (s: Substance) => s.dHc_kJmol ?? (s.dHc_kJg != null ? s.dHc_kJg * molarMass(s.formula) : null);
const median = (x: number[]) => { const a = [...x].sort((p, q) => p - q), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

let table: Substance[] = [], K = 442, KFAM: Record<string, number> = {};
let loading: Promise<void> | null = null;
export function loadSubstances(): Promise<void> {
    loading ??= Promise.all([loadJoback(), fetch(new URL('../../rules/substances.json', import.meta.url)).then(r => r.json())]).then(([, d]: [void, { substances: Substance[] }]) => {
        table = d.substances;
        const k = (rows: Substance[]) => median(rows.map(s => measuredKJmol(s)! / o2Mol(s.formula)));
        const judged = table.filter(s => (parseFormula(s.formula).C ?? 0) >= 2 && measuredKJmol(s) != null);
        K = k(judged);
        const fams: Record<string, Substance[]> = {};
        for (const s of judged) if (s.family) (fams[s.family] ??= []).push(s);
        KFAM = Object.fromEntries(Object.entries(fams).filter(([, r]) => r.length >= 3).map(([f, r]) => [f, k(r)]));
    });
    return loading;
}
export const substanceTable = () => table;

/** Heat of burning, kJ/mol and kJ/g: the measured record when there is one that passes the check, else the estimate. */
export function heatOf(formula: string, family?: string, smiles?: string, state = 'gas'): { kJmol: number; kJg: number; measured: boolean; note: string } {
    const rec = table.find(s => s.formula.replace(/\s+/g, '') === formula.replace(/\s+/g, ''));
    const M = molarMass(formula);
    if (rec) { const c = checkSubstance(rec); if (c.verdict !== 'contradiction' && c.measured != null) return { kJmol: c.measured, kJg: c.measured / M, measured: true, note: `${rec.name}, measured (${rec.src})` }; }
    if (smiles) { const st = fromStructure(smiles, state); if (st.kJmol != null) return { kJmol: st.kJmol, kJg: st.kJmol / M, measured: false, note: `estimated from its groups of atoms (Joback) [ASSUMED]` }; }
    if (o2Mol(formula) <= 0) return { kJmol: 0, kJg: 0, measured: false, note: 'incombustible: its atoms already hold the oxygen they need (it can give oxygen off)' };
    const k = family && KFAM[family] ? KFAM[family] : K;
    const e = k * o2Mol(formula);
    return { kJmol: e, kJg: e / M, measured: false, note: `estimated from oxygen demand, ${Math.round(k)} kJ per mol O2${family && KFAM[family] ? ` (${family} median)` : ''} [ASSUMED]` };
}

/** What the structure fixes: formula, hazards, and the Joback heat of burning (null when its groups do not cover it). */
export function fromStructure(smiles: string, state = 'gas'): { formula: string; hazards: string[]; kJmol: number | null; why: string | null } {
    const m = parseSmiles(smiles), f = formulaOf(m), g = jobackGroups(m);
    const p = g.groups ? jobackProps(g.groups) : null;
    return { formula: formulaString(f), hazards: hazards(m), kJmol: p ? combustionKJmol(f, p, state) : null, why: g.groups ? (p ? null : 'group without coefficients') : g.why };
}
const hasNH = (smi: string) => { const m = parseSmiles(smi); return m.atoms.some(a => a.el === 'N' && a.h > 0); };
const sameFormula = (a: string, b: string) => JSON.stringify(Object.entries(parseFormula(a)).sort()) === JSON.stringify(Object.entries(parseFormula(b)).sort());

/** Compares a record with what its atoms allow. With a structure: the formula must match it, and the heat is judged against
 * the Joback estimate (ok within 5 %, suspect 5–10 %, contradiction beyond 10 % inside its domain) [ASSUMED thresholds; out-of-sample error
 * on this table: median 0.4 %, 90 % within 2.4 %]. Without one: the oxygen rule (10 / 20 %; fewer than 2 carbons not judged). */
export function checkSubstance(s: Substance): { measured: number | null; predicted: number; errPct: number | null; verdict: 'ok' | 'suspect' | 'contradiction' | 'not judged'; by: string; problems: string[] } {
    const measured = measuredKJmol(s), problems: string[] = [];
    if (s.smiles) {
        const st = fromStructure(s.smiles, s.state ?? 'gas');
        if (!sameFormula(st.formula, s.formula)) problems.push(`formula ${s.formula} disagrees with the structure (${st.formula})`);
        problems.push(...st.hazards);
        if (st.kJmol != null) {
            if (measured == null) return { measured, predicted: st.kJmol, errPct: null, verdict: problems.length && problems[0].startsWith('formula') ? 'contradiction' : 'not judged', by: 'Joback', problems };
            const errPct = (measured - st.kJmol) / st.kJmol * 100, a = Math.abs(errPct);
            // Outside the domain where the estimate holds, a large miss is only suspect: one-carbon molecules, and crystals
            // with N–H groups (amides, amino acids, urea: hydrogen-bonded or zwitterion lattices hold more energy than Joback's
            // vaporisation + fusion; on this table they sit 7–21 % low) [ASSUMED domain, from the misses on this table].
            const f = parseFormula(s.formula), inDomain = (f.C ?? 0) >= 2 && !(s.state === 'cry' && hasNH(s.smiles!));
            const verdict = problems.some(p => p.startsWith('formula')) || (a > 10 && inDomain) ? 'contradiction' : a > 5 ? 'suspect' : 'ok';
            return { measured, predicted: st.kJmol, errPct, verdict, by: 'Joback', problems };
        }
        if (problems.some(p => p.startsWith('formula'))) return { measured, predicted: NaN, errPct: null, verdict: 'contradiction', by: 'structure', problems };
    }
    const k = s.family && KFAM[s.family] ? KFAM[s.family] : K, predicted = k * o2Mol(s.formula);
    if (measured == null) return { measured, predicted, errPct: null, verdict: 'not judged', by: 'oxygen rule', problems };
    const errPct = (measured - predicted) / predicted * 100, a = Math.abs(errPct);
    if ((parseFormula(s.formula).C ?? 0) < 2) return { measured, predicted, errPct, verdict: 'not judged', by: 'oxygen rule', problems };
    return { measured, predicted, errPct, verdict: a <= 10 ? 'ok' : a <= 20 ? 'suspect' : 'contradiction', by: 'oxygen rule', problems };
}

// Food energy from composition: Atwater general factors, carbohydrate 4, protein 4, fat 9, alcohol 7 kcal/g (FAO 2003, Food
// energy – methods of analysis and conversion factors, FAO Food and Nutrition Paper 77, ch. 3). Hard limits from the atoms:
// the parts weigh no more than the food, and no food carries more than pure fat (9 kcal/g). A stated kcal more than 20 % off
// the composition is replaced by it [ASSUMED tolerance: specific Atwater factors of single foods differ from the general
// ones by up to about that much].
export function foodEnergy(a: { food_g?: number; carb_g?: number; protein_g?: number; fat_g?: number; alcohol_g?: number; food_kcal?: number }): { kcal: number; note: string | null } {
    const c = Math.max(0, a.carb_g ?? 0), p = Math.max(0, a.protein_g ?? 0), f = Math.max(0, a.fat_g ?? 0), al = Math.max(0, a.alcohol_g ?? 0);
    const parts = c + p + f, stated = a.food_kcal != null ? Math.max(0, a.food_kcal) : null;
    if (a.food_g != null && parts > a.food_g) return { kcal: stated ?? 0, note: `composition refused: ${parts} g of carbohydrate, protein and fat in ${a.food_g} g of food` };
    if (parts === 0) {
        if (stated != null && a.food_g != null && stated > 9 * a.food_g) return { kcal: 9 * a.food_g + 7 * al, note: `${stated} kcal is more than ${a.food_g} g of pure fat holds; ${9 * a.food_g} kcal used` };
        return { kcal: (stated ?? 0) + 7 * al, note: null };
    }
    const comp = 4 * c + 4 * p + 9 * f;
    if (stated != null && Math.abs(stated - comp) > 0.2 * comp) return { kcal: comp + 7 * al, note: `stated ${stated} kcal contradicts the composition (${Math.round(comp)} kcal); composition used` };
    return { kcal: (stated ?? comp) + 7 * al, note: null };
}
