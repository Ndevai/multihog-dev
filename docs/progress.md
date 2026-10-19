# Progress log

Newest first. Each entry: date, model, what changed (plain words), what was checked, what is next.

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
