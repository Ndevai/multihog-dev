// The people a scene holds or names, read by code before the plan is written (docs/progress.md entry 49): the story's own
// people, the cast, capitalized names in the recent text, and roles the text names ("the costermonger", "the man by the
// fire"). The plan schema lists exactly these as the keys and person values a call can take, so a plan names people and
// nothing else (a window, a tool's name and a sentence were each taken for a person when keys were free text).
import { OCCUPATIONS } from './data/census-ew-1881.js';

const PERSON_NOUNS = ['man', 'woman', 'boy', 'girl', 'child', 'lad', 'lass', 'stranger', 'figure', 'person', 'owner', 'occupant', 'guard', 'soldier', 'servant',
    'maid', 'landlord', 'landlady', 'barman', 'barmaid', 'potboy', 'watchman', 'constable', 'policeman', 'sailor', 'priest', 'vicar', 'doctor', 'merchant',
    'master', 'mistress', 'gentleman', 'lady', 'drover', 'traveller', 'traveler', 'customer', 'clerk', 'porter', 'beggar', 'thief', 'driver', 'coachman'];
// Trade words from the census's occupation names ("Innkeeper, Hotel Keeper, Publican" → innkeeper, publican).
// A trade word names a person when it is an agent noun: English forms those with -er, -or, -ist, -man, -ian, -ant, -ess,
// -ster, -wright, -smith (Marchand 1969, The Categories and Types of Present-Day English Word-Formation). Singular forms only;
// a place or a thing in a trade's name ("Lodging House Keeper" → house) is no person.
const AGENT = /(?:er|or|ist|man|ian|ant|ess|ster|wright|smith)$/;
const TRADES = new Set(OCCUPATIONS.flatMap(o => o.name.toLowerCase().split(/[^a-z]+/)).filter(w => w.length > 4 && AGENT.test(w) && !/(?:ers|ors)$/.test(w) && !/^(other|manufacturer|maker|dealer|worker|labourer|member|officer|order|power|paper|water|silver|leather|rubber|copper|timber|letter|matter|winter|summer|chamber|number|master|upper|lower|outer|inner|under|after|whether|either|neither|corner|border|manor|interior|exterior)$/.test(w)));
// Animals a scene can hold, which act, hear and see as people do in the tools.
const ANIMALS = ['dog', 'hound', 'horse', 'mare', 'cat', 'mule', 'donkey', 'ox', 'bull', 'cow', 'goat', 'pig', 'wolf', 'bear', 'rat'];
const ROLE_WORDS = new Set([...PERSON_NOUNS, ...TRADES, ...ANIMALS, 'priest', 'clerk', 'surgeon', 'midwife', 'groom', 'cook', 'nurse', 'page', 'wife', 'husband', 'widow', 'maidservant']);
const STOP = new Set(['I', 'The', 'A', 'An', 'He', 'She', 'They', 'We', 'It', 'His', 'Her', 'Their', 'My', 'Our', 'This', 'That', 'There', 'Then', 'When', 'But', 'And',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December', 'Scenario', 'Cast', 'Street', 'Road', 'Lane', 'Square']);
const ORDINAL = ['first', 'second', 'third', 'fourth'];
const COUNT: Record<string, number> = { two: 2, three: 3, four: 4 };

/** The people the texts hold or name, the known ones first; at most `max`. */
export function scenePeople(texts: string[], known: string[] = [], max = 24): string[] {
    const out: string[] = [...known];
    for (const text of texts) {
        // Roles: "the" and up to two words before a person noun or trade ("the old innkeeper").
        // "a dog", "an old maid" name the same role as "the dog": the plan refers to it with "the".
        for (const m of text.matchAll(/\b(?:[Tt]he|[Aa]n?) ([a-z]+)(?: ([a-z]+))?(?: ([a-z]+))?/g)) {
            const w = [m[1], m[2], m[3]].filter(Boolean), at = w.findIndex(x => ROLE_WORDS.has(x));
            if (at >= 0) out.push(`the ${w.slice(0, at + 1).join(' ')}`);
        }
        // A group of a few ("two men at the next table") gives each one a role: the first man, the second man.
        for (const m of text.matchAll(/\b(two|three|four) ((?:[a-z]+ )?)(men|women|boys|girls|soldiers|guards|sailors|drovers|travellers|strangers)\b/gi)) {
            const one = m[3].toLowerCase().replace(/men$/, 'man').replace(/s$/, '');
            for (let i = 0; i < COUNT[m[1].toLowerCase()]; i++) out.push(`the ${ORDINAL[i]} ${m[2].toLowerCase()}${one}`.replace(/\s+/g, ' '));
        }
        // Names: capitalized words inside a sentence, not after a word that leads a place ("in London", "on Wentworth Street").
        // At a sentence's start only a full name counts ("Josiah Crake laughed"); one capitalized word there is any word.
        for (const m of text.matchAll(/(?<!\b(?:in|on|at|to|from|near|of|by|into|toward|towards)\s)\b([A-Z][a-z'-]+(?: [A-Z][a-z'-]+)?)\b/g)) {
            // A possessive names its owner ("Tom's table" → Tom).
            const n = m[1].trim().replace(/'s$/, ''), before = text.slice(0, m.index).trimEnd();
            const initial = !before || /[.!?:"“]$/.test(before);
            if (n.split(' ').some(w => STOP.has(w)) || (initial && !n.includes(' '))) continue;
            out.push(n);
        }
    }
    return [...new Set(out.map(x => x.trim()).filter(Boolean))].slice(0, max);
}
