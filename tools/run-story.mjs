// Plays short stories of several turns through the whole pipeline with the real model (tool picking, plan, repair, calls,
// a narrator reply, the rule check), each reply kept in the chat as SillyTavern keeps it, and lists every fault the engine
// can see, per turn and across turns: a refusal left after the repair, a turn that ran no tool, an expected tool missing,
// the clock running back or standing still after an action, each rule-check flag (an outcome no result backs, a fact a
// character could not know). Usage (in Termux, from the extension folder):
//   node tools/run-story.mjs [story numbers]          e.g. node tools/run-story.mjs 2 3   (all three when none given)
// Writes story-result-<story numbers>.txt after every turn (the faults first, then each turn with its calls, reply and planner answers),
// so a run Android stops keeps what it finished; run the remaining story numbers to go on.
import fs from 'node:fs';
const { send, MODEL, EFFORT } = await import('./nvidia.mjs');
const { ctx } = await import('./st-harness.mjs');
const Q = await import('../src/rules/question-pass.js');
const G = (await import('./nvidia.mjs')).GUIDED; Q.setGuided(!!G && G !== 'off');
const T = await import('../src/rules/rules-tools.js');
const A = await import('../src/rules/rules-audit.js');
const C = await import('../src/rules/clock.js');
const B = await import('../src/rules/body-sheet.js');

