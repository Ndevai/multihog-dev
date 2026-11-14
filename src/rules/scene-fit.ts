// The tools' words as the scene's year and world allow them. A word in a model's context raises its own chance of being
// written (induction heads copy the token that followed an earlier one: Olsson et al. 2022, arXiv 2209.11895), so each
// model is shown only the options, arguments and tools that can occur in the scene it writes for: an 1850 scene is shown
// no ensemble with sneakers, no antibiotics and no survey of 2017–2022; a world without magic no adamantine. A value is
// kept from its first year on (and up to its last, where it has one); an unknown year keeps every value.
import type { Prop, Props } from './tool-schema.js';
import { CITIES, price, basketWage } from './prices.js';

export interface Scene { year: number | null; magic: boolean; country?: string | null }
type Span = readonly [number | null, number | null];
const from = (y: number): Span => [y, null];
/** Hand guns in Europe [ASSUMED: from 1350]: the gunshot's sound and the handgun shot's line of the brief start then. */
export const GUN_YEAR = 1350;

/** Option values by tool and argument path ('Tool.arg', 'Tool.arg.sub' inside a list or an object), with their years. */
export const VALUE_YEARS: Record<string, Record<string, Span>> = {
    // Treatments by the year they first worked as the engine models them: blood groups for a safe transfusion (Landsteiner
    // 1901), snake antivenom (Calmette 1895), penicillin's first patient (Oxford 1941), the first abdominal operation survived
    // (McDowell 1809), oxygen therapy (Haldane 1917), hyperbaric oxygen in surgery (Boerema 1956).
    'BodyTreat.treatment': { transfuse: from(1901), antivenom: from(1895), antibiotics: from(1941), laparotomy: from(1809), oxygen: from(1917), hyperbaric_oxygen: from(1956) },
    // Each drug from its first medical use (adrenaline isolated by Takamine 1901; succinylcholine 1951; ketamine approved
    // 1970; lorazepam 1977; midazolam 1982; propofol 1986; rocuronium 1994).
    'Dose.substance': { 'Epinephrine:IM': from(1901), 'Succinylcholine:IM': from(1951), 'Ketamine:IM': from(1970), 'Lorazepam:IM': from(1977), 'Midazolam:IM': from(1982), 'Propofol:IV': from(1986), 'Rocuronium:IV': from(1994) },
    // General anaesthesia from Morton's ether demonstration (Boston, 1846).
    'Sickness.situation': { 'waking after surgery under general anaesthesia': from(1846) },
    // The World Values Survey answers held are from 2017–2022, and the tool decides condemnation from 2000 on (rules-tools.ts).
    'SocialResponse.situation': { 'an act they see or hear of that they may condemn outright': from(2000) },
    // Electric light in homes and offices, the levels vision.ts holds for them [ASSUMED: from the 1880s]; asphalt paving
    // [ASSUMED: Paris, 1854].
    'Look.light': { 'living room': from(1880), office: from(1880) },
    'Look.against': { 'an asphalt road': from(1854) },
    // SARS first appeared in November 2002.
    'Disease.disease': { SARS: from(2002) },
    // Faiths from their founding: the Reformation (1517), the Act of Supremacy (1534), Guru Nanak's teaching [ASSUMED: about
    // 1500], Bahá'u'lláh's declaration (1863), the Ahmadiyya movement (1889).
    'Claim.faith': { 'protestant christian': from(1517), 'anglican christian': from(1534), sikh: from(1500), "baha'i": from(1863), 'ahmadiyya muslim': from(1889) },
    // Price & Bouffard's 1974 situations, from when each exists: the omnibus (Paris 1828), the passenger lift (Otis 1857), the
    // first football game (1869), the cinema (Lumière 1895); dormitory lounges, job interviews and public restrooms
    // [ASSUMED: from 1900].
    'Claim.situation': { bus: from(1828), elevator: from(1857), 'football game': from(1869), movies: from(1895), 'dorm lounge': from(1900), 'job interview': from(1900), restroom: from(1900) },
    // Aluminium from the Hall–Héroult process (1886); mild steel from Bessemer's converter (1856); gypsum board [ASSUMED: 1916].
    'BodyContact.material': { aluminium: from(1886) },
    'Break.material': { 'mild steel': from(1856), 'gypsum board': from(1916) },
    'Room.lining': { 'gypsum board': from(1916) },
    // A gunshot from GUN_YEAR; the passing vehicle's 88 dB is a motor vehicle's [ASSUMED: from 1890].
    'Listen.sound': { 'gunshot (171 dB at 1 m)': from(GUN_YEAR), 'passing vehicle (88 dB at 1 m)': from(1890) },
    'BodyStrike.noise_sound': { 'gunshot (171 dB at 1 m)': from(GUN_YEAR), 'passing vehicle (88 dB at 1 m)': from(1890) },
    // Garments of the measured list worn only in modern dress [ASSUMED: the decade each came into wear in the West].
    'BodyEnvironment.garments.name': {
        bra: from(1914), 'panty hose': from(1959), 't-shirt': from(1913), sweatpants: from(1920), 'long-sleeve sweat shirt': from(1926), 'short shorts': from(1930),
        'walking shorts': from(1900), 'ankle socks': from(1920), 'short-sleeve hospital gown': from(1900), 'half slip': from(1900), 'full slip': from(1900),
        'short-sleeve pajamas': from(1870), 'long-sleeve pajamas (thick)': from(1870), overalls: from(1850), coveralls: from(1900), 'short-sleeve knit shirt': from(1920),
        'sleeveless scoop-neck blouse': from(1920), 'sleeveless, scoop-neck shirt (thin)': from(1920), 'sleeveless, scoop-neck shirt (thick)': from(1920),
    },
};
/** Lists whose values carry their own years in the label: coins in circulation (both ends), epidemics (from their start). */
const LABEL_YEARS: Record<string, 'both' | 'start'> = { 'Look.kind': 'both', 'Disease.epidemic': 'start' };
/** Arguments that exist only in some years. */
export const ARG_YEARS: Record<string, Span> = {
    // The measured ensembles are modern dress (bra, T-shirt, jeans, sneakers) [ASSUMED: from 1960].
    'BodyEnvironment.ensemble': from(1960),
    // The data's own years (prices.ts): hourly pay of a trade 1953–2008, a country's daily wage 1820–2008.
    'Price.trade_name': [1953, 2008], 'Price.country': [1820, 2008],
    'SocialResponse.act': from(2000),
    // A handgun shot's arguments from GUN_YEAR.
    'BodyCheck.shot_m': from(GUN_YEAR), 'BodyCheck.shot_at': from(GUN_YEAR), 'BodyCheck.under_fire': from(GUN_YEAR),
};
/** Tools whose data cover some years only: Battle's engagements 1600–1991 (CDB90), NameCharacter's births 1910–2029 (US Social
 *  Security), Price's markets 1209–2008. */
