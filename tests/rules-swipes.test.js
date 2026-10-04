import { describe, it, expect, beforeEach } from 'vitest';
import { registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat, restoreRulesForMemo } from '../src/rules/rules-tools.js';

let ctx;
const tools = {};

beforeEach(() => {
    ctx = {
        chat: [{ is_user: true, mes: 'I jump off the ledge' }],
        chatMetadata: {},
        registerFunctionTool: t => { tools[t.name] = t; },
        unregisterFunctionTool: () => {},
    };
    globalThis.SillyTavern = { getContext: () => ctx };
    registerRulesTools(true);
});

function reply(swipeId, text) {
    const msg = ctx.chat[1] || (ctx.chat[1] = { is_user: false, swipes: [], extra: {} });
    msg.swipe_id = swipeId;
    msg.mes = text;
    onRulesMessageReceived(1);
}

const people = () => Object.keys(ctx.chatMetadata.rulesEngine.state.people);

describe('Rules-engine state follows swipes like the State Tracker memo', () => {
    it('restores each swipe\'s own state when navigating back and forth', async () => {
        onRulesGenerationStarted('normal');
        await tools.BodyWound.action({ who: 'Mira', part: 'arm_l', type: 'cut' });
        reply(0, 'Mira is cut.');

        onRulesGenerationStarted('swipe');
        expect(people()).toEqual([]);
        await tools.BodyWound.action({ who: 'Tov', part: 'leg_l', type: 'blunt' });
        reply(1, 'Tov is bruised.');

        ctx.chat[1].swipe_id = 0;
        onRulesSwiped(1);
        expect(people()).toEqual(['Mira']);

        ctx.chat[1].swipe_id = 1;
        onRulesSwiped(1);
        expect(people()).toEqual(['Tov']);
    });

    it('repeats a random outcome when a swipe makes the same call', async () => {
        onRulesGenerationStarted('normal');
        const first = await tools.BodyFall.action({ who: 'Mira', height_m: 14 });
        reply(0, 'She falls.');
        onRulesGenerationStarted('swipe');
        expect(await tools.BodyFall.action({ who: 'Mira', height_m: 14 })).toBe(first);
    });
});

describe('Rules-engine state follows branches, deletions and Linear Stone restores', () => {
    async function twoTurns() {
        onRulesGenerationStarted('normal');
        await tools.BodyWound.action({ who: 'Mira', part: 'arm_l', type: 'cut' });
        reply(0, 'Mira is cut.');
        ctx.chat[1].extra.rpgMemoResult = { 0: 'MEMO-1' };
        ctx.chat.push({ is_user: true, mes: 'Tov steps in' });
        onRulesGenerationStarted('normal');
        await tools.BodyWound.action({ who: 'Tov', part: 'leg_l', type: 'blunt' });
        ctx.chat.push({ is_user: false, swipe_id: 0, mes: 'Tov is hit.', extra: { rpgMemoResult: { 0: 'MEMO-2' } } });
        onRulesMessageReceived(3);
    }

    it('a branch cut after the first reply starts with that reply\'s state', async () => {
        await twoTurns();
        ctx.chat = ctx.chat.slice(0, 2);
        syncRulesToChat();
        expect(people()).toEqual(['Mira']);
    });

    it('deleting the last exchange returns to the previous reply\'s state', async () => {
        await twoTurns();
        ctx.chat.splice(2);
        syncRulesToChat();
        expect(people()).toEqual(['Mira']);
    });

    it('restoring a Linear Stone takes the state of the reply that produced that memo', async () => {
        await twoTurns();
        expect(restoreRulesForMemo('MEMO-1')).toBe(true);
        expect(people()).toEqual(['Mira']);
        expect(restoreRulesForMemo('MEMO-2')).toBe(true);
        expect(people()).toEqual(['Mira', 'Tov']);
        expect(restoreRulesForMemo('hand-edited memo')).toBe(false);
    });
});

describe('host wiring', () => {
    it('calls the rules sync on chat change, deletion and stone restore', async () => {
        const { readFileSync } = await import('node:fs');
        const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
        const panel = readFileSync(new URL('../src/ui/panel/panel-builder.js', import.meta.url), 'utf8');
        expect(index).toMatch(/CHAT_CHANGED, \(\) => \{ if \(getSettings\(\)\.rulesEngine\) syncRulesToChat\(\)/);
        expect(index).toMatch(/MESSAGE_DELETED, \(\) => \{ if \(getSettings\(\)\.rulesEngine\) syncRulesToChat\(\)/);
        expect(panel).toContain('globalThis._rpgOnMemoRestored?.(snapshot);');
    });
});

describe('SillyTavern tool flow: tool calls are stored as a chat message, then a second generation writes the reply', () => {
    async function toolTurn() {
        onRulesGenerationStarted('normal');
        const result = await tools.BodyWound.action({ who: 'Mira', part: 'arm_l', type: 'cut' });
        ctx.chat.push({ is_system: true, is_user: false, mes: 'tool call', extra: { tool_invocations: [{ name: 'BodyWound', parameters: '{}', result }] } });
        onRulesGenerationStarted('normal');
        ctx.chat.push({ is_user: false, swipe_id: 0, swipes: ['Mira is cut.'], mes: 'Mira is cut.', extra: {} });
        onRulesMessageReceived(2);
        return result;
    }

    it('the reply generation keeps the state the tools produced', async () => {
        await toolTurn();
        expect(people()).toEqual(['Mira']);
    });

    it('the rule check finds the turn\'s tool results in the chat, also after a swipe', async () => {
        const { turnResults } = await import('../src/rules/rules-audit.js');
        const result = await toolTurn();
        expect(turnResults(ctx)).toEqual([{ tool: 'BodyWound', result }]);
        onRulesGenerationStarted('swipe');
        expect(people()).toEqual(['Mira']);
        expect(turnResults(ctx)).toEqual([{ tool: 'BodyWound', result }]);
        ctx.chat.push({ is_user: true, mes: 'I run' });
        expect(turnResults(ctx)).toEqual([]);
    });

    it('the rule check skips a message with no text', async () => {
        const { onRulesAuditMessage } = await import('../src/rules/rules-audit.js');
        ctx.chat.push({ is_user: false, mes: '', extra: {} });
        let sent = false;
        expect(await onRulesAuditMessage(1, { send: async () => { sent = true; return '{"events":[]}'; }, ownsChat: () => true })).toBeNull();
        expect(sent).toBe(false);
    });
});
