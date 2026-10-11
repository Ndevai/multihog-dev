// With the rules engine on, these texts replace the D&D sections of the narrator prompt and the
// D&D block formats of the State Tracker. Body state (wounds, blood, network energy) belongs to the
// rule engine and reaches both models only through the code-written [BODY] block.

const CHARACTER_FIELDS = `Species: the Dwarf Fortress creature (human, dwarf, elf, goblin, wolf, horse…)
Languages: the languages the character speaks or understands, comma-separated; omit for creatures that cannot talk
Training: fighting skill as a Dwarf Fortress level (Dabbling, Novice, Adequate, Competent, Skilled, Proficient, Talented, Adept, Expert, Professional, Accomplished, Great, Master, High Master, Grand Master, Legendary); each other trained activity with its level (e.g. climbing trained)
Senses: senses beyond sight and hearing, each with its range in m; omit the line when there are none
Affinities: affinity channels by name (fire, water, earth, air, wood, gold, metal); omit the line for non-casters
Conditions: lasting states [BODY] does not hold, each with its duration or end event (e.g. bound, until untied)`;

// Party members have no [SPELLS] block of their own, so their profile lists spells.
const PROFILE_FIELDS = `${CHARACTER_FIELDS}
Spells: Spell name (School, complexity N), one entry per spell known; omit the line for non-casters`;

const BODY_NOTE = 'Wounds, blood, abilities and network energy are written by code in [BODY]; this block holds only the fields above.';

/** Sections with no rules-engine counterpart are omitted; the rest get rules-engine text. */
export const RULES_DROPPED_SECTIONS = new Set([
    'weapon_proficiencies', 'attacks_per_round', 'saving_throws', 'xp_system', 'level_up_protocol', 'homebrew_and_custom_classes',
]);

export const RULES_SECTIONS: Record<string, string> = {
    role: `Narrator and world simulator. Narrate the world, simulate NPCs and apply the rules of this prompt and the rule-engine tools. In a fight, simulate every NPC's actions (not {{user}}'s) in the order they happen in time.`,

    combat: `<combatants>
When a combatant first appears, declare its body mass in kg, its fighting training (untrained, trained or elite), its weapons and any sense beyond sight and hearing with its range. Use these values in every rule-tool call for that combatant.
A returning named NPC with a lorebook combat profile keeps that profile; change it only on an established change (new weapon, injury, training) and declare the update.
</combatants>

<time_and_distance>
Actions happen in time order: a combatant's next action starts when its previous one ends. Track distances in metres; they are the distance_m of the next strike.
</time_and_distance>

<bodies>
Every body, enemy or ally, follows the same body rules; size enters through mass. Read each fighter's capacity from [BODY]: blood-loss class III walks only with help, class IV collapses, and a part whose scores are 0 does nothing (a broken arm holds no weapon). A fighter acts as long as the body allows.
</bodies>

<danger>
A fight's danger follows from what the story establishes: numbers, mass, training, weapons, position. Opponents are as strong as the world makes them, whatever {{user}} can handle; taking on a fight beyond them is {{user}}'s call.
</danger>`,

    loot: `- On finding an item, pop a d20: 1–5 Junk/broken | 6–10 Common | 11–15 Useful/quality | 16–19 Rare/notable | 20 Exceptional.
- Always roll the main and quality roll in one batch. If first roll is too low to find loot, discard the second.
- Narrate the tier, what the item physically is (material, make, condition; for a weapon its kind: blade, blunt, bow, firearm) and its approximate value for the Tracker. For a magic item: its school, complexity and activation condition when known.
- Use narrative consistency/logic for the loot range. For instance, a bandit camp shouldn't have amazing loot even with a high roll.`,

    resting: `Rest and sleep pass through PassTime with the minutes and the characters resting; network energy recovers only during hours without casting or fighting. In a dangerous place, a tier table with the odds the danger sets decides whether the rest is interrupted; time then runs only up to the interruption.`,

    constraints: `<resolution_constraints>
Never skip/reinterpret a roll. Failures need real, logical consequences — no roundabout success after a fail. A second attempt after failure is allowed only with a genuinely different approach; otherwise reject and prompt another action.
</resolution_constraints>
<spatial_and_entity_constraints>
Out-of-range attack attempt → note {{user}} couldn't attack due to range; ask for another action. Max active [PARTY] size = 5 + {{user}} (no more added); cap doesn't apply to [BENCHED PARTY].
</spatial_and_entity_constraints>
<inventory_and_resource_constraints>
An item exists only when [INVENTORY] or the scene holds it; otherwise narrate the lack. Equip/unequip is always narrated explicitly; Gear items without [E] are carried, not worn or held. Equipment works only through a body that can use it: a part listed as not working in [BODY] uses nothing, and a creature without grasp holds nothing in hand. Impossible equips are blocked and narrated; awkward ones work with their physical consequences.
</inventory_and_resource_constraints>
<cheese_and_abuse>
If the player is clearly abusing the rules to get something like infinite energy or immortality, stop them and create a narrative reason why it doesn't work.
</cheese_and_abuse>`,

    state_memo: `- ## TRACKER STATE 0 (Current) - passed every turn, is mechanical law.
- TRACKER STATE 0 is the authoritative, read-only state at the start of the current turn and already accounts for all prior events; [BODY] in it comes from the rule engine. Take its values as they stand: the tracker and the engine do the accounting. Narrate the use of an item only when TRACKER STATE 0 shows it is there (e.g. an arrow left in the quiver).`,

    end_of_output_footer: `ALWAYS end every output (even after tool chains) with:
*(Status: [{{user}}'s wounds and blood-loss class from BODY, a few words]) | (Location: [Main, Sub, Sub-sub, etc])*
*[HH:MM AM/PM], Day [X]*
Footer shows ONLY {{user}}'s status and location — never party/NPC status or names.
Location is coarse-to-fine and may be four or more tiers.

- For an unmapped settlement building use Settlement, District, Building.
- Never refer to unmapped BUILDINGs positionally in the footer (e.g. "Main Street, General Store rear loading dock".) Either "Main Street" or "Main Street, General Store" if actually inside.`,
};

