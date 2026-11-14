// Held-out lines written after the section 43 fixes, untuned (heldout.tsv: tool, + for "must be offered" or - for "nothing
// listed after the dash may be offered", line). For "-" lines the check is the tools in NOT below. Usage: node heldout.mjs <tree> [--all]
import fs from 'fs';
const dir = process.argv[2];
const R = await import(dir + '/src/rules/router.js');
const NOT = {
  'I read the letter.': ['Communicate'], 'I sniff the stew.': ['Look', 'Communicate'], 'I taste the wine.': ['Look'], 'I hang the lantern on the hook.': ['HoldOn'],
  'I hang my coat on the peg.': ['HoldOn'], 'I catch the ball.': ['Disease', 'Chase'], 'I catch a fish.': ['Chase', 'Disease'], 'I fix my hair.': ['BodyCheck'],
  'I take the road to the north.': ['Price'], 'Mara picks an apple.': ['BodyCheck'], 'The bread rolls off the table.': ['Act', 'BodyStrike'], 'I walk to the bar.': ['Break'],
  'I sit on the bench.': ['Break'], 'I carry the boy to the cart.': ['Price'], 'The meal costs a shilling.': ['Transfer'], 'I wait a couple of minutes.': ['Price'],
  'I feel the wall for a latch.': ['Appraise', 'Look'], 'Mara watches the sunset.': ['Choose', 'SocialResponse'], 'I tell Tom to wait.': ['SocialResponse'],
  '"Pass the bread, please," I say.': ['SocialResponse'], 'I am a little tired.': ['Claim'], 'I change the bandage.': ['BodyEnvironment'],
  'I read the sign.': ['Communicate'], 'I catch the rope.': ['Chase', 'Disease'], 'I hang the picture on the wall.': ['HoldOn'], 'I fix the lamp.': ['Price'],
  'Tom smells the bread.': ['Look'], 'The ball rolls down the hill.': ['Act'], 'I walk to the beam.': ['Break'], 'I give Tom a ring.': ['Listen'],
  'I open fire on the bandits.': ['BodyEnvironment'], 'I stab the bandit.': ['Appraise'],
  'Mara puts her hands in her pockets.': ['Transfer'], 'The box holds a dozen eggs.': ['Break', 'HoldOn'], 'Tom gives way to the bishop.': ['Break'],
  'How does Mara feel about the journey?': ['SocialResponse'], 'I catch the apple.': ['Chase', 'Disease'], 'The shelf is dusty.': ['Break'], 'I taste the stew.': ['Look'],
};
const rows = fs.readFileSync(new URL(process.env.SET ?? './heldout.tsv', import.meta.url), 'utf8').trim().split('\n').map(l => l.split('\t'));
let pos = 0, hit = 0, model = 0, miss = 0, neg = 0, clean = 0; const out = [];
for (const [tool, sign, line] of rows) {
  let off; try { off = R.routedTools(line, () => true, ['Mara', 'Tom'], [], [], 'Mara'); } catch { off = R.routedTools(line, () => true, ['Mara', 'Tom'], []); } const got = off ? [...off] : [];
  if (sign === '+') { pos++; const t = tool === 'Mara' ? 'Claim' : tool; if (got.includes(t)) hit++; else if (!got.length) { model++; out.push(`model\t${t}\t${line}`); } else { miss++; out.push(`miss\t${t}\t${line}\t${got.join(' ')}`); } }
  else { neg++; const bad = (NOT[line] ?? []).filter(t => got.includes(t)); if (!bad.length) clean++; else out.push(`wrong\t${bad.join(' ')}\t${line}\t${got.join(' ')}`); }
}
console.log(`${dir.split('/').pop()}\tlines with a tool ${pos}: offered ${hit}, nothing routed ${model}, routed without it ${miss}\tlines with tools to keep out ${neg}: clean ${clean}`);
if (process.argv[3] === '--all') console.log(out.join('\n'));
