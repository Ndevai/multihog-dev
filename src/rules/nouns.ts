// Words that name a person or an animal (scene-people.ts reads the people a scene names with them; verbs.ts asks whether a
// blow's object is a creature).
import { OCCUPATIONS } from './data/census-ew-1881.js';
import { noun } from './grammar.js';

export const PERSON_NOUNS = ['man', 'woman', 'boy', 'girl', 'child', 'lad', 'lass', 'stranger', 'figure', 'person', 'owner', 'occupant', 'guard', 'soldier', 'servant',
    'maid', 'landlord', 'landlady', 'barman', 'barmaid', 'potboy', 'watchman', 'constable', 'policeman', 'sailor', 'priest', 'vicar', 'doctor', 'merchant',
    'master', 'mistress', 'gentleman', 'lady', 'drover', 'traveller', 'traveler', 'customer', 'clerk', 'porter', 'beggar', 'thief', 'driver', 'coachman',
    // Folk of a story's world WordNet holds as no person by its first sense, and groups of people, spoken to or struck as
    // people are [ASSUMED list] (WordNet's groups also hold tables and classes, so a group noun is no person by itself).
    'gaoler', 'orc', 'creature', 'beast', 'crowd', 'mob', 'audience'];
// Trade words from the census's occupation names ("Innkeeper, Hotel Keeper, Publican" → innkeeper, publican).
// A trade word names a person when it is an agent noun: English forms those with -er, -or, -ist, -man, -ian, -ant, -ess,
// -ster, -wright, -smith (Marchand 1969, The Categories and Types of Present-Day English Word-Formation). Singular forms only;
// a place or a thing in a trade's name ("Lodging House Keeper" → house) is no person.
export const AGENT = /(?:er|or|ist|man|ian|ant|ess|ster|wright|smith)$/;
export const TRADES = new Set(OCCUPATIONS.flatMap(o => o.name.toLowerCase().split(/[^a-z]+/)).filter(w => w.length > 4 && AGENT.test(w) && !/(?:ers|ors)$/.test(w) && !/^(other|manufacturer|maker|dealer|worker|labourer|member|officer|order|power|paper|water|silver|leather|rubber|copper|timber|letter|matter|winter|summer|chamber|number|master|upper|lower|outer|inner|under|after|whether|either|neither|corner|border|manor|interior|exterior)$/.test(w)));
// Animals a scene can hold, which act, hear and see as people do in the tools.
export const ANIMALS = ['dog', 'hound', 'horse', 'mare', 'cat', 'mule', 'donkey', 'ox', 'bull', 'cow', 'goat', 'pig', 'wolf', 'bear', 'rat'];
const LISTED = new Set([...PERSON_NOUNS, ...TRADES, ...ANIMALS, 'priest', 'clerk', 'surgeon', 'midwife', 'groom', 'cook', 'nurse', 'page', 'wife', 'husband', 'widow', 'maidservant']);
/** A word that names a person, a group of people or an animal: the words above, or a noun whose most frequent sense in
 *  WordNet is a person (captain, king, mother, friend, villager, witch…; grammar.ts noun). */
export const ROLE_WORDS = { has: (w: string) => LISTED.has(w) || noun(w)?.kinds[0] === 'p' };
/** A noun whose most frequent sense WordNet files under a group of people (social group, people: crew, patrol, council,
 *  jury; not table, class or herd): one can speak to it (frame.ts speech), though a blow lands on a person, not on a crew. */
export const peopleGroup = (w: string) => noun(w)?.kinds[0] === 'h';
