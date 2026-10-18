import { equivalentAltitude } from './thermal/altitude.js';
import { setAltitude, setEnvironment } from './body-engine.js';
// Air changes per hour of homes: lognormal, median 0.45, 10th percentile 0.18 (US EPA Exposure Factors Handbook 2011, ch. 19,
// Table 19-1, from 2,844 tracer-gas measurements, Koontz & Rector 1995; Murray & Burmaster 1995 found the measurements well
// fitted by lognormal distributions) → σ = ln(0.45 ÷ 0.18) ÷ 1.2816 = 0.715. Drawn once per room. [ASSUMED: holds for any
// era and country; older houses were leakier, open windows far higher.]
export const drawAch = (gauss) => 0.45 * Math.exp(0.715 * gauss());
// Fire fuels, mass % of the burning fuel. Wood: C 50, H 6, O 44 (Speight, Synthetic Fuels Handbook, Table D.1, dry). Charcoal:
// taken as pure carbon [ASSUMED]. Carbon monoxide per kg burnt in household stoves: charcoal 276 g (IPCC Emission Factor
// Database meeting report, India, Annex 7: TERI / US EPA stove tests); other solid fuels 15–85 g, wood lower than dung and
// crop residues (same report) → 50 g used for wood, peat, lignite, coal [ASSUMED midpoint]. Liquids and gases (a lamp, a gas
// ring) burn to CO2 unless given [ASSUMED].
export const FIRE_FUELS = {
    wood: { C: 50, H: 6, O: 44, coEF: 50, note: 'CO 50 g/kg [ASSUMED midpoint of 15–85]' },
    charcoal: { C: 100, H: 0, O: 0, coEF: 276, note: 'CO 276 g/kg (stove tests); pure carbon [ASSUMED]' },
    peat: { C: 55, H: 6, O: 38, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' }, lignite: { C: 68, H: 5, O: 25, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' },
    'bituminous coal': { C: 78, H: 5, O: 13, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' },
};
const MOLAR_L = 24.04; // litres per mole of gas at 20 °C, 1 atm
export const OUT_O2 = 20.95;
/** One minute of air in a room, with the people in it (each breathing out CO2 by their oxygen use). */
export function airMinute(r, people) {
    let co2 = 0, co = 0, o2 = 0; // litres of gas per minute added (o2 negative)
    for (const f of r.fires) {
        const g = f.kgh * 1000 / 60, molC = g * f.C / 100 / 12.011, molCO = Math.min(molC, g * f.coEF / 1000 / 28.01);
        const molO2 = (molC - molCO) + molCO / 2 + g * f.H / 100 / 1.008 / 4 - g * f.O / 100 / 15.999 / 2;
        co2 += (molC - molCO) * MOLAR_L;
        co += molCO * MOLAR_L;
        o2 -= Math.max(0, molO2) * MOLAR_L;
    }
    // Breathing: VO2 = METs × 3.5 mL/kg/min; CO2 out = 0.85 × VO2 (respiratory exchange ratio of a mixed diet [ASSUMED]).
    for (const p of people) {
        if (p.dead)
            continue;
        const vo2 = (p.workMet ?? 1) * 3.5 * p.mass / 1000;
        o2 -= vo2;
        co2 += 0.85 * vo2;
    }
    const lam = r.ach / 60, V = r.m3 * 1000; // litres
    const step = (c, out, addL, unit) => {
        const G = addL / V * unit; // concentration units per minute
        if (lam <= 0)
            return c + G;
        const eq = out + G / lam;
        return eq + (c - eq) * Math.exp(-lam);
    };
    r.co = step(r.co, r.out.co, co, 1e6);
    r.co2 = step(r.co2, r.out.co2, co2, 1e6);
    r.o2 = step(r.o2, OUT_O2, o2, 100);
}
/** The room's air into each person in it: carbon monoxide, and low oxygen as the equivalent altitude (§6.6). */
export function breathe(r, p) {
    if (!p.env)
        setEnvironment(p, { air_c: r.air_c });
    p.env.co = r.co;
    if (r.o2 < 20.9) {
        p.baseAlt ??= p.altitude?.m ?? 0;
        const m = Math.round(equivalentAltitude(r.o2, p.baseAlt));
        if (Math.abs((p.altitude?.m ?? 0) - m) >= 50)
            setAltitude(p, m, true);
    }
}
export const roomOf = (st, p) => (p.at && st.rooms?.[p.at]) || null;
/** The per-minute hook for advanceAll: every room's air moves one minute and its occupants breathe it. */
export function airHook(st) {
    if (!st.rooms || !Object.keys(st.rooms).length)
        return null;
    return () => {
        for (const [name, r] of Object.entries(st.rooms)) {
            const inside = Object.values(st.people ?? {}).filter(p => p.at === name);
            airMinute(r, inside);
            for (const p of inside) {
                breathe(r, p);
                p.airFrom = name;
            }
        }
        // Out of a tracked room: back to clean outside air.
        for (const p of Object.values(st.people ?? {}))
            if (p.airFrom && p.at !== p.airFrom && !(p.at && st.rooms[p.at])) {
                if (p.env)
                    p.env.co = 0;
                if (p.baseAlt != null) {
                    setAltitude(p, p.baseAlt);
                    p.baseAlt = null;
                }
                p.airFrom = null;
            }
    };
}
export const describeAir = (name, r) => `${name}: ${r.m3} m³, ${r.ach.toFixed(2)} air changes/h; CO ${Math.round(r.co)} ppm, CO2 ${Math.round(r.co2)} ppm, O2 ${r.o2.toFixed(1)} %${r.fires.length ? `; burning ${r.fires.map(f => `${f.fuel} ${f.kgh} kg/h (${f.note})`).join(', ')}` : ''}`;
