// Emotion type from the appraisal of what happened (docs/df-body-engine.md §6.13): the 22 emotion types of Ortony, Clore &
// Collins 1988, The Cognitive Structure of Emotions (the OCC model), each with its type specification, the words that
// name it (tokens) and what makes it stronger (variables affecting intensity), from the book's type definitions.
export const ABOUT = ['an event that affects them', 'an event that affects someone else', 'the prospect of an event',
    'a hoped-for or feared event that came true or did not', 'their own action', "someone else's action", 'a person or thing they encounter'];

const T = (words: string, stronger: string) => ({ words, stronger });
export const TYPES: Record<string, { words: string; stronger: string }> = {
    joy: T('glad, happy, pleased, cheerful, delighted, elated, joyful', 'the more desirable the event'),
    distress: T('upset, unhappy, sad, miserable, distressed, grief, shock', 'the more undesirable the event'),
    'happy-for': T('happy for, pleased for, delighted for', 'the better it is for them and the more they deserved it'),
    'sorry-for': T('pity, sympathy, compassion, sorry for', 'the worse it is for them and the less they deserved it'),
    resentment: T('envy, jealousy, resentment', 'the better it is for them and the less they deserved it'),
    gloating: T('gloating, Schadenfreude', 'the worse it is for them and the more they deserved it'),
    hope: T('hopeful, anticipation, excitement, looking forward to', 'the more desirable and the more likely the event'),
    fear: T('worried, nervous, anxious, scared, dread, terrified', 'the more undesirable and the more likely the event'),
    satisfaction: T('satisfaction, hopes realized', 'the stronger the hope and the more effort spent to reach it'),
    'fears-confirmed': T('fears confirmed, worst fears realized', 'the stronger the fear and the more effort spent to prevent it'),
    relief: T('relief', 'the stronger the fear and the more effort spent to prevent it'),
    disappointment: T('disappointment, frustration, dashed hopes, despair, heartbroken', 'the stronger the hope and the more effort spent to reach it'),
    pride: T('pride', 'the more praiseworthy and the less expected of them'),
    'self-reproach': T('embarrassment, guilt, shame, self-blame', 'the more blameworthy and the less expected of them'),
    appreciation: T('admiration, respect, esteem, awe', 'the more praiseworthy and the less expected'),
    reproach: T('reproach, disdain, contempt, indignation', 'the more blameworthy and the less expected'),
    gratitude: T('gratitude, thankful, indebted', 'the more praiseworthy the act and the more desirable its result for them'),
    anger: T('annoyance, irritation, anger, indignation, outrage, fury, rage', 'the more blameworthy the act and the worse its result for them'),
    gratification: T('pleased with oneself, self-satisfaction, smug', 'the more praiseworthy the act and the better its result'),
    remorse: T('remorse, penitent, self-anger', 'the more blameworthy the act and the worse its result'),
    liking: T('like, affection, attracted to, love, adore', 'the more appealing and the more familiar'),
    disliking: T('dislike, aversion, disgust, revulsion, hate, loathe', 'the more unappealing and the more familiar'),
};

