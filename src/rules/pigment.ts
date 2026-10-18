// Eye and hair colour by country (Katsara & Nothnagel 2019, Forensic Sci Int Genet 39:109, Tables 1–2: population-representative
// studies only, averaged where a country has several). Eye: blue (with grey), intermediate (green, yellow), brown (with hazel);
// hair: brown (with black), blond (with light brown), red. Drawn from the shares, eye and hair independently [ASSUMED: the
// paper finds only a modest association, Cramér's V 0.20, in Virchow's German schoolchildren].
const EYE: Record<string, [number, number, number]> = {
    Armenia: [3.05, 16.78, 80.15], Azerbaijan: [6.34, 22.21, 71.42], Denmark: [64.84, 20.45, 14.50], 'United Kingdom': [42.80, 25.46, 31.77],
    France: [22.00, 44.00, 34.00], Georgia: [7.51, 18.79, 73.68], Germany: [39.6, 33.2, 27.2], Iceland: [74.52, 14.15, 9.22],
    Kazakhstan: [3.33, 11.65, 85.00], Netherlands: [60.90, 11.40, 21.70], Poland: [52.50, 12.50, 35.10], Slovenia: [44.70, 25.70, 29.60],
    Tajikistan: [6.83, 7.67, 85.47], Ukraine: [25.00, 24.99, 50.00], Uzbekistan: [3.44, 6.02, 90.51],
};
const HAIR: Record<string, [number, number, number]> = {
    Denmark: [30.66, 64.00, 4.99], 'United Kingdom': [50.15, 41.36, 8.44], Estonia: [43.00, 56.00, 1.00], France: [84.00, 12.00, 4.00],
    Germany: [31.40, 68.40, 0.20], Iceland: [26.10, 65.13, 6.93], Netherlands: [25.90, 71.45, 2.60],
};
const ALIAS: Record<string, string> = { england: 'United Kingdom', scotland: 'United Kingdom', wales: 'United Kingdom', 'great britain': 'United Kingdom', uk: 'United Kingdom', holland: 'Netherlands', 'united kingdom of great britain and northern ireland': 'United Kingdom' };
const key = (c: string, t: Record<string, unknown>) => { const n = c.trim().toLowerCase(); return Object.keys(t).find(k => k.toLowerCase() === n) ?? (ALIAS[n] && ALIAS[n] in t ? ALIAS[n] : null); };
const draw = (w: number[], names: string[], u: number) => { const t = w.reduce((a, b) => a + b, 0); let v = u * t; for (let i = 0; i < w.length; i++) if ((v -= w[i]) < 0) return names[i]; return names[names.length - 1]; };
/** Eye and hair colour drawn for a person from `country`; a part is null where the country has no data. */
export function pigment(country: string, rng: () => number): { eyes: string | null; hair: string | null } {
    const e = key(country, EYE), h = key(country, HAIR);
    return { eyes: e ? draw(EYE[e], ['blue or grey', 'green or another intermediate colour', 'brown'], rng()) : null,
        hair: h ? draw(HAIR[h], ['brown or black', 'blond', 'red'], rng()) : null };
}
