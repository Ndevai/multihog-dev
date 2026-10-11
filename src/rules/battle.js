import { CDB90 } from './data/cdb90.js';
// Whether an attack on a defended position succeeds, from the force ratio (attackers ÷ defenders) and the era
// (docs/df-body-engine.md §6.18). Shares of attacker wins in historical engagements, Dupuy Institute databases as published
// by C. A. Lawrence ("Force Ratios" posts, dupuyinstitute.org, from War by Numbers 2017): Battles Data Base, 243 battles
// 1600–1900; Division-level Engagement Data Base, 672 engagements 1904–1991, full set. Adjacent ratio bands with fewer than
// 30 cases are merged, cases weighted [stated process].
// Before 1900 the ratio barely changes the result: 54 % at under 1 to 1, 60 % at 2 to 1 or more.
const ERAS = [
    { from: 1600, to: 1900, bands: [[1, 0.54], [2, 0.584], [Infinity, 0.60]] },
    { from: 1901, to: 1991, bands: [[1, 0.39], [1.5, 0.55], [2, 0.59], [2.5, 0.71], [3, 0.83], [3.5, 0.69], [4, 0.77], [6, 0.65], [Infinity, 0.95]] },
];
export const BATTLE_YEARS = [ERAS[0].from, ERAS[ERAS.length - 1].to];
// Surprise by the attacker (CDB90 SURPA ≥ 1, minor to complete, coded by HERO historians after the fact): attacker wins
// 1600–1900 74 % (n 61) against 56 % without (n 162); 1901–1973 82 % (n 105) against 64 % (n 271). Applied as the log-odds
// shift between the two, added to the force-ratio share [ASSUMED: the two effects independent].
const SURPRISE_SHIFT = [Math.log(0.74 / 0.26) - Math.log(0.56 / 0.44), Math.log(0.82 / 0.18) - Math.log(0.64 / 0.36)];
/** Share of such attacks that succeed, or null outside the data's years. */
export function attackWinShare(attackers, defenders, year, surprise = false) {
    const e = ERAS.find(x => year >= x.from && year <= x.to);
    if (!e || !(attackers > 0) || !(defenders > 0))
        return null;
    const r = attackers / defenders;
    const p = e.bands.find(([upTo]) => r < upTo)[1];
    if (!surprise)
        return p;
    const z = Math.log(p / (1 - p)) + SURPRISE_SHIFT[year <= 1900 ? 0 : 1];
    return 1 / (1 + Math.exp(-z));
}
// Casualties and duration (§6.18): copied from one real battle of the same era and outcome, drawn at random among the 10
// whose force ratio and total size are nearest (distance = |Δ ln ratio| + |Δ ln size|) [ASSUMED: k and equal weights].
// Casualty fractions fall with force size and differ by outcome (CDB90; Dupuy's attrition verities 3 and 4), so both enter.
const K = 10;
export function battleCost(attackers, defenders, year, won, rng) {
    const rows = CDB90[year <= 1900 ? '1600-1900' : '1901-1973'][won ? 'won' : 'lost'];
    const lr = Math.log(attackers / defenders), ls = Math.log(attackers + defenders);
    const near = rows.map(r => [Math.abs(Math.log(r[0] / r[1]) - lr) + Math.abs(Math.log(r[0] + r[1]) - ls), r])
        .sort((a, b) => a[0] - b[0]).slice(0, K);
    const [, [, , af, df, hours]] = near[Math.floor(rng() * near.length)];
    return { attackerLoss: Math.round(af * attackers), defenderLoss: Math.round(df * defenders), hours };
}
