process.chdir('/home/claude/work');
const { ctx } = await import('/home/claude/work/tools/st-harness.mjs');
const T = await import('/home/claude/work/src/rules/rules-tools.js');
T.registerRulesTools(true);
const run = (tool, args) => T.REGISTRY.get(tool).exec(args);
ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'x' }];
let i = 0;
for (const a of [{ temp_c: -1 }, { temp_c: -1, volume_ml: 5e-10 }, { temp_c: -1, volume_ml: 1000 }, { temp_c: -1, volume_ml: 50, contents: 'touching ice, frost or snow' },
  { temp_c: -30, volume_ml: 0.001, contents: 'distilled or filtered water' }, { temp_c: -40, volume_ml: 0.001, contents: 'distilled or filtered water' }, { temp_c: -12, volume_ml: 0.05 }, { temp_c: 5, volume_ml: 50 }]) {
  ctx.chat[0].mes = `w${i++}`; console.log(JSON.stringify(a), '→', String(await run('Substance', { substance: 'water', ...a })));
}
for (const [s, t] of [['benzene', 0], ['benzene', 20], ['ethanol', -20]]) console.log(s, t, '→', String(await run('Substance', { substance: s, temp_c: t })));
console.log(String(await run('Substance', { substance: 'ethanol 40%, water 60%', temp_c: -5 })));
