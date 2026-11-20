// What the box's sheet shows besides a word's path (the player's picks, 2026-11-13, of six drawn ideas): what the player's
// character remembers, a person's card, the story's timeline, the scene's map, and the feeling a speaker's picture takes. Each
// is read from a record the engine keeps: facts with their sources and recall (knowledge.ts), people's bodies and feelings,
// each line's question pass and its story time, the scene's plan (map.ts) and this turn's hearing and sight.
import type { RuleState, Person } from './types.js';
import { heldFacts, heldSource, recallStrength, memoryState } from './knowledge.js';
import { relOfSource, type WhyRel } from './why.js';
import { VOCAL_FAMILY } from './emotion.js';

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
/** One remembered fact: its words, how strongly it is recalled (0–1), how and from whom it was learned, and when. */
export interface MemoryRow { text: string; strength: number; rel: WhyRel; by?: string; at?: number;
    /** How the character holds it a day or more on (knowledge.ts memoryState): the time since, how sure, how clearly, and of its
     *  details how many have drifted and how many are lost. */
    held?: { since: string; sure: string; clear: string; details: number; changed: number; left: number;
        /** Since section 97: how each drifted detail is held, by meaning (memory-meaning.ts), and the memory in those terms. */
        told?: import('./memory-meaning.js').Held[]; as?: string } }
/** What `who` remembers now: the facts they hold and recall (each knower's fixed draw under the forgetting curve), their own
 * version in place of the world's fact it replaces, as they hold it (the player sees as their character); the strongest
 * first, then the newest. */
export function memoryOf(st: RuleState, who: string): MemoryRow[] {
    const w = norm(who);
    return heldFacts(st, who)
        .map(f => { const src = f.everyone ? null : relOfSource(heldSource(st, f, who)); const held = f.everyone ? null : memoryState(st, f, who); return { text: f.text, strength: recallStrength(st, f, who), rel: f.everyone ? 'everyone knows' as WhyRel : src!.rel, by: src?.by, at: f.at?.[w], ...held ? { held } : {} }; })
        .sort((a, b) => b.strength - a.strength || (b.at ?? 0) - (a.at ?? 0));
}
/** What `who` remembers of `name`: the remembered facts that name them. */
export const memoryAbout = (st: RuleState, who: string, name: string) => { const n = norm(name); return memoryOf(st, who).filter(r => ` ${norm(r.text)} `.includes(` ${n} `)); };

/** A voice in plain words: low below 120 Hz, high above 200 [ASSUMED bands: between the adult male and female speaking
 * means]; slow under 4 syllables a second, quick over 5.5 [ASSUMED bands about an adult's 4–5]. */
export function voiceWords(f0Hz?: number, sylPerS?: number): string {
    const pitch = f0Hz == null ? '' : f0Hz < 120 ? 'low' : f0Hz > 200 ? 'high' : 'middle';
    const pace = sylPerS == null ? '' : sylPerS < 4 ? 'slow' : sylPerS > 5.5 ? 'quick' : 'even';
    return [pitch && `${pitch} voice`, pace && `${pace} speech`].filter(Boolean).join(', ');
}
/** A person's feeling now: the newest still running, its type and strength. */
export function feelingNow(p: Person | undefined): { type: string; strength: number } | null {
    const f = [...(p?.feelings ?? [])].filter(x => x.left > 0).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
    return f ? { type: f.type, strength: f.strength ?? 0.5 } : null;
}
/** A person's report card (the player's pick, 2026-11-17, from Danganronpa's handbook): labelled rows in plain words from the
 * engine's record, each left out when the record has none (their trade stands under their name, as the handbook's talent
 * does, so no row repeats it). Age in whole years with the word for them (box.ts cardRole's); height in cm; build from where their BMI sits among their sex in their country and year, slight
 * below −1 SD and heavy above +1 SD [ASSUMED bands: a sixth of people each side]; voice (voiceWords); the feeling now with how
 * strongly (0.75 and 0.4, the person card's bands). */
