// How often a character acts a given way (docs/superset-models.md §5): a trait is a distribution of momentary states, and a
// setting makes an act more or less fitting.
import { BEHAVIOURS, SITUATIONS, APPROPRIATE } from './data/situations.js';

// Fleeson 2001 (J Pers Soc Psychol 80:1011), Study 2, Table 4: 1–7 ratings of how a person acted over the previous 3 hours,
// 27 students, about 71 reports each. Person mean M and SD of person means (between people); within-person SD = the spread
// of one person's states. Within-person spread is about as large as the between-person spread.
export const TRAITS = ['extraversion', 'agreeableness', 'conscientiousness', 'emotional stability', 'intellect'] as const;
export type Trait = typeof TRAITS[number];
const STATES: Record<Trait, { m: number; between: number; within: number }> = {
    extraversion: { m: 4.40, between: 0.71, within: 0.73 }, agreeableness: { m: 5.01, between: 0.67, within: 0.60 },
    conscientiousness: { m: 4.71, between: 0.71, within: 0.62 }, 'emotional stability': { m: 4.83, between: 0.61, within: 0.84 },
    intellect: { m: 4.36, between: 0.60, within: 0.62 },
};
// The character's place among people, as a z-score: very low −2, low −1, average 0, high +1, very high +2 [bands ASSUMED].
export const LEVELS = ['very low', 'low', 'average', 'high', 'very high'] as const;
export const levelZ = (l: string) => Math.max(0, LEVELS.indexOf(l as typeof LEVELS[number])) - 2;
// An act toward the trait's high pole needs a state of 5 or more (mild) or 6 or more (strong); toward its low pole 3 or less
// (mild) or 2 or less (strong), as the rating bins 4.5 / 5.5 / 3.5 / 2.5 [thresholds ASSUMED; Fleeson rates adjectives, not acts].
export const POLES = ['toward the high pole', 'toward the low pole'] as const;
export const STRENGTHS = ['mild', 'strong'] as const;

const phi = (x: number) => { const t = 1 / (1 + 0.2316419 * Math.abs(x)), d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; };

/** Share of a person's waking hours in states at the act's level, normal approximation (Fleeson reports skews −0.07 to −0.56). */
export function stateShare(trait: Trait, z: number, pole: typeof POLES[number], strength: typeof STRENGTHS[number]): number {
    const t = STATES[trait], mean = t.m + z * t.between;
    const cut = pole === POLES[0] ? (strength === 'mild' ? 4.5 : 5.5) : (strength === 'mild' ? 3.5 : 2.5);
    return pole === POLES[0] ? 1 - phi((cut - mean) / t.within) : phi((cut - mean) / t.within);
}

/** Appropriateness ratio of a behaviour in a situation: its rating there ÷ its mean over the 15 situations; 1 when either is not listed. */
export function settingRatio(behaviour?: string, situation?: string): { ratio: number; rating: number | null } {
    const b = BEHAVIOURS.indexOf((behaviour ?? '').toLowerCase() as typeof BEHAVIOURS[number]), s = SITUATIONS.indexOf((situation ?? '').toLowerCase() as typeof SITUATIONS[number]);
    if (b < 0 || s < 0) return { ratio: 1, rating: null };
    const mean = APPROPRIATE.reduce((t, r) => t + r[b], 0) / APPROPRIATE.length;
    return { ratio: APPROPRIATE[s][b] / mean, rating: APPROPRIATE[s][b] };
}
export { BEHAVIOURS, SITUATIONS };

// Acts done before ("have you ever…"): Buss 1981 (dissertation, Appendix III), the percentage of men and of women among
// Berkeley undergraduates, about 1980, who had ever performed each of 600 acts (data/buss.ts). The player's act is matched
// to the listed act sharing the most of its words, rarer words first; more than half of the act's words must match.
// The character's trait moves the share: a trait correlates with a single act at r = 0.12 (mean of the 56 acts whose
// correlations read cleanly: aloof acts × IAS aloof octant 0.10, dominant acts × CPI Dominance 0.14), turned into a
// biserial correlation ρ = r·√(p(1−p)) ÷ φ(τ), τ = Φ⁻¹(1 − p), and P(act | z) = Φ((ρz − τ) ÷ √(1 − ρ²)) [stated process].
// Disposition → trait: dominant and gregarious +extraversion, submissive and aloof −extraversion, agreeable
// +agreeableness, quarrelsome −agreeableness [ASSUMED mapping onto the Big Five].
import { BUSS } from './data/buss.js';
const STOP = new Set(['the', 'and', 'with', 'for', 'into', 'from', 'that', 'was', 'her', 'his', 'him', 'she', 'had', 'did', 'not', 'when', 'about', 'than', 'rather', 'even', 'though', 'although', 'were', 'this', 'there', 'their', 'they', 'them', 'who', 'what', 'out', 'off', 'at']);
const stemW = (w: string) => w.replace(/(ing|ed|es|s)$/, '').replace(/(.)\1$/, '$1');
const wordsOf = (t: string) => [...new Set(t.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(x => x.length > 2 && !STOP.has(x)).map(stemW))];
let ACT_WORDS: string[][] = [], ACT_DF = new Map<string, number>();
const dPhi = (x: number) => 0.3989423 * Math.exp(-x * x / 2);
const invPhi = (p: number) => { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; };
const TRAIT_OF: Record<string, [Trait, number]> = { dominant: ['extraversion', 1], gregarious: ['extraversion', 1], submissive: ['extraversion', -1], aloof: ['extraversion', -1], agreeable: ['agreeableness', 1], quarrelsome: ['agreeableness', -1] };
export const ACT_R = 0.12;

/** The listed act a player's act matches, or null. */
export function matchPastAct(text: string): { act: string; category: string; men: number; women: number } | null {
    if (ACT_WORDS.length !== BUSS.length) {
        ACT_WORDS = BUSS.map(r => wordsOf(r[1]));
        ACT_DF = new Map(); for (const ws of ACT_WORDS) for (const x of ws) ACT_DF.set(x, (ACT_DF.get(x) ?? 0) + 1);
    }
    const w = wordsOf(text);
    if (!w.length) return null;
    let best = -1, key = [0, 0];
    ACT_WORDS.forEach((ws, i) => {
        const m = w.filter(x => ws.includes(x));
        const k = [m.length, m.reduce((t, x) => t + Math.log(BUSS.length / (ACT_DF.get(x) ?? 1)), 0)];
        if (k[0] > key[0] || (k[0] === key[0] && k[1] > key[1])) { best = i; key = k; }
    });
    if (best < 0 || key[0] * 2 <= w.length || key[0] * 2 <= ACT_WORDS[best].length - 1) return null;
    const r = BUSS[best];
    return { act: r[1], category: r[0], men: r[2] / 100, women: r[3] / 100 };
}

/** Share of people of the character's sex and trait level (z on the act's trait) who have ever done the act. */
export function pastActShare(p: number, z: number, category: string): number {
    const sign = TRAIT_OF[category]?.[1] ?? 0, q = Math.min(0.99, Math.max(0.01, p)), tau = invPhi(1 - q);
    const rho = Math.min(0.9, ACT_R * Math.sqrt(q * (1 - q)) / dPhi(tau));
    return phi((rho * sign * z - tau) / Math.sqrt(1 - rho * rho));
}
export const pastActTrait = (category: string): Trait | null => TRAIT_OF[category]?.[0] ?? null;