/** Profile a joining member is declared with; the bench rules of the section follow it unchanged. */
export const RULES_PARTY_JOIN = `On joining: state *(Name joins the party)* and declare their profile:
[PARTY]
Name (N kg)
${PROFILE_FIELDS}
[/PARTY]`;

/** The user's extension settings this module reads. */
type Settings = Record<string, any>;
/**
 * Rules-engine form of one base sysprompt section: { final } is the finished section ('' = omitted),
 * { inner } replaces the section body before the usual transforms, null leaves the section as it is.
 */
export function rulesSection(tag: string, innerContent: string, settings: Settings | null | undefined, useQueue: boolean): { final: string } | { inner: string } | null {
    if (!settings?.rulesEngine) return null;
    if (RULES_DROPPED_SECTIONS.has(tag)) return { final: '' };
    if (tag === 'rng_system') {
        return { final: rulesRngSystem({ rngEnabled: !!settings.rngEnabled, useQueue, d100Mode: !!settings.diceD100Mode }) };
    }
    if (tag === '[PARTY]_mechanics') {
        const at = String(innerContent).search(/<leaving_vs_benching>/i);
        return { inner: at < 0 ? RULES_PARTY_JOIN : `${RULES_PARTY_JOIN}\n\n${String(innerContent).slice(at).trim()}` };
    }
    return tag in RULES_SECTIONS ? { inner: RULES_SECTIONS[tag] } : null;
}

/** rng_system: checks through BodyCheck in every mode; dice only for quantities and tier tables. */
export function rulesRngSystem({ rngEnabled, useQueue, d100Mode }: { rngEnabled: boolean; useQueue: boolean; d100Mode: boolean }): string {
    const die = d100Mode ? 'd100' : 'd20';
    const tool = d100Mode ? 'RollTheDiceD100' : 'RollTheDice';
    const checks = `Every check goes through BodyCheck: an action whose outcome is uncertain and that no other rule tool resolves.
- share = the fraction of people with the actor's training who would succeed at this task in these conditions, unhurt. The tool applies the body state.
- Narrate the returned verdict. Write each check as *(Climb: 60% → SUCCESS)* with the returned chance.`;
    let dice;
    if (!rngEnabled) dice = `Quantities and tier tables: simulate a fair ${die} internally.`;
    else if (!useQueue) dice = `Quantities: ${tool} kind "amount". Loot, random events and other tier tables: ${tool} kind "table"; narrate the returned tier. For several independent rolls, issue parallel calls in the same turn, each with its own "for".`;
    else {
        const queue = d100Mode ? '[RNG_QUEUE_d100 v7.0]' : '[RNG_QUEUE v7.0]';
        dice = `${queue} supplies quantities and tier tables — internal physics, never revealed or explained. Pop lines in order (1, 2, 3...); each line has labeled dice (${die}=, d4=, d6=, d8=, d10=, d12=); queue length ${d100Mode ? 30 : 12}, wraps on exhaustion. Reveal a roll only right before it appears in the narrative. No queue provided → simulate a fair ${die} internally.`;
    }
    return `<rng_system>\n${checks}\n\n${dice}\n</rng_system>`;
}

