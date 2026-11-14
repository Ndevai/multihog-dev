# Causal voice: two prototypes compared by ear (docs/progress.md (133))

The player: a voice is computed from the body's causes, not chosen from recorded people or matched by age and sex labels.
Both builds take the same bodies (`bodies.json` from `voice-body.ts`: pitch, tract, pace, fold length and thickness, growth
share, puberty) and say the same line. Neither is in the extension yet; the player picks by ear.

- `build_a.py`: the movement of speech (rhythm, melody, articulation) of 16 EARS speakers' Pocket TTS copies of the line,
  each analysed by WORLD (Morise et al. 2016; pyworld), envelopes put on one tract length, aligned (DTW) and averaged; the
  body then sets the pitch level, the formant scale (tract length, measured on the averaged voice) and the pace.
- `build_b.py` with `vtl_child.py`: VocalTractLab 2.4.2 (Birkholz; vocaltractlab-cython 0.0.17, GPL-3.0) speaks eSpeak NG's
  phonemes and times at the body's pace; its reference speaker (JD3) is grown along VocalTractLab's growth curves to the
  body's growth state (the age at which an average-timed person has the body's share of adult height; a male's larynx and
  pharynx by his puberty's progress), every length then scaled so the neutral vowel's formant spacing equals the engine's
  tract; the glottis's rest length, thickness and f0 come from the engine's folds. One step per process: the API's close
  call crashes.
- `vocaltractlab-reference-shapes.patch`: two fixes to VocalTractLab's backend needed for an anatomy change through the API:
  the anatomy adaptation transformed shapes from an empty reference tract (now the loaded speaker), and the speaker writer
  wrote `<glottis_models` without its `>`. (Its writer also drops the tract parameters' `unit` attribute, which its reader
  needs; `vtl_child.py` puts them back.) Built with g++ from the sdist's sources and swapped into the installed package.
