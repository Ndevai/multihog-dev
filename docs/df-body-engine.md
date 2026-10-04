# DF body engine — specification

Result: bodies and attacks come from Dwarf Fortress. Any DF creature can be a character; its parts, tissue layers, materials, size, strength and natural attacks are read from DF's raw files. An attack's outcome is DF's layer-by-layer penetration test. Blood, healing, infection, falls, checks, time and magic stay as in rule 576.

Labels: **[RAW]** a value or token read from the DF 0.47.04 raws · **[WIKI]** a formula from the DF wiki (reverse-engineered by players) · **[576]** today's rule-576 value · **[ASSUMED]** a choice this spec makes where no source states it · **OPEN-n** a known gap.

## 1. Data

| Item | Value |
|---|---|
| Source | DF 0.47.04 `raw/objects`, via github.com/Qartar/dwarf-fortress (commit e86f86c) |
| Licence | public domain, `rules/df/raw/readme.txt` |
| Files copied | `rules/df/raw/`: bodies, body detail plans, tissue and material templates, creature variations, weapons, metals, all `creature_*.txt` (2.2 MB) |
| Loaded | in the browser on the first rule-tool call; resolved per creature on first use, then cached |
| Code | `src/rules/df/raws.js` (reading), `src/rules/df/combat.js` (attacks), `src/rules/df/index.js` (loading) |

## 2. Reading a creature [RAW token meanings]