// Each story: the cast and scenario, then the player's messages in order, each with the tools a correct turn shows.
const STORIES = [
    { cast: "Mary (the player's character): a 20-year-old woman; her brother Will, 12, is at home.", scenario: 'London, Saturday 18 August 1888, a quarter past six in the evening, Whitechapel.',
        turns: [
            { player: 'I step out of my house onto the street.', want: ['Act', 'Weather'] },
            { player: 'I walk the three hundred yards to the market on Wentworth Street.', want: ['Act'] },
            { player: 'I ask the costermonger for a pound of apples and pay him.', want: ['NewCharacter', 'Price', 'Transfer'] },
            { player: 'I walk home and give Will one of the apples.', want: ['Act', 'Transfer'] },
        ] },
    { cast: "Tom (the player's character): a 25-year-old carter.", scenario: 'A coaching inn near York, 3 November 1820, evening. The taproom is half full.',
        turns: [
            { player: 'I sit down at a table near the fire.', want: ['Act'] },
            { player: 'I call to the innkeeper for a pint of ale.', want: ['Communicate'] },
            { player: 'Two men at the next table are whispering. I keep still and listen.', want: ['Listen'] },
            { player: 'I go to the innkeeper and tell him what I heard.', want: ['Act', 'Communicate'] },
        ] },
    { cast: "Mara (the player's character): a 28-year-old woman, a trained climber.", scenario: 'Lisbon, 2 May 1755, night. A garden wall three metres high, stones slick with moss; beyond it, a merchant\'s house with one lit window.',
        turns: [
            { player: 'I climb the wall.', want: ['BodyCheck'] },
            { player: 'I drop down into the garden on the other side and wait in the shadow of the hedge.', want: [] },
            { player: 'I creep across the lawn to the lit window.', want: ['Act'] },
            { player: 'I look through the window to see who is inside.', want: ['Look'] },
        ] },
];
const NARRATOR = "You narrate the world in a story with the player's character. Narrate in third person, past tense, 2–3 paragraphs of 3–5 sentences, plain register. The player's character does what the player writes.";
const REFUSED = /refused|fix and call again|State unchanged\.?\s*$|needs a calendar date|^Give /;
const pick = process.argv.slice(2).map(Number).filter(x => x >= 1 && x <= STORIES.length);
const chosen = (pick.length ? pick : STORIES.map((_, i) => i + 1)).map(i => [i - 1, STORIES[i - 1]]);
const sent = [];
const logSend = async (system, user, opts) => { const out = await send(system, user, opts); sent.push({ system: system.slice(0, 60), out }); return out; };
const faults = [], log = [];
const t0 = Date.now();
// Each run writes its own file, named by its stories, so running the stories one after another keeps every result.
const OUT = `story-result-${chosen.map(([i]) => i + 1).join('-')}.txt`;
const total = chosen.reduce((x, [, s]) => x + s.turns.length, 0);
const save = () => fs.writeFileSync(new URL(`../${OUT}`, import.meta.url), `${MODEL}, reasoning ${EFFORT}, ${Math.round((Date.now() - t0) / 60000)} min, ${new Date().toISOString()}\n${faults.length} fault(s) in ${log.length} of ${total} turns\n${faults.join('\n')}\n\n${log.join('\n')}\n`);
for (const [si, story] of chosen) {
    ctx.chatMetadata = {}; ctx.chat = [];
    const cast = `[CAST]\n${story.cast}\nScenario: ${story.scenario}\n[/CAST]`;
    const timeBlock = () => { const t = T.storyTime(); return t === null ? '' : `[TIME]\n${C.formatStoryTime(t)}\n[/TIME]`; };
    let lastClock = null;
    for (const [ti, turn] of story.turns.entries()) {
        sent.length = 0;
        const tag = `#${si + 1}.${ti + 1}`, f = [];
        T.onRulesGenerationStarted('normal');
        ctx.chat.push({ is_user: true, name: 'Player', mes: turn.player });
        const state = [timeBlock(), B.bodyBlock(B.trackedPeople()), T.possessionsInjection(), cast].filter(Boolean).join('\n');
        try { await Q.runQuestionPass(ctx.chat, logSend, state); } catch (e) { f.push(`question pass threw: ${e.message}`); }
        const results = Q.askedResults(), calls = Q.turnLog();
        for (const [i, r] of results.entries()) if (REFUSED.test(r.result) && !results.slice(i + 1).some(q => q.tool === r.tool && !REFUSED.test(q.result))) f.push(`refused after repair: ${r.tool}: ${r.result.slice(0, 200)}`);
        if (!results.length) f.push('no tool ran');
        // A walk timed by PassTime with walkers counts as the turn's Act.
        for (const tool of turn.want) if (!results.some(r => r.tool === tool || (tool === 'Act' && r.tool === 'PassTime' && /walked/.test(r.result)))) f.push(`missing ${tool}`);
        const now = T.storyTime();
        if (now === null) f.push('no story clock');
        else if (lastClock !== null && now < lastClock) f.push(`clock ran back: ${C.formatStoryTime(lastClock)} → ${C.formatStoryTime(now)}`);
        else if (lastClock !== null && now === lastClock && results.some(r => (r.tool === 'Act' || r.tool === 'PassTime') && !REFUSED.test(r.result))) f.push('clock stood still after an action');
        // The narrator gets what SillyTavern gives it: the brief, the story state, [KNOWS], [DECIDED], and the chat so far.
        let reply = '';
        try {
            const inj = [T.questionPassRan() ? T.RULES_BRIEF_DECIDED : T.RULES_BRIEF, timeBlock(), B.bodyBlock(B.trackedPeople()), T.possessionsInjection(), T.knowledgeInjection(), Q.decidedInjection()].filter(Boolean).join('\n\n');
            const history = ctx.chat.slice(0, -1).map(m => `${m.is_user ? 'PLAYER' : 'NARRATOR'}: ${m.mes}`).join('\n\n');
            reply = await send(`${NARRATOR}\n\n${cast}\n\n${inj}`, `${history ? `${history}\n\n` : ''}PLAYER: ${turn.player}`);
            const st = ctx.chatMetadata.rulesEngine?.state ?? {};
            const events = A.parseAudit(await send(Q.GUIDED ? A.AUDIT_GUIDED : A.AUDIT_SYSTEM, A.buildAuditPrompt(reply, results, (await import('../src/rules/knowledge.js')).knowledgeBlock(st), now === null ? '' : C.formatStoryTime(now)), Q.GUIDED ? { schema: A.auditSchema() } : {})) ?? [];
            for (const e of events) f.push(`rule check: "${e.quote.slice(0, 120)}" → ${e.tool} (${e.problem ?? 'unbacked'})`);
        } catch (e) { f.push(`narrator or check failed: ${e.message}`); }
        ctx.chat.push({ is_user: false, name: 'Narrator', mes: reply, swipe_id: 0 });
        T.onRulesMessageReceived(ctx.chat.length - 1);
        lastClock = now;
        faults.push(...f.map(x => `${tag} ${x}`));
        log.push(`=== ${tag}: ${turn.player}\nclock: ${now === null ? 'none' : C.formatStoryTime(now)}\nfaults: ${f.length ? '\n  ' + f.join('\n  ') : 'none'}\n--- calls\n${calls}\n--- reply\n${reply}\n--- planner answers\n${sent.filter(s => /prepare one turn|choose which/.test(s.system)).map(s => s.out.slice(-1200)).join('\n- - -\n')}\n`);
        save();
        console.log(`story ${si + 1} turn ${ti + 1} done (${Math.round((Date.now() - t0) / 1000)} s): ${f.length} fault(s)`);
    }
}
save();
console.log(`\n${faults.length} fault(s) in ${total} turns\n${faults.join('\n')}\n\nFull turns saved to ${OUT}`);
