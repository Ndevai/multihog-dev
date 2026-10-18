// Checks every record in rules/substances.json against its composition (docs/df-body-engine.md §6.19) and prints the
// verdicts. Usage: node tools/check-substances.mjs [--all]
import { readFileSync } from 'node:fs';
globalThis.fetch = async u => ({ json: async () => JSON.parse(readFileSync(new URL(u))) });
const m = await import('../src/rules/substance.js');
await m.loadSubstances();
const all = process.argv.includes('--all');
const rows = m.substanceTable().map(s => ({ s, c: m.checkSubstance(s) }));
const n = v => rows.filter(r => r.c.verdict === v).length;
console.log(`ok ${n('ok')}, suspect ${n('suspect')}, contradiction ${n('contradiction')}, not judged ${n('not judged')}`);
for (const { s, c } of rows) if (all || c.verdict === 'suspect' || c.verdict === 'contradiction')
    console.log(`${c.verdict.padEnd(13)} ${s.name} ${s.formula}: measured ${Math.round(c.measured)} kJ/mol, atoms allow ${Math.round(c.predicted)} (${c.errPct == null ? '' : (c.errPct > 0 ? '+' : '') + c.errPct.toFixed(1) + ' %, '}${c.by})${c.problems.length ? '; ' + c.problems.join('; ') : ''}`);
const est = [['sucrose', 'C12H22O11', null, 'OC[C@H]1O[C@@](CO)(O[C@H]2O[C@H](CO)[C@@H](O)[C@H](O)[C@H]2O)[C@@H](O)[C@@H]1O', 'cry'],
    ['stearic acid', 'C18H36O2', 'fatty acid', 'CCCCCCCCCCCCCCCCCC(=O)O', 'cry'], ['leucine', 'C6H13NO2', null, 'CC(C)CC(N)C(=O)O', 'cry'],
    ['hydrogen peroxide', 'H2O2', null, 'OO', 'liq']];
for (const [n, f, fam, smi, st] of est) {
    const h = m.heatOf(f, fam, smi, st), x = m.fromStructure(smi, st);
    console.log(`${n} ${f}: ${h.kJg.toFixed(1)} kJ/g, ${h.note}${x.hazards.length ? '; ' + x.hazards.join('; ') : ''}${x.why ? ' (groups: ' + x.why + ')' : ''}`);
}
