# Body model (any creature)

The engine knows properties and laws only, never a creature's name. A creature = one species record (§9). Rule 576 is the human record's data. Sources: `body-model-sources.md`. `[OPEN-n]` = value not defined; the effect it governs does not happen.

## 1. Terms

| Term | Definition | Unit |
|---|---|---|
| M | body mass | kg |
| part | a piece of the body that supplies functions; may hold a structural element, contractile tissue and a growth point | — |
| function | one of: sight, night_sight, hearing, range_sense, reaction, breathing, ingestion, manipulation, grip, lifting, movement, footing, balance, blocking, swimming, crawling | — |
| share s(p, f) | fraction of function f supplied by part p in an unhurt body; Σ_p s(p, f) = 1 for every f the species has | 0–1 |
| integrity i(p) | 1 = working, 0 = not working | 0 or 1 |
| structural element | a beam inside a part: material, length L, outer diameter D, inner diameter d | m |
| σ_f | failure stress of a structural material in bending | MPa |
| contractile tissue | tissue that produces force; cross-section A_c | m² |
| σ_c | maximum isometric stress of contractile tissue | MPa |
| compartment | a body fluid that carries material between parts: volume V, pressure P, sealing time t_seal, lethal loss fraction λ | mL, kPa, min, 0–1 |
| delivery | transport of oxygen and fuel to the parts that need it | — |
| vital part | a part whose loss of delivery or integrity ends the organism | — |
| t_anox | time a vital part survives without delivery | min |
| module | a part group able to live alone: holds a growth point and at least m_min of mass | — |
| B | metabolic rate | W |
| store | energy the body can spend without eating | J |
| T | body temperature | K |

## 2. Functions

- F(f) = Σ_p s(p, f) × i(p).
- i(p) = 0 IF the part is severed or destroyed, OR its structural element is broken and not yet joined; ELSE 1. Partial effects of other wounds: `[OPEN-51]`.
- A task that needs a function with F = 0 fails. Checks use F as the body score s (rule 576 Checks).

## 3. Force

- Force of one contractile tissue = σ_c × A_c.
- Same body plan, different size: force × (M ÷ M_ref)^(2/3) (geometric similarity).
- Validity range for any animal: force of a major muscle group between 10 M^(−1/3) and 50 M^(−1/3) body weights (M in kg). A species value outside it needs a source or a lore decision.
- Measured forces in a species record replace the computed ones.

## 4. Structure

- Bending moment that breaks a structural element: M_f = σ_f × I ÷ c, with I = π (D⁴ − d⁴) ÷ 64 and c = D ÷ 2.
- Measured failure moments in a species record replace M_f.
- Load cases:

| Case | Moment on the element | Rule |
|---|---|---|
| part held at both ends (pinned against ground or wall, crushed), force F at mid-length | F × L ÷ 4 | breaks IF moment ≥ M_f |
| free part struck | load reaching the bone through soft tissue and limb motion | `[OPEN-60]` |
| fall | impact force on each part | `[OPEN-71]`; rule 576 fall table stands for humans |

## 5. Compartments (fluids)

- Volume V = volume per kg × M.
- An opening into a compartment with P > 0 loses fluid at the species' measured rate for that opening class; with no measured class, at Q = A_open × √(2P ÷ ρ) (Bernoulli), ρ = 1.05 g/mL.
- An opening into a compartment with P < 0 (under tension) loses no fluid; it takes the opened conduit out of transport.
- Loss stops at t_seal after opening IF the species seals that opening class by itself; ELSE when treated.
- Refill: species rate per compartment.
- IF fluid lost ≥ λ × V → delivery stops (§6).
- Species may add a staged table of effects by fraction lost (human: rule 576 blood-loss classes).
- Transport conductance (plants): IF conductance lost ≥ the species' lethal fraction → the organism dies.

## 6. Delivery and death

- A species with no compartment gets delivery by diffusion only: valid IF its thickest radius r ≤ √(6 K P₀ ÷ A), with K = tissue diffusion constant, P₀ = outside oxygen partial pressure (atm), A = oxygen use per tissue volume (cm³ O₂ cm⁻³ min⁻¹). Losica sea level: P₀ = 12.85 kPa = 0.127 atm (planet/physics.json).
- Delivery to a vital part stops IF: its compartment lost ≥ λ × V, OR the part that drives the compartment has i = 0, OR breathing F = 0, OR no module remains.
- IF delivery to a vital part has been stopped for t_anox → the organism dies. Delivery restored before t_anox → it lives.
- A species may replace this with measured timings (human: rule 576, class IV death in 30–60 min while bleeding, 2 h after bleeding stops).
- Modular species: each module lives while it holds a growth point, has mass ≥ m_min and has delivery or diffusion. A severed module that qualifies becomes a separate individual. The organism ends when no module lives.
- Dies IF store-based starvation limit reached (§7).

## 7. Energy

