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
// Weak source [SECONDARY: a news report, targets recalled]; for a stranger asking to go first, Langer et al. 1978 below is primary.
export const SMALL_REQUEST_YES = 0.46;
// Since Milgram: Burger 2009 (Am Psychol 64:1, Table 2) repeated the voice-feedback condition up to 150 V in 2006: 70.0 %
// (28 of 40) continued past 150 V against 82.5 % (33 of 40) in Milgram's comparable Experiment 5. Story years from 2006 scale
// every OBEY share by 0.70 ÷ 0.825; between 1962 and 2006 linearly [ASSUMED: the 150 V ratio holds to the end of the scale].
export function obeyShare(order, year) {
    const p = OBEY[order];
    if (p == null)
        return null;
    const f = year == null ? 1 : 1 - (1 - 0.70 / 0.825) * Math.min(1, Math.max(0, (year - 1962) / (2006 - 1962)));
    return p * f;
}
// Refusing a split of something to be shared, knowing refusal leaves both with nothing (ultimatum game, 14 small-scale
// societies with real stakes of about a day's wage; Henrich et al. 2005, Behav Brain Sci 28:795, Table 2, Lamalera's sham
// offers and subgroup rows left out, Machiguenga's denominator taken as its 21 pairs): offers of 20 % or less refused 25 of 79
// (31.6 %); larger offers 29 of 467 (6.2 %).
export const REFUSE_SPLIT = { low: 25 / 79, other: 29 / 467 };
// Punishing someone who cheated the group, at a cost to oneself (Fehr & Gächter 2002, Nature 415:137: 240 students, six
// rounds of a public-goods game): 84.3 % punished at least once in six rounds; as an independent chance each round,
// 1 − (1 − 0.843)^(1/6) = 26.6 % for one occasion [ASSUMED: rounds independent]. 74.2 % of punishments fell on
// below-average contributors.
export const PUNISH_ONCE = 1 - (1 - 0.843) ** (1 / 6);
// Romantic interest after a brief first meeting (yes to seeing the person again): Fisman, Iyengar, Kamenica & Simonson 2006 (Q J
// Econ 121:673; 392 subjects, 6276 four-minute meetings): in sessions with fewer than 15 partners about half got a yes from
// either sex; in larger sessions men stayed at about 50 %, women fell to about one-third; overall yes rate 0.43.
export function interestChance(sex, manyOptions = false) {
    return sex === 'female' && manyOptions ? 1 / 3 : 0.5;
}
// Who asks: an order from a stranger in the street, out of the requester's role (Bickman 1974, J Appl Soc Psychol 4:47,
// Brooklyn, 153 adults; Table 1, share who obeyed after one reason if they did not at first; 14–24 per cell): civilian 36 %
// (small task), 33 % (give a sum to someone else), 20 % (move for a doubtful reason). The uniform's effect did not depend
// on the situation (interaction χ² = 0.26, df 4), so it is one log-odds shift, pooled over the three: civilian 30.1 %,
// milkman 47.3 % (+0.73; not significant against civilian), guard 77.2 % (+2.06). Being watched made no difference
// (Experiment II), so the effect is legitimacy, not threat. The shift applies to every request from a stranger (a favour,
// asking to go first, an order) [ASSUMED: the situation-free shift Bickman found carries to other requests].
export const REQUESTERS = ['ordinary clothes', 'uniform without authority (milkman, porter)', 'uniform of authority (guard, police)'];
const REQUESTER_SHIFT = [0, 0.73, 2.06];
export const ORDERS = ['do a small task for them', 'give a small sum to someone else', 'move or change what they are doing for a doubtful reason'];
const ORDER_OBEYED = [0.36, 0.33, 0.20];
const logit = (p) => Math.log(p / (1 - p));
/** A civilian's chance `p` asked by someone dressed as `requester` (unknown dress: unchanged). */
export function asRequester(p, requester) {
    const i = REQUESTERS.indexOf(requester);
    return i <= 0 ? p : 1 / (1 + Math.exp(-(logit(p) + REQUESTER_SHIFT[i])));
}
export function orderChance(order) {
    const o = ORDERS.indexOf(order);
    return o < 0 ? null : ORDER_OBEYED[o];
}
// A stranger asking to go first, interrupting what the person is about to do (Langer, Blank & Chanowitz 1978, J Pers Soc
// Psychol 36:635, Experiment 1: 120 people about to use a copier; Table 1, share who let the stranger go first; 15–25 per
// cell). Small: the stranger needs less of the person's time than the person's own task; big: more. A reason that says
// nothing new ("because I have to make copies") worked like a real one for a small request and like none for a big one.
export const GIVE_WAY_SIZES = ['small (less than their own task)', 'big (more than their own task)'];
export const GIVE_WAY_REASONS = ['no reason', 'a reason that adds nothing', 'a real reason'];
const GIVE_WAY = [[0.60, 0.93, 0.94], [0.24, 0.24, 0.42]];
export function giveWayChance(size, reason) {
    const a = GIVE_WAY_SIZES.indexOf(size), b = GIVE_WAY_REASONS.indexOf(reason);
    return a < 0 || b < 0 ? null : GIVE_WAY[a][b];
}
// Trust after a betrayal (Schweitzer, Hershey & Bradlow 2006, Organ Behav Hum Decis Process 101:1; 184 students, a trust
// game: the partner returned nothing in rounds 1–2, then kept faith from round 3). Share who make themselves vulnerable to
// the betrayer again after k acts of good faith: logit⁻¹(A − B e^(−δ k)) (their Equation 1, individual intercept at the
// mean); A, B, δ from Table 2 summed as Table 1 sets out (overall mean + main effects + interactions). A betrayal with
// lies (false promises) recovers to a lower level; a promise to change, and a promise with an apology, raise it.
export const TRUST_REPAIR = ['none', 'a promise to change', 'a promise and an apology'];
const P = { A: [4, -3.89, -0.51, -0.41, 0.95, 1.47], B: [6.92, -3.95, -5.12, -0.08, 4.88, 1.41], d: [0.77, 2.01, 4.26, -2.14, -3.41, 0.45] };
/** Share who trust the betrayer again after `kept` acts of good faith. */
export function trustAgain(lied, repair, kept) {
    const promise = repair !== 'none', apology = repair === TRUST_REPAIR[2];
    const sum = (v) => v[0] + (lied ? v[1] : 0) + (promise ? v[2] : 0) + (apology ? v[3] : 0) + (lied && promise ? v[4] : 0) + (lied && apology ? v[5] : 0);
    const A = sum(P.A), B = sum(P.B), d = sum(P.d);
    return 1 / (1 + Math.exp(-(A - B * Math.exp(-d * Math.max(0, kept)))));
}
