# Builds src/rules/data/verb-pre.ts from VerbNet 3.4's event semantics (Generative Lexicon subevents; Brown, Bonn, Kazeminejad,
# Zaenen, Pustejovsky & Palmer 2022, Frontiers in AI 5:821697). For each class and each frame shape a line can take (no object:
# NP V, else NP V PP; one object: NP V NP, else NP V NP PP; two objects: NP V NP NP), the first such frame's syntax gives the
# role of the subject and of each object ("give-13.1" NP V NP: Agent V Theme; "pelt-17.2" NP V NP: Agent V Destination), and its
# semantics what holds before the act (the first subevent, e1: give-13.1 has_possession(e1, Agent, Theme)). A contact between
# the subject and another participant in any subevent (hit-18.1 contact(e3, Agent, Patient); throw-17.1 contact(e2, Agent,
# Theme)) is kept as "contact": two bodies touch only at one place, so the act needs the subject at the other's place, unless
# the frame moves the subject (motion or has_location of the subject).
# Usage: python3 -I pre.py verbnet3.4 out.ts
import xml.etree.ElementTree as ET, os, sys, json
D, out = sys.argv[1], sys.argv[2]
def shape(fr):
    syn = [(e.tag, e.get('value') or '') for e in fr.find('SYNTAX')]
    if not syn or syn[0][0] != 'NP' or 'VERB' not in [t for t, _ in syn]: return None
    v = [t for t, _ in syn].index('VERB')
    if v != 1: return None
    nps = []
    for t, val in syn[2:]:
        if t != 'NP': break
        nps.append(val)
    return syn[0][1], nps, len(syn) == 2 + len(nps)
def preds(fr, subj):
    ps, moves = [], False
    for p in fr.findall('SEMANTICS/PRED'):
        args = [a.get('value') for a in p.findall('ARGS/ARG')]
        if not args: continue
        name = ('!' if p.get('bool') == '!' else '') + p.get('value')
        roles = [a.lstrip('?') for a in args[1:]]
        if name in ('motion', 'has_location', 'path_rel', 'travel') and subj in roles[:1]: moves = True
        if args[0] in ('e1', 'ë1'): ps.append(' '.join([name] + roles))
    for p in fr.findall('SEMANTICS/PRED'):
        roles = [a.get('value').lstrip('?') for a in p.findall('ARGS/ARG')][1:]
        if p.get('value') == 'contact' and p.get('bool') != '!' and len(roles) >= 2 and subj in roles[:2] and not moves:
            other = roles[1] if roles[0] == subj else roles[0]
            ps.append(f'contact {subj} {other}')
    return sorted(set(ps))
classes = {}
def walk(c, top, inherited):
    frames = inherited + c.findall('FRAMES/FRAME')
    got = classes.setdefault(top, {})
    def pick(key, n, exact):
        if key in got: return
        for fr in frames:
            s = shape(fr)
            if not s or len(s[1]) != n or (exact and not s[2]): continue
            ps = preds(fr, s[0])
            if ps: got[key] = {'np': [s[0]] + s[1], 'pre': ps}
            return
    pick('none', 0, True); pick('none', 0, False)
    pick('one', 1, True); pick('one', 1, False)
    pick('two', 2, False)
    for s in c.findall('SUBCLASSES/VNSUBCLASS'): walk(s, top, frames)
for f in sorted(os.listdir(D)):
    if not f.endswith('.xml'): continue
    r = ET.parse(os.path.join(D, f)).getroot()
    walk(r, r.get('ID'), [])
pre = {k: v for k, v in sorted(classes.items()) if v}
open(out, 'w').write(f"""// Built outside the repo (docs/df-body-engine.md §7.3, 2026-10-28 (111)) from VerbNet 3.4's frames and event semantics
// (Kipper-Schuler 2005; Brown, Bonn, Kazeminejad, Zaenen, Pustejovsky & Palmer 2022, "Semantic Representations for NLP Using
// VerbNet and the Generative Lexicon"); do not edit by hand. PRE_STATE: for each class and each shape a line takes ("none": NP V,
// "one": NP V NP, "two": NP V NP NP), np: the roles of the subject and of each object in that frame's syntax; pre: what holds
// before the act (the first subevent, e1), as "predicate Role Role", "!" for a negation; "contact Subject Role": the subject
// touches that participant during the act, without moving to it.
export const PRE_STATE: Record<string, {{ none?: Frame; one?: Frame; two?: Frame }}> = {json.dumps(pre)};
export interface Frame {{ np: string[]; pre: string[] }}
""")
from collections import Counter
c = Counter(p.split()[0] for v in pre.values() for f in v.values() for p in f['pre'])
print(len(pre), 'classes;', c.most_common(12))
for k in ['give-13.1', 'fire-10.10', 'throw-17.1', 'hit-18.1', 'pelt-17.2', 'touch-20', 'pay-68', 'steal-10.5', 'hold-15.1', 'push-12', 'chase-51.6', 'swat-18.2']:
    print(k, pre.get(k))