export const RULES_TRACKER_PROMPTS = {
    character: `{{user}}'s lasting facts that the rule tools and checks take as input. Use this format:
[CHARACTER]
{{user}} (N kg)
${CHARACTER_FIELDS}
[/CHARACTER]

Body mass in kg is set once from the character's build and changes only when the story changes it (starvation, growth). Training changes only when the story establishes training or long practice.
${BODY_NOTE}`,

    party: `Companion/Party members. Use this format for each member:
Name (N kg)
${PROFILE_FIELDS}

[PARTY] is the active roster (max 5 + {{user}}). Temporary separations go through [BENCHED PARTY] with [BENCH]/[UNBENCH]: a benched member stays in [PARTY] for code to move, and a turn whose only roster change is a bench outputs [BENCH] alone. With [BENCHED PARTY] disabled, separations are narration only.

TRIGGERS:
- ADD a member when you see (X joins the party.)
- REMOVE a member only on the exact annotation *(Left the party: X — reason)*, from whichever block holds them. Narration alone, however final, keeps the member.

PERSISTENCE: When [PARTY] changes, output the whole block with every remaining member; when it is unchanged, leave it out.
${BODY_NOTE}`,

    'benched party': `Members temporarily separated from {{user}} while reunion remains plausible. Code moves their full [PARTY] profile; this block holds only commands.

Output [BENCHED PARTY] only on a turn with a bench or unbench, and close it with \`[/BENCHED PARTY]\`. Code handles the roster move; on that turn output [PARTY] only for real changes to other members (training, conditions), leaving the benched or unbenched member out of it.

One command per line inside the block:
- [BENCH] Name — reason   — member separates. Name may be the first name only or the full header. Reason required; derive it from the narrative.
- [UNBENCH] Name — member reunites with {{user}} on-screen.

Infer benching and reunion from the narrative. Bench only on a clear separation; a brief absence from a scene stays in [PARTY] (a missed bench self-heals on a later turn, a wrong one does not).

Permanent removal uses *(Left the party: Name — reason)* from the [PARTY] module; someone who leaves without that string is benched.

Example (bench only, no [PARTY] output):
[BENCHED PARTY]
[BENCH] Name — stayed at the lodging to rest
[/BENCHED PARTY]

Example (reunite only):
[BENCHED PARTY]
[UNBENCH] Name
[/BENCHED PARTY]

Bench ETAs: when the narrative states when a character returns (a day, a duration, "back by X"), append it as [BENCH] Name — reason — ETA: [when], an explicit timestamp such as "Day 1, HH:MM" or "17/10/2002, HH:MM". Without such a signal the line ends after the reason. [UNBENCH] only when the character physically reunites with {{user}}, whatever the ETA says.`,

    combat: `Combatants other than {{user}} and [PARTY] members, while a fight lasts.

ENEMIES:
Name (N kg)
Species: the Dwarf Fortress creature
Training: fighting skill as a Dwarf Fortress level (Dabbling … Legendary)
Weapons: what the combatant fights with (punch, kick, bite, a melee weapon with its metal, bow, firearm)
Senses: senses beyond sight and hearing, each with its range in m; omit the line when there are none
Spells: Spell name (School, complexity N); omit the line for non-casters
Distance: metres from {{user}}
Status: Fighting | Defeated | Fled | Surrendered

NON-PARTY ALLIES:
(the same fields)

- Record mass, training, weapons and senses from the narrator's declaration when the combatant first appears; they stay as declared afterwards.
- Update Distance whenever the narrative moves someone.
- COMBAT SIDES: ENEMIES: first, then NON-PARTY ALLIES: when there are allied combatants who are not in [PARTY]. Every [PARTY] member stays in [PARTY].
- DEFEATED COMBATANTS: keep each defeated combatant in the block with Status: Defeated.
${BODY_NOTE}

You MUST output \`[COMBAT]END_COMBAT[/COMBAT]\` when the narrative ends combat.`,

    inventory: `Items, equipment and wealth. You MAY create this section if items are found and it doesn't currently exist.

Organize into two sections using plain-text headers:
- Gear: — weapons, armour, and worn/equipped items
- Other Items: — tools, supplies, miscellaneous loot, and currency

FORMAT FOR EVERY ITEM: thematic emoji, rarity tag ([Common], [Uncommon], [Rare], [Epic], [Legendary] or [Artifact]: how hard it is to find), name, then in parentheses what it physically is (material, make; for a weapon its kind: blade, blunt, bow, firearm), then the estimated worth (~X currency fitting the world).
- Magic items add their school, complexity and activation condition when known: (bone wand; Healing, complexity 2; activates on a spoken word).
- Bare currency goes under Other Items without a rarity tag: "💰" for coins, "💵" for paper money.

WORN PROTECTION: for each worn item that covers the body, the parentheses also state which body parts and sub-locations it covers (head: forehead, crown, nape; arms: shoulder, upper arm, elbow, forearm; hands: wrist, palm, back; legs: hip, thigh, knee, shin; feet: sole, arch, ankle, heel) for a held item (shield, buckler) its size in cm and the hand holding it, the sides it covers when only one (front or back), and any holes, gaps or damage with their place (iron helm, forehead and crown, open at the nape; iron breastplate, front only; leather jerkin, left sleeve torn off).

EQUIPPED ITEMS: Tag any actively worn or held item with [E] immediately after the rarity tag. An item in 'Gear:' without [E] is carried, not worn or held.

CONTAINERS: list each item inside a bag, chest or other container on its own line directly under that container, indented by two spaces; the container's line holds only the container itself.

Example format:
[INVENTORY]
Gear:
- 🗡️ [Common] [E] Item name (steel blade) (~X currency)
Other Items:
- 🎒 [Common] Item name (leather backpack) (~X currency)
  - 🪢 [Common] Item name (hemp rope, 15 m) (~X currency)
- 💰 N coins
[/INVENTORY]`,

    spells: `Spells known, one per line: \`Spell name (School, complexity N)\`. Complexity 0 = cantrip. Network energy and stage are written by code in [BODY].

Example format:
[SPELLS]
Spell name (School, complexity N)
[/SPELLS]`,
};

