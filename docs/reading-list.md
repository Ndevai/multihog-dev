# Reading list: 100 sources, 20 per day

Each entry is the widest single source for its question: a whole-system model, a meta-analysis, or a global database that contains the narrower studies. Written from memory on 2026-10-13: search each by its exact title (Google Scholar, PubMed Central, the author's page, Unpaywall). Entries marked (book), (data) or (report) are not journal articles. Send the PDFs to the next session with this file; the column "Engine" names the tool or section the source feeds.

## Day 1: the body

| # | Source | Gives | Engine |
|---|---|---|---|
| 1 | Hester RL et al. 2011, "HumMod: a modeling environment for the simulation of integrative human physiology", Front Physiol 2:12 | 5,000-variable whole-body model | §5–6 |
| 2 | Baird A et al. 2020, "BioGears: A C++ library for whole body physiology simulations", J Open Source Softw 5:2645 | the chosen body engine | §5–6 |
| 3 | Takahashi Y et al. 2021, "Thermoregulation model JOS-3 with new open source code", Energy Build 231:110575 | the thermal model in use | §6.4 |
| 4 | Fiala D et al. 2012, "UTCI-Fiala multi-node model of human heat transfer and temperature regulation", Int J Biometeorol 56:429 | thermal model validated on outdoor climates | §6.4 |
| 5 | Hall KD et al. 2011, "Quantification of the effect of energy imbalance on bodyweight", Lancet 378:826 | weight change over weeks to years from intake | §6.3 food |
| 6 | Hall KD 2010, "Predicting metabolic adaptation, body weight change, and energy intake in humans", Am J Physiol Endocrinol Metab 298:E449 | the equations behind #5 | §6.3 |
| 7 | Cheuvront SN, Kenefick RW 2014, "Dehydration: physiology, assessment, and performance effects", Compr Physiol 4:257 | thirst onset, water loss effects | §6.3 water |
| 8 | Sawka MN et al. 2007, "American College of Sports Medicine position stand: exercise and fluid replacement", Med Sci Sports Exerc 39:377 | sweat rates by work and climate | §6.3 |
| 9 | Borbély AA et al. 2016, "The two-process model of sleep regulation: a reappraisal", J Sleep Res 25:131 | sleep pressure + circadian clock | §6.3 sleep |
| 10 | Van Dongen HPA et al. 2003, "The cumulative cost of additional wakefulness", Sleep 26:117 | performance under chronic sleep restriction | §6.3 sleep |
| 11 | Herrmann SD et al. 2024, "2024 Adult Compendium of Physical Activities", J Sport Health Sci 13:6 | energy cost of about 1,100 activities | PassTime, §6.3 |
| 12 | Pandolf KB, Givoni B, Goldman RF 1977, "Predicting energy expenditure with loads while standing or walking very slowly", J Appl Physiol 43:577 | load-carrying cost | §6.7 |
| 13 | Gutierrez G, Reines HD, Wulf-Gutierrez ME 2004, "Clinical review: hemorrhagic shock", Crit Care 8:373 | blood loss classes and effects | §5 bleeding |
| 14 | Baker SP et al. 1974, "The Injury Severity Score", J Trauma 14:187 | death risk from combined injuries | §5 wounds |
| 15 | Fackler ML 1996, "Gunshot wound review", Ann Emerg Med 28:194 | wound ballistics | §4.4b shots |
| 16 | Lapostolle F et al. 2005, "Prognostic factors in victims of falls from height", Crit Care Med 33:1239 | death by fall height | BodyFall |
| 17 | Tikuisis P 1997, "Prediction of survival time at sea based on observed body cooling rates", Aviat Space Environ Med 68:441 | cold-water survival time | §6.4 |
| 18 | Luks AM et al. 2019, "Wilderness Medical Society clinical practice guidelines for the prevention and treatment of acute altitude illness", Wilderness Environ Med 30:S3 | altitude illness by height and ascent rate | §6.6 |
| 19 | Coburn RF, Forster RE, Kane PB 1965, "Considerations of the physiological variables that determine the blood carboxyhemoglobin concentration in man", J Clin Invest 44:1899 | CO uptake equation | §6.8 |
| 20 | Jones AW 2010, "Evidence-based survey of the elimination rates of ethanol from blood with applications in forensic casework", Forensic Sci Int 200:1 | alcohol in blood over time | BodyIntake |

## Day 2: senses, speech, memory, decisions

| # | Source | Gives | Engine |
|---|---|---|---|
| 21 | Anderson JR et al. 2004, "An integrated theory of the mind", Psychol Rev 111:1036 | ACT-R: one model of memory, attention, learning, timing | Look, Listen, forgetting |
| 22 | Ratcliff R, McKoon G 2008, "The diffusion decision model: theory and data for two-choice decision tasks", Neural Comput 20:873 | speed and error of any quick decision | Choose, Look |
| 23 | Rubin DC, Wenzel AE 1996, "One hundred years of forgetting: a quantitative description of retention", Psychol Rev 103:734 | 210 forgetting curves fitted | §11 forgetting |
| 24 | Bahrick HP 1984, "Semantic memory content in permastore", J Exp Psychol Gen 113:1 | knowledge kept for 50 years | §11 forgetting |
| 25 | Cowan N 2001, "The magical number 4 in short-term memory", Behav Brain Sci 24:87 | working-memory capacity | Listen, Look |
| 26 | Loftus EF 2005, "Planting misinformation in the human mind: a 30-year investigation of the malleability of memory", Learn Mem 12:361 | false memory rates | Claim, testimony |
| 27 | Wixted JT, Wells GL 2017, "The relationship between eyewitness confidence and identification accuracy", Psychol Sci Public Interest 18:10 | eyewitness accuracy | Look |
| 28 | Bond CF, DePaulo BM 2006, "Accuracy of deception judgments", Pers Soc Psychol Rev 10:214 | lie detection 54 % | Interpret, Trust |
| 29 | French NR, Steinberg JC 1947, "Factors governing the intelligibility of speech sounds", J Acoust Soc Am 19:90 | articulation index (basis of the speech intelligibility index) | Communicate, Listen |
| 30 | Houtgast T, Steeneken HJM 1985, "A review of the MTF concept in room acoustics and its use for estimating speech intelligibility in auditoria", J Acoust Soc Am 77:1069 | speech through rooms and echo | Listen |
| 31 | Pearsons KS, Bennett RL, Fidell S 1977, "Speech levels in various noise environments", US EPA 600/1-77-025 (report) | how loud people speak in each setting | Communicate |
| 32 | Blackwell HR 1946, "Contrast thresholds of the human eye", J Opt Soc Am 36:624 | seeing at each light level | Look |
| 33 | Duntley SQ 1948, "The visibility of distant objects", J Opt Soc Am 38:237 | seeing through haze and distance | Look |
| 34 | Johnson J 1958, "Analysis of image forming systems", Image Intensifier Symposium (report) | detect / recognise / identify distances | Look |
| 35 | Brysbaert M, New B 2009, "Moving beyond Kučera and Francis", Behav Res Methods 41:977 | word frequency (SUBTLEX) | roman.ts, mishearing |
| 36 | Tversky A, Kahneman D 1992, "Advances in prospect theory: cumulative representation of uncertainty", J Risk Uncertain 5:297 | risky choice with fitted parameters | Choose |
| 37 | Falk A et al. 2018, "Global evidence on economic preferences", Q J Econ 133:1645 | risk, patience, trust, reciprocity in 76 countries | Choose, SocialResponse |
| 38 | Wickens CD 2008, "Multiple resources and mental workload", Hum Factors 50:449 | doing two things at once | WorkOut, Look |
| 39 | Der G, Deary IJ 2006, "Age and sex differences in reaction time in adulthood", Psychol Aging 21:62 | reaction time by age and sex | HoldOn, Chase |
| 40 | Gooskens C et al. 2018, "Mutual intelligibility between closely related languages in Europe", Int J Multiling 15:169 | understanding a related language | Listen |

## Day 3: emotion, people, culture

| # | Source | Gives | Engine |
|---|---|---|---|
| 41 | Russell JA 1980, "A circumplex model of affect", J Pers Soc Psychol 39:1161 | emotion as valence × arousal | §6.13 |
| 42 | Scherer KR 2009, "The dynamic architecture of emotion: evidence for the component process model", Cogn Emot 23:1307 | appraisal → emotion | §6.13 |
| 43 | Verduyn P, Lavrijsen S 2015, "Which emotions last longest and why", Motiv Emot 39:119 | duration of 27 emotions | §6.13 |
| 44 | Gross JJ 2015, "Emotion regulation: current status and future prospects", Psychol Inq 26:1 | how people damp or hide emotion | §6.13 |
| 45 | Fiske ST, Cuddy AJC, Glick P 2007, "Universal dimensions of social cognition: warmth and competence", Trends Cogn Sci 11:77 | first impressions | §6.9 |
| 46 | Todorov A et al. 2008, "Understanding evaluation of faces on social dimensions", Trends Cogn Sci 12:455 | judging faces | §6.9 |
| 47 | Schmitt DP et al. 2007, "The geographic distribution of Big Five personality traits", J Cross-Cult Psychol 38:173 | personality by country, 56 nations | NewCharacter |
| 48 | Soto CJ 2019, "How replicable are links between personality traits and consequential life outcomes?", Psychol Sci 30:711 | what personality predicts | NewCharacter |
| 49 | Schwartz SH et al. 2012, "Refining the theory of basic individual values", J Pers Soc Psychol 103:663 | 19 values | Choose |
| 50 | Haerpfer C et al. 2022, World Values Survey Wave 7 (data) | beliefs and values in 64 countries | Claim, SocialResponse |
| 51 | Kirby KR et al. 2016, "D-PLACE: a global database of cultural, linguistic and environmental diversity", PLoS ONE 11:e0158391 | 1,400 societies' customs | world facts |
| 52 | Henrich J et al. 2005, "'Economic man' in cross-cultural perspective: behavioral experiments in 15 small-scale societies", Behav Brain Sci 28:795 | fairness across societies | SocialResponse |
| 53 | Johnson ND, Mislin AA 2011, "Trust games: a meta-analysis", J Econ Psychol 32:865 | trust shown in 162 replications | Trust |
| 54 | Fehr E, Gächter S 2002, "Altruistic punishment in humans", Nature 415:137 | punishing cheaters at a cost | SocialResponse |
| 55 | Cialdini RB, Goldstein NJ 2004, "Social influence: compliance and conformity", Annu Rev Psychol 55:591 | persuasion principles | SocialResponse |
| 56 | Bond R, Smith PB 1996, "Culture and conformity: a meta-analysis of studies using Asch's line judgment task", Psychol Bull 119:111 | conformity by culture | SocialResponse |
| 57 | Burger JM 2009, "Replicating Milgram: would people still obey today?", Am Psychol 64:1 | obedience rate | SocialResponse |
| 58 | Anderson CA, Bushman BJ 2002, "Human aggression", Annu Rev Psychol 53:27 | general aggression model | SocialResponse |
| 59 | Archer J 2004, "Sex differences in aggression in real-world settings: a meta-analytic review", Rev Gen Psychol 8:291 | who becomes violent | SocialResponse |
| 60 | Dunbar RIM 1993, "Coevolution of neocortical size, group size and language in humans", Behav Brain Sci 16:681 | group and network sizes | NewCharacter |

## Day 4: disease, death, population, economy, history

| # | Source | Gives | Engine |
|---|---|---|---|
| 61 | GBD 2019 Diseases and Injuries Collaborators 2020, "Global burden of 369 diseases and injuries in 204 countries and territories, 1990–2019", Lancet 396:1204 | causes of death and illness | Disease, survival |
| 62 | Mossong J et al. 2008, "Social contacts and mixing patterns relevant to the spread of infectious diseases", PLoS Med 5:e74 | who meets whom, by age | §6.15 |
| 63 | Lessler J et al. 2009, "Incubation periods of acute respiratory viral infections: a systematic review", Lancet Infect Dis 9:291 | incubation times | §6.15 |
| 64 | Alfani G, Murphy TE 2017, "Plague and lethal epidemics in the pre-industrial world", J Econ Hist 77:314 | historic epidemic death rates | §6.15 |
| 65 | Riley JC 2005, "Estimates of regional and global life expectancy, 1800–2001", Popul Dev Rev 31:537 | life expectancy everywhere since 1800 | survival |
| 66 | Coale AJ, Demeny P 1983, Regional Model Life Tables and Stable Populations (book) | death by age for any life expectancy | survival before 1750 |
| 67 | Gurven M, Kaplan H 2007, "Longevity among hunter-gatherers: a cross-cultural examination", Popul Dev Rev 33:321 | death by age in forager societies | survival |
| 68 | Wilmoth JR et al. 2021, "Methods protocol for the Human Mortality Database" (report) | how life tables are built | survival |
| 69 | Hajnal J 1965, "European marriage patterns in perspective", in Population in History (chapter) | marriage age and celibacy | NewCharacter |
| 70 | Livi-Bacci M 2017, A Concise History of World Population, 6th ed. (book) | population history in one volume | PlaceProfile |
| 71 | Klein Goldewijk K et al. 2017, "Anthropogenic land use estimates for the Holocene – HYDE 3.2", Earth Syst Sci Data 9:927 | population and land use on a grid, 10,000 BC–2017 | PlaceProfile |
| 72 | Ruggles S et al. 2011, "The North Atlantic Population Project: progress and prospects", Hist Methods 44:1 | full-count census microdata | job 3 |
| 73 | Bolt J, van Zanden JL 2020, "Maddison style estimates of the evolution of the world economy: a new 2020 update", Maddison Project WP-15 (report) | GDP per head, AD 1–2018 | Price |
| 74 | Clark G 2005, "The condition of the working class in England, 1209–2004", J Polit Econ 113:1307 | 800 years of English wages and prices | Price |
| 75 | Comin D, Hobijn B 2010, "An exploration of technology diffusion", Am Econ Rev 100:2031 | how fast 166 countries adopted 15 technologies | §6.12 |
| 76 | Floud R, Fogel RW, Harris B, Hong SC 2011, The Changing Body (book) | height, health and work since 1700 | BodySize |
| 77 | Eisner M 2003, "Long-term historical trends in violent crime", Crime Justice 30:83 | homicide in Europe since 1300 | PlaceProfile |
| 78 | Turchin P et al. 2015, "Seshat: the Global History Databank", Cliodynamics 6:77 | 400+ past states coded | world facts |
| 79 | Sundberg R, Melander E 2013, "Introducing the UCDP Georeferenced Event Dataset", J Peace Res 50:523 | every violent event 1989– | Battle |
| 80 | de Vries J 1984, European Urbanization 1500–1800 (book) | town sizes in Europe | PlaceProfile |

## Day 5: weather, movement, combat, language, animals

| # | Source | Gives | Engine |
|---|---|---|---|
| 81 | Hersbach H et al. 2020, "The ERA5 global reanalysis", Q J R Meteorol Soc 146:1999 | hourly real weather 1940– | job 2 |
| 82 | Slivinski LC et al. 2019, "Towards a more reliable historical reanalysis: improvements for version 3 of the Twentieth Century Reanalysis system", Q J R Meteorol Soc 145:2876 | weather 1836–2015 | job 2 |
| 83 | Valler V et al. 2024, "ModE-RA: a global monthly paleo-reanalysis of the modern era 1421 to 2008", Sci Data 11:36 | monthly climate 1421–2008 | job 2 |
| 84 | Price RH, Bouffard DL 1974, "Behavioral appropriateness and situational constraint as dimensions of social behavior", J Pers Soc Psychol 30:579 | rated fit of 15 behaviours in 15 situations; how strongly each situation restricts behaviour | Claim (actions) |
| 85 | Tobler W 1993, "Three presentations on geographical analysis and modeling", NCGIA Technical Report 93-1 (report) | walking speed by slope | travel time |
| 86 | Bohannon RW, Andrews AW 2011, "Normal walking speed: a descriptive meta-analysis", Physiotherapy 97:182 | walking speed by age and sex | Chase |
| 87 | Rauthmann JF et al. 2014, "The Situational Eight DIAMONDS: a taxonomy of major dimensions of situation characteristics", J Pers Soc Psychol 107:677 | 8 measured dimensions of any situation | Claim (actions) |
| 88 | Dodds RM et al. 2014, "Grip strength across the life course: normative data from twelve British studies", PLoS ONE 9:e113637 | strength by age and sex | §6.10 |
| 89 | Helbing D, Farkas I, Vicsek T 2000, "Simulating dynamical features of escape panic", Nature 407:487 | crowd movement and crushing | crowds |
| 90 | Dupuy TN 1979, Numbers, Predictions and War (book) | Quantified Judgment Model of battle outcomes | §6.18 |
| 91 | Rowland D 2006, The Stress of Battle: Quantifying Human Performance in Combat (book) | how soldiers actually perform | §6.18 |
| 92 | Clodfelter M 2017, Warfare and Armed Conflicts: A Statistical Encyclopedia of Casualty and Other Figures, 1492–2015 (book) | casualties of every war | §6.18 |
| 93 | Dryer MS, Haspelmath M (eds) 2013, The World Atlas of Language Structures Online (data) | grammar of 2,600 languages | language |
| 94 | Moran S, McCloy D (eds) 2019, PHOIBLE 2.0 (data) | sound inventories of 2,000+ languages | roman.ts |
| 95 | Jäger G 2018, "Global-scale phylogenetic linguistic inference from lexical resources", Sci Data 5:180189 | word lists for 7,000 languages (ASJP) | language distance |
| 96 | Myhrvold NP et al. 2015, "An amniote life-history database to perform comparative analyses with birds, mammals, and reptiles", Ecology 96:3109 | body size, lifespan, litter size of 21,000 species | creatures |
| 97 | Calder WA 1984, Size, Function, and Life History (book) | scaling of every body function with mass | creatures |
| 98 | Watson PE, Watson ID, Batt RD 1980, "Total body water volumes for adult males and females estimated from simple anthropometric measurements", Am J Clin Nutr 33:27 | body water from height, mass, age | §6.3, alcohol |
| 99 | Fleeson W 2001, "Toward a structure- and process-integrated view of personality: traits as density distributions of states", J Pers Soc Psychol 80:1011 | each person's behaviour varies around their trait level; how often a person acts against type | Claim (actions) |
| 100 | Kahneman D, Krueger AB et al. 2004, "A survey method for characterizing daily life experience: the day reconstruction method", Science 306:1776 | how people spend and feel their day | PassTime |
