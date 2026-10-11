// Prices and wages in European cities, 1500–1913 (docs/df-body-engine.md §6.14), from Allen 2001.
import { PERIODS, GOODS, CPI, CRAFTSMAN, LABOURER } from './data/allen-prices.js';

export const CITIES = Object.keys(CPI);
export const ITEMS = [...Object.keys(GOODS), "a day's work of a building labourer", "a day's work of a building craftsman", 'one person\'s yearly basket of necessities'];
// Table 3 basket per person per year (quantities × Strasbourg prices; Allen's total 414.899 g of silver).
const BASKET = 414.899;

// The period's figure, else an adjacent period's (at most 50 years off) [ASSUMED].
function nearest(row, k) {
    for (const j of [k, k - 1, k + 1]) if (row?.[j] != null) return { v: row[j], at: PERIODS[j] };
    return null;
}

/** { silver (g), labourDays, note } for `qty` of `item` in `city` in `year`, or { error }. */
export function price(item, qty, city, year) {
    if (!CPI[city]) return { error: `No price data for "${city}". Cities: ${CITIES.join(', ')}.` };
    if (year < 1500 || year > 1913) return { error: 'Price data cover 1500–1913.' };
    const k = Math.min(PERIODS.length - 1, Math.floor((year - 1500) / 50));
    const lab = nearest(LABOURER[city], k);
    let unit, at;
    if (item.startsWith("a day's work")) {
        const w = nearest((item.includes('craftsman') ? CRAFTSMAN : LABOURER)[city], k);
        if (!w) return { error: `No ${item.includes('craftsman') ? 'craftsman' : 'labourer'} wage for ${city}.` };
        unit = w.v; at = w.at;
    } else {
        // Every good moves with the city's price index [ASSUMED: relative prices as in Strasbourg 1745–1754].
        const c = nearest(CPI[city], k);
        if (!c) return { error: `No price index for ${city} within 50 years of ${year}.` };
        unit = (item.startsWith('one person') ? BASKET : GOODS[item]) * c.v; at = c.at;
        if (unit == null || Number.isNaN(unit)) return { error: `Unknown item "${item}".` };
    }
    const silver = unit * qty;
    return { silver, labourDays: lab ? silver / lab.v : null, note: at !== PERIODS[k] ? `figures for ${at}–${at + 49}` : null };
}
