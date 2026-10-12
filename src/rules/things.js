let THINGS = [];
let INDEX = new Map();
let loading = null;
const key = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const singular = (s) => s.length > 3 && s.endsWith('s') && !s.endsWith('ss') ? s.slice(0, -1) : s;
export function loadThings() {
    loading ??= fetch(new URL('../../rules/things.json', import.meta.url)).then(r => r.json()).then((t) => {
        THINGS = t;
        INDEX = new Map();
        t.forEach(([, label, aliases], i) => { for (const n of [label, ...aliases]) {
            const k = key(n);
            if (k.length >= 3)
                INDEX.set(k, [...(INDEX.get(k) ?? []), i]);
        } });
    }).catch(e => { console.warn('[Rules engine] things list not loaded:', e); loading = null; });
    return loading;
}
/** Every phrase of 1–4 words in `text` that names a thing, with up to 5 things it may mean (longest phrases first). */
export function thingsIn(text) {
    const w = key(text).split(' ').filter(Boolean), out = [], used = new Set();
    for (let n = 4; n >= 1; n--)
        for (let i = 0; i + n <= w.length; i++) {
            if ([...Array(n).keys()].some(j => used.has(i + j)))
                continue;
            const phrase = w.slice(i, i + n).join(' ');
            const hits = INDEX.get(phrase) ?? INDEX.get(w.slice(i, i + n - 1).concat(singular(w[i + n - 1])).join(' '));
            if (!hits?.length)
                continue;
            for (let j = 0; j < n; j++)
                used.add(i + j);
            out.push({ phrase, options: hits.slice(0, 5).map(k => { const t = THINGS[k]; return { id: t[0], label: t[1], description: t[3], year: t[4] }; }) });
        }
    return out;
}
/** The things the question model read in this turn's message: phrase → the thing it picked. */
export let READ = [];
export function setRead(r) { READ = r; }
/** "[THINGS] … [/THINGS]" for the question model, '' when the message names none. */
export function thingsBlock(found) {
    if (!found.length)
        return '';
    const lines = found.map(f => `"${f.phrase}": ${f.options.map(o => `${o.id} = ${o.label}${o.year != null ? ` (${o.year})` : ''}${o.description ? `: ${o.description}` : ''}`).join(' | ')}`);
    return `[THINGS]\nThings the player's message may name, each with what it could be. In the JSON, add "read": {"phrase": "id"} with the one meant for each; when two fit the scene equally, add "unsure": {"phrase": ["id", "id"]} instead.\n${lines.join('\n')}\n[/THINGS]`;
}
/** The earliest year among the dated things `name` names exactly (any of its meanings), or null: a refusal by this year
 *  holds whichever thing the word meant. */
export function earliestYear(name) {
    const k = key(name), hits = INDEX.get(k) ?? INDEX.get(singular(k)) ?? [];
    let best = null;
    for (const i of hits) {
        const t = THINGS[i];
        if (t[4] == null)
            return null;
        if (!best || t[4] < best.year)
            best = { year: t[4], label: t[1] };
    }
    return best;
}
