// Actions take the time their physics gives (docs/df-body-engine.md §6.20). The clock moves only by computed durations:
// duration = amount ÷ rate. A walk is distance ÷ the walker's own speed (§6.7a); a change of posture or a hand motion takes
// its standard time from Methods-Time Measurement (MTM-1 data card, MTM Association 2019; 1 TMU = 0.036 s), the time an
// experienced person takes at normal effort. Positions are named spots; the distance between two spots is recorded the
// first time it is given and reused after, so "leaves the house" from the doorway and from the living room differ.
// Precision: each duration is shown to the digit its spread allows, spread 10 % of the duration [ASSUMED: within-person
// variation of a repeated motion].
import { def, k as kc } from './constants.js';
import type { Person, RuleState as State } from './types.js';
import { walkSpeedKmh } from './work.js';
import { walkFromMap } from './map.js';

export const TMU_S = 0.036;
// MTM-1 body motions, TMU: bend, stoop or kneel on one knee 29.0; arise 31.9; kneel on both knees 69.4; arise 76.7; sit
// 34.7; stand from sitting 43.4; turn body 45–90° (case I) 18.6; sidestep under 30 cm 17.0; walk 15.0 per pace. Hand: reach
// (case A, object at a fixed spot) 6.1 at 10 cm to 18.2 at 80 cm, about 0.24 TMU per cm beyond; grasp an easy object 2.0;
// release 2.0; eye focus 7.3.
export const MTM: Record<string, { tmu: number; does: string }> = {
    sit: { tmu: 34.7, does: 'sits down' }, stand: { tmu: 43.4, does: 'stands up from sitting' },
    bend: { tmu: 29.0, does: 'bends or stoops' }, kneel: { tmu: 29.0, does: 'kneels on one knee' },
    arise: { tmu: 31.9, does: 'straightens up from a bend, stoop or one-knee kneel' },
    kneel_both: { tmu: 69.4, does: 'kneels on both knees' }, arise_both: { tmu: 76.7, does: 'gets up from both knees' },
    turn: { tmu: 18.6, does: 'turns the body 45–90°' }, sidestep: { tmu: 17.0, does: 'sidesteps' },
    grasp: { tmu: 2.0, does: 'grasps' }, release: { tmu: 2.0, does: 'lets go' }, look: { tmu: 7.3, does: 'focuses the eyes' },
};
export const reachTmu = (cm: number) => cm <= 10 ? 6.1 : cm <= 80 ? 6.1 + (cm - 10) * (18.2 - 6.1) / 70 : 18.2 + (cm - 80) * 0.24;

const key = (a: string, b: string) => [a, b].sort().join('|');
/** Shortest walk between two spots through recorded links (Dijkstra); null when they are not joined. */
export function shortest(links: Record<string, number>, from: string, to: string): { m: number; path: string[] } | null {
    const adj: Record<string, [string, number][]> = {};
    for (const [k, m] of Object.entries(links)) { const [a, b] = k.split('|'); (adj[a] ??= []).push([b, m]); (adj[b] ??= []).push([a, m]); }
    const dist: Record<string, number> = { [from]: 0 }, prev: Record<string, string> = {}, done = new Set<string>();
    for (;;) {
        let u: string | null = null; for (const [n, d] of Object.entries(dist)) if (!done.has(n) && (u === null || d < dist[u])) u = n;
        if (u === null) return null;
        if (u === to) { const path = [to]; while (path[0] !== from) path.unshift(prev[path[0]]); return { m: dist[to], path }; }
        done.add(u);
        for (const [v, m] of adj[u] ?? []) if (dist[u] + m < (dist[v] ?? Infinity)) { dist[v] = dist[u] + m; prev[v] = u; }
    }
}
/** Rounds to the digit the spread allows: spread = 10 % of x [ASSUMED]. */
export function honest(seconds: number): string {
    if (seconds <= 0) return '0 s';
    const step = 10 ** Math.floor(Math.log10(seconds * 0.1));
    const v = Math.round(seconds / step) * step, dec = Math.max(0, -Math.floor(Math.log10(step)));
    if (v >= 120) { const m = v / 60; return `${m >= 10 ? Math.round(m) : m.toFixed(1)} min`; }
    return `${v.toFixed(dec)} s`;
}

