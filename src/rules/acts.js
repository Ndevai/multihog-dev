// How often a character acts a given way (docs/superset-models.md §5): a trait is a distribution of momentary states, and a
// setting makes an act more or less fitting.
import { BEHAVIOURS, SITUATIONS, APPROPRIATE } from './data/situations.js';
// Fleeson 2001 (J Pers Soc Psychol 80:1011), Study 2, Table 4: 1–7 ratings of how a person acted over the previous 3 hours,
// 27 students, about 71 reports each. Person mean M and SD of person means (between people); within-person SD = the spread
// of one person's states. Within-person spread is about as large as the between-person spread.
export const TRAITS = ['extraversion', 'agreeableness', 'conscientiousness', 'emotional stability', 'intellect'];
const STATES = {
    extraversion: { m: 4.40, between: 0.71, within: 0.73 }, agreeableness: { m: 5.01, between: 0.67, within: 0.60 },
    conscientiousness: { m: 4.71, between: 0.71, within: 0.62 }, 'emotional stability': { m: 4.83, between: 0.61, within: 0.84 },
    intellect: { m: 4.36, between: 0.60, within: 0.62 },
};
// The character's place among people, as a z-score: very low −2, low −1, average 0, high +1, very high +2 [bands ASSUMED].
export const LEVELS = ['very low', 'low', 'average', 'high', 'very high'];
export const levelZ = (l) => Math.max(0, LEVELS.indexOf(l)) - 2;
// An act toward the trait's high pole needs a state of 5 or more (mild) or 6 or more (strong); toward its low pole 3 or less
// (mild) or 2 or less (strong), as the rating bins 4.5 / 5.5 / 3.5 / 2.5 [thresholds ASSUMED; Fleeson rates adjectives, not acts].
export const POLES = ['toward the high pole', 'toward the low pole'];
export const STRENGTHS = ['mild', 'strong'];
const phi = (x) => {
    const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
};
/** Share of a person's waking hours in states at the act's level, normal approximation (Fleeson reports skews −0.07 to −0.56). */
export function stateShare(trait, z, pole, strength) {
    const t = STATES[trait], mean = t.m + z * t.between;
    const cut = pole === POLES[0] ? (strength === 'mild' ? 4.5 : 5.5) : (strength === 'mild' ? 3.5 : 2.5);
    return pole === POLES[0] ? 1 - phi((cut - mean) / t.within) : phi((cut - mean) / t.within);
}
/** Appropriateness ratio of a behaviour in a situation: its rating there ÷ its mean over the 15 situations; 1 when either is not listed. */
export function settingRatio(behaviour, situation) {
    const b = BEHAVIOURS.indexOf((behaviour ?? '').toLowerCase()), s = SITUATIONS.indexOf((situation ?? '').toLowerCase());
    if (b < 0 || s < 0)
        return { ratio: 1, rating: null };
    const mean = APPROPRIATE.reduce((t, r) => t + r[b], 0) / APPROPRIATE.length;
    return { ratio: APPROPRIATE[s][b] / mean, rating: APPROPRIATE[s][b] };
}
export { BEHAVIOURS, SITUATIONS };
