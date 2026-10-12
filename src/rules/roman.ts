// A word as it sounds, in Latin letters: one spelling per sound, so what was said and what was heard can be told apart on
// the page (gato/gado, sete/sede) without IPA. It shows sound, not how anyone of the period wrote it: writing kept older
// spellings (Romans wrote CAELVM whatever the speaker said). Letters from Latin alphabets that already write these sounds:
// š ž č ǰ (Americanist, Czech), þ ð (Icelandic), ŋ (Sami), ñ (Spanish), ć ś ź (Polish), ğ (Turkish), dotted letters for
// retroflexes (Indology); h after a consonant marks aspiration, y palatalization, w lip-rounding, ' a glottal stop or
// ejective. A middle dot separates two letters that would otherwise read as one sound (t·s, t·h). Long sounds are doubled;
// tone numbers stay as written (Chao digits). Lost on the way [ASSUMED for readability]: dental, retracted and syllabic
// marks, and the difference between ɑ/a, ɒ/o, ɪ/i, ʊ/u, ø/œ.
const MULTI: [string, string][] = [['t͡ʃ', 'č'], ['tʃ', 'č'], ['d͡ʒ', 'ǰ'], ['dʒ', 'ǰ'], ['t͡s', 'ts'], ['d͡z', 'dz'], ['tɕ', 'ć'], ['dʑ', 'dź'],
    ['ʈʂ', 'ṭṣ'], ['ɖʐ', 'ḍẓ'], ['e˞', 'er'], ['o˞', 'or'], ['ə˞', 'er'], ['ɜ˞', 'er'], ['ɛ˞', 'er'], ['æ˞', 'er']];
const ONE: Record<string, string> = {
    ʃ: 'š', ʒ: 'ž', θ: 'þ', ð: 'ð', x: 'x', ɣ: 'ğ', χ: 'ẋ', ʁ: 'ġ', ɸ: 'ƒ', β: 'ƀ', ç: 'ç', ʝ: 'ÿ', ħ: 'ḥ', ʕ: 'ʿ',
    ɦ: 'ḣ', j: 'y', ɥ: 'ẅ', ŋ: 'ŋ', ɲ: 'ñ', ɳ: 'ṇ', ɴ: 'ŋ', ɕ: 'ś', ʑ: 'ź', ʂ: 'ṣ', ʐ: 'ẓ', ʈ: 'ṭ', ɖ: 'ḍ', ɭ: 'ḷ', ɽ: 'ṛ',
    ɾ: 'r', r: 'rr', ɹ: 'r', ɻ: 'r', ʀ: 'r', ʎ: 'ľ', ɬ: 'ł', ɮ: 'ɮ', ʋ: 'v', c: 'ḱ', ɟ: 'ǵ', ɡ: 'g', ʔ: "'", ɓ: "'b", ɗ: "'d", ɠ: "'g",
    ɱ: 'm', ɺ: 'l', ʯ: 'ü', ȶ: 'ḱ',
    ɛ: 'è', ɔ: 'ò', ə: 'ë', ɜ: 'ë', ɘ: 'ë', ɨ: 'ï', ʉ: 'ű', y: 'ü', ʏ: 'ü', ø: 'ö', œ: 'ö', ɵ: 'ö', ɯ: 'ı', ɤ: 'ŏ', æ: 'ä', ʌ: 'â',
    ɐ: 'ă', ɑ: 'a', ɒ: 'o', ɪ: 'i', ʊ: 'u', ɿ: 'ï', ʅ: 'ï',
    ʰ: 'h', ʷ: 'w', ʲ: 'y', ˀ: "'", ʼ: "'", ʱ: 'h', ⁿ: 'n', ᵐ: 'm', ᵑ: 'ŋ', ˤ: 'ʿ',
};
const DROP = /[\u0320\u032A\u0329\u0325\u031E\u031F\u032F\u0324ˠ˞ˑ∼]/g;
const VOWELS = /[aeiouäëïöüőűıŏâăèòàáéíóúãẽĩõũ]$/i;
/** Whether letters a + b would read as one sound: a consonant then h, y or w; t·s, d·z; r·r. */
const joins = (a: string, b: string) => !!a && !!b && (!VOWELS.test(a) && /\p{L}$/u.test(a) && /^[hyw]/.test(b) || /t$/.test(a) && /^s/.test(b) || /d$/.test(a) && /^z/.test(b) || /r$/.test(a) && /^r/.test(b));

/** One IPA segment ("tʃʰ", "aː", "²¹") in letters. */
function segment(seg: string): string {
    let s = seg.normalize('NFD').replace(DROP, '').normalize('NFC'), out = '';
    while (s) {
        const m = MULTI.find(([k]) => s.startsWith(k));
        if (m) { out += m[1]; s = s.slice(m[0].length); continue; }
        const ch = [...s][0];
        out += ch === 'ː' ? (out.slice(-1) || '') : ONE[ch] ?? ch;
        s = s.slice(ch.length);
    }
    return out;
}

/** A word's IPA segments (space-separated, as the word lists write them) in letters. */
export function roman(segments: string): string {
    let out = '';
    for (const seg of segments.split(' ').filter(Boolean)) {
        const r = segment(seg);
        if (joins(out, r)) out += '·';
        out += r;
    }
    return out;
}
