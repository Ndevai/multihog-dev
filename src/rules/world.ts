// The world book: what this world has that real history lacks. A reader takes a fictional world to be the real one except
// where the text says otherwise (principle of minimal departure, Ryan 1980, Poetics 9:403); a plausible "what if" changes
// as little history as its premise needs, each change following from the premise by a stated cause (minimal-rewrite rule,
// Tetlock & Belkin 1996). So each entry names its cause and the areas of life the cause reaches; every other area stays as in
// real history, and the entry shows in the world through a few stated reflections.
import { checkArgs, str, type Props } from './tool-schema.js';
import { creatureId } from './df/index.js';
import { SPEECH_OVERRIDE } from './body-engine.js';

export const KINDS = ['creature', 'people', 'place', 'institution', 'technology', 'magic', 'event'] as const;
export const WHERE = ['worldwide', 'Europe', 'Africa', 'the Middle East', 'Asia', 'North America', 'South America', 'Oceania'] as const;
export const DOMAINS = ['wildlife and danger', 'warfare', 'settlement and building', 'law and government', 'religion and folklore', 'language and names', 'trade and prices', 'medicine', 'daily life'] as const;
// Traits on which tellings of one creature differ (folklore, Tolkien, games); the body comes from the DF creature.
export const ACTIVE = ['day', 'night', 'any time'] as const;
export const WEAKNESS = ['none', 'sunlight turns it to stone', 'fire'] as const;

export const ENTRY: Props = {
    what: str('What the world has, a few words ("orcs", "the Guild of Lamplighters")'),
    kind: { type: 'string', enum: KINDS },
    since: { type: 'number', description: 'Year it began; leave out for "always"' },
    where: { type: 'string', enum: WHERE },
    place: str('A narrower place, when it has one ("Southwark, London")'),
    cause: str('How it came to be, one sentence: the stated cause every reached area follows from'),
    reaches: { type: 'array', items: { type: 'string', enum: DOMAINS }, description: 'Areas of life the cause reaches; every other area stays as in real history' },
    reflections: { type: 'array', items: { type: 'string' }, description: '3–7 facts everyone in the world knows that show it, each in a reached area, one short sentence each' },
    species: str('For a creature or a people: the DF creature its body is (troll, ogre, goblin, giant, wolf)'),
    speaks: { type: 'boolean', description: 'For a creature or a people: it talks' },
    active: { type: 'string', enum: ACTIVE },
    weakness: { type: 'string', enum: WEAKNESS },
};
const REQUIRED = ['what', 'kind', 'where', 'cause', 'reaches', 'reflections'] as const;
export type Entry = { what: string; kind: string; since?: number; where: string; place?: string; cause: string; reaches: string[]; reflections: string[];
    species?: string; speaks?: boolean; active?: string; weakness?: string };

/** The entry as the schema wants it, or the errors to fix. A species must be a DF creature. */
export function checkEntry(raw: Record<string, unknown>): { entry?: Entry; errors: string[] } {
    const { args, errors } = checkArgs(ENTRY, REQUIRED, raw);
    if (args.species && !creatureId(String(args.species))) errors.push(`species "${args.species}" is not a DF creature`);
    const n = (args.reflections as string[] | undefined)?.length ?? 0;
    if (n && (n < 3 || n > 7)) errors.push(`reflections: give 3 to 7, not ${n}`);
    return errors.length ? { errors } : { entry: args as Entry, errors };
}

/** Applies the book's mechanical switches to the engine: speech per DF creature. */
export function applyWorld(book: Entry[]): void {
    for (const k of Object.keys(SPEECH_OVERRIDE)) delete SPEECH_OVERRIDE[k];
    for (const e of book) {
        const id = e.species ? creatureId(e.species) : null;
        if (id && e.speaks !== undefined) SPEECH_OVERRIDE[id] = e.speaks;
    }
}

/** "[WORLD] … [/WORLD]" for the narrator and the question model, '' for an empty book. */
export function worldBlock(book: Entry[]): string {
    if (!book.length) return '';
    const line = (e: Entry) => {
        const body = e.species ? `; body: ${e.species}${e.speaks === undefined ? '' : e.speaks ? ', talks' : ', does not talk'}${e.active && e.active !== 'any time' ? `, active by ${e.active}` : ''}${e.weakness && e.weakness !== 'none' ? `, ${e.weakness}` : ''}` : '';
        return `- ${e.what} (${e.kind}), ${e.since == null ? 'always' : `since ${e.since}`}, ${e.place ? `${e.place}, ` : ''}${e.where}${body}. Cause: ${e.cause} Reaches: ${e.reaches.join(', ')}. Known to all: ${e.reflections.join(' ')}`;
    };
    return `[WORLD]\nThis world is real history with these additions. Areas of life an addition does not reach are as in real history.\n${book.map(line).join('\n')}\n[/WORLD]`;
}

export const FILL_SYSTEM = `You write one entry of a world book for a story set in real history with additions. Change as little real history as the addition needs.
From the user's line, fill: what, kind, since (a year, or leave it out for always), where, place (optional), cause (one sentence: how it came to be), reaches (only the areas of life the cause reaches), reflections (3 to 7 short facts everyone in that world knows, each in a reached area), and for a creature or a people: species (the Dwarf Fortress creature its body is), speaks, active, weakness.
Allowed values: kind ${KINDS.join(' | ')}; where ${WHERE.join(' | ')}; reaches ${DOMAINS.join(' | ')}; active ${ACTIVE.join(' | ')}; weakness ${WEAKNESS.join(' | ')}.
Write only the JSON object.`;

/** The last JSON object in the model's text, or null. */
export function parseEntry(text: unknown): Record<string, unknown> | null {
    const s = String(text ?? ''), at = s.lastIndexOf('{"what"') >= 0 ? s.lastIndexOf('{"what"') : s.indexOf('{');
    if (at < 0) return null;
    let depth = 0;
    for (let i = at; i < s.length; i++) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}' && --depth === 0) { try { return JSON.parse(s.slice(at, i + 1)); } catch { return null; } }
    }
    return null;
}
