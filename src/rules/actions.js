// Actions take the time their physics gives (docs/df-body-engine.md §6.20). The clock moves only by computed durations:
// duration = amount ÷ rate. A walk is distance ÷ the walker's own speed (§6.7a); a change of posture or a hand motion takes
// its standard time from Methods-Time Measurement (MTM-1 data card, MTM Association 2019; 1 TMU = 0.036 s), the time an
// experienced person takes at normal effort. Positions are named spots; the distance between two spots is recorded the
// first time it is given and reused after, so "leaves the house" from the doorway and from the living room differ.
// Precision: each duration is shown to the digit its spread allows, spread 10 % of the duration [ASSUMED: within-person
// variation of a repeated motion].
import { def, k as kc } from './constants.js';
import { walkSpeedKmh } from './work.js';
import { walkFromMap } from './map.js';
import { topSpeedKmh } from './body-engine.js';
import { NOT_DONE, NEGATIVE_TO, NEGATIVE_GERUND, TWO_WAY, NOT_FACTUAL, PERCEPTION_VERB, CONDITIONAL, notNow, QUESTION_INVERSION, SENSING, LET_US, walkEnd } from './grammar.js';
import { VERBNET } from './data/verbnet.js';
import { QUOTED } from './quotes.js';
export const TMU_S = 0.036;
// MTM-1 body motions, TMU: bend, stoop or kneel on one knee 29.0; arise 31.9; kneel on both knees 69.4; arise 76.7; sit
// 34.7; stand from sitting 43.4; turn body 45–90° (case I) 18.6; sidestep under 30 cm 17.0; walk 15.0 per pace. Hand: reach
// (case A, object at a fixed spot) 6.1 at 10 cm to 18.2 at 80 cm, about 0.24 TMU per cm beyond; grasp an easy object 2.0;
// release 2.0; eye focus 7.3.
export const MTM = {
    sit: { tmu: 34.7, does: 'sits down' }, stand: { tmu: 43.4, does: 'stands up from sitting' },
    bend: { tmu: 29.0, does: 'bends or stoops' }, kneel: { tmu: 29.0, does: 'kneels on one knee' },
    arise: { tmu: 31.9, does: 'straightens up from a bend, stoop or one-knee kneel' },
    kneel_both: { tmu: 69.4, does: 'kneels on both knees' }, arise_both: { tmu: 76.7, does: 'gets up from both knees' },
    turn: { tmu: 18.6, does: 'turns the body 45–90°' }, sidestep: { tmu: 17.0, does: 'sidesteps' },
    // From lying on the ground: onto both knees (kneel on both knees, 69.4, as its reverse motion) then up from both knees
    // (76.7): 146.1 TMU, 5.3 s [ASSUMED composite; MTM-1 has no motion from lying].
    rise_ground: { tmu: 69.4 + 76.7, does: 'gets up from the ground' },
    grasp: { tmu: 2.0, does: 'grasps' }, release: { tmu: 2.0, does: 'lets go' }, look: { tmu: 7.3, does: 'focuses the eyes' },
};
export const reachTmu = (cm) => cm <= 10 ? 6.1 : cm <= 80 ? 6.1 + (cm - 10) * (18.2 - 6.1) / 70 : 18.2 + (cm - 80) * 0.24;
const key = (a, b) => [a, b].sort().join('|');
/** Shortest walk between two spots through recorded links (Dijkstra); null when they are not joined. */
export function shortest(links, from, to) {
    const adj = {};
    for (const [k, m] of Object.entries(links)) {
        const [a, b] = k.split('|');
        (adj[a] ??= []).push([b, m]);
        (adj[b] ??= []).push([a, m]);
    }
    const dist = { [from]: 0 }, prev = {}, done = new Set();
    for (;;) {
        let u = null;
        for (const [n, d] of Object.entries(dist))
            if (!done.has(n) && (u === null || d < dist[u]))
                u = n;
        if (u === null)
            return null;
        if (u === to) {
            const path = [to];
            while (path[0] !== from)
                path.unshift(prev[path[0]]);
            return { m: dist[to], path };
        }
        done.add(u);
        for (const [v, m] of adj[u] ?? [])
            if (dist[u] + m < (dist[v] ?? Infinity)) {
                dist[v] = dist[u] + m;
                prev[v] = u;
            }
    }
}
/** Rounds to the digit the spread allows: spread = 10 % of x [ASSUMED]. */
export function honest(seconds) {
    if (seconds <= 0)
        return '0 s';
    const step = 10 ** Math.floor(Math.log10(seconds * 0.1));
    const v = Math.round(seconds / step) * step, dec = Math.max(0, -Math.floor(Math.log10(step)));
    if (v >= 120) {
        const m = v / 60;
        return `${m >= 10 ? Math.round(m) : m.toFixed(1)} min`;
    }
    return `${v.toFixed(dec)} s`;
}
// Crowds and stairs: the SFPE emergency-movement model (Nelson & Mowrer, SFPE Handbook of Fire Protection Engineering, as
// implemented in Pathfinder, Thunderhead Engineering technical reference): speed along the line of travel = k (1 − 0.266 D),
// D persons per m², unimpeded (0.85 k) below 0.54 per m² [equation as recalled from the Handbook]. k: level 1.40; stairs by
// riser ÷ tread, 7.5/10 in 1.00, 7/11 1.08, 6.5/12 1.16, 6.5/13 1.23, linear to 1.40 at slope 0, beyond 0.75 extended down
// along the last segment to at least 0.034 (Pathfinder). Here the walker's own level speed is scaled by the model's ratios:
// crowd (1 − 0.266 D) ÷ (1 − 0.266 × 0.54), held at D 3.55 (Pathfinder's maximum density); stairs k ÷ 1.40 [ASSUMED: same
// up and down; the SFPE values come from descents].
const STAIR_K = [[0, 1.40], [0.5, 1.23], [6.5 / 12, 1.16], [7 / 11, 1.08], [0.75, 1.00]];
export function stairK(slope) {
    if (slope >= 0.75)
        return Math.max(0.034, 1.00 - (1.08 - 1.00) / (0.75 - 7 / 11) * (slope - 0.75));
    for (let i = 1; i < STAIR_K.length; i++)
        if (slope <= STAIR_K[i][0]) {
            const [x0, y0] = STAIR_K[i - 1], [x1, y1] = STAIR_K[i];
            return y0 + (y1 - y0) * (slope - x0) / (x1 - x0);
        }
    return 1.00;
}
export const crowdFactor = (d = 0) => d <= 0.54 ? 1 : (1 - 0.266 * Math.min(d, 3.55)) / (1 - 0.266 * 0.54);
/** Runs the steps for one person; returns the seconds taken and one line per step, or an error. Records the new spot. */
export function act(st, who, p, steps, country) {
    let total = 0;
    const lines = [], marks = [];
    for (const s of steps) {
        let t, what;
        if (s.do === 'walk_to') {
            if (!s.to)
                return { error: 'walk_to needs to (the spot walked to).' };
            // With a distance given, a walk needs no named start: the time follows from the distance alone.
            if (!p.at && s.distance_m != null)
                p.at = `where ${who} stood`;
            if (!p.at)
                return { error: `${who}'s spot is still open: start with {"do":"be_at","to":"<spot>"}, or give distance_m.` };
            if (p.at === s.to) {
                lines.push(`${who} is already at ${s.to}`);
                continue;
            }
            // A seated person rises before walking.
            if ((p.posture === 'sitting' || p.posture === 'lying') && MTM.stand) {
                const m = p.posture === 'lying' ? MTM.rise_ground : MTM.stand, up = m.tmu * TMU_S;
                total += up;
                lines.push(`${who} ${m.does}: ${honest(up)}`);
                marks.push([total, `${who} stands`]);
            }
            p.posture = 'standing';
            st.links ??= {};
            const k = key(p.at, s.to), known = st.links[k], via = known == null && s.distance_m == null ? shortest(st.links, p.at, s.to) : null;
            const fromMap = known == null && s.distance_m == null && !via && st.map ? walkFromMap(st.map, p.at, s.to) : null;
            const d = known ?? s.distance_m ?? via?.m ?? fromMap?.m;
            if (d == null || !(d > 0))
                return { error: `No distance recorded between ${p.at} and ${s.to}; give distance_m (the scene's layout) or place both spots with Layout, and it is kept for later.` };
            if (fromMap && fromMap.floors !== 0) {
                // Different floors: the level walk, then a storey's stairs per floor (16 steps of 17.8 cm ≈ 2.85 m) [ASSUMED].
                const sub = act(st, who, { ...p, at: undefined }, [{ do: fromMap.floors > 0 ? 'stairs_up' : 'stairs_down', steps: 16 * Math.abs(fromMap.floors), load_kg: s.load_kg, crowd_per_m2: s.crowd_per_m2 }], country);
                if (!('error' in sub)) {
                    total += sub.seconds;
                    lines.push(...sub.lines);
                }
            }
            if (known == null && !via && !fromMap)
                st.links[k] = d;
            // A run or a sprint goes at a share of the runner's own top speed (body-engine topSpeedKmh: flying 20 m sprint
            // times by sex and age); a sprint holds top speed for its first sprintHold_m, then runs.
            const top = s.pace === 'run' || s.pace === 'sprint' ? topSpeedKmh(p) / 3.6 * crowdFactor(s.crowd_per_m2) : 0;
            const v = top ? (s.pace === 'sprint' ? top : top * kc('runFactor')) : walkSpeedKmh(p, s.grade_pct ?? 0, 'road', s.load_kg ?? 0, country) / 3.6 * crowdFactor(s.crowd_per_m2) * (s.pace === 'creep' ? kc('creepFactor') : s.pace === 'brisk' ? briskShare(p) : 1);
            t = s.pace === 'sprint' && d > kc('sprintHold_m') ? kc('sprintHold_m') / top + (d - kc('sprintHold_m')) / (top * kc('runFactor')) : d / v;
            what = `${s.pace === 'run' ? 'runs' : s.pace === 'sprint' ? 'sprints' : s.pace === 'creep' ? 'creeps' : s.pace === 'brisk' ? 'hurries' : 'walks'} ${Math.round(d * 10) / 10} m from ${p.at} to ${s.to}${via ? ` (via ${via.path.slice(1, -1).join(', ')})` : fromMap ? ' (from the map)' : ''} at ${v.toFixed(2)} m/s${(s.crowd_per_m2 ?? 0) > 0.54 ? ` (crowd ${s.crowd_per_m2} per m²)` : ''}${known != null && s.distance_m != null && s.distance_m !== known ? ` (recorded distance ${known} m kept; ${s.distance_m} m ignored)` : ''}`;
            p.at = s.to;
        }
        else if (s.do === 'stairs_up' || s.do === 'stairs_down') {
            if (!s.steps || !(s.steps > 0))
                return { error: `${s.do} needs steps (how many; a storey of 2.8 m is about 16).` };
            const r = s.riser_cm ?? 17.8, tr = s.tread_cm ?? 27.9; // 7 in / 11 in [ASSUMED typical]
            const along = s.steps * Math.hypot(r, tr) / 100, k = stairK(r / tr);
            // Up: also no faster than the climb their energy allows at full aerobic power (the §6.7a cost at the stair's grade,
            // spent at VO2max: the limit time of Wu & Wang at relative load 1, 0.213 h) [ASSUMED: a storey or two is climbed at
            // up to VO2max]. Man of 35: 0.51 m/s along a 7/11 stair; woman of 75: 0.18.
            const flat = walkSpeedKmh(p, 0, 'road', s.load_kg ?? 0, country) / 3.6 * k / 1.40;
            const v = (s.do === 'stairs_up' ? Math.min(flat, walkSpeedKmh(p, r / tr * 100, 'road', s.load_kg ?? 0, country, 0.213) / 3.6) : flat) * crowdFactor(s.crowd_per_m2);
            t = along / v;
            what = `goes ${s.do === 'stairs_up' ? 'up' : 'down'} ${s.steps} steps (${along.toFixed(1)} m along the stair, ${v.toFixed(2)} m/s)`;
            if (s.to)
                p.at = s.to;
        }
        else if (s.do === 'be_at') {
            if (!s.to)
                return { error: 'be_at needs to (the spot).' };
            p.at = s.to;
            lines.push(`${who} is at ${s.to}`);
            continue;
        }
        else if (s.do === 'reach') {
            const cm = s.cm ?? 40;
            t = reachTmu(cm) * TMU_S;
            what = `reaches ${cm} cm`;
        }
        else if ((s.do === 'sit' && p.posture === 'sitting') || ((s.do === 'stand' || s.do === 'arise') && (p.posture === 'standing' || p.posture == null))) {
            // A person the story has not seated or laid down stands [ASSUMED: the baker at his counter "stood up from sitting"].
            lines.push(`${who} is already ${p.posture ?? 'standing'}`);
            continue;
        }
        else if ((s.do === 'stand' || s.do === 'arise') && p.posture === 'lying') {
            t = MTM.rise_ground.tmu * TMU_S;
            what = MTM.rise_ground.does;
            p.posture = 'standing';
        }
        else if (MTM[s.do]) {
            t = MTM[s.do].tmu * TMU_S;
            what = MTM[s.do].does;
            if (s.do === 'sit')
                p.posture = 'sitting';
            else if (s.do === 'stand' || s.do === 'arise')
                p.posture = 'standing';
        }
        else
            return { error: `Unknown action "${s.do}". Known: walk_to, be_at, stairs_up, stairs_down, reach, ${Object.keys(MTM).join(', ')}.` };
        total += t;
        lines.push(`${who} ${what}: ${honest(t)}`);
        marks.push([total, `${who} ${what.split(' at ')[0].replace(/ from .* to /, ' to ')}`]);
    }
    return { seconds: total, lines, marks };
}
/** Several characters acting over the same span (borrowed from the intentions-then-resolution tick of Thing' Sandbox,
 *  github.com/zebrr/Thing-Sandbox): every actor's steps are timed on one clock; the span lasts as long as the slowest; the
 *  merged timeline says who finishes what first. */
