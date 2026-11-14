// A character's own voice, computed from their body (docs/df-body-engine.md, "The voice from the body"; the player's picks,
// 2026-11-11: store the causes, compute what they give; the full chain; bits per syllable from the 17 measured languages;
// each person's own difference drawn at its cause from a measured spread). Few facts are kept (height, sex, age, the
// language spoken) and three numbers drawn once (rateZ; stretchZ and tractZ for voice-sound.ts); the rest is derived: the
// tract's shape and its resonances (formants), the folds and the pitch their simulated motion gives, the syllables a
// second. The forward map is a function, the reverse is not: many tract shapes give one formant pattern (Atal, Chang,
// Mathews & Tukey 1978, JASA 63:1535), so the cause is what is kept.
import { def, peek } from './constants.js';
import { INFO_RATE } from './data/info-rate.js';
import { heightShare } from './growth.js';
import { tractCmOf, formantsOfBody, speakerOfBody, restingVoiceNow, restingVoiceOf, restingTract, transferAt, HEIGHT } from './voice-sound.js';
import { harmonicAmps } from './blips.js';
export { foldMmOf } from './voice-sound.js';
// --------------------------------------------------------------------------------------------------------- the tract
/** The speed of sound in the tract's air at body temperature: c = 331.3 √(1 + T ÷ 273.15) m/s for air (ideal gas), at
 * 37 °C 353.0 m/s, the synthesizer's 353. */
export const SOUND_IN_TRACT = 331.3 * Math.sqrt(1 + 37 / 273.15);
/** The resonances of a uniform tube of length `cm`, closed at the glottis, open at the lips: F_n = (2n − 1) c ÷ 4L, a
 * quarter wavelength and its odd multiples (Fant 1960; at 17.5 cm 504, 1513 and 2522 Hz, the schwa's 500, 1500, 2500).
 * The check the synthesizer's tube chain meets (tests/voice-body.test.mjs). */
export const formantsOf = (cm, n = 3) => Array.from({ length: n }, (_, i) => Math.round((2 * i + 1) * SOUND_IN_TRACT * 100 / (4 * cm)));
// --------------------------------------------------------------------------------------------------------- the rate
// The information a speaker delivers per second, alike across languages: 39.15 bits/s (Coupé et al. 2019, 17 languages);
// a language's syllables a second is that over its bits per syllable (data/info-rate.ts). In those data the rate so
// predicted lies within 16 % of each language's measured one, 8.2 % on average (root mean square; English 5.52 against
// 6.38, Thai 5.45 against 4.70).
def({ id: 'voiceInfoRate', value: 39.15, unit: 'bits per second, read speech', status: 'sourced', src: 'mean information rate over 17 languages, SD 5.10 (Coupé, Oh, Dediu & Pellegrino 2019, Sci Adv 5:eaaw2594)', file: 'voice-body.ts' });
// One person against their language's mean, from the same data (170 speakers): men 1.027, women 0.973; after sex, a
// spread of 8.8 % (SD); with age, −0.079 % a year around 30.6 years (132 speakers aged 16–69 with an age; r −0.09).
def({ id: 'voiceRateSpread', value: 0.0882, unit: "SD of a speaker's rate ÷ their language's and sex's mean", status: 'fitted', src: 'Coupé et al. 2019 data, 170 speakers', range: [0.07, 0.11], file: 'voice-body.ts' });
// Talk runs slower than reading: the same 17 adults read at 5.08 and spoke freely at 4.12 syllables/s (Kuhlmann & Iwarsson
// 2024, J Voice 38:346, as voice.ts reads them).
export const TALK_OF_READING = 4.12 / 5.08;
// Children articulate more slowly: in sentence repetition, 570 children's median rate rose from 2.7 syllables/s at 36 months
// to 3.3 at 96 months against adults' 3.6, and was generally adult-like by about 10 years (Mahr, Rathouz & Hustad 2021, J
// Speech Lang Hear Res 64:4057, PMC9132150). A child's rate is the adult's × the median's share of the adults' 3.6: linear
// from 36 to 96 months, then to 1 at 120 [ASSUMED: straight between their 96-month median and "adult-like by 10"]; under 36
// months the 36-month share. The adult age trend (−0.079 % a year, measured from 16 to 69) holds from 16; from 10 to 16, 1.
export function childRate(age) {
    const m = Math.max(36, age * 12);
    if (m >= 120)
        return 1;
    return (m <= 96 ? 2.7 + (m - 36) / 60 * 0.6 : 3.3 + (m - 96) / 24 * 0.3) / 3.6;
}
/** A language's bits per syllable: its measured value, or the 17 languages' mean for one outside them. */
export function bitsOf(language) {
    const l = String(language ?? '').trim().toLowerCase(), row = Object.values(INFO_RATE).find(r => r.names.includes(l));
    const all = Object.values(INFO_RATE).map(r => r.bits);
    return row ? { bits: row.bits, measured: true } : { bits: all.reduce((s, b) => s + b, 0) / all.length, measured: false };
}
/** A tracked person's facts. */
export const voiceFactsOf = (p) => ({ heightCm: p.heightCm, sex: p.sex, age: p.age, language: p.languages?.[0], rateZ: p.rateZ, stretchZ: p.stretchZ, tractZ: p.tractZ, timingZ: p.timingZ });
/** The causes of a person's anatomy (growth.ts, voice-sound.ts), or null: a height and a sex, and an age from 5 (the
 * youngest measured voices the chain is checked against: Vuorenkoski et al. 1978 from 6, Hillenbrand et al. 1995's
 * children 10–12; Preece & Baines's growth curve holds from 2). No age: an adult. */
