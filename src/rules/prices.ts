// Prices and wages in European cities, 1264–1913, and four Asian cities, 1730–1925 (docs/df-body-engine.md §6.14), from
// Allen 2001 and the GPIH files.
import { PERIODS, GOODS, CPI, CRAFTSMAN, LABOURER } from './data/allen-prices.js';
import { MOATSOS } from './data/moatsos.js';
import { LABOURER as LAB_Y, CRAFTSMAN as CRAFT_Y, CPI as CPI_Y, ASIAWAGE, ASIABASKET, POUND, WORLDWAGE, WORLDBASKET, WORLDSKILLED, WAGE2, SKILLED2, PENCE, PENCESKILLED } from './data/gpih.js';

// Places with wages only (and a bare-bones basket where the source gives one): the four Asian cities, Latin America, India by
// region, Istanbul, Korea.
// British African colonies are paid in pence: g of silver = pence ÷ 240 × the pound's silver that year (POUND).
const silverOf = (s: [number, number][]) => s.map(([y, d]) => { const g = POUND.find(x => x[0] === y)?.[1]; return g ? [y, d / 240 * g] as [number, number] : null; }).filter((x): x is [number, number] => !!x);
const fromPence = (m: Record<string, [number, number][]>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, silverOf(v)]));
const WAGES: Record<string, [number, number][]> = { ...ASIAWAGE, ...WORLDWAGE, ...WAGE2, ...fromPence(PENCE) }, BASKETS = { ...ASIABASKET, ...WORLDBASKET };
const SKILLED: Record<string, [number, number][]> = { ...WORLDSKILLED, ...SKILLED2, ...fromPence(PENCESKILLED) };
const ASIA = Object.keys(WAGES);
export const CITIES = [...new Set([...Object.keys(CPI), ...Object.keys(CPI_Y), ...ASIA, ...Object.keys(MOATSOS)])];
/** Markets only Moatsos & de Zwart 2025 cover: wages come as daily subsistence baskets, not grams of silver. */
export const BASKET_ONLY = Object.keys(MOATSOS).filter(m => !Object.keys(CPI).includes(m) && !Object.keys(CPI_Y).includes(m) && !ASIA.includes(m));
/** What a day's wage buys in daily subsistence baskets (2,100 kcal, fuel, light, clothing, rent) and the days of work a year's basket costs. */
export function basketWage(market: string, skilled: boolean, year: number): { error: string } | { rw: number; daysPerYear: number; at: number; country: string; class: string } {
    const m = MOATSOS[market];
    if (!m) return { error: `No wage data for "${market}".` };
    const s = skilled && m.s.length ? m.s : m.u.length ? m.u : m.s, r = annual(s, year);
    if (!r) return { error: `${market}: wages ${s[0]?.[0]}–${s.at(-1)?.[0]}; the nearest year lies more than 10 years from ${year}.` };
    return { rw: r.v, daysPerYear: 365 / r.v, at: r.at, country: m.c, class: skilled && m.s.length ? 'skilled' : 'unskilled' };
}
export const PRICE_QUESTIONS = ['price of goods', 'daily wage', 'yearly cost of living for one person', 'value of English money'];

// Annual figure of a series, else the nearest year within 10 years [ASSUMED].
function annual(s: [number, number][] | undefined, year: number): { v: number; at: number } | null {
    let best: [number, number] | null = null;
    for (const x of s ?? []) if (Math.abs(x[0] - year) <= 10 && (!best || Math.abs(x[0] - year) < Math.abs(best[0] - year))) best = x;
    return best ? { v: best[1], at: best[0] } : null;
}
/** Grams of pure silver in `pounds` of English money (£ s d as decimal pounds) in `year`, at the mint price, 1273–1977. */
export function poundSilver(pounds: number, year: number): number | null {
    const g = annual(POUND, year);
    return g ? pounds * g.v : null;
}
export const GOODS_LIST = Object.keys(GOODS);
export const TRADES = ['building labourer', 'building craftsman'];
// Table 3 basket per person per year (quantities × Strasbourg prices; Allen's total 414.899 g of silver).
const BASKET = 414.899;
// Heating, light and clothing follow the city's climate (Moatsos & de Zwart 2025, Econ Hum Biol 59:101544, Table 1): per
// person, fuel F = 1.6 mBTU for cooking + the household's heating need / 4 people; candles 2.06 + 0.337 F kg; cloth
// 1.65 + 0.865 F m. Heating need = k × heating degree days below 15.5 °C, from the WMO monthly normals of the city (or its
// nearest listed neighbour: Antwerp as Brussels, Augsburg as Munich, Lwow as Lviv); k = 0.002734 mBTU per degree day per
// household, so Amsterdam's 2,180 degree days give their 3.09 mBTU per person [CALIBRATED]. Allen's fuel (5 mBTU), linen
// (5 m), candles and lamp oil (2.6 kg, 2.6 l) are scaled by each quantity's ratio to Strasbourg's.
const HDD: Record<string, number> = { Antwerp: 2051, Amsterdam: 2180, London: 1642, Florence: 1177, Naples: 866, Valencia: 332, Madrid: 1162, Paris: 1625,
    Strasbourg: 2124, Augsburg: 2651, Leipzig: 2430, Munich: 2651, Vienna: 2170, Gdansk: 2792, Krakow: 2718, Warsaw: 2763, Lwow: 2796, Milan: 1700 };
