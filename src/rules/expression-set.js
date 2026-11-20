// The set of looks a character's picture takes (2026-11-19, section 111; the player's picks: the least images for the most
// results; one set for every character and every chat, from counts pooled over the chats and kept until recomputed; the
// states they will have, computed from the engine's own input and not from feeling words, which are one more lossy layer; faces
// taken apart into the Facial Action Coding System's units, so a face English has no word for is one more combination; how
// strongly a face moves, and whether a body state shares a feeling's image, left to the formula).
//
// The input. A feeling: Appraise's answers (rules-tools.ts; emotion.ts occTypes): what it is about (ABOUT), and for that,
// whether the event is good for the one it affects, whether the character wants it for them, whether it came true, whether
// the action is praiseworthy and what its result is for them, whether the thing is appealing; whether it came suddenly; for a
// bad outcome, whether anyone could still change it and whether the character could; and how much it matters (touched or
// central). The body (body-engine.ts): pain (a wound younger than painFaceMin, an unrepaired peritonitis, a venom that pains,
// in a body that feels pain), sleepiness (the Karolinska scale at 7, "sleepy, but no effort to keep awake", or more, from the
// hours awake and the hour), eyes closed (unconscious, or asleep by their day).
// The face. A feeling's units are those the component process model predicts for the appraisal outcomes it holds, together
// (Scherer et al. 2019, Front Psychol 10:508, Table 1, after Scherer et al. 2018; control and power as Gentsch, Grandjean &
// Scherer 2015, PLOS ONE 10:e0135837, Table 1; suddenness as the model's summary in Delplanque et al. 2009): conducive 12 25;
// obstructive 4 7 17 23; intrinsically pleasant 5 26 38; unpleasant 4 7 9 10 15 17 24 39; no control 15 25 26 41 43; control
// and high power 4 5 23 25; control and low power 1 2 5 20 26 38; sudden 1 2 (where a table gives two patterns, the first
// [ASSUMED]; coping checked for a bad outcome only [ASSUMED]). The models give none for norms; their displays are read from
// the studies of them, in FACS head and eye codes: one's own action praised, a small smile with the head tilted back (12, 53;
// Tracy & Robins 2004, Psychol Sci 15:194), one's own action blamed, the head and the gaze down (54, 64; Keltner 1995, J Pers
// Soc Psychol 68:441); another's action judged moves nothing. Each at the feeling's strength (1 central, 0.5 touched), as
// perceived intensity follows the face's physical intensity linearly (Hess, Blairy & Kleck 1997, J Nonverbal Behav 21:241).
// The body's: pain the core pain units, 4, 6 or 7, 9 or 10, 43 (Prkachin 1992, Pain 51:297; the first of each pair
// [ASSUMED]); sleepiness the five units that best told drowsy from alert, 45, 18, head roll (55), 7, 9 (Vural et al. 2010,
// ICPR); each at full strength [ASSUMED]; eyes closed 43 and nothing else, a face that sleeps showing no feeling [ASSUMED].
// A feeling's face and the body's together: each unit at the stronger of the two.
// Two faces are alike as a Gaussian of the distance between them, width expressionSigma [ASSUMED: one unit fully apart alike
// by e^(−1/2) at width 1]; states with the same face are one meaning.
// The set: the information bottleneck (Tishby, Pereira & Bialek 1999; as Zaslavsky, Kemp, Regier & Tishby 2018, PNAS
// 115:7937 found languages' colour words near its optimum): looks W for faces M minimise I(M;W) − β I(W;U), the looks' cost in
// bits against what they tell of the face. Solved hard, by the agglomerative information bottleneck (Slonim & Tishby 1999, NIPS
// 12): from each face its own look, the two looks whose merging loses least of what they tell (their weight times the
// Jensen–Shannon divergence of their meanings) are merged, one pair at a time, down to one look; for looks held hard their cost
// is the entropy of how often each comes. The number of looks is taken at the knee of the curve of what they tell against
// their cost, both scaled to 0–1, the point farthest above the line between its ends (Kneedle, Satopää et al. 2011)
// [ASSUMED rule]. How often each state comes: the counts given (how often each was seen on a character when a reply came), each
// state counted once more as an even start: every appraisal alike at each strength, shared among its ways of coming and of
// coping, calm as one more, all on a body that is well; a body state weighs only as often as it has been seen [ASSUMED: no
// state of the body is taken for common before it is seen; an even share made pain, sleepiness and closed eyes four-fifths of
// all faces]. A look's face is the one its states show most often; the look
// that holds the face that moves nothing is calm's.
import { def, k, peek } from './constants.js';
import { ABOUT, occTypes } from './emotion.js';
import { sleepinessKss, hourOfDay, creatureOf } from './body-engine.js';
import { doingAt } from './days.js';
def({ id: 'expressionSigma', value: 1, unit: 'width of likeness between faces, in action units fully apart', status: 'assumed', src: 'one unit fully apart alike by e^(−1/2) [ASSUMED]', range: [0.75, 1.5], file: 'expression-set.ts' });
def({ id: 'painFaceMin', value: 60, unit: 'minutes a wound shows on the face', status: 'assumed', src: 'pain shows in the face while it is acute [ASSUMED]', range: [15, 240], file: 'expression-set.ts' });
def({ id: 'sleepyKss', value: 7, unit: 'Karolinska sleepiness from which the face shows it', status: 'assumed', src: 'the scale\'s "sleepy, but no effort to keep awake" [ASSUMED: where drowsiness shows]', range: [6, 8], file: 'expression-set.ts' });
/** The FACS units the faces use, by number, with the manual's names (head and eye position codes among them). */
export const AU_NAMES = { 1: 'inner brow raiser', 2: 'outer brow raiser', 4: 'brow lowerer', 5: 'upper lid raiser', 6: 'cheek raiser', 7: 'lid tightener', 9: 'nose wrinkler',
    10: 'upper lip raiser', 12: 'lip corner puller', 15: 'lip corner depressor', 17: 'chin raiser', 18: 'lip puckerer', 20: 'lip stretcher', 23: 'lip tightener', 24: 'lip pressor', 25: 'lips part',
    26: 'jaw drop', 38: 'nostril dilator', 39: 'nostril compressor', 41: 'lid droop', 43: 'eyes closed', 45: 'blink', 53: 'head up', 54: 'head down', 55: 'head tilt', 64: 'eyes down' };