export function actTogether(st, actors, country) {
    const backup = structuredClone({ links: st.links, at: actors.map(a => a.p.at), posture: actors.map(a => a.p.posture) });
    const runs = [];
    for (const a of actors) {
        const r = act(st, a.who, a.p, a.steps, country(a.p));
        if ('error' in r) {
            st.links = backup.links;
            actors.forEach((x, i) => { x.p.at = backup.at[i]; x.p.posture = backup.posture[i]; });
            return { error: `${a.who}: ${r.error}` };
        }
        runs.push({ who: a.who, ...r });
    }
    const seconds = Math.max(0, ...runs.map(r => r.seconds));
    const lines = runs.map(r => `${r.lines.join('; ')} (${honest(r.seconds)} in all)`);
    if (runs.length < 2)
        return { seconds, text: lines.join(' ') };
    const tl = runs.flatMap(r => r.marks).sort((a, b) => a[0] - b[0]).map(([t, w]) => `${honest(t)} ${w}`);
    return { seconds, text: `${lines.join('. ')}. Timeline: ${tl.join('; ')}` };
}
def({ id: 'creepFactor', value: 0.5, unit: '× walking speed', status: 'assumed', src: 'stealthy walking is slower than ordinary walking (no measured value held)', range: [0.3, 0.7], file: 'actions.ts' });
def({ id: 'runFactor', value: 0.46, unit: '× own top speed', status: 'fitted', src: 'a run at the speed runners choose: free-living runners chose the speed that costs them least energy per metre, 2.65 m/s for women and 3.35 m/s for men among healthy young adults (Selinger, Hicks, Jackson, Wall-Scheffler, Chang & Delp 2022, Current Biology 32:2309–2315, as reported by Popular Science; the paper\'s own pages could not be read), over the engine\'s mean top speed at 25 (body-engine topSpeedKmh: 5.79 and 7.27 m/s): 0.457 and 0.461', range: [0.4, 0.55], file: 'actions.ts' });
// Walking as fast as one can without running ("hurry", "rush"): Bohannon 1997 (Age Ageing 26:15, 230 healthy adults over
// 7.62 m, Table 4, cm/s, read in full from the academia.edu copy), maximum over comfortable speed by sex and decade, 20s to
// 70s; the 20s' share under 20, the 70s' from 80.
const BRISK = {
    male: [[139.3, 253.3], [145.8, 245.6], [146.2, 246.2], [139.3, 206.9], [135.9, 193.3], [133.0, 207.9]],
    female: [[140.7, 246.7], [141.5, 234.2], [139.1, 212.3], [139.5, 201.0], [129.6, 177.4], [127.2, 174.9]],
};
export function briskShare(p) {
    const rows = BRISK[p.sex ?? ''] ?? BRISK.male.map((m, i) => [(m[0] + BRISK.female[i][0]) / 2, (m[1] + BRISK.female[i][1]) / 2]);
    const [comfortable, max] = rows[Math.max(0, Math.min(5, Math.floor(((p.age ?? 30) - 20) / 10)))];
    return max / comfortable;
}
def({ id: 'sprintHold_m', value: 100, unit: 'm', status: 'assumed', src: 'untrained adults hold top speed for about 100 m before slowing (no measured value held)', range: [60, 200], file: 'actions.ts' });
// An action written in plain words, as steps: each recognized verb in its order in the text gives the motion it names.
// Walking verbs need a distance (the one thing words cannot give); the spot walked to is where the grammar of the walk's
// prepositions puts its end (grammar.ts walkEnd: goal, source, path, direction; CGEL ch. 8 §4.3).
const isVerbLemma = (w) => !!VERBNET[w];
const WORD_STEPS = [
    [/\b(sit|sits|sat|sitting)\b/, () => [{ do: 'sit' }]],
    [/\b(stand|stands|stood|standing|getting up|get up|gets up|got up|rise|rises|rose)\b/, () => [{ do: 'stand' }]],
    [/\bkneel(s|ed|ing)?\b|\bknelt\b/, () => [{ do: 'kneel' }]],
    [/\b(bend|bends|bent|stoop|stoops|stooped)\b/, () => [{ do: 'bend' }]],
    [/\b(turn|turns|turned)\b/, () => [{ do: 'turn' }]],
    [/\b(pick|picks|picked) up\b|\b(grab|grabs|grabbed|grasp|grasps)\b/, () => [{ do: 'reach' }, { do: 'grasp' }]],
    [/\b(reach|reaches|reached)\b/, () => [{ do: 'reach' }]],
    [/\b(go|goes|going|went|walk|walks|walking|walked|step|steps|stepping|stepped|cross|crosses|crossing|crossed|leave|leaves|leaving|enter|enters|entering|entered|exit|exits|exiting|exited|head|heads|heading|headed|come|comes|coming|came|move|moves|moving|moved|carry|carries|carrying|carried|bring|brings|bringing|brought|fetch|fetches|fetching|fetched|run|runs|running|ran|jog|jogs|jogging|jogged|sprint|sprints|sprinting|sprinted|hurry|hurries|hurrying|hurried|rush|rushes|rushing|rushed|hasten|hastens|hastening|hastened|stroll|strolls|strolled|stride|strides|strode|wander|wanders|wandered|dash|dashes|dashed|return|returns|returned|creep|creeps|creeping|crept|sneak|sneaks|sneaking|sneaked|snuck|tiptoe|tiptoes|tiptoed|crawl|crawls|crawled|steal|steals|stole|slip|slips|slipped|edge|edges|edged)\b/, (who, rest, d, before = '') => {
            if (d == null || !(d > 0))
                return 'Walking needs distance_m (the distance from the scene).';
            // The spot keeps the text's own capitals ("Tom's table"): matched on the lower-case text, read from the original.
            const to = walkEnd(rest, d, who, before, isVerbLemma);
            // The verb's pace: creeping, sneaking, tiptoeing, crawling slower; hurrying, rushing, hastening as fast as one walks;
            // running and jogging a run; sprinting and dashing a sprint [ASSUMED: dash as a sprint, hurry as the fastest walk];
            // the rest a walk.
            const pace = /^(creep|crept|sneak|snuck|tiptoe|crawl|steal|stole)/.test(rest) ? 'creep' : /^(hurr|rush|hasten)/.test(rest) ? 'brisk' : /^(sprint|dash)/.test(rest) ? 'sprint' : /^(run|ran|jog)/.test(rest) ? 'run' : null;
            return [{ do: 'walk_to', to, distance_m: d, ...pace ? { pace } : {} }];
        }],
];
/** The words an Act's action can begin with, as a pattern: a motion or posture verb the action reader times (WORD_STEPS),
 *  each form it lists. The plan schema gives Act's action this pattern, so an action is a motion by its shape. */
