// Player lines and the tools code must route each to (src/rules/router.ts), checked without the model.
// Usage: npx tsc -p . && node tests/route.test.mjs   (prints each miss; exits 1 on any)
const { routeTurn } = await import('../src/rules/router.js');
const { stepsFromWords, distanceIn } = await import('../src/rules/actions.js');
// [player line, tools it needs, tools it must leave out]
const CASES = [
    // The test stories (tools/run-story.mjs).
    ['I step out of my house onto the street.', ['Act'], ['Communicate', 'BodyStrike']],
    ['I walk the three hundred yards to the market on Wentworth Street.', ['Act'], ['Communicate']],
    ['I ask the costermonger for a pound of apples and pay him.', ['Price', 'Transfer', 'Communicate'], ['Act', 'BodyStrike']],
    ['I walk home and give Will one of the apples.', ['Act', 'Transfer'], []],
    ['I sit down at a table near the fire.', ['Act'], ['Communicate']],
    ['I call to the innkeeper for a pint of ale.', ['Communicate', 'Price'], ['Act']],
    ['Two men at the next table are whispering. I keep still and listen.', ['Listen'], ['Act']],
    ['I go to the innkeeper and tell him what I heard.', ['Act', 'Communicate'], []],
    ['I climb the wall.', ['BodyCheck'], ['Communicate', 'Act']],
    ['I drop down into the garden on the other side and wait in the shadow of the hedge.', ['BodyFall', 'PassTime'], ['Communicate']],
    ['I creep across the lawn to the lit window.', ['Act'], ['Communicate']],
    ['I look through the window to see who is inside.', ['Look'], ['Communicate']],
    // Other lines of the same classes.
    ['"Good evening," I say to the guard.', ['Communicate', 'Interpret'], ['Act']],
    ['"Get out of my house!"', ['Communicate', 'Interpret'], ['Act']],
    // Phrases that name another act than their verb; acts not done; intent; pretence.
    ['I hold my breath and dive into the river.', ['BodyEnvironment'], ['HoldOn', 'Look']],
    ['I take a deep breath.', [], ['Transfer']],
    ['I draw a deep breath.', [], ['Act', 'Break']],
    ['I take a long breather.', ['PassTime'], ['Transfer']],
    ['I take a quick bow.', [], ['Transfer']],
    ['I catch my breath.', [], ['Transfer']],
    ['I jump into the icy river.', ['BodyEnvironment'], []],
    ['I tie a tourniquet around his leg.', ['BodyTreat'], []],
    ['I try to pick the lock.', ['BodyCheck'], ['BodyIntake', 'Transfer']],
    ['I keep watch through the night.', ['Look', 'PassTime'], []],
    ['I cast a fireball at the goblins.', ['CastSpell'], []],
    ['I cast a glance at the door.', [], ['CastSpell']],
    ['I shoot the deer with my bow.', ['BodyStrike'], ['Substance']],
    // A handgun shot is BodyCheck's (shot_m; rules-tools.ts, "A handgun shot → BodyCheck with shot_m").
    ['I shoot the guard with my pistol.', ['BodyCheck', 'BodyStrike'], ['Substance']],
    // A shot routed by its FrameNet frame names both tools (verbs.ts SHOT); fire with a person or a thing heated as its object
    // is no shot (FrameNet Firing; notAShot); the set phrases of fire.
    ['I fire my pistol at the guard.', ['BodyCheck', 'BodyStrike'], []],
    ['I take a shot at the guard with my pistol.', ['BodyCheck', 'BodyStrike'], []],
    ['I fire the cook.', [], ['BodyStrike', 'BodyCheck']],
    ['I fire the kiln.', [], ['BodyStrike', 'BodyCheck']],
    ['I fire up the stove.', [], ['BodyStrike', 'BodyCheck']],
    ['I fire up the generator.', [], ['BodyStrike', 'BodyCheck']],
    ['I open fire on the soldiers.', ['BodyCheck', 'BodyStrike'], []],
    ['I return fire.', ['BodyCheck', 'BodyStrike'], ['Transfer', 'Act']],
    ['I hold my fire.', [], ['HoldOn']],
    ['I gun him down.', ['BodyCheck', 'BodyStrike'], []],
    ['I take a shot of whiskey.', [], ['BodyStrike', 'BodyCheck']],
    // A verb's senses the line can mean, by what its object is (senses.ts: VerbNet's selectional restrictions, WordNet's kinds).
    ['I charge the cook two shillings.', ['Price'], ['BodyStrike', 'Act']],
    ['I charge at the guard.', ['BodyStrike'], ['Price']],
    ['I hold a meeting.', [], ['HoldOn', 'Act']],
    ['I hold the rope.', ['HoldOn'], ['Act']],
    ['I cut the cook.', ['BodyStrike'], ['Break']],
    ['I shove Tom into the wall.', ['Act'], ['Break']],
    ['I throw the cook a coin.', ['Transfer'], []],
    ['I serve the soup.', ['Transfer'], ['Price']],
    ['I trust the cook.', [], ['Transfer']],
    ['I supply the cook.', [], ['Transfer']],
    ['I get hit by Tom.', ['BodyStrike'], ['Act']],
    ['I make a promise to Tom.', ['Communicate'], ['Transfer']],
    ["I don't hit him.", [], ['BodyStrike']],
    ['I refuse to drink the wine.', [], ['BodyIntake']],
    ['I pretend to be drunk.', ['SocialResponse'], ['BodyIntake']],
    ["I'm going to wait here for an hour.", ['PassTime'], ['Act']],
    ['Mara draws her dagger and lunges at the bandit.', ['BodyStrike'], []],
    ['I shout for help.', ['Communicate'], []],
    ['I punch him in the jaw.', ['BodyStrike'], ['Communicate']],
    ['I stab the man with my knife.', ['BodyStrike'], []],
    ['I drink the wine.', ['BodyIntake'], []],
    ['I eat some bread and cheese.', ['BodyIntake'], []],
    ['I wait until midnight.', ['PassTime'], []],
    ['I sleep for eight hours.', ['PassTime'], []],
    ['I run after the thief.', ['Chase', 'Act'], []],
    ['I flee down the alley.', ['Chase'], []],
    ['I hand her the letter.', ['Transfer'], []],
    ['I buy a loaf of bread.', ['Price', 'Transfer'], []],
    ['I haggle with the merchant over the price.', ['SocialResponse', 'Price'], []],
    ['I try to persuade the captain to let us aboard.', ['SocialResponse'], []],
    ['I swim across the river.', ['BodyCheck'], []],
    ['I kick the door in.', ['Break'], []],
    ['I bandage his arm.', ['BodyTreat'], []],
    ['I hold on to the rope.', ['HoldOn'], []],
    ['I eavesdrop on the soldiers.', ['Listen'], []],
    ['I search the desk for the key.', ['Look'], []],
    ['I stand up and cross the room.', ['Act'], []],
    ['I kneel beside the body.', ['Act'], []],
    ['I pick up the lantern.', ['Act'], []],
    // Verbs outside the hand list that VerbNet's classes carry.
    ['I bellow at the crowd to get back.', ['Communicate'], []],
    ['I chat with the barmaid.', ['Communicate'], []],
    ['I interrogate the prisoner.', ['Communicate'], []],
    ['I murmur a prayer.', ['Communicate'], []],
    ['I smack him across the face.', ['BodyStrike'], []],
    ['I swat at the wasp.', ['BodyStrike'], []],
    ['I peek around the corner.', ['Look'], []],
    ['I rummage through the drawer.', ['Look'], []],
    ['I gobble down the stew.', ['BodyIntake'], []],
    ['I devour the pie.', ['BodyIntake'], []],
    ['I snooze in the chair.', ['PassTime'], []],
    ['I linger at the door.', ['PassTime'], []],
    ['I steal his purse.', ['Transfer'], []],
    ['I lend him a shilling.', ['Transfer'], []],
    ['I smash the bottle.', ['Break'], []],
    ['I cling to the ledge.', ['HoldOn'], []],
    ['I urge him to hurry.', ['Communicate', 'SocialResponse'], []],
    // Nouns that are also verbs in VerbNet stay nouns where no verb can stand.
    ['I sit by the fire with a pound of tea.', ['Act'], ['BodyStrike']],
    ['The hand on my shoulder is cold.', [], ['Transfer']],
    // Give, take, have, make, do, pay, offer and raise read by their construction (grammar.ts; CGEL ch. 4 §7): the light use
    // routes the act its noun names, the ordinary use the verb's own tools, a use that could be either both.
    ['I give Tom a hug.', [], ['Transfer']],
    ['I give Tom a quick nod.', [], ['Transfer']],
    ['I give the guard a coin.', ['Transfer'], []],
    ['I give Will one of the apples.', ['Transfer'], []],
    ['I give Tom a piece of bread.', ['Transfer'], []],
    ['I give Tom a pat of butter.', ['Transfer'], []],
    ['I give Tom a piece of my mind.', [], ['Transfer']],
    ['I give Mara a ring.', ['Transfer'], []],
    ['I take a sip of the wine.', ['BodyIntake'], ['Transfer']],
    ['I take a swig of ale.', ['BodyIntake'], ['Transfer']],
    ['I take a step back.', ['Act'], ['Transfer']],
    ['I take a walk to the market, 300 yards.', ['Act'], ['Transfer']],
    ['I take a bath.', [], ['Transfer']],
    ['I take a moment to think.', [], ['Transfer']],
    ['I take the bread.', ['Transfer'], []],
    ['I take a shot at the deer.', ['BodyStrike'], ['Transfer']],
    ['I give a loud shout.', ['Communicate'], ['Transfer']],
    ['I give chase.', ['Chase'], ['Transfer']],
    ['I give the door a kick.', ['BodyStrike'], ['Transfer']],
    ['I give the map a glance.', ['Look'], ['Transfer']],
    ['I make an attempt to climb the wall.', ['BodyCheck'], ['Transfer']],
    ['I pay attention to the guard.', ['Look'], ['Price', 'Transfer']],
    ['I raise an objection.', ['Communicate'], ['Price', 'BodyTreat']],
    ['I offer Tom an apology.', ['Communicate'], []],
    ['I make a fire.', [], ['Transfer']],
    ['I make a promise to Tom.', ['Communicate'], []],
    ['I make a speech.', ['Communicate'], []],
    // Support verbs that are no light verbs of the grammar ("steal a glance", "throw a punch") route the noun FrameNet files.
    ['I steal a glance at the letter.', ['Look'], ['Transfer']],
    ['I throw a punch at Tom.', ['BodyStrike'], []],
    // Auxiliaries are no lexical verbs (CGEL ch. 3 §2); a name is no verb; the passive's and the causative's verb is read.
    ['I will climb the wall tomorrow.', ['BodyCheck'], ['Transfer']],
    ['I signal to Will to wait an hour.', ['PassTime'], ['Transfer']],
    ['I talk to Rob about the horse.', ['Communicate'], ['Transfer']],
    ['I hand the letter to Bill.', ['Transfer'], ['Price']],
    ['I get hit by Tom.', ['BodyStrike'], ['Transfer', 'Communicate']],
    ['I have Tom give me the coin.', ['Transfer'], ['BodyIntake']],
    ['I make Tom walk 10 m to the door.', ['Act'], ['Transfer']],
    ['I shout at the crowd to get back!', ['Communicate'], []],
    // A measure of goods (CGEL ch. 5 §3.3, with WordNet's quantity and thing senses).
    ['I buy a cup of tea.', ['Price'], []],
    ['I buy a bottle of wine.', ['Price'], []],
    ['I see a group of men.', ['Look'], ['Price']],
    ['I see a pack of wolves.', ['Look'], ['Price']],
    // What a covertly negative verb governs is not done (grammar.ts; CGEL ch. 9 §4.4).
    ['I fail to climb the wall.', [], ['BodyCheck']],
    ['I forget to lock the door.', [], []],
    // Calling out is speech, not VerbNet's get-13.5.1 "call me a cab".
    ['I call out to Tom across the square.', ['Communicate'], ['Transfer']],
    // A time NP in front position is no verb (CGEL ch. 8 §20.1); used to and the perfect's adverbs are auxiliaries' company (ch. 3
    // §2.5.9, ch. 8 §20.1 [3]); a name opening a sentence is a subject; a proposal and a vocative's directive are said (ch. 10).
    ['Last week I punched Tom.', ['BodyStrike'], ['Price']],
    ['I used to punch Tom.', ['BodyStrike'], ['BodyIntake', 'PassTime']],
    ['I have just walked 10 m to the door.', ['Act'], ['BodyIntake']],
    ['Tom punches me.', ['BodyStrike'], []],
    ["Let's walk 10 m to the door.", ['Communicate', 'Act'], []],
    ['Tom, walk 10 m to the door!', ['Communicate'], []],
];
// [text, metres the action reader must find]
const DISTANCES = [['I am walking to the door', null], ['three hundred yards', 274.3], ['half a mile', 804.7], ['50 m', 50], ['fifty feet', 15.2], ['2 km', 2000]];
let miss = 0;
for (const [text, want, not] of CASES) {
    const got = new Set(routeTurn(text).tools);
    const lacking = want.filter(t => !got.has(t)), extra = not.filter(t => got.has(t));
    if (lacking.length || extra.length) { miss++; console.log(`MISS "${text}"\n  routed: ${[...got].join(', ') || '(none)'}${lacking.length ? `\n  lacking: ${lacking.join(', ')}` : ''}${extra.length ? `\n  wrong: ${extra.join(', ')}` : ''}`); }
}
for (const [text, m] of DISTANCES) if (distanceIn(text) !== m) { miss++; console.log(`MISS distance "${text}": ${distanceIn(text)} (want ${m})`); }
const walk = stepsFromWords('I walk the three hundred yards to the market on Wentworth Street.', 'Mary');
if (!('steps' in walk) || walk.steps[0].distance_m !== 274.3 || !/market/.test(walk.steps[0].to ?? '')) { miss++; console.log(`MISS walk steps: ${JSON.stringify(walk)}`); }
// A verb the words say is not done sets no pace ("I don't run. I walk…" walks) and makes no move ("I don't walk…").
const PACES = [["I don't run. I walk 10 m to the door.", undefined], ['I refuse to run, and walk 10 m to the door.', undefined], ['I never sprint; I walk 10 m to the door.', undefined], ['I run 10 m to the door.', 'run']];
for (const [text, pace] of PACES) { const s = stepsFromWords(text, 'Mary'); if (!('steps' in s) || s.steps[0].pace !== pace) { miss++; console.log(`MISS pace "${text}": ${JSON.stringify(s)}`); } }
// Where a walk ends, by the grammar of its prepositions (grammar.ts walkEnd; CGEL ch. 8 §4.3, ch. 17 §9.1): a goal, the far
// side of what is crossed, short of what is walked towards, along a path, away from a source, at a place said as a goal, the
// place "there" names; an infinitive's to is no goal; with none, a spot its distance away.
const SPOTS = [['I walk 10 m to the door.', 'door'], ['I walk 10 m towards the door.', '10 m towards the door'], ['I walk 10 m across the room.', 'far side of room'],
    ['I walk across the room to the door, 10 m.', 'door'], ['I walk 10 m along the wall.', '10 m along the wall'], ['I walk 10 m past the guard.', '10 m past the guard'],
    ['I walk 10 m by the guard.', '10 m past the guard'], ['I walk 10 m away from the fire.', '10 m away from the fire'], ['I walk 10 m behind the house.', 'behind the house'],
    ['I walk 10 m near the fire.', 'near the fire'], ['I walk 10 m in the garden.', 'garden'], ['I see Tom at the bar. I walk 10 m there.', 'bar'],
    ['I walk 10 m to the door to open it.', 'door'], ['I walk 10 m to open the door.', 'a spot 10 m from where Mary stood'], ['I walk 10 m.', 'a spot 10 m from where Mary stood'],
    ['I step out, 5 m.', 'outside, near where Mary stood'], ['I walk 10 m out of the room.', 'outside room'], ['I walk 10 m to the door in a minute.', 'door'],
    ['I walk 10 m to the market on Wentworth Street.', 'market on Wentworth Street']];
