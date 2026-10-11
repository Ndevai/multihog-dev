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
export const BATTLE_YEARS = [ERAS[0].from, ERAS.at(-1).to];

/** Share of such attacks that succeed, or null outside the data's years. */
export function attackWinShare(attackers, defenders, year) {
    const e = ERAS.find(x => year >= x.from && year <= x.to);
    if (!e || !(attackers > 0) || !(defenders > 0)) return null;
    const r = attackers / defenders;
    return e.bands.find(([upTo]) => r < upTo)[1];
}
