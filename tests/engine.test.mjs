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
    expect('drop after a failed climb', String(await run('BodyFall', { who: 'Mara', height_m: 3 })), /stands on the ground at the foot of the climb, on the side the climb started from/);
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
// Vision: a large or near target is seen (the odds once overflowed to NaN and every near look missed).
const V = await import('../src/rules/vision.js');
const near = V.see({ size: 1.5, distance: 1, light: 'living room' });
if (!(near.identify > 0.99 && near.detect > 0.99)) { miss++; console.log(`MISS near target seen: ${JSON.stringify(near)}`); }
const far = V.see({ size: 0.5, distance: 2000, light: 'full moon' });
if (!(far.detect >= 0 && far.detect < 0.5)) { miss++; console.log(`MISS far target at night: ${JSON.stringify(far)}`); }
// A drop of any height from the ground after a failed climb gives where the climber stands.
for (let i = 0; i < 40; i++) {
    fresh();
    const c = String(await run('BodyCheck', { ...CLIMB, share: '5% almost no one' }));
    if (!/FAILURE/.test(c)) continue;
    expect('small drop after a failed climb', String(await run('BodyFall', { who: 'Mara', height_m: 0.5 })), /foot of the climb/);
    break;
}
// Apples, from Mayhew's 1851 costermonger price (4s a bushel): about a penny a pound in London that year.
const Pr = await import('../src/rules/prices.js');
const ap = Pr.price('price of goods', 'apples (kg)', undefined, 0.4536, 'London', 1851), dPerLb = ap.silver / Pr.poundSilver(1 / 240, 1851);
if (!(Math.abs(dPerLb - 0.97) < 0.02)) { miss++; console.log(`MISS apples 1851: ${dPerLb} d per lb`); }
const C = await import('../src/rules/clock.js');
if (C.spokenTime(18 * 60 + 17.88) !== 'about twenty past six in the evening' || C.spokenTime(18 * 60 + 15) !== 'a quarter past six in the evening') { miss++; console.log(`MISS spokenTime: ${C.spokenTime(18 * 60 + 17.88)}`); }
// A good outside the list: from its reference ratio, and the same each time it is asked.
const rp = Pr.referencePrice('pears');
if (!(rp && rp.item === 'apples (kg)' && Math.abs(rp.ratio - 1.03) < 0.01)) { miss++; console.log(`MISS pears: ${JSON.stringify(rp)}`); }
fresh();
const o1 = String(await run('Price', { question: 'price of goods', good: 'oysters', like: 'meat (kg)', quantity: 1, city: 'London', year: 1888 }));
const o2 = String(await run('Price', { question: 'price of goods', good: 'oysters', like: 'cheese (kg)', quantity: 2, city: 'London', year: 1888 }));
if (!/meat/.test(o2)) { miss++; console.log(`MISS oysters kept: ${o2}`); }
// A town outside the weather-city list is placed by GeoNames after a place word; a person's name is no place.
const W = await import('../src/rules/weather.js');
const york = W.placeIn('A coaching inn near York, 3 November 1820, evening.', new Set());
if (!(york && Math.abs(york.lat - 53.96) < 0.05 && /United Kingdom/.test(york.country))) { miss++; console.log(`MISS York: ${JSON.stringify(york)}`); }
if (W.placeIn("Mary (the player's character) walks home.", new Set()) !== null) { miss++; console.log('MISS Mary is no place'); }
const pot = Pr.referencePrice('potatoes'), len = Pr.referencePrice('lentils');
if (!(pot?.item === 'apples (kg)' && Math.abs(pot.ratio - 0.4952) < 0.01 && len?.item === 'beans or peas (litre)')) { miss++; console.log(`MISS vegetables: ${JSON.stringify([pot, len])}`); }
fresh();
expect('a misfortune stated against interest stands', String(await run('Claim', { who: 'Pyotr', claim: 'Pyotr slips on the ice and falls', kind: 'something happening to the character now', in_world: true, base_share: '20% few', share: '20% few', against_interest: true })), /holds \(stated against/);
expect('a good outside the list beats a stray item', String(await run('Price', { question: 'price of goods', item: 'apples (kg)', good: 'oysters', like: 'meat (kg)', quantity: 1, city: 'London', year: 1888 })), /of oysters/);
console.log(`16 checks, ${miss} miss(es)`);
process.exit(miss ? 1 : 0);
