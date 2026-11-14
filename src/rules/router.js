// Which tools a turn needs, read by code from the player's message (docs/progress.md entries 36, 39). The verbs come from
// VerbNet 3.4 (data/verbnet.ts: 4,580 verbs in 331 classes grouped by meaning and argument structure, after Levin 1993);
// each class is tied to the tool its outcome needs (CLASS_TOOL). A few tools turn on a property VerbNet's classes leave
// open (hearing apart from seeing, a price, physical effort, a fall), so those take named verbs (VERB_TOOL) [ASSUMED lists].
// The model's tool picker is asked only when no verb maps to a tool.
import { stepsFromWords } from './actions.js';
import { VERBNET } from './data/verbnet.js';
import { lemmas, BEFORE, lightNounTools, frameTools, climbing, creatureAfter, notAShot, SHOT_TOOLS, positionAfter, NON_VISUAL, lemmasAfter, pastForm } from './verbs.js';
import { ACTIVITY_VERBS, EMOTION_VERBS } from './data/activity-verbs.js';
import { cueTools, diseaseWord } from './cue-tools.js';
import { LIGHT_VERBS, lightReading, NEGATIVE_TO, MODALS, PASSIVE_AUX, measureOfGoods, noun, LET_US, vocativeImperative } from './grammar.js';
import { GIVEN_NAMES } from './data/given-names.js';
import { isWord } from './lexicon.js';
import { QUOTED, quotedWords } from './quotes.js';
import { readings, objectAfter, kindsOf } from './senses.js';
/** VerbNet class (file name without its number) → the tools its verbs need. */
const CLASS_TOOL = {
    // Communication (Levin 37) and its requests (58, 59).
    say: ['Communicate'], tell: ['Communicate'], talk: ['Communicate'], manner_speaking: ['Communicate'], chit_chat: ['Communicate'],
    complain: ['Communicate'], advise: ['Communicate'], confess: ['Communicate'], lecture: ['Communicate'], promise: ['Communicate'],
    transfer_mesg: ['Communicate'], inquire: ['Communicate'], interrogate: ['Communicate'], instr_communication: ['Communicate'],
    initiate_communication: ['Communicate'], overstate: ['Communicate'],
    urge: ['Communicate', 'SocialResponse'], beg: ['Communicate', 'SocialResponse'], order: ['Communicate', 'SocialResponse'],
    compel: ['SocialResponse'], trick: ['SocialResponse'], lure: ['SocialResponse'], bully: ['SocialResponse'],
    // Perception (30) and searching (35).
    see: ['Look'], sight: ['Look'], peer: ['Look'], search: ['Look'], investigate: ['Look'], rummage: ['Look'], ferret: ['Look'], hunt: ['Look'], stalk: ['Look'],
    // Change of possession (13), paying and prices (54, 68), taking (10.5, 10.6).
    give: ['Transfer'], contribute: ['Transfer'], future_having: ['Transfer'], get: ['Transfer'], obtain: ['Transfer'], exchange: ['Transfer'],
    hire: ['Price', 'Transfer'], pay: ['Price', 'Transfer'], cost: ['Price'], price: ['Price'], bill: ['Price'], earn: ['Price'],
    // Calculating (VerbNet multiply-108: add, count, divide, subtract, sum, tally) is WorkOut's sum; suffocating (Levin 1993
    // §40.7: choke, stifle, suffocate, asphyxiate) is a choke.
    multiply: ['WorkOut'], suffocate: ['BodyChoke'],
    steal: ['Transfer'], rob: ['Transfer'], cheat: ['Transfer'], send: ['Transfer'],
    // Contact by impact (18), attacks and killing (36.4, 42, 60.1), cutting and poking (19, 21.1), throwing at (17.2).
    hit: ['BodyStrike'], swat: ['BodyStrike'], spank: ['BodyStrike'], attack: ['BodyStrike'], battle: ['BodyStrike'], murder: ['BodyStrike'],
    subjugate: ['BodyStrike'], poke: ['BodyStrike'], cut: ['BodyStrike'], pelt: ['BodyStrike'],
    // poison-42.2 is Levin's verbs of killing by a means (Levin 1993 §42.2: drown, electrocute, hang, knife, poison, shoot, stab,
    // strangle, suffocate): the means names the tool, so its verbs are named below (poison, drown, the chokes) or take their other
    // classes' tools (stab and knife: poke and spank, BodyStrike).
    // Ingesting (39).
    eat: ['BodyIntake'], chew: ['BodyIntake'], gobble: ['BodyIntake'], devour: ['BodyIntake'], dine: ['BodyIntake'], gorge: ['BodyIntake'], feeding: ['BodyIntake'],
    // Time (53, 56, 104) and sleep (40.4).
    linger: ['PassTime'], spend_time: ['PassTime'], snooze: ['PassTime'], weekend: ['PassTime'], delay: ['PassTime'],
    // Motion (51), posture (50), carrying and putting (11, 9.1).
    escape: ['Act'], leave: ['Act'], roll: ['Act'], run: ['Act'], nonvehicle: ['Act'], waltz: ['Act'], accompany: ['Act'], reach: ['Act'],
    rotate: ['Act'], assuming_position: ['Act'], bring: ['Act', 'Transfer'], carry: ['Act'], put: ['Act'], body_motion: ['Act'],
    chase: ['Chase', 'Act'],
    // Holding (15.1, 22.5), breaking (44, 45.1, 23.2), curing (45.7).
    // Fulfilling (13.4.1: provide, supply, serve, furnish, issue) is a hand-over, as giving is.
    fulfilling: ['Transfer'],
    hold: ['HoldOn'], cling: ['HoldOn'], break: ['Break'], destroy: ['Break'], split: ['Break'], remedy: ['BodyTreat'],
    weather: ['Weather'],
};
/** A named verb's full tool list (it replaces its VerbNet classes' tools). These are the tools that turn on a property VerbNet's classes leave open: hearing (peer-30.3 holds listen with look), a price (get-13.5.1
 *  holds buy with take), effort, a fall, flight, care of a wound [ASSUMED lists]. */
