// Height and body mass of a new character from their country and birth year (docs/df-body-engine.md §6.11).
import { H_YEARS, B_YEARS, BODY } from './data/body-size.js';
// Within-population SD of adult height: men 7.59 cm, women 7.07 cm (Jelenkovic et al. 2016, eLife 5:e14627, as given by
// Our World in Data, "Human Height").
const HEIGHT_SD = [7.59, 7.07];
// Within-population coefficient of variation of BMI: men 0.190, women 0.212, the seven regions of Leong et al. 2016
// (J Cachexia Sarcopenia Muscle 7:535, Table 1, BMI SD / mean) pooled with equal weight. BMI is drawn lognormal with that
// CV around the country mean [ASSUMED: lognormal shape]; height and BMI are drawn independently, as the NCD-RisC height
// and BMI country estimates correlate at r = 0.016 (NCD-RisC 2016, eLife 5:e13410).
const BMI_CV = [0.190, 0.212];
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z]+/g, ' ').trim();
export const COUNTRIES = Object.keys(BODY);
// Names as the data spells them, else the start of one, else a data name that starts the text (WMO's "Iran (Islamic
// Republic of)" → Iran).
export const findCountry = (text) => COUNTRIES.find(c => norm(c) === norm(text)) ?? COUNTRIES.find(c => norm(c).startsWith(norm(text)))
    ?? COUNTRIES.filter(c => norm(text).startsWith(`${norm(c)} `)).sort((a, b) => b.length - a.length)[0] ?? null;
// Linear between tabled years; outside the table the nearest year [ASSUMED].
function at(years, values, y) {
    if (y <= years[0])
        return values[0];
    if (y >= years[years.length - 1])
        return values[values.length - 1];
    const i = years.findIndex((x, k) => y >= x && y <= years[k + 1]);
    return values[i] + (values[i + 1] - values[i]) * (y - years[i]) / (years[i + 1] - years[i]);
}
/**
 * { heightCm, massKg, notes } for an adult of `sex` from `country` born in `birthYear`, measured in `year`. Height is drawn
 * around the cohort mean with the SD above; mass = a BMI drawn around the country's mean for that year × height².
 */
export function bodySize(country, sex, birthYear, year, gauss, shift = 0) {
    const c = findCountry(country);
    if (!c)
        return { error: `No height data for "${country}".` };
    const s = sex === 'female' ? 1 : 0, [h, b] = BODY[c];
    const heightCm = at(H_YEARS, h[s], birthYear) + shift + gauss() * HEIGHT_SD[s];
    const sl = Math.sqrt(Math.log(1 + BMI_CV[s] ** 2));
    const bmiZ = gauss();
    const bmi = at(B_YEARS, b[s], year) * Math.exp(bmiZ * sl - sl * sl / 2);
    const notes = [shift ? `height shifted ${Math.round(shift * 10) / 10} cm for births ${birthYear}` : null, birthYear < H_YEARS[0] && !shift || birthYear > H_YEARS[H_YEARS.length - 1] ? `height for births ${birthYear < H_YEARS[0] ? H_YEARS[0] : H_YEARS[H_YEARS.length - 1]}` : null,
        year < B_YEARS[0] || year > B_YEARS[B_YEARS.length - 1] ? `weight for ${year < B_YEARS[0] ? B_YEARS[0] : B_YEARS[B_YEARS.length - 1]}` : null].filter((x) => !!x);
    return { country: c, heightCm, massKg: bmi * (heightCm / 100) ** 2, bmiZ, notes };
}
// A build the story states, as a BMI in the middle of its WHO band (underweight < 18.5, normal 18.5–25, overweight 25–30,
// obese 30–35 shown; ≥ 35 is still obese).
export const BUILDS = { thin: 17.5, average: 22, overweight: 27.5, obese: 32.5 };
/** Where a BMI sits in its sex's distribution for that country and year (z of the log-normal draw above); country unknown:
 * a mean BMI of 24 [ASSUMED, near the world adult mean]. */
export function bmiZOf(bmi, sex, country, year) {
    const s = sex === 'female' ? 1 : 0, c = country ? findCountry(country) : null;
    const mean = c && year ? at(B_YEARS, BODY[c][1][s], year) : 24;
    const sl = Math.sqrt(Math.log(1 + BMI_CV[s] ** 2));
    return (Math.log(bmi / mean) + sl * sl / 2) / sl;
}
