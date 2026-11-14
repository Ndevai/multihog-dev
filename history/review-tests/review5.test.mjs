// The fifth review's tests (New1.pdf), transcribed; each prints REPRO or OK on stderr. Table-only claims (its 6, 9, 10) are
// probed at the end.
const { ctx } = await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
T.registerRulesTools(true);
const run = (tool, args) => T.REGISTRY.get(tool).exec(args);
const fresh = () => { ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'x' }]; };
const Q = await import('../src/rules/question-pass.js');
const F = await import('../src/rules/frame.js');
const P = await import('../src/rules/prosody.js');
const R = await import('../src/rules/router.js');
const VC = await import('../src/rules/voice-code.js');
import fs from 'node:fs';
const say = (n, bad, msg) => console.error(`F${n} ${bad ? 'REPRO' : 'OK'} ${msg}`);
const quiet = console.log; console.log = () => {};
{ // 1
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  const none = async () => '{"calls":{}}';
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  const line = async (mes, plan, choose = async () => null) => { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes }); await Q.runQuestionPass(ctx.chat, plan, '', undefined, choose); };
  const reply = mes => { ctx.chat.push({ is_user: false, name: 'Narrator', mes, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  await line('I wait 10 minutes.', none); reply('10 min.');
  await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.');
  await line('no, Will', hit); reply('Jack hits Will.');
  const wounds = who => ctx.chatMetadata.rulesEngine.state.people[who].wounds?.length ?? 0;
  const before = `Tom ${wounds('Tom')}, Will ${wounds('Will')}`;
  ctx.chat.splice(1, 2); T.syncRulesToChat();
  T.onRulesGenerationStarted('swipe');
  await Q.runQuestionPass(ctx.chat.slice(0, -1), none, '', undefined, async () => null);
  ctx.name1 = undefined;
  say(1, wounds('Tom') || !wounds('Will') || !/it meant Will/.test(Q.redoneBy() ?? ''), `swipe of a corrected turn after an earlier turn is deleted in mid-chat: before ${before}; after Tom ${wounds('Tom')}, Will ${wounds('Will')}, redone ${Q.redoneBy()}`);
}
{ // 2
  const A = await import('../src/rules/ask.js');
  const ppl = [{ name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }];
  const q = A.openQuestion('I look at Tom and Will, then I punch him.', 'Jack', ppl, () => true);
  say(2, !q || q.options.length !== 2, `"I look at Tom and Will, then I punch him." asks: ${JSON.stringify(q)}`);
  for (const t of ['I look at Tom and Will. I punch him.', 'Tom and Will stand there. I punch him.'])
    console.error(`   ${t} → ${JSON.stringify(A.openQuestion(t, 'Jack', ppl, () => true)?.options?.map(o => o.label))}; frame ${JSON.stringify(F.framedCalls(t, 'Jack', 'male').calls.map(c => [c.tool, c.args.who]))}`);
}
{ // 3
  const js = fs.readFileSync('src/index.js', 'utf8');
  const body = /function castBlock\(\) \{([\s\S]*?)\n\}/.exec(js)?.[1] ?? '';
  say(3, !/visible\(/.test(body), 'castBlock sends card fields with hidden tag characters, if any');
}
{ // 4
  const A2 = await import('../src/rules/rules-audit.js');
  const prompt = A2.buildAuditPrompt('He waits' + VC.block(['L']) + '.', [], 'Fact' + VC.block(['Q']));
  say(4, VC.hasHidden(prompt), `audit prompt keeps hidden tag characters: ${VC.hasHidden(prompt)}`);
}
{ // 3 and 4, where a request leaves: the audit prompt and a card's text as sendModel sends them
  let sent = '';
  ctx.generateRaw = async o => { sent = o.systemPrompt + o.prompt; return 'ok'; };
  const S = await import('../src/send.js'), A2 = await import('../src/rules/rules-audit.js');
  await S.sendModel('Rules', A2.buildAuditPrompt('He waits' + VC.block(['L']) + '.', [], 'Fact' + VC.block(['Q'])) + '\n[CAST]\nTom: a sailor' + VC.block(['Q']) + '\n[/CAST]');
  delete ctx.generateRaw;
  say('3b', VC.hasHidden(sent), `the audit prompt and a card as sent to the model: ${VC.hasHidden(sent) ? 'hidden tag characters' : 'none'}`);
}
{ // 5
  const { MOTION_START } = await import('../src/rules/actions.js');
  const mre = new RegExp(MOTION_START), bad = [];
  for (const t of ['Today I walk 10 m to the gate.', 'I punch Tom. I walk 10 m to the door.', '*I walk 10 m to the door.* Hello there.']) {
    const act = F.framedCalls(t, 'Mara').calls.find(c => c.tool === 'Act')?.args.action ?? '';
    console.error(`   ${t} → action "${act}"; MOTION_START ${mre.test(act)}`);
    if (!mre.test(act)) bad.push(t);
  }
  say(5, bad.length, `Act.action not starting with its motion verb: ${bad.join(' | ')}`);
}
{ // 6
  const r = R.routeTurn('Er sagte: ›Climb the wall!‹');
  say(6, !r.tools.includes('Communicate') || r.tools.includes('BodyCheck'), `routeTurn('Er sagte: ›Climb the wall!‹') → ${JSON.stringify(r.tools)}`);
  for (const t of ['›Climb the wall!‹ I shout.', 'I say «run away».', 'I whisper ‹hide›.'])
    console.error(`   ${t} → ${JSON.stringify(R.routeTurn(t).tools)}; frame ${JSON.stringify(F.framedCalls(t, 'Mara').calls.map(c => c.tool))}`);
}
{ // 7
  const cutG = P.readProsody('Er rief: ›War-‹').words.some(w => w.marks.includes('cut'));
  say(7, !cutG, `cut-off before a closing guillemet: ${cutG}`);
  for (const t of ['(wai-)', 'He said ‘Sto-’', '«Sto-»', '"Sto-"']) console.error(`   ${t} → cut ${P.readProsody(t).words.some(w => w.marks.includes('cut'))}`);
}
{ // 8
  fresh(); await run('NewCharacter', { who: 'Mara', sex: 'female', age: 30 });
  const burn = String(await run('BodyContact', { who: 'Mara', regions: ['right hand'], material: 'water', temp_c: 68, seconds: 10 }));
  const C = await import('../src/rules/constants.js');
  say(8, !/fullBurnOmega/.test(burn), `full-thickness threshold not registered: ${burn.slice(0, 200)}`);
}
{ // 9
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 's0', swipe_id: 1, extra: { rulesResult: { 0: { a: 1 }, 1: { a: 2 } }, rulesLog: { 0: 1, 1: 2 } } }];
  for (let i = 1; i <= 35; i++) ctx.chat.push({ is_user: true, mes: `m${i}` });
  T.keepResult(35);
  const keys = Object.keys(ctx.chat[0].extra.rulesResult);
  say(9, keys.join() !== '1', `old reply keeps the worlds of swipes ${keys}`);
}
{ // 1, with the correction taking effect first (the scene names Will in the last two messages, as correctionFix reads it)
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  let asks = 0;
  const hit = async () => { asks++; return JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] }); };
  const none = async () => { asks++; return '{"calls":{}}'; };
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  const line = async (mes, plan, choose = async () => null) => { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes }); await Q.runQuestionPass(ctx.chat, plan, '', undefined, choose); };
  const reply = mes => { ctx.chat.push({ is_user: false, name: 'Narrator', mes, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  const wounds = who => ctx.chatMetadata.rulesEngine.state.people[who].wounds?.length ?? 0;
  await line('I wait 10 minutes.', none); reply('10 min. Tom and Will still stand at the bar.');
  await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.');
  await line('no, Will', hit); reply('Jack hits Will.');
  const before = `Tom ${wounds('Tom')}, Will ${wounds('Will')}`;
  ctx.chat.splice(1, 2); T.syncRulesToChat(); T.onRulesGenerationStarted('swipe');
  const a0 = asks; await Q.runQuestionPass(ctx.chat.slice(0, -1), none, '', undefined, async () => null);
  ctx.name1 = undefined;
  say('1b', wounds('Tom') || !wounds('Will') || !/it meant Will/.test(Q.redoneBy() ?? ''), `the same, the correction in force first (${before}): after the swipe Tom ${wounds('Tom')}, Will ${wounds('Will')}, redone ${Q.redoneBy()}, model asked ${asks - a0} time(s) (the kept calls replayed ask none)`);
}
{ // table 1: an edited line regenerated after a later turn is deleted
  fresh(); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Start.', swipe_id: 0 }]; T.setStoryTime(600);
  const none = async () => '{"calls":{}}';
  const line = async mes => { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes }); await Q.runQuestionPass(ctx.chat, none, '', undefined, async () => null); };
  const reply = mes => { ctx.chat.push({ is_user: false, mes, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  await line('I wait 10 minutes.'); reply('ok'); await line('I wait 20 minutes.'); reply('ok');
  ctx.chat.splice(2, 3); T.syncRulesToChat();
  ctx.chat[1].mes = 'I wait 30 minutes.'; T.onRulesGenerationStarted('regenerate'); await Q.runQuestionPass(ctx.chat, none, '', undefined, async () => null);
  ctx.name1 = undefined;
  say('t1', T.storyTime() !== 630, `edited line regenerated after a later turn was deleted: ${T.storyTime()} (the edited words: 630)`);
}
{ // table 3: [DECIDED] on a correction turn and after a tool call
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' }); await Q.runQuestionPass(ctx.chat, hit, '', undefined, async (q, o) => o.find(x => /Tom/.test(x)));
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Tom.', swipe_id: 0 }); T.onRulesMessageReceived(2);
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'no, Will' }); await Q.runQuestionPass(ctx.chat, hit, '', undefined, async () => null);
  const a = Q.decidedInjection();
  ctx.chat.push({ is_user: false, is_system: true, mes: 'tool', extra: { tool_invocations: [{ name: 'PassTime', result: '5 minutes passed.' }] } });
  const b = Q.decidedInjection();
  ctx.name1 = undefined;
  const ok = x => /it meant Will/.test(x) && /BodyStrike/.test(x);
  say('t3', !ok(a) || !ok(b), `[DECIDED] on the correction turn ${ok(a) ? 'holds' : 'lacks'} the redo and the blow; after a tool call ${ok(b) ? 'holds' : 'lacks'} them`);
}
{ // table 9: the drowning band 5.5–10 min
  const BE = await import('../src/rules/body-engine.js');
  const q = 0.5, x = (0.112 - (1 - q) * 0.037) / q;
  console.error(`Ft9 (not a defect test) 5.5–10 min band: code ${BE.drownedGoodOutcome(7)}; the comment's reading (half 5.5–10, half past 10) gives ${x.toFixed(3)}; the review's (139 − 36) / (1238 − 962) = ${(103 / 276).toFixed(3)} takes the past-10 group as part of the past-5.5 one, but the pools differ (1,075 + 1,238 = 2,313 against 1,019 + 962 = 1,981; and 1,019 under 10 min < 1,075 under 5.5 min)`);
}
{ // table 10: the sound levels' arithmetic
  console.error(`Ft10 (not a defect test) vacuum cleaner 85 dB at 1.8 m → ${(85 + 20 * Math.log10(1.8)).toFixed(1)} at 1 m (comment: 90); car 67.5 at 10 m → ${(67.5 + 20 * Math.log10(10)).toFixed(1)} (comment: 87.5)`);
}
console.log = quiet;
