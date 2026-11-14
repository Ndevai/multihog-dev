# The music, checked in Chromium

Script for section 51 (`docs/progress.md` (118)).

| Script | What it does |
|---|---|
| `flow.mjs <root>` | writes four synthetic songs (WAV: a chord and a burst of noise on each beat), adds them through the settings' file input, uploads them to a stand-in of SillyTavern's `/api/files/upload`, waits for the browser to measure them, prints each song's measures and the areas, then the song chosen as the scene's feelings change (none, the player's line marked sad, Tom's appraised joy, Tom's set), the audio elements' state after the crossfade, and a removal |

Playwright with Chromium is needed (`require('playwright')`); Chromium runs with `--autoplay-policy=no-user-gesture-required`.
