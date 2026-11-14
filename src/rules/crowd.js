// People leaving a room through one exit (Room `exit_width_m`, `exit_pace`; docs/df-body-engine.md §6.22): the social force model of escape panic
// (Helbing, Farkas & Vicsek 2000, Nature 407:487, as uploaded arXiv cond-mat/0009448) run in code. Each person: mass 80 kg,
// radius drawn evenly 0.25–0.35 m, acceleration time 0.5 s, desired speed v0 toward the exit; between people and against walls
// a repulsion A e^((r − d)/B), A = 2000 N, B = 0.08 m, and on contact a body force k (r − d), k = 1.2 × 10⁵ kg/s², and sliding
// friction κ (r − d) Δv, κ = 2.4 × 10⁵ kg/(m s). Desired speeds: relaxed 0.6, normal 1, nervous below 1.5, panic up to 5 m/s
// and more. A person is crushed and stops, an obstacle to the rest, when the radial forces on them divided by their
// circumference exceed 1600 N/m. The paper calibrated the model to 0.73 persons a second through a 1 m door at 0.8 m/s.
// The room is taken as a square of its floor area with the exit in the middle of one wall [ASSUMED shape].
// Death in the press by compressive asphyxia (Hopkins, Pountney, Hayes & Sheppard 1993, "Crowd pressure monitoring", in
// Smith & Dickie, Engineering for Crowd Safety, as given by G. K. Still, Pressure modelling): 6,227 N on the chest for 15 s
// and 1,112 N for 4–6 minutes are estimated to have killed. Through both points (5 minutes for the second) the time to death
// is 15 s × (6,227 N ÷ F)^1.74 [FITTED], so each second at force F adds (F ÷ 6,227)^1.74 ÷ 15 of a lethal dose; below the
// 623 N at which men pressed against a bar first felt discomfort (same source) nothing adds [ASSUMED], and the dose does not
// wear off within the minutes of an evacuation [ASSUMED]. The force on the chest is taken as half the summed contact forces
// on the person, who is squeezed between two sides [ASSUMED].
export const PACES = { 'relaxed (0.6 m/s)': 0.6, 'normal (1 m/s)': 1.0, 'nervous, hurrying (1.5 m/s)': 1.5, 'panic, pushing (5 m/s)': 5.0 };
import { def, k, peek, reaches, REGISTRY_K } from './constants.js';
def({ id: 'asphyxiaN', value: 6227, unit: 'N on the chest that kills in asphyxiaS', status: 'sourced', src: 'Hopkins et al. 1993, as given by G. K. Still', range: [4500, 7000], file: 'crowd.ts' });
def({ id: 'asphyxiaS', value: 15, unit: 's to death at asphyxiaN', status: 'sourced', src: 'Hopkins et al. 1993, as given by G. K. Still', range: [10, 30], file: 'crowd.ts' });
def({ id: 'asphyxiaPow', value: 1.74, unit: 'power of force in the time to death', status: 'fitted', src: 'through 6,227 N for 15 s and 1,112 N for 4–6 min (Hopkins et al. 1993)', range: [1.6, 1.9], file: 'crowd.ts' });
def({ id: 'asphyxiaFloorN', value: 623, unit: 'N below which no asphyxia dose adds', status: 'assumed', src: 'discomfort threshold against a bar, Hopkins et al. 1993', range: [400, 1112], file: 'crowd.ts' });
def({ id: 'jostleN', value: 40, unit: 'N, the largest random push on a person per 4 ms step', status: 'assumed', src: 'the paper needs "a small amount of irregularity" and gives no size', range: [20, 80], file: 'crowd.ts' });
def({ id: 'courtesyS', value: 3, unit: 's locked at the door before a calm person gives way', status: 'assumed', src: 'a judgement: below 1.5 m/s the paper\'s own outflow stays regular', range: [2, 5], file: 'crowd.ts' });
def({ id: 'crushAvgS', value: 1, unit: 's over which the crushing pressure is averaged', status: 'assumed', src: 'a passing shove is not a crush; the paper gives no time', range: [0.5, 3], file: 'crowd.ts' });
const ASPHYXIA = ['asphyxiaN', 'asphyxiaS', 'asphyxiaPow', 'asphyxiaFloorN'];
/** Seconds a steady force on the chest (N) takes to kill by compressive asphyxia (Hopkins et al. 1993); Infinity below the floor.
 * The values are read without being counted as used: the crowd counts them (and the sensitivity reruns vary them) once
 * someone's dose could reach a death at some value in their ranges (asphyxiaBound). */
