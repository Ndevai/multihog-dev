// Body temperature of warm-blooded creatures other than human body plans (docs/df-body-engine.md §6.5).
// Heat loss: NicheMapR ellipsoid endotherm model (Porter & Kearney 2009, PNAS 106:19666; NicheMapR ellipsoid_endo.R, GPL-3):
// core → skin → fur → air by convection and radiation. Fur depth per creature is fitted so that still-air conductance equals the
// allometric minimal wet conductance (Schleucher & Withers 2001: birds at rest 0.702 M^−0.519 mL O2 g−1 h−1 °C−1, M in g;
// mammals about 50 % higher), then wind acts through the model's convection.

const KLEIBER = m => 70 * m ** 0.75 * 4.185 / (24 * 3.6);    // basal W, mass kg (as NicheMapR)
const SIGMA = 5.6703744191844294e-8;

function dryAir(db) {
    const tk = db + 273.15;
    return { densty: 101325 / (288.1738573002823 * tk), visdyn: 1.8325e-5 * ((296.16 + 120) / (tk + 120)) * (tk / 296.16) ** 1.5, thcond: 0.02425 + 7.038e-5 * db };
}
function vappr(db) {
    const t = db + 273.16;
    const loge = t <= 273.16
        ? -9.09718 * (273.16 / t - 1) - 3.56654 * Math.log10(273.16 / t) + 0.876793 * (1 - t / 273.16) + Math.log10(6.1071)
        : -7.90298 * (373.16 / t - 1) + 5.02808 * Math.log10(373.16 / t) - 1.3816e-7 * (10 ** (11.344 * (1 - t / 373.16)) - 1) + 8.1328e-3 * (10 ** (-3.49149 * (373.16 / t - 1)) - 1) + Math.log10(1013.246);
    return 10 ** loge * 100;
}
const vapourDensity = (db, rh) => vappr(db) * rh / 100 * 0.018015 / (0.998 * 8.31446261815324 * (db + 273.15));

/** NicheMapR ellipsoid(): heat flow core → air (W) and the parts of its resistance, for one body. */
export function ellipsoid({ posture = 4.5, mass, density = 1000, coreT, furdepth, furcond = 0.04, airT, windspd, rh = 50, O2eff = 0.2 }) {
    if (posture === 1) posture = 1.01;
    const volume = mass / density;
    const b = (3 * volume / (4 * Math.PI * posture)) ** (1 / 3), c = b, a = b * posture;
    const kBody = 0.5 + 6.14 * b + 0.439;
    const fraction = a ** 2 * b ** 2 * c ** 2 / (a ** 2 * b ** 2 + a ** 2 * c ** 2 + b ** 2 * c ** 2);
    const rBody = fraction / (2 * kBody * volume);
    const ao = a + furdepth / 1000, bo = b + furdepth / 1000, co = c + furdepth / 1000;
    const eo = Math.sqrt(ao ** 2 - co ** 2) / ao;
    const aOuter = 2 * Math.PI * bo ** 2 + 2 * Math.PI * (ao * bo / eo) * Math.asin(eo);
    const rInsul = (bo - b) / (furcond * aOuter);
    const air = dryAir(airT);
    const charDim = ((4 / 3) * Math.PI * a * b * c) ** (1 / 3);
    const ecc = Math.sqrt(a ** 2 - c ** 2) / a;
    const area = 2 * Math.PI * b ** 2 + 2 * Math.PI * (a * b / ecc) * Math.asin(ecc);
    const re = air.densty * windspd * charDim / air.visdyn, pr = air.visdyn * 1005.8 / air.thcond;
    const nuMix = 2 + 0.6 * re ** 0.5 * pr ** (1 / 3);
    const g = 2 * area * kBody * air.thcond * nuMix * (coreT - airT) / (2 * kBody * charDim * ((4 / 3) * Math.PI * a * b * c) + area * fraction * air.thcond * (2 + 0.6 * re ** 0.5 * pr ** 0.333));
    const skinT = coreT - g * fraction / (2 * kBody);
    const gr = Math.abs(air.densty ** 2 * (1 / (airT + 273.15)) * 9.80665 * charDim ** 3 * (skinT - airT) / air.visdyn ** 2);
    const nu = ((2 + 0.6 * gr ** 0.25 * pr ** (1 / 3)) ** 3 + (0.37 * re ** 0.6) ** 3) ** (1 / 3);
    const rConv = 1 / (nu * air.thcond / charDim * aOuter);
    const rRad = 1 / (4 * aOuter * 0.95 * SIGMA * (airT + 273.15) ** 3);
    const rTotal = rBody + rInsul + rConv * rRad / (rConv + rRad);
    const qLoss = (coreT - airT) / rTotal;
    // Breathing water loss at the heat produced (O2 extraction 20 %), g/s.
    const breathGs = Math.max(qLoss, 0) / 20.1 / 0.2094 / O2eff * (vapourDensity(coreT, 100) - vapourDensity(airT, rh)) / 1000;
    return { qLoss, rTotal, skinT, breathGs };
}

