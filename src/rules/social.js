// Social judgments decided in code (docs/df-body-engine.md §6.9).
// Lie detection: judges without aids or training call 61.34 % of truths and 52.45 % of lies truthful (Bond & DePaulo 2006, Pers
// Soc Psychol Rev 10:214, 206 documents, 24 483 judges). Individual differences, measurement-corrected SDs in the share of
// statements judged truthful or correctly (Bond & DePaulo 2008, Psychol Bull 134:477, 247 samples): speaker credibility 11.58 %
// (seen as honest whether lying or not), speaker detectability 5.49 %, listener credulity 5.13 %, listener ability 0.80 %
// (negligible, not used). Each person keeps a z for each trait, drawn once.
export const LIE_CAUGHT = 1 - 0.5245, TRUTH_BELIEVED = 0.6134;
const trait = (p, k, gauss) => p ? (p[k] ??= Math.round(gauss() * 100) / 100) : 0;

/** One roll: does the listener judge the statement a lie? Returns { judgedLie, chance (of being judged a lie) }. */
export function judgeStatement(isLie, rng = Math.random, { speaker = null, listener = null, gauss = null } = {}) {
    const g = gauss ?? (() => { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); });
    const believed = (isLie ? 1 - LIE_CAUGHT : TRUTH_BELIEVED) + 0.1158 * trait(speaker, 'credZ', g) + 0.0513 * trait(listener, 'credulZ', g)
        + 0.0549 * trait(speaker, 'detectZ', g) * (isLie ? -1 : 1);
    const chance = 1 - Math.min(0.99, Math.max(0.01, believed));
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

// A direct small request to a stranger (fill a 5–10 min questionnaire, lend a phone for a call, walk them to a building): yes
// rates from the asks needed, Flynn & Lake 2008 (J Pers Soc Psychol 95:128), as reported by ScienceBlog (2026): about 10 asks for
// 5 questionnaires, 6 for 3 phone loans, just over 2 for 1 escort [targets 5, 3, 1 as recalled] → 48 %, 48 %, 43 %; mean 46 %.
export const SMALL_REQUEST_YES = 0.46;

// Romantic interest after a brief first meeting (yes to seeing the person again): Fisman, Iyengar, Kamenica & Simonson 2006 (Q J
// Econ 121:673; 392 subjects, 6276 four-minute meetings): in sessions with fewer than 15 partners about half got a yes from
// either sex; in larger sessions men stayed at about 50 %, women fell to about one-third; overall yes rate 0.43.
export function interestChance(sex, manyOptions = false) {
    return sex === 'female' && manyOptions ? 1 / 3 : 0.5;
}