export interface Step { do: string; to?: string; distance_m?: number; pace?: 'creep'; cm?: number; grade_pct?: number; load_kg?: number; crowd_per_m2?: number; steps?: number; riser_cm?: number; tread_cm?: number }

// Crowds and stairs: the SFPE emergency-movement model (Nelson & Mowrer, SFPE Handbook of Fire Protection Engineering, as
// implemented in Pathfinder, Thunderhead Engineering technical reference): speed along the line of travel = k (1 − 0.266 D),
// D persons per m², unimpeded (0.85 k) below 0.54 per m² [equation as recalled from the Handbook]. k: level 1.40; stairs by
// riser ÷ tread, 7.5/10 in 1.00, 7/11 1.08, 6.5/12 1.16, 6.5/13 1.23, linear to 1.40 at slope 0, beyond 0.75 extended down
// along the last segment to at least 0.034 (Pathfinder). Here the walker's own level speed is scaled by the model's ratios:
// crowd (1 − 0.266 D) ÷ (1 − 0.266 × 0.54), held at D 3.55 (Pathfinder's maximum density); stairs k ÷ 1.40 [ASSUMED: same
// up and down; the SFPE values come from descents].
const STAIR_K: [number, number][] = [[0, 1.40], [0.5, 1.23], [6.5 / 12, 1.16], [7 / 11, 1.08], [0.75, 1.00]];
export function stairK(slope: number): number {
    if (slope >= 0.75) return Math.max(0.034, 1.00 - (1.08 - 1.00) / (0.75 - 7 / 11) * (slope - 0.75));
    for (let i = 1; i < STAIR_K.length; i++) if (slope <= STAIR_K[i][0]) { const [x0, y0] = STAIR_K[i - 1], [x1, y1] = STAIR_K[i]; return y0 + (y1 - y0) * (slope - x0) / (x1 - x0); }
    return 1.00;
}
export const crowdFactor = (d = 0) => d <= 0.54 ? 1 : (1 - 0.266 * Math.min(d, 3.55)) / (1 - 0.266 * 0.54);
/** Runs the steps for one person; returns the seconds taken and one line per step, or an error. Records the new spot. */
export function act(st: State, who: string, p: Person, steps: Step[], country: string | null): { seconds: number; lines: string[]; marks: [number, string][] } | { error: string } {
    let total = 0; const lines: string[] = [], marks: [number, string][] = [];
    for (const s of steps) {
        let t: number, what: string;
        if (s.do === 'walk_to') {
            if (!s.to) return { error: 'walk_to needs to (the spot walked to).' };
            // With a distance given, a walk needs no named start: the time follows from the distance alone.
            if (!p.at && s.distance_m != null) p.at = `where ${who} stood`;
            if (!p.at) return { error: `${who}'s spot is still open: start with {"do":"be_at","to":"<spot>"}, or give distance_m.` };
            if (p.at === s.to) { lines.push(`${who} is already at ${s.to}`); continue; }
            // A seated person rises before walking.
            if (p.posture === 'sitting' && MTM.stand) { const up = MTM.stand.tmu * TMU_S; total += up; lines.push(`${who} ${MTM.stand.does}: ${honest(up)}`); marks.push([total, `${who} stands`]); }
            p.posture = 'standing';
            st.links ??= {};
            const k = key(p.at, s.to), known = st.links[k], via = known == null && s.distance_m == null ? shortest(st.links, p.at, s.to) : null;
            const fromMap = known == null && s.distance_m == null && !via && st.map ? walkFromMap(st.map, p.at, s.to) : null;
            const d = known ?? s.distance_m ?? via?.m ?? fromMap?.m;
            if (d == null || !(d > 0)) return { error: `No distance recorded between ${p.at} and ${s.to}; give distance_m (the scene's layout) or place both spots with Layout, and it is kept for later.` };
            if (fromMap && fromMap.floors !== 0) {
                // Different floors: the level walk, then a storey's stairs per floor (16 steps of 17.8 cm ≈ 2.85 m) [ASSUMED].
                const sub = act(st, who, { ...p, at: undefined } as Person, [{ do: fromMap.floors > 0 ? 'stairs_up' : 'stairs_down', steps: 16 * Math.abs(fromMap.floors), load_kg: s.load_kg, crowd_per_m2: s.crowd_per_m2 }], country);
                if (!('error' in sub)) { total += sub.seconds; lines.push(...sub.lines); }
            }
            if (known == null && !via && !fromMap) st.links[k] = d;
            const v = walkSpeedKmh(p, s.grade_pct ?? 0, 'road', s.load_kg ?? 0, country) / 3.6 * crowdFactor(s.crowd_per_m2) * (s.pace === 'creep' ? kc('creepFactor') : 1);
            t = d / v; what = `walks ${Math.round(d * 10) / 10} m from ${p.at} to ${s.to}${via ? ` (via ${via.path.slice(1, -1).join(', ')})` : fromMap ? ' (from the map)' : ''} at ${v.toFixed(2)} m/s${(s.crowd_per_m2 ?? 0) > 0.54 ? ` (crowd ${s.crowd_per_m2} per m²)` : ''}${known != null && s.distance_m != null && s.distance_m !== known ? ` (recorded distance ${known} m kept; ${s.distance_m} m ignored)` : ''}`;
            p.at = s.to;
        } else if (s.do === 'stairs_up' || s.do === 'stairs_down') {
            if (!s.steps || !(s.steps > 0)) return { error: `${s.do} needs steps (how many; a storey of 2.8 m is about 16).` };
            const r = s.riser_cm ?? 17.8, tr = s.tread_cm ?? 27.9; // 7 in / 11 in [ASSUMED typical]
            const along = s.steps * Math.hypot(r, tr) / 100, k = stairK(r / tr);
            // Up: also no faster than the climb their energy allows at full aerobic power (the §6.7a cost at the stair's grade,
            // spent at VO2max: the limit time of Wu & Wang at relative load 1, 0.213 h) [ASSUMED: a storey or two is climbed at
            // up to VO2max]. Man of 35: 0.51 m/s along a 7/11 stair; woman of 75: 0.18.
            const flat = walkSpeedKmh(p, 0, 'road', s.load_kg ?? 0, country) / 3.6 * k / 1.40;
            const v = (s.do === 'stairs_up' ? Math.min(flat, walkSpeedKmh(p, r / tr * 100, 'road', s.load_kg ?? 0, country, 0.213) / 3.6) : flat) * crowdFactor(s.crowd_per_m2);
            t = along / v; what = `goes ${s.do === 'stairs_up' ? 'up' : 'down'} ${s.steps} steps (${along.toFixed(1)} m along the stair, ${v.toFixed(2)} m/s)`;
            if (s.to) p.at = s.to;
        } else if (s.do === 'be_at') {
            if (!s.to) return { error: 'be_at needs to (the spot).' };
            p.at = s.to; lines.push(`${who} is at ${s.to}`); continue;
        } else if (s.do === 'reach') {
            const cm = s.cm ?? 40; t = reachTmu(cm) * TMU_S; what = `reaches ${cm} cm`;
        } else if ((s.do === 'sit' && p.posture === 'sitting') || ((s.do === 'stand' || s.do === 'arise') && p.posture === 'standing')) {
            lines.push(`${who} is already ${p.posture}`); continue;
        } else if (MTM[s.do]) {
            t = MTM[s.do].tmu * TMU_S; what = MTM[s.do].does;
            if (s.do === 'sit') p.posture = 'sitting'; else if (s.do === 'stand' || s.do === 'arise') p.posture = 'standing';
        } else return { error: `Unknown action "${s.do}". Known: walk_to, be_at, stairs_up, stairs_down, reach, ${Object.keys(MTM).join(', ')}.` };
        total += t; lines.push(`${who} ${what}: ${honest(t)}`); marks.push([total, `${who} ${what.split(' at ')[0].replace(/ from .* to /, ' to ')}`]);
    }
    return { seconds: total, lines, marks };
}

