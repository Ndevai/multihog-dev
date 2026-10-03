# Weave rules — hard-rule rewrite (draft 1)

Format rules for every entry below:
- Each line is one rule, stated as a quantity, a table row or IF → THEN.
- `[OPEN-n]` marks a value the source text never defines. The narrator treats an OPEN value as unavailable: the effect it governs does not happen until the value is defined.
- `[DERIVED]` marks a rule computed from the source numbers. `[READING]` marks a choice between two readings of contradictory source text.
- Time units are Losica units: **day** = one mean solar day = 30 804 s; **year** = one orbit = 1241.42 days. [CONVERTED] Durations from the source text keep their absolute length in seconds and are restated in Losica days and years.

---

## Entry: the stages of magical attainment

**Caster quantities**
- `C` conduit count (integer). Fused and unfused conduits both count.
- `N` nexus count. 1 nexus = 4000 fused conduits.
- `R_max` reserve capacity in PE. `R_max = C`. [DERIVED: 200 conduits → 5 casts × 40 PE = 200 PE; 4000 conduits → 100 × 40 = 62 × 64 ≈ 37 × 107 ≈ 4000 PE]
- `R` current reserve, 0 ≤ R ≤ R_max.
- `P` purity, 50–100 % (see purification).

**Stage table**

| Stage | Name | C | N | Max complexity | Lifespan |
|---|---|---|---|---|---|
| 1 | Weave Initiate | 40–199 | 0 | 1 | 82.5 years |
| 2 | Weave Practitioner | 200–3999 | 0 | 3 | 165.0 years |
| 3 | Nexus Formation | 4000–7999 | 1 | 6 | 247.6 years |
| 4 | Nexus Consolidation | 8000–51999 | 2–12 | 9 | 495.1 years |
| 5 | Soul Practitioner | 52000+ | 13 | 9 | 660.2–1650.4 years `[OPEN-2: what sets the value in this range]` |

**Energy cost by complexity (PE)**

| Complexity | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| Base cost | see cantrips | 40 | 64 | 107 | 178 | 297 | 495 | 825 | 1375 | 2292 |

- [DERIVED] Each step from 2 upward multiplies cost by 5/3; step 1→2 multiplies by 1.6.
- Actual cost = base cost ÷ P.
- Stage 5: complexity-9 cost ÷ 2, applied before ÷ P.

**Casting**
1. IF complexity ≤ stage max AND R ≥ actual cost → the spell takes effect; R −= actual cost.
2. IF complexity > stage max → the spell fails; R −= actual cost; the attempt gives no training progress.
3. IF R < actual cost → the cast does not start; R is unchanged. [ADDED: the source gives no rule]
4. Spells from Arcane, Abjuration, Conjuration, Movement and Transmutation draw on nexus-refined energy. `[READING-1: these schools require Stage 3+, except the cantrips listed under cantrips]`

**Recovery**
- Cultivation restores 5 % of R_max per 0.117 day (3600 s). 2.34 days restore 100 %.
- Cultivation counts only when `[OPEN-3: the conditions — place, Weave density, interruption]`.

**Breakthroughs**

| From → to | Requirements, in order | Success | On failure |
|---|---|---|---|
| 1 → 2 | 116.9 days casting complexity-1 spells; C reaches 200 | automatic | — |
| 2 → 3 | C ≥ 4000; 934.9 days casting complexity-3 spells at full R; a 0.94-day saturation ritual; one complexity-4 cast using only the new nexus's energy | 40 % per attempt (d100 ≤ 40) | `[OPEN-5: which resources burn, how much]` |
| 3 → 4 | C ≥ 8000; fuse a second nexus | `[OPEN-6]` | `[OPEN-6]` |
| 4 → 5 | 12 nexuses (C ≥ 48000); cast five complexity-7 Conjuration spells at once, each with a different affinity; affinities come from the caster's conduits or from affinity-bound artifacts | 15 % (d100 ≤ 15): the five patterns merge into nexus 13 | Lightning tribulation: every 841.4 days, lasting 8.41 days, stronger each time `[OPEN-7: damage per tribulation]`, until success or death |

