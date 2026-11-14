# The middle 10 s of each of the 16 averaged-person speakers' emotional free speech, for the five vocal families' EARS emotions.
import io, wave, numpy as np, soundfile as sf
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from zipranges import RangeZip
IDS = ['p004', 'p016', 'p023', 'p039', 'p054', 'p071', 'p081', 'p088', 'p002', 'p018', 'p030', 'p041', 'p051', 'p061', 'p070', 'p084']
EMO = ['neutral', 'anger', 'fear', 'amusement', 'sadness', 'adoration']
for sid in IDS:
    z = RangeZip(f'https://github.com/facebookresearch/ears_dataset/releases/download/dataset/{sid}.zip')
    for e in EMO:
        out = f'emo16/{sid}_{e}.wav'
        try: open(out).close(); continue
        except FileNotFoundError: pass
        x, fs = sf.read(io.BytesIO(z.read(f'{sid}/emo_{e}_freeform.wav')))
        x = x if x.ndim == 1 else x.mean(1); n = len(x); seg = x[max(0, n // 2 - 5 * fs): max(0, n // 2 - 5 * fs) + 10 * fs]
        sf.write(out, seg, fs, subtype='PCM_16'); print(sid, e, round(n / fs, 1), 's', flush=True)