export function reportRows(p: Person | undefined, voice?: { f0Hz?: number; sylPerS?: number } | null): [string, string][] {
    const rows: [string, string][] = [];
    if (p?.age != null) {
        const noun = p.age < 18 ? (p.sex === 'female' ? 'girl' : p.sex === 'male' ? 'boy' : '') : p.sex === 'female' ? 'woman' : p.sex === 'male' ? 'man' : '';
        rows.push(['Age', `${Math.floor(p.age)}${noun ? ` · ${noun}` : ''}`]);
    }
    if (p?.heightCm) rows.push(['Height', `${Math.round(p.heightCm)} cm`]);
    if (p?.bmiZ != null) rows.push(['Build', p.bmiZ < -1 ? 'slight' : p.bmiZ > 1 ? 'heavy' : 'average']);
    const said = voiceWords(voice?.f0Hz, voice?.sylPerS);
    if (said) rows.push(['Voice', said]);
    const f = feelingNow(p);
    if (f) rows.push(['Feeling', `${f.type}, ${f.strength >= 0.75 ? 'strongly' : f.strength >= 0.4 ? 'clearly' : 'faintly'}`]);
    return rows;
}
/** The vocal family (emotion.ts: anger, fear, happiness, sadness, tenderness) a person's picture takes from their feeling. */
export const pictureFeeling = (p: Person | undefined): string | null => { const f = feelingNow(p); return f ? VOCAL_FAMILY[f.type] ?? null : null; };

/** The story's timeline: each player's line whose question pass kept the story's time, in chat order. */
export function timelineOf(chat: { is_user?: boolean; extra?: Record<string, unknown> }[]): { index: number; time: number }[] {
    return chat.flatMap((m, index) => { const t = (m.is_user ? (m.extra?.rulesPass as { time?: number | null } | undefined)?.time : null); return typeof t === 'number' ? [{ index, time: t }] : []; });
}

/** The scene's plan on the player's floor: rooms by their corners, people at their placed spots, the player among them, those
 * the player heard or saw this turn marked so. Null when the plan holds no position for the player. */
export interface MapView { rooms: { name: string; corners: [number, number][] }[]; people: { name: string; x: number; y: number; player: boolean; heard: boolean; seen: boolean }[]; box: [number, number, number, number] }
export function mapView(st: RuleState, player: string, heard: string[] = [], seen: string[] = []): MapView | null {
    const spots = st.map?.spots ?? {}, at = (p: Person | undefined) => p?.at ? spots[p.at] : undefined;
    const me = at(st.people?.[player]);
    if (!me) return null;
    const rooms = Object.entries(st.map?.rooms ?? {}).filter(([, r]) => r.floor === me.floor).map(([name, r]) => ({ name, corners: r.corners }));
    const people = Object.entries(st.people ?? {}).flatMap(([name, p]) => { const s = at(p); return s && s.floor === me.floor ? [{ name, x: s.x, y: s.y, player: norm(name) === norm(player), heard: heard.some(h => norm(h) === norm(name)), seen: seen.some(h => norm(h) === norm(name)) }] : []; });
    const xs = [...rooms.flatMap(r => r.corners.map(c => c[0])), ...people.map(p => p.x)], ys = [...rooms.flatMap(r => r.corners.map(c => c[1])), ...people.map(p => p.y)];
    return { rooms, people, box: [Math.min(...xs) - 1, Math.min(...ys) - 1, Math.max(...xs) + 1, Math.max(...ys) + 1] };
}
/** Whom the player heard and saw this turn: the Listen and Look calls of the player's line whose results say so. */
export function sensedThisTurn(pass: { calls: { tool: string; args: Record<string, unknown> }[]; results: { tool: string; result: string }[] } | null | undefined, player: string): { heard: string[]; seen: string[] } {
    const heard: string[] = [], seen: string[] = [], p = norm(player);
    pass?.calls.forEach((c, i) => {
        const r = pass.results[i]?.result ?? '';
        if (c.tool === 'Listen' && norm(c.args.listener) === p && / hears it /.test(r) && c.args.source_who) heard.push(String(c.args.source_who));
        if (c.tool === 'Look' && norm(c.args.viewer) === p && c.args.target_who && /\b(sees|notices|recogni[sz]es|identifies)\b/.test(r)) seen.push(String(c.args.target_who));
    });
    return { heard, seen };
}
