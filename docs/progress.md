# Progress log

Newest first. Each entry: date, model, what changed (plain words), what was checked, what is next.

## 2026-11-13 (145), Claude
- The player asked for ideas. Six drawn; the player picked all six. Built five; the sixth (the chance before sending) needs one model call per check, and the player has not chosen when it runs.
- Changed: new `views.ts`; `knowledge.ts` recallStrength; `index.ts` the sheet (Story button: Memory, Map, Time; a tap on the clock: Time; a tap on a name tag: the person's card), the picture's feeling; `style.css` the sheet's parts and the picture's glows; R32's slice narrowed to its own section; README; docs.
- Checked: tsc 5.6.3, no errors; every suite with 0 misses (ui 103 with R47 new; sequences 300 chats, 0 failing); negative controls NB17–NB19 caught; the sheet drawn from the module's output.
- Next: the chance before sending, once the player picks tap or pause; the player's phone.

## 2026-11-13 (144), Claude
- The player's idea: a knob for how much to a T the story follows their actions. Picked from drawn choices: faithfulness; by the message box, per line, back to 1.0; reaching the reading too; five stops (0, 0.5, 1.0, 1.5, 2.0).
- Changed: new `faith.ts` (the stops, the narrator's line, the check's kinds, the rewrite's note); `ask.ts` decide takes the stop (below 1.0 the likeliest taken, above 1.0 asked); `question-pass.ts` passes the line's stop; `rules-audit.ts` the FAITH flag with added_act, changed_words, retold_line; `index.ts` the knob (tap, drag, wheel, keys; a slider), the line keeps its stop, its mark after the name, the narrator's [THE PLAYER'S LINE]; `style.css` the knob and the mark; README; docs.
- Checked: tsc 5.6.3, no errors; every suite with 0 misses (route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 101 with R46 new, music 9, voice-body 15, growth 3; sequences 300 chats, 0 failing); the prompt audit's list unchanged; negative controls NB14–NB16 caught; the knob drawn in the message box at 1.0, 1.5 and 0.
- Next: the player's phone; the rule check's flags on real replies at 1.0 (it now flags acts the narrator adds for the player's character by default).

## 2026-11-13 (143), Claude
- The player picked all four from a before/after sheet: bigger tap areas, high-contrast mode, smaller fonts, a tidy-up.
- Changed: `style.css` tap areas of 44 px (the note's line by padding a negative margin gives back; linked words and toolbar words by an invisible layer; the note's taken reading clipped across only, so its links' areas reach past it); a forced-colours block (the box's border, the tag and key words in the system's highlight colours, borders for the badge, the card and the path); the ten faces as WOFF2 (432 → 336 KB); the pitch strokes' masks unprefixed (1.2 KB less); the accent and its deep shade named once on body, read by the card and the path panel; `docs/third-party.md`.
- Checked: hit-tested in Chromium at 412 px: the note's line 368 × 44 px, a tap 12 px above a linked word lands on it, 9 px above a toolbar word on it, 8 px below on the message box; the note's "…" kept; ui 99 of 99; negative controls on style.css and NB1–NB13: 33 of 33 caught.
- Next: the player's phone.

## 2026-11-13 (142), Claude
- The player's idea: shoot a word and get why it is believed. Defined with them over three rounds of drawn choices: the word's path, each step a relation that exists, through the player's character; the numbers folded behind; plain words in front (the player: "keep complex language in another area"; "positive semantics: build a path on what exists").
- Changed: new `why.ts` (pathOf from key words with their calls, said words, facts with their sources, the narrator's words with the clock); `index.ts` the selection draws the path (showWhy, drawWhy), the first tap closes it, key words keep their tool; `style.css` #rules-why; README; docs.
- Checked: tsc 5.6.3, no errors; every suite with 0 misses (route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 99, music 9, voice-body 15, growth 3; sequences 300 chats, 0 failing); negative controls NB1–NB13 13 of 13 caught; ui's R45 new ( six paths: heard with its measures and draw, told, a fact told by the innkeeper with when, the narrator's words with the clock, a fact only Tom holds staying off Mara's path); the panel drawn in Chromium from the module's output; the card's shadow moved from a filter to a layer, which R32 requires.
- Next: the player's phone (a long press selects a word natively; the path should open); record inferences' steps and the hearing's chance so the path can show them.

## 2026-11-13 (141), Claude
- The player asked for the choices as questions with their differences drawn; picked, from images: the tag set smaller down to the print-size floor, then wrapped upward (a mix of two options); key words in gold letters in the night box; holding a word to read its explanation in the menu line, with a one-time hint; the card's name on a tilted white label under a hard shadow (of four variants drawn after "a better design than all of these").
- Changed: `style.css` the box fits a short screen (the chat a size container; the night badge on one line at 520 px or less); the tag's accent #d93167, its padding in em; the ink #ff79a3 for the pressed menu word and the ▼; the night badge keeps its look on the dark page; key words gold letters in the night box; the menu line's explanation; the card redrawn; the night look's sizes scale up with SillyTavern's font; its overridden rules removed. `index.ts` fitTag, fitCardName, showExplain, hintHold, the hold on pointer events; `box.ts` tagFloorPx, explainParts. README; habits2.py's header (25 dB, as its code).
- Checked: drawn in Chromium with SillyTavern's stylesheets (3 screen sizes, 3 to 4 name lengths, box and card, both page colours, font scale 1 and 1.4): the dead rules' removal identical in 24 of 24 renders; sideways the tag and first line in view (before: the top 114 px cut); the ink 4.58:1 (before 3.86:1); tsc 5.6.3 compiles with no error and emits only index.js and box.js anew; R36 and R40–R44's CSS and source conditions and NB1–NB10 evaluated against the files; the suites and controls run in (142). Not run: the extension in SillyTavern, a phone.
- Next: the player's phone: the hold (does the device's text selection stay away?), the sideways box, a long name, the card.

## 2026-11-13 (140), Claude
- Changed: each person's speaking habits (melody range, pauses, breathiness) drawn once from the spread measured between 96 EARS speakers on two minutes of free speech each, applied in the reshape; BodySize draws them, the voice draws the same from the salt where never made.
- Checked: voice-body 15 (V14 new); negative controls HB1–HB3; all suites.
- Next: the player's ear on how distinct characters now sound.

## 2026-11-13 (139), Claude
- The player: go with emotion next; they will not test on Termux for now.
- Changed: the natural voice carries feelings: `averaged-person.ts` (emotion files with each frame's duration; bodyRecording blends neutral toward a family by the strength), `emotion.ts` VOCAL_FAMILY (the 22 OCC types in Juslin & Laukka's five) and voiceFeelingTouched (registered), Appraise keeps each feeling's strength, `index.ts` feelingOf (a voice mark's feeling first, else the speaker's newest) and the five files loaded from voices/, `voice-worker.ts` the families; five files made here and handed over (history/review-tests/causal-voice: fetch_emo.py with zipranges.py, build_emo.py, write_emo.py).
- Checked: all suites 0 misses (voice-body 14, V13 new); negative controls EM1–EM6 caught, AP2 and AP5 re-pointed and caught; every control's pattern found (713); Pocket TTS keeps copied emotions (two speakers, 15 emotions: pitch shifts and brightness follow the recordings'); the five families against Juslin & Laukka's cues (anger, happiness, fear high; sadness, tenderness narrow and slow; sadness not lower, fear and happiness not faster), before and after the copy; the real extension: angry Tom +8.6 semitones, +6.1 dB above 1 kHz, typing within 18 ms of the sound; a sound file of the woman in all six.
- Not checked: the player's ear; a phone.
- Next: the player's ear on the feelings; then each person's own habits (melody range, pauses) drawn from measured spreads.

## 2026-11-12 (138), Claude
- The player chose: the averaged person made here from EARS and handed over as a file, kept out of the repository.
- Changed: the natural voice is computed from the body: new `averaged-person.ts` (the file's reader; a body's recording: the averaged movement with the body's pitch, tract and pace), new `world-vocoder.ts` (WORLD's synthesis in TypeScript), `pocket.ts` bodyTarget (free speech's scale, speechRegister 1.16 registered), `voice-worker.ts` (the averaged person; a body's voice made and encoded in the worker), `index.ts` (the file from voices/, one encoding per body kept, English's pace where no language is set); the EARS catalogue and the nearest-speaker choice removed; `voices/README.md`, `.gitignore`.
- Checked: all suites 0 misses (voice-body 13, V10 rewritten); negative controls AP1–AP6, WV1 and the 14 kept voice controls caught (PK5, PK6, PK9, PK10 retired with their code); the port against pyworld (0.999999); reshaped recordings within 0.2 % in pitch and 0.3 cm in tract; one-time drift correction tried and dropped (it removes less than each line's own intonation); the real extension in the stand-in: Tom's line heard 8.1 s after it was reached the first time, typing within 30 ms of the sound; a sound file of five bodies the extension's way.
- Not checked: the time a phone takes to reshape and encode a body (0.5–0.8 s and 5 s on this desktop) and to make a line.
- Next: the player's ear and their phone; breath and roughness from the folds' closure; children's way of speaking needs children's free speech.

## 2026-11-12 (137), Claude
- The player, by ear, on the ages: Tom at the raised register a young-to-adult man; the girl of 11 a young woman; the girl of 8 a child; the girl of 5 younger than her. The build makes children where the body differs enough; a girl of 11 is near a woman by size, as measured.
- Tried, for the phone: the averaged person made once as a 9.8 s recording (avg_prompt.py), reshaped per body (WORLD) and copied by Pocket TTS (prompt_copy.py). The reshaped recordings hit pitch exactly and tract within 0.3 cm (Praat, formant ceiling scaled to the body); the copies drift: pitch +5 to +11 %, tract −1.7 cm (Tom) to 0 (girl of 5), speech rate 3.4 against 4.1–4.4. So a line needs the body's values set again after the copy (WORLD in the browser).
- Next: the player's choice of where the averaged person comes from; WORLD compiled for the browser.

## 2026-11-12 (136), Claude
- The player, by ear, on the probes: the woman at the raised register a more natural (or older) woman; the girl of 11 at it a more energetic young woman; with breath a young woman with a puff of air. Neither register nor breath makes a child of 11.
- Changed: `voice-body.ts` childRate: children slower by Mahr et al.'s medians, the adult age trend only from 16.
- Checked: all suites 0 misses (voice-body 13, V12 new); negative controls VB19, VB20 caught; a probe of Tom and girls of 11, 8 and 5 at the raised register (222, 241, 271 Hz; tracts 15.3, 14.0, 12.5 cm on the copies' scale; the 8 and 5 slower) sent: if the 8 and 5 sound like children, the build makes children where the body differs enough, and a girl of 11 is near a woman by size (as measured: +1.4 semitones, formants about 10 % higher) and set apart by her way of speaking, which the adult-averaged movement does not carry.
- Next: the player's ear on the ages.

## 2026-11-12 (135), Claude
- The player, by ear, on the rebuilt A: Tom a common adult man, the woman a common adult woman, the girl of 14 the same as her, the girl of 11 a young woman of 17-19.
- Found: the girl of 11 already differs from the woman as measured children do: pitch +1.6 semitones (measured connected speech, girls 10-12: 228-231 Hz, Bennett 1983, Lee et al. 1999; adult women about 200: +1.4) and tract 9 % shorter. So the cue is elsewhere. Candidates: the register (the free-speech scale follows EARS's relaxed monologues, women 172 Hz, about 15 % under the connected speech other studies measure, which puts the girl at 189 Hz, inside a woman's range); breath (a posterior glottal gap in 85 % of girls and 75 % of women, Patel et al. 2012); the tract's proportions (VocalTractLab's grown anatomy gives no usable answer: its formant peaks mis-number and its /a/ lowers F1 for the child, against measured children); the movement (adult).
- Changed: `history/review-tests/causal-voice/build_a.py` takes a register factor and a breath probe; `props.py` (the proportions attempt, kept for the record).
- Checked: probe clips (woman and girl at the EARS register and at ×1.16; the girl with breath, and with both) sent for the player's ear.
- Next: the player's ear on the probes decides which cause goes into the voice.

## 2026-11-12 (134), Claude
- The player, by ear: A's Tom understandable; B's barely English, worse the smaller the body; A's woman "fast and worried", the girls of 14 and 11 like her, hurried.
- Found: B (VocalTractLab with a German speaker's shapes) is set aside: unintelligible. A was fast because the test bodies other than Tom had no language and took the 17-language mean rate (5.1–5.2 syllables/s against English's 4.4; the line is English); its melody was flat because averaging 16 aligned contours narrowed them (5–95 % range 4.1 semitones against the takes' own 6.6, by Praat) and left wobble. Children's articulation rate is adult-like by about 10 years (Mahr, Rathouz & Hustad 2021, 570 children), so pace does not set a girl of 11 apart; the engine's adult age slope extended below 16 is wrong for younger children (next).
- Changed: `history/review-tests/causal-voice/build_a.py`: the melody bridged over unvoiced gaps, smoothed over 80 ms and scaled to the takes' median range (Praat); the bodies speak English's rate.
- Checked: speech rate 4.29–4.55 syllables/s against the bodies' 4.18–4.43; melody 5.8 semitones; pitch within 1.2 % of each target; a sound file of the four bodies.
- Next: the player's ear on the rebuilt A; the rate of the language spoken (the line's) rather than the person's first language; children under 10 slower (Mahr et al.'s growth curves).

## 2026-11-12 (133), Claude
- The player: picking the nearest of 95 recorded people, with age matched as a label, is a lookup; age and sex are labels for states of a body, and a voice is what the body's causes make, any combination a voice. They asked for both a neural build driven by the body and a physics build, compared by ear.
- Changed: `voice-body.ts` speakingFactsOf: a child of unset height is heard at their age's grown height (was the adult's); two prototypes in `history/review-tests/causal-voice/` (A: speech movement averaged over 16 speakers, the body's pitch, tract and pace imposed through WORLD; B: VocalTractLab with the body's grown, scaled tract and its folds, eSpeak's phonemes at the body's pace), and a patch to VocalTractLab's backend (its anatomy change emptied every vowel and consonant shape; its speaker writer broke its own file).
- Checked: all suites 0 misses (voice-body 12, V11 new); negative control VB18 caught; A's pitch within 1.4 % and tract within 0.4 cm of each body's target; B's tract equal to the engine's (17.90, 14.41, 15.60, 15.80 cm) and pitch within 2.4 %; a sound file of four bodies in both builds.
- Next: the player's ear decides which build goes into the extension (A: the averaging and WORLD in the browser; B: VocalTractLab compiled to WebAssembly); then breath and roughness from the folds' closure, and the movement layer.

## 2026-11-12 (132), Claude
- The player: Piper's voice still did not sound like people in real life. Six clips compared: the two where Pocket TTS copied people talking freely (EARS, Expresso) were "by far" the closest. SillyTavern runs in Termux on their phone, so the voice runs in the browser.
- Changed: the natural voice is now Pocket TTS (Kyutai; the ONNX export by KevinAHM, 165 MB, CC BY 4.0) copying the EARS speaker nearest each body's voice: new `pocket.ts` (the model's own tokenizer in TypeScript, text preparation and split, WAV reading, resampling, the memory-length patch, the choice of speaker on the copies' scale), `data/ears-voices.ts` (95 speakers, each copy's pitch, tract and pace measured in Praat), `data/pocket-tokenizer.ts`; `voice-worker.ts` rewritten (the export's loop: encoder, language model with a memory sized to the line, flow, decoder); `index.ts` (networks and each recording's encoding kept in IndexedDB; recordings fetched from Kyutai's copy of EARS); Piper's catalogue and code removed; earsAgeStep registered; the SillyTavern stand-in (st-chat.mjs) routes outside URLs, takes settings and records the voice heard.
- Found: free speech is lower than the isolated words the engine's voice is fitted to (copies' medians 105.4 and 171.5 Hz against 130.9 and 220.1), so computed voices are put on the copies' scale by the two sexes' means; within each sex, the EARS speakers' height tells little of their voice (tract r 0.33 men, 0.0 women; pitch r −0.13 and −0.23). A first pitch tracker made octave errors on free speech (men at 400–450 Hz); Praat's two-pass pitch replaced it. The export fixes the language model's memory at 1,000 frames (49 MB passed each step); 256 gives the same output to the last bit, and the length is freed by a 3-byte patch of the downloaded file.
- Checked: all suites 0 misses (voice-body 11, V10 rewritten); negative controls NV7–NV11, PK1–PK13 caught (NV9 first not caught: V10 had lost its scaleTimes check; restored); the tokenizer's ids equal the original's on 5,004 sentences; the browser's output against the export's Python loop at temperature 0: same length, spectra within 4.0 dB (Python 1 thread against 4: 6.1 dB); Chromium, one desktop thread: ready in 7.6 s, a voice copied in 5.0 s, a 3 s line in 3.5 s; the real extension in the stand-in: Tom's first line heard 8.9 s after it was reached, its typing ending 36 ms from the sound's end; a sound file of four characters for the player.
- Not checked: the speed on the player's phone (one thread made a line in 1.2× its length on this desktop CPU; a phone's single thread is slower, so lines may lag behind the reading); Hugging Face and jsDelivr from the player's network.
- Next: the player's ear and their phone's speed; then the engine's feelings choosing EARS's emotional recordings (22 emotions per speaker in the full corpus), and accents for characters whose first language is not English.

## 2026-11-12 (131), Claude
- The player: the robotic voice sounds like the Trollge videos; they picked a neural voice model.
- Changed: new `data/piper-voices.ts` (901 recorded voices of Piper's LibriTTS-R model, each one's pitch, tract and pace measured here); `speech.ts` nearestVoice, lengthScaleFor (naturalPaceLimit registered), clausesOf, piperIds, scaleTimes; new `voice-worker.ts` (the model in a worker); `index.ts` the natural voice (download once into IndexedDB, made ahead per message, a line waits for its audio, a tap shows it), the setting "Voices": natural (default), robotic (eSpeak, was "speech"), blips, off; `settings.html`.
- Found and fixed before it shipped: the catalogue's pace counted 29 syllables in its passage (box.ts syllables reads "wrapped" as two); the passage has 28, so the rates were rescaled by 28/29. The Cache API is missing on plain-http pages (SillyTavern on a home network), so the model goes to IndexedDB.
- Checked: all suites 0 misses (voice-body 11, V10 new); negative controls NV1–NV11 caught, SP1–SP4 again; Chromium on a plain-http page with the two outside URLs answered from local copies: model stored and read back (0.17 s), worker ready 2.7 s, Tom's 3.3 s line in 0.97 s and a girl's 2.5 s line in 0.58 s at 61–62 frames a second; their pitch measured 166 and 227 Hz (Tom's line opens with a command: the same voice gives 139–141 Hz on statements); a sound file for the player.
- Not checked: SillyTavern on the player's phone (the time a phone takes to make a line is unmeasured); Hugging Face and jsDelivr reached from the player's network.
- Next: the player's ear; box.ts syllables counts a silent "-ed" ("wrapped") as a syllable, which slows typing on those words; children's voices past 232 Hz need a model with child speakers.

## 2026-11-12 (130), Claude
- The player: is a full voice better than blips; then "do it", and they let eSpeak NG run here (option 1) after this session's safety check stopped its first run as outside code.
- Changed: `lib/espeak-ng/` (eSpeak NG compiled for the browser, GPL-3.0, trimmed to English: 1.7 MB of 25 MB); new `speech.ts` (each speaker's eSpeak voice from their pitch, tract and rate; the voice file; letter times from word events); `index.ts` speakUnit, the setting "Voices" (speech, blips, off), blips now on that setting; `voice-body.ts` speakingFactsOf; `settings.html`.
- Checked: eSpeak's own pitch, formants and rate measured in Node; in Chromium it loads in 0.14 s and speaks a 4.6 s line in 0.19 s; voice-body 10 (V9 new); negative controls BL1–BL4, SP1–SP4 caught; a sound file of Tom and Lena for the player.
- Not checked: SillyTavern on the player's phone; non-English lines (the trimmed data speaks English only).
- Next: the player's ear; then the muscle settings per sound for the deeper voice.

## 2026-11-12 (129), Claude
- The player, asked what next, picked voice blips: the text sounds as it types, as visual novels beep, here in each speaker's own voice.
- Changed: new `blips.ts` (blipPlan: one tone per syllable over its word's appearing; harmonicAmps: 1 ÷ k × the tract's gain); `voice-body.ts` voiceHarmonics (the resting pitch and the person's own tract response, kept per voice); `index.ts` playBlips (WebAudio, one periodic wave per voice, ramps, the music's ♪ and volume), stopped with the typing.
- Checked: all suites 0 misses (voice-body 9, V8 new); negative controls BL1–BL4 caught; a sound file of Tom (136 Hz) and a girl of 11 (245 Hz) for the player.
- Not checked: the sound in a running SillyTavern on the player's phone.
- Next: the player's ear.

## 2026-11-12 (128), Claude
- The player: the first-meeting card only for characters with a card they made, else every irrelevant person gets one; the panel: both (see-through and corner brackets).
- Changed: `index.ts` hasCard (the name among SillyTavern's characters); `style.css` the night panel see-through (74 % to 82 %: the least opacity at which light sky blue keeps 4.5:1 over a white background; the trial's 55 % gave 2.4:1) inside white corner brackets.
- Checked: ui 95; negative controls BX9, BX10, BX13, BX15 caught; Chromium on a scene and on white.
- Next: the player's critique on their phone.

## 2026-11-12 (127), Claude
- The player wanted inspiration from existing visual novels. Fetched: text boxes from twelve games' Let's Plays (Let's Play Archive), laid out with what makes each distinct. Picked: the first-meeting card (Danganronpa), the date badge in a corner (Hatoful Boyfriend), the menu inside the box (Doki Doki Literature Club); torn between a see-through panel and corner brackets (drawn side by side, with both, for their pick); whole-screen narration only if the model could not invoke it at will (left open).
- Changed: `box.ts` cardRole, sceneBadge; `index.ts` showCard, hideCard, the badge's three parts, the card before a character's first line; `rules-tools.ts` NewCharacter keeps the person's trade (occupation); `types.ts`; `style.css` the card, the badge, the menu (layer 31: SillyTavern's chat at 30 took its taps in the first render).
- Checked: ui 94 (R43 new); negative controls BX1–BX5, BX7–BX11, BX13, BX14 caught; Chromium renders of the card, the badge and menu, narration, and the three panels.
- Next: the player's pick of panel.

## 2026-11-11 (126), Claude
- The player: they meant the box was ugly, not lifeless in its timing; many visual novels have a better interface. Three trial looks were drawn on a phone with real CSS (night, paper, quiet); they picked night: "a mile better; the pink name tag fits".
- Changed: setting "The box's look" (night by default, or page); `style.css` the night look (dark framed panel, angled pink tag, the dark page's colours inside, menu and pencil left to the log, pill buttons, ▼ once the stretch has appeared, scene line and count on dark pills); `index.ts` the body class, the dark tone while it shows, a typing class for the ▼; `settings.html`; `st-chat.mjs` takes RULES_EXTRA_CSS and RULES_BODY_CLASS for trial looks.
- Checked: all suites 0 misses (ui 92, R42 new); negative controls BX7–BX10 caught; Chromium at 412 px on a scene, on narration, on a plain white background; contrast white 14.8:1, light sky blue 8.6:1, tag 4.3:1 at large type.
- Kept from (125): the pauses in speech, a misreading of the player's "no life"; one line in box.ts takes them out if the player wants.
- Next: the player's critique of the night look on their phone.

## 2026-11-11 (125), Claude
- The player: the box has no life, none of a human's idiosyncrasies; text size is beside that point. Found: said words appeared at an even rate with no stop at any punctuation, every speaker a metronome at their own speed.
- Changed: `box.ts` pauseMs; revealTimes stops 500 ms after a sentence and 167 ms after a clause mark in speech, longer for a slower speaker (Campione & Véronis 2002; Strangert 1991).
- Checked: all suites 0 misses (ui 90); negative control BX6 caught; a line drawn every 0.4 s before and after (box-timing.png): 3.2 s even, 4.4 s with the stops.
- Next: lengthening before a boundary, stress, the spread of pause lengths; then the person's own pausing.

## 2026-11-11 (124), Claude
- The player, after two visual-novel pages and a comparison of them: the replies were passive; they want a better system than the one they have. Done: the box measured as it is on a phone (Chromium, 412 CSS px) and what failed fixed, each fix from a measured cause, not from the pages.
- Found: in box mode the box filled the bottom third and the rest was blank; its plate carried the device's send time, no time in the story; the type was SillyTavern's x-height, 8.2 CSS px, which on a phone (0.160 mm a CSS pixel) reaches the critical print size of 0.2° (Legge & Bigelow 2011) only out to 38 cm, while people hold phones as far as 58 cm to read a message (Bababekova et al. 2011); the box's scroll could pass to the page behind it.
- Changed: `box.ts` boxFontPx (the box's type: the page's, or 27.5 px, the x-height of 0.2° at 58 cm) and boxLinesAt (its lines grow with the type, 4 → 6, so a box holds the letters it held); sceneLine (place · story time · light, from the engine); `index.ts` sets both and draws the scene line above the chat; `rules-tools.ts` scenePlace; `style.css` the box's type, the send time hidden in the box, the scroll kept in the box, and the box's height capped at 60 % on a short screen; `st-chat.mjs` takes RULES_STATE.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 90 (R41 new), music 9, voice-body 8, growth 3, sequences 300, all 0 misses. Negative controls BX1–BX5 caught. Chromium: "Recife · Sunday 15 July 1990, 18:20 · nautical twilight" over a box of 27.5 px type in 6 lines, light and dark. Constants list regenerated; prompt audit 12 lines, as before.
- Not checked: a running SillyTavern on the player's phone; a phone held sideways (the harness keeps a 560 px chat).
- Next: as (122).

## 2026-11-11 (123), Claude
- The player, on the question whether to fit "teenage voices": there is no teenager, only a label creating expectations; it has several sources, and a text gives one value (an age) that approaches it probabilistically; work on the implicatures. Read: an age is evidence about hidden causes (growth, puberty timing, hormones); keep those causes per person, draw them once, compute height and voice forward, with no gate at 18.
- Changed: new `growth.ts` (Preece & Baines 1978 Model 1 as the share of adult height by age, each person's growth timing timingZ moving the curve's centre θ by its SD; WHO's height shape under 5; the age of peak height velocity; a boy's voice change across his own window around it) and `data/who-growth.ts` (WHO height and BMI for age, L, M, S, 0–19, from the AGD package, built outside the repo); `body-size.ts` and BodySize give a person under 19 their adult height's share at their age and the WHO BMI at their z (BodySize no longer says "adult"); `voice-sound.ts`: the tract grows as the share of adult height to the power 0.842 (boys) or 0.664 (girls) (Vorperian et al. 2011), a girl's folds and a boy's before puberty in proportion to height with a woman's tissue, a boy's moving to a man's across his voice change, the lungs' push scaled to the airways' size; voices from age 5.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88, music 9, voice-body 8, growth 3 (new), sequences 300, all 0 misses (60 s). The growth curve's peak velocity at 14.19 and 11.90 years (the children's own: 14.17 and 11.87). Nothing fitted to children's voices: boys 264 Hz at 8 and 250 at 10 (measured 259 and 247, Vuorenkoski et al. 1978), 243 at 11 and girls 245 (Hillenbrand et al.'s children aged 10–12: 236 and 238), the boy's pitch falling 237 → 146 Hz from 12 to 15 (Lee et al. 1999: 12–15), girls 222 at 15; the boy's tract at 11 14.78 cm (measured 14.77). Adults as before; Tom 136 Hz (137: the lungs now follow his airways' size). Negative controls VB1–VB17 and GR1–GR8 caught (VB7 and VB15 re-pointed at the new code); every control's pattern still found (661). Constants list regenerated; prompt audit 12 lines, as before.
- Not checked: a running SillyTavern; voices under 5 (no measured voices there to check against); the hormone layer (testis volume, testosterone) under the voice change's window, which stays an assumption placed on Lee et al.'s ages.
- Next: as (122): muscle targets per sound; the growth timing can then also come from the hormones.

## 2026-11-11 (122), Claude
- The player, continuing (121) from another session's transcript (its files stayed in its container; this session rebuilt its findings): asked four questions, they picked the habitual stretch as the folds' pitch dial, adding that a feeling's name is a one-to-many label over biology (hormones, transmitters), to be derived after that layer; the rest was left to this session, minding the question on deriving from the underlying system. Chosen: a speaker whose folds vibrate unsteadily speaks at the nearest steady stretch, lower first (people correct their pitch by ear); next, the muscle targets per sound, then the body-state layer, then growth; adults only until growth is built (puberty is testosterone lengthening the folds).
- Changed: `artsynth.ts` (Praat's articulatory synthesizer, ported line by line from commit 6a9874e; a run that hands the page back every 100 samples; flows watched); new `voice-sound.ts` (the speaker from the body: tract size from the sex's measured tract and the draw tractZ, fold length from the cadaver equations at the mean height with a fitted height slope, the habitual stretch Q from the draw stretchZ; formants from the run's equations as a chain of two-ports, with the walls and the lips' radiation; pitch from a run at 637 Pa, steady by MDVP's jitter and shimmer thresholds, the search for a steady stretch); `voice-body.ts` takes its tract, formants, folds and pitch from it (the string law and the tract-per-height ratios are gone); BodySize draws stretchZ and tractZ from streams of their own; the interceptor waits for the voices' runs, which start when the chat opens.
- Fitted: tract size 1.1706 (men), 1.0396 (women); fold slope 0.0057 and 0.0041 per cm; stretch Q 1.3826 and 1.4596, spreads 0.15 and 0.2714; lungs 0.1046 and 0.1123 (40 stratified people per sex, scripts outside the repo).
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88, music 9, voice-body 7, sequences 300, all 0 misses (56 s). Praat's female speaker opens her folds at 226 Hz (Praat itself: 226.6 Hz, built and run in the other session; building Praat here was refused by this session's safety check, so no sample-by-sample comparison was redone); the chain's transfer within 3.7 % of the run's at the median harmonic; the mean man 485 / 1278 / 2469 Hz, the mean woman 542 / 1432 / 2776 Hz; Tom, 180 cm, 137 Hz in a 1.9 s run. Women: mean f0 219.7 Hz (measured 220.1), SD of ln f0 0.096 (0.093). Men: 130.5 Hz (130.9), SD 0.184 (0.152). Negative controls VB1–VB17 caught. Constants list regenerated; prompt audit 12 lines, as before.
- Found, for the player: at ordinary pressure the run's male folds vibrate unsteadily between 103 and 130 Hz, where most men speak, so simulated men sit at 102 Hz (14 of 40) or at 131 Hz and above; the same folds are steady in a tract 0.8 or 1.4 times the size, so the tract's loading of the folds (near 4 f0 = F1 of the one neutral vowel held) causes it. Women's steady band ends at 244 Hz (6 of 40 there; measured women reach about 257 Hz at the 95th percentile).
- Not checked: a running SillyTavern (a man in the unsteady band takes up to 8 runs, about 20 s in Node, in the background).
- Next: muscle targets per sound (docs/superset-models.md §6.1), so the resting pitch is measured over the vowels people say, as Hillenbrand's was, and each line's timing follows.

## 2026-11-11 (121), Claude
- The player: the questions on genes and on physics asked for the deeper layer, and the replies explained why the shallow one was used. Their aim: describe each thing by its generator (the fewest causes at the deepest layer that can be computed) and compute everything observable from it; a measured spread stands in only for an unspecified cause, at that cause; answer and act on a question's aim, not its words.
- Changed: `AGENTS.md`, How to write code: "Derive; do not look up" (the rule above, naming the layer used and the next one down). `.claude/skills/exact-voice/SKILL.md`: rule 17, "Generators first" (the rule that produces the details, then the details; the aim a question implies, acted on); the Manner rules renumbered 18–21.
- Found: Praat's articulatory synthesizer (github.com/praat/praat, `artsynth/`, commit 6a9874e, GPL; Boersma) holds the deeper voice layer ready to port: vocal folds as two masses on springs per speaker (men 18 mm long, 0.1 and 0.05 g, 12 and 4 N/m; women 10 mm, 0.02 and 0.01 g, 10 and 4 N/m; from Ishizaka & Flanagan), the tract from Mermelstein's 1973 articulatory geometry scaled by speaker size, airflow and tube acoustics; pitch, loudness and formants come out of the simulation.
- Next: port that synthesizer, with each person's fold length, masses, stiffness and tract size derived from their body and the unspecified part drawn at those materials, not at the pitch; then (120)'s height effect follows from the simulation instead of the string law.

## 2026-11-11 (120), Claude
- The player, on ideas: refer to things by the minimal layer that generates them, few-to-many and invertible, and compute the vocal tract instead of taking examples by sex and age; then, on a question about speaking rate: a "habit" is a frequency, and neurons are physical, so the rate can be approximated from causes. Picked: the full chain (body to anatomy to sound; nerves to rate), bits per syllable from the 17 measured languages, each person's own difference one draw from a measured spread.
- Changed (`rules/voice-body.ts`, `rules/data/info-rate.ts`, `body-sheet.ts`, `rules-tools.ts`, `index.ts`, `types.ts`): tract length from height by sex (fitted on Hillenbrand et al. 1995's formant spacing over US mean heights), formants of the neutral vowel by the quarter-wave tube at 37 °C, fold length from height by sex (cadaver equations), pitch by the string law with a wave speed per sex fitted to the measured mean speakers; syllables a second = 39.15 bits/s ÷ the language's bits per syllable (Coupé et al. 2019 data, cloned from its repository) × sex, age and the person's own draw from the same data × talk against reading. A placed person's voice goes into [BODY], the plate's hover, and the pace said words appear at in the box. Six constants registered: two tract ratios, two wave speeds and the rate's spread fitted, the information rate sourced.
- Changed from what was shown: the rate's preview capped it by the muscles' fastest repetition (min with a motor ceiling); that cap would have slowed Japanese, read at 8.03 syllables/s, to the repetition norm's 6.4, so the person's own difference is drawn from the spread of speaking rate itself among the data's 170 speakers (8.8 %), and repetition norms by age were not obtainable in this session.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88, music 9, voice-body 5 (new), sequences 300, all 0 misses. The mean US man and woman get 17.8 and 15.8 cm, 131 and 220 Hz; the rate model within 16 % of each language's measured rate (8.2 % RMS). Negative controls VB1–VB10 caught, and all 17 on the touched files near them; every control's pattern still found (646). Chromium: a tracked Tom's said words appeared in 2894 ms against 2871 computed. The new controls first took ids RV1–RV10, which existed (all caught); renamed VB1–VB10.
- Found, for the player: within one sex the chain makes height decide the tract and the pitch wholly; measured voices show height explaining up to 10 % of tract estimates' variance and under 2 % of pitch's (Pisanski et al. 2014; Künzel 1989). A draw per person for the unmeasured anatomy (fold stress and mass, tract shape), as for the rate, would hold height to those shares.
- Not checked: a running SillyTavern; children's voices (the samples are adults); the hearing rules, which still use one standard voice.
- Next: the player's choice on the height effect; the hearing rules reading the speaker's own voice.

## 2026-11-11 (119), Claude
- The player asked to see the music's semantics as questions with the code shown and pick; four, then two more. Picked: the scene's point is the strongest feeling at 90 % and the newest at 10 % ("the effect's strength"); a song's energy from tempo, loudness and brightness equally (as built); a song placed against the player's own library (as built); the song changes when the scene enters another area (most changes) or when another song is clearly nearer, 1.5 standard deviations (1 also offered).
- Changed: `music.ts` sceneTarget weighs the strongest and the newest feeling (musicStrongestWeight 0.9); chooseSong lets a song 1.5 SD nearer take over inside one area (musicClearSd 1.5); appraised feelings record their turn (`rules-tools.ts` Appraise, the number of the player's lines then), and the marked feeling of the player's line its own.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88, music 9, sequences 300, all 0 misses. Negative controls RQ14–RQ17 caught (RQ9 and RQ11 re-pointed at the new code), and all 25 on index.js and music.js with the two near Appraise; every control's pattern still found (636). Chromium: the flow as in (118).
- Seen, for the player: at an area's edge a scene that moves back and forth can swap two songs at every line; a margin (the new song nearer by some share of a standard deviation) would hold it. Not built: it is a new number to choose.
- Next: as (118).

## 2026-11-11 (118), Claude
- The player: their own songs as a rigorous system, themes as approximations of what is happening, with the rigour of formants, wavelengths and the IPA. Shown a design (songs placed by measured cues as vowels by formants; voice and music sharing one emotional code; themes as areas of the space, or named sets), they picked what was recommended: the characters' recorded feelings set the target, songs measured in the browser as they are added, named sets first and measured areas otherwise.
- Changed (`rules/music.ts`, `rules/data/feeling-va.ts`, `index.ts`, `settings.html`, `style.css`): songs added from the device are decoded, measured and uploaded to SillyTavern's files: loudness by ITU-R BS.1770-4, tempo by librosa's method over an onset envelope read at 250 Hz (Ellis 2007), brightness as the spectral centroid, key and majorness by Krumhansl–Schmuckler. Each song and each feeling (27: the 22 OCC types and the voice marks' five, placed by Warriner et al.'s norms for the words that name them) is a point of valence and arousal against its own kind. The scene's point is the mean of its feelings; a set named after the one whose feeling leads, or after the player's character's place, comes first; the nearest song plays and stays while the scene stays in its area (four at least, the axes' quarters); songs cross over 4 s, equal-power. Settings: Music on or off, volume, Add songs, each song's set and Remove, each area's name; the box's bar has ♪. Four constants registered, all assumed (musicSilenceDbfs, musicChromaHighHz, musicAreaDivisor, musicCrossfadeS); the sourced numbers are the standards' and papers' own, written in the code with their source.
- Fixed on the way: settings() built a new object on every call, so a write whose right side read the settings again was lost (it hit the Auto button in (117)); it now fills defaults into the stored object and returns it.
- Found on the way, fixed before use: a library of four songs formed one area, so its first song would never change (areas are four at least now); a beat that fell between two spectrum frames read at half its tempo (150 BPM as 75; the envelope is read at 250 Hz now); keys of chords low in pitch were read a semitone off in frames of 2048 samples (the key has frames of 16384 now, its lowest pitch derived from them).
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88, music 9 (new), sequences 300, all 0 misses. K-weighting equals BS.1770's 48 kHz tables to 14 digits; a 0 dB FS 997 Hz tone reads −3.01 LUFS in one channel, 0.00 in two. Tempo within 1.1 BPM at 66–150 BPM at 22.05 and 44.1 kHz (12 songs). Negative controls RQ1–RQ13 caught, and all 35 on the touched files. Chromium: four songs added, measured (66.1, 69.9, 150, 146.2 BPM; −35 to −16.9 LUFS; A minor, C major, E minor, D major) and listed in four areas; the song followed the feelings (none → Calm major, sad → Calm minor, Tom's joy → Intense major, Tom's set → Calm major); after the crossfade the old song was paused at volume 0 and the new one played at 0.60. Prompt audit unchanged.
- Not checked: a running SillyTavern; recordings of real music (the synthetic songs have known answers; a real song's harmony and drums blur them); measuring time on a phone (2.7 s for four 20 s songs in desktop Chromium); a browser that blocks sound until the page is touched (the song starts at the next touch).
- Next, for the player: the scene's physical state as a second source of the target (danger, effort, the place's noise), which (1) left for later; register and articulation, the cues Eerola et al. rank third and fifth, measured too; the sizes of the cues' weights from a regression on rated music instead of equal weights.

## 2026-11-11 (117), Claude
- The player on (116): their answers had been suggestions, and communication comes before settings that change the whole chat. Asked for the reference's facts and the questions again in plain words. Facts: Bright Data could not be used (the account has no zone; creating one needs the player's card), so two pages were read directly (Anderson 2022 on V3's interface; the Let's Play Archive's Trigger Happy Havoc prologue): white text is said aloud, blue is the main character's thought and narration, yellow marks important words, every box names its speaker. What the plate's "SPEAKING" means was found in no source.
- Answered: one box on screen; a stretch per box (picked here: it keeps one speaker and one colour per box, as the reference does); the name plate, and a large picture as a setting; the colour asks the reference's question, said aloud or not; a word at the plate's right for what the colour does not say; no narrator; both colour sets; key words, kept apart from the voice marks; the narrator names who says each quotation, and in the player's own lines the person acting before a quotation says it (the player's clue); letters one by one and AUTO; choice banners later; the box stays on.
- Changed (`rules/box.ts`, `index.ts`, `style.css`, `settings.html`): each unit carries the one it belongs to (speakersOf: a name the reply wrote in brackets before a quotation, SPEAKER_RULE, taken out of the text; a speech tag after it; the subject of the sentence before it; the speaker before; the author; the player's character for every stretch not said). A unit longer than 4 lines is cut after a sentence's end. The plate shows the unit's speaker and at its right speaking, whispering, thinking or nothing, and auto. Letters appear at 5 syllables per second for said words and 260 words a minute for the rest, drawn without ink until shown; a tap shows the rest; Auto waits the reading time beyond the appearing plus one word (231 ms). Settings: page colours light or dark (white, lightskyblue, gold on black), the speaker's picture none or large, letters one by one. Key words: each decided result's run of words in the reply (keyPhrase), gold ground under black letters or gold letters on the dark page. Three constants registered (boxReadWpm sourced, boxLines and boxKeyNounWeight assumed). The prompt audit reads the narrator's two rules now (NARRATION_RULE, SPEAKER_RULE).
- Fixed on the way: a reply's swipe kept its raw form (the structured JSON, now also the speakers' names) while only the message text became prose, so swiping back to it would show the raw form (read from the code; not seen in a running SillyTavern); the swipe now keeps the prose shown.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 88 (8 new: R37–R40), sequences 300, all 0 misses. Negative controls RP1–RP15 caught (three first not caught; their tests were made to tell the cases apart), and all 62 on the touched files. Chromium with SillyTavern's stylesheets: 26 presses walk 24 units of 8 messages with speakers Tom, Will, Kyoko (from the reply's name), Mara; the long paragraph in 2 boxes; a unit appeared in 1168 to 1181 ms over three runs against 1154 computed; a tap left 0 letters unshown; AUTO moved on after 231 to 238 ms; the log 0 faults in 72 of 72 combinations (36 per colour set; lowest contrast 8.55:1 on the dark page). Prompt audit: the same 11 lines with two more prompts read.
- Not checked: a running SillyTavern; the full-size avatar's address (`characters/<file>`); a reply while it streams (its bracketed names show until it is drawn whole); swipes inside the box.
- Next, for the player: the reference's choice banners for the extension's questions; a speech tag between two quotations ("he says") joined to its quotation's box instead of a box of its own; a marked word's own tempo while its letters appear; the speaker's own speaking rate from the body.

## 2026-11-11 (116), Claude
- The player on (115): SillyTavern's chat is unusable to them; "ugly" means the whole of the chat's messages in view at once, and the picture at the left; the reference's features are to be taken as that game has them; questions should narrow the space, with options stated as code where English merges distinctions ("semantic" meaning concepts apart from any one language). (115) had read "through English" as words on the screen; this entry corrects that.
- Asked, four questions with the options drawn or written as code; answered: one thing per screen (undecided between a unit and a whole message); a new box at each change of voice; the speaker as the name plate only; of four distinctions offered, [±voiced] alone (the question was not clear to the player; restated in the reply).
- Changed: a setting, "Text box", on by default (`style.css` body.rules-box; `index.ts` unitChat, showBox, stepBox, buildBox; `ui.ts` voiceUnits). The chat shows one box at the foot of the screen under the speaker's name; every other message and unit is not drawn, and the picture at the left is gone, in the box and in its log. A paragraph is cut at each change of voice: each quoted part is a unit, the text between two is a unit, a comma left between two joins the unit before. Voiced text is the ink with "speaking" on the plate; text that is not voiced is darkslateblue. A tap on the text or → shows the next unit, ← the one before; "Log" shows the whole chat. A second setting makes a box hold a whole message, since the player was undecided.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 80 (3 new: R36), sequences 300, all 0 misses. Negative controls RO1–RO4 caught. Chromium with SillyTavern's stylesheets: 16 presses of → walk the 17 units of 7 messages and 5 more stay at the last; at each, 1 message and 0 pictures are drawn; "speaking" stands on the 5 voiced units only; the whole-message setting walks 7 boxes; the log has 0 faults in 36 of 36 combinations (first run: 36 with a fault, darkslateblue at 4.24:1 on SillyTavern's block-quotation ground; a block that is no paragraph now keeps the ink).
- Not checked: a running SillyTavern (as in (115)); a reply while it streams (it has no units until it is drawn whole, and shows whole meanwhile); swipes inside the box.
- Limits, stated: inside a narrator's message the engine does not know who says a quoted part, so the plate keeps the narrator's name beside "speaking". The reference's art, colours and layout are not copied: the box takes its behaviour (one unit per screen, a name plate, a word for the mode, one colour for text that is not voiced) in the page's own type.
- Next, for the player to decide: who says each quoted part of a narrator's message (the narrator naming the speaker per passage, which structured replies can carry); a large figure of the speaker above the box; the three distinctions not chosen ([±heard], the kind of silent act, [±character's words]), each a type in code once wanted.

