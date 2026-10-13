# Superset models: what replaces hand-written rules

A superset model computes, from one set of inputs, the values that several of the engine's per-paper rules compute separately. Each row below names the model, what it covers, what it costs, and the engine sections it replaces. Checked 2026-10-13 against the source code (cloned) or the publisher's page.

## 1. Body: BioGears (chosen), Pulse (acute fallback)

| | BioGears | Pulse 4.4.0 | HumMod |
|---|---|---|---|
| What | whole-body physiology, lumped circuits + feedback control | fork of BioGears (Kitware) | 5,000 variables in XML, from Guyton 1972 |
| License | Apache 2.0 | Apache 2.0 | free download, no stated license |
| Code | C++, SWIG bindings; github.com/BioGearsEngine/core, last commit 2026-01-16 | C++, Python, C#, Java; gitlab.kitware.com/physiology/engine | C++ Windows exe |
| Browser | none found | dockcross `web-wasm` target in xcompile.cmake; `Pulse_C_AS_STATIC` "for iOS/WASM builds" | none |
| Speed | same circuit core as Pulse [ASSUMED] | 0.02 s step; 5–10 × real time (FAQ) → one simulated day = 2.4–4.8 h | 10 min simulated per 2 s |

Patient inputs (Pulse CDM; BioGears same family): sex, age, height, weight, body fat fraction, basal metabolic rate, heart rate baseline/min/max, blood pressures, blood volume, respiration rate, lung volumes. Engine sources: BodySize gives sex, age, height, mass; the rest default from these.

Actions and conditions, from the source tree:
- BioGears actions (48): AcuteRespiratoryDistress, AcuteStress, AirwayObstruction, Apnea, AsthmaAttack, BrainInjury, BreathHold, Bronchoconstriction, BurnWound, CardiacArrest, ChestCompression(+Force, Scale), ChestOcclusiveDressing, ChestTube, ConsciousRespiration, ConsumeNutrients, Ebola, Escharotomy, Exercise, ForcedExhale, ForcedInhale, Hemorrhage, Infection, Intubation, MechanicalVentilation, NasalCannula, NeedleDecompression, Override, PainStimulus, PericardialEffusion, PulmonaryShunt, PupillaryResponse, RadiationAbsorbedDose, Sleep, SubstanceAdministration, SubstanceBolus, SubstanceCompoundInfusion, SubstanceInfusion, SubstanceNasalDose, SubstanceOralDose, TensionPneumothorax, Tourniquet, Urinate, UseInhaler.
- BioGears conditions: ChronicAnemia, ChronicHeartFailure, COPD, ChronicPericardialEffusion, ChronicRenalStenosis, ChronicVentricularSystolicDysfunction, Dehydration (disabled in the current release), DiabetesType1, DiabetesType2, ImpairedAlveolarExchange, LobarPneumonia, Starvation (validated at 72 h against 4 studies: glucose, insulin, ketones, RQ).
- Pulse adds: Hemothorax, PrimaryBlastLungInjury, RespiratoryFatigue, ThermalBurn, Arrhythmia, Dyspnea, Sepsis, ARDS, PulmonaryFibrosis; lacks Sleep, Starvation (disabled), Tourniquet, PainStimulus, Infection, oral/nasal dose, Radiation.
- Environment (both): air temperature, humidity, wind, pressure (altitude), thermal application; sweat and shiver from core temperature; hypothermia, hyperthermia, dehydration events.
- Sleep (BioGears): sleep debt model of Schmidt 2017, validated against Spiegel 1999 (4 h sleep × 3 nights: glucose, insulin).

Choice: BioGears, because a story spans days and BioGears holds Sleep, Starvation, Infection, PainStimulus, Tourniquet and oral doses, which Pulse lacks. Pulse is the fallback for blast lung, hemothorax and a browser (WASM) build.

Time-scale split (speed forces it):
- Minutes to hours (wound, choke, drug, cold water, CO, cardiac arrest): run the model step by step.
- Days (thirst, hunger, sleep debt, starvation): the model's coarse-step conditions (Starvation, Dehydration) or the engine's §6.3 rules until those conditions are enabled.