export function asphyxiaClock() {
    const F0 = peek('asphyxiaN'), T0 = peek('asphyxiaS'), PW = peek('asphyxiaPow'), FMIN = peek('asphyxiaFloorN');
    return chestN => chestN <= FMIN ? Infinity : T0 * (F0 / chestN) ** PW;
}
/** The shortest time to death at a chest force over every value in the four ranges: no dose at these times reaching 1 means
 * no value in the ranges kills anyone, and the run does not depend on them. */
export function asphyxiaBound() {
    const ends = (id) => { const c = REGISTRY_K.get(id), v = peek(id); return [v, ...(c.range ?? [])]; };
    const F0 = Math.min(...ends('asphyxiaN')), T0 = Math.min(...ends('asphyxiaS')), PWS = ends('asphyxiaPow'), FMIN = Math.min(...ends('asphyxiaFloorN'));
    const lo = Math.min(...PWS), hi = Math.max(...PWS);
    return chestN => { if (chestN <= FMIN)
        return Infinity; const q = F0 / chestN; return T0 * (q > 1 ? q ** lo : q ** hi); };
}
export const asphyxiaSeconds = (chestN) => { for (const id of ASPHYXIA)
    k(id); return asphyxiaClock()(chestN); };
/** Time step, s: the original 4 ms by default (see the speed check in docs/df-body-engine.md §6.22). */
export const DT_S = 0.004;
/** A stream of the crowd's own (mulberry32, Tommy Ettinger's public-domain generator), started from one number in [0, 1).
 * The crowd draws two numbers per person per step (2.9 million for 100 people leaving), and the call's own stream keeps
 * every draw it hands out in the turn's trace; seeded from one draw of it, the trace keeps one number for the whole crowd
 * and the run is the same from that number. */
