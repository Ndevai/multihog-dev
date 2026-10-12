// How much of a closely related language a listener understands without having learned it: spoken cloze test, share of
// missing words restored, all listeners (Gooskens, van Heuven, Golubović, Schüppert, Swarte & Voigt 2018, Int J
// Multilingualism 15:169, Tables 2–4; 1,833 young adult listeners, 16 languages). Listener language first. Pairs with
// English as the language heard are left out: their scores (86–94 %) come from English learned at school, and a character
// who learned English has it among their languages.
const CLOZE: Record<string, Record<string, number>> = {
    danish: { dutch: 13.3, german: 47.8, swedish: 56.7 },
    dutch: { danish: 10.5, german: 75.0, swedish: 10.4 },
    english: { danish: 7.9, dutch: 10.3, german: 27.7, swedish: 8.3 },
    german: { danish: 16.7, dutch: 31.1, swedish: 10.0 },
    swedish: { danish: 62.5, dutch: 13.0, german: 37.0 },
    french: { italian: 24.2, portuguese: 23.5, romanian: 11.0, spanish: 31.5 },
    italian: { french: 46.3, portuguese: 33.5, romanian: 10.6, spanish: 65.7 },
    portuguese: { french: 34.3, italian: 49.4, romanian: 14.7, spanish: 77.4 },
    romanian: { french: 47.1, italian: 57.7, portuguese: 22.9, spanish: 54.0 },
    spanish: { french: 28.2, italian: 45.7, portuguese: 37.2, romanian: 13.6 },
    bulgarian: { croatian: 29.1, czech: 10.6, polish: 7.1, slovak: 16.0, slovene: 20.6 },
    croatian: { bulgarian: 19.7, czech: 18.1, polish: 9.5, slovak: 23.0, slovene: 43.7 },
    czech: { bulgarian: 13.4, croatian: 19.4, polish: 35.4, slovak: 92.7, slovene: 15.7 },
    polish: { bulgarian: 13.7, croatian: 14.4, czech: 26.6, slovak: 40.7, slovene: 13.4 },
    slovak: { bulgarian: 10.1, croatian: 25.9, czech: 95.0, polish: 50.7, slovene: 15.1 },
    slovene: { bulgarian: 18.0, croatian: 79.4, czech: 18.0, polish: 12.8, slovak: 18.8 },
};

/** The best share (0–1) of a speaker's language a listener understands through a related language they know, or null. */
export function relatedShare(listener: string[], speaker: string[]): { share: number; from: string; heard: string } | null {
    let best: { share: number; from: string; heard: string } | null = null;
    for (const l of listener) for (const s of speaker) {
        const v = CLOZE[l]?.[s];
        if (v != null && (!best || v / 100 > best.share)) best = { share: v / 100, from: l, heard: s };
    }
    return best;
}
