# Handoff — complete project context

## Files (repo Ndevai/multihog-dev, branch `losica-files`, folder `losica/`)
- Read first: losica/handoff.md, then constraints-code.md (code, rules, planet) or constraints-language.md (language).
- rules/: Faerun_weave-rules.json (lorebook to import), Losica-rules-annotated-reference.json (sources and reasons)
- source/: Faerun__4_.json (original lorebook), old-affinity-ipa-chat.txt, weave-rules-draft1.md
- planet/: losica-humans.md, physics.json, orogen-map.zip
- language/: Komuheft.md, Tegofarela.md (current, no examples), derive.py, derivations.txt
- Edits to these files are committed back to this branch.

## 1. Goal
Hard-rule world system for LLM roleplay. Rules a model cannot bend: quantities, tables, IF → THEN; numbers computed in code where possible. World = planet Losica, its humans and their languages. Everything provisional; replace on a better or superset logic. Files made by earlier LLMs are the assistant's to fix.

## 2. Setup the system runs in
- SillyTavern 1.16, Chat Completion "Custom (OpenAI-compatible)", base URL https://integrate.api.nvidia.com/v1, model z-ai/glm-5.3 (unlimited calls; quality over cost).
- Preset "GLM-Plain": context 16384, max response 800, temperature 0.90, top P 0.95, frequency penalty 0.
- Prompts: Main (third person past, 2–4 paragraphs of 3–6 sentences, plain even register, decisions shown with the observation behind them, 3 style-only examples); Post-History (repeat of length/person/register); Impersonation (match user's earlier messages); Auxiliary empty.
- Summarize extension: Raw, blocking, 300 words, update every 20 messages, after Main Prompt; prompt keeps events with causes, each character's location/goals/relationships/mood, open conflicts.
- Extensions: Prose Polisher (threshold 5, cycle 10, forget 50, phrase length 10, merge 2), Nemo Orchestrator (defaults), Guided Generations. Vector Storage off.
- Game framework: Multihog D&D Framework (SillyTavern extension). State Memo tags [CHARACTER] [PARTY] [COMBAT] [INVENTORY] [TIME]; RollTheDice tool (who/for/formula/dc/compare); RNG queue of 12; Lorebook Agent; Persistent Maps; World Progression; Game Cartridges (saved bundles of prompts, game systems, trackers, sheets).

## 3. Code (repo Ndevai/multihog-dev, private)
- PR #1 `strict-dice-commit`: RNG mode "strict" = dice tool everywhere, queue never injected; src/state/rng-mode.js replaces 4 duplicated mode blocks.
- PR #2 `rules-engine` (on #1): src/rules/losica-engine.js (pure rules) + losica-tools.js; tools LosicaWound, LosicaTreat, LosicaTime, LosicaCast, LosicaFall, LosicaStatus; state in chat metadata, snapshot per user turn, restored on swipe/regenerate; checkbox `rpg_losica_rules` under RNG settings; off by default. 1,243 tests pass. Untested inside SillyTavern.
- Branch `losica-climate`: ExoPlaSim run on GitHub Actions (original star, Orogen map, restart from model year 4, 30 years, land-temperature step limiter patch). Results land in climate/results/summary.txt and trend.txt.
- Known Multihog holes: DC never enforced in code; re-rolls possible; narration never checked against the roll; loot and random-event prompts say "pop a d20" in tool mode; HP hardcoded ~75× in renderer.js and constants.js; clock assumes Earth days.
- Code style: comment density at or below the codebase (6–12 %); prompts and tool descriptions as positive statements.

## 4. Next, in order
1. Dice fixes: code returns the DC verdict; block re-rolls; replace "pop a d20" wording.
2. Losica cartridge: trackers for body parts/wounds, network (C, N, R, P), needs, replacing HP/AC/XP/ability scores/spell slots; prompt states when to call each Losica tool.
3. Display (wound list per part instead of HP bars) and clock (day 8.557 h, year 1241.42 days).
4. Survival needs in the engine (water, food, sleep, core temperature).

## 5. Rules (lorebook Faerun_weave-rules.json, entries 564–577)
- Source: Faerûn lorebook Faerun__4_.json (574 entries). Magic entries 564, 566–574 rewritten as hard rules; 575 network, 576 body and injury, 577 survival needs are new. Durations converted to Losica days with absolute seconds kept.
- "Soul" → the network: conduits C + nexuses N + reserve R (R_max = C) + purity P + affinity channels A; does only intake (0.4278 × C per day), storage, conduit growth, sensing. "Sea of consciousness" → caster's memory.
- Conduits: width grows 0.2909 × E^0.4063 per day (E = energy passed; fitted to the source's 116.9 and 934.9 practice days); split at width 2 (vessel splitting, bacterial adder); unused conduits narrow (OPEN-4); one-spell practice grows a trunk, varied practice grows loops (Katifori 2010).
- Nexus: conduits fused into one control knot (insect ganglion fusion, Niven 2008); N sets stage and max complexity; forms when C ≥ 4000 × (N+1) on a day spending ≥ a full day's recovery at max complexity; costs gesture-school casting time (OPEN-37). World Serpent Inn "nexus" → "meeting point of planes".
- Stages: 1 (N 0, C < 200, max complexity 1), 2 (N 0, C ≥ 200, 3), 3 (N 1, 6), 4 (N 2–12, 9), 5 (N 13, 9). Costs 40/64/107/178/297/495/825/1375/2292 PE; actual = base ÷ P.
- Affinities: sensing channels like cone cells; A channels tell apart A directions in the Weave; "fire/water/…" are human labels for regions. OPEN-34 = the quantity that varies in the Weave.
- Laws: relations between quantities; magic sits on ordinary physics and changes none of it.
- From the old affinity/IPA chat, kept: law as constraint, categories as labels on a continuous space, affinity = perception channel, conduit = production; dropped: 3,000 laws, specialist-bottleneck claim (flow physics reverses it).
- Body (576): Cataclysm: Dark Days Ahead structure — parts feed abilities (limb scores), damage = wounds, no HP. Bleeding femoral 300–600, limb artery 70–170, small ≤ 10 mL/min; ATLS classes; class IV death 30–60 min bleeding / 2 h stopped; refill fluid 2.8–5.6 days, red cells 98.2 days per 500 mL; Perkins fracture times; falls by Losica height (44 % at 10.1 m … all above 16.2 m); infection table. Cataclysm items & crafting and mutation & exposure are candidates for later.
- Survival (577): water 1.32/0.96 L per day; death at 12–15 L lost; starvation death at −40 % mass; sleep lapses after 15.84 h awake; hypothermia stages; wet-bulb limits; altitude penalties.
- Annotated reference = same rules with sources and reasons, kept out of the lorebook.
- Open: OPEN-2, 4, 7–13, 14 (healing), 15–27, 30, 31, 33, 34, 35, 36, 37, 42, 43, 46, 47; CONFLICT-1 gold vs metal (traced to 金 jīn); CONFLICT-2 two schools share the gray signature. Non-magic entries (barghest, devils, genasi, kalashtar…) still use "soul"/"affinity" in the everyday sense. Faerûn places (Waterdeep, Lords' Alliance) still to be moved onto Losica.

## 6. Planet Losica (losica-humans.md)
- Star 1.07 M☉, 1.371 L☉ (kept), age 5.3 Gyr at Z = 0.02, Teff 5,895 K (physics.json's 6,079 K is wrong).
- Orbit a 1.1625 AU, e 0.447, obliquity 44.6°, periapsis near northern summer; flux 3.32× to 0.48× Earth. Day 8.557 h; year 1241.42 days (442.6 Earth days); moon synodic 17.87 days.
- Gravity 11.61 m/s² (1.18 g); surface pressure 50.5 kPa; O₂ 25.4 %; sea level = 4,200 m Earth equivalent oxygen; water boils at 81 °C.
- Map: Orogen (maph.zip) is the chosen geography; land 59.1 M km² (9.7 %). The old v0.9 climate package is discarded; its problems are not the user's to fix.
- Climate: north uninhabitable (summer land 150 °C+ in the GCM). Homeland = S-polar continent, 10.1 M km², 51–81°S, 174° of longitude. Southern mean temperature 7–19 °C until the GitHub run reports. Polar day 580 / night 119 days at 60°S.
- Humans: body clock ~24.2 h, cannot entrain to the 8.557 h day → sleep set socially. Open decisions: native or Earth colonists; food base (biology undefined); way of life.

## 7. Languages
- Komuheft and Tegofarela descend from Pre-Proto-Losica via Proto-Losica. Only phonology exists; no words yet. Current files: Komuheft-5.md, richtext_converted_to_markdown.md (Tegofarela). An older tegofarela.md had examples; the CSV in losica_project is outdated.
- Method: categories and grammar emerge by process — efficient communication (Kemp & Regier 2012; Zaslavsky 2018), iterated learning (Kirby, Cornish & Smith 2008), grammaticalization (Heine & Kuteva), the languages' own sound changes. English categories and WALS frequencies are not inputs.
- Words from derive.py (e.g. *kʷarema "weave") are placeholders: they filled English concept slots.
- Gaps found: Komuheft copies Grimm's law; *ts > *s > h occurs in both daughters (belongs to Proto); /ɨj/ listed as a vowel; Tegofarela: gʷ split, e/o split, *r radicals, probabilistic nasals, lowering-vs-stress ambiguity undefined, no morphology; Pre-Proto → Proto bridge undefined. derive.py readings: T1 gʷ → ʋ before V; T2 *e *o > ɛ ɔ / _C₀a; T3 intervocalic *r lost with mora.
- Next: speakers' communicative needs from section 6 → categories → words.

## 8. Working conditions
- User is on mobile; weekly Claude limit is a constraint (75 % used on Oct 2).
- Background processes in the cloud session stop when a turn ends; long runs go to GitHub Actions.
- Evaluations need evidence levels; vibe-based judgments are rejected. Scans and lists are exhaustive.
