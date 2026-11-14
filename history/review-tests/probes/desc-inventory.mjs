// Routes the lines written from each tool's own description (desc-lines.tsv: tool, activity named, three lines) and lists
// the lines the router does not send to that tool; with nothing routed the model picks from every tool (marked "model").
// Usage: node desc-inventory.mjs <tree> [--all]
import fs from 'fs';
const dir = process.argv[2];
const R = await import(dir + '/src/rules/router.js');
const rows = fs.readFileSync(new URL('./desc-lines.tsv', import.meta.url), 'utf8').trim().split('\n').map(l => l.split('\t'));
let lines = 0, hit = 0, model = 0, miss = 0; const out = [];
for (const [tool, what, ...ls] of rows) for (const l of ls) {
  lines++;
  // As play offers them: the routed tools and the scene words' (cue-tools.ts, when the tree has it), with the ones every turn
  // may need; none when nothing routes.
  const off = R.routedTools(l, () => true, ['Mara', 'Tom'], []);
  const got = off ? [...off] : [];
  if (got.includes(tool)) hit++; else if (!got.length) { model++; out.push(`model\t${tool}\t${what}\t${l}`); } else { miss++; out.push(`miss\t${tool}\t${what}\t${l}\t${got.join(' ')}`); }
}
console.log(`${dir.split('/').pop()}\tlines ${lines}\trouted to the tool ${hit}\tnothing routed (model picks) ${model}\trouted elsewhere ${miss}`);
if (process.argv[3] === '--all') console.log(out.join('\n'));
