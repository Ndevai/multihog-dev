// Structure of a molecule from a SMILES string (docs/df-body-engine.md §6.19): atoms, bonds, rings, formula, and the
// properties its groups of atoms fix by the Joback method (Joback & Reid 1987, Chem Eng Commun 57:233; coefficients as
// tabulated in the thermo library, rules/joback.json). Stated errors (Joback's test sets): boiling point mean 12.9 K,
// melting point 22.6 K, gas heat of formation 2.2 kcal/mol (9.2 kJ/mol), heat of vaporisation 3.9 %, of fusion 38.7 %.
// SMILES subset read: organic atoms (B C N O P S F Cl Br I; aromatic b c n o p s), bracket atoms with H count and charge,
// branches, ring closures (digits, %nn), bonds - = # : / \ and '.'; chirality is read and ignored.

export interface Atom { el: string; arom: boolean; h: number; charge: number; bracket: boolean }
export interface Bond { a: number; b: number; order: number } // aromatic = 1.5
export interface Molecule { atoms: Atom[]; bonds: Bond[]; ring: boolean[]; ringBond: boolean[] }

const ORGANIC = ['Cl', 'Br', 'B', 'C', 'N', 'O', 'P', 'S', 'F', 'I'];
const AROM = ['se', 'as', 'b', 'c', 'n', 'o', 'p', 's'];
const VALENCE: Record<string, number[]> = { B: [3], C: [4], N: [3, 5], O: [2], P: [3, 5], S: [2, 4, 6], F: [1], Cl: [1], Br: [1], I: [1] };

export function parseSmiles(smi: string): Molecule {
    const atoms: Atom[] = [], bonds: Bond[] = [], stack: number[] = [], open: Record<string, { at: number; order: number | null }> = {};
    let prev: number | null = null, pend: number | null = null, i = 0;
    const bondOrder = (c: string) => ({ '-': 1, '=': 2, '#': 3, ':': 1.5, '/': 1, '\\': 1 } as Record<string, number>)[c];
    const join = (a: number, b: number, o: number | null) => bonds.push({ a, b, order: o ?? (atoms[a].arom && atoms[b].arom ? 1.5 : 1) });
    const add = (at: Atom) => { atoms.push(at); const k = atoms.length - 1; if (prev !== null) join(prev, k, pend); pend = null; prev = k; };
    while (i < smi.length) {
        const c = smi[i];
        if (c === '(') { stack.push(prev!); i++; continue; }
        if (c === ')') { prev = stack.pop() ?? null; i++; continue; }
        if (c === '.') { prev = null; i++; continue; }
        if (bondOrder(c) != null) { pend = bondOrder(c); i++; continue; }
        if (/[0-9%]/.test(c)) {
            const key = c === '%' ? smi.slice(i + 1, i + 3) : c; i += c === '%' ? 3 : 1;
            if (prev === null) throw new Error(`SMILES "${smi}": ring number before any atom.`);
            if (open[key]) { join(open[key].at, prev, pend ?? open[key].order); delete open[key]; } else open[key] = { at: prev, order: pend };
            pend = null; continue;
        }
        if (c === '[') {
            const j = smi.indexOf(']', i); if (j < 0) throw new Error(`SMILES "${smi}": unclosed [.`);
            const m = smi.slice(i + 1, j).match(/^(\d*)([A-Z][a-z]?|se|as|[bcnops])(@{0,2})(H\d?)?([+-]+\d*|[+-]\d+)?(:\d+)?$/);
            if (!m) throw new Error(`SMILES "${smi}": cannot read [${smi.slice(i + 1, j)}].`);
            const arom = m[2] === m[2].toLowerCase(), el = arom ? m[2][0].toUpperCase() + m[2].slice(1) : m[2];
            const h = m[4] ? (m[4].length > 1 ? Number(m[4].slice(1)) : 1) : 0;
            let charge = 0; if (m[5]) { const d = m[5].match(/\d+/); charge = (m[5][0] === '+' ? 1 : -1) * (d ? Number(d[0]) : m[5].length); }
            add({ el, arom, h, charge, bracket: true }); i = j + 1; continue;
        }
        const two = smi.slice(i, i + 2), ar = AROM.find(a => smi.startsWith(a, i));
        if (two === 'Cl' || two === 'Br') { add({ el: two, arom: false, h: 0, charge: 0, bracket: false }); i += 2; continue; }
        if (ORGANIC.includes(c)) { add({ el: c, arom: false, h: 0, charge: 0, bracket: false }); i++; continue; }
        if (ar) { add({ el: ar[0].toUpperCase() + ar.slice(1), arom: true, h: 0, charge: 0, bracket: false }); i += ar.length; continue; }
        throw new Error(`SMILES "${smi}": cannot read "${c}" at ${i}.`);
    }
    if (Object.keys(open).length) throw new Error(`SMILES "${smi}": ring left open.`);
    // Implicit hydrogens of organic-subset atoms: lowest normal valence ≥ bond sum (aromatic bonds count 1, plus 1 per aromatic atom).
    atoms.forEach((at, k) => {
        if (at.bracket) return;
        const own = bonds.filter(b => b.a === k || b.b === k);
        const sum = own.reduce((s, b) => s + (b.order === 1.5 ? 1 : b.order), 0) + (at.arom ? 1 : 0);
        const vs = VALENCE[at.el] ?? [0], v = at.arom ? vs[0] : vs.find(x => x >= sum); // aromatic atoms: lowest valence only
        at.h = v == null ? 0 : Math.max(0, v - sum);
    });
    // Ring bonds: a bond whose ends stay connected without it.
    const nb = (k: number, skip: number) => bonds.flatMap((b, j) => j === skip ? [] : b.a === k ? [b.b] : b.b === k ? [b.a] : []);
    const ringBond = bonds.map((b, j) => { const seen = new Set([b.a]), q = [b.a]; while (q.length) { const x = q.pop()!; for (const y of nb(x, j)) if (!seen.has(y)) { if (y === b.b) return true; seen.add(y); q.push(y); } } return false; });
    const ring = atoms.map((_, k) => bonds.some((b, j) => ringBond[j] && (b.a === k || b.b === k)));
    return { atoms, bonds, ring, ringBond };
}

