// Voice blips (the player's pick, 2026-11-12): as a said stretch appears in the box, each syllable sounds a short tone in the
// speaker's own voice, as visual novels sound their text with a beep (Ace Attorney), here from the body: the pitch the
// speaker's simulated folds give (voice-sound.ts), the harmonics weighted by their own tract's response (source and filter:
// Fant 1960). Text that is not said (narration, thought) is no sound and stays silent; a whisper, voiceless, stays silent too.
import { def, peek } from './constants.js';
import { syllables } from './box.js';
// One tone per syllable, held for the vowel's part of it [ASSUMED: half the syllable's time], rising and falling in 5 ms
// [ASSUMED: short enough not to blur the syllables, long enough not to click], under the music [ASSUMED: a quarter of the
// music's volume].
def({ id: 'blipVowelShare', value: 0.5, unit: "share of a syllable's time its tone sounds", status: 'assumed', src: "the vowel's part of a syllable", range: [0.3, 0.7], file: 'blips.ts' });
def({ id: 'blipLevel', value: 0.25, unit: "× the music's volume", status: 'assumed', src: 'under the music, above silence', range: [0.1, 0.5], file: 'blips.ts' });
export const BLIP_RAMP_S = 0.005;
/** The tones of a stretch: for each word, its syllables (box.ts syllables) spread evenly over the time its letters take to
 * appear (`times`, box.ts revealTimes, ms), each starting at its share and lasting blipVowelShare of it. */
export function blipPlan(text, times) {
    const out = [];
    for (const m of text.matchAll(/[\p{L}\p{N}'’-]+/gu)) {
        const len = m[0].length, start = m.index, end = start + len - 1, n = Math.max(1, syllables(m[0]));
        if (!/\p{L}/u.test(m[0]))
            continue;
        // A word's letters appear evenly (box.ts revealTimes), so it begins one letter's time before its first letter; a pause
        // before it is silence.
        const per = len > 1 ? (times[end] - times[start]) / (len - 1) : times[start] - (start > 0 ? times[start - 1] : 0);
        const begin = times[start] - per, each = per * len / n;
        for (let k = 0; k < n; k++)
            out.push({ at: begin + k * each, dur: each * peek('blipVowelShare') });
    }
    return out;
}
/** The amplitudes of a voice's harmonics up to `maxHz`: harmonic k of f0 at 1 ÷ k (the glottal source falls 12 dB an octave
 * and radiation from the lips adds 6: Fant 1960) × the tract's gain there (`gainAt`, |U lips ÷ U glottis|), the strongest 1. */
export function harmonicAmps(f0, gainAt, maxHz = 5000) {
    const n = Math.max(1, Math.floor(maxHz / f0)), a = Array.from({ length: n }, (_, i) => gainAt((i + 1) * f0) / (i + 1));
    const top = Math.max(...a) || 1;
    return a.map(x => x / top);
}
