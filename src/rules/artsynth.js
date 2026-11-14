// Articulatory synthesis: a port of Praat's articulatory synthesizer (Boersma 1998, Functional Phonology, ch. 2–5; Praat
// source artsynth/, github.com/praat/praat commit 6a9874e, (C) Paul Boersma, GNU GPL version 2 or later; this port is under
// this repository's GPL-3.0). The voice at the deepest layer that can be computed here (AGENTS.md, "Derive; do not look up"):
// the airways as 89 tubes with moving walls, the vocal folds as two masses on springs, the tract's shape from Mermelstein's
// (1973) articulatory model driven by 29 muscles; air pressure, flow and the walls' motion are integrated in time, and the
// sound at 0.4 m is what the open ends and moving walls radiate. Pitch, loudness and formants are measured from that sound
// (voice-sound.ts), not written down. Equation numbers in comments are Boersma (1998)'s, as Praat's source gives them.
/** The muscles, in Praat's order (Articulation_enums.h): 0 = relaxed, 1 = fully active (Lungs: the lungs' volume pull). */
export const MUSCLES = ['', 'Lungs', 'Interarytenoid', 'Cricothyroid', 'Vocalis', 'Thyroarytenoid', 'PosteriorCricoarytenoid', 'LateralCricoarytenoid',
    'Stylohyoid', 'Sternohyoid', 'Thyropharyngeus', 'LowerConstrictor', 'MiddleConstrictor', 'UpperConstrictor', 'Sphincter', 'Hyoglossus', 'Styloglossus',
    'Genioglossus', 'UpperTongue', 'LowerTongue', 'TransverseTongue', 'VerticalTongue', 'Risorius', 'OrbicularisOris', 'LevatorPalatini', 'TensorPalatini',
    'Masseter', 'Mylohyoid', 'LateralPterygoid', 'Buccinator'];
const M = Object.fromEntries(MUSCLES.map((m, i) => [m, i]));
/** Praat's Speaker_create: the folds of Ishizaka & Flanagan's male (and Praat's female and child), metres, kilograms,
 * newtons per metre; the tract of Mermelstein's speaker scaled 1.1 (male), 1.0 (female), 0.7 (child). */
