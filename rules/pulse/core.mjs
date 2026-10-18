// Pulse Physiology Engine (Kitware, Apache 2.0; stable branch 5e29e5b, 2026-09-30) compiled to WebAssembly
// (tools/pulse-glue.cpp; docs/df-body-engine.md §5 "Pulse"). One engine per character, kept in memory for the session.
import Pulse from './pulse.mjs';

const REQUESTS = [['HeartRate', '1/min'], ['MeanArterialPressure', 'mmHg'], ['SystolicArterialPressure', 'mmHg'],
    ['DiastolicArterialPressure', 'mmHg'], ['RespirationRate', '1/min'], ['OxygenSaturation', ''], ['BloodVolume', 'mL'],
    ['TotalHemorrhageRate', 'mL/min'], ['TotalHemorrhagedVolume', 'mL']];
const KEYS = ['hr', 'map', 'sys', 'dia', 'rr', 'spo2', 'volume', 'rate', 'lost'];
let M = null, booting = null;
const engines = new Map();

async function gunzipText(buf) {
    return await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
}
/** Loads the module and writes Pulse's data folder into its in-memory file system. `get(path)` returns an ArrayBuffer. */
export function boot(get) {
    booting ??= (async () => {
        M = await Pulse();
        const list = new TextDecoder().decode(await get('files.txt')).split('\n').filter(Boolean);
        await Promise.all(list.map(async f => {
            const p = `/pulse/${f.replace(/^\.\//, '')}`;
            M.FS.mkdirTree(p.slice(0, p.lastIndexOf('/')));
            M.FS.writeFile(p, new Uint8Array(await get(`data/${f.replace(/^\.\//, '')}`)));
        }));
        M._PulseInitialize();
        return true;
    })();
    return booting;
}
const str = s => M.stringToNewUTF8(s);
function call(fn, ...strs) { const ps = strs.map(str); try { return fn(...ps); } finally { ps.forEach(p => M._free(p)); } }

/** Starts (or keeps) the engine for `key` from a stabilised patient state (gzipped JSON). */
export async function start(key, get, stateFile) {
    if (engines.has(key)) return true;
    const state = await gunzipText(await get(`states/${stateFile}`));
    const e = call(p => M._Allocate(0, p), '/pulse');
    const req = JSON.stringify({ DataRequest: REQUESTS.map(([p, u]) => ({ Category: 'Physiology', PropertyName: p, ...(u ? { Unit: u } : {}) })) });
    const ok = call((s, r) => M._SerializeFromString(e, s, r, 0), state, req);
    if (!ok) { M._Deallocate(e); return false; }
    engines.set(key, e);
    return true;
}
export function stop(key) { const e = engines.get(key); if (e) { M._Deallocate(e); engines.delete(key); } }
export function has(key) { return engines.has(key); }
/** Applies Pulse actions given in Pulse's JSON action format ({ AnyAction: [...] }). */
export function act(key, actions) { const e = engines.get(key); return !!e && !!call(a => M._ProcessActions(e, a, 0), JSON.stringify(actions)); }
/** Advances up to `minutes`, one minute at a time, stopping once `budgetMs` of real time is used; returns the requested
 *  values at the end of each minute. */
export function run(key, minutes, budgetMs = Infinity) {
    const e = engines.get(key); if (!e) return null;
    const out = [], t0 = Date.now();
    for (let i = 0; i < minutes && Date.now() - t0 < budgetMs; i++) {
        if (!M._AdvanceTimeS(e, 60)) break;
        const p = M._PullData(e) / 8, v = {};
        KEYS.forEach((k, j) => { v[k] = M.HEAPF64[p + 1 + j]; });
        out.push(v);
    }
    return out;
}
