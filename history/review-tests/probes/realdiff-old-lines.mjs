// Lines written as players write (the earlier corpora: sections 36–38, and the route test's), routed by the old and the
// new router; prints each line whose tools changed.
import fs from 'fs';
const [OLD, NEW] = process.argv.slice(2);
const S = '/tmp/claude-0/-home-claude/a6862b8f-31d2-583c-9908-39f5eb41a662/scratchpad';
const lines = new Set();
for (const l of fs.readFileSync(`${S}/corpus37-before.txt`, 'utf8').split('\n')) if (l.startsWith('» ')) lines.add(l.slice(2));
const lit = (f) => { const t = fs.readFileSync(f, 'utf8'); for (const m of t.matchAll(/^\s*\[?\s*(['"])((?:(?!\1).|\\\1){4,200}?)\1\s*,/gm)) { const s = m[2].replace(/\\'/g, "'"); if (/^[A-Z"*_]/.test(s) && / /.test(s)) lines.add(s); } };
for (const f of [`${S}/probe-c.mjs`, `${S}/probe-p.mjs`, '/home/claude/out/bundle/review-tests/probes/reader-lines.mjs', '/home/claude/out/bundle/review-tests/probes/shot-lines.mjs', `${OLD}/tests/route.test.mjs`]) lit(f);
const A = await import(OLD + '/src/rules/router.js'), B = await import(NEW + '/src/rules/router.js');
const t = r => Object.keys(r.why).sort().join(' ');
let n = 0, changed = 0;
for (const l of lines) { n++; const a = t(A.routeTurn(l)), b = t(B.routeTurn(l)); if (a !== b) { changed++; console.log(`${l}\n   ${a || '∅'} → ${b || '∅'}`); } }
console.log(`${n} lines, ${changed} changed`);
