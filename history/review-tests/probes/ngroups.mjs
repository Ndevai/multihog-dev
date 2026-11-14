import fs from 'fs';
const O = await import('/home/claude/work/src/rules/sense-odds.js');
const rows = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n').slice(1).map(l => l.split('\t')).filter(r => r[8] === 'open: senses the object fits name different tools' && r[9] === 'yes');
const hist = {}; let reach = { discourse: 0, weaponFight: 0, weaponFightWords: 0 };
const p = (n, lr) => lr / (lr + n - 1);
for (const r of rows) {
  const line = r[2], v = r[0], after = line.toLowerCase().replace(/\./, ' .').split(/\s+/).slice(2);
  const o = O.senseOdds(v, after, line, [], null); if (!o) continue;
  const n = o.length; hist[n] = (hist[n] ?? 0) + 1;
  if (0.94 >= 0.8) reach.discourse++;
  if (p(n, 3 * 2) >= 0.8) reach.weaponFight++;
  if (p(n, 3 * 2 * 1.5 ** 3) >= 0.8) reach.weaponFightWords++;
}
console.log(rows.length, 'open phrases; readings per phrase:', JSON.stringify(hist), '; reach 80 % with:', JSON.stringify(reach));
