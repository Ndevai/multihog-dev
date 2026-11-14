// What a character picks among options (Choose; docs/df-body-engine.md §6.17). The narrator gives each option the share of
// people in the character's place who would take it; code moves those shares by what the engine knows of this person now.
// An effect measured as a standardized difference d becomes a log-odds shift of 1.81 d for the options it touches (Chinn
// 2000, Stat Med 19:3127: ln OR = d × π/√3).
import { stateShare, POLES } from './acts.js';
export const OPTION_KINDS = ['attack or fight', 'run, hide or keep away', 'take a risk for a gain', 'play safe or wait', 'help someone', 'talk, bargain or give way', 'something else'];
const RISKY = new Set(['attack or fight', 'take a risk for a gain']);
// The trait whose momentary states an act expresses (Fleeson 2001 states; acts.ts) [ASSUMED mapping]: the option's weight is
// × the share of the person's hours spent at that pole ÷ an average person's.
const TRAIT_OF = {
    'attack or fight': ['agreeableness', POLES[1]], 'run, hide or keep away': ['emotional stability', POLES[1]], 'help someone': ['agreeableness', POLES[0]],
    'talk, bargain or give way': ['extraversion', POLES[0]], 'play safe or wait': ['conscientiousness', POLES[0]],
};
// Fear: experimentally induced fear and risk taking r = 0.15 (52 effect sizes, 28 samples; Wake, Wormwood & Satpute 2020,
// Cognition & Emotion), d = 0.30 toward the safe option. Anger: risk taking d = 0.54 in men, −0.21 in women (Ferrer, Maclay,
// Litvak & Lerner 2017, Risk Analysis; 3 experiments), 0.17 when sex is unknown. Alcohol: aggression against a placebo
// d = 0.61 (24 studies; Bushman & Cooper 1990, Psychol Bull 107:341), taken in full at 0.08 % and in proportion below
// [ASSUMED dose line].
const D_FEAR = 0.30, D_ANGER = { male: 0.54, female: -0.21, unknown: 0.17 }, D_ALCOHOL = 0.61;
const shift = (d) => Math.exp(1.81 * d);
/** The factor by which this person's state moves an option of this kind, and the reasons. */
export function optionFactor(kind, c) {
    if (!kind || kind === 'something else')
        return { factor: 1, why: [] };
    let f = 1;
    const why = [];
    const t = TRAIT_OF[kind];
    if (t && c.traits?.[t[0]] != null) {
        const r = stateShare(t[0], c.traits[t[0]], t[1], 'mild') / stateShare(t[0], 0, t[1], 'mild');
        f *= r;
        if (Math.abs(Math.log(r)) > 0.2)
            why.push(`${t[0]} ${r > 1 ? 'leans them to it' : 'holds them from it'}`);
    }
    const risky = RISKY.has(kind), safe = kind === 'run, hide or keep away' || kind === 'play safe or wait';
    if (c.feelings?.includes('fear') && (risky || safe)) {
        f *= risky ? 1 / shift(D_FEAR) : shift(D_FEAR);
        why.push('fear');
    }
    if (c.feelings?.includes('anger') && (risky || safe)) {
        const d = D_ANGER[c.sex === 'female' ? 'female' : c.sex === 'male' ? 'male' : 'unknown'];
        f *= risky ? shift(d) : 1 / shift(d);
        why.push('anger');
    }
    if (kind === 'attack or fight' && (c.bac ?? 0) > 0) {
        f *= shift(D_ALCOHOL * Math.min(1, (c.bac ?? 0) / 0.08));
        why.push('drink');
    }
    return { factor: f, why };
}
