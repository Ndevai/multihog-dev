// Tools the scene's words call for beside the verbs' (docs/df-body-engine.md §7.3, 2026-10-27 (109)). The router reads the
// player's verbs; when it routes, the planner is shown only those tools in full (question-pass.ts), while the picker it
// replaces reads the last messages too and is told to include a tool when unsure (PICK_SYSTEM). So the words of the line and
// of the two messages before it add the tools whose inputs they name: a sound (Listen), a riddle (WorkOut), a name
// (NameCharacter), a disease or a symptom (Disease), fire, smoke, weather, cold, heat, a desert or an altitude
// (BodyEnvironment), a boat or an operation (Sickness), a hot pot or stove the line touches (BodyContact), a feeling (Appraise),
// someone keeping watch or gravel underfoot while the line moves (Listen, Look), someone giving chase while the line runs
// (Chase). Each cue only offers a tool; the planner reads the scene and calls it or not. The nouns come from WordNet
// (data/cue-words.ts).
import { CUE_WORDS } from './data/cue-words.js';
import { RUN_VERBS } from './data/activity-verbs.js';
import { VERBNET } from './data/verbnet.js';
import { lemmas } from './verbs.js';
import { kindsOf } from './senses.js';
const SETS = Object.fromEntries(Object.entries(CUE_WORDS).map(([k, v]) => [k, new Set(v.split(' '))]));
const tokens = (t) => t.toLowerCase().replace(/[’]/g, "'").match(/[a-z'-]+/g) ?? [];
// A noun's forms: its plural and its possessive ("footsteps", "the guard's").
const forms = (w) => [w, w.replace(/'s$/, ''), w.replace(/ies$/, 'y'), w.replace(/(?:ches|shes|sses|xes)$/, m => m.slice(0, -2)), w.replace(/s$/, '')];
// A word stands where a verb does right after a subject pronoun ("I stab Tom") or right before a determiner or an object
// pronoun ("a hunter fires his rifle"), and as a measure before "of" ("a pat of butter"); none of those is the noun.
const VERB_NEXT = /^(?:the|a|an|his|her|my|their|our|your|its|this|that|him|them|me|us|of)$/;
const SUBJECT = /^(?:i|we|you|he|she|they)$/;
const found = (set, words) => words.find((w, i) => forms(w).some(f => set.has(f)) && !VERB_NEXT.test(words[i + 1] ?? '') && !SUBJECT.test(words[i - 1] ?? '')
    // Fire opened, returned, ceased, held or come under is shooting (FrameNet fire.n, Shoot_projectiles), no burning.
    && !(/^fires?$/.test(w) && /^(?:open|opens|opened|opening|return|returns|returned|returning|cease|ceased|hold|held|under|cross)$/.test(words[i - 1] ?? ''))
    // "Cold" is the illness only as "a cold", "head cold" or a cold caught.
    && !(set === SETS.Disease && w === 'cold' && !/^(?:a|head|catch|catches|caught)$/.test(words[i - 1] ?? ''))
    // A sound word with a sense of a solid thing names the thing ("give Mara a ring"), save a bell.
    && !(set === SETS.Listen && /s/.test(kindsOf(w)?.all ?? '') && !/bell$/.test(w)));
const verbIn = (words, re) => words.find(w => lemmas(w).some(v => VERBNET[v]?.some(c => re.test(c))));
// Altitude sickness begins above 2,500 m (Hackett & Roach 2001, NEJM 345:107, "High-altitude illness"): a height from 2,500 m
// (8,200 ft) in a sentence that names a height is an altitude the body feels.
const HIGH_M = 2500, HIGH_FT = 8200;
const altitude = (t) => t.split(/(?<=[.!?;])\s+/).some(s => /\b(?:altitude|above sea level|high|summit|peak|camp|pass|elevation|mountain|plateau)\b/i.test(s)
    && [...s.matchAll(/\b(\d{1,2}(?:[,.]\d{3}|\d{3}))\s*(m|metres|meters|ft|feet)\b/gi)].some(m => Number(m[1].replace(/[,.]/g, '')) >= (/^f/i.test(m[2]) ? HIGH_FT : HIGH_M)));
const TEMPERATURE = /-?\b\d+(?:\.\d+)?\s*°\s*[CF]\b|\b-?\d+\s*degrees\b/i;
// Going into the water: a capsized or sinking boat, someone overboard or in the water.
const IMMERSION = /\b(?:capsiz(?:e|es|ed|ing)|overboard|(?:in|into|under) the (?:icy |cold |freezing |dark )?(?:water|waves|sea|lake|river)|sinking|sank|sunk)\b/i;
// Heat a hand can touch: a hot word, a fire, embers or coals, a stove or an oven, something boiling.
const HEAT = /\b(?:fire|flames?|embers|coals|forge|boiling|red-hot|white-hot|on the stove|in the oven)\b/i;
// Touch: VerbNet's touch-20 (touch, stroke, pat, kiss), hold-15.1 (grab, grip, clutch, hold), obtain-13.5.2 (seize, grab) and
// push-12 (press), and picking something up.
const TOUCH = /^(?:touch-20|hold-15\.1|obtain-13\.5\.2|push-12)/;
// Someone after the runner [ASSUMED cues]: VerbNet's chase-51.6 (chase, follow, pursue, tail, track, trail), or someone who has
// spotted them or raised a shout.
const PURSUIT = /\b(?:spots?|spotted|shouts?|shouted|yells?|yelled|after (?:her|him|them|you|me)|gives? chase|raises? the alarm)\b/i;
// Running: a verb whose first WordNet sense is moving very fast or hurriedly, or fleeing (data/activity-verbs.ts RUN_VERBS).
const RUN = new Set(RUN_VERBS.split(' '));
const runs = (words) => words.some(w => lemmas(w).some(v => RUN.has(v)));
/** Whether a word names a disease or a symptom (data/cue-words.ts). */
export const diseaseWord = (w) => forms(w).some(f => SETS.Disease.has(f)) || /^fevers?$/.test(w);
/** The tools the line's and the scene's words call for, each with the word that did, beyond the tools already routed. */
// A word capitalised inside a sentence is a name ("Flame Lash (Fire, complexity 3)": a school of magic), no cue.
const named = (t) => new Set([...t.replace(/[’]/g, "'").matchAll(/(?<![.!?]\s*|^\s*|["“]\s*)\b([A-Z][a-z'-]+)/g)].map(m => m[1].toLowerCase()));
export function cueTools(line, recent, routed) {
    const names = new Set([...named(line), ...recent.flatMap(r => [...named(r)])]);
    const keep = (ws) => ws.filter(w => !names.has(w));
    const own = keep(tokens(line)), scene = keep(recent.flatMap(tokens)), all = [...own, ...scene], text = [line, ...recent].join(' ');
    const out = {};
    const add = (tool, why) => { if (!routed.includes(tool))
        out[tool] ??= why; };
    const moving = routed.some(t => t === 'Act' || t === 'Chase' || t === 'BodyCheck');
    const w = (set, words = all) => found(SETS[set], words);
    // A sound named in the scene (Listen: "a sound (footsteps, a voice, hoofbeats, a bell)").
    const sound = w('Listen');
    if (sound)
        add('Listen', sound);
    // Someone on watch, or gravel or sand underfoot (Listen's "footsteps on gravel or sand"), while the line moves.
    // The watcher is in the scene's messages, or the line moves past, by or near them ("sneak past the guard"; "hit the guard"
    // makes him the target, no watcher).
    const near = own.flatMap((x, i) => /^(?:past|by|behind|near|around|beside|toward|towards)$/.test(own[i - 1] ?? '') || /^(?:past|by|behind|near|around|beside|toward|towards)$/.test(own[i - 2] ?? '') ? [x] : []);
    const watch = w('listener', [...scene, ...near]);
    if (moving && watch) {
        add('Listen', `${watch} keeps watch`);
        add('Look', `${watch} keeps watch`);
    }
    if (moving && /\b(?:gravel|sand|shingle)\b/i.test(text))
        add('Listen', 'footsteps on gravel or sand');
    const riddle = w('WorkOut');
    if (riddle)
        add('WorkOut', riddle);
    const name = w('NameCharacter', own);
    if (name)
        add('NameCharacter', name);
    const disease = w('Disease');
    if (disease)
        add('Disease', disease);
    const feeling = w('Appraise', own);
    if (feeling)
        add('Appraise', feeling);
    // A hot thing the line touches (BodyContact: "a stove, a pot handle, spilled hot water or oil"); its heat is then the
    // thing's, not the air's.
    // The thing is a stove, an oven or a pot heated in the scene, or the line calls it hot ("I grab the hot handle").
    const pot = w('BodyContact'), heat = w('hot') ?? (HEAT.test(text) ? 'fire' : undefined);
    const touched = (pot ? heat || pot === 'stove' || pot === 'oven' : !!w('hot', own)) && (verbIn(own, TOUCH) || /\bpick(?:s|ed|ing)? up\b/i.test(line));
    if (touched)
        add('BodyContact', pot ?? heat);
    const env = (touched ? found(new Set([...SETS.BodyEnvironment].filter(x => !/^(?:fire|bonfire|campfire)$/.test(x))), all) : w('BodyEnvironment')) ?? w('cold') ?? (touched ? undefined : w('hot'));
    if (env)
        add('BodyEnvironment', env);
    else if (TEMPERATURE.test(text))
        add('BodyEnvironment', 'a temperature');
    else if (altitude(text))
        add('BodyEnvironment', 'an altitude');
    else if (IMMERSION.test(text))
        add('BodyEnvironment', 'in the water');
    const sick = w('Sickness');
    if (sick)
        add('Sickness', sick);
    // Someone after the runner (Chase decides whether they catch up).
    if (runs(own) && (PURSUIT.test(recent.join(' ')) || verbIn(scene, /^chase-51\.6/)))
        add('Chase', 'someone after them');
    return out;
}
