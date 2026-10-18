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
    console.log(`${c.verdict.padEnd(13)} ${s.name} ${s.formula}: measured ${Math.round(c.measured)} kJ/mol, atoms allow ${Math.round(c.predicted)} (${c.errPct > 0 ? '+' : ''}${c.errPct.toFixed(1)} %)`);
for (const [f, fam] of [['C6H12O6'], ['C12H22O11', 'carbohydrate'], ['C18H36O2', 'fatty acid'], ['C6H13NO2', 'amino acid']]) {
    const h = m.heatOf(f, fam); console.log(`${f}: ${h.kJg.toFixed(1)} kJ/g, ${h.note}`);
}
