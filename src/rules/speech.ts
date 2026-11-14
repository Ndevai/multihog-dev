// A full voice (the player's pick, 2026-11-12): said words spoken in the box by eSpeak NG (lib/espeak-ng, GPL-3.0; the
// English rules that turn letters into speech sounds are its), in each speaker's own voice from the engine: the pitch their
// simulated folds give (voice-sound.ts), the vowels' resonances scaled to their tract's length, their syllables a second.
// eSpeak's own voice was measured in Node on "The north wind and the sun…" (63 syllables, 45 words): at 175 words a minute
// it spoke 4.94 syllables a second (pauses included); its median pitch was 1.27–1.30 × its "pitch" base for bases 100–240 Hz;
// its formant spacing (F3 − F1) ÷ 2 at 100 % gave 1005 Hz, a tract of 17.57 cm by Fitch's c ÷ 2ΔF, and moved in proportion to
// the formant setting from 90 to 130 % (910, 1005, 1097, 1213, 1317 Hz).
import { def, peek } from './constants.js';

def({ id: 'speechPitchPerBase', value: 1.29, unit: "eSpeak's median pitch ÷ its pitch base", status: 'fitted', src: 'measured 1.27–1.30 at bases 100–240 Hz (Node, autocorrelation of voiced 30 ms frames)', range: [1.27, 1.30], file: 'speech.ts' });
def({ id: 'speechTractCm', value: 17.57, unit: "cm, the tract eSpeak's voice has at formants 100 %", status: 'fitted', src: 'median formant spacing 1005 Hz over the passage (LPC), c ÷ 2ΔF', range: [17.2, 17.9], file: 'speech.ts' });
def({ id: 'speechSylPerSAt175', value: 4.94, unit: 'syllables a second eSpeak speaks at 175 words a minute', status: 'fitted', src: '63 syllables in 12.76 s', range: [4.8, 5.1], file: 'speech.ts' });
// The pitch's range: eSpeak's default voice's own, top 1.44 × base (its "pitch 82 118") [ASSUMED: kept for every voice].
export const SPEECH_RANGE = 118 / 82;

/** What eSpeak takes for a voice: its pitch base and top (Hz), the formants' scale (%, all of them), the words a minute. */
export interface SpeechVoice { base: number; top: number; formantPct: number; wpm: number; whisper: boolean }
/** A person's voice for eSpeak: the base that gives their pitch, the scale that gives their tract's formants (shorter tract,
 * higher formants), the rate that gives their syllables a second. */
export function speechVoice(f0Hz: number, tractCm: number, sylPerS: number, whisper = false): SpeechVoice {
    const base = f0Hz / peek('speechPitchPerBase');
    return { base: Math.round(base), top: Math.round(base * SPEECH_RANGE), formantPct: Math.round(100 * peek('speechTractCm') / tractCm), wpm: Math.round(175 * sylPerS / peek('speechSylPerSAt175')), whisper };
}
// eSpeak's own whisper (its voices/!v/whisper): little voicing and much breath, for a whispered stretch.
const WHISPER = 'voicing 17\nbreath 75 75 50 40 15 10\nbreathw 150 150 200 200 400 400\n';
/** The voice variant file eSpeak reads (voices/!v/<name>). */
export const speechVoiceFile = (name: string, v: SpeechVoice) =>
    `language variant\nname ${name}\npitch ${v.base} ${v.top}\n${[1, 2, 3, 4, 5, 6, 7, 8].map(k => `formant ${k} ${v.formantPct} 100 100`).join('\n')}\n${v.whisper ? WHISPER : ''}`;
/** When each letter of the spoken text appears (ms): eSpeak's word events (the 1-based place of each word in the text, the ms
 * of audio where it starts), each word's letters spread over the time until the next word; letters before the first word at
 * 0, after the last word until the audio's end. */
export function speechTimes(text: string, words: [number, number][], totalMs: number): number[] {
    const out = new Array<number>(text.length).fill(0), w = words.filter(([p]) => p >= 1).sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < w.length; k++) {
        const [p, a] = w[k]!, from = p - 1, to = k + 1 < w.length ? w[k + 1]![0] - 1 : text.length, end = k + 1 < w.length ? w[k + 1]![1] : totalMs;
        for (let j = from; j < to && j < text.length; j++) out[j] = a + (end - a) * (j - from + 1) / Math.max(1, to - from);
    }
    for (let j = 1; j < out.length; j++) out[j] = Math.max(out[j]!, out[j - 1]!);
    return out;
}

// ------------------------------------------------------------------------------------------------- the natural voice
/** Letter times stretched to the audio heard (the natural voice, pocket.ts, gives no word times): the reading times (box.ts
 * revealTimes, with their pauses) scaled so the last letter comes at the audio's end. */
export const scaleTimes = (times: number[], toMs: number) => { const end = times.at(-1) || 1; return times.map(t => t * toMs / end); };
