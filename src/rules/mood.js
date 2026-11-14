// How people feel while doing an activity (docs/df-body-engine.md §6.13): mean ratings 0–6 of positive affect, negative
// affect, competence, impatience and tiredness over the episodes of a day, and hours a day spent on each, from the Day
// Reconstruction Method's 909 employed women in Texas (Kahneman, Krueger, Schkade, Schwarz & Stone 2004, Science 306:1776,
// Table 1, as reproduced in the uploaded slides). The activity named in BodyEnvironment is matched to its row by words
// [ASSUMED matching]; the row is shown with the body as what people typically feel at it, a baseline the narrator can play
// against. Duration-weighted day mean: positive 3.89, negative 0.84, competent 4.31, impatient 2.09, tired 2.90.
import { verbsAt, BEFORE } from './verbs.js';
export const DRM = [
    ['intimate relations', /\b(sex|intimate|making love|love-?making)\b/i, [5.10, 0.36, 4.57, 0.74, 3.09]],
    ['socializing', /\b(socializ|socialis|party|visit|chat|gossip|tavern|pub|dance|feast)\w*/i, [4.59, 0.57, 4.32, 1.20, 2.33]],
    ['relaxing', /\b(relax\w*|rest|resting|lounging|lounge|nap|napping)\b/i, [4.42, 0.51, 4.05, 0.84, 3.44]],
    ['praying, worship or meditation', /\b(pray|worship|church|mass|meditat|vespers|matins)\w*/i, [4.35, 0.59, 4.45, 1.04, 2.95]],
    ['preparing food', /\b(cook|baking|bake|prepar\w* food|kitchen)\w*/i, [3.93, 0.69, 4.20, 1.54, 3.11]],
    ['eating', /\b(eat|meal|dinner|supper|lunch|breakfast|dine|dining)\w*/i, [4.34, 0.59, 4.12, 0.95, 2.55]],
    ['exercising', /\b(exercis|sport|gym|jog|training|swimming|calisthenics)\w*/i, [4.31, 0.50, 4.26, 1.58, 2.42]],
    ['watching TV', /\b(tv|television)\b/i, [4.19, 0.58, 3.95, 1.02, 3.54]],
    ['shopping', /\b(shop|market|buying|errand)\w*/i, [3.95, 0.74, 4.26, 2.08, 2.66]],
    ['on the phone', /\b(phone|telephone|phoning)\b/i, [3.92, 0.85, 4.35, 1.92, 2.92]],
    ['caring for children', /\b(child|children|baby|infant|kids?)\b/i, [3.86, 0.91, 4.19, 1.95, 3.56]],
    ['computer, e-mail, internet', /\b(computer|e-?mail|internet|online)\w*/i, [3.81, 0.80, 4.57, 1.93, 2.62]],
    ['housework', /\b(housework|clean|wash|laundry|sweep|scrub|chores?)\w*/i, [3.73, 0.77, 4.23, 2.11, 3.40]],
    ['commuting', /\b(commut|driving to work|travel(l)?ing to work)\w*/i, [3.45, 0.89, 4.09, 2.60, 2.75]],
    ['working', /\b(work|job|office|labou?r|shift|trade|desk)\w*/i, [3.62, 0.97, 4.45, 2.70, 2.42]],
];
// When no word above names the activity, its verb's VerbNet class does (verbs.ts): eating (eat-39.1, chew-39.2, gobble-39.3,
// devour-39.4, dine-39.5, gorge-39.6: "devouring a stew", "munching bread"), preparing food (cooking-45.3: frying, roasting),
// housework (wipe_manner-10.4.1, wipe_instr-10.4.2: scrubbing, mopping, dusting), socializing (chit_chat-37.6, meet-36.3:
// conversing, visiting), relaxing (snooze-40.4: dozing) [ASSUMED mapping].
const DRM_CLASS = [[/^(eat-39\.1|chew-39\.2|gobble-39\.3|devour-39\.4|dine-39\.5|gorge-39\.6)/, 'eating'], [/^cooking-45\.3/, 'preparing food'],
    [/^(wipe_manner-10\.4\.1|wipe_instr-10\.4\.2)/, 'housework'], [/^(chit_chat-37\.6|meet-36\.3)/, 'socializing'], [/^snooze-40\.4/, 'relaxing']];
/** The DRM row for an activity named in words, or null. */
export function drmRow(activity) {
    const t = String(activity ?? '');
    const r = DRM.find(([, re]) => re.test(t));
    if (r)
        return { label: r[0], v: r[2] };
    const head = verbsAt(t).find(x => !BEFORE.has(x.verb));
    const label = head && DRM_CLASS.find(([re]) => head.classes.some(c => re.test(c)))?.[1];
    const row = label ? DRM.find(([l]) => l === label) : null;
    return row ? { label: row[0], v: row[2] } : null;
}
export const drmLine = (who, r) => `${who}'s activity (${r.label}): people at it typically feel, 0–6, positive ${r.v[0]}, negative ${r.v[1]}, impatient ${r.v[3]}, tired ${r.v[4]}`;
