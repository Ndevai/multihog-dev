# Build A: the movement (rhythm, melody, articulation) of 16 EARS speakers' copies of one line, averaged; the body's causes
# set what the movement is spoken with: pitch level (folds), formant scale (tract length), pace (syllables a second).
# Usage: python build_a.py <bodies.json> <out dir> <text> <syllables>
import sys, json, warnings, numpy as np, onnxruntime as ort, soundfile as sf
warnings.filterwarnings('ignore')
import pyworld as pw
sys.path.insert(0, 'onnx-src'); import pocket_tts_onnx as P
bodies_file, out_dir, text, syl = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4])
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
FS, FP = 24000, 5.0
cat = json.load(open('ears_praat.json'))
men = sorted(k for k, v in cat.items() if v['meta']['gender'] == 'male' and v['meta']['native language'] == 'american english')
women = sorted(k for k, v in cat.items() if v['meta']['gender'] == 'female' and v['meta']['native language'] == 'american english')
pick = men[::max(1, len(men) // 8)][:8] + women[::max(1, len(women) // 8)][:8]
m = C(models_dir='onnx', language='english_2026-04', temperature=0.7)
def analyse(a):
    a = a.astype(np.float64); f0, t = pw.harvest(a, FS, f0_floor=60, f0_ceil=600, frame_period=FP)
    return f0, pw.cheaptrick(a, f0, t, FS), pw.d4c(a, f0, t, FS)
def warp(sp, k):
    # The envelope of a tract k times as long: every frequency f takes the value the old envelope had at f * k.
    n = sp.shape[1]; f = np.arange(n); src = np.clip(f * k, 0, n - 1)
    return np.exp(np.array([np.interp(src, f, np.log(row + 1e-12)) for row in sp]))
def dtw(a, b):
    # Path matching each frame of a to frames of b (Euclidean distance, steps (1,1), (1,0), (0,1)).
    D = np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).sum(-1)); n, k = D.shape; acc = np.full((n + 1, k + 1), np.inf); acc[0, 0] = 0
    for i in range(1, n + 1):
        row = acc[i]; prev = acc[i - 1]; d = D[i - 1]
        for j in range(1, k + 1): row[j] = d[j - 1] + min(prev[j - 1], prev[j], row[j - 1])
    i, j, path = n, k, []
    while i > 0 and j > 0:
        path.append((i - 1, j - 1)); s = np.argmin([acc[i - 1, j - 1], acc[i - 1, j], acc[i, j - 1]])
        if s == 0: i, j = i - 1, j - 1
        elif s == 1: i -= 1
        else: j -= 1
    m_ = {}
    for a_, b_ in path: m_.setdefault(a_, []).append(b_)
    return np.array([np.mean(m_[r]) for r in range(n)])
# 1. Each speaker's copy, analysed, its envelope put on the group's mean tract.
takes = []
for sid in pick:
    np.random.seed(7); a = m.generate(text, np.load(f'ears_out/{sid}.npy'))
    i = np.nonzero(np.abs(a) > 0.01 * np.abs(a).max())[0]; a = a[max(0, i[0] - 1200): i[-1] + 1200]
    f0, sp, ap = analyse(a); takes.append({'id': sid, 'f0': f0, 'sp': sp, 'ap': ap, 'L': cat[sid]['copy']['tract']})
    # The take's own melody range, measured by Praat (two-pass pitch, as the catalogue), the target the averaged melody keeps.
    import parselmouth as pm
    snd = pm.Sound(a, FS); f1 = snd.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    f2 = snd.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)).selected_array['frequency']; f2 = f2[f2 > 0]
    takes[-1]['praatRange'] = float(np.percentile(np.log(f2), 95) - np.percentile(np.log(f2), 5))
Lref = float(np.mean([t['L'] for t in takes]))
for t in takes:
    t['spn'] = warp(t['sp'], Lref / t['L'])
    v = t['f0'] > 0; t['dev'] = np.where(v, np.log(np.maximum(t['f0'], 1)) - np.log(t['f0'][v]).mean(), 0.0)
    t['feat'] = pw.code_spectral_envelope(t['spn'], FS, 30)[:, 1:]
# 2. Aligned to the first take, averaged frame by frame: time, envelope (log), breath, voicing (majority), melody (ln f0).
ref = takes[0]; n = len(ref['f0']); maps = [np.arange(n, dtype=float)] + [dtw(ref['feat'], t['feat']) for t in takes[1:]]
def at(t, mp, key):
    idx = np.clip(np.round(mp).astype(int), 0, len(t[key]) - 1); return t[key][idx]
