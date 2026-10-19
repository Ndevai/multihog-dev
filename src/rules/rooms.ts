// Air in a room (docs/df-body-engine.md §6.22): a well-mixed box. Each minute every gas follows
// dC/dt = G ÷ V − λ (C − C_outside), solved exactly over the minute (C_eq = C_outside + G ÷ (λ V); C ← C_eq + (C − C_eq) e^(−λ)),
// λ = air changes per hour ÷ 60. Sources come from the atoms: a fire's fuel gives CO2 and takes O2 by its elements; people
// breathe out CO2 from their oxygen use. Gases heavier than air (molar mass above 29 g/mol) collect low, lighter ones high;
// the box holds the room average only.
import type { Person, RuleState } from './types.js';
import { equivalentAltitude } from './thermal/altitude.js';
import { setAltitude, setEnvironment } from './body-engine.js';
import type { Rng } from './types.js';

export interface Fire { fuel: string; kgh: number; C: number; H: number; O: number; coEF: number; note: string; lhv?: number }
export interface Room { m3: number; ach: number; co: number; co2: number; o2: number; out: { co: number; co2: number }; air_c: number; fires: Fire[];
    /** Fire heat (§6.22): height m, floor m², wall lining, an opening (door or window), minutes since the fire began, hot layer °C, layer interface height m. */
    h?: number; floor?: number; lining?: string; vent?: { m2: number; h: number } | null; fireMin?: number; hot?: number; layer?: number; base_c?: number }

// Heat of a room fire (§6.22). Heat release Q (kW) = fuel burnt per second × its lower heating value (§6.19, from its elements
// and water) [ASSUMED: complete heat release]. With an opening: hot-layer temperature rise by McCaffrey, Quintiere & Harkleroad
// (1981), ΔT = 6.85 [Q² ÷ (A_o √H_o · A_T h_k)]^(1/3), h_k = √(kρc ÷ t) until the heat soaks through the wall
// (t_p = (ρc ÷ k)(δ ÷ 2)²), then k ÷ δ (US NRC NUREG-1805, ch. 2). Closed room: one-zone heat balance, ρ c_p V dT/dt = Q −
// h_k A_T (T − T0) − leak (ACH) [stated process]. Smoke layer in a closed room: interface height
// z = [2 k Q^(1/3) t ÷ (3 A) + h^(−2/3)]^(−3/2), k = 0.076 ÷ ρ_g, ρ_g = 353 ÷ T_g (Yamana & Tanaka 1985, as given in
// NUREG-1805 ch. 2); with an opening the layer is held at the opening's top [ASSUMED]. A person whose head (1.6 m standing,
// 0.3 m lying [ASSUMED]) is in the layer breathes the layer's temperature; everyone gets its radiant temperature overhead
// [ASSUMED: view factors, below]. Flashover when the layer passes 600 °C (the usual criterion, NUREG-1805 ch. 2) [stated].
// Lining k (kW/m·K), ρ (kg/m³), c (kJ/kg·K), thickness δ (m): concrete 0.0016, 2400, 0.75 (NUREG-1805 worksheet);
// gypsum board 0.00017, 960, 1.1; brick 0.0008, 2600, 0.8; pine 0.00014, 640, 2.85 [RAW: recalled from NUREG-1805 Table 2-3,
// not checked]; thickness concrete 0.15, brick 0.2, gypsum 0.016, pine 0.02 [ASSUMED].
export const LINING: Record<string, { k: number; rho: number; c: number; d: number }> = {
    concrete: { k: 0.0016, rho: 2400, c: 0.75, d: 0.15 }, brick: { k: 0.0008, rho: 2600, c: 0.8, d: 0.2 },
    'gypsum board': { k: 0.00017, rho: 960, c: 1.1, d: 0.016 }, wood: { k: 0.00014, rho: 640, c: 2.85, d: 0.02 },
};
const hk = (L: { k: number; rho: number; c: number; d: number }, tS: number) => { const tp = L.rho * L.c / L.k * (L.d / 2) ** 2; return tS < tp ? Math.sqrt(L.k * L.rho * L.c / Math.max(1, tS)) : L.k / L.d; };
/** Heat release, kW: the fuel's, held to the opening's oxygen supply and to zero once the oxygen is below 15 %. */
export function heatKW(r: Room, fuelOnly = false): number {
    const q = r.fires.reduce((s, f) => s + f.kgh / 3600 * (f.lhv ?? 0) * 1000, 0);
    if (fuelOnly) return q;
    if (r.o2 < O2_OUT_LIMIT) return 0;
    return ventKgS(r) ? Math.min(q, 1500 * ventKgS(r) / 0.5) : q;
}
/** One minute of the fire's heat: hot-layer temperature and smoke-layer height. */
export function heatMinute(r: Room): void {
    const Q = heatKW(r);
    if (!r.h || !r.floor || (!Q && r.hot == null)) { r.fireMin = Q ? (r.fireMin ?? 0) + 1 : 0; return; }
    r.fireMin = (r.fireMin ?? 0) + 1;
    const t = r.fireMin * 60, L = LINING[r.lining ?? 'brick'], side = Math.sqrt(r.floor);
    const AT = 2 * r.floor + 4 * side * r.h - (r.vent?.m2 ?? 0), h = hk(L, t), T0 = r.base_c ?? r.air_c;
    if (r.vent && r.vent.m2 > 0 && Q > 0) {
        r.hot = T0 + 6.85 * (Q * Q / (r.vent.m2 * Math.sqrt(r.vent.h) * AT * h)) ** (1 / 3);
        r.layer = Math.min(r.h, r.vent.h);
    } else {
        const cur = r.hot ?? T0, rhoCV = 1.2 * 1.005 * r.m3, leak = effAch(r) / 3600 * r.m3 * 1.2 * 1.005; // kJ/K, kW/K
        // Exact over the minute with h held: T relaxes to T0 + Q ÷ (h A_T + leak) at rate (h A_T + leak) ÷ (ρ c_p V).
        const loss = h * AT + leak, eq = T0 + Q / loss;
        r.hot = eq + (cur - eq) * Math.exp(-loss * 60 / rhoCV);
        // Smoke stays when the flames go out (the layer is not refilled, nor cleared, by this model).
        if (Q > 0) { const Tg = r.hot + 273.15, k = 0.076 / (353 / Tg); r.layer = Math.min(r.layer ?? r.h, Math.max(0, (2 * k * Q ** (1 / 3) * t / (3 * r.floor) + r.h ** (-2 / 3)) ** (-3 / 2))); }
    }
}
/** The fire's heat into a person in the room. */
export function feelHeat(r: Room, p: Person): void {
    if (!p.env) return;
    const q = p as Person & { fireHeat?: boolean };
    if (r.hot == null) { if (q.fireHeat) { p.env.tdb = p.env.tr = r.air_c; q.fireHeat = false; } return; }
    q.fireHeat = true;
    const head = p.env.posture === 'lying' ? 0.3 : 1.6, T0 = r.base_c ?? r.air_c;
    const inLayer = r.layer != null && head >= r.layer;
    p.env.tdb = inLayer ? r.hot : T0;
    // Radiant: inside the layer all of it; below, half the view is the layer overhead, half the cooler floor and lower walls
    // (T_r⁴ = F T_layer⁴ + (1 − F) T0⁴, F = 0.5 [ASSUMED]).
    const K = 273.15, F = inLayer ? 1 : 0.5;
    p.env.tr = ((F * (r.hot + K) ** 4 + (1 - F) * (T0 + K) ** 4) ** 0.25) - K;
}

