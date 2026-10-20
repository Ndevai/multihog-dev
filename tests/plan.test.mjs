// The keyed plan (src/rules/plan-schema.ts): one call per tool and subject, read back as the list the pass runs.
await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
T.registerRulesTools(true);
const P = await import('../src/rules/plan-schema.js');
const Q = await import('../src/rules/question-pass.js');
let miss = 0;
const check = (label, ok, got) => { if (!ok) { miss++; console.log(`MISS ${label}: ${JSON.stringify(got)}`); } };
const text = `QUESTIONS\n- how long\n{"calls":{"Weather":{"latitude":53.9,"longitude":-1.1},"Act":{"Mara":{"action":"creeps across the lawn","distance_m":12}},"Price":{"beer (litre)":{"question":"price of goods","quantity":0.568,"city":"London","year":1820},"daily wage":{"city":"London","year":1820}},"Communicate":{"Tom":{"listener":"the innkeeper","message":"a pint"}}},"then":[]}`;
const calls = Q.rawCalls(text);
check('order and count', calls.map(c => c.tool).join(',') === 'Weather,Act,Price,Price,Communicate', calls);
check('subject goes back into its argument', calls[1].args.who === 'Mara' && calls[4].args.speaker === 'Tom', calls);
check('Price keyed by good', calls[2].args.item === 'beer (litre)', calls[2]);
check('Price keyed by question', calls[3].args.question === 'daily wage' && !calls[3].args.item, calls[3]);
check('list form still reads', Q.rawCalls('{"calls":[{"tool":"Act","args":{"who":"Tom","action":"sits down"}}]}').length === 1, null);
// The schema: one entry per offered tool; a keyed tool's arguments leave out the key and its requirement.
const s = P.planSchema(new Set(['Act', 'Weather', 'Communicate']));
const c = s.properties.calls;
check('offered tools only', Object.keys(c.properties).sort().join(',') === 'Act,Communicate,Weather', Object.keys(c.properties));
check('keyed by speaker', c.properties.Communicate.additionalProperties && !('speaker' in c.properties.Communicate.additionalProperties.properties) && !c.properties.Communicate.additionalProperties.required.includes('speaker'), c.properties.Communicate);
check('Weather takes its arguments directly', 'latitude' in c.properties.Weather.properties, c.properties.Weather);
check('schema is JSON', JSON.parse(JSON.stringify(s)).required[0] === 'calls', null);
console.log(`9 checks, ${miss} miss(es)`);
process.exit(miss ? 1 : 0);