- B = b₀ × M^β × e^((E ÷ k)(1 ÷ T_ref − 1 ÷ T)); E = 0.62 eV, k = 8.617 × 10⁻⁵ eV/K.

| Group | b₀ (W) | β | T_ref |
|---|---|---|---|
| homeotherm (constant body temperature) | 3.4 | 0.75 | own body temperature (term = 1) |
| poikilotherm (body at ambient temperature) | 0.14 | 0.75 | 293 K |
| plant | species record | species record (≈ 1 within a species) | species record |

- Store = fat mass × 37 kJ/g + usable lean mass × 7 kJ/g. Not eating: store −= B × time.
- Starvation death: mammals and birds at 30–50 % protein lost; humans at −40 % body mass (rule 577); other groups `[OPEN-68]`.
- Bodies powered by something other than metabolism (fiction): energy source, rate and what ends it are lore decisions (`[OPEN-72]`); §6 applies only if the source needs delivery.

## 8. Control and senses

- Reaction time = sense latency + decision + synapses × 0.0007 s + nerve path ÷ v + muscle activation (rule 576 for the human values).
- v: myelinated fibres v = 5.7 × D_fibre (m/s, D in µm); unmyelinated v ∝ √D, scaled from the species' measured fibre. Measured v in a record replaces the formula.
- A species without a nervous system has no reaction: it cannot avoid a strike (rule 576 Strikes, defence time = ∞).
- Detection thresholds belong to the sense organ (species record), not to body size.

## 9. Species record

```
species: {
  name, group: homeotherm | poikilotherm | plant | fungus | lore,
  mass_kg: default adult mass,
  parts: [{ id, shares: {function: s}, vital: bool, growth_point: bool,
            element: { material, L_m, D_m, d_m, M_f_Nm (measured, optional) } | null,
            contractile: { A_c_m2, sigma_c_MPa } | null,
            compartment: id | null }],
  materials: { id: sigma_f_MPa },
  forces: { means: { level: N } },                 // measured, optional
  compartments: [{ id, label, mL_per_kg, P_kPa, rho_g_per_mL, lethal_fraction,
                   seal: { class: minutes }, refill_per_day, open_classes: { class: [min, max] mL/min },
                   stages: [{ from_fraction, effect }] }],
  energy: { b0_W, beta, T_ref_K, T_body_K, fat_fraction, starvation_limit },
  t_anox_min, m_min_g,
  nerves: { myelinated: bool, D_um, v_mps }, senses: { organ: threshold },
  repair: { wound_type: [min_days, max_days] },
  diffusion: { K, A }                              // only for species with no compartment
}
```

- Labels (blood, sap, hemolymph, arm, leaf) are display text; laws read only the numbers.
- A record with a missing value: the effect governed by it does not happen, as with OPEN values.

## 10. Records

**Human** (rule 576 and 577 tables are its data, plus):
- Materials: cortical bone σ_f = 200 MPa.
- Measured failure moments: femur 395 N·m (50th-percentile male, 50 % risk), humerus 230 N·m, tibia 312 N·m, radius/ulna 89 N·m. Formula check, femur (D 26.5 mm, d 13.8 mm): M_f = 338 N·m.
- σ_c = 0.3 MPa. Blood: 70 mL/kg (men), 65 mL/kg (women), mean pressure 12 kPa, λ = 50 ÷ 70. Brain t_anox = 3–5 min.
- Myelinated nerves; senses as rule 576.

**Insect** (measured values; a species record fills the rest):
- Cuticle σ_f = 72 MPa. Muscle σ_c = 0.04 (flight) to 0.7 (jumping) MPa.
- Hemolymph 15 % of body mass, 1.2–2.0 kPa, seals in ~4 min (Manduca). λ: `[OPEN-67]` (one small study: deaths at 40 % removed).
- t_anox: locust < 4 h at 30 °C; Drosophila most survive 3 h, most die by 6 h.
- Giant fibres unmyelinated, 9–12 m/s (cockroach); escape latency 11–38 ms.
- Repair: larval puncture plugged in 1 h, closed in 24 h; lost legs regrow only across moults.

**Tree** (angiosperm / conifer):
- Wood σ_f = 53 MPa green (Douglas-fir).
- Xylem under tension (> 1 MPa): openings lose no fluid; death at 88 % (angiosperm) / 95 % (conifer) conductance lost.
- Phloem 0.6–1.1 MPa, sealed within seconds to minutes.
- No nervous system. Growth points = buds and meristems; wound periderm in 9 days (poplar).
- Root-tip t_anox 8–9 h (maize).

**Fungus**:
- Hyphal network, no compartment pressure or nerves.
- Every hyphal fragment with a growing tip is a module. Colony edge grows 0.13–0.38 mm/h.
- m_min `[OPEN-69]`.

**Fiction** (orc, gnoll, troll, ghoul, slime and others): each needs a record. A value matching a real body (e.g. orc materials = human) is copied from that record. A value with no real counterpart (troll repair rate, ghoul energy source) is a lore decision, entered in the record.
