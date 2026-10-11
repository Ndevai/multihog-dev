const H = (best, lo, hi, src) => ({ best, lo, hi, src });
export const HEARING = {
    HUMAN: H(-10, 31, 17600, 'Jackson et al. 1999, J Acoust Soc Am 106:3017'),
    DOG: H(-0.5, 67, 45000, 'Heffner 1983, Behav Neurosci 97:310: 60 dB range from the text; best = mean of four dogs at 8 kHz read from Fig. 3 (4, 1, −2, −5 dB)'),
    FOX: H(-15, 51, 48000, 'Malkemper et al. 2015, Hear Res 320:30'),
    CAT: H(-4, 55, 78000, 'Heffner & Heffner 1985, Hear Res 19:85: 60 dB limits from the text; best = mean of two cats at 8 kHz read from Fig. 2'),
    HORSE: H(7, 55, 33500, 'Heffner & Heffner 1983, Behav Neurosci 97:299 (lowest average threshold 7 dB at 2 kHz)'),
    COW: H(-11, 23, 35000, 'Heffner & Heffner 1983, Behav Neurosci 97:299 (lowest threshold −11 dB at 8 kHz)'),
    PIG: H(null, 42, 40500, 'Heffner & Heffner 1990, Hear Res 48:231'),
    GOAT: H(null, 78, 37000, 'Heffner & Heffner 1990, Hear Res 48:231'),
    SHEEP: H(null, 125, 42000, 'Kendrick 2008, The Welfare of Sheep, via Olczak et al. 2023'),
    ALPACA: H(-0.5, 40, 32800, 'Heffner et al. 2014, J Acoust Soc Am 135:778'),
    DEER: H(-3, 115, 54000, 'Heffner & Heffner 2010, J Acoust Soc Am 127:EL111 (whitetail)'),
    ELEPHANT: H(null, 17, 10500, 'Heffner & Heffner 1980, Science 208:518 (Asian elephant)'),
    MACAQUE_RHESUS: H(1, 28, 37000, 'Jackson et al. 1999 (Japanese macaque)'),
    FOXSQUIRREL: H(1, 113, 49000, 'Jackson et al. 1997, J Comp Psychol 111:100'),
    HEDGEHOG: H(21, 2000, 46000, 'Heffner et al. 2022, J Comp Physiol A 208:653 (African pygmy hedgehog)'),
    MOLE_DOG_NAKED: H(35, 65, 12800, 'Heffner & Heffner 1993, J Comp Neurol 331:418 (naked mole rat)'),
    CHINCHILLA: H(null, 50, 33000, 'Heffner & Heffner 1991, Hear Res 52:13'),
    BIRD_CHICKEN: H(2.6, 9.1, 7200, 'Hill et al. 2014, J Comp Physiol A 200:863'),
    BIRD_DUCK: H(12.5, 66, 7600, 'Hill 2017, J Comp Physiol A 203:929 (mallard)'),
    BIRD_PARAKEET: H(1.1, 77, 7600, 'Heffner et al. 2016, J Comp Physiol A 202:853 (budgerigar)'),
    BIRD_PEAFOWL_BLUE: H(null, 29, 7065, 'Heffner et al. 2020, J Comp Physiol A 206:899'),
    BIRD_GUINEAFOWL: H(null, 24.6, 6860, 'Heffner et al. 2024, J Comp Physiol A 210:65'),
    // Heffner & Heffner 2007, J Am Assoc Lab Anim Sci 46:11 (review): red-ear turtle 68–840 Hz, lowest about 40 dB SPL (for DF
    // pond turtles [ASSUMED]); bullfrog 100 Hz–2.5 kHz (for DF frogs and toads [ASSUMED]).
    POND_TURTLE: H(40, 68, 840, 'Heffner & Heffner 2007, JAALAS 46:11 (red-ear turtle)'),
    TOAD: H(null, 100, 2500, 'Heffner & Heffner 2007, JAALAS 46:11 (bullfrog)'),
    // Fay 1988 and Warfield 1973 via Strain, LSU "How well do dogs and other animals hear?" (no level stated)
    RABBIT: H(null, 360, 42000, 'Fay 1988 via LSU'),
    RAT: H(null, 200, 76000, 'Fay 1988 via LSU'),
    CAVY: H(null, 54, 50000, 'Fay 1988 via LSU (guinea pig)'),
    RACCOON: H(null, 100, 40000, 'Fay 1988 via LSU'),
    OPOSSUM: H(null, 500, 64000, 'Fay 1988 via LSU'),
    BAT: H(null, 2000, 110000, 'Fay 1988 via LSU'),
    BIRD_COCKATIEL: H(null, 250, 8000, 'Fay 1988 via LSU'),
    BIRD_OWL_BARN: H(null, 200, 12000, 'Fay 1988 via LSU (owl)'),
};
// Same species under another DF id.
for (const [id, from] of [['WOLF', 'DOG'], ['DINGO', 'DOG'], ['WILD_BOAR', 'PIG'], ['GREEN_TREE_FROG', 'TOAD'], ['TOAD_GIANT_CAVE', 'TOAD']])
    HEARING[id] = HEARING[from];
