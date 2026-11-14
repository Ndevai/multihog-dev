# voices/

The natural voice (setting "Voices: natural") reads `averaged-person.bin` from this folder: the movement of speech of 16 EARS
speakers (Richter et al. 2024), averaged, which each character's voice is computed from (src/rules/averaged-person.ts). It is
derived from EARS, licensed CC BY-NC 4.0 (non-commercial use, with attribution), so it is not part of this repository
(`.gitignore`); it is made by `history/review-tests/causal-voice/avg_prompt.py` and handed over as a file. Put it here as
`voices/averaged-person.bin`. Without it the natural voice stays silent and a notice names the missing file.

The five `emotion-<family>.bin` files (anger, fear, happiness, sadness, tenderness) are the same 16 speakers' emotional free
speech, made the same way (`history/review-tests/causal-voice/build_emo.py`, `write_emo.py`), and kept out of the repository
for the same reason. With them here, a character's feeling colours their voice; without them, voices stay neutral.
