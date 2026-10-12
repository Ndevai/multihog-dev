// Social judgments decided in code (docs/df-body-engine.md §6.9).
// Lie detection: judges without aids or training call 61.34 % of truths and 52.45 % of lies truthful (Bond & DePaulo 2006, Pers
// Soc Psychol Rev 10:214, 206 documents, 24 483 judges). Individual differences, measurement-corrected SDs in the share of
// statements judged truthful or correctly (Bond & DePaulo 2008, Psychol Bull 134:477, 247 samples): speaker credibility 11.58 %
// (seen as honest whether lying or not), speaker detectability 5.49 %, listener credulity 5.13 %, listener ability 0.80 %
// (negligible, not used). Each person keeps a z for each trait, drawn once.
export const LIE_CAUGHT = 1 - 0.5245, TRUTH_BELIEVED = 0.6134;
const trait = (p, k, gauss) => p ? (p[k] ??= Math.round(gauss() * 100) / 100) : 0;
/** One roll: does the listener judge the statement a lie? Returns { judgedLie, chance (of being judged a lie) }. */
// With evidence against the speaker: interviewers who kept it until the suspect had told their story judged 85.0 % of truths
// and 85.7 % of lies correctly; interviewers who revealed it early, 57.1 % and 55.0 % (Hartwig, Granhag, Strömwall &
// Kronkvist 2006, Law Hum Behav 30:603, 82 interviewers, mock theft; the first group trained in the strategic use of evidence).
export const EVIDENCE = ['none', 'revealed early', 'kept until they have told their story'];
const WITH_EVIDENCE = { [EVIDENCE[1]]: { truth: 0.571, lie: 0.550 }, [EVIDENCE[2]]: { truth: 0.850, lie: 0.857 } };
export function judgeStatement(isLie, rng = Math.random, { speaker = null, listener = null, gauss = null, evidence = 'none' } = {}) {
    const g = gauss ?? (() => { let u = 0; while (!u)
        u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); });
    const ev = WITH_EVIDENCE[evidence];
    const believed = (ev ? (isLie ? 1 - ev.lie : ev.truth) : isLie ? 1 - LIE_CAUGHT : TRUTH_BELIEVED) + 0.1158 * trait(speaker, 'credZ', g) + 0.0513 * trait(listener, 'credulZ', g)
        + 0.0549 * trait(speaker, 'detectZ', g) * (isLie ? -1 : 1);
    const chance = 1 - Math.min(0.99, Math.max(0.01, believed));
    return { judgedLie: rng() < chance, chance };
}
// Helping in an emergency. Alone: 85 % intervened (Darley & Latané 1968, J Pers Soc Psychol 8:377, seizure study). With others
// present the probit is shifted by Hedges' g from Fischer et al. 2011 (Psychol Bull 137:517, 105 effect sizes, > 7700
// participants; Table 3: non-emergency −0.47, victim in danger −0.30, perpetrator acting +0.29; Table 4: 1 bystander −0.12,
// 2 −0.21, 3 −0.45, 4 −0.38, 5+ −0.49; overall −0.35): g = g(situation) + g(number) − g(overall) [ASSUMED additive; g read
// as a probit shift].
const G_SITUATION = { 'not an emergency': -0.47, 'victim in danger': -0.30, 'attacker present': 0.29 };
const G_NUMBER = [0, -0.12, -0.21, -0.45, -0.38, -0.49];
const phi = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const probit = (p) => { let lo = -8, hi = 8; for (let k = 0; k < 60; k++) {
    const m = (lo + hi) / 2;
    if (phi(m) < p)
        lo = m;
    else
        hi = m;
} return (lo + hi) / 2; };
export const SITUATIONS = Object.keys(G_SITUATION);
export function helpChance(others, situation = 'victim in danger') {
    if (others <= 0)
        return 0.85;
    const g = (G_SITUATION[situation] ?? -0.30) + G_NUMBER[Math.min(5, Math.round(others))] + 0.35;
    return phi(probit(0.85) + g);
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
