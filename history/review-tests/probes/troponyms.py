# For seed verbs, print each verb synset (definition, members) and its troponym closure (synsets whose hypernym chain reaches it).
import pickle, sys
sense_syn, deriv, syn, members, lemma_of_sense = pickle.load(open(sys.argv[1], 'rb'))
by_lemma = {}
for s, y in sense_syn.items():
    w = lemma_of_sense[s]
    if syn.get(y, (None,)*4)[3] == 'v': by_lemma.setdefault(w, []).append(y)
kids = {}
for y, v in syn.items():
    if v[3] == 'v':
        for h in v[2]: kids.setdefault(h, []).append(y)
def closure(y):
    out, st = [], [y]
    while st:
        x = st.pop(); out.append(x); st.extend(kids.get(x, []))
    return out
for w in sys.argv[2:]:
    if '=' in w:
        y = w.split('=')[1]; c = closure(y)
        print(f'== {y}: {syn[y][0]} | {len(c)} synsets:', ' '.join(sorted({m for z in c for m in members[z]})))
        continue
    for y in dict.fromkeys(by_lemma.get(w, [])):
        print(f'{w}\t{y}\t{syn[y][0][:90]}\t[{", ".join(members[y][:8])}]\ttroponyms {len(closure(y)) - 1}')
