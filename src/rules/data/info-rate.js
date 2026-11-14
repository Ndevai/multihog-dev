// Each language's information density (bits per syllable) and its speakers' mean syllable rate reading aloud, from the data
// of Coupé, Oh, Dediu & Pellegrino 2019 (Sci Adv 5:eaaw2594; InfoRateData.csv in github.com/keruiduo/SupplMatInfoRate,
// commit 00798db, CC-BY 4.0): 17 languages, 10 speakers each, 15 texts read aloud. The rate is each speaker's syllables
// per second averaged over their texts, then over the language's speakers. Built outside the repository from that file
// (AGENTS.md); `names` are the language names a character's languages are written in (types.ts Person.languages).
export const INFO_RATE = {
    CAT: { names: ['catalan'], bits: 5.49, sylPerS: 7.07 },
    CMN: { names: ['mandarin', 'chinese', 'mandarin chinese'], bits: 6.96, sylPerS: 5.86 },
    DEU: { names: ['german'], bits: 6.08, sylPerS: 6.09 },
    ENG: { names: ['english'], bits: 7.09, sylPerS: 6.38 },
    EUS: { names: ['basque'], bits: 4.83, sylPerS: 7.54 },
    FIN: { names: ['finnish'], bits: 5.49, sylPerS: 7.17 },
    FRA: { names: ['french'], bits: 6.68, sylPerS: 6.88 },
    HUN: { names: ['hungarian'], bits: 5.9, sylPerS: 5.87 },
    ITA: { names: ['italian'], bits: 5.29, sylPerS: 7.07 },
    JPN: { names: ['japanese'], bits: 5.03, sylPerS: 8.03 },
    KOR: { names: ['korean'], bits: 5.56, sylPerS: 7.12 },
    SPA: { names: ['spanish', 'castilian'], bits: 5.43, sylPerS: 7.73 },
    SRP: { names: ['serbian'], bits: 5.47, sylPerS: 7.15 },
    THA: { names: ['thai'], bits: 7.19, sylPerS: 4.7 },
    TUR: { names: ['turkish'], bits: 5.34, sylPerS: 7.05 },
    VIE: { names: ['vietnamese'], bits: 8.02, sylPerS: 5.3 },
    YUE: { names: ['cantonese'], bits: 6.53, sylPerS: 5.57 },
};
