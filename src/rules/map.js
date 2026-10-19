import { def, k } from './constants.js';
def({ id: 'routeFactor', value: 1.2, unit: 'walk ÷ straight line', status: 'assumed', src: 'walking routes are longer than the straight line (Boeing 2019 finds walking networks more direct than driving ones, no single figure)', range: [1.0, 1.5], file: 'map.ts' });
def({ id: 'storeyM', value: 2.8, unit: 'm per floor', status: 'assumed', src: 'storey height of a house', range: [2.4, 3.5], file: 'map.ts' });
export const mapOf = (st) => (st.map ??= { spots: {}, rooms: {} });
/** Polygon area (shoelace), m². */
export const area = (c) => Math.abs(c.reduce((s, [x, y], i) => { const [x2, y2] = c[(i + 1) % c.length]; return s + x * y2 - x2 * y; }, 0)) / 2;
/** Point in polygon (ray casting). */
export function inside([px, py], c) {
    let r = false;
    for (let i = 0, j = c.length - 1; i < c.length; j = i++) {
        const [xi, yi] = c[i], [xj, yj] = c[j];
        if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi)
            r = !r;
    }
    return r;
}
/** The room a placed spot lies in: its stated room, else the outline on its floor that contains it. */
export function roomAt(m, name) {
    const s = m.spots[name];
    if (!s)
        return null;
    if (s.room)
        return s.room;
    for (const [r, o] of Object.entries(m.rooms))
        if (o.floor === s.floor && inside([s.x, s.y], o.corners))
            return r;
    return null;
}
/** Straight-line distance between two placed spots, m (floors counted by storey height). */
export function straight(m, a, b) {
    const p = m.spots[a], q = m.spots[b];
    if (!p || !q)
        return null;
    return Math.hypot(p.x - q.x, p.y - q.y, (p.floor - q.floor) * k('storeyM'));
}
/** Walking distance on the level and floors to climb between two placed spots; null when either is unplaced. */
export function walkFromMap(m, a, b) {
    const p = m.spots[a], q = m.spots[b];
    if (!p || !q)
        return null;
    return { m: Math.hypot(p.x - q.x, p.y - q.y) * k('routeFactor'), floors: q.floor - p.floor };
}
/** Recorded walking distances shorter than the straight line between their placed spots. */
export function shortcuts(st) {
    const m = st.map;
    if (!m)
        return [];
    const out = [];
    for (const [key, d] of Object.entries(st.links ?? {})) {
        const [a, b] = key.split('|'), s = straight(m, a, b);
        if (s != null && d < s - 1e-6)
            out.push(`${a} → ${b} recorded as ${d} m, shorter than the ${s.toFixed(1)} m straight line on the map`);
    }
    return out;
}
