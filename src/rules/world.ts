// The world book: what this world has that real history lacks. A reader takes a fictional world to be the real one except
// where the text says otherwise (principle of minimal departure, Ryan 1980, Poetics 9:403); a plausible "what if" changes
// as little history as its premise needs, each change following from the premise by a stated cause (minimal-rewrite rule,
// Tetlock & Belkin 1996). So each entry names its cause and the areas of life the cause reaches; every other area stays as in
// real history, and the entry shows in the world through a few stated reflections.
import { checkArgs, str, type Props } from './tool-schema.js';
import { creatureId } from './df/index.js';
import { SPEECH_OVERRIDE } from './body-engine.js';
import { distKm } from './weather.js';

export const KINDS = ['creature', 'people', 'place', 'institution', 'technology', 'magic', 'event'] as const;
export const DOMAINS = ['wildlife and danger', 'warfare', 'settlement and building', 'law and government', 'religion and folklore', 'language and names', 'trade and prices', 'medicine', 'daily life'] as const;
// Traits on which tellings of one creature differ (folklore, Tolkien, games); the body comes from the DF creature.
export const ACTIVE = ['day', 'night', 'any time'] as const;
export const WEAKNESS = ['none', 'sunlight turns it to stone', 'fire'] as const;

export const ENTRY: Props = {
    what: str('What the world has, a few words ("orcs", "the Guild of Lamplighters")'),
    kind: { type: 'string', enum: KINDS },
    since: { type: 'number', description: 'Year it began; leave out for "always"' },
    // Where, as coordinates: a name means different things at different dates (Norway under Danish rule, modern Norway) and a
    // salient name pulls the narrator toward its associations; the narrator gets the area relative to the scene instead.
    worldwide: { type: 'boolean', description: 'Everywhere in the world' },
    lat: { type: 'number', description: 'Latitude of the centre of its area, degrees (north +)' },
    lon: { type: 'number', description: 'Longitude of the centre of its area, degrees (east +)' },
    radius_km: { type: 'number', description: 'Radius of its area, km. Default 300.' },
    cause: str('How it came to be, one sentence: the stated cause every reached area follows from'),
    reaches: { type: 'array', items: { type: 'string', enum: DOMAINS }, description: 'Areas of life the cause reaches; every other area stays as in real history' },
    reflections: { type: 'array', items: { type: 'string' }, description: '1–15 facts everyone in the world knows that show it, each in a reached area, one short sentence each' },
    species: str('For a creature or a people: the DF creature its body is (troll, ogre, goblin, giant, wolf)'),
    speaks: { type: 'boolean', description: 'For a creature or a people: it talks' },
    active: { type: 'string', enum: ACTIVE },
    weakness: { type: 'string', enum: WEAKNESS },
    changes: { type: 'array', items: { type: 'object', properties: { what: str('The invention'), year: { type: 'number', description: 'Its real year' }, new_year: { type: 'number', description: 'Its year in this world' }, never: { type: 'boolean', description: 'Never made in this world' } }, required: ['what', 'year'] }, description: 'Inventions this entry moves: decided by code for /world-without and /world-earlier' },
};
const REQUIRED = ['what', 'kind', 'cause', 'reaches', 'reflections'] as const;
export type Entry = { what: string; kind: string; since?: number; worldwide?: boolean; lat?: number; lon?: number; radius_km?: number; cause: string; reaches: string[]; reflections: string[];
    species?: string; speaks?: boolean; active?: string; weakness?: string; changes?: { what: string; year: number; new_year?: number; never?: boolean }[] };

/** The entry as the schema wants it, or the errors to fix. A species must be a DF creature. */
export function checkEntry(raw: Record<string, unknown>): { entry?: Entry; errors: string[] } {
    const { args, errors } = checkArgs(ENTRY, REQUIRED, raw);
    if (args.species && !creatureId(String(args.species))) errors.push(`species "${args.species}" is not a DF creature`);
    if (!args.worldwide && (args.lat == null || args.lon == null)) errors.push('give lat and lon of its area, or worldwide: true');
    if (args.lat != null && Math.abs(Number(args.lat)) > 90 || args.lon != null && Math.abs(Number(args.lon)) > 180) errors.push('lat is −90 to 90, lon −180 to 180');
    const n = (args.reflections as string[] | undefined)?.length ?? 0;
    if (n && (n < 1 || n > 15)) errors.push(`reflections: give 1 to 15, not ${n}`);
    return errors.length ? { errors } : { entry: args as Entry, errors };
}

/** The book of the open chat, as last applied; read by the tools that check what exists. */
export let CURRENT_BOOK: Entry[] = [];

