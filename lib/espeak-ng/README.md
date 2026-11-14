# eSpeak NG (English only)

The speech synthesizer that speaks said words in the box (`src/rules/speech.ts`, setting "Voices: speech").

- Source: eSpeak NG (https://github.com/espeak-ng/espeak-ng), compiled to JavaScript and WebAssembly by Echogarden (npm `@echogarden/espeak-ng-emscripten` 0.3.5, https://github.com/echogarden-project/espeak-ng-emscripten).
- Licence: GNU GPL version 3 (`COPYING`), as this repository.
- Changed: the data file keeps only what English needs (111 of 459 files: `en_dict`, the phoneme tables, `intonations`, `lang/gmw/en` and `en-US`, the voice variants), 877,770 of 24,014,553 bytes; the file list in `espeak-ng.js`'s `loadPackage` call is rewritten to match. The script is otherwise unchanged. The trimming script lives outside the repository.
