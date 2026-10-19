// The validate step of plan → diff → validate → apply (docs/df-body-engine.md §6.21): after every tool call the new world is
// checked against laws that hold for any story; a call that breaks one is undone and refused, so a wrong state never enters
// the history. Laws: time only runs forward; the dead stay dead; amounts are within their physical bounds (blood lost between
// 0 and all of it, mass above 0, deficits not negative, gas shares between 0 and 100 %); items are conserved except where
// the story moves them in or out of the world (Transfer from or to nobody, a Claim); a walking distance is never longer than a
// known detour through a third spot (the shortest walk between two spots cannot exceed a route via another).
import type { RuleState } from './types.js';
import { bloodVolume } from './body-engine.js';
import { shortest } from './actions.js';

const now = (st: RuleState) => st.clock ? st.clock.t + st.clock.add : null;
const totals = (st: RuleState) => { const t: Record<string, number> = {}; for (const list of Object.values(st.items ?? {})) for (const x of list) t[x.item.toLowerCase()] = (t[x.item.toLowerCase()] ?? 0) + x.qty; return t; };

export function violations(before: RuleState, after: RuleState, tool: string, args: Record<string, unknown>): string[] {
    const out: string[] = [];
    const a = now(before), b = now(after);
    if (a !== null && b !== null && b < a - 1e-9 && tool !== 'set time') out.push(`time ran backwards (${(a - b).toFixed(2)} min)`);
    for (const [n, p] of Object.entries(before.people ?? {})) if (p.dead && after.people?.[n] && !after.people[n].dead) out.push(`${n} came back from the dead`);
    for (const [n, p] of Object.entries(after.people ?? {})) {
        if (!(p.mass > 0)) out.push(`${n} has mass ${p.mass}`);
        const v = bloodVolume(p);
        if (p.lost < -1e-9 || (v && p.lost > v * 1.0001)) out.push(`${n} has lost ${p.lost} mL of ${Math.round(v)} mL of blood`);
        if (p.needs && (p.needs.waterL < -1e-9 || p.needs.kcal < -1e-9)) out.push(`${n} has a negative water or food deficit`);
    }
    for (const [n, r] of Object.entries(after.rooms ?? {})) {
        if (r.co < -1e-6 || r.co2 < -1e-6 || r.o2 < -1e-6 || r.o2 > 20.95 + 1e-6 || r.co > 1e6 || r.co2 > 1e6) out.push(`room ${n} has gas outside 0–100 % (CO ${r.co}, CO2 ${r.co2}, O2 ${r.o2})`);
    }
    const moves = tool === 'Claim' || (tool === 'Transfer' && (!args.from || !args.to));
    if (!moves) {
        const ta = totals(before), tb = totals(after);
        for (const k of new Set([...Object.keys(ta), ...Object.keys(tb)])) if (Math.abs((ta[k] ?? 0) - (tb[k] ?? 0)) > 1e-9) out.push(`${k}: ${ta[k] ?? 0} in the world became ${tb[k] ?? 0} without entering or leaving it`);
    }
    out.push(...detours(after));
    return out;
}

/** Recorded walking distances longer than a route through other spots. */
export function detours(st: RuleState): string[] {
    const L = st.links ?? {}, out: string[] = [];
    for (const k of Object.keys(L)) {
        const [x, y] = k.split('|'), rest = { ...L }; delete rest[k];
        const r = shortest(rest, x, y);
        if (r && L[k] > r.m + 1e-9) out.push(`${x} → ${y} recorded as ${L[k]} m, but via ${r.path.slice(1, -1).join(', ')} it is ${Math.round(r.m * 10) / 10} m`);
    }
    return out;
}
