// How much of a closely related language a listener understands without having learned it: spoken cloze test, share of
// missing words restored, by listeners with minimal exposure to the language heard (Gooskens, van Heuven, Golubović,
// Schüppert, Swarte & Voigt 2018, Int J Multilingualism 15:169, Tables 2–4, the figures in parentheses: 1,307 of 1,833
// listeners aged 18–33, mean exposure below 2.0 on six 1–5 scales and not taught the language at school; cells with more
// than 7 listeners). The paper reads these as inherited intelligibility at first confrontation, the case of a character
// meeting the language; listeners with exposure score higher (all listeners: Danish → Swedish 56.7 vs 43.8 here).
// Cells the paper leaves empty (every listener had exposure) are the all-listener score × the mean minimal ÷ all ratio of
// the same language heard by the other listeners [stated process]: Danish → German 47.8 × 0.35 = 16.7, Dutch → German
// 75.0 × 0.35 = 26.1, French → Portuguese 23.5 × 0.85 = 20.1, French → Romanian 11.0 × 0.94 = 10.4, French → Spanish
// 31.5 × 0.84 = 26.4, Portuguese → French 34.3 × 0.40 = 13.8, Romanian → French 47.1 × 0.40 = 18.9, Spanish → French
// 28.2 × 0.40 = 11.3, Slovak → Czech 95.0 × 0.98 = 93.3. Czech → Slovak 87.5 and the Slovak listeners' row are printed in
// Table 4 although §3.3 and §4.2 say those listeners were excluded; the printed values are used [RAW].
// Listener language first. Pairs with English as the language heard are left out (no listener lacked school English).
// A score of 40 % is the paper's tentative threshold for a conversation in two languages (Danes and Swedes manage it with
// effort at 43.8 / 56.0); its scores are conservative: speakers did not slow down for foreigners and listeners had no time
// to adapt (Gooskens et al. 2018, Conclusions) [not modelled].
const CLOZE: Record<string, Record<string, number>> = {
    danish: { dutch: 13.3, german: 16.7, swedish: 43.8 },
    dutch: { danish: 9.9, german: 26.1, swedish: 10.4 },
    english: { danish: 7.9, dutch: 9.6, german: 9.5, swedish: 8.7 },
    german: { danish: 12.5, dutch: 25.5, swedish: 10.0 },
    swedish: { danish: 56.0, dutch: 13.0, german: 13.1 },
    french: { italian: 22.9, portuguese: 20.1, romanian: 10.4, spanish: 26.4 },
    italian: { french: 18.6, portuguese: 23.4, romanian: 8.7, spanish: 56.0 },
    portuguese: { french: 13.8, italian: 44.1, romanian: 14.7, spanish: 62.0 },
    romanian: { french: 18.9, italian: 47.2, portuguese: 20.7, spanish: 46.6 },
    spanish: { french: 11.3, italian: 38.2, portuguese: 35.7, romanian: 13.7 },
    bulgarian: { croatian: 29.2, czech: 10.8, polish: 7.1, slovak: 16.0, slovene: 20.2 },
    croatian: { bulgarian: 19.7, czech: 18.1, polish: 9.5, slovak: 23.0, slovene: 41.3 },
    czech: { bulgarian: 13.4, croatian: 19.9, polish: 34.3, slovak: 87.5, slovene: 16.7 },
    polish: { bulgarian: 13.7, croatian: 14.6, czech: 24.0, slovak: 40.6, slovene: 13.4 },
    slovak: { bulgarian: 10.1, croatian: 24.5, czech: 93.3, polish: 48.7, slovene: 16.0 },
    slovene: { bulgarian: 18.6, croatian: 71.8, czech: 18.1, polish: 12.6, slovak: 18.8 },
};

// Brazilian Portuguese (scene in Brazil): no measured scores. Shifted from the European Portuguese cells by the slope of
// the minimal-exposure Romance scores on phonetic distance (Levenshtein, 97 Swadesh concepts transcribed by rule in
// Peninsular Spanish, European and São Paulo Portuguese, Italian, French and Romanian, docs/data/romance_swadesh_ipa.tsv;
// slope −119 points per unit distance, mean of the fits over 14 and over 11 cells without Romanian listeners, r = −0.57 /
// −0.62) times the change in distance: Spanish–Brazilian 0.507 vs Spanish–European 0.595 → +10.5 both ways [stated
// process; the transcriptions are the model's own, by rule; Portuguese nasal vowels before a stop keep the short nasal
// consonant, grande [ˈgɾɐ̃ndɨ]]. Check: the line alone gives Spanish → European 38.2 / 35.9 vs 35.7 measured.
const BRAZIL: Record<string, Record<string, number>> = {
    spanish: { portuguese: 46.2 }, italian: { portuguese: 27.4 }, romanian: { portuguese: 21.0 }, french: { portuguese: 18.8 },
    portuguese: { spanish: 72.5, italian: 48.1, romanian: 15.0, french: 12.5 },
};

/** The best share (0–1) of a speaker's language a listener understands through a related language they know, or null. */
export function relatedShare(listener: string[], speaker: string[], brazil = false): { share: number; from: string; heard: string } | null {
    let best: { share: number; from: string; heard: string } | null = null;
    for (const l of listener) for (const s of speaker) {
        const v = (brazil ? BRAZIL[l]?.[s] : undefined) ?? CLOZE[l]?.[s];
        if (v != null && (!best || v / 100 > best.share)) best = { share: v / 100, from: l, heard: s };
    }
    return best;
}