const VERB_TOOL = {
    hear: ['Listen'], listen: ['Listen'], overhear: ['Listen'], eavesdrop: ['Listen'],
    // Becoming aware names no sense (FrameNet 1.7's Becoming_aware, which holds notice, detect, perceive and sense, has no
    // Body_part element, the sense organ Perception_experience has: "notice the noise", "detect movement"); smelling and
    // tasting are senses no tool decides; feeling about something is an emotion (Appraise), feeling a thing is touch.
    notice: ['Look', 'Listen'], detect: ['Look', 'Listen'], perceive: ['Look', 'Listen'], sense: ['Look', 'Listen'],
    smell: [], sniff: [], taste: [], feel: [], feel_about: ['Appraise'], feel_towards: ['Appraise'], feel_toward: ['Appraise'],
    buy: ['Price', 'Transfer'], purchase: ['Price', 'Transfer'], sell: ['Price', 'Transfer'], rent: ['Price', 'Transfer'], lease: ['Price', 'Transfer'], haggle: ['Price', 'SocialResponse', 'Communicate'], bargain: ['Price', 'SocialResponse', 'Communicate'],
    ask: ['Communicate', 'SocialResponse'], request: ['Communicate', 'SocialResponse'], persuade: ['Communicate', 'SocialResponse'], convince: ['Communicate', 'SocialResponse'], offer: ['Communicate', 'SocialResponse'],
    demand: ['Communicate', 'SocialResponse'], threaten: ['Communicate', 'SocialResponse'], flirt: ['Communicate', 'SocialResponse'], bribe: ['Communicate', 'SocialResponse', 'Transfer'], invite: ['Communicate', 'SocialResponse'],
    // Swimming is effort and immersion (BodyEnvironment: "go into or out of water", its swimming argument).
    climb: ['BodyCheck'], jump: ['BodyCheck'], leap: ['BodyCheck'], vault: ['BodyCheck'], scale: ['BodyCheck'], swim: ['BodyCheck', 'BodyEnvironment'], lift: ['BodyCheck'],
    heave: ['BodyCheck'], force: ['BodyCheck'], pry: ['BodyCheck'], squeeze: ['BodyCheck'], throw: ['BodyCheck'], balance: ['BodyCheck'], push: ['BodyCheck'],
    fall: ['BodyFall'], drop: ['BodyFall'], tumble: ['BodyFall'], trip: ['BodyFall', 'Claim'], stumble: ['BodyFall', 'Claim'], slip: ['BodyFall', 'Claim'],
    flee: ['Chase', 'Act'], pursue: ['Chase', 'Act'], run_after: ['Chase', 'Act'], go_after: ['Chase', 'Act'], chase_after: ['Chase', 'Act'],
    bandage: ['BodyTreat'], treat: ['BodyTreat'], stitch: ['BodyTreat'], splint: ['BodyTreat'], tend: ['BodyTreat'], nurse: ['BodyTreat'],
    wait: ['PassTime'], sleep: ['PassTime'], rest: ['PassTime'], stay: ['PassTime'],
    drink: ['BodyIntake'], sip: ['BodyIntake'], swallow: ['BodyIntake'],
    kick: ['BodyStrike', 'Break'], smash: ['Break'], shatter: ['Break'], lunge: ['BodyStrike'],
    // A shot: a bow or crossbow is BodyStrike's, a handgun BodyCheck's (shot_m) [VerbNet files shoot under poisoning and throwing].
    shoot: ['BodyCheck', 'BodyStrike'],
    // Killing by a means (Levin 42.2): poison is a substance, drowning water around the body, strangling a choke.
    poison: ['Substance'], drown: ['BodyEnvironment'], strangle: ['BodyChoke'], throttle: ['BodyChoke'], smother: ['BodyChoke'], suffocate: ['BodyChoke'],
    asphyxiate: ['BodyChoke'], garrotte: ['BodyChoke'],
    // Phrasal verbs whose sense is not their verb's (VerbNet files them as entries of their own: pick_up under discover-84, apart
    // from pick): "pick up the lantern" takes it, no eating (chew-39.2, "pick at"); "blow out the candle" breaks nothing.
    pick_up: ['Transfer'], blow_out: [],
    // Firing up a stove or an engine starts it, no shot.
    fire_up: [],
    // Lighting a candle or a fire tends no wound (VerbNet files light under remedy-45.7, as "lighten"); drawing a sword, a chair
    // or near is a motion, no luring or splitting.
    light: [], draw: ['Act'],
    hand: ['Transfer'], take: ['Transfer'], pocket: ['Transfer'], lend: ['Transfer'], borrow: ['Transfer'],
    // Reading is a message only read out to someone (VerbNet transfer_mesg-37.1.1 takes a recipient: "read the letter to Tom",
    // a rule below); reading a map or a name tag alone is taking it in (comprehend-87.2, learn-14), which no tool decides.
    read: [],
    // Calling is speech: VerbNet also files call under get-13.5.1 ("call me a cab"), which offered a hand-over for "call out to Tom".
    call: ['Communicate'], call_out: ['Communicate'],
    // An apology is said (FrameNet's Apology frame, a frame of communication; VerbNet has no apologize), and it is one of the acts
    // Trust records (betrayed, lied, promised to change, apologized, kept faith); trusting, confiding and relying on someone are
    // Trust's decisions.
    apologize: ['Communicate', 'Trust'], apologise: ['Communicate', 'Trust'], trust: ['Trust'], distrust: ['Trust'], mistrust: ['Trust'],
    confide: ['Communicate', 'Trust'], betray: ['Trust'], rely_on: ['Trust'],
    // Lying to someone is a statement that may be a lie (FrameNet Prevarication; VerbNet files lie only as reclining).
    lie_to: ['Communicate', 'SocialResponse'],
    // Hanging from or on something by the hands is a hold (HoldOn: "hang on by their hands"); lugging and toting are carrying
    // a load with effort (WordNet: "carry with difficulty").
    hang_from: ['HoldOn'], hang_on: ['HoldOn'], hang_onto: ['HoldOn'], lug: ['HoldOn', 'Act'], tote: ['HoldOn', 'Act'], haul: ['HoldOn', 'Act'],
    // Running from someone or away is fleeing (FrameNet Fleeing; Chase decides whether the pursuer catches up).
    run_from: ['Chase', 'Act'], run_away: ['Chase', 'Act'],
    // Tiptoeing, creeping and prowling are going quietly so as not to be noticed (Merriam-Webster: tiptoe "to walk or proceed
    // quietly or cautiously", creep 2b "to go timidly, cautiously, or quietly so as to escape notice", prowl "to move about
    // or wander stealthily"; WordNet's definitions leave the stealth out): BodyCheck's sneaking, as well as the motion.
    tiptoe: ['Act', 'BodyCheck'], creep: ['Act', 'BodyCheck'], prowl: ['Act', 'BodyCheck'],
    // Giving way is breaking under a load (Break: "whether a thing gives way under a load").
    give_way: ['Break'],
    // Catching sight is seeing; catching fire is burning (Substance: "when its vapour catches fire").
    catch_sight: ['Look'], catch_fire: ['Substance'],
    // An injection is a dose (Dose: "a medicine given ... an injection"); VerbNet files inject under eating and filling.
    inject: ['Dose'],
    // Remembering or forgetting to do something is prospective memory (WorkOut: "whether they remember to do what they meant
    // to"); adding up is a sum.
    remember_to: ['WorkOut'], forget_to: ['WorkOut'], add_up: ['WorkOut'],
    // A faint and a slip are things that happen to a character now (Claim: "a slip, a faint, a cramp").
    faint: ['Claim'], swoon: ['Claim'],
};
export const ALWAYS = ['RecordFact', 'PassTime', 'NewCharacter'];
const EMOTION = new Set(EMOTION_VERBS.split(' '));
const PERSON_OBJ = /^(?:him|her|them|everyone|everybody|someone|somebody)$/;
const TOP = (cls) => cls.replace(/-[\d.]+$/, '');
/** The tools the player's message asks for, each with the verb that asked; empty when no verb maps to a tool. */
export function routeTurn(text, names = [], player = '') {
    const why = {};
    const subjects = new Set(names.map(n => n.toLowerCase()));
    // Curly apostrophes and single quotes read as the straight ones (the words split at them: "I’ll punch him" routed nothing,
    // "I won’t drink it" read "won" as win).
    const straight = text.replace(/[’‘]/g, "'");
    // What a character pretends or feigns is a show for others, not an act: its words route nothing ("pretend to be drunk").
    const acted = straight.replace(/\b(pretend(?:s|ed|ing)?|feign(?:s|ed|ing)?)\b[^.,;!?]*/gi, '$1');
    if (acted !== straight)
        why.SocialResponse = 'pretend';
    const words = acted.replace(QUOTED, ' , ').toLowerCase().match(/[a-z']+|[,.;:!?]/g) ?? [];
    const orig = acted.replace(QUOTED, ' , ').match(/[a-z']+|[,.;:!?]/gi) ?? [];
    // The tools a verb's lemma names: a named verb's, else its VerbNet classes', else its FrameNet frame's; null when none.
    const toolsOf = (v, next, after, raw = after) => {
        if (climbing(v) && !VERB_TOOL[v])
            return ['BodyCheck'];
        // A verb's senses the line can mean, by what its object is (senses.ts): "fire the cook" keeps dismissing and throwing,
        // "pick the lock" leaves eating out.
        const read = readings(v, raw, text, names), fit = read?.map(r => r.cls), own = VERBNET[v] ?? [];
        // A person after a verb of fulfilling is its recipient, whose thing comes in a with-phrase (VerbNet fulfilling-13.4.1:
        // NP V NP.recipient PP.theme(with), "entrust the cook with the keys"); without one, "trust the cook" is no hand-over.
        const objNow = objectAfter(raw, text, names), recipientOnly = objNow !== 'none' && !!objNow.kinds && /h/.test(objNow.kinds.first) && !raw.includes('with') && !objNow.dative;
        const classes = [...VERBNET[`${v}_${next}`] ?? [], ...(fit ? own.filter(c => fit.includes(c)) : own).filter(c => !(recipientOnly && TOP(c) === 'fulfilling'))];
        // A named verb's tools replace its classes' (VerbNet files climb under motion; a climb is BodyCheck's, not Act's).
        const named = VERB_TOOL[`${v}_${next}`] ?? VERB_TOOL[v];
        // VerbNet's perception classes hold every sense's verbs (see-30.1: feel, smell, taste, sense); Look is not for those of
        // the other senses (verbs.ts NON_VISUAL).
        const byClass = named ?? classes.flatMap(c => /^(?:see|sight|peer)$/.test(TOP(c)) && NON_VISUAL.has(v) ? [] : CLASS_TOOL[TOP(c)] ?? []);
        // Fire with a person or a thing heated as its object is no shot ("fire the cook", "fire the kiln": verbs.ts notAShot).
        if (v === 'fire' && notAShot(after, text))
            return [];
        // No class or named verb names a tool: the verb's FrameNet frame may ("I elude the guards": Chase); a named verb's
        // empty list is its answer ("fire up the stove").
        const framed = byClass.length || named ? null : frameTools(v, after, text);
        const tools = classes.length || named || framed ? framed ?? byClass : null;
        // Two objects after a verb of giving or throwing (VerbNet's NP V NP NP frame of give-13.1, throw-17.1, send-11.1,
        // bring-11.3, slide-11.2, carry-11.4, get-13.5.1) hand the second to the first: "throw the cook a coin".
        // An attack on a defended position is a battle's (FrameNet Attack with a position: verbs.ts FRAME_ROUTES; VerbNet's
        // attack-60.1 holds charge, assault, raid): "our regiment charges the hill".
        if (tools?.includes('BodyStrike') && classes.some(c => TOP(c) === 'attack') && positionAfter(after))
            return [...tools.filter(t => t !== 'BodyStrike'), 'Battle'];
        const obj = objectAfter(raw, text, names);
        if (tools && obj !== 'none' && obj.dative && read?.some(r => /^(?:give|throw|send|bring|slide|carry|get|contribute|future_having)-/.test(r.cls)) && !tools.includes('Transfer'))
            return [...tools, 'Transfer'];
        return tools;
    };
    // The activities a tool's description names add that tool to the verb's own (data/activity-verbs.ts: "sneak" is Act's
    // motion and BodyCheck's sneaking; "solve" is WorkOut's), and a verb of feeling whose sense the line keeps adds Appraise
    // ("I fear the dark"; "feel the wall" keeps touch).
    const toolsWith = (v, next, after, raw = after) => {
        const t = toolsOf(v, next, after, raw);
        const kept = readings(v, raw, text, names)?.map(r => r.cls) ?? VERBNET[v] ?? [];
        // A craft or a repair works a thing, not the body ("fix my hair"); a phrasal verb is read whole ("work out the answer").
        const obj = objectAfter(raw, text, names), body = obj !== 'none' && /b/.test(obj.kinds?.first ?? '');
        const act = (ACTIVITY_VERBS[`${v}_${next}`] ?? ACTIVITY_VERBS[v] ?? []).filter(x => !(x === 'BodyCheck' && body));
        const add = [...act, ...EMOTION.has(v) && kept.some(c => /^(?:admire|marvel)$/.test(TOP(c))) ? ['Appraise'] : []];
        return add.length ? [...new Set([...t ?? [], ...add])] : t;
    };
    // A verb form after be, get or have that is no -ing or -s form is a participle (CGEL ch. 3 §1.4): the passive's or the
    // perfect's ("I get hit by Tom", "I have walked").
    // A form that is its own base ("hit", "cut") counts only with a by phrase after it ("I get hit by Tom"; "get back" is no
    // passive).
    const participle = (x, at = -1) => !!x && !/(?:ing|s)$/.test(x) && lemmas(x).some(v => VERBNET[v]) && (/(?:ed|en)$/.test(x) || lemmas(x).some(v => v !== x && VERBNET[v]) || words.slice(at + 1, at + 5).includes('by'));
    const base = (x) => !!x && !!VERBNET[x];
    const forced = new Set();
    // A noun phrase opening a clause is its subject, and the finite verb after it is the clause's verb (CGEL ch. 4 §1: the
    // subject precedes the predicator in a declarative): "a shard slices her palm", "what a mason earns", "the guards chase
    // Mara". The phrase is a determiner (or a possessor) and up to three words, the last a common noun; the verb is an -s or
    // -ed form, a base form after a plural noun, or a base form after an inverted auxiliary ("does the guard hear": ch. 3 §2.1).
    const SUBJ_DET = /^(?:the|a|an|my|his|her|their|our|your|its|this|that|these|those|every|each|one|two|three|some|no|another)$/;
    const OPENS = /^(?:[,.;:!?]|and|then|but|so|while|when|as|because|what|where|until|before|after|if|how|whether|that)$/;
    const AUX_Q = /^(?:do|does|did|will|would|can|could|shall|should|may|might|must)$/;
    const PERSON_SUBJECT = /^(?:i|you|he|she|it|we|they|anyone|someone|everyone|nobody|somebody|anybody|everybody)$/;
    const PARTICLE_OR_PREP = /^(?:off|out|up|down|on|in|over|away|back|about|around|along|through|at|to|into|onto|from|with|by|of|for)$/;
    const afterNounSubject = (i) => {
        const w = words[i], last = words[i - 1];
        if (!last || /'s$/.test(last) || !noun(last) || PARTICLE_OR_PREP.test(w) || !lemmas(w).some(v => VERBNET[v] || VERB_TOOL[v]))
            return null;
        for (let d = i - 2; d >= Math.max(0, i - 4); d--) {
            const det = words[d];
            if (!(SUBJ_DET.test(det) || (/'s$/.test(det) && d < i - 1))) {
                if (/^[,.;:!?]$/.test(det))
                    return null;
                continue;
            }
            const before = words[d - 1], inverted = !!before && AUX_Q.test(before);
            if (d > 0 && !OPENS.test(before) && !inverted)
                return null;
            if (words.slice(d + 1, i).some((x, k) => /^[,.;:!?]$/.test(x) || SUBJ_DET.test(x) || readVerb.has(d + 1 + k)))
                return null;
            const finite = /(?:[^s]s|ed)$/.test(w) || (lemmas(w).some(v => v !== w && (VERBNET[v] || VERB_TOOL[v])) && !/s$/.test(w)) || (/[^s']s$/.test(last) && !!(VERBNET[w] || VERB_TOOL[w]));
            return finite || (inverted && !!(VERBNET[w] || VERB_TOOL[w])) ? last : null;
        }
        return null;
    };
    // The subject noun of the clause read last: a verb joined to it by "and" or "then" shares it; a sentence's end, a pronoun or
    // a name starts another.
    let clauseSubject = null;
    // The words already read as a clause's verb: no subject phrase holds one ("does the ether catch fire": catch is the verb).
    const readVerb = new Set();
    for (let i = 0; i < words.length; i++) {
        const w = words[i], prev = words[i - 1], prev2 = words[i - 2];
        if (/^[.!?;]$/.test(w) || /^(?:i|we|you|he|she|they|it)$/.test(w) || (/^[A-Z]/.test(orig[i] ?? '') && i > 0))
            clauseSubject = null;
        // Auxiliaries are no lexical verbs (CGEL ch. 3 §2): a modal ("I will climb the wall": no bequeathing), be or get before
        // a participle (the passive, ch. 16 §10: "I get hit by Tom" is a blow), have before one (the perfect); the verb after
        // them is the one to read.
        // A capitalised word inside a sentence is a name, no verb ("I signal to Will to wait", "no, Will").
        if (/^[A-Z]/.test(orig[i] ?? '') && i > 0 && !/^[.!?]$/.test(prev ?? '') && w !== 'i')
            continue;
        // Adverbs in central position stand between the auxiliary and its verb (CGEL ch. 8 §20.1 [3]: "They had probably seen
        // her"; "I have just walked").
        let j = i + 1;
        while (/^(?:not|never|rather|better|just|also|really|still|then|soon|surely|probably|already|ly)$|ly$/.test(words[j] ?? ''))
            j++;
        if (MODALS.has(w) || ((PASSIVE_AUX.test(w) || /^(?:have|has|had|having)$/.test(w)) && participle(words[j], j))) {
            forced.add(j);
            continue;
        }
        // A let-imperative's own verb is no act of letting; the act it proposes is read, for the scene to settle whether it is
        // taken up ("Let's walk to the door": CGEL ch. 10 §9.3).
        if (w === "let's" || (w === 'let' && /^(?:us|s)$/.test(words[i + 1] ?? '') && (i === 0 || /^(?:[,.;:!?]|and|then|so|but)$/.test(prev ?? '')))) {
            const k = w === 'let' ? i + 2 : i + 1;
            forced.add(k);
            i = k - 1;
            continue;
        }
        // "Used to" is an auxiliary of past aspect (CGEL ch. 3 §2.5.9, p. 115), no using: the verb after it is read.
        if (w === 'used' && words[i + 1] === 'to' && base(words[i + 2])) {
            forced.add(i + 2);
            i++;
            continue;
        }
        // The causatives make, have, get, let and help before a person and a verb (CGEL ch. 14, Classes 3Ai, 3Aii, 3Bi): their
        // own sense is no act ("I have Tom give me the coin" is no eating); the verb after the person is read.
        if (/^(?:make|makes|made|making|have|has|had|having|get|gets|got|getting|let|lets|letting|help|helps|helped|helping)$/.test(w)) {
            const np = /^(?:me|him|her|them|us|you)$/.test(words[i + 1] ?? '') ? 1 : /^(?:the|a|an|my|his|her|their)$/.test(words[i + 1] ?? '') && words[i + 2] && !base(words[i + 2]) ? 2 : words[i + 1] && !base(words[i + 1]) && !participle(words[i + 1]) && names.map(n => n.toLowerCase()).concat(orig[i + 1] && /^[A-Z]/.test(orig[i + 1]) ? [words[i + 1]] : []).includes(words[i + 1]) ? 1 : 0;
            const next = words[i + 1 + np] === 'to' ? i + 2 + np : i + 1 + np;
            if (np && base(words[next])) {
                forced.add(next);
                continue;
            }
        }
        // A name opening a sentence is a subject (a given name or no common word, as frame.ts namedBefore reads it: "Tom punches me").
        const named = (k) => /^[A-Z][a-z]+$/.test(orig[k] ?? '') && (GIVEN_NAMES[words[k]] != null || !isWord(orig[k]));
        const verbSpot = forced.has(i) || i === 0 || /^[,.;:!?]$/.test(prev) || BEFORE.has(prev) || subjects.has(prev) || named(i - 1) || (/ly$/.test(prev) && (BEFORE.has(prev2) || subjects.has(prev2))) || !!afterNounSubject(i);
        // An NP of time in front position is an adjunct, no verb ("Last week I punched Tom", "Next morning I leave": grammar.ts
        // frontAdjunct, CGEL ch. 8 §20.1, its head a noun of WordNet's noun.time).
        if (verbSpot && /^(?:last|next|this|that|every|each|one|the|early|late)$/.test(w) && noun(words[i + 1] ?? '')?.kinds.includes('t')) {
            i++;
            continue;
        }
        // "Going to" a verb is the intent to do that verb, no going ("I'm going to wait here").
        if (/^(?:going|gonna)$/.test(w) && (words[i + 1] === 'to' || w === 'gonna') && lemmas(words[i + (w === 'gonna' ? 1 : 2)] ?? '').some(v => VERBNET[v]))
            continue;
        // A verb the line says is not done is no act ("I don't hit him", "I refuse to drink", "I almost fall").
        // (grammar.ts: CGEL ch. 9 — verbal negation, the covertly negative fail, forget, neglect, omit, decline, the proximatives;
        // refuse, Karttunen 2012.)
        if (!verbSpot || /^(?:not|never|almost|nearly|practically|without|cannot|don't|doesn't|didn't|won't|can't|wouldn't|shouldn't|couldn't|isn't|wasn't|aren't|weren't)$/.test(prev ?? '') || (prev === 'to' && new RegExp(`^${NEGATIVE_TO}$`).test(prev2 ?? '')) || (prev2 === 'do' && prev === 'not'))
            continue;
        // Do before its subject and a verb is the auxiliary of a question (do-support, CGEL ch. 3 §2.1: "Does Tom trust Mara?"),
        // no light verb: the verb after the subject is read.
        if (/^(?:do|does|did)$/.test(w) && (i === 0 || /^(?:[,.;:!?]|and|but|so|then|what|why|how|when|where|which)$/.test(prev ?? '')) && (PERSON_SUBJECT.test(words[i + 1] ?? '') || SUBJ_DET.test(words[i + 1] ?? '') || named(i + 1) || subjects.has(words[i + 1] ?? '')))
            continue;
        // A light verb is read by its construction (grammar.ts lightReading, CGEL ch. 4 §7): its light use routes the act its
        // noun names ("take a walk": Act; "give Tom a shove": the shove's tools; "give chase": Chase), its ordinary use its own
        // tools ("take the bread": Transfer), a use that could be either both ("give her a ring"), a set phrase none ("give a
        // damn", "give him a piece of my mind").
        // A noun FrameNet files in a routed frame decides first ("take a shot at the deer", "take a swing at Tom": verbs.ts).
        const framedNoun = LIGHT_VERBS[w] ? lightNounTools(LIGHT_VERBS[w], words.slice(i + 1).filter(x => !/^[,.;:!?]$/.test(x)), text) : null;
        if (framedNoun) {
            for (const t of framedNoun)
                why[t] ??= w;
            continue;
        }
        const reading = LIGHT_VERBS[w] ? lightReading(orig[i], orig.slice(i + 1)) : null;
        if (reading && reading.kind !== 'ordinary') {
            const assoc = reading.kind === 'abstract' || !reading.verb ? [] : toolsOf(reading.verb, '', []) ?? [];
            for (const t of assoc)
                why[t] ??= w;
            if (reading.kind !== 'ambiguous')
                continue;
        }
        // A verb of falling with an object moves the object ("drop the sword", "slip the note into his pocket", "trip the guard"),
        // and with a predicative complement it changes a state ("fall asleep", "fall silent", "fall in love": fall as a
        // complex-intransitive verb, CGEL ch. 4 §5): no fall of the speaker's body.
        if (lemmas(w).some(v => VERB_TOOL[v]?.[0] === 'BodyFall') && (/^(?:the|a|an|my|his|her|their|our|your|its|this|that|these|those|him|them|it|some)$/.test(words[i + 1] ?? '')
            || /^(?:asleep|silent|quiet|still|ill|sick|short|prey|victim)$/.test(words[i + 1] ?? '') || (words[i + 1] === 'in' && words[i + 2] === 'love')))
            continue;
        for (const v of lemmasAfter(w, prev)) {
            // A support verb's noun names the act ("throw a punch", "steal a glance": verbs.ts, from FrameNet); a climbing verb is
            // BodyCheck's (clamber, scramble: FrameNet Self_motion); a verb VerbNet lacks takes its FrameNet frame's tool.
            const after = words.slice(i + 1).filter(x => !/^[,.;:!?]$/.test(x)), light = LIGHT_VERBS[w] ? null : lightNounTools(v, after, text);
            if (light) {
                for (const t of light)
                    why[t] ??= w;
                break;
            }
            // A weather verb reports the weather only with "it" as its subject (Levin 1993 §57: "It rained"); "I pour Tom a drink",
            // "I blow on my hands" are no weather.
            const dummy = prev === 'it' || prev === "it's" || (prev2 === 'it' && /^(?:is|was|will|has|had|be|been)$/.test(prev ?? ''));
            let tools = toolsWith(v, words[i + 1] ?? '', after, words.slice(i + 1))?.filter(t => t !== 'Weather' || dummy) ?? null;
            // A thing as the subject fills the Instrument or Theme role, no Agent (VerbNet's Agent is animate or an organization;
            // Levin 1993 §3.3, the instrument subject alternation: "the axe cuts my shin", "a shard slices her palm"): a cut it
            // makes is an accident's wound (BodyWound), and its slipping or rolling is no character's fall, act or effort.
            // A verb joined by "and" or "then" shares its clause's subject ("the axe slips and cuts my shin"). A thing does not
            // speak, perceive or persuade either (Communicate, Look, Listen, SocialResponse take an animate one).
            // An organization acts (VerbNet's Agent: animate or organization); a noun with a physical sense too is read as the thing
            // ("the branch snaps": WordNet's first branch is a division of an organization).
            const head = forced.has(i) ? null : afterNounSubject(i) ?? (/^(?:and|then)$/.test(prev ?? '') ? clauseSubject : null);
            const thing = head ? kindsOf(head) : null;
            const isThing = !!thing && !/[ha]/.test(thing.first) && !(/o/.test(thing.first) && !/x/.test(thing.all));
            if (tools && isThing)
                tools = [...new Set(tools.flatMap(t => t === 'BodyStrike' ? ['BodyWound'] : /^(?:BodyFall|Act|BodyCheck|HoldOn|Chase|Communicate|Look|Listen|SocialResponse)$/.test(t) ? [] : [t]))];
            // A thing that bears, supports or withstands something, or holds or takes a weight or a person, or holds at all, is
            // under a load (Break: "a shelf, a rope someone hangs from"): "does the shelf hold Mara's weight", "will the plank
            // hold"; "the box holds three apples" is containing.
            if (isThing && (/^(?:bear|support|withstand)$/.test(v) || /^(?:hold|take|carry)$/.test(v) && (!after.length || /^(?:weight|load|me|him|her|them|us|you)$/.test(after.find(x => !/^(?:the|a|an|my|his|her|their|our|your|its)$/.test(x) && !/'s$/.test(x)) ?? '') || /h/.test(kindsOf(after.find(x => !/^(?:the|a|an|my|his|her|their|our|your|its)$/.test(x)) ?? '')?.first ?? ''))))
                tools = [...new Set([...tools ?? [], 'Break'])];
            // A feeling of someone else's, asked about ("whether Elias liked her", "does the guard like Mara"), is that person's
            // response to the scene (SocialResponse) as well as their emotion: a complement clause (CGEL ch. 11) or an inverted
            // question whose subject is a third person.
            if (tools?.includes('Appraise') && EMOTION.has(v)) {
                let at = i - 1;
                if (head) {
                    while (at > 0 && !SUBJ_DET.test(words[at]) && !/^[,.;:!?]$/.test(words[at]))
                        at--;
                }
                // The player's own character is no third person ("How does Mara feel about her brother?").
                const third = (!!head || named(i - 1) || subjects.has(prev ?? '') || /^(?:he|she|they)$/.test(prev ?? '')) && !(player && prev === player.toLowerCase());
                if (third && /^(?:whether|if|that|how|why|does|do|did|will|would)$/.test(words[at - 1] ?? ''))
                    tools = [...tools, 'SocialResponse'];
            }
            if (tools) {
                clauseSubject = head;
                readVerb.add(i);
            }
            for (const t of tools ?? [])
                why[t] ??= w;
            if (tools)
                break;
        }
    }
    // A measure of goods has a price: a quantity of a thing in CGEL's quantificational construction with a non-partitive (bare)
    // oblique (ch. 5 §3.3, pp. 349–352: "a lot of people", not "a lot of the delegates"), its head a noun of quantity (a
    // pint, a pound, a dozen) or of a thing that holds or makes up an amount (a cup, a loaf), the oblique a thing (grammar.ts
    // measureOfGoods): "call for a pint of ale", "a pound of apples", "a loaf of bread".
    if (!why.Price && measureOfGoods(text))
        why.Price = 'a measure of goods';
    // Speech in quotes is a message.
    if (!why.Communicate && quotedWords(text) != null)
        why.Communicate = 'quoted words';
    // A proposal ("Let's walk to the door", "Let us go": CGEL ch. 10 §9.3.2) and a directive to a person a vocative names ("Tom,
    // walk to the door!": §9.2.2) are said (grammar.ts LET_US, vocativeImperative).
    const unquoted = acted.replace(QUOTED, ' , ');
    if (!why.Communicate && [...unquoted.matchAll(/\blet(?:['’]s|\s+us)\s+[a-z]/gi)].some(m => LET_US.test(unquoted.slice(0, m.index + m[0].length - 1))))
        why.Communicate = "let's";
    if (!why.Communicate && unquoted.split(/(?<=[.!?])\s+/).some(x => vocativeImperative(x, v => !!VERBNET[v.toLowerCase()], n => GIVEN_NAMES[n.toLowerCase()] != null || !isWord(n))))
        why.Communicate = 'a vocative and an imperative';
    // A weapon or a limb swung or thrust at someone is a blow tried (Levin 1993 §1.3, the conative alternation: "swing at Tom" is
    // an attempt to hit him): "I swing my axe at the orc", "I thrust my spear at the guard"; at a thing it is a motion. The
    // weapon's phrase may carry its material and size ("her steel long sword": up to four words before "at").
    if (!why.BodyStrike)
        for (const m of unquoted.toLowerCase().matchAll(/\b(swing|swings|swung|swinging|thrust|thrusts|thrusting)\b(?:\s+(?:my|his|her|their|the|a|an|our|your)(?:\s+[a-z'-]+){1,4}?)?\s+at\s+([a-z' ]+)/g))
            if (creatureAfter(m[2].trim().split(/\s+/), text)) {
                why.BodyStrike = m[1];
                break;
            }
    // A motion the action reader recognizes is an Act; a walk whose distance the words leave out still is (the scene gives it).
    if (!why.Act && movesIn(text))
        why.Act = 'motion';
    // Phrases that name another act than their verb [ASSUMED lists]: a breath taken or caught is breathing, no taking; a breath
    // held is held under water (BodyEnvironment), no grip; going into water is immersion (BodyEnvironment), no search; a
    // dressing put on a wound is treatment (BodyTreat).
    const low = acted.toLowerCase(), drop = (re) => { for (const t of Object.keys(why))
        if (re.test(why[t]))
            delete why[t]; };
    if (/\b(?:take|takes|took|taking|catch|catches|caught|catching|draw|draws|drew|drawing) (?:(?:a|another|my|his|her|their|your|one|deep|long|shaky|slow|sharp) )*breaths?\b/.test(low))
        drop(/^(?:take|takes|took|taking|catch|catches|caught|catching|draw|draws|drew|drawing)$/);
    if (/\bh(?:old|olds|olding|eld) (?:my|his|her|their|your|its|our) breath\b/.test(low)) {
        drop(/^h(?:old|olds|olding|eld)$/);
        why.BodyEnvironment ??= 'breath held';
    }
    if (/\b(?:dive|dives|dived|dove|diving|plunge|plunges|plunged|plunging|jump|jumps|jumped|jumping|leap|leaps|leapt|leaped|wade|wades|waded|wading|fall|falls|fell|falling|slip|slips|slipped|step|steps|stepped|swim|swims|swam) (?:in|into|under) (?:the |a |an )?(?:icy |cold |dark |deep |freezing )?(?:river|water|lake|sea|pond|stream|canal|harbou?r|ocean|pool|surf|waves|creek|brook|moat|bay|current)\b/.test(low)) {
        drop(/^(?:dive|dives|dived|dove|diving)$/);
        why.BodyEnvironment ??= 'into the water';
    }
    if (/\b(?:pick|picks|picked|picking) (?:the |a |its |that |his |her |my )?(?:door'?s? )?(?:lock|padlock|deadlock|deadbolt|latch)\b/.test(low)) {
        drop(/^(?:pick|picks|picked|picking)$/);
        why.BodyCheck ??= 'pick the lock';
    }
    if (/\b(?:keep|keeps|kept|keeping) (?:a |the )?(?:watch|lookout|look-out|vigil)\b|\b(?:stand|stands|stood|standing) (?:guard|watch|sentry)\b/.test(low)) {
        drop(/^(?:keep|keeps|kept|keeping|stand|stands|stood|standing)$/);
        why.Look ??= 'keep watch';
        why.PassTime ??= 'keep watch';
    }
    if (/\bcast(?:s|ing)? (?:a |an |the |my |his |her )?(?:\w+ )?(?:spell|fireball|hex|curse|charm|ward|incantation|enchantment)\b|\bcast(?:s|ing)? (?:a |an |the )?\w+ (?:at|on|upon) /.test(low) && !/\bcast(?:s|ing)? (?:a |an )?(?:glance|look|eye|net|line|shadow|vote|lot|die|dice)\b/.test(low)) {
        drop(/^cast(?:s|ing)?$/);
        why.CastSpell ??= 'cast a spell';
    }
    // Set phrases read by what they mean: taking a seat is sitting down; breaking the silence is speaking; forcing a smile is a
    // face, no effort to test; slipping, creeping or stealing past someone is keeping out of their sight (Look, the one passed
    // the viewer), no fall and no theft.
    if (/\b(?:take|takes|took|taking) (?:a|my|his|her|their|your|our) seat\b/.test(low)) {
        drop(/^(?:take|takes|took|taking)$/);
        why.Act ??= 'take a seat';
    }
    if (/\bbr(?:eak|eaks|oke|eaking) (?:the|an|a|my|his|her|their|our) (?:\w+ )?silence\b/.test(low)) {
        drop(/^br(?:eak|eaks|oke|eaking)$/);
        why.Communicate ??= 'break the silence';
    }
    if (/\bforc(?:e|es|ed|ing) (?:a|an|my|his|her|their) (?:\w+ )?(?:smile|grin|laugh|smirk)\b/.test(low))
        drop(/^forc(?:e|es|ed|ing)$/);
    if (/\b(?:sneak|sneaks|sneaked|snuck|sneaking|creep|creeps|crept|creeping|slip|slips|slipped|slipping|steal|steals|stole|stealing) (?:past|by) /.test(low)) {
        drop(/^(?:sneak|sneaks|sneaked|snuck|sneaking|creep|creeps|crept|creeping|slip|slips|slipped|slipping|steal|steals|stole|stealing)$/);
        why.Act ??= 'past unseen';
        why.Look ??= 'past unseen';
        why.BodyCheck ??= 'past unseen';
    }
    // Opening or returning fire is shooting (FrameNet fire.n: Shoot_projectiles), and so is gunning someone down (holding fire
    // is no grip: fire's first sense is an event, which hold-15.1 does not take; senses.ts).
    const opened = low.match(/\b(?:open|opens|opened|opening|return|returns|returned|returning) fire\b/);
    if (opened) {
        drop(/^(?:open|opens|opened|opening|return|returns|returned|returning|motion)$/);
        for (const t of SHOT_TOOLS)
            why[t] ??= opened[0];
    }
    if (/\bgun(?:s|ned|ning)? (?:[a-z']+ ){0,2}down\b/.test(low))
        for (const t of SHOT_TOOLS)
            why[t] ??= 'gun down';
    // What the player states about their own character (Claim: "what the character is, an item they have, an ability of body
    // or skill, something that happened to them before, something ... happening to them now"), by its construction: an
    // ascriptive be with the player as subject ("I am a cat", "Mara is secretly a vampire": CGEL ch. 4 §5), an item brought out
    // of their own clothes or bag ("pulls a revolver from her coat", "takes out my lockpicks"), an ability ("knows how to sail",
    // "speaks fluent Latin", "can see in the dark"), a past ("I studied medicine", "she once lived in Rome", "served in the
    // army"), a cramp [ASSUMED pattern lists].
    const self = `(?:i|i'm|${[...subjects].map(n => n.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&')).join('|') || 'i'}|she|he)`;
    const unq = unquoted.toLowerCase().replace(/[’]/g, "'");
    if (!why.Claim && (new RegExp(`(?:^|[.!?]\\s*)${self}(?:'m| am| is| was)? (?:secretly |really |actually |in fact |truly )?(?:a|an) [a-z]+`).test(unq) && !new RegExp(`(?:^|[.!?]\\s*)${self} (?:am|is|was) (?:a|an) (?:bit|little|lot)\\b`).test(unq)))
        why.Claim = 'what the character is';
    if (!why.Claim && /\b(?:pull|pulls|pulled|draw|draws|drew|take|takes|took|fish|fishes|fished|whip|whips|whipped|produce|produces|produced|bring|brings|brought|slide|slides|slid)(?: out)? (?:a|an|the|my|his|her|their|some|two|three)? ?(?:[a-z'-]+ ){0,3}?(?:from|out of) (?:my|his|her|their) (?:[a-z-]+ )?(?:coat|pocket|pockets|bag|satchel|pack|backpack|boot|boots|sleeve|belt|purse|pouch|cloak|jacket|vest|waistcoat|skirt|apron|bodice|haversack|knapsack|holster|sheath|scabbard)\b|\b(?:take|takes|took|pull|pulls|pulled|fish|fishes|fished|whip|whips|whipped) out (?:my|his|her|their) /.test(unq))
        why.Claim = 'an item they have';
    if (!why.Claim && /\b(?:know|knows|knew) how to\b|\bspeaks? (?:fluent|perfect|some) [a-z]+|\bfluent in\b|\b(?:can|could) (?:see|hear) in the dark\b|\b(?:am|is|was) (?:trained|skilled) (?:in|as|at)\b/.test(unq))
        why.Claim = 'an ability';
    if (!why.Claim && new RegExp(`\\b${self} (?:once|used to|grew up|was born|was raised|studied|served in|trained as|worked as|apprenticed)\\b|\\bremembers? (?:that )?(?:she|he|i) (?:served|studied|lived|worked|was|had)\\b`).test(unq))
        why.Claim = 'happened before';
    if (!why.Claim && /\b(?:a|the) (?:sudden |sharp )?cramps?\b/.test(unq))
        why.Claim = 'a cramp';
    // Clothes put on or taken off change what the body wears (BodyEnvironment: "or they change clothes"): a garment (WordNet's
    // clothing) after put on, take off, strip off, pull on, change into, remove, don or doff.
    if (!why.BodyEnvironment)
        for (const m of low.matchAll(/\b(?:put|puts|putting|take|takes|took|taking|strip|strips|stripped|stripping|pull|pulls|pulled|pulling|slip|slips|slipped|throw|throws|threw|shrug|shrugs|shrugged)\s+(?:on|off)\s+((?:[a-z'-]+\s+){0,3}[a-z'-]+)|\b(?:change|changes|changed|changing) into\s+((?:[a-z'-]+\s+){0,3}[a-z'-]+)|\b(?:don|dons|donned|doff|doffs|doffed|remove|removes|removed|unbutton|unbuttons|unbuttoned)\s+((?:[a-z'-]+\s+){0,3}[a-z'-]+)/g)) {
            const np = (m[1] ?? m[2] ?? m[3] ?? '').split(/\s+/);
            if (np.some(w => /^cloth(?:es|ing)$/.test(w) || (/r/.test(kindsOf(w)?.all ?? '') && !/[bk]/.test(kindsOf(w)?.first ?? '')))) {
                drop(new RegExp(`^${m[0].split(/\s+/)[0]}$`));
                why.BodyEnvironment = 'clothes';
                break;
            }
        }
    // Climbing or getting out of water ends immersion (BodyEnvironment: "go into or out of water").
    if (!why.BodyEnvironment && /\b(?:climb|climbs|climbed|clamber|clambers|clambered|crawl|crawls|crawled|get|gets|got|haul|hauls|hauled|drag|drags|dragged|pull|pulls|pulled|step|steps|stepped|wade|wades|waded) (?:(?:myself|himself|herself|themselves|ourselves|yourself) )?(?:out of|from) (?:the )?(?:icy |cold |dark |deep |freezing )?(?:river|water|lake|sea|pond|stream|canal|harbou?r|ocean|pool|surf|waves|creek|brook|moat|bay|current)\b/.test(low))
        why.BodyEnvironment = 'out of the water';
    // A load put on a plank, a beam, a shelf, a rope or a bar may break it (Break: "a plank or beam someone stands or jumps on, a
    // shelf, a rope someone hangs from, an iron bar or chain link pulled").
    if (!why.Break && /\b(?:stand|stands|stood|standing|jump|jumps|jumped|jumping|step|steps|stepped|stepping|walk|walks|walked|walking|hang|hangs|hung|hanging|climb|climbs|climbed|climbing|sit|sits|sat|sitting|lean|leans|leaned|leant|leaning|swing|swings|swung|swinging) (?:on|onto|upon|from|across|along|out on) (?:the|a|an|that|this|his|her|my|their) (?:[a-z'-]+ ){0,2}(?:plank|planks|beam|beams|shelf|shelves|rope|ropes|bar|bars|chain|chains|link|links)\b|\b(?:pull|pulls|pulled|pulling|tug|tugs|tugged|tugging|yank|yanks|yanked|yanking|swing|swings|swung|swinging) (?:on |at )?(?:the|a|an|that|this|his|her|my|their) (?:[a-z'-]+ ){0,2}(?:rope|ropes|bar|bars|chain|chains|link|links|beam|beams|plank|planks)\b/.test(low))
        why.Break = 'a load on it';
    // What another character does, asked ("What does the guard do?", "Does the merchant fight or flee?", "Which road does Tom
    // take?"), is Choose's: their options (Choose: "fight, flee or bargain; which road; whom to trust").
    if (!why.Choose && (/\bwhat (?:does|do|did|will|would) (?!i\b|we\b)[a-z' ]+ do\b/.test(low) || /\bwhich [a-z]+ (?:does|do|did|will|would) (?!i\b|we\b)/.test(low) || /\b(?:does|do|did|will|would) (?!i\b|we\b)(?:the |a |an )?[a-z']+ [a-z]+ or [a-z]+\b/.test(low)))
        why.Choose = 'what they do';
    if (!why.Communicate)
        for (const m of low.matchAll(/\bread(?:s|ing)?\b((?: [a-z'-]+){0,4}?) (aloud|out loud|out|to) ?([a-z'-]+)?(?: ([a-z'-]+))?/g)) {
            // The listener is a person or a group of people ("to the crowd": WordNet's noun.group).
            const to = m[2] !== 'to' || PERSON_OBJ.test(m[3] ?? '') || /^(?:me|us|you)$/.test(m[3] ?? '') || names.some(n => n.toLowerCase() === m[3]) || (/^(?:the|a|an|his|her|my|their)$/.test(m[3] ?? '') && /[ho]/.test(kindsOf(m[4] ?? '')?.first ?? ''));
            if (to) {
                why.Communicate = 'read out';
                break;
            }
        }
    // An account of one's own acts or whereabouts in quotes may be a lie (SocialResponse "a statement that might be a lie"): of
    // 1,535 everyday lies in diaries, 27 % were about the liar's actions, plans and whereabouts (DePaulo, Kashy, Kirkendol, Wyer
    // & Epstein 1996, JPSP 70:979, Table 5): a quoted first-person clause in the past or denied ("I was asleep at the inn", "I
    // didn't take it", "I never saw him"). Feelings, the larger share (30–37 %), are left out: "I am hungry" is no account a
    // listener checks [ASSUMED].
    const said = quotedWords(text);
    const account = (t) => [...t.toLowerCase().matchAll(/\b(?:i|we) (?:(?:never|just|only|really) )?([a-z']+)/g)].some(m => /^(?:was|were|wasn't|weren't|did|didn't|never|haven't|hadn't|had|swear|promise)$/.test(m[1]) || pastForm(m[1]));
    if (!why.SocialResponse && said && account(said))
        why.SocialResponse = 'an account that may be a lie';
    // Watching a person, or what a person does, waits on what they do: their choice (Choose) or their response (SocialResponse).
    for (const m of low.matchAll(/\b(?:watch|watches|watched|watching|observe|observes|observed|observing|eye|eyes|eyed|study|studies|studied)\s+(what|how|whether)?\s*((?:[a-z'-]+\s+){0,3}[a-z'-]+)/g)) {
        const np = m[2].split(/\s+/), head = np.find(x => /[h]/.test(kindsOf(x)?.first ?? '')) ?? (np.some(x => PERSON_OBJ.test(x) || names.some(n => n.toLowerCase() === x)) ? np[0] : null);
        if (head || m[1]) {
            why.Choose ??= 'what they do';
            why.SocialResponse ??= 'what they do';
            break;
        }
    }
    // A thing put into one's own clothes or bag is taken (Transfer: "taken", "stolen"): "slid it into her sleeve", "tuck the
    // letter into my coat", "pocket"s of VerbNet's put verbs with a possessed container or garment (WordNet kinds n, r).
    if (!why.Transfer)
        for (const m of low.matchAll(/\b(?:put|puts|putting|slip|slips|slipped|slipping|slide|slides|slid|sliding|tuck|tucks|tucked|tucking|stuff|stuffs|stuffed|stuffing|stash|stashes|stashed|shove|shoves|shoved|pop|pops|popped|drop|drops|dropped|sweep|sweeps|swept)\b((?: [a-z'-]+){0,4}?) (?:into|in|inside|under|up) (?:my|his|her|their|your|our) (?:[a-z-]+ )?([a-z-]+)/g)) {
            // The thing moved is no body part ("put my hand in my pocket").
            const k = kindsOf(m[2]), moved = m[1].trim().split(/\s+/).filter(Boolean);
            if (k && /[nr]/.test(k.all) && !/b/.test(k.first) && !moved.some(x => /b/.test(kindsOf(x)?.first ?? ''))) {
                why.Transfer = 'into their own things';
                break;
            }
        }
    // A load carried by its handles is a hold (HoldOn: "carry a load by its handles").
    if (!why.HoldOn && /\b(?:carry|carries|carried|carrying|lift|lifts|lifted|lifting|haul|hauls|hauled|drag|drags|dragged|lug|lugs|lugged)\b(?: [a-z'-]+){1,5} by (?:its|the|their|his|her|my|both) (?:[a-z-]+ )?handles?\b/.test(low))
        why.HoldOn = 'by its handles';
    // Catching an illness is contagion (Disease), no hand-over: the object is a disease WordNet names (data/cue-words.ts).
    // Catching a person is the end of a chase (Chase: "whether a pursuer catches someone running away").
    for (const m of low.matchAll(/\b(?:catch|catches|caught|catching) (?:the |a |an |his |her |my |their )?([a-z-]+)/g)) {
        if (diseaseWord(m[1])) {
            drop(/^(?:catch|catches|caught|catching)$/);
            why.Disease ??= m[0];
        }
        else if ((/h/.test(kindsOf(m[1])?.first ?? '') && !/a/.test(kindsOf(m[1])?.all ?? '')) || PERSON_OBJ.test(m[1]) || /^(?:me|us|you)$/.test(m[1]) || names.some(n => n.toLowerCase() === m[1])) {
            drop(/^(?:catch|catches|caught|catching)$/);
            why.Chase ??= m[0];
        }
    }
    // Telling someone what one is or did, in one's own words, may be a lie as quotes are ("I tell the guard I am the duke's
    // niece": DePaulo et al. 1996, above).
    for (const m of unq.matchAll(/\b(?:tell|tells|told|telling|assure|assures|assured|insist|insists|insisted|claim|claims|claimed|swear|swears|swore)\b(?: [a-z'-]+){0,3}? (?:that )?((?:i|she|he|we)(?:'m| [a-z']+)(?: [a-z']+)?)/g))
        if (/^(?:i'm|i am|she is|he is|we are)\b/.test(m[1]) || account(m[1].replace(/^(?:she|he)\b/, 'i'))) {
            why.SocialResponse ??= 'an account that may be a lie';
            break;
        }
    // "How much" or "how many" fronted is the verb's object, an amount (CGEL ch. 10 §7.4, an open interrogative): "How much does
    // the ferryman charge?" asks a price (Price: "what goods cost, what a day of work pays"), no attack and no run.
    const amount = low.match(/\bhow (?:much|many(?: [a-z]+)?) (?:does|do|did|will|would|can|could) (?:the |a |an |his |her |my |their )?[a-z']+ ([a-z']+)/);
    if (amount && lemmas(amount[1]).some(v => (VERBNET[v] ?? []).some(c => /^(?:bill-54\.5|cost-54\.2|price-54\.4|earn-54\.6|pay-68|get-13\.5\.1)/.test(c)))) {
        drop(new RegExp(`^${amount[1]}$`));
        why.Price ??= `how much ${amount[1]}`;
    }
    // How a character feels, or feels about something, is an emotion (Appraise): "how does Mara feel about her brother", "Mara
    // feels angry at the captain", "I feel sorry for him" ("feel for the latch" right after the verb is a search by touch).
    if (!why.Appraise && (/\bhow (?:do|does|did|will|would) [a-z']+(?: [a-z']+)? feel\b/.test(low) || /\bfe(?:el|els|lt|eling)(?: (?!the\b|a\b|an\b|my\b|his\b|her\b|its\b|their\b)[a-z']+){1,2} (?:about|toward|towards|at|for)\b/.test(low)))
        why.Appraise = 'feel';
    // A thing giving way breaks under its load; a person giving way to someone yields (no break).
    for (const m of low.matchAll(/\b([a-z']+) (?:gives|gave|give|giving|given) way\b(?! to)/g))
        if (!/^(?:i|we|you|he|she|they)$/.test(m[1]) && !names.some(n => n.toLowerCase() === m[1]) && !/h/.test(kindsOf(m[1])?.first ?? '')) {
            why.Break ??= 'give way';
            break;
        }
    if (!why.BodyTreat && /\b(?:tourniquet|bandage|splint|sutures?|stitches|poultice|salve|compress|dressing|ointment)s?\b/.test(low))
        why.BodyTreat = 'a dressing';
    if (why.Communicate)
        why.Interpret = 'with Communicate';
    return { tools: Object.keys(why), why };
}
/** The tools a VerbNet class routes to (CLASS_TOOL), for weighing a verb's senses (sense-odds.ts). */
export const toolsOfClass = (cls) => CLASS_TOOL[TOP(cls)] ?? [];
/** Whether a sense of `verb` that the object explicitly fits (senses.ts "match") routes to tools without `tool`: then the
 *  line may mean another act ("I charge the cook": attack, or bill him: Price), and code drafts no call of `tool` for it; the
 *  planner reads the sense from the scene. A named verb's tools are its own (VERB_TOOL), no conflict. */
export function senseConflict(verb, after, raw, tool, names = []) {
    if (VERB_TOOL[verb])
        return false;
    return (readings(verb, after, raw, names) ?? []).some(r => r.fit === 'match' && (CLASS_TOOL[TOP(r.cls)] ?? []).length > 0 && !(CLASS_TOOL[TOP(r.cls)] ?? []).includes(tool));
}
/** Whether the action reader finds a motion in the words. */
export function movesIn(text) {
    // "Going to" a verb is intent, no motion ("I'm going to wait here").
    const r = stepsFromWords(text.replace(/\b(?:going|gonna) to ([a-z]+)/gi, (m, v) => lemmas(v.toLowerCase()).some(x => VERBNET[x]) ? v : m), 'x');
    return 'steps' in r || /needs distance_m/.test(r.error);
}
/** The tool set offered to the planner: the routed tools and the ones every turn may need, or null to ask the model. */
/** The tools that record what the story has happen (their descriptions: "record ... the moment it happens", "once the story
 *  has it happen"): an act the narrator wrote is offered to the planner to record. */
const RECORDING = new Set(['Transfer', 'BodyWound', 'BodyIntake', 'Dose', 'Trust']);
export function routedTools(text, has, names = [], recent = [], narration = [], player = '') {
    const r = routeTurn(text, names, player).tools.filter(has);
    // The scene's words add the tools whose inputs they name (cue-tools.ts): the picker this replaces reads them too. The
    // narrator's last messages add the recording tools their acts route to ("Mara's fingers ... slid it into her sleeve").
    // A change of hands narrated is one by giving, stealing, robbing or seizing (VerbNet give-13.1, contribute-13.2,
    // steal-10.5, rob-10.6, obtain-13.5.2, the named hand, pocket, lend, borrow) or into one's own things; "finds a spring",
    // "learned bleeding control", "reach the camp" route Transfer through get-13.5.1 senses that move no item.
    const handed = (w) => w === 'into their own things' || lemmas(w.toLowerCase()).some(v => /^(?:hand|pocket|lend|borrow|steal|snatch)$/.test(v) || (VERBNET[v] ?? []).some(c => /^(?:give-13\.1|contribute-13\.2|steal-10\.5|rob-10\.6|obtain-13\.5\.2)/.test(c)));
    // The thing handed is a physical one ("learned bleeding control" moves none).
    const thing = (t, w) => { const ws = t.toLowerCase().match(/[a-z']+/g) ?? [], i = ws.indexOf(w.toLowerCase()), o = i >= 0 ? objectAfter(ws.slice(i + 1), t, names) : 'none'; return w === 'into their own things' || (o !== 'none' && (/^(?:it|them)$/.test(o.head) || /x/.test(o.kinds?.first ?? ''))); };
    const told = narration.flatMap(t => { const r = routeTurn(t, names, player); return r.tools.filter(x => x !== 'Transfer' || (handed(r.why.Transfer ?? '') && thing(t, r.why.Transfer ?? ''))); }).filter(t => RECORDING.has(t) && has(t));
    return r.length ? new Set([...r, ...Object.keys(cueTools(text, recent, r)).filter(has), ...told, ...ALWAYS.filter(has)]) : null;
}
