// Player lines and the calls code must write from them (src/rules/frame.ts), checked without the model.
const { framedCalls, playerName, mergeCalls } = await import('../src/rules/frame.js');
// [line, player, expected calls (each: tool and the arguments that must match), tools code must leave to the planner]
const CASES = [
    ['I step out of my house onto the street.', 'Mary', [], ['Act']],
    ['I walk the three hundred yards to the market on Wentworth Street.', 'Mary', [['Act', { who: 'Mary', distance_m: 274.3 }]], []],
    ['I ask the costermonger for a pound of apples and pay him.', 'Mary', [['Communicate', { speaker: 'Mary', listener: 'the costermonger', message: 'for a pound of apples' }]], ['Transfer']],
    ['I walk home and give Will one of the apples.', 'Mary', [['Transfer', { to: 'Will', item: 'apples', quantity: 1, how: 'given', from: 'Mary' }]], ['Act']],
    ['I sit down at a table near the fire.', 'Tom', [['Act', { who: 'Tom' }]], []],
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
    ['I call to the innkeeper for a pint of ale.', 'Tom', [['Price', { item: 'beer (litre)', quantity: 0.568 }]], []],
    ['I ask the costermonger for a pound of apples and pay him.', 'Mary', [['Price', { item: 'apples (kg)', quantity: 0.454 }]], []],
    ['I buy two loaves of bread.', 'Ann', [['Price', { item: 'bread (kg)', quantity: 3.94 }]], []],
    ['I eat the bread.', 'Ann', [], ['Price']],
    ['I buy a pound of pears.', 'Ann', [['Price', { good: 'pears', quantity: 0.454 }]], []],
    ['I punch the sailor in the jaw.', 'Jack', [['BodyStrike', { attacker: 'Jack', who: 'the sailor', attack: 'punch', part: 'head' }]], []],
    ['I stand up and walk 5 m to the door.', 'Ann', [['Act', { distance_m: 5 }]], []],
    ['Two men at the next table are whispering. I keep still and listen.', 'Tom', [['Listen', { listener: 'Tom' }]], []],
    ['I go to the innkeeper and tell him what I heard.', 'Tom', [], ['Listen']],
    ['I look through the window to see who is inside.', 'Mara', [['Look', { viewer: 'Mara', target: 'the window' }]], []],
    ['I eavesdrop on the soldiers.', 'Ann', [['Listen', { listener: 'Ann' }]], []],
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
console.log(`${CASES.length + 3} checks, ${miss} miss(es)`);
process.exit(miss ? 1 : 0);