export const AUS = Object.keys(AU_NAMES).map(Number);
const CPM = { conducive: [12, 25], obstructive: [4, 7, 17, 23], pleasant: [5, 26, 38], unpleasant: [4, 7, 9, 10, 15, 17, 24, 39],
    noControl: [15, 25, 26, 41, 43], highPower: [4, 5, 23, 25], lowPower: [1, 2, 5, 20, 26, 38], sudden: [1, 2], ownPraised: [12, 53], ownBlamed: [54, 64] };
const BODY_UNITS = { pain: [4, 6, 9, 43], sleepy: [7, 9, 18, 45, 55], eyesClosed: [43] };
/** How good the outcome is for the character, from the answers: 1 conducive, −1 obstructive, 0 none (a judgement alone, or a
 *  thing, whose appeal is its pleasantness instead). */
export function conduciveness(s) {
    const a = ABOUT.indexOf(s.about);
    if (a === 0 || a === 2)
        return (s.good ?? true) ? 1 : -1;
    if (a === 1)
        return (s.wants ?? true) ? 1 : -1;
    if (a === 3)
        return (s.good ?? true) === (s.cameTrue ?? true) ? 1 : -1;
    if (a === 4 || a === 5)
        return s.result === 'good' ? 1 : s.result === 'bad' ? -1 : 0;
    return 0;
}
/** Every feeling the input allows: each combination of the answers that apply, sudden or not, a bad outcome with each way of
 *  coping (unanswered, no control, control with the character's power, control without it), at both strengths. */
