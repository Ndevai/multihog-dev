// Plays short stories of several turns through the whole pipeline with the real model (tool picking, plan, repair, calls,
// a narrator reply, the rule check), each reply kept in the chat as SillyTavern keeps it, and lists every fault the engine
// can see, per turn and across turns: a refusal left after the repair, a turn that ran no tool, an expected tool missing,
// the clock running back or standing still after an action, each rule-check flag (an outcome no result backs, a fact a
// character could not know). Usage (in Termux, from the extension folder):
//   node tools/run-story.mjs [story numbers]          e.g. node tools/run-story.mjs 2 3   (all three when none given)
// Writes story-result-<story numbers>.txt after every turn (the faults first, then each turn with its calls, reply and planner answers),
// so a run Android stops keeps what it finished; run the remaining story numbers to go on.
import fs from 'node:fs';
const { send, MODEL, EFFORT, cacheCount } = await import('./nvidia.mjs');
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
    // Stories 4–9 use the tools stories 1–3 leave untouched: blows, a chase, persuasion, eating and drinking, sleep, sickness,
    // a long walk, a wound treated, a choice by another person.
    { cast: "Jack (the player's character): a 30-year-old dock labourer.", scenario: 'Liverpool docks, 14 March 1866, late afternoon, drizzle. A sailor has been shoving Jack at the warehouse door.',
        turns: [
            { player: 'I punch the sailor in the jaw.', want: ['BodyStrike'] },
            { player: 'He runs off along the quay. I chase him.', want: ['Chase'] },
            { player: 'I shout to the watchman to stop him.', want: ['Communicate'] },
            { player: 'I bandage my bleeding knuckles with my handkerchief.', want: ['BodyTreat'] },
        ] },
    { cast: "Clara (the player's character): a 35-year-old seamstress.", scenario: 'Paris, rue Saint-Denis, 9 June 1832, noon. Her landlord, Monsieur Dufour, wants the rent she owes.',
        turns: [
            { player: 'I beg Monsieur Dufour to give me one more week to pay.', want: ['Communicate', 'SocialResponse'] },
            { player: 'I offer him my silver thimble as a pledge.', want: ['SocialResponse', 'Transfer'] },
            { player: 'I go to the baker on the corner and buy a loaf of bread.', want: ['Act', 'Price', 'Transfer'] },
            { player: 'I eat half the loaf and drink a cup of water.', want: ['BodyIntake'] },
        ] },
    { cast: "Hans (the player's character): a 22-year-old journeyman carpenter on his travels.", scenario: 'On the road from Leipzig toward Halle, 21 October 1845, morning, cold and clear.',
        turns: [
            { player: 'I walk the twelve miles to the next village.', want: ['Act'] },
            { player: 'I ask the innkeeper there for a bed for the night.', want: ['Communicate', 'Price'] },
            { player: 'I sleep for eight hours.', want: ['PassTime'] },
            { player: 'In the morning I wake with a fever and a cough.', want: ['Claim'] },
        ] },
    { cast: "Ines (the player's character): a 19-year-old maid in a merchant's house; Senhor Abreu, the merchant, is in his study.", scenario: 'Lisbon, Rua dos Fanqueiros, 30 October 1755, evening. Ines has broken a porcelain dish.',
        turns: [
            { player: 'I pick up the pieces of the dish.', want: ['Act'] },
            { player: 'I go to the study and tell Senhor Abreu what happened.', want: ['Act', 'Communicate'] },
            { player: 'I promise to pay for it from my wages.', want: ['Communicate', 'SocialResponse'] },
            { player: 'I wait in the kitchen for an hour.', want: ['PassTime'] },
        ] },
    { cast: "Pyotr (the player's character): a 40-year-old coachman.", scenario: 'Saint Petersburg, Nevsky Prospect, 2 February 1861, night, deep snow.',
        turns: [
            { player: 'I climb down from the box of the sledge.', want: ['Act'] },
            { player: 'I slip on the ice and fall.', want: ['BodyFall'] },
            { player: 'I get up and look for my lost glove in the snow.', want: ['Act', 'Look'] },
            { player: 'I drink a glass of vodka at the tavern to warm up.', want: ['Act', 'BodyIntake'] },
        ] },
    { cast: "Ellen (the player's character): a 27-year-old nurse.", scenario: 'Boston, Massachusetts General Hospital, 16 October 1846, morning. A patient, Mr. Abbott, is to have a tumour cut from his neck.',
        turns: [
            { player: 'I hold Mr. Abbott\'s hand and tell him not to be afraid.', want: ['Communicate'] },
            { player: 'I watch the surgeon begin.', want: ['Look'] },
            { player: 'I listen to whether Mr. Abbott cries out.', want: ['Listen'] },
            { player: 'I walk to the window and open it for air.', want: ['Act'] },
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
const save = () => fs.writeFileSync(new URL(`../${OUT}`, import.meta.url), `${MODEL}, reasoning ${EFFORT}, ${Math.round((Date.now() - t0) / 60000)} min, ${new Date().toISOString()}, ${cacheCount.asked} calls asked, ${cacheCount.hit} replayed\n${faults.length} fault(s) in ${log.length} of ${total} turns\n${faults.join('\n')}\n\n${log.join('\n')}\n`);
let stopped = false;
for (const [si, story] of chosen) {
    if (stopped) break;
    ctx.chatMetadata = {}; ctx.chat = [];
    const cast = `[CAST]\n${story.cast}\nScenario: ${story.scenario}\n[/CAST]`;
    const timeBlock = () => { const t = T.storyTime(); return t === null ? '' : `[TIME]\n${C.formatStoryTime(t)}\n[/TIME]`; };
    let lastClock = null;
    const people = new Set();
    Q.setOpen([]);
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
        // A person drawn for a phrase that names an event, or drawn against what the cast states about them.
        const drawnArgs = Q.askedArgs();
        for (const [i, r] of results.entries()) {
            if (r.tool !== 'NewCharacter' || /^Already decided/.test(r.result)) continue;
            const who = String(drawnArgs[i]?.who ?? r.result.split(':')[0]), age = Number(r.result.match(/a (\d+)-year-old/)?.[1]), stated = Q.castPerson(who, cast);
            // An event reads as a verb in -ing with what it does ("getting up and going to the bar"); "the serving girl" is a person.
            if (/\b\w+ing (?:up|down|out|in|to|the|a|an|at|from|toward|towards|and|his|her|their)\b/.test(who.toLowerCase()) || who.split(/\s+/).length > 8) f.push(`person drawn for a phrase: "${who}"`);
            if (/\b(?:men|women|children|people|boys|girls)\b/i.test(who) && !/refused|several people|each gets/.test(r.result)) f.push(`a group drawn as one person: "${who}"`);
            if (people.has(who) && !/as drawn when first met/.test(r.result)) f.push(`${who} drawn again: ${r.result.slice(0, 80)}`);
            people.add(who);
            if (stated.age != null && age !== stated.age) f.push(`${who} drawn at ${age}; the cast says ${stated.age}`);
        }
        // A walk timed by PassTime with walkers counts as the turn's Act.
        // A walk timed by PassTime counts as Act; words the player's character hears through Communicate count as Listen.
        const player = story.cast.match(/^(\w+) \(the player's character\)/)?.[1];
        for (const tool of turn.want) if (!results.some((r, i) => r.tool === tool || (tool === 'Act' && r.tool === 'PassTime' && /walked/.test(r.result)) || (tool === 'Listen' && r.tool === 'Communicate' && Q.askedArgs()[i]?.listener === player && /whisper/i.test(String(Q.askedArgs()[i]?.speaker ?? '') + String(Q.askedArgs()[i]?.effort ?? ''))))) f.push(`missing ${tool}`);
        const now = T.storyTime();
        if (now === null) f.push('no story clock');
        else if (lastClock !== null && now < lastClock) f.push(`clock ran back: ${C.formatStoryTime(lastClock)} → ${C.formatStoryTime(now)}`);
        else if (lastClock !== null && now === lastClock && results.some(r => (r.tool === 'Act' || r.tool === 'PassTime') && !REFUSED.test(r.result))) f.push('clock stood still after an action');
        // The narrator gets what SillyTavern gives it: the brief, the story state, [KNOWS], [DECIDED], and the chat so far.
        const N = await import('../src/rules/narration.js'), Kn = await import('../src/rules/knowledge.js'), F = await import('../src/rules/audit-flags.js');
        const narrate = async (note = '') => {
            const inj = [T.questionPassRan() ? T.RULES_BRIEF_DECIDED : T.RULES_BRIEF, timeBlock(), B.bodyBlock(B.trackedPeople()), T.possessionsInjection(), T.knowledgeInjection(), Q.decidedInjection(), note].filter(Boolean).join('\n\n');
            const history = ctx.chat.slice(0, -1).map(m => `${m.is_user ? 'PLAYER' : 'NARRATOR'}: ${m.mes}`).join('\n\n');
            const raw = await send(`${NARRATOR}\n\n${cast}\n\n${inj}${Q.GUIDED ? `\n\n${N.NARRATION_RULE}` : ''}`, `${history ? `${history}\n\n` : ''}PLAYER: ${turn.player}`, Q.GUIDED ? { schema: N.narrationSchema(Q.decidedResults().length) } : {});
            const nar = N.readNarration(raw), text = nar ? N.proseOf(nar) : raw;
            const st = ctx.chatMetadata.rulesEngine?.state ?? {}, checked = nar ? N.checkedText(nar) : text, t = T.storyTime();
            const events = !checked.trim() ? [] : A.parseAudit(await send(Q.GUIDED ? A.AUDIT_GUIDED : A.AUDIT_SYSTEM, A.buildAuditPrompt(checked, Q.askedResults(), Kn.knowledgeBlock(st), t === null ? '' : C.formatStoryTime(t)), Q.GUIDED ? { schema: A.auditSchema() } : {})) ?? [];
            return { text, nar, events };
        };
        let reply = '', openNote = '', draftNote = '';
        try {
            let r = await narrate();
            // A flagged draft is rewritten once, as SillyTavern does (rules-audit.ts: the flags, the turn's calls rerun from its
            // snapshot, the flagged tools asked, the correction note): the reply counted is the one the player is shown.
            if (r.events.length) {
                draftNote = `--- draft flagged (rewritten)\n${r.events.map(e => `  "${e.quote.slice(0, 120)}" → ${e.tool} (${e.problem ?? 'unbacked'})`).join('\n')}\n--- draft\n${r.text}\n`;
                ctx.chat.push({ is_user: false, name: 'Narrator', mes: r.text, swipe_id: 0 });
                T.onRulesGenerationStarted('swipe');
                ctx.chat.pop();
                F.setFlags(r.events.filter(e => e.tool !== 'KNOWS'));
                try { await Q.runQuestionPass(ctx.chat, logSend, state); } catch (e) { f.push(`rewrite question pass threw: ${e.message}`); }
                r = await narrate(A.correctionNote(r.events, true));
            }
            reply = r.text;
            Q.setOpen(r.nar?.open ?? []);
            if (r.nar) openNote = r.nar.open?.length ? `open: ${r.nar.open.join(' | ')}` : '';
            for (const e of r.events) f.push(`rule check: "${e.quote.slice(0, 120)}" → ${e.tool} (${e.problem ?? 'unbacked'})`);
        } catch (e) { f.push(`narrator or check failed: ${e.message}`); }
        ctx.chat.push({ is_user: false, name: 'Narrator', mes: reply, swipe_id: 0 });
        T.onRulesMessageReceived(ctx.chat.length - 1);
        lastClock = now;
        faults.push(...f.map(x => `${tag} ${x}`));
        log.push(`=== ${tag}: ${turn.player}\nclock: ${now === null ? 'none' : C.formatStoryTime(now)}\nfaults: ${f.length ? '\n  ' + f.join('\n  ') : 'none'}\n--- calls\n${Q.turnLog()}\n${draftNote}--- reply\n${reply}\n${openNote ? `--- ${openNote}\n` : ''}--- planner answers\n${sent.filter(s => /prepare one turn|choose which/.test(s.system)).map(s => s.out.slice(-1200)).join('\n- - -\n')}\n`);
        save();
        // The model stopped answering (rate limit, outage): the rest of the run would test nothing.
        if (f.some(x => /did not answer/.test(x))) { console.log(`\nStopped: ${f.find(x => /did not answer/.test(x))}`); stopped = true; break; }
        console.log(`story ${si + 1} turn ${ti + 1} done (${Math.round((Date.now() - t0) / 1000)} s): ${f.length} fault(s)`);
    }
}
save();
console.log(`\n${faults.length} fault(s) in ${total} turns\n${faults.join('\n')}\n\nFull turns saved to ${OUT}`);
