// JOS-3 human thermoregulation model (Takahashi et al. 2021, Energy & Buildings 231:110575), ported from pythermalcomfort 4.6.0
// (MIT licence, models/jos3.py and jos3_functions/*) with its default options. 17 segments, 85 nodes; one call of step()
// advances dtime seconds by an implicit Euler step, as JOS3._run.
export const SEGMENTS = ['head', 'neck', 'chest', 'back', 'pelvis', 'left_shoulder', 'left_arm', 'left_hand', 'right_shoulder', 'right_arm',
    'right_hand', 'left_thigh', 'left_leg', 'left_foot', 'right_thigh', 'right_leg', 'right_foot'];
const N = 17;
export const LOCAL_BSA = [0.11, 0.029, 0.175, 0.161, 0.221, 0.096, 0.063, 0.05, 0.096, 0.063, 0.05, 0.209, 0.112, 0.056, 0.209, 0.112, 0.056];
const DEF = { height: 1.72, weight: 74.43, age: 20, fat: 15, ci: 2.59, bloodFlowRate: 290 };
const LAYERS = ['artery', 'vein', 'sfvein', 'core', 'muscle', 'fat', 'skin'];

// matrix.index_order
const IDX = { CB: 0 };
let nodes = 1;
for (const [i, bn] of SEGMENTS.entries()) {
    const has = bn === 'head' || bn === 'pelvis' ? ['artery', 'vein', 'core', 'muscle', 'fat', 'skin']
        : i < 5 ? ['artery', 'vein', 'core', 'skin'] : ['artery', 'vein', 'sfvein', 'core', 'skin'];
    IDX[bn] = {};
    for (const ln of LAYERS) IDX[bn][ln] = has.includes(ln) ? nodes++ : null;
}
export const NUM_NODES = nodes;
const byLayer = ln => SEGMENTS.map(bn => IDX[bn][ln]).filter(x => x !== null);
const validByLayer = ln => SEGMENTS.map((bn, i) => IDX[bn][ln] !== null ? i : null).filter(x => x !== null);
const INDEX = Object.fromEntries(LAYERS.map(l => [l, byLayer(l)]));
const VINDEX = Object.fromEntries(LAYERS.map(l => [l, validByLayer(l)]));

const sum = a => a.reduce((s, x) => s + x, 0);
const wavg = (a, w) => sum(a.map((x, i) => x * w[i])) / sum(w);
const zeros = n => new Array(n).fill(0);
const matrix = n => Array.from({ length: n }, () => new Float64Array(n));
export const antoine = t => Math.exp(16.6536 - 4030.183 / (t + 235));

// construction.*
const bsaTotal = (h, w) => 0.202 * w ** 0.425 * h ** 0.725; // DuBois
const bsaRate = (h, w) => bsaTotal(h, w) / sum(LOCAL_BSA);
const weightRate = w => w / DEF.weight;
function bfbRate(h, w, age, ci) {
    ci *= 60;
    ci *= age < 50 ? 1 : age < 60 ? 0.85 : age < 70 ? 0.75 : 0.7;
    return ci * bsaRate(h, w) * sum(LOCAL_BSA) / DEF.bloodFlowRate;
}

