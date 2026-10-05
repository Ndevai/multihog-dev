// Social judgments decided in code (docs/df-body-engine.md §6.9).
// Lie detection: judges without aids or training classify 47 % of lies as deceptive and 61 % of truths as truthful (54 %
// correct overall; Bond & DePaulo 2006, Pers Soc Psychol Rev 10:214, 206 documents, 24 483 judges).
export const LIE_CAUGHT = 0.47, TRUTH_BELIEVED = 0.61;

/** One roll: does the listener judge the statement a lie? Returns { judgedLie, chance }. */
export function judgeStatement(isLie, rng = Math.random) {
    const chance = isLie ? LIE_CAUGHT : 1 - TRUTH_BELIEVED;
    return { judgedLie: rng() < chance, chance };
}
