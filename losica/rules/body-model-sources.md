# Body model — sources and reasons

Each line: rule value → source → what was read. "Abstract" = only the abstract was read. "Summarized" = the quote reached us through a summarizing fetch; check against the PDF.

## §3 Force
- σ_c vertebrate 0.3 MPa → Biewener AA 2005, J Exp Biol 208:1665, doi:10.1242/jeb.01520: "0.3 MPa isometric stress × the muscle's fiber area" (full text, https://www.sccs.swarthmore.edu/users/08/bblonder/phys120/docs/biewener.pdf).
- σ_c independent of body size; vertebrate 200–300 kPa, arthropod 300–700 kPa, molluscs up to 1400 kPa; insect muscles 40 kPa (Drosophila hydei flight) to 700 kPa (locust jumping) → Rospars J-P & Meyer-Vernet N 2016, R Soc Open Sci 3:160313, doi:10.1098/rsos.160313 (full text via Europe PMC PMC4968477).
- Force ∝ M^(2/3) → Marden JH & Allen LR 2002, PNAS 99:4161, doi:10.1073/pnas.022052899 (abstract); Biewener 2005.
- Validity range 10–50 M^(−1/3) body weights → Alexander RM 1985, J Exp Biol 115:231, doi:10.1242/jeb.115.1.231 (abstract). Check: human 70 kg → 1,670–8,330 N; rule 576 punch forces 2,381–4,800 N lie inside.

## §4 Structure
- I = π(D⁴ − d⁴)/64, σ = M c / I → Gere & Timoshenko 1997, Mechanics of Materials (via Wikipedia "Bending", "List of second moments of area").
- Bone σ_f 200 MPa (large mammals; 233 small; no size effect, 0.05–700 kg) → Biewener AA 1982, J Exp Biol 98:289, doi:10.1242/jeb.98.1.289 (abstract).
- Femur D 26.5 mm, L 448 mm (men) → Karakaş & Harma 2008, Diagn Interv Radiol 14:29. Inner d 13.8 mm derived from cortical/total area 0.73 → Miszkiewicz et al. 2026, J Anat 249:865, doi:10.1111/joa.70143 (full text). d = D √(1 − 0.73).
- Femur measured: 395 N·m at 50 % risk, 50th-percentile male → Kennedy EA et al. 2004, Stapp Car Crash J 48:27 (abstract); 458 ± 95 N·m → Funk, Kerrigan & Crandall 2004, AAAM 48:215 (abstract); 447 N·m mid-shaft, tibia 312 N·m → Kerrigan et al. 2004, Int J Crashworthiness 9:607 (abstract).
- Humerus 230 N·m (50th percentile reference value) → Kirkish et al. 1996, SAE 962416 (abstract). Radius/ulna 89 N·m → Begeman et al. 1999, Stapp SAE 99SC24 (abstract).
- Formula vs measurement, femur: 338 vs 395–458 N·m (formula 15–26 % low). Measured values therefore replace the formula where they exist.
- Insect cuticle 72 MPa (fresh locust tibia) → Dirks & Taylor 2012, PLoS ONE 7:e43411 (full text).
- Wood 53 MPa green, 85 MPa at 12 % moisture (coast Douglas-fir, modulus of rupture) → Kretschmann 2010, Wood Handbook ch. 5, FPL-GTR-190 (full text).
- Free-limb blows: no source gives the load reaching the bone → OPEN-60 kept.

## §5 Compartments
- Human blood 70 / 65 mL/kg → University of Iowa protocol "Maximum allowable blood loss" (read). Mean arterial pressure ~90 mmHg = 12 kPa → Wikipedia citing AHA.
- Orifice flow Q = A √(2P/ρ) → Bernoulli's principle (physics); no biological source; used only where a species has no measured opening classes.
- Insect hemolymph 15 % of body mass → Gregory et al. 2022, Front Vet Sci, doi:10.3389/fvets.2022.847043, citing Ramsay 1955 (full text). Pressure 1.22 kPa thorax, 1.98 kPa abdomen → Pendar et al. 2019, Sci Rep, doi:10.1038/s41598-019-42504-3 (full text). Clot ~4 min → Aprelev et al. 2019, Sci Rep, doi:10.1038/s41598-019-40129-0 (full text).
- Insect λ: deaths in the two animals with 6.1 % of body mass removed (~40 % of hemolymph), n small → Gregory et al. 2022. Too weak to set λ → OPEN-67.
- Xylem tension > 1 MPa → Bergman et al. 2021, Proc R Soc B (abstract). Lethal conductance loss 88 % (angiosperms, −3.4 to −6.0 MPa) → Urli et al. 2013, Tree Physiol, doi:10.1093/treephys/tpt030; 95 % (conifers) → Brodribb & Cochard 2009, Plant Physiol, doi:10.1104/pp.108.129783.
- Phloem 1.08 MPa source, 0.59 MPa sink → Knoblauch et al. 2016, eLife, doi:10.7554/eLife.15341 (full text). Sealing seconds (P-protein) to minutes (callose) → Srivastava & Tuteja 2014, Plant Signal Behav, doi:10.4161/psb.29438.

## §6 Delivery and death
- r ≤ √(6 K P₀ / A): Harvey EN 1928, J Gen Physiol 11:469, doi:10.1085/jgp.11.5.469, "Co = Ar²/6D for a sphere"; K = 1.15 × 10⁻⁵ cm² atm⁻¹ min⁻¹ (Krogh 1919, connective tissue) (full text, Europe PMC PMC2141004).
- Losica P₀ 0.124 atm: rule 577 (a Losica sea-level breath = 4,200 m on Earth) × ISA pressure at 4,200 m (101.325 kPa × (1 − 2.25577 × 10⁻⁵ × 4200)^5.25588 = 60.1 kPa, ISO 2533) × 0.2095 O₂.
- Human brain 3–5 min → Onuki 2023, No Shinkei Geka 51:969 (English abstract). Recovery after 30 min in pigs with controlled reperfusion → McKenzie et al. 2026 (PMC13516838): t_anox depends on treatment; the record keeps 3–5 min for untreated cases.
- Locust < 4 h at 30 °C → Ravn et al. 2019, J Exp Biol 222:jeb190850 (abstract). Drosophila 6 h kills most → De Lazzari et al. 2022, Antioxidants, doi:10.3390/antiox11081527 (full text). Maize root tips 8–9 h unacclimated, > 22 h acclimated → Saglio, Drew & Pradet 1988, Plant Physiol 86:61 (abstract).
- Modules: Physarum 1 × 1 cm pieces live and fuse → Nakagaki et al. 2004, Proc R Soc B 271:2305; 2000, Nature 407:470. Planarian fragments down to 1/279 of the body, < 10,000 cells → Ivankovic et al. 2019, Development 146:dev167684. Mycelial fragments grow as separate mycelia → Heitman 2006, Curr Biol 16:R711 (via Wikipedia "Fungus"). Plants regrow from buds plus reserves → Clarke et al. 2013, New Phytol 197:19 (abstract). Minimum fragment sizes for fungi and Physarum: not found → OPEN-69.

## §7 Energy
- Homeotherm 3.4 W × M^0.75 → Kleiber's law, BMR ≈ 70 M^0.75 kcal/day ≈ 3.4 M^0.75 W (Wikipedia citing Smil 2000, Nature 403:597). Hemmingsen's homeotherm standard rate is 4.1 W × M^0.751 (Engelhardt et al. 2014, doi:10.1155/2014/643694); the basal (Kleiber) value is used.
- Poikilotherm 0.14 W × M^0.751 at 20 °C → Hemmingsen 1960 cited in Peters 1983, via Hillaert et al. 2018, Ecol Evol, doi:10.1002/ece3.4524; reference temperature 20 °C via Ilker et al. 2026, arXiv:2603.17950.
- E = 0.62 eV (mean of all groups; range 0.41–0.74) → Gillooly et al. 2001, Science 293:2248, doi:10.1126/science.1061967 (summarized; check the PDF).
- Plants: whole-plant respiration ≈ isometric (exponent ≈ 1) within experiments, no common relation across data → Reich et al. 2006, Nature 439:457, doi:10.1038/nature04282 (abstract). Hence per-species b₀ and β.
- Fat 37 kJ/g → FAO 2003, Food energy, ch. 3. Lean tissue 7 kJ/g → Yeakel, Kempes & Redner 2018, Nat Commun, doi:10.1038/s41467-018-02822-y (full text).
- Mammals and birds die at 30–50 % protein lost → Lignot & Le Maho 2012, in McCue (ed.), Comparative Physiology of Fasting, Starvation, and Food Limitation, p. 9.

## §8 Control and senses
- v = 5.7 D (large myelinated fibres; 4.6 D small) → Boyd & Kalu 1979 via Arbuthnott, Boyd & Kalu 1980, J Physiol 308:125, doi:10.1113/jphysiol.1980.sp013465 (full text). Hursh 1939 not readable.
- Unmyelinated v ∝ √D → Akaishi 2017, Front Physiol 8:798 (abstract). Squid giant axon 500 µm: 25 m/s (Plonsey & Barr 2007), 33 m/s at 23 °C (Bullock & Horridge 1965, BioNumbers 108960). Cockroach giant fibre 9–12 m/s → Bullock & Horridge 1965 (BioNumbers 108972).
- Escape latencies: cockroach 11 ms (wind puffs; Camhi 1978 via Univ. Kentucky notes), 38.1 ms at 1.5 m/s wind (Libersat & Moore 2000, J Insect Behav 13:103); fish C-start 5–10 ms (Eaton, Bombardieri & Meyer 1977, J Exp Biol 66:65); human acoustic startle 56–61 ms EMG (Sinclair et al. 2026, Laryngoscope 136:3514).
- Thresholds by organ: human 0 dB SPL at 1 kHz (young, undamaged; Gelfand 1990 via Wikipedia); silver Y moth 35 dB SPL at 15 kHz (Skals et al. 2003, J Chem Ecol 29:71).

## §10 Repair
- Drosophila larva: plug within 1 h, re-epithelialized within 24 h → Galko & Krasnow 2004, PLoS Biol 2:e239 (full text).
- Cricket legs regrow over several moults → Okumura-Hirono et al. 2025, Development 152:dev204763.
- Axolotl limb: normal size at ~140 days (10 cm animal); twofold larger animal 30–40 % slower → Wells et al. 2021, eLife 10:e68584.
- Poplar wound periderm at 9 days → Rains et al. 2022, Plants 11:1143.
- Fungal colony edge 127–377 µm/h at 25 °C → Trinci 1974, J Gen Microbiol 81:225 (scanned table, check); Neurospora wild type > 1 µm/s → Plamann 2009, PLoS Genet 5:e1000526.
- Cross-taxa law relating repair rate to mass: none found; repair stays per species.
