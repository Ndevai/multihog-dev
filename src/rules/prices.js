// Prices and wages in European cities, 1500–1913 (docs/df-body-engine.md §6.14), from Allen 2001.
import { PERIODS, GOODS, CPI, CRAFTSMAN, LABOURER } from './data/allen-prices.js';

export const CITIES = Object.keys(CPI);
export const PRICE_QUESTIONS = ['price of goods', 'daily wage', 'yearly cost of living for one person'];
export const GOODS_LIST = Object.keys(GOODS);
export const TRADES = ['building labourer', 'building craftsman'];
// Table 3 basket per person per year (quantities × Strasbourg prices; Allen's total 414.899 g of silver).
const BASKET = 414.899;

// The period's figure, else an adjacent period's (at most 50 years off) [ASSUMED].
function nearest(row, k) {
    for (const j of [k, k - 1, k + 1]) if (row?.[j] != null) return { v: row[j], at: PERIODS[j] };
    return null;
}

/** { silver (g), labourDays, what, note } for one of PRICE_QUESTIONS in `city` in `year`, or { error }. */
export function price(question, item, trade = 'building labourer', qty = 1, city, year) {
    if (!CPI[city]) return { error: `No price data for "${city}". Cities: ${CITIES.join(', ')}.` };
    if (year < 1500 || year > 1913) return { error: 'Price data cover 1500–1913.' };
    const k = Math.min(PERIODS.length - 1, Math.floor((year - 1500) / 50));
    const lab = nearest(LABOURER[city], k);
    let unit, at, what;
    if (question === 'daily wage') {
        const craft = trade === 'building craftsman', w = nearest((craft ? CRAFTSMAN : LABOURER)[city], k);
        if (!w) return { error: `No ${trade} wage for ${city} within 50 years of ${year}.` };
        unit = w.v; at = w.at; what = `${qty} day${qty === 1 ? '' : 's'} of a ${trade}'s work`;
    } else {
        // Every good moves with the city's price index [ASSUMED: relative prices as in Strasbourg 1745–1754].
        const c = nearest(CPI[city], k);
        if (!c) return { error: `No price index for ${city} within 50 years of ${year}.` };
        const yearly = question.startsWith('yearly');
        if (!yearly && GOODS[item] == null) return { error: `Give item, one of: ${GOODS_LIST.join(', ')}.` };
        unit = (yearly ? BASKET : GOODS[item]) * c.v; at = c.at;
        what = yearly ? `A year of necessities for ${qty === 1 ? 'one person' : `${qty} people`}` : `${qty} × ${item}`;
    }
    const silver = unit * qty;
    return { silver, what, labourDays: lab ? silver / lab.v : null, note: at !== PERIODS[k] ? `figures for ${at}–${at + 49}` : null };
}
