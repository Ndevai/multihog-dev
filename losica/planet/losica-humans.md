# Humans on Losica — constraints from the planet (v3, Orogen map)

## Inputs

- **Geography:** the Orogen map, seed 060opyi04y13pspiamuykk. I use only its land mask and heightmap, with land elevation = pixel/65535 × 6 km.
- **Physics:** `physics.json` unchanged. Star temperature corrected to 5,895 K (section 2).
- **Excluded:** Orogen's own climate layer.
  - Its climate code takes no star, orbit or pressure input.
  - Axial tilt defaults to 23.5° (`wind.js`, `computeWind(..., axialTilt = 23.5)`).
  - Temperatures come from a fixed Earth curve (`climate-config.js`: `TEMP_PEAK_C` 27.8, `TEMP_POLEWARD_RANGE_C` 48.0).
  - So it shows Earth's climate on this geography.
- **Excluded:** the old v0.9 climate package. It belongs to the old geography, and its problems no longer apply.

## 1. Geography

Planet radius 6,945.9 km. Land: 59.1 M km², 9.7 % of the surface (Earth: 148.9 M km², 29 %).

| Landmass | Area | Latitude | Median elevation |
|---|---|---|---|
| N-central | 11.2 M km² | 27–67°N | 221 m |
| Equatorial | 10.9 M km² | 32°S–6°N | 20 m |
| S-polar | 10.1 M km² | 51–81°S, 174° of longitude | 43 m |
| N-eastern | 8.6 M km² | 38–77°N | 172 m |
| Western-tropical | 7.5 M km² | 29–5°S | 122 m |
| N-western (flat) | 5.5 M km² | 22–52°N | 3 m |
| Islands | ≈ 3.9 M km² | | |

## 2. Star: original brightness kept

**Brightness.** The original 1.371 L☉ stays; the v2 change to 1.269 L☉ is withdrawn.
- **Runaway-greenhouse threshold.** Published 3-D models put the onset between 1.10 and 1.21 × Earth's flux.
  - 1.10: Leconte et al. 2013, at about 375 W/m² global-mean insolation.
  - 1.21: Yang et al. 2014, for fast-rotating planets around a Sun-like star.
  - Losica's 1.134 lies inside that range, so the claim that its oceans boil off is unproven. Losica rotates in 8.55 h, which places it in the fast-rotating case.
- **The dimmer star failed in the climate model** (section 3). At 1.05 × Earth's flux, sea ice covered 34–72 % of the ocean through the year after 4 model years.

**Age.** From the stellar-evolution model SSE (Hurley, Pols & Tout 2000, run through COSMIC 3.4), for a 1.07 M☉ star:

| Metallicity Z | Age at 1.371 L☉ | Teff | Main sequence ends |
|---|---|---|---|
| 0.014 (solar) | 3.96 Gyr | 6,008 K | 8.5 Gyr |
| 0.02 (slightly metal-rich) | 5.30 Gyr | 5,895 K | 9.4 Gyr |

- I pick Z = 0.02 (5.3 Gyr). Earth needed about 4 Gyr to reach modern oxygen levels, and Losica's 25 % O₂ needs comparable time.
- That puts the Teff at 5,895 K. `physics.json` lists 6,079 K, which matches no main-sequence age of this star in SSE.

## 3. Climate

### What the models agree on (every model run)

Runs: the 1-D energy-balance model, the 2-D energy-balance model, the old v0.9 package and the GCM.

- **Northern summer falls near periapsis.** At 1.371 L☉ the daily-mean insolation peaks at 2,350 W/m² at 50°N and 2,660 W/m² at 60°N. Earth's highest is 524 W/m².
- **Northern land overheats.**
  - In the GCM, monthly-mean northern land surfaces reach 150–157 °C, with peaks of about 178 °C.
  - Water boils at 73–80 °C at the local pressure there.
  - This happened in 3 of the first 4 model years.
- **Northern winter falls at apoapsis** and is long: 329 rotations of polar night at 50°N.
- **The north is uninhabitable for humans** without technology.
- **The south has the mild summer** (near apoapsis) and the short dark season.

### What is still unresolved

**The southern temperature level.** It depends on brightness and on the model:
- 2-D energy-balance model, S-polar MAT: 7.5 °C at 1.269 L☉ and about 19 °C at 1.371 L☉.
- GCM: no equilibrium yet.