export function speakerOf(kind, relativeSize) {
    const s = relativeSize ?? (kind === 'male' ? 1.1 : kind === 'child' ? 0.7 : 1.0);
    const cords = kind === 'female' ? { lo: [1.4e-3, 0.02e-3, 10], up: [0.7e-3, 0.01e-3, 4], len: 10e-3 }
        : kind === 'male' ? { lo: [2.0e-3, 0.1e-3, 12], up: [1.0e-3, 0.05e-3, 4], len: 18e-3 } : { lo: [0.7e-3, 0.003e-3, 6], up: [0.3e-3, 0.002e-3, 2], len: 6e-3 };
    const velum = { x: -0.031 * s, y: 0.023 * s };
    return {
        relativeSize: s,
        lowerCord: { thickness: cords.lo[0], mass: cords.lo[1], k1: cords.lo[2] }, upperCord: { thickness: cords.up[0], mass: cords.up[1], k1: cords.up[2] }, cordLength: cords.len,
        velum, palateRadius: Math.hypot(velum.x, velum.y), tipLength: 0.034 * s, neutralBodyDistance: 0.086 * s,
        alveoli: { x: 0.024 * s, y: 0.0302 * s }, teethCavity: { dx1: -0.009 * s, dx2: -0.004 * s, dy: -0.011 * s }, lowerTeeth: { a: -0.30, r: 0.113 * s },
        upperTeeth: { x: 0.036 * s, y: 0.026 * s }, lowerLip: { dx: 0.010 * s, dy: -0.004 * s }, upperLip: { dx: 0.010 * s, dy: 0.004 * s },
        nose: { Dx: 0.007 * s, Dz: 0.014 * s, weq: [0, 0.018, 0.016, 0.014, 0.020, 0.023, 0.020, 0.035, 0.035, 0.030, 0.022, 0.016, 0.010, 0.012, 0.013].map(w => w * s) },
    };
}
/** The muscles' activity at a time (Artword_intoArt): index = muscle number. */
export function artAt(w, time) {
    const art = new Float64Array(MUSCLES.length);
    for (const [name, ts] of Object.entries(w.targets)) {
        const pts = [...ts].sort((a, b) => a[0] - b[0]);
        if (!pts.length)
            continue;
        if (pts[0][0] > 0)
            pts.unshift([0, 0]);
        if (pts.at(-1)[0] < w.totalTime)
            pts.push([w.totalTime, 0]);
        let i = 0;
        while (i < pts.length - 2 && time > pts[i + 1][0])
            i++;
        const [t0, v0] = pts[i], [t1, v1] = pts[i + 1];
        art[M[name]] = t1 > t0 ? v0 + (time - t0) * (v1 - v0) / (t1 - t0) : v0;
    }
    return art;
}
// ------------------------------------------------------------------------------------------------------------- geometry
/** Art_Speaker_toVocalTract: the inner (tongue, jaw, lips) and outer (pharynx wall, palate, upper lip) contours, 1-based. */
function toVocalTract(art, sp) {
    const f = sp.relativeSize * 1e-3, intX = new Float64Array(17), intY = new Float64Array(17), extX = new Float64Array(12), extY = new Float64Array(12);
    const hyoid = { dx: -5 * f * art[M.Sphincter], dy: 20 * f * (art[M.Stylohyoid] - art[M.Sternohyoid]) };
    intX[1] = -14.0 * f + 0.5 * hyoid.dx;
    intY[1] = -53.0 * f + hyoid.dy;
    intX[2] = -20.0 * f + hyoid.dx;
    intY[2] = -33.0 * f + hyoid.dy;
    intX[3] = -20.0 * f + hyoid.dx;
    intY[3] = -26.0 * f + hyoid.dy;
    intX[4] = -16.0 * f + hyoid.dx;
    intY[4] = -26.0 * f + hyoid.dy;
    extX[1] = -22.0 * f + hyoid.dx;
    extY[1] = -53.0 * f + hyoid.dy;
    extX[2] = -26.0 * f + hyoid.dx;
    extY[2] = -40.0 * f + hyoid.dy;
    extX[3] = -34.0 * f + art[M.Sphincter] * (5.0 * f);
    extY[3] = extY[2];
    extX[5] = -34.0 * f + art[M.Sphincter] * (5.0 * f);
    extY[5] = sp.velum.y;
    extX[4] = -34.0 * f + art[M.Sphincter] * (5.0 * f);
    extY[4] = 0.5 * (extY[3] + extY[5]);
    const jaw = { x: -75.0 * f, y: 53.0 * f, da: art[M.Masseter] * 0.15 - art[M.Mylohyoid] * 0.20 };
    const body = { x: jaw.x + 81.0 * f * Math.cos(-0.60 + jaw.da) - art[M.Styloglossus] * (10.0 * f) + art[M.Genioglossus] * (10.0 * f),
        y: jaw.y + 81.0 * f * Math.sin(-0.60 + jaw.da) - art[M.Hyoglossus] * (10.0 * f) + art[M.Styloglossus] * (5.0 * f), r: 0, radius: 20.0 * f };
    body.r = Math.hypot(jaw.x - body.x, jaw.y - body.y);
    const tangent = (i) => {
        const hx = body.x - intX[i], hy = body.y - intY[i];
        let HC = Math.hypot(hx, hy), Sp;
        if (HC <= body.radius) {
            HC = body.radius;
            Sp = 0;
        }
        else
            Sp = Math.sqrt(HC * HC - body.radius * body.radius);
        return { Sp, a: Math.atan2(hy, hx), b: Math.asin(body.radius / HC) };
    };
    {
        const { Sp, a, b } = tangent(4), p = 0.57 * (34.8 * f - Sp);
        intX[5] = intX[4] + 0.5 * Sp * Math.cos(a + b) - p * Math.sin(a + b);
        intY[5] = intY[4] + 0.5 * Sp * Math.sin(a + b) + p * Math.cos(a + b);
    }
    {
        const { Sp, a, b } = tangent(5);
        intX[6] = intX[5] + Sp * Math.cos(a + b);
        intY[6] = intY[5] + Sp * Math.sin(a + b);
    }
    const teethA = sp.lowerTeeth.a + jaw.da;
    intX[7] = body.x + body.radius * Math.cos(1.73 + teethA);
    intY[7] = body.y + body.radius * Math.sin(1.73 + teethA);
    const tipA = (art[M.UpperTongue] - art[M.LowerTongue]) * 1.0, bladeA = teethA + 0.004 * (body.r - sp.neutralBodyDistance) + tipA;
    intX[8] = intX[7] + sp.tipLength * Math.cos(bladeA);
    intY[8] = intY[7] + sp.tipLength * Math.sin(bladeA);
    const teeth = { x: jaw.x + sp.lowerTeeth.r * Math.cos(teethA), y: jaw.y + sp.lowerTeeth.r * Math.sin(teethA) };
    intX[9] = teeth.x + sp.teethCavity.dx1;
    intY[9] = teeth.y + sp.teethCavity.dy;
    intX[10] = teeth.x + sp.teethCavity.dx2;
    intY[10] = intY[9];
    intX[11] = teeth.x;
    intY[11] = teeth.y;
    const lowerLip = { dx: sp.lowerLip.dx + art[M.OrbicularisOris] * 0.02 - 5e-3, dy: sp.lowerLip.dy + art[M.OrbicularisOris] * 0.01 };
    intX[12] = teeth.x;
    intY[12] = teeth.y + lowerLip.dy;
    intX[13] = teeth.x + lowerLip.dx;
    intY[13] = intY[12];
    extX[6] = sp.velum.x;
    extY[6] = sp.velum.y;
    extX[7] = sp.alveoli.x;
    extY[7] = sp.alveoli.y;
    extX[8] = sp.upperTeeth.x;
    extY[8] = sp.upperTeeth.y;
    const upperLip = { dx: sp.upperLip.dx + art[M.OrbicularisOris] * 0.02 - 5e-3, dy: sp.upperLip.dy - art[M.OrbicularisOris] * 0.01 };
    const DLIP = 5e-3;
    extX[9] = extX[8];
    extY[9] = extY[8] + upperLip.dy;
    extX[10] = extX[9] + upperLip.dx;
    extY[10] = extY[9];
    extX[11] = extX[10] + 5e-3;
    extY[11] = extY[10] + DLIP;
    intX[14] = intX[13] + 5e-3;
    intY[14] = intY[13] - DLIP;
    intX[15] = intX[11] + 0.5e-2;
    intY[15] = intY[11] - 3.0e-2;
    intX[16] = intX[1];
    intY[16] = intY[1];
    return { intX, intY, extX, extY, bodyX: body.x, bodyY: body.y };
}
const arcLength = (from, to) => { let r = to - from; while (r > 0)
    r -= 2 * Math.PI; while (r < 0)
    r += 2 * Math.PI; return r; };
