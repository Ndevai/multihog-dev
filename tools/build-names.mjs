// Builds src/rules/data/given-names.ts: each given name's share of girls among US births it was given to, from the Social
// Security Administration's top 1,000 names by sex and year, 1880–2008 (hadley/data-baby-names, baby-names.csv; SSA data,
// US government work). Shares weight each year by the name's percent of that sex's births. Usage:
//   node tools/build-names.mjs <path to baby-names.csv>
import fs from 'node:fs';
const w = {};
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n').slice(1)) {
    const m = line.match(/^(\d+),"([^"]+)",([\d.]+),"(boy|girl)"/); if (!m) continue;
    const n = m[2].toLowerCase(); (w[n] ??= [0, 0])[m[4] === 'girl' ? 1 : 0] += Number(m[3]);
}
const out = Object.fromEntries(Object.entries(w).map(([n, [b, g]]) => [n, Math.round(g / (b + g) * 100) / 100]));
fs.writeFileSync(new URL('../src/rules/data/given-names.ts', import.meta.url), `// Share of girls among US births given each name, 1880–2008: Social Security Administration top 1,000 names by sex and year
// (hadley/data-baby-names; US government work), built by tools/build-names.mjs (${Object.keys(out).length} names).
export const GIVEN_NAMES: Record<string, number> = ${JSON.stringify(out)};
`);
console.log(Object.keys(out).length, 'names; josiah', out.josiah, 'ned', out.ned, 'mary', out.mary, 'leslie', out.leslie);
