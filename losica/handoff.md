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
- PR #1 `strict-dice-commit`: RNG mode "strict" = dice tool everywhere, queue never injected; src/state/rng-mode.js replaces 4 duplicated mode blocks. Dice fixes (src/state/dice-ledger.js), all tool modes:
  - RollTheDice `kind`: check (dc > 0 required, else refused before rolling) | attack (dc = target AC; natural 1 → MISS, natural 20 → HIT + double damage dice, per stock <critical_hits_and_dying>) | amount (damage, healing, quantity) | table (contiguous ranges → tier returned)
  - Verdict computed in code, returned as binding. After each reply: IF a roll parenthetical's DC, AC or % and total match a logged roll AND its verdict word contradicts → word flipped, toast shown
  - Re-roll block: ledger per turn (latest user message: count + text hash) in chatMetadata.rpgDiceLedger; same who + for + kind → first result, across tool rounds, swipes, regenerates. The RNG queue is stored in the same ledger (Multihog rebuilt it every generation).
  - `<loot>`, `<random_events>`: kind "table" calls with the old thresholds; queue modes keep "pop" wording
- PR #2 `rules-engine` (on #1): src/rules/losica-engine.js (pure rules) + losica-tools.js; tools LosicaWound, LosicaTreat, LosicaTime, LosicaCast, LosicaFall, LosicaStatus; checkbox `rpg_losica_rules` under RNG settings; off by default.
  - State in chat metadata, snapshot per user turn, restored on swipe/regenerate. Random draws seeded by chat salt + turn key + call order, so a swipe repeats outcomes.
  - Each reply stores its end state in extra.losicaResult[swipeId] (as Multihog stores rpgMemoResult). MESSAGE_SWIPED restores it; CHAT_CHANGED and MESSAGE_DELETED take the last reply's state (branches, deletions); a Linear Stone restore takes the state of the reply whose rpgMemoResult is that memo.
  - OPEN values are inert in code (rule-file convention): infection onset OPEN-43 = null, so no infection starts.
  - 1,273 tests pass. Neither PR tested inside SillyTavern.
- Branch `losica-climate`: ExoPlaSim run on GitHub Actions (original star, Orogen map, restart from model year 4, 30 years, land-temperature step limiter patch). Results in climate/results/summary.txt and trend.txt.
  - Run 37047323550 (finished 2 Oct 23:41 UTC, model years 5–34, summary = last 5): global mean 26.3 °C, no sea ice from year 17; 53–75°S land 10.50 Mkm² MAT 9.9 °C (months 7.4–13.5), Tw-max 9.3, precip 917 mm, runoff 0; 30–75°N MAT 29.5–30.4, warmest 36.8–37.9; livable 19.86 of 56.31 Mkm² (analyze.py: MAT −10…29, warmest < 40, Tw-max < 25).
  - Fault: monthly orbit distance prints 1.07–1.14 a in every twelfth = whole-orbit time mean a(1 + e²/2) = 1.100 for e 0.447; an orbit-matched calendar would show ≈ 0.6–1.45. TOA net swings −94…+59 W/m² between files. Output years cover different parts of the orbit and the 5-file average mixes seasons: MAT approximate; coldest/warmest month, Tw-max, livable area unusable. Fix: one orbit per output year (or bin by orbital phase via rdist), rerun.
- Open dice gaps: prose after a roll is not checked; dc is the model's choice (a CYOA option's [DC N] is not enforced); the re-roll block keys on `for` wording; default RNG mode is the pre-seeded queue (12 dice visible); order vs Prose Polisher / Guided Generations edits untested.
- Differences from Multihog conventions, open: per-chat state in chatMetadata (Multihog uses settings.chatStates with chat-switch guards); stateTrackerSwipeRollback = false is ignored by Losica; several AI replies without a user message share one turn.
- Known Multihog holes: HP hardcoded ~75× in renderer.js and constants.js; clock assumes Earth days; d100 mode with the queue keeps the 1–20 loot and event thresholds after rewriting "d20" to "d100".
- Code style: comment density at or below the codebase (6–12 %); prompts and tool descriptions as positive statements.

