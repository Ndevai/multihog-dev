// Compounds: measured properties (rules/chem.json, 3796 single compounds compiled by the chemicals library) checked against
// physics and against what their structure allows (docs/df-body-engine.md §6.19). Measured values win; estimates fill gaps.
import { parseSmiles, formulaOf, formulaString, jobackGroups, jobackProps, combustionKJmol, hazards, loadJoback, stateAt } from './structure.js';
import { molarMass, o2Mol, parseFormula } from './substance.js';

export interface Row { n: string; cas: string; smi: string; f: string; Tb?: number; Tm?: number; Tf?: number; Ta?: number; LFL?: number; UFL?: number; Hfg?: number; Hfl?: number; Hfs?: number; [k: string]: string | number | undefined }
let DB: { sources: Record<string, string>; rows: Row[] } | null = null, byName: Map<string, Row> | null = null;
let loading: Promise<void> | null = null;
export function loadChem(): Promise<void> {
    loading ??= Promise.all([loadJoback(), fetch(new URL('../../rules/chem.json', import.meta.url)).then(r => r.json())]).then(([, d]) => {
        DB = d; byName = new Map();
        for (const r of DB!.rows) { byName.set(r.n.toLowerCase(), r); byName.set(r.cas, r); }
    });
    return loading;
}
export const chemRows = () => DB?.rows ?? [];
export const findCompound = (q: string) => byName?.get(q.trim().toLowerCase()) ?? null;
export const sourceOf = (r: Row, k: string) => DB?.sources[String(r[k + '_s'])] ?? '?';

// Boiling point estimate: Joback, corrected by Stein & Brown 1994 (J Chem Inf Comput Sci 34:581): Tb − 94.84 + 0.5577 Tb −
// 0.0007705 Tb² up to 700 K, else Tb + 282.7 − 0.5209 Tb. On the 1854 compounds here with a measured boiling point: mean
// error 21.8 K (Joback alone 44.6), median 12.2 K, 90 % within 45 K; molecules of more than 12 groups 32.3 K (Joback 130.9).
export const steinBrown = (t: number) => t <= 700 ? t - 94.84 + 0.5577 * t - 0.0007705 * t * t : t + 282.7 - 0.5209 * t;

/** Estimated properties from a structure: boiling point (Stein–Brown), melting point (Joback, mean error 22.6 K in Joback's
 * test, 67.7 K on the compounds here), heat of formation of the gas. Null when the groups do not cover it. */
export function estimate(smiles: string) {
    const m = parseSmiles(smiles), g = jobackGroups(m), p = g.groups ? jobackProps(g.groups) : null;
    const nGroups = g.groups ? Object.values(g.groups).reduce((a, b) => a + b, 0) : 0;
    return { m, formula: formulaOf(m), hazards: hazards(m), props: p ? { ...p, Tb: steinBrown(p.Tb) } : null, nGroups, why: g.groups ? null : g.why };
}

// Physical consistency of a record [tolerances ASSUMED]:
// - limits are fractions between 0 and 1, lower below upper;
// - a melting point above the boiling point means the compound sublimes at 1 atm (CO2) or one value is wrong: suspect;
// - a pure liquid's flash point cannot lie above its boiling point (at the boiling point the air over it is all vapour,
//   above any lower limit): more than 10 K above → contradiction;
// - autoignition (no flame) needs more heat than a flash with a flame: autoignition ≤ flash point → contradiction;
// - lower limit vs Jones's rule from the atoms, LFL ≈ c × stoichiometric fraction 1 ÷ (1 + 4.773 × mol O2) (Jones 1938,
//   as given in Crowl & Louvar, Chemical Process Safety); c = 0.49, the median over the 247 C/H/O/N compounds here
//   (10–90 %: 0.40–0.57; Jones gave 0.55); outside 0.25–1.0 → suspect (2 or more carbons);
// - boiling point vs the Stein–Brown estimate: beyond 4 × the median error of its size (44 K up to 12 groups, 77 K above)
//   → suspect.
export function checkCompound(r: Row): string[] {
    const out: string[] = [];
    for (const k of ['LFL', 'UFL'] as const) if (r[k] != null && !(r[k]! > 0 && r[k]! < 1)) out.push(`contradiction: ${k} ${r[k]} is not a fraction between 0 and 1 (${sourceOf(r, k)})`);
    if (r.LFL != null && r.UFL != null && r.LFL >= r.UFL) out.push(`contradiction: lower flammability limit ${r.LFL} ≥ upper ${r.UFL}`);
    if (r.Tm != null && r.Tb != null && r.Tm > r.Tb) out.push(`suspect: melting point ${r.Tm} K above boiling point ${r.Tb} K (sublimes at 1 atm, or one value is wrong; ${sourceOf(r, 'Tm')} / ${sourceOf(r, 'Tb')})`);
    if (r.Tf != null && r.Tb != null && r.Tf > r.Tb + 10) out.push(`contradiction: flash point ${r.Tf} K above boiling point ${r.Tb} K (${sourceOf(r, 'Tf')})`);
    if (r.Tf != null && r.Ta != null && r.Ta <= r.Tf) out.push(`contradiction: autoignition ${r.Ta} K at or below flash point ${r.Tf} K (${sourceOf(r, 'Ta')})`);
    let f: Record<string, number> | null = null; try { f = parseFormula(r.f); } catch { /* formula with charges or brackets */ }
    if (f && r.LFL != null && r.LFL > 0 && Object.keys(f).every(e => 'CHON'.includes(e)) && (f.C ?? 0) >= 2) {
        const n = o2Mol(r.f), c = r.LFL * (1 + 4.773 * n);
        if (n > 0 && (c < 0.25 || c > 1.0)) out.push(`suspect: lower limit ${r.LFL} is ${(c / 0.49).toFixed(2)} × what its atoms suggest (${(0.49 / (1 + 4.773 * n)).toFixed(4)}; ${sourceOf(r, 'LFL')})`);
    }
    if (r.Tb != null) {
        try {
            const e = estimate(r.smi);
            if (e.props) { const lim = e.nGroups <= 12 ? 44 : 77, d = r.Tb - e.props.Tb; if (Math.abs(d) > lim) out.push(`suspect: boiling point ${r.Tb} K is ${Math.round(d)} K from what its groups give (${Math.round(e.props.Tb)} K; ${sourceOf(r, 'Tb')})`); }
        } catch { /* structure outside the reader */ }
    }
    return out;
}

