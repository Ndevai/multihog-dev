# For seed nouns, print each noun synset (lexfile, definition, members, hyponym count); "=id" prints the closure's lemmas.
import pickle, sys
lemmas, syn = pickle.load(open(sys.argv[1], 'rb'))
kids = {}
for y, v in syn.items():
    for h in v[1]: kids.setdefault(h, []).append(y)
def closure(y):
    out, st = [], [y]
    while st:
        x = st.pop(); out.append(x); st.extend(kids.get(x, []))
    return out
for w in sys.argv[2:]:
    if w.startswith('='):
        c = closure(w[1:]); ws = sorted({m for z in c if not syn[z][4] for m in syn[z][3]})
        print(f'== {w[1:]} {syn[w[1:]][2][:60]} | {len(c)} synsets {len(ws)} lemmas:', ' '.join(ws)[:3000]); continue
    for y in dict.fromkeys(lemmas.get(w, [])):
        if y in syn: print(f'{w}\t{y}\t{syn[y][0]}\t{syn[y][2][:80]}\t[{", ".join(syn[y][3][:6])}]\thypo {len(closure(y)) - 1}')