/** Element counts, with every hydrogen (implicit, bracket and explicit [H] atoms). */
export function formulaOf(m: Molecule): Record<string, number> {
    const out: Record<string, number> = {};
    for (const a of m.atoms) { out[a.el] = (out[a.el] ?? 0) + 1; if (a.h) out.H = (out.H ?? 0) + a.h; }
    return out;
}
export const formulaString = (c: Record<string, number>) => ['C', 'H', ...Object.keys(c).filter(e => e !== 'C' && e !== 'H').sort()].filter(e => c[e]).map(e => e + (c[e] > 1 ? c[e] : '')).join('');

/** Bonds that store energy and fall outside the fitted groups: O–O (peroxides). */
export function hazards(m: Molecule): string[] {
    const out: string[] = [];
    if (m.bonds.some(b => b.order === 1 && m.atoms[b.a].el === 'O' && m.atoms[b.b].el === 'O')) out.push('O–O bond (peroxide): decomposes to oxygen, releasing heat; an oxidiser');
    return out;
}

/** Joback groups of the molecule, or null with the reason when an atom fits no group. */
export function jobackGroups(m: Molecule): { groups: Record<string, number> } | { groups: null; why: string } {
    const n = m.atoms.length, used = new Array(n).fill(false), groups: Record<string, number> = {};
    const H = (k: number) => m.atoms[k].h + m.bonds.filter(b => (b.a === k && m.atoms[b.b].el === 'H') || (b.b === k && m.atoms[b.a].el === 'H')).length;
    const nbs = (k: number) => m.bonds.flatMap(b => b.a === k ? [{ k: b.b, o: b.order, b }] : b.b === k ? [{ k: b.a, o: b.order, b }] : []).filter(x => m.atoms[x.k].el !== 'H');
    const X = (k: number) => nbs(k).length + H(k);
    const put = (g: string, ...ks: number[]) => { groups[g] = (groups[g] ?? 0) + 1; ks.forEach(k => used[k] = true); };
    const el = (k: number) => m.atoms[k].el;
    const dblO = (k: number) => nbs(k).find(x => x.o === 2 && el(x.k) === 'O' && X(x.k) === 1)?.k;
    if (m.atoms.some(a => a.charge !== 0)) return { groups: null, why: 'charged atoms' };
    if (hazards(m).length) return { groups: null, why: 'O–O bond outside the fitted groups' };
    // Carboxylic acids, esters, aldehydes, ketones first: they take two or three atoms each.
    for (let k = 0; k < n; k++) {
        if (el(k) !== 'C' || m.atoms[k].arom || used[k]) continue;
        const cn = nbs(k).find(y => y.o === 3 && el(y.k) === 'N');
        if (cn) { put('-CN', k, cn.k); continue; }
        const o2 = dblO(k); if (o2 == null) continue;
        const sO = nbs(k).filter(x => x.o === 1 && el(x.k) === 'O' && !used[x.k]);
        const oh = sO.find(x => H(x.k) === 1), ether = sO.find(x => H(x.k) === 0);
        if (oh) { put('-COOH (acid)', k, o2, oh.k); continue; }
        if (ether && nbs(ether.k).some(y => y.k !== k && dblO(y.k) != null)) return { groups: null, why: 'anhydride (C(=O)–O–C(=O)) fits no group' };
        if (ether && H(k) === 0 && sO.length < 3) { put('-COO- (ester)', k, o2, ether.k); continue; }
        if (H(k) === 1 && nbs(k).length === 2 && nbs(k).some(x => x.o === 1 && el(x.k) === 'C' && !m.ringBond[m.bonds.indexOf(x.b)])) { put('O=CH- (aldehyde)', k, o2); continue; }
        if (H(k) === 0 && X(k) === 3 && !ether) { put(m.ring[k] ? '>C=O (ring)' : '>C=O (nonring)', k, o2); continue; }
    }
    for (let k = 0; k < n; k++) {
        if (used[k] || el(k) === 'H') continue;
        const a = m.atoms[k], h = H(k), x = X(k), r = m.ring[k], ns = nbs(k);
        if (a.el === 'C') {
            if (x === 3 && ns.some(y => y.o === 2 && el(y.k) === 'O' && !used[y.k])) return { groups: null, why: `C=O at atom ${k} fits no carbonyl group` };
            if (x === 4) { if (h === 3) put('-CH3', k); else if (h === 2) put(r ? '-CH2- (ring)' : '-CH2-', k); else if (h === 1) put(r ? '>CH- (ring)' : '>CH-', k); else if (h === 0) put(r ? '>C< (ring)' : '>C<', k); else return { groups: null, why: 'methane-like carbon' }; continue; }
            if (x === 3) { if (h === 2) put('=CH2', k); else if (h === 1) put(r || a.arom ? '=CH- (ring)' : '=CH-', k); else put(r || a.arom ? '=C< (ring)' : '=C<', k); continue; }
            if (x === 2) { if (ns.filter(y => y.o === 2).length === 2) put('=C=', k); else if (ns.some(y => y.o === 3)) put(h === 1 ? '≡CH' : '≡C-', k); else return { groups: null, why: `carbon at atom ${k}` }; continue; }
            return { groups: null, why: `carbon at atom ${k}` };
        }
        if (a.el === 'O') {
            if (x === 1 && ns.length === 1 && ns[0].o === 2) { if (el(ns[0].k) === 'C' && X(ns[0].k) === 3) return { groups: null, why: 'C=O fits no group' }; put('=O (other than above)', k); continue; }
            if (h === 1 && ns.length === 1) { put(m.atoms[ns[0].k].arom ? '-OH (phenol)' : '-OH (alcohol)', k); continue; }
            if (h === 0 && ns.length === 2) { put(r ? '-O- (ring)' : '-O- (nonring)', k); continue; }
            return { groups: null, why: `oxygen at atom ${k}` };
        }
        if (a.el === 'N') {
            if (x === 3 && h === 2) { put('-NH2', k); continue; }
            if (x === 3 && h === 1) { put(r ? '>NH (ring)' : '>NH (nonring)', k); continue; }
            if (x === 3 && h === 0) { put('>N- (nonring)', k); continue; }
            if (x === 2 && h === 0) { put(r ? '-N= (ring)' : '-N= (nonring)', k); continue; }
            if (x === 2 && h === 1) { put('=NH', k); continue; }
            return { groups: null, why: `nitrogen at atom ${k}` };
        }
        if (a.el === 'S') { if (h === 1) put('-SH', k); else if (x === 2) put(r ? '-S- (ring)' : '-S- (nonring)', k); else return { groups: null, why: `sulfur at atom ${k}` }; continue; }
        if (['F', 'Cl', 'Br', 'I'].includes(a.el)) { put('-' + a.el, k); continue; }
        return { groups: null, why: `element ${a.el}` };
    }
    if (!Object.keys(groups).length) return { groups: null, why: 'no groups' };
    return { groups };
}

