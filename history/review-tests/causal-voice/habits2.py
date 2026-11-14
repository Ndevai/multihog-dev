# Speaking habits on one minute from each of two free monologues per native English EARS speaker: melody range (Praat two-pass
# pitch, 5-95 %, semitones), pause share (silences of 150 ms or more, 25 dB under the minute's loudest, over the speech's span),
# breathiness (WORLD D4C aperiodicity, mean dB 500-3000 Hz over voiced frames; DIO + StoneMask pitch for speed). A person's
# habit is the mean of the two minutes; the spread between people with the minutes' disagreement taken out:
# var(true) = var(mean) - var(minute 1 - minute 2) / 4. Within each sex; the habits' correlations with each other, height, age.
import json, glob, numpy as np, soundfile as sf, parselmouth as pm, warnings, scipy.signal as S
warnings.filterwarnings('ignore'); import pyworld as pw
meta = json.load(open('ears/speaker_statistics.json'))
H = {"< 5'": 57.5, "5' - 5'3": 61.5, "5'4 - 5'7": 65.5, "5'8 - 5'11": 69.5, "6' - 6'3": 73.5}
A = {'18-25': 21.5, '26-35': 30.5, '36-45': 40.5, '46-55': 50.5, '56-65': 60.5, '66-75': 70.5}
def habits(x, fs):
    s = pm.Sound(x, fs); f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    f = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)).selected_array['frequency']; f = f[f > 0]
    span = 12 * np.log2(np.percentile(f, 95) / np.percentile(f, 5))
    # Pauses by Praat's own silence finder (To TextGrid (silences): threshold -25 dB under the loudest point, its default, as De
    # Jong & Wempe 2009's speech-rate script also takes it; silences of 0.15 s or more, Mahr et al. 2021's floor; sounding 0.1 s),
    # over the span from the first sounding stretch to the last.
    from parselmouth.praat import call
    tg = call(s, 'To TextGrid (silences)', 100, 0.0, -25.0, 0.15, 0.1, 'silent', 'sounding')
    iv = [(call(tg, 'Get start time of interval', 1, i), call(tg, 'Get end time of interval', 1, i), call(tg, 'Get label of interval', 1, i)) for i in range(1, call(tg, 'Get number of intervals', 1) + 1)]
    snd = [v for v in iv if v[2] == 'sounding']; t0, t1 = snd[0][0], snd[-1][1]
    pause = sum(max(0.0, min(b, t1) - max(a, t0)) for a, b, l in iv if l == 'silent')
    seg = [t1 - t0]
    y = S.resample_poly(x, 1, 2) if fs == 48000 else S.resample_poly(x, 24000, fs); y = np.ascontiguousarray(y, dtype=np.float64)
    f0, t = pw.dio(y, 24000, f0_floor=60, f0_ceil=600, frame_period=5.0); f0 = pw.stonemask(y, f0, t, 24000); ap = pw.d4c(y, f0, t, 24000)
    band = slice(int(500 / 24000 * 1024), int(3000 / 24000 * 1024)); v = f0 > 0
    return span, pause / seg[0], float(np.mean(20 * np.log10(np.maximum(ap[v][:, band], 1e-3))))
rows = []
for sid, m in sorted(meta.items()):
    fs1, fs2 = f'minutes/{sid}_01.wav', f'minutes/{sid}_02.wav'
    try: x1, r1 = sf.read(fs1); x2, r2 = sf.read(fs2)
    except Exception: continue
    a, b = habits(x1, r1), habits(x2, r2)
    rows.append({'id': sid, 'sex': m['gender'], 'height': H.get(m['height'], np.nan) * 2.54, 'age': A.get(m['age'], np.nan), 'a': a, 'b': b}); print(sid, [round(v, 3) for v in a], [round(v, 3) for v in b], flush=True)
json.dump(rows, open('habits2.json', 'w'))
names = ['melody range (st)', 'pause share', 'breathiness (dB)']; summary = {}
for sex in ('male', 'female'):
    R = [r for r in rows if r['sex'] == sex]
    for k, nm in enumerate(names):
        Mn = np.array([(r['a'][k] + r['b'][k]) / 2 for r in R]); D = np.array([r['a'][k] - r['b'][k] for r in R])
        tr = max(0.0, Mn.var(ddof=1) - D.var(ddof=1) / 4); summary.setdefault(sex, {})[nm] = {'mean': float(Mn.mean()), 'sd': float(np.sqrt(tr)), 'raw': float(Mn.std(ddof=1)), 'noise': float(np.sqrt(D.var(ddof=1) / 4)), 'n': len(R), 'r12': float(np.corrcoef([r['a'][k] for r in R], [r['b'][k] for r in R])[0, 1])}
        d = summary[sex][nm]; print(f"{sex:6s} {nm:18s} mean {d['mean']:7.3f}  SD between people {d['sd']:6.3f} (raw {d['raw']:.3f}, noise {d['noise']:.3f}; minute-to-minute r {d['r12']:.2f})  n={d['n']}")
X = np.array([[(r['a'][k] + r['b'][k]) / 2 for k in range(3)] for r in rows]); sx = np.array([r['sex'] == 'male' for r in rows]); ht = np.array([r['height'] for r in rows]); ag = np.array([r['age'] for r in rows])
for s_ in (True, False): X[sx == s_] -= X[sx == s_].mean(0)
ok = ~np.isnan(ht) & ~np.isnan(ag)
print('within sex: range~pause %.2f range~breath %.2f pause~breath %.2f' % (np.corrcoef(X[:, 0], X[:, 1])[0, 1], np.corrcoef(X[:, 0], X[:, 2])[0, 1], np.corrcoef(X[:, 1], X[:, 2])[0, 1]))
for k, nm in enumerate(names): print(f'  {nm:18s} ~ height {np.corrcoef(X[ok, k], ht[ok])[0, 1]:+.2f}  ~ age {np.corrcoef(X[ok, k], ag[ok])[0, 1]:+.2f}')
json.dump(summary, open('habits2-summary.json', 'w'), indent=1)
