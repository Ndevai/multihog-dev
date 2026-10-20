// Which tools a turn needs, read by code from the player's message (docs/progress.md entries 36, 39). The verbs come from
// VerbNet 3.4 (data/verbnet.ts: 4,580 verbs in 331 classes grouped by meaning and argument structure, after Levin 1993);
// each class is tied to the tool its outcome needs (CLASS_TOOL). A few tools turn on a property VerbNet's classes leave
// open (hearing apart from seeing, a price, physical effort, a fall), so those take named verbs (VERB_TOOL) [ASSUMED lists].
// The model's tool picker is asked only when no verb maps to a tool.
import { stepsFromWords } from './actions.js';
import { VERBNET } from './data/verbnet.js';

/** VerbNet class (file name without its number) → the tools its verbs need. */
const CLASS_TOOL: Record<string, string[]> = {
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
    steal: ['Transfer'], rob: ['Transfer'], cheat: ['Transfer'], send: ['Transfer'],
    // Contact by impact (18), attacks and killing (36.4, 42, 60.1), cutting and poking (19, 21.1), throwing at (17.2).
    hit: ['BodyStrike'], swat: ['BodyStrike'], spank: ['BodyStrike'], attack: ['BodyStrike'], battle: ['BodyStrike'], murder: ['BodyStrike'],
    subjugate: ['BodyStrike'], poke: ['BodyStrike'], cut: ['BodyStrike'], pelt: ['BodyStrike'],
    poison: ['Substance'],
    // Ingesting (39).
    eat: ['BodyIntake'], chew: ['BodyIntake'], gobble: ['BodyIntake'], devour: ['BodyIntake'], dine: ['BodyIntake'], gorge: ['BodyIntake'], feeding: ['BodyIntake'],
    // Time (53, 56, 104) and sleep (40.4).
    linger: ['PassTime'], spend_time: ['PassTime'], snooze: ['PassTime'], weekend: ['PassTime'], delay: ['PassTime'],
    // Motion (51), posture (50), carrying and putting (11, 9.1).
    escape: ['Act'], leave: ['Act'], roll: ['Act'], run: ['Act'], nonvehicle: ['Act'], waltz: ['Act'], accompany: ['Act'], reach: ['Act'],
    rotate: ['Act'], assuming_position: ['Act'], bring: ['Act', 'Transfer'], carry: ['Act'], put: ['Act'], body_motion: ['Act'],
    chase: ['Chase', 'Act'],
    // Holding (15.1, 22.5), breaking (44, 45.1, 23.2), curing (45.7).
    hold: ['HoldOn'], cling: ['HoldOn'], break: ['Break'], destroy: ['Break'], split: ['Break'], remedy: ['BodyTreat'],
    weather: ['Weather'],
};
/** Tools that turn on a property VerbNet's classes leave open: hearing (peer-30.3 holds listen with look), a price (get-13.5.1
 *  holds buy with take), effort, a fall, flight, care of a wound [ASSUMED lists]. */
const VERB_TOOL: Record<string, string[]> = {
    hear: ['Listen'], listen: ['Listen'], overhear: ['Listen'], eavesdrop: ['Listen'],
    buy: ['Price'], purchase: ['Price'], sell: ['Price'], rent: ['Price'], lease: ['Price'], haggle: ['Price', 'SocialResponse'], bargain: ['Price', 'SocialResponse'],
    ask: ['SocialResponse'], request: ['SocialResponse'], persuade: ['SocialResponse'], convince: ['SocialResponse'], offer: ['SocialResponse'],
    demand: ['SocialResponse'], threaten: ['SocialResponse'], flirt: ['SocialResponse'], bribe: ['SocialResponse'], invite: ['SocialResponse'],
    climb: ['BodyCheck'], jump: ['BodyCheck'], leap: ['BodyCheck'], vault: ['BodyCheck'], scale: ['BodyCheck'], swim: ['BodyCheck'], lift: ['BodyCheck'],
    heave: ['BodyCheck'], force: ['BodyCheck'], pry: ['BodyCheck'], squeeze: ['BodyCheck'], throw: ['BodyCheck'], balance: ['BodyCheck'], push: ['BodyCheck'],
    fall: ['BodyFall'], drop: ['BodyFall'], tumble: ['BodyFall'], trip: ['BodyFall'], stumble: ['BodyFall'], slip: ['BodyFall'],
    flee: ['Chase'], pursue: ['Chase'], run_after: ['Chase'], go_after: ['Chase'], chase_after: ['Chase'],
    bandage: ['BodyTreat'], treat: ['BodyTreat'], stitch: ['BodyTreat'], splint: ['BodyTreat'], tend: ['BodyTreat'], nurse: ['BodyTreat'],
    wait: ['PassTime'], sleep: ['PassTime'], rest: ['PassTime'], stay: ['PassTime'],
    drink: ['BodyIntake'], sip: ['BodyIntake'], swallow: ['BodyIntake'],
    kick: ['BodyStrike', 'Break'], smash: ['Break'], shatter: ['Break'],
    hand: ['Transfer'], take: ['Transfer'], pocket: ['Transfer'], lend: ['Transfer'], borrow: ['Transfer'],
};
const ALWAYS = ['RecordFact', 'PassTime', 'NewCharacter'];

