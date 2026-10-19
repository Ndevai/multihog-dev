export function psat(r, T) {
    const v = r.vp;
    if (!v)
        return null;
    const [eq, a, b, c, d, e] = v;
    if (eq === 'p')
        return Math.exp(a + b / T + c * Math.log(T) + d * T ** e);
    if (eq === 'a10')
        return 10 ** (a - b / (T + c));
    if (eq === 'ae')
        return Math.exp(a - b / (T + c));
    return null;
}
export const vpRange = (r) => { const v = r.vp; return v ? [v[v.length - 2], v[v.length - 1]] : null; };
const bisect = (f, lo = 120, hi = 700) => {
    let a = lo, b = hi, fa = f(a), fb = f(b);
    if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0)
        return null;
    for (let i = 0; i < 80; i++) {
        const m = (a + b) / 2, fm = f(m);
        if (fa * fm <= 0) {
            b = m;
            fb = fm;
        }
        else {
            a = m;
            fa = fm;
        }
    }
    return (a + b) / 2;
};
// Derived vs measured flash point over the 257 compounds with both (tools/check-chem.mjs): 236 with a boiling point above 25 °C, median |error| 4.1 K, 90 % within 15.4 K; the derived
// value a median FLASH_SHIFT K below the measured one (closed-cup apparatus ignites a little above the limit temperature);
// the shift is added to derived values [fitted here].
export const FLASH_SHIFT = 2.5;
/** Flash point (K) from vapour pressure and lower limit; null without both. Measured value preferred by callers. */
export function derivedFlash(r) {
    if (r.LFL == null || !(r.LFL > 0 && r.LFL < 1) || !r.vp)
        return null;
    const t = bisect(T => (psat(r, T) ?? NaN) - r.LFL * 101325);
    return t == null ? null : t + FLASH_SHIFT;
}
// ---- UNIFAC ----
let UF = null;
let ufLoading = null;
export function loadUnifac() {
    ufLoading ??= fetch(new URL('../../rules/unifac.json', import.meta.url)).then(r => r.json()).then(d => { UF = d; });
    return ufLoading;
}
/** Activity coefficients of the parts (mole fractions x, groups per part {subgroup id: count}) at T K; null when a group pair
 *  has no interaction parameter. */
export function unifac(T, x, groups) {
    if (!UF)
        throw new Error('UNIFAC table not loaded.');
    const SG = UF.subgroups, n = x.length;
    const r = groups.map(g => Object.entries(g).reduce((s, [k, v]) => s + v * SG[k][2], 0));
    const q = groups.map(g => Object.entries(g).reduce((s, [k, v]) => s + v * SG[k][3], 0));
    const sx = (f) => { let s = 0; for (let i = 0; i < n; i++)
        s += f(i); return s; };
    const rx = sx(i => r[i] * x[i]), qx = sx(i => q[i] * x[i]);
    const l = r.map((ri, i) => 5 * (ri - q[i]) - (ri - 1)), xl = sx(i => x[i] * l[i]);
    const lnC = x.map((xi, i) => { const phi = r[i] / rx, th = q[i] / qx; return Math.log(phi) + 5 * q[i] * Math.log(th / phi) + l[i] - phi * xl; }); // φ/x, θ/x forms
    const ks = [...new Set(groups.flatMap(g => Object.keys(g)))];
    const psi = (m, k) => { const a = SG[m][1] === SG[k][1] ? 0 : UF.a[`${SG[m][1]}|${SG[k][1]}`]; return a == null ? NaN : Math.exp(-a / T); };
    const lnGamma = (X) => {
        const tot = ks.reduce((s, k) => s + (X[k] ?? 0) * SG[k][3], 0);
        const th = Object.fromEntries(ks.map(k => [k, (X[k] ?? 0) * SG[k][3] / tot]));
        return Object.fromEntries(ks.map(k => {
            const s1 = ks.reduce((s, m) => s + th[m] * psi(m, k), 0);
            const s2 = ks.reduce((s, m) => s + th[m] * psi(k, m) / ks.reduce((t, nn) => t + th[nn] * psi(nn, m), 0), 0);
            return [k, SG[k][3] * (1 - Math.log(s1) - s2)];
        }));
    };
    const frac = (w) => { const tot = ks.reduce((s, k) => s + w(k), 0); return Object.fromEntries(ks.map(k => [k, w(k) / tot])); };
    const mix = lnGamma(frac(k => sx(i => x[i] * (groups[i][k] ?? 0))));
    const out = groups.map((g, i) => {
        const pure = lnGamma(frac(k => g[k] ?? 0));
        const res = Object.entries(g).reduce((s, [k, v]) => s + v * (mix[k] - pure[k]), 0);
        return Math.exp(lnC[i] + res);
    });
    return out.some(v => !isFinite(v)) ? null : out;
}
/** Bubble point (K) of a liquid mixture at 1 atm and the vapour's mole fractions there; null when data are missing. */
export function bubble(parts) {
    if (parts.some(p => !p.r.vp || !p.r.uf))
        return null;
    const g = parts.map(p => p.r.uf), x = parts.map(p => p.x);
    const f = (T) => { const gm = unifac(T, x, g); return gm ? parts.reduce((s, p, i) => s + p.x * gm[i] * (psat(p.r, T) ?? NaN), 0) - 101325 : NaN; };
    const T = bisect(f, 150, 650);
    if (T == null)
        return null;
    const gm = unifac(T, x, g);
    const pp = parts.map((p, i) => p.x * gm[i] * psat(p.r, T));
    const tot = pp.reduce((a, b) => a + b, 0);
    return { T, y: pp.map(v => v / tot) };
}
/** Flash point (K) of a liquid mixture (Liaw et al. 2002); parts without a flash point count as not burning. */
export function mixtureFlash(parts) {
    if (parts.some(p => !p.r.vp || !p.r.uf))
        return null;
    const burn = parts.map(p => p.r.Tf ?? derivedFlash(p.r));
    if (burn.every(t => t == null))
        return null;
    const g = parts.map(p => p.r.uf), x = parts.map(p => p.x);
    const f = (T) => { const gm = unifac(T, x, g); if (!gm)
        return NaN; return parts.reduce((s, p, i) => burn[i] == null ? s : s + p.x * gm[i] * psat(p.r, T) / psat(p.r, burn[i]), 0) - 1; };
    return bisect(f, 150, 650);
}
