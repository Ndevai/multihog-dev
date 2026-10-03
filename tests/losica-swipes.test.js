import { describe, it, expect, beforeEach } from 'vitest';
import { registerLosicaRulesTools, onLosicaGenerationStarted, onLosicaMessageReceived, onLosicaSwiped } from '../src/rules/losica-tools.js';

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