**The GCM.** ExoPlaSim 3.4 (Paradise et al. 2022), T21 resolution, 10 layers, 50 m mixed-layer ocean.
- Inputs: Losica's orbit, gravity, radius, pressure, gas mix, and this map with topography.
- Checked: the model's annual mean insolation was 357.1 W/m², the intended value.
- Crash: after 4 years it fails every time, just after periapsis (true anomaly 47–56°).
  - It failed at timesteps of 45, 30, 20 and 10 minutes, so the timestep is not the cause.
  - A debug build traced the crash to the surface-flux code: the surface state turns invalid while northern land is above 150 °C.
  - The ExoPlaSim authors state that the model is not validated for very hot climates.
- **So this planet, with this orbit and map, lies outside what this GCM can integrate.** The four completed years were still warming: global mean −36 → −17 → −8.5 → −8.1 °C.

## 4. Where humans can live

- **Homeland: the S-polar continent.** 10.1 M km² at 51–81°S, spanning 174° of longitude. It does not ring the pole.
- **Other land:**
  - The equatorial and western-tropical landmasses passed the livability test in the cold GCM years.
  - They failed it in the energy-balance models.
  - Their status depends on the unresolved temperature level.
- **North:** excluded under every model.

## 5. Air (unchanged from v1)

- **Inspired O₂.** The Earth altitude with the same oxygen at each Losica elevation:

  | Losica elevation | Earth equivalent |
  |---|---|
  | 0 m | 4,208 m |
  | 43 m (S-polar median) | 4,256 m |
  | 500 m | 4,756 m |
  | 1,000 m | 5,297 m |
  | 2,000 m | 6,359 m |

- **Land above about 1,000 m** is beyond the highest permanent human settlement on Earth (La Rinconada, 5,100–5,300 m).
- **La Rinconada population:**
  - SpO₂ 84 ± 5 %;
  - chronic mountain sickness in 14 %;
  - hemoglobin 22.1–23.9 g/dL.
- **Birth weight** falls by about 100 g per 1,000 m (Jensen & Moore 1997).
- **Genetic adaptation:** Tibetans carry *EPAS1* (Yi et al. 2010).
- **Boiling point:** water boils at 81 °C, so cooking by boiling is slower.

## 6. Gravity (unchanged)

- Gravity is 11.61 m/s², or 1.18 g.
- Falls: impact energy from height h equals a fall from 1.18 h on Earth.
- Throws: range is 0.85 × Earth's at the same release speed.
- Load: body weight is 1.18 × its Earth value.

## 7. Time in the homeland

- **Rotation:** 8.557 h.
- **Body clock:**
  - The human intrinsic period is about 24.1–24.2 h.
  - Humans entrain only near 24 h, and only with timed light of about 450 lux (Wright 2001; Scheer 2007).
  - An ultrashort sleep–wake schedule leaves the circadian variation in place (Lavie & Scherson 1981).
  - **So sleep follows a ~24 h body cycle of about 2.8 rotations that is not locked to light. People drift apart unless they coordinate socially.**
- **Polar light in the homeland:** the whole S-polar continent lies inside the polar circle (45.4°). Light is long and dark is short (rotation counts are independent of star brightness):

  | Latitude | Polar day (continuous light) | Polar night (continuous dark) |
  |---|---|---|
  | 60°S | 580 rotations | 119 rotations |
  | 70°S | 738 rotations | 173 rotations |
  | 80°S | 852 rotations | 232 rotations |

  Over the polar day, the light/dark cycle of the rotation vanishes entirely.
- **Year:** 1,241.4 rotations, equal to 442.6 Earth days. A 70-Earth-year life lasts about 57.8 Losica years.
- **Moon:** synodic period of 17.87 rotations.

## 8. Decisions open to you

- **D1a — Biology: decided 3 Oct 2026.** Losica's humans are anatomically and physiologically modern humans (Homo sapiens). Human measurements (reaction times, strike forces and times, bleeding, healing, fracture tolerances) apply to them as data, not as assumptions. Only Losica's environment (gravity 1.18 g, 50.5 kPa air, 25.4 % O₂, light, sound in thinner air) acts on them differently.
- **Generations at Losica's air pressure: many.** Altitude rules use data from long-resident high-altitude human populations (Andean, Tibetan).
- **D2 — Food base.** 25 % O₂ implies photosynthesizing life. Whether humans can eat it is undefined.
- **D3 — Way of life** at the proto-language stage. For example: mobile foragers, sedentary groups, or herders.

The homeland is no longer open: section 4 fixes it to the S-polar continent.