export function allStates() {
    const out = [], B = [true, false];
    const add = (a) => {
        const copings = conduciveness({ ...a, strength: 1 }) < 0 ? [{}, { control: false }, { control: true, power: true }, { control: true, power: false }] : [{}];
        for (const c of copings)
            for (const sudden of B)
                for (const strength of [0.5, 1])
                    out.push({ ...a, ...c, sudden, strength });
    };
    for (const good of B)
        add({ about: ABOUT[0], good });
    for (const good of B)
        for (const wants of B)
            add({ about: ABOUT[1], good, wants });
    for (const good of B)
        add({ about: ABOUT[2], good });
    for (const good of B)
        for (const cameTrue of B)
            add({ about: ABOUT[3], good, cameTrue });
    for (const about of [ABOUT[4], ABOUT[5]])
        for (const praiseworthy of B)
            for (const result of ['none', 'good', 'bad'])
                add({ about, praiseworthy, result });
    for (const appealing of B)
        add({ about: ABOUT[6], appealing });
    return out;
}
/** The body states a look can hold. */
export const BODY_STATES = [{}, { pain: true }, { sleepy: true }, { pain: true, sleepy: true }, { eyesClosed: true }];
/** A feeling's key: its answers in a fixed order ('calm' for none). */
export const stateKey = (s) => s ? [s.about, s.good, s.wants, s.cameTrue, s.praiseworthy, s.result, s.appealing, s.sudden, s.control, s.power, s.strength].map(x => x ?? '').join('|') : 'calm';
export const bodyKey = (b) => [b.pain ? 'pain' : '', b.sleepy ? 'sleepy' : '', b.eyesClosed ? 'eyes closed' : ''].filter(Boolean).join('+') || 'well';
/** A look's state: a feeling (or calm) with a body state. */
export const jointKey = (s, b) => `${stateKey(s)}#${bodyKey(b)}`;
/** The OCC type the engine names a feeling by (emotion.ts occTypes, the main one). */
export const typeOf = (s) => occTypes({ about: s.about, good: s.good ?? true, wants: s.wants ?? true, cameTrue: s.cameTrue ?? true, praiseworthy: s.praiseworthy ?? true, result: s.result ?? 'none', appealing: s.appealing ?? true })?.[0] ?? '';
/** The units a feeling moves (each 1 when it moves); the feeling's strength is how strongly. */
export function feelingUnits(s) {
    const on = new Set(), c = conduciveness(s), a = ABOUT.indexOf(s.about);
    const add = (us) => us.forEach(u => on.add(u));
    if (c > 0)
        add(CPM.conducive);
    if (c < 0) {
        add(CPM.obstructive);
        if (s.control === false)
            add(CPM.noControl);
        else if (s.control === true && s.power != null)
            add(s.power ? CPM.highPower : CPM.lowPower);
    }
    if (a === 6)
        add((s.appealing ?? true) ? CPM.pleasant : CPM.unpleasant);
    if (a === 4)
        add((s.praiseworthy ?? true) ? CPM.ownPraised : CPM.ownBlamed);
    if (s.sudden)
        add(CPM.sudden);
    return AUS.filter(u => on.has(u));
}
/** The face of a feeling (or calm) with a body state: each unit's intensity, 0 to 1, the stronger of the two parts; eyes
 *  closed shows no feeling. */