const fits = new Map();
/** Fur depth (mm) at which the still-air (0.1 m/s) conductance equals the allometric minimal conductance. */
// Above 5 kg fur insulation stays about the same "from a 5 kg fox to a 500 kg moose" (Scholander et al. 1950, Biol Bull 99:225):
// heavier creatures keep the 5 kg fit.
export function furFor(massKg, coreT, bird) {
    if (massKg > 5) return furFor(5, coreT, bird);
    const key = `${massKg}|${coreT}|${bird}`;
    if (fits.has(key)) return fits.get(key);
    const g = massKg * 1000;
    const cTarget = (bird ? 0.702 : 0.702 * 1.5) * g ** -0.519 * g * 20.1 / 3600;   // W/°C
    const cOf = fur => 1 / ellipsoid({ mass: massKg, coreT, furdepth: fur, airT: coreT - 20, windspd: 0.1 }).rTotal;
    // The model's fur resistance (thickness ÷ conductivity ÷ outer area) peaks and then falls as fur deepens: take the
    // thinnest fur that reaches the target, else the fur of lowest conductance.
    let best = 0, bestC = Infinity, fur = 0;
    for (let d = 0; d <= 300; d += 0.25) {
        const cd = cOf(d);
        if (cd <= cTarget) { fur = d; bestC = -1; break; }
        if (cd < bestC) { bestC = cd; best = d; }
    }
    const out = bestC === -1 ? fur : best;
    fits.set(key, out);
    return out;
}

export const dfCelsius = u => (u - 9968 - 32) * 5 / 9;   // DF Urist: °U = °F + 9968
export const BODY_HEAT_J_KG = 3470;                      // specific heat of body tissue [ASSUMED human value]
const PEAK = 4.9;                                         // peak / resting heat production (Eyolfson et al. 2001, human) [ASSUMED for all]

/**
 * One minute for a creature with HOMEOTHERM. Returns { core, waterL (evaporation beyond the resting share), kcal }.
 * met: multiple of basal (same METs as humans [ASSUMED]).
 */
export function endothermMinute(p, c, { met = 1.3 } = {}) {
    const e = p.env, th = p.thermal ??= {};
    const setT = dfCelsius(c.homeotherm);
    th.core ??= setT;
    const bird = 'FEATHER' in (c.tissues ?? {});
    const fur = furFor(p.mass, setT, bird);
    const basal = KLEIBER(p.mass);
    const loss = ellipsoid({ mass: p.mass, coreT: th.core, furdepth: fur, airT: e.tdb, windspd: Math.max(0.1, e.v ?? 0.1), rh: e.rh ?? 50 });
    const act = basal * met;
    // Heat production rises to cover loss when cold, up to PEAK × basal; when warm, evaporation removes what conduction cannot.
    const need = loss.qLoss;
    const produce = Math.min(Math.max(act, need), PEAK * basal + (act - basal));
    const evapW = Math.max(0, produce - need);
    const stored = produce - need - evapW;
    th.core = Math.round((th.core + stored * 60 / (p.mass * BODY_HEAT_J_KG)) * 1000) / 1000;
    th.set = setT;
    const latent = 2501200 - 2378.7 * e.tdb;
    return { core: th.core, set: setT, evapL: evapW / latent * 60 + loss.breathGs * 60 / 1000, kcal: produce * 60 / 4184, fur };
}
