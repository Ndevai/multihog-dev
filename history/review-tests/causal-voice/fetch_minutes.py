# One minute from the middle of each of two free monologues (freeform_speech_01 and _02) per native English EARS speaker.
import sys, os, json, numpy as np, soundfile as sf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zipranges import RangeZip, read_pcm_slice
meta = json.load(open('ears/speaker_statistics.json')); os.makedirs('minutes', exist_ok=True)
for sid, m in sorted(meta.items()):
    if m['native language'] not in ('american english', 'british english') or m['gender'] not in ('male', 'female'): continue
    if all(os.path.exists(f'minutes/{sid}_{k}.wav') for k in ('01', '02')): continue
    try:
        z = RangeZip(f'https://github.com/facebookresearch/ears_dataset/releases/download/dataset/{sid}.zip')
        for k in ('01', '02'):
            name = f'{sid}/freeform_speech_{k}.wav'; x, fs, fmt = read_pcm_slice(z, name, 0, 0.01); bps = fs * fmt[0] // 8; dur = z.members[name][2] / bps
            x, fs, fmt = read_pcm_slice(z, name, max(0, dur / 2 - 30), 60); sf.write(f'minutes/{sid}_{k}.wav', x, fs, subtype='PCM_16')
        print(sid, 'ok', flush=True)
    except Exception as ex: print(sid, 'failed', ex, flush=True)