const MESH = 27;
/** Art_Speaker_meshVocalTract: 27 mesh lines across the tract from the outer contour to the inner one (eq. 5.45–5.47), their
 * mid-points' path, and whether each crosses a closure. */
export function meshVocalTract(art, sp) {
    const f = sp.relativeSize * 1e-3, { intX, intY, extX, extY, bodyX, bodyY } = toVocalTract(art, sp), bodyRadius = 20.0 * f;
    const xe = new Float64Array(40), ye = new Float64Array(40), xi = new Float64Array(40), yi = new Float64Array(40), xm = new Float64Array(40), ym = new Float64Array(40);
    const xmm = new Float64Array(40), ymm = new Float64Array(40), closed = new Array(40).fill(false);
    const toLine = (x, y, i) => {
        let nearby;
        if (i === 6) {
            const a7 = Math.atan2(intY[7] - bodyY, intX[7] - bodyX), a6 = Math.atan2(intY[6] - bodyY, intX[6] - bodyX), a = Math.atan2(y - bodyY, x - bodyX);
            const da6 = arcLength(a7, a6), da = arcLength(a7, a);
            if (da <= da6)
                return Math.abs(Math.hypot(bodyX - x, bodyY - y) - bodyRadius);
            nearby = arcLength(a7 + 0.5 * da6, a) < Math.PI ? 6 : 7;
        }
        else if ((x - intX[i]) * (intX[i + 1] - intX[i]) + (y - intY[i]) * (intY[i + 1] - intY[i]) < 0)
            nearby = i;
        else if ((x - intX[i + 1]) * (intX[i] - intX[i + 1]) + (y - intY[i + 1]) * (intY[i] - intY[i + 1]) < 0)
            nearby = i + 1;
        else {
            const boundary = Math.hypot(intX[i + 1] - intX[i], intY[i + 1] - intY[i]);
            return Math.abs((intX[i] - x) * (intY[i + 1] - intY[i]) - (intY[i] - y) * (intX[i + 1] - intX[i])) / boundary;
        }
        return Math.hypot(intX[nearby] - x, intY[nearby] - y);
    };
    const inside = (x, y) => {
        let up = 0;
        for (let i = 1; i <= 15; i++)
            if ((y > intY[i]) !== (y > intY[i + 1])) {
                const slope = (intX[i + 1] - intX[i]) / (intY[i + 1] - intY[i]);
                if (x > intX[i] + (y - intY[i]) * slope)
                    up += y > intY[i] ? 1 : -1;
            }
        return up !== 0 || bodyRadius * bodyRadius > (x - bodyX) ** 2 + (y - bodyY) ** 2;
    };
    xe[1] = extX[1];
    ye[1] = extY[1];
    xe[2] = 0.2 * extX[2] + 0.8 * extX[1];
    ye[2] = 0.2 * extY[2] + 0.8 * extY[1];
    xe[3] = 0.6 * extX[2] + 0.4 * extX[1];
    ye[3] = 0.6 * extY[2] + 0.4 * extY[1];
    const mix = (k, a, b, wa) => { xe[k] = wa * extX[a] + (1 - wa) * extX[b]; ye[k] = wa * extY[a] + (1 - wa) * extY[b]; };
    mix(4, 3, 4, 0.9);
    mix(5, 3, 4, 0.7);
    mix(6, 3, 4, 0.5);
    mix(7, 3, 4, 0.3);
    mix(8, 3, 4, 0.1);
    mix(9, 4, 5, 0.9);
    mix(10, 4, 5, 0.7);
    mix(11, 4, 5, 0.5);
    mix(12, 4, 5, 0.3);
    mix(13, 4, 5, 0.1);
    const dAngle = (Math.atan2(ye[13], xe[13]) - 0.5 * Math.PI) / 6;
    for (let i = 14; i <= 18; i++) {
        const a = 0.5 * Math.PI + (19 - i) * dAngle;
        xe[i] = sp.palateRadius * Math.cos(a);
        ye[i] = sp.palateRadius * Math.sin(a);
    }
    xe[19] = 0;
    ye[19] = sp.palateRadius;
    xe[20] = 0.25 * extX[7];
    xe[21] = 0.50 * extX[7];
    xe[22] = 0.75 * extX[7];
    for (let i = 20; i <= 22; i++)
        ye[i] = sp.palateRadius * Math.sqrt(1.0 - xe[i] * xe[i] / (sp.palateRadius * sp.palateRadius));
    xe[23] = extX[7];
    ye[23] = extY[7];
    xe[24] = 0.5 * (extX[7] + extX[8]);
    ye[24] = 0.5 * (extY[7] + extY[8]);
    xe[25] = extX[8];
    ye[25] = extY[8];
    xe[26] = 0.25 * extX[11] + 0.75 * extX[9];
    xe[27] = 0.75 * extX[11] + 0.25 * extX[9];
    ye[26] = extY[10];
    ye[27] = 0.5 * (extY[10] + extY[11]);
    for (let i = 1; i <= MESH; i++) {
        let minimum = 100000;
        for (let j = 1; j <= 14; j++) {
            const d = toLine(xe[i], ye[i], j);
            if (d < minimum)
                minimum = d;
        }
        if ((closed[i] = inside(xe[i], ye[i])))
            minimum = -minimum;
        if (xe[i] >= 0) {
            xi[i] = xe[i];
            yi[i] = ye[i] - minimum;
        }
        else if (ye[i] <= 0) {
            xi[i] = xe[i] + minimum;
            yi[i] = ye[i];
        }
        else {
            const angle = Math.atan2(ye[i], xe[i]);
            xi[i] = xe[i] - minimum * Math.cos(angle);
            yi[i] = ye[i] - minimum * Math.sin(angle);
        }
    }
    for (let i = 1; i <= MESH; i++) {
        xm[i] = 0.5 * (xe[i] + xi[i]);
        ym[i] = 0.5 * (ye[i] + yi[i]);
    }
    for (let i = 2; i <= MESH; i++) {
        xmm[i] = 0.5 * (xm[i - 1] + xm[i]);
        ymm[i] = 0.5 * (ym[i - 1] + ym[i]);
    }
    xmm[1] = 2.0 * xm[1] - xmm[2];
    ymm[1] = 2.0 * ym[1] - ymm[2];
    xmm[MESH + 1] = 2.0 * xm[MESH] - xmm[MESH];
    ymm[MESH + 1] = 2.0 * ym[MESH] - ymm[MESH];
    return { xi, yi, xe, ye, xmm, ymm, closed };
}
const newTube = (index) => ({ index, left1: null, left2: null, right1: null, right2: null, parallel: 1,
    Dxeq: 0, Dyeq: 0, Dzeq: 0, mass: 0, k1: 0, k3: 0, Brel: 0, s1: 0, s3: 0, dy: 0, k1left1: 0, k1right1: 0,
    Jhalf: 0, Jleft: 0, Jleftnew: 0, Jright: 0, Jrightnew: 0, Qhalf: 0, Qleft: 0, Qleftnew: 0, Qright: 0, Qrightnew: 0,
    Dx: 0, Dxnew: 0, dDxdt: 0, dDxdtnew: 0, Dxhalf: 0, Dy: 0, Dynew: 0, dDydt: 0, dDydtnew: 0, Dz: 0,
    A: 0, Ahalf: 0, Anew: 0, V: 0, Vnew: 0, e: 0, ehalf: 0, eleft: 0, eleftnew: 0, eright: 0, erightnew: 0,
    p: 0, phalf: 0, pleft: 0, pleftnew: 0, pright: 0, prightnew: 0, Kleft: 0, Kleftnew: 0, Kright: 0, Krightnew: 0,
    Pturbright: 0, Pturbrightnew: 0, B: 0, r: 0, R: 0, DeltaP: 0, v: 0 });