// Birds without an audiogram: median lowest threshold of 16 terrestrial species, 8.1 dB SPL (Dooling 1980, in Popper & Fay,
// Comparative Studies of Hearing in Vertebrates, via Rößler et al. 2024).
const BIRD = H(8.1, null, null, 'Dooling 1980 median of 16 species');
/** Hearing entry for a DF creature id; giant and animal-person forms use the base species. Unknown → human. */
export function hearingOf(id = 'HUMAN') {
    const base = String(id).toUpperCase().replace(/^GIANT_/, '').replace(/_MAN$/, '');
    return HEARING[base] ?? (base.startsWith('BIRD_') ? BIRD : null);
}
// Thresholds at 250, 500, 1000, 2000, 4000, 8000 Hz (dB SPL, free field), read from the published audiograms: dog, mean of four
// dogs (Heffner 1983, Fig. 3); cat, mean of two (Heffner & Heffner 1985, Fig. 2); horse, mean of three, and cattle, mean of two
// (Heffner & Heffner 1983, Figs. 2–3); reading error about ±3 dB. Human reference: ISO 389-7 free-field thresholds 11.4, 4.4,
// 2.4, −1.3, −5.4, 12.6 [as recalled].
const HUMAN_BANDS = [11.4, 4.4, 2.4, -1.3, -5.4, 12.6];
const BANDS = { DOG: [27.75, 19.9, 14, 8.75, 3.6, -0.5], CAT: [22, 8, 3, 1, 0.5, -4], HORSE: [28.7, 15, 10, 8.7, 18, 8],
    COW: [10, 6, -1, -4, -7, -10.5] };
for (const [id, from] of [['WOLF', 'DOG'], ['DINGO', 'DOG']])
    BANDS[id] = BANDS[from];
/** Per-octave threshold shift from human hearing (250–8000 Hz), dB: the species audiogram when known, else the flat shift. */
export function bandShift(id) {
    const base = String(id ?? 'HUMAN').toUpperCase().replace(/^GIANT_/, '').replace(/_MAN$/, '');
    const b = BANDS[base];
    return b ? b.map((t, i) => t - HUMAN_BANDS[i]) : new Array(6).fill(hearingShift(id));
}
/** Lowest-threshold shift from the human value, dB; 0 when unknown. */
export function hearingShift(id) {
    const h = hearingOf(id);
    return h?.best == null ? 0 : h.best - HEARING.HUMAN.best;
}
/** False when a tone of `khz` is outside the 60-dB range and no louder than 60 dB SPL; true otherwise (or unknown). */
export function inRange(id, db, khz) {
    const h = hearingOf(id) ?? HEARING.HUMAN;
    if (khz == null || h.lo == null || db > 60)
        return true;
    const hz = khz * 1000;
    return hz >= h.lo && hz <= (h.hi ?? Infinity);
}