export function faceOf(s, b) {
    const f = Object.fromEntries(AUS.map(u => [u, 0]));
    if (b.eyesClosed) {
        for (const u of BODY_UNITS.eyesClosed)
            f[u] = 1;
        return f;
    }
    if (s)
        for (const u of feelingUnits(s))
            f[u] = Math.max(f[u], s.strength);
    for (const part of ['pain', 'sleepy'])
        if (b[part])
            for (const u of BODY_UNITS[part])
                f[u] = 1;
    return f;
}
const faceVector = (s, b) => { const f = faceOf(s, b); return AUS.map(u => f[u]); };
/** Every state of a look: the feelings and calm, each with every body state, its key, face and even-start weight. */
function allJoint() {
    const feelings = allStates(), base = (s) => stateKey({ ...s, sudden: undefined, control: undefined, power: undefined });
    const n = new Map();
    for (const s of feelings)
        n.set(base(s), (n.get(base(s)) ?? 0) + 1);
    const out = [];
    for (const b of BODY_STATES) {
        const well = !b.pain && !b.sleepy && !b.eyesClosed;
        out.push({ s: null, b, key: jointKey(null, b), v: faceVector(null, b), w: well ? 2 : 0 });
        for (const s of feelings)
            out.push({ s, b, key: jointKey(s, b), v: faceVector(s, b), w: well ? 1 / n.get(base(s)) : 0 });
    }
    return out;
}
/** The information bottleneck over the faces, with how often each state comes (`counts` by jointKey). */
export function expressionSet(counts = {}, sigma = k('expressionSigma')) {
    // States with one face are one meaning: their weights add.
    const faces = new Map();
    for (const j of allJoint()) {
        const key = j.v.join(','), f = faces.get(key) ?? faces.set(key, { v: j.v, p: 0, keys: [], ws: [] }).get(key), w = j.w + (counts[j.key] ?? 0);
        f.p += w;
        f.keys.push(j.key);
        f.ws.push(w);
    }
    const M = [...faces.values()].filter(f => f.p > 0), n = M.length, F = M.map(f => f.v);
    const p = M.map(f => f.p), tot = p.reduce((a, b) => a + b, 0);
    for (let i = 0; i < n; i++)
        p[i] /= tot;
    // Each face's meaning: a Gaussian of likeness over the faces, by the distance between them.
    const mu = M.map((_, i) => { const row = M.map((__, j) => Math.exp(-F[i].reduce((a, x, d) => a + (x - F[j][d]) ** 2, 0) / (2 * sigma * sigma))), s = row.reduce((a, b) => a + b, 0); return row.map(x => x / s); });
    const pu = M.map((_, u) => M.reduce((a, __, m) => a + p[m] * mu[m][u], 0));
    // The agglomerative bottleneck: clusters of faces, each with its weight and its meaning (the weighted mean of its faces').
    const P = Float64Array.from(p), mean = mu.map(r => Float64Array.from(r)), members = M.map((_, i) => [i]), alive = new Uint8Array(n).fill(1);
    const kl = (a, b) => { let x = 0; for (let u = 0; u < n; u++)
        if (a[u] > 0)
            x += a[u] * Math.log2(a[u] / b[u]); return x; };
    const loss = (i, j) => {
        const w = P[i] + P[j], a = P[i] / w, b = P[j] / w, m = new Float64Array(n);
        for (let u = 0; u < n; u++)
            m[u] = a * mean[i][u] + b * mean[j][u];
        return w * (a * kl(mean[i], m) + b * kl(mean[j], m));
    };
    const cost = new Float64Array(n * n).fill(Infinity);
    for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
            cost[i * n + j] = loss(i, j);
    const blank = M.findIndex(f => f.v.every(x => x === 0)), pU = Float64Array.from(pu);
    const curve = [];
    const point = () => {
        let h = 0, tells = 0;
        const looks = [];
        for (let i = 0; i < n; i++) {
            if (!alive[i])
                continue;
            h -= P[i] * Math.log2(P[i]);
            tells += P[i] * kl(mean[i], pU);
            const ms = members[i], keys = ms.flatMap(m => M[m].keys), weights = ms.flatMap(m => M[m].ws), total = ms.reduce((a, m) => a + M[m].p, 0);
            // The look's face: each unit at the strength most of the look's weight shows it (the weighted median).
            const face = {};
            AUS.forEach((u, d) => { const vals = ms.map(m => [M[m].v[d], M[m].p]).sort((x, y) => x[0] - y[0]); let acc = 0; for (const [x, w] of vals) {
                acc += w;
                if (acc * 2 >= total) {
                    face[u] = x;
                    break;
                }
            } });
            looks.push({ keys, weights, face, calm: ms.includes(blank) });
        }
        curve.push({ cost: h, tells, looks });
    };
    point();
    for (let left = n; left > 1; left--) {
        let bi = -1, bj = -1, best = Infinity;
        for (let i = 0; i < n; i++)
            if (alive[i])
                for (let j = i + 1; j < n; j++)
                    if (alive[j] && cost[i * n + j] < best) {
                        best = cost[i * n + j];
                        bi = i;
                        bj = j;
                    }
        const w = P[bi] + P[bj];
        for (let u = 0; u < n; u++)
            mean[bi][u] = (P[bi] * mean[bi][u] + P[bj] * mean[bj][u]) / w;
        P[bi] = w;
        members[bi] = [...members[bi], ...members[bj]];
        alive[bj] = 0;
        for (let k2 = 0; k2 < n; k2++)
            if (alive[k2] && k2 !== bi) {
                const [a, b] = k2 < bi ? [k2, bi] : [bi, k2];
                cost[a * n + b] = loss(a, b);
            }
        point();
    }
    // The knee: the point farthest above the line between the curve's ends, cost and tells each scaled to 0–1.
    const cs = curve.map(c => c.cost), ts = curve.map(c => c.tells), [c0, c1, t0, t1] = [Math.min(...cs), Math.max(...cs), Math.min(...ts), Math.max(...ts)];
    const lift = (c) => ((c.tells - t0) / (t1 - t0 || 1)) - ((c.cost - c0) / (c1 - c0 || 1));
    const knee = curve.reduce((b, c) => lift(c) > lift(b) ? c : b, curve[0]);
    return { curve, knee, sigma };
}
/** A look's face as text: its moving units by number, at half strength marked so. */
export const faceText = (f) => AUS.filter(u => f[u] > 0).map(u => `${u}${f[u] < 1 ? '½' : ''}`).join(' ');
/** A look in words: its units with the manual's names, and the engine's feelings and body states it covers. */
export function lookWords(l) {
    const units = AUS.filter(u => l.face[u] > 0), feelings = new Set(), bodies = new Set();
    for (const key of l.keys) {
        const [f, b] = key.split('#');
        if (b !== 'well')
            bodies.add(b);
        if (f === 'calm')
            continue;
        const s = parseState(f);
        if (s)
            feelings.add(`${typeOf(s)}${s.strength < 1 ? ' (touched)' : ''}`);
    }
    return `${l.calm ? 'calm: ' : ''}${units.length ? `AU ${faceText(l.face)} (${units.map(u => AU_NAMES[u]).join(', ')})` : 'no unit moved'}${feelings.size ? `; feelings: ${[...feelings].join(', ')}` : ''}${bodies.size ? `; body: ${[...bodies].join(', ')}` : ''}`;
}
/** A feeling back from its key. */
export function parseState(key) {
    if (key === 'calm')
        return null;
    const [about, good, wants, cameTrue, praiseworthy, result, appealing, sudden, control, power, strength] = key.split('|');
    const b = (x) => x === '' || x == null ? undefined : x === 'true';
    return { about: about, good: b(good), wants: b(wants), cameTrue: b(cameTrue), praiseworthy: b(praiseworthy), result: (result || undefined), appealing: b(appealing), sudden: b(sudden), control: b(control), power: b(power), strength: Number(strength) };
}
/** The body's state for the look, from the engine's record: pain, sleepiness, eyes closed (`now`, the story's minute, for a
 *  day's sleep). */
