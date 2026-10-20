// Engine rules that need no model: a fall needs the height a climb reached; a price is looked up in the scene's country.
const { ctx } = await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
T.registerRulesTools(true);
const run = (tool, args) => T.REGISTRY.get(tool).exec(args);
let miss = 0;
const expect = (label, got, re) => { if (!re.test(got)) { miss++; console.log(`MISS ${label}\n  got: ${got}`); } };
const fresh = () => { ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'x' }]; };
const CLIMB = { who: 'Mara', task: 'climb a 3 m wall', reference_class: 'climbers', base_share: '50% half', height_m: 3 };
// A climb that fails leaves the climber at its foot: the drop on the far side is refused with where they are.
for (let i = 0; i < 40; i++) {
    fresh();
    const c = String(await run('BodyCheck', { ...CLIMB, share: '5% almost no one' }));
    if (!/FAILURE/.test(c)) continue;
    expect('drop after a failed climb', String(await run('BodyFall', { who: 'Mara', height_m: 3 })), /on the ground at the foot of the climb/);
    break;
}
// A climb that succeeds puts the climber on top: the 3 m drop runs.
for (let i = 0; i < 40; i++) {
    fresh();
    const c = String(await run('BodyCheck', { ...CLIMB, share: '80% most', base_share: '80% most' }));
    if (!/SUCCESS/.test(c)) continue;
    expect('drop after a climb that succeeded', String(await run('BodyFall', { who: 'Mara', height_m: 3 })), /^Fall 3 m/);
    break;
}
// A York scene priced in Leipzig is priced in London.
fresh();
await run('Weather', { latitude: 53.96, longitude: -1.08, time: '1820-11-03 19:00' }).catch(() => {});
T.setStoryTime?.(Date.UTC(1820, 10, 3, 19) / 60000);
const st = ctx.chatMetadata.rulesEngine?.state;
if (st) st.setting = { ...(st.setting ?? {}), country: 'United Kingdom of Great Britain and Northern Ireland' };
expect('price city follows the scene', String(await run('Price', { question: 'price of goods', item: 'beer (litre)', quantity: 0.57, city: 'Leipzig', year: 1820 })), /in London, 1820/);
// The ale's price asked in five cities is asked once.
const Q = await import('../src/rules/question-pass.js');
const asks = ['Leipzig', 'London', 'Paris'].map(city => ({ tool: 'Price', args: { question: 'price of goods', item: 'beer (litre)', quantity: 0.568, city, year: 1820 } }));
if (Q.dedupe(asks).length !== 1) { miss++; console.log(`MISS Price asked once: ${Q.dedupe(asks).length}`); }
console.log(`4 checks, ${miss} miss(es)`);
process.exit(miss ? 1 : 0);
