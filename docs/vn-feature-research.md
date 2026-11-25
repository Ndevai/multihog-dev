# Research for the six engine features (not decided)

Gathered 2026-11-25 for the features listed in `docs/vn-interface-survey.md` ("Features the engines have and this extension lacks"), so a later session can decide with sources. Nothing here is built. Evidence levels: *published* (source read by the research agent), *inferred*. Each section is a research agent's report, kept as returned.

## 1. Text speed, AUTO delay, rollback (Ren'Py defaults)
Read in the Ren'Py source on GitHub (commit 24be485, 2026-11-23; renpy.org/doc is built from its `sphinx/source`). The guideline pages were seen only as search snippets.

**Text speed.**
- `preferences.text_cps` defaults to 0, which means instant text, in both the engine and the new-project template (`renpy/preferences.py` L112, `gui/game/options.rpy` L126).
- The slider runs 0–200 characters a second, and its right end means instant (`renpy/common/00preferences.rpy` L283/356; the right-end reading is inferred from the code).
- TyranoScript defaults to 30 ms a character, about 33 characters a second (`Config.tjs`).

**AUTO.**
- `preferences.afm_time` is 0 (AUTO off) in the engine; the template and the docs use 15, valid range 0–30. AUTO is switched on separately (`afm_enable`).
- Ren'Py waits (characters + 26) / 250 × `afm_time` seconds after the text has typed out (`renpy/display/behavior.py` L748–762; `config.afm_bonus` = 25, `config.py` L232–235).
- At 15 that is 60 ms a character plus 1.56 s, about 1,000 characters or 170–200 words a minute (inferred).
- TyranoScript waits 1,300 ms plus 60 ms a character (`kag.tag.js` L2634).
- This extension waits 260 words a minute (Brysbaert 2019), about 42 ms a character, with no base delay. Both engines' defaults are slower.

**Labels.** "Text Speed", "Auto-Forward Time", and an "Auto" button in the quick menu (`gui/game/screens.rpy` L770–776, L252).

**Rollback.**
- Ren'Py saves at each statement that waits for the player and loads that save on rollback (`save_load_rollback.rst`).
- Keys: PageUp, mouse wheel up or Android Back go back; PageDown or wheel down go forward. Tapping a screen side to roll back is off by default (`00keymap.rpy` L39/67).
- `config.hard_rollback_limit` = 100 steps a player can go back; `config.rollback_length` = 128.
- The default GUI keeps 250 history lines; the engine default is None, which keeps none.
- **Jumping back from the history:** each entry has a `rollback_identifier`, and the action `RollbackToIdentifier` rewinds to that line while it is still in the rollback log (`history.rst`, `00action_other.rpy` L276). The default history screen does not use it (inferred).

**Guidance (snippets).**
- Game Accessibility Guidelines: "Allow players to progress through text prompts at their own pace".
- Xbox Accessibility Guidelines 116: duration limits can be turned off, and dialogue advances on input. XAG 117: anything that scrolls or moves can be paused. XAG 101: "the best approach is player choice".
- Halo Infinite: "Text Scroll Speed" 15–180, default 45.
- No study comparing letter-by-letter text with instant text was found.

## 2. Hiding the box, box opacity, hidden gestures
Engine code read on GitHub. renpy.org, learn.microsoft.com, gameaccessibilityguidelines.com and the BBC guidelines were seen only as search snippets.

**Hiding the box: no engine maps it to a touch gesture by default.**
- Ren'Py: `hide_windows = ['mouseup_2', 'noshift_K_h']` (middle click, H), and `pad_y_press` on a gamepad. Its default `config.gestures` map only to `progress_screen` and `accessibility`, never to hiding. The touch quick menu has Back, Skip, Auto and Menu, so a phone player cannot hide the box by default (`00keymap.rpy`, `config.py`, `gui/game/screens.rpy`, `gesture.rst`).
- TyranoScript: Space and right click hide the message. Its touch defaults are swipe up for the backlog, down for load, left for auto, right for the menu, hold to skip and a double tap on the right edge for auto; none hides the box (`data/system/KeyConfig.js`).
- Monogatari: a visible Hide button (eye icon, action `distraction-free`) and the H key. Hiding also makes the quick menu transparent and blocks advancing until the box is shown again (`src/monogatari.ts`, `src/engine/ui.ts`).
- WebGAL: a visible Hide button on the bottom bar, and right click. While the box is hidden, a tap on the stage, Space or Enter brings it back without advancing (`hooks/useHotkey.tsx`, `Stage/Stage.tsx`, `BottomControlPanel.tsx`).
- So a button that hides the box, where the next tap only brings it back, is the common form.

