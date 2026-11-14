// The people a scene holds or names, read by code before the plan is written (docs/progress.md entry 49): the story's own
// people, the cast, capitalized names in the recent text, and roles the text names ("the costermonger", "the man by the
// fire"). The plan schema lists exactly these as the keys and person values a call can take, so a plan names people and
// nothing else (a window, a tool's name and a sentence were each taken for a person when keys were free text).
import { GEONAMES } from './data/geonames.js';
import { TITLE } from './frame.js';
import { ROLE_WORDS } from './nouns.js';
import { OPENS } from './quotes.js';
const STOP = new Set(['I', 'The', 'A', 'An', 'He', 'She', 'They', 'We', 'It', 'His', 'Her', 'Their', 'My', 'Our', 'This', 'That', 'There', 'Then', 'When', 'But', 'And',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December', 'Scenario', 'Cast', 'Street', 'Road', 'Lane', 'Square']);
const ORDINAL = ['first', 'second', 'third', 'fourth'];
const COUNT = { two: 2, three: 3, four: 4 };
/** The people the texts hold or name, the known ones first; at most `max`. */
export function scenePeople(texts, known = [], max = 24) {
    const out = [...known];
    for (const text of texts) {
        // Roles: "the" and up to two words before a person noun or trade ("the old innkeeper").
        // "a dog", "an old maid" name the same role as "the dog": the plan refers to it with "the".
        for (const m of text.matchAll(/\b(?:[Tt]he|[Aa]n?) ([a-z]+)(?: ([a-z]+))?(?: ([a-z]+))?/g)) {
            const w = [m[1], m[2], m[3]].filter(Boolean), at = w.findIndex(x => ROLE_WORDS.has(x));
            if (at >= 0)
                out.push(`the ${w.slice(0, at + 1).join(' ')}`);
        }
        // A group of a few ("two men at the next table") gives each one a role: the first man, the second man.
        for (const m of text.matchAll(/\b(two|three|four) ((?:[a-z]+ )?)(men|women|boys|girls|soldiers|guards|sailors|drovers|travellers|strangers)\b/gi)) {
            const one = m[3].toLowerCase().replace(/men$/, 'man').replace(/s$/, '');
            for (let i = 0; i < COUNT[m[1].toLowerCase()]; i++)
                out.push(`the ${ORDINAL[i]} ${m[2].toLowerCase()}${one}`.replace(/\s+/g, ' '));
        }
        // Names: capitalized words inside a sentence, not after a word that leads a place ("in London", "on Wentworth Street").
        // At a sentence's start only a full name counts ("Josiah Crake laughed"); one capitalized word there is any word.
        // A title and the name it leads are one person ("Mr. Abbott", "Senhor Abreu"); its full stop ends no sentence.
        for (const m of text.matchAll(new RegExp(String.raw `\b(${TITLE}\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?)`, 'g')))
            out.push(m[1].replace(/\s+/g, ' ').replace(/'s$/, ''));
        const untitled = text.replace(new RegExp(String.raw `\b${TITLE}\s+[A-Z][a-z'-]+(?:\s+[A-Z][a-z'-]+)?`, 'g'), m => m.replace(/[A-Za-z.'-]/g, ' '));
        for (const m of untitled.matchAll(/(?<!\b(?:in|on|at|to|from|near|of|by|into|toward|towards)\s)\b([A-Z][a-z'-]+(?: [A-Z][a-z'-]+)?)\b/g)) {
            // A possessive names its owner ("Tom's table" → Tom).
            const n = m[1].trim().replace(/'s$/, ''), before = untitled.slice(0, m.index).trimEnd();
            const initial = !before || /[.!?:]$/.test(before) || new RegExp(`${OPENS.source}$`).test(before);
            // A place's name is no person ("Saint Petersburg, Nevsky Prospect": the city and its street climbed out of a sledge).
            const folded = n.toLowerCase();
            if (GEONAMES[folded] || /^(?:saint|st|san|santa|sao|new|port|fort|mount|lake|cape|rua|via|rue|calle|piazza|place|nevsky|prospect)\b/i.test(n) || /(?:street|road|lane|prospect|square|bridge|quay|wharf|market|hill|gate|abbey|church|cathedral|palace|castle|hall|house|inn|tavern)$/i.test(n))
                continue;
            if (n.split(' ').some(w => STOP.has(w)) || (initial && !n.includes(' ')))
                continue;
            out.push(n);
        }
    }
    return [...new Set(out.map(x => x.trim()).filter(Boolean))].slice(0, max);
}
