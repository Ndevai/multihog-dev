// Things named in plain words, linked to one id: weapons, tools, vehicles and machines from Wikidata (subclasses of
// weapon Q728, tool Q39546, vehicle Q42889, machine Q11019: id, English name, other names, description, inception or
// invention year; exported 2026-10-12, CC0; items described as fictional or from games and films left out). Code finds every
// thing whose name or other name appears in the player's message; the question model picks the one meant from that closed
// list by its description; code then uses the id's year (Ryan's minimal departure needs the real thing, not a word).
export type Thing = [id: string, label: string, aliases: string[], description: string, year: number | null];

let THINGS: Thing[] = [];
let INDEX = new Map<string, number[]>();
let loading: Promise<void> | null = null;
const key = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (s: string) => s.length > 3 && s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;

export function loadThings(): Promise<void> {
    loading ??= fetch(new URL('../../rules/things.json', import.meta.url)).then(r => r.json()).then((t: Thing[]) => {
        THINGS = t;
        INDEX = new Map();
        t.forEach(([, label, aliases], i) => { for (const n of [label, ...aliases]) { const k = key(n); if (k.length >= 3) INDEX.set(k, [...(INDEX.get(k) ?? []), i]); } });
    }).catch(e => { console.warn('[Rules engine] things list not loaded:', e); loading = null; });
    return loading;
}

export interface Found { phrase: string; options: { id: string; label: string; description: string; year: number | null }[] }

/** Every phrase of 1–4 words in `text` that names a thing, with up to 5 things it may mean (longest phrases first). */
export function thingsIn(text: string): Found[] {
    const w = key(text).split(' ').filter(Boolean), out: Found[] = [], used = new Set<number>();
    for (let n = 4; n >= 1; n--) for (let i = 0; i + n <= w.length; i++) {
        if ([...Array(n).keys()].some(j => used.has(i + j))) continue;
        const phrase = w.slice(i, i + n).join(' ');
        const hits = INDEX.get(phrase) ?? INDEX.get(w.slice(i, i + n - 1).concat(singular(w[i + n - 1])).join(' '));
        if (!hits?.length) continue;
        for (let j = 0; j < n; j++) used.add(i + j);
        out.push({ phrase, options: hits.slice(0, 5).map(k => { const t = THINGS[k]; return { id: t[0], label: t[1], description: t[3], year: t[4] }; }) });
    }
    return out;
}

/** The things the question model read in this turn's message: phrase → the thing it picked. */
export let READ: { phrase: string; id: string; label: string; year: number | null }[] = [];
export function setRead(r: typeof READ): void { READ = r; }

/** "[THINGS] … [/THINGS]" for the question model, '' when the message names none. */
export function thingsBlock(found: Found[]): string {
    if (!found.length) return '';
    const lines = found.map(f => `"${f.phrase}": ${f.options.map(o => `${o.id} = ${o.label}${o.year != null ? ` (${o.year})` : ''}${o.description ? `: ${o.description}` : ''}`).join(' | ')}`);
    return `[THINGS]\nThings the player's message may name, each with what it could be. In the JSON, add "read": {"phrase": "id"} with the one meant for each; when two fit the scene equally, add "unsure": {"phrase": ["id", "id"]} instead.\n${lines.join('\n')}\n[/THINGS]`;
}

/** The earliest year among the dated things `name` names exactly (any of its meanings), or null: a refusal by this year
 *  holds whichever thing the word meant. */
export function earliestYear(name: string): { year: number; label: string } | null {
    const k = key(name), hits = INDEX.get(k) ?? INDEX.get(singular(k)) ?? [];
    let best: { year: number; label: string } | null = null;
    for (const i of hits) { const t = THINGS[i]; if (t[4] == null) return null; if (!best || t[4] < best.year) best = { year: t[4], label: t[1] }; }
    return best;
}
