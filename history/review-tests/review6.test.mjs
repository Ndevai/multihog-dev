// The sixth review's tests (ss.pdf), transcribed as written; each prints REPRO (the defect shows) or OK on stderr.
// P2b is its finding 2 in the case that reproduces; P9 is its own source check. The review here adds its checks to tests/*.test.mjs.
// Usage, from the repository's root: npx tsc -p . && node review-tests/review6.test.mjs 2>&1 >/dev/null
const { ctx } = await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
T.registerRulesTools(true);
const run = (tool, args) => T.REGISTRY.get(tool).exec(args);
const fresh = () => { ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'x' }]; };
const Q = await import('../src/rules/question-pass.js');
const F = await import('../src/rules/frame.js');
const P = await import('../src/rules/prosody.js');
const VC = await import('../src/rules/voice-code.js');
const U = await import('../src/ui.js');
import fs from 'node:fs';
const say = (n, bad, msg) => console.error(`P${n} ${bad ? 'REPRO' : 'OK'} ${msg}`);
const quiet = console.log; console.log = () => {};
{ // 1
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' });
  await Q.runQuestionPass(ctx.chat, hit, '', undefined, async (q, o) => o.find(x => /Tom/.test(x)));
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Tom.', swipe_id: 0 });
  T.onRulesMessageReceived(2);
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I wait 5 minutes.' });
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.chat[3].mes = 'no, Will';
  T.onRulesGenerationStarted('normal'); await Q.runQuestionPass(ctx.chat, hit, '', undefined, async () => null);
  const w = who => ctx.chatMetadata.rulesEngine.state.people[who].wounds?.length ?? 0;
  const afterCorr = `Tom ${w('Tom')}, Will ${w('Will')}, redone ${Q.redoneBy()}`;
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Will.', swipe_id: 0 });
  T.onRulesMessageReceived(4);
  T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), hit, '', undefined, async () => null);
  ctx.name1 = undefined;
  say(1, w('Tom') !== 0, `line edited into a correction, then swiped: after the correction ${afterCorr}; after the swipe Tom ${w('Tom')}, Will ${w('Will')}`);
}
{ // 2
  const A = await import('../src/rules/ask.js');
  const quoted = ['›No, Will!‹', '«No, Will»', '„No, Will!“'].map(l => [l, A.correctionOf(l)]);
  say(2, quoted.some(([, c]) => c !== null), `correctionOf on quoted speech: ${JSON.stringify(quoted)}`);
}
{ // 2b: a line that opens like a correction and quotes in guillemets
  const A = await import('../src/rules/ask.js');
  const got = ['No, Will, ›run!‹', 'No, Will «stop»'].map(l => [l, A.correctionOf(l)]);
  say('2b', got.some(([, c]) => c !== null), `correctionOf with guillemet speech after "No, Will": ${JSON.stringify(got)}`);
}
{ // 3
  fresh(); await run('NewCharacter', { who: 'Wit', sex: 'female', age: 30 }); await run('NewCharacter', { who: 'Rob', sex: 'male', age: 30 });
  const out = String(await run('Look', { viewer: 'Wit', kind: 'a person', distance_m: 5000, light: 'dim street or public lighting', target_who: 'Rob' }));
  const seen = ctx.chatMetadata.rulesEngine.state.sightings?.Wit?.Rob;
  say(3, !!seen, `a missed Look records a sighting: ${JSON.stringify(seen)} ← ${out.slice(0, 100)}`);
}
{ // 4
  const c = F.framedCalls('I shout to Tom with all my might.', 'Mara').calls.find(x => x.tool === 'Communicate');
  say(4, !c || c.args.message !== undefined, `"with all my might" as a message: ${JSON.stringify(c)}`);
}
{ // 5
  const got = F.framedCalls('*I punch **Tom**.*', 'Mara').calls.find(c => c.tool === 'BodyStrike')?.args.who;
  say(5, got !== 'Tom', `nested emphasis *I punch **Tom**.*: who=${got}; unEmphasis → ${JSON.stringify(F.unEmphasis('*I punch **Tom**.*'))}`);
}
{ // 6
  const p = P.readProsody('John Smith (35) checks items (1) and (2).');
  say(6, p.marked || p.plain !== 'John Smith (35) checks items (1) and (2).', `parenthesized integers: ${JSON.stringify({ marked: p.marked, plain: p.plain })}`);
}
{ // 7
  const I = await import('../src/rules/intent.js');
  const people = [{ name: 'Mara', sex: 'female' }, { name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }, { name: 'Ann', sex: 'female' }];
  const m = I.understand('I nod to Ann and hit him back.', { player: 'Mara', people, narration: ['Will laughs. Tom shoves you hard.'], earlier: [], lastCalls: [] });
  say(7, m.text !== 'I nod to Ann and hit Tom back.', `a woman named before "him back": ${m.text}; changes ${JSON.stringify(m.changes)}; open ${JSON.stringify(m.open)}`);
}
{ // 8
  const r = VC.markWords('«Stop»', 1, 5, 'cut'), t = '«Stop»'.slice(0, r.from) + r.insert + '«Stop»'.slice(r.to);
  const parts = U.mirrorParts(t);
  say(8, VC.toNotation(t) !== '«Stop-»' || parts[0].text !== '«' || !!parts[0].family, `guillemets: notation ${VC.toNotation(t)}; mirror ${JSON.stringify(parts)}`);
}
{ // 9
  const js = fs.readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  say(9, !/\baddEventListener\('pointerdown', e => e\.preventDefault\(\)\)/.test(js), 'pointerdown listener absent (a source check, not a behaviour check)');
}
{ // 10
  fresh(); await run('NewCharacter', { who: 'Kit', sex: 'male', age: 30 });
  await run('BodyWound', { who: 'Kit', part: 'upper body', type: 'blunt' });
  Object.assign(ctx.chatMetadata.rulesEngine.state.people.Kit, { unconscious: 'choked', koLeft: 0.3 });
  const out = String(await run('PassTime', { minutes: 5 }));
  say(10, !/after 0 min 18 s of 5 minutes: Kit comes to/.test(out), `waking from a choke: ${out.slice(0, 200)}`);
}
{ // 11
  const Ac = await import('../src/rules/acoustics.js');
  let r; try { r = Ac.reach({ spl: 230, distance: 1 }); } catch (e) { r = { error: String(e) }; }
  say(11, !(r?.sii >= 0), `reach at 230 dB: ${JSON.stringify(r)?.slice(0, 200)}`);
}
{ // 12
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 's0', swipe_id: 0, extra: { rulesResult: { 0: { people: { Tom: { pulse: { track: [1, 2, 3], at: 0 } } } } }, rulesLog: { 0: 1 } } }];
  for (let i = 1; i <= 35; i++) ctx.chat.push({ is_user: true, mes: `m${i}` });
  T.keepResult(35);
  say(12, ctx.chat[0].extra.rulesResult[0].people.Tom.pulse !== undefined, 'old reply snapshots keep transient pulse tracks');
}
console.log = quiet;
