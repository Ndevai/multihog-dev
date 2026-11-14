// Area H: chat and metadata size over 120 scripted turns. Usage: node chat-growth.mjs <repo root>
const REPO = process.argv[2]; process.chdir(REPO);
const { ctx } = await import(`${REPO}/tools/st-harness.mjs`);
const T = await import(`${REPO}/src/rules/rules-tools.js`), Q = await import(`${REPO}/src/rules/question-pass.js`), C = await import(`${REPO}/src/rules/clock.js`);
console.log = () => {}; console.debug = () => {}; console.warn = () => {};
globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => null, text: async () => '' });
ctx.chatMetadata = {}; ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'The tavern is busy.', swipe_id: 0 }];
const run = (t, a) => T.REGISTRY.get(t).exec(a);
for (const who of ['Mara', 'Tom', 'Will', 'Ann']) await run('NewCharacter', { who, sex: who === 'Ann' || who === 'Mara' ? 'female' : 'male', age: 30 });
T.setStoryTime(C.parseStoryTime('1850-03-14 18:00'));
const plans = [
  { calls: [{ tool: 'PassTime', args: { minutes: 10 } }] },
  { calls: [{ tool: 'Communicate', args: { speaker: 'Mara', listener: 'Tom', means: 'speech', effort: 'normal', distance_m: 2, message: 'Where were you last night?' } }] },
  { calls: [{ tool: 'Look', args: { viewer: 'Mara', kind: 'a person', distance_m: 10, target_who: 'Will', light: 'living room' } }] },
  { calls: [{ tool: 'BodyStrike', args: { attacker: 'Tom', who: 'Will', attack: 'punch' } }] },
];
const sizes = [];
for (let turn = 1; turn <= 120; turn++) {
  const t0 = performance.now();
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: `Line ${turn}.` });
  const plan = plans[turn % plans.length];
  await Q.runQuestionPass(ctx.chat, async () => JSON.stringify(plan), '', undefined, async () => null);
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: `Reply ${turn}.`, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1);
  const ms = performance.now() - t0;
  if ([1, 10, 30, 60, 120].includes(turn)) sizes.push(`turn ${turn}: chat ${(JSON.stringify(ctx.chat).length / 1e6).toFixed(2)} MB, metadata ${(JSON.stringify(ctx.chatMetadata).length / 1e6).toFixed(2)} MB, one state ${(JSON.stringify(ctx.chatMetadata.rulesEngine.state).length / 1e3).toFixed(0)} kB, history ${ctx.chatMetadata.rulesEngine.history.log.length} entries, snapshots ${Object.keys(ctx.chatMetadata.rulesEngine.snapshots).length}, turn ${ms.toFixed(0)} ms`);
}
process.stderr.write(sizes.join('\n') + '\n');
