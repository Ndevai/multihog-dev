import fs from 'node:fs';
globalThis.fetch = async (u) => ({ json: async () => JSON.parse(fs.readFileSync(new URL(u))) });
const V = await import('/home/claude/work/src/rules/vapour.js'); const C = await import('/home/claude/work/src/rules/chem.js');
await V.loadUnifac(); await C.loadChem();
const iceVp = T => Math.exp(9.550426 - 5723.265 / T + 3.53068 * Math.log(T) - 0.00728332 * T);
const liqVp = T => Math.exp(54.842763 - 6763.22 / T - 4.210 * Math.log(T) + 0.000367 * T + Math.tanh(0.0415 * (T - 218.8)) * (53.878 - 1331.22 / T - 9.44523 * Math.log(T) + 0.014025 * T));
const awi = T => iceVp(T) / liqVp(T);
const bis = (f, a, b) => { let fa = f(a); for (let i = 0; i < 80; i++) { const m = (a + b) / 2, fm = f(m); if (fa * fm <= 0) b = m; else { a = m; fa = fm; } } return (a + b) / 2; };
console.log('awi(273.15)', awi(273.15), 'awi(273.16)', awi(273.16), 'melt aw=1', bis(T => 1 - awi(T), 200, 280) - 273.15);
const J = (T, aw = 1) => { const d = aw - awi(T); return d <= 0 ? 0 : 10 ** (-906.7 + 8502 * d - 26924 * d * d + 29180 * d ** 3); };
const vol10 = 4 / 3 * Math.PI * (5e-4) ** 3; // cm3, 10 µm diameter
console.log('10 µm drop, 1 s, 50 %: T =', (bis(T => J(T) * vol10 * 1 - Math.LN2, 200, 272) - 273.15).toFixed(2), 'Δaw there', (1 - awi(bis(T => J(T) * vol10 - Math.LN2, 200, 272))).toFixed(3));
for (const c of [-30, -35, -36, -37, -38, -40]) console.log(c, 'J', J(c + 273.15).toExponential(2), 'Δaw', (1 - awi(c + 273.15)).toFixed(4));
const n = c => Math.exp(-0.7 * c - 6.02);
console.log('T50 0.05 mL', (-(Math.log(Math.LN2 / 0.05) + 6.02) / 0.7).toFixed(2));
for (const c of [-1, -5, -10]) console.log(c, 'n/mL', n(c).toExponential(2), 'cloud 10µm P', (1 - Math.exp(-n(c) * vol10)).toExponential(2), '1 L P', (1 - Math.exp(-n(c) * 1000)).toFixed(4), '50 µL P', (1 - Math.exp(-n(c) * 0.05)).toFixed(4));
// ethanol-water melting points
const w = C.findCompound('water'), e = C.findCompound('ethanol'); console.log('uf', w.uf, e.uf);
const groups = [w.uf, e.uf];
for (const [wt, lange] of [[11.3, -5], [20.3, -10.6], [29.9, -18.9], [39.0, -28.7], [46.3, -33.9], [56.1, -41.0]]) {
  const mw = (100 - wt) / 18.015, me = wt / 46.07, xw = mw / (mw + me);
  const aw = T => { const g = V.unifac(T, [xw, 1 - xw], groups); return xw * g[0]; };
  const Tm = bis(T => aw(T) - awi(T), 180, 273.15);
  console.log(`${wt} wt%: melt ${(Tm - 273.15).toFixed(1)} °C (Lange ${lange}); aw ${aw(Tm).toFixed(3)}`);
}