export function causesOf(f) {
    const male = /^m/i.test(f.sex ?? ''), sexKnown = /^(m|f|w)/i.test(f.sex ?? '');
    return f.heightCm && sexKnown && (f.age == null || f.age >= 5) ? { heightCm: f.heightCm, male, ...f.age != null ? { age: f.age } : {}, stretchZ: f.stretchZ ?? 0, tractZ: f.tractZ ?? 0, timingZ: f.timingZ ?? 0 } : null;
}
/** The voice of a person (the facts above): the anatomy for anyone from 5 with height and sex; the rate from the language's bits
 * per syllable, the person's sex and age, their own draw, and talk against reading. */
export function voiceOf(f) {
    const male = /^m/i.test(f.sex ?? ''), sexKnown = /^(m|f|w)/i.test(f.sex ?? '');
    const { bits, measured } = bitsOf(f.language);
    const sexRate = !sexKnown ? 1 : male ? 1.0268 : 0.9732, ageRate = f.age != null ? childRate(f.age) * (1 - 0.000794 * (Math.max(16, f.age) - 30.6)) : 1;
    const sylPerS = Math.round(peek('voiceInfoRate') / bits * sexRate * ageRate * (1 + peek('voiceRateSpread') * (f.rateZ ?? 0)) * TALK_OF_READING * 100) / 100;
    const out = { bits: Math.round(bits * 100) / 100, bitsMeasured: measured, sylPerS };
    const c = causesOf(f);
    if (c) {
        const rest = restingVoiceNow(c);
        Object.assign(out, { tractCm: Math.round(tractCmOf(c) * 10) / 10, formantsHz: formantsOfBody(c), foldMm: Math.round(speakerOfBody(c).cordLength * 1e4) / 10,
            ...rest ? { f0Hz: Math.round(rest.f0Hz), steady: rest.steady } : {} });
    }
    return out;
}
/** The facts a person is heard with: their own, or, for someone whose height the story has not set but whose sex it has, the
 * mean adult of that sex (voice-sound.ts HEIGHT) grown to the share of adult height their age gives (growth.ts heightShare,
 * their own growth timing) [ASSUMED: heard as the average body until BodySize places them]; the narrator's notes keep only
 * what is known (voiceFactsOf). Until (133) a child of unset height was heard at the adult's height. */
export const speakingFactsOf = (p) => {
    const f = voiceFactsOf(p), male = /^m/i.test(p.sex ?? ''), known = /^(m|f|w)/i.test(p.sex ?? '');
    if (f.heightCm || !known)
        return f;
    const age = f.age ?? 30;
    return { ...f, heightCm: HEIGHT[male ? 'male' : 'female'].mean * heightShare(male, age, p.timingZ ?? 0), age };
};
/** Every tracked person's resting voice, run (voice-sound.ts) and kept for the session: as the notes know them and as heard. */
export const voicesReady = (people) => Promise.all(Object.values(people || {}).filter(p => !p.dead).flatMap(p => [voiceFactsOf(p), speakingFactsOf(p)]).map(causesOf).filter((c) => !!c).map(restingVoiceOf));
/** The voice in a line for the narrator and the name plate's hover. */
export const voiceLine = (v) => [v.tractCm ? `tract ${v.tractCm} cm, formants ${v.formantsHz.join(' / ')} Hz` : '',
    v.f0Hz ? `pitch about ${v.f0Hz} Hz${v.steady === false ? ' (uneven: rough or creaky)' : ''}` : '', `${v.sylPerS} syllables/s in talk`].filter(Boolean).join(', ');
/** A person's voice as a tone for the box's blips (blips.ts): their resting pitch and the amplitudes of its harmonics through
 * their own tract (voice-sound.ts transferAt), kept per voice; null until the pitch's run has finished, or without anatomy. */
const harmonics = new Map();
export function voiceHarmonics(f) {
    const c = causesOf(f), rest = c ? restingVoiceNow(c) : undefined;
    if (!c || !rest || !rest.f0Hz)
        return null;
    const key = JSON.stringify([c, rest.f0Hz]);
    let h = harmonics.get(key);
    if (!h) {
        const tubes = restingTract(speakerOfBody(c));
        h = { f0: rest.f0Hz, amps: harmonicAmps(rest.f0Hz, hz => transferAt(tubes, hz)) };
        harmonics.set(key, h);
    }
    return h;
}