- Conduit growth from practice: `[OPEN-4: conduits gained per practice day per stage]`. Without it, C changes only through breakthroughs and beast cores.
- [READING-2] The source says success at 2 → 3 lets the caster "form a second nexus". This draft reads it as: success forms the **first** nexus (entry to Stage 3); the second nexus is the 3 → 4 step.

**Stage 5 abilities**
- The soul can leave the body. While outside: R −= `[OPEN-8]` PE per day; vulnerable to `[OPEN-9]`.
- Lifespan extensions come from divine boons, artifacts and pills: `[OPEN-10: years added per source]`.

---

## Entry: purification and efficiency

- P = 100 %: the caster trained in one tradition only and refines all absorbed energy.
- P floor = 50 %. Actual spell cost = base cost ÷ P (50 % → double cost).
- P falls by `[OPEN-11]` when the caster:
  - learns an incompatible tradition;
  - alters conduits through a pact;
  - absorbs more energy than it refines, or energy less pure than its own body.
- P rises by `[OPEN-12]` per 84.1 consecutive days of purifying meditation with a purification manual and zero casts. Items raise P by `[OPEN-12]`.

---

## Entry: Schools of Magic

Twelve schools. A gesture school's casts are blocked or penalised `[OPEN-13]` while upper-body-restricting armour is worn.

| School | Effect class | Faculty | Gestures |
|---|---|---|---|
| Arcane | offensive force and elemental energy | INT | yes |
| Abjuration | protection against elements and conditions; magic suppression and resistance changes | INT or WIS | no |
| Clerical | divine grants: food, water, endurance, strength, curse removal, resurrection | WIS and CHA | no |
| Celestial | holy summons, turning undead, radiant light | WIS or CHA | no |
| Divination | revealing hidden creatures, objects, traps and terrain | INT, WIS or CHA | no |
| Conjuration | summoning; animating an affinity; conjured armour | INT (stable effects) or CHA (temporary allies) | yes |
| Healing | repairing injuries and conditions `[OPEN-14: depends on the injury system]` | WIS | no |
| Enchantment | changing the state of minds and objects | INT or CHA | no |
| Nature | summoning and shaping living nature; natural protective skins | WIS or CHA | no |
| Movement | space and speed: jump, levitate, haste, slow, teleport | INT or WIS | yes |
| Transmutation | changing matter and form | INT, WIS or CHA | yes |
| Necromancy | undead, necrotic force, energy drain, death | WIS or CHA | no |

- Affinities (7): fire, water, earth, air, wood, gold, metal. `[OPEN-15: what separates gold from metal]`
- Spell names stay out of this entry on purpose: example names get copied into play. Any spell is defined by the spell tuple (see weave forensics).

---

## Entry: cantrips

- Cantrips have complexity 0. Their patterns fit in ordinary books.
- Minor cantrips: 0 PE; unlimited repeats.
- Major cantrips: `[OPEN-16]` PE each. Transmutation major cantrips cost the most: ≤ 20 PE (half of a complexity-1 spell) and need Stage 2+.
- Most major cantrips belong to Nature and Healing.
- [CONFLICT-1] The source calls complexity-1 Healing "the least energy-intensive spell among the schools". The cost table charges the same base cost for every school, so school-specific costs need a rule `[OPEN-17]`, or that line goes.

---

## Entry: weave forensics

**Spell tuple** — every spell = (effect, school, affinity or none, complexity 0–9, lineage). Cost comes from complexity; light signature comes from lineage. School and affinity stay independent of signature.

**Lineage → light signature**

| Lineage | Signature |
|---|---|
| Demonic | black |
| Neutral | gray |
| Lawful | white |
| Beastly | none |

