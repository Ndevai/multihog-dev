// Player lines and the calls code must write from them (src/rules/frame.ts), checked without the model.
const { framedCalls, playerName, mergeCalls } = await import('../src/rules/frame.js');
// [line, player, expected calls (each: tool and the arguments that must match), tools code must leave to the planner]
const CASES = [
    // A blow verb with another sense the object fits that names another tool is the planner's ("charge": attack, or bill
    // him); a blow verb whose other senses do not fit a person is code's (senses.ts, router.ts senseConflict).
    ['I charge the cook.', 'Mara', [], ['BodyStrike']],
    ['I strike the cook.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'the cook' }]], []],
    ['I cut the cook a slice of bread.', 'Mara', [], ['BodyStrike']],
    ['I step out of my house onto the street.', 'Mary', [], ['Act']],
    ['I walk the three hundred yards to the market on Wentworth Street.', 'Mary', [['Act', { who: 'Mary', distance_m: 274.3 }]], []],
    ['I ask the costermonger for a pound of apples and pay him.', 'Mary', [['Communicate', { speaker: 'Mary', listener: 'the costermonger', message: 'for a pound of apples' }]], ['Transfer']],
    ['I walk home and give Will one of the apples.', 'Mary', [['Transfer', { to: 'Will', item: 'apples', quantity: 1, how: 'given', from: 'Mary' }]], ['Act']],
    ['I sit down at a table near the fire.', 'Tom', [['Act', { who: 'Tom' }]], []],
    // The action without its markup or subject: an action in asterisks, a line in the third person.
    ['*I sit down at the table.*', 'Mara', [['Act', { who: 'Mara', action: 'sit down at the table.' }]], []],
    // An asterisk left unclosed is markup too (emphasis takes pairs: frame.ts unEmphasis).
    ['*I sit down at the table.', 'Mara', [['Act', { who: 'Mara', action: 'sit down at the table.' }]], []],
    ['I sit down at the table.*', 'Mara', [['Act', { who: 'Mara', action: 'sit down at the table.' }]], []],
    ['Mara sits down at the table.', 'Mara', [['Act', { who: 'Mara', action: 'sits down at the table.' }]], []],
    // Code writes the player's own acts only: another subject's act is the planner's, read from the scene.
    ['Tom punches Mara.', 'Mara', [], ['BodyStrike']],
    ['Will gives Mara one of the apples.', 'Mara', [], ['Transfer']],
    ['Tom walks 5 m to the door.', 'Mara', [], ['Act']],
    ['Jack whispers to Mara, "Follow me."', 'Mara', [], ['Communicate']],
    ['Tom waits an hour.', 'Mara', [], ['PassTime']],
    ['I wait for Tom, who walks 10 m to the door.', 'Mara', [], ['Act']],
    ['I punch Tom and he hits me back.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['Mara stands up, walks 5 m to the door.', 'Mara', [['Act', { who: 'Mara', distance_m: 5 }]], []],
    ['I tell Will to wait an hour.', 'Mara', [['Communicate', { listener: 'Will' }]], ['PassTime']],
    ['I want to wait an hour.', 'Mara', [['PassTime', { minutes: 60 }]], []],
    ['The rider looks at Mara.', 'Mara', [], ['Look']],
    // A blow needs a creature struck; an act given is no thing; one spoken to is a person; a place is no message.
    ['I duck under the swing and kick his knee.', 'Mara', [], ['BodyStrike']],
    ['I take a deep breath and knock three times on the door.', 'Mara', [], ['BodyStrike']],
    ['I beat the eggs and cook breakfast.', 'Mara', [], ['BodyStrike']],
    ['I give Tom a hug.', 'Mara', [], ['Transfer']],
    // A thing with its measure is handed whole; a measure-word act is none; "a ring" (a call or a ring) is the planner's.
    ['I give Tom a slice of pie.', 'Mara', [['Transfer', { to: 'Tom', item: 'slice of pie', from: 'Mara' }]], []],
    ['I give Tom a piece of bread.', 'Mara', [['Transfer', { to: 'Tom', item: 'piece of bread' }]], []],
    ['I give Tom a pat of butter.', 'Mara', [['Transfer', { to: 'Tom', item: 'pat of butter' }]], []],
    ['I give Tom a piece of my mind.', 'Mara', [], ['Transfer']],
    ['I give Tom a pat on the back.', 'Mara', [], ['Transfer']],
    ['I give Mara a ring.', 'Ann', [], ['Transfer']],
    ['I give Mara the ring.', 'Ann', [['Transfer', { to: 'Mara', item: 'ring' }]], []],
    ['I give the order to fire.', 'Mara', [], ['Communicate']],
    // A light use is said with its verb (grammar.ts sayLight; CGEL ch. 4 §7 [1]): "give Tom a kick" is "kick Tom".
    ['I give Tom a quick kick in the shin.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], ['Transfer']],
    ['Mara gives Tom a punch.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['I give the guard a hard shove and run.', 'Mara', [], ['Transfer']],
    ['I take a walk to the market, three hundred yards.', 'Mary', [['Act', { who: 'Mary', distance_m: 274.3 }]], ['Transfer']],
    ['I have a look around the room.', 'Mara', [['Look', { viewer: 'Mara', target: 'the room' }]], []],
    ['I give the map a glance.', 'Mara', [['Look', { viewer: 'Mara', target: 'the map' }]], []],
    ['I have a quick look around and take the lamp.', 'Mara', [['Look', { viewer: 'Mara', target: undefined }]], []],
    ['I give the beggar my coat.', 'Mara', [['Transfer', { to: 'the beggar', item: 'coat' }]], []],
    ['I give Tom a black eye.', 'Mara', [], ['Transfer']],
    // Him and her by the grammar's rules (CGEL ch. 17 §3.1): the one person named before whose sex fits.
    ['Tom punches me. I hit him back.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['Tom and Will shove me. I hit him back.', 'Mara', [], ['BodyStrike']],
    ['Ann hands me a cup. I give her a coin.', 'Mara', [['Transfer', { to: 'Ann', item: 'coin' }]], []],
    // "I am" is no metre; a passive's act is its agent's (CGEL ch. 16 §10); a condition or a modal of possibility leaves the
    // act undone (ch. 8 §14, ch. 3 §9.1), save "can see"; will is the act about to be done.
    ['I am walking to the door.', 'Mara', [], ['Act']],
    ['I am tired, so I walk to the inn.', 'Mara', [], ['Act']],
    ['Tom is hit by me.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['I am hit by Tom.', 'Mara', [], ['BodyStrike', 'Act']],
    ['I am given a coin by Tom.', 'Mara', [], ['Transfer', 'Act']],
    ['I hit Tom if he moves.', 'Mara', [], ['BodyStrike']],
    ['If the guard looks away, I walk 10 m to the door.', 'Mara', [], ['Act']],
    ['I could hit Tom.', 'Mara', [], ['BodyStrike']],
    ['Can I walk 10 m to the door?', 'Mara', [], ['Act']],
    ['I can see the rider.', 'Mara', [['Look', { viewer: 'Mara', target: 'the rider' }]], []],
    ['I will walk 10 m to the door.', 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    ['I see a pack of wolves.', 'Mara', [['Look', { viewer: 'Mara', target: 'a pack of wolves' }]], []],
    // Wanting someone to act says nothing of whether they do; making them act does (Karttunen 2012; CGEL ch. 14).
    ['Tom wants me to walk 10 m to the door.', 'Mara', [], ['Act']],
    ['Tom makes me walk 10 m to the door.', 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    // A person by WordNet's first sense (nouns.ts ROLE_WORDS): a king, a witch; a table is none.
    ['I shout at the witch.', 'Mara', [['Communicate', { listener: 'the witch' }]], []],
    ['I punch the table.', 'Mara', [], ['BodyStrike']],
    // Who does the act of a clause inside another (CGEL ch. 14): the NP between the verbs; promise keeps its subject.
    ['I watch Tom climb the wall.', 'Mara', [], ['BodyCheck', 'Act']],
    ['I make Tom walk 10 m to the door.', 'Mara', [], ['Act']],
    ['I rely on Tom to wait an hour.', 'Mara', [], ['PassTime']],
    ['I promise Tom to wait an hour.', 'Mara', [['PassTime', { minutes: 60 }]], []],
    // What a covertly negative verb governs is not done (CGEL ch. 9 §4.4); negated, a two-way implicative's is (Karttunen 2012).
    ['I fail to walk 10 m to the door.', 'Mara', [], ['Act']],
    ['I refrain from hitting Tom.', 'Mara', [], ['BodyStrike']],
    ['I refrain from walking 10 m to the door.', 'Mara', [], ['Act']],
    ["I don't forget to walk 10 m to the door.", 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    ['I tell the truth.', 'Mara', [], ['Communicate']],
    ['I ask for directions.', 'Mara', [], ['Communicate']],
    ['I call out to Tom across the square.', 'Mara', [['Communicate', { listener: 'Tom', message: undefined }]], []],
    ['I offer the guard two silver coins to look the other way.', 'Mara', [], ['Look']],
    // An act the line says is not done is written by no one.
    ["I don't punch Tom.", 'Mara', [], ['BodyStrike']],
    ['I refuse to give Tom the apple.', 'Mara', [], ['Transfer']],
    ['I almost punch Tom.', 'Mara', [], ['BodyStrike']],
    ["I don't walk 10 m to the door.", 'Mara', [], ['Act']],
    ['I refuse to run, and walk 10 m to the door.', 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    // A compound subject holds the player; a climb or a jump is no walk; a direction is no target; a target ends before a verb.
    ['Mara and Tom walk 50 m to the market together.', 'Mara', [['Act', { who: 'Mara', action: 'walk 50 m to the market together.' }]], []],
    ['Mara climbs onto the roof and jumps to the next building, two metres across.', 'Mara', [], ['Act', 'BodyStrike']],
    ['I look away.', 'Mara', [['Look', { target: undefined }]], []],
    ['I see Tom enter the room.', 'Mara', [['Look', { target: 'Tom' }]], []],
    // A walk in legs is timed over all of them.
    ['I walk 5 m to the door, then 10 m to the gate.', 'Mara', [['Act', { who: 'Mara', distance_m: 15 }]], []],
    ['I call to the innkeeper for a pint of ale.', 'Tom', [['Communicate', { listener: 'the innkeeper', effort: 'loud' }]], []],
    ['Two men at the next table are whispering. I keep still and listen.', 'Tom', [], ['Communicate', 'Act']],
    ['I go to the innkeeper and tell him what I heard.', 'Tom', [['Communicate', { speaker: 'Tom', listener: 'the innkeeper', message: 'what I heard' }]], ['Act']],
    ['I creep across the lawn to the lit window.', 'Mara', [], ['Act']],
    ['"Good evening," I say to the guard.', 'Ann', [['Communicate', { listener: 'the guard', message: 'Good evening,' }]], []],
    ['I whisper to Jack, "Follow me."', 'Ann', [['Communicate', { listener: 'Jack', effort: 'whisper', message: 'Follow me.' }]], []],
    ['I shout at the soldiers to stop.', 'Ann', [['Communicate', { listener: 'the soldiers', effort: 'shout' }]], []],
    ['I wait an hour.', 'Ann', [['PassTime', { minutes: 60, resting: ['Ann'] }]], []],
    ['I sleep for eight hours.', 'Ann', [['PassTime', { minutes: 480, sleeping: ['Ann'] }]], []],
    ['I wait in the kitchen for an hour.', 'Ines', [['PassTime', { minutes: 60, resting: ['Ines'] }]], []],
    ['I hand her the letter.', 'Ann', [], ['Transfer']],
    ['I tell the captain that the ship is leaking and hand him the log.', 'Ann', [['Communicate', { listener: 'the captain' }], ['Transfer', { to: 'the captain', item: 'log' }]], []],
    ['I kneel beside the body.', 'Ann', [['Act', { who: 'Ann' }]], []],
    ['I call to the innkeeper for a pint of ale.', 'Tom', [], ['Price']],
    ['I ask the costermonger for a pound of apples and pay him.', 'Mary', [], ['Price']],
    ['I buy two loaves of bread.', 'Ann', [], ['Price']],
    ['I eat the bread.', 'Ann', [], ['Price']],
    ['I buy a pound of pears.', 'Ann', [], ['Price']],
    ['I punch the sailor in the jaw.', 'Jack', [['BodyStrike', { attacker: 'Jack', who: 'the sailor' }]], []],
    ["I hold Mr. Abbott's hand and tell him not to be afraid.", 'Ellen', [['Communicate', { listener: 'Mr. Abbott', message: 'not to be afraid' }]], []],
    ['I beg Monsieur Dufour to give me one more week to pay.', 'Clara', [['Communicate', { listener: 'Monsieur Dufour' }]], []],
    ['I stand up and walk 5 m to the door.', 'Ann', [['Act', { distance_m: 5 }]], []],
    ['Two men at the next table are whispering. I keep still and listen.', 'Tom', [['Listen', { listener: 'Tom' }]], []],
    ['I go to the innkeeper and tell him what I heard.', 'Tom', [], ['Listen']],
    ['I look through the window to see who is inside.', 'Mara', [['Look', { viewer: 'Mara', target: 'the window' }]], []],
    ['I eavesdrop on the soldiers.', 'Ann', [['Listen', { listener: 'Ann' }]], []],
    // Any verb of looking or of blows by its meaning (verbs.ts, VerbNet), not a list of a few words.
    ['I glimpse the rider on the ridge.', 'Ann', [['Look', { viewer: 'Ann', target: 'the rider' }]], []],
    ['I scan the crowd for the thief.', 'Ann', [['Look', { viewer: 'Ann', target: 'the crowd' }]], []],
    ['I club the sailor.', 'Jack', [['BodyStrike', { attacker: 'Jack', who: 'the sailor' }]], []],
    ['I knife the smuggler.', 'Jack', [['BodyStrike', { attacker: 'Jack', who: 'the smuggler' }]], []],
    ['I tap the man on the shoulder.', 'Jack', [], ['BodyStrike']],
    // FrameNet's verbs as well as VerbNet's.
    ['I eyeball the stranger.', 'Ann', [['Look', { viewer: 'Ann', target: 'the stranger' }]], []],
    ['I bayonet the sentry.', 'Jack', [['BodyStrike', { attacker: 'Jack', who: 'the sentry' }]], []],
    // The reader by the grammar's chapters (grammar.ts; docs/progress.md entry 95).
    // The subject stands before its verb; an adjunct in front position comes before the subject (CGEL ch. 4 §3.1, ch. 8 §20.1).
    ['Today I walk 10 m to the gate.', 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    ['In the morning I punch Tom.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['Without a word I hand Tom the letter.', 'Mara', [['Transfer', { to: 'Tom', item: 'letter', from: 'Mara' }]], []],
    ['The next day I wait an hour.', 'Mara', [['PassTime', { minutes: 60, resting: ['Mara'] }]], []],
    ['Afterwards I wait an hour.', 'Mara', [['PassTime', { minutes: 60 }]], []],
    ['In the tavern Tom punches me.', 'Mara', [], ['BodyStrike']],
    // A habit, a time before or after now, used to, about to: no act now (CGEL ch. 3 §§2.5.9, 4.2, 4.3.1, 10.2; ch. 8 §§6.2, 9).
    ['I walk 10 m to the market every day.', 'Mara', [], ['Act']],
    ['I usually walk 10 m to the market.', 'Mara', [], ['Act']],
    ['Every morning I wait an hour.', 'Mara', [], ['PassTime']],
    ['Yesterday I walked 10 m to the market.', 'Mara', [], ['Act']],
    ['I punched Tom two days ago.', 'Mara', [], ['BodyStrike']],
    // A time after the object is an adjunct, no second object (senses.ts objectAfter): the blow is drafted.
    ['I punch Tom this morning.', 'Mara', [['BodyStrike', { who: 'Tom' }]], []],
    ['Tomorrow I walk 10 m to the gate.', 'Mara', [], ['Act']],
    ['I used to punch Tom.', 'Mara', [], ['BodyStrike']],
    ['I am about to walk 10 m to the door.', 'Mara', [], ['Act']],
    ['I will have walked 10 m to the door by then.', 'Mara', [], ['Act']],
    ['I punched Tom yesterday, and today I walk 10 m to the gate.', 'Mara', [['Act', { distance_m: 10 }]], ['BodyStrike']],
    ['I walked 10 m to the door.', 'Mara', [['Act', { distance_m: 10 }]], []],
    ['Yesterday I bought bread and walked 10 m to the door.', 'Mara', [], ['Act']],
    ['I hit Tom twice.', 'Mara', [['BodyStrike', { who: 'Tom' }]], []],
    // A question asks and a proposal proposes; a directive to a person a vocative names is speech to them (CGEL ch. 10).
    ['Do I walk 10 m to the door?', 'Mara', [], ['Act']],
    ['I walk 10 m to the door?', 'Mara', [], ['Act']],
    ['Do I walk 10 m to the door.', 'Mara', [], ['Act']],
    ['Will I walk 10 m to the door.', 'Mara', [], ['Act']],
    ['I will just walk 10 m to the door.', 'Mara', [['Act', { distance_m: 10 }]], []],
    ['Do I see anyone at the window?', 'Mara', [['Look', { viewer: 'Mara' }]], []],
    ['Let us walk 10 m to the door.', 'Mara', [], ['Act']],
    ['Tom, walk 10 m to the door!', 'Mara', [['Communicate', { speaker: 'Mara', listener: 'Tom', message: 'walk 10 m to the door' }]], ['Act']],
    ['Guard, open the gate!', 'Mara', [['Communicate', { listener: 'the guard', message: 'open the gate' }]], []],
    ['Tom, punch the guard!', 'Mara', [['Communicate', { listener: 'Tom', message: 'punch the guard' }]], ['BodyStrike']],
    ['Tom, please punch the guard!', 'Mara', [['Communicate', { listener: 'Tom' }]], ['BodyStrike']],
    // The prepositional alternant of give and hand (CGEL ch. 4 §4.3); "it" and "him" by their antecedents (ch. 5 §§6.1, 17.2;
    // ch. 17 §3.1).
    ['I give the coin to Tom.', 'Mara', [['Transfer', { to: 'Tom', item: 'coin', from: 'Mara', quantity: 1 }]], []],
    ['I give a coin to a beggar.', 'Mara', [['Transfer', { to: 'the beggar', item: 'coin' }]], []],
    ['I hand the letter back to the captain.', 'Mara', [['Transfer', { to: 'the captain', item: 'letter' }]], []],
    ['I take the coin and give it to Tom.', 'Mara', [['Transfer', { to: 'Tom', item: 'coin' }]], []],
    ['I take the coin from the table and give it to Tom.', 'Mara', [], ['Transfer']],
    ['I take two apples and give them to Tom.', 'Mara', [['Transfer', { to: 'Tom', item: 'apples', quantity: 2 }]], []],
    ['I wait. A coin fell at my feet. I give it to Tom.', 'Mara', [['Transfer', { to: 'Tom', item: 'coin' }]], []],
    ['The knife lay on the table. I give it to Tom.', 'Mara', [], ['Transfer']],
    ['A man walks in. I punch him.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'the man' }]], []],
    ['A man and a woman walk in. I punch her.', 'Mara', [['BodyStrike', { who: 'the woman' }]], []],
    ['A drunk sailor walks in. I punch him.', 'Mara', [['BodyStrike', { who: 'the drunk sailor' }]], []],
    ['A tall man and an old woman walk in. I punch her.', 'Mara', [['BodyStrike', { who: 'the old woman' }]], []],
    ['I hit myself.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Mara' }]], []],
    ['I see Tom and Will.', 'Mara', [['Look', { viewer: 'Mara', target: 'Tom and Will' }]], []],
    // A cleft is read as its basic counterpart (CGEL ch. 2 §16, ch. 16 §9).
    ['It is Tom that I hit.', 'Mara', [['BodyStrike', { attacker: 'Mara', who: 'Tom' }]], []],
    ['What I do is walk 10 m to the door.', 'Mara', [['Act', { who: 'Mara', distance_m: 10 }]], []],
    // A walk the words time and do not end is time spent walking; a goal bounds it (CGEL ch. 3 [18], ch. 8 §4.3 [21]).
    ['I walk for an hour.', 'Mara', [['PassTime', { minutes: 60, walking: [{ who: 'Mara' }] }]], ['Act']],
    ['I walk along the river for an hour.', 'Mara', [['PassTime', { minutes: 60, walking: [{ who: 'Mara' }] }]], []],
    ['I run for ten minutes.', 'Mara', [['PassTime', { minutes: 10, walking: [{ who: 'Mara', running: true }] }]], []],
    ['I walk to the market for an hour.', 'Mara', [], ['PassTime']],
    ['The man I hit runs 10 m to the door.', 'Mara', [], ['Act']],
    // The one spoken to is the whole noun phrase, its head after up to two modifiers; a group of people WordNet files under
    // social group or people is spoken to; a thing and a group of things are not, and a blow lands on no group.
    ['I tell the old blind beggar, "Move along."', 'Mara', [['Communicate', { speaker: 'Mara', listener: 'the old blind beggar', message: 'Move along.' }]], []],
    ['I tell the drunk sailor, "Go home."', 'Mara', [['Communicate', { listener: 'the drunk sailor', message: 'Go home.' }]], []],
    ['I shout to the crew, "Drop the sail!"', 'Mara', [['Communicate', { listener: 'the crew', effort: 'shout', message: 'Drop the sail!' }]], []],
    ['I call to the patrol, "Halt!"', 'Mara', [['Communicate', { listener: 'the patrol', message: 'Halt!' }]], []],
    ['I tell the council, "We march at dawn."', 'Mara', [['Communicate', { listener: 'the council', message: 'We march at dawn.' }]], []],
    ['I tell the town council, "We march at dawn."', 'Mara', [['Communicate', { listener: 'the town council' }]], []],
    ['I give the coin to the crew.', 'Mara', [['Transfer', { to: 'the crew', item: 'coin' }]], []],
    ['I tell the table, "Sit."', 'Mara', [], ['Communicate']],
    ['I hit the board.', 'Mara', [], ['BodyStrike']],
];
let miss = 0;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
for (const [text, player, want, open] of CASES) {
    const { calls } = framedCalls(text, player), bad = [];
    for (const [tool, args] of want) {
        const c = calls.find(x => x.tool === tool);
        if (!c) { bad.push(`no ${tool}`); continue; }
        for (const [k, v] of Object.entries(args)) if (!same(c.args[k], v)) bad.push(`${tool}.${k} = ${JSON.stringify(c.args[k])} (want ${JSON.stringify(v)})`);
    }
    for (const t of open) if (calls.some(x => x.tool === t)) bad.push(`${t} written by code (the words lack an argument): ${JSON.stringify(calls.find(x => x.tool === t).args)}`);
    if (bad.length) { miss++; console.log(`MISS "${text}"\n  ${bad.join('\n  ')}`); }
}
// The planner's Communicate adds the scene's distance to code's words; code's Act stands.
const merged = mergeCalls([{ tool: 'Act', args: { who: 'Tom', action: 'sit down' } }, { tool: 'Communicate', args: { speaker: 'Tom', listener: 'the innkeeper', effort: 'loud', message: 'a pint' } }], [{ tool: 'Communicate', args: { speaker: 'Tom', listener: 'the innkeeper', distance_m: 6, noise: 'loud room (75 dB)' } }]);
if (merged.length !== 2 || merged[1].args.distance_m !== 6 || merged[1].args.effort !== 'loud' || merged[1].args.message !== 'a pint' || merged[0].tool !== 'Act') { miss++; console.log(`MISS mergeCalls: ${JSON.stringify(merged)}`); }
// A planner Look by another viewer leaves the player's own Look draft standing.
const m2 = mergeCalls([{ tool: 'Look', args: { viewer: 'Mara', target: 'the window' } }], [{ tool: 'Look', args: { viewer: 'the occupant', target: 'Mara', size_m: 0.5 } }, { tool: 'Look', args: { viewer: 'Mara', size_m: 0.5, distance_m: 2 } }]);
if (m2.length !== 2 || !m2.some(c => c.args.viewer === 'Mara' && c.args.target === 'the window' && c.args.size_m === 0.5) || !m2.some(c => c.args.viewer === 'the occupant')) { miss++; console.log(`MISS mergeCalls by viewer: ${JSON.stringify(m2)}`); }
if (playerName('User', "[CAST]\nMary (the player's character): a 20-year-old woman") !== 'Mary') { miss++; console.log('MISS playerName from cast'); }
// "He" and "she" in a line in the third person: the last name before that fits, else the player's character when it fits
// their sex; in a line in the first person, someone else.
{
  const { framedCalls: fc } = await import('../src/rules/frame.js');
  const act = (t, sex) => fc(t, 'Mara', sex).calls.some(c => c.tool === 'Act');
  const got = [act('She walks 5 m to the door.', 'female'), act('He walks 5 m to the door.', 'female'), act('Mara pushes Tom. He walks 5 m to the door.', 'female'), act('Mara pushes Tom. She walks 5 m to the door.', 'female'), act('I see Ann. She walks 5 m to the door.', 'female'), act('Mara nods to Ann. She walks 5 m to the door.', 'female')];
  if (JSON.stringify(got) !== '[true,false,false,true,false,false]') { miss++; console.log(`MISS he and she read by the line's names: ${JSON.stringify(got)}`); }
}
// Out-of-character asides are taken out before the line is read.
{
  const { inStory } = await import('../src/rules/frame.js');
  const got = [inStory('I walk 5 m to the door. (OOC: is the door locked?)'), inStory('(OOC: can we skip to the morning?)'), inStory('OOC: brb\nI wait an hour.'), inStory('[OOC I have to go] I sit down.')];
  if (JSON.stringify(got) !== JSON.stringify(['I walk 5 m to the door.', '', 'I wait an hour.', 'I sit down.'])) { miss++; console.log(`MISS out-of-character asides taken out: ${JSON.stringify(got)}`); }
}
// An it-cleft's relative clause lacks what is foregrounded; one with an object of its own is extraposition, left as it is
// (grammar.ts canonical, CGEL ch. 16 §9).
{
  const { canonical } = await import('../src/rules/grammar.js');
  for (const t of ['It is a fact that I hit Tom.', 'It is true that I hit Tom.']) if (canonical(t) !== t) { miss++; console.log(`MISS extraposition read as a cleft "${t}": ${canonical(t)}`); }
}
// A timed walk settles the Act it routes (the planner is not asked for the walk again).
if (!framedCalls('I walk for an hour.', 'Mara').covered.has('Act')) { miss++; console.log('MISS a timed walk settles the Act'); }
// The acts in the order the line tells them (CGEL ch. 15 §2.2.3): "and then", a clause opened by "before" or "after".
{
  const ORDER = [['I wait for twenty minutes and then walk 10 m to the door.', 'PassTime,Act'], ['I walk 10 m to the door and wait an hour.', 'Act,PassTime'],
    ['Before I walk 10 m to the door, I wait an hour.', 'PassTime,Act'], ['I walk 10 m to the door after I wait an hour.', 'PassTime,Act']];
  for (const [t, want] of ORDER) { const got = framedCalls(t, 'Mara').calls.map(c => c.tool).join(','); if (got !== want) { miss++; console.log(`MISS order "${t}": ${got} (want ${want})`); } }
}
// R47: "him" is a person named before, not a thing after a preposition ("with a lantern", "at the gate"); one met as "a monk"
// is "the monk"; a word that takes a person starts the next phrase ("at the bar with my brother"); a pronoun names no one new.
{
  const WHO = [['A sailor walks in with a lantern. I punch him.', 'the sailor'], ['I walk to the counter and look at the man. I punch him.', 'the man'],
    ['Tom walks to the gate. I punch him.', 'Tom'], ['A woman waits at the gate. I punch her.', 'the woman'], ['I talk with a monk at the fire. I punch him.', 'the monk'],
    ['I sit at the bar with my brother. I punch him.', 'my brother'], ['I talk to the guard. I punch him.', 'the guard'], ['I wave to him. I punch him.', undefined]];
  const wrong = WHO.map(([t, want]) => [t, framedCalls(t, 'Mara', 'female').calls.find(c => c.tool === 'BodyStrike')?.args.who, want]).filter(([, got, want]) => got !== want);
  if (wrong.length) { miss++; console.log(`MISS him and her as a person named before: ${wrong.map(([t, got, want]) => `"${t}" ${got} (want ${want})`).join('; ')}`); }
}
// R48: markdown emphasis is how a line is set: a line framed with * or _ around its words gives the calls of the plain line
// (CommonMark: a _ inside a word is no emphasis, so snake_case stays).
{
  const { inStory, unEmphasis = t => t } = await import('../src/rules/frame.js');
  const PAIRS = [['I talk to *Rob* about the horse.', 'I talk to Rob about the horse.'], ['I **punch** Tom.', 'I punch Tom.'], ['I punch **Tom**.', 'I punch Tom.'],
    ['I _whisper_ to Will, "Run."', 'I whisper to Will, "Run."'], ['I wait *ten* minutes.', 'I wait ten minutes.'], ['***I punch Tom.***', 'I punch Tom.']];
  const calls = t => JSON.stringify(framedCalls(t, 'Mara', 'female').calls);
  const differ = PAIRS.filter(([a, b]) => calls(a) !== calls(b) || calls(inStory(a)) !== calls(b));
  // The line as meant reads the story's words (question-pass.ts: the line and the earlier ones through inStory): "again" is
  // the last act, without its asterisks.
  const { understand } = await import('../src/rules/intent.js');
  const again = understand(inStory('again'), { player: 'Mara', people: [{ name: 'Tom', sex: 'male' }], narration: [], earlier: [inStory('*I punch Tom.*')], lastCalls: [] }).changes[0]?.to;
  if (differ.length || again !== 'I punch Tom.' || unEmphasis('I look at the_old_map, 2*3.') !== 'I look at the_old_map, 2*3.') { miss++; console.log(`MISS emphasis read as words: ${differ.map(([a]) => a).join(' | ')}; again → ${again}; ${unEmphasis('I look at the_old_map, 2*3.')}`); }
}
// R56: an Act's action begins with its motion verb, as the Act tool takes it (actions.ts MOTION_START), and leaves out the
// sentences after it that make no move.
{
  const { MOTION_START } = await import('../src/rules/actions.js'), mre = new RegExp(MOTION_START);
  const ACTS = [['Today I walk 10 m to the gate.', 'walk 10 m to the gate.'], ['I punch Tom. I walk 10 m to the door.', 'walk 10 m to the door.'],
    ['*I walk 10 m to the door.* Hello there.', 'walk 10 m to the door.'], ['I walk 5 m to the door. Then I walk 10 m to the gate.', 'walk 5 m to the door. Then I walk 10 m to the gate.'],
    ['"Run!" I shout, and walk 10 m to the door.', 'walk 10 m to the door.'], ['Mara sits down at the table.', 'sits down at the table.']];
  const wrong = ACTS.map(([t, want]) => [t, framedCalls(t, 'Mara').calls.find(c => c.tool === 'Act')?.args.action, want]).filter(([, got, want]) => got !== want || !mre.test(got));
  if (wrong.length) { miss++; console.log(`MISS an Act's action from its motion verb: ${wrong.map(([t, got]) => `"${t}" → "${got}"`).join('; ')}`); }
}
// A climb, a jump or a swim with a distance is no walk of unknown kind, also when the Act tool reads it from a model's action
// (actions.ts stepsFromWords; frame.ts drafts an Act only from a known motion verb).
{
  const Ac = await import('../src/rules/actions.js');
  const walks = ['climbs onto the roof and jumps to the next building, two metres across.', 'swims 20 m to the boat.'].filter(t => 'steps' in Ac.stepsFromWords(t, 'Mara'));
  if (walks.length) { miss++; console.log(`MISS a climb or a jump is no walk of unknown kind: ${walks.join(' | ')}`); }
}
// An auxiliary before a lowercase word is no inverted question: a model's action "will just walk 10 m to the door" walks
// (the subject after an inverted auxiliary is matched with its case, grammar.ts QUESTION_INVERSION).
{
  const Ac = await import('../src/rules/actions.js');
  if (!('steps' in Ac.stepsFromWords('will just walk 10 m to the door.', 'Mara'))) { miss++; console.log('MISS an auxiliary before a lowercase word is no question in an action'); }
}
// R58: words in any quotation marks are what is said: „…“, »…«, «…», ›…‹ and ‹…› give the message as "…" does.
{
  const said = t => framedCalls(t, 'Mara').calls.find(c => c.tool === 'Communicate')?.args.message;
  const QUOTES = ['I say to Tom, „Run away!“', 'I say to Tom, »Run away!«', 'I say to Tom, «Run away!»', 'I say to Tom, ›Run away!‹', 'I say to Tom, ‹Run away!›', 'I say to Tom, ‚Run away!‘', 'I say to Tom, "Run away!"'];
  const wrong = QUOTES.filter(t => said(t) !== 'Run away!' || framedCalls(t, 'Mara').calls.some(c => c.tool === 'Act'));
  if (wrong.length) { miss++; console.log(`MISS quoted words in any quotation marks: ${wrong.map(t => `${t} → ${said(t)}`).join(' | ')}`); }
}
// A manner or a topic after the one spoken to is no message ("with all my might", "about my plan"): a fact Tom learned read
// "with all my might".
{
  const msg = t => framedCalls(t, 'Mara').calls.find(c => c.tool === 'Communicate')?.args.message;
  const bad = ['I shout to Tom with all my might.', 'I tell Tom about my plan.'].filter(t => msg(t) !== undefined);
  if (bad.length || msg('I tell Tom the IT desk is on the 2nd floor.') !== 'the IT desk is on the 2nd floor') { miss++; console.log(`MISS a manner or a topic is no message: ${bad.map(t => `${t} → ${msg(t)}`).join(' | ')}`); }
}
// An emphasis inside another is read as the words ("*I punch **Tom**.*" struck no one); a lone * stays (2*3).
{
  const { unEmphasis } = await import('../src/rules/frame.js');
  const who = framedCalls('*I punch **Tom**.*', 'Mara').calls.find(c => c.tool === 'BodyStrike')?.args.who, lone = unEmphasis('I pay 2*3 coins and *smile*.');
  if (who !== 'Tom' || lone !== 'I pay 2*3 coins and smile.') { miss++; console.log(`MISS emphasis inside emphasis: who ${who}; ${lone}`); }
}
// "Him" looked at is the man the line names before it ("Tom laughs at me. I glare at him."), not the word "him".
{
  const t = l => framedCalls(l, 'Mara').calls.find(c => c.tool === 'Look')?.args.target;
  const got = [t('Tom laughs at me. I glare at him.'), t('I glare at him.')];
  if (got[0] !== 'Tom' || got[1] !== undefined) { miss++; console.log(`MISS a pronoun looked at is its person: ${JSON.stringify(got)}`); }
}
// A number in figures counts as one in words: "I give Will 3 coins" hands three over.
{
  const tr = l => framedCalls(l, 'Mara').calls.find(c => c.tool === 'Transfer')?.args;
  const got = ['I give Will 3 coins.', 'I give 3 coins to Will.', 'I hand Tom 2 apples.'].map(tr);
  if (got[0]?.quantity !== 3 || got[0]?.to !== 'Will' || got[1]?.quantity !== 3 || got[1]?.to !== 'Will' || got[2]?.quantity !== 2 || got[2]?.item !== 'apples') { miss++; console.log(`MISS numbers in figures hand over: ${JSON.stringify(got)}`); }
}
// A posture held for a timed while passes the time ("I sit by the fire for an hour": the planner is skipped when code settles
// every routed tool, and the hour had not passed); the words said end where another's clause is joined on.
{
  const f = l => framedCalls(l, 'Mara').calls;
  const wait = ['I sit by the fire for an hour.', 'I hide behind the barrel for ten minutes.', 'I lie on the bed for 20 minutes.'].map(l => f(l).find(c => c.tool === 'PassTime')?.args.minutes);
  const msg = f('I ask Tom for the key, and he gives it to me.').find(c => c.tool === 'Communicate')?.args.message, kept = f('I tell Will that Tom and Ann left.').find(c => c.tool === 'Communicate')?.args.message;
  if (wait.join() !== '60,10,20' || msg !== 'for the key' || kept !== 'that Tom and Ann left' || f('Tom sits by the fire for an hour.').length) { miss++; console.log(`MISS a timed posture passes the time, a joined clause ends the words: ${wait.join()}; ${msg}; ${kept}`); }
}
console.log(`${CASES.length + 23} checks, ${miss} miss(es)`);
process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
