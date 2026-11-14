# Per body: the averaged person's recording reshaped to the body (WORLD: pitch level, tract by envelope warp, pace by time
# scale), copied by Pocket TTS saying the test line; the copy's pitch, tract and speech rate measured (Praat) against the body.
import json, sys, numpy as np, soundfile as sf, warnings, onnxruntime as ort, parselmouth as pm
warnings.filterwarnings('ignore'); import pyworld as pw
sys.path.insert(0, 'onnx-src'); import pocket_tts_onnx as P
REG = 1.16; LINE = 'Sit. Will has been counting the same six coins since noon.'; SYL_LINE = 12; SYL_PROMPT = 46
class C(P.PocketTTSOnnx):
    def _model_file(self, stem):
        n = super()._model_file(stem); return n.replace('.onnx', '_dyn.onnx') if stem == 'flow_lm_main' else n
    def _make_session_options(self):
        o = ort.SessionOptions(); o.intra_op_num_threads = 4; o.log_severity_level = 3; return o
    def _init_state(self, manifest):
        st = super()._init_state(manifest)
        if manifest is self.flow_state_manifest:
            for e in manifest:
                if 1000 in e['shape']: st[e['input_name']] = self._make_filled_array([512 if d == 1000 else d for d in e['shape']], self._numpy_dtype(e['dtype']), e['fill'])
        return st
def measure(p, male, syl):
    s = pm.Sound(p); f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    pt = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)); f = pt.selected_array['frequency']
    fm = s.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=5000 if male else 5500); dfs = []
    for t, v in zip(pt.xs(), f):
        F = [fm.get_value_at_time(i, t) for i in (1, 2, 3, 4)]
        if v > 0 and not any(np.isnan(F)): x = np.array([0.5, 1.5, 2.5, 3.5]); dfs.append(float(np.dot(x, F) / np.dot(x, x)))
    x = s.values[0]; hop = int(0.01 * s.sampling_frequency); e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(x) - hop, hop)])
    idx = np.nonzero(20 * np.log10(e / e.max()) > -35)[0]; span = (idx[-1] - idx[0]) * 0.01
    return float(np.median(f[f > 0])), 35300 / (2 * float(np.median(dfs))), syl / span
Z = np.load('avg_prompt.npz'); env, ap, vo, dev, FS, FP = Z['env'], Z['ap'], Z['vo'], Z['dev'], int(Z['FS']), float(Z['FP'])
f0p, Lp, ratep = measure('avg_prompt.wav', False, SYL_PROMPT); print(f'prompt: f0 {f0p:.1f} tract {Lp:.2f} rate {ratep:.2f}')
def warp(sp, k):
    n = sp.shape[1]; f = np.arange(n); src = np.clip(f * k, 0, n - 1)
    return np.exp(np.array([np.interp(src, f, np.log(row + 1e-12)) for row in sp]))
m = C(models_dir='onnx', language='english_2026-04', temperature=0.7)
bodies = json.load(open(sys.argv[1])); out = {}
for name, b in bodies.items():
    tf0, tL, trate = b['copies']['f0'] * REG, b['copies']['tract'], b['sylPerS']
    st = ratep / trate; T = int(round(len(vo) * st)); src = np.clip(np.round(np.arange(T) / st).astype(int), 0, len(vo) - 1)
    f0 = np.where(vo[src], np.exp(dev[src] + np.log(tf0)), 0.0); sp = warp(env[src], tL / Lp)
    y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(sp), np.ascontiguousarray(ap[src]), FS, FP); y = (y / np.abs(y).max() * 0.9).astype(np.float32)
    sf.write(f'probe/prompt-{name}.wav', y, FS, subtype='PCM_16')
    np.random.seed(3); emb = m.encode_voice(f'probe/prompt-{name}.wav'); a = m.generate(LINE, emb); sf.write(f'probe/copy-{name}.wav', a, FS, subtype='PCM_16')
    pf, pL, pr = measure(f'probe/prompt-{name}.wav', b['male'], SYL_PROMPT); cf, cL, cr = measure(f'probe/copy-{name}.wav', b['male'], SYL_LINE)
    print(f"{name:7s} target f0 {tf0:6.1f} tract {tL:5.2f} rate {trate:4.2f} | prompt {pf:6.1f} {pL:5.2f} {pr:4.2f} | copy {cf:6.1f} ({100 * (cf / tf0 - 1):+.0f} %) {cL:5.2f} ({cL - tL:+.2f}) {cr:4.2f}", flush=True)
