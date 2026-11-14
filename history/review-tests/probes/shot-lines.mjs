// The 27 shot and fire lines of section 38, routed by a tree's router: node shot-lines.mjs <tree> [one line]
// (<tree> is an absolute path to an unzipped, built tree). Prints each line with its tools and the word that asked.
const dir = process.argv[2];
const { routeTurn } = await import(dir + '/src/rules/router.js');
const lines = process.argv[3] ? [process.argv[3]] : [
 'I fire my pistol at the guard.', 'I fire at the bandit.', 'I fire twice at the wolf.', 'I fire an arrow at the wolf.', 'I aim and fire.',
 'I fire a warning shot into the air.', 'I fire my weapon at the soldier.', 'I fire the cannon at the ship.',
 'I fire the cook.', 'I fire him on the spot.', 'I fire up the stove.', 'I fire the kiln.',
 'I open fire on the soldiers.', 'I return fire.', 'I hold my fire.', 'I hold fire until they come closer.',
 'I take a shot at the guard with my pistol.', 'I take aim at the deer.', 'I take a shot of whiskey.',
 'I shoot the guard with my pistol.', 'I gun him down.', 'I snipe the sentry from the roof.', 'I pick off the guard.',
 'The fire crackles. I warm my hands.', 'I sit by the fire.', 'I set fire to the barn.', 'I catch fire.',
];
for (const l of lines) { const r = routeTurn(l); console.log(JSON.stringify(l).padEnd(48), JSON.stringify(r.why)); }
