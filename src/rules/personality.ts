// Where a new character's traits are drawn from (docs/df-body-engine.md §6.13): the five traits differ by sex and age, so a
// character's place among people is drawn around the mean of their sex and age (data/personality.ts, IPIP-NEO-300) with SD 1
// [ASSUMED: unit spread within each group]. Country is left out: in the 1,015,341 IPIP-FFM records (docs/data/
// ipip_ffm_country_means.csv) country explained 0.4–2.1 % of the variance of each factor, as Kajonius & Mac Giolla 2017 (PLoS ONE
// 12:e0179646) found with the IPIP-NEO-120 in 22 countries (1.8 % on average, below their 5 % mark of a real difference), and
// intellect varied most between the countries where English is not the first language (7.6 %), where its items are words of a
// foreign vocabulary: a difference of measurement, not of people.
import { SEX_D, AGE_TRAITS } from './data/personality.js';
import { TRAITS, type Trait } from './acts.js';

/** The mean of `trait` for a person of `sex` and `age` (SD of all adults), and the part of it that is sex. */
export function traitMean(trait: Trait, sex?: string | null, age?: number | null): { mean: number; sexPart: number } {
    const i = TRAITS.indexOf(trait);
    if (i < 0) return { mean: 0, sexPart: 0 };
    const sexPart = sex === 'female' ? SEX_D[i] / 2 : sex === 'male' ? -SEX_D[i] / 2 : 0;
    let agePart = 0;
    if (age != null && Number.isFinite(age) && age >= 18) {
        const a = Math.min(AGE_TRAITS[AGE_TRAITS.length - 1][0], Math.max(AGE_TRAITS[0][0], age));
        const k = AGE_TRAITS.findIndex((r, j) => a >= r[0] && (j === AGE_TRAITS.length - 1 || a <= AGE_TRAITS[j + 1][0]));
        const [lo, hi] = [AGE_TRAITS[k], AGE_TRAITS[Math.min(AGE_TRAITS.length - 1, k + 1)]];
        agePart = hi[0] === lo[0] ? lo[i + 1] : lo[i + 1] + (hi[i + 1] - lo[i + 1]) * (a - lo[0]) / (hi[0] - lo[0]);
    }
    return { mean: sexPart + agePart, sexPart };
}
/** A trait z drawn for a person of `sex` and `age`, kept within ±3. */
export const drawTrait = (trait: Trait, sex: string | null | undefined, age: number | null | undefined, gauss: () => number) =>
    Math.max(-3, Math.min(3, traitMean(trait, sex, age).mean + gauss()));
