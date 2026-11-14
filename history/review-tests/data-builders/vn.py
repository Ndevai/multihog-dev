# VerbNet 3.4: per class (and subclass, inheriting): the role of the direct object in each frame and that role's
# selectional restrictions; whether some frame has no direct object. Output JSON: verb -> {class: {"obj": [restr...], "bare": bool}}.
import os, sys, json, xml.etree.ElementTree as ET
d = sys.argv[1]
def restr(el):
    """A SELRESTRS element as ('and'|'or', [items]) where an item is (sign, type) or a nested tuple."""
    if el is None: return None
    items = []
    for c in el:
        if c.tag == 'SELRESTR': items.append((c.get('Value'), c.get('type')))
        elif c.tag == 'SELRESTRS':
            r = restr(c)
            if r and r[1]: items.append(r)
    return (el.get('logic') or 'and', items)
def roles_of(cls, parent):
    roles = dict(parent)
    tr = cls.find('THEMROLES')
    if tr is not None:
        for r in tr.findall('THEMROLE'):
            s = restr(r.find('SELRESTRS'))
            roles[r.get('type')] = s if s and s[1] else roles.get(r.get('type'))
    return roles
def frames_of(cls, roles):
    out = []
    fr = cls.find('FRAMES')
    for f in (fr.findall('FRAME') if fr is not None else []):
        syn = f.find('SYNTAX'); els = list(syn) if syn is not None else []
        seen_verb, obj, prep_before = False, None, False
        for e in els:
            if e.tag == 'VERB': seen_verb = True; continue
            if not seen_verb: continue
            if e.tag in ('PREP', 'LEX'): prep_before = True; continue
            if e.tag == 'NP':
                if prep_before: break
                synr = e.find('SYNRESTRS')
                sentential = synr is not None and any(x.get('Value') == '+' and x.get('type') in ('sentential', 'that_comp', 'np_ing', 'ac_ing', 'to_be', 'wh_comp', 'poss_ing', 'for_comp', 'what_extract', 'quotation', 'np_to_inf', 'oc_to_inf', 'rs_to_inf', 'sc_to_inf', 'oc_ing', 'be_sc_ing', 'how_extract', 'wh_inf', 'what_inf', 'oc_bare_inf', 'np_omit_ing', 'ac_to_inf', 'genitive', 'np_ppart', 'np_p_ing', 'small_clause') for x in synr.iter('SYNRESTR'))
                if sentential: obj = 'CLAUSE'; break
                fr_sel = restr(e.find('SELRESTRS'))
                obj = (e.get('value'), roles.get(e.get('value')), fr_sel if fr_sel and fr_sel[1] else None)
                rest = els[els.index(e) + 1:]
                dative = bool(rest) and rest[0].tag == 'NP'
                obj = obj + (dative,)
                break
            if e.tag in ('ADV', 'ADJ'): continue
        out.append(obj)
    return out
res = {}
def walk(cls, top, parent_roles, parent_frames):
    roles = roles_of(cls, parent_roles)
    frames = parent_frames + frames_of(cls, roles)
    for m in cls.findall('MEMBERS/MEMBER'):
        v = m.get('name').lower()
        objs = [f for f in frames if f and f != 'CLAUSE']
        res.setdefault(v, {}).setdefault(top, {'obj': [], 'bare': False, 'clause': False, 'dative': False})
        e = res[v][top]
        for f in frames:
            if f is None: e['bare'] = True
            elif f == 'CLAUSE': e['clause'] = True
        for (role, r1, r2, dat) in objs:
            if dat: e['dative'] = True
            # The object of a two-object frame (NP V NP NP) is its first object, the Recipient or Beneficiary: kept apart.
            item = [role, r1, r2, bool(dat)]
            if item not in e['obj']: e['obj'].append(item)
    for sub in cls.findall('SUBCLASSES/VNSUBCLASS'): walk(sub, top, roles, frames)
for f in sorted(os.listdir(d)):
    if not f.endswith('.xml'): continue
    root = ET.parse(os.path.join(d, f)).getroot()
    walk(root, f[:-4], {}, [])
json.dump(res, open(sys.argv[2], 'w'))
print(len(res), 'verbs')
for v in [] and ['fire', 'throw', 'pick', 'charge', 'draw', 'hold', 'raise']:
    for c, e in res[v].items(): print(v, c, 'bare' if e['bare'] else '', [(o[0], o[1], o[2]) for o in e['obj']][:3])
