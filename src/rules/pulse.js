const BASE = new URL('../../rules/pulse/', import.meta.url);
let worker = null, seq = 0;
const waiting = new Map();
let direct = null;
async function rpc(op, ...args) {
    if (typeof Worker !== 'undefined' && typeof window !== 'undefined') {
        worker ??= Object.assign(new Worker(new URL('worker.mjs', BASE), { type: 'module' }), {
            onmessage: ({ data }) => { const w = waiting.get(data.id); waiting.delete(data.id); if (w)
                data.error ? w[1](new Error(data.error)) : w[0](data.v); },
        });
        const id = ++seq;
        return new Promise((ok, no) => { waiting.set(id, [ok, no]); worker.postMessage({ id, op, args }); });
    }
    direct ??= await import(new URL('core.mjs', BASE).href);
    const get = (p) => fetch(new URL(p, BASE)).then(r => r.arrayBuffer());
    if (op === 'boot')
        return direct.boot(get);
    if (op === 'start')
        return direct.start(args[0], get, args[1]);
    return direct[op](...args);
}
// Severity (0–1) to the rate a limb bleeds in the first 10 s, measured on Pulse's StandardMale (Node sweep, 2026-10-18):
// leg 0.1→19, 0.2→41, 0.3→66, 0.4→95, 0.5→125, 0.6→157, 0.7→189, 0.8→219, 0.9→246, 1.0→269 mL/min; arm 5, 11, 19, 27,
// 36, 46, 56, 65, 74, 82. A wound's drawn rate is turned into the severity that starts at it; rates above severity 1
// (a femoral cut drawn at 300–600 mL/min) bleed at severity 1, Pulse's widest opening of that limb [ASSUMED: Pulse's limit].
const FLOW = { Leg: [0, 19, 41, 66, 95, 125, 157, 189, 219, 246, 269], Arm: [0, 5, 11, 19, 27, 36, 46, 56, 65, 74, 82] };
export function severityFor(limb, mlMin) {
    const f = FLOW[limb];
    if (mlMin >= f[10])
        return 1;
    const i = f.findIndex(x => x >= mlMin);
    return i <= 0 ? 0 : (i - 1 + (mlMin - f[i - 1]) / (f[i] - f[i - 1])) / 10;
}
/** The Pulse compartment of a wounded limb, from the body part's name; null for parts Pulse's limbs do not cover. */
export function limbOf(part) {
    const t = part.toLowerCase(), side = /left/.test(t) ? 'Left' : 'Right';
    if (/leg|thigh|foot|knee|shin|calf|ankle|toe/.test(t))
        return { comp: `${side}Leg`, limb: 'Leg' };
    if (/arm|hand|elbow|wrist|finger|thumb|shoulder/.test(t))
        return { comp: `${side}Arm`, limb: 'Arm' };
    return null;
}
const pulsed = (w) => (w.vessel === 'femoral' || w.vessel === 'limb_artery') && w.bleed > 0 && !w.healed && !!limbOf(w.part);
// Pulse runs at most PULSE_MAX_MIN minutes and PULSE_BUDGET_MS of real time per PassTime call [ASSUMED budget]: a phone
// (Android, SillyTavern, 2026-10-18) took 31.1 s per simulated minute, Node 8.2 s; beyond that the wound keeps Pulse's
// last flow and the engine's rules.
export const PULSE_MAX_MIN = 15, PULSE_BUDGET_MS = 60_000;
let TABLES = null;
async function tables() {
    TABLES ??= await fetch(new URL('bleed.json', BASE)).then(r => r.ok ? r.json() : null).catch(() => null);
    return TABLES;
}
export function tableTrack(t, sex, limb, sev, from, n) {
    const runs = t.tables[sex === 'female' ? 'Female' : 'Male'][limb];
    const x = Math.max(0.1, Math.min(1, sev)) * 10 - 1, i = Math.min(8, Math.floor(x)), f = x - i, a = runs[i], b = runs[i + 1];
    const end = Math.round(a.length + (b.length - a.length) * f), scale = sev < 0.1 ? sev / 0.1 : 1;
    const out = [];
    for (let m = from; m < Math.min(end, from + n); m++) {
        const ra = a[Math.min(m, a.length - 1)], rb = b[Math.min(m, b.length - 1)], v = ra.map((y, k) => y + (rb[k] - y) * f);
        out.push({ hr: v[0], map: v[1], sys: v[2], dia: v[3], rr: v[4], spo2: v[5], volume: 0, rate: v[6] * scale, lost: v[7] * scale, last: m === end - 1 && end < 60 });
    }
    return out;
}
export async function prepareBleeding(people, minutes) {
    const todo = Object.entries(people).filter(([, p]) => !p.dead && p.species === 'HUMAN' && p.wounds.some(pulsed));
    if (!todo.length || minutes <= 0)
        return;
    const t = await tables();
    for (const [, p] of todo) {
        const ws = p.wounds.filter(pulsed), comps = new Set(ws.map(w => limbOf(w.part).comp)), ids = ws.map(w => w.id).sort().join();
        // One bleeding limb and no live engine for this person: the precomputed run, from the minute the bleed has reached.
        if (t && comps.size === 1 && (!p.pulseTab || p.pulseTab.ids === ids) && !p.pulseWounds?.length) {
            const limb = limbOf(ws[0].part).limb;
            for (const w of ws)
                w.pulseSev ??= severityFor(limb, w.bleed);
            p.pulseTab ??= { ids, limb, sev: Math.min(1, ws.reduce((s2, w) => s2 + w.pulseSev, 0)), minute: 0 };
            const tr = tableTrack(t, p.sex ?? 'male', limb, p.pulseTab.sev, p.pulseTab.minute, minutes);
            p.pulse = tr.length ? { track: tr.map(m => ({ rate: m.rate, hr: m.hr, map: m.map, sys: m.sys, dia: m.dia, rr: m.rr, spo2: m.spo2, ...(m.last ? { dies: true } : {}) })), at: 0, table: true } : null;
        }
        else if (p.pulseTab)
            p.pulse = null; // a precomputed run whose wounds changed: the rules carry on [ASSUMED]
    }
    const live = todo.filter(([, p]) => !p.pulseTab);
    if (!live.length)
        return;
    await rpc('boot');
    for (const [who, p] of live) {
        const key = `${who}`;
        const fresh = !(await rpc('has', key));
        if (fresh && !(await rpc('start', key, p.sex === 'female' ? 'StandardFemale@0s.json.gz' : 'StandardMale@0s.json.gz')))
            continue;
        p.pulseWounds ??= [];
        if (fresh)
            p.pulseWounds = [];
        // Minutes already simulated and not yet lived through are used first; a new or stopped wound discards them (Pulse's
        // clock then runs ahead by those minutes [ASSUMED: up to PULSE_MAX_MIN]).
        const ids = p.wounds.filter(pulsed).map(w => w.id).sort().join(), same = ids === [...p.pulseWounds].sort().join();
        if (!fresh && same && p.pulse && p.pulse.at < p.pulse.track.length)
            continue;
        // A wound's severity is fixed when Pulse first sees it (its drawn rate then); a stopped wound drops out, and every
        // limb is sent each time, 0 where nothing bleeds, so a tourniquet or pressure ends the flow in Pulse too.
        for (const w of p.wounds.filter(pulsed))
            if (w.pulseSev == null || fresh)
                w.pulseSev = severityFor(limbOf(w.part).limb, w.bleed);
        const byComp = new Map(['LeftLeg', 'RightLeg', 'LeftArm', 'RightArm'].map(c => [c, 0]));
        for (const w of p.wounds.filter(pulsed)) {
            const c = limbOf(w.part).comp;
            byComp.set(c, Math.min(1, byComp.get(c) + w.pulseSev));
        }
        await rpc('act', key, { AnyAction: [...byComp].map(([c, s]) => ({ PatientAction: { Hemorrhage: { Compartment: c, Severity: { Scalar0To1: { Value: s } } } } })) });
        p.pulseWounds = p.wounds.filter(pulsed).map(w => w.id);
        const track = await rpc('run', key, Math.min(minutes, PULSE_MAX_MIN), PULSE_BUDGET_MS);
        p.pulse = track?.length ? { track: track.map(m => ({ rate: m.rate, hr: m.hr, map: m.map, sys: m.sys, dia: m.dia, rr: m.rr, spo2: m.spo2 })), at: 0 } : null;
    }
}
/** Whether a wound's flow comes from Pulse this minute. */
export const pulseWound = pulsed;
/** /rules-pulse-test: starts a throwaway Pulse patient, bleeds the right leg at severity 0.8 for 2 minutes, and reports the
 *  vital signs and how long the phone took. */
