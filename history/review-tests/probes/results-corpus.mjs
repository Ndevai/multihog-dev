// Records every tool result the engine test makes, with the narrator's blocks: node results-corpus.mjs <out.json>. Run from anywhere; paths are the work tree's.
// Records every tool result and the narrator's per-turn blocks while the engine test runs: node record.mjs <out.json>
process.chdir('/home/claude/work');
const fs = await import('fs');
const H = await import('/home/claude/work/tools/st-harness.mjs');
const T = await import('/home/claude/work/src/rules/rules-tools.js');
const Q = await import('/home/claude/work/src/rules/question-pass.js');
const B = await import('/home/claude/work/src/rules/body-sheet.js');
const out = { results: [], blocks: new Set(), decided: new Set() };
const wrap = () => { for (const t of T.REGISTRY.values()) if (!t.__rec) { const e = t.exec; t.exec = async a => { const r = await e(a); try { out.results.push({ tool: t.name, args: a, result: String(r), year: T.storyYearNow?.() ?? null });
  for (const b of [B.bodyBlock(B.trackedPeople()), T.knowledgeInjection(), T.possessionsInjection()]) if (b) out.blocks.add(b);
  const d = Q.decidedInjection(); if (d) out.decided.add(d); } catch {} return r; }; t.__rec = true; } };
wrap(); const iv = setInterval(wrap, 5);
await import('/home/claude/work/tests/engine.test.mjs');
clearInterval(iv); fs.writeFileSync(process.argv[2], JSON.stringify({ results: out.results, blocks: [...out.blocks], decided: [...out.decided] }));

// Companions: results-extra.mjs calls the 17 tools the engine test leaves out (1850 London, 1990 Chicago); results-scan.cjs <corpus.json> <extra.json> strip counts what the narrator reads.
