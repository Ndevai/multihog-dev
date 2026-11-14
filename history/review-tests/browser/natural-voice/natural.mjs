// In Chromium: the natural voice as src/index.js runs it: eSpeak phonemes (lib/espeak-ng), Piper ids (speech.js), the model
// fetched from its Hugging Face URL into the Cache API, onnxruntime-web from its jsDelivr URL inside src/voice-worker.js.
// The two outside URLs are answered from local copies. Prints timings and writes each line's audio as a WAV.
// Usage: node natural.mjs <repo> <dir with model.onnx (the Piper model) and node_modules/onnxruntime-web (1.31.1)> <out dir>
// Section 64, docs/progress.md (131).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, piperDir, outDir] = process.argv.slice(2);
const PIPER = path.resolve(piperDir), ORT = path.join(PIPER, 'node_modules/onnxruntime-web/dist');
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.data': 'application/octet-stream', '.html': 'text/html', '.wasm': 'application/wasm' };
const browser = await chromium.launch();
const context = await browser.newContext();
const hits = [];
const file = (r, p) => { hits.push(path.basename(p)); if (!fs.existsSync(p)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(p), contentType: types[path.extname(p)] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } }); };
await context.route('http://rules.test/**', r => file(r, path.join(root, decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\/ext\//, '')))));
await context.route('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/**', r => file(r, path.join(ORT, path.basename(new URL(r.request().url()).pathname))));
await context.route('https://huggingface.co/**', r => file(r, path.join(PIPER, 'model.onnx')));
const page = await context.newPage();
page.on('console', m => console.log('[page]', m.text()));
page.on('worker', w => w.on('console', m => console.log('[worker]', m.text())));
await page.goto('http://rules.test/ext/settings.html');
const lines = [['tom', 136.4, 17.9, 4.58, '"Sit. Will has been counting the same six coins since noon."'], ['girl', 245.2, 14.39, 4.43, '"I saw him by the well, and he was not alone!"']];
const out = await page.evaluate(async lines => {
  const base = 'http://rules.test/ext/src/index.js', at = p => new URL(`../lib/espeak-ng/${p}`, base).href;
  const S = await import('http://rules.test/ext/src/rules/speech.js'), P = await import('http://rules.test/ext/src/rules/data/piper-voices.js');
  const m = await (await import(at('espeak-ng.js'))).default({ locateFile: at }), es = new m.eSpeakNGWorker(); es.set_voice('en-us');
  // index.ts storedModel, copied: IndexedDB 'rules-engine-voices', store 'models', key the model's URL.
  const stored = (url, put) => new Promise(done => { const open = indexedDB.open('rules-engine-voices', 1); open.onupgradeneeded = () => open.result.createObjectStore('models'); open.onerror = () => done(null);
    open.onsuccess = () => { const db = open.result, store = db.transaction('models', put ? 'readwrite' : 'readonly').objectStore('models'), req = put ? store.put(put, url) : store.get(url);
      req.onsuccess = () => { db.close(); done(put ? put : req.result ?? null); }; req.onerror = () => { db.close(); done(null); }; }; });
  const t0 = performance.now();
  let buf = await stored(P.PIPER_MODEL.url); const fromCache = !!buf;
  if (!buf) { buf = await (await fetch(P.PIPER_MODEL.url)).arrayBuffer(); await stored(P.PIPER_MODEL.url, buf); }
  const fetchMs = performance.now() - t0, t9 = performance.now(), back = await stored(P.PIPER_MODEL.url), readMs = performance.now() - t9;
  const again = back?.byteLength ?? 0, bytes = new Uint8Array(buf);
  const w = new Worker(new URL('./voice-worker.js', base), { type: 'module' }), jobs = new Map();
  const t1 = performance.now();
  await new Promise((ok, bad) => { w.onmessage = e => { const d = e.data; if (d.type === 'loaded') ok(); else if (d.type === 'error') bad(new Error(d.error)); else if (d.type === 'audio') { jobs.get(d.id)(d); jobs.delete(d.id); } };
    w.postMessage({ type: 'load', ortUrl: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/', bytes }, [bytes.buffer]); });
  const loadMs = performance.now() - t1, results = [];
  let id = 0;
  for (const [name, f0, tract, rate, text] of lines) {
    const [sid, vf0, vtract, vrate] = S.nearestVoice(f0, tract), scale = S.lengthScaleFor(vrate, rate);
    const ids = S.piperIds(S.clausesOf(text).map(c => ({ ipa: es.synthesize_ipa(c.words).ipa, mark: c.mark })));
    const t2 = performance.now(), d = await new Promise(ok => { jobs.set(++id, ok); w.postMessage({ type: 'speak', id, ids, sid, lengthScale: scale, noiseScale: P.PIPER_MODEL.noiseScale, noiseW: P.PIPER_MODEL.noiseW }); });
    const synthMs = performance.now() - t2, seconds = d.audio.length / P.PIPER_MODEL.sampleRate;
    // The main thread keeps running while the worker makes the line: count animation frames during a second job.
    let frames = 0, going = true; const tick = () => { if (going) { frames++; requestAnimationFrame(tick); } }; requestAnimationFrame(tick);
    const t3 = performance.now(); await new Promise(ok => { jobs.set(++id, ok); w.postMessage({ type: 'speak', id, ids, sid, lengthScale: scale, noiseScale: P.PIPER_MODEL.noiseScale, noiseW: P.PIPER_MODEL.noiseW }); }); going = false;
    const busyMs = performance.now() - t3;
    results.push({ name, sid, vf0, vtract, scale: +scale.toFixed(3), ids: ids.length, synthMs: Math.round(synthMs), seconds: +seconds.toFixed(2), framesPerS: Math.round(frames * 1000 / busyMs), audio: Array.from(d.audio) });
  }
  return { fromCache, again, fetchMs: Math.round(fetchMs), readMs: Math.round(readMs), loadMs: Math.round(loadMs), results };
}, lines);
for (const r of out.results) {
  const a = r.audio; let pk = 0; for (const v of a) pk = Math.max(pk, Math.abs(v));
  const pcm = Buffer.alloc(a.length * 2); for (let i = 0; i < a.length; i++) pcm.writeInt16LE(Math.round(a[i] / (pk || 1) * 0.9 * 32767), i * 2);
  const hd = Buffer.alloc(44); hd.write('RIFF', 0); hd.writeUInt32LE(36 + pcm.length, 4); hd.write('WAVE', 8); hd.write('fmt ', 12); hd.writeUInt32LE(16, 16); hd.writeUInt16LE(1, 20); hd.writeUInt16LE(1, 22);
  hd.writeUInt32LE(22050, 24); hd.writeUInt32LE(44100, 28); hd.writeUInt16LE(2, 32); hd.writeUInt16LE(16, 34); hd.write('data', 36); hd.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(path.join(outDir, `${r.name}.wav`), Buffer.concat([hd, pcm])); delete r.audio;
}
console.log(JSON.stringify(out, null, 1));
console.log('served:', [...new Set(hits)].join(' '));
await browser.close();
