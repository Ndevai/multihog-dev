# Build B: physics all the way. VocalTractLab (Birkholz; 3D vocal tract, tube acoustics, geometric glottis) speaks eSpeak's
# phonemes at each body's pace; the body's causes set the tract's anatomy (the reference speaker grown along VocalTractLab's
# growth curves to the body's growth state, a male's larynx and pharynx by his puberty's progress, then every length scaled
# so the neutral vowel's formant spacing gives the engine's tract length), the folds' rest length, thickness and pitch.
import sys, json, subprocess, re, numpy as np
from math import exp
S = '/tmp/claude-0/-home-user/26640b87-f889-5042-96a2-8de1ebfc8fbc/scratchpad'; V = f'{S}/vtl'; W = f'{V}/work'
bodies, phones = json.load(open(f'{S}/bodies.json')), json.load(open(f'{S}/phones.json'))
def child(*a):
    r = subprocess.run([f'{V}/venv/bin/python', '-I', f'{V}/vtl_child.py', *map(str, a)], capture_output=True, text=True, cwd=W)
    line = [l for l in r.stdout.splitlines() if l.startswith('RESULT ')]
    if not line: raise RuntimeError(r.stdout[-500:] + r.stderr[-800:])
    return json.loads(line[-1][7:])
V1 = {'iː': 'i', 'i': 'i', 'ɪ': 'I', 'ᵻ': 'I', 'ɛ': 'E', 'æ': 'a', 'ɑː': 'a', 'ɑ': 'a', 'ʌ': '6', 'ɔː': 'O', 'ɔ': 'O', 'ʊ': 'U',
      'uː': 'u', 'u': 'u', 'ə': '@', 'ɚ': '6', 'ɜː': '9', 'ɝ': '9', 'aɪ': 'aI', 'aʊ': 'aU', 'ɔɪ': 'OY', 'ɐ': '6'}
V2 = {'eɪ': ('e', 'I'), 'oʊ': ('o', 'U'), 'ɪɹ': ('I', '6'), 'ɛɹ': ('E', '6'), 'ɑːɹ': ('a', '6'), 'ɔːɹ': ('O', '6'), 'ʊɹ': ('U', '6'), 'əl': ('@', 'l'), 'iə': ('i', '@')}
C = {'p': 'p', 'b': 'b', 't': 't', 'd': 'd', 'k': 'k', 'g': 'g', 'ɡ': 'g', 'f': 'f', 'v': 'v', 's': 's', 'z': 'z', 'h': 'h', 'm': 'm',
     'n': 'n', 'l': 'l', 'j': 'j', 'ʃ': 'S', 'ʒ': 'Z', 'tʃ': 'tS', 'dʒ': 'dZ', 'θ': 'T', 'ð': 'D', 'ŋ': 'N', 'w': 'U', 'ɹ': '6', 'r': '6', 'ɾ': 'd', 'ʔ': ''}
VOWELS = set(V1.values()) | {'e', 'o', 'I', 'U', '6', '@'}
def segments(ph, end_ms):
    out = [('', 0.08, False)]
    for k, (p, t) in enumerate(ph):
        d = max(0.03, ((ph[k + 1][1] if k + 1 < len(ph) else end_ms) - t) / 1000); stressed = 'ˈ' in p; q = p.replace('ˈ', '').replace('ˌ', '')
        if not q: out.append(('', d, False)); continue
        if q in V2: a, b = V2[q]; out += [(a, d * 0.6, stressed), (b, d * 0.4, False)]; continue
        name = V1.get(q, C.get(q))
        if name is None: print('unmapped', q); name = '@'
        out.append((name, d, stressed and q in V1))
    return out + [('', 0.1, False)]
def share(male, t):
    p = {True: (174.6, 162.9, 0.1124, 1.2397, 14.60), False: (163.4, 152.7, 0.1320, 1.1785, 12.49)}[male]
    return 1 - 2 * (1 - p[1] / p[0]) / (exp(p[2] * (t - p[4])) + exp(p[3] * (t - p[4])))
LENGTHS = list(range(11))   # every anatomy parameter but the fold length (11) and the oral-pharyngeal angle (12)
ref = f'{V}/JD3.orig.speaker'
for name, b in bodies.items():
    t = 1.0
    while t < 25 and share(b['male'], t) < b['share'] - 1e-4: t += 0.01
    g = child('ages', ref, t); fem, mal = np.array(g['fem']), np.array(g['mal']); P = b['puberty'] if b['male'] else 0.0
    an = fem + (mal - fem) * P; an[11] = min(2.0, max(0.5, b['foldCm']))
    target = 35300 / (2 * b['tract']); spk = f'{W}/{name}.speaker'; s = 1.0
    for _ in range(4):
        a2 = an.copy(); a2[LENGTHS] *= s; child('anatomy', ref, json.dumps(list(a2)), spk); sp = child('measure', spk)['spacing']; s *= sp / target
    a2 = an.copy(); a2[LENGTHS] *= s; child('anatomy', ref, json.dumps(list(a2)), spk); m = child('measure', spk)
    # The folds: rest length from the engine; rest thickness in proportion to the engine's against the mean man's (0.30 cm,
    # VocalTractLab's 0.45 for its man); rest f0 the engine's resting pitch.
    x = open(spk).read()
    def setp(x, pname, val):
        return re.sub(rf'(<param index="\d+" name="{pname}"[^>]*?neutral=")[^"]*(")', rf'\g<1>{val:.6f}\g<2>', x, count=1)
    x = setp(x, 'RL', min(2.0, max(0.5, b['foldCm']))); x = setp(x, 'RT', min(1.0, max(0.3, 0.45 * b['foldThicknessCm'] / 0.30))); x = setp(x, 'RF0', b['f0'])
    open(spk, 'w').write(x)
    seg = segments(phones[name]['phones'], phones[name]['endMs'])
    with open(f'{W}/{name}.seg', 'w') as fh:
        for sg in seg: fh.write(f'name = {sg[0]}; duration_s = {sg[1]:.6f};\n')
    # The pitch: free speech's level for this body (as in Build A); stressed vowels 2 st up, a 3 st fall on a vowel before a
    # pause [ASSUMED: neither build has a motor model of intonation; Build A takes its melody from 16 speakers instead].
    base = 12 * np.log2(b['copies']['f0']); gs = []
    for k, sg in enumerate(seg):
        up = 2.0 if sg[2] else 0.0; fall = -3.0 if (sg[0] in VOWELS and k + 1 < len(seg) and seg[k + 1][0] == '') else 0.0
        gs.append(f'      <gesture value="{base + up + fall:.3f}" slope="0.000000" duration_s="{sg[1]:.6f}" time_constant_s="0.030000" neutral="0" />')
    json.dump(gs, open(f'{W}/{name}.f0.json', 'w'))
    r = child('synth', spk, f'{W}/{name}.seg', f'{W}/{name}.ges', f'{W}/B-{name}.wav', f'{W}/{name}.f0.json')
    print(f"{name:8s} growth state = typical {t:5.2f} y, length scale {s:.3f}: neutral formants {[round(p) for p in m['peaks']]}, tract {35300 / (2 * m['spacing']):.2f} cm (engine {b['tract']}); folds {b['foldCm']:.2f} cm; {r['samples'] / 44100:.2f} s", flush=True)
