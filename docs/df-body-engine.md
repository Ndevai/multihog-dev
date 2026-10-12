# DF body engine — specification

Result: bodies and attacks come from Dwarf Fortress. Any DF creature can be a character; its parts, tissue layers, materials, size, strength and natural attacks are read from DF's raw files. An attack's outcome is DF's layer-by-layer penetration test. Blood, healing, infection, falls, checks, time and magic stay as in rule 576.

Labels: **[RAW]** a value or token read from the DF 0.47.04 raws · **[WIKI]** a formula from the DF wiki (reverse-engineered by players) · **[576]** today's rule-576 value · **[DFHACK]** DF's internal structures as documented by DFHack (github.com/DFHack/df-structures) · **[CDDA]** Cataclysm: Dark Days Ahead data and code (github.com/CleverRaven/Cataclysm-DDA, CC BY-SA 3.0; the sub-location weights in `src/rules/df/sublocations.js` are adapted from it under that licence) · **[ASSUMED]** a choice this spec makes where no source states it · **OPEN-n** a known gap.

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
8. CHIMERA, CENTAUR, GRIFFON have no body in DF (`DOES_NOT_EXIST`, legend names only); the tools refuse them.

Human result: size 70000 cm³, strength 1000, 129 parts, relative sizes summing to 9414.

## 3. Quantities

| Quantity | Formula | Label |
|---|---|---|
| individual size i_Size (cm³) | body mass kg × 1000 | [WIKI] "size in cm³ ≈ weight in grams" |
| part size (cm³) | i_Size × part relsize ÷ Σ relsize of all parts | [WIKI] |
| part contact area | (part size ÷ 10)^(2/3) | [DFHACK] `unit_wound_layerst`: "Body parts and non-weapon items have contact=(size/10)^(2/3)" |
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

Rule 576 timing: the defender perceives the attack (sight, hearing, range senses; reaction times as rule 576), then moves. Strike time: weapon → blade row; attack from `STANCE` parts → kick row; any other → fist row [ASSUMED proxies]. A shot flies at 47.23 m/s (a 102 g war arrow from a 144 lbf yew self bow; Stretton et al. 2010, via Wikipedia "English longbow"), impact = distance ÷ speed, for every launcher [ASSUMED].

| Move | Time (70 kg, scaled by mass^0.15, ÷ the driving ability) | Effect | Source |
|---|---|---|---|
| dodge | 0.715 s, ÷ stance | the attack misses | Wakatsuki & Yamada 2020: reactive side-step movement time 715 ± 56 ms |
| block | 0.242 s, ÷ grasp | a held item is put in the blow's way (met in full); without one, the forearm (a `LIMB` part holding a working `GRASP` part) takes the blow | VencesBrito 2011 karate punch (limb movement) |

The defender takes the least harmful move that finishes before impact: dodge, else block with a held item, else block with the forearm [ASSUMED order]. A creature without `STANCE` parts dodges at capacity 1; without `GRASP` parts it cannot block.

Senses:

| Sense | Rule | Source |
|---|---|---|
| sight | light, and a working `SIGHT` part that covers the direction: from the front, any eye while facing the attacker; from the left or right (90°), only an eye with that side's flag (or an unsided eye); from behind, none | human monocular field 60° nasal, 107° temporal (Rönne 1915, via Wikipedia "Visual field"); field of eyes on the sides of the head (horse, rabbit) not modelled [ASSUMED human field] |
| hearing | a working `HEAR` part; with fewer working than the creature has, thresholds rise by 3 dB | binaural summation at detection threshold ≈ 3 dB, the classical finding replicated by Baker et al. 2020 (Sci Rep 10:3560: 4.47 dB) |

DF marks the outer ear as the `HEAR` part (cartilage and skin): a fractured or severed outer ear stops hearing on that side [RAW]; real inner-ear injury is not modelled (OPEN-66).

Hearing by species (src/rules/hearing.js; behavioural audiograms, free field, dB SPL):

- A sound of level L is heard awake when L − shift > 25 dB and wakes a sleeper when L − shift ≥ 55 dB. shift = species lowest threshold − human lowest threshold (−10 dB, Jackson et al. 1999: human 60-dB range 31 Hz–17.6 kHz, best −10 dB at 2 and 4 kHz). Shift on the waking level [ASSUMED].
- A tone (`noise_khz`) outside the species' 60-dB range is not heard at 60 dB SPL or less (definition of the range). Above 60 dB it is treated as audible [ASSUMED].
- Lowest thresholds (dB SPL): red fox −15 (Malkemper et al. 2015), human −10, cat −4 (Heffner & Heffner 1985, Fig. 2, mean of two cats at 8 kHz), dog −0.5 (Heffner 1983, Fig. 3, mean of four dogs at 8 kHz; wolf and dingo as dog), cattle −11 and horse 7 (Heffner & Heffner 1983, Behav Neurosci 97:299, abstract and text), pond turtle about 40 (red-ear turtle; Heffner & Heffner 2007, JAALAS 46:11) [ASSUMED family], whitetail deer −3, alpaca −0.5, fox squirrel 1, Japanese macaque 1 (for the rhesus macaque [ASSUMED genus]), budgerigar 1.1 (DF parakeet [ASSUMED]), chicken 2.6, mallard 12.5, African pygmy hedgehog 21 (DF hedgehog [ASSUMED family]), naked mole rat 35; birds without an audiogram 8.1, the median of 16 terrestrial species (Dooling 1980). Shift 0 for the rest (OPEN-65).
- 60-dB ranges (Hz): dog, wolf, dingo 63–47 000 (Heffner 1983); cat 55–79 000 (Heffner 2004); horse 55–33 500, cattle 23–35 000 (Heffner & Heffner 1983); pig, wild boar 42–40 500, goat 78–37 000 (Heffner & Heffner 1990); sheep 125–42 000 (Kendrick 2008); elephant 17–10 500 (Heffner & Heffner 1980, Asian); chinchilla 50–33 000 (1991); peafowl 29–7065 (2020); guineafowl 24.6–6860 (2024); rabbit 360–42 000, rat 200–76 000, guinea pig 54–50 000, raccoon 100–40 000, opossum 500–64 000, bat 2000–110 000, cockatiel 250–8000, owl 200–12 000 (Fay 1988 compilation via LSU, level not stated); the rest as listed in the file.
- Giant forms and animal people use the base species [ASSUMED]. Creatures not listed hear as humans (OPEN-65).

Results, 70 kg humans, 2000 attacks each: punch to the head blocked 11.7 %; sword slash against a held shield blocked 12.5 %; wolf bite blocked 8.1 %; iron arrow, watched archer: 10 m — no defence; 30 m — forearm blocks 94.8 %; 60 m — dodged 100 %.


### 4.4 Layers [WIKI, Material science]

Layers of the struck part are tested outermost first. A = min(weapon contact area, struck part's contact area) [WIKI; DFHACK: a wound's contact area "is initially the lesser of the weapon or body part contact areas"].

| Test | Passes when | Then |
|---|---|---|
| edged | M ≥ (rSY + (A + 1) × rSF) × (10 + 2 Qa) ÷ (S × Qw) | layer **cut**; M × 0.95; next layer |
| edged fails | — | M × min(1, layer `SHEAR_STRAIN_AT_YIELD` ÷ 50000); the attack is blunt from here; blunt test on this layer |
| blunt | M ≥ (2 IF − IY) × (2 + 0.4 Qa) × A, IF and IY = layer `IMPACT_FRACTURE`, `IMPACT_YIELD` ÷ 10⁶ | layer **smashed**; M × 0.95; next layer |
| blunt, rigid layer (tissue `STRUCTURAL`, not `FUNCTIONAL`: bone, tooth, cartilage, nail) | threshold above × 19.985 | §4.6 fit |
| blunt fails | — | layer undamaged; M × min(1, layer `IMPACT_STRAIN_AT_YIELD` ÷ 50000); next layer |

