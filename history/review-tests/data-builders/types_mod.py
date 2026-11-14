# Noun kinds from WordNet's hypernym chains (Open English WordNet 2024), common (non-instance) senses only.
import pickle, sys, json
lemmas, syn = pickle.load(open('/tmp/claude-0/-home-claude/a6862b8f-31d2-583c-9908-39f5eb41a662/scratchpad/sense/wn.pkl', 'rb'))
A = {  # kind letter -> anchor synsets (any sense below one of them has the kind)
 'h': ['oewn-00007846-n'], 'a': ['oewn-00015568-n'], 'o': ['oewn-08024893-n', 'oewn-07967506-n', 'oewn-08181484-n'],
 'x': ['oewn-00001930-n'], 'l': ['oewn-00027365-n', 'oewn-04348764-n', 'oewn-09248053-n', 'oewn-04571984-n'], 'b': ['oewn-05227735-n'],
 'm': ['oewn-03705309-n', 'oewn-03187746-n'], 's': ['oewn-00002684-n', 'oewn-15071467-n'],
 'f': ['oewn-00021445-n', 'oewn-07571428-n', 'oewn-07586285-n', 'oewn-07581905-n', 'oewn-07897775-n'],
 'c': ['oewn-00033319-n', 'oewn-06262268-n'], '$': ['oewn-13407086-n', 'oewn-13405730-n', 'oewn-13406050-n'],
 'v': ['oewn-04531608-n'], 'u': ['oewn-00019793-n'], 'w': ['oewn-04572661-n'], 'g': ['oewn-03348699-n', 'oewn-03472916-n', 'oewn-02749370-n'],
 'p': ['oewn-04015010-n'], 'n': ['oewn-03099154-n'], 'r': ['oewn-03423924-n', 'oewn-03055525-n', 'oewn-03385972-n', 'oewn-03385713-n'], 't': ['oewn-00017402-n'],
 'q': ['oewn-14964524-n', 'oewn-14964238-n', 'oewn-14964038-n', 'oewn-07897775-n'],
}
anchor = {s: k for k, ss in A.items() for s in ss}
memo = {}
# WordNet's lexicographer files are its own top classes: a sense filed under noun.person is a person, under noun.food a
# food, and the physical files (person, animal, artifact, body, food, object, plant, substance) name physical things.
LEX = {'noun.person': 'hx', 'noun.animal': 'ax', 'noun.body': 'bx', 'noun.food': 'fx', 'noun.plant': 'tx', 'noun.location': 'l',
       'noun.group': 'o', 'noun.communication': 'c', 'noun.act': 'e', 'noun.event': 'e', 'noun.time': 'i', 'noun.quantity': 'y', 'noun.artifact': 'sx', 'noun.substance': 'ux', 'noun.object': 'sx', 'noun.possession': ''}
def kinds(s, depth=0):
    if s in memo: return memo[s]
    out = set(LEX.get(syn[s][0], ''))
    if s in anchor: out.add(anchor[s])
    if depth < 40:
        for h in syn[s][1]:
            if h in syn: out |= kinds(h, depth + 1)
    memo[s] = out; return out
def noun_kinds(w):
    ss = [s for s in lemmas.get(w, []) if s in syn and not syn[s][4]]
    if not ss: return None
    first = kinds(ss[0]); allk = set().union(*(kinds(s) for s in ss))
    # 'k' (abstract): a sense with no physical kind
    if any(not (kinds(s) & {'x'}) for s in ss): allk.add('k')
    if not (first & {'x'}): first = first | {'k'}
    return ''.join(sorted(first)), ''.join(sorted(allk))
if False:
    for w in sys.argv[2:]: print(w, noun_kinds(w))
