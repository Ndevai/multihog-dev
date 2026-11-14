// The English grammar the reader follows: Huddleston & Pullum 2002, The Cambridge Grammar of the English Language (CGEL).
// A word is read in the construction it stands in, by the rule the grammar states for that construction; where a rule asks a
// fact about a single word (is this noun an act derived from a verb, or a thing one can hold?), the fact comes from Open
// English WordNet 2024 (data/wordnet.ts) or from the grammar's own word classes, cited by page.
import { NOUNS, LIGHT_IDIOMS } from './data/wordnet.js';
import { QUOTED } from './quotes.js';
let NOUN_MAP = null;
/** A noun's senses, in WordNet's order (a: an act derived from a verb; c: a thing, substance or possession; n: an animal;
 *  q: a quantity; p: a person; g: a group; o: any other abstract sense), and for the first a-sense the verb it comes from; plurals read as their
 *  singular. Null for a word WordNet holds as no common noun. */
export function noun(word) {
    NOUN_MAP ??= new Map(NOUNS.split(' ').map(e => { const [w, kinds, verb, vfile] = e.split(':'); return [w, { kinds: kinds, ...verb ? { verb: verb.replace(/_/g, ' '), vfile: Number(vfile) } : {} }]; }));
    const w = word.toLowerCase();
    for (const f of [w, w.replace(/ies$/, 'y'), w.replace(/ves$/, 'f'), w.replace(/ves$/, 'fe'), w.replace(/(?:ch|sh|s|x|z)es$/, m => m.slice(0, -2)), w.replace(/s$/, ''), w.replace(/^(m|wom)en$/, '$1an')]) {
        const n = NOUN_MAP.get(f);
        if (n)
            return n;
    }
    return null;
}
/** Whether a word is a noun's plural form (WordNet holds its singular, not the word itself: "apples", "men"). */
export const pluralNoun = (word) => { noun(word); return !NOUN_MAP.has(word.toLowerCase()) && !!noun(word); };
/** Whether a noun can name a thing held and handed over (a c-sense). */
export const concrete = (word) => /[cnq]/.test(noun(word)?.kinds ?? '');
// ----------------------------------------------------------------------------------------------------------- light verbs
// CGEL ch. 4 §7 (pp. 290–296): in "She gave him a kiss", "He had a look at my draft", "We took a rest", give, have and take
// are light: "the main semantic content is located not in the light verb, but in the noun functioning as head of the direct
// object", a noun "related to a verb" (the associated verb), so "She gave him a kiss" says "She kissed him". The same verbs
// have their ordinary use ("She gave him an orange"), and "in some cases there is ambiguity between the two uses" ("I had a
// bath": bathed, or owned one). The light verbs are give, make, have, take and do, and, with fewer nouns, offer, pay, put and
// raise (p. 296).
export const LIGHT_VERBS = {};
for (const [lemma, forms] of Object.entries({ give: 'give gives gave giving given', make: 'make makes made making', have: 'have has had having', take: 'take takes took taking taken', do: 'do does did doing done', offer: 'offer offers offered offering', pay: 'pay pays paid paying', put: 'put puts putting', raise: 'raise raises raised raising' }))
    for (const f of forms.split(' '))
        LIGHT_VERBS[f] = lemma;