- [CONFLICT-2] A Demonic spell mutated along the Demonic pathway also shows gray. Gray therefore means Neutral lineage OR mutated Demonic; the two are told apart by sound, incantation and casting method.
- Allowed mutation pathways besides Demonic → gray: `[OPEN-18]`.

**Transmission** — a caster holds a technique by one of four routes: inherited; extracted from information stored in the sea of consciousness; mutated; learned from a separate tradition.
- Learning a complex spellbook integrates it into the sea of consciousness. Minimum complexity that counts as complex: `[OPEN-19]`.
- Extraction reproduces the spell with mutation chance `[OPEN-20]`. Mutation changes signature, sound and casting expression; the effect stays the same.

**Known lineage facts**
- Lawful variants of Create Food, Detect Food, Light and Fireball exist among human sects.
- The Beastly tradition has none of these. A Beastly variant of them proves its caster acquired Beastly spell knowledge.

---

## Entry: observable effects of spellcasting

- Every spell shows the light signature of its lineage (black, gray, white or none).
- Spells that make sound: `[OPEN-21]`.
- The signature identifies lineage only; school cannot be read from it.

---

## Entry: magical failure conditions

1. Complexity above stage max → fails; full cost lost (see stages).
2. R below cost → the cast does not start.
3. Countercasting: interfering with a spell during its shaping phase. Who can countercast, its cost and its success chance: `[OPEN-22]`.
4. Dead and wild magic zones: see magical zones.

---

## Entry: magical zones

**Dead magic zone (void rift)**
- Casting with external energy is impossible, unless the caster's knowledge of the law of Weave is ≥ `[OPEN-23]`, or knowledge of another law (gravity, fire, gold…) is ≥ `[OPEN-23]`.
- Casting with stored nexus energy: `[READING-3: allowed — the source only blocks external energy]`.
- A failed attempt costs 0 PE.
- Active duration spells continue for `[OPEN-24]` after entry.

**Wild magic zone**
- The law of Weave competes with another major law (time, space).
- Each cast triggers an extra event with probability `[OPEN-25]`. Events: the spell hits its caster; the spell teleports elsewhere; others `[OPEN-25]`.

---

## Entry: magical items

- A magic item holds a caster's energy pattern, bound permanently.
- Binding ritual: refine the object with one of the 7 affinities, powered by `[OPEN-26]` PE of the creator's own energy, in a secured location. During the ritual the object can be stolen.
- Minimum stage to bind: `[READING-4: Stage 3 — the source says "typically"]`.
- Every item has an activation condition. Unknown or unmet condition → the item does nothing.
- Single-use items (scrolls) are destroyed on use.

---

## Entry: magical beasts

- A beast passively turns absorbed energy (plants, other beasts, ambient Weave) into spiritual energy stored in a core inside its sea of consciousness.
- Grade (1–9) = core density and structural stability `[OPEN-27: thresholds]`. Beasts can be born above grade 1.
- Cores below grade 2–3 are immature and disintegrate when separated from the soul.

| Grade | Human equivalent | Behaviour |
|---|---|---|
| 1–3 | strong mortal – Weave Initiate | instinct; some limited intelligence |
| 4–6 | Nexus Formation | plans attacks; uses barriers, evasion and magic treasures |
| 7–9 | late Nexus Formation – Soul Practitioner | intelligence of advanced mortals; Soul-Practitioner lifespan; can organise group hunts |

- Combat reference points: a flock of grade-2 birds forces several Initiates to retreat; one grade-6 beast fights several Nexus Formation casters alone.
- Grade-1–3 beasts cast no school spells; their abilities come from the core.
- Humans can refine or consume cores: conduits gained = core energy × efficiency(purity, compatibility) `[OPEN-28]`.
- History: allied grade-7–9 beasts destroyed the defended city of Zumzum Er and the culture, language and traditions it held.
