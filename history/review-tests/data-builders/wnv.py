# Open English WordNet 2024 verbs: sense id -> synset; synset -> definition, examples, lemmas, hypernyms; sense -> derived senses.
import gzip, sys, pickle, xml.etree.ElementTree as ET
sense_syn, deriv, syn = {}, {}, {}
lemma_of_sense = {}
for ev, el in ET.iterparse(gzip.open(sys.argv[1]), events=('end',)):
    if el.tag == 'LexicalEntry':
        lem = el.find('Lemma'); w = lem.get('writtenForm').lower() if lem is not None else ''
        for s in el.findall('Sense'):
            sense_syn[s.get('id')] = s.get('synset'); lemma_of_sense[s.get('id')] = w
            deriv[s.get('id')] = [r.get('target') for r in s.findall('SenseRelation') if r.get('relType') == 'derivation']
        el.clear()
    elif el.tag == 'Synset':
        d = el.find('Definition')
        syn[el.get('id')] = ((d.text or '') if d is not None else '', [e.text or '' for e in el.findall('Example')], [r.get('target') for r in el.findall('SynsetRelation') if r.get('relType') == 'hypernym'], el.get('partOfSpeech'), el.get('lexfile'))
        el.clear()
members = {}
for s, y in sense_syn.items(): members.setdefault(y, []).append(lemma_of_sense[s])
pickle.dump((sense_syn, deriv, syn, members, lemma_of_sense), open(sys.argv[2], 'wb'))
print(len(sense_syn), 'senses', len(syn), 'synsets')
