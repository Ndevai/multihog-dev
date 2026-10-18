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
- `/world-add <line>`: add to this card's world book ("orcs in London since the 900s"); the model drafts the entry, you edit and approve it. `/world-without Karl Benz, 1880` removes a person from history from that year: each of their inventions is made by another inventor, made later, or never made, drawn from the published rates of independent invention. `/world-event The plague reaches Cambridge; Isaac Newton; 1665` removes the named people from that year. `/world-earlier telephone, 1850` makes an invention come early, if a first inventor that far ahead of the field is drawn. A character cannot claim, buy or find a thing not yet invented at the story's date; things named in your message are linked to Wikidata items ("Read as: minigun → M134 Minigun (1960)"), and you pick when two fit equally. Items keep an owner apart from who holds them (lent, stolen). Speech in another language can be misunderstood where that language uses one word for two meanings (CLICS⁴); the misreading shows later, through what the listener does. A character without a voice whispers; words that differ only in voicing (big/pig) are misheard at the measured rates. Whispers carry about 2 m in a quiet room. A listener follows a related language at the measured share (a Portuguese listener follows 77 % of Spanish). The narrator sees what the characters in the scene know, not what absent characters know; a fact can be marked secret. Misheard words are shown as they sound (sètï / sèdï). In noise, words that differ in one consonant are misheard at the rates Miller & Nicely measured. Languages follow the story's year: "japanese" in 1200 is Late Middle Japanese, and modern Japanese in 1200 is refused unless the world book has a time traveller. A thing a country had not adopted yet (a telephone in a country before its first line, from the CHAT dataset) can be claimed only with a believable path. Characters forget facts at measured rates by their age when they learned them; studied knowledge fades to about half and then holds. Whether a character can read, count, speak a language, hold a faith or has lived to an age starts from the measured share of their country's people in that year (literacy, numeracy, where each language is spoken); heights before 1896 and labourers' wages outside Europe (1820–2008) come from Clio Infra. Prices cover about 160 places 1209–2008 (a day's wage in subsistence baskets from Moatsos & de Zwart; the hourly pay of a named trade, 1953–2008, from Occupational Wages around the World); a place's population, share in towns, murder rate and infant mortality come from Clio Infra, and a city's size from Modelski, Chandler and Reba et al. For a real place on a date from 1940 to last week, the weather is the weather that was recorded that day (ERA5). A character who acts against their personality (a calm man screaming in church) is checked against how often people at their trait level act that way and how fitting the act is in that setting; a chain of reasons that make it fit raises the chance. Sleep debt builds over short nights (14 nights of 6 h perform like one night without sleep), thirst shows at 2 % water loss, bleeding shows its pulse and breathing signs, walking pace follows slope, age, sex and the country's measured pace of life (31 countries: an Irish walker is 1.5 times as fast as a Brazilian) when the story does not set it, and Disease covers flu, colds, measles and the death tolls of historical plagues. `/world-list` shows the book. The panel has the same, with a remove button per entry.
- `/rules-stats`: how many replies the rule check read and flagged in this chat.
- `/rules-eval [n]`: scores the question pass on built-in scenes (tool precision and recall, deciding arguments).

Rules, sources and decisions: `docs/df-body-engine.md`. Rule text for a lorebook: `rules/rules-lorebook.json`.

License: GPL-3.0 (derived from the Multihog D&D Framework). Whether a character has married starts from the share of people of their sex and age who were single in their country's census (1891–1952); refusing an unfair split, punishing a cheater and obeying an order to harm follow measured rates, obedience lower in modern years than in Milgram's. Drinking untreated water can infect a character, by the source (sewage, a fouled river, a well, rainwater) and the amount drunk, unless it was boiled. Weather in past years runs warmer or colder than today by the recorded climate of that month in that country (Berkeley Earth, 1750–2020), and a new character in 15 European and Central Asian countries gets an eye and hair colour from measured shares. From 1851 to 1939 a real place gets that day's reconstructed weather (20th Century Reanalysis), when SillyTavern's CORS proxy is on.
