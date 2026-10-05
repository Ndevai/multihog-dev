// Social judgments decided in code (docs/df-body-engine.md §6.9).
// Lie detection: judges without aids or training classify 47 % of lies as deceptive and 61 % of truths as truthful (54 %
// correct overall; Bond & DePaulo 2006, Pers Soc Psychol Rev 10:214, 206 documents, 24 483 judges).
export const LIE_CAUGHT = 0.47, TRUTH_BELIEVED = 0.61;

/** One roll: does the listener judge the statement a lie? Returns { judgedLie, chance }. */
export function judgeStatement(isLie, rng = Math.random) {
    const chance = isLie ? LIE_CAUGHT : 1 - TRUTH_BELIEVED;
    return { judgedLie: rng() < chance, chance };
}

// Helping in an emergency: intervened alone 85 %, with one other bystander 62 %, with four 31 % (Darley & Latané 1968, J Pers
// Soc Psychol 8:377, seizure study, as given by Wikipedia "Diffusion of responsibility"); linear between, 31 % beyond four
// [ASSUMED]. In dangerous emergencies the bystander effect did not occur (Fischer et al. 2011, Psychol Bull 137:517): the alone
// rate for any number [ASSUMED from that finding].
const HELP = [[0, 0.85], [1, 0.62], [4, 0.31]];
export function helpChance(others, dangerous = false) {
    const n = dangerous ? 0 : Math.max(0, others);
    if (n >= 4) return 0.31;
    const i = n < 1 ? 0 : 1, [x0, y0] = HELP[i], [x1, y1] = HELP[i + 1];
    return y0 + (y1 - y0) * (n - x0) / (x1 - x0);
}

// Obeying an order to harm someone to the end (Milgram; Wikipedia "Milgram experiment"): baseline, victim in another room 65 %;
// victim in the same room 40 %; must hold the victim's hand down 30 %; orders given by telephone 21 %; ordinary office instead of
// a university 47.5 %; two peers refuse 10 %; a peer obeys fully 92.5 %. US replications average 61 %, others 66 % (Blass).
export const OBEY = { 'victim out of sight': 0.65, 'victim in the same room': 0.40, 'must physically force the victim': 0.30,
    'orders by phone or message': 0.21, 'authority of an ordinary business': 0.475, 'peers refuse': 0.10, 'peers obey': 0.925 };