// Plain groups and no \\b: the endpoint's grammar engine takes the pattern features the time pattern uses. The grammar
// matches the whole string, so the pattern ends with the rest of the action (a pattern that stopped after the verb cut
// "steps out onto the street" to "steps").
export const MOTION_START = `^(${[...new Set([...WORD_STEPS.flatMap(([re]) => re.source.replace(/\\b/g, '').replace(/[()]/g, '').split('|').map(w => w.replace(/\(s\|ed\|ing\)\?|s\|ed\|ing|\?/g, '').trim()).filter(w => /^[a-z ]{3,}$/.test(w) && w !== 'ing')), 'kneel', 'kneeling', 'kneeled'])].join('|')})([ ,][^"]*)?$`;
// A distance written in the words: "300 yards", "three hundred yards", "half a mile", "2 km", "fifty feet". Units: metre
// 1, yard 0.9144, foot 0.3048, mile 1609.344, kilometre 1000 (international yard and pound, 1959).
const UNIT = [[/^(?:m|metres?|meters?)$/, 1], [/^(?:yds?|yards?)$/, 0.9144], [/^(?:ft|feet|foot)$/, 0.3048], [/^(?:mi|miles?)$/, 1609.344], [/^(?:km|kilometres?|kilometers?)$/, 1000]];
const NUM = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, hundred: 100, 'a hundred': 100, 'half a': 0.5, 'a quarter of a': 0.25 };
export function distanceIn(text) {
    // A number in figures may touch its unit ("50m"); a number in words is a word of its own ("a mile", not the "a m" of "I am").
    const m = text.toLowerCase().match(/\b((?:\d+(?:[.,]\d+)?)(?=(?:\s+(?:hundred|thousand))?\s*(?:m|metres?|meters?|yds?|yards?|ft|feet|foot|mi|miles?|km|kilometres?|kilometers?)\b)|(?:half a|a quarter of a|a hundred|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty|fifty|sixty|hundred)(?=(?:\s+(?:hundred|thousand))?\s+(?:m|metres?|meters?|yds?|yards?|ft|feet|foot|mi|miles?|km|kilometres?|kilometers?)\b))(?:\s+(hundred|thousand))?\s*(m|metres?|meters?|yds?|yards?|ft|feet|foot|mi|miles?|km|kilometres?|kilometers?)\b/);
    if (!m)
        return null;
    let n = /\d/.test(m[1]) ? Number(m[1].replace(',', '.')) : NUM[m[1]];
    if (m[2])
        n *= m[2] === 'hundred' ? 100 : 1000;
    const u = UNIT.find(([re]) => re.test(m[3]));
    return u && n > 0 ? Math.round(n * u[1] * 10) / 10 : null;
}
// An act the line says is not done, in its own clause, by the grammar's negators (grammar.ts: CGEL ch. 9 — not, n't, never,
// no longer, cannot; avoid, decline, fail, forget, neglect, omit, refrain; keep, prevent, stop, prohibit, ban, hinder … from;
// without; too … to; almost, nearly, practically — and refuse, Karttunen 2012): "I don't hit him", "I fail to climb the wall",
// "I refrain from hitting him", "I almost fall". A two-way implicative under negation says the act was done ("I didn't
// forget to lock the door").
const NOT_DONE_RE = new RegExp(NOT_DONE, 'i'), NEG_TO_RE = new RegExp(String.raw `\b${NEGATIVE_TO}\s+to\s+$`, 'i'), NEG_GER_RE = new RegExp(NEGATIVE_GERUND, 'i'), NOT_FACTUAL_RE = new RegExp(NOT_FACTUAL, 'i');
// An act under a modal of possibility, necessity or volition is not said to be done, nor one in a sentence with a condition
// (grammar.ts: CGEL ch. 3 §9.1, ch. 8 §14): "I could hit him", "Can I climb the wall?", "I hit Tom if he moves". "I can see
// the rider" is seen. Nor is an act the words put at another time than now — a habit, a past or future time, used to, about
// to (grammar.ts notNow: CGEL ch. 3 §4.2, ch. 8 §§6.2, 9) — an act asked about (a question, CGEL ch. 10 §2, §4.7.2), nor one
// proposed (let's, ch. 10 §9.3.2).
export function undone(text, at) {
    // Quoted words are blanked to the same length, so positions in the line stay where they are.
    const plain = text.replace(QUOTED, q => ','.padEnd(q.length, ' '));
    const sentence = plain.slice(0, at).split(/[.!?;]/).pop() + plain.slice(at).split(/[.!?;]/)[0];
    if (CONDITIONAL.test(sentence))
        return true;
    if (notNow(text, at))
        return true;
    const head = plain.slice(0, at).split(/[,.;:!?]|\b(?:and|but|then)\b/).pop() ?? '';
    const verb = /^[a-z]+(?: out)?/i.exec(plain.slice(at))?.[0].toLowerCase() ?? '';
    if (NOT_FACTUAL_RE.test(head) && !(/\b(?:can|could)\s+$/i.test(head) && PERCEPTION_VERB.test(verb)))
        return true;
    // A question: an auxiliary before the subject ("Can I climb the wall?", "Do I walk to the door?") or a question mark ending
    // the sentence — save one of perception, which the look or the listening answers ("Do I see anyone?").
    if ((QUESTION_INVERSION.test(head) || plain.slice(at).match(/[.!?;]/)?.[0] === '?') && !SENSING.test(verb))
        return true;
    if (LET_US.test(plain.slice(0, at)))
        return true;
    if (NOT_DONE_RE.test(head))
        return true;
    const m = NEG_TO_RE.exec(head) ?? NEG_GER_RE.exec(head);
    if (!m)
        return false;
    return !(TWO_WAY.test(m[0].trim()) && NOT_DONE_RE.test(head.slice(0, m.index)));
}
/** The first place a verb pattern stands in the text where the words do not say the act is not done ("I refuse to run, and
 *  walk 10 m": the walk, not the run). */
