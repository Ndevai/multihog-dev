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
8. Not resolved (no parts): CHIMERA, CENTAUR, GRIFFON (OPEN-73).

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

Clotting and further healing times: small-vessel bleeding stops on its own within 0–8 min (normal bleeding time: Ivy method under 5 min, "some texts extend the normal range to eight minutes"; encyclopedia.com "Bleeding Time"); a bruise (blunt wound without lost function) clears in 13 days (mild contusion, Jackson & Feagin classification via Orthobullets); rib fractures join at 42 days, complete at 84 (Guttentag & Salwen 1999, RadioGraphics: "at least 6 weeks", "complete healing … by 12 weeks"); nose fractures join at 28, complete at 42 (Wikipedia "Nasal fracture": stable 3–5 weeks, fused 4–8 weeks; midpoints). Punctures and bites use the cut rows [ASSUMED]; skull and other face fractures stay without a timetable.

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

### 6.1 Unconsciousness

| Cause | Rule | Label |
|---|---|---|
| knockout | a blow to a part with flag `HEAD` that reaches the head's tissue as blunt (after armour) with momentum ≥ 158.0 | fit below |
| knockout ends | when story time passes (PassTime) | [ASSUMED] OPEN-81 |
| not breathing | every `BREATHE` part stops working (creatures without `NOBREATHE`) → unconscious at once; death after 5 min | Merck Manual Professional, Respiratory Arrest (2026): patients "are either unconscious or will soon lose consciousness"; "death is almost certain if more than five minutes" (Wikipedia, citing Merck) |
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

## 7. Tools

| Tool | Change |
|---|---|
| all | species and mass on first appearance: the tool arguments, else the State Tracker profile (`Name (N kg)` header and its `Species:` line), else human at the species' adult mass |
| all (argument) | `species`: DF creature id or name ("HUMAN", "wolf", "giant wolf"); used when the character first appears; default human |
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
| OPEN-73 | CHIMERA, CENTAUR, GRIFFON bodies do not resolve |
| OPEN-74 | closed by the fit in §4.6; replace the CompuBox proxy when a count of head punches landed per bare-knuckle bout is published |
| OPEN-75 | blunt deflection off armour (2·Sw·IYw < A·Da): disputed on the wiki talk page and contradicts blunt-through-iron with the stated units |
| OPEN-80 | blocking skill: training should speed the block; the timing model uses untrained reaction and movement times |
| OPEN-76 | penetration depth vs layer thickness |
| OPEN-77 | pain (`PAIN_RECEPTORS`): no measured mechanism found |
| OPEN-81 | knockout length: no published duration found (Wikipedia: a typical knockout is a loss of consciousness of three seconds or more) |
| OPEN-79 | closed by the fit in §4.7; replace when DF's formula for body-part attacks is published |
| OPEN-78 | closed: healing days scale by DF `HEALING_RATE`; tissue without it never heals |
