# Each family's recording (and at half strength) against neutral: pitch (semitones), pitch range (5-95 %, semitones), length
# (rate), loudness of voiced frames (dB, before the files' peak normalisation is undone: the files are peak-normalised, so this
# reads the envelope's shape, not level), and high-frequency energy above 1 kHz against below (dB): Juslin & Laukka's cues.
import sys, numpy as np, parselmouth as pm
def meas(p):
    s = pm.Sound(p); f1 = s.to_pitch_ac(pitch_floor=60, pitch_ceiling=700).selected_array['frequency']; f1 = f1[f1 > 0]
    f = s.to_pitch_ac(pitch_floor=max(40, 0.75 * np.percentile(f1, 25)), pitch_ceiling=1.5 * np.percentile(f1, 75)).selected_array['frequency']; f = f[f > 0]
    x = s.values[0]; X = np.abs(np.fft.rfft(x)) ** 2; fq = np.fft.rfftfreq(len(x), 1 / s.sampling_frequency)
    return np.median(f), 12 * np.log2(np.percentile(f, 95) / np.percentile(f, 5)), len(x) / s.sampling_frequency, 10 * np.log10(X[(fq > 1000) & (fq < 5000)].sum() / X[(fq > 80) & (fq < 1000)].sum())
n = meas('probe/emo-neutral.wav')
print(f"neutral: {n[0]:.1f} Hz, range {n[1]:.1f} st, {n[2]:.2f} s, tilt {n[3]:.1f} dB")
for fam in sys.argv[1:]:
    for w in ('0.5', '1'):
        m = meas(f'probe/emo-{fam}-{w}.wav')
        print(f"{fam:10s} w={w:3s} pitch {12 * np.log2(m[0] / n[0]):+5.1f} st  range {m[1] - n[1]:+5.1f} st  length {100 * (m[2] / n[2] - 1):+4.0f} %  high-frequency energy {m[3] - n[3]:+5.1f} dB")