**Box opacity.**
- WCAG technique G18 (read): keep 4.5:1. Where the background varies, shade the area behind the letters, or outline them by 1 px or more.
- WCAG failure F83 (read): for text over a picture, measure against the parts of the image most like the text.
- XAG 102 (snippet): "Allow players to put a solid background behind on-screen text, and adjust its opacity"; measure against the background's lowest-contrast part.
- Game Accessibility Guidelines (snippet): a solid or semi-opaque backing, "ideally a sliding scale between on and off".
- BBC: "a black background of minimum 75 % opacity" is quoted by secondary sources only; it was not found in the BBC text.
- None of these sources fixes a single opacity. They ask for 4.5:1 against the worst part of the image, plus a player setting (the agent's reading). This box's fixed 74 % meets the first. A 74–100 % slider would add the second without breaking it.

**Hidden gestures.**
- WCAG 2.5.1 Pointer Gestures (read): anything done with a path gesture (a swipe) must also work with a single pointer and no path.
- Apple HIG (snippet): "Use shortcut gestures to supplement standard gestures, not replace them."
- So a swipe-down hide would also need a button.

## 3. Text size, line length, dyslexia fonts
Sources read only as abstracts or search snippets: the fetch tool could not reach pmc.ncbi.nlm.nih.gov or renpy.org.

**Dyslexia fonts: no gain found.**
- Wery & Diliberto 2017, *Annals of Dyslexia* 67(2):114–127, doi:10.1007/s11881-016-0127-1: OpenDyslexic gave no gain in reading rate or accuracy over Arial or Times New Roman for elementary pupils with dyslexia (abstract).
- Kuster et al. 2018, *Annals of Dyslexia* 68(1), doi:10.1007/s11881-017-0154-6: 170 children with dyslexia read no faster or more accurately in Dyslexie than in Arial. A second sample (102 with dyslexia, 45 without) gave the same result. The children preferred Arial and Times (abstract).
- Rello & Baeza-Yates 2013, ASSETS '13, doi:10.1145/2513383.2513447: in an eye-tracking study of 48 readers with dyslexia, sans-serif, monospaced and upright fonts did better than serif, proportional and italic ones. OpenDyslexic gave no improvement (abstract; the OpenDyslexic result is from a secondary summary).
- Azzarello et al. 2026, *Annals of Dyslexia*, doi:10.1007/s11881-026-00389-8: a meta-analysis of 15 studies (91 effect sizes, N = 688) found g = −0.04 (95 % CI −0.15 to 0.07), no effect (abstract).

**Line length.**
- Dyson & Kipping 1998, *Visible Language* 32:150–181: 100-character lines were read faster than 25-character lines, with similar comprehension; readers rated 55 easiest (abstract).
- Dyson & Haselgrove 2001, *Int J Hum-Comput Stud* 54: about 55 characters a line "appears to support effective reading at normal and fast speeds" (abstract; the agent recalled the DOI 10.1006/ijhc.2001.0458 from memory and did not confirm it).
- Nanavati & Bias 2005, *Visible Language* 39(2): a review, not an experiment; 50–70 characters a line easiest (secondary).
- Atilgan, Xiong & Legge 2020, *PNAS*, doi:10.1073/pnas.2007514117: on laptop, tablet and phone, normally sighted readers need about 13 characters a line, and low-vision readers about 8, to reach 80 % of their top reading speed, across fonts and devices (abstract and press release). This box's 25 characters a line clears that floor.

**Letter spacing.**
- Zorzi et al. 2012, *PNAS* 109(28):11455–11459, doi:10.1073/pnas.1205566109: 74 children with dyslexia aged 8–14. Letter spacing 2.5 pt wider in 14 pt type (about 18 % of the font size) roughly doubled text-reading accuracy without training (abstract).
- Hakvoort et al. 2017 reproduced the drop in errors but not a gain in speed (secondary).

**Ren'Py's accessibility menu (Shift+A).** It has a text-size scaling slider, a line-spacing slider (1.0 by default), font overrides (DejaVu Sans, OpenDyslexic), high-contrast text and self-voicing (the V key). Sources: `00accessibility.rpy` and the screen-actions docs, via search snippets. The slider ranges are not confirmed.

**Applied here (*derived*):**
- A size scale of 1.3 on 27.5 px gives about 19 characters a line at 412 px, still above Atilgan's 13-character floor.
- A wider-spacing option (Zorzi) has evidence behind it; a dyslexia font does not.

## 4. Voice replay in the log, jumping back to a line
Engine and SillyTavern code read on GitHub. The accessibility items were seen only as search summaries and are not confirmed.

**Engines.**
- Ren'Py: each history entry stores its line's `voice` and a `rollback_identifier`, which `RollbackToIdentifier` rewinds to (`sphinx/source/history.rst`). `VoiceReplay` replays only the most recent voice (`00voice.rpy`). The default history screen shows the name and text only, with no voice or jump button (`gui/game/screens.rpy`).
- Kirikiri/KAG3: the `[hact exp=…]…[endhact]` tags make history text clickable. Its docs suggest using them to replay, on click in the history, the voice played with that message. The author builds it; it is not a default (kirikirikag.sourceforge.net, Tags.html).
- WebGAL: each backlog entry has a Return button. Jumping back drops the later backlog entries and restores the saved scene and stage. Entries with a voice also get a speaker button, which stops other audio and replays the stored file at main × voice volume (`UI/Backlog/Backlog.tsx`, `Core/controller/storage/jumpFromBacklog.ts`).
- TyranoScript: the backlog holds plain name/text HTML, with no voice or jump controls (`kag.menu.js`).

**SillyTavern.**
- The TTS extension puts a megaphone icon at the top right of each message to play it on demand (SillyTavern-Docs `extensions/TTS.md`). The button calls `onNarrateOneMessage`, which queues the message for TTS again. No audio cache was found, so a replay likely synthesizes again (inferred from `public/scripts/extensions/tts/index.js`). `/speak` (aliases `/narrate`, `/tts`) speaks any text.
- Branches: `createBranch` copies the chat up to a message into a new chat file whose parent is `main_chat`. `/branch-create` opens it; `/checkpoint-create` makes a named copy without switching, opened later with `/checkpoint-go` (`public/scripts/bookmarks.js`).
- `/chat-jump N` only scrolls to message N and highlights it; nothing is rewound (`slash-commands.js`). `/go` opens a character's chat, and `/cut` deletes messages.

**Where this leaves the two features (*inferred*).**
- A Log line's ▶ could replay the voice this extension already made for that line, if the audio is kept. SillyTavern's own TTS button synthesizes again.
- "Return to a line" has two forms here:
  - a view-only jump, like `/chat-jump` plus moving the box to that turn;
  - WebGAL's real rewind, which in SillyTavern means a branch (`createBranch`) or deleting the later messages.

**Guidance (summaries only).**
- Game Accessibility Guidelines, a cognitive item: "Allow all narration and instructions to be replayed" (title and level not confirmed).
- Xbox Accessibility Guidelines: no rule requires a log or replay. XAG 116 keeps dialogue on screen until the player advances; XAG 105 suggests pausing audio.

## Summary for a decision (*derived* from sections 1–4)

| Feature | What the sources support | Fits the sourced values? | Smallest form |
|---|---|---|---|
| Hide the box | A visible button is the common form (Monogatari, WebGAL); a swipe needs a button beside it (WCAG 2.5.1) | Yes, touches no value | A Hide button in the box bar; the next tap only brings the box back |
| Box opacity | 4.5:1 against the worst part of the picture, plus a player setting (WCAG G18, F83; XAG 102 snippet) | Yes, if floored at 74 % | A 74–100 % slider in the settings |
| Speed settings | Player choice (XAG 101, 116 snippets); engines' defaults are slower than this box's (Ren'Py 60 ms a letter + 1.56 s) | Yes, as multipliers over the sourced rates | One "reading pace" multiplier, 0.5–2 ×, default 1 |
| Return to a line from Log | Ren'Py `RollbackToIdentifier`, WebGAL ↺ (rewinds) | Yes | View-only: the box jumps to that turn; a rewind would be a SillyTavern branch |
| Voice replay | WebGAL's backlog speaker button; Kirikiri's `[hact]` hook | Yes | A ▶ beside a Log line the voice spoke, replaying kept audio |
| Text size, font | Dyslexia fonts: no effect (g = −0.04); wider spacing helps (Zorzi 2012); 13 characters a line keeps 80 % speed (Atilgan 2020) | Yes, with 27.5 px as default | A letter-spacing switch before any font choice |

## Hosts blocked in this session
renpy.org, learn.microsoft.com, devdocs.xbox.com, gameaccessibilityguidelines.com, docs.sillytavern.app, tyrano.jp, pmc.ncbi.nlm.nih.gov, bbc.github.io, github.com (git and pages; the research agents read GitHub through their own fetch tool). Allow them in the cloud environment to read the full pages behind the snippets above.

## 5. Where each feature would go in this code
From a read-only search of this repository. Line numbers are for the v33 tree.

All six can hook into code that already exists. Two cost more than a few lines: the opacity slider needs a CSS variable, because 74 % is written into the gradient, and a size option has to re-cut units that are already cut.

1. **Hide the box.**
   - Add the button in `buildBox` (index.ts 2215–2240) with its `button()` helper; keep a flag beside `boxLog` (572) and set a body class in `showBox` (1270).
   - Add the icon rule beside style.css 532–539. The night bar already holds 7 buttons at 360 px (comment 410–412), so an 8th has to fit.
   - Bring the box back from the chat click handler (2383–2389), the key handler (2390–2394) and the swipe handler (2319); pause AUTO in `scheduleAuto` (867–871).
   - Pattern to copy: a tap that only closes a card (`hideCard`, 2083; `swallowUntil`, 2336).
2. **Box opacity 74–100 %.**
   - The panel's gradient is `linear-gradient(rgba(18,20,34,0.74), rgba(8,9,16,0.82))` (style.css 461); the comment at 452–453 gives the 4.5:1 reason.
   - `--rules-night-ground` (445) serves only the scene badge (507) and the Log bar (543).
   - Replace 0.74 with a new variable, decide what the 0.82 bottom stop does, set the variable in `applyLook` (2559–2575), and copy the music-volume range input (settings.html 56–57; index.ts 2966–2967).
3. **Reading-pace multiplier.**
   - Pacing lives in `src/rules/box.ts`: `revealTimes` (229) times the letters (unsaid text at `boxReadWpm` 260 wpm, line 21; said text at `voiceSyllablesPerS`, voice.ts 20); `pauseMs` (225) gives the pauses (`boxSentencePauseMs` 500); `autoWait` (245) gives AUTO's delay.
   - These are called from `typeUnit` (index.ts 891–892) and `scheduleAuto` (870).
   - Voiced lines take their timing from the audio: `scaleTimes` stretches to the natural voice's length, and `speechTimes` (720) follows eSpeak's word events. A multiplier can change only unvoiced text and AUTO without the letters falling out of step with the voice.
4. **Return to a line from the Log.**
   - The Log is SillyTavern's own chat with the box CSS off (`body.rules-box-log`, toggled at 2238).
   - The chat click handler returns early while `boxLog` is set (2386). The new branch goes there: find the `.mes` and its `.rules-unit` (`unitsIn`, 577), set `boxAt`, set `boxLog = false` and `stepDir = -1`, then call `showBox()`.
   - The same jump already exists for the Book's turns (1665–1669) and the timeline's `jumpTo` (1816–1828).
5. **Voice replay in the Log.**
   - Natural voice keeps each line's audio as a `Float32Array` in the `voiceDone` map (729), keyed in `naturalJob` (824–844) by body, text and feeling. It is held in memory only, so a reload loses it.
   - Robotic voice (`speakUnit`, 698–721) and blips (665) are made again at each play.
   - A Log ▶ would call `naturalJob(unit)`, then `playNatural(audio)` (847). There is one playback slot (`speechSource`), stopped by `stopSpeech` (696).
6. **Text size or letter spacing.**
   - The 27.5 px is computed in box.ts 40–42 (`boxFontPx`: 580 mm × tan 0.2° ÷ 0.160 mm/px ÷ 0.46). `applyLook` sets `--rules-box-font` and `--rules-box-lines` (index.ts 2568–2571), and style.css 337 uses the font variable; letter spacing can go there.
   - `fitUnits` (618–648) skips units marked `data-fit`, so a size change has to re-cut them.
   - Settings are stored as `Settings` (76), `DEFAULTS` (78) and `settings()` (102). Checkboxes go through `bind()` (2931–2935), whose list of allowed keys needs the new key; dropdowns go through `choice()` (2953).
   - The Story clock box (`rules_engine_scene_clock`) is kept in localStorage `rules_scene_hidden` through `setSceneHidden` (1903), not in `settings()`.

Outside the six: the settings comment at index.ts 70 repeats `keyboardLayout: 'auto'` and names Piper where the code uses Pocket TTS (722–727).

## 6. SillyTavern's own visual-novel mode, sprites and voice reading
From a read-only search of SillyTavern 1.19.1's source (`/home/user/st/SillyTavern`). Paths are under `public/` unless marked.

**Visual Novel Mode (`waifuMode`).**
- Setting `power_user.waifuMode`, default false (scripts/power-user.js:172). It is toggled by the `#waifuMode` checkbox (index.html:5099) or `/vn` (power-user.js:4116); `switchWaifuMode()` adds the class `waifuMode` to `<body>` (power-user.js:977).
- Desktop: `#sheld` becomes 40dvh tall at the bottom (css/toggle-dependent.css:394–399), and the sprite (`.expression-holder`) is centred at 90vh (410–421).
- Phones (1000 px wide or less): the chat sits at `top:60dvh; height:40dvh` (css/mobile-styles.css:447–453), with the sprite at full height behind it (z-index 1, 463–475). Without `waifuMode`, the sprite is hidden on phones (455).
- In this mode the chat scrolls to the top of the last message (script.js:2781) and auto-scroll is locked (script.js:11228).
- Group sprites need a desktop, `waifuMode` and a group chat (scripts/extensions/expressions/index.js:139); a phone shows one `#expression-holder`.

**Character Expressions.**
- Sprite files come from `characters/<name>/`; the label is the file name up to the first `-` or `.` (src/endpoints/sprites.js:126–142), and subfolders work as overrides (sprites.js:28).
- 28 default labels (expressions/index.js:46), fallback `joy` (44). Classifiers: local, extras, llm, webllm, none (83, 1111–1188).
- A worker polls every 2 s (42, 2342) and classifies again only when the last message changes; while streaming it throttles to 10 s (569–596).
- Sprites change with a 200 ms crossfade (1603–1650), and one is picked at random when several files share a label (1563–1592).

**TTS.**
- The play button is `.mes_narrate` (index.html:7417; handler tts/index.js:1567); a press resets playback and queues the message (158–171).
- No cache: each play calls `ttsProvider.generateTts` again (522), and the blob becomes a data URL that is not kept (345).
- It emits `TTS_JOB_STARTED`, `TTS_AUDIO_READY` (with the blob) and `TTS_JOB_COMPLETE` (509–533; scripts/events.js:105–107).
- It listens to `MESSAGE_SWIPED`, `CHAT_CHANGED`, `MESSAGE_DELETED`, `GENERATION_STARTED`/`ENDED`, and the rendered-message events (1574–1581).
- Text rules: "Dialogues only" deletes `*…*`; "Quoted only" keeps only the quotes (685–703); multi-voice splits action, dialogue and other (543).

**Events and context.**
- events.js: `MESSAGE_SWIPED` 7, `MESSAGE_RECEIVED` 9, `MESSAGE_EDITED` 10, `MESSAGE_DELETED` 11, `MESSAGE_UPDATED` 12, `CHAT_CHANGED` 19, `GENERATION_STARTED`/`ENDED` 23/25, `USER_MESSAGE_RENDERED` 48, `CHARACTER_MESSAGE_RENDERED` 49, `STREAM_TOKEN_RECEIVED` 74.
- `getContext()` (scripts/st-context.js:115) gives `chat`, `characterId`, `groupId`, `chatId`, `chatMetadata`, `eventSource`, `eventTypes`, `generate`, `saveChat`, `executeSlashCommandsWithOptions`, `extensionSettings`, `isMobile`, `powerUserSettings`, `scrollChatToBottom` and `swipe.*`. The branch functions are not in it.

**Jumping and branching.**
- `/chat-jump` (aliases `chat-scrollto`, `floor-teleport`; slash-commands.js:3449): loads older messages if needed, scrolls to the message and flashes it.
- `createBranch(mesId, {swipeId})` (bookmarks.js:187) saves `<chat> - Branch #N` up to that message, records it in `chat[mesId].extra.branches`, and does not open it. `branchChat` (452) creates the branch and opens it (used by `/branch-create` and the `.mes_create_branch` button).

**Hiding the interface.**
- Only `/panels` (`/togglepanels`; slash-commands.js:501), which hides the top bar and settings holder (script.js:11666–11685).
- Nothing in SillyTavern shows only the background and the sprite, so a Hide button here would add something SillyTavern lacks.
- **Measured with this box (412 × 915, the seeded NVL beat; `history/review-tests/browser/vn-engines/st-vn-mode.mjs`, picture `st-vn-mode-off-on.jpg`).**
  - Visual Novel Mode off: `#sheld` runs 35–914 px and the box's text 141–740 px, 599 px tall. Seraphina's sprite sits at the bottom left (0–103 px wide) under the input bar.
  - Mode on: Seraphina's sprite fills 92–915 px across the full width, `#sheld` starts at 549 px, and the box's text shrinks to 656–741 px, 85 px tall: two lines of the NVL passage.
  - So the box works under SillyTavern's mode, but it loses 86 % of its text height. Making the box and that mode fit together (the box's room from 40dvh, or the sprite drawn in the box's empty band) is a separate decision, not listed among the six.

## 7. Touch limits in Chrome on Android
(pending)

## 8. Other AI-roleplay front ends shown as a visual novel
From a research agent. R = README or code read; S = search text only; I = inferred.

No project found has all of this extension's parts together, though each part exists somewhere. The closest is Visual Novel+.

**SillyTavern extensions, themes and forks**
- Visual Novel+ (github.com/ExtremeGamerYT21/vn-plus), R: a nameplate colour per character; click, Space or Enter first finishes the typewriter, then advances. Fish Audio voices reveal text word by word from timestamps. Breathing and blinking busts; `#BACKGROUND`/`#FADE` commands. A Transcript view, no backlog.
- Prome VN (github.com/Bronya-Rand/Prome-VN-Extension), R: darkens characters who are not speaking, letterbox bars, sprite shake while text streams. "Traditional VN Mode" shows one reply at a time, with history in the wand menu.
- llm-tools (github.com/virgilianshailer/llm-tools), R: shows the last message in paragraph chunks with a Continue button; unread paragraphs are cut from the context before sending.
- Immersive Mode (github.com/mershant/SillyTavern-ImmersiveMode), R: one sentence at a time in the middle of the screen, swipe on phones, a draggable auto-scroll speed.
- Meziverse (github.com/Mezi99/SillyTavern-Meziverse), R: the newest message in a pane plus a log window you can resize; the background changes with the place; a bar with date, time, place and weather.
- Dooms Enhancement Suite (github.com/DangerDaza/Dooms-Enhancement-Suite), R: nameplates in each character's dialogue colour, a portrait shelf synced to expressions, and a Scene Tracker (time, date, place, weather) kept outside the message so TTS does not read it.
- Mundi (github.com/tjalis/Mundi), R: Visual novel, Classic and Cards layouts; phone HUDs upright and sideways; time kept by the engine.
- Kotatsu, a SillyTavern fork (github.com/lumenastrum/kotatsu-public), R: on phones, Sprites mode puts the reply in a box tapped through a page at a time; History shows the transcript.
- Moonlit Echoes theme (github.com/RivelleDays/SillyTavern-MoonlitEchoesTheme), I: chat styles, plus a "visual_novel_mode" preview that the README does not explain.

**Other front ends**
- RisuAI (`src/lib/ChatScreens/ChatScreen.svelte`), R: in `waifuMobile` the character image fills the screen and the chat takes the bottom 33 %; on desktop the image sits beside a blurred chat panel; TTS.
- Talemate (github.com/vegu-ai/talemate), R: portraits, backgrounds, a voice per character, time passing; Replay steps through passages. No VN box.
- KoboldAI Lite (koboldcpp wiki), R: an "Aesthetic" UI with portraits; Messenger and Corpo styles; TTS.
- Isekai Zero, S: a VN mode "similar to Instagram Stories", with backgrounds generated at a scene change.
- Character.AI Scenes, AI Dungeon's "See" images, Voxta, Backyard AI, S: no VN box found.

**AI-made visual novels**
- AI-GAL (github.com/tamikip/AI-GAL), R: an LLM writes a branching story; Stable Diffusion draws sprites and backgrounds; GPT-SoVITS voices the lines; music follows emotion tags; output in Ren'Py.
- VinA (github.com/vina-ai/vina), R: backgrounds per scene and faces that change with the dialogue, output in Ren'Py.

**What only this extension does, among those found (*inferred*):** letters at the speaker's syllable rate, AUTO at a published reading rate, hold-a-word to explain the engine's decision, the first-meeting card, and "Arriving.." cards from the engine's own clock and place.

**Ideas others have that this one lacks (not decided):**
- Dimming characters who are not speaking (Prome VN).
- Cutting unread text from the context (llm-tools).
- Weather in the scene bar (Meziverse, Dooms).
- A bust that breathes and blinks (Visual Novel+).
