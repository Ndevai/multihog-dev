# The averaged person as a recording: 16 EARS speakers' Pocket copies of a 10-second passage, analysed (WORLD), envelopes on
# one tract, aligned (DTW) and averaged as build_a.py does; the melody smoothed and kept at the takes' own range (Praat). Saved
# as WORLD features (avg_prompt.npz) and as audio at the group's own pitch and tract (avg_prompt.wav).
import sys, json, numpy as np, soundfile as sf, warnings
warnings.filterwarnings('ignore')
sys.argv = ['build_a.py', '/dev/null', '/tmp', "The north wind and the sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first made him take it off would be the stronger.", '0']
src = open('build_a.py').read(); src = src[:src.index("# The averaged voice's own tract, measured")]
exec(compile(src, 'build_a.py', 'exec'))
f0 = np.where(vo, np.exp(dev + np.log(150.0)), 0.0)
np.savez('avg_prompt.npz', env=env, ap=ap, vo=vo, dev=dev, FS=FS, FP=FP)
y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(env), np.ascontiguousarray(ap), FS, FP); y = y / np.abs(y).max() * 0.9
sf.write('avg_prompt.wav', y, FS, subtype='PCM_16'); print('prompt', round(len(y) / FS, 2), 's')
