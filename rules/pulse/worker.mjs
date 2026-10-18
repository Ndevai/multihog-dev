// Runs Pulse off the page's main thread: a minute of simulation takes several seconds on a phone.
import * as core from './core.mjs';
const base = new URL('./', import.meta.url);
const get = p => fetch(new URL(p, base)).then(r => { if (!r.ok) throw new Error(`${p}: ${r.status}`); return r.arrayBuffer(); });
self.onmessage = async ({ data: { id, op, args } }) => {
    try {
        let v;
        if (op === 'boot') v = await core.boot(get);
        else if (op === 'start') v = await core.start(args[0], get, args[1]);
        else v = core[op](...args);
        self.postMessage({ id, v });
    } catch (e) { self.postMessage({ id, error: String(e?.message ?? e) }); }
};
