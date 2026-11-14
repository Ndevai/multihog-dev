// Scores the tool-offering step as play runs it (question-pass.ts: routedTools(line, has, people) ?? the model's pick): a tool
// the scene expects is a hard miss when the router routed other tools (the planner's schema then holds only those) and code
// drafted no call of it; with nothing routed the model picks from every tool (soft). Usage: node evalplay.mjs <tree> [--rows]
const dir = process.argv[2];
const { EVAL_SCENES } = await import('/home/claude/work/src/rules/eval-scenes.js');
const R = await import(dir + '/src/rules/router.js'), F = await import(dir + '/src/rules/frame.js');
const ALWAYS = new Set([...(R.ALWAYS ?? []), 'RecordFact', 'PassTime', 'NewCharacter', 'Interpret']);
const names = ['Mara', 'Tom'];
let hard = 0, soft = 0, extra = 0, misdraft = 0, routedN = 0, right = 0; const rows = [];
for (const s of EVAL_SCENES) {
  const want = new Set(s.expect.map(e => e.tool)), ok = new Set([...want, ...(s.allow ?? [])]);
  let routed = null; try { routed = R.routedTools(s.player, () => true, names, [s.context], [s.context], 'Mara'); } catch (e) { routed = R.routedTools(s.player, () => true); }
  let drafts = []; try { drafts = F.framedCalls(s.player, 'Mara').calls.map(c => c.tool); } catch { try { drafts = F.framedCalls(s.player, 'Mara').calls.map(c => c.tool); } catch {} }
  const offered = routed ? new Set([...routed, ...drafts]) : null;
  if (routed) routedN++;
  const lack = [...want].filter(t => !ALWAYS.has(t) && offered && !offered.has(t));
  const softLack = routed ? [] : [...want].filter(t => !ALWAYS.has(t) && !drafts.includes(t));
  const over = offered ? [...offered].filter(t => !ok.has(t) && !ALWAYS.has(t)) : [];
  const bad = drafts.filter(t => !ok.has(t));
  hard += lack.length; soft += softLack.length; extra += over.length; misdraft += bad.length;
  if (!lack.length && !over.length && !bad.length) right++;
  rows.push(`${s.id}\t${s.player.slice(0, 70)}\t${routed ? 'routed' : 'model'}\t${lack.join(' ') || '-'}\t${softLack.join(' ') || '-'}\t${over.join(' ') || '-'}\t${bad.join(' ') || '-'}`);
}
console.log(`${dir.split('/').pop()}\tscenes ${EVAL_SCENES.length}\trouted ${routedN}\tclean ${right}\thard misses ${hard}\tto the model ${soft}\textra offered ${extra}\tmisdrafts ${misdraft}`);
if (process.argv[3] === '--rows') console.log('id\tline\tstep\thard miss\tmodel picks\textra\tmisdrafted\n' + rows.join('\n'));
