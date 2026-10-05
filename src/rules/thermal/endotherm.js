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
// Water (§6.5 immersion): viscosity by the Vogel equation μ = 2.414e−5 × 10^(247.8 ÷ (T − 140)) Pa·s (T in K); conductivity
// 0.58 W/m/K, specific heat 4186 J/kg/K, expansion 2.1e−4 /K (standard property tables).
function water(t) {
    return { densty: 1000, visdyn: 2.414e-5 * 10 ** (247.8 / (t + 273.15 - 140)), thcond: 0.58, cp: 4186, beta: 2.1e-4 };
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
export function ellipsoid({ posture = 4.5, mass, density = 1000, coreT, furdepth, furcond = 0.04, airT, radT = airT, windspd, rh = 50, O2eff = 0.2, fluid = 'air' }) {
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
    const wet = fluid === 'water';
    const air = wet ? water(airT) : { ...dryAir(airT), cp: 1005.8, beta: 1 / (airT + 273.15) };
    const charDim = ((4 / 3) * Math.PI * a * b * c) ** (1 / 3);
    const ecc = Math.sqrt(a ** 2 - c ** 2) / a;
    const area = 2 * Math.PI * b ** 2 + 2 * Math.PI * (a * b / ecc) * Math.asin(ecc);
    const re = air.densty * windspd * charDim / air.visdyn, pr = air.visdyn * air.cp / air.thcond;
    const nuMix = 2 + 0.6 * re ** 0.5 * pr ** (1 / 3);
    const g = 2 * area * kBody * air.thcond * nuMix * (coreT - airT) / (2 * kBody * charDim * ((4 / 3) * Math.PI * a * b * c) + area * fraction * air.thcond * (2 + 0.6 * re ** 0.5 * pr ** 0.333));
    const skinT = coreT - g * fraction / (2 * kBody);
    const gr = Math.abs(air.densty ** 2 * air.beta * 9.80665 * charDim ** 3 * (skinT - airT) / air.visdyn ** 2);
    const nu = ((2 + 0.6 * gr ** 0.25 * pr ** (1 / 3)) ** 3 + (0.37 * re ** 0.6) ** 3) ** (1 / 3);
    const rConv = 1 / (nu * air.thcond / charDim * aOuter);
    // Radiation to the mean radiant temperature (sun, fire, sky): the surroundings act at the operative temperature
    // (convection-weighted air and radiant-weighted radiant temperature). Under water, convection only.
    const rRad = wet ? Infinity : 1 / (4 * aOuter * 0.95 * SIGMA * ((airT + radT) / 2 + 273.15) ** 3);
    const rSurf = wet ? rConv : rConv * rRad / (rConv + rRad);
    const opT = wet ? airT : (airT / rConv + radT / rRad) * rSurf;
    const rTotal = rBody + rInsul + rSurf;
    const qLoss = (coreT - opT) / rTotal;
    // Breathing water loss at the heat produced (O2 extraction 20 %), g/s.
    const breathGs = wet ? 0 : Math.max(qLoss, 0) / 20.1 / 0.2094 / O2eff * (vapourDensity(coreT, 100) - vapourDensity(airT, rh)) / 1000;
    return { qLoss, rTotal, skinT, breathGs, hcA: 1 / rConv };
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

// Mammals that sweat to cool: "humans, horses, some primates and some bovidae"; dogs and others with few sweat glands pant
// (Wikipedia, Perspiration). Equids for horses, cattle-type bovids for "some bovidae", all DF primates [ASSUMED]; giant forms and
// animal people as their base.
const SWEATERS = new Set(['HORSE', 'DONKEY', 'MULE', 'COW', 'WATER_BUFFALO', 'YAK', 'MACAQUE_RHESUS', 'MANDRILL', 'CHIMPANZEE', 'BONOBO',
    'GORILLA', 'ORANGUTAN', 'GIBBON_SIAMANG', 'GIBBON_WHITE_HANDED', 'GIBBON_BLACK_HANDED', 'GIBBON_GRAY', 'GIBBON_SILVERY', 'GIBBON_PILEATED',
    'GIBBON_BILOU', 'GIBBON_WHITE_BROWED', 'GIBBON_BLACK_CRESTED', 'GRAY_LANGUR', 'CAPUCHIN', 'SPIDER_MONKEY', 'LION_TAMARIN']);
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
    // Wind at the creature's height h = 2 × the ellipsoid's short radius (lying or standing low [ASSUMED]): log profile from
    // the 10 m weather wind, z0 = 0.01 m, as for humans (§6.4). Air speed given indoors applies unchanged.
    const b = (3 * p.mass / 1000 / (4 * Math.PI * 4.5)) ** (1 / 3), h = Math.max(0.02, 2 * b);
    const v = e.wind10 ? e.wind10 / 3.6 * Math.log(h / 0.01) / Math.log(10 / 0.01) : e.v ?? 0.1;
    // Immersed (any part, whole body [ASSUMED]): water convection; fur fills with water (conductivity 0.58) unless the
    // creature is AQUATIC or AMPHIBIOUS in DF [ASSUMED: those keep air in the fur].
    const w = e.water, keepsFur = c.flags?.includes('AQUATIC') || c.flags?.includes('AMPHIBIOUS');
    const loss = w
        ? ellipsoid({ mass: p.mass, coreT: th.core, furdepth: fur, furcond: keepsFur ? 0.04 : 0.58, airT: w.tc, windspd: Math.max(0.01, w.speed ?? 0), fluid: 'water' })
        : ellipsoid({ mass: p.mass, coreT: th.core, furdepth: fur, airT: e.tdb, radT: e.tr ?? e.tdb, windspd: Math.max(0.1, v), rh: e.rh ?? 50 });
    const act = basal * met;
    // Heat production rises to cover loss when cold, up to PEAK × basal; when warm, evaporation removes what conduction cannot.
    const need = loss.qLoss;
    const produce = Math.min(Math.max(act, need), PEAK * basal + (act - basal));
    // Evaporation limit (NicheMapR endoR defaults: panting up to 5 × breathing, skin wetted up to 100 %): breathing water × 5
    // plus the wet skin share, by the Lewis relation he = 16.5 K/kPa × hc (ASHRAE) against the air's vapour pressure; vapour
    // passes the fur freely [ASSUMED]. Only sweaters wet the skin fully; the rest stay at endoR's resting 0.5 %.
    const latentS = 2501200 - 2378.7 * (w ? w.tc : e.tdb);
    const pAir = vappr(e.tdb) * (e.rh ?? 50) / 100;
    const wetShare = SWEATERS.has(c.id.replace(/^GIANT_|_MAN$/, '')) ? 1 : 0.005;
    const evapMax = w ? 0 : 5 * loss.breathGs * latentS + wetShare * Math.max(0, 16.5e-3 * loss.hcA * (vappr(loss.skinT) - pAir));
    const evapW = Math.min(evapMax, Math.max(0, produce - need));
    const stored = produce - need - evapW;
    th.core = Math.round((th.core + stored * 60 / (p.mass * BODY_HEAT_J_KG)) * 1000) / 1000;
    th.set = setT;
    const latent = 2501200 - 2378.7 * (w ? w.tc : e.tdb);
    return { core: th.core, set: setT, evapL: evapW / latent * 60 + loss.breathGs * 60 / 1000, kcal: produce * 60 / 4184, fur };
}
