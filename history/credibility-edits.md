# Human credibility: the lines to change so the engine reads inputs, not outcomes

**Third pass (the uploaded sources).** Every file in the six archives (112 papers and books, one saved web page) and the six data sets nested in them was opened and given one status: 24 are used in a rule or a check, 21 were read against the numbers already in the code and agree (one source note corrected), 8 are already wired, 55 were read and left out with the reason, 5 hold no content (a download page, a preview, a book review), 3 are subsets and 3 out of scope (section 5). The patch now carries 70 edits, 10 logic fixes and 22 changes to the engine's own machinery; the engine test file has 130 checks, 91 of them new, and each of the 80 negative controls in `tests/negative-controls.json` breaks one rule or fix and is caught by its test (`npm run negative-controls`).

**Fourth pass (the ten shortcuts that were left).** E67–E76 in section 6: choices weighed by the chooser's state, jumps and lifts from the body, hours on a task and thirst in every alertness task, conformity, mood by activity, weight gain and death at a lethal BMI, crowds leaving through one exit, eyewitness lineups. Hunger and pain stay out because their measured effects on task performance are null.

**Fifth pass (what the fourth left open).** E77–E82 in section 7: fear in thinking tasks; fear, a weapon and a face of another people at the sighting, and sequential lineups; death by compressive asphyxia in a crowd. Sadness stays out as a measured null. Two remain open: crowd injuries begin earlier than in Helbing's own figure, and no source gives take-off speed as a share of running speed.

**Sixth pass.** E83–E85 in section 8: the foot in the door and the door in the face, and drowning outcomes by the time under water.

**Logic pass.** L1–L10 in section 9: the code of every pass reread for logic. The largest: an operator-precedence slip had dropped drink, lost sleep, concussion, hours on the task and thirst from every alertness task.

**Open items pass.** Section 10: each open item searched; three settled by sources (E86–E88), the rest closed with the finding or kept open with what blocks them.

**Eighth pass.** Section 11: E89–E93, the assumptions and narrator inputs that a source could still settle.

**Ninth pass.** Section 12: E94–E95, alcohol absorption and who can swim.

**System pass.** Section 13: S1–S10, the engine itself. The crowd model runs 4.2 × faster with the same outcomes and stops writing millions of draws into the chat; a result counts a judged value only once that value can change it, so the sensitivity reruns vary what matters; ten more judged values carry ranges; the odds factors sit in one list; a maidservant is always a woman; the negative controls live in the repository, and the tests keep their last lines of output.

**Reading ordinary lines, and who hears what.** Section 24: 75 ordinary roleplay lines run through the reader, and what it got wrong fixed: blows at possessives, numbers and eggs; hugs handed over; "the truth" as a listener; acts said not done; OOC asides; "she" in third-person play; bystanders who overhear; an expert defender who blocks sooner.

**What the review pass left, done.** Section 23: R15–R22 and controls for the route, plan and size tests. The line said another way leaves the chat; code writes only the player's own acts; guillemets are quotes and capitals louder on common words only; the room's echo carries the raised voice; a run and a hurried walk from measured speeds; the record restarts past its folded base; five fitted factors registered; TypeScript pinned; three statistical checks at 4 SD.

**The review, run.** Section 22: R1–R14. An outside review's 19 findings (static, none run) were run against the code and SillyTavern's own source: 12 hold and are fixed, 4 more turned up on the way (a regenerate without a reply ran the turn twice; marks on the first word of a quotation were lost; a run in the player's words was walked, and a walk in two legs timed as one; `npm test` failed to compile on the TypeScript `package.json` installs), 7 did not hold as stated. Each fix has a test that misses on the uploaded code and a negative control.

**The voice without signs.** Section 21: S37–S41. The player keeps the full notation in the backend and sees none of it: a toolbar of plain words over selected words, the marks kept as invisible characters, soft colour in the box, the line typeset in the chat, and the notation given to the engine and the model by code.

**How a line is said.** Section 20: S33–S36. Speech carries more than its words: the player marks pitch, stress, pauses, breath, tempo, loudness and voice quality on the line (conversation analysis's and VoQS's marks, by hand or with a bar of buttons), code reads them, and the listener hears the feeling right as often as listeners do (Juslin & Laukka 2003).

**The look the player chose.** Section 19: S28–S32. The player was shown drawn options and picked them: dense tagged rows, a book serif in italics, one colour per kind of rule, folded, questions as prose with linked choices, type that follows the story's era. Each pick is built on a source (Okabe & Ito's colour-blind-safe hues, WCAG contrast, the type history of each era) and checked in code.

**What the player sees.** Section 18: S23–S27. From SillyTavern's own message styles, accessibility guidance (WCAG 2.2.1, NN/g, Roselli), Inform's transcript, Material's one-action rule, Raskin's undo over warnings and the default effect: the reading stays under the player's line in their theme, a taken reading has one "change", a question has no default, and a swipe of a redone turn no longer brings the undone act back.

**What existing systems teach.** Section 17: S19–S22. From decision theory (Horvitz), parsers (Inform, Hugo), dialogue systems, Attempto Controlled English, plain-word corrections (Elgohary et al.) and FrameNet: ask only when a wrong guess costs, rank before asking, show the reading in story words, take a correction in the next line, and read meanings by frame as well as by class.

**Making the input exact.** Section 16: S16–S18. The outcome is the product of the engine's part and the input's, so the input side is raised: the narrator names what each body task is, the player sees how their line was read, and a choice their words leave open is asked rather than guessed.

**Every route by meaning.** Section 15: S13–S15. The other nine BodyCheck routes, the player's looks and blows, and the activity's mood row read verbs by their VerbNet class.

**Sight verbs and repeatable tests.** Section 14: S11–S12. A BodyCheck whose verb is one of seeing goes to Look by present-day meaning (VerbNet), not by word roots; the test harness draws one fixed sample, and the statistical checks sit about 4 SD from their measured rates.

**Conclusion.** 49 edits in 20 files replace outcome rates and narrator guesses with the inputs that produce them. Edits E01–E09 and E16 come first: they turn light and sound into continuous physics, and every combat, social and stealth outcome reads from them. Line numbers in sections 1–4 refer to `multihog-dev-rules-standalone` as uploaded; a script re-checked each cited line.

Evidence levels follow `exact-voice`: *published* (source read in this session), *derived* (computed here from the engine's own code or from published values), [ASSUMED] (a guess, or a source recalled and not read; the source is named so it can be read before coding).

**Patch.** `credibility-first-edits.patch` applies 60 edits to the uploaded files: the 25 of the first passes, E51–E66 of section 5, E67–E76 of section 6, E77–E82 of section 7 and E83–E85 of section 8, the logic fixes L1–L10 of section 9, E86–E88 of section 10, E89–E93 of section 11 and E94–E95 of section 12. It applies cleanly to a fresh copy; `npm test`'s steps pass (route 60, frame 34, engine 113 with 74 new checks, plan 58, size 9 of 9); each new check misses on the code without its rule; `tools/prompt-audit.mjs` reports the same as before. Callers keep working with no new arguments.

| Edit | In the patch | Not yet |
|---|---|---|
| E01, E02 | hourly cloud cover, irradiance, wind, humidity from ERA5, set on the place's clock for that date | dew point, precipitation by hour |
| E03 | the place's civil clock: IANA zone (Open-Meteo), historical offset (Intl), local mean time before standard time or offline | — |
| E04, E45 | daylight from Haurwitz × measured clear-sky index; days without hourly cloud 0.89 dry, 0.55 wet (fitted to the WGEN tables) | — |
| E05, E06 | continuous twilight; moonlight by phase, altitude, air mass, on level ground | — |
| E07, E09 | contrast fades with distance (Koschmieder) and must pass Blackwell's 1946 threshold for the target's size and the light; one try per 6 s look, at most 10; no light, no sight | a target-against-background argument for Look (contrast is 1, a silhouette) |
| E10 | dark adaptation over 40 minutes after brighter light | — |
| E11 | acuity by age: flat to 55, Beaver Dam rate after 75 | a measured curve between 55 and 75 |
| E13, E14 | light at the target decides whether a fighter sees the attack and a gesture is made out; rooms lit by their flames and windows | lamps the story names but Room does not hold |
| E16, E18 | chance of hearing Φ(margin ÷ 3 dB) in Listen and in fights over a `background` | — |
| E17 | a room's crowd talk by Rindel's model (Room `people`) | rain, wind, traffic (no published levels found) |
| E21 | bystanders on the map hear and see what the actors do ([PERCEIVED]) | speech overheard by bystanders |
| E22 | drawn knockout and choke length; concussion after a knockout | a sourced length (OPEN-81) |
| E28 | WorkOut from the character's own ability, drawn once | ability tied to occupation |
| E30 | an appraised feeling stays in [BODY] for a drawn time, longer for a central event and for women (Verduyn & Lavrijsen 2015) | effects of the feeling on other outcomes |
| E33 | forgetting by importance | a measured slope |
| E34, E35 | obedience circumstances from where the victim is; onlookers counted from the map | — |
| E44, E50 | gait smooth across ages and scaled by √height; height loss after 40 | BMI by age |

From your uploads: Blackwell 1946 (Table III) settled E07, and Verduyn & Lavrijsen 2015 (importance B = .14; women 4.42 against men 4.04) refined E30. Read and kept for later: Fehr & Gächter 2002 give a Tobit coefficient of 0.622 MU of punishment per MU below the others' mean (E39 needs the Tobit constant and spread to become a probability); Tversky & Kahneman 1992 give α = β = 0.88, λ = 2.25, γ = 0.61, δ = 0.69 (E42 still needs a choice-noise parameter and outcome odds from other tools); Bond & Smith 1996 report conformity as effect sizes, not response rates. None of the uploads gives adult jump or lift norms, ISO 7029 coefficients, BMI by age, cue effect sizes for lies, given names, smoke yield or fog. Searched earlier and still open: adult jump and maximal-lift norms for E26 (found only children's jump norms, KIT, and acceptable-load tables, Liberty Mutual, which measure willingness at work, not capacity); the ISO 7029 coefficients (behind the standard; the free preview stops at the contents); BMI by age (the CDC 2015–2018 reference report lists it in Tables 14–15, not readable here); cue effect sizes for lie judgements (DePaulo et al. 2003, tables not in the readable text). Left out by choice: E32 (an AR(1) state would need the Claim draw restructured), E38 (the Fehr–Schmidt distribution refuses 20 % offers 70 % of the time against 31.6 % in Henrich's 14 societies, and no single scale factor fits both buckets), E42 (choices from other tools' odds need those tools callable from Choose), E23 (a per-person tolerance needs the punch-momentum distribution refitted).

The ERA5 and zone calls could not be reached from the build machine (the API refuses it); the reader was tested against a reply in the documented format, and the first live run belongs in SillyTavern.

---

## 1. The benchmark

The benchmark has three scores. Each is computable from the repository.

**Score 1, input coverage.** Share of outcome types decided by engine state through a published mechanism. An outcome that reads a narrator estimate (`share`, `base_share`, `noise`, `light`, `lit`, `visibility_m`) or a published outcome rate counts as output-level.

| Layer | Input-level today | Output-level today |
|---|---|---|
| Light | acuity vs luminance (vision.ts:11), Meeus sun/moon (sky.ts) | lux steps (sky.ts:62–67), visibility cut (vision.ts:27), `light`/`visibility_m` from the narrator (rules-tools.ts:1473, 1475) |
| Sound | ISO 9613 chain, SII, Lombard, mass law (acoustics.ts) | `audible` as a hard threshold (acoustics.ts:201), noise class chosen by the narrator (acoustics.ts:27–28) |
| Body | tissue layers, Pulse bleeding, JOS-3, CO, hold endurance, defence race (body-engine.ts:842–929) | fall deaths (body-engine.ts:70), KO threshold fit (body-engine.ts:763), KO ends at the next minute (body-engine.ts:282), intact-body checks (body-engine.ts:1462) |
| Mind | reaction time by age (body-engine.ts:856), OCC rules (emotion.ts) | appraisal variables, `matters` (3 levels), no stored affect (rules-tools.ts:960–970) |
| Social | per-person traits drawn once (social.ts:10), Schweitzer trust curve (social.ts:126) | 9 published outcome rates (social.ts:7, 48, 55, 71, 77, 83, 96, 114), `Choose` shares (rules-tools.ts:1219) |
| World | ERA5 temperature (reanalysis.ts:49), Tobler/energetics walking (work.ts:51–65), QMRA water (waterborne.ts), venom dose (venom.ts:29) | gait table (work.ts:42), cause-of-death shares (disease.ts:57), battle bands (battle.ts:10–13), sea-sickness shares (sickness.ts:15–18) |

**Score 2, reconstruction fit.** Each published figure now used as a generator becomes a test target. The replaced model must reproduce it within its sampling error. Table 1 lists the targets with their current location.

**Score 3, tell inventory.** A tell is a behaviour a reader recognises as non-human. Table 2 lists 19, each with its generating input and the edit that supplies it.

### Table 1 · Reconstruction targets (the old constants, kept as tests)

| Target | Value | Lives today at |
|---|---|---|
| Black target at the horizon, daylight, seen with p = 0.5 at distance V | 2 % contrast (WMO) | vision.ts:22 (comment) |
| Detect / recognise / identify | 1 / 4 / 6.4 cycles | vision.ts:15 |
| Full moon illuminance, zenith | 0.26 lx (derived, E06) vs 0.12 lx today | sky.ts:49 |
| Rod–cone break; full dark adaptation | 5–8 min; about 40 min (published) | not modelled |
| Choke to unconsciousness | 6.2–10.5 s, mean 9.0 s | body-engine.ts:766 |
| Skull fracture / KO per landed pro head punch | 0.153 % / 0.743 % | df/combat.ts:33; body-engine.ts:761 |
| Dog bite breaks skin / fractures bone | 87.4 % / 2 % | df/combat.ts:36, 39 |
| Fall mortality at 12 / 15.6 / 19.2 m | 44 / 56 / 78 % | body-engine.ts:70 |
| Serious injury, fall on the level, age ≥ 65 | 10 % | rules-tools.ts:2003 |
| Concussion at a straight punch of 58 g and 6 343 rad/s² | 7.66 % (derived, Rowson & Duma Eq. 2) | not modelled |
| Walk–run transition, leg length 0.89 m | Fr 0.45, 1.98 m/s | not modelled |
| Acuity, better eye, ages 25–54; break point | −0.18 ± 0.05 logMAR; 55–59 years | not modelled |
| Lie judgement: truths believed / lies believed | 61.34 % / 52.45 % | social.ts:7 |
| Milgram: 7 conditions | 65, 40, 30, 21, 47.5, 10, 92.5 % | social.ts:48 |
| Help alone / with others (Fischer g) | 85 %; g −0.12 … −0.49 | social.ts:28–34 |
| Refusal of splits ≤ 20 % / larger | 31.6 % / 6.2 % (14 societies) | social.ts:71 |
| Punish at least once in 6 rounds | 84.3 % | social.ts:75 |
| Bickman: civilian / milkman / guard | 30.1 / 47.3 / 77.2 % | social.ts:88–92 |
| Langer 2 × 3 table | 0.60 … 0.94; 0.24 … 0.42 | social.ts:114 |
| First meeting, yes | 0.50 (women 1/3 among 15+) | social.ts:83 |
| Vomiting at sea (all / male / female / under 15) | 7.0 / 5.0 / 8.8 / 12.0 % | sickness.ts:2–3 |
| Preferred gait by decade | 126.2–143.4 cm/s men | work.ts:42 |
| Simple reaction time, men 18/30/45/65/80 | 277/281/290/324/399 ms | body-engine.ts:856 |

### Table 2 · Tells and what generates them

| # | Tell a reader notices | Input that produces the real thing | Today | Edits |
|---|---|---|---|---|
| T1 | A person at 1,999 m is seen at p = 0.25; at 2,000 m at p = 0 | Contrast falls as e^(−3.912 d/V) against a contrast threshold | Hard cut | E07–E09 |
| T2 | Light jumps ×39, ×118 and ×1,700 within one minute at sunrise | Sun altitude, cloud, aerosol | Step table | E03–E05 |
| T3 | A lit window and a dark-clothed person at night share one detection rule | Source luminance vs background luminance | One rule | E07, E14 |
| T4 | Eyes see a dark room at full sensitivity at once | Dark adaptation over 40 min | None | E10 |
| T5 | Moon gives 0.12 lx at any altitude | Phase, altitude, extinction | Phase only | E06 |
| T6 | Sunset in Lisbon on 21 June at 19:24 | Time zone and longitude | Zone ignored | E03 |
| T7 | A sound is heard up to 454.6 m and missed at 454.7 m | Detection is a psychometric curve | Hard threshold | E16 |
| T8 | A footstep at 10 m is heard in a 68 dB street during combat | Masking by background | Flat 25 dB | E17, E18 |
| T9 | A 70-year-old hears like a 20-year-old | Age-related threshold shift | Species only | E19 |
| T10 | A knocked-out character wakes at the next minute | Duration distribution | One minute | E22 |
| T11 | Every body with the same momentum is knocked out the same way | Head kinematics, per-person tolerance | One threshold | E23 |
| T12 | Falls kill by height only and break only heels | Load per body region vs tolerance | Table plus legs | E24, E25 |
| T13 | An uninjured person succeeds at the narrator's stated rate | Task demand vs person capacity | Narrator `share` | E26–E29 |
| T14 | Injury causes no pain, fear leaves no trace | Stored pain and affect with decay | None | E27, E30–E32 |
| T15 | Strangers answer with the same rate whatever the cost, cues and mood | Cost, cues, state | Lookup tables | E34–E41 |
| T16 | Characters react only to what the question model asked about | Engine-made stimuli reach every character in range | Question model decides | E21 |
| T17 | A first name comes from a US baby-name list or from the narrator's habits | Country and birth-year name frequencies | US names for births 1910–2029 only (names.ts:12–14) | E48 |
| T18 | A 70-year-old and a 20-year-old innkeeper are equally likely draws | Age mix within a trade | Age independent of occupation (census.ts:16) | E49 |
| T19 | A 25-year-old and a 70-year-old share one height and BMI distribution | Age profile of body size | Height by birth year, BMI by story year (body-size.ts:36–39) | E50 |

---

## 2. Edits

Fields: **Today** (quoted code), **Change**, **Basis**, **Check** (derived value the new code must give) or **Target** (published value kept as a test).

### A · Light and sight

**E01 · reanalysis.ts:8, 40–41, 53–56 · keep the 24 hours of cloud, sunshine, dew point, wind, humidity**
Today: the request names `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m` (line 41) and line 55 stores `windMs: mean(hr.wind_speed_10m), humidity: mean(hr.relative_humidity_2m)`.
Change: append `cloud_cover,shortwave_radiation,direct_radiation,diffuse_radiation,dew_point_2m,precipitation,pressure_msl,wind_direction_10m` to `hourly`; add to `ObservedDay` (line 8) the arrays `windH, humH, cloudH, ghiH, dewH, precipH` and `utcOffsetMin` (Open-Meteo returns `utc_offset_seconds` when `timezone=auto` is set [ASSUMED: recalled, read the response once]). Keep `windMs` and `humidity` as the means for existing callers.
Basis: *published*. Open-Meteo's historical API documents these hourly names; `visibility` is absent there.
Check: a day returns 24 values per key; `ghiH[0] = 0` at local midnight.

**E02 · rules-tools.ts:464, 544, 1208 · read the hour, not the day mean**
Today: `windMs: obs.windMs, humidity: obs.humidity` (line 544) and `a.wind_ms ?? obs?.windMs` (line 464) give one value for 24 hours; line 544 already indexes `hourlyC` by hour.
Change: index `windH`, `humH` by `Math.floor((t % 1440) / 60)` in the same expression as `hourlyC`; pass hourly humidity into `p.env.rh` (body-engine.ts:667 defaults it to 50) so `airAbsorption` (acoustics.ts:57) and the thermal model get the hour's humidity.
Basis: *derived* from the code (hourly temperature is already hourly).
Check: a 03:00 and a 15:00 call on one ERA5 day return different humidity when the day's values differ.

**E03 · sky.ts:54–59 · civil clock to hour angle**
Today: the comment at lines 54–55 states "The story clock is taken as local mean solar time [ASSUMED: time zones ignored]"; line 59 `const H = 15 * (clock - 12) + s.eqTime;`.
Change: `skyLight(minutes, lat, lon, utcOffsetH)`; `H = 15 * (clock - utcOffsetH - 12) + lon + s.eqTime`. Take `utcOffsetH` from E01 for 1940+ days; before standard time (about 1884) use `lon / 15` (local mean time); between, the IANA zone at that date [ASSUMED: `Intl.DateTimeFormat` supplies historical offsets in the host browser].
Basis: *derived*. The engine run for Lisbon (38.72°N, 9.14°W) on 2020-06-21 gives sunrise 04:41 and sunset 19:24 on its clock. On the civil clock (UTC+1) the same events fall at 06:18 and 21:01, a shift of 97 min. Reference sunset is about 21:05 [ASSUMED: recalled].
Check: Lisbon 2020-06-21 sunset 21:01 ± 5 min on the civil clock.

**E04 · sky.ts:62–63 · daylight from measured irradiance**
Today: `if (hs >= 6) return { lux: 15800, … }; if (hs >= 0) return { lux: 400, … }` (lines 62–63). 15 800 lx is the geometric middle of "full daylight, not direct sun" in the Wikipedia table; the same value applies at 6° and at 90°.
Change: lux = `kt × clearSkyGHI(hs) × 110` for `hs > 0`.
- `clearSkyGHI(hs) = 1098 · sin(hs) · exp(−0.059 / sin(hs))` W/m² (Haurwitz 1945; the constants 1098 and 0.059 as pvlib implements them, *published*).
- `kt` (clear-sky index) = ERA5 hourly `shortwave_radiation` ÷ the hour's mean of `clearSkyGHI` (E01). From ERA5 cloud cover when the irradiance is too low to divide (sun under about 5°): `kt = 1 − 0.75 (N/8)^3.4` (Kasten & Czeplak 1980, Hamburg; *published* as CIBSE eq. 16, which limits it to 7 oktas or less in the UK). A day without hourly cloud: E45.
- 113 lm/W is the luminous efficacy of global daylight under a clear sky at 30° (*published*: CIBSE, Solar radiation, long-wave radiation and daylight, Fig. 1; diffuse 104 lm/W); one measured mean elsewhere, 121.5 lm/W at Saint-Pierre, Réunion. Range 95–125 in the registry.
Basis: *derived* from the cited formulas.
Check (derived): clear sun at 50° gives 779 W/m² → 85.7 klx at 110 lm/W; `kt` 0.25 (N = 8) gives 21.4 klx; `kt` 0.12 gives 10.3 klx. At 10° / 30° / 70° / 90° the clear values are 14.9 / 53.7 / 106.6 / 113.9 klx. The `LIGHT` table holds 15 800 (daylight) and 1 000 (overcast) at vision.ts:6–7, which are 0.18× and 0.012× of the clear value at 50°: the new values replace both.

**E05 · sky.ts:62–67 · continuous twilight**
Today: `hs >= 0 → 400`, `hs >= −6 → 3.4`, then moon or 0.002. Derived jumps at one-minute steps (equinox, equator): 0.002 → 3.4 lx (×1 700) at −5.92°, 3.4 → 400 lx (×118) at +0.08°, 400 → 15 800 lx (×39) at +6.08°.
Change: below `hs = 0`, interpolate log₁₀ lux linearly in solar altitude through the engine's own anchors `[[−18, 0.002], [−6, 3.4], [0, 400]]` [ASSUMED: log-linear between anchors; −18° ↔ astronomical night]; add `moonLux` (E06) in quadrature. The floor above `hs = 0` is the `max` of E04's value and the interpolation at 0° (400 lx), so the curve is continuous at sunrise.
Basis: anchors are the Wikipedia values already cited at sky.ts:45–48; the interpolation form is [ASSUMED].
Check: at `hs = −3°` the value is 36.9 lx (derived: 3.4 · (400/3.4)^0.5); no step above ×1.5 between consecutive minutes at 10-minute resolution.

**E06 · sky.ts:49, 65–67 · moonlight by phase, altitude and extinction**
Today: `const moonLux = (i: number) => 0.12 * (0.01 / 0.12) ** (i / 90);` uses phase only, at any altitude.
Change: `V = −12.73 + 0.026|α| + 4e−9 α⁴` (α = phase angle in degrees; Krisciunas & Schaefer 1991, Eq. 9); `E = 2.54e−6 · 10^(−0.4 V) · 10^(−0.4 k X) · sin h` lx on level ground (the `sin h` factor is what a horizontal surface receives; the first version of this file left it out), with `k` = 0.172 mag/airmass at 2 800 m (published); use 0.2 at sea level [ASSUMED]; `X` from Kasten & Young 1989, `1 / (sin h + 0.50572 (h + 6.07995)^−1.6364)` (recalled; it reproduces the horizon air mass of about 38 that Wikipedia states: 37.9 derived, with 10.3 at 5°, 1.99 at 30° and 1.00 at 90°). The V = 0 zero point 2.54e−6 lx is *published* (Crumey 2014). Moon below the horizon gives 0 lx. Replace `moon()`'s omitted latitude and parallax terms (sky.ts:36) only if altitude errors above 1° matter.
Basis: *published* for the magnitude law and zero point.
Check (derived, level ground): full moon at 90° / 45° / 20° / 10° / 5° altitude gives 0.261 / 0.171 / 0.063 / 0.0195 / 0.0041 lx; quarter moon at 45° gives 0.0156 lx (at normal incidence, without `sin h`: 0.261 / 0.242 / 0.184 / 0.112 / 0.047 and 0.022). Today: 0.12 lx full, 0.01 lx quarter, at any altitude.

**E07 · vision.ts:25–32 · contrast replaces the hard cut**
Status: the distance fade is in `credibility-first-edits.patch` (contrast 1 for a black target on the horizon sky, threshold 2 %, product with the resolution term). The luminance-dependent threshold below is *not* in the patch: Ward Larson et al. give the TVI as a function of adaptation luminance alone (no target size, no summation term), so applied to a person-sized target it over-penalises dim light. Derived: with the code below, a 0.5 m person of contrast 0.5 under clear starlight (1.3e−4 cd/m², Weber threshold 10.9, scaled 3.9) is seen at 10 m with p = 0.003, where the earlier engine gives 1.0. Add a size term from a source before enabling it.
Today: line 27 `if (distance >= visibility) return { detect: 0, recognize: 0, identify: 0, cycles: 0 };`. Derived: a 0.5 m target at 1,999 m with visibility 2,000 m gives `detect` 0.25; at 2,000 m it gives 0.
Change:
```ts
// vision.ts — replaces lines 25–32
const KOSCH = 3.912;                                          // ln(1/0.02), Koschmieder; WMO visibility definition
const tviLog = (La: number) => {                              // Ward Larson, Rushmeier & Piatko 1997, Table 1
  const l = Math.log10(La);
  return l < -3.94 ? -2.86 : l < -1.44 ? (0.405 * l + 1.6) ** 2.18 - 2.86 : l < -0.0184 ? l - 0.395
       : l < 1.9 ? (0.249 * l + 0.65) ** 2.7 - 0.72 : l - 1.255; };   // log10 of the just-noticeable ΔL, cd/m²
export function see({ size = 0.5, distance = 10, La = 1000, C0 = 0.5, adaptLa = La, visibility = 20000, acuityFactor = 1, seconds = 1 }) {
  const C = Math.abs(C0) * Math.exp(-KOSCH * distance / visibility);        // apparent contrast
  const thr = k('contrastScale') * 10 ** tviLog(adaptLa) / La;              // threshold contrast
  const gate = ttpf(C / thr);
  const cycles = Math.max(0, acuity(La)) * acuityFactor * (Math.atan(size / Math.max(0.1, distance)) * 180 / Math.PI);
  const per = (n50: number) => { const p = ttpf(cycles / n50) * gate; return 1 - (1 - p) ** Math.max(1, Math.round(seconds * k('fixationsPerS'))); };
  …
}
```
`contrastScale` is a registered `fitted` constant: 0.02 ÷ 0.0556 = 0.36 (derived), so a black target on the horizon sky in daylight reaches p = 0.5 at d = V.
Basis: *published* (Koschmieder 2 % in the file's own comment, TVI table read from the paper). The product of resolution and contrast terms is [ASSUMED]; the alternative is their minimum.
Check (derived): TVI Weber threshold is 0.056 at ≥ 100 cd/m², 0.107 at 10, 0.39 at 1, 0.40 at 0.1, 0.55 at 0.01, 1.84 at 0.001 and 13.8 at 0.0001 cd/m². Unscaled, a black target is lost at 0.739 V; with `contrastScale` 0.36 it is lost at 1.000 V. Probabilities fall smoothly through V instead of 0.25 → 0.

**E08 · vision.ts:3–7, 11, 26 · scene luminance in cd/m², not lux presets**
Today: `LIGHT` (lines 5–7) maps names to lux; `acuity` (line 11) converts with `lux * 0.2 / Math.PI`, a fixed reflectance ρ = 0.2 [ASSUMED] (lines 3–4).
Change: `see` takes `La` in cd/m². The caller computes `La = E · ρ_scene / π` with ρ_scene from a table of surfaces (snow, grass, soil, stone, foliage, interior wall) [ASSUMED: replace with measured albedos from a spectral library before use]; `acuity(La)` drops the internal conversion. Keep `LIGHT` as the set of test inputs. Grep `acuity(` and `LIGHT[` for callers (rules-tools.ts:1494, body-engine.ts:1168).
Basis: *published* (Ward Larson et al. acuity equation, vision.ts:8–11, confirmed in the paper).
Check: `acuity` gives 49 c/deg at 10³ cd/m² and 2.6 at 10^−3.3 (the file's own check, lines 9–10).

**E09 · vision.ts:15–18, 28–31 · time on target**
Today: one uniform draw per `look` (body-engine.ts:1169).
Change: the `seconds` argument above sets `n` glances = `seconds × fixationsPerS` (3 per second, Rayner 1998 [ASSUMED: recalled]); independence between glances is [ASSUMED] (a stationary peripheral target repeats its p; cap `n` at 10 for a still target).
Check (derived): p = 0.2 per glance over 10 s gives 0.9988 with n = 30; one call today gives 0.2.

**E10 · types.ts:98, body-engine.ts:1162–1173, advance() at 272 · dark adaptation state**
Today: no adaptation state; viewers see a dark room at full sensitivity at once.
Change: `Person.adapt = { La: number }`: the luminance the eye is adapted to. In `advance()` it falls toward the scene luminance along a dark-adaptation curve: rod–cone break at 5–8 min, floor 10⁻⁵ cd/m² at about 40 min (*published*, Webvision). The cone-plateau level at the break is [ASSUMED] (register it, range from the TVI table). `look()` passes `adaptLa` to `see` (E07); `thr = 10^tviLog(adaptLa) / La` makes a character who walks from a lit room into a moonlit yard blind for minutes.
Basis: *published* for the two time anchors; curve shape between them [ASSUMED] (log-linear).
Check: after 0 min in the dark following 1 000 cd/m², the Weber threshold equals that of 1 000 cd/m² (0.056); after 40 min it equals that of 10⁻⁵ cd/m².

**E11 · body-engine.ts:1162–1173 · viewer age and glance count in `look`**
Today: `look(vs, v, { size_m, distance_m, light, lightLabel, visibility_m }, rng)` ignores `v.age`; one draw `u` decides all three levels (line 1169).
Change: pass `seconds` (default 2) and a viewer-age acuity factor into `see`; acuity factor 1.0 up to age 54 (*published*: better-eye acuity −0.18 ± 0.05 logMAR with no change from 25 to 54; ETDRS 2000 charts, 200 people aged 25–74) and a decline from a break point at 55–59 (*published*; the size of the decline per decade was not in the abstract: read the full text before coding, factor [ASSUMED] until then). Keep the single `u` per glance so identified ⊂ recognised ⊂ detected.

**E12 · rules-tools.ts:1473, 1475, 1493–1494 · narrator inputs become derived inputs**
Today: `light` is a four-value enum (line 1473) and `visibility_m` defaults to `20000` (line 1494); the narrator's "fog 500" overrides physics.
Change: `La` = sky (E03–E06) + `Room` emitters (E14) summed in luminance. `visibility_m` defaults to a value derived from the hour's `dewH`, `humH`, `precipH` (E01) and falls to the narrator's number only for local phenomena (smoke from `Room`, dust). Add `background` (enum: sky, foliage, ground, snow, wall, dark interior) and `dress` (dark, mid, light, bright) to the schema; a lookup gives `C0`. Derivation of visibility from dew point and humidity needs a published parameterisation: read Kunkel 1984 (fog extinction vs liquid water) and Gultepe 2006 before coding [ASSUMED: names recalled].
Basis: *published* that the archive API has no visibility; *derived* from the code for the defaults.
Check: a clear day (ERA5 `humH` 45 %, T−Td 10 K) returns ≥ 20 km; a day with T−Td ≤ 1 K and wind < 2 m/s returns ≤ 1 km.

**E13 · rules-tools.ts:737, 869, 897; body-engine.ts:911 · `lit` booleans become draws**
Today: BodyStrike `lit` (line 737), Communicate `lit` (line 869) and `const sees = a.lit !== false && dir !== 'back' && eyes.some(eyeSees);` (body-engine.ts:911). The narrator states whether there is light.
Change: replace `a.lit !== false` with a draw `rng() < see({ size: attacker breadth, distance: dist, La, C0 }).detect`. For gestures, test the hands (0.1 m) at the conversation distance. Time to detect is the minimum of the glance sequence (E09).
Check: at 30 m in moonlight (La ≈ 0.017 cd/m²), a dark-clothed attacker is detected at p < 0.5; at 1 m p ≈ 1.

**E14 · rules-tools.ts:1893–1898; vision.ts · light from the fuel a `Room` already burns**
Today: `Room.fires` carries `kg_per_hour` and a heating value (line 1893: `lhv: heatingValue(...)`) and feeds heat, CO and smoke; no light.
Change: each fire and lamp gets an intensity in candela = radiant power × luminous efficacy × 1/(4π). Illuminance at a point = `I cosθ / d²`. A visible emitter is a high-contrast target with `C0 = (L_t − L_b)/L_b`; point sources use the point-source threshold of Crumey 2014, Eq. 53: `ΔI = F (6.505e−4 B^¼ − 8.461e−4 B^½)²` lx, valid for 10⁻⁵ ≤ B ≤ 3.4×10⁻² cd/m² (*published*). A candle is 1 cd [ASSUMED: definition-era value]; its burn rate (about 6–7 g/h [ASSUMED]) fixes the lm/W for paraffin and oil; register both.
Check (derived, no extinction / V = 20 km / V = 5 km): a 1 cd flame is seen to 29.5 / 10.5 / 4.7 km when dark-adapted, 16.8 / 7.8 / 3.8 km under starlight, 8.0 / 5.0 / 2.7 km under a full moon overhead. A dark-clothed person at the same distance is lost at tens of metres (E07).

**E15 · body-engine.ts:289, rooms.ts · visibility through smoke**
Today: smoke sets `p.env.smoke` and an inhalation injury (body-engine.ts:289); light is not reduced.
Change: extinction coefficient `K = σ_m · ρ_smoke` with `σ_m` = 8.7 ± 1.1 m²/g for flaming combustion (*published*, NIST fire document abstract); visibility of reflecting objects `V = C / K` with `C` = 3 and for light-emitting signs `C` = 8 [ASSUMED: recalled, Jin 1978]. `ρ_smoke` from the burn rate and the room volume the `Room` tool already holds. Feed `V` into E07.

### B · Sound and hearing

**E16 · acoustics.ts:180, 199–201 · detection as a psychometric curve**
Today: `if (ei + 15 > d) audible = true;` (line 180) and `return { audible: margin > 0, margin: Math.round(margin) };` (line 201). Derived: footsteps (64 dB at 1 m) in a 25 dB room are audible at 450.1 m and inaudible at 454.6 m, a 1 % change in distance.
Change: return `p = Φ(margin / σ)` with `σ` = 3 dB [ASSUMED: width of the detection psychometric function; range 1.5–5; register it]. `Listen` (rules-tools.ts:1462) and `listen()` draw `rng() < p`. `reach()` keeps its `audible` for speech but returns `pAudible` alongside.
Basis: signal-detection theory; the width is [ASSUMED].
Check (derived): p = 0.50 at margin 0, 0.84 at +3 dB, 0.98 at +6 dB, 0.16 at −3 dB.

**E17 · acoustics.ts:27–28; rules-tools.ts:738, 873, 1453 · ambient noise from the sources present**
Today: seven `NOISE` classes; the narrator picks one for `Communicate` (line 873) and `Listen` (line 1453); BodyStrike takes a free `noise_db` (line 738).
Change: noise at a listener = power sum of the engine's sources: people in earshot (each at the Lombard-raised level the file already computes, acoustics.ts:138, capped at +12 dB), wind and rain from the hour's ERA5 values (E01), fires and water from `Room`, and an era-keyed traffic term. Levels for rain, wind and water need published figures [ASSUMED until sourced; register each]. Keep the seven classes as test inputs.
Check: ten equal talkers add 10 dB to one (power sum).

**E18 · body-engine.ts:865, 913–921 · combat hearing uses the masked band rule**
Today: `const HEAR_DB = 25;` (line 865) and `if (awake && audible && level > HEAR_DB) perceive(0, rt('hearing'));` (line 916). The level is the source SPL minus spreading, compared with a flat 25 dB and ignoring background noise.
Change: call `hearSound({ spl, distance, noise: scene noise (E17), shift, deaf })` and draw with E16's `p`. Waking from sleep (lines 917–921, `WAKE_DB = 55`, uniform 1.59–21 s) takes the same masked margin; the wake-time range stays.
Basis: *derived*. At 10 m a 64 dB footstep reads 44 dB: heard under the flat rule in every case. The band rule gives margin +34 dB (25 dB room), +9 (50 dB), −9 (68 dB street) and −16 (75 dB room).
Check: the footstep at 10 m in the 68 dB street has p(hear) < 0.1.

**E19 · body-engine.ts:1152–1157 · age and sex in the threshold shift**
Today: `earOf` returns `shift: bandShift(l.species).map(x => x + one)`; a 70-year-old equals a 20-year-old.
Change: add the median age- and sex-dependent threshold shift per octave band to `shift`. ISO 7029 has the form `H = α (Y − 18)²` dB (Y = age in years, α by frequency and sex). A study of extended frequencies reports the same form with α = 0.021 / 0.024 / 0.029 at 9 / 10 / 11.2 kHz and `H = β (Y − 18)^1.5` with β = 0.24 / 0.32 / 0.36 at 12.5 / 14 / 16 kHz (*published*). The α values for 125 Hz – 8 kHz by sex are in the standard, which I could not read: take them from it before coding.
Check: shift at 4 kHz for a 70-year-old man is larger than at 500 Hz, and zero at 18 years. At 10 kHz the published form gives 11.6 / 42.3 / 92.3 dB at ages 40 / 60 / 80 (derived).

### C · Stimuli the engine itself creates

**E21 · rules-tools.ts:1857–1860; question-pass.ts:27, 34–40 · every character in range perceives an action**
Today: after `actTogether` (line 1853) the code returns the action text and `passSeconds`; whether a bystander hears or sees it depends on the question model naming a `Listen`/`Look` call, limited to `MAX_CALLS = 8` (question-pass.ts:27). The engine knows the pace (`creep`, `walk`, `run`, `sprint`) and the plan positions (`Layout`).
Change: after line 1857, for each tracked person not in `names` with a placed spot, compute `hearSound` for the actors' footsteps (64 dB at 1 m at a walk, `SOUNDS` line 33–34; creep and run offsets [ASSUMED: register]) and `see` for each actor, drawing as in E16 and E09. Store the outcome in `p.heard`/`p.saw` and emit a `[PERCEIVED]` block next to `[DECIDED]`. The question model keeps its role for outcomes it names; the sweep covers the rest.
Check: two characters 10 m apart in a 25 dB room, one walking: the other's p(hear) > 0.99 (derived: margin +34 dB); behind a lath-and-plaster partition (mass 40 kg/m², acoustics.ts:43) p falls by the mass-law loss.

### D · Body

**E22 · body-engine.ts:281–282, 1114, 1136; types.ts:98 · knockout and choke last a drawn time**
Today: `// A knockout lasts until story time passes (its length is OPEN-81).` then `if (minutes > 0 && (p.unconscious === 'knocked out' || p.unconscious === 'choked')) p.unconscious = null;`. Any `PassTime` of one minute wakes the character.
Change: `Person.koUntil` (story minute). Set it at line 1114 and line 1136: `koUntil = now + lognormal(median, σ)` from registered constants `koMinutes` and `chokeRecoverMinutes`. In `advance()`, clear `unconscious` when `p.minute >= p.koUntil`, and report "wakes" as the event that stops `PassTime`.
Basis: no published recovery-time distribution was found for a knockout or a choke (a judo video study measures release time after unconsciousness, mean 5.0 s with symptoms, not recovery). Register `koMinutes` and `chokeRecoverMinutes` as `assumed` with a stated range (KO 0.2–10 min; choke 5–60 s) [ASSUMED]; OPEN-81 stays open until sourced. What a doctor's account supports (WBA convention talk, J H Fleming 2006; secondary): full loss of consciousness is fairly rare in boxing; a blow that stops someone instantly and lets them recover ten minutes later is a "Hollywood myth"; impaired consciousness more likely lasts hours, and full alertness takes a few days. So when the drawn unconscious time ends, set `Person.concussed` (an alertness multiplier below 1 that decays over hours to days [ASSUMED rate]) and apply it through the existing `alertness` use in `BodyCheck` (`checkOdds`, body-engine.ts:1433–1459, where heat stroke, hypothermia and alcohol already act through it).
Check: a 30 s `PassTime` after a KO leaves the character unconscious with probability ≥ 0.5 under the registered median.

**E23 · body-engine.ts:763, 1113 · knockout from head kinematics and a per-person tolerance**
Today: `const KO_MOMENTUM = 158.0;` and `const ko = … r.first.M >= KO_MOMENTUM;`: a fit to 97 KOs in 222 bouts that makes every head hit above 158 a KO and every one below it a miss.
Change, minimal: `Person.koZ` (drawn once, like `gripZ`, types.ts:98); threshold = `158 · exp(σ · koZ)` with `σ` fitted so the pro-punch rate stays 0.743 %. Change, full: linear acceleration `a = F/m_head` and rotational acceleration about the neck pivot from the strike's lever arm and the head's mass (partSize and density already exist, df/combat.ts:43–55); risk from Rowson & Duma 2013, Eq. 2: `CP = 1 / (1 + e^−(−10.2 + 0.0433 a + 0.000873 α − 9.2e−7 a α))`, a in g and α in rad/s² (*published*; fitted to 63,011 helmeted football impacts with 244 concussions after an underreporting adjustment, and 58 reconstructed NFL impacts with 25 concussions). It gives concussion, a larger event than a knockout, so KO = `koFraction × CP` with `koFraction` fitted [fitted].
Check (derived): an Olympic boxer's straight punch to a dummy head (58 ± 13 g and 6 343 ± 1 789 rad/s², Walilko et al. 2005, abstract) gives CP = 7.66 %; at −1 SD 1.14 %, at +1 SD 36.4 %. The engine's 0.743 % KO per landed pro punch is 0.097 of the mean-punch CP, so `koFraction` ≈ 0.10 (the transfer from football to boxing is assumed). CP = 50 % needs 9 716 rad/s² at 50 g, 7 516 at 100 g and 5 041 at 150 g.
Target: 0.743 % KO and 0.153 % skull fracture per landed pro head punch, 70 kg, still reproduced.

**E24 · body-engine.ts:70, 417–434, 436–450 · fall injury by region**
Today: `FALL_ROWS = [[12.0, 0.44], [15.6, 0.56], [19.2, 0.78]]` and `fallBase` give death by height (and ±1 row for soft ground or head first); a surviving feet-first fall can only break a heel (lines 442–449).
Change: height → speed `v = √(2gh)`; stopping distance `d` from posture and ground (`landing()` already does this for the legs, materials.ts:82–87, with `GROUND_GIVE` at line 79); force `F = m g (h + d)/d` shared over the contact regions of the posture (feet, pelvis, spine, head); each region has a fracture/injury load distribution; each exceedance calls `addWound`. Death comes from the existing wound and bleeding model (`checkDeath`, line 482). Region tolerances need published biomechanics data (cadaver and dummy studies; not read in this session) [ASSUMED until sourced; register each with its range].
Target: death 0.44 / 0.56 / 0.78 at 12 / 15.6 / 19.2 m (the code returns exactly these, derived) and odds ×1.05 per year of age (line 418); `FALL_ROWS` moves to `tests/engine.test.mjs`.

**E25 · rules-tools.ts:2002–2009 · fall on the level from bone strength**
Today: `chance = age >= 65 ? 0.10 : age >= 45 ? 0.05 : 0.025` and `part = age >= 75 ? 'hip' : 'wrist'`: steps at 45, 65 and 75.
Change: the fall's impact energy from the centre-of-mass height (about 0.5 · body height [ASSUMED]) and soft-tissue padding at the hip from `Person.bmiZ` (BodySize, types.ts:100) against femoral-neck and distal-radius strength that falls continuously with age and differs by sex. Padding: trochanteric soft-tissue thickness rises 1.7 mm per kg/m² of BMI (R = 0.73; mean 26 mm estimated from BMI against 31 mm on CT; between-person SD about 11 mm), and the force on the femur in a sideways fall is cited at 1.23–5.57 kN (*published*: Ann Biomed Eng 2022, doi 10.1007/s10439-022-02924-1; 47 women with hip fracture, 47 controls), so `bmiZ` sets the padding. Femoral and radial strength by age and sex: no value read; take it from a cadaver-strength study before coding [ASSUMED].
Target: 10 % serious injury at ≥ 65 (Tinetti 2003, cited at lines 1996–1998), ×3.35–4.75 fractures at ≥ 45 vs < 45 (McNamee 1997).

**E26 · body-engine.ts:1389–1391, 1457–1462; rules-tools.ts:277, 285–290, 1705–1723 · the narrator's `share` leaves `BodyCheck`**
Today: `BodyCheck` takes `base_share` and `share` from the narrator as `SHARES` values (enum at line 277; schema lines 1711–1712; required list line 1719; call at line 1722); `combined()` averages them in log-odds (lines 285–290); `checkOdds` sets `chance = base` when the body is intact: `const out = s >= 1 || base === 0 ? alert(base) : alert(normCdf((s - demand) / (s * CAPACITY_CV)), …)` (line 1462). For an unhurt person, the outcome is the narrator's estimate.
Change: a task catalogue `TASKS` whose entries take scene facts, not probabilities: `jump {height_m}`, `lift {kg}`, `carry {kg, m}`, `climb {height_m, hold_size, angle}`, `swim {m, water_c}`, `balance {width_cm, height_m}`, `sneak {distance_m, floor}`, `pick lock {pins, lock quality}`, `craft {steps}`. Each gives `demand` in physical units; `capacity` comes from the person's traits (`gripZ`, `fitZ`, `runZ`, `bmiZ`, mass, height, age; new `skillZ` for trained tasks). `p = Φ((capacity − demand) / σ_within)`; the existing `CAPACITY_CV = 0.19` (line 1391; between-person SD of grip) fits the capacity spread, and the within-person trial variation is a new registered constant [ASSUMED 0.05–0.10]. Keep an `other` task whose `demand` the narrator states in the task's physical units. Drop `share` and `base_share` from the schema and the `required` list; keep `combined()` only for tasks not yet in the catalogue and log `source: 'narrator'` for those, so Score 1 is a count.
Basis: *derived* from the code; the physical models for each task family need their own sources (grip endurance, `holdLoad` at body-engine.ts:1187–1200, is the template).
Check: `jump {height_m: 0.5}` for a 35-year-old man of 75 kg has p between 0.1 and 0.9 and moves with `fitZ`; an unhurt, average man lifting 20 kg has p > 0.99.

**E27 · types.ts:98, body-engine.ts:272–345, 1419–1473 · pain as stored state**
Today: no pain variable; `pain` appears in comments and as a venom kind (lines 40, 733, 740).
Change: `Person.pain` (0–10) = sum over open wounds of a severity term by wound type, part and depth, decaying with the healing tables already in the file (`CUT_HEAL`, `BURN_HEAL`, lines 61–64). Effects: capacity × `(1 − γ · pain)` for tasks using the injured region (`uses`), a guarding/vocalisation line in `status()`, a heart-rate rise through Pulse's pain stimulus if it exists there [ASSUMED: check the Pulse action list]. Mapping from wound type to pain rating needs a published source (not read) [ASSUMED]. `pain` is the cue strength for E34.

**E28 · rules-tools.ts:1415–1434; thinking.ts:20–26; types.ts:98 · reasoning ability as a trait**
Today: `share` (line 1420; required at line 1422) is the narrator's percentile against students; line 1429 `z = Math.log(base / (1 - base)) + logit(clamp01(shareOf(a.share)))`.
Change: `Person.gZ` drawn once at creation, correlated with occupation (from `NewCharacter`) and shifted with age (processing speed already uses Der & Deary, body-engine.ts:856); `z = logit(base) + a · gZ`, `a` = IRT discrimination [ASSUMED 1.0–1.7], with an offset fitted so the mean over N(0,1) equals `base`. Drop `share`.
Check: the population-mean solve rate equals `base` to ±0.005 for 10⁵ draws.
Note: `solveShare` (thinking.ts:20–26) is the share of *university students* who solve a problem of that kind within `seconds` (Bowden & Jung-Beeman 2003; Webb et al. 2016). Take the `gZ` offset against that reference group, so a student-like `gZ` distribution reproduces `solveShare`, and the rest shift from it [ASSUMED: students lie about +1 SD above the population mean in general ability].

**E29 · rules-tools.ts:1253–1300 (1277–1279) · `Claim` base rates from the engine's tables**
Today: `base_share` and `share` come from the narrator (lines 1277–1278).
Change: a claim about an occupation takes its base rate from the census table the engine holds (`findOccupation`, rules-tools.ts:1665); a claim about an item from the possessions record; an ability from the trait distributions. The narrator's number remains only as a stated story-specific adjustment [ASSUMED]. Not read in full: the `path` argument (line 1279) needs the same treatment.

### E · Emotion, traits, memory

**E30 · rules-tools.ts:948–970; emotion.ts:37–49; types.ts:98 · affect persists and decays**
Today: `Appraise` returns text only (`a => run(() => { … })`, no state is read or written); `LASTS_H` gives durations (emotion.ts:37–41) that only become words (`lastsWords`, line 52).
Change: `Person.affect = { valence, arousal, t }`. `Appraise` adds the appraisal's intensity (E31); between turns `advance()` decays it exponentially with `τ = LASTS_H[type] / ln(I0/θ)`, `θ = 0.1 · I0` [ASSUMED]; `LASTS_H` is a median time to return to baseline (Verduyn & Lavrijsen 2015, as cited in the file). Consumers: E26 (arousal), E36 (cues), `Communicate` effort (the `feeling` enum at rules-tools.ts:872 becomes `p.affect`), and a `[AFFECT]` line for the narrator.
Check: fear at I0 = 1 with `LASTS_H` 4 h reaches 0.1 after 4 h and 0.37 after 1.74 h (τ = 4 / ln 10 = 1.74 h, derived).

**E31 · rules-tools.ts:952–958; emotion.ts:9–30, 59 · OCC variables become numbers**
Today: `matters` has three levels (emotion.ts:59, [3 levels ASSUMED]); the intensity variables exist as strings in `TYPES[...].stronger`.
Change: arguments `desirability`, `likelihood`, `deservingness`, `effort`, `unexpectedness`, `praiseworthiness`, `familiarity` on 0–1 as each type's `stronger` string names them; code computes intensity (the form of the combination is [ASSUMED]: mean of the named variables) and maps quantiles to the word lists.

**E32 · acts.ts:10–31; types.ts:98 · trait states follow a process**
Today: `stateShare` returns a share of waking hours in a state band, and each call draws independently; the same character flips between irritable and calm turn to turn.
Change: `Person.state[trait]` evolves as AR(1) with stationary mean `m + z · between` and SD `within` (STATES, lines 10–14); the hourly autocorrelation is [ASSUMED 0.5] (Fleeson 2001 as cited reports spread, not autocorrelation). The tool reads the current state.

**E33 · knowledge.ts:76–82 · importance and rehearsal enter forgetting**
Today: line 81 `draw(...) < (f.kind === 'knowledge' ? knowledgeShare(years) : recallShare(years, …))`; `f.imp` (1–10, rules-tools.ts:1246) only ranks facts for display (line 107). `recallShare` is fitted to events "a person singled out as notable" (lines 40–41), yet a fact with importance 1 ("brushing teeth", rules-tools.ts:1238) takes the same curve.
Change: `years_eff = years / (1 + 0.25 · (imp − 5))` for events [ASSUMED: form and slope; register], with the existing restart on re-learning (line 27) as rehearsal.

### F · Social

**E34 · social.ts:48; rules-tools.ts:1535–1539 · obedience from the cues the engine holds**
Today: `OBEY[a.order]` with `order` chosen by the narrator; `p = obeyShare(a.order, storyYear(st))`.
Change: `logit p = b0 + b_cue · cue_victim + b_auth · authority + b_peer · peers + b_year · year`. `cue_victim` = the victim's perceived distress: `pain` (E27) through `hearSound` margin and `see` p (E16, E07), so "victim out of sight / same room / must hold" follow from walls, distance and light. `authority` from distance and channel (phone = voice only). Fit the four or five parameters to the seven Milgram conditions (status [fitted]); the Burger 2009 year factor (social.ts:57–65) stays.
Target: 65, 40, 30, 21, 47.5, 10, 92.5 %.

**E35 · social.ts:39–43; rules-tools.ts:1531–1534 · helping as five steps**
Today: `helpChance(others, situation)` from Fischer's g.
Change: `p = p_notice · p_interpret · p_responsibility · p_competent · p_cost` after Latané and Darley's five-step model. `p_notice` comes from `see`/`hearSound` for that bystander; `p_interpret` falls with ambiguity and rises with the victim's visible state; `p_responsibility = 1/(others + 1)` form [ASSUMED]; `p_competent` from training.
Target: 85 % alone; Fischer's g table (social.ts:33–34) within its intervals.

**E36 · social.ts:19–26; rules-tools.ts:1525–1530 · lie judgement from cues**
Today: the listener's belief is the Bond–DePaulo rate plus trait z's.
Change: the speaker's state (E30 arousal; cognitive load from the lie's complexity) generates weak cue values (cue-to-state effect sizes from DePaulo et al. 2003, meta-analysis, not read); the listener integrates cues with a truth bias. A nervous honest speaker then reads as a liar more often.
Target (derived): accuracy = (0.6134 + 0.4755)/2 = 0.5445, the published 54 %.

**E37 · social.ts:54–55; rules-tools.ts:1540 · small requests by cost**
Today: `SMALL_REQUEST_YES = 0.46` with the comment "Weak source [SECONDARY]".
Change: first read the primary paper (Flynn & Lake 2008); then `logit p = b0 − b1 · minutes + b2 · rapport`, with `minutes` from `Act` timing (questionnaire 5–10 min, phone call, escort), fitted to its three requests [fitted].

**E38 · social.ts:71; rules-tools.ts:1558–1562 · ultimatum responses from inequity aversion**
Today: `REFUSE_SPLIT = { low: 25 / 79, other: 29 / 467 }`, two buckets split at 20 %.
Change:
```ts
// social.ts — replaces line 71. Fehr & Schmidt 1999, Table III.
const ALPHA: [number, number][] = [[0, 0.30], [0.5, 0.30], [1, 0.30], [4, 0.10]];
export const drawAlpha = (u: number, culture = 1) => culture * (ALPHA.find((_, i) => u < ALPHA.slice(0, i + 1).reduce((s, a) => s + a[1], 0)) ?? ALPHA[3])[0];
export const refuses = (alpha: number, offer: number) => alpha > 0 && offer < alpha / (1 + 2 * alpha);   // U = x − α·max(y−x,0) − β·max(x−y,0) < 0
```
`alpha` is drawn once per person (like `credZ`, social.ts:10). `culture` scales α per society and is fitted to Henrich 2005 Table 2 (status [fitted]).
Basis: *published* (Table III read: α 0 / 0.5 / 1 / 4 with 30 / 30 / 30 / 10 %; β 0 / 0.25 / 0.6 with 30 / 30 / 40 %).
Check (derived): acceptance thresholds α/(1+2α) = 0, 0.25, 0.333, 0.444, as printed. With `culture` = 1, a 20 % offer is refused by 70 % and a 40 % offer by 10 %; Henrich's 14 societies give 31.6 % and 6.2 %.

**E39 · social.ts:73–77; rules-tools.ts:1563 · punishment by deviation and cost**
Today: `PUNISH_ONCE = 1 − (1 − 0.843)^(1/6)`, flagged "[ASSUMED: rounds independent]".
Change: P(punish) rises with the cheater's shortfall below the group mean and falls with the cost ratio; Fehr & Gächter 2002 report 74.2 % of punishments fell on below-average contributors. Read the paper's per-round data before fitting (not read).
Target: 84.3 % at least once in six rounds.

**E40 · social.ts:82–84; rules-tools.ts:1541–1547 · first-meeting interest from the two people**
Today: `interestChance` returns 0.5, or 1/3 for women among 15+.
Change: add the partner's age, height and `bmiZ` (all held in `Person`) and the age gap as predictors, with coefficients from Fisman et al. 2006 (regression tables not read).
Target: 0.50 and 1/3.

**E41 · social.ts:88–106, 108–118; rules-tools.ts:1548–1557 · stranger requests by cost, reason and dress**
Today: `ORDER_OBEYED = [0.36, 0.33, 0.20]` and the 2 × 3 `GIVE_WAY` table are looked up by narrator-chosen enums; the dress effect is already a log-odds term (`REQUESTER_SHIFT`, lines 94, 99–102).
Change: extend that pattern: `logit p = b0 + b_cost · seconds_asked/seconds_own + b_reason · reason + REQUESTER_SHIFT`, with `seconds` from the `Act` clock. Fit the nine Bickman and Langer cells (status [fitted]).
Target: Bickman 36 / 33 / 20 % and 30.1 / 47.3 / 77.2 % by dress; Langer's six cells.

**E42 · rules-tools.ts:1213–1227 · `Choose` from option attributes**
Today: each option carries `share` ("how many people in their place would take it", line 1219) and `u = rng() * total` draws on those weights. The narrator's belief about the population sets the character's choice.
Change: each option carries attributes that engine tools compute: fight = `BodyStrike` race win probability and expected wound cost; flee = `Chase` catch probability; bargain/trust = `trustAgain`. Utility `U_i = Σ w_k · attribute_k` with per-person weights (risk, loyalty, anger from `affect`) plus Gumbel noise (McFadden 1974, cited at line 1214). Weights are [ASSUMED] until fitted to a published choice study.
Check: with equal utilities, shares are equal; raising one option's success probability raises its choice rate.

**E43 · rules-tools.ts:1399, 1525–1530, 1568–1587 · trust updates from engine events**
Today: `Trust` records a betrayal only when the narrator calls it with an event.
Change: call the same record from `Transfer` (an unpaid loan, a theft), from `judgeStatement` when a lie is exposed, and from `Claim` failures. The Schweitzer curve (social.ts:126–133) is unchanged.

### G · World

**E44 · work.ts:42, 58 · preferred gait from leg length**
Today: `GAIT` by decade and sex (line 42); line 58 `GAIT[...][Math.max(0, Math.min(6, Math.floor(age / 10) - 2))]`. Height is ignored; speed steps at each tenth birthday.
Change: preferred speed from the file's energetics (`cheapestMs`, line 59) with leg length `0.53 · heightCm` [ASSUMED] and Froude scaling `v = √(Fr · g · L)`, `Fr` = 0.20 [fitted to the `GAIT` table: its mean 1.36 m/s at leg length 0.93 m gives 0.203; 1.3 m/s at 0.89 m gives 0.194], capped where walking turns into running at Fr ≈ 0.45–0.5 (*published*: 0.45 and 1.98 m/s at leg length 0.89 m, J Exp Biol 200:821). Keep `GAIT` as the target (the file already notes agreement within 10 %, line 36).
Check (derived, Fr = 0.20): 1.80 m → L 0.95 m → 1.37 m/s; 1.60 m → L 0.85 m → 1.29 m/s (+5.7 % for the taller walker); at Fr 0.45 and L 0.89 m the transition speed is 1.98 m/s, as published.

**E45 · weather.ts:57, 146; reanalysis.ts:98 · cloud for generated days**
Today: the WGEN branch stores `radLy` (weather.ts:57); the 20CRv3 branch stores `radLy: NaN` (weather.ts:146, reanalysis.ts:98). No cloud field exists.
Change: for WGEN days, `kt = radLy / clearSkyRadLy(lat, day)` and `N = 8 · ((1 − kt)/0.75)^(1/3.4)` (the inverse of E04's formula); for 20CRv3 days NOAA's daily service offers no cloud or radiation variable (checked: its 20CRv3 list has temperatures, winds, humidity, pressure, precipitable water and precipitation rate only), so those days and the WMO-normals generator take `kt` 0.89 on a dry day and 0.55 on a wet day, fitted here to the dry-day and wet-day radiation of the 28 WGEN stations ÷ Haurwitz clear sky (station means 0.78–1.02 and 0.41–0.75). Feeds E04. Status: in the patch.

**E46 · sickness.ts:15–18 · sea-sickness from motion dose**
Today: `seaShare` returns 0.120 / 0.050 / 0.088 / 0.070 by age and sex.
Change: dose `MSDVz = (∫ aw(t)² dt)^½ = aw,rms · √T` (ISO 2631-1:1997, vertical acceleration weighted with the Wf filter) from wave acceleration at the crossing, incidence `MSI = Km · MSDVz` percent with Km = 1/3 for a mixed population (*published*: Souman et al., Vibration 2022, 5(4), summarising ISO 2631-1); the weighted wave acceleration for a sea state needs its own source [ASSUMED]; individual susceptibility `z` shifts by sex and age. Keep Lawther & Griffin's rates as targets. `APFEL` (line 22) is already input-level.
Check (derived): aw,rms 0.3 m/s² for 2 h gives MSDVz 25.5 and 8.5 %; 7 % over 2 h needs 0.247 m/s².
Target: 7.0 % overall; 5.0 / 8.8 % by sex; 12.0 % under 15.

**E47 · rules-tools.ts:1626–1703 · who is present at an hour**
Today: `NewCharacter` draws sex, age and occupation from census marginals (England and Wales 1881 within ±40 years, line 1660; population tables elsewhere) with no hour or place type.
Change: weight the draw by the share of each age-sex-occupation group present at a place type at that hour, from time-use diaries (HETUS/ATUS for the modern era; no historical diaries were checked) [ASSUMED: design only].

### H · Characters at creation (from the files opened in the second pass)

**E48 · names.ts:11–19; rules-tools.ts:1087–1092, 1654–1656 · first names for every country and year**
Today: `NameCharacter` is offered "in an American setting" and `drawName` returns null outside births 1910–2029 (names.ts:14); `GIVEN_NAMES` (SSA 1880–2008) only sets the sex of a named character (rules-tools.ts:1654–1656). A character in England in 1881 is named by the narrator.
Change: a name table by country, sex and birth decade; draw sex first (`NewCharacter`), then the name from the table for that sex, country and birth year (story year − age), and hand the name to the narrator. For England and Wales the 1881 enumerators' books are the natural source, since the census data the engine already holds comes from them (Vision of Britain credits their transcription by the Genealogical Society of Utah and processing by the History Data Service). No given-name frequency table for that census was read (a search returned surname pages only): availability [ASSUMED].
Check: 10 000 English births of 1850 reproduce the table's top-five shares within sampling error.

**E49 · census.ts:15–19, 51–56; rules-tools.ts:1626–1703 · age within a trade**
Today: census.ts:16 states "Age does not depend on occupation [ASSUMED: no age column]". `drawBasics` draws the age band by sex (line 52) and the occupation by sex (line 56), or for a stated occupation draws the band from age 15 up (lines 51–53). A drawn innkeeper is as likely to be 16 as 50.
Change: draw age from the age mix of the trade. The table the engine holds (Vision of Britain, Table 10: occupations by sex and registration county) has no age column, as read. An occupation-by-age table needs the individual-level 1881 data behind it (editors Schurer and Woollard); whether that cross-tabulation can ship with the extension was not checked. Until then, keep the draw and mark each drawn age as "census age mix, not the trade's" in the tool result.
Check: the drawn counts reproduce the `AGES` margin and the `OCCUPATIONS` margin of the 1881 tables.

**E50 · body-size.ts:10–11, 36–42; rules-tools.ts:1096–1114 · body size across a life**
Today: `bodySize` draws height around the birth cohort's mean and mass from the country's mean BMI in the story year, for every adult at every age; `BodySize` takes `birth_year` and `year` and has no age term.
Change: add stature loss for adults over 40 (Framingham: men 3.6 cm and women 4.8 cm between 40 and 80, 0.9 and 1.2 cm per decade; *published*, Nutrients 2023) and an age profile of BMI around the country-year mean (no profile read; take it from a national survey that tabulates BMI by age [ASSUMED]). The comment at body-size.ts:10–11 justifies independent height and BMI draws with a correlation between *country* estimates (r = 0.016), which says nothing about people within a country: replace it with a within-country correlation from a cohort survey.
Check (derived): a man of 175.5 cm at 40 stands at 172.8 cm at 70; his `bmiZ` stays the same.

---

## 3. Order of work

1. **Light and hearing** (E01–E09, E16): 10 edits in 5 files. Each has a published formula in hand or read in this session. Add the constants to the registry (`constants.ts`), then run `node tools/fragility-census.mjs`.
2. **Ambient sweep and combat links** (E21, E13, E18): connects the new perception to the defence race that already exists.
3. **State** (E22, E27, E30, E31, E32): adds `koUntil`, `pain`, `affect`, `adapt`, `state`, `gZ` to `Person` (types.ts:98).
4. **Narrator-number removal** (E26, E28, E29, E42): reduces the `share` schema; log the source of every outcome.
5. **Social models** (E34–E41), then **body regions** (E23–E25), then **characters at creation** (E48–E50: names, age within a trade, body size across a life), then the rest.

Each edit finishes with the three steps in `AGENTS.md`: `npm test`, one test per reconstruction target in `tests/engine.test.mjs`, and an entry in `docs/progress.md`.

## 4. What was opened, and how the lines were checked

**Line checks.** A script compared 195 line citations and quoted code strings with the source files. Ten flagged a needle I had worded differently from the code; I opened each. Two led to corrections in this file (E26 now names the `SHARES` enum at line 277; E30 now starts at the `Appraise` tool, line 948). The other eight were my wording, and the cited line was right. The 28 citations of E48–E50 and the changed text of E22 and E28 passed on the first run. Derived numbers (vision, sky, moon, hearing, falls, concussion risk, walking speed, sea-sickness dose) come from `scratchpad/checks/*.mjs` and `derive2.mjs`; the first group imports the compiled engine and changes nothing in it.

**Read in full with a file reader:** acoustics, actions, acts, body-engine, clock, emotion, hearing, knowledge, map, pigment, reanalysis, rooms, rules-tools, sky, social, strength, structure, substance, vapour, vision, weather, work.

**Printed whole in the shell (second pass):** body-size, census, constants, names, thinking, sizes, things, world, scene-people, body-sheet, and the first 81 lines of possessions; rules-tools lines 1076–1132 and 1626–1703.

**Opened in the shell, whole or in part (first pass):** battle, df/combat, disease, drugs, intelligibility, materials, pulse, question-pass (lines 1–140), sickness, types, venom, waterborne, thermal/exposure, thermal/endotherm.

**Header and exported functions only:** population, prices, chem, colex, counterfactual, history, languages, router, frame, rules-audit, eval-scenes, plan-schema, tool-schema, narration, invariants, dice, turn, world-log, thermal/altitude, thermal/ensembles, thermal/jos3, df/raws, df/sublocations, df/index.

**Not opened:** audit-flags, eval, kinds, retry, roman, sillytavern.d.ts, and the data files in `data/` (only their sizes were listed).

**Edits that lean on files opened only in part:** E29 (`possessions` after line 81; the `Claim` `path` argument), E40 and E47 (`population.ts`, headers and exports only), E48 (`data/given-names`, `data/us-names`). Read those before coding the four edits.

**Kept as input-level (no edit):** the acoustic propagation chain and SII (acoustics.ts:57–187), Lombard (acoustics.ts:132–138), the defence race (body-engine.ts:842–929), reaction time (body-engine.ts:854–862), JOS-3 exposure, QMRA water (waterborne.ts), venom dose (venom.ts), Pulse doses (drugs.ts), material breaking (materials.ts), Apfel nausea risk (sickness.ts:22, 32–33), the stranger draws by country (`strangerAgeSex`, `strangerWork`, `strangerHousehold` in population.ts), body-size draws from cohort and country data (body-size.ts, apart from E50), person sizes from ANSUR II (sizes.ts), and price and wage series (prices.ts). Battle bands (battle.ts:10–13) and cause-of-death shares (disease.ts:57–65) stay as sourced population statistics; they describe groups, not what one person perceives.

**Open items that need a source before coding:** age-related acuity decline after 55 (E11), ISO 7029 α values for 125 Hz–8 kHz (E19), knockout and choke recovery times (E22), femoral and radial strength by age and sex (E25), cue effect sizes of DePaulo et al. 2003 (E36), Fisman et al. 2006 coefficients (E40), Fehr and Gächter 2002 per-round data (E39), BMI by age (E50), given-name frequencies outside the US (E48), occupation-by-age data for 1881 (E49), fog and visibility from dew point and humidity (E12), noise levels for rain, wind and water (E17).

## 5. The full pass through the uploaded sources (third pass)

Skipped by your rule: sources whose values in the code were already confirmed (marked CHECKED, from this and the earlier passes) and files that are part of another upload (SUBSET). Everything else was read for a number the engine could take. Scans were read by OCR (Johnson, Russell, Convertino, Hajnal, Tobler's figure) and, where OCR was unsure, from the page image (Hajnal's Bulgaria row, Verduyn's Fig. 1).

### New rules

| Edit | What the engine does now | Source (read here) | Check |
|---|---|---|---|
| E51 | blood alcohol from the drinker's own body water (sex, age, height, mass), not 0.68 of mass | Watson et al. 1980, Am J Clin Nutr 33:27 | 14 g: man 40 y 175 cm 70 kg 0.0273 %, woman 162.6 cm 60 kg 0.0372 % |
| E52 | alertness by the hour as well as hours awake (three-process model); [BODY] gives felt sleepiness (KSS); Dawson & Reid's points kept | Borbély 2016 (structure); Ingre et al. 2014, PLoS ONE 9:e108679 (parameters, web) | 0.05 % at 17 h/01:00, 0.10 % at 24 h/08:00, 0 at 17 h/15:00 |
| E53 | a food deficit takes mass: glycogen with its water, then fat and lean (Forbes's share) at Hall's energy densities; eating gives it back | Hall 2010 Table 1; Hall et al. 2011; Hall 2008 and Jackson 2002 (web) | 2,090 kcal → 1.85 kg; 14,000 kcal → 3–5 kg from 70 kg |
| E54 | each encounter with a fact adds to keeping it (ACT-R base level, d = 0.5); same-day repeats count once | Anderson et al. 2004, Psychol Rev 111:1036 | spaced beats the last encounter alone by more than 0.2 |
| E55 | a list heard once is kept to the listener's span (2–6, about 4): first and last items; the speaker keeps it whole | Cowan 2001, Behav Brain Sci 24:87 | 8 errands, span 4 → 4 kept |
| E56 | WorkOut: remembering to do what one meant to, 73 % with the cue in front, 18 % without | Scullin et al. 2010 in Byrne, Learning and Memory | 60 draws each |
| E57 | SocialResponse: share entrusted to a stranger and share given back, by country | Johnson & Mislin 2011, Tables 2–3 | Sweden 0.74, all 0.502 |
| E58 | SocialResponse: a false detail told after an event is remembered as seen 47 % (all once the event is forgotten); a made-up past event takes hold 30 % | Loftus 2005, Learn Mem 12:361 | 40 fresh, 40 after 20 years |
| E59 | SocialResponse: whether a person of the scene's country condemns an act outright (19 acts); PlaceProfile adds trust and religion shares | WVS wave 7 v6.0 (computed here, 66 countries) | Brazil 2020 stealing 87 %; refused before 2000 |
| E60 | traits drawn around the mean of the character's sex and age; country left out | IPIP-NEO-300 (117,275 adults, computed here); IPIP-FFM (1,015,341 records); Kajonius & Mac Giolla 2017 | woman 60 vs man 21: agreeableness +1.0 SD |
| E61 | homicide before the national series, Europe from the 13th century | Eisner 2003, Tables 1–2 | England 1550 7, France 1450 41 |
| E62 | survival to 1900 with no country table from the pre-industrial schedule | Gurven & Kaplan 2007 Siler fit; Riley (review) | India 1850 l15 0.607 |
| E63 | American BMI from the 1850 man (22.9) to 1975; Danish and Norwegian heights before Clio | Fogel 2010, NBER w16938 (Floud et al. 2011) | 1850 mean 22.9 |
| E64 | Look under water takes the water's range in place of visibility | Duntley 1960, eq. 1.29 | 10 m: seen in 15 m water, not in 0.5 m |
| E65 | roman.ts writes PHOIBLE's common marked segments in letters (fortis doubled, long marked vowels doubled whole, apical/laminal/creaky marks dropped) | PHOIBLE 2.0 (3,020 inventories) | coverage 94.7 % → 99.97 % |
| E66 | acclimatization pace 500 m a day (was 457 m from a secondary source) | Luks et al. 2019 (WMS) | — |

Validation added as a test: the engine's JOS-3 takes a nude young man afloat in a calm 10.7 °C sea to 30 °C core in 3.2 h; Tikuisis 1997 (Table I) gives 3.2 h (rough 6.1 °C: engine 2.0 h, Tikuisis 1.7 h).

Corrected source note: the carbon-monoxide rule's M = 218 is the later Haldane constant; Coburn et al. 1965 took 250 (their DL and Vco agree with the code).

Next, from what this pass found: weight gain beyond the day's need; starvation death set against mass lost (the deficit clock now dies with 16–23 % of a 70 kg man's mass gone, and no upload gives mass lost at death); de Vries's urban shares 1500–1800 and Riley's regional life expectancies (the uploads are a preview and a review); a lineup rule if eyewitness identification matters to your stories (Wixted & Wells has the curve).

### Ledger of every upload

Zips: z1 Selected_by_me_after_all_others, z2 emotion__people__culture, z3 senses__speech__memory__decisions, z4 weather__movement__combat__language__animals, z5 Body, z6 disease_death_population_economy_history. Statuses: USED (drives a new rule or check), CHECKED (numbers in the code agree with the source), IN USE (already wired before this pass), NOT USED (read; reason given), NO DATA, SUBSET, OUT OF SCOPE.

119 sources: NOT USED 55, CHECKED 21, USED 24, IN USE 8, NO DATA 5, OUT OF SCOPE 3, SUBSET 3.

| Zip | Source | Status | What happened |
|---|---|---|---|
| z1 | Stelzer & Tanay 2026, Cell (biology language models) | OUT OF SCOPE | About AI models of biology; nothing for a story engine. |
| z1 | Oxford Handbook of Human Memory, download stub (856764892) | SUBSET | Table of contents of the full handbook below; no chapter text. |
| z1 | Bouton et al. 1999, context change and forgetting | NOT USED | Context-dependent forgetting is described, not measured as a rate; the engine records no place of learning per fact. |
| z1 | Craik & Lockhart 1972, levels of processing | NOT USED | A framework with no numbers; depth of encoding is not an input the engine has. |
| z1 | Marsh & Anderson 2024, inhibition as a cause of forgetting | SUBSET | Chapter 41 of the full Oxford handbook below. |
| z1 | Miller 2021, forgetting review (Neurobiol Learn Mem) | NOT USED | Mechanisms only; no rate the forgetting curves lack. |
| z1 | Murayama et al. 2014, retrieval-induced forgetting meta-analysis | NOT USED | Effect g = 0.35 within a practised category of a lab list; the engine has no category structure for facts. Read and noted. |
| z1 | Abel et al. 2013, sleep, plasticity and memory (Curr Biol) | NOT USED | Qualitative review; no retention number to attach to sleep. |
| z1 | Anderson & Hanslmayr 2014, motivated forgetting | NOT USED | Suppression effects in lab paradigms; no decision in the engine asks a character to suppress a memory. |
| z1 | Wang, Information-Wave-Particle Triality | OUT OF SCOPE | Physics speculation; nothing measurable for the engine. |
| z1 | Oxford Handbook of Human Memory (Kahana & Wagner), full | NOT USED | Searched for constants the memory rules lack (prospective memory, sleep benefit, testing effect): mechanisms and figures, no usable numbers in the text. |
| z1 | The Effects of Stress on Memory (RRJoM) | NOT USED | Narrative review without numbers. |
| z1 | Wixted 2004, psychology and neuroscience of forgetting | NOT USED | Supports the power-law curves already used (Rubin & Wenzel); nothing new to wire. |
| z1 | Wolf 2008, stress hormones and memory | NOT USED | Cortisol effects on consolidation and retrieval, no rate; the engine has no hormone level. |
| z1 | Ryan & Frankland, Active forgetting (Annu Rev Psychol) | NOT USED | Mechanisms; no rate. |
| z1 | MacLeod, interference theory | SUBSET | Chapter 40 of the full Oxford handbook. |
| z1 | Zacks et al. 2007, event perception (nihms185252) | NOT USED | Event-boundary theory; no measured forgetting at boundaries in the text. |
| z1 | Kurby & Zacks 2008, event segmentation (nihms40600) | NOT USED | As above. |
| z1 | Byrne (ed.), Learning and Memory: A Comprehensive Reference | USED | Prospective memory rates (Scullin et al. 2010: 73 % with a focal cue, 18 % without) → WorkOut intention kinds. |
| z1 | Sleep 2026 perspective (zsag146), sleep optimisation | NOT USED | Perspective piece; no numbers. |
| z2 | Dunbar 1993, neocortex, group size and language | NOT USED | Group size about 150; no engine decision counts acquaintances. |
| z2 | Cialdini & Goldstein 2004, social influence | NOT USED | Review without rates in its text. |
| z2 | Bond & Smith 1996, culture and conformity | USED | E71: women's d 1.04 against men's 0.85 and the −0.009 d a year fall with the study's date move the Asch shares. |
| z2 | Fehr & Gächter 2002, altruistic punishment | CHECKED | 84.3 % punished at least once, 74.2 % on below-average contributors: as in social.ts. The Tobit slopes (0.622, −0.149) give amounts, not a chance, without the intercept. |
| z2 | Gross 2015, emotion regulation | NOT USED | Process model; no rates. |
| z2 | Anderson & Bushman 2002, human aggression | NOT USED | General aggression model; no rates to wire. |
| z2 | Fiske, Cuddy & Glick 2007, warmth and competence | NOT USED | Dimensions of first impressions; no decision rates. |
| z2 | Russell 1980, circumplex of affect (scan) | NOT USED | OCR read; word angles confirmed (happy 7.8°, delighted 24.9°, tired 267.7°). Appraise works on OCC types and no decision needs valence and arousal. |
| z2 | Soto 2019, replicability of trait–outcome links | NOT USED | Says trait–outcome links replicate at about 77–87 % of original strength; no link in the engine to rescale. |
| z2 | Verduyn & Lavrijsen 2015, emotion duration | CHECKED | All 27 medians read from the Fig. 1 page image equal EMOTION_HOURS; women 4.42 vs men 4.04 mean log duration as used. |
| z2 | Burger 2009, replicating Milgram | CHECKED | 28/40 vs 33/40 as in social.ts. |
| z2 | Archer 2004, sex differences in aggression | NOT USED | Physical aggression d about .39 (self-report) to .84 (peer report); the sex gap reaches acts through agreeableness (IPIP, 0.49 SD), so adding Archer would count it twice. |
| z2 | Henrich et al. 2005, ultimatum games in 15 societies | CHECKED | Recomputed from Table 2 rows: low offers refused 25/79, others 29/467, as coded. |
| z2 | Kirby et al. 2016, D-PLACE paper | NOT USED | Describes the database; the data are not in the upload (the JSON files beside it are socionics types, below). |
| z2 | Japanese adaptation of the BFI-2 (fpsyg 2022) | NOT USED | Psychometric validation; no norms the engine uses. |
| z2 | Kajonius & Mac Giolla 2017, personality across countries | USED | Its 1.8 % country share is the reason country offsets are left out of the new trait draws. |
| z2 | Scherer 2009, component process model | NOT USED | Theory; no rates. |
| z2 | Coping style mediation study (fpsyg 2017) | NOT USED | Correlations in one student sample; no engine input. |
| z2 | Johnson & Mislin 2011, trust games meta-analysis | USED | Sent 0.502, returned 0.372, and 35 country means → two new SocialResponse situations. |
| z2 | Schwartz, Basic individual values (.doc, two identical copies) | NOT USED | Theory chapter; value priorities are not a character input. The second copy is a duplicate. |
| z2 | IPIP-FFM data, 1,015,341 records (nested zip) | USED | Country means computed and kept in docs/data; country left out of draws (≤ 2 % of variance; intellect follows the English items). |
| z2 | IPIP-NEO-300 respondent file (archive.zip) | USED | Sex and age differences of the five traits (117,275 adults) → personality.ts, used by every trait draw. |
| z2 | WVS wave 7 cross-national file (nested zip) | USED | Never-justifiable shares for 19 acts, trust and religion shares, 66 countries → SocialResponse condemnation and PlaceProfile. |
| z2 | dichotomies/groups/relations/functions/types.json | NOT USED | Socionics (Model A) typology tables, not D-PLACE and not measured data. |
| z3 | Bond & DePaulo 2006, accuracy of deception judgments | CHECKED | 61.34 / 47.55 as coded (earlier pass). |
| z3 | Johnson 1958 criteria (scan) | CHECKED | OCR of Table I: detection about 1, recognition 4.0, identification 6.4 line pairs, as vision.ts. |
| z3 | Tversky & Kahneman 1992, cumulative prospect theory | NOT USED | Parameters read (α = β = 0.88, λ = 2.25, γ = 0.61, δ = 0.69); no engine decision takes stated gambles, and the source gives no choice-noise model to turn values into odds. |
| z3 | Brysbaert & New 2009, SUBTLEX word frequency | NOT USED | The paper, not the frequency lists; mishearing in colex.ts runs on consonant confusions. |
| z3 | Blackwell 1946, contrast thresholds | IN USE | Table III drives vision.ts (earlier pass). |
| z3 | Der & Deary 2006, reaction time by age and sex | CHECKED | Table 1 exact (earlier pass). |
| z3 | French & Steinberg 1947, articulation index | IN USE | The basis of the Speech Intelligibility Index (ANSI S3.5) that acoustics.ts computes. |
| z3 | Loftus 2005, planting misinformation | USED | 47 % misinformation taken in, about 30 % false events → two SocialResponse situations. |
| z3 | Gooskens et al. 2018, mutual intelligibility | CHECKED | Data file already marked as checked on the page images; spot rows agree. |
| z3 | Rubin & Wenzel 1996, one hundred years of forgetting | IN USE | Power-law form of the forgetting curves. |
| z3 | Pearsons et al. 1977, speech levels in noise | CHECKED | Double-read earlier (docs/data). |
| z3 | Wixted & Wells 2017, eyewitness confidence | USED | E76: the lineup's signal-detection form, and the high-confidence cut fitted so that sure picks of the suspect are 97 % right. |
| z3 | Cowan 2001, the magical number 4 | USED | Span about 4 (individuals 2–6) → a list heard once is partly kept (Communicate). |
| z3 | Wickens 2008, multiple resources | NOT USED | No numeric interference values in the text. |
| z3 | Anderson et al. 2004, ACT-R (Psychol Rev) | USED | Base-level learning, d = 0.5 → repetition in forgetting. |
| z3 | Ratcliff & McKoon 2008, diffusion decision model | NOT USED | Reaction times already come from Der & Deary; no decision in the engine trades speed for accuracy. |
| z3 | Steeneken, measurement of speech intelligibility (TNO) | NOT USED | The STI measurement method; the engine computes the Speech Intelligibility Index (ANSI S3.5) and room reverberation, so no number is added. |
| z3 | Falk et al. 2018, Global Preference Survey | NOT USED | Regional means and sex/age slopes read (women −0.17 SD risk taking); no engine decision consumes risk, patience or reciprocity scores, and trust now has its own measured rates. |
| z3 | Duntley 1960, visibility of submerged objects | USED | Same contrast law under water, range of the water → Look water_visibility_m. |
| z4 | Helbing, Farkas & Vicsek 2000, escape panic | USED | E75: the social force model itself (its forces, constants and 1,600 N/m crush pressure) run in code; the calm outflow 0.73 persons/s is the check (engine 0.67). |
| z4 | Levine & Norenzayan 1999, pace of life | CHECKED | 31/31 countries (earlier pass). |
| z4 | Kahneman et al. 2004, Day Reconstruction Method (slides) | USED | E72: the body status names the typical affect at the activity a character is at (Table 1 rows matched by words). |
| z4 | Clodfelter, Warfare and Armed Conflicts (download page) | NO DATA | A download page with unrelated filler text; the book is not in it. |
| z4 | Watson, Watson & Batt 1980, total body water | USED | TBW equations → blood alcohol per drinker. |
| z4 | Cheshire 2010, non-metallic armour (PhD thesis) | NOT USED | Arrow trials against cuir bouilli and glued linen; armour penetration runs on DF material properties and the thesis gives no constant that layer test takes. |
| z4 | Dupuy 1979, Numbers, Predictions and War | IN USE | Already cited by battle.ts. |
| z4 | Lanchester 1916, Aircraft in Warfare | NOT USED | The square law is the model the Battle rule replaces with measured outcomes. |
| z4 | Klingenberg & Spence 1997, insect body size | OUT OF SCOPE | Insect life history. |
| z4 | Valler et al. 2024, ModE-RA | NOT USED | Monthly reanalysis 1421–2008 held as netCDF files, not a browser API; a hosted extract would be needed. |
| z4 | Bohannon & Andrews 2011, walking speed | CHECKED | All 14 means (earlier pass). |
| z4 | Hersbach et al. 2020, ERA5 | IN USE | reanalysis.ts reads ERA5 through Open-Meteo. |
| z4 | Semenov & Barrow, LARS-WG | NOT USED | An alternative weather generator; the engine runs WGEN. |
| z4 | WALS Online (pointer) | NO DATA | One line pointing to wals.info. |
| z4 | Dodds et al. 2014, grip strength | CHECKED | Table 2 means and SDs equal strength.ts. |
| z4 | Slivinski et al. 2019, 20CR v3 | IN USE | reanalysis.ts. |
| z4 | Tobler 1993, hiking function | CHECKED | OCR of Figure II: W = 6 exp(−3.5 |S + 0.05|), as work.ts. |
| z4 | Jäger 2018, ASJP lexical data | NOT USED | Tried earlier for intelligibility between any two languages and not applied (leave-one-out error 11.8 points against Gooskens; docs/progress.md). |
| z4 | PHOIBLE 2.0 (nested zip) | USED | Check of roman.ts against 3,020 inventories: coverage 94.7 % → 99.97 % after the fixes. |
| z5 | Heat risk by gender in China (Sci Total Environ 2024) | NOT USED | County-level exposure risks; no individual rule. |
| z5 | Takahashi et al. 2021, JOS-3 | IN USE | The thermal model; checked against Tikuisis this pass. |
| z5 | Herrmann et al. 2024, Adult Compendium | IN USE | Activity METs. |
| z5 | Injury Severity Score (trauma.org page) | NOT USED | Gives the scoring rule only (sum of squares of the three worst AIS regions); the wound model produces no AIS grades and the page gives no mortality by score. |
| z5 | Baker et al. 1974, ISS (saved journal page, no extension) | NO DATA | A saved landing page marked "PDF only": title and authors, no text. |
| z5 | Convertino et al. 1996, ACSM fluid replacement (scan) | NOT USED | OCR read; drinking advice, while sweat loss comes from JOS-3. |
| z5 | Cheuvront et al., dehydration assessment | CHECKED | Thirst at about 2 % of body mass (1.4 L at 70 kg), as coded. |
| z5 | Van Dongen et al. 2003, cumulative wakefulness | CHECKED | 15.84 h (earlier pass). |
| z5 | Borbély et al. 2016, two-process model | USED | Structure of the clock rule; its parameters were not in the text, so they came from Ingre et al. 2014 (web). |
| z5 | Tikuisis 1997, survival time at sea | USED | As a check: engine 3.2 h vs 3.2 h (nude, calm, 10.7 °C), now a test. |
| z5 | Gutierrez et al. 2004, hemorrhagic shock | CHECKED | Table 1 classes and signs as coded. |
| z5 | Hester et al. 2011, HumMod | NOT USED | Architecture of a whole-body model; the engine runs Pulse. |
| z5 | Hall 2010, metabolic adaptation | USED | Glycogen 500 g, 2.7 g water/g, 4.18 kcal/g → weight from the deficit. |
| z5 | Coburn, Forster & Kane 1965, COHb | CHECKED | DL and Vco agree; the code's M 218 is the later Haldane constant (Coburn used 250): now noted in the code. |
| z5 | Baird et al. 2020, BioGears | NOT USED | Library description. |
| z5 | Luks et al. 2019, WMS altitude illness guidelines | USED | Safe ascent above 3000 m, 500 m a day: the acclimatization pace now cites it (was 457 m from a secondary source). |
| z5 | Hall et al. 2011, energy imbalance (Lancet) | USED | With Hall 2008 energy densities and Forbes partition → weight change. |
| z5 | Motrycz, physiological effects of a gunshot wound | NOT USED | Describes channel and temporary cavity qualitatively; shots run on DF momentum and layers, and the paper gives no constant they take. |
| z5 | Stewart et al., EOD suit tolerance times | NOT USED | Bomb-suit heat tolerance; JOS-3 with clothing covers heat. |
| z6 | de Vries, European Urbanization (preview) | NO DATA | Preview only: front matter, introduction, bibliography; Table 3.7 (urban shares 1500–1800) is not in it. |
| z6 | Livi-Bacci, Concise History of World Population (download page) | NO DATA | Table of contents then unrelated filler. |
| z6 | Hajnal 1965 (scan) | CHECKED | OCR spot rows agree; OCR misreads Bulgaria 58 as 38, the page image shows 58 as coded. |
| z6 | Clark 2005, English working class 1209–2004 | NOT USED | Table 3 read (building wages in pence by decade 1200–2004); English wages already come from Allen 2001 (1264–1913) and the basket series 1209–2008, and the Price tool prices in silver, which stops after 1913. |
| z6 | Gurven & Kaplan 2007 | CHECKED | Siler Sweden row (earlier pass). |
| z6 | Sundberg & Melander 2013, UCDP GED | NOT USED | Dataset description; the events are not in the upload. |
| z6 | Bolt & van Zanden 2024, Maddison project | NOT USED | Documentation of sources; the series are not in the upload. |
| z6 | HMD methods protocol | NOT USED | How life tables are built; the engine reads finished tables. |
| z6 | Model life tables (Princeton notes) | NOT USED | Coale–Demeny and Brass described; no regional e0 by year to drive them (Riley upload is a review). |
| z6 | GBD 2019 (Lancet) | NOT USED | Cause-by-age tables are in the online appendix, not the upload. |
| z6 | Riley, Rising Life Expectancy (book review) | USED | Its world figure (under 30 in 1800) backs the pre-industrial survival fallback to 1900. |
| z6 | Alfani & Murphy 2017, plague | CHECKED | Spot values (earlier pass). |
| z6 | Klein Goldewijk et al. 2017, HYDE 3.2 | NOT USED | Grids are not in the upload. |
| z6 | Mossong et al. 2008, POLYMOD contacts | CHECKED | Table 1 contacts by age already in disease docs, all 10 bands. |
| z6 | Eisner 2003, historical violence | USED | Tables 1–2 → homicide before the national series. |
| z6 | Turchin et al. 2015, Seshat | NOT USED | Databank description; no data. |
| z6 | Comin & Hobijn 2006 (w12314) | NOT USED | Methods paper behind the CHAT data the engine already reads; its coefficients are productivity regressions. |
| z6 | Fogel 2010 (w16938), The Changing Body | USED | 1850 American man (BMI 22.9) and Table 1 heights → body size before 1975 and Clio. |


## 6. The ten shortcuts that were left (fourth pass)

Each rule reads what the engine already holds about the character or the scene. Every number is marked: *published* (source read, here or in the uploads), [FITTED] (solved here from published values), [ASSUMED] (named, with a range in docs/constants.md). Each has a check in tests/engine.test.mjs (N18–N26) that misses when the rule is reverted (9 of 9).

| Edit | What the engine does now | Source | Check |
|---|---|---|---|
| E67 | Choose options carry a kind; the chooser's traits (Fleeson states), fear (d 0.30 toward safety), anger (d 0.54 men, −0.21 women) and blood alcohol (d 0.61 at 0.08 %) move each share as log odds 1.81 d; fighting and running drop out when the body cannot stand; the answer names what weighed | Wake, Wormwood & Satpute 2020; Ferrer et al. 2017; Bushman & Cooper 1990; Chinn 2000 | an angry man at 0.08 %, fight or talk at 50 % each: about 89 % fight; class III blood loss: fight and flight out of reach |
| E68 | BodyCheck `gap_m`, `run_up_m`: a jump as a projectile from adult vertical-jump norms by sex and age and the person's own top speed; `lift_kg`: lifting capacity floor to waist from the Liberty Mutual tables; the narrator's share is no longer needed for these | Xi'an 2010 norms (ICSSTE 2015); JMNI 24:243; Snook & Ciriello 1991 (Bernard 2022 tables); take-off share 0.75 and full run-up 15 m [ASSUMED] | man 25: 1.96 m standing, 48.7 kg; woman 25: 1.49 m, 25.0 kg; a 1.2 m ditch cleared 10/10, 4 m 0/10 |
| E69 | every alertness task: odds of failing × (1 + minutes on the task ÷ 105) within a spell, reset by 15 min of rest; × 1.275^((hours − 8) ÷ 4) past 8 h worked since sleep | Tucker et al. 2003; Folkard & Lombardi 2006 | factors 1.57 after an hour, 2.73 after 2 h of a 12-hour day |
| E70 | dehydration in tasks: from 1 % of mass lost, odds × e^(1.81 × 0.14); past 2 %, attention × e^(1.81 × 0.52), hand tasks × e^(1.81 × 0.40). Hunger and pain left out as measured nulls (fasted vs fed g = 0.02; induced pain 9 ms on alerting) | Wittbrodt & Millard-Stafford 2018; Bamberg et al. 2025; J Pain Res 12 (2019) | factors 1.29, 2.56, 2.06 |
| E71 | SocialResponse: going along with a group stating something wrong, by majority size (counted from the map), an ally, sex and the study year | Asch 1955, 1956 (as summarised); Bond & Smith 1996 (upload) | 3 against 1 in 1951, a man: 31.8 %; with an ally 5 %; lower by 2000 |
| E72 | the body status names how people typically feel at the activity the character is at (BodyEnvironment `activity`) | Kahneman et al. 2004, Table 1 (upload) | commuting: positive 3.45, impatient 2.60 |
| E73 | food beyond the day's need is kept as a surplus and puts weight on (glycogen first, then Forbes's partition); spending draws on it first | Hall 2008, 2010 | +7,000 kcal → +1.0–1.4 kg; −2,090 kcal → −1.85 kg |
| E74 | starvation kills at a lethal BMI drawn once (men 13, CV 8.7 %; women 11, CV 14 %), or at the deficit clock, whichever comes first | Henry 2001, as summarised by ENN Field Exchange 15 | BMI 12.9 against a lethal 13: dead within 2 min of story time; draw means 13.0 and 11.0 |
| E75 | Room `exit_width_m`, `exit_pace`: everyone in the room leaving through one exit, run as the social force model; time for the last one out, flow, crushed | Helbing, Farkas & Vicsek 2000 (upload); averaging time 1 s, jostle and giving way [ASSUMED] | 100 people, 1 m door: 0.67 a second at 0.8 m/s (paper 0.73), 0 crushed; 5 m/s slower than 1.5 m/s, with people crushed |
| E76 | SocialResponse lineups: a signal-detection model of six faces, criterion and d′ fitted to simultaneous lineups, confidence cut fitted to 97 % accuracy of high-confidence picks; the memory from the witness's Look at the face (made out or not) and faded by the hours since; Look now records who saw whom | Steblay, Dysart & Wells 2011; Wixted & Wells 2017; PeerJ 9:e11828 (forgetting) | 52 % culprit picks, 54 % picks from culprit-absent lineups, high-confidence picks 97 % right, 20 % culprit picks after a week |

Left open: sadness on effortful thinking and fear on attention in Look, Listen and WorkOut (no measured effect size on these tasks was found); crushing at 3–5 m/s may run high; sequential and unfair lineups, other-race faces, weapon focus; take-off speed as a share of running speed (assumed 0.75).


## 7. What the fourth pass left open (fifth pass)

| Edit | What the engine does now | Source | Check |
|---|---|---|---|
| E77 | WorkOut: while the thinker feels fear, the odds of solving a problem × e^(−1.81 × 0.334) = 0.55; the answer says fear weighed. Sadness enters no task | Moran 2016, Psychol Bull 142:831 (g = −0.334, 177 samples, state and trait alike); Valenti, Garcia & Galera 2021 (sad mood, working memory unchanged, n = 27) | odds ratio 0.546 from the logged chances (27.8 % → 17.4 %) |
| E78 | Look keeps the viewer's fear with a sighting of a tracked person; a lineup's d′ × 0.716 for it | Deffenbacher et al. 2004, Law Hum Behav 28:687 (correct IDs −.31, read as Cohen's h [ASSUMED]) | 36.7 % culprit picks |
| E79 | Look `weapon_in_view`: d′ × 0.881 | Steblay 1992, Law Hum Behav 16:413 (lineup ID .13, features .55) | 45.5 % culprit picks |
| E80 | SocialResponse `other_group`: d′ × 0.663 and criterion − 0.17 | Meissner & Brigham 2001, Psychol Public Policy Law 7:3 (hits 1.4×, false alarms 1.56×; applied to lineup rates [ASSUMED]) | 37.1 % culprit picks, 64.7 % picks with the culprit absent |
| E81 | SocialResponse `sequential`: one face at a time, the first past a criterion fitted to 32 % culprit-absent picks | Steblay, Dysart & Wells 2011 | culprit present 40.5 % and 21 % filler picks against 44 % (CI 37–51) and 24 % measured |
| E82 | Room crowds: death by compressive asphyxia, time to death 15 s × (6,227 N ÷ chest force)^1.74, nothing below 623 N; a crowd denser than the model's discs allow is spread back from the exit (it had started overlapping and crushed) | Hopkins, Pountney, Hayes & Sheppard 1993, as given by G. K. Still; floor and chest share [ASSUMED] | 6,227 N → 15 s, 1,112 N → 300 s; 150 people in 30 m² start with no one crushed |

Open: crowd injuries. For Helbing's own case (200 people, 15 × 15 m, 1 m door) the paper's Figure 1c has injuries begin near 5 m/s; here 25 are crushed at 2 m/s and about half at 3 m/s, mostly in the first 4 s as the crowd reaches the exit wall. Without the jostle, without the speed cap, with uncapped friction, with the crush pressure averaged over 5 s, and with a rib-fracture tolerance (2.55–3 kN on the chest) in place of 1,600 N/m, the onset stays at 2–3 m/s. Room's "nervous" (1.5 m/s) and "panic" (5 m/s) paces sit on either side of it. Also open: fear on seeing and hearing (no number found); unfair lineups and exposure time; take-off speed as a share of running speed (elite approach speeds of 9.8–10.9 m/s are published, take-off speeds were not found).


## 8. Persuasion and drowning (sixth pass)

| Edit | What the engine does now | Source | Check |
|---|---|---|---|
| E83 | SocialResponse "asked a bigger favour after a small one for the same cause": yes rates by who asks the second time and when (same at once 34.4 %, another later 43.4 %), OR 1.16 for those spared the first favour and 0.65 for those who refused it; the small favour decided earlier is kept with time and asker and read back | Burger 1999, Pers Soc Psychol Rev 3:303, Tables 4–9 | the cells' rates; a refused small favour read back as "refused" |
| E84 | SocialResponse "asked a small favour right after refusing a large one": yes × 1.58 and done × 1.21 in odds on the small-favour rate, so some agree and leave it undone | Feeley, Anker & Aloe 2012, Commun Monogr 79:316 (verbal r = .126, k = 78; behavioural r = .052, k = 39) | 57.4 % yes, 50.7 % done from 46 % |
| E85 | a drowning person brought out comes through with a sound mind by the time under water (87.7 % to 5.5 min, 18.7 % to 10 [DERIVED], 3.7 % to 25, none after), the rest dead; left in the water, dead at 25 min under; status gives the chance now | ILCOR 2020 drowning CoSTR (Bierens et al.); Quan et al. 2016 | 3 min under: at least 14 of 20 come through; 15 min: at most 3 of 20; alive in the water at 8 min |

Before E85, taking a drowning person out of the water restored breathing at once, whatever the time under, and the general 5-minute apnea clock killed people in the water by about 6 minutes, where the cohorts show 1 in 5 coming through between 5.5 and 10 minutes.

Searched and left open: a per-shot handgun hit rate by distance (police reports give shooting distances and hits per incident, not per shot by distance); an adult breath-hold norm after a normal breath; rates for unfair lineups (Fitzgerald et al. 2013 abstract gives directions only). Crowd onset retried with random start positions: unchanged.


## 9. Logic pass

Every changed file was reread for logic, not numbers: what each rule does with its inputs, in every branch. Each fix keeps the rule and its content; each has a check that fails on the old code (N33–N37 in tests/engine.test.mjs, and its negative control).

| Fix | Where | What was wrong | Now | Check |
|---|---|---|---|---|
| L1 | body-engine.ts, `checkOdds` | `risk = (alert ? A : 1) * (fine \|\| grasp ? T : 1)` parses as `((alert ? A : 1) * (fine \|\| grasp)) ? T : 1`: for a task that needs alertness and no fine or grasp work the product was 0, so risk = 1. Drink, lost sleep, concussion, hours on the task and thirst moved no alertness task | two named factors, multiplied | odds of failing × crashRisk(0.08) at 0.08 %, × 2.14 after 2 h on the task |
| L2 | body-engine.ts, time on task | counted only walking, swimming or the `active` list, and counted those even for a character listed at rest; desk work at its activity MET never counted | any activity at 1.5 MET or more, unless listed at rest or a break by kind | 30 min of office work → 30; 20 min at rest → 0 |
| L3 | body-engine.ts, status | the activity's typical mood was shown while asleep or unconscious | shown only awake and conscious | asleep: no activity line |
| L4 | mood.ts | "running" matched exercising (a flight is not exercise), "service" matched worship | both removed; "jogging", "calisthenics", "vespers", "matins" added | running → none, jogging → exercising |
| L5 | social.ts, `conformShare` | with one person stating it, an ally raised conformity from 2 % to 5 % | an ally gives 5 % at most | ally ≤ no ally |
| L6 | rules-tools.ts, conformity | a counted majority included the ally | the ally is taken off | — (covered by L5's check of the share; the count is one line) |
| L7 | rules-tools.ts, foot in the door | "later day" was 12 hours or more | the next calendar date | 23:00 → 01:00 next day: later; 23:00 → 23:30: same |
| L8 | rules-tools.ts, onlookers and [PERCEIVED] | seeing someone took the light at the onlooker | the light on the one seen | — (no map scene in the tests yet) |
| L9 | rules-tools.ts, Room exit | the crowd's outcome was told, but no tracked person inside was out, crushed or dead | each tracked person takes a place in the crowd at random and gets its end | a tracked person in a 40-strong chapel gets a named end |
| L10 | feats.ts, rules-tools.ts | a child's jump took the 22-year-old norm; the lift used grip z 0 when grip had not been drawn and shifted once it was | a child's jump asks for shares; the grip z is drawn with the feat | 10-year-old: shares asked; lift unchanged after a later grip |

Left open from this read: a child's top running speed is the adult's (Chase and the running jump; no child sprint norm on record); drowning outcomes are the human cohorts' for every creature; the crowd's injury onset (section 7).


## 10. The open items (seventh pass)

| Item | Found | Now |
|---|---|---|
| E86 a child's top speed | boys' peak 100 m speed by age, 117 German schoolboys: 22.55 → 29.70 km/h from 10.9 to 18.2 years (Bleeker & Siener 2025, Front Sports Act Living 7:1701476) | under 18, the 18-year-old's speed × 0.759 (10.9 y) … 1 (18.2 y); girls the same shares [ASSUMED]; below 10.9 extrapolated, held at 3 [ASSUMED]. Check: a 10-year-old under 0.8 of a man's speed (N38) |
| E87 breath held by water temperature | 19, 24, 28, 38 s at 5, 10, 15, 25 °C (Hayward et al. 1984, in Survival in Cold Waters, Transport Canada report); 24.3 s at 11 °C (Barwood et al. 2006); 39.8 s at 25 °C (Cheung et al. 2001) | interpolated by the water's temperature, spread 47 % (N39); before, the 11 °C hold in every water |
| E88 handgun hits by distance | NYPD 2011: shooting distances (1–5 yd 53 %, 6–15 yd 38 %, 16–25 yd 9 %); RAND 2008: 30 % of shots hit when not fired upon, 18 % when fired upon; Dallas 2003–2017: 35 % of 354 rounds (Donner & Popovich 2019). No per-shot rate by distance is published | BodyCheck `shot_m`: angular spread 0.185 rad fitted to 30 % over those distances, target from the shot person's mass, × 0.6 under fire (N40) |
| light on the one seen (L8) | — | test with a fire-lit kitchen and a dark hall joined by an open door (N41) |
| take-off speed share | elite long jumpers: 95–99 % of top speed in the run-up, 10.6 → 8.8 m/s through take-off (Linthorne 2007) → about 0.81 | stays 0.75 [ASSUMED] for untrained jumpers, range now capped at the elite 0.81 |
| fear on seeing and hearing | threat shortened the visual P100 latency in low-anxious people, more at high contrast (Laretzaki et al. 2010, J Psychopharmacol 24:667); no threshold change for ordinary targets found | left out on purpose, as hunger and pain |
| drowning in other creatures | 25 dogs and 3 cats after freshwater submersion: 64 % to discharge, all cats died (Heffner et al. 2008, JAVMA 232:244) | human bands kept, this as the check |
| crowd injury onset | Lakoba, Kaup & Finkelstein 2005: the original contact stiffness gives about 6,000 N for a 5 cm squeeze; their replication put the fastest exit near 3 m/s, not 1.5 | the original parameters kept (they carry the 0.73 calibration); the onset reported as the model's |
| unfair lineups | low-similarity fillers drew far more suspect picks, guilty or innocent (Fitzgerald et al. 2013); rates behind a paywall | open |
| exposure time | longer exposure 0.66 correct against 0.53 (Bornstein et al. 2012), no durations | open (Look has one look) |


## 11. Assumptions a source could settle (eighth pass)

| Edit | What the engine does now | Source | Check |
|---|---|---|---|
| E89 | SocialResponse lie judgments: knowing the speaker before (Communicate on record or `knows_speaker`) +1.8 points right on truths and lies; `expert_listener` −3.4 points believed; `high_stakes` −3.8 points believed | Bond & DePaulo 2006, Pers Soc Psychol Rev 10:214 (baseline exposure 55.91 vs 52.26 % correct; experts 52.28 vs 55.69 % judged truthful; motivated senders 53.43 vs 57.24 %) | the four shifts exactly; the acquaintance recorded (N42) |
| E90 | Look `dressed`, `against`: Weber contrast of reflectances (clothing by Munsell value through ASTM D1535, 3.1 / 19.8 / 78.7 %; grounds 0.15–0.85), the larger of the lit and the shaded side, the shaded side lit by the diffuse share of the light (Erbs et al. 1982: 0.18 in clear sun, about 1 under cloud); `seconds`: one try per 6 s | Page & Lebens via IES VE (ground reflectances); ASTM D1535 (Munsell value); Blackwell 1946 (6 s tries, already used) | grey against woodland 0.03 under cloud, 0.82 in clear sun; dark on the skyline 0.97; 60 s sees farther than a glance (N43) |
| E91 | alertness tasks in heat and cold: d 0.382 (WBGT ≥ 32.22), 0.189 (26.67–32.22), 0.197 (10–18.33 °C), 0.356 (≤ 10 °C) as odds e^(1.81 d); cold bands for people dressed under 1 clo [ASSUMED] | Pilcher, Nadler & Busch 2002, Ergonomics 45:682, Table 2 | each band's factor; warmly dressed in the cold, none (N44) |
| E92 | WorkOut: the students of each norm stand z = (490.742 − 0.192 × year − 100) ÷ 15 above everyone: 0.41 (2003), 0.24 (2016), not 1 | Uttl, Violo & Gibson 2024 (106 samples, 9,902 students) | a character at that z solves at the norm's rate (N45) |
| E93 | indoor daylight 1.5 % of outdoor: now sourced, BS 8206-2's minimum for living rooms (kitchens 2 %, bedrooms 1 %) | BS 8206-2:2008, as quoted in BRE Site Layout Planning for Daylight and Sunlight | — (a relabel) |

Closed: when a side breaks in battle (Clark 1954: losses at the end from about 1 % to nearly 100 % in 43 WWII battalions; doctrine breakpoints have no study behind them). Not reachable this pass: Kitamura et al. 2016 on recovering sleep debt (the page could not be read); glycogen refill rates; footstep levels by gait (none published found).


## 12. Alcohol absorption and swimming (ninth pass)

| Edit | What the engine does now | Source | Check |
|---|---|---|---|
| E94 | a drink goes to the stomach and reaches the blood first-order (k 0.062/min fasted; with a meal k 0.078 and 76 % reaching the blood), then leaves at 0.015 %/h, 0.0175 within the hour after a meal; the status shows what is still to come. Before, blood alcohol rose at once | Jones 1991, J Forensic Sci Soc 31:429 (peak 41 min fasted, 32 min and 25 % lower with a meal) [FITTED]; Jones, Jönsson & Neri 1991, J Forensic Sci 36:376 (77 % peak within 45 min); Jones 2010 (0.015–0.020 %/h fed) | 40 g fasted: nothing at once, peak at 38–55 min; with a meal earlier and 0.75 of the height (N46) |
| E95 | who can swim, on entering water: by sex and region from the World Risk Poll 2019 (world men 57 %, women 32 %; N & W Europe 89 / 85; Australia and New Zealand 90 / 85; Central Asia 79 / 31; Latin America 71 / 33) × 0.56, the US ratio of skills to self-report [ASSUMED]; US 46 % | Gallup 2021 summary of the Lloyd's Register Foundation World Risk Poll; American Red Cross 2014 | the shares; 60 Kenyan women entering water: under 18 swim (N47) |

## 13. The engine itself (system pass)

| Change | What the engine does now | Why | Check |
|---|---|---|---|
| S1 | crowd.ts: each pair of people worked out once, equal and opposite (Newton's third law); a pair more than 0.6 m apart beyond contact left out (repulsion 2000 × e^(−0.6 ÷ 0.08) = 1.1 N against a drive of 80 N or more); walls only for someone within reach; `Math.sqrt` for `Math.hypot`. The 4 ms step stays (`DT_S`): 8 ms halved the time again but moved 200 people at 3 m/s from 101 ± 3 to 105 ± 6 out | 100 people took 1.5–4 s and 200 up to 23 s per run, and a Room call runs up to 13 of them | 6 seeds × 5 crowds, mean ± SD, before → after: 100 at 0.8 m/s flow 0.67 ± 0.02 → 0.64 ± 0.03, none crushed; 1.5 m/s 1.26 ± 0.05 → 1.27 ± 0.06; 5 m/s 41.2 ± 1.3 → 42.0 ± 1.8 out; 200 at 3 m/s 100.7 ± 2.7 → 99.2 ± 6.8; 5 m/s 41.3 ± 2.3 → 42.0 ± 2.3. Time 222 s → 53 s; N25, N30, N37 still pass |
| S2 | the crowd draws from a stream of its own (mulberry32) seeded by one draw of the call (`crowdStream`) | every draw a call makes is kept in the turn's trace and the chat's history: one 100-person exit kept 2,921,066 draws, 56 MB of chat metadata | the same call keeps about 100 draws, 2.5 KB (N48: one draw taken from the call) |
| S3 | a judged value counts as used once it can change the result: `peek()` reads without counting; `reaches(id, x)` counts a threshold only when x lies within its range; the crowd counts its averaging time from the first pressure past 1600 N/m, the four asphyxia values from the first dose that reaches 1 at the shortest time to death over their ranges, the courtesy time from the first person locked 2 s at the door | the reruns varied values that could not change the run (asphyxia in a calm crowd), at the cost of a full crowd run each, and the result listed them | values a run did not count give the identical run at both range ends (N49, and a check over 5 crowds); a calm 100-person exit ran the crowd 7 times, then once; with the jostle and courtesy of S6 registered, 5 (about 3.5 s) |
| S4 | `memo(key, fn)`: a costly result kept with the values it read and their values; given back when they hold, computed afresh when one of them is varied | a rerun that varies another value repeats the same crowd | N50: kept, recomputed on a varied value read, kept on a varied value not read |
| S5 | the odds factors on a BodyCheck in one list, `ODDS_FACTORS` (applies to, multiplier, level at which it is named, name); the chance is their product; a concussion is named as such | the factors were written out three times (applied, named, tested) and had drifted once (L1) | N51 sets up each factor alone and fails for a factor without a set-up; N33 kept |
| S6 | registered with ranges: breath-hold spread 0.47 (0.28–0.6), minutes to double the odds on a task 105 (90–120, fitted to Tucker et al. 2003), dehydration onset 1 % (0.5–2), meal size 200 kcal (100–400), swim-skills share 0.56 (0.4–0.75), a feat's try spread 5 % (3–8), lift-grip correlation 0.6 (0.4–0.8), conformity to one 2 % (0.5–5), crowd jostle 40 N (20–80), courtesy 3 s (2–5); the leg-fracture spread got its range (the 3.8–9 kN span as ±2 to ±1 σ) | the sensitivity reruns and docs/constants.md see only registered values | N53: every judged value carries a range holding its value (99 constants); N54: each new one, at a range end, changes what it feeds |
| S7 | a trade word that names the sex fixes it (maid, maidservant, waitress, serving woman, landlady, -ess forms; potman, watchman, potboy, -man forms) | the census's domestic indoor servants include men, so a maidservant came out a man about one time in twelve; the plan test failed one run in twelve on it | N52: 20 maidservants all women, 20 potmen all men |
| S8 | the tests set `process.exitCode` instead of calling `process.exit()`; the negative controls are in the repository (`tests/negative-controls.json`, `tools/negative-controls.mjs`, `npm run negative-controls`), each test's output read from a file; AGENTS.md lists the control and the registry as check steps | `process.exit()` can cut output still queued for a pipe: in the first full run 4 of 10 controls lost their MISS lines and read as uncaught | 56 of 56 controls caught |
| S9 | the Choose test's bounds at about 4 SD of the measured shares (angry 88.5 %, calm 47.5 % over 400 draws) | the old bounds sat under 3 SD and failed about one run in 170 | N20's control still caught |
| S10 | `Person` has `country` and `fireHeat` | three casts in rules-tools.ts and rooms.ts | tsc, zero errors |

Open: 306 [ASSUMED] tags remain in comments outside the registry (docs/constants.md lists them by file); the crowd's sensitivity reruns are full runs (about 0.7 s each for 100 people).

## 14. Sight verbs and repeatable tests

| Change | What the engine does now | Why | Check |
|---|---|---|---|
| S11 | BodyCheck sends a task to Look when the task's own verb is one of seeing: VerbNet 3.4's perception classes (see-30.1, sight-30.2, peer-30.3), less the other senses' verbs (hear, listen, overhear, eavesdrop; smell, sniff, scent; taste, savor; feel, sense, experience; can tell) and check and attend, plus watch (VerbNet files it under searching and assessing): 35 verbs [ASSUMED lists]. The verb is read where a line puts one, past try and the helpers; only the first counts. The lemmatiser the router used moved to `verbs.ts`, shared by both | a list of nine words (see, spot, notice, recognise, identify, sight…) let watch, observe, glimpse, discern, make out and espy run as 50 % checks on the narrator's share, while the router already sent the same verbs to Look. Meaning is taken as used now, not from roots: discern < cernere "sift"; observe < servare "watch, keep safe", not servire "serve"; watch < wæccan "be awake" (Etymonline) | N55: the six verbs, "watching the road" and "try to glimpse the rider" go to Look; climb, check the lock, smell the stew and "pick the lock and look inside" stay; controls N55 (VerbNet test off) and N55b (any later verb counts) caught |
| S12 | the test harness seeds the chat salt and `Math.random` (mulberry32), so a run counts the same sample each time; `RULES_TEST_SEED=<n>` takes another, `random` a fresh one. Five statistical checks drew larger samples, bounds about 4 SD from the rates measured over 400 draws: breath hold 12 → 80 a temperature (warm 38.9 ± 17.4 s, cold 19.0 ± 8.8 s; with 40, one of 35 samples still fell under the bound); Kenyan women swimming 60 → 120, bound 38 (17.3 %); intentions 60 → 100 (75 %, 17.75 %); misinformation 40 → 100 fresh (46 %); Choose 60 → 100 (angry 88.5 %, calm 47.5 %; over 30 samples of 60, 53.2 ± 2.9 angry, one of them 42) | 4 of 20 runs of `npm test` failed on checks whose bounds sat 2–3 SD from their rates | the same output on repeated runs (identical checksums of the whole output); engine and plan tests 0 misses under 40 other seeds and 5 fresh samples |

## 15. Every route by meaning

| Change | What the engine does now | Why | Check |
|---|---|---|---|
| S13 | BodyCheck reads the task's own verb and sends the task to the tool its meaning names (`verbs.ts`, TASK_ROUTES): hearing → Listen; seeing and searching → Look; swimming → BodyEnvironment; hanging on and carrying (hold-15.1, cling-22.5, carry-11.4 members) → HoldOn; racing on foot (chase-51.6's chase and pursue, flee, outrun, running away) → Chase; deceiving (trick-59.2), courting (court, flirt, woo, seduce) and winning over (lure-59.3, persuade, bribe, threaten) → SocialResponse; taking a fort, town, hill or bridge → Battle; a choke → BodyChoke; shooting, and blows at a creature (hit-18.1, swat-18.2, spank-18.3, poke-19, attack-60.1, murder-42.1, cut-21.1, less tap, rap, bump, saw, scrape, dig) → BodyStrike; treating a wound → BodyTreat. A route's verb read in another sense, or a verb BodyCheck decides itself (climb, jump, lift, pick), keeps the task; with no verb read, the old words still route (noise, afloat, tourniquet, battle), each now in its one sense (a lie told, a shot at, a crossbow bolt, a date as a meeting). Class members chosen by hand where a class also holds other acts (escape-51.1 holds climb and go) [ASSUMED selection] | ten word lists let 43 of 77 phrasings run on the narrator's share and sent 6 to the wrong tool: lie down → a lie, bolt the door and a shot of whisky → a missile, date the letter → a meeting, assault the guard → a battle | N56: 101 phrasings, 0 wrong (77 of the measurement, 24 more: tap the guard on the shoulder, kick the door open, hang the lantern, shoot the rapids, fire the kiln, climb the wall to see over it stay BodyCheck's; fire the musket at the rider, set the broken arm, strangle him, sweet-talk the jailer, stab Ana, Ana kicks the hound, make out what the clerk says go to their tools); controls N56 (meaning off), N56b (a read verb overridden by later words), N56c (any object taken for a creature) caught |
| S14 | the player's own line: looks and blows drafted from the same verb sets ("I glimpse the rider", "I scan the crowd", "I club the sailor", "I knife the smuggler"; "I tap the man on the shoulder" drafts no blow); a trailing preposition leaves the target ("the rider", not "the rider on") | the drafts took 6 looking verbs and 8 blow verbs | frame tests 39 (5 new); controls N57, N57b caught |
| S15 | an activity no word names takes its mood row from its verb's VerbNet class: eating (eat-39.1 to gorge-39.6), preparing food (cooking-45.3), housework (wipe_manner-10.4.1, wipe_instr-10.4.2), socializing (chit_chat-37.6, meet-36.3), relaxing (snooze-40.4) [ASSUMED mapping]; the person and animal words moved to `nouns.ts`, read by the scene's people and by the blows | "devouring a stew" or "scrubbing the floor" had no row, and a break kind (eating, relaxing) did not stop the time on a task | N58; control caught |

Left as is: Act's motion verbs, which the plan schema already holds to a fixed list (a rare verb is refused rather than bent), and the router's own named BodyCheck verbs (climb, jump, lift), which take no synonyms yet (clamber, scramble).

## 16. Making the input exact

The engine's result is its own part times the input's: a 9 of 10 engine fed a 3 of 10 input gives 27 of 100, and a point on the input is worth three on the engine. These changes raise the input side where it decides an outcome, and leave the prose free.

| Change | What the engine does now | Why | Check |
|---|---|---|---|
| S16 | BodyCheck requires `task_kind`: what the task is, from a closed list (a skill or effort of the body; hearing; seeing or searching; swimming; hanging on or carrying; catching or getting away on foot; getting someone to believe, agree, give in or take a liking; armed groups attacking a position; a choke; a blow or a shot; treating a wound), reshuffled before every generation. A named route goes to its tool; a kind and a verb that disagree are refused with both readings | the verb reading catches the words; the kind makes the caller decide the category itself, and a call whose words and category disagree is a call to look at again | N59: a named route redirected, a clash refused with both readings, BodyCheck's own runs, a call without a kind refused, the order changes and the set stays; controls N59, N59b caught |
| S17 | after each player message, a note shows what code took from it, one line per call for the player's character (`reading.ts`): "Look: Ann at the rider, 40 m", "Blow: Jack at Tom", "Words: Ann to the guard, whisper: 'Open the gate'" | the player sees the parse, as a programmer sees a compiler's, and words it more exactly next time | N62; control caught |
| S18 | when the line leaves open a choice that changes the outcome and the words do not settle it, the player is asked in a popup (`ask.ts`): follow someone (catch up, keep out of sight, walk after them openly); take or hold a bridge, gate or hill (a fight for it, or going onto it); "him" or "her" with two or more people in the recent scene it fits. Options of one form, no default, a fresh order; the answer is fixed (required of the plan, read by the planner as THE PLAYER'S CHOICE, set on the player's call); closing the popup stops the reply so the player can say it another way | a guess at the player's meaning is a bend made by code; position and label sway picks (Zheng et al. 2024) | N60: the plan wrote Will, the player picked Tom, and Tom stands on the blow, the reading and the planner's note; closing stops the turn. N61: asked for "follow the thief" and "take the bridge", not for "storm the bridge with our men", "follow him quietly", "walk up to the first sailor and hit him", "I punch Tom", "her" with one woman present; controls N60, N60b, N61, N61b caught |

Not run here: the popups themselves (SillyTavern's confirm popup for two options, its custom buttons for three or four); the harness checks what is asked, what the answer fixes and the stop.

## 17. What existing systems teach

| Change | What the engine does now | Taken from | Check |
|---|---|---|---|
| S19 | asks only when it pays: the likeliest reading is taken when its share of the weight reaches 0.5, or 0.9 when a reading harms someone; asked otherwise, or on a tie. Weights: 1 each, +2 the person the player acted on last turn, +1 one the narrator's last message names, +1 one at the player's spot; a verb's plain sense 2, the others 1 (a fight 0.2), +3 for a sense the scene shows (a fleeing thief: the chase; soldiers about: the fight). All six numbers registered as judgements with ranges. A bare "I strike!" (FrameNet Cause_harm, its Victim left out) is asked | Horvitz 1999, CHI (act, ask or wait by thresholds that rise with the cost of a wrong act); Inform's "does the player mean" rules and Hugo's +1 for the object last referred to; Zhang & Choi (asking on 10 % of cases, picked by uncertainty, doubled the gain over picking at random) | N63: a look at "him" takes Tom (named last), a blow asks; a quiet bridge is walked onto, a held one asked; a bolting thief chased, a strolling one walked after; a bare strike asked; controls N63, N63b, N63c caught |
| S20 | the reading shown back is a paraphrase in story words ("Jack strikes at Tom", "Ann looks at the rider, 40 m away"); a reading taken unasked leads it ("Taken as: Walk after the thief in the open. Say otherwise in your next line") | Attempto Controlled English (one reading by fixed rules, shown as a paraphrase; accept or rephrase); implicit confirmation in dialogue systems (natural, cheap, harder to correct, hence the line to correct it) | N62; control caught |
| S21 | a correction as the next line ("no, Will"; "I meant to keep out of sight"), short, unquoted and naming a person or a sense the last line could have meant, puts the world back to the snapshot before that turn, plans that line again with the correction fixed on the scene as it stood, cuts the record of changes back, and tells the narrator the last reply's account did not happen; "No! Get back!" stays an ordinary line | Elgohary et al. 2020, ACL (plain-word corrections of a wrong parse: people applying them reached 81.5 %, the best model 25.1 %); Clark & Brennan 1991 (revisability) | N64: the record holds the blow at Will only, the planner was not asked again, the narrator told; controls N64, N64b caught |
| S22 | FrameNet 1.7 (651 lexical units of 30 frames, Creative Commons Attribution-Only) routes what VerbNet's classes leave out: verbs VerbNet lacks (befriend, elude, smother, spear, bayonet, resuscitate, invade), the noun after a light verb (take a look, steal a glance, give the room a once-over; throw a punch, take aim), a noun opening a task; its climbing verbs stay BodyCheck's (clamber, scramble); each route names its frame's elements on the tool's arguments, all of them FrameNet's own. The router reads the same ("I take a look around": Look, not a taking) | FrameNet (Fillmore & Baker 2010); SemLink 2.0 was read for the VerbNet–FrameNet pairing but not shipped (no licence stated) | N65 (24 phrasings, the elements, the router); frame tests 41; controls N65, N65b, N65c, N65d caught |

Not run here: the popups in SillyTavern. Open: the weights and thresholds are judgements, to be watched in play (how often a question comes, how often a taken reading is corrected).

## 18. What the player sees

| Change | What the engine does now | Taken from | Check |
|---|---|---|---|
| S23 | the reading of the player's line goes under that line and stays (kept on the message, `extra.rulesReading`, drawn whenever the chat is drawn; a line edited since its reading shows none): the correction it redid, the reading taken unasked, one line per call in parentheses ("(Ann looks at the rider, 40 m away)") with the call as hover text, the things read. Before, it was a toast that closed after 4 s at the top of the screen | WCAG 2.2 SC 2.2.1 (a message that vanishes with no other place to read it is a time limit); NN/g, "Indicators, Validations, and Notifications" (a note about one element sits next to it); Roselli, "Defining 'Toast' Messages" (no controls in toasts; messages kept until dismissed); Inform's "(the green box)" in the transcript; Disco Elysium's check detail in a tooltip; SillyTavern `public/script.js` toastr options (4000 ms, top centre, no close button) | ui U1–U3; controls U1, U1b, U2, U3, U3b caught |
| S24 | the note and the popup are drawn in the user's theme: `style.css` (loaded by the manifest's `css`) reads SillyTavern's theme variables (`--SmartThemeEmColor`, `--SmartThemeQuoteColor`, `--SmartThemeUnderlineColor`, `--SmartThemeBodyColor`, `--mainFontSize`, `--mainFontFamily`), after SillyTavern's own line under a message (`.mes_bias`) and its reasoning block's left rule (`.mes_reasoning`); every line set as text; nothing animates, and the popup opens without animation when reduced motion is asked for | SillyTavern `public/style.css` `:root` and `.mes_bias`, `.mes_reasoning`; `scripts/extensions.js` (manifest `css`); LogRocket's toast guidance (`prefers-reduced-motion`) | ui U2 (markup in a name stays text), U4 (still); controls U2, U4 caught |
| S25 | a reading taken unasked has one action, "change", on the player's latest line: it shows the readings passed over, each a button that fills the input box with its correction ("no, catch up with the thief"), the player's own next line, which the correction rule reads back as that reading; the turn keeps the readings it passed over (`asked.taken`), on a swipe too | Material snackbar (one action); Raskin, "Never Use a Warning When You Mean Undo"; the correction rule of S21 | ui U5 (every change line of the three questions reads back as its reading); N67 (others kept, on a swipe; the change line redoes the turn with Chase fixed); controls U5, N67, N67b caught |
| S26 | a question shows every option the same way: SillyTavern popup buttons of one class in one numbered column (number keys pick), no OK or Cancel, the question (not an option) holding the focus, so Enter picks nothing; "Say it another way" last. Before, two options used the confirm popup, whose first button is coloured and focused, so Enter, the key that had just sent the line, took it; the shuffle of the options only moved that default around. The two-things question is drawn the same way | Johnson & Goldstein 2003, Science 302:1338 (defaults are chosen more often; replicated by Chandrashekar et al. 2023); SillyTavern `popup.css` (`.popup-button-ok`), `popup.js` (setAutoFocus, Enter handler); Disco Elysium's and 80 Days' numbered choice lists | ui U4; controls U4, U4b, U4c caught |
| S27 | found while wiring the note: a swipe of a turn that a correction redid went back to the world the undone turn left (the undone blow at Tom stood again under the blow at Will), and dropped the correction, so the narrator was no longer told the last account did not happen. The redoing turn's snapshot is now the restored world, and the turn keeps its correction | derived (the snapshot at the redoing turn's position was taken before the correction restored the world) | N66: Tom as before the blow after the swipe, narrator told; controls N66, N66b caught |

Not run here: the note and the popup inside SillyTavern. They are checked with a stand-in document (tests/ui.test.mjs) and were drawn in Chromium with SillyTavern's own `style.css` and `popup.css` under its default dark theme and a light one: the note reads under the line in the theme's muted and quote colours, "change" opens the two corrections, the question shows two alike numbered options with the focus on the question.

Checked: tests/route 60, frame 41, engine 132 (N66, N67 new), plan 58, size 9 of 9, ui 14 (new file), all 0 misses; engine and plan 0 misses under 30 other seeds; 93 of 93 negative controls caught (13 new; N64's pattern follows the restore call's new argument); `tools/prompt-audit.mjs` reports the same as before; the patch applies to a fresh copy of the upload and its `npm test` passes. The popup's column layout uses CSS `:has()`; a browser without it shows the same buttons in a row.

## 19. The look the player chose

Asked with drawn options (a form showing each look rendered), the player picked: the most information for the words and the space, an aside in a book serif and italics, one colour per kind of rule, folded until opened, questions as prose with linked choices, type that follows the story's era; detail 3 of 5.

| Change | What the interface does now | Taken from | Check |
|---|---|---|---|
| S28 | each call is one row: a tag naming its kind of rule (Sight, Sound, Speech, Body, Move, Mind, Time, Thing) and the call in the fewest words that decide it, the player's character left out since it makes every call shown ("Sight Tom · 15 m", "Body vault the low wall · 46 %"); folded to one line (the guess, "— or…", then the tagged rows, cut with an ellipsis), opened by a click; the guess's other readings are linked words that fill the input box with the correction | the player's picks; Inform's transcript and Disco Elysium's log for the aside; Material's one action and Raskin's undo for the links | ui: tagged rows, actor left out; guess and others on the latest line only; folded line; drawn as text; controls U1, U1b, U1c, U2, U3 caught |
| S29 | one colour per kind: Okabe & Ito's hues, each mixed with the theme's text colour by a share set per tone (light text or dark), so every kind reads at 4.5:1 or more on all five themes SillyTavern ships (text, chat tint and message tint over black) and on a light one; the tag's word carries the kind as well, so colour is never alone | Okabe & Ito 2008, Color Universal Design; WCAG 2.2 SC 1.4.3 (4.5:1 for normal text) and the relative-luminance formula; SillyTavern `default/content/themes` | ui: every kind colour legible on every theme (the test reads the shares from style.css); era, mark and tone; controls U7, U7b caught |
| S30 | a question is one sentence: the player's words quoted, then every choice a linked phrase of the same form, numbered (number keys pick), the words the choices share said once ("Do you mean to hit ¹Tom or ²Will?"); no buttons, the sentence holding the focus; the two-things question gives each thing's description after it | the player's pick; the default effect (S26) | ui: choices in one sentence, alike; no default; clicks and number keys; shared words; things with descriptions; controls U4, U4b, U4c, U4d caught |
| S31 | period type by the story's year, five OFL faces subset to Latin: EB Garamond before 1600 (Garamont's roman and Granjon's italic, from the Berner specimen of 1592), IM FELL English 1600–1749 (the Fell types of the Oxford press, 1670s–80s), Baskerville 1750–1799 (designed 1757; first book, Virgil, 1757), Old Standard 1800–1919 (the Modern, Didone, style, dominant in printing by the mid-nineteenth century), Libre Caslon Text 1920–1969 (Caslon as mid-twentieth-century lettering drew it); Georgia from 1970 or with no calendar date. Old-style figures where the face has them, one x-height across faces, the manicule for a guess up to 1919 | the faces' own descriptions (google/fonts); Wikipedia, "Baskerville" and "Didone (typography)" | ui: era bands, mark; faces present and licensed; control U6 caught; drawn in Chromium in all six eras |
| S32 | the fonts' licences kept: each face's OFL with its copyright in `fonts/`; Libre Baskerville's subset renamed "Rules Baskerville Subset", since its name is reserved and a subset is a modified font; Libre Caslon's italic s–p and s–t ligatures, which read as a long s, turned off | SIL Open Font License 1.1 (Reserved Font Name clause); seen in the Chromium render ("whiſper") | ui: no face named with a Reserved Font Name; control U8 caught |

Not run here: SillyTavern itself. Drawn in Chromium with SillyTavern's own `style.css` and `popup.css` in each era, on its default dark theme and a light one: the rows align in a tag column, the guess stays whole with "or…", the question reads as one sentence. On a narrow screen the guess is cut with an ellipsis and "— or…" stays.

Checked: tests/route 60, frame 41, engine 132, plan 58, size 9 of 9, ui 21, all 0 misses; 98 of 98 negative controls caught (14 UI controls rewritten for the new note and question); the patch applies to a fresh copy of the upload and its `npm test` passes. The patch now carries the ten font files, so it is in git's format with binary hunks: apply it with `git apply credibility-first-edits.patch` in the repository's root (`patch -p1` cannot create binary files).

## 20. How a line is said

The player: speech is more than words; phonology carries tone, pauses, breathiness; the more specified, and the more information per token, the better. Shown their own line written three ways (conversation analysis's marks, SSML tags, plain words, with the characters each needs), they asked which to choose; the recommendation, taken: click marks onto the line, which writes the densest of the three and is read by code.

| Change | What the engine does now | Taken from | Check |
|---|---|---|---|
| S33 | the marks on a line are read in code (`prosody.ts`): (.) and (0.5) pauses, ↑ ↓ pitch, CAPITALS louder, °…° quieter, wo::rd stretched, wor- cut off, hhh and .hhh breath, wo(h)rd laughter, ((…)) a description, ((angry)) a feeling; › ‹ faster and ‹ › slower, ☺ smile voice, ˈ stress (written so SillyTavern keeps them); {V̤ … V̤} breathy, {V̰ … V̰} creaky, {W … W} whisper, {F … F} falsetto. Ordinary text is left as it is | Jefferson's conventions as CA appendices give them (TalkBank, after Atkinson & Heritage 1984; University Transcriptions' guide); the Danish CA conventions (☺ smile voice); VoQS (Ball, Esling & Dickson 1995) | ui: marks read in code; every mark read; ordinary text unread; controls V1, V2, V3 caught |
| S34 | the mark bar above the message box writes each mark on the selected words or the word at the caret, quotation marks and punctuation left outside, the box's undo kept; a feeling list writes ((angry)) at the line's start; ♪ folds it | the player's pick (clicking marks rather than typing them) | ui: each bar mark reads back on its word; the quote stays outside; control V9 caught; clicked in Chromium |
| S35 | the turn reads the line's words without the marks ("pu::nch Tom" is a blow); the player's Communicate takes the effort the marks give (all whispered: whisper; all louder: loud; some louder: raised [ASSUMED mapping]) and the feeling; the planner reads the delivery as fixed, the narrator gets it in [DECIDED], the note shows it as its Voice row | Jefferson (capitals: louder than the speaker's surrounding talk); VoQS (whisper) | N69; controls V6, V7, V8 caught |
| S36 | a feeling in the voice is heard right with the share listeners reach: Juslin & Laukka 2003, Table 4, unweighted mean pi within one culture and across (anger .93/.91, fear .88/.82, happiness .87/.74, sadness .93/.91, tenderness .82/.71), read among five feelings by Rosenthal & Rubin's pi solved for p, p = pi / (4 − 3 pi); across cultures when the two share no language they are known to speak; a miss is one of the other four, each as likely [ASSUMED equal confusions] | Juslin & Laukka 2003, Psychol Bull 129:770 (read in this session) | ui: the rates; N68 (62.6 % and 41.6 % over 1,500 draws each; none when the voice is not heard); controls V4, V4b, V5 caught |

Open: what pitch, pauses, breath and voice quality change beyond the feeling (a pause read as nerves or a lie, a breathy voice as intimacy) needs a source with rates. Smiling is heard in a voice (Tartter & Braun 1994, read as an abstract with no percentages), so smile voice carries no rate yet.

Checked: tests/route 60, frame 41, engine 134, plan 58, size 9 of 9, ui 29, all 0 misses; 108 of 108 negative controls caught (10 new); the patch applies to a fresh copy of the upload with `git apply` and its `npm test` passes.

## 21. The voice without signs

The player: memorising a sign per mark is not the look they wanted; the backend's detail stays, the front end improves. Shown a sketch, they chose: no signs on screen, the message box showing clean words with marks as soft colour, the chat typesetting the voice.

| Change | What the interface does now | Taken from | Check |
|---|---|---|---|
| S37 | a toolbar of plain words opens over selected words (♪ opens it for the word at the cursor): Pitch (rises, falls), Volume (louder, softer, whispered), Pace (faster, slower, drawn out, short pause, pause, cut off), Voice (breathy, creaky, falsetto, smiling, laughing), Breath (in, out), Weight (stressed), Feeling (angry, afraid, happy, sad, tender); each word set in its own effect; picking it again takes it off | the player's pick | ui: each choice marks its word and reads back, on and off; a selection marks every word; control H1 caught |
| S38 | the marks are kept unseen: a block of Unicode tag characters after each marked word's last letter (U+E0020–E007E mirroring ASCII, closed by U+E007F, the block emoji subdivision flags use); a feeling belongs to the line, one at a time | Wikipedia, "Tags (Unicode block)"; checked in Chromium: no width, the cursor steps over a letter and its marks as one | ui: the words shown unchanged; one feeling; controls H5 caught |
| S39 | Backspace and Delete take a marked letter as one character and leave its marks on the word, or take them when the word has no letter left; the edit replaces the whole letter with its marks, which a browser would otherwise snap to | derived: Chromium alone took one invisible character per Backspace, and a cut inside a letter's marks took the marks with it | ui: Backspace takes a marked letter whole; control H2 caught; in Chromium: five Backspaces leave the word's marks with it to its last letter, then none |
| S40 | a layer over the message box (clicks pass through it) holds the box's text exactly, invisible, in the box's type, padding and scroll, each marked word's letters underlined in its group's soft colour; sent, the line is typeset in the chat (louder small capitals, rising lifted, slower spaced, softer smaller, breathy blurred, creaky a wavy rule, a pause a faint dot or dash, "inhales" and the feeling as small words), hover naming the marks | the player's pick; laid over the box so a theme's opaque box background cannot hide it | ui: the box layer and the chat typesetting; controls H3, H4 caught; the layer aligned under the text in Chromium, dark and light |
| S41 | before a model reads the chat, each player's line with tag characters is rewritten in the notation of section 20 and the tag characters removed; the engine's own reading does the same; the saved chat keeps them hidden | Wikipedia, "Tags (Unicode block)": tag characters "have been used to create invisible prompt injections on LLMs" | ui: the notation a model reads; N70; control H6 caught |

Not run here: SillyTavern itself. A theme whose custom CSS changes the message box's font or padding after the page loads is followed (the layer copies the box's computed style on every change).

Checked: tests/route 60, frame 41, engine 135, plan 58, size 9 of 9, ui 32, all 0 misses; 113 of 113 negative controls caught (6 new); the patch applies to a fresh copy of the upload with `git apply` and its `npm test` passes.

## 22. The review, run (R1–R14)

The review read the code without running it. R numbers are the checks' and the negative controls' labels (tests/engine, frame and ui; tests/negative-controls.json). Each finding was turned into a probe on the uploaded code (`multihog-dev-rules-standalone-revised`), and SillyTavern's `public/script.js`, `scripts/tool-calling.js` and `scripts/extensions.js` (release branch, 2026-09-14) were read for the event order the findings assume. Line numbers are the uploaded files'. Evidence: *run* (a probe printed it), *source* (read in SillyTavern's code).

### What held, and the lines changed

| # | What the player meets | Evidence | Lines (as uploaded) → change | Controls |
|---|---|---|---|---|
| R1 (new) | The narrator's request fails or is stopped after the question pass ran; Regenerate runs the turn's calls again on the moved world: "I wait twenty minutes" moves the clock 40 minutes | run: 600 → 620 → 640; source: `Generate('regenerate')` with the player's line last deletes nothing and fires GENERATION_STARTED (script.js 4405–4412) | rules-tools.ts after 171: a branch for `swipe`/`regenerate` with the player's line last restores `snapshots[chat.length − 1]` (taken as that line joined) and cuts the record to `chat.length` | R1 |
| R2 (review 2) | Deleting back to a greeting keeps the deleted turn's world | run: 610 for 600 | rules-tools.ts 216–222: with no reply holding a result, restore the latest snapshot at or before `chat.length` and cut the record after it | R2 |
| R3 (review 4) | Each recorded fact stores the whole list of facts: the chat's metadata grows with the square of the facts | run: 1,376 bytes for one fact of 50; 47 after | world-log.ts 17: `a.length !== b.length` → `a.length > b.length` (a longer array is diffed by item; a shorter one stored whole) | R3 |
| R4 (review 6, 7) | Opening another chat while the pass waits on the model or a popup writes this turn into that chat | run: the other chat's metadata gained `rulesEngine`; source: `openCharacterChat` (script.js 7744) has no generation guard | question-pass.ts 264–267: every wait (`send`, `ask`, `choose`, the data loads at 288 and 300, each tool at 275) throws when `chatMetadata` changed; index.ts 239 and 246: stop the reply when the chat changed | R4 |
| R5 (new; review 8) | A toolbar mark on the first word of a quotation (pitch, softer, stress, faster, slower, smiling) is lost, and a whisper inside brackets becomes the words "({W": the engine read the toolbar's codes through a notation round trip, whose readers expect each sign at the word's first character | run: `"↑Stop` read with no mark, for all six; `'({W meet me W})'` read as words | voice-code.ts after 103: `marksOf()` reads the marks from the codes; `notateChat()` keeps each line's codes in `voiced` while the model's copy gets the notation; index.ts 235: `notateChat(chat)`; question-pass.ts 321: `hasHidden(line) ? marksOf(line) : readProsody(line)` on the saved line | R5 (also shows typed capitals elsewhere in the line stay words), H6 |
| R6 (review 10) | A line in the third person ("Mara climbs the wall") routes to no tool, so the model picks the tools | run: `[]` without names, `BodyCheck` with them | question-pass.ts 357: `routedTools(said0, has, planTools.people)` | R6 |
| R7 (review 11) | "No, I don't think Will did it" redoes the last turn as a blow at Will | run: correction → Will | ask.ts 135–140: without "I meant", a rest that opens with a subject pronoun, or with a capitalised name and a finite verb, is an ordinary line | R7 |
| R8 (review 16, corrected) | Communicate added its own Lombard rise as an overall level, which turned the voice into flat-spectrum noise; at 75 dB the listener got 1 dB more than the acoustics give, and a feeling's raised voice was heard as noise. The review's "+24 dB double count" did not hold: `reach()` drops its own rise when a level is given | run: SNR −10 vs −11 at 75 dB | rules-tools.ts 1018–1022 removed; 1061: `louder_db` is the feeling's dB alone; acoustics.ts 165, 173–177: `raise` adds to the speech spectrum of the effort; body-engine.ts 1592: `raise` in place of an overall `spl` | R8, R8b |
| R9 (review 17) | A fall onto soft ground from 12 to 15.5 m is never fatal; from 11.9 m it is 43 % | run: 0.433, 0, 0, 0.440 | body-engine.ts 466–467: under the first row, soft ground is one storey lower (3.6 m, the rows' spacing) on the 6–12 m line [ASSUMED]: 12 m 17.6 %, 15.5 m 43.3 %, 15.6 m 44 % | R9 |
| R10 (review 9, part) | Typed signs after an opening quotation mark or bracket are lost; "Re:Zero" is read as drawn out | run | prosody.ts 58, 60: brackets and single quotes may cling to VoQS braces; 64–70: leading signs read after an opening quotation mark or bracket; 74: `’ ) ]` close a span; 83: a drawn-out sound is `::` | R10, R10b |
| R11 (review 15) | Backspace after a marked one-letter word in quotes ("I") leaves its marks on the quotation mark, unseen | run: hidden codes left | voice-code.ts 138: a word starts after a space, quotation mark or bracket; `’` ends one | R11 |
| R12 (review 14, part) | The ♪ button cannot be pressed from the keyboard, and tabbing from the box to the toolbar closes it | code: no key handler, `show()` reads focus in the box only | index.ts 348–354: `role="button"`, `aria-pressed`, Enter and Space; open while the toolbar holds the focus; re-checked on `focusout` | R12 (a check of the compiled text) |
| R13 (review 12) | An Act's action keeps the asterisks and the character's name ("*I sit down at the table.*", "Mara sits down…") | run | frame.ts 58: strip `*`/`_` and a leading "I" or the player's name | R13, R13b |
| R14 (new; review's Area C line 6) | "I walk 5 m to the door and then 10 m to the gate" is timed as 5 m; "I run 20 m to the wall" and "I dash…" are walked at walking pace when code writes the Act (the planner's `pace` never reaches a call code already made) | run: one 5 m walk; the run at 1.34 m/s | actions.ts 164: jog and sprint verbs join the motion verbs; 174–175: the verb sets the pace (run, jog → run; sprint, dash → sprint [ASSUMED for dash]; creep → creep); before 196: `legsIn()` reads each distance with where it goes; 214: two legs or more are walked leg by leg; frame.ts 58: the Act's distance is the legs' sum. A second distance that is not a leg ("300 yards to the market, 2 km from the river") stays out | R14, R14b, R14c |
| — (new) | `npm test` stops at `tsc` on TypeScript 5.x, which `package.json` (`^5.6.0`) and CI install: `for … of` over a `NodeListOf` (index.ts 392) needs the `DOM.Iterable` library before TypeScript 6 | run: TS2488 on 5.6.3; compiles on 6.0.3 | tsconfig.json 8: add `"DOM.Iterable"` after `"DOM"` | `npm test` on 5.6.3 |

### What did not hold as stated

| Review | Finding | Evidence |
|---|---|---|
| 1 | A swipe after function calls doubles the tools' effects | source: the tool message stays in the chat (`saveFunctionToolInvocations`, tool-calling.js 899–921) and the swipe regenerates only the reply after it, so the restored post-tool world matches what the chat shows; run: 610 after the swipe, with the tool message's 10 minutes in the chat |
| 3 | "Say it another way" leaves the turn's changes | run: the state is unchanged when the popup closes (nothing runs before the question); the Stop button's case is R1's |
| 5, 13 | The interceptor rewrites the saved chat in place | source: interceptors get copies, `coreChat.map(chatItem => ({ ...chatItem, mes, index }))` (script.js 4501–4531) |
| 9 (Portuguese) | "come" (Portuguese "eats") routes to Act | run: "Eu como o pão" routes to nothing |
| 13 (title) | Every pause is titled "half a second" | the toolbar has one timed pause, 0.5 s (voice-code.ts 57) |
| 18 | Constants missing from the registry | a documentation gap, kept open (below); no outcome changes |
| 19 | Notes redrawn needlessly on every render | source: CHARACTER_MESSAGE_RENDERED fires once per new message, not per message on load; the review's fix would leave the redraw to `keepNote` alone, which already calls it |

### Open, with the line to change

- Guillemets typed in a line without toolbar marks (German ›Komm her‹, Swiss ‹…›) are read as faster or slower speech: prosody.ts 39–40 (`LEAD`, `TRAIL`). Typed tempo signs remain the only way to mark tempo without the toolbar; taking `›` and `‹` out of both tables makes them quotation marks.
- Typed capitals not in the abbreviation list (NATO, ICU) read as louder: prosody.ts 33 (`ABBREVIATIONS`, [ASSUMED list]); a lexicon is not in the repository (FrameNet's subset has 651 entries). With toolbar marks on the line, typed capitals stay words (R5).
- A hyphen after letters reads as a cut-off ("pre- and post-war"): prosody.ts 84.
- Fitted factors outside the registry (review 18): `KO_MOMENTUM`, `RIGID_BLUNT_FACTOR`, `NATURAL_EDGE_FACTOR`, `CRUSH_AREA_SHARE`, `FLASH_SHIFT`; registering them with `def()` makes the sensitivity reruns vary them (AGENTS.md, How to check 5).
- `truncate()` (world-log.ts 45) keeps the folded base when a deletion goes back past the 400 entries already folded into it; `/rules-replay` then reports a mismatch. The play is unaffected.
- Mobile touch selection with the toolbar was not checked (no touch browser here).

Checked: `npm test` passes on TypeScript 5.6.3 (route 60, frame 44, engine 145, plan 58, size 9 of 9, ui 35, all 0 misses) and the build on TypeScript 6.0.3 emits the committed `.js` unchanged apart from the edits; each new check misses on the uploaded code (R1–R14); 132 of 132 negative controls caught (19 new: R1–R14c; H6 retargeted to the new reader); `node tools/prompt-audit.mjs` lists the same 17 lines as before.

## 23. What the review pass left, done (R15–R22)

Each of the 13 items of the follow-up list, made with a test that fails without it and a negative control. Line numbers are the uploaded files' (`multihog-dev-rules-standalone-revised`); the patch is cumulative over sections 22 and 23.

| # | What the player meets now | Evidence | Lines (as uploaded) → change | Controls |
|---|---|---|---|---|
| R20 | "Say it another way" puts the line back in the input box, marks and all, and takes it out of the chat; the next line stands in its place (before: the abandoned line stayed, and the narrator answered two lines while the engine read one) | source: SillyTavern's `deleteMessage(id)` deletes without asking by default and saves (script.js) | index.ts 242: `takeBack()` before the abort; new `takeBack()` beside `lastUserIndex()`; ui.ts: `lineToTakeBack()` | R20 |
| frame cases | Code writes calls for the player's own acts only. Before: "Tom punches Mara" had Mara punch herself, "Will gives Mara one of the apples" had Mara give to Mara, "Tom walks 5 m" moved Mara, "Jack whispers to Mara" made Mara the speaker | run: 20 lines probed | frame.ts after 32: `byPlayer()` (the clause's subject; a clause without one takes the last coordinate clause's; a sentence without one is the player's; "I", "we", "my" or the character's name is the player; an infinitive after tell, ask, order and 30 more is the object's [ASSUMED list]; a title's full stop ends no sentence); applied at 38, 57, 67, 78, 91, 104, 106 | R22, R22b, R22c |
| R21 | Typed ›…‹ and ‹…› are quotation marks; capitals read as louder on a common word (STOP, NOOOO, DON'T, IDIOTS) and stay as written on abbreviations and names (NATO, ICU); "pre- and post-war" is no cut-off | run | prosody.ts 39–40: guillemets leave `LEAD`/`TRAIL`; 84: a hyphen shared with a hyphened word after and, or, nor, to; 86: `isWord()`; new `lexicon.ts` and `data/lexicon.ts` (39,952 lower-case stems from SCOWL's Hunspell en_US and en_GB, built by `tools/build-lexicon.mjs`; licence in `docs/data/scowl-license.txt`) | R21, R21b, R21c |
| R16 | In a reverberant room a louder voice gains nothing against its own echo: speech-to-noise −10 dB at 40, 60 and 65 dB of background (before: −10, −7, −5) | run | acoustics.ts 177: the echo's source is the voice with its Lombard rise and feeling | R16 |
| R19, R14 | "I run" goes at 0.46 of the runner's top speed, the speed free-living runners choose; "I hurry", "rush", "hasten" walk as fast as one can walk: a 25-year-old woman 1.34 → 2.35 m/s, a 75-year-old man 1.26 → 1.97 | published (secondary): Selinger et al. 2022 as reported by Popular Science, women 2.65 and men 3.35 m/s, over the engine's mean top speed at 25 (5.79, 7.27 m/s) = 0.457 and 0.461; published: Bohannon 1997, Table 4, maximum over comfortable speed by sex and decade | actions.ts 151: `runFactor` 0.45 [ASSUMED] → 0.46 [fitted, 0.40–0.55]; after 151: `BRISK`, `briskShare()`; 55: pace `brisk`; 99: its speed; 164: hurry, rush, hasten verbs; 174: their pace; rules-tools.ts 2188, 2207 (Act's `pace` enums): `brisk` | R19, R19b |
| R17 | `/rules-replay` rebuilds the state after a deletion back past the 400 changes folded into the record's base, and after any restore | run: replay mismatch before | world-log.ts 9: `baseMsg`; 42: kept as entries fold; 45: past the base, the record starts again from the restored world; rules-tools.ts 139, 169 and the two restores section 22 added: the restored state passed; the saved-reply branch of `syncRulesToChat` now trims the record too | R17 |
| R18 | The knockout threshold, the skull factor, the natural-edge factor, the crush share and the flash-point shift are read from the registry, so a result near one says "Fragile" | derived: each fit's own formula at the ends of its data's 95 % (Wilson) interval; the crush share by 4000 simulated bites per value; the flash shift by bootstrap over its 236 compounds | body-engine.ts 841 → `def koMomentum` 156.3–159.7; 1298: `reaches()`; df/combat.ts 34, 37, 40 → `def` rigidBluntFactor 19.675–20.318, naturalEdgeFactor 2.14–2.35, crushAreaShare 0.227–0.235; 74, 135, 192: `k()`; vapour.ts 32 → `def flashShift` 2.0–2.9; 37: `k()` | R18–R18e |
| — | CI and every machine compile the same `.js` | run: 5.6.3 and 6.0.3 emit identical files | package.json 13: `"typescript": "5.6.3"`; AGENTS.md How to check 1 | `npm test` |
| — | Three statistical checks no longer fail by chance on other seeds | derived: binomial SD | tests/engine.test.mjs 342: 0.27–0.67 (4 SD at 47 %, n 100); 379: ≥ 42 of 60 (4 SD below 52.3); 619: ≥ 12 of 20 (4 SD below 17.5) | N08, N13, N32 still caught |
| — | The route, plan and size tests guard their rules | run: each control caught | tests/route.test.mjs: a quoted-only line; negative-controls.json: RT1 a measure of goods has a price, RT2 quoted words are a message, RT3 a message is interpreted, RT4 verbs only where a verb stands, RT5 a yard is 0.9144 m; PL1 Price keyed by its goods, PL2 a description is no person; SZ1 ANSUR bideltoid, SZ2 size by height | RT1–RT5, PL1–PL2, SZ1–SZ2 |
| R15 | A swipe after a function call keeps the call's effect, as the tool message stays in the chat | run | (no change; the check guards the behaviour review 1 questioned) | R15 |

Still open: a pronoun subject ("She walks to the door") is read as someone else's act, so in third-person play the planner writes it; the pace of "hurry" as the fastest walk and of "dash" as a sprint are [ASSUMED]; the running speeds come from a news report of Selinger et al. 2022, whose own page could not be read here (the PubMed Central copy asked for a browser check, the journal's page refused the fetch).

Checked: `npm test` on TypeScript 5.6.3: route 61, frame 55, engine 150, plan 58, size 9 of 9, ui 37, all 0 misses, and the engine file clean on four random seeds; 158 of 158 negative controls caught (27 new; N57, V2, R2 and R5 retargeted to the changed code, H6 still caught); each new check misses on the code before this pass, R15 excepted (it guards a behaviour that was already right); the cumulative patch applies to a fresh copy of the upload (patch -p1 and git apply) and the follow-up patch to the tree of section 22; `tools/prompt-audit.mjs` lists the same lines as before.

## 24. Reading ordinary lines, and who hears what (Q1–Q11h)

The input the player gives is a line of roleplay; 75 such lines (first and third person, asterisks, dialogue, negation, intent, OOC asides, idioms) were run through the reader and the frames, and each wrong reading that reaches an outcome was traced to its line. Line numbers are the uploaded files'; the patch stays cumulative.

| What the player meets now | Before | Lines (as uploaded) → change | Controls |
|---|---|---|---|
| People on the map overhear what is said near them, each at their own distance, through a wall from a room to the outdoors, over their own background, and know what they make out ([OVERHEARD]) | speech reached the listener only | rules-tools.ts after 1061: each tracked bystander (up to 8, nearest first) runs the same `communicate()` chain; `learn()` for those who make out words | Q1, Q1b |
| "She walks 5 m to the door" in third-person play is the player's act; "Mara pushes Tom. He walks…" is Tom's; in a first-person line "she" is someone else | every pronoun subject was someone else (section 23) | frame.ts after 32: `nameSex()` (title, then the US share of girls given that first name, then role words), `pronounIsPlayer()`; question-pass.ts 329: the player's sex passed | frame check, Q5 |
| A code-written blow strikes a person or an animal | "kick his knee" struck "his", "knock three times on the door" struck "three", "beat the eggs" struck the eggs, "jumps to the next roof" struck "to" | frame.ts 90: the struck phrase has its article, a name or a pronoun; verbs.ts 80: `creatureAfter` exported; frame.ts: `objectOf()` bounds the object at the next joining word | Q6 |
| An act given is no thing; one spoken to is a person; a place is no message | "give Tom a hug" handed over a hug; "tell the truth", "ask for directions", "give the order to fire" had listeners "the truth", "for", "fire"; "call out to Tom across the square" taught Tom "across the square" | frame.ts 76–81: `ACT_NOUN` [ASSUMED list]; 44: the listener must pass `creatureAfter`; 48: a place phrase is no message; nouns.ts 7: ranks, kin, groups and folk (captain, king, mother, crowd, goblin…) [ASSUMED list] | Q6b, Q6c, Q6d |
| Acts the line says are not done are no calls and route no tools | "I don't punch Tom" wrote the blow; "I refuse to drink the wine" routed drinking | frame.ts: `undone()` (not, never, n't, refuse to, almost, nearly, without) [ASSUMED list] joins `byPlayer` in every frame; router.ts 70: the same before a verb | Q7, Q7b |
| A sense or a target is asked about or taken only for the player's own act | "Will follows the thief" took "walk after the thief" for the player | ask.ts 47, 76: `byPlayer` | Q3 |
| Phrases that name another act than their verb are routed by the phrase | "take a deep breath" offered Transfer; "hold my breath and dive into the river" offered HoldOn and Look; "pick the lock" offered BodyIntake and Transfer; "keep watch", "tie a tourniquet", "cast a fireball" offered nothing; "shoot the deer" offered Substance | router.ts 94: breath, water, dressings, locks, watch, spells [ASSUMED lists]; 55: shoot, lunge | Q11–Q11h |
| What a character pretends or feigns is a show; "going to" a verb is intent | "pretend to be drunk" offered drinking; "I'm going to wait here" offered a walk | router.ts 67: pretence scope; 70 and `movesIn`: intent | Q11f, Q11g |
| A compound subject holds the player; a climb or a jump is no walk; directions are no targets | "Mara and Tom walk 50 m" was Tom's; "climbs onto the roof and jumps to the next building, two metres across" was a 2 m walk; "look away" targeted "away"; "see Tom enter the room" targeted "Tom enter" | frame.ts: compound subjects in `byPlayer`, the action without them; actions.ts 209: no walk for climb, jump, leap, vault, scale, swim; frame.ts 108: directions, a verb after a name | Q8, Q9, Q10 |
| Out-of-character asides are taken out; a line wholly out of character runs no question pass | "(OOC: can we skip to the next morning?)" offered a walk and ran the planner | frame.ts: `inStory()`; question-pass.ts 327 | Q4, Q4b |
| An expert defender responds faster: a Competent punch to the head blocked 12.5 % by the untrained, 16.1 % by an expert | the timing used untrained reaction for everyone (OPEN-80) | body-engine.ts 1033: `expertRtSd` 0.91 (Zhang et al. 2022, experts against non-experts, response time g = −0.91, 95 % CI −1.08 to −0.73) [ASSUMED against the untrained; range 0.73–1.08]; 1078: applied; 577 and BodyStrike: `defender_expert` | Q2 |

Searched and left open: the duration of a knockout (Huang et al. 2023 timed the loss of muscle tone, seconds or less, not of consciousness: OPEN-81 stays); outdoor rain noise (BRE IP2/06 gives rain on roofs only, under a 50-year rainfall); BMI by age (the CDC report's Tables 14–15 did not come through); Selinger et al. 2022's own pages (refused twice; the running speeds stay as reported).

Checked: `npm test` on TypeScript 5.6.3: route 75, frame 73, engine 154, plan 58, size 9 of 9, ui 37, all 0 misses, and the engine file clean on three random seeds; 182 of 182 negative controls caught (24 new; N57 and V7 retargeted to the changed lines); each new check misses on the section-23 code; the cumulative patch applies to a fresh copy of the upload (patch -p1 and git apply) and the follow-up patch to the section-23 tree; `tools/prompt-audit.mjs` lists the same lines as before.

## 25. Sections 22–24 checked again, and what giving and refusing still got wrong (Q12a–Q13c)

Sections 22–24 came from another session working on the upload of section 21. They were checked here from their own files rather than from their account of them. Line numbers are the section-24 tree's (`review-fixes.patch` applied to the section-21 upload). Evidence: *run* (a probe printed it), *source* (read in the cited work).

### What held

| Claim in 22–24 | How it was checked | Result |
|---|---|---|
| The patch builds the shipped tree | `review-fixes.patch` applied to a fresh copy of the section-21 upload, compared file by file with their zip | identical |
| TypeScript 5.6.3 and 6.0.3 emit the committed `.js` | both compilers run on that tree, output compared with the committed files | identical; the section-21 upload does fail on 5.6.3 (TS2488), as section 22 says |
| `npm test` passes | run on 5.6.3 | route 75, frame 73, engine 154, plan 58, size 9 of 9, ui 37, all 0 misses |
| The statistical checks hold on other seeds | engine, plan and frame tests on seeds 2–31 (`RULES_TEST_SEED`) | 30 of 30 clean |
| Their findings in the section-21 code (R5 marks lost through the notation round trip, R11 Backspace in quotes, R12 ♪ without a keyboard, the TS2488 build) | each reproduced on the section-21 upload | all four hold |
| What the changes do to ordinary lines | 46 roleplay lines read by the section-21 and section-24 trees (`checks/diff/corpus.mjs`) | 20 read differently, each a correction; two of them ("give Tom a hug", "call out to Tom across the square") still had the router offer Transfer (below) |
| Sources | read where they could be reached | Zhang et al. 2022 gives g = −0.91 (95 % CI −1.08 to −0.73), experts against non-experts in combat sports; SCOWL's licence is in `docs/data/scowl-license.txt`; SillyTavern's `deleteMessage(id)` deletes without asking and emits MESSAGE_DELETED; Bohannon 1997's abstract gives the table's ends (comfortable 127.2 cm/s, women in their seventies, to 146.2, men in their forties; maximum 174.9 to 253.3), as `BRISK` has them; the Popular Science report of Selinger et al. 2022 gives 2.65 m/s for women and 3.35 for men |

### What was still wrong, and the lines changed

| What the player meets now | Before | Lines (section-24 tree) → change | Controls |
|---|---|---|---|
| "Give Tom a hug", "a quick nod", "a hand with the cart", "a lift", "a warning", "an order": the planner is offered no hand-over either | code wrote no Transfer (Q6b), but the router still offered Transfer, so the planner could hand over a hug | nouns.ts: `ACT_NOUN` moved here from frame.ts 175 and exported; router.ts after 112: "give … a/an/another/one [adjectives] X" with X an act drops give's Transfer | Q12a; Q12c (a coin given is still a hand-over) |
| "Call out to Tom across the square" is speech only | Transfer offered, through VerbNet's get-13.5.1 ("call me a cab") | router.ts 58: `call`, `call_out` → Communicate | Q12b |
| "Give Tom a slice of pie" hands over a slice of pie; "a cup of tea", "a pat of butter", "a squeeze of lemon", "a hand of cards", "a piece of bread" are things; "a pat on the back", "a piece of my mind", "a tour of the house" are acts | "slice of", "cup of" were handed over (an item no one holds); "a piece of bread" handed over nothing | frame.ts 178: the item takes "of" and its noun; nouns.ts: `actGiven()`: an act noun before "of" is a measure (pat, squeeze, hand) [ASSUMED list]; "piece" is an act only before "of my/his/her… mind" | Q12d, Q12e, Q12f |
| "Give her a ring" (a call or a ring) and "give him a bow" are the planner's to read, with Transfer offered; "give her the ring" is handed over | ring and bow were acts (no hand-over at all) | nouns.ts: `THING_OR_ACT` [ASSUMED list], applied in frame.ts 180 with "a" or "an" only | Q12g, Q12h |
| "I don't run. I walk 10 m to the door." and "I refuse to run, and walk 10 m to the door." walk; "I never sprint; I walk…" walks | timed as a run (or a sprint): the action reader took the first motion verb, refused or not | actions.ts 226: the first match said as done (`undone()`, moved from frame.ts 78 to actions.ts, which frame.ts imports); 211: `motionAt()` likewise, so code writes the walk after a refused run | Q13a, Q13c |
| "I don't walk 10 m to the door" moves no one | the distance alone made a walk of unknown kind | actions.ts 234: no such walk when a known motion verb stands in the line | Q13b |

Probed and left as they are: "Tom punches me. I hit him back." gets no code-written call (the pronoun "him" names no one in the frame; the planner writes it); an Act's `action` text keeps the refused clause ("refuse to drink, and walk 10 m to the door."), which is the player's own words and no longer sets the pace.

Checked: `npm test` on TypeScript 5.6.3 (and 6.0.3 emits the same `.js`): route 89, frame 82, engine 154, plan 58, size 9 of 9, ui 37, all 0 misses; 193 of 193 negative controls caught (their 182, with Q6b retargeted to `actGiven()`, and 11 new: Q12a–Q12h, Q13a–Q13c); 13 of the 23 new checks miss on the section-24 tree, and the other 10 guard the fixes against reaching too far and pass on both trees (the router still offers Transfer for a coin, apples, a piece of bread, a pat of butter and a ring, and "I run" is still a run; code writes no hand-over for a piece of my mind, a pat on the back or "a ring", and no move for "I don't walk"); the 46-line corpus reads differently only on "give Tom a hug" and "call out to Tom across the square"; the cumulative patch applies to a fresh copy of the original repository with `git apply` and passes `npm test` there; `docs/constants.md` regenerated (324 tags written only in comments: the act-noun lists moved to nouns.ts, `undone()` to actions.ts).

## 26. The player's line read by its grammar (G1–G23)

The user's objection: the reader treated English words by themselves, and the fix was to study English grammar, from a grammar, not a blog. Section 25's own fixes were the example: three word lists made up for "give X a hug" (acts given, "ring and bow", measure words). They are removed. The reader now follows Huddleston & Pullum, *The Cambridge Grammar of the English Language* (Cambridge University Press 2002; CGEL), read from the copy the user supplied; where a rule asks a fact about one word, Open English WordNet 2024 (CC BY 4.0) gives it. Estigarribia, *A Grammar of Paraguayan Guarani* (UCL Press 2020, CC BY 4.0), also supplied by the user, was read for comparison. Line numbers are section 25's tree (`credibility-first-edits.patch` of that section).

### The two grammars side by side

| What | Estigarribia 2020 (Guarani) | CGEL 2002 (English) | What the reader takes |
|---|---|---|---|
| Verb classes | by complements: intransitive, transitive, ditransitive, postpositional complement verbs (=rehe, =ndive, =gui) (ch. 4, Fig. 4.1, pp. 126–127, 141) | the same by complements, with prepositional verbs (ch. 4) | the same frame; nothing Guarani-specific |
| A class English lacks | active (a-) and inactive (che-) intransitives; "unpredictable from its meaning … it must be memorized with its accompanying prefix set" (p. 132); the transitive aireal verbs (ai- prefixes) are listed in §17.6 | none; the nearest are complement classes (ch. 14 §5) | a grammar's list is a list of words that behave a stated way; the act-noun list failed that test |
| Giving | ditransitives: "the direct object is the thing transferred" (§4.3, p. 140) | ordinary give, and light give: "She gave him a kiss" = "She kissed him", the noun related to an associated verb (ch. 4 §7, pp. 290–296) | light and ordinary uses told apart by the noun |
| Predicates from nouns | inactive "verbs" are noun roots taking person prefixes: che-mandu'a 'I remember' (my remembrance), ñande-japu 'we tell lies' (p. 131) | light verbs carry the noun as predicate (ch. 4 §7) | — |
| Negation | circumfix nd-…-i, which "always encloses the whole word or group of words that is being negated" (§4.9, p. 155) | marked by position; scope by clause and focus (ch. 9 §§1–2); covertly negative verbs (§4.4) | the clause before the verb, with CGEL's negators |
| Who does an embedded act | juxtaposed verbs of command, perception, volition, each with its own person prefix: Emomarandu ichupe tou (§12.2.2, p. 269) | an unexpressed subject recovered from the matrix (ch. 14 §§1.7, 3, 5) | CGEL's catenative classes |
| Amounts | juxtaposition (mbohapy kagua 'three glasses'), quantifiers after the noun (ch. 9, pp. 241–245) | quantificational nouns with of (ch. 5 §3.3, pp. 349–352); partitives (p. 411) | "a slice of pie" is pie |
| Third person | o- unmarked for number (p. 130); ha'e 's/he' | him/her mark sex and number; non-reflexives exclude a co-argument antecedent (ch. 17 §3.1, p. 1484) | agreement and the reflexive rule |

### What the reader does now

| Construction (CGEL) | Before (section 25) | Rule and where it is stated | Lines → change | Controls |
|---|---|---|---|---|
| Light verbs, ch. 4 §7 | give + a listed noun dropped Transfer; take, have, make, do, pay, raise, offer read as their own verbs: "take a sip of the wine" a taking, "raise an objection" a price and a treatment, "give Tom a quick kick" a hand-over of "quick kick" | light when CGEL's samples hold the noun ([10]–[21], p. 296), when WordNet lists the phrase as a verb (170 idioms), or when the noun's first sense is an act from a verb and none names a thing; ordinary when the noun names only things, when the object is definite (p. 291), or when an of phrase names a thing (ch. 5 §3.3; p. 411) save after give's physical acts (p. 294); both readings → the scene's (p. 291) | new `grammar.ts` (`lightReading`, `phrasesAfter`, `sayLight`); new `data/wordnet.ts` and `tools/build-wordnet.mjs`; router.ts 82–83: a light verb routes its act; frame.ts 173–184 (`handing`): only the ordinary use hands over; frame.ts 223: frames read the line with light uses said as their verbs; nouns.ts 23–37 and router.ts 116–118 (section 25's lists) removed | G1–G10, G23 |
| Understood subjects, ch. 14 §§1.7, 3, 5 | an [ASSUMED] list of 35 verbs, to-infinitivals only; "I make Tom walk 10 m" was the player's walk | the intervening NP of the complex catenative construction, to or bare (Classes 2A, 2B, 3A, 3B, pp. 1229–1237); the oblique of 2Aiv, 3Aiii; promise apart (p. 1229); a purpose adjunct after two objects settled by meaning (§4.4; [17]) | frame.ts 45–46 removed; 88–93 → the classes from `grammar.ts`, bare infinitivals, obliques | G14–G16, R22b retargeted |
| Negation, ch. 9 | not, never, n't, almost, nearly, without, refuse to, decline to | adds the covertly negative fail, forget, neglect, omit, avoid, refrain and keep/prevent/stop/prohibit/ban/hinder … from (§4.4, pp. 835–836), too … to (p. 837), practically (p. 723); refuse (Karttunen 2012, Table 2); the two-way implicatives negated are done (Karttunen 2012, Table 1) | actions.ts 210–215 (`undone`); router.ts 82 | G17–G20, Q7b retargeted |
| Pronouns, ch. 17 §3.1 | "him" took the last phrase after to/at/with/tell/give, any sex; a blow at "him" was never drafted | the one person named before whose sex fits, not the subject of its own clause (p. 1484), nor the player in a first-person line; none or two → the scene's | frame.ts 22–37 (`lastNamed` → `namedBefore`, `personFor`); `handing`, `striking`, `speech` | G11–G13 |
| A look's target | "I have a quick look around and take the lamp" looked at "and take" | a target is a noun phrase, not a coordinator | frame.ts 211 | G21 |
| Apology | "offer an apology" spoke; read as light, apologize had no tool | FrameNet's Apology frame is a communication frame | router.ts VERB_TOOL | G22 |

Read through the reader: the 46 lines of section 25's corpus read the same but one ("Tom punches me. I hit him back." now drafts the blow at Tom); 57 lines of give, take, have, make, do, pay, put, offer and raise read differently in 24, each listed in grammar-corpus.txt beside this file (none was right before and wrong after; four stay imperfect: "take a seat" is still a taking, as WordNet has no such idiom; "give way" routes yield's Transfer; "pay a visit" and "put an end" route nothing).

Consulted and not used as rules: Nairn, Condoravdi & Karttunen 2006 (the polarity computation; only its signatures' content is used, through Karttunen 2012); Van Eynde & Kim 2020 (pseudo-partitives; agrees with CGEL pp. 349–352); the PARSEME 1.3 light-verb tests (an annotation procedure, not a description).

Open: WordNet files some documents under communication, so "give Will a letter" is left to the scene rather than drafted (hand and pass, which are never light, still draft it); which of two men "him" means is left to the scene, as the grammar leaves it; the order of WordNet's senses (most frequent first, from SemCor) is used for "the noun's first sense", a corpus fact, not a grammatical one.

Checked: `npm test` on TypeScript 5.6.3 (6.0.3 emits the same `.js`): route 116, frame 102, engine 154, plan 58, size 9 of 9, ui 37, all 0 misses; plan and frame clean on five seeds; of the 47 new checks, 32 miss on section 25's tree and 15 guard the rules against reaching too far ("take the bread" is still a taking, "make a fire" no hand-over, "I promise Tom to wait" the player's wait); 207 of 207 negative controls caught (the full run caught 204 of 206; N65d and Q11h guarded lines the grammar now also reads, "take a look" and "take a deep breath", and were retargeted to lines only their rules read, "steal a glance" and "draw a deep breath", then caught; G23 added; Q6b and Q12a–Q12h removed with the code they guarded); the cumulative patch applies to a fresh copy of the original repository with `git apply` and passes `npm test` there; `docs/constants.md` regenerated (323 tags written only in comments: the four lists this pass judged are tagged [ASSUMED]).

## 27. What else the grammar reads (G24–G38)

Asked "What else, was that all", 28 more ordinary lines (passives, questions, conditions, modals, reported speech, imperatives to others, catenatives) were read through section 26's reader. Ten read wrongly; each is fixed by the rule the grammar states, with the grammar's page. Line numbers are section 26's tree.

| What the player meets now | Before (section 26, and since the first version where said) | Rule and where it is stated | Lines → change | Controls |
|---|---|---|---|---|
| "I am walking to the door", "I am tired, so I walk to the inn": the distance is the scene's | "am" read as "a m": a 1 m walk drafted, since the original repository | a number in words is a word of its own; figures may touch their unit ("50m") | actions.ts 203–204 (`distanceIn`), 233 (`LEG`) | G24 |
| "I will climb the wall tomorrow" routes the climb only; "I have walked" no eating | will read as a lexical verb (bequeathing → Transfer) | the modal auxiliaries take a bare infinitival and are no lexical verbs; be, get and have before a participle are auxiliaries (CGEL ch. 3 §2) | router.ts 90–92: auxiliaries skipped, the verb after them read | G25, G27 |
| "I signal to Will to wait", "I talk to Rob about the horse", "I hand the letter to Bill" | Will, Rob and Bill routed as verbs (bequeath, rob, bill: Transfer, Price) | a capitalised word inside a sentence is a proper name (ch. 5 §20) | router.ts 90 | G26 |
| "I am hit by Tom", "I am given a coin by Tom": nothing of the player's; "Tom is hit by me": the player's blow at Tom; "I get hit by Tom" routes the blow | the passive's subject read as the doer; "Tom is hit by me" drafted nothing; get routed its own tools | the passive's subject "is associated with a passive role, the role of patient"; be or get with a past participle; the agent is the complement of by (ch. 16 §10, pp. 1427–1430) | frame.ts before 92 (`passiveAt`), 92 (`byPlayer`), 215 (`striking`); router.ts 90 | G27, G29, G30 |
| "I could hit Tom", "Can I walk 10 m to the door?" are not done; "I can see the rider" is seen; "I will walk 10 m" is done | drafted as done | a modalised clause does not commit the speaker to the act (ch. 3 §9.1, p. 173); can with perception is "currently actualised" ([24ii] p. 185); will in a player's line is the act about to be done [ASSUMED for roleplay] | actions.ts 217 (`undone`); grammar.ts `NOT_FACTUAL`, `PERCEPTION_VERB` | G32–G34 |
| "I hit Tom if he moves", "If the guard looks away, I walk 10 m to the door" are not done | drafted as done | conditional adjuncts (ch. 8 §14, pp. 738–760; if, unless and the words of [61] p. 758) | actions.ts 217; grammar.ts `CONDITIONAL` | G31 |
| "Tom wants me to walk 10 m to the door" drafts no walk; "Tom makes me walk" does | drafted my walk | of the complex catenatives, only cause, force and make (Karttunen 2012, Table 2), help ([15iii] p. 1229), the causatives get and have (Class 3Bi), let, and the verbs of perception ([43] p. 1236) say the NP's act happens | frame.ts 109 | G35 |
| "I have Tom give me the coin" routes the giving | have routed as eating (BodyIntake) | the causatives make, have, get, let, help before a person and a verb (ch. 14 Classes 3A, 3B) | router.ts 90 | G28 |
| A cup of tea, a bottle of wine, a loaf of bread have a price; a pack of wolves, a group of men none | a list of 16 measure words [ASSUMED] | "a N1 of N2" with N2 bare is the non-partitive quantificational construction (ch. 5 §3.3, pp. 349–352); N1 a quantity or a thing, N2 a thing (WordNet) | router.ts 122–123 → grammar.ts `measureOfGoods` | RT1 (retargeted), G36 |
| People by WordNet's first sense (a person): captain, king, mother, villager, witch… | a list of 59 ranks, kin, groups and folk [ASSUMED] | WordNet's first sense; seven words it does not hold as people stay listed and tagged | nouns.ts 8–11, 21 | G37 |
| "I see a pack of wolves" looks at the pack of wolves | target "a pack of" | an N1 of N2 noun phrase (ch. 5) | frame.ts 240 | G38 |

The noun data now tells animals and quantities from other things (WordNet's lexicographer files 05 and 23); no reading changed by that alone (both corpora read the same before and after the rebuild).

Read through the reader: section 25's 46 lines read the same but one ("no, Will" no longer routes bequeathing); section 26's 57 light-verb lines all read the same; of the 28 new lines, 10 read differently (`clause-corpus.txt` beside this file).

Left as it was, by choice: "I want to wait an hour" is still drafted as waiting, as an existing check asks (strictly, want says nothing of whether the wait happens: Karttunen 2012); the senses of follow and take in ask.ts choose between tools (a chase, a look, a walk), not between senses a grammar or a dictionary separates.

Checked: `npm test` on TypeScript 5.6.3 (6.0.3 emits the same `.js`): route 129, frame 118, engine 154, plan 58, size 9 of 9, ui 37, all 0 misses; of the 29 new checks, 17 miss on section 26's tree and the rest guard the rules; 222 of 222 negative controls caught (the full run caught 221; N57b's pattern first met the new passive branch of `striking`, so it was retargeted to the blow filter it guards and caught; RT1 and RT4 retargeted to the changed lines; 15 new: G24–G38); the cumulative patch applies to a fresh copy of the original repository with `git apply` and passes `npm test` there; `docs/constants.md` regenerated.

## 28. The reader against the grammar's chapters (G39–G85)

Asked to work from the chapter table ("Do it, continue"), each chapter of the Cambridge Grammar that a player's line draws on got a set of probe lines (59 in all, `chapter-corpus.txt` beside this file), read through section 27's reader. What it read wrongly is fixed by the rule that chapter states, with the page; what the reader leaves to the scene is listed at the end, with the reason. Line numbers are section 27's tree.

| What the player meets now | Before (section 27, and since the first version where said) | Rule and where it is stated | Lines → change | Controls |
|---|---|---|---|---|
| "Today I walk 10 m to the gate", "At dawn I walk…", "In the morning I punch Tom", "Without a word I hand Tom the letter", "The next day I wait an hour", "Afterwards I wait an hour" are drafted | nothing drafted: the subject was taken to be the clause's first word ("Today", "In") | the subject's basic position is before the predicator; front position is before the subject ("The next day she sold her car") (ch. 4 §3.1, p. 243; ch. 8 §20.1, pp. 779–780); the nominative is the case of the subject of a finite clause (ch. 5 §16.2.1, p. 458); prepositions of ch. 7 [27], p. 613, with the central ones it leaves out [ASSUMED]; the time NP's head a noun of WordNet's noun.time | frame.ts 151–154 → grammar.ts `subjectAfterFront`, `frontAdjunct`; tools/build-wordnet.mjs 4–8, 21–24 (kind t); data/wordnet.ts rebuilt | G39–G42, G83 |
| "I walk 10 m to the market every day", "I usually walk…", "Every morning I wait an hour", "I hit Tom every time he moves" draft nothing | drafted as acts now | the simple present of a dynamic verb is one act now only in performatives and commentaries, "a commentary on one's own actions" (ch. 3 §4.2.1, pp. 127–128), so a player's present is the act now; a non-bounding frequency adjunct marks a multiple situation, a serial state (ch. 8 §9 [2]–[3], [9], pp. 713–715); adjuncts that can count one occasion's blows left out [ASSUMED split] | actions.ts 217–227 (`undone`) → grammar.ts `notNow`, `habitual` | G43, G44 |
| "Yesterday I walked 10 m to the market", "I punched Tom two days ago", "Last week I punched Tom", "Tomorrow I walk 10 m to the gate" draft nothing; "I punched Tom yesterday, and today I walk 10 m to the gate" drafts the walk; "Yesterday I bought bread and walked 10 m to the door" no walk | "I punched Tom yesterday" drafted a blow now ("Yesterday I…" drafted nothing only because of the subject bug above) | deictic time adjuncts (ch. 8 §6.2 [6], p. 695); the preterite with yesterday is a past occurrence (ch. 3 §4.3.1, p. 137); the present futurate (§4.2.4, pp. 131–133); "in two weeks" left out, it can be a duration (p. 695); the preterite with no such adjunct is the turn's narrative tense [ASSUMED for roleplay] | actions.ts 217–227 → grammar.ts `notNow` | G45–G47, G50, G51 |
| "I used to punch Tom", "I am about to walk 10 m to the door", "I will have walked 10 m to the door by then" draft nothing; "I used to punch Tom" no longer offers eating or waiting | drafted (used routed as using: BodyIntake, PassTime) | used to, "the past aspectual meaning" (ch. 3 §2.5.9, p. 115); about to, on the point of, "immediate futurity" (§10.2 n. 68, p. 211); will with the perfect is a modal judgement about past time (§10.1 [4i], p. 210) | actions.ts 217–227 → grammar.ts `notNow`; router.ts 101–112 | G48, G49, G80, G85 |
| "Do I walk 10 m to the door?", "I walk 10 m to the door?", "Do I walk 10 m to the door." draft nothing; "Do I see anyone at the window?" still looks | drafted as acts | closed interrogatives have subject–auxiliary inversion, with do (ch. 10 §2 [1]–[2], p. 856); declarative questions (§4.7.2, p. 881); a question of perception is answered by the look [ASSUMED] | actions.ts 222–223 → grammar.ts `QUESTION_INVERSION`, `SENSING` | G52–G54 |
| "I will just walk 10 m to the door" is drafted | read as a question (section 27's inversion check matched any word as the subject, its regular expression case-blind) | as above: the subject after the auxiliary is a pronoun or a name | grammar.ts `QUESTION_INVERSION` | G84 |
| "Let us walk 10 m to the door", "Let's walk…": speech, the walk offered, none drafted | drafted as the player's walk (let read as the causative, "us" as its object) | the 1st person inclusive let-imperative is "a proposal for joint action, which the addressee can accept or reject" (ch. 10 §9.3.2, p. 936) | actions.ts 217–227; router.ts 101–112, 149 → grammar.ts `LET_US` | G55–G57 |
| "Tom, walk 10 m to the door!", "Guard, open the gate!", "Tom, please punch the guard!": speech to Tom, to the guard | no act at all (the blow or the walk offered, nothing said) | a vocative is set off by a comma; "in imperatives the subject is always referentially tied to the addressee(s)" (ch. 10 §9.2.2, p. 927) | frame.ts 167 (`speech`); router.ts 149 → grammar.ts `vocativeImperative` | G59, G60 |
| "I give the coin to Tom", "I give a coin to a beggar", "I hand the letter back to the captain", "I hand the letter to Bill" are drafted hand-overs | no hand-over drafted, since the original repository (only "give Tom the coin") | the ditransitive's prepositional alternant: "I sent Sue a copy" ~ "I sent a copy to Sue" (ch. 4 §4.3 [7], p. 248) | grammar.ts 84–87 (`phrasesAfter`); frame.ts 225–233 (`handing`) | G61–G63 |
| "I take the coin and give it to Tom" hands over the coin; "A coin fell at my feet. I give it to Tom." too; "I take the coin from the table and give it to Tom" and "The knife lay on the table. I give it to Tom." are the scene's; "I take two apples and give them to Tom": two apples | no hand-over drafted | it for "entities which are neither male nor female" (ch. 5 §17.2.2, p. 488); with two that fit, the grammar does not choose (as for him and her, section 26); a subject's noun phrase ends where its verb starts (ch. 4 §3.1) | frame.ts 225–233 → `thingFor` | G64–G66 |
| "A man walks in. I punch him." strikes the man; "A drunk sailor walks in…" the drunk sailor; "A tall man and an old woman walk in. I punch her." the old woman | nothing drafted: only names and phrases after to, at, with, give… were antecedents; "man" and "men" were no men to census.ts (it read "fisherman", not "man") | a noun phrase introduces a referent that is then identifiable "by virtue of this prior mention" (ch. 5 §6.1 [6iii], p. 370); gender agreement (ch. 5 §17) | frame.ts 33–36 (`namedBefore`), 42 (`sexOf`); census.ts 48 (`wordSex`) | G67–G70 |
| "I hit myself" strikes the player | nothing drafted | the reflexive's antecedent is the complement's own verb's subject ("Ann blames herself", ch. 17 §3.1 [3i], p. 1484) | frame.ts 241–255 (`striking`) | G71 |
| "I see Tom and Will" looks at Tom and Will | looked at Tom | an NP-coordination is "functionally like an NP" (ch. 15 §1 [2i], p. 1275) | frame.ts 260–270 (`perceiving`) | G72 |
| "It is Tom that I hit" strikes Tom; "What I do is walk 10 m to the door" walks; "It is a fact that I hit Tom" stays as it is | nothing drafted | a cleft divides its basic counterpart in two ("It was a bee that stung me" ~ "A bee stung me", ch. 2 §16 [1], p. 67; ch. 16 §9; the pseudo-cleft, ch. 4 [47], p. 267); a relative clause with an object of its own is extraposition | frame.ts 277–284 (`framedCalls`) → grammar.ts `canonical` | G73–G75 |
| "I wait for twenty minutes and then walk 10 m to the door" waits, then walks; "Before I walk 10 m to the door, I wait an hour" and "I walk 10 m to the door after I wait an hour" wait first | the walk listed first whatever the order told | "Where the coordinates denote occurrences rather than states, the linear order generally reflects the temporal sequence of the events" (ch. 15 §2.2.3, pp. 1299–1300) | frame.ts 277–284 | G76–G78 |
| "Last week I punched Tom" offers no price; "I have just walked 10 m" no eating; "Tom punches me" routes the blow without the cast's names | last routed as a verb (Price); have before an adverb not read as the perfect's; a sentence-initial name not taken as a subject | an NP of time in front position (ch. 8 §20.1); central adverbs follow the auxiliary ("They had probably seen her", [3], p. 780); proper names (ch. 5 §20) | router.ts 101–118 | G79, G81, G82; R6's check extended to "Ash climbs the wall" (a name that is a common word, a subject only by the scene's names), since "Mara" now needs no names |

Read, and left to the scene or the planner, with the reason:

- "They hit me. I hit them back.": BodyStrike strikes one person, and "them" names a group.
- A preposed object ("Tom I punch, not Will"): the object stands before the subject, and the reader looks for it after the verb.
- Comparatives ("I walk faster than Tom", ch. 13): they change no argument that code writes.
- A bounding frequency ("I hit Tom twice"): CGEL gives two readings, two kicks or two occasions ([7], p. 714). One blow is drafted, and the planner keeps the count.
- "There", "here", "this" and "that" point at what only the scene shows.
- A whether-clause's verb is still offered as a tool ("I listen to whether Mr. Abbott cries out" now offers speech too). The router offers the tools of acts the line does not assert, as it does for "Should I punch Tom?".

Read through the reader:

- Of the 59 chapter lines, 29 read differently, all as the table says.
- Of the 290 player lines already in the tests, eval scenes and stories, 3 read differently:
  - "I hand the letter to Bill" is now drafted.
  - "Ana kicks the hound" routes the blow, because a sentence-initial name is a subject.
  - "I listen to whether Mr. Abbott cries out" now offers speech too.
- Of section 26's 57 light-verb lines, 2 read differently: "Mara gives Tom a punch" and "Tom gives me a punch" route the blow even without the cast's names.
- Of section 27's 28 clause lines, 2 read differently:
  - "Tom, climb the wall!" is now speech to Tom.
  - "Let's walk 10 m to the door" is now speech, with the walk offered.
- Of the 41 grammar-probe lines, 1 reads differently: "I watch Tom climb the wall" now offers Tom's climb, which the perception verb entails (section 27).

Checked:
- `npm test` passes on TypeScript 5.6.3, and 6.0.3 emits the same `.js`: route 135, frame 171, engine 154, plan 58, size 9 of 9, ui 37, all with 0 misses.
- The new checks were run on section 27's tree: all 6 route checks miss, and the frame checks miss 39 times. The other new frame checks guard the rules against over-reach, for example:
  - "I walked 10 m to the door" is still drafted;
  - "In the tavern Tom punches me" is not the player's blow;
  - "The knife lay on the table. I give it to Tom." is the scene's.
- Negative controls: 268 of 268 caught.
  - The full run caught 263 of the 266 controls listed when it started.
  - R6 is now covered by "Ash climbs the wall" (see the table).
  - G1's pattern met the cleft step, so it was retargeted to `said = sayLight(basic)`.
  - G34's modal inversion moved into grammar.ts, and the question mark now also catches "Can I walk…?", so G34 was retargeted to the modal part of `QUESTION_INVERSION`, with the line "Will I walk 10 m to the door.".
  - G84 and G85 were added after that run started.
  - The 124 controls on the files and tests changed since the run started were rerun on the final tree, and all were caught.
  - G58 (a vocative rule in `byPlayer`) was dropped with its code: the comma already makes the vocative the subject, so the rule decided no line.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there. The pass patch (`chapter-pass.patch`) applies to section 27's tree and reproduces it too.
- `docs/constants.md` was regenerated: 327 tags.

## 29. Where a walk ends, how long it lasts, and three sources found on the web (G86–G103)

Asked to "continue with whatever you find on the web", this pass reads the three constructions that section 28's coverage table left unread (the prepositions of a walk, a walk's duration, resultatives) by the Cambridge Grammar's rules. It also searched the web for the three sources earlier sections could not read. Probe lines and readings, old and new: `spatial-corpus.txt` beside this file (30 lines, 23 now read differently). Line numbers are section 28's tree.

| What the player meets now | Before (section 28, and since the first version where said) | Rule and where it is stated | Lines → change | Controls |
|---|---|---|---|---|
| "I walk 10 m towards the door" ends 10 m towards the door, short of it | arrived at the door, since the original repository | "While to alone marks goal, towards marks direction: the complement of the preposition is only a potential final location" (ch. 8 §4.3, p. 688) | actions.ts 181–186 → grammar.ts `walkEnd` | G88 |
| "I walk 10 m across the room" ends on its far side; "across the room to the door" at the door | ended at "room" | across alone is a goal: "the final location is on the other side of the bridge" (n. 7, p. 688; [28]) | actions.ts 181–186 | G87 |
| "along the wall", "through the hall", "past the guard", "up the hill", "by the guard" (past): a spot 10 m along the path | "outside, near where Mara stood", wherever the walk went | path: an intermediate location ([28], pp. 687–688; via, along) | actions.ts 181–186 | G91, G92 |
| "10 m away from the fire": a spot away from the fire | "outside" | source: away, from, off, out (p. 687) | actions.ts 181–186 | G93 |
| "behind the house", "near the fire", "beside the river" keep their preposition; "in the garden" is the garden | "near the fire" ended at the fire, "behind the house" and "in the garden" "outside" | "most of the expressions that can function as location can also function as goal" ([27], p. 686) | actions.ts 181–186 | G89, G90 |
| "I see Tom at the bar. I walk 10 m there." ends at the bar | "outside" | anaphoric there takes the place of its antecedent (ch. 17 §9.1, pp. 1549–1550: "Kim is in Paris and wants us to go there too") | actions.ts 181–186 | G94 |
| "I walk 10 m to open the door" ends 10 m away, "I walk 10 m to the door to open it" at the door; "to the door in a minute" at the door; "to the market on Wentworth Street" at the market on Wentworth Street | "open the door" and "door to open it" taken as places | to before a verb marks the infinitival (ch. 14); a PP of place is a post-head dependent of the goal's NP (ch. 5), a PP of time is not (WordNet noun.time) | actions.ts 181–186; grammar.ts `AFTER_NP`, `timeCut` | G86, G96, G102, G103 |
| "I walk 10 m" ends at a spot 10 m away; "I step out, 5 m" outside | always "outside" | an omitted goal is "contextually understood" ([20], p. 684) | actions.ts 190 | G95 |
| "I walk 5 m towards the door, then 10 m to the gate": the first leg ends short of the door | the first leg ended at the door | as for a whole walk | actions.ts 252–254 (`legsIn`) | G97 |
| "I walk for an hour", "I walk along the river for an hour", "I wander the streets for two hours" draft an hour, two hours spent walking; "I run for ten minutes" running; the walk is settled by it; "I walk to the market for an hour" drafts nothing | nothing drafted (a walk with no distance) | for-phrases give the duration of activities, not accomplishments ("He played tennis for an hour", "*He walked a mile for an hour": ch. 3 §3.2.3 [18], p. 122); a goal bounds a walk, a path does not ([21], p. 684) | frame.ts 236 (new `walkingFor`), 344 (`framedCalls`) | G98–G101 |

Resultatives (ch. 4 §5.3, p. 260: an optional resultative entails the act without it, "He washed it clean entails He washed it") needed no change. The reader reads the act ("I knock the guard unconscious" is a blow), and the result is the outcome the engine decides.

Sources looked for on the web:

| Source | What was found | Change |
|---|---|---|
| Bohannon 1997, Table 4 (comfortable and maximum gait speed by sex and decade) | Read in full from the [academia.edu copy](https://www.academia.edu/43982374/Comfortable_and_maximum_walking_speed_of_adults_aged_20_79_years_reference_values_and_determinants). All 24 means are as `BRISK` has them (the copy's text drops two decimal points, "2533" and "1296"; the abstract gives 253.3) | actions.ts 154–156 comment; df-body-engine.md |
| Selinger et al. 2022 | Full citation from Stanford's Mobilize center: Current Biology 32:2309–2315. No speeds could be read from PubMed Central (browser check), Stanford's or Queen's news, the authors' [SimTK data page](https://simtk.org/projects/run_energetics), Scimex or Earth.com, so 2.65 and 3.35 m/s still come from the Popular Science report | actions.ts 152 (`runFactor` source); df-body-engine.md |
| How long a knockout lasts (OPEN-81) | Hånell & Rostami 2020, "How Can a Punch Knock You Out?", Front Neurol 11:570566 (a review): "consciousness is typically regained spontaneously within a few minutes or less", with no measurement or citation behind it. Bernick et al. (medRxiv 2020) time how long fights go on after a concussion, not unconsciousness. OPEN-81 stays open | body-engine.ts 846 (`koMedianMin` source); df-body-engine.md OPEN-81 |

Read through the reader:
- Of the 345 player lines in the tests, eval scenes and stories, none routes or drafts differently.
- Two walk ends changed: "Tom, walk 10 m to the door!" lost a "!" from its spot, and "I walk 10 m to the door after I wait an hour" lost "after I wait an hour".
- Of section 28's 59 chapter lines, one reads differently: "I walk for an hour" now drafts the hour.

Checked:
- `npm test` passes on TypeScript 5.6.3, and 6.0.3 emits the same `.js`: route 155, frame 176, engine 154, plan 58, size 9 of 9, ui 37, all with 0 misses.
- On section 28's tree, the 20 new route checks miss 15 times and the 5 new frame checks 4 times. The rest guard against over-reach: "to the door" still ends at the door, "out of the room" outside it, and "I walk to the market for an hour" drafts no duration.
- Negative controls: 286 of 286 caught, with 18 new ones (G86–G103).
- The cumulative patch applies to a fresh copy of the original repository with `git apply`, reproduces this tree, and `npm test` passes there.
- The pass patch (`walk-pass.patch`) applies to section 28's tree and reproduces this tree.
- `docs/constants.md` regenerated.

## 30. The line as the player meant it (I1–I19, L1–L3)

The user wanted "extra layers to predict what the user is thinking": the written line is "just a layer of the semantics in our brain, … the lossy output", and they prefer "reconstructing from the input". Sections 26–29 read the written line ever more closely. This section adds a layer that rebuilds what the player meant before the grammar reads the line (src/rules/intent.ts). It is built on what is known about how listeners recover meaning from noisy, compressed speech, and on how speakers choose their words for a listener. Lossy lines in their scenes, read by section 29's reader and by this one: `meant-corpus.txt` beside this file. Line numbers are section 29's tree.

| What the player meets now | Before (section 29) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I punhc the gaurd." (a guard in the scene) is a blow at the guard; "I attakc Tom wiht my knife." an attack on Tom with the knife; each slip shown under the line | nothing routed, nothing drafted | the noisy channel: the meaning is the one that best explains the words given the context (Levy 2008, EMNLP; Gibson, Bergen & Piantadosi 2013, PNAS 110:8051); spelling as a noisy channel (Kernighan, Church & Gale 1990), slips one edit away (Damerau 1964); typists leave 1.167 % of characters wrong (Dhakal et al. 2018), so two slips are about 3 % as likely as one; the scene's words as the prior [ASSUMED share 0.5]; a preposition before a noun phrase (Levy's grammar-as-prior; CGEL ch. 7) | question-pass.ts 337 → intent.ts `respell` | I1–I5, I19 |
| "I hit the gaurd." with no guard in the scene, "I light the candel." with no candle, "I hit Thrain.", and quoted words are left as written | — | two words as near and no scene to choose: no reading is taken; a capitalised form may be a name | intent.ts `respell` | I3, I4, I5 |
| "I give the coin Tom." hands the coin to Tom | no hand-over drafted | the literal reading gives a person to a thing; deleted function words are the readings Gibson et al. found readers restore most (one-edit alternations, deletions above insertions) | intent.ts `droppedTo` | I6 |
| "Again.", "I do it again." repeat the last act; "I do the same to Will." does it to Will | nothing drafted | do with it, that or the same is an anaphoric VP; with to, the oblique is the one it is done to (CGEL ch. 17 §7.6 [51], p. 1532) | intent.ts `lastAct` | I7, I8 |
| "Will laughs. Tom shoves you hard. I hit him back." is a blow at Tom | the chooser asked among Tom, Will and the guard | back, "in repayment or retaliation" ("he hit me and I hit him back": Open English WordNet 2024) | intent.ts `returnedTo` | I9 |
| "Will glares at Tom. I tell him to leave." is told to Will (78 %), shown with "or…"; "I punch him." asks (a blow needs 90 %); "Tom and Will shove you. I punch him." asks | asked every time, by hand-set weights | an unstressed pronoun codes the referent in focus (Gundel, Hedberg & Zacharski 1993: 214 of 215 tokens of "it"); the Bayesian pronoun model P(r \| pronoun) ∝ P(pronoun \| r) · P(r) (Kehler et al. 2008; Rohde & Kehler 2014) with English pronoun rates for two people of one sex: 69 % for the last sentence's subject, 18.5 % for the other (Rosa & Arnold 2017, J Mem Lang 94, Exp. 2); a person outside that sentence about 1 % [ASSUMED from Gundel et al.'s ratio]; the mixed-initiative thresholds already in ask.ts (Horvitz 1999) | intent.ts `pronounWeights`; ask.ts 90 (`weight`); question-pass.ts 361 | I12–I14 |
| "I'm looking for the key." … "I search the desk." searches the desk for the key; the planner is told the goal | a search for nothing | goals persist in the reader's situation model until met or replaced (Zwaan & Radvansky 1998, Psychol Bull 123:162); goals inferred from what people do and say (Baker, Saxe & Tenenbaum 2009, Cognition 113:329) | intent.ts `statedGoal`, `forTheGoal`; question-pass.ts 380 (prompt) | I10, I11, I17 |
| The narrator's names ("Tom shoves you") are the scene's people even at a sentence's start | the scene list read a sentence-initial single name as any word | as frame.ts reads names: a given name or no common word | intent.ts `namedIn` | I15 |
| Every turn reads the line as meant; the planner gets "THE PLAYER'S LINE AS MEANT"; the note shows ☞ "punhc → punch" | — | implicit confirmation: a reading taken unasked is shown back so the player corrects it in their next line (Clark & Brennan 1991, already ask.ts's rule) | question-pass.ts 337, 380; ui.ts 31, 124; index.ts; style.css | I16, I17, I18 |
| "return", "unable", "recover", "reply", "dishonest", "injury", "inlet" (3,076 prefixed words) and "into" are words | not words to isWord, since the lexicon was built | the Hunspell dictionaries build these with prefix flags, and tools/build-lexicon.mjs kept only bare stems; restored where Open English WordNet lists the prefixed word; the grammar's prepositions added | lexicon.ts 21; tools/build-wordnet.mjs (`PREFIXED`) | L1, L3 |
| "Mara remembers how she rebuilt the coil." is left as written | — | a prefix and a word is a word (re- + built) | intent.ts `respell` | L2 |

Read through the reader:
- None of the 368 player lines in the tests, eval scenes and stories changes with no scene, and none routes or drafts differently.
- Of the 10 lossy lines in `meant-corpus.txt`, 6 now draft the act the player meant where section 29 drafted nothing or asked; 1 is taken with its alternatives shown; the search is read as a search for the key, with the planner told; 2 still ask, as a blow on a 78 % guess should.

Not covered yet:
- Real-word slips ("form" for "from") need a model of which word fits the sentence.
- "Them" for a group is still left to the scene.
- A stated goal fills only searches.
- The next-mention prior is flat (Bader & Portele 2019, German: 18 % and 20 %), not yet moved by who acted last.

Checked:
- `npm test` passes on TypeScript 5.6.3, and 6.0.3 emits the same `.js`: route 155, frame 176, intent 35 (new), engine 154, plan 58, size 9 of 9, ui 38, all with 0 misses.
- The intent checks cannot run on section 29's tree, because the module is new; the new engine (I1) and ui checks fail there.
- Negative controls: 308 of 308 caught.
  - The full run caught 305.
  - V7 and Q4 were retargeted, because the line they break was renamed (`said0` is now `typed`, read before the intent layer).
  - L1 was retargeted after the prepositions joined the lexicon.
  - Each of the three is caught on its retargeted line.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `meant-pass.patch` applies to section 29's tree and reproduces this tree.
- `docs/constants.md` was regenerated: 116 constants.

## 31. A second outside review, run (RV1–RV16)

The attached review (toba.pdf) reports 10 findings on section 30's tree. Its author ran no code and read half the sources. Each finding was run here, with the review's own test where it gave one, and checked against SillyTavern's source (`public/script.js`, release branch of 2026-09-14). Seven reproduced, three of them in another form than the review's. The table gives what the player meets now.

| What the player meets now | Before (section 30) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| A reply fails or is stopped; Send with the box empty runs the turn once (20 minutes stay 20). With the line edited first, it runs as edited (30, not 50). A new line instead keeps the stopped line's 20 minutes | 40 minutes; 50 for the edit | SillyTavern adds no message on an empty Send and starts a 'normal' generation (`script.js` 4447–4458), so the snapshot taken then held the turn's calls. The pass now starts every rerun of a turn from the line's own start, and a snapshot taken after a pass is marked and passed over | question-pass.ts (start of the pass), rules-tools.ts `restoreLineStart`, the `passed` mark in `onRulesGenerationStarted` | RV1, RV3, RV4 |
| The narrator called a tool; the player turns function calling off and swipes: one blow, the narrator's minutes gone. With function calling on: the tools' effects kept | two blows | after tool calls SillyTavern saves them as a message and starts Generate('normal') (5434–5435), and its snapshot holds their effects; with function calling off the tool message leaves the prompt (4496), so the pass runs again on the player's line. The review blamed the correction; the doubling needs none, and its fix still doubles in this order (run here) | the same restore | RV2 |
| A pause marked on "2:20 pm" keeps the clock at 14:20; "I do it again." after a stretched "shove" reads "I shove Tom." | 02:20; "I shove:: Tom." | index.ts notates the chat for the models before the pass; code now reads each player line from its words (the toolbar's codes or the typed signs), never from that notation. The review's form, hidden tag characters reaching a model, does not occur: every caller notates first | question-pass.ts `wordsOf`, `findStoryTime(pros.plain)` | RV5, RV6 |
| Backspace on the "I" of a marked "I—", "I…", "«I»", or Delete on "[I]", leaves no invisible block; "U.S.A." less its A keeps its marks | an unseen block before the dash, the ellipsis, the bracket | a word keeps its marks while a letter or digit is left in it, as `rewrite()` sets a block only on such a word | voice-code.ts `keyDelete` (`keeps`) | RV7, RV8 |
| '"Wait—{W not now W}"' whispers "not now", and the braces leave the words | "{W" left among the words, its closer taken off | quotation marks, brackets, dashes and ellipses may cling to a brace; a label is written apart from what it brackets ("{3V! ... 3V!}", Wikipedia, Voice Quality Symbols), so "{WhelloW}" stays as typed, as "{Fred}" must | prosody.ts `GLUED_OPENER`, the opener's and closer's classes | RV9, RV10, RV11 |
| "I’ll punch him." is a blow; "I won’t drink it." routes nothing; eight lines route the same typed with ’ or ' | nothing; Transfer ("won" read as win) | phone and Mac keyboards type ’; the router split words at it (the review's "I don’t hit him" routed nothing by luck) | router.ts `straight` | RV12 |
| The rule check's answer stays on the swipe it read: a swipe of the same words shown meanwhile gets no flags and no rewrite; an answer after the player wrote on stays on its reply | written on the new swipe, which was rewritten; the newest reply rewritten | the swipe read is kept with the answer, and a rewrite needs the reply to be the chat's last | rules-audit.ts `onRulesAuditMessage` | RV13, RV14 |
| A slip at 30 whose draw falls within 2.1–3.0 % says "Fragile" (12 of 1,500); a dog in 2 °C water reads the peak heat production as a judgement | never fragile; the peak never varied | AGENTS.md rule 5: a judged number is registered with its range. slipUnder45 0.025 (0.10 ÷ McNamee et al.'s fracture ratio 3.35–4.75), slipMiddleAge 0.05 (0.025–0.10), endoPeak 4.9 (mammals typically 4–8, Minnaar et al. 2014, J Exp Biol 217:1363) | rules-tools.ts BodyFall (`reaches`), thermal/endotherm.ts | RV15, RV16 |

Checked and left as they were:
- notateChat run twice keeps the codes; the review's own test passes. The comment on toNotation now says what reads its signs: the models, and prosody.ts for everything but › ‹, which typed are quotation marks.
- `extra.rulesResult` grows with the chat: 1.7 kB on the first of 20 scripted replies, 3.2 kB on the last, 51 kB in all. A branch or a deletion restores from it. Deleting it beyond the last 30 replies, the review's fix, would start a branch from an older reply in the wrong world, so it was not taken. Keeping older results as differences would bound the size and keep the restores exact.
- The review's other judged numbers have no source for a range here, and they stay listed in docs/constants.md under "Assumptions not yet registered" (325). They are the full-thickness burn dose, the skin depth, the substance thresholds, the fact-overlap share and the spread of trust. The burn literature checked puts full thickness at a dose of 1 at the dermis base (Majchrzak & Jasiński 2003), not 10⁴ at the surface.

Checked:
- `npm test` passes: route 156, frame 176, intent 35, engine 159, plan 58, size 9 of 9, ui 40, all with 0 misses.
- Every new check fails on section 30's tree: route 1, ui 2, engine 5.
- Negative controls: 324 of 324 caught.
  - The full run caught 320.
  - H2, R11 and Q11f were retargeted, because the lines they break were rewritten.
  - R1's test was extended, since the pass's own restore now also covers the regenerate it guarded. It now checks the world at the generation's start: a call the stopped reply made is gone before any pass runs.
  - Each of the four is caught.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `review-pass.patch` applies to section 30's tree and reproduces this tree.
- TypeScript 5.6.3 emits the same `.js` as 6.0.3.
- `docs/constants.md` was regenerated: 119 constants.

## 32. A third outside review, run (RW1–RW15)

The attached review (many.pdf) reports 9 findings in full on section 31's tree, and two more in its table. Its author ran no code. Each finding was run here with its own test; all nine reproduced as tested. Three happen only in an order SillyTavern's Send button does not use: a line that joins the chat before the generation starts, as `/send` then `/trigger` does. Send starts Generate first and adds the line inside it (`script.js` 1764, 4299, 4453), which the review's tests reverse. They are fixed for that order.

| What the player meets now | Before (section 31) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| Swipe back to an earlier swipe: `/rules-replay` rebuilds the world shown, and earlier turns keep their entries | "Replay does NOT rebuild the state" | the record follows the swipe shown: the turn's changes as the later swipe made them go, and one "swipe shown" entry holds what the swipe shown changed (a reply keeps only the state it ended with) | rules-tools.ts `onRulesSwiped`, world-log.ts `rebuilt` | RW1, RW2 |
| A "no, Will" sent with `/send` before `/trigger`, its reply stopped and regenerated: Tom stays unstruck | Tom struck again | the restored world is kept at both places a start is looked for: the line's own and, with the line in, the reply's | rules-tools.ts `restoreTurnStart` | RW3 |
| A regenerate of a line `/send` put in starts at that line's start, before any pass runs | a call the stopped reply made stood until the pass ran | the reply's place first, as `restoreLineStart` looks | rules-tools.ts regenerate branch | RW4 |
| Delete a line, set `/rules-time`, send a new line in its place: the time stands | the deleted line's start restored over it | a deleted line takes its pass with it, so a new line at its place is a new turn | rules-tools.ts `syncRulesToChat` | RW5 |
| The picker's and the planner's prompts never carry hidden characters, whoever calls them | they relied on index.ts notating first; `/rules-eval` does not (its scenes hold no marks today) | each message in the notation inside the prompt builder; a notated line comes back as it is | question-pass.ts `shown` | RW6 |
| "I tell the old blind beggar, …", "I tell the drunk sailor, …" are speech to them | nothing drafted ("the old" read as the listener) | the listener is the noun phrase up to the last word naming a person, an animal or a group of people, at most three words, none a preposition or conjunction | frame.ts `speech` | RW12 |
| "I shout to the crew", "I call to the patrol", "I tell the (town) council" are speech; "I tell the table", "I hit the board" draft nothing | nothing drafted for the groups | a group of people: a noun whose first sense WordNet files below social group ("people sharing some social relation") or people. That covers 359 nouns, crew, patrol, council, jury and crowd among them; table, class and herd are not. A blow still needs a person | build-wordnet.mjs kind h, nouns.ts `peopleGroup`, grammar.ts `recipientAt` | RW13, RW14, RW15 |
| "the WHO", "the IT desk", "the OR", "the ER", "in LA", "in HR" stay as written; "WHO did this?", "Get IT away!", "MA!" are louder | all read as louder words, lowercased ("the who") | pronouns do not permit determiners ("*the they": CGEL ch. 5 §10.2, p. 429). LA, DC, HR, PR and ER are letters the lexicon also holds as words no one shouts [ASSUMED list] | prosody.ts `DETERMINER`, `NO_NOUN`, `ABBREVIATIONS` | RW9, RW10, V2 |
| A pause marked 2 s is titled "pause, 2 s" | every timed pause titled "half a second" (true for the toolbar's, its only timed pause) | the title from the pause's own code | voice-code.ts `typeset`, ui.ts `drawVoice` | RW7, RW8 |
| A line selected and copied from the chat is the player's words | "angrily", "inhales" and the pause's dot copied in | the typesetting's added words are not selectable | style.css `.rules-v-add` | RW11 |

Checked and left as they were:
- "I work in IT" still reads a louder "it", since "in it" is English; the note under the line shows it.
- SillyTavern's edit box takes the saved message (`script.js` 8278), not the page's text, so the typesetting changes no edit. Typesetting a line twice finds no hidden marks the second time.
- The voice toolbar is built once, at start-up, only when absent, so its listeners are never added twice (the table's F9).
- After a swipe back, the call count (`s.calls`) seeds the next turn's draws differently. A draw is drawn either way, so no outcome is wrong for it.

Checked:
- `npm test` passes: route 156, frame 185, intent 35, engine 164, plan 58, size 9 of 9, ui 43, all with 0 misses.
- Every new check fails on section 31's tree: frame 5, ui 3, engine 5. The hand-over to the crew is the exception, a guard for the new kind: it passed before as a plain group.
- Negative controls: 339 of 339 caught in one full run. V2 and Q6c were retargeted first, because the lines they break were rewritten.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `third-review-pass.patch` applies to section 31's tree and reproduces this tree.
- TypeScript 5.6.3 emits the same `.js` as 6.0.3.
- `docs/constants.md` was regenerated: 119 constants.

## 33. The state over time, checked all at once (RX1–RX10)

The user asked whether the bugs were endless. They are a long tail, and the state bugs in it are one class: a turn applied twice, or an outcome lost or kept wrongly, along some path through SillyTavern's events. This section checks the class at once instead of path by path.

**The check: `tests/sequences.test.mjs`.**
- It plays random chats through the events SillyTavern fires, in its own order (`public/script.js`):
  - Send: GENERATION_STARTED fires before the line joins (4299, 4453).
  - An empty Send.
  - A stop.
  - `/send` then `/trigger`.
  - The narrator's tool calls, saved as a message and followed by a 'normal' generation (5434–5435).
  - Regenerate, swipe, swipe back, deleting the last messages, and an edit of the last line.
- After every step the world must equal one rule read from the visible chat: the start, plus each player line's outcome from its last pass, plus each narrator call whose message is in the chat. The lines are "I wait N minutes." and the narrator's calls are PassTime or RecordFact (facts sharing no word), so the clock and the facts are exact.
- The record of changes must also rebuild the state.
- A failing sequence is cut to its fewest steps.

| What the player meets now | Before (section 32), as the sequences found it | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I wait 4 minutes", reply, delete the reply: the clock stays at 604, and a new line adds to it | 600 (142 of the 206 failing sequences: an outcome lost when a reply was deleted) | the line stays in the chat for the narrator to read, so its outcome stands: a line keeps the world its pass left, and a deletion puts back the world of the last message holding one | question-pass.ts `keepResult`, rules-tools.ts `syncRulesToChat` | RX1, RX2, RX7 |
| A line `/send` put in, then deleted with no reply: its minutes go | kept (49 sequences) | the greeting and a narrator's tool call keep their world when a generation starts from them, so there is always a message to go back to | rules-tools.ts `onRulesGenerationStarted` | RX3 |
| A `/send` line stopped and sent again with an empty box runs once | twice (4 sequences) | the line's start is kept when its first pass runs (`lineStart`), whichever order it joined in | question-pass.ts, rules-tools.ts `restoreLineStart` | RX4 |
| After the latest line is deleted, an empty Send on the line before runs it once | twice (a class the first round of this fix caused) | a line whose pass ran is started again from the world of the message before it | question-pass.ts `passRanFor`, rules-tools.ts `restoreLineStart` | RX5, RX6 |
| `/rules-replay` rebuilds the world after deletions, swipes and retries | did not (11 sequences, the clock or the facts) | after a restore, one entry holds whatever difference the record no longer covers | rules-tools.ts `settle` | RX8, RX9, RX10 |

Run with the fix: 0 failing sequences in 300 of 24 steps (part of `npm test`, 11 s), and in 6,000 of 40 steps on six seeds. Each class has a named case in `tests/engine.test.mjs` (R36–R41).

Code the line's start made redundant was taken out, so no line stands unguarded:
- Two "restored" entries the sequences never needed: one in a correction's restore, one in the fallback for chats from before results were kept on every message. R2's test now builds such an older chat.
- The snapshots marked `passed` (section 31).
- The snapshots a correction wrote at its line's and its reply's places (section 32).

The full control run showed their controls (RV3, RV4, RW3, N66's) no longer caught, because the kept start does their work.

One case is no longer covered: a chat saved by an earlier version in the middle of a corrected turn, whose reply is then swiped, starts that swipe from the undone reply's world.

Not covered by the rule:
- A deletion in the middle of the chat: the later replies were written on the world as it was, so it stands.
- `/rules-time` between turns.
- Function calling switched off mid-chat (R27 covers its main case).
- Corrections.

Checked:
- `npm test` passes: route 156, frame 185, intent 35, engine 170, plan 58, size 9 of 9, ui 43, sequences 300 with 0 failing, all with 0 misses.
- On section 32's tree, 206 of the same 300 sequences fail, and 4 of the 6 new engine cases (R36, R37, R38, R40) fail.
- Negative controls: 345 of 345 caught.
  - The first full run showed four controls no longer caught; their code was taken out, as above.
  - The second full run caught 344. RX6 was caught once R39 gained its `/send` case, where only the world of the message before the line gives the start.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `sequences-pass.patch` applies to section 32's tree and reproduces this tree.
- TypeScript 5.6.3 emits the same `.js` as 6.0.3.
- `docs/constants.md` was regenerated: 119 constants.

## 34. A fourth outside review, run (RY1–RY26)

The attached review (New.pdf) reports 10 findings on section 33's tree. Its author ran no code. Each finding was run here with its own test, transcribed in `review-tests/review4.test.mjs`, and checked against SillyTavern's source. Seven reproduced as reported, one in part, and two did not. The run before and after the fixes is in `review-run.txt`.

The review's suggestion matches the fix: each line keeps its own start. The controls then showed five parts of that fix that no test reached. The cases written for them found two more state bugs, fixed here too. Every new check fails on section 33's tree: engine 11 of 11, frame 2 of 2, ui 2 of 2.

| What the player meets now | Before (section 33) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I hit him." (Tom), "no, Will", a later line deleted, the correction's reply swiped: Tom stays unstruck | struck again: the correction's line started from the reply before it and was read afresh | each player line keeps the world it starts from (`extra.rulesStart`, a correction's once the world is put back) and its pass (`extra.rulesPass`) | rules-tools.ts `keepStart`, `restoreLineStart`, `keepPass`; question-pass.ts | RY1, RY2, RY8 |
| The same swipe, at its start, before any pass runs: Tom unstruck | struck: the snapshot was taken before the correction ran | a swipe of a reply right after a line starts from the line's start | rules-tools.ts rewrite branch | RY3 |
| The first turn deleted, then the last reply swiped: 630 (after a tool call, 635) | 620 (610): a snapshot by chat position, which the deletion moved | the line's start, or the world the last tool message keeps; the record cut by its count of changes | rules-tools.ts rewrite branch, `restoreAt`, `onRulesSwiped` | RY4, RY5, RY7 |
| An earlier turn deleted, then "no, Will": the blow moves to Will, the first wait stands | read as a new line, Tom struck again: the engine dropped its latest pass once the count of lines fell (found by RY6's case) | a correction reads the pass the line before keeps, and puts back that line's start | question-pass.ts correction, rules-tools.ts `restoreTurnStart` | RY6, RY26 |
| A pass that stopped after its calls ran (the model did not answer the next round), then Send with the box empty: the turn runs once, 607 | twice, 614 (found by RY9's case; in section 33 too) | a line that keeps a start is started there again | question-pass.ts `hasStart` | RY9 |
| A chat saved by section 33: its latest line still starts from the engine's start | — | `lineStart` read when the line keeps none | rules-tools.ts `restoreLineStart` | RY12 |
| A long chat holds about one world per reply | one per message (the review: tens of kilobytes each) | player lines and tool messages more than 30 messages back let go of theirs; replies keep theirs, for a deletion back to one or a branch from it | rules-tools.ts `prune` | RY10, RY11 |
| "A sailor walks in with a lantern. I punch him." strikes the sailor; "I sit at the bar with my brother. I punch him." strikes my brother; "I talk with a monk …" names "the monk" | no blow; "the bar" struck; "the a monk" | the phrase after to, at, with, from, ask, tell, greet or give counts only when its words name a person or an animal, as a blow's object is read, and it is no pronoun; one met as "a monk" is "the monk" (CGEL ch. 5 §6.1 [6iii], p. 370); the phrase's second word is read ahead | frame.ts `namedBefore` | RY14–RY17 |
| "I punch **Tom**.", "I talk to *Rob* …", "I _whisper_ to Will", "I wait *ten* minutes." draft their calls; "again" after "*I punch Tom.*" reads "I punch Tom." | nothing drafted; the asterisks on the note | in SillyTavern * and _ mark actions and italics; a paired run around words goes, a _ only at a word's edge, as CommonMark reads emphasis ("foo_bar_" is none) | frame.ts `unEmphasis`, `inStory`, `framedCalls` | RY21, RY22 |
| "my PIN", "the SWAT team", "an LED lamp", "She has AIDS.", "My SIM card." stay as written; "PIN him down!" is louder | all louder, lowercased ("my pin") | AIDS and SIM are dictionary nouns written in capitals; PIN, SWAT and LED are nouns that also spell a verb said louder, so they stay as written after a determiner or a possessive (Merriam-Webster; Oxford Learner's Dictionaries) | prosody.ts `ABBREVIATIONS`, `NOUN_ABBREVIATIONS` | RY18, RY19 |
| "D-:" is a face | a cut-off "D-" | a hyphen before a colon is no clause's end | prosody.ts cut rule | RY20 |
| A head-first fall: 1.5 m 0 %, 8 m 41.1 %, 8.4–11.9 m 44 %, 12 m 56 %, 15.6 m 78 %; head first on soft ground is the row itself | 44 % from 0.6 m to 11.9 m; head first alone counted with soft ground | rule 576: head first one row down, soft ground one row up. Under the first row a row is one storey, 3.6 m, the rows' spacing [ASSUMED], as soft ground already was | body-engine.ts `fallBase` | RY23–RY25 |
| `/world-add` sends the line's words | the hidden voice marks went to the model, and into an entry saved from no answer | the marks say how a line is spoken, which an entry does not hold | index.ts `addEntry` | RY13 |

Checked and left as they were:
- Reloading the extension in place (the review's 8): SillyTavern adds an extension's script only when no script of that id is in the page (`extensions.js` 823), and a module runs once, so the settings and listeners are not added twice.
- A tap on a phone (also the review's 8): by the Touch Events order a tap fires mousedown after touchend, at the touch's place, and the handler cancels it, so the focus stays in the box. Not run on a phone here; the review gives no trace.
- Toasts (part of the review's 4): SillyTavern sets toastr to escape HTML (`script.js` 360), so a quote or an entry shows as text.
- The 160 in the speech index's level distortion (in the review's 9) is ANSI S3.5-1997's own constant, cited in acoustics.ts's header.
- Soft ground gives 56 % at 19.2 m and 78 % just above it (the review's 9). That is rule 576's table read one row up: 78 % at 19.2 m, all above.
- "WE" read louder and "US" kept as the United States (the review's 6): the list's choice, and the note under the line shows it. RAM stays louder ("RAM the gate!").
- Hidden marks in story facts (part of the review's 4): the model writes the facts, and it reads the notation, so they hold none.
- "the swat team" routing a blow (the review's 6), and "*Tom punches him.*" read as Tom striking himself (the review's 7): neither reproduced. A blow needs a creature after its verb, and code drafts no call for another subject's act.

Checked:
- `npm test` passes: route 156, frame 188, intent 35, engine 181, plan 58, size 9 of 9, ui 45, sequences 300 with 0 failing, all with 0 misses.
- Random sequences: 0 failing in 1,000 of 40 steps on each of six seeds.
- Negative controls: 369 of 369 caught in one full run on the final tree.
- Controls brought up to date:
  - R9, R15, Q4b, RV1, RV2, RW10, RX6 and RX9 were retargeted to their rewritten lines.
  - R13's case gained an unclosed asterisk, since paired ones now go first.
  - R15 and R39 gained an older-chat case, which the snapshot and prior-message fallbacks serve.
  - RX4's line is gone; RY8 breaks its successor. RX10 broke the same line as RX9 (now one settle in `restoreAt`), so it was taken out.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `fourth-review-pass.patch` applies to section 33's tree and reproduces this tree.
- TypeScript 5.6.3 emits the same `.js` as 6.0.3.
- `docs/constants.md` was regenerated: 119 constants.

## 35. A fifth outside review, run (RZ1–RZ24)

The attached review (New1.pdf) reports 9 findings in full on section 34's tree, and 11 rows in its table. Its author ran no code. Each finding was run here with its own test, transcribed in `review-tests/review5.test.mjs`, and checked against SillyTavern's source. All nine reproduced, the first in a corrected case. Of the table's other rows, the dialogue left in an Act's action reproduced and is fixed with the fifth; four did not. Writing the tests found three more defects, fixed here too. The run before and after the fixes is in `review-run.txt`. Every new check fails on section 34's tree: engine 6 of 6, frame 2 of 2, route 1 of 1, intent 1 of 1, ui 3 of 3.

| What the player meets now | Before (section 34) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I hit him." (Tom), "no, Will", the first turn deleted, the correction's reply swiped: the blow stays at Will, the same blow, and the narrator is told of the correction; the model is not asked | the blow at Will lost, the line read afresh | a line's kept pass matches while its words are the same (the turn key's place, the count of lines, moves with a deletion before it); the draws follow the line's words and the call count | question-pass.ts, turn.ts `lineOf`, rules-tools.ts draws | RY2, RZ1, RZ3 |
| An edited "no, Will!" swiped corrects the line before it | it corrected itself: Tom stayed struck (found by R51's second case) | the line before it in SillyTavern's chat, which still holds the reply a swipe rewrites | question-pass.ts correction | RZ2 |
| "I look at Tom and Will, then I punch him." asks "Punch Tom or Will?" | nothing asked; the planner chose | "him" with two or more named before it who fit is one of them, the line leaving which open (grammar.ts antecedent) | ask.ts `targetQuestion` | RZ13 |
| "I look at Tom. I punch him." with Will and Bob also in the scene asks nothing: him is Tom | "Punch Bob or Will?" (found by R55) | one named before it who fits is the one meant, as frame.ts reads it | ask.ts `targetQuestion` | N61b, RZ12 |
| No hidden tag character reaches a model, whether from a card, a fact or a reply | only the player's lines were turned into notation | every way out takes out the whole Tags block (U+E0000–U+E007F): the engine's requests, the narrator's prompt, the tools' results | voice-code.ts `untagged`, send.ts, index.ts, rules-tools.ts | RZ8–RZ11 |
| "Er sagte: ›Climb the wall!‹" routes Communicate, no climb; "I say to Tom, «Run away!»" gives the message; a slip inside quoted words stays as said, one after them is respelt | guillemets and „…“ were no quotes: their words routed as acts and were respelt; a slip after a closed "…" was taken as inside it | one set of quotation marks for every reader: "…", “…”, „…“ and ‚…‘, »…« and ›…‹, «…» and ‹…› (German and Swiss rules: Bier 2006, typokurz, §2; the Unicode names of U+2039, U+203A); single ‘…’ and '…' left to apostrophes | quotes.ts; router, frame, intent, grammar, prosody, verbs, actions, scene-people | RT2, G59, I5, RZ16–RZ20 |
| "›War-‹", "(wai-)", "‘Sto-’", "«Sto-»" are cut-offs; «STOP!» I shout is loud speech | read as plain words; raised, the words outside the guillemets counted as speech | a closing mark or bracket ends the word as the line's end does; the speech is the words in any quotes, a quote left open running to the line's end | prosody.ts cut rule, `spoken` | RY20, RZ21–RZ24 |
| An Act's action starts at its motion verb: "walk 10 m to the gate.", "walk 10 m to the door." | "Today I walk 10 m to the gate.", "punch Tom. I walk 10 m to the door.", and "… Hello there." on the note | the action as the Act tool takes it (actions.ts MOTION_START), without the sentences after it that make no move; the verb read outside quoted words | frame.ts `motion` | R13b, RZ14, RZ15 |
| A burn near full thickness says it is fragile; the drowning band 5.5–10 min reruns over its range | unregistered numbers | full thickness at Ω ≥ 10⁴ (Wang, Foley & Zhou 2024, arXiv 2408.11947, eq. 10, after Pearce, Diller & Valvano 2017 and Orgill et al. 1998), applied to the one skin node's integral, range an order of magnitude; the drowning band as derived, range a quarter to three quarters of the past-5.5 group in 5.5–10 | thermal/exposure.ts `fullBurnOmega`, body-engine.ts `drownMidGood` | RZ6, RZ7 |
| A long chat holds one world per reply | old replies kept one per swipe | only the last message can be swiped | rules-tools.ts `prune` | RY10, RY11, RZ4, RZ5 |

Checked and left as they were:
- The review's own first case: its correction never took effect, since the scene's last two messages did not name Will, and a correction reads the people they name (as the question for "I hit him." does). Its swipe now repeats that turn as it was. R51 builds the case with Will named.
- An edited line regenerated after a later turn is deleted runs its edited words (the table's 1): its words no longer match the kept pass.
- [DECIDED] on a correction turn and after a narrator's tool call holds the redo and its outcomes (the table's 3).
- The drowning band's derivation (the table's 9) holds under its stated reading. The review's 37.3 % subtracts the past-10 group from the past-5.5 group; they come from different pools of cohorts (2,313 people against 1,981, and 1,019 under 10 min against 1,075 under 5.5 min).
- The sound levels (the table's 10): 85 dB at 1.8 m is 90.1 dB at 1 m, and 67.5 dB at 10 m is 87.5 dB, as the comment gives them.
- The skin's conduction (370 W/m²K) and its thermal properties (0.37 W/m/K, 1,100 kg/m³, 3,400 J/kg/K) stay listed as candidates in `docs/constants.md`; no primary table for them was reachable here. AGENTS.md now says the registry rule is for new judgements, and the older ones in comments are listed as candidates (324 of them now; `docs/constants.md` already listed them).

Checked:
- `npm test` passes: route 157, frame 193, intent 36, engine 187, plan 58, size 9 of 9, ui 48, sequences 300 with 0 failing, all with 0 misses.
- Random sequences: 0 failing in 1,000 of 40 steps on each of six seeds.
- Negative controls: 393 of 393 caught. The full run caught 390; R13, Q9 and G84 had been caught only through the words the old action carried before its verb ("will just walk…"), and gained cases where their rules still act (a trailing asterisk; a climb or an auxiliary in a model's own action), after which they and every frame control (99 of 99) were caught again. Nine were retargeted to their rewritten lines (N61b, R13b, RT2, G59, I5, RY2, RY10, RY11, RY20); RY2 is now caught by R51, since a correction re-read after a deletion is also right now.
- The cumulative patch applies to a fresh copy of the original repository with `git apply` and reproduces this tree, and `npm test` passes there.
- `fifth-review-pass.patch` applies to section 34's tree and reproduces this tree.
- TypeScript 5.6.3 emits the same `.js` as 6.0.3.
- `docs/constants.md` was regenerated: 121 constants.

## 36. A sixth outside review, run and converged (RS1–RS16)

The attached review (ss.pdf, an e-mail draft) reports 12 findings on section 35's tree. Its author ran no code. Each finding was run here with its own test, transcribed in `review-tests/review6.test.mjs`, and the areas of its brief (A–H) were reviewed again here, apart from it. Eight of its findings hold (its 2 in a narrower case, its 4 in a broader one), its 12 holds as a measurement whose diff would lose state, and its 3, 9 and 11 do not hold. This review found eight more. The converged review, in the brief's seven sections, is `sixth-review.md`; the runs are in `review-run6.txt`. Every new check fails on section 35's tree: engine 5 of 5, frame 3 of 3, route 1 of 1, intent 1 of 1, plan 1 of 1, ui 3 of 3, and the browser's Tab check.

| What the player meets now | Before (section 35) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| A question pass that fails after its calls ran (a rate limit on the follow-on round) takes them back; the narrator's tools decide the turn once | the calls stayed and the narrator ran them again: an hour waited became two | README: function calling is the fallback when the pass fails; the line's start (`restoreLineStart`) | question-pass.ts `runQuestionPass` → `passOnce` | RS2, RY9 |
| "I wait 5 minutes." edited to "no, Will" and its reply swiped: Tom 0, Will 1 | Tom 1, Will 1 | the world a correction put back is its line's start | rules-tools.ts `keepStart(i, put)`, question-pass.ts | RS1, RY8 |
| Another chat opened while a tool waits (sky, weather, a bleed, chemistry data): the call decides nothing | the call wrote into the chat opened: a new body, a history on the other chat's world | a call belongs to the chat it started in | rules-tools.ts `run`, `exec` | RS3 |
| "It is 20 °C outside." has no marks | "quieter: C outside" went to the planner and the narrator | a degree sign before C, F or K is a unit | prosody.ts lead signs | RS10 |
| "Tom (35)", "the year (1850)" stay words | "pause 1850 s after year"; the numbers left the line | a timed pause carries its decimal point (Jefferson's tenths of a second) | prosody.ts pause | RS9 |
| A rule-check redo that never started leaves its note and flags to no other turn or chat | the next chat's narrator got the old correction | the note and the flags carry the turn key | rules-audit.ts, audit-flags.ts, question-pass.ts | RS4, RS5 |
| "I drop the sword", "I trip the guard", "I fall asleep" route no fall | BodyFall | a verb of falling with an object, or with a predicative complement (CGEL ch. 4 §5), is no fall of the body | router.ts | RS12 |
| "I shout to Tom with all my might", "I tell Tom about my plan": no message from code | Tom "learned" "with all my might" | a manner or a topic after the listener is no message; "ask … for a pound of apples" keeps its message | frame.ts `speech` | RS7, Q6d |
| "I nod to Ann and hit him back." reads Tom, who struck | the player was asked "Hit Tom or Will?" | only a person of the pronoun's sex named before it settles it | intent.ts `pronouns` | RS11 |
| "*I punch **Tom**.*" strikes Tom; "2*3" stays | no blow | emphasis runs read longest first, a run's words never start or end with its own sign | frame.ts `unEmphasis` | RS8 |
| "No, Will, ›run!‹" is an ordinary line | read as a correction, the last turn redone at Will | a line quoting in any of quotes.ts's marks is no correction | ask.ts `correctionOf` | RS6 |
| A plan whose message holds a brace (":}", a whispered "{W …") still reads | the whole plan was dropped | braces inside a JSON string are text | question-pass.ts `rawPlan` | RS15 |
| A mark on «Stop» is written «Stop-» and underlines the word only | «Stop»- | one word-splitting pattern with every quotation mark, bracket and dash | voice-code.ts `WORD_PARTS`, ui.ts | RS13 |
| PassTime stops at the second someone comes to (18 s) | at the minute's end | the knockout's drawn time inside the minute | body-engine.ts `advanceAll` | RS14 |
| "Tom laughs at me. I glare at him." looks at Tom | target "him" | the person the grammar finds, as for blows | frame.ts `perceiving` | RS16 |
| Tab from the message box enters the voice toolbar while it shows | focus went to the send button and the toolbar hid | the toolbar stands before the form in the page's focus order | index.ts `buildVoice` | browser check |

Checked and left as they were:
- ss.pdf 3: a missed Look's sighting changes no lineup (`faceStrength` is 0 for any sighting without the face made out), and "never made out Rob's face" is true of a miss.
- ss.pdf 9: in Chromium's touch emulation a tapped toolbar button marks the selected words and the box keeps the focus; its test greps the source.
- ss.pdf 11: `reach()` gets only speech efforts, more than 100 dB below the level where the SII's level distortion turns negative.
- ss.pdf 12: one world kept per reply grows the saved chat with the square of its length (1.09 MB at 120 turns); its diff drops the pulse tracks a deletion back needs, so a bound is left as the next job (section 7 of `sixth-review.md`).

Checked:
- `npm test` passes: route 158, frame 196, intent 37, engine 192, plan 59, size 9 of 9, ui 51, sequences 300 with 0 failing, all with 0 misses. One check changed its expectation: a pass that failed after its calls ran left the clock at 607 (the calls stood); it now leaves 600, and its resend case moved to a pass stopped by a chat change, where RY9 still catches the start restored.
- Negative controls: 409 of 409 caught (`negative-controls-run.txt`), the 16 new (RS1–RS16) among them; Q6d and RY8 retargeted to their rewritten lines; RY9 caught by its resend case.
- Random sequences on this tree: 0 failing in 1,500 of 40 steps on each of seeds 7 and 8.
- Chromium (Playwright, a stand-in SillyTavern page loading the extension's `index.js`): typesetting twice gives the same HTML, Backspace keeps the marks on the word, Ctrl+Z restores, a touch tap marks the words, Tab enters the toolbar.
- `sixth-review-pass.patch` applies to section 35's tree; `credibility-first-edits.patch` applies to the first upload (section 35's tree with the earlier cumulative patch reversed) and reproduces this tree; the zipped tree builds with `npx tsc -p .` from a fresh unzip and passes its tests.

## 37. What else: the sixth review's open items, two more corpora, the world kept per reply (RA1–RA15)

The player asked what else. Section 36's open items were run, and two more corpora of ordinary roleplay lines (60 everyday acts, 30 multi-sentence lines) went through the reader; each wrong reading below is one of them. SillyTavern's source (release, 06bde93) was read for every other way a request reaches a model. Every new check fails on section 36's tree: route 2 of 2, frame 2 of 2, plan 1 of 1, ui 3 of 3, engine 1 of 1.

| What the player meets now | Before (section 36) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I sit by the fire for an hour" passes the hour; so do "hide … for ten minutes", "lie … for 20 minutes" | code settled the Act, the planner was skipped, and the hour never passed | a for-phrase gives the duration of a state or an activity (CGEL ch. 3 §3.2.3, as for a timed walk) | frame.ts `waiting` | RA9 |
| "I swing my axe at the orc", "I thrust my spear at the guard": BodyStrike offered | Act only: the blow was decided by no one | the conative "at" is an attempt to hit (Levin 1993 §1.3); at a thing, a motion | router.ts | RA6 |
| "I give Will 3 coins" hands three coins | no hand-over drafted ("three coins" worked) | a cardinal numeral is a determinative (CGEL ch. 5), in figures or in words | grammar.ts `DET`, quantity | RA7 |
| "I pour Tom a drink", "I blow out the candle": no Weather | Weather | weather verbs report weather with "it" as subject (Levin 1993 §57) | router.ts | RA1 |
| "I stab Tom": BodyStrike only; "I strangle the guard": BodyChoke; "I drown the rat": BodyEnvironment; "I poison the wine": Substance | every verb of Levin's 42.2 offered Substance | Levin 1993 §42.2, verbs of killing by a means: the means names the tool | router.ts `CLASS_TOOL`, `VERB_TOOL` | RA2 |
| "I pick up the lantern": Transfer, no eating; "I light a candle": no treatment; "I draw my sword": a motion | BodyIntake; BodyTreat; SocialResponse and Break | VerbNet files phrasal verbs as entries of their own (pick_up apart from pick) | router.ts `VERB_TOOL` | RA3 |
| "I take a seat" a motion; "I break the silence" speech; "I force a smile" nothing; "I sneak, slip, creep or steal past the guard": Act and Look | Transfer; Break; BodyCheck; Transfer or BodyFall | set phrases read by what they mean, as the breath and lock phrases are | router.ts phrases | RA4, RA5 |
| "I ask Tom for the key, and he gives it to me": the words said are "for the key" | Tom "learned" "for the key, and he gives it to me" | a clause with its own pronoun subject joined on after a comma is another act; a name after "and" may be part of the words | frame.ts `speech` | RA8 |
| "I SHOUT AT WILL TO RUN!" is said to Will | "will", and no listener | the story's people keep their capitals in a line shouted in capitals | prosody.ts `readProsody(line, names)`, question-pass.ts | RA11 |
| Every request to a model leaves with hidden marks as notation, whoever built it | the summary's raw prompt sent the saved lines with their tag characters | SillyTavern emits CHAT_COMPLETION_SETTINGS_READY (openai.js:3146) and TEXT_COMPLETION_SETTINGS_READY (textgen-settings.js:1847) for every request; the summary's raw builder reads `chat[i].mes` (memory/index.js:795–804) | voice-code.ts `notateRequest`, index.ts | RA10 |
| A feeling mark keeps the words the player selected | the selection moved to the first word, and the next mark went there | the feeling belongs to the line; the selection is the player's | voice-code.ts `markWords` | RA12 |
| The world book's draft reads a brace inside a value | the draft was dropped | braces inside a JSON string are text (one reader for the plan and the world book) | json-text.ts, world.ts, question-pass.ts | RA13, RS15 |
| Each reply's world is kept as the changes from the one before it, in the chat's archive; 120 turns: chat 0.20 MB (was 1.09), metadata 0.64 MB (was 0.44) | a whole world on every reply: the saved chat grew with the square of its length | a message holds its world's id, so a deletion anywhere leaves every other world readable; worlds no message reaches go; a whole world every 50 [ASSUMED: at most 50 diffs read] | rules-tools.ts `putWorld`, `worldOf`, `collectWorlds`, `keepResult`, `savedFor`, `prune` | RA14, RA15 |

Checked and left as they were, with the lines that would change:
- Several blows in one turn ("I punch Tom and Will", "I hit the guard twice", "I punch Tom, then Will"): one is decided. The plan holds one call per tool and subject (plan-schema.ts:32–45 `callsFromKeyed`, 68–92 `planSchema`), BodyStrike is keyed by its attacker (plan-schema.ts:26), `dedupe` merges identical calls (question-pass.ts:90–91), and frame.ts `striking` drafts one blow. A list per attacker, with a blow's number in its arguments, would change all four; it needs a live model run under constrained decoding.
- "I want to punch Tom" drafts the blow (frame.ts `byPlayer`: no NP between the verbs, so the subject's act). Whether a stated wish is an act is the player's choice, open since section 27.
- Verbs of hitting at a thing ("I knock on the door", "I kick the ball", "I slap the table", "I hit the wall") still offer BodyStrike; frame.ts drafts no blow without a creature after the verb (verbs.ts `creatureAfter`), and the planner's call at a thing is refused by BodyStrike.
- Sounds without words ("I sigh", "I scream", "I whistle a tune") route Communicate through VerbNet's manner_speaking-37.3.
- SillyTavern's vector storage embeds the saved lines with their tag characters; it is no language model, and no event carries its requests.
- Backspace on Android keyboards that send key "Unidentified" (index.ts:384–395 reads `e.key`); a `beforeinput` handler on `deleteContentBackward` would cover them, untested here without a device.

Checked:
- `npm test` passes: route 160, frame 198, intent 37, engine 193, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses. Two existing checks name the field a reply's world is kept in (`rulesWorld`, was `rulesResult`); a chat saved before reads its whole worlds as before.
- The 92 lines of the two corpora: the readings that changed are listed in `section-37-run.txt`; each is one of the table's rows.
- Random sequences: 0 failing in 3,000 of 40 steps on seed 11; 0 failing in 3,000 of 40 steps on seed 12.
- Negative controls: the 15 new (RA1–RA15) and the 2 retargeted (RS15, H6) each caught. The full run (`negative-controls-run.txt`): 423 of 424 on the first pass; Q11e ("a shot") was not caught, because its line "I shoot the deer with my bow" needs BodyStrike only and, with the poison route gone, the shoot entry's removal left that line passing. Its case is now "I shoot the guard with my pistol" (BodyCheck, a handgun's shot_m) and its break a shoot entry naming BodyStrike alone; caught. 424 of 424.
- Chromium (Playwright, the stand-in page): the toolbar's Tab, Backspace and touch checks pass; a chat-completion request passed to the extension's two handlers leaves as "I say STOP now".
- `section-37.patch` applies to section 36's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 38. Shots by every wording, fire by its object (RB1–RB11)

Q11e's trail: with the shoot entry removed, "shoot" still routed BodyStrike, through its FrameNet frame. A FrameNet shot route (Hit_target, Use_firearm, Shoot_projectiles) names two tools, "BodyStrike (launcher, skill, distance_m), or BodyCheck with shot_m for a handgun" (verbs.ts `SHOT`), and the router kept its first word. 27 lines that shoot, fire or name fire were run through the reader; 19 routed wrong, and 22 route right now. Each new check fails on section 37's tree: route 11 of 11, engine 1 of 1 (two of its four task routes; "fire the kiln" and "fire the musket at the deer" held already).

| What the player meets now | Before (section 37) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I fire my pistol at the guard", "I take a shot at the guard with my pistol", "I take aim at the deer", "I aim and fire": BodyCheck (a handgun's shot_m) beside BodyStrike | BodyStrike only: a handgun shot by these words never reached shot_m | the shot route names both tools (rules-tools.ts: "A handgun shot → BodyCheck with shot_m") | verbs.ts `toolsNamed`, `frameTools`, `lightNounTools`; router.ts `toolsOf` and the light-verb reads | RB1, RB2 |
| "I fire the cook", "I fire him on the spot", "I fire the kiln": no shot; the task route of "fire the cook" none | BodyStrike | fire's object names its sense: PropBank fire.01's is the gun or projectile, fire.02's the one let go (FrameNet Firing, VerbNet fire-10.10), fire.03 bakes pots, fire.04 ignites [ASSUMED list of things fired] | verbs.ts `notAShot`, `HEATED`, TASK_ROUTES; router.ts `toolsOf` | RB3, RB4, RB11 |
| "I fire up the generator": no shot | BodyStrike | a named verb's empty list is its answer (it had fallen through to the FrameNet frame) | router.ts `VERB_TOOL.fire_up`, `toolsOf` | RB5, RB6 |
| "I open fire on the soldiers", "I return fire", "I gun him down": a shot; "I hold my fire": no grip | nothing; Act and Transfer; nothing; Act and HoldOn | FrameNet fire.n: Shoot_projectiles; set phrases read by what they mean | router.ts phrases | RB7, RB8, RB9 |
| "I take a shot of whiskey": no blow (Transfer and Price) | BodyStrike and Price | a noun of measure before of and a thing heads a measure of goods (CGEL ch. 5 §3.3; grammar.ts `measureOfGoods`) | verbs.ts `nounRoute` | RB10 |

Checked and left as they were, with the lines that would change:
- "I take a shot of whiskey" offers Transfer, no BodyIntake: the light reading of take with a drink is drinking (grammar.ts `lightReading`).
- "I snipe the sentry" routes nothing (VerbNet files snipe under berry-13.7, gathering snipe; the shooting sense is in neither VerbNet nor the FrameNet extract); "I pick off the guard" routes BodyIntake and Transfer (FrameNet has pick off.v under Hit_target, and router.ts `toolsOf` reads FrameNet by the verb alone, router.ts:99–111).
- "I set fire to the barn" routes Act, "I catch fire" Transfer (router.ts phrases would name them, as for the breath phrases).

Checked:
- `npm test` passes: route 172, frame 198, intent 37, engine 193, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- The 27 shot lines before and after: `section-38-run.txt`.
- Negative controls: the 11 new (RB1–RB11) and Q11e each caught; Q11e's break is a shoot entry naming BodyStrike alone, since without the entry the FrameNet frame now gives both tools; the 50 controls on router.js and verbs.js rerun and caught. The other 373 were caught on section 37's tree, and this pass changed none of their files.
- `section-38.patch` applies to section 37's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 39. The tools' words fitted to the scene (RC1–RC13)

The player asked that every line the models read name only what the scene can hold, so no word primes an out-of-scene one. *Published:* a token in the context raises its own chance of being written (induction heads, Olsson et al. 2022), and negated prompts get worse with scale in 2022 models (Jang et al. 2022). Section 38's tree (`tool-lines.md` of the last turn) had 24 sentences with a negation word, each a default, a condition or a needed absence. The salience came from lists and examples. Each new check fails on section 38's tree: engine 3 of 3.

| What the models read now | Before (section 38) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| Options, arguments and tools carry their years and worlds; the planner's catalogue and schema and the narrator's schemas hold only the scene's (1300: no ensembles, garments after their first decade, treatments before they worked, drugs, coins out of circulation, survey acts, Battle, NameCharacter; a world without magic: no adamantine, no CastSpell) | one text for every scene | first years from the sources in `scene-fit.ts` comments; the survey from 2000 by the tool's own rule; [ASSUMED] where marked | scene-fit.ts (new); rules-tools.ts `sceneNow`, `fittedTool`, `sceneTools`; question-pass.ts `SKIP`, `toolCatalogue`, `pickSchema`, `pickTools`; plan-schema.ts `planSchema` | RC1–RC8, RC13 |
| A market is offered in the years its price data cover (19 in 1300, 65 in 1850, 0 after 1950) | 100 markets in every year | prices.ts answers within 10 years of a year with figures | scene-fit.ts `citiesIn` | RC5 |
| The narrator's brief names a tool only where the scene has a use for it; handguns from 1350, surgery from 1846 | every line in every scene | the same fit | rules-tools.ts `rulesBrief`; index.ts | RC9 |
| The narrator without a question pass is offered the tools of the player's line (with those every turn may need), with the scene's arguments: 2,723–2,882 tokens a line | all 42 tools' schemas, 23,180 tokens a line | function-calling accuracy falls as the functions offered grow (Patil et al. 2025, BFCL); SillyTavern reads a tool's parameters after `shouldRegister` (tool-calling.js) | rules-tools.ts `offeredNow`, registration | RC10, RC11 |
| A condemned act is read from its words ("he killed himself": suicide); the 19 acts go back only when the words match none or several | the 19 acts (homosexuality, abortion, suicide…) in every SocialResponse schema | the list where it is needed | rules-tools.ts `surveyAct`, SocialResponse `act` | RC12 |
| Examples name what any scene holds or a placeholder the scene fills ("<place>: <part>", "<town>, <country>"); "species, as a creature name (human, horse, wolf)" | "John's house", "Rue de Rivoli", "Lyon", "Mary is a cat", "revolver", "the York mail", "loot chest 2", "giant wolf", "dragon", "telepathy", "car exhaust", "aircraft, magic", "loading a cartridge", "by phone", "Stop the Bleed course", "propane, octane", "an adrenaline pen", "police", "milkman", "DF creature" | a word in the context is a word the model may write | 60 texts changed in all (4 prompts, 6 tool descriptions, 48 argument descriptions, 2 option lists; the act list removed): rules-tools.ts, social.ts `REQUESTERS`, `OBEY`, question-pass.ts, rules-audit.ts | engine check |
| The brief's speech line: "Humans talk, and so do the peoples [WORLD] adds and the bodies it marks as talking"; the misheard spelling has no sample words | "(Dwarf Fortress CAN_SPEAK or INTELLIGENT: humans, dwarves, elves, goblins, animal people)", "(sètï, sèdï)" | the narrator reads the brief every turn; [WORLD] marks bodies "talks" or "speechless" (world.ts) | rules-tools.ts `RULES_PRINCIPLES` | engine check |
| Price, SocialResponse, Sickness and Dose describe what they decide; their lists name the cases | Price 142 words of markets, SocialResponse one 195-word sentence, Dose "precomputed Pulse runs" | the city and situation lists already name them | rules-tools.ts | — |
| BodyWound takes bullets; BodyStrike records arrow, bolt and dart wounds; the rule check checks every stated price | BodyWound claimed arrows too; the rule check checked prices "for a European city between 1500 and 1913" | the brief and BodyStrike's launcher; Price's coverage | rules-tools.ts BodyWound; rules-audit.ts | — |
| QUESTION_SYSTEM: the present day without "(cars, phones, buses)"; WorkOut and Sickness are named by their own descriptions | the examples, and two sentences the tool descriptions repeat | Quantity | question-pass.ts | — |

Checked and left as they were:
- An unknown year keeps every option: a first turn without [TIME] reads everything.
- The world book's draft keeps "the Dwarf Fortress creature its body is" and its examples (troll, ogre, goblin): its subject is the world's additions.
- The sound levels ("loud drone", "busy street", "loud machine nearby") are calibration points in dB, valid in any era with machines or streets.
- Tool results (the "[Rules engine]" lines) were not swept in this pass.

Checked:
- `npm test` passes: route 172, frame 198, intent 37, engine 196, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- Six ordinary lines in 1300, 1850 and 1990 (`review-tests/probes/scene-words.mjs`): planner 4,088 → 3,568, 3,612, 3,669 tokens a line; narrator without a question pass 23,180 → 2,723, 2,726, 2,882; words from a list of 46 modern, fantasy and copyable tokens: 21 (planner) and 42 (narrator) → 0 in 1300 and 1850.
- `tools/prompt-audit.mjs`: 15 → 9 sentences (modern examples 9 → 3; defined against something 6 → 6).
- Negative controls: the 13 new (RC1–RC13) and the 97 others on the files this pass touched (rules-tools.js, question-pass.js, plan-schema.js, social.js, rules-audit.js, scene-fit.js, index.js): 110 of 110 caught (`section-39-run.txt`). The other 338 target files this pass did not change and were caught on sections 37 and 38.
- `section-39.patch` applies to section 38's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 40. Results as the narrator reads them (RD1–RD9)

The player said "Continue"; the next item was the tool results, read with the same test as the tool texts. The engine test's results were recorded (9,818, from 25 tools), the 17 tools it leaves out were called in an 1850 London scene and a 1990 Chicago scene, and the [BODY], [KNOWS], [HAS] and [DECIDED] blocks were kept. Of the 10,766 texts, 2,189 held text a narrator would read that is no outcome when it calls the tools itself, and 2,150 through [DECIDED]; now 0 of 10,770. The new check fails on section 39's tree.

| What the narrator reads now | Before (section 39) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| A result from the narrator's own tool call without the sensitivity note | "Fragile: … timberFactor = 0.3 × clear-wood bending strength instead of 0.5 [ASSUMED: sawn, ungraded timber …]" (40 results) | [DECIDED] already left it out (`storyResult`); a narrator that read one told the other outcome as fact | rules-tools.ts `storyText`, the registered action; question-pass.ts `storyResult` | RD3 |
| No status tag inside a result | "(CO 50 g/kg [ASSUMED midpoint of 15–85])", "[estimated]" (84) | the tag is for the code and docs | rules-tools.ts `DETAIL` | RD2 |
| "normal voice at 1 m, quiet room" | "… quiet room (25 dB))" (1,520) | a level is an intermediate value (Shi et al. 2023), as a chance is | rules-tools.ts `DETAIL` | RD1 |
| "blood lost 0 L" | "blood lost 0 L (0%, class I)" for every tracked person in [BODY], every turn (583 blocks) | the class says something only once blood is lost | body-engine.ts body line | RD8 |
| "ethanol; at 20 °C: liquid …; burns: 29.7 kJ/g" | "ethanol (C2H6O, CAS 64-17-5, 46.1 g/mol) … (from its measured heat of formation)" | the table's identity and source, no outcome | chem.ts `describeCompound` | RD6 |
| The dose and its signs | "(1 mg for the 77 kg model)", "… sedation 0.00 (Pulse)" | the model and the program are internals | drugs.ts, body-engine.ts | RD4, RD5 |
| "burned 2.7 % of body surface" | "… about 0 % of such patients die within 2 weeks" | the engine draws the death (body-engine.ts `advance`: fatal, deathMin); a chance invites the narrator to decide | body-engine.ts | RD7 |
| Weather without a date asks for "time" as YYYY-MM-DD HH:MM; a place without climate data asks for the nearest listed town | both: "needs a calendar date (dd/mm/yyyy) and hour in [TIME]" | the question pass writes "time" as YYYY-MM-DD HH:MM (QUESTION_SYSTEM) | rules-tools.ts `NO_DATE`, `noClimate` | RD9 |

Checked and left as they were:
- BodySize gave a 25-year-old woman in 1850 London 150 cm and 35 kg: BMI 15.6, a draw about 2.3 SD below the 1975 UK mean (about 1 in 70), the code's log-normal (body-size.ts).
- Error answers that name arguments ("task_kind is required", "Give size_m") go to the planner, whose output is calls.
- CastSpell's "Too little PE to cast" names the engine's power unit; it reaches a narrator only in a world with magic.
- "an ordinary failure: chance alone" is the cause in words, as section 7.2 sets it.

Checked:
- `npm test` passes: route 172, frame 198, intent 37, engine 197, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- The recorded corpus before and after: `section-40-run.txt`, scripts `review-tests/probes/results-corpus.mjs`, `results-extra.mjs`, `results-scan.cjs`.
- Negative controls: the 9 new (RD1–RD9) and the 113 others on the files this pass touched (rules-tools.js, question-pass.js, body-engine.js, drugs.js, chem.js): 122 of 122 caught (`section-40-run.txt`). RD2 and RD4 were caught on a second run: on the first, the check's Room call had no volume (so no tag came back) and no minute passed after the dose (so no dose line); the check now gives both.
- `section-40.patch` applies to section 39's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 41. A verb's sense by what its object is (RE1–RE11)

The player asked for semantic logic in place of fixes made one output at a time, and for every phrase likely to be misread ("I throw the cook" and its variations). A word stands for kinds of thing; a verb's senses take kinds of thing. Both are published: VerbNet 3.4 states, per class (sense), what its direct object must be (selectional restrictions); Open English WordNet 2024 files every noun sense under a kind (its lexicographer files and hypernyms). Code now reads a line's verb by its object's kind and leaves out the senses the object cannot meet; the model chooses among the senses left, by the scene. Each new check misses on section 40's tree: route 10 of 11, frame 2 of 3 (the third keeps a real blow drafted).

| What the player meets now | Before (section 40) | What it rests on | Lines → change | Controls |
|---|---|---|---|---|
| "I charge the cook two shillings": Price; "I charge at the guard": no Price; "I hold the rope": no motion; "I cut the cook" and "I shove Tom into the wall": no Break; "I get hit by Tom": no motion; "I make a promise": no hand-over | every sense's tools at once (the union of the verb's classes) | VerbNet's selectional restrictions and frames; WordNet's kinds | senses.ts `readings`, `objectAfter`; router.ts `toolsOf` | RE1 |
| "I hold a meeting": no grip | HoldOn and Act | the object's first sense first (a meeting is an event), its other senses when no class fits that one ("fire an arrow": WordNet's first arrow is a mark) | senses.ts | RE3 |
| "I hold on to the rope", "I gobble down the stew" keep their tools; "I walk 10 m to the door" keeps Act | (the step would have read the particle or the measure as the object) | a particle makes a phrasal verb, which VerbNet lists apart; a measure or a time is an adjunct (WordNet noun.quantity, noun.time; a unit symbol) | senses.ts `PARTICLE`, measures | RE4, RE5 |
| "I throw the cook a coin": Transfer | BodyCheck only | VerbNet's NP V NP NP frame of give, throw, send, bring, slide, carry, get | router.ts `toolsOf` | RE2 |
| "I serve the soup": Transfer; "I trust the cook": none | Price, Transfer and PassTime; none | fulfilling-13.4.1 is a hand-over; its person object takes its thing in a with-phrase | router.ts `CLASS_TOOL`, `toolsOf` | RE8, RE9 |
| "I charge the cook": no blow drafted by code (BodyStrike, Price and Act offered); "I cut the cook a slice of bread": no blow drafted | a blow drafted for both | a sense the object explicitly fits names another tool; a blow verb with two objects is done for the first | router.ts `senseConflict`; frame.ts `striking` | RE7, RE11 |
| "I murmur a prayer" keeps Communicate | (the first-sense step would have taken a "not a person" requirement for a fit) | a requirement that only says what the object must not be is no positive fit | senses.ts | RE6 |
| "I return fire": no motion | (the motion reader would have added Act once "return" lost its own) | the fire phrase drops the motion too | router.ts | RE10 |

The inventory (`sense-inventory.tsv`): every verb with two or more senses that the router routes (676) × one common noun of 22 kinds (person, animal, weapon, gun, projectile, food, drink, body part, garment, container, vehicle, building, plant, object, money, abstract, message, substance, event, time, group, machine), and "the cook a coin", "at the cook": 16,224 phrases, ranked by the verb's count in film subtitles (OpenSubtitles 2018, hermitdave/FrequencyWords). In the 8,172 whose object explicitly fits a kept sense: 1,647 offered a tool from a sense the object cannot meet (now left out); 461 have senses the object fits that name different tools (the model chooses; code drafts no blow); 516 get a tool from a sense VerbNet leaves unrestricted; 159 are decided by a hand-written entry while VerbNet has other senses; 4,930 have one reading.

Checked and left as they were, with the lines that would change:
- Hand-written entries (router.ts `VERB_TOOL`: throw, take, hand, treat, lift, push…) give their tools for every object: "throw a party", "throw the cook out", "throw myself at the cook" are BodyCheck. The entries would name the classes they stand for, and the sense step would apply to them; for "a party" WordNet's first sense is a political group and one later sense a person, so the scene still decides.
- "I hit the cook up for money" drafts a blow: a particle after the object ("up … for") makes "hit up", and "knock the guard down" is a blow with the same shape (frame.ts `striking`).
- 516 offers come from senses VerbNet leaves unrestricted ("raise my hand" offers Price through earn-54.6 and BodyTreat through remedy-45.7); offering costs a few tokens, drafting nothing.
- Corpus sense frequencies are left out: SemLink's annotated news text gives "fire" as dismissal 28 times in 36 and "charge" mostly as billing, which would push a roleplay toward the news senses.
- RB9's rule ("hold fire" is no grip) was taken out with its control: fire's first sense is an event, which hold-15.1 does not take.

Checked:
- `npm test` passes: route 183, frame 201, intent 37, engine 197, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- 272 player lines from the sections 36–38 corpora and the route test, old router against new: 6 routings changed, each leaving out a sense the object cannot meet (`section-41-run.txt`).
- Negative controls: RE1–RE11 caught (RE6 and RE10 after their patterns were corrected); all 118 on router.js, frame.js and senses.js caught.
- `section-41.patch` applies to section 40's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 42. The scene's cues weigh a verb's senses (RF1–RF6)

The player asked for cues that add up, each raising or lowering a reading, as hearing, then seeing, then smelling does. Section 41 leaves the senses a verb's object allows; this pass weighs them. The readings (senses grouped by the tools they name) start equal; each cue multiplies the odds of the readings it fits by its likelihood ratio; the result is normalized. Cue combination is statistically optimal in perception (Ernst & Banks 2002), and word senses are read from many weighted constraints at once (MacDonald, Pearlmutter & Seidenberg 1994).

| Cue | Weight | What it rests on | Lines | Control |
|---|---|---|---|---|
| The verb's reading earlier in this chat (by the tools its turn called) | that reading's chance 0.94 | Gale, Church & Yarowsky 1992: 51 of 54 pairs of a polysemous noun in one article shared a sense (98 % adjusted) | sense-odds.ts `senseOdds`; question-pass.ts `sceneCuesFor` | RF1 |
| …with the same object | 0.95 | Yarowsky 1993, Table 3: verb-object pairs .95 | sense-odds.ts | RF1 |
| A weapon, gun or projectile the actor holds (WordNet kinds) | blows and shots × 3 | [ASSUMED 1.5–6], registered `senseInstrumentLR` | sense-odds.ts | RF2 |
| A reading's tool decided in the last six messages | × 2 | [ASSUMED 1.2–4], `senseRecentLR` | sense-odds.ts | RF3 |
| The scene's words (the line and the two messages before) in a sense's WordNet definition, examples, synonyms, hypernyms or derived nouns | × 1.5 per word, three at most | Lesk 1986 (the overlap); the weight [ASSUMED 1.1–3], `senseGlossLR` | sense-odds.ts; data/sense-gloss.ts (514 verbs) | RF4 |
| Code drafts a blow another fitting sense contests | at 80 % | [ASSUMED 0.6–0.95], `senseDraftShare` | frame.ts `striking` | RF5 |
| The planner is told each verb's readings, chances and cues (READINGS) | — | the model reads the rest of the scene | question-pass.ts `readingsNote` | RF6 |

"I charge the cook" (four readings: attack, bill, run at, accuse): no cues 25 % each; Mara holds a sword: attack 50 %; and a blow just before: 67 %; and "sudden attack, battle" said: 79 %; the scene speaks of a price and lunch: Price 53 %; an earlier "I charge the cook two shillings": Price 95 %. Of the 461 open phrases of section 41's inventory, 196 have two readings, 219 three, 46 four: an earlier reading of the same verb settles all 461 alone; a weapon and a fight settle the 196 two-reading ones; three shared words more settle the rest.

Checked and left as they were:
- The assumed weights wait for a fit on the player's own chats (which reading the planner chose and the player kept): the fixed sample of section 7's measurement.
- The cues the engine holds and does not read yet: the place (a kitchen, a battlefield), a person's occupation (a cook is employed: dismissal), what Look and Listen let a character see or hear.
- One sense per discourse was measured on encyclopedia nouns; a verb's senses in a roleplay may switch more often (a bill earlier, a fight now: Price still 88 % with a sword and a blow, because 0.95 outweighs them).

Checked:
- `npm test` passes: route 183, frame 201, intent 37, engine 198, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- Negative controls: RF1–RF6 caught; the 148 others on router.js, frame.js and question-pass.js caught, RE7 after it was retargeted to the condition this pass rewrote (`section-42-run.txt`).
- `section-42.patch` applies to section 41's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 43. The scene's words and the tools' descriptions route the turn (RG1–RG65)

"Continue" took up section 42's next items, starting with the fixed sample. The 58 eval scenes were scored as play offers tools: the router's tools when it routes a verb (the planner's schema then holds only those, the others by one line), the picker's otherwise (`review-tests/probes/evalplay.mjs`). On every commit from the upload to section 42 the same 22 tools could not be called in the first round. The router read the player's verbs alone; the picker it replaces reads the last three messages and is told to include a tool when unsure. The eval command itself always asked the picker, a step play skips whenever a verb routes.

| Fix | Source | Lines | Control |
|---|---|---|---|
| The words of the line and the two messages before it add the tools whose inputs they name: sounds, riddles, a name, a disease or symptom, fire, smoke, weather, cold, heat, a desert, a temperature, going into water, a boat or an operation, a stove or a heated pot touched, a feeling, a watcher or gravel while moving, a pursuer while running | WordNet first senses under each tool's anchor synsets (`data/cue-words.ts`); altitude from 2,500 m, Hackett & Roach 2001; [ASSUMED] watcher and pursuer cues | cue-tools.ts; router.ts `routedTools`; question-pass.ts; rules-tools.ts `offeredNow` | RG52–RG61 |
| A cue word in a verb's place, a measure, a name, fire opened, cold as weather, a ring given is no cue; a pursuer follows a runner (WordNet's verbs of moving fast or fleeing), not a walker | word positions; FrameNet fire.n; WordNet | cue-tools.ts `found`, `keep`, `runs` | RG53–RG56, RG63, RG64 |
| The activities a tool's description names add that tool (sneak, ride, mend, sew, forge, jump, swim, pry; solve, figure out, decipher, calculate, devise, deduce; flee) | WordNet synsets by definition with their troponyms, first sense (`data/activity-verbs.ts`) | router.ts `toolsWith` | RG14, RG15 |
| A verb of feeling adds Appraise | VerbNet admire-31.2, marvel-31.3 ∩ WordNet verb.emotion first sense | router.ts | RG16 |
| The verb after a noun subject; a thing as subject is an accident's wound, no act; "and" shares the subject | CGEL ch. 4 §1; Levin 1993 §3.3; VerbNet Agent | router.ts `afterNounSubject`, `clauseSubject` | RG6–RG8 |
| Look only for seeing; notice, detect, perceive, sense offer Listen; feeling about → Appraise; feel, smell, taste alone → none | VerbNet see-30.1 holds every sense; FrameNet 1.7 Becoming_aware has no Body_part | router.ts `NON_VISUAL`, VERB_TOOL | RG10–RG13 |
| An unrestricted Value, Extent, Duration or Asset object is an amount; a two-object frame's first object only with two objects | VerbNet role definitions ("Value: place along a formal scale") | data-builders/vn.py, build.py; senses.ts | RG1, RG2 |
| "a couple of seconds" is no goods | WordNet: second is first a time | grammar.ts `measureOfGoods` | RG3 |
| A weapon phrase of four words; a possessor after "at" is the creature | Levin 1993 §1.3 | router.ts; verbs.ts `creatureAfter` | RG4, RG5 |
| An attack-60.1 verb on a fort or a hill is a battle | FrameNet Attack with a position | router.ts | RG9 |
| Named constructions: trust, lie to, hang from, run from, catch sight, catch fire, inject, remember to, multiply-108, suffocate-40.7, faint, trip | each tool's description; FrameNet; VerbNet | router.ts VERB_TOOL, CLASS_TOOL | RG17–RG27, RG32 |
| The player's claims (a kind of being, an item brought out, an ability, a past); clothes and footwear; out of water; swimming; a load on a plank; by its handles; another's choice; reading aloud; an account that may be a lie; a watched person; catching a disease or a person | Claim's, BodyEnvironment's, Break's, HoldOn's, Choose's descriptions; DePaulo et al. 1996 (27 % of 1,535 lies about actions, plans, whereabouts) | router.ts | RG30, RG31, RG33–RG47 |
| "rides" is ride's; "saw" is see's first; an inverted do is an auxiliary; indefinite pronouns are subjects; a particle before a path is a motion | CGEL ch. 3 §1.1, §2.1; ch. 4 §6.1; ch. 18 §2.1 | verbs.ts `lemmas`, `lemmasAfter`, BEFORE; router.ts; senses.ts | RG28, RG29, RG44, RG48–RG50 |
| Persuasion has a person | FrameNet Suasion's Addressee | verbs.ts `addressee` | RG51 |
| A time after the object is an adjunct, no second object ("I punched Tom two days ago") | CGEL ch. 8 | senses.ts `objectAfter` | RG65; G46 |
| The eval offers tools as play does | play's step (question-pass.ts) | eval.ts | RG62 |

Measured (`review-tests/probes/`):
- Eval sample, play's step: tools the first round cannot call 22 → 2; extra tools offered 45 → 56 (the cost: more tools in the planner's prompt).
- 228 lines written from the tool descriptions (`desc-lines.tsv`): offered the tool 71 → 170, routed without it 73 → 12, nothing routed 84 → 46.
- Held-out lines, written after the fixes, first run: set 1 (122 lines) offered 90 of 100 (10 on section 42's tree), routed without the tool 5 (47), lines that must not get a tool clean 20 of 22 (16); set 2 (62 lines) 47 of 52 (4), 2 (28), 9 of 10 (7). The misses each set found were then fixed (set 1: 96, 0, 22 of 22; set 2: 49, 1, 9 of 10), so the second figures are no longer held out.
- Corpus of 280 lines: 15 routings changed, each toward the act the line names; 9 of its 230 routed lines gain a cue tool with no context (6 a fire nearby).

Checked and left as they were:
- Scene 55: a theft the narrator wrote ("Mara's fingers closed on the merchant's purse") is recorded by no tool; the narration's events need a reader of their own.
- Scene 12: "Mara wonders whether Elias liked her" offers Appraise (her feelings); the scene asks for Elias's response (SocialResponse).
- A subject's own restriction is unread: "Does the shelf hold Mara's weight?" offers HoldOn (VerbNet's hold-15.1 Agent is animate).
- WordNet defines tiptoe, creep (first sense) and prowl without stealth, so they offer no BodyCheck.
- Cue words in the narration persist for two messages: a fire mentioned near a table offers BodyEnvironment while it is in view.

Checked:
- `npm test` passes: route 209, frame 202, intent 37, engine 200, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- The three data files rebuild byte for byte from the builders (`review-tests/data-builders`, steps 3, 6 and 7).
- Negative controls: RG1–RG65 caught (eight after their patterns were matched to the compiled code or their line made to need the fix). Of the 208 earlier controls on the files touched, 202 caught on the first run. Four patterns had moved with the code (R6, G22, G36, RE4) and were retargeted. RE8's line ("I trust the cook") now routes by its named verb; the control moved to "I supply the cook". G46 ("I punched Tom two days ago") was not caught on section 42's tree either: since section 41 the line read "two days" as a second object, so no blow was drafted with or without the time-ago rule. That reading is fixed above (RG65), and all six are caught. All 250 route and frame controls in the repository were caught on the final tree, and so were the 105 engine, plan and sequences controls on the files touched (`section-43-run.txt`).
- `section-43.patch` applies to section 42's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 44. A thing's load, someone else's feeling, stealth, and the narrator's acts (RH1–RH16)

"Continue" took up section 43's open items. With them done, the fixed sample has 0 tools the planner's first round cannot call (2 before, 22 on section 42's tree).

| Fix | Source | Lines | Control |
|---|---|---|---|
| A thing that bears, supports or withstands something, or holds or takes a weight or a person, or holds at all, is under a load | Break's description ("a shelf, a rope someone hangs from") | router.ts, the thing-subject step | RH1, RH2 |
| A thing gives way; a person giving way yields | the same | router.ts | RH3, RH4 |
| Someone else's feeling asked about (a complement clause, an inverted question) is their response as well as their emotion; the player's own feeling is no one else's | SocialResponse's and Appraise's descriptions; CGEL ch. 11 | router.ts; `routeTurn(text, names, player)` | RH5, RH6 |
| Tiptoe, creep and prowl are sneaking | Merriam-Webster's definitions (WordNet's omit the stealth) | router.ts VERB_TOOL | RH7 |
| A thing slid or tucked into one's own sleeve, coat or bag is taken; a hand in a pocket is not | Transfer's description ("taken", "stolen"); WordNet kinds n, r, b | router.ts | RH8, RH9 |
| The narrator's acts offer the tools that record them; a narrated hand-over only by giving, stealing, robbing or seizing a physical thing | the recording tools' descriptions; VerbNet give-13.1, contribute-13.2, steal-10.5, rob-10.6, obtain-13.5.2 | router.ts `routedTools`; question-pass.ts; rules-tools.ts; eval.ts | RH10, RH11, RH15, RH16 |
| "Whether" and "that" open a clause's subject | CGEL ch. 11 | router.ts `afterNounSubject` | RH12 |
| "How much does the ferryman charge?" asks a price | CGEL ch. 10, the fronted object | router.ts | RH13 |
| Reading to a group is speech | WordNet noun.group | router.ts | RH14 |

Measured (`review-tests/probes/`, `heldout3.tsv` written for this pass, first run):
- Eval sample, play's step: tools the first round cannot call 2 → 0; extra tools offered 56 → 56.
- Held-out set 3 (46 lines): offered 35 of 38 (25 on section 43's tree, 4 on section 42's), routed without the tool 1 (6, 12), lines that must not get a tool clean 8 of 8 (8, 6). Its three misses were then fixed (37 of 38; the one left is "I wonder whether the baker trusts strangers", read as Trust).
- Corpus of the earlier test lines: 1 routing changed ("I creep across the lawn" adds BodyCheck).

Checked and left as they were:
- The offering is not yet fitted on the player's own chats (which tools the planner called and the player kept).
- A narrated outcome that no result decided is the rule check's (rules-audit.ts) to find; the recording tools now offered let the planner record a narrated act, not judge it.

Checked:
- `npm test` passes: route 218, frame 202, intent 37, engine 201, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- Negative controls: RH1–RH16 caught (RH4 after its yielding line was added); every route and frame control in the repository (264) and the 105 engine, plan and sequences controls on the files touched caught, three of section 43's (RG7, RG61, RG62) after their patterns were matched to this pass's code (`section-44-run.txt`).
- `section-44.patch` applies to section 43's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 45. Where people stand is the state's (RJ1–RJ11)

The player asked for meaning rebuilt from the scene's state (its input), not from the words (a lossy output of it). Two attempts, one kept.

Tried and not kept: the state choosing a verb's sense. Each VerbNet 3.4 class states what holds before the act (Brown et al. 2022: give-13.1 has_possession(e1, Agent, Theme); hit-18.1 contact(e3, Agent, Patient)); the roles were bound from each frame's syntax (270 classes) and checked against who holds what and where each person stands, then multiplied into the sense weights as SayCan multiplies a skill's chance of success into the language model's choice. With the words fixed, the state alone changed the leading reading of 40 of 408 verbs with a thing as object and 50 of 480 with a person. The changes were wrong:

| Line | State | Leading reading became |
|---|---|---|
| I give the coin. | Mara has no coin | substance_emission-43.4 ("give off") |
| I steal the coin. | Mara holds a coin | appear-48.1.1 ("steal into") |
| I punch the cook. | the cook at another spot | carve-21.2 (punch a shape) |
| I hit the cook. | the cook at another spot | reach-51.8 (Act) |

A failed precondition makes the act impossible as stated, or calls for an earlier act (a walk across the room); it does not make another sense likelier. VerbNet states no checkable precondition for most of the competing senses, so they won by default. Readers rate a sentence whose objects cannot do the act as nonsense (1.31 on a 1–7 scale, 4.32 when they can, word co-occurrence .06 for both; Glenberg & Robertson 2000, Exp. 1): the state decides whether the act can happen. The scripts and the built data are in `review-tests/probes/sec45-state-senses/`; nothing of it is in the repository.

Kept: the engine takes where people stand from its own record. A language model keeps poor track of state changes told in text (Kim & Schuster 2023: GPT-3.5 gave a box's full contents after 7 operations in more than 25 % of cases; models trained on text alone were near zero), and the map is that state.

| Fix | Source | Lines | Control |
|---|---|---|---|
| BodyStrike between two placed people takes the map's distance (it defaulted to "within reach"); a given figure that differs is ignored and named; out of reach names both spots and the Act that closes the gap | §6.20a; Act keeps a recorded walk, BodyFall the height stood at | rules-tools.ts `placed`, BodyStrike | RJ1, RJ8 |
| A shut wall between attacker and target stops a blow and a handgun shot | §6.20a (rooms with no open doorway) | BodyStrike, BodyCheck | RJ2, RJ10 |
| A choke hold needs the holder within reach: 0.88 m at 70 kg, scaled by length | FAA 2006-08 functional reach, men's 50th percentile (body-engine.ts REACH_M) | BodyChoke; body-engine.ts `reachOf` | RJ3 |
| Communicate and Look keep the map's distance over a given one (§6.20a already said they take it) | §6.20a | Communicate, Look | RJ4, RJ5 |
| Listen takes `source_who`: the distance and a shut wall from the map | §6.20a; plaster wall [ASSUMED default, as for Communicate] | Listen | RJ6, RJ7 |
| A handgun shot at a placed `shot_at` takes the map's distance; a chase the map's gap | feats.ts handgunHitChance; body-engine.ts chase | BodyCheck, Chase | RJ9, RJ11 |

Measured (`tests/engine.test.mjs`, harness): Mara at the bar, Tom at the hearth 6 m away: a punch given 0.5 m stays out of reach (6 m); Ned on the stool 0.5 m away: in reach; the cook in the larder behind a wall with no doorway: no blow, no shot, a voice through plaster at 9.5 m; a shot at Ned given at 300 m (0.0 % to hit) is taken at the map's 0.5 m (99.6 % at 1 m) and hits; a chase given 20 m runs from the map's 6 m.

Found and left: BodyStrike's `prone` input is never read by `strike()`; Transfer between two placed people apart has no reach check (a hand-over needs reach unless the item is thrown or sent).

Checked:
- `npm test` passes: route 218, frame 202, intent 37, engine 202, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- Negative controls: RJ1–RJ11 caught, and the 85 earlier controls on the two engine files touched (`rules-tools.js`, `body-engine.js`) caught (`section-45-run.txt`).
- Prompt audit (`tools/prompt-audit.mjs`): the same 11 lines as on section 44's tree.
- `section-45.patch` applies to section 44's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 46. Water below its melting point freezes only once a crystal starts (RK1–RK8)

The player asked what the water code would hold instead of "at 0 degrees water freezes", which is itself an observation of bulk, dusty water at 1 atm. Substance answered from that kind of sentence: below a compound's melting point, "solid" (`structure.ts stateAt`, T < Tm), so water at −1 °C was ice in any amount.

| Fix | Source | Lines | Control |
|---|---|---|---|
| Liquid water below its melting point stays liquid until ice starts in it; without a volume, Substance says so and asks for one | Koop et al. 2000 | chem.ts `cooledWater` | RK1 |
| The driving gap: water activity against ice's, a_w,ice = p_ice ÷ p_liquid; ice melts where they meet, 0.00 °C at 1 atm | Murphy & Koop 2005 (vapour pressures); Koop et al. 2000 | freezing.ts `iceActivity`, `iceMeltK` | RK8 |
| Crystals starting by themselves: log10 J = −906.7 + 8502 Δa_w − 26 924 Δa_w² + 29 180 Δa_w³ per cm³ per s | Koop et al. 2000 | freezing.ts `selfRate` | RK4 |
| Particles in natural water: n(T) = e^(−0.7 T − 6.02) per mL, at the pure-water temperature of the same gap | Brennan et al. 2020 (snowmelt, 88 samples); Zobrist et al. 2008 (constant gap); [ASSUMED] the same spectrum for rain, lake, river and tap water | freezing.ts `particlesPerMl` | RK5 |
| P = 1 − exp(−(n V + J V t)): the chance grows with the volume and the time; one draw decides | Poisson counting of nucleation events (Brennan et al.'s Eq. 2) | freezing.ts `freezeChance` | RK2 |
| Ice it touches freezes it at once | the crystal is already there | freezing.ts | RK3 |
| On freezing, c_p ΔT ÷ L turns to ice at once, the rest warms to the melting point as slush | c_p 4.22 J/(g K), L 333.6 J/g | freezing.ts | RK6 |
| Any other compound below its melting point: solid once crystallised; a melt stays liquid until a crystal starts | the same law; the table holds no rate | chem.ts `describe` | RK7 |

Measured (`tests/engine.test.mjs`; `review-tests/probes/sec46-freezing/`):
- Water at −1 °C: a cloud droplet (5 × 10⁻¹⁰ mL) freezes with P 2 × 10⁻¹² and stays liquid; a litre with P 99 %; 50 µL with P 0.02 %.
- A clean 10 µm droplet: 50 % in 1 s at −37.1 °C (Koop et al. 2000: homogeneous freezing near −38 °C).
- 0.05 mL snowmelt drops, the paper's wells: half frozen at −12.4 °C (the paper's mean T50 −12.5 °C; the same data, so a check of the reading, not an independent test).
- A bucket at −10 °C: 13 % turns to ice at once.

Tried and not used: UNIFAC (original parameters, `vapour.ts`) for the water activity of ethanol–water. The ice melting point it gives against Lange's table: 11.3 wt % −3.9 °C (−5), 20.3 % −6.2 (−10.6), 29.9 % −8.2 (−18.9), 39.0 % −10.0 (−28.7), 56.1 % −15.3 (−41.0). Mixtures therefore get no freezing answer until an activity model fits below 0 °C.

Open: the planner reaches Substance through the words of the line; water below its melting point anywhere in the scene should get the check from the state. Boiling has the same barrier (a bubble has to start), and other compounds need tabled rates.

Checked:
- `npm test` passes: route 218, frame 202, intent 37, engine 203, plan 60, size 9 of 9, ui 54, sequences 300 with 0 failing, all with 0 misses.
- Negative controls: RK1–RK8 caught; RD6, the other control on `chem.js`, caught; every control pattern on `rules-tools.js` still found.
- Prompt audit: the same 11 lines as on section 45's tree.
- `section-46.patch` applies to section 45's tree; `credibility-first-edits.patch` applies to the first upload and reproduces this tree.

## 47. The voice's look drawn from the sound (RM1–RM15)

The player reported the multiple-distinctions look of (113) as worse than the lighter one ("the blue line i assume is pitch is too salient, the new blurry seems worse than the old one, and i see quite a few sizing errors"), and sent eight points for a notation that maximizes how fast a line is taken in. Measured in Chromium on 13 specimen lines before any change: 11 lines changed their line height (by 1 to 9.75 px of 23), one word lay 2.2 px over the comma after it, 17 words were hollow, 10 blurred; the pitch stroke was sky blue, 2 px thick. The sizes were set by eye, and several were made with transforms, which change a word's picture and leave its room in the line as it was.

| Fix | Source | Lines | Control |
|---|---|---|---|
| Each mark is a quantity against the speaker's own unmarked speech: tempo as a ratio, level in dB, pitch in semitones, phonation and register as kinds | Kuhlmann & Iwarsson 2024 (1.27); Trouvain 2004 (0.6 [ASSUMED]); ANSI S3.5 (+5.99 dB); Pearsons et al. 1977 (−5 dB [ASSUMED]); Eriksson & Traunmüller 1999 (−26.8 dB); Willems 1983 (6 semitones [ASSUMED]) | voice.ts `soundOf` | RM1, RM2 |
| The look's sizes are derived from those quantities, set on the page, and held equal in the stylesheet | the quantities above; gains [ASSUMED] for legibility | ui.ts `lookVars`; index.ts `applyLook`; style.css `var(--rules-…, n)` | RM3, RM4 |
| Loudness is the word's ink: weight, size and opacity together | cues that vary together: 4.1 against about 2.7 bits (Eriksen, in Miller 1956); bold read as louder by 81 % (Bessemans et al. 2019) | style.css `.rules-v-loud`, `.rules-run-quiet`, `.rules-run-whisper` | RM4, RM5 |
| The palest ink keeps 4.5:1 on every shipped theme (opacity 0.78 at least; Celestial Macaron sets the bound) | WCAG 1.4.3 | ui.ts `INK_FLOOR` | RM5 |
| The pitch stroke is thin, in the word's own colour, above the word in the room between the lines; the word stays on its baseline | position ranks; hue names (Bertin 1967) | style.css `.rules-v[data-pitch]::before` | RM6, RM8 |
| Breathy is a row of dots under the run, creaky a wavy rule, whispered a broken rule: no blur, no hollow letter | the IPA's signs under a letter; reading slows as letters lose their edges and spacing (Yu et al. 2007) | style.css `.rules-run-*` | RM7 |
| Slower opens the gaps (0.2 em) and the letters (0.053 em); faster closes them a little and leans (10.6°) | further time 1 ÷ rate − 1; slower speech is mostly more pausing (Goldman-Eisler 1968, in Trouvain 2004); half-size width steps recognized by 55 % (Bessemans et al. 2019) | ui.ts `lookVars`, `drawVoice` (gap spans) | RM4, RM13 |
| A drawn-out vowel is written again once per further beat ("Nooo"), left out of a copied line | the notation's two colons (Jefferson) | ui.ts `heldParts` | RM11 |
| A pause is a dot per syllable of silence (0.5 s: three), apart from a cut-off's dash | 5 syllables/s [ASSUMED, 4.1–6] | voice.ts `pauseBeats`; ui.ts `drawVoice` | RM12 |
| Words side by side with the same soft voice or phonation stand in one span, so one rule runs under them | Chromium starts a decoration's pattern again at every word (seen in the first drafts of this pass) | ui.ts `drawVoice` (rules-run) | RM14 |
| A falsetto word is narrow by its font size and drawn tall again from its baseline: the line gives it the narrow room, no measuring in script | CSS layout: font size sets the advance, a transform does not | style.css `.rules-v-falsetto`; index.ts (fitSqueezed removed) | RM8 (the measure script) |
| The feeling is its word and a 2 px rule at the message's edge, in OKLCH coordinates: hue the kind, chroma the activation, lightness the valence | Jonauskaite et al. 2020 (hues); Wilms & Oberfeld 2018 (saturation and arousal, lightness and valence); Quinto et al. 2013 (the two activation groups); Carter & Carter 1982 (40 units) | style.css `--rules-felt` | RM9, RM10 |
| A marked word's hover text gives each mark's quantity | cues are read once told (Bessemans et al. 2019: untold, ignored) | ui.ts `drawVoice`; voice.ts `quantityOf` | RM15 |
| In both looks a word or added word of another size takes no line height of its own | CSS inline layout: an inline box of line-height 0 adds nothing to its line | style.css `.rules-v-quiet`, `.rules-v-falsetto`, `.rules-v-add-*` | the measure script |

The player's eight points, each with the decision taken here and what is the player's to define:

| Point | Decision | The player's to define |
|---|---|---|
| 1. Colour and speed; formants; colour theory | Colour carries the feeling, speed is drawn as time along the line. Red is rated more arousing than green and blue, and saturation raises arousal most (Wilms & Oberfeld 2018); faster music is matched with lighter, more saturated, yellower colours and slower with darker, greyer, bluer ones, through emotion (Palmer et al. 2013). So "red fast, blue slow" is a code for activation, and a reader meets red as anger first (Jonauskaite et al. 2020). Formants belong to the tract, not to speed; a measured vowel-to-colour mapping exists (Cuskley et al. 2019) and is left unused, since it would spend hue on what the letters say | whether a line's activation should also show as saturation |
| 2. What "fast" means | The speaker's own rate is the unit: syllables per second ÷ the speaker's own. Listeners tell tempos apart from about 5 % (Quené 2007). Faster is 1.27 times (Kuhlmann & Iwarsson 2024), slower 0.6 [ASSUMED] | the number of steps (3 now); a baseline rate per character, if a line's length in story time should follow |
| 3. A deeper layer under feelings | The marks are now quantities, the layer a feeling can write to. Scherer 1986 derives the voice's changes from appraisal through the body's response; measured, spoken anger, fear and happiness are higher, louder and faster than sadness and tenderness (Quinto et al. 2013). A feeling does not yet set the quantities | whether a feeling sets pitch, level and tempo itself or stays a label beside the marks; one deep value (activation) or two (with valence) |
| 4. Intensity steps | Coordinates, one decision each (OKLCH): hue the kind, chroma the activation, lightness the valence. Hue is named, not ranked, so intensity never steps through hues. About 5 levels of brightness and 9 hues are told apart alone (Miller 1956); half-steps were recognized by 22–55 % (Bessemans et al. 2019). Colours meant to be told apart stand 40 CIELUV units apart or more (Carter & Carter 1982): here 45 at least | the number of intensity levels (3 proposed) |
| 5. Redundancy | One part of the voice, one place; a second cue only with a stated reason (loudness, faster, the feeling). One form per meaning: "every two forms contrast in meaning" (Clark 1987), so a second form for the same content reads as a difference. Composed marks by default; a fused mark only for a combination the player's own chats show as frequent | which combinations are frequent enough to fuse, counted from marked chats |
| 6. Thinking and speaking | "Think" is the wider word: three VerbNet classes against two in the engine's lexicon. Sampled inner experience has five kinds: inner seeing 34 %, inner speech 26 %, feelings 26 %, unsymbolized thinking 22 %, sensory awareness 22 % (Heavey & Hurlburt 2008). Only inner speech has words and a pace, so only it takes tempo marks; none has a level at another's ear. Not built | which kinds the stories use (inner speech first) |
| 7. A physical layer in place of labels | Who hears a line is already computed from the level at 1 m, the distance, the walls and the noise (`acoustics.ts`). The marks now have levels too. The addressee is not in the wave and stays a stated fact. `effortOf` still names the effort by rule | whether `effortOf` should read the levels, so a softer word carries less far |
| 8. Words that mimic the sound; the vocal apparatus | Time, pitch, loudness and phonation come from breath and larynx and need no tract; they are drawn. The tract gives formants: vowel quality and the speaker's size. That needs the line's sounds first (a pronouncing dictionary; the repository holds none). A speaker's timbre is one value per speaker, so it fits a per-speaker look, not a per-word mark. A font with weight, width, slant and grade axes would give the sizes true widths | whether vowels should be drawn at all; whether marked lines get a shipped font |

Measured (`history/review-tests/browser/voice-look/`, `section-47-run.txt`):
- The uploaded tree, multiple distinctions: 2 of 13 lines at the story's line height and 1 of 13 free of every fault; the lighter look: 3 of 13 at the line height.
- This tree, multiple distinctions: 13 of 13 lines clean in Inter, Liberation Sans, DejaVu Serif, Liberation Serif and Lora, at 760 and 400 px; the lighter look 13 of 13 at the line height.
- The toolbar, loaded through `index.js`: 61 px tall (69 before), no gap after "falsetto".
- Feeling colours: lowest contrast 4.98 on the dark themes, 4.76 on the light one; closest pair 58 and 45 CIELUV units; for a deuteranope 29 and 21, for a protanope 9 and 7.

Open: the look inside SillyTavern; the speaker's own baseline from the body; formants; a feeling setting the quantities; `effortOf` and the hearing rules reading `voice.ts`; inner speech; degrees for a mark; a variable font.

Checked:
- `npm test`'s steps pass: route 218, frame 202, intent 37, engine 203, plan 60, size 9 of 9, ui 69, sequences 300 with 0 failing, all with 0 misses.
- Negative controls: RM1–RM15 caught; every control on `ui.js`, `index.js`, `style.css`, `voice.js`, `voice-code.js` and `prosody.js` (75) caught.
- Prompt audit: the same lines as on the uploaded tree. `docs/constants.md` regenerated: 135 constants (128 before).
- TypeScript 6.0.3 and 7.0.2 emit the same `.js` files for the whole tree; the pinned 5.6.3 is not on this machine.
- `section-47.patch` applies to the uploaded tree and reproduces this one. `credibility-first-edits.patch` is not regenerated: the first upload is not in this session.

## Sources

- Ward Larson, Rushmeier & Piatko 1997, TVI table and acuity equation: [tvcg97.pdf](http://www.anyhere.com/gward/papers/tvcg97.pdf)
- Crumey 2014, contrast threshold and naked-eye limit: [arXiv 1405.4209](https://arxiv.org/pdf/1405.4209)
- Krisciunas & Schaefer 1991, lunar magnitude (Eq. 9): [PASP 103:1033](https://cta-redmine.irap.omp.eu/attachments/download/3619/1991PASP__103_1033K.pdf)
- Open-Meteo historical weather API, hourly variables: [docs](https://open-meteo.com/en/docs/historical-weather-api)
- Dark adaptation time course: [Webvision](https://www.webvision.pitt.edu/book/part-viii-psychophysics-of-vision/light-and-dark-adaptation/)
- Kasten & Czeplak 1980 citation: [CSBE 17057](https://library.csbe-scgab.ca/docs/meetings/2017/CSBE17057.pdf)
- Haurwitz clear-sky model as implemented (1098, 0.059): [pvlib clearsky](https://pvlib-python.readthedocs.io/en/v0.4.0/_modules/pvlib/clearsky.html)
- Air mass (about 38 at the horizon): [Wikipedia, Air mass (astronomy)](https://en.wikipedia.org/wiki/Air_mass_(astronomy))
- Luminous efficacy of global radiation, 121.5 lm/W at one tropical site: [arXiv 1212.5259](https://www.arxiv.org/pdf/1212.5259)
- Fehr & Schmidt 1999, Table III: [QJE 114:817](https://web.stanford.edu/~niederle/Fehr.Schmidt.1999.QJE.pdf)
- Smoke extinction coefficient 8.7 m²/g (flaming): [NIST firedoc](https://firedoc.nist.gov/article/JHcyXYQBWEcjUZEY8eM6)
- Rowson & Duma 2013, combined probability of concussion (Eq. 2): [Ann Biomed Eng, doi 10.1007/s10439-012-0731-0](https://link.springer.com/doi/10.1007/s10439-012-0731-0)
- Walilko, Viano & Bir 2005, Olympic boxer punches (58 g, 6343 rad/s²): [PubMed 16183766](https://pubmed.ncbi.nlm.nih.gov/16183766/)
- Fleming 2006 on the knockout (secondary): [WBA medical article](https://www.wbaboxing.com/box-medical-articles/the-knockout-in-boxing)
- Judo choke release times (secondary): [agentmma](https://agentmma.com/mma-lab/mma-choke-unconscious-safety)
- Age-related course of acuity, ETDRS 2000 charts: [abstract](https://kris.kl.ac.at/en/publications/age-related-course-of-visual-acuity-obtained-with-etdrs-2000-char/)
- Hearing thresholds in an extended frequency range by age (ISO 7029 form): [Sonic Field library](https://labs.sonicfield.org/library/reference-hearing-thresholds-in-an-extended-frequency-range-as-a-function-of-age)
- Hip fracture, soft-tissue thickness and impact force: [Ann Biomed Eng 2022](https://link.springer.com/article/10.1007/s10439-022-02924-1)
- Walk–run transition, Froude number 0.45: [J Exp Biol 200:821](https://cob.silverchair.com/jeb/article/200/4/821/7425/Effect-of-reduced-gravity-on-the-preferred-walk)
- Motion sickness dose value, Km = 1/3 (Souman et al. 2022): [Vibration 5(4)](https://www.mdpi.com/2571-631X/5/4/44)
- Height loss from 40 to 80 (Framingham): [Nutrients 2023, PMC10649148](https://pmc.ncbi.nlm.nih.gov/articles/PMC10649148/)
- 1881 census tables (occupations by sex; no age column): [Vision of Britain](https://www.visionofbritain.org/census/table/EW1881AGE_M10)
- Three-process model parameters (S 0.0353, asymptotes 2.4 and 14.3, C 2.5 at 16.8 h, KSS 9.68 − 0.46 × alertness): [Ingre et al. 2014, PLoS ONE](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0108679)
- Three-process model equations: [Åkerstedt, Folkard & Portin 2004](https://cdn.craft.cloud/ca2895c5-8327-4824-8f06-e3438db1d6b7/assets/1.-Three-Process-Model-of-Alertness-Akerstedt-Folkard-Portin-2004.pdf)
- Energy densities 39.5 and 7.6 MJ/kg, Forbes's 10.4 kg: [Hall 2008, Int J Obes, PMC2376744](https://pmc.ncbi.nlm.nih.gov/articles/PMC2376744)
- Body fat from BMI (Jackson 2002 and others): [GlobalRPh](https://globalrph.com/medcalcs/estimation-of-total-body-fat/)
- WVS wave 7 item wording Q177–Q195: [arXiv 2512.15792](https://arxiv.org/pdf/2512.15792)
- ACT-R spacing model parameters (checked, not used): [Pavlik & Anderson](https://www.gwern.net/docs/www/act-r.psy.cmu.edu/f4b85d71f1bd93309c094119607097a071bb09e3.pdf)
- Regional life expectancy, 1800 (checked, too sparse to use): [Our World in Data](https://ourworldindata.org/life-expectancy-globally)
- Dehydration and cognition, Wittbrodt & Millard-Stafford 2018 (summary): [Georgia Tech news](https://news.gatech.edu/news/2018/07/16/we-get-parched-cognition-can-sputter-dehydration-study-says)
- Fasting and cognition, Bamberg et al. 2025, Psychol Bull: [abstract](https://ifp.nyu.edu/2025/journal-article-abstracts/bul0000492/)
- Induced pain and attention, meta-analysis: [J Pain Res 12](https://www.dovepress.com/does-experimentally-induced-pain-affect-attention-a-meta-analytical-re-peer-reviewed-fulltext-article-JPR)
- Folkard & Lombardi 2006, components of long work hours: [PubMed 16570251](https://pubmed.ncbi.nlm.nih.gov/16570251/)
- Fear and risk taking, Wake, Wormwood & Satpute 2020: [PMC7423744](https://pmc.ncbi.nlm.nih.gov/articles/PMC7423744)
- Anger and risk taking by sex, Ferrer et al. 2017: [HKS](https://www.hks.harvard.edu/publications/revisiting-effects-anger-risk-taking-empirical-and-meta-analytic-evidence-differences)
- Alcohol and aggression, Bushman & Cooper 1990: [PDF](https://public.websites.umich.edu/~bbushman/bc90.pdf)
- Vertical jump of adults, Xi'an 2010: [Atlantis Press 18807](https://www.atlantis-press.com/article/18807.pdf)
- Jump power of adults by age and sex: [JMNI 24:243](https://ismni.org/jmni/pdf/97/jmni_24_243.pdf)
- Liberty Mutual lifting tables (Snook & Ciriello 1991): [USF, Bernard 2022](https://health.usf.edu/-/media/v3/usf-health/COPH/Thomas-Bernard/Ergonomics/LMDesignGoalsMKS22.ashx)
- The limits of human starvation (Henry 2001): [ENN Field Exchange 15](https://ennonline.net/fex/15/limits)
- Asch's variations (majority size, an ally): [IB key study](https://www.themantic-education.com/ibpsych/2016/10/04/key-study-conformity-asch-1955/)
- Steblay, Dysart & Wells 2011, lineup meta-analysis: [CT Eyewitness Task Force copy](https://prdext3.cga.ct.gov/jud/tfs/20130901_Eyewitness%20Identification%20Task%20Force/20110921/Steblay,%20Dysart,%20Wells%202011%20Meta-Analysis.pdf)
- Wixted & Wells 2017, confidence and accuracy: [PDF](https://web.williams.edu/Psychology/Faculty/Kassin/files/Wixted%20&%20Wells%20(2017)%20-%20Eyewitness%20accuracy%20and%20confidence.pdf)
- Forgetting faces over a week (AUC by delay): [PeerJ 9:e11828](https://peerj.com/articles/11828)
- Deffenbacher et al. 2008, forgetting the once-seen face (checked, no parameters in the abstract): [UNO](https://digitalcommons.unomaha.edu/psychfacpub/3)
- Anxiety and working memory, Moran 2016 (g = −0.334, as cited): [Lukasik et al. 2019, Front Psychol](https://frontiersin.org/articles/10.3389/fpsyg.2019.00004/full)
- Sad mood and working memory, Valenti, Garcia & Galera 2021: [Psicol Reflex Crit 34:31](https://link.springer.com/article/10.1186/s41155-021-00196-7)
- Stress and eyewitness identification, Deffenbacher et al. 2004: [UNO abstract](https://digitalcommons.unomaha.edu/psychfacpub/1)
- Weapon focus, Steblay 1992: [NCJRS abstract](https://ojp.gov/ncjrs/virtual-library/abstracts/meta-analytic-review-weapon-focus-effect)
- Weapon focus, Fawcett et al. 2013 (g = 0.53 over all measures; checked, not used): [MacEwan](https://roam.macewan.ca/items/cd72262c-13b6-4f3d-98e1-937ece81ffa0/full)
- Own-race bias, Meissner & Brigham 2001: [PDF](https://majorsmatter.net/race/readings/Meissner%20PPL2001.pdf)
- Crowd pressures and compressive asphyxia (Hopkins et al. 1993; Fruin 1993): [G. K. Still, Pressure modelling](https://gkstill.com/CV/Modelling/Pressure.html)
- Long-jump approach speeds (checked; no take-off share): [JHSE](https://www.jhse.es/index.php/jhse/article/view/mechanics-distinct-long-jump-strategies), [ISBS 2008](https://lida.sport-iat.de/twm/Record/4016739?lng=en)
- Foot in the door, Burger 1999 (tables as extracted): [Pers Soc Psychol Rev 3:303](https://www.slideshare.net/slideshow/burger/2497673)
- Door in the face, Feeley, Anker & Aloe 2012: [abstract](https://iro.uiowa.edu/esploro/outputs/journalArticle/The-Door-in-the-Face-Persuasive-Message-Strategy-A/9984371078502771)
- Drowning outcomes by submersion duration: [ILCOR 2020 CoSTR](https://costr.ilcor.org/document/drowning-tfsr-costr); Quan et al. 2016 summary: [JournalFeed](https://journalfeed.org/?p=18)
- NYPD Annual Firearms Discharge Report 2011 (checked; no per-shot hit rate by distance): [PDF](https://www.nyc.gov/assets/nypd/downloads/pdf/analysis_and_planning/firearms-discharge/annual-firearms-discharge-2011.pdf)
- Suspect–filler similarity, Fitzgerald et al. 2013 (checked; no rates in the abstract): [Portsmouth](https://researchportal.port.ac.uk/en/publications/the-effect-of-suspect-filler-similarity-on-eyewitness-identificat/)
- Boys' sprint speed by age, Bleeker & Siener 2025: [Front Sports Act Living 7:1701476](https://pmc.ncbi.nlm.nih.gov/articles/PMC12714977/)
- Breath hold by water temperature (Hayward et al. 1984; Cheung et al. 2001): [Survival in Cold Waters, Transport Canada report](https://pdfs.semanticscholar.org/14d9/f6802cc1d9163c682a7fd6c331d3c2c56bd5.pdf); Barwood et al. 2006: [Northumbria](https://nrl.northumbria.ac.uk/id/eprint/17198)
- Police shooting accuracy, Donner & Popovich 2019 (as summarised): [Field Shooting Accuracy Study](https://funshoot.substack.com/p/field-shooting-accuracy-study)
- Long-jump take-off velocities, Linthorne 2007: [Biomechanics of the long jump](https://scispace.com/pdf/biomechanics-of-the-long-jump-31jvdz7e1o.pdf)
- Threat and visual contrast perception, Laretzaki et al. 2010: [J Psychopharmacol](https://journals.sagepub.com/doi/10.1177/0269881108098823)
- Freshwater submersion in small animals, Heffner et al. 2008: [RVC repository](https://rvc-repository.worktribe.com/output/1429635/evaluation-of-freshwater-submersion-in-small-animals-28-cases-1996-2006)
- Modifications of the social force model, Lakoba, Kaup & Finkelstein 2005: [PDF](https://tlakoba.w3.uvm.edu/recent_publications/2005_pedestrians.pdf)
- Lineup composition, Fitzgerald 2014 thesis (rates not in the abstract): [Regina](https://instrepo-prod7.cc.uregina.ca/items/aafe2e36-fb39-4420-b79c-eccf44111c9d/full)
- Exposure time and facial identification, Bornstein et al. 2012: [Nebraska](https://experts.nebraska.edu/en/publications/effects-of-exposure-time-and-cognitive-operations-on-facial-ident)
- Deception judgment moderators, Bond & DePaulo 2006: [PDF](https://assets.aclu.org/live/uploads/document/foia/2006-Personality-and-Social-Psychology-Review-Accuracy-of-Deception-Judgements.pdf)
- Ground reflectances (Page & Lebens): [IES VE Table 1](https://help.iesve.com/ve2021/table_1_ground_reflectance.htm); diffuse fraction, Erbs, Klein & Duffie 1982: [DNV SolarFarmer, Decomposition](https://myworkspace.dnv.com/download/public/renewables/solarfarmer/manuals/v1_1/CalcRef/Theory/Decomposition.html)
- Heat, cold and performance, Pilcher, Nadler & Busch 2002: [PDF](https://rosap.ntl.bts.gov/view/dot/8524/dot_8524_DS1.pdf)
- Undergraduate IQ by year, Uttl, Violo & Gibson 2024: [ScienceOpen](https://www.scienceopen.com/document_file/7eb5d3d2-5f05-434f-a98f-4f44adaf1a63/ScienceOpen/sor20240002.pdf)
- BS 8206-2 daylight factors, as quoted: [An Bord Pleanála daylight assessment](https://www.pleanala.ie/publicaccess/EIAR-NIS/311588/Documentation/Other/Assessment of Sunlight & Daylight Access within the Proposed Development.pdf)
- Breakpoints, Clark 1954 and FM 105-5: [Dupuy Institute, The 40 % Rule](https://dupuyinstitute.org/2024/03/26/the-40-rule/)
- Alcohol after food, Jones 1991: [NCJRS abstract](https://www.ojp.gov/ncjrs/virtual-library/abstracts/concentration-time-profiles-ethanol-capillary-blood-after-ingestion); peak time, Jones, Jönsson & Neri 1991: [NCJRS abstract](https://ojp.gov/ncjrs/virtual-library/abstracts/peak-blood-ethanol-concentration-and-time-its-occurrence-after)
- Who can swim, World Risk Poll 2019: [Gallup](https://news.gallup.com/opinion/gallup/352679/majority-worldwide-cannot-swim-women.aspx)
- VerbNet 3.4 (perception classes 30.1–30.3): [github.com/cu-clear/verbnet](https://github.com/cu-clear/verbnet)
- Horvitz 1999, Principles of Mixed-Initiative User Interfaces: [PDF](https://www.interruptions.net/literature/Horvitz-CHI99-p159-horvitz.pdf); Rao & Daumé III 2018: [ACL](https://aclanthology.org/P18-1255/); Zhang & Choi, Clarify When Necessary: [arXiv](https://arxiv.org/abs/2311.09469v1)
- Parser disambiguation: [Zarf 2024](https://blog.zarfhome.com/2024/01/parser-if-disambiguation), [intfiction.org](https://intfiction.org/t/disambiguation-without-unnecessary-questions/10908); explicit and implicit confirmation: [UW LING 575](https://courses.washington.edu/ling575/SPR2017/slides/ling575_class4_DM_flat.pdf); Alexa dialog model: [Amazon](https://developer.amazon.com/de-DE/docs/alexa/custom-skills/define-the-dialog-to-collect-and-confirm-required-information.html)
- Attempto Controlled English: [Wikipedia](https://en.wikipedia.org/wiki/Attempto_Controlled_English); Elgohary et al. 2020: [arXiv](https://arxiv.org/abs/2005.02539v1); grounding: [Wikipedia](https://en.wikipedia.org/wiki/Grounding_in_communication)
- FrameNet: [What is FrameNet](https://framenet.icsi.berkeley.edu/WhatIsFrameNet); SemLink: [Colorado](https://verbs.colorado.edu/semlink)
- PropBank frameset fire (fire.01 shoot, fire.02 dismiss, fire.03 bake, fire.04 ignite): [verbs.colorado.edu](https://verbs.colorado.edu/propbank/framesets-english-aliases/fire.html)
- FrameNet Use_firearm (Agent, Firearm, Source, Path, Goal): [PreMOn fn16](https://premon.fbk.eu/premon/fn16-use_firearm)
- Olsson et al. 2022, In-context Learning and Induction Heads: [arXiv 2209.11895](https://arxiv.org/abs/2209.11895)
- Jang et al. 2022, Can Large Language Models Truly Understand Prompts? A Case Study with Negated Prompts: [arXiv 2209.12711](https://arxiv.org/abs/2209.12711)
- VerbNet 3.4 class files, selectional restrictions and frames: [github.com/cu-clear/verbnet](https://github.com/cu-clear/verbnet)
- Open English WordNet 2024: [github.com/globalwordnet/english-wordnet](https://github.com/globalwordnet/english-wordnet)
- SemLink 2 annotated instances: [github.com/cu-clear/semlink](https://github.com/cu-clear/semlink)
- Gale, Church & Yarowsky 1992, One sense per discourse: [ACL Anthology H92-1045](https://aclanthology.org/H92-1045.pdf)
- Yarowsky 1993, One sense per collocation: [ACL Anthology H93-1052](https://aclanthology.org/H93-1052.pdf)
- Ernst & Banks 2002, Humans integrate visual and haptic information in a statistically optimal fashion, Nature 415:429: [RePEc](https://ideas.repec.org/a/nat/nature/v415y2002i6870d10.1038_415429a.html)
- MacDonald, Pearlmutter & Seidenberg 1994, The lexical nature of syntactic ambiguity resolution, Psychological Review: [scilit](https://scilit.com/publications/2c5d0753b356bfc4bafc49bf4ebdbee6)
- Lesk 1986, Automatic sense disambiguation using machine readable dictionaries (SIGDOC): [dblp](https://dblp1.uni-trier.de/rec/conf/sigdoc/Lesk86.html)
- Word frequencies from OpenSubtitles 2018: [hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords)
- Roots of observe, serve, discern, watch: Etymonline [observe](https://www.etymonline.com/word/observe), [serve](https://www.etymonline.com/word/serve), [discern](https://www.etymonline.com/word/discern), [watch](https://www.etymonline.com/word/watch)
- Toasts and timing: W3C, [Understanding SC 2.2.1 Timing Adjustable](https://w3c.github.io/wcag/understanding/timing-adjustable); Roselli, [Defining "Toast" Messages](https://adrianroselli.com/2020/01/defining-toast-messages.html); [LogRocket, toast notifications](https://blog.logrocket.com/ux-design/toast-notifications); NN/g, [Indicators, Validations, and Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)
- One action per snackbar ("Each snackbar may contain a single action"): [Material Design 1, Snackbars & toasts](https://m1.material.io/components/snackbars-toasts.html)
- Undo over warnings: Raskin, [Never Use a Warning When You Mean Undo](https://alistapart.com/article/neveruseawarning/); defaults: Johnson & Goldstein 2003, [replication record](https://forrt.org/flora-replication-atlas/doi/10.1126/science.1091721/)
- Inform's parser choice in parentheses: [intfiction.org](https://intfiction.org/t/more-elaborate-clarification-of-the-parsers-choice/71634); Disco Elysium's dialogue UI: [case study](https://tommartin.myblog.arts.ac.uk/?p=168), [Narrat forum](https://narrat.discourse.group/t/making-skillchecks-more-disco-like/313); inkle on 80 Days' UI: [Vice](https://vice.com/en/article/the-makers-of-mobile-hit-80-days-on-the-importance-of-amazing-ui-852)
- SillyTavern theme variables, message, popup and toast code: [SillyTavern source](https://github.com/SillyTavern/SillyTavern) (`public/style.css`, `public/css/popup.css`, `public/scripts/popup.js`, `public/script.js`, `public/scripts/extensions.js`); [UI customization docs](https://docs.sillytavern.app/usage/user_settings/uicustomization.md)
- Okabe & Ito 2008, Color Universal Design, hex values and citation: [ConceptViz reference](https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference); original at jfly.uni-koeln.de/color
- Type history: [Wikipedia, Baskerville](https://en.wikipedia.org/wiki/Baskerville); [Wikipedia, Didone (typography)](https://en.wikipedia.org/wiki/Didone_(typography)); the faces' own descriptions and licences: [google/fonts](https://github.com/google/fonts) (ofl/ebgaramond, imfellenglish, librebaskerville, oldstandardtt, librecaslontext)
- SillyTavern's shipped theme colours: [SillyTavern source](https://github.com/SillyTavern/SillyTavern) (`default/content/themes`)
- Jefferson's transcription conventions: [TalkBank CA appendix](https://talkbank.org/ca/access/0docs/JOC-PDF/Appendices/7-appendix.pdf); [University Transcriptions' guide](https://universitytranscriptions.co.uk/jefferson-transcription-system-a-guide-to-the-symbols/); [Danish CA conventions](https://samtalegrammatik.dk//en/about-samtalegrammatikdk/transcription-conventions)
- VoQS: [Wikipedia, Voice Quality Symbols](https://en.wikipedia.org/wiki/Voice_Quality_Symbols) (Ball, Esling & Dickson 1995, JIPA)
- Juslin & Laukka 2003, Communication of emotions in vocal expression and music performance, Table 4: [PDF](https://www.brainmusic.org/EducationalActivities/Juslin_emotion2003.pdf)
- Tartter & Braun 1994, Hearing smiles and frowns in normal and whisper registers (abstract): [Sonic Field library](https://labs.sonicfield.org/library/hearing-smiles-and-frowns-in-normal-and-whisper-registers)
- Unicode tag characters: [Wikipedia, Tags (Unicode block)](https://en.wikipedia.org/wiki/Tags_(Unicode_block))
- SillyTavern source, release branch 2026-09-14 (commit 06bde93): [public/script.js](https://github.com/SillyTavern/SillyTavern/blob/release/public/script.js), [public/scripts/tool-calling.js](https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/tool-calling.js), [public/scripts/extensions.js](https://github.com/SillyTavern/SillyTavern/blob/release/public/scripts/extensions.js)
- WAI-ARIA Authoring Practices, Button pattern (Enter and Space): [W3C APG](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- Bohannon 1997, comfortable and maximum walking speed of adults aged 20–79 (Table 4): [Age Ageing 26:15, academia.edu copy](https://www.academia.edu/43982374/Comfortable_and_maximum_walking_speed_of_adults_aged_20_79_years_reference_values_and_determinants); [PubMed 9143432](https://pubmed.ncbi.nlm.nih.gov/9143432/)
- Selinger et al. 2022, energy-optimal and preferred running speeds by sex (as reported): [Popular Science](https://www.popsci.com/health/running-speed-energy-efficiency/); the paper: [Current Biology / PMC9169516](https://pmc.ncbi.nlm.nih.gov/articles/PMC9169516/)
- SCOWL word lists and Hunspell dictionaries: [wordlist.sourceforge.net](http://wordlist.sourceforge.net); npm packages dictionary-en 4.0.0 and dictionary-en-gb 3.0.0
- Zhang, Piras, Chen, Kong & Wang 2022, perceptual anticipation in combat sports, experts against non-experts: [Front Psychol 13:961960](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2022.961960/full)
- Huang et al. 2023, knockouts and the loss of muscle tone (checked; no duration of unconsciousness): [Med Res Arch 11(6)](https://esmed.org/MRA/mra/article/download/4007/99193547033)
- BRE IP2/06, rain noise on roofs (checked; not used): [BRE](https://files.bregroup.com/bre-co-uk-file-library-copy/filelibrary/rpts/IP02_06_Rain_noise.pdf)
- Bohannon 1997, abstract (the ranges of comfortable and maximum gait speed): [Age Ageing 26:15, Oxford Academic](https://academic.oup.com/ageing/article/26/1/15/35875)
- Huddleston & Pullum 2002, The Cambridge Grammar of the English Language (Cambridge University Press), read from the user's copy: ch. 4 §7 light verbs, pp. 290–296; ch. 5 §3.3 quantificational nouns, pp. 349–352, partitives p. 411; ch. 9 §4.4 covertly negative items, pp. 835–837, approximate negators p. 723; ch. 14 §§1.7, 3, 5 understood subjects and catenative classes, pp. 1193–1240; ch. 17 §3.1 reflexives, p. 1484: [Cambridge Core](https://www.cambridge.org/core/books/cambridge-grammar-of-the-english-language/)
- Estigarribia 2020, A Grammar of Paraguayan Guarani (UCL Press, CC BY 4.0), read from the user's copy: [OAPEN](https://library.oapen.org/handle/20.500.12657/51773)
- Karttunen 2012, Simple and Phrasal Implicatives (*SEM 2012), Tables 1–2: [ACL Anthology](https://preview.aclanthology.org/fix_video/S12-1020.pdf)
- Nairn, Condoravdi & Karttunen 2006, Computing relative polarity for textual inference: [PDF](https://web.stanford.edu/~cleoc/icos2006-final.pdf)
- Van Eynde & Kim 2020, Pseudo-partitives in English (HPSG 2020): [PDF](https://hpsg.hu-berlin.de/hpsg2020/wp-content/uploads/2020/08/vaneynde-kim.pdf)
- PARSEME shared task guidelines 1.3, light-verb constructions (consulted): [guidelines](https://parsemefr.lis-lab.fr/parseme-st-guidelines/1.3/index.php?page=lvc)
- Open English WordNet 2024 (McCrae et al. 2019), CC BY 4.0: [GitHub release](https://github.com/globalwordnet/english-wordnet/releases/download/2024-edition/english-wordnet-2024.xml.gz)
- Bohannon 1997, Table 4 read in full: [academia.edu copy](https://www.academia.edu/43982374/Comfortable_and_maximum_walking_speed_of_adults_aged_20_79_years_reference_values_and_determinants)
- Selinger et al. 2022, full citation (Current Biology 32:2309–2315): [Stanford Mobilize center](https://mobilize.stanford.edu/?p=5823); data and code: [SimTK run_energetics](https://simtk.org/projects/run_energetics)
- Hånell & Rostami 2020, "How Can a Punch Knock You Out?" (Front Neurol 11:570566): [Frontiers](https://www.frontiersin.org/journals/neurology/articles/10.3389/fneur.2020.570566/full)
- Bernick et al. 2020, video review of concussions in professional boxing and MMA (checked; times fights after concussion, not unconsciousness): [medRxiv](https://www.medrxiv.org/content/10.1101/2020.04.28.20073221v1.full.pdf)
- Levy 2008, "A noisy-channel model of rational human sentence comprehension under uncertain input" (EMNLP); Gibson, Bergen & Piantadosi 2013: [PNAS 110:8051, PMC3657782](https://pmc.ncbi.nlm.nih.gov/articles/PMC3657782)
- Gundel, Hedberg & Zacharski 1993, the Givenness Hierarchy and its English counts: [Language 69:274, scanned copy](https://www.coli.uni-saarland.de/~korbay/Courses/esslli04/Scans/gundel-etal.pdf)
- Kehler & Rohde, the Bayesian pronoun model: [Kehler 2015 slides](https://idsl1.phil-fak.uni-koeln.de/sites/Experimental_Linguistics/ProminencePragmatics/Kehler2015-SLE-Leiden.pdf); Rohde & Kehler 2014: [Lang Cogn Neurosci 29:8](https://www.tandfonline.com/doi/full/10.1080/01690965.2013.854918)
- Rosa & Arnold 2017, pronoun rates by role in English continuations: [Arnold lab copy](https://arnoldlab.web.unc.edu/wp-content/uploads/sites/2225/2016/07/RosaArnold.pdf)
- Bader & Portele 2019, next-mention rates (German): [Z Sprachwiss, De Gruyter](https://www.degruyterbrill.com/document/doi/10.1515/zfs-2019-2002/pdf)
- Dhakal, Feit, Kristensson & Oulasvirta 2018, typing errors: [CHI 2018](https://www.pokristensson.com/pubs/DhakalEtAlCHI2018.pdf)
- Noisy-channel spelling (Kernighan, Church & Gale 1990; one-edit errors): [Stanford CS276 handout](https://web.stanford.edu/class/cs276/handouts/spelling.pdf)
- Summit metabolism ÷ basal in mammals, typically 4–8 (Minnaar, Bennett, Chimimba & McKechnie 2014, J Exp Biol 217:1363–1369): [University of Pretoria repository](https://repository.up.ac.za/handle/2263/49156)
- VoQS labelled braces, "{3V! ... 3V!}": [Wikipedia, Voice Quality Symbols](https://en.wikipedia.org/wiki/Voice_Quality_Symbols)
- SillyTavern function calling, isToolCallingSupported: [docs.sillytavern.app](https://docs.sillytavern.app/for-contributors/function-calling)
- Burn degrees from the Henriques integral (checked, not used): [Majchrzak & Jasiński 2003, Acta Bioeng Biomech 5(1)](https://actabio.pwr.edu.pl/fcp/kGBUKOQtTKlQhbx08SlkTUARAUWRuHQwFDBoIVURNWHRWFVZpCFghUHcKVigEQUw/302/public/publikacje/v5-1-2003/7.pdf)
- Pronouns do not permit determiners, CGEL ch. 5 §10.2, p. 429 (Huddleston & Pullum 2002, read from the copy in hand)
- Social group and people synsets (oewn-07967506-n, oewn-07958392-n): [Open English WordNet 2024](https://github.com/globalwordnet/english-wordnet)
- AIDS, LED and SWAT as nouns written in capitals: Merriam-Webster, [AIDS](https://merriam-webster.com/dictionary/Aids), [LED](https://merriam-webster.com/dictionary/LED), [SWAT](https://merriam-webster.com/dictionary/SWAT); [SIM card](https://www.merriam-webster.com/dictionary/sim%20card), variant SIM
- PIN, personal identification number: [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/definition/american_english/pin_2)
- Emphasis delimiters, no _ emphasis inside a word: CommonMark Spec 0.31.2, §6.2, rules 1–4 (spec.commonmark.org; the rules as quoted on [a copy at UW–Madison](https://users.ssc.wisc.edu/~dehemken/Stataworkshops/stmd/Markdown/emphasis1.html))
- Mouse events after a tap, at the touchend: [W3C Touch Events, "Interaction with Mouse Events"](https://www.w3.org/TR/2011/WD-touch-events-20110913/Overview.html)
- Burn degrees by the damage integral (first 0.53 ≤ Ω < 1, second 1 ≤ Ω < 10⁴, third Ω ≥ 10⁴): Wang, Foley & Zhou 2024, [arXiv 2408.11947](https://arxiv.org/abs/2408.11947), eq. 10, citing Pearce, Diller & Valvano 2017 and Orgill et al. 1998; full thickness as Ω > 1 at the dermal base instead: [Majchrzak & Jasiński 2003 (citing Torvi & Dale 1994)](https://amcm.pcz.pl/2003_1/art_07.pdf)
- German and Swiss quotation marks („…“ ‚…‘, »…« ›…‹, Swiss «…» without spaces): Christoph Bier 2006, [typokurz: Einige wichtige typografische Regeln, §2](https://web.pdx.edu/~fischerw/courses/320_420/docs/0076-0100/0095_typokurz_regeln.pdf)
- Hackett & Roach 2001, acute mountain sickness above 2,500 m: [NEJM 345:107](https://amga.com/wp-content/uploads/2013/09/NEJM-HAI.pdf)
- DePaulo, Kashy, Kirkendol, Wyer & Epstein 1996, content of 1,535 everyday lies (Table 5): [JPSP 70:979](https://smg.media.mit.edu/library/DePauloEtAl.LyingEverydayLife.pdf)
- VerbNet thematic role Value: [VerbNet 3.3 reference](https://verbs.colorado.edu/verb-index/vn3.3/themroles/Value.php); Bonial et al., VerbNet role hierarchy: [paper](https://let.uvt.nl/general/people/bunt/docs/bonial-final.pdf)
- Troponymy in WordNet (Fellbaum): [On the Semantics of Troponymy](https://rd.springer.com/chapter/10.1007/978-94-017-0073-3_2)
- Merriam-Webster, tiptoe: [definition](https://www.merriam-webster.com/dictionary/tiptoe); creep: [definition](https://www.merriam-webster.com/dictionary/creep); prowl: [definition](https://www.merriam-webster.com/dictionary/prowl)
- Glenberg & Robertson 2000, Symbol grounding and meaning (Exp. 1: 4.32 vs 1.31, LSA .06 both): [J Mem Lang 43:379, PDF](https://psychology.illinoisstate.edu/jccutti/psych480_24/readings/glenberg2000.pdf)
- Ahn et al. 2022, Do As I Can, Not As I Say (SayCan): [arXiv 2204.01691](https://arxiv.org/abs/2204.01691)
- Brown, Bonn, Kazeminejad, Zaenen, Pustejovsky & Palmer 2022, VerbNet and the Generative Lexicon: [Front Artif Intell 5:821697](https://www.frontiersin.org/articles/10.3389/frai.2022.821697/full)
- Kim & Schuster 2023, Entity Tracking in Language Models: [ACL 2023](https://aclanthology.org/2023.acl-long.213), [arXiv 2305.02363](https://arxiv.org/pdf/2305.02363v2.pdf)
- Murphy & Koop 2005, vapour pressures of ice and supercooled water (formulas as quoted): [QJRMS 131:1539, doi 10.1256/qj.04.94](https://zendy.io/title/10.1256/qj.04.94), [CIRES formula list](https://cires1.colorado.edu/~voemel/vp.html)
- Koop, Luo, Tsias & Peter 2000, water activity and homogeneous ice nucleation: [Nature 406:611](https://www.nature.com/articles/35020537); the rate polynomial as implemented: [CloudMicrophysics.jl docs](https://docs.juliahub.com/General/CloudMicrophysics/stable/IceNucleation/)
- Brennan, David & Borduas-Dedekind 2020, INPs in Swiss Alpine snow: [ACP 20:163](https://acp.copernicus.org/articles/20/163/2020/acp-20-163-2020.html)
- Zobrist, Marcolli, Peter & Koop 2008, heterogeneous ice nucleation and water activity (abstract): [record](https://data.zhenzhi.com/details/1/880724795)
- Koop & Zobrist 2009, parameterizations for ice nucleation: [PCCP 11:10839](https://pubs.rsc.org/en/content/articlehtml/2009/cp/b914289d)
- Freezing points of ethanol–water (Lange 1967): [Wikipedia, Ethanol (data page)](https://en.wikipedia.org/wiki/Ethanol_(data_page))
- Kuhlmann & Iwarsson 2024, Effects of speaking rate on breathing and voice behavior (Table 1): [J Voice 38:346](https://www.sciencedirect.com/science/article/pii/S0892199721003052)
- Trouvain 2004, Tempo Variation in Speech Production, ch. 2 (Table 2.1; slowed news; Goldman-Eisler 1968 quoted): [Phonus 8](https://www.coli.uni-saarland.de/~trouvain/Phonus8/02_chapter2.pdf)
- Quené 2007, On the just noticeable difference for tempo in speech (abstract): [J Phonetics 35:353](https://cspeech.ucd.ie/rppw/rppw10/quene/abstract.html)
- Willems 1983, English Intonation from a Dutch Point of View: [ICPhS 10](https://www.coli.uni-saarland.de/Phonetics/icphs/ICPhS1983/p10.2_706.pdf)
- Bessemans, Renckens, Bormans, Nuyts & Larson 2019, Visual prosody supports reading aloud expressively: [Visible Language 53.3](https://journals.uc.edu/index.php/vl/article/view/4653), [PDF](https://www.microsoft.com/en-us/research/uploads/prod/2021/06/Bessemans-Renkins-Bormans-Nuyts-Larson-2019-Visual-Prosody-supports-reading-aloud-expressively.pdf)
- Miller 1956, The magical number seven, plus or minus two (absolute judgments; Eriksen's correlated cues): [Psychol Rev 63:81](https://labs.la.utexas.edu/gilden/files/2016/04/MagicNumberSeven-Miller1956.pdf)
- Yu, Cheung, Legge & Chung 2007, Effect of letter spacing on visual span and reading speed: [J Vis 7(2):2](https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/2020-08/Yu%20Cheung%20Legge%20Chung%202007%20Effect%20of%20letter%20spacing%20on%20visual%20span%20and%20reading%20speed.pdf)
- Wilms & Oberfeld 2018, Color and emotion: effects of hue, saturation, and brightness: [Psychol Res 82:896](https://www.staff.uni-mainz.de/oberfeld/downloads/Wilms-Oberfeld2018_Article_ColorAndEmotionEffectsOfHueSat.pdf)
- Jonauskaite et al. 2020, Universal patterns in color-emotion associations (the associations at .40 or more): [Psychol Sci 31:1245](https://biopen.bi.no/bi-xmlui/bitstream/11250/2761614/1/Jonauskaite_etal_2020_PsychScience.pdf)
- Quinto, Thompson & Keating 2013, Emotional communication in speech and music (Table 1): [Front Psychol 4:184](https://frontiersin.org/articles/10.3389/fpsyg.2013.00184/full)
- Carter & Carter 1982, High-contrast sets of colors, as the R package Polychrome states it: [Polychrome, distances](https://search.r-project.org/CRAN/refmans/Polychrome/html/distances.html)
- The sone scale (Stevens 1936; 10 phons double the loudness): [Wikipedia, Sone](https://en.wikipedia.org/wiki/Sone)
- Palmer, Schloss, Xu & Prado-León 2013, Music–color associations are mediated by emotion (PNAS 110:8836), as summarized: [ScienceDaily](https://www.sciencedaily.com/releases/2013/05/130516151256.htm)
- Cuskley, Dingemanse, Kirby & van Leeuwen 2019, vowel–color mappings in a large online sample: [Behav Res Methods 51:1651](https://link.springer.com/10.3758/s13428-019-01203-7)
- Heavey & Hurlburt 2008, The phenomena of inner experience: [Conscious Cogn 17:798](https://Www.Gwern.net/doc/psychology/inner-voice/2008-heavey.pdf)
- Alderson-Day & Fernyhough 2015, Inner speech: development, cognitive functions, phenomenology, and neurobiology: [Psychol Bull 141:931](https://durham-repository.worktribe.com/OutputFile/1430593)
- Clark 1987, The principle of contrast: [in MacWhinney, Mechanisms of Language Acquisition](https://faculty.wcas.northwestern.edu/robvoigt/courses/2021_fall/ling334/readings/Clark1987contrast.pdf)
- Scherer 1986, Vocal affect expression: a review and a model for future research (abstract): [Psychol Bull 99:143](https://archive-ouverte.unige.ch/unige:101902)
- Fitch & Giedd 1999, Morphology and development of the human vocal tract (abstract): [JASA 106:1511](https://scilit.com/publications/ccc8cd73e3ff301985ababeec113cb80)
