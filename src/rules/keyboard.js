const ROWS = {
    qwerty: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
    qwertz: ['qwertzuiop', 'asdfghjkl', 'yxcvbnm'],
    azerty: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'],
    dvorak: ['pyfgcrl', 'aoeuidhtns', 'qjkxbmwvz'],
    colemak: ['qwfpgjluy', 'arstdhneio', 'zxcvbkm'],
};
// Standard row stagger offsets in key-cap units (row 0 = 0, row 1 = +0.25, row 2 = +0.75).
const STAGGER = [0, 0.25, 0.75];
const COORDS = new Map();
for (const [name, rows] of Object.entries(ROWS)) {
    const m = new Map();
    rows.forEach((row, r) => {
        [...row].forEach((ch, c) => m.set(ch, [c + STAGGER[r], r]));
    });
    COORDS.set(name, m);
}
/** Resolve 'auto' from browser locale (de* -> QWERTZ, fr* -> AZERTY, else QWERTY). */
export function resolveLayout(pref) {
    if (pref && pref !== 'auto' && pref in ROWS)
        return pref;
    const lang = (globalThis.navigator?.language ?? '').toLowerCase();
    if (/^de\b/.test(lang))
        return 'qwertz';
    if (/^fr\b/.test(lang))
        return 'azerty';
    return 'qwerty';
}
/** Whether the active device is a touchscreen (wider thumb slip radius). */
export const isTouchDevice = () => !!globalThis.matchMedia?.('(hover: none)').matches;
/** Normalized physical distance in [0, 1] between two keys (0 = same key, <= 0.35 = immediate neighbors). */
export function keySlipCost(a, b, layout = 'auto', touch = isTouchDevice()) {
    const ca = a.toLowerCase(), cb = b.toLowerCase();
    if (ca === cb)
        return 0;
    const map = COORDS.get(resolveLayout(layout));
    const pa = map.get(ca), pb = map.get(cb);
    if (!pa || !pb)
        return 0.85;
    const dist = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
    // Touchscreens widen the effective hit radius by ~35%.
    const effective = touch ? dist / 1.35 : dist;
    return Math.min(1, effective / 4.5);
}
/** Noisy-channel likelihood P(typed | candidate) in (0, 1]: high when differing letters are physically adjacent. */
export function wordSlipLikelihood(typed, candidate, layout = 'auto', touch = isTouchDevice()) {
    const a = typed.toLowerCase().trim(), b = candidate.toLowerCase().trim();
    if (a === b)
        return 1;
    if (Math.abs(a.length - b.length) > 1)
        return 0.01;
    if (a.length === b.length) {
        const diffs = [];
        for (let i = 0; i < a.length; i++)
            if (a[i] !== b[i])
                diffs.push(i);
        if (diffs.length === 1) {
            const cost = keySlipCost(a[diffs[0]], b[diffs[0]], layout, touch);
            return Math.exp(-4.2 * cost);
        }
        // Adjacent transposition (e.g. "teh" -> "the")
        if (diffs.length === 2 && diffs[1] === diffs[0] + 1 && a[diffs[0]] === b[diffs[1]] && a[diffs[1]] === b[diffs[0]]) {
            return 0.45;
        }
        return 0.01;
    }
    // 1-character insertion/omission: likely only if the extra character is adjacent to a neighbor in the word.
    const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
    for (let i = 0; i < longer.length; i++) {
        if (longer.slice(0, i) + longer.slice(i + 1) === shorter) {
            const extra = longer[i];
            const prevCost = i > 0 ? keySlipCost(extra, longer[i - 1], layout, touch) : 1;
            const nextCost = i + 1 < longer.length ? keySlipCost(extra, longer[i + 1], layout, touch) : 1;
            return Math.exp(-4.2 * Math.min(prevCost, nextCost));
        }
    }
    return 0.01;
}
/** True when two names differ by 1 edit whose differing key is physically adjacent on the active keyboard. */
export function isAdjacentNameTypo(typed, recorded, layout = 'auto') {
    return wordSlipLikelihood(typed, recorded, layout) >= 0.22;
}
