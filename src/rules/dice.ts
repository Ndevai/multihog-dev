// RollTheDice for quantities and tier tables (checks go through BodyCheck). Formula grammar: die groups NdM with an
// optional keep-highest/lowest (2d20kh1), joined by + or - with flat numbers ("2d6+1d4+3"). Rolls come from the engine's
// seeded draw, so a swipe of the same turn repeats them.
import type { Rng } from './types.js';

export interface Roll { formula: string; total: number; rolls: number[] }
export interface Tier { min: number; max: number; label: string }

const TERM = /([+-]?)\s*(?:(\d*)d(\d+)(?:k([hl])(\d+))?|(\d+))/gi;

/** The roll, or null when the formula has no valid term (at most 100 dice of at most 1000 sides per group). */
export function rollFormula(formula: string, rng: Rng): Roll | null {
    const f = String(formula ?? '').replace(/\s+/g, '').toLowerCase();
    if (!f || f.replace(TERM, '') !== '') return null;
    let total = 0, any = false;
    const rolls: number[] = [];
    for (const m of f.matchAll(TERM)) {
        const sign = m[1] === '-' ? -1 : 1;
        if (m[6] !== undefined) { total += sign * Number(m[6]); any = true; continue; }
        const n = Number(m[2] || 1), sides = Number(m[3]);
        if (n < 1 || n > 100 || sides < 2 || sides > 1000) return null;
        let dice = Array.from({ length: n }, () => 1 + Math.floor(rng() * sides));
        rolls.push(...dice);
        if (m[4]) {
            const keep = Math.min(n, Number(m[5]));
            dice = [...dice].sort((a, b) => m[4] === 'h' ? b - a : a - b).slice(0, keep);
        }
        total += sign * dice.reduce((a, b) => a + b, 0);
        any = true;
    }
    return any ? { formula: f, total, rolls } : null;
}

const RANGE = /^(?:(≤|<=)\s*(\d+)|(≥|>=)\s*(\d+)|(\d+)\s*\+|(\d+)\s*(?:[-–—]|to)\s*(\d+)|(\d+))\s*[:=]?\s*(.+)$/i;

/** "1-5 Junk | 6-10 Common | ≥11 Good" → rows, or null when unparseable, gapped or overlapping. */
export function parseTable(spec: string): Tier[] | null {
    const rows: Tier[] = [];
    for (const part of String(spec ?? '').split(/[|;\n]/).map(s => s.trim()).filter(Boolean)) {
        const m = part.match(RANGE);
        if (!m) return null;
        let min: number, max: number;
        if (m[1]) { min = -Infinity; max = +m[2]; }
        else if (m[3]) { min = +m[4]; max = Infinity; }
        else if (m[5]) { min = +m[5]; max = Infinity; }
        else if (m[6]) { min = +m[6]; max = +m[7]; }
        else { min = max = +m[8]; }
        if (min > max) return null;
        rows.push({ min, max, label: m[9].trim() });
    }
    if (rows.length < 2) return null;
    rows.sort((a, b) => a.min - b.min);
    for (let i = 1; i < rows.length; i++) if (rows[i].min !== rows[i - 1].max + 1) return null;
    return rows;
}

/** Totals below the first row or above the last take that end row. */
export const pickTier = (rows: Tier[], total: number): Tier =>
    rows.find(r => total >= r.min && total <= r.max) || (total < rows[0].min ? rows[0] : rows[rows.length - 1]);
