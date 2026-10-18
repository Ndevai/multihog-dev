const WEIGHT = { H: 1.008, C: 12.011, N: 14.007, O: 15.999 };
export function parseFormula(f) {
    const out = {};
    const clean = f.replace(/\s+/g, '');
    if (!/^([A-Z][a-z]?\d*)+$/.test(clean))
        throw new Error(`Formula "${f}" is not a plain element formula (e.g. C6H12O6).`);
    for (const [, e, n] of clean.matchAll(/([A-Z][a-z]?)(\d*)/g))
        out[e] = (out[e] ?? 0) + (n ? Number(n) : 1);
    return out;
}
export function molarMass(f) {
    return Object.entries(parseFormula(f)).reduce((s, [e, n]) => {
        if (WEIGHT[e] == null)
            throw new Error(`Element ${e} has no weight here (C, H, N, O only).`);
        return s + WEIGHT[e] * n;
    }, 0);
}
export const o2Mol = (f) => { const c = parseFormula(f); return (c.C ?? 0) + (c.H ?? 0) / 4 - (c.O ?? 0) / 2; };
const measuredKJmol = (s) => s.dHc_kJmol ?? (s.dHc_kJg != null ? s.dHc_kJg * molarMass(s.formula) : null);
const median = (x) => { const a = [...x].sort((p, q) => p - q), m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
let table = [], K = 442, KFAM = {};
let loading = null;
export function loadSubstances() {
    loading ??= fetch(new URL('../../rules/substances.json', import.meta.url)).then(r => r.json()).then((d) => {
        table = d.substances;
        const k = (rows) => median(rows.map(s => measuredKJmol(s) / o2Mol(s.formula)));
        const judged = table.filter(s => (parseFormula(s.formula).C ?? 0) >= 2 && measuredKJmol(s) != null);
        K = k(judged);
        const fams = {};
        for (const s of judged)
            if (s.family)
                (fams[s.family] ??= []).push(s);
        KFAM = Object.fromEntries(Object.entries(fams).filter(([, r]) => r.length >= 3).map(([f, r]) => [f, k(r)]));
    });
    return loading;
}
export const substanceTable = () => table;
/** Heat of burning, kJ/mol and kJ/g: the measured record when there is one that passes the check, else the estimate. */
export function heatOf(formula, family) {
    const rec = table.find(s => s.formula.replace(/\s+/g, '') === formula.replace(/\s+/g, ''));
    const M = molarMass(formula);
    if (rec) {
        const c = checkSubstance(rec);
        if (c.verdict !== 'contradiction' && c.measured != null)
            return { kJmol: c.measured, kJg: c.measured / M, measured: true, note: `${rec.name}, measured (${rec.src})` };
    }
    const k = family && KFAM[family] ? KFAM[family] : K;
    const e = k * o2Mol(formula);
    return { kJmol: e, kJg: e / M, measured: false, note: `estimated from oxygen demand, ${Math.round(k)} kJ per mol O2${family && KFAM[family] ? ` (${family} median)` : ''} [ASSUMED]` };
}
/** Compares a record's measured heat with what its atoms allow. */
export function checkSubstance(s) {
    const measured = measuredKJmol(s), k = s.family && KFAM[s.family] ? KFAM[s.family] : K, predicted = k * o2Mol(s.formula);
    if (measured == null)
        return { measured, predicted, errPct: null, verdict: 'not judged' };
    const errPct = (measured - predicted) / predicted * 100, a = Math.abs(errPct);
    if ((parseFormula(s.formula).C ?? 0) < 2)
        return { measured, predicted, errPct, verdict: 'not judged' };
    return { measured, predicted, errPct, verdict: a <= 10 ? 'ok' : a <= 20 ? 'suspect' : 'contradiction' };
}
// Food energy from composition: Atwater general factors, carbohydrate 4, protein 4, fat 9, alcohol 7 kcal/g (FAO 2003, Food
// energy – methods of analysis and conversion factors, FAO Food and Nutrition Paper 77, ch. 3). Hard limits from the atoms:
// the parts weigh no more than the food, and no food carries more than pure fat (9 kcal/g). A stated kcal more than 20 % off
// the composition is replaced by it [ASSUMED tolerance: specific Atwater factors of single foods differ from the general
// ones by up to about that much].
export function foodEnergy(a) {
    const c = Math.max(0, a.carb_g ?? 0), p = Math.max(0, a.protein_g ?? 0), f = Math.max(0, a.fat_g ?? 0), al = Math.max(0, a.alcohol_g ?? 0);
    const parts = c + p + f, stated = a.food_kcal != null ? Math.max(0, a.food_kcal) : null;
    if (a.food_g != null && parts > a.food_g)
        return { kcal: stated ?? 0, note: `composition refused: ${parts} g of carbohydrate, protein and fat in ${a.food_g} g of food` };
    if (parts === 0) {
        if (stated != null && a.food_g != null && stated > 9 * a.food_g)
            return { kcal: 9 * a.food_g + 7 * al, note: `${stated} kcal is more than ${a.food_g} g of pure fat holds; ${9 * a.food_g} kcal used` };
        return { kcal: (stated ?? 0) + 7 * al, note: null };
    }
    const comp = 4 * c + 4 * p + 9 * f;
    if (stated != null && Math.abs(stated - comp) > 0.2 * comp)
        return { kcal: comp + 7 * al, note: `stated ${stated} kcal contradicts the composition (${Math.round(comp)} kcal); composition used` };
    return { kcal: (stated ?? comp) + 7 * al, note: null };
}