/** [TIME] prompt in the active clock and calendar format; the last waking time feeds the sleep need. */
export function rulesTimePrompt(settings: Settings): string {
    const clock = settings.use24hTime ? 'HH:MM' : 'HH:MM AM/PM';
    const date = settings.useDdMmYyFormat ? 'DD/MM/YYYY' : 'Day N';
    return `Current time and day grabbed from the status footer, and the time {{user}} last woke. Update condition durations by comparing to the PRIOR MEMO's time.

Format${settings.use24hTime ? ' (24-hour clock, NO AM/PM)' : ''}:
Last Woke: ${clock}, ${date}
Current Time: ${clock}, ${date}`;
}

/** RollTheDice / RollTheDiceD100 schema parts: quantities and tier tables; checks go through BodyCheck. */
export function rulesDiceSpec(d100: boolean) {
    return {
        description: 'Rolls dice and returns the result. kind "amount": quantities. kind "table": loot, random events and other tier tables; the returned tier is binding. Checks go through BodyCheck. One formula per invocation; for several independent rolls, issue parallel invocations in the same turn.',
        kind: { type: 'string', enum: ['amount', 'table'], description: '"amount": a quantity. "table": tier table, pass table; the tier is returned.' },
        formula: { type: 'string', description: `ONE dice formula per invocation, e.g. "${d100 ? '1d100' : '1d20'}", "2d6". For several independent rolls, issue parallel invocations in the same turn.` },
        for: { type: 'string', description: 'What is being rolled for, 1-4 words, unique within this turn. For repeated rolls name the target and count, e.g. "loot 2 chest". A repeated who + for returns the first result.' },
    };
}

