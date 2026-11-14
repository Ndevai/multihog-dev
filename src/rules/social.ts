// Social judgments decided in code (docs/df-body-engine.md §6.9).
// Lie detection: judges without aids or training call 61.34 % of truths and 52.45 % of lies truthful (Bond & DePaulo 2006, Pers
// Soc Psychol Rev 10:214, 206 documents, 24 483 judges). Individual differences, measurement-corrected SDs in the share of
// statements judged truthful or correctly (Bond & DePaulo 2008, Psychol Bull 134:477, 247 samples): speaker credibility 11.58 %
// (seen as honest whether lying or not), speaker detectability 5.49 %, listener credulity 5.13 %, listener ability 0.80 %
// (negligible, not used). Each person keeps a z for each trait, drawn once.
import { WVS7, WVS_ACTS } from './data/wvs7.js';
import { def, k } from './constants.js';
export { WVS_ACTS };

export const LIE_CAUGHT = 1 - 0.5245, TRUTH_BELIEVED = 0.6134;
/** Per-person social traits, z-scores drawn once. */
export interface SocialTraits { credZ?: number; credulZ?: number; detectZ?: number }
const trait = (p: SocialTraits | null, k: keyof SocialTraits, gauss: () => number) => p ? (p[k] ??= Math.round(gauss() * 100) / 100) : 0;

/** One roll: does the listener judge the statement a lie? Returns { judgedLie, chance (of being judged a lie) }. */
// With evidence against the speaker: interviewers who kept it until the suspect had told their story judged 85.0 % of truths
// and 85.7 % of lies correctly; interviewers who revealed it early, 57.1 % and 55.0 % (Hartwig, Granhag, Strömwall &
// Kronkvist 2006, Law Hum Behav 30:603, 82 interviewers, mock theft; the first group trained in the strategic use of evidence).
export const EVIDENCE = ['none', 'revealed early', 'kept until they have told their story'] as const;
const WITH_EVIDENCE: Record<string, { truth: number; lie: number }> = { [EVIDENCE[1]]: { truth: 0.571, lie: 0.550 }, [EVIDENCE[2]]: { truth: 0.850, lie: 0.857 } };

// Who judges and who speaks (Bond & DePaulo 2006, same meta-analysis): judges who had seen the sender before (a baseline)
// were right 55.91 % against 52.26 % without (within studies, d = .239): truths believed +1.8 and lies −1.8 points
// [ASSUMED: the gain split evenly]; experts (police, interrogators, judges) judged 52.28 % of messages truthful against 55.69 %
// for others with the same accuracy: −3.4 points on both; senders with much at stake were judged truthful 53.43 % against
// 57.24 %: −3.8 points on both (their lies also a little easier to catch, d = .171, not used).
export const JUDGE = { knowsGain: (55.91 - 52.26) / 2 / 100, expertShift: (52.28 - 55.69) / 100, stakesShift: (53.43 - 57.24) / 100 };
export function judgeStatement(isLie: boolean, rng: () => number = Math.random, { speaker = null as SocialTraits | null, listener = null as SocialTraits | null, gauss = null as (() => number) | null, evidence = 'none' as string, knows = false, expert = false, stakes = false } = {}) {
    const g = gauss ?? (() => { let u = 0; while (!u) u = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng()); });
    const ev = WITH_EVIDENCE[evidence];
    const believed = (ev ? (isLie ? 1 - ev.lie : ev.truth) : isLie ? 1 - LIE_CAUGHT : TRUTH_BELIEVED) + 0.1158 * trait(speaker, 'credZ', g) + 0.0513 * trait(listener, 'credulZ', g)
        + 0.0549 * trait(speaker, 'detectZ', g) * (isLie ? -1 : 1)
        + (knows ? (isLie ? -1 : 1) * JUDGE.knowsGain : 0) + (expert ? JUDGE.expertShift : 0) + (stakes ? JUDGE.stakesShift : 0);
    const chance = 1 - Math.min(0.99, Math.max(0.01, believed));
    return { judgedLie: rng() < chance, chance };
}