const doneMatch = (t, re) => [...t.matchAll(new RegExp(re.source, re.flags.replace('g', '') + 'g'))].find(m => !undone(t, m.index));
/** Where the first motion or posture verb the action reader knows, said as done, stands in the text, or -1. */
export function motionAt(text) {
    const t = text.toLowerCase(), at = WORD_STEPS.map(([re]) => doneMatch(t, re)?.index ?? -1).filter(i => i >= 0);
    return at.length ? Math.min(...at) : -1;
}
// A leg of a walk: a distance and where it goes ("5 m to the door", "then 10 m to the gate").
const LEG = /\b(?:\d+(?:[.,]\d+)?(?:\s+(?:hundred|thousand))?\s*|(?:half a|a quarter of a|a hundred|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty|fifty|sixty|hundred)(?:\s+(?:hundred|thousand))?\s+)(?:m|metres?|meters?|yds?|yards?|ft|feet|foot|mi|miles?|km|kilometres?|kilometers?)\s+(?:back\s+)?(?:to|towards?|onto|into|across)\s+(?:the\s+)?(.+?)(?=[,.;]| and | then |$)/gi;
/** The legs of a walk the words give each with its own distance and end; one or none means a single walk. */
export function legsIn(text) {
    // Each leg's end by the same grammar as a whole walk's (grammar.ts walkEnd): "5 m towards the door" ends short of the door.
    return [...text.matchAll(LEG)].map(m => { const d = distanceIn(m[0]) ?? 0; return { distance_m: d, to: d > 0 ? walkEnd(m[0].toLowerCase(), d, 'the walker', '', isVerbLemma) : m[1].trim() }; }).filter(l => l.distance_m > 0);
}
export function stepsFromWords(text, who, distance) {
    distance ??= distanceIn(text) ?? undefined;
    const t = text.toLowerCase(), found = [];
    const orig = (low) => { if (!low)
        return low; const i = t.indexOf(low); return i >= 0 ? text.slice(i, i + low.length) : low; };
    for (const [re, make] of WORD_STEPS) {
        // A verb the words say is not done gives no step ("I don't run. I walk 10 m to the door." walks).
        const m = doneMatch(t, re);
        if (!m || m.index == null)
            continue;
        const r = make(who, t.slice(m.index), distance, t.slice(0, m.index));
        if (Array.isArray(r))
            for (const s of r)
                if (s.to)
                    s.to = orig(s.to);
        if (typeof r === 'string')
            return { error: r };
        found.push({ at: m.index, steps: r });
    }
    // A distance given with words whose verb is unknown ("drops down into the garden and slips to the hedge", 8 m) is a move of
    // that distance to the place named; a climb, jump or swim is BodyCheck's, never a walk ("jumps to the next roof, 2 m").
    // A known verb the words say is not done ("I don't walk 10 m to the door") is no move of unknown kind either.
    if (!found.length && distance != null && distance > 0 && !WORD_STEPS.some(([re]) => re.test(t)) && !/\b(?:climb|jump|leap|vault|scal(?:e|es|ed|ing)\b|swim|swam|clamber|scrambl)/i.test(text)) {
        const to = text.match(/\b(?:onto|into|to|towards?)\s+(?:the\s+)?(.+?)(?:[,.;]| and | then |$)/i)?.[1]?.trim();
        return { steps: [{ do: 'walk_to', to: to || `a spot ${Math.round(distance)} m from where ${who} stood`, distance_m: distance }] };
    }
    if (!found.length)
        return { error: `No motion recognized in "${text}": give steps.` };
    // Two legs or more, each with its distance and end: one walk per leg, at the verb's pace.
    const legs = legsIn(text);
    return { steps: found.sort((a, b) => a.at - b.at).flatMap(f => f.steps).flatMap(s => s.do === 'walk_to' && legs.length > 1 ? legs.map(l => ({ ...s, ...l })) : [s]) };
}