// Heat of burning from a measured heat of formation (Hess's law, products as in structure.ts), for the phase at 25 °C.
export function heatFromFormation(r: Row): { kJmol: number; phase: string } | null {
    let f: Record<string, number>; try { f = parseFormula(r.f); } catch { return null; }
    if (Object.keys(f).some(e => !'CHNOS'.includes(e)) || !f.C && !f.H) return null;
    const phase = r.Tb != null && r.Tb < 298.15 ? 'g' : r.Tm != null && r.Tm > 298.15 ? 's' : 'l';
    const hf = phase === 'g' ? r.Hfg ?? null : phase === 's' ? r.Hfs ?? null : r.Hfl ?? null;
    if (hf == null) return null;
    const prod = (f.C ?? 0) * -393.51 + (f.H ?? 0) / 2 * -285.83 + (f.S ?? 0) * -296.81;
    return { kJmol: hf - prod, phase };
}

/** What a compound is at temperature T (°C): state, whether it burns, heat, fire limits, problems found. */
export function describe(q: string, tempC = 20): string {
    const T = tempC + 273.15;
    let r = findCompound(q), smi = r?.smi ?? null;
    if (!r) { try { parseSmiles(q); smi = q; } catch { return `"${q}" is not in the compound table (3796 single compounds; mixtures such as kerosene or wood are not) and is not a SMILES structure. Name one compound or give its SMILES.`; } }
    const e = (() => { try { return estimate(smi!); } catch { return null; } })();
    const formula = r?.f ?? (e ? formulaString(e.formula) : '?');
    const parts: string[] = [`${r?.n ?? q} (${formula}${r ? `, CAS ${r.cas}` : ''}, ${(() => { try { return molarMass(formula).toFixed(1) + ' g/mol'; } catch { return 'molar mass n/a'; } })()})`];
    const tb = r?.Tb ?? e?.props?.Tb, tm = r?.Tm ?? e?.props?.Tm;
    const tbTag = r?.Tb != null ? '' : ' [estimated]', tmTag = r?.Tm != null ? '' : ' [estimated]';
    if (tb != null && tm != null) {
        if (tm > tb) parts.push(`at ${tempC} °C: ${T >= tb ? 'gas' : 'solid'} (turns straight to gas at ${Math.round(tb - 273.15)} °C${tbTag}; no liquid at normal pressure)`);
        else parts.push(`at ${tempC} °C: ${stateAt({ Tb: tb, Tm: tm }, T)} (melts ${Math.round(tm - 273.15)} °C${tmTag}, boils ${Math.round(tb - 273.15)} °C${tbTag})`);
    }
    const hc = r ? heatFromFormation(r) : null;
    const burnable = (() => { try { return o2Mol(formula) > 0 && /C|H/.test(formula) && formula !== 'H2O'; } catch { return false; } })();
    if (!burnable) parts.push('does not burn');
    else if (hc) parts.push(`burns: ${(hc.kJmol / molarMass(formula)).toFixed(1)} kJ/g (from its measured heat of formation)`);
    else if (e?.props) { const k = combustionKJmol(e.formula, e.props, 'gas'); if (k != null) parts.push(`burns: about ${(k / molarMass(formula)).toFixed(1)} kJ/g as gas [estimated from its groups]`); }
    if (r?.Tf != null) parts.push(T >= r.Tf ? `vapour catches fire from a flame at this temperature (flash point ${Math.round(r.Tf - 273.15)} °C)` : `vapour does not catch fire from a flame until ${Math.round(r.Tf - 273.15)} °C (flash point)`);
    if (r?.Ta != null) parts.push(`ignites without a flame at ${Math.round(r.Ta - 273.15)} °C`);
    if (r?.LFL != null && r?.UFL != null) parts.push(`burns in air between ${+(r.LFL * 100).toFixed(1)} and ${+(r.UFL * 100).toFixed(1)} % vapour`);
    const probs = [...(e?.hazards ?? []), ...(r ? checkCompound(r) : [])];
    return parts.join('; ') + '.' + (probs.length ? ` Notes: ${probs.join('; ')}.` : '');
}
