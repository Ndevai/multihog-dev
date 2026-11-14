# One VocalTractLab step per process (its close call crashes): the speaker to load is copied over the package's bundled one
# before import (the package loads that file on import), and the process ends without closing.
import sys, os, json, shutil, numpy as np
mode, spk = sys.argv[1], sys.argv[2]
PKG = os.path.join(os.path.dirname(os.path.dirname(os.__file__)), 'site-packages', 'vocaltractlab_cython') if False else None
import importlib.util
spec = importlib.util.find_spec('vocaltractlab_cython'); res = os.path.join(os.path.dirname(spec.origin), 'resources', 'JD3.speaker')
shutil.copy(spk, res)
import vocaltractlab_cython as vc
shutil.copy(os.path.join(os.path.dirname(__file__), 'JD3.orig.speaker'), res)
def spacing():
    st = vc.get_shape('@', 'tract'); tf = vc.tract_state_to_transfer_function(st, n_spectrum_samples=8192)
    mag = np.array(tf['magnitude_spectrum']); f = np.arange(len(mag)) * 44100 / 8192
    pk = [f[i] for i in range(2, len(mag) - 2) if mag[i] > mag[i - 1] and mag[i] > mag[i + 1] and f[i] > 150][:3]
    x = np.array([0.5, 1.5, 2.5]); return float(np.dot(x, pk) / np.dot(x, x)), pk
out = {}
if mode == 'ages':                       # anatomy of the reference grown to t years, female and male curves
    t = float(sys.argv[3]); vc.set_anatomy_from_age(int(round(t * 12)), False); out['fem'] = list(vc.get_anatomy_params())
    vc.set_anatomy_from_age(int(round(t * 12)), True); out['mal'] = list(vc.get_anatomy_params())
elif mode == 'anatomy':                  # set the given anatomy on the reference, save it
    vc.set_anatomy_params(np.array(json.loads(sys.argv[3]), dtype=float)); vc.save_speaker(sys.argv[4])
    # VocalTractLab's writer drops each tract parameter's unit, and its reader then crashes: the units put back from the original.
    import re
    o = open(os.path.join(os.path.dirname(__file__), 'JD3.orig.speaker')).read(); x = open(sys.argv[4]).read()
    units = dict(re.findall(r'<param index="\d+"\s+name="(\w+)"\s+description="[^"]*"\s+unit="([^"]*)"', o[:o.index('<shapes>')]))
    x = re.sub(r'(<param index="\d+"\s+)name="(\w+)"(\s+)description="([^"]*)"\s+(?=min=)', lambda m: f'{m.group(1)}name="{m.group(2)}"{m.group(3)}description="{m.group(4)}" unit="{units.get(m.group(2), "")}" ', x)
    open(sys.argv[4], 'w').write(x)
elif mode == 'measure':                  # the neutral vowel's formant spacing
    out['spacing'], out['peaks'] = spacing()
elif mode == 'vowels':                   # F1-F4 of each vowel shape (transfer function peaks)
    for v in ['a', 'e', 'i', 'o', 'u', 'E', 'I', 'O', 'U', '@', '6', '2', 'y', '9', 'Y', 'E:']:
        st = vc.get_shape(v, 'tract'); tf = vc.tract_state_to_transfer_function(st, n_spectrum_samples=8192)
        mag = np.array(tf['magnitude_spectrum']); f = np.arange(len(mag)) * 44100 / 8192
        out[v] = [float(f[i]) for i in range(2, len(mag) - 2) if mag[i] > mag[i - 1] and mag[i] > mag[i + 1] and f[i] > 150][:4]
elif mode == 'synth':                    # segments -> gestures (pitch tier replaced) -> audio
    seg, ges, wav, f0json = sys.argv[3], sys.argv[4], sys.argv[5], sys.argv[6]
    vc.phoneme_file_to_gesture_file(seg, ges)
    import re
    gs = json.load(open(f0json)); g = open(ges).read()
    g = re.sub(r'(<gesture_sequence type="f0-gestures"[^>]*>).*?(</gesture_sequence>)', lambda m: m.group(1) + '\n' + '\n'.join(gs) + '\n    ' + m.group(2), g, flags=re.S)
    open(ges, 'w').write(g); a = vc.gesture_file_to_audio(ges, wav); out['samples'] = int(len(a))
print('RESULT ' + json.dumps(out), flush=True); os._exit(0)