const fuelOf = (hdd: number) => 1.6 + 0.002734 * hdd / 4;
function climateBasket(city: string): number {
    const f = fuelOf(HDD[city] ?? HDD.Strasbourg), f0 = fuelOf(HDD.Strasbourg), light = (x: number) => 2.06 + 0.337 * x, cloth = (x: number) => 1.65 + 0.865 * x;
    return BASKET + 5 * GOODS['fuel (million BTU)'] * (f / f0 - 1) + 2.6 * (GOODS['candles (kg)'] + GOODS['lamp oil (litre)']) * (light(f) / light(f0) - 1)
        + 5 * GOODS['linen (metre)'] * (cloth(f) / cloth(f0) - 1);
}

// The period's figure, else an adjacent period's (at most 50 years off) [ASSUMED].
function nearest(row: (number | null)[] | undefined, k: number): { v: number; at: number } | null {
    for (const j of [k, k - 1, k + 1]) { const v = row?.[j]; if (v != null) return { v, at: PERIODS[j] }; }
    return null;
}

export type PriceResult = { error: string } | { silver: number; what: string; labourDays: number | null; note: string | null };
/** { silver (g), labourDays, what, note } for one of PRICE_QUESTIONS in `city` in `year`, or { error }. */
export function price(question: string, item: string | undefined, trade = 'building labourer', qty = 1, city: string, year: number): PriceResult {
    if (!CITIES.includes(city)) return { error: `No price data for "${city}". Cities: ${CITIES.join(', ')}.` };
    // Asian cities (Allen, Bassino, Ma, Moll-Murata & van Zanden 2011, Econ Hist Rev 64:8): labourers' silver wages and the
    // bare-bones basket (g of silver per man per year), annual.
    if (ASIA.includes(city)) {
        const craft = trade === 'building craftsman' && SKILLED[city], w = annual(craft ? SKILLED[city] : WAGES[city], year), b = annual(BASKETS[city], year);
        if (question === 'daily wage') {
            if (!w || (trade === 'building craftsman' && !craft)) return { error: `${city}: unskilled labourers' wages only, years with figures ${WAGES[city][0][0]}–${WAGES[city].at(-1)![0]} (nearest within 10 years).` };
            if (craft) return { silver: w.v * qty, what: `${qty} day${qty === 1 ? '' : 's'} of a skilled worker's work`, labourDays: (annual(WAGES[city], year)?.v ?? 0) ? w.v * qty / annual(WAGES[city], year)!.v : null, note: w.at !== year ? `figure for ${w.at}` : null };
            return { silver: w.v * qty, what: `${qty} day${qty === 1 ? '' : 's'} of a labourer's work`, labourDays: qty, note: w.at !== year ? `figure for ${w.at}` : null };
        }
        if (question.startsWith('yearly') && b) return { silver: b.v * qty, what: `A year of bare-bones subsistence for ${qty === 1 ? 'one man' : `${qty} people`}`, labourDays: w ? b.v * qty / w.v : null, note: b.at !== year ? `figure for ${b.at}` : null };
        return { error: `${city}: ${b ? 'daily wage and yearly cost of living' : 'daily wage'} only, near years with figures (${WAGES[city][0][0]}–${WAGES[city].at(-1)![0]}).` };
    }
    if (year < 1264 || year > 1913) return { error: 'European price data cover 1264–1913.' };
    // Annual series (Allen's 1264–1913 files) first, the 50-year tables second.
    const k = Math.max(0, Math.min(PERIODS.length - 1, Math.floor((year - 1500) / 50)));
    const yl = annual(LAB_Y[city], year), lab = yl ?? nearest(LABOURER[city], k);
    let unit: number, at: number, what: string, note: string | null = null;
    if (question === 'daily wage') {
        const craft = trade === 'building craftsman', wy = annual((craft ? CRAFT_Y : LAB_Y)[city], year);
        if (wy) {
            const silver = wy.v * qty;
            return { silver, what: `${qty} day${qty === 1 ? '' : 's'} of a ${trade}'s work`, labourDays: lab ? silver / lab.v : null, note: wy.at !== year ? `figure for ${wy.at}` : null };
        }
        const w = nearest((craft ? CRAFTSMAN : LABOURER)[city], k);
        if (!w) return { error: `No ${trade} wage for ${city} within 50 years of ${year}.` };
        unit = w.v; at = w.at; what = `${qty} day${qty === 1 ? '' : 's'} of a ${trade}'s work`;
    } else {
        // Every good moves with the city's price index [ASSUMED: relative prices as in Strasbourg 1745–1754].
        const cy = annual(CPI_Y[city], year), c = cy ?? nearest(CPI[city], k);
        if (!c) return { error: `No price index for ${city} near ${year}.` };
        if (cy) note = cy.at !== year ? `figure for ${cy.at}` : null;
        const yearly = question.startsWith('yearly');
        if (!yearly && (item == null || GOODS[item] == null)) return { error: `Give item, one of: ${GOODS_LIST.join(', ')}.` };
        unit = (yearly ? climateBasket(city) : GOODS[item!]) * c.v; at = c.at;
        what = yearly ? `A year of necessities for ${qty === 1 ? 'one person' : `${qty} people`}` : `${qty} × ${item}`;
    }
    const silver = unit * qty;
    return { silver, what, labourDays: lab ? silver / lab.v : null, note: note ?? (CPI_Y[city] && question !== 'daily wage' ? null : at !== PERIODS[k] ? `figures for ${at}–${at + 49}` : null) };
}
