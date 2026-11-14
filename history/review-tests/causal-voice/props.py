# The tract's proportions: each vowel's F1-F4 in VocalTractLab's anatomy grown to a girl of 11 and to an adult woman, each
# scaled to the engine's tract (14.4 and 15.8 cm); per vowel and formant, the girl's ratio to the woman's, divided by the
# uniform ratio (15.8 / 14.4): what a uniform shrink misses.
import json, subprocess, numpy as np
from math import exp
V = '/tmp/claude-0/-home-user/26640b87-f889-5042-96a2-8de1ebfc8fbc/scratchpad/vtl'; W = f'{V}/work'
def child(*a):
    r = subprocess.run([f'{V}/venv/bin/python', '-I', f'{V}/vtl_child.py', *map(str, a)], capture_output=True, text=True, cwd=W)
    return json.loads([l for l in r.stdout.splitlines() if l.startswith('RESULT ')][-1][7:])
def share(t):
    p = (163.4, 152.7, 0.1320, 1.1785, 12.49); return 1 - 2 * (1 - p[1] / p[0]) / (exp(p[2] * (t - p[4])) + exp(p[3] * (t - p[4])))
ref = f'{V}/JD3.orig.speaker'; res = {}
for name, sh, tract in [('girl11', 0.8683, 14.4), ('woman', 1.0, 15.8)]:
    t = 1.0
    while t < 25 and share(t) < sh - 1e-4: t += 0.01
    an = np.array(child('ages', ref, t)['fem']); spk = f'{W}/prop-{name}.speaker'; s = 1.0; target = 35300 / (2 * tract)
    for _ in range(4):
        a2 = an.copy(); a2[list(range(11))] *= s; child('anatomy', ref, json.dumps(list(a2)), spk); s *= child('measure', spk)['spacing'] / target
    a2 = an.copy(); a2[list(range(11))] *= s; child('anatomy', ref, json.dumps(list(a2)), spk)
    res[name] = child('vowels', spk); print(name, 'growth age', round(t, 2), 'anatomy', [round(x, 2) for x in a2[:11]])
u = 15.8 / 14.4; out = {}
for v in res['woman']:
    g, w = res['girl11'][v], res['woman'][v]
    if len(g) == 4 and len(w) == 4: out[v] = {'woman': [round(x) for x in w], 'ratio_over_uniform': [round(g[i] / w[i] / u, 3) for i in range(4)]}
for v, d in out.items(): print(v.ljust(3), d['woman'], d['ratio_over_uniform'])
json.dump({'uniform': u, 'vowels': out}, open(f'{W}/proportions-girl11.json', 'w'))