1. Token list = the creature's tokens in file order, with:
   - `COPY_TAGS_FROM:X` → X's finished list inserted here;
   - `APPLY_CREATURE_VARIATION:V:args` → V applied now; inline `CV_*` tokens collect and apply at `APPLY_CURRENT_CREATURE_VARIATION`;
   - a variation applies its removes, then its conversions, then inserts its adds at the cursor; `!ARGn` → the n-th argument, `|` → `:` [WIKI];
   - `GO_TO_START` / `GO_TO_END` / `GO_TO_TAG:T` move the cursor to the start / end / just after the first token beginning with T [ASSUMED: "after", from the raws' own use].
2. Caste: tokens before any caste, under `SELECT_CASTE:ALL`, and under the first declared caste [ASSUMED: first caste].
3. Parts: the `BODY` templates in order. A part with `CON` / `CON_CAT` / `CONTYPE` gets one copy per matching parent; a copy's name is "parent name + part name" (e.g. "right hand thumb") [ASSUMED naming]. `NUMBER:n` → n copies named first, second… or by `INDIVIDUAL_NAME`.
4. Layers: `BP_LAYERS` from detail plans (with `ARGn` substitution), innermost first; `TISSUE_LAYER` adds an outer layer of the tissue's `RELATIVE_THICKNESS`; `SELECT_TISSUE_LAYER` / `PLUS_TISSUE_LAYER` + `TL_MAJOR_ARTERIES` / `TL_RELATIVE_THICKNESS` mark layers.
5. Sizes: `BODY_SIZE` (last entry, cm³) × each `CHANGE_BODY_SIZE_PERC`; `GRAVITATE_BODY_SIZE:g` → (size + g) ÷ 2 [ASSUMED meaning].
6. Strength = median (4th value) of `PHYS_ATT_RANGE:STRENGTH`, else 1000 (DF default range) [WIKI].
7. Blood = the creature has a `BLOOD` token.
8. Not resolved (no parts): CHIMERA, CENTAUR, GRIFFON (OPEN-73).

Human result: size 70000 cm³, strength 1000, 129 parts, relative sizes summing to 9414.

## 3. Quantities

| Quantity | Formula | Label |
|---|---|---|
| individual size i_Size (cm³) | body mass kg × 1000 | [WIKI] "size in cm³ ≈ weight in grams" |
| part size (cm³) | i_Size × part relsize ÷ Σ relsize of all parts | [WIKI] |
| part area | part size^(2/3) | [ASSUMED] OPEN-74 |
| part density (kg/m³) | Σ(layer thickness × layer material `SOLID_DENSITY`) ÷ Σ thickness | [ASSUMED] |
| cosmetic tissues (hair, eyebrows) | not tested by attacks | [ASSUMED from `COSMETIC`] |

## 4. Attack

### 4.1 Weapon values

| Attack | size w_size | density w_density | contact area | edged | velocity | weapon material |
|---|---|---|---|---|---|---|
| item weapon (`weapon` + `material`) | weapon `SIZE` [RAW] | metal `SOLID_DENSITY` [RAW] | attack contact [RAW] | `ATTACK:EDGE` [RAW] | attack velocity ÷ 1000 [RAW] | the metal; default iron [ASSUMED] |
| creature attack, `BODYPART` (punch, kick) | size of the first usable matching part | that part's density | `ATTACK_CONTACT_PERC` % × that part's area | `ATTACK_FLAG_EDGE` | `ATTACK_VELOCITY_MODIFIER` ÷ 1000, default 1 | outermost layer's material |
| creature attack, `CHILD_*` (bite, scratch) | size of the parent part (head, hand, foot) [ASSUMED] | parent's density | contact % × the child part's (tooth, finger) area | as above | as above | the named tissue (nail) or the child's outermost layer (tooth) |

"Usable" = the part works (§6). No usable part → "X cannot <attack> now." Nothing recorded.

### 4.2 Momentum [WIKI, Weapon page]

M = Skill × Size × Str × Vel ÷ (10⁶ × (1 + i_Size ÷ (w_density × w_size))) × style × prone × spread

| Term | Value | Label |
|---|---|---|
| Skill | 1 + min(level, 14) ÷ 14; levels Dabbling 0 … Grand Master 14, Legendary 15 | [WIKI] "gradual, up to 2× at Grand Master"; linear [ASSUMED] |
| Size | the attacker species' adult size | [WIKI] |
| Str | the attacker species' median strength | [WIKI] |
| style | normal 1, quick 0.5, heavy 1.5, wild 1.5 | [WIKI] |
| prone | target lying down × 2 | [WIKI] |
| spread | max(0, 1 + 0.237 z), z standard normal | [576] punch force SD ÷ mean (Walilko 2005), applied to every attack [ASSUMED] |

### 4.3 Hit or miss

Unchanged timing model (rule 576 strikes): impact time vs the target's defence time. Strike-time row: weapon → blade; attack from `STANCE` parts → kick; any other → fist [ASSUMED proxies].

### 4.4 Layers [WIKI, Material science]

Layers of the struck part are tested outermost first. A = min(weapon contact area, struck part's area).

| Test | Passes when | Then |
|---|---|---|
| edged | M ≥ (rSY + (A + 1) × rSF) × (10 + 2 Qa) ÷ (S × Qw) | layer **cut**; M × 0.95; next layer |
| edged fails | — | M × min(1, layer `SHEAR_STRAIN_AT_YIELD` ÷ 50000); the attack is blunt from here; blunt test on this layer |
| blunt | M ≥ (2 IF − IY) × (2 + 0.4 Qa) × A, IF and IY = layer `IMPACT_FRACTURE`, `IMPACT_YIELD` ÷ 10⁶ | layer **smashed**; M × 0.95; next layer |
| blunt fails | — | layer undamaged; M × min(1, layer `IMPACT_STRAIN_AT_YIELD` ÷ 50000); next layer |

rSY, rSF = layer ÷ weapon `SHEAR_YIELD`, `SHEAR_FRACTURE`. S = weapon `MAX_EDGE` ÷ 10000 (gives the wiki's 1× metals, 2× obsidian, 10× adamantine, 0.1× bone). Qa = Qw = 1 (ordinary quality; no armour quality on tissue) [WIKI / ASSUMED].

Armour: not applied yet (OPEN-75). Penetration depth (`ATTACK_PENETRATION_PERC`, weapon penetration): not used; layers are tested until M runs out (OPEN-76).

### 4.5 Into the body

- After the struck part's last layer, with M > 0: one `INTERNAL` part attached to it is chosen, weight = relsize [ASSUMED]; its layers are tested the same way.
- A part that `BP_RELATION … AROUND` the chosen one is tested first with chance = the relation's % (skull around brain 100 %, each rib around heart or lung 5 %) [RAW relation; chance meaning ASSUMED].
- Parts that can be aimed at: every part without `INTERNAL` (eyes, throat, mouth and fingers included).
- Severed: an edged attack cuts every layer of a part that is not upper or lower body, and its contact area ≥ the part's area [ASSUMED from the wiki: "severing when the part is thinner than the contact edge"].

## 5. Wounds from layers

One wound per damaged part.

| Damaged layer | Wound | Label |
|---|---|---|
| any cut | type: `bite` for a BITE attack; `puncture` when contact < penetration (stab); else `cut` | [WIKI] "small contact + high penetration = piercing" |
| smashed, not structural | `blunt` | |
| tissue `STRUCTURAL` and not `FUNCTIONAL` (bone, tooth, cartilage, nail) cut or smashed | extra wound `fracture`; open when a layer of the same part is cut | |
| tissue `FUNCTIONAL` (eye, brain, lung, heart, nerve…) cut or smashed | the part loses its function until the wound closes | [ASSUMED] |
| severed | wound `severed`; the part and everything attached below it stop working for good | |

Bleeding (creatures with blood only), from the cut layers of that wound:

| Cut layer | Vessel class | Label |
|---|---|---|
| marked `TL_MAJOR_ARTERIES` (heart, throat skin) | major artery 300–600 mL/min | [RAW] mark, [576] rate |
| tissue with `ARTERIES` (muscle) | 12 % chance: limb artery 70–170 mL/min; else small | [576] |
| any other with `VASCULAR` > 0 | small vessels 1–10 mL/min | [576] |

Healing days and fracture timetables: rule 576 rows, chosen by the part's DF category:

| DF category | Row |
|---|---|
| EYE, EYELID | eyes |
| MOUTH, LIP, TONGUE, TOOTH | mouth |
| HEAD, NOSE, EAR, CHEEK | head |
| BODY_UPPER, BODY_LOWER, BODY | torso |
| ARM_UPPER, ARM_LOWER, ARM, HAND, FINGER | arm (cuts on HAND, FINGER: hand) |
| LEG_UPPER, LEG_LOWER, LEG, LEG_FRONT, LEG_REAR, FOOT*, TOE | leg (cuts on FOOT*, TOE: foot) |
| others (neck, organs, ribs, spine, skull) | none: does not close / no timetable (OPEN-48, OPEN-58) |

Fracture kind: transverse [576 "blunt blow" row, also used for edged; ASSUMED]. Never-joins chance: LEG_LOWER uses the shin row; others 2 % [576].

## 6. What a body can do

A part **works** unless it, or a part above it on its `CON` chain, has a severing, an unjoined fracture, or a lost function [ASSUMED chain rule]. A `NERVOUS` part (spine) that does not work stops every `STANCE` part; one attached to the neck also stops every `GRASP` part [ASSUMED].

| Ability (BodyCheck `uses`) | Parts with flag [RAW] | Score |
|---|---|---|
| grasp | GRASP | working ÷ all |
| stance | STANCE | working ÷ all |
| sight | SIGHT | working ÷ all |
| hearing | HEAR | working ÷ all |
| smell | SMELL | working ÷ all |
| breathing | BREATHE | working ÷ all |

- Force abilities for the check model = grasp, stance [576 model, CV 0.19]. Others between 0 and 1 change nothing yet (OPEN-66). A creature without any part of a flag has no such ability: a task that uses it fails.
- A `THOUGHT` part (brain) that stops working, or is severed with the part above it → death.
- All `BREATHE` parts stopped: suffocation time OPEN-77.
- Defence time divides by the better of grasp and stance (was blocking and movement).

## 7. Tools

| Tool | Change |
|---|---|
| all | `species`: DF creature id or name ("HUMAN", "wolf", "giant wolf"); used when the character first appears; default human |
| BodyStrike | `part` = a part name of the target (free text); `attack` = the attacker's natural attack (punch, kick, bite, scratch…) or the weapon's attack verb (slash, stab, bash…); `weapon` = DF weapon name; `material` = metal; `skill` = DF level name; `style`; `prone`; `attacker_species`. Removed: `means`, untrained/trained/elite |
| BodyWound | `part` = a part name; cut or puncture: vessel class as §5 for a cut through every layer [ASSUMED] |
| BodyCheck | `uses` = grasp, stance, sight, hearing, smell, breathing |
| unknown part / attack / species | the tool returns the valid names; nothing recorded |

## 8. Unchanged

Blood volume 70 mL/kg and loss classes, refill, red cells, infection, treatments, falls, PassTime interruptions, the check formula, magic — rule 576, now applied to any creature with blood [ASSUMED for non-humans].

## 9. Worked examples

Computed by the code in §1 from the raws (median values, spread z = 0).

Attacker at its species' adult size, target a 70 kg human, landed, Dabbling, normal style.

| Attacker, attack | Result |
|---|---|
| HUMAN {"attack":"punch","part":"head"} | punch (right hand) to head: momentum 61. head: skin smashed, fat smashed, muscle smashed; skull: bone smashed. Wounds 1, 2. |
| HUMAN {"attack":"punch","part":"upper body"} | punch (right hand) to upper body: momentum 61. upper body: skin smashed, fat smashed, muscle smashed; middle spine: bone smashed, nerve smashed. Wounds 1, 2, 3. |
| HUMAN {"attack":"kick","part":"right lower leg"} | kick (right foot) to right lower leg: momentum 63.7. right lower leg: skin smashed, fat smashed, muscle smashed, bone smashed; right knee: muscle smashed, bone smashed. Wounds 1, 2, 3, 4. |
| HUMAN {"attack":"bite","part":"right hand"} | bite (head (first upper right incisor)) to right hand: momentum 68. right hand: skin smashed, fat smashed, muscle smashed, bone smashed; right wrist: muscle smashed, bone smashed. Wounds 1, 2, 3, 4. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"right upper arm"} | slash (iron short sword) to right upper arm: momentum 85. right upper arm: skin smashed, fat smashed, muscle smashed, bone smashed; right shoulder: muscle smashed, bone smashed. Wounds 1, 2, 3, 4. |
| HUMAN {"weapon":"short sword","attack":"stab","part":"upper body"} | stab (iron short sword) to upper body: momentum 68. upper body: skin cut, fat cut, muscle cut; middle spine: bone held, nerve held. Wound 1. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"throat"} | slash (iron short sword) to throat: momentum 85. throat: skin cut; throat severed. Wound 1. |
| HUMAN {"weapon":"mace","attack":"bash","part":"head"} | bash (iron mace) to head: momentum 138.5. head: skin smashed, fat smashed, muscle smashed; skull: bone smashed. Wounds 1, 2. |
| WOLF {"attack":"bite","part":"right lower leg"} | bite (head (first tooth)) to right lower leg: momentum 38.7. right lower leg: skin smashed, fat smashed, muscle smashed, bone smashed; right knee: muscle smashed, bone smashed. Wounds 1, 2, 3, 4. |
| GRIZZLY BEAR {"attack":"scratch","part":"upper body"} | scratch (right front foot (first right front toe)) to upper body: momentum 180.6. upper body: skin smashed, fat smashed, muscle smashed; middle spine: bone smashed, nerve smashed. Wounds 1, 2, 3. |

What these show: with the published formulas and the assumed part area, every unarmed blow and every mace blow breaks the first bone it meets (skull, spine, shin), a sword slash does not cut skin on a limb, and teeth (edge 0.1×) never cut. DF in play does not behave this way, so DF has steps the wiki does not publish; the part-area unit (OPEN-74) decides most of it.

## 10. Open items added

| Id | Gap |
|---|---|
| OPEN-73 | CHIMERA, CENTAUR, GRIFFON bodies do not resolve |
| OPEN-74 | part contact area: DF does not publish it; size^(2/3) chosen |
| OPEN-75 | armour layers (coverage, quality, deflection 2·Sw·IYw < A·Da) |
| OPEN-76 | penetration depth vs layer thickness |
| OPEN-77 | suffocation timing; pain (`PAIN_RECEPTORS`) and unconsciousness |
| OPEN-78 | `HEALING_RATE`: non-human healing uses human days |