## 2026-11-11 (115), Claude
- The player judged the look of (114) by its two specimens: the one in SillyTavern's dark type read as a debugging view, the light serif one "much better"; the cause named was SillyTavern's own stylesheet, "plain and inefficient for handling multiple information". The "speaking" and "thinking" of the eight points are the tags a visual novel's text box sets beside the speaker's name. The request: narrow down what to do, carry as much as possible in English words, a few lines of code.
- Measured first, with SillyTavern's own stylesheets and message template (release branch, commit 06bde93, read as files; `history/review-tests/browser/voice-look/st-chat.mjs`), 5 shipped themes and a light one × 3 displays × 412 and 800 px: the look of (114) has a fault in 32 of 36 combinations. Three shipped themes cast a shadow of 1, 2 and 5 px under every letter; the theme's quote colour times a whisper's paler ink reads at 2.95:1 to 4.34:1 on 5 of the 6 themes; at SillyTavern's line height (1.53) a pitch stroke lies 0.07 em from the line above at most, and in its letters at 412 px. The player's cause holds.
- Changed, the page: a setting, "Dialogue page", on by default (`style.css` body.rules-page). Inside each message SillyTavern's own theme variables are set again, as named colours: black text, quoted and underlined words, dimgray asides, an ivory ground, no letter shadow. Its rules and the extension's notes and marks read them there. Type: the era's book serif at 1.19 times SillyTavern's size (the same x-height: 0.547 em of its Noto Sans over the serifs' 0.46), line height 1.7. The name stands in small capitals over a hairline. On the page the tone is light, so kind and feeling colours take their light values.
- Changed, the name plate: after the player's name one word says what the character is doing in the line, so the plate reads "Mara speaking" or "Mara thinking" (`reading.ts` modeOf, `ui.ts` modesOf, platesOf, drawModes). The word is the primitive act of a call made for the line (the coverage map of `docs/df-body-engine.md` §11): a Communicate by speech, or words in quotation marks, is speaking; a WorkOut is thinking; hover shows the call. Filled box for speaking, outline for thinking, no hue. It shows in every look.
- Fixed on the way: WorkOut was filed under the body's kind, so a riddle's note read "Body"; it reads "Mind", and the call is said in words ("Mara works out the riddle on the door (a riddle or trick that needs a new view), 60 s"). A pause's dots broke onto the next line, away from their word; they stay with it.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 77 (8 new: R34, R35), sequences 300, all 0 misses. Chromium with SillyTavern's stylesheets: the page 0 faults in 36 of 36 combinations, every line at one height, no word over the next, no letter shadow, lowest contrast of a marked or added word 5.44:1 (black on ivory 20.81:1), a pitch stroke 0.14 em or more from the line above. Negative controls RN1–RN8 caught, and all 86 on `ui.js`, `index.js`, `style.css`, `reading.js`, `voice.js`, `voice-code.js`, `prosody.js`. Prompt audit unchanged. TypeScript 5.6.3, the pinned one.
- Not checked: the look in a running SillyTavern (its dependencies could not be installed in this session; its stylesheets and template were read as files, its scripts not run). The player's own theme or custom CSS, if it sets `.mes` rules with `!important`, can still win over the page.
- Seen and left: the era's serifs ship in one weight, so on the page a softer word shows by its size and ink and a louder one by a drawn bold; a face with a weight axis would carry both.
- Next, for the player to decide. (1) Thought words as a mark of the toolbar: words formed without sound, so no level reaches any ear, set in one named colour (teal reads at 4.5:1 or more on ivory); today "thinking" is the act of a whole line. (2) The narrator's lines: a plate and marks for what other characters say needs the narrator to give who speaks and how; structured replies already give one passage per decided result. (3) From (114): the feeling setting the sound's quantities itself; a font with a weight axis; degrees for a mark.

## 2026-11-10 (114), Claude (session configured for claude-fable-5-2)
- The player reported the multiple-distinctions look of (113) as worse than the lighter one: the blue pitch line too salient, the new blur worse than the old, several sizing errors. With it came eight points for a notation that maximizes how fast a line is taken in: colour and speed, what "fast" is measured against, a deeper layer under feelings, the logic of intensity steps, how much redundancy, thinking against speaking, a physical layer in place of labels, and words that mimic the sound.
- Measured first (Chromium, 13 specimen lines): 11 lines changed their line height by 1 to 9.75 px of 23, one word lay 2.2 px over the comma after it, 17 words were hollow, 10 blurred; the lighter look grew 10 lines by 1 to 5 px.
- Changed, the sound: `voice.ts` holds each mark as a quantity against the speaker's own unmarked speech (faster 1.27 times the speaker's own syllables per second, slower 0.6, louder +6 dB, softer −5 dB, whispered −26.8 dB, a rise or fall 6 semitones, phonation and register as kinds, a pause in syllables of silence); seven constants registered (3 sourced, 4 assumed with ranges).
- Changed, the look: each part of the voice has a place of its own around the word. Above it, one thin stroke in the word's own colour for the pitch. In its letters, the loudness (weight, size and opacity together). Under the run of words, the phonation (a wavy rule for creaky, dots for breathy, a broken rule for whispered). Along the line, the time (gaps and letters open for slower; a faster word closes up and leans; a drawn-out vowel is written again, "Nooo"; a pause is a dot per syllable of silence). A falsetto word is narrow and as tall as its neighbours. The feeling is its word and a 2 px rule at the message's edge, in a colour given as OKLCH coordinates (hue the kind, chroma the activation, lightness the valence). The sizes are derived from `voice.ts` (`ui.ts` lookVars), set on the page by `index.ts`, and held as equal fallbacks in `style.css`. A marked word's hover text gives each mark's quantity. The word-width measuring in `index.ts` is gone.
- Changed, both looks: a word or added word of another size takes no line height of its own, so every line keeps the story's line spacing.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 69 (11 new: R32, R33), sequences 300, all 0 misses. Chromium, 13 lines × 5 fonts (Inter, Liberation Sans, DejaVu Serif, Liberation Serif, Lora) × 760 and 400 px: every line at the story's line height, no word over the next, no blur, no hollow letter, the pitch stroke in the text colour; the lighter look 13 of 13 lines at the line height (3 of 13 before). Feeling colours: 4.5:1 or more on every shipped theme (lowest 4.76), any two 45 CIELUV units apart or more for normal colour vision (dark themes 58); for a red-green colour-blind reader two to five pairs under 40, so the word carries the feeling. Negative controls RM1–RM15 caught, RL1–RL4 caught. TypeScript 6.0.3 and 7.0.2 emit the same files (5.6.3, the pinned one, is not on this machine). Prompt audit unchanged.
- Not checked: the look inside SillyTavern (the specimen page uses its theme variables and message type written from memory of its stylesheet); the cumulative patch from the first upload (that tree is not in this session).
- Next, for the player to decide: whether the feeling sets the sound's quantities itself (anger: higher, louder, faster), so one deeper value drives several marks; whether inner speech gets marks of its own (it has words and a tempo, no level at another's ear); whether a font with weight, width, slant and grade axes (Roboto Flex, OFL) replaces the drawn sizes, so widths come from the font; degrees for a mark (much louder), which the quantities already allow. Then: the speaker's own baseline from the body (pitch in Hz, the tract's length); `effortOf` and the hearing rules reading `voice.ts`.

## 2026-11-03 (113), Claude
- The player asked for more visual distinctions for the voice marks, each on a channel of its own, so they multiply instead of covering each other. Changed: a setting, "Multiple distinctions", on by default, gives each dimension of the voice its own look in the chat (`style.css` body.rules-distinct): pitch a curve above the word in the order given, loudness weight and size, creaky / breathy / whispered one scale of texture (dots, soft edge, hollow letters), falsetto squeezed letters, faster a forward lean, drawn out the last vowel widened under a macron, stress the IPA's ˈ, the feeling a tint behind the message as well as its word. Off, the chat looks as before. The pitch order is kept for the models too: the notation writes ↓↑ for a fall-rise (before, always ↑↓), and the delivery says "rise-fall on never" / "fall-rise on never", the shape only.
- Checked: route 218, frame 202, intent 37, engine 203, plan 60, size 9, ui 58 (4 new, R31), sequences 300, all 0 misses; negative controls RL1–RL4 caught; a chat drawn in Chromium with both looks: the lighter look unchanged, the two pitch orders drawn apart, only lines with a curve taller, a falsetto word closing up with the next.
- Next: the confusions between feelings by arousal (Banse & Scherer 1996 give a confusion matrix) in place of the four equal ones; a feeling heard less often when the marks contradict it (Juslin & Laukka 2003's cue profiles).

## 2026-10-28 (112), Claude Opus 5.5
- The player asked for physics computed from what a thing is made of, not from a sentence about it ("at 0 degrees water freezes" is itself an observation). Changed: Substance answered "solid" for any compound below its melting point. For water it now works out whether a crystal starts (`freezing.ts`): the vapour pressures of ice and supercooled water (Murphy & Koop 2005) give the driving gap, Koop et al. 2000's rate gives crystals starting by themselves, Brennan et al. 2020's snowmelt spectrum the particles in natural water, ice it touches starts it at once; the chance grows with the volume and the time, and one draw decides. Other compounds below their melting point: solid once crystallised, a melt stays liquid until a crystal starts.
- Checked: route 218, frame 202, intent 37, engine 203 (1 new), plan 60, size 9, ui 54, sequences 300, all 0 misses. Water at −1 °C: a cloud droplet stays liquid (P 2 × 10⁻¹²), a litre freezes (99 %); a clean 10 µm droplet 50 % in 1 s at −37.1 °C (Koop: near −38); snowmelt drops of 0.05 mL half frozen at −12.4 °C (Brennan: −12.5); negative controls RK1–RK8 caught; prompt audit unchanged.
- Tried and not used: UNIFAC's water activity for ethanol–water puts 39 wt % at −10.0 °C against −28.7 °C measured (Lange), so mixtures get no freezing answer yet.
- Next: the state starting the physics instead of the words (water below its melting point anywhere in the scene gets the freezing check, whatever the line says); a water-activity model valid below 0 °C (salt, alcohol, sugar); the same nucleation law for boiling (a bubble has to start too) and for other compounds once their rates are tabled.

## 2026-10-28 (111), Claude Opus 5.5
- The player asked for the scene's state to decide, not the words ("words are a lossy output"). Changed: when both people stand at spots on the map, a blow, a choke hold, a handgun shot, a chase, a look, speech and a sound take their distance, and a shut wall between, from the map (`rules-tools.ts` placed). Before, BodyStrike defaulted to "within reach", so a punch landed between people placed 6 m apart; Communicate and Look used a given distance over the map's; a given figure that differs is now ignored and named. A hold needs the holder within reach (0.88 m at 70 kg, `body-engine.ts` reachOf); Listen takes `source_who`.
- Tried and not kept: the state choosing a verb's sense (VerbNet 3.4 pre-states, roles bound from each frame's syntax, 270 classes; SayCan's product of the words' and the state's chances). With the words fixed it changed the leading reading of 40 of 408 verbs with a thing as object and 50 of 480 with a person, and the changes were wrong: "I give the coin" with no coin went to "give off", "I steal the coin" holding one to "steal into", "I punch the cook" across the room to punching a shape. A failed precondition makes the act impossible or needs an earlier act; it does not make another sense likelier, and VerbNet leaves most alternatives' preconditions unstated, so they won by default. The scripts are in the bundle (`review-tests/probes/sec45-state-senses/`).
- Checked: route 218, frame 202, intent 37, engine 202 (1 new), plan 60, size 9, ui 54, sequences 300, all 0 misses; negative controls RJ1–RJ11 caught; prompt audit unchanged.
- Found: BodyStrike's `prone` input is never read by `strike()`.
- Next: Transfer between two placed people apart (a hand-over needs reach, unless thrown or sent); a target's recorded posture for strike (once `prone` is read); the offering fitted on the player's own chats.

## 2026-10-28 (110), Claude Opus 5.5
- "Continue": the open items of (109). Changed: a thing that holds, bears or supports a weight, or gives way, offers Break ("does the shelf hold Mara's weight"); someone else's feeling asked about offers SocialResponse as well as Appraise ("whether Elias liked her"), and the router now knows the player's own character ("How does Mara feel" stays Appraise); tiptoe, creep and prowl offer BodyCheck (Merriam-Webster names their stealth, WordNet does not); a thing slid into one's own sleeve, coat or bag is taken (Transfer); the narrator's acts offer the tools that record them (a narrated theft offers Transfer, a narrated drink BodyIntake), a hand-over only by giving, stealing or seizing a physical thing; "how much does the ferryman charge" asks a price; "whether" opens a clause's subject; reading to a crowd is speech.
- Checked: route 218 (9 new), frame 202, intent 37, engine 201 (1 new), plan 60, size 9, ui 54, sequences 300, all 0 misses. Eval sample, play's step: tools the first round cannot call 2 → 0, extra tools offered 56 → 56. A third held-out set (46 lines, first run): offered 35 of 38 (25 on (109)'s tree, 4 on (108)'s), routed without the tool 1 (6, 12), lines that must not get a tool clean 8 of 8 (8, 6); its three misses then fixed (37, 1, 8; the one left reads "whether the baker trusts strangers" as Trust). Corpus: 1 routing changed ("creep across the lawn" adds BodyCheck). Negative controls RH1–RH16 caught; every route and frame control in the repository (264) and the 105 engine, plan and sequences controls on the files touched caught, three of section 43's (RG7, RG61, RG62) after their patterns were matched to this pass's code.
- Next: the offering fitted on the player's own chats (which tools the planner called and the player kept); the narration's outcomes no result decided (the rule check reads them; a reader of their own could record them).

## 2026-10-27 (109), Claude Opus 5.5
- "Continue": the open items of (108), starting with a fixed sample scored on every pass. The 58 eval scenes, scored as play offers tools (the router's tools when it routes, else the picker's): on every commit from the upload to (108), 22 of the scenes' tools could not be called in the planner's first round, because the router had routed other tools and the schema held only those. The router read the player's verbs only; the picker it replaces reads the last three messages and includes a tool when unsure.
- Changed: the scene's words add the tools whose inputs they name (`cue-tools.ts`, nouns from WordNet in `data/cue-words.ts`: sounds, riddles, names, diseases, fire, smoke, weather, cold, heat, deserts, altitudes from 2,500 m, boats, operations, stoves and pots, feelings, a watcher, a pursuer); the activities the tools' descriptions name add their tool (`data/activity-verbs.ts`: sneaking, riding, crafts, jumping, swimming; solving, deciphering, calculating; fleeing), and verbs of feeling add Appraise; the verb after a noun subject is read ("a shard slices her palm"), a thing as subject makes an accident's wound; Look only for seeing (notice and detect offer Listen too); VerbNet's roles of amount take amounts, a two-object frame's first object only with two objects; about 40 named constructions (trust, lie to, hang from, catch a disease or a person, inject, remember to, clothes, a load on a plank, "what does the guard do", reading aloud, an account that may be a lie, a watched person, the player's claims); "rides" is ride's, "saw" see's, an inverted do an auxiliary, a particle before a path a motion's; a time after the object is no second object (since (107) "I punched Tom two days ago" read "two days" as one, which hid the time-ago rule). The /rules-eval command offers tools as play does.
- Checked: route 209 (26 new), frame 202 (1 new), intent 37, engine 200 (2 new), plan 60, size 9, ui 54, sequences 300, all 0 misses. Eval sample, play's step: 22 → 2 tools the first round cannot call (a theft the narrator wrote; whether Elias liked her), extra tools offered 45 → 56. 228 lines written from the tool descriptions: offered 71 → 170, routed without the tool 73 → 12. Held-out lines, first run each: set 1 (122) offered 90 of 100 (10 before), routed without 5 (47), lines that must not get a tool clean 20 of 22 (16); set 2 (62) 47 of 52 (4), 2 (28), 9 of 10 (7). Corpus of 280 lines: 15 routings changed, each toward the act its line names; without context 9 of 230 routed lines gain a cue tool (6 a fire nearby). Negative controls RG1–RG65 caught; of the earlier controls on the files touched, 202 of 208 caught on the first run: four patterns moved with the code (R6, G22, G36, RE4: retargeted), RE8's line now routes by its named verb (moved to "I supply the cook"), and G46 was hidden since (107) (fixed above); all six caught after. Every route and frame control in the repo, 250 of 250, caught on the final tree, and so were the 105 engine, plan and sequences controls on the files touched.
- Next: the narration's own events (scene 55: a theft the narrator wrote reaches no tool); another's feelings toward the player's character (scene 12: SocialResponse); the subject's restriction ("the shelf holds my weight" offers a grip); tiptoe, creep and prowl (WordNet defines them without stealth); the offering fitted on the player's own chats.

## 2026-10-27 (108), Claude Opus 5.5
- The player asked for cues that add up, each raising or lowering a reading ("if I hear x, then see y, then smell z"). Added `sense-odds.ts`: a verb's readings (the senses left by its object, grouped by the tools they name) start equal, and each cue multiplies their odds: the verb's earlier reading in this chat (0.94, Gale, Church & Yarowsky 1992), with the same object (0.95, Yarowsky 1993), a weapon held, a tool decided in the last six messages, and the scene's words its WordNet definition shares (Lesk 1986) [ASSUMED weights with ranges, registered]. Code drafts a contested blow only at 80 % [ASSUMED]; the planner is told each verb's readings, chances and cues.
- Checked: route 183, frame 201, intent 37, engine 198 (1 new), plan 60, size 9, ui 54, sequences 300, all 0 misses; "I charge the cook" 25 % → 50 % (sword) → 67 % (and a blow) → 79 % (and "attack" said); billed earlier: Price 95 %; negative controls RF1–RF6 caught, the 148 others on router.js, frame.js and question-pass.js caught (RE7 retargeted to the new condition).
- Next: weights fitted on the player's own chats (the fixed sample: which reading the planner and the player kept), in place of the assumed ones; more cues the engine holds (the place, a person's occupation, what was seen or heard: Look and Listen results).

## 2026-10-27 (107), Claude Opus 5.5
- The player asked for semantic logic in place of fixes made one output at a time, and for every phrase likely to be misread ("I throw the cook" and its variations). Added: a verb's sense by what its object is (`senses.ts`): VerbNet's selectional restrictions per class against WordNet's kinds of thing per noun (`data/senses.ts`, built outside the repo from VerbNet 3.4 and Open English WordNet 2024). The router leaves out the senses the object cannot meet; frame.ts drafts no blow where another sense the object fits names another tool, or where the verb takes two objects.
- Inventory: 16,224 phrases (676 verbs × 22 kinds of object, two objects, no object); of the 8,172 whose object fits a sense: 1,647 offered a tool from a sense the object cannot meet (now left out), 461 have senses with different tools that the object fits (the model chooses; code drafts no blow), 516 get a tool from a sense VerbNet leaves open ("raise my hand" offers Price), 159 are decided by a hand-written entry while VerbNet has other senses ("throw a party" is BodyCheck), 4,930 have one reading.
- Checked: route 183 (11 new, 10 missing on section 40's tree), frame 201 (3 new), intent 37, engine 197, plan 60, size 9, ui 54, sequences 300, all 0 misses; 272 player lines: 6 routings changed, none for the worse; negative controls RE1–RE11 caught, RB9 retired (its rule is now the sense step's), 118 of 118 on router.js, frame.js and senses.js.
- Next: senses for the hand-written entries (throw, take, hand, treat…), so "throw a party" is no throw; "hit the cook up for money" (a particle after the object) still drafts a blow; the 516 offers from senses VerbNet leaves unrestricted.

## 2026-10-27 (106), Claude Opus 5.5
- The player said the bugs do not thin out over four weeks. Measured from `credibility-edits.md`: findings per pass held at 5–16 over the last 19 passes (sections 22–40); the record attributes none of them to an earlier fix (the negative controls and random sequences catch those). The findings are older errors that each new probe reaches.
- The pool they come from, counted for the router: of the 1,568 verbs VerbNet routes, 632 have classes (senses) that route to different tools, and the router takes the union of every sense; 32 are settled by a named entry, 600 are open, 112 of them with two or more different tools ("charge": BodyStrike, Price, Act); of 105 everyday verbs, 56 are open and 25 conflict (carry, charge, cut, drag, drive, get, hit, hold, knock, lead, leave, order, pass, pick, pull, raise, reach, rush, save, serve, sign, snap, stick, tap, tear). A probe of 50–100 lines meets a few of them, so each pass finds a few: the rate stays flat while the pool lasts. Script: `review-tests/probes/verb-senses.mjs` in the bundle.
- Next: a fixed sample of the player's own lines, scored on every pass (the rate per line is the measure that falls when the tail does); a sense step for the router (VerbNet's frames and selectional restrictions pick the class), or, for a verb whose senses conflict, tools offered for the model to choose and no call drafted by code.