// Helping in an emergency. Alone: 85 % intervened (Darley & Latané 1968, J Pers Soc Psychol 8:377, seizure study). With others
// present the probit is shifted by Hedges' g from Fischer et al. 2011 (Psychol Bull 137:517, 105 effect sizes, > 7700
// participants; Table 3: non-emergency −0.47, victim in danger −0.30, perpetrator acting +0.29; Table 4: 1 bystander −0.12,
// 2 −0.21, 3 −0.45, 4 −0.38, 5+ −0.49; overall −0.35): g = g(situation) + g(number) − g(overall) [ASSUMED additive; g read
// as a probit shift].
const G_SITUATION: Record<string, number> = { 'not an emergency': -0.47, 'victim in danger': -0.30, 'attacker present': 0.29 };
const G_NUMBER = [0, -0.12, -0.21, -0.45, -0.38, -0.49];
const phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2));
function erf(x: number): number { const t = 1 / (1 + 0.3275911 * Math.abs(x)), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; }
const probit = (p: number) => { let lo = -8, hi = 8; for (let k = 0; k < 60; k++) { const m = (lo + hi) / 2; if (phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
export const SITUATIONS = Object.keys(G_SITUATION);
export function helpChance(others: number, situation = 'victim in danger'): number {
    if (others <= 0) return 0.85;
    const g = (G_SITUATION[situation] ?? -0.30) + G_NUMBER[Math.min(5, Math.round(others))] + 0.35;
    return phi(probit(0.85) + g);
}

// Obeying an order to harm someone to the end (Milgram; Wikipedia "Milgram experiment"): baseline, victim in another room 65 %;
// victim in the same room 40 %; must hold the victim's hand down 30 %; orders given by telephone 21 %; ordinary office instead of
// a university 47.5 %; two peers refuse 10 %; a peer obeys fully 92.5 %. US replications average 61 %, others 66 % (Blass).
export const OBEY: Record<string, number> = { 'victim out of sight': 0.65, 'victim in the same room': 0.40, 'must physically force the victim': 0.30,
    'orders given from another place': 0.21, 'authority of an ordinary business': 0.475, 'peers refuse': 0.10, 'peers obey': 0.925 };

// A direct small request to a stranger (fill a 5–10 min questionnaire, lend a phone for a call, walk them to a building): yes
// rates from the asks needed, Flynn & Lake 2008 (J Pers Soc Psychol 95:128), as reported by ScienceBlog (2026): about 10 asks for
// 5 questionnaires, 6 for 3 phone loans, just over 2 for 1 escort [targets 5, 3, 1 as recalled] → 48 %, 48 %, 43 %; mean 46 %.
// Weak source [SECONDARY: a news report, targets recalled]; for a stranger asking to go first, Langer et al. 1978 below is primary.
export const SMALL_REQUEST_YES = 0.46;

// A bigger favour after a small one for the same cause (foot in the door; Burger 1999, Pers Soc Psychol Rev 3:303): the target
// request's yes rates in the studies' control and foot-in-the-door conditions, by who asks the second time and when, for people
// who did the first favour: same requester at once 28.43 → 34.42 % (24 studies, Table 6), same requester later 31.23 → 37.95
// (7, Table 8), another requester later 30.95 → 43.35 (28, Table 7), another at once 22.41 → 32.87 (5, Table 9). Those who
// agreed but were spared doing the first favour: OR 1.16 (Table 4); those who refused it: OR 0.65 (Table 5), both on the controls' mean
// 29.4 % (the four cells weighted by studies) [ASSUMED: the bigger favour is like the studies' target requests].
export const FITD_EARLIER = ['did the small favour', 'agreed to the small favour, which was then called off', 'refused the small favour'] as const;
const FITD_DONE: Record<string, number> = { 'same|now': 0.3442, 'same|later': 0.3795, 'other|later': 0.4335, 'other|now': 0.3287 };
const FITD_CONTROL = (24 * 0.2843 + 7 * 0.3123 + 28 * 0.3095 + 5 * 0.2241) / 64;
const oddsTimes = (p: number, or: number) => { const o = p / (1 - p) * or; return o / (1 + o); };
export function fitdChance(earlier: string, sameRequester = true, laterDay = false): number | null {
    if (earlier === FITD_EARLIER[0]) return FITD_DONE[`${sameRequester ? 'same' : 'other'}|${laterDay ? 'later' : 'now'}`];
    if (earlier === FITD_EARLIER[1]) return oddsTimes(FITD_CONTROL, 1.16);
    if (earlier === FITD_EARLIER[2]) return oddsTimes(FITD_CONTROL, 0.65);
    return null;
}
// A small favour asked right after the person refused a large one (door in the face; Feeley, Anker & Aloe 2012, Commun Monogr
// 79:316, the first 35 years): saying yes rose, r = .126 (78 studies), doing it barely, r = .052 (39 studies, not significant).
// As log odds 1.81 d, d = 2r ÷ √(1 − r²) (Chinn 2000): yes × 1.58, done × 1.21 in odds on the small-favour rate. Those who
// say yes and then do it: the done rate ÷ the yes rate [ASSUMED: everyone who does it said yes].
export function ditfChance(p0: number): { yes: number; does: number } {
    const or = (r: number) => Math.exp(1.81 * 2 * r / Math.sqrt(1 - r * r));
    return { yes: oddsTimes(p0, or(0.126)), does: oddsTimes(p0, or(0.052)) };
}

// Since Milgram: Burger 2009 (Am Psychol 64:1, Table 2) repeated the voice-feedback condition up to 150 V in 2006: 70.0 %
// (28 of 40) continued past 150 V against 82.5 % (33 of 40) in Milgram's comparable Experiment 5. Story years from 2006 scale
// every OBEY share by 0.70 ÷ 0.825; between 1962 and 2006 linearly [ASSUMED: the 150 V ratio holds to the end of the scale].
export function obeyShare(order: string, year: number | null): number | null {
    const p = OBEY[order];
    if (p == null) return null;
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
export function interestChance(sex: string | undefined, manyOptions = false): number {
    return sex === 'female' && manyOptions ? 1 / 3 : 0.5;
}

// Who asks: an order from a stranger in the street, out of the requester's role (Bickman 1974, J Appl Soc Psychol 4:47,
// Brooklyn, 153 adults; Table 1, share who obeyed after one reason if they did not at first; 14–24 per cell): civilian 36 %
// (small task), 33 % (give a sum to someone else), 20 % (move for a doubtful reason). The uniform's effect did not depend
// on the situation (interaction χ² = 0.26, df 4), so it is one log-odds shift, pooled over the three: civilian 30.1 %,
// milkman 47.3 % (+0.73; not significant against civilian), guard 77.2 % (+2.06). Being watched made no difference
// (Experiment II), so the effect is legitimacy, not threat. The shift applies to every request from a stranger (a favour,
// asking to go first, an order) [ASSUMED: the situation-free shift Bickman found carries to other requests].
// The labels name the uniform's kind, as any era has it: a tradesman's or a porter's (Bickman's milkman), a guard's.
export const REQUESTERS = ['ordinary clothes', "uniform without authority (a tradesman's or a porter's)", "uniform of authority (a guard's)"] as const;
const REQUESTER_SHIFT = [0, 0.73, 2.06];
export const ORDERS = ['do a small task for them', 'give a small sum to someone else', 'move or change what they are doing for a doubtful reason'] as const;
const ORDER_OBEYED = [0.36, 0.33, 0.20];
const logit = (p: number) => Math.log(p / (1 - p));
/** A civilian's chance `p` asked by someone dressed as `requester` (unknown dress: unchanged). */
export function asRequester(p: number, requester?: string): number {
    const i = REQUESTERS.indexOf(requester as typeof REQUESTERS[number]);
    return i <= 0 ? p : 1 / (1 + Math.exp(-(logit(p) + REQUESTER_SHIFT[i])));
}
export function orderChance(order: string): number | null {
    const o = ORDERS.indexOf(order as typeof ORDERS[number]);
    return o < 0 ? null : ORDER_OBEYED[o];
}

// A stranger asking to go first, interrupting what the person is about to do (Langer, Blank & Chanowitz 1978, J Pers Soc
// Psychol 36:635, Experiment 1: 120 people about to use a copier; Table 1, share who let the stranger go first; 15–25 per
// cell). Small: the stranger needs less of the person's time than the person's own task; big: more. A reason that says
// nothing new ("because I have to make copies") worked like a real one for a small request and like none for a big one.
export const GIVE_WAY_SIZES = ['small (less than their own task)', 'big (more than their own task)'] as const;
export const GIVE_WAY_REASONS = ['no reason', 'a reason that adds nothing', 'a real reason'] as const;
const GIVE_WAY: number[][] = [[0.60, 0.93, 0.94], [0.24, 0.24, 0.42]];
export function giveWayChance(size: string, reason: string): number | null {
    const a = GIVE_WAY_SIZES.indexOf(size as typeof GIVE_WAY_SIZES[number]), b = GIVE_WAY_REASONS.indexOf(reason as typeof GIVE_WAY_REASONS[number]);
    return a < 0 || b < 0 ? null : GIVE_WAY[a][b];
}

// Trust after a betrayal (Schweitzer, Hershey & Bradlow 2006, Organ Behav Hum Decis Process 101:1; 184 students, a trust
// game: the partner returned nothing in rounds 1–2, then kept faith from round 3). Share who make themselves vulnerable to
// the betrayer again after k acts of good faith: logit⁻¹(A − B e^(−δ k)) (their Equation 1, individual intercept at the
// mean); A, B, δ from Table 2 summed as Table 1 sets out (overall mean + main effects + interactions). A betrayal with
// lies (false promises) recovers to a lower level; a promise to change, and a promise with an apology, raise it.
export const TRUST_REPAIR = ['none', 'a promise to change', 'a promise and an apology'] as const;
const P = { A: [4, -3.89, -0.51, -0.41, 0.95, 1.47], B: [6.92, -3.95, -5.12, -0.08, 4.88, 1.41], d: [0.77, 2.01, 4.26, -2.14, -3.41, 0.45] };
/** Share who trust the betrayer again after `kept` acts of good faith. */
export function trustAgain(lied: boolean, repair: string, kept: number): number {
    const promise = repair !== 'none', apology = repair === TRUST_REPAIR[2];
    const sum = (v: number[]) => v[0] + (lied ? v[1] : 0) + (promise ? v[2] : 0) + (apology ? v[3] : 0) + (lied && promise ? v[4] : 0) + (lied && apology ? v[5] : 0);
    const A = sum(P.A), B = sum(P.B), d = sum(P.d);
    return 1 / (1 + Math.exp(-(A - B * Math.exp(-d * Math.max(0, kept)))));
}

// Trust in a stranger (Johnson & Mislin 2011, "Trust games: a meta-analysis", J Econ Psychol 32:865; 162 replications of
// Berg, Dickhaut & McCabe's investment game, 23,900 people in 35 countries): what is sent to an unknown counterpart who
// will receive it multiplied and may keep it all, as a share of what one could send, 0.502 on average; what that
// counterpart sends back, as a share of what they then hold, 0.372 (Table 2). Country means where the country was run
// (Table 3; 1–46 studies each). Each person's share is drawn around the mean with SD 0.3, cut to 0–1, so some hand over
// nothing and some everything [ASSUMED spread: the meta-analysis reports study means only].
export const TRUST_SENT = 0.502, TRUST_RETURNED = 0.372;
const TRUST_BY_COUNTRY: Record<string, [number, number | null]> = {
    'Argentina': [0.43, 0.40], 'Australia': [0.51, 0.32], 'Austria': [0.62, 0.38], 'Bangladesh': [0.46, 0.46], 'Brazil': [0.71, 0.45],
    'Bulgaria': [0.57, 0.39], 'Cameroon': [0.70, 0.47], 'Canada': [0.60, 0.31], 'China': [0.48, 0.55], 'Colombia': [0.37, 0.23],
    'Costa Rica': [0.46, 0.26], 'France': [0.43, 0.33], 'Germany': [0.51, 0.44], 'Honduras': [0.49, 0.42], 'Hungary': [0.51, 0.40],
    'India': [0.49, 0.29], 'Israel': [0.59, 0.45], 'Italy': [0.43, 0.31], 'Japan': [0.58, 0.32], 'Kenya': [0.38, 0.32],
    'Netherlands': [0.46, 0.33], 'New Zealand': [0.44, 0.22], 'Paraguay': [0.47, 0.43], 'Peru': [0.48, 0.46], 'Russia': [0.49, 0.37],
    'South Africa': [0.44, 0.24], 'South Korea': [0.67, 0.29], 'Sweden': [0.74, 0.37], 'Switzerland': [0.66, 0.53], 'Tanzania': [0.54, 0.40],
    'Uganda': [0.45, 0.33], 'United Kingdom': [0.54, 0.28], 'United States': [0.51, 0.34], 'Uruguay': [0.45, 0.29], 'Vietnam': [0.33, null],
};
const ALIAS: Record<string, string> = { 'korea': 'South Korea', 'republic of korea': 'South Korea', 'viet nam': 'Vietnam', 'russian federation': 'Russia', 'united kingdom of great britain and northern ireland': 'United Kingdom', 'great britain': 'United Kingdom', 'england': 'United Kingdom', 'scotland': 'United Kingdom', 'wales': 'United Kingdom', 'united states of america': 'United States', 'usa': 'United States', 'tanzania, united republic of': 'Tanzania', 'united republic of tanzania': 'Tanzania' };
/** The trust-game means for `country` (sent, returned), with the label of where they come from. */
export function trustMeans(country?: string | null): { sent: number; returned: number; where: string } {
    const c = String(country ?? '').trim(), key = ALIAS[c.toLowerCase()] ?? Object.keys(TRUST_BY_COUNTRY).find(x => x.toLowerCase() === c.toLowerCase());
    const row = key ? TRUST_BY_COUNTRY[key] : null;
    return row ? { sent: row[0], returned: row[1] ?? TRUST_RETURNED, where: `${key} studies${row[1] == null ? '; returns from all 35 countries' : ''}` } : { sent: TRUST_SENT, returned: TRUST_RETURNED, where: 'all 35 countries' };
}
/** One person's share around a mean (see above). */
export const shareAround = (mean: number, gauss: () => number) => Math.max(0, Math.min(1, mean + 0.3 * gauss()));

// Misinformation (Loftus 2005, "Planting misinformation in the human mind", Learn Mem 12:361): told a false detail after
// witnessing an event, people later remember it as part of what they saw about 47 % of the time (Okado & Stark 2005, as
// reviewed there). Memories are changed most when the original has faded, since no discrepancy is noticed (the Discrepancy
// Detection principle, Tousignant et al. 1986): once the witness no longer recalls the event, the false detail is taken
// in whole [ASSUMED: nothing is left to notice the conflict]. Urged to remember a whole event that never happened (false
// narratives, imagination, suggestive interviews), about 30 % go on to a partial or complete false memory (Lindsay et al.
// 2004, as reviewed there).
export const MISINFO_TAKEN = 0.47, FALSE_EVENT_TAKEN = 0.30;

// What people in a country think of an act (World Values Survey wave 7, 2017–2022; data/wvs7.ts): the share who call it never
// justifiable, 1 on a 1–10 scale. A person of the setting condemns it outright with that chance; used for story years from
// 2000 on [ASSUMED: the 2017–2022 answers hold within about 20 years; earlier waves are not in the engine].
const WVS_ALIAS: Record<string, string> = { 'united kingdom of great britain and northern ireland': 'United Kingdom', 'great britain': 'United Kingdom', 'england': 'United Kingdom', 'scotland': 'United Kingdom', 'wales': 'United Kingdom', 'united states of america': 'United States', 'usa': 'United States', 'russian federation': 'Russia', 'korea': 'South Korea', 'republic of korea': 'South Korea', 'viet nam': 'Vietnam', 'iran (islamic republic of)': 'Iran', 'czechia': 'Czech Republic', 'türkiye': 'Turkey', 'turkiye': 'Turkey', 'bolivia (plurinational state of)': 'Bolivia', 'venezuela (bolivarian republic of)': 'Venezuela', 'china, hong kong sar': 'Hong Kong', 'taiwan, province of china': 'Taiwan' };
/** The WVS-7 row for a country name, with its name, or null. */
export function wvsFor(country: string | null | undefined): { name: string; year: number; trustMost: number | null; trustNew: number | null; religion: number | null; never: (number | null)[] } | null {
    const c = String(country ?? '').trim().toLowerCase();
    if (!c) return null;
    const name = WVS_ALIAS[c] ?? Object.keys(WVS7).find(k => k.toLowerCase() === c) ?? Object.keys(WVS7).find(k => c.startsWith(k.toLowerCase()));
    const r = name ? WVS7[name] : null;
    return r ? { name: name!, year: r[0], trustMost: r[1], trustNew: r[2], religion: r[3], never: r[4] } : null;
}

// Going along with a group that states something a person can see is wrong (Asch's line judgments): the share of judgments
// that went with the majority, by majority size: 1 almost none, 2 13.6 %, 3 31.8 %, more about the same (Asch 1955, as
// summarised in the IB key study; 2 % taken for "almost none" [ASSUMED]); 36.8 % in the baseline of 7–9; one ally who
// answers right cuts it to 5 % (Asch 1956, as summarised on Wikipedia). Asch's subjects were young American men in the early
// 1950s. Bond & Smith 1996 (Psychol Bull 119:111, 133 studies, 17 countries): U.S. women conformed more (d = 1.04 against
// men's 0.85, Table 3 text), and conformity fell with the date of the study (b = −0.009 d a year, Table 4); both enter as log-odds
// shifts of 1.81 d (Chinn 2000), the date from 1951 [ASSUMED: held before 1951; the culture term is left out, the engine
// holds no individualism index].
def({ id: 'conformAlmostNone', value: 0.02, unit: 'share going with a majority of one', status: 'assumed', src: 'Asch 1955 gives "almost none"', range: [0.005, 0.05], file: 'social.ts' });
export function conformShare(majority: number, ally: boolean, sex: string | undefined, year: number | null): number {
    const m = Math.max(0, Math.round(majority));
    if (m === 0) return 0;
    // An ally cuts conformity to 5 % at most: with a single person stating it, the 2 % stands.
    const alone = m === 1 ? k('conformAlmostNone') : m === 2 ? 0.136 : m === 3 ? 0.318 : 0.368;
    let p = ally ? Math.min(alone, 0.05) : alone;
    let z = Math.log(p / (1 - p));
    if (sex === 'female') z += 1.81 * (1.04 - 0.85);
    if (year != null && year > 1951) z += 1.81 * -0.009 * (year - 1951);
    return 1 / (1 + Math.exp(-z));
}

// Eyewitness lineups, as signal detection (the model of lineup memory in Wixted & Wells 2017, Psychol Sci Public Interest
// 18:10): each face in a lineup of six gives the witness a sense of match, normal with SD 1; an innocent face's mean is 0
// and the culprit's is d′. The witness picks the face that matches best when its match passes a criterion c, and says
// "not there" otherwise. Both are fitted to the simultaneous lineups of Steblay, Dysart & Wells (2011, Psychol Public Policy
// Law 17:99, full-design set of 27 tests): culprit absent, 54 % pick someone, so 1 − Φ(c)⁶ = 0.54 gives c = 1.17; culprit
// present, 52 % pick the culprit, giving d′ = 1.47 [FITTED]. The fit then gives 28 % filler picks with the culprit
// present, against 24 % in their 72-test set (a check, not fitted). Confidence is how far the best match passes c: past 1.5
// is "high". With half the lineups holding the culprit and the innocent suspect one face of six, high-confidence picks of the
// suspect are then 97 % right, the figure Wixted & Wells give for high-confidence initial picks from fair lineups [FITTED:
// the 1.5]; past 0.5 is "medium" [ASSUMED]. A face never made out (Look short of "identifies it") gives d′ 0 [ASSUMED].
// Forgetting: d′ falls with the hours since the sighting as (1 + h ÷ 9.4)^−0.37, fitted (weighted by n) to one-face-seen
// recognition after 0, 6, 12, 32 and 173 hours, AUC 0.75, 0.70, 0.73, 0.62, 0.60 (PeerJ 9:e11828, doi
// 10.7717/peerj.11828, 570 people; d′ = √2 Φ⁻¹(AUC)) [FITTED]; past a week it follows the same power law [ASSUMED].
def({ id: 'lineupCriterion', value: 1.168, unit: 'match (SD units) a face must pass to be picked', status: 'fitted', src: 'Steblay, Dysart & Wells 2011: 54 % pick someone from a culprit-absent simultaneous lineup', range: [1.0, 1.35], file: 'social.ts' });
def({ id: 'lineupDprime', value: 1.467, unit: 'd′ of a fresh memory of a face made out', status: 'fitted', src: 'Steblay, Dysart & Wells 2011: 52 % pick the culprit when present', range: [1.2, 1.75], file: 'social.ts' });
def({ id: 'lineupSure', value: 1.5, unit: 'match past the criterion for a high-confidence pick', status: 'fitted', src: 'Wixted & Wells 2017: high-confidence initial picks from fair lineups about 97 % right', range: [1.0, 2.0], file: 'social.ts' });
def({ id: 'lineupFairly', value: 0.5, unit: 'match past the criterion for a medium-confidence pick', status: 'assumed', src: 'the three-level split of confidence', range: [0.25, 1.0], file: 'social.ts' });
def({ id: 'faceForgetH', value: 9.41, unit: 'h, time scale of face forgetting (1 + h/τ)^−ψ', status: 'fitted', src: 'PeerJ 9:e11828 (doi 10.7717/peerj.11828): AUC 0.75 → 0.60 over 0–173 h', range: [4, 25], file: 'social.ts' });
def({ id: 'faceForgetPow', value: 0.369, unit: 'power ψ of face forgetting', status: 'fitted', src: 'PeerJ 9:e11828, as faceForgetH', range: [0.25, 0.5], file: 'social.ts' });
// What weakens the memory of the face, each a factor on d′ fitted so that culprit picks fall as measured (from 52 %):
// fear when the face was seen, Deffenbacher, Bornstein, Penrod & McGorty 2004 (Law Hum Behav 28:687, 27 tests): correct
// identifications fall by an effect of .31, read as Cohen's h [ASSUMED metric] → 36.7 % → d′ × 0.716; a weapon in view,
// Steblay 1992 (Law Hum Behav 16:413, 19 tests, 2,082 people): lineup identification .13 (feature accuracy .55) → 45.5 % →
// × 0.881; a face of a people the witness has seldom met, Meissner & Brigham 2001 (Psychol Public Policy Law 7:3, 91 samples,
// 4,996 people): own-group faces 1.4 times as likely to be picked rightly and others' 1.56 times as likely to be picked
// wrongly; read as culprit picks ÷ 1.4 and the odds of picking someone from a culprit-absent lineup × 1.56 [ASSUMED: the
// recognition ratios applied to the lineup's rates] → criterion − 0.17 and d′ × 0.663 [FITTED]. Factors multiply [ASSUMED].
// Sequential lineups (one face at a time, the first that passes the criterion is picked): culprit absent, 32 % pick someone
// (Steblay, Dysart & Wells 2011, full-design set) → criterion 1.54 [FITTED]; the model then gives 40.5 % culprit picks and
// 21 % filler picks with the culprit present, against 44 % (95 % CI 37–51) and 24 % measured (a check).
def({ id: 'lineupStressD', value: 0.716, unit: '× d′ when the witness was afraid at the sighting', status: 'fitted', src: 'Deffenbacher et al. 2004: correct identifications, effect −.31', range: [0.6, 0.85], file: 'social.ts' });
def({ id: 'lineupWeaponD', value: 0.881, unit: '× d′ with a weapon in view at the sighting', status: 'fitted', src: 'Steblay 1992: lineup identification, effect .13', range: [0.8, 0.95], file: 'social.ts' });
def({ id: 'lineupOtherD', value: 0.663, unit: '× d′ for a face of a people the witness has seldom met', status: 'fitted', src: 'Meissner & Brigham 2001: hits 1.4 times for own-group faces', range: [0.5, 0.8], file: 'social.ts' });
def({ id: 'lineupOtherC', value: -0.17, unit: 'shift of the criterion for such a face', status: 'fitted', src: 'Meissner & Brigham 2001: false alarms 1.56 times, applied to the odds of choosing', range: [-0.35, 0], file: 'social.ts' });
def({ id: 'lineupSeqCriterion', value: 1.536, unit: 'criterion of a sequential lineup', status: 'fitted', src: 'Steblay, Dysart & Wells 2011: 32 % pick someone from a culprit-absent sequential lineup', range: [1.4, 1.7], file: 'social.ts' });
export const LINEUP = { get c() { return k('lineupCriterion'); }, get dprime() { return k('lineupDprime'); }, get high() { return k('lineupSure'); }, get medium() { return k('lineupFairly'); }, size: 6 };
export interface Encoding { stressed?: boolean; weapon?: boolean; otherGroup?: boolean }
export function faceStrength(identified: boolean, hours: number, e: Encoding = {}): number {
    const f = (e.stressed ? k('lineupStressD') : 1) * (e.weapon ? k('lineupWeaponD') : 1) * (e.otherGroup ? k('lineupOtherD') : 1);
    return identified ? LINEUP.dprime * f * (1 + Math.max(0, hours) / k('faceForgetH')) ** -k('faceForgetPow') : 0;
}
export function lineupPick(dprime: number, culpritPresent: boolean, normal: () => number, o: { sequential?: boolean; otherGroup?: boolean; uniform?: () => number } = {}): { pick: 'culprit' | 'other' | 'none'; confidence: 'high' | 'medium' | 'low' | null } {
    const c = (o.sequential ? k('lineupSeqCriterion') : LINEUP.c) + (o.otherGroup ? k('lineupOtherC') : 0);
    // Sequential: the culprit stands at a random place in the order [ASSUMED: unknown to the witness and the officer].
    const at = o.sequential ? Math.min(LINEUP.size - 1, Math.floor((o.uniform ?? Math.random)() * LINEUP.size)) : 0;
    const faces = Array.from({ length: LINEUP.size }, (_, i) => normal() + (culpritPresent && i === at ? dprime : 0));
    const chosen = o.sequential ? faces.findIndex(m => m > c) : faces.indexOf(Math.max(...faces));
    const over = chosen < 0 ? 0 : faces[chosen] - c;
    if (over <= 0) return { pick: 'none', confidence: null };
    return { pick: culpritPresent && chosen === at ? 'culprit' : 'other', confidence: over > LINEUP.high ? 'high' : over > LINEUP.medium ? 'medium' : 'low' };
}