function conductance(h, w, fat) {
    const crSk = fat < 12.5 ? [1.341, 0.93, 1.879, 1.729, 2.37, 1.557, 1.018, 2.21, 1.557, 1.018, 2.21, 2.565, 1.378, 3.404, 2.565, 1.378, 3.404]
        : fat < 17.5 ? [1.311, 0.909, 1.785, 1.643, 2.251, 1.501, 0.982, 2.183, 1.501, 0.982, 2.183, 2.468, 1.326, 3.37, 2.468, 1.326, 3.37]
        : fat < 22.5 ? [1.282, 0.889, 1.698, 1.563, 2.142, 1.448, 0.947, 2.156, 1.448, 0.947, 2.156, 2.375, 1.276, 3.337, 2.375, 1.276, 3.337]
        : fat < 27.5 ? [1.255, 0.87, 1.618, 1.488, 2.04, 1.396, 0.913, 2.13, 1.396, 0.913, 2.13, 2.285, 1.227, 3.304, 2.285, 1.227, 3.304]
        : [1.227, 0.852, 1.542, 1.419, 1.945, 1.346, 0.88, 1.945, 1.346, 0.88, 1.945, 2.198, 1.181, 3.271, 2.198, 1.181, 3.271];
    const crMs = zeros(N), msFat = zeros(N), fatSk = zeros(N);
    crMs[0] = 1.601; msFat[0] = 13.222; fatSk[0] = 16.008;
    crMs[4] = 3.0813; msFat[4] = 10.3738; fatSk[4] = 41.4954;
    const vesCr = [0, 0, 0, 0, 0, 0.586, 0.383, 1.534, 0.586, 0.383, 1.534, 0.81, 0.435, 1.816, 0.81, 0.435, 1.816];
    const sfvSk = [0, 0, 0, 0, 0, 57.735, 37.768, 16.634, 57.735, 37.768, 16.634, 102.012, 54.784, 24.277, 102.012, 54.784, 24.277];
    const artVein = [0, 0, 0, 0, 0, 0.537, 0.351, 0.762, 0.537, 0.351, 0.762, 0.826, 0.444, 0.992, 0.826, 0.444, 0.992];
    const wr = weightRate(w), br = bsaRate(h, w);
    const all = [crSk, crMs, msFat, fatSk, vesCr, sfvSk, artVein].map(a => [...a]);
    for (const a of all) for (let i = 0; i < N; i++) a[i] *= i < 2 ? wr / br : br ** 2 / wr;
    const [cs, cm, mf, fs, vc, ss, av] = all;
    const c = matrix(NUM_NODES);
    for (const [i, bn] of SEGMENTS.entries()) {
        const x = IDX[bn];
        c[x.artery][x.vein] = av[i];
        c[x.artery][x.core] = vc[i];
        c[x.vein][x.core] = vc[i];
        if (i >= 5) c[x.sfvein][x.skin] = ss[i];
        if (x.muscle !== null) { c[x.core][x.muscle] = cm[i]; c[x.muscle][x.fat] = mf[i]; c[x.fat][x.skin] = fs[i]; }
        else c[x.core][x.skin] = cs[i];
    }
    for (let i = 0; i < NUM_NODES; i++) for (let j = i + 1; j < NUM_NODES; j++) { const s = c[i][j] + c[j][i]; c[i][j] = s; c[j][i] = s; }
    return c;
}