// How long an emotion lasts before it first returns to baseline: median hours over 233 high-school students' recalled episodes of 27
// emotions (Verduyn & Lavrijsen 2015, Motiv Emot 39:119, Fig. 1 bottom left). Each OCC type takes the measured emotion
// nearest in meaning [mapping ASSUMED]; types without one (gloating, liking) are left out. The emotion lasts longer the
// more the event matters to the person (event importance, the paper's strongest predictor).
export const LASTS_H: Record<string, number> = {
    joy: 6.0, distress: 48, 'happy-for': 6.0, 'sorry-for': 1.5, resentment: 2.0, hope: 27, fear: 4.0, satisfaction: 3.0,
    'fears-confirmed': 2.3, relief: 0.8, disappointment: 2.0, pride: 24, 'self-reproach': 4.0, appreciation: 1.5, reproach: 1.5,
    gratitude: 6.0, anger: 24, gratification: 24, remorse: 4.0, disliking: 0.8,
};
// The same medians by the paper's own 27 emotion words, for when the narrator names the feeling (Fig. 1 bottom left). The OCC
// type fear above takes Verduyn's anxiety (a feared prospect, 4 h); fear of a present threat is 1 h.
export const EMOTION_HOURS: Record<string, number> = {
    shame: 0.5, relief: 0.8, disgust: 0.8, 'being touched': 0.9, surprise: 1.0, boredom: 1.0, fear: 1.0, admiration: 1.5,
    irritation: 1.5, compassion: 1.5, disappointment: 2.0, jealousy: 2.0, hatred: 2.0, desperation: 2.3, stress: 2.5,
    relaxation: 2.8, contentment: 3.0, anxiety: 4.0, guilt: 4.0, humiliation: 5.0, gratitude: 6.0, joy: 6.0, anger: 24,
    pride: 24, enthusiasm: 24, hope: 27, sadness: 48,
};
export const EMOTION_WORDS = Object.keys(EMOTION_HOURS);
/** The typical duration in words, without the figure; `word` (one of EMOTION_WORDS) takes precedence over the OCC type. */
export function lastsWords(type: string, word?: string): string {
    const h = (word ? EMOTION_HOURS[word] : undefined) ?? LASTS_H[type];
    if (h == null) return '';
    return h < 1 ? 'it usually fades within the hour' : h < 12 ? 'it usually lasts some hours' : h < 36 ? 'it usually lasts about a day' : 'it usually lasts days';
}

// Below threshold no emotion arises; above it, intensity sets the word (OCC ch. 4 pp. 81–84, ch. 9 p. 185) [3 levels ASSUMED].
export const MATTERS = ['not at all', 'somewhat', 'a great deal'];

export interface Appraisal { about: string; good?: boolean; wants?: boolean; cameTrue?: boolean; praiseworthy?: boolean; result?: 'good' | 'bad' | 'none'; appealing?: boolean }
/**
 * OCC types for one appraisal, the main one first and the ones that co-occur after it: confirmation emotions always come
 * with joy or distress (ch. 6 p. 133); compounds are an attribution emotion plus a well-being emotion (anger = reproach +
 * distress, ch. 7 p. 147). wants: the character wants that outcome for the other person (desirability for self, ch. 5).
 */
export function occTypes({ about, good = true, wants = true, cameTrue = true, praiseworthy = true, result = 'none', appealing = true }: Appraisal): string[] | null {
    switch (about) {
        case ABOUT[0]: return [good ? 'joy' : 'distress'];
        case ABOUT[1]: return [good ? (wants ? 'happy-for' : 'resentment') : (wants ? 'gloating' : 'sorry-for')];
        case ABOUT[2]: return [good ? 'hope' : 'fear'];
        case ABOUT[3]: return cameTrue ? (good ? ['satisfaction', 'joy'] : ['fears-confirmed', 'distress']) : (good ? ['disappointment', 'distress'] : ['relief', 'joy']);
        case ABOUT[4]: {
            const att = praiseworthy ? 'pride' : 'self-reproach';
            if (result === 'none') return [att];
            if (praiseworthy && result === 'good') return ['gratification', 'pride', 'joy'];
            if (!praiseworthy && result === 'bad') return ['remorse', 'self-reproach', 'distress'];
            return [att, result === 'good' ? 'joy' : 'distress'];
        }
        case ABOUT[5]: {
            const att = praiseworthy ? 'appreciation' : 'reproach';
            if (result === 'none') return [att];
            if (praiseworthy && result === 'good') return ['gratitude', 'appreciation', 'joy'];
            if (!praiseworthy && result === 'bad') return ['anger', 'reproach', 'distress'];
            return [att, result === 'good' ? 'joy' : 'distress'];
        }
        case ABOUT[6]: return [appealing ? 'liking' : 'disliking'];
        default: return null;
    }
}
