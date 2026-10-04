import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('../portrait-storage.js', () => ({ lookupCustomPortraitSrc: () => '' }));
import { losicaSection, losicaTrackerTemplate, losicaDiceSpec, effectiveModules, LOSICA_CREATION } from '../src/rules/losica-mode.js';
import { buildModulesInstructionText } from '../memo-processor.js';
import { DEFAULT_STOCK_PROMPTS, buildCyoaPrompt } from '../constants.js';
import { buildDefaultSettings, FULL_REVIEW_STATE_SYSTEM_PROMPT } from '../src/state/defaults.js';
import { blockToItems } from '../renderer.js';
import { AUDIT_SYSTEM } from '../src/rules/rules-audit.js';
import { LOSICA_BRIEF } from '../src/rules/losica-tools.js';

// D&D mechanics that have no place in a Losica prompt.
const DND_ABBR = /\b(HP|AC|XP|BAB|APR|HD|CR|STR|DEX|CON|INT|WIS|CHA|Fort|Ref|Will|5e)\b|D&D/;
const DND_WORDS = /hit dic?e|saving throw|\bsaves?\s*(:|\+|vs\b|dc\b|bonus)|, saves?\b|\bsaves? or\b|spell slot|initiative (order|roll)|roll(s|ed)? initiative|level.?up|death save|long rest|short rest|proficien|\d+d\d+\s*[+-]\s*\d|temp hp|advantage|level \[|\+\d+ (to hit|ac)/i;
const DND = { [Symbol.match]: t => t.match(DND_ABBR) || t.match(DND_WORDS) };

const sysprompt = readFileSync(new URL('../sysprompt.txt', import.meta.url), 'utf8');
const sections = [...sysprompt.matchAll(/^<([^\s>/]+)>\n([\s\S]*?)\n<\/\1>/gm)].map(m => ({ tag: m[1], inner: m[2] }));

function narrator(settings, useQueue = false) {
    return sections
        .filter(s => s.tag !== 'CYOA_mode')
        .map(({ tag, inner }) => {
            const l = losicaSection(tag, inner, settings, useQueue);
            if (l?.final !== undefined) return l.final;
            return `<${tag}>\n${l?.inner ?? inner}\n</${tag}>`;
        })
        .filter(Boolean)
        .join('\n\n');
}

const losica = { losicaRules: true, rngEnabled: true, diceFunctionTool: true };

describe('Losica narrator prompt', () => {
    it('parses every top-level section of the shipped prompt', () => {
        expect(sections.map(s => s.tag)).toEqual(expect.arrayContaining(['role', 'combat', 'xp_system', 'level_up_protocol', '[PARTY]_mechanics', 'constraints', 'end_of_output_footer']));
    });

    it('holds no D&D mechanic in any RNG mode', () => {
        for (const s of [losica, { ...losica, rngEnabled: false }, { ...losica, diceD100Mode: true }]) {
            for (const queue of [false, true]) {
                const text = narrator(s, queue);
                expect(text.match(DND)?.[0] ?? null).toBeNull();
            }
        }
    });

    it('keeps the sections that are not D&D', () => {
        const text = narrator(losica);
        for (const tag of ['quests', 'relationship_tracking', 'narrative', 'world_progression', 'dungeon_reality_and_hidden_mapping', 'random_events']) {
            expect(text).toContain(`<${tag}>`);
        }
        expect(text).toContain('<bench_ETA_system>');
        expect(text).toContain('Name (N kg)');
        expect(text).toContain("(Status: [{{user}}'s wounds and blood-loss class from BODY, a few words])");
    });

    it('leaves the D&D prompt unchanged when the Losica rules are off', () => {
        expect(narrator({ rngEnabled: true })).toBe(narrator({ ...losica, losicaRules: false }));
        expect(narrator({ rngEnabled: true })).toMatch(/BAB/);
    });
});

describe('Losica State Tracker prompt', () => {
    const settings = (on) => ({ ...buildDefaultSettings(), losicaRules: on, stockPrompts: { ...DEFAULT_STOCK_PROMPTS } });

    it('module formats hold no D&D mechanic and no XP or ABILITIES module', () => {
        const text = buildModulesInstructionText(settings(true));
        expect(text.match(DND)?.[0] ?? null).toBeNull();
        expect(text).not.toMatch(/\[XP\]|\[ABILITIES\]/);
        expect(text).toMatch(/\[CHARACTER\]: \{\{user\}\}'s lasting facts/);
        expect(text).toContain('Last Woke:');
        expect(text).toContain('Status: Fighting | Defeated | Fled | Surrendered');
    });

    it('core prompts hold no D&D mechanic', () => {
        for (const template of [buildDefaultSettings().systemPromptTemplate, FULL_REVIEW_STATE_SYSTEM_PROMPT]) {
            const out = losicaTrackerTemplate(template);
            expect(out.match(DND)?.[0] ?? null).toBeNull();
            expect(out).toContain('{{modulesText}}');
        }
    });

    it('D&D formats stay when the Losica rules are off', () => {
        expect(buildModulesInstructionText(settings(false))).toMatch(/BAB/);
        expect(effectiveModules(settings(false)).xp).toBe(true);
        expect(effectiveModules(settings(true)).xp).toBe(false);
    });

    it('the sheet renders each Losica member as its own entry', () => {
        const html = blockToItems('PARTY', 'Mira (58 kg)\nTraining: fighting trained\nTomas (80 kg)\nTraining: fighting untrained').join('');
        expect(html).toContain('class="rt-entity-name">Mira</div>');
        expect(html).toContain('class="rt-entity-name">Tomas</div>');
    });
});

describe('Losica dice tool, choices, audit and creation', () => {
    it('checks go through LosicaCheck in every RNG mode; dice give quantities and tables only', () => {
        for (const s of [losica, { ...losica, rngEnabled: false }, { ...losica, diceD100Mode: true }]) {
            for (const queue of [false, true]) expect(narrator(s, queue)).toContain('Every check goes through LosicaCheck');
        }
        expect(LOSICA_BRIEF).toContain('Any other action with an uncertain outcome → LosicaCheck.');
        for (const d100 of [false, true]) {
            const spec = losicaDiceSpec(d100);
            expect(spec.kind.enum).toEqual(['amount', 'table']);
            expect(JSON.stringify(spec).match(DND)?.[0] ?? null).toBeNull();
            expect(JSON.stringify(spec)).not.toMatch(/attack|damage|heal/i);
        }
    });

    it('choice examples carry Losica mechanics', () => {
        const text = buildCyoaPrompt({}, { losica: true });
        expect(text.match(DND)?.[0] ?? null).toBeNull();
        expect(text).toContain('[Strike: blade, trained]');
        expect(buildCyoaPrompt({})).toMatch(/vs AC 15/);
    });

    it('audit, brief and creation text hold no D&D mechanic', () => {
        for (const t of [AUDIT_SYSTEM, LOSICA_BRIEF, LOSICA_CREATION.replace('no levels, hit points or attribute scores', '')]) {
            expect(t.match(DND)?.[0] ?? null).toBeNull();
        }
    });

    it('is wired into the narrator, tracker, dice tool, choices and character creation', () => {
        const read = f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
        expect(read('game-systems.js')).toContain('losicaSection(tag, innerContent, settings,');
        expect(read('memo-processor.js')).toContain('effectiveModules(settings)');
        expect(read('index.js').match(/losicaTrackerTemplate\(/g)).toHaveLength(2);
        expect(read('narrative-hooks.js')).toContain('losicaDiceSpec(');
        expect(read('narrative-hooks.js')).toContain('buildCyoaModeBlock(settings.cyoaConfig || {}, { losica: !!settings.losicaRules })');
        expect(read('character-creator.js')).toContain('LOSICA_CREATION');
        expect(read('src/ui/panel/card-events.js')).toContain('LOSICA_ARCHETYPES');
    });
});
