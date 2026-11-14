// English verbs read from free text (the router, BodyCheck's routes): a word back to its verb, where a line puts a verb, and
// the verbs of seeing. Meanings come from VerbNet 3.4 (data/verbnet.ts: verbs grouped by present-day meaning and argument
// structure, after Levin 1993), not from word roots: roots keep old meanings (discern < Latin cernere "sift"; observe <
// servare "watch, keep safe", not servire "serve"), and words of one meaning now (watch, observe) come from different roots.
import { VERBNET } from './data/verbnet.js';
import { ROLE_WORDS } from './nouns.js';
import { FRAMENET, FRAME_FES } from './data/framenet.js';
import { QUOTED } from './quotes.js';
import { measureOfGoods } from './grammar.js';
// Irregular past and participle forms back to the verb (the ones VerbNet's members need most).
const IRREGULAR = Object.fromEntries([
    ['say', 'said'], ['tell', 'told'], ['speak', 'spoke spoken'], ['see', 'saw seen'], ['hear', 'heard'], ['take', 'took taken'],
    ['give', 'gave given'], ['buy', 'bought'], ['sell', 'sold'], ['pay', 'paid'], ['steal', 'stole stolen'], ['lend', 'lent'], ['go', 'went gone goes'],
    ['come', 'came'], ['run', 'ran running'], ['leave', 'left'], ['bring', 'brought'], ['fall', 'fell fallen'], ['hit', 'hitting'], ['strike', 'struck'],
    ['fight', 'fought'], ['shoot', 'shot'], ['cut', 'cutting'], ['eat', 'ate eaten'], ['drink', 'drank drunk'], ['sleep', 'slept'], ['spend', 'spent'],
    ['sit', 'sat sitting'], ['stand', 'stood'], ['kneel', 'knelt'], ['creep', 'crept'], ['sneak', 'snuck'], ['flee', 'fled'], ['hold', 'held'],
    ['cling', 'clung'], ['break', 'broke broken'], ['throw', 'threw thrown'], ['leap', 'leapt'], ['swim', 'swam swum'], ['catch', 'caught'],
    ['sing', 'sang sung'], ['find', 'found'], ['get', 'got gotten getting'], ['put', 'putting'], ['set', 'setting'], ['hide', 'hid hidden'],
    ['ride', 'rode ridden'], ['drive', 'drove driven'], ['write', 'wrote written'], ['bite', 'bit bitten'], ['slide', 'slid'],
    ['lie', 'lay lying lain'], ['rise', 'rose risen'], ['swing', 'swung'], ['hang', 'hung'], ['dig', 'dug'], ['feed', 'fed'], ['meet', 'met'],
    ['stick', 'stuck'], ['sweep', 'swept'], ['keep', 'kept'], ['feel', 'felt'], ['beat', 'beaten'], ['shake', 'shook shaken'], ['tear', 'tore torn'],
    ['wake', 'woke woken'], ['win', 'won'], ['lose', 'lost'], ['seek', 'sought'], ['teach', 'taught'], ['think', 'thought'], ['make', 'made'],
    ['send', 'sent'], ['build', 'built'], ['burn', 'burnt'], ['spill', 'spilt'], ['stride', 'strode'], ['slay', 'slew slain'], ['stab', 'stabbing stabbed'],
].flatMap(([v, f]) => f.split(' ').map(x => [x, v])));
/** The verbs a word may be: itself, an irregular form's verb, then its regular endings stripped. */
export function lemmas(w) {
    const out = [w];
    if (IRREGULAR[w])
        out.push(IRREGULAR[w]);
    const add = (x) => { if (x.length > 1)
        out.push(x); };
    if (/ie[sd]$/.test(w))
        add(w.slice(0, -3) + 'y');
    // -es is the third person's ending after a sibilant or o ("watches", "fixes", "goes"); after anything else the -s is
    // ("rides" is ride's, not rid's: CGEL ch. 18 §2.1).
    if (/(?:s|z|x|ch|sh|o)es$/.test(w))
        add(w.slice(0, -2));
    if (/s$/.test(w))
        add(w.slice(0, -1));
    if (/ed$/.test(w)) {
        add(w.slice(0, -2));
        add(w.slice(0, -1));
        if (/(.)\1ed$/.test(w))
            add(w.slice(0, -3));
    }
    if (/ing$/.test(w)) {
        add(w.slice(0, -3));
        add(w.slice(0, -3) + 'e');
        if (/(.)\1ing$/.test(w))
            add(w.slice(0, -4));
    }
    return out;
}
/** Whether a word is a past form: -ed, or another verb's irregular past ("saw", "went"). */
export const pastForm = (w) => /[a-z]ed$/.test(w) || (!!IRREGULAR[w] && IRREGULAR[w] !== w && !/(?:ing|s)$/.test(w));
/** The lemmas in the order to read them after `prev`: a form that is another verb's irregular past or participle ("saw",
 *  "found", "left") is read as that verb first, save after "to", a modal or do, where the plain form stands ("to saw the
 *  log": CGEL ch. 3 §1.1, the plain form's constructions). */
