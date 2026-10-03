import { describe, it, expect, beforeEach } from 'vitest';
import { registerLosicaRulesTools, onLosicaGenerationStarted, onLosicaMessageReceived, onLosicaSwiped, syncLosicaToChat, restoreLosicaForMemo } from '../src/rules/losica-tools.js';

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
    registerLosicaRulesTools(true);
});

function reply(swipeId, text) {
    const msg = ctx.chat[1] || (ctx.chat[1] = { is_user: false, swipes: [], extra: {} });
    msg.swipe_id = swipeId;
    msg.mes = text;
    onLosicaMessageReceived(1);
}

const people = () => Object.keys(ctx.chatMetadata.losicaRules.state.people);

describe('Losica state follows swipes like the State Tracker memo', () => {
    it('restores each swipe\'s own state when navigating back and forth', async () => {
        onLosicaGenerationStarted('normal');
        await tools.LosicaWound.action({ who: 'Mira', part: 'arm_l', type: 'cut' });
        reply(0, 'Mira is cut.');

        onLosicaGenerationStarted('swipe');
        expect(people()).toEqual([]);
        await tools.LosicaWound.action({ who: 'Tov', part: 'leg_l', type: 'blunt' });
        reply(1, 'Tov is bruised.');

        ctx.chat[1].swipe_id = 0;
        onLosicaSwiped(1);
        expect(people()).toEqual(['Mira']);

        ctx.chat[1].swipe_id = 1;
        onLosicaSwiped(1);
        expect(people()).toEqual(['Tov']);
    });

    it('repeats a random outcome when a swipe makes the same call', async () => {
        onLosicaGenerationStarted('normal');
        const first = await tools.LosicaFall.action({ who: 'Mira', height_m: 14 });
        reply(0, 'She falls.');
        onLosicaGenerationStarted('swipe');
        expect(await tools.LosicaFall.action({ who: 'Mira', height_m: 14 })).toBe(first);
    });
});

describe('Losica state follows branches, deletions and Linear Stone restores', () => {
    async function twoTurns() {
        onLosicaGenerationStarted('normal');
        await tools.LosicaWound.action({ who: 'Mira', part: 'arm_l', type: 'cut' });
        reply(0, 'Mira is cut.');
        ctx.chat[1].extra.rpgMemoResult = { 0: 'MEMO-1' };
        ctx.chat.push({ is_user: true, mes: 'Tov steps in' });
        onLosicaGenerationStarted('normal');
        await tools.LosicaWound.action({ who: 'Tov', part: 'leg_l', type: 'blunt' });
        ctx.chat.push({ is_user: false, swipe_id: 0, mes: 'Tov is hit.', extra: { rpgMemoResult: { 0: 'MEMO-2' } } });
        onLosicaMessageReceived(3);
    }

    it('a branch cut after the first reply starts with that reply\'s state', async () => {
        await twoTurns();
        ctx.chat = ctx.chat.slice(0, 2);
        syncLosicaToChat();
        expect(people()).toEqual(['Mira']);
    });

    it('deleting the last exchange returns to the previous reply\'s state', async () => {
        await twoTurns();
        ctx.chat.splice(2);
        syncLosicaToChat();
        expect(people()).toEqual(['Mira']);
    });

    it('restoring a Linear Stone takes the state of the reply that produced that memo', async () => {
        await twoTurns();
        expect(restoreLosicaForMemo('MEMO-1')).toBe(true);
        expect(people()).toEqual(['Mira']);
        expect(restoreLosicaForMemo('MEMO-2')).toBe(true);
        expect(people()).toEqual(['Mira', 'Tov']);
        expect(restoreLosicaForMemo('hand-edited memo')).toBe(false);
    });
});

describe('host wiring', () => {
    it('calls the Losica sync on chat change, deletion and stone restore', async () => {
        const { readFileSync } = await import('node:fs');
        const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
        const panel = readFileSync(new URL('../src/ui/panel/panel-builder.js', import.meta.url), 'utf8');
        expect(index).toMatch(/CHAT_CHANGED, \(\) => \{ if \(getSettings\(\)\.losicaRules\) syncLosicaToChat\(\)/);
        expect(index).toMatch(/MESSAGE_DELETED, \(\) => \{ if \(getSettings\(\)\.losicaRules\) syncLosicaToChat\(\)/);
        expect(panel).toContain('globalThis._rpgOnMemoRestored?.(snapshot);');
    });
});
