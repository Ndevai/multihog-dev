// Tool calls written by code from the player's message (docs/progress.md entry 40): where the words give every argument a
// tool requires, code writes the call and the planner model is asked only for the tools left open. The verb, the person
// spoken to, the words said, the distance walked, the time waited and the thing handed over are read here; what only the
// scene gives (how far, how loud the room, how hard a climb) stays with the planner.
import { distanceIn, stepsFromWords } from './actions.js';
import { movesIn } from './router.js';
import { VERBNET } from './data/verbnet.js';
import { referencePrice } from './prices.js';
const PRONOUN = /^(?:him|her|them|it)$/i;
// A person named after a verb or preposition: "the innkeeper", "Will", "the old man".
const PERSON = String.raw `((?:the |an? )?(?:[a-z]+ ){0,2}?[a-z]+|[A-Z][a-z]+)`;
const ROLE = /^(?:the |an? )?(?:old |young |little |tall |fat |thin )?[a-z]+$/i;
/** The last person the message names before position i (for "him" / "her"): a phrase after a word that takes a person
 *  (to, at, with, tell, ask, give…), or a capitalized name inside a sentence. */
const STOP = /\s+(?:and|for|what|that|to|then|with|about|is|are|was|were|if|who|on|in|at|by|near)\b.*$/;
function lastNamed(text, before) {
    const head = text.slice(0, before), found = [];
    for (const m of head.matchAll(/\b(?:to|at|with|from|ask|asks|asked|tell|tells|told|greet|greets|greeted|give|gives|gave)\s+((?:the\s+)?[a-z]+(?:\s+[a-z]+)?)/g)) {
        const p = m[1].replace(STOP, '');
        if (!/\b(?:street|market|house|home|table|fire|door|window|wall|garden|lawn|hedge|room|way|corner|side|be|go|see|get|stop|me|you|him|her|them)$/.test(p))
            found.push({ at: m.index, p: p.startsWith('the ') ? p : `the ${p}` });
    }
    for (const m of head.matchAll(/(?<![.!?]\s|^)\b([A-Z][a-z]+)\b/g))
        if (!/^(?:I|The|A|An|My)$/.test(m[1]))
            found.push({ at: m.index, p: m[1] });
    return found.sort((x, y) => x.at - y.at).pop()?.p ?? null;
}
const clean = (p) => p.replace(/^(?:an? )/i, 'the ').trim();
/** Communicate: speaker the player, listener the person spoken to, the words said, how loud the verb says. */
function speech(text, player) {
    const quoted = text.match(/["“]([^"”]{2,})["”]/)?.[1];
    const verb = text.match(/\b(whisper|murmur|mutter|say|said|tell|told|ask|asked|call|called|shout|shouted|yell|yelled|scream|screamed|bellow|bellowed|cry|cried|greet|greeted|reply|replied|answer|answered|talk|talked|speak|spoke|chat|chatted)s?\b/i);
    if (!verb && !quoted)
        return null;
    const at = verb?.index ?? 0, rest = text.slice(at + (verb?.[0].length ?? 0));
    let listener = rest.match(new RegExp(String.raw `^\s+(?:out\s+)?(?:to|at|with)\s+${PERSON}`, 'i'))?.[1]
        ?? (/^(?:tell|told|ask|asked|greet|greeted|answer|answered)/i.test(verb?.[1] ?? '') ? rest.match(new RegExp(String.raw `^\s+${PERSON}`))?.[1] : undefined)
        ?? text.match(new RegExp(String.raw `\b(?:to|at)\s+${PERSON}\s*[.!?]?\s*$`))?.[1];
    if (listener && PRONOUN.test(listener.split(' ').pop()))
        listener = lastNamed(text, at) ?? undefined;
    if (!listener || !(ROLE.test(listener) || /^[A-Z][a-z]+$/.test(listener)))
        return null;
    listener = listener.split(/ (?:for|about|what|that|to|and)\b/)[0];
    const v = (verb?.[1] ?? '').toLowerCase();
    const effort = /^(whisper|murmur|mutter)/.test(v) ? 'whisper' : /^(shout|yell|scream|bellow)/.test(v) ? 'shout' : /^(call|cr)/.test(v) ? 'loud' : 'normal';
    const message = quoted ?? rest.replace(new RegExp(String.raw `^\s+(?:out\s+)?(?:to|at|with)?\s*(?:${listener.replace(/^the /, '(?:the )?')}|him|her|them)\b`, 'i'), '').replace(/^[\s,]+|[.!?]+$/g, '').trim();
    // The words end where the next action begins ("ask the costermonger for apples and pay him").
    const said = message.replace(/,?\s+(?:and|then)\s+(?:then\s+)?([a-z]+)\b.*$/, (all, w) => VERBNET[w] || VERBNET[w.replace(/e?s$/, '')] ? '' : all);
    return { tool: 'Communicate', args: { speaker: player, listener: /^[A-Z]/.test(listener) ? listener : clean(listener), means: 'speech', effort, ...said ? { message: said } : {} } };
}
/** Act: the player's motion in their own words, with the distance the words give. A walk the words give no distance for
 *  is left to the planner, which reads it from the scene. */
function motion(text, player) {
    if (!movesIn(text))
        return null;
    const action = text.replace(/["“][^"”]*["”]/g, '').replace(/^\s*I\s+/, '').trim(), d = distanceIn(text);
    return 'steps' in stepsFromWords(action, player, d ?? undefined) ? { tool: 'Act', args: { who: player, action, ...d ? { distance_m: d } : {} } } : null;
}
/** PassTime: a wait the words time ("wait an hour", "sleep for eight hours", "rest twenty minutes"). */
const UNITS = { minute: 1, minutes: 1, hour: 60, hours: 60, day: 1440, days: 1440 };
const COUNT = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, 'half an': 0.5, 'a quarter of an': 0.25 };
function waiting(text, player) {
    const m = text.match(/\b(wait|waits|waited|sleep|sleeps|slept|rest|rests|rested|stay|stays|stayed|linger|lingers|lingered)\b(?:\s+(?!for\b)[a-z']+){0,5}?\s+(?:for\s+)?(\d+(?:\.\d+)?|half an|a quarter of an|an?|one|two|three|four|five|six|seven|eight|nine|ten|twelve|fifteen|twenty|thirty|forty)\s+(minutes?|hours?|days?)\b/i);
    if (!m)
        return null;
    const n = /\d/.test(m[2]) ? Number(m[2]) : COUNT[m[2].toLowerCase()];
    const minutes = Math.round(n * UNITS[m[3].toLowerCase()]);
    const sleeping = /^sle|^slept/i.test(m[1]);
    return minutes > 0 ? { tool: 'PassTime', args: { minutes, [sleeping ? 'sleeping' : 'resting']: [player] } } : null;
}
/** Transfer: "give Will one of the apples", "hand her the letter". */
const NUMBER = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, some: 1, the: 1 };
function handing(text, player) {
    const m = text.match(/\b(?:give|gives|gave|hand|hands|handed|pass|passes|passed)\s+([A-Z][a-z]+|him|her|them|the [a-z]+)\s+(a|an|one|two|three|four|five|six|some|the)\s+(?:of\s+(?:the|my)\s+)?([a-z]+(?: [a-z]+)?)\b/);
    if (!m)
        return null;
    let to = m[1];
    if (PRONOUN.test(to)) {
        const p = lastNamed(text, m.index ?? 0);
        if (!p)
            return null;
        to = p;
    }
    return { tool: 'Transfer', args: { item: m[3].replace(/ (?:and|to|then)$/, ''), quantity: NUMBER[m[2]] ?? 1, from: player, to, how: 'given' } };
}
/** Price: a measure of a listed good the player asks for or buys ("a pint of ale" → beer, 0.568 l; "a pound of apples" →
 *  apples, 0.454 kg). Measures: imperial pint 0.568 l, quart 1.137 l, gallon 4.546 l, pound 0.4536 kg, ounce 0.0283 kg;
 *  the quartern loaf 4 lb 5½ oz, 1.97 kg (the London assize loaf) [ASSUMED for "a loaf"]; a dozen eggs 12. City and year come
 *  from the scene. */
const GOOD_WORDS = [[/\b(?:ale|beer|porter|stout|cider)\b/, 'beer (litre)'], [/\bwine\b/, 'wine (litre)'], [/\b(?:bread|loaf|loaves)\b/, 'bread (kg)'],
    [/\bapples?\b/, 'apples (kg)'], [/\bcheese\b/, 'cheese (kg)'], [/\bbutter\b/, 'butter (kg)'], [/\b(?:meat|beef|mutton|pork|bacon)\b/, 'meat (kg)'],
    [/\beggs?\b/, 'egg (each)'], [/\b(?:beans|peas)\b/, 'beans or peas (litre)'], [/\bsoap\b/, 'soap (kg)'], [/\bcandles?\b/, 'candles (kg)'], [/\blamp oil\b/, 'lamp oil (litre)']];
const MEASURE = [[/\bpints?\b/, 0.568], [/\bquarts?\b/, 1.137], [/\bgallons?\b/, 4.546], [/\bpounds?\b|\blbs?\b/, 0.4536], [/\bounces?\b|\boz\b/, 0.0283], [/\bloaf|loaves\b/, 1.97], [/\bdozen\b/, 12]];
function pricing(text) {
    const t = text.toLowerCase();
    if (!/\b(?:buy|buys|bought|pay|pays|paid|purchase|order|orders|ordered|ask|asks|asked|call|calls|called)\b/.test(t))
        return null;
    const good = GOOD_WORDS.find(([re]) => re.test(t));
    // A measure of a good outside the list ("a pound of pears") is priced from the good it is most like (prices.ts
    // referencePrice); code writes it when the reference table holds the good, the planner (with like) otherwise.
    const other = !good && t.match(/\b(?:pints?|quarts?|gallons?|pounds?|lbs?|ounces?|dozen) of ([a-z]+)\b/)?.[1];
    if (other) {
        const ref = referencePrice(other);
        const unit = MEASURE.find(([re]) => re.test(t))?.[1] ?? 1;
        return ref ? { tool: 'Price', args: { question: 'price of goods', good: other, quantity: Math.round(unit * 1000) / 1000 } } : null;
    }
    if (!good)
        return null;
    const count = Number(t.match(/\b(\d+(?:\.\d+)?)\s+(?:pints?|quarts?|gallons?|pounds?|lbs?|ounces?|loaves|dozen|eggs?)\b/)?.[1] ?? { two: 2, three: 3, four: 4, half: 0.5 }[t.match(/\b(two|three|four|half)\s+(?:a\s+)?(?:pints?|quarts?|gallons?|pounds?|loaves|dozen)\b/)?.[1] ?? ''] ?? 1);
    const unit = MEASURE.find(([re]) => re.test(t))?.[1] ?? 1;
    return { tool: 'Price', args: { question: 'price of goods', item: good[1], quantity: Math.round(count * unit * 1000) / 1000 } };
}
/** BodyStrike: the player's blow at a person the words name ("I punch the sailor in the jaw"): attacker the player, who
 *  the one struck, attack the verb's, part the words'. How far and how they stand stay with the scene. */
const BLOW = [[/\bpunch(?:es|ed)?\b/, 'punch'], [/\bkick(?:s|ed)?\b/, 'kick'], [/\bslap(?:s|ped)?\b/, 'punch'], [/\bstab(?:s|bed)?\b/, 'stab'], [/\bbite(?:s)?\b|\bbit\b/, 'bite'], [/\bhit(?:s)?\b|\bstrike(?:s)?\b|\bstruck\b/, 'punch'], [/\bheadbutt(?:s|ed)?\b/, 'headbutt']];
function striking(text, player) {
    const t = text.toLowerCase(), blow = BLOW.find(([re]) => re.test(t));
    if (!blow)
        return null;
    const m = text.match(new RegExp(String.raw `\b(?:punch(?:es|ed)?|kick(?:s|ed)?|slap(?:s|ped)?|stab(?:s|bed)?|bite(?:s)?|bit|hit(?:s)?|strike(?:s)?|struck|headbutt(?:s|ed)?)\s+${PERSON}`, 'i'))?.[1];
    if (!m || PRONOUN.test(m))
        return null;
    const who = m.split(/ (?:in|on|with|across|and)\b/)[0];
    const part = t.match(/\b(?:in|on|across) the (jaw|face|head|nose|stomach|belly|chest|throat|eye|ribs|groin|arm|leg|back|neck)\b/)?.[1];
    const PART = { jaw: 'head', face: 'head', nose: 'head', eye: 'right eye', stomach: 'lower body', belly: 'lower body', ribs: 'upper body', chest: 'upper body', groin: 'lower body', arm: 'right upper arm', leg: 'right upper leg', back: 'upper body', neck: 'neck', throat: 'throat', head: 'head' };
    return { tool: 'BodyStrike', args: { attacker: player, who: /^[A-Z]/.test(who) ? who : clean(who), attack: blow[1], ...part ? { part: PART[part] } : {} } };
}
/** Tools whose outcome turns on numbers only the scene gives (how far, how loud the room, how large the thing seen): code
 *  writes the words' part and the planner still answers for them; its call by the same person is completed from code's.
 *  The value is the argument naming that person. */
export const SCENE_TOOLS = new Map([['Communicate', 'speaker'], ['Listen', 'listener'], ['Look', 'viewer'], ['BodyStrike', 'attacker']]);
/** Listen and Look: the player's character listening or looking, at what the words name. */
function perceiving(text, player) {
    const out = [];
    if (/\b(?:listen|listens|listened|listening|overhear|overhears|overheard|eavesdrop|eavesdrops|eavesdropped|hear|hears|heard)\b/i.test(text) && !/\btell\b.*\bwhat I heard\b/i.test(text))
        out.push({ tool: 'Listen', args: { listener: player } });
    const look = text.match(/\b(?:look|looks|looked|peer|peers|peered|peek|peeks|peeked|watch|watches|watched|glance|glances|glanced|search|searches|searched)\b\s*(?:(?:through|at|into|in|around|over|for|toward|towards|out of)\s+)?((?:the |a |an |my |his |her )?[a-z]+(?: [a-z]+)?)?/i);
    if (look)
        out.push({ tool: 'Look', args: { viewer: player, ...look[1] ? { target: look[1].replace(/\s+(?:to|and|for|then)$/, '') } : {} } });
    return out;
}
/** The calls code can write from this message, and the routed tools they settle (the planner skips those). */
export function framedCalls(text, player) {
    const calls = [motion(text, player), speech(text, player), waiting(text, player), handing(text, player), pricing(text), striking(text, player), ...perceiving(text, player)].filter((c) => !!c);
    return { calls, covered: new Set(calls.map(c => c.tool).filter(t => !SCENE_TOOLS.has(t))) };
}
/** The planner's calls with code's words filled in: a planner call of a scene tool by the same person takes code's arguments
 *  it left out and replaces code's call; code's call stands when the planner gave none (and runs only once complete). */
/** Whether a planner call is by the same person as code's draft of that scene tool. */
export const sameSubject = (c, p) => c.tool === p.tool && SCENE_TOOLS.has(c.tool) && (p.args[SCENE_TOOLS.get(c.tool)] ?? c.args[SCENE_TOOLS.get(c.tool)]) === c.args[SCENE_TOOLS.get(c.tool)];
export function mergeCalls(code, planned) {
    const same = (c, p) => c.tool === p.tool && SCENE_TOOLS.has(c.tool) && (p.args[SCENE_TOOLS.get(c.tool)] ?? c.args[SCENE_TOOLS.get(c.tool)]) === c.args[SCENE_TOOLS.get(c.tool)];
    const out = planned.map(p => { const c = code.find(x => same(x, p)); return c ? { tool: p.tool, args: { ...c.args, ...p.args } } : p; });
    return [...code.filter(c => !planned.some(p => same(c, p))), ...out];
}
/** The player's character: SillyTavern's persona name, else the cast line marked "(the player's character)". */
export function playerName(name1, cast) {
    const fromCast = cast.match(/^\s*([A-Z][\w'-]*(?: [A-Z][\w'-]*)?)\s*\(the player's character\)/m)?.[1];
    return fromCast ?? (typeof name1 === 'string' && name1.trim() && name1 !== 'User' ? name1.trim() : null);
}
