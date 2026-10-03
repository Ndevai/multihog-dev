import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseAudit, buildAuditPrompt, correctionNote, onRulesAuditMessage, takeAuditNote } from '../src/rules/rules-audit.js';
import { registerLosicaRulesTools, onLosicaGenerationStarted, LOSICA_BRIEF } from '../src/rules/losica-tools.js';

let ctx;
const tools = {};

beforeEach(() => {
    ctx = {
        chat: [{ is_user: true, mes: 'I punch the guard' }],
        chatMetadata: {},
        registerFunctionTool: t => { tools[t.name] = t; },
        unregisterFunctionTool: () => {},
    };
    globalThis.SillyTavern = { getContext: () => ctx };
    registerLosicaRulesTools(true);
    takeAuditNote();
});

function reply(text) {
    ctx.chat[1] = { is_user: false, mes: text, swipe_id: ctx.chat[1] ? ctx.chat[1].swipe_id + 1 : 0, extra: {} };
}

const deps = answer => {
    const calls = { generate: [], toast: [], prompts: [] };
    return {
        calls,
        send: async (system, user) => { calls.prompts.push(user); return answer; },
        ownsChat: () => true,
        generate: type => calls.generate.push(type),
        toast: t => calls.toast.push(t),
    };
};

const BROKEN_JAW = JSON.stringify({ events: [{ quote: 'his jaw cracked', tool: 'LosicaStrike', problem: 'unbacked' }] });

describe('reading the checker', () => {
    it('keeps known tools and drops the rest', () => {
        expect(parseAudit(`Here: {"events":[{"quote":"a","tool":"LosicaFall"},{"quote":"b","tool":"Magic"}]}`)).toEqual([{ quote: 'a', tool: 'LosicaFall' }]);
        expect(parseAudit('{"events":[]}')).toEqual([]);
        expect(parseAudit('no json')).toBeNull();
    });

    it('shows the checker every engine result of the turn', () => {
        expect(buildAuditPrompt('He falls.', [{ tool: 'LosicaFall', result: 'Fall 3 m: survives.' }])).toContain('1. LosicaFall: Fall 3 m: survives.');
        expect(buildAuditPrompt('x', [])).toContain('(no engine results this turn)');
    });
});

describe('the loop: check, redo once, then show', () => {
    it('an injury with no tool result triggers one redo carrying the missing call', async () => {
        reply('She swings and his jaw cracked.');
        const d = deps(BROKEN_JAW);
        const events = await onRulesAuditMessage(1, d);
        expect(events).toHaveLength(1);
        expect(d.calls.generate).toEqual(['swipe']);
        const note = takeAuditNote();
        expect(note).toContain('"his jaw cracked" → LosicaStrike');
        expect(takeAuditNote()).toBeNull();
    });

    it('a second unbacked reply in the same turn is shown to the user, not redone', async () => {
        reply('She swings and his jaw cracked.');
        await onRulesAuditMessage(1, deps(BROKEN_JAW));
        onLosicaGenerationStarted('swipe');
        reply('His jaw cracked again.');
        const d = deps(BROKEN_JAW);
        await onRulesAuditMessage(1, d);
        expect(d.calls.generate).toEqual([]);
        expect(d.calls.toast[0]).toMatch(/1 event\(s\).*his jaw cracked/);
        expect(ctx.chat[1].extra.rulesAudit[1]).toHaveLength(1);
    });

    it('tool results of the turn reach the checker; a backed reply passes', async () => {
        onLosicaGenerationStarted('normal');
        await tools.LosicaStrike.action({ who: 'Guard', part: 'mouth', means: 'fist' });
        reply('Her fist bruises his mouth.');
        const d = deps('{"events":[]}');
        expect(await onRulesAuditMessage(1, d)).toEqual([]);
        expect(d.calls.prompts[0]).toMatch(/1\. LosicaStrike: fist to mouth: \d+ N/);
        expect(d.calls.generate).toEqual([]);
    });

    it('a new user message starts a new retry budget', async () => {
        reply('His jaw cracked.');
        await onRulesAuditMessage(1, deps(BROKEN_JAW));
        takeAuditNote();
        ctx.chat.push({ is_user: true, mes: 'I punch again' });
        ctx.chat[3] = { is_user: false, mes: 'His nose broke.', swipe_id: 0, extra: {} };
        const d = deps(BROKEN_JAW);
        await onRulesAuditMessage(3, d);
        expect(d.calls.generate).toEqual(['swipe']);
    });

    it('drops the result when the chat or the reply changed during the check', async () => {
        reply('His jaw cracked.');
        const d = { ...deps(BROKEN_JAW), ownsChat: () => false };
        expect(await onRulesAuditMessage(1, d)).toBeNull();
        expect(d.calls.generate).toEqual([]);
    });
});

describe('severity is code-side', () => {
    it('the narrator cannot choose vessel or fracture', () => {
        const props = tools.LosicaWound.parameters.properties;
        expect(props.vessel).toBeUndefined();
        expect(props.fracture).toBeUndefined();
        expect(props.type.enum).not.toContain('fracture');
    });

    it('a cut through LosicaWound gets its vessel from code', async () => {
        onLosicaGenerationStarted('normal');
        expect(await tools.LosicaWound.action({ who: 'Ara', part: 'leg_l', type: 'cut' })).toMatch(/cut to leg_l, (limb artery opened|small vessels)/);
    });

    it('the brief and the correction reach the narrator prompt', () => {
        const hooks = readFileSync(new URL('../narrative-hooks.js', import.meta.url), 'utf8');
        expect(hooks).toContain('injections += `${LOSICA_BRIEF}');
        expect(LOSICA_BRIEF).toContain('LosicaStrike');
        expect(correctionNote([{ quote: 'q', tool: 'LosicaTime', problem: 'contradicts' }])).toContain('(narrate what it returns)');
        const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
        expect(index).toContain('await onRulesAuditMessage(id, {');
    });
});
