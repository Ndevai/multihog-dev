import { def, k } from './constants.js';
def({ id: 'sedUnconscious', value: 0.9, unit: 'Pulse sedation level', status: 'assumed', src: 'Pulse gives sedation 0–1 with no stated link to consciousness', range: [0.7, 0.95], file: 'drugs.ts' });
def({ id: 'nmbNoMove', value: 0.9, unit: 'Pulse neuromuscular block', status: 'assumed', src: 'block at which a person cannot move', range: [0.7, 0.95], file: 'drugs.ts' });
export const PULSE_KG = 77.1;
const COLS = ['hr', 'map', 'sys', 'dia', 'rr', 'spo2', 'tv', 'sed', 'nmb', 'paco2'];
let TABLE = null, loading = null;
export function loadDrugs() {
    loading ??= fetch(new URL('../../rules/pulse/drugs.json', import.meta.url)).then(r => r.json()).then(d => { TABLE = d.drugs; });
    return loading;
}
export const drugKeys = () => Object.keys(TABLE ?? {});
const row = (a) => Object.fromEntries(COLS.map((c, i) => [c, a[i]]));
/** Starts a dose: the per-minute rows for this person, or why not. */
export function startDose(p, key, mg) {
    const t = TABLE?.[key];
    if (!t)
        return { error: `No runs for ${key}. Known: ${drugKeys().join(', ')}.` };
    const eff = mg * PULSE_KG / p.mass;
    if (eff < t.mg[0])
        return { error: `${mg} mg is below the smallest run (${t.mg[0]} mg for 77 kg; ${(t.mg[0] * p.mass / PULSE_KG).toFixed(1)} mg for this body); the runs start above this dose.` };
    let i = t.mg.findIndex(x => x >= eff), f = 0, held = false;
    if (i < 0) {
        i = t.mg.length - 1;
        held = true;
    }
    else if (i > 0) {
        f = (Math.log(eff) - Math.log(t.mg[i - 1])) / (Math.log(t.mg[i]) - Math.log(t.mg[i - 1]));
        i -= 1;
    }
    const a = t.runs[i], b = t.runs[Math.min(i + 1, t.runs.length - 1)], n = Math.min(a.length, b.length);
    const rows = Array.from({ length: n }, (_, m) => a[m].map((x, j) => held || f === 0 ? x : x + (b[m][j] - x) * f));
    p.drug = { key, mg, rows, t: 0 };
    return { note: `${key.replace(':', ' ')} ${mg} mg (${eff.toFixed(0)} mg for the 77 kg model)${held ? `, held at the largest run (${t.mg[t.mg.length - 1]} mg)` : ''}` };
}
/** One minute of the dose's course; called from the body's minute. */
export function drugMinute(p) {
    const q = p;
    const d = q.drug;
    if (!d)
        return;
    if (d.t >= d.rows.length) {
        q.drug = null;
        q.drugLast = null;
        if (q.drugApnea) {
            q.drugApnea = false;
            p.paralysed = false;
        }
        if (p.unconscious === 'sedated')
            p.unconscious = null;
        return;
    }
    const r = row(d.rows[d.t++]);
    q.drugLast = r;
    if (r.rr < 1 && p.apnea == null) {
        p.apnea = 0;
        p.paralysed = true;
        q.drugApnea = true;
        p.unconscious = 'not breathing (drug)';
    }
    else if (r.rr >= 1 && q.drugApnea && p.apnea != null) {
        p.apnea = null;
        p.paralysed = false;
        q.drugApnea = false;
        if (p.unconscious === 'not breathing (drug)')
            p.unconscious = null;
    }
    if (r.sed >= k('sedUnconscious') && !p.unconscious)
        p.unconscious = 'sedated';
    else if (r.sed < k('sedUnconscious') && p.unconscious === 'sedated')
        p.unconscious = null;
}
export function drugStatus(p) {
    const q = p;
    const r = q.drugLast;
    if (!q.drug || !r)
        return null;
    return `${q.drug.key.split(':')[0].toLowerCase()} ${q.drug.mg} mg, ${q.drug.t} min in: pulse ${Math.round(r.hr)}/min, blood pressure ${Math.round(r.sys)}/${Math.round(r.dia)}, breathing ${r.rr.toFixed(0)}/min, oxygen ${Math.round(r.spo2 * 100)} %, sedation ${r.sed.toFixed(2)}${r.nmb >= k('nmbNoMove') ? ', motionless (muscles blocked)' : r.nmb > 0.05 ? `, muscles ${Math.round(r.nmb * 100)} % blocked` : ''} (Pulse)`;
}
