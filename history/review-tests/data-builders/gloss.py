# Lesk (1986) bags: for each verb whose VerbNet classes route to different tools, each class's words from WordNet: the
# definitions and examples of the senses VerbNet's members name (wn keys), their synonyms, their hypernyms' lemmas, and the
# lemmas of the senses derived from them. Output JSON verb -> class -> "w w w".
import os, re, sys, json, pickle, xml.etree.ElementTree as ET
vndir, wnv, router_ts, out = sys.argv[1:5]
sense_syn, deriv, syn, members, lemma_of = pickle.load(open(wnv, 'rb'))
src = open(router_ts).read()
blk = lambda n: src[src.index(f'const {n}'):src.index('};', src.index(f'const {n}'))]
ct = {m.group(1): [x.strip().strip("'") for x in m.group(2).split(',') if x.strip()] for m in re.finditer(r"([a-z_]+): \[([^\]]*)\]", blk('CLASS_TOOL'))}
STOP = set('a an the of to in on at by for with from into onto as or and but not no be is are was were been being have has had do does did this that these those it its one ones someone something somebody anything everything person thing things cause make made get give take put go come become also especially usually often very more most other such some any all each every so than then there their them they he she his her him you your we our who which what when where how up down out off over under through about against between one\'s oneself'.split())
keys = {}
for f in sorted(os.listdir(vndir)):
    if not f.endswith('.xml'): continue
    cls = f[:-4]
    for m in re.finditer(r'<MEMBER [^>]*>', open(os.path.join(vndir, f)).read()):
        t = m.group(0); name = re.search(r'name="([^"]+)"', t).group(1).lower(); wn = re.search(r'wn="([^"]*)"', t)
        for key in (wn.group(1).split() if wn else []):
            keys.setdefault(name, {}).setdefault(cls, []).append(key.replace('?', ''))
TOP = lambda c: re.sub(r'-[\d.]+$', '', c)
res = {}
for v, classes in keys.items():
    if '_' in v: continue
    sets = {','.join(ct.get(TOP(c), [])) for c in classes}
    if len(classes) < 2 or len(sets) < 2: continue
    row = {}
    for c, ks in classes.items():
        words = []
        def add(text):
            for w in re.findall(r"[a-z]+", text.lower()):
                if len(w) > 2 and w not in STOP and w != v and w not in words: words.append(w)
        for key in ks:
            m = re.match(r'([^%]+)%(\d):(\d\d):(\d\d)', key)
            if not m: continue
            sid = f"oewn-{m.group(1).replace(' ', '_')}__{m.group(2)}.{m.group(3)}.{m.group(4)}.."
            y = sense_syn.get(sid)
            if not y or y not in syn: continue
            d, ex, hyp, pos, lex = syn[y]
            add(d); [add(e) for e in ex[:2]]
            add(' '.join(members.get(y, [])))
            for h in hyp[:1]: add(' '.join(members.get(h, [])))
            for t in deriv.get(sid, []): add(lemma_of.get(t, ''))
        if words: row[c] = ' '.join(words[:18])
    if len(row) >= 2: res[v] = row
json.dump(res, open(out, 'w'))
print(len(res), 'verbs with gloss bags')
for v in ['fire', 'charge', 'strike', 'pass', 'lead']: print(v, json.dumps(res.get(v))[:600])
