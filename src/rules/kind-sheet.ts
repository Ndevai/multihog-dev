// A kind's stat sheet (the player's picks, 2026-11-16: "having absence of values is worse than having minimalist values";
// values written in the engine, better than a model deciding; "you can't expect they all to be the same"). Every field holds
// a value: from data, rolled from data, computed, or a human's value written down where nothing is known (docs/kinds.md).
// The groups are what NetHack (monst.c: speed, resistances, attacks, size), Cataclysm: Dark Days Ahead (monster JSON: hp,
// speed with a human at 100, vision, flags such as SEES, HEARS, SMELLS, regeneration, reproduction, upgrades) and Dwarf
// Fortress (creature tokens and attribute ranges) give a creature; only the shape is taken from the first two. The values come
// from the Dwarf Fortress creature files the engine already holds (rules/df/raw, released into the public domain).
import type { Person } from './types.js';
import { comeRate } from './world-count.js';

export const PHYS = ['STRENGTH', 'AGILITY', 'TOUGHNESS', 'ENDURANCE', 'RECUPERATION', 'DISEASE_RESISTANCE'] as const;
export const MENT = ['ANALYTICAL_ABILITY', 'FOCUS', 'WILLPOWER', 'CREATIVITY', 'INTUITION', 'PATIENCE', 'MEMORY', 'LINGUISTIC_ABILITY', 'SPATIAL_SENSE', 'MUSICALITY', 'KINESTHETIC_SENSE', 'EMPATHY', 'SOCIAL_AWARENESS'] as const;
// The medians of the human-like creatures of the raws: the fourth of the seven numbers of each PHYS_ATT_RANGE and
// MENT_ATT_RANGE; a human's median is 1000 for every attribute (none set in the raws; the Dwarf Fortress wiki, Attribute),
// and an attribute a creature leaves unset keeps 1000.
export const TEMPLATES: Record<string, Partial<Record<typeof PHYS[number] | typeof MENT[number], number>>> = {
    HUMAN: {},
    DWARF: { STRENGTH: 1250, AGILITY: 900, TOUGHNESS: 1250, ANALYTICAL_ABILITY: 1250, FOCUS: 1500, CREATIVITY: 1250, PATIENCE: 1250, MEMORY: 1250, SPATIAL_SENSE: 1500 },
    ELF: { AGILITY: 1250, RECUPERATION: 1250, DISEASE_RESISTANCE: 2000, INTUITION: 1250, PATIENCE: 900, MEMORY: 5000, LINGUISTIC_ABILITY: 2000, SPATIAL_SENSE: 1250, MUSICALITY: 1250, KINESTHETIC_SENSE: 1500, EMPATHY: 1250, SOCIAL_AWARENESS: 1250 },
    GOBLIN: { STRENGTH: 1250, ENDURANCE: 1500, RECUPERATION: 1250, DISEASE_RESISTANCE: 1250, WILLPOWER: 1500, CREATIVITY: 750, INTUITION: 750, MEMORY: 5000, EMPATHY: 300, SOCIAL_AWARENESS: 1500 },
    MINOTAUR: { STRENGTH: 1250, TOUGHNESS: 1250, AGILITY: 1250, ENDURANCE: 1250, RECUPERATION: 1250, DISEASE_RESISTANCE: 1250, FOCUS: 1250, WILLPOWER: 1250, MEMORY: 2250, SPATIAL_SENSE: 2250, KINESTHETIC_SENSE: 1250 },
};
// Shares among the 767 creatures of the raws: seeing in the dark (EXTRAVISION) 37; active by day (DIURNAL) 142, by night
// (NOCTURNAL) 54, the rest at any hour (CREPUSCULAR 21 and VESPERTINE 1 counted as any hour [ASSUMED]); resistances the engine
// reads (body-engine.ts has): NO_DIZZINESS 32, NOSTUN 23, NO_FEVERS 18, NONAUSEA 15, PARALYZEIMMUNE 5, FIREIMMUNE 5.
const N_CREATURES = 767;
export const SHARES = { EXTRAVISION: 37 / N_CREATURES, day: 142 / N_CREATURES, night: 54 / N_CREATURES };
export const RESISTS: Record<string, number> = { NO_DIZZINESS: 32, NOSTUN: 23, NO_FEVERS: 18, NONAUSEA: 15, PARALYZEIMMUNE: 5, FIREIMMUNE: 5 };
const RESIST_SAYS: Record<string, string> = { NO_DIZZINESS: 'dizziness', NOSTUN: 'being stunned', NO_FEVERS: 'fever', NONAUSEA: 'nausea', PARALYZEIMMUNE: 'paralysis', FIREIMMUNE: 'fire', NOPAIN: 'pain', NOFEAR: 'fear' };
// A human's attacks in the raws: punch, kick, scratch, bite.
export const HUMAN_ATTACKS = ['punch', 'kick', 'scratch', 'bite'];
// How new ones come, by origin (the rates registered in world-count.ts, which counts them year by year since section 110):
// born so, their children at the place's birth rate (the year's, world-count.ts ewYear); made, 1 % of their number a year;
// came back from death, 1 % of the place's dead, as the returning dead of an outbreak model (Munz, Hudea, Imad & Smith? 2009,
// "When zombies attack!", which takes such rates as parameters); came from elsewhere, 1 % of their number arriving a year
// (each registered as assumed, kindMadeRate, kindReturnRate and kindArriveRate, until a measured rate is found). A kind of
// another origin counts as born so.
const pctOf = (x: number) => `${Math.round(x * 1000) / 10} %`;
export function numbersOf(origin = ''): string {
    if (origin === 'were made') return `others of them are made from the living: ${pctOf(comeRate('made')!)} of their number a year`;
    if (origin === 'came back from death') return `${pctOf(comeRate('returned')!)} of the place's dead come back as one of them`;
    if (origin === 'came from elsewhere') return `more arrive: ${pctOf(comeRate('arrived')!)} of their number a year`;
    return 'their own children, at the place\'s birth rate, are of the kind';
}