## 2026-10-27 (105), Claude Opus 5.5
- The player said "Continue"; the next item was the tool results read with the same test as the tool texts. Every result the engine test makes was recorded (9,818), with the 17 tools it leaves out called in an 1850 and a 1990 scene, and the [BODY], [KNOWS], [HAS] and [DECIDED] blocks.
- Changed: a result reaching the narrator keeps out the sensitivity note (also in its own tool calls), status tags, sound levels in dB, a compound's CAS number and molar mass, "(Pulse)", "the 77 kg model", a burn's death chance (the engine draws it), and the blood-loss class at 0 L; Weather tells a missing date from a place without climate data.
- Checked: route 172, frame 198, intent 37, engine 197 (1 new, missing on section 39's tree), plan 60, size 9, ui 54, sequences 300, all 0 misses; texts with a narrator-facing hit, of 10,770: 2,189 (its own tool calls) and 2,150 ([DECIDED]) → 0; negative controls 122 of 122 caught (RD2 and RD4 on a second run, after the check gave its room a volume and passed a minute after the dose).
- Checked and left: BodySize's 35 kg at 150 cm in 1850 is a draw 2.3 SD below the 1975 mean BMI, about 1 in 70.
- Next: several blows in one turn; "I want to X".

## 2026-10-27 (104), Claude Opus 5.5
- The player asked for every line the models read to name only what the scene can hold. Read and tagged: 9 prompts, 42 tool descriptions, 430 argument descriptions, 112 option lists (942 values), 338 examples (`tool-lines.md` in the bundle).
- Changed: options, arguments and tools carry their years and worlds (`scene-fit.ts`); the planner's catalogue and schema, the narrator's tool schemas and its brief are fitted to the story's year, its world's magic and its country; the narrator without a question pass gets the tools of the player's line; a condemned act is read from its words; examples name what any scene holds or a placeholder; "DF creature" is "species"; the speech line names no fantasy species; Price, SocialResponse, Sickness and Dose descriptions shortened; BodyWound and the rule check agree with the other tools.
- Checked: route 172, frame 198, intent 37, engine 196 (3 new, each missing on section 38's tree), plan 60, size 9, ui 54, sequences 300, all 0 misses; six lines in 1300, 1850, 1990: planner 4,088 → about 3,600 tokens, narrator 23,180 → about 2,800, out-of-scene words 0 in 1300 and 1850; prompt audit 15 → 9; negative controls: 13 new (RC1–RC13) and the 97 others on the files touched, 110 of 110 caught.
- Next: tool results (the "[Rules engine]" lines) read with the same test; the place filter for more tools than NameCharacter.

## 2026-10-27 (103), Claude Opus 5.5
- The full negative-control run on section 37's tree caught 423 of 424; Q11e ("a shot") was not, and its trail led to the router reading only the first tool of a shot's route.
- Changed, reading: "I fire my pistol at the guard", "I take a shot at the guard with my pistol", "I take aim at the deer" and "I aim and fire" offer BodyCheck (a handgun's shot_m) beside BodyStrike; "I open fire on the soldiers", "I return fire" and "I gun him down" are shots; "I fire the cook", "I fire the kiln", "I fire up the generator" and "I hold my fire" are none; "I take a shot of whiskey" is no blow.
- Checked: route 172, frame 198, intent 37, engine 193, plan 60, size 9 of 9, ui 54, sequences 300, all with 0 misses; the 11 new route lines and 2 of the 4 new task routes miss on section 37's tree (the other two, "fire the kiln" and "fire the musket at the deer", held there already); negative controls: 11 new (RB1–RB11), Q11e retargeted to the pistol line and to a shoot entry naming BodyStrike alone, and the 50 controls on router.js and verbs.js all caught; the other 373 were caught on section 37's tree.
- Next: several blows in one turn; "I want to X"; "snipe", "pick off", "set fire" and "catch fire" (27 shot lines probed, 22 right).

## 2026-10-27 (102), Claude Opus 5.5
- The player asked what else; the sixth review's open items and two more corpora of ordinary lines (90 lines) were run.
- Changed, reading: "I pour Tom a drink" and "I blow out the candle" are no weather; "I stab Tom" offers no Substance, "I strangle the guard" is a choke, "I drown the rat" an immersion; "I pick up the lantern" no eating; "I light a candle" no treatment; "I draw my sword" a motion; "I take a seat" a motion; "I break the silence" speech; "I force a smile" no effort; "I sneak past the guard" is whether the guard sees; "I swing my axe at the orc" is a blow; "I give Will 3 coins" hands three; "I sit by the fire for an hour" passes the hour (the planner had been skipped and the hour lost); "I ask Tom for the key, and he gives it to me" says only "for the key"; "I SHOUT AT WILL" keeps Will.
- Changed, text to models: every request leaves with hidden marks as notation, whoever built it (the summary's raw prompt read the saved chat with them).
- Changed, interface: a feeling mark keeps the words the player selected; the world book's draft reads braces inside its values.
- Changed, state: each reply's world is kept as the changes from the one before it in an archive in the chat's metadata (a whole world every 50), so the saved chat grows with what changes, not with the world's size per reply.
- Checked: route 160, frame 198, intent 37, engine 193, plan 60, size 9 of 9, ui 54, sequences 300, all with 0 misses; every new check misses on section 36's tree; 424 negative controls caught (15 new: RA1–RA15; RS15 and H6 retargeted; Q11e retargeted to "I shoot the guard with my pistol": with the poison route gone, its bow line passed without the shoot entry); random sequences 3,000 × 40 on seeds 11 and 12, 0 failing.
- Next: several blows in one turn ("I punch Tom and Will", "I hit the guard twice": the plan holds one BodyStrike per attacker); the player's choice on "I want to X".

## 2026-10-27 (101), Claude Opus 5.5
- The player sent a sixth outside review (ss.pdf, 12 findings, none run) and asked for this review's own reading, converged with it. Each of its findings was run with its own test (`review-tests/review6.test.mjs`); eight hold (two in a narrower or broader form than stated), one holds as a measurement whose diff would lose state a deletion needs (the world kept on every reply), three do not (a missed Look's sighting changes no lineup; touch taps keep the mark in Chromium's touch emulation; reach() at 230 dB is past any input). The review here found eight more.
- Changed, state: a pass that fails part way takes its calls back (the narrator's tools had run them again: an hour waited became two); a line edited into a correction keeps the world it put back; a tool that waits writes nothing into a chat opened meanwhile; the rule check's note and flags stay with their turn.
- Changed, reading: "(35)" and "(1850)" stay words, "20 °C" is a temperature, "I drop the sword" and "I fall asleep" are no falls, "with all my might" and "about my plan" are no message, "hit him back" after a woman is named still reads the one who struck, a line quoting in guillemets is no correction, "*I punch **Tom**.*" strikes Tom, a plan whose message holds a brace still reads, "I glare at him" looks at the man named before.
- Changed, interface: marks on words in guillemets sit on the letters; Tab from the message box enters the voice toolbar while it shows.
- Checked: route 158, frame 196, intent 37, engine 192, plan 59, size 9 of 9, ui 51, sequences 300 with 0 failing, all with 0 misses; every new check misses on the uploaded tree; 409 negative controls (16 new: RS1–RS16; Q6d, RY8 retargeted); Chromium (Playwright) runs of the toolbar by keyboard, touch and Backspace.
- Next: see the toolbar on a phone inside SillyTavern; a bound on the world kept on every reply (1.1 MB of chat at 120 turns, growing with the square of the length).

## 2026-10-23 (15), Claude Opus 5.5
- The player: having to memorise a sign for each mark is not the improved look they wanted; keep the backend whole, improve what is seen. Shown a sketch (a toolbar of plain words on selected words, the box with clean words and soft colour, the chat typeset), they took it, the box showing clean words.
- Changed, no signs on screen: the voice toolbar opens over selected words (or with ♪ for the word at the cursor), plain words each set in their effect, in groups with one soft colour each; a pick marks the words with hidden codes (Unicode tag characters after each word's last letter: no width, nothing shown, the cursor steps over them), again to take it off.
- Changed, the box: a layer over it (clicks pass through), the same text invisible in the same place, underlines marked words in their group's soft colour. Backspace and Delete take a marked letter as one character and keep its marks on the word (Chromium alone needed a key press per hidden character).
- Changed, the chat: the player's line is typeset the way it sounds (louder in small capitals, rising lifted, slower spaced, a pause as a faint dot); hover names the marks.
- Changed, the model's view: before a model reads the chat, hidden marks become the notation the engine reads and the tag characters are removed (invisible text never reaches a model unseen); typed notation still works.
- Checked: tests/route 60, frame 41, engine 135 (1 new), plan 58, size 9 of 9, ui 32 (the bar's checks replaced by hidden-mark ones), all 0 misses; 113 of 113 negative controls caught (6 new); in Chromium with SillyTavern's stylesheet: the toolbar, the layer aligned under the box's text in a dark and a light theme, the typeset line, Backspace on a marked word.
- Next: see it inside SillyTavern (a theme with custom CSS on the message box could shift the layer).

## 2026-10-23 (14), Claude Opus 5.5
- Asked: speech is more than words (pitch, pauses, breath, voice quality), and the more it is specified the better, at the fewest characters. Shown three notations on the player's own line (conversation analysis's marks, SSML tags, plain words); the player asked which to choose; recommended clicking marks onto the line, which writes the densest notation, and the player agreed.
- Changed, marks read in code (`prosody.ts`): Jefferson's conversation-analysis marks for pauses, pitch, loudness, quiet, stretch, cut-off, breath and laughter; VoQS's for breathy, creaky, whispered and falsetto voice; ((angry)) for the feeling; three written otherwise so SillyTavern keeps them (› ‹ for faster, ‹ › slower, ☺ smile voice, ˈ stress). Ordinary text reads as before (currency, times, temperatures, hyphens, abbreviations).
- Changed, the mark bar above the message box: a button per mark, written on the selected words or the word at the caret (undo works), a feeling list, ♪ to fold it.
- Changed, the turn: the words are read without the marks; the player's Communicate takes the effort the marks give (whispered, louder, some words louder) and the feeling; the planner and the narrator are told the delivery; the note's first row is the Voice.
- Changed, the listener: a feeling in the voice is heard right as often as listeners hear it (Juslin & Laukka 2003, Table 4: pi per feeling within and across cultures, read among five feelings: anger within a culture 76.9 %, happiness across cultures 41.6 %); a miss is one of the other four.
- Checked: tests/route 60, frame 41, engine 134 (2 new), plan 58, size 9 of 9, ui 29 (8 new), all 0 misses; 108 of 108 negative controls caught (10 new); the bar clicked in Chromium with SillyTavern's stylesheet (the marks written, read back, undone).
- Next: what pauses, pitch, breath and voice quality change beyond the feeling needs sources with rates (a pause read as nerves or a lie; a breathy voice as intimacy).

## 2026-10-23 (13), Claude Opus 5.5
- Asked the player, with drawn options, how the reading and the questions should look; they picked: the most information for the words and the space, an aside in a book serif and italics, one colour per kind of rule, folded until opened, questions as prose with linked choices, type that follows the story's era.
- Changed, the note: one row per call, a tag naming the kind of rule (Sight, Sound, Speech, Body, Move, Mind, Time, Thing) and the call in the fewest words that decide it, without the player's character, who makes every call shown ("Sight Tom · 15 m"). Folded to one line (the guess, "— or…", then the tagged calls); opened, the guess's other readings are linked words that fill the input box with the correction.
- Changed, colour: Okabe & Ito's colour-blind-safe hues, each mixed with the theme's text colour by a share per tone so every kind reads at 4.5:1 or more (WCAG 1.4.3) on all five themes SillyTavern ships and on a light theme; the tag's word carries the kind too.
- Changed, questions: one sentence quoting the player's words, every choice a linked phrase of the same form, numbered (number keys pick), shared words said once ("Do you mean to hit ¹Tom or ²Will?"); no buttons, no focused default; "Say it another way" under it.
- Changed, period type: by the story's year, five OFL faces subset to Latin (EB Garamond before 1600, IM FELL English to 1749, Baskerville to 1799, Old Standard to 1919, Libre Caslon Text to 1969; Georgia after or without a date), old-style figures where the face has them, one x-height across faces, the manicule for a guess up to 1919. Libre Baskerville's subset is renamed (a Reserved Font Name); Libre Caslon's s–p and s–t ligatures, which read as a long s, are off.
- Checked: tests/route 60, frame 41, engine 132, plan 58, size 9 of 9, ui 21 (8 rewritten checks), all 0 misses; 98 of 98 negative controls caught (14 UI controls rewritten for the new note and question); the note and the question drawn in Chromium with SillyTavern's own stylesheets in all six eras, dark and light. Not yet seen inside SillyTavern itself.
- Next: watch whether the folded line is read, and whether the tags' colours sit well on the user's own theme.

## 2026-10-23 (12), Claude Opus 5.5
- Changed, the reading's place: the note of how the engine read the player's line now sits under that line in the chat and stays (kept on the message), instead of a toast that closed after 4 s at the top of the screen. Its lines: the correction a turn redid, the reading taken unasked, one line per call in parentheses ("(Ann looks at the rider, 40 m away)", the call itself on hover), the things read. A line edited since shows no note. Sources: WCAG 2.2.1 (a message with no other place to read it must not vanish on a timer), NN/g (a note about one message sits next to it), Inform's "(the green box)".
- Changed, its look: `style.css` (the manifest's `css`) draws the note and the popup with SillyTavern's theme variables, after its own line under a message (`.mes_bias`) and its reasoning block's rule, so every theme fits; every line is set as text; nothing animates.
- Changed, "change": a reading taken unasked has one action on the latest line; it lists the readings passed over, each filling the input box with its correction ("no, catch up with the thief"), which the correction rule reads back as that reading (Material's one action per snackbar; Raskin's undo over warnings).
- Changed, questions: every option is the same popup button, in one numbered column (number keys pick), with "Say it another way" last and the question holding the focus. The two-option confirm popup coloured and focused its first button, so Enter took it, a default (Johnson & Goldstein 2003).
- Fixed: a swipe of a turn that a correction redid went back to the world the undone turn left (the undone blow stood again) and dropped the correction; the redoing turn now starts from the restored world and keeps its correction and its taken reading.
- Checked: tests/route 60, frame 41, engine 132 (2 new), plan 58, size 9 of 9, ui 14 (new file, a stand-in document), all 0 misses, and engine and plan 0 misses under 30 other seeds; 93 of 93 negative controls caught (13 new; N64's pattern follows the restore call's new argument); tools/prompt-audit.mjs reports the same as before; the note and the popup drawn in Chromium with SillyTavern's own stylesheets, dark and light themes. Not yet seen inside SillyTavern itself.
- Next: watch in play whether the note's four lines crowd a short message, and whether "change" gets used.

## 2026-10-23 (11), Claude Opus 5.5
- Changed, when to ask: the likeliest reading of what the player's line leaves open is taken when its share of the weight reaches 0.5, or 0.9 when a reading harms someone (Horvitz 1999's act-or-ask rule); readings are weighed as parsers rank referents (the person the player last acted on, the one the narrator named last, the one at the player's spot) and by what the scene shows (a fleeing thief, soldiers about). A taken reading is shown ("Taken as: …"); a question comes only for a guess that could hurt someone or a tie. A bare "I strike!" with two men by is asked.
- Changed, the reading shown back is in story words ("Jack strikes at Tom", "Ann looks at the rider, 40 m away").
- Changed, corrections: "no, Will" or "I meant to keep out of sight" as the next line puts the world back to before the last turn and plans that line again with the correction; the narrator is told the last reply's account did not happen.
- Changed, meanings: FrameNet 1.7 (651 lexical units of 30 frames) routes what VerbNet's classes leave out: verbs it lacks, the noun after a light verb (take a look, throw a punch), a noun opening a task; climbing verbs stay BodyCheck's. Licence: Creative Commons Attribution-Only, acknowledged in the README and third-party notices.
- Checked: tests/route 60, frame 41 (2 new), engine 130 (3 new), plan 58, size 9 of 9, all 0 misses, and engine and plan 0 misses under 30 other seeds and 5 fresh samples; 80 of 80 negative controls caught; tools/prompt-audit.mjs reports the same as before. The popups run in SillyTavern only.
- Next: watch in play how often a question comes up and how often a taken reading is corrected; the weights and thresholds are judgements with ranges (docs/constants.md).

## 2026-10-23 (10), Claude Opus 5.5
- Changed, the player's side: after each message a note shows what the engine took from it, one line per call for the player's character ("Look: Ann at the rider, 40 m"; "Blow: Jack at Tom"). When the line leaves open a choice that changes the outcome and the words do not settle it ("I hit him" with two men in the scene; "I follow the thief"; "I take the bridge"), a popup asks, with options of one form, no default and a fresh order; the answer is fixed for the turn (required of the plan, read by the planner, set on the call); closing it stops the reply so the player can say it otherwise.
- Changed, the narrator's side: BodyCheck requires `task_kind`, what the task is, from a closed list reshuffled each generation; a named route goes to its tool, and a kind and a verb that disagree are refused with both readings.
- Checked: tests/route 60, frame 39, engine 127 (4 new), plan 58, size 9 of 9, all 0 misses, and engine and plan 0 misses under 30 other seeds and 5 fresh samples; 71 of 71 negative controls caught; tools/prompt-audit.mjs reports the same as before. The popups run in SillyTavern only: their two forms (confirm for two options, custom buttons for three or four) were not run here.
- Next: watch in play how often a question comes up (it should be rare) and whether the reading note is read; the router's own BodyCheck verbs (climb, jump, lift) still take no synonyms.

## 2026-10-23 (9), Claude Opus 5.5
- Changed, routing: every BodyCheck route reads the task's own verb by its present-day meaning (`verbs.ts`, TASK_ROUTES from VerbNet classes): hearing, seeing and searching, swimming, hanging on and carrying, the chase, deceiving, courting and winning over, taking a defended position, a choke, shooting and blows at a creature, treating a wound. Over 101 phrasings: before, 43 of the first 77 ran on the narrator's share and 6 went to the wrong tool (lie down → a lie, bolt the door and a shot of whisky → a missile, date the letter → a meeting, assault the guard → a battle); now 0 and 0. A verb read in another sense keeps the task (hang the lantern, shoot the rapids, kick the door open), as does a verb BodyCheck decides itself (climb the wall to see over it).
- Changed, the player's line: looks and blows are drafted from the same verb sets ("I glimpse the rider", "I club the sailor"); an activity no word names takes its mood row from its verb's class (devouring → eating, scrubbing → housework, dozing → relaxing). The words that name a person or an animal moved to `nouns.ts`, shared by the scene's people and the blows.
- Checked: tests/route 60, frame 39 (5 new), engine 123 (2 new), plan 58, size 9 of 9, all 0 misses, and engine and plan 0 misses under 30 other seeds and 5 fresh samples; 64 of 64 negative controls caught; tools/prompt-audit.mjs reports the same as before.
- Next: the router's own named verbs for BodyCheck (climb, jump, lift…) take no synonyms (clamber, scramble); Act's motion verbs are a fixed list the plan schema enforces, so a rare verb is refused rather than bent.

## 2026-10-23 (8), Claude Opus 5.5
- Changed, routing: a BodyCheck whose own verb is one of seeing goes to Look, by present-day meaning from VerbNet 3.4's perception classes (35 verbs; `verbs.ts`), not by word roots (discern < cernere "sift"; observe < servare "watch, keep safe", not servire "serve"). Before, a nine-word list let watch, observe, glimpse, discern, make out and espy run as 50 % checks on the narrator's share. Only the task's own verb counts: "pick the lock and look inside" stays BodyCheck's. The router's lemmatiser moved to `verbs.ts`, shared by both.
- Fixed, checking: the test harness seeds the chat salt and `Math.random`, so a run gives the same result every time (`RULES_TEST_SEED=<n>` or `random` for other samples). Five statistical checks sat 2–3 SD from their measured rates: 4 of 20 runs failed (breath hold twice, swim shares, intentions; misinformation and Choose failed once each in other runs); each now draws 80 to 120 and sits about 4 SD out or more.
- Checked: tests/route 60, frame 34, engine 121 (1 new), plan 58, size 9 of 9, all 0 misses with the fixed seed, and engine and plan 0 misses under 40 other seeds and 5 fresh samples; 58 of 58 negative controls caught; tools/prompt-audit.mjs reports the same as before.
- Next: as in docs/superset-models.md; searching (VerbNet search-35.2: search, comb, scour) still runs as BodyCheck where the router sends it to Look.

## 2026-10-23 (7), Claude Opus 5.5
- Changed, the engine itself: the crowd model works each pair of people out once (equal and opposite), leaves out pairs too far apart to push (under 1.1 N) and walls out of reach: 4.2 × faster, with the same outcomes over 6 seeds × 5 crowds (flow at 0.8 m/s 0.67 → 0.64 ± 0.03 a second, 5 m/s 41 → 42 of 100 out). The crowd draws from its own stream seeded by one draw: a 100-person exit had put 2.9 million draws (56 MB) into the chat's metadata; now about 100 (2.5 KB).
- Changed, sensitivity: a judged value counts as used once it can change the result (`peek`, `reaches`, and the crowd's own points: the first pressure past 1600 N/m, a dose that could kill at some value in the ranges, a person locked 2 s at the door), so a calm crowd is not rerun over the asphyxia values; a costly result is kept with the values it read (`memo`) and given back on a rerun that varies another. Ten more judged values registered with ranges (breath-hold spread, minutes to double the odds on a task, dehydration onset, meal size, swim-skills share, a feat's try-to-try spread, lift-grip correlation, conformity to one, the crowd's jostle and courtesy); every judged value now carries a range holding its value (99 constants).
- Changed, odds: the factors on a BodyCheck sit in one list (`ODDS_FACTORS`): applied, multiplied and named from it; a concussion is named as such.
- Fixed: a trade word that names the sex fixes it (maidservant, waitress, serving woman; potman, watchman): the census's domestic servants include men, so a maidservant came out a man about one time in twelve (the plan test failed one run in twelve on it). The Choose test's bounds moved to about 4 SD (it failed about one run in 170).
- Fixed, checking: the tests set `process.exitCode` instead of calling `process.exit()`, which could cut output still queued for a pipe (the MISS lines among them); the negative controls are in the repository (`tests/negative-controls.json`, `npm run negative-controls`), read each run's output from a file, and are a step of AGENTS.md's checks. `Person` has `country` and `fireHeat`, so three casts went.
- Checked: tests/route 60, frame 34, engine 120 (7 new), plan 58, size 9 of 9, all 0 misses; 56 of 56 negative controls caught (`npm run negative-controls`); tools/prompt-audit.mjs reports the same as before; constants doc regenerated (99 constants, 306 unregistered tags).
- Next: as in docs/superset-models.md (the Pulse body engine); the 306 [ASSUMED] tags still in comments move into the registry module by module.

## 2026-10-23 (6), Claude Opus 5.5
- Changed, alcohol: a drink is absorbed from the stomach over the next hour (peak at about 45 min fasted; with a meal earlier and a quarter lower, Jones 1991), then eliminated, faster just after a meal; the status shows how much is still to come. Before, a drink raised blood alcohol at once.
- Changed, swimming: who can swim is drawn from sex and country (World Risk Poll 2019 by region, × the US self-report-to-skills ratio 0.56); before, 46 % for everyone.
- Checked: tests/route 60, frame 34, engine 113 (2 new), plan 58, size 9 of 9, all 0 misses; 46 of 46 negative controls; tools/prompt-audit.mjs reports the same as before.
- Not reached: the country table of the World Risk Poll swimming report (the OECD PDF is closed to fetching); regions outside the four the Gallup summary gives take the world's shares.

## 2026-10-23 (5), Claude Opus 5.5
- Changed, judging lies: knowing the speaker before (+1.8 points either way), an expert listener (−3.4 believed), a speaker with much at stake (−3.8 believed), from Bond & DePaulo 2006; Communicate records who has heard whom.
- Changed, seeing: Look takes the figure's clothing and its background (Weber contrast of reflectances: clothing by Munsell value, grounds from Page & Lebens), and how long the viewer looks (one try per 6 s).
- Changed, tasks: heat (WBGT) and cold of the surroundings move alertness tasks (Pilcher et al. 2002); WorkOut places a character among the students of each norm by that study's year (Uttl et al. 2024: z 0.41 in 2003, 0.24 in 2016, not 1).
- Sourced or closed: the indoor daylight factor 1.5 % is BS 8206-2's living-room minimum; when a side breaks in battle has no casualty breakpoint in the data (Clark 1954: 1 % to nearly 100 %).
- Checked: tests/route 60, frame 34, engine 111 (4 new), plan 58, size 9 of 9, all 0 misses; 44 of 44 negative controls (one control pattern updated after the shading change); tools/prompt-audit.mjs reports the same as before.
- Not reachable this pass: recovery from sleep debt (Kitamura et al. 2016, the page could not be read); muscle glycogen refill rates (pages blocked); footstep levels by gait (no published levels found).

## 2026-10-23 (4), Claude Opus 5.5
- Closed, from sources found: a child's top speed (boys' measured shares of the 18-year-old's, Bleeker & Siener 2025); the breath held on going under by water temperature (Hayward et al. 1984: 19 s at 5 °C to 38 s at 25 °C; before, the 11 °C value everywhere); handgun shots by distance and target size (BodyCheck `shot_m`: spread fitted to NYPD 2011 distances and 30 % of shots hitting, RAND 2008); the light on the one seen across an open doorway now has its test; take-off speed bounded by elite data (Linthorne 2007: about 0.81 of top speed).
- Closed as left out on purpose, with the finding: fear on seeing and hearing (threat shortens visual response latency, Laretzaki et al. 2010; no threshold effect); animal drowning (dogs 64 % to discharge, cats 0 of 3, Heffner et al. 2008, used as a check); the crowd's injury onset (replications differ from the original too, Lakoba et al. 2005).
- Still open, with what blocks it: rates for unfair lineups (Fitzgerald et al. 2013, behind a paywall); exposure time (only long-versus-short means, Bornstein et al. 2012).
- Checked: tests/route 60, frame 34, engine 107 (4 new), plan 58, size 9 of 9, all 0 misses; 40 of 40 negative controls; tools/prompt-audit.mjs reports the same as before.

## 2026-10-23 (3), Claude Opus 5.5
- Fixed, logic: every factor on an alertness task now reaches it. `a * b ? c : d` reads as `(a * b) ? c : d`, so since the dehydration term was added, drink, lost sleep, concussion, hours on the task and thirst had all been left out of every alertness task (BodyCheck, WorkOut and any check that uses alertness); each is now its own factor.
- Fixed, logic: time on a task counts any activity at 1.5 MET or more, stops for a character listed at rest or at a break-kind activity (before: only walking, swimming or the `active` list counted, at rest too); the typical mood of an activity is shown only while awake and conscious, running and "service" no longer match exercise and worship; an ally never raises conformity and is taken off a counted majority; a later day for the foot in the door is the next calendar date (was 12 hours); seeing someone on the map takes the light on them, not on the onlooker; tracked people inside a room that empties through one door get their own end (out, crushed with an injury, dead); a child's jump asks for shares (the norms start at 20); the lift's grip z is drawn and kept.
- Checked: tests/route 60, frame 34, engine 103 (5 new, each failing on the old logic), plan 58, size 9 of 9, all 0 misses; 36 of 36 negative controls caught; tools/prompt-audit.mjs reports the same as before.
- Open: a child's top running speed is still the adult's (no child sprint norm on record); drowning outcomes are the human cohorts' for every creature.

## 2026-10-23 (2), Claude Opus 5.5
- Changed, persuasion: SocialResponse decides a bigger favour after a small one (foot in the door, Burger 1999, by who asks and when; the small favour is kept and read back) and a small favour after a refused large one (door in the face, Feeley et al. 2012: more yes than follow-through).
- Changed, drowning: a drowning person brought out comes through by the time under water (ILCOR 2020: 87.7 % to 5.5 min, 18.7 % to 10, 3.7 % to 25, none after); before, taking them out restored breathing at once, and the 5-minute apnea clock killed them in the water by about 6 minutes under.
- Checked: tests/route 60, frame 34, engine 98 (2 new), plan 58, size 9 of 9, all 0 misses; each new check misses when its rule is reverted (31 of 31 overall); tools/prompt-audit.mjs reports the same as before. Crowd onset retried with random start positions: unchanged (2 m/s: 33 of 200 crushed).
- Searched and left open: handgun hit rate by distance (police reports give distances and per-incident hits only); an adult breath-hold norm after a normal breath; unfair lineups (Fitzgerald et al. 2013 gives directions, no rates in the abstract).

## 2026-10-23, Claude Opus 5.5
- Changed, minds: WorkOut problems take fear into account (anxiety and working memory, Moran 2016: odds × 0.55); sadness stays out as a measured null; the answer says when fear weighed.
- Changed, eyewitnesses: Look keeps the viewer's fear and a weapon in view with the sighting (`weapon_in_view`); lineups weaken the memory for fear (Deffenbacher 2004), a weapon (Steblay 1992) and a face of a people the witness has seldom met (`other_group`, Meissner & Brigham 2001), each fitted to the measured fall in culprit picks; sequential lineups (`sequential`) with the criterion fitted to Steblay 2011, the culprit-present rates as a check (40.5 % against 44 %).
- Changed, crowds: death by compressive asphyxia from the force on the chest and its duration (Hopkins et al. 1993: 6,227 N for 15 s, 1,112 N for 4–6 min); a crowd packed past the model's discs is spread back from the exit (people no longer start overlapping and crushed); Room reports the dead apart from the crushed.
- Checked: tests/route 60, frame 34, engine 96 (4 new), plan 58, size 9 of 9, all 0 misses; each new check misses when its rule is reverted (4 of 4, 29 of 29 overall); tools/prompt-audit.mjs reports the same as before. Crowd injuries against Helbing's Figure 1c: onset here by 2–3 m/s for 200 people, the paper's near 5 m/s; robust to jostle, speed cap, friction cap and averaging time.
- Next: why injuries start earlier than in Helbing's Figure 1c (start positions, people reaching the exit wall at full speed); fear on seeing and hearing; unfair lineups and exposure time; a source for take-off speed as a share of running speed (none found: elite approach speeds 9.8–10.9 m/s, take-off speeds not reported).

## 2026-10-22 (4), Claude Opus 5.5
- Changed, choices: Choose options take a kind (fight, flee, risk, play safe, help, talk); the chooser's traits, fear (d 0.30), anger (d 0.54 men, −0.21 women) and blood alcohol (d 0.61 at 0.08 %) move the share as log odds of 1.81 d; fighting and running drop out when the body cannot stand; the answer names what weighed.
- Changed, bodies: BodyCheck takes jumps across a gap (`gap_m`, `run_up_m`) and lifts from the floor (`lift_kg`) from the body: adult jump norms by sex and age as a projectile with the person's own top speed, lifting capacity from the Liberty Mutual tables; alertness tasks fail more often with minutes on the task and hours since sleep (Folkard & Lombardi) and with dehydration (Wittbrodt 2018; hand tasks too); hunger and pain are left as measured null effects. Food beyond the need is kept as a surplus and puts weight on by the same partition; starvation also kills at a lethal BMI drawn once (men 13, women 11).
- Changed, people and places: conformity to a wrong majority by its size, an ally, sex and the study year (Asch; Bond & Smith 1996), the majority counted from the map; eyewitness lineups as signal detection fitted to Steblay et al. 2011, the memory from the witness's Look at the face and faded by the hours since; Room gives the time for a crowd to get out of one exit, its flow and the crushed, from Helbing's social force model run in code (`exit_width_m`, `exit_pace`); the body status names the typical mood at the activity (Kahneman et al. 2004 DRM).
- Checked: tests/route 60, frame 34, engine 92 (9 new), plan 58, size 9 of 9, all 0 misses; each new check misses when its rule is reverted (9 of 9); tools/prompt-audit.mjs reports the same as before; crowd flow at 0.8 m/s 0.67 a second against the paper's 0.73; lineup model 52 % culprit picks, 54 % picks from culprit-absent lineups, high-confidence accuracy 97 %.
- Next: an effect size for sadness on effortful thinking and fear on attention (Look, Listen, WorkOut); crushing at 3–5 m/s may run high (averaging time assumed); sequential and unfair lineups, other-race faces; a source for take-off speed as a share of running speed.

## 2026-10-22 (3), Claude Opus 5.5
- Changed, body: a drink spreads through the drinker's own body water (Watson 1980: by sex, age, height and mass) instead of 0.68 of mass; alertness follows the clock as well as hours awake (three-process model, Ingre et al. 2014), keeping Dawson & Reid's 0.05 % at 17 h and 0.10 % at 24 h for the protocol it came from, and [BODY] gives the felt sleepiness (KSS); a food deficit takes body mass (glycogen and water first, then fat and lean by Forbes's partition at Hall's energy densities) and eating gives it back.
- Changed, memory: every encounter with a fact counts toward keeping it (ACT-R base level, d = 0.5; same-day repeats count once); a list heard once is kept to the listener's working-memory span (Cowan: 2–6, about 4), first and last items; WorkOut decides whether a character remembers to do what they meant to (73 % with the cue in front of them, 18 % without; Scullin et al. 2010).
- Changed, people: SocialResponse decides how much a stranger is trusted and how much is given back (Johnson & Mislin 2011, by country), whether a false detail told after an event replaces what was seen (47 %, all of it once the event is forgotten; Loftus 2005) or a made-up past event takes hold (30 %), and whether a person condemns an act outright (WVS wave 7 shares by country, from 2000); PlaceProfile adds WVS trust and religion; traits are drawn around the mean of the character's sex and age (IPIP-NEO-300, 117,275 adults), country left out (it explains ≤ 2 % in 1,015,341 IPIP-FFM records, and intellect differences there follow the English items).
- Changed, places and bodies in history: homicide before the national series from Eisner 2003 (Europe from the 13th century); survival up to 1900 with no table from the pre-industrial schedule; American BMI from Fogel's 1850 man (22.9) to 1975; Danish and Norwegian heights before Clio from Floud et al. Table 1. Acclimatization rises 500 m a day, the WMS pace (Luks et al. 2019), not 457 m.
- Changed, senses and words: Look takes a water range under water (Duntley's law is the air's); roman.ts drops apical, laminal and creaky marks, doubles fortis and long marked vowels whole (99.97 % of PHOIBLE 2.0 segment occurrences now in Latin letters, from 94.7 %).
- Checked against the uploaded sources (values in the code agree): Henrich Table 2 (25/79, 29/467 recomputed from the group rows), Coburn 1965 (DL, Vco; the code's M 218 is the later Haldane constant, Coburn took 250: noted), Cheuvront (2 %), Gutierrez Table 1, Tobler's hiking function (OCR of Figure II), Verduyn Fig. 1 (all 27 medians read from the page image), Dodds Table 2, Johnson's criteria (OCR of Table I: 1.0, 4.0, 6.4), Hajnal (OCR misreads Bulgaria 58 as 38; the page image shows 58, as the code has). Cold water: the engine's JOS-3 takes a nude young man afloat in a calm 10.7 °C sea to 30 °C core in 3.2 h, Tikuisis 1997's 3.2 h (rough sea 6.1 °C: 2.0 h against 1.7).
- Checked: tests/route 60, frame 34, engine 83 (18 new), plan 58, size 9 of 9, all 0 misses; each new rule's check misses when its rule is reverted (16 of 16); tools/prompt-audit.mjs reports the same as before. The source ledger is in credibility-edits.md.
- Next: weight gain past the day's need; death by starvation set against mass lost (the deficit clock now dies with 16–23 % of a 70 kg man's mass gone; a source on mass lost at death is needed); de Vries's urban shares 1500–1800 (the upload is the book's preview); Riley's regional life expectancies (the upload is a book review).

## 2026-10-22 (2), Claude Sonnet 5.5 and Claude Opus 5.5
- Changed, light and sound: twilight no longer jumps; moonlight depends on phase, altitude and air mass (Krisciunas & Schaefer 1991) on level ground; daylight follows the Sun's altitude and a clear-sky index (Haurwitz; 113 lm/W, CIBSE); seeing fades with distance by Koschmieder's law instead of stopping at the visibility; looking for `seconds` gives up to 10 tries; the chance of hearing is Φ(margin ÷ 3 dB) and Listen draws against it; BodyStrike hears the attacker over a `background` with the same rule (before: anything above 25 dB).
- Changed, clock and cloud: the story clock is the place's civil clock (zone.ts: IANA zone from Open-Meteo, historical offset from Intl; local mean time before standard time or offline). ERA5 days are read in Unix time for three days and set on that clock (the API applies one fixed offset to every date), with hourly cloud cover and irradiance; the hour's light reads them (Kasten & Czeplak for cover). Days without hourly cloud take a dry-day 0.89 or wet-day 0.55 index fitted to the 28 WGEN station tables; wind and humidity are the hour's.
- Changed, bodies and minds: a knockout or choke lasts a drawn time and a knockout leaves the person concussed (alertness odds × 3, halving every 12 h) [ASSUMED values, OPEN-81]; an appraised feeling stays in [BODY] for a drawn time with the measured median; height falls after 40 (Framingham); walking speed runs smoothly with age and scales with √height.
- Changed, perception from the scene: Act lists under [PERCEIVED] who hears the actors' footsteps and who sees them, from the map, walls, background and light; a room's crowd (Room `people`) makes Rindel's noise; rooms are lit by their flames and windows, and no light is no sight; eyes take up to 40 minutes to adapt after brighter light; acuity falls after 55; in a fight, with no `lit`, the light at the target decides whether the attacker is seen, and a gesture whether it is made out.
- Changed, minds and people: forgetting runs faster for mundane events and slower for poignant ones; WorkOut uses the character's own ability when the story gives none; an order to hurt someone takes its circumstances from where the victim is, and an emergency counts the onlookers on the map.
- Changed, from the uploaded sources: seeing needs the target's contrast to pass Blackwell's 1946 threshold for its size and the light (one try = a 6 s look), so dark targets are lost at tens of metres in starlight and hundreds under a full Moon; a feeling lasts longer when the event is central and for women (Verduyn & Lavrijsen 2015).
- Checked: tests/route 60, frame 34, engine 65 (26 new), plan 58, size 9 of 9, all 0 misses; the 26 new checks miss on the earlier code; tools/prompt-audit.mjs reports the same as before. Values seen: Lisbon 21 June 2020 sunset 21:00 civil, 19:24 solar; Évora 1850 offset −0.527 h; largest one-minute change of light 1.22 times; full Moon overhead 0.261 lux; footsteps behind at 4 m: dodged 300/300 in a quiet room, landed 187/300 on a busy street and 300/300 in a loud room; distress durations uniform in their draws (median 0.487); a man 170.04 cm at 40 is 167.34 cm at 70; gait 4.945 / 4.950 km/h at 29.9 / 30.1 years.
- Next: run the ERA5 and zone calls in SillyTavern once (the API could not be reached from the build machine; the reader was checked against a reply in the documented format). Waiting on sources: adult jump and maximal-lift norms for BodyCheck tasks (E26; found only children's jump norms and acceptable-load tables), ISO 7029 coefficients (E19), cue effect sizes for lies (E36), BMI by age (E50), given names outside the US (E48), smoke yield of fires (E15), fog from humidity (E12). The luminance-dependent contrast threshold needs a target-size term (E07).

## 2026-10-22, Claude Sonnet 5.5
- Changed: the rule files. AGENTS.md now matches the repo (npm test and the five files in tests/ are the checks; prompt-audit is a step; one comment-density rule; progress.md read = top 3 entries). exact-voice is grouped under Grice's four maxims with defined terms, an evidence-level scale and one Sources rule; the language section is removed; CLAUDE.md imports AGENTS.md and exact-voice. The emotion appraisal levels ("not at all / somewhat / a great deal") now name their criterion ("nothing at stake / a goal, standard or taste is touched / central").
- Checked: tests/route 60, frame 34, engine 39, plan 58, size 9 of 9, all 0 misses; tools/prompt-audit.mjs "defined against something" hits 7 → 6 (Appraise.matters), modern-example hits 9 → 9.
- Next: docs/features.md starts mid-sentence (its head is lost); restore it from git history.

## 2026-10-19 (6), Claude Opus 5.5
- User's log: Act now called for stepping out (front door → street 5 m, 3.5 s; clock 12:42:03), the checker gets the clock, the narrator's "a quarter to one" matches it. BodyEnvironment failed on the garment "dress (long sleeve, long)": the error listed the first 30 of the garment list, none a dress. Changed: an unknown value in a long list now gets the 10 nearest options by shared words (here the long-sleeve gowns and shirtdresses), so the call can be corrected.

## 2026-10-19 (5), Claude Opus 5.5
- From the user's log ("I step out of my house onto the streets of Paris"): the planner called Weather and Look but no Act, so the clock did not move, and the narrator invented clock times ("half past three", "seventeen minutes past three by the church clock"). Changed: the planner is told that moving in the scene or changing posture → Act; the narrator is told the time of day is [TIME]'s and durations come from Act or PassTime; eval scene 58 tests it.

## 2026-10-19 (4), Claude Opus 5.5
- Narrator with low reasoning effort (set in SillyTavern's Additional Parameters): a reply in about 15 s.
- Found in the user's log: the reply checker had no story clock and its JSON tool list lacked Act, so "at half past three" and "the bell rang the three-quarter hour" went unchecked. Changed: the checker gets the engine's clock and may flag Act events.

## 2026-10-19 (3), Claude Opus 5.5
- Eval in Termux (tools/run-eval.mjs, NVIDIA, GLM 5.3, reasoning low, same two steps as play): 10 scenes in 6 min, 9 fully correct, tool precision 90.9 %, recall 100 %, arguments 100 %; the one miss is an extra Communicate beside SocialResponse in scene 8. Before, in the browser at the model's default (maximum) thinking: about 15 min per scene, 3 of 10.
- Changed: the engine's own calls (question pass, rule check, /rules-eval) send reasoning_effort (setting, default low) as a field and in chat_template_kwargs (and in the custom source's extra body). The narrator's own replies are SillyTavern's and keep their settings.

## 2026-10-19 (2), Claude Opus 5.5
- Changed: the magic tool (CastSpell) and the "network" magic line of the status are shown only when the world book has an entry about magic (kind or name: magic, spell, sorcery, wizard, witch, mana). Reason: magic has no lower layer in the engine (stages and costs set by hand, derived from nothing), so it is offered only where the story says it exists; it also took space in every tool list.
- Open: magic built on the physics layer (a spell's effect costed in energy by the same rules as heat, motion and chemistry, paid from the caster's body).

## 2026-10-19, Claude Opus 5.5
- Eval result from the phone (GLM 5.3, 10 scenes): 3 of 10 fully correct; tool precision 100 %, recall 30 %, arguments 26.9 %, quiet 100 %; missed BodyStrike 0/2, Listen 0/1, Look 0/1, SocialResponse 0/3.
- Found: /rules-eval showed every tool's arguments in full (about 15,000 tokens, grown by the new tools), while play first picks the tools and shows only those in full. Changed: the eval now takes the same two steps as play and reports when the picking step left a needed tool out.
- Next: rerun /rules-eval 10 and read the per-scene lines to see which step misses.

## 2026-10-18 (36), Claude Opus 5.5
- Added: event moments inside the minute for thirst, exhaustion and core temperature; fragility census tool over six scenes (four judgements found to decide outcomes: wood CO yield, doorway coefficient, doorway minimum ΔT, charcoal carbon share).
- Not done: a full event queue; calibration against population statistics (needs base-rate data per rule); narrator tool-use score (run /rules-eval in SillyTavern).

## 2026-10-18 (35), Claude Opus 5.5
- Added: docs/constants.md now also lists every assumption still written only in a comment (187 tags across the rules, file and line), the to-do list for the registry; apnea death time (5 min, range 4–10) and the heat-death ceiling moved into the registry, so suffocation outcomes are checked for fragility.
- Not done: the other 187 tags (most are rule shapes, not single numbers).

## 2026-10-18 (34), Claude Opus 5.5
- Added: tool Layout, the map under the spots: positions and room outlines; walking distances, stairs between floors, room sizes, room membership, hearing through walls and sight between rooms now come from the plan; a recorded distance shorter than the straight line is refused.
- Checked (harness): voice through a wall vs an open door; sight blocked between rooms; stairs added between floors; a too-short distance refused.
- Not done: walls as segments (sight lines across a room's corner), outdoor maps from coordinates.

## 2026-10-18 (33), Claude Opus 5.5
- Added: the 28 precomputed Pulse runs wired in as tool Dose (per-kg dose, log-dose interpolation, engine rules for breathing and consciousness; thresholds registered with ranges).
- Checked (harness): courses run minute by minute, apnea rule takes over where breathing stops, history replays exactly.
- Not done: rescue breathing or ventilation as treatment, two doses at once, beyond 90 min.

## 2026-10-18 (32), Claude Opus 5.5
- Added, system level: (1) laws checked after every call (time forward, dead stay dead, physical bounds, items conserved, no distance longer than a detour); a breaking call is refused. (2) Event moments placed inside the minute (blood loss and carbon monoxide thresholds). (3) Walking takes the shortest route through recorded spots. (4) Constants registry with status and range; every call rerun at the range ends and marked "Fragile" when its outcome changes. (5) docs/constants.md generated from the registry.
- Checked (harness): a detour violation refused; a CO faint at 64 min 48 s shown fragile on the wood CO yield; earlier scenarios unchanged.
- Not done: a true event queue; map coordinates; moving older constants into the registry.

## 2026-10-18 (31), Claude Opus 5.5
- Added: open doorways between rooms; gases flow through them by the doorway exchange formula (Brown & Solvason), conserving the gas.
- Checked (harness): a charcoal brazier in the kitchen kills a sleeper in the next room within 2 h through an open door.
- Not done: heat and smoke layers through doorways.

## 2026-10-18 (30), Claude Opus 5.5
- Added: a room fire's heat and smoke. Heat from the fuel's atoms; an open door feeds and caps the fire; hot-layer temperature by the standard fire-engineering formula (MQH), smoke filling a closed room (Yamana–Tanaka), flames out at 15 % oxygen, flashover at 600 °C; people below or inside the layer get its air and radiant heat.
- Checked (harness): 482 kW wood fire in a parlour with the door open, layer 376 °C at 10 min, the man below it burned by radiant heat; closed cellar smokes down in 10 min, fire out at about 25 min with CO 2,500 ppm.
- Not done: soot and irritant gases, gas flow between rooms, wall linings beyond concrete checked.

## 2026-10-18 (29), Claude Opus 5.5
- Added: vapour pressure for 1426 compounds; flash points derived from vapour pressure and the lower fire limit (used when unmeasured, and to check measured ones); liquid mixtures by UNIFAC from their groups of atoms: boiling point, first vapour, flash point. Substance reports them.
- Checked: derived flash points median 4.1 K off on 236 compounds; UNIFAC equals thermo's to 4 digits; ethanol–water flash points within 1.7 K from 30 to 96 % (dilute ones 5–12 K low).
- Not done: kerosene and petrol as compound sets; dilute aqueous flash points.

## 2026-10-18 (28), Claude Opus 5.5
- Added: stairs (up and down) and crowd density in Act, from the SFPE emergency-movement model; climbing is also held to what the person's aerobic power allows.
- Checked: man of 35 climbs a storey in 10 s (0.51 m/s along the stair), woman of 75 at 0.18 m/s; a crowd of 2 per m² cuts speed to 55 %.
- Not done: doors, doorway flow, contention.

## 2026-10-18 (27), Claude Opus 5.5
- Added: tool Room. A room's air moves minute by minute (CO, CO2, O2) from what burns in it (by the fuel's atoms) and who breathes in it, with the house leak rate drawn from US measurements; people whose spot is the room breathe it.
- Checked (harness): charcoal brazier, 30 m³, sleeping man: unconscious at 50 min, dead at 59; hand calculation agrees within the leak.
- Not done: heavy and light gases layering, smoke and heat, CO2 effects, flow between rooms, outside CO2 by year.

## 2026-10-18 (26), Claude Opus 5.5
- Added, borrowed from three projects: (1) every change of the world stored as a diff with its call and draws; /rules-replay rebuilds the state from them and catches changes made outside the tools (Orchestrated Reality). (2) Act times several characters on one clock with a merged timeline (Thing' Sandbox). (3) [KNOWS] picks each character's facts by recency + importance + relevance (Generative Agents); RecordFact takes importance 1–10.
- Checked (harness): replay exact over 6 changes, a hand edit caught; café timeline Marie 3.5 s, John 8.2 s; memory keeps an old relevant fact and an important one, drops old meals.
- Not done: contention (two actors for one door), embedding relevance, Concordia-style components.

## 2026-10-18 (25), Claude Opus 5.5
- Added: tool Act. Characters have a recorded spot; walking between spots takes distance ÷ their own speed, posture and hand motions take MTM-1 standard times; the clock moves by exactly those seconds (hh:mm:ss) and bodies run alongside. Distances are recorded once and reused, so leaving from the doorway is shorter than from the bedroom. The audit flags times the narrator invents.
- Checked (harness): bedroom → street 42 s, doorway → street 29 s, 1.5 km 18 min; a later different distance is refused; MTM pace and gait speed agree (0.77 m step).
- Not done: doors and stairs as steps, simultaneous actors, sound travel, layouts from building data.

## 2026-10-18 (24), Claude Opus 5.5
- Added: solid fuels from their elements (wood, peat, lignite, coal, refuse), with water and ash; mixtures of compounds by mass. Substance takes both.
- Checked: heat from elements within 3 % of 5 measured fuels, median 2.7 % on 74 compounds; wet wood 8.0 vs 7.7 MJ/kg measured.
- Not done: mixture boiling and flash points (vapour pressures); kerosene, petrol as sets of compounds.

## 2026-10-18 (23), Claude Opus 5.5
- Added: 3796 compounds with measured physical data (boiling, melting, flash and ignition points, fire limits, heat of formation), each checked against physics and against its structure; boiling points estimated from structure where unmeasured (Joback + Stein–Brown); new narrator tool Substance.
- Checked: structure reader on 3381 compounds, no errors, formulas all match RDKit; boiling estimate mean error 21.8 K on 1854; heats of burning from two independent sources agree to 0.01 % (61 compounds); 14 contradictions and 194 suspect values found in the data.
- Not done: mixtures (kerosene, wood) as sets of compounds; salts, metals; pressure.

## 2026-10-18 (22), Claude Opus 5.5
- Added: molecular structure (SMILES) per substance; the engine counts the atoms, finds rings and groups, and derives boiling and melting points, heat of formation and heat of burning (Joback). Records whose formula disagrees with their structure are refused; peroxide bonds are reported.
- Checked: same atoms and groups as RDKit + thermo on 79 + 41 of 43 molecules (2 deliberate differences); heat error median 0.4 % (oxygen rule 1.6 %); now catches the 1-butanol misprint the formula alone missed; 3 contradictions, 6 suspect.
- Not done: S, P, salts, metals; measured boiling points to check predicted states.

## 2026-10-18 (21), Claude Opus 5.5
- Added: substance records checked against their atoms (§6.19): molar mass, oxygen demand and heat of burning from the formula; records that contradict it are refused, gaps filled from the family. Food energy from carbohydrate, protein and fat (Atwater) with hard limits; alcohol now counts 7 kcal/g.
- Checked: 79 records, 1 contradiction (propyne, a misprint in the source), 5 suspect; leave-one-out error 1.8 %; harness BodyIntake refuses impossible foods.
- Not done: hazards from structure (needs a structure string per record); sulfur, phosphorus and salts.

## 2026-10-18 (20), Claude Opus 5.5
- Changed: walking pace and walking energy come from one energy model (Load Carriage Decision Aid, Looney et al. 2022) instead of Tobler's curve and Pandolf. Flat-road pace stays the measured gait speed by age and sex; ground and load move it with the cheapest speed per metre; slopes slow the walker until the cost fits the power they can keep up for 2.8 h (fitted to Tobler). Climbs now depend on each person's fitness, age, altitude and blood loss.
- Checked (Node, harness): cheapest speed 1.29 m/s (expected ~1.3); flat 5.16 km/h, +10 % 3.84 (Tobler 3.63), RMS error 0.39 km/h over 0–30 %; 318 W at 5 km/h (Compendium 3.5 MET ≈ 3.9 here); PassTime with walking runs.
- Not done: no downhill speed-up from energy (Tobler's −5 % peak); combat injuries from tissue mechanics next.

## 2026-10-18 (19), Claude Opus 5.5
- Changed: bleeding arteries of the chest and belly also run on precomputed Pulse runs (aorta and trunk muscle vessels, 20 more runs); the neck stays on the rules (Pulse has no carotid). A major chest artery at 450 mL/min kills a man in 12 min; a smaller trunk artery at 120 mL/min in 43 min.
- Checked (harness), compiles with zero errors.
- Not done: each character's own height, mass and age in Pulse (needs a precomputed range of body sizes); every character bleeds as Pulse's standard man or woman [ASSUMED].

## 2026-10-18 (18), Claude Opus 5.5
- Fixed: the narrator described Rio's weather (April 1822) with no engine result; the question pass now adds a Weather call every turn the story has a date and a place, so code decides the sky before anyone describes it.
- Checked (harness, stub model): Rio 14/4/1822 → Weather added, 28 / 19 °C, 0.1 mm.

## 2026-10-18 (17), Claude Opus 5.5
- Changed: a single bleeding leg or arm now reads precomputed Pulse runs (40 runs: 2 sexes × 2 limbs × 10 severities × 60 minutes), so it costs no waiting on the phone; Pulse decides death (a cut femoral artery at severity 0.8 kills a man in 27 min, 2.94 L lost). Live Pulse remains for two or more bleeding limbs, within 60 s per PassTime.
- Fixed: a stopped bleed ended its Pulse track only at the track's end; it now ends at once, and the old vital signs are cleared.
- Checked (harness): the femoral case above; a tourniquet at 4 min holds the loss at 0.66 L. Compiles with zero errors.
- Next: the character's own body (sex is used; height, mass, age not yet), trunk vessels.

## 2026-10-18 (16), Claude Opus 5.5
- Checked on the user's phone (/rules-pulse-test): Pulse runs in SillyTavern; values equal Node's (pulse 75/min, 113/74 mmHg, 360 mL at 2 min). Loading 1.2 s, patient 1.0 s, 31.1 s per simulated minute (Node 8.2 s).
- Changed: each PassTime runs Pulse for at most 60 s of real time (about 2 story minutes on that phone), then the rules continue from Pulse's last flow.
- Next: precomputed Pulse trajectories (60 min, one bleeding limb, by sex, limb and severity) so the common case costs no waiting.

## 2026-10-18 (15), Claude Opus 5.5
- Changed: a bleeding leg or arm artery now runs on Pulse, a full physiology simulation (heart, vessels, lungs, kidneys), compiled to run inside the extension on a phone. Blood flow falls as pressure falls, the heart speeds up, and the narrator gets pulse, blood pressure, breathing and oxygen. Up to 15 story minutes per PassTime are simulated; beyond that the rules continue from Pulse's last flow.
- Checked (Node): WebAssembly matches native Pulse to 0.1 (leg bleed 0.8: pulse 72 → 107, lost 1,577 mL in 10 min); through PassTime: class II at 5 min, class III at 10 min with flow down to 134 mL/min. Compiles with zero errors.
- Cost: 5.8 MB of new files; about 5.5 s per simulated minute in Node, likely 2–3 × that on a phone.
- Next: test on the phone (Worker loading, speed); then trunk vessels and the character's own body.

## 2026-10-18 (14), Claude Opus 5.5
- Tried (not applied): intelligibility for any language pair from one universal representation (ASJP word lists for 6,126 languages, articulatory-feature segment costs), calibrated on Gooskens's 57 minimal-exposure cells. Leave-one-out error 11.8 points at best, r ≈ −0.5; at the 40-word resolution the predictions crowd into 15–35 % (Czech → Slovak 33 % vs 87.5 measured). Recorded with scripts in docs/data/asjp-attempt.
- Next: a representation that carries running speech and cognacy (see df-body-engine.md, Related languages).

## 2026-10-18 (13), Claude Opus 5.5
- Changed: a stranger outside 1881 England now also lives in a household drawn from their country's surveys (UN household database, 187 countries, 1960–2021): its size and type (alone, couple, couple with children, single parent, extended family, non-relatives). Brazil 1990: average household of 4.2, 1.6 % of people alone.
- Checked in the harness: implied household averages match the surveys within 0.03 (Brazil, India); UK 2011 2.50 vs 2.35.
- Next: rooms and building materials need IPUMS (user's access pending).

## 2026-10-18 (12), Claude Opus 5.5
- Changed: a stranger of 15 or over outside 1881 England works or not by the measured employment rate of their sex and age, and works in an occupation group drawn from their country's labour surveys (ILOSTAT, 200 countries, 1969–2025): in Brazil 1990, a woman of 30 works with 51.5 % chance, most often in service and sales (35 %).
- Checked in the harness: draws match the ratios (51.6 % vs 51.5 %). Compiles with zero errors.
- Next: IPUMS (before 1969 and housing) once the user's access is approved.

## 2026-10-18 (11), Claude Opus 5.5
- Changed: a stranger outside England around 1881 gets age and sex from their own country's population in the story year (life table and population growth), not from 1881 England; occupation and birthplace are left to the story. Brazil 1990: median age 23, 35 % children (1991 census about 22 and 35 %).
- Fixed in the check harness: it now loads the start-up data (life tables, Clio, languages) as SillyTavern does.
- Checked: Sweden 1990 median 36 (actual about 38); Japan 2010 median 41 (actual 45; low fertility breaks the stable-population assumption). Compiles with zero errors.
- Next: occupations by country need IPUMS census samples (user's extract).

## 2026-10-18 (10), Claude Opus 5.5
- Checked in a Node run of the real tools (SillyTavern faked, no phone needed): Weather Recife 15 Jul 1990 (ERA5, 29 / 22 °C), Communicate Portuguese → Spanish listener in Brazil ("some words; the gist only", 46.2 %), Claim with past_act, BodySize, PassTime.
- Fixed: walking pace by country used only a character's weather place, so it was skipped for characters without one; it now falls back to the scene's country (Brazil: 4.8 → 3.9 km/h for a girl of 13).
- Seen, not fixed: NewCharacter draws from 1881 England even for a scene in Brazil 1990 (census sampler is job 3).
- Next: IPUMS housing; census sampler.

## 2026-10-18 (9), Claude Opus 5.5
- Changed: in Brazil, Portuguese and the other Romance languages understand each other at shifted shares: a Spanish speaker follows 46.2 % of Brazilian Portuguese (35.7 % of European), a Brazilian 72.5 % of Spanish (after the user's correction: nasal vowels before a stop keep their nasal consonant, grande [ˈgɾɐ̃ndɨ]; 12 words, was 45.6 / 71.9). Built from phonetic distance on 97 everyday words in six varieties, calibrated on the 14 measured Romance scores.
- Checked: distance Spanish–Brazilian 0.507 < Spanish–European 0.595; the fitted line puts Spanish → European at 38.2 / 35.9 against 35.7 measured; fit r = −0.57 / −0.62. Compiles with zero errors.
- User check wanted: the Portuguese columns of docs/data/romance_swadesh_ipa.tsv.
- Next: IPUMS housing extract; Jensen 1989 if found.

## 2026-10-18 (8), Claude Opus 5.5
- Changed: a related language is understood at the score of listeners who had never been exposed to it (Gooskens 2018, minimal-exposure figures), not the score of all listeners, many of whom learned it: a Dane follows 43.8 % of Swedish (was 56.7), a Portuguese 62.0 % of Spanish (was 77.4). Nine empty cells filled by the ratio for the same language heard by others.
- Recorded from the paper's conclusions: 40 % = tentative threshold for a two-language conversation; scores are conservative (no foreigner talk, no time to adapt).
- Checked: the handoff CSV equals the PDF text layer in all 57 bracketed cells. Compiles with zero errors.
- Next: IPUMS housing extract (user approval pending); test of the Buss past-act claim in SillyTavern.

## 2026-10-18 (7), Claude Opus 5.5
- Changed: Claim "something that happened before" takes `past_act`; the act is matched to Buss 1981's 600 acts, and the share of people of the character's sex who had ever done it is the base share, moved by the character's trait (36 % of men had hit someone who annoyed them; 25 % at very low extraversion, 48 % at very high).
- Read by script from the scanned dissertation text (HathiTrust is search-only; no page image): 600 act texts, 600 men's and women's shares; sex checks fit (asking someone out 96 / 75 %, baking cookies 38 / 88 %). Compiles with zero errors.
- Not read: per-act correlations for 544 of 600 acts (scrambled columns); r = 0.12 from the 56 clean ones is used for all.
- Next: Gooskens minimal-exposure rows; IPUMS housing extract.

## 2026-10-18 (6), Claude Opus 5.5
- Checked: a second, independent reading of Der & Deary Table 1 and Pearsons Table II and Figure 19 agrees with the first: 26 of 26 coefficients, 88 of 88 table values, Figure 19 within 0.04 dB. No code change.
- Next: optional user data (Buss & Craik 1981; IPUMS housing; Gooskens all 16 rows).

## 2026-10-18 (5), Claude Opus 5.5
- Changed: reaction time by age and sex now uses Der & Deary's exact formula instead of four points with straight lines between; at 70 a man reacts 1.21 × as slowly as at 30 (was 1.23), a woman of 80 1.64 × (was 1.63). Ages over 85 hold at 85, where the formula stops being trustworthy.
- Checked: the formula reproduces the handoff's 18/45/65/80 values to the ms. Lombard rule against Pearsons Table II (9 places): mean gap 1.1 dB, largest 2.2 dB (train). Compiles with zero errors.
- Next: the Memory CSV section.

## 2026-10-18 (4), Claude Opus 5.5
- Changed: walking pace follows the country's measured pace of life (Levine & Norenzayan 1999, 31 countries): a man of 35 on a flat road walks 6.27 km/h in Ireland, 5.82 in the United Kingdom, 4.16 in Brazil (5.16 elsewhere).
- Checked: cold-water survival without clothes matches Tikuisis 1997's model within 0.2 h: 10.7 °C 3.2 h (3.2), 6.1 °C 1.8 h (1.7), 11.1 °C 2.9 h (2.7). Compiles with zero errors.
- Considered and left: Luks 2019 Tables 1–3 (doses, guideline risk categories and the Lake Louise score bands give no illness probability; the measured AMS rates stay).
- Next: the Senses and Memory CSV sections.

## 2026-10-18 (3), Claude Opus 5.5
- Checked in SillyTavern (Termux, proxy on): London 15 Jul 1880 14:00 gives "rain, 3.1 mm; high 22 °C, low 13 °C; now about 22 °C (20th Century Reanalysis)". The narrator's reply (warm light drizzle, Thursday) matched; 15 Jul 1880 was a Thursday.
- Note: the sandbox fetch gave 5.9 mm for that day; the in-app call used the place's own coordinates, so a neighbouring 1° grid point [ASSUMED cause].
- Next: the four pending CSV sections.

## 2026-10-18 (2), Claude Opus 5.5
- Changed: a normal voice rises in noise (Lombard effect, Pearsons 1977): talking on a busy street now works at 2 m.
- Considered and left: Luks 2019 altitude guideline (doses only, no effect sizes; the measured AMS/HACE/HAPE rates stay).
- Also: defensive reaction scales with age and sex (Der & Deary 2006): 1.23× at 70, 1.63× for a woman of 80.
- Next: the four pending CSV sections; Gooskens minimal-exposure scores need all 16 rows from the PDF (Senses section).

## 2026-10-18, Claude Opus 5.5
- Changed: job 2b done. Real places get the reconstructed weather of the actual day from 1851 to 1939 (20th Century Reanalysis v3 via NOAA PSL), ERA5 from 1940; before 1851 the generator with the Berkeley Earth monthly shift.
- User action needed: enable SillyTavern's CORS proxy (config.yaml `enableCorsProxy: true`, restart) — NOAA sends no CORS header.
- Checked: London 1 Jan 1880 12.4 / 8.5 °C, 3.4 mm; São Paulo 15 Jan 1900 20.3 / 19.6 °C; no data before 1851 from the service. Compiles with zero errors.
- Next: the four pending CSV sections.

## 2026-10-17 (5), Claude Opus 5.5
- Changed: generated weather before 1940 (and whenever ERA5 is unreachable) follows that month's recorded temperature anomaly for the country, 1750–2020 (Berkeley Earth, 143 countries); BodySize gives eye and hair colour in 15 countries (Katsara & Nothnagel 2019).
- Checked: UK January 1963 −5.3 °C, December 2010 −4.5, August 1816 −2.8; London January 1963 mean high 2.7 °C. Eye shares drawn equal the table (Iceland 75.9 % blue in 10,000 draws vs 74.5 / 97.9 normalised). Compiles with zero errors.
- Not applied: Obermeyer 2017 body temperature by age (0.02 °C per decade).
- Next: the four pending CSV sections; job 2b (20CRv3 for daily weather 1836–1939) would replace the monthly shift with real days.

## 2026-10-17 (4), Claude Opus 5.5
- Changed: untreated water can infect (Campylobacter, rotavirus, Cryptosporidium) by source and litres drunk, using WHO concentration tables and human dose-response fits; boiling removes the risk.
- Checked: per-litre infection chances listed in df-body-engine.md §6.3; boiled sewage gives no infection. Compiles with zero errors.
- Ranked gaps the user raised (2026-10-17): (1) water and food infection: done for water; food next (same dose-response, needs food concentrations); (2) buildings: rooms and floor area per dwelling from census housing items (IPUMS/NAPP, job 3); (3) eye and hair colour by region: Katsara & Nothnagel 2019, Forensic Sci Int Genet 39:109 (needs the PDF); (4) resting body temperature by age: Obermeyer et al. 2017, BMJ 359:j5468; (5) inventions depending on others: no dependency source (patent citations only after 1976); (6) websites: narration, out of scope.
- Next: the four pending CSV sections (Body, Senses, Movement, Memory); the two PDFs above.

## 2026-10-17 (3), Claude Opus 5.5 (from the Disease and Emotion CSV deliveries)
- Changed: Claim can decide whether a character has married, from Hajnal's census shares by country, sex and age (37 countries, 1891–1952). Disease tells what a death in a forager or village-farming society was from, by age (Gurven & Kaplan Table 5). SocialResponse: refusing an unfair split (Henrich), punishing a cheater (Fehr & Gächter); obedience to harmful orders scaled down for modern years (Burger).
- Checked: Hajnal values equal the earlier independent read in every row compared; Gurven counts sum to the printed totals. England 1900 woman of 25: 54 % single. Pooled ultimatum rejections 25/79 low offers, 29/467 others. Obedience 65 % (1962) → 55 % (2006). Compiles with zero errors.
- Not used: Bond & Smith (d only), Johnson & Mislin (amounts, no tool for them), Fehr's anger scenarios (two sizes only), Hajnal Table 5 (Riana, small numbers).
- Next: the four other sections (Body, Senses, Movement, Memory) when their models deliver.

## 2026-10-17 (2), Claude Opus 5.5
- Changed: an angry speaker is louder (+4.46 dB) and an affectionate one slightly louder (+1.19 dB), so anger carries further through noise (Kimble, Forte & Yoshikawa 1981, from the J Pers 49(3) issue the user sent).
- Checked and parked: influenza outbreak size. R from Biggerstaff 2014; POLYMOD contact data rebuilt from the socialmixr package and equal to Mossong 2008 Table 1 in all 10 age bands; the model still overstates pandemic attack rates, so it is not used yet.
- Inputs: the J Pers 1981 issue is No. 3 (September); Buss & Craik 1981 is in No. 2 (June, pp. 175–192), so the act-frequency table is still missing. Guillaume et al. 2016 ("The World at 7:00", J Pers 84(4), doi 10.1111/jopy.12176; 5,447 people in 20 countries, Riverside Situational Q-sort) gives how situations differ by country; not wired yet.
- Next: Buss & Craik 1981 from J Pers 49(2); a measured influenza attack rate by age; Luks 2019 altitude by sleeping elevation; Hall 2011 mass drift.

## 2026-10-17, Claude Opus 5.5 (from six handoffs written by Claude Sonnet 5.5)
- Changed: a character acting against their personality now has a measured chance (how often people at their trait level are in that state, Fleeson 2001, × how fitting the act is in the setting, Price & Bouffard 1974); a reason chain raises it. Sleep debt across short nights (Van Dongen 2003). Thirst at 2 % water loss (Cheuvront). Bleeding signs by class (Gutierrez 2004). Falls depend on age (Lapostolle 2005). Walking pace from slope, age and sex when unset (Tobler 1993, Bohannon 2011). Children's grip (Dodds 2014). Activities by name → MET (2024 Compendium, 1,111 rows). 27 emotion words with their own durations (Verduyn 2015). 9 respiratory viruses' incubation (Lessler 2009) and death shares of 10 historical epidemics (Alfani & Murphy 2017). Survival before 1751 from a Siler curve (Gurven & Kaplan 2007). ERA5 1940 start cited (Soci 2024).
- Checked: 6 h × 14 nights → 0.202 % BAC-equivalent vs one night awake 0.214 %; 4 h → 0.402 % vs two nights 0.386 %. Trait-state shares equal the handoff's independent table in all 25 cells; the two Price & Bouffard transcriptions agree in all 225 cells. Siler l15 0.607, l45 0.435 (table 0.60, 0.43). Flat walk 5.16 km/h (man, 35), 10 % uphill 3.63. Fall 15.6 m: 35 / 56 / 79 % at ages 20 / 37 / 60. Compiles with zero errors.
- Not done (reasons in df-body-engine.md): Dupuy battle factors (would count posture twice); influenza attack rate (needs Mossong's supplement and an R0 source); forgetting refinements (all sizes [ASSUMED]); altitude by sleeping elevation (Luks 2019) and mass drift (Hall 2011) left for the next session.
- Next: Luks 2019 altitude risk by sleeping elevation; Hall 2011 body-mass drift; Hajnal marriage shares as the census-sampler fallback; job 2b (20CRv3, download route still unknown).

## 2026-10-13 (2), Claude Opus 5.5
- Changed: job 2 done. For a real place and a story date from 1940 to about a week ago, Weather and BodyEnvironment give the weather that was actually recorded that day (ERA5 via Open-Meteo): high, low, rain or snow, wind, humidity, temperature at the hour. Other dates and fictional places keep the weather generator.
- Checked: London 6/6/1944 high 13.5 °C, low 9.3 °C, 0.8 mm; Moscow 5/12/1941 −20.6/−26.1 °C; São Paulo 15/1/2000 30.6/21.1 °C, 5.5 mm; 2030 and 1900 fall back to the generator. Compiles with zero errors.
- Next: job 1 (BioGears sidecar) needs a computer or a Codespace with build tools; alternatively the 20th Century Reanalysis for 1836–1939 (job 2b), or section 5 of superset-models.md (actions against a character's profile) once papers 84, 87, 99 are downloaded.

## 2026-10-13, Claude Opus 5.5
- Changed: Price answers wages for about 60 more markets in subsistence baskets (Moatsos & de Zwart 2025) and the hourly pay of a named trade in 1953–2008 (Occupational Wages around the World). New tool PlaceProfile gives a country's population, share in towns, murder rate and infant mortality (Clio Infra) and a city's population (Reba et al. 2016).
- Researched and wrote down the replacements for hand-written rules: BioGears for the body, census microdata for people, reanalysis for weather (`docs/superset-models.md`).
- Set up Codespaces + OpenCode so other models can continue (`AGENTS.md`, `opencode.json`, `.devcontainer/`).
- Checked: compiled with zero errors; welder Germany 1980 US$7.07/h; Agra 1699 a year's basket = 63 days of work; Paris 1700 = 530,000 people.
- Next: job 2 in `docs/superset-models.md` (Open-Meteo weather for story dates from 1940), then job 1 (BioGears), then job 3 (census sampler, needs the user's IPUMS downloads).

## 2026-10-19 (7) Act and Look calls from the 1888 London log

- Act refused "actors[0] must be an object": the model listed actors by name or as JSON text. The schema check now reads an object sent as JSON text, and a bare name where an object with `who` is expected becomes `{who: name}`. An actor without steps takes the call's own `steps`; with neither, the call says which actor needs steps.
- Look was called with no distance and nothing on the map. The `distance_m` description now says it is needed unless both are placed with Layout.

## 2026-10-19 (8) The planner corrects its own refused calls

- A London 1899 turn ran no tool at all (no Act, and no Weather because the plan gave no position), so the narrator's drizzle and the step out were unbacked. The 1888 turn lost Act and Look to argument errors with no second try.
- question-pass.ts now sends one repair request (REPAIR) when the plan has no readable JSON, drops a call for a missing required argument (it names the arguments), or leaves out "at" for a dated scene with no position. After the calls run, results the tool refused ("not run; fix and call again", "Nothing recorded") go back once with the tool's own message; a corrected call's result replaces the refusal. Source: tool errors fed back to the model (ReAct, Yao et al. 2023).
- Tested with a scripted model: a Look missing its arguments and the missing position were sent back; the position then gave Weather; an Act with an actor and no steps was refused, corrected and run.

## 2026-10-19 (9) Present-day scenes get today's date

- A modern London turn (bus, delivery van, no date given) ran Weather twice, both refused for want of a date; the narrator then invented the rain.
- The question prompt now carries TODAY (the device's date and hour) while STORY STATE has no [TIME]; QUESTION_SYSTEM: a present-day scene with no date given takes it. A "needs a calendar date" refusal goes back in the repair round with that instruction, and the refused call runs again once the date is set.
- Refusals are no longer kept as the turn's decision (rules-tools.ts `remember`), so a corrected call runs instead of returning "Already decided".
- Weather runs once per turn and an identical call runs once (`dedupe`).
- Act: walk_to with distance_m and no recorded spot starts from "where X stood"; the time needs only the distance.

## 2026-10-19 (10) A date written in the scene sets the clock

- The player had given the date, and the turn still ran with no clock. The clock was set only from the plan's "time", and only from "1899-09-19 14:20" exactly.
- clock.ts `findStoryTime` reads a written date anywhere in a text: 1899-09-19, 19/09/1899 (day first), 19 September 1899, 19th of Sept 1899, September 19, 1899, with the hour written after it (14:20, 2:20 pm, 14h20; noon when none [ASSUMED]). `parseStoryTime` falls back to it, so a plan's "time" in any of these forms is read.
- question-pass.ts: when the plan gives no time and the story has none, the player's message, then the cast and scenario, then the recent messages are searched for a date.

## 2026-10-19 (11) A rewrite starts from the turn's start; a repair adds only what was asked

- London 1867 log: the date was read (24 March 1867, 12:36) and Act, Weather and PlaceProfile ran. Two faults remained.
- The repair round asked only for "at"; the model rewrote the whole plan and its second Act ran too (front door → street, then inside → street: 6.6 s for one step out). A repair now takes every call only when the plan was unreadable; otherwise only calls of the dropped or refused tools.
- The rule check's rewrite (a swipe) ran the turn's calls on the clock the first draft had moved (12:36:07 → 12:36:13). GENERATION_STARTED of a normal turn fires before the player's message joins the chat, so the turn's snapshot sits one place earlier than the swipe looked. The swipe now takes the snapshot at the reply or, failing that, at the player's message. Tested: a rewrite gives the same 12:36:03.

## 2026-10-19 (12) Weather runs first

- Full 1867 log: the same Act walked Mary at 1.43 m/s before Weather ran and 1.62 m/s after. Walking pace scales by country (Levine & Norenzayan), and the country is set by Weather. The question pass now runs Weather calls before the others; tested: 1.62 m/s on the first draft and on a rewrite.

## 2026-10-19 (13) Act in plain words

- London 1951 log: the planner called Act as {"who":["Mary"],"action":"stepping out of her house onto the street"}; refused (who must be text), the repair dropped the action and kept no steps, so no time was decided.
- tool-schema.ts: a one-item list where one value is wanted is that value.
- Act takes `action` (plain words) with `distance_m` for one actor. actions.ts `stepsFromWords`: each recognized verb, in its order in the text, gives its motion (sit, stand / get up, kneel, bend, turn, reach, pick up / grab = reach + grasp, walking verbs = walk_to). The spot is the phrase after onto / into / to / towards / across, else "outside" the place after "out of". Walking without a distance is refused with that reason. Each verb counts once.
- Act's refusals carry an example call in both forms.

## 2026-10-19 (14) Faults found by a runner, not in play

- tools/run-play.mjs plays eight first turns through the whole pipeline with the real model (tool picking, plan, repair, calls, a narrator reply, the rule check) and lists each fault: a refusal left after the repair, no tool run, no clock, no Weather, an expected tool missing, each rule-check flag. Writes play-result.txt (faults first, then each turn with calls, reply and planner answers). The turns are the ones played so far (London 1867, 1888, 1899, present day) and four more (Paris bakery, York inn, Lisbon wall, Rio shout).
- tools/nvidia.mjs: the connection and key lookup the runners share.
- A date the player wrote now wins over the plan's date.

## 2026-10-19 (15) First run-play: 18 faults in 8 turns, causes fixed

- Act refused twice (actors listed without steps, the action given as "actions"): arguments named a little off ("actions", "distance", "Who") are read as the listed one (tool-schema.ts); an actor without steps takes the call's action in words; several texts where one is wanted are joined in order.
- Present-day turn ran no clock: the plan put "time" inside Weather's arguments. A plan's "time" and position are now taken from a call's arguments when the plan gives none (`hoist`).
- Paris turn had no position: a place named in the player's message, cast, scenario or scene now places it (weather.ts `placeIn`, character names skipped).
- Lisbon night read as noon (the dark sky then contradicted the clock): a written part of the day sets the hour (morning 09:00, afternoon 15:00, evening 19:00, night 22:00, dawn 06:00, dusk 18:30, noon, midnight) [ASSUMED].
- Choose options sent as plain texts: a text where an object is wanted fills its first required text field; Choose then asks for the missing shares.
- BodyFall with height "result of the dice roll": the repair note now says a value that depends on another result goes in "then".
- The narrator copied the brief's "*(Climb → SUCCESS)*" example into a bakery scene: the brief now says to write each BodyCheck result as *(its task → SUCCESS / FAILURE)*.
- A 15-year-old baker was "a man": under 18 is a boy or a girl.
- SocialResponse refused a baker's sale as a "small favour": the description says a sale, a served drink or a paid service is the person's trade and goes ahead.

## 2026-10-19 (16) The prompts read for implicatures (Grice)

- Found in the logs: (1) the brief's literal "*(Climb → SUCCESS)*" was copied into a bakery scene (an example token read as content); (2) noise and sound labels carried modern examples ("loud room (television)", "passing vehicle (car at 30 km/h)") and the planner chose them for an 1820 inn and 1888 London; (3) QUESTION_SYSTEM framed the whole job as "outcomes in doubt" and allowed {"calls":[]} "when nothing is in doubt", so a step out of a house (nothing in doubt) got no Act and no Weather, against the later Act rule; (4) the checker read "stood a moment" as a stated duration.
- Changes: QUESTION_SYSTEM names two kinds (outcomes in doubt; facts code fixes with nothing in doubt: an action's time, the weather, items, new people, facts) and {"calls":[]} when the reply states none of these. Sound and noise labels are the class and its level ("loud room (75 dB)"); old labels match by their words before the parenthesis (acoustics.ts `classOf`, tool-schema.ts). The narrator's time rule says where clock times and durations come from and how the rest of time is told. The checker's event list is stated as complete, with what the rest of the reply is, and a stated duration is a number with a unit or a clock time. BodyCheck says what it covers (climbing, jumping, swimming, lifting, forcing, balancing, sneaking, locks, riding, craft tasks) instead of "what no other tool resolves"; BodyWound, Look.light, Choose.options, BodyCheck.override and Act rewritten the same way.
- tools/prompt-audit.mjs lists every prompt and description sentence with a modern example or a definition by negation, for the next pass. The remaining hits are scope conditions ("when the story has not described them") that carry needed information, and option labels taken from their source studies.

## 2026-10-19 (17) Every model-facing sentence stated positively

- Naming a thing to exclude puts it in the model's context and raises its chance (negated prompts: Jang et al. 2022; the "pink elephant" effect: Castricato et al. 2024). tools/prompt-audit.mjs now covers every prompt (planner, picker, follow-on, repair, checker, correction note, narrator briefs, world-book filler) and every tool and argument description; the pattern list adds instead, rather than, except, unless, without, avoid, omit, leave out.
- 37 + 17 sentences rewritten as what the thing is or does: scopes as "new to the story", optional arguments as their default ("Default: the whole part"), the checker's list stated as complete with no list of non-events, the narrator's time rule as where times come from. Left: 5 option values that are category names from their source studies ("not an emergency", "never married").
- The correction note told the narrator to "call" a tool, in a mode where the narrator calls none. Now the rule check's flags go to the question pass (audit-flags.ts): on the rewrite each flagged event gets its tool run from the results so far (tested: a flagged church bell gets a Listen call), and the note says to narrate each as [DECIDED] gives it.

## 2026-10-19 (18) Results say what happens; misses stay silent

- A perception that did not happen (Listen "does not hear it", Look "does not see it") is left out of [DECIDED]: the narrator's silence says it (Grice, Quantity), and naming the missed sound puts it in the reply. The result stays in the turn's results, so the rule check still flags a reply that has the sound heard.
- A flagged event whose tool now returned a miss is left out of the correction note too (the note is built after the question pass, `takeAuditNote`), so the rewrite has no reason to name it.
- Outcomes that matter to the scene are stated as what happens: Communicate "the guard goes on as before; Mara's voice is lost in the background", "hears X's voice; the words are lost in the noise"; Claim "false"; SocialResponse "stays out of it"; Trust "keeps their guard up with"; Sickness "keeps the food down"; tourniquet "the bleeding goes on under the tourniquet"; flash point "vapour catches fire from a flame from X °C".

## 2026-10-19 (19) Sound as a wave in the air the scene has

- The sound model already carried sound as a pressure wave in six octave bands (250 Hz–8 kHz): spherical spreading −20 log10 d, air absorption per band, walls by the mass law per frequency, masking by background noise per band, the listener's threshold per band (SII, ANSI S3.5). Its air was fixed at 10 °C and 70 %.
- acoustics.ts `airAbsorption` computes the air's absorption from its temperature, humidity and pressure (ISO 9613-1: oxygen and nitrogen relaxation, shifted by water vapour); checked against ISO 9613-2 Table 2 within 1 % (10 °C 70 %: 3.7 dB/km at 1 kHz, 33.1 at 4 kHz; table 3.7, 32.8). Listen and Communicate use the listener's air (BodyEnvironment / Weather temperature and humidity). Dry hot air takes high pitches faster: 4 kHz loses 47.5 dB/km at 30 °C 20 %, 20.3 at 20 °C 90 %.
- `soundSpeed` c = 331.3 √(1 + t/273.15): a sound heard from 170 m or more says how long after it was made it arrives (a gunshot at 2 km: 5.9 s at 10 °C).
- Next layers, not built: the source as a spectrum from its physics (a bell's partials, a voice's formants) in place of a flat class; ground effect; refraction by wind and temperature gradients (sound carries further downwind and under a night inversion); diffraction over barriers (Maekawa); reverberation in rooms (Sabine), which lowers intelligibility.

## 2026-10-19 (20) Results stated as the state that holds

- About 90 result and error messages read by the narrator or the planner rewritten as what holds: "is blind (eyes out of action)" for "cannot see (no working eye)", "misses it" for "does not hear/see it" (Listen and Look misses still stay out of [DECIDED]), "loses hold: too heavy", "gets away: runs as fast or faster", "makes its species' own sounds (a speechless species)", "Aim at one of the wolf's parts: …" for "has no part …", "choose from …" for "is not an option", "the blood is clear of infection on record", "Too little PE to cast", "stays calm: too little at stake". The refusal marker "Nothing recorded." is now "State unchanged." (40 places); every text match on refusals (question-pass REFUSED, rules-tools REFUSAL, run-play) follows the new words, and "not run; fix and call again" is "waits: fix and call again".
- Left as they are: option values that are category names from source studies ("almost no one", "never made", "none" as a default value), and internal check output that no model reads (pulse self-test, structure group reasons, substance verdicts).

## 2026-10-19 (21) The wave's way: ground, obstacles, refraction, rooms, tones

- acoustics.ts `Way`, applied band by band in `arriving`:
  - Ground (ISO 9613-2 §7.3.1, Table 3): the reflected wave meets the direct one; G 0 (paved, water, ice) to 1 (grass, fields, soil). Porous ground at 100 m, heights 1.5 m: 12.1, 8.6, 1.1, 0, 0, 0 dB at 250 Hz–8 kHz (the ground dip); hard ground −3.3 dB (louder) in every band.
  - Obstacle (ISO 9613-2 §7.4): Dz = 10 lg(3 + 20 z Kmet / λ), capped 20 dB; the wave bends over the top, low pitches more. A wall 2 m above the line at 50 m: 7.0 to 18.3 dB from 250 Hz to 8 kHz.
  - Refraction: where sound speed falls with height (sunny day: dT/dz; upwind: the log wind profile), rays bend into arcs of radius c/|g| and the last grazing ray reaches r = √(2R)(√hs + √hr) (Embleton 1996); beyond it a shadow loss ramps to shadowDb. Calm sunny day: shadow from 263 m; 5 m/s upwind: from 81 m; downwind and at night: none. dayDTdz −0.1 K/m, nightDTdz +0.05, shadowDb 20 dB registered as assumed with ranges, so outcomes that rest on them carry a Fragile note.
  - Rooms: Sabine T = 0.161 V/A; the reverberant field Lw + 10 lg(4/A); its first 50 ms join the direct sound, the rest counts as noise (Lochner & Burger 1964; Barron & Lee 1988) [ASSUMED: late sound counted as noise of the same level]. Absorption from the room's surfaces × the lining's coefficient (brick 0.03, concrete 0.02, gypsum 0.05, wood 0.10), furnishing 0.1 per m² floor, 0.45 m² per person [ASSUMED typical]. A normal voice at 15 m in a 6000 m³ concrete church: the words are lost; at 3 m in a 20 m² wooden room: most words.
  - Tones: tone_hz puts a tonal sound's energy in its own band (exact for a pure tone, close for a bell's strike note).
- Listen and Communicate take ground, obstacle_m, wind, wind_ms (default: the recorded day's wind), source_height_m, and Listen tone_hz; the sun's height comes from the clock and the scene's latitude; a listener in a Room with the speaker (same room on the map, or no barrier) gets the room's reverberation.
- Communicate's check for a foreign language followed the new result words ("foreign to it").

## 2026-10-19 (22) Second play run: 6 faults in 8 turns (from 18)

- The six: one turn with no Act (1888, plan gave Weather only); four background sounds or sights the narrator added (a dog barking down the road, a red bus in sight) flagged as Listen or Look; one scrape on a failed climb flagged as BodyWound. Two further faults the runner did not count: a bought loaf refused by the item law, and a guard who could not make out a question but "declined" to answer it.
- A motion the player's message names (code reads the verb with `stepsFromWords`) and a plan without Act now go back in the repair round with that instruction; tested: the 1888 plan gets its Act (4 m, 2.5 s).
- The checker counts a sound or sight as an event when it teaches a character a fact or moves them to act; the background sounds and sights of a place are description.
- BodyCheck's ordinary failure now says "the body as it was", so a failed climb has no unbacked scrape to fill.
- The item law: an item enters the story when its giver had none on record (a baker the story has not listed selling a loaf); invariants.ts.
- SocialResponse to a favour, statement or order whose words this turn's Communicate lost: the person answers the voice only and the request waits for a message that gets through.
- run-play counts results with "refused" as faults.

## 2026-10-19 (23) Third play run: 8 faults; Act forms, new people, coins, failed climbs

- Act refused three times in new shapes: actors with their own action, a step written as words, steps nested one level too deep. `prepareAct` (rules-tools.ts) reads all three before the schema check; actor items take action and distance_m; Act's description leads with the plain-words form (who, action, distance_m), steps as the exact form. Walking verbs add carry, bring, fetch, run, hurry; the spot keeps the text's capitals ("Tom's table").
- Every person a call names who is new to the story and outside the cast (and the player) gets NewCharacter first, drawn by code; a role noun is the occupation ("the innkeeper" → Innkeeper, Hotel Keeper, Publican).
- The narrator's "a penny ha'penny" was flagged against "0.69 g of silver": both were right. Price now adds the coins of the place: London by the pound's silver that year (the Lindert/Jastram series behind "value of English money"): 0.69 g in 1820 = about 1½ d; Paris 1803–1914 by the Germinal franc, 4.5 g fine silver: 1.33 g = about 30 centimes. A wage share under a tenth of a day is given in hours of a 10-hour day [ASSUMED].
- A failed climb ended in a narrated drop and scrapes no result backed. BodyCheck takes height_m for a climb: a failure is a slip at a height drawn evenly over the climb [ASSUMED] and the fall from it (fall death chance, then "its injuries come from BodyWound").

## 2026-10-19 (24) Fourth play run: 1 fault in 8 turns

- The fault: an Act whose actor list came as "actions" (refused as "action must be text"); a second Act for the same walk ran. `prepareAct` reads a list of actor objects under action or actions as the actors.
- Found in the turns: the Rio guard of 1822 was drawn as "Railway Guard, born in this county": Brazil 1822 is outside the population tables, and the fallback took the 1881 English census's job and birthplace. Now, outside England and Wales a stated occupation keeps the story's word; its sex and age come from the census's people of that occupation (guards: men of working age), or from working-age people when the census has no match; birthplace is the story's. Where the country's tables exist, a stated occupation draws age and sex kept with the ILO share of that sex and age in work (rejection sampling, 50 tries).

## 2026-10-19 (25) Stories of several turns; distances in words

- tools/run-story.mjs plays three 4-turn stories (Whitechapel 1888: out, to the market, buy apples, home and give one to her brother; a York inn 1820: sit, order, overhear a whisper, tell the innkeeper; Lisbon 1755: climb, drop into the garden, creep to a window, look in) with each reply kept in the chat and the state saved per message, as SillyTavern does. Faults per turn and across turns: refusals left after the repair, no tool, an expected tool missing, the clock running back or standing still after an action, every rule-check flag including facts a character could not know ([KNOWS] passed to the check). Writes story-result.txt.
- actions.ts `distanceIn`: a distance written in the words ("three hundred yards", "half a mile", "fifty feet", "2 km") gives walk_to its distance when none is passed (international yard 0.9144 m, foot 0.3048 m, mile 1609.344 m).
- Open: running is timed at walking pace.

## 2026-10-19 (26) First story run: 12 faults in 12 turns, and what the turns showed

- Clock: a scenario's "a quarter past six in the evening" became 19:00 (only digits and the part of the day were read). clock.ts `wordClock` reads clock times in words ("a quarter past six", "half past three", "ten to nine", "eleven o'clock"), morning or afternoon from the part of the day nearby: 18:15, 15:30, 08:50, 23:00.
- The planner copied the prompt's example time "1850-03-14 18:40" into a Lisbon 1755 call; QUESTION_SYSTEM now names the form (YYYY-MM-DD HH:MM) with no example date.
- Posture: Tom sat down twice; a seated person now sits in no time, and rises (1.6 s, MTM) before walking.
- Words to steps: walking verbs add creep, sneak, tiptoe, crawl, steal, stroll, stride, wander, dash, return; the spot is the phrase after to / into / onto / towards, then across, then home or back, then at / by / near. Creeping, sneaking, tiptoeing and crawling walk at creepFactor × walking speed (0.5, range 0.3–0.7, assumed): 20 m in 28 s.
- A walk home timed twice (PassTime walking and a repair-added Act): the motion repair counts PassTime with walkers as the walk's time.
- NewCharacter: a role noun as the name is the occupation when none is given ("the costermonger" was drawn as a child of 8; now a Costermonger, Huckster, Street Seller from the census).
- A louder second call to the innkeeper returned the first, quieter result: Communicate's decision now includes the effort (raised: lost; shout: the voice heard, words lost).
- Interpret refused fits naming a referent ("the two men"): the listener then takes the word as spoken.
- Purposeful perception: Tom listening for a whisper and Mara listening at the window had their misses left out of [DECIDED], and the narrator filled in half-heard words. A Listen or Look with "reveals" (a perception the scene aims at) now keeps its miss in [DECIDED]; misses without it stay silent.
- The narrator copied the BodyCheck marker onto every result ("*(raised voice … → FAILURE)*"); the brief now says every other result is told in the story's own words.
- "4 pences" → "4 pence".
- Open: rain within the day (the narrator's drizzle easing was flagged against a daily total); running at walking pace.

## 2026-10-19 (27) Constrain the planner's output instead of reading it back

- Every fix since the play runs began has read a malformed plan back into shape (actors as text, actions as lists, steps nested, time inside arguments, field names off by a letter). That is recovering an exact input from a lossy output; the losses recur in new shapes. Constrained decoding removes them at the source: the server masks every token that would leave the output invalid against a JSON schema, so the output is valid by construction (Willard & Louf 2023, "Efficient Guided Generation for Large Language Models", the Outlines method; Dong et al. 2024, XGrammar). NVIDIA NIM documents it as nvext.guided_json; vLLM takes guided_json and response_format json_schema.
- plan-schema.ts builds the plan's schema from the tools' own argument schemas: each call is one of the picked tools, {"tool": its name (const), "args": exactly its arguments, required ones required, enums as enums, no other keys}; time is pattern-checked (YYYY-MM-DD HH:MM). 2.8 KB for two tools, 40 KB for all.
- question-pass.ts sends the schema with every planner request when GUIDED is on (setGuided); the instruction then asks for the JSON alone, the questions living in the model's reasoning. The follow-on and rule-check rounds widen the schema to the tools they add. The readers that repair plans stay as the fallback for connections without it.
- tools/probe-guided.mjs finds which switch the endpoint honours for the model (a schema the model would not follow by itself: {"zebra": 7}). tools/nvidia.mjs sends the schema per EVAL_GUIDED=nvext|vllm|openai. Next: the SillyTavern send path, the tool picker and the rule check, once the probe says which switch works.

## 2026-10-19 (28) Constrained decoding on

- Probe on NVIDIA, GLM-5.3, twice: response_format json_schema and guided_json pass ({"zebra": 7} returned exactly, 1–4 s); nvext.guided_json and nvext.guided_choice are refused (400, unknown field).
- send.ts sends the schema as response_format json_schema (and SillyTavern's json_schema field; through custom_include_body for a Custom source, as JSON, which is YAML). index.ts turns it on at start; a connection that refuses it is asked again without it and plans go back to being read from text for the session.
- Schemas for the three answers code reads: the plan (plan-schema.ts), the tool picker (names of offered tools only), the rule check (events with quote, a listed tool, a listed problem). The narrator writes free text.
- Runners default to EVAL_GUIDED=openai (response_format); EVAL_GUIDED=off for the old path, to compare.

## 2026-10-19 (29) First story run under constrained decoding: 20 faults, one new cause behind most

- No malformed call reached a tool (the shape faults are gone). The new failure: under constrained decoding the model repeated one call until the token limit cut the JSON (Room 30 times in the York inn, BodyFall and Listen in Lisbon, Listen in Whitechapel); the plan was lost and the turn ran nothing or missed its Act. Repetition under grammar-constrained decoding with unbounded lists is a known failure; every list in the plan, picker and rule-check schemas now has maxItems (calls 8, then 4, need 6, present 12, nested lists 12, picker 10, events 12).
- NewCharacter: "whispering man 1" was drawn as a boy of 7; "man", "woman", "fellow", "gentleman", "lady" in the name now fix sex and age 18 or more, "girl", "boy", "maid", "lad", "lass" fix sex. "The street and passers-by in Whitechapel" was drawn as one person; a crowd now goes to PlaceProfile, one NewCharacter per person who acts. Trade names the 1881 census lists under another word: landlord, landlady, publican, barman, tapster → Innkeeper, Hotel Keeper, Publican; maid, servant → Domestic Indoor Servant; watchman, porter → Messenger, Porter, Watchman; constable → Police; coster → Costermonger.
- Open: Price has no apples (Allen's goods list); the narrator then names a price no result backs. The run-story check now counts a PassTime walk as the turn's Act.

## 2026-10-19 (30) Second story run: 13 faults, none of shape; talkers raise their voices; talk takes time

- No malformed call and no repeated call: both are gone under constrained decoding with bounded lists. The 13 faults are judgement and missing layers.
- Lombard effect (acoustics.ts `lombardDb`): face to face the voice stays near 55 dB at 1 m until the background reaches about 48 dB, then rises about 0.6 dB per dB, levelling off near 67 dB at a 70 dB background; quiet-room levels at 1 m: casual 52, normal 57, raised 64, loud 73, shout 85 dB (Pearsons, Bennett & Fidell 1977, EPA-600/1-77-025). A chosen effort is raised further only when the noise asks for more than it gives. A raised voice at 1 m in a 75 dB room: 36 % of words (3 % before), because the talker rises to the plateau.
- Speaking takes time: a Communicate message moves the clock by its words at 196 words a minute (Yuan, Liberman & Cieri 2006, Switchboard, words over whole conversation time); the York inn turns had stood at 19:00:01 through three exchanges. Act's clock step is now `passSeconds`, shared.
- The narrator copied the BodyCheck marker onto every result in every run, whatever the brief said; the marker is dropped: every result is told in the story's own words, as the people there see and hear it.
- Open, seen in the Lisbon story: the climb does not move Mara to the top or the other side, so later turns crept across a lawn she had not reached; a fall's injuries are left to BodyWound, so the narrator supplies scrapes and a sore ankle (the tissue-mechanics injury layer); apples are outside the price series.

## 2026-10-19 (31) Third story run: 19 faults; most are the narrator writing what no call decided

- Of 19 faults, 13 are rule-check flags on narration: people's reactions after the one follow-on round (a chair scraping, footsteps to the window), a robbery plot filled in after a Listen whose "reveals" named no fact, a landlord's knowledge of two strangers. Code faults fixed:
- NewCharacter: a landlord in York 1820 was drawn a girl of 17 (outside the census's ±40 years the general population was used, with ILO work shares). A trade the census lists now draws sex and age from that trade's people wherever and whenever the story is, the story's word kept as the occupation. An "occupation" that describes the person ("man standing at the lit window") is dropped.
- Act: "drops down into the garden and slips to the shadow of the hedge" with 8 m given was refused (no known verb). Words with a distance and no known verb now walk that distance to the place named; slip and edge added as walking verbs.
- Price: the planner priced apples as an egg. Its description now says goods outside its list take their price from the story.
- run-story and run-play count a refusal as a fault only when no later call of the same tool succeeded.

## 2026-10-19 (32) Structured narration

- The rule check read events back out of prose, the same lossy direction as the plan before constrained decoding. The narrator now writes the reply as beats under a schema (narration.ts): {"beats":[{"result": number of the [DECIDED] result it tells, or 0, "text"}],"open":[questions]}. [DECIDED] is numbered. Result-0 beats hold what decides nothing (the place, the weather as given, looks, talk that changes nothing); where the scene moves toward an outcome no result decides, the text stops before it and "open" names it.
- Code joins the beats into the prose shown. The rule check reads only the result-0 beats (a beat tied to a result is backed by construction); a reply with none is passed. The open questions join the next turn's picker and planner prompts ("OPEN FROM THE LAST REPLY"), so an outcome the narrator would have written is decided by the engine.
- SillyTavern: on CHAT_COMPLETION_SETTINGS_READY the main reply's request carries the beats schema (response_format json_schema, SillyTavern's json_schema, and through custom_include_body for a Custom source) when the question pass decided the turn and the connection takes schemas; the narrator's brief gains the reply form; on MESSAGE_RECEIVED, first of the handlers, the JSON is read into prose and the beats are kept in the message's extra. Setting "Structured replies", on by default. While a reply streams, the JSON shows until it arrives.
- run-story uses the same path; tested with a scripted model: beats joined into prose, the check reading only the scenery beat, the open question carried.

## 2026-10-19 (33) Materials layer

- See df-body-engine.md §6.23. src/rules/data/materials.ts (24 materials), src/rules/materials.ts (lookups, laws, landing, breaking), tools/check-materials.mjs (22 pass, 2 recalled values flagged suspect).
- Walls in Listen and Communicate, room linings, room absorption and BodyFall now read the table; the Break tool decides planks, ropes and bars. The fall on the feet decides a heel-bone fracture from force against bone loads (the Lisbon story's invented scrapes and sore ankle now have a result to tell: "the bones hold, the legs and feet jarred" or a recorded fracture).
- Brick walls now pass less sound: 409 kg/m² for one brick thickness instead of 200 assumed (about 6 dB more loss at every band); lining densities changed (brick 1900 from 2600).

## 2026-10-19 (34) Test runs on GitHub instead of the phone

- Android stopped Termux mid-run again (under a minute after switching apps). .github/workflows/run-stories.yml runs tools/run-story.mjs (or run-play.mjs) on GitHub's machines when a commit on rules-standalone has [run stories] (or [run play]) in its message, or from the Actions tab, and pushes the result files to the branch play-results under results/<run time>/ with the commit they tested. The NVIDIA key is the repository secret NVIDIA_API_KEY, set once in GitHub; it is passed only to the runner. Results are read from that branch, so runs need nothing from the phone.

## 2026-10-20 (35) Saved answers: reruns ask only what changed

- The first GitHub run met NVIDIA's rate limit (429) on turn 1 and tested nothing. Model calls are the bottleneck: one story turn makes 4–6 calls, a full run about 60, and the free key allows a limited number per window. tools/nvidia.mjs now keeps every answer in answers-cache.jsonl, keyed by a SHA-256 of model, effort, system prompt, user prompt and schema (temperature 0, so the same request gets the same answer). A rerun after a fix asks the model only the calls whose prompts the fix changed (a fix in turn 3 replays turns 1–2 at once) and replays the rest. The workflow loads the file from play-results/cache/ before a run and saves it back after; the result header gives "N calls asked, M replayed". EVAL_CACHE=off asks every call again.
- A 429 waits for the server's Retry-After, else 60 s × the try number.

## 2026-10-20 (36) Where the project is stuck, and the order of work from here

- State: 42 tools, about 20 000 lines in src, 168 commits, zero automated tests that run without the model. Faults per 12-turn story run: 12, 20, 13, 19. First-turn runs: 18, 6, 8, 1.
- The bottleneck is the planner: one model step turns the player's free text into calls among 42 tools with exact arguments. Every fault class fixed so far sits there (Act arguments, missing place or time, missing tool, refused call). The deep layers (acoustics, materials, chemistry, body) pass their offline checks but are reached only when the planner gets the call right. A turn makes about 5 model calls; with a chance p of a fault in each call, a turn is clean (1 − p)^5 of the time (p = 0.1 gives 59 %), and each new tool raises p. Each fix needs a live run on a rate-limited key, so the fix–test loop costs hours.
- Decision, in this order:
  1. New layers stop until the 3 stories × 4 turns run clean twice in a row.
  2. Code routes each turn: a verb lexicon and the parsers already written (stepsFromWords, distanceIn, placeIn, findStoryTime, coin counts) read the player's message into a frame (verb, object, destination, amount, time). Code picks the tools from that frame. The model fills only the arguments code leaves open, under a schema limited to those tools (planSchema(only)).
  3. An offline corpus of player lines with their expected tools and arguments runs in seconds without the model, on every push. A model run is needed only for narration and the rule check.
- The 2026-10-20 03:29 UTC GitHub run is the baseline: its faults, sorted by the step that made each one, decide how far step 2 has to reach.

## 2026-10-20 (37) IPUMS International refused

- IPUMS International (and with it NAPP and Mosaic, which use the same account) grants access only to people at an NGO or academic institution, checked by an institutional email; a personal application is refused (their letter, 2026-10-19). Every "needs IPUMS" item in this log now uses other sources:
  - Occupations before 1969 outside England and Wales: published census tables, which are free to read. Great Britain 1801–1971 from A Vision of Britain Through Time (the source already used for 1881). Other countries from the ILO Year Book of Labour Statistics, the economically active by industry and sex, about 1930 onward.
  - Rooms per dwelling: the published housing tables of the censuses, 1891 onward for Britain.
  - The United States 1850–1940: IPUMS USA is a separate application and its terms page names no institutional requirement. The user can apply if US stories matter.
- None of this blocks the current work (entry 36: the planner); the census layer stays frozen with the other layers.

## 2026-10-20 (38) Code picks the tools; a test that runs without the model

- src/rules/router.ts: 15 verb classes (speech, request, listening, looking, buying, handing over, effort, falling, blows, eating and drinking, waiting, chasing, holding on, treating, breaking), each tied to the tool its outcome needs; quoted words are speech; a motion the action reader recognizes is Act. When any class matches, those tools plus RecordFact, PassTime and NewCharacter go to the planner and the model's tool picker is skipped: one model call fewer per turn. No match: the picker as before. The planner can still add a tool through "need".
- Bug found by the test: the check for a motion with no Act called stepsFromWords with a stand-in distance of 1 m, and its rule for an unknown verb with a distance turned every message into a 1 m walk. So every turn whose plan had no Act ("I call to the innkeeper", "I keep still and listen") spent a repair call asking for one. The check now reads motion without a distance (movesIn).
- tests/route.test.mjs: 35 player lines with the tools each needs and the ones it must leave out (the 12 story turns and 23 more of the same classes), 5 written distances, 1 walk. 41 checks, 0 misses. `npm test`; .github/workflows/test.yml runs it on every push, without the key.

## 2026-10-20 (39) The router reads verbs from VerbNet

- The hand-written verb list of entry 38 is replaced by VerbNet 3.4 (University of Colorado; Kipper-Schuler 2005; github.com/cu-clear/verbnet; described by its project page as freely available, no licence file in the repository). tools/build-verbnet.mjs turns its 331 class files into src/rules/data/verbnet.ts: 4,580 verbs, 6,716 verb–class pairs. router.ts ties 80 classes to tools (communication 37 → Communicate; requests 58–59 → SocialResponse; perception 30 and searching 35 → Look; possession 13, paying 68, stealing 10.5 → Transfer and Price; impact 18 and attack 60.1 → BodyStrike; ingesting 39 → BodyIntake; motion 51 and posture 50 → Act; and so on). VerbNet's classes leave some distinctions the tools need open (peer-30.3 holds listen with look; get-13.5.1 holds buy with take; no class marks effort or falling), so about 60 named verbs carry those [ASSUMED lists]. A measure of goods ("a pint of", "a pound of") asks for Price [ASSUMED measures].
- A word counts as a verb only where a player's line puts one: at the start, after a subject, an auxiliary, "to", "and", "then" or a comma, with one adverb allowed between. "A pound of tea" stays a noun though VerbNet lists pound under hit-18.1.
- tests/route.test.mjs: 54 lines (19 added for verbs only VerbNet carries and for nouns that are also verbs), 5 distances, 1 walk: 60 checks, 0 misses.

## 2026-10-20 (40) Code writes the calls the player's words settle

- src/rules/frame.ts reads four calls from the player's message: Act (the motion in their words, with a distance the words give: "walk the three hundred yards" → 274.3 m; a walk without one goes to the planner), Communicate (speaker the player; listener the person after to/at/with or after tell/ask, "him" resolved to the last person named; the words in quotes, else the clause up to the next action; effort whisper/normal/loud/shout from the verb), PassTime (a wait the words time: "sleep for eight hours" → 480 min, sleeping), Transfer ("give Will one of the apples" → 1 apples, Mary → Will, given). The player is the cast line marked "(the player's character)", else SillyTavern's persona name.
- question-pass.ts runs code's calls and offers the planner only the routed tools they leave open. When code settles every routed tool, the planner call is skipped (turns 1.2 and 2.1 of the test stories). Communicate is a scene tool: how far the listener stands and how loud the room are scene numbers, so the planner still answers for it and its call takes code's words (mergeCalls); code's call stands when the planner gives none.
- tests/frame.test.mjs: 18 lines with the arguments code must write and the tools it must leave to the planner, plus mergeCalls and the player's name: 20 checks, 0 misses.
- The whole pipeline ran offline against a stand-in model that answers every plan with no calls: the code-written calls ran with 0 refusals and 0 clock faults. The 14 faults left are exactly the tools only the model can fill (Listen and Look distances, the climb's difficulty, the price, walks with no distance in the words).

## 2026-10-20 (41) First real run with code-written calls: 1 fault reported, 4 found by reading

- Run of 4c519cf (results/2026-10-20T03-42): 37 model calls (about 60 before), 1 fault reported in 12 turns (12–20 before). Every expected tool ran. Reading the turns found four faults the report missed; each is fixed and the report now catches two of them.
  1. The narrator told a broken heel, and a third climb, that no result decided. BodyFall's result said the bones held, then added its sensitivity note ("Fragile: … legGiveM = 0.1 m → the right heel bone breaks"), and the narrator told the alternative as fact. The check missed it because it read only the beats tied to no result. Now the sensitivity note stays in the log only: it is cut from [DECIDED], from the planner's follow-on and from the check's results (storyResult). The check reads every beat (narration.ts checkedText): a beat tied to a result can still tell more than the result.
  2. Look's "target" (a thing seen) was read as a person, so "Tom getting up and going to the bar to speak to the innkeeper" was drawn as a 7-year-old boy. "target" left the person keys; a phrase over 4 words or with a verb in -ing is skipped. The report flags a person drawn for a phrase.
  3. Will, "her brother Will, 12" in the cast, was drawn as a blacksmith of 19. NewCharacter takes "age" when the story states it; castPerson reads an age beside a name in the cast and a sex from a kin word (brother, sister, wife…). The report flags a drawn age that differs from the cast's.
  4. The code-written Communicate kept its defaults (1 m, quiet room) when the planner gave none, in a half-full taproom. A drafted scene tool the plan leaves out now goes to the repair round for distance_m, noise, barrier and effort.
- Still open: a named stranger's sex from their first name ("Josiah Crake" drawn a girl of 1). Source to use: a given-name table with sex counts (US Social Security names from 1880, public domain). Apples outside the Price list. The climb's side of the wall.

## 2026-10-20 (42) Second real run: the faults behind its 11

- Run of 5d51054 (results/2026-10-20T04-30): 43 model calls, 11 faults reported in 12 turns. By the step that made each:
  - Code, the drafted Communicate: a line in question-pass.ts rebuilt the settled-tools set from every code-written call, scene tools included, so Communicate counted as settled and never reached the repair round. All three code-written Communicates kept 1 m and a quiet room, in a half-full taproom. Fixed (the set keeps code's own list). The stand-in run now shows the repair asking for distance_m, noise and barrier.
  - Engine, NewCharacter: a person already drawn was drawn again when the planner asked a second time (the innkeeper at 56, then at 68; the maid at 23, then at 72). A known person now keeps what was drawn. A group named as one ("the whispering men", "the men by the fire") is refused, so each person gets their own call.
  - Report: "person drawn for a phrase" fired on real labels ("the young man by the fire", 6 words) and on a reused result's "Already decided" prefix. Now it reads the call's own "who" and flags a verb in -ing or over 8 words; it also flags a group drawn as one person and a person drawn twice. The auto-NewCharacter skip uses the same 8-word line. Words the player's character hears through Communicate (the whisper overheard at 2.3) count as Listen.
  - Narrator: 5 lines no result backs (a traveller sizing Tom up, a mug gathered, a figure seen early, a sound unheard). The check caught all 5; SillyTavern's rewrite round handles these.
  - Planner: Price looked up bread for apples (apples are outside the price list; still open).

## 2026-10-20 (43) Third real run: 7 faults; a fall needs the height a climb reached

- Run of 43e2b23 (results/2026-10-20T05-14): 42 model calls, 7 faults reported in 12 turns (11, then 1 counted the old way). Every person kept one draw (the costermonger: "already in the story"), Will was 12 as the cast says, and no phrase or group was drawn as a person. Sorted by step:
  - Engine, the climb: Mara's climb failed at 0.6 m (3.1). The player then wrote "I drop down into the garden on the other side", and BodyFall ran a 3 m drop from a wall she never topped. The narrator then had her climb it unbacked (two flags at 3.2–3.3). The engine now keeps the height a climb reached (Person.raised_m: the top after a success, 0 at the foot after a failure, cleared by a walk or a fall). A drop from higher than that height returns where she is instead: "on the ground at the foot of the climb, on the side it started from; the climb failed, so there is no drop to make".
  - Engine, Price: the York inn's ale was priced in Leipzig. A listed city in another country than the scene's gives way to the scene country's listed city (London for the United Kingdom; one stand-in city per country, CITY_OF in rules-tools.ts [ASSUMED to speak for the country]).
  - Planner: apples priced by no call (1.3 "missing Price"; apples are outside the price list, still open). Communicate's distance stayed 1 m: the repair now asks for it, and the model gave the noise but not the distance.
  - Narrator: a price said aloud that no result gave (tuppence), and two facts a character could not know. The check caught all three.
- tests/engine.test.mjs: a drop after a failed climb, a drop after a climb that succeeded, the York price in London. `npm test`: 86 checks, 0 misses.

## 2026-10-20 (44) Fourth real run: 4 faults; Listen and Look drafted by code

- Run of 7063e39 (results/2026-10-20T05-55): 42 model calls, 4 faults reported in 12 turns. The climb succeeded this time, so the drop ran from the top as it should. Reading the turns found two more faults:
  - Planner, 2.3: no Listen ran for "I keep still and listen". The report missed it because it counted the innkeeper's words to Tom as listening. The narrator then told muffled whispers with nothing behind them (flagged). Now code drafts Listen (listener: the player) for listen, overhear, eavesdrop and hear, and Look (viewer: the player, target from the words) for look, peer, peek, watch, glance and search. Like Communicate, these are scene tools: the planner's call by the same person takes code's words, and a draft left out goes to the repair round for distance, sound and size. A draft still missing a required number stays unrun. A planner call by another person (the occupant looking at Mara) leaves the player's draft standing. The report counts Communicate as listening only for whispered words.
  - Planner, 2.2: Price asked for the ale in five cities (Leipzig, London, Paris, Amsterdam, Vienna). All were answered in London, the scene's country. Price is now asked once per item, quantity and year, whatever the city.
- Narrator: three perceptions told with no result (flagged by the check).
- `npm test`: 88 checks, 0 misses.

## 2026-10-20 (45) Fifth real run: 2 faults; repeated prices left out in every round

- Run of 91dc117 (results/2026-10-20T07-39, 83 min with NVIDIA's rate-limit waits): 41 model calls, 2 faults reported in 12 turns. "I keep still and listen" ran Listen this time (Tom hears the whisper at 2 m), and the plot he overheard reached the innkeeper. Faults by step, including those read from the turns:
  - Code: the ale's price was again asked in five cities. The once-per-item rule ran only on the first plan, and the repeats came through a later round. Now the final call list and each follow-on round leave out a call that asks again what one already asked (tests/engine.test.mjs).
  - Planner: the costermonger "chooses: has no apples left and sends her away", and a Transfer in the same plan sold her the apples. The choice's result came after the call that depended on it. Open: a call whose outcome depends on another result belongs in "then".
  - Planner: three Acts for one creep across the lawn (10 m, then 12 m, then kneeling), so the clock moved for both walks. Open.
  - Engine data: an innkeeper of 16, drawn from the census's innkeepers. The census table gives occupations without ages, so age is drawn apart from the trade [ASSUMED]. Open: age by occupation.
  - Narrator: "a quarter past six by the church clock" when the clock read 18:21. The check caught it.
- `npm test`: 89 checks, 0 misses.

## 2026-10-20 (46) The plan keyed by tool and subject

- The faults of runs 1–5 that came from the plan's shape (the ale priced in five cities, one creep split into three Acts, a person drawn twice, the costermonger's Communicate written twice) share one cause: the plan was a list, and a list holds any call any number of times. Each fix so far filtered one repeat after it was written. The plan is now an object keyed by tool, and within a tool by the subject the call is about: {"calls":{"Act":{"Mara":{…}},"Price":{"beer (litre)":{…}},"Weather":{…}}}. A JSON object holds each key once, so under constrained decoding a second Act for Mara or a second price of the same good cannot be written. The subject is the tool's first argument among who, speaker, listener, viewer, item, room, fact (plan-schema.ts subjectOf); Price is keyed by the good, or by the question ("daily wage"); a tool about no one in particular (Weather, PassTime) takes its arguments directly. callsFromKeyed turns the keyed plan back into the list the pass runs, in the order written; the list form still reads (unguided connections). The prompt says each person's motions this turn go in their one Act, in order.
- Result texts now state what holds: a person met again is "a 25-year-old man, as drawn when first met"; a drop after a failed climb gives "stands on the ground at the foot of the climb, on the side the climb started from".
- tests/plan.test.mjs (9 checks). `npm test`: 98 checks, 0 misses. The stand-in run reads keyed plans and runs their calls.

## 2026-10-20 (47) Keys narrowed in the schema; follow-on questions name their tool

- Run of d4b74bd (results/2026-10-20T10-14): NVIDIA accepted the keyed schema (43 calls, 13 min, 7 faults). Free-text keys let the model write descriptions where a subject belongs: "Tom to the innkeeper" as a speaker, "Mara sees who is inside" as a viewer, "who:Mara"; each became a person. Price's good became free text ("pint of ale") outside its list. And a turn whose plan put "Does the costermonger have apples left?" in "then" and asked for Choose came back from the follow-on round with zero calls.
- The schema now fixes what a key can be (plan-schema.ts):
  - Person-keyed tools (who, speaker, listener, viewer) take a name or a role: capitalized words ("Mara", "Will Doyle"), or "the" and up to four lower-case words ("the man by the fire"); PERSON_KEY. The story's people are listed as fixed keys, so a stored label ("whispering man 1") is written as stored.
  - A subject with a fixed list takes those keys only: Price's keys are its listed goods.
  - "then" entries are {question, tool}. The follow-on round's schema requires a call of each tool the open questions and "need" named.
- tests/plan.test.mjs: 22 checks (names and roles accepted; "Tom to the innkeeper", "Mara sees who is inside", "who:Mara" and a bare noun refused; fixed keys; required tools; Price's goods). `npm test`: 111 checks, 0 misses.

## 2026-10-20 (48) The endpoint refuses propertyNames; person names checked at the engine's door

- The run of e4b65c7 stopped on turn 1: five empty answers. tools/probe-schema.mjs (run on GitHub with "[run probe]", results in probe-result.txt) sent one schema feature per request. HTTP 400 for propertyNames (pattern, enum or anyOf), and for the plan schema while it held propertyNames. Accepted: keyed objects with an additionalProperties schema, fixed properties with additionalProperties false, minProperties. (Three accepted cases answered with no content: the probe's 3,000-token limit went to thinking.)
- The plan schema drops propertyNames. The story's people stay as fixed keys; a new person's key is free text in the schema. Its shape is checked where a call enters the engine: validCalls holds back a call whose person argument (who, speaker, listener, viewer, attacker, pursuer, fleeing, target_who) is neither a person the story holds nor a name or role (PERSON_KEY). The repair round gets "viewer takes a person's name or role, as in \"Mara\" or \"the innkeeper\"". A description such as "Mara sees who is inside" never reaches who(), so it never becomes a body.
- `npm test`: 114 checks, 0 misses.

## 2026-10-20 (49) Closed sets for people; Listen needs its sound; Act passes climbs on

- Run of 8da3ce5 (results/2026-10-20T13-44): the schema went through (43 calls, 7 faults). Free text still reached three places, and each is now a closed set or a required argument:
  - People. A role pattern let "the window" through as a viewer (then drawn as a 62-year-old man of occupation "window"), and tool names "BodyCheck" and "Look" through as listeners. src/rules/scene-people.ts now reads the scene's people before the plan is written: the player, the story's people, the cast, names inside the recent text (a full name at a sentence's start), roles the text names ("the" and up to two words before a person noun or a census trade word: "the innkeeper", "the old innkeeper"), and each one of a small group ("two men" → "the first man", "the second man"). Person-keyed tools take exactly these keys (fixed properties, additionalProperties false). NewCharacter alone also takes a new one. Person values inside a call (listener, attacker, target_who…) are enums of the same list. After NewCharacter runs, the follow-on round's list includes the people it drew.
  - Listen ran with no sound ("Unknown sound undefined"). sound is now required. The repair round names a draft's missing required arguments.
  - Act took "climbs the wall and drops down into the garden" as a 3 m walk. A climb in the story then went with no BodyCheck and a drop with no BodyFall. Act's words with a climb, a jump down or a fall now return: "A climb is decided by BodyCheck with height_m, and a drop by BodyFall from the height the climber stands at."
- `npm test`: 130 checks, 0 misses.

## 2026-10-20 (50) People as agent nouns; a call's other person is one of the others

- Run of 91f4678 (results/2026-10-20T14-25): 41 calls, 3 faults reported. Read from the turns:
  - "the house" was a listener, the dog's key. Its trade words held "house" (from "Lodging House Keeper"), and the dog the model wanted to name was nowhere in the list. Trade words now count only as agent nouns, by the suffixes English forms them with (-er, -or, -ist, -man, -ian, -ant, -ess, -ster, -wright, -smith; Marchand 1969), singular. Animals that act, hear and see are role words (dog, horse, cat…). "a dog" names the role "the dog" as "the dog" does.
  - The innkeeper spoke to himself. Under each person's key, the other person a call names (listener, attacker, the one chased) is one of the other people: the speaker is outside his own listener list.
  - "the maidservant" was drawn as a man of 44. The census reads maidservant, cook and nursemaid as domestic indoor servants, and a role noun that names a woman (maid-, -ess, -wife, widow, landlady, mistress) fixes the sex.
- `npm test`: 134 checks, 0 misses.

## 2026-10-20 (51) One call per tool and person across the whole turn; a named verb's tools replace its classes'

- Run of ce37bd2 (results/2026-10-20T15-35, 68 min with rate-limit waits): 42 calls, 5 faults reported. The house, the self-speaking innkeeper and the maidservant were gone. Two causes remained:
  - "I climb the wall" offered Act: VerbNet files climb under motion (escape-51.1), and its class's tool was added beside BodyCheck. The model wrote "Act: climbs the wall and pauses at its top" next to the BodyCheck, and Act passed it on. A verb named in VERB_TOOL now takes that list in place of its classes' tools, and each named verb's list is complete (ask → Communicate and SocialResponse; buy → Price and Transfer; flee → Chase and Act).
  - Mara's drop ran twice: once in the plan, and again when the repair round for the passed-on Act wrote BodyFall a second time. Listen ran twice the same way in a follow-on round. The keyed plan held one call per person within a round only. Each later round's schema now leaves out the keys already run and standing this turn (planSchema opts.used, kept by the pass as calls run), so a second BodyFall for Mara has no key to be written under.
- `npm test`: 135 checks, 0 misses.

## 2026-10-20 (52) Act's action is a motion by its shape; Communicate carries words; a fall starts at half a metre

- Run of 15d67f8 (results/2026-10-20T16-05): 40 calls, 8 faults reported. No call was repeated within a turn. Three interfaces still took what they cannot use:
  - Act's action was free text: "watches from the lit window" (the merchant) and "drops down into the garden and moves to the shadow of the hedge" were written as Acts and passed on. The drop then went unrun, and a 0 m BodyFall came a turn later. The plan schema now gives Act's action a pattern: it begins with a motion or posture verb the action reader times (MOTION_START, built from WORD_STEPS; plain groups, no \b, the pattern features the endpoint already takes in the time pattern). A watch or a drop has no Act form; a drop is written as BodyFall, and the climber's height (entry 43) decides it.
  - Communicate ran with no words (the two whispering men "speaking" to each other with no message). message is now required.
  - BodyFall took 0 m. Under 0.5 m the result is a step down that keeps the feet [ASSUMED threshold].
- `npm test`: 137 checks, 0 misses.

## 2026-10-20 (53) The motion pattern covers the whole action; Communicate's words optional again

- Run of 9e52b8e (results/2026-10-20T16-48): the endpoint took the pattern. Its grammar matches a pattern against the whole string, so `^(verb)( |,|$)` let the model write only the verb: "steps", "walks ", "stands,", "creeps,". The destinations were lost ("to outside, near where Mary stood"). MOTION_START now ends with the rest of the action, `([ ,][^"]*)?$`.
- Requiring Communicate's message (entry 52) made the model fill it with "placeholder" and "(the first man's whispered remark…)". Words the reply does not quote are the tool's own case (it answers with the tone carried), so message is optional again.
- Still open from this run: the payment for the apples. Price has no apples, so the model rolled a price and wrote "That'll be X pence". This needs a price source for fruit.
- `npm test`: 138 checks, 0 misses.

## 2026-10-20 (54) Run of 5b1c294: 3 faults; possessives and the drafted speech

- Run of 5b1c294 (results/2026-10-20T17-09): 41 calls, 3 faults reported, the fewest yet. Actions came back whole ("steps out of her house onto the street"), every person kept one draw, and Mara's drop ran from the top of a climbed wall. Read from the turns:
  - "Tom's" became a speaker key: the name reader kept the possessive ("Tom's mug"). A possessive now names its owner.
  - Tom's drafted Communicate ("what I heard", 1 m, quiet room) stood beside the planner's own, written under "Tom's", and the repair round counted that as covered because it checked the tool only. Drafts are now matched to planner calls by tool and person (sameSubject), as mergeCalls does.
  - Open: apples (no source found: London agricultural price series cover grain, potatoes, hay, butter and meat; Solar & Klovland 2011).
- `npm test`: 139 checks, 0 misses. First run of the three parallel story jobs follows.

## 2026-10-20 (55) Drafted scene calls required in the plan's schema

- Story 1 of run 9015910 (results/run-39463869624, parallel jobs; 3 min, 5 of 12 calls replayed): 1 fault (apples' price). Mary's words to the costermonger kept the tool's defaults (1 m, quiet room) on a busy street: the planner wrote no Communicate for her, and nothing made it write one. The first plan's schema now requires a call of each scene tool code drafted (minProperties 1 under that tool), and so does the repair round's schema for the drafts still open.

## 2026-10-20 (56) Parallel run: 5 faults in 16 minutes; vision overflow fixed

- Run 9015910 as three parallel jobs (results/run-39463869624): all 12 turns in 16 min (40–70 min serial), 5 faults (story 1: 1, story 2: 1, story 3: 3).
- Engine bug, vision: the target transfer function computed x^E ÷ (1 + x^E). For a large or near target x^E overflowed to Infinity, the odds became NaN, and every look at it "missed" (Mara missed a 1.5 m window at 1 m). It is now 1 ÷ (1 + x^−E), the same value, finite everywhere (tests/engine.test.mjs: a near target is seen, a far one at night mostly is not).
- SocialResponse asked for a sex the story already held (the drawn maid). It now reads the person's sex from the story first.
- A drop after a failed climb: any height from the ground now gives "stands on the ground at the foot of the climb"; 0.5 m had passed as a step down. A climb runs before a drop by the same person whatever order the keyed plan lists them in.
- `npm test`: 142 checks, 0 misses.

## 2026-10-20 (57) What today's twelve runs show, and the reply bounded the same way

- Today's twelve real runs, by cause (results on play-results; the faults the report gave, and those found by reading each turn):
  1. Free text where a decision belongs, in the plan. The ale priced in five cities; one creep split into three Acts; descriptions as people ("Tom to the innkeeper", "the window", "BodyCheck"); "climbs the wall" as a walk; Listen with no sound. Fixed by closing each interface: the keyed plan (one call per tool and subject, entry 46), keys from the scene's people and the price list (47–50), one call per key across the turn's rounds (51), patterns and required arguments (49, 52–53).
  2. A default standing where the scene sets a number: every code-written Communicate at 1 m in a quiet room. Fixed by drafts that the plan's schema requires the planner to complete (54–55).
  3. Engine bugs a run exposed: the sensitivity note read as fact (41), the settled-tools set (42), vision odds overflowing to NaN (56).
  4. Data the engine lacks: the price of apples.
  5. The narrator telling events no result decides: unbacked Listen, Look, Transfer, BodyFall, PassTime; knowledge a character lacks. After 1–3 were closed, this is two thirds of what remains (about 45 of the 70 fault lines reported today). Its cause is the same as 1's: the reply's schema let any number of free beats be written, and an event fits in any of them.
- The reply now gets the treatment the plan got (narration.ts): {"scene": the setting, at most 420 characters; "results": one passage per numbered result, each required, each written once; "open": the questions the scene moves toward}. The only free passage is the setting, a few sentences long. An event has a place only under the result that decides it, or as an open question the next turn's planner decides. readNarration reads it back as beats (0 for the scene, then each result's number), so proseOf, the check and SillyTavern's reply handling are unchanged.
- NVIDIA rate-limit increase: forum requests from June 2026 (40 → 200 requests per minute) show no staff answer four months on, and a moderator wrote that "there is no official way … to receive a rate limit increase on that same tier". No request drafted.
- `npm test`: 144 checks, 0 misses.

## 2026-10-20 (58) The bounded reply: 3 faults in 12 turns; the day's weather told once

- Run of 2e832a8 (results/run-39467128451, the scene-and-results reply): 3 faults in 12 turns, the fewest of the day (story 2: none). The narrator's unbacked events, two thirds of the faults before, fell to 2 rule-check flags (both a duration worded past its result). The other fault was Act passing on a drop.
- The reply's required passage per result made every reply open on the same rain: Weather runs every turn, and its passage was required each time. A turn whose Weather gives the same day's weather as the turn before (the result without its "now about … °C") keeps the result for the check and leaves it out of [DECIDED]. Stand-in run: Weather in [DECIDED] on turn 1 only.

## 2026-10-20 (59) Each decided result names who it is about

- Run of d2e573f (results/run-39470783222): 2 faults in 12 turns (story 2: none). The weather opened only the first reply. One fault: the plan held a 3 m BodyFall for "the merchant", whose result text names no one ("Fall 3 m: lands on the feet"). Required to tell every result, the narrator gave it to Mara as a second fall. [DECIDED] now lists each result with its tool and subject ("5. BodyFall (the merchant): …"). Stand-in run: "1. Act (Tom): Tom sits down", "2. Communicate (Tom): …".

## 2026-10-20 (60) A first round's body actions are the player's

- Run of 808609e (results/run-39472546019): 7 faults; story 3 had 5. Its first plan copied Mara's climb under a second key, "the merchant" (climb mossy wall: SUCCESS). Required to tell that result, the narrator made "another figure" land behind her, and the next turn drew that figure as a girl of 16 who fled: four unbacked Look and Listen lines followed from one copied call. The cause is the key set: every person in the scene could be the subject of a climb in the first round. Body-action tools (Act, BodyCheck, BodyFall, HoldOn, Chase, BodyIntake, WorkOut; plan-schema.ts ACTOR_TOOLS) now take as first-round keys only the player's character and the people the player's message names. Other people's actions follow their choices, in a later round, where anyone in the scene may act. Stories 1 and 2: 1 fault each (the apples' price; rain against the window on a day whose rain was 0.2 mm, told in a scene beat).
- `npm test`: 145 checks, 0 misses.

## 2026-10-20 (61) Required tools come from open questions only

- Run of 0ebda44 (results/run-39473976387): 2 faults in 12 turns (stories 1 and 2: none). Both came from one call: the follow-on round's schema required a call of each tool in "need", BodyCheck among them. Mara's climb had already used her key (entry 51), so the one key left to write under was the merchant's, and the merchant climbed the wall. Requiring is now reserved for the tools the open questions name ({question, tool}); "need" only offers tools. A tool with no key left is never required.
- `npm test`: 146 checks, 0 misses.

## 2026-10-20 (62) Apples priced from Mayhew's street price

- Price had no apples, so the apple story could never price them: the model rolled dice or wrote "X pence". Source found by web search: Mayhew 1851, London Labour and the London Poor vol. 1, "Street Sellers of Fruit and Vegetables": "The average price of apples, as sold by the costermonger, is 4s. a bushel", 288 apples to the bushel ("six a penny"). A bushel of apples weighs 48 lb (USDA Agricultural Handbook 697). Scaled to the imperial bushel that is 49.5 lb, 22.5 kg [ASSUMED same packing], so Mayhew's apple weighs 78 g. 48 d in silver at the 1851 mint price per 22.5 kg, divided by London's price index for 1851, gives apples a base on the scale of the other goods. So any year and city follows its price index as every good does (prices.ts). London 1851: 0.97 d a pound; 1888: 1.44 d; 1820: 1.26 d. Agricultural price series (Clark 2004; Solar & Klovland 2011) hold no fruit. "apples (kg)" is now a Price item and a Price key in the plan schema.
- `npm test`: 147 checks, 0 misses.

## 2026-10-20 (63) Results say the hour and the work time as people say them; code writes the Price the words give

- Run of ad7d703 (results/run-39480863762): apples priced ("apples (kg) in London, 1888: about 3¼ d"). The faults left are the narrator rounding a result's number its own way: "a quarter past six" for 18:18, "a quarter hour" for 0.3 hours. And story 2's ale was priced under the apples key.
- Every "Clock now" in a result now carries the spoken time to the nearest five minutes ("18:17:53 (about twenty past six in the evening)"; clock.ts spokenTime). Price gives work time under an hour in minutes to the nearest five ("about 20 minutes of a 10-hour day"). The reply copies the words instead of converting the number.
- frame.ts writes the Price call when the player buys, orders or asks for a measure of a listed good. Words name the good: ale, beer, porter, stout, cider → beer; bread, loaf → bread; apples; cheese; butter; meat; eggs; beans or peas; soap; candles; lamp oil. Measures: imperial pint 0.568 l, quart 1.137 l, gallon 4.546 l, pound 0.4536 kg, ounce 0.0283 kg, loaf 1.97 kg (the quartern loaf, 4 lb 5½ oz [ASSUMED for "a loaf"]), dozen 12. Price with no city takes the scene country's listed city. "a pint of ale" → beer (litre) 0.568; "a pound of apples" → apples (kg) 0.454.
- `npm test`: 152 checks, 0 misses.

## 2026-10-20 (64) The day's weather holds as an unnumbered line; settled tools stay settled

- Run of 84d2f82 (results/run-39482036409): 9 faults (stories 1–3: 6, 1, 2). Code wrote both prices from the words (apples 0.454 kg; beer 0.568 l). Story 1's six had two causes:
  - With the day's weather out of [DECIDED] after the first reply (entry 58), the narrator gave the sky its own course ("the mist has stopped altogether", twice flagged). The weather now holds in [DECIDED] as an unnumbered line, "Still so from earlier", which bounds what the reply says of the sky and asks no passage.
  - A follow-on round priced candles that nobody bought ("need": Price), and the reply told them. A tool code settled this turn is no longer offered again in a follow-on round.

## 2026-10-20 (65) Look requires its distance; an event phrase reads as a verb with what it does

- Run of a3c75a7 (results/run-39484164921): 6 faults (story 1: none; 2: 2; 3: 4). Look refused "Give distance_m" after repair: the tool needs a distance (or a map) but listed only viewer and size_m as required, so the schema let the plan leave it out. distance_m is now required, and the plan's schema asks for it. The report flagged "the serving girl" as a phrase for its -ing word. An event now reads as a verb in -ing followed by what it does ("getting up and going to the bar"), in the report and in the auto-NewCharacter skip.
- Open: paying "a penny and a half" from two pennies refuses (Transfer counts whole coins; making change is not modelled).

## 2026-10-20 (66) Goods outside the list priced from the good they are most like

- A good the price list lacks used to get no price, so the model invented one each time, different from turn to turn. Price now takes good (the story's word) and like (the listed good it is most like), and prices it in three steps (prices.ts referencePrice):
  1. A listed good named in other words ("apple", "eggs") → that good.
  2. A good in the reference table → the listed anchor's price × the two goods' ratio there. The table holds US average retail prices of 33 fruits, 2023 (USDA ERS Fruit and Vegetable Prices, all-fruits CSV; data/usda-produce.ts), anchored on apples, the one fruit with a historical series. Pears: 1.03 × apples; bananas 0.33; raspberries 4.28 [ASSUMED: the ratio held in the story's time and place].
  3. Anything else → the like good's own price [ASSUMED].
- The first answer for a good is kept in the story (goodsRef) and returned each time it is asked: oysters priced like meat stay at meat's price when a later call names cheese. The result names its basis ("pears at 1.03 × apples, from US retail prices 2023 (USDA ERS) [ASSUMED: that ratio then]"). A historical series for a good, once found, replaces the placeholder by entering the list.
- frame.ts writes the Price for a measure of a good outside the list when the reference table holds it ("a pound of pears" → good pears, 0.454). The planner gives like for the rest.
- Open: vegetables (USDA ERS all-vegetables CSV, 44 products; the fetch was refused this session).
- `npm test`: 156 checks, 0 misses.

## 2026-10-20 (67) Towns placed by GeoNames

- Run of 3ee2f29 (results/run-39485197751): 7 faults (story 1: none; 2: 6; 3: 1). Story 2's six had one cause. "A coaching inn near York" found no place, because York is outside the WMO weather-city list. So no Weather ran and no country was set, the code-written Price had no city and refused, and the narrator made rain rattle the windows twice. placeIn now falls back to GeoNames cities15000 (every place of 15,000 people or more, geonames.org, CC BY 4.0; 32,726 names; data/geonames.ts, built by tools/build-geonames.mjs). A name after a word that leads a place (in, near, at, outside, from, to, into, of, by) takes the largest place of that name, and its weather and country come from the nearest WMO city. "near York" → 53.96 N, 1.08 W, Leeds' climate 34 km off, United Kingdom. A person's name with no place word stays a name (Mary is also a city in Turkmenistan).
- `npm test`: 158 checks, 0 misses.

## 2026-10-20 (68) Vegetables and pulses in the reference table

- The user downloaded USDA ERS's all-vegetables CSV (2023, 93 rows), which the session could not fetch. data/usda-produce.ts now holds 31 vegetables, each in its whole fresh form where the table gives several (cabbage green, carrots raw whole, tomatoes large round…; olives canned), and 8 dried pulses. Fresh vegetables are priced against apples like the fruit (potatoes 0.50 ×, onions 0.57 ×, cabbage 0.44 ×, tomatoes 1.15 ×). Dried pulses are priced against the listed beans or peas, sold by the litre, at 0.8 kg a litre [ASSUMED] and the pulse's ratio to the mean dried bean (lentils 1.03 ×). London 1888, a pound: potatoes about ¾ d, lentils about 2 d.
- `npm test`: 159 checks, 0 misses.

## 2026-10-20 (69) Six more stories, for the tools stories 1–3 leave untouched

- Every fault count today comes from the same three stories, and the fixes answer what those stories exposed. tools/run-story.mjs now holds stories 4–9: a fight and a chase on the Liverpool docks (1866), a plea and a pledge to a Paris landlord with bread bought and eaten (1832), a journeyman's 12-mile walk, a bed, sleep and a fever (Saxony 1845), a maid's broken dish and an hour's wait (Lisbon 1755), a coachman's fall on the ice and a vodka (Saint Petersburg 1861), and a nurse at the first public ether operation (Boston, 16 October 1846). The workflow runs nine parallel jobs, one per story; stories 2, 5 and 8 use KEY2 when it exists.
- Found by the stand-in run: "I wait in the kitchen for an hour" wrote no PassTime, because words between the verb and the duration broke the pattern. Up to five words may now come between them.

## 2026-10-20 (70) The test counts the reply the player is shown; the standard it is held to

- Every run until now counted the narrator's first draft. In SillyTavern a draft the rule check flags is rewritten once before the player sees it (rules-audit.ts: the flags are set, the turn's calls rerun from its snapshot with the flagged tools asked, then a correction note and a second check). tools/run-story.mjs now does the same: a flagged draft is logged as "draft flagged (rewritten)" with its text, and the faults counted are the second check's, on the reply the player is shown. Stand-in run: four drafts flagged, four rewrites with the note, none flagged after.
- The standard (acceptance): across all nine stories (36 turns), in two consecutive runs, on the reply shown:
  1. zero engine or interface faults (refusals after repair, a person drawn for a phrase or twice, the clock running back or standing still, a tool missing where the player's words need it);
  2. zero results contradicted;
  3. at most one unbacked event per twelve turns.
  The narrator is a language model and will draft some invention; the system's job is that the check catches it and the rewrite removes it before the player reads it. Faults the check itself misses are found by reading the turns, as each run so far has been read.

## 2026-10-20 (71) Nine stories, first drafts: 35 faults in 36 turns; three causes closed

- Run of dadbb7f (results/run-39489757985; first drafts, before entry 70's rewrite): 35 faults in 36 turns. Stories 1–3: 4. Stories 4–9: 31 (story 8: 14, story 6: 7, story 4: 5, story 7: 0). The new stories exposed:
  - Place names as people: "Saint Petersburg" climbed down from the sledge (BodyCheck) and "Prospect" (Nevsky Prospect) slipped on the ice (BodyFall). Capitalized words in the scenario became person keys. scenePeople now drops a name GeoNames lists as a place, a name led by a place word (Saint, San, New, Port, Rua, Rue…), and a name ending in a place noun (Street, Prospect, Square, Bridge, Inn…).
  - Goods outside the list could not be keyed. Price's keys were the listed goods only, so vodka and a bed for the night were keyed under apples and priced as apples (the item beat the good). Price's keys now include "other good", which requires good and like, and a good outside the list wins over a stray item.
  - The player's own misfortunes were drawn as claims: "I slip on the ice and fall" and "I wake with a fever" came back false. Claim takes against_interest. A misfortune of the claimer's own, happening now or before, holds without a draw (a statement against one's interest gains nothing a draw guards against). The tools that decide its effects still decide them.
- `npm test`: 164 checks, 0 misses.

## 2026-10-20 (72) Preparation before contact: a perception's reveals is the fact itself

- From the extensions the user shared (Simulation Blackboard, AGPL-3.0, read for ideas only; Lattice, MIT; a WorldBuilder lorebook card): Blackboard's review rule that facts a search or look finds are established before the dependent outcome ("closed inventory cannot acquire loot through a search"). Here it named a fault of this engine's own interface: Look, Listen and WorkOut described reveals with question-shaped examples ("who it is, what they are doing", "who the thief is"). Plans copied the shape ("reveals": "who is inside the lit room and what they are doing"), the result read "Mara now knows: who is inside the lit room", and the reply invented the occupant. The descriptions now give the fact as the example ("a grey-haired man counting coins into an iron box at a desk"), and a reveals written as a question (who, what, whether, if, where, how, which, why, anything, anyone) is turned back to the repair round with that instruction.
- Run of fed5dcf (results/run-39490454881, the first counting shown replies): stories 1, 3 and 9 had no fault on the shown reply. Five stories stopped on NVIDIA's rate limit: nine parallel jobs and their rewrites on one key. The workflow now runs three jobs at a time.
- Open: a thing the player's character gives that the story never recorded ("I offer him my silver thimble") is refused by Transfer; it needs a Claim first.
- `npm test`: 166 checks, 0 misses.

## 2026-10-20 (73) Provider retries from Simulation Blackboard

- The user has the permission of Simulation Blackboard's author (st1ksi) to reuse its code. Its retry.js replaces tools/nvidia.mjs's retry loop (src/rules/retry.ts). Only temporary errors are retried (429, 500, 502, 503, 504, "overloaded"; never billing, a bad key or a context overflow). The wait is the server's Retry-After, else 60 s doubling to 240 s, and a cooldown over 10 minutes is handed back instead of waited out. Stand-in test: a 429 waits 60 s, then a 401 stops at once. The source is credited in docs/third-party.md.

## 2026-10-20 (74) A thing the player hands over is claimed first

- "I offer him my silver thimble" was refused by Transfer: Clara's belongings were on record (an earlier Claim had opened her account) and held no thimble. Code now puts a Claim before such a hand-over ("Clara has silver thimble", something the character has, at the share of an ordinary personal item, more than half [ASSUMED]). Claim decides whether she has it and records it when it holds; the Transfer then runs on that record (possessions.ts unrecorded).

## 2026-10-20 (75) Given names set sex; money paid in coin with change

- NewCharacter: a person named by a given name, with no stated sex, takes it by a draw against the share of girls among the US births given that name, 1880–2008 (SSA top 1,000 names by sex and year, hadley/data-baby-names; data/given-names.ts, 4,531 names; tools/build-names.mjs). Josiah Crake is a man, Mary Kelly a woman, Leslie a woman 54 % of the time. Names outside the table (Pyotr, Ines) keep the population draw.
- possessions.ts: a sum of English money in words is paid in coin when the payer holds coin ("a penny and a half", "three halfpence", "twopence", "fourpence", "1s 6d", "two shillings and sixpence"; not "a pound of"). The coinage is that of 1816–1971 (farthing, halfpenny, penny, threepence, sixpence, shilling, florin, half-crown, crown, sovereign). The fewest coins that cover the sum are paid, and the change comes back in the largest coins, the receiver taken to hold change [ASSUMED]. Two pennies for a penny and a half: halfpenny back.
- `npm test`: 172 checks, 0 misses.

## 2026-10-20 (76) A slip is a fall on the level

- BodyFall treated every fall as a drop onto the feet ("Fall 0.5 m: lands on the feet, 2.8 kN through each leg"), so Pyotr's slip on the ice was told as a jump. A fall flagged slip, or from 0.5 m or less, is now a fall on the level from the body's own height: down onto the side and the hands. At 65 or over about 1 in 10 such falls ends in a serious injury (Tinetti 2003, NEJM 348:42, citing Nevitt 1991, Sattin 1992, Tinetti 1995). Fractures after a fall on the level were 3.35–4.75 times as frequent at 45 and over as under 45 (McNamee et al. 1997, Occup Environ Med 54:785), so under 45 the share is a quarter [ASSUMED: the ratio holds for serious injury] and 45–64 half way [ASSUMED]. A serious injury is a broken wrist, or the hip at 75 and over, recorded as a fracture. Drawn: 1.8 % at 30, 4.3 % at 50, 8.5 % at 70. A drop after a failed climb is still answered by where the climber stands.
- `npm test`: 174 checks, 0 misses.

## 2026-10-20 (77) A fall leaves the body on the ground; getting up is timed

- After the slip, Pyotr's posture was still standing, so "I get up and look for my glove" took 0 s and the clock stood still (fault 8.3). A slip now leaves the body lying (Person.posture 'lying'). Standing from lying is onto both knees (69.4 TMU, kneel on both knees, as its reverse) then up from both knees (76.7 TMU): 146.1 TMU, 5.3 s [ASSUMED composite; MTM-1 has no motion from lying]. A walk begun from lying stands first.

## 2026-10-20 (78) A night's lodging in the price list

- Story 6's "bed for the night" was priced as apples. Price now lists "lodging (night)": Mayhew names London's low lodging-houses "the penny, two-penny, and three-penny" houses (victorianlondon.org, Mayhew), and the middle tier, 2 d a night in 1851 [ASSUMED middle], goes on the goods' scale, so other places and years follow their price index. A bed, a room or lodging for the night in a good's words is this item. London 1888: about 3 d; Leipzig 1845: 0.58 g of silver. An inn's bed for a traveller likely cost more than a lodging-house's; no series for inn beds was found.

## 2026-10-20 (79) A blow keyed by who strikes it; wounds and harm claims

- Story 4 (Liverpool docks), read from run dadbb7f:
  - "I punch the sailor in the jaw" ran as the sailor striking Jack. BodyStrike's subject was who (the one struck), so the keyed plan put Jack's blow under Jack as its target. BodyStrike is now keyed by attacker, the one acting (plan-schema.ts subjectOf), is among the first round's actor tools, and code writes the player's blow from the words: attacker the player, who the one named, attack from the verb (punch, kick, stab, bite, headbutt), part from "in the jaw", "in the ribs" and the like. It is a scene tool: distance and stance come from the scene.
  - BodyTreat with no wound named returned "No wound NaN". It now takes the one open wound when there is one, lists the open wounds when there are several, and answers "the body holds no wound on record to treat" when there are none.
  - "Jack's knuckles are bleeding" was judged false. A claim whose words state harm to the claimer (bleeding, hurt, broken, a sprain, a fever, a cough, a fall, a slip, a loss) is taken as against their interest and holds (entry 71).
- `npm test`: 178 checks, 0 misses.

## 2026-10-20 (80) A title belongs to its name

- Story 9 (Boston 1846): "Mr. Abbott" became a person called "Mr", drawn as a girl of 0, because the full stop after the title ended the name. A title and the name it leads are now one person in the scene's people, in code-written calls and in the person keys (frame.ts TITLE: Mr, Mrs, Miss, Dr, Monsieur, Madame, Herr, Frau, Senhor, Senhora, Señor, Signor, Don, Dona, Sir, Lady, Lord, Captain, Father, Sister, Brother, Mother…). A title sets the sex, and an age of 16 or more [ASSUMED]. Speech verbs that address a person (beg, plead, implore, urge, promise, thank, warn, order, command) now name their listener ("I beg Monsieur Dufour…" → listener Monsieur Dufour).
- `npm test`: 184 checks, 0 misses.
- A person the story has not seated or laid down stands: "the baker stands at the counter" had timed "stands up from sitting", 1.6 s [ASSUMED default posture].

## 2026-10-20 (81) Code decides how large a seen thing is
- Look's size_m was the model's guess, and almost always 0.5 m: a glove, a face and a window were all given a person's size. Now src/rules/sizes.ts decides it from the target, and the plan's figure stands only where the table has nothing.
- People: ANSUR II (Gordon et al. 2014) median breadths, men / women: bideltoid 509 / 450 mm, head 154 / 147, hand 88 / 78. A person BodySize has drawn is scaled by their height (now stored as Person.heightCm) [ASSUMED: breadth in proportion to stature]. target_who uses the recorded person's sex and height.
- Coins come from Royal Mint diameters: penny 30.81 mm, halfpenny 25.48, farthing 20.19, shilling 23.6, sovereign 22.05.
- The other entries are [ASSUMED] and say so in their row: door 762 mm (2 ft 6 in), sash window, horse, dog, cat, sheet of paper, knife, key, cart, boat, lamp and cup.
- size_m is no longer required. When the table holds nothing and the plan gives no size, Look asks for one and leaves the state unchanged.
- Tests: tests/size.test.mjs (11 checks); engine.test.mjs checks that a penny at 30 m is seen as 0.0308 m when the plan said 0.5.

## 2026-10-20 (82) Meaning is chosen by the model from closed kinds; code holds the numbers
- Principle: code reads no meaning from words. Word lists grow without end (synonyms, borrowings such as Portuguese inteiro / íntegro, luar / lunar, other languages), so they always lag behind what a story says. Instead, the model maps meaning to a closed kind, and code holds each kind's number and source. Price already works this way ("other good" + like).
- Look: the sizes.ts word regexes are replaced by `kind`, an enum of 21 kinds (a person, a head or face, a hand, five British coins, another coin, door, window, and so on, plus "something else (give size_m)"). A person's parts take the recorded sex and height of target_who; with neither, they take the mean of the ANSUR II men's and women's medians [ASSUMED]. A test sees "uma moeda no chão" as kind penny: 0.0308 m.
- Still to convert from word lists to model-chosen kinds, in order:
  1. frame.ts GOOD_WORDS (Price drafts);
  2. BLOW (BodyStrike drafts);
  3. scene-people PERSON_NOUNS / TRADES / ANIMALS and the female role nouns (NewCharacter sex);
  4. KIN;
  5. Claim's harm words;
  6. Act's climb words;
  7. weather place words.
  VerbNet routing stays: its classes are meaning classes.

## 2026-10-20 (83) Five more word lists replaced by kinds chosen by meaning
- Price and BodyStrike drafts: GOOD_WORDS, MEASURE, BLOW and the struck-part map are removed. The planner picks the good, quantity, blow and part from the tools' own enums. The strike draft keeps only attacker and who.
- NewCharacter: the man/woman/boy/girl words, titles, female role nouns and group words are replaced by `named_as`: a man, a woman, a boy, a girl, a child, a person whose sex isn't named, or several people. The model reads this in any language ("Senhora Lopes", "la patronne", "os homens junto ao fogo"). Given names still draw the sex from the SSA share of girls.
- Claim: the harm-word regex is removed. `against_interest` is required and judged by meaning.
- Act: the climb-word regex is removed. `level` is required: "on the level, stairs or a change of posture", or "a climb, jump or drop".
- Transfer: KIN, SEVERED and the body-part names are replaced by `item_is`: a thing, a person or animal, or a part of a living body.
- Still word-based: scene-people's role nouns, which find people in the text, and weather's place words.

## 2026-10-20 (84) People named by meaning in the plan; places without English lead words
- Plan: a new `named_as` field gives, for each person new to the story, the kind the words naming them fix (src/rules/kinds.ts NAMED_AS). The keys are the closed person set. The NewCharacter that code adds for a new person takes it, so "the landlady" that code draws is a woman.
- placeIn: the English lead words (in, near, at…) that guarded GeoNames lookups are removed. Every capitalised name is looked up, except the people the plan lists as present and the cast's names. The model's "at" [lat, lon] stays the first source.
- Still word-based: scene-people's role nouns, which offer the plan its closed person keys. They only suggest keys; the model's "present" and named_as carry the meaning.

## 2026-10-20 (85) Running, rain by the hour, change from the till, inn beds
- Act `pace` (walk, creep, run, sprint), chosen by meaning, also per step.
  - A run goes at 0.45 × the runner's own top speed [ASSUMED runFactor]. Top speed comes from body-engine topSpeedKmh (flying 20 m sprint by sex and age).
  - A sprint holds top speed for 100 m [ASSUMED sprintHold_m], then runs.
  - Ned, 30, takes 70 s to walk 100 m and 30 s to run it (3.32 m/s).
- Weather: a wet day's total is spread over 16 boxes of 1.5 h by a microcanonical random cascade (Olsson 1998, HESS 2:19–30).
  - Split probabilities are 0.25 / 0.25 / 0.5 with a uniform weight [ASSUMED: Olsson's middle values].
  - The result names the spells ("06:00–09:00") and whether rain falls now. The hours are fixed by place and date.
- Change: a receiver whose belongings are on record gives change only from the coins they hold. Otherwise the payment is refused and the story decides what follows. An unrecorded trader still holds change [ASSUMED].
- Price: "inn bed and supper (night)" at 14 d on the 1851 scale.
  - Source: Household Words IX (1854) p. 610, "twelvepence or sixteenpence a-piece, though they sleep there", quoting an earlier account [ASSUMED date].
  - The bed/room/lodging word regex is removed: the planner picks lodging-house or inn by meaning.
- Blackboard's handover check at both ends is met by construction: Transfer writes both ledger entries in code (possessions.ts give/take). The narration side is the rule check's.
- Open: age by occupation. The source is the 1841 occupation abstract (Vision of Britain GB1841OCC, under 20 / 20 and over by trade); the fetch needs the user's approval of the URL.

## 2026-10-20 (86) Bugs found before first use
- placeIn: the change in entry 84 matched every capitalised word, so "14 March" placed a scene in March and "Victoria" in Canada. The lead-word guard (in, near, at…) is back. A setting line that opens with its place ("Boston, Massachusetts General Hospital, …") is read too. A weather city must match the whole name: "the Green Man inn" was Green Bay, Wisconsin, and "George" was George Town.
- index.ts: any error on a call carrying a schema (a 429, a dropped connection) turned structured output off for the rest of the session. Only a refusal of the schema itself (400, 422, a schema or response_format error) does that now.
- send.ts: a model call in SillyTavern had no retry, so a 429 skipped the question pass for that turn. sendModel now retries a 429 or 5xx up to 2 times, waiting at most 20 s (Blackboard's retry rules, capped while a player waits).
- Weather label: a position away from a WMO city was labelled with that city ("Leeds … 34 km" for York), and the narrator could set the scene in Leeds. It is now labelled with the town GeoNames puts there (the nearest place of 15,000 people within 25 km), followed by "weather of Leeds, 34 km".
- Price: a scene outside the price series' city said "in London, 1850" for a York inn. It now says "at London prices" unless the scene is in that city.
- Checked and correct: York 14 March 1850 at 18:40 local time is the end of civil twilight (sun −6.5°), so "night" holds.
- Liverpool was placed in New South Wales: the WMO list names it first, and with no country given the first was taken. With no country, the city nearest the largest GeoNames place of that name is taken.
- "I punch the sailor, drop a penny for the barmaid and wait ten minutes" passed the ten minutes before the punch. A wait named after other actions now runs last; a message that opens with the wait keeps it first.
- The barmaid a Transfer paid was never drawn: Transfer's from and to were outside the person arguments. They count when the plan lists the name in named_as or present (otherwise they are places).
- Seen in the narration: "a 80-year-old" is now "an 80-year-old" (also 8, 11, 18). A result sentence that starts in lower case after a full stop ("Wound 1. the sailor") is capitalised.
- Census trades: the multi-word aliases ("inn, hotel servant", "seaman (merchant service)") never matched, because the alias was compared unnormalised. A barmaid was drawn as an innkeeper and a sailor as Royal Navy. Barmaid, barman, tapster, waiter, waitress and potman are now inn and hotel servants; a sailor is a merchant seaman.

## 2026-10-20 (87) Rules as suggestions
- A setting at the bottom of the panel, off by default, for a world far from real history.
  - [DECIDED] is introduced as what the real world of that time and place would most likely give, to keep where the world and story agree and change where they differ.
  - The brief puts the world's own rules, its world book and the story first.
  - The rule check redoes nothing, and the reply is free prose (structured replies are off).
  - The engine still decides and records everything (bodies, possessions, clock).

## 2026-10-20 (88) Group casts and cut-off replies
- Group chats: the cast held only the card of whoever spoke last. Other members named in a call were drawn as strangers with a random age and sex, against their cards. Every group member's card description is now in [CAST].
- Structured replies: a reply cut off by its length limit is not valid JSON, and the player saw the raw JSON. Its finished passages (scene, numbered results) are now read one by one and shown as prose.

## 2026-10-24 (89) An outside review, checked by running it
A static review (19 findings, none run) was checked against the code and SillyTavern's own source (`public/script.js`, `scripts/tool-calling.js`, `scripts/extensions.js`, release branch of 2026-09-14). Each fix has its test and its negative control (R1–R13b).
- Regenerate after a reply that failed or was stopped (the question pass had run): the turn's calls ran a second time on the moved world (20 minutes became 40). The regenerate starts from the turn's own snapshot (R1).
- Deleting back to a greeting that holds no result left the deleted turn's world; the latest snapshot at or before the chat's end is restored (R2).
- Another chat opened while the question pass waited on the model or the player received this turn's changes; each wait now ends the pass when the chat changed, and the reply is stopped (R4).
- The toolbar's marks are read from their codes: through the notation, every mark but loudness on the first word of a quotation was lost ("↑Stop after the quotation mark), a whisper inside brackets was read as the words "({W", and typed capitals, guillemets or colons elsewhere in a marked line were read as marks (NATO as louder). Typed signs after an opening quotation mark or bracket are read too; one colon between letters is ordinary writing ("Re:Zero") (R5, R10).
- A line in the third person routed to no tool, so the model picked them; the scene's names are now subjects (R6). Asterisks and the character's name are taken off an Act's action (R13).
- "No, I don't think Will did it" redid the last turn as a blow at Will; a correction without "I meant" is now a person or an act, never a clause with its own subject (R7).
- Communicate added its own Lombard rise as a flat-spectrum level; the acoustics' one rise now applies, and a feeling raises the voice on the speech spectrum (R8).
- A fall onto soft ground from 12 to 15.5 m was never fatal while 11.9 m was 43 %; soft ground now counts one storey lower (R9).
- "I run 20 m to the wall" was walked at walking pace, and "5 m to the door, then 10 m to the gate" timed as 5 m: when code writes the Act, the verb now sets the pace (run, jog; sprint, dash; creep) and each leg with its own distance is walked (R14).
- A recorded fact stored the whole list of facts each time; an appended item is one change (R3).
- The ♪ button works from the keyboard (Enter, Space), and the toolbar stays open while it holds the focus (R12). Backspace after a marked one-letter word in quotes takes its marks (R11).
- `npm test` failed to compile under TypeScript 5.x, the version `package.json` installs (`NodeListOf` is iterable only with the `DOM.Iterable` library before TypeScript 6); `tsconfig.json` names it.
- Checked and left as they were: a swipe after function calls restores the world with the tool message's effects, as the tool message stays in the chat; SillyTavern hands interceptors copies of the messages, so the saved chat keeps its hidden marks; nothing changes before a question's popup, so "Say it another way" leaves nothing behind; the 0.5 s pause is the toolbar's only timed pause; the notes are redrawn once per new message.

## 2026-10-25 (90) What the review pass left, done
Each change has its test and its negative control (R15–R22, RT1–RT5, PL1–PL2, SZ1–SZ2).
- "Say it another way" takes the line out of the chat and puts it back in the input box with its marks, once the stopped generation has ended (SillyTavern's `deleteMessage`); before, the abandoned line stayed and the narrator read two lines where the engine read one (R20).
- Code writes calls for the player's own acts only: the subject of the verb's clause is "I", "we", "my" or the character's name, or the clause has none and takes the last coordinate clause's; any other subject's act ("Tom punches Mara", "Will gives Mara one of the apples", "I wait for Tom, who walks 10 m") goes to the planner, which reads it from the scene. Before, each was written as the player's own (Mara punched Mara). An infinitive after a verb that hands the act to its object ("I tell Will to wait an hour") is the object's [ASSUMED list of 33 verbs]; a title's full stop ends no sentence ("Mr. Abbott") (frame cases, R22).
- Typed › ‹ are quotation marks; faster and slower come from the toolbar. Capitals read as louder on a common word (SCOWL's lower-case stems, 39,952, with inflections and drawn-out letters taken off): STOP, NOOOO, DON'T, IDIOTS; NATO and ICU stay as written. A hyphen shared with a hyphened word after "and", "or", "nor" or "to" is no cut-off ("pre- and post-war") (R21).
- The room's echo carries the voice as noise raised it: in a reverberant room a louder voice gains nothing against its own echo (R16).
- A run goes at 0.46 of the runner's top speed, fitted to the speeds free-living runners choose (Selinger et al. 2022, as reported); hurry, rush and hasten walk as fast as one can walk (Bohannon 1997, maximum over comfortable speed by sex and decade) (R19).
- A deletion back past the 400 changes folded into the record's base starts the record again from the world as restored, and every restore trims the record to the chat, so `/rules-replay` rebuilds the state (R17).
- The knockout threshold, the skull factor, the natural-edge factor, the crush share and the flash-point shift are registered (fitted, with the range their data's 95 % interval gives), so the sensitivity reruns vary them (R18).
- TypeScript is pinned to 5.6.3; 6.0.3 emits the same `.js`.
- Three statistical checks sit 4 SD from their rates (N08 0.27–0.67, N13 ≥ 42 of 60, N32 ≥ 12 of 20); a swipe after a function call keeps the call's effect, now checked (R15); the route, plan and size tests have controls.

## 2026-10-25 (91) Reading ordinary lines, and who hears what
Each change has its test and its negative control (Q1–Q11h). Seventy-five ordinary roleplay lines were run through the reader; what it got wrong is fixed here.
- Bystanders on the map overhear speech at their own distance, through walls, over their own background, and come to know what they make out ([OVERHEARD]; R22).
- "He" and "she" as a subject in a line written in the third person: the last name before it whose sex fits (titles, then the share of girls among US births given that first name, then role words), else the player's character when it fits their sex; in a first-person line, someone else (frame checks).
- A blow written by code needs a person or an animal struck: "kick his knee", "knock three times on the door", "beat the eggs" and "jump to the next roof" no longer struck "his", "three", "the eggs" or "to". An act given is no thing handed over ("give Tom a hug"). One spoken to is a person or an animal ("tell the truth", "ask for directions", "give the order to fire" have no listener); a place after the listener is no message ("call out to Tom across the square" taught Tom "across the square"). "I offer the guard coins to look the other way" is the guard's look.
- Acts the line says are not done are no calls and route no tools: not, never, a negated auxiliary, refuse to, almost, nearly, without. "Going to" a verb is intent, no motion. What a character pretends or feigns is a show (SocialResponse).
- Phrases that name another act than their verb: a breath taken or caught (no taking), a breath held (BodyEnvironment, no grip), going into water (BodyEnvironment, no search), a dressing put on (BodyTreat), picking a lock (BodyCheck), keeping watch (Look and PassTime), casting a spell (CastSpell; a glance is cast at no spell), a shot (BodyStrike or BodyCheck; VerbNet files "shoot" under poisoning), a lunge (BodyStrike).
- A compound subject ("Mara and Tom walk 50 m") holds the player; a climb or a jump with a distance is BodyCheck's, never a walk; "look away" has no target; "see Tom enter the room" targets Tom.
- A sense or a target is asked about or taken only for the player's own act ("Will follows the thief" asks nothing; R24).
- Out-of-character asides ("(OOC: …)", "[OOC …]", "OOC:" lines) are taken out before the line is read; a line wholly out of character runs no question pass (R25).
- An expert defender responds 0.91 reaction SDs faster (Zhang et al. 2022): more blocks (R23).
- Ranks, kin, groups and folk (captain, king, mother, crowd, goblin…) count as people a line can speak to or strike.
- Searched and left open: the duration of a knockout (Huang et al. 2023 timed the loss of muscle tone, not of consciousness; OPEN-81 stays); rain noise outdoors (only rain on roofs, BRE IP2/06); BMI by age (the CDC tables did not come through); Selinger et al. 2022's own pages (refused; the running speeds stay as reported by Popular Science).


## 2026-10-25 (92) Sections 89–91 checked again, and what giving and refusing still got wrong
Sections 89–91 were checked from their patch: it rebuilds their tree exactly; TypeScript 5.6.3 and 6.0.3 emit the same `.js`; every test passes on 30 seeds; the 182 controls they list are caught on this tree; the sources they cite say what they are cited for. Each change below has its test and its negative control (Q6b retargeted; Q12a–Q12h, Q13a–Q13c).
- An act given offers no Transfer to the planner either: "give Tom a hug", "a quick nod", "a hand with the cart", "a lift", "a warning", "an order" (before: the router still offered the hand-over that code no longer wrote).
- Calling out is speech: "call out to Tom across the square" offered Transfer through VerbNet's get-13.5.1 ("call me a cab"); call is now Communicate's.
- A thing given with its measure is handed over whole: "give Tom a slice of pie" handed over "slice of", "a cup of tea" "cup of". A measure word that is also an act is a thing before "of": "a pat of butter", "a squeeze of lemon", "a hand of cards" are handed over, "a pat on the back" is not; "a piece of bread" is a thing and "a piece of my mind" an act.
- "Give her a ring" (a call or a ring) and "give him a bow" are left to the planner, which still has Transfer; "give her the ring" is handed over.
- A motion the line says is not done sets no pace and makes no move: "I don't run. I walk 10 m to the door." and "I refuse to run, and walk 10 m" walk (before: timed as a run), and "I don't walk 10 m to the door" moves no one (before: the distance alone made a walk). `undone()` moved from frame.ts to actions.ts, which both use.

## 2026-10-25 (93) The player's line read by its grammar
The word lists added in entry 92 (acts given, ring and bow, measure words) were made up; they are gone. The reader follows Huddleston & Pullum's Cambridge Grammar of the English Language (2002), and Open English WordNet 2024 gives only the facts about single words its rules ask (grammar.ts, data/wordnet.ts, tools/build-wordnet.mjs). Each change has its test and its negative control (G1–G23; R22b, Q7b, N65d and Q11h retargeted; Q6b and Q12a–Q12h removed with the code they guarded). Support verbs that are no light verbs of the grammar (steal a glance, throw a punch) still route the noun FrameNet files, and catch or draw a breath is still breathing.
- Light verbs (ch. 4 §7): a light use is read as its associated verb, so "I give Tom a quick kick in the shin" is a blow at Tom (before: a hand-over of "quick kick"), "Mara gives Tom a punch" a blow, "I take a walk to the market, 300 yards" a walk with no taking, "I take a sip of the wine" drinking, "I have a look around the room" a look at the room, "I give a loud shout" speech, "I give chase" a chase, "I raise an objection" speech (before: a price and treatment), "I pay attention to the guard" a look (before: a price). An ordinary use hands over ("I give the beggar my coat", now drafted), and one that could be either ("give her a ring", "give Tom a black eye") is the scene's.
- Who does the act of a clause inside another (ch. 14): "I make Tom walk 10 m to the door" is Tom's walk (before: the player's), "I rely on Tom to wait an hour" Tom's wait, "I watch Tom climb the wall" Tom's climb; the verbs come from the grammar's classification of catenative verbs, not from a list of 35 written here.
- Negation (ch. 9): "I fail to climb the wall", "I refrain from walking 10 m", "I stop Tom from leaving" are no acts (before: a climb, a walk, a leaving routed); "I didn't forget to walk 10 m to the door" is a walk.
- "Him" and "her" (ch. 17): "Tom punches me. I hit him back." is a blow at Tom (before: none drafted); "Tom and Will shove me. I hit him back." is left to the scene.
- A look's target stops at a coordinator: "I have a quick look around and take the lamp" no longer looks at "and take".
- Estigarribia's A Grammar of Paraguayan Guarani (2020) was read alongside for comparison: the same classes of verbs by their complements, but Guarani marks with affixes (the active and inactive person prefixes, the negative circumfix nd-…-i, the embedded verb's own person prefix) what English marks by order and small words.

## 2026-10-25 (94) What else the grammar reads: auxiliaries, the passive, conditions, wanting, amounts, people
Twenty-eight more ordinary lines were read through entry 93's reader; what it got wrong is fixed here, each with its test and its negative control (G24–G38; RT1 and RT4 retargeted).
- "I am" was read as "a m", one metre, since the first version: "I am walking to the door" drafted a 1 m walk, "I am tired, so I walk to the inn" too. A number in words is now a word of its own ("a mile", not "a m"); a number in figures may still touch its unit ("50m").
- Auxiliaries are no lexical verbs (CGEL ch. 3 §2): "I will climb the wall tomorrow" no longer offers a hand-over (will as bequeathing); "I have walked" no eating. A name inside a sentence is no verb: "I signal to Will to wait", "I talk to Rob about the horse", "I hand the letter to Bill" no longer route bequeathing, robbing or a bill.
- The passive (ch. 16 §10): "I am hit by Tom" and "I am given a coin by Tom" draft nothing of the player's; "Tom is hit by me" drafts the player's blow at Tom; "I get hit by Tom" routes the blow, not getting.
- Modality and conditions (ch. 3 §9.1, ch. 8 §14): "I could hit Tom", "Can I walk 10 m to the door?", "I hit Tom if he moves", "If the guard looks away, I walk 10 m" are not done acts; "I can see the rider" is seen ([24ii] p. 185); "I will walk 10 m to the door" is the act about to be done [ASSUMED for roleplay].
- Wanting someone to act is no act (Karttunen 2012; ch. 14): "Tom wants me to walk 10 m to the door" drafts no walk; "Tom makes me walk" does. The causatives make, have, get, let and help route the verb after the person ("I have Tom give me the coin" is no eating).
- A measure of goods is read by the grammar of quantity nouns (ch. 5 §3.3) with WordNet's quantity and thing senses, not a list of 16 words: a cup of tea, a bottle of wine, a loaf of bread have a price; a pack of wolves and a group of men none.
- People are read by WordNet's first sense (a person): the 55 ranks, kin and folk of the [ASSUMED] list are covered by it; seven it does not cover stay listed (gaoler, orc, creature, beast, crowd, mob, audience).
- A look's target keeps its of phrase ("I see a pack of wolves").
- Left as it was, by choice: "I want to wait an hour" is still drafted as waiting (an existing check asks for it); the senses of follow and take in ask.ts are choices between tools (a chase, a look, a walk), not senses a grammar or a dictionary separates.

## 2026-10-25 (95) The reader against the grammar's chapters
Entry 94's reader was measured against the Cambridge Grammar chapter by chapter: a probe line for each construction a player's line uses, read through the router and the frame reader (59 lines; 29 now read differently). What it got wrong is fixed by that chapter's own rule, each with its test and its negative control (G39–G57, G59–G85; G1 and G34 retargeted to the lines they guard now, R6's check extended); the coverage table is in df-body-engine.md.
- Where the subject stands (ch. 4 §3.1, p. 243; ch. 8 §20.1, pp. 779–780): "Today I walk 10 m to the gate", "In the morning I punch Tom", "Without a word I hand Tom the letter" and "The next day I wait an hour" drafted nothing, because the subject was taken to be the clause's first word. The subject is now the pronoun or name just before the verb, after an adjunct in front position. The head of a time NP ("day", "morning") is a noun of WordNet's noun.time, which data/wordnet.ts now marks (kind t).
- Time (ch. 3 §§2.5.9, 4.2, 4.3.1, 10.2; ch. 8 §§6.2, 9):
  - The present tense of a player's line is "a commentary on one's own actions" (p. 128), so it is the act now.
  - A habit puts the act at another time: "every day", "usually", "every time he moves".
  - So do a time before or after now ("yesterday", "two days ago", "last week", "tomorrow"), "used to", "about to", and will with the perfect ("I will have walked 10 m by then": a judgement about an act, p. 210).
  - These acts are no longer drafted.
  - A clause takes its own time adjunct, else the adjunct of the clause before it in the sentence: "Yesterday I bought bread and walked 10 m to the door" drafts no walk.
  - The past tense with no such adjunct is the turn's narrative tense [ASSUMED for roleplay]: "I walked 10 m to the door" is drafted.
- Clause type (ch. 10 §§2, 4.7.2, 9.2.2, 9.3.2):
  - "Do I walk 10 m to the door?" and "I walk 10 m to the door?" are questions, so no acts.
  - The question check that entry 94 added matched any word as the subject after an auxiliary, so "I will just walk 10 m to the door" was read as a question and drafted no walk. The subject is now matched with its case.
  - A question about perceiving is still looked into: "Do I see anyone at the window?".
  - "Let us walk 10 m to the door" is a proposal. It routes speech and offers the walk, but drafts no walk; before, it was drafted as the player's walk.
  - "Tom, punch the guard!" is speech to Tom. Before, it was read as no act at all, with only the blow offered.
- The prepositional alternant of the ditransitive (ch. 4 §4.3 [7], p. 248): "I give the coin to Tom", "I give a coin to a beggar" and "I hand the letter back to the captain" drafted no hand-over since the first version (only "give Tom the coin" did). They do now.
- Anaphora (ch. 5 §6.1 [6iii], p. 370; §17.2.2, p. 488; ch. 17 §3.1 [3i], p. 1484; ch. 15 §1):
  - "It" handed over is the one thing named before it: "I take the coin and give it to Tom" hands over the coin. When two things fit, the scene settles it.
  - "A man walks in. I punch him." strikes the man.
  - "I hit myself" strikes the player.
  - Coordinated names are one target: "I see Tom and Will".
  - "Man" and "men" were no men to census.ts wordSex: it read "fisherman" but not "man". Fixed.
- Clefts (ch. 2 §16, p. 67; ch. 16 §9):
  - "It is Tom that I hit" is read as its basic counterpart, "I hit Tom".
  - "What I do is walk 10 m to the door" is read as "I walk 10 m to the door".
  - "It is a fact that I hit Tom" is extraposition, not a cleft, and stays as it is.
- Order (ch. 15 §2.2.3, pp. 1299–1300):
  - Code writes its calls in the order the line tells the acts. Before, "I wait for twenty minutes and then walk 10 m to the door" listed the walk first.
  - An act in a before-clause comes after its sentence's other acts; an act in an after-clause comes before them.
- The router:
  - "Last week I punched Tom" no longer offers a price ("last" read as a verb).
  - "I used to punch Tom" no longer offers eating or waiting ("use").
  - "I have just walked" no longer offers eating ("have" before an adverb and its participle).
  - "Tom punches me" routes the blow even when the cast's names are not given (a name that opens a sentence).
  - The scene's names are still needed for a name that is a common word: "Ash climbs the wall" routes the climb only through them. R6's check now covers that case too, because the given name it used before (Mara) no longer depends on the scene's names.
- Read, and left as they are:
  - "They" and "them" for people: BodyStrike strikes one person, so "They hit me. I hit them back" is left to the scene.
  - A preposed object ("Tom I punch, not Will").
  - Comparatives ("I walk faster than Tom", ch. 13): they change no argument code writes.
  - A bounding frequency ("I hit Tom twice"): one blow is drafted, and the number of blows is the planner's. CGEL [7], p. 714, gives both readings, two kicks or two occasions.

## 2026-10-25 (96) Where a walk ends, how long a walk lasts, and three sources found
Entry 95's coverage table left the prepositions of a walk, the duration of a walk and the resultatives unread. This entry reads them by the grammar's own rules, each with its test and its negative control (G86–G103). It also looks on the web for the three sources entries 89–92 could not read.
- Where a walk ends (CGEL ch. 8 §4.3, pp. 684–688; ch. 17 §9.1, pp. 1549–1550; grammar.ts walkEnd). Before, every walk without to, into or onto ended "outside", and towards counted as arriving. Now:
  - A goal (to, into, onto) is where the walk ends, but "to" before a verb is an infinitive: "I walk 10 m to open the door" no longer walks to "open the door", and "to the door to open it" ends at the door.
  - "Towards" gives a direction, so "I walk 10 m towards the door" ends 10 m towards it, not at it.
  - "Across" alone ends on the far side.
  - A path gives an intermediate place: "10 m along the wall", "10 m past the guard"; "by" with a walk is "past".
  - A source gives the start: "10 m away from the fire".
  - A place said as a goal keeps its preposition ("behind the house", "near the fire", "beside the river"); "in the garden" is the garden.
  - "There" is the place named before it ("I see Tom at the bar. I walk 10 m there.": the bar).
  - A walk whose end is not said ends at a spot its distance away, and outside only when the words say out.
  - A goal's noun phrase keeps a place phrase after its noun ("the market on Wentworth Street") and ends at a time phrase ("to the door in a minute").
  - Each leg of a walk in legs is read the same way.
- How long a walk lasts (ch. 3 §3.2.3 [18], p. 122; ch. 8 §4.3 [21], p. 684): "I walk for an hour", "I walk along the river for an hour", "I run for ten minutes" and "I wander the streets for two hours" draft time spent walking (PassTime with the walker, running for a run), which settles the walk. Before, nothing was drafted. A goal bounds a walk, so "I walk to the market for an hour" takes no for-phrase and drafts nothing.
- Resultatives (ch. 4 §5.3, p. 260: "He washed it clean entails He washed it"): the reader reads the act, as it did ("I knock the guard unconscious" is a blow), and the result is the outcome the engine decides; nothing changed.
- Sources found on the web:
  - Bohannon 1997's Table 4 was read in full from the academia.edu copy. All 24 means are as BRISK has them.
  - Selinger et al. 2022 now has its full citation, Current Biology 32:2309–2315. Its speeds still come from the Popular Science report: PubMed Central asked for a browser check, and Stanford's and Queen's news, the SimTK data page and Scimex give no figures.
  - The length of a knockout stays OPEN-81. The one statement found, "consciousness is typically regained spontaneously within a few minutes or less" (Hånell & Rostami 2020, Front Neurol, a review, uncited and unmeasured), agrees with the drawn median of 1 min, 95 % under about 5 min.

## 2026-10-26 (97) The line as the player meant it
Entries 93–96 read the written line ever more closely. The written line is the lossy output of what the player has in mind: typing adds noise, and a speaker leaves out what they expect the listener to know. A new layer, src/rules/intent.ts, rebuilds what the player meant from the scene before the grammar reads the line. It reads the line the way human listeners have been shown to: a noisy channel, where the meaning is what was likely meant given what was likely typed (Levy 2008; Gibson, Bergen & Piantadosi 2013, PNAS). Each change is shown under the line (☞ "punhc → punch") and told to the planner ("THE PLAYER'S LINE AS MEANT"), so a wrong reconstruction is corrected in the next line. Tests: tests/intent.test.mjs (35 checks) and the engine's I1; controls I1–I19 and L1–L3, with V7 and Q4 retargeted to the renamed line.
- **Noise in the words.**
  - A typed form that is no word is read as the word one slip away (Damerau 1964). A second slip is about 3 % as likely as a first: typists leave 1.167 % of characters wrong (Dhakal et al. 2018, CHI, 168,960 typists).
  - Among the words one slip away, the scene's words are likeliest: its people and what the narrator named, a share of the prior [ASSUMED 0.5]. So "I hit the gaurd" is the guard when a guard is in the scene, and is left as written when the scene favours neither guard nor gourd.
  - Before a noun phrase, the word is the preposition one slip away ("wiht my knife": with).
  - Capitalised forms (names the story has not met) and quoted words are left as written.
  - Before, "I punhc the gaurd" routed and drafted nothing.
- **A dropped word.** "I give the coin Tom", read literally, gives Tom to the coin; one deleted word away, it is the hand-over to Tom (Gibson et al. 2013 found deletions read away most readily).
- **What was just done.** "Again", "I do it again" and "the same to Will" are the player's last act, or that act done to Will (CGEL ch. 17 §7.6, pp. 1532–1533). Before, they drafted nothing.
- **Who "him" is.** An unstressed pronoun codes a referent at the centre of attention (Gundel, Hedberg & Zacharski 1993: 214 of 215 tokens of "it"). Whom the speaker means is weighed as in Kehler and Rohde's Bayesian model, P(referent | pronoun) ∝ P(pronoun | referent) · P(referent), with English writers' pronoun rates for two people of one sex (Rosa & Arnold 2017, Exp. 2): 69 % for the last sentence's subject, 18.5 % for another person in it, about 1 % for one outside it [ASSUMED from Gundel et al.'s ratio].
  - These weights replace the chooser's hand-set ones for him and her (ask.ts), so the existing mixed-initiative thresholds now act on a model.
  - "Will glares at Tom. I tell him to leave." takes Will (78 %). "I punch him." asks, because a blow needs 90 %. "Tom and Will shove you. I punch him." asks.
  - "Back" is "in repayment or retaliation" (Open English WordNet 2024), so "Will laughs. Tom shoves you hard. I hit him back." is a blow at Tom. Before, the chooser asked among everyone.
- **What the player is after.** A goal the player stated stays in force until they state another (the situation model's intentionality dimension, Zwaan & Radvansky 1998; goals inferred from what people say and do, Baker, Saxe & Tenenbaum 2009). It fills a search with no "for": "I'm looking for the key" … "I search the desk" is a search for the key. The planner is told the goal.
- **Lexicon gaps found on the way:**
  - lexicon.ts lacked the prefixed words its Hunspell sources build with prefix flags ("return", "unable", "recover", "reply", "dishonest", "injury", "inlet": 3,076 words). They are restored from WordNet where it lists the prefixed word (tools/build-wordnet.mjs PREFIXED; nouns and idioms unchanged).
  - lexicon.ts also lacked "into"; the grammar's prepositions are now words.
  - Before, a sentence opening with such a word could be taken for a name.
- None of the 368 player lines in the tests, eval scenes and stories changes with no scene, and none routes or drafts differently (lossy-lines corpus: meant-corpus.txt in the delivery).
- Not covered yet: real-word slips ("form" for "from") need a model of which word fits the sentence. Plural "them" for a group is still left to the scene. The goal fills only searches.

## 2026-10-26 (98) A second outside review, checked by running it
A static review of the current tree (10 findings, none run; it read half the sources) was checked by running each finding, with the review's own test where it gave one, and against SillyTavern's source (`public/script.js`, release branch of 2026-09-14). Seven reproduced, three in a form other than the review's; each fix has its test and its negative controls (RV1–RV16).
- **A turn run twice.**
  - Send with the box empty after a reply failed or was stopped: SillyTavern adds no message and starts a 'normal' generation, so the snapshot taken then held the turn's calls and the pass ran them again (the review's test: 20 minutes became 40). The pass now puts the world back at the line's start whenever it runs a turn's calls again, from a snapshot taken before any pass ran for that line; one taken after is marked and passed over. A line edited in place after its pass runs as edited, from the same start (30 minutes, not 50). A new line sent instead keeps the stopped line's outcome, since that line stays in the chat (R26).
  - The review traced a doubled blow to a correction ("no, Will") cutting only the pass's own copy of the chat. That copy is the planner's, by design: the narrator reads the whole chat and is told the last account did not happen. The doubling it found needs no correction. SillyTavern saves the narrator's tool calls as a message and starts a 'normal' generation for the reply (`script.js` 5434–5435), which took a snapshot with the tools' effects. A swipe restores it. With function calling on, the tool message stays in the prompt and the pass does not run, as entry 89 found. With function calling turned off, the tool message leaves the prompt (`coreChat`, 4496), the pass's chat ends at the player's line, and the turn's calls ran on top: two blows. The same restore at the line's start fixes it; the review's fix (one more snapshot in the correction) did not, in SillyTavern's own order (R27).
- **The notation read as words.** index.ts turns every marked player line into notation before the pass, as the models should read it. The pass read the last line from its codes, but earlier lines and the written time from that notation. A pause marked on "2:20 pm" set the clock to 2:20 at night, a pitch mark on "May" lost the date, and "again" after "I sho::ve Tom" read as "I shove:: Tom". Code now reads each player's line from its words (R28). The review's form of this, hidden tag characters reaching the models, does not happen in use: every caller notates first, and the tools' own runs carry no marks.
- **Marks left on punctuation.** Backspace or Delete on the one letter of a marked word left its invisible block when a dash, an ellipsis, a guillemet or a bracket stayed ("I—" became an unseen block before "—"). A word keeps its marks only while a letter or digit is left in it ("U.S.A." less its A keeps them) (ui R26).
- **VoQS braces after a dash.** '"Wait—{W not now W}"' left "{W" among the words while its closer was taken off. Dashes and ellipses may now cling to a brace as quotation marks and brackets do. Braces glued to a word ("{WhelloW}") stay no span, as on the VoQS examples (Wikipedia, Voice Quality Symbols: "{3V! ... 3V!}"), since "{Fred}" is none either (ui R27).
- **Curly apostrophes.** The router split words at ’: "I’ll punch him" routed nothing and "I won’t drink it" read "won" as win (Transfer). The review's example, "I don’t hit him", routed nothing by luck. It now reads ’ and ‘ as the straight marks, and eight lines route alike typed either way (route).
- **The rule check on another swipe.** An answer that came back after the player swiped to a reply of the same words was written on the new swipe, which was then rewritten. It is now kept for the swipe it read. An answer that comes after the player has written on stays on its reply and rewrites nothing; before, it rewrote the newest reply (R29).
- **Judged numbers in comments.** The shares of falls on the level that end in a serious injury under 45 (0.025, range 0.021–0.030 from McNamee et al.'s ratio 3.35–4.75) and at 45–64 (0.05, range 0.025–0.10), and a warm-blooded creature's peak heat production (4.9 × resting, range 4–8 for mammals, Minnaar et al. 2014, J Exp Biol 217:1363, citing Careau 2013 and Hinds et al. 1993), are registered. Of 1,500 slips at 30, 12 now say they are fragile. The peak is read where the cap can bind: a dog in 2 °C water, not one in a −30 °C wind its fur keeps out (R30). The review's other numbers stay listed in docs/constants.md under "Assumptions not yet registered" (325), for want of a source for their range: the full-thickness burn dose, the skin depth, the substance thresholds, the fact-overlap share and the spread of trust.
- **Checked and left as they were:**
  - notateChat run twice keeps the codes (the review's own test passes), since a notated line has none left to take. Its comment now says that prosody.ts reads every sign but › ‹, which typed are quotation marks.
  - The state kept on each reply (`extra.rulesResult`) grows with the chat: 1.7 kB at the first of 20 scripted turns, 3.2 kB at the last, 51 kB in all. It is what a branch or a deletion restores from (syncRulesToChat). Deleting it beyond the last 30 replies, the review's fix, would start a branch from an older reply in the wrong world, so it is not taken. Storing older results as differences would keep both.
- Checked:
  - `npm test` passes: route 156, frame 176, intent 35, engine 159, plan 58, size 9 of 9, ui 40, all with 0 misses. Every new check fails on entry 97's tree.
  - Negative controls: 324 of 324 caught. The full run caught 320.
  - H2, R11 and Q11f were retargeted, because the lines they break were rewritten (keyDelete's word test; the router's straightened text).
  - R1 was no longer caught, because the pass's own restore now covers the regenerate it guards. Its test now also checks the world at the generation's start: a call the stopped reply made, whose message was never saved, is gone before any pass runs.
  - Each of the four is caught.

## 2026-10-26 (99) A third outside review, checked by running it
A static review of entry 98's tree (9 findings in full, two more in its table; none run) was checked by running each with its own test, and against SillyTavern's source. All nine reproduced as tested. Three of them happen only when a line joins the chat before the generation starts, as `/send` then `/trigger` does: SillyTavern's Send starts Generate first and adds the line inside it (`script.js` 1764, 4299, 4453), which the review's tests reverse. Each fix has its test and its negative controls (RW1–RW15).
- **Swiping back to an earlier swipe** (no generation runs) restored its world but kept the later swipe's changes in the record, so `/rules-replay` failed. The turn's changes leave the record and one entry, "swipe shown", holds what the swipe shown changed; earlier turns keep theirs (R31).
- **A line sent by `/send` before `/trigger`:**
  - A correction sent that way, its reply stopped and regenerated, brought the undone blow at Tom back: a snapshot taken with the line in, before the correction ran, held it. The restored world is now kept at both places a start is looked for (R32).
  - A regenerate of such a line found no snapshot at the line's own place and kept a call the stopped reply made; the pass then put it right, but only if the pass ran. It now looks at the reply's place first, as the pass does (R33).
  - A line deleted and another sent in its place was taken for the same line edited, so the pass restored the deleted line's start over a `/rules-time` set in between. Deleting a line now takes its pass with it (R34).
- **The prompts' notation.** The picker's and the planner's prompts now write hidden marks in the notation themselves. index.ts notates the chat first, but `/rules-eval` and the tools' runs do not; none of them holds marks today, and the prompts no longer depend on it (R35).
- **A listener with modifiers, and groups.**
  - "I tell the old blind beggar, …" drafted nothing: only the word after the article was read ("the old").
  - "I shout to the crew", "I call to the patrol" and "I tell the council" drafted nothing either: a group noun was no person.
  - The listener is now the noun phrase up to its head, and a group of people is spoken to as a person is. A group of people is a noun whose first sense WordNet files below social group or people; 359 nouns, among them crew, patrol, council, jury and crowd, but not table, class or herd.
  - A blow still lands on a person only: "I hit the board" is no blow (frame).
- **Capitals that are abbreviations.** "the WHO", "the IT desk" and "the OR" read as louder words, lowercased.
  - After a determiner, capitals spelling a pronoun, a conjunction or an auxiliary are an abbreviation, since pronouns take no determiner (CGEL ch. 5 §10.2, p. 429). LA, DC, HR, PR and ER join the list.
  - Without a determiner they still read as louder ("WHO did this?", "Get IT away!", "MA!"). So "I work in IT" still reads a louder "it", and the note under the line shows it (ui R29).
- **The typeset line.** The words the typesetting adds (inhales, angrily, a pause's dot) are not selected with the line, so a line copied from the chat is the player's own (ui R30). A pause's title gives its own length (ui R28); the toolbar writes only half-second pauses, so the title was true for every pause it makes.
- **Checked and left as they were:**
  - SillyTavern's edit box takes the saved message (`script.js` 8278: `editMessage.mes`), not the page's text, so the typesetting changes no edit.
  - Typesetting a line twice finds no hidden marks the second time.
  - The voice toolbar is built once, at start-up, and only when it is absent, so its listeners are never added twice.
  - The call count a swipe-back leaves (`s.calls`) seeds the next turn's draws differently, but a draw is drawn either way.
- Checked:
  - `npm test` passes: route 156, frame 185, intent 35, engine 164, plan 58, size 9 of 9, ui 43, all with 0 misses. Every new check fails on entry 98's tree, except the hand-over to the crew, which guards the new kind.
  - Negative controls: 339 of 339 caught. V2 and Q6c were retargeted to their rewritten lines.

## 2026-10-26 (100) The state over time, checked all at once
Three outside reviews in a row found state bugs one path at a time (a turn applied twice, an outcome lost after a swipe, a deletion or a resend). This entry checks the whole class at once, then fixes what the check found.
- **The check:** tests/sequences.test.mjs.
  - It plays random chats through SillyTavern's own event order (`public/script.js`): Send, an empty Send, a stop, `/send` then `/trigger`, regenerate, swipe, swipe back, deleting the last messages, an edit, and the narrator's PassTime and RecordFact calls with function calling on or off.
  - After every step it compares the world with one rule, read from the visible chat: the start, plus each player line's outcome from its last pass, plus each narrator call whose message is in the chat. The lines are "I wait N minutes." and the facts share no word, so the clock and the facts are exact.
  - It also checks that the record of changes rebuilds the state.
  - A failing sequence is cut to its fewest steps.
- **On entry 99's tree, 206 of 300 sequences failed:**
  - 142: a deletion lost an outcome that stands. "I wait 4 minutes", reply, delete the reply: the clock went back to 600 while the line stays in the chat; a new line then added to the wrong time.
  - 49: a deletion kept an outcome that goes. Deleting a line `/send` put in, with no reply, kept its minutes.
  - 4: a `/send` line stopped and sent again with an empty box ran its calls twice.
  - 11: the record no longer rebuilt the world after a deletion or swipes (clock and facts).
- **The fix:**
  - Every message keeps the world it ended with and how many changes the record held then: a reply's swipe when received, a line when its pass has run, a narrator's tool call and the greeting when a generation starts from them. A deletion puts back the world of the last message that holds one, and cuts the record to match.
  - A line's start is kept when its first pass runs, whichever order the line joined in. When the later lines are deleted (and with them the start kept), the line starts from the world of the message before it.
  - After a restore, when the record no longer rebuilds the world, one entry holds the difference.
- The first round of the fix showed a class it caused: after the latest line is deleted, an empty Send on the line before ran its calls on top. That is now fixed too.
- **After the fix:** 0 failing sequences in 300 of 24 steps (in `npm test`, 11 s), and in 6,000 of 40 steps on six seeds. Each class has one named case in tests/engine.test.mjs (R36–R41), and each part of the fix has its negative control (RX1–RX10).
- **Code the line's start made redundant, taken out:** two "restored" entries the sequences never needed (in a correction, and in the fallback for older chats); the snapshots marked `passed` (entry 98) and the snapshots a correction wrote at its line's place (2026-10-23) and at its reply's (entry 99). The full control run showed their controls (RV3, RV4, RW3, N66's) were no longer caught: the kept start does their work. One case is no longer covered: a chat saved by an earlier version in the middle of a corrected turn, whose reply is then swiped, starts that swipe from the undone reply's world.
- **Not covered by the rule, and left as it was:**
  - A deletion in the middle of the chat: the later replies were written on the world as it was, so it stands.
  - `/rules-time` between turns.
  - Function calling switched off in the middle of a chat (R27 covers its main case).
  - Corrections ("no, Will"): their lines are no waits.
- Checked:
  - `npm test` passes: route 156, frame 185, intent 35, engine 170, plan 58, size 9 of 9, ui 43, sequences 300 with 0 failing, all with 0 misses. On entry 99's tree, 206 of the same 300 sequences fail, and 4 of the 6 new engine cases fail.
  - Negative controls: 345 of 345 caught. The second full run caught 344; RX6 was caught once R39 gained its `/send` case, where only the world of the message before the line gives the start.

## 2026-10-26 (101) A fourth outside review, checked by running it
A static review of entry 100's tree (New.pdf: 10 findings; its author ran no code) was checked by running each finding's own test, and against SillyTavern's source. Seven reproduced as reported and one in part; two did not. Each fix has its test and its negative controls (RY1–RY26). The controls then showed five parts of the fix that no test reached; the cases written for them found two more state bugs, fixed here too.
- **A line keeps its own start and its own pass.** Entry 100 kept one start, the latest line's, and snapshots by chat position, which a deletion moves. Now each player line keeps the world it starts from (`extra.rulesStart`, when its first pass runs; a correction's once the world is put back) and its pass (`extra.rulesPass`).
  - "I hit him." (Tom), "no, Will", "I wait 5 minutes." deleted, then the correction's reply swiped: Tom was struck again. The correction's line started from the reply before it and was read afresh as a new line (R42).
  - At the start of a swipe of the correction's reply, before any pass ran, Tom was struck: the swipe started from a snapshot taken before the correction ran. It now starts from the line's start, or after the narrator's tool calls from the world the last tool message keeps (R43).
  - After a deletion in the middle of the chat (the first turn), a swipe of the last reply started from the shifted snapshot: 620, not 630; after a tool call, 610, not 635 (R44).
  - Found by the cases for the controls: a "no, Will" after an earlier turn was deleted was read as a new line, and the blow stayed on Tom. The engine's latest pass is dropped once the count of lines falls below its own; the correction now reads the pass the line before keeps (R44).
  - Found the same way, and broken in entry 100 too: a line whose pass stopped after its calls ran (the model did not answer the next round), sent again with an empty box, ran its calls twice: 614, not 607. A line that keeps a start is now started there again (R44).
  - The record of changes is cut by its count of changes, not by chat position, so a swipe back or a new swipe after the first turns are deleted keeps the turns before in it (R44).
  - A chat saved by entry 100 still starts its latest line from the engine's start (R42).
- **Old messages let go of their worlds.** Every message kept a copy of the world. Player lines and tool messages more than 30 messages back now let go of theirs, with their starts and passes; replies keep theirs, for a deletion back to one or a branch from it. A deletion more than 30 messages back to a player line starts from the reply before it, as the 30 snapshots did before entry 100 (R46).
- **"Him" after a preposition.** "A sailor walks in with a lantern. I punch him." drafted no blow, since "the lantern" also fitted "him". "I sit at the bar with my friend. I punch him." struck "the bar".
  - The phrase after to, at, with, from, ask, tell, greet or give now counts only when its words name a person or an animal (as a blow's object is read), and it is no pronoun.
  - One met as "a monk" is "the monk" (CGEL ch. 5 §6.1 [6iii], p. 370); before, "the a monk".
  - The phrase's second word is read ahead, so "at the bar with my brother" finds my brother (frame R47).
- **Markdown emphasis.** "I punch **Tom**.", "I talk to *Rob* about the horse.", "I _whisper_ to Will" and "I wait *ten* minutes." drafted nothing.
  - A run of * or _ paired around words now goes before the line is read. A _ goes only at a word's edge (CommonMark), so snake_case stays.
  - "again" after "*I punch Tom.*" is now "I punch Tom." on the note, without the asterisks (frame R48).
  - The review's own case did not reproduce: "*Tom punches him.*" with Tom the player drafts nothing for code to get wrong.
- **Capitals.** "my PIN", "the SWAT team", "an LED lamp", "She has AIDS." and "My SIM card." read as louder words, lowercased ("my pin").
  - AIDS and SIM are dictionary nouns written in capitals, and are now listed.
  - PIN, SWAT and LED also spell verbs said louder ("PIN him down!"), so they stay as written only after a determiner or a possessive.
  - RAM stays louder ("RAM the gate!").
  - "D-:", a face, read as a cut-off "D-"; a hyphen before a colon is no longer one (ui R49).
  - The review's claim that "the swat team" routes a blow did not reproduce: a blow needs a creature after its verb.
- **Head-first falls.** A head-first landing from 0.6 m had a 44 % death chance: rule 576's "one row down" took the row under 6 m to the 12 m row.
  - Under the first row a row is now one storey (3.6 m, the rows' spacing) [ASSUMED], as soft ground already was. Head first: 1.5 m 0 %, 8 m 41.1 %, 8.4–11.9 m 44 %, then the rule's rows, 12 m 56 %, 15.6 m 78 %.
  - Head first on soft ground is the row itself, as the rule's two shifts cancel; before, head first alone counted (R45).
- **A world-book line.** `/world-add` and the world-book button sent the line with its hidden voice marks to the model, and an entry drafted from no answer saved them. The line is now read in its words (ui R50).
- **Checked and left as they were:**
  - Reloading the extension in place: SillyTavern adds an extension's script only when no script of that id is in the page (`extensions.js` 823), and a module runs once, so the settings and listeners are not added twice.
  - Tapping a toolbar button on a phone: by the Touch Events order a tap fires mousedown after touchend, and the handler cancels it, so the focus stays. Not run on a phone here, and the review gives no trace.
  - Toasts: SillyTavern sets toastr to escape HTML (`script.js` 360), so a quote or an entry shows as text.
  - The 160 in the speech index's level distortion is ANSI S3.5-1997's own constant, cited in acoustics.ts's header.
  - Soft ground: 56 % at 19.2 m and 78 % just above it. That is rule 576's table read one row up: 78 % at 19.2 m, all above.
  - "WE" louder and "US" kept (the United States): the list's choice, which the note under the line shows.
  - Hidden marks in story facts: facts are written by the model, which reads the notation, so they hold none.
- Checked:
  - `npm test` passes: route 156, frame 188, intent 35, engine 181, plan 58, size 9 of 9, ui 45, sequences 300 with 0 failing, all with 0 misses. Every new check fails on entry 100's tree: engine 11, frame 2, ui 2.
  - Random sequences: 0 failing in 1,000 of 40 steps on each of six seeds.
  - Negative controls: 369 of 369 caught in one full run on the final tree.
  - Controls brought up to date:
    - Retargeted to their rewritten lines: R9, R15, Q4b, RV1, RV2, RW10, RX6 and RX9.
    - R13's case gained an unclosed asterisk, since paired ones now go before the action is read.
    - R15 and R39 gained an older-chat case, served by the snapshot and prior-message fallbacks.
    - RX9 now runs the sequences.
    - RX4's line is gone; RY8 breaks its successor. RX10 broke the same line as RX9, now one settle in `restoreAt`, so it was taken out.

## 2026-10-26 (102) A fifth outside review, checked by running it
A static review of entry 101's tree (New1.pdf: 9 findings in full, and 11 rows in its table; its author ran no code) was checked by running each finding's own test, and against SillyTavern's source. All nine reproduced, the first in a corrected case. Of the table's other rows, the dialogue left in an Act's action reproduced and is fixed with the fifth; four did not (its 1, 3, 9 and 10). Each fix has its test and its negative controls (RZ1–RZ24). Writing the tests found three more defects, fixed here too.
- **A swipe after an earlier turn is deleted.** "I hit him." (Tom), "no, Will" (the blow moved to Will), then the first turn deleted and the correction's reply swiped: the blow at Will was lost, and the narrator was not told of the correction.
  - The line's place, the count of lines, is part of its turn's key, and the deletion changed it. So the pass the line keeps did not match, and the line was read afresh.
  - A kept pass now matches while the line's words are the same. An edited line still runs afresh: its words differ.
  - The draws follow the line's words and the call count, not its place, so the swipe repeats the same outcome; before, it drew again (R51).
  - The review's own case starts from a correction that never took effect: the scene's last two messages did not name Will, and a correction reads the people they name. R51 builds the case with Will named.
- **Found while writing R51's second case:** a correction read afresh on a swipe (an edited "no, Will!") took itself for the line before it, since SillyTavern's chat still holds the reply a swipe rewrites. It corrected nothing, and Tom stayed struck. It now reads the line before it (R51).
- **"I look at Tom and Will, then I punch him."** Nothing asked, nothing drafted: the planner chose. With two or more named before "him" who fit, the player is now asked between them. With one, it is that one. Found the same way: "I look at Tom. I punch him.", with Will and Bob also in the scene, asked "Punch Bob or Will?", leaving out Tom, the one meant (R55).
- **Tag characters.** A card, a fact or a reply could carry hidden tag characters (U+E0000–U+E007F) into a prompt; only the player's lines were turned into notation. Every way out to a model now takes them out: the engine's own requests (`send.ts`), the narrator's prompt, and the tools' results (R54, ui R62). The review's two fixes, castBlock and the audit prompt, are both requests, so both are covered.
- **Quotation marks.** "Er sagte: ›Climb the wall!‹" routed nothing, and "›Climb the wall!‹ I shout." routed a climb.
  - Every reader now takes the same marks as quoting speech (`quotes.ts`): "…", “…”, „…“ and ‚…‘, »…« and ›…‹, «…» and ‹…› (German and Swiss rules: Bier 2006, typokurz).
  - The words in them are what is said: they route Communicate, give the message, and a slip inside them is left as said (route R57, frame R58, intent R59).
  - Found the same way: a slip after a closed "…" was taken as inside it ('"Hello," I punhc Tom.' was not respelt).
- **Cut-offs before a closing mark.** "›War-‹", "(wai-)", "‘Sto-’" and "«Sto-»" now read as cut-offs (ui R60). The speech whose loudness sets the voice's effort is now the words in any quotes: «STOP!» I shout is loud, not raised (ui R61).
- **An Act's action.** It now starts at its motion verb and leaves out sentences that make no move. "Today I walk 10 m to the gate." showed "Mara Today I walk…" on the note, and "I punch Tom. I walk 10 m to the door." showed "Move punch Tom. I walk…". The walk was the same either way (frame R56).
- **Registered judgements.**
  - The full-thickness burn threshold Ω ≥ 10⁴ is a published classification (Wang, Foley & Zhou 2024, eq. 10, after Pearce, Diller & Valvano 2017 and Orgill et al. 1998), applied to the one skin node's integral. It is now registered with a range of an order of magnitude, so a burn near it says it is fragile.
  - The drowning band 5.5–10 min (18.7 %) is registered too, with a range of 13.7–33.7 % (R53).
  - AGENTS.md now says the registry rule is for new judgements; the older ones in comments are listed in `docs/constants.md` as candidates.
- **Old replies.** Old replies kept a world for every swipe. Past the last 30 messages they now keep the swipe shown only, since only the last message can be swiped (R52).
- **Checked and left as they were:**
  - An edited line regenerated after a later turn is deleted runs its edited words (the table's 1): its words no longer match the kept pass.
  - [DECIDED] on a correction turn and after a narrator's tool call holds the redo and its outcomes (the table's 3).
  - The drowning band's derivation (the table's 9) holds under its stated reading. The review's 37.3 % subtracts the past-10 group from the past-5.5 group, but they come from different pools of cohorts: 2,313 people against 1,981, and fewer under 10 min (1,019) than under 5.5 (1,075).
  - The sound levels' arithmetic (the table's 10) matches: 85 dB at 1.8 m is 90.1 dB at 1 m, and 67.5 dB at 10 m is 87.5 dB.
  - The skin's conduction (370 W/m²K) and its properties (0.37, 1100, 3400) stay listed as candidates; no primary source for them was reachable here.
- Checked:
  - `npm test` passes: route 157, frame 193, intent 36, engine 187, plan 58, size 9 of 9, ui 48, sequences 300 with 0 failing, all with 0 misses. Every new check fails on entry 101's tree: engine 6, frame 2, route 1, intent 1, ui 3.
  - Random sequences: 0 failing in 1,000 of 40 steps on each of six seeds.
  - Negative controls: 393 of 393 caught. The full run caught 390; R13, Q9 and G84 had been caught only through the words the old action carried before its verb ("will just walk…"), and gained cases where their rules still act (a trailing asterisk; a climb or an auxiliary in a model's own action), after which they and every frame control (99 of 99) were caught again. Nine were retargeted to their rewritten lines (N61b, R13b, RT2, G59, I5, RY2, RY10, RY11, RY20).
