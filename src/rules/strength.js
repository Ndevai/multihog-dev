// Grip strength (docs/df-body-engine.md §6.10): mean and SD by age and sex, Dodds et al. 2014 (PLoS One 9:e113637, Table 2:
// 60 803 observations from 12 British studies), linear between the tabled ages; each person keeps a z drawn once from N(0, 1).
const AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
const MALE = [[41.5, 7.3], [48.8, 8.7], [51.6, 9.6], [51.6, 10.1], [50.3, 10.3], [48.8, 10.3], [47.6, 10.1], [46.2, 9.8], [44.6, 9.2],
    [42.3, 8.6], [39.1, 8.1], [35.6, 7.6], [32.2, 7.3], [28.5, 7.0], [24.7, 6.8]];
const FEMALE = [[28.4, 5.1], [30.6, 5.6], [31.4, 6.0], [31.3, 6.2], [30.7, 6.3], [29.9, 6.4], [28.7, 6.4], [27.5, 6.4], [26.5, 6.2],
    [25.3, 6.0], [23.5, 5.7], [21.4, 5.4], [19.1, 5.1], [16.6, 4.7], [14.2, 4.4]];

/** { mean, sd } of grip strength (kg) at `age` for `sex`. */
export function gripNorm(age = 25, sex = 'male') {
    const t = sex === 'female' ? FEMALE : MALE, a = Math.min(90, Math.max(20, age));
    const i = Math.min(AGES.length - 2, AGES.findIndex((x, k) => a >= x && a <= AGES[k + 1]));
    const f = (a - AGES[i]) / (AGES[i + 1] - AGES[i]);
    return { mean: t[i][0] + f * (t[i + 1][0] - t[i][0]), sd: t[i][1] + f * (t[i + 1][1] - t[i][1]) };
}

/** This person's grip strength (kg, one hand), drawing their z once. */
export function grip(p, gauss) {
    if (p.gripZ == null && gauss) p.gripZ = Math.round(gauss() * 100) / 100;
    const n = gripNorm(p.age, p.sex);
    return Math.max(0, n.mean + (p.gripZ ?? 0) * n.sd);
}
