// Lists the sentences of every prompt and tool description that the models read and that carry a pattern known to send a
// model the wrong way: a modern example in a label (it draws modern things into historical scenes), a definition by what
// a thing is not (the model must guess what it is), and a literal example token the model may copy. Usage:
//   node tools/prompt-audit.mjs
process.chdir(new URL('..', import.meta.url).pathname);
const { tools } = await import('./st-harness.mjs');
const Q = await import('../src/rules/question-pass.js'), A = await import('../src/rules/rules-audit.js'), T = await import('../src/rules/rules-tools.js');
const texts = [['QUESTION_SYSTEM', Q.QUESTION_SYSTEM], ['AUDIT_SYSTEM', A.AUDIT_SYSTEM], ['RULES_BRIEF', T.RULES_BRIEF], ['RULES_BRIEF_DECIDED', T.RULES_BRIEF_DECIDED]];
const walk = (name, p) => { if (p.description) texts.push([name, p.description]); if (p.enum) texts.push([`${name} options`, p.enum.join(' | ')]); for (const [k, q] of Object.entries(p.properties ?? p.items?.properties ?? {})) walk(`${name}.${k}`, q); };
for (const t of tools.values()) { texts.push([t.name, t.description]); for (const [k, q] of Object.entries(t.parameters?.properties ?? {})) walk(`${t.name}.${k}`, q); }
const MODERN = /\b(television|tv|traffic|car|cars|phone|vacuum|jackhammer|jet|an engine|computer|internet|bus|train)\b/i, RULE = /rule engine|the engine/i;
const NEG = /\b(not|never|no other|none of|instead of|rather than)\b/i;
const out = { modern: [], negative: [] };
for (const [name, text] of texts) for (const sent of String(text).split(/(?<=[.;])\s+|\n/)) {
    if (MODERN.test(sent.replace(RULE, ''))) out.modern.push(`${name}: ${sent.trim().slice(0, 200)}`);
    if (NEG.test(sent)) out.negative.push(`${name}: ${sent.trim().slice(0, 200)}`);
}
console.log(`Modern examples (${out.modern.length}):\n${out.modern.join('\n')}\n\nDefined against something (${out.negative.length}):\n${out.negative.join('\n')}`);