// Irregular past and participle forms back to the verb (the ones VerbNet's members need most).
const IRREGULAR: Record<string, string> = Object.fromEntries(([
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
] as [string, string][]).flatMap(([v, f]) => f.split(' ').map(x => [x, v])));
/** The verbs a word may be: itself, an irregular form's verb, then its regular endings stripped. */
function lemmas(w: string): string[] {
    const out = [w];
    if (IRREGULAR[w]) out.push(IRREGULAR[w]);
    const add = (x: string) => { if (x.length > 1) out.push(x); };
    if (/ie[sd]$/.test(w)) add(w.slice(0, -3) + 'y');
    if (/es$/.test(w)) add(w.slice(0, -2));
    if (/s$/.test(w)) add(w.slice(0, -1));
    if (/ed$/.test(w)) { add(w.slice(0, -2)); add(w.slice(0, -1)); if (/(.)\1ed$/.test(w)) add(w.slice(0, -3)); }
    if (/ing$/.test(w)) { add(w.slice(0, -3)); add(w.slice(0, -3) + 'e'); if (/(.)\1ing$/.test(w)) add(w.slice(0, -4)); }
    return out;
}
// A word is read as a verb where a player's line puts one: after a subject, an auxiliary, "to", "and", "then", a comma, or
// at the start (an order); one adverb may come between ("I quietly listen").
const BEFORE = new Set(['i', 'we', 'you', 'he', 'she', 'they', 'it', 'and', 'then', 'to', 'or', 'but', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
    'will', 'would', 'can', 'could', 'must', 'may', 'might', 'shall', 'should', 'do', 'does', 'did', "don't", "i'll", "i'm", "we'll", 'try', 'tries', 'tried',
    'also', 'just', 'still', 'again', 'quickly', 'slowly', 'quietly', 'carefully', 'men', 'women', 'people']);
const TOP = (cls: string) => cls.replace(/-[\d.]+$/, '');

export interface Route { tools: string[]; why: Record<string, string> }
/** The tools the player's message asks for, each with the verb that asked; empty when no verb maps to a tool. */
export function routeTurn(text: string, names: string[] = []): Route {
    const why: Record<string, string> = {};
    const subjects = new Set(names.map(n => n.toLowerCase()));
    const words = text.replace(/["“][^"”]*["”]/g, ' , ').toLowerCase().match(/[a-z']+|[,.;:!?]/g) ?? [];
    for (let i = 0; i < words.length; i++) {
        const w = words[i], prev = words[i - 1], prev2 = words[i - 2];
        const verbSpot = i === 0 || /^[,.;:!?]$/.test(prev) || BEFORE.has(prev) || subjects.has(prev) || (/ly$/.test(prev) && (BEFORE.has(prev2) || subjects.has(prev2)));
        if (!verbSpot) continue;
        for (const v of lemmas(w)) {
            const classes = [...VERBNET[`${v}_${words[i + 1] ?? ''}`] ?? [], ...VERBNET[v] ?? []];
            const tools = [...VERB_TOOL[`${v}_${words[i + 1] ?? ''}`] ?? [], ...VERB_TOOL[v] ?? [], ...classes.flatMap(c => CLASS_TOOL[TOP(c)] ?? [])];
            for (const t of tools) why[t] ??= w;
            if (classes.length || VERB_TOOL[v]) break;
        }
    }
    // A measure of goods asked for has a price ("call for a pint of ale", "a pound of apples") [ASSUMED measures].
    if (!why.Price && /\b(?:a|an|one|two|three|some|half a) (?:pint|pound|loaf|cup|glass|bottle|dozen|quart|gill|plate|bowl|bed|room|ounce|yard)s? of\b/i.test(text)) why.Price = 'a measure of goods';
    // Speech in quotes is a message.
    if (!why.Communicate && /["“][^"”]{2,}["”]/.test(text)) why.Communicate = 'quoted words';
    // A motion the action reader recognizes is an Act; a walk whose distance the words leave out still is (the scene gives it).
    if (!why.Act && movesIn(text)) why.Act = 'motion';
    if (why.Communicate) why.Interpret = 'with Communicate';
    return { tools: Object.keys(why), why };
}
/** Whether the action reader finds a motion in the words. */
export function movesIn(text: string): boolean {
    const r = stepsFromWords(text, 'x');
    return 'steps' in r || /needs distance_m/.test(r.error);
}
/** The tool set offered to the planner: the routed tools and the ones every turn may need, or null to ask the model. */
export function routedTools(text: string, has: (name: string) => boolean, names: string[] = []): Set<string> | null {
    const r = routeTurn(text, names).tools.filter(has);
    return r.length ? new Set([...r, ...ALWAYS.filter(has)]) : null;
}
