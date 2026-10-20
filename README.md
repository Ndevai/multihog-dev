# Rules Engine for SillyTavern

Code decides outcomes; the narrator writes them. Each turn:

1. **Question pass.** One model call reads the scene and names the outcomes in doubt (a climb that may fail, a sound that may be missed, a price, time passing). The engine decides each with its rule tools.
2. **Narration.** The narrator gets one system message: the story time, each tracked body, what each character knows, and the decided outcomes ([DECIDED]). Your prompt, card and preset stay as they are.
3. **Rule check.** One model call compares the reply with the decided outcomes and redoes the reply once when it contradicts one.

## Install

1. SillyTavern → Extensions → Install extension.
2. URL `https://github.com/Ndevai/multihog-dev`, branch `rules-standalone`.
3. AI Response Configuration → tick **Enable function calling** (used when the question pass is off or fails).
4. Extensions → **Rules Engine**: the three boxes are on by default.
5. Give the chat a date and place. Type `/rules-time 1850-03-14 18:40` (or `Day 1 08:00`), or let the scenario state them ("London, 14 March 1850, evening"). The weather, prices and daylight need both.

Tested with GLM-5.3 on NVIDIA's API (structured output on). A model without JSON-schema output reads the plan less reliably.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Rules engine | on | registers the tools and sends the engine's message each turn |
| Question pass | on | one model call before each reply |
| Rule check | on | one model call after each reply |
| Connection | same as the chat | a Connection Manager profile for the two extra calls (e.g. a faster model) |
| Reply length | the connection's own | max tokens for the two extra calls |

## Commands

| Command | What it does |
|---|---|
| `/rules-time [time]` | show or set the story time |
| `/rules-log` | this turn's decisions: each call, its arguments, its random draws and result |
| `/rules-replay` | replays every recorded change and says whether it rebuilds the current state |
| `/world-add <line>` | add a line to this card's world book; the model drafts the entry, you approve it |
| `/world-without <person>, <year>` | removes a person from history from that year; their inventions go to others, later, or never |
| `/world-event <event>; <people>; <year>` | removes the named people from that year |
| `/world-earlier <invention>, <year>` | brings an invention earlier, if a first inventor that far ahead is drawn |
| `/world-list` | shows the world book |

## Good to know

- Every number the engine uses has a published source or is marked [ASSUMED]. Sources and decisions: `docs/progress.md`, `docs/df-body-engine.md`; coverage: `docs/features.md`.
- Each turn costs two extra model calls (question pass and rule check), three when the rule check redoes a reply.
- A refused outcome ("State unchanged") is the engine asking for a missing number; the question pass asks again once.

License: GPL-3.0 (derived from the Multihog D&D Framework). Third-party data and code: `docs/third-party.md`.
