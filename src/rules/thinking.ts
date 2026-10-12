// Working something out (Conceptual Dependency MBUILD): the share of people who solve a problem within the time they have.
// Compound remote associates (three words, find the word that links them), 289 participants, 144 problems: 7.8 % solved
// within 2 s, 23.0 % within 7 s, 50.5 % within 30 s (Bowden & Jung-Beeman 2003, BRMIC 35:634, means over all problems).
// Fit: share(t) = 0.565 (1 − e^(−t / 13.4 s)), exact at the three points. Classic insight problems (riddles that need the
// problem seen anew) and non-insight problems (logic, arithmetic, planning), 4 min each: accuracy 0.51, 0.49, 0.45 and
// 0.54, 0.64, 0.56 over three experiments (Webb, Little & Cropper 2016, Front Psychol 7:1424, Table 1); means 0.483, 0.580.

export const PROBLEMS = ['a link between clues (one word or idea that fits them all)', 'a riddle or trick that needs a new view', 'a step-by-step problem (logic, a sum, a plan)'] as const;
export type Problem = typeof PROBLEMS[number];

const CRA = { top: 0.565, tau: 13.4 };
// [ASSUMED] The 4-minute tasks follow the same curve shape, stretched so their measured limit sits where 30 s sits for
// the word links (time ×8).
const STRETCH = 240 / 30;
const AT_4_MIN: Record<Exclude<Problem, typeof PROBLEMS[0]>, number> = {
    'a riddle or trick that needs a new view': (0.51 + 0.49 + 0.45) / 3,
    'a step-by-step problem (logic, a sum, a plan)': (0.54 + 0.64 + 0.56) / 3,
};

/** Share of university students who solve a problem of this kind within `seconds`. */
export function solveShare(kind: Problem, seconds: number): number {
    const t = Math.max(0, seconds);
    if (kind === PROBLEMS[0]) return CRA.top * (1 - Math.exp(-t / CRA.tau));
    const tau = CRA.tau * STRETCH;
    return AT_4_MIN[kind] * (1 - Math.exp(-t / tau)) / (1 - Math.exp(-240 / tau));
}
