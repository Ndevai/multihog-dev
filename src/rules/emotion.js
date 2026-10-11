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

/** OCC type for one appraisal. good: desirable for the one the event affects; likes: the one appraising likes that person. */
export function occType({ about, good = true, likes = true, cameTrue = true, praiseworthy = true, result = null, appealing = true }) {
    switch (about) {
        case ABOUT[0]: return good ? 'joy' : 'distress';
        case ABOUT[1]: return good ? (likes ? 'happy-for' : 'resentment') : (likes ? 'sorry-for' : 'gloating');
        case ABOUT[2]: return good ? 'hope' : 'fear';
        case ABOUT[3]: return cameTrue ? (good ? 'satisfaction' : 'fears-confirmed') : (good ? 'disappointment' : 'relief');
        case ABOUT[4]: return praiseworthy ? (result === 'good' ? 'gratification' : 'pride') : (result === 'bad' ? 'remorse' : 'self-reproach');
        case ABOUT[5]: return praiseworthy ? (result === 'good' ? 'gratitude' : 'appreciation') : (result === 'bad' ? 'anger' : 'reproach');
        case ABOUT[6]: return appealing ? 'liking' : 'disliking';
        default: return null;
    }
}
