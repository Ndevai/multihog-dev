# emotion-<family>.bin from emotion-<family>.npz: the averaged-person format (averaged-person.ts) with the neutral file's own
# measures and frame count, then each frame's duration (float32).
import sys, json, struct, numpy as np
SRC = {'anger': 'anger', 'fear': 'fear', 'happiness': 'amusement', 'sadness': 'sadness', 'tenderness': 'adoration'}
neutral = open('averaged-person.bin', 'rb').read(); hl = struct.unpack('<I', neutral[4:8])[0]; nh = json.loads(neutral[8:8 + hl])
for fam in sys.argv[1:]:
    Z = np.load(f'emotion-{fam}.npz'); env, ap, vo, dev, dur = Z['env'], Z['ap'], Z['vo'], Z['dev'], Z['dur']
    assert len(vo) == nh['frames'], (fam, len(vo), nh['frames'])
    h = dict(nh); h.update({'dur': True, 'family': fam, 'emotion': SRC[fam],
        'made': f"the 16 speakers of the neutral averaged person copied by Pocket TTS from their EARS emo_{SRC[fam]}_freeform recordings (middle 10 s), saying the same passage; WORLD features averaged as the neutral file's, the melody measured from each speaker's own neutral take, then aligned frame by frame to the neutral file (DTW), each frame keeping its local duration (history/review-tests/causal-voice/build_emo.py)"})
    hb = json.dumps(h).encode('utf8')
    envq = np.clip(np.round(np.log(np.maximum(env[:, ::2], 1e-14)) * 1000), -32768, 32767).astype('<i2')
    apq = np.clip(np.round(-20 * np.log10(np.maximum(ap[:, ::8], 1e-3)) * 4), 0, 255).astype('u1')
    with open(f'emotion-{fam}.bin', 'wb') as fh:
        fh.write(b'RVAP'); fh.write(struct.pack('<I', len(hb))); fh.write(hb)
        fh.write(vo.astype('u1').tobytes()); fh.write(dev.astype('<f4').tobytes()); fh.write(envq.tobytes()); fh.write(apq.tobytes()); fh.write(dur.astype('<f4').tobytes())
    print(fam, 'frames', len(vo), 'mean duration', round(float(dur.mean()), 3), 'voiced', round(float(vo.mean()), 2))
