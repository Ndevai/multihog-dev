# Species engine — specification

Result: the body engine reads every body value from a species record. Laws (formulas) stay in the engine; numbers move into records. With only the human record loaded, every tool returns the same text as today, except one addition (§6, pinned bones).

## 1. Terms

| Term | Meaning |
|---|---|
| record | a JS object in `src/rules/species/<id>.js` holding one species' numbers (§2) |
| person | the engine's state for one character: `{ species, mass, lost, red, wounds, nextId, dead, deathIn, deathMode, minute, net }` |
| part | a key of `record.parts`; a part with `count: 2` exists as `<part>_l` and `<part>_r` |
| missing | a field that is absent or `null` in the record |
| off | the effect that reads a missing field does not happen (rule-file OPEN convention) |

## 2. Record fields

Every field, its unit, the engine function that reads it, and the behaviour when missing.

| Field | Unit | Read by | Missing → |
|---|---|---|---|
| `id`, `label` | text | `person`, `status` | required |
| `mass_kg` | kg | `person` (default mass) | required |
| `parts.<p>.count` | 1 or 2 | part list, `abilities` | 1 |
| `parts.<p>.scores.<function>` | share | `abilities` | function absent for the species |
| `parts.<p>.bone` | key of `bones` | `strike` (pinned) | pinned break off for the part |
| `bones.<b>.failure_moment_Nm`, `bones.<b>.length_m` | N·m, m | `strike` (pinned) | pinned break off |
| `fluid.label` | text | `status` | "fluid" |
| `fluid.mL_per_kg` | mL/kg | volume | bleeding effects off |
| `fluid.lethal_mL_per_kg` | mL/kg | `advance` | death by total loss off |
| `fluid.classes[]` `{ from, name, fails, dies_in_min }` | fraction lost, text, task list or `"all"`, `{ bleeding: [min,max], stopped }` | `bloodClass`, `checkOdds`, `advance` | no classes: checks ignore fluid loss; timed death off |
| `fluid.refill_fraction`, `fluid.refill_days` | fraction of volume, days | `advance` | refill off |
| `fluid.cells_mL`, `fluid.cells_days` | mL, days | `advance`, `status` | cell deficit off |
| `fluid.vessels.<class>` | [min, max] mL/min | `addWound` | that class bleeds 0 |
| `fluid.blade_limb_artery` | chance | `strike` | 0 |
| `heal.cut.<part>`, `heal.burn.<depth>` | [min, max] days | `addWound` | the wound does not close |
| `heal.fracture.<kind>` | [joins, full] days | `addWound` | joins = null (never counted down) |
| `heal.nonunion.<bone or default>` | chance | `addWound` | 0 |
| `heal.crooked_grip`, `heal.load_crooked` | fraction, chance | `woundPenalty`, `treat` | 0 |
| `infection.onset_days.<bite or other>` | days | `advance` | infection off |
| `infection.chance` `{ bite: [early, late], other: [early, late], open_grade: {...} }` | chance | `advance` | infection off |
| `falls[]` `[height_m, death_chance]` | m, chance | `fallDeathChance` | falls kill nobody |
| `strike.reach_m` | m | `impactTime` | the attack lands without the timing check |
| `strike.time_s.<means>` | [mean, sd] s | `impactTime` | attack lands without timing |
| `strike.force_N.<means>.<skill>` | N | `strikeForce` | force unknown: blunt → bruise, text says "force unknown" |
| `strike.force_cv.<means>` | fraction | `strikeForce` | 0 |
| `strike.means[]` | list | tool enum | only the means listed can be chosen for this attacker |
| `senses.sight_s`, `senses.hearing_s` | s | `defenceDone` | that sense gives no warning |
| `senses.hear_db`, `senses.wake_db`, `senses.wake_s`, `senses.inertia` | dB, dB, [min, max] s, fraction | `defenceDone` | hearing / waking off |
| `mind.decide_s` | s | `defenceDone` | cannot defend |
| `nerve.mps`, `nerve.synapse_s` | m/s, s | `defenceDone` | cannot defend |
| `move_s` | s | `defenceDone` | cannot defend |
| `capacity_cv` | fraction | `checkOdds` | body scales checks only at score 0 |
| `scaling.ref_mass_kg`, `scaling.length`, `scaling.time`, `scaling.force` | kg, exponents | size scaling | record values used without scaling |

## 3. Human record

Each value is today's engine constant, moved unchanged.

