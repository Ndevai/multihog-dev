# Does a Pocket TTS copy carry the emotion of the recording it copies? Each emotional free-speech clip (and the neutral one) of
# EARS p003 and p031 copied saying the same passage, seed fixed; per take: median pitch, pitch range (5-95 %, semitones), speech
# rate (46 syllables over the span), loudness of the voiced frames (dB), spectral tilt (energy above 1 kHz against below, dB);
# printed as the difference from the speaker's neutral take; also the recordings themselves, for the same measures.
import sys, glob, numpy as np, soundfile as sf, onnxruntime as ort, parselmouth as pm
sys.path.insert(0, 'onnx-src'); import pocket_tts_onnx as P
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
TEXT = "The north wind and the sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first made him take it off would be the stronger."
def meas(p, syl=None):
    s = pm.Sound(p)
    if s.n_channels > 1: s = s.convert_to_mono()
    f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    f = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)).selected_array['frequency']; f = f[f > 0]
    x = s.values[0]; fs = s.sampling_frequency; hop = int(0.01 * fs)
    fr = np.array([x[i:i + hop] for i in range(0, len(x) - hop, hop)]); e = np.sqrt((fr ** 2).mean(1)) + 1e-9; db = 20 * np.log10(e)
    on = db > db.max() - 35; idx = np.nonzero(on)[0]; span = (idx[-1] - idx[0]) * 0.01
    X = np.abs(np.fft.rfft(x)) ** 2; fq = np.fft.rfftfreq(len(x), 1 / fs); tilt = 10 * np.log10(X[(fq > 1000) & (fq < 5000)].sum() / X[(fq > 80) & (fq < 1000)].sum())
    return {'f0': np.median(f), 'range': 12 * np.log2(np.percentile(f, 95) / np.percentile(f, 5)), 'rate': syl / span if syl else None, 'loud': np.median(db[on]), 'tilt': tilt}
m = C(models_dir='onnx', language='english_2026-04', temperature=0.7)
rows = {}
for p in sorted(glob.glob('emo/*.wav')):
    spk, emo = p.split('/')[-1][:-4].split('_', 1)
    np.random.seed(4); a = m.generate(TEXT, m.encode_voice(p)); out = f'emo/copy-{spk}_{emo}.wav'; sf.write(out, a, 24000, subtype='PCM_16')
    rows[(spk, emo)] = (meas(out, 46), meas(p))
for spk in ['p003', 'p031']:
    n_c, n_r = rows[(spk, 'neutral')]
    print(f'{spk}: copy (recording) against neutral: pitch semitones, range semitones, rate %, loudness dB, tilt dB')
    for (s, emo), (c, r) in rows.items():
        if s != spk or emo == 'neutral': continue
        d = lambda a, b: 12 * np.log2(a / b)
        print(f"  {emo:14s} pitch {d(c['f0'], n_c['f0']):+5.1f} ({d(r['f0'], n_r['f0']):+5.1f})  range {c['range'] - n_c['range']:+5.1f} ({r['range'] - n_r['range']:+5.1f})  rate {100 * (c['rate'] / n_c['rate'] - 1):+4.0f}  loud {c['loud'] - n_c['loud']:+5.1f} ({r['loud'] - n_r['loud']:+5.1f})  tilt {c['tilt'] - n_c['tilt']:+5.1f} ({r['tilt'] - n_r['tilt']:+5.1f})")