/** Several characters acting over the same span (borrowed from the intentions-then-resolution tick of Thing' Sandbox,
 *  github.com/zebrr/Thing-Sandbox): every actor's steps are timed on one clock; the span lasts as long as the slowest; the
 *  merged timeline says who finishes what first. */
export function actTogether(st: State, actors: { who: string; p: Person; steps: Step[] }[], country: (p: Person) => string | null): { seconds: number; text: string } | { error: string } {
    const backup = structuredClone({ links: st.links, at: actors.map(a => a.p.at) });
    const runs: { who: string; seconds: number; lines: string[]; marks: [number, string][] }[] = [];
    for (const a of actors) {
        const r = act(st, a.who, a.p, a.steps, country(a.p));
        if ('error' in r) { st.links = backup.links; actors.forEach((x, i) => { x.p.at = backup.at[i]; }); return { error: `${a.who}: ${r.error}` }; }
        runs.push({ who: a.who, ...r });
    }
    const seconds = Math.max(0, ...runs.map(r => r.seconds));
    const lines = runs.map(r => `${r.lines.join('; ')} (${honest(r.seconds)} in all)`);
    if (runs.length < 2) return { seconds, text: lines.join(' ') };
    const tl = runs.flatMap(r => r.marks).sort((a, b) => a[0] - b[0]).map(([t, w]) => `${honest(t)} ${w}`);
    return { seconds, text: `${lines.join('. ')}. Timeline: ${tl.join('; ')}` };
}

