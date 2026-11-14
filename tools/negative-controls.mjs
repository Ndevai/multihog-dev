// Negative controls (AGENTS.md, How to check): each entry of tests/negative-controls.json breaks one fix in the compiled code
// (its `find`, a regular expression, replaced once by `replace`) and runs the test file that guards it (`test`, default
// engine). The control holds when the test then reports `MISS <miss>`, or the run stops with an error: a fix whose test
// still passes with the fix broken is unguarded. The controls run in a copy of the repository (node_modules and .git left
// out), one at a time, each file restored after its run, so the working tree is never touched.
// Usage: node tools/negative-controls.mjs [id ...]   e.g. npm run negative-controls -- N25 N30
// NEGCTL_LOG=<folder> keeps each run's output.
import { readFileSync, writeFileSync, cpSync, mkdtempSync, rmSync, openSync, closeSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const list = JSON.parse(readFileSync(join(root, 'tests/negative-controls.json'), 'utf8'));
const only = process.argv.slice(2);
const chosen = only.length ? list.filter(m => only.includes(m.id)) : list;
if (only.length && chosen.length < only.length) console.log(`Unknown: ${only.filter(id => !list.some(m => m.id === id)).join(', ')}`);
const work = mkdtempSync(join(tmpdir(), 'negctl-'));
cpSync(root, work, { recursive: true, filter: p => !/[\\/](node_modules|\.git)$/.test(p) });
const results = [];
try {
    for (const m of chosen) {
        const file = join(work, m.file), text = readFileSync(file, 'utf8');
        const re = new RegExp(m.find);
        if (!re.test(text)) { results.push([m.id, 'PATTERN NOT FOUND', m.name]); console.log(...results.at(-1)); continue; }
        writeFileSync(file, text.replace(re, () => m.replace));
        const t0 = Date.now();
        // The test writes into files (written at once, whole), not a pipe, so every MISS line it prints is read back.
        const outF = join(work, '.negctl-out'), errF = join(work, '.negctl-err'), o = openSync(outF, 'w'), e = openSync(errF, 'w');
        const run = spawnSync(process.execPath, [`tests/${m.test ?? 'engine'}.test.mjs`], { cwd: work, stdio: ['ignore', o, e], timeout: 900_000 });
        closeSync(o); closeSync(e);
        const r = { ...run, stdout: readFileSync(outF, 'utf8'), stderr: readFileSync(errF, 'utf8') };
        writeFileSync(file, text);
        // NEGCTL_LOG=<folder> keeps each run's output there, to see why a control was not caught.
        if (process.env.NEGCTL_LOG) writeFileSync(join(process.env.NEGCTL_LOG, `${m.id}.txt`), `${r.stdout ?? ''}\n--- stderr (status ${r.status}) ---\n${r.stderr ?? ''}`);
        if (r.error) { results.push([m.id, `RUN FAILED: ${r.error.message}`, m.name]); console.log(...results.at(-1)); continue; }
        const caught = r.stdout.includes(`MISS ${m.miss}`) || (r.status !== 0 && /Error/.test(r.stderr ?? ''));
        const missed = (r.stdout ?? '').split('\n').filter(l => l.startsWith('MISS')).join(' | ').slice(0, 200);
        results.push([m.id, caught ? 'caught' : `NOT CAUGHT (status ${r.status}${r.signal ? `, ${r.signal}` : ''}, ${(r.stdout ?? '').length} bytes out)${missed ? `: ${missed}` : ''}`, `${m.name} (${Math.round((Date.now() - t0) / 1000)} s)`]);
        console.log(...results.at(-1));
    }
} finally { rmSync(work, { recursive: true, force: true }); }
const held = results.filter(r => r[1] === 'caught').length;
console.log(`${held} of ${results.length} controls caught.`);
process.exit(held === results.length ? 0 : 1);