export async function pulseSelfTest() {
    const t0 = Date.now();
    try {
        await rpc('boot');
        const t1 = Date.now();
        if (!(await rpc('start', 'selftest', 'StandardMale@0s.json.gz')))
            return 'Pulse loaded but the patient state did not.';
        await rpc('act', 'selftest', { AnyAction: [{ PatientAction: { Hemorrhage: { Compartment: 'RightLeg', Severity: { Scalar0To1: { Value: 0.8 } } } } }] });
        const t2 = Date.now();
        const tr = await rpc('run', 'selftest', 2);
        const t3 = Date.now();
        await rpc('stop', 'selftest');
        const m = tr?.[tr.length - 1];
        if (!m)
            return 'Pulse ran no minutes.';
        return `Pulse works. After 2 min of a severe leg bleed: pulse ${Math.round(m.hr)}/min, blood pressure ${Math.round(m.sys)}/${Math.round(m.dia)} mmHg, lost ${Math.round(m.lost)} mL (expected about 74–75/min and 360 mL at 2 min). Loading ${((t1 - t0) / 1000).toFixed(1)} s, patient ${((t2 - t1) / 1000).toFixed(1)} s, ${((t3 - t2) / 2000).toFixed(1)} s per simulated minute.`;
    }
    catch (e) {
        return `Pulse failed: ${e.message}`;
    }
}
