# The voice's look, measured and drawn in Chromium

Scripts for section 47 (`docs/progress.md` (114)). Each takes the repository root as its first argument and loads the tree's own `style.css`, `src/ui.js` and `src/rules/voice-code.js` in a page with SillyTavern's theme variables and message type (written from memory of its stylesheet).

| Script | What it does |
|---|---|
| `measure.mjs <root> [distinct or plain] [font] [width]` | sets the 13 lines of `lines.json` and reports, per line: whether it keeps the story's line height, words drawn over the next, blurred and hollow letters, the pitch stroke's colour; prints `MISS <label>` on a fault |
| `specimen.mjs <root> <out.png> [look] [font] [dark or light] [width]` | draws the same lines as a sheet |
| `toolbar.mjs <root> <out.png> [font]` | loads `src/index.js` with a stand-in SillyTavern and draws the toolbar and one chat line |
| `st-chat.mjs <root> <SillyTavern checkout> <out.png or -> [theme] [flat, bubble or document] [width] [page on or off] [measure or -] [box: off, voice, message or log] [taps on next] [page colours: light or dark] [picture: none or large] [typing: off or on]` | sections 48 to 50 (`docs/progress.md` (115) to (117)); the plate is printed as drawn (the name shown, the words at its right), with the unit's colour, a key word and the picture's source; with typing on it times the letters, a tap and AUTO, and with `RULES_PEOPLE` (the engine's people, JSON) the next said unit at its speaker's own rate; with the box on it goes to the first unit, presses → as often as asked and prints the place, the plate and the text after each press; draws a chat of 7 messages with SillyTavern's own stylesheets and message template, read from a checkout as files (none of its scripts run), the extension loaded through `src/index.js` with a stand-in context; with `measure` it reports, per message: every line at one height, words drawn over the next, a pause away from its word, a pitch stroke in the line above, letter shadows, each text's contrast on what lies behind it; prints `MISS <label>` on a fault |
| `palette-css.mjs <root>` | the feeling colours of `style.css`: sRGB, contrast on each shipped theme, pairwise CIELUV distances for normal colour vision, a deuteranope and a protanope |

`themes.mjs` holds the shipped themes as `tests/ui.test.mjs` lists them; `st-chat.mjs` reads them from the checkout (`default/content/themes`). Playwright with Chromium is needed (`require('playwright')`).