- Losica mode (rules-engine 296def8, src/rules/losica-mode.js): with `losicaRules` on, D&D mechanics are replaced where they are written, not hidden afterwards.
  - Narrator: sections weapon_proficiencies, attacks_per_round, saving_throws, xp_system, level_up_protocol, homebrew_and_custom_classes omitted; role, rng_system, combat, loot, resting, [PARTY]_mechanics, constraints, state_memo, footer replaced. Footer: status from [BODY] + location + clock; no XP or level.
  - State Tracker: [CHARACTER]/[PARTY]/[COMBAT] = "Name (N kg)" + training, senses, affinities, spells, conditions; [INVENTORY] items described physically; [SPELLS] = name (school, complexity); [TIME] tracks Last Woke; [XP] and [ABILITIES] off. Core prompt: conditions by story time, no buffs/AC/slots. Body state only in the code-written [BODY].
  - RollTheDice: kinds check | amount | table. Attacks by fist, kick or blade → LosicaStrike; by other means → check, then LosicaWound.
  - Choices examples, character creation (no levels, no BAB guide, no +N gear) and the sheet (a "Name (N kg)" line starts an entry) follow.
  - Still D&D-shaped with Losica on: NPC memory combat-profile guidance (src/state/lorebook-runtime-fragments.js, module-instructions.js), the attribute roll panel in onboarding, realistic/horror genre hints in character creation.

