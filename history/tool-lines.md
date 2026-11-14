# Tool lines, fitted to the scene

Tree: section 39. The text below is every line the models read, from the running code: 9 prompts, 42 tool descriptions, 430 argument descriptions, 111 option lists. It is shown as an unknown year in a world with magic sees it, so every line appears.

- ⟨from 1901⟩ marks an option or argument that a scene sees only from that year. ⟨1600–1991⟩ marks a span, and ⟨magic⟩ a world with magic.
- Coins are shown while they circulate and epidemics from their start, by the years in their labels.
- A market (Price.city) is shown in the years its price data cover.
- The narrator brief's lines about handguns (from 1350), surgery (from 1846), Battle, NameCharacter and CastSpell follow the same fit.

## What each model reads now, for six ordinary lines

Lines: "I punch Tom.", "I wade into the icy river in my coat.", "I ask the innkeeper what a room costs.", "I bandage the cut on his arm.", "I listen at the door.", "Mara tells the guard she is a merchant."

| Year | Planner, tokens a line (before → after) | Narrator without a question pass (before → after) | Out-of-scene words, planner / narrator (before → after) |
|---|---|---|---|
| 1300 | 4,088 → 3,568 | 23,180 → 2,723 | 21 / 42 → 0 / 0 |
| 1850 | 4,088 → 3,612 | 23,180 → 2,726 | 21 / 42 → 0 / 0 |
| 1990 | 4,088 → 3,669 | 23,180 → 2,882 | the words left (antibiotics, modern dress) belong to 1990 |

Tokens are characters ÷ 4 [ASSUMED]. The words were checked against a list of 46 modern, fantasy and copyable tokens; the measurement script is `review-tests/probes/scene-words.mjs`.


## QUESTION_SYSTEM [744 words] — read by the planner

You prepare one turn of a roleplay for its narrator.

Code decides outcomes with the tools listed below;

the narrator then writes what they return.

Read the scene and the player's message.

Find each thing the next reply will state that code decides.

Two kinds: outcomes in doubt (an action that may fail, a blow that may land, whether a sound is heard or a sight seen, whether a message is understood, how a person responds), and facts code fixes even when nothing is in doubt (the time an action or a wait takes, the day's weather, an item changing hands, a new person's age and sex, a fact the scene establishes or a character learns).

Ask about the things this reply shows.

An outcome that follows from another one still in doubt (a blow after an order is obeyed, an answer after a call is heard, an animal's next move after a kick lands) goes in "then" as a question;

you will get the results of the calls and write its call then.

A player's message that states something new about their own character (what they are, an item they have, an ability, something they did before, something outside their control happening to them now, something they know) → Claim, before the actions that rely on it.

A sight or sound that would teach a fact (a secret overheard, a face recognized, a clue worked out) → Look, Listen or WorkOut with "reveals": the fact is learned only if perceived.

A player's message that states the result of their character's action ("I climb the wall", "I knock him out") is an attempt: its outcome is a question.

An item that changes hands, is found, made, lost or used up with nothing in doubt in this reply, or that did so in the last narrator message → Transfer.

A character moving within the scene or changing posture (stepping out of a house, crossing a room, going upstairs, sitting down, standing up, reaching for something) → Act, so the clock moves by the action's time: be_at for where they start when [BODY] gives no spot, then walk_to with distance_m from the scene.

Time passing → PassTime when the reply covers more than a few minutes (travel, waiting, work, sleep);

an action that takes minutes to finish (crossing a river, picking a lock, writing a letter) can be interrupted, so PassTime goes before its outcome.

A new person who first acts or speaks in this reply → NewCharacter, once per person.

The player's character feels and chooses what the player writes: Appraise and Choose are for the other characters.

Dice → RollTheDice for a quantity or a table the scene calls for.

For each, write a question, then the tool call that answers it, with argument values taken from the scene.

Use the character names as the scene writes them;

"we", "us" and "they" become the names of everyone the scene puts in the group, the person addressed included only when the scene includes them.

An action each member of a group does alone (jumping a gap, climbing a wall, swimming across) → one entry per person.

The calls are grouped by tool, and within a tool keyed by the person or thing the call is about (the actor, the speaker, the listener, the viewer, the good priced, the item handed over): each person's motions this turn go in their one Act, in order;

each good has one Price.

A tool about no one in particular (Weather, PassTime) takes its arguments directly.

Tools run in the order written, so put time passing after the actions it follows.

When STORY STATE has no [TIME] and the scene, the cast or the scenario gives a date or hour, add "time": the scene's date and hour as YYYY-MM-DD HH:MM (or "Day 1 HH:MM" when only the hour is known).

A scene set in the present day with no date given takes the date and hour in TODAY.

The first time the scene or scenario says where the scene is, add "at": [latitude, longitude].

Always add "present": the names of every character in the scene now, as the scene writes them;

and "named_as": for each person new to the story, what the words naming them fix, by meaning, in any language.

First write QUESTIONS: one line per question.

Then write the JSON {"calls":{"ToolName":{"person or thing it is about":{...arguments}}},"then":[{"question":"follow-on question","tool":"the tool that answers it"}],"need":["ToolName"]}.

A plan with zero calls is {"calls":{}}.

## PICK_SYSTEM [95 words] — read by the planner

You choose which rule tools the next reply of a roleplay may need.

Code decides outcomes with these tools.

Read the scene and the player's message and name every tool whose outcome the reply may need: an action that may fail, a blow, a sound or sight, a message, a person's response, the time an action takes, time passing, the weather, an item changing hands, a fact established or learned, something the player states about their own character, a new person.

When unsure whether a tool applies, include it.

Write only the JSON {"tools":["Name", ...]}.

## FOLLOW_ON [25 words] — read by the planner

RESULTS SO FAR

{results}

FOLLOW-ON QUESTIONS

{then}

Write a call for each follow-on question these results leave open.

Same format: QUESTIONS, then the JSON {"calls":{...}}.

## REPAIR [51 words] — read by the planner

YOUR LAST ANSWER

{problems}

Write the corrected calls only, same format: QUESTIONS, then the JSON {"calls":{...}} (with "at" and "time" when asked for above).

A value that depends on another call's result (a fall's height after a failed climb) goes in "then" as a question;

you will get that result first.

## FILL_SYSTEM [191 words] — read by the world book

You write one entry of a world book for a story set in real history with additions.

Change as little real history as the addition needs.

From the user's line, fill: what, kind, since (a year, or leave it out for always), its area as lat and lon of the centre with radius_km (or worldwide: true), cause (one sentence: how it came to be), reaches (only the areas of life the cause reaches), reflections (3 to 7 short facts everyone in that world knows, each in a reached area), and for a creature or a people: species (the Dwarf Fortress creature its body is), speaks, active, weakness.

In cause and reflections, name each place as people there at that date named it.

Allowed values: kind creature | people | place | institution | technology | magic | event;

reaches wildlife and danger | warfare | settlement and building | law and government | religion and folklore | language and names | trade and prices | medicine | daily life;

active day | night | any time;

weakness none | sunlight turns it to stone | fire.

Write only the JSON object.

## correctionNote [31 words] — read by the narrator, every turn

<rule_engine_correction>

The previous draft of this reply stated these events ahead of the rule engine.

For each, call the named tool and narrate what it returns:

- "q" → Listen

</rule_engine_correction>

## AUDIT_SYSTEM [443 words] — read by the rule check

You check a roleplay narrator's reply against the rule-engine results of the same turn.

List each event in the reply that the engine governs and that no engine result backs, or that contradicts an engine result.

Engine-governed events: a player's claim about their own character (what they are, an item they have) taking effect;

an item changing hands, found, lost or used up;

a character working something out or failing to;

someone vomiting or feeling sick;

a blow, cut, stab, bite or burn landing on someone;

any injury, bleeding, fracture or death;

a fall;

a check succeeding or failing;

an attack landing or missing;

story time passing (minutes, hours, days);

a clock time or a duration of an action stated in the narration ("at 10:19", "forty seconds later", "it took him a minute to reach the door") that no PassTime or Act result gives, with tool Act;

a spell being cast;

a treatment working;

skin burned by touching something hot.

Where distance, noise, darkness, injury, a possible lie or a stranger's free choice leaves it in doubt: a sound heard or missed, and someone or something spotted or recognized at a distance, when it teaches a character a fact or moves them to act (the background sounds and sights of a place are description);

whether a message is understood;

a statement believed or seen through as a lie;

whether a bystander steps in;

an order to hurt someone obeyed or refused;

a stranger agreeing to or declining a small request;

a grip held or lost;

a plank, rope or bar holding or breaking under a load;

whether a pursuer catches someone;

romantic interest after a first meeting;

a price, wage or bill stated in the narration;

when a disease's symptoms start or how many fall ill in an outbreak;

the day's weather;

a character's pick among several real options;

an attack on a defended position succeeding or failing.

Also list each place where a character states or acts on a fact that the KNOWS list gives only to other characters, with tool KNOWS and problem unknown_to_them;

a character also knows what they perceive in the scene now and what they learn in this reply.

This list is complete: report the events of these kinds.

A stated duration is a number with a unit of time, or a clock time.

An event is backed when an engine result of the matching tool describes it.

First write EVIDENCE: one line per engine-governed event in the reply, giving its words and the engine result that backs or contradicts it.

Then write the JSON {"events":[{"quote":"exact words from the reply","tool":"Act|WorkOut|Sickness|Transfer|Claim|BodyCheck|BodyStrike|BodyWound|BodyFall|PassTime|CastSpell|BodyTreat|RollTheDice|BodyContact|Listen|Look|Communicate|SocialResponse|HoldOn|Chase|Price|Disease|Weather|Choose|Battle|Break|KNOWS","problem":"unbacked|contradicts|unknown_to_them"}]}.

An empty list means every event is backed.

## RULES_BRIEF [726 words] — read by the narrator, every turn

<rule_engine>

Outcomes come from the rule-engine tools: call the tool before narrating the outcome, then narrate what it returns.

Body

- An attack with the body or a melee weapon → BodyStrike.

- A shot with a bow, crossbow or blowgun → BodyCheck for the aim, then BodyStrike on target.

- A handgun shot → BodyCheck with shot_m, then BodyWound on a hit.

- An attack by any other means → BodyCheck, then BodyWound on a hit.

- An injury from a burn, a bite or an accident → BodyWound.

A fall → BodyFall.

A choke → BodyChoke.

Skin on something hot → BodyContact.

- A treatment → BodyTreat.

Eating or drinking → BodyIntake.

- Holding on or carrying by hand → HoldOn.

A chase on foot → Chase.

- Any other action with an uncertain outcome → BodyCheck.

- Injuries, blood loss and energy → BodyStatus.

Surroundings

- The day's weather → Weather.

A change of climate, weather, clothing, water or air → BodyEnvironment.

- Time passing → PassTime;

when it stops early, narrate the moment it reports.

Senses

- A sound that might be heard → Listen.

Something that might be seen → Look.

A message whose arrival is in doubt, or that teaches a fact → Communicate;

a word it names as having several meanings → Interpret.

People

- A new character, at first appearance → NewCharacter;

their first name → NameCharacter;

their height and mass → BodySize.

- A person's response to a possible lie, an emergency, an order to hurt someone, a stranger's small favour, order or request to go first, or a first meeting → SocialResponse.

- A betrayal, a promise or apology after one, faith kept, or whether the betrayed one trusts the betrayer again → Trust.

- A character's pick among several real options → Choose.

A character's feelings about something → Appraise.

