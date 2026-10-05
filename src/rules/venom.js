// Venom (docs/df-body-engine.md §5.2). DF decides which bites inject (SPECIALATTACK_INJECT_EXTRACT); the outcome comes from dose:
// R = venom delivered (mg) ÷ (mouse intravenous LD50 mg/kg × victim kg). Delivered venom is log-normal around the species'
// mean yield, its spread from the recorded maximum taken as the 99th percentile. Death when R exceeds one threshold for all
// species, fitted to western diamondback untreated mortality 15 % (10–20 %) for a 70 kg person [fit]. Values from Wikipedia
// species pages citing primary sources.
const Z99 = 2.326;
export const VENOMS = {
    // mean mg, max mg, IV LD50 mg/kg, kind, minutes to collapse (neurotoxic: breathing stops) or to shock / death (haemotoxic)
    RATTLESNAKE: { mean: 300, max: 750, ld50: 2.72, kind: 'hemo', shock: 30, death: 90 },   // western diamondback: 250–350 mg, max 700–800
    BLACK_MAMBA: { mean: 110, max: 400, ld50: 0.325, kind: 'neuro', collapse: 45 },          // 100–120 mg, max 400; collapse within 45 min
    KING_COBRA: { mean: null, max: 420, ld50: 1.28, kind: 'neuro', collapse: 25 },           // up to 420 mg; death in as little as 30 min
    BUSHMASTER: { mean: 305, max: 411, ld50: 1.5, kind: 'hemo', shock: 30, death: 90 },      // 200–411 mg; child: shock at 30 min, dead at 90
    ADDER: { mean: 14, max: 18, ld50: 0.55, kind: 'hemo', shock: 30, death: 90 },            // 10–18 mg (Minton 1974), mean the midpoint [ASSUMED]
    // Painful, not lethal to healthy adults: copperhead (88 bitten, all survived, none needed antivenom), Gila monster ("normally
    // not fatal to healthy adult humans"), platypus spur (pain "can last as long as months").
    COPPERHEAD_SNAKE: { kind: 'pain' }, GILA_MONSTER: { kind: 'pain' }, PLATYPUS: { kind: 'pain' },
};
// Giant forms and animal people use the base species' venom [ASSUMED].
const base = id => [id, id.replace(/^GIANT_|, GIANT$|_MAN$| MAN$/, '')].find(k => VENOMS[k]);
// Spread: ln(max ÷ mean) ÷ 2.326; a species without a mean takes the rattlesnake spread [ASSUMED].
const sigma = v => v.mean ? Math.log(v.max / v.mean) / Z99 : Math.log(750 / 300) / Z99;
const median = v => v.mean ?? v.max / Math.exp(Z99 * sigma(v));
// Fit: P(R > T) = 0.15 for a 70 kg person bitten by a western diamondback.
const RS = VENOMS.RATTLESNAKE;
export const LETHAL_R = RS.mean / (RS.ld50 * 70) * Math.exp(1.0364 * sigma(RS));
// Haemotoxic deaths: shock and death times observed in a bushmaster case, used for both vipers [ASSUMED].

/** The venom course for a bite by `species` on a victim of `mass` kg, or null when DF gives no venom data. */
export function envenom(species, mass, gauss) {
    const id = base(species), v = VENOMS[id];
    if (!v) return null;
    if (v.kind === 'pain') return { species: id, kind: 'pain', fatal: false, min: 0 };
    const mg = median(v) * Math.exp(sigma(v) * gauss());
    const r = mg / (v.ld50 * mass);
    return { species: id, mg: Math.round(mg), ratio: Math.round(r / LETHAL_R * 100) / 100, fatal: r > LETHAL_R, kind: v.kind, min: 0,
        collapse: v.collapse ?? null, shock: v.shock ?? null, death: v.death ?? null };
}
