// First names drawn from US birth-name frequencies (docs/df-body-engine.md §6.11).
import { NAMES } from './data/us-names.js';
const parsed = {};
function list(decade, sex) {
    const k = `${decade}${sex}`;
    return parsed[k] ??= NAMES[decade][sex].split(' ').map((x) => { const [n, c] = x.split(':'); return [n, +c]; });
}
const DECADES = Object.keys(NAMES).map(Number);
/** A first name for someone of `sex` born in `birthYear`, weighted by how many US babies got it that decade; null outside 1910–2029. */
export function drawName(sex, birthYear, rng = Math.random) {
    const d = Math.floor(birthYear / 10) * 10;
    if (!DECADES.includes(d))
        return null;
    const rows = list(d, sex === 'female' ? 'F' : 'M');
    let u = rng() * rows.reduce((s, r) => s + r[1], 0);
    for (const [n, c] of rows)
        if ((u -= c) < 0)
            return n;
    return rows[rows.length - 1][0];
}
