# Progress log

Newest first. Each entry: date, model, what changed (plain words), what was checked, what is next.

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
