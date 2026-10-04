// After each reply, a separate model pass lists rule-governed events that no tool result backs.
// Code then redoes the reply once with the missing calls named; a second failure is shown to the user.

import { turnKey } from '../state/dice-ledger.js';
import { losicaTurnLog } from './losica-tools.js';

const MAX_RETRIES = 1;

export const AUDIT_SYSTEM = `You check a roleplay narrator's reply against the rule-engine results of the same turn.
List each event in the reply that the engine governs and that no engine result backs, or that contradicts an engine result.
Engine-governed events: a blow, cut, stab, bite or burn landing on someone; any injury, bleeding, fracture or death; a fall; a check succeeding or failing; an attack landing or missing; story time passing (minutes, hours, days); a spell being cast; a treatment working.
An event is backed when an engine result of the matching tool describes it. Intentions, threats, dialogue and misses described as misses are not events.
Reply with JSON only: {"events":[{"quote":"exact words from the reply","tool":"LosicaCheck|LosicaStrike|LosicaWound|LosicaFall|LosicaTime|LosicaCast|LosicaTreat|RollTheDice","problem":"unbacked|contradicts"}]}. An empty list means every event is backed.`;

export function buildAuditPrompt(reply, results) {
    const lines = results.length
        ? results.map((r, i) => `${i + 1}. ${r.tool}: ${r.result}`).join('\n')
        : '(no engine results this turn)';
    return `ENGINE RESULTS\n${lines}\n\nREPLY\n${reply}`;
}

const TOOLS = new Set(['LosicaCheck', 'LosicaStrike', 'LosicaWound', 'LosicaFall', 'LosicaTime', 'LosicaCast', 'LosicaTreat', 'RollTheDice']);

/** Events from the checker's text; null when the text holds no readable JSON (the check is then skipped). */
export function parseAudit(text) {
    const m = String(text ?? '').match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
        const events = JSON.parse(m[0]).events;
        if (!Array.isArray(events)) return null;
        return events.filter(e => e && typeof e.quote === 'string' && TOOLS.has(e.tool));
    } catch {
        return null;
    }
}

export function correctionNote(events) {
    const items = events.map(e => `- "${e.quote}" → ${e.tool}${e.problem === 'contradicts' ? ' (narrate what it returns)' : ''}`).join('\n');
    return `<rule_engine_correction>\nThe previous draft of this reply narrated these without engine results. Call the named tool for each, then narrate what it returns:\n${items}\n</rule_engine_correction>`;
}

/** Results of this turn: every Losica tool call plus every dice roll of the current user turn. */
export function turnResults(ctx) {
    const rolls = ctx.chatMetadata?.rpgDiceLedger?.turn === turnKey(ctx.chat) ? ctx.chatMetadata.rpgDiceLedger.rolls : [];
    return [...losicaTurnLog(), ...rolls.map(r => ({ tool: 'RollTheDice', result: r.text }))];
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
    if (!msg || msg.is_user || msg.is_system || msg.extra?.tool_invocations || !ctx.chatMetadata) return null;
    const key = turnKey(ctx.chat);
    const reply = msg.mes;
    const raw = await deps.send(AUDIT_SYSTEM, buildAuditPrompt(reply, turnResults(ctx)));
    if (!deps.ownsChat() || ctx.chat[messageId] !== msg || msg.mes !== reply) return null;
    const events = parseAudit(raw);
    if (!events) return null;
    msg.extra ??= {};
    (msg.extra.rulesAudit ??= {})[msg.swipe_id ?? 0] = events;
    if (!events.length) return events;
    const tries = ctx.chatMetadata.rulesAuditRetries?.turn === key ? ctx.chatMetadata.rulesAuditRetries.count : 0;
    if (tries < MAX_RETRIES) {
        ctx.chatMetadata.rulesAuditRetries = { turn: key, count: tries + 1 };
        pendingNote = correctionNote(events);
        deps.generate('swipe');
    } else {
        deps.toast(`Rule check: ${events.length} event(s) in this reply have no engine result: ${events.map(e => `"${e.quote}"`).join('; ')}`);
    }
    return events;
}
