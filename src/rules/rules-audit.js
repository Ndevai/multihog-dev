// After each reply, a separate model pass lists rule-governed events that no tool result backs.
// Code then redoes the reply once with the missing calls named; a second failure is shown to the user.
import { turnKey } from './turn.js';
import { knowledgeBlock } from './knowledge.js';
import { askedResults } from './question-pass.js';
const MAX_RETRIES = 1;
export const AUDIT_SYSTEM = `You check a roleplay narrator's reply against the rule-engine results of the same turn.
List each event in the reply that the engine governs and that no engine result backs, or that contradicts an engine result.
Engine-governed events: a player's claim about their own character (what they are, an item they have) taking effect; an item changing hands, found, lost or used up; a blow, cut, stab, bite or burn landing on someone; any injury, bleeding, fracture or death; a fall; a check succeeding or failing; an attack landing or missing; story time passing (minutes, hours, days); a spell being cast; a treatment working; skin burned by touching something hot. Where distance, noise, darkness, injury, a possible lie or a stranger's free choice leaves it in doubt: a sound heard or missed; someone or something spotted or recognized at a distance; a message understood or not; a statement believed or seen through as a lie; a bystander stepping in or not; an order to hurt someone obeyed or refused; a stranger agreeing to or declining a small request; a grip held or lost; a pursuer catching someone or not; romantic interest after a first meeting; a price, wage or bill stated for a European city between 1500 and 1913; when a disease's symptoms start or how many fall ill in an outbreak; the day's weather; a character's pick among several real options; an attack on a defended position succeeding or failing.
Also list each place where a character states or acts on a fact that the KNOWS list gives only to other characters, with tool KNOWS and problem unknown_to_them; a character also knows what they perceive in the scene now and what they learn in this reply.
An event is backed when an engine result of the matching tool describes it. Intentions, threats, dialogue and misses described as misses are not events.
First write EVIDENCE: one line per engine-governed event in the reply, giving its words and the engine result that backs or contradicts it. Then write the JSON {"events":[{"quote":"exact words from the reply","tool":"Transfer|Claim|BodyCheck|BodyStrike|BodyWound|BodyFall|PassTime|CastSpell|BodyTreat|RollTheDice|BodyContact|Listen|Look|Communicate|SocialResponse|HoldOn|Chase|Price|Disease|Weather|Choose|Battle|KNOWS","problem":"unbacked|contradicts|unknown_to_them"}]}. An empty list means every event is backed.`;
export function buildAuditPrompt(reply, results, knows = '') {
    const lines = results.length
        ? results.map((r, i) => `${i + 1}. ${r.tool}: ${r.result}`).join('\n')
        : '(no engine results this turn)';
    return `ENGINE RESULTS\n${lines}\n\n${knows ? `KNOWS\n${knows.replace(/^\[\/?KNOWS\]\n?/gm, '').trim()}\n\n` : ''}REPLY\n${reply}`;
}
const TOOLS = new Set(['Transfer', 'Claim', 'BodyCheck', 'BodyStrike', 'BodyWound', 'BodyFall', 'PassTime', 'CastSpell', 'BodyTreat', 'RollTheDice', 'BodyContact', 'Listen', 'Look', 'Communicate', 'SocialResponse', 'HoldOn', 'Chase', 'Price', 'Disease', 'Weather', 'Choose', 'Battle']);
const FLAGS = new Set([...TOOLS, 'KNOWS']);
/** Events from the checker's text; null when the text holds no readable JSON (the check is then skipped). */
export function parseAudit(text) {
    const m = String(text ?? '').match(/\{[\s\S]*\}/);
    if (!m)
        return null;
    try {
        const events = JSON.parse(m[0]).events;
        if (!Array.isArray(events))
            return null;
        return events.filter((e) => e && typeof e.quote === 'string' && FLAGS.has(e.tool));
    }
    catch {
        return null;
    }
}
export function correctionNote(events) {
    const items = events.map(e => e.tool === 'KNOWS' ? `- "${e.quote}" → the character does not know this yet: they learn it on the page first (seen, heard, told), or act without it`
        : `- "${e.quote}" → ${e.tool}${e.problem === 'contradicts' ? ' (narrate what it returns)' : ''}`).join('\n');
    return `<rule_engine_correction>\nThe previous draft of this reply had these problems. Fix each as named; for a tool, call it and narrate what it returns:\n${items}\n</rule_engine_correction>`;
}
/** Results of this turn: the rule tools' invocations stored in the chat since the last user message. */
export function turnResults(ctx) {
    const chat = ctx.chat || [];
    const from = chat.findLastIndex(m => m.is_user) + 1;
    return chat.slice(from)
        .flatMap(m => m.extra?.tool_invocations || [])
        .filter(t => TOOLS.has(t.name))
        .map(t => ({ tool: t.name, result: String(t.result) }))
        .concat(askedResults());
}
let pendingNote = null;
/** Interceptor: the correction for the reply being redone, once. */
export function takeAuditNote() {
    const note = pendingNote;
    pendingNote = null;
    return note;
}
/**
 * MESSAGE_RECEIVED. deps: { send(system, user) → text, ownsChat() → boolean, generate(type), toast(msg) }.
 * Returns the events found, or null when nothing was checked.
 */