// The grammar's samples of each light verb's nouns, each with its associated verb (CGEL §7.2): give [9]–[13] (bodily acts
// that take no indirect object, physical acts whose patient is the indirect object, advice-type, description-type), make
// [14]–[17], have and take [18]–[20], do [21], and the other light verbs on p. 296.
const word = (list) => Object.fromEntries(list.split(' ').map(x => { const [n, v] = x.split('='); return [n, v ?? n]; }));
const CGEL_LIGHT = {
    give: word('sigh scream cough fart gasp grunt hiss laugh lurch moan scowl shrug shudder squeak kiss bath clout cuddle hit hug kick punch push shower squeeze wash wipe advice=advise answer consideration=consider encouragement=encourage help reply description=describe definition=define demonstration=demonstrate explanation=explain illustration=illustrate imitation=imitate impersonation=impersonate indication=indicate performance=perform portrayal=portray presentation=present'),
    make: word('leap inspection=inspect offer donation=donate appeal attempt boast call comment dash decision=decide discovery=discover escape fuss grab guess improvement=improve inquiry=inquire objection=object observation=observe reference=refer remark retreat start analysis=analyze attack calculation=calculate choice=choose contribution=contribute copy disclosure=disclose investment=invest note payment=pay reduction=reduce request search study survey confession=confess consignment=consign gift=give proposal=propose protest suggestion=suggest'),
    have: word('bath break drink guess lick look pity rest shave shower sip sleep swim walk wash chat cry dream fight grumble influence kiss laugh meeting=meet need quarrel talk think try read'),
    take: word('bath break drink guess lick look pity rest shave shower sip sleep swim walk wash decision=decide dive leap photograph step'),
    do: word('cleaning=clean dance dive drawing=draw knitting=knit report sewing=sew sketch sprint tango thinking=think translation=translate turn work writing=write somersault imitation=imitate'),
    offer: word('apology=apologize suggestion=suggest'), pay: word('attention=attend call visit'), put: word('blame end stop'), raise: word('objection=object'),
};
// Light-verb idioms WordNet lists as verbs ("give chase", "give way", "take a breath", "have a look"), each with a one-word
// verb of the same sense.
let IDIOMS = null;
const idioms = () => IDIOMS ??= new Map(LIGHT_IDIOMS.split('|').map(e => e.split('=')));
// A numeral in figures counts as one in words ("give Will 3 coins" as "give Will three coins": a cardinal numeral is a
// determinative in CGEL ch. 5).
const DET = /^(?:a|an|another|one|two|three|four|five|six|some|any|no|the|this|that|these|those|my|his|her|their|our|your|its|\d{1,4})$/;
const INDEFINITE = /^(?:a|an|another|one|two|three|four|five|six|some|any|no)$/;
// Where a noun phrase ends (CGEL ch. 5: pre-head dependents, the head, then post-head dependents): a preposition, a
// coordinator, a subordinator, an adverbial particle or punctuation starts what follows the head [ASSUMED list of them].
const BOUNDARY = /^(?:of|in|on|at|to|with|for|from|into|onto|across|over|under|by|behind|toward|towards|around|round|through|along|near|against|about|and|or|but|then|that|which|who|as|while|until|because|so|if|when|before|after|back|up|down|out|off|away|[,.;:!?"“”])$/i;
const NUMBER = { a: 1, an: 1, one: 1, another: 1, two: 2, three: 3, four: 4, five: 5, six: 6, some: 1, the: 1 };
/** The line's words and punctuation, numbers whole, each with where it starts. */
export const tokens = (text) => [...text.matchAll(/[A-Za-z'’-]+|\d+(?:[.,]\d+)?|[^\sA-Za-z\d'’-]/g)].map(m => ({ t: m[0], at: m.index }));
/** The noun phrases after a verb (tokens in the line's own case): the indirect object when a second noun phrase follows it
 *  ("give the guard a coin", "give Tom a hug", "give him money"), then the object — a determiner or none, pre-head words,
 *  the head noun and an of phrase. "One of the apples" is a partitive with a fused head (CGEL p. 411): the apples are meant. */
export function phrasesAfter(toks, ditransitive) {
    const low = (k) => (toks[k] ?? '').toLowerCase();
    let i = 0, recipient;
    if (ditransitive) {
        let e = -1;
        if (/^(?:me|him|them|us|you|her)$/i.test(toks[0] ?? ''))
            e = 1;
        else if (/^[A-Z][a-z]+$/.test(toks[0] ?? '') && !DET.test(low(0))) {
            e = 1;
            while (/^[A-Z][a-z]+$/.test(toks[e] ?? ''))
                e++;
        }
        else if (/^(?:the|this|that|my|his|their|our|your)$/.test(low(0))) {
            let k = 1;
            while (k <= 3 && toks[k] && !BOUNDARY.test(toks[k]) && !DET.test(low(k)))
                k++;
            if (k > 1 && DET.test(low(k)) && !/^(?:the|this|that)$/.test(low(k)))
                e = k;
        }
        // After a name or a pronoun comes a determiner, or a bare noun ("give him money"). "Her" with a bare noun is the indirect
        // object unless a to phrase follows ("give her money", but "give her purse to Tom") [ASSUMED: the grammar allows both].
        if (e > 0 && (DET.test(low(e)) || (toks[e] && !BOUNDARY.test(toks[e]) && !/^[A-Z]/.test(toks[e]) && noun(toks[e]) && !(low(0) === 'her' && toks.slice(e).some(t => t.toLowerCase() === 'to'))))) {
            recipient = toks.slice(0, e).join(' ');
            i = e;
        }
    }
    const det = DET.test(low(i)) ? low(i++) : '';
    if (det && low(i) === 'of' && /^(?:one|two|three|four|five|six|some|any)$/.test(det)) {
        i++;
        if (DET.test(low(i)))
            i++;
    }
    let j = i;
    while (toks[j] && !BOUNDARY.test(toks[j]) && !/^[A-Z]/.test(toks[j]) && !/^\d/.test(toks[j]))
        j++;
    if (j === i)
        return null;
    let end = j, of = null;
    if (low(j) === 'of' && toks[j + 1] && !BOUNDARY.test(toks[j + 1])) {
        let k = j + 1;
        const d2 = DET.test(low(k)) ? low(k++) : '';
        let m = k;
        while (toks[m] && !BOUNDARY.test(toks[m]))
            m++;
        if (m > k) {
            of = { det: d2, head: low(m - 1), words: toks.slice(j + 1, m).join(' ') };
            end = m;
        }
    }
    const item = [...toks.slice(i, j), ...of ? ['of', of.words] : []].join(' ');
    // The prepositional alternant of the ditransitive (CGEL ch. 4 §4.3 [7], p. 248: "I sent Sue a copy" ~ "I sent a copy to
    // Sue"): with no indirect object, a to phrase after the object names the recipient, a person or an animal ("give the coin
    // to Tom", "hand the letter back to the captain"). The light uses read their own complements (lightReading), so this is
    // reported apart, as `to`, and `end` stays at the object's end.
    let to;
    if (ditransitive && !recipient) {
        let k = end;
        if (/^(?:back|over|across|along|up)$/i.test(toks[k] ?? ''))
            k++;
        if (low(k) === 'to')
            to = recipientAt(toks, k + 1);
    }
    return { recipient, ...to ? { to } : {}, det, head: low(j - 1), item, quantity: NUMBER[det] ?? (/^\d+$/.test(det) ? Number(det) : 1), of, end };
}
/** The person or animal a to phrase's NP starting at k names: an accusative pronoun, a name (with its title), or a determiner,
 *  up to two pre-head words and a noun of a person, an animal or a group (WordNet's first senses: p, n, h, g). */
function recipientAt(toks, k) {
    const w = toks[k] ?? '';
    if (/^(?:me|him|her|them|us|you)$/i.test(w))
        return w.toLowerCase();
    if (/^[A-Z][a-z]+$/.test(w)) {
        let e = k + 1;
        while (/^[A-Z][a-z]+$/.test(toks[e] ?? ''))
            e++;
        return toks.slice(k, e).join(' ');
    }
    if (!/^(?:the|a|an|my|his|her|their|our|your|this|that)$/i.test(w))
        return undefined;
    let e = k + 1;
    while (e <= k + 3 && toks[e] && !BOUNDARY.test(toks[e]) && /^[a-z]+$/.test(toks[e]))
        e++;
    const head = toks[e - 1];
    return e > k + 1 && head && /^[pnhg]/.test(noun(head)?.kinds ?? '') ? toks.slice(k, e).join(' ').replace(/^(?:a|an)\s/i, 'the ') : undefined;
}
/** How a light verb (give, take, have, make, do, offer, pay, put, raise; any form) is used with the words after it (tokens,
 *  punctuation as tokens, in the line's own case): null when it has no noun object to read. */
export function lightReading(verbForm, toks) {
    const verb = LIGHT_VERBS[verbForm.toLowerCase()];
    if (!verb)
        return null;
    // "have" before a participle is the perfect's auxiliary, no light verb ("I have given him a kiss") [ASSUMED: -ed, -en and these irregular participles].
    if (verb === 'have' && /(?:ed|en)$|^(?:done|made|had|been|got|put|paid|kept|left|run|come|gone|sat|stood|held|hit|cut|bought|brought|caught|taught|thought|fought|sought)$/i.test(toks[0] ?? ''))
        return null;
    // WordNet's idioms first ("give chase", "give way", "take a breath", "take a deep breath", "give it a try"); one with no
    // one-word verb and no act noun is a set phrase that hands nothing over ("give a damn").
    for (let len = 5; len >= 1; len--) {
        const words = toks.slice(0, len).map(t => t.toLowerCase());
        if (words.length < len || words.some(w => BOUNDARY.test(w)))
            continue;
        for (const drop of [0, 1, 2]) { // adjectives inside the idiom's noun phrase ("a deep breath")
            if (drop && !(INDEFINITE.test(words[0]) && len - drop >= 2))
                continue;
            const kept = drop ? [words[0], ...words.slice(1 + drop)] : words, key = `${verb} ${kept.join(' ')}`;
            if (!idioms().has(key))
                continue;
            const n = noun(kept.at(-1)), syn = idioms().get(key);
            const as = n?.kinds[0] === 'a' && n.verb ? n.verb : syn || n?.verb;
            return as ? { kind: 'light', verb: as, end: len } : { kind: 'abstract', end: len };
        }
    }
    const o = phrasesAfter(toks, /^(?:give|make|do|offer|pay)$/.test(verb));
    if (!o)
        return null;
    const { recipient, det, head, of, end } = o, n = noun(head);
    // The grammar's own samples are light uses ("give him a kiss", "take a walk", "make a dash for the door").
    const sample = CGEL_LIGHT[verb]?.[head] ?? CGEL_LIGHT[verb]?.[head.replace(/s$/, '')];
    if (sample && (!det || INDEFINITE.test(det) || verb === 'put' || verb === 'pay'))
        return { kind: 'light', verb: sample, recipient, object: of?.words, end };
    if (!n)
        return verb === 'give' || verb === 'take' ? { kind: 'ordinary', object: o, end } : null;
    const hasA = n.kinds.includes('a'), hasC = /[cnq]/.test(n.kinds), first = n.kinds[0].replace(/[nq]/, 'c');
    // "N of N2": a quantity or part of what N2 names (CGEL ch. 5 §3.3, pp. 349–352; partitives p. 411) — a slice of pie, a
    // cup of tea, a piece of the bread — or, after an act's noun, the act's object ("a tour of the house", "a description of
    // him", "a sip of the wine"). The physical acts of give [11] take no of phrase ("*Her kiss of him", p. 294): "a pat of
    // butter" is butter.
    if (of) {
        if (first === 'a' && !hasC && !(n.vfile === 35 && concrete(of.head)))
            return { kind: 'light', verb: n.verb, recipient, object: of.words, end };
        return concrete(of.head) ? { kind: 'ordinary', object: o, end } : { kind: 'abstract', end };
    }
    // A definite object is the ordinary use ("give him the letter", "take the bread"): light verbs take an indefinite one
    // ("the most usual determiner with light verbs is the indefinite article", p. 291).
    if (det && !INDEFINITE.test(det))
        return hasC || first !== 'a' ? { kind: 'ordinary', object: o, end } : { kind: 'light', verb: n.verb, recipient, end };
    if (first === 'a' && !hasC)
        return { kind: 'light', verb: n.verb, recipient, end };
    if (hasC && !hasA)
        return { kind: 'ordinary', object: o, end };
    if (hasA)
        return { kind: 'ambiguous', verb: n.verb, end };
    return hasC ? { kind: 'ordinary', object: o, end } : { kind: 'abstract', end };
}
/** The line with each light use said with its associated verb (CGEL ch. 4 §7 [1]: "She gave him a kiss" ~ "She kissed him";
 *  [7]–[9]), so the frames read the act: "I give Tom a quick kick in the shin" reads as "I kick Tom in the shin", "I take a
 *  walk to the market" as "I walk to the market", "I take a sip of the wine" as "I sip the wine". The indirect object of give
 *  stays as the verb's object ("She gave him a kiss": [11], [12]). */
export function sayLight(text) {
    const toks = tokens(text);
    let out = '', from = 0;
    for (let k = 0; k < toks.length; k++) {
        if (!LIGHT_VERBS[toks[k].t.toLowerCase()])
            continue;
        const r = lightReading(toks[k].t, toks.slice(k + 1).map(x => x.t));
        if (!r || r.kind !== 'light')
            continue;
        const next = toks[k + 1 + r.end];
        out += text.slice(from, toks[k].at) + [r.verb, r.recipient, r.object].filter(Boolean).join(' ') + (next ? ' ' : '');
        from = next ? next.at : text.length;
        k += r.end;
    }
    return (out + text.slice(from)).replace(/ ([,.;:!?])/g, '$1');
}
// ---------------------------------------------------------------------------------------------------- understood subjects
// CGEL ch. 14 §1.7 and §§3, 5: an infinitival with no subject of its own has an understood one. In the complex catenative
// construction ("Pat persuaded Kim to travel by bus", "Pat intended Kim to travel by bus") it is the intervening NP, whether
// that NP is an ordinary object (persuade) or a raised one (intend): "in [i] and [ii] we understand it to be Kim who was to
// travel". The verbs come from the grammar's classification (§5, pp. 1225–1240): those that take an intervening NP with a
// to-infinitival or a bare one. Promise, whose subject stays the controller ("Liz promised me to phone at six", p. 1229: "No
// other verbs follow the patterns of help and promise"), is left out, so its infinitival is its subject's act.
const forms = (list) => list.split(' ');
export const COMPLEX_TO = new Set(forms(
// 2Ai [14] (promise apart), 2Aii [20], 2Bi [23], 2Bii [24], 2Biii [25]
'ask beg help pay petition pledge pray request train claim desire expect mean profess reckon wish bear stand hate like loathe love prefer deserve need require want intend plan ' +
    // 3Ai [33]
    'accustom aid appoint assist authorise authorize back badger beckon beseech blackmail bribe bring caution challenge choose coax command commission compel condemn constrain dare defy design direct discipline drive elect empower entice entitle entreat equip exhort fit forbid force implore incite induce inspire instruct invite lead leave move nag nominate oblige persuade pester prepare press pressure program programme prod prompt provoke push remind school second select sentence spur stimulate stir summon teach tell tempt thank trouble trust urge warn will ' +
    // 3Aii [34]
    'accept affirm allege announce argue ascertain assert assume attest believe certify concede conceive conclude conjecture consider declare deduce deem demonstrate discern disclose discover establish estimate fear find gather grant guarantee guess hold imagine intuit judge know note presume presuppose proclaim pronounce prove recognise recognize represent repute reveal rule rumour say show state stipulate suppose surmise suspect take think tip understand verify allow cause enable let make order permit ' +
    // 3Bi [39], 3Bii [42]
    'get have feel hear notice observe overhear see watch'));
/** Verbs whose intervening NP takes a bare infinitival (the 'B' class marks of §5: make, let, have, help and the verbs of
 *  sensory perception, [34ii], [39], [42], [14]): "I watch Tom climb the wall", "I make Tom walk". */
export const COMPLEX_BARE = new Set(forms('make let have help feel hear notice observe overhear see watch'));
/** Prepositional verbs whose oblique controls the infinitival (2Aiv [22], 3Aiii [38], call on: pp. 1203, 1231, 1235). */
export const OBLIQUE_CONTROL = { motion: 'to', signal: 'to', appeal: 'to', bank: 'on', count: 'on', depend: 'on', rely: 'on', keep: 'at', call: 'on' };
// ------------------------------------------------------------------------------------------------------------- negation
// CGEL ch. 9: verbal negation (§2: not, n't, never, no longer, cannot); items that are "covertly negative" because their
// complement is understood as not happening (§4.4, pp. 835–836): (a) failure, avoidance and omission (avoid, decline, fail,
// forget, neglect, omit, refrain: "The authorities failed to do a thing … entails that the authorities didn't do a thing"),
// (b) prevention and prohibition (ban, hinder, keep, prevent, prohibit, stop … from: "We kept him from telephoning anyone"
// entails he didn't); without (p. 837); too … to (p. 837); almost, nearly and practically, which "trigger a strong negative
// implicature" (p. 723). Refuse is the one-way implicative of Karttunen 2012 (Table 2: refusing to do entails not doing).
// Fail, forget, neglect, avoid and refrain are two-way (Karttunen 2012, Table 1): negated, they say the act was done ("I
// didn't forget to lock the door").
export const NOT_DONE = String.raw `\b(?:not|never|no longer|almost|nearly|practically|without)\s+(?:\w+\s+){0,2}$|\b\w+n['’]t\s+(?:\w+\s+){0,1}$|\bcannot\s+$|\btoo\s+\w+\s+to\s+$`;
export const NEGATIVE_TO = String.raw `(?:refus(?:e|es|ed|ing)|declin(?:e|es|ed|ing)|fail(?:s|ed|ing)?|forg(?:et|ets|ot|otten|etting)|neglect(?:s|ed|ing)?|omit(?:s|ted|ting)?)`;
export const TWO_WAY = /^(?:fail|forg|neglect|omit|avoid|refrain)/i;
export const NEGATIVE_GERUND = String.raw `\b(?:avoid(?:s|ed|ing)?|refrain(?:s|ed|ing)?\s+from|(?:keep|keeps|kept|keeping|prevent(?:s|ed|ing)?|stop(?:s|ped|ping)?|prohibit(?:s|ed|ing)?|ban(?:s|ned|ning)?|hinder(?:s|ed|ing)?)\s+(?:\w+\s+){0,3}?from)\s+$`;
/** A quantity of goods in the line: "a/an/one/two/some/half a N1 of N2" with N2 bare (the non-partitive oblique, CGEL ch. 5
 *  §3.3), N1 a noun of quantity or of a thing (its first sense, WordNet), N2 a thing that is no animal. */
export function measureOfGoods(text) {
    for (const m of text.toLowerCase().matchAll(/\b(?:a|an|one|two|three|four|five|six|some|half a) ([a-z]+) of ([a-z]+)\b/g)) {
        const n1 = noun(m[1]), n2 = noun(m[2]);
        if (DET.test(m[2]) || !n1 || !n2)
            continue;
        // The oblique's first sense is a thing or a quantity ("a pint of ale"); a time is a duration, no goods ("for a couple of
        // seconds": WordNet's first sense of second is noun.time).
        if ((n1.kinds.includes('q') || /^[cq]/.test(n1.kinds)) && /^[cq]/.test(n2.kinds))
            return true;
    }
    return false;
}
// ------------------------------------------------------------------------------ modality, conditions and the passive
// CGEL ch. 3 §2.5: the modal auxiliaries (can, may, must, will, shall and their preterites could, might, would, should; ought)
// take a bare infinitival and are no lexical verbs of their own. A modalised clause does not commit the speaker to the act
// (ch. 3 §9.1, p. 173: "He wrote it himself" is unmodalised, "He must have written it himself" is modalised), so an act under
// can, could, may, might, must, should, would or ought is not done — save "can" or "could" with a verb of perception, which
// reports what is perceived ("I can hear something rattling", [24ii] p. 185: ability "currently actualised"). Will and shall
// of the future are, in a player's line, the act about to be done [ASSUMED for roleplay]. The modal idioms would rather and had
// better (Class 1A, p. 1227) go with the modals.
export const MODALS = new Set(['can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'ought', "'ll", "'d", 'cannot']);
export const NOT_FACTUAL = String.raw `\b(?:can|could|may|might|must|should|would(?:\s+rather)?|had\s+better|ought\s+to|cannot|can['’]t|couldn['’]t|mustn['’]t|shouldn['’]t|wouldn['’]t|mightn['’]t)\s+(?:not\s+)?(?:\w+ly\s+)?$`;
export const PERCEPTION_VERB = /^(?:see|hear|smell|feel|taste|make out)$/;
// CGEL ch. 8 §14 (pp. 738–760): a conditional adjunct ("if", "unless", and "provided", "as long as", "so long as", "on
// condition", "assuming", "supposing", "in the event", "in case", [61] p. 758) makes its clause and the clause it qualifies
// hold only on the condition: neither is a done act ("I hit Tom if he moves").
export const CONDITIONAL = /\b(?:if|unless|provided|providing|as long as|so long as|on condition|assuming|supposing|in the event|in case)\b/i;
// CGEL ch. 16 §10 (pp. 1427–1430): in a passive clause the subject has "a passive role, the role of patient", the verb is a
// past participle after be or get, and the agent, if named, is the complement of by ("the internalised complement").
export const PASSIVE_AUX = /^(?:am|is|are|was|were|be|been|being|get|gets|got|gotten|getting|'m|’m|'s|’s|'re|’re)$/i;
// The complex catenatives whose intervening NP's act happens (Karttunen 2012, Table 2: cause, force, make NP to; CGEL [15iii]
// p. 1229: help; the causatives get and have, Class 3Bi; let; and the verbs of sensory perception, whose bare infinitival
// is what was perceived, [43] p. 1236). Wanting, telling, asking, expecting or allowing someone to act says nothing of whether
// they do ("Tom wants me to walk to the door").
export const ENTAILING_COMPLEX = new Set(['make', 'have', 'get', 'force', 'compel', 'cause', 'help', 'let', 'see', 'hear', 'watch', 'feel', 'notice', 'observe', 'overhear', 'smell']);
// ---------------------------------------------------------------------------------------------------- pronouns and names
// CGEL ch. 17 §3.1 (p. 1484): a non-reflexive pronoun cannot have as antecedent a complement of its own verb ("the absence of
// a reflexive in Ann blames her for the accident excludes Ann as a possible antecedent"), and a personal pronoun agrees with
// its antecedent in person, number and gender (ch. 5 §17; ch. 17 §2): "him" is a man or boy named before it, not the
// subject of its own clause; when more than one fits, the grammar does not choose, and the reader leaves it to the scene.
export function antecedent(candidates, pronoun, exclude) {
    const want = /^her$/i.test(pronoun) ? 'female' : /^him$/i.test(pronoun) ? 'male' : null;
    if (!want)
        return null;
    const fits = [...new Set(candidates.filter(c => (!c.sex || c.sex === want) && !exclude.includes(c.name)).map(c => c.name))];
    return fits.length === 1 ? fits[0] : null;
}
// ------------------------------------------------------------------------------------------------ where the subject stands
// CGEL ch. 4 §3.1 (p. 243): "The basic position [of the subject] is before the predicator; certain adjuncts can intervene …
// but complements cannot." Ch. 8 §20.1 (pp. 779–780): "front position is before the subject, central position is before the
// verb, and end position is after the verb" ("The next day she sold her car", [1i]). So the subject is the noun phrase just
// before the verb (and its auxiliaries), and what comes before the subject is an adjunct in front position: a PP ("In the
// morning I punch Tom", "Without a word I hand Tom the letter"), an adverb or deictic time word ("Today", "Yesterday", ch. 8
// [6] p. 695) or an NP of time ("The next day", "Every morning", "Last night", "Two days ago": its head a noun of WordNet's
// noun.time). The prepositions are the sample of ch. 7 [27] (p. 613) with at, from, into, onto, of, with, during, toward(s),
// upon, among, amid, despite, until, like and beside [ASSUMED: the central prepositions that sample leaves out].
export const PREPOSITION = /^(?:aboard|about|above|across|after|against|along|alongside|apropos|around|before|behind|below|beneath|besides|between|beyond|by|down|for|in|inside|near|notwithstanding|off|on|opposite|outside|over|past|round|since|through|throughout|to|under|underneath|up|within|without|at|from|into|onto|of|with|during|toward|towards|upon|among|amid|despite|until|like|beside)$/i;
/** The nominative personal pronouns (I, we, he, she, they; you has one form), subjects: "There is just one function where
 *  pronouns appear in the nominative case to the exclusion of the accusative …: subject of a finite clause" (CGEL ch. 5
 *  §16.2.1, p. 458). */
export const NOMINATIVE = /^(?:I|we|he|she|they|you)(?:['’](?:m|s|re|ll|d|ve))?$/i;
/** The auxiliaries (CGEL ch. 3 §2.1, p. 92: be, have, do, the modals and use), in their forms and negatives. */
export const AUXILIARY = /^(?:am|is|are|was|were|be|been|being|have|has|had|do|does|did|can|could|may|might|must|shall|should|will|would|ought|used|cannot)$|n['’]t$/i;
// The deictic time words of ch. 8 [6] (p. 695) and the frequency adverbs of [9i] (p. 715) stand in front position alone.
const TIME_WORD = /^(?:now|today|tonight|yesterday|tomorrow|then|later|earlier|soon|afterwards|afterward|meanwhile|again|first|next|finally|once|still|already|instead|always|constantly|continually|frequently|intermittently|invariably|never|normally|occasionally|often|periodically|rarely|regularly|repeatedly|seldom|sometimes|sporadically|usually)$/i;
/** Whether the words form an adjunct in front position (above). */
export function frontAdjunct(ws) {
    if (!ws.length)
        return false;
    if (PREPOSITION.test(ws[0]))
        return true;
    if (ws.every(w => TIME_WORD.test(w) || /ly$/i.test(w)))
        return true;
    const np = ws.at(-1).toLowerCase() === 'ago' ? ws.slice(0, -1) : ws, head = np.at(-1);
    return !!head && np.length <= 4 && !!noun(head)?.kinds.includes('t') && np.slice(0, -1).every(w => !NOMINATIVE.test(w) && /^[A-Za-z]+$/.test(w));
}
/** Where the subject stands in a clause's words that open with an adjunct in front position: a nominative pronoun or a name
 *  just before a verb or auxiliary (the verb after the words when the clause's verb is not among them), after a front
 *  adjunct; -1 when the clause opens with its subject or the words show no such subject. A clause opened by that, which or
 *  who keeps the reader's reading of it (a content clause's act is reported, not done: "I tell Tom that I walked 10 m"). */
export function subjectAfterFront(ws, verbAfter, isVerb) {
    for (let i = 1; i < ws.length; i++) {
        const w = ws[i], next = ws[i + 1] ?? verbAfter;
        if (!(NOMINATIVE.test(w) || /^[A-Z][a-z]+$/.test(w)) || !next || !(isVerb(next) || AUXILIARY.test(next)))
            continue;
        return frontAdjunct(ws.slice(0, i)) ? i : -1;
    }
    return -1;
}
// ------------------------------------------------------------------------------------------------------ time and aspect
// CGEL ch. 3 §4.2.1 (pp. 127–128): the simple present of a dynamic verb is a single act now only in performatives and
// commentaries — "A demonstration, as in [11ii] [I add two cups of flour and fold in gently], can be thought of as a
// commentary on one's own actions" — which is what a player's line is; elsewhere it is a serial state, a habit ("I do 'The
// Times' crossword"). A line's act is the act now unless its words put it at another time:
//  - a non-bounding frequency adjunct (ch. 8 §9, pp. 713–715: frequency adjuncts "mark that the clause expresses a multiple
//    situation", [2]; the non-bounding ones of [9] say how often, not how many times): always, frequently, invariably,
//    normally, often, rarely, regularly, seldom, sometimes, usually ([9i]); each or every with a noun of time, every time,
//    whenever ([9ii]); once, twice or N times a, per, each or every time-noun ([9iii]); as a rule, for the most part ([9iv]).
//    Left out [ASSUMED]: constantly, continually, intermittently, occasionally, periodically, repeatedly, sporadically, now
//    and again, again and again, off and on, on and off, from time to time, which can count the blows or glances of one
//    occasion (a frequency adjunct can count the subsituations of one situation: [6]–[7], "Ben kicked Beth twice"); never and
//    ever, which the negation reads (ch. 9);
//  - a deictic adjunct of a time before or after now (ch. 8 §6.2 [6], p. 695: yesterday, last night, last week, two days ago,
//    in earlier times; tomorrow, tomorrow night, next week, in a week's time, a year from now; ch. 3 §4.3.1 p. 137, the
//    preterite with "yesterday (inducing a dynamic interpretation)" is a past occurrence; §4.2.4 pp. 131–133, the present
//    futurate, "I leave tomorrow"). "In two weeks" is left out: it can be a duration ("She wrote the report in two weeks");
//  - used to (ch. 3 §2.5.9, p. 115: "the past aspectual meaning"); be about to and be on the point of (ch. 3 §10.2 n. 68,
//    p. 211: "Extreme closeness, immediate futurity, is explicitly encoded in about or the less frequent on the point of");
//    will or shall with the perfect (ch. 3 §10.1 [4i], p. 210: "He will have left already" is in past time, the past "attributable
//    to perfect have", will the modal judgement): "I will have walked 10 m by then" judges an act, it does not do one.
// A clause's own adjunct decides; a clause without one takes the one of the clause before it in the sentence ("Yesterday I
// walked to the market and bought apples"); "now", "today", "tonight", "this morning" say now. The preterite with no such
// adjunct is read as the story's own tense, a turn written in the past [ASSUMED for roleplay].
const HABIT = /\b(?:always|frequently|invariably|normally|often|rarely|regularly|seldom|sometimes|usually|whenever|as a rule|for the most part)\b/i;
const PAST_TIME = /\b(?:yesterday|the day before yesterday|the other (?:day|night|week)|in earlier times|earlier today|once upon a time|last (?:night|week|month|year|time|summer|winter|spring|autumn|fall|morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday))\b/i;
const FUTURE_TIME = /\b(?:tomorrow|the day after tomorrow|next (?:week|month|year|time|summer|winter|spring|autumn|fall|morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|in (?:a|an|one|two|three|\w+) \w+['’]s? time|\w+ \w+s? from now)\b/i;
const NOW_TIME = /\b(?:now|today|tonight|this (?:morning|afternoon|evening|night))\b/i;
const timeNoun = (w) => !!w && !!noun(w)?.kinds.includes('t');
/** Whether the words hold a non-bounding frequency adjunct (above). */
export function habitual(s) {
    if (HABIT.test(s))
        return true;
    for (const m of s.matchAll(/\b(?:each|every)\s+([a-z]+)(?:\s+([a-z]+))?/gi))
        if (timeNoun(m[1]) || (/^(?:other|second|single|few|two|three|four|five|six|\d+)$/i.test(m[1]) && timeNoun(m[2])))
            return true;
    for (const m of s.matchAll(/\b(?:once|twice|thrice|\w+\s+times)\s+(?:a|an|per|each|every)\s+([a-z]+)/gi))
        if (timeNoun(m[1]))
            return true;
    return false;
}
const pastOrFuture = (s) => PAST_TIME.test(s) || FUTURE_TIME.test(s) || [...s.matchAll(/\b([a-z]+)\s+ago\b/gi)].some(m => timeNoun(m[1]) || /^(?:long|while)$/i.test(m[1]));
/** Whether the clause holding position i of the line is put at a time other than now (above). */
export function notNow(text, at) {
    const plain = text.replace(QUOTED, q => ','.padEnd(q.length, ' '));
    const start = Math.max(...['.', '!', '?', ';'].map(p => plain.lastIndexOf(p, at - 1))) + 1, rest = plain.slice(at).search(/[.!?;]/);
    const sentence = plain.slice(start, rest < 0 ? plain.length : at + rest), here = at - start;
    const head = plain.slice(start, at);
    if (/\b(?:will|shall|would|['’]ll)\s+(?:not\s+)?have\s+(?:\w+ly\s+)?$/i.test(head) || /\bused\s+to\s+(?:\w+ly\s+)?$/i.test(head) || /(?:\b(?:am|is|are|was|were|be|been)|['’](?:m|s|re))\s+(?:just\s+|now\s+)?(?:about\s+to|on\s+the\s+point\s+of)\s+$/i.test(head))
        return true;
    const cuts = [0, ...[...sentence.matchAll(/\b(?:and|but|then)\b/gi)].map(m => m.index), sentence.length];
    let k = cuts.findIndex((c, j) => j < cuts.length - 1 && here >= c && here < cuts[j + 1]);
    for (; k >= 0; k--) {
        const part = sentence.slice(cuts[k], cuts[k + 1]);
        if (habitual(part) || pastOrFuture(part))
            return true;
        if (NOW_TIME.test(part))
            return false;
    }
    return false;
}
// ---------------------------------------------------------------------------------------------------------- clause type
// CGEL ch. 10. A question asks; it does not do. Closed interrogatives have subject–auxiliary inversion, with do when there is
// no other auxiliary (§2 [1]–[2], p. 856: "Did they see her?"); open ones an interrogative phrase (who, what, where…, [3]);
// and a declarative can be a question too, marked in writing by its question mark (§4.7.2, p. 881). A question of
// perception is answered by what the senses give, so the look or the listening still runs ("Do I see anyone?") [ASSUMED].
// The subject after the auxiliary is a pronoun or a name, matched with its case ("have just walked" is no question).
export const QUESTION_INVERSION = /^\s*(?:[Dd]o|[Dd]oes|[Dd]id|[Aa]m|[Ii]s|[Aa]re|[Ww]as|[Ww]ere|[Hh]ave|[Hh]as|[Hh]ad|[Cc]an|[Cc]ould|[Mm]ay|[Mm]ight|[Mm]ust|[Ss]hould|[Ww]ould|[Ss]hall|[Ww]ill)(?:n['’]t)?\s+(?:I|i|we|you|he|she|they|[A-Z][a-z]+)\s+(?:\w+ly\s+)?$/;
export const SENSING = /^(?:see|sees|saw|hear|hears|heard|smell|smells|smelt|smelled|feel|feels|felt|taste|tastes|tasted|notice|notices|noticed|spot|spots|spotted|sense|senses|sensed|make out|makes out|made out)$/i;
// §9.3.2 (p. 936): a 1st person inclusive let-imperative ("Let's go for a walk", "Let us go") is "a proposal for joint action,
// which the addressee can accept or reject": said, not yet done.
export const LET_US = /(?:^|[.!?,;:]\s*|\b(?:and|then|so|but)\s+)let(?:['’]s|\s+us)\s+(?:\w+ly\s+)?$/i;
// §9.2.2 (p. 927): a vocative is set off by a comma ("Kim, dear, just come and see what I've found"); "in imperatives the
// subject is always referentially tied to the addressee(s)". A sentence that opens with a name or a person's noun and a comma,
// then a verb in its plain form, is a directive to that person: their act if they comply, the player's speech.
export function vocativeImperative(sentence, isPlainVerb, isName) {
    const m = /^\s*((?:(?:the|my)\s+)?[A-Za-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s+((?:(?:please|just|now|quickly|quietly|don['’]t|do\s+not|never)\s+)*)([a-z]+)\b([^.!?]*)/.exec(sentence);
    if (!m)
        return null;
    const np = m[1], head = np.split(/\s+/).at(-1);
    const person = /^[A-Z]/.test(np) && !/^(?:the|my)\b/i.test(np) ? isName(np.split(/\s+/)[0]) || noun(head)?.kinds[0] === 'p' : noun(head)?.kinds[0] === 'p';
    if (!person || NOMINATIVE.test(np) || !isPlainVerb(m[3]))
        return null;
    return { listener: np, message: `${m[2]}${m[3]}${m[4]}`.trim(), at: m.index + m[0].indexOf(m[3], m[1].length) };
}
// --------------------------------------------------------------------------------------- information packaging (CGEL ch. 16)
// Ch. 2 §16 (p. 67) and ch. 16 §9: a cleft divides the elements of its basic counterpart in two, one foregrounded as the
// complement of be, the other in a relative clause — "It was a bee that stung me" ~ "A bee stung me"; the pseudo-cleft puts the
// backgrounded part in a fused relative ("What stung me was a bee"; ch. 4 [47] p. 267). The reader reads each as its basic
// counterpart: "It is Tom that I hit" as "I hit Tom", "It was to the door that I walked" as "I walked to the door", "What I
// do is walk to the door" as "I walk to the door".
export function canonical(text) {
    // The foregrounded element: a PP, a name, or a determiner and a noun ("It is clear that…", with an adjective, is
    // extraposition, no cleft). The relative clause of an it-cleft lacks what is foregrounded: after its verb there is no object
    // of its own ("It is a pity that I hit him" is extraposition too).
    const FOCUS = String.raw `(?:to|at|into|from|with|toward|towards|for)\s+(?:the\s+|a\s+|an\s+|my\s+)?[A-Za-z]+(?:\s+[a-z]+)?|(?:the|a|an|my|this|that)\s+(?:[a-z]+\s+)?[a-z]+|[A-Z][a-z]+`;
    return text
        .replace(new RegExp(String.raw `\bIt(?:['’]s|\s+is|\s+was)\s+(${FOCUS})\s+(?:that|who|whom)\s+(I|we|[A-Z][a-z]+)\s+([a-z]+)\b([^.!?]*)`, 'g'), (all, focus, subject, verb, rest) => {
        if (/^\s+(?:me|him|her|them|us|you|it|the|a|an|my|his|their|our|your|this|that|[A-Z])/.test(rest))
            return all;
        return /^(?:to|at|into|from|with|toward|towards|for)\s/i.test(focus) ? `${subject} ${verb}${rest} ${focus}` : `${subject} ${verb} ${focus}${rest}`;
    })
        .replace(/\bIt(?:['’]s|\s+is|\s+was)\s+(I|me|we|[A-Z][a-z]+)\s+(?:who|that)\s+([a-z]+)\b/g, (_all, focus, verb) => `${/^me$/i.test(focus) ? 'I' : focus} ${verb}`)
        .replace(/\bWhat\s+(I|we|[A-Z][a-z]+)\s+(?:do|did|will\s+do|['’]ll\s+do|am\s+going\s+to\s+do|['’]m\s+going\s+to\s+do)\s+(?:now\s+|next\s+)?(?:is|was)\s+(?:to\s+)?([a-z]+)\b/g, (_all, subject, verb) => `${subject} ${verb}`);
}
// ----------------------------------------------------------------------------------------------- where a walk ends
// CGEL ch. 8 §4.3 (pp. 684–688): with a verb of motion, a goal gives the final location (to, into, onto: "the final locations
// are (in) Bonn and in her bedroom, with to being a marker of the goal category"); "most of the expressions that can
// function as location can also function as goal" ([27]: "I put it next to the garage"), at excepted; a source gives the
// initial location (from, away, off, out of); a path an intermediate one (via, along, and across, through, up, down, past
// "can also express intermediate location": [28]); a direction only "a potential final location" ("While to alone marks
// goal, towards marks direction"). Across alone is a goal on the other side ("the final location is on the other side of the
// bridge", n. 7). Ch. 17 §9.1 (pp. 1549–1550): there is anaphoric to a place named before ("Kim is in Paris and wants us to go
// there too": to Paris). A walk whose end the words do not give ends at a spot its distance from where the walker stood (an
// omitted goal is "contextually understood", [20]), outside only when the words say out.
// "To" before a verb is the infinitive's marker, no goal ("I walk to the door to open it", ch. 14).
// A goal's noun phrase keeps a post-head PP of place ("the market on Wentworth Street": CGEL ch. 5 §14, post-head
// dependents) and ends at a coordinator, a subordinator, an infinitive's to, another PP of motion, a manner adverb, or a PP of
// time (in, on, at or within a noun of WordNet's noun.time: "to the door in a minute").
const AFTER_NP = String.raw `(?=\s*(?:[,.;!?]|$)|\s+(?:and|then|but|with|for|to|before|after|while|until|because|so|as|if|when|from|towards|toward|past|along|through|across|into|onto|over|up|down|carefully|quickly|slowly|quietly|\w+ly)\b)`;
const timeCut = (np) => { const w = np.split(/\s+/); const k = w.findIndex((x, i) => i > 0 && /^(?:in|on|at|within)$/.test(x) && w.slice(i + 1, i + 3).some(y => !!noun(y)?.kinds.includes('t') || y === 'once')); return k > 0 ? w.slice(0, k).join(' ') : np; };
const NP_AFTER = String.raw `\s+(?:(the)\s+)?((?:[a-z'’-]+\s+){0,4}?[a-z'’-]+)${AFTER_NP}`;
const fmt = (d) => `${Math.round(d * 10) / 10} m`;
export function walkEnd(rest, d, who, before, isVerb) {
    const find = (preps) => [...rest.matchAll(new RegExp(String.raw `\b(${preps})${NP_AFTER}`, 'g'))];
    const head = (m) => timeCut(m[3].trim()), the = (m) => `${m[2] ? 'the ' : ''}${head(m)}`;
    // A goal: to (not the infinitive's), into, onto.
    const infinitive = (np) => { const [w, next] = np.split(/\s+/); return !!w && isVerb(w) && (!noun(w) || noun(w).kinds[0] === 'a' || /^(?:the|a|an|my|his|her|him|them|it|me|us|up|down|out|in|who|what|where|if|whether|to)$/.test(next ?? '')); };
    const goal = find('to|into|onto').find(m => m[1] !== 'to' || m[2] || !infinitive(m[3]));
    if (goal)
        return head(goal);
    const across = find('across')[0];
    if (across)
        return `far side of ${head(across)}`;
    const toward = find('towards|toward')[0];
    if (toward)
        return `${fmt(d)} towards ${the(toward)}`;
    const home = rest.match(/\b(home|back)\b/);
    if (home)
        return home[1];
    const at = find('at')[0];
    if (at)
        return head(at);
    const place = find('next to|in front of|behind|beside|near|inside|outside|beneath|under|underneath|between|beyond|opposite|in|on')[0];
    if (place)
        return /^(?:in|on)$/.test(place[1]) ? head(place) : `${place[1]} ${the(place)}`;
    const path = find('along|through|past|via|up|down|over|around|round|by')[0];
    if (path)
        return `${fmt(d)} ${path[1] === 'by' ? 'past' : path[1]} ${the(path)}`;
    const out = find('out of')[0];
    if (out)
        return `outside ${head(out)}`;
    const away = find('away from|from|off')[0];
    if (away)
        return `${fmt(d)} ${away[1] === 'off' ? 'off' : away[1]} ${the(away)}`;
    if (/\baway\b/.test(rest))
        return `${fmt(d)} away from where ${who} stood`;
    if (/\bthere\b/.test(rest)) {
        const ante = [...before.matchAll(new RegExp(String.raw `\b(to|into|onto|at|in|on|by|near|beside|behind|under|inside)${NP_AFTER}`, 'g'))].at(-1);
        if (ante)
            return head(ante);
    }
    return /\b(?:out|outside|leave|leaves|leaving|left|exit|exits|exiting|exited)\b/.test(rest) ? `outside, near where ${who} stood` : `a spot ${fmt(d)} from where ${who} stood`;
}
