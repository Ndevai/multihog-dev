// The player's line as meant (src/rules/intent.ts), read from the scene it was written in, checked without the model.
// Usage: npx tsc -p . && node tests/intent.test.mjs   (prints each miss; exits 1 on any)
const I = await import('../src/rules/intent.js'), A = await import('../src/rules/ask.js');
const people = [{ name: 'Mara', sex: 'female' }, { name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }, { name: 'the guard', sex: null }];
const sit = ({ narration = '', earlier = [], lastCalls = [] } = {}) => ({ player: 'Mara', people, narration: [narration], earlier, lastCalls });
const punchTom = { earlier: ['I punch Tom in the jaw.'], lastCalls: [{ tool: 'BodyStrike', args: { attacker: 'Mara', who: 'Tom' } }] };
// [line, scene, the line as meant]
const READ = [
    // Noise in the words: a form that is no word read as the word one slip away the scene makes likeliest (Damerau 1964;
    // the noisy channel, Gibson et al. 2013); none when two words are as near and the scene favours neither.
    ['I punhc the guard.', {}, 'I punch the guard.'],
    ['I attakc Tom.', {}, 'I attack Tom.'],
    ['I attack Tom wiht my knife.', {}, 'I attack Tom with my knife.'],
    ['I have the wiht.', {}, 'I have the wiht.'],
    ['I hit the gaurd.', { narration: 'The guard blocks the gate.' }, 'I hit the guard.'],
    ['I walk to the dorr.', { narration: 'A lamp burns by the door.' }, 'I walk to the door.'],
    ['I pick up the bowk.', {}, 'I pick up the bowk.'],
    ['I light the candel.', {}, 'I light the candel.'],
    ['I light the candel.', { narration: 'A candle stands on the table.' }, 'I light the candle.'],
    ['I hit Thom.', {}, 'I hit Thom.'],
    ['I hit Thrain.', {}, 'I hit Thrain.'],
    // Words the lexicon's build had dropped (prefixed forms: lexicon.ts with data/wordnet.ts PREFIXED) and a prefixed past.
    ['I am unable to move.', {}, 'I am unable to move.'],
    ['I row into the inlet.', {}, 'I row into the inlet.'],
    ['Mara walks into the kitchen.', {}, 'Mara walks into the kitchen.'],
    ['Mara remembers how she rebuilt the coil.', {}, 'Mara remembers how she rebuilt the coil.'],
    ['"I punhc you," I say.', {}, '"I punhc you," I say.'],
    // A hand-over with its "to" dropped (CGEL ch. 4 §4.3; Gibson et al. 2013).
    ['I give the coin Tom.', {}, 'I give the coin to Tom.'],
    ['I give Tom the coin.', {}, 'I give Tom the coin.'],
    // What was just done (CGEL ch. 17 §7.6).
    ['Again.', punchTom, 'I punch Tom in the jaw.'],
    ['I do it again.', punchTom, 'I punch Tom in the jaw.'],
    ['I do the same to Will.', punchTom, 'I punch Will in the jaw.'],
    ['Same to Will.', punchTom, 'I punch Will in the jaw.'],
    ['I hit him again.', punchTom, 'I hit him again.'],
    // "Back": in return, to the one who did it last (Open English WordNet 2024, back, adv.).
    ['I hit him back.', { narration: 'Will laughs. Tom shoves you hard.' }, 'I hit Tom back.'],
    ['I hit him back.', { narration: 'Will laughs. Tom sits down.' }, 'I hit him back.'],
    // A stated goal fills a search with no "for" (Zwaan & Radvansky 1998; Baker, Saxe & Tenenbaum 2009).
    ['I search the desk.', { earlier: ["I'm looking for the key."] }, 'I search the desk for the key.'],
    ['I search the desk.', { earlier: ["I'm looking for the key.", 'I want to find the letter.'] }, 'I search the desk for the letter.'],
    ['I search the desk for a pen.', { earlier: ["I'm looking for the key."] }, 'I search the desk for a pen.'],
    ['I search the desk.', {}, 'I search the desk.'],
];
let miss = 0;
for (const [line, scene, want] of READ) { const got = I.understand(line, sit(scene)).text; if (got !== want) { miss++; console.log(`MISS meant "${line}": "${got}" (want "${want}")`); } }
// Who "him" is: the Bayesian pronoun model's weights (Kehler & Rohde; Rosa & Arnold 2017; Gundel et al. 1993), taken or
// asked by the mixed-initiative rule (ask.ts): a blow asks below 0.9, a word is taken above 0.5.
const pick = (line, narration) => {
    const m = I.understand(line, sit({ narration }));
    const d = A.decide(m.text, 'Mara', people, () => true, { narration: [narration], lastTargets: [], pronouns: Object.fromEntries(m.open.map(o => [o.pronoun, o.weights])) }, () => 0.5);
    return { weights: m.open[0]?.weights, d: d ? ('ask' in d ? 'ask' : `take ${d.take.label}`) : 'none' };
};
const WHO = [
    ['I tell him to leave.', 'Will glares at Tom.', 'take Tell Will'],
    ['I punch him.', 'Will glares at Tom.', 'ask'],
    ['I tell him to leave.', 'Tom and Will shove you.', 'ask'],
    ['I wave at him.', 'Will glares at Tom.', 'none'],
];
for (const [line, n, want] of WHO) { const got = pick(line, n); if (got.d !== want) { miss++; console.log(`MISS who "${line}" after "${n}": ${got.d} (want ${want}) ${JSON.stringify(got.weights)}`); } }
const w = pick('I punch him.', 'Will glares at Tom.').weights ?? {};
if (!(Math.abs(w.Will / (w.Will + w.Tom + w['the guard']) - 0.78) < 0.02)) { miss++; console.log(`MISS who the subject is: ${JSON.stringify(w)}`); }
if (I.statedGoal(['I want to find the thief.', 'I walk to the market.']) !== 'the thief') { miss++; console.log('MISS a goal stays in force'); }
// R59: a slip is respelt outside quoted words and left as said inside them, in any quotation marks (quotes.ts).
{
  const sit = { player: 'Mara', people: [{ name: 'Tom', sex: 'male' }], narration: [], earlier: [], lastCalls: [] };
  const SLIPS = [['"Hello," I punhc Tom.', '"Hello," I punch Tom.'], ['»Hello,« I punhc Tom.', '»Hello,« I punch Tom.'], ['I say, "I will punhc you."', 'I say, "I will punhc you."'],
    ['I say: „I will punhc you.“', 'I say: „I will punhc you.“'], ['«I will punhc you», I say.', '«I will punhc you», I say.']];
  const wrong = SLIPS.filter(([t, want]) => I.understand(t, sit).text !== want);
  if (wrong.length) { miss++; console.log(`MISS slips outside quotes only: ${wrong.map(([t]) => `${t} → ${I.understand(t, sit).text}`).join(' | ')}`); }
}
// A woman named before "him back" leaves him to the one who struck ("I nod to Ann and hit him back").
{
  const t = I.understand('I nod to Ann and hit him back.', { player: 'Mara', people: [...people, { name: 'Ann', sex: 'female' }], narration: ['Will laughs. Tom shoves you hard.'], earlier: [], lastCalls: [] }).text;
  if (t !== 'I nod to Ann and hit Tom back.') { miss++; console.log(`MISS a woman named before him back: ${t}`); }
}
console.log(`${READ.length + WHO.length + 4} checks, ${miss} miss(es)`);
process.exitCode = miss ? 1 : 0;
