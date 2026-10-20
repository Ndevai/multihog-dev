// Builds src/rules/data/geonames.ts from GeoNames cities15000.txt (every place of 15,000 people or more; geonames.org, CC BY
// 4.0): each name and ASCII name, folded, with the latitude, longitude and population of its largest place. Usage:
//   node tools/build-geonames.mjs <path to cities15000.txt>
import fs from 'node:fs';
const fold = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const out = {};
for (const line of fs.readFileSync(process.argv[2], 'utf8').split('\n')) {
    const c = line.split('\t'); if (c.length < 15) continue;
    const lat = Math.round(Number(c[4]) * 100) / 100, lon = Math.round(Number(c[5]) * 100) / 100, pop = Number(c[14]) || 0;
    for (const n of new Set([fold(c[1]), fold(c[2])])) if (n && (!out[n] || out[n][2] < pop)) out[n] = [lat, lon, pop];
}
fs.writeFileSync(new URL('../src/rules/data/geonames.ts', import.meta.url), `// Places of 15,000 people or more by folded name: [latitude, longitude, population] of the largest of that name. GeoNames
// cities15000 (geonames.org, CC BY 4.0), built by tools/build-geonames.mjs (${Object.keys(out).length} names).
export const GEONAMES: Record<string, [number, number, number]> = ${JSON.stringify(out)};
`);
console.log(Object.keys(out).length, 'names');