// Air changes per hour of homes: lognormal, median 0.45, 10th percentile 0.18 (US EPA Exposure Factors Handbook 2011, ch. 19,
// Table 19-1, from 2,844 tracer-gas measurements, Koontz & Rector 1995; Murray & Burmaster 1995 found the measurements well
// fitted by lognormal distributions) → σ = ln(0.45 ÷ 0.18) ÷ 1.2816 = 0.715. Drawn once per room. [ASSUMED: holds for any
// era and country; older houses were leakier, open windows far higher.]
export const drawAch = (gauss: () => number) => 0.45 * Math.exp(0.715 * gauss());
// Fire fuels, mass % of the burning fuel. Wood: C 50, H 6, O 44 (Speight, Synthetic Fuels Handbook, Table D.1, dry). Charcoal:
// taken as pure carbon [ASSUMED]. Carbon monoxide per kg burnt in household stoves: charcoal 276 g (IPCC Emission Factor
// Database meeting report, India, Annex 7: TERI / US EPA stove tests); other solid fuels 15–85 g, wood lower than dung and
// crop residues (same report) → 50 g used for wood, peat, lignite, coal [ASSUMED midpoint]. Liquids and gases (a lamp, a gas
// ring) burn to CO2 unless given [ASSUMED].
export const FIRE_FUELS: Record<string, { C: number; H: number; O: number; coEF: number; note: string }> = {
    wood: { C: 50, H: 6, O: 44, coEF: 50, note: 'CO 50 g/kg [ASSUMED midpoint of 15–85]' },
    charcoal: { C: 100, H: 0, O: 0, coEF: 276, note: 'CO 276 g/kg (stove tests); pure carbon [ASSUMED]' },
    peat: { C: 55, H: 6, O: 38, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' }, lignite: { C: 68, H: 5, O: 25, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' },
    'bituminous coal': { C: 78, H: 5, O: 13, coEF: 50, note: 'CO 50 g/kg [ASSUMED]' },
};
const MOLAR_L = 24.04; // litres per mole of gas at 20 °C, 1 atm
export const OUT_O2 = 20.95;

