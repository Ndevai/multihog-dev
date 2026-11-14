# The five vocal families' averaged persons (Juslin & Laukka 2003): for each, the 16 speakers of the neutral averaged person
# copied by Pocket TTS from their EARS emotional free speech (middle 10 s; anger, fear, amusement for happiness, sadness,
# adoration for tenderness), saying the passage; analysed by WORLD; each take's melody measured from that speaker's own neutral
# take (EARS emo_neutral_freeform) so the emotion's rise or fall is kept; envelopes on the group's tract, aligned by DTW and
# averaged; the melody smoothed over 80 ms and kept at the emotional takes' own 5-95 % range (Praat); then aligned to the
# neutral averaged person (avg_prompt.npz) frame by frame, each frame keeping its local duration. Writes emotion-<family>.bin.
import sys, os, json, struct, numpy as np, soundfile as sf, warnings, onnxruntime as ort, parselmouth as pm
warnings.filterwarnings('ignore'); import pyworld as pw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.path.insert(0, 'onnx-src'); import pocket_tts_onnx as P
FS, FP = 24000, 5.0
TEXT = "The north wind and the sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first made him take it off would be the stronger."
IDS = ['p004', 'p016', 'p023', 'p039', 'p054', 'p071', 'p081', 'p088', 'p002', 'p018', 'p030', 'p041', 'p051', 'p061', 'p070', 'p084']
FAMILIES = {'anger': 'anger', 'fear': 'fear', 'happiness': 'amusement', 'sadness': 'sadness', 'tenderness': 'adoration'}
cat = json.load(open('ears_praat.json'))
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
def warp(sp, k):
    n = sp.shape[1]; f = np.arange(n); src = np.clip(f * k, 0, n - 1)
    return np.exp(np.array([np.interp(src, f, np.log(row + 1e-12)) for row in sp]))
def dtw(a, b):
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
def praat_range(a):
    s = pm.Sound(a, FS); f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    f2 = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)).selected_array['frequency']; f2 = f2[f2 > 0]
    return float(np.percentile(np.log(f2), 95) - np.percentile(np.log(f2), 5))
m = C(models_dir='onnx', language='english_2026-04', temperature=0.7)
def take(sid, emo):
    np.random.seed(7); a = m.generate(TEXT, m.encode_voice(f'emo16/{sid}_{emo}.wav')).astype(np.float64)
    i = np.nonzero(np.abs(a) > 0.01 * np.abs(a).max())[0]; a = a[max(0, i[0] - 1200): i[-1] + 1200]
    f0, t = pw.harvest(a, FS, f0_floor=60, f0_ceil=600, frame_period=FP); return a, f0, pw.cheaptrick(a, f0, t, FS), pw.d4c(a, f0, t, FS)
# Each speaker's neutral baseline: the mean ln f0 of their copy from their own neutral emotional-session recording.
base = {}
for sid in IDS:
    a, f0, sp, ap = take(sid, 'neutral'); base[sid] = float(np.log(f0[f0 > 0]).mean())
N = np.load('avg_prompt.npz'); n_env, n_vo = N['env'], N['vo']; Lref = float(np.mean([cat[s]['copy']['tract'] for s in IDS]))
n_feat = pw.code_spectral_envelope(np.ascontiguousarray(n_env), FS, 30)[:, 1:]
for fam, emo in FAMILIES.items():
    takes = []
    for sid in IDS:
        a, f0, sp, ap = take(sid, emo); v = f0 > 0
        spn = warp(sp, Lref / cat[sid]['copy']['tract'])
        takes.append({'f0': f0, 'spn': spn, 'ap': ap, 'dev': np.where(v, np.log(np.maximum(f0, 1)) - base[sid], 0.0), 'feat': pw.code_spectral_envelope(spn, FS, 30)[:, 1:], 'range': praat_range(a), 'rate': 46 / (len(a) / FS)})
    ref = takes[0]; n = len(ref['f0']); maps = [np.arange(n, dtype=float)] + [dtw(ref['feat'], t['feat']) for t in takes[1:]]
    at = lambda t, mp, key: t[key][np.clip(np.round(mp).astype(int), 0, len(t[key]) - 1)]
    env = np.exp(np.mean([np.log(at(t, mp, 'spn') + 1e-12) for t, mp in zip(takes, maps)], 0)); apv = np.mean([at(t, mp, 'ap') for t, mp in zip(takes, maps)], 0)
    vs = np.array([at(t, mp, 'f0') > 0 for t, mp in zip(takes, maps)]); vo = vs.mean(0) > 0.5
    devs = np.array([at(t, mp, 'dev') for t, mp in zip(takes, maps)]); dev = np.where(vs.sum(0) > 0, (devs * vs).sum(0) / np.maximum(vs.sum(0), 1), 0.0)
    time = np.maximum.accumulate(np.mean(maps, 0) + np.arange(n) * 1e-6); grid = np.arange(0, time[-1], 1.0); k = np.round(np.interp(grid, time, np.arange(n))).astype(int)
    env, apv, vo, dev = env[k], apv[k], vo[k], dev[k]
    vi = np.nonzero(vo)[0]; full = np.interp(np.arange(len(dev)), vi, dev[vi]); sm = np.convolve(np.pad(full, 8, mode='edge'), np.ones(16) / 16, mode='same')[8:-8]
    lev = float(np.median(sm[vo])); rng = lambda x: np.percentile(x, 95) - np.percentile(x, 5); own = float(np.median([t['range'] for t in takes]))
    dev = lev + (sm - lev) * own / max(rng(sm[vo]), 1e-6)
    # Aligned to the neutral averaged person: for each of its frames, the emotional frame and how many emotional frames it spans.
    e_feat = pw.code_spectral_envelope(np.ascontiguousarray(env), FS, 30)[:, 1:]; mp = dtw(n_feat, e_feat)
    dur = np.gradient(np.convolve(np.pad(mp, 10, mode='edge'), np.ones(21) / 21, mode='same')[10:-10]); dur = np.clip(dur, 0.25, 4.0)
    j = np.clip(np.round(mp).astype(int), 0, len(dev) - 1)
    out = {'env': env[j], 'ap': apv[j], 'vo': vo[j], 'dev': dev[j], 'dur': dur}
    np.savez(f'emotion-{fam}.npz', **out)
    print(f"{fam:10s} ({emo}): pitch {12 * lev / np.log(2):+.1f} st from neutral, range {12 * own / np.log(2):.1f} st, length {len(dev) / len(n_vo):.2f} x neutral, take rate {np.median([t['rate'] for t in takes]):.2f} syl/s", flush=True)
json.dump({'base': base, 'Lref': Lref}, open('emotion-base.json', 'w'))
