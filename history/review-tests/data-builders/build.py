# Builds src/rules/data/senses.ts: (1) the kinds of thing each lexicon noun names, from Open English WordNet 2024 (its
# lexicographer files and hypernym chains; common senses only, named people and places left out); (2) for each verb in two
# or more VerbNet 3.4 classes, what each class's direct object must be (its selectional restrictions as kinds), whether a
# frame takes no direct object, and whether one takes two objects (NP V NP NP).
import json, sys
sys.path.insert(0, '/tmp/claude-0/-home-claude/a6862b8f-31d2-583c-9908-39f5eb41a662/scratchpad/sense')
from types_mod import noun_kinds
nouns_src, vn_json, out = sys.argv[1], sys.argv[2], sys.argv[3]
words = [e.split(':')[0] for e in open(nouns_src).read().split(' ') if e]
groups = {}
for w in words:
    k = noun_kinds(w)
    if not k: continue
    first, allk = k
    sig = allk if first == allk else f'{allk}/{first}'
    groups.setdefault(sig, []).append(w)
# VerbNet restriction -> DNF over kind letters
T = {'animate': ['h', 'a'], 'human': ['h'], 'animal': ['a'], 'organization': ['o'], 'concrete': ['x'], 'location': ['l'], 'loc': ['l'],
     'body_part': ['b'], 'machine': ['m'], 'solid': ['s'], 'comestible': ['f'], 'communication': ['c'], 'abstract': ['k'],
     'currency': ['$'], 'vehicle': ['v'], 'substance': ['u'], 'eventive': ['e']}
def dnf(r):
    """[[literal,...], ...] or None (unrestricted); a literal is 'h' or '!h'."""
    if not r: return None
    logic, items = r[0], r[1]
    parts = []
    for it in items:
        if isinstance(it, list) and len(it) == 2 and isinstance(it[0], str) and it[0] in '+-':
            sign, t = it
            if t not in T: continue
            if sign == '+': parts.append([[x] for x in T[t]])
            else: parts.append([['!' + x for x in T[t]]])  # not any of them: one conjunction of negations
        else:
            d = dnf(it)
            if d: parts.append(d)
    if not parts: return None
    if logic == 'or':
        return [c for p in parts for c in p]
    res = [[]]
    for p in parts: res = [a + b for a in res for b in p]
    return res
def enc(d): return '*' if d is None else '|'.join(''.join(c) for c in d)
vn = json.load(open(vn_json))
verbs = {}
for v, classes in vn.items():
    if len(classes) < 2 or '_' in v and len(v) > 30: continue
    row = {}
    for c, e in classes.items():
        # VerbNet's roles of amount (Value: "a place along a scale", Extent, Duration; Asset: the currency of a transaction:
        # VerbNet 3.x role definitions, Bonial et al. 2011) are amounts when the class states no restriction: a quantity, money
        # or a time ("it costs a shilling", "it takes two hours"), no solid thing ("carry the chest" is no cost).
        AMOUNT = [['y'], ['$'], ['i']]
        # A requirement of a two-object frame's first object (NP V NP NP: "cost me a shilling") is marked "^": it applies only to
        # a line with two objects ("carry the boy to the cart" is no cost to the boy).
        reqs = sorted({('^' if dat else '') + enc(dnf(r2) if r2 else dnf(r1) if r1 else AMOUNT if role in ('Value', 'Extent', 'Duration', 'Asset') else None) for (role, r1, r2, dat) in e['obj']})
        row[c] = ','.join(reqs) + (';b' if e['bare'] else '') + (';d' if e.get('dative') else '') + (';' if not e['obj'] and not e['bare'] else '')
    verbs[v] = row
kinds_js = json.dumps({k: ' '.join(sorted(v)) for k, v in sorted(groups.items())}, ensure_ascii=False)
open(out, 'w').write(f"""// Built outside the repo (see docs/df-body-engine.md §7.3, 2026-10-27 (107)) from two published resources; do not edit by hand.
// NOUN_KINDS: the kinds of thing each common noun of the lexicon names, from Open English WordNet 2024 (McCrae et al. 2019;
// CC BY 4.0): its lexicographer files and hypernym chains, over its common senses (named people and places left out). Keys
// list the kinds of all senses, then "/" and the first sense's when they differ. Kinds: h person, a animal, o group or
// organization, x physical thing, l place, structure or way (a road, street or path), b body part, m machine or device, s solid object, f food or drink,
// c communication, k abstract, $ money, v vehicle, u substance, w weapon, g gun, p projectile, n container, r garment or footwear,
// t plant, q liquid, e act or event, i time, y quantity or measure.
// VERB_SENSES: for each verb in two or more VerbNet 3.4 classes (Kipper-Schuler 2005; github.com/cu-clear/verbnet), each
// class's direct object as kinds it must have (any of "|"-separated groups; "!" = must not; "*" = any), ";b" when a frame
// takes no direct object, ";d" when one takes two objects (NP V NP NP), ";" alone when every frame takes a clause. An object
// in a role of amount (Value, Extent, Duration, Asset) that VerbNet leaves unrestricted must be a quantity, money or a time;
// "^" marks what the first of two objects must be (docs/df-body-engine.md §7.3, 2026-10-27 (109)).
export const NOUN_KINDS: Record<string, string> = {kinds_js};
export const VERB_SENSES: Record<string, Record<string, string>> = {json.dumps(verbs, ensure_ascii=False)};
""")
print(len(words), 'nouns read;', sum(len(v) for v in groups.values()), 'with kinds;', len(groups), 'kind signatures;', len(verbs), 'verbs with 2+ classes')
for v in ['fire', 'throw', 'charge', 'pick', 'raise', 'cut', 'draw']: print(v, verbs.get(v))
