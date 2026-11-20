// Tells: what shows a kind of being that passes for another (the player's pick, 2026-11-16: "A · I check for myself"; the
// pull shared by the works they named: weaker than the threat, fixed rules that can be learned, a call made from what one
// sees and hears, a wrong call that kills). A world-book entry lists its kind's tells as laws of nature: the sign, what the
// others show in its place, the sense, the sign's size and the condition it needs. Some are known to all and stand in [WORLD];
// the rest are true and unknown, and show only through what a character perceives. Who truly is what is fixed in the world's
// record (Person.truly) and kept hidden; a look or a touch returns each tell whose condition holds and that the viewer's eyes
// resolve, the sign for one of the kind and the ordinary for anyone else, whatever the one looked at wants.
import { def, k } from './constants.js';
import { see, LIGHT } from './vision.js';
export const TELL_SENSES = ['sight', 'touch'];
// The conditions a tell can need, each one the engine works out where the bearer stands: breath that would mist (the air's
// temperature and humidity, below), the open sky with the sun up (no room around them, the sun's altitude above 0), darkness
// (the light there below civil twilight's 3.4 lux, vision.ts LIGHT), night (the sun below the horizon), and water (in it).
export const TELL_WHEN = ['always', 'when breath would mist', 'under the open sky by day', 'in darkness', 'at night', 'in water', 'when the air is far from a body\'s warmth'];
// Breath mists where the mix of breath and air passes saturation somewhere between the two (the mixing-line test meteorology
// uses for contrails and steam fog, the Schmidt–Appleman criterion: Schumann 1996, Meteorol Z 5:4). Breath measured at the
// mouth: 31.4–35.4 °C, relative humidity up to about 91 % (31 people, 340 breaths in Paris and Haifa, Sensors and Actuators B
// 2019, doi 10.1016/j.snb.2019.127371; read from a summary of the paper). Taken as 34 °C at 90 %. Saturation vapour pressure
// over water: Magnus form with Alduchov & Eskridge's constants (1996, J Appl Meteorol 35:601), hPa. With these, breath mists
// below about 9 °C in dry air (30 %), 11 °C at 50 %, 13 °C at 70 % and 17 °C at 90 %; saturated breath would put each about
// 9 °C higher, against the common experience of breath seen in cold air only.
def({ id: 'breathC', value: 34, unit: '°C, breath at the mouth', status: 'sourced', src: 'Sensors and Actuators B 2019 (doi 10.1016/j.snb.2019.127371): 31.4–35.4 °C', range: [31.4, 35.4], file: 'tells.ts' });
def({ id: 'breathRh', value: 0.9, unit: 'relative humidity of breath at the mouth, 0–1', status: 'sourced', src: 'Sensors and Actuators B 2019: up to about 91 % (read from a summary)', range: [0.8, 1], file: 'tells.ts' });
export const satHpa = (c) => 6.1094 * Math.exp(17.625 * c / (c + 243.04));
/** Whether a person's breath mists in air at `airC` °C and `rh` % relative humidity. */
export function breathMists(airC, rh) {
    const tb = k('breathC'), eb = satHpa(tb) * k('breathRh'), ea = satHpa(airC) * Math.max(0, Math.min(100, rh)) / 100;
    for (let i = 1; i < 100; i++) {
        const f = i / 100, t = airC + f * (tb - airC), e = ea + f * (eb - ea);
        if (e > satHpa(t))
            return true;
    }
    return false;
}
// A kind on axes (the player's pick, 2026-11-16: a name is one point of a semantic space, so decompose it): its body is a set
// of switches on the body the engine simulates, Dwarf Fortress creature tokens the engine already reads (NOBREATHE in 18 of the
// 767 creatures of its raws, NO_SLEEP in 64, NO_EAT in 15, NO_DRINK in 97, NOPAIN in 21, NOFEAR in 20) and NO_HEAT, a body
// that keeps no warmth of its own (the raws' HOMEOTHERM absent: 289 of the 767 keep their heat). Each has a letter for the
// seed. What the engine computes from a switch is a tell of its own, not written by hand: no mist of breath for NOBREATHE
// (the breath physics above); for NO_HEAT, skin at the air's temperature under a hand, felt where the air is 3 °C or more
// from a person's skin of about 33 °C [ASSUMED: skin in comfort, and a difference a hand feels]. NO_SLEEP, NO_EAT, NO_DRINK,
// NOPAIN and NOFEAR change what the engine does with the body (body-engine.ts `has`) and show over time, not in one look.
export const BODY = {
    B: { token: 'NOBREATHE', says: 'do not breathe' }, H: { token: 'NO_HEAT', says: 'keep no warmth of their own' }, S: { token: 'NO_SLEEP', says: 'do not sleep' },
    E: { token: 'NO_EAT', says: 'eat no food of ours' }, D: { token: 'NO_DRINK', says: 'do not drink' }, P: { token: 'NOPAIN', says: 'feel no pain' }, F: { token: 'NOFEAR', says: 'feel no fear' },
};
def({ id: 'skinC', value: 33, unit: '°C, a person\'s skin in comfort', status: 'assumed', src: 'mean skin temperature near thermal comfort', range: [32, 34], file: 'tells.ts' });
def({ id: 'skinFeltC', value: 3, unit: '°C between skin and the air that a hand feels as cold or hot skin', status: 'assumed', src: 'none held', range: [1, 6], file: 'tells.ts' });
/** The tells the engine computes from a kind's body switches. */
export function bodyTells(body) {
    const out = [];
    if (body?.includes('NOBREATHE'))
        out.push({ sign: 'no mist of breath', ordinary: 'breath that mists', sense: 'sight', size_m: 0.2, when: 'when breath would mist', known: false });
    if (body?.includes('NO_HEAT'))
        out.push({ sign: 'skin at the air\'s temperature, with no warmth of a body', ordinary: 'skin with a body\'s warmth', sense: 'touch', when: 'when the air is far from a body\'s warmth', known: false });
    return out;
}
/** A kind's tells: those computed from its body, then any written as laws beyond what the engine computes. */
export const tellsOf = (e) => [...bodyTells(e.body), ...e.tells ?? []];
/** The kind's entries that carry tells. */
export const kindsWithTells = (book) => book.filter(e => tellsOf(e).length);
/** Whether the tell's condition holds where `target` stands; null when what it needs is not on record. */
export function tellHolds(t, target, place = { lux: null, sunAlt: null, indoors: null }) {
    switch (t.when ?? 'always') {
        case 'always': return true;
        case 'when breath would mist': {
            const env = target.env;
            return env && Number.isFinite(env.tdb) && Number.isFinite(env.rh) ? breathMists(env.tdb, env.rh) : null;
        }
        case 'under the open sky by day': return place.sunAlt == null || place.indoors == null ? null : !place.indoors && place.sunAlt > 0;
        case 'in darkness': return place.lux == null ? null : place.lux < LIGHT['civil twilight'];
        case 'at night': return place.sunAlt == null ? null : place.sunAlt < 0;
        case 'in water': return target.env ? !!target.env.water : null;
        case 'when the air is far from a body\'s warmth': {
            const env = target.env;
            return env && Number.isFinite(env.tdb) ? Math.abs(env.tdb - k('skinC')) >= k('skinFeltC') : null;
        }
        default: return null;
    }
}
/**
 * What `target` shows the viewer of each tell in the book for `sense`: the sign when they truly are of the tell's kind, the
 * ordinary otherwise. Sight tells show when the viewer's eyes detect a detail of the sign's size at that distance and light
 * (vision.ts see, the Johnson detection criterion), one draw each; touch tells show on contact. `open` collects the tells
 * whose condition the records cannot settle.
 */
export function tellsShown(book, target, sense, rng, sight, place) {
    const shown = [], open = [];
    for (const e of kindsWithTells(book))
        for (const t of tellsOf(e)) {
            if (t.sense !== sense)
                continue;
            const holds = tellHolds(t, target, place);
            if (holds === null) {
                open.push(`${t.sign} (${t.when})`);
                continue;
            }
            if (!holds)
                continue;
            if (sense === 'sight') {
                if (!sight || !(Number(t.size_m) > 0))
                    continue;
                const p = see({ size: Number(t.size_m), distance: sight.distance_m, light: sight.light, visibility: sight.visibility_m, contrast: sight.contrast, seconds: sight.seconds, acuityFactor: sight.acuityFactor }).detect;
                if (!(rng() < p))
                    continue;
            }
            const sign = !!target.truly && target.truly.toLowerCase() === e.what.toLowerCase();
            shown.push({ text: sign ? t.sign : t.ordinary, sign });
        }
    return { shown, open };
}
