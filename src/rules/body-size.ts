// Height and body mass of a new character from their country and birth year (docs/df-body-engine.md §6.11).
import { H_YEARS, B_YEARS, BODY } from './data/body-size.js';
import type { Gauss } from './types.js';
import { heightShare, whoAt } from './growth.js';

// Within-population SD of adult height: men 7.59 cm, women 7.07 cm (Jelenkovic et al. 2016, eLife 5:e14627, as given by
// Our World in Data, "Human Height").
const HEIGHT_SD = [7.59, 7.07];
// Within-population coefficient of variation of BMI: men 0.190, women 0.212, the seven regions of Leong et al. 2016
// (J Cachexia Sarcopenia Muscle 7:535, Table 1, BMI SD / mean) pooled with equal weight. BMI is drawn lognormal with that
// CV around the country mean [ASSUMED: lognormal shape]; height and BMI are drawn independently, as the NCD-RisC height
// and BMI country estimates correlate at r = 0.016 (NCD-RisC 2016, eLife 5:e13410).
const BMI_CV = [0.190, 0.212];
const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
export const COUNTRIES = Object.keys(BODY);
// Names as the data spells them, else the start of one, else a data name that starts the text (WMO's "Iran (Islamic
// Republic of)" → Iran).
export const findCountry = (text: string): string | null => COUNTRIES.find(c => norm(c) === norm(text)) ?? COUNTRIES.find(c => norm(c).startsWith(norm(text)))
    ?? COUNTRIES.filter(c => norm(text).startsWith(`${norm(c)} `)).sort((a, b) => b.length - a.length)[0] ?? null;

// Linear between tabled years; outside the table the nearest year [ASSUMED].
function at(years: number[], values: number[], y: number): number {
    if (y <= years[0]) return values[0];
    if (y >= years[years.length - 1]) return values[values.length - 1];
    const i = years.findIndex((x, k) => y >= x && y <= years[k + 1]);
    return values[i] + (values[i + 1] - values[i]) * (y - years[i]) / (years[i + 1] - years[i]);
}

/**
 * { heightCm, massKg, notes } for a person of `sex` from `country` born in `birthYear`, measured in `year`. The adult height
 * is drawn around the cohort mean with the SD above; mass = a BMI drawn around the country's mean for that year × height².
 * Under 19 (the WHO reference's end) the height is that adult height's share at their age (growth.ts heightShare, the
 * person's growth timing `timingZ`) and the BMI the WHO reference's at their age and the same z [ASSUMED: WHO's reference
 * for every country's children; at 19 the adult draw takes over, so the BMI steps up to the country's adult mean].
 */
export function bodySize(country: string, sex: string, birthYear: number, year: number, gauss: Gauss, shift = 0, timingZ = 0): { error: string } | { country: string; heightCm: number; massKg: number; bmiZ: number; notes: string[] } {
    const c = findCountry(country);
    if (!c) return { error: `No height data for "${country}".` };
    const s = sex === 'female' ? 1 : 0, [h, b] = BODY[c as keyof typeof BODY];
    const young = at(H_YEARS, h[s], birthYear) + shift + gauss() * HEIGHT_SD[s];
    // Height lost after 40: men 3.6 cm and women 4.8 cm from 40 to 80 (Framingham, measured against each person's own height at
    // 40 or younger; Nutrients 2023, PMC10649148), linear and continued past 80 [ASSUMED]. The mass stays the young height's, so
    // BMI rises with the loss, as the study reports.
    const heightCm = young - Math.max(0, year - birthYear - 40) / 40 * (s ? 4.8 : 3.6);
    const sl = Math.sqrt(Math.log(1 + BMI_CV[s] ** 2));
    const bmiZ = gauss();
    const bmi = at(B_YEARS, b[s], year) * pastBmi(c, year) * Math.exp(bmiZ * sl - sl * sl / 2);
    const notes = [shift ? `height shifted ${Math.round(shift * 10) / 10} cm for births ${birthYear}` : null, birthYear < H_YEARS[0] && !shift || birthYear > H_YEARS[H_YEARS.length - 1] ? `height for births ${birthYear < H_YEARS[0] ? H_YEARS[0] : H_YEARS[H_YEARS.length - 1]}` : null,
        pastBmi(c, year) !== 1 ? `weight from the 1850 American (Fogel) to the 1975 one` : year < B_YEARS[0] || year > B_YEARS[B_YEARS.length - 1] ? `weight for ${year < B_YEARS[0] ? B_YEARS[0] : B_YEARS[B_YEARS.length - 1]}` : null].filter((x): x is string => !!x);
    const age = year - birthYear;
    if (age < 19) {
        const male = s === 0, grown = young * heightShare(male, Math.max(0, age), timingZ), kid = whoAt('bmi', male, Math.max(0, age), bmiZ);
        return { country: c, heightCm: grown, massKg: kid * (grown / 100) ** 2, bmiZ, notes: [...notes, `growing: ${Math.round(heightShare(male, Math.max(0, age), timingZ) * 1000) / 10} % of an adult height of ${Math.round(young)} cm; BMI from the WHO reference`] };
    }
    return { country: c, heightCm, massKg: bmi * (young / 100) ** 2, bmiZ, notes };
}

// BMI before the 1975 series: circa 1850 the average American man stood about 5 ft 7 in and weighed about 146 lb (Fogel 2010,
// NBER w16938, from Floud et al. 2011), BMI 22.9, against 25.2 in 1975 (NCD-RisC). For the United States the 1975 mean is
// scaled linearly from 22.9/25.2 in 1850 to 1 in 1975 and held before 1850; women by the men's ratio [ASSUMED]. Other
// countries keep their 1975 mean.
function pastBmi(country: string, year: number): number {
    if (country !== 'United States' || year >= 1975) return 1;
    const r1850 = (146 * 0.45359237) / ((67 * 2.54) / 100) ** 2 / 25.2;
    return year <= 1850 ? r1850 : r1850 + (1 - r1850) * (year - 1850) / (1975 - 1850);
}

// A build the story states, as a BMI in the middle of its WHO band (underweight < 18.5, normal 18.5–25, overweight 25–30,
// obese 30–35 shown; ≥ 35 is still obese).
export const BUILDS: Record<string, number> = { thin: 17.5, average: 22, overweight: 27.5, obese: 32.5 };
/** Where a BMI sits in its sex's distribution for that country and year (z of the log-normal draw above); country unknown:
 * a mean BMI of 24 [ASSUMED, near the world adult mean]. */
export function bmiZOf(bmi: number, sex: string | undefined, country: string | null | undefined, year: number | null): number {
    const s = sex === 'female' ? 1 : 0, c = country ? findCountry(country) : null;
    const mean = c && year ? at(B_YEARS, BODY[c as keyof typeof BODY][1][s], year) * pastBmi(c, year) : 24;
    const sl = Math.sqrt(Math.log(1 + BMI_CV[s] ** 2));
    return (Math.log(bmi / mean) + sl * sl / 2) / sl;
}
