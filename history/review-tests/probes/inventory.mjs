// Every verb with two or more VerbNet senses × one common noun of each kind (and "the cook a coin", "at the cook"),
// routed by the old router and the new: what each phrase offered, what it offers now, the senses left, and the class.
// Usage: node inventory.mjs <old tree> <new tree> <frequency list> <out.tsv>
import fs from 'fs';
const [OLD, NEW, FREQ, OUT] = process.argv.slice(2);
const Rold = await import(OLD + '/src/rules/router.js'), Rnew = await import(NEW + '/src/rules/router.js');
const Sn = await import(NEW + '/src/rules/senses.js'), { VERB_SENSES } = await import(NEW + '/src/rules/data/senses.js');
const freq = new Map(fs.readFileSync(FREQ, 'utf8').split('\n').map(l => l.split(' ')).filter(x => x[1]).map(([w, n]) => [w, Number(n)]));
const src = fs.readFileSync(NEW + '/src/rules/router.ts', 'utf8');
const block = n => src.slice(src.indexOf(`const ${n}`), src.indexOf('};', src.indexOf(`const ${n}`)));
const parse = b => Object.fromEntries([...b.matchAll(/([a-z_]+): \[([^\]]*)\]/g)].map(m => [m[1], m[2].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean)]));
const CLASS_TOOL = parse(block('CLASS_TOOL')), VERB_TOOL = parse(block('VERB_TOOL'));
const TOP = c => c.replace(/-[\d.]+$/, '');
const KINDS = [['person', 'the cook'], ['animal', 'the horse'], ['weapon', 'the sword'], ['gun', 'the pistol'], ['projectile', 'the arrow'], ['food', 'the bread'], ['drink', 'the wine'],
  ['body part', 'my hand'], ['garment', 'the coat'], ['container', 'the jug'], ['vehicle', 'the cart'], ['building', 'the house'], ['plant', 'the tree'], ['object', 'the rope'],
  ['money', 'the coins'], ['abstract', 'the plan'], ['message', 'the letter'], ['substance', 'the sand'], ['event', 'the party'], ['time', 'an hour'], ['group', 'the crowd'], ['machine', 'the lock']];
const SHAPES = [...KINDS.map(([k, np]) => [k, np]), ['two objects', 'the cook a coin'], ['no object', 'at the cook']];
const toolsOf = (r) => Object.keys(r.why).filter(t => t !== 'Interpret' && t !== 'PassTime' || r.why[t] !== 'with Communicate').sort();
const rows = [];
for (const v of Object.keys(VERB_SENSES)) {
  if (v.includes('_')) continue;
  const routed = Object.keys(VERB_SENSES[v]).some(c => (CLASS_TOOL[TOP(c)] ?? []).length) || VERB_TOOL[v];
  if (!routed) continue;
  for (const [kind, np] of SHAPES) {
    const line = `I ${v} ${np}.`;
    let a, b; try { a = toolsOf(Rold.routeTurn(line)); b = toolsOf(Rnew.routeTurn(line)); } catch { continue; }
    const after = line.toLowerCase().replace(/[.]/, ' .').split(/\s+/).slice(2);
    const rd = Sn.readings(v, after) ?? Object.keys(VERB_SENSES[v]).map(cls => ({ cls, fit: 'any' }));
    const toolSets = new Set(rd.map(r => (CLASS_TOOL[TOP(r.cls)] ?? []).join('+')).filter(Boolean));
    const strong = new Set(rd.filter(r => r.fit === 'match').map(r => (CLASS_TOOL[TOP(r.cls)] ?? []).join('+')).filter(Boolean));
    const removed = a.filter(t => !b.includes(t)), added = b.filter(t => !a.includes(t));
    const cls = VERB_TOOL[v] ? (toolSets.size > 1 ? 'named, other senses' : 'named') : removed.length || added.length ? 'changed' : strong.size > 1 ? 'open: senses the object fits name different tools' : toolSets.size > 1 ? 'open: an unrestricted sense adds a tool' : 'one reading';
    const plausible = rd.some(r => r.fit === 'match');
    rows.push({ plausible, v, kind, line, before: a.join(' '), after: b.join(' '), removed: removed.join(' '), added: added.join(' '), senses: rd.map(r => `${TOP(r.cls)}${r.fit === 'match' ? '' : '?'}`).join(' '), cls, f: freq.get(v) ?? 0 });
  }
}
rows.sort((x, y) => y.f - x.f || x.v.localeCompare(y.v));
fs.writeFileSync(OUT, ['verb\tkind\tphrase\tbefore\tafter\tremoved\tadded\tsenses kept (? = role left open)\tclass\tobject fits a kept sense\tsubtitle count', ...rows.map(r => [r.v, r.kind, r.line, r.before, r.after, r.removed, r.added, r.senses, r.cls, r.plausible ? 'yes' : 'no', r.f].join('\t'))].join('\n') + '\n');
const by = {}; for (const r of rows) by[r.cls] = (by[r.cls] ?? 0) + 1;
const vs = new Set(rows.map(r => r.v));
console.log(`${rows.length} phrases from ${vs.size} verbs:`, JSON.stringify(by));
const byP = {}; for (const r of rows) if (r.plausible) byP[r.cls] = (byP[r.cls] ?? 0) + 1; console.log('plausible (the object fits a kept sense):', rows.filter(r => r.plausible).length, JSON.stringify(byP));
const top = (c, n, f = () => true) => rows.filter(r => r.cls === c && r.plausible && f(r)).slice(0, n).map(r => `${r.line} ${r.before || '∅'} → ${r.after || '∅'}`).join('\n  ');
console.log('changed, top 40 by verb frequency:\n  ' + top('changed', 40, r => !/^(get|go)$/.test(r.v)));
console.log('open, an unrestricted sense adds a tool, top 25:\n  ' + top('open: an unrestricted sense adds a tool', 25));
console.log('open (different tools), top 30:\n  ' + top('open: senses the object fits name different tools', 30));
console.log('named with other senses, top 20:\n  ' + top('named, other senses', 20));