const FIRST_TUBE = 7;
/** Speaker_to_Delta (two-mass folds, no shunt, smoothed lungs): the 89 tubes. 1-based: tube i is tubes[i]. */
export function speakerToTubes(sp) {
    const f = sp.relativeSize * 1e-3, T = Array.from({ length: 90 }, (_, i) => newTube(i));
    const set = (t, Dx, Dy, Dz) => { t.Dx = t.Dxeq = Dx; t.Dy = t.Dyeq = Dy; t.Dz = t.Dzeq = Dz; };
    for (let i = 1; i <= 23; i++) {
        const t = T[i];
        set(t, 10 * f, 100 * f, 230 * f);
        t.mass = 10 * sp.relativeSize * t.Dx * t.Dz;
        t.k1 = 200;
        t.k3 = 0;
        t.Brel = 0.8;
        t.parallel = 1000;
    }
    for (let i = 24; i <= 29; i++) {
        const t = T[i];
        set(t, 10 * f, 15 * f, 30 * f);
        t.mass = 10 * f;
        t.k1 = 40;
        t.k3 = 0;
        t.Brel = 0.8;
    }
    for (let i = 30; i <= 35; i++) {
        const t = T[i];
        set(t, 10 * f, 15 * f, 16 * f);
        t.mass = 5 * f;
        t.k1 = 160;
        t.k3 = 0;
        t.Brel = 0.8;
    }
    // SMOOTH_LUNGS
    const lungs = [[7, 120, 240, 5000], [8, 120, 240, 5000], [9, 120, 240, 5000], [10, 120, 240, 5000], [11, 120, 240, 5000], [12, 120, 240, 5000],
        [13, 120, 240, 2500], [14, 120, 240, 1250], [15, 120, 240, 640], [16, 120, 240, 320], [17, 120, 240, 160], [18, 120, 140, 80], [19, 70, 70, 40], [20, 35, 35, 20],
        [21, 18, 18, 10], [22, 12, 12, 5], [23, 12, 12, 3], [24, 18, 9, 2], [25, 18, 19, 2]];
    for (const [i, Dy, Dz, par] of lungs) {
        const t = T[i];
        t.Dy = t.Dyeq = Dy * f;
        t.Dz = t.Dzeq = Dz * f;
        t.parallel = par;
    }
    for (let i = 26; i <= 35; i++) {
        const t = T[i];
        t.Dy = t.Dyeq = 11 * f;
        t.Dz = t.Dzeq = 14 * f;
        t.parallel = 1;
    }
    for (let i = FIRST_TUBE; i <= 18; i++) {
        const t = T[i];
        t.Dx = t.Dxeq = 10 * f;
        t.mass = 10 * sp.relativeSize * t.Dx * t.Dz;
        t.k1 = 1e5 * t.Dx * t.Dz;
        t.k3 = 0;
        t.Brel = 1;
    }
    for (let i = 19; i <= 35; i++) {
        const t = T[i];
        t.Dx = t.Dxeq = 10 * f;
        t.mass = 3 * sp.relativeSize * t.Dx * t.Dz;
        t.k1 = 10e5 * t.Dx * t.Dz;
        t.k3 = 0;
        t.Brel = 1;
    }
    // The glottis: tubes 36 (lower fold) and 37 (upper fold), coupled by a spring.
    for (const [i, c] of [[36, sp.lowerCord], [37, sp.upperCord]]) {
        const t = T[i];
        set(t, c.thickness, 0, sp.cordLength);
        t.mass = c.mass;
        t.k1 = c.k1;
        t.k3 = t.k1 * (20 / t.Dz) ** 2;
        t.Brel = 0.2;
    }
    T[37].k1left1 = T[36].k1right1 = 1.0;
    // Pharynx and mouth: tubes 38..64 from the neutral articulation.
    const mesh = meshVocalTract(new Float64Array(MUSCLES.length), sp);
    for (let i38 = 38; i38 <= 64; i38++) {
        const t = T[i38], i = i38 - 37;
        t.Dx = t.Dxeq = Math.hypot(mesh.xmm[i] - mesh.xmm[i + 1], mesh.ymm[i] - mesh.ymm[i + 1]);
        t.Dyeq = Math.hypot(mesh.xe[i] - mesh.xi[i], mesh.ye[i] - mesh.yi[i]);
        if (mesh.closed[i])
            t.Dyeq = -t.Dyeq;
        t.Dy = t.Dyeq;
        t.Dz = t.Dzeq = 0.015;
        t.mass = 0.006;
        t.k1 = 30;
        t.k3 = 0;
        t.Brel = 1;
    }
    // Nose: tubes 65..78; the nasopharyngeal port (65) starts closed.
    for (let i = 65; i <= 78; i++) {
        const t = T[i];
        set(t, sp.nose.Dx, sp.nose.weq[i - 64], sp.nose.Dz);
        t.mass = 0.006;
        t.k1 = 100;
        t.k3 = 0;
        t.Brel = 1;
    }
    T[65].Dy = T[65].Dyeq = 0;
    // Each tube linked to the tube before and after it.
    for (let i = FIRST_TUBE; i <= 89; i++) {
        const t = T[i];
        t.s1 = 5e6 * t.Dx * t.Dz;
        t.s3 = t.s1 / (0.9e-3 * 0.9e-3);
        t.dy = 1e-5;
        t.left1 = T[i - 1] ?? null;
        t.right1 = T[i + 1] ?? null;
    }
    T[FIRST_TUBE].left1 = null; // closed at the diaphragm
    for (let i = 79; i <= 89; i++)
        T[i].left1 = T[i].right1 = null; // no conus elasticus, no shunt
    T[50].right2 = T[65];
    T[65].left1 = T[50]; // the nasopharyngeal port: pharynx (50) to mouth (51) and nose (65)
    T[65].Dxeq = T[51].Dxeq = T[50].Dxeq;
    T[65].Dx = T[51].Dx = T[50].Dx;
    T[64].right1 = null;
    T[78].right1 = null; // radiation at the lips and the nostrils
    T[78].right1 = null;
    T[79].left1 = null;
    return T;
}
/** Art_Speaker_intoDelta: the muscles' activity sets the lungs' width, the glottis' opening and the folds' springs, the
 * tract's equilibrium widths and lengths, and the nasopharyngeal port. */
