# Per body: reshape the averaged person, copy a calibration line, measure the copy's drift (pitch, tract, speech rate), reshape
# again with the drift taken out, then copy two other lines and measure them against the body.
import json, sys, numpy as np, soundfile as sf, warnings, onnxruntime as ort, parselmouth as pm
warnings.filterwarnings('ignore'); import pyworld as pw
sys.path.insert(0, 'onnx-src'); import pocket_tts_onnx as P
REG = 1.16; SYL_PROMPT = 46
CAL = ('I told you the cart would be late, and it was, so we waited by the road. Nobody in this village remembers the old road to the coast anymore, and the rain kept falling.', 41)
TESTS = [('Sit. Will has been counting the same six coins since noon.', 12), ('Where did you put the lantern we bought at the market yesterday?', 16)]
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
def measure(p, male, syl, L_hint):
    s = pm.Sound(p); f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    pt = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)); f = pt.selected_array['frequency']
    ceil = (5000 if male else 5500) * (18.92 if male else 16.78) / L_hint
    fm = s.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=ceil); dfs = []
    for t, v in zip(pt.xs(), f):
        F = [fm.get_value_at_time(i, t) for i in (1, 2, 3, 4)]
        if v > 0 and not any(np.isnan(F)): x = np.array([0.5, 1.5, 2.5, 3.5]); dfs.append(float(np.dot(x, F) / np.dot(x, x)))
    x = s.values[0]; hop = int(0.01 * s.sampling_frequency); e = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(x) - hop, hop)])
    idx = np.nonzero(20 * np.log10(e / e.max()) > -35)[0]; span = (idx[-1] - idx[0]) * 0.01
    return float(np.median(f[f > 0])), 35300 / (2 * float(np.median(dfs))), syl / span
Z = np.load('avg_prompt.npz'); env, ap, vo, dev, FS, FP = Z['env'], Z['ap'], Z['vo'], Z['dev'], int(Z['FS']), float(Z['FP'])
f0p, Lp, ratep = measure('avg_prompt.wav', False, SYL_PROMPT, 17.3)
def warp(sp, k):
    n = sp.shape[1]; f = np.arange(n); src = np.clip(f * k, 0, n - 1)
    return np.exp(np.array([np.interp(src, f, np.log(row + 1e-12)) for row in sp]))
def reshape(f0t, Lt, ratet, path):
    st = ratep / ratet; T = int(round(len(vo) * st)); src = np.clip(np.round(np.arange(T) / st).astype(int), 0, len(vo) - 1)
    f0 = np.where(vo[src], np.exp(dev[src] + np.log(f0t)), 0.0); sp = warp(env[src], Lt / Lp)
    y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(sp), np.ascontiguousarray(ap[src]), FS, FP); sf.write(path, (y / np.abs(y).max() * 0.9).astype(np.float32), FS, subtype='PCM_16')
m = C(models_dir='onnx', language='english_2026-04', temperature=0.7)
for name, b in json.load(open(sys.argv[1])).items():
    tf0, tL, tr = b['copies']['f0'] * REG, b['copies']['tract'], b['sylPerS']
    reshape(tf0, tL, tr, f'probe/r1-{name}.wav'); np.random.seed(5); emb = m.encode_voice(f'probe/r1-{name}.wav')
    a = m.generate(CAL[0], emb); sf.write(f'probe/cal-{name}.wav', a, FS, subtype='PCM_16'); cf, cL, cr = measure(f'probe/cal-{name}.wav', b['male'], CAL[1], tL)
    # The drift, taken out: ask the reshape for what would land on the body after the copy's drift.
    reshape(tf0 * tf0 / cf, tL * tL / cL, tr * tr / cr, f'probe/r2-{name}.wav'); emb2 = m.encode_voice(f'probe/r2-{name}.wav')
    res = []
    for k, (line, syl) in enumerate(TESTS):
        np.random.seed(11 + k); a = m.generate(line, emb2); sf.write(f'probe/fix-{name}-{k}.wav', a, FS, subtype='PCM_16')
        f, L, r = measure(f'probe/fix-{name}-{k}.wav', b['male'], syl, tL); res.append(f'{100 * (f / tf0 - 1):+4.0f} % {L - tL:+5.2f} cm {100 * (r / tr - 1):+4.0f} %')
    print(f"{name:7s} drift before: pitch {100 * (cf / tf0 - 1):+.0f} %, tract {cL - tL:+.2f} cm, rate {100 * (cr / tr - 1):+.0f} % | after, two other lines: {res[0]} ; {res[1]}", flush=True)
