// The voice in numbers (docs/df-body-engine.md, "The voice in numbers"): what each mark changes in the sound, measured against
// the speaker's own unmarked speech. A mark's name ("louder", "whispered") is an observation; the quantity is what a listener's
// ear receives and what the chat draws (src/ui.ts lookVars, style.css body.rules-distinct). The layers follow the source-filter
// account of speech (Fant 1960, Acoustic Theory of Speech Production): breath and larynx set loudness, pitch and phonation
// (the source), the tract above the larynx sets the vowel's formants (the filter), and timing lies over both. Every mark of
// prosody.ts is a source or a timing quantity, so none of them needs a model of the tract.
import { def, peek } from './constants.js';
import type { Mark } from './prosody.js';

// Tempo, as a ratio of the speaker's own syllables per second. Listeners judge tempo against the talk around it, and tell two
// tempos apart from about 5 % (Quené 2007, J Phonetics 35:353), so a ratio of the speaker's own rate is the unit.
// Faster: adults asked to speak as fast as stays intelligible went from 5.08 to 6.46 syllables/s reading and from 4.12 to 5.23
// speaking freely, 1.27 times both (Kuhlmann & Iwarsson 2024, J Voice 38:346, Table 1, 17 adults).
def({ id: 'voiceFastRate', value: 1.27, unit: "× the speaker's own syllables per second", status: 'sourced', src: 'habitual → fast: reading 5.08 → 6.46, free speech 4.12 → 5.23 syllables/s (Kuhlmann & Iwarsson 2024, J Voice 38:346)', file: 'voice.ts' });
// Slower: radio news slowed for learners runs at about 3 syllables/s against 4.5–5.5 for the usual news, 0.55–0.67 times
// (Trouvain 2004, Tempo Variation in Speech Production, Phonus 8, ch. 2).
def({ id: 'voiceSlowRate', value: 0.6, unit: "× the speaker's own syllables per second", status: 'assumed', src: 'slowed radio news about 3 syllables/s against 4.5–5.5 usual (Trouvain 2004, Phonus 8, ch. 2)', range: [0.55, 0.8], file: 'voice.ts' });
// The rate a pause is counted in: unmarked speech runs at 4.1–6.0 syllables/s (4.12 and 5.08, Kuhlmann & Iwarsson 2024;
// articulation 5.2–6.0, the studies in Trouvain 2004, Table 2.1).
def({ id: 'voiceSyllablesPerS', value: 5, unit: 'syllables per second, unmarked speech', status: 'assumed', src: 'between 4.12 (free speech) and 6.0 (articulation rate) syllables/s (Kuhlmann & Iwarsson 2024; Trouvain 2004, Table 2.1)', range: [4.1, 6], file: 'voice.ts' });

// Level, dB against the speaker's normal voice at 1 m. Louder: the raised voice of ANSI/ASA S3.5-1997 over the normal one,
// 68.34 − 62.35 dB (acoustics.ts SPEECH_SPL; tests/ui.test.mjs holds the two files together).
def({ id: 'voiceLoudDb', value: 5.99, unit: 'dB above the normal voice', status: 'sourced', src: 'raised − normal vocal effort, 68.34 − 62.35 dB at 1 m (ANSI/ASA S3.5-1997, acoustics.ts)', file: 'voice.ts' });
// Softer: the casual voice against the normal one, 52 against 57 dB at 1 m in a quiet room (Pearsons, Bennett & Fidell 1977,
// EPA-600/1-77-025, as acoustics.ts reads it); that "distinctly quieter" (Jefferson) is the casual voice is the judgement.
def({ id: 'voiceQuietDb', value: -5, unit: 'dB below the normal voice', status: 'assumed', src: 'casual − normal voice, 52 − 57 dB at 1 m (Pearsons, Bennett & Fidell 1977)', range: [-10, -3], file: 'voice.ts' });
// Whispered: 26.8 dB below phonated speech aimed at the same distance (Eriksson & Traunmüller 1999, ICPhS, acoustics.ts).
def({ id: 'voiceWhisperDb', value: -26.8, unit: 'dB below the normal voice', status: 'sourced', src: 'whispered − phonated vowels at 1.5 m (Eriksson & Traunmüller 1999, acoustics.ts)', file: 'voice.ts' });

