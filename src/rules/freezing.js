// Whether water cooled below its melting point freezes (docs/df-body-engine.md §6.19, 2026-10-28 (112)). Water does not turn
// to ice because a thermometer reads below 0 °C: a crystal has to start in it first, and until one does it stays a supercooled
// liquid. What drives a crystal to start is how much more readily H2O molecules leave the liquid than leave ice: the water
// activity a_w (1 for pure water) against ice's, a_w,ice(T) = p_ice(T) ÷ p_liquid(T), the ratio of the two vapour pressures
// (Koop, Luo, Tsias & Peter 2000, Nature 406:611). Ice melts where a_w = a_w,ice(T): 0.0 °C for pure water. Below that, the
// gap Δa_w = a_w − a_w,ice(T) sets how often crystals start:
// - by themselves (homogeneous): log10 J = −906.7 + 8502 Δa_w − 26 924 Δa_w² + 29 180 Δa_w³, J per cm³ per s (Koop et al.
//   2000; fitted 0.26 < Δa_w < 0.36, monotonic outside). Check: a 10 µm droplet has a 50 % chance in 1 s at −37.1 °C.
// - on particles in the water (heterogeneous): fallen snow's meltwater holds n(T) = e^(−0.7 T − 6.02) particles per mL that
//   start ice at T °C or warmer (Brennan, David & Borduas-Dedekind 2020, Atmos Chem Phys 20:163, 88 samples; fitted 0.2–90
//   per mL, −6.3 to −15.0 °C; outside that the fit is extrapolated) [ASSUMED: rain, lake, river and tap water hold the same
//   spectrum]. A particle starts ice at a fixed gap Δa_w from the
//   melting curve, whatever is dissolved (Zobrist, Marcolli, Peter & Koop 2008, J Phys Chem A 112:3965), so n is read at the
//   pure-water temperature of the same gap. Check: 0.05 mL drops (their wells) freeze half at −12.4 °C; their mean −12.5.
// - at once from ice it touches (frost, snow, a crystal falling in): the crystal is already there.
// A volume V (mL) held t seconds freezes with P = 1 − exp(−(n·V + J·V·t)), so the same water at −1 °C stays liquid as a cloud
// droplet (P 3 × 10⁻¹²) and freezes as a litre (P 99 %). Once ice starts, the heat of fusion it releases warms the rest back
// to the melting point: a share c_p ΔT ÷ L freezes at once (L 333.6 J/g, c_p 4.22 J/(g·K): Wikipedia "Enthalpy of fusion",
// "Properties of water"), the rest as the cold draws heat out.
import { def } from './constants.js';
/** Vapour pressure over ice, Pa (Murphy & Koop 2005, Q J R Meteorol Soc 131:1539, T above 110 K). */
export const iceVp = (T) => Math.exp(9.550426 - 5723.265 / T + 3.53068 * Math.log(T) - 0.00728332 * T);
/** Vapour pressure over liquid water, supercooled too, Pa (Murphy & Koop 2005, 123–332 K). */
export const liquidVp = (T) => Math.exp(54.842763 - 6763.22 / T - 4.210 * Math.log(T) + 0.000367 * T
    + Math.tanh(0.0415 * (T - 218.8)) * (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T));
/** Water activity of ice at T K: the a_w of a liquid in equilibrium with ice. */
export const iceActivity = (T) => iceVp(T) / liquidVp(T);
const bisect = (f, a, b) => {
    let fa = f(a);
    for (let i = 0; i < 80; i++) {
        const m = (a + b) / 2, fm = f(m);
        if (fa * fm <= 0)
            b = m;
        else {
            a = m;
            fa = fm;
        }
    }
    return (a + b) / 2;
};
/** Melting point of ice in a liquid of water activity `aw`, K. The vapour-pressure curves meet at the triple point (0.01 °C);
 *  at 1 atm, with air dissolved, ice melts at 0.00 °C, so the result is shifted by that 0.01 K. */
export const iceMeltK = (aw = 1) => bisect(T => aw - iceActivity(T), 150, 273.2) - 0.01;
/** The gap a_w − a_w,ice(T): 0 at the melting point, larger the colder. */
const gap = (T, aw) => aw - iceActivity(T + 0.01);
/** Crystals starting by themselves, per cm³ per s. */
export function selfRate(T, aw = 1) {
    const d = gap(T, aw);
    return d <= 0 ? 0 : 10 ** (-906.7 + 8502 * d - 26924 * d * d + 29180 * d ** 3);
}
/** Particles that start ice at T or warmer, per mL of natural water; `extrapolated` outside the fitted −6.3 to −15.0 °C. */
export function particlesPerMl(T, aw = 1) {
    const d = gap(T, aw);
    if (d <= 0)
        return { n: 0, atC: 0, extrapolated: false };
    const pure = bisect(x => 1 - iceActivity(x + 0.01) - d, 150, 273.15), c = pure - 273.15;
    return { n: Math.exp(-0.7 * c - 6.02), atC: c, extrapolated: c > -6.3 || c < -15.0 };
}
export const CONTENTS = ['natural water: rain, snow, a lake, a river, a tap, a drink', 'distilled or filtered water', 'touching ice, frost or snow'];
def({ id: 'coldHoldMin', value: 1, unit: 'minutes water is taken to have been at the temperature, when the call gives none', status: 'assumed', src: 'counts only for crystals starting by themselves, 27 times as often for every 1 K colder near −37 °C (Koop et al. 2000): 1 to 60 min moves the freezing point of clean drops by 1.2 K', range: [0.1, 60], file: 'freezing.ts' });
const L_J_PER_G = 333.6, CP_J_PER_GK = 4.22;
/** The chance that `ml` mL of liquid water at `c` °C, held `seconds`, freezes, and the share that freezes at once if it does. */
export function freezeChance(c, ml, seconds, contents, aw = 1) {
    const T = c + 273.15, meltC = iceMeltK(aw) - 273.15, below = meltC - c;
    const atOnce = Math.min(1, Math.max(0, CP_J_PER_GK * below / L_J_PER_G));
    if (below <= 0)
        return { meltC, p: 0, n: 0, self: 0, extrapolated: false, atOnce: 0 };
    if (contents === 'touching ice, frost or snow')
        return { meltC, p: 1, n: 0, self: 0, extrapolated: false, atOnce };
    const het = contents === 'distilled or filtered water' ? { n: 0, extrapolated: false } : particlesPerMl(T, aw);
    const self = selfRate(T, aw);
    const p = 1 - Math.exp(-(het.n * ml + self * ml * seconds));
    return { meltC, p, n: het.n, self, extrapolated: het.extrapolated, atOnce };
}