| Field | Value | Today's constant |
|---|---|---|
| `mass_kg` | 70 | `newPerson` default |
| `parts` | head, eyes, mouth, torso (count 1); arm, hand, leg, foot (count 2) with today's shares; arm.bone = humerus, leg.bone = femur | `PART_SCORES`, `PAIRED` |
| `bones.humerus` | 230 N·m, 0.31 m | new (§6) |
| `bones.femur` | 395 N·m, 0.448 m | new (§6) |
| `fluid` | label "blood", 70 mL/kg, lethal 50 mL/kg; classes I 0, II 0.15 fails heavy, III 0.30 fails heavy + on_feet, IV 0.40 fails all, dies 30–60 min bleeding / 120 min stopped; refill 0.4 in 1.5 days; cells 500 mL per 35 days; vessels femoral 300–600, limb_artery 70–170, small 1–10; blade_limb_artery 0.12 | `bloodVolume`, `LETHAL_LOSS_ML_KG`, `bloodClass`, `advance`, `BLEED`, `BLADE_LIMB_ARTERY`, `EXERTION_FAILS_AT` |
| `heal` | cuts, burns, fractures 21/42 … 84/168, nonunion 0.02 / shin 0.05 / wrist 0.125, crooked_grip 0.51, load_crooked 0.325 | `CUT_HEAL`, `BURN_HEAL`, `FRACTURE`, `NONUNION`, `CROOKED_GRIP`, `treat` |
| `infection` | onset bite 1 / other 10 days; chances bite 0.05 / 0.22, other 0.03 / 0.15, open grades I 0.05 … IIIC 0.40 | `INFECTION_ONSET`, `infectionChance`, `OPEN_FRACTURE_INFECTION` |
| `falls` | [6, 0], [12, 0.44], [15.6, 0.56], [19.2, 0.78] | `FALL_ROWS` |
| `strike` | reach 0.88 m; times fist/blade 0.357 ± 0.178, kick 0.477 ± 0.203; forces fist 2381 / 3722 / 4800, kick = elite kick × fist ratio as today; cv fist 0.237, kick 0.140; means fist, kick, blade_cut, blade_stab | `REACH_M`, `STRIKE_S`, `FIST`, `KICK_ELITE`, `FIST_CV`, `KICK_CV` |
| `senses`, `mind`, `nerve`, `move_s` | sight 0.056, hearing 0.0109, hear 25 dB, wake 55 dB in 1.59–21 s, inertia 0.79; decide 0.2037; 49 m/s, synapse 0.0007; move 0.242 | `SENSE_S`, `HEAR_DB`, `WAKE_*`, `INERTIA_SPEED`, `DECIDE_S`, `NERVE_MPS`, `SYNAPSE_S`, `MOVE_S` |
| `capacity_cv` | 0.19 | `CAPACITY_CV` |
| `scaling` | 70 kg; length 1/3, time 0.15, force 2/3 | `REF_MASS`, `EXP_LENGTH`, `EXP_MOVE` |

Magic (`net`, `cast`) stays in the engine unchanged; it belongs to the caster, not the species.

## 4. Engine changes

- `newPerson(mass, species = 'human')` stores `species`; `person(state, who, mass, species)` sets it on first appearance only.
- `rec(p)` = the record of `p.species`; an unknown id falls back to no record (every effect off, status says "unknown species").
- Every constant in §3 is read as `rec(p).<field>`; formulas are unchanged.
- `bloodClass(p)` returns the index of the last class with `from ≤ fraction lost`; `checkOdds` fails a task when that class's `fails` contains the task's exertion, `on_feet`, or `"all"`.
- Attacker values (reach, time, force) come from the attacker's record; defender values (senses, decision, nerve, move, parts) from the target's record. An attacker passed only as mass uses the human record scaled by mass (today's behaviour).

## 5. Tools

- BodyStrike, BodyWound, BodyCheck, BodyFall, BodyTreat, BodyStatus gain `species` (text, record id; used on the character's first appearance). BodyStrike gains `attacker_species` and `pinned` (boolean).
- BodyStrike `means` enum = union of all loaded records' `strike.means`; a means missing from the attacker's record → "<means> is not an attack of <species>." Nothing recorded.
- Output strings are today's, with the fluid label from the record ("blood lost 0.4 L" for humans).

## 6. Pinned bones (new)

- IF `pinned` AND the part has a bone AND force is known → moment = force × length ÷ 4. IF moment ≥ failure moment → transverse fracture of that part; ELSE bruise.
- Free blows stay as today: bruise only (OPEN-60).
- Human example: elite kick, 6400 N, pinned thigh → 6400 × 0.448 ÷ 4 = 717 N·m ≥ 395 → fracture. Untrained punch, 2381 N, pinned arm → 2381 × 0.31 ÷ 4 = 185 N·m < 230 → bruise.

## 7. Tracker and prompts

- Profile header becomes `Name (species, N kg)`, e.g. `Ara (human, 58 kg)`; the sheet anchor accepts both forms.
- Narrator brief adds: "A creature's first rule-tool call names its species (the record id)."
- Status lines name the fluid by its label.

## 8. Files

- New: `src/rules/species/index.js` (registry: `getSpecies(id)`, `speciesIds()`), `src/rules/species/human.js`.
- Changed: `src/rules/body-engine.js` (constants → record reads), `src/rules/rules-tools.js` (parameters, enum), `src/rules/rules-mode.js` (header format, brief line), `renderer.js` (anchor with species).

## 9. Worked examples (fix the behaviour)

| Input | Output |
|---|---|
| any call with species human or no species | identical to today's output |
| BodyStatus of a person with species "wolf" and no wolf record | "Name: unknown species wolf." |
| BodyStrike means "bite", attacker_species "human" | "bite is not an attack of human. Nothing recorded." |
| BodyStrike pinned, kick elite 6400 N, part leg_l, human target | "kick to leg_l: 6400 N, pinned: 717 N·m vs 395 N·m → fracture. Wound n." (force varies by its spread) |

## 10. After this step

Each further species is one record file with sourced values; fields without a source stay missing and their effects stay off. Candidates for Earth play: dog/wolf, horse, bear, boar, snake. Each record's sources go in `docs/species-sources.md`.