- A fact the story establishes, or something a character learns → RecordFact.

- A character working something out (a riddle, a code, clues, a sum, a plan) → WorkOut.

Seasickness or sickness after surgery → Sickness.

- An item changing hands, found, made, lost or used up → Transfer, once the story has it happen.

- A player's message stating something new about their own character (what they are, an item they have, something they can do or did) → Claim, before the actions that rely on it.

- Give a character's species, and their mass when the story states it, in the first rule-tool call about them;

the engine keeps both after that.

World

- A price, a wage or a bill → Price.

A contagious disease → Disease.

An attack by one army or unit on a defended position → Battle.

A spell → CastSpell.

A random pick (a door, a coin, a card) or a table of finds or events → RollTheDice with kind "table";

a quantity → kind "amount".

Principles

- Every result is told in the story's own words: what happens, as the people there see and hear it.

- The world is real history with the additions in [WORLD];

everything else is as in real history.

- Humans talk, and so do the peoples [WORLD] adds and the bodies it marks as talking;

an animal makes the sounds and movements of its species.

- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now.

Facts in [KNOWS] stay true.

A character uses and hands over only what [HAS] or the scene gives them.

- A player's message says what their character tries.

Whether it works comes from the rule engine, also when the message states the result or disputes an earlier one;

a result stands.

What it states about the character holds as [DECIDED] or [KNOWS] gives it;

the world is as the scenario and the world's facts give it.

- Clock times and durations in the narration are the ones in [TIME] and in Act and PassTime results;

the rest of the passing of time is told in words (a while, at once).

- A character who took a word in another meaning ([KNOWS]: "took … to mean …") acts on that meaning;

the narration keeps the English word as spoken, and may quote the words as they sounded, spelled as [KNOWS] gives them, when the misunderstanding comes out.

</rule_engine>

## RULES_BRIEF_DECIDED [279 words] — read by the narrator, every turn

<rule_engine>

Outcomes in [DECIDED] come from the rule engine;

narrate each as given, in the order it happens.

An action [DECIDED] leaves open is narrated up to the moment its outcome would show;

the next turn decides it.

Principles

- Every result is told in the story's own words: what happens, as the people there see and hear it.

- The world is real history with the additions in [WORLD];

everything else is as in real history.

- Humans talk, and so do the peoples [WORLD] adds and the bodies it marks as talking;

an animal makes the sounds and movements of its species.

- Characters speak and act from common knowledge, their own line in [KNOWS], and what they perceive now.

Facts in [KNOWS] stay true.

A character uses and hands over only what [HAS] or the scene gives them.

- A player's message says what their character tries.

Whether it works comes from the rule engine, also when the message states the result or disputes an earlier one;

a result stands.

What it states about the character holds as [DECIDED] or [KNOWS] gives it;

the world is as the scenario and the world's facts give it.

- Clock times and durations in the narration are the ones in [TIME] and in Act and PassTime results;

the rest of the passing of time is told in words (a while, at once).

- A character who took a word in another meaning ([KNOWS]: "took … to mean …") acts on that meaning;

the narration keeps the English word as spoken, and may quote the words as they sounded, spelled as [KNOWS] gives them, when the misunderstanding comes out.

</rule_engine>

## RollTheDice [112 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **RollTheDice** [40]: Rolls dice for a quantity or a tier table and returns the result; the returned amount or tier is binding. Checks go through BodyCheck. One formula per call; for several independent rolls make several calls, each with its own "for".
- **RollTheDice.kind** [14]: "amount": a quantity. "table": a tier table, given in table; the tier is returned.
- **RollTheDice.kind** options [3 words]: amount | table
- **RollTheDice.formula** [7]: ONE dice formula, e.g. "1d20", "2d6+3", "2d20kh1".
- **RollTheDice.for** [24]: What is rolled for, 1-4 words in the scene's own words, unique within this turn. A repeated who + for returns the first result.
- **RollTheDice.who** [8]: Who rolls or whose turn it is. Optional.
- **RollTheDice.table** [16]: kind "table": contiguous rows written "1-3 <result> | 4-6 <result>", each result in the scene's words.

## BodyWound [120 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyWound** [43]: Record a wound the moment it happens, for wounds from a burn, a bite, an accident, a fall, or a bullet (BodyStrike records the wounds of blows and of arrows, bolts and darts itself). Returns what the wound is and the body state.
- **BodyWound.who** [2]: Character name
- **BodyWound.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
- **BodyWound.part** [22]: Body part by its name: e.g. head, throat, upper body, lower body, right upper arm, left hand, right lower leg, left eye.
- **BodyWound.type** options [9 words]: cut | puncture | blunt | burn | bite
- **BodyWound.depth** [18]: Burns: superficial = red, dry skin; partial = blisters; deep_partial = pale, scars; full = through the skin.
- **BodyWound.depth** options [7 words]: superficial | partial | deep_partial | full