Replaces: §5 bleeding, arterial bleeding, venom systemic effects, sepsis, peritonitis; §6.1 unconsciousness; §6.3 water, food, sleep; §6.6 altitude; §6.8 carbon monoxide. Keeps: §4 attack and layers (Dwarf Fortress), §6.4 JOS-3 (17-segment thermal model, more detailed than BioGears' core/skin), §6.7 load, §6.10 grip.

Gaps no body model covers: subjective signals (thirst, hunger, pain words). Map model outputs to them: thirst from plasma osmolality rise, hunger from time since ConsumeNutrients and blood glucose, sleepiness from sleep debt. Thresholds: OPEN.

Deployment: a local sidecar (BioGears C++ or Pulse Python) that the extension calls per story step with BodySize inputs; or Pulse compiled to WASM inside the extension.

## 2. People: census microdata

Drawing one real person keeps every correlation between traits; independent marginal draws lose them.

- NAPP (via IPUMS International), complete counts: Canada 1881; Denmark 1787, 1801; Great Britain 1851, 1861; Scotland 1871–1911; Norway 1801, 1865, 1900, 1910; Sweden 1880, 1890, 1900, 1910; United States 1850, 1880; Iceland 1703, 1729, 1801, 1901, 1910. Samples: Canada 1852–1911, Britain 1851, Mecklenburg-Schwerin 1819, Norway 1875, United States 1850–1910. Free.
- IPUMS International: census samples, 100+ countries, about 1960 onward.
- IPUMS Mosaic: 35 harmonized files, about 496,000 persons, 14 countries 1430–1918 (Germany 1846, France 1846, Hungary 1869, Albania 1918, Wallachia 1838, Istanbul 1885/1907, Legnago 1430). Free with registration; 30 variables.

Replaces: NewCharacter's 1881 England sex, age, occupation and birthplace draws; reading, faith and marital base shares where a file covers the place and year. Rule: filter rows to what the story fixes, draw one row. population.ts shares become the fallback.

## 3. Weather: reanalysis (real days)

A reanalysis is the observed weather of a real day, reconstructed on a grid. It replaces a generator (WGEN) wherever its span reaches.

| Source | Span | Grid | Step | Access |
|---|---|---|---|---|
| ERA5 via Open-Meteo archive | 1940– | 0.25° (ERA5-Land 0.1° from 1950) | hourly | free non-commercial, no key; 600/min, 5,000/h, 10,000/day; CC BY 4.0 |
| NOAA-CIRES-DOE 20CRv3 | 1836–2015 | 1° | 3-hourly | NOAA PSL, ERDDAP |
| ModE-RA | 1421–2008 | global (Valler et al. 2024, Sci Data) | monthly | NOAA paleo, Bern |

Rule: story date ≥ 1940 → Open-Meteo hourly for the scene's coordinates (temperature, humidity, wind, precipitation, snowfall, cloud, radiation, all inputs JOS-3 and BioGears need). 1836–1939 → 20CRv3. 1421–1835 → ModE-RA monthly anomaly added to the WMO normals, days drawn by WGEN. Fictional worlds → WGEN.

Replaces: §6.16 for real places 1940 onward.

## 4. Areas with no superset found

Social judgments, emotions, choices, battles, prices, language: each rests on its own measured studies; no single model computes them together. Prices: the Moatsos & de Zwart 2025 basket series is the widest single series (in use).

## Order of work

1. BioGears sidecar: build, wrap one HTTP call (state in, actions, state out), map BodySize to patient file, swap §5–6 rules listed above.
2. Open-Meteo call in Weather and BodyEnvironment for 1940 onward.
3. Census sampler from NAPP and Mosaic extracts (the user downloads them after registering).

Sources: BioGears source (github.com/BioGearsEngine/core; Baird et al. 2020, JOSS 5:2645); Pulse source and docs (gitlab.kitware.com/physiology/engine; pulse.kitware.com); Hester et al. 2011, Front Physiol 2:12; IPUMS International NAPP page; IPUMS Mosaic data files page; Open-Meteo historical weather API docs and terms; Valler et al. 2024, ModE-RA, Sci Data; NOAA 20CRv3 (Slivinski et al. 2019).