function capacity(h, w, age, ci) {
    const art = [0.096, 0.025, 0.12, 0.111, 0.265, 0.0186, 0.0091, 0.0044, 0.0186, 0.0091, 0.0044, 0.0813, 0.04, 0.0103, 0.0813, 0.04, 0.0103];
    const vein = [0.321, 0.085, 0.424, 0.39, 0.832, 0.046, 0.024, 0.01, 0.046, 0.024, 0.01, 0.207, 0.1, 0.024, 0.207, 0.1, 0.024];
    const sfv = [0, 0, 0, 0, 0, 0.025, 0.015, 0.011, 0.025, 0.015, 0.011, 0.074, 0.05, 0.021, 0.074, 0.05, 0.021];
    const cr = [1.7229, 0.564, 10.2975, 9.3935, 4.488, 1.6994, 1.1209, 0.1536, 1.6994, 1.1209, 0.1536, 5.3117, 2.867, 0.2097, 5.3117, 2.867, 0.2097];
    const ms = [0.305, 0, 0, 0, 7.409, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const ft = [0.203, 0, 0, 0, 1.947, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sk = [0.1885, 0.058, 0.441, 0.406, 0.556, 0.126, 0.084, 0.088, 0.126, 0.084, 0.088, 0.334, 0.169, 0.107, 0.334, 0.169, 0.107];
    const bfbr = bfbRate(h, w, age, ci), wr = weightRate(w);
    const cap = new Float64Array(NUM_NODES);
    cap[0] = 1.999 * bfbr;
    for (const [i, bn] of SEGMENTS.entries()) {
        const x = IDX[bn];
        cap[x.artery] = art[i] * bfbr;
        cap[x.vein] = vein[i] * bfbr;
        cap[x.core] = cr[i] * wr;
        cap[x.skin] = sk[i] * wr;
        if (i >= 5) cap[x.sfvein] = sfv[i] * bfbr;
        if (x.muscle !== null) { cap[x.muscle] = ms[i] * wr; cap[x.fat] = ft[i] * wr; }
    }
    for (let i = 0; i < NUM_NODES; i++) cap[i] *= 3600;
    return cap;
}

// thermoregulation.*
const HC_NAT = {
    standing: [4.48, 4.48, 2.97, 2.91, 2.85, 3.61, 3.55, 3.67, 3.61, 3.55, 3.67, 2.8, 2.04, 2.04, 2.8, 2.04, 2.04],
    sitting: [4.75, 4.75, 3.12, 2.48, 1.84, 3.76, 3.62, 2.06, 3.76, 3.62, 2.06, 2.98, 2.98, 2.62, 2.98, 2.98, 2.62],
};
const HC_LY_A = [1.105, 1.105, 1.211, 1.211, 1.211, 0.913, 2.081, 2.178, 0.913, 2.081, 2.178, 0.945, 0.385, 0.2, 0.945, 0.385, 0.2];
const HC_LY_B = [0.345, 0.345, 0.046, 0.046, 0.046, 0.373, 0.85, 0.297, 0.373, 0.85, 0.297, 0.447, 0.58, 0.966, 0.447, 0.58, 0.966];
const naturalConvection = (posture, tdb, tsk) => posture === 'lying'
    ? HC_LY_A.map((a, i) => a * Math.abs(tdb[i] - tsk[i]) ** HC_LY_B[i]) : HC_NAT[posture];
const HC_F_A = [15.0, 15.0, 11.0, 17.0, 13.0, 17.0, 17.0, 20.0, 17.0, 17.0, 20.0, 14.0, 15.8, 15.1, 14.0, 15.8, 15.1];
const HC_F_B = [0.62, 0.62, 0.67, 0.49, 0.6, 0.59, 0.61, 0.6, 0.59, 0.61, 0.6, 0.61, 0.74, 0.62, 0.61, 0.74, 0.62];
function convCoef(posture, v, tdb, tsk) {
    const nat = naturalConvection(posture, tdb, tsk);
    return v.map((vi, i) => vi < 0.2 ? nat[i] : HC_F_A[i] * vi ** HC_F_B[i]);
}
const HR = {
    standing: [4.89, 4.89, 4.32, 4.09, 4.32, 4.55, 4.43, 4.21, 4.55, 4.43, 4.21, 4.77, 5.34, 6.14, 4.77, 5.34, 6.14],
    sitting: [4.96, 4.96, 3.99, 4.64, 4.21, 4.96, 4.21, 4.74, 4.96, 4.21, 4.74, 4.1, 4.74, 6.36, 4.1, 4.74, 6.36],
    lying: [5.475, 5.475, 3.463, 3.463, 3.463, 4.249, 4.835, 4.119, 4.249, 4.835, 4.119, 4.44, 5.547, 6.085, 4.44, 5.547, 6.085],
};
function fixedHc(hc, v) {
    const whole = Math.max(3, 8.600001 * wavg(v, LOCAL_BSA) ** 0.53);
    const mean = wavg(hc, LOCAL_BSA);
    return hc.map(x => x * whole / mean);
}
const fixedHr = hr => { const m = wavg(hr, LOCAL_BSA); return hr.map(x => x * 4.7 / m); };
const fcl = clo => clo < 0.5 ? clo * 0.2 + 1 : clo * 0.1 + 1.05;
const dryR = (hc, hr, clo) => hc.map((h, i) => 1 / (h + hr[i]) / fcl(clo[i]) + 0.155 * clo[i]);
const wetR = (hc, clo, iclo, lr) => hc.map((h, i) => 1 / (lr * h) / fcl(clo[i]) + 0.155 * clo[i] / (lr * iclo[i]));

const RECEPTOR = [0.0549, 0.0146, 0.1492, 0.1321, 0.2122, 0.0227, 0.0117, 0.0923, 0.0227, 0.0117, 0.0923, 0.0501, 0.0251, 0.0167, 0.0501, 0.0251, 0.0167];
function errorSignals(errSk) {
    let wrm = 0, cld = 0;
    errSk.forEach((e, i) => { wrm += Math.max(e, 0) * RECEPTOR[i]; cld += Math.min(e, 0) * -RECEPTOR[i]; });
    return [wrm, cld];
}

const SKIN_SWEAT = [0.064, 0.017, 0.146, 0.129, 0.206, 0.051, 0.026, 0.0155, 0.051, 0.026, 0.0155, 0.073, 0.036, 0.0175, 0.073, 0.036, 0.0175];
const SD_SWEAT_OLD = [0.69, 0.69, 0.59, 0.52, 0.4, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4];
function evaporation(errCr, errSk, tsk, tdb, rh, ret, b) {
    const [wrms, clds] = errorSignals(errSk);
    const br = bsaRate(b.height, b.weight);
    const eMax = tsk.map((t, i) => { const e = (antoine(t) - antoine(tdb[i]) * rh[i] / 100) / ret[i] * LOCAL_BSA[i] * br; return e === 0 ? 0.001 : e; });
    const sig = Math.max(371.2 * errCr[0] + 33.64 * (wrms - clds), 0) * br;
    const wet = [], eSk = [], eSweat = [];
    for (let i = 0; i < N; i++) {
        const es = SKIN_SWEAT[i] * sig * (b.age < 60 ? 1 : SD_SWEAT_OLD[i]) * 2 ** (errSk[i] / 10);
        wet[i] = Math.min(0.06 + 0.94 * (es / eMax[i]), 1);
        eSk[i] = wet[i] * eMax[i];
        eSweat[i] = (wet[i] - 0.06) / 0.94 * eMax[i];
    }
    return { wet, eSk, eMax, eSweat };
}

const BFB_SK = [1.754, 0.325, 1.967, 1.475, 2.272, 0.91, 0.508, 1.114, 0.91, 0.508, 1.114, 1.456, 0.651, 0.934, 1.456, 0.651, 0.934];
const SKIN_DILAT = [0.0692, 0.0992, 0.058, 0.0679, 0.0707, 0.04, 0.0373, 0.0632, 0.04, 0.0373, 0.0632, 0.0736, 0.0411, 0.0623, 0.0736, 0.0411, 0.0623];
const SKIN_STRIC = [0.0213, 0.0213, 0.0638, 0.0638, 0.0638, 0.0213, 0.0213, 0.1489, 0.0213, 0.0213, 0.1489, 0.0213, 0.0213, 0.1489, 0.0213, 0.0213, 0.1489];
const SD_DILAT_OLD = [0.91, 0.91, 0.47, 0.47, 0.31, 0.47, 0.47, 0.47, 0.47, 0.47, 0.47, 0.31, 0.31, 0.31, 0.31, 0.31, 0.31];
function skinBloodFlow(errCr, errSk, b) {
    const [wrms, clds] = errorSignals(errSk);
    const dil = Math.max(100.5 * errCr[0] + 6.4 * (wrms - clds), 0);
    const str = Math.max(-10.8 * errCr[0] + -10.8 * (wrms - clds), 0);
    const r = bfbRate(b.height, b.weight, b.age, b.ci);
    return BFB_SK.map((bf, i) => (1 + SKIN_DILAT[i] * (b.age < 60 ? 1 : SD_DILAT_OLD[i]) * dil) / (1 + SKIN_STRIC[i] * str) * bf * 2 ** (errSk[i] / 6) * r);
}

function avaBloodFlow(errCr, errSk, b) {
    const errBcr = wavg(errCr.slice(2, 5), [10.2975, 9.3935, 4.488]);
    const errMsk = wavg(errSk, LOCAL_BSA);
    const clamp = x => Math.min(Math.max(x, 0), 1);
    const hand = clamp(0.265 * (errMsk + 0.43) + 0.953 * (errBcr + 0.1905) + 0.9126);
    const foot = clamp(0.265 * (errMsk - 0.997) + 0.953 * (errBcr + 0.0095) + 0.9126);
    const r = bfbRate(b.height, b.weight, b.age, b.ci);
    return [1.71 * r * hand, 2.16 * r * foot];
}

/** Harris–Benedict (revised) basal metabolism, W. */
export function basalMet(h, w, age, sex) {
    const kcal = sex === 'female' ? 447.593 + 9.247 * w + 479.9 * h - 4.33 * age : 88.362 + 13.397 * w + 500.3 * h - 5.677 * age;
    return Math.max(kcal * 0.048, 68);
}
const MBF_CR = [0.19551, 0.00324, 0.28689, 0.25677, 0.09509, 0.01435, 0.00409, 0.00106, 0.01435, 0.00409, 0.00106, 0.01557, 0.00422, 0.0025, 0.01557, 0.00422, 0.0025];
const MBF_MS = [0.00252, 0, 0, 0, 0.04804, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const MBF_FAT = [0.00127, 0, 0, 0, 0.0095, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const MBF_SK = [0.00152, 0.00033, 0.00211, 0.00187, 0.003, 0.00059, 0.00031, 0.00059, 0.00059, 0.00031, 0.00059, 0.00144, 0.00027, 0.00118, 0.00144, 0.00027, 0.00118];
const WORKF = [0, 0, 0.091, 0.08, 0.129, 0.0262, 0.0139, 0.005, 0.0262, 0.0139, 0.005, 0.201, 0.099, 0.005, 0.201, 0.099, 0.005];
const SHIV_PEAK = 4.9;
const SHIVF = [0.0339, 0.0436, 0.27394, 0.24102, 0.38754, 0.00243, 0.00137, 0.0002, 0.00243, 0.00137, 0.0002, 0.0039, 0.00175, 0.00035, 0.0039, 0.00175, 0.00035];
const NSTF = [0, 0.19, 0, 0.19, 0.19, 0.215, 0, 0, 0.215, 0, 0, 0, 0, 0, 0, 0, 0];
function shivering(errCr, errSk, b) {
    const [, clds] = errorSignals(errSk);
    const sig = Math.max(24.36 * clds * -errCr[0], 0);
    const sd = b.age < 30 ? 1 : b.age < 40 ? 0.97514 : b.age < 50 ? 0.95028 : b.age < 60 ? 0.92818 : b.age < 70 ? 0.90055 : b.age < 80 ? 0.86188 : 0.82597;
    const br = bsaRate(b.height, b.weight);
    return SHIVF.map(f => f * br * sd * sig);
}
function nonshivering(errSk, b) {
    const [, clds] = errorSignals(errSk);
    let bat = 10 ** (-0.10502 * (b.weight / b.height ** 2) + 2.7708);
    bat *= b.age < 30 ? 1.61 : b.age < 40 ? 1 : 0.8;
    // bat_positive false (default): BAT-positive share by age
    bat *= b.age < 30 ? 44 / 83 : b.age < 40 ? 15 / 38 : b.age < 50 ? 7 / 26 : b.age < 60 ? 1 / 8 : 0;
    const sig = Math.min(2.8 * clds, 1.8 * bat + 2.43 + 5.62);
    const br = bsaRate(b.height, b.weight);
    return NSTF.map(f => br * f * sig);
}
const BFB_CORE = [35.251, 15.24, 89.214, 87.663, 18.686, 1.808, 0.94, 0.217, 1.808, 0.94, 0.217, 1.406, 0.164, 0.08, 1.406, 0.164, 0.08];
const BFB_MUSCLE = [0.682, 0, 0, 0, 12.614, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const BFB_FAT = [0.265, 0, 0, 0, 2.219, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// matrix.vessel_blood_flow / local_arr / whole_body
function vesselFlow(xbf, avaH, avaF) {
    const s = (a, b) => sum(xbf.slice(a, b));
    const art = zeros(N), vein = zeros(N);
    art[0] = vein[0] = xbf[0];
    art[1] = vein[1] = xbf[1] + xbf[0];
    art[2] = vein[2] = xbf[2];
    art[3] = vein[3] = xbf[3];
    art[4] = vein[4] = xbf[4] + s(11, N) + 2 * avaF;
    const limb = (i, a, b, ava) => { vein[i] = s(a, b); art[i] = vein[i] + ava; };
    limb(5, 5, 8, avaH); limb(6, 6, 8, avaH); limb(7, 7, 8, avaH);
    limb(8, 8, 11, avaH); limb(9, 9, 11, avaH); limb(10, 10, 11, avaH);
    limb(11, 11, 14, avaF); limb(12, 12, 14, avaF); limb(13, 13, 14, avaF);
    limb(14, 14, N, avaF); limb(15, 15, N, avaF); limb(16, 16, N, avaF);
    return [art, vein];
}
function bloodMatrix(bfCore, bfMuscle, bfFat, bfSkin, avaH, avaF) {
    const m = matrix(NUM_NODES);
    const set = (down, up, f) => { m[down][up] += 1.067 * f; };
    for (const [i, bn] of SEGMENTS.entries()) {
        const x = IDX[bn];
        set(x.core, x.artery, bfCore[i]); set(x.skin, x.artery, bfSkin[i]);
        set(x.vein, x.core, bfCore[i]); set(x.vein, x.skin, bfSkin[i]);
        if (x.muscle !== null) { set(x.muscle, x.artery, bfMuscle[i]); set(x.vein, x.muscle, bfMuscle[i]); }
        if (x.fat !== null) { set(x.fat, x.artery, bfFat[i]); set(x.vein, x.fat, bfFat[i]); }
        if (i === 7 || i === 10) set(x.sfvein, x.artery, avaH);
        if (i === 13 || i === 16) set(x.sfvein, x.artery, avaF);
    }
    const xbf = bfCore.map((c, i) => c + bfMuscle[i] + bfFat[i] + bfSkin[i]);
    const [art, vein] = vesselFlow(xbf, avaH, avaF);
    const a = bn => IDX[bn].artery, CB = 0;
    const flow = (up, down, f) => { m[down][up] += 1.067 * f; };
    flow(CB, a('neck'), art[1]); flow(a('neck'), a('head'), art[0]);
    flow(a('head') + 1, a('neck') + 1, vein[0]); flow(a('neck') + 1, CB, vein[1]);
    flow(CB, a('chest'), art[2]); flow(a('chest') + 1, CB, vein[2]);
    flow(CB, a('back'), art[3]); flow(a('back') + 1, CB, vein[3]);
    flow(CB, a('pelvis'), art[4]); flow(a('pelvis') + 1, CB, vein[4]);
    for (const [side, s0] of [['left', 5], ['right', 8]]) {
        const sh = a(`${side}_shoulder`), ar = a(`${side}_arm`), ha = a(`${side}_hand`);
        flow(CB, sh, art[s0]); flow(sh, ar, art[s0 + 1]); flow(ar, ha, art[s0 + 2]);
        flow(ha + 1, ar + 1, vein[s0 + 2]); flow(ar + 1, sh + 1, vein[s0 + 1]); flow(sh + 1, CB, vein[s0]);
        flow(ha + 2, ar + 2, avaH); flow(ar + 2, sh + 2, avaH); flow(sh + 2, CB, avaH);
    }
    for (const [side, s0] of [['left', 11], ['right', 14]]) {
        const p = a('pelvis'), th = a(`${side}_thigh`), le = a(`${side}_leg`), fo = a(`${side}_foot`);
        flow(p, th, art[s0]); flow(th, le, art[s0 + 1]); flow(le, fo, art[s0 + 2]);
        flow(fo + 1, le + 1, vein[s0 + 2]); flow(le + 1, th + 1, vein[s0 + 1]); flow(th + 1, p + 1, vein[s0]);
        flow(fo + 2, le + 2, avaF); flow(le + 2, th + 2, avaF); flow(th + 2, p + 1, avaF);
    }
    return m;
}

/** Solves A x = b by Gaussian elimination with partial pivoting (replaces np.linalg.inv(A) @ b). */
function solve(A, b) {
    const n = b.length, M = A.map(r => Float64Array.from(r)), x = Float64Array.from(b);
    for (let k = 0; k < n; k++) {
        let p = k;
        for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
        [M[k], M[p]] = [M[p], M[k]]; [x[k], x[p]] = [x[p], x[k]];
        for (let i = k + 1; i < n; i++) {
            const f = M[i][k] / M[k][k];
            if (!f) continue;
            for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
            x[i] -= f * x[k];
        }
    }
    for (let k = n - 1; k >= 0; k--) {
        let s = x[k];
        for (let j = k + 1; j < n; j++) s -= M[k][j] * x[j];
        x[k] = s / M[k][k];
    }
    return x;
}

// models._pmv_ppd_optimized (ISO 7730), used once to find the neutral operative temperature for the set points.
function pmv(tdb, tr, vr, rh, met, clo) {
    const pa = rh * 10 * Math.exp(16.6536 - 4030.183 / (tdb + 235));
    const icl = 0.155 * clo, m = met * 58.15, mw = m;
    const f = icl <= 0.078 ? 1 + 1.29 * icl : 1.05 + 0.645 * icl;
    const hcf = 12.1 * Math.sqrt(vr);
    let hc = hcf;
    const taa = tdb + 273, tra = tr + 273;
    const tcla = taa + (35.5 - tdb) / (3.5 * (6.45 * icl + 0.1));
    const p1 = icl * f, p2 = p1 * 3.96, p3 = p1 * 100, p4 = p1 * taa, p5 = 308.7 - 0.028 * mw + p2 * (tra / 100) ** 4;
    let xn = tcla / 100, xf = tcla / 50, n = 0;
    while (Math.abs(xn - xf) > 0.00015) {
        xf = (xf + xn) / 2;
        hc = Math.max(2.38 * Math.abs(100 * xf - taa) ** 0.25, hcf);
        xn = (p5 + p4 * hc - p2 * xf ** 4) / (100 + p3 * hc);
        if (++n > 150) return NaN;
    }
    const tcl = 100 * xn - 273;
    const hl1 = 3.05 * 0.001 * (5733 - 6.99 * mw - pa);
    const hl2 = mw > 58.15 ? 0.42 * (mw - 58.15) : 0;
    const hl3 = 1.7e-5 * m * (5867 - pa), hl4 = 0.0014 * m * (34 - tdb);
    const hl5 = 3.96 * f * (xn ** 4 - (tra / 100) ** 4), hl6 = f * hc * (tcl - tdb);
    return (0.303 * Math.exp(-0.036 * m) + 0.028) * (mw - hl1 - hl2 - hl3 - hl4 - hl5 - hl6);
}
function neutralTo(met) {
    let to = 28;
    for (let i = 0; i < 100; i++) {
        const v = pmv(to, to, 0.1, 50, met, 0);
        if (Math.abs(v) < 0.001) return to;
        to -= v / 3;
    }
    return to;
}

const arr = x => Array.isArray(x) ? [...x] : new Array(N).fill(x);

/** A JOS-3 body. b: { height m, weight kg, age, sex, fat %, ci }. */
export function createBody(b = {}) {
    const body = { height: b.height ?? DEF.height, weight: b.weight ?? DEF.weight, age: b.age ?? DEF.age, sex: b.sex ?? 'male',
        fat: b.fat ?? DEF.fat, ci: b.ci ?? DEF.ci };
    body.bsa = LOCAL_BSA.map(x => x * bsaRate(body.height, body.weight));
    body.cdt = conductance(body.height, body.weight, body.fat);
    body.cap = capacity(body.height, body.weight, body.age, body.ci);
    body.t = new Array(NUM_NODES).fill(36);
    // _reset_setpt: 10 passive steps of 60000 s at the neutral operative temperature, nude, 1.25 × basal.
    const met = basalMet(body.height, body.weight, body.age, body.sex) / sum(body.bsa) * 1.25 / 58.15;
    const to = neutralTo(met);
    const env = { tdb: to, tr: to, rh: 50, v: 0.1, clo: 0, par: 1.25, posture: 'standing' };
    for (let i = 0; i < 10; i++) step(body, env, 60000, { passive: true, avaZero: true });
    body.setCr = INDEX.core.map(k => body.t[k]);
    body.setSk = INDEX.skin.map(k => body.t[k]);
    body.neutral = env;
    return body;
}

/**
 * Advances the body dtime seconds in env: { tdb, tr, rh %, v m/s, clo, iclo, par, posture: standing|sitting|lying }; tdb, tr, rh,
 * v, clo and iclo take one number or 17 (SEGMENTS order). Returns the step's heat and water figures.
 */
export function step(body, env, dtime = 60, { passive = false, avaZero = false, shivStopsBelow = null } = {}) {
    const tdb = arr(env.tdb ?? 28.8), tr = arr(env.tr ?? env.tdb ?? 28.8), rh = arr(env.rh ?? 50), v = arr(env.v ?? 0.1);
    const clo = arr(env.clo ?? 0), iclo = arr(env.iclo ?? 0.45), par = env.par ?? 1.25, posture = env.posture ?? 'standing';
    const tcr = INDEX.core.map(k => body.t[k]), tsk = INDEX.skin.map(k => body.t[k]);
    const hc = fixedHc(convCoef(posture, v, tdb, tsk), v), hr = fixedHr(HR[posture]);
    // Added: segments in water (env.water = { tc, hc, segs }) exchange heat with it by convection only; no radiation, no evaporation.
    const wat = env.water;
    if (wat) for (let i = 0; i < N; i++) if (wat.segs[i]) { hc[i] = wat.hc; hr[i] = 0; tdb[i] = tr[i] = wat.tc; }
    const to = tdb.map((t, i) => (hc[i] * t + hr[i] * tr[i]) / (hc[i] + hr[i]));
    const rT = dryR(hc, hr, clo), rEt = wetR(hc, clo, iclo, 16.5);
    if (wat) for (let i = 0; i < N; i++) if (wat.segs[i]) rEt[i] = 1e9;
    const errCr = tcr.map((t, i) => t - (passive ? t : body.setCr[i]));
    const errSk = tsk.map((t, i) => t - (passive ? t : body.setSk[i]));
    const { wet, eSk, eMax, eSweat } = evaporation(errCr, errSk, tsk, tdb, rh, rEt, body);
    const bfSkin = skinBloodFlow(errCr, errSk, body);
    let [avaH, avaF] = avaBloodFlow(errCr, errSk, body);
    if (avaZero && passive) avaH = avaF = 0;
    const qNst = nonshivering(errSk, body);
    const bmr = basalMet(body.height, body.weight, body.age, body.sex);
    const mCr = MBF_CR.map(f => f * bmr), mMs = MBF_MS.map(f => f * bmr), mFat = MBF_FAT.map(f => f * bmr), mSk = MBF_SK.map(f => f * bmr);
    const qBmrTotal = sum(mCr) + sum(mMs) + sum(mFat) + sum(mSk);
    // Added to JOS-3: peak shivering = 4.9 × resting metabolism in total (Eyolfson et al. 2001, Eur J Appl Physiol 84:100),
    // so shivering heat ≤ 3.9 × basal.
    let qShiv = shivering(errCr, errSk, body);
    const shivCap = (SHIV_PEAK - 1) * qBmrTotal, shivSum = sum(qShiv);
    if (shivSum > shivCap) qShiv = qShiv.map(x => x * shivCap / shivSum);
    if (shivStopsBelow != null && tcr[4] < shivStopsBelow) qShiv = qShiv.map(() => 0);
    if (par < 1) throw new Error('par must be 1 or more');
    const qWork = WORKF.map(f => f * (par - 1) * qBmrTotal);
    const qCr = [...mCr], qMs = [...mMs];
    const r = bfbRate(body.height, body.weight, body.age, body.ci);
    const bfCore = BFB_CORE.map(x => x * r), bfMuscle = BFB_MUSCLE.map(x => x * r), bfFat = BFB_FAT.map(x => x * r);
    for (const [i, bn] of SEGMENTS.entries()) {
        const add = qWork[i] + qShiv[i];
        if (IDX[bn].muscle !== null) { qMs[i] += add; bfMuscle[i] += add / 1.163; } else { qCr[i] += add; bfCore[i] += add / 1.163; }
    }
    for (let i = 0; i < N; i++) qCr[i] += qNst[i];
    const qTotal = sum(qCr) + sum(qMs) + sum(mFat) + sum(mSk);
    const pa = antoine(tdb[0]) * rh[0] / 100;
    const resSh = 0.0014 * qTotal * (34 - tdb[0]), resLh = 0.0173 * qTotal * (5.87 - pa);

    const bf = bloodMatrix(bfCore, bfMuscle, bfFat, bfSkin, avaH, avaF);
    const cap = body.cap, bArr = new Float64Array(NUM_NODES);
    INDEX.skin.forEach((k, i) => { bArr[k] = 1 / rT[i] * body.bsa[i] / cap[k] * dtime; });
    const A = matrix(NUM_NODES);
    for (let i = 0; i < NUM_NODES; i++) {
        let rowSum = 0;
        for (let j = 0; j < NUM_NODES; j++) {
            const x = (body.cdt[i][j] + bf[i][j]) / cap[i] * dtime;
            A[i][j] = -x; rowSum += x;
        }
        A[i][i] += rowSum + bArr[i] + 1;
    }
    const q = new Float64Array(NUM_NODES);
    INDEX.core.forEach((k, i) => { q[k] += qCr[i]; });
    INDEX.muscle.forEach((k, j) => { q[k] += qMs[VINDEX.muscle[j]]; });
    INDEX.fat.forEach((k, j) => { q[k] += mFat[VINDEX.fat[j]]; });
    INDEX.skin.forEach((k, i) => { q[k] += mSk[i] - eSk[i]; });
    q[INDEX.core[2]] -= resSh + resLh;
    const rhs = body.t.map((t, k) => t + bArr[k] * (INDEX.skin.includes(k) ? to[INDEX.skin.indexOf(k)] : 0) + q[k] / cap[k] * dtime);
    body.t = Array.from(solve(A, rhs));
    return {
        wet, qTotal, qShiv: sum(qShiv),
        // g/s: sweat and skin diffusion plus breath (JOS3 weight_loss_by_evap_and_res)
        waterGs: sum(eSweat.map((e, i) => (e + 0.06 * eMax[i]) / 2418)) + resLh / 2418,
    };
}

export const coreOf = body => INDEX.core.map(k => body.t[k]);
export const skinOf = body => INDEX.skin.map(k => body.t[k]);
export const meanSkin = body => wavg(skinOf(body), LOCAL_BSA);
