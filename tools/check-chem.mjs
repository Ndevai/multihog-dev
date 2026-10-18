// Checks every compound in rules/chem.json against physics and its structure (docs/df-body-engine.md §6.19), cross-checks
// heats of burning from measured heats of formation against rules/substances.json, and describes a few compounds.
// Usage: node tools/check-chem.mjs [--list]
import { readFileSync } from 'node:fs';
globalThis.fetch = async u => ({ json: async () => JSON.parse(readFileSync(new URL(u))) });
const C = await import('../src/rules/chem.js'), S = await import('../src/rules/substance.js');
await C.loadChem(); await S.loadSubstances();
const counts = {}, list = process.argv.includes('--list');
for (const r of C.chemRows()) for (const p of C.checkCompound(r)) {
    const k = p.split(':')[0] + ': ' + p.split(':')[1].replace(/[\d.]+/g, '#').split('(')[0].trim();
    counts[k] = (counts[k] ?? 0) + 1; if (list) console.log(r.n, '—', p);
}
console.log(C.chemRows().length, 'compounds'); for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) console.log(String(v).padStart(4), k);
let n = 0, d = [];
for (const s of S.substanceTable()) {
    const r = C.chemRows().find(x => x.smi && s.smiles && x.f === s.formula.replace(/\s/g, '') && x.n.toLowerCase().replace(/^l-/, '') === s.name.toLowerCase().replace(/^l-/, '').replace(' (graphite)', ''));
    const h = r && C.heatFromFormation(r), m = S.checkSubstance(s).measured;
    if (h && m) { n++; d.push([Math.abs(h.kJmol - m) / m * 100, s.name, Math.round(h.kJmol), Math.round(m)]); }
}
d.sort((a, b) => b[0] - a[0]);
console.log(`heat of burning, two independent sources: ${n} compounds, median difference ${d[d.length >> 1][0].toFixed(2)} %; largest:`, d.slice(0, 5).map(x => `${x[1]} ${x[2]} vs ${x[3]} (${x[0].toFixed(1)} %)`).join('; '));
for (const q of ['water', 'ethanol', 'octane', 'carbon dioxide', 'glycerol', 'naphthalene', 'CCCCCCCCCCCC']) console.log('\n' + C.describe(q, 20));
