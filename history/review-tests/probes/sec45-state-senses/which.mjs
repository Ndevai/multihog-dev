const { readings } = await import('/home/claude/work/src/rules/senses.js');
const { PRE_STATE } = await import('/home/claude/work/src/rules/data/verb-pre.js');
const { VERB_SENSES } = await import('/home/claude/work/src/rules/data/senses.js');
for (const v of process.argv.slice(2)) {
  const r = readings(v, process.env.OBJ.split(" "), `I ${v} ${process.env.OBJ}.`, ['the cook']) ?? [];
  console.log(v, r.map(x => `${x.cls}(${x.fit}) ${JSON.stringify(PRE_STATE[x.cls]?.one?.pre ?? [])}`).join('\n   '));
}
