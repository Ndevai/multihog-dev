// The feeling colours as style.css holds them: sRGB, contrast on every shipped theme, and the pairwise CIELUV distances for
// normal colour vision and for a deuteranope and a protanope (Viénot, Brettel & Mollon 1999). Usage: node palette-css.mjs <repo root>
import fs from 'node:fs';
import { THEMES, contrast, bgOf } from './themes.mjs';
const css = fs.readFileSync(`${process.argv[2]}/style.css`, 'utf8');
const oklch = (L, C, h) => { const a = C * Math.cos(h * Math.PI / 180), b = C * Math.sin(h * Math.PI / 180), l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]; };
const gam = v => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055), lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const luv = c => { const [r, g, b] = c.map(lin), X = 0.4124 * r + 0.3576 * g + 0.1805 * b, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b, Z = 0.0193 * r + 0.1192 * g + 0.9505 * b, d = X + 15 * Y + 3 * Z || 1, L = Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y; return [L, 13 * L * (4 * X / d - 0.1978), 13 * L * (9 * Y / d - 0.4683)]; };
const dE = (a, b) => Math.hypot(...luv(a).map((x, i) => x - luv(b)[i]));
const cvd = M => c => { const l = c.map(lin); return M.map(row => gam(Math.min(1, Math.max(0, row[0] * l[0] + row[1] * l[1] + row[2] * l[2])))); };
const deut = cvd([[0.29275, 0.70725, 0], [0.29275, 0.70725, 0], [-0.02234, 0.02234, 1]]), prot = cvd([[0.10889, 0.89111, 0], [0.10889, 0.89111, 0], [0.00447, -0.00447, 1]]);
const felt = { dark: [], light: [] };
for (const m of css.matchAll(/body\.rules-distinct(\[data-rules-tone="light"\])? \[data-feeling="(\w+)"\], [^{]*\{ --rules-felt: oklch\(([\d.]+) ([\d.]+) ([\d.]+)\); \}/g)) felt[m[1] ? 'light' : 'dark'].push([m[2], oklch(Number(m[3]), Number(m[4]), Number(m[5])).map(v => gam(Math.min(1, Math.max(0, v)))), `oklch(${m[3]} ${m[4]} ${m[5]})`]);
for (const tone of ['dark', 'light']) {
    console.log(tone);
    for (const [f, c, src] of felt[tone]) console.log('  ', f.padEnd(11), src.padEnd(24), '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join(''), 'contrast', THEMES[tone].map(th => contrast(c, bgOf(th)).toFixed(1)).join(' '));
    const pairs = []; for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) pairs.push([`${felt[tone][i][0]}–${felt[tone][j][0]}`, dE(felt[tone][i][1], felt[tone][j][1]), dE(deut(felt[tone][i][1]), deut(felt[tone][j][1])), dE(prot(felt[tone][i][1]), prot(felt[tone][j][1]))]);
    for (const [k, name] of [[1, 'normal vision'], [2, 'deuteranope'], [3, 'protanope']]) { const m = pairs.reduce((a, b) => b[k] < a[k] ? b : a); console.log(`   closest pair, ${name}: ${m[0]} ${m[k].toFixed(0)} CIELUV units; pairs under 40: ${pairs.filter(p => p[k] < 40).map(p => `${p[0]} ${p[k].toFixed(0)}`).join(', ') || 'none'}`); }
    console.log('   lowest contrast:', Math.min(...felt[tone].flatMap(([, c]) => THEMES[tone].map(th => contrast(c, bgOf(th))))).toFixed(2));
}
