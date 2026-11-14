// Working something out (Conceptual Dependency MBUILD): the share of people who solve a problem within the time they have.
// Compound remote associates (three words, find the word that links them), 289 participants, 144 problems: 7.8 % solved
// within 2 s, 23.0 % within 7 s, 50.5 % within 30 s (Bowden & Jung-Beeman 2003, BRMIC 35:634, means over all problems).
// Fit: share(t) = 0.565 (1 − e^(−t / 13.4 s)), exact at the three points. Classic insight problems (riddles that need the
// problem seen anew) and non-insight problems (logic, arithmetic, planning), 4 min each: accuracy 0.51, 0.49, 0.45 and
// 0.54, 0.64, 0.56 over three experiments (Webb, Little & Cropper 2016, Front Psychol 7:1424, Table 1); means 0.483, 0.580.

// Remembering to do what one meant to, when its moment comes, without having kept it in mind (an intention set about 12
// minutes before, during other work): done 73 % of the time when the moment's cue is part of what the person is attending to
// (a focal cue: seeing the shop while driving past it), 18 % when nothing in what they are doing points to it (Scullin et al.
// 2010, as reviewed by McDaniel et al. in Byrne, Learning and Memory: A Comprehensive Reference, 2nd ed.). Up to half of the
// memory failures people log in diaries are of this kind (Terry 1988, same review).
export const PROBLEMS = ['a link between clues (one word or idea that fits them all)', 'a riddle or trick that needs a new view', 'a step-by-step problem (logic, a sum, a plan)', 'remembering to do what they meant to, the cue in front of them', 'remembering to do what they meant to, nothing in the moment pointing to it'] as const;
const INTENTION: Record<string, number> = { [PROBLEMS[3]]: 0.73, [PROBLEMS[4]]: 0.18 };
export const isIntention = (k: string) => k in INTENTION;
export type Problem = typeof PROBLEMS[number];

const CRA = { top: 0.565, tau: 13.4 };
// [ASSUMED] The 4-minute tasks follow the same curve shape, stretched so their measured limit sits where 30 s sits for
// the word links (time ×8).
const STRETCH = 240 / 30;
const AT_4_MIN: Record<Exclude<Problem, typeof PROBLEMS[0] | typeof PROBLEMS[3] | typeof PROBLEMS[4]>, number> = {
    'a riddle or trick that needs a new view': (0.51 + 0.49 + 0.45) / 3,
    'a step-by-step problem (logic, a sum, a plan)': (0.54 + 0.64 + 0.56) / 3,
};

/** Share of university students who solve a problem of this kind within `seconds`. */
export function solveShare(kind: Problem, seconds: number): number {
    if (isIntention(kind)) return INTENTION[kind];
    const t = Math.max(0, seconds);
    if (kind === PROBLEMS[0]) return CRA.top * (1 - Math.exp(-t / CRA.tau));
    const tau = CRA.tau * STRETCH;
    return AT_4_MIN[kind as keyof typeof AT_4_MIN] * (1 - Math.exp(-t / tau)) / (1 - Math.exp(-240 / tau));
}

// Where the students these norms come from stand among all people: US undergraduates' mean full-scale IQ, Flynn-adjusted, fell
// from about 118.5 in 1939 to about 103 by 2020, FSIQ = 490.742 − 0.192 × year (Uttl, Violo & Gibson 2024, meta-analysis of
// 106 samples, 9,902 students, ScienceOpen Research). At the years of the norms: word links 2003 (Bowden & Jung-Beeman) → IQ
// 106.2, z 0.41; insight and step-by-step problems 2016 (Webb et al.) → 103.7, z 0.24 (IQ SD 15). Before, students were
// taken to stand 1 SD above everyone.
const NORM_YEAR: Record<string, number> = { [PROBLEMS[0]]: 2003, [PROBLEMS[1]]: 2016, [PROBLEMS[2]]: 2016 };
export function studentZ(kind: string): number {
    const y = NORM_YEAR[kind];
    return y == null ? 0 : (490.742 - 0.192 * y - 100) / 15;
}
