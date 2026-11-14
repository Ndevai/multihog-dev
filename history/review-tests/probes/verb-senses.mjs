// Verbs whose VerbNet classes route to different tools: the router takes the union of every class's tools.
import fs from 'fs';
const { VERBNET } = await import('/home/claude/work/src/rules/data/verbnet.js');
const src = fs.readFileSync('/home/claude/work/src/rules/router.ts', 'utf8');
const block = (name) => src.slice(src.indexOf(`const ${name}`), src.indexOf('};', src.indexOf(`const ${name}`)));
const parse = (b) => Object.fromEntries([...b.matchAll(/([a-z_]+): \[([^\]]*)\]/g)].map(m => [m[1], m[2].split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean)]));
const CLASS_TOOL = parse(block('CLASS_TOOL')), VERB_TOOL = parse(block('VERB_TOOL'));
const TOP = c => c.replace(/-[\d.]+$/, '');
let routed = 0, mixed = [], mixedNamed = 0;
for (const [v, classes] of Object.entries(VERBNET)) {
  if (v.includes('_')) continue;
  const sets = classes.map(c => (CLASS_TOOL[TOP(c)] ?? []).join('+'));
  if (!sets.some(Boolean)) continue;
  routed++;
  const distinct = new Set(sets);
  if (distinct.size > 1) { if (VERB_TOOL[v]) mixedNamed++; else mixed.push([v, classes.map(c => `${TOP(c)}→${(CLASS_TOOL[TOP(c)] ?? []).join('+') || '∅'}`).join(', ')]); }
}
console.log(`verbs VerbNet routes: ${routed}; with classes routing to different tools: ${mixed.length + mixedNamed} (${mixedNamed} settled by a named entry, ${mixed.length} open)`);
const common = ['call','take','give','get','put','set','turn','run','hold','keep','break','cut','hit','strike','throw','pull','push','pass','cross','catch','draw','drive','drop','raise','rest','settle','fix','charge','press','beat','shoot','fire','pick','pin','pack','hang','lift','lead','follow','sign','stick','stop','strip','tear','touch','treat','bear','carry','check','clear','close','cover','deal','drag','fill','fly','hunt','join','kick','knock','land','lay','leave','lose','mark','meet','miss','move','open','order','pay','play','pour','raise','reach','ring','rush','save','score','see','sell','send','serve','shake','show','shut','sink','sit','slip','smash','snap','spin','split','spread','spring','stand','steal','stir','swing','tap','tie','trip','wave','win','work','wrap'];
console.log('of 100 everyday verbs, open:', mixed.filter(([v]) => common.includes(v)).map(([v, c]) => `${v} (${c})`).join('; '));
const conflict = mixed.filter(([, c]) => new Set(c.split(', ').map(x => x.split('→')[1]).filter(t => t !== '∅')).size > 1);
console.log(`open verbs with two or more different tools among their senses: ${conflict.length}; everyday ones: ${conflict.filter(([v]) => common.includes(v)).map(([v]) => v).join(', ')}`);
console.log(`everyday open verbs: ${mixed.filter(([v]) => common.includes(v)).length} of ${new Set(common).size}`);
