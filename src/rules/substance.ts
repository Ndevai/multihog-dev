// Substance records checked against their composition (docs/df-body-engine.md §6.19). A record is a name, a formula and
// measured values; code derives what the atoms fix (molar mass, oxygen to burn it, heat of burning) and compares.
// Atomic weights: IUPAC conventional values (H 1.008, C 12.011, N 14.007, O 15.999).
// Heat of burning from oxygen demand: ΔHc ≈ k × mol O2, mol O2 = C + H ÷ 4 − O ÷ 2 (products CO2, liquid H2O, N2)
// (Thornton 1917 rule; k fitted here as the median over the 68 measured records with 2 or more carbons, 442 kJ per mol O2;
// leave-one-out median error 1.8 %, 90 % within 7.1 %, propyne left out). One-carbon molecules and H2 sit 11–29 % off (their
// bonds differ from C–C and C–H chains), so they are not judged. Verdict: within 10 % ok, 10–20 % suspect, beyond 20 %
// contradiction (the record is refused and the estimate used) [ASSUMED: thresholds above the leave-one-out spread].
// A family (fatty acid, alcohol, amino acid, …) with 3 or more measured members fills a gap with its own median k.
export interface Substance { name: string; formula: string; state?: string; dHc_kJmol?: number; dHc_kJg?: number; family?: string; src?: string }
const WEIGHT: Record<string, number> = { H: 1.008, C: 12.011, N: 14.007, O: 15.999 };

export function parseFormula(f: string): Record<string, number> {
    const out: Record<string, number> = {};
    const clean = f.replace(/\s+/g, '');
    if (!/^([A-Z][a-z]?\d*)+$/.test(clean)) throw new Error(`Formula "${f}" is not a plain element formula (e.g. C6H12O6).`);
    for (const [, e, n] of clean.matchAll(/([A-Z][a-z]?)(\d*)/g)) out[e] = (out[e] ?? 0) + (n ? Number(n) : 1);
    return out;
}
export function molarMass(f: string): number {
    return Object.entries(parseFormula(f)).reduce((s, [e, n]) => {
        if (WEIGHT[e] == null) throw new Error(`Element ${e} has no weight here (C, H, N, O only).`);
        return s + WEIGHT[e] * n;
    }, 0);
}
export const o2Mol = (f: string) => { const c = parseFormula(f); return (c.C ?? 0) + (c.H ?? 0) / 4 - (c.O ?? 0) / 2; };
const measuredKJmol = (s: Substance) => s.dHc_kJmol ?? (s.dHc_kJg != null ? s.dHc_kJg * molarMass(s.formula) : null);
const median = (x: number[]) => { const a = [...x].sort((p, q) => p - q), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };

let table: Substance[] = [], K = 442, KFAM: Record<string, number> = {};
let loading: Promise<void> | null = null;
export function loadSubstances(): Promise<void> {
    loading ??= fetch(new URL('../../rules/substances.json', import.meta.url)).then(r => r.json()).then((d: { substances: Substance[] }) => {
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
export function heatOf(formula: string, family?: string): { kJmol: number; kJg: number; measured: boolean; note: string } {
    const rec = table.find(s => s.formula.replace(/\s+/g, '') === formula.replace(/\s+/g, ''));
    const M = molarMass(formula);
    if (rec) { const c = checkSubstance(rec); if (c.verdict !== 'contradiction' && c.measured != null) return { kJmol: c.measured, kJg: c.measured / M, measured: true, note: `${rec.name}, measured (${rec.src})` }; }
    const k = family && KFAM[family] ? KFAM[family] : K;
    const e = k * o2Mol(formula);
    return { kJmol: e, kJg: e / M, measured: false, note: `estimated from oxygen demand, ${Math.round(k)} kJ per mol O2${family && KFAM[family] ? ` (${family} median)` : ''} [ASSUMED]` };
}

/** Compares a record's measured heat with what its atoms allow. */
export function checkSubstance(s: Substance): { measured: number | null; predicted: number; errPct: number | null; verdict: 'ok' | 'suspect' | 'contradiction' | 'not judged' } {
    const measured = measuredKJmol(s), k = s.family && KFAM[s.family] ? KFAM[s.family] : K, predicted = k * o2Mol(s.formula);
    if (measured == null) return { measured, predicted, errPct: null, verdict: 'not judged' };
    const errPct = (measured - predicted) / predicted * 100, a = Math.abs(errPct);
    if ((parseFormula(s.formula).C ?? 0) < 2) return { measured, predicted, errPct, verdict: 'not judged' };
    return { measured, predicted, errPct, verdict: a <= 10 ? 'ok' : a <= 20 ? 'suspect' : 'contradiction' };
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
