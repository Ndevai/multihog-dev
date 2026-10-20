// Player lines and the tools code must route each to (src/rules/router.ts), checked without the model.
// Usage: npx tsc -p . && node tests/route.test.mjs   (prints each miss; exits 1 on any)
const { routeTurn } = await import('../src/rules/router.js');
const { stepsFromWords, distanceIn } = await import('../src/rules/actions.js');
// [player line, tools it needs, tools it must leave out]
const CASES = [
    // The test stories (tools/run-story.mjs).
    ['I step out of my house onto the street.', ['Act'], ['Communicate', 'BodyStrike']],
    ['I walk the three hundred yards to the market on Wentworth Street.', ['Act'], ['Communicate']],
    ['I ask the costermonger for a pound of apples and pay him.', ['Price', 'Transfer', 'Communicate'], ['Act']],
    ['I walk home and give Will one of the apples.', ['Act', 'Transfer'], []],
    ['I sit down at a table near the fire.', ['Act'], ['Communicate']],
    ['I call to the innkeeper for a pint of ale.', ['Communicate', 'Price'], ['Act']],
    ['Two men at the next table are whispering. I keep still and listen.', ['Listen'], ['Act']],
    ['I go to the innkeeper and tell him what I heard.', ['Act', 'Communicate'], []],
    ['I climb the wall.', ['BodyCheck'], ['Communicate']],
    ['I drop down into the garden on the other side and wait in the shadow of the hedge.', ['BodyFall', 'PassTime'], ['Communicate']],
    ['I creep across the lawn to the lit window.', ['Act'], ['Communicate']],
    ['I look through the window to see who is inside.', ['Look'], ['Communicate']],
    // Other lines of the same classes.
    ['"Good evening," I say to the guard.', ['Communicate', 'Interpret'], ['Act']],
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
];
// [text, metres the action reader must find]
const DISTANCES = [['three hundred yards', 274.3], ['half a mile', 804.7], ['50 m', 50], ['fifty feet', 15.2], ['2 km', 2000]];
let miss = 0;
for (const [text, want, not] of CASES) {
    const got = new Set(routeTurn(text).tools);
    const lacking = want.filter(t => !got.has(t)), extra = not.filter(t => got.has(t));
    if (lacking.length || extra.length) { miss++; console.log(`MISS "${text}"\n  routed: ${[...got].join(', ') || '(none)'}${lacking.length ? `\n  lacking: ${lacking.join(', ')}` : ''}${extra.length ? `\n  wrong: ${extra.join(', ')}` : ''}`); }
}
for (const [text, m] of DISTANCES) if (distanceIn(text) !== m) { miss++; console.log(`MISS distance "${text}": ${distanceIn(text)} (want ${m})`); }
const walk = stepsFromWords('I walk the three hundred yards to the market on Wentworth Street.', 'Mary');
if (!('steps' in walk) || walk.steps[0].distance_m !== 274.3 || !/market/.test(walk.steps[0].to ?? '')) { miss++; console.log(`MISS walk steps: ${JSON.stringify(walk)}`); }
console.log(`${CASES.length + DISTANCES.length + 1} checks, ${miss} miss(es)`);
process.exit(miss ? 1 : 0);
