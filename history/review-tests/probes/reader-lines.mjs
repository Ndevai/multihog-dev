// Area C: ordinary roleplay lines through prosody, intent, router, frame and ask. Usage: node reader-lines.mjs <repo root> [line ...]
const R = process.argv[2];
const { ctx } = await import(`${R}/tools/st-harness.mjs`);
const Rt = await import(`${R}/src/rules/router.js`), F = await import(`${R}/src/rules/frame.js`), A = await import(`${R}/src/rules/ask.js`);
const P = await import(`${R}/src/rules/prosody.js`), I = await import(`${R}/src/rules/intent.js`);
const has = () => true;
const people = [{ name: 'Mara', sex: 'female' }, { name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }, { name: 'Ann', sex: 'female' }];
const LINES = process.argv.slice(3).length ? process.argv.slice(3) : [
 '"Get away from her!" I shout at Tom.',
 '*I draw my sword and step toward Tom.*',
 '*sighs* "Fine. I\'ll pay you two shillings."',
 'I punch Tom in the face. **Hard.**',
 'I _whisper_ to Will, "Meet me at the docks."',
 'Eu vou até a porta e bato. "Olá?"',
 'Ich sage: »Komm her, Tom!« und warte.',
 'Er rief: ›Halt!‹ I keep walking.',
 'It is 30°C and I am sweating; I drink some water.',
 'I check the thermometer: -5 °C. Too cold to swim.',
 'I call the FBI and the CIA.',
 'I tell Tom the IT desk is on the 2nd floor.',
 'NO! I SAID STOP!',
 'I grin :) and hand Will the letter.',
 'I wait 10 min, then walk 200 m to the station.',
 'I walk to the bar and order a pint of ale.',
 'I ask Ann for directions.',
 'Tom (35) and Will (12) watch me.',
 'I pick the lock (2 tries).',
 'I give Will 3 coins.',
 'I sneak past the guard.',
 'I look at Ann and smile.',
 'Mara climbs the wall quietly.',
 'I listen at the door.',
 'I sit down by the fire and rest for an hour.',
 'I throw the knife at Tom.',
 'I nod to Ann and hit him back.',
 'Will: "What do you want?" I glare at him.',
 'I run 5 km.',
 'I say nothing.',
 'I don\'t trust Tom.',
 'I say hello to Will :D',
 'I swim across the river (about 50 m).',
 'I meet Tom at 3 p.m. (15:00).',
 'I buy 2 lbs of flour.',
 'I kick the door open.',
 "I'm hungry. I eat the bread.",
 'I tell Tom about my plan with all the details.',
 'I write a letter to Ann.',
 'I fall asleep.',
];
const narration = ['Tom shoves you hard. Will laughs.'];
for (const line of LINES) {
  const pros = P.readProsody(line), plain = F.inStory(pros.plain);
  const meant = I.understand(plain, { player: 'Mara', people, narration, earlier: [], lastCalls: [] });
  const route = Rt.routeTurn(meant.text, people.map(p => p.name));
  const fr = F.framedCalls(meant.text, 'Mara', 'female');
  let d = null; try { d = A.decide(meant.text, 'Mara', people, has, { narration, lastTargets: [], pronouns: Object.fromEntries(meant.open.map(o => [o.pronoun, o.weights])) }, () => 0.5); } catch (e) { d = 'ERR ' + e.message; }
  console.log(`\n» ${line}`);
  if (pros.marked || pros.plain !== line) console.log(`  prosody: marked=${pros.marked} plain=${JSON.stringify(pros.plain)} delivery=${JSON.stringify(P.deliveryOf(pros))} effort=${P.effortOf(pros)}`);
  if (meant.changes.length) console.log(`  meant: ${meant.text} ${JSON.stringify(meant.changes.map(c => `${c.from}→${c.to}`))}`);
  console.log(`  route: ${JSON.stringify(route.why)}`);
  console.log(`  frame: ${fr.calls.map(c => `${c.tool} ${JSON.stringify(c.args)}`).join(' | ')}`);
  if (d) console.log(`  ask: ${typeof d === 'string' ? d : 'ask' in d ? `ASK ${d.ask.text} ${JSON.stringify(d.ask.options.map(o => o.label))}` : `TAKE ${d.take.label}`}`);
}
