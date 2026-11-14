# Parses Open English WordNet 2024: noun lemmas -> senses (synsets in order), synset -> lexfile, hypernyms, definition.
import gzip, sys, pickle, xml.etree.ElementTree as ET
src = sys.argv[1]; out = sys.argv[2]
lemmas, syn = {}, {}
for ev, el in ET.iterparse(gzip.open(src), events=('end',)):
    t = el.tag
    if t == 'LexicalEntry':
        lem = el.find('Lemma')
        if lem is not None and lem.get('partOfSpeech') == 'n':
            w = lem.get('writtenForm').lower()
            lemmas.setdefault(w, []).extend(s.get('synset') for s in el.findall('Sense'))
        el.clear()
    elif t == 'Synset':
        if el.get('partOfSpeech') == 'n':
            d = el.find('Definition')
            syn[el.get('id')] = (el.get('lexfile'), [r.get('target') for r in el.findall('SynsetRelation') if r.get('relType') in ('hypernym', 'instance_hypernym')], (d.text or '') if d is not None else '', [], any(r.get('relType') == 'instance_hypernym' for r in el.findall('SynsetRelation')))
        el.clear()
for w, ss in lemmas.items():
    for s in ss:
        if s in syn: syn[s][3].append(w)
pickle.dump((lemmas, syn), open(out, 'wb'))
print(len(lemmas), 'noun lemmas', len(syn), 'noun synsets')
