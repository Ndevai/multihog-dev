// Prices and wages in European cities, 1500–1913 (docs/df-body-engine.md §6.14), from Allen 2001.
import { PERIODS, GOODS, CPI, CRAFTSMAN, LABOURER } from './data/allen-prices.js';

export const CITIES = Object.keys(CPI);
export const PRICE_QUESTIONS = ['price of goods', 'daily wage', 'yearly cost of living for one person'];
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
    if (!CPI[city]) return { error: `No price data for "${city}". Cities: ${CITIES.join(', ')}.` };
    if (year < 1500 || year > 1913) return { error: 'Price data cover 1500–1913.' };
    const k = Math.min(PERIODS.length - 1, Math.floor((year - 1500) / 50));
    const lab = nearest(LABOURER[city], k);
    let unit: number, at: number, what: string;
    if (question === 'daily wage') {
        const craft = trade === 'building craftsman', w = nearest((craft ? CRAFTSMAN : LABOURER)[city], k);
        if (!w) return { error: `No ${trade} wage for ${city} within 50 years of ${year}.` };
        unit = w.v; at = w.at; what = `${qty} day${qty === 1 ? '' : 's'} of a ${trade}'s work`;
    } else {
        // Every good moves with the city's price index [ASSUMED: relative prices as in Strasbourg 1745–1754].
        const c = nearest(CPI[city], k);
        if (!c) return { error: `No price index for ${city} within 50 years of ${year}.` };
        const yearly = question.startsWith('yearly');
        if (!yearly && (item == null || GOODS[item] == null)) return { error: `Give item, one of: ${GOODS_LIST.join(', ')}.` };
        unit = (yearly ? climateBasket(city) : GOODS[item!]) * c.v; at = c.at;
        what = yearly ? `A year of necessities for ${qty === 1 ? 'one person' : `${qty} people`}` : `${qty} × ${item}`;
    }
    const silver = unit * qty;
    return { silver, what, labourDays: lab ? silver / lab.v : null, note: at !== PERIODS[k] ? `figures for ${at}–${at + 49}` : null };
}