export function bodyOf(p, now = p.clockMin ?? null) {
    const feelsPain = !creatureOf(p)?.flags?.includes('NOPAIN') && !p.bodyFlags?.includes('NOPAIN');
    const pain = feelsPain && ((p.wounds ?? []).some(w => !w.healed && w.age * 24 * 60 < k('painFaceMin')) || (!!p.peritonitis && !p.peritonitis.repaired) || p.venom?.kind === 'pain');
    const clockH = p.clockMin != null ? hourOfDay(p.clockMin) : null;
    const sleepy = !!p.needs && clockH != null && sleepinessKss((p.needs.awake ?? 0) / 60, clockH) >= peek('sleepyKss');
    const eyesClosed = !!p.unconscious || (!!p.day && now != null && doingAt(p.day, now) === 'asleep');
    return { ...pain ? { pain } : {}, ...sleepy ? { sleepy } : {}, ...eyesClosed ? { eyesClosed } : {} };
}
/** A person's look state now: their running feeling's appraisal (the newest, kept by Appraise) and their body. */
export function jointOf(p, now) {
    const f = [...(p.feelings ?? [])].filter(x => x.left > 0).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
    const b = bodyOf(p, now), s = f?.state ? parseState(f.state) : null;
    // A body state not among the set's (pain with eyes closed, say) takes the nearest one there: eyes closed stands alone.
    const body = b.eyesClosed ? { eyesClosed: true } : { ...b.pain ? { pain: true } : {}, ...b.sleepy ? { sleepy: true } : {} };
    return jointKey(s, body);
}