export function crowdStream(seed) {
    let a = Math.floor(seed * 4294967296) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** `seed`: a number in [0, 1) or a stream to take one from. `dtS`: the time step. */
export function evacuate(people, floorM2, exitW, v0, seed, maxS = 600, dtS = DT_S) {
    const rng = crowdStream(typeof seed === 'number' ? seed : seed());
    // The model's people are discs 0.5–0.7 m across, so they start apart only up to about 2 a square metre: a denser crowd is
    // worked out on the floor it needs, spread back from the exit (Evacuation.floorM2 reports it) [ASSUMED].
    const N = Math.max(0, Math.min(300, Math.round(people))), per = Math.max(1, Math.ceil(Math.sqrt(N)));
    const L = Math.max(2, Math.sqrt(Math.max(1, floorM2)), 0.8 + per * 0.72), W = L;
    const A = 2000, B = 0.08, K = 1.2e5, KAP = 2.4e5, M = 80, TAU = 0.5, dt = dtS;
    // Beyond 0.6 m of clearance the repulsion is under A e^(−0.6 ÷ B) = 1.1 N, against a drive of 80 N or more: left out.
    const REACH = 0.6, WALL_NEAR = 0.35 + REACH;
    // The jostle keeps the same spread per second at any step: ±40 N at 4 ms, scaled by √(0.004 ÷ dt).
    const JOSTLE = 2 * k('jostleN') * Math.sqrt(0.004 / dt);
    const y0 = W / 2 - exitW / 2, y1 = W / 2 + exitW / 2;
    // Walls: segments [x1, y1, x2, y2]; the exit wall (x = L) has a gap.
    const walls = [[0, 0, 0, W], [0, 0, L, 0], [0, W, L, W], [L, 0, L, Math.max(0, y0)], [L, Math.min(W, y1), L, W]];
    const x = new Float64Array(N), y = new Float64Array(N), vx = new Float64Array(N), vy = new Float64Array(N), r = new Float64Array(N);
    const state = new Uint8Array(N); // 0 in, 1 out, 2 crushed, 3 dead
    // Start spread evenly over the room, about a metre apart where it fits [ASSUMED start].
    const gap = Math.min(1, (L - 0.8) / per);
    for (let i = 0; i < N; i++) {
        r[i] = 0.25 + 0.1 * rng();
        x[i] = 0.4 + (i % per) * gap + 0.05 * rng();
        y[i] = 0.4 + Math.floor(i / per) * gap + 0.05 * rng();
    }
    let out = 0, crushed = 0, dead = 0, last = null, avgRead = false;
    const outAt = Array(N).fill(null);
    const AVG = peek('crushAvgS'), dose = new Float64Array(N), tOf = asphyxiaClock(), tWorst = asphyxiaBound(), worst = new Float64Array(N);
    let doseRead = false;
    const fx = new Float64Array(N), fy = new Float64Array(N), pr = new Float64Array(N), avg = new Float64Array(N), times = [], stuck = new Float64Array(N), wait = new Float64Array(N);
    const steps = Math.round(maxS / dt), G = Math.ceil(L + 4), head = new Int32Array(G * G), next = new Int32Array(N);
    const cellOf = (i) => { const cx = Math.min(G - 1, Math.max(0, Math.floor(x[i] + 1))), cy = Math.min(G - 1, Math.max(0, Math.floor(y[i] + 1))); return cx * G + cy; };
    for (let s = 0; s < steps && out + crushed + dead < N; s++) {
        fx.fill(0);
        fy.fill(0);
        pr.fill(0);
        head.fill(-1);
        for (let i = 0; i < N; i++)
            if (state[i] !== 1) {
                const c = cellOf(i);
                next[i] = head[c];
                head[c] = i;
            }
        for (let i = 0; i < N; i++) {
            if (state[i] === 1)
                continue;
            if (state[i] === 0) {
                // Desired direction: to the nearest point of the doorway, then straight through it.
                const ty = Math.min(y1 - r[i], Math.max(y0 + r[i], y[i]));
                let ex = (x[i] < L ? L : L + 5) - x[i], ey = (x[i] < L ? ty : y[i]) - y[i];
                const en = Math.sqrt(ex * ex + ey * ey) || 1;
                ex /= en;
                ey /= en;
                // Calm people locked shoulder to shoulder at the door for 3 s: one gives way for a second [ASSUMED courtesy; only
                // below 1.5 m/s, where the paper's own outflow stays regular].
                const ddx = L - x[i], ddy = W / 2 - y[i], near = ddx * ddx + ddy * ddy < 4;
                stuck[i] = near && vx[i] * vx[i] + vy[i] * vy[i] < 0.0025 ? stuck[i] + dt : 0;
                if (v0 < 1.5 && stuck[i] > 0 && reaches('courtesyS', stuck[i]) && rng() < 0.5) {
                    wait[i] = 1;
                    stuck[i] = 0;
                }
                const want = wait[i] > 0 ? 0 : v0;
                if (wait[i] > 0)
                    wait[i] -= dt;
                fx[i] += M * (want * ex - vx[i]) / TAU;
                fy[i] += M * (want * ey - vy[i]) / TAU;
                // A small jostle: the paper needs "a small amount of irregularity" to keep balanced forces from locking two
                // people in a doorway for ever; ±40 N per 4 ms step [ASSUMED size].
                fx[i] += JOSTLE * (rng() - 0.5);
                fy[i] += JOSTLE * (rng() - 0.5);
            }
            else {
                fx[i] -= M * vx[i] / TAU;
                fy[i] -= M * vy[i] / TAU;
            }
            // Each pair once (j > i), equal and opposite (Newton's third law).
            const cx = Math.floor(x[i] + 1), cy = Math.floor(y[i] + 1);
            for (let a = -1; a <= 1; a++)
                for (let b = -1; b <= 1; b++) {
                    const gx = cx + a, gy = cy + b;
                    if (gx < 0 || gy < 0 || gx >= G || gy >= G)
                        continue;
                    for (let j = head[gx * G + gy]; j !== -1; j = next[j]) {
                        if (j <= i)
                            continue;
                        const dx = x[i] - x[j], dy = y[i] - y[j], rij = r[i] + r[j], lim = rij + REACH, d2 = dx * dx + dy * dy;
                        if (d2 > lim * lim)
                            continue;
                        const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, ov = rij - d, g = ov > 0 ? ov : 0;
                        const rad = A * Math.exp(ov / B) + K * g;
                        fx[i] += rad * nx;
                        fy[i] += rad * ny;
                        fx[j] -= rad * nx;
                        fy[j] -= rad * ny;
                        if (g > 0) {
                            pr[i] += K * g;
                            pr[j] += K * g;
                            const tx2 = -ny, ty2 = nx, dvt = (vx[j] - vx[i]) * tx2 + (vy[j] - vy[i]) * ty2;
                            // Friction, capped so one step cannot reverse the sliding (keeps the step stable).
                            const fr = Math.sign(dvt) * Math.min(KAP * g * Math.abs(dvt), M * Math.abs(dvt) / (4 * dt));
                            fx[i] += fr * tx2;
                            fy[i] += fr * ty2;
                            fx[j] -= fr * tx2;
                            fy[j] -= fr * ty2;
                        }
                    }
                }
            // Walls only for someone within reach of one.
            if (x[i] > WALL_NEAR && x[i] < L - WALL_NEAR && y[i] > WALL_NEAR && y[i] < W - WALL_NEAR)
                continue;
            for (const [ax, ay, bx, by] of walls) {
                const wx = bx - ax, wy = by - ay, l2 = wx * wx + wy * wy;
                if (l2 < 1e-9)
                    continue;
                const t = Math.max(0, Math.min(1, ((x[i] - ax) * wx + (y[i] - ay) * wy) / l2)), px = ax + t * wx, py = ay + t * wy;
                const dx = x[i] - px, dy = y[i] - py, d2 = dx * dx + dy * dy, lim = r[i] + REACH;
                if (d2 > lim * lim)
                    continue;
                const d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, ov = r[i] - d, g = ov > 0 ? ov : 0;
                const rad = A * Math.exp(ov / B) + K * g;
                fx[i] += rad * nx;
                fy[i] += rad * ny;
                pr[i] += K * g;
                if (g > 0) {
                    const tx2 = -ny, ty2 = nx, vt = vx[i] * tx2 + vy[i] * ty2, fr = Math.sign(vt) * Math.min(KAP * g * Math.abs(vt), M * Math.abs(vt) / (4 * dt));
                    fx[i] -= fr * tx2;
                    fy[i] -= fr * ty2;
                }
            }
        }
        for (let i = 0; i < N; i++) {
            if (state[i] === 1)
                continue;
            // Crushed: the body (contact) forces pressing on a person, over their circumference, past 1600 N/m [the paper's
            // "radial forces" read as the contact forces: the long-range repulsion is a social distance, not a load].
            // averaged over about a second [ASSUMED: a passing shove is not a crush].
            // An average of pressures all under 1600 N/m stays under it whatever the averaging time, so that time counts as used
            // from the first pressure past 1600 N/m.
            const press = pr[i] / (2 * Math.PI * r[i]);
            if (!avgRead && press > 1600) {
                avgRead = true;
                k('crushAvgS');
            }
            avg[i] += (press - avg[i]) * dt / AVG;
            if (state[i] === 0 && avg[i] > 1600) {
                state[i] = 2;
                crushed++;
            }
            const chest = pr[i] / 2;
            if (state[i] !== 3 && chest > 0) {
                const tS = tOf(chest);
                if (tS < Infinity)
                    dose[i] += dt / tS;
                if (!doseRead) {
                    const tW = tWorst(chest);
                    if (tW < Infinity && (worst[i] += dt / tW) >= 1) {
                        doseRead = true;
                        for (const id of ASPHYXIA)
                            k(id);
                    }
                }
                if (dose[i] >= 1) {
                    if (state[i] === 2)
                        crushed--;
                    state[i] = 3;
                    dead++;
                }
            }
            vx[i] += fx[i] / M * dt;
            vy[i] += fy[i] / M * dt;
            const sp2 = vx[i] * vx[i] + vy[i] * vy[i], vmax = state[i] >= 2 ? 0.2 : Math.max(1.3 * v0, 1);
            if (sp2 > vmax * vmax) {
                const sp = Math.sqrt(sp2);
                vx[i] *= vmax / sp;
                vy[i] *= vmax / sp;
            }
            x[i] += vx[i] * dt;
            y[i] += vy[i] * dt;
            if (state[i] === 0 && x[i] > L + 0.5) {
                state[i] = 1;
                out++;
                last = s * dt;
                times.push(last);
                outAt[i] = last;
            }
        }
    }
    // Flow through the door: people per second between the 10th and the 90th out (the steady part).
    const a = times[Math.floor(times.length * 0.1)], b = times[Math.max(0, Math.ceil(times.length * 0.9) - 1)];
    const flow = times.length >= 5 && b > a ? (Math.ceil(times.length * 0.9) - 1 - Math.floor(times.length * 0.1)) / (b - a) : 0;
    return { people: N, out, seconds: out + crushed + dead === N && out ? last : null, lastOutS: last, crushed, dead, flow, firstOutS: times[0] ?? null, floorM2: L * W, fates: Array.from(state), outAtS: outAt };
}