export function lemmasAfter(w, prev) {
    const ls = lemmas(w), irr = IRREGULAR[w];
    if (!irr || irr === w || /^(?:to|will|would|can|could|shall|should|may|might|must|do|does|did|don't|doesn't|didn't|let's|'ll)$/.test(prev ?? ''))
        return ls;
    return [irr, ...ls.filter(x => x !== irr)];
}
// A word is read as a verb where a player's line puts one: after a subject, an auxiliary, "to", "and", "then", a comma, or
// at the start (an order); one adverb may come between ("I quietly listen").
export const BEFORE = new Set(['i', 'we', 'you', 'he', 'she', 'they', 'it', 'anyone', 'someone', 'everyone', 'nobody', 'somebody', 'anybody', 'everybody', 'and', 'then', 'to', 'or', 'but', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'will', 'would', 'can', 'could', 'must', 'may', 'might', 'shall', 'should', 'do', 'does', 'did', "don't", "i'll", "i'm", "we'll", 'try', 'tries', 'tried',
    'also', 'just', 'still', 'again', 'quickly', 'slowly', 'quietly', 'carefully', 'men', 'women', 'people']);
export function verbsAt(text, extra = NO_EXTRA) {
    // Quoted words are speech, not the line's verbs: blanked to their length, so the positions stay the text's own.
    const toks = [...text.replace(QUOTED, q => ','.padEnd(q.length)).matchAll(/[A-Za-z']+|[,.;:!?]/g)];
    const raw = toks.map(m => m[0]), words = raw.map(w => w.toLowerCase());
    const known = (v) => !!VERBNET[v] || extra.has(v);
    const out = [];
    for (let i = 0; i < words.length; i++) {
        const w = words[i] ?? '', prev = words[i - 1] ?? '', prev2 = words[i - 2] ?? '';
        const subject = i === 1 && /^[A-Z]/.test(raw[0] ?? '') && !lemmas(words[0] ?? '').some(known);
        const spot = i === 0 || subject || /^[,.;:!?]$/.test(prev) || BEFORE.has(prev) || (/ly$/.test(prev) && (i === 1 || BEFORE.has(prev2)));
        if (!spot)
            continue;
        for (const v of lemmas(w)) {
            const two = `${v}_${words[i + 1] ?? ''}`;
            const at = toks[i].index;
            if (known(two)) {
                const n = toks[i + 1];
                out.push({ word: `${w} ${words[i + 1]}`, verb: two, classes: VERBNET[two] ?? [], after: words.slice(i + 2), at, end: n.index + n[0].length });
                break;
            }
            if (known(v)) {
                out.push({ word: w, verb: v, classes: VERBNET[v] ?? [], after: words.slice(i + 1), at, end: at + w.length });
                break;
            }
        }
    }
    return out;
}
const NO_EXTRA = new Set();
// The verbs of seeing: VerbNet's perception classes (see-30.1, sight-30.2, peer-30.3), less the verbs of the other senses
// (hear, listen, overhear, eavesdrop; smell, sniff, scent, scent out; taste, savor; feel, sense, experience; can tell), less
// check and attend, whose BodyCheck tasks are other acts ("check the lock", "attend the wounded"), plus watch, which VerbNet
// files only under searching and assessing (35.2, 34.1) [ASSUMED lists].
const NOT_SIGHT = new Set(['hear', 'listen', 'overhear', 'eavesdrop', 'smell', 'sniff', 'scent', 'scent_out', 'taste', 'savor', 'feel', 'sense', 'experience', 'can_tell', 'check', 'attend']);
const inClass = (re, not = []) => Object.entries(VERBNET).filter(([v, cs]) => !not.includes(v) && cs.some(c => re.test(c))).map(([v]) => v);
export const SIGHT_VERBS = new Set([...inClass(/^(see-30\.1|sight-30\.2|peer-30\.3)/).filter(v => !NOT_SIGHT.has(v)), 'watch']);
// The words after a verb: its object is a creature when one of the first four (past at, on, upon, into) names a person or an
// animal (nouns.ts), is a pronoun for one, or a capitalised name; a possessor counts ("at the bandit's head": a part of him).
const CREATURE_EXTRA = new Set(['bandit', 'robber', 'enemy', 'foe', 'attacker', 'assailant', 'sentry', 'smuggler', 'burglar', 'intruder', 'raider', 'rider',
    'officer', 'prisoner', 'captive', 'opponent', 'rival', 'ruffian', 'brute', 'deer', 'stag', 'boar', 'snake', 'him', 'her', 'them', 'me', 'us', 'you', 'himself', 'herself']);
export const creatureAfter = (after, raw) => after.filter(w => !/^(at|on|upon|into|the|a|an|his|her|their|my|our|your|its|this|that|these|those)$/.test(w) || /^(him|her)$/.test(w)).slice(0, 4)
    .map(w => w.replace(/'s$/, '')).some(w => ROLE_WORDS.has(w) || ROLE_WORDS.has(w.replace(/e?s$/, '')) || CREATURE_EXTRA.has(w) || new RegExp(`\\b${w.charAt(0).toUpperCase()}${w.slice(1)}\\b`).test(raw) && !/^(I|The|A|An)$/.test(w));
// A defended position: what armies take (Battle) [ASSUMED list].
const POSITION = /^(fort|forts|fortress|redoubt|town|city|village|hill|ridge|bridge|trench|trenches|position|positions|line|lines|battery|wall|walls|gate|gates|castle|camp|outpost|stronghold|citadel|earthworks|breach|heights|bastion|keep)$/;
export const positionAfter = (after) => after.slice(0, 4).some(w => POSITION.test(w));
// Persuasion has a person to persuade (FrameNet Suasion's Addressee, Manipulate_into_doing's Victim): its object is a creature,
// or the verb has none ("press for an answer"); "press my palm against the kettle" is touch.
const addressee = (a, r) => !a.length || /^(?:for|to|into|on)$/.test(a[0]) || creatureAfter(a.slice(0, 3), r);
const MISSILE = /\b(gun|guns|pistol|revolver|musket|rifle|carbine|bow|longbow|crossbow|cannon|arrow|arrows|bolt|shaft|volley|round|shot|sling)\b/;
// Fire's object names its sense (PropBank's frameset fire): fire.01's is the gun or the projectile, its target an at-phrase
// (FrameNet Use_firearm: Firearm, Goal); fire.02's the one let go (FrameNet Firing, VerbNet fire-10.10); fire.03 bakes pots and
// fire.04 ignites ("steam engines fired by alcohol lamps") [ASSUMED list of things fired in those two senses].
const HEATED = /^(kilns?|ovens?|stoves?|furnaces?|forges?|boilers?|engines?|thrusters?|clay|pots?|pottery|bricks?|glaze|imagination)$/;
/** Whether the words after fire or loose make it no shot: their object (the words before a preposition) is a person or a
 *  thing heated, and names no weapon or missile ("fire the cook", "fire the kiln"; "fire my pistol at him" is a shot). */
export function notAShot(after, raw) {
    const np = [];
    for (const x of after) {
        if (/^(?:at|on|upon|into|in|with|from|to|toward|towards|and|then|again|twice|once|off|away|back|[,.;:!?])$/.test(x))
            break;
        np.push(x);
    }
    return np.length > 0 && !MISSILE.test(np.join(' ')) && (np.some(w => HEATED.test(w)) || creatureAfter(np, raw));
}
const WOUND = /\b(wound|wounds|cut|cuts|gash|injury|injuries|burn|burns|bite|fracture|bone|leg|arm|hand|head|foot|bleeding|stump)\b/;
const strikeNot = ['bump', 'click', 'dash', 'drum', 'knap', 'rap', 'tamp', 'tap', 'squash', 'squelch', 'pink', 'chip', 'clip', 'ream', 'saw', 'scarify', 'scrape', 'snip', 'rip', 'dig', 'penetrate', 'perforate', 'puncture', 'stick', 'jump', 'bomb', 'bombard', 'raid'];
// A shot: BodyStrike for a bow, a crossbow or a thrown weapon; a handgun at a person is BodyCheck's with shot_m (feats.ts).
const SHOT = 'BodyStrike (launcher, skill, distance_m), or BodyCheck with shot_m for a handgun';
const SEARCH_VERBS = ['search', 'comb', 'scour', 'rummage', 'ransack', 'scan'];
export const TASK_ROUTES = [
    // Hearing: the sound verbs of the perception classes (hear see-30.1, listen and eavesdrop peer-30.3, overhear sight-30.2);
    // catching or making out what is said.
    { to: 'Listen (sounds) or Communicate (speech)', verbs: ['hear', 'listen', 'overhear', 'eavesdrop'] },
    { to: 'Listen (sounds) or Communicate (speech)', verbs: ['catch', 'make_out', 'follow'], when: a => a[0] === 'what' && a.some(w => /^(say|says|said|whisper|whispers|whispered|mutter|mutters|muttered|shout|shouts|shouted|tell|tells|told)$/.test(w)) },
    { to: 'Look', verbs: [...SIGHT_VERBS] },
    // Searching (search-35.2, rummage-35.5, investigate-35.4 members that look through a place).
    { to: 'Look', verbs: SEARCH_VERBS },
    { to: 'Look', verbs: ['rifle', 'sift', 'go'], when: a => a[0] === 'through' },
    { to: 'BodyEnvironment (immersed, swimming, swimmer)', verbs: ['swim', 'drown'] },
    // Hanging on and carrying: hold-15.1 (clasp, clutch, grasp, grip), cling-22.5, carry-11.4 (carry, haul, lug, tote, schlep);
    // hang and dangle (spatial_configuration-47.6) from something; hold on.
    { to: 'HoldOn', verbs: ['clasp', 'clutch', 'grasp', 'grip', 'cling', 'carry', 'haul', 'lug', 'tote', 'schlep'] },
    { to: 'HoldOn', verbs: ['hang', 'dangle'], when: a => /^(from|on|onto|by|off)$/.test(a[0] ?? '') },
    { to: 'HoldOn', verbs: ['hold'], when: a => /^(on|onto|fast)$/.test(a[0] ?? '') },
    // Racing someone on foot: chase-51.6's chase and pursue (follow, shadow, tail, track and trail keep contact instead), flee
    // (escape-51.1), outrunning, running away or off, catching up, giving chase.
    { to: 'Chase', verbs: ['chase', 'pursue', 'flee', 'outrun', 'outpace', 'outdistance'] },
    { to: 'Chase', verbs: ['run'], when: a => /^(away|off|after)$/.test(a[0] ?? '') },
    { to: 'Chase', verbs: ['catch'], when: a => a[0] === 'up' },
    { to: 'Chase', verbs: ['give'], when: a => a[0] === 'chase' },
    // Deceiving: trick-59.2's members that name it (bluff, con, deceive, dupe, fool, hoodwink, mislead, trick…); lying to or
    // about; fibbing.
    { to: 'SocialResponse (a statement that might be a lie)', verbs: ['bamboozle', 'bluff', 'con', 'cozen', 'deceive', 'delude', 'dupe', 'fool', 'hoodwink', 'mislead', 'trick', 'fib'] },
    { to: 'SocialResponse (a statement that might be a lie)', verbs: ['lie'], when: a => /^(to|about)$/.test(a[0] ?? '') },
    // Courting: court (marry-36.2), flirt (chit_chat-37.6), woo, seduce; chatting up; asking out.
    { to: 'SocialResponse (a brief first meeting)', verbs: ['court', 'flirt', 'woo', 'seduce'] },
    { to: 'SocialResponse (a brief first meeting)', verbs: ['chat'], when: a => a[0] === 'up' },
    { to: 'SocialResponse (a brief first meeting)', verbs: ['ask'], when: a => a[1] === 'out' || a[0] === 'out' },
    // Winning someone over: lure-59.3 (allure, bewitch, cajole, coax, entice, flatter, inveigle, lure, sweet-talk, win over),
    // and the router's verbs of asking and pressing (persuade, convince, bribe, threaten, beg).
    { to: 'SocialResponse (a request, an order or persuasion)', verbs: ['allure', 'bewitch', 'cajole', 'coax', 'entice', 'flatter', 'inveigle', 'lure', 'persuade', 'convince', 'bribe', 'threaten', 'intimidate', 'beg', 'plead'] },
    { to: 'SocialResponse (a request, an order or persuasion)', verbs: ['sweet'], when: a => a[0] === 'talk' },
    { to: 'SocialResponse (a request, an order or persuasion)', verbs: ['win'], when: a => a[1] === 'over' || a[0] === 'over' },
    // Taking a defended position (attack-60.1 and taking verbs, the object a fort, a town, a hill…).
    { to: 'Battle (attackers, defenders, year)', verbs: ['attack', 'assault', 'assail', 'storm', 'besiege', 'charge', 'raid', 'take', 'capture', 'seize', 'bombard', 'overrun'], when: positionAfter },
    // A choke on the neck.
    { to: 'BodyChoke', verbs: ['choke', 'strangle', 'throttle', 'garrotte', 'garrote'], when: creatureAfter },
    // Shooting: shoot and fire (throw-17.1), loose (an arrow), aim: at someone, at something, or with a missile weapon named
    // ("fire the musket"); shooting rapids and firing a kiln are other acts.
    { to: SHOT, verbs: ['shoot'], when: a => !/^(the )?(rapids|breeze)\b/.test(a.join(' ')) },
    { to: SHOT, verbs: ['fire', 'loose', 'aim'], when: (a, raw) => !notAShot(a, raw) && (/^(at|on|upon)$/.test(a[0] ?? '') || MISSILE.test(a.slice(0, 5).join(' ')) || creatureAfter(a, raw)) },
    // Blows: hitting, swatting, spanking, poking, attacking, killing and cutting (hit-18.1, swat-18.2, spank-18.3, poke-19,
    // attack-60.1, murder-42.1, cut-21.1) at a creature, less the members that touch without striking (tap, rap, bump) or work
    // material (saw, scrape, dig).
    { to: 'BodyStrike', verbs: inClass(/^(hit-18\.1|swat-18\.2|spank-18\.3|poke-19|attack-60\.1|murder-42\.1|cut-21\.1)/, strikeNot), when: creatureAfter },
    // Treating a wound: bandage (fill-9.8), stanch, stitch, suture, splint; dressing, treating, tending, binding or setting a
    // wound or a limb.
    { to: 'BodyTreat (stop_bleeding, training)', verbs: ['bandage', 'stanch', 'staunch', 'stitch', 'suture', 'splint', 'tourniquet'] },
    { to: 'BodyTreat (stop_bleeding, training)', verbs: ['dress', 'treat', 'tend', 'nurse', 'clean', 'bind', 'sew', 'set', 'cauterize', 'cauterise'], when: a => WOUND.test(a.slice(0, 5).join(' ')) },
];
const ROUTE_VERBS = new Set(TASK_ROUTES.flatMap(r => r.verbs));
// The tasks BodyCheck itself decides (the router's named BodyCheck verbs and other acts of skill): with one of these as the
// task's own verb, words further on ("climb the wall to see over it") route nothing [ASSUMED list].
const OWN = new Set(['climb', 'jump', 'leap', 'vault', 'scale', 'lift', 'heave', 'force', 'pry', 'squeeze', 'throw', 'balance', 'push', 'pull', 'pick', 'ride', 'sneak', 'creep', 'hide', 'row', 'sail', 'drive', 'steer', 'cook', 'forge', 'sew', 'build', 'repair', 'mend', 'cross', 'reach', 'break']);
// Words anywhere in the task that name another tool's question, for tasks whose own verb names none (the earlier lists;
// "lie" only as a falsehood, "bolt" and "shot" only as missiles, "date" only as a meeting).
const PHRASES = [[/\b(hear|hears|heard|hearing|listen|listens|listened|listening|overhear|overheard|noise)\b/i, 'Listen (sounds) or Communicate (speech)'],
    [/\b(see|sees|spot|spots|notice|notices|recogni[sz]e|identify|sight)\b/i, 'Look'],
    [/\b(swim|swims|swimming|swam|drown|drowning|tread water|treading water|afloat)\b/i, 'BodyEnvironment (immersed, swimming, swimmer)'],
    [/\b(hang|hangs|hold on|holding on|hold onto|carry|carries|carrying|grip)\b/i, 'HoldOn'],
    [/\b(chase|chasing|outrun|catch up|run away|flee|fleeing|escape on foot)\b/i, 'Chase'],
    [/\b(lie to|lies to|lied to|lying to|lie about|lied about|lying about|tell a lie|told a lie|deceive|bluff|believe)\b/i, 'SocialResponse (a statement that might be a lie)'],
    [/\b(shoot|shoots|shooting|a shot at|arrow|arrows|crossbow bolt|aim at)\b/i, SHOT],
    [/\b(tourniquet|stop the bleeding|bleed|bleeding)\b/i, 'BodyTreat (stop_bleeding, training)'],
    [/\b(attracted|interested in|ask (him|her|them) out|go on a date|on a date)\b/i, 'SocialResponse (a brief first meeting)'],
    [/\b(battle|assault on|storm(s|ing)? the|take the (fort|town|hill|bridge|trench|position))\b/i, 'Battle (attackers, defenders, year)']];
// FrameNet 1.7 frames (data/framenet.ts) for what VerbNet's classes leave out: verbs it lacks (befriend, elude, smother,
// bayonet, resuscitate), nouns ("a glance at the window", "a once-over"), and nouns after a light verb ("take a look", "steal
// a glance", "throw a punch"), where the verb is empty and the noun carries the act. A frame names the act; its elements name
// the participants, each tied to the tool's argument (`fe`), so a participant the words leave out is the one to ask for.
// Members are chosen where a frame also holds other acts (Perception_active holds smell and taste; Cause_harm holds poison
// and burn) [ASSUMED selection].
const LOOK = 'Look', HEAR = 'Listen (sounds) or Communicate (speech)', LIE = 'SocialResponse (a statement that might be a lie)';
const PERSUADE = 'SocialResponse (a request, an order or persuasion)', MEETING = 'SocialResponse (a brief first meeting)', BATTLE = 'Battle (attackers, defenders, year)';
const TREAT = 'BodyTreat (stop_bleeding, training)';
const HEAR_LEMMAS = ['hear', 'listen', 'overhear', 'eavesdrop'];
const OTHER_SENSES = ['smell', 'sniff', 'taste', 'savour', 'feel', 'palpate', 'sense', 'experience', 'admire', 'perception', 'attend'];
/** The perception verbs of the senses other than sight (VerbNet files them with seeing under see-30.1, sight-30.2, peer-30.3). */
export const NON_VISUAL = new Set([...HEAR_LEMMAS, 'smell', 'sniff', 'scent', 'scent_out', 'taste', 'savor', 'savour', 'feel', 'palpate', 'sense', 'experience']);
export const FRAME_ROUTES = [
    { frame: 'Perception_active', to: HEAR, only: HEAR_LEMMAS, fe: { Perceiver_agentive: 'listener', Phenomenon: 'sound' } },
    { frame: 'Perception_active', to: LOOK, not: [...HEAR_LEMMAS, ...OTHER_SENSES], fe: { Perceiver_agentive: 'viewer', Phenomenon: 'target' } },
    { frame: 'Perception_experience', to: HEAR, only: HEAR_LEMMAS, fe: { Perceiver_passive: 'listener', Phenomenon: 'sound' } },
    { frame: 'Perception_experience', to: LOOK, not: [...HEAR_LEMMAS, ...OTHER_SENSES], fe: { Perceiver_passive: 'viewer', Phenomenon: 'target' } },
    { frame: 'Punctual_perception', to: LOOK, fe: { Perceiver: 'viewer', Phenomenon: 'target' } },
    { frame: 'Becoming_aware', to: LOOK, only: ['descry', 'detect', 'discern', 'espy', 'notice', 'observe', 'perceive', 'recognize', 'spot', 'spy_out', 'note', 'locate'], fe: { Cognizer: 'viewer', Phenomenon: 'target' } },
    { frame: 'Scrutiny', to: LOOK, not: ['analyse', 'analysis', 'analyst', 'analytic', 'assay', 'check', 'double-check', 'pry', 'inspector', 'surveyor', 'unmonitored', 'probe', 'spy_out_the_land'], fe: { Cognizer: 'viewer', Ground: 'target' } },
    { frame: 'Seeking', to: LOOK, only: ['seek', 'watch', 'manhunt'], fe: { Cognizer_agent: 'viewer', Sought_entity: 'target' } },
    { frame: 'Bringing', to: 'HoldOn', only: ['carry', 'haul', 'lug', 'tote', 'schlep', 'hump', 'bear'], fe: { Agent: 'who', Theme: 'load_kg' } },
    { frame: 'Manipulation', to: 'HoldOn', only: ['clasp', 'clutch', 'grasp', 'grip', 'grab_hold'], fe: { Agent: 'who', Entity: 'hold' } },
    { frame: 'Cotheme', to: 'Chase', only: ['chase', 'pursue', 'pursuit', 'hound', 'dog'], fe: { Theme: 'pursuer', Cotheme: 'fleeing' } },
    // Bolting a door or a meal is no flight: a flight takes no object.
    { frame: 'Fleeing', to: 'Chase', when: (a) => !/^(the|a|an|his|her|their|its|it|this|that|down)$/.test(a[0] ?? '') || a[0] === 'down', fe: { Self_mover: 'fleeing' } },
    { frame: 'Evading', to: 'Chase', not: ['elusive', 'evasive', 'skip_town'], fe: { Evader: 'fleeing', Pursuer: 'pursuer' } },
    { frame: 'Prevarication', to: LIE, not: ['joke', 'kid', 'tell', 'shit', 'bullshit_artist', 'dissembler', 'lie'], fe: { Speaker: 'speaker', Addressee: 'who' } },
    { frame: 'Manipulate_into_doing', to: PERSUADE, not: ['cheat', 'defraud', 'harass'], when: (a, r) => addressee(a, r), fe: { Manipulator: 'speaker', Victim: 'who' } },
    { frame: 'Suasion', to: PERSUADE, when: (a, r) => addressee(a, r), fe: { Speaker: 'speaker', Addressee: 'who' } },
    { frame: 'Attempt_suasion', to: PERSUADE, only: ['beg', 'cajole', 'exhort', 'lobby', 'press', 'pressure', 'prevail', 'urge'], when: (a, r) => addressee(a, r), fe: { Speaker: 'speaker', Addressee: 'who' } },
    { frame: 'Forming_relationships', to: MEETING, only: ['woo', 'befriend'], fe: { Partner_1: 'speaker', Partner_2: 'who' } },
    { frame: 'Personal_relationship', to: MEETING, only: ['court'], fe: { Partner_1: 'speaker', Partner_2: 'who' } },
    { frame: 'Conquering', to: BATTLE, when: (a) => positionAfter(a), fe: { Conqueror: 'attackers', Theme: 'place' } },
    { frame: 'Besieging', to: BATTLE, fe: { Assailant: 'attackers', Victim: 'defenders' } },
    { frame: 'Invading', to: BATTLE, fe: { Invader: 'attackers', Land: 'place' } },
    { frame: 'Attack', to: BATTLE, when: (a) => positionAfter(a), fe: { Assailant: 'attackers', Victim: 'defenders' } },
    { frame: 'Hostile_encounter', to: BATTLE, when: (a) => positionAfter(a), fe: { Sides: 'attackers' } },
    { frame: 'Killing', to: 'BodyChoke', only: ['asphyxiate', 'garrotte', 'smother', 'suffocate'], when: (a, r) => creatureAfter(a, r), fe: { Killer: 'holder', Victim: 'who' } },
    { frame: 'Attack', to: 'BodyStrike', when: (a, r) => creatureAfter(a, r), not: ['bomb', 'bombard', 'bombardment', 'bombing', 'airstrike', 'saf', 'safire', 'small_arms_fire', 'drive-by', 'incursion', 'infiltrate', 'infiltration', 'offensive', 'onset', 'fire'], fe: { Assailant: 'attacker', Victim: 'who' } },
    { frame: 'Hostile_encounter', to: 'BodyStrike', when: (a, r) => creatureAfter(a, r), only: ['fight', 'brawl', 'scuffle', 'tussle', 'duel', 'struggle', 'fistfight', 'clash'], fe: { Side_1: 'attacker', Side_2: 'who' } },
    { frame: 'Killing', to: 'BodyStrike', when: (a, r) => creatureAfter(a, r), not: ['asphyxiate', 'garrotte', 'smother', 'suffocate', 'drown', 'starve', 'destroy', 'silence', 'eliminate', 'euthanize', 'euthanasia', 'suicide', 'terminate', 'deadly', 'fatal', 'lethal'], fe: { Killer: 'attacker', Victim: 'who' } },
    { frame: 'Cause_harm', to: 'BodyStrike', when: (a, r) => creatureAfter(a, r), not: ['boil', 'burn', 'drug', 'electrocute', 'electrocution', 'poison', 'poisoning', 'torture', 'fracture', 'break', 'crush', 'squash', 'bruise', 'twist', 'sting', 'welt'], fe: { Agent: 'attacker', Victim: 'who', Body_part: 'part', Instrument: 'weapon' } },
    { frame: 'Hit_target', to: SHOT, fe: { Agent: 'attacker', Target: 'who' } },
    { frame: 'Use_firearm', to: SHOT, fe: { Agent: 'attacker', Goal: 'who' } },
    { frame: 'Shoot_projectiles', to: SHOT, not: ['launch'], fe: { Agent: 'attacker', Goal: 'who' } },
    { frame: 'Cure', to: TREAT, only: ['cure', 'heal', 'nurse', 'treat', 'remedy', 'resuscitate', 'treatment'], when: (a, r) => WOUND.test(a.slice(0, 5).join(' ')) || creatureAfter(a, r), fe: { Healer: 'who', Patient: 'patient', Affliction: 'wound' } },
];
// FrameNet's lemmas as the words are read: a particle in brackets joins with "_" ("go [through]" → go_through), spaces too.
const fnKey = (name) => name.replace(/[[\]()]/g, '').trim().replace(/\s+/g, '_').toLowerCase();
const FN = {};
for (const [name, frames] of Object.entries(FRAMENET)) {
    const k = fnKey(name);
    (FN[k] ??= []).push(...frames);
}
const FN_VERBS = new Set(Object.keys(FN).filter(k => k.endsWith('.v')).map(k => k.slice(0, -2)));
// The verbs read as a task's own: VerbNet's, the routes' named ones, FrameNet's.
export const KNOWN_VERBS = new Set([...ROUTE_VERBS, ...FN_VERBS, 'headbutt']);
const fnVerbsTo = (to) => [...FN_VERBS].filter(v => (FN[`${v}.v`] ?? []).some(f => FRAME_ROUTES.some(r => r.frame === f && r.to === to && (!r.only || r.only.includes(v)) && !r.not?.includes(v))));
/** Verbs of looking and searching, and of blows (the routes' sets, VerbNet's and FrameNet's), for reading a player's own line
 * (frame.ts) and the target questions (ask.ts). */
export const LOOK_VERBS = new Set([...SIGHT_VERBS, ...SEARCH_VERBS, ...fnVerbsTo(LOOK)]);
export const BLOW_VERBS = new Set([...TASK_ROUTES.find(r => r.to === 'BodyStrike').verbs, ...fnVerbsTo('BodyStrike')]);
/** A frame's elements, its participants as FrameNet names them, with their standing (Core, Peripheral, Extra-Thematic); each
 * route's `fe` maps them onto the tool's arguments. */
export const frameElements = (frame) => FRAME_FES[frame] ?? {};
/** The tool a FrameNet lexical unit's frames name, for the words after it; null when none. */
export function frameRoute(lemma, pos, after, raw) {
    for (const frame of FN[`${lemma}.${pos}`] ?? [])
        for (const r of FRAME_ROUTES) {
            if (r.frame !== frame || (r.only && !r.only.includes(lemma)) || r.not?.includes(lemma))
                continue;
            if (!r.when || r.when(after, raw))
                return r.to;
        }
    return null;
}
// Nouns after a light verb that FrameNet holds in no routed frame: the blows and the aim of a shot ("throw a punch", "take a
// swing at", "take aim") [ASSUMED list].
const LIGHT_NOUNS = { punch: 'BodyStrike', kick: 'BodyStrike', blow: 'BodyStrike', swing: 'BodyStrike', jab: 'BodyStrike', swipe: 'BodyStrike', aim: SHOT };
const LIGHT = new Set(['take', 'have', 'give', 'cast', 'steal', 'shoot', 'throw', 'make', 'do', 'launch', 'mount', 'sneak', 'get', 'grab', 'land', 'deal', 'aim']);
/** The act a noun names in the first words ("a quick glance at the window", "a punch at the guard"), or null. */
function nounRoute(words, raw) {
    for (let i = 0; i < Math.min(words.length, 5); i++) {
        const w = words[i], n = w.replace(/s$/, ''), rest = words.slice(i + 1);
        // A hyphened noun is read whole ("once-over": the words split at the hyphen).
        const hy = words[i + 1] && raw.toLowerCase().includes(`${w}-${words[i + 1]}`) ? `${w}-${words[i + 1]}` : null;
        // A noun of measure before of and a thing heads a measure of goods, no act ("take a shot of whiskey": CGEL ch. 5 §3.3, the
        // quantificational construction; grammar.ts measureOfGoods).
        if (rest[0] === 'of' && measureOfGoods(`a ${w} ${rest.slice(0, 2).join(' ')}`))
            continue;
        const f = (hy ? frameRoute(hy, 'n', words.slice(i + 2), raw) : null) ?? frameRoute(w, 'n', rest, raw) ?? (w !== n ? frameRoute(n, 'n', rest, raw) : null);
        if (f)
            return { to: f, by: hy ?? w };
        const l = LIGHT_NOUNS[w] ?? LIGHT_NOUNS[n];
        if (l && (l !== 'BodyStrike' || creatureAfter(rest, raw)))
            return { to: l, by: w };
        if (/^[,.;:!?]$/.test(w))
            break;
    }
    return null;
}
/** Whether a verb is one of climbing (FrameNet Self_motion's climb, clamber, scramble, shin, scale), BodyCheck's own. */
export const climbing = (v) => (FN[`${v}.v`] ?? []).includes('Self_motion');
/** The tools a route names, outside its brackets: a shot is BodyStrike's or, for a handgun, BodyCheck's (SHOT), so it names
 *  both. */
export const toolsNamed = (to) => to.replace(/\([^)]*\)/g, '').match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g) ?? [];
export const SHOT_TOOLS = toolsNamed(SHOT);
/** For the router (a player's line): the tools a light verb's noun names ("take a look", "take a shot at"), or a verb VerbNet
 *  lacks names by its FrameNet frame ("befriend", "elude", "fire"); the tools' names only. */
export function lightNounTools(verb, after, raw) {
    const r = LIGHT.has(verb) ? nounRoute(after, raw) : null;
    return r ? toolsNamed(r.to) : null;
}
export function frameTools(verb, after, raw) {
    const to = frameRoute(verb, 'v', after, raw);
    return to ? toolsNamed(to) : null;
}
export const isKnownVerb = (v) => KNOWN_VERBS.has(v);
/** The tool that decides a task, from the task's own verb by its present-day meaning (TASK_ROUTES, from VerbNet), from the
 * noun a light verb carries ("take a look"), from the verb's FrameNet frame when VerbNet's classes name none, else, when the
 * task has no verb read, from a noun of a routed frame, then from words that name another tool's question (PHRASES); null
 * for BodyCheck. */
export function taskRoute(text) {
    const head = verbsAt(text, KNOWN_VERBS).find(x => !BEFORE.has(x.verb) && !BEFORE.has(x.word));
    if (head && LIGHT.has(head.verb)) {
        const n = nounRoute(head.after, text);
        if (n)
            return n;
    }
    if (head)
        for (const r of TASK_ROUTES)
            if (r.verbs.includes(head.verb) && (!r.when || r.when(head.after, text)))
                return { to: r.to, by: head.word };
    // A task whose own verb was read (one of BodyCheck's, or a route's verb in another sense: "hang the lantern", "shoot the
    // rapids") is BodyCheck's: words further on do not override it.
    if (head && (OWN.has(head.verb) || climbing(head.verb) || ROUTE_VERBS.has(head.verb)))
        return null;
    if (head) {
        const f = frameRoute(head.verb, 'v', head.after, text);
        if (f)
            return { to: f, by: head.word };
    }
    if (!head) {
        const n = nounRoute((text.toLowerCase().match(/[a-z']+|[,.;:!?]/g) ?? []), text);
        if (n)
            return n;
    }
    const p = PHRASES.find(([re]) => re.test(text));
    return p ? { to: p[1], by: p[0].exec(text)[0] } : null;
}
// What a BodyCheck task is, named by the caller from a closed list (BodyCheck `task_kind`): its own kind (a skill or effort of
// the body) or one of the routes' questions. The list is reshuffled before every generation, as the share bands are (Zheng et
// al. 2024: models pick options by position). Read against the task's verb (taskRoute): a named route goes to its tool, and a
// task named BodyCheck's own whose verb reads as another tool's is refused with both readings.
export const OWN_KIND = 'a skill or effort of the body (climbing, lifting, balancing, sneaking, a lock, a craft or a trade)';
export const KIND_TOOL = {
    'hearing a sound or words': 'Listen (sounds) or Communicate (speech)',
    'seeing or searching for something or someone': 'Look',
    'swimming or staying afloat': 'BodyEnvironment (immersed, swimming, swimmer)',
    'hanging on or carrying a load by hand': 'HoldOn',
    'catching or getting away from someone on foot': 'Chase',
    'getting someone to believe, agree, give in or take a liking': 'SocialResponse',
    'armed groups attacking a defended position': 'Battle (attackers, defenders, year)',
    'a choke or strangling hold on the neck': 'BodyChoke',
    'a blow or a shot at someone': SHOT,
    'treating a wound or an injury': 'BodyTreat (stop_bleeding, training)',
};
export const TASK_KINDS = [OWN_KIND, ...Object.keys(KIND_TOOL)];
const toolOf = (label) => label.split(' ')[0];
/** The refusal for a task by its kind and its verb, or null when BodyCheck decides it. */
export function kindRoute(task, kind, override) {
    const byVerb = override ? null : taskRoute(task);
    const named = kind && kind !== OWN_KIND ? KIND_TOOL[kind] : undefined;
    if (named && byVerb && toolOf(byVerb.to) !== toolOf(named))
        return `${task}: you named it ${kind} (${toolOf(named)}), and its verb "${byVerb.by}" reads as ${toolOf(byVerb.to)}. Call the tool the task is for; for a task that is BodyCheck's after all, call BodyCheck again with task_kind "${OWN_KIND}" and override: true.`;
    if (named)
        return `${task}: decided by ${named}; call that tool (you named it ${kind}).`;
    if (byVerb)
        return `${task}: decided by ${byVerb.to}; call that tool (its verb "${byVerb.by}" reads as that, though named ${kind ? 'a skill or effort of the body' : 'nothing'}). For a task that is BodyCheck's after all, call BodyCheck again with override: true.`;
    return null;
}