export type Source = 'data' | 'rolled' | 'default' | 'computed';
export interface KindSheet {
    body: string[]; massKg: number; warm: boolean;
    attrs: Record<string, number>;
    senses: { sight: number; hearing: number; smell: number; dark: boolean };
    speed: number; speaks: boolean; fear: boolean;
    active: 'day' | 'night' | 'any time'; lifespan: string; healing: string;
    numbers: string; resists: string[]; weakTo: string;
    diet: string; attacks: string[]; tells: string[];
    from: Record<string, Source>;
}
/** A kind's sheet, every field filled: rolled from the raws where they hold the value (each attribute's median from one of the
 * human-like creatures, each as likely [ASSUMED]; seeing in the dark, active hours and resistances with their shares among
 * the raws' creatures), a human's value written down otherwise. */
export function rollSheet(k: { body?: string[]; origin?: string; need?: string; tells?: { sign: string }[] }, massKg: number, tellSigns: string[], rng: () => number): KindSheet {
    const names = Object.keys(TEMPLATES), attrs: Record<string, number> = {};
    for (const a of [...PHYS, ...MENT]) attrs[a] = TEMPLATES[names[Math.floor(rng() * names.length)]!]![a] ?? 1000;
    const u = rng(), active = u < SHARES.day ? 'day' : u < SHARES.day + SHARES.night ? 'night' : 'any time';
    const resists = Object.entries(RESISTS).filter(([, n]) => rng() < n / N_CREATURES).map(([t]) => t);
    const body = k.body ?? [];
    return {
        body, massKg, warm: !body.includes('NO_HEAT'), attrs,
        senses: { sight: 1, hearing: 1, smell: 1, dark: rng() < SHARES.EXTRAVISION },
        speed: 100, speaks: true, fear: !body.includes('NOFEAR'),
        active, lifespan: 'a human\'s (the engine\'s life tables)', healing: 'a human\'s (the engine\'s wound healing)',
        numbers: numbersOf(k.origin),
        resists: [...resists, ...body.filter(t => t === 'NOPAIN' || t === 'NOFEAR')], weakTo: 'nothing',
        diet: k.need && k.need !== 'nothing' ? k.need : 'a human\'s food', attacks: HUMAN_ATTACKS, tells: tellSigns,
        from: { body: 'rolled', massKg: massKg === 70 ? 'default' : 'rolled', attrs: 'rolled', senses: 'rolled', speed: 'default', speaks: 'default', active: 'rolled', lifespan: 'default', healing: 'default', numbers: 'computed', resists: 'rolled', weakTo: 'default', diet: 'computed', attacks: 'data', tells: 'computed' },
    };
}
const word = (a: string) => a.toLowerCase().replace(/_/g, ' ');
const LACKS: Record<string, string> = { NOBREATHE: 'breath', NO_SLEEP: 'sleep', NO_EAT: 'our food', NO_DRINK: 'drink', NOPAIN: 'pain', NOFEAR: 'fear' };
/** The sheet in lines, for the narrator and the document. */
export function sheetLines(s: KindSheet): string[] {
    const differ = Object.entries(s.attrs).filter(([, v]) => v !== 1000).map(([a, v]) => `${word(a)} ${v}`);
    return [
        `Body: lacks ${s.body.filter(t => t !== 'NO_HEAT').length ? s.body.filter(t => t !== 'NO_HEAT').map(t => LACKS[t] ?? word(t)).join(', ') : 'nothing a human has'}; ${s.massKg} kg; ${s.warm ? 'keeps its own warmth' : 'no warmth of its own'}.`,
        `Attributes (a human's median 1000): ${differ.length ? differ.join(', ') : 'all at 1000'}; the rest 1000.`,
        `Senses (× a human): sight ${s.senses.sight}, hearing ${s.senses.hearing}, smell ${s.senses.smell}${s.senses.dark ? '; sees in the dark' : ''}. Speed ${s.speed} (a human 100).`,
        `Mind: ${s.speaks ? 'speaks' : 'does not speak'}; ${s.fear ? 'feels fear' : 'feels no fear'}. Active: ${s.active}. Lifespan: ${s.lifespan}. Healing: ${s.healing}.`,
        `Numbers: ${s.numbers}.`,
        `Resists: ${s.resists.length ? s.resists.map(t => RESIST_SAYS[t] ?? word(t)).join(', ') : 'nothing a human does not'}. Weak to: ${s.weakTo}.`,
        `Feeds on: ${s.diet}. Attacks: ${s.attacks.join(', ')}. Shows: ${s.tells.length ? s.tells.join('; ') : 'nothing a human does not'}.`,
    ];
}
/** A person's force from their kind's strength: a human's scaled by strength ÷ 1000 [ASSUMED: force in proportion]. */
export const strengthFactor = (p: Person) => (p.attrs?.STRENGTH ?? 1000) / 1000;
