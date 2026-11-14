// Each feeling the engine records, placed by the words that name it: valence (1 unhappy … 9 happy) and arousal (1 calm … 9
// excited), the mean over those words of the Warriner, Kuperman & Brysbaert norms (2013, Behav Res Methods 45:1191; 13,915
// English lemmas, file Ratings_Warriner_et_al.csv, columns V.Mean.Sum and A.Mean.Sum). The words: for the 22 OCC types the
// tokens emotion.ts TYPES lists, each read by its first word as the norms hold it, or without -s or -ing (gloating → gloat);
// for Juslin & Laukka's five (prosody.ts, the voice marks' feelings) the noun and the adjective. Built outside the
// repository from the norms' file (AGENTS.md); the words used stand with each.
export const FEELING_VA: Record<string, { v: number; a: number; words: string[] }> = {
    'joy': { v: 7.76, a: 5.06, words: ['glad', 'happy', 'pleased', 'cheerful', 'delighted', 'elated', 'joyful'] },
    'distress': { v: 2.66, a: 5.05, words: ['upset', 'unhappy', 'sad', 'miserable', 'distressed', 'grief', 'shock'] },
    'happy-for': { v: 8.01, a: 5.1, words: ['happy', 'pleased', 'delighted'] },
    'sorry-for': { v: 5.62, a: 4.07, words: ['pity', 'sympathy', 'compassion', 'sorry'] },
    'resentment': { v: 2.88, a: 5.0, words: ['envy', 'jealousy', 'resentment'] },
    'gloating': { v: 3.68, a: 3.75, words: ['gloat'] },
    'hope': { v: 6.57, a: 5.05, words: ['hopeful', 'anticipation', 'excitement', 'look'] },
    'fear': { v: 3.16, a: 5.7, words: ['worried', 'nervous', 'anxious', 'scared', 'dread', 'terrified'] },
    'satisfaction': { v: 7.33, a: 4.24, words: ['satisfaction', 'hope'] },
    'fears-confirmed': { v: 2.93, a: 6.14, words: ['fear'] },
    'relief': { v: 6.63, a: 4.42, words: ['relief'] },
    'disappointment': { v: 2.7, a: 5.52, words: ['disappointment', 'frustration', 'despair', 'heartbroken'] },
    'pride': { v: 6.5, a: 5.54, words: ['pride'] },
    'self-reproach': { v: 2.54, a: 5.11, words: ['embarrassment', 'guilt', 'shame'] },
    'appreciation': { v: 6.9, a: 4.51, words: ['admiration', 'respect', 'esteem', 'awe'] },
    'reproach': { v: 4.13, a: 4.04, words: ['reproach', 'disdain', 'contempt', 'indignation'] },
    'gratitude': { v: 5.88, a: 4.62, words: ['gratitude', 'thankful', 'indebted'] },
    'anger': { v: 3.05, a: 5.55, words: ['annoyance', 'irritation', 'anger', 'indignation', 'outrage', 'fury', 'rage'] },
    'gratification': { v: 5.75, a: 3.88, words: ['pleased', 'smug'] },
    'remorse': { v: 4.22, a: 4.04, words: ['remorse', 'penitent'] },
    'liking': { v: 7.67, a: 5.34, words: ['like', 'affection', 'love', 'adore'] },
    'disliking': { v: 3.04, a: 5.17, words: ['dislike', 'aversion', 'disgust', 'hate', 'loathe'] },
    'voice:anger': { v: 2.51, a: 6.06, words: ['anger', 'angry'] },
    'voice:fear': { v: 2.59, a: 5.63, words: ['fear', 'afraid'] },
    'voice:happiness': { v: 8.48, a: 6.28, words: ['happiness', 'happy'] },
    'voice:sadness': { v: 2.25, a: 3.15, words: ['sadness', 'sad'] },
    'voice:tenderness': { v: 6.68, a: 3.16, words: ['tenderness', 'tender'] },
};
