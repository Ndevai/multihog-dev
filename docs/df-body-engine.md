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
- Lowest thresholds (dB SPL): red fox −15 (Malkemper et al. 2015), human −10, whitetail deer −3, alpaca −0.5, fox squirrel 1, Japanese macaque 1 (for the rhesus macaque [ASSUMED genus]), budgerigar 1.1 (DF parakeet [ASSUMED]), chicken 2.6, mallard 12.5, African pygmy hedgehog 21 (DF hedgehog [ASSUMED family]), naked mole rat 35; birds without an audiogram 8.1, the median of 16 terrestrial species (Dooling 1980). Shift 0 for the rest (OPEN-65).
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
| others (neck, organs, ribs, spine, skull) | none: does not close / no timetable (OPEN-48, OPEN-58) |

Healing speed: DF `HEALING_RATE` ("lower is faster; omitting the token will result in a tissue that never heals", wiki Tissue definition token) scales the rule-576 days: a soft wound by its slowest damaged tissue ÷ 100, a fracture by its bone tissue ÷ 1000 (the human template values, so human days are unchanged) [RAW, WIKI]. Damage to a `FUNCTIONAL` tissue without `HEALING_RATE` (nerve, brain) loses the part's function for good: a cut spinal cord paralyses for good.

Infection: an infected wound closes 10.5 days later (surgical-site infections add 10–11 hospital days; StatPearls "Postoperative Wound Infections", Berríos-Torres et al. 2017; hospital stay as the proxy for healing [ASSUMED]). Its death risk (2–11 × in treated patients) stays open: the figures are for hospital care.

Clotting and further healing times: small-vessel bleeding stops on its own within 0–8 min (normal bleeding time: Ivy method under 5 min, "some texts extend the normal range to eight minutes"; encyclopedia.com "Bleeding Time"); a bruise (blunt wound without lost function) clears in 13 days (mild contusion, Jackson & Feagin classification via Orthobullets); rib fractures join at 42 days, complete at 84 (Guttentag & Salwen 1999, RadioGraphics: "at least 6 weeks", "complete healing … by 12 weeks"); nose fractures join at 28, complete at 42 (Wikipedia "Nasal fracture": stable 3–5 weeks, fused 4–8 weeks; midpoints). Punctures and bites use the cut rows [ASSUMED]; skull and other face fractures stay without a timetable.

Fracture kind: transverse [576 "blunt blow" row, also used for edged; ASSUMED]. Never-joins chance: LEG_LOWER uses the shin row; others 2 % [576].

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
| other DF venomous creatures | adder, copperhead, gila monster, platypus, giant cave spider, helmet snake, bees: no yield data (OPEN-86) | |

Scratch runs (70 kg, bitten on the shin, 150 untreated each): rattlesnake 19 dead (12.7 %), king cobra 47 (31 %), black mamba 131 (87 %), bushmaster 141 (94 %); antivenom at 20 min saved all. A 20 kg child: rattlesnake 98.5 %, because one threshold and a narrow yield spread make death depend steeply on body mass.

### 5.3 Bloodstream infection

| Step | Rule | Source |
|---|---|---|
| spread to the blood | each wound that becomes infected: 8.5 % | Taniguchi et al. 2022, Open Forum Infect Dis 9:ofac317: bacteraemia in 8.5 % of adults under 65 hospitalized with cellulitis, erysipelas or abscess (25.3 % at 65 and over) [hospitalized cases as the rate for infected wounds] |
| untreated | 80 % die, at a time drawn uniformly within 30 days [ASSUMED timing]; heavy exertion fails while it lasts | pre-antibiotic Staphylococcus aureus bacteraemia case fatality about 80 % (Wikipedia, Staphylococcus aureus) |
| antibiotics | BodyTreat `antibiotics`: case fatality 15–50 %, drawn uniformly | same: 15–50 % with antibiotic treatment |