export const TOOL_YEARS: Record<string, Span> = { Battle: [1600, 1991], NameCharacter: from(1910), Price: [1209, 2008] };
/** Option values of a world with magic only (Dwarf Fortress's adamantine). */
const MAGIC_VALUES: Record<string, readonly string[]> = { 'BodyStrike.material': ['adamantine'] };

const inSpan = ([a, b]: Span, y: number | null) => y == null || ((a == null || y >= a) && (b == null || y <= b));
const labelSpan = (v: string, how: 'both' | 'start'): Span => {
    const m = v.match(/(\d{3,4})–(\d{3,4})/);
    return m ? [Number(m[1]), how === 'both' ? Number(m[2]) : null] : [null, null];
};
// A market is in the scene when the price data hold its daily wage, its bread or its basket that year (prices.ts answers
// within 10 years of a year with figures).
const CITY_CACHE = new Map<number, Set<string>>();
function citiesIn(year: number): Set<string> {
    let s = CITY_CACHE.get(year);
    if (!s) {
        const fits = (c: string) => ['daily wage', 'price of goods'].some(q => !('error' in price(q, q === 'price of goods' ? 'bread (kg)' : undefined, 'building labourer', 1, c, year))) || !('error' in basketWage(c, false, year));
        s = new Set(CITIES.filter(fits)); CITY_CACHE.set(year, s);
    }
    return s;
}
/** Whether an option value can occur in the scene. */
export function valueFits(path: string, value: string, scene: Scene): boolean {
    if (MAGIC_VALUES[path]?.includes(value) && !scene.magic) return false;
    const span = VALUE_YEARS[path]?.[value] ?? (LABEL_YEARS[path] ? labelSpan(value, LABEL_YEARS[path]!) : null);
    if (span && !inSpan(span, scene.year)) return false;
    if (path === 'Price.city' && scene.year != null) return citiesIn(scene.year).has(value);
    return true;
}
/** Tools whose data cover one country: NameCharacter's US birth records. An unknown country keeps them. */
export const TOOL_COUNTRIES: Record<string, RegExp> = { NameCharacter: /^(united states|usa|us|america)\b/i };
export const toolYearsFit = (tool: string, scene: Scene) => (!TOOL_YEARS[tool] || inSpan(TOOL_YEARS[tool]!, scene.year)) && (!TOOL_COUNTRIES[tool] || !scene.country || TOOL_COUNTRIES[tool]!.test(scene.country));
/** A tool's arguments as the scene allows them: values and arguments outside it left out; null when a required argument has
 *  nothing left (the tool cannot be used in this scene). */
export function fitProps(tool: string, props: Props, required: readonly string[], scene: Scene): Props | null {
    const fit = (path: string, p: Prop): Prop | null => {
        if (ARG_YEARS[path] && !inSpan(ARG_YEARS[path]!, scene.year)) return null;
        if (p.type === 'string' && p.enum) {
            const kept = p.enum.filter(v => valueFits(path, v, scene));
            return kept.length ? (kept.length === p.enum.length ? p : { ...p, enum: kept }) : null;
        }
        if (p.type === 'array') { const it = fit(path, p.items); return it ? (it === p.items ? p : { ...p, items: it }) : null; }
        if (p.type === 'object') {
            const sub = fitAll(path, p.properties, p.required ?? []);
            return sub ? (sub === p.properties ? p : { ...p, properties: sub, required: (p.required ?? []).filter(k => k in sub) }) : null;
        }
        return p;
    };
    const fitAll = (path: string, ps: Props, req: readonly string[]): Props | null => {
        let changed = false; const out: Props = {};
        for (const [k, p] of Object.entries(ps)) {
            const q = fit(`${path}.${k}`, p);
            if (q !== p) changed = true;
            if (q) out[k] = q; else if (req.includes(k)) return null;
        }
        return changed ? out : ps;
    };
    if (!toolYearsFit(tool, scene)) return null;
    return fitAll(tool, props, required);
}