env = np.exp(np.mean([np.log(at(t, mp, 'spn') + 1e-12) for t, mp in zip(takes, maps)], 0))
ap = np.mean([at(t, mp, 'ap') for t, mp in zip(takes, maps)], 0)
vo = np.mean([at(t, mp, 'f0') > 0 for t, mp in zip(takes, maps)], 0) > 0.5
devs = np.array([at(t, mp, 'dev') for t, mp in zip(takes, maps)]); vs = np.array([at(t, mp, 'f0') > 0 for t, mp in zip(takes, maps)])
dev = np.where(vs.sum(0) > 0, (devs * vs).sum(0) / np.maximum(vs.sum(0), 1), 0.0)
time = np.mean([mp * [1, ] * 1 for mp in maps], 0); time = np.maximum.accumulate(time + np.arange(n) * 1e-6)
# The melody: averaging aligned contours narrows them (their peaks fall at slightly different frames) and leaves frame-to-frame
# wobble. Bridged over unvoiced gaps, smoothed over 80 ms (16 frames), then scaled so its 5-95 % range over voiced frames equals
# the median of the 16 takes' own, measured by Praat (WORLD's tracker slips octaves on some takes and reads ranges too wide).
vi = np.nonzero(vo)[0]
if len(vi) > 1:
    full = np.interp(np.arange(n), vi, dev[vi]); k16 = np.ones(16) / 16; sm = np.convolve(np.pad(full, 8, mode='edge'), k16, mode='same')[8:-8]
    rng = lambda x: np.percentile(x, 95) - np.percentile(x, 5)
    own = float(np.median([t['praatRange'] for t in takes])); was = rng(sm[vo]); dev = (sm - np.median(sm[vo])) * own / max(was, 1e-6)
    print('melody 5-95 %: averaged', round(was * 1731 / 100, 2), 'st, speakers (median)', round(own * 1731 / 100, 2), 'st')
# On a uniform grid along the averaged time.
grid = np.arange(0, time[-1], 1.0); pos = np.interp(grid, time, np.arange(n)); k = np.round(pos).astype(int)
env, ap, vo, dev = env[k], ap[k], vo[k], dev[k]
speech_s = (len(grid) * FP) / 1000; avg_rate = syl / speech_s
print('group:', pick, 'mean tract', round(Lref, 2), 'averaged pace', round(avg_rate, 2), 'syll/s')
# The averaged voice's own tract, measured as the catalogue was (Praat, Burg, F1-F4 spacing): the warp starts from it.
import parselmouth as pm
y0 = pw.synthesize(np.ascontiguousarray(np.where(vo, np.exp(dev + np.log(140.0)), 0.0)), np.ascontiguousarray(env), np.ascontiguousarray(ap), FS, FP)
snd = pm.Sound(y0, FS); pt = snd.to_pitch_ac(pitch_floor=60, pitch_ceiling=400); fm = snd.to_formant_burg(time_step=0.01, max_number_of_formants=5, maximum_formant=5250)
dfs = []
for t, v in zip(pt.xs(), pt.selected_array['frequency']):
    F = [fm.get_value_at_time(i, t) for i in (1, 2, 3, 4)]
    if v > 0 and not any(np.isnan(F)): x = np.array([0.5, 1.5, 2.5, 3.5]); dfs.append(float(np.dot(x, F) / np.dot(x, x)))
Lref = 35300 / (2 * float(np.median(dfs))); print('averaged voice measures', round(Lref, 2), 'cm')
# 3. The body: pitch level from its folds (on free speech's register), formants from its tract, pace from its rate.
bodies = json.load(open(bodies_file))
import os
REG, BREATH, TAG = float(os.environ.get('REG', '1')), float(os.environ.get('BREATH', '0')), os.environ.get('TAG', '')
for name, b in bodies.items():
    if os.environ.get('ONLY') and name not in os.environ['ONLY'].split(','): continue
    L, f0b, rate = b['copies']['tract'], b['copies']['f0'] * REG, b['sylPerS']
    stretch = avg_rate / rate; T = int(round(len(grid) * stretch)); src = np.clip(np.round(np.arange(T) / stretch).astype(int), 0, len(grid) - 1)
    sp_b = warp(env[src], L / Lref); f0_b = np.where(vo[src], np.exp(dev[src] + np.log(f0b)), 0.0)
    ap_b = ap[src].copy()
    if BREATH:
        # Probe: a glottis that does not close (a posterior gap) leaks air: more noise above 1.5 kHz in voiced frames (BREATH dB
        # more aperiodic energy) and a steeper source (the same dB less at 4 kHz, linear in octaves above 500 Hz) [ASSUMED sizes].
        fr = np.arange(sp_b.shape[1]) * FS / (2 * (sp_b.shape[1] - 1)); vmask = f0_b > 0
        lift = np.clip(10 ** (BREATH / 20), 1, None); hi = fr > 1500
        ap_b[np.ix_(vmask, hi)] = np.clip(ap_b[np.ix_(vmask, hi)] * lift, 0, 0.999)
        tilt = 10 ** (-BREATH * np.clip(np.log2(np.maximum(fr, 500) / 500) / 3, 0, None) / 10); sp_b[vmask] *= tilt
    y = pw.synthesize(np.ascontiguousarray(f0_b), np.ascontiguousarray(sp_b), np.ascontiguousarray(ap_b), FS, FP)
    y = y / np.abs(y).max() * 0.9; sf.write(f'{out_dir}/A-{name}{TAG}.wav', y, FS, subtype='PCM_16')
    print(name, 'f0', round(f0b, 1), 'tract', round(L, 2), 'rate', rate, '->', round(len(y) / FS, 2), 's')
