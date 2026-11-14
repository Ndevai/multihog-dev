# Builds src/rules/data/cue-nouns.ts: for each tool, the common nouns (src/rules/data/wordnet.ts NOUNS) that name what its
# description says it decides, by Open English WordNet 2024 (CC BY 4.0): a noun is listed when its first common
# (non-instance) senses lies under one of the tool's anchor synsets (the anchor or any hyponym), or, for Appraise, when its
# first common sense is filed in noun.feeling. Usage: python3 -I cues.py wn.pkl nouns.txt out.json
import pickle, sys, json
lemmas, syn = pickle.load(open(sys.argv[1], 'rb'))
nouns = set(t.split(':')[0] for t in open(sys.argv[2]).read().split())
kids = {}
for y, v in syn.items():
    for h in v[1]: kids.setdefault(h, []).append(y)
def closure(ys):
    # An anchor written "=id" stands for that synset alone, without its hyponyms.
    out, st = {y[1:] for y in ys if y.startswith('=')}, [y for y in ys if not y.startswith('=')]
    while st:
        x = st.pop()
        if x in out: continue
        out.add(x); st.extend(kids.get(x, []))
    return out
ANCHORS = {
    # Listen: "a sound (footsteps, a voice, hoofbeats, a bell)": audible events, noise, the auditory effect, a bell.
    'Listen': ['oewn-07385893-n', 'oewn-07402109-n', 'oewn-04988388-n', 'oewn-02827590-n', 'oewn-00124603-n'],
    # WorkOut: "a riddle, a trick, a code, a link between clues, a sum, a plan": enigmas, puzzles, ciphers, codes, clues, a
    # question raised for solution.
    'WorkOut': ['oewn-06798080-n', 'oewn-06797496-n', 'oewn-06366714-n', 'oewn-06264369-n', '=oewn-06365341-n', '=oewn-06656526-n', '=oewn-06796860-n'],
    # NameCharacter: "a first name": a name, a person's first name, surname, middle name, nickname, pet name, alias or
    # pseudonym (titles, brands and place names are names of no person).
    'NameCharacter': ['=oewn-06344646-n', 'oewn-06348677-n', 'oewn-06348274-n', '=oewn-06348572-n', '=oewn-06349373-n', '=oewn-06350614-n', '=oewn-06349528-n', 'oewn-06349648-n'],
    # Disease: "a contagious disease ... an outbreak ... an epidemic": communicable and infectious diseases, contagion, epidemics.
    'Disease': ['oewn-14145535-n', 'oewn-14150693-n', 'oewn-14145717-n', 'oewn-07450133-n', '=oewn-14323139-n'],
    # Listeners: "a person who keeps watch over something or someone" (guard, sentry, watchman, lookout) and its hyponyms.
    'listener': ['oewn-10169591-n', 'oewn-10290913-n', '=oewn-84010509-n'],
    # BodyEnvironment: "the air, water and clothing ... a different climate, water, the weather": burning, smoke, cold and
    # heat, storms and other weather, arid land, altitude.
    'BodyEnvironment': ['oewn-07317454-n', 'oewn-11528510-n', 'oewn-05022301-n', 'oewn-05023355-n', 'oewn-11482925-n', 'oewn-11528800-n', 'oewn-11521799-n', 'oewn-11529988-n', 'oewn-11460617-n', 'oewn-08522594-n', 'oewn-05138912-n'],
    # Sickness: "a sea crossing", "waking after surgery": watercraft, voyages by water, surgical operations.
    'Sickness': ['oewn-04537861-n', 'oewn-00313610-n', 'oewn-00314071-n', 'oewn-00672594-n'],
    # BodyContact: "a stove, a pot handle, spilled hot water or oil": stoves, ovens, cookware.
    'BodyContact': ['oewn-04337478-n', 'oewn-04337405-n', 'oewn-03868196-n', 'oewn-03106637-n', 'oewn-03886228-n', 'oewn-03996832-n', 'oewn-03618023-n'],
}
# A noun's common senses: no instance (a named person or place) and no taxonomic genus ("pan" the chimpanzee genus comes
# before the pan for cooking).
genus = lambda s: any('genus' in ' '.join(syn[h][3]) for h in syn[s][1] if h in syn)
common = lambda w: [s for s in lemmas.get(w, []) if s in syn and not syn[s][4] and not genus(s)]
out = {}
for tool, an in ANCHORS.items():
    c = closure(an)
    ws = sorted(w for w in nouns if ' ' not in w and any(s in c for s in common(w)[:1]))
    out[tool] = ws
feel = []
for w in nouns:
    ss = [s for s in lemmas.get(w, []) if s in syn and not syn[s][4]]
    ss = common(w)
    if ss and syn[ss[0]][0] == 'noun.feeling' and ' ' not in w: feel.append(w)
out['Appraise'] = sorted(feel)
import gzip, xml.etree.ElementTree as ET
# Temperature adjectives: the satellites WordNet links by "similar" to cold (oewn-01254201-a, "having a low or inadequate
# temperature") and to hot (oewn-01250274-a, "used of physical heat").
# A word is kept when one of its first two adjective senses is one of them ("white" is first the colour, then pale skin).
alem, asim, afirst = {}, {}, {}
for ev, el in ET.iterparse(gzip.open(sys.argv[4]), events=('end',)):
    if el.tag == 'LexicalEntry':
        lem = el.find('Lemma')
        if lem is not None and lem.get('partOfSpeech') in ('a', 's'):
            w = lem.get('writtenForm').lower()
            for x in el.findall('Sense'): alem.setdefault(x.get('synset'), []).append(w)
            ss = el.findall('Sense')
            if ss and w not in afirst: afirst[w] = [x.get('synset') for x in ss[:2]]
        el.clear()
    elif el.tag == 'Synset':
        if el.get('partOfSpeech') in ('a', 's'): asim[el.get('id')] = [r.get('target') for r in el.findall('SynsetRelation') if r.get('relType') == 'similar']
        el.clear()
for name, head in (('cold', 'oewn-01254201-a'), ('hot', 'oewn-01250274-a')):
    group = {head, *asim[head]}
    ws = {w for t in group for w in alem.get(t, [])}
    out[name] = sorted(w for w in ws if ' ' not in w and any(x in group for x in afirst.get(w, [])))
open(sys.argv[3], 'w').write(f"""// Built outside the repo (docs/df-body-engine.md §7.3, 2026-10-27 (109)) from Open English WordNet 2024 (McCrae et al. 2019;
// CC BY 4.0); do not edit by hand. For each tool, the common nouns of the lexicon (data/wordnet.ts) whose first common sense
// (no named instance, no taxonomic genus) lies under the synsets that name what the tool's description says it decides:
// Listen sounds (audible events, noise, a bell, gunfire); WorkOut riddles, puzzles and ciphers; NameCharacter a person's name;
// Disease communicable and infectious diseases, contagion, epidemics, a symptom; BodyEnvironment burning, smoke, cold, heat,
// storms, snow, rain, arid land, altitude; Sickness watercraft, voyages by water and surgical operations; BodyContact stoves,
// ovens and cookware; Appraise the nouns filed in noun.feeling. "listener": people who keep watch. "cold" and "hot": the
// adjectives WordNet links by "similar" to cold ("having a low or inadequate temperature") and hot ("used of physical heat")
// whose first or second sense is one of them.
export const CUE_WORDS: Record<string, string> = {json.dumps({k: ' '.join(v) for k, v in out.items()}, ensure_ascii=False)};
""")
for t, ws in out.items(): print(t, len(ws), ' '.join(ws)[:900])
