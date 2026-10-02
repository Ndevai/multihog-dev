// Per-turn record of RollTheDice results. A turn is identified by the latest
// user message, so swipes and regenerates of the same reply share one ledger.

const norm = s => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function hash(text) {
    let h = 0;
    for (const ch of String(text ?? '')) h = (Math.imul(h, 31) + ch.codePointAt(0)) | 0;
    return (h >>> 0).toString(36);
}

export function turnKey(chat) {
    const users = (Array.isArray(chat) ? chat : []).filter(m => m?.is_user);
    return `${users.length}:${hash(users.at(-1)?.mes)}`;
}

export function ledgerForTurn(ledger, key) {
    if (!ledger || ledger.turn !== key) return { turn: key, rolls: [] };
    return ledger;
}

export function findRepeat(ledger, { who, for: what, kind }) {
    const w = norm(who), f = norm(what);
    if (!f) return null;
    return ledger.rolls.find(r => norm(r.who) === w && norm(r.for) === f && r.kind === kind) || null;
}

const RANGE = /^(?:(≤|<=)\s*(\d+)|(≥|>=)\s*(\d+)|(\d+)\s*\+|(\d+)\s*(?:[-–—]|to)\s*(\d+)|(\d+))\s*[:=]?\s*(.+)$/i;

/** "1-5 Junk | 6-10 Common | ≥11 Good" → [{min, max, label}], or null when unparseable, gapped or overlapping. */
export function parseTable(spec) {
    const rows = [];
    for (const part of String(spec ?? '').split(/[|;\n]/).map(s => s.trim()).filter(Boolean)) {
        const m = part.match(RANGE);
        if (!m) return null;
        let min, max;
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
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].min !== rows[i - 1].max + 1) return null;
    }
    return rows;
}

/** Totals below the first row or above the last row take that end row. */
export function pickTier(rows, total) {
    return rows.find(r => total >= r.min && total <= r.max)
        || (total < rows[0].min ? rows[0] : rows.at(-1));
}

export function verdictOf(total, dc, compare, natural = null) {
    if (compare === 'lte') return total <= dc ? 'HIT' : 'MISS';
    if (compare === 'attack') {
        if (natural === 1) return 'MISS';
        if (natural === 20) return 'HIT';
        return total >= dc ? 'HIT' : 'MISS';
    }
    return total >= dc ? 'SUCCESS' : 'FAILURE';
}

/** The d20 face that decides a natural 1/20: 1d20, 2d20kh1 (higher) or 2d20kl1 (lower) as the formula's first group. */
export function naturalD20(formula, rolls) {
    const m = String(formula ?? '').replace(/\s+/g, '').match(/^(\d*)d20(k[hl]?1)?(?![\d])/i);
    if (!m) return null;
    const count = Number(m[1] || 1);
    const faces = (rolls || []).slice(0, count).map(Number);
    if (count === 1 && !m[2]) return faces[0] ?? null;
    if (count === 2 && m[2]) return /kl/i.test(m[2]) ? Math.min(...faces) : Math.max(...faces);
    return null;
}

const FLIP = {
    success: 'failure', failure: 'success',
    succeeds: 'fails', fails: 'succeeds',
    succeeded: 'failed', failed: 'succeeded',
    successful: 'unsuccessful', unsuccessful: 'successful',
    hit: 'miss', miss: 'hit', hits: 'misses', misses: 'hits', missed: 'hit',
    pass: 'fail', fail: 'pass', passes: 'fails', passed: 'failed',
};
const POSITIVE = new Set(['success', 'succeeds', 'succeeded', 'successful', 'hit', 'hits', 'pass', 'passes', 'passed']);
const WORD = new RegExp(`\\b(${Object.keys(FLIP).join('|')})\\b`, 'gi');

function matchCase(src, word) {
    if (src === src.toUpperCase()) return word.toUpperCase();
    if (src[0] === src[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1);
    return word;
}

/**
 * Finds roll parentheticals whose DC/AC and total match a ledger check and whose
 * verdict word contradicts it; flips those words. Returns { text, fixes }.
 */
export function correctVerdicts(text, rolls) {
    const checks = (rolls || []).filter(r => (r.kind === 'check' || r.kind === 'attack') && r.verdict);
    let fixes = 0;
    const out = String(text ?? '').replace(/\(([^()\n]{1,240})\)/g, (whole, inner) => {
        const dcMatch = inner.match(/\b(?:DC|AC)\s*:?\s*(\d+)/i) || inner.match(/(\d+)\s*%/);
        if (!dcMatch || !WORD.test(inner)) return whole;
        WORD.lastIndex = 0;
        const dc = +dcMatch[1];
        const numbers = new Set((inner.match(/\d+/g) || []).map(Number));
        const hits = checks.filter(r => r.dc === dc && numbers.has(r.total));
        const verdicts = new Set(hits.map(r => r.verdict === 'SUCCESS' || r.verdict === 'HIT'));
        if (verdicts.size !== 1) return whole;
        const positive = [...verdicts][0];
        const fixed = inner.replace(WORD, w => {
            if (POSITIVE.has(w.toLowerCase()) === positive) return w;
            fixes++;
            return matchCase(w, FLIP[w.toLowerCase()]);
        });
        return `(${fixed})`;
    });
    return { text: out, fixes };
}

/** Rewrites queue "pop" table rolls (loot tiers, random events) as table-kind dice tool calls. */
export function tableRollsToToolCalls(text, toolName) {
    const call = table => `call ${toolName} with kind "table", formula "1d20", table "${table}"`;
    return text
        .replace(/Pop a number:\s*≥\s*(\d+)\s*=\s*event occurs\.\s*If event, pop again:\s*≤\s*(\d+)\s*negative,\s*(\d+)\s*[–-]\s*(\d+)\s*ambiguous,\s*≥\s*(\d+)\s*favorable\./i,
            (_, occurs, neg, a, b, fav) => `Roll for an event: ${call(`≤${occurs - 1} no event | ≥${occurs} event`)}. On "event", roll its type: ${call(`≤${neg} negative | ${a}–${b} ambiguous | ≥${fav} favorable`)}.`)
        .replace(/\bpop an? d20\s*:\s*([^\n]+?)\.?$/gim, (_, table) => `${call(table.trim())}.`);
}
