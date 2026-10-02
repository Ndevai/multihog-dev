import { describe, it, expect } from 'vitest';
import { turnKey, ledgerForTurn, findRepeat, parseTable, pickTier, verdictOf, correctVerdicts, tableRollsToToolCalls } from '../src/state/dice-ledger.js';

describe('turn key', () => {
    const chat = [{ is_user: true, mes: 'I pick the lock' }, { is_user: false, mes: 'The lock...' }];

    it('ignores assistant messages, so a swipe keeps the key', () => {
        expect(turnKey(chat)).toBe(turnKey([...chat, { is_user: false, mes: 'other swipe' }]));
    });

    it('changes when the user sends or rewrites a message', () => {
        expect(turnKey(chat)).not.toBe(turnKey([...chat, { is_user: true, mes: 'again' }]));
        expect(turnKey(chat)).not.toBe(turnKey([{ is_user: true, mes: 'I climb' }]));
    });

    it('starts a fresh ledger on a new turn', () => {
        const old = { turn: 'a', rolls: [{}] };
        expect(ledgerForTurn(old, 'a')).toBe(old);
        expect(ledgerForTurn(old, 'b').rolls).toEqual([]);
    });
});

describe('re-roll lookup', () => {
    const ledger = { turn: 'k', rolls: [{ who: 'Mira', for: 'Pick lock', kind: 'check', total: 7 }] };

    it('matches the same roller and purpose regardless of case and punctuation', () => {
        expect(findRepeat(ledger, { who: 'mira', for: 'pick-lock', kind: 'check' })?.total).toBe(7);
    });

    it('treats a different purpose or kind as a new roll', () => {
        expect(findRepeat(ledger, { who: 'Mira', for: 'pick lock 2', kind: 'check' })).toBeNull();
        expect(findRepeat(ledger, { who: 'Mira', for: 'pick lock', kind: 'amount' })).toBeNull();
    });
});

describe('tables', () => {
    const loot = parseTable('1–5 Junk/broken | 6–10 Common | 11–15 Useful/quality | 16–19 Rare/notable | 20 Exceptional');

    it('parses the stock loot table and picks tiers', () => {
        expect(loot).toHaveLength(5);
        expect(pickTier(loot, 1).label).toBe('Junk/broken');
        expect(pickTier(loot, 15).label).toBe('Useful/quality');
        expect(pickTier(loot, 20).label).toBe('Exceptional');
    });

    it('clamps totals beyond the ends to the end rows', () => {
        expect(pickTier(loot, 24).label).toBe('Exceptional');
        expect(pickTier(loot, -2).label).toBe('Junk/broken');
    });

    it('reads open-ended rows', () => {
        const ev = parseTable('≤8 negative | 9–11 ambiguous | ≥12 favorable');
        expect(pickTier(ev, 3).label).toBe('negative');
        expect(pickTier(ev, 12).label).toBe('favorable');
        expect(pickTier(parseTable('1-9 nothing | 10+ event'), 17).label).toBe('event');
    });

    it('rejects gaps, overlaps and single rows', () => {
        expect(parseTable('1-5 a | 7-10 b')).toBeNull();
        expect(parseTable('1-6 a | 5-10 b')).toBeNull();
        expect(parseTable('1-20 a')).toBeNull();
        expect(parseTable('junk')).toBeNull();
    });
});

describe('verdict correction', () => {
    const rolls = [
        { kind: 'check', dc: 15, total: 12, verdict: verdictOf(12, 15, 'gte') },
        { kind: 'check', dc: 35, total: 62, verdict: verdictOf(62, 35, 'lte') },
    ];

    it('flips a contradicting verdict word and keeps its case', () => {
        const { text, fixes } = correctVerdicts('She works the pins. *(Lockpicking: DC 15, roll 12 → Success)*', rolls);
        expect(text).toBe('She works the pins. *(Lockpicking: DC 15, roll 12 → Failure)*');
        expect(fixes).toBe(1);
    });

    it('handles percentage checks', () => {
        expect(correctVerdicts('(Ambush 35%: rolled 62, HIT)', rolls).text).toBe('(Ambush 35%: rolled 62, MISS)');
    });

    it('leaves correct verdicts and unrelated parentheses alone', () => {
        const text = '(DC 15, roll 12, failed) and (he succeeds, mostly)';
        expect(correctVerdicts(text, rolls)).toEqual({ text, fixes: 0 });
    });

    it('leaves a group alone when no logged roll matches its DC and total', () => {
        const text = '(DC 18, roll 12, success)';
        expect(correctVerdicts(text, rolls).fixes).toBe(0);
    });
});

describe('loot and random-event prompts in tool modes', () => {
    const loot = '- On finding an item, pop a d20: 1–5 Junk/broken | 6–10 Common | 11–15 Useful/quality | 16–19 Rare/notable | 20 Exceptional.\n- Narrate rarity tier.';
    const events = 'Travel/time-skips only, not spammed. Pop a number: ≥10 = event occurs. If event, pop again: ≤8 negative, 9–11 ambiguous, ≥12 favorable. Not used for rest interruption.';
    const tablesIn = text => [...text.matchAll(/table "([^"]+)"/g)].map(m => m[1]);

    it('turns the loot pop into a table call whose table parses', () => {
        const out = tableRollsToToolCalls(loot, 'RollTheDice');
        expect(out).not.toMatch(/\bpop\b/i);
        expect(out).toContain('call RollTheDice with kind "table", formula "1d20"');
        expect(tablesIn(out).map(t => parseTable(t)?.length)).toEqual([5]);
        expect(out).toContain('- Narrate rarity tier.');
    });

    it('turns the two-stage event pop into two table calls with the same thresholds', () => {
        const out = tableRollsToToolCalls(events, 'RollTheDiceD100');
        expect(out).not.toMatch(/\bpop\b/i);
        const [occur, type] = tablesIn(out).map(parseTable);
        expect(pickTier(occur, 9).label).toBe('no event');
        expect(pickTier(occur, 10).label).toBe('event');
        expect(pickTier(type, 8).label).toBe('negative');
        expect(pickTier(type, 11).label).toBe('ambiguous');
        expect(pickTier(type, 12).label).toBe('favorable');
        expect(out).toContain('Not used for rest interruption.');
    });

    it('rewrites the shipped sysprompts', async () => {
        const { RT_PROMPTS } = await import('../constants.js');
        for (const name of ['sysprompt.txt', 'sysprompt_legacy.txt']) {
            for (const tag of ['loot', 'random_events']) {
                const inner = RT_PROMPTS[name].match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`))[1];
                expect(tableRollsToToolCalls(inner, 'RollTheDice')).not.toMatch(/\bpop\b/i);
            }
        }
    });
});

describe('RollTheDice action order', () => {
    it('refuses a dc-less check and returns repeats before any dice are rolled', async () => {
        const { readFileSync } = await import('node:fs');
        const src = readFileSync(new URL('../narrative-hooks.js', import.meta.url), 'utf8');
        const body = src.slice(src.indexOf('async function executeDiceToolAction'));
        const rollAt = body.indexOf('await doDiceRoll(');
        expect(body.indexOf('Nothing was rolled. A check needs')).toBeLessThan(rollAt);
        expect(body.indexOf('findRepeat(')).toBeLessThan(rollAt);
        const index = readFileSync(new URL('../index.js', import.meta.url), 'utf8');
        expect(index).toContain('eventSource.on(event_types.MESSAGE_RECEIVED, onDiceVerdictMessage)');
    });
});
