// Lists, for the line corpus (realdiff.mjs's), the tools the scene words add beyond the router's (cue-tools.ts).
import fs from 'fs';
const S = '/tmp/claude-0/-home-claude/a6862b8f-31d2-583c-9908-39f5eb41a662/scratchpad';
const lines = new Set();
for (const l of fs.readFileSync(`${S}/corpus37-before.txt`, 'utf8').split('\n')) if (l.startsWith('» ')) lines.add(l.slice(2));
const lit = (f) => { const t = fs.readFileSync(f, 'utf8'); for (const m of t.matchAll(/^\s*\[?\s*(['"])((?:(?!\1).|\\\1){4,200}?)\1\s*,/gm)) { const s = m[2].replace(/\\'/g, "'"); if (/^[A-Z"*_]/.test(s) && / /.test(s)) lines.add(s); } };
for (const f of [`${S}/probe-c.mjs`, `${S}/probe-p.mjs`, '/home/claude/out/bundle/review-tests/probes/reader-lines.mjs', '/home/claude/out/bundle/review-tests/probes/shot-lines.mjs', '/tmp/claude-0/-home-claude/a6862b8f-31d2-583c-9908-39f5eb41a662/scratchpad/trees/b991f94/tests/route.test.mjs']) lit(f);
const R = await import('/home/claude/work/src/rules/router.js'), C = await import('/home/claude/work/src/rules/cue-tools.js');
let n = 0, added = 0;
for (const l of lines) { const r = R.routeTurn(l).tools; if (!r.length) continue; n++; const c = C.cueTools(l, [], r); if (Object.keys(c).length) { added++; console.log(`${l}\n   + ${Object.entries(c).map(([t, w]) => `${t} (${w})`).join(', ')}`); } }
console.log(`${n} routed lines, ${added} with a cue tool added`);