export function artIntoTubes(art, sp, T) {
    const f = sp.relativeSize * 1e-3;
    for (let i = 7; i <= 18; i++)
        T[i].Dyeq = 120 * f * (1 + art[M.Lungs]);
    const g = T[36];
    g.Dyeq = f * (5 - 10 * art[M.Interarytenoid] + 3 * art[M.PosteriorCricoarytenoid] - 3 * art[M.LateralCricoarytenoid]); // 4.38
    g.k1 = sp.lowerCord.k1 * (1 + art[M.Cricothyroid]);
    g.k3 = g.k1 * (20 / g.Dz) ** 2;
    const u = T[37];
    u.Dyeq = g.Dyeq;
    u.k1 = sp.upperCord.k1 * (1 + art[M.Cricothyroid]);
    u.k3 = u.k1 * (20 / u.Dz) ** 2;
    const mesh = meshVocalTract(art, sp);
    for (let i38 = 38; i38 <= 64; i38++) {
        const t = T[i38], i = i38 - 37;
        t.Dxeq = Math.hypot(mesh.xmm[i] - mesh.xmm[i + 1], mesh.ymm[i] - mesh.ymm[i + 1]);
        t.Dyeq = Math.hypot(mesh.xe[i] - mesh.xi[i], mesh.ye[i] - mesh.yi[i]);
        if (mesh.closed[i])
            t.Dyeq = -t.Dyeq;
    }
    T[65].Dxeq = T[51].Dxeq = T[50].Dxeq;
    T[65].Dyeq = f * (18 - 25 * art[M.LevatorPalatini]); // 4.40
    for (let i = 1; i <= 89; i++) {
        const t = T[i];
        t.s1 = 5e6 * t.Dxeq * t.Dzeq;
        t.s3 = t.s1 / (0.9e-3 * 0.9e-3);
    }
}
// ------------------------------------------------------------------------------------------------------------- the sound
const Dymin = 0.00001, criticalVelocity = 10.0, noiseFactor = 0.1;
export function synthesize(w, sp, o = {}) {
    const steps = runSteps(w, sp, o);
    for (;;) {
        const r = steps.next();
        if (r.done)
            return r.value;
    }
}
/** The same run, handing the page back its thread every `chunk` output samples (default 100: about 30 ms of computing,
 * under the 50 ms within which a page should answer input: the RAIL model, web.dev). */