## BodyStrike [951 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyStrike** [27]: Resolve an attack before narrating it: whether it lands, which tissue layers it cuts or smashes, and the wounds it records. Narrate a miss as a miss.
- **BodyStrike.who** [3]: The one struck
- **BodyStrike.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
- **BodyStrike.part** [26]: Body part aimed at, by name (head, throat, upper body, right upper arm, left eye…). For an unaimed blow leave it empty: code draws the location.
- **BodyStrike.attack** [28]: The attack: a natural attack of the attacker (punch, kick, bite, scratch, gore…) or, with a weapon, the weapon's attack (slash, stab, bash, hack…). Empty for a shot.
- **BodyStrike.weapon** [22]: Melee weapon used, if any; for any other weapon the nearest kind (a club as a mace, a knife as a dagger).
- **BodyStrike.weapon** options [50 words]: whip | battle axe | war hammer | short sword | spear | mace | pick | pike | halberd | two-handed sword | long sword | maul | great axe | dagger | scourge | flail | morningstar | scimitar | training axe | training sword | training spear
- **BodyStrike.material** [17]: Material of the weapon (a metal) or of the ammunition (a metal, bone or wood). Default iron.
- **BodyStrike.material** options [18 words]: iron | silver | copper | bronze | steel | bismuth bronze | adamantine ⟨magic⟩ | bone | wood
- **BodyStrike.launcher** [32]: For a shot; the ammunition is its arrow, bolt or dart in material. Call it after the shot is on target (BodyCheck for aim); the target can still dodge or block it.
- **BodyStrike.launcher** options [5 words]: bow | crossbow | blowgun
- **BodyStrike.skill** [7]: Attacker's fighting skill level. Dabbling = untrained.
- **BodyStrike.skill** options [33 words]: Dabbling | Novice | Adequate | Competent | Skilled | Proficient | Talented | Adept | Expert | Professional | Accomplished | Great | Master | High Master | Grand Master | Legendary
- **BodyStrike.defender_expert** [24]: The one struck is an expert of a combat sport or of fighting (years of training, bouts fought): they see a blow coming sooner.
- **BodyStrike.style** [11]: quick = fast weak blow; heavy or wild = full-force blow.
- **BodyStrike.style** options [7 words]: normal | quick | heavy | wild
- **BodyStrike.prone** [5]: Target lying on the ground.
- **BodyStrike.from** [20]: Where the attacker strikes from, relative to the way the target faces. Default: front, or back when facing is false.
- **BodyStrike.from** options [7 words]: front | back | left | right
- **BodyStrike.target_armor** [23]: Every item the character hit wears or holds ready, as the story describes it: armour, clothing, a shield, a held board or door.
- **BodyStrike.target_armor.item** [29]: Quality + material + item, "<quality> <material> <item>" as the scene names them. Quality words: well-crafted, finely-crafted, superior, exceptional, masterwork, artifact. With covers, any item name after the material.
- **BodyStrike.target_armor.covers** [61]: What the item physically covers, from its description, as portions. Give it whenever the item differs from the standard one (holes, damage, cut-outs, odd shapes). A helm open at the back = {part: head, sublocations: [forehead, crown], coverage: 100}. Sub-locations: head forehead/crown/nape; upper arm shoulder/upper arm; lower arm elbow/forearm; hand wrist/palm/back of hand; upper leg hip/thigh; lower leg knee/shin; foot sole/arch/ankle/heel.
- **BodyStrike.target_armor.covers.part** [3]: Body part name
- **BodyStrike.target_armor.covers.sublocations** [9]: Covered sub-locations of the part. Default: the whole part.
- **BodyStrike.target_armor.covers.sides** [9]: Covered side. Default: both (a breastplate alone = front).
- **BodyStrike.target_armor.covers.coverage** [12]: % of those sub-locations the portion covers (gaps, holes, mesh); default 100.
- **BodyStrike.target_armor.covers.material** [18]: Material of this portion when it differs from the item's (a leather nape guard on an iron helm).
- **BodyStrike.target_armor.layer** [12]: Worn under clothing, over it, as armour, or as an outer cover.
- **BodyStrike.target_armor.layer** options [7 words]: UNDER | OVER | ARMOR | COVER
- **BodyStrike.target_armor.held_in** [29]: Body part holding the item ready (left hand); a held item guards what it is in front of, and a defence in time puts it in the blow's way.
- **BodyStrike.target_armor.size_cm** [15]: Held item size: [diameter] or [width, height] in cm (round shield [85], door [80, 200]).
- **BodyStrike.target_armor.thickness_cm** [7]: Held item thickness in cm; default 0.9.
- **BodyStrike.target_armor.flexible** [15]: Woven or linked (mail, cloth): a blow it stops still passes through as blunt force.
- **BodyStrike.attacker** [12]: Attacker name; a tracked attacker uses its own species, mass and wounds
- **BodyStrike.attacker_species** [10]: Attacker's species, for an attacker missing from [BODY]. Default human.
- **BodyStrike.attacker_mass_kg** [16]: Attacker body mass in kg, for an attacker missing from [BODY]; default the species' adult mass.
- **BodyStrike.target_mass_kg** [19]: Body mass of the character hit, in kg, the first time this character appears; default the species' adult mass.
- **BodyStrike.awake** [4]: Target awake. Default true.
- **BodyStrike.facing** [7]: Target looking toward the attacker. Default true.
- **BodyStrike.lit** [37]: Set when the story fixes it: false for darkness, true for lamplight. Default: the light at the target (the sky outdoors, the room's flames in a Room), from which code decides whether the target sees the attacker.
- **BodyStrike.noise_db** [13]: Sound level of the attacker at the target in dB(A). 0 = silent.
- **BodyStrike.noise_sound** [21]: The attacker's sound, when it is one of these (level at the target is computed from distance_m); the alternative to noise_db.
- **BodyStrike.noise_sound** options [57 words]: gunshot (171 dB at 1 m) ⟨from 1350⟩ | deafening roar (150 dB at 1 m) | loud pounding (100 dB at 1 m) | loud drone (90 dB at 1 m) | passing vehicle (88 dB at 1 m) ⟨from 1890⟩ | footsteps on gravel or sand (64 dB at 1 m) | quiet conversation (50 dB at 1 m)
- **BodyStrike.background** [14]: Background sound at the target, which can cover the attacker's sound. Default quiet room.
- **BodyStrike.background** options [37 words]: silent night (10 dB) | quiet room (25 dB) | conversation nearby (50 dB) | busy street (68 dB) | loud room (75 dB) | loud machine nearby (85 dB) | pounding work close by (100 dB)
- **BodyStrike.under_fire** [9]: For a shot: the shooter is being shot at.
- **BodyStrike.noise_khz** [18]: Main pitch of that sound in kHz, when it is a tone (whistle, ultrasonic call). Default: broadband noise.
- **BodyStrike.distance_m** [12]: Distance between attacker and target when the attack starts. Default: within reach.
- **BodyStrike.approach_speed** [8]: Attacker's speed in m/s while closing the distance.
- **BodyStrike.sense_range_m** [24]: Range of a sense beyond sight and hearing that the target has (from its species or [WORLD]) and that detects an approaching attacker, m.
- **BodyStrike.intent_visible** [23]: The approach itself shows an attack is coming (charging, weapon raised). False when the attacker looks harmless until the strike starts. Default false.

## BodyChoke [31 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyChoke** [18]: Resolve a choke or strangling hold on the neck once the hold is locked, before narrating its effect.
- **BodyChoke.who** [2]: Character choked
- **BodyChoke.holder** [4]: Character holding the choke
- **BodyChoke.seconds** [7]: Seconds the locked hold is kept on

## BodyEnvironment [1137 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyEnvironment** [47]: Set the air, water and clothing characters are in whenever they enter a different climate, go into or out of water, the weather changes, or they change clothes; PassTime then works out body temperature, sweating, hypothermia, heat stroke and frostbite. clear = back to unrecorded (comfortable) conditions.
- **BodyEnvironment.who** [4]: Characters in these conditions
- **BodyEnvironment.air_c** [3]: Air temperature, °C
- **BodyEnvironment.radiant_c** [28]: Mean radiant temperature, °C: about air temperature in shade or indoors; higher in strong sun or by a fire (desert sun 60–70), lower under a clear night sky
- **BodyEnvironment.humidity_pct** [5]: Relative humidity, %. Default 50
- **BodyEnvironment.wind_kmh** [13]: Weather wind speed outdoors (as forecast, at 10 m), km/h. 0 = calm
- **BodyEnvironment.air_speed_ms** [12]: Indoors or sheltered: air speed at the body, m/s (still room 0.1)
- **BodyEnvironment.ensemble** ⟨from 1960⟩ [8]: Clothing as a measured ensemble when one matches
- **BodyEnvironment.ensemble** options [453 words]: nude (mesh chair) | nude (nude chair) | panty | bra+panty | bra+panty, tanktop, shorts, sandals | bra+panty, long-sleeve shirt, shorts, sandals | bra+panty, sleeveless dress, sandals | bra+panty, T-shirt, long pants, socks, sneakers | bra+panty, sleeveless dress, cardigan, sandals | bra+panty, song-sleeve dress, socks, sneakers | bra+panty, long-sleeve dress, cardigan, socks, sneakers | bra+panty, tank top, skirt, sandals | bra+panty, long sleeve shirts, skirt, sandals | bra+panty, dress shirts, skirt, stocking, formal shoes | bra+panty, dress shirts, skirt, leggings, sandals | bra+panty, thin dress shirts, long pants, socks, sneakers | bra+panty, long sleeve shirts, long pants, socks, sneakers | bra+panty, T-shirt, long sleeve shirts, long pants, socks, sneakers | bra+panty, T-shirt, jeans, socks, sneakers | bra+panty, long sleeve shirts, jeans, socks, sneakers | bra+panty, oxford shirts, long thin pants, socks, sneakers | bra+panty, thin dress shirts (roll-up), long pants, socks, sneakers | bra+panty, T-shirt, short sleeve shirt, long pants, socks, sneakers | bra+panty, sports shirts, long pants, socks, sneakers | bra+panty, sports shirts, sports pants, sports socks, sports shoes | bra+panty, thin dress shirts, long pants, wool sweater, socks, sneakers | bra+panty, thin dress shirts, long pants, cashmere sweater, socks, sneakers | bra+panty, T-shirt, long sleeve shirts, long pants, winter jacket, socks, sneakers | bra+panty, T-shirt, long sleeve shirts, jeans, sports jumper, socks, sneakers | bra+panty, T-shirt, long sleeve shirts, long pants, ventura jacket, socks, sneakers | bra+panty, turtle neck, long pants, short trench coat, socks, sneakers | bra+panty, tank top, long sleeve shirts, blazer, skirt, sandals | bra+panty, long sleeve shirts, wool skirt, socks, formal shoes | bra+panty, turtleneck, wool skirt, socks, formal shoes | bra+panty, long sleeve shirt, wool skirt, sweater, socks, formal shoes | bra+panty, thin dress shirts, slacks, tie, socks, sneakers | bra+panty, thin dress shirts, slacks, blazer, tie, belt, socks, formal shoes | bra+panty, long sleeve shirts, long pants, blazer, socks, sneakers | bra+panty, T-shirt, long sleeve shirts, long pants, winter jacket (Notica) | bra+panty, turtle neck, ski-jumper, skin pants, sports socks, sports shoes | bra+panty, turtle neck, ski-jumper and hood, skin pants, sports socks, sports shoes | bra+panty, turtle neck, goose down, ski pants, sports socks, sports shoes | bra+panty, turtle neck, goose down-with hood, ski pants, sports socks, sports shoes | bra+panty, turtle neck, goose down-with hood and gloves, ski pants, sports socks, sports shoes | briefs, socks, T-shirt, half pants, sneakers | briefs, undershirt, sports t-shirts, sports shorts | briefs, socks, polo shirt, long pants, sneakers | briefs, under shirt, long-sleeved shirt, long pants | briefs, socks, undershirt, short-sleeved shirt, long pants, belt, shoes | briefs, socks, undershirt, long-sleeved shirt, long pants, belt | briefs, socks, undershirt, long-sleeved shirt, jacket, long pants, belt, shoes | briefs, socks, undershirt, work jacket, work pants, safety shoes
- **BodyEnvironment.garments** [43]: Clothing as garments (alone or on top of an ensemble). Name from the list or clo for anything else; covers = body regions (head, neck, chest, back, torso, pelvis, shoulders, arms, forearms, hands, thighs, lower legs, legs, feet, or one side: left hand…)
- **BodyEnvironment.garments.name** [10]: Garment from the list; for any other garment, its clo
- **BodyEnvironment.garments.name** options [190 words]: bra ⟨from 1914⟩ | ankle socks ⟨from 1920⟩ | shoes or sandals | slippers | panty hose ⟨from 1959⟩ | calf length socks | women's underwear | men's underwear | knee socks (thick) | short shorts ⟨from 1930⟩ | walking shorts ⟨from 1900⟩ | t-shirt ⟨from 1913⟩ | boots | sleeveless scoop-neck blouse ⟨from 1920⟩ | half slip ⟨from 1900⟩ | long underwear bottoms | full slip ⟨from 1900⟩ | short-sleeve knit shirt ⟨from 1920⟩ | sleeveless vest (thin) | sleeveless vest (thick) | sleeveless short gown (thin) | short-sleeve dress shirt | sleeveless long gown (thin) | long underwear top | thick skirt | long-sleeve dress shirt | long-sleeve flannel shirt | long-sleeve sweat shirt ⟨from 1926⟩ | short-sleeve hospital gown ⟨from 1900⟩ | short-sleeve short robe (thin) | short-sleeve pajamas ⟨from 1870⟩ | long-sleeve long gown | long-sleeve short wrap robe (thick) | long-sleeve pajamas (thick) ⟨from 1870⟩ | long-sleeve long wrap robe (thick) | thin trousers | thick trousers | sweatpants ⟨from 1920⟩ | overalls ⟨from 1850⟩ | coveralls ⟨from 1900⟩ | thin skirt | long-sleeve shirtdress (thin) | long-sleeve shirtdress (thick) | short-sleeve shirtdress | sleeveless, scoop-neck shirt (thin) ⟨from 1920⟩ | sleeveless, scoop-neck shirt (thick) ⟨from 1920⟩ | long sleeve shirt (thin) | long sleeve shirt (thick) | single-breasted coat (thin) | single-breasted coat (thick) | double-breasted coat (thin) | double-breasted coat (thick)
- **BodyEnvironment.garments.clo** [6]: Insulation of any other garment, clo
- **BodyEnvironment.water_c** [10]: Water temperature, °C, when any body region is in water
- **BodyEnvironment.immersed** [19]: Regions in water: "whole body" (neck down, head out), "submerged" (head under too), or regions (legs, feet, torso, arms…)
- **BodyEnvironment.swimming** [13]: Swimming (met 6 for ordinary swimming, higher for faster); cold arms end swimming
- **BodyEnvironment.afloat** [14]: Kept afloat with the head out by a life jacket, wreckage or a boat
- **BodyEnvironment.water_speed_ms** [10]: Water moving past the body (current, swimming), m/s. Default 0
- **BodyEnvironment.immersion_suit** [12]: Clothing is a dry suit or immersion suit that keeps water out
- **BodyEnvironment.face_covered** [12]: Face covered (a mask or a scarf over the face). Default false
- **BodyEnvironment.met** [34]: Activity in METs for the whole span when fixed (Compendium of Physical Activities values: sleeping 0.95, sitting quietly 1.3, walking 3 mph 3.5). Default: as PassTime sets it (sleeping 0.95, resting 1.3, active 3.5)
- **BodyEnvironment.activity** [25]: What the characters are doing, in plain words ("chopping wood", "sitting in a lecture", "rowing a boat"), code takes the Compendium value (or give met)
- **BodyEnvironment.altitude_m** [17]: Altitude above sea level, m, whenever it changes by 500 m or more. 0 = sea level
- **BodyEnvironment.sudden_ascent** [6]: Arrived at this altitude within minutes
- **BodyEnvironment.decompression** [16]: A pressurized cabin or enclosure suddenly opened at this altitude (breath torn out; shorter time conscious)
- **BodyEnvironment.co_ppm** [23]: Carbon monoxide in the air, ppm (fire smoke in a room 1000–10 000; a faulty stove or heater 100–1000); 0 = fresh air
- **BodyEnvironment.o2_pct** [18]: Oxygen in the air, % (normal 20.9; a fire-filled or sealed room or gas-displaced air lower). Default: 20.9
- **BodyEnvironment.smoke** [6]: Breathing fire smoke (causes inhalation injury)
- **BodyEnvironment.swimmer** [20]: Whether the character can swim, when the story has established it; otherwise code draws it once (46 % of adults)
- **BodyEnvironment.deep_water** [8]: Water over the head. Default true when immersed.
- **BodyEnvironment.clear** [3]: Remove recorded conditions
- **BodyEnvironment.weather_place** [29]: Outdoors: the town or city the characters are in or nearest to ("<town>" or "<town>, <country>"); air temperature then follows that place's weather as PassTime runs (air_c then optional).
- **BodyEnvironment.latitude** [17]: With weather_place for any other place (fictional or remote): its latitude; the nearest listed city is used
- **BodyEnvironment.longitude** [3]: Longitude, with latitude

## BodyIntake [142 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyIntake** [13]: Record drinking or eating the moment it happens; untreated water may carry infection.
- **BodyIntake.who** [2]: Character name
- **BodyIntake.water_l** [9]: Water drunk, litres (a cup 0.25, a bottle 0.5–1)
- **BodyIntake.food_kcal** [11]: Food energy eaten, kcal (bread slice 80, apple 95, meal 600–900)
- **BodyIntake.food_g** [7]: Weight of food eaten, g, when known
- **BodyIntake.carb_g** [13]: Carbohydrate in it, g, when known (code computes the energy and checks food_kcal)
- **BodyIntake.protein_g** [6]: Protein in it, g, when known
- **BodyIntake.fat_g** [6]: Fat in it, g, when known
- **BodyIntake.alcohol_g** [21]: Pure alcohol drunk, grams (beer 330 mL 13 g, wine glass 150 mL 14 g, spirit shot 40 mL 13 g)
- **BodyIntake.water_source** [15]: Where untreated water came from (river, well, rain barrel). Default: treated tap or bottled water
- **BodyIntake.water_source** options [30 words]: raw sewage | contaminated river or lake | river or lake with people or herds upstream | protected river or reservoir | groundwater (well, spring) | rooftop rainwater | stormwater
- **BodyIntake.boiled** [9]: The water was brought to a rolling boil first

## Communicate [367 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Communicate** [31]: Decide what a message carries from one character to another (speech or gesture) before narrating a reply or reaction. Returns whether the words, only the tone, or nothing reaches the listener.
- **Communicate.speaker** [4]: Character sending the message
- **Communicate.listener** [3]: Character receiving it
- **Communicate.means** options [3 words]: speech | gesture
- **Communicate.lit** [8]: Enough light to see a gesture. Default true.
- **Communicate.distance_m** [6]: Distance between them, m. Default 1.
- **Communicate.effort** [4]: Vocal effort. Default normal.
- **Communicate.effort** options [9 words]: whisper | normal | raised | loud | shout
- **Communicate.feeling** [15]: When the speaker voices a strong feeling: it raises the voice within the chosen effort
- **Communicate.feeling** options [5 words]: intense anger | intense affection
- **Communicate.voice_feeling** [20]: The feeling the speaker's voice carries, when the player's marks or the story give one: the listener may hear another
- **Communicate.voice_feeling** options [9 words]: anger | fear | happiness | sadness | tenderness
- **Communicate.noise** [8]: Background sound at the listener. Default quiet room.
- **Communicate.noise** options [37 words]: silent night (10 dB) | quiet room (25 dB) | conversation nearby (50 dB) | busy street (68 dB) | loud room (75 dB) | loud machine nearby (85 dB) | pounding work close by (100 dB)
- **Communicate.barrier** [6]: What lies between them. Default none.
- **Communicate.barrier** options [17 words]: none | curtain or tent | wooden door | plaster wall | brick wall | stone wall
- **Communicate.ground** [7]: Outdoors: the ground between them. Default mixed.
- **Communicate.ground** options [11 words]: paved, water or ice | mixed | grass, fields or soil
- **Communicate.obstacle_m** [20]: Outdoors: how far a wall, house or crest between them rises above the straight line from source to ear, m
- **Communicate.wind** [11]: Outdoors: which way the wind blows along the way. Default across.
- **Communicate.wind** options [9 words]: toward the listener | across | toward the source
- **Communicate.wind_ms** [18]: Wind speed at 10 m, m/s, when the story sets it. Default: the recorded day's wind where known.
- **Communicate.source_height_m** [17]: Height of the source above the ground, m (a voice 1.6, a bell tower 20). Default 1.5.
- **Communicate.speaker_species** [11]: Speaker's species, when the engine has no record of them yet.
- **Communicate.listener_species** [11]: Listener's species, when the engine has no record of them yet.
- **Communicate.speaker_languages** [13]: Languages the speaker knows, when the story states them; kept for later calls.
- **Communicate.listener_languages** [13]: Languages the listener knows, when the story states them; kept for later calls.
- **Communicate.message** [18]: What the message says, one short sentence. When it reaches the listener, the listener comes to know it.
- **Communicate.speaker_voice** [16]: When the story makes the speaker voiceless (larynx removed, vocal folds paralysed); kept for later calls.
- **Communicate.speaker_voice** options [7 words]: normal | whisper only (no vocal-fold vibration)

## Interpret [75 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Interpret** [33]: Decide which meaning a listener takes from a word that has several meanings in the language spoken, or that sounds like another word when whispered, after Communicate names it, before narrating their response.
- **Interpret.speaker** [3]: Who said it
- **Interpret.listener** [3]: Who heard it
- **Interpret.language** [3]: The language spoken
- **Interpret.word** [12]: The English word as the speaker meant it, as Communicate names it
- **Interpret.fits** [21]: Every meaning, from the word and those Communicate lists, that what the listener knows and sees in the scene leaves possible

## Appraise [264 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Appraise** [26]: Decide which emotions a character feels about something, before narrating their feelings. The answers describe how the character sees it; the emotion types follow from them.
- **Appraise.who** [3]: Character feeling it
- **Appraise.about** options [45 words]: an event that affects them | an event that affects someone else | the prospect of an event | a hoped-for or feared event that came true or did not | their own action | someone else's action | a person or thing they encounter
- **Appraise.target** [11]: The person, thing or event it is about, a few words
- **Appraise.matters** [10]: How much it touches the character's goals, standards or tastes
- **Appraise.matters** options [19 words]: nothing at stake | a goal, standard or taste is touched | a goal, standard or taste is central
- **Appraise.good** [16]: For an event or prospect: it is (or would be) good for the one it affects
- **Appraise.wants_it_for_them** [14]: For an event that affects someone else: the character wants that outcome for them
- **Appraise.came_true** [9]: For a hoped-for or feared event: it came true
- **Appraise.praiseworthy** [10]: For an action: the character judges it praiseworthy (false: blameworthy)
- **Appraise.result_for_them** [12]: For an action: what its result means for the character. Default none.
- **Appraise.result_for_them** options [5 words]: good | bad | none
- **Appraise.appealing** [11]: For a person or thing encountered: the character finds it appealing
- **Appraise.emotion_word** [19]: The plain word for the feeling when one fits (fear = a present threat; anxiety = a feared prospect)
- **Appraise.emotion_word** options [54 words]: shame | relief | disgust | being touched | surprise | boredom | fear | admiration | irritation | compassion | disappointment | jealousy | hatred | desperation | stress | relaxation | contentment | anxiety | guilt | humiliation | gratitude | joy | anger | pride | enthusiasm | hope | sadness

## Price [533 words] · tool ⟨1209–2008⟩ — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Price** [64]: Decide what goods cost, what a day of work pays, what a year of necessities costs, or what English money is worth, before narrating a sale, a wage or a bill. Returns grams of silver and the days a building labourer works to earn it. A good outside the list is priced with good and like, from the listed good it is most like.
- **Price.question** options [19 words]: price of goods | daily wage | yearly cost of living for one person | value of English money
- **Price.item** [8]: For the price of goods: a listed good
- **Price.item** options [58 words]: bread (kg) | beans or peas (litre) | meat (kg) | butter (kg) | cheese (kg) | egg (each) | beer (litre) | wine (litre) | olive oil (litre) | soap (kg) | linen (metre) | candles (kg) | lamp oil (litre) | fuel (million BTU) | apples (kg) | lodging (night) | inn bed and supper (night)
- **Price.good** [15]: For goods outside the list: the good in the story's words; give like with it
- **Price.like** [16]: With good: the listed good it is most like (a fruit: apples; a malt drink: beer)
- **Price.like** options [58 words]: bread (kg) | beans or peas (litre) | meat (kg) | butter (kg) | cheese (kg) | egg (each) | beer (litre) | wine (litre) | olive oil (litre) | soap (kg) | linen (metre) | candles (kg) | lamp oil (litre) | fuel (million BTU) | apples (kg) | lodging (night) | inn bed and supper (night)
- **Price.quantity** [14]: Units of the item (kg, litres, eggs, metres) or days of work. Default 1.
- **Price.trade** [7]: For a daily wage. Default building labourer.
- **Price.trade** options [5 words]: building labourer | building craftsman
- **Price.city** [11]: The city, or the nearest listed one in the same country
- **Price.city** options [207 words]: Antwerp | Amsterdam | London | Florence | Naples | Valencia | Madrid | Paris | Strasbourg | Augsburg | Leipzig | Munich | Vienna | Gdansk | Krakow | Warsaw | Lwow | Milan | Hamburg | Suzhou | Canton | Beijing | Kyoto | Argentina | Bolivia | Chile | Mexico | Peru | India (east) | India (west) | India (south) | India (north) | Istanbul | Korea | Cairo | Moscow | Japan | Nigeria | Sierra Leone | Nyasaland | Mauritius | Uganda | Tanganyika | Gambia | Kenya | Gold Coast | Agra | Allahabad | Barcelona | Bengal | Bihar | Bohemia | Bukowina | Canada | Cape Colony | Carinthia | Carniola | Ceylon | Chesapeake | Coimbra | Cracow | Croatia | Dalmatia | Delhi | EasternSlovakia | Edo | England | Evora | Frankfurt | Galicia | Gottingen | Gujarat | Hungary | India | Lisbon | Littoral | LowerAustria | Lublin | Lviv | Massachusetts | MexicoChallu | Moravia | Natal | Nurnberg | Porto | Poznan | Quedlinburg | Rostock | Saint Petersburg | Salzburg | Seville | Silesia | Stockholm | Styria | TemesvarBanat | Transylvania | Tyrol | UpperAustria | WesternSlovakia | Wurzburg
- **Price.country** ⟨1820–2008⟩ [14]: For a daily wage in a country with no listed city, 1820–2008: the country
- **Price.trade_name** ⟨1953–2008⟩ [16]: For the hourly pay of a modern trade 1953–2008 (with country): the occupation, e.g. "welder", "nurse"
- **Price.money** [14]: For "value of English money": [pounds, shillings, pence] (12 shillings = [0, 12, 0])
- **Price.year** [7]: Story year. Default: the year in [TIME].

## PlaceProfile [70 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **PlaceProfile** [51]: Decide how large, how urban, how violent and how deadly for infants a country or city is in a year, before narrating a crowd, a town's size, a murder rate or a child's survival. Returns population, urban share, murders per 100,000, infant deaths per 1,000 births and the nearest listed city.
- **PlaceProfile.country** [6]: The country. Default: the setting's country.
- **PlaceProfile.city** [6]: A city name, for its population
- **PlaceProfile.year** [7]: Story year. Default: the year in [TIME].

## NameCharacter [57 words] · tool ⟨from 1910⟩ · United States only — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **NameCharacter** [36]: Give a first name to a character in an American setting whose name is still open, before naming them. Drawn by how many US babies of that sex got the name in their birth decade (1910–2029).
- **NameCharacter.who** [11]: Label of the character, as the scene names them ("the <role>")
- **NameCharacter.sex** options [3 words]: male | female
- **NameCharacter.birth_year** [7]: Year of birth (story year minus age)

## BodySize [104 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodySize** [49]: Decide the height and body mass of an adult character whose build the story leaves open, before describing them, from their country, sex and birth year; eye and hair colour too where the country has data (15 European and Central Asian countries). Records the mass for the body rules.
- **BodySize.who** [2]: The character
- **BodySize.country** [21]: Country the character grew up in (present-day name, e.g. United Kingdom, Nigeria, Japan). Default: the country of the last place given.
- **BodySize.sex** options [3 words]: male | female
- **BodySize.birth_year** [3]: Year of birth
- **BodySize.year** [7]: Story year. Default: the year in [TIME].
- **BodySize.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.

## Disease [227 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Disease** [49]: Decide the course of a contagious disease before narrating it: when a character who caught it first shows symptoms, how many people in a community fall ill over the whole outbreak, or what share of a population a historical epidemic (Antonine plague to the plagues of the 1600s) kills.
- **Disease.disease** options [44 words]: chickenpox | serum hepatitis | bacterial food poisoning | salmonellosis | poliomyelitis | amoebic dysentery | adenovirus | common cold coronavirus | SARS ⟨from 2002⟩ | influenza A | influenza B | parainfluenza | respiratory syncytial virus | rhinovirus | measles | mumps | whooping cough
- **Disease.question** options [27 words]: when symptoms start | how many fall ill | how many die in a historical epidemic | what a death among foragers or village farmers was from
- **Disease.age** [10]: For "what a death … was from": age at death
- **Disease.epidemic** [8]: For "how many die in a historical epidemic"
- **Disease.epidemic** options [55 words]: Antonine plague (smallpox), 160–180 | Plague of Cyprian, 249–270 | Plague of Justinian, 540–541 | Black Death, 1347–1352 | plague of 1623–1632, northern Italy | plague of 1623–1632, Switzerland | plague of 1623–1632, southern Germany, Rhineland, Alsace | plague of 1623–1632, Dutch Republic | plague of 1647–1657, Kingdom of Naples | plague of 1647–1657, Catalonia
- **Disease.who** [9]: For "when symptoms start": the character who caught it
- **Disease.population** [14]: For "how many fall ill": people in the community who mix with each other
- **Disease.immune_share** [11]: Share 0–1 already immune (had it before or vaccinated). Default 0.

## Battle [72 words] · tool ⟨1600–1991⟩ — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Battle** [37]: Decide whether an attack on a defended position succeeds, for a battle or engagement between armies or units from 1600 to 1991, before narrating its result. Code decides from the numbers on each side and the year.
- **Battle.attackers** [5]: Soldiers in the attacking force
- **Battle.defenders** [2]: Soldiers defending
- **Battle.year** [7]: Story year. Default: the year in [TIME].
- **Battle.place** [6]: The position attacked, a few words
- **Battle.surprise** [15]: The defenders were unaware of the attack until it struck (unwarned by sentries or scouts)

## Substance [139 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Substance** [68]: Look up a single chemical compound before narrating what it does physically: whether it is solid, liquid or gas at the temperature, whether and how hot it burns, when its vapour catches fire, its fire limits in air. Measured values from handbooks; estimates from its structure when unmeasured. A mixture is given as parts by mass ("ethanol 40%, water 60%"); solid fuels by name with their water content.
- **Substance.substance** [27]: Compound name in English (ethanol, octane, glycerol, carbon dioxide), a SMILES structure, a solid fuel (wood, peat, lignite, bituminous coal), or a mixture "name share%, name share%"
- **Substance.temp_c** [11]: Temperature it is at, °C (the scene's air temperature). Default 20.
- **Substance.moisture_pct** [23]: For a solid fuel (wood, peat, lignite, bituminous coal, refuse-derived fuel): water, % of its wet weight (fresh-cut wood about 50, seasoned 20)
- **Substance.ash_pct** [10]: For a solid fuel: ash, % of its dry weight

## Weather [93 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Weather** [41]: Decide the day's weather at the story's place from the date and hour in [TIME], before describing it: rain, snow or dry, the amount, the day's high and low and the temperature now. The same date always gives the same weather.
- **Weather.place** [35]: The town or city the scene is in or nearest to ("<town>" or "<town>, <country>"); for a fictional or remote place, the nearest real town or give latitude and longitude. Default: the last place given.
- **Weather.latitude** [14]: For a place outside the weather lists: latitude; the nearest listed city is used
- **Weather.longitude** [3]: Longitude, with latitude

## Choose [141 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Choose** [39]: Decide what a character does when they have several real options (fight, flee or bargain; which road; whom to trust), before narrating it. Give each option with how many people in their place would take it; code draws one.
- **Choose.who** [3]: The character choosing
- **Choose.options** [22]: Two or more options, each a different act, each with the share of people in this character's place who would take it
- **Choose.options.share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **Choose.options.kind** [17]: What sort of act it is; code moves the share by the character's traits, feelings and drink
- **Choose.options.kind** options [33 words]: attack or fight | run, hide or keep away | take a risk for a gain | play safe or wait | help someone | talk, bargain or give way | something else

## RecordFact [211 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **RecordFact** [51]: Fix a fact the moment the story establishes it (a place, an object, a person, a secret, an event) and record who knows it: those who saw it, heard it, read it or were told it. A recorded fact stays true for the rest of the story and appears in [KNOWS].
- **RecordFact.fact** [5]: The fact, one short sentence
- **RecordFact.known_by** [4]: Characters who know it
- **RecordFact.common_knowledge** [15]: Known to everyone in the setting (a public event, a famous place, a well-known custom)
- **RecordFact.how** [12]: How the knowers learned it, when they learned it the same way
- **RecordFact.how** options [26 words]: saw it | heard, smelled or felt it | inferred from what they saw | assumed from what they know | told by someone | hearsay
- **RecordFact.told_by** [7]: For "told by someone": who told them
- **RecordFact.cause** [21]: For an event: who or what caused it, as the story has it: a character's name, "a natural force", or "unknown"
- **RecordFact.secret** [13]: The knowers keep it hidden from others (an affair, a crime, a plan)
- **RecordFact.kind** [28]: event: something that happened or was said (default); knowledge: something learned by study or training (a name, a concept, a craft's facts), which fades less and then holds
- **RecordFact.kind** options [3 words]: event | knowledge
- **RecordFact.importance** [26]: How much it matters to the knowers, 1–10: 1 purely mundane (brushing teeth, a meal), 10 extremely poignant (a death, a break-up, a betrayal, an acceptance)

## Claim [879 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Claim** [87]: Decide whether something a player's message states about their own character holds, when it is new to the story: what the character is, an item they have, an ability of body or skill, something that happened to them before, something outside their control happening to them now (a slip, a faint, a cramp). Permission comes from the people who give it (SocialResponse or Choose); what a place allows comes from the scene and the world's facts. Returns whether it holds; either way it is recorded and stays.
- **Claim.who** [6]: The player's character making the claim
- **Claim.claim** [17]: The claim, one short sentence with the character's name and what is claimed, in the player's words
- **Claim.kind** options [40 words]: what the character is | something the character has | something the character can do | something that happened before | something happening to the character now | something the character knows | something the character chooses to do now
- **Claim.trait** [36]: For "something the character chooses to do now": the personality trait the act expresses (shouting, partying: extraversion; insulting, fighting: agreeableness, low pole; slacking off: conscientiousness, low pole; panicking, crying: emotional stability, low pole; reading, questioning: intellect)
- **Claim.trait** options [10 words]: extraversion | agreeableness | conscientiousness | emotional stability | intellect
- **Claim.trait_level** [25]: The character's place on that trait among people, when the story has shown it ("hard-working": conscientiousness high). Default: code draws it once and keeps it.
- **Claim.trait_level** options [11 words]: very low | low | average | high | very high
- **Claim.act_pole** [14]: With trait: whether the act shows much of the trait or little of it
- **Claim.act_pole** options [9 words]: toward the high pole | toward the low pole
- **Claim.act_strength** [9]: With trait: mild (a raised voice) or strong (screaming)
- **Claim.act_strength** options [3 words]: mild | strong
- **Claim.behaviour** [11]: With trait, when one fits: the act as one of these
- **Claim.behaviour** options [29 words]: run | talk | kiss | write | eat | sleep | mumble | read | fight | belch | argue | jump | cry | laugh | shout
- **Claim.situation** [11]: With behaviour, when one fits: the setting as one of these
- **Claim.situation** options [34 words]: class | date | bus ⟨from 1828⟩ | family dinner | park | church | job interview ⟨from 1900⟩ | sidewalk | movies ⟨from 1895⟩ | bar | elevator ⟨from 1857⟩ | restroom ⟨from 1900⟩ | own room | dorm lounge ⟨from 1900⟩ | football game ⟨from 1869⟩
- **Claim.in_world** [20]: The kind of thing claimed exists in this world: real history for the date, plus [WORLD]. False: the claim fails.
- **Claim.species** [20]: For "what the character is": the creature claimed, as a creature name (cat, horse, wolf), when it is a creature
- **Claim.item** [20]: For "something the character has": the item, a few words, singular; a number of them is counted in the claim
- **Claim.language** [21]: For "something the character can do" when it is speaking a language: the language as named ("japanese", "modern japanese", "old mandarin")
- **Claim.skill** [12]: For "something the character can do" when it is one of these
- **Claim.skill** options [8 words]: reading and writing | counting and simple sums
- **Claim.faith** [10]: For "what the character is" when it is a religion
- **Claim.faith** options [76 words]: protestant christian ⟨from 1517⟩ | catholic christian | orthodox christian | anglican christian ⟨from 1534⟩ | other christian | christian (any) | jewish | sunni muslim | shia muslim | ibadi muslim | alawite muslim | ahmadiyya muslim ⟨from 1889⟩ | other muslim | muslim (any) | mahayana buddhist | theravada buddhist | other buddhist | buddhist (any) | hindu | sikh ⟨from 1500⟩ | jain | zoroastrian | shinto | taoist | confucian | baha'i ⟨from 1863⟩ | syncretic religion | animist | no religion
- **Claim.past_act** [32]: For "something that happened before" when it is something the character once did ("hit someone who annoyed me", "asked someone out on a date"): the act in a few words, first person
- **Claim.marital** [11]: For "what the character is" when it is their marital state
- **Claim.marital** options [7 words]: never married | married now or before
- **Claim.age** [5]: With marital: the character's age
- **Claim.lived_to** [22]: For a claim that needs someone to have lived to an age (the character's own age; a parent alive now): that age
- **Claim.alive_at** [16]: With lived_to: the age at which that person was last known alive (0 = from birth)
- **Claim.person_sex** [7]: With lived_to or marital: that person's sex
- **Claim.person_sex** options [3 words]: male | female
- **Claim.quantity** [9]: For "something the character has": how many. Default 1.
- **Claim.reference_class** [24]: The wider class this claim belongs to: people like the character, with place and year ("<people> in <place>, <year>, <doing what the claim says>")
- **Claim.base_share** [12]: How often claims of that class hold in this kind of setting.
- **Claim.base_share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **Claim.share** [13]: Your estimate for this claim given everything the story has established so far.
- **Claim.share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **Claim.path** [32]: For a claim whose base share is "almost no one": the events it needs, in order, each given the ones before (arrive in the country, reach the place, stay there). Required then.
- **Claim.path.step** [11]: One event the claim needs, in the order it would happen
- **Claim.path.reference_class** [11]: The cases this step belongs to, given the steps before it
- **Claim.path.base_share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **Claim.path.share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **Claim.against_interest** [17]: By meaning: the claim harms the claimer (a slip, a fall, a fever, a loss, a wound)

## Transfer [196 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Transfer** [81]: Record an item changing hands, entering or leaving the story, once the story has it happen: given, sold, bought, lent, returned, stolen, taken by force, found, made, lost, used up, dropped. Whether it happens comes first from the tool that decides how (SocialResponse or Choose for an agreement, Look for a theft that may be seen, HoldOn or BodyStrike for a struggle, Price for what it costs). Returns the new holder and, when it differs, the owner; [HAS] then shows both.
- **Transfer.item** [11]: The item, a few words, singular, as the scene names it
- **Transfer.quantity** [4]: How many. Default 1.
- **Transfer.from** [12]: Who had it. Default: the world (found, made, bought from someone untracked)
- **Transfer.to** [35]: Who or where has it now: a person, or a place when it is left there ("the west hall window"), so it can be found later. Default: out of the story (used up, sold away)
- **Transfer.how** options [26 words]: given | sold | bought | lent | returned | stolen | taken by force | found | made | lost | used up | dropped
- **Transfer.item_is** [6]: What the item is, by meaning
- **Transfer.item_is** options [21 words]: a thing (a severed or preserved body part counts) | a person or animal | a part of a living body

## WorkOut [222 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **WorkOut** [43]: Decide whether a character works something out in the time they have, before narrating it: a riddle, a trick, a code, a link between clues, a sum, a plan; or whether they remember to do what they meant to when its moment comes.
- **WorkOut.who** [2]: Character thinking
- **WorkOut.problem** [6]: The problem in a few words
- **WorkOut.kind** options [60 words]: a link between clues (one word or idea that fits them all) | a riddle or trick that needs a new view | a step-by-step problem (logic, a sum, a plan) | remembering to do what they meant to, the cue in front of them | remembering to do what they meant to, nothing in the moment pointing to it
- **WorkOut.seconds** [24]: For a problem: time they have to work it out, s (a glance 2, a moment 10, a minute 60, a long look 240)
- **WorkOut.share** [32]: Only when the story establishes how able the character is at such problems: the share of university students they would do better than. Otherwise code uses the character's own ability, drawn once.
- **WorkOut.share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **WorkOut.reveals** [28]: The fact itself, as the scene holds it, set before the outcome: one sentence with its people and things as the scene names them; learned only on success

## Sickness [68 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Sickness** [25]: Decide whether a character vomits or feels sick in a situation with published rates, before narrating it; situation names it. Spoiled food goes to Disease.
- **Sickness.who** [1]: Character
- **Sickness.situation** options [10 words]: a sea crossing | waking after surgery under general anaesthesia ⟨from 1846⟩
- **Sickness.sex** options [3 words]: male | female
- **Sickness.age** [3]: Age in years
- **Sickness.motion_sickness_before** [12]: After surgery: has been seasick, carsick or sick after an operation before
- **Sickness.smoker** [3]: After surgery: smokes
- **Sickness.opioids** [11]: After surgery: given opium, morphine or another opioid for the pain

## Listen [336 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Listen** [30]: Decide whether a character hears a sound (footsteps, a voice, hoofbeats, a bell) before narrating whether they react. Code decides from loudness, distance, background noise, walls and the listener's hearing.
- **Listen.listener** [5]: Character who might hear it
- **Listen.listener_species** [11]: Listener's species, when the engine has no record of them yet.
- **Listen.sound** options [57 words]: gunshot (171 dB at 1 m) ⟨from 1350⟩ | deafening roar (150 dB at 1 m) | loud pounding (100 dB at 1 m) | loud drone (90 dB at 1 m) | passing vehicle (88 dB at 1 m) ⟨from 1890⟩ | footsteps on gravel or sand (64 dB at 1 m) | quiet conversation (50 dB at 1 m)
- **Listen.spl_db** [19]: Loudness at 1 m, dB SPL, for a sound outside the classes in the list (from a published measurement)
- **Listen.distance_m** [5]: Distance from the sound, m
- **Listen.noise** [8]: Background sound at the listener. Default quiet room.
- **Listen.noise** options [37 words]: silent night (10 dB) | quiet room (25 dB) | conversation nearby (50 dB) | busy street (68 dB) | loud room (75 dB) | loud machine nearby (85 dB) | pounding work close by (100 dB)
- **Listen.barrier** [5]: What lies between. Default none.
- **Listen.barrier** options [17 words]: none | curtain or tent | wooden door | plaster wall | brick wall | stone wall
- **Listen.tone_hz** [20]: For a tonal sound (a bell, a whistle, a horn): its pitch, Hz (a church bell 300–600, a whistle 2000–3000)
- **Listen.ground** [7]: Outdoors: the ground between them. Default mixed.
- **Listen.ground** options [11 words]: paved, water or ice | mixed | grass, fields or soil
- **Listen.obstacle_m** [20]: Outdoors: how far a wall, house or crest between them rises above the straight line from source to ear, m
- **Listen.wind** [11]: Outdoors: which way the wind blows along the way. Default across.
- **Listen.wind** options [9 words]: toward the listener | across | toward the source
- **Listen.wind_ms** [18]: Wind speed at 10 m, m/s, when the story sets it. Default: the recorded day's wind where known.
- **Listen.source_height_m** [17]: Height of the source above the ground, m (a voice 1.6, a bell tower 20). Default 1.5.
- **Listen.reveals** [29]: The fact itself, as the scene holds it, set before the outcome: one sentence with its people, act and place as the scene names them; learned only if heard

## Look [468 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Look** [31]: Decide whether a character sees something at a distance (a person, an animal, a vehicle) before narrating it. Code rolls notice / recognize / identify from size, distance, light and visibility.
- **Look.viewer** [5]: Character who might see it
- **Look.viewer_species** [11]: Viewer's species, when the engine has no record of them yet.
- **Look.target** [7]: What might be seen, a few words
- **Look.kind** [18]: What the target is, by meaning: the nearest kind in the list. Code takes its size from it.
- **Look.kind** options [107 words]: a person | a head or face | a hand | a penny (British, 1860–1970) | a halfpenny (British, 1860–1970) | a farthing (British, 1860–1956) | a shilling (British, 1816–1970) | a sovereign (British gold) | another coin | a door or doorway | a window | a horse or other large beast | a dog or similar animal | a cat or small animal | a sheet of paper, letter or book | a blade or tool | a key, ring or small object | a cup, bottle or lamp | a cart, carriage or sledge | a boat or ship | something else (give size_m)
- **Look.size_m** [12]: For kind "something else": the smallest visible dimension of the target, m
- **Look.distance_m** [12]: Distance, m; Layout gives it when viewer and target_who are both placed
- **Look.light** [21]: Set for an overcast sky or artificial light; code takes daylight, twilight, moonlight and starlight from the date, hour and latitude.
- **Look.light** options [13 words]: overcast day | dim street or public lighting | living room ⟨from 1880⟩ | office ⟨from 1880⟩
- **Look.latitude** [21]: Latitude of the place, degrees (north +, south −), when the story moves to a new region. Kept for later calls.
- **Look.visibility_m** [15]: Meteorological visibility, m (clear air 20000; haze 5000; mist 2000; fog 500; thick fog 50)
- **Look.water_visibility_m** [35]: Viewer and target under water: how far a dark object can be made out across this water, m (clear open ocean 30 or more; coastal sea 5–15; harbour or lake 1–3; muddy river under 0.5)
- **Look.reveals** [29]: The fact itself, as the scene holds it, set before the outcome: one sentence with its people, act and place as the scene names them; learned only if identified
- **Look.target_who** [17]: When the target is a tracked character: their name (distance and walls then come from the map)
- **Look.weapon_in_view** [9]: With target_who: they hold a weapon in plain view
- **Look.dressed** [12]: For a person: how dark their clothes are, when the story says
- **Look.dressed** options [20 words]: dark clothes or coat (black, navy, brown) | mid-tone clothes (grey, khaki, red, blue) | light clothes (white, cream, pale)
- **Look.against** [14]: What lies behind the target as the viewer sees it, when the story says
- **Look.against** options [36 words]: the sky (on the skyline) | grass or fields | woodland or crops | fresh snow | old snow | water | an asphalt road ⟨from 1854⟩ | concrete or stone paving | a brick or stone wall
- **Look.seconds** [23]: How long the viewer keeps looking, s, when it is more than a glance (a watch from cover 60, a long stare 120)

## SocialResponse [813 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **SocialResponse** [43]: Decide how a person responds in a social situation whose outcome is in doubt, before narrating it; situation names the kind. A sale, a served drink or a paid service is the person's trade: it goes ahead, and Transfer or Price records it.
- **SocialResponse.situation** options [183 words]: a statement that might be a lie | an emergency they witness | an order to hurt someone | a small favour asked by a stranger | a brief first meeting | an order from a stranger | a stranger asks to go first | an offered split they can refuse so neither gets anything | a chance to punish someone who cheated the group, at a cost to themselves | a chance to hand something of value to a stranger who could keep it | a chance to give back part of what a trusting stranger handed them | told a false detail about an event they saw | urged to remember a made-up event from their own past | an act they see or hear of that they may condemn outright ⟨from 2000⟩ | a group around them all state something they can see is wrong | a witness looks over a lineup of six for someone they saw | asked a bigger favour after a small one for the same cause | asked a small favour right after refusing a large one
- **SocialResponse.who** [6]: The person whose response is decided
- **SocialResponse.speaker** [10]: For a statement or a false detail: who said it
- **SocialResponse.is_lie** [14]: For a statement: whether it is in fact a lie (known from the story)
- **SocialResponse.statement** [15]: For a statement, a false detail or a made-up event: it in a few words
- **SocialResponse.evidence** [18]: For a statement: evidence the listener holds that bears on it, and when they show it. Default none.
- **SocialResponse.evidence** options [12 words]: none | revealed early | kept until they have told their story
- **SocialResponse.knows_speaker** [17]: For a statement: the listener has heard the speaker talk before. Default: from the messages on record.
- **SocialResponse.expert_listener** [17]: For a statement: the listener questions people for a living (an interrogator, a judge, a customs officer)
- **SocialResponse.high_stakes** [11]: For a statement: the speaker has much to lose if disbelieved
- **SocialResponse.others** [31]: For an emergency: how many other people the person believes also witness it; for a group stating something wrong: how many state it. Default: from the tracked people on the map.
- **SocialResponse.victim** [24]: For an emergency or an order to hurt someone: the tracked character in danger or to be hurt; where they are sets the circumstances
- **SocialResponse.emergency** [7]: For an emergency. Default victim in danger.
- **SocialResponse.emergency** options [10 words]: not an emergency | victim in danger | attacker present
- **SocialResponse.order** [25]: For an order to hurt someone: its circumstances. Default with a placed victim: from where the victim is (the same room, or out of sight).
- **SocialResponse.order** options [34 words]: victim out of sight | victim in the same room | must physically force the victim | orders given from another place | authority of an ordinary business | peers refuse | peers obey
- **SocialResponse.offer_share** [13]: For an offered split: the share of the whole offered to them, 0–1
- **SocialResponse.request** [9]: For a favour: the request in a few words
- **SocialResponse.sex** [12]: For a first meeting: sex of the person whose interest is decided
- **SocialResponse.sex** options [3 words]: male | female
- **SocialResponse.many_options** [14]: For a first meeting: they meet many prospective partners at once (15 or more)
- **SocialResponse.requester** [19]: For a favour, an order or asking to go first: how the stranger asking is dressed. Default ordinary clothes.
- **SocialResponse.requester** options [17 words]: ordinary clothes | uniform without authority (a tradesman's or a porter's) | uniform of authority (a guard's)
- **SocialResponse.order_kind** [7]: For a stranger's order: what it asks
- **SocialResponse.order_kind** options [26 words]: do a small task for them | give a small sum to someone else | move or change what they are doing for a doubtful reason
- **SocialResponse.request_size** [16]: For a stranger asking to go first: how long they need, against the person's own task
- **SocialResponse.request_size** options [13 words]: small (less than their own task) | big (more than their own task)
- **SocialResponse.reason** [11]: For a stranger asking to go first: the reason they give
- **SocialResponse.reason** options [12 words]: no reason | a reason that adds nothing | a real reason
- **SocialResponse.event_fact** [14]: For a false detail: the recorded fact of the event they witnessed, as recorded
- **SocialResponse.act** ⟨from 2000⟩ [12]: For an act they may condemn: the act, in a few words
- **SocialResponse.ally** [14]: For a group stating something wrong: one other person sides with what they see
- **SocialResponse.target_who** [14]: For a lineup: the tracked person the witness saw, whose face they look for
- **SocialResponse.culprit_present** [8]: For a lineup: whether target_who stands in it
- **SocialResponse.other_group** [17]: For a lineup: target_who is of a people the witness has seldom met (another race or origin)
- **SocialResponse.earlier** [20]: For a bigger favour: what they did with the small one. Default: from the small favour SocialResponse decided for them.
- **SocialResponse.earlier** options [20 words]: did the small favour | agreed to the small favour, which was then called off | refused the small favour
- **SocialResponse.same_requester** [12]: For a bigger favour: the same person asks both times. Default true.
- **SocialResponse.later_day** [14]: For a bigger favour: it comes on a later day than the small one
- **SocialResponse.sequential** [19]: For a lineup: the faces are shown one at a time and the witness decides on each in turn

## Trust [86 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Trust** [41]: Record what one character did to another's trust (betrayed it, betrayed it with lies, promised to change, apologized, kept faith), or decide whether the betrayed one makes themselves vulnerable to the betrayer again (lends, confides, relies on them), before narrating it.
- **Trust.who** [7]: The one whose trust is at stake
- **Trust.other** [8]: The one who betrayed or must be trusted
- **Trust.event** options [30 words]: betrayed them | betrayed them with lies or false promises | promised to change | promised to change and apologized | kept faith once | do they trust them now?

## HoldOn [122 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **HoldOn** [26]: Decide whether a person can hang on by their hands (a ledge, a rope, a branch) or carry a load by its handles, before narrating it.
- **HoldOn.who** [3]: Character holding on
- **HoldOn.hanging** [11]: Hanging by the hands: the load is the character's own body
- **HoldOn.load_kg** [6]: Mass carried by handles, kg (carrying)
- **HoldOn.hands** [7]: Hands used, 1 or 2. Default 2.
- **HoldOn.seconds** [14]: How long the hold must last, s (until help arrives, to cross the gap)
- **HoldOn.fingertips** [12]: Only the fingertips hold: a ledge, a window sill, a narrow edge
- **HoldOn.climber** [6]: With fingertips: climbing training. Default no.
- **HoldOn.climber** options [5 words]: no | recreational | expert
- **HoldOn.region** [13]: World region the character grew up in, when known. Kept for later calls.
- **HoldOn.region** options [19 words]: Europe/North America | South America | Middle East | Africa | South East Asia | South Asia | China

## Chase [150 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Chase** [36]: Decide whether a pursuer catches someone running away over open ground, from their top speeds (each human's drawn once from untrained adults of their sex, scaled by age; other creatures from their species) and leg injuries.
- **Chase.pursuer** [2]: Character chasing
- **Chase.pursuer_species** [11]: Pursuer's species, when the engine has no record of them yet.
- **Chase.fleeing** [3]: Character running away
- **Chase.fleeing_species** [12]: Fleeing character's species, when the engine has no record of them yet.
- **Chase.gap_m** [3]: Head start, m
- **Chase.pursuer_sex** [9]: For a human pursuer missing from the engine's records
- **Chase.pursuer_sex** options [3 words]: male | female
- **Chase.fleeing_sex** [9]: For a human fleeing, missing from the engine's records
- **Chase.fleeing_sex** options [3 words]: male | female
- **Chase.pursuer_build** [12]: The pursuer's build, when the story states it (BodySize draws it otherwise)
- **Chase.pursuer_build** options [7 words]: thin | average | overweight | obese
- **Chase.fleeing_build** [13]: The fleeing character's build, when the story states it (BodySize draws it otherwise)
- **Chase.fleeing_build** options [7 words]: thin | average | overweight | obese
- **Chase.pursuer_age** [10]: For a human pursuer missing from the engine's records, years
- **Chase.fleeing_age** [10]: For a human fleeing, missing from the engine's records, years

## NewCharacter [158 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **NewCharacter** [48]: Decide the sex, age, occupation and birthplace of a character new to the story (a stranger, a passer-by, the person behind the counter), before describing them. Drawn from the 1881 census of England and Wales there; elsewhere age and sex from the country's population in the story year.
- **NewCharacter.who** [11]: Name or label for the character (e.g. "the innkeeper", "stranger 2")
- **NewCharacter.sex** [7]: Only when the story already fixes it
- **NewCharacter.sex** options [3 words]: male | female
- **NewCharacter.named_as** [26]: By meaning: what the words naming them fix, in any language (the landlady: a woman; the lad: a boy; the men by the fire: several people)
- **NewCharacter.named_as** options [23 words]: a man | a woman | a boy | a girl | a child | a person, sex not named | several people
- **NewCharacter.occupation** [17]: Only when the story already fixes it, in a word or two, as the scene names it
- **NewCharacter.min_age** [13]: Only when the story already fixes it (e.g. 18 for someone serving drinks)
- **NewCharacter.age** [10]: Only when the story states it ("her brother Will, 12")

## BodyCheck [561 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyCheck** [56]: Resolve a physical or skilled action whose outcome is in doubt, before narrating it: climbing, jumping, swimming, lifting or forcing something, balancing, sneaking, picking a lock, riding, a craft or a trade task (the other tools cover blows, falls, holds, chases, hearing, seeing, messages and people's responses). The body state in [BODY] is applied in code.
- **BodyCheck.who** [2]: Character acting
- **BodyCheck.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
- **BodyCheck.height_m** [17]: For a climb: its height, m; a failure is then a fall from where the grip went
- **BodyCheck.task** [26]: The task in a few words. A real second attempt names it ("pick lock, 2nd try"); the same task again this turn returns the first result.
- **BodyCheck.task_kind** [28]: What the task is. A task another tool decides (seeing, hearing, a blow, a chase…) goes to that tool; BodyCheck decides a skill or effort of the body.
- **BodyCheck.task_kind** options [98 words]: a skill or effort of the body (climbing, lifting, balancing, sneaking, a lock, a craft or a trade) | hearing a sound or words | seeing or searching for something or someone | swimming or staying afloat | hanging on or carrying a load by hand | catching or getting away from someone on foot | getting someone to believe, agree, give in or take a liking | armed groups attacking a defended position | a choke or strangling hold on the neck | a blow or a shot at someone | treating a wound or an injury
- **BodyCheck.reference_class** [16]: The wider class of attempts this one belongs to (e.g. "amateurs picking an old door lock")
- **BodyCheck.base_share** [8]: How many attempts in that reference class succeed.
- **BodyCheck.base_share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **BodyCheck.share** [19]: Your estimate for this attempt: how many people with this character's training succeed at it in these conditions, unhurt.
- **BodyCheck.share** options [27 words]: 80% most | 20% few | 65% more than half | 5% almost no one | 95% nearly everyone | 35% fewer than half | 50% half
- **BodyCheck.uses** [31]: Body abilities the task depends on: grasp (hands, claws that hold), stance (feet), sight, hearing, smell, breathing; alertness for tasks needing attention, judgment or quick reactions (driving, aiming, spotting, fine work).
- **BodyCheck.exertion** options [5 words]: none | light | heavy
- **BodyCheck.on_feet** [7]: The task needs standing or walking unaided
- **BodyCheck.timed** [22]: The task must be done within a tight time (a lock picked before the guard turns, a sum shouted in a race)
- **BodyCheck.fine** [19]: The task needs fine finger work with bare fingers (tying a knot, threading a needle, picking a lock, writing)
- **BodyCheck.override** [15]: Set after BodyCheck named another tool, when the task differs from what that tool decides
- **BodyCheck.gap_m** [26]: For a jump across a gap or ditch: its width, m; code works the jump out from the body, so share and base_share can go unset
- **BodyCheck.run_up_m** [14]: With gap_m: room to run before the edge, m (0 = a standing jump)
- **BodyCheck.lift_kg** [28]: For lifting a load from the floor to waist height: its mass, kg; code works the lift out from the body, so share and base_share can go unset
- **BodyCheck.shot_m** ⟨from 1350⟩ [31]: For a shot with a handgun at a person: the distance, m; code works the hit out from the distance and the target's size, so share and base_share can go unset
- **BodyCheck.shot_at** ⟨from 1350⟩ [12]: With shot_m: the tracked person shot at, whose size sets the target
- **BodyCheck.under_fire** ⟨from 1350⟩ [8]: With shot_m: the shooter is being shot at

## BodyTreat [76 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyTreat** [14]: Apply a treatment to a wound. load = putting weight on a fractured part.
- **BodyTreat.who** [2]: Character name
- **BodyTreat.wound** [12]: Wound id, for a treatment of one wound (stop_bleeding, clean, splint, load)
- **BodyTreat.treatment** options [19 words]: stop_bleeding | clean | splint | transfuse ⟨from 1901⟩ | load | antivenom ⟨from 1895⟩ | antibiotics ⟨from 1941⟩ | laparotomy ⟨from 1809⟩ | oxygen ⟨from 1917⟩ | hyperbaric_oxygen ⟨from 1956⟩
- **BodyTreat.training** [24]: For stop_bleeding: untrained (a lay person), instructions (told how, in writing or aloud), trained (taught to stop bleeding: a medic, a surgeon). Default untrained.
- **BodyTreat.training** options [5 words]: untrained | instructions | trained

## BodyContact [75 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyContact** [22]: Skin touches something hot (a stove, a pot handle, spilled hot water or oil) for a stated time. Code decides any burn.
- **BodyContact.who** [2]: Character name
- **BodyContact.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
- **BodyContact.regions** [4]: Body regions touching it
- **BodyContact.material** options [17 words]: steel | iron | copper | aluminium ⟨from 1886⟩ | glass | stone | wood | water | oil
- **BodyContact.temp_c** [7]: Temperature of the object or liquid, °C
- **BodyContact.seconds** [4]: Contact time in seconds

## PassTime [158 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **PassTime** [49]: Advance story time for every tracked character. Call before narrating any time passing. List who is active (working, fighting) and who sleeps; walkers go in walking with speed, load, slope and terrain. Time stops early when someone's condition changes; narrate that moment, then call again for the remaining minutes.
- **PassTime.minutes** [3]: Minutes that pass
- **PassTime.resting** [6]: Characters at rest during this time
- **PassTime.active** [15]: Characters walking, working, fighting or in heat during this time (more water and food used)
- **PassTime.sleeping** [5]: Characters asleep during this time
- **PassTime.walking** [20]: Characters walking or marching during this time, with pace, load and ground; sets their energy use, heat and distance covered
- **PassTime.walking.who** [1]: Character
- **PassTime.walking.speed_kmh** [23]: Walking speed, km/h, when the story sets it (stroll 3, brisk 6.5). Default: the normal pace for the slope, ground, age and sex
- **PassTime.walking.load_kg** [3]: Carried load, kg
- **PassTime.walking.grade_pct** [4]: Slope, % (uphill positive)
- **PassTime.walking.terrain** options [27 words]: road | dirt road | light brush | heavy brush | swamp | loose sand | snow 15 cm | snow 25 cm | snow 35 cm
- **PassTime.walking.running** [2]: Running pace

## Act [520 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Act** [87]: Time characters' physical actions before narrating them, and move the story clock by exactly that time. Give who, action (the action in plain words: "steps out onto the street", "sits down at a table") and distance_m for any walking; for several characters at the same time, actors, each with who, action and distance_m. steps is the exact form: walking between spots, sitting, standing, bending, kneeling, turning, reaching, grasping. Narrate the times it gives. Record where a character is with be_at; a walking distance is kept once given.
- **Act.who** [4]: Character acting (one actor)
- **Act.actors** [11]: Several characters acting at the same time, each with their steps
- **Act.actors.who** [1]: Character
- **Act.actors.action** [12]: The action in plain words, beginning with its motion or posture verb
- **Act.actors.distance_m** [3]: Walking distance, m
- **Act.actors.steps.pace** [11]: With walk_to: the pace (brisk: hurrying, the fastest walk). Default walk.
- **Act.actors.steps.pace** options [9 words]: walk | creep | brisk | run | sprint
- **Act.actors.steps.do** options [33 words]: be_at | walk_to | stairs_up | stairs_down | sit | stand | bend | kneel | arise | kneel_both | arise_both | turn | sidestep | reach | grasp | release | look
- **Act.actors.steps.to** [22]: Spot, named with its place in the scene's words: "<place>: <part>" (a house and its room or door), or a street's name
- **Act.actors.steps.distance_m** [15]: Walking distance to the spot, m, from the scene's layout; needed only the first time
- **Act.actors.steps.cm** [3]: Reach distance, cm
- **Act.actors.steps.grade_pct** [8]: Slope or stairs, % (a staircase about 60)
- **Act.actors.steps.load_kg** [3]: Load carried, kg
- **Act.actors.steps.crowd_per_m2** [16]: People per m² on the way when crowded (busy street 0.5, packed market 2, crush 3.5)
- **Act.actors.steps.steps** [9]: For stairs: number of steps (a storey about 16)
- **Act.actors.steps.riser_cm** [16]: For stairs: step height, cm, when the story sets it (steep old stair 20, modern 17)
- **Act.actors.steps.tread_cm** [5]: For stairs: step depth, cm
- **Act.steps** [5]: Actions in order (one actor)
- **Act.steps.pace** [11]: With walk_to: the pace (brisk: hurrying, the fastest walk). Default walk.
- **Act.steps.pace** options [9 words]: walk | creep | brisk | run | sprint
- **Act.steps.do** options [33 words]: be_at | walk_to | stairs_up | stairs_down | sit | stand | bend | kneel | arise | kneel_both | arise_both | turn | sidestep | reach | grasp | release | look
- **Act.steps.to** [22]: Spot, named with its place in the scene's words: "<place>: <part>" (a house and its room or door), or a street's name
- **Act.steps.distance_m** [15]: Walking distance to the spot, m, from the scene's layout; needed only the first time
- **Act.steps.cm** [3]: Reach distance, cm
- **Act.steps.grade_pct** [8]: Slope or stairs, % (a staircase about 60)
- **Act.steps.load_kg** [3]: Load carried, kg
- **Act.steps.crowd_per_m2** [16]: People per m² on the way when crowded (busy street 0.5, packed market 2, crush 3.5)
- **Act.steps.steps** [9]: For stairs: number of steps (a storey about 16)
- **Act.steps.riser_cm** [16]: For stairs: step height, cm, when the story sets it (steep old stair 20, modern 17)
- **Act.steps.tread_cm** [5]: For stairs: step depth, cm
- **Act.action** [38]: For one actor, the action in plain words, beginning with its motion or posture verb (an alternative to steps) ("steps out of the house onto the street", "sits down", "stands up and crosses the room"); walking needs distance_m
- **Act.distance_m** [9]: With action: the walking distance, m, from the scene
- **Act.level** [9]: By meaning: whether the action climbs, jumps or drops
- **Act.level** options [15 words]: on the level, stairs or a change of posture | a climb, jump or drop
- **Act.pace** [17]: By meaning: the pace of the walking in the action (brisk: hurrying, the fastest walk). Default walk.
- **Act.pace** options [9 words]: walk | creep | brisk | run | sprint

## Room [414 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Room** [80]: Set up or change the air of an enclosed space (a room, a cellar, a tent, a mine gallery) when its air matters: a fire, a stove or a lamp burning inside, many people in a closed room, gas filling it; or decide how a crowd gets out through one exit. Characters whose spot (Act be_at / walk_to) is this room breathe its air every minute: carbon monoxide, carbon dioxide, oxygen. Call again when a fire starts or goes out.
- **Room.room** [9]: The spot name, as used in Act ("<place>: <part>")
- **Room.volume_m3** [28]: Volume, m³ (floor area × ceiling height; a 4 × 4 m room with a 2.5 m ceiling is 40). Needed the first time, or floor_m2 and height_m.
- **Room.floor_m2** [10]: Floor area, m² (needed for a fire's heat and smoke)
- **Room.height_m** [10]: Ceiling height, m (needed for a fire's heat and smoke)
- **Room.lining** [10]: What the walls and ceiling are made of. Default brick.
- **Room.lining** options [13 words]: concrete | brick | gypsum board ⟨from 1916⟩ | wood | stone | lime plaster
- **Room.opening_m2** [17]: Area of an open door or window, m² (a door about 1.6; 0 when all are shut)
- **Room.opening_height_m** [9]: Height of that opening, m (a door about 2)
- **Room.doorways** [21]: Open doorways from this room into other rooms set up with Room (replaces this room's list; empty when all are shut)
- **Room.doorways.room** [3]: The other room
- **Room.doorways.m2** [7]: Opening area, m² (a door about 1.6)
- **Room.doorways.height_m** [7]: Opening height, m (a door about 2)
- **Room.air_changes_per_hour** [22]: Only when the story sets it (sealed 0, window wide open about 5); otherwise code draws a house's typical leak rate once
- **Room.air_c** [6]: Air temperature inside, °C. Default 20.
- **Room.people** [20]: People in the room besides the tracked characters (drinkers in a tavern, a congregation); their talk sets the room's noise
- **Room.exit_width_m** [22]: When everyone in the room tries to get out through one exit: its width, m (a house door 0.8–0.9, double doors 1.6–2)
- **Room.exit_pace** [12]: With exit_width_m: how hard the crowd presses toward the exit. Default normal.
- **Room.exit_pace** options [17 words]: relaxed (0.6 m/s) | normal (1 m/s) | nervous, hurrying (1.5 m/s) | panic, pushing (5 m/s)
- **Room.outdoor_co2_ppm** [12]: Carbon dioxide outside, ppm. Default 420 (present day); about 280 before 1800.
- **Room.fires** [10]: What burns inside now (an empty list: every fire out)
- **Room.fires.fuel** [19]: wood, charcoal, peat, lignite, bituminous coal, or a compound burnt in a lamp or burner, by name (ethanol, methane)
- **Room.fires.kg_per_hour** [21]: Fuel burnt per hour, kg (a brazier about 0.5–1 kg/h of charcoal, an open wood fire 1–3, an oil lamp 0.01)
- **Room.fires.co_g_per_kg** [12]: Carbon monoxide per kg burnt, when known; otherwise the measured household-stove value
- **Room.fires.moisture_pct** [17]: For wood and other solid fuels: water, % of wet weight (seasoned 20, green 50). Default 20.

## Dose [69 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Dose** [39]: Record a medicine given to a character, when the story has it given (an injection, an anaesthetic); its effects over the next 90 minutes then follow: pulse, blood pressure, breathing, sedation, muscle block. Time passes with PassTime or Act.
- **Dose.who** [4]: Character given the medicine
- **Dose.substance** [11]: Medicine and route (IM into a muscle, IV into a vein)
- **Dose.substance** options [13 words]: Midazolam:IM ⟨from 1982⟩ | Lorazepam:IM ⟨from 1977⟩ | Ketamine:IM ⟨from 1970⟩ | Propofol:IV ⟨from 1986⟩ | Succinylcholine:IM ⟨from 1951⟩ | Rocuronium:IV ⟨from 1994⟩ | Epinephrine:IM ⟨from 1901⟩
- **Dose.mg** [2]: Dose, mg

## Layout [115 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Layout** [49]: Place spots and rooms on the scene's plan, in metres, once the story fixes where things are: then walking distances, room sizes, who can hear or see whom through walls come from the plan. x east, y north from any corner of the scene; floor 0 the ground floor.
- **Layout.spots** [4]: Spots with their position
- **Layout.spots.spot** [8]: Spot name, as used in Act ("<place>: <part>")
- **Layout.spots.x_m** [2]: x, m
- **Layout.spots.y_m** [2]: y, m
- **Layout.spots.floor** [10]: Floor number (0 ground, 1 first, -1 cellar). Default 0.
- **Layout.spots.room** [10]: The room it is in, when it has an outline
- **Layout.rooms** [4]: Rooms by their corners
- **Layout.rooms.room** [10]: Room name (also usable as a spot and in Room)
- **Layout.rooms.corners** [7]: Corners [[x, y], …] in order, m
- **Layout.rooms.floor** [4]: Floor number. Default 0.
- **Layout.rooms.height_m** [5]: Ceiling height, m. Default 2.5.

## CastSpell [12 words] · magic only — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **CastSpell** [7]: Resolve a spell cast before narrating it.
- **CastSpell.who** [2]: Caster name
- **CastSpell.complexity** [3]: Spell complexity 1-9

## Break [183 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **Break** [46]: Decide whether a thing gives way under a load before narrating it: a plank or beam someone stands or jumps on, a shelf, a rope someone hangs from, an iron bar or chain link pulled. Code compares the load with the material's strength for that shape.
- **Break.material** [5]: What it is made of
- **Break.material** options [71 words]: oak (red) | oak (white) | pine (eastern white) | fir (Douglas) | ash (white) | elm (American) | mild steel ⟨from 1856⟩ | wrought iron | iron (pure) | cast iron (grey) | copper | lead | glass (window) | brick (common clay) | limestone | granite | concrete | lime plaster | gypsum board ⟨from 1916⟩ | hemp or manila rope | wool cloth (heavy curtain) | leather | bone (cortical) | skin
- **Break.shape** [2]: Its shape
- **Break.shape** options [9 words]: plank or beam | rope | rod or bar
- **Break.width_cm** [5]: Plank or beam: width, cm
- **Break.thickness_cm** [9]: Plank or beam: thickness (depth under the load), cm
- **Break.span_m** [13]: Plank or beam: distance between its supports, m (the load at the middle)
- **Break.diameter_mm** [6]: Rope, rod or bar: diameter, mm
- **Break.load_kg** [17]: The load, kg (a person's mass; twice it for a jump or a drop onto it [ASSUMED])

## BodyFall [104 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyFall** [7]: Resolve a fall before narrating its outcome.
- **BodyFall.who** [2]: Character name
- **BodyFall.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
- **BodyFall.height_m** [3]: Height fallen, m
- **BodyFall.soft** [5]: Soft ground: water, snow, foliage
- **BodyFall.head_first** [3]: Landed head first
- **BodyFall.age** [5]: Age in years, when known
- **BodyFall.ground** [8]: What the feet land on. Default packed earth.
- **BodyFall.ground** options [16 words]: stone | paving | packed earth | earth | grass | sand | snow | water
- **BodyFall.stiff_legs** [10]: Lands with straight legs (taken by surprise); default: knees bend
- **BodyFall.slip** [26]: A slip or trip on level ground (ice, a wet floor): the body goes down from its own height, not onto the feet; give height_m 0

## BodyStatus [28 words] — read by the planner (routed tools) and narrator (the line's tools, when the question pass did not run)

- **BodyStatus** [7]: Read a character's body and network state.
- **BodyStatus.who** [2]: Character name
- **BodyStatus.species** [19]: Species of this character, as a creature name (human, horse, wolf); read when the character first appears. Default human.