/** Modules with no rules-engine counterpart are off whatever the user's toggles say. */
export const RULES_OFF_MODULES = ['xp', 'abilities'];

export function effectiveModules(settings: Settings | null | undefined): Record<string, boolean> {
    const mods = { ...(settings?.modules || {}) };
    if (settings?.rulesEngine) for (const k of RULES_OFF_MODULES) mods[k] = false;
    return mods;
}

const TRACKER_BLOCKS: Record<string, [string, string]> = {
    buff_debuff_logic: ['conditions', `Record each condition with its duration in story time (e.g. 1h 30m) or its end event (e.g. until untied). Remove it when the time has passed, comparing the current [TIME] with the PRIOR MEMO's, or when its end event happens. Prefix conditions that help with (+) and conditions that hinder with (-).`],
    progression_logic: ['progression', 'Training and spells known change only when the narrative establishes training, study or long practice.'],
    list_formatting: ['list_formatting', 'For list sections ([INVENTORY], [SPELLS]): one item per line, in the item format of its module.'],
};

/** The State Tracker core prompt with its D&D parts replaced by rules-engine ones. */
export function rulesTrackerTemplate(template: string | null | undefined): string {
    let out = String(template || '');
    for (const [tag, [newTag, text]] of Object.entries(TRACKER_BLOCKS)) {
        out = out.replace(new RegExp(`<${tag}>[\\s\\S]*?</${tag}>`), `<${newTag}>\n${text}\n</${newTag}>`);
    }
    return out
        .replace(/^INTEGRATION:.*$/m, 'INTEGRATION: Track all durations stated by the narrative in story time; elapsed time is the delta between the current [TIME] and the [TIME] in the PRIOR MEMO.')
        .replace(/^(\d+\.\s*)Decrement\/increment resources such as spell slots.*$/m, '$1Change item counts (arrows, rations, coins) when the narrative spends or gains them, even when it states no count.');
}

/** Character-creation instructions in place of levels, classes and stat scaling. */
export const RULES_CREATION = 'This world has no levels, hit points or attribute scores. Describe the character through the module formats below: body mass in kg, species (a Dwarf Fortress creature), languages, fighting skill as a Dwarf Fortress level (Dabbling to Legendary) and other training, senses, affinities, spells known, and worn gear with its material and the parts it covers.';

export const RULES_ARCHETYPES = {
    magic: 'spellcaster', melee: 'melee fighter', rogue: 'rogue or thief', professional: 'professional specialist',
    survivor: 'survivor', scholar: 'scholar', scifi_pilot: 'pilot', scifi_engineer: 'engineer', scifi_marine: 'soldier',
    horror_investigator: 'investigator', horror_occultist: 'occultist', horror_survivor: 'survivor',
};

export const RULES_CYOA_EXAMPLES = {
    high: [
        '1. 🗡️ Stab the lookout in the back while he faces the sea — [Strike: dagger stab, Competent]',
        '2. 💣 Throw a Smoke Bomb — [-1 Smoke Bomb]',
        '3. 🥷 Slip along the hull\'s shadows — [Stealth (trained) 60%]',
        '4. 🗣️ Shout a warning to the rest of your crew',
        '5. 🛰️ Try to talk the hostile crew into standing down — [Persuasion (untrained) 25%]',
        '6. 🔥 Cast a complexity-2 spell at the rigging — [64 PE]',
        '7. 🚪 Back away and hope the standoff cools down',
    ],
    low: [
        '1. 🍺 Buy a round for the table and swap stories — [-20 GP]',
        '2. 🗣️ "What happened to your face? That\'s the longest scar I\'ve seen."',
        '3. 🎵 Hum along to the tune the bard is playing',
        '4. 📜 Show him the bounty notice from your pack — [Intimidation (trained) 70%] (evidence raises the chance)',
        '5. ♣️ Join the card game at the corner table — [Bluff (untrained) 15%] (experienced players)',
        '6. 🚪 Excuse yourself and head back to your ship',
        '7. 🕖 Spend the evening drinking because why the hell not? — [5-hour timeskip]',
    ],
};
