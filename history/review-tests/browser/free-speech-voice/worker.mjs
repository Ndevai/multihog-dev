// In Chromium: src/voice-worker.js running Pocket TTS as the extension does (networks from their Hugging Face URLs, the language
// model's memory length freed by rules/pocket.js freeCacheLength, onnxruntime-web 1.31.1 from jsDelivr), the outside URLs
// answered from local copies. Speaks Tom's line in EARS p031's voice at temperature 0 (to compare with the Python export's
// own loop) and at 0.7 (timed), then the same with the CPU slowed 4× as a stand-in for a phone.
// Usage: node worker.mjs <repo> <dir with english_2026-04/ files> <onnxruntime-web dist dir> <24 kHz f32 samples> <reference npy> <out dir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const { chromium } = createRequire(import.meta.url)('playwright');
const [root, bundleDir, ortDir, samplesFile, refNpy, outDir, refEmbNpy, rates = '1,4'] = process.argv.slice(2);
const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.wasm': 'application/wasm', '.json': 'application/json' };
const browser = await chromium.launch(), context = await browser.newContext();
const serve = (r, p) => fs.existsSync(p) ? r.fulfill({ status: 200, body: fs.readFileSync(p), contentType: types[path.extname(p)] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' } }) : r.fulfill({ status: 404, body: '' });
await context.route('http://rules.test/**', r => serve(r, path.join(root, decodeURIComponent(new URL(r.request().url()).pathname.replace(/^\/ext\//, '')))));
await context.route('https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/**', r => serve(r, path.join(ortDir, path.basename(new URL(r.request().url()).pathname))));
await context.route('https://huggingface.co/KevinAHM/**', r => serve(r, path.join(bundleDir, path.basename(new URL(r.request().url()).pathname))));
await context.route('http://local.test/samples', r => r.fulfill({ status: 200, body: fs.readFileSync(samplesFile) }));
const page = await context.newPage();
page.on('console', m => console.log('[page]', m.text()));
await page.goto('http://rules.test/ext/settings.html');
const cdp = await context.newCDPSession(page);
const run = async (label, rate) => {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  return page.evaluate(async label => {
    const P = await import('http://rules.test/ext/src/rules/pocket.js');
    const base = 'https://huggingface.co/KevinAHM/pocket-tts-onnx/resolve/58a6d00cf13d239b6748cb0769f35c580a8f606c/onnx/english_2026-04/';
    const names = ['bundle.json', 'bos_before_voice.npy', 'mimi_encoder.onnx', 'text_conditioner.onnx', 'flow_lm_main_int8.onnx', 'flow_lm_flow_int8.onnx', 'mimi_decoder_int8.onnx'];
    const t0 = performance.now(), files = {};
    for (const n of names) files[n] = await (await fetch(base + n)).arrayBuffer();
    const bundle = JSON.parse(new TextDecoder().decode(files['bundle.json']));
    const freed = P.freeCacheLength(new Uint8Array(files['flow_lm_main_int8.onnx']), bundle.flow_lm_state_manifest.filter(e => e.shape.includes(1000)).flatMap(e => [e.input_name, e.output_name]));
    const w = new Worker('http://rules.test/ext/src/voice-worker.js', { type: 'module' }), wait = new Map();
    let loaded;
    const ready = new Promise((ok, bad) => { loaded = { ok, bad }; });
    w.onmessage = e => { const d = e.data; if (d.type === 'loaded') loaded.ok(); else if (d.type === 'error') loaded.bad(new Error(d.error)); else { wait.get(d.id)(d); wait.delete(d.id); } };
    w.postMessage({ type: 'load', ortUrl: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/', files }, Object.values(files));
    await ready;
    const loadMs = performance.now() - t0, ask = (m, tr = []) => new Promise(ok => { const id = Math.random(); wait.set(id, ok); w.postMessage({ ...m, id }, tr); });
    const samples = new Float32Array(await (await fetch('http://local.test/samples')).arrayBuffer());
    const t1 = performance.now(), v = await ask({ type: 'voice', voice: 'p031', samples }), voiceMs = performance.now() - t1;
    if (v.error) return { error: v.error };
    const line = 'Sit. Will has been counting the same six coins since noon.';
    const chunks = P.pocketChunks(line).map(c => { const p = P.pocketPrepare(c), ids = P.pocketTokens(p.text); return { ids, framesAfterEos: p.framesAfterEos, maxFrames: P.pocketMaxFrames(ids.length) }; });
    const t2 = performance.now(), a0 = await ask({ type: 'speak', voice: 'p031', chunks, temperature: 0 }), t0Ms = performance.now() - t2;
    if (a0.error) return { error: a0.error };
    const t3 = performance.now(), a7 = await ask({ type: 'speak', voice: 'p031', chunks, temperature: 0.7 }), t7Ms = performance.now() - t3;
    return { label, freed, loadMs: Math.round(loadMs), voiceMs: Math.round(voiceMs), embFrames: v.embedding?.length / 1024, emb: Array.from(v.embedding.subarray(0, 4096)), t0: { ms: Math.round(t0Ms), s: a0.audio.length / 24000, audio: Array.from(a0.audio) }, t7: { ms: Math.round(t7Ms), s: a7.audio.length / 24000, audio: Array.from(a7.audio) } };
  }, label);
};
const wav = (a, file) => { let pk = 0; for (const v of a) pk = Math.max(pk, Math.abs(v)); const pcm = Buffer.alloc(a.length * 2); a.forEach((v, i) => pcm.writeInt16LE(Math.round(v / (pk || 1) * 0.9 * 32767), i * 2));
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); fs.writeFileSync(file, Buffer.concat([h, pcm])); };
// The reference (pocket_tts_onnx.py at temperature 0): a .npy of float32 after its header.
const npy = fs.readFileSync(refNpy), hl = npy.readUInt16LE(8), ref = new Float32Array(npy.buffer.slice(npy.byteOffset + 10 + hl, npy.byteOffset + npy.length));
const embNpy = refEmbNpy ? fs.readFileSync(refEmbNpy) : null, refEmb = embNpy ? new Float32Array(embNpy.buffer.slice(embNpy.byteOffset + 10 + embNpy.readUInt16LE(8), embNpy.byteOffset + embNpy.length)) : null;
for (const [label, rate] of rates.split(',').map(r => [r === '1' ? 'desktop' : `cpu slowed ${r}x`, Number(r)])) {
  const r = await run(label, rate);
  if (r.error) { console.log(label, 'ERROR', r.error); continue; }
  const a = r.t0.audio, n = Math.min(a.length, ref.length); let d = 0, e = 0; for (let i = 0; i < n; i++) { d = Math.max(d, Math.abs(a[i] - ref[i])); e += ref[i] ** 2; }
  wav(r.t7.audio, path.join(outDir, `browser-p031-${rate}x.wav`)); wav(r.t0.audio, path.join(outDir, `browser-p031-t0.wav`));
  if (refEmb) { let de = 0; for (let i = 0; i < r.emb.length; i++) de = Math.max(de, Math.abs(r.emb[i] - refEmb[i])); console.log('encoder: max |Δ| over the first 4 frames', de.toFixed(6), 'of values up to', Math.max(...r.emb.map(Math.abs)).toFixed(3)); }
  console.log(JSON.stringify({ label, freed: r.freed, loadMs: r.loadMs, voiceMs: r.voiceMs, embFrames: r.embFrames, temp0: { ms: r.t0.ms, s: +r.t0.s.toFixed(2), samples: a.length, refSamples: ref.length, maxDiff: +d.toFixed(5), refRms: +Math.sqrt(e / n).toFixed(4) }, temp07: { ms: r.t7.ms, s: +r.t7.s.toFixed(2), rtf: +(r.t7.ms / 1000 / r.t7.s).toFixed(2) } }));
}
await browser.close();