Scratch run (300 people, uncleaned forearm cut, fed, 45 days): 41 infected, 5 with bloodstream infection, 5 dead.

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
| hypothermia II | 32–28 °C: drowsy, not shivering (status; check effects OPEN-83) | same |
| hypothermia III | 28–24 °C: unconscious | same |
| hypothermia IV | < 24 °C: no vital signs → dead | same; [ASSUMED dead without extracorporeal rewarming] |
| heat stroke | core > 40 °C: attention checks fail (disorientation is part of the definition) [ASSUMED]; below 40 °C no thinking effect: at 38.6 °C rectal, Stroop reaction was 39–44 ms faster (Barry et al. 2022, Appl Physiol Nutr Metab 47:261); 1 h at 39.6 °C air did not lower accuracy (Malcolm et al. 2018, Front Physiol 9:585) | Gaudio & Grissom 2016, J Emerg Med 50:607 |
| cold brain | below 36.7 °C core (animals: the same distance below their set point): mental tasks take 1 ÷ (1 − 0.5 × ΔT ÷ 2.2) as long, accuracy holds; new information kept 1 − 0.7 × ΔT ÷ 2.2; recall intact; ΔT capped at 2.2 (34.5 °C, the lowest measured) [ASSUMED linear, held below]. A check marked `timed` with `alertness` uses the speed as a capacity in the force model (spread 0.19 [ASSUMED]) | Coleshaw et al. 1983, J Appl Physiol 55:27 (core 34–35 °C: −70 % memory registration, −50 % calculation speed, accuracy and recall unchanged) |
| food energy | JOS-3 total metabolic heat each minute (basal, work, shivering, non-shivering) replaces the 1400/2400 kcal/day rows: sitting 96 kcal/h, sleeping 78, walking 246, nude at 0 °C shivering 338 | JOS-3; Compendium METs |
| water | (1.5 L/day − the model's own skin and breath loss at its neutral set point) + skin and breath loss this minute (sweat, diffusion, breath) | JOS-3; §6.3 |
| frostbite, covered or any segment | segment skin below the person's freezing temperature, drawn once from N(−6.3, 0.91) °C | Danielsson 1996, J Appl Physiol 81:2666: risk 5 % at −4.8 °C to 95 % at −7.8 °C skin |
| frostbite, bare face and hands | wind chill index ≤ −28 (JAG/TI 2001 formula, air ≤ 10 °C, wind ≥ 4.8 km/h): time to freeze −28 to −39: 10–30 min; −40 to −47: 5–10; −48 to −54: 2–5; ≤ −55: under 2; each person at a fixed uniform position in the range; the dose resets above −28 [ASSUMED] | Environment and Climate Change Canada categories (Coaching Association of Canada sheet); Wikipedia "Wind chill" formula |
| frostbite parts | head → nose, ears, cheeks; hand → fingers; foot → toes; other segments → their DF part | Wikipedia "Frostbite" (cheeks, ears, nose, fingers, toes) [ASSUMED mapping] |
| cold limbs | ΔT = set point − limb core node (forearms for arms, lower legs for legs; muscle temperature [ASSUMED]). Force abilities (grasp, stance) × (1 − 0.02 ΔT); block and dodge times ÷ (1 − 0.05 ΔT); motor nerve speed 49 − 2.2 ΔT m/s in reaction time | Bergh & Ekblom 1979, Acta Physiol Scand 107:33 (muscle 30–39 °C: isometric force −2 %/°C, power and speed −4 to −6 %/°C); Notermans et al. 1994, Muscle Nerve 17:516 (2.2 m/s per °C); linear beyond 30 °C [ASSUMED] |
| frostbite wound | superficial; closes in 7–21 days |
| swim failure | swimming, forearm cooled ≥ 1.78 °C below set point → can no longer swim; without flotation the head goes under | Ducharme & Lounsbury 2007, Appl Physiol Nutr Metab 32:799 (swim failure from arm muscle cooling; mean 47 min in 10–14 °C water); threshold fitted: JOS-3 forearm cooling at 47 min in 12 °C water, 6.0 MET (Compendium, swimming leisurely), 0.6 m/s |
| head under water | submerged, or swim failure or unconscious without flotation: breath held N(24.3, 11.4) s (≥ 5 s), then water is breathed in → unconscious, dead after 5 min (not-breathing rule); head out before then → breathing resumes, unconscious ("near-drowning") until time passes | Barwood et al. 2006, Aviat Space Environ Med 77:1136 (maximal breath-hold on immersion in 11 °C water, 32 subjects); the same hold in warmer water [ASSUMED] | partial-thickness burn row [ASSUMED proxy]; depth by duration OPEN-84 |

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

Limits (OPEN-82): one shape and one fur conductivity for all; the allometry is an average over climates (a temperate rat gets arctic-grade fur, LCT 22 °C against about 28–30 measured); no sun, water immersion or wet fur for animals; evaporation without limit (no heat stroke in animals).

### 6.6 Altitude

Set with BodyEnvironment `altitude_m` (and `sudden_ascent` for arrival within minutes); src/rules/thermal/altitude.js.

| Quantity | Rule | Source |
|---|---|---|
| air pressure | PB (Torr) = exp(6.63268 − 0.1112 h − 0.00149 h²), h in km: 760 at sea level, 547 at 2850 m, 444 at 4559 m, 253 at 8848 m | West 1996, J Appl Physiol 81:1850 (within 1 % at most high mountain sites) |
| heavy exertion | aerobic capacity 1 − 0.063 × (altitude − 300 m) ÷ 1000 m, a capacity in the force model for checks with `exertion: heavy` | Wehrlin & Hallén 2006, Eur J Appl Physiol 96:404 (VO2max −6.3 % per 1000 m, 300–2800 m; linear beyond [ASSUMED]) |
| acute mountain sickness | rolled once after 12 h (the first night) at a new altitude: 0 below 2500 m [ASSUMED], 9 % at 2850 m, 13 % at 3050, 34 % at 3650, 53 % at 4559, linear between, held above → heavy exertion fails [ASSUMED from "symptoms that force a reduction in activity"] | Maggiorini et al. 1990, BMJ 301:853 (466 climbers in Swiss Alps huts); Maggiorini et al. 1998 |
| cerebral oedema (HACE) | rolled with AMS: 1 % at 4000 m and above → heavy exertion fails; unconscious 1 h before death, dead 12–24 h after onset (uniform) unless the person descends below that altitude [ASSUMED descent criterion] | Adhikari & Zimmer 2026, BMJ (WMS 2024): HACE in up to 1 % at 4000–5000 m; untreated, coma and death within 12–24 h without descent |
| pulmonary oedema (HAPE) | rolled with AMS: 6 % at 4500 m and above → heavy exertion fails; status: up to half die without descent (timing OPEN-85) | same: HAPE in up to 6 % at 4500 m; untreated mortality up to 50 % |
| sudden arrival | above 18 000 ft (5486 m): unconscious ("hypoxia") once a time drawn uniformly from the FAA range runs out: 18 000 ft 20–30 min, 22 000 ft 10 min, 25 000 ft 3–5 min, 28 000 ft 2.5–3 min, 30 000 ft 1–2 min, 35 000 ft 30–60 s, 40 000 ft 15–20 s, 43 000 ft and above 9–12 s; linear in feet between rows; descending ends it | FAA AC 61-107B, Figure 2-3 (sitting quietly) |

Scratch runs (400 people each, after 13 h): AMS 0 % at 1500 m, 40 % at 3650 m, 53 % at 4559 m. A load-carrying task that 80 % pass at sea level: 68 % at 1500 m, 37 % at 3650 m, 22 % at 4559 m (before any sickness). Sudden arrival at 35 000 ft: unconscious in the first minute. 2000 people at 4600 m for 40 h: 20 HACE (1.0 %), 123 HAPE (6.2 %); every HACE case left there died, every one taken down within 2 h of onset lived.

### 6.7 Walking with a load

PassTime `walking` entries (speed, load, slope, terrain) set the walker's activity for the span: METs = Pandolf watts ÷ (1.163 W/kg × body kg). It drives food energy, and heat (JOS-3 or the animal model) when conditions are set; PassTime reports the distance covered.

| Quantity | Rule | Source |
|---|---|---|
| metabolic rate | M (W) = 1.5 W + 2.0 (W + L)(L ÷ W)² + η (W + L)(1.5 V² + 0.35 V G); W body kg, L load kg, V m/s, G grade %; downhill counted as level [ASSUMED] | Pandolf, Givoni & Goldman 1977, J Appl Physiol 43:577 (via Wikipedia "Pandolf equation") |
| terrain η | road 1.0, dirt road 1.1, light brush 1.2, heavy brush 1.5, swamp 1.8, loose sand 2.1, soft snow 15 cm 2.5, 25 cm 3.3, 35 cm 4.1 | Soule & Goldman 1972, J Appl Physiol 32:706 |

Examples (70 kg): road, no load, 5 km/h: 308 W, 3.8 MET (Compendium walking 3 mph: 3.5); dirt road, 20 kg, 5 km/h: 5.0 MET; 30 kg up a 10 % slope at 4 km/h: 9.5 MET; 20 kg in 25 cm snow at 4 km/h: 8.2 MET.

Open (OPEN-87): how long a pace can be kept (fatigue, exhaustion), downhill cost (Santee et al. 2001 model; equation not reachable), running.

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
| OPEN-82 | animals (§6.5): per-species fur, shape and summit metabolism; sun, water and wet fur; limited evaporation and heat stroke; cold-blooded creatures |
| OPEN-83 | thinking below 34.5 °C core; heat stroke course and death (Hancock & Vasmatzidis 2003 tie heat effects to deep body temperature but give no single curve; Pilcher et al. 2002: −14.9 % at WBGT ≥ 32.2 °C and −13.9 % at ≤ 10 °C air, by air not core); touch and fine finger work from skin temperature (Heus et al. 1995: 15 °C local hand skin as the minimum criterion) |
| OPEN-84 | frostbite depth from time frozen; cold shock and swim failure in cold water; cooling in ice water about half the published rate; clothing wet in air (rain, sweat); head under water |
| OPEN-85 | altitude: acclimatization over days and ascent rate (WMS 2024 risk groups have no incidence numbers), HAPE timing, death after hypoxic unconsciousness, effects on thinking, cold and air pressure in the heat model |
| OPEN-86 | venom (§5.2 built for four snakes). DF injects venom (SPECIALATTACK_INJECT_EXTRACT) for adder, rattlesnake, copperhead, king cobra, black mamba, bushmaster, gila monster, platypus, giant cave spider, helmet snake, bees; its syndrome severities and tick timings are game values. Planned system: dose ratio = venom per bite ÷ (mouse subcutaneous LD50 × victim mass) → death by a dose–response curve. Found (Wikipedia, citing primary sources): western diamondback 250–350 mg/bite, SC LD50 18.5 mg/kg, untreated mortality 10–20 %; king cobra up to 420 mg, SC 1.5–1.7 mg/kg, death in as little as 30 min; bushmaster 200–411 mg, SC 6.0 mg/kg (a child died 90 min after a bite); black mamba 100–120 mg (max 400), IV 0.32 mg/kg only, collapse within 45 min; adder SC 6.45 mg/kg, yield low; gila monster one confirmed death since 1930. Missing: a published slope for the human dose–response, untreated mortality for most species, mouse-to-human sensitivity |
| OPEN-76 | penetration depth vs layer thickness: the DF wiki (DF2014:Weapon) states "Penetration is poorly understood"; no published reverse-engineering found. Layers are tested until momentum runs out |
| OPEN-65 | hearing: lowest thresholds found for 12 species and the bird median; 60-dB ranges for 30. Missing lowest thresholds: dog, cat, horse, cattle, pig, goat, sheep, elephant (Heffner papers 1980–1990, abstracts give ranges only; full texts not reachable). Missing: hearing of DF creatures without a real counterpart (they hear as humans) |
| OPEN-77 | pain (`PAIN_RECEPTORS`): no measured mechanism found. Lier et al. 2021 (cold pressor): low pain leaves task accuracy unchanged, high pain lowers accuracy, reaction time unchanged; no effect size usable as a multiplier. Häske et al. 2024 (Sci Rep, n = 6365 emergency patients): severe pain 11.8 %, mean NRS 7.7 among them; gives how often pain is severe, not what it does |
| OPEN-81 | knockout and choke length: no published duration found (Wikipedia: a typical knockout is a loss of consciousness of three seconds or more; Hutchison 2014 gives 3.5 s from impact to referee stoppage, not time unconscious; the choke study above gives time to unconsciousness only) |
| OPEN-79 | closed by the fit in §4.7; replace when DF's formula for body-part attacks is published |
| OPEN-78 | closed: healing days scale by DF `HEALING_RATE`; tissue without it never heals |
