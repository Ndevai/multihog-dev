# Rules Engine for SillyTavern

Code decides outcomes; the narrator writes them. Each turn:

1. **Question pass.** One model call reads the scene and names the outcomes in doubt (a climb that may fail, a sound that may be missed, time that passes). The engine decides each with its rule tools.
2. **Narration.** The narrator gets one system message: the brief, the story time, each tracked body ([BODY]), what each character knows ([KNOWS]) and the decided outcomes ([DECIDED]). Your own prompt, card and preset stay as they are.
3. **Rule check.** One model call compares the reply with the engine's results and redoes the reply once when it bends one.

Without the question pass the narrator gets the 29 rule tools and calls them itself.

## Install

1. SillyTavern → Extensions → Install extension.
2. URL `https://github.com/Ndevai/multihog-dev`, branch `rules-standalone`.
3. In AI Response Configuration, tick **Enable function calling** (used when the question pass is off or fails).
4. Extensions → **Rules Engine**: the three boxes are on by default.
5. Set the story time once per chat: type `/rules-time 1850-03-14 18:40` (or `Day 1 08:00`), or use the field in the panel. PassTime moves it on.

## Settings

| Setting | Default | What it does |
|---|---|---|
| Rules engine | on | registers the tools and sends the engine's message each turn |
| Question pass | on | one model call before each reply |
| Rule check | on | one model call after each reply |
| Connection | same as the chat | a Connection Manager profile for the two extra calls (e.g. a faster model) |
| Reply length | the connection's own | max tokens for the two extra calls |

## Commands

- `/rules-time [time]`: show or set the story time.
- `/world-add <line>`: add to this card's world book ("orcs in London since the 900s"); the model drafts the entry, you edit and approve it. `/world-without Karl Benz, 1880` removes a person from history from that year: each of their inventions is made by another inventor, made later, or never made, drawn from the published rates of independent invention. `/world-event The plague reaches Cambridge; Isaac Newton; 1665` removes the named people from that year. `/world-earlier telephone, 1850` makes an invention come early, if a first inventor that far ahead of the field is drawn. A character cannot claim, buy or find a thing not yet invented at the story's date; things named in your message are linked to Wikidata items ("Read as: minigun → M134 Minigun (1960)"), and you pick when two fit equally. Items keep an owner apart from who holds them (lent, stolen). Speech in another language can be misunderstood where that language uses one word for two meanings (CLICS⁴); the misreading shows later, through what the listener does. A character without a voice whispers; words that differ only in voicing (big/pig) are misheard at the measured rates. Whispers carry about 2 m in a quiet room. A listener follows a related language at the measured share (a Portuguese listener follows 77 % of Spanish). The narrator sees what the characters in the scene know, not what absent characters know; a fact can be marked secret. Misheard words are shown as they sound (sètï / sèdï). In noise, words that differ in one consonant are misheard at the rates Miller & Nicely measured. Languages follow the story's year: "japanese" in 1200 is Late Middle Japanese, and modern Japanese in 1200 is refused unless the world book has a time traveller. A thing a country had not adopted yet (a telephone in a country before its first line, from the CHAT dataset) can be claimed only with a believable path. Characters forget facts at measured rates by their age when they learned them; studied knowledge fades to about half and then holds. Whether a character can read, count or speak a language starts from the measured share of their country's people in that year (literacy, numeracy, where each language is spoken); heights before 1896 and labourers' wages outside Europe (1820–2008) come from Clio Infra. `/world-list` shows the book. The panel has the same, with a remove button per entry.
- `/rules-stats`: how many replies the rule check read and flagged in this chat.
- `/rules-eval [n]`: scores the question pass on built-in scenes (tool precision and recall, deciding arguments).

Rules, sources and decisions: `docs/df-body-engine.md`. Rule text for a lorebook: `rules/rules-lorebook.json`.

License: GPL-3.0 (derived from the Multihog D&D Framework).
