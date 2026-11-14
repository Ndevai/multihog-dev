// What the narrator reads of each recorded result (Fragile stripped, as at both narrator boundaries), scanned.
const fs = require('fs');
const [a, b] = [JSON.parse(fs.readFileSync(process.argv[2])), JSON.parse(fs.readFileSync(process.argv[3]))];
const story = r => r.replace(/\s*Fragile: the outcome changes[\s\S]*$/, '');
const strip = process.argv[4] === 'strip';
const texts = [...a.results.map(r => [r.tool, strip ? story(r.result) : r.result]), ...b.filter(x => x.tool !== 'BLOCKS').map(r => [r.tool, strip ? story(r.result) : r.result]), ...a.blocks.map(x => ['[BODY]/[KNOWS]/[HAS]', x]), ...a.decided.map(x => ['[DECIDED]', x])];
const P = { fragile: /Fragile:/, status: /\[(ASSUMED|FITTED|RAW|estimated|from its)\b/, constant: /\b[a-z]+[A-Z][a-zA-Z]* = /, dB: /\bdB\b/, chem: /CAS \d|g\/mol|heat of formation/, program: /\(Pulse\)|kg model|Dwarf Fortress|\bDF\b/, deathChance: /such patients die/, bloodZero: /L \(0%/, cite: /et al\.|\b(19|20)\d\d\)/ };
const t = {}; for (const [tool, s] of texts) for (const [k, re] of Object.entries(P)) if (re.test(s)) t[k] = (t[k] ?? 0) + 1;
console.log(texts.length, 'texts;', JSON.stringify(t));
const any = texts.filter(([, s]) => Object.values(P).some(re => re.test(s))).length;
console.log('texts with any hit', any, 'pattern hits', Object.values(t).reduce((x, y) => x + y, 0));