// Pitch, semitones against the speaker's own level. The standard size of an accent's rise or fall is 4–6 semitones in Dutch
// and about 12 in British English, where most contours span 10–14 (Willems 1983, ICPhS 10, "English Intonation from a Dutch
// Point of View", after 't Hart, Collier & Cohen's method).
def({ id: 'voicePitchSemitones', value: 6, unit: 'semitones, one marked rise or fall', status: 'assumed', src: 'standard excursion of an accent: Dutch 4–6, British English about 12 semitones (Willems 1983, ICPhS 10)', range: [4, 12], file: 'voice.ts' });

/** How the larynx sounds the word: the glottis from most closed to most open (Gordon & Ladefoged 2001, J Phonetics 29:383). */
export type Phonation = 'creaky' | 'modal' | 'breathy' | 'whisper';
/** One word's sound against the speaker's unmarked speech. */
export interface Sound {
    /** Syllables per second ÷ the speaker's own rate. */
    rate: number;
    /** Level, dB against the speaker's normal voice at 1 m. */
    db: number;
    /** Pitch through the word, semitones against the speaker's own level, start to end ([0, 6] a rise; [0, 6, 0] a rise-fall). */
    pitch: number[];
    phonation: Phonation;
    /** The larynx's register: falsetto is the thin-edged vibration above the modal range. */
    register: 'modal' | 'falsetto';
    /** Further beats a drawn-out sound is held: one per colon of the notation (Jefferson: wo::rd). */
    held: number;
}
/** The colons the notation writes after a drawn-out sound (voice-code.ts toNotation), each one further beat. */
export const HELD_BEATS = 2;

/** A word's sound from its marks. Marks that pull one quantity both ways leave it where the speaker's own voice has it (faster
 * with slower: the speaker's own rate; louder with softer: the two levels added); a whispered word has the whisper's level
 * whatever else it carries, since a whisper has no voicing to raise. */
export function soundOf(marks: Mark[]): Sound {
    const has = (m: Mark) => marks.includes(m), e = peek('voicePitchSemitones');
    const rate = has('fast') === has('slow') ? 1 : has('fast') ? peek('voiceFastRate') : peek('voiceSlowRate');
    const db = has('whisper') ? peek('voiceWhisperDb') : (has('loud') ? peek('voiceLoudDb') : 0) + (has('quiet') ? peek('voiceQuietDb') : 0);
    // The pitch marks in the order given: each one moves the pitch by one excursion, and a word with both returns to its level.
    const moves = marks.filter(m => m === 'up' || m === 'down'), pitch = [0];
    if (moves.length === 1) pitch.push(moves[0] === 'up' ? e : -e);
    else if (moves.length > 1) pitch.push(moves[0] === 'up' ? e : -e, 0);
    return { rate, db, pitch, phonation: has('whisper') ? 'whisper' : has('creaky') ? 'creaky' : has('breathy') ? 'breathy' : 'modal',
        register: has('falsetto') ? 'falsetto' : 'modal', held: has('stretch') ? HELD_BEATS : 0 };
}

/** How many times as loud a level sounds: on the sone scale (Stevens 1936, Psychol Rev 43:405) each 10 phons, 10 dB at 1 kHz,
 * doubles the loudness (Hänsler & Schmidt 2008, Speech and Audio Processing in Adverse Environments, p. 299). */
export const loudnessRatio = (db: number) => 2 ** (db / 10);
/** A silence counted in the syllables it would have held at the unmarked rate: one at least, twelve at most (a line's worth). */
export const pauseBeats = (seconds: number) => Math.min(12, Math.max(1, Math.round(seconds * peek('voiceSyllablesPerS'))));

/** A mark's quantity in words, for the hover text on a marked word ("about 6 dB louder"); '' for a mark without one. */
export function quantityOf(mark: Mark): string {
    const s = soundOf([mark]), n = (x: number) => String(Math.round(Math.abs(x)));
    switch (mark) {
        case 'fast': case 'slow': return `about ${s.rate.toFixed(1)} times your own pace`;
        case 'loud': return `about ${n(s.db)} dB above your normal voice`;
        case 'quiet': case 'whisper': return `about ${n(s.db)} dB below your normal voice`;
        case 'up': case 'down': return `about ${n(s.pitch[1]!)} semitones ${mark}`;
        default: return '';
    }
}
