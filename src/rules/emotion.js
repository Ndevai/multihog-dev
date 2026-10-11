// Emotion type from the appraisal of what happened (docs/df-body-engine.md §6.13): the 22 emotion types of Ortony, Clore &
// Collins 1988, The Cognitive Structure of Emotions (the OCC model), each with its type specification, the words that
// name it (tokens) and what makes it stronger (variables affecting intensity), from the book's type definitions.
export const ABOUT = ['an event that affects them', 'an event that affects someone else', 'the prospect of an event',
    'a hoped-for or feared event that came true or did not', 'their own action', "someone else's action", 'a person or thing they encounter'];
const T = (words, stronger) => ({ words, stronger });
export const TYPES = {
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
// Below threshold no emotion arises; above it, intensity sets the word (OCC ch. 4 pp. 81–84, ch. 9 p. 185) [3 levels ASSUMED].
export const MATTERS = ['not at all', 'somewhat', 'a great deal'];
/**
 * OCC types for one appraisal, the main one first and the ones that co-occur after it: confirmation emotions always come
 * with joy or distress (ch. 6 p. 133); compounds are an attribution emotion plus a well-being emotion (anger = reproach +
 * distress, ch. 7 p. 147). wants: the character wants that outcome for the other person (desirability for self, ch. 5).
 */
export function occTypes({ about, good = true, wants = true, cameTrue = true, praiseworthy = true, result = 'none', appealing = true }) {
    switch (about) {
        case ABOUT[0]: return [good ? 'joy' : 'distress'];
        case ABOUT[1]: return [good ? (wants ? 'happy-for' : 'resentment') : (wants ? 'gloating' : 'sorry-for')];
        case ABOUT[2]: return [good ? 'hope' : 'fear'];
        case ABOUT[3]: return cameTrue ? (good ? ['satisfaction', 'joy'] : ['fears-confirmed', 'distress']) : (good ? ['disappointment', 'distress'] : ['relief', 'joy']);
        case ABOUT[4]: {
            const att = praiseworthy ? 'pride' : 'self-reproach';
            if (result === 'none')
                return [att];
            if (praiseworthy && result === 'good')
                return ['gratification', 'pride', 'joy'];
            if (!praiseworthy && result === 'bad')
                return ['remorse', 'self-reproach', 'distress'];
            return [att, result === 'good' ? 'joy' : 'distress'];
        }
        case ABOUT[5]: {
            const att = praiseworthy ? 'appreciation' : 'reproach';
            if (result === 'none')
                return [att];
            if (praiseworthy && result === 'good')
                return ['gratitude', 'appreciation', 'joy'];
            if (!praiseworthy && result === 'bad')
                return ['anger', 'reproach', 'distress'];
            return [att, result === 'good' ? 'joy' : 'distress'];
        }
        case ABOUT[6]: return [appealing ? 'liking' : 'disliking'];
        default: return null;
    }
}
