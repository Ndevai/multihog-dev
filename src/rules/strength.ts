// Grip strength (docs/df-body-engine.md §6.10): mean and SD by age and sex, Dodds et al. 2014 (PLoS One 9:e113637, Table 2:
// 60 803 observations from 12 British studies), linear between the tabled ages; each person keeps a z drawn once from N(0, 1).
import type { Person, Gauss } from './types.js';

const AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
const MALE = [[41.5, 7.3], [48.8, 8.7], [51.6, 9.6], [51.6, 10.1], [50.3, 10.3], [48.8, 10.3], [47.6, 10.1], [46.2, 9.8], [44.6, 9.2],
    [42.3, 8.6], [39.1, 8.1], [35.6, 7.6], [32.2, 7.3], [28.5, 7.0], [24.7, 6.8]];
const FEMALE = [[28.4, 5.1], [30.6, 5.6], [31.4, 6.0], [31.3, 6.2], [30.7, 6.3], [29.9, 6.4], [28.7, 6.4], [27.5, 6.4], [26.5, 6.2],
    [25.3, 6.0], [23.5, 5.7], [21.4, 5.4], [19.1, 5.1], [16.6, 4.7], [14.2, 4.4]];

// World regions: median grip (kg, average of both hands) at ages 35–40, 41–50, 51–60, 61–70, women then men, from the PURE
// study (Leong et al. 2016, J Cachexia Sarcopenia Muscle 7:535, Table 2; 125 462 healthy adults in 21 countries). A region
// scales the British norm by its median ÷ the Europe/North America median for the same age band and sex; outside 35–70 the
// nearest band [ASSUMED]; the SD scales with the mean [ASSUMED].
export const REGIONS: Record<string, [number[], number[]]> = {
    'Europe/North America': [[30, 30, 27, 25], [50, 49, 46, 42]], 'South America': [[29, 27, 25, 23], [45, 43, 41, 37]],
    'Middle East': [[26, 25, 23, 21], [45, 43, 40, 35]], Africa: [[21, 24, 20, 18], [37, 38, 32, 30]],
    'South East Asia': [[23, 22, 20, 18], [40, 37, 33, 29]], 'South Asia': [[23, 21, 19, 19], [35, 33, 31, 27]],
    China: [[28, 28, 26, 23], [45, 43, 40, 36]],
};
const band = (a: number) => a <= 40 ? 0 : a <= 50 ? 1 : a <= 60 ? 2 : 3;
export function regionFactor(region: string | null | undefined, age = 25, sex = 'male'): number {
    const r = region ? REGIONS[region] : undefined;
    if (!r) return 1;
    const s = sex === 'female' ? 0 : 1, b = band(age);
    return r[s][b] / REGIONS['Europe/North America'][s][b];
}

/** { mean, sd } of grip strength (kg) at `age` for `sex`, scaled to `region` when given. */
export function gripNorm(age = 25, sex = 'male', region: string | null = null): { mean: number; sd: number } {
    const t = sex === 'female' ? FEMALE : MALE, a = Math.min(90, Math.max(20, age));
    const i = Math.min(AGES.length - 2, AGES.findIndex((x, k) => a >= x && a <= AGES[k + 1]));
    const f = (a - AGES[i]) / (AGES[i + 1] - AGES[i]), k = regionFactor(region, age, sex);
    return { mean: k * (t[i][0] + f * (t[i + 1][0] - t[i][0])), sd: k * (t[i][1] + f * (t[i + 1][1] - t[i][1])) };
}

/** This person's grip strength (kg, one hand), drawing their z once. */
export function grip(p: Person, gauss?: Gauss): number {
    if (p.gripZ == null && gauss) p.gripZ = Math.round(gauss() * 100) / 100;
    const n = gripNorm(p.age, p.sex, p.region ?? null);
    return Math.max(0, n.mean + (p.gripZ ?? 0) * n.sd);
}
