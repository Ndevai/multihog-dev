# Builds src/rules/data/activity-verbs.ts from Open English WordNet 2024 (wnv.pkl, CC BY 4.0) and VerbNet 3.4 (vn.json):
# (1) ACTIVITY_VERBS: the verbs of the activities the tools' descriptions name, each a WordNet verb synset chosen by its
#     definition (SEEDS below) with its troponyms (the synsets whose hypernym chain reaches it: Fellbaum 1990, "to X is to Y
#     in some manner"); a verb is listed when its FIRST WordNet sense lies there ("sneak" is to go stealthily; "pick" is to
#     select, so no lock-picking verb).
# (2) EMOTION_VERBS: the verbs VerbNet files under admire-31.2 or marvel-31.3 (Levin 1993 §31.2–31.3, the verbs whose
#     subject feels: "love", "fear", "worry about") whose first WordNet sense is filed in verb.emotion ("miss", "bear",
#     "support" are not: their first senses are other acts).
# Usage: python3 -I activity.py wnv.pkl vn.json out.ts
import pickle, sys, json
sense_syn, deriv, syn, members, lemma_of_sense = pickle.load(open(sys.argv[1], 'rb'))
vn = json.load(open(sys.argv[2]))
first = {}
for s, y in sense_syn.items():
    w = lemma_of_sense[s]
    if syn.get(y) and syn[y][3] == 'v' and w not in first: first[w] = y
kids = {}
for y, v in syn.items():
    if v[3] == 'v':
        for h in v[2]: kids.setdefault(h, []).append(y)
def closure(y):
    out, st = set(), [y]
    while st:
        x = st.pop()
        if x in out: continue
        out.add(x); st.extend(kids.get(x, []))
    return out
SEEDS = {
    # BodyCheck: "climbing, jumping, swimming, lifting or forcing something, balancing, sneaking, picking a lock, riding, a
    # craft or a trade task" (climbing and lifting are read already: verbs.ts climbing, router.ts VERB_TOOL).
    'BodyCheck': [
        'oewn-01967949-v',  # move forward by leaps and bounds (bound, jump, leap, spring)
        'oewn-01964770-v',  # travel through water (swim)
        'oewn-01596175-v',  # to move or force, especially in an effort to get something open (jimmy, lever, prise, pry)
        'oewn-01605239-v',  # hold or carry in equilibrium (balance, poise)
        'oewn-01915881-v',  # to go stealthily or furtively (creep, mouse, pussyfoot, sneak)
        'oewn-01921116-v',  # walk stealthily (slink)
        'oewn-01922514-v',  # move furtively (skulk)
        'oewn-02646137-v',  # lie in wait, behave in a sneaky and secretive manner (lurk, skulk)
        'oewn-01961388-v',  # sit and travel on the back of animal, usually while controlling its motions (ride)
        'oewn-00261534-v',  # restore by replacing a part or putting together what is torn or broken (mend, repair, fix)
        'oewn-01331921-v',  # fasten by sewing; do needlework (sew, stitch)
        'oewn-01679140-v',  # create by hammering (forge, hammer)
        'oewn-01258721-v',  # form by carving (carve)
        'oewn-00049487-v',  # furnish with shoes (shoe)
        'oewn-01674934-v',  # make (textiles) by knitting (knit)
        'oewn-01677786-v',  # create a piece of cloth by interlacing strands of fabric (weave)
    ],
    # WorkOut: "a riddle, a trick, a code, a link between clues, a sum, a plan".
    'WorkOut': [
        'oewn-00636568-v',  # find the solution to (a problem or question) or understand the meaning of (solve, figure out, work out)
        'oewn-00996499-v',  # convert code into ordinary language (decipher, decode, decrypt)
        'oewn-00638921-v',  # make a mathematical calculation or computation (calculate, compute, reckon)
        'oewn-01635953-v',  # come up with (an idea, plan, explanation) after a mental effort (contrive, devise, formulate)
        'oewn-00638236-v',  # reason by deduction; establish by deduction (deduce, infer)
    ],
    # Chase: "someone running away".
    'Chase': ['oewn-02079709-v'],  # run away quickly (flee, fly, take flight)
}
act = {}
for tool, seeds in SEEDS.items():
    c = set().union(*(closure(s) for s in seeds))
    for w, y in first.items():
        # A two-word verb (figure out, work out) is keyed verb_particle, as the router reads it.
        if y not in c or '-' in w or w.count(' ') > 1: continue
        k = w.replace(' ', '_')
        if tool not in act.setdefault(k, []): act[k].append(tool)
# (3) RUN_VERBS: moving fast on foot or fleeing, the motions a pursuer can follow: a verb whose first sense lies under "move very
#     fast" (oewn-02059573-v: hurry, speed, travel rapidly; run, dash, sprint below it), "move hurriedly" (oewn-02062918-v: race,
#     rush) or the two senses of fleeing (oewn-02079709-v, oewn-02079296-v).
fast = set().union(*(closure(s) for s in ['oewn-02059573-v', 'oewn-02062918-v', 'oewn-02079709-v', 'oewn-02079296-v']))
run = sorted(w for w, y in first.items() if y in fast and ' ' not in w and '-' not in w)
emo = sorted(w for w, y in first.items() if syn[y][4] == 'verb.emotion' and w in vn and any(k.startswith(('admire-31.2', 'marvel-31.3')) for k in vn[w]))
open(sys.argv[3], 'w').write(f"""// Built outside the repo (docs/df-body-engine.md §7.3, 2026-10-27 (109)) from Open English WordNet 2024 (McCrae et al.
// 2019; CC BY 4.0) and VerbNet 3.4 (Kipper-Schuler 2005); do not edit by hand.
// ACTIVITY_VERBS: the verbs of the activities a tool's description names (BodyCheck: jumping, swimming, forcing, balancing,
// sneaking, riding, a craft; WorkOut: solving, deciphering, calculating, devising, deducing; Chase: fleeing): each activity a
// WordNet verb synset chosen by its definition, with its troponyms; a verb is listed when its first WordNet sense lies there
// (a two-word verb as verb_particle: "figure_out").
// EMOTION_VERBS: the verbs of VerbNet's admire-31.2 and marvel-31.3 (Levin 1993 §31.2–31.3: the subject feels) whose first
// WordNet sense is filed in verb.emotion.
export const ACTIVITY_VERBS: Record<string, string[]> = {json.dumps(dict(sorted(act.items())))};
export const EMOTION_VERBS = '{' '.join(emo)}';
// RUN_VERBS: the verbs whose first WordNet sense is moving very fast or hurriedly, or fleeing.
export const RUN_VERBS = '{' '.join(run)}';
""")
print(len(act), 'activity verbs:', ' '.join(f'{w}:{"+".join(t)}' for w, t in sorted(act.items())))
print(len(emo), 'emotion verbs:', ' '.join(emo))
print(len(run), 'run verbs:', ' '.join(run))
