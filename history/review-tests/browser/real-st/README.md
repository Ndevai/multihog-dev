# Before-and-after sheets from real SillyTavern

Screenshots of the extension running in SillyTavern itself, in Chromium at phone size, an earlier checkout beside the current
one. The phone's keyboard is drawn while the message box has the focus, and the page then takes the height left above it, as
Android Chrome gives SillyTavern's page (its viewport meta: `interactive-widget=resizes-content`). Keyboard heights are
[ASSUMED]; each frame's caption names the page height.

1. SillyTavern, started once so `data/default-user` exists (AI Horde and other outside hosts may fail; the page still loads):

   ```bash
   git clone --depth 1 -b release https://github.com/SillyTavern/SillyTavern.git && cd SillyTavern && npm install --omit=dev && node server.js --port 8000
   ```

2. The earlier checkout of this repository: `git worktree add --detach ../ext-before <commit>`.
3. The sheets (`seed.mjs` resets the chat and settings before each page load):

   ```bash
   export ST_DIR=…/SillyTavern EXT_BEFORE=…/ext-before EXT_AFTER=…/this-repository
   node shoot.mjs before out/before && node shoot.mjs after out/after
   node compose.mjs out A "Keyboard open on small phones: the name tag" out/A.png
   node compose.mjs out B "Typing, then tapping the box's controls" out/B.png
   node compose.mjs out C "No chat open, and ▲ over the plate" out/C.png
   node tour.mjs before tour/before && node tour.mjs after tour/after
   node compose.mjs tour D "The box and the scene screens" tour/D.png   # E: the Story sheet and a card; F: the log and the draft
   ```

Sheet A: a short and an NVL beat with the keyboard open on 360 px phones (pages of 380, 340 and 480 px), and where a tap on
SPEAKING's right end goes. Sheet B: typing on a 412 × 915 phone, then a tap on ▲, AUTO, ▶ and Story, and whether the
keyboard stays. Sheet C: SillyTavern's welcome screen, and ▲ against the plate at 2.5×. Sheets D–F (`tour.mjs`): the clock chip, the
"Arriving.." and "Passing.." screens, Memory, Time and its steps, Book with a chapter's threads, a person's card, the log, the draft sheet. G: the timeline's drag held and let go, a press while the finger is down, the
stage's grain. H: ghosting, the settings, a slash command that fails, the log in the dark page colours, the page look (also
with the keyboard open), a desktop window. `TOUR_ONLY=G,H` runs only those groups. `meta.json` in each folder holds
the measured values (focus, the tag's top against the chat's, the input bar's bottom, the pill's tap).