// An opening with a fire: air drawn in ≈ 0.5 A_o √H_o kg/s (Kawagoe 1958, the ventilation factor of compartment fire
// texts) [ASSUMED: also before flashover]; the room's air changes are at least that flow ÷ 1.2 kg/m³. The fire can release
// at most what that air's oxygen burns: 0.23 kg O2 per kg air × 13.1 MJ per kg O2 (Huggett 1980) ≈ 1,500 kW per m^(5/2)
// of A_o √H_o. In any room the flames go out when the oxygen falls below 15 % [ASSUMED: limiting oxygen of flaming
// solid fuels].
export const ventKgS = (r: Room) => r.vent && r.vent.m2 > 0 && r.fires.length ? 0.5 * r.vent.m2 * Math.sqrt(r.vent.h) : 0;
export const effAch = (r: Room) => Math.max(r.ach, ventKgS(r) / 1.2 * 3600 / r.m3);
export const O2_OUT_LIMIT = 15;
/** One minute of air in a room, with the people in it (each breathing out CO2 by their oxygen use). */
export function airMinute(r: Room, people: Person[]): void {
    const burning = r.o2 >= O2_OUT_LIMIT, vl = ventKgS(r) ? Math.min(1, 1500 * ventKgS(r) / 0.5 / Math.max(1e-9, heatKW(r, true))) : 1;
    let co2 = 0, co = 0, o2 = 0; // litres of gas per minute added (o2 negative)
    for (const f of burning ? r.fires : []) {
        const g = f.kgh * 1000 / 60 * vl, molC = g * f.C / 100 / 12.011, molCO = Math.min(molC, g * f.coEF / 1000 / 28.01);
        const molO2 = (molC - molCO) + molCO / 2 + g * f.H / 100 / 1.008 / 4 - g * f.O / 100 / 15.999 / 2;
        co2 += (molC - molCO) * MOLAR_L; co += molCO * MOLAR_L; o2 -= Math.max(0, molO2) * MOLAR_L;
    }
    // Breathing: VO2 = METs × 3.5 mL/kg/min; CO2 out = 0.85 × VO2 (respiratory exchange ratio of a mixed diet [ASSUMED]).
    for (const p of people) { if (p.dead) continue; const vo2 = (p.workMet ?? 1) * 3.5 * p.mass / 1000; o2 -= vo2; co2 += 0.85 * vo2; }
    const lam = effAch(r) / 60, V = r.m3 * 1000; // litres
    const step = (c: number, out: number, addL: number, unit: number) => {
        const G = addL / V * unit; // concentration units per minute
        if (lam <= 0) return c + G;
        const eq = out + G / lam; return eq + (c - eq) * Math.exp(-lam);
    };
    r.co = step(r.co, r.out.co, co, 1e6); r.co2 = step(r.co2, r.out.co2, co2, 1e6); r.o2 = step(r.o2, OUT_O2, o2, 100);
}

/** The room's air into each person in it: carbon monoxide, and low oxygen as the equivalent altitude (§6.6). */
export function breathe(r: Room, p: Person): void {
    if (!p.env) setEnvironment(p, { air_c: r.air_c });
    p.env!.co = r.co;
    if (r.o2 < 20.9) { p.baseAlt ??= p.altitude?.m ?? 0; const m = Math.round(equivalentAltitude(r.o2, p.baseAlt)); if (Math.abs((p.altitude?.m ?? 0) - m) >= 50) setAltitude(p, m, true); }
}

export const roomOf = (st: RuleState, p: Person): Room | null => (p.at && st.rooms?.[p.at]) || null;
/** The per-minute hook for advanceAll: every room's air moves one minute and its occupants breathe it. */
export function airHook(st: RuleState): (() => void) | null {
    if (!st.rooms || !Object.keys(st.rooms).length) return null;
    return () => {
        for (const [name, r] of Object.entries(st.rooms!)) {
            const inside = Object.values(st.people ?? {}).filter(p => p.at === name);
            airMinute(r, inside); heatMinute(r);
            for (const p of inside) { breathe(r, p); feelHeat(r, p); p.airFrom = name; }
        }
        // Out of a tracked room: back to clean outside air.
        for (const p of Object.values(st.people ?? {})) if (p.airFrom && p.at !== p.airFrom && !(p.at && st.rooms![p.at])) {
            if (p.env) p.env.co = 0; if (p.baseAlt != null) { setAltitude(p, p.baseAlt); p.baseAlt = null; } p.airFrom = null;
        }
    };
}
export const describeAir = (name: string, r: Room) => `${name}: ${r.m3} m³, ${r.ach.toFixed(2)} air changes/h; CO ${Math.round(r.co)} ppm, CO2 ${Math.round(r.co2)} ppm, O2 ${r.o2.toFixed(1)} %${r.fires.length ? `; burning ${r.fires.map(f => `${f.fuel} ${f.kgh} kg/h (${f.note})`).join(', ')}, ${heatKW(r).toFixed(1)} kW` : ''}${r.hot != null && r.fires.length ? `; hot layer ${Math.round(r.hot)} °C${r.layer != null ? `, its lower edge ${r.layer.toFixed(1)} m above the floor` : ''}${r.hot >= 600 ? '; FLASHOVER: the whole room bursts into flame' : ''}` : r.fires.length && !r.h ? ' (give height_m and floor_m2 for the fire\'s heat)' : ''}`;
export type { Rng };