export async function synthesizeAsync(w, sp, o = {}) {
    const steps = runSteps(w, sp, o);
    for (;;) {
        const r = steps.next();
        if (r.done)
            return r.value;
        await new Promise(res => setTimeout(res, 0));
    }
}
function* runSteps(w, sp, o) {
    const chunk = o.chunk ?? 100;
    const gauss = o.rng ? () => 1 + noiseFactor * Math.sqrt(-2 * Math.log(1 - o.rng())) * Math.cos(2 * Math.PI * o.rng()) : null;
    const fsamp = o.fsamp ?? 22050, oversampling = o.oversampling ?? 25, n = Math.round(w.totalTime * fsamp), sound = new Float64Array(n);
    const Dt = 1 / fsamp / oversampling, rho0 = 1.14, c = 353.0, onebyc2 = 1 / (c * c), rho0c2 = rho0 * c * c, halfDt = 0.5 * Dt, twoDt = 2 * Dt;
    const halfc2Dt = 0.5 * c * c * Dt, twoc2Dt = 2 * c * c * Dt, onebytworho0 = 1 / (2 * rho0), Dtbytworho0 = Dt / (2 * rho0);
    const T = speakerToTubes(sp), tubes = T.slice(1), live = tubes.filter(t => t.left1 || t.right1), watch = o.watch ?? [], widths = watch.map(() => new Float64Array(n));
    const watchP = o.watchP ?? [], pressures = watchP.map(() => new Float64Array(n)), watchU = o.watchU ?? [], flows = watchU.map(() => new Float64Array(n));
    artIntoTubes(artAt(w, 0), sp, T);
    const area = (t, Dy) => t.Dz * (Dy >= t.dy ? Dy + Dymin : Dy <= -t.dy ? Dymin : (t.dy + Dy) * (t.dy + Dy) / (4 * t.dy) + Dymin); // 4.4, 4.5
    let volume0 = 0;
    for (const t of live) {
        t.Dx = t.Dxeq;
        t.dDxdt = 0;
        t.Dy = t.Dyeq;
        t.dDydt = 0;
        t.Dz = t.Dzeq; // 5.113
        t.A = area(t, t.Dy);
        t.Jleft = t.Jright = 0;
        t.Qleft = t.Qright = rho0c2;
        t.pleft = t.pright = 0;
        t.Kleft = t.Kright = 0;
        t.V = t.A * t.Dx; // 5.113, 5.114
        volume0 += t.V;
    }
    const half = Math.floor((oversampling + 1) / 2);
    for (let sample = 0; sample < n; sample++) {
        if (sample && sample % chunk === 0)
            yield;
        artIntoTubes(artAt(w, sample / fsamp), sp, T);
        for (let step = 1; step <= oversampling; step++) {
            for (const t of live) {
                t.Dxnew = t.Dx; // constant tube lengths
                if (t.left1 && t.left1.right2)
                    t.Dxnew = t.left1.Dxnew; // three-way: equal lengths
                t.Dz = t.Dzeq;
                t.eleft = (t.Qleft - t.Kleft) * t.V;
                t.eright = (t.Qright - t.Kright) * t.V; // 5.115
                t.e = 0.5 * (t.eleft + t.eright);
                t.p = 0.5 * (t.pleft + t.pright); // 5.116
                t.DeltaP = t.e / t.V - rho0c2; // 5.117
                t.v = t.p / (rho0 + onebyc2 * t.DeltaP); // 5.118
                const dDy = t.Dyeq - t.Dy, cubic = t.k3 * dDy * dDy;
                let tension = dDy * (t.k1 + cubic);
                t.B = 2 * t.Brel * Math.sqrt(t.mass * (t.k1 + 3 * cubic));
                if (t.k1left1 !== 0 && t.left1)
                    tension += t.k1left1 * t.k1 * (dDy - (t.left1.Dyeq - t.left1.Dy));
                if (t.k1right1 !== 0 && t.right1)
                    tension += t.k1right1 * t.k1 * (dDy - (t.right1.Dyeq - t.right1.Dy));
                if (t.Dy < t.dy) {
                    if (t.Dy >= -t.dy) {
                        const d = t.dy - t.Dy, d2 = d * d;
                        tension += d2 / (4 * t.dy) * (t.s1 + 0.5 * t.s3 * d2);
                        t.B += 2 * d / (2 * t.dy) * Math.sqrt(t.mass * (t.s1 + t.s3 * d2));
                    }
                    else {
                        tension -= t.Dy * (t.s1 + t.s3 * (t.Dy * t.Dy + t.dy * t.dy));
                        t.B += 2 * Math.sqrt(t.mass * (t.s1 + t.s3 * (3 * t.Dy * t.Dy + t.dy * t.dy)));
                    }
                }
                t.dDydtnew = (t.dDydt + Dt / t.mass * (tension + 2 * t.DeltaP * t.Dz * t.Dx)) / (1 + t.B * Dt / t.mass); // 5.119
                t.Dynew = t.Dy + t.dDydtnew * Dt; // 5.119
                t.Anew = area(t, t.Dynew);
                t.Ahalf = 0.5 * (t.A + t.Anew);
                t.Dxhalf = 0.5 * (t.Dxnew + t.Dx);
                t.Vnew = t.Anew * t.Dxnew; // 5.120, 5.121, 5.128
                const oneByDyav = t.Dz / t.A;
                t.R = t.Dy < 0 ? 12 * 1.86e-5 / (Dymin * Dymin + t.dy * t.dy) : 12 * 1.86e-5 * t.parallel * t.parallel / ((t.Dy + Dymin) * (t.Dy + Dymin) + t.dy * t.dy);
                t.R += 0.3 * t.parallel * oneByDyav; // 5.23
                t.r = (1 + t.R * Dt / rho0) * t.Dxhalf / t.Anew; // 5.122
                t.ehalf = t.e + halfc2Dt * (t.Jleft - t.Jright); // 5.123
                t.phalf = (t.p + halfDt * (t.Qleft - t.Qright) / t.Dx) / (1 + Dtbytworho0 * t.R); // 5.123
                t.Jhalf = t.phalf * t.Ahalf; // 5.124
                t.Qhalf = t.ehalf / (t.Ahalf * t.Dxhalf) + onebytworho0 * t.phalf * t.phalf; // 5.124
            }
            for (const l of tubes) {
                const r1 = l.right1, r2 = l.right2, r = r1, l1 = l, l2 = r ? r.left2 : null;
                if (!l.left1) {
                    if (!r)
                        continue; // not connected
                    l.Jleftnew = 0;
                    l.Qleftnew = (l.eleft - twoc2Dt * l.Jhalf) / l.Vnew; // 5.132, the diaphragm
                }
                if (!r) { // radiation at the lips or nostrils, 5.135, 5.136
                    const rrad = 1 - c * Dt / 0.02, onebygrad = 1 / (1 + c * Dt / 0.02);
                    l.prightnew = ((l.Dxhalf / Dt + c * onebygrad) * l.pright + 2 * ((l.Qhalf - rho0c2) - (l.Qright - rho0c2) * onebygrad)) / (l.r * l.Anew / Dt + c * onebygrad);
                    l.Jrightnew = l.prightnew * l.Anew;
                    l.Qrightnew = (rrad * (l.Qright - rho0c2) + c * (l.prightnew - l.pright)) * onebygrad + rho0c2;
                }
                else if (!l2 && !r2) { // two-way boundary
                    if (gauss) {
                        if (l.v > criticalVelocity && l.A < r.A) {
                            l.Pturbrightnew = -0.5 * rho0 * (l.v - criticalVelocity) * (1 - l.A / r.A) ** 2 * l.v;
                            if (l.Pturbrightnew !== 0)
                                l.Pturbrightnew *= gauss();
                        }
                        if (r.v < -criticalVelocity && r.A < l.A) {
                            l.Pturbrightnew = 0.5 * rho0 * (r.v + criticalVelocity) * (1 - r.A / l.A) ** 2 * r.v;
                            if (l.Pturbrightnew !== 0)
                                l.Pturbrightnew *= gauss();
                        }
                    }
                    l.Jrightnew = r.Jleftnew = (l.Dxhalf * l.pright + r.Dxhalf * r.pleft + twoDt * (l.Qhalf - r.Qhalf + l.Pturbright)) / (l.r + r.r); // 5.127
                    l.prightnew = l.Jrightnew / l.Anew;
                    r.pleftnew = r.Jleftnew / r.Anew; // 5.128
                    l.Krightnew = onebytworho0 * l.prightnew * l.prightnew;
                    r.Kleftnew = onebytworho0 * r.pleftnew * r.pleftnew;
                    l.Qrightnew = (l.eright + r.eleft + twoc2Dt * (l.Jhalf - r.Jhalf) + l.Krightnew * l.Vnew + (r.Kleftnew - l.Pturbrightnew) * r.Vnew) / (l.Vnew + r.Vnew); // 5.131
                    r.Qleftnew = l.Qrightnew + l.Pturbrightnew;
                }
                else if (r2) { // a stream splitting in two (pharynx to mouth and nose), 5.137–5.139
                    r1.Jleftnew = (r1.Jleft * r1.Dxhalf * (1 / (l.A + r2.A) + 1 / r1.A) + twoDt * ((l.Ahalf * l.Qhalf + r2.Ahalf * r2.Qhalf) / (l.Ahalf + r2.Ahalf) - r1.Qhalf)) / (1 / (1 / l.r + 1 / r2.r) + r1.r);
                    r2.Jleftnew = (r2.Jleft * r2.Dxhalf * (1 / (l.A + r1.A) + 1 / r2.A) + twoDt * ((l.Ahalf * l.Qhalf + r1.Ahalf * r1.Qhalf) / (l.Ahalf + r1.Ahalf) - r2.Qhalf)) / (1 / (1 / l.r + 1 / r1.r) + r2.r);
                    l.Jrightnew = r1.Jleftnew + r2.Jleftnew;
                    l.prightnew = l.Jrightnew / l.Anew;
                    r1.pleftnew = r1.Jleftnew / r1.Anew;
                    r2.pleftnew = r2.Jleftnew / r2.Anew;
                    l.Krightnew = onebytworho0 * l.prightnew ** 2;
                    r1.Kleftnew = onebytworho0 * r1.pleftnew ** 2;
                    r2.Kleftnew = onebytworho0 * r2.pleftnew ** 2;
                    l.Qrightnew = r1.Qleftnew = r2.Qleftnew = (l.eright + r1.eleft + r2.eleft + twoc2Dt * (l.Jhalf - r1.Jhalf - r2.Jhalf) + l.Krightnew * l.Vnew + r1.Kleftnew * r1.Vnew + r2.Kleftnew * r2.Vnew) / (l.Vnew + r1.Vnew + r2.Vnew);
                }
                else { // two streams merging
                    const m2 = l2;
                    l1.Jrightnew = (l1.Jright * l1.Dxhalf * (1 / (r.A + m2.A) + 1 / l1.A) - twoDt * ((r.Ahalf * r.Qhalf + m2.Ahalf * m2.Qhalf) / (r.Ahalf + m2.Ahalf) - l1.Qhalf)) / (1 / (1 / r.r + 1 / m2.r) + l1.r);
                    m2.Jrightnew = (m2.Jright * m2.Dxhalf * (1 / (r.A + l1.A) + 1 / m2.A) - twoDt * ((r.Ahalf * r.Qhalf + l1.Ahalf * l1.Qhalf) / (r.Ahalf + l1.Ahalf) - m2.Qhalf)) / (1 / (1 / r.r + 1 / l1.r) + m2.r);
                    r.Jleftnew = l1.Jrightnew + m2.Jrightnew;
                    r.pleftnew = r.Jleftnew / r.Anew;
                    l1.prightnew = l1.Jrightnew / l1.Anew;
                    m2.prightnew = m2.Jrightnew / m2.Anew;
                    r.Kleftnew = onebytworho0 * r.pleftnew ** 2;
                    l1.Krightnew = onebytworho0 * l1.prightnew ** 2;
                    m2.Krightnew = onebytworho0 * m2.prightnew ** 2;
                    r.Qleftnew = l1.Qrightnew = m2.Qrightnew = (r.eleft + l1.eright + m2.eright + twoc2Dt * (l1.Jhalf + m2.Jhalf - r.Jhalf) + r.Kleftnew * r.Vnew + l1.Krightnew * l1.Vnew + m2.Krightnew * m2.Vnew) / (r.Vnew + l1.Vnew + m2.Vnew);
                }
            }
            if (step === half) { // radiation of the walls' movement and of the open ends, at 0.4 m, 5.140
                let out = 0;
                for (const t of tubes) {
                    out += rho0 * t.Dx * t.Dz * t.dDydt * Dt * 1000;
                    if (!t.right1)
                        out += t.Jrightnew - t.Jright;
                }
                sound[sample] = out / (4 * Math.PI * 0.4 * Dt);
                watch.forEach((i, k) => { widths[k][sample] = T[i].Dy; });
                watchP.forEach((i, k) => { pressures[k][sample] = T[i].DeltaP; });
                watchU.forEach((i, k) => { flows[k][sample] = T[i].v * T[i].A; });
            }
            for (const t of tubes) {
                t.Jleft = t.Jleftnew;
                t.Jright = t.Jrightnew;
                t.Qleft = t.Qleftnew;
                t.Qright = t.Qrightnew;
                t.Dy = t.Dynew;
                t.dDydt = t.dDydtnew;
                t.A = t.Anew;
                t.Dx = t.Dxnew;
                t.dDxdt = t.dDxdtnew;
                t.eleft = t.eleftnew;
                t.eright = t.erightnew;
                t.pleft = t.pleftnew;
                t.pright = t.prightnew;
                t.Kleft = t.Kleftnew;
                t.Kright = t.Krightnew;
                t.V = t.Vnew;
                t.Pturbright = t.Pturbrightnew;
            }
        }
    }
    return { sound, widths, pressures, flows, volume: [volume0, live.reduce((s, t) => s + t.V, 0)] };
}
/** The length of the tract from glottis to lips in the neutral articulation: the tubes 38..64 end to end, metres. */
export const tractLength = (sp) => speakerToTubes(sp).slice(38, 65).reduce((s, t) => s + t.Dx, 0);
