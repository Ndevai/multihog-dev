// How a held memory stands as time passes (the player's picks, 2026-11-16: "vivid and sure, details drift"; "engine: how
// many; narrator: which"; who-told-me and the correction share left to Claude). Three measures, from the papers the player
// supplied: how many details of a memory change and drop (Talarico & Rubin 2003), how sure the holder is and how clearly they
// see it (the same study), and how much of where it came from they keep (Bornstein & LeCompte 1995). The world's record is
// untouched: this is how a character tells or acts on what they hold.
import { def, k } from './constants.js';

// Talarico & Rubin 2003 (Psychol Sci 14:455). 54 Duke students wrote, on 12 September 2001, one day after the attacks, how
// they heard the news (a flashbulb memory) and an everyday event of the days before; each came back once, 7, 42 or 224 days
// after that first session (18 a group, so no one was tested twice after the first). A detail is a noun, verb phrase or unique
// modifier; consistent when it names the same thing as in the first telling, inconsistent when it contradicts it or cannot be
// the same thing. Figure 1, read from the figure in pixels (±0.1 detail, ±0.05 rating), at the first session and 7, 42 and
// 224 days after it. Days here are counted from the event: 1, 8, 43 and 225.
export const TR_DAYS = [1, 8, 43, 225];
export const TR = {
    consistent: { flashbulb: [11.46, 10.07, 8.30, 7.43], everyday: [12.5, 11.75, 9.75, 8.40] },
    inconsistent: { flashbulb: [0, 1.07, 1.53, 2.51], everyday: [0, 1.03, 0.95, 2.74] },
    // Belief: "the event in my memory really occurred in the way I remember it" (1, 100 % imaginary, to 7, 100 % real) with
    // "could be persuaded it was wrong" reversed. Vividness: how clearly they "see it", "hear it" and "know the setting" in
    // their mind (1, not at all, to 7, as clearly as if it were happening now).
    belief: { flashbulb: [5.57, 5.54, 5.74, 5.37], everyday: [5.39, 5.39, 4.71, 4.43] },
    vivid: { flashbulb: [5.36, 5.05, 5.30, 5.01], everyday: [4.95, 4.48, 4.08, 3.61] },
    // Emotional intensity at the first session, 1–7 (their Emotion section): what sets a memory apart as flashbulb.
    intensity: { flashbulb: 5.31, everyday: 2.64 },
};
const X = TR_DAYS.map(Math.log);
const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
const pooled = (o: { flashbulb: number[]; everyday: number[] }) => o.flashbulb.map((v, i) => (v + o.everyday[i]) / 2);
// Consistency did not differ between the two kinds (memory type × time, their Table 1: F ≤ 0.45), so the kinds are pooled.
// Per detail of the first telling: kept = consistent ÷ the first session's consistent; changed = inconsistent ÷ the same.
// "A roughly logarithmic decline in consistent details" (their Discussion): each share is a line in ln(days), fitted by least
// squares through the three follow-ups and through the first telling itself (kept 1, changed 0 at day 1, by definition).
// Beyond 225 days the line runs on [ASSUMED: no measure past 32 weeks here].
const C = pooled(TR.consistent), I = pooled(TR.inconsistent);
const slopeThroughDay1 = (y: number[], y1: number) => X.slice(1).reduce((s, x, i) => s + x * (y[i + 1] - y1), 0) / X.slice(1).reduce((s, x) => s + x * x, 0);
export const KEPT_SLOPE = slopeThroughDay1(C.map(v => v / C[0]), 1), CHANGED_SLOPE = slopeThroughDay1(I.map(v => v / C[0]), 0);
/** Of the details a memory held when first told, the shares told the same and told changed `days` after it was learned;
 * the rest are left out. */
export function driftShares(days: number): { kept: number; changed: number } {
    if (!(days > 1)) return { kept: 1, changed: 0 };
    const x = Math.log(days), kept = Math.max(0, Math.min(1, 1 + KEPT_SLOPE * x));
    return { kept, changed: Math.max(0, Math.min(1 - kept, CHANGED_SLOPE * x)) };
}

// Belief and vividness fell for everyday memories and held for flashbulb ones (memory type × session: F = 8.29 and 10.67,
// Table 1); each is a line in ln(days) fitted by least squares through its four points, kept within the scale, run on past 225
// days [ASSUMED]. A memory sits between the two by its emotional intensity: the engine's importance, 1–10 (Park et al. 2023's
// scale, RecordFact), laid on the 1–7 scale [ASSUMED: linear, 1 to 1 and 10 to 7], at 2.64 or below everyday, at 5.31 or
// above flashbulb, linear between [ASSUMED]; a fact with no importance is taken at 5, as pickFacts does.
const fit = (y: number[]) => { const mx = mean(X), my = mean(y), m = X.reduce((s, x, i) => s + (x - mx) * (y[i] - my), 0) / X.reduce((s, x) => s + (x - mx) ** 2, 0); return { m, c: my - m * mx }; };
export const FITS = { belief: { flashbulb: fit(TR.belief.flashbulb), everyday: fit(TR.belief.everyday) }, vivid: { flashbulb: fit(TR.vivid.flashbulb), everyday: fit(TR.vivid.everyday) } };
/** How far toward a flashbulb memory a memory of importance `imp` (1–10) sits, 0–1. */
export function flashShare(imp = 5): number {
    const i7 = 1 + (Math.max(1, Math.min(10, imp)) - 1) * 6 / 9;
    return Math.max(0, Math.min(1, (i7 - TR.intensity.everyday) / (TR.intensity.flashbulb - TR.intensity.everyday)));
}
/** How sure the holder is that it happened as they hold it and how clearly they see it, each on Talarico & Rubin's 1–7
 * scale, `days` after learning it. */