rSY, rSF = layer ÷ weapon `SHEAR_YIELD`, `SHEAR_FRACTURE`. S = weapon `MAX_EDGE` ÷ 10000 (gives the wiki's 1× metals, 2× obsidian, 10× adamantine, 0.1× bone). Qa = Qw = 1 (ordinary quality; no armour quality on tissue) [WIKI / ASSUMED].

Armour: §4.5. Penetration depth (`ATTACK_PENETRATION_PERC`, weapon penetration): not used; layers are tested until M runs out (OPEN-76).

### 4.4b Shots

Launchers and ammunition from DF (`item_weapon` `RANGED`, `SHOOT_FORCE`, `SHOOT_MAXVEL`; `item_ammo` `SIZE`, attack) [RAW]. Momentum = min(SHOOT_FORCE ÷ 20, ammo mass × SHOOT_MAXVEL ÷ 10), independent of the shooter [WIKI]; ammo mass = density × SIZE ÷ 100000, the unit that reproduces the wiki's figures (iron bolts and arrows at momentum 50, threshold density 1667) [WIKI-derived]. The ammo's attack (contact 5, penetration 1000 for arrows and bolts) and material go through §4.4. Aim is a BodyCheck; a shot on target goes to BodyStrike with `launcher`, ammo `material` and distance.

Aim: a shot at a named part lands on it with P = 1 − e^(−((R + 2.75 mm) ÷ σr)²) (Archery GB 2023 handicap scheme as coded in archeryutils, Atkinson: σr = d × σt, σt = 5 × 10⁻⁴ × 1.035^(h + 6) × e^(0.00365 d) rad; arrow diameter 5.5 mm). Handicap h from DF skill: the Archery GB outdoor longbow classification thresholds (datum 65, class step 6): Dabbling 101 (Archer 3rd class), Novice 95, Adequate 89, Competent 83, Skilled 77, Proficient 71, Talented 65 (Master Bowman), Adept 59, Expert and above 53 (Elite Master Bowman) [ASSUMED one class per level; longbow for every launcher]. R = √(A ÷ π), A = part volume^(2/3) (as §4.5). A miss on the part lands elsewhere with the same law for the whole body (A = sum of outer parts' areas, human 0.33 m²), drawn by the usual hit table; else the shot misses. Scratch (400 shots each, head aimed): Dabbling 10 m head 12 %, body 92 %; 30 m 2 % / 20 %; Competent 10 m 35 % / 100 %, 30 m 5 % / 58 %; Proficient 30 m 11 % / 87 %; Expert 10 m 98 %, 30 m 30 % / 100 %, 70 m 7 % / 63 %. Shooter under fire (`under_fire`): hit chances × 0.6, the ratio of police hit rates in gunfights to those when not fired upon (18 % ÷ 30 %, RAND 2008, NYPD 1998–2006). Otherwise target-range calm: no target motion or wind (OPEN-90; police in real shootings hit 37 % within 6.4 m and 23 % beyond, 18 % in gunfights vs 30 % when not fired upon: RAND 2008, NYPD 1998–2006).

Results at 10 m, no defence: iron arrow (momentum 50) cuts through the torso into the spine; wooden arrow (15) bruises; steel bolt cuts through an iron mail shirt; a steel breastplate stops it; wooden blowdart (5) bruises.

### 4.5 Armour

Worn items come from DF's armour files (`item_armor`, `item_helm`, `item_gloves`, `item_shoes`, `item_pants`) [RAW]; BodyStrike takes them as text, "quality material item" ("steel breastplate", "iron mail shirt", "leather armor").

| Item kind | Covers | Label |
|---|---|---|
| helm | the part with flag `HEAD`; face parts (eyes, mouth, nose, cheeks) stay bare | [WIKI Armor] |
| gloves | `GRASP` parts and their digits; `UPSTEP:n` adds n limb parts up (gauntlets: lower arms) | [WIKI] |
| shoes | `STANCE` parts and their digits; `UPSTEP` as gloves (high boots: lower legs) | [WIKI] |
| body armour | upper and lower body; `UBSTEP:n` adds neck and limb parts up to n steps from the upper body; `LBSTEP:n` adds leg parts up to n steps below the lower body; `MAX` = all | [WIKI] |
| pants | lower body + `LBSTEP` | [WIKI] |

- What is present decides coverage, copied from Cataclysm: Dark Days Ahead (CDDA, CC BY-SA 3.0) [CDDA]:
  - A part is divided into sub-locations with weights (CDDA `sub_body_part` `max_coverage`), keyed by DF category: head forehead 15, crown 25, nape 20; upper arm shoulder 20, upper arm 40; lower arm elbow 5, forearm 35; hand wrist 10, palm 20, back of hand 20; upper leg hip 20, thigh 40; lower leg knee 5, shin 35; foot sole 25, arch 25, ankle 20, heel 20. CDDA sub-locations that DF models as parts (fingers, toes, throat, ears, face, upper and lower torso) are left out. Other parts and other creatures: the whole part.
  - Sides: every region's front and back halves are equal in area (Wallace rule of nines, adult: head 4.5 / 4.5 %, torso 18 / 18 %, each arm 4.5 / 4.5 %, each leg 9 / 9 %; WikEM "Rule of Nines"). A blow lands on the side facing the attacker (`from`: front, back; default back when `facing` is false); from the left or right it lands front or back with chance 50 % each. Sub-locations with a side: forehead and palm front, nape and back of hand back; the others face both ways and can be hit from either side. A portion may name `sides` (a breastplate without a back plate = front).
  - A hit lands on one sub-location of the hit side chosen by weight (CDDA `random_sub_part`); one roll 1–100 per hit decides every worn layer: an item is met when the roll is below its coverage there (CDDA `outfit::absorb_damage`, `armor_absorb`).
  - An item is a list of portions (CDDA armour portions: `covers`, `specifically_covers`, `coverage`, `material`): part, covered sub-locations (none = whole part), coverage % of them (gaps, holes, mesh), and its own material when it differs. A helm open at the back = head forehead + crown 100 %; a barbute adds nape 20 %.
  - Without portions, a DF item uses DF's reach and `COVERAGE` (table above) [RAW]. An item outside DF's lists needs portions; its material is read from its first words ("iron skullcap"), layer ARMOR for metal and OVER otherwise, flexible for cloth, silk and wool [ASSUMED defaults]; `layer` and `flexible` override.
- Armour size for a portion = part size × covered sub-location share × coverage ÷ 100 [WIKI first factor; the step factor applies to DF items only].
- Order on a part, outermost first: COVER, ARMOR, OVER, UNDER [WIKI "Under, Over, Armor, Cover"].
- Each item is met with chance = `COVERAGE` % (cap 50 %, mittens 150 % = always) [WIKI].
- An item is one more layer in §4.4 with its material, Qa = quality (ordinary 1, well-crafted 1.2, finely-crafted 1.4, superior 1.6, exceptional 1.8, masterwork 2, artifact 3) [WIKI], and contact area = (armour size ÷ 10)^(2/3) [DFHACK], armour size = part size × coverage ÷ 100 × (1 + (UPSTEP + UBSTEP + LBSTEP) ÷ 4), MAX counted as 3 [WIKI].
- `STRUCTURAL_ELASTICITY_CHAIN_ALL`, `_CHAIN_METAL` (metal items), `_WOVEN_THREAD` (silk, cloth, wool items): both strains at yield = 50000, so a blow the item stops passes on undiminished as blunt [WIKI "elastic armor, such as a mail shirt"; per-token reach RAW].
- Materials: DF metals by name; leather, silk, cloth (linen, cotton, hemp), wool, wood, bone, shell, chitin by DF material template [RAW].
- Held items (a shield, a buckler, a board, a door, any object held ready) are gear like any other: material, quality, portions. Held = named `held_in` a part, or a DF shield item (held in a working `GRASP` part). An item whose holding part does not work is out of the hit.
  - Without portions, a held item guards the front of the holding limb (hand to shoulder), upper body, lower body and head; its coverage there = min(100 %, face area ÷ Σ the guarded parts' frontal areas), a part's frontal area = (part size cm³)^(2/3) [ASSUMED geometric similarity]. Face area from `size_cm` ([diameter] or [width, height]); DF names supply defaults: shield Ø 85 cm (Viking round shields 80–90 cm, Gokstad 94 cm; Hurstwic), buckler Ø 30 cm (reenactment guidance "10–12 in upwards"; Vikings wiki — weak source). Thickness 0.9 cm default (surviving shields 6–12 mm, Hurstwic). Its layer contact area = ((face × thickness) ÷ 10)^(2/3) [DFHACK non-weapon items].
  - Defence in time (§4.3) with a held item: the item is put in the blow's way and met in full (block); without one, the body moves away (dodge). DF's fixed `BLOCKCHANCE` is replaced by this geometry and timing.
  - Results, iron short sword, 2000 slashes each: 85 cm wooden shield → upper body or head met 100 %, through-cut 28 % / 65 % wounded; 30 cm iron buckler met 55 %; lower leg met only by timed blocks (10.5 %, the same reactions that dodge 11.6 % without a shield).
- Rigid-tissue factor (§4.6) applies to body tissue only.
- Left out: blunt deflection 2·Sw·IYw < A·Da. With the wiki's units every mace bounces off iron armour, against the wiki's own notes that blunt weapons go through iron (User:Shinziril); the talk page reports the formula fails tests (OPEN-75). Shields and blocking: OPEN-80. Armour wear: not tracked.

### 4.5b Into the body

- After the struck part's last layer, with M > 0: one `INTERNAL` part attached to it is chosen, weight = relsize [ASSUMED]; its layers are tested the same way.
- A part that `BP_RELATION … AROUND` the chosen one is tested first with chance = the relation's % (skull around brain 100 %, each rib around heart or lung 5 %) [RAW relation; DFHACK names the number `relation_bp_amount`, "coverage"; using it as a chance ASSUMED].
- A blow not aimed (BodyStrike without `part`) lands on a part drawn by weight [CDDA `anatomy::select_body_part`, `body_parts.json` `hit_size`]: torso 36, head 4, eyes 0.5 (both), mouth 0.5, each arm 13, hand 1.5, leg 13, foot 2; a region DF splits (upper/lower body, upper/lower arm and leg) shares its weight by DF relsize [ASSUMED split]. An attacker of 46.25 L or less that does not fly (CDDA `volume_to_size` small, `can_attack_high`) cannot reach head, eyes or mouth and hits legs and feet × 3. Bodies without a human torso and arms: weight = DF relsize of the parts that are not `INTERNAL`, `EMBEDDED` or `SMALL` [ASSUMED]. CDDA's accuracy factor (hit roll ^ hit difficulty) is left out. Results, 20000 draws: human hit by a human — torso 36 %, each arm and leg ≈ 13 %, head 3.9 %; by a 40 kg wolf — legs 51 %, no head.
- Parts that can be aimed at: every part without `INTERNAL` (eyes, throat, mouth and fingers included).
- Severed: an edged attack cuts every layer of a part that is not upper or lower body, and its contact area ≥ the part's area [ASSUMED from the wiki: "severing when the part is thinner than the contact edge"].

### 4.6 Blunt damage to bone: fitted factor

DF records bone fractures as compressive damage [DFHACK `wound_damage_flags1`: `broken` = `COMPRESSIVE_BROKEN`]; its test is unpublished. The blunt threshold on rigid layers is multiplied by one factor fitted to fight data.

| Step | Value | Label |
|---|---|---|
| facial fractures | 27 in 301 bare-knuckle bouts (BKFC, June 2018 – March 2022) | J Oral Maxillofac Surg 2022, "Maxillofacial Trauma Patterns in Bare-Knuckle Fighting" |
| bout length | mean 5.189 min over 222 BKFC 2022 bouts ((round − 1) × 2 min + time) | Wikipedia "2022 in Bare Knuckle Fighting Championship" results |
| punches landed per fighter per minute | 17 per 3-min round = 5.667 | CompuBox junior middleweight average (gloved boxing; proxy) |
| every landed punch is a head punch | — | [ASSUMED] |
| head punches landed | 301 × 2 × 5.667 × 5.189 = 17701 | |
| fracture chance per landed head punch | 27 ÷ 17701 = 0.153 % | |
| fighter | 70 kg human (junior middleweight = 69.9 kg), skill Professional | [ASSUMED] skill |
| DF head fracture | a punch to the head breaks the skull; facial bones = skull (DF has no separate facial bones) | [ASSUMED] |
| punch momentum at the skull | 100.2 × 0.95³ = 85.9 (three soft layers smashed) | §4.2 |
| unscaled skull threshold | (2 × 200 − 200) ÷ 1000 × 2.4 × min(15.24 hand, 28.07 skull) = 7.31 | §4.4 |
| factor | 85.9 × (1 + 0.237 × 2.963) ÷ 7.31 = 19.985; 2.963 = z at 0.153 % | spread §4.2 |

Resulting skull-fracture chance per landed punch, 70 kg human: Dabbling 2 × 10⁻¹⁴, Competent 2 × 10⁻⁸, Professional 0.153 %, Grand Master 4.7 %.

### 4.7 Natural cutting attacks: fitted factors

DF's momentum for body-part attacks is unpublished (DFHack `caste_attack` lists `contact_perc`, `penetration_perc`, `velocity_modifier` and no formula). Under §4.2 alone a dog's or wolf's bite cuts no skin: teeth are tiny parts with edge 0.1×. Two factors on natural attacks with `ATTACK_FLAG_EDGE` (bites, scratches, gores) are fitted to dog-bite data; punches and kicks keep §4.2, so §4.6 and §6.1 hold.

| Step | Value | Source |
|---|---|---|
| dog bites treated, adults | 475; puncture 47 %, laceration 36 %, avulsion 4 %, amputation 0.4 % (skin broken 87.4 %); abrasion 8 %; fracture 2 % | Morzycki, Simpson & Williams 2019, Can J Emerg Med, "Dog bites in the emergency department: a descriptive analysis" |
| biter, target | DF DOG (30 kg, strength 1000, Dabbling) biting a 70 kg human's lower arm | [ASSUMED] representative bite (arm/hand = 45.3 % of bites, CDC MMWR 2003) |
| unscaled bite momentum | 29.05; skin edged threshold 47.47 (tooth contact 0.441, edge 0.1) | §4.2, §4.4 |
| momentum factor | 47.47 ÷ (29.05 × (1 + 0.237 × −1.146)) = 2.243; −1.146 = z at 12.6 % | skin broken 87.4 % |
| crushing contact | a natural cutting attack that stops cutting crushes with the parent part's contact area × 0.232 (jaw, paw) | share fitted by simulation (4000 bites): fracture 1.95 % against 2 % [ASSUMED: crush with the parent part] |

Simulated, 4000 bites each: dog → lower arm or hand: skin broken 87.2 %, fracture 1.9 %; wolf → lower leg: skin 96.7 %, fracture 0 %; human → hand: skin 99.6 %, fracture 0 %.

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
| NECK, THROAT | cuts: neck row 5–7 days (suture removal; Trott 2012, as tabled by askmygp.com.au) |
| JOINT | cuts: 14 days (suture removal over a joint, same table) |
| JOINT wrist, ankle, hip, elbow, knee, shoulder; SPINE | own fracture rows [joins, healed] days: wrist [42, 365] (non-union 12.5 %), ankle [42, 120], hip [90, 180], elbow [21, 84], knee [21, 84], shoulder [21, 84] [ASSUMED as elbow], spine [28, 84]. Elbow, knee: immobilized 3 weeks (Wikipedia Olecranon fracture, Patellar fracture), healed at the humerus shaft's "up to 12 weeks" (Wikipedia Humerus fracture) [ASSUMED transfer]. Sources: Wikipedia Distal radius fracture (cast 6 weeks; healing "a year or two"), Ankle fracture (weight off 6 weeks; significant recovery within 4 months), Hip fracture (3–6 months); Merck Manual, Vertebral compression fractures (pain eases at about 4 weeks, resolves at about 12) [ASSUMED pain course = healing] |
| SPLEEN, LIVER, KIDNEY | cut, puncture, bite or blunt: function kept 28–119 days, function lost 42–203 (uniform). Spleen healed on ultrasound: grade 1 mean 7 weeks (4–12), grade 2 9.5 (6–17), grade 3 16 (6–29), 68 children (Radiology 1999, 212:515); kept = grades 1–2, lost = grade 3; liver and kidney and adults as spleen [ASSUMED] |
| LUNG | blunt: 5–7 days ("most contusions resolve in five to seven days", Wikipedia Pulmonary contusion); cut, puncture, bite: 21–35 days ("usually heal within three to five weeks", Wikipedia Pulmonary laceration) |
| others (heart, guts, stomach, pancreas, skull) | none: does not close / no timetable (OPEN-48, OPEN-58; skull: sources give "several weeks to months" only) |

Healing speed: DF `HEALING_RATE` ("lower is faster; omitting the token will result in a tissue that never heals", wiki Tissue definition token) scales the rule-576 days: a soft wound by its slowest damaged tissue ÷ 100, a fracture by its bone tissue ÷ 1000 (the human template values, so human days are unchanged) [RAW, WIKI]. Damage to a `FUNCTIONAL` tissue without `HEALING_RATE` (nerve, brain) loses the part's function for good: a cut spinal cord paralyses for good.

Infection: an infected wound closes 10.5 days later (surgical-site infections add 10–11 hospital days; StatPearls "Postoperative Wound Infections", Berríos-Torres et al. 2017; hospital stay as the proxy for healing [ASSUMED]). Its death risk (2–11 × in treated patients) stays open: the figures are for hospital care.

Clotting and further healing times: small-vessel bleeding stops on its own within 0–8 min (normal bleeding time: Ivy method under 5 min, "some texts extend the normal range to eight minutes"; encyclopedia.com "Bleeding Time"); a bruise (blunt wound without lost function) clears in 13 days (mild contusion, Jackson & Feagin classification via Orthobullets); rib fractures join at 42 days, complete at 84 (Guttentag & Salwen 1999, RadioGraphics: "at least 6 weeks", "complete healing … by 12 weeks"); nose fractures join at 28, complete at 42 (Wikipedia "Nasal fracture": stable 3–5 weeks, fused 4–8 weeks; midpoints). Punctures and bites use the cut rows [ASSUMED]; skull and other face fractures stay without a timetable.

Fracture kind: transverse [576 "blunt blow" row, also used for edged; ASSUMED]. Never-joins chance: LEG_LOWER uses the shin row; others 2 % [576].

### 5.1b Stopping arterial bleeding

| Case | Rule | Source |
|---|---|---|
| limb artery or femoral bleeding, BodyTreat `stop_bleeding` | tourniquet succeeds: untrained 18.35 %, with instructions 44.14 %, formally trained 90 % (`training`); a failure leaves the bleeding, retry allowed | Bordonaro et al. 2025, Advances in Simulation 10:57 (systematic review, 10 randomized/clinical trials, Combat Application Tourniquet on trainers): no training 16.3–20.4 % (three studies), point-of-care aids 21.9–69.8 %, video or web training 50.0 and 74.7 %, formal bleeding-control training 87.7 and 92.2 %; instruction-card value from Goolsby et al. 2015 (44.14 %, 194 volunteers) |
| any other bleeding | stopped | — |

Scratch: 2000 untrained attempts on a thigh artery cut: about 18 % stopped. Limits (OPEN-90): time to apply; improvised tourniquets (the review: lower success); junctional and torso bleeding.

### 5.2 Venom

DF decides which attacks inject venom (`SPECIALATTACK_INJECT_EXTRACT` on the attack). A landed injecting bite whose skin layer is cut or smashed injects [ASSUMED: DF fangs rarely cut by the edge test]. src/rules/venom.js.

| Step | Rule | Source |
|---|---|---|
| venom delivered | log-normal around the species' mean yield; spread σ = ln(max ÷ mean) ÷ 2.326 (the recorded maximum as the 99th percentile); king cobra has only a maximum: rattlesnake σ | Wikipedia species pages citing primary sources: western diamondback 250–350 mg, max 700–800; black mamba 100–120 mg, max 400; king cobra up to 420 mg; bushmaster 200–411 mg |
| dose ratio | R = mg ÷ (mouse IV LD50 × victim kg): rattlesnake 2.72, black mamba 0.32–0.33, king cobra 1.28, bushmaster 1.5 mg/kg (IV: the one route given for every species) | same |
| fatal | R > 2.37 for every species: the threshold at which 15 % of 70 kg people bitten by a western diamondback die (untreated mortality 10–20 %) | fit to that one point (the user's choice); no published human dose–response slope; individual sensitivity not modelled [ASSUMED] |
| neurotoxic course (mamba, cobra) | fatal: breathing stops at 45 min (mamba: collapse within 45 min) or 25 min (cobra: death in as little as 30 min, minus the 5 min not-breathing rule) → dead 5 min later | Wikipedia species pages |
| haemotoxic course (rattlesnake, bushmaster) | fatal: shock (unconscious) at 30 min, dead at 90 min | a fatal bushmaster bite in a child (shock about 30 min, death within 90 min); same times for the rattlesnake [ASSUMED] |
| antivenom | BodyTreat `antivenom` before death stops a fatal course | [ASSUMED] |
| adder | mean 14 mg (10–18, Minton 1974; midpoint [ASSUMED]), max 18, mouse IV LD50 0.55 mg/kg; haemotoxic course as the rattlesnake. Result: no 20–70 kg person reaches the lethal ratio; under about 13 kg some do | Wikipedia Vipera berus (14 known British deaths 1876–2005, the last a 5-year-old) |
| copperhead, Gila monster, platypus | pain and swelling only, never fatal | Wikipedia: Agkistrodon contortrix (88 bitten, all survived, none needed antivenom); Gila monster ("normally not fatal to healthy adult humans"); Platypus (pain "can last as long as months") |
| giant forms, animal people | the base species' venom; yield × DF body size ÷ base body size [ASSUMED isometric]: giant adder × 1340, adder man × 234, giant rattlesnake × 36 → every bite on a 70 kg person is lethal untreated | [RAW] BODY_SIZE |
| symptoms | each biting creature's DF syndrome (`SYNDROME` with `SYN_INJECTED`; `CE_<kind>:SEV:…:START:…:PEAK:…:END:…`) runs from the bite; 1 tick = 1.2 min (1200 ticks a day). Status lists the active effects with DF severity. Adder: pain 12 min–48 h, swelling and blisters 1–30 h, nausea 8–24 h. Rattlesnake and helmet snake: necrosis 1 h–2.5 days | [RAW] syndromes; DF wiki "Time" (1200 ticks per day) |
| paralysis (`CE_PARALYSIS`) | while active, checks that use grasp or stance or any exertion fail; breathing continues [RAW: DF paralysis leaves breathing]. Giant cave spider: 6–24 min | [RAW] |
| unconsciousness (`CE_UNCONSCIOUSNESS`) | unconscious while active ("renders the creature unconscious"). Black mamba and bushmaster: 1–30 h after the bite | [RAW]; DF wiki Syndrome |
| bleeding (`CE_BLEEDING`) | blood lost 5.5 mL/min × SEV ÷ 100 while active (small-vessel midpoint [ASSUMED]): rattlesnake 10 → 33 mL over 60–120 min | DF wiki Syndrome: "causes the targeted body part to start bleeding" |
| dizziness (`CE_DIZZINESS`) | checks on feet fail while active [ASSUMED from "occasional fainting and a general slowdown"]. Rattlesnake, helmet snake: 1–30 h | DF wiki Syndrome |
| other DF effects (pain, nausea, fever, swelling, blisters, necrosis, oozing, bruising) | status only (pain OPEN-77; nausea's dehydration, necrosis's tissue loss: OPEN-86) | |
| helmet snake, giant cave spider | fictional: DF symptoms only, never fatal by dose | |

Scratch runs (70 kg, bitten on the shin, 150 untreated each): rattlesnake 19 dead (12.7 %), king cobra 47 (31 %), black mamba 131 (87 %), bushmaster 141 (94 %); antivenom at 20 min saved all. A 20 kg child: rattlesnake 98.5 %, because one threshold and a narrow yield spread make death depend steeply on body mass.

### 5.3 Bloodstream infection

| Step | Rule | Source |
|---|---|---|
| spread to the blood | each wound that becomes infected: 8.5 % under 65, 25.3 % at 65 and over | Taniguchi et al. 2022, Open Forum Infect Dis 9:ofac317: bacteraemia in 8.5 % of adults under 65 hospitalized with cellulitis, erysipelas or abscess (25.3 % at 65 and over) [hospitalized cases as the rate for infected wounds] |
| untreated | 80 % die, at a time drawn uniformly within 30 days [ASSUMED timing]; heavy exertion fails while it lasts | pre-antibiotic Staphylococcus aureus bacteraemia case fatality about 80 % (Wikipedia, Staphylococcus aureus) |
| antibiotics | BodyTreat `antibiotics`: case fatality 15–50 %, drawn uniformly | same: 15–50 % with antibiotic treatment |

Scratch run (300 people, uncleaned forearm cut, fed, 45 days): 41 infected, 5 with bloodstream infection, 5 dead.

### 5.4 Opened gut (peritonitis)

| Step | Rule | Source |
|---|---|---|
| cause | a cut, puncture or bite wound on a GUTS or STOMACH part | [RAW] part categories |
| untreated | 87 % die, 1–7 days after the wound (uniform) [ASSUMED timing] | penetrating gunshot wounds of the abdomen in the Civil War, before routine laparotomy: 87 % fatal (Manring et al. 2009, Clin Orthop Relat Res 467:2168) |
| exertion | until repaired, heavy exertion fails [ASSUMED from the defining signs, rigid painful abdomen] | |
| laparotomy | BodyTreat `laparotomy` before death: 4.5 % die | abdominal wound mortality in Vietnam 4.5 % (same review) |

Scratch run (300 punctured guts each): untreated 89 % died, after laparotomy 5 %.

### 5.5 Creature tokens that switch off needs and effects

| DF token [RAW] | Effect in the engine |
|---|---|
| `NOBREATHE` (18 creatures, e.g. blood man, cave blob, iron man) | no drowning, no altitude illness or hypoxia, venom paralysis does not stop breathing |
| `NO_DRINK` (97), `NO_EAT` (15) | no thirst or dehydration death; no hunger or starvation death |
| `NO_SLEEP` (64, mostly insects) | no sleep debt (awake-hours impairment stays 0) |
| `NOEXERT` (12) | work never accumulates toward exhaustion |
| `NOSTUN` (23) | blows to the head do not knock out |
| `NOPAIN`, `NO_DIZZINESS`, `NO_FEVERS`, `NONAUSEA`, `PARALYZEIMMUNE` | the matching venom symptom is dropped (pain, dizziness, fever, nausea, paralysis) |

Scratch: iron man submerged 30 min, alive; human submerged, drowned.

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

- Alertness (BodyCheck `uses: alertness`, tasks needing attention, judgment or quick reactions): impairment as a blood-alcohol level = drinking (BodyIntake `alcohol_g`; Widmark: g ÷ (0.68 × body g) × 100, eliminated 0.015 %/h) + the sleep-loss equivalent (§6.3) [ASSUMED additive, male Widmark factor]. The odds of failing are multiplied by exp(40.7 × BAC^1.345), the curve through the NHTSA 2015 case-control adjusted odds ratios (Compton & Berning: 2.07 at 0.05 %, 3.93 at 0.08 %) and 1 at 0; it gives 23.9 at 0.15 % [crash odds as task-failure odds: ASSUMED]. Example: a task at 80 % sober → 49 % after 39 g of alcohol (three beers, 70 kg) or after 22 h awake.
- Force abilities for the check model = grasp, stance [576 model, CV 0.19]. Sight between 0 and 1 (eyes lost) in a check that uses sight and grasp: failure × 4 (capped at 1), the task takes 1.56 × as long (Mroczkowski & Niechwiej-Szwedo 2021, Exp Brain Res 239:1345: monocular precision grasping, 4 × grasp errors, +56 % grasp duration). Other partial abilities change nothing yet (OPEN-66). A creature without any part of a flag has no such ability: a task that uses it fails.
- A `THOUGHT` part (brain) that stops working, or is severed with the part above it → death.
- All `BREATHE` parts stopped: unconscious at once, death after 5 min (§6.1).
- Defence time divides by the better of grasp and stance (was blocking and movement).

### 6.1 Unconsciousness

| Cause | Rule | Label |
|---|---|---|
| knockout | a blow to a part with flag `HEAD` that reaches the head's tissue as blunt (after armour) with momentum ≥ 158.0 | fit below |
| knockout ends | when story time passes (PassTime) | [ASSUMED] OPEN-81 |
| not breathing | every `BREATHE` part stops working (creatures without `NOBREATHE`) → unconscious at once; death after 5 min | Merck Manual Professional, Respiratory Arrest (2026): patients "are either unconscious or will soon lose consciousness"; "death is almost certain if more than five minutes" (Wikipedia, citing Merck) |
| choke | a hold locked on a part with category `NECK` or flag `THROAT` (holder needs grasp > 0): unconscious at a time drawn uniformly from 6.2–10.5 s (mean of the study 9.0 s, 95 % CI 8.3–9.9) | "Time to unconsciousness from sportive chokes in fully resisting highly trained combatants", Int J Perf Anal Sport (2020): 81 chokes to loss of consciousness, means by choke 6.2 s (bulldog) to 10.5 s (von Flue); neck-only and arm-in chokes timed alike; uniform draw and human times for every species [ASSUMED] |
| choke held on | held 5 min → dead (strangulation) | same limit as not breathing [ASSUMED] |
| choke ends | released and story time passes → awake | [ASSUMED] OPEN-81 |
| unconscious | every check fails; no defence against attacks; PassTime stops when someone loses or regains consciousness | |

Knockout fit (same chain as §4.6):

| Step | Value | Source |
|---|---|---|
| knockouts | 97 KO in 222 BKFC 2022 bouts | Wikipedia "2022 in Bare Knuckle Fighting Championship" results |
| head punches landed | 222 × 2 × 5.667 × 5.189 = 13056 | CompuBox proxy, bout length §4.6 |
| knockout chance per landed head punch | 0.743 % | |
| Professional 70 kg punch momentum | 100.17 | §4.2 |
| threshold | 100.17 × (1 + 0.237 × 2.436) = 158.0; 2.436 = z at 0.743 % | |

Resulting knockout chance per landed head punch: Dabbling 10⁻¹¹, Competent 10⁻⁶, Professional 0.743 %, Grand Master 10.6 %; untrained swing of an iron mace 27.6 %. A helm that holds passes on momentum × its strain ÷ 50000 and stops knockouts; one that is smashed passes 95 %.

Pain: DF's wiki states only that pain halves rolls and may knock out "depending on toughness"; CDDA's pain values are game-tuned. No measured mechanism found (OPEN-77 keeps pain).

### 6.2 Communication

Communicate decides what a message carries before the narrator writes a reply or reaction.

| Step | Rule | Label |
|---|---|---|
| speaking species | DF `CAN_SPEAK` ("Can talk") or `INTELLIGENT` (CAN_SPEAK + CAN_LEARN): humans, dwarves, elves, goblins, animal people; wolves, dogs, horses cannot talk | [RAW], [WIKI] |
| speaker | conscious; a `BREATHE` part works (voice needs breath); a `MOUTH` part works, else unintelligible; every `TONGUE` part not working → slurred, short simple words only | [ASSUMED from the parts speech uses] |
| listener | conscious; a `HEAR` part works | |
| meaning | words carry meaning only to a species that can talk; a species that cannot talk gets the sounds and their tone | [RAW] |
| language | when both tracker profiles list `Languages:`, they must share one; else tone and gestures only | |
| gesture | the listener has a working `SIGHT` part and light; a species that cannot talk reads posture and movement as its species does | |

A tongue stops working only when severed (its muscle and skin are neither `STRUCTURAL` nor `FUNCTIONAL`).

Speech over distance, noise and walls (Communicate `distance_m`, `effort`, `noise`, `barrier`; src/rules/acoustics.js): Speech Intelligibility Index, ANSI/ASA S3.5-1997 octave-band procedure (Table 4 constants as packaged in the R package SII 1.3.0: importance, speech spectrum at 1 m for normal/raised/loud/shout = 62.35/68.34/74.85/82.30 dB SPL, internal noise; self-masking E − 24 dB; level distortion; audibility (E − D + 15) ÷ 30). Path: spherical spreading −20 log10(d), air absorption per ISO 9613-2 Table 2 (10 °C, 70 %: 1.0, 1.9, 3.7, 9.7, 32.8, 117 dB/km at 250–8000 Hz), walls by the field mass law TL = 20 log10(m f) − 47 dB with surface masses curtain 1, wooden door 20, plaster wall 25, brick 200, stone 500 kg/m² [ASSUMED masses; real doors leak]. Background presets (overall dB SPL at the listener, Wikipedia "Sound pressure" examples; pink spectrum [ASSUMED]): silent night 10, quiet room 25, conversation nearby 50, street traffic 67.5, television 75, vacuum cleaner 85, jackhammer close by 100. Listener: species threshold shift (§4.3 hearing table), +3 dB with one of two ears working, bands outside the species' 60-dB range dropped. Words understood in sentences: p = 1 ÷ (1 + e^(−0.29 (30 SII − 15 + 2.70))) (SPIN-High fit, 30 normal-hearing listeners; Shen & Kern 2018, Trends Hear 22). Heard at all: speech peaks (band level + 15 dB) above the disturbance in any band. Under 20 % of words: "hears that someone speaks".

Results: normal voice in a quiet room, 3 m 99 % of words, 30 m 84 %, 100 m 21 %; 2 m beside another conversation 81 %; 5 m in street traffic 3 % (shouted 66 %); through a wooden door at 3 m 9 %; shouted through a brick wall 9 %; beside a jackhammer, not heard; shouted at 300 m on a silent night 93 % (free field, no ground or wind effects).

Species audiograms per octave (250–8000 Hz, dB SPL, read from the published figures, about ±3 dB): dog 27.75, 19.9, 14, 8.75, 3.6, −0.5 (mean of four dogs, Heffner 1983 Fig. 3; wolf and dingo as dog); cat 22, 8, 3, 1, 0.5, −4 (Heffner & Heffner 1985 Fig. 2); horse 28.7, 15, 10, 8.7, 18, 8 and cattle 10, 6, −1, −4, −7, −10.5 (Heffner & Heffner 1983 Figs. 2–3). Shift per band = species − human free-field threshold (ISO 389-7: 11.4, 4.4, 2.4, −1.3, −5.4, 12.6 [as recalled]). Footsteps on gravel at 400 m on a silent night: human +3 dB, cattle +5, cat +1, dog −9, horse −6 (dogs and horses are less sensitive than people from 250 Hz to 4 kHz in these audiograms; their advantage lies above 8 kHz).

Other sounds (Listen: `sound` preset or `spl_db` at 1 m, `distance_m`, `noise`, `barrier`): the same path (spreading, air absorption, walls), overall level spread evenly over the six octaves [ASSUMED pink]; heard when in any band the level + 15 dB exceeds the disturbance (background or the listener's internal noise + species shift), as for speech. Presets (dB SPL at 1 m): rifle shot 171, jet engine 150, jackhammer 100 (Wikipedia, Sound pressure), vacuum cleaner 90 (85 at 1.8 m), car passing slowly 87.5 (65–70 at 10 m), quiet conversation 50 (40–60), footsteps on gravel or sand 64 (60–62 dBA at the walker's ear, Larsson et al. 2015, Noise Health 17:227; ear 1.5 m from the feet [ASSUMED]). Results (human): footsteps on gravel at 20 m heard with 28 dB to spare, at 100 m 14 dB; in street traffic at 20 m not heard (15 dB short); quiet conversation behind a wooden door at 10 m not heard; a rifle shot at 10 km on a silent night heard. Limits (OPEN-88): no ground or weather attenuation; impulses (shots) count by peak, not by energy over the ear's ~200 ms integration; species without a band audiogram are a flat shift of the human curve; bands above 8 kHz are not modelled.

Seeing at a distance (Look: `size_m` smallest dimension of the target, `distance_m`, `light`, `visibility_m`; src/rules/vision.js). Light presets (lux, Wikipedia "Lux" examples; ranges at their geometric middle): overcast starlight 0.0001, clear starlight 0.002, quarter moon 0.01, full moon 0.12, civil twilight 3.4, dim street or public lighting 32, living room 50, office 400, overcast day 1000, daylight 15 800, direct sunlight 56 600; scene luminance L = E × 0.2 ÷ π [ASSUMED reflectance 0.2]. Acuity R (cycles/degree) = 17.25 arctan(1.4 log10 L + 0.35) + 25.72 (Ward Larson, Rushmeier & Piatko 1997, fit to Shlaer 1937): daylight 49, twilight 16.6, full moon 4.9, starlight 2.0. Cycles across the target N = R × its angular size (degrees). Johnson criteria (Johnson 1958): 50 % at N = 1 (notice), 4 (recognize the kind), 6.4 (identify); probability P = x^E ÷ (1 + x^E), x = N ÷ N50, E = 2.7 + 0.7 x (target transfer probability function, US Army NVESD). One roll gives the deepest level reached. Beyond the meteorological visibility nothing is seen (contrast under 2 %, Koschmieder) [ASSUMED cut-off]. No working eye → nothing. Results, standing person (0.5 m): daylight 200 m notice 100 %, recognize 90 %, identify 58 %; 1000 m 78 / 4 / 1 %; 2000 m 25 %; full moon 30 m 100 / 64 / 27 %, 100 m 78 / 4 / 1 %; clear starlight 20 m 99 / 24 / 8 %. Species acuity × human (60 cycles/degree): Caves, Brandley & Johnsen 2018 (Trends Ecol Evol 33:358) as reported by Duke University: primates 1, eagle 140/60 = 2.33 (wedge-tailed eagle [ASSUMED for the DF eagle]), dogs and cats ÷ 5.5 ("four to seven times" less; wolves and big cats as their family [ASSUMED]), rats ÷ 50, mice ÷ 100, other birds and fish 0.5 ("most birds see fewer than 30"; the sharpest fish about 30 [ASSUMED ceilings]); unknown species as human; same dependence on light [ASSUMED]. Standing person at 200 m in daylight: human notices 100 %, identifies 58 %; dog notices 71 %, identifies 1 %; eagle identifies 99 %; rat 0. Limits (OPEN-88): no target contrast or camouflage, no motion (dogs detect movement better than acuity suggests), nocturnal species are not better in dim light, no field of view or attention.

Light outdoors comes from the sky, not from the narrator (`src/rules/sky.js`). When Look gets no `light` and the tracker's [TIME] holds a calendar date (dd/mm/yyyy), code computes the Sun's and Moon's altitude at the stored latitude with the low-accuracy formulae of Meeus, Astronomical Algorithms (1991): Sun's longitude and declination (24.2–24.7), obliquity (21.2), equation of time (27.3, Smart), Moon's mean arguments (45.1–45.4), phase angle and illuminated fraction (46.4, 46.1); Moon's longitude from the three largest terms of Table 45.A, latitude and parallax left out [ASSUMED]. Checks against the book's worked examples: Sun's longitude 199.90987° (Example 24.a: 199.90987°), equation of time +3.42775° (27.b: +3.427752°), Moon's D, M, M′ 113.8423°, 97.6435°, 5.1508° (45.a: same), illuminated fraction 0.6801 (46.a: 0.6802). The story clock is local mean solar time [ASSUMED]. Illuminance (Wikipedia, Lux): Sun ≥ 6°, daylight 15 800 lux; 0–6°, sunrise or sunset 400 lux [6° band ASSUMED]; 0 to −6°, civil twilight 3.4 lux; below −6°, moonlight when the Moon is up, 0.12 lux at full and 0.01 lux at quarter, log-interpolated by phase angle [ASSUMED], never below clear starlight 0.002 lux. The narrator passes `light` only for artificial light or an overcast sky.

### 6.3 Water, food, sleep

| Need | Rule | Source |
|---|---|---|
| water | net loss 1.5 L/day at rest, 4 L/day active or in heat (PassTime `active`); drinking (BodyIntake `water_l`) refills | Tipton & Montgomery 2025, Exp Physiol, "The physiology of survival: fluid and food" |
| water effects | lost ≥ 5 % of body mass: headache, irritable, light-headed; ≥ 8 %: weak, dizzy, faint, heavy exertion fails; death at 15–20 % (drawn once per person) | same; mapping 8 % → heavy exertion fails [ASSUMED] |
| food | energy use 1400 kcal/day at rest, 2400 active; eating (BodyIntake `food_kcal`) refills; death when the deficit reaches 40–60 resting days (drawn once per person) | same ("complete starvation … within 40–60 days"); deficit bookkeeping [ASSUMED] |
| sleep | hours awake → performs like blood alcohol 0.05 % at 17 h, 0.10 % at 24 h, a straight line through both (0 at 10 h; beyond 24 h extrapolated); 7 h of sleep (PassTime `sleeping`) resets | NIOSH (from Dawson & Reid 1997); AASM adult minimum 7 h; reset rule [ASSUMED] |
| other creatures | every creature with blood; water and energy × (mass ÷ 70 kg)^0.75; same % thresholds | Kleiber's law; thresholds [ASSUMED] |

Results: no water at rest → 5 % on day 2.3, 8 % on day 3.7, dead day 9.1; active → dead day 3.4 (review: "as little as 3 days in hot climates").

### 6.4 Body temperature (JOS-3)

Characters given conditions with BodyEnvironment are simulated minute by minute by JOS-3 (Takahashi et al. 2021, Energy & Buildings 231:110575): 17 segments, 85 nodes (core, muscle, fat, skin, arteries, veins). The code is ported from pythermalcomfort 4.6.0 (MIT licence; src/rules/thermal/jos3.js) and matches the Python within 0.01 °C over 2 h runs.

| Input | Rule | Source |
|---|---|---|
| body | mass 20–200 kg; height 1.72 m × (mass ÷ 74.43)^(1/3); age 20; male | JOS-3 defaults; geometric similarity [ASSUMED] |
| species | human, dwarf, elf, goblin use the human model; other warm-blooded creatures §6.5; cold-blooded are not simulated | [ASSUMED] OPEN-82 |
| wind | weather wind (10 m) × 0.68 = air speed at the body (1.1 m), log profile, open terrain z0 = 0.01 m | Oke 1987, as in pythermalcomfort scale_wind_speed_log |
| clothing | measured ensembles: local clo for the 17 segments (54 ensembles) | Juyoun et al.; Nomoto et al. (pythermalcomfort) |
| garments | whole-body clo (ASHRAE 55 table) spread over the covered segments: local = clo × body area ÷ covered area; garments add up | ASHRAE 55 via CBE Thermal Comfort Tool; spreading rule [ASSUMED] |
| activity | METs: sleeping 0.95, resting 1.3, active 3.5, or given; × 1.163 W/kg ÷ basal metabolism = JOS-3 activity ratio (≥ 1) | Compendium of Physical Activities (Ainsworth et al. 2011) |
| posture | sleeping lying, resting sitting, active standing | [ASSUMED] |

Added to JOS-3:

- Water: immersed segments exchange heat with water by convection only (radiation 0, evaporation 0): still fresh water 220 W/m²K; moving water 427 W/m²K at 0.5 m/s to 580 at 0.75 m/s, linear between and from still water (Junaid et al. 2024, Heliyon e33022, citing Nadel et al. 1974). Wet-through clothing keeps clo × 0.026 ÷ 0.6 (insulation is trapped air; conductivity of air 0.026, water 0.6 W/mK) [stated process]; an immersion suit keeps its clo.

- Shivering heat is at most 3.9 × basal, because peak shivering is 4.9 × resting metabolism in total (Eyolfson et al. 2001, Eur J Appl Physiol 84:100; 15 subjects, 4.9 ± 0.8). Without the cap the model shivered at 1000 W nude at −20 °C and never cooled.
- Shivering stops below 32 °C core (Swiss stage II: drowsy, not shivering).

| Outcome | Rule | Source |
|---|---|---|
| core temperature | pelvis core node | [ASSUMED rectal ≈ pelvis core] |
| hypothermia I | core 35–32 °C: awake, shivering (status) | Brown et al. 2012, NEJM 367:1930 (Swiss staging) |
| hypothermia II | 32–28 °C: drowsy, not shivering; checks that use attention fail [ASSUMED from the stage's definition, impaired consciousness] | same |
| hypothermia III | 28–24 °C: unconscious | same |
| hypothermia IV | < 24 °C: no vital signs → dead | same; [ASSUMED dead without extracorporeal rewarming] |
| heat stroke course | back under 40 °C core within 30 min of onset: no lasting harm. Longer: dies with chance 26.5 % if exertional (working at onset), 63.2 % classic, 1–3 days after onset (uniform) [ASSUMED timing]; the roll stands after cooling. Scratch run, 100 people working at 8 MET in 45 °C sun: heat stroke at 26 min, 35 died | "100 % survivable when core temperature is cooled below 40 °C within 30 minutes" (Hosokawa et al. 2024 review, PMC11438465); mortality 26.5 % exertional, 63.2 % classic (MedLink, Heat stroke) |
| lethal core | core above 46.5 °C → dead [ASSUMED ceiling] | "The highest recorded body temperature recorded in a patient who survived hyperthermia is 46.5 °C" (Wikipedia, Hyperthermia); Bynum et al. 1978 (Am J Physiol 235:R228): 1 h at 41.6–42.0 °C survived |
| heat stroke | core > 40 °C: attention checks fail (disorientation is part of the definition) [ASSUMED]; below 40 °C no thinking effect: at 38.6 °C rectal, Stroop reaction was 39–44 ms faster (Barry et al. 2022, Appl Physiol Nutr Metab 47:261); 1 h at 39.6 °C air did not lower accuracy (Malcolm et al. 2018, Front Physiol 9:585) | Gaudio & Grissom 2016, J Emerg Med 50:607 |
| cold brain | below 36.7 °C core (animals: the same distance below their set point): mental tasks take 1 ÷ (1 − 0.5 × ΔT ÷ 2.2) as long, accuracy holds; new information kept 1 − 0.7 × ΔT ÷ 2.2; recall intact; ΔT capped at 2.2 (34.5 °C, the lowest measured) [ASSUMED linear, held below]. A check marked `timed` with `alertness` uses the speed as a capacity in the force model (spread 0.19 [ASSUMED]) | Coleshaw et al. 1983, J Appl Physiol 55:27 (core 34–35 °C: −70 % memory registration, −50 % calculation speed, accuracy and recall unchanged) |
| food energy | JOS-3 total metabolic heat each minute (basal, work, shivering, non-shivering) replaces the 1400/2400 kcal/day rows: sitting 96 kcal/h, sleeping 78, walking 246, nude at 0 °C shivering 338 | JOS-3; Compendium METs |
| water | (1.5 L/day − the model's own skin and breath loss at its neutral set point) + skin and breath loss this minute (sweat, diffusion, breath) | JOS-3; §6.3 |
| frostbite, covered or any segment | segment skin below the person's freezing temperature, drawn once from N(−6.3, 0.91) °C | Danielsson 1996, J Appl Physiol 81:2666: risk 5 % at −4.8 °C to 95 % at −7.8 °C skin |
| frostbite, bare face and hands | wind chill index ≤ −28 (JAG/TI 2001 formula, air ≤ 10 °C, wind ≥ 4.8 km/h): time to freeze −28 to −39: 10–30 min; −40 to −47: 5–10; −48 to −54: 2–5; ≤ −55: under 2; each person at a fixed uniform position in the range; the dose resets above −28 [ASSUMED] | Environment and Climate Change Canada categories (Coaching Association of Canada sheet); Wikipedia "Wind chill" formula |
| frostbite parts | head → nose, ears, cheeks; hand → fingers; foot → toes; other segments → their DF part | Wikipedia "Frostbite" (cheeks, ears, nose, fingers, toes) [ASSUMED mapping] |
| cold limbs | ΔT = set point − limb core node (forearms for arms, lower legs for legs; muscle temperature [ASSUMED]). Force abilities (grasp, stance) × (1 − 0.02 ΔT); block and dodge times ÷ (1 − 0.05 ΔT); motor nerve speed 49 − 2.2 ΔT m/s in reaction time | Bergh & Ekblom 1979, Acta Physiol Scand 107:33 (muscle 30–39 °C: isometric force −2 %/°C, power and speed −4 to −6 %/°C); Notermans et al. 1994, Muscle Nerve 17:516 (2.2 m/s per °C); linear beyond 30 °C [ASSUMED] |
| cold fingers, fine work | BodyCheck `fine`: grasp × finger dexterity at the hand skin temperature: (25.12 + 0.902 × min(T − 13.5, 0) + 0.191 × max(T − 13.5, 0)) ÷ 28.27, at most 1: 20 °C 0.93, 14 °C 0.89, 10 °C 0.78, 8 °C 0.71, 5 °C 0.62 (below 7.7 °C extended [ASSUMED]); hand skin node as finger skin [ASSUMED]. Scratch: bare hands, work clothing, −10 °C, 21.6 km/h: hand skin 5.4 °C at 20 min, a fine task 80 % pass warm → 1.7 % | Daanen 2009, Industrial Health 47:262: Purdue pegboard against finger skin temperature (Fig. 4, 18 group means of 12 men, read from the figure; hinge fit, residual SD 0.6); "at finger temperatures of less than 14 °C the performance decreases" |
| frostbite wound | superficial; closes in 7–21 days |
| can swim at all | drawn once per person: 46 % (BodyEnvironment `swimmer` sets it from the story); a non-swimmer in deep water (`deep_water`, default true) goes under unless `afloat`. Scratch: 300 people in 25 °C deep water, 15 min: 54 % drowned | American Red Cross survey 2014: 80 % of US adults say they can swim, 46 % can do all five basic water-safety skills (enter water over the head, surface and float or tread 1 min, turn and find the exit, swim 25 yards, exit) |
| tiring in water | not held afloat: swimming 6.0 MET (Compendium, Ainsworth et al. 2011), treading water 7.5 MET (VO2 23.2–29.4 mL/kg/min over four techniques, 21 skilled treaders, midpoint; van Duijn et al. 2021, Front Physiol 12:719788) count toward the maximum acceptable work time (§6.7); exhausted → the head goes under [ASSUMED] | |
| swim failure (cold) | in water ≤ 14 °C, swimming ends after a time drawn per immersion: N(52, 18) min in a bathing suit, N(39, 19) min clothed (at least 5); above 14 °C only exhaustion (next row) [ASSUMED scope]. Scratch medians, 12 °C: 49 min (suit), 45 min (clothed); 28 °C: 208 min (exhaustion) | Bowes et al. 2016, Eur J Appl Physiol 116:759 (10 unhabituated men, 12 °C: 52 ± 18 min naked, 39 ± 19 clothed, stopped from exhaustion before hypothermia); Ducharme & Lounsbury 2007 (mean 47 min in 10–14 °C) |
| head under water | submerged, or swim failure or unconscious without flotation: breath held N(24.3, 11.4) s (≥ 5 s), then water is breathed in → unconscious, dead after 5 min (not-breathing rule); head out before then → breathing resumes, unconscious ("near-drowning") until time passes | Barwood et al. 2006, Aviat Space Environ Med 77:1136 (maximal breath-hold on immersion in 11 °C water, 32 subjects); the same hold in warmer water [ASSUMED] | partial-thickness burn row [ASSUMED proxy]; depth by duration OPEN-84 |

Burns from heat: Henriques damage integral Ω = Σ A e^(−ΔE/RT) Δt per body segment, A = 3.1 × 10^98 /s, ΔE = 6.27 × 10^5 J/mol (endpoint transepidermal necrosis, pig skin; constants as tabled by Fritz et al. 2021, Mil Med 186 S1:408). T = the water temperature for immersed segments (the constant-temperature hot-water exposures behind the endpoint, Moritz & Henriques 1947), otherwise the JOS-3 skin node [ASSUMED]. Ω ≥ 1 → partial-thickness burn on every DF part of that segment; Ω ≥ 10^4 → full thickness [ASSUMED threshold]. Scratch, right hand in hot water: 44–45 °C no burn within 7 h (the integral gives 23 h at 44 °C); 48 °C partial at 52 min; 50 °C 13 min; 55 °C and 60 °C within the first minute (60 °C full thickness at 111 min); 70 °C full thickness in the first minute. Touching something hot (BodyContact: regions, material, temp_c, seconds): the same integral at the contact temperature of two semi-infinite bodies, Ti = (bS·33 + bM·T) ÷ (bS + bM), b = √(k ρ c) from standard property tables (skin as dermis 0.37 W/m/K, 1100 kg/m³, 3400 J/kg/K [ASSUMED]); liquids (water, oil) at their own temperature (surface keeps renewing) [ASSUMED for oil]. Hand on 100 °C: steel 94.8 °C → full thickness in 1 s; stone 78.2 °C → full in 5 s; wood 47.3 °C → no burn in 10 s. Hot water on a hand: 70 °C 1 s, 60 °C 5 s, 55 °C 30 s → partial thickness; 50 °C 5 min → none (the integral needs 17 min). Burn death: burned share of body surface = JOS-3 segment areas with partial or full burns; revised Baux score = age + that %, mortality = 1 ÷ (1 + e^(−0.058 (score − 135))): score at 50 % = 135, the middle of the 130–140 reported for well-performing burn units (Wikipedia, Baux score; Osler et al. 2010, J Trauma 68:690), slope 0.058 [ASSUMED, recalled]; inhalation injury (+17) not modelled. Re-rolled on the added risk as the area grows; death 1–14 days after [ASSUMED timing]. Scratch (2000 each, 70 °C water 5 s): age 40, one hand (2.7 %) 0.5 % die; chest and back (18 %) 1.1 %; age 70, chest and back 5.8 %; age 25, neck down (94.1 %) 29 %; age 40, neck down 48 %.

Radiant heat on bare skin: the surface temperature solves a steady balance of conduction from the skin node (0.37 W/m/K over 1 mm = 370 W/m²K [ASSUMED depth]), convection hc = 8.3 v^0.6 (at least 3.1; ASHRAE, seated) and radiation 0.98 σ (Tr⁴ − Ts⁴); clothed skin is shielded [ASSUMED]. Scratch, shorts and T-shirt, 30 °C air: radiant 150 °C (1.3 kW/m² net) no burn in 2 h, core reaches 45.2 °C; 200 °C (2.3 kW/m²) partial burns on forearms and ears at 39 min; 300 °C (5.5 kW/m²) partial in the first minute, full thickness at 40 min. Per-minute steady state overstates very short exposures (OPEN-84).

Results (70 kg, scratch runs): nude at 0 °C in 25 km/h wind, resting: stage I at 1.5 h, stage II at 2.9 h, unconscious at 3.7 h, dead at 4.5 h. Nude at −20 °C in 40 km/h wind: lower legs freeze at 10 min, fingers at 15, toes at 21, the face at 29, unconscious at 1.4 h, dead at 1.8 h. Jacket ensemble at −20 °C in 50 km/h wind, walking, bare face and hands: face and fingers frozen at 20 min, core 36.9 °C. Down suit with hood and gloves at −30 °C, walking: core 37.7 °C; bare face frozen at 9 min. Swimming in 12 °C water without a life jacket: arms fail at 41 min, dead (drowning) at 46 min; with a life jacket the swimmer stops and floats. Unclothed, floating in 5 °C water: unconscious at 129 min; with a life jacket dead of hypothermia at 167 min, without one dead of drowning at 134 min. Head under in 10 °C water: unconscious at 1 min, dead at 6 min. Whole body in still water (75 kg, wet jacket clothing): 0 °C: stage I 1.0 h, unconscious 2.5 h, dead 3.2 h; 5 °C: 1.4 h, 3.8 h, 4.6 h; 10 °C: stage I at 2.7 h, alive at 24 h; 15 and 20 °C: no stage in 24 h. Published guidance puts unconsciousness from hypothermia at about 1 h in ice water (Giesbrecht's 1-10-1 rule): the model cools about half as fast there. Deaths in the first minutes (cold shock gasp, swim failure, drowning) are outside it (OPEN-84). Rope climb at 80 % share (grasp): nude at 0 °C in 25 km/h wind: forearms 6.2 °C below set point at 0.5 h → 58 %, 12.1 °C at 2 h → 28 %; jacket at −20 °C in 50 km/h wind: 5.8 °C at 2 h → 60 %. Desert at 45 °C, sun (radiant 60 °C), 20 % RH, walking in T-shirt and shorts: 5.1 L water lost in 6 h (5 % of body mass at 4.2 h), core 38.5 °C. 22 °C indoors, resting, 24 h: 1.4 L.

### 6.5 Body temperature of other warm-blooded creatures

Creatures with DF `HOMEOTHERM` (body temperature in Urist degrees: °C = (°U − 9968 − 32) × 5/9; 10067 → 37.2 °C) other than human body plans use a whole-body heat balance (src/rules/thermal/endotherm.js).

| Step | Rule | Source |
|---|---|---|
| heat loss | NicheMapR ellipsoid endotherm model: core → body → fur → air by convection (free and forced, wind) and radiation; ellipsoid of the creature's mass at density 1000 kg/m³, shape ratio 4.5, fur conductivity 0.04 W/mK | Porter & Kearney 2009, PNAS 106:19666; NicheMapR ellipsoid_endo.R (GPL-3) |
| fur depth | fitted per mass so the still-air (0.1 m/s) conductance equals the allometric minimal wet conductance: birds 0.702 M^−0.519 mL O2 g⁻¹ h⁻¹ °C⁻¹ (M in g), mammals × 1.5; the model's fur resistance peaks with depth, so the thinnest fur that reaches the target (else the fur of least conductance) | Schleucher & Withers 2001, Comp Biochem Physiol A 129:821 (birds; mammals about 50 % higher); 20.1 J per mL O2 |
| above 5 kg | the 5 kg fur | Scholander et al. 1950, Biol Bull 99:225: insulation about the same from a 5 kg fox to a 500 kg moose |
| bird or mammal | bird = has a FEATHER tissue | DF raws |
| basal heat | Kleiber 70 M^0.75 kcal/day (M in kg) | as NicheMapR |
| activity | basal × METs (sleeping 0.95, resting 1.3, active 3.5, or given) | human Compendium values [ASSUMED for all] |
| heat production | rises to cover heat loss, up to 4.9 × basal plus activity | Eyolfson et al. 2001 (human) [ASSUMED for all] |
| core | changes by (production − loss) × 60 s ÷ (mass × 3470 J/kg/K) | specific heat of body tissue [ASSUMED human value] |
| heat | evaporation removes any surplus without limit; water lost = that heat ÷ latent heat + breath water (NicheMapR, O2 extraction 20 %) + the resting 1.5 L/day × (M ÷ 70)^0.75 | NicheMapR ellipsoid; §6.3 |
| stages | the human stages at the same distances from the creature's own set point: −2, −5, −9, −13, +3 °C | [ASSUMED] |
| food | heat production each minute | — |

Fitted fur and lower critical temperature (still air): 20 g mouse 14 mm, 32 °C (allometry 29.9); 0.3 kg rat 42 mm, 22 °C; 4 kg cat 28 mm, 6.5 °C; 40 kg wolf 29 mm, −12 °C (−8 °C in 18 km/h wind); 500 kg horse −35.5 °C; 2 kg chicken 84 mm (feathers), 5.5 °C. Scratch runs: wolf at −30 °C in 40 km/h wind holds its core for 12 h; a rat at −30 °C holds its core and loses 9 % of its mass in water by breathing in 10 h.

Sun and fire: radiation goes to the mean radiant temperature (`radiant_c`); the surroundings act at the operative temperature, air and radiant temperatures weighted by the convective and radiative conductances. Wind: the 10 m weather wind at the creature's height h = 2 × the ellipsoid's short radius (log profile, z0 = 0.01 m, as §6.4) [ASSUMED height]: 0.3 kg rat h = 0.05 m (23 % of the 10 m wind), 40 kg wolf 0.17 m (41 %). Water (`water_c` with any `immersed` region → whole body [ASSUMED]): convection with water's properties (Vogel viscosity; conductivity 0.58 W/m/K; specific heat 4186; expansion 2.1e−4 /K), no radiation, no evaporation; fur fills with water (conductivity 0.58) unless the creature is AQUATIC or AMPHIBIOUS in DF [ASSUMED].

Evaporation limit: breathing water × 5 (panting) plus a fully wet skin by the Lewis relation he = 16.5 K/kPa × hc against the air's vapour pressure (NicheMapR endoR defaults PANT_MAX 5, PCTWET_MAX 100 %; ASHRAE Lewis ratio); vapour passes the fur freely [ASSUMED]. Heat beyond it raises core; the human heat-stroke stage and death roll (§6.4) apply at +3 °C over the set point. Scratch runs, 40 kg wolf, 6 h at rest: 35–50 °C air with radiant = air holds its set point; 45 °C, 60 % humidity, 70 °C radiant: core +0.6 °C. Skin wetting: sweaters reach 100 %, all others stay at endoR's resting 0.5 % and cool by panting. Sweaters: "humans, horses, some primates and some bovidae" (Wikipedia, Perspiration; dogs "accomplish similar temperature regulation results by panting"): horse, donkey, mule [ASSUMED equids], cow, water buffalo, yak [ASSUMED cattle-type bovids], every DF primate [ASSUMED]; giant forms and animal people as their base. Scratch, 4 h at rest: 40 °C air, 40 % humidity: 20 kg dog core +1.2 °C (stage scale), 500 kg horse at set point; same air with 60 °C radiant: dog heat stroke from minute 68, horse at set point; 45 °C, 60 %: dog heat stroke, horse +1.8 °C.

Drowning: creatures without DF `SWIMS_INNATE`, `SWIMS_LEARNED`, `AQUATIC` or `AMPHIBIOUS` go under when immersed unless `afloat`; any creature goes under when unconscious. Breath held as humans (§6.4) [ASSUMED], then the not-breathing rule. Of 548 warm-blooded DF creatures, 13 lack the swim flags (giraffe and its giant and animal-person forms, giant cave spider, among others); all birds and common mammals swim. Scratch: a creature without the flags drowned at 6 min; afloat, alive; dog and chicken swim for the full hour.

Results (scratch runs): 40 kg wolf heat loss, still air 0 °C 43 W; 10 °C water 255 W (basal 54, peak 265); per °C of difference water takes 8.8 W against still air's 1.1 (× 8); 35 °C air in shade +4 W, under a 60 °C radiant load −14 W (heat gained). 0.3 kg rat in 5 °C water: dead of hypothermia at 16 min. 20 kg dog in 2 °C water: core 32.9 °C at 3 h; 40 kg wolf in 0 °C water: 35.3 °C at 3 h.

Limits (OPEN-82): one shape and one fur conductivity for all; wet fur in rain; the allometry is an average over climates (a temperate rat gets arctic-grade fur, LCT 22 °C against about 28–30 measured);  evaporation without limit (no heat stroke in animals).

### 6.6 Altitude

Set with BodyEnvironment `altitude_m` (and `sudden_ascent` for arrival within minutes); src/rules/thermal/altitude.js.

| Quantity | Rule | Source |
|---|---|---|
| air pressure | PB (Torr) = exp(6.63268 − 0.1112 h − 0.00149 h²), h in km: 760 at sea level, 547 at 2850 m, 444 at 4559 m, 253 at 8848 m | West 1996, J Appl Physiol 81:1850 (within 1 % at most high mountain sites) |
| heavy exertion | aerobic capacity 1 − 0.063 × (altitude − 300 m) ÷ 1000 m, a capacity in the force model for checks with `exertion: heavy` | Wehrlin & Hallén 2006, Eur J Appl Physiol 96:404 (VO2max −6.3 % per 1000 m, 300–2800 m; linear beyond [ASSUMED]) |
| acute mountain sickness | rolled once after 12 h (the first night) at a new altitude: 0 below 2500 m [ASSUMED], 9 % at 2850 m, 13 % at 3050, 34 % at 3650, 53 % at 4559, linear between, held above → heavy exertion fails; it ends 24–48 h after onset (uniform) without further ascent [ASSUMED from "symptoms that force a reduction in activity"] | Maggiorini et al. 1990, BMJ 301:853 (466 climbers in Swiss Alps huts); Maggiorini et al. 1998 |
| acclimatization | the chances above use the gain over the acclimatized altitude: effective altitude = altitude − acclimatized + 2500 m. Acclimatized altitude starts at 2500 m and rises 457 m (1500 ft) per full day spent above it, up to the current altitude; kept after descent [ASSUMED] | WMS pace, one day per 1500 ft above 10 000 ft (StatPearls NBK560677); AMS self-limiting in 24–48 h (same) |
| cerebral oedema (HACE) | rolled with AMS: 1 % at 4000 m and above → heavy exertion fails; unconscious 1 h before death, dead 12–24 h after onset (uniform) unless the person descends below that altitude [ASSUMED descent criterion] | Adhikari & Zimmer 2026, BMJ (WMS 2024): HACE in up to 1 % at 4000–5000 m; untreated, coma and death within 12–24 h without descent |
| pulmonary oedema (HAPE) | rolled with AMS: 6 % at 4500 m and above; begins 1–5 days after arrival (uniform) → heavy exertion fails; half die 2–6 h after onset (uniform) unless the person descends below that altitude [ASSUMED range for "a few hours"] | same: HAPE in up to 6 % at 4500 m; untreated mortality up to 50 %. Onset 1–5 days after reaching altitude (StatPearls NBK560677); "may be fatal within a few hours if left untreated" (Medscape 300716) |
| rapid decompression (`decompression`) | the FAA's shorter column: 18 000 ft 10–15 min, 22 000 ft 5–6 min, 25 000 ft 1.5–2.5 min, 28 000 ft 1–1.5 min, 30 000 ft 30–60 s, 35 000 ft 15–30 s; above 35 000 ft ("nominal") the quiet values [ASSUMED] | FAA AC 61-107B, Figure 2-3 |
| sudden arrival | above 18 000 ft (5486 m): unconscious ("hypoxia") once a time drawn uniformly from the FAA range runs out: 18 000 ft 20–30 min, 22 000 ft 10 min, 25 000 ft 3–5 min, 28 000 ft 2.5–3 min, 30 000 ft 1–2 min, 35 000 ft 30–60 s, 40 000 ft 15–20 s, 43 000 ft and above 9–12 s; linear in feet between rows; descending ends it | FAA AC 61-107B, Figure 2-3 (sitting quietly) |

Scratch runs (400 people each, after 13 h): AMS 0 % at 1500 m, 40 % at 3650 m, 53 % at 4559 m. A load-carrying task that 80 % pass at sea level: 68 % at 1500 m, 37 % at 3650 m, 22 % at 4559 m (before any sickness). Sudden arrival at 35 000 ft: unconscious in the first minute. 2000 people at 4600 m for 40 h: 20 HACE (1.0 %), 123 HAPE (6.2 %); every HACE case left there died, every one taken down within 2 h of onset lived. 1000 people for 6 days: straight to 4559 m, AMS 53 %, HAPE 5.2 % (mean onset day 2.9); 3000 m then +457 m a day to 4371 m, AMS 41 % (summed over 4 ascents), HAPE 0.

### 6.7 Walking with a load

PassTime `walking` entries (speed, load, slope, terrain) set the walker's activity for the span: METs = Pandolf watts ÷ (1.163 W/kg × body kg). It drives food energy, and heat (JOS-3 or the animal model) when conditions are set; PassTime reports the distance covered.

| Quantity | Rule | Source |
|---|---|---|
| metabolic rate | M (W) = 1.5 W + 2.0 (W + L)(L ÷ W)² + η (W + L)(1.5 V² + 0.35 V G); W body kg, L load kg, V m/s, G grade %; downhill counted as level [ASSUMED] | Pandolf, Givoni & Goldman 1977, J Appl Physiol 43:577 (via Wikipedia "Pandolf equation") |
| running (`running: true`) | VO2 (mL/kg/min) = 0.2 v + 0.9 v × grade + 3.5 (v m/min, grade fraction); × (body + load) ÷ body; η on the horizontal term; downhill as level [ASSUMED]; METs = VO2 ÷ 3.5 | ACSM running equation, as given by Dugas et al. 2023, J Clin Med 12:7835 |
| terrain η | road 1.0, dirt road 1.1, light brush 1.2, heavy brush 1.5, swamp 1.8, loose sand 2.1, soft snow 15 cm 2.5, 25 cm 3.3, 35 cm 4.1 | Soule & Goldman 1972, J Appl Physiol 32:706 |

Examples (70 kg): road, no load, 5 km/h: 308 W, 3.8 MET (Compendium walking 3 mph: 3.5); dirt road, 20 kg, 5 km/h: 5.0 MET; 30 kg up a 10 % slope at 4 km/h: 9.5 MET; 20 kg in 25 cm snow at 4 km/h: 8.2 MET.

Endurance:

| Quantity | Rule | Source |
|---|---|---|
| VO2max | untrained mean: men 47.5 at 6 y, peak 50 at 12–13, linear to 25 at 75; women 42.5 at 6, peak 44 at 9, linear to 17.5 at 75 (mL/kg/min): men 25 y 45.0, women 25 y 37.6, men 50 y 35; spread SD 8.4 (men), 7.7 (women); each person keeps one draw (floor 10.5) | Shvartz & Reibold 1990, Aviat Space Environ Med 61:3 (direct measurements of untrained people, USA, Canada, 7 European countries); SD from Loe et al. 2013, PLoS One 8:e64319 (HUNT) |
| relative load | (METs − 1) ÷ (VO2max ÷ 3.5 − 1) | [ASSUMED: heart-rate reserve share ≈ VO2 reserve share] |
| maximum acceptable work time | 26.12 × e^(−4.81 × relative load) hours; every minute of walking (`walking`) or other activity (`active`, 3.5 MET) adds 1 ÷ that time; at 1 → exhausted: all exertion checks fail | Wu & Wang 2002, Ergonomics 45:280, as given by Park et al. 2023, Ann Occup Environ Med 35:e24 |
| recovery | at rest or asleep the total falls 5 % per hour if under a day's food is missing, else 2 % per hour; exhaustion ends at 0.9 (2 h of fed rest) [ASSUMED: recovery follows muscle glycogen]; a full day of exhausting work needs 20 h fed rest | glycogen returns 2 %/h unfed, 5 %/h with 50 g carbohydrate every 2 h; at least 20 h for full stores (The Sport Journal, "Glycogen replenishment after exhaustive exercise") |

Limits for a 25-year-old man: 3.8 MET (road walk) 10.3 h, 5.0 MET (20 kg on a dirt road) 7.0 h, 6 MET 5.0 h, 8.2 MET (20 kg in snow) 2.4 h, 9.5 MET (30 kg up 10 %) 1.6 h.

Running (70 kg, road): 8 km/h 8.6 MET, kept 2.1 h; 10 km/h 10.5 MET, 1.1 h; 12 km/h 12.4 MET, 36 min; 10 km/h up 5 % 12.7 MET, 33 min.

Downhill: Pandolf at the negative grade minus the Santee et al. 2001 correction, CF = η [G (W + L) V ÷ 3.5 − (W + L)(G + 6)² ÷ W + 25 − V²], recalled, not checked against the paper [ASSUMED]. With 70 kg + 20 kg at 1.34 m/s: level 386 W, −5 % 320 W, −10 % 298 W, −20 % 467 W (cost is lowest near −10 %).

Available VO2max = VO2max × altitude factor (§6.6) − 4 mL/min per g of haemoglobin missing (Schmidt & Prommer 2010, Exerc Sport Sci Rev 38:68). Haemoglobin 150 g/L men, 135 g/L women [ASSUMED typical]; missing blood = blood lost + red-cell deficit. A 450 mL loss: 54.4 → 50.5 mL/kg/min (−7 %), a 5-MET walk lasts 6.2 h instead of 7.0 h; 3000 m: 5.2 h. Heavy-exertion checks use available ÷ normal VO2max as the 'aerobic' capacity.

Open (OPEN-87): recovery rate is glycogen's, not measured on work capacity; check the Santee correction against the paper.

Chase (Chase: pursuer, fleeing, `gap_m`): top speed = the creature's fastest DF walking gait [RAW], km/h = 8775 ÷ gait value (the constant that matches the speeds written beside the gait variations in the DF raws: human sprint 225 → 39 km/h, dog gallop 149 → 59, horse 125 → 70, cheetah 100 → 88), × the share of working legs [ASSUMED]. Caught when the pursuer is faster, after gap ÷ speed difference. Results: dog vs human, 20 m: caught at 3.6 s; grizzly, 50 m: 10.7 s; human vs human with a broken lower leg: caught at 1.8 s; equal humans: no catch. Limits (OPEN-90): all humans run at the DF human top speed (39 km/h, an elite sprinter's); no acceleration, sprint endurance, terrain or load; individual speed differences.

### 6.8 Carbon monoxide

Set with BodyEnvironment `co_ppm`; treated with BodyTreat `oxygen` or `hyperbaric_oxygen`.

| Quantity | Rule | Source |
|---|---|---|
| uptake | Coburn-Forster-Kane: d[COHb]/dt = Vco/Vb + PICO/(B·Vb) − [COHb]·PcO2/(M·B·Vb·[O2Hb]); B = 1/DL + PL/VA; DL 30 mL/min/mmHg, PL 713 mmHg, M 218, PcO2 100 mmHg, Vco 0.007 mL/min, O2 capacity 0.207 mL/mL; Vb = blood volume (§5); VA 6000 mL/min × METs [ASSUMED scaling]; PICO = ppm × (air pressure − 47) | standard CFK constants |
| clearance | out of the gas: half-life 320 min on room air, 80 min on 100 % oxygen, 23 min hyperbaric (3 atm) | Wikipedia, Carbon monoxide poisoning |
| unconscious | COHb ≥ 30 % [fit: 800 ppm "insensible within 2 hours" → 97 min; "30 % COHb is considered severe"] | same |
| death | COHb ≥ 40 % [fit: 3200 ppm "death within 30 minutes" → 29 min]; the highest non-fatal level reported is 73 % | same |
| none | `NOBREATHE` creatures; bloodless creatures | [RAW] |
| other creatures | VA scales with (mass ÷ 70 kg)^0.75 [ASSUMED: ventilation follows Kleiber metabolism]; at 1600 ppm, 0.3 kg rat dead at 12 min, 20 kg dog 39 min, 70 kg human 62, 500 kg horse 175 (small animals first, as with miners' canaries) | |
| low oxygen (`o2_pct`) | the altitude with the same inspired oxygen pressure, FiO2 × (PB − 47), entered suddenly; all §6.6 rules apply [ASSUMED equivalence of hypoxic air and altitude]. 19 % = 813 m, 17 % = 1711 m, 15 % = 2689 m, 12 % = 4352 m, 10 % = 5636 m, 8 % = 7120 m (unconscious at 8 min), 6 % = 8895 m (2 min), 4 % (1 min) | West 1996 pressure (§6.6); FAA times (§6.6) |
| smoke (`smoke`) | inhalation injury: +17 on the burn score (§6.4 burn death); 18 % burn at 40: 1.0 % → 3.2 % die | Osler et al. 2010, J Trauma 68:690 ("the presence of inhalation injury added the equivalent of 17 years (or 17 % burn)") |

Results (70 kg at rest): 100 ppm 11 % at 8 h; 800 ppm unconscious 97 min, dead 145 min; 1600 ppm 44 / 62 min (table: death in under 2 h); 3200 ppm 22 / 29 min; 12 800 ppm 6 / 7 min (table: unconscious after 2–3 breaths, dead in under 3 min — faster than CO binding explains). After 60 min at 1600 ppm (39 %): 80 min on oxygen → 20 %.

### 6.9 Social judgments

| Judgment | Rule | Source |
|---|---|---|
| lie or truth (SocialResponse: a statement that might be a lie) | judged truthful: truths 61.34 %, lies 52.45 %, + 11.58 % × the speaker's credibility z, + 5.13 % × the listener's credulity z, ± 5.49 % × the speaker's detectability z (lies less believed, truths more); each z drawn once per person; one roll. A speaker at credibility +2 SD: a lie is doubted 24 % of the time instead of 48 % | Bond & DePaulo 2006, Pers Soc Psychol Rev 10:214 (206 documents, 24 483 judges); Bond & DePaulo 2008, Psychol Bull 134:477 (247 samples): measurement-corrected SDs, judge ability 0.80 % (negligible), credulity 5.13 %, detectability 5.49 %, credibility 11.58 %; "the outcome of a deception judgment depends more on the liar's credibility than any other individual difference" |

| bystander helps (SocialResponse: an emergency they witness) | alone 85 %; with others, probit(0.85) + g, g = g(situation) + g(number) + 0.35 [ASSUMED additive, g as a probit shift]: g(situation) not an emergency −0.47, victim in danger −0.30, attacker present +0.29; g(number) 1: −0.12, 2: −0.21, 3: −0.45, 4: −0.38, 5+: −0.49. Victim in danger: 1 other 83 %, 4 others 76 %, 8 others 72 %; attacker present: 88–94 % | Darley & Latané 1968 (alone 85 %); Fischer et al. 2011, Psychol Bull 137:517, Tables 3–4 (105 effect sizes, > 7700 participants, overall g −0.35). The classic 31 % with four others (Darley & Latané) is the extreme of this literature |
| order to harm (SocialResponse: an order to hurt someone) | carries it out to the end: victim out of sight 65 %; same room 40 %; must physically force 30 %; orders by phone 21 %; ordinary business 47.5 %; peers refuse 10 %; a peer obeys 92.5 % | Milgram's variations (Wikipedia, Milgram experiment); Blass: replications 28–91 %, US mean 61 %, elsewhere 66 % |

| small request to a stranger (SocialResponse: a small favour asked by a stranger) | yes 46 % | Flynn & Lake 2008, J Pers Soc Psychol 95:128 (via ScienceBlog): about 10 asks for 5 questionnaires, 6 for 3 phone loans, just over 2 for 1 escort to a gym [targets 5, 3, 1 as recalled] → 48, 48, 43 % |

| interest after a first meeting (SocialResponse: a brief first meeting) | wants to meet again: 50 %; women meeting 15 or more prospects at once 33 % | Fisman, Iyengar, Kamenica & Simonson 2006, Q J Econ 121:673: 392 subjects, 14 sessions, 6276 four-minute meetings; small sessions about half yes for both sexes, large sessions men about 50 %, women about one-third; overall 0.43. Attractiveness raised a yes by 0.119–0.140 per rating point (1–10), not used: ratings would be the narrator's guess |

Limits (OPEN-89): evidence, prior suspicion and relationship are not inputs (detection rates vary little between studies, and judge experience did not raise ability).

### 6.10 Grip: hanging on and carrying by hand

| Quantity | Rule | Source |
|---|---|---|
| grip strength | mean and SD by age and sex, linear between tabled ages (20–90); each person keeps a z drawn once; men 30: 51.6 ± 9.6 kg, women 30: 31.4 ± 6.0, men 75: 35.6 ± 7.6, women 75: 21.4 ± 5.4 | Dodds et al. 2014, PLoS One 9:e113637, Table 2 (60 803 observations, 12 British studies) |
| HoldOn | holds when load per working hand ≤ grip × cold-forearm force factor (§6.4); hanging: load = own body mass [ASSUMED: maximal dynamometer grip = maximal static hold] | — |
| hold time | ET (s) = 33.55 × f^−1.61, f = load per hand ÷ grip; `seconds` asks whether the hold lasts that long. Average man (30 y, 80 kg) hanging by two hands: 51 s; carrying 20 kg in one hand: 154 s | Frey Law & Avin 2010, Ergonomics 53:109, Table 2: grip power model from a meta-analysis of static endurance (194 publications, 369 points), R² 0.748 |

Scratch (2000 each): hanging by two hands — man 30 y, 80 kg: 89 %; woman 30 y, 60 kg: 60 %; man 75 y: 28 %; woman 75 y: 6 %. Carrying 40 kg in one hand — man 30: 89 %; woman 30: 7 %. Limits (OPEN-90): fingertip ledges (weaker than a full grip), hand injuries other than lost function.

Grip by world region: the British norms are scaled by the PURE study's regional medians (Leong et al. 2016, J Cachexia Sarcopenia Muscle 7:535, Table 2, 125 462 healthy adults, 21 countries) relative to Europe/North America, per sex and age band (35–40, 41–50, 51–60, 61–70; nearest band outside [ASSUMED]). Men at 41–50: Europe/North America 49 kg, China and South America 43, Middle East 43, Africa 38, South East Asia 37, South Asia 33. HoldOn takes `region` once per character.

### 6.11 New characters

A character the story has not described gets sex, age and occupation from the 1881 census of England and Wales (country totals as published by A Vision of Britain Through Time: Table 3, ages of males and females, 21 five-year bands; Table 10, occupations of males and females, 330 occupations after dropping the "Others" rows), through NewCharacter. Sex: 48.7 % male from the age table, or the chosen occupation's own men/women counts. Age: weighted by the band counts for that sex, uniform within the band [ASSUMED]. Occupation: from age 15 [ASSUMED; the table has no ages], a person has one with probability (occupation total for the sex) ÷ (population aged 15+ of that sex), then one is drawn by count; otherwise "no stated occupation". Whatever the story already fixes (sex, occupation, a minimum age) is passed in and kept. Occupied from 15: men 96 %, women 40 %. Check (20 000 draws): 50.7 % female, 36.5 % under 15 (census 51.3 %, 36.5 %). OPEN: other countries and periods; age by occupation; names.

Birthplace: NewCharacter also draws where the person was born, from the 1881 census birthplaces of the 25 974 439 people in England and Wales (Ravenstein 1885, "The Laws of Migration", J Stat Soc London 48:167): this county 72.0 %, a neighbouring county 12.7 %, elsewhere in England or Wales 11.0 %, Ireland 2.2 %, Scotland 1.0 %, abroad or at sea 1.2 %; the totals add up exactly to the census population. The country shares are used for any place [ASSUMED; towns held more migrants] and for any age [ASSUMED]. Check (20 000 draws): 72.0, 12.7, 11.0, 2.3, 0.8, 1.2 %.

US first names: NameCharacter draws a first name for a given sex and birth year from the Social Security Administration's names-by-state files (1910–2025, names given to 5 or more babies in a state and year), summed over states, 200 most frequent names per sex and decade, weighted by count. The 200 cover 86–89 % of named babies in the 1910s and 54–62 % in the 2020s; rarer names are not drawn.

Height and mass: BodySize draws an adult's height from the mean for their country and birth year (NCD Risk Factor Collaboration 2016, eLife 5:e13410, births 1896–1996, 190 countries, via Our World in Data) with the within-population SD of 7.59 cm for men and 7.07 cm for women (Jelenkovic et al. 2016, eLife, via Our World in Data); mass = the country's mean adult BMI for the story year (WHO Global Health Observatory, NCD-RisC estimates, 1975–2016) × height², the BMI drawn lognormal around that mean with a coefficient of variation of 0.190 for men and 0.212 for women (the seven regions of Leong et al. 2016, J Cachexia Sarcopenia Muscle 7:535, Table 1, SD ÷ mean, equal weight) [ASSUMED: lognormal shape]. Height and BMI are drawn independently: the NCD-RisC country estimates of the two correlate at r = 0.016. Check (20 000 draws): British men born 1980 in 2010, BMI mean 27.1, CV 0.194, 5th–95th percentile 19.4–36.7. Outside the tabled years the nearest year is used [ASSUMED]. The mass is written into the engine's body state. Check (20 000 draws): Dutch men born 1996, mean 182.4 cm, SD 7.64 cm (data 182.5 cm).

### 6.12 What exists and who knows it

Facts the story establishes are recorded once and stay true (RecordFact); each fact lists who knows it. Pattern from PAYADOR and Góngora et al. 2026 (world state held in code, the model proposes changes) and from Prom Week's social facts database (McCoy et al. 2013), with per-character knowledge as in Versu (Evans & Short 2014). Every turn the [KNOWS] block lists common knowledge and each character's facts, newest 12 per line [ASSUMED]: injecting what characters already know, with explicit "already knows" markers, cut known-information forgetting by 73 % over 90 chapters of generated fiction (Xiwei 2026, "Epistemic memory failures in long-form narrative agents"), and models otherwise answer as if a character knew what was said in their absence (FANToM, Kim et al. 2023). A message passed with Communicate and `message` adds the listener as a knower when the words or the gesture reach them (every word, most words, the gist, or a seen gesture; not a language the listener lacks).

Each knower can carry how they learned the fact: Communicate tags the listener "told by" the speaker, and RecordFact takes `how` (saw it, read it, told by a named person, rumour). [KNOWS] shows it after the fact on that knower's line, so hearsay stays hearsay (source-tagged beliefs as in Versu; LoCoMo, Maharana et al. 2024, ACL, scores recall of who said what).

The check pass receives the [KNOWS] lines and lists each place where a character states or acts on a fact listed only for others; the redo is told to have the character learn it on the page first or act without it.

### 6.13 Emotions

Appraise returns the emotion types from how the character sees the event, the action or the thing (Ortony, Clore & Collins 1988, The Cognitive Structure of Emotions, the 22 type specifications). First `matters` (not at all / somewhat / a great deal): OCC emotions arise only above a threshold, so "not at all" returns no emotion. Then the types; several can hold at once, as the book's compounds contain their parts and a confirmation is also a joy or a distress:

| About | Answer | Type |
|---|---|---|
| an event that affects them | good / bad | joy / distress |
| an event that affects someone else | good, wanted for them / good, not wanted / bad, wanted / bad, not wanted | happy-for / resentment / gloating / sorry-for |
| the prospect of an event | good / bad | hope / fear |
| a hoped-for or feared event | came true and good / came true and bad / did not and good / did not and bad | satisfaction + joy / fears-confirmed + distress / disappointment + distress / relief + joy |
| their own action | praiseworthy / blameworthy; + good or bad result | pride / self-reproach; praiseworthy and good: gratification + pride + joy; blameworthy and bad: remorse + self-reproach + distress; mixed: the attribution type + joy or distress |
| someone else's action | praiseworthy / blameworthy; + good or bad result for them | appreciation / reproach; gratitude + appreciation + joy; anger + reproach + distress; mixed as above |
| a person or thing encountered | appealing / unappealing | liking / disliking |

For fortunes of others the input is whether the character wants that outcome for the other person (OCC's desirability for other), not whether they like them: liking raises intensity but does not set the type. The result names the main type, the types felt with it, the first half of the book's words for it ("somewhat") or the second half ("a great deal"), and what makes it stronger, so the narrator words it within the type. All 22 types are reachable (checked over every input combination). EMA (Marsella & Gratch 2009) adds controllability and likelihood for coping; not used, as no coping step follows. An appraisal-based chain of emotion outperformed control conditions on user-rated believability and observed emotional intelligence of LLM game agents (Croissant et al. 2024, PLOS ONE 19:e0301033). Intensity itself is not computed (OPEN-92).

### 6.14 Prices and wages

Price returns what a good or a day's work costs in a European city, 1500–1913, from Allen 2001 (Explorations in Economic History 38:411): Table 3 prices of 14 goods in grams of silver (Strasbourg 1745–1754), Table 4 consumer price index for 17 cities by half-century (Strasbourg 1745–1754 = 1), Tables 1–2 daily wages of building craftsmen and labourers. A good's price = its Strasbourg price × the city's index for the period [ASSUMED: relative prices as in Strasbourg]; a missing period takes the adjacent one, at most 50 years off [ASSUMED]. The yearly basket of necessities for one person is Allen's 414.899 g (his quantities × prices sum to 410.1 g in the table as printed). The result also gives the days a building labourer works to earn it. Example: 2 kg of bread in London, 1665: 1.97 g of silver, 0.2 labourer-days.

### 6.15 Contagious disease

Disease answers two questions. When symptoms start: incubation is log-normal, median × s*^z, z ~ N(0, 1) (Sartwell 1950, 1952, in Limpert, Stahel & Abbt 2001, BioScience 51:341, Table 2): chickenpox 14 days (s* 1.14), serum hepatitis 100 days (1.24), bacterial food poisoning 2.3 hours (1.48), salmonellosis 2.4 days (1.47), poliomyelitis 12.6 days (1.50), amoebic dysentery 21.4 days (2.11). Check (20 000 draws, chickenpox): median 14.0 days, 68 % between 12.3 and 16.0 (14 ×/ 1.14). How many fall ill: the final-size relation z = 1 − e^(−R0 s z) for a closed, mixing community, s the susceptible share; no outbreak unless R0 s > 1 (Kermack & McKendrick 1927). R0 at the middle of the ranges in Smieszek 2009 (Theor Biol Med Model 6:11, Table 1): chickenpox 9.5, measles 16, mumps 11, whooping cough 16. Influenza is left out: with R0 2–3 the equation gives about 89 % infected, far above observed attack rates (mixing is not homogeneous). Example: measles in 1 200 people with 80 % immune: 229 fall ill; with 95 % immune: no outbreak.

### 6.16 Weather

Weather gives the day's rain and temperatures at one of 28 US stations from the story date, by WGEN (Richardson & Wright 1984, "WGEN: a model for generating daily weather variables", USDA ARS-8). Rain: a wet or dry day by a first-order Markov chain (monthly P(W/W), P(W/D)), the amount from a gamma distribution (monthly alpha, beta; Table A1, 20 years of daily data 1951–70). Max and min temperature and solar radiation: residuals χ_i = A χ_{i−1} + B ε_i with A and B of eqs. 10–11, value = m (χ c + 1), the mean m and coefficient of variation c following u + C cos(0.0172 (day − T)) on wet or dry days (Tables 1–5). Each station's year is generated from 1 January with a seed from the chat and the year, so the same date always gives the same weather. As in the program listing (Appendix C), a residual normal beyond ±2.5 is redrawn and a coefficient of variation below 0.06 is raised to 0.06. Check (30 years, Atlanta): January high 11.8 °C (SD 5.3), July high 31.6 °C (SD 3.2). Temperature through the day: lowest at 06:00, highest at 15:00, cosine between [ASSUMED]. Table A1 is an image scan: it was read by OCR twice (300 and 400 dpi) and the six values that differed between the passes or fell out of range were read off the scan (Albuquerque Feb P(W/W) 0.392 and P(W/D) 0.090, Atlanta Feb P(W/W) 0.490, Caribou Mar P(W/D) 0.315, Dodge City Dec P(W/D) 0.103, Boston Jan P(W/D) 0.333); Table 1 Grand Junction dry-day u read off the scan as 66.6 °F. Ely, Lander and Sault Ste. Marie have temperature tables but no readable rain row and are left out. Check (200 simulated years): Boston 1 125 mm of rain a year, January high 2.6 °C and low −5.0 °C, July high 27.6 °C; Phoenix 178 mm, 18.2 / 3.0 / 40.2 °C; Miami 1 502 mm; Bismarck 396 mm, January high −5.4 °C. These are close to the stations' published climate normals as recalled [not checked against a source here]. BodyEnvironment with `weather_station` puts characters outdoors at a station: their air (and radiant) temperature is set from the weather now, and PassTime then runs in hour steps, each taking the temperature at its start; any later BodyEnvironment call without the station (indoors, elsewhere) ends this. Story time is the tracker's [TIME] plus the minutes PassTime has run since [TIME] last changed, so several PassTime calls in one reply move the clock on. Check: a January morning in Bismarck from 06:00, hourly air temperature −16.8, −16.6, −16.2, −15.5, −14.7, −13.9, −13.1, −12.4, −12.0 °C.

Anywhere else: the Weather tool and BodyEnvironment take a town or city by name ("Lyon", "Sydney, Australia"), or latitude and longitude for a fictional or remote place (the nearest city is used, its distance reported). Cities: 1736 with all twelve months of mean daily maximum and minimum temperature, mean precipitation and mean number of precipitation days in the WMO World Weather Information Service (worldweather.wmo.int, supplied by each country's meteorological service; periods mostly 1961–1990, 1971–2000 or 1981–2010, many unstated; downloaded 11 October 2026; 22 dropped for impossible values). The 28 WGEN stations keep their full parameters when named. Monthly normals become WGEN parameters by SIMMETEO (Geng, Penning de Vries & Supit 1986, Agric For Meteorol 36:363; Geng et al. 1988), as coded in DSSAT's WGEN.for, subroutine SIMMIN (DSSAT Foundation, BSD-3):

| Parameter | Rule |
|---|---|
| wet-day share PW | precipitation days ÷ days in the month |
| P(W/D), P(W/W) | 0.75 PW; 1 − P(W/D) (1 − PW) ÷ PW |
| gamma β, α | rain per wet day R: β = max(−2.16 + 1.83 R, 0.01), α = R ÷ β within 0.01–0.998; when α would exceed 0.998, β = R ÷ 0.998 [ASSUMED: keeps the mean; SIMMETEO's cap alone gave Cairo 1 mm of January rain for a normal of 5] |
| max temperature, dry and wet days | mean ± split, split = \|9.67 − 27.4 × mean P(W/D)\| × 5/9 °C, weighted by the month's PW [DSSAT weights by the annual mean PW, which shifted monthly means by up to 1 °C] |
| SDs | max temperature max(5.8 − 0.09 T, 0.5); min temperature max(5.2 − 0.13 T, 0.5) °C |
| daily values | the WGEN residual chain (A, B, redraw beyond ±2.5); value = mean + SD × residual |
| through the year | temperature parameters linear between mid-months, mid-month values corrected until each month's mean equals its normal (DSSAT's CFACT); rain parameters the month's own |

Precipitation falls as snow when the day's mean air temperature is at or below 1.0 °C (Northern Hemisphere mean 50 % rain–snow threshold, Jennings et al. 2018, Nat Commun 9:1148; −0.4 to 2.4 °C by region) [day mean as air temperature: ASSUMED]. A place sets the latitude Look uses for daylight.

Check (30 simulated years; normal in brackets): London January high 8.3 (8.1), low 2.9 (3.1), rain 40 (42) mm on 11.3 (11.4) days; Tokyo October rain 228 (235); São Paulo January high 27.2 (27.3), rain 222 (239) on 18.8 (18) days; Lagos July rain 276 (257); Cairo July high 34.8 (34.8), dry. Moscow January high comes out −5.2 against −6.3: WGEN swaps a day's max and min when they cross, which raises the max where both spreads are large.

### 6.17 Choices

Choose draws a character's pick among options the narrator lists, each with the share of people in that character's place who would take it (the same labelled bands as BodyCheck), weighted random over all options; options with the same wording are merged, since a duplicated option takes extra share from the others in a logit choice (McFadden's independence of irrelevant alternatives) and keeps a floor of 1 % so no listed option is impossible (Mark 2009, Behavioral Mathematics for Game AI, ch. 16, "weighted random from all choices"), the probabilistic-choice view of McFadden's conditional logit (1974). Check: 80 % against 20 % gave 324 and 76 of 400 draws.

### 6.18 Battles

Battle decides whether an attack on a defended position succeeds, from the force ratio (attackers ÷ defenders) and the year, using the shares of attacker wins in the Dupuy Institute's historical engagement databases (C. A. Lawrence, War by Numbers, 2017, tables as posted at dupuyinstitute.org under "Force Ratios"). Adjacent ratio bands with fewer than 30 cases are merged, cases weighted [stated process]; full data sets, not the culled ones.

| Years | Force ratio | Attacker wins | Cases |
|---|---|---|---|
| 1600–1900 (Battles Data Base, 243 battles) | under 1 | 54 % | 94 |
| | 1 to under 2 | 58 % | 109 |
| | 2 or more | 60 % | 40 |
| 1901–1991 (Division-level Engagement Data Base, 672 engagements, 1904–1991; 1901–1903 take this table [ASSUMED]) | under 1 | 39 % | 88 |
| | 1–1.49 | 55 % | 150 |
| | 1.5–1.99 | 59 % | 123 |
| | 2–2.49 | 71 % | 56 |
| | 2.5–2.99 | 83 % | 53 |
| | 3–3.49 | 69 % | 48 |
| | 3.5–3.99 | 77 % | 30 |
| | 4–5.99 | 65 % | 66 |
| | 6 or more | 95 % | 39 |

The dips at 3–3.5 and 4–6 are in the data and are kept. Before 1900 the ratio changes the result by 6 points across its range, so the result says that leadership, ground and morale decided the rest. Outside 1600–1991 the tool hands the decision to BodyCheck. BodyCheck tasks naming a battle, an assault or storming a position are routed to Battle. CDB90 (below) shows the same flat pattern before 1900: attacker wins 60, 62, 62, 35 and 61 % at ratios under 1, 1–1.5, 1.5–2, 2–3 and 3 or more (236 battles).

Surprise: when the defenders were unaware of the attack until it struck, the share is shifted in log-odds by the difference between attacks with and without attacker surprise in CDB90: 1600–1900 74 % (61 battles) against 56 % (162), shift +0.80; 1901–1973 82 % (105) against 64 % (271), shift +0.94 [ASSUMED: independent of the force ratio]. CDB90's surprise codes were assigned by historians after the battle, so the effect may be overstated. Example: 0.8 to 1 in 1757, 54 % → 72 %. Defender surprise (14 battles) and the defender's posture (fortified defences were attacked mostly by stronger forces, so posture and ratio are confounded) are not used.

Casualties and duration: copied from one real battle in CDB90 (US Army Concepts Analysis Agency, Database of Battles 1990; open copy github.com/jrnold/CDB90, whose cleaned files set every negative code to missing, so outcomes were re-read from the original WKS files: 398 attacker wins, 217 losses, 43 draws, 2 unknown) of the same era (1600–1900, 1901–1973) and outcome, chosen at random among the 10 nearest in force ratio and total size (distance |Δ ln ratio| + |Δ ln size|) [ASSUMED: k = 10, equal weights]. Battles with reinforcements are left out, as Helmbold 1995 (CAA-RP-95-1) did, leaving 427. Size enters because the loser's casualty share falls from 27 % in battles under 10 000 men to 12 % at 10 000–50 000. The battle's casualty shares (killed, wounded, captured, missing) are applied to the story's forces and its active fighting hours are reported. Medians, 1600–1900: attacker won: attackers 9 %, defenders 27 %, 8 hours; attacker lost: attackers 22 %, defenders 9 %. 1901–1973: won 3.5 % / 14 %, 48 hours; lost 4.6 % / 4.6 %. After 1973 the 1901–1973 battles are used [ASSUMED]. Draws (3 % before 1900, 10 % after) are folded into failures, as in the Dupuy tables.

## 7. Tools

| Tool | Change |
|---|---|
| all | species and mass on first appearance: the tool arguments, else the State Tracker profile (`Name (N kg)` header and its `Species:` line), else human at the species' adult mass |
| all (argument) | `species`: DF creature id or name ("HUMAN", "wolf", "giant wolf"); used when the character first appears; default human |
| BodyStrike | `part` = a part name of the target (free text); `attack` = the attacker's natural attack (punch, kick, bite, scratch…) or the weapon's attack verb (slash, stab, bash…); `weapon` = DF weapon name; `material` = metal; `skill` = DF level name; `style`; `prone`; `attacker_species`. Removed: `means`, untrained/trained/elite |
| BodyWound | `part` = a part name; cut, puncture or bite: a wound through every layer [ASSUMED]: vessel class as §5, and organ (`FUNCTIONAL`) tissue stops working, for good without `HEALING_RATE`, as in §5 |
| BodyCheck | `uses` = grasp, stance, sight, hearing, smell, breathing |
| BodyChoke | `who`, `holder`, `seconds` held: §6.1 choke rows |
| BodyEnvironment | `who` list; air °C, radiant °C, humidity, weather wind km/h or indoor air speed, ensemble and/or garments with covers, face covered, METs; `clear`: §6.4 |
| unknown part / attack / species | the tool returns the valid names; nothing recorded |

### 7.1 Audit: what the narrating model still decides

Each tool input is either a scene fact (visible in the story: distance, temperature, who is present) or an outcome guess (the model estimates how likely or how bad something is). Outcome guesses are where a narrator bends a scene; the goal is none.

| Tool | Input | Kind | Status |
|---|---|---|---|
| BodyCheck | `share` (fraction who succeed) | outcome guess | open: the main remaining guess (OPEN-90); chosen from 7 labelled bands (95, 80, 65, 50, 35, 20, 5 %) [ASSUMED values]: words and bands are the verbal-confidence form models can be taught to calibrate (Lin, Hilton & Evans 2022, TMLR), while their unprompted verbal confidence clusters at 80–100 % and hedges toward the middle (Xiong et al. 2024, ICLR; Geng et al. 2024, NAACL survey); Kadavath et al. 2022 measured calibration from answer probabilities, which a narrator cannot report. The narrator first names a reference class and its base share, then its own estimate; chance = the equal-weight average of the two in log-odds, logit⁻¹((logit class share + logit estimate) / 2). Kahneman & Tversky's (1977) shrinkage ρ = 2p − 1 is dropped: it needs p, the narrator's own ordering accuracy, and models are overconfident about it; averaging an LLM estimate with a second forecast in log-odds improved accuracy over either alone (Schoenegger et al. 2024, Science Advances; Halawi et al. 2024, NeurIPS), and log-odds averaging keeps confident inputs from being pulled to the middle as a plain average does (Baron et al. 2014, Decision Analysis; Lichtendahl et al. 2013, Management Science) |
| BodyCheck | task text | routing | a task whose words match a specialist tool (hear/listen → Listen or Communicate; see/spot/notice → Look; swim → BodyEnvironment; hang/carry/grip → HoldOn; chase/flee → Chase; lie/bluff → SocialResponse; shoot/aim → BodyStrike; tourniquet/bleed → BodyTreat; date/attracted → SocialResponse) is refused and named; `override: true` passes a genuinely different task |
| BodyCheck | `uses`, `exertion`, `on_feet`, `timed`, `fine` | scene facts (what the task involves) | — |
| BodyWound | `type`, `depth` for accidents | outcome guess | partly replaced: burns by BodyContact and heat, falls by BodyFall, attacks by BodyStrike |
| BodyStrike | `noise_db` | estimate | `noise_sound` (Listen presets, level from distance) replaces it when the sound is listed |
| BodyStrike | `skill` | character fact | — |
| CastSpell | `complexity` | setting fact (spell list) | — |
| BodyIntake | amounts | scene facts, with examples | — |
| BodyEnvironment | `co_ppm` | estimate | ranges given in the description |
| Look | `size_m`, `distance_m`, `light`, `visibility_m` | scene facts | — |
| Listen, Communicate | `sound`/`spl_db`, `distance_m`, `noise`, `barrier`, `effort` | scene facts (presets) | — |
| SocialResponse | `situation`, `is_lie`, `others`, `emergency`, `order`, `many_options` | story and scene facts | — |
| BodyContact | `material`, `temp_c`, `seconds` | scene facts | — |
| BodyFall | `height_m`, `soft`, `head_first` | scene facts | — |
| HoldOn | `hanging`, `load_kg`, `hands` | scene facts | — |
| Chase | `gap_m` | scene fact | — |
| NewCharacter | `sex`, `occupation`, `min_age` | story facts (only when fixed) | sex, age and occupation otherwise drawn from the 1881 census (§6.11) |
| Look | `light` | scene fact (artificial light, overcast) | outdoors computed from date, hour and latitude (§6.2) |
| RecordFact, Communicate `message` | the fact, who knows it | story facts | kept in code and injected as [KNOWS] (§6.12) |
| Appraise | `about`, `matters`, good/bad, `wants_it_for_them`, came true, praiseworthy, result, appealing | the character's view | co-occurring emotion types and intensity words from the OCC model (§6.13) |
| Price | question (goods, daily wage, yearly cost of living), item, trade, quantity, city, year | scene facts | silver and labour-days from Allen 2001 (§6.14) |
| NameCharacter | sex, birth year | story facts | first name by US frequency (§6.11) |
| Disease | disease, population, immune share | story facts | incubation and outbreak size (§6.15) |
| Weather | station | scene fact | rain and temperature by WGEN (§6.16) |
| Choose | options and their shares | outcome guess, as labelled bands | drawn in code (§6.17) |
| BodySize | country, sex, birth year, story year | story facts | height and mass from NCD-RisC (§6.11) |
| Battle | attackers, defenders, year, place, surprise | story facts | outcome by force ratio, era and surprise; casualties and hours from a matched CDB90 battle (§6.18) |
| (no tool) | persuasion beyond small requests, morale and fleeing, task times, prices, who wins a negotiation | decided by the model | OPEN-89, OPEN-90 |

### 7.2 Defences against known model failures

Published failure modes of language models, and what the engine does about each.

| Failure (source) | Effect in a story | Defence |
|---|---|---|
| Models cave when the user pushes back: asked "Are you sure?", assistants drop correct answers and agree with the user's mistaken belief (Sharma et al. 2024, ICLR; larger and RLHF models more so, Perez et al. 2023) | the player writes "my sword hits" or disputes a miss, and the narrator gives in | brief: a player's message states attempts; results stand. Code: a decision tool (BodyCheck, Listen, Look, Communicate, SocialResponse, HoldOn, Chase, Choose, NewCharacter, NameCharacter, BodySize, Disease, Weather) called again in the same turn for the same actor and act returns its first result ("Already decided this turn"), like the RollTheDice ledger. A real second attempt names it ("pick lock, 2nd try"). Swipes re-run the turn from its snapshot with the same seed. |
| Models cannot produce random sequences: over-alternation, aversion to long runs, first-flip bias (Van Koevering & Kleinberg 2024) | "random" picks by the narrator are biased and steerable | all draws come from the seeded code RNG; brief: random picks (which door, coin, card) → RollTheDice table |
| Instructions fade over turns: significant drift within eight rounds (Li et al. 2024, COLM) | rules followed early, ignored later | the rules brief is re-injected every turn at the end of the context, not only in the system prompt |
| Information in the middle of a long context is used worst (U-shaped curve; Liu et al. 2024, TACL) | rules or state buried mid-context are ignored | brief and tracker state go in the per-turn injection near the end |
| A model commits to an early wrong answer and then justifies it (Zhang et al. 2023, hallucination snowballing) | narration states an outcome, then the tool is called to fit it | every tool says "before narrating"; the audit pass flags outcomes narrated without a tool call, now including the hearing, sight, message, lie, bystander, order, request, grip, chase, first-meeting and contact-burn tools, where the scene leaves the outcome in doubt |
| Irrelevant detail in the context lowers accuracy (Shi et al. 2023, ICML, "Large Language Models Can Be Easily Distracted by Irrelevant Context") | chances, intermediate values and citations in tool results anchor the narration ("only 31 %…") or leak into the story | tool results reach the narrator as the outcome plus its cause in words, never a chance or a source: BodyCheck says "SUCCESS, despite reduced grasp" or "FAILURE, because of no working grasp", and a failure with no limiting condition says so ("an ordinary failure: no injury or condition caused it"), since an outcome without a cause invites the narrator to invent one. Remaining parentheses holding a %, a year, SII or "chance" are removed as a safety net; the full text goes to the browser console. Data tables stay in code. |
| Tool-calling models misfire with many tools and fail to detect irrelevant ones (Patil et al. 2025, BFCL) | the wrong tool, or BodyCheck for a task a specialist tool decides | BodyCheck refuses tasks whose words match a specialist tool and names it (§7.1) |
| Models pick options by position or label rather than content (selection bias; Zheng et al. 2024, ICLR) | the narrator keeps choosing the first band | the bands carry their meaning in their text, not a letter ID (removing IDs cut the bias most in Zheng et al.), and are reshuffled before every generation: one fixed shuffle per load keeps a fixed position bias |
| A model judging two answers favours one by position; asking it to give its evidence first reduces that (Multiple Evidence Calibration; Wang et al. 2024, ACL); forced formats can cut reasoning quality (Tam et al. 2024) | the check pass misses or invents unbacked events | the check pass writes its evidence as plain lines first and the JSON list of events after; code reads only the JSON. Free reasoning first and format extraction second kept reasoning quality in Tam et al. 2024 (EMNLP Industry), and the check runs as a fresh call that has not seen the narrator's reasoning (Zhang et al. 2023: a model defends its own earlier answer) |
| Irrelevant, specific detail in the context lowers accuracy (Shi et al. 2023) | a fight scene pulls London bread prices into the prompt because they sat in the body lorebook entry | every set is kept at one level: the rules brief has one routing line per kind of event, grouped Body, Surroundings, Senses, People, World, Principles, with scopes (cities, years, settings) only in the tool descriptions; the lorebook is split by topic with its own trigger words (576 body, 578 senses and light, 579 people, 580 prices and disease); an enum lists one kind of thing (Price: question, goods, trade as separate enums) |
| Function-calling accuracy drops as the number of functions grows (Patil et al. 2025, BFCL; BFCL does not test merging tools); RPG-MCP cut 195 tools to 36 by merging them behind action enums, and SkillComposer reports the same consolidation | a narrow tool sits beside general ones and is missed or misused | the five social tools (lie, emergency, order, favour, first meeting) are one tool, SocialResponse, with the situation as an enum (28 → 24 tools); sound and noise presets are loudness classes with the measured example in parentheses, so a horse cart or a forge maps to a class instead of a modern machine standing out in a period scene |

### 7.3 Question pass

Before each reply to a player message, the State Model (the connection the tracker and the check pass use) reads the player's message, the last 8 messages and [KNOWS], with every rule tool listed by its arguments (enums of up to 40 values shown, longer ones as free text [ASSUMED]). It writes one question per outcome in doubt, then a JSON list of tool calls, at most 8 [ASSUMED]. Code drops calls to unknown tools or with a required argument missing, runs the rest in order through the same guarded action the narrator's calls use, and gives the narrator the results in a [DECIDED] block. The check pass counts them as engine results of the turn. A narrator call that repeats one of them returns the same result ("Already decided this turn").

| Step | Source |
|---|---|
| questions answered apart from the draft, before writing | Chain-of-Verification (Dhuliawala et al. 2023, arXiv 2309.11495): factored verification beat joint; list precision 0.17 → 0.36, biography FactScore 55.9 → 71.4 (LLaMA 65B); a model defends an outcome it has already written (Zhang et al. 2023) |
| ask a question when the next sentence is uncertain, answer it from a source, then write | FLARE (Jiang et al. 2023, arXiv 2305.06983), with the rule engine as the source |
| planning agents ahead of the writing agent | Agents' Room (Huot et al. 2024) |
| free-text questions first, JSON after | Tam et al. 2024 (as the check pass) |

A swipe of the same turn reuses the calls asked the first time; the engine state is back at the turn's start, so they return the same outcomes. Setting: "Rules question pass", on by default with the rules engine. Live check (§11): the pass runs before the narrator request, a narrator BodyCheck repeating the pass's BodyCheck returned "Already decided this turn", an unknown tool name was dropped, and the [DECIDED] block reached the narrator and the check pass.

IF the question pass ran this turn (also with no calls) → THEN the narrator gets RULES_BRIEF_DECIDED and [DECIDED] and no tool schemas (`shouldRegister`); an action [DECIDED] leaves open is narrated up to the moment its outcome would show. IF the pass failed or is off → THEN the narrator gets RULES_BRIEF and the 28 tools. Process: the 28 schemas measure 42,998 characters (≈ 12,300 tokens at 3.5 characters per token), and each narrator tool call adds a second full request; a live run on NVIDIA z-ai/glm-5.3 timed out at ≈ 4 min with them and answered a 13-token test in under 1 min.

IF an outcome follows from another outcome still in doubt (a blow after an order is obeyed, an answer after a call is heard) → THEN the question pass lists it under "then"; code runs the first calls, sends their results back once, and runs the calls written for the follow-on questions the results leave open (at most one extra round and 8 calls per turn; decide, read the result, decide again: FLARE, Jiang et al. 2023; ReAct, Yao et al. 2023). IF STORY STATE has no [TIME] and the scene, cast or scenario gives a date or hour → THEN the question pass returns it as "time" and code sets the story clock; a swipe of the same turn sets it again. IF the reply covers more than a few minutes → THEN PassTime. IF an undescribed person acts or speaks in the reply → THEN NewCharacter, once per person (the narrator would otherwise invent their sex, age and trade); the scorer counts it like RecordFact, never as extra. IF a feeling or a pick belongs to the player's character → THEN it comes from the player: Appraise and Choose are for the other characters. Process: GLM-5.3 on `/rules-eval 10` (2026-10-12) scored, after these rules, precision 58.8 %, recall 100 %, deciding arguments 100 %, quiet 100 %; 6 of its 7 extra calls were NewCharacter for people who act in the scene, 1 an Appraise. Before them it scored recall 90 %, deciding arguments 100 %, quiet 100 %, precision 50 %; the 10 extra calls were follow-on outcomes (BodyStrike after an order, SocialResponse after a call, Choose after a kick), PassTime for under two minutes, NewCharacter for background figures, and RollTheDice with no table; two BodyStrike calls failed on `part` being required while its description said to omit it (now optional: the location is drawn).

**Player claims.** A player writes plain language, so what a message states about their own character is a claim, not a fact; the world comes from the scenario and the world's facts, never from a claim. IF the kind of thing claimed does not exist in the world → THEN it does not hold, with no draw. IF a message states something the story has not established about the player's character (what they are, an item they have, something they can do, a past event) → THEN Claim: a reference class and its base share for the setting, an estimate for this story, combined in log-odds as in BodyCheck, then a draw. IF it holds → THEN it is recorded as the character's own fact; a claimed creature (DF creature id) becomes the character's body when no wound is on record. IF it does not hold → THEN "Not so: …" is recorded and the narrator shows the attempt meeting the world as it is. Either way it stays: a repeat in the same turn returns the same result and [KNOWS] carries it to later turns. Source of the rule: "say yes or roll the dice" (Baker 2004, Dogs in the Vineyard): an uncontested claim passes, a contested one is decided by chance. A creature's body then decides the rest: a cat that is a cat makes cat sounds (Communicate, CAN_SPEAK). Scenes 51–53 score it.

### 7.4 Scoring the question pass

`/rules-eval [n]` sends the first n of 50 scenes (`eval-scenes.ts`; default all) to the State Model as question-pass requests, with a fixed tracker state (two characters, a date in 1850; five scenes carry their own date), and scores the calls: a call counts only when it would run (known tool, required arguments, schema check passed). Each scene lists the calls a correct reading needs and the arguments that decide their outcomes (equal, contains, range, list holds a name, list length); other arguments are free, recording a fact is always allowed, and a scene may allow further tools. Scenes 40–44 need no call.

| Measure | Definition |
|---|---|
| fully correct | every expected call made with every deciding argument right, and no call outside the allowed ones |
| tool precision | matched calls ÷ calls made (allowed extras excluded) |
| tool recall | matched calls ÷ expected calls |
| deciding arguments right | passed checks ÷ checks |
| quiet when nothing is in doubt | share of the no-call scenes with no call |

The scenes cover every decision tool once or more (BodyStrike 4, BodyCheck 3, PassTime 4, BodyEnvironment 4, SocialResponse 5). Scorer check: a stand-in model answering with the expected calls scores 50/50; one answering no calls scores 5/50 (the quiet scenes), recall 0 %; inside SillyTavern with the scripted stand-in model the command runs and reports. Per-scene results go to the browser console. Together with /rules-stats (narration that departs from results) it measures the two factors §7.3 does not: picking the tool, and filling its deciding arguments.

## 8. Unchanged

Blood volume 70 mL/kg and loss classes, refill, red cells, infection, treatments, falls, PassTime interruptions, the check formula, magic — rule 576, now applied to any creature with blood [ASSUMED for non-humans].

## 9. Worked examples

Computed by the code in §1 from the raws (median values, spread z = 0).

Attacker at its species' adult size, target a 70 kg human, landed, Dabbling, normal style.

| Attacker, attack | Result |
|---|---|
| HUMAN {"attack":"punch","part":"head"} | punch (right hand) to head (crown): momentum 61. head: skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| HUMAN {"attack":"punch","part":"upper body"} | punch (right hand) to upper body: momentum 61. upper body: skin smashed, fat smashed, muscle smashed; left lung: lung smashed. Wounds 1, 2. |
| HUMAN {"attack":"kick","part":"right lower leg"} | kick (right foot) to right lower leg (shin): momentum 63.7. right lower leg: skin smashed, fat smashed, muscle smashed, bone held; right knee: muscle held, bone held. Wound 1. |
| HUMAN {"attack":"bite","part":"right hand"} | bite (head (first upper right incisor)) to right hand (palm): momentum 152.4. right hand: skin cut, fat cut, muscle cut, bone held; right wrist: muscle held, bone held. Wound 1. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"right upper arm"} | slash (iron short sword) to right upper arm (upper arm): momentum 85. right upper arm: skin cut, fat cut, muscle cut, bone held; right shoulder: muscle held, bone held. Wound 1. |
| HUMAN {"weapon":"short sword","attack":"stab","part":"upper body"} | stab (iron short sword) to upper body: momentum 68. upper body: skin cut, fat cut, muscle cut; left lung: lung cut. Wounds 1, 2. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"throat"} | slash (iron short sword) to throat: momentum 85. throat: skin cut; throat severed. Wound 1. |
| HUMAN {"weapon":"mace","attack":"bash","part":"head"} | bash (iron mace) to head (crown): momentum 138.5. head: skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| WOLF {"attack":"bite","part":"right lower leg"} | bite (head (first tooth)) to right lower leg (shin): momentum 86.9. right lower leg: skin cut, fat cut, muscle cut, bone held; right knee: muscle held, bone held. Wound 1. |
| GRIZZLY BEAR {"attack":"scratch","part":"upper body"} | scratch (right front foot (first right front toe)) to upper body: momentum 405. upper body: skin cut, fat cut, muscle cut; left lung: lung cut. Wounds 1, 2. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"upper body","armor":["iron breastplate"]} | slash (iron short sword) to upper body: momentum 85. upper body: iron breastplate held, skin held, fat held, muscle held; left lung: lung held. No wound. |
| HUMAN {"weapon":"short sword","attack":"stab","part":"upper body","armor":["iron mail shirt"]} | stab (iron short sword) to upper body: momentum 68. upper body: iron mail shirt held, skin smashed, fat smashed, muscle smashed; left lung: lung smashed. Wounds 1, 2. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"right upper arm","armor":["iron mail shirt"]} | slash (iron short sword) to right upper arm (upper arm): momentum 85. right upper arm: iron mail shirt held, skin smashed, fat smashed, muscle smashed, bone held; right shoulder: muscle held, bone held. Wound 1. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"right upper arm","armor":["leather armor"]} | slash (iron short sword) to right upper arm (upper arm): momentum 85. right upper arm: leather armor cut, skin cut, fat cut, muscle cut, bone held; right shoulder: muscle held, bone held. Wound 1. |
| HUMAN {"weapon":"mace","attack":"bash","part":"head","armor":["iron helm"]} | bash (iron mace) to head (crown): momentum 138.5. head: iron helm smashed, skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| HUMAN {"weapon":"short sword","attack":"slash","part":"left lower leg","armor":["steel greaves"]} | slash (iron short sword) to left lower leg (shin): momentum 85. left lower leg: steel greaves held, skin held, fat held, muscle held, bone held; left knee: muscle held, bone held. No wound. |
| WOLF {"attack":"bite","part":"right lower leg","armor":["leather high boots"]} | bite (head (first tooth)) to right lower leg (shin): momentum 86.9. right lower leg: leather high boots cut, skin cut, fat cut, muscle cut, bone held; right knee: muscle held, bone held. Wound 1. |
| open-back helm sub-draw 0.1 roll 50 | bash (iron mace) to head (forehead): momentum 138.5. head: iron helm smashed, skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| open-back helm sub-draw 0.9 roll 10 | bash (iron mace) to head (nape): momentum 138.5. head: skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| open-back helm sub-draw 0.9 roll 50 | bash (iron mace) to head (nape): momentum 138.5. head: skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| barbute sub-draw 0.1 roll 50 | bash (iron mace) to head (forehead): momentum 138.5. head: iron barbute smashed, skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| barbute sub-draw 0.9 roll 10 | bash (iron mace) to head (nape): momentum 138.5. head: iron barbute smashed, skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| barbute sub-draw 0.9 roll 50 | bash (iron mace) to head (nape): momentum 138.5. head: skin smashed, fat smashed, muscle smashed; skull: bone held. Wound 1. |
| vambrace sub-draw 0.1 roll 50 | slash (iron short sword) to right upper arm (shoulder): momentum 85. right upper arm: skin cut, fat cut, muscle cut, bone held; right shoulder: muscle held, bone held. Wound 1. |
| vambrace sub-draw 0.9 roll 10 | slash (iron short sword) to right upper arm (upper arm): momentum 85. right upper arm: steel vambrace held, skin held, fat held, muscle held, bone held; right shoulder: muscle held, bone held. No wound. |
| vambrace sub-draw 0.9 roll 50 | slash (iron short sword) to right upper arm (upper arm): momentum 85. right upper arm: steel vambrace held, skin held, fat held, muscle held, bone held; right shoulder: muscle held, bone held. No wound. |

What these show:
- Edged attacks: a sword, a human bite and a bear's claws cut skin, fat and muscle and stop at bone; a stab reaches the spine and is held.
- Blunt attacks (punch, kick, mace) smash soft tissue and the bone holds at median force; bone breaks in the tail of the spread (§4.6).
- Armour: an iron breastplate or steel greaves stop a sword slash; mail stops the cut and passes a bruise; leather armour is cut through; a mace through an iron helm bruises and the skull holds.
- Bites: a wolf's bite cuts skin, fat and muscle and stops at the shin bone; a human bite cuts to the bone (§4.7).

## 10. Open items added

| Id | Gap |
|---|---|
| OPEN-73 | closed: CHIMERA, CENTAUR and GRIFFON carry `DOES_NOT_EXIST` and no body in DF (legend names only); the tools refuse them |
| OPEN-74 | closed by the fit in §4.6; replace the CompuBox proxy when a count of head punches landed per bare-knuckle bout is published |
| OPEN-75 | blunt deflection off armour (2·Sw·IYw < A·Da): disputed on the wiki talk page and contradicts blunt-through-iron with the stated units |
| OPEN-80 | blocking skill: training should speed the block; the timing model uses untrained reaction and movement times |
| OPEN-82 | animals (§6.5): per-species fur, shape and summit metabolism; wet fur in rain; sweating capacity per sweating species; breath-hold and swimming endurance per species; cold-blooded creatures |
| OPEN-83 | thinking below 34.5 °C core; heat stroke time to death and its dependence on degree-minutes over 40 °C (Hancock & Vasmatzidis 2003 tie heat effects to deep body temperature but give no single curve; Pilcher et al. 2002: −14.9 % at WBGT ≥ 32.2 °C and −13.9 % at ≤ 10 °C air, by air not core); touch from skin temperature (Heus et al. 1995: 15 °C local hand skin as the minimum criterion) |
| OPEN-84 | short radiant exposures (transient skin heating; Stoll criterion); flames (convective heat); frostbite depth from time frozen; cold shock and swim failure in cold water; cooling in ice water about half the published rate; clothing wet in air (rain, sweat); head under water |
| OPEN-85 | altitude: acclimatization rule is a pace guideline turned into a model (no incidence by ascent rate), loss of acclimatization after descent, HAPE death time measured, death after hypoxic unconsciousness, effects on thinking, cold and air pressure in the heat model |
| OPEN-86 | venom: copperhead yield and LD50 (only "an estimated lethal dose around 100 mg" found); venom-yield allometry (isometric assumed); mechanical effects of DF symptoms other than paralysis; SEV dilution by body size (SIZE_DILUTES) |
| OPEN-88 | sound outdoors: ground and weather attenuation (ISO 9613-2 ground term), impulse temporal integration, species audiogram shapes per band; sight: contrast and camouflage, motion, species acuity, attention |
| OPEN-89 | social judgments: lie detection with evidence or suspicion; persuasion, compliance and fear/morale rates |
| OPEN-90 | BodyCheck `share`: replace the model's estimate with published success rates and times for common tasks (climbing, swimming distance, lock-picking, first aid outcomes, shooting accuracy by distance, driving) |
| OPEN-91 | wind and humidity of the day (WGEN and the WMO normals give rain, snow and temperature only); places outside the 1736 cities take the nearest one (§6.16) |
| OPEN-93 | battles: when a side breaks and flees; defender surprise; fortification effect separated from the force ratio |
| OPEN-92 | emotion intensity and decay (OCC variables affecting intensity have no published scales); the audit now flags a character stating or acting on a fact [KNOWS] gives only to others (§6.12) |
| OPEN-76 | penetration depth vs layer thickness: the DF wiki (DF2014:Weapon) states "Penetration is poorly understood"; no published reverse-engineering found. Layers are tested until momentum runs out |
| OPEN-65 | hearing: lowest thresholds found for 17 species and the bird median; 60-dB ranges for 34 (frogs and toads as the bullfrog, 100 Hz–2.5 kHz). Missing lowest thresholds: pig, goat, sheep, elephant, frogs (Heffner papers 1980–1990, abstracts give ranges only; full texts not reachable). Missing: hearing of DF creatures without a real counterpart (they hear as humans) |
| OPEN-77 | pain (`PAIN_RECEPTORS`): no measured mechanism found. Lier et al. 2021 (cold pressor): low pain leaves task accuracy unchanged, high pain lowers accuracy, reaction time unchanged; no effect size usable as a multiplier. Häske et al. 2024 (Sci Rep, n = 6365 emergency patients): severe pain 11.8 %, mean NRS 7.7 among them; gives how often pain is severe, not what it does |
| OPEN-81 | knockout and choke length: no published duration found (Wikipedia: a typical knockout is a loss of consciousness of three seconds or more; Hutchison 2014 gives 3.5 s from impact to referee stoppage, not time unconscious; the choke study above gives time to unconsciousness only) |
| OPEN-79 | closed by the fit in §4.7; replace when DF's formula for body-part attacks is published |
| OPEN-78 | closed: healing days scale by DF `HEALING_RATE`; tissue without it never heals |

## 11. Code

**Coverage map (Conceptual Dependency, Schank 1975).** Every action reduces to one of 11 primitive acts; each act has a tool, so an action with no tool is a gap, not a narrator's choice.

| Act | Meaning | Tool |
|---|---|---|
| PTRANS | move oneself or something somewhere | PassTime (walking), Chase |
| PROPEL | apply force | BodyStrike, BodyFall |
| MOVE | move a body part | BodyCheck |
| GRASP | hold | HoldOn |
| INGEST | take in | BodyIntake |
| EXPEL | push out of the body | Sickness (sea crossing, after surgery); Disease (food poisoning) |
| ATRANS | transfer possession | Transfer (record); SocialResponse, Choose, Look, HoldOn, BodyStrike, Price (whether and at what cost) |
| MTRANS | pass information | Communicate, RecordFact |
| MBUILD | work something out | WorkOut |
| ATTEND | perceive | Look, Listen |
| SPEAK | make sounds | Communicate |

**Names.** IF a tool names a character in other case or spacing than the record ("mara ") → THEN it is the recorded character. IF a name of 4 or more letters differs by one letter from a recorded one ("Mary" with Mara on record) and the call gives no species → THEN the call returns an error naming the recorded character, so a misspelling cannot split one body into two. A call that gives a species starts a separate character. Labels that differ only in a number (stranger 1, stranger 2) are separate characters.

**Working something out (WorkOut).** Share of university students solving within t seconds: a link between clues 0.565 (1 − e^(−t/13.4 s)), fitted exactly to 7.8 % at 2 s, 23.0 % at 7 s, 50.5 % at 30 s (Bowden & Jung-Beeman 2003, means over 144 problems, 289 participants); a riddle needing a new view 48.3 % at 4 min and a step-by-step problem 58.0 % at 4 min (Webb, Little & Cropper 2016, Table 1, mean of three experiments), on the same curve shape stretched ×8 so 4 min sits where 30 s does [ASSUMED]. The character's standing among students (a share band) shifts the log-odds by the band's odds [ASSUMED]; the body state applies through alertness.

**Sickness.** Sea crossing of 0.5–7 h: vomits 5.0 % male, 8.8 % female, 12.0 % under 15, 7.0 % unknown; of the rest, 24.4 % feel seasick without vomiting ((21.3 + 4.3 + 4.1 − 7.0) / 93.0, every vomiter counted as unwell [ASSUMED]) (Lawther & Griffin 1988, 20,029 passengers). After general anaesthesia, nausea or vomiting within 24 h with 0–4 risk factors (female, earlier motion sickness or PONV, non-smoker, opioids after): 10, 21, 39, 61, 79 % (Apfel et al. 1999).

**Evidence in lie judgement (OPEN-89 narrowed).** IF the listener holds evidence bearing on the statement → THEN kept until the speaker has told their story: 85.0 % of truths and 85.7 % of lies judged correctly; revealed early: 57.1 % and 55.0 % (Hartwig, Granhag, Strömwall & Kronkvist 2006, 82 interviewers; the late group was trained in the strategic use of evidence). Without evidence the base rates stay (Bond & DePaulo 2006).

**How long an emotion lasts (OPEN-92 narrowed).** Median hours to the first return to baseline (Verduyn & Lavrijsen 2015, 233 high-school students, 27 emotions, Fig. 1): each OCC type takes the nearest measured emotion [mapping ASSUMED] — distress 48 (sadness), hope 27, anger, pride and gratification 24, joy, happy-for and gratitude 6, fear, self-reproach and remorse 4 (anxiety, guilt), satisfaction 3 (contentment), fears-confirmed 2.3 (desperation), resentment and disappointment 2, sorry-for, appreciation and reproach 1.5, relief and disliking 0.8. The narrator gets it in words (fades within the hour; some hours; about a day; days), longer the more the event matters (event importance, the paper's strongest predictor). Intensity scales stay open.

**Fingertip holds (OPEN-90 narrowed).** IF only the fingertips hold (a ledge, a sill) → THEN grip × four-fingertip force over grip: non-climbers 309/440, recreational climbers 359/445, elite 447/526 N (Grant et al. 1996, 30 men).

**Cold and thinking (OPEN-83 narrowed).** WorkOut is a timed complex task, so a cooled core slows it; simple attention and recognition held after 2–4 °C of central cooling while working-memory and processing tasks fell, and cold water itself changed nothing (Giesbrecht et al. 1993).

**Papers read, not used yet.** Parlange & Katz 2000 (wind and dew point in the WGEN generator; parameters are fitted per station, so a world-wide use needs station data: OPEN-91 stays). Bohannon 1997 (comfortable and maximum walking speed by age and sex: walking, not running), Denny 2008 and Srinivasan 2009 (speed limits and optimal gaits; no sprint norms for untrained adults). Hånell & Rostami 2020 (a knockout ends "within a few minutes or less", no distribution): OPEN-81 stays.

**Human running speed (OPEN-90 narrowed).** Each human keeps one draw (runZ) from untrained adults of their sex: flying 20 m in 3.6 ± 0.4 s for 149 women and 2.9 ± 0.3 s for 84 men, mean age 43 (Manderoos 2020, University of Helsinki doctoral thesis, Study II, Table 4): 20.0 ± 2.2 and 24.8 ± 2.6 km/h, SD by the delta method, draws held within ±3 SD; sex unknown takes the mean of both. Other ages take the same values [ASSUMED]; training, load, terrain and acceleration stay open. Body fat: fat percentage and 20 m sprint time correlate r = 0.50 (23 male college soccer players, Ishida, Travis & Stone 2021, J Funct Morphol Kinesiol 6:7; 12 elite female sprinters over 5–10 years, partial r = 0.46–0.50, abstract supplied without authors); BMI stands for body fat [ASSUMED], so speed z = −0.5 × BMI z + √0.75 × the person's own draw whenever BMI z is known: drawn by BodySize, or from a build the story states (thin 17.5, average 22, overweight 27.5, obese 32.5 BMI, the middle of each WHO band) against the setting country's mean for that sex and year, else a mean of 24 [ASSUMED]. Simulated: an obese woman outruns a woman of average build in 21 % of races, against 49 % for two women of unknown build. Ding & Jiang 2020 (3,066 Chinese students: BMI against standing long jump r = −0.14 to −0.21 for men, 0.02 to −0.13 for women) and Sedeaud et al. 2014 (BMI of elite runners by event) were read; they measure jumping and elite athletes, not sprint speed in ordinary adults. Other creatures keep the DF gait speed. Simulated: a man catches a woman with a 10 m start in 93 % of chases.

**World book.** The world is real history with stated additions (principle of minimal departure, Ryan 1980; minimal-rewrite rule, Tetlock & Belkin 1996). It belongs to the character card (all its chats share it; a group chat keeps its own). Each entry: what, kind (creature, people, place, institution, technology, magic, event), since (a year, or always), where (worldwide or a continent, plus a narrower place), cause (one sentence), reaches (areas of life from a closed list of 9), reflections (3–7 facts everyone knows, each in a reached area), and for a creature or people: the DF creature its body is, speaks, active (day, night, any time), weakness (none, sunlight turns it to stone, fire). IF an area is not reached → THEN it is as in real history. IF an entry sets speaks for a DF creature → THEN Communicate follows it over the raws. [WORLD] goes to the question model and the narrator each turn; Claim's in_world is judged against real history plus [WORLD]. Entries start from one typed line (`/world-add`, or the panel's Fill): the model drafts the fields, the user edits and approves; the schema check (closed lists, a DF species, 3–7 reflections) runs before saving. Active and weakness are recorded and shown to the narrator; no code acts on them yet.

**Possessions.** IF an item changes hands, is found, made, lost or used up with nothing in doubt, or did so in the last reply → THEN Transfer records it and [HAS] shows it to the narrator and the question model. Whether it happens comes from the tool that governs how (agreement, theft seen or not, struggle, price). IF Claim decided something a character has → THEN that character is accounted: they give only what is on record. Anyone else is taken at the story's word (a baker has bread without a list of it). Items match singular or plural.

**How many closed lists.** Open language has no finite vocabulary (new words keep appearing as text grows: Heaps 1978), so no set of lists exhausts what a player writes. What is closed is the decision: 30 tools; 55 closed lists with 521 values, 62 numbers and 36 yes/no arguments; 79 text arguments, of which names, species (767 DF creatures), body parts, places and armour items are matched in code to closed lists, and the rest label a result without changing it. The one open decision is the BodyCheck catch-all, decided from 7 share bands. Process for adding a list: `/rules-stats` reports the share of outcomes decided by a specific rule and the catch-all tasks seen most often; IF a catch-all task recurs across chats → THEN it is the next specific rule (frequency of use is Zipf-like, so a few rules cover most turns). NetHack's model (a fixed command set as input, about 380 monsters, each interaction written by hand) is not copied: its input is already closed, this one is plain language. Its per-monster trait flags are kept, as the DF creature tokens.

**Standalone extension (branch `rules-standalone`).** The engine runs without Multihog. IF a generation starts (not quiet or impersonate) → THEN the question pass runs (not on continue), and one system message at depth 1 holds the brief, [TIME], [BODY], [KNOWS], [DECIDED] and the rule-check note. The question model also reads [CAST]: persona, card description and scenario, 1,500 characters each [ASSUMED]. The story clock belongs to the engine: `/rules-time` sets it, PassTime moves it; a calendar time counts minutes from 1 January of year 1, a day count from day 1 (below 146,097 days). Species, mass and languages come from tool arguments and stay on the engine's record of the character. RollTheDice (amount, table) is an engine tool: seeded per turn, repeated who + for returns the first result. The question pass and the rule check stream through Chat Completion (or a Connection Manager profile), so a gateway that closes silent connections keeps them open.

**Fork defaults (user-owned prompt).** IF a fresh install or the first load of this fork → THEN Custom Sysprompt Mode is on (Multihog never writes Quick Prompt Main), the rules engine is on, and a Main the framework already wrote goes back to the user's backup once. IF Custom Sysprompt Mode is on → THEN the first-turn footer reminder and the [RNG_QUEUE] dice list are not injected. The engine's rules reach the narrator only through per-turn injections ([KNOWS], [DECIDED], the brief, the rule-check note). IF the rules engine is on and choices are on → THEN each choice is the action alone; brackets hold only an item used up or a time skip, because a chance or difficulty written by the narrator is an outcome decided outside code. A chat's engine choice is stored under `rtRulesEngineFork`; choices saved before the fork are not carried over. IF the fork first loads → THEN the choice list (CYOA) is off: its block is injected last every turn, and its emoji and quip examples set the reply's tone over the user's prompt. Both narrator briefs state the speech rule of Communicate (only CAN_SPEAK or INTELLIGENT species say words). IF the rules engine is on → THEN tracker items carry no emoji and the line above TRACKER STATE is RULES_STATE_PREAMBLE (no slots, uses or charges).

The rules engine (`src/rules/`) is written in TypeScript, strict mode. SillyTavern loads JavaScript only, so each `.ts` file is compiled to the `.js` file beside it (`npm run build`, i.e. `tsc -p .`; `npm run typecheck` checks without writing). Both are committed: the `.js` files are what SillyTavern and the rest of the extension import, and are not edited by hand.

| File | Holds |
|---|---|
| `types.ts` | the per-character body state (`Person`: wounds, blood, needs, environment, altitude, venom, courses) and the chat's rule state (`RuleState`: people, facts, story clock, latitude) |
| `tool-schema.ts` | tool parameter schemas and `ArgsOf`, which derives each tool's argument type from the schema the model is given, so a tool's code and its schema cannot drift apart |
| `sillytavern.d.ts` | the parts of SillyTavern's extension context the engine uses |
| `df/raws.ts` | DF raw types: `Creature`, `Part`, `Layer`, `Tissue`, `Material`, gear and weapons |
| `src/state/dice-ledger.d.ts`, `src/features/journal-calendar.d.ts`, `state-manager.d.ts` | declarations for the JavaScript modules outside the engine that it imports |

Conversion check: the scratch simulations give the same numbers before and after (Atlanta January high 11.8 °C, British BMI mean 27.11, battle shares, all 22 emotion types reachable), and the 86 rules tests pass and fail exactly as before. Typing found three defects, fixed: Battle was missing from the list of tools unregistered when the engine is switched off; BodyTreat and CastSpell read a `species` argument their schemas do not offer.

Live check (SillyTavern 1.19.0, this branch installed as a third-party extension, a scripted OpenAI-compatible stand-in model, Chromium driven by Playwright): the extension loads without errors; with the engine switched on, the narrator request offers 29 tools and carries the rules brief and the [KNOWS] block; scripted BodyCheck, RecordFact and Battle calls run and return their results; RecordFact's fact appears in the next turn's [KNOWS] with its source ("Ann: The key is under the mat (saw it)"); the check pass runs after every reply with the turn's engine results and the [KNOWS] lines; state is snapshotted per chat position.

Foundations every tool shares:

| Layer | What it does |
|---|---|
| argument check (`tool-schema.ts`, `checkArgs`) | each call is checked against the schema the model was given before anything runs: required arguments present; numbers and true/false sent as text are read; an option matches ignoring case, by a band's words without its share ("half" → "50% half"), or as the start of exactly one option; unknown keys are dropped. A call with errors runs nothing and returns what to fix, listing the options |
| state versions (`rules-tools.ts`, `STATE_VERSION`) | rule state saved in a chat carries a version; older state, live and in every snapshot, is converted when the chat opens. Version 2: a character's weather place became a place key |
| scene setting (`RuleState.setting`) | the last place given to Weather or BodyEnvironment is kept with its country and latitude; Weather may leave place out, BodySize country, and Price, Battle and BodySize the year, which then comes from the calendar date in [TIME]. One value per scene replaces one guess per call |
| rule-check tally (`/rules-stats`) | replies the check pass read, those with outcomes no engine result backs, by tool and problem: the measure of how often the narrator still bends outcomes |

Closed lists as options: every argument whose values come from a fixed list is an enum, so a value outside it is refused and the options are shown: weapon (the 21 DF melee weapons), material of a weapon or ammunition (the 7 DF weapon metals, bone, wood), launcher, clothing ensemble (49) and garment (52), the body regions garments cover, skin touches or water reaches, and armour sub-locations. Free text stays where the values are open: names, the task, a fact, a message, the place (1736 cities, matched by name), species (DF creatures, matched by name), country and occupation (matched, with an error naming the problem). A list shown to the model holds at most 40 options in the question pass and 30 in an error message; the full list is in the tool schema.