for (const [text, spot] of SPOTS) { const s = stepsFromWords(text, 'Mary'); if (!('steps' in s) || s.steps.at(-1).to !== spot) { miss++; console.log(`MISS spot "${text}": ${JSON.stringify(s)} (want ${spot})`); } }
const towards = stepsFromWords('I walk 5 m towards the door, then 10 m to the gate.', 'Mary');
if (!('steps' in towards) || JSON.stringify(towards.steps.map(x => x.to)) !== JSON.stringify(['5 m towards the door', 'gate'])) { miss++; console.log(`MISS legs by the walk's grammar: ${JSON.stringify(towards)}`); }
const notWalked = stepsFromWords("I don't walk 10 m to the door.", 'Mary');
if ('steps' in notWalked) { miss++; console.log(`MISS undone walk "I don't walk 10 m to the door.": ${JSON.stringify(notWalked)}`); }
// Curly apostrophes and single quotes route as the straight ones (phone and Mac keyboards type them).
{
  const lines = ["I'll punch him.", "I won't drink it.", "I don't hit him.", "I'm going to wait here.", "Let's walk to the door.", "I can't swim.", "I hit Tom's dog.", "I say 'wait' and run."];
  const differ = lines.filter(l => JSON.stringify(routeTurn(l).tools) !== JSON.stringify(routeTurn(l.replace(/'(?=\w)/g, (m, i) => i > 0 && /\w/.test(l[i - 1]) ? '’' : '‘').replace(/(?<=\w)'(?!\w)/g, '’')).tools));
  if (differ.length || !routeTurn('I’ll punch him.').tools.includes('BodyStrike') || routeTurn('I won’t drink it.').tools.length) { miss++; console.log(`MISS curly apostrophes route as straight ones: ${differ.map(l => `${l} ${JSON.stringify(routeTurn(l).tools)}`).join('; ')}`); }
}
// R57: words in guillemets and German quotation marks are speech, as in "…": they route Communicate, and their verbs are not the
// player's acts.
{
  const GUILLEMETS = ['Er sagte: ›Climb the wall!‹', '›Climb the wall!‹ I shout.', 'I shout «Climb the wall!»', 'I shout »Climb the wall!«', 'I shout „Climb the wall!“', 'I shout ‹Climb the wall!›', 'I shout ‚Climb the wall!‘'];
  const wrong = GUILLEMETS.filter(t => { const r = routeTurn(t).tools; return !r.includes('Communicate') || r.includes('BodyCheck'); });
  if (wrong.length) { miss++; console.log(`MISS quoted words in guillemets are speech: ${wrong.map(t => `${t} → ${routeTurn(t).tools}`).join(' | ')}`); }
}
// A verb of falling with an object or a state complement is no fall of the body ("I drop the sword", "I fall asleep").
{
  const wrong = ['I drop the sword.', 'I slip the note into his pocket.', 'I trip the guard.', 'I fall asleep.', 'I fall silent.', 'I fall in love with Ann.'].filter(t => routeTurn(t).tools.includes('BodyFall'));
  const kept = ['I drop down from the wall.', 'I slip on the ice.', 'I fall into the river.'].filter(t => !routeTurn(t).tools.includes('BodyFall'));
  if (wrong.length || kept.length) { miss++; console.log(`MISS a fall verb with an object is no fall: ${wrong.join(' | ')}; falls lost: ${kept.join(' | ')}`); }
}
// Verbs routed by the sense their line gives: a weather verb with "it" only; Levin's verbs of killing by a means by the means;
// a phrasal verb by its own entry; set phrases by what they mean.
{
  const R = l => routeTurn(l).tools;
  const wrong = [['I pour Tom a drink.', 'Weather'], ['I blow on my hands.', 'Weather'], ['I blow out the candle.', 'Weather'], ['I blow out the candle.', 'Break'], ['I stab Tom.', 'Substance'], ['I strangle the guard.', 'Substance'],
    ['I light a candle.', 'BodyTreat'], ['I pick up the lantern.', 'BodyIntake'], ['I draw my sword.', 'SocialResponse'], ['I draw my sword.', 'Break'], ['I take a seat.', 'Transfer'],
    ['I break the silence.', 'Break'], ['I force a smile.', 'BodyCheck'], ['I sneak past the guard.', 'Transfer'], ['I slip past the guard.', 'BodyFall']].filter(([l, t]) => R(l).includes(t));
  const lost = [['It is pouring outside.', 'Weather'], ['It rains.', 'Weather'], ['I strangle the guard.', 'BodyChoke'], ['I drown the rat.', 'BodyEnvironment'], ['I poison the wine.', 'Substance'],
    ['I stab Tom.', 'BodyStrike'], ['I pick up the lantern.', 'Transfer'], ['I take a seat.', 'Act'], ['I break the silence.', 'Communicate'], ['I sneak past the guard.', 'Look']].filter(([l, t]) => !R(l).includes(t));
  if (wrong.length || lost.length) { miss++; console.log(`MISS verbs routed by their sense: wrong ${wrong.map(x => x.join(' → ')).join(' | ')}; lost ${lost.map(x => x.join(' → ')).join(' | ')}`); }
}
// A weapon swung or thrust at someone is a blow tried; at a thing, a motion.
{
  const at = ['I swing at Tom.', 'I swing my axe at the orc.', 'I thrust my spear at the guard.'].filter(l => !routeTurn(l).tools.includes('BodyStrike'));
  const things = ['I swing at the door.', 'I swing on the rope.'].filter(l => routeTurn(l).tools.includes('BodyStrike'));
  if (at.length || things.length) { miss++; console.log(`MISS a swing at someone is a blow: ${at.join(' | ')}; at things: ${things.join(' | ')}`); }
}
// Section 43 (docs/df-body-engine.md §7.3, 2026-10-27 (109)): each labelled check fails when its fix is undone.
const { routedTools } = await import('../src/rules/router.js');
const S43 = [
  // VerbNet's roles of amount take an amount; a two-object frame's first object only with two objects; a time is no goods.
  ['amount roles', [['Mara carries the heavy chest by its handles.', [], ['Price']], ['I serve the soup.', ['Transfer'], ['PassTime']]]],
  ['two-object frames', [['I carry the boy to the cart.', ['Act'], ['Price']], ['I charge the cook a shilling.', ['Price'], []]]],
  ['a time is no goods', [['I hold the rope for a couple of seconds.', [], ['Price']], ['I call for a pint of ale.', ['Price'], []]]],
  ['a long weapon phrase and a possessor', [["Mara swings her steel long sword at the bandit's head.", ['BodyStrike'], []]]],
  ['a noun subject', [['Mara asks what a mason earns in a day here.', ['Price'], []], ['The dog chases the fox.', ['Chase'], []], ["Does the guard hear Mara's footsteps?", ['Listen'], []]]],
  ['a thing as subject', [['Mara slips and a shard slices her left palm.', ['BodyWound'], ['BodyStrike']], ['The axe slips and cuts my shin.', ['BodyWound'], ['BodyStrike', 'BodyFall']], ['The branch snaps and Tom falls.', ['BodyFall'], ['Communicate']], ['The bread rolls off the table.', [], ['BodyStrike', 'Act']]]],
  ['an attack on a position', [['Our regiment charges the hill.', ['Battle'], ['BodyStrike']], ['I attack the guard at the gate.', ['BodyStrike'], ['Battle']]]],
  ['perception by its sense', [['Does Tom notice anything?', ['Look', 'Listen'], []], ['I taste the soup.', [], ['Look']], ['I sniff the stew.', [], ['Look']], ['I feel the wall.', [], ['Look', 'Appraise']], ['I savor the wine.', [], ['Look']], ['Did anyone notice the noise?', ['Listen'], []]]],
  ['persuasion has a person', [['I press my palm against the hot kettle.', [], ['SocialResponse']], ['I press him to talk.', ['SocialResponse'], []]]],
  ['feeling about', [['How does Mara feel about her brother?', ['Appraise'], ['Look']], ['Mara feels guilty about the lie.', ['Appraise'], []], ['I feel the wall for a latch.', [], ['Appraise']]]],
  ['activity verbs', [['I sneak into the barn.', ['BodyCheck', 'Act'], []], ['Mara solves the riddle.', ['WorkOut'], []], ['Tom gallops across the meadow.', ['BodyCheck'], []], ['The thief flees into the crowd.', ['Chase'], []], ['I figure out the code.', ['WorkOut'], []], ['I fix my hair.', [], ['BodyCheck']]]],
  ['emotion verbs', [['I fear the dark woods.', ['Appraise'], []], ['Tom loves his sister.', ['Appraise'], []], ['I miss the target.', [], ['Appraise']]]],
  ['named constructions', [['Does Tom trust Mara again after her lie?', ['Trust'], ['Transfer']], ['Mara lies to the captain about where she was.', ['SocialResponse'], ['Act']], ['Mara hangs from the ledge.', ['HoldOn'], []],
    ['Mara runs from the guards.', ['Chase'], []], ['Tom catches sight of the wolf.', ['Look'], ['Transfer']], ['Does the ether catch fire?', ['Substance'], ['BodyStrike', 'BodyCheck']], ['The doctor injects Tom with ether.', ['Dose'], ['BodyIntake']],
    ['I remember to feed the dog.', ['WorkOut'], []], ['Mara adds up the bill.', ['WorkOut'], ['Communicate']], ['Tom counts the coins in his head.', ['WorkOut'], []], ['Mara faints.', ['Claim'], []], ['Mara chokes the guard.', ['BodyChoke'], []], ['I hang the lantern on the hook.', [], ['HoldOn']]]],
  ['do-support', [['Does Tom trust Mara?', ['Trust'], []], ['What does the guard do?', ['Choose'], []], ['Does the ether catch fire?', ['Substance'], ['BodyStrike', 'BodyCheck', 'BodyWound']]]],
  ['claims', [['I am a cat. Mara slinks under the gate.', ['Claim'], []], ['Mara is secretly a vampire.', ['Claim'], []], ['I am a bit tired.', [], ['Claim']], ['Mara pulls the revolver from her coat.', ['Claim'], []],
    ['I take out my lockpicks.', ['Claim'], []], ['Mara knows how to sail.', ['Claim'], []], ['I studied medicine in Paris.', ['Claim'], []], ['I get a cramp in my leg.', ['Claim'], []], ['I trip and twist my ankle.', ['Claim', 'BodyFall'], []]]],
  ['clothes and water', [['Mara puts on her fur cloak.', ['BodyEnvironment'], []], ['I take off my wet boots.', ['BodyEnvironment'], []], ['Tom takes off the lid.', [], ['BodyEnvironment']], ['Tom drags himself out of the river.', ['BodyEnvironment'], []], ['Mara swims for the shore.', ['BodyEnvironment', 'BodyCheck'], []]]],
  ['a load on a plank', [['Mara jumps on the rotten plank.', ['Break'], []], ['I hang from the old rope.', ['Break', 'HoldOn'], []], ['I walk to the bar.', [], ['Break']], ['Mara carries the heavy chest by its handles.', ['HoldOn'], []]]],
  ["another's choice", [['Does the merchant fight or flee?', ['Choose'], []], ['Which road does Tom take?', ['Choose'], []]]],
  ['reading', [['Mara reads the map.', [], ['Communicate']], ['I read the letter to Tom.', ['Communicate'], []], ['I read the letter aloud.', ['Communicate'], []], ['I read the map to find the way.', [], ['Communicate']]]],
  ['an account that may be a lie', [['Mara: "I was asleep at the inn all night."', ['SocialResponse'], []], ['Mara says: "Pass the salt, please."', [], ['SocialResponse']], ["I tell the guard I am the duke's niece.", ['SocialResponse'], []],
    ['I tell the captain I saw nothing.', ['SocialResponse', 'Look'], ['BodyStrike']], ['I tell the guard to open the gate.', [], ['SocialResponse']]]],
  ['a watched person', [['Mara watches what the baker does.', ['SocialResponse', 'Choose'], []], ['Mara, chained in the corner, watches the soldier.', ['SocialResponse'], []], ['Tom watches the ridge.', ['Look'], ['Choose', 'SocialResponse']]]],
  ['catching', [['Will Mara catch the fever?', ['Disease'], ['Transfer']], ['Tom catches the thief.', ['Chase'], []], ['I catch a fish.', [], ['Chase', 'Disease']]]],
  ['third-person -s', [['Tom mounts the mare and rides off.', ['BodyCheck'], []]]],
  ['a particle before a path', [['The thief bolts down the alley.', ['Act'], ['BodyIntake']], ['I paddle out to the buoy.', ['Act'], ['BodyStrike']], ['I gobble down the stew.', ['BodyIntake'], []], ['I hold on to the rope.', ['HoldOn'], []]]],
];
// Section 44 (docs/df-body-engine.md §7.3, 2026-10-28 (110)).
S43.push(
  ['a thing under a load', [["Does the shelf hold Mara's weight?", ['Break'], ['HoldOn']], ['Will the plank hold?', ['Break'], []], ['Does the bridge bear the cart?', ['Break'], []], ['Tom holds the rope.', ['HoldOn'], ['Break']], ['The box holds three apples.', [], ['Break', 'HoldOn']]]],
  ['giving way', [['The floor gives way.', ['Break'], []], ['Mara gives way to the duke.', [], ['Break']], ['Tom gives way.', [], ['Break']]]],
  ["another's feeling asked", [['Mara wonders whether Elias liked her.', ['SocialResponse', 'Appraise'], []], ['Does the guard like me?', ['SocialResponse'], []], ['I fear the dark woods.', ['Appraise'], ['SocialResponse']]]],
  ['stealth by its dictionary sense', [['I tiptoe down the hall.', ['BodyCheck'], []], ['Tom creeps up behind the guard.', ['BodyCheck'], []], ['The thief prowls through the garden.', ['BodyCheck'], []]]],
  ["into one's own things", [["Mara's fingers closed on the merchant's purse and slid it into her sleeve.", ['Transfer'], []], ['I tuck the letter into my coat.', ['Transfer'], []], ['I put my hand in my pocket.', [], ['Transfer']]]],
  ['a complement clause opens a subject', [['I wonder whether the baker trusts strangers.', ['Trust'], []]]],
  ['how much asks a price', [['How much does the ferryman charge?', ['Price'], ['BodyStrike', 'Act']], ['How much does a loaf cost here?', ['Price'], []]]],
  ['reading to a group', [['I read the decree to the crowd.', ['Communicate'], []]]],
);
for (const [label, rows] of S43) {
  const bad = rows.filter(([l, need, not]) => { const t = routeTurn(l, ['Mara', 'Tom', 'Elias'], 'Mara').tools; return need.some(x => !t.includes(x)) || not.some(x => t.includes(x)); });
  if (bad.length) { miss++; console.log(`MISS s43 ${label}: ${bad.map(([l]) => `${l} → ${routeTurn(l, ['Mara', 'Tom', 'Elias'], 'Mara').tools.join(' ')}`).join(' | ')}`); }
}
// The player's own feeling is no one else's response; the narration's acts offer the tools that record them (section 44).
{
  const own = routeTurn('How does Mara feel about her brother?', ['Mara', 'Tom'], 'Mara').tools;
  const off = (l, nar) => [...(routedTools(l, () => true, ['Mara', 'Tom'], nar, nar, 'Mara') ?? [])];
  const told = [
    ["Mara's fingers closed on the merchant's purse and slid it into her sleeve; he walked on without noticing.", 'Transfer'],
    ['The innkeeper hands Mara a key.', 'Transfer'],
    ['Tom drinks the whole jug of wine.', 'BodyIntake'],
  ].filter(([n, t]) => !off('Mara walks to the inn.', [n]).includes(t));
  const untold = [
    ['After the long march Mara finds a spring.', 'Transfer'], ['Mara learned bleeding control as an army medic.', 'Transfer'], ['The climbers reach the high camp.', 'Transfer'],
  ].filter(([n, t]) => off('Mara walks to the inn.', [n]).includes(t));
  if (own.includes('SocialResponse') || told.length || untold.length) { miss++; console.log(`MISS s44 the player's own feeling and the narration's acts: own ${own.join(' ')}; lost ${told.map(x => x.join(' → ')).join(' | ')}; wrong ${untold.map(x => x.join(' → ')).join(' | ')}`); }
}
// The scene's words add the tools whose inputs they name, once the router routes (cue-tools.ts).
{
  const off = (l, ctx) => [...(routedTools(l, () => true, ['Mara', 'Tom'], ctx) ?? [])];
  const need = [
    ['Mara swims for the shore.', ['The ferry capsized; the lake is near freezing.'], 'BodyEnvironment'],
    ['They set up the tents.', ['The climbers reach the high camp at 4500 metres after a three-day ascent.'], 'BodyEnvironment'],
    ['They walk for three hours.', ['The caravan sets off across the desert at noon; it is 40 °C in the sun.'], 'BodyEnvironment'],
    ['Mara crawls through the hallway to find Tom.', ['The house is on fire; thick smoke fills the hallway.'], 'BodyEnvironment'],
    ['Mara walks across the courtyard toward the gate.', ['Night. A sentry stands thirty metres away. The courtyard is gravel.'], 'Listen'],
    ['Mara, 30, boards and sits by the rail.', ['The packet boat leaves Dover for Calais in rough weather; the crossing takes three hours.'], 'Sickness'],
    ['Mara runs for the alley.', ['A guard spots Mara twenty metres away and shouts.'], 'Chase'],
    ["Mara grabs the pan's iron handle with her right hand for a couple of seconds.", ['An iron pan has been on the fire for an hour.'], 'BodyContact'],
    ['Mara tries to solve the riddle before he returns.', ['The note on the door reads: "What has keys but opens no locks?"'], 'WorkOut'],
    ["Mara reads the waitress's name tag and smiles.", [], 'NameCharacter'],
    ['Mara walks over to the sick boy.', ['The miller says his boy has had measles for two days.'], 'Disease'],
  ].filter(([l, c, t]) => !off(l, c).includes(t));
  const keep = [
    ['I fire at the deer.', [], 'BodyEnvironment'], ['I open fire on the soldiers.', [], 'BodyEnvironment'], ['I give Mara a ring.', [], 'Listen'], ['I hit the guard twice.', [], 'Listen'],
    ['I check the thermometer: -5 °C. Too cold to swim.', [], 'Disease'], ['Does Tom notice anything?', ['Half a kilometre away, behind the hill, a hunter fires his rifle.'], 'BodyEnvironment'],
    ['I stab Tom.', [], 'Appraise'], ['I make a fire.', [], 'BodyContact'], ['I walk 3000 m to the village.', [], 'BodyEnvironment'],
    ['Mara walks to the door.', ['A farm dog spots a fox ten metres away at the edge of the field.'], 'Chase'], ['Mara walks to the door.', ['Mara knows Flame Lash (Fire, complexity 3).'], 'BodyEnvironment'],
  ].filter(([l, c, t]) => off(l, c).includes(t));
  if (need.length || keep.length) { miss++; console.log(`MISS s43 scene cues: lost ${need.map(([l, , t]) => `${l} → ${t}`).join(' | ')}; wrong ${keep.map(([l, , t]) => `${l} → ${t}`).join(' | ')}`); }
}
console.log(`${CASES.length + DISTANCES.length + PACES.length + SPOTS.length + 8 + S43.length + 2} checks, ${miss} miss(es)`);
process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
