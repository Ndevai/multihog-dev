// Plays first turns through the whole pipeline the way SillyTavern does, with the real model, and lists every fault the
// engine can see, so a fault is found here instead of in play: the tool picking, the plan, the repair round, the tool
// calls, the narrator's reply and the rule check. Usage (in Termux, from the extension folder):
//   node tools/run-play.mjs [scenes]          e.g. node tools/run-play.mjs 8
// Writes play-result.txt: the faults first, then each turn in full.
import fs from 'node:fs';
const { send, MODEL, EFFORT } = await import('./nvidia.mjs');
const { ctx } = await import('./st-harness.mjs');
const Q = await import('../src/rules/question-pass.js');
const T = await import('../src/rules/rules-tools.js');
const A = await import('../src/rules/rules-audit.js');
const C = await import('../src/rules/clock.js');
const B = await import('../src/rules/body-sheet.js');

// First turns like the ones played so far, each with what a correct turn must show.
const PLAY = [
    { cast: 'Mary (the player\'s character): A 20 years old woman', scenario: 'London, Saturday 18 August 1888, a quarter past six in the evening.', player: 'I step out of my house onto the streets of London', want: { clock: true, weather: true, tools: ['Act'] } },
    { cast: 'Mary (the player\'s character): A 20 years old woman', player: 'It is 19th September 1899, 2:20 pm. I step out of my house onto the streets of London', want: { clock: true, weather: true, tools: ['Act'] } },
    { cast: 'Mary (the player\'s character): A 20 years old woman', player: 'I step out of my flat onto a London street and wait at the bus stop.', want: { clock: true, weather: true, tools: ['Act'] } },
    { cast: 'Mary (the player\'s character): A 20 years old woman', time: '1867-03-24 12:36', player: 'I step out of my house onto the streets of London', want: { clock: true, weather: true, tools: ['Act'] } },
    { cast: 'Jeanne (the player\'s character): a 30-year-old laundress', scenario: 'Paris, 14 March 1850, morning, Place Maubert.', player: 'I walk across the square to the bakery and buy a loaf of bread.', want: { clock: true, weather: true, tools: ['Act', 'Price'] } },
    { cast: 'Tom (the player\'s character): a 25-year-old carter', scenario: 'A coaching inn near York, 3 November 1820, evening.', player: 'I sit down at a table and ask the innkeeper for a pint of ale.', want: { clock: true, tools: ['Act', 'NewCharacter', 'Price'] } },
    { cast: 'Mara (the player\'s character): human woman, trained climber', scenario: 'Lisbon, 2 May 1755, night. A garden wall three metres high, stones slick with moss.', player: 'I climb the wall.', want: { clock: true, tools: ['BodyCheck'] } },
    { cast: 'Mara (the player\'s character): human woman', scenario: 'Rio de Janeiro, 10 April 1822, noon, a busy street.', player: 'I shout to the guard across the street: "Where is the customs house?"', want: { clock: true, weather: true, tools: ['Communicate'] } },
];
const NARRATOR = 'You narrate the world in a story with the player\'s character. Narrate in third person, past tense, 2–3 paragraphs of 3–5 sentences, plain register. The player\'s character does only what the player writes.';
const n = Number(process.argv[2]) || PLAY.length;
const sent = [];
const logSend = async (system, user) => { const out = await send(system, user); sent.push({ system: system.slice(0, 60), user: user.slice(-1500), out }); return out; };
const faults = [], turns = [];
const t0 = Date.now();
for (const [i, sc] of PLAY.slice(0, n).entries()) {
    sent.length = 0;
    ctx.chatMetadata = {}; ctx.chat = [];
    T.onRulesGenerationStarted('normal');
    ctx.chat.push({ is_user: true, name: 'Player', mes: sc.player });
    if (sc.time) T.setStoryTime(C.parseStoryTime(sc.time));
    const cast = `[CAST]\n${sc.cast}${sc.scenario ? `\nScenario: ${sc.scenario}` : ''}\n[/CAST]`;
    const timeBlock = () => { const t = T.storyTime(); return t === null ? '' : `[TIME]\n${C.formatStoryTime(t)}\n[/TIME]`; };
    const f = [];
    try { await Q.runQuestionPass(ctx.chat, logSend, [timeBlock(), cast].filter(Boolean).join('\n')); } catch (e) { f.push(`question pass threw: ${e.message}`); }
    const results = Q.askedResults(), log = Q.turnLog();
    for (const r of results) if (/refused|fix and call again|State unchanged\.?\s*$|needs a calendar date|^Give |Unknown /.test(r.result)) f.push(`refused after repair: ${r.tool}: ${r.result.slice(0, 200)}`);
    if (!results.length) f.push('no tool ran');
    if (sc.want.clock && T.storyTime() === null) f.push('no story clock set');
    if (sc.want.weather && !results.some(r => r.tool === 'Weather' && !/needs|No weather/.test(r.result))) f.push('no Weather result');
    for (const tool of sc.want.tools ?? []) if (!results.some(r => r.tool === tool)) f.push(`missing ${tool}`);
    // The narrator, with what SillyTavern would add, then the rule check on its reply.
    let reply = '', events = [];
    try {
        const inj = [T.questionPassRan() ? T.RULES_BRIEF_DECIDED : T.RULES_BRIEF, timeBlock(), B.bodyBlock(B.trackedPeople()), Q.decidedInjection()].filter(Boolean).join('\n\n');
        reply = await send(`${NARRATOR}\n\n${cast}\n\n${inj}`, sc.player);
        const now = T.storyTime();
        events = A.parseAudit(await send(A.AUDIT_SYSTEM, A.buildAuditPrompt(reply, results, '', now === null ? '' : C.formatStoryTime(now)))) ?? [];
        for (const e of events) f.push(`rule check: "${e.quote.slice(0, 120)}" → ${e.tool} (${e.problem ?? 'unbacked'})`);
    } catch (e) { f.push(`narrator or check failed: ${e.message}`); }
    faults.push(...f.map(x => `#${i + 1} ${x}`));
    turns.push(`=== #${i + 1}: ${sc.player}\n${sc.scenario ? `scenario: ${sc.scenario}\n` : ''}${sc.time ? `time set: ${sc.time}\n` : ''}clock after: ${T.storyTime() === null ? 'none' : C.formatStoryTime(T.storyTime())}\nfaults: ${f.length ? '\n  ' + f.join('\n  ') : 'none'}\n--- calls\n${log}\n--- reply\n${reply}\n--- planner answers\n${sent.filter(s => /prepare one turn|choose which/.test(s.system)).map(s => s.out.slice(-1200)).join('\n- - -\n')}\n`);
    console.log(`turn ${i + 1}/${n} done (${Math.round((Date.now() - t0) / 1000)} s): ${f.length} fault(s)`);
}
const text = `${MODEL}, reasoning ${EFFORT}, ${Math.round((Date.now() - t0) / 60000)} min, ${new Date().toISOString()}\n${faults.length} fault(s) in ${n} turns\n${faults.join('\n')}\n\n${turns.join('\n')}`;
fs.writeFileSync(new URL('../play-result.txt', import.meta.url), text + '\n');
console.log(`\n${faults.length} fault(s) in ${n} turns\n${faults.join('\n')}\n\nFull turns saved to play-result.txt`);
