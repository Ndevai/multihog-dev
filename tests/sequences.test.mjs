// Random event sequences against a reference (the state over time, all at once). Each sequence plays a chat through the
// events SillyTavern fires, in its own order (public/script.js, release branch of 2026-09-14):
// - Send: GENERATION_STARTED('normal') fires before the line joins the chat (Generate, 4299; the line is added at 4453), then
//   the interceptor runs on a copy of the chat (4496–4564; the extension notates it and runs the question pass).
// - Send with the box empty after a reply failed or was stopped: no line is added, a 'normal' generation starts.
// - /send then /trigger: the line joins first, then the 'normal' generation starts.
// - Stop: the pass has run, no reply comes.
// - The narrator's tool calls (function calling on): the call runs, its message is saved (is_system, tool_invocations), and
//   a new 'normal' generation starts for the reply (5434–5435); the interceptor's chat then ends at the tool message.
// - Regenerate a line with no reply; swipe the last reply (the interceptor's chat leaves the reply out, 4497); swipe back
//   to an earlier swipe (MESSAGE_SWIPED, no generation); delete the last messages (MESSAGE_DELETED); edit the last line
//   while no reply follows it.
// The reference is the visible chat, read by one rule: the world is the start, plus each player line in the chat the
// outcome its last question pass decided, plus each narrator tool call whose message is in the chat. Lines are "I wait N
// minutes." and the narrator's calls are PassTime or RecordFact (a fact no other shares a word with), so the clock is the
// sum and the facts are the tool messages' facts, exact and free of chance; every swipe of a reply follows the same line,
// so all swipes leave the same world. After every step the clock and the facts must equal the reference's, and the record
// of changes must rebuild the state (world-log.ts verify; a fact is its own path, so a change lost from the record shows).
// A failing sequence is cut to the fewest steps that still fail, and printed.
// Usage: node tests/sequences.test.mjs [sequences] [steps] [seed]   (default 300 sequences of 24 steps, seed 1)
const { ctx } = await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
const Q = await import('../src/rules/question-pass.js');
const VC = await import('../src/rules/voice-code.js');
const W = await import('../src/rules/world-log.js');
T.registerRulesTools(true);
const [N = 300, STEPS = 24, SEED = 1] = process.argv.slice(2).map(Number);
const START = 600;
const minutesOf = text => Number(/(\d+) minutes/.exec(text)?.[1] ?? 0);
// Fact k's j-th word: letters only, shared with no other fact (RecordFact takes facts with most words in common as one).
const word = (k, j) => { let w = ''; for (let x = k * 3 + j + 26; x > 0; x = Math.floor(x / 26)) w = String.fromCharCode(97 + (x % 26)) + w; return `${w}x`; };
function rngFrom(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Plays `steps` (each { kind, ...params }) from a fresh chat; returns null, or where and how the world left the reference. */
async function play(steps, tools) {
    ctx.chatMetadata = {}; ctx.name1 = 'Mara'; ctx.isToolCallingSupported = () => tools;
    ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara waits in the inn.', swipes: ['Mara waits in the inn.'], swipe_id: 0 }];
    T.setStoryTime(START);
    const decided = new Map(); // player line → minutes its last pass decided
    let replies = 0;
    const lastUser = () => [...ctx.chat].reverse().find(m => m.is_user);
    const expected = () => START + ctx.chat.reduce((a, m) => a + (m.is_user ? decided.get(m) ?? 0 : m.minutes ?? 0), 0);
    const facts = () => ctx.chat.filter(m => m.fact).map(m => m.fact).sort().join(' | ');
    // The interceptor (src/index.ts): SillyTavern's copy of the chat, notated, and the question pass when it ends at a line.
    const intercept = async type => {
        const core = ctx.chat.filter(x => !x.is_system || (tools && Array.isArray(x.extra?.tool_invocations))).map(m => ({ ...m }));
        if (type === 'swipe') core.pop();
        VC.notateChat(core);
        const runs = !!core.at(-1)?.is_user;
        await Q.runQuestionPass(core, async () => '{"calls":{}}', '', undefined, async () => null);
        if (runs) { const line = lastUser(); decided.set(line, minutesOf(line.mes)); }
    };
    const reply = () => { const mes = `Reply ${++replies}.`; ctx.chat.push({ is_user: false, name: 'N', mes, swipes: [mes], swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
    // After a pass: the narrator's tool calls (function calling on), then the reply or a stop.
    const answer = async s => {
        for (const t of s.tools ?? []) {
            if (!tools) break;
            const msg = { is_user: false, is_system: true, name: 'System', extra: { tool_invocations: [{ name: t > 0 ? 'PassTime' : 'RecordFact', result: 'ok' }] } };
            if (t > 0) { await T.REGISTRY.get('PassTime').exec({ minutes: t }); Object.assign(msg, { mes: `PassTime ${t}`, minutes: t }); }
            else { const fact = `${word(-t, 0)} ${word(-t, 1)} ${word(-t, 2)}.`; await T.REGISTRY.get('RecordFact').exec({ fact, common_knowledge: true }); Object.assign(msg, { mes: `RecordFact ${fact}`, fact }); }
            ctx.chat.push(msg);
            T.onRulesGenerationStarted('normal'); await intercept('normal');
        }
        if (!s.stop) reply();
    };
    for (let i = 0; i < steps.length; i++) {
        const s = steps[i], last = ctx.chat.at(-1);
        switch (s.kind) {
            case 'send': T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: `I wait ${s.m} minutes.` }); await intercept('normal'); await answer(s); break;
            case 'slash': ctx.chat.push({ is_user: true, mes: `I wait ${s.m} minutes.` }); T.onRulesGenerationStarted('normal'); await intercept('normal'); await answer(s); break;
            case 'empty': if (!last?.is_user) continue; T.onRulesGenerationStarted('normal'); await intercept('normal'); await answer(s); break;
            case 'regenerate': if (!last?.is_user) continue; T.onRulesGenerationStarted('regenerate'); await intercept('regenerate'); await answer({ ...s, tools: [] }); break;
            case 'swipe': {
                if (!last || last.is_user || last.is_system || ctx.chat.length < 2) continue;
                T.onRulesGenerationStarted('swipe'); await intercept('swipe');
                const mes = `Reply ${++replies}.`; last.swipes.push(mes); last.swipe_id = last.swipes.length - 1; last.mes = mes;
                T.onRulesMessageReceived(ctx.chat.length - 1); break;
            }
            case 'back': {
                if (!last || last.is_user || last.is_system || (last.swipes?.length ?? 0) < 2) continue;
                last.swipe_id = s.to % (last.swipes.length - 1); last.mes = last.swipes[last.swipe_id]; T.onRulesSwiped(ctx.chat.length - 1); break;
            }
            case 'delete': { const k = Math.min(s.k, ctx.chat.length - 1); if (!k) continue; ctx.chat.splice(ctx.chat.length - k, k); T.syncRulesToChat(); break; }
            case 'edit': if (!last?.is_user) continue; last.mes = `I wait ${s.m} minutes.`; break;
        }
        const st = ctx.chatMetadata.rulesEngine, got = T.storyTime(), want = expected();
        const record = st?.history ? W.verify(st.history, st.state) : null;
        const gotFacts = (st?.state.facts ?? []).map(f => f.text).sort().join(' | '), wantFacts = facts();
        if (got !== want || record || gotFacts !== wantFacts) return { at: i, got, want, record, ...gotFacts !== wantFacts ? { facts: [gotFacts, wantFacts] } : {} };
    }
    return null;
}
const describe = s => s.kind === 'send' || s.kind === 'slash' || s.kind === 'empty' ? `${s.kind}${s.m != null ? ` ${s.m}` : ''}${s.tools?.length ? ` tools ${s.tools.map(t => t > 0 ? t : `fact`).join('+')}` : ''}${s.stop ? ' stop' : ''}`
    : s.kind === 'regenerate' ? `regenerate${s.stop ? ' stop' : ''}` : s.kind === 'back' ? `back ${s.to}` : s.kind === 'delete' ? `delete ${s.k}` : s.kind === 'edit' ? `edit ${s.m}` : s.kind;
function steps(rand, n) {
    const pick = xs => xs[Math.floor(rand() * xs.length)], m = () => 1 + Math.floor(rand() * 40), out = [];
    // A tool call: PassTime of 1–9 minutes, or (as a negative number, its id) a fact recorded.
    let factId = 0;
    const after = () => ({ tools: rand() < 0.3 ? Array.from({ length: 1 + Math.floor(rand() * 2) }, () => rand() < 0.5 ? 1 + Math.floor(rand() * 9) : -(++factId)) : [], stop: rand() < 0.25 });
    for (let i = 0; i < n; i++) {
        const kind = pick(['send', 'send', 'send', 'slash', 'empty', 'regenerate', 'swipe', 'swipe', 'back', 'delete', 'edit']);
        out.push(kind === 'send' || kind === 'slash' ? { kind, m: m(), ...after() } : kind === 'empty' || kind === 'regenerate' ? { kind, ...after() }
            : kind === 'back' ? { kind, to: Math.floor(rand() * 4) } : kind === 'delete' ? { kind, k: 1 + Math.floor(rand() * 3) } : kind === 'edit' ? { kind, m: m() } : { kind });
    }
    return out;
}
/** The fewest steps that still fail: steps taken out one at a time while the sequence keeps failing. */
async function shrink(seq, tools) {
    let cur = seq;
    for (let changed = true; changed;) {
        changed = false;
        for (let i = cur.length - 1; i >= 0; i--) {
            const cut = [...cur.slice(0, i), ...cur.slice(i + 1)];
            if (await play(cut, tools)) { cur = cut; changed = true; }
        }
    }
    return cur;
}

const log = console.log, warn = console.warn; console.log = () => {}; console.warn = () => {}; console.debug = () => {};
let miss = 0, ran = 0;
const found = new Map();
for (let k = 0; k < N; k++) {
    const rand = rngFrom(SEED * 100003 + k), tools = k % 2 === 0, seq = steps(rand, STEPS);
    ran++;
    const r = await play(seq, tools);
    if (!r) continue;
    const small = await shrink(seq.slice(0, r.at + 1), tools), again = await play(small, tools);
    const key = `${tools ? 'on' : 'off'}: ${small.map(describe).join(' → ')}`;
    if (!found.has(key)) found.set(key, again);
}
console.log = log; console.warn = warn;
for (const [key, r] of found) { miss++; log(`MISS sequence (function calling ${key}): clock ${r.got} (reference ${r.want})${r.facts ? `; facts "${r.facts[0]}" (reference "${r.facts[1]}")` : ''}${r.record ? `; the record does not rebuild the state at ${r.record}` : ''}`); }
log(`sequences: ${ran} run, ${found.size} distinct failing sequence(s)`);
process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