export async function onRulesAuditMessage(messageId, deps) {
    const ctx = SillyTavern.getContext();
    const msg = Number.isInteger(messageId) ? ctx.chat?.[messageId] : null;
    if (!msg || msg.is_user || msg.is_system || msg.extra?.tool_invocations || !String(msg.mes ?? '').trim() || !ctx.chatMetadata)
        return null;
    const key = turnKey(ctx.chat);
    const reply = msg.mes;
    const raw = await deps.send(AUDIT_SYSTEM, buildAuditPrompt(reply, turnResults(ctx), knowledgeBlock(ctx.chatMetadata.rulesEngine?.state ?? {})));
    if (!deps.ownsChat() || ctx.chat[messageId] !== msg || msg.mes !== reply)
        return null;
    const events = parseAudit(raw);
    if (!events)
        return null;
    msg.extra ??= {};
    (msg.extra.rulesAudit ??= {})[msg.swipe_id ?? 0] = events;
    if (!events.length)
        return events;
    const tries = ctx.chatMetadata.rulesAuditRetries?.turn === key ? ctx.chatMetadata.rulesAuditRetries.count : 0;
    if (tries < MAX_RETRIES) {
        ctx.chatMetadata.rulesAuditRetries = { turn: key, count: tries + 1 };
        pendingNote = correctionNote(events);
        deps.generate('swipe');
    }
    else {
        deps.toast(`Rule check: ${events.length} event(s) in this reply have no engine result: ${events.map(e => `"${e.quote}"`).join('; ')}`);
    }
    return events;
}
/**
 * How often the narrator bent outcomes in this chat: replies the check pass read, those with at least one flagged event,
 * and the flags by tool and by problem. Read from each reply's shown swipe.
 */
export function auditStats(chat) {
    let checked = 0, flagged = 0;
    const byTool = {}, byProblem = {};
    for (const m of chat) {
        const ev = m.extra?.rulesAudit?.[m.swipe_id ?? 0];
        if (!Array.isArray(ev))
            continue;
        checked++;
        if (ev.length)
            flagged++;
        for (const e of ev) {
            byTool[e.tool] = (byTool[e.tool] ?? 0) + 1;
            byProblem[e.problem ?? 'unbacked'] = (byProblem[e.problem ?? 'unbacked'] ?? 0) + 1;
        }
    }
    return { checked, flagged, byTool, byProblem };
}
// Tools that decide an outcome; BodyCheck is the catch-all for actions no specific rule covers.
const RECORDING = new Set(['RecordFact', 'NewCharacter', 'NameCharacter', 'BodyStatus', 'BodyEnvironment', 'BodyIntake', 'PassTime']);
/**
 * Coverage of the rules in this chat: decisions made (question pass and narrator calls, the shown swipe of each reply),
 * how many went through a specific rule rather than the BodyCheck catch-all, and the catch-all's most frequent tasks:
 * the actions a new specific rule would cover first.
 */
export function coverageStats(chat) {
    const byTool = {}, tasks = {};
    let decisions = 0, catchAll = 0;
    const count = (tool, args) => {
        if (RECORDING.has(tool))
            return;
        decisions++;
        byTool[tool] = (byTool[tool] ?? 0) + 1;
        if (tool !== 'BodyCheck')
            return;
        catchAll++;
        const t = String(args.task ?? '').toLowerCase().replace(/,? *\d+(st|nd|rd|th) try$/, '').trim();
        if (t)
            tasks[t] = (tasks[t] ?? 0) + 1;
    };
    for (const m of chat) {
        const asked = m.extra?.rulesAsked?.[m.swipe_id ?? 0];
        for (const c of asked ?? [])
            count(c.tool, c.args ?? {});
        for (const t of m.extra?.tool_invocations ?? []) {
            let args = {};
            try {
                args = JSON.parse(t.parameters ?? '{}');
            }
            catch { /* unreadable arguments count without a task */ }
            count(t.name, args);
        }
    }
    return { decisions, catchAll, byTool, tasks };
}
/** /rules-stats: the check pass's tally for the open chat. */
export function registerRulesStatsCommand() {
    const ctx = SillyTavern.getContext();
    if (!ctx.SlashCommand || !ctx.SlashCommandParser)
        return;
    ctx.SlashCommandParser.addCommandObject(ctx.SlashCommand.fromProps({
        name: 'rules-stats',
        helpString: 'Rule check tally and rule coverage for this chat: replies with outcomes no engine result backs; outcomes decided by a specific rule versus the BodyCheck catch-all, and the catch-all tasks most often seen.',
        returns: 'the tally as text',
        callback: async () => {
            const s = auditStats(SillyTavern.getContext().chat ?? []);
            const list = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
            const c = coverageStats(SillyTavern.getContext().chat ?? []);
            const top = Object.entries(c.tasks).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, n]) => `${k} ${n}`).join(', ') || 'none';
            const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
            const text = `Rule check: ${s.checked} replies checked, ${s.flagged} with flagged events (${pct(s.flagged, s.checked)} %). By tool: ${list(s.byTool)}. By problem: ${list(s.byProblem)}.\n`
                + `Coverage: ${c.decisions} outcomes decided, ${pct(c.decisions - c.catchAll, c.decisions)} % by a specific rule, ${pct(c.catchAll, c.decisions)} % by the BodyCheck catch-all. By tool: ${list(c.byTool)}. Catch-all tasks most often: ${top}.`;
            globalThis.toastr?.info(text.split('\n')[1], 'Rules engine', { timeOut: 0, extendedTimeOut: 0 });
            const run = SillyTavern.getContext().executeSlashCommandsWithOptions;
            await run?.(`/comment ${text.replace(/\|/g, '\\|').replace(/\{\{/g, '{ {')}`).catch(e => console.warn('[Rules stats] comment failed:', e));
            return text;
        },
    }));
}