type Coef = { Tb: number; Tm: number; Hform: number; Gform: number; Hfus: number; Hvap: number; Cpa: number; Cpb: number; Cpc: number; Cpd: number };
let JOB: { base: Coef; groups: Record<string, Coef> } | null = null;
let loading: Promise<void> | null = null;
export function loadJoback(): Promise<void> {
    loading ??= fetch(new URL('../../rules/joback.json', import.meta.url)).then(r => r.json()).then(d => { JOB = d; });
    return loading;
}
export const jobackLoaded = () => JOB !== null;

export interface Props { Tb: number; Tm: number; HfGas: number; GfGas: number; Hvap: number; Hfus: number; cp: (T: number) => number }
/** Joback properties (K, kJ/mol, J/mol/K); null when the groups do not cover the molecule. */
export function jobackProps(groups: Record<string, number>): Props | null {
    if (!JOB) throw new Error('Joback table not loaded.');
    const s = (k: keyof Coef) => JOB!.base[k] + Object.entries(groups).reduce((t, [g, c]) => {
        const v = JOB!.groups[g]?.[k]; if (v == null) throw new Error(`no ${k} for ${g}`); return t + v * c;
    }, 0);
    try {
        const a = s('Cpa'), b = s('Cpb'), c = s('Cpc'), d = s('Cpd');
        return { Tb: s('Tb'), Tm: s('Tm'), HfGas: s('Hform'), GfGas: s('Gform'), Hvap: s('Hvap'), Hfus: s('Hfus'), cp: T => a + b * T + c * T ** 2 + d * T ** 3 };
    } catch { return null; }
}

// Heat of burning from the heat of formation (Hess's law): products CO2 gas −393.51, liquid water −285.83, SO2 gas −296.81
// kJ/mol, nitrogen to N2 (CODATA Key Values for Thermodynamics, Cox, Wagman & Medvedev 1989). Liquid = gas − heat of
// vaporisation, crystal = gas − vaporisation − fusion [ASSUMED: Joback's values at the boiling and melting points stand for 298 K].
export function combustionKJmol(f: Record<string, number>, p: Props, state: string): number | null {
    if (Object.keys(f).some(e => !['C', 'H', 'N', 'O', 'S'].includes(e))) return null;
    const hf = p.HfGas - (state === 'gas' ? 0 : p.Hvap) - (state === 'cry' ? p.Hfus : 0);
    const prod = (f.C ?? 0) * -393.51 + (f.H ?? 0) / 2 * -285.83 + (f.S ?? 0) * -296.81;
    return hf - prod;
}
/** State at temperature T (K) from boiling and melting points. */
export const stateAt = (p: { Tb: number; Tm: number }, T: number) => T >= p.Tb ? 'gas' : T >= p.Tm ? 'liquid' : 'solid';
