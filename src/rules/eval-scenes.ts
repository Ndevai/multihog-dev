// Scenes with the tool calls a correct reading needs, for scoring the question pass (docs/df-body-engine.md §7.4). Each
// expected call names the arguments that decide its outcome; other arguments are free. Scenes 40–44 need no call.

/** An argument check: text equal ignoring case ("~text": contains), a number, a [low, high] range, a list containing a
 * name, or a list of at least n items. */
export type Check = string | number | [number, number] | { has: string } | { minLen: number };
export interface EvalScene {
    id: number; context: string; player: string; tracker?: string;
    expect: { tool: string; args?: Record<string, Check> }[];
    /** Extra tools a correct reading may also call. */
    allow?: string[];
}

export const EVAL_TRACKER = `[TIME]
Tuesday 12 March 1850, 14:00
[/TIME]
[CAST]
Mara (the player's character): human woman, 62 kg; fighting Competent; trained climber.
Tom: human man, 80 kg; fighting Novice.
[/CAST]`;

const LIE = 'a statement that might be a lie', EMERGENCY = 'an emergency they witness', ORDER = 'an order to hurt someone';
const FAVOUR = 'a small favour asked by a stranger', MEETING = 'a brief first meeting';

export const EVAL_SCENES: EvalScene[] = [
    { id: 1, context: 'The old garden wall is three metres high, its stones loose and slick with moss.', player: 'Mara climbs the wall.', expect: [{ tool: 'BodyCheck', args: { who: 'Mara' } }] },
    { id: 2, context: 'A bandit blocks the road, unarmoured, within reach.', player: 'Mara swings her steel long sword at the bandit\'s head.', expect: [{ tool: 'BodyStrike', args: { who: '~bandit', part: '~head', weapon: 'long sword', material: 'steel', attacker: 'Mara' } }] },
    { id: 3, context: 'A grey wolf circles Mara in the snow, then lunges.', player: 'Mara tries to kick it away.', expect: [{ tool: 'BodyStrike' }], allow: ['BodyStrike'] },
    { id: 4, context: 'Mara slipped and now hangs from the cliff edge by both hands; Tom needs about a minute to fetch the rope.', player: 'Mara holds on until Tom is back.', expect: [{ tool: 'HoldOn', args: { who: 'Mara', hanging: 'true', seconds: [30, 120] } }] },
    { id: 5, context: 'The tavern is packed and loud. The guard stands by the door, about eight metres away.', player: 'Mara calls to the guard: "Is the north gate open?"', expect: [{ tool: 'Communicate', args: { speaker: 'Mara', listener: '~guard', distance_m: [5, 12] } }] },
    { id: 6, context: 'Tom keeps watch on a quiet night. Half a kilometre away, behind the hill, a hunter fires his rifle.', player: 'Does Tom notice anything?', expect: [{ tool: 'Listen', args: { listener: 'Tom', sound: 'gunshot (rifle)', distance_m: [300, 800] } }] },
    { id: 7, context: 'At dusk a rider crests the ridge about two kilometres from the watchtower.', player: 'Tom, on the tower, scans the ridge.', expect: [{ tool: 'Look', args: { viewer: 'Tom', distance_m: [1500, 2500] } }] },
    { id: 8, context: 'The captain asks where Mara was last night. She was at the smugglers\' cove.', player: 'Mara: "I was asleep at the inn all night."', expect: [{ tool: 'SocialResponse', args: { situation: LIE, who: '~captain', speaker: 'Mara', is_lie: 'true' } }] },
    { id: 9, context: 'A man collapses in the market square, gasping. A baker and four other people stand nearby.', player: 'Mara watches what the baker does.', expect: [{ tool: 'SocialResponse', args: { situation: EMERGENCY, who: '~baker', others: [3, 6] } }] },
    { id: 10, context: 'In the cell, the officer tells the young soldier to beat the prisoner standing in front of him.', player: 'Mara, chained in the corner, watches the soldier.', expect: [{ tool: 'SocialResponse', args: { situation: ORDER, order: 'victim in the same room' } }] },
    { id: 11, context: 'A stranger in a long coat waits at the coach stop.', player: 'Mara asks the stranger to keep an eye on her bag for a minute.', expect: [{ tool: 'SocialResponse', args: { situation: FAVOUR } }] },
    { id: 12, context: 'At the harvest dance, Mara is introduced to a young farmer named Elias; they talk for a few minutes.', player: 'Mara wonders whether Elias liked her.', expect: [{ tool: 'SocialResponse', args: { situation: MEETING, who: 'Elias' } }] },
    { id: 13, context: 'A guard spots Mara twenty metres away and shouts.', player: 'Mara runs for the alley.', expect: [{ tool: 'Chase', args: { fleeing: 'Mara', gap_m: [15, 25] } }] },
    { id: 14, context: 'The roof tiles give way under Mara, ten metres above the cobbled courtyard.', player: 'Mara falls.', expect: [{ tool: 'BodyFall', args: { who: 'Mara', height_m: [8, 12] } }] },
    { id: 15, context: 'An iron pan has been on the fire for an hour.', player: 'Mara grabs the pan\'s iron handle with her right hand for a couple of seconds.', expect: [{ tool: 'BodyContact', args: { who: 'Mara', material: 'iron', seconds: [1, 5] } }] },
    { id: 16, context: 'After the long march Mara finds a spring.', player: 'Mara drinks a full bottle of water.', expect: [{ tool: 'BodyIntake', args: { who: 'Mara', water_l: [0.4, 1.1] } }] },
    { id: 17, context: 'Tom has a guard in a locked rear choke.', player: 'Tom keeps the choke on for fifteen seconds.', expect: [{ tool: 'BodyChoke', args: { who: '~guard', holder: 'Tom', seconds: [10, 20] } }] },
    { id: 18, context: 'Tom bleeds heavily from wound 2, an artery in his thigh. Mara learned bleeding control as an army medic.', player: 'Mara puts a tourniquet on Tom\'s thigh.', expect: [{ tool: 'BodyTreat', args: { who: 'Tom', treatment: 'stop_bleeding', training: 'trained' } }] },
    { id: 19, context: 'The camp is safe and quiet.', player: 'Mara and Tom sleep for eight hours.', expect: [{ tool: 'PassTime', args: { minutes: [420, 540], sleeping: { has: 'Mara' } } }] },
    { id: 20, context: 'The road to the next town is twenty kilometres of dirt road.', player: 'Mara marches there with her 25 kg pack at a normal pace.', expect: [{ tool: 'PassTime', args: { 'walking.0.who': 'Mara', 'walking.0.load_kg': [20, 30] } }] },
    { id: 21, context: 'Mara and Tom are in Lyon. They step out of the inn in the morning.', player: 'What is the weather like?', expect: [{ tool: 'Weather', args: { place: '~Lyon' } }] },
    { id: 22, context: 'The ferry capsized; the lake is near freezing.', player: 'Mara swims for the shore.', expect: [{ tool: 'BodyEnvironment', args: { who: { has: 'Mara' }, swimming: 'true' } }], allow: ['PassTime'] },
    { id: 23, context: 'London, 1700. Mara is at a baker\'s stall.', player: 'Mara buys two kilos of bread.', tracker: '[TIME]\nTuesday 4 May 1700, 09:00\n[/TIME]', expect: [{ tool: 'Price', args: { question: 'price of goods', item: 'bread (kg)', quantity: 2, city: 'London' } }] },
    { id: 24, context: 'Paris, 1780. A master mason is looking for work on the cathedral.', player: 'Mara asks what a mason earns in a day here.', tracker: '[TIME]\nThursday 1 June 1780, 10:00\n[/TIME]', expect: [{ tool: 'Price', args: { question: 'daily wage', trade: 'building craftsman', city: 'Paris' } }] },
    { id: 25, context: 'Tom played with the neighbour\'s children, who all have chickenpox.', player: 'When will Tom start showing symptoms?', expect: [{ tool: 'Disease', args: { disease: 'chickenpox', question: 'when symptoms start', who: 'Tom' } }] },
    { id: 26, context: 'Measles reaches a mountain village of 300 people; about 40 % had it as children.', player: 'How bad will the outbreak get?', expect: [{ tool: 'Disease', args: { disease: 'measles', question: 'how many fall ill', population: 300, immune_share: [0.35, 0.45] } }] },
    { id: 27, context: 'July 1863. Three thousand infantry form up to assault a hill held by twelve hundred defenders.', player: 'The assault begins.', tracker: '[TIME]\nThursday 2 July 1863, 15:00\n[/TIME]', expect: [{ tool: 'Battle', args: { attackers: 3000, defenders: 1200 } }] },
    { id: 28, context: 'The last guard sees his comrades fall and Mara advancing with her sword.', player: 'What does the guard do?', expect: [{ tool: 'Choose', args: { who: '~guard', options: { minLen: 2 } } }] },
    { id: 29, context: 'Mara pushes open the door of a roadside inn she has never visited.', player: 'Mara walks up to the innkeeper.', expect: [{ tool: 'NewCharacter', args: { who: '~innkeeper' } }], allow: ['NameCharacter'] },
    { id: 30, context: 'Ohio, 1952. A diner. The waitress, about 25, comes to take the order.', player: 'Mara reads the waitress\'s name tag.', tracker: '[TIME]\nThursday 14 August 1952, 12:30\n[/TIME]', expect: [{ tool: 'NameCharacter', args: { sex: 'female', birth_year: [1923, 1931] } }], allow: ['NewCharacter'] },
    { id: 31, context: 'Tokyo, 1990. A salaryman born in 1960 bumps into Mara on the platform.', player: 'Mara sizes him up.', tracker: '[TIME]\nTuesday 3 April 1990, 08:10\n[/TIME]', expect: [{ tool: 'BodySize', args: { country: '~Japan', sex: 'male', birth_year: 1960 } }], allow: ['NewCharacter'] },
    { id: 32, context: 'Mara\'s brother broke into the prison at great risk and freed her.', player: 'How does Mara feel about her brother?', expect: [{ tool: 'Appraise', args: { who: 'Mara', about: 'someone else\'s action' } }] },
    { id: 33, context: 'From behind a pillar Mara sees the duke slip a letter under the chapel altar.', player: 'Mara stays hidden and watches.', expect: [{ tool: 'RecordFact', args: { known_by: { has: 'Mara' } } }] },
    { id: 34, context: 'Mara knows Flame Lash (Fire, complexity 3).', player: 'Mara casts Flame Lash at the door.', expect: [{ tool: 'CastSpell', args: { who: 'Mara', complexity: 3 } }] },
    { id: 35, context: 'Mara clears shards from a broken window.', player: 'Mara slips and a shard slices her left palm.', expect: [{ tool: 'BodyWound', args: { who: 'Mara', type: 'cut', part: '~hand' } }] },
    { id: 36, context: 'A bandit stands 30 metres away in the open.', player: 'Mara shoots an arrow at him with her bow.', expect: [{ tool: 'BodyCheck', args: { who: 'Mara' } }, { tool: 'BodyStrike', args: { launcher: 'bow' } }] },
    { id: 37, context: 'The climbers reach the high camp at 4500 metres after a three-day ascent.', player: 'They set up the tents.', expect: [{ tool: 'BodyEnvironment', args: { altitude_m: [4300, 4700] } }] },
    { id: 38, context: 'The house is on fire; thick smoke fills the hallway.', player: 'Mara crawls through the hallway to find Tom.', expect: [{ tool: 'BodyEnvironment', args: { smoke: 'true' } }], allow: ['PassTime', 'BodyCheck'] },
    { id: 39, context: 'A knight in a mail shirt and iron helm faces Tom.', player: 'Tom strikes the knight\'s chest with his iron mace.', expect: [{ tool: 'BodyStrike', args: { who: '~knight', weapon: 'mace', 'target_armor.0.item': '~mail' } }] },
    { id: 40, context: 'Mara and Tom sit at a table in the inn, talking about the weather.', player: 'Mara says: "Pass the salt, please."', expect: [] },
    { id: 41, context: 'Mara unfolds the map in her hands.', player: 'Mara reads the map.', expect: [] },
    { id: 42, context: 'The door to the kitchen stands open.', player: 'Mara walks into the kitchen.', expect: [] },
    { id: 43, context: 'Mara sits by the fire, warm and fed.', player: 'Mara thinks about home.', expect: [], allow: ['Appraise'] },
    { id: 44, context: 'Tom tells a joke at dinner.', player: 'Mara laughs.', expect: [] },
    { id: 45, context: 'Evening at the tavern.', player: 'Mara drinks three pints of beer.', expect: [{ tool: 'BodyIntake', args: { who: 'Mara', alcohol_g: [25, 70] } }] },
    { id: 46, context: 'Tom is across the dark warehouse, ten metres away; no lamps are lit.', player: 'Mara signals Tom with her hand to stay down.', expect: [{ tool: 'Communicate', args: { speaker: 'Mara', listener: 'Tom', means: 'gesture', lit: 'false' } }] },
    { id: 47, context: 'Night. A sentry stands thirty metres away. The courtyard is gravel.', player: 'Mara walks across the courtyard toward the gate.', expect: [{ tool: 'Listen', args: { listener: '~sentry', sound: 'footsteps on gravel or sand' } }], allow: ['Look', 'BodyCheck'] },
    { id: 48, context: 'A farm dog spots a fox ten metres away at the edge of the field.', player: 'The dog chases the fox.', expect: [{ tool: 'Chase', args: { gap_m: [5, 15] } }] },
    { id: 49, context: 'The guard dozes at the gate.', player: 'Mara sneaks past the guard, then waits ten minutes in the shadows.', expect: [{ tool: 'BodyCheck', args: { who: 'Mara' } }, { tool: 'PassTime', args: { minutes: 10 } }], allow: ['Listen', 'Look'] },
    { id: 50, context: 'The caravan sets off across the desert at noon; it is 40 °C in the sun.', player: 'They walk for three hours.', expect: [{ tool: 'BodyEnvironment', args: { air_c: [35, 45] } }, { tool: 'PassTime', args: { minutes: 180 } }] },
    { id: 51, context: 'England, 1850. Mara, a seamstress, walks home past the docks at night.', player: 'Mara pulls the revolver from her coat.', expect: [{ tool: 'Claim', args: { who: 'Mara', kind: 'something the character has', in_world: 'true' } }] },
    { id: 52, context: 'England, 1850. Mara stands in the rain outside the church.', player: 'I am a cat. Mara slinks under the gate.', expect: [{ tool: 'Claim', args: { who: 'Mara', kind: 'what the character is', species: '~cat' } }] },
    { id: 53, context: 'Mara wakes in a fern forest beside a lake; the time machine smokes behind her. A dinosaur skeleton lies in the mud.', player: 'Mara remembers how she rebuilt the time machine\'s coil last year.', expect: [{ tool: 'Claim', args: { who: 'Mara', kind: 'something that happened before' } }] },
    { id: 54, context: 'The ferryman holds out his hand; the fare across is two pennies, as everyone knows.', player: 'Mara pays the ferryman.', expect: [{ tool: 'Transfer', args: { item: '~penn', quantity: 2, from: 'Mara', to: '~ferryman' } }] },
    { id: 55, context: 'Mara\'s fingers closed on the merchant\'s purse and slid it into her sleeve; he walked on without noticing.', player: 'Mara walks to the inn.', expect: [{ tool: 'Transfer', args: { item: '~purse', from: '~merchant', to: 'Mara', how: 'stolen' } }], allow: ['PassTime'] },
];