/** Applies the book's mechanical switches to the engine: speech per DF creature, and the book the tools check against. */
export function applyWorld(book: Entry[]): void {
    CURRENT_BOOK = book;
    for (const k of Object.keys(SPEECH_OVERRIDE)) delete SPEECH_OVERRIDE[k];
    for (const e of book) {
        const id = e.species ? creatureId(e.species) : null;
        if (id && e.speaks !== undefined) SPEECH_OVERRIDE[id] = e.speaks;
    }
}

const toRad = Math.PI / 180;
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
// Near = within 300 km beyond the edge, about ten days on foot at 30 km a day [ASSUMED].
const NEAR_KM = 300;

/** The entry's area in words, relative to the scene when its position is known; coordinates otherwise. */
function areaWords(e: Entry, here: { lat: number; lon: number } | null): string {
    if (e.worldwide) return 'everywhere';
    if (e.lat == null || e.lon == null) return 'area not given';
    const radius = e.radius_km ?? 300;
    if (!here) return `around ${Math.abs(e.lat).toFixed(1)}°${e.lat >= 0 ? 'N' : 'S'} ${Math.abs(e.lon).toFixed(1)}°${e.lon >= 0 ? 'E' : 'W'}, within ${radius} km`;
    const d = distKm(here.lat, here.lon, e.lat, e.lon);
    if (d <= radius) return 'here: the scene lies in its area';
    const y = Math.sin((e.lon - here.lon) * toRad) * Math.cos(e.lat * toRad);
    const x = Math.cos(here.lat * toRad) * Math.sin(e.lat * toRad) - Math.sin(here.lat * toRad) * Math.cos(e.lat * toRad) * Math.cos((e.lon - here.lon) * toRad);
    const dir = COMPASS[Math.round(((Math.atan2(y, x) / toRad + 360) % 360) / 45) % 8];
    return d - radius <= NEAR_KM ? `near: its area begins a few days' travel to the ${dir}` : `far away to the ${dir}`;
}

/** "[WORLD] … [/WORLD]" for the narrator and the question model, '' for an empty book. here: the scene's position. */
// `sunUp`: whether the sun is above the horizon at the scene now (sky.ts), when the story time and place are known; the
// entry's activity and a sunlight weakness are then stated as they stand now, decided by the sky, not by the narrator.
export function worldBlock(book: Entry[], here: { lat: number; lon: number } | null = null, sunUp: boolean | null = null): string {
    if (!book.length) return '';
    const now = (e: Entry) => {
        if (sunUp === null) return '';
        const out = [];
        if (e.active === 'day' || e.active === 'night') out.push((e.active === 'day') === sunUp ? `now active (sun ${sunUp ? 'up' : 'down'})` : `now resting in shelter (sun ${sunUp ? 'up' : 'down'})`);
        if (e.weakness === 'sunlight turns it to stone' && sunUp) out.push('the sun is up: one caught in the open turns to stone');
        return out.length ? `, ${out.join(', ')}` : '';
    };
    const line = (e: Entry) => {
        const body = e.species ? `; body: ${e.species}${e.speaks === undefined ? '' : e.speaks ? ', talks' : ', does not talk'}${e.active && e.active !== 'any time' ? `, active by ${e.active}` : ''}${e.weakness && e.weakness !== 'none' ? `, ${e.weakness}` : ''}${now(e)}` : '';
        return `- ${e.what} (${e.kind}), ${e.since == null ? 'always' : `since ${e.since}`}, ${areaWords(e, here)}${body}. Cause: ${e.cause} Reaches: ${e.reaches.join(', ')}. Known to all: ${e.reflections.join(' ')}`;
    };
    return `[WORLD]\nThis world is real history with these additions. Areas of life an addition does not reach are as in real history.\n${book.map(line).join('\n')}\n[/WORLD]`;
}

export const FILL_SYSTEM = `You write one entry of a world book for a story set in real history with additions. Change as little real history as the addition needs.
From the user's line, fill: what, kind, since (a year, or leave it out for always), its area as lat and lon of the centre with radius_km (or worldwide: true), cause (one sentence: how it came to be), reaches (only the areas of life the cause reaches), reflections (3 to 7 short facts everyone in that world knows, each in a reached area), and for a creature or a people: species (the Dwarf Fortress creature its body is), speaks, active, weakness.
Write cause and reflections without present-day country names; name a place only as people there at that date would.
Allowed values: kind ${KINDS.join(' | ')}; reaches ${DOMAINS.join(' | ')}; active ${ACTIVE.join(' | ')}; weakness ${WEAKNESS.join(' | ')}.
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