def({ id: 'creepFactor', value: 0.5, unit: '× walking speed', status: 'assumed', src: 'stealthy walking is slower than ordinary walking (no measured value held)', range: [0.3, 0.7], file: 'actions.ts' });
// An action written in plain words, as steps: each recognized verb in its order in the text gives the motion it names.
// Walking verbs need a distance (the one thing words cannot give); the spot walked to is the phrase after onto / into / to /
// out of, else "outside".
const WORD_STEPS: [RegExp, (who: string, rest: string, d?: number) => Step[] | string][] = [
    [/\b(sit|sits|sat|sitting)\b/, () => [{ do: 'sit' }]],
    [/\b(stand|stands|stood|standing|getting up|get up|gets up|got up|rise|rises|rose)\b/, () => [{ do: 'stand' }]],
    [/\bkneel(s|ed|ing)?\b|\bknelt\b/, () => [{ do: 'kneel' }]],
    [/\b(bend|bends|bent|stoop|stoops|stooped)\b/, () => [{ do: 'bend' }]],
    [/\b(turn|turns|turned)\b/, () => [{ do: 'turn' }]],
    [/\b(pick|picks|picked) up\b|\b(grab|grabs|grabbed|grasp|grasps)\b/, () => [{ do: 'reach' }, { do: 'grasp' }]],
    [/\b(reach|reaches|reached)\b/, () => [{ do: 'reach' }]],
    [/\b(go|goes|going|went|walk|walks|walking|walked|step|steps|stepping|stepped|cross|crosses|crossing|crossed|leave|leaves|leaving|enter|enters|entering|entered|exit|exits|exiting|exited|head|heads|heading|headed|come|comes|coming|came|move|moves|moving|moved|carry|carries|carrying|carried|bring|brings|bringing|brought|fetch|fetches|fetching|fetched|run|runs|running|ran|hurry|hurries|hurried|stroll|strolls|strolled|stride|strides|strode|wander|wanders|wandered|dash|dashes|dashed|return|returns|returned|creep|creeps|creeping|crept|sneak|sneaks|sneaking|sneaked|snuck|tiptoe|tiptoes|tiptoed|crawl|crawls|crawled|steal|steals|stole|slip|slips|slipped|edge|edges|edged)\b/, (who, rest, d) => {
        if (d == null || !(d > 0)) return 'Walking needs distance_m (the distance from the scene).';
        const end = '(?:[,.;]| and | then |$)';
        // The spot keeps the text's own capitals ("Tom's table"): matched on the lower-case text, read from the original.
        const to = rest.match(new RegExp(`\\b(?:onto|into|to|towards?)\\s+(?:the\\s+)?(.+?)${end}`))?.[1]?.trim()
            ?? rest.match(new RegExp(`\\bacross\\s+(?:the\\s+)?(.+?)${end}`))?.[1]?.trim()
            ?? rest.match(/\b(home|back)\b/)?.[1]
            ?? rest.match(new RegExp(`\\b(?:at|by|beside|near)\\s+(?:the\\s+|a\\s+)?(.+?)${end}`))?.[1]?.trim()
            ?? rest.match(new RegExp(`\\bout of\\s+(?:the\\s+)?(.+?)${end}`))?.[1]?.trim().replace(/^/, 'outside ');
        // Creeping, sneaking, tiptoeing, crawling: a slower pace.
        const slow = /^(creep|crept|sneak|snuck|tiptoe|crawl|steal|stole)/.test(rest);
        return [{ do: 'walk_to', to: to || `outside, near where ${who} stood`, distance_m: d, ...slow ? { pace: 'creep' as const } : {} }];
    }],
];
// A distance written in the words: "300 yards", "three hundred yards", "half a mile", "2 km", "fifty feet". Units: metre
// 1, yard 0.9144, foot 0.3048, mile 1609.344, kilometre 1000 (international yard and pound, 1959).
const UNIT: [RegExp, number][] = [[/^(?:m|metres?|meters?)$/, 1], [/^(?:yds?|yards?)$/, 0.9144], [/^(?:ft|feet|foot)$/, 0.3048], [/^(?:mi|miles?)$/, 1609.344], [/^(?:km|kilometres?|kilometers?)$/, 1000]];
const NUM: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100, 'a hundred': 100, 'half a': 0.5, 'a quarter of a': 0.25 };
export function distanceIn(text: string): number | null {
    const m = text.toLowerCase().match(/\b((?:\d+(?:[.,]\d+)?)|half a|a quarter of a|a hundred|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty|fifty|sixty|hundred)(?:\s+(hundred|thousand))?\s*(m|metres?|meters?|yds?|yards?|ft|feet|foot|mi|miles?|km|kilometres?|kilometers?)\b/);
    if (!m) return null;
    let n = /\d/.test(m[1]) ? Number(m[1].replace(',', '.')) : NUM[m[1]];
    if (m[2]) n *= m[2] === 'hundred' ? 100 : 1000;
    const u = UNIT.find(([re]) => re.test(m[3]));
    return u && n > 0 ? Math.round(n * u[1] * 10) / 10 : null;
}
export function stepsFromWords(text: string, who: string, distance?: number): { steps: Step[] } | { error: string } {
    distance ??= distanceIn(text) ?? undefined;
    const t = text.toLowerCase(), found: { at: number; steps: Step[] }[] = [];
    const orig = (low: string | undefined) => { if (!low) return low; const i = t.indexOf(low); return i >= 0 ? text.slice(i, i + low.length) : low; };
    for (const [re, make] of WORD_STEPS) {
        const m = t.match(re); if (!m || m.index == null) continue;
        const r = make(who, t.slice(m.index), distance);
        if (Array.isArray(r)) for (const s of r) if (s.to) s.to = orig(s.to);
        if (typeof r === 'string') return { error: r };
        found.push({ at: m.index, steps: r });
    }
    // A distance given with words whose verb is unknown ("drops down into the garden and slips to the hedge", 8 m) is a move of
    // that distance to the place named.
    if (!found.length && distance != null && distance > 0) {
        const to = text.match(/\b(?:onto|into|to|towards?)\s+(?:the\s+)?(.+?)(?:[,.;]| and | then |$)/i)?.[1]?.trim();
        return { steps: [{ do: 'walk_to', to: to || `a spot ${Math.round(distance)} m from where ${who} stood`, distance_m: distance }] };
    }
    if (!found.length) return { error: `No motion recognized in "${text}": give steps.` };
    return { steps: found.sort((a, b) => a.at - b.at).flatMap(f => f.steps) };
}
