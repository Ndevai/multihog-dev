// Scores a tree's router and frame.ts on the eval scenes (src/rules/eval-scenes.ts of the current tree): a scene is right when
// every expected tool is routed and no tool outside the expected, allowed and always-offered ones is; a draft is wrong when
// code drafts a tool the scene does not expect or allow. Usage: node evalscore.mjs <tree> [--rows]
const dir = process.argv[2];
const { EVAL_SCENES } = await import('/home/claude/work/src/rules/eval-scenes.js');
const R = await import(dir + '/src/rules/router.js'), F = await import(dir + '/src/rules/frame.js');
const ALWAYS = new Set(['RecordFact', 'PassTime', 'NewCharacter', 'Interpret']);
let right = 0, missing = 0, extra = 0, misdraft = 0, rows = [];
for (const s of EVAL_SCENES) {
  const want = new Set(s.expect.map(e => e.tool)), ok = new Set([...want, ...(s.allow ?? [])]);
  const got = new Set(R.routeTurn(s.player).tools);
  const lack = [...want].filter(t => !got.has(t) && !ALWAYS.has(t)), over = [...got].filter(t => !ok.has(t) && !ALWAYS.has(t));
  let drafts = []; try { drafts = F.framedCalls(s.player, 'Mara').calls.map(c => c.tool); } catch {}
  const bad = drafts.filter(t => !ok.has(t));
  if (!lack.length && !over.length) right++;
  missing += lack.length; extra += over.length; misdraft += bad.length;
  rows.push(`${s.id}\t${s.player}\t${lack.join(' ') || '-'}\t${over.join(' ') || '-'}\t${bad.join(' ') || '-'}`);
}
console.log(`${dir.split('/').pop()}\tscenes ${EVAL_SCENES.length}\tright ${right}\ttools missing ${missing}\ttools extra ${extra}\tmisdrafts ${misdraft}`);
if (process.argv[3] === '--rows') console.log('id\tline\tmissing\textra\tmisdrafted\n' + rows.join('\n'));