## 4. Next, in order
1. Clock (day 8.557 h, year 1241.42 days).
2. Survival needs in the engine (water, food, sleep, core temperature).
3. NPC memory combat profiles in Losica terms.

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
- Open values: see section 5a. CONFLICT-1 (cantrips): the source calls complexity-1 Healing the cheapest spell, the cost table is the same for every school → school costs (OPEN-17) or drop the line. CONFLICT-2 (signatures): mutated Demonic also shows gray, so gray = Neutral OR mutated Demonic. Gold vs metal (traced to 金 jīn) is OPEN-15, not a CONFLICT. Non-magic entries (barghest, devils, genasi, kalashtar…) still use "soul"/"affinity" in the everyday sense. Faerûn places (Waterdeep, Lords' Alliance) still to be moved onto Losica.

## 5a. OPEN register (scan of both rule files, 2 Oct; OPEN-3 marked closed in the reference; 34 open ids, the same in the lorebook and the reference)
Convention in both files: an OPEN value means the effect it governs does not happen.

| Rule | OPEN | Value needed | Kind |
|---|---|---|---|
| Network (575) | 4 | fraction per day unused conduits narrow | research analogue (vessel regression) or decision |
| | 30 | network seen / touched / damaged by physical injury | decision |
| | 31 | network when its body dies | decision |
| | 34 | the quantity that varies within the Weave ("wavelength") | decision; keystone for 35, 15 |
| | 35 | channels per human, variation, position along OPEN-34 | after 34 |
| | 36 | damage from an over-complex cast | decision; body link |
| | 37 | extra casting time per nexus, gesture schools | stated process possible (signal delay from fused center) |
| Stages, lifespan | 2 | what sets stage-5 lifespan in 660.2–1650.4 years | decision |
| | 7 | damage per lightning tribulation (burn size) | decision; body link |
| | 8 | R drain per day while the network is outside the body | decision |
| | 9 | what can harm a network outside the body | decision |
| | 10 | years added per lifespan source (boon, artifact, pill) | decision |
| | 33 | body without its network: alive or not, how long | decision |
| Cantrips | 16 | major cantrip cost (transmutation ≤ 20 PE) | decision within bound |
| | 17 | school-specific costs (CONFLICT-1) | decision |
| Schools | 13 | gesture-school block or penalty in upper-body armour | decision |
| | 14 | Healing school: reduction of one wound's healing time | decision; needs soft-tissue healing times (gap below) |
| | 15 | what separates gold from metal | after 34 |
| Purity | 11 | P drop per event | decision |
| | 12 | P rise per 84.1 days of meditation; per item | decision |
| Signatures | 21 | which spells make sound | decision |
| Spell origins | 18 | allowed mutation pathways besides Demonic → gray | decision |
| | 19 | minimum complexity that counts as complex | decision |
| | 20 | mutation chance on extraction | decision |
| Casting | 22 | countercasting: who, cost, success chance | decision |
| Zones | 23 | law-knowledge threshold to cast in a dead zone | needs a defined "knowledge of a law" quantity first |
| | 24 | how long duration spells continue after entering a dead zone | decision |
| | 25 | wild-magic extra-event probability and event list | decision |
| Items | 26 | PE for a binding ritual | decision |
| Beasts | 27 | core-density thresholds per grade 1–9 | decision |
| Body (576) | 42 | fracture chance in falls < 5.1 m Losica (< 6 m Earth) | research; searched 2 Oct, no all-fracture rate per height band found (sources in reference) |
| | 47 | ability lost by a crooked leg or foot (arm/hand set: 51 % grip, Orbay 2002) | research |
| | 48 | healing time of punctures and bites | research |
| | 49 | healing time of blunt wounds | research |
| | 50 | how much infection slows healing and drains strength | research |
| | 51 | ability penalty per wound type and score (framework set: Cataclysm: DDA limb scores) | research per injury |
| Strikes (576) | 52 | CLOSED 3 Oct: lands unless the target recognises it and completes a defensive move before impact (timings sourced; replaces NetHack d20) | — |
| | 53 | hit location when not aimed | research (assault injury distributions) |
| | 54 | club/tool force: contact stiffness per part to turn measured energy (Siegenthaler 2018) into force | research |
| | 55 | share of limb arterial injuries in the femoral bleeding class | research |
| | 56 | blade wounds to head, eyes, mouth, torso: organs, deep vessels | research |
| | 57 | fracture force for torso (ribs), hand, foot | research |
| | 58 | healing time of skull, face and torso fractures | research |
| | 59 | concussion and knockout from head blows | research |
| | 60 | calibration of blow force vs fracture thresholds (uncalibrated: untrained punch breaks the jaw 94 %) | research: landed head strikes per bare-knuckle bout vs 27 facial fractures in 301 bouts |
| | 61 | armour: AC per armour type | research or game values |
| | 62 | trained defender reading cues before the strike starts (anticipation lead) | research (karate/boxing anticipation timing) |
| | 63 | senses during sleep: does a magical sense work and wake the sleeper | decision |
| | 64 | attacker tracking a moving target; room to evade; aim information from sound | research or decision |
| | 65 | sensory thresholds (hearing, waking) for non-human bodies: depend on the ear, not on size | research per sense organ |
| Survival (577) | 46 | altitude effect for people born there | research: long-resident highlander data (Andean, Tibetan) |

Closed 2 Oct 2026 (rule 576 + engine commit 1cf0cf9): OPEN-43 onset (bites 1 Earth day, Talan 1999; other wounds 10 Earth days, laparotomy SSI proxy, Gundel 2018); cut healing by part (Forsch 2017, expert opinion); burn healing by depth (Warby 2023, Lloyd 2012, CHOP); fall deaths 5.1–10.1 m by straight line, all above 16.2 m (engine had unsourced 22.7 % and 78 %); "size" dropped from the wound definition, burns take a depth; the 32.5 % midpoint written into the reference.

Gaps without an OPEN tag:
- Abilities: framework set 2 Oct (rule 576 = Cataclysm: DDA limb scores, commit 935fe5f; share = value × (1 − Σ penalties)). Only unjoined fractures (1) and crooked arm/hand grip (0.49) have penalties; all other wounds wait on OPEN-51.
- Engine lacks the stage-5 route (five complex patterns at once, d100 ≤ 15, tribulation every 841.4 days); its cap of 12 nexuses is consistent with the rule.

## 5b. Reality audit (3 Oct 2026): engine output vs independent data
| Rule | Engine gives | Independent data | Result |
|---|---|---|---|
| Untreated arterial bleeding | alive at min 40 with 18 L lost (367 % of 4.9 L) | Syverud 1989 swine: death at 50 mL/kg lost | FAILED → fixed (death at 50 mL/kg; femoral 6–12 min, limb artery 21–50 min) |
| Leg fracture union (Perkins) | shin joins at 6 (spiral) / 12 (transverse) Earth weeks | Oni 1988, 100 closed tibial shaft fractures: 19 not united at 20 weeks, 4 still not at 30 | FAILED, open: joins too early; replace with measured union times per bone |
| Treatments | stop_bleeding stops any bleed instantly, always; transfuse resets all loss at once; clean always works | tourniquets, packing and transfusion take time, supplies and skill and can fail | FAILED, open: need success rates and times |
| Cut healing | closed at suture-removal time, then off the list | a closed wound has ~a small fraction of its final strength at that point | approximation, flagged |
| Ability scores | Cataclysm: DDA game values | none measured | unvalidated (game structure) |
| Strike force → fracture | disabled | direct comparison gave 94 % jaw fracture per untrained punch vs 27 facial fractures in 301 bare-knuckle bouts | disabled until OPEN-60 |
| Magic, network | fiction | no reality to compare | internal consistency only |

Enforcement (3 Oct 2026, engine commit after 29f2c03): severity moved into code (LosicaWound takes cause and place only; vessel and fracture come from code); a standing <rule_engine> brief names the tool per event; after each reply a side pass (State Tracker connection) lists unbacked or contradicted events → one automatic redo as a swipe with the missing calls named → a second failure is shown as a warning. Limits: the checker is itself a model (it can miss events); hit/miss, location and DC still come from the narrator.

Method from 3 Oct 2026: derive from what makes the value (body size, physics), not from species or category labels; human measurements are calibration points. Cause first; few quantities; each number with meaning and source; plain-sense cases written as tests before code; simulate a scene grid for absurd outputs; record flaws found.

Interruptions (3 Oct 2026, from NetHack/Pathos): LosicaTime stops at the first minute in which anyone's blood-loss class rises, dying begins, someone dies or an infection shows; it returns the elapsed and remaining minutes. Next from the same review: one to-hit formula (closes OPEN-52), hunger as counter with levels and per-turn chances (rule 577), rules as data records, creature body traits (blood, limbs, hands, eyes, mind).

Decided by the LLM, not by code (before enforcement): whether it calls a tool at all; wound inputs (vessel, fracture kind, open grade); hit or miss, hit location, DC; minutes passed in LosicaTime; prose after a roll (only roll parentheticals are corrected); D&D hit points still run beside wounds until the cartridge.

## 6. Planet Losica (losica-humans.md)
- Star 1.07 M☉, 1.371 L☉ (kept), age 5.3 Gyr at Z = 0.02, Teff 5,895 K (physics.json's 6,079 K is wrong).
- Orbit a 1.1625 AU, e 0.447, obliquity 44.6°, periapsis near northern summer; flux 3.32× to 0.48× Earth. Day 8.557 h; year 1241.42 days (442.6 Earth days); moon synodic 17.87 days.
- Gravity 11.61 m/s² (1.18 g); surface pressure 50.5 kPa; O₂ 25.4 %; sea level = 4,200 m Earth equivalent oxygen; water boils at 81 °C.
- Map: Orogen (maph.zip) is the chosen geography; land 59.1 M km² (9.7 %). The old v0.9 climate package is discarded; its problems are not the user's to fix.
- Climate: north uninhabitable (summer land 150 °C+ in the GCM). Homeland = S-polar continent, 10.1 M km², 51–81°S, 174° of longitude. Southern mean temperature ≈ 9.9 °C (run 37047323550, approximate; seasonal range unknown until the calendar fault in section 3 is fixed). Polar day 580 / night 119 days at 60°S.
- Humans: body clock ~24.2 h, cannot entrain to the 8.557 h day → sleep set socially. Decided 3 Oct 2026: biology = modern humans, so human measurements are data for them. Many generations at Losica's air pressure, so OPEN-46 uses long-resident highlander data. Open decisions: food base; way of life.

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