export function heldAs(days: number, imp = 5): { belief: number; vivid: number } {
    const x = Math.log(Math.max(1, days)), w = flashShare(imp);
    const at = (f: { flashbulb: { m: number; c: number }; everyday: { m: number; c: number } }) => {
        const e = f.everyday.c + f.everyday.m * x, fl = f.flashbulb.c + f.flashbulb.m * x;
        return Math.max(1, Math.min(7, e + w * (fl - e)));
    };
    return { belief: at(FITS.belief), vivid: at(FITS.vivid) };
}
// The words at whole points of the scale [ASSUMED bands; the scale's own words at its ends].
export const beliefWords = (b: number) => b >= 6 ? 'certain it happened just so' : b >= 5 ? 'sure of it' : b >= 4 ? 'fairly sure of it' : b >= 3 ? 'unsure of it' : 'doubts it';
export const vividWords = (v: number) => v >= 6 ? 'sees it as if it were happening now' : v >= 5 ? 'sees it clearly' : v >= 4 ? 'sees it fairly clearly' : v >= 3 ? 'sees it dimly' : 'sees little of it';

// Where it came from (Bornstein & LeCompte 1995, Psychon Bull Rev 2:254). Two-choice tests, item (which of two words was on
// the list) against source; Figure 1, read from the figure. Experiment 1 (48 students): which voice, a man's or a woman's,
// said the word: item .73, .72, .62, .59 and source .70, .65, .55, .54 at 0, 0.5, 48 and 168 hours. Experiment 2 (66
// students): whether the word was seen on the screen or heard: item .90 and .785, source .74 and .60 at 0 and 48 hours;
// whether it was generated by themselves or met (reality monitoring): .875 and .74. Source stayed below item by the same
// amount at every delay (type × delay: F(3,141) = 0.35 and F(2,130) = 0.33): it starts lower and is forgotten at the same rate.
// So a source's two-choice accuracy is the item's less a gap: gapWho .055 (mean of .03, .07, .07, .05), gapSense .17 (.16,
// .185), gapThought .035 (.025, .045). In the engine's terms, with the share who recall the fact s taken as the share who know
// the item above chance [ASSUMED: recall share for recognition's known share, two-choice accuracy = 0.5 + 0.5 s], the share
// who still hold its source is s − 2 × gap, so of those who recall it, 1 − 2 × gap ÷ s. Word lists in a laboratory stand for
// what a character saw and was told [ASSUMED]: seen or told takes the seen-or-heard gap; which person told them takes the
// voices'; thought of themselves or met takes reality monitoring's.
def({ id: 'gapWho', value: 0.055, unit: 'two-choice accuracy, item less which-voice source', status: 'sourced', src: 'Bornstein & LeCompte 1995 Exp. 1, Fig. 1: .03, .07, .07, .05 at 0, 0.5, 48, 168 h', range: [0.03, 0.07], file: 'memory-drift.ts' });
def({ id: 'gapSense', value: 0.17, unit: 'two-choice accuracy, item less seen-or-heard source', status: 'sourced', src: 'Bornstein & LeCompte 1995 Exp. 2, Fig. 1: .16, .185 at 0, 48 h', range: [0.055, 0.185], file: 'memory-drift.ts' });
def({ id: 'gapThought', value: 0.035, unit: 'two-choice accuracy, item less reality monitoring', status: 'sourced', src: 'Bornstein & LeCompte 1995 Exp. 2, Fig. 1: .025, .045 at 0, 48 h', range: [0.025, 0.045], file: 'memory-drift.ts' });
/** What kind of source a recorded "how they learned it" is: from another person's words, from their own thinking, or met
 *  with their senses. */
export function sourceKind(how: string): 'told' | 'thought' | 'perceived' {
    const h = String(how).trim();
    if (/^(told by|overheard|hearsay|heard it$)/.test(h)) return 'told';
    if (/^(inferred|assumed|their own|remembers)/.test(h)) return 'thought';
    return 'perceived';
}
/** Of those who recall a fact at share `s`, the share who still hold the kind of its source (gap `gap`). */
export const sourceShare = (s: number, gap: number) => s > 0 ? Math.max(0, 1 - 2 * gap / s) : 0;
export const kindGap = (how: string) => sourceKind(how) === 'thought' ? k('gapThought') : k('gapSense');
/** The person a told source names (told by X, overheard X), or null. */
export const teller = (how: string) => { const m = /^(?:told by|overheard) (.+)$/.exec(String(how).trim()); return m && m[1] !== 'someone' ? m[1] : null; };
/** The source with its person dropped, as one who keeps that they were told and not by whom. */
export const withoutTeller = (how: string) => /^overheard /.test(how) ? 'overheard someone' : 'told by someone';

/** The details of a fact, counted as Talarico & Rubin count them: its content words and numbers stand in for its nouns, verb
 * phrases and modifiers [ASSUMED]. */
const STOP = new Set('the a an and or of to in on at by for with from is was were are be been his her their its this that it he she they them him as not no but into out up'.split(' '));
export const detailsOf = (text: string) => [...new Set(String(text).toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(w => (/\p{N}/u.test(w) || w.length > 2) && !STOP.has(w)) ?? [])];
