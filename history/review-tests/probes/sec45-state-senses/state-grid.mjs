// For every verb whose VerbNet senses name different tools, with a thing or a person as object: the reading each scene state
// leads to, the words fixed. States: no state; the thing in Mara's hands (her belongings on record); not in her hands; the
// person at her spot; at another spot. Counts the verbs whose leading reading changes with the state alone.
const O = await import('/home/claude/work/src/rules/sense-odds.js');
const { VERB_SENSES } = await import('/home/claude/work/src/rules/data/senses.js');
const base = { words: [], recentTools: [], held: [], earlier: [] };
const lead = o => o ? o[0].tools.join('+') || 'none' : '-';
const top = (verb, after, line, view) => { const o = O.senseOdds(verb, after, line, ['Mara', 'the cook'], view ? { ...base, view } : base); return o && o.length > 1 && o[0].p - o[1].p > 0.05 ? lead(o) : 'tie'; };
let verbs = 0, changed = 0, rows = [], thingVerbs = 0, personVerbs = 0, tc = 0, pc = 0;
for (const verb of Object.keys(VERB_SENSES)) {
  const t = ['the', 'coin'], tl = `I ${verb} the coin.`, p = ['the', 'cook'], pl = `I ${verb} the cook.`;
  const t0 = O.senseOdds(verb, t, tl, ['Mara'], base), p0 = O.senseOdds(verb, p, pl, ['Mara', 'the cook'], base);
  if (t0 && t0.length > 1) {
    thingVerbs++;
    const a = top(verb, t, tl, null), b = top(verb, t, tl, { actor: 'Mara', items: { Mara: ['coin'] }, accounted: ['Mara'], spot: {} }), c = top(verb, t, tl, { actor: 'Mara', items: { Mara: [] }, accounted: ['Mara'], spot: {} });
    if (new Set([a, b, c]).size > 1) { tc++; rows.push(`${tl}\tno state: ${a}\tcoin in hand: ${b}\tno coin: ${c}`); }
  }
  if (p0 && p0.length > 1) {
    personVerbs++;
    const a = top(verb, p, pl, null), b = top(verb, p, pl, { actor: 'Mara', items: {}, accounted: [], spot: { Mara: 'kitchen', 'the cook': 'kitchen' } }), c = top(verb, p, pl, { actor: 'Mara', items: {}, accounted: [], spot: { Mara: 'kitchen', 'the cook': 'yard' } });
    if (new Set([a, b, c]).size > 1) { pc++; rows.push(`${pl}\tno state: ${a}\tsame spot: ${b}\tapart: ${c}`); }
  }
}
console.log(`verbs with competing readings, a thing as object: ${thingVerbs}, leading reading changed by the state alone: ${tc}`);
console.log(`verbs with competing readings, a person as object: ${personVerbs}, leading reading changed by the state alone: ${pc}`);
if (process.argv[2] === '--rows') console.log(rows.join('\n'));
