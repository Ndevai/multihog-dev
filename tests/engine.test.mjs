// Engine rules that need no model: a fall needs the height a climb reached; a price is looked up in the scene's country.
const { ctx } = await import('../tools/st-harness.mjs');
const T = await import('../src/rules/rules-tools.js');
const { OWN_KIND } = await import('../src/rules/verbs.js');
T.registerRulesTools(true);
const run = (tool, args) => T.REGISTRY.get(tool).exec(args);
let miss = 0;
const expect = (label, got, re) => { if (!re.test(got)) { miss++; console.log(`MISS ${label}\n  got: ${got}`); } };
const fresh = () => { ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'x' }]; };
const CLIMB = { who: 'Mara', task: 'climb a 3 m wall', reference_class: 'climbers', base_share: '50% half', height_m: 3 };
// A climb that fails leaves the climber at its foot: the drop on the far side is refused with where they are.
for (let i = 0; i < 40; i++) {
    fresh();
    const c = String(await run('BodyCheck', { task_kind: OWN_KIND, ...CLIMB, share: '5% almost no one' }));
    if (!/FAILURE/.test(c)) continue;
    expect('drop after a failed climb', String(await run('BodyFall', { who: 'Mara', height_m: 3 })), /stands on the ground at the foot of the climb, on the side the climb started from/);
    break;
}
// A climb that succeeds puts the climber on top: the 3 m drop runs.
for (let i = 0; i < 40; i++) {
    fresh();
    const c = String(await run('BodyCheck', { task_kind: OWN_KIND, ...CLIMB, share: '80% most', base_share: '80% most' }));
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
expect('price city follows the scene', String(await run('Price', { question: 'price of goods', item: 'beer (litre)', quantity: 0.57, city: 'Leipzig', year: 1820 })), /at London prices, 1820/);
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
    const c = String(await run('BodyCheck', { task_kind: OWN_KIND, ...CLIMB, share: '5% almost no one' }));
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
if (W.placeIn("Mary (the player's character) walks home.", new Set(['mary'])) !== null) { miss++; console.log('MISS Mary, listed present, is no place'); }
const pot = Pr.referencePrice('potatoes'), len = Pr.referencePrice('lentils');
if (!(pot?.item === 'apples (kg)' && Math.abs(pot.ratio - 0.4952) < 0.01 && len?.item === 'beans or peas (litre)')) { miss++; console.log(`MISS vegetables: ${JSON.stringify([pot, len])}`); }
fresh();
expect('a misfortune stated against interest stands', String(await run('Claim', { against_interest: false, who: 'Pyotr', claim: 'Pyotr slips on the ice and falls', kind: 'something happening to the character now', in_world: true, base_share: '20% few', share: '20% few', against_interest: true })), /holds \(stated against/);
expect('a good outside the list beats a stray item', String(await run('Price', { question: 'price of goods', item: 'apples (kg)', good: 'oysters', like: 'meat (kg)', quantity: 1, city: 'London', year: 1888 })), /of oysters/);
fresh();
expect('reveals as a question is turned back', String(await run('Look', { viewer: 'Mara', kind: 'a person', distance_m: 2, light: 'living room', reveals: 'who is inside the lit room and what they are doing' })), /reveals is the fact itself/);
expect('reveals as the fact runs', String(await run('Look', { viewer: 'Mara', kind: 'a person', distance_m: 2, light: 'living room', reveals: 'a grey-haired man counting coins at a desk' })), /Mara/);
{ const r = String(await run('Look', { viewer: 'Mara', target: 'uma moeda no chão', kind: 'a penny (British, 1860–1970)', size_m: 0.5, distance_m: 30, light: 'living room' })); expect('a penny is sized by code, not the plan', r, /0\.0308 m target/); }
expect('Look with no size and nothing in the table asks for it', String(await run('Look', { viewer: 'Mara', target: 'a strange glow', kind: 'something else (give size_m)', distance_m: 5, light: 'living room' })), /Give size_m/);
// A thing claimed, then handed over: the claim records it when it holds, and the hand-over runs on the record.
const Po = await import('../src/rules/possessions.js');
fresh();
const st1 = () => ctx.chatMetadata.rulesEngine.state;
await run('Claim', { against_interest: false, who: 'Clara', claim: 'Clara has a purse', kind: 'something the character has', item: 'purse', in_world: true, base_share: '95% nearly everyone', share: '95% nearly everyone' });
if (!(Po.unrecorded(st1(), 'Clara', 'silver thimble') && !Po.unrecorded(st1(), 'Bob', 'silver thimble'))) { miss++; console.log('MISS unrecorded'); }
// A given name sets the sex: Josiah is a man in every draw, Mary a woman.
for (let i = 0; i < 5; i++) { fresh(); expect('Josiah is a man', String(await run('NewCharacter', { who: `Josiah Crake` })), /\b(?:man|boy)\b/); }
fresh(); expect('Mary is a woman', String(await run('NewCharacter', { who: 'Mary Kelly' })), /\b(?:woman|girl)\b/);
// Money in words, paid in coin with change.
const mi = ['a penny and a half', 'three halfpence', 'two shillings and sixpence', 'fourpence', 'a pound of apples'].map(Po.moneyIn);
if (mi.join() !== '1.5,1.5,30,4,') { miss++; console.log(`MISS moneyIn: ${mi.join()}`); }
const ps = {}; Po.give(ps, 'Tom', 'penny', 2);
const paid = Po.transfer(ps, { item: 'a penny and a half', from: 'Tom', to: 'the innkeeper', how: 'given' });
if (!/change halfpenny/.test(paid) || ps.items.Tom[0].item !== 'halfpenny') { miss++; console.log(`MISS change: ${paid}`); }
// Change from a receiver on record with no coins is refused; an unrecorded trader gives it.
{ const q = {}; Po.give(q, 'Tom', 'penny', 2); q.accounted = ['the ferryman'];
  expect('no change from an empty till on record', Po.transfer(q, { item: 'a penny and a half', from: 'Tom', to: 'the ferryman', how: 'given' }), /no coins on record to give/); }
// Rain over the day: the cascade keeps the day's total, and the hour decides whether it falls now.
{ const Wx = await import('../src/rules/weather.js'); let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const b = Wx.rainBoxes(8, rng); expect('cascade keeps the total', String(Math.round(b.reduce((s, x) => s + x, 0) * 1000) / 1000), /^8$/);
  const n = Wx.rainNow(b, 600); expect('rain spells listed', n.spells.join(','), /\d\d:\d\d–\d\d:\d\d/); }
// A run is faster than a walk over the same 100 m.
{ fresh(); await run('NewCharacter', { who: 'Ned', sex: 'male', age: 30 });
  const walk = String(await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Ned', action: 'walks to the gate', distance_m: 100 }));
  fresh(); await run('NewCharacter', { who: 'Ned', sex: 'male', age: 30 });
  const runs = String(await run('Act', { level: 'on the level, stairs or a change of posture', pace: 'run', who: 'Ned', action: 'walks to the gate', distance_m: 100 }));
  const sec = t => Number(/(\d+(?:\.\d+)?) s\b/.exec(t)?.[1] ?? NaN);
  if (!(sec(runs) < sec(walk))) { miss++; console.log(`MISS run faster than walk:\n  ${walk}\n  ${runs}`); } }
// A slip on the level: serious injury at about 1 in 10 at 70, a quarter of that at 30.
for (const [age, lo, hi] of [[30, 0.005, 0.05], [70, 0.06, 0.14]]) { let n = 0; for (let i = 0; i < 600; i++) { fresh(); ctx.chat[0].mes = `s${age}-${i}`; if (/serious injury, the/.test(String(await run('BodyFall', { who: 'Pyotr', height_m: 0, slip: true, age })))) n++; } if (!(n / 600 >= lo && n / 600 <= hi)) { miss++; console.log(`MISS slip at ${age}: ${n / 600}`); } }
fresh();
await run('BodyFall', { who: 'Pyotr', height_m: 0, slip: true, age: 40 });
expect('getting up after a slip is timed', String(await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Pyotr', action: 'gets up and looks for the glove' })), /gets up from the ground: 5\.3 s/);
fresh();
expect('harm chosen by meaning stands', String(await run('Claim', { against_interest: true, who: 'Jack', claim: "Jack's knuckles are bleeding from the punch", kind: 'something happening to the character now', in_world: true, base_share: '50% half', share: '5% almost no one' })), /holds \(stated against/);
expect('treating no wound', String(await run('BodyTreat', { who: 'Jack', treatment: 'stop_bleeding', training: 'untrained' })), /holds no wound on record/);
fresh(); expect('named_as sets the sex', String(await run('NewCharacter', { who: 'Mr. Abbott', named_as: 'a man' })), /\b(?:man|boy)\b/);
fresh(); expect('named_as sets the sex (woman)', String(await run('NewCharacter', { who: 'Madame Roux', named_as: 'a woman' })), /\b(?:woman|girl)\b/);
fresh(); expect('several people are refused', String(await run('NewCharacter', { who: 'os homens junto ao fogo', named_as: 'several people' })), /draws one person/);
fresh(); expect('a climb in Act goes to BodyCheck', String(await run('Act', { who: 'Mara', action: 'escala o muro', level: 'a climb, jump or drop' })), /BodyCheck/);
// Light and sound as continuous quantities (docs/credibility-edits.md E03, E05, E06, E07, E09, E16).
{
  const Sk = await import('../src/rules/sky.js'), Ac = await import('../src/rules/acoustics.js');
  const jdMin = (y, m, d) => (Date.UTC(y, m, d) / 86400000 + 2440587.5 - 1721425.5) * 1440;
  // E07: a large black target (100 m, past Blackwell's 121′ at 2 km) is seen with p = 0.5 at the visibility distance, and the odds fall smoothly through it.
  const at = d => V.see({ size: 100, distance: d, light: 'daylight', visibility: 2000 }).detect;
  if (!(Math.abs(at(2000) - 0.5) < 0.03 && Math.abs(at(1999) - at(2001)) < 0.02 && at(1000) > 0.95 && at(3000) < 0.05)) { miss++; console.log(`MISS contrast fade: ${[1000, 1999, 2000, 2001, 3000].map(at)}`); }
  // E09: ten seconds of looking raise the odds of a target that one fixation catches 1 time in 5, up to the cap of ten tries.
  const one = V.see({ size: 0.5, distance: 400, light: 'daylight' }), ten = V.see({ size: 0.5, distance: 400, light: 'daylight', seconds: 10 });
  if (!(ten.identify > one.identify && ten.recognize >= one.recognize)) { miss++; console.log(`MISS glances: ${JSON.stringify([one, ten])}`); }
  // E05: no minute of an equinox day at the equator changes the light by more than 1.5 times (before: 39, 118 and 1 700 times).
  let worst = 1, prev = null; for (let m = 0; m < 1440; m++) { const s = Sk.skyLight(jdMin(1900, 2, 20) + m, 0).lux; if (prev) worst = Math.max(worst, s / prev, prev / s); prev = s; }
  if (!(worst < 1.5)) { miss++; console.log(`MISS twilight steps: ${worst}`); }
  // E06: moonlight on level ground (Krisciunas & Schaefer 1991): full Moon overhead 0.26 lux, at 10° 0.019, quarter Moon at 45° 0.016.
  const ml = [Sk.moonLux(0, 90), Sk.moonLux(0, 10), Sk.moonLux(90, 45)];
  if (!(Math.abs(ml[0] - 0.261) < 0.005 && Math.abs(ml[1] - 0.0195) < 0.001 && Math.abs(ml[2] - 0.0156) < 0.001 && Sk.moonLux(0, -5) === 0)) { miss++; console.log(`MISS moonlight: ${ml}`); }
  // E03: Lisbon, 21 June 2020, on the civil clock (UTC+1, 9.14° W): sunset about 21:01, as the almanac gives; with no zone, solar time (19:24).
  const sunset = o => { for (let m = 720; m < 1440; m++) if (Sk.skyLight(jdMin(2020, 5, 21) + m, 38.72, o).sunAlt < 0) return m; };
  const civil = sunset({ lon: -9.14, utcOffsetH: 1 }), solar = sunset();
  if (!(civil >= 20 * 60 + 56 && civil <= 21 * 60 + 6 && solar >= 19 * 60 + 20 && solar <= 19 * 60 + 28)) { miss++; console.log(`MISS Lisbon sunset: civil ${civil}, solar ${solar}`); }
  // E04: daylight follows the Sun's altitude and the clear-sky index (clear sky at 73° about 108 000 lux; kt 0.25 a quarter of it).
  const noon = kt => Sk.skyLight(jdMin(2020, 5, 21) + 13 * 60, 38.72, { lon: -9.14, utcOffsetH: 1, kt }).lux;
  if (!(noon(1) > 100000 && noon(1) < 115000 && Math.abs(noon(0.25) / noon(1) - 0.25) < 0.01)) { miss++; console.log(`MISS daylight: ${noon(1)} ${noon(0.25)}`); }
  // E16: the chance of hearing is 0.5 at the margin 0 and changes by less than 0.05 across the old threshold (a 1 % change in distance).
  const hp = d => Ac.hearSound({ spl: 64, distance: d }).p;
  if (!(Math.abs(hp(454.6) - 0.5) < 0.05 && Math.abs(hp(450) - hp(459)) < 0.05 && hp(1) > 0.99 && hp(1000) < 0.02 && Math.abs(Ac.phi(1) - 0.8413) < 0.001)) { miss++; console.log(`MISS hearing odds: ${[1, 450, 454.6, 459, 1000].map(hp)}`); }
}
// The place's clock and cloud (docs/credibility-edits.md E01–E04).
{
  const Z = await import('../src/rules/zone.js'), Re = await import('../src/rules/reanalysis.js'), Sk = await import('../src/rules/sky.js');
  const minOf = (y, m, d, h = 0) => { const x = new Date(0); x.setUTCFullYear(y, m - 1, d); return (x.getTime() - Z.MS_YEAR1) / 60000 + h * 60; };
  Z.setZone(38.72, -9.14, 'Europe/Lisbon'); Z.setZone(38.57, -7.91, 'Europe/Lisbon');
  // Lisbon: summer time +1 h, winter 0; Évora in 1850, before Portugal's standard time, its own mean time (−7.91° ÷ 15); no zone known: the longitude rule.
  const offs = [Z.civilOffsetH(minOf(2020, 6, 21, 12), 38.72, -9.14), Z.civilOffsetH(minOf(2020, 12, 21, 12), 38.72, -9.14), Z.civilOffsetH(minOf(1850, 6, 21, 12), 38.57, -7.91), Z.civilOffsetH(minOf(2020, 6, 21, 12), 10, 10)];
  if (!(offs[0] === 1 && offs[1] === 0 && Math.abs(offs[2] + 7.91 / 15) < 1e-6 && Math.abs(offs[3] - 10 / 15) < 1e-9)) { miss++; console.log(`MISS civil clock offsets: ${offs}`); }
  // An archive reply in Unix times (hours from 2020-06-19 23:00Z): temperature and cloud = the hour's index, radiation = 10 × it.
  const t0 = Date.UTC(2020, 5, 19, 23) / 1000, n = 72, idx = [...Array(n).keys()];
  const fx = { timezone: 'Europe/Lisbon', utc_offset_seconds: 3600, hourly: { time: idx.map(i => t0 + 3600 * i), temperature_2m: idx, cloud_cover: idx, shortwave_radiation: idx.map(i => 10 * i), wind_speed_10m: idx.map(() => 3), relative_humidity_2m: idx.map(() => 70) },
    daily: { time: [t0, t0 + 86400, t0 + 172800], temperature_2m_max: [20, 25, 22], temperature_2m_min: [10, 15, 12], precipitation_sum: [0, 0, 0], snowfall_sum: [0, 0, 0], shortwave_radiation_sum: [30, 31, 29] } };
  const od = Re.readEra5(fx, 38.72, -9.14, 2020, 6, 21);
  // 00:00 on Lisbon's clock of 21 June is 23:00Z on the 20th (index 24); cloud at 00:30 is 24.5; the hour's radiation is the value ending at 01:00 (index 25).
  if (!(od && od.hourlyC[0] === 24 && od.hourlyC[23] === 47 && od.cloudH[0] === 24.5 && od.ghiH[0] === 250 && od.day.tmaxC === 25)) { miss++; console.log(`MISS ERA5 hours on the place's clock: ${JSON.stringify(od && [od.hourlyC[0], od.hourlyC[23], od.cloudH[0], od.ghiH[0], od.day.tmaxC])}`); }
  // Measured radiation scales daylight by its clear-sky index; full cloud leaves 0.05 of a clear night's light; Kasten & Czeplak at 8 oktas 0.25.
  const o = { lon: -9.14, utcOffsetH: 1 }, noon = minOf(2020, 6, 21, 13);
  const clear = Sk.skyLight(noon, 38.72, { ...o, kt: 1 }), probe = Sk.skyLight(noon, 38.72, { ...o, ghi: 900 }), night = c => Sk.skyLight(minOf(2020, 6, 22, 2), 38.72, { ...o, cloud: c }).lux;
  if (!(Math.abs(probe.lux / clear.lux - probe.kt) < 0.01 && probe.kt > 0.8 && probe.kt < 1 && Math.abs(night(100) / night(0) - 0.05) < 0.001 && Sk.kastenCzeplak(1) === 0.25)) { miss++; console.log(`MISS cloud on the sky: ${probe.kt} ${probe.lux / clear.lux} ${night(100) / night(0)}`); }
}
// Knockout length, concussion, feelings, combat hearing over background, body size with age, gait (E22, E30, E18, E50, E44).
{
  const people = () => ctx.chatMetadata.rulesEngine.state.people;
  // E22: a knockout drawn at 3 min holds through 2 min of PassTime and ends within the next 5; the person comes to concussed, and a task that needs alertness reads it.
  fresh(); await run('BodyWound', { who: 'Kit', part: 'upper body', type: 'blunt' }); Object.assign(people().Kit, { unconscious: 'knocked out', koLeft: 3 });
  await run('PassTime', { minutes: 2 }); const still = people().Kit.unconscious;
  const woke = String(await run('PassTime', { minutes: 5 }));
  const task = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Kit', task: 'drive the cart through the crowded market', reference_class: 'carters', base_share: '80% most', share: '80% most', uses: ['alertness'] }));
  if (!(still === 'knocked out' && /comes to/.test(woke) && /concussed/.test(woke) && people().Kit.unconscious == null && /impaired alertness/.test(task))) { miss++; console.log(`MISS knockout length: ${still} | ${woke.slice(0, 120)} | ${task.slice(0, 120)}`); }
  // E30: a tracked character keeps an appraised feeling in [BODY] until its drawn time runs out.
  await run('Appraise', { who: 'Kit', about: 'an event that affects them', target: 'the blow', matters: 'a goal, standard or taste is central', good: false });
  const felt = (people().Kit.feelings ?? [])[0]; if (felt) felt.left = 20;
  const during = String(await run('PassTime', { minutes: 10 })), after = (await run('PassTime', { minutes: 15 }), people().Kit.feelings);
  if (!(felt?.type === 'distress' && /still feels distress \(the blow\)/.test(during) && after == null)) { miss++; console.log(`MISS lasting feeling: ${JSON.stringify(felt)} | ${during.slice(0, 160)} | ${JSON.stringify(after)}`); }
  // E18: footsteps from behind at 4 m, intent visible: heard and dodged in a quiet room, covered by a loud room (75 dB).
  const S = (await import('../src/rules/acoustics.js')).SOUNDS, foot = Object.keys(S).find(s => /footsteps/.test(s));
  const lands = async bg => { let n = 0; for (let i = 0; i < 30; i++) { fresh(); ctx.chat[0].mes = `bg${bg}${i}`; if (/momentum/.test(String(await run('BodyStrike', { who: 'Tom', attack: 'punch', part: 'head', facing: false, intent_visible: true, distance_m: 4, approach_speed: 1.4, noise_sound: foot, background: bg })))) n++; } return n; };
  const quiet = await lands('quiet room (25 dB)'), loud = await lands('loud room (75 dB)');
  if (!(quiet <= 2 && loud >= 28)) { miss++; console.log(`MISS combat hearing over background: quiet ${quiet}/30, loud ${loud}/30`); }
  // E50: a man loses 3.6 cm from 40 to 80 (0.9 cm a decade; Framingham), the same draws otherwise.
  const BS = await import('../src/rules/body-size.js'), g = () => { let i = 0; const v = [0.3, -0.2]; return () => v[i++ % 2]; };
  const h40 = BS.bodySize('Portugal', 'male', 1950, 1990, g()).heightCm, h70 = BS.bodySize('Portugal', 'male', 1950, 2020, g()).heightCm;
  if (!(Math.abs(h40 - h70 - 2.7) < 1e-9)) { miss++; console.log(`MISS height after 40: ${h40} → ${h70}`); }
  // E44: no step in walking speed at a tenth birthday (before 4.89 → 5.16 km/h at 30); a taller walker is faster (√ of height).
  const Wk = await import('../src/rules/work.js'), man = (age, h) => ({ age, sex: 'male', mass: 75, species: 'HUMAN', ...h ? { heightCm: h } : {} });
  const v29 = Wk.walkSpeedKmh(man(29.9)), v30 = Wk.walkSpeedKmh(man(30.1)), tall = Wk.walkSpeedKmh(man(35, 190)), short = Wk.walkSpeedKmh(man(35, 160));
  if (!(Math.abs(v30 / v29 - 1) < 0.005 && tall > short && Math.abs(tall / short - Math.sqrt(190 / 160)) < 0.02)) { miss++; console.log(`MISS gait: ${v29} ${v30} ${tall} ${short}`); }
}
// Perception from the scene (E10, E13, E14, E17, E21): a night yard and a firelit tavern of 40 people.
{
  const Z = await import('../src/rules/zone.js'), T2 = await import('../src/rules/rules-tools.js');
  const minOf = (y, mo, d, h = 0) => { const x = new Date(0); x.setUTCFullYear(y, mo - 1, d); return (x.getTime() - Z.MS_YEAR1) / 60000 + h * 60; };
  const scene = async () => {
    fresh(); T2.setStoryTime(minOf(2020, 6, 21, 23)); T2.setScenePosition(38.72, -9.14);
    await run('Layout', { spots: [{ spot: 'yard', x_m: 0, y_m: 0 }, { spot: 'gate', x_m: 30, y_m: 0 }, { spot: 'tavern door', x_m: 12, y_m: 0 }, { spot: 'bar', x_m: 15, y_m: 3, room: 'tavern' }, { spot: 'cellar', x_m: 40, y_m: 40, room: 'cellar' }],
      rooms: [{ room: 'tavern', corners: [[12, 1], [22, 1], [22, 9], [12, 9]] }, { room: 'cellar', corners: [[38, 38], [44, 38], [44, 44], [38, 44]] }] });
    await run('Room', { room: 'tavern', fires: [{ fuel: 'wood', kg_per_hour: 2 }], people: 40, lining: 'wood' });
    await run('Room', { room: 'cellar', fires: [] });
    for (const [w, s] of [['Ann', 'yard'], ['Tom', 'gate'], ['Joe', 'bar']]) await run('Act', { level: 'on the level, stairs or a change of posture', who: w, steps: [{ do: 'be_at', to: s }] });
  };
  await scene();
  // E21: Tom walks from the gate to the tavern door: Ann in the quiet yard 12 m away hears him; Joe inside the noisy tavern, behind its wall, perceives nothing.
  const walk = String(await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Tom', steps: [{ do: 'walk_to', to: 'tavern door', pace: 'walk' }] }));
  if (!(/\[PERCEIVED\] Ann hears the footsteps of Tom/.test(walk) && !/Joe (hears|sees)/.test(walk))) { miss++; console.log(`MISS bystanders perceive: ${walk}`); }
  // E17: a quiet conversation 3 m away is lost in the talk of 40 people (Rindel: about 80 dB here); E14: the tavern is lit by its fire (about 21 lux).
  const talk = String(await run('Listen', { listener: 'Joe', sound: 'quiet conversation (50 dB at 1 m)', distance_m: 3 })), inside = String(await run('Look', { viewer: 'Joe', kind: 'a person', distance_m: 6 }));
  if (!(/misses it/.test(talk) && /room's talk/.test(talk) && /indoors, lit by wood/.test(inside))) { miss++; console.log(`MISS crowd noise and firelight: ${talk} | ${inside}`); }
  // E10: stepping from the firelit room into the starlit yard, the eyes are still used to brighter light; 45 minutes later they are not.
  ctx.chat[0].mes = 'go out'; await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Joe', steps: [{ do: 'walk_to', to: 'yard' }] });
  ctx.chat[0].mes = 'look outside'; const out1 = String(await run('Look', { viewer: 'Joe', kind: 'a person', distance_m: 15 }));
  ctx.chat[0].mes = 'wait'; await run('PassTime', { minutes: 45 });
  ctx.chat[0].mes = 'look again later'; const out2 = String(await run('Look', { viewer: 'Joe', kind: 'a person', distance_m: 15 }));
  if (!(/eyes still used to brighter light/.test(out1) && !/eyes still used/.test(out2))) { miss++; console.log(`MISS dark adaptation: ${out1} | ${out2}`); }
  // E13: in a cellar with no flame at night the target does not see the attacker coming (lands); with the story's lamp (lit: true) it does (dodged).
  const inCellar = async lit => { let n = 0; for (let i = 0; i < 20; i++) { await scene(); ctx.chat[0].mes = `c${i}`; await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Tom', steps: [{ do: 'be_at', to: 'cellar' }] });
    if (/momentum/.test(String(await run('BodyStrike', { who: 'Tom', attack: 'punch', part: 'head', distance_m: 3, approach_speed: 2, intent_visible: true, noise_db: 0, ...lit })))) n++; } return n; };
  const dark = await inCellar({}), lamp = await inCellar({ lit: true });
  if (!(dark >= 18 && lamp <= 2)) { miss++; console.log(`MISS light in a fight: dark cellar ${dark}/20 landed, lamplit ${lamp}/20`); }
}
// Memory, ability, social settings from the scene, acuity by age (E33, E28, E34, E35, E11).
{
  const K = await import('../src/rules/knowledge.js'), V2 = await import('../src/rules/vision.js');
  // E33: two years on, 200 people recall a mundane event (importance 1) less often than a poignant one (10).
  const st3 = { clock: { t: 0, add: 0 }, people: {} }, names = Array.from({ length: 200 }, (_, i) => `p${i}`);
  const low = K.learn(st3, 'had porridge for breakfast', names); low.imp = 1; const high = K.learn(st3, 'saw the house burn down', names); high.imp = 10;
  st3.clock.add = 2 * 525960;
  const share = f => names.filter(n => K.recalls(st3, f, n)).length / names.length;
  if (!(share(low) < 0.45 && share(high) > 0.7)) { miss++; console.log(`MISS importance in forgetting: mundane ${share(low)}, poignant ${share(high)}`); }
  // N05: a fact met three times a year apart is recalled by more people three years on than one met once, and a repeat on the
  // same day adds nothing (ACT-R base level, d = 0.5; massed repeats count once).
  const st4 = { clock: { t: 0, add: 0 }, people: {} };
  const once = K.learn(st4, 'the miller owes the smith', names), twiceSameDay = K.learn(st4, 'the bridge toll is two pence', names);
  const spaced = K.learn(st4, 'the abbot keeps the key', names);
  st4.clock.add = 60; K.learn(st4, 'the bridge toll is two pence', names);
  for (const y of [1, 2]) { st4.clock.add = y * 525960; K.learn(st4, 'the abbot keeps the key', names); }
  const late = K.learn(st4, 'the ferryman is deaf', names);
  for (const f of [once, twiceSameDay, spaced, late]) f.imp = 1;
  st4.clock.add = 3 * 525960;
  const sh = f => names.filter(n => K.recalls(st4, f, n)).length / names.length;
  // N06: an errand list of eight heard once leaves 2–6 items with the listener (Cowan 2001); the speaker keeps all eight.
  const h4 = K.heldOfMessage('buy bread, salt, candles, lamp oil, nails, rope, a sack of oats, and soap', 4), h9 = K.heldOfMessage('buy bread, salt, candles, lamp oil, nails', 6);
  if (!(h4.total === 8 && h4.dropped === 4 && /^buy bread; salt; a sack of oats; soap/.test(h4.kept) && h9.dropped === 0 && K.heldOfMessage('No, sir, I was not there', 2).dropped === 0)) { miss++; console.log(`MISS working memory: ${JSON.stringify(h4)} ${JSON.stringify(h9)}`); }
  // Spaced beats one encounter as old as its first and one as recent as its last (a clock reset by each repeat ties the latter).
  if (!(sh(spaced) > sh(once) + 0.15 && sh(spaced) > sh(late) + 0.2 && Math.abs(sh(twiceSameDay) - sh(once)) < 0.1)) { miss++; console.log(`MISS repetition in forgetting: once ${sh(once)}, same day ${sh(twiceSameDay)}, last year only ${sh(late)}, spaced ${sh(spaced)}`); }
  // E28: WorkOut without the narrator's share draws the character's own ability once and keeps it.
  fresh(); await run('BodyWound', { who: 'Ida', part: 'upper body', type: 'blunt' });
  const wo = String(await run('WorkOut', { who: 'Ida', problem: 'the cipher', kind: 'a step-by-step problem (logic, a sum, a plan)', seconds: 120 }));
  const g1 = ctx.chatMetadata.rulesEngine.state.people.Ida.gZ;
  if (!(/SUCCESS|FAILURE/.test(wo) && Number.isFinite(g1))) { miss++; console.log(`MISS ability drawn once: ${wo.slice(0, 120)} ${g1}`); }
  // E34: an order to hurt a victim placed in the same room takes Milgram's 40 %; in another room, his 65 % baseline.
  fresh(); await run('Layout', { spots: [{ spot: 'desk', x_m: 1, y_m: 1, room: 'lab' }, { spot: 'chair', x_m: 3, y_m: 1, room: 'lab' }, { spot: 'booth', x_m: 8, y_m: 1, room: 'booth' }],
    rooms: [{ room: 'lab', corners: [[0, 0], [5, 0], [5, 4], [0, 4]] }, { room: 'booth', corners: [[6, 0], [10, 0], [10, 4], [6, 4]] }] });
  for (const [w, s] of [['Teacher', 'desk'], ['Learner', 'chair']]) await run('Act', { level: 'on the level, stairs or a change of posture', who: w, steps: [{ do: 'be_at', to: s }] });
  const same = String(await run('SocialResponse', { situation: 'an order to hurt someone', who: 'Teacher', victim: 'Learner' }));
  ctx.chat[0].mes = 'move'; await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Learner', steps: [{ do: 'be_at', to: 'booth' }] });
  ctx.chat[0].mes = 'again'; const apart = String(await run('SocialResponse', { situation: 'an order to hurt someone', who: 'Teacher', victim: 'Learner' }));
  if (!(/(carries the order out to the end|refuses before the end) \(victim in the same room\)/.test(same) && /(carries the order out to the end|refuses before the end) \(victim out of sight\)/.test(apart))) { miss++; console.log(`MISS obedience from the scene: ${same} | ${apart}`); }
  // E35: with three onlookers placed in the same room and no number given, the helper counts 3 others.
  for (const w of ['A1', 'A2', 'A3']) { ctx.chat[0].mes = `p${w}`; await run('Act', { level: 'on the level, stairs or a change of posture', who: w, steps: [{ do: 'be_at', to: 'desk' }] }); }
  ctx.chat[0].mes = 'help'; const help = String(await run('SocialResponse', { situation: 'an emergency they witness', who: 'Teacher', victim: 'Learner' }));
  if (!/with 3 others watching/.test(help)) { miss++; console.log(`MISS bystanders counted: ${help}`); }
  // E11: acuity holds to 55, then falls (Beaver Dam: about 0.1 logMAR in 5 years after 75).
  if (!(V2.ageAcuity(40) === 1 && Math.abs(V2.ageAcuity(75) - 10 ** -0.208) < 1e-6 && V2.ageAcuity(85) < V2.ageAcuity(75))) { miss++; console.log(`MISS acuity by age: ${[40, 75, 85].map(V2.ageAcuity)}`); }
}
// E07: Blackwell's contrast thresholds (J Opt Soc Am 36:624, Table III) reproduced at their points, and a person (0.5 m, black against the sky) seen by light level.
{
  const thr = [V.logThreshold(121, 342.6), V.logThreshold(55.2, 3.426e-4), V.logThreshold(9.68, 3.426e-2), V.logThreshold(18.2, 3.426)];
  const p = (lux, d) => V.see({ size: 0.5, distance: d, light: lux }).detect;
  if (!(Math.abs(thr[0] + 2.132) < 1e-9 && Math.abs(thr[1] + 0.590) < 1e-9 && Math.abs(thr[2] + 0.526) < 1e-9 && Math.abs(thr[3] + 1.738) < 1e-9
    && p(0.26, 50) > 0.95 && p(0.26, 200) < 0.1 && p(0.002, 10) > 0.9 && p(0.002, 50) < 0.05 && p(15800, 500) > 0.95)) { miss++; console.log(`MISS Blackwell thresholds: ${thr} | moon 50/200 m ${p(0.26, 50)} ${p(0.26, 200)} | stars 10/50 m ${p(0.002, 10)} ${p(0.002, 50)} | day 500 m ${p(15800, 500)}`); }
}
// E30: a woman's feeling about a central event outlasts a man's about an event that only touches a goal (Verduyn & Lavrijsen 2015: importance B = .14 log10 per point; women 4.42 against men 4.04): expected ratio 6.3.
{
  const med = async (sex, matters) => { const xs = []; for (let i = 0; i < 120; i++) { fresh(); ctx.chat[0].mes = `f${sex}${i}`; await run('BodyWound', { who: 'Kit', part: 'upper body', type: 'blunt' });
    ctx.chatMetadata.rulesEngine.state.people.Kit.sex = sex; await run('Appraise', { who: 'Kit', about: 'an event that affects them', target: 'x', matters, good: false }); xs.push(ctx.chatMetadata.rulesEngine.state.people.Kit.feelings[0].left); }
    return xs.sort((a, b) => a - b)[60]; };
  const r = await med('female', 'a goal, standard or taste is central') / await med('male', 'a goal, standard or taste is touched');
  if (!(r > 3.5 && r < 11)) { miss++; console.log(`MISS feeling length by importance and sex: ratio ${r}`); }
}
// N01: alcohol spreads through the drinker's own body water (Watson 1980): 14 g raises a 40-year-old 175 cm 70 kg man to
// 0.0273 % and a 162.6 cm 60 kg woman to 0.0372 %, where Widmark's fixed 0.68 gave both sexes 0.0294 % at 70 kg.
{
  const B = await import('../src/rules/body-engine.js');
  const man = B.bacOfGrams({ mass: 70, sex: 'male', age: 40, heightCm: 175 }, 14), woman = B.bacOfGrams({ mass: 60, sex: 'female', age: 40, heightCm: 162.6 }, 14);
  if (!(Math.abs(man - 0.0273) < 0.0003 && Math.abs(woman - 0.0372) < 0.0003)) { miss++; console.log(`MISS Watson body water: man ${man}, woman ${woman}`); }
  // N02: the three-process clock (Ingre 2014) keeps Dawson & Reid's points (0.05 % at 17 h awake at 01:00, 0.10 % at 24 h at
  // 08:00), leaves 17 h awake at 15:00 unimpaired, and has a person up since 07:00 sleepy at 04:00 but not at 10:00.
  const d17 = B.clockAwakeBac(17, 1), d24 = B.clockAwakeBac(24, 8), aft = B.clockAwakeBac(17, 15), k4 = B.sleepinessKss(21, 4), k10 = B.sleepinessKss(3, 10);
  if (!(Math.abs(d17 - 0.05) < 1e-9 && Math.abs(d24 - 0.10) < 1e-9 && aft === 0 && k4 >= 7 && k10 <= 4.5)) { miss++; console.log(`MISS alertness by the clock: ${d17} ${d24} ${aft} KSS ${k4} ${k10}`); }
  // The clock reaches a body through the story time: a night awake reads worse at 04:00 than the same hours ending at 16:00.
  const night = { needs: { awake: 21 * 60, debt: 0 }, clockMin: 4 * 60 }, day = { needs: { awake: 21 * 60, debt: 0 }, clockMin: 16 * 60 };
  if (!(B.impairmentBac(night) > B.impairmentBac(day) + 0.03)) { miss++; console.log(`MISS clock in impairment: ${B.impairmentBac(night)} vs ${B.impairmentBac(day)}`); }
  // N03: a food deficit takes mass (Hall 2010/2011 energy densities, Forbes partition): the first 2,090 kcal take the glycogen
  // and its water (1.85 kg); 14,000 kcal take 3–5 kg from a 70 kg man, a larger share of it lean than from a fatter body; food
  // eaten back restores the mass.
  const lean = { species: 'human', mass: 70, sex: 'male', age: 40, heightCm: 175, needs: { kcal: 2090 } }, fatter = { ...lean, mass: 100, needs: { kcal: 14000 } };
  B.settleMass(lean); const gly = 70 - lean.mass; lean.needs.kcal = 14000; B.settleMass(lean); const lost = 70 - lean.mass;
  B.settleMass(fatter); const fatShareLean = (13.182 - (lean.stores?.fatKg ?? 13.182)) / lost, fatShareFat = (B.fatKgOf({ ...fatter, mass: 100 }) - (fatter.stores?.fatKg ?? 0)) / (100 - fatter.mass);
  lean.needs.kcal = 0; B.settleMass(lean);
  if (!(Math.abs(gly - 1.85) < 0.01 && lost > 3 && lost < 5 && fatShareFat > fatShareLean && lean.mass === 70 && !lean.stores)) { miss++; console.log(`MISS mass from the deficit: glycogen ${gly}, 14000 kcal ${lost}, fat shares ${fatShareLean} ${fatShareFat}, back ${lean.mass}`); }
}
// N04: cold water against Tikuisis 1997 (Aviat Space Environ Med 68:441, Table I): a young lean man (72.2 kg, 1.74 m), nude,
// afloat in a calm sea at 10.7 °C reaches 30 °C core (unconsciousness) in 3.2 h; the engine's JOS-3 within ±20 %.
{
  fresh(); ctx.chat[0].mes = 'tikuisis';
  await run('BodyWound', { who: 'Sam', part: 'upper body', type: 'blunt' });
  const p = ctx.chatMetadata.rulesEngine.state.people.Sam; p.wounds = []; p.mass = 72.2; p.sex = 'male'; p.age = 24; p.heightCm = 174;
  await run('BodyEnvironment', { who: ['Sam'], air_c: 10.7, water_c: 10.7, immersed: ['whole body'], afloat: true, swimmer: true });
  let t = 0;
  for (let i = 0; i < 40 && !(p.thermal?.core <= 30) && !p.dead; i++) { ctx.chat[0].mes = `tk${i}`; await run('PassTime', { minutes: 10, resting: ['Sam'] }); t += 10; }
  if (!(t / 60 >= 2.56 && t / 60 <= 3.84)) { miss++; console.log(`MISS Tikuisis cold water: ${t / 60} h to ${p.thermal?.core} °C`); }
}
// N07: trust games (Johnson & Mislin 2011): a Swede hands a stranger a share drawn about the Swedish mean of 74 %; with no
// country, about the 50 % of all 35 countries. N08: a false detail told after an event is taken as seen about 47 % of the
// time (Loftus 2005), and it lands in what the witness knows.
{
  fresh(); await run('BodyWound', { who: 'Ola', part: 'upper body', type: 'blunt' });
  const st = ctx.chatMetadata.rulesEngine.state; st.setting = { ...(st.setting ?? {}), country: 'Sweden' };
  const sw = String(await run('SocialResponse', { situation: 'a chance to hand something of value to a stranger who could keep it', who: 'Ola' }));
  st.setting.country = null; ctx.chat[0].mes = 'nocountry';
  const any = String(await run('SocialResponse', { situation: 'a chance to give back part of what a trusting stranger handed them', who: 'Ola' }));
  const So = await import('../src/rules/social.js'), ms = So.trustMeans('Sweden'), mu = So.trustMeans('United Kingdom of Great Britain and Northern Ireland'), m0 = So.trustMeans(null);
  if (!(/^Ola hands over \d+ % of what they could/.test(sw) && /^Ola gives back \d+ % of what they now hold/.test(any) && ms.sent === 0.74 && mu.returned === 0.28 && m0.sent === 0.502)) { miss++; console.log(`MISS trust games: ${sw} | ${any} | ${JSON.stringify([ms, mu, m0])}`); }
  // 100 fresh witnesses at 47 %: the bounds 0.27–0.67 sit 4 SD out (SD 0.050).
  let taken = 0, faded = 0;
  for (let i = 0; i < 140; i++) {
    fresh(); ctx.chat[0].mes = `mis${i}`; const W = `Wit${i}`; await run('BodyWound', { who: W, part: 'upper body', type: 'blunt' });
    T.setStoryTime(Date.UTC(1890, 0, 1) / 60000);
    await run('RecordFact', { fact: 'the thief hurt the girl\'s neck', known_by: [W], how: 'saw it', importance: 1 });
    if (i >= 100) ctx.chatMetadata.rulesEngine.state.clock.add += 20 * 525960;
    const r = String(await run('SocialResponse', { situation: 'told a false detail about an event they saw', who: W, speaker: 'Inspector', statement: 'the thief hurt the girl\'s arm', event_fact: 'the thief hurt the girl\'s neck' }));
    if (/now remembers it as part of what they saw/.test(r)) { if (i < 100) taken++; else if (/had faded/.test(r)) faded++; }
  }
  const kn = (ctx.chatMetadata.rulesEngine.state.facts ?? []).some(f => /girl's arm/.test(f.text) && f.knowers.includes('Wit139'));
  if (!(taken / 100 > 0.27 && taken / 100 < 0.67 && faded >= 28 && kn)) { miss++; console.log(`MISS misinformation: ${taken}/100 taken fresh, ${faded}/40 taken after 20 years, known ${kn}`); }
}
// N09: before the national series, homicide comes from Eisner 2003 (Table 1 by region, Table 2 for Europe).
{
  fresh();
  const pe = String(await run('PlaceProfile', { country: 'United Kingdom', year: 1550 })), pf = String(await run('PlaceProfile', { country: 'France', year: 1450 }));
  const Pp = await import('../src/rules/population.js');
  // N11: an American man of 1850 is drawn around BMI 22.9 (Fogel 2010), not the 25.2 of 1975.
  const Bs = await import('../src/rules/body-size.js'), z = () => 0;
  const us1850 = Bs.bodySize('United States', 'male', 1825, 1850, z), us1975 = Bs.bodySize('United States', 'male', 1950, 1975, z);
  if (!(Math.abs(us1850.massKg / ((us1850.heightCm) / 100) ** 2 * Math.exp(Math.log(1 + 0.19 ** 2) / 2) - 22.9) < 0.15 && us1975.massKg / (us1975.heightCm / 100) ** 2 > 24.5)) { miss++; console.log(`MISS 1850 BMI: ${JSON.stringify(us1850)} ${JSON.stringify(us1975)}`); }
  // N10: a place with no life table before 1900 takes the pre-industrial schedule (Siler, Sweden 1751–59: l15 0.607).
  await Pp.loadPopulation?.();
  const sv = Pp.survival('India', 'male', 1850, 0, 15);
  if (!(sv && Math.abs(sv.share - 0.607) < 0.01 && Pp.survival('India', 'male', 1960, 0, 15)?.country !== 'a pre-industrial farming population')) { miss++; console.log(`MISS survival before 1900: ${JSON.stringify(sv)}`); }
  if (!(/about 7 murders per 100,000 a year/.test(pe) && /about 41 murders per 100,000/.test(pf) && Pp.eisnerHomicide('Japan', 1550) === null && Pp.eisnerHomicide('Italy', 1620).few)) { miss++; console.log(`MISS Eisner homicide: ${pe} | ${pf}`); }
}
// N12: traits are drawn around the mean of the person's sex and age (IPIP-NEO-300): a woman of 60 sits about one SD above a
// man of 21 on agreeableness and below him on emotional stability's sex gap; Buss's per-sex act shares take the within-sex place.
{
  const Pe = await import('../src/rules/personality.js');
  const w60 = Pe.traitMean('agreeableness', 'female', 60).mean, m21 = Pe.traitMean('agreeableness', 'male', 21).mean;
  const es = Pe.traitMean('emotional stability', 'female', 40).mean - Pe.traitMean('emotional stability', 'male', 40).mean;
  if (!(w60 - m21 > 0.9 && w60 - m21 < 1.15 && Math.abs(es + 0.404) < 1e-9 && Pe.traitMean('intellect', null, null).mean === 0)) { miss++; console.log(`MISS traits by sex and age: ${w60} ${m21} ${es}`); }
}
// N13: what people of the setting think of an act (WVS wave 7): a Brazilian of 2020 condemns stealing outright about 87 % of the
// time; before 2000 the engine holds no measure; PlaceProfile gives the Dutch trust share.
{
  fresh(); await run('BodyWound', { who: 'Ana', part: 'upper body', type: 'blunt' });
  const st = ctx.chatMetadata.rulesEngine.state; st.setting = { ...(st.setting ?? {}), country: 'Brazil' };
  const Z = await import('../src/rules/zone.js'), story = (y, m, d) => (Date.UTC(y, m, d) - Z.MS_YEAR1) / 60000;
  T.setStoryTime(story(2020, 5, 1));
  let n = 0;
  for (let i = 0; i < 60; i++) { ctx.chat[0].mes = `wvs${i}`; if (/condemns it outright/.test(String(await run('SocialResponse', { situation: 'an act they see or hear of that they may condemn outright', who: 'Ana', act: 'stealing property' })))) n++; }
  const So = await import('../src/rules/social.js'), nl = String(await run('PlaceProfile', { country: 'Netherlands', year: 2020 }));
  T.setStoryTime(story(1950, 5, 1)); ctx.chat[0].mes = 'wvsold';
  const old = String(await run('SocialResponse', { situation: 'an act they see or hear of that they may condemn outright', who: 'Ana', act: 'stealing property' }));
  // 60 draws at 87.2 %: mean 52.3, SD 2.6; 4 SD below is 42, and 4 SD above lies past 60.
  if (!(n >= 42 && /^No measure of how people judged stealing property in 1950/.test(old) && /61 % say most people can be trusted/.test(nl) && So.wvsFor('United Kingdom of Great Britain and Northern Ireland')?.name === 'United Kingdom')) { miss++; console.log(`MISS WVS: ${n}/60 condemn, old: ${old}, NL: ${nl}`); }
}
// N14: PHOIBLE's most common marked segments come out in letters: a long nasal vowel doubles whole, Korean fortis doubles,
// lenis, apical and creaky marks drop (roman.ts; 99.97 % of PHOIBLE 2.0 segment occurrences in Latin letters).
{
  const Ro = await import('../src/rules/roman.js');
  const got = [Ro.roman('ɛ̃ː'), Ro.roman('p͈ a'), Ro.roman('k͉ a'), Ro.roman('t̺ a'), Ro.roman('aː')];
  if (got.join(',') !== ['è̃è̃', 'ppa', 'ka', 'ta', 'aa'].join(',')) { miss++; console.log(`MISS PHOIBLE segments: ${got}`); }
}
// N15: under water, a person 10 m off is seen in clear coastal water (range 15 m) but not in a muddy river (0.5 m): the
// water's hydrological range takes the place of visibility (Duntley 1960).
{
  let clear = 0, muddy = 0;
  for (let i = 0; i < 20; i++) {
    fresh(); ctx.chat[0].mes = `uw${i}`; await run('BodyWound', { who: 'Div', part: 'upper body', type: 'blunt' });
    if (/notices|recognizes|identifies/.test(String(await run('Look', { viewer: 'Div', kind: 'a person', distance_m: 10, light: 'office', water_visibility_m: 15 })))) clear++;
    ctx.chat[0].mes = `uwm${i}`;
    if (/notices|recognizes|identifies/.test(String(await run('Look', { viewer: 'Div', kind: 'a person', distance_m: 10, light: 'office', water_visibility_m: 0.5 })))) muddy++;
  }
  if (!(clear >= 18 && muddy <= 2)) { miss++; console.log(`MISS underwater sight: clear ${clear}/20, muddy ${muddy}/20`); }
}
// N16: remembering an intention when its moment comes (Scullin et al. 2010): with the cue in front of them about 73 %, with
// nothing pointing to it about 18 %.
{
  // 100 each: over 400 draws 75 % and 17.75 %; the bounds sit about 4 SD out (with 60, the upper bound of 0.9 sat 2.5 SD out).
  let focal = 0, none = 0;
  for (let i = 0; i < 100; i++) {
    fresh(); ctx.chat[0].mes = `pm${i}`; await run('BodyWound', { who: 'Pia', part: 'upper body', type: 'blunt' });
    if (/SUCCESS/.test(String(await run('WorkOut', { who: 'Pia', problem: 'drop the letter at the post office', kind: 'remembering to do what they meant to, the cue in front of them' })))) focal++;
    ctx.chat[0].mes = `pmn${i}`;
    if (/SUCCESS/.test(String(await run('WorkOut', { who: 'Pia', problem: 'take the medicine', kind: 'remembering to do what they meant to, nothing in the moment pointing to it' })))) none++;
  }
  if (!(focal / 100 > 0.58 && focal / 100 < 0.92 && none / 100 < 0.34)) { miss++; console.log(`MISS intentions: focal ${focal}/100, none ${none}/100`); }
}
// N17: Communicate keeps only part of a long list for the listener (working memory) and the whole for the speaker.
{
  fresh(); await run('BodyWound', { who: 'Mo', part: 'upper body', type: 'blunt' }); ctx.chat[0].mes = 'list';
  await run('BodyWound', { who: 'Lu', part: 'upper body', type: 'blunt' }); ctx.chat[0].mes = 'list2';
  const msg = 'bring flour, salt, two candles, lamp oil, a hammer, nails, rope, and the blue cloth';
  const out = String(await run('Communicate', { speaker: 'Mo', listener: 'Lu', means: 'speech', distance_m: 1, message: msg }));
  const facts = ctx.chatMetadata.rulesEngine.state.facts ?? [];
  const whole = facts.find(f => f.text === msg), part = facts.find(f => /the rest of the list lost/.test(f.text));
  if (!(/holds \d of them \(working memory\)/.test(out) && whole?.knowers.includes('Mo') && !whole?.knowers.includes('Lu') && part?.knowers.includes('Lu'))) { miss++; console.log(`MISS list heard once: ${out}`); }
}
// N18: hours on a task and dehydration raise the odds of failing an alertness task (Bamberg 2025 / Folkard, Wittbrodt 2018).
{
  const BE = await import('../src/rules/body-engine.js');
  const at = (onTask, duty) => BE.workRisk({ needs: { onTask, duty } });
  const pThirst = pct => ({ mass: 70, needs: { waterL: 0.7 * pct } });
  const ok = Math.abs(at(0, 0) - 1) < 1e-9 && Math.abs(at(60, 60) - (1 + 60 / 105)) < 1e-9 && Math.abs(at(120, 12 * 60) - (1 + 120 / 105) * 1.275) < 1e-9
    && BE.thirstRisk(pThirst(0.5), 'attention') === 1 && Math.abs(BE.thirstRisk(pThirst(1.5), 'attention') - Math.exp(1.81 * 0.14)) < 1e-9
    && Math.abs(BE.thirstRisk(pThirst(3), 'attention') - Math.exp(1.81 * 0.52)) < 1e-9 && Math.abs(BE.thirstRisk(pThirst(3), 'motor') - Math.exp(1.81 * 0.40)) < 1e-9;
  if (!ok) { miss++; console.log(`MISS work and thirst factors: ${at(60, 60)}, ${at(120, 720)}, ${BE.thirstRisk(pThirst(3), 'attention')}`); }
}
// N19: Choose weighs an option by the chooser's feelings and drink (choice.ts): anger in a man, fear, alcohol at 0.08 %.
{
  const Ch = await import('../src/rules/choice.js');
  const f = (k, c) => Ch.optionFactor(k, c).factor;
  const ok = Math.abs(f('attack or fight', { sex: 'male', feelings: ['anger'] }) - Math.exp(1.81 * 0.54)) < 1e-6
    && Math.abs(f('attack or fight', { feelings: ['fear'] }) - Math.exp(-1.81 * 0.30)) < 1e-6
    && Math.abs(f('attack or fight', { bac: 0.08 }) - Math.exp(1.81 * 0.61)) < 1e-6
    && f('something else', { sex: 'male', feelings: ['anger'], bac: 0.2 }) === 1;
  if (!ok) { miss++; console.log('MISS option factors'); }
}
// N20: an angry man at 0.08 % fights more often than the same man calm and sober (odds × 8: from 50 % to about 89 %); a body
// that cannot stand cannot fight or run.
{
  let hot = 0, calm = 0;
  const opts = [{ option: 'hit him', share: '50% half', kind: 'attack or fight' }, { option: 'talk it over', share: '50% half', kind: 'talk, bargain or give way' }];
  for (let i = 0; i < 100; i++) {
    for (const angry of [true, false]) {
      fresh(); ctx.chat[0].mes = `ch${i}${angry}`; await run('BodyWound', { who: 'Hal', part: 'upper body', type: 'blunt' });
      const p = ctx.chatMetadata.rulesEngine.state.people.Hal; p.sex = 'male'; ctx.chatMetadata.rulesEngine.state.traits = { Hal: { agreeableness: 0, extraversion: 0 } };
      if (angry) { p.feelings = [{ type: 'anger' }]; p.needs = { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null, alcohol: 0.08 }; }
      ctx.chat[0].mes = `chc${i}${angry}`;
      if (/chooses: hit him/.test(String(await run('Choose', { who: 'Hal', options: opts })))) angry ? hot++ : calm++;
    }
  }
  fresh(); await run('BodyWound', { who: 'Hal', part: 'upper body', type: 'blunt' });
  ctx.chatMetadata.rulesEngine.state.people.Hal.lost = 1500;
  const weak = String(await run('Choose', { who: 'Hal', options: [...opts.slice(0, 1), { option: 'run off', share: '50% half', kind: 'run, hide or keep away' }, opts[1]] }));
  // Over 400 draws: angry 88.5 %, calm 47.5 %; over 30 samples of 60 the angry count was 53.2 ± 2.9, one of them 42. With
  // 100 each the bounds sit 5.8 SD (angry) and 4.5 SD (calm) out (before, 0.75 and 0.65 of 60 sat under 3 SD).
  if (!(hot / 100 > 0.7 && calm / 100 < 0.7 && hot - calm >= 10 && /chooses: talk it over/.test(weak) && /Out of reach for the body now: hit him; run off/.test(weak))) { miss++; console.log(`MISS Choose from state: angry ${hot}/100, calm ${calm}/100; ${weak}`); }
}
// N21: jumps and lifts from body norms (feats.ts): a man of 25 jumps about 2 m standing and about 4.2 m with a full run-up at 9 m/s,
// and lifts about 49 kg from the floor to the waist; a ditch of 1.2 m is cleared standing, one of 4 m is not.
{
  const Fe = await import('../src/rules/feats.js');
  const man = { sex: 'male', age: 25, heightCm: 175.5, mass: 70 }, sd = Fe.jumpDistanceM(man, 0, 9), rn = Fe.jumpDistanceM(man, 15, 9), lift = Fe.liftCapacityKg(man);
  let near = 0, far = 0;
  for (let i = 0; i < 10; i++) {
    fresh(); ctx.chat[0].mes = `jp${i}`; await run('BodyWound', { who: 'Jo', part: 'upper body', type: 'blunt' });
    if (/SUCCESS/.test(String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Jo', task: 'jump the ditch', gap_m: 1.2 })))) near++;
    ctx.chat[0].mes = `jpf${i}`;
    if (/SUCCESS/.test(String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Jo', task: 'jump the wide ditch', gap_m: 4 })))) far++;
  }
  if (!(Math.abs(sd - 1.96) < 0.1 && rn > 3.8 && rn < 4.5 && Math.abs(lift - 48.7) < 2 && near >= 9 && far === 0)) { miss++; console.log(`MISS feats: standing ${sd}, running ${rn}, lift ${lift}, 1.2 m ${near}/10, 4 m ${far}/10`); }
}
// N22: conformity (Asch 1956; Bond & Smith 1996): three against one, 1951, a man: 31.8 %; one ally: 5 %; later studies lower.
{
  const So = await import('../src/rules/social.js');
  const ok = Math.abs(So.conformShare(3, false, 'male', 1951) - 0.318) < 1e-6 && Math.abs(So.conformShare(3, true, 'male', 1951) - 0.05) < 1e-6
    && So.conformShare(3, false, 'female', 1951) > 0.318 && So.conformShare(3, false, 'male', 2000) < 0.25 && So.conformShare(0, false, 'male', 1951) === 0;
  if (!ok) { miss++; console.log('MISS conformity shares'); }
}
// N23: the activity a character is at gives the mood people typically report at it (Kahneman et al. 2004, DRM).
{
  const Mo = await import('../src/rules/mood.js');
  fresh(); await run('BodyWound', { who: 'Cy', part: 'upper body', type: 'blunt' });
  await run('BodyEnvironment', { who: 'Cy', activity: 'commuting to work', air_c: 20 });
  const s = String(await run('BodyStatus', { who: 'Cy' }));
  if (!(Mo.drmRow('cooking supper')?.label === 'preparing food' && Mo.drmRow('eating supper')?.label === 'eating' && Mo.drmRow('staring at the wall') === null
    && /Cy's activity \(commuting\): people at it typically feel, 0–6, positive 3.45/.test(s))) { miss++; console.log(`MISS mood by activity: ${s.slice(0, 200)}`); }
}
// N24: food beyond the need puts weight on, as tissue (Forbes partition), and a deficit takes glycogen first (Hall 2010);
// a body at its lethal BMI dies of starvation (Henry 2001).
{
  const BE = await import('../src/rules/body-engine.js');
  const mk = () => ({ sex: 'male', age: 30, heightCm: 175.5, mass: 70, needs: { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null } });
  const up = mk(); up.needs.surplus = 7000; BE.settleMass(up);
  const down = mk(); down.needs.kcal = 2090; BE.settleMass(down);
  fresh(); await run('BodyWound', { who: 'Ed', part: 'upper body', type: 'blunt' });
  const p = ctx.chatMetadata.rulesEngine.state.people.Ed; p.sex = 'male'; p.heightCm = 175.5; p.mass = 12.9 * 1.755 ** 2;
  p.needs = { waterL: 0, kcal: 20000, awake: 0, slept: 0, waterDeath: null, foodDeath: null }; p.stores = { mass0: 70, fatKg: 1, glycogenG: 0, applied: 20000, lethalBmi: 13 };
  await run('PassTime', { minutes: 2, resting: ['Ed'] });
  const dead = ctx.chatMetadata.rulesEngine.state.people.Ed.dead;
  const lm = [0, 1].map(f => { let s = 0; for (let i = 0; i < 4000; i++) s += BE.lethalBmi({ sex: f ? 'female' : 'male' }, Math.random); return s / 4000; });
  if (!(up.mass - 70 > 1.0 && up.mass - 70 < 1.4 && Math.abs(70 - down.mass - 1.85) < 0.05 && dead === 'starvation' && Math.abs(lm[0] - 13) < 0.15 && Math.abs(lm[1] - 11) < 0.15)) {
    miss++; console.log(`MISS mass: up ${up.mass}, down ${down.mass}, dead ${dead}, lethal BMI ${lm}`); }
}
// N25: a crowd through one 1 m door (Helbing, Farkas & Vicsek 2000): about 0.7 a second at 0.8 m/s, no one crushed; at 5 m/s
// fewer get out a second than at 1.5 m/s ("faster is slower") and some are crushed.
{
  const Cr = await import('../src/rules/crowd.js');
  const seeded = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const slow = Cr.evacuate(100, 225, 1, 0.8, seeded(1)), mid = Cr.evacuate(100, 225, 1, 1.5, seeded(2)), fast = Cr.evacuate(100, 225, 1, 5, seeded(3));
  fresh();
  const room = String(await run('Room', { room: 'hall', floor_m2: 225, height_m: 3, people: 100, exit_width_m: 1 }));
  if (!(slow.flow > 0.5 && slow.flow < 0.95 && slow.crushed === 0 && fast.flow < mid.flow && fast.crushed > 0 && /Leaving through the 1 m exit: 100 out, the last after \d+ s/.test(room))) {
    miss++; console.log(`MISS crowd: ${JSON.stringify({ slow, mid, fast })} ${room}`); }
}
// N26: lineups (Steblay et al. 2011; Wixted & Wells 2017): with a fresh memory 52 % pick the culprit when present and 54 % pick
// someone when absent; high-confidence picks of the suspect are about 97 % right; a week later fewer pick the culprit.
{
  const So = await import('../src/rules/social.js');
  let u = 7; const rnd = () => { u = (u * 16807) % 2147483647; return u / 2147483647; };
  const normal = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
  const N = 6000, fresh0 = So.faceStrength(true, 0), week = So.faceStrength(true, 168);
  let hit = 0, chose = 0, hiHit = 0, hiInnocent = 0, hitWeek = 0;
  for (let i = 0; i < N; i++) {
    const a = So.lineupPick(fresh0, true, normal), b = So.lineupPick(fresh0, false, normal), c = So.lineupPick(week, true, normal);
    if (a.pick === 'culprit') { hit++; if (a.confidence === 'high') hiHit++; }
    if (b.pick !== 'none') { chose++; if (b.confidence === 'high') hiInnocent += 1 / 6; }
    if (c.pick === 'culprit') hitWeek++;
  }
  fresh(); await run('BodyWound', { who: 'Wit', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Rob', part: 'upper body', type: 'blunt' });
  await run('Look', { viewer: 'Wit', kind: 'a person', distance_m: 3, light: 'office', target_who: 'Rob' });
  const seen = ctx.chatMetadata.rulesEngine.state.sightings?.Wit?.Rob;
  const out = String(await run('SocialResponse', { situation: 'a witness looks over a lineup of six for someone they saw', who: 'Wit', target_who: 'Rob', culprit_present: true }));
  const acc = hiHit / (hiHit + hiInnocent);
  if (!(Math.abs(hit / N - 0.52) < 0.03 && Math.abs(chose / N - 0.54) < 0.03 && acc > 0.94 && hitWeek / N < 0.35 && seen?.identified === true && /Wit (picks Rob|picks someone else|says the one they saw is not there)\b.*saw the face/.test(out))) {
    miss++; console.log(`MISS lineup: hit ${hit / N}, chose ${chose / N}, high-confidence accuracy ${acc}, week ${hitWeek / N}; ${out}`); }
}
// N27: fear crowds working memory (Moran 2016, g = −0.334): the odds of solving a problem × e^(−1.81 × 0.334) = 0.546 while
// the thinker feels fear, and the answer says so.
{
  const seen = [], dbg = console.debug; console.debug = (...x) => { seen.push(x.join(' ')); };
  const outs = [];
  for (const fear of [false, true]) {
    fresh(); ctx.chat[0].mes = 'wm'; await run('BodyWound', { who: 'Ida', part: 'upper body', type: 'blunt' });
    const p = ctx.chatMetadata.rulesEngine.state.people.Ida; p.gZ = 1; if (fear) p.feelings = [{ type: 'fear' }];
    ctx.chat[0].mes = 'wmc';
    outs.push(String(await run('WorkOut', { who: 'Ida', problem: 'the sum of the debts', kind: 'a step-by-step problem (logic, a sum, a plan)', seconds: 60 })));
  }
  console.debug = dbg;
  const ch = seen.filter(l => /work out the sum of the debts chance/.test(l)).map(l => Number(l.match(/chance ([\d.]+) %/)[1]) / 100);
  const odds = q => q / (1 - q), ratio = ch.length >= 2 ? odds(ch[ch.length - 1]) / odds(ch[0]) : NaN;
  if (!(Math.abs(ratio - Math.exp(-1.81 * 0.334)) < 0.01 && !/Fear/.test(outs[0]) && /Fear crowded the thinking/.test(outs[1]))) { miss++; console.log(`MISS fear in thinking: chances ${ch}, ratio ${ratio}; ${outs.join(' | ')}`); }
}
// N28: what weakens a lineup (Deffenbacher 2004, Steblay 1992, Meissner & Brigham 2001) and sequential lineups (Steblay 2011):
// fear 36.7 %, a weapon 45.5 %, another people's face 37.1 % culprit picks and 64.7 % picks from culprit-absent lineups;
// sequential 32 % picks when absent and about 40 % culprit picks when present.
{
  const So = await import('../src/rules/social.js');
  let u = 11; const rnd = () => { u = (u * 16807) % 2147483647; return u / 2147483647; };
  const normal = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());
  const N = 6000, rate = (d, present, o = {}) => { let n = 0; for (let i = 0; i < N; i++) { const r = So.lineupPick(d, present, normal, { ...o, uniform: rnd }); if (present ? r.pick === 'culprit' : r.pick !== 'none') n++; } return n / N; };
  const got = { stress: rate(So.faceStrength(true, 0, { stressed: true }), true), weapon: rate(So.faceStrength(true, 0, { weapon: true }), true),
    otherHit: rate(So.faceStrength(true, 0, { otherGroup: true }), true, { otherGroup: true }), otherAbsent: rate(0, false, { otherGroup: true }),
    seqAbsent: rate(0, false, { sequential: true }), seqHit: rate(So.faceStrength(true, 0), true, { sequential: true }) };
  const want = { stress: 0.367, weapon: 0.455, otherHit: 0.371, otherAbsent: 0.647, seqAbsent: 0.32, seqHit: 0.405 };
  if (!Object.keys(want).every(k => Math.abs(got[k] - want[k]) < 0.03)) { miss++; console.log(`MISS lineup factors: ${JSON.stringify(got)}`); }
}
// N29: Look keeps the witness's fear and a weapon in view with the sighting, and the lineup names them.
{
  fresh(); await run('BodyWound', { who: 'Wit', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Rob', part: 'upper body', type: 'blunt' });
  ctx.chatMetadata.rulesEngine.state.people.Wit.feelings = [{ type: 'fear' }];
  await run('Look', { viewer: 'Wit', kind: 'a person', distance_m: 3, light: 'office', target_who: 'Rob', weapon_in_view: true });
  const seen = ctx.chatMetadata.rulesEngine.state.sightings?.Wit?.Rob;
  const out = String(await run('SocialResponse', { situation: 'a witness looks over a lineup of six for someone they saw', who: 'Wit', target_who: 'Rob', culprit_present: true, sequential: true }));
  if (!(seen?.stressed && seen?.weapon && /afraid when they saw it; a weapon drew the eye; faces shown one at a time/.test(out))) { miss++; console.log(`MISS sighting conditions: ${JSON.stringify(seen)} ${out}`); }
}
// N30: death in a press by compressive asphyxia (Hopkins et al. 1993): 6,227 N kills in 15 s and 1,112 N in about 5 minutes;
// a crowd packed past the model's discs is spread back from the exit and starts uncrushed.
{
  const Cr = await import('../src/rules/crowd.js');
  let u = 5; const rnd = () => { u = (u * 16807) % 2147483647; return u / 2147483647; };
  const dense = Cr.evacuate(150, 30, 1, 0.8, rnd, 5);
  const ok = Math.abs(Cr.asphyxiaSeconds(6227) - 15) < 1e-6 && Math.abs(Cr.asphyxiaSeconds(1112) - 300) < 10 && Cr.asphyxiaSeconds(500) === Infinity
    && dense.floorM2 > 90 && dense.crushed === 0 && dense.dead === 0;
  if (!ok) { miss++; console.log(`MISS asphyxia and packing: ${Cr.asphyxiaSeconds(6227)}, ${Cr.asphyxiaSeconds(1112)}, ${JSON.stringify(dense)}`); }
}
// N31: a bigger favour after a small one (Burger 1999) and a small one after a refused large one (Feeley et al. 2012): the
// cells' rates, the small favour kept and read back for the bigger one, and the door in the face as words more than deeds.
{
  const So = await import('../src/rules/social.js');
  const d = So.ditfChance(0.46), ok1 = So.fitdChance('did the small favour', true, false) === 0.3442 && So.fitdChance('did the small favour', false, true) === 0.4335
    && So.fitdChance('refused the small favour') < 0.25 && Math.abs(d.yes - 0.574) < 0.005 && Math.abs(d.does - 0.507) < 0.005;
  fresh(); await run('BodyWound', { who: 'Ned', part: 'upper body', type: 'blunt' });
  const first = String(await run('SocialResponse', { situation: 'a small favour asked by a stranger', who: 'Ned', request: 'sign the petition' }));
  ctx.chat[0].mes = 'fitd2';
  const second = String(await run('SocialResponse', { situation: 'asked a bigger favour after a small one for the same cause', who: 'Ned', request: 'put a sign in the garden' }));
  const kept = /agrees/.test(first) ? /earlier they did the small favour/.test(second) : /earlier they refused the small favour/.test(second);
  if (!(ok1 && kept)) { miss++; console.log(`MISS favours: ${JSON.stringify(d)} | ${first} | ${second}`); }
}
// N32: drowning (ILCOR 2020 CoSTR): brought out after 3 min under water about 88 % come through, after 15 min almost none; a
// person under water 8 min is still not dead in the water (the old 5-minute apnea clock killed them).
{
  const trial = async (mins, i) => {
    fresh(); ctx.chat[0].mes = `dr${mins}-${i}`; await run('BodyWound', { who: 'Lu', part: 'upper body', type: 'blunt' });
    await run('BodyEnvironment', { who: 'Lu', water_c: 20, immersed: ['whole body'], swimmer: false, air_c: 20 });
    for (let m = 0; m < mins; m++) { ctx.chat[0].mes = `drm${mins}-${i}-${m}`; await run('PassTime', { minutes: 1, resting: ['Lu'] }); }
    const before = ctx.chatMetadata.rulesEngine.state.people.Lu.dead;
    ctx.chat[0].mes = `dro${mins}-${i}`; await run('BodyEnvironment', { who: 'Lu', clear: true }); await run('PassTime', { minutes: 1, resting: ['Lu'] });
    return { before, after: ctx.chatMetadata.rulesEngine.state.people.Lu.dead };
  };
  let short = 0, long = 0, inWater = 0;
  for (let i = 0; i < 20; i++) { if (!(await trial(3, i)).after) short++; const l = await trial(15, i); if (!l.after) long++; }
  const mid = await trial(8, 0); if (!mid.before) inWater++;
  // 20 draws at 87.7 %: mean 17.5, SD 1.5; 4 SD below is 11.7.
  if (!(short >= 12 && long <= 3 && inWater === 1)) { miss++; console.log(`MISS drowning: 3 min ${short}/20, 15 min ${long}/20, alive in water at 8 min ${inWater}`); }
}
// N33 (logic): every alertness factor reaches the task. A drink of 0.08 % and two hours on the task each move the odds of
// failing an alertness task by their own factor (before, `a * b ? c : d` dropped them all).
{
  const BE = await import('../src/rules/body-engine.js');
  const seen = [], dbg = console.debug; console.debug = (...x) => { seen.push(x.join(' ')); };
  const chanceFor = async (setup, tag) => {
    fresh(); ctx.chat[0].mes = tag; await run('BodyWound', { who: 'Al', part: 'upper body', type: 'blunt' });
    setup(ctx.chatMetadata.rulesEngine.state.people.Al); seen.length = 0;
    await run('BodyCheck', { task_kind: OWN_KIND, who: 'Al', task: 'thread the needle', reference_class: 'people', base_share: '50% half', share: '50% half', uses: ['alertness'] });
    const l = seen.find(x => /thread the needle chance/.test(x)); return l ? Number(l.match(/chance ([\d.]+) %/)[1]) / 100 : NaN;
  };
  const base = await chanceFor(() => {}, 'al0');
  const drunk = await chanceFor(p => { p.needs = { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null, alcohol: 0.08 }; }, 'al1');
  const tired = await chanceFor(p => { p.needs = { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null, onTask: 120, duty: 120 }; }, 'al2');
  console.debug = dbg;
  const odds = q => (1 - q) / q;
  const rd = odds(drunk) / odds(base), rt = odds(tired) / odds(base);
  if (!(Math.abs(rd - BE.crashRisk(0.08)) < 0.05 * BE.crashRisk(0.08) && Math.abs(rt - (1 + 120 / 105)) < 0.05)) { miss++; console.log(`MISS alertness factors applied: base ${base}, drunk ${drunk} (×${rd}), tired ${tired} (×${rt})`); }
}
// N34 (logic): time on a task counts any activity at 1.5 MET or more, stops for a character listed at rest, and the mood of
// an activity is left out while the character sleeps.
{
  fresh(); await run('BodyWound', { who: 'Cy', part: 'upper body', type: 'blunt' });
  await run('BodyEnvironment', { who: 'Cy', activity: 'office work', met: 1.8, air_c: 20 });
  await run('PassTime', { minutes: 30 });
  const working = ctx.chatMetadata.rulesEngine.state.people.Cy.needs.onTask;
  ctx.chat[0].mes = 'rest'; await run('PassTime', { minutes: 20, resting: ['Cy'] });
  const rested = ctx.chatMetadata.rulesEngine.state.people.Cy.needs.onTask;
  ctx.chat[0].mes = 'sleep'; await run('PassTime', { minutes: 60, sleeping: ['Cy'] });
  const asleep = String(await run('BodyStatus', { who: 'Cy' }));
  if (!(working === 30 && rested === 0 && !/Cy's activity/.test(asleep))) { miss++; console.log(`MISS task time and mood: ${working}, ${rested}; ${asleep.slice(0, 160)}`); }
}
// N35 (logic): smaller fixes. Running is not exercise by default and a "service" is not a church; an ally never raises
// conformity; a jump of a child under 18 asks for shares; the lift's grip z is drawn with the feat and stays.
{
  const Mo = await import('../src/rules/mood.js'), So = await import('../src/rules/social.js'), Fe = await import('../src/rules/feats.js');
  const p = { sex: 'male', age: 30, mass: 70 }; let u = 0.3; Fe.featZ(p, () => (u = -u)); const g = p.gripZ, l1 = Fe.liftCapacityKg(p);
  fresh(); await run('BodyWound', { who: 'Kid', part: 'upper body', type: 'blunt' }); ctx.chatMetadata.rulesEngine.state.people.Kid.age = 10;
  const kid = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Kid', task: 'jump the ditch', gap_m: 1 }));
  const ok = Mo.drmRow('running for the door') === null && Mo.drmRow('table service') === null && Mo.drmRow('jogging')?.label === 'exercising'
    && So.conformShare(1, true, 'male', 1951) <= So.conformShare(1, false, 'male', 1951) && /jump norms start at age 20/.test(kid)
    && g != null && Fe.liftCapacityKg(p) === l1;
  if (!ok) { miss++; console.log(`MISS small logic fixes: ${kid}`); }
}
// N36 (logic): a bigger favour asked on the next calendar day counts as later, even two hours on; on the same day it does not.
{
  const Z = await import('../src/rules/zone.js');
  const minOf = (y, mo, d, h = 0) => { const x = new Date(0); x.setUTCFullYear(y, mo - 1, d); return (x.getTime() - Z.MS_YEAR1) / 60000 + h * 60; };
  const asked = async (h2, d2) => {
    fresh(); await run('BodyWound', { who: 'Ned', part: 'upper body', type: 'blunt' });
    T.setStoryTime(minOf(1890, 5, 1, 23));
    await run('SocialResponse', { situation: 'a small favour asked by a stranger', who: 'Ned', request: 'sign' });
    T.setStoryTime(minOf(1890, 5, d2, h2)); ctx.chat[0].mes = `fd${h2}${d2}`;
    return String(await run('SocialResponse', { situation: 'asked a bigger favour after a small one for the same cause', who: 'Ned', request: 'a sign' }));
  };
  const next = await asked(1, 2), same = await asked(23.5, 1);
  if (!(/on an earlier day/.test(next) && !/on an earlier day/.test(same))) { miss++; console.log(`MISS later day: ${next} | ${same}`); }
}
// N37 (logic): a tracked person inside a room that empties through one door gets their own end: out, crushed or dead.
{
  fresh(); await run('Layout', { spots: [{ spot: 'pew', x_m: 5, y_m: 5, room: 'chapel' }], rooms: [{ room: 'chapel', corners: [[0, 0], [12, 0], [12, 12], [0, 12]] }] });
  await run('BodyWound', { who: 'Eve', part: 'upper body', type: 'blunt' });
  await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Eve', steps: [{ do: 'be_at', to: 'pew' }] });
  const out = String(await run('Room', { room: 'chapel', height_m: 4, people: 40, exit_width_m: 1, exit_pace: 'normal (1 m/s)' }));
  if (!/Eve (gets out after \d+ s|is crushed|dies in the press|is still inside)/.test(out)) { miss++; console.log(`MISS tracked fate in a crowd: ${out.slice(-300)}`); }
}
// N38: children run at the measured share of the 18-year-old's top speed (Bleeker & Siener 2025): 0.759 at 10.9, 0.899 at
// 14.5; a 10-year-old no longer runs as fast as an adult.
{
  const BE = await import('../src/rules/body-engine.js');
  fresh(); await run('BodyWound', { who: 'Kit', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Man', part: 'upper body', type: 'blunt' });
  const st = ctx.chatMetadata.rulesEngine.state, kid = st.people.Kit, man = st.people.Man;
  Object.assign(kid, { sex: 'male', age: 10, runZ: 0 }); Object.assign(man, { sex: 'male', age: 25, runZ: 0 });
  const vk = BE.topSpeedKmh(kid), vm = BE.topSpeedKmh(man);
  if (!(Math.abs(BE.childSpeedShare(10.9) - 0.759) < 0.001 && Math.abs(BE.childSpeedShare(14.5) - 0.899) < 0.001 && BE.childSpeedShare(18.2) === 1 && vk < 0.8 * vm)) { miss++; console.log(`MISS child speed: ${vk} vs ${vm}`); }
}
// N39: the breath held on going under depends on the water (Hayward et al. 1984): 19 s at 5 °C, 38 s at 25 °C; drawn people in
// warm water hold longer than in cold.
{
  const BE = await import('../src/rules/body-engine.js');
  const held = async (c, i) => { fresh(); ctx.chat[0].mes = `bh${c}-${i}`; await run('BodyWound', { who: 'Bo', part: 'upper body', type: 'blunt' });
    await run('BodyEnvironment', { who: 'Bo', water_c: c, immersed: ['submerged'], swimmer: false, air_c: 20 }); await run('PassTime', { minutes: 1, resting: ['Bo'] });
    return ctx.chatMetadata.rulesEngine.state.people.Bo.breathHold; };
  // 80 draws each: over 400, warm 38.9 ± 17.4 s and cold 19.0 ± 8.8 s per person, so the means differ by 19.8 ± 2.2 and the
  // bound of 8 sits 5.4 SD below, and 4.4 SD above a flat 24.3 s (with 12 draws it sat 2.1 SD below; with 40, one of 35
  // samples fell under it).
  let warm = 0, cold = 0; for (let i = 0; i < 80; i++) { warm += await held(25, i) / 80; cold += await held(5, i) / 80; }
  if (!(BE.breathHoldMeanS(5) === 19 && BE.breathHoldMeanS(25) === 38 && Math.abs(BE.breathHoldMeanS(11) - 24.8) < 0.01 && warm > cold + 8)) { miss++; console.log(`MISS breath hold by water: warm ${warm}, cold ${cold}`); }
}
// N40: a handgun shot hits by distance and target size: over the NYPD 2011 shooting distances 30 % hit (RAND 2008), fired
// upon 0.6 of that; BodyCheck takes shot_m without shares.
{
  const Fe = await import('../src/rules/feats.js');
  const avg = 0.53 * Fe.handgunHitChance(2.75) + 0.38 * Fe.handgunHitChance(9.6) + 0.09 * Fe.handgunHitChance(18.75);
  fresh(); await run('BodyWound', { who: 'Cop', part: 'upper body', type: 'blunt' });
  const out = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Cop', task: 'shoot the robber', shot_m: 3 }));
  if (!(Math.abs(avg - 0.30) < 0.005 && Math.abs(Fe.handgunHitChance(5, 80, true) / Fe.handgunHitChance(5) - 0.6) < 1e-9 && Fe.handgunHitChance(5, 120) > Fe.handgunHitChance(5, 60) && /SUCCESS|FAILURE/.test(out))) {
    miss++; console.log(`MISS handgun: ${avg} ${out}`); }
}
// N41 (logic): seeing someone across an open doorway takes the light on them: Tom walks in a fire-lit kitchen at night and Ann,
// in the dark hall beyond the open door, sees him (the old code took the hall's dark).
{
  const Z = await import('../src/rules/zone.js');
  const minOf = (y, mo, d, h = 0) => { const x = new Date(0); x.setUTCFullYear(y, mo - 1, d); return (x.getTime() - Z.MS_YEAR1) / 60000 + h * 60; };
  let seenN = 0;
  for (let i = 0; i < 5; i++) {
    fresh(); ctx.chat[0].mes = `lt${i}`; T.setStoryTime(minOf(1890, 1, 15, 23)); T.setScenePosition?.(52, 0);
    await run('Layout', { spots: [{ spot: 'stove', x_m: 1, y_m: 2, room: 'kitchen' }, { spot: 'kdoor', x_m: 3.5, y_m: 2, room: 'kitchen' }, { spot: 'bench', x_m: 6, y_m: 2, room: 'hall' }],
      rooms: [{ room: 'kitchen', corners: [[0, 0], [4, 0], [4, 4], [0, 4]] }, { room: 'hall', corners: [[4, 0], [8, 0], [8, 4], [4, 4]] }] });
    await run('Room', { room: 'kitchen', height_m: 2.5, fires: [{ fuel: 'wood', kg_per_hour: 2 }], doorways: [{ room: 'hall' }] });
    await run('Room', { room: 'hall', height_m: 2.5, doorways: [{ room: 'kitchen' }] });
    await run('BodyWound', { who: 'Ann', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Tom', part: 'upper body', type: 'blunt' });
    await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Ann', steps: [{ do: 'be_at', to: 'bench' }] });
    await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Tom', steps: [{ do: 'be_at', to: 'stove' }] });
    ctx.chat[0].mes = `lw${i}`;
    if (/Ann[^;]*sees Tom/.test(String(await run('Act', { level: 'on the level, stairs or a change of posture', who: 'Tom', steps: [{ do: 'walk_to', to: 'kdoor' }] })))) seenN++;
  }
  if (seenN < 4) { miss++; console.log(`MISS light on the one seen: ${seenN}/5`); }
}
// N42: who judges and who speaks (Bond & DePaulo 2006): a listener who has heard the speaker before catches lies 1.8 points
// more and believes truths 1.8 more; an expert believes 3.4 points less; a speaker with much at stake 3.8 less. Communicate
// records the acquaintance.
{
  const So = await import('../src/rules/social.js');
  const ch = (lie, o) => So.judgeStatement(lie, () => 0.5, { gauss: () => 0, ...o }).chance;
  const ok = Math.abs(ch(true, { knows: true }) - ch(true, {}) - 0.01825) < 1e-6 && Math.abs(ch(false, {}) - ch(false, { knows: true }) - 0.01825) < 1e-6
    && Math.abs(ch(false, { expert: true }) - ch(false, {}) - 0.0341) < 1e-6 && Math.abs(ch(true, { stakes: true }) - ch(true, {}) - 0.0381) < 1e-6;
  fresh(); await run('BodyWound', { who: 'Mo', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Lu', part: 'upper body', type: 'blunt' });
  await run('Communicate', { speaker: 'Mo', listener: 'Lu', means: 'speech', distance_m: 1, message: 'the cart is ready' });
  const acq = ctx.chatMetadata.rulesEngine.state.acquainted?.['lu|mo'];
  if (!(ok && acq)) { miss++; console.log(`MISS lie judgment moderators: ${ok} ${acq}`); }
}
// N43: a figure against its background (Weber contrast of reflectances): grey or khaki against woodland is nearly invisible,
// dark clothes on the skyline keep contrast 1; a longer look gives more tries (one per 6 s).
{
  const V = await import('../src/rules/vision.js');
  const camo = V.figureContrast('mid-tone clothes (grey, khaki, red, blue)', 'woodland or crops'), sky = V.figureContrast('dark clothes or coat (black, navy, brown)', 'the sky (on the skyline)');
  const a = V.see({ size: 0.5, distance: 300, light: 'daylight', contrast: camo }).detect, b = V.see({ size: 0.5, distance: 300, light: 'daylight', contrast: sky }).detect;
  const g1 = V.see({ size: 0.5, distance: 1500, light: 'daylight' }).detect, g10 = V.see({ size: 0.5, distance: 1500, light: 'daylight', seconds: 60 }).detect;
  fresh(); await run('BodyWound', { who: 'Ga', part: 'upper body', type: 'blunt' });
  const out = String(await run('Look', { viewer: 'Ga', kind: 'a person', distance_m: 200, light: 'overcast day', dressed: 'dark clothes or coat (black, navy, brown)', against: 'fresh snow', seconds: 60 }));
  const sunny = V.figureContrast('mid-tone clothes (grey, khaki, red, blue)', 'woodland or crops', V.diffuseShare(1));
  if (!(camo < 0.05 && sunny > 0.7 && Math.abs(V.diffuseShare(1) - 0.183) < 0.002 && Math.abs(sky - 0.969) < 0.01 && a < b && g10 > g1 && /against fresh snow, contrast 0\.96/.test(out) && /60 s of looking/.test(out))) { miss++; console.log(`MISS figure contrast: ${camo} ${sky} ${a} ${b} ${g1} ${g10} ${out}`); }
}
// N44: heat and cold of the room on alertness tasks (Pilcher et al. 2002): WBGT 32.2 °C or more × e^(1.81 × 0.382); 10 °C or
// less, lightly dressed, × e^(1.81 × 0.356); warmly dressed in the cold, none; a mild room, none.
{
  const BE = await import('../src/rules/body-engine.js');
  const at = (tdb, rh, clo) => BE.climateRisk({ env: { tdb, rh, clo: Array(17).fill(clo), water: null } });
  const ok = Math.abs(at(38, 40, 0.5) - Math.exp(1.81 * 0.382)) < 1e-9 && Math.abs(at(5, 50, 0.5) - Math.exp(1.81 * 0.356)) < 1e-9
    && at(5, 50, 2) === 1 && at(21, 50, 0.6) === 1 && Math.abs(at(15, 50, 0.5) - Math.exp(1.81 * 0.197)) < 1e-9;
  if (!ok) { miss++; console.log(`MISS heat and cold on tasks: ${at(38, 40, 0.5)} ${at(5, 50, 0.5)} ${at(5, 50, 2)} ${at(21, 50, 0.6)}`); }
}
// N45: the students behind the problem norms stood 0.41 SD (2003) and 0.24 SD (2016) above everyone (Uttl et al. 2024): a
// character of that ability solves at the norm's own rate.
{
  const Th = await import('../src/rules/thinking.js');
  const kind = 'a step-by-step problem (logic, a sum, a plan)', z = Th.studentZ(kind);
  const seen = [], dbg = console.debug; console.debug = (...x) => { seen.push(x.join(' ')); };
  fresh(); await run('BodyWound', { who: 'Sol', part: 'upper body', type: 'blunt' }); ctx.chatMetadata.rulesEngine.state.people.Sol.gZ = z;
  await run('WorkOut', { who: 'Sol', problem: 'the ledger', kind, seconds: 60 });
  console.debug = dbg;
  const l = seen.find(x => /work out the ledger chance/.test(x)), c = l ? Number(l.match(/chance ([\d.]+) %/)[1]) / 100 : NaN;
  if (!(Math.abs(Th.studentZ('a link between clues (one word or idea that fits them all)') - 0.411) < 0.002 && Math.abs(z - 0.245) < 0.002 && Math.abs(c - Th.solveShare(kind, 60)) < 0.002)) {
    miss++; console.log(`MISS students among people: ${z}, chance ${c} vs ${Th.solveShare(kind, 60)}`); }
}
// N46: a drink reaches the blood over the next hour (Jones 1991): 40 g on an empty stomach peaks after about 45 min, with a
// meal earlier and about a quarter lower; the status says how much is still to come.
{
  const curve = async meal => {
    fresh(); await run('BodyWound', { who: 'Al', part: 'upper body', type: 'blunt' });
    Object.assign(ctx.chatMetadata.rulesEngine.state.people.Al, { sex: 'male', age: 30, heightCm: 175, mass: 75 });
    await run('BodyIntake', { who: 'Al', alcohol_g: 40, ...(meal ? { food_kcal: 600 } : {}) });
    const first = ctx.chatMetadata.rulesEngine.state.people.Al.needs.alcohol ?? 0, early = String(await run('BodyStatus', { who: 'Al' }));
    let peak = 0, at = 0;
    for (let m = 1; m <= 75; m++) { ctx.chat[0].mes = `alc${meal}${m}`; await run('PassTime', { minutes: 1, resting: ['Al'] }); const b = ctx.chatMetadata.rulesEngine.state.people.Al.needs.alcohol ?? 0; if (b > peak) { peak = b; at = m; } }
    return { first, peak, at, early };
  };
  const f = await curve(false), m = await curve(true);
  if (!(f.first === 0 && /rising: [\d.]+ % more still being absorbed/.test(f.early) && f.at >= 38 && f.at <= 55 && m.at < f.at && Math.abs(m.peak / f.peak - 0.75) < 0.05)) {
    miss++; console.log(`MISS alcohol absorption: ${JSON.stringify({ f: { ...f, early: undefined }, m: { ...m, early: undefined } })}`); }
}
// N47: who can swim, by sex and region (World Risk Poll 2019 × the US skills ratio 0.56): a woman in the world at large 18 %,
// a man in Sweden 50 %, the US 46 %.
{
  const BE = await import('../src/rules/body-engine.js');
  const ok = Math.abs(BE.swimShare('female', 'Kenya') - 0.56 * 0.32) < 1e-9 && Math.abs(BE.swimShare('male', 'Sweden') - 0.56 * 0.89) < 1e-9
    && BE.swimShare('female', 'United States') === 0.46 && Math.abs(BE.swimShare('female', 'Brazil') - 0.56 * 0.33) < 1e-9;
  // 120 women: 17.3 % swim over 400 draws, 20.7 ± 4.1 of 120; the bound of 38 sits 4.1 SD above, and 3.2 SD below the 55 of
  // the old flat 46 % (with 60 and a bound of 18 it missed about one run in 140).
  let swimmers = 0;
  for (let i = 0; i < 120; i++) {
    fresh(); ctx.chat[0].mes = `sw${i}`; await run('BodyWound', { who: 'Wa', part: 'upper body', type: 'blunt' });
    const st = ctx.chatMetadata.rulesEngine.state; st.people.Wa.sex = 'female'; st.setting = { ...(st.setting ?? {}), country: 'Kenya' };
    await run('BodyEnvironment', { who: ['Wa'], water_c: 24, immersed: ['whole body'], air_c: 25 });
    if (st.people.Wa.canSwim) swimmers++;
  }
  if (!(ok && swimmers < 38)) { miss++; console.log(`MISS swim shares: ${ok}, ${swimmers}/120 Kenyan women swim`); }
}
// N48: the crowd draws from a stream of its own seeded by one draw, so a call's trace keeps one number for the crowd rather
// than two per person per 4 ms step (2.9 million for 100 people leaving, 56 MB in the chat's metadata).
{
  const Cr = await import('../src/rules/crowd.js');
  let n = 0; Cr.evacuate(20, 30, 1, 1, () => (n++, 0.5), 5);
  fresh();
  await run('Room', { room: 'hall', floor_m2: 60, height_m: 3, people: 30, exit_width_m: 1 });
  const kept = ctx.chatMetadata.rulesEngine.history.log.at(-1).draws.length;
  if (!(n === 1 && kept < 100 && T.LAST_DRAWS.length < 100)) { miss++; console.log(`MISS crowd trace: ${n} draws taken from the call, ${kept} kept`); }
}
// N49: a crowd counts a judged value as used only once it can change the run: the averaging time from the first pressure past
// 1600 N/m, the asphyxia values once a dose could kill at some value in their ranges. A calm crowd then rests on none (and is
// not rerun over them), a deadly one on all, and the values a run did not count give the identical run at their range ends.
{
  const Cr = await import('../src/rules/crowd.js'), K = await import('../src/rules/constants.js');
  const ids = ['asphyxiaPow', 'asphyxiaFloorN', 'crushAvgS'];
  K.resetUsed(); const calm = JSON.stringify(Cr.evacuate(60, 100, 1, 0.8, 0.1, 30)); const calmUsed = ids.filter(id => K.USED.has(id));
  const same = [];
  for (const id of ids) for (const e of K.REGISTRY_K.get(id).range) same.push(JSON.stringify(await K.withOverride(id, e, () => Cr.evacuate(60, 100, 1, 0.8, 0.1, 30))) === calm);
  K.resetUsed(); const deadly = Cr.evacuate(60, 15, 0.5, 5, 0.37, 120); const deadlyUsed = ids.filter(id => K.USED.has(id));
  if (!(calmUsed.length === 0 && same.every(Boolean) && deadly.dead > 0 && deadlyUsed.length === 3)) {
    miss++; console.log(`MISS crowd reads: calm used ${calmUsed}, same at the ends ${same}, deadly ${deadly.dead} dead used ${deadlyUsed}`); }
}
// N50: the memo gives a result back when the constants it read hold their values, and computes afresh when one of them is
// varied; varying a constant it did not read gives the kept result.
{
  const K = await import('../src/rules/constants.js');
  let calls = 0; const f = () => { calls++; return K.k('crushAvgS') * 2; };
  const a = K.memo('test|1', f), b = K.memo('test|1', f), c = await K.withOverride('crushAvgS', 3, () => K.memo('test|1', f)), d = await K.withOverride('asphyxiaPow', 1.9, () => K.memo('test|1', f));
  if (!(a === 2 && b === 2 && c === 6 && d === 2 && calls === 2)) { miss++; console.log(`MISS memo: ${a} ${b} ${c} ${d}, ${calls} computations`); }
}
// N51: every odds factor in the one list (ODDS_FACTORS) acts: set up alone, each lowers the chance of a task it applies to
// and is named in the result; a factor with no set-up here is a miss, so a new factor comes with its check.
{
  const BE = await import('../src/rules/body-engine.js');
  const needs = extra => ({ waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null, ...extra });
  const SETUP = {
    impairment: [p => { p.needs = needs({ alcohol: 0.08 }); }, ['alertness'], false, /impaired alertness/],
    concussion: [p => { p.concussedMin = 10; }, ['alertness'], false, /after a concussion/],
    work: [p => { p.needs = needs({ onTask: 120, duty: 720 }); }, ['alertness'], false, /hours on the task/],
    'thirst-attention': [p => { p.needs = needs({ waterL: p.mass * 0.03 }); }, ['alertness'], false, /dehydration/],
    'thirst-motor': [p => { p.needs = needs({ waterL: p.mass * 0.03 }); }, ['grasp'], true, /dehydration/],
    climate: [p => { p.env = { tdb: 38, rh: 40, clo: Array(17).fill(0.5), water: null }; }, ['alertness'], false, /the heat/],
  };
  const bad = [];
  for (const f of BE.ODDS_FACTORS) {
    const set = SETUP[f.id]; if (!set) { bad.push(`${f.id}: no set-up`); continue; }
    fresh(); await run('BodyWound', { who: 'Ny', part: 'left foot', type: 'blunt' });
    const p = ctx.chatMetadata.rulesEngine.state.people.Ny, task = { share: 0.6, uses: set[1], fine: set[2] };
    p.needs = needs({}); delete p.concussedMin; delete p.env; p.clockMin = 12 * 60;
    const before = BE.checkOdds(p, task); set[0](p); const after = BE.checkOdds(p, task);
    if (!(f.applies(set[1], set[2]) && f.risk(p) > f.shows && after.chance < before.chance - 0.01 && set[3].test(after.limit ?? ''))) bad.push(`${f.id}: ${before.chance} → ${after.chance} (${after.limit})`);
  }
  if (bad.length) { miss++; console.log(`MISS odds factors: ${bad.join('; ')}`); }
}
// N52: a trade word that names the sex fixes it (a maidservant is a woman, a potman a man); the census's domestic servants
// include men, so the trade's share alone drew a man for a maidservant about one time in twelve.
{
  const drawn = async (job, n) => { const out = []; for (let i = 0; i < n; i++) { fresh(); ctx.chat[0].mes = `${job} ${i}`; out.push(/\b(woman|girl)\b/.test(String(await run('NewCharacter', { who: `the ${job}`, occupation: job }))) ? 'f' : 'm'); } return out.join(''); };
  const maids = await drawn('maidservant', 20), potmen = await drawn('potman', 20);
  if (!(/^f+$/.test(maids) && /^m+$/.test(potmen))) { miss++; console.log(`MISS trade word sex: maidservants ${maids}, potmen ${potmen}`); }
}
// N53: every judged constant carries a range that holds its value, so the sensitivity reruns can vary it.
{
  const K = await import('../src/rules/constants.js');
  for (const f of ['crowd', 'feats', 'social', 'vision', 'body-engine', 'rooms', 'sky', 'acoustics', 'actions', 'drugs', 'knowledge', 'map', 'materials', 'work']) await import(`../src/rules/${f}.js`);
  const bad = [...K.REGISTRY_K.values()].filter(c => (c.status !== 'sourced' && !c.range) || (c.range && !(c.range[0] < c.range[1] && c.range[0] <= c.value && c.value <= c.range[1]))).map(c => c.id);
  if (bad.length || K.REGISTRY_K.size < 99) { miss++; console.log(`MISS constant ranges: ${bad.join(', ')} (${K.REGISTRY_K.size} constants)`); }
}
// N54: the judged values registered in this pass reach the code: each, set to an end of its range, changes what it feeds.
{
  const K = await import('../src/rules/constants.js'), BE = await import('../src/rules/body-engine.js'), Fe = await import('../src/rules/feats.js');
  const So = await import('../src/rules/social.js'), Cr = await import('../src/rules/crowd.js');
  const meal = () => { const p = { mass: 70, needs: { waterL: 0, kcal: 0, awake: 0, slept: 0, waterDeath: null, foodDeath: null } }; BE.intake(p, { food_kcal: 150 }); return p.needs.sinceMeal ?? null; };
  const PROBE = {
    workDoublingMin: [90, () => BE.workRisk({ needs: { onTask: 60 } })],
    thirstOnsetPct: [0.5, () => BE.thirstRisk({ mass: 70, needs: { waterL: 0.56 } }, 'attention')],
    mealKcal: [100, meal],
    swimSkillsShare: [0.75, () => BE.swimShare('male', 'France')],
    tryCv: [0.08, () => Fe.featChance(1, 0.95)],
    liftGripR: [0.8, () => Fe.liftCapacityKg({ sex: 'male', age: 30, gripZ: 1, liftZ: 0 })],
    conformAlmostNone: [0.05, () => So.conformShare(1, false, 'male', 1951)],
    jostleN: [80, () => JSON.stringify(Cr.evacuate(20, 30, 1, 1, 0.2, 8))],
  };
  const dead = [];
  for (const [id, [end, f]] of Object.entries(PROBE)) { const a = JSON.stringify(f()), b = JSON.stringify(await K.withOverride(id, end, f)); if (a === b) dead.push(id); }
  if (dead.length) { miss++; console.log(`MISS registered values reach the code: ${dead.join(', ')}`); }
}
// N55: a sight task goes to Look whatever verb of seeing names it (VerbNet's perception classes, verbs.ts): six that the
// nine-word list let run on the narrator's share, an inflected one and one after "try to"; tasks whose own verb is another
// act (climb, check, smell, pick a lock and then look) stay BodyCheck's.
{
  const sight = ['watch the guard on the wall', 'observe the guard on the wall', 'glimpse the guard on the wall', 'discern the guard on the wall', 'make out the guard on the wall', 'espy the guard on the wall', 'watching the road', 'try to glimpse the rider'];
  const other = ['climb the wall', 'check the lock', 'smell the stew', 'pick the lock and look inside'];
  const sent = async task => { fresh(); ctx.chat[0].mes = task; return /decided by Look/.test(String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Ana', task, reference_class: 'people', base_share: '50% half', share: '50% half' }))); };
  const leak = [], kept = [];
  for (const t of sight) if (!(await sent(t))) leak.push(t);
  for (const t of other) if (await sent(t)) kept.push(t);
  if (leak.length || kept.length) { miss++; console.log(`MISS sight verbs routed: ran on the share: ${leak.join('; ') || '—'}; sent to Look: ${kept.join('; ') || '—'}`); }
}
// N56: every BodyCheck task goes where its own verb's present-day meaning sends it (verbs.ts, TASK_ROUTES from VerbNet): 101
// phrasings, the synonyms and inflections the word lists let run on the narrator's share (listening, overheard, swam, clinging,
// fled, lied about, fool, punch, stab, bandage, court, besiege, search…) and the other senses of the same words that stay
// BodyCheck's (lie down, bolt the door, a shot of whisky, date the letter, kick the door open, hang the lantern, shoot the
// rapids, climb the wall to see over it).
{
  const CASES = [
    ['hear the patrol coming', 'Listen'], ['listening at the door', 'Listen'], ['overheard the plotters', 'Listen'], ['eavesdrop on the officers', 'Listen'], ['catch what the clerk whispers', 'Listen'],
    ['swim across the river', 'BodyEnvironment'], ['swimming to the boat', 'BodyEnvironment'], ['swam to shore', 'BodyEnvironment'], ['tread water until help comes', 'BodyEnvironment'], ['keep afloat in the current', 'BodyEnvironment'],
    ['hang from the ledge', 'HoldOn'], ['hung from the rope', 'HoldOn'], ['cling to the branch', 'HoldOn'], ['clinging to the cliff', 'HoldOn'], ['dangle from the gutter', 'HoldOn'], ['carry the sack to the cart', 'HoldOn'], ['carrying the wounded man', 'HoldOn'], ['haul the chest upstairs', 'HoldOn'], ['lug the barrel', 'HoldOn'], ['grip the rope', 'HoldOn'], ['clutch the railing', 'HoldOn'],
    ['chase the thief', 'Chase'], ['chasing the boy', 'Chase'], ['pursue the rider on foot', 'Chase'], ['flee from the soldiers', 'Chase'], ['fled down the alley', 'Chase'], ['outrun the dogs', 'Chase'], ['run away from the guard', 'Chase'], ['catch up with the thief', 'Chase'],
    ['lie to the guard', 'SocialResponse'], ['lied about the money', 'SocialResponse'], ['deceive the magistrate', 'SocialResponse'], ['mislead the inspector', 'SocialResponse'], ['fool the sentry', 'SocialResponse'], ['trick the innkeeper', 'SocialResponse'], ['bluff the card players', 'SocialResponse'], ['con the merchant', 'SocialResponse'],
    ['shoot the fleeing man', 'BodyStrike'], ['fire at the sentry', 'BodyStrike'], ['loose an arrow at the deer', 'BodyStrike'], ['aim at the lamp', 'BodyStrike'],
    ['punch the guard', 'BodyStrike'], ['stab the smuggler', 'BodyStrike'], ['hit the man with a club', 'BodyStrike'], ['attack the guard', 'BodyStrike'], ['kick the dog', 'BodyStrike'], ['slash at the bandit', 'BodyStrike'],
    ['stop the bleeding', 'BodyTreat'], ['bandage the wound', 'BodyTreat'], ['stanch the wound', 'BodyTreat'], ['stitch the cut', 'BodyTreat'], ['splint the leg', 'BodyTreat'],
    ['court the widow', 'SocialResponse'], ['flirt with the barmaid', 'SocialResponse'], ['woo the miller\'s daughter', 'SocialResponse'], ['seduce the clerk', 'SocialResponse'],
    ['storm the fort', 'Battle'], ['assault the redoubt', 'Battle'], ['besiege the town', 'Battle'], ['take the bridge', 'Battle'],
    ['search the room for the key', 'Look'], ['comb the field for the ring', 'Look'], ['scour the shelves', 'Look'], ['rummage through the drawer', 'Look'],
    ['lie down on the bed', 'BodyCheck'], ['lie still in the ditch', 'BodyCheck'], ['bolt the door', 'BodyCheck'], ['drink a shot of whisky', 'BodyCheck'], ['date the letter', 'BodyCheck'], ['hold the door shut', 'BodyCheck'],
    ['pick the lock', 'BodyCheck'], ['climb the wall', 'BodyCheck'], ['follow the instructions', 'BodyCheck'], ['escape the burning house', 'BodyCheck'], ['ride the horse', 'BodyCheck'], ['take the coin from the table', 'BodyCheck'],
    ['assault the guard', 'BodyStrike'],
    ['tap the guard on the shoulder', 'BodyCheck'], ['kick the door open', 'BodyCheck'], ['cut the rope', 'BodyCheck'], ['set the table', 'BodyCheck'], ['hold your breath', 'BodyCheck'],
    ['climb the wall to see over it', 'BodyCheck'], ['hang the lantern on the hook', 'BodyCheck'], ['run to the gate', 'BodyCheck'], ['fire the kiln', 'BodyCheck'], ['shoot the rapids', 'BodyCheck'],
    ['fire the musket at the rider', 'BodyStrike'], ['loose an arrow', 'BodyStrike'], ['set the broken arm', 'BodyTreat'], ['choke the sentry', 'BodyChoke'], ['strangle him', 'BodyChoke'],
    ['coax the guard into opening the gate', 'SocialResponse'], ['persuade the clerk to let them in', 'SocialResponse'], ['sweet-talk the jailer', 'SocialResponse'], ['ask her out', 'SocialResponse'],
    ['stab Ana', 'BodyStrike'], ['tries to punch the smuggler', 'BodyStrike'], ['Ana kicks the hound', 'BodyStrike'], ['make out what the clerk says', 'Listen'], ['go through the papers', 'Look'],
  ];
  const wrong = [];
  for (const [task, want] of CASES) {
    fresh(); ctx.chat[0].mes = task;
    const out = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Ana', task, reference_class: 'people', base_share: '50% half', share: '50% half' }));
    const to = /decided by ([A-Za-z]+)/.exec(out)?.[1] ?? 'BodyCheck';
    if (to !== want) wrong.push(`${task} → ${to} (${want})`);
  }
  if (wrong.length) { miss++; console.log(`MISS task routes: ${wrong.length} of ${CASES.length}: ${wrong.join('; ')}`); }
}
// N58: an activity no word list names takes its row from its verb's VerbNet class (mood.ts): devouring and munching are
// eating, frying is preparing food, scrubbing and mopping housework, conversing socializing, dozing relaxing; reading none.
{
  const Mo = await import('../src/rules/mood.js');
  const want = { 'devouring a stew': 'eating', 'munching bread by the fire': 'eating', 'frying fish': 'preparing food', 'scrubbing the floor': 'housework', 'mopping the hall': 'housework', 'conversing with the vicar': 'socializing', 'dozing in the chair': 'relaxing', 'reading a book': null };
  const bad = Object.entries(want).filter(([t, l]) => (Mo.drmRow(t)?.label ?? null) !== l).map(([t, l]) => `${t}: ${Mo.drmRow(t)?.label ?? null} (${l})`);
  if (bad.length) { miss++; console.log(`MISS activity by verb class: ${bad.join('; ')}`); }
}
// N59: the caller names what a BodyCheck task is from a closed list (task_kind, required), read against the task's verb: a named
// route goes to its tool; a kind and a verb that disagree are refused with both readings; BodyCheck's own kind with a verb of
// its own runs; the list's order changes from one generation to the next, its contents stay.
{
  const V = await import('../src/rules/verbs.js');
  const bc = async (task, task_kind) => { fresh(); ctx.chat[0].mes = task; return String(await run('BodyCheck', { who: 'Ana', task, ...task_kind ? { task_kind } : {}, reference_class: 'people', base_share: '50% half', share: '50% half' })); };
  const named = await bc('climb the wall', 'seeing or searching for something or someone');
  const clash = await bc('punch the guard', 'seeing or searching for something or someone');
  const own = await bc('climb the wall', V.OWN_KIND);
  const none = await bc('climb the wall', null);
  const orders = new Set(); for (let i = 0; i < 6; i++) { T.onRulesGenerationStarted?.('normal'); orders.add(V.TASK_KINDS.join('|')); }
  const sameSet = [...orders].every(o => o.split('|').sort().join('|') === [...V.TASK_KINDS].sort().join('|'));
  const req = T.REGISTRY.get('BodyCheck').required.includes('task_kind');
  if (!(/decided by Look/.test(named) && /reads as BodyStrike/.test(clash) && /you named it seeing/.test(clash) && /^climb the wall: (SUCCESS|FAILURE)/.test(own) && /fix and call again/.test(none) && orders.size > 1 && sameSet && req)) {
    miss++; console.log(`MISS task kind: ${named} | ${clash} | ${own} | ${none} | ${orders.size} orders, same set ${sameSet}, required ${req}`); }
}
// N60: a choice the player's line leaves open goes to the player (ask.ts): "him" with two men in the scene; the planner wrote
// Will, the player picked Tom, and Tom stands on the blow, in the reading shown back and in the note the planner read.
// Closing the question stops the turn (nothing runs, the line can be said otherwise).
{
  const Q = await import('../src/rules/question-pass.js');
  const setup = async () => { fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
    ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar, arguing over the dice.' }, { is_user: true, mes: 'I hit him.' }]; };
  const prompts = [], send = async (sys, user) => { prompts.push(user); return JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Will', attack: 'punch' } }] }); };
  let asked = null;
  await setup(); await Q.runQuestionPass(ctx.chat, send, '', undefined, async (q, opts) => { asked = { q, opts }; return opts.find(o => /Tom/.test(o)); });
  const strike = ctx.chatMetadata.rulesEngine.asked?.calls?.find(c => c.tool === 'BodyStrike');
  const read = Q.actionsRead().join(' | ');
  const noted = prompts.some(p => /THE PLAYER'S CHOICE[\s\S]*Tom/.test(p));
  await setup(); const before = ctx.chatMetadata.rulesEngine?.asked;
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const stopped = Q.rephraseAsked() && ctx.chatMetadata.rulesEngine?.asked === before;
  ctx.name1 = undefined;
  if (!(asked && asked.opts.length === 2 && asked.opts.every(o => /^Hit (Tom|Will)$/.test(o)) && strike?.args.who === 'Tom' && /Jack strikes at Tom/.test(read) && noted && stopped)) {
    miss++; console.log(`MISS asking the player: ${JSON.stringify(asked)} → ${JSON.stringify(strike?.args)}; read "${read}"; noted ${noted}; stopped ${stopped}`); }
}
// N61: what is asked and what is not (ask.ts): "follow the thief" (a chase, out of sight, or openly), "take the bridge" (a fight
// or going onto it); not when the line settles it ("storm the bridge with our men", "follow him quietly", "walk up to the
// first sailor and hit him", "I punch Tom", "her" with one woman present). Options share one form and come in a fresh order.
{
  const A = await import('../src/rules/ask.js');
  const has = () => true, ppl = [{ name: 'the first sailor', sex: null }, { name: 'the second sailor', sex: null }, { name: 'Ann', sex: 'female' }];
  const q = (t, r = Math.random) => A.openQuestion(t, 'Jack', ppl, has, r);
  const follow = q('I follow the thief through the market.'), bridge = q('I take the bridge.'), him = q('I hit him.');
  const none = ['We storm the bridge with our men.', 'I follow him quietly.', 'I walk up to the first sailor and hit him.', 'I punch Tom.', 'I look at her.'].filter(t => q(t));
  let a = 0.1, b = 0.9; const o1 = q('I hit him.', () => (a = (a * 7) % 1)).options.map(o => o.label).join('|'), o2 = q('I hit him.', () => (b = (b * 3.3) % 1)).options.map(o => o.label).join('|');
  const tools = follow?.options.map(o => o.fix.require).sort().join();
  if (!(tools === 'Act,Chase,Look' && follow.options.every(o => /the thief/.test(o.label)) && bridge?.options.map(o => o.fix.require).sort().join() === 'Act,Battle' && him?.options.length === 2 && none.length === 0 && o1.split('|').sort().join() === o2.split('|').sort().join())) {
    miss++; console.log(`MISS what is asked: ${tools}; ${JSON.stringify(bridge?.options.map(o => o.label))}; ${JSON.stringify(him?.options.map(o => o.label))}; asked anyway: ${none.join('; ')}`); }
}
// N62: the reading shown back (reading.ts): one line per call the player's character makes, the tool's question in plain words.
{
  const R = await import('../src/rules/reading.js');
  const calls = [{ tool: 'Look', args: { viewer: 'Ann', target: 'the rider', distance_m: 40 } }, { tool: 'BodyStrike', args: { attacker: 'Tom', who: 'Ann' } },
    { tool: 'Communicate', args: { speaker: 'Ann', listener: 'the guard', effort: 'whisper', message: 'Open the gate' } }, { tool: 'PassTime', args: { minutes: 10, resting: ['Ann'] } }];
  const lines = R.readingLines(calls, 'Ann');
  const want = ['Ann looks at the rider, 40 m away', 'Ann whispers to the guard: "Open the gate"', '10 minutes pass'];
  if (JSON.stringify(lines) !== JSON.stringify(want)) { miss++; console.log(`MISS reading shown back: ${JSON.stringify(lines)}`); }
}
// N63: ask only when it pays (ask.ts decide): the likeliest reading is taken when its share of the weight passes 0.5, or 0.9
// when a reading harms someone; else the player is asked. Tom named last by the narrator outweighs Will named earlier: a
// look at "him" takes Tom, a blow at "him" asks. A bridge in a quiet scene is walked onto; with soldiers holding it, asked.
// The thief who bolts is chased; one who strolls is walked after. A bare "I strike" with two men by asks.
{
  const A = await import('../src/rules/ask.js');
  const has = () => true, men = [{ name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }];
  const cues = n => ({ narration: n, lastTargets: [] });
  const d = (t, n) => A.decide(t, 'Jack', men, has, cues(n));
  const said = ['Will waits by the door.', 'Tom leans on the bar.'];
  const look = d('I look at him.', said), hit = d('I hit him.', said);
  const quiet = d('I take the bridge.', ['The river runs slow under the bridge.']), held = d('I take the bridge.', ['Soldiers hold the bridge.']);
  const bolts = d('I follow the thief.', ['The thief bolts into the crowd.']), strolls = d('I follow the thief.', ['The thief strolls down the lane.']);
  const bare = d('I strike!', said);
  const took = x => x && 'take' in x ? x.take.label : x && 'ask' in x ? 'ask' : null;
  const got = { look: took(look), hit: took(hit), quiet: took(quiet), held: took(held), bolts: took(bolts), strolls: took(strolls), bare: took(bare) };
  const want = { look: 'Look at Tom', hit: 'ask', quiet: 'Go onto the bridge and stand there', held: 'ask', bolts: 'Catch up with the thief', strolls: 'Walk after the thief in the open', bare: 'ask' };
  if (JSON.stringify(got) !== JSON.stringify(want)) { miss++; console.log(`MISS when to ask: ${JSON.stringify(got)}`); }
}
// N64: a correction in the next line redoes the last turn (ask.ts correctionOf, question-pass.ts): "I hit him" was asked and
// Tom picked; "no, Will" puts the world back to before the blow, plans that line again with Will fixed, and tells the narrator
// the last reply's account did not happen. The record of changes holds the blow at Will only. "No! Get back!" is a line.
{
  const Q = await import('../src/rules/question-pass.js'), A = await import('../src/rules/ask.js');
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const send = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar, arguing over the dice.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async (q, opts) => opts.find(o => /Tom/.test(o)));
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack drives a fist at Tom.' });
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'no, Will' });
  let askedAgain = false;
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => { askedAgain = true; return null; });
  const st = ctx.chatMetadata.rulesEngine, blows = (st.history?.log ?? []).filter(e => e.tool === 'BodyStrike').map(e => e.args.who);
  const strike = st.asked?.calls?.find(c => c.tool === 'BodyStrike');
  const told = Q.decidedInjection();
  ctx.name1 = undefined;
  const plainLine = A.correctionOf('No! Get back!') !== null && A.correctionFix(A.correctionOf('No! Get back!'), 'I hit him.', 'Jack', [{ name: 'Tom' }, { name: 'Will' }], [], () => true) === null;
  if (!(strike?.args.who === 'Will' && JSON.stringify(blows) === '["Will"]' && !askedAgain && /it meant Will/.test(Q.redoneBy() ?? '') && /did not happen/.test(told) && plainLine)) {
    miss++; console.log(`MISS correction redoes the turn: ${JSON.stringify(strike?.args)}; blows ${JSON.stringify(blows)}; asked again ${askedAgain}; ${Q.redoneBy()}; ${told.slice(0, 160)}; plain line ${plainLine}`); }
}
// N65: FrameNet 1.7 frames route what VerbNet's classes leave out (verbs.ts FRAME_ROUTES): verbs it lacks (befriend, elude,
// smother, spear, bayonet, resuscitate, invade), the noun a light verb carries ("take a look", "steal a glance", "throw a
// punch", "take aim"), a noun opening the task ("a quick glance at the window"); climbing verbs stay BodyCheck's (clamber,
// scramble), as do light verbs whose noun names no tool's act ("take a nap", "take a step back"). Each route's frame elements
// are FrameNet's own.
{
  const V = await import('../src/rules/verbs.js'), R = await import('../src/rules/router.js');
  const want = { 'take a look at the gate': 'Look', 'steal a glance at the letter': 'Look', 'a quick glance at the window': 'Look', 'give the room a once-over': 'Look',
    'have a peek through the keyhole': 'Look', 'get a glimpse of the rider': 'Look', 'befriend the clerk': 'SocialResponse', 'elude the guards': 'Chase', 'dog the thief through the streets': 'Chase',
    'smother the sentry': 'BodyChoke', 'spear the boar': 'BodyStrike', 'bayonet the sentry': 'BodyStrike', 'throw a punch at the smuggler': 'BodyStrike', 'take a swing at the guard': 'BodyStrike',
    'take aim at the deer': 'BodyStrike', 'resuscitate the drowned boy': 'BodyTreat', 'invade the village': 'Battle', 'fight for the bridge': 'Battle', 'fight the guard': 'BodyStrike',
    'clamber up the wall': null, 'scramble over the fence': null, 'take a nap': null, 'take a step back': null, 'bolt the door': null,
    // Fire with a person or a thing heated as its object is no shot (verbs.ts notAShot); a shot of whiskey is a measure.
    'fire the cook': null, 'fire the kiln': null, 'fire the musket at the deer': 'BodyStrike', 'take a shot of whiskey': null };
  const got = Object.fromEntries(Object.keys(want).map(t => [t, V.taskRoute(t)?.to.split(' ')[0] ?? null]));
  const wrong = Object.keys(want).filter(t => got[t] !== want[t]).map(t => `${t} → ${got[t]} (${want[t]})`);
  const feBad = V.FRAME_ROUTES.flatMap(r => Object.keys(r.fe).filter(e => !(e in V.frameElements(r.frame))).map(e => `${r.frame}.${e}`));
  const line = R.routeTurn('I take a look around the room.', []).tools, climb = R.routeTurn('I clamber up the wall.', []).tools, elude = R.routeTurn('I elude the guards.', []).tools;
  if (wrong.length || feBad.length || !line.includes('Look') || line.includes('Transfer') || !climb.includes('BodyCheck') || !elude.includes('Chase')) {
    miss++; console.log(`MISS FrameNet routes: ${wrong.join('; ')}; elements not in FrameNet: ${feBad.join(', ')}; router ${line} / ${climb} / ${elude}`); }
}
// N66: a swipe of a turn a correction redid starts from the world as the correction left it (the undone blow at Tom stays
// undone) and tells the narrator again that the last account did not happen.
{
  const Q = await import('../src/rules/question-pass.js');
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const tom = () => JSON.stringify(ctx.chatMetadata.rulesEngine.state.people.Tom), tom0 = tom();
  const send = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar, arguing over the dice.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async (q, opts) => opts.find(o => /Tom/.test(o)));
  const struck = tom() !== tom0;
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack drives a fist at Tom.' });
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'no, Will' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack swings at Will instead.' });
  T.onRulesGenerationStarted('swipe');
  await Q.runQuestionPass(ctx.chat.slice(0, -1), send, '', undefined, async () => null);
  const back = tom() === tom0, told = /did not happen/.test(Q.decidedInjection()), redone = /it meant Will/.test(Q.redoneBy() ?? '');
  ctx.name1 = undefined;
  if (!(struck && back && told && redone)) { miss++; console.log(`MISS swipe of a corrected turn: struck ${struck}, Tom as before ${back}, told ${told}, redone ${redone}`); }
}
// N67: a reading taken unasked keeps the readings it passed over, for the note's "change" (src/ui.ts), on the turn and on a
// swipe of it; the change line, sent as the next line, redoes the turn with that reading fixed for the planner.
{
  const Q = await import('../src/rules/question-pass.js'), A = await import('../src/rules/ask.js');
  fresh(); ctx.name1 = 'Jack';
  const prompts = [], send = async (sys, user) => { prompts.push(user); return JSON.stringify({ calls: [{ tool: 'Act', args: { who: 'Jack', action: 'walks after the thief' } }] }); };
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'The thief strolls down the lane.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I follow the thief.' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const taken = Q.takenReading();
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack ambles after the thief.' });
  T.onRulesGenerationStarted('swipe');
  await Q.runQuestionPass(ctx.chat.slice(0, -1), send, '', undefined, async () => null);
  const kept = JSON.stringify(Q.takenReading()) === JSON.stringify(taken);
  const catchUp = taken?.others.find(o => /^Catch up/.test(o));
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: A.correctionLine(catchUp ?? '') });
  prompts.length = 0;
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const fixed = prompts.some(p => /THE PLAYER'S CHOICE[\s\S]*catch up with the thief/.test(p)) && /catch up with the thief/.test(Q.redoneBy() ?? '');
  ctx.name1 = undefined;
  const others = JSON.stringify([...taken?.others ?? []].sort());
  if (!(taken?.label === 'Walk after the thief in the open' && others === '["Catch up with the thief","Keep behind the thief, out of sight"]' && kept && fixed)) {
    miss++; console.log(`MISS taken reading and its change: ${JSON.stringify(taken)}; kept on swipe ${kept}; change redoes ${fixed} (${Q.redoneBy()})`); }
}
// N68: a feeling in the voice is heard right as often as listeners hear it (Juslin & Laukka 2003, Table 4, read among five
// feelings): happiness within one culture 62.6 %, across cultures (no shared language) 41.6 %; a voice not heard carries no
// feeling; a call without one says nothing of it.
{
  // Each call is its own turn (a call repeated within a turn returns the first result).
  let turnNo = 0; const say = async args => { ctx.chat.push({ is_user: true, mes: `turn ${++turnNo}` }); return String(await run('Communicate', args)); };
  const rate = async (who, args, n = 1500) => { let right = 0, any = 0; for (let i = 0; i < n; i++) { const r = String(await say( { speaker: who[0], listener: who[1], voice_feeling: 'happiness', ...args })); if (/in the voice \S+ hears happiness\./.test(r)) right++; if (/in the voice/.test(r)) any++; } return { right: right / n, any: any / n }; };
  fresh(); for (const who of ['Ann', 'Tom', 'Bea', 'Carl']) await run('NewCharacter', { who, sex: 'female', age: 30 });
  const same = await rate(['Ann', 'Tom'], {});
  await say({ speaker: 'Bea', listener: 'Carl', speaker_languages: ['english'], listener_languages: ['german'] });
  const across = await rate(['Bea', 'Carl'], {});
  const far = await say({ speaker: 'Ann', listener: 'Tom', voice_feeling: 'anger', distance_m: 3000, noise: Object.keys((await import('../src/rules/acoustics.js')).NOISE).at(-1) });
  const none = await say({ speaker: 'Ann', listener: 'Tom' });
  // Table 4's happiness pi, .87 within and .74 across, read among five feelings: .87 / (4 − 3 × .87), .74 / (4 − 3 × .74).
  const pIn = 0.87 / (4 - 3 * 0.87), pX = 0.74 / (4 - 3 * 0.74), sd = p => 4 * Math.sqrt(p * (1 - p) / 1500);
  if (!(Math.abs(same.right - pIn) < sd(pIn) && Math.abs(across.right - pX) < sd(pX) && same.any === 1 && !/in the voice/.test(far) && !/in the voice/.test(none))) {
    miss++; console.log(`MISS feeling heard in the voice: within ${same.right} (${pIn.toFixed(3)}), across ${across.right} (${pX.toFixed(3)}), far "${far.slice(0, 90)}", none "${none.slice(0, 60)}"`); }
}
// N69: the player's marks fix how their line is said: capitals on one word raise the voice, ((angry)) sets the feeling, on
// the player's Communicate whatever the plan wrote; the planner and the narrator are told the delivery; the marks are taken
// off before the verbs are read ("tell Tom" still routes).
{
  const Q = await import('../src/rules/question-pass.js');
  fresh(); ctx.name1 = 'Jack'; await run('NewCharacter', { who: 'Tom', sex: 'male', age: 30 });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom stares at Jack across the bar.' }, { is_user: true, mes: '((angry)) I tell Tom, "STOP looking at me (.) who do you ↑think I am?"' }];
  const prompts = [], send = async (sys, user) => { prompts.push(user); return JSON.stringify({ calls: [{ tool: 'Communicate', args: { speaker: 'Jack', listener: 'Tom', effort: 'normal', message: 'Stop looking at me', distance_m: 3, noise: 'quiet room (25 dB)', barrier: 'none' } }] }); };
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const c = ctx.chatMetadata.rulesEngine.asked?.calls?.find(x => x.tool === 'Communicate' && x.args.speaker === 'Jack');
  const told = Q.decidedInjection(), voice = Q.voiceRead() ?? '';
  // A stretched verb is still the verb: "pu::nch" is read as punch once the marks come off.
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Tom laughs.' }, { is_user: true, mes: 'I pu::nch Tom.' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const blow = ctx.chatMetadata.rulesEngine.asked?.calls?.some(x => x.tool === 'BodyStrike' && x.args.attacker === 'Jack' && x.args.who === 'Tom');
  ctx.name1 = undefined;
  if (!(blow && c?.args.effort === 'raised' && c?.args.voice_feeling === 'anger' && prompts.some(p => /HOW JACK SAYS IT[\s\S]*louder: Stop/.test(p)) && /How Jack said the line \(the player's own marks\): feeling: anger · louder: Stop · pitch up on think · short pause after me/.test(told) && /^feeling: anger/.test(voice))) {
    miss++; console.log(`MISS marks fix the delivery: blow read ${blow}; ${JSON.stringify(c?.args)}; voice "${voice}"; told ${/How Jack said/.test(told)}; prompt ${prompts.some(p => /HOW JACK SAYS IT/.test(p))}`); }
}
// N70: marks kept unseen in the saved line (voice-code.ts) fix the delivery the same way: the words shown are the player's
// own, and the pass reads the codes as the marks they stand for.
{
  const Q = await import('../src/rules/question-pass.js'), VC = await import('../src/rules/voice-code.js');
  let line = 'I tell Tom, "Stop looking at me, who do you think I am?"';
  const mk = (w, id) => { const i = line.indexOf(w) + 1, r = VC.markWords(line, i, i, id); line = line.slice(0, r.from) + r.insert + line.slice(r.to); };
  mk('Stop', 'loud'); mk('think', 'up'); mk('Stop', 'feeling:anger');
  fresh(); ctx.name1 = 'Jack'; await run('NewCharacter', { who: 'Tom', sex: 'male', age: 30 });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom stares at Jack across the bar.' }, { is_user: true, mes: line }];
  const send = async () => JSON.stringify({ calls: [{ tool: 'Communicate', args: { speaker: 'Jack', listener: 'Tom', effort: 'normal', message: 'Stop looking at me', distance_m: 3, noise: 'quiet room (25 dB)', barrier: 'none' } }] });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  const c = ctx.chatMetadata.rulesEngine.asked?.calls?.find(x => x.tool === 'Communicate' && x.args.speaker === 'Jack');
  ctx.name1 = undefined;
  if (!(VC.visible(line) === 'I tell Tom, "Stop looking at me, who do you think I am?"' && c?.args.effort === 'raised' && c?.args.voice_feeling === 'anger' && /louder: Stop · pitch up on think/.test(Q.voiceRead() ?? ''))) {
    miss++; console.log(`MISS unseen marks fix the delivery: ${JSON.stringify(c?.args)}; ${Q.voiceRead()}`); }
}
// R1: a regenerate of a turn that got no reply (the request failed or was stopped after the question pass ran) starts from
// the turn's snapshot, so the replayed calls run once; the generation start restores it itself, so a call the stopped reply
// made (its message never saved) is gone before any pass runs.
{
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara sits in the inn.' }];
  T.onRulesGenerationStarted('normal');
  ctx.chat.push({ is_user: true, mes: 'I wait twenty minutes.' });
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  const first = T.storyTime();
  await run('PassTime', { minutes: 5 });
  T.onRulesGenerationStarted('regenerate');
  const started = T.storyTime();
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.name1 = undefined;
  if (first !== 620 || started !== 600 || T.storyTime() !== 620) { miss++; console.log(`MISS regenerate without a reply runs the turn once: ${first}, at the start ${started}, then ${T.storyTime()}`); }
}
// R2: deleting back to a greeting that holds no result (a chat from before results were kept on every message) puts the
// world back to the turn's snapshot.
{
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 'Greeting.' }];
  T.onRulesGenerationStarted('normal');
  delete ctx.chat[0].extra;
  ctx.chat.push({ is_user: true, mes: 'I wait 10 minutes.' });
  await run('PassTime', { minutes: 10 });
  ctx.chat.push({ is_user: false, mes: 'Reply 1', swipe_id: 0 });
  T.onRulesMessageReceived(2);
  ctx.chat.splice(1, 2);
  T.syncRulesToChat();
  if (T.storyTime() !== 600) { miss++; console.log(`MISS delete back to the greeting restores the snapshot: ${T.storyTime()}`); }
}
// R3: an appended fact is one recorded change, and the replay rebuilds the state.
{
  const WL = await import('../src/rules/world-log.js');
  const a = { facts: Array.from({ length: 50 }, (_, i) => ({ id: i, text: `fact ${i}` })) }, b = { facts: [...a.facts, { id: 50, text: 'new' }] };
  const ops = WL.diff(a, b), back = WL.apply(structuredClone(a), ops), shorter = WL.apply(structuredClone(b), WL.diff(b, a));
  if (ops.length !== 1 || ops[0].p.join('.') !== 'facts.50' || JSON.stringify(back) !== JSON.stringify(b) || JSON.stringify(shorter) !== JSON.stringify(a)) { miss++; console.log(`MISS appended fact recorded as one change: ${JSON.stringify(ops).slice(0, 120)}`); }
}
// R4: another chat opened while the pass waits on the model: nothing of this turn is written into that chat.
{
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara stands under the wall.' }, { is_user: true, mes: 'I climb the wall.' }];
  T.setStoryTime(600);
  const other = {};
  let err = null;
  await Q.runQuestionPass(ctx.chat, async () => { ctx.chatMetadata = other; return '{"calls":{}}'; }, '', undefined, async () => null).catch(e => { err = e; });
  ctx.name1 = undefined;
  if (!err || other.rulesEngine) { miss++; console.log(`MISS chat opened during the pass stays untouched: ${JSON.stringify(other).slice(0, 120)}`); }
}
// R5: the toolbar's marks reach the engine exactly once the line is notated for the model: a mark on the first word of a
// quotation (pitch up on "Stop) and a whisper inside brackets, read from the codes.
{
  const VC = await import('../src/rules/voice-code.js');
  let line = 'I tell the NATO man, "Stop that," and add (softly) to him.';
  const mk = (w, id) => { const i = line.indexOf(w) + 1, r = VC.markWords(line, i, i, id); line = line.slice(0, r.from) + r.insert + line.slice(r.to); };
  mk('Stop', 'up'); mk('(softly)', 'whisper'); mk('add', 'fast');
  fresh(); ctx.name1 = 'Jack'; await run('NewCharacter', { who: 'Tom', sex: 'male', age: 30 });
  const copy = [{ is_user: false, name: 'Narrator', mes: 'Tom glares.' }, { is_user: true, mes: line }].map(m => ({ ...m }));
  VC.notateChat(copy);
  await Q.runQuestionPass(copy, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.name1 = undefined;
  const v = Q.voiceRead() ?? '';
  // Only the codes are read: the typed capitals of NATO stay a word, and faster comes from its code (typed › ‹ are quotes).
  if (!(/pitch up on Stop/.test(v) && /whispered: softly/.test(v) && /faster: add/.test(v) && !/louder/.test(v) && !/[\u{E0020}-\u{E007F}]/u.test(copy[1].mes))) { miss++; console.log(`MISS marks on a quoted first word read from the codes: "${v}" ${copy[1].mes}`); }
}
// R6: a line in the third person is read by its verbs (the scene's names are subjects): no call to pick the tools. A given
// name opening a sentence is a subject by itself (router.ts); a name that is a common word ("Ash") is one by the scene's names.
for (const who of ['Mara', 'Ash']) {
  fresh(); ctx.name1 = who;
  ctx.chat = [{ is_user: false, name: 'N', mes: `${who} stands under the wall.` }, { is_user: true, mes: `${who} climbs the wall.` }];
  const systems = [];
  await Q.runQuestionPass(ctx.chat, async (sys) => { systems.push(sys); return sys === Q.PICK_SYSTEM ? '{"tools":["BodyCheck"]}' : '{"calls":{}}'; }, '', undefined, async () => null);
  ctx.name1 = undefined;
  if (systems.includes(Q.PICK_SYSTEM)) { miss++; console.log(`MISS third-person line routed by its verbs (${who})`); }
}
// I1: the line as meant (intent.ts) is what the turn reads: "him back" is the one who did it, a search takes the stated
// goal; the planner is told both, and the note under the line shows the reading.
{
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: true, mes: "I'm looking for the key." }, { is_user: false, name: 'N', mes: 'Will laughs. Tom shoves you hard against the desk.' }, { is_user: true, mes: 'I hit him back and search the desk.' }];
  const prompts = [];
  await Q.runQuestionPass(ctx.chat, async (sys, user) => { prompts.push(String(user ?? '')); return sys === Q.PICK_SYSTEM ? '{"tools":["BodyStrike"]}' : '{"calls":{}}'; }, '', undefined, async () => null);
  ctx.name1 = undefined;
  const p = prompts.join('\n'), note = Q.meantReading();
  if (!/THE PLAYER'S LINE AS MEANT[\s\S]*him back" read as "Tom back/.test(p) || !/BodyStrike \{[^}]*"who":"Tom"/.test(p) || !/THE PLAYER'S STATED GOAL[\s\S]*the key/.test(p) || !note.includes('him back → Tom back') || !note.some(x => /for the key/.test(x))) { miss++; console.log(`MISS the line as meant reaches the planner and the note: ${JSON.stringify(note)} ${p.slice(-600)}`); }
}
// R7: "No, ..." opening an ordinary clause is a line, not a correction; a named reading is a correction.
{
  const A = await import('../src/rules/ask.js');
  const got = ["No, I don't think Will did it.", 'No, I walk over to Will.', 'No, Will is lying.', 'no, Will', 'no, I meant Will', 'no, the guards', 'no, keep out of sight'].map(A.correctionOf);
  if (JSON.stringify(got) !== JSON.stringify([null, null, null, 'Will', 'Will', 'the guards', 'keep out of sight'])) { miss++; console.log(`MISS ordinary "No, ..." line read as a line: ${JSON.stringify(got)}`); }
}
// R8: a voice in noise is the acoustics' own (one Lombard rise, on the speech spectrum), and a strong feeling raises it on
// that spectrum.
{
  const Ac = await import('../src/rules/acoustics.js');
  const diffs = [];
  for (const [noise, feeling, raise] of [['loud room (75 dB)', undefined, 0], ['busy street (70 dB)', undefined, 0], ['busy street (70 dB)', 'intense anger', 4.46], ['quiet room (25 dB)', 'intense anger', 4.46]]) {
    fresh(); for (const w of ['A', 'B']) await run('NewCharacter', { who: w, sex: 'male', age: 30 });
    await run('Communicate', { speaker: 'A', listener: 'B', effort: 'normal', distance_m: 4, noise, barrier: 'none', ...feeling ? { feeling } : {} });
    const got = ctx.chatMetadata.rulesEngine.state.people.B.heard?.snr, want = Ac.reach({ effort: 'normal', distance: 4, noise, raise, way: { ground: 0.5, wind: 'across', hr: 1.5 } }).snr; // Communicate's outdoor path, mixed ground
    if (got !== want) diffs.push(`${noise} ${feeling ?? ''}: ${got} vs ${want}`);
  }
  if (diffs.length) { miss++; console.log(`MISS voice in noise from the acoustics: ${diffs.join('; ')}`); }
}
// R9: a fall onto soft ground counts one row lower, rising with height (11.9 m no worse than 12 m).
{
  const BE = await import('../src/rules/body-engine.js');
  const hs = [6, 9.6, 11.9, 12, 13, 15.5, 15.6, 19.2, 25], soft = hs.map(h => BE.fallDeathChance(h, { soft: true })), hard = hs.map(h => BE.fallDeathChance(h));
  if (soft.some((c, i) => i && c < soft[i - 1]) || soft.some((c, i) => c > hard[i]) || Math.abs(soft[3] - 0.176) > 0.001 || soft[6] !== 0.44) { miss++; console.log(`MISS soft-ground falls rise with height: ${soft.map(x => x.toFixed(3)).join(' ')}`); }
}
// R14: a walk the words give in legs is walked leg by leg, and the verb sets the pace (run, sprint, creep).
{
  const Ac2 = await import('../src/rules/actions.js');
  const legs = Ac2.stepsFromWords('walk 5 m to the door and then walk 10 m to the gate.', 'Mara'), one = Ac2.stepsFromWords('walk 300 yards to the market, 2 km from the river.', 'Mara');
  const pace = ['run 20 m to the wall', 'dash 30 m to the door', 'creep 10 m to the window', 'walk 10 m to the window'].map(t => Ac2.stepsFromWords(t, 'Mara').steps?.[0]?.pace ?? 'walk');
  if (JSON.stringify(legs.steps?.map(x => [x.to, x.distance_m])) !== '[["door",5],["gate",10]]' || one.steps?.length !== 1 || pace.join() !== 'run,sprint,creep,walk') { miss++; console.log(`MISS walk in legs at the verb's pace: ${JSON.stringify(legs)} ${one.steps?.length} ${pace}`); }
}
// R15: a swipe of the reply after a function call keeps the call's effect: the tool message stays in the chat, so the world
// restored is the one after it.
{
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 'Start.' }];
  T.onRulesGenerationStarted('normal');
  ctx.chat.push({ is_user: true, mes: 'I wait ten minutes.' });
  await run('PassTime', { minutes: 10 });
  ctx.chat.push({ is_user: false, is_system: true, mes: 'tool', extra: { tool_invocations: [{ name: 'PassTime' }] } });
  T.onRulesGenerationStarted('normal');
  ctx.chat.push({ is_user: false, mes: 'Ten minutes pass.', swipe_id: 0 });
  T.onRulesMessageReceived(ctx.chat.length - 1);
  T.onRulesGenerationStarted('swipe');
  const kept = T.storyTime();
  // A chat saved before messages kept their worlds (2026-10-26 (100)): the snapshot at the reply's place holds the call.
  delete ctx.chat[2].extra.rulesResult; delete ctx.chat[2].extra.rulesWorld; delete ctx.chat[2].extra.rulesLog; T.onRulesGenerationStarted('swipe');
  if (kept !== 610 || T.storyTime() !== 610) { miss++; console.log(`MISS swipe after a function call keeps its effect: ${kept}; in an older chat ${T.storyTime()}`); }
}
// R16: in a reverberant room a louder voice fills the room as much as it reaches the ear: the echo carries the voice as noise
// raised it, so speech-to-noise holds as the background rises (before: it rose 5 dB from 40 to 65 dB of noise).
{
  const Ac = await import('../src/rules/acoustics.js'), room = { room: { m3: 300, absorption: 5 } };
  const snr = [40, 60, 65].map(n => Ac.reach({ effort: 'normal', distance: 2, noiseDb: n, way: room }).snr);
  if (Math.max(...snr) - Math.min(...snr) > 1) { miss++; console.log(`MISS room echo carries the raised voice: ${snr}`); }
}
// R17: a deletion back past the changes folded into the record's base starts the record again from the world as restored,
// so the replay rebuilds it.
{
  const WL = await import('../src/rules/world-log.js');
  const h = { base: { n: 0 }, log: [], n: 0 };
  for (let i = 0; i < WL.KEEP_ENTRIES + 10; i++) WL.record(h, { msg: i, tool: 't', args: {}, draws: [], ops: WL.diff({ n: i }, { n: i + 1 }) });
  const later = structuredClone(h); WL.truncate(later, 300, { n: 300 });
  WL.truncate(h, 5, { n: 5 });
  if (WL.verify(h, { n: 5 }) !== null || WL.verify(later, { n: 300 }) !== null || later.log.length !== 290) { miss++; console.log(`MISS record restarts past its folded base: ${WL.verify(h, { n: 5 })} / ${WL.verify(later, { n: 300 })} / ${later.log.length}`); }
}
// R18: the five fitted factors are read from the registry, so the sensitivity reruns vary them: a knockout threshold, the
// rigid-tissue factor, the natural-edge factor, the crush share and the flash-point shift each move the outcome.
{
  const fs = await import('node:fs'), D = await import('../src/rules/df/index.js'), Rw = await import('../src/rules/df/raws.js');
  D.useRaws(Object.fromEntries(Rw.RAW_FILES.map(f => [f, fs.readFileSync(new URL(`../rules/df/raw/${f}`, import.meta.url), 'utf8')])));
  const BE = await import('../src/rules/body-engine.js'), K = await import('../src/rules/constants.js');
  let seed = 3; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const punch = () => BE.strike(BE.newPerson(70), { part: 'head', attack: 'punch', skill: 'Professional', landed: true }, BE.newPerson(70), rng);
  const bite = () => BE.strike(BE.newPerson(70), { part: rng() < 0.5 ? 'right lower arm' : 'right hand', attack: 'bite', species: 'DOG', mass: 30, skill: 'Dabbling', landed: true }, BE.newPerson(30, 'DOG'), rng);
  const count = async (id, v, f, re, n) => { let c = 0; const go = () => { for (let i = 0; i < n; i++) if (re.test(f())) c++; }; if (id) await K.withOverride(id, v, go); else go(); return c; };
  const ko = await count('koMomentum', 1, punch, /Knocked out/, 20), skull = await count('rigidBluntFactor', 0.01, punch, /skull: bone (?!held)/, 20);
  const cut0 = await count(null, 0, bite, /skin cut/, 200), cut = await count('naturalEdgeFactor', 0.5, bite, /skin cut/, 200);
  const fr0 = await count(null, 0, bite, /bone (?!held)[a-z]+/, 400), fr = await count('crushAreaShare', 0.2, bite, /bone (?!held)[a-z]+/, 400);
  const C = await import('../src/rules/chem.js'), V = await import('../src/rules/vapour.js'); await C.loadChem();
  const row = C.chemRows().find(r => r.LFL && r.vp && V.derivedFlash(r) != null), f0 = V.derivedFlash(row), f1 = await K.withOverride('flashShift', 12.5, () => V.derivedFlash(row));
  const ids = ['koMomentum', 'rigidBluntFactor', 'naturalEdgeFactor', 'crushAreaShare', 'flashShift'].map(id => K.REGISTRY_K.get(id));
  if (!(ko >= 18 && skull >= 18 && cut < cut0 / 2 && fr > fr0 + 20 && Math.abs(f1 - f0 - 10) < 1e-9 && ids.every(c => c?.status === 'fitted' && c.range[0] <= c.value && c.value <= c.range[1]))) {
    miss++; console.log(`MISS fitted factors read from the registry: KO ${ko}/20, skull ${skull}/20, skin ${cut0}→${cut}/200, fracture ${fr0}→${fr}/400, flash ${f0}→${f1}, ${ids.map(c => c?.id).join()}`); }
}
// R19: hurrying is the fastest walk, Bohannon 1997's maximum over comfortable speed for the walker's sex and decade.
{
  const Ac2 = await import('../src/rules/actions.js');
  const p25 = { sex: 'female', age: 25 }, p75 = { sex: 'male', age: 75 };
  const pace = Ac2.stepsFromWords('hurry 20 m to the gate', 'Mara').steps?.[0]?.pace;
  const speed = async action => { fresh(); await run('NewCharacter', { who: 'Ida', sex: 'female', age: 25 }); return Number(/at (\d+\.\d+) m\/s/.exec(String(await run('Act', { who: 'Ida', action, level: 'on the level, stairs or a change of posture' })))?.[1]); };
  const walkV = await speed('walks 20 m to the gate'), hurryV = await speed('hurries 20 m to the gate');
  if (!(pace === 'brisk' && Math.abs(Ac2.briskShare(p25) - 246.7 / 140.7) < 1e-9 && Math.abs(Ac2.briskShare(p75) - 207.9 / 133.0) < 1e-9 && Math.abs(hurryV / walkV - 246.7 / 140.7) < 0.02)) { miss++; console.log(`MISS hurrying is the fastest walk: ${pace} ${Ac2.briskShare(p25)} ${Ac2.briskShare(p75)} ${walkV}→${hurryV}`); }
}
// R22: bystanders on the map overhear: each tracked person there, other than the two, hears at their own distance, through a
// wall from a room to the outdoors, and comes to know what they make out; the listener's own result is unchanged.
{
  fresh();
  await run('Layout', { spots: [{ spot: 'bench', x_m: 0, y_m: 0 }, { spot: 'well', x_m: 3, y_m: 0 }, { spot: 'fence', x_m: 9, y_m: 0 }, { spot: 'hall', x_m: 2, y_m: 6, room: 'hall' }],
    rooms: [{ room: 'hall', corners: [[0, 5], [6, 5], [6, 9], [0, 9]] }] });
  for (const [w, s, sex] of [['Mara', 'bench', 'female'], ['Tom', 'well', 'male'], ['Ann', 'fence', 'female'], ['Joe', 'hall', 'male']]) { await run('NewCharacter', { who: w, sex, age: 30 }); await run('Act', { level: 'on the level, stairs or a change of posture', who: w, steps: [{ do: 'be_at', to: s }] }); }
  ctx.chat.push({ is_user: true, mes: 'w' });
  const wh = String(await run('Communicate', { speaker: 'Mara', listener: 'Tom', effort: 'whisper', message: 'The key is under the stone.', noise: 'quiet room (25 dB)' }));
  ctx.chat.push({ is_user: true, mes: 'n' });
  const nm = String(await run('Communicate', { speaker: 'Mara', listener: 'Tom', effort: 'normal', message: 'The boat leaves at dawn.', noise: 'quiet room (25 dB)' }));
  const f1 = ctx.chatMetadata.rulesEngine.state.facts.find(x => /key is under/.test(x.text)), f2 = ctx.chatMetadata.rulesEngine.state.facts.find(x => /boat leaves/.test(x.text));
  if (!(/Tom hears Mara/.test(wh.split(" [OVERHEARD]")[0]) && /\[OVERHEARD\][^]*Ann hears Mara's voice; the words are lost[^]*\(9 m\)/.test(wh) && /Joe [^(]*\(6 m, through a wall\)/.test(nm) && /Ann hears Mara and makes out every word \(9 m\)/.test(nm)
    && !f1?.knowers.includes('Ann') && f2?.knowers.includes('Ann') && !f2?.knowers.includes('Joe'))) { miss++; console.log(`MISS bystanders overhear speech: ${wh.slice(-200)} || ${nm.slice(-220)} || ${f1?.knowers} / ${f2?.knowers}`); }
}
// R23: an expert defender responds faster (Zhang et al. 2022, experts against non-experts g = −0.91): more blocks of the same
// punches.
{
  const fs = await import('node:fs'), D = await import('../src/rules/df/index.js'), Rw = await import('../src/rules/df/raws.js');
  D.useRaws(Object.fromEntries(Rw.RAW_FILES.map(f => [f, fs.readFileSync(new URL(`../rules/df/raw/${f}`, import.meta.url), 'utf8')])));
  const BE = await import('../src/rules/body-engine.js');
  const blocked = expert => { let seed = 5; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647; let n = 0; for (let i = 0; i < 2000; i++) if (/block|dodg|avoid|miss/i.test(BE.strike(BE.newPerson(70), { part: 'head', attack: 'punch', skill: 'Competent', defender_expert: expert }, BE.newPerson(70), rng).split('.')[0])) n++; return n / 2000; };
  const b0 = blocked(false), b1 = blocked(true);
  if (!(b1 > b0 + 0.01 && b0 > 0.08 && b0 < 0.18)) { miss++; console.log(`MISS expert defender blocks more: ${b0} → ${b1}`); }
}
// R24: a reading is asked about or taken only for the player's own act ("Will follows the thief" asks nothing).
{
  const A = await import('../src/rules/ask.js');
  const people = [{ name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }, { name: 'Mara', sex: 'female' }], cues = { narration: ['Tom and Will stand at the bar. The thief runs.'], lastTargets: [] };
  const dWill = A.decide('Will follows the thief.', 'Mara', people, () => true, cues), dMe = A.decide('I follow the thief.', 'Mara', people, () => true, cues), dMara = A.decide('Mara hits him.', 'Mara', people, () => true, cues);
  if (!(dWill === null && dMe && 'take' in dMe && dMara && 'ask' in dMara)) { miss++; console.log(`MISS readings only for the player's acts: ${JSON.stringify([dWill, !!dMe, !!dMara])}`); }
}
// R25: a line wholly out of character runs no question pass and no tool.
{
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara sits in the inn.' }, { is_user: true, mes: '(OOC: can we skip to the next morning?)' }];
  let sent = 0;
  const read = await Q.runQuestionPass(ctx.chat, async () => { sent++; return '{"calls":{}}'; }, '', undefined, async () => null);
  ctx.name1 = undefined;
  if (sent || read.length || ctx.chatMetadata.rulesEngine?.asked) { miss++; console.log(`MISS an out-of-character line runs no pass: ${sent} sent`); }
}
// R26: a reply that failed or was stopped, then Send with an empty box (SillyTavern adds no message and starts a 'normal'
// generation): the line's pass runs its calls once, from the line's start; the line edited in place first runs as edited; a
// new line sent instead keeps the stopped line's outcome (its line stays in the chat).
{
  const wait = async (lines, retry) => {
    fresh(); T.setStoryTime(600); ctx.name1 = 'Mara';
    ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara sits in the inn.' }];
    T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: lines[0] });
    await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
    retry();
    T.onRulesGenerationStarted('normal');
    if (lines[1]) ctx.chat.push({ is_user: true, mes: lines[1] });
    await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
    ctx.name1 = undefined;
    return T.storyTime();
  };
  const again = await wait(['I wait twenty minutes.'], () => {});
  const edited = await wait(['I wait twenty minutes.'], () => { ctx.chat.at(-1).mes = 'I wait thirty minutes.'; });
  const newLine = await wait(['I wait twenty minutes.', 'I wait ten minutes.'], () => {});
  if (!(again === 620 && edited === 630 && newLine === 630)) { miss++; console.log(`MISS a stopped reply sent again runs its line once: ${again}, edited ${edited}, a new line ${newLine}`); }
}
// R27: SillyTavern's tool flow (script.js: the narrator's calls saved as a message, then Generate('normal') for the reply).
// A swipe of that reply keeps the tools' effects while function calling is on (the tool message stays in the prompt and the
// pass does not run); with it off the tool message leaves the prompt, the pass's chat ends at the player's line, and the
// turn is redone from the line's start: one blow, the narrator's minutes gone.
{
  const swipe = async (toolsOn) => {
    fresh(); ctx.name1 = 'Jack'; T.setStoryTime(600); await run('NewCharacter', { who: 'Will', sex: 'male', age: 30 });
    const send = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Will', attack: 'punch' } }] });
    ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Will stands at the bar.' }];
    T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit Will.' });
    await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
    await run('PassTime', { minutes: 5 });
    ctx.chat.push({ is_user: false, is_system: true, mes: 'tool', extra: { tool_invocations: [{ name: 'PassTime', result: 'ok' }] } });
    T.onRulesGenerationStarted('normal');
    await Q.runQuestionPass(ctx.chat.slice(), send, '', undefined, async () => null);
    ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Will.', swipe_id: 0 });
    ctx.isToolCallingSupported = () => toolsOn;
    T.onRulesGenerationStarted('swipe');
    await Q.runQuestionPass(ctx.chat.filter(x => !x.is_system || (toolsOn && Array.isArray(x.extra?.tool_invocations))).slice(0, -1), send, '', undefined, async () => null);
    delete ctx.isToolCallingSupported; ctx.name1 = undefined;
    const st = ctx.chatMetadata.rulesEngine;
    return { blows: (st.history?.log ?? []).filter(e => e.tool === 'BodyStrike').length, t: T.storyTime() };
  };
  const on = await swipe(true), off = await swipe(false);
  if (!(on.blows === 1 && on.t >= 605 && off.blows === 1 && off.t < 605)) { miss++; console.log(`MISS a swipe after the narrator's tools: tools on ${JSON.stringify(on)}, off ${JSON.stringify(off)}`); }
}
// R28: the pass reads the player's words, not the models' notation (index.ts notates the chat first): a pause marked on a
// time leaves it at 14:20, and "again" repeats a stretched verb as the word typed.
{
  const VC = await import('../src/rules/voice-code.js');
  const mark = (line, word, id) => { const at = line.indexOf(word) + 1, r = VC.markWords(line, at, at, id); return line.slice(0, r.from) + r.insert + line.slice(r.to); };
  const notated = () => { const c = ctx.chat.map(m => ({ ...m })); VC.notateChat(c); return c; };
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara stands in the yard.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: mark('It is 3 May 1820, 2:20 pm. I wait a minute.', '2:20', 'pause') });
  await Q.runQuestionPass(notated(), async () => '{"calls":[]}', '', undefined, async () => null);
  const hour = (T.storyTime() % 1440) / 60;
  fresh(); ctx.name1 = 'Jack'; await run('NewCharacter', { who: 'Tom', sex: 'male', age: 30 });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom stands at the bar.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: mark('I shove Tom.', 'shove', 'stretch') });
  await Q.runQuestionPass(notated(), async () => '{"calls":[]}', '', undefined, async () => null);
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack shoves Tom.' });
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I do it again.' });
  await Q.runQuestionPass(notated(), async () => '{"calls":[]}', '', undefined, async () => null);
  const meant = Q.meantReading?.() ?? [];
  ctx.name1 = undefined;
  if (!(Math.abs(hour - 14 - 20 / 60) < 0.05 && JSON.stringify(meant) === '["I do it again. → I shove Tom."]')) { miss++; console.log(`MISS the pass reads words, not notation: ${hour} h; ${JSON.stringify(meant)}`); }
}
// R29: the rule check's answer belongs to the swipe it read: a swipe shown meanwhile (the same words) gets no flags and no
// rewrite; an answer that comes after the player wrote on is kept on the reply it read, and rewrites nothing.
{
  const A = await import('../src/rules/rules-audit.js');
  const flags = '{"events":[{"quote":"He waits","tool":"PassTime","problem":"unbacked"}]}';
  fresh();
  let rewrites = 0;
  const msg = { is_user: false, mes: 'He waits.', swipe_id: 0, extra: {} };
  ctx.chat = [{ is_user: true, mes: 'Wait.' }, msg];
  const swiped = await A.onRulesAuditMessage(1, { send: async () => { msg.swipe_id = 1; return flags; }, ownsChat: () => true, generate: () => { rewrites++; }, toast: () => {} });
  fresh();
  const msg2 = { is_user: false, mes: 'He waits.', swipe_id: 0, extra: {} };
  ctx.chat = [{ is_user: true, mes: 'Wait.' }, msg2];
  const wroteOn = await A.onRulesAuditMessage(1, { send: async () => { ctx.chat.push({ is_user: true, mes: 'I leave.' }); return flags; }, ownsChat: () => true, generate: () => { rewrites++; }, toast: () => {} });
  A.takeAuditNote?.();
  if (!(swiped === null && !msg.extra.rulesAudit && wroteOn?.length === 1 && msg2.extra.rulesAudit?.[0]?.length === 1 && rewrites === 0)) { miss++; console.log(`MISS the check's answer stays with its swipe: ${JSON.stringify(swiped)}, ${JSON.stringify(msg.extra)}, ${JSON.stringify(wroteOn)}, rewrites ${rewrites}`); }
}
// R30: judged numbers the review found only in comments are registered (constants.ts), so a result says when it rests on them:
// a slip under 45 whose draw falls inside slipUnder45's range is reported fragile; endoPeak is read where the cap can bind
// (a dog in 2 °C water: its fur fills with water), not in mild still air nor in a cold wind its fur keeps out.
{
  const C = await import('../src/rules/constants.js'), E = await import('../src/rules/thermal/endotherm.js');
  let fragile = 0;
  for (let i = 0; i < 1500; i++) { fresh(); if (/Fragile[^]*slipUnder45/.test(String(await run('BodyFall', { who: 'Mara', height_m: 0, slip: true, age: 30 })))) fragile++; }
  const dog = { homeotherm: 10067, tissues: {}, flags: [], id: 'DOG' };
  C.resetUsed(); E.endothermMinute({ mass: 20, env: { tdb: 5, water: { tc: 2 } } }, dog); const cold = C.USED.has('endoPeak');
  C.resetUsed(); E.endothermMinute({ mass: 20, env: { tdb: -30, wind10: 40, rh: 60 } }, dog); const windy = C.USED.has('endoPeak');
  C.resetUsed(); E.endothermMinute({ mass: 20, env: { tdb: 22, v: 0.1, rh: 50 } }, dog); const mild = C.USED.has('endoPeak');
  if (!(fragile >= 3 && fragile <= 40 && cold && !mild && !windy && ['slipUnder45', 'slipMiddleAge', 'endoPeak'].every(id => C.REGISTRY_K.get(id)?.range))) { miss++; console.log(`MISS judged numbers registered: ${fragile} fragile slips of 1500, peak read in cold water ${cold}, in mild air ${mild}, in a cold wind ${windy}`); }
}
// R31: swiping back to an earlier swipe (no generation runs) keeps the record of changes true to the world shown: the turn's
// changes as the later swipe made them leave it, one entry holds what the swipe shown changed, and the turns before stay.
{
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 'Start.' }, { is_user: true, mes: 'Wait.' }];
  await run('PassTime', { minutes: 5 });
  ctx.chat.push({ is_user: false, mes: 'Five minutes.', swipe_id: 0 });
  T.onRulesMessageReceived(2);
  ctx.chat.push({ is_user: true, mes: 'Wait more.' });
  await run('PassTime', { minutes: 10 });
  ctx.chat.push({ is_user: false, mes: 'Swipe 0', swipe_id: 0 });
  T.onRulesMessageReceived(4);
  await run('PassTime', { minutes: 20 });
  ctx.chat[4].swipe_id = 1;
  T.onRulesMessageReceived(4);
  ctx.chat[4].swipe_id = 0;
  T.onRulesSwiped(4);
  const log = ctx.chatMetadata.rulesEngine.history.log.map(e => e.tool).join(',');
  if (!/rebuilds the current state exactly/.test(T.historyCheck()) || T.storyTime() !== 615 || log !== 'set time,PassTime,swipe shown') { miss++; console.log(`MISS swipe back keeps the record true: ${T.historyCheck()}; ${T.storyTime()}; ${log}`); }
}
// R32: a correction sent by /send before /trigger (the line joins before the generation starts, so a snapshot holding the
// undone blow sat at the reply's place): its regenerate after a stopped reply keeps Tom unstruck.
{
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const send = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' });
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async (q, opts) => opts.find(o => /Tom/.test(o)));
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Tom.' });
  ctx.chat.push({ is_user: true, mes: 'no, Will' }); T.onRulesGenerationStarted('normal');
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  T.onRulesGenerationStarted('regenerate');
  await Q.runQuestionPass(ctx.chat, send, '', undefined, async () => null);
  ctx.name1 = undefined;
  const P = ctx.chatMetadata.rulesEngine.state.people;
  if ((P.Tom.wounds?.length ?? 0) !== 0 || !(P.Will.wounds?.length > 0)) { miss++; console.log(`MISS a /send correction's regenerate keeps Tom unstruck: Tom ${P.Tom.wounds?.length}, Will ${P.Will.wounds?.length}`); }
}
// R33: a regenerate of a line /send put in before /trigger starts from that line's start at the generation's start (a call the
// stopped reply made is gone before any pass runs).
{
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara sits in the inn.' }, { is_user: true, mes: 'I wait twenty minutes.' }];
  T.onRulesGenerationStarted('normal');
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  await run('PassTime', { minutes: 5 });
  T.onRulesGenerationStarted('regenerate');
  const started = T.storyTime();
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.name1 = undefined;
  if (started !== 600 || T.storyTime() !== 620) { miss++; console.log(`MISS a /send line's regenerate starts at its start: ${started}, then ${T.storyTime()}`); }
}
// R34: a line deleted takes its pass with it: /rules-time set after the deletion stands when a new line takes its place.
{
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'N', mes: 'Greeting.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I wait ten minutes.' });
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.chat.pop(); T.syncRulesToChat();
  const asked = ctx.chatMetadata.rulesEngine.asked;
  T.setStoryTime(900);
  ctx.chat.push({ is_user: true, mes: 'I look around.' }); T.onRulesGenerationStarted('normal');
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.name1 = undefined;
  if (asked || T.storyTime() !== 900) { miss++; console.log(`MISS a deleted line takes its pass: asked kept ${!!asked}; clock ${T.storyTime()}`); }
}
// R35: the planner's and the picker's prompts carry the notation whoever calls them (/rules-eval does not notate first).
{
  const VC = await import('../src/rules/voice-code.js');
  let line = 'I tell Tom, "Stop looking at me!"';
  const r = VC.markWords(line, line.indexOf('Stop') + 1, line.indexOf('Stop') + 1, 'loud');
  line = line.slice(0, r.from) + r.insert + line.slice(r.to);
  const prompt = Q.questionPrompt([{ is_user: true, mes: line }], '');
  let picked = '';
  await Q.pickTools([{ is_user: true, mes: line }], async (sys, user) => { picked = user; return '{"tools":[]}'; });
  if (VC.hasHidden(prompt) || !/STOP/.test(prompt) || VC.hasHidden(picked) || !/STOP/.test(picked)) { miss++; console.log(`MISS prompts carry the notation: ${VC.hasHidden(prompt)} ${VC.hasHidden(picked)}`); }
}
// R36–R40: what the random sequences found (tests/sequences.test.mjs), one case each. A line whose reply is deleted keeps
// its outcome and its own change in the record; a /send line stopped and sent again runs once; deleting back past a /send
// line takes its outcome; after the latest line is deleted, an empty Send on the line before runs it once; the record
// rebuilds the world after a swipe, a new line and a deletion.
{
  const begin = () => { fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, name: 'N', mes: 'Mara waits.', swipes: ['Mara waits.'], swipe_id: 0 }]; };
  const pass = (c = ctx.chat) => Q.runQuestionPass(c.map(m => ({ ...m })), async () => '{"calls":{}}', '', undefined, async () => null);
  const send = async (m, slash) => { if (!slash) T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: `I wait ${m} minutes.` }); if (slash) T.onRulesGenerationStarted('normal'); await pass(); };
  const reply = () => { ctx.chat.push({ is_user: false, name: 'N', mes: 'Time passes.', swipes: ['Time passes.'], swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  const del = k => { ctx.chat.splice(ctx.chat.length - k, k); T.syncRulesToChat(); };
  const logOf = () => ctx.chatMetadata.rulesEngine.history.log.map(e => e.tool).join(',');
  const exact = () => /rebuilds the current state exactly/.test(T.historyCheck());
  begin(); await send(5); reply(); del(1); const kept = T.storyTime(), keptLog = logOf(); await send(7); reply();
  if (kept !== 605 || keptLog !== 'set time,PassTime' || T.storyTime() !== 612) { miss++; console.log(`MISS a line whose reply is deleted keeps its outcome: ${kept} (${keptLog}), then ${T.storyTime()}`); }
  begin(); await send(29, true); T.onRulesGenerationStarted('normal'); await pass();
  if (T.storyTime() !== 629 || !exact()) { miss++; console.log(`MISS a /send line stopped and sent again runs once: ${T.storyTime()}`); }
  begin(); await send(10, true); del(1);
  if (T.storyTime() !== 600 || !exact()) { miss++; console.log(`MISS deleting back past a /send line takes its outcome: ${T.storyTime()}`); }
  begin(); await send(22); reply(); await send(20); del(2); T.onRulesGenerationStarted('normal'); await pass();
  const sendOrder = T.storyTime();
  begin(); await send(22, true); reply(); await send(20); del(2); T.onRulesGenerationStarted('normal'); await pass();
  const slashOrder = T.storyTime();
  // A chat saved before lines kept their start (2026-10-26 (100)): the line starts from the world of the message before it.
  begin(); await send(22, true); reply(); await send(20); del(2); delete ctx.chat.at(-1).extra.rulesStart; delete ctx.chat.at(-1).extra.rulesPass; T.onRulesGenerationStarted('normal'); await pass();
  if (sendOrder !== 622 || slashOrder !== 622 || T.storyTime() !== 622 || !exact()) { miss++; console.log(`MISS an empty Send on the line before a deleted one runs it once: ${sendOrder}; /send ${slashOrder}; in an older chat ${T.storyTime()}`); }
  begin(); await send(5); reply(); T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1).map(m => ({ ...m })), async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.chat.at(-1).swipes.push('Again.'); ctx.chat.at(-1).swipe_id = 1; ctx.chat.at(-1).mes = 'Again.'; T.onRulesMessageReceived(ctx.chat.length - 1);
  await send(7); reply(); del(2);
  ctx.name1 = undefined;
  if (T.storyTime() !== 605 || !exact()) { miss++; console.log(`MISS the record rebuilds the world after a swipe, a line and a deletion: ${T.storyTime()}; ${T.historyCheck()}`); }
  // A line started again from the world of a reply swiped back to (its later lines deleted): the record still rebuilds the
  // fact the narrator recorded in that reply's turn.
  begin(); await send(5);
  await run('RecordFact', { fact: 'The bell tolls thrice.', common_knowledge: true });
  ctx.chat.push({ is_user: false, is_system: true, name: 'System', mes: 'RecordFact', extra: { tool_invocations: [{ name: 'RecordFact', result: 'ok' }] } });
  T.onRulesGenerationStarted('normal'); await pass(); reply();
  T.onRulesGenerationStarted('swipe'); await pass(ctx.chat.slice(0, -1));
  ctx.chat.at(-1).swipes.push('Again.'); ctx.chat.at(-1).swipe_id = 1; ctx.chat.at(-1).mes = 'Again.'; T.onRulesMessageReceived(ctx.chat.length - 1);
  ctx.chat.at(-1).swipe_id = 0; ctx.chat.at(-1).mes = 'Time passes.'; T.onRulesSwiped(ctx.chat.length - 1);
  await send(7); reply(); await send(9); del(2); T.onRulesGenerationStarted('normal'); await pass();
  const facts = ctx.chatMetadata.rulesEngine.state.facts?.map(f => f.text) ?? [];
  ctx.name1 = undefined;
  if (T.storyTime() !== 612 || facts.length !== 1 || !exact()) { miss++; console.log(`MISS a line started from a swiped-back reply keeps the record whole: ${T.storyTime()}; ${JSON.stringify(facts)}; ${T.historyCheck()}`); }
}
// R42–R44: each line holds its own start and its own pass (extra.rulesStart, extra.rulesPass), so a correction keeps its
// world after a later line is deleted (R42) and at the start of a swipe of its reply (R43), and a deletion in mid-chat leaves
// a swipe of the last reply its world (R44).
{
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  const begin = async () => { fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 }); ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }]; return JSON.stringify(ctx.chatMetadata.rulesEngine.state.people.Tom); };
  const tom = () => JSON.stringify(ctx.chatMetadata.rulesEngine.state.people.Tom);
  const line = async (mes, plan, choose = async () => null) => { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes }); await Q.runQuestionPass(ctx.chat, plan, '', undefined, choose); };
  const reply = mes => { ctx.chat.push({ is_user: false, name: 'Narrator', mes, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  // "I hit him." (Tom chosen), then "no, Will": the correction takes the blow from Tom.
  const corrected = async () => { const tom0 = await begin(); await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.'); await line('no, Will', hit); reply('Jack hits Will.'); return tom0; };
  let tom0 = await corrected(); await line('I wait 5 minutes.', async () => '{"calls":{}}'); ctx.chat.splice(5, 1); T.syncRulesToChat();
  T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), hit, '', undefined, async () => null);
  if (tom() !== tom0) { miss++; console.log('MISS a correction keeps its world after a later line is deleted: Tom struck on the swipe'); }
  tom0 = await corrected(); T.onRulesGenerationStarted('swipe');
  if (tom() !== tom0) { miss++; console.log("MISS the swipe of a correction's reply starts from the correction's world: Tom struck"); }
  // A chat saved by the version of 2026-10-26 (100): the latest line's start is the engine's (lineStart, by the line's place,
  // the number of player lines), not the line's.
  tom0 = await corrected(); { const m = ctx.chat[3]; ctx.chatMetadata.rulesEngine.lineStart = { place: '2', ...m.extra.rulesStart }; delete m.extra.rulesStart; delete m.extra.rulesPass; }
  T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), hit, '', undefined, async () => null);
  if (tom() !== tom0) { miss++; console.log("MISS a chat saved before lines kept their start: a swipe of the correction's reply starts from its world"); }
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Start.' }];
  const none = async () => '{"calls":{}}';
  await line('I wait 10 minutes.', none); reply('10 min.'); await line('I wait 20 minutes.', none); reply('20 min.');
  ctx.chat.splice(1, 2); T.syncRulesToChat(); T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), none, '', undefined, async () => null);
  if (T.storyTime() !== 630 || !/rebuilds the current state exactly/.test(T.historyCheck())) { miss++; console.log(`MISS a swipe after a deletion in mid-chat starts from its line's world: ${T.storyTime()} (630); ${T.historyCheck()}`); }
  // After the narrator's tool call, the swipe starts from the world the tool message keeps (snapshots by chat position move
  // with a deletion in mid-chat).
  fresh(); T.setStoryTime(600); ctx.chat = [{ is_user: false, mes: 'Start.' }];
  await line('I wait 10 minutes.', none); reply('10 min.'); await line('I wait 20 minutes.', none);
  await run('PassTime', { minutes: 5 }); ctx.chat.push({ is_user: false, is_system: true, name: 'System', mes: 'PassTime', extra: { tool_invocations: [{ name: 'PassTime', result: 'ok' }] } });
  T.onRulesGenerationStarted('normal'); reply('25 min.');
  ctx.chat.splice(1, 2); T.syncRulesToChat(); T.onRulesGenerationStarted('swipe');
  if (T.storyTime() !== 635) { miss++; console.log(`MISS a swipe after a tool call and a deletion in mid-chat starts from the tool message's world: ${T.storyTime()} (635)`); }
  // Swiping back after the first two turns are deleted: the record keeps the changes of the turn before (the swipe's line's
  // start, by the record's count; chat positions moved).
  fresh(); T.setStoryTime(600); ctx.chat = [{ is_user: false, mes: 'Start.', swipe_id: 0 }];
  for (const m of [1, 2, 3, 4]) { await line(`I wait ${m} minutes.`, none); ctx.chat.push({ is_user: false, mes: `${m} min.`, swipes: [`${m} min.`], swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); }
  T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), none, '', undefined, async () => null);
  ctx.chat.at(-1).swipes.push('Again.'); ctx.chat.at(-1).swipe_id = 1; ctx.chat.at(-1).mes = 'Again.'; T.onRulesMessageReceived(ctx.chat.length - 1);
  ctx.chat.splice(1, 4); T.syncRulesToChat(); ctx.chat.at(-1).swipe_id = 0; ctx.chat.at(-1).mes = '4 min.'; T.onRulesSwiped(ctx.chat.length - 1);
  const waits = ctx.chatMetadata.rulesEngine.history.log.filter(e => e.tool === 'PassTime').map(e => e.args.minutes).join();
  if (T.storyTime() !== 610 || !/^1,2,3/.test(waits) || !/rebuilds the current state exactly/.test(T.historyCheck())) { miss++; console.log(`MISS a swipe back after the first turns are deleted keeps the turn before in the record: ${T.storyTime()} (610); waits ${waits}; ${T.historyCheck()}`); }
  // So does a new swipe from there: the line's start cuts the record by its count.
  T.onRulesGenerationStarted('swipe');
  const waits2 = ctx.chatMetadata.rulesEngine.history.log.filter(e => e.tool === 'PassTime').map(e => e.args.minutes).join();
  if (T.storyTime() !== 606 || waits2 !== '1,2,3' || !/rebuilds the current state exactly/.test(T.historyCheck())) { miss++; console.log(`MISS a swipe after the first turns are deleted keeps the turns before in the record: ${T.storyTime()} (606); waits ${waits2}; ${T.historyCheck()}`); }
  // A correction after a deletion in mid-chat corrects the line before, from that line's own start and pass: the first wait
  // stands, and the blow moves from Tom to Will.
  await begin(); T.setStoryTime(600);
  await line('I wait 10 minutes.', none); reply('10 min.'); await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.');
  ctx.chat.splice(1, 2); T.syncRulesToChat(); await line('no, Will', hit); reply('Jack hits Will.');
  const wounds = who => ctx.chatMetadata.rulesEngine.state.people[who].wounds?.length ?? 0;
  if (T.storyTime() !== 610 || wounds('Tom') || !wounds('Will')) { miss++; console.log(`MISS a correction after a deletion in mid-chat corrects the line before from its start: ${T.storyTime()} (610), Tom ${wounds('Tom')} wounds, Will ${wounds('Will')}`); }
  // A line whose pass stopped after its calls ran (the model did not answer the next round) takes them back, so the narrator's
  // own tool calls decide the turn once.
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Mara sits by the fire.', swipe_id: 0 }];
  let asks = 0;
  const fails = async () => { if (++asks <= 2) return '{"calls":{"Act":{"Mara":{"action":"hums a tune"}}},"then":["Does anyone hear the tune?"]}'; throw new Error('the model did not answer'); };
  await line('I wait 7 minutes and hum a tune.', fails).catch(() => {});
  if (T.storyTime() !== 600) { miss++; console.log(`MISS a pass that fails after its calls ran takes them back: ${T.storyTime()} (600)`); }
  // One stopped because another chat was opened keeps them in its own chat, and runs once when sent again there.
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Mara sits by the fire.', swipe_id: 0 }];
  const home = ctx.chatMetadata; asks = 0;
  const away = async () => { if (++asks <= 2) return '{"calls":{"Act":{"Mara":{"action":"hums a tune"}}},"then":["Does anyone hear the tune?"]}'; ctx.chatMetadata = {}; return '{"calls":{}}'; };
  await line('I wait 7 minutes and hum a tune.', away).catch(() => {}); ctx.chatMetadata = home; const failed = T.storyTime();
  T.onRulesGenerationStarted('normal'); await Q.runQuestionPass(ctx.chat, none, '', undefined, async () => null);
  ctx.name1 = undefined;
  if (failed !== 607 || T.storyTime() !== 607) { miss++; console.log(`MISS a line whose pass failed after its calls ran runs once when sent again: ${failed}, then ${T.storyTime()} (607)`); }
}
// R45: a head-first landing counts one storey (3.6 m) higher below the first row, as soft ground one lower: no 44 % from
// 1.5 m; rule 576's rows from 12 m; head first on soft ground is the row itself.
{
  const BE = await import('../src/rules/body-engine.js'), hf = h => BE.fallDeathChance(h, { headFirst: true });
  const both = [8, 12, 15.6].map(h => BE.fallDeathChance(h, { headFirst: true, soft: true }) === BE.fallDeathChance(h));
  if (hf(1.5) !== 0 || Math.abs(hf(8) - 0.4107) > 0.001 || hf(11.9) !== 0.44 || hf(12) !== 0.56 || hf(15.6) !== 0.78 || both.includes(false)) { miss++; console.log(`MISS head-first falls: 1.5 m ${hf(1.5)}, 8 m ${hf(8)}, 11.9 m ${hf(11.9)}, 12 m ${hf(12)}, 15.6 m ${hf(15.6)}; both flags as neither ${both}`); }
}
// R46: past the last 30 messages, player lines and tool messages let go of the worlds they held; replies keep theirs.
{
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Start.', swipe_id: 0 }];
  for (let i = 0; i < 20; i++) { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: `I wait ${i + 1} minutes.` }); await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null); ctx.chat.push({ is_user: false, mes: 'ok', swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); }
  ctx.name1 = undefined;
  const held = k => ['rulesWorld', 'rulesLog', 'rulesStart', 'rulesPass'].filter(x => ctx.chat[k].extra?.[x] !== undefined).join();
  const end = ctx.chat.length - 1, old = ctx.chat.slice(0, end - 30).map((m, k) => m.is_user && held(k)).filter(Boolean);
  if (old.length || held(end - 1) !== 'rulesWorld,rulesLog,rulesStart,rulesPass' || !ctx.chat.every((m, k) => m.is_user || ctx.chat[k].extra?.rulesWorld)) { miss++; console.log(`MISS old player lines let go of their worlds, replies keep theirs: ${old.join(' | ')}; latest line ${held(end - 1)}`); }
}
// R51: a line's pass and its draws follow its words, not its place: after an earlier turn is deleted, a swipe of a
// correction's reply replays the correction as it was, with the same outcome, and asks the model nothing; a correction
// edited and its reply swiped is read again against the line before it (SillyTavern's chat still holds the reply).
{
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  let asks = 0;
  const none = async () => { asks++; return '{"calls":{}}'; };
  const scene = async () => { fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 }); ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }]; };
  const line = async (mes, plan, choose = async () => null) => { T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes }); await Q.runQuestionPass(ctx.chat, plan, '', undefined, choose); };
  const reply = mes => { ctx.chat.push({ is_user: false, name: 'Narrator', mes, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1); };
  const body = who => JSON.stringify(ctx.chatMetadata.rulesEngine.state.people[who].wounds ?? []);
  await scene(); await line('I wait 10 minutes.', none); reply('10 min. Tom and Will still stand at the bar.');
  await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.');
  await line('no, Will', hit); reply('Jack hits Will.');
  const will = body('Will');
  ctx.chat.splice(1, 2); T.syncRulesToChat(); T.onRulesGenerationStarted('swipe'); asks = 0;
  await Q.runQuestionPass(ctx.chat.slice(0, -1), none, '', undefined, async () => null);
  if (body('Tom') !== '[]' || body('Will') !== will || will === '[]' || !/it meant Will/.test(Q.redoneBy() ?? '') || asks) { miss++; console.log(`MISS a correction swiped after an earlier turn is deleted replays as it was: Tom ${body('Tom')}, Will ${body('Will')} (before ${will}), redone ${Q.redoneBy()}, asked ${asks}`); }
  await scene(); await line('I hit him.', hit, async (q, opts) => opts.find(o => /Tom/.test(o))); reply('Jack hits Tom.');
  await line('no, Will', hit); reply('Jack hits Will.');
  ctx.chat[3].mes = 'no, Will!'; T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), hit, '', undefined, async () => null);
  ctx.name1 = undefined;
  if (body('Tom') !== '[]' || body('Will') === '[]') { miss++; console.log(`MISS an edited correction swiped corrects the line before: Tom ${body('Tom')}, Will ${body('Will')}`); }
}
// R52: replies past the last 30 messages keep the world of the swipe shown only.
{
  fresh(); T.setStoryTime(600);
  ctx.chat = [{ is_user: false, mes: 's0', swipe_id: 1, extra: { rulesResult: { 0: { a: 1 }, 1: { a: 2 } }, rulesLog: { 0: 1, 1: 2 } } }];
  for (let i = 1; i <= 35; i++) ctx.chat.push({ is_user: true, mes: `m${i}` });
  ctx.chat.push({ is_user: false, mes: 'last', swipe_id: 0, extra: { rulesResult: { 0: { a: 3 }, 1: { a: 4 } }, rulesLog: { 0: 3, 1: 4 } } });
  T.keepResult(35);
  const old = ctx.chat[0].extra, last = ctx.chat.at(-1).extra;
  if (Object.keys(old.rulesResult).join() !== '1' || old.rulesResult[1].a !== 2 || Object.keys(old.rulesLog).join() !== '1' || Object.keys(last.rulesResult).join() !== '0,1') { miss++; console.log(`MISS old replies keep the shown swipe's world only: ${JSON.stringify(old)}; latest ${JSON.stringify(last)}`); }
}
// R53: the full-thickness threshold and the drowning band 5.5–10 min are registered judgements: a burn near the threshold
// says it is fragile, and the band reruns over its range.
{
  fresh(); await run('NewCharacter', { who: 'Mara', sex: 'female', age: 30 });
  const burn = String(await run('BodyContact', { who: 'Mara', regions: ['right hand'], material: 'water', temp_c: 68, seconds: 10 }));
  const C = await import('../src/rules/constants.js'), BE = await import('../src/rules/body-engine.js'), d = C.REGISTRY_K.get('drownMidGood');
  const varied = await C.withOverride('drownMidGood', 0.3, () => BE.drownedGoodOutcome(7));
  if (!/Fragile[^]*fullBurnOmega/.test(burn) || d?.status !== 'assumed' || BE.drownedGoodOutcome(7) !== d.value || varied !== 0.3 || d.range?.join() !== '0.137,0.337') { miss++; console.log(`MISS registered burn threshold and drowning band: ${burn.slice(-200)}; ${JSON.stringify(d)}`); }
}
// R54: no hidden tag character goes out to a model: the engine's own requests, and a tool's result.
{
  const S = await import('../src/send.js'), VC = await import('../src/rules/voice-code.js');
  let sent = '';
  ctx.generateRaw = async o => { sent = o.systemPrompt + o.prompt; return 'ok'; };
  await S.sendModel('Rules' + VC.block(['L']), 'Card: Tom' + VC.block(['Q']) + String.fromCodePoint(0xE0001) + '.');
  delete ctx.generateRaw;
  fresh(); T.setStoryTime(600);
  const fact = String(await run('RecordFact', { fact: 'The bell' + VC.block(['L']) + ' tolls.', common_knowledge: true }));
  if (/[\u{E0000}-\u{E007F}]/u.test(sent) || sent !== 'RulesCard: Tom.' || /[\u{E0000}-\u{E007F}]/u.test(fact)) { miss++; console.log(`MISS no tag character reaches a model: ${JSON.stringify(sent)}; ${JSON.stringify(fact)}`); }
}
// R55: "him" with two men named before it in the line is asked about between them; with one, it is him.
{
  const A = await import('../src/rules/ask.js');
  const ppl = [{ name: 'Tom', sex: 'male' }, { name: 'Will', sex: 'male' }, { name: 'Bob', sex: 'male' }, { name: 'Ann', sex: 'female' }];
  const asked = t => (A.openQuestion(t, 'Jack', ppl, () => true)?.options.map(o => o.label) ?? []).sort().join();
  const two = ['I look at Tom and Will, then I punch him.', 'Tom and Will stand there. I punch him.'].filter(t => asked(t) !== 'Punch Tom,Punch Will');
  if (two.length || asked('I look at Tom and Ann. I punch him.') || asked('I look at Tom. I punch him.')) { miss++; console.log(`MISS him with two named in the line is asked: ${two.join(' | ')}; ${asked('I look at Tom and Ann. I punch him.')}`); }
}
// A line edited in place into a correction ("I wait 5 minutes." → "no, Will") keeps the world the correction put back as its
// start, so a swipe of its reply does not bring the corrected blow back.
{
  fresh(); ctx.name1 = 'Jack'; for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const hit = async () => JSON.stringify({ calls: [{ tool: 'BodyStrike', args: { attacker: 'Jack', who: 'Tom', attack: 'punch' } }] });
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'Tom and Will stand at the bar.' }];
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I hit him.' });
  await Q.runQuestionPass(ctx.chat, hit, '', undefined, async (q, o) => o.find(x => /Tom/.test(x)));
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Tom.', swipe_id: 0 }); T.onRulesMessageReceived(2);
  T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: 'I wait 5 minutes.' });
  await Q.runQuestionPass(ctx.chat, async () => '{"calls":{}}', '', undefined, async () => null);
  ctx.chat[3].mes = 'no, Will';
  T.onRulesGenerationStarted('normal'); await Q.runQuestionPass(ctx.chat, hit, '', undefined, async () => null);
  ctx.chat.push({ is_user: false, name: 'Narrator', mes: 'Jack hits Will.', swipe_id: 0 }); T.onRulesMessageReceived(4);
  T.onRulesGenerationStarted('swipe'); await Q.runQuestionPass(ctx.chat.slice(0, -1), hit, '', undefined, async () => null);
  ctx.name1 = undefined;
  const w = who => ctx.chatMetadata.rulesEngine.state.people[who].wounds?.length ?? 0;
  if (w('Tom') !== 0 || w('Will') !== 1) { miss++; console.log(`MISS a line edited into a correction keeps the world it put back: Tom ${w('Tom')}, Will ${w('Will')}`); }
}
// A tool that waits (the day's sky, the weather, a bleed, chemistry data) writes nothing into a chat opened during the wait.
{
  const C = await import('../src/rules/clock.js');
  const inner = globalThis.fetch; let hold = false, release; const gate = new Promise(r => { release = r; });
  globalThis.fetch = async (u, o) => /^https?:/.test(String(u)) ? (hold && await gate, { ok: false, status: 503, json: async () => null, text: async () => '' }) : inner(u, o);
  fresh(); await run('NewCharacter', { who: 'Wit', sex: 'female', age: 30 });
  T.setStoryTime(C.parseStoryTime('1990-07-15 21:00')); T.setScenePosition(51.5, -0.12); await new Promise(r => setTimeout(r, 10));
  hold = true;
  const p = run('Look', { viewer: 'Wit', kind: 'a person', distance_m: 20, target: 'a man' });
  await new Promise(r => setTimeout(r, 10));
  const other = {}; ctx.chatMetadata = other; ctx.chat = [{ is_user: true, mes: 'another chat' }];
  release(); await p.catch(() => {}); globalThis.fetch = inner;
  if (other.rulesEngine) { miss++; console.log(`MISS a waiting tool writes nothing into another chat: ${JSON.stringify(Object.keys(other.rulesEngine.state?.people ?? {}))}`); }
}
// The rule check's note and flags belong to the turn they were made for: a redo that never started gives them to no other chat.
{
  const RA = await import('../src/rules/rules-audit.js'), AF = await import('../src/rules/audit-flags.js');
  ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'I climb the wall.' }, { is_user: false, mes: 'Mara scales the wall.', swipe_id: 0 }];
  await RA.onRulesAuditMessage(1, { send: async () => '{"events":[{"quote":"Mara scales the wall","tool":"BodyCheck","problem":"unbacked"}]}', ownsChat: () => true, generate: () => {}, toast: () => {} });
  ctx.chatMetadata = {}; ctx.chat = [{ is_user: true, mes: 'Hello there.' }];
  const note = RA.takeAuditNote(), flags = AF.takeFlags('1:x');
  if (note || flags.length) { miss++; console.log(`MISS a rule-check note stays with its turn: ${note}; flags ${JSON.stringify(flags)}`); }
}
// PassTime stops at the second a knocked-out or choked person comes to (koLeft 0.3 min: 18 s), as at other thresholds.
{
  fresh(); await run('NewCharacter', { who: 'Kit', sex: 'male', age: 30 });
  Object.assign(ctx.chatMetadata.rulesEngine.state.people.Kit, { unconscious: 'choked', koLeft: 0.3 });
  const out = String(await run('PassTime', { minutes: 5 }));
  if (!/after 0 min 18 s of 5 minutes: Kit comes to/.test(out)) { miss++; console.log(`MISS PassTime stops when a person comes to: ${out.slice(0, 120)}`); }
}
// Each reply's world is kept in the chat's archive as the changes from the world kept before it: a reply holds an id, and a
// deletion anywhere, a deletion back to a reply, or a branch rebuilds each world exactly (the chat had held a whole world per
// reply: 1.09 MB at 120 turns).
{
  fresh(); T.setStoryTime(600); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, mes: 'Start.', swipe_id: 0 }];
  for (const who of ['Tom', 'Will']) await run('NewCharacter', { who, sex: 'male', age: 30 });
  const plans = [{ calls: [{ tool: 'PassTime', args: { minutes: 3 } }] }, { calls: [{ tool: 'BodyStrike', args: { attacker: 'Tom', who: 'Will', attack: 'punch' } }] }, { calls: [{ tool: 'RecordFact', args: { fact: 'The bell tolls.' } }] }];
  const at = [];
  for (let t = 1; t <= 30; t++) {
    T.onRulesGenerationStarted('normal'); ctx.chat.push({ is_user: true, mes: `Line ${t}.` });
    await Q.runQuestionPass(ctx.chat, async () => JSON.stringify({ ...plans[t % 3], calls: plans[t % 3].calls.map(c => c.tool === 'RecordFact' ? { ...c, args: { fact: `The bell tolls ${t} times.` } } : c) }), '', undefined, async () => null);
    ctx.chat.push({ is_user: false, mes: `Reply ${t}.`, swipe_id: 0 }); T.onRulesMessageReceived(ctx.chat.length - 1);
    at.push(JSON.stringify(ctx.chatMetadata.rulesEngine.state));
  }
  ctx.name1 = undefined;
  const whole = ctx.chat.filter(m => m.extra?.rulesResult).length, ids = ctx.chat.filter(m => !m.is_user && !m.extra?.rulesWorld).length, worlds = Object.values(ctx.chatMetadata.rulesEngine.worlds ?? {});
  const branch = { meta: structuredClone(ctx.chatMetadata), chat: structuredClone(ctx.chat.slice(0, 2 * 12 + 1)) };
  ctx.chat.splice(2 * 5, 2); T.syncRulesToChat();
  const afterMid = JSON.stringify(ctx.chatMetadata.rulesEngine.state) === at[29];
  ctx.chat.splice(2 * 20 - 1); T.syncRulesToChat();
  const backTo20 = JSON.stringify(ctx.chatMetadata.rulesEngine.state) === at[19];
  ctx.chatMetadata = branch.meta; ctx.chat = branch.chat; T.syncRulesToChat();
  const branched = JSON.stringify(ctx.chatMetadata.rulesEngine.state) === at[11];
  if (whole || ids || worlds.filter(w => w.full).length > 2 || !afterMid || !backTo20 || !branched) { miss++; console.log(`MISS replies keep their worlds as changes, rebuilt exactly: whole ${whole}, replies without an id ${ids}, full ${worlds.filter(w => w.full).length} of ${worlds.length}; after a mid-chat deletion ${afterMid}, back to reply 20 ${backTo20}, a branch at 12 ${branched}`); }
}
// The tools' words fit the scene (scene-fit.ts): an 1300 scene without magic is shown no modern dress, drug, treatment,
// survey or coin out of circulation, no spell and no battle tool, in the planner's catalogue, its schema and the narrator's
// brief; a 1990 scene in Chicago is shown them; a world with magic is shown adamantine and CastSpell. The narrator, when it
// calls the tools itself, is offered the tools the router finds in the player's line, fitted the same way.
{
  const { tools: registered } = await import('../tools/st-harness.mjs');
  const P = await import('../src/rules/plan-schema.js'), Wb = await import('../src/rules/world.js');
  const read = () => `${Q.toolCatalogue()}\n${JSON.stringify(P.planSchema())}\n${T.rulesBrief?.() ?? T.RULES_BRIEF}`;
  const MODERN = /sneakers|bra\+panty|panty hose|antibiotics|hyperbaric|Midazolam|Propofol|homosexuality|SARS|an asphalt road|gunshot|living room|dorm lounge|movies|condemn outright|welder|"Battle"|Battle:|NameCharacter|handgun|after surgery|halfpenny|Gold Coast/;
  fresh(); T.setStoryTime(C.parseStoryTime('1300-06-01 12:00'));
  const old = read(), oldHits = old.match(new RegExp(MODERN.source, 'g')) ?? [];
  const magicOff = !/adamantine|CastSpell/.test(old);
  fresh(); T.setStoryTime(C.parseStoryTime('1990-06-01 12:00')); ctx.chatMetadata.rulesEngine.state.setting = { place: 'chicago', label: 'Chicago', country: 'United States of America' };
  const now = read(), lacking = ['sneakers', 'antibiotics', 'Midazolam', 'an asphalt road', 'gunshot', 'NameCharacter', 'handgun', 'after surgery'].filter(w => !now.includes(w));
  ctx.chatMetadata.rulesEngine.state.setting.country = 'Brazil';
  const brazil = !!T.fittedTool && !T.fittedTool('NameCharacter');
  const book = Wb.CURRENT_BOOK.splice(0), magic = (Wb.CURRENT_BOOK.push({ what: 'sorcery', kind: 'magic' }), /adamantine/.test(JSON.stringify(P.planSchema())) && /CastSpell/.test(T.rulesBrief?.() ?? T.RULES_BRIEF));
  Wb.CURRENT_BOOK.splice(0, Wb.CURRENT_BOOK.length, ...book);
  if (oldHits.length || !magicOff || lacking.length || !brazil || !magic) { miss++; console.log(`MISS tool words fit the scene: in 1300 ${[...new Set(oldHits)].join(', ')}${magicOff ? '' : ', magic'}; 1990 lacks ${lacking.join(', ')}; NameCharacter dropped in Brazil ${brazil}; magic shown with a magic world ${magic}`); }
  // The narrator's tools: "I punch Tom." in 1300 offers BodyStrike and the tools every turn may need, BodyEnvironment's
  // arguments without the measured ensembles, and no Weather.
  fresh(); T.setStoryTime(C.parseStoryTime('1300-06-01 12:00')); ctx.chat = [{ is_user: true, mes: 'I punch Tom.' }];
  const offered = []; for (const t of registered.values()) if (await t.shouldRegister()) offered.push(t.name);
  const env = registered.get('BodyEnvironment'); ctx.chat = [{ is_user: true, mes: 'I wade into the icy river in my coat.' }];
  const envShown = await env.shouldRegister() && !('ensemble' in env.parameters.properties);
  if (!offered.includes('BodyStrike') || offered.includes('Weather') || offered.length > 6 || !envShown) { miss++; console.log(`MISS the narrator's tools fit the line and the scene: ${offered.join(', ')}; BodyEnvironment without ensembles ${envShown}`); }
  // A condemned act is named in the scene's words; the survey's list goes back only when the words match none.
  fresh(); T.setStoryTime(C.parseStoryTime('2018-06-01 12:00')); ctx.chatMetadata.rulesEngine.state.setting = { place: 'chicago', label: 'Chicago', country: 'United States of America' };
  await run('NewCharacter', { who: 'Ann', sex: 'female', age: 40 });
  const named = String(await run('SocialResponse', { situation: 'an act they see or hear of that they may condemn outright', who: 'Ann', act: 'he killed himself' }));
  const vague = String(await run('SocialResponse', { situation: 'an act they see or hear of that they may condemn outright', who: 'Ann', act: 'violence' }));
  if (!/^Ann (condemns|does not condemn) it outright/.test(named) || !/Give act as one of: .*political violence/.test(vague)) { miss++; console.log(`MISS a condemned act is named in the scene's words: ${JSON.stringify(named)} / ${vague.slice(0, 120)}`); }
}
// What the narrator reads of a result carries the outcome and its cause in words: no sensitivity note (its constant names
// and status tags), no status tag, no sound level in dB, no compound's CAS number or molar mass, no program or model name,
// no burn's death chance, no blood-loss class when no blood is lost; Weather names the cause it cannot answer.
{
  const { tools: registered } = await import('../tools/st-harness.mjs');
  const Bs = await import('../src/rules/body-sheet.js');
  fresh(); T.setStoryTime(C.parseStoryTime('1850-03-10 14:00'));
  for (const [who, sex, age] of [['Tom', 'male', 30], ['Mara', 'female', 25]]) await run('NewCharacter', { who, sex, age });
  const heard = [], say = async (n, a) => String(await registered.get(n).action(a));
  heard.push(await say('Break', { material: 'pine (eastern white)', shape: 'plank or beam', width_cm: 20, thickness_cm: 2.5, span_m: 2, load_kg: 80 }));
  heard.push((await say('Substance', { substance: 'ethanol', temp_c: 20 })));
  heard.push((await say('Communicate', { speaker: 'Tom', listener: 'Mara', means: 'speech', words: 'Wait here.' })));
  heard.push((await say('Room', { room: 'tavern', volume_m3: 200, fires: [{ fuel: 'wood', kg_per_hour: 2 }], people: 40, lining: 'wood' })));
  heard.push((await say('BodyContact', { who: 'Mara', regions: ['right hand'], material: 'water', temp_c: 68, seconds: 10 })));
  heard.push((await say('Dose', { who: 'Tom', substance: 'Epinephrine:IM', mg: 0.5 })), await say('PassTime', { minutes: 1 }), Bs.bodyBlock(Bs.trackedPeople()));
  const left = heard.join('\n').match(/Fragile|\[(?:ASSUMED|FITTED|RAW|estimated)|\bdB\b|CAS \d|g\/mol|heat of formation|\(Pulse\)|kg model|such patients die|L \(0%/g) ?? [];
  fresh(); const noDate = String(await run('Weather', { place: 'London' }));
  if (left.length || !/YYYY-MM-DD HH:MM/.test(noDate)) { miss++; console.log(`MISS the narrator reads outcomes in words: ${[...new Set(left)].join(', ')}; without a date Weather says ${noDate}`); }
}
// The scene's cues weigh a verb's senses (sense-odds.ts): "I charge the cook" starts with its readings equal; a sword in hand,
// a blow just before and an earlier "charge" read as a blow add up past senseDraftShare, and code drafts the blow; an earlier
// "charge the cook" read as a price makes Price near certain (one sense per collocation, Yarowsky 1993); the planner is told
// the readings and their cues.
{
  const O = await import('../src/rules/sense-odds.js'), F = await import('../src/rules/frame.js'), Q = await import('../src/rules/question-pass.js');
  const line = 'I charge the cook.', after = ['the', 'cook', '.'];
  const none = O.shareOf(O.senseOdds('charge', after, line, [], null) ?? [], 'BodyStrike');
  const fight = { words: line.split(' '), recentTools: ['BodyStrike'], held: ['sword'], earlier: [{ verb: 'charge', head: 'guard', tools: ['BodyStrike'] }] };
  const fightP = O.shareOf(O.senseOdds('charge', after, line, [], fight) ?? [], 'BodyStrike');
  const billed = { words: line.split(' '), recentTools: [], held: [], earlier: [{ verb: 'charge', head: 'cook', tools: ['Price'] }] };
  const billedP = O.shareOf(O.senseOdds('charge', after, line, [], billed) ?? [], 'Price');
  O.setSceneCues(fight); const drafted = F.framedCalls(line, 'Mara').calls.some(c => c.tool === 'BodyStrike'); O.setSceneCues(null);
  const plain = F.framedCalls(line, 'Mara').calls.some(c => c.tool === 'BodyStrike');
  fresh(); ctx.name1 = 'Mara'; ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'The cook wipes his hands and eyes the door.' }, { is_user: true, mes: line }];
  const prompts = [];
  await Q.runQuestionPass(ctx.chat, async (sys, user) => { prompts.push(String(user)); return JSON.stringify({ calls: {} }); }, '', undefined, async () => null);
  ctx.name1 = undefined;
  const told = prompts.some(p => /READINGS[\s\S]*"charge": [^\n]*BodyStrike \d+ %[^\n]*Price \d+ %/.test(p));
  // Each cue alone raises its reading: a weapon held, a blow just before, the scene's words its definition shares.
  const alone = c => O.shareOf(O.senseOdds('charge', after, line, [], { words: line.split(' '), recentTools: [], held: [], earlier: [], ...c }) ?? [], 'BodyStrike');
  const each = { held: alone({ held: ['sword'] }), recent: alone({ recentTools: ['BodyStrike'] }), words: alone({ words: [...line.split(' '), 'sudden', 'attack', 'battle'] }) };
  const flat = Object.entries(each).filter(([, v]) => !(v > none + 0.05)).map(([kk]) => kk);
  if (!(none < 0.3 && fightP >= 0.8 && billedP > 0.9 && drafted && !plain && told && !flat.length)) { miss++; console.log(`MISS the scene's cues weigh a verb's senses: no cues ${none.toFixed(2)}, a fight ${fightP.toFixed(2)}, billed before ${billedP.toFixed(2)}; drafted with the fight ${drafted}, without ${plain}; planner told ${told}; cues that raise nothing: ${flat.join(', ')}`); }
}
// The scene's words add the tools whose inputs they name to the planner's (cue-tools.ts): smoke in the hallway makes the
// crawl's air one, shown in full, not among the one-line others.
{
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: 'The house is on fire; thick smoke fills the hallway.' }, { is_user: true, name: 'Mara', mes: 'Mara crawls through the hallway to find Tom.' }];
  const prompts = [];
  await Q.runQuestionPass(ctx.chat, async (sys, user) => { prompts.push(String(user)); return JSON.stringify({ calls: {} }); }, '', undefined, async () => null);
  ctx.name1 = undefined;
  const full = prompts.some(p => /\nBodyEnvironment: Set the air/.test(p.split('OTHER TOOLS')[0]));
  if (!full) { miss++; console.log(`MISS the scene's words add tools to the planner's: ${prompts.map(p => p.slice(0, 200)).join(' | ')}`); }
}
// The narrator's acts offer the tools that record them (router.ts routedTools): a theft written by the narrator shows Transfer
// to the planner in full, in play and in the eval.
{
  fresh(); ctx.name1 = 'Mara';
  ctx.chat = [{ is_user: false, name: 'Narrator', mes: "Mara's fingers closed on the merchant's purse and slid it into her sleeve; he walked on without noticing." }, { is_user: true, name: 'Mara', mes: 'Mara walks to the inn.' }];
  const prompts = [];
  await Q.runQuestionPass(ctx.chat, async (sys, user) => { prompts.push(String(user)); return JSON.stringify({ calls: {} }); }, '', undefined, async () => null);
  ctx.name1 = undefined;
  const { runEval } = await import('../src/rules/eval.js');
  const { EVAL_SCENES } = await import('../src/rules/eval-scenes.js');
  const asked = []; fresh();
  await runEval(async (sys, user) => { asked.push(String(user)); return sys === Q.PICK_SYSTEM ? '{"tools":[]}' : '{"calls":{}}'; }, [EVAL_SCENES.find(x => x.id === 55)]);
  const full = ps => ps.some(p => /\nTransfer: Record an item/.test(p.split('OTHER TOOLS')[0]));
  if (!full(prompts) || !full(asked)) { miss++; console.log(`MISS the narrator's acts offer their recording tools: play ${full(prompts)}, eval ${full(asked)}`); }
}
// The eval offers tools as play does (eval.ts): the router's and the scene's when the router routes, the picker otherwise.
{
  const { runEval } = await import('../src/rules/eval.js');
  const { EVAL_SCENES } = await import('../src/rules/eval-scenes.js');
  let picks = 0; const send = async (sys) => { if (sys === Q.PICK_SYSTEM) { picks++; return '{"tools":[]}'; } return '{"calls":{}}'; };
  fresh(); await runEval(send, [EVAL_SCENES.find(x => x.id === 1)]);
  const routed = picks;
  fresh(); await runEval(send, [EVAL_SCENES.find(x => x.id === 43)]);
  if (routed !== 0 || picks !== 1) { miss++; console.log(`MISS the eval offers tools as play does: picker asked ${routed} time(s) on a routed line, ${picks - routed} on a line with no verb routed`); }
}
// Where people stand is the state's (rules-tools.ts placed): the map's distance is kept over a given one, a shut wall stops a
// blow, a hold needs the holder's reach, and a source on the map sets a sound's distance and wall.
{
  const LV = 'on the level, stairs or a change of posture';
  fresh();
  await run('Layout', { spots: [{ spot: 'bar', x_m: 1, y_m: 1, room: 'taproom' }, { spot: 'stool', x_m: 1.5, y_m: 1, room: 'taproom' }, { spot: 'hearth', x_m: 7, y_m: 1, room: 'taproom' }, { spot: 'larder', x_m: 11, y_m: 1, room: 'larder' }],
    rooms: [{ room: 'taproom', corners: [[0, 0], [9, 0], [9, 4], [0, 4]] }, { room: 'larder', corners: [[9, 0], [13, 0], [13, 4], [9, 4]] }] });
  for (const [w, at] of [['Mara', 'bar'], ['Ned', 'stool'], ['Tom', 'hearth'], ['Cook', 'larder']]) await run('Act', { level: LV, who: w, steps: [{ do: 'be_at', to: at }] });
  const far = String(await run('BodyStrike', { who: 'Tom', attacker: 'Mara', attack: 'punch' }));
  const told = String(await run('BodyStrike', { who: 'Tom', attacker: 'Mara', attack: 'punch', distance_m: 0.5 }));
  const nearBy = String(await run('BodyStrike', { who: 'Ned', attacker: 'Mara', attack: 'punch' }));
  const walled = String(await run('BodyStrike', { who: 'Cook', attacker: 'Mara', attack: 'punch' }));
  const hold = String(await run('BodyChoke', { who: 'Tom', holder: 'Mara', seconds: 5 })), holdNear = String(await run('BodyChoke', { who: 'Ned', holder: 'Mara', seconds: 5 }));
  const seen = String(await run('Look', { viewer: 'Mara', kind: 'a person', target: 'Tom', target_who: 'Tom', distance_m: 2 }));
  const spoken = String(await run('Communicate', { speaker: 'Mara', listener: 'Tom', means: 'speech', message: 'Come here.', distance_m: 1 }));
  const heard = String(await run('Listen', { listener: 'Ned', sound: 'quiet conversation (50 dB at 1 m)', source_who: 'Cook' }));
  // A handgun shot at 1 m hits 99.6 % of the time, at 300 m 0.0 % (feats.ts handgunHitChance): the map's 0.5 m decides it.
  const shot = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Mara', task: 'shoot Ned', shot_m: 300, shot_at: 'Ned' }));
  const shotWall = String(await run('BodyCheck', { task_kind: OWN_KIND, who: 'Mara', task: 'shoot the cook', shot_m: 3, shot_at: 'Cook' }));
  ctx.chat[0].mes = 'chase at 6 m'; const chase6 = String(await run('Chase', { pursuer: 'Mara', fleeing: 'Tom', fleeing_age: 85, gap_m: 6 }));
  ctx.chat[0].mes = 'chase at 20 m'; const chase20 = String(await run('Chase', { pursuer: 'Mara', fleeing: 'Tom', gap_m: 20 }));
  const bad = [
    !/stays out of reach \(6 m\)/.test(far) || !/On the map Mara stands at bar and Tom at hearth/.test(far) ? `far: ${far}` : '',
    !/map distance 6 m kept; 0\.5 m ignored/.test(told) || !/stays out of reach/.test(told) ? `told: ${told}` : '',
    /stays out of reach|map distance/.test(nearBy) ? `near: ${nearBy}` : '',
    !/^A wall stands between Mara and Cook: taproom and larder/.test(walled) ? `walled: ${walled}` : '',
    !/6 m apart on the map: no hold/.test(hold) || /no hold/.test(holdNear) ? `hold: ${hold} | ${holdNear}` : '',
    !/target at 6 m.*map distance 6 m kept; 2 m ignored/.test(seen) ? `look: ${seen}` : '',
    !/voice at 6 m.*map distance 6 m kept; 1 m ignored/.test(spoken) ? `speech: ${spoken}` : '',
    !/at 9\.5 m.*through plaster wall/.test(heard) ? `listen: ${heard}` : '',
    !/SUCCESS/.test(shot) || !/map distance 0\.5 m kept; 300 m ignored/.test(shot) || !/^A wall stands between Mara and Cook/.test(shotWall) ? `shot: ${shot} | ${shotWall}` : '',
    !/catches Tom after/.test(chase6) || chase20 !== `${chase6} (map distance 6 m kept; 20 m ignored)` ? `chase: ${chase6} | ${chase20}` : '',
  ].filter(Boolean);
  if (bad.length) { miss++; console.log(`MISS where people stand is the state's:\n  ${bad.join('\n  ')}`); }
}
// Water cooled below its melting point freezes only once ice starts in it (freezing.ts): the same water at −1 °C stays liquid as
// a cloud droplet and freezes as a litre; ice it touches freezes it at once; a clean 10 µm droplet holds for 1 s to between −36
// and −38 °C (Koop et al. 2000); 0.05 mL drops of snowmelt freeze half at −12.4 °C (Brennan et al. 2020: −12.5 on average).
{
  const F = await import('../src/rules/freezing.js');
  const N = F.CONTENTS[0], CLEAN = F.CONTENTS[1], ICE = F.CONTENTS[2], drop10 = 4 / 3 * Math.PI * (5e-4) ** 3;
  const p = (c, ml, s, kind) => F.freezeChance(c, ml, s, kind).p;
  const bad = [
    Math.abs(F.iceMeltK() - 273.15) > 0.005 ? `melting point ${F.iceMeltK()} K` : '',
    !(p(-1, 5e-10, 60, N) < 1e-9 && p(-1, 1000, 60, N) > 0.99) ? `−1 °C: droplet ${p(-1, 5e-10, 60, N)}, litre ${p(-1, 1000, 60, N)}` : '',
    p(-1, 50, 60, ICE) !== 1 || p(0.5, 1000, 60, ICE) !== 0 ? `touching ice: ${p(-1, 50, 60, ICE)} at −1 °C, ${p(0.5, 1000, 60, ICE)} at 0.5 °C` : '',
    !(p(-36, drop10, 1, CLEAN) < 0.5 && p(-38, drop10, 1, CLEAN) > 0.5) ? `clean droplet: ${p(-36, drop10, 1, CLEAN)} at −36 °C, ${p(-38, drop10, 1, CLEAN)} at −38 °C` : '',
    !(p(-12.3, 0.05, 60, N) < 0.5 && p(-12.5, 0.05, 60, N) > 0.5) ? `snowmelt wells: ${p(-12.3, 0.05, 60, N)} at −12.3 °C, ${p(-12.5, 0.05, 60, N)} at −12.5 °C` : '',
  ].filter(Boolean);
  const sub = async (a) => { ctx.chat[0].mes = `water ${JSON.stringify(a)}`; return String(await run('Substance', a)); };
  const open = await sub({ substance: 'water', temp_c: -1 }), cloud = await sub({ substance: 'water', temp_c: -1, volume_ml: 5e-10 });
  const bucket = await sub({ substance: 'water', temp_c: -10, volume_ml: 10000 }), benz = await sub({ substance: 'benzene', temp_c: 0 });
  if (!/stays liquid until ice starts in it/.test(open) || /: solid \(/.test(open)) bad.push(`no volume: ${open}`);
  if (!/STAYS LIQUID/.test(cloud)) bad.push(`cloud droplet: ${cloud}`);
  if (!/FREEZES\. 13 % turns to ice at once/.test(bucket)) bad.push(`bucket: ${bucket}`);
  if (!/solid once crystallised; a melt cooled below its melting point stays liquid/.test(benz)) bad.push(`benzene: ${benz}`);
  if (bad.length) { miss++; console.log(`MISS water freezes once ice starts in it:\n  ${bad.join('\n  ')}`); }
}
// N71: the world and a memory are two records. A false detail taken in stands in the witness's memory for the event's fact,
// marked with what the world holds, while the event's other witness keeps the world's; her memory card shows her own; a
// message is marked as said; the world's own record of the same words makes them the world's.
{
  const K = await import('../src/rules/knowledge.js'), Vw = await import('../src/rules/views.js');
  const bad = [];
  let taken = null;
  for (let i = 0; i < 60 && !taken; i++) {
    fresh(); ctx.chat[0].mes = `two records ${i}`; await run('BodyWound', { who: 'Mara', part: 'upper body', type: 'blunt' });
    T.setStoryTime(Date.UTC(1890, 0, 1) / 60000);
    await run('RecordFact', { fact: 'The baker asked 4 shillings for the bread', known_by: ['Mara', 'Baker'], how: 'saw it', importance: 3 });
    const r = String(await run('SocialResponse', { situation: 'told a false detail about an event they saw', who: 'Mara', speaker: 'Innkeeper', statement: 'The baker asked 2 shillings for the bread', event_fact: 'The baker asked 4 shillings for the bread' }));
    if (/now remembers it/.test(r)) taken = ctx.chatMetadata.rulesEngine.state;
  }
  const kb = taken ? K.knowledgeBlock(taken) : '';
  const mara = kb.split('\n').find(l => l.startsWith('Mara:')) ?? '', baker = kb.split('\n').find(l => l.startsWith('Baker:')) ?? '';
  if (!/2 shillings[^|]*\[the world holds otherwise: The baker asked 4 shillings for the bread\]/.test(mara) || /\(saw it\)$|4 shillings for the bread \(saw it\) \|/.test(mara)) bad.push(`her line: ${mara}`);
  if (!/^Baker: The baker asked 4 shillings for the bread( \(saw it\))?$/.test(baker)) bad.push(`his line: ${baker}`);
  const card = taken ? Vw.memoryOf(taken, 'Mara').map(r => r.text) : [];
  if (!(card.length === 1 && /2 shillings/.test(card[0]))) bad.push(`her card: ${JSON.stringify(card)}`);
  const st = { clock: { t: 0, add: 0 }, people: {} };
  K.learn(st, 'the watchman walks the round at ten', ['Innkeeper', 'Mara'], false, { Mara: 'told by Innkeeper' }, 'said');
  const said = K.knowledgeBlock(st);
  K.learn(st, 'the watchman walks the round at ten', ['Watchman'], false, {}, 'world');
  const items = K.knowledgeBlock(st).split('\n').slice(2).join('\n');
  if (!/at ten( \(told by (Innkeeper|someone)\))? \[as said\]/.test(said) || /\[as said\]/.test(items)) bad.push(`a saying: ${said}\n  recorded by the world: ${items}`);
  if (bad.length) { miss++; console.log(`MISS two records, the world and a memory:\n  ${bad.join('\n  ')}`); }
}
// N72: met with what the world holds, a memory the world holds otherwise gives way 63 % of the time (Blank & Launay 2014: of
// the 24.6 points a false detail added, 9.1 were left after a warning); kept, they hold both. 100 witnesses: the bounds
// 0.44–0.82 sit 4 SD out (SD 0.048).
{
  const K = await import('../src/rules/knowledge.js');
  let gave = 0, kept = 0, shownBoth = true;
  for (let i = 0; i < 400 && gave + kept < 100; i++) {
    fresh(); ctx.chat[0].mes = `receipt ${i}`; await run('BodyWound', { who: 'Mara', part: 'upper body', type: 'blunt' });
    T.setStoryTime(Date.UTC(1890, 0, 1) / 60000);
    await run('RecordFact', { fact: 'The baker asked 4 shillings for the bread', known_by: ['Mara'], how: 'saw it', importance: 3 });
    const r = String(await run('SocialResponse', { situation: 'told a false detail about an event they saw', who: 'Mara', speaker: 'Innkeeper', statement: 'The baker asked 2 shillings for the bread', event_fact: 'The baker asked 4 shillings for the bread' }));
    if (!/now remembers it/.test(r)) continue;
    const c = String(await run('SocialResponse', { situation: 'sees, reads or hears something that shows what they remember is wrong', who: 'Mara', statement: 'the baker asked 2 shillings', shown: 'The receipt reads 4 shillings' }));
    const line = K.knowledgeBlock(ctx.chatMetadata.rulesEngine.state).split('\n').find(l => l.startsWith('Mara:')) ?? '';
    if (/gives way/.test(c)) { gave++; if (/2 shillings/.test(line) || !/4 shillings for the bread/.test(line)) shownBoth = false; }
    else if (/still remembers it their own way/.test(c)) { kept++; if (!/2 shillings/.test(line) || !/receipt reads 4 shillings/.test(line)) shownBoth = false; }
  }
  if (!(gave + kept === 100 && gave / 100 > 0.44 && gave / 100 < 0.82 && shownBoth)) { miss++; console.log(`MISS a memory meets the world: gave way ${gave}, kept ${kept}, lines right ${shownBoth}`); }
}
// N73: a fact met in a place comes back more often while its knower stands there (Smith & Vela 2001, d = 0.28 on the probit),
// and fades again when they leave: 2000 people, two years on, importance 5.
{
  const K = await import('../src/rules/knowledge.js'), Ac = await import('../src/rules/acoustics.js');
  const names = Array.from({ length: 2000 }, (_, i) => `q${i}`), st = { clock: { t: 0, add: 0 }, people: Object.fromEntries(names.map(n => [n, { at: 'the yard' }])) };
  const f = K.learn(st, 'the key is under the third stone', names); f.imp = 5;
  st.clock.add = 2 * 525960;
  const share = at => { for (const n of names) st.people[n].at = at; return names.filter(n => K.recalls(st, f, n)).length / names.length; };
  const away = share('the kitchen'), there = share('the yard'), back = share('the kitchen');
  for (const n of names) st.people[n].at = 'the kitchen';
  const s = K.recallStrength(st, f, 'q0'); st.people.q0.at = 'the yard';
  const lifted = K.recallStrength(st, f, 'q0'), z = x => { let lo = -8, hi = 8; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (Ac.phi(m) < x) lo = m; else hi = m; } return (lo + hi) / 2; };
  if (!(there > away + 0.05 && back === away && Math.abs(z(lifted) - z(s) - 0.28) < 0.01)) { miss++; console.log(`MISS the place's cue: away ${away}, there ${there}, after leaving ${back}, probit shift ${z(lifted) - z(s)}`); }
}
// N74: breath mists where the mix of breath and air passes saturation (tells.ts breathMists, the mixing-line test): at 2 °C
// and 80 %, at 10 °C and 60 %; at 20 °C and 50 % and at 25 °C and 90 %, it does not.
{
  const Tl = await import('../src/rules/tells.js');
  const got = [Tl.breathMists(2, 80), Tl.breathMists(10, 60), Tl.breathMists(20, 50), Tl.breathMists(25, 90)];
  if (JSON.stringify(got) !== '[true,true,false,false]') { miss++; console.log(`MISS breath mists in cold air: ${JSON.stringify(got)}`); }
}
// N75: a kind's tells (tells.ts, TrueNature, Look, Touch), with a kind of this project's own (the drowned who come back on
// the third day): one of the kind shows the sign and anyone else the ordinary, whatever they want; a tell that needs breath
// to mist shows only in air where it would; a sign too small for the light and distance stays unseen; a tell unknown to the
// world stays out of [WORLD]; who truly is what is a secret kept by its keeper.
{
  const Wb = await import('../src/rules/world.js');
  const RET = { what: 'the returned', kind: 'people', worldwide: true, cause: 'Since 1871 some of the drowned walk out of the sea on the third day, with the same face and the same memories up to the water.', reaches: ['religion and folklore', 'law and government', 'daily life'], reflections: ['The law gives the returned their names back.'],
    tells: [{ sign: 'his breath leaves no mist', ordinary: 'his breath mists', sense: 'sight', size_m: 0.2, when: 'when breath would mist', known: true },
      { sign: 'salt has dried at the corners of his mouth', ordinary: 'his lips are clean of salt', sense: 'sight', size_m: 0.002, known: true },
      { sign: 'his skin is as cold as the sea', ordinary: 'his skin is warm', sense: 'touch', known: false }] };
  const bad = [];
  if (Wb.checkEntry(RET).errors.length || !Wb.checkEntry({ ...RET, tells: [{ sign: 'x', ordinary: 'y', sense: 'sight' }] }).errors.some(e => /size_m/.test(e))) bad.push('the entry check');
  Wb.applyWorld([RET]);
  const wb = Wb.worldBlock([RET]);
  if (!/Signs known to all: his breath leaves no mist \(his breath mists in anyone else\); salt has dried at the corners of his mouth/.test(wb) || /cold as the sea/.test(wb)) bad.push(`[WORLD]: ${wb}`);
  const ferry = async (truly, air, dist, light) => {
    fresh(); ctx.chat[0].mes = `ferry ${truly} ${air.tdb} ${dist} ${light}`;
    await run('BodyWound', { who: 'Mara', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Ferryman', part: 'upper body', type: 'blunt' });
    const st = ctx.chatMetadata.rulesEngine.state; st.people.Ferryman.env = { ...air };
    const n = truly ? String(await run('TrueNature', { who: 'Ferryman', kind: 'the returned' })) : '';
    const l = String(await run('Look', { viewer: 'Mara', kind: 'a person', target: 'the ferryman', target_who: 'Ferryman', distance_m: dist, light, seconds: 30 }));
    const t = String(await run('Touch', { who: 'Mara', target_who: 'Ferryman' }));
    return { n, l, t, st };
  };
  const cold = { tdb: 3, rh: 85 }, warm = { tdb: 24, rh: 60 };
  const v = await ferry(true, cold, 1, 'living room'), h = await ferry(false, cold, 1, 'living room'), vw = await ferry(true, warm, 1, 'living room'), far = await ferry(false, cold, 12, 'dim street or public lighting');
  if (!/sees of Ferryman: his breath leaves no mist; salt has dried at the corners of his mouth/.test(v.l) || !/his skin is as cold as the sea/.test(v.t)) bad.push(`one of the returned up close: ${v.l} | ${v.t}`);
  if (!/sees of Ferryman: his breath mists; his lips are clean of salt/.test(h.l) || !/: his skin is warm/.test(h.t)) bad.push(`a living man up close: ${h.l} | ${h.t}`);
  if (/breath/.test(vw.l) || !/salt has dried/.test(vw.l)) bad.push(`one of the returned in warm air: ${vw.l}`);
  if (/salt|lips/.test(far.l)) bad.push(`his mouth at 12 m under a street lamp: ${far.l}`);
  const secret = (v.st.facts ?? []).find(f => /^Ferryman is truly one of the returned$/.test(f.text));
  if (!(secret?.secret && secret.knowers.join() === 'Ferryman' && v.st.people.Ferryman.truly === 'the returned') || !/kept hidden/.test(v.n)) bad.push(`the hidden truth: ${JSON.stringify(secret)} ${v.n}`);
  if (!(v.st.facts ?? []).some(f => /Ferryman: his breath leaves no mist/.test(f.text) && f.knowers.includes('Mara'))) bad.push('what she saw is not learned');
  Wb.applyWorld([]);
  if (bad.length) { miss++; console.log(`MISS a kind's tells:\n  ${bad.join('\n  ')}`); }
}
// N76: each condition a tell can need is worked out where its bearer stands (tells.ts tellHolds): the open sky with the sun up,
// darkness below civil twilight's 3.4 lux, night with the sun below the horizon, water; and it stays open where the records
// cannot settle it.
{
  const Tl = await import('../src/rules/tells.js');
  const tell = when => ({ sign: 's', ordinary: 'o', sense: 'touch', when }), dry = { env: { tdb: 20, rh: 50, water: null } }, wet = { env: { tdb: 20, rh: 50, water: { tc: 18 } } };
  const out = { outdoorsNoon: { lux: 15800, sunAlt: 40, indoors: false }, indoorsNoon: { lux: 400, sunAlt: 40, indoors: true }, outdoorsNight: { lux: 0.01, sunAlt: -20, indoors: false }, unknown: { lux: null, sunAlt: null, indoors: null } };
  const got = [
    Tl.tellHolds(tell('under the open sky by day'), dry, out.outdoorsNoon), Tl.tellHolds(tell('under the open sky by day'), dry, out.indoorsNoon), Tl.tellHolds(tell('under the open sky by day'), dry, out.unknown),
    Tl.tellHolds(tell('in darkness'), dry, out.outdoorsNight), Tl.tellHolds(tell('in darkness'), dry, out.indoorsNoon), Tl.tellHolds(tell('in darkness'), dry, out.unknown),
    Tl.tellHolds(tell('at night'), dry, out.outdoorsNight), Tl.tellHolds(tell('at night'), dry, out.outdoorsNoon),
    Tl.tellHolds(tell('in water'), wet, out.unknown), Tl.tellHolds(tell('in water'), dry, out.unknown), Tl.tellHolds(tell('in water'), {}, out.unknown),
    Tl.tellHolds(tell('always'), {}, out.unknown)];
  if (JSON.stringify(got) !== '[true,false,null,true,false,null,true,false,true,false,null,true]') { miss++; console.log(`MISS the conditions a tell can need: ${JSON.stringify(got)}`); }
}
// N77: the seed (seed.ts): a code gives the same start every time; a part changed changes its own part (more people keep the
// first ones; another law keeps the people); ties fit (work ties only for a player with a trade, a workmate of the player's
// trade, a spouse of the other sex, one person truly of the kind); what the player is shown leaves out the secret wants and
// who is what; the start written through the tools puts each want with its knowers and the truth in a kept secret.
{
  const Sd = await import('../src/rules/seed.js'), K = await import('../src/rules/knowledge.js'), Wb = await import('../src/rules/world.js');
  const bad = [];
  if (!('error' in Sd.parseSeed('EW1700-RET-N4-D2-K5-7f2c')) || !('error' in Sd.parseSeed('EW1881-BH.RA-N4-D2-K9-7f2c')) || !('error' in Sd.parseSeed('EW1881-BH.RA-N8-D2-K5-7f2c')) || !('error' in Sd.parseSeed('EW1881-BH.RA-N4-D5-K5-7f2c')) || !('error' in Sd.parseSeed('hello'))) bad.push('bad codes read');
  const a = Sd.drawStart('EW1881-BH.RA-N1-D0-K5-7f2c'), a2 = Sd.drawStart('ew1881 bh.ra n1 d0 k5 7F2C'), more = Sd.drawStart('EW1881-BH.RA-N1-D0-K6-7f2c'), law = Sd.drawStart('EW1881-SP.MA-N1-D0-K5-7f2c');
  if (JSON.stringify(a) !== JSON.stringify(a2)) bad.push('the same code drew two starts');
  const core = x => ({ label: x.label, tie: x.tie, sex: x.sex, age: x.age, occupation: x.occupation, motive: x.want.motive });
  if (JSON.stringify(a.people.map(core)) !== JSON.stringify(more.people.slice(0, 5).map(core)) || JSON.stringify(a.you) !== JSON.stringify(more.you)) bad.push('one more person changed the others');
  if (JSON.stringify(a.people) !== JSON.stringify(law.people) || JSON.stringify(law.law.body) !== '["NO_SLEEP","NOPAIN"]') bad.push('another law changed the people');
  for (let i = 0; i < 300; i++) {
    const p = Sd.drawStart(`EW1881-BH.RA-N${i % 8}-D${i % 5}-K${3 + i % 5}-${i.toString(16).padStart(4, '0')}`), you = p.you;
    const shown = Sd.knownStart(p);
    const why = [
      !you.occupation && p.people.some(x => /workmate/.test(x.label)) && 'a work tie without a trade',
      p.people.some(x => /workmate/.test(x.label) && x.occupation !== you.occupation) && 'a workmate of another trade',
      p.people.some(x => /^the (husband|wife)$/.test(x.label) && x.sex === you.sex) && 'a spouse of the same sex',
      p.people.some(x => x.want.secret && (shown.split('\n').find(l => l.toLowerCase().startsWith(`${x.label} (`)) ?? '').includes('Wants:')) && 'a secret want shown',
      /truly|TRULY/.test(shown) && 'who is what shown',
    ].filter(Boolean);
    if (why.length) { bad.push(`${p.code}: ${why.join(', ')}`); break; }
  }
  // Written through the tools.
  fresh(); ctx.chat[0].mes = 'seed';
  T.setStoryTime(Date.UTC(a.year, a.month - 1, a.day, 21) / 60000);
  Wb.applyWorld([a.law]);
  for (const c of Sd.seedCalls(a, 'Mara')) await run(c.tool, c.args);
  const st = ctx.chatMetadata.rulesEngine.state, kb = K.knowledgeBlock(st);
  const truly = a.people.find(x => x.truly), secretWant = a.people.find(x => x.want.secret && !x.truly);
  if (!a.people.every(x => st.people[x.label]?.age === x.age) || st.people.Mara?.age !== a.you.age) bad.push('the people are not in the records');
  if (st.people[truly.label]?.truly !== a.law.what || JSON.stringify(st.people[truly.label]?.bodyFlags) !== '["NOBREATHE","NO_HEAT"]' || !(st.facts ?? []).some(f => f.secret && f.knowers.join() === truly.label && /is truly one of the people who came back from death/.test(f.text))) bad.push('the truth is not a kept secret');
  const maraLine = kb.split('\n').find(l => l.startsWith('Mara:')) ?? '';
  if (secretWant && maraLine.includes(secretWant.want.text.replace(/\.$/, '').toLowerCase())) bad.push(`Mara holds a secret want: ${maraLine}`);
  if (!/was born in/.test(maraLine) || !a.people.every(x => maraLine.includes(x.label))) bad.push(`Mara's line: ${maraLine}`);
  Wb.applyWorld([]);
  if (bad.length) { miss++; console.log(`MISS the seed:\n  ${bad.join('\n  ')}`); }
}
// N78: the seed's two ratings (seed.ts): each a share of the people there and then, each step ten times the last. N4 is one
// person in 10,000; D2 is 10 deaths per 100,000 a year; each one then kills 1 a year. Each person is of the kind with the
// world's share: over 1,000 circles of five at N1 (one in ten), 0.5 a circle, within 0.415–0.585 (4 SD). A roll keeps to
// worlds where each one kills at most one a day. The player is shown both as shares, and as counts among England and Wales's
// 25,974,439 people of 1881.
{
  const Sd = await import('../src/rules/seed.js');
  const bad = [];
  if (Math.abs(Sd.shareOfN(4) - 1e-4) > 1e-12 || Math.abs(Sd.deathsOfD(2) - 10) > 1e-9 || Math.abs(Sd.killsEach(4, 2) - 1) > 1e-9) bad.push('the ratings');
  let truly = 0;
  for (let i = 0; i < 1000; i++) truly += Sd.drawStart(`EW1881-BH.RA-N1-D0-K5-${(i + 7000).toString(16).padStart(4, '0')}`).people.filter(x => x.truly).length;
  if (!(truly / 1000 > 0.415 && truly / 1000 < 0.585)) bad.push(`people of the kind at one in ten: ${truly / 1000} a circle`);
  let r = 0.37; const rng = () => (r = (r * 9301 + 0.49297) % 1);
  for (let i = 0; i < 200; i++) { const code = Sd.rollSeed(rng, 0), p = Sd.drawStart(code); if ('error' in p || p.killsEach > 365 || p.deaths > 1000) { bad.push(`a roll past the edges: ${code} ${JSON.stringify('error' in p ? p : [p.killsEach, p.deaths])}`); break; } }
  const shown = Sd.knownStart(Sd.drawStart('EW1881-BH.RA-N4-D2-K5-7f2c'));
  if (!/how many, one person in 10,000 \(0\.01 %\); how deadly, 10 deaths per 100,000 people a year \(0\.01 % a year\); each one kills about 1 a year\. What it does: the living still grow 1\.5 % a year\. Among the 25,974,439 people of England and Wales in 1881: about 2,597 of them, and 2,597 deaths a year\./.test(shown)) bad.push(`shown: ${shown.split('\n').at(-1)}`);
  if (bad.length) { miss++; console.log(`MISS the seed's ratings:\n  ${bad.join('\n  ')}`); }
}
// N79: a kind on axes (seed.ts kindOf, tells.ts BODY): BH.RA reads as people who came back from death, who do not breathe and
// keep no warmth of their own and look like anyone (lacking breath or warmth takes nothing: neither feeds a body), no name stored; its tells are
// computed from its body: no mist of breath in cold air, skin at the air's temperature under a hand where the air is 3 °C or
// more from a person's skin; one of the kind carries the switches (Person.bodyFlags), which the body engine reads.
{
  const Sd = await import('../src/rules/seed.js'), Wb = await import('../src/rules/world.js'), Tl = await import('../src/rules/tells.js');
  const bad = [], kind = Sd.kindOf('BH.RA');
  if (kind?.what !== 'people who came back from death; they do not breathe and keep no warmth of their own; they look like anyone' || Sd.kindOf('XQ.ZZ') !== null) bad.push(`the kind reads: ${kind?.what}`);
  if (JSON.stringify(Tl.bodyTells(kind.body).map(t => [t.sense, t.when])) !== '[["sight","when breath would mist"],["touch","when the air is far from a body\'s warmth"]]') bad.push('the tells computed from the body');
  Wb.applyWorld([kind]);
  const meet = async (truly, air) => {
    fresh(); ctx.chat[0].mes = `axes ${truly} ${air.tdb}`;
    await run('BodyWound', { who: 'Mara', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Lodger', part: 'upper body', type: 'blunt' });
    const st = ctx.chatMetadata.rulesEngine.state; st.people.Lodger.env = { ...air };
    if (truly) await run('TrueNature', { who: 'Lodger', kind: kind.what });
    return { l: String(await run('Look', { viewer: 'Mara', kind: 'a person', target: 'the lodger', target_who: 'Lodger', distance_m: 1, light: 'living room', seconds: 30 })), t: String(await run('Touch', { who: 'Mara', target_who: 'Lodger' })), st };
  };
  const cold = { tdb: 3, rh: 85 }, mild = { tdb: 32, rh: 50 };
  const k1 = await meet(true, cold), h1 = await meet(false, cold), k2 = await meet(true, mild);
  if (!/no mist of breath/.test(k1.l) || !/skin at the air's temperature/.test(k1.t)) bad.push(`one of the kind in cold air: ${k1.l} | ${k1.t}`);
  if (!/breath that mists/.test(h1.l) || !/skin with a body's warmth/.test(h1.t)) bad.push(`a person in cold air: ${h1.l} | ${h1.t}`);
  if (!/^Mara touches Lodger; nothing the world's laws name shows to the touch\./.test(k2.t)) bad.push(`one of the kind in air near skin's warmth: ${k2.t}`);
  if (JSON.stringify(k1.st.people.Lodger.bodyFlags) !== '["NOBREATHE","NO_HEAT"]') bad.push('the body switches are not on the person');
  // A switch changes what the body engine does: a person whose body does not eat builds no hunger over two hours.
  fresh(); ctx.chat[0].mes = 'axes no eat'; T.setStoryTime(Date.UTC(1881, 1, 12, 12) / 60000);
  await run('BodyWound', { who: 'Eater', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Faster', part: 'upper body', type: 'blunt' });
  ctx.chatMetadata.rulesEngine.state.people.Faster.bodyFlags = ['NO_EAT'];
  await run('PassTime', { minutes: 120, active: [], asleep: [] });
  const ne = ctx.chatMetadata.rulesEngine.state.people;
  if (!(ne.Faster.needs?.kcal === 0 && (ne.Eater.needs?.kcal ?? 0) !== 0)) bad.push(`a body that does not eat: ${JSON.stringify([ne.Eater.needs?.kcal, ne.Faster.needs?.kcal])}`);
  Wb.applyWorld([]);
  if (bad.length) { miss++; console.log(`MISS a kind on axes:\n  ${bad.join('\n  ')}`); }
}
// N80: names (seed.ts): each coined by a census adult after one feature of the kind, the word for that feature; spread by the
// Bass model (p 0.03, q 0.38 a year): 3.6 % a year after, 81 % ten years after; each person knows a name with that share, over
// 300 starts within 4 SD; the player calls the kind by the most widespread name they know, or has none.
{
  const Sd = await import('../src/rules/seed.js');
  const bad = [];
  if (Sd.bassShare(0) !== 0 || Math.abs(Sd.bassShare(1) - 0.0357) > 0.0005 || Math.abs(Sd.bassShare(10) - 0.8128) > 0.0005) bad.push(`the spread: ${Sd.bassShare(1)}, ${Sd.bassShare(10)}`);
  const words = { B: 'the breathless', H: 'the cold ones', R: 'the returned', A: 'the lookalikes' };
  let expected = 0, got = 0, n = 0;
  for (let i = 0; i < 300; i++) {
    const p = Sd.drawStart(`EW1881-BH.RA-N4-D2-K5-${(i + 9000).toString(16).padStart(4, '0')}`);
    if (!p.names.length || p.names.some(x => !Object.values(words).includes(x.name) || x.year < p.since || x.year > 1881 || !(x.coiner.age >= 16))) { bad.push(`${p.code}: names ${JSON.stringify(p.names)}`); break; }
    for (const [who, ns] of Object.entries(p.knows)) for (const x of p.names) { expected += x.share; got += ns.includes(x.name) ? 1 : 0; n++; }
    const shown = Sd.knownStart(p), use = p.knows.you[0];
    if (use ? !shown.includes(`What you call them: ${use}`) : !shown.includes('You have no name for them')) { bad.push(`${p.code}: shown name`); break; }
    if (use && p.names.find(x => x.name === use).share < Math.max(...p.names.filter(x => p.knows.you.includes(x.name)).map(x => x.share))) { bad.push(`${p.code}: not the widest name`); break; }
  }
  const sd = Math.sqrt(expected * (1 - expected / n));
  if (Math.abs(got - expected) > 4 * sd) bad.push(`names known: ${got} of ${n}, expected ${expected.toFixed(0)}`);
  if (bad.length) { miss++; console.log(`MISS names and their spread:\n  ${bad.join('\n  ')}`); }
}
// N81: a body that eats no food of ours lives on a diet, and the engine computes its least from the 1,400 kcal a day it charges
// a body at rest: flesh (32,000 kcal in an adult's muscle) is one adult every 23 days, 16 a year; blood (780 kcal a litre) is
// 1.8 L a day, killing 134 a year (4.9 L each) or about 4 donation-sized draws. Size scales it by mass to the 0.75 (35 kg:
// 0.595), a body with no warmth of its own by 0.15. Where feeding kills, how deadly the kind is follows, and a D given is
// refused. No world is refused for its numbers: at 1 in 100 warm human-sized flesh-eaters the living (33.9 births, 18.9 deaths
// per 1,000 in 1881) fall 14.5 % a year; small cold ones eating the dead are all fed by them and kill no one; eating their own,
// they thin. Flesh cannot be taken while sparing, nor blood from the dead.
{
  const Sd = await import('../src/rules/seed.js');
  const bad = [];
  const fl = Sd.dietMinimum({ food: 'flesh', prey: 'K', kills: true }), bk = Sd.dietMinimum({ food: 'blood', prey: 'K', kills: true }), bs = Sd.dietMinimum({ food: 'blood', prey: 'S', kills: false });
  if (!(Math.abs(fl.killsYear - 15.97) < 0.01 && /every 23 days/.test(fl.perDay) && Math.abs(bk.killsYear - 133.7) < 0.1 && /^1\.8 L of blood a day$/.test(bk.perDay) && bs.killsYear === 0 && /about 4 donation-sized draws/.test(bs.perDay))) bad.push(`the minimums: ${JSON.stringify([fl, bk, bs])}`);
  if (Math.abs(Sd.kcalDay(35) / Sd.kcalDay(70) - 0.5946) > 0.001 || Math.abs(Sd.kcalDay(70, true) / Sd.kcalDay(70) - 0.15) > 1e-9) bad.push('size and warmth');
  for (const [law, re] of [['BHE.RA', /add its diet/], ['BH.RA.BK', /Only a body that does not eat/], ['E.RA.FS', /Flesh cannot be taken while sparing/], ['E.RA.BR', /Blood is taken from the living/]]) { const r = Sd.readLaw(law); if (!('error' in r) || !re.test(r.error)) bad.push(`${law}: ${JSON.stringify(r)}`); }
  const p = Sd.drawStart('EW1881-BE.RA.BK-N6-K5-7f2c');
  if ('error' in p || Math.abs(p.deaths - 13.37) > 0.01 || Math.abs(p.killsEach - 133.7) > 0.1 || !/following from what each must eat/.test(Sd.knownStart(p)) || !/live on blood of the living, and kill to take it, at least 1\.8 L of blood a day/.test(p.law.what)) bad.push(`a blood-drinking world: ${JSON.stringify('error' in p ? p : [p.deaths, p.killsEach, p.law.what])}`);
  const withD = Sd.drawStart('EW1881-BE.RA.BK-N6-D2-K5-7f2c'), deadD = Sd.drawStart('EW1881-E.RA.FR-N2-D2-K5-7f2c');
  if (!('error' in withD) || !/leave D out/.test(withD.error) || !('error' in deadD)) bad.push('a D given where feeding sets it was read');
  const collapse = Sd.drawStart('EW1881-E.RA.FK-N2-K5-7f2c'), dead = Sd.drawStart('EW1881-HE.RA.FR-W35-N2-K5-7f2c'), own = Sd.drawStart('EW1881-HE.RA.FO-W35-N2-D1-K5-7f2c');
  if ('error' in collapse || !/the living fall 14\.5 % a year and halve in 4\.8 years/.test(collapse.outcome)) bad.push(`collapse: ${JSON.stringify(collapse.outcome ?? collapse)}`);
  if ('error' in dead || dead.deaths !== 0 || !/the dead feed all of them/.test(dead.outcome) || !/still grow 1\.5 % a year/.test(dead.outcome) || !/weigh about 35 kg/.test(dead.law.what) || !/-W35-/.test(dead.code)) bad.push(`the dead: ${JSON.stringify(dead.outcome ?? dead)}`);
  if ('error' in own || !/they eat each other and thin: their number halves every 0\.49 years/.test(own.outcome)) bad.push(`their own: ${JSON.stringify(own.outcome ?? own)}`);
  if (bad.length) { miss++; console.log(`MISS a diet and what follows from it:\n  ${bad.join('\n  ')}`); }
}
// N82: every kind's sheet has every field filled (kind-sheet.ts, docs/kinds.md): over 300 seeds no field is empty or absent;
// each attribute is a median the raws give a human-like creature; seeing in the dark comes with the raws' share (37 of 767,
// within 4 SD over 2,000 sheets); one of the kind gets the sheet's attributes and resistances (TrueNature), and a kind's
// strength scales grip in proportion; the narrator reads the sheet in the world book line.
{
  const Sd = await import('../src/rules/seed.js'), Ks = await import('../src/rules/kind-sheet.js'), Wb = await import('../src/rules/world.js'), St = await import('../src/rules/strength.js');
  const bad = [], allowed = new Set([1000, ...Object.values(Ks.TEMPLATES).flatMap(t => Object.values(t))]);
  for (let i = 0; i < 300; i++) {
    const p = Sd.drawStart(`EW1881-BH.RA-N4-D2-K5-${(i + 12000).toString(16).padStart(4, '0')}`), sh = p.law.sheet;
    const empty = Object.entries(sh).filter(([k, v]) => v == null || v === '' || (Array.isArray(v) && !v.length && !['resists', 'tells'].includes(k)));
    if (empty.length || Object.keys(sh.attrs).length !== 19 || Object.values(sh.attrs).some(v => !allowed.has(v)) || Ks.sheetLines(sh).some(l => /undefined|NaN/.test(l))) { bad.push(`${p.code}: ${JSON.stringify(empty)} ${JSON.stringify(sh.attrs)}`); break; }
  }
  let dark = 0; for (let i = 0; i < 2000; i++) { let r = (i * 7919 % 10007) / 10007 + 1e-6; const rng = () => (r = (r * 9301 + 0.49297) % 1); dark += Ks.rollSheet({ body: [] }, 70, [], rng).senses.dark ? 1 : 0; }
  const e = 2000 * 37 / 767, sd = Math.sqrt(e * (1 - 37 / 767));
  if (Math.abs(dark - e) > 4 * sd) bad.push(`seeing in the dark: ${dark} of 2,000, expected ${e.toFixed(0)}`);
  const plan = Sd.drawStart('EW1881-BH.RA-N1-D0-K5-7f2c'), law = { ...plan.law, sheet: { ...plan.law.sheet, attrs: { ...plan.law.sheet.attrs, STRENGTH: 1250 }, resists: ['NOSTUN'] } };
  Wb.applyWorld([law]);
  fresh(); ctx.chat[0].mes = 'sheet';
  await run('BodyWound', { who: 'Lodger', part: 'upper body', type: 'blunt' }); await run('BodyWound', { who: 'Twin', part: 'upper body', type: 'blunt' });
  const ps = ctx.chatMetadata.rulesEngine.state.people; ps.Twin.age = ps.Lodger.age = 30; ps.Twin.sex = ps.Lodger.sex = 'male'; ps.Twin.gripZ = ps.Lodger.gripZ = 0;
  await run('TrueNature', { who: 'Lodger', kind: law.what });
  if (!(ps.Lodger.attrs?.STRENGTH === 1250 && ps.Lodger.bodyFlags?.includes('NOSTUN') && Math.abs(St.grip(ps.Lodger) / St.grip(ps.Twin) - 1.25) < 1e-9)) bad.push(`the sheet on the person: ${JSON.stringify([ps.Lodger.attrs?.STRENGTH, ps.Lodger.bodyFlags, St.grip(ps.Lodger), St.grip(ps.Twin)])}`);
  if (!/Its sheet \(as it is, not as known\): Body: lacks breath; 70 kg; no warmth of its own\./.test(Wb.worldBlock([law]))) bad.push(`the world book line: ${Wb.worldBlock([law]).slice(0, 300)}`);
  Wb.applyWorld([]);
  if (bad.length) { miss++; console.log(`MISS a kind's sheet:\n  ${bad.join('\n  ')}`); }
}
// N83: details drift (memory-drift.ts, Talarico & Rubin 2003): of the details a memory held when first told, the shares told
// the same and told changed follow the pooled points of their Figure 1 at 8, 43 and 225 days (within 0.05); none before a day;
// kept falls and changed rises without end, and never pass the whole; over 2,000 holders of a 5-detail fact, the changed share
// at 225 days sits within 4 SD of the curve; each holder's count only grows with time and is the same when asked twice; the
// world's record keeps its words.
{
  const M = await import('../src/rules/memory-drift.js'), K = await import('../src/rules/knowledge.js');
  const bad = [], C = [0, 1, 2, 3].map(i => (M.TR.consistent.flashbulb[i] + M.TR.consistent.everyday[i]) / 2), I = [0, 1, 2, 3].map(i => (M.TR.inconsistent.flashbulb[i] + M.TR.inconsistent.everyday[i]) / 2);
  for (const i of [1, 2, 3]) { const d = M.driftShares(M.TR_DAYS[i]); if (Math.abs(d.kept - C[i] / C[0]) > 0.05 || Math.abs(d.changed - I[i] / C[0]) > 0.05) bad.push(`day ${M.TR_DAYS[i]}: ${JSON.stringify(d)} against kept ${(C[i] / C[0]).toFixed(3)}, changed ${(I[i] / C[0]).toFixed(3)}`); }
  const d0 = M.driftShares(0.5); if (d0.kept !== 1 || d0.changed !== 0) bad.push(`half a day: ${JSON.stringify(d0)}`);
  let prev = { kept: 1, changed: 0 };
  for (let d = 2; d < 30000; d *= 1.5) { const x = M.driftShares(d); if (x.kept > prev.kept || x.changed < prev.changed || x.kept + x.changed > 1) { bad.push(`day ${d}: ${JSON.stringify(x)}`); break; } prev = x; }
  const names = Array.from({ length: 2000 }, (_, i) => `w${i}`), st = { clock: { t: 0, add: 0 }, people: {} };
  const f = K.learn(st, 'the baker asked 4 shillings for bread', names);
  st.clock.add = 225 * 1440;
  const at225 = names.map(n => K.driftOf(st, f, n)), share = at225.reduce((s, x) => s + x.changed, 0) / (5 * names.length), p = M.driftShares(225).changed, sd = Math.sqrt(p * (1 - p) / (5 * names.length));
  if (at225[0].details !== 5 || Math.abs(share - p) > 4 * sd) bad.push(`changed at 225 days: ${share.toFixed(3)} against ${p.toFixed(3)} (${at225[0].details} details)`);
  if (JSON.stringify(K.driftOf(st, f, 'w7')) !== JSON.stringify(at225[7])) bad.push('asked twice, a different count');
  st.clock.add = 2 * 525960;
  if (names.some((n, i) => K.driftOf(st, f, n).changed < at225[i].changed)) bad.push('a changed detail came back');
  if (f.text !== 'the baker asked 4 shillings for bread') bad.push(`the world's record: ${f.text}`);
  if (bad.length) { miss++; console.log(`MISS memory drift:\n  ${bad.join('\n  ')}`); }
}
// N84: how sure and how clearly (Talarico & Rubin 2003): at 225 days a memory of high importance (9 of 10, flashbulb) sits at
// their flashbulb ratings (5.37 belief, 5.01 vividness) and an everyday one (2 of 10) at theirs (4.43, 3.61), within 0.15;
// the flashbulb one falls by less than a third of the everyday one's fall; the words follow the scale; the [KNOWS] mark
// carries the time since and both, and none before a day or for knowledge learned by study.
{
  const M = await import('../src/rules/memory-drift.js'), K = await import('../src/rules/knowledge.js');
  const bad = [], f1 = M.heldAs(1, 9), f225 = M.heldAs(225, 9), e1 = M.heldAs(1, 2), e225 = M.heldAs(225, 2);
  if (Math.abs(f225.belief - 5.37) > 0.15 || Math.abs(f225.vivid - 5.01) > 0.15 || f1.belief - f225.belief > (e1.belief - e225.belief) / 3 || f1.vivid - f225.vivid > (e1.vivid - e225.vivid) / 3) bad.push(`flashbulb: ${JSON.stringify([f1, f225])}`);
  if (Math.abs(e225.belief - 4.43) > 0.15 || Math.abs(e225.vivid - 3.61) > 0.15) bad.push(`everyday at 225 days: ${JSON.stringify(e225)}`);
  if (M.beliefWords(5.5) !== 'sure of it' || M.vividWords(3.6) !== 'sees it dimly' || M.flashShare(9) !== 1 || M.flashShare(2) !== 0) bad.push('the words or the importance scale');
  const st = { clock: { t: 0, add: 0 }, people: {} };
  const big = K.learn(st, 'the mill burned with the miller inside', ['Ann']); big.imp = 9;
  const small = K.learn(st, 'the carter wore a grey coat', ['Ann']); small.imp = 2;
  const book = K.learn(st, 'copper turns green in wet air', ['Ann']); book.kind = 'knowledge';
  st.clock.add = 120;
  if (K.memoryMark(st, big, 'Ann') !== '') bad.push(`two hours on: ${K.memoryMark(st, big, 'Ann')}`);
  st.clock.add = 225 * 1440;
  const mb = K.memoryMark(st, big, 'Ann'), ms = K.memoryMark(st, small, 'Ann');
  if (!/^ \[7 months on: sure of it, sees it clearly/.test(mb) || !/^ \[7 months on: fairly sure of it, sees it dimly/.test(ms) || K.memoryMark(st, book, 'Ann') !== '') bad.push(`marks: ${mb} / ${ms} / ${K.memoryMark(st, book, 'Ann')}`);
  if (bad.length) { miss++; console.log(`MISS how sure and how clearly:\n  ${bad.join('\n  ')}`); }
}
// N85: who told them (memory-drift.ts, Bornstein & LeCompte 1995): a source's two-choice accuracy is the item's less a fixed
// gap, so the model gives back their Figure 1 (Exp. 1 at 168 h: item .59, source .54; Exp. 2 at 48 h: item .785, seen or
// heard .60; within .02); over 2,000 holders of a fact told them minutes ago, 66 % × 89 % keep "told by Innkeeper", 66 % × 11 %
// keep "told by someone", the rest no source (within 4 SD); a source gone stays gone as the fact weakens; a fact with no
// time kept keeps its source; the memory card shows a gone source as known only.
{
  const M = await import('../src/rules/memory-drift.js'), K = await import('../src/rules/knowledge.js'), Vw = await import('../src/rules/views.js');
  const bad = [], acc = (itemAcc, gap) => { const s = 2 * (itemAcc - 0.5); return 0.5 + 0.5 * s * M.sourceShare(s, gap); };
  if (Math.abs(acc(0.59, 0.055) - 0.54) > 0.02 || Math.abs(acc(0.785, 0.17) - 0.60) > 0.02) bad.push(`back to the figure: ${acc(0.59, 0.055).toFixed(3)}, ${acc(0.785, 0.17).toFixed(3)}`);
  if (M.sourceKind('told by Innkeeper') !== 'told' || M.sourceKind('heard it') !== 'told' || M.sourceKind('inferred from what they saw') !== 'thought' || M.sourceKind('heard, smelled or felt it') !== 'perceived' || M.sourceKind('saw it') !== 'perceived') bad.push('the kinds of source');
  const names = Array.from({ length: 2000 }, (_, i) => `h${i}`), st = { clock: { t: 0, add: 0 }, people: {} };
  const f = K.learn(st, 'the lodger keeps a knife under the stair', names, false, Object.fromEntries(names.map(n => [n, 'told by Innkeeper'])));
  st.clock.add = 5;
  const held = names.map(n => K.heldSource(st, f, n)), full = held.filter(h => h === 'told by Innkeeper').length / 2000, some = held.filter(h => h === 'told by someone').length / 2000;
  const s = K.recallStrength(st, f, 'h0'), pk = M.sourceShare(s, 0.17), pw = M.sourceShare(s, 0.055), se = p => 4 * Math.sqrt(p * (1 - p) / 2000);
  if (Math.abs(full - pk * pw) > se(pk * pw) || Math.abs(some - pk * (1 - pw)) > se(pk * (1 - pw)) || held.some(h => h && !['told by Innkeeper', 'told by someone'].includes(h))) bad.push(`minutes on: full ${full}, someone ${some}, expected ${(pk * pw).toFixed(3)}, ${(pk * (1 - pw)).toFixed(3)}`);
  st.clock.add = 3 * 525960;
  if (names.some((n, i) => !held[i] && K.heldSource(st, f, n))) bad.push('a source came back as the fact weakened');
  const noClock = { people: {} }, g = K.learn(noClock, 'the gate sticks', ['Ann'], false, { Ann: 'saw it' });
  if (K.heldSource(noClock, g, 'Ann') !== 'saw it') bad.push('no time kept, the source lost');
  st.clock.add = 5;
  const gone = names.find((n, i) => !held[i] && K.recalls(st, f, n)), card = gone ? Vw.memoryOf(st, gone)[0] : null;
  if (!card || card.rel !== 'knows' || card.by) bad.push(`the card of one whose source is gone: ${JSON.stringify(card)}`);
  if (bad.length) { miss++; console.log(`MISS who told them:\n  ${bad.join('\n  ')}`); }
}
// N86: a correction that shows how they came to remember it wrong ("enlightenment", Blank & Launay 2014: no misinformation
// effect left, 94 %): 100 witnesses, the bound 0.845 sits 4 SD out (SD 0.024).
{
  let gave = 0, kept = 0;
  for (let i = 0; i < 400 && gave + kept < 100; i++) {
    fresh(); ctx.chat[0].mes = `explained ${i}`; await run('BodyWound', { who: 'Mara', part: 'upper body', type: 'blunt' });
    T.setStoryTime(Date.UTC(1890, 0, 1) / 60000);
    await run('RecordFact', { fact: 'The baker asked 4 shillings for the bread', known_by: ['Mara'], how: 'saw it', importance: 3 });
    const r = String(await run('SocialResponse', { situation: 'told a false detail about an event they saw', who: 'Mara', speaker: 'Innkeeper', statement: 'The baker asked 2 shillings for the bread', event_fact: 'The baker asked 4 shillings for the bread' }));
    if (!/now remembers it/.test(r)) continue;
    const c = String(await run('SocialResponse', { situation: 'sees, reads or hears something that shows what they remember is wrong', who: 'Mara', statement: 'the baker asked 2 shillings', shown: 'The receipt reads 4 shillings', explains_why: 'the innkeeper was never in the shop' }));
    if (/gives way/.test(c)) gave++; else if (/still remembers it their own way/.test(c)) kept++;
  }
  if (!(gave + kept === 100 && gave / 100 > 0.845)) { miss++; console.log(`MISS a correction that shows how: gave way ${gave}, kept ${kept}`); }
}
// N87: the memory line in [KNOWS]: seven months on, a witness's line carries the time since, how sure and how clearly, and
// the changed and left-out counts the drift draws give; the heading tells the narrator to pick which details and to narrate
// what happens by the world; the world's fact keeps its words; a hearer whose source has gone shows the fact with none.
{
  const K = await import('../src/rules/knowledge.js');
  const st = { clock: { t: 0, add: 0 }, people: {} }, f = K.learn(st, 'the lodger came in at midnight with mud to the knees', ['Ann'], false, { Ann: 'saw it' }); f.imp = 7;
  const hearers = Array.from({ length: 40 }, (_, i) => `Hearer${i}`), g = K.learn(st, 'the lodger pays in old coin', hearers, false, Object.fromEntries(hearers.map(n => [n, 'told by Innkeeper']))); g.imp = 7;
  st.clock.add = 225 * 1440;
  const kb = K.knowledgeBlock(st), line = kb.split('\n').find(l => l.startsWith('Ann:')) ?? '', d = K.driftOf(st, f, 'Ann');
  const lost = hearers.find(n => K.recalls(st, g, n) && !K.heldSource(st, g, n)), lostLine = kb.split('\n').find(l => l.startsWith(`${lost}:`)) ?? '';
  if (!lost || !/^Hearer\d+: the lodger pays in old coin \[7 months on/.test(lostLine)) { miss++; console.log(`MISS the memory line: a source gone: ${lost} ${lostLine}`); }
  // Since section 97 the line says how each drifted detail comes out, by meaning, in place of the counts.
  const M = await import('../src/rules/memory-drift.js'), MM = await import('../src/rules/memory-meaning.js'), h = M.heldAs(225, 7), hm = K.heldMeaning(st, f, 'Ann');
  const want = hm.told.map(MM.toldPhrase).join(', ');
  if (hm.told.length !== d.changed + d.left || !line.includes(`[7 months on: ${M.beliefWords(h.belief)}, ${M.vividWords(h.vivid)}${want ? `; told now: ${want}` : ''}]`) || !/after "told now", how each detail that has drifted comes out[^.]*by its meaning[^.]*; they hold a changed one as surely as the rest\. Past the moment it was said, they keep what was meant, not the words: quoting it, they say it their own way\. The narration of what happens follows the world\./.test(kb) || f.text !== 'the lodger came in at midnight with mud to the knees') { miss++; console.log(`MISS the memory line:\n  ${line}\n  ${JSON.stringify(d)}`); }
}
// N88: the player's sheet holds a memory as the narrator does (views.ts memoryOf, knowledge.ts memoryState): seven months on,
// the time since, how sure and how clearly in the same words as the [KNOWS] mark, and the drift's counts as driftOf gives
// them; none in the first day, for knowledge learned by study, or for common knowledge.
{
  const K = await import('../src/rules/knowledge.js'), Vw = await import('../src/rules/views.js'), M = await import('../src/rules/memory-drift.js');
  const st = { clock: { t: 0, add: 0 }, people: {} }, f = K.learn(st, 'the lodger came in at midnight with mud to the knees', ['Ann'], false, { Ann: 'saw it' }); f.imp = 7;
  const book = K.learn(st, 'copper turns green in wet air', ['Ann']); book.kind = 'knowledge';
  K.learn(st, 'the queen is in Windsor', [], true);
  st.clock.add = 120;
  const fresh = Vw.memoryOf(st, 'Ann').find(r => /lodger/.test(r.text));
  st.clock.add = 225 * 1440;
  const rows = Vw.memoryOf(st, 'Ann'), row = rows.find(r => /lodger/.test(r.text)), d = K.driftOf(st, f, 'Ann'), h = M.heldAs(225, 7);
  const ok = !!row?.held && row.held.since === '7 months' && row.held.sure === M.beliefWords(h.belief) && row.held.clear === M.vividWords(h.vivid)
    && row.held.changed === d.changed && row.held.left === d.left && row.held.details === d.details && !fresh?.held
    && !rows.find(r => /copper/.test(r.text))?.held && !rows.find(r => /Windsor/.test(r.text))?.held
    && K.memoryMark(st, f, 'Ann').startsWith(` [7 months on: ${row.held.sure}, ${row.held.clear}`);
  if (!ok) { miss++; console.log(`MISS the sheet holds a memory as the narrator does: ${JSON.stringify([row, fresh?.held, d])}`); }
}
// N89: the name a person uses for the kind reads name first ("People call them "the returned": people who came back…"),
// not after the kind's whole description.
{
  const Sd = await import('../src/rules/seed.js'), p = Sd.drawStart('EW1881-BH.RA-N4-D2-K5-7f2c');
  const facts = Sd.seedCalls(p, 'Mary').map(c => String(c.args.fact ?? '')).filter(f => /^People call/.test(f));
  if (!(facts.length && facts.every(f => new RegExp(`^People call them "[^"]+": ${p.law.what.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(f)))) { miss++; console.log(`MISS the name for the kind reads name first: ${JSON.stringify(facts)}`); }
}
// N90: each person's day (days.ts; section 94): the U.K.'s weekly hours by year (Huberman & Minns 2007, 56.6 in 1880, the
// line between decades, the nearest outside); a worker starts at 6:00 or 7:00, rises 37 minutes before, sleeps 6 h 35 min and
// works the week's hours less Saturday's 6.5 over five weekdays in a span 2 h longer; Saturday ends at 14:00; Sundays, Good
// Friday, Christmas Day and from 1871 the bank holidays are off; the computus gives Easter; what they do at a time and when
// that changes.
{
  const D = await import('../src/rules/days.js');
  const ep = (y, m, d) => { const t = new Date(0), e = new Date(0); t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1); return Math.round((t - e) / 864e5); };
  const w = D.drawDay(() => 0.1, 1880, true), idle = D.drawDay(() => 0.5, 1880, false), mon = ep(1881, 9, 12), sat = ep(1881, 9, 17), sun = ep(1881, 9, 18);
  const at = (day, h) => D.doingAt(w, day * 1440 + h * 60);
  const ok = Math.abs(D.weekHours(1880) - 56.6) < 1e-9 && Math.abs(D.weekHours(1875) - 56.75) < 1e-9 && D.weekHours(1850) === 56.9 && D.weekHours(1921) === 56
    && w.work.start === 360 && w.rise === 323 && w.sleep === 395 && w.work.end === Math.round(360 + ((56.6 - 6.5) / 5 + 2) * 60) && idle.sleep === 395 && idle.rise >= 120 && idle.rise <= 630
    && D.easter(1881) === ep(1881, 4, 17) && D.easter(2025) === ep(2025, 4, 20) && D.easter(2024) === ep(2024, 3, 31)
    && D.weekday(mon) === 0 && D.weekday(sun) === 6 && D.dayOff(sun) && !D.dayOff(mon) && D.dayOff(ep(1881, 4, 15)) && D.dayOff(ep(1881, 4, 18)) && D.dayOff(ep(1881, 6, 6))
    && D.dayOff(ep(1881, 8, 1)) && !D.dayOff(ep(1881, 8, 8)) && D.dayOff(ep(1881, 12, 26)) && D.dayOff(ep(1881, 12, 25)) && !D.dayOff(D.easter(1869) + 1)
    && at(mon, 3) === 'asleep' && at(mon, 23) === 'asleep' && at(mon, 22.5) === 'about' && at(mon, 5.5) === 'about' && at(mon, 10) === 'at work' && at(mon, 18.5) === 'about'
    && at(sat, 13) === 'at work' && at(sat, 15) === 'about' && at(sun, 10) === 'about'
    && D.nextChange(w, mon * 1440 + 600) === mon * 1440 + w.work.end && D.nextChange(w, mon * 1440 + 20 * 60) === mon * 1440 + w.rise - w.sleep + 1440
    && D.daysHold('United Kingdom', 1881) && D.daysHold(null, 1900) && !D.daysHold('France', 1881) && !D.daysHold('United Kingdom', 1990) && !D.daysHold('United Kingdom', null);
  if (!ok) { miss++; console.log(`MISS each person's day: ${JSON.stringify([w, idle, D.weekHours(1875), D.easter(1881) - ep(1881, 4, 17)])}`); }
}
// N91: the day at work in the story (rules-tools.ts NewCharacter, PassTime, whereInjection; question-pass.ts sets who is in the
// scene before its calls): a person met in England in 1881 gets a day, the player's character none; ten hours from Monday
// 21:00 the father, away from the scene, has slept and is at work at 07:00, while with no scene's people known everyone
// stays as the call names them (awake); the narrator's [WHERE] names the people away, not the present or the dead.
{
  const D = await import('../src/rules/days.js'), qp = (await import('node:fs')).readFileSync(new URL('../src/rules/question-pass.js', import.meta.url), 'utf8');
  const ep = (y, m, d) => { const t = new Date(0), e = new Date(0); t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1); return Math.round((t - e) / 864e5); };
  const night = async present => {
    fresh(); T.setStoryTime(ep(1881, 9, 12) * 1440 + 21 * 60);
    ctx.chatMetadata.rulesEngine.state.setting = { country: 'United Kingdom' };
    T.setPresent(undefined, 'Mary');
    for (const [who, age, sex, occupation] of [['the father', 59, 'male', 'Worsted, Stuff Manufacture'], ['Mary', 31, 'female'], ['the neighbour', 21, 'female']]) await run('NewCharacter', { who, age, sex, ...occupation ? { occupation } : {} });
    T.setPresent(present, 'Mary');
    await run('PassTime', { minutes: 600, resting: ['Mary'] });
    return ctx.chatMetadata.rulesEngine.state;
  };
  const known = await night(['Mary']), father = known.people['the father'], kept = { ...known.people };
  const where = D.whereBlock(kept, T.storyTime(), ['Mary']), none = await night(undefined);
  const ok = !!father.day?.work && !known.people.Mary.day && father.needs.awake < 120 && D.doingAt(father.day, T.storyTime() - 1) !== 'asleep'
    && none.people['the father'].needs.awake === 600 && none.people['the neighbour'].needs.awake === 600
    && /^\[WHERE\]/.test(where) && /the father: at work \(Worsted, Stuff Manufacture\) until \d\d:\d\d/.test(where) && /the neighbour: /.test(where) && !/Mary:/.test(where) && !/the neighbour/.test(D.whereBlock(kept, T.storyTime(), ['Mary', 'The Neighbour']))
    && D.whereBlock(kept, T.storyTime(), undefined) === '' && !/the father/.test(D.whereBlock({ ...kept, 'the father': { ...father, dead: 'bled' } }, T.storyTime(), ['Mary']))
    && /const runAll = async \(list\) => \{ setPresent\(present, playerName\(/.test(qp);
  if (!ok) { miss++; console.log(`MISS the day at work in the story: ${JSON.stringify([father.day, father.needs?.awake, none.people['the father'].needs?.awake, where])}`); }
}
// N92: the kind's hunger (hunger.ts; section 95): feedings a year from the seed's own minimum (a warm flesh-eater that kills
// 365 × 1400 / 32,000 = 16 bodies; a cold blood-drinker that spares 365 × 210 / 780 / 0.47 draws); what is found is found by
// eight the next morning.
{
  const H = await import('../src/rules/hunger.js'), Sd = await import('../src/rules/seed.js');
  const fk = Sd.readLaw('E.BA.FK').diet, bs = Sd.readLaw('BHE.RA.BS').diet, bk = Sd.readLaw('E.BA.BK').diet;
  const ok = Math.abs(H.feedsYear(fk) - 365 * 1400 / 32000) < 1e-9 && Math.abs(H.feedsYear(bs, 70, true) - 365 * 1400 * 0.15 / 780 / 0.47) < 1e-9
    && Math.abs(H.feedsYear(bk) - 365 * 1400 / (780 * 0.07 * 70)) < 1e-9 && Sd.readLaw('E.BA.FK').mass === undefined && Sd.readLaw('E.BA.FK', 35).mass === 35
    && H.foundAt(10 * 1440 + 23 * 60) === 11 * 1440 + 480 && H.foundAt(10 * 1440 + 5 * 60) === 10 * 1440 + 480 && H.foundAt(10 * 1440 + 480) === 11 * 1440 + 480;
  if (!ok) { miss++; console.log(`MISS the kind's feedings a year: ${[H.feedsYear(fk), H.feedsYear(bs, 70, true), H.feedsYear(bk)]}`); }
}
// N93: the kind feeds while the player's character is away (rules-tools.ts TrueNature, PassTime, run; hunger.ts): one truly
// of a kind that kills for blood (a warm body: every 2.7 days), away from the scene for a week, feeds two or three times
// outside their hours of work; each feeding is their secret alone; each body is found by eight the next morning and is then
// common knowledge, so the player's character holds it as everyone does, and the passing of time's own result says nothing of
// it. Kept in the scene the whole week, or with the scene's people unknown, they do not feed; let go, they feed at once.
{
  const Sd = await import('../src/rules/seed.js'), HU = await import('../src/rules/hunger.js'), Wb = await import('../src/rules/world.js'), K = await import('../src/rules/knowledge.js'), D = await import('../src/rules/days.js'), C = await import('../src/rules/clock.js');
  const ep = (y, m, d) => { const t = new Date(0), e = new Date(0); t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1); return Math.round((t - e) / 864e5); };
  const kind = Sd.readLaw('E.BA.BK'); Wb.applyWorld([kind]);
  const week = async (present, label) => {
    fresh(); ctx.chat[0].mes = `hunger ${label}`; T.setStoryTime(ep(1881, 9, 12) * 1440 + 21 * 60);
    const st = ctx.chatMetadata.rulesEngine.state; st.setting = { country: 'United Kingdom', place: 'Bradford' };
    T.setPresent(undefined, 'Mary');
    await run('NewCharacter', { who: 'Mary', age: 31, sex: 'female' }); await run('NewCharacter', { who: 'the lodger', age: 30, sex: 'male', occupation: 'Clerk' });
    await run('TrueNature', { who: 'the lodger', kind: kind.what });
    const start = st.people['the lodger'].hunger ? { ...st.people['the lodger'].hunger } : null;
    T.setPresent(present, 'Mary');
    const said = [];
    for (let left = 7 * 1440, i = 0; left > 0 && i < 60; i++) {
      const r = String(await run('PassTime', { minutes: Math.min(1440, left), resting: ['Mary'] })); said.push(r);
      const stop = /Time stopped after (\d+) min(?: (\d+) s)? of (\d+) minutes/.exec(r);
      left -= stop ? Number(stop[1]) + Number(stop[2] ?? 0) / 60 : Math.min(1440, left);
    }
    return { st, start, said: said.join('\n') };
  };
  const away = await week(['Mary'], 'away'), lodger = away.st.people['the lodger'], facts = away.st.facts ?? [];
  // Since section 98 what is found is the world's record, and each person hears it in their own time and version (retell.ts).
  const secrets = facts.filter(f => /^the lodger killed /.test(f.text)), found = facts.filter(f => /^The body of .* was found in Bradford on the morning of .*, drained of blood$/.test(f.text) && !f.standing);
  const ids = new Set(found.map(f => f.id)), heard = facts.filter(f => (f.versionOf != null && ids.has(f.versionOf)) || (ids.has(f.id) && f.knowers.length));
  const maryHeard = K.heldFacts(away.st, 'Mary').filter(f => (f.versionOf != null && ids.has(f.versionOf)) || ids.has(f.id));
  const kept = await week(['Mary', 'the lodger'], 'kept'), keptFed = kept.st.people['the lodger'].hunger.fed ?? 0, overdue = kept.st.people['the lodger'].hunger.next < T.storyTime();
  T.setPresent(['Mary'], 'Mary'); await run('PassTime', { minutes: 60, resting: ['Mary'] });
  const letGo = kept.st.people['the lodger'].hunger.fed ?? 0, ahead = kept.st.people['the lodger'].hunger.next - T.storyTime() > kept.st.people['the lodger'].hunger.every - 61;
  const blind = await week(undefined, 'blind');
  const ok = !!away.start && Math.abs(away.start.every - 365 * 1440 / (365 * 1400 / (780 * 0.07 * 70))) < 1e-6 && away.start.next >= ep(1881, 9, 12) * 1440 + 21 * 60 && away.start.next <= ep(1881, 9, 12) * 1440 + 21 * 60 + away.start.every
    && (lodger.hunger.fed === 2 || lodger.hunger.fed === 3) && secrets.length === lodger.hunger.fed && secrets.every(f => f.secret && f.knowers.length === 1 && f.knowers[0] === 'the lodger') && !!lodger.day?.work && secrets.every(f => { const t = C.parseStoryTime(f.text); return t !== null && D.doingAt(lodger.day, t) !== 'at work'; })
    && found.length === lodger.hunger.fed && found.every(f => !f.everyone) && heard.length >= 1 && maryHeard.length >= 1 && !heard.some(f => f.knowers.includes('the lodger')) && heard.every(f => f.versionOf == null || Object.values(f.at ?? {}).every(t => { const h = (t % 1440) / 60; return h >= 8 && h <= 22; })) && heard.every(f => f.versionOf == null || (f.knowers.length === 1 && f.standing === 'version' && f.from?.[f.knowers[0].toLowerCase()] === 'hearsay'))
    && !K.heldFacts(away.st, 'Mary').some(f => /^the lodger killed/.test(f.text)) && !/killed|drained|fed on|grave/i.test(away.said)
    && keptFed === 0 && overdue && letGo === 1 && ahead && (blind.st.people['the lodger'].hunger.fed ?? 0) === 0
    && (() => { const old = { pending: [{ at: 10, text: 'A fresh grave was found opened' }] }; HU.release(old, 20); return old.facts?.length === 1 && old.facts[0].everyone && !old.pending; })();
  if (!ok) { miss++; console.log(`MISS the kind feeds while the player's character is away: ${JSON.stringify({ start: away.start, fed: lodger.hunger, secrets: secrets.map(f => f.text), found: found.map(f => f.text), heard: heard.map(f => [f.knowers, f.text]), keptFed, overdue, letGo, blind: blind.st.people['the lodger'].hunger })}`); }
}
// N94: the world year by year (world-count.ts; section 96): with a kind that kills no one, each decade lands on the next census
// (births less deaths less the decade's leavers, Registrar General and censuses 1881–1921); a story with fewer people has
// births in proportion; the kind kills only the living not of it, so its share rises, and once the living are gone only the
// kind is left (section 110: before, the count ended at none); outside the records, nothing.
{
  const W = await import('../src/rules/world-count.js'), Sd = await import('../src/rules/seed.js');
  const none = W.yearByYear(1881, 1921, 0, 0), at = (rows, y) => rows.find(r => r.year === y);
  const p = Sd.drawStart('EW1881-BHE.RA.BK-N2-K5-005a'), fall = W.yearByYear(1881, 1921, p.share, p.deaths), gone = W.yearByYear(1881, 1884, 0.1, 200549);
  const ok = [1881, 1891, 1901, 1911, 1921].every(y => Math.round(at(none, y).people) === W.CENSUS[y]) && W.CENSUS[1881] === Sd.EW_1881
    && Math.abs(at(fall, 1885).births / at(none, 1885).births - at(fall, 1885).people / at(none, 1885).people) < 1e-9
    && at(fall, 1882).kind / at(fall, 1882).people > p.share && Math.abs(at(fall, 1881).killed - W.CENSUS[1881] * p.deaths / 1e5) < 1e-3
    && at(fall, 1891).people < W.CENSUS[1891] / 4 && at(fall, 1921).killed === 0
    && Math.abs(at(gone, 1881).killed - W.CENSUS[1881] * 0.9) < 1e-3 && at(gone, 1882).people === at(gone, 1882).kind && at(gone, 1884).kind > 0 && at(gone, 1884).killed === 0
    && W.yearByYear(1830, 1840, 0, 0) === null && W.yearByYear(1881, 1870, 0, 0).length === 1 && W.yearByYear(1881, 1950, 0, 0).at(-1).year === 1921
    // section 109: the count from 1841, each census met; the year's rates per 1,000 (1840s at 1850's rate per person)
    && [1841, 1851, 1861, 1871].every(y => Math.round(at(W.yearByYear(1841, 1881, 0, 0), y).people) === W.CENSUS[y])
    && Math.abs(W.ewYear(1881).deaths - 18.94) < 0.01 && Math.abs(W.ewYear(1845).births - W.ewYear(1850).births) < 0.05 && W.ewYear(1921).births === W.ewYear(1920).births && W.ewYear(1840) === null
    && Sd.startParts(Sd.drawStart('EW1911-E.RA.FR-N3-K5-1a2b')).among.startsWith('Among the 36,065,951 people of England and Wales in 1911')
    && /the living still grow 1\.1 % a year/.test(Sd.drawStart('EW1841-E.RA.BK-N5-K5-7f2c').outcome)
    && (() => { let x = 0x9e3779b9; const rr = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; }; const t = Array.from({ length: 40000 }, () => Sd.drawTown(rr, 1900)); return Math.abs(t.filter(v => v >= 1e5).length / t.length - 0.316) < 0.012 && Math.abs(Sd.TOWN_BANDS_1891.reduce((a, b) => a + b[0], 0) - 1) < 1e-9; })();
  if (!ok) { miss++; console.log(`MISS the world year by year: ${JSON.stringify([1881, 1891, 1901].map(y => Math.round(at(none, y).people)), at(fall, 1891), at(gone, 1881))}`); }
}
// N95: the memory of meaning (memory-meaning.ts; section 97): the words a sentence uses as head nouns (a phrase opened by a
// determiner, a possessive, a number or a preposition, closed by a stop); a drifted detail by what it means: a noun left out
// at its basic level (section 102), changed as another of the kind there; a day, a month, a part of the day to the one beside it; a
// year one off; another number to the nearest round one; a word of a group that stands for one thing to another of the group;
// any other word in other words or left out; the held text with "a"/"an" fitted and compounds kept.
{
  const MM = await import('../src/rules/memory-meaning.js');
  const hn = (t) => [...MM.headNouns(t)].join(',');
  const servant = MM.heldBy('servant', 'left', 0.3), lodger = MM.heldBy('lodger', 'changed', 0.3);
  const ok = hn('The body of a 27-year-old woman, a domestic indoor servant, was found nearby') === 'body,woman,servant'
    && hn('the lodger came in at midnight with mud to the knees') === 'lodger,midnight,mud,knees' && hn('People call them the returned') === ''
    && hn('The debtor wants: having an occupation') === 'debtor,occupation' && hn('the lodger pays in old coin') === 'lodger,coin'
    && MM.kindsAbove('servant')[0] === 'worker' && MM.kindsAbove('lodger')[0] === 'tenant' && MM.fileOf('woman') === 'person'
    && servant.as === 'worker' && servant.how === 'held only as worker' && lodger.as === 'another tenant'
    && MM.heldBy('Saturday', 'changed', 0.7).as === 'Sunday' && MM.heldBy('Saturday', 'changed', 0.2).as === 'Friday' && MM.heldBy('sunday', 'changed', 0.9).as === 'Monday'
    && MM.heldBy('february', 'changed', 0.9).as === 'March' && MM.heldBy('morning', 'changed', 0.2).as === 'dawn' && MM.heldBy('dawn', 'changed', 0.2).as === 'morning'
    && MM.heldBy('1881', 'changed', 0.9).as === '1882' && MM.heldBy('27', 'changed', 0.5).as === '25' && MM.heldBy('34', 'changed', 0.5).as === '30' && MM.heldBy('30', 'changed', 0.5).as === '40'
    && MM.heldBy('5', 'left', 0.5).as === '' && MM.heldBy('returned', 'changed', 0.9, [['returned', 'breathless', 'lookalikes']]).as === 'lookalikes'
    && MM.heldBy('domestic', 'changed', 0.5, [], false).how === 'in other words' && MM.heldBy('nearby', 'left', 0.5, [], false).how === 'left out'
    && MM.heldText('a lodger with an apple', [MM.heldBy('lodger', 'left', 0.1), MM.heldBy('apple', 'left', 0.1)]) === 'a tenant with an apple'
    && MM.heldText('a 27-year-old woman on Saturday 5 February', [MM.heldBy('year', 'left', 0.1), MM.heldBy('27', 'changed', 0.5), MM.heldBy('saturday', 'changed', 0.2), MM.heldBy('5', 'left', 0.5)]) === 'a 25-year-old woman one Friday in February'
    && MM.heldText('the lodger came in at midnight with mud', [MM.heldBy('midnight', 'left', 0.2)]) === 'the lodger came in with mud'
    && MM.heldText('The body of a 27-year-old woman was found on the morning of Saturday 5 February 1881', [MM.heldBy('27', 'left', 0.2)]) === 'The body of a woman was found on the morning of Saturday 5 February 1881'
    && MM.heldText('The body of a 27-year-old woman was found on the morning of Saturday 5 February 1881', [MM.heldBy('morning', 'left', 0.2)]) === 'The body of a 27-year-old woman was found on Saturday 5 February 1881'
    && MM.heldBy('years', 'left', 0.5).how === 'held only as some time' && MM.heldText("has been Mary's friend for years", [MM.heldBy('years', 'left', 0.5)]) === "has been Mary's friend for years"
    && MM.heldText('found on the morning of Sunday 6 February 1881', [MM.heldBy('morning', 'left', 0.2), MM.heldBy('sunday', 'left', 0.2), MM.heldBy('6', 'left', 0.2)]) === 'found in February 1881'
    && MM.heldText('He left on the morning of the fire', [MM.heldBy('morning', 'left', 0.2)]) === 'He left on the day of the fire' && MM.heldText('the 3 of them went', [MM.heldBy('3', 'left', 0.2)]) === 'some of them went'
    && MM.heldText('The body of an 18-year-old woman was found', [MM.heldBy('18', 'left', 0.2)]) === 'The body of a woman was found' && MM.heldText('The body of a 27-year-old artisan was found', [MM.heldBy('27', 'left', 0.2)]) === 'The body of an artisan was found' && MM.heldText('a 27-year-old woman', [MM.heldBy('27', 'changed', 0.5)]) === 'a 25-year-old woman' && MM.anBefore('80') && MM.anBefore('18') && !MM.anBefore('1881') && !MM.anBefore('25')
    && MM.toldPhrase(MM.heldBy('knees', 'changed', 0.2)) === '"knees" as other joints'
    // section 102: a lost noun held at its basic level, the most used word of its chain, when people use that word (Zipf 3.5);
    // a word that is its own basic level, or whose basic level few say, held as someone or something, its word the narrator's
    && MM.basicAt([{ zipf: 30 }, { zipf: 50 }, { zipf: 27 }]) === 1 && MM.basicAt([{ zipf: 52 }, { zipf: 34 }]) === 0
    && MM.heldBy('poodle', 'left', 0.3).as === 'dog' && MM.heldBy('vicar', 'left', 0.3).as === 'priest' && MM.heldBy('miner', 'left', 0.3).as === 'employee'
    && MM.heldBy('blood', 'left', 0.3).how === 'held only as something' && MM.heldBy('blood', 'changed', 0.3).how === 'in other words' && MM.heldBy('town', 'left', 0.3).how === 'held only as somewhere'
    && MM.heldBy('debtor', 'left', 0.3).how === 'held only as someone' && MM.heldBy('debtor', 'changed', 0.3).how === 'in other words' && MM.heldBy('poodle', 'changed', 0.3).as === 'another dog'
    && MM.chainOf('navvy').map(x => x.name).includes('labourer') && !MM.chainOf('miner').some(x => x.name === 'jack')
    && MM.toldPhrase(servant) === '"servant" held only as worker' && MM.toldPhrase(lodger) === '"lodger" as another tenant' && MM.toldPhrase(MM.heldBy('5', 'left', 0.5)) === '"5" forgotten';
  if (!ok) { miss++; console.log(`MISS the memory of meaning: ${JSON.stringify([hn('The body of a 27-year-old woman, a domestic indoor servant, was found nearby'), hn('the lodger came in at midnight with mud to the knees'), MM.kindsAbove('servant'), MM.heldText('a 27-year-old woman on Saturday 5 February', [MM.heldBy('year', 'left', 0.1), MM.heldBy('27', 'changed', 0.5), MM.heldBy('saturday', 'changed', 0.2), MM.heldBy('5', 'left', 0.5)])])}`); }
}
// N96: the memory of meaning in the story (knowledge.ts driftDetails, heldMeaning, memoryState; views.ts memoryOf): the
// drifted details are the ones driftOf counts, by the same draws, asked again the same; the player's sheet holds the memory
// as the narrator is told it; the kind's names given as one group drift into one another.
{
  const K = await import('../src/rules/knowledge.js'), Vw = await import('../src/rules/views.js');
  const st = { clock: { t: 0, add: 0 }, people: {}, alike: [['returned', 'breathless']] }, names = Array.from({ length: 30 }, (_, i) => `w${i}`);
  const f = K.learn(st, 'the lodger came in at midnight with mud to the knees and a knife in his coat', names, false, Object.fromEntries(names.map(n => [n, 'saw it']))); f.imp = 7;
  const g = K.learn(st, 'People call them the returned', names, false, Object.fromEntries(names.map(n => [n, 'told by the vicar']))); g.imp = 7;
  st.clock.add = 225 * 1440;
  const bad = [];
  for (const n of names) {
    const d = K.driftOf(st, f, n), dd = K.driftDetails(st, f, n), hm = K.heldMeaning(st, f, n);
    if (hm.told.length !== d.changed + d.left || hm.told.filter(x => x.fate === 'changed').length !== d.changed || JSON.stringify(K.heldMeaning(st, f, n)) !== JSON.stringify(hm)) bad.push(`${n} counts`);
    if (dd.words.filter((w, i) => dd.fates[i] !== 'kept').join() !== hm.told.map(x => x.word).join()) bad.push(`${n} words`);
    const row = Vw.memoryOf(st, n).find(r => r.text === f.text);
    if (row?.held && (row.held.as !== hm.as || row.held.told.length !== hm.told.length)) bad.push(`${n} sheet`);
  }
  const renamed = names.map(n => K.heldMeaning(st, g, n).told.find(x => x.word === 'returned')).filter(Boolean);
  if (!renamed.length || renamed.some(x => x.fate === 'changed' && x.as !== 'breathless')) bad.push(`names: ${JSON.stringify(renamed)}`);
  // a person's name in the story is kept as written: "the third neighbour" never drifts into "the third actor" (section 101)
  st.people['the third neighbour'] = {};
  const nf = K.learn(st, 'The third neighbour lives next door to Ann and keeps a dog', names, false, Object.fromEntries(names.map(n => [n, 'saw it']))); nf.imp = 7; st.clock.add += 400 * 1440;
  const nd = names.map(n => K.driftDetails(st, nf, n)), nameKept = nd.every(d => d.words.every((w, i) => !['third', 'neighbour'].includes(w.toLowerCase()) || d.fates[i] === 'kept')) && nd.some(d => d.fates.some(x => x !== 'kept'))
    && names.every(n => /^The third neighbour /.test(K.heldMeaning(st, nf, n).as)) && [...K.nameWords(st, 'the third neighbour came')].join() === 'the,third,neighbour' && !K.nameWords(st, 'a neighbour came').size;
  if (!nameKept) bad.push(`names kept: ${JSON.stringify(nd.slice(0, 3))}`);
  if (bad.length) { miss++; console.log(`MISS the memory of meaning in the story: ${bad.slice(0, 5).join('; ')}`); }
}
// N97: retelling (retell.ts; section 98): news found at eight reaches half on its day by ten at night, four tenths the next
// day, three in a hundred on the third, and seven in a hundred never (Deutschmann & Danielson 1960's diffusion, shaped);
// one teller in the first hours, one more each four hours, at most six; each telling keeps a detail with 0.3^(1/5.5) (about
// 70 % gone after five or six tellings, Allport & Postman), the lost ones by meaning; the same hearer hears the same version.
{
  const R = await import('../src/rules/retell.js');
  const found = 100 * 1440 + 480, day = (t) => Math.floor(t / 1440) - 100, hour = (t) => (t % 1440) / 60;
  const at = [0.2, 0.6, 0.91, 0.95].map(u => R.hearsAt(found, u, 0.5));
  const text = 'The body of a 29-year-old man, a farmer, was found in Bradford on the morning of Friday 16 September 1881, drained of blood';
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu).length;
  let kept = 0, total = 0;
  const M = await import('../src/rules/memory-drift.js'), n = M.detailsOf(text).length;
  for (let i = 0; i < 400; i++) { const f = R.retellFates(text, 5, `k${i}`); kept += f.filter(x => x.fate === 'kept').length; total += f.length; }
  const share = kept / total, want = 0.3 ** (5 / 5.5);
  const st = { people: { Ann: {}, Tom: {}, Dead: { dead: 'bled' }, Feeder: {} } }; R.spread(st, { id: 9, text }, found, ['Feeder']);
  // News due at 600 and released when the passing of time ends at 900 is dated 600.
  const Hg = await import('../src/rules/hunger.js'), Kn = await import('../src/rules/knowledge.js'), st2 = { clock: { t: 0, add: 900 }, people: { Ann: {} }, facts: [] };
  const w2 = Kn.learn(st2, text, [], false); st2.pending = [{ at: 600, text, who: 'Ann', of: w2.id, chain: 6 }]; Hg.release(st2, 900);
  const got = st2.facts.find(f => f.knowers.includes('Ann'));
  const ok = day(at[0]) === 0 && hour(at[0]) >= 8 && hour(at[0]) <= 22 && day(at[1]) === 1 && hour(at[1]) >= 8 && day(at[2]) === 2 && at[3] === null
    && R.tellersBy(found, found + 60) === 1 && R.tellersBy(found, found + 300) === 2 && R.tellersBy(found, found + 5000) === 6
    && R.retold(text, 0, 'x') === text && R.retold(text, 4, 'same') === R.retold(text, 4, 'same') && R.retold(text, 6, 'a') !== text
    && Math.abs(share - want) < 0.05 && got?.at?.ann === 600 && !st2.pending?.length
    && (st.pending ?? []).every(p => ['Ann', 'Tom'].includes(p.who) && p.at >= found && p.of === 9 && p.chain === R.tellersBy(found, p.at)) && !(st.pending ?? []).some(p => p.who === 'Feeder' || p.who === 'Dead');
  if (!ok) { miss++; console.log(`MISS retelling: ${JSON.stringify({ at: at.map(t => t && [day(t), hour(t)]), share, want, pending: st.pending })}`); }
}
// N98: how the country lives with the kind (society.ts; section 99): what the living find a year per 100,000 against about 1
// murder (ONS 1898–1901): a kind that kills, its deaths; one that eats the dead, the graves it opens; one that spares or eats
// its own, nothing; the stage by how many times ordinary murder (under 0.5 unnoticed, 5 a run of killings, 100 a panic, 1,000
// an emergency, beyond collapse); knowing the tale apart from blaming the deaths on it; a long name or a world book's
// description said as "them"; a pattern from fiction always marked as fiction's.
{
  const Sd = await import('../src/rules/seed.js'), So = await import('../src/rules/society.js');
  const st = (c, y = 1881) => So.societyOf(Sd.drawStart(c), y);
  const d0 = st('EW1881-BH.RA-N4-D0-K5-7f2c'), d1 = st('EW1881-BH.RA-N4-D1-K5-7f2c'), d2 = st('EW1881-BH.RA-N4-D2-K5-7f2c'), d3 = st('EW1881-BH.RA-N3-D3-K5-7f2c'), bk = st('EW1881-BHE.RA.BK-N2-K5-005a');
  const spare = Sd.readLaw('HE.BA.BS'), dead = Sd.readLaw('E.BA.FR');
  const block = So.societyBlock(d2);
  const ok = So.MURDER_PER_100K === 1 && [0.4, 0.6, 4.9, 5, 99, 100, 999, 1000].map(So.stageOf).join() === 'unnoticed,a run of killings,a run of killings,a panic,a panic,an emergency,an emergency,collapse'
    && d0.stage === 'unnoticed' && d1.stage === 'a run of killings' && d2.stage === 'a panic' && d3.stage === 'an emergency' && bk.stage === 'collapse'
    && So.seenPer100k(spare, 0.001, 5) === 0 && Math.abs(So.seenPer100k(dead, 1e-4, 0) - 1e-4 * 1e5 * Sd.dietMinimum(dead.diet, 70, false).bodiesYear) < 1e-9 && So.seenPer100k(null, 0.01, 7) === 7
    && /know them only as a tale/.test(d0.lines[1]) && /a few lay the deaths at their door/.test(d1.lines[1]) && /many now blame them/.test(d2.lines[1]) && /most blame them/.test(d3.lines[1])
    && /about as many as the ordinary murders/.test(d1.lines[0]) && /10 times the ordinary murders/.test(d2.lines[0]) && /Whitechapel in 1888/.test(d1.lines[2]) && /New England/.test(d2.lines[2])
    && /^\[SOCIETY\]\nHow the country lives with them in 1881 \(a panic\)\./.test(block) && /\(a pattern from fiction, not history: use it only as the story's people would\.\)\n\[\/SOCIETY\]$/.test(block)
    && /Masquerade/.test(d0.fiction) && /Daybreakers/.test(bk.fiction)
    && So.societyOf({ law: dead, share: 1e-4, deaths: 0, names: [{ name: dead.what, year: 1800, noticed: '', coiner: {}, share: 1 }] }, 1881).lines[1].startsWith('100 % have heard of them:')
    && /Few have a name for them/.test(So.societyOf({ law: null, share: 1e-4, deaths: 10, names: [] }, 1881).lines[1]);
  if (!ok) { miss++; console.log(`MISS how the country lives with the kind: ${JSON.stringify([d0, d1, d2].map(s => [s.stage, s.lines]))}`); }
}
// N99: people meet while the player's character is away (meetings.ts; section 100): one of 16 people met over a fortnight at
// 7.4 interactions a day (Wheeler & Nezlek 1977), 0.46 a day; three a day under one roof; only when both are away, awake and
// free; the meeting held by both, the act on the want by the one who wants (secret when the want is); none toward the
// player's character, none when either is in the scene or the scene's people are unknown.
{
  const M = await import('../src/rules/meetings.js'), K = await import('../src/rules/knowledge.js');
  const ep = (y, m, d) => { const t = new Date(0), e = new Date(0); t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1); return Math.round((t - e) / 864e5); };
  const fortnight = async (present, toward = 'the debtor', label = 'm') => {
    fresh(); ctx.chat[0].mes = `meet ${label}`; T.setStoryTime(ep(1881, 9, 12) * 1440 + 9 * 60);
    const st = ctx.chatMetadata.rulesEngine.state; st.setting = { country: 'United Kingdom' };
    T.setPresent(undefined, 'Mary');
    for (const [who, age, sex] of [['Mary', 31, 'female'], ['the neighbour', 40, 'female'], ['the debtor', 38, 'male']]) await run('NewCharacter', { who, age, sex });
    st.people['the neighbour'].want = { text: 'Being in love.', toward, secret: true };
    T.setPresent(present, 'Mary');
    for (let d = 0; d < 14; d++) { for (const n of Object.keys(st.people)) await run('BodyIntake', { who: n, water_l: 2.5, food_kcal: 2200 }); await run('PassTime', { minutes: 1440, resting: ['Mary'] }); }
    return st;
  };
  const away = await fortnight(['Mary']), w = away.people['the neighbour'].want, facts = away.facts ?? [];
  const met = facts.filter(f => /^the neighbour and the debtor met on /.test(f.text)), acts = facts.filter(f => /^the neighbour acted on what they want \(being in love\) when meeting the debtor on /.test(f.text));
  const here = await fortnight(['Mary', 'the debtor'], 'the debtor', 'here'), toMary = await fortnight(['Mary'], 'Mary', 'mary'), blind = await fortnight(undefined, 'the debtor', 'blind');
  const ok = Math.abs(M.PER_DAY - 7.4 * 14 / 16 / 14) < 1e-12 && M.meetRate({ home: 'h' }, { home: 'h' }) === 3 && M.meetRate({}, {}) === M.PER_DAY && Math.abs(M.meetChance(M.PER_DAY, 960) - (1 - Math.exp(-M.PER_DAY))) < 1e-12
    && w.met >= 1 && w.met <= 16 && met.length === w.met && acts.length === w.met && met.every(f => f.knowers.length === 2 && f.knowers.includes('the debtor') && /, Mary not there$/.test(f.text))
    && acts.every(f => f.secret && f.knowers.length === 1 && f.knowers[0] === 'the neighbour') && !K.heldFacts(away, 'Mary').some(f => /met on|acted on/.test(f.text))
    && !here.people['the neighbour'].want.met && !toMary.people['the neighbour'].want.met && !blind.people['the neighbour'].want.met;
  if (!ok) { miss++; console.log(`MISS people meet while the player's character is away: ${JSON.stringify({ met: w.met, facts: met.length, acts: acts.length, here: here.people['the neighbour'].want.met, toMary: toMary.people['the neighbour'].want.met, blind: blind.people['the neighbour'].want.met, sample: met[0]?.text })}`); }
}
// N100: the kind beyond the player's circle (town.ts, seed.ts drawTown; section 101): the town drawn as people of 1881 lived
// (29.6 % in towns of over 100,000, 56.3 % over 10,000; The Statesman's Year-Book 1899); kills at the town's rate (what the
// living find per 100,000 times its people, less the circle's own feeders), found by eight the next morning, one record a
// morning (a single body described, more counted), heard by the circle in their own time; none before the morning comes,
// none for a kind that leaves nothing found; PassTime runs it wherever the player's character is.
{
  const S = await import('../src/rules/seed.js'), W = await import('../src/rules/town.js'), B = await import('../src/rules/body-engine.js'), H = await import('../src/rules/hunger.js'), C = await import('../src/rules/society.js');
  const r = B.seededRng('n100'), xs = Array.from({ length: 50000 }, () => S.drawTown(r)), sh = lo => xs.filter(x => x >= lo).length / xs.length;
  const bands = Math.abs(S.TOWN_BANDS.reduce((s, b) => s + b[0], 0) - 1) < 1e-9 && Math.abs(sh(1e5) - 0.296) < 0.01 && Math.abs(sh(1e4) - 0.563) < 0.01 && xs.every(x => x >= 500 && x <= 4e6);
  const pk = S.drawStart('EW1881-E.RA.BK-N4-K5-7f2c'), pr = S.drawStart('EW1881-E.RA.FR-N3-K5-1a2b'), ps = S.drawStart('EW1881-E.RA.BS-N4-D2-K5-7f2c');
  const tk = W.townOf(pk), tr = W.townOf(pr), ts = W.townOf(ps);
  const plans = pk.town === S.drawStart('EW1881-E.RA.BK-N4-K5-7f2c').town && tk.how === 'blood' && tr.how === 'grave' && tk.seen === C.seenPer100k(pk.law, pk.share, pk.deaths) && ts.seen === 0
    && W.townRate({ town: ts }) === 0 && W.nextKill({ town: ts }, 0, r) === Infinity && /^Seed \S+ · a (town|village|city) of about [\d,]+ people in England and Wales, /.test(S.knownStart(pk));
  // the circle's own feeders take their share of the town's
  const YEAR = 365 * 1440, base = { town: { people: 100000, seen: 100, how: 'blood' } }, own = { ...base, people: { x: { hunger: { every: YEAR / 10, next: 0, food: 'blood', prey: 'K' } } } };
  const rates = Math.abs(W.townRate(base) * YEAR - 100) < 1e-9 && Math.abs(W.townRate(own) * YEAR - 90) < 1e-9;
  // a busy city, a fortnight: one record a morning, counted; each heard by the circle
  const t0 = (await import('../src/rules/clock.js')).parseStoryTime('1881-03-03 21:00'), st = { people: { 'the lodger': {}, 'the neighbour': {} }, town: { people: 150000, seen: 1000, how: 'flesh' } }, rr = B.seededRng('busy');
  W.townWork(st, t0, rr); const early = st.facts?.length ?? 0;
  for (let m = 0; m <= 14 * 1440; m += 37) W.townWork(st, t0 + m, rr);
  const world = (st.facts ?? []).filter(f => !f.knowers.length), WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'], n = f => { const m = /^The bodies of (\w+) people/.exec(f.text); return !m ? 1 : WORDS.includes(m[1]) ? WORDS.indexOf(m[1]) : Number(m[1]); };
  const days = world.map(f => /on the morning of (.+?),/.exec(f.text)?.[1]);
  const busy = early === 0 && world.length >= 10 && new Set(days).size === world.length && world.every(f => / in the city on the morning of /.test(f.text) && /flesh gone$/.test(f.text))
    && world.reduce((s, f) => s + n(f), 0) + (st.town.found?.n ?? 0) === st.town.killed && Math.abs(st.town.killed - 1000 * 1.5 * 14 / 365) < 25
    && (st.pending ?? []).every(x => x.who && x.at >= H.foundAt(t0)) && (st.pending ?? []).length > 0;
  // not found before its morning; nothing without a town
  const one = { people: {}, town: { people: 50000, seen: 100, how: 'grave', next: t0 + 60 } }; W.townWork(one, t0 + 120, rr);
  const before = !one.facts?.length && one.town.found?.n === 1 && one.town.found.at === H.foundAt(t0 + 60);
  W.townWork(one, one.town.found.at, rr);
  const after = one.facts?.length === 1 && /^A fresh grave in the town was found opened on the morning of /.test(one.facts[0].text) && !one.town.found;
  // PassTime runs it, with or without the scene's people known
  fresh(); ctx.chat[0].mes = 'town pass'; T.setStoryTime(t0); const s2 = ctx.chatMetadata.rulesEngine.state; s2.town = { people: 3e6, seen: 1000, how: 'blood' };
  T.setPresent(undefined, 'Mary'); await run('PassTime', { minutes: 2 * 1440 });
  const passed = s2.town.killed > 0 && (s2.facts ?? []).some(f => / in the city on the morning of .*drained of blood$/.test(f.text));
  // a heard version that loses the morning's date keeps no stray "on" before the comma (memory-meaning.ts heldText)
  const MM = await import('../src/rules/memory-meaning.js'), gone = w => ({ word: w, as: '', how: 'forgotten' });
  const held = MM.heldText('The body was found in the town on the morning of Monday 7 March 1881, drained of blood', ['morning', 'Monday', '7', 'March', '1881'].map(gone)) === 'The body was found in the town, drained of blood'
    && MM.heldText('The body was found in the town on , drained of blood', []) === 'The body was found in the town, drained of blood';
  // a date is held as a whole: what is left of it said as people say it; a day of the month goes with its month
  const T0 = 'The body of a girl was found in the town on the morning of Sunday 13 February 1881, drained of blood', g = (w, as) => ({ word: w, as, how: as ? 'changed' : 'forgotten' });
  const dates = MM.heldText(T0, []) === T0 && MM.heldText(T0, [g('13', '')]) === 'The body of a girl was found in the town one Sunday morning in February 1881, drained of blood'
    && MM.heldText(T0, [g('February', ''), g('morning', 'noon')]) === 'The body of a girl was found in the town at noon one Sunday in 1881, drained of blood'
    && MM.heldText(T0, [g('Sunday', ''), g('13', ''), g('February', ''), g('1881', '1880')]) === 'The body of a girl was found in the town one morning in 1880, drained of blood'
    && MM.heldText('He came on Sunday and left', [g('Sunday', '')]) === 'He came and left' && MM.heldText('Mary was born in 1850 in Leeds', [g('1850', '1851')]) === 'Mary was born in 1851 in Leeds';
  // a victim's age and trade take "an" where said with a vowel ("an 18-year-old", "an 80-year-old")
  const vr = B.seededRng('victims'), vs = Array.from({ length: 3000 }, () => H.victimOf(vr));
  const articles = vs.every(v => { const m = /^(an?) (\d+)-year-old/.exec(v); return /^a baby (girl|boy)$/.test(v) || m && m[2] !== '0' && (m[1] === 'an') === /^(8\d?|1[18])$/.test(m[2]); }) && vs.some(v => /^an 18-year-old/.test(v)) && vs.some(v => /^an 8\d-year-old/.test(v)) && vs.some(v => /^a baby /.test(v));
  if (!(bands && plans && rates && busy && before && after && passed && held && dates && articles)) { miss++; console.log(`MISS the kind beyond the circle, in the town: ${JSON.stringify({ bands, plans, rates, busy, before, after, passed, held, dates, articles, killed: st.town.killed, world: world.length, sample: world[0]?.text, start: S.knownStart(pk).split('\n')[0] })}`); }
}
// N101: names on the tip of the tongue (tongue.ts; section 103): a proper name a character holds will not come with chance
// totBase × (1 − the strength of the strongest fact naming them) × the age factor (1 at 20, 7 at 70: once a week against once a
// day, Schwartz & Metcalfe 2011); one draw per name and story hour; the first letter told in 57 % of states, the syllables in
// 47 % (Brown & McNeill 1966); roles ("the lodger") and names not held never; [KNOWS] carries the line.
{
  const K = await import('../src/rules/knowledge.js'), T = await import('../src/rules/tongue.js');
  const NAMES = Array.from({ length: 40 }, (_, i) => `Person${String.fromCharCode(65 + (i % 26))}${i}`);
  const mk = (age) => { const st = { clock: { t: 0, add: 0 }, people: { Mary: { age }, 'the lodger': {} } }; for (const n of NAMES) { st.people[n] = {}; const f = K.learn(st, `${n} keeps a shop in the town`, ['Mary'], false, { Mary: 'saw it' }); f.imp = 5; } K.learn(st, 'the lodger came in late', ['Mary'], false, { Mary: 'saw it' }); st.clock.add = 150 * 1440; return st; };
  const old = mk(70), young = mk(20), held = NAMES.filter(n => T.totChance(old, 'Mary', n) > 0);
  // each hour's states against that hour's chances (the memories weaken as the hours pass)
  const count = (st, hours) => { let n = 0, first = 0, syl = 0, e = 0, all = []; for (let h = 0; h < hours; h++) { st.clock.add = 150 * 1440 + h * 60; const mine = K.heldFacts(st, 'Mary', st.facts.filter(f => !f.everyone)), t = T.onTheTongue(st, 'Mary', mine); e += Object.keys(st.people).reduce((s, x) => s + T.totChance(st, 'Mary', x, mine), 0); n += t.length; first += t.filter(x => x.first).length; syl += t.filter(x => x.syllables).length; all.push(...t); } st.clock.add = 150 * 1440; return { n, first, syl, e, all }; };
  const co = count(old, 3000), cy = count(young, 3000), eo = co.e, ey = cy.e;
  const f0 = held[0], fx = (old.facts ?? []).find(f => f.text.startsWith(f0));
  const formula = Math.abs(T.totChance(old, 'Mary', f0) - Math.min(1, 0.1 * (1 - K.recallStrength(old, fx, 'Mary')) * 7)) < 1e-9 && T.totChance(old, 'Mary', 'Nobody') === 0
    && Math.abs(T.ageFactor(20) - 1) < 1e-9 && Math.abs(T.ageFactor(70) - 7) < 1e-9 && Math.abs(T.ageFactor(45) - Math.sqrt(7)) < 1e-9 && Math.abs(T.ageFactor(90) - 7) < 1e-9;
  const rates = held.length >= 10 && Math.abs(co.n - eo) < 4 * Math.sqrt(eo) + 1 && Math.abs(cy.n - ey) < 4 * Math.sqrt(ey) + 1 && co.n > 3 * cy.n
    && Math.abs(co.first / co.n - 0.57) < 0.12 && Math.abs(co.syl / co.n - 0.47) < 0.12 && co.all.every(t => !/^the /i.test(t.name) && held.includes(t.name));
  // the same within an hour; the [KNOWS] line
  let hour = -1; for (let h = 0; h < 3000 && hour < 0; h++) { old.clock.add = 150 * 1440 + h * 60; if (T.onTheTongue(old, 'Mary', K.heldFacts(old, 'Mary', old.facts)).length) hour = h; }
  old.clock.add = 150 * 1440 + hour * 60 + 59; const same = JSON.stringify(T.onTheTongue(old, 'Mary'));
  old.clock.add = 150 * 1440 + hour * 60; const block = K.knowledgeBlock(old), tot = T.onTheTongue(old, 'Mary');
  const shown = hour >= 0 && same === JSON.stringify(tot) && block.includes(`On the tip of the tongue now: ${T.totPhrase(tot[0])}`) && /'s name will not come \(they know who; /.test(block) && /"On the tip of the tongue now" names a person/.test(block)
    && T.totPhrase({ name: 'Thomas Pike', first: 'T', syllables: 3 }) === "Thomas Pike's name will not come (they know who; they can tell it starts with T and it has three syllables)"
    && T.totPhrase({ name: 'Ann' }) === "Ann's name will not come (they know who; nothing of it comes)";
  const words = T.syllables('Thomas Pike') === 3 && T.syllables('Mary') === 2 && T.syllables('George') === 1 && T.syllables('Eliza') === 3 && !T.properName('the lodger') && T.properName('Thomas Pike');
  if (!(formula && rates && shown && words)) { miss++; console.log(`MISS names on the tip of the tongue: ${JSON.stringify({ formula, rates, shown, words, held: held.length, old: [co.n, Math.round(eo)], young: [cy.n, Math.round(ey)], first: co.first / co.n, syl: co.syl / co.n, hour })}`); }
}
// N102: the story's own links between words (links.ts, memory-meaning.ts setLinks; section 104): "a = b = c" names one
// thing (a changed one comes out as another), "a : b" a kind (a lost word held as it, a changed one as another of it); a
// phrase by its head word; a lorebook entry's plain keys give a group, regular expressions and disabled entries none; the
// story's kind comes before WordNet's.
{
  const L = await import('../src/rules/links.js'), MM = await import('../src/rules/memory-meaning.js');
  const parsed = JSON.stringify(L.parseLink("the Red Lion = Pike's = the inn")) === JSON.stringify({ same: ['lion', "pike's", 'inn'] })
    && JSON.stringify(L.parseLink('the returned : monster')) === JSON.stringify({ kind: ['returned', 'monster'] })
    && 'error' in L.parseLink('the inn') && 'error' in L.parseLink('inn = the inn') && L.headWord('the blood-drinkers') === 'blood-drinkers' && L.headWord('the Red Lion') === 'lion' && L.headWord('magical forest') === 'forest' && L.headWord('the cold ones') === 'cold' && L.headWord('the keeper of the inn') === 'keeper';
  const lore = L.groupsOfLore([{ key: ['Red Lion', 'the inn', "Pike's"] }, { key: ['/lion/i', 'den'] }, { key: ['vicar', 'parson'], disable: true }, { key: ['ale'] }, { key: 'x' }]);
  const loreOk = JSON.stringify(lore) === JSON.stringify([['lion', 'inn', "pike's"]]);
  const before = MM.heldBy('inn', 'changed', 0.1).how, beforeLeft = MM.heldBy('returned', 'left', 0.5, [], false).how;
  MM.setLinks({ same: lore, kinds: { returned: 'monster', poodle: 'pet' } });
  const same = MM.heldBy('inn', 'changed', 0.1), kind = MM.heldBy('returned', 'left', 0.5, [], false), kindC = MM.heldBy('returned', 'changed', 0.5, [], false), own = MM.heldBy('poodle', 'left', 0.3);
  const linked = same.how === 'as another word for the same' && ['lion', "pike's"].includes(same.as) && kind.as === 'monster' && kind.how === 'held only as monster' && kindC.as === 'another monster'
    && own.as === 'pet' && MM.heldText('they drank at the inn', [same]) === `they drank at the ${same.as}` && before !== same.how && beforeLeft === 'left out';
  MM.setLinks({ same: [], kinds: {} });
  const cleared = MM.heldBy('poodle', 'left', 0.3).as === 'dog';
  if (!(parsed && loreOk && linked && cleared)) { miss++; console.log(`MISS the story's own links between words: ${JSON.stringify({ parsed, loreOk, linked, cleared, lore, same, kind, own })}`); }
}
// N103: sections 94–101's judgements registered (section 105): each with a range that holds its value, listed in the
// registry, and read where it decides: overriding one changes the outcome it sets.
{
  const C = await import('../src/rules/constants.js'), S = await import('../src/rules/society.js'), R = await import('../src/rules/retell.js'), H = await import('../src/rules/hunger.js');
  const M = await import('../src/rules/meetings.js'), Sd = await import('../src/rules/seed.js');
  const IDS = ['foundHour', 'retellLost', 'retellChanged', 'tellerHours', 'tellersMax', 'householdMeals', 'wakingHours', 'stageRun', 'stagePanic', 'stageEmergency', 'stageCollapse', 'nameKnownMin', 'villageUnder', 'cityFrom', 'smallestPlace'];
  const reg = IDS.every(id => { const c = C.REGISTRY_K.get(id); return c && c.range && c.value >= Math.min(...c.range) && c.value <= Math.max(...c.range) && ['assumed', 'raw', 'sourced', 'fitted'].includes(c.status); });
  const o = (id, v, fn) => C.withOverride(id, v, fn);
  const moved = S.stageOf(13.4) === 'a panic' && await o('stagePanic', 20, () => S.stageOf(13.4)) === 'a run of killings' && await o('stageEmergency', 10, () => S.stageOf(13.4)) === 'an emergency'
    && R.tellersBy(0, 300) === 2 && await o('tellerHours', 2, () => R.tellersBy(0, 300)) === 3 && await o('tellersMax', 2, () => R.tellersBy(0, 5000)) === 2
    && H.foundAt(0) === 480 && await o('foundHour', 6, () => H.foundAt(0)) === 360
    && M.meetRate({ home: 'h' }, { home: 'h' }) === 3 && await o('householdMeals', 2, () => M.meetRate({ home: 'h' }, { home: 'h' })) === 2
    && Math.abs(await o('wakingHours', 8, () => M.meetChance(1, 480)) - (1 - Math.exp(-1))) < 1e-12
    && Sd.placeWord(1500) === 'village' && await o('villageUnder', 1000, () => Sd.placeWord(1500)) === 'town' && await o('cityFrom', 60000, () => Sd.placeWord(80000)) === 'city';
  // every detail lost when nothing is kept: a third changed by default, all changed with retellChanged 1
  const T = 'the lodger came in at midnight with mud to the knees and a knife in his coat';
  const keep = (await o('retellLost', 1, () => R.retellFates(T, 1, 'k'))).every(x => x.fate !== 'kept') && (await o('retellLost', 1, () => o('retellChanged', 1, () => R.retellFates(T, 1, 'k')))).every(x => x.fate === 'changed');
  if (!(reg && moved && keep)) { miss++; console.log(`MISS sections 94–101's judgements registered: ${JSON.stringify({ reg, moved, missing: IDS.filter(id => !C.REGISTRY_K.get(id)) })}`); }
}
// N104: a kind active by night keeps the night (days.ts NIGHT_SHIFT, TrueNature; section 106): its whole day runs twelve hours
// later, what it does at any hour being what the day it drew does twelve hours earlier; TrueNature shifts the day of one of a
// night kind; a feeder feeds only awake and free (a feeding due while asleep waits for waking).
{
  const D = await import('../src/rules/days.js'), Sd = await import('../src/rules/seed.js'), Wb = await import('../src/rules/world.js');
  const ep = (y, m, d) => { const t = new Date(0), e = new Date(0); t.setUTCFullYear(y, m - 1, d); e.setUTCFullYear(1, 0, 1); return Math.round((t - e) / 864e5); };
  const day = { rise: 6 * 60 - 37, sleep: 395, work: { start: 360, end: 360 + 11 * 60 } }, night = { ...day, shift: D.NIGHT_SHIFT }, t0 = ep(1881, 9, 12) * 1440;
  let same = true; for (let t = t0; t < t0 + 7 * 1440; t += 37) if (D.doingAt(night, t) !== D.doingAt(day, t - 720) || D.nextChange(night, t) !== D.nextChange(day, t - 720) + 720) same = false;
  const wed = ep(1881, 9, 14) * 1440, shifted = same && D.doingAt(night, wed + 3 * 60) === 'at work' && D.doingAt(day, wed + 3 * 60) === 'asleep' && D.doingAt(night, wed + 14 * 60) === 'asleep' && D.doingAt(day, wed + 14 * 60) === 'at work';
  // TrueNature with a night kind
  const kind = { ...Sd.readLaw('E.BA.BK'), sheet: { active: 'night', resists: [], attrs: {} } }, dayKind = { ...kind, what: kind.what + ' by day', sheet: { active: 'day', resists: [], attrs: {} } };
  Wb.applyWorld([kind, dayKind]);
  fresh(); ctx.chat[0].mes = 'night kind'; T.setStoryTime(ep(1881, 9, 14) * 1440 + 12 * 60);
  const st = ctx.chatMetadata.rulesEngine.state; st.setting = { country: 'United Kingdom', place: 'Bradford' };
  T.setPresent(undefined, 'Mary');
  await run('NewCharacter', { who: 'Mary', age: 31, sex: 'female' }); await run('NewCharacter', { who: 'the lodger', age: 30, sex: 'male', occupation: 'Clerk' }); await run('NewCharacter', { who: 'the clerk', age: 30, sex: 'male', occupation: 'Clerk' });
  await run('TrueNature', { who: 'the lodger', kind: kind.what }); await run('TrueNature', { who: 'the clerk', kind: dayKind.what });
  const lodger = st.people['the lodger'], clerk = st.people['the clerk'], set = lodger.day?.shift === 720 && !clerk.day?.shift;
  // due now, at noon, while the night kind sleeps: fed only once awake and free
  const startT = T.storyTime(); lodger.hunger.next = startT; T.setPresent(['Mary'], 'Mary');
  for (const n of Object.keys(st.people)) await run('BodyIntake', { who: n, water_l: 2.5, food_kcal: 2200 });
  await run('PassTime', { minutes: 1440, resting: ['Mary'] });
  const fedAt = lodger.hunger.next - lodger.hunger.every, awake = (lodger.hunger.fed ?? 0) >= 1 && D.doingAt(lodger.day, fedAt) === 'about' && D.doingAt(lodger.day, startT) === 'asleep' && fedAt > startT;
  if (!(shifted && set && awake)) { miss++; console.log(`MISS a kind active by night keeps the night: ${JSON.stringify({ same, shifted, set, awake, shift: lodger.day?.shift, fed: lodger.hunger.fed, at: fedAt % 1440 / 60, doing: D.doingAt(lodger.day, fedAt), start: D.doingAt(lodger.day, startT), day: lodger.day })}`); }
  Wb.applyWorld([]);
}
// N105: a body with no warmth of its own (NO_HEAT; thermal/exposure.ts, jos3.ts metScale, body-engine.ts; section 107): it
// starts at the air's temperature and keeps near it (no sweating, shivering or change of skin blood flow; heat at 15 % of a
// warm body's), so it spends far less food in the cold; no hypothermia stage stops time or kills it; moved into a warm room it
// warms slowly; the status says it keeps no warmth.
{
  const C = await import('../src/rules/clock.js');
  fresh(); ctx.chat[0].mes = 'no warmth'; T.setStoryTime(C.parseStoryTime('1881-01-10 21:00'));
  const st = ctx.chatMetadata.rulesEngine.state;
  await run('NewCharacter', { who: 'Warm', age: 30, sex: 'male' }); await run('NewCharacter', { who: 'Cold', age: 30, sex: 'male' });
  st.people.Cold.bodyFlags = ['NO_HEAT'];
  await run('BodyEnvironment', { who: ['Warm', 'Cold'], air_c: 2, wind_kmh: 0 });
  const r1 = String(await run('PassTime', { minutes: 480, resting: ['Warm', 'Cold'] }));
  const cold = st.people.Cold, warm = st.people.Warm;
  const kept = Math.abs(cold.thermal.core - 2) < 3 && warm.thermal.core > 35 && !cold.dead && !cold.unconscious && /^480 minutes passed/.test(r1)
    && (warm.needs?.kcal ?? 0) > 3 * Math.max(1, cold.needs?.kcal ?? 0) && /Cold \(human\):[^\n]*body at the temperature around it: core [\d.]+ °C \(no warmth of its own\)/.test(r1) && !/Cold \(human\):[^\n]*hypothermia/.test(r1);
  // both into the warm room, so no one's cold stops the time
  await run('BodyEnvironment', { who: ['Warm', 'Cold'], air_c: 25, wind_kmh: 0 });
  const r2 = String(await run('PassTime', { minutes: 120, resting: ['Warm', 'Cold'] }));
  for (const n of ['Warm', 'Cold']) await run('BodyIntake', { who: n, water_l: 2.5, food_kcal: 2200 });
  const c2 = cold.thermal.core, r3 = String(await run('PassTime', { minutes: 600, resting: ['Warm', 'Cold'] })), c3 = cold.thermal.core;
  const warms = /^120 minutes passed/.test(r2) && /^600 minutes passed/.test(r3) && c2 > 5 && c2 < 15 && c3 > 20 && c3 < 25;
  if (!(kept && warms)) { miss++; console.log(`MISS a body with no warmth of its own: ${JSON.stringify({ kept, warms, cold: cold.thermal.core, warm: warm.thermal.core, kcal: [warm.needs?.kcal, cold.needs?.kcal], c2, c3, head: r1.split('\n')[0], r2: r2.split('\n')[0], r3: r3.split('\n')[0] })}`); }
}
// N106: eyes that see in the dark (EXTRAVISION; body-engine.ts seeLux, darkSightGain; section 108): the light counts six times
// brighter (a cat's threshold about a sixth of a person's), so at night such a viewer makes out what another does not; in
// daylight it changes nothing seen; Look says so; TrueNature gives the flag to one of a kind whose sheet sees in the dark.
{
  const B = await import('../src/rules/body-engine.js'), V = await import('../src/rules/vision.js'), Sd = await import('../src/rules/seed.js'), Wb = await import('../src/rules/world.js'), C = await import('../src/rules/clock.js');
  const cat = { bodyFlags: ['EXTRAVISION'] }, man = { bodyFlags: [] };
  const gain = B.seeLux(cat, 0.01) === 0.06 && B.seeLux(man, 0.01) === 0.01 && B.seeLux(null, 5) === 5;
  const night = V.see({ size: 0.5, distance: 20, light: B.seeLux(cat, 0.001) }).detect > V.see({ size: 0.5, distance: 20, light: 0.001 }).detect + 0.3
    && Math.abs(V.see({ size: 0.5, distance: 20, light: B.seeLux(cat, 10000) }).detect - V.see({ size: 0.5, distance: 20, light: 10000 }).detect) < 0.01;
  const kind = { ...Sd.readLaw('E.BA.BK'), sheet: { active: 'night', resists: [], attrs: {}, senses: { sight: 1, hearing: 1, smell: 1, dark: true } } };
  Wb.applyWorld([kind]);
  fresh(); ctx.chat[0].mes = 'dark eyes'; T.setStoryTime(C.parseStoryTime('1881-01-10 23:30'));
  const st = ctx.chatMetadata.rulesEngine.state;
  await run('NewCharacter', { who: 'Mary', age: 31, sex: 'female' }); await run('NewCharacter', { who: 'the lodger', age: 30, sex: 'male' });
  await run('TrueNature', { who: 'the lodger', kind: kind.what });
  const flag = st.people['the lodger'].bodyFlags.includes('EXTRAVISION') && !(st.people.Mary.bodyFlags ?? []).includes('EXTRAVISION');
  const said = String(await run('Look', { viewer: 'the lodger', target: 'a man', kind: 'a person', distance_m: 15, latitude: 51.5 })), plain = String(await run('Look', { viewer: 'Mary', target: 'a man', kind: 'a person', distance_m: 15, latitude: 51.5 }));
  const told = /eyes that see in the dark \(as 6 times the light\)/.test(said) && !/see in the dark/.test(plain);
  Wb.applyWorld([]);
  if (!(gain && night && flag && told)) { miss++; console.log(`MISS eyes that see in the dark: ${JSON.stringify({ gain, night, flag, told, said: said.slice(0, 200) })}`); }
}
// N107: the kind's own number (world-count.ts KindGrowth, seed.ts kindGrowth, kind-sheet.ts numbersOf; section 110): the born
// keep their share; the made and the arrived gain 1 % of their number a year and the returned 1 % of the place's dead, each
// losing the place's deaths and leavers; the first year's kills are the seed's; the dead feed a corpse-eater first; a kind
// whose kills are its food starves in the share it cannot feed; one that eats its own thins; the sheet says the rate.
{
  const W = await import('../src/rules/world-count.js'), Sd = await import('../src/rules/seed.js'), KS = await import('../src/rules/kind-sheet.js');
  const at = (rows, y) => rows.find(r => r.year === y), none = W.yearByYear(1881, 1921, 0, 0);
  const near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const g = (origin, o = {}) => ({ origin, killsEach: 0, eatsDead: false, feeds: false, eatsOwn: 0, ...o }), share = 1e-4;
  const run = (o, sh = share) => W.yearByYear(1881, 1921, sh, 0, o);
  const born = run(g('born')), made = run(g('made')), back = run(g('returned')), came = run(g('arrived')), own = run(g('born', { eatsOwn: Math.log(2) }));
  const r0 = at(none, 1881), b = r0.births / r0.people, d = r0.deaths / r0.people, l = r0.left / r0.people, k0 = r0.people * share;
  // a corpse-eater the dead of 1881 feed nine-tenths over: no kills then; by 1911 the death rate has fallen below its need
  const ghoul = run(g('born', { killsEach: 1, eatsDead: true, feeds: true }), 0.9 * d);
  const starve = W.yearByYear(1881, 1884, 0.1, 0, g('born', { killsEach: 20.0549, feeds: true }));
  const seeds = ['EW1881-BH.BA-N5-D1-K5-7f2c', 'EW1881-E.MA.FK-N5-K5-7f2c', 'EW1881-BHE.RA.BK-N2-K5-005a', 'EW1841-E.RA.BK-N5-K5-7f2c'].map(c => Sd.drawStart(c));
  const firstKills = seeds.every(p => { const rows = W.yearByYear(p.year, 1921, p.share, p.deaths, Sd.kindGrowth(p)), r = rows[0]; return near(r.killed, Math.min(r.people - r.kind, r.people * p.deaths / 1e5), 1e-9); });
  const gr = (c) => Sd.kindGrowth(Sd.drawStart(c)), bk = gr('EW1881-BHE.RA.BK-N2-K5-005a'), md = gr('EW1881-BH.MA-N5-D1-K5-7f2c'), fo = gr('EW1881-HE.BA.FO-N4-D1-K5-1a2b'), fr = gr('EW1881-BHE.BA.FR-N3-K5-1a2b');
  const ok = [1881, 1891, 1901, 1911, 1921].every(y => near(at(born, y).kind / at(born, y).people, share, 1e-9))
    && near(at(made, 1882).kind, k0 * (1 + 0.01 - d - l)) && near(at(made, 1882).people, at(none, 1882).people, 1e-9)
    && near(at(back, 1882).kind, k0 * (1 - d - l) + 0.01 * r0.deaths) && near(at(back, 1882).people, at(none, 1882).people + 0.01 * r0.deaths, 1e-9)
    && near(at(came, 1882).kind, k0 * (1 + 0.01 - d - l)) && near(at(came, 1882).people, at(none, 1882).people + 0.01 * k0, 1e-9)
    && near(at(own, 1882).kind, k0 * (1 + b - d - l) * 0.5)
    && firstKills && at(ghoul, 1881).killed === 0 && at(ghoul, 1911).killed > 0 && near(at(ghoul, 1891).kind / at(ghoul, 1891).people, 0.9 * d, 1e-9)
    && at(starve, 1882).kind > 0 && at(starve, 1882).people === at(starve, 1882).kind && at(starve, 1883).people === 0
    && bk.origin === 'returned' && bk.feeds && !bk.eatsDead && near(bk.killsEach, Sd.dietMinimum({ food: 'blood', prey: 'K', kills: true }, 70, true).bodiesYear)
    && md.origin === 'made' && !md.feeds && near(md.killsEach, Sd.drawStart('EW1881-BH.MA-N5-D1-K5-7f2c').killsEach) && fo.origin === 'born' && fo.eatsOwn > 2 && fr.eatsDead && fr.feeds
    && KS.numbersOf('were made') === 'others of them are made from the living: 1 % of their number a year' && KS.numbersOf('came back from death') === '1 % of the place\'s dead come back as one of them'
    && KS.numbersOf('came from elsewhere') === 'more arrive: 1 % of their number a year' && KS.numbersOf('rose from the sea') === 'their own children, at the place\'s birth rate, are of the kind'
    && Sd.drawStart('EW1881-BHE.RA.BK-N2-K5-005a').law.sheet.numbers === KS.numbersOf('came back from death');
  if (!ok) { miss++; console.log(`MISS the kind's own number: ${JSON.stringify({ made: at(made, 1882).kind, back: at(back, 1882).kind, came: at(came, 1882).kind, own: at(own, 1882).kind, k0, firstKills, ghoul: [at(ghoul, 1881).killed, at(ghoul, 1911).killed], starve: starve.map(r => [r.people, r.kind]), bk, md, fo, fr })}`); }
}
// N108: the looks (expression-set.ts; section 111): a look's state is a feeling's appraisal (Appraise's answers, sudden or not,
// a bad outcome's control and power, the strength) or calm, with the body's pain, sleepiness or closed eyes; each makes the
// face the component process model and the displays' studies predict (sudden 1 2; one's own action praised 12 53, blamed
// 54 64; pain 4 6 9 43; sleepy 7 9 18 45 55; eyes closed 43 alone), each unit at the feeling's strength and the stronger part
// winning; the agglomerative bottleneck over the faces, feelings alike on a well body, has its knee at 6 looks, calm's a faint
// smile; pain seen often takes its own look; σ 1.5 gives 7; each person's look state is counted as a reply comes, in the state
// and the record.
{
  const X = await import('../src/rules/expression-set.js'), E = await import('../src/rules/emotion.js'), B = await import('../src/rules/body-engine.js');
  const f = (s, b = {}) => X.faceText(X.faceOf(s, b)), bad = { about: E.ABOUT[2], good: false, sudden: false, strength: 1 };
  const all = X.allStates(), faces = new Set(); for (const b of X.BODY_STATES) { faces.add(f(null, b)); for (const s of all) faces.add(f(s, b)); }
  const set = X.expressionSet({}, 1), knee = set.knee.looks.map(l => `${l.calm ? 'calm:' : ''}${X.faceText(l.face)}`);
  const pained = X.expressionSet({ [X.jointKey(null, { pain: true })]: 40 }, 1).knee.looks.map(l => X.faceText(l.face));
  const st = ctx.chatMetadata.rulesEngine.state, ivy = B.person(st, 'Ivy');
  ctx.chat.push({ mes: 'N108 storm', is_user: true });
  await run('Appraise', { who: 'Ivy', about: E.ABOUT[2], matters: E.MATTERS[2], good: false, sudden: true, can_be_changed: false, target: 'the storm coming' });
  const fear = ivy.feelings?.find(x => x.type === 'fear'), key = X.jointOf(ivy), before = st.faced?.[key] ?? 0, hist = () => ctx.chatMetadata.rulesEngine.history, logN = hist()?.n ?? 0;
  ctx.chat.push({ mes: 'The wind rose.', is_user: false, extra: {} });
  T.onRulesMessageReceived(ctx.chat.length - 1);
  const counted = st.faced?.[key] === before + 1 && !!hist()?.log.some(e => e.n > logN && e.tool === 'looks counted');
  const hurt = B.newPerson(70); hurt.wounds = [{ id: 1, part: 'arm', pid: 'x', type: 'cut', bleed: 0, age: 10 / 1440, cleanedAt: null, infection: null, splinted: false, heals: null, healed: false }];
  const old = B.newPerson(70); old.wounds = [{ ...hurt.wounds[0], age: 2 }];
  const out = B.newPerson(70); out.unconscious = 'test';
  const ok = all.length === 224 && X.BODY_STATES.length === 5 && faces.size === 293
    && f({ about: E.ABOUT[0], good: true, sudden: true, strength: 1 }) === '1 2 12 25' && f({ about: E.ABOUT[4], praiseworthy: true, result: 'none', strength: 1 }) === '12 53'
    && f({ about: E.ABOUT[4], praiseworthy: false, result: 'none', strength: 1 }) === '54 64' && f(null, { pain: true }) === '4 6 9 43' && f(null, { sleepy: true }) === '7 9 18 45 55'
    && f(bad, { eyesClosed: true }) === '43' && f({ ...bad, strength: 0.5 }) === '4½ 7½ 17½ 23½' && f({ ...bad, strength: 0.5 }, { pain: true }) === '4 6 7½ 9 17½ 23½ 43'
    && f({ ...bad, control: true, power: false }) === '1 2 4 5 7 17 20 23 26 38' && f({ ...bad, control: false }) === '4 7 15 17 23 25 26 41 43'
    && set.knee.looks.length === 6 && knee[0] === 'calm:12½ 25½' && ['4 7 17 23', '4 7 15 17 23 25 26 41 43', '1 2 4 5 7 17 20 23 26 38', '4 7 9 10 15 17 24 39'].every(x => knee.includes(x))
    && set.curve.every((c, i, a) => i === 0 || (c.cost <= a[i - 1].cost + 1e-9 && c.tells <= a[i - 1].tells + 1e-9))
    && pained.includes('4 6 9 43') && X.expressionSet({}, 1.5).knee.looks.length === 7
    && X.bodyOf(hurt).pain === true && X.bodyOf(old).pain === undefined && X.bodyOf(out).eyesClosed === true
    && fear?.state === X.stateKey({ about: E.ABOUT[2], good: false, sudden: true, control: false, strength: 1 }) && counted;
  if (!ok) { miss++; console.log(`MISS the looks: ${JSON.stringify({ counted, n: all.length, faces: faces.size, knee, pained, fear, counted, hurt: X.bodyOf(hurt), old: X.bodyOf(old), out: X.bodyOf(out) })}`); }
}
// N109: a face in words (face-words.ts; section 112): each action unit the Danbooru tag whose definition is its movement, the
// brows by what moves together, the lighter tag or a lower weight at half strength, a contradicted unit dropped (closed eyes over
// the rest, the raised lid over the tightened, an open mouth over pursed lips) and the units no tag names dropped; a look's
// sprite label from its face, with no "-" or "." (SillyTavern reads a label up to either).
{
  const W = await import('../src/rules/face-words.js'), X = await import('../src/rules/expression-set.js');
  const t = (face) => { const r = W.faceTags(face); return `${r.tags.join(', ')}${r.dropped.length ? ` [${r.dropped.join(' ')}]` : ''}`; };
  const F = (s) => Object.fromEntries(s.split(' ').map(x => [parseInt(x), x.endsWith('½') ? 0.5 : 1]));
  const labels = X.expressionSet({}, 1).knee.looks.map(l => W.lookLabel(l.face));
  const got = { smile: t(F('12 25')), faint: t(F('12½ 25½')), frown: t(F('4 7 17 23')), lost: t(F('4 7 15 17 23 25 26 41 43')), fear: t(F('1 2 4 5 7 17 20 23 26 38')),
    pain: t(F('4 6 9 43')), sleepy: t(F('7 9 18 45 55')), pride: t(F('12 53')), shame: t(F('54 64')), inner: t(F('1')), calm: t({}) };
  const ok = got.smile === 'smile, parted lips' && got.faint === 'light smile, (parted lips:0.7)'
    && got.frown === 'v-shaped eyebrows, narrowed eyes, pursed lips, closed mouth [17]'
    && got.lost === 'v-shaped eyebrows, closed eyes, frown, open mouth [7 17 23 41]'
    && got.fear === 'furrowed brow, raised eyebrows, wide-eyed, wavy mouth, open mouth [7 17 23 38]'
    && got.pain === 'v-shaped eyebrows, closed eyes, closed mouth [6 9]' && got.sleepy === 'half-closed eyes, puckered lips, closed mouth, head tilt [7 9]'
    && got.pride === 'smile, closed mouth, head back' && got.shame === 'closed mouth, head down, looking down' && got.inner === 'raised inner eyebrows, closed mouth' && got.calm === 'closed mouth'
    && W.lookLabel(F('12½ 25½')) === 'look_12h_25h' && W.lookLabel({}) === 'look_calm' && labels.length === 6 && labels.every(l => /^look_[a-z0-9_]+$/.test(l)) && new Set(labels).size === 6;
  if (!ok) { miss++; console.log(`MISS a face in words: ${JSON.stringify({ got, labels })}`); }
}
// N110: the faces made (faces.ts; section 112), against a stand-in SillyTavern and image backend: only the faces the character
// lacks are made; each from the card picture by img2img at denoising 0 with ADetailer redrawing the face alone at
// lookFaceDenoise and at faceInpaintPx a side, the prompt as SillyTavern's Image Generation makes it (its common prefix, the
// character's own prompt, then the face's tags; its negative prompt and the character's; the macros filled), one seed for all
// of a character's faces; the backend reached through the CORS proxy when the straight call fails, SillyTavern's token on the
// proxy route only; each face saved as the character's sprite labelled by its face; a backend that does not answer, one without
// ADetailer, a source that cannot keep the picture, another character or a group chat on ComfyUI, and a ComfyUI workflow
// without the character's picture each stop with why, saving nothing; a ComfyUI workflow that takes it draws through /imagine
// with the same seed.
{
  const Fc = await import('../src/faces.js'), W = await import('../src/rules/face-words.js'), X = await import('../src/rules/expression-set.js');
  const looks = X.expressionSet({}, 1).knee.looks, labels = looks.map(l => W.lookLabel(l.face));
  const card = new Uint8Array([137, 80, 78, 71, 1, 2, 3]), drawn = new Uint8Array([137, 80, 78, 71, 9, 9]), b64 = (u) => Buffer.from(u).toString('base64');
  const realFetch = globalThis.fetch, realBitmap = globalThis.createImageBitmap;
  let calls = [], have = [], scripts = {}, straight = false, proxyOn = true, workflow = '';
  globalThis.createImageBitmap = async () => ({ width: 832, height: 1216 });
  globalThis.fetch = async (u, o = {}) => {
    const url = String(u), res = (body, ok = true) => ({ ok, json: async () => body });
    calls.push({ url, o });
    if (url.startsWith('/api/sprites/get?name=')) return res(have.map(label => ({ label, path: `/characters/Mary/${label}.png` })));
    if (url === '/api/sprites/upload') { have.push(o.body.get('label')); return res({ ok: true }); }
    if (url === '/characters/mary.png') return { ok: true, blob: async () => new Blob([card]) };
    if (url === '/characters/rules-people/the_lodger_x/portrait.png') return { ok: true, blob: async () => new Blob([drawn]) };
    if (url === '/api/sd/comfy/workflow') return res(workflow);
    if (url === '/user/images/drawn.png') return { ok: true, blob: async () => new Blob([drawn]) };
    if (url.startsWith('http') && !straight) throw new TypeError('Failed to fetch');
    if (url.startsWith('/proxy/') && !proxyOn) return res('Not found', false);
    if (url.endsWith('/sdapi/v1/scripts')) return res(scripts);
    if (url.endsWith('/sdapi/v1/img2img') || url.endsWith('/sdapi/v1/txt2img')) return res({ images: [b64(drawn)] });
    return res(null, false);
  };
  const sdAuto = { source: 'auto', auto_url: 'http://127.0.0.1:7860/', width: 832, height: 1216, prompt_prefix: 'masterpiece, best quality,', negative_prompt: 'lowres', sampler: 'Euler a', scheduler: 'Automatic', steps: 28, scale: 6,
    character_prompts: { mary: '{{char}}, 1girl, red hair' }, character_negative_prompts: { mary: 'freckles,' } };
  let slash = '';
  const c = (sd, more = {}) => ({ extensionSettings: { sd }, getRequestHeaders: () => ({ 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' }), name2: 'Mary', substituteParams: (t) => t.replaceAll('{{char}}', 'Mary'),
    executeSlashCommandsWithOptions: async (t) => { slash = t; return { pipe: '/user/images/drawn.png' }; }, ...more });
  const mary = { url: '/characters/mary.png', folder: 'Mary', key: 'mary' };
  const run = async (sd, who = 'Mary', toast, more, base = mary) => { calls = []; return Fc.makeFaces(c(sd, more), who, base, looks, toast); };
  const ups = () => calls.filter(x => x.url === '/api/sprites/upload'), toasts = [];
  // Made from the card picture, one face already there.
  have = [labels[0]]; scripts = { txt2img: [], img2img: ['ADetailer', 'xyz plot'] };
  const said = await run(sdAuto, 'Mary', m => toasts.push(m));
  const i2i = calls.filter(x => x.url.endsWith('/sdapi/v1/img2img')), viaProxy = i2i.filter(x => x.url === '/proxy/http://127.0.0.1:7860/sdapi/v1/img2img');
  const bodies = viaProxy.map(x => JSON.parse(x.o.body)), made = ups();
  const forms = await Promise.all(made.map(async x => { const f = x.o.body.get('avatar'); return { name: x.o.body.get('name'), label: x.o.body.get('label'), sprite: x.o.body.get('spriteName'), file: f.name, type: f.type, bytes: [...new Uint8Array(await f.arrayBuffer())].join(','), headers: x.o.headers }; }));
  const firstOk = said === `Made 5 of Mary's 6 faces; the others were there.` && looks.length === 6 && toasts.length === 5 && toasts[0] === 'Making Mary\'s face 1 of 5…'
    && i2i.length === 10 && viaProxy.length === 5 && i2i.filter(x => x.url.startsWith('http')).every(x => !('X-CSRF-Token' in x.o.headers) && !('Authorization' in x.o.headers))
    && viaProxy.every(x => x.o.headers['X-CSRF-Token'] === 'tok')
    && bodies.every((b, i) => { const p = ['masterpiece, best quality, Mary, 1girl, red hair', ...W.faceTags(looks[i + 1].face).tags].join(', '), a = b.alwayson_scripts?.ADetailer?.args ?? [];
      return b.prompt === p && b.init_images?.[0] === b64(card) && b.denoising_strength === 0 && b.seed === Fc.seedOf('Mary') && b.width === 832 && b.height === 1216
        && b.negative_prompt === 'lowres, freckles' && a[2]?.ad_negative_prompt === 'lowres, freckles' && b.sampler_name === 'Euler a' && b.steps === 28 && b.cfg_scale === 6
        && a[0] === true && a[1] === true && a[2]?.ad_model === 'face_yolov8n.pt' && a[2]?.ad_prompt === p && a[2]?.ad_denoising_strength === 0.5 && a[2]?.ad_mask_k === 1
        && a[2]?.ad_use_inpaint_width_height === true && a[2]?.ad_inpaint_width === 1024 && a[2]?.ad_inpaint_height === 1024; })
    && forms.length === 5 && forms.every((f, i) => f.name === 'Mary' && f.label === labels[i + 1] && f.sprite === labels[i + 1] && f.file === `${labels[i + 1]}.png` && f.type === 'image/png'
      && f.bytes === [...drawn].join(',') && f.headers['X-CSRF-Token'] === 'tok' && !('Content-Type' in f.headers));
  // Nothing more to make; the straight route first, the backend's password on both routes, SillyTavern's token on neither straight.
  const again = await run(sdAuto), againCalls = calls.length;
  straight = true; calls = [];
  await Fc.toBackend(c(sdAuto), 'http://127.0.0.1:7860/', '/sdapi/v1/scripts', null, 'u:p');
  const authOk = calls.length === 1 && calls[0].url === 'http://127.0.0.1:7860/sdapi/v1/scripts' && calls[0].o.headers.Authorization === 'Basic dTpw' && !('X-CSRF-Token' in calls[0].o.headers) && !calls[0].o.method;
  straight = false;
  // Stops with why, saving nothing.
  have = []; proxyOn = false;
  const dead = await run(sdAuto), deadUps = ups().length;
  proxyOn = true; scripts = { img2img: ['xyz plot'] };
  const noAd = await run(sdAuto), noAdUps = ups().length;
  const novel = await run({ ...sdAuto, source: 'novel' }), novelCalls = calls.filter(x => !x.url.startsWith('/api/sprites/get')).length;
  const sdComfy = { ...sdAuto, source: 'comfy', comfy_workflow: 'face.json', character_prompts: { mary: '1girl | red hair' }, character_negative_prompts: { mary: 'freckles' } };
  const other = await run(sdComfy, 'John'), group = await run(sdComfy, 'Mary', undefined, { groupId: 'g1' });
  workflow = '{"3":{"inputs":{"text":"%prompt%"}}}';
  const noAvatar = await run(sdComfy), noAvatarUps = ups().length;
  workflow = '{"3":{"inputs":{"text":"%prompt%","image":"%char_avatar%"}}}';
  const comfy = await run(sdComfy), comfyForms = await Promise.all(ups().map(async x => [...new Uint8Array(await x.o.body.get('avatar').arrayBuffer())].join(',')));
  // One the engine made, with no card (section 113): a portrait drawn from the record, then the faces from it.
  const lodger = { sex: 'female', age: 64, bmiZ: 2, occupation: 'Laundress' }, ptags = W.portraitTags(lodger, 1881), folder = 'rules-people/the_lodger_x';
  have = []; scripts = { img2img: ['ADetailer'] }; calls = [];
  const drew = await Fc.drawPortrait(c(sdAuto), 'the lodger', folder, ptags.join(', '), Fc.seedOf('the lodger'));
  const t2i = calls.filter(x => x.url.endsWith('/sdapi/v1/txt2img') && x.url.startsWith('/proxy/')).map(x => JSON.parse(x.o.body)), pUp = ups().map(x => [x.o.body.get('name'), x.o.body.get('label')].join(' '));
  const lodgerFaces = await run(sdAuto, 'the lodger', undefined, undefined, { url: `/characters/${folder}/portrait.png`, folder });
  const li2i = calls.filter(x => x.url === '/proxy/http://127.0.0.1:7860/sdapi/v1/img2img').map(x => JSON.parse(x.o.body)), lUps = ups().map(x => x.o.body.get('name'));
  have = [];
  const comfyNoCard = await run({ ...sdComfy }, 'Mary', undefined, undefined, { url: `/characters/${folder}/portrait.png`, folder });
  const comfyPortrait = await Fc.drawPortrait(c(sdComfy), 'the lodger', folder, ptags.join(', '), 1);
  const portraitOk = ptags.join(', ') === '1girl, old woman, plump, victorian, laundress, portrait, upper body, looking at viewer, simple background'
    && W.portraitTags({ sex: 'male', age: 40, bmiZ: -1.6 }, 1910).join(', ') === '1boy, mature male, skinny, portrait, upper body, looking at viewer, simple background'
    && W.portraitTags({ age: 8 }, null).join(', ') === 'solo, child, portrait, upper body, looking at viewer, simple background'
    && W.portraitTags({ sex: 'female', age: 25, bmiZ: 1 }, 1850).join(', ') === '1girl, victorian, portrait, upper body, looking at viewer, simple background'
    && drew === null && t2i.length === 1 && t2i[0].prompt === `masterpiece, best quality, ${ptags.join(', ')}` && t2i[0].negative_prompt === 'lowres' && t2i[0].seed === Fc.seedOf('the lodger')
    && t2i[0].width === 832 && t2i[0].height === 1216 && pUp.length === 1 && pUp[0] === `${folder} portrait`
    && lodgerFaces === `Made 6 of the lodger's 6 faces; the others were there.` && li2i.length === 6 && li2i.every(b => b.init_images[0] === b64(drawn) && b.prompt.startsWith('masterpiece, best quality, ') && !b.prompt.includes('red hair') && b.negative_prompt === 'lowres')
    && lUps.length === 6 && lUps.every(n => n === folder) && /takes a card's picture only; Mary has no card/.test(comfyNoCard) && /needs AI Horde, Forge or AUTOMATIC1111 \(your image source: comfy\)/.test(comfyPortrait);
  // AI Horde (section 115): the face marked once is redrawn by inpainting through the anonymous queue, two at a time; a picture
  // blanked as NSFW, or no worker able, stops with why.
  let hordeBodies = [], hordeState = 'ok', live = 0, most = 0;
  const painter = { sourceAndMask: async (pic, w, h, box) => ({ image: `IMG${w}x${h}`, mask: `MASK${box.x},${box.y},${box.w},${box.h}` }), png: async (b) => new Blob([await b.arrayBuffer()], { type: 'image/png' }) };
  const hordeFetch = globalThis.fetch;
  globalThis.fetch = async (u, o = {}) => {
    const url = String(u);
    if (url === 'https://aihorde.net/api/v2/generate/async') { hordeBodies.push({ body: JSON.parse(o.body), headers: o.headers }); live++; most = Math.max(most, live); return { ok: true, json: async () => ({ id: `job${hordeBodies.length}` }) }; }
    if (url.startsWith('https://aihorde.net/api/v2/generate/check/')) { await new Promise(r => setTimeout(r, 5)); return { ok: true, json: async () => hordeState === 'impossible' ? { done: false, is_possible: false } : { done: true, is_possible: true, queue_position: 0, wait_time: 0 } }; }
    if (url.startsWith('https://aihorde.net/api/v2/generate/status/')) { live--; return { ok: true, json: async () => ({ generations: [{ img: b64(drawn), censored: hordeState === 'censored' }] }) }; }
    return hordeFetch(u, o);
  };
  const sdHorde = { ...sdAuto, source: 'horde', sampler: 'k_dpmpp_2m', horde_karras: true, horde_nsfw: false };
  const box = { x: 0.3, y: 0.1, w: 0.4, h: 0.3 }, hc = (more) => ({ ...c(sdHorde, more), paint: painter, hordeEveryMs: 0 });
  have = [];
  const hordeSaid = await Fc.makeFaces(hc(), 'Mary', { ...mary, box }, looks, () => {});
  const hb = hordeBodies[0]?.body ?? {}, hUps = ups().length, mostFaces = most, anonKey = hordeBodies[0]?.headers?.apikey;
  const noBox = await Fc.lookPicture(hc(), 'Mary', mary, 'smile', 1);
  have = []; hordeState = 'censored';
  const blanked = await Fc.makeFaces(hc(), 'Mary', { ...mary, box }, looks, () => {});
  have = []; hordeState = 'impossible';
  const impossible = await Fc.lookPicture(hc(), 'Mary', { ...mary, box }, 'smile', 1, () => {});
  hordeState = 'ok'; hordeBodies = [];
  const hordePortrait = await Fc.drawPortrait(hc(), 'the lodger', folder, ptags.join(', '), 7);
  const hp = hordeBodies[0]?.body ?? {};
  hordeBodies = []; await Fc.drawPortrait({ ...hc(), hordeKey: 'k123' }, 'the lodger', folder, ptags.join(', '), 7);
  const keyed = hordeBodies[0]?.headers?.apikey;
  const hordeChecks = hordeSaid === `Made 6 of Mary's 6 faces; the others were there.` && mostFaces === 2 && hUps === 6
    && hb.source_processing === 'inpainting' && hb.source_image === 'IMG832x1216' && hb.source_mask === 'MASK0.3,0.1,0.4,0.3' && hb.r2 === false && hb.nsfw === false
    && JSON.stringify(hb.models) === '["Animagine XL"]' && hb.params?.denoising_strength === 0.5 && hb.params?.seed === String(Fc.seedOf('Mary')) && hb.params?.sampler_name === 'k_dpmpp_2m'
    && hb.params?.width === 832 && hb.params?.height === 1216 && hb.params?.karras === true
    && hb.prompt?.startsWith('masterpiece, best quality, Mary, 1girl, red hair, ') && hb.prompt?.endsWith(' ### lowres, freckles')
    && /has not been marked/.test(noBox) && /blanked the picture as NSFW, so nothing was saved/.test(blanked) && /none runs that model with inpainting/.test(impossible)
    && hordePortrait === null && !hp.source_image && hp.prompt === `masterpiece, best quality, ${ptags.join(', ')} ### lowres` && hp.params?.width === 832
    && anonKey === '0000000000' && keyed === 'k123' && JSON.stringify(Fc.hordeSize(512, 768)) === '[512,768]' && JSON.stringify(Fc.hordeSize(1024, 1536)) === '[832,1216]' && JSON.stringify(Fc.hordeSize(400, 600)) === '[384,576]';
  globalThis.fetch = realFetch; globalThis.createImageBitmap = realBitmap;
  const stopsOk = again === `Mary has all 6 faces.` && againCalls === 1 && authOk
    && /did not answer.*enableCorsProxy: true/.test(dead) && deadUps === 0 && /no ADetailer/.test(noAd) && noAdUps === 0
    && /\(novel\) cannot keep the card picture/.test(novel) && novelCalls === 0 && /only in a chat with them alone; open John's own chat/.test(other) && /only in a chat with them alone/.test(group)
    && /does not take the character's picture \(%char_avatar%\)/.test(noAvatar) && noAvatarUps === 0
    && comfy === `Made 6 of Mary's 6 faces; the others were there.` && comfyForms.length === 6 && comfyForms.every(b => b === [...drawn].join(','))
    && slash.startsWith(`/imagine quiet=true gallery=false extend=false seed=${Fc.seedOf('Mary')} negative="freckles" 1girl , red hair, `) && !slash.includes('|') && !slash.includes('masterpiece')
    && Fc.joinPrompts('best quality, absurdres, aesthetic,', '1girl') === 'best quality, absurdres, aesthetic, 1girl' && Fc.joinPrompts('score_9, {prompt}, detailed', 'smile', '{prompt}') === 'score_9, smile, detailed'
    && Fc.joinPrompts('', 'smile') === 'smile' && Fc.joinPrompts('best quality,', '') === 'best quality,';
  if (!(firstOk && stopsOk && portraitOk && hordeChecks)) { miss++; console.log(`MISS the faces made: ${JSON.stringify({ firstOk, portraitOk, hordeChecks, hordeSaid, most, hUps, hb: { ...hb, source_image: hb.source_image, prompt: hb.prompt }, noBox, blanked, impossible, hordePortrait, hp, ptags, drew, t2i: t2i[0], pUp, lodgerFaces, li2i: li2i.length, comfyNoCard, comfyPortrait, said, toasts, i2i: i2i.length, viaProxy: viaProxy.length, body0: bodies[0] && { ...bodies[0], init_images: undefined }, forms: forms.map(f => ({ ...f, headers: undefined })), again, againCalls, authOk, dead, deadUps, noAd, novel, novelCalls, other, group, noAvatar, comfy, slash })}`); }
}
// N111: hair and eyes from genes (colouring.ts; sections 114, 119): the IrisPlex model gives the Slovenes of Kastelic et al.
// 2013 the probabilities published for them; drawn over England's allele frequencies the eyes come back to the model's shares
// (69.9 % blue, 8.7 % intermediate, 21.4 % brown) and the hair, given the eyes, to Beddoe's recruits; a child's alleles one from
// each parent; the same person drawn the same, another chat another; one from Africa gets eyes from Africa's alleles and no
// hair (none counted there); none without a seed; the dress named by trade and year; the portrait takes the tags.
{
  const C = await import('../src/rules/colouring.js'), W = await import('../src/rules/face-words.js'), B = await import('../src/rules/body-engine.js');
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  // Slovenes 1, 5, 23 and 104 of Supplementary Table 3, as allele counts.
  const rows = [[[0, 0, 1, 0, 1, 0], [0.945, 0.045, 0.011]], [[0, 0, 1, 2, 0, 0], [0.008, 0.071, 0.921]], [[0, 0, 0, 1, 0, 2], [0.393, 0.152, 0.455]], [[0, 0, 0, 2, 1, 1], [0.002, 0.034, 0.964]]];
  const slovenes = rows.every(([g, p]) => C.eyeOdds(g).every((x, i) => near(x, p[i], 0.001)));
  const n = 20000, rng = B.seededRng('genes test'), count = {}, add = (k) => { count[k] = (count[k] ?? 0) + 1; };
  for (let i = 0; i < n; i++) { const c = C.drawColouring(rng, 'GBR'); const eye = /blue|^grey/.test(c.eyes) ? 'B' : /brown eyes$/.test(c.eyes) && !/hazel/.test(c.eyes) ? 'D' : 'I'; add(eye); add(c.eyes); add(`${eye} ${c.hair}`); }
  const share = (k) => (count[k] ?? 0) / n;
  const redGivenBlue = share('B red hair') / share('B'), blackGivenBrown = share('D black hair') / share('D');
  const kids = Array.from({ length: 4000 }, () => C.childGenotype([1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1], rng)), mean = kids.flat().reduce((a, b) => a + b, 0) / kids.flat().length;
  const one = C.colouringOf('the lodger', 'chat A', undefined, true), again = C.colouringOf('the lodger', 'chat A', 'Europe/North America', true);
  const others = new Set(['chat B', 'chat C', 'chat D', 'chat E', 'chat F'].map(id => JSON.stringify(C.colouringOf('the lodger', id, undefined, true))));
  const african = C.colouringOf('Kofi', 'chat A', 'Africa', true, 30);
  // An intermediate eye a third each dark grey, green and light hazel; a blue one half blue, half grey.
  const thirds = ['dark grey eyes', 'green eyes', 'light hazel eyes'].every(e => near(share(e) / share('I'), 1 / 3, 0.05)) && near(share('blue eyes') / share('B'), 0.5, 0.02);
  const ok = slovenes && thirds && near(share('B'), 0.699, 0.012) && near(share('I'), 0.087, 0.008) && near(share('D'), 0.214, 0.012)
    && near(redGivenBlue, 237 / 5519, 0.006) && near(blackGivenBrown, 251 / 3541, 0.012)
    && JSON.stringify(C.childGenotype([2, 2, 2, 2, 2, 2], [0, 0, 0, 0, 0, 0], rng)) === '[1,1,1,1,1,1]' && near(mean, 1, 0.03)
    && one !== null && JSON.stringify(one) === JSON.stringify(again) && others.size > 1 && one.genotype.length === 6
    && african !== null && african.hair === undefined && african.eyes === 'brown eyes' && C.colouringOf('the lodger', 'chat A', undefined, false) === null
    && C.dressOf('Laundress', 1881) === 'the working dress of a laundress of 1881' && C.dressOf(undefined, null) === 'everyday dress'
    && W.portraitTags({ sex: 'female', age: 30, occupation: 'Laundress' }, 1881, { eyes: 'grey eyes', hair: 'fair hair', hairTag: 'blonde hair', eyeTag: 'grey eyes' }).join(', ') === '1girl, victorian, blonde hair, grey eyes, laundress, portrait, upper body, looking at viewer, simple background'
    && W.portraitTags({ sex: 'male', age: 30 }, 1881, { eyes: 'brown eyes', eyeTag: 'brown eyes' }).join(', ') === '1boy, victorian, brown eyes, portrait, upper body, looking at viewer, simple background';
  if (!ok) { miss++; console.log(`MISS hair and eyes drawn: ${JSON.stringify({ slovenes, odds: rows.map(([g]) => C.eyeOdds(g)), B: share('B'), I: share('I'), D: share('D'), redGivenBlue, blackGivenBrown, mean, one, african })}`); }
}
// N112: faces drawn in the background (faces.ts FaceQueue; section 116): asked for as the box needs them, each once a session,
// the first asked first, two at a time; one waiting for its face box held until the box is marked; a failure told once and
// not tried again in the session.
{
  const Fc = await import('../src/faces.js');
  const A = { 4: 1, 7: 1 }, calm = { 12: 0.5, 25: 0.5 }, B = { 1: 1, 2: 1 };
  let live = 0, most = 0; const drawn = [], told = [], boxless = new Set(['John']);
  const q = new Fc.FaceQueue({ atOnce: () => 2, failed: (job, why) => told.push(`${job.who}: ${why}`), draw: async (job) => {
    live++; most = Math.max(most, live); await new Promise(r => setTimeout(r, 5)); live--;
    if (boxless.has(job.who)) return 'box';
    if (job.who === 'Ann') return 'no backend';
    drawn.push(`${job.who} ${JSON.stringify(job.face)}`); return 'done';
  } });
  q.want('Mary', [A, calm]); q.want('Mary', [A, calm, B]); q.want('John', [A]); q.want('Ann', [calm]);
  await q.idle();
  const before = [...drawn], waiting = q.waiting();
  boxless.delete('John'); q.marked('John'); await q.idle();
  q.want('Ann', [calm]); await q.idle();
  const ok = JSON.stringify(before) === JSON.stringify(['Mary {"4":1,"7":1}', 'Mary {"12":0.5,"25":0.5}', 'Mary {"1":1,"2":1}']) && most === 2
    && JSON.stringify(waiting) === '["John"]' && drawn.length === 4 && drawn[3] === 'John {"4":1,"7":1}' && q.waiting().length === 0
    && told.length === 1 && told[0] === 'Ann: no backend';
  if (!ok) { miss++; console.log(`MISS faces in the background: ${JSON.stringify({ before, drawn, waiting, most, told })}`); }
}
// N113: the Middle East and greying (colouring.ts; sections 118, 119): over the Middle East's alleles the eyes come back to the
// model's shares (6.7 % blue, 4.8 % intermediate, 88.5 % brown) and the hair, given brown eyes, to the Levant's dark-eyed;
// the hair half grey at the age drawn from a normal whose share by 50 is 23 % (6 % for Africa and the Asias), so about 23 % grey
// at 50, few at 30, most at 70; the same person the same at any age but for the grey, "grey hair, once …" for the narrator and
// "grey hair" for the picture.
{
  const C = await import('../src/rules/colouring.js'), B = await import('../src/rules/body-engine.js');
  const n = 20000, rng = B.seededRng('levant test'), count = {}, add = (k) => { count[k] = (count[k] ?? 0) + 1; };
  for (let i = 0; i < n; i++) { const c = C.drawColouring(rng, 'MID'); const eye = /blue|^grey/.test(c.eyes) ? 'B' : c.eyes === 'brown eyes' ? 'D' : 'I'; add(eye); add(`${eye} ${c.hair}`); }
  const share = (k) => (count[k] ?? 0) / n, near = (a, b, tol) => Math.abs(a - b) <= tol;
  const greyAt = (age, people = 'GBR') => { const r = B.seededRng(`grey ${age} ${people}`); let g = 0; for (let i = 0; i < n; i++) if (C.drawColouring(r, people, age).grey) g++; return g / n; };
  const g30 = greyAt(30), g50 = greyAt(50), g70 = greyAt(70), afr50 = greyAt(50, 'AFR');
  // The first of P0, P1, … not yet grey at 30, then the same person at 95.
  const who = Array.from({ length: 50 }, (_, i) => `P${i}`).find(w => !C.colouringOf(w, 'chat A', 'Middle East', true, 30)?.grey);
  const young = C.colouringOf(who, 'chat A', 'Middle East', true, 30), old = C.colouringOf(who, 'chat A', 'Middle East', true, 95);
  const ok = near(share('B'), 0.067, 0.008) && near(share('I'), 0.048, 0.007) && near(share('D'), 0.885, 0.01) && near(share('D black hair') / share('D'), 241 / 419, 0.015)
    && near(C.probit(0.23), -0.7388, 0.0005) && near(C.probit(0.975), 1.95996, 0.0001)
    && near(g50, 0.23, 0.012) && g30 < 0.02 && near(g70, 0.82, 0.015) && near(afr50, 0.06, 0.008)
    && young !== null && !young.grey && old?.grey === true && old.hairTag === 'grey hair' && old.hair === `grey hair, once ${young.hair.replace(/ hair$/, '')}` && old.eyes === young.eyes
    && C.peopleOf(undefined) === 'GBR' && C.peopleOf('Middle East') === 'MID' && C.peopleOf('South Asia') === 'SAS' && C.peopleOf('Atlantis') === null
    && C.hairCountsFor('GBR') === C.BEDDOE_EW && C.hairCountsFor('MID') === C.BEDDOE_LEVANT && C.hairCountsFor('SAS') === null;
  if (!ok) { miss++; console.log(`MISS other places and greying: ${JSON.stringify({ count, g30, g50, g70, afr50, young, old })}`); }
}
// N114: the count's year for the stage, the society block and the town (world-count.ts figuresIn; section 118): in the seed's
// year the seed's own share and kills; a kind of the returned grows, and what is found with it; the records' last year takes
// the year before; outside the count, the seed's own. The institutions as the year had them: before 1856 the county police
// only allowed; before 1855 the papers still taxed, before 1861 the paper duty still on; before 1872 Medical Officers of Health
// only where a town had one.
{
  const So = await import('../src/rules/society.js'), Sd = await import('../src/rules/seed.js'), Wc = await import('../src/rules/world-count.js');
  const plan = Sd.drawStart('EW1881-BH.RA-N4-D1-K5-7f2c'), rows = Wc.yearByYear(plan.year, 1921, plan.share, plan.deaths, Sd.kindGrowth(plan));
  const f81 = Wc.figuresIn(rows, 1881, plan), f00 = Wc.figuresIn(rows, 1900, plan), f21 = Wc.figuresIn(rows, 1921, plan), f20 = Wc.figuresIn(rows, 1920, plan), out = Wc.figuresIn(null, 1950, plan);
  const rel = (a, b) => Math.abs(a / b - 1);
  const stage = (code, y) => So.societyOf(Sd.drawStart(code), y).lines[2];
  const u50 = stage('EW1881-BH.RA-N4-D0-K5-7f2c', 1850), u60 = stage('EW1881-BH.RA-N4-D0-K5-7f2c', 1860);
  const r50 = stage('EW1881-BH.RA-N4-D1-K5-7f2c', 1850), r58 = stage('EW1881-BH.RA-N4-D1-K5-7f2c', 1858), r81 = stage('EW1881-BH.RA-N4-D1-K5-7f2c', 1881);
  const e60 = stage('EW1881-BH.RA-N3-D3-K5-7f2c', 1860), e81 = stage('EW1881-BH.RA-N3-D3-K5-7f2c', 1881);
  const ok = rel(f81.share, plan.share) < 0.02 && rel(f81.deaths, plan.deaths) < 0.02 && f00.share > f81.share * 5 && f00.deaths > f81.deaths
    && f21.share === f20.share && f21.deaths === f20.deaths && out.share === plan.share && out.deaths === plan.deaths
    && /allowed since 1839, required only from 1856/.test(u50) && /compulsory since 1856/.test(u60)
    && /still dear under the stamp duty/.test(r50) && /cheap since the stamp duty went in 1855\)/.test(r58) && /stamp and paper duties went, 1855 and 1861/.test(r81) && /Whitechapel in 1888/.test(r50)
    && /where a town has one/.test(e60) && /in every district since the Public Health Acts/.test(e81);
  if (!ok) { miss++; console.log(`MISS the count's year in society: ${JSON.stringify({ plan: { share: plan.share, deaths: plan.deaths }, f81, f00, f20, f21, u50, r50, r58, e60 })}`); }
}
// N115: families (section 120; rules-tools.ts recordKin, colouring.ts genotypeOf): NewCharacter keeps the mother, father and
// brothers and sisters the story fixes, on a person met before too; a child carries only what its parents could give, one copy
// from each; brown-eyed parents of two brown copies each have children of two; the first of a family keeps the genes it was
// drawn with, and brothers and sisters inherit from the same unseen two, so they are alike as siblings are (their copies at
// HERC2 correlated about one half) and strangers are not; a parent of a parent is followed; a loop of names stops.
{
  const C = await import('../src/rules/colouring.js');
  fresh();
  await run('NewCharacter', { who: 'Ann', sex: 'female', age: 30 }); await run('NewCharacter', { who: 'Will', sex: 'male', age: 12, sibling_of: 'Ann' });
  await run('NewCharacter', { who: 'Tom', sex: 'male', age: 5, mother: 'Ann', father: 'Ned' }); await run('NewCharacter', { who: 'Ann', sibling_of: 'Will' });
  const ppl = ctx.chatMetadata.rulesEngine.state.people;
  const kinOk = ppl.Will?.kin?.family === 'Ann' && ppl.Ann?.kin?.family === 'Ann' && ppl.Tom?.kin?.mother === 'Ann' && ppl.Tom?.kin?.father === 'Ned';
  const fits = (c, m, f) => c.every((x, i) => x >= (m[i] === 2 ? 1 : 0) + (f[i] === 2 ? 1 : 0) && x <= (m[i] > 0 ? 1 : 0) + (f[i] > 0 ? 1 : 0));
  const people = { Mum: {}, Dad: {} }, kids = [];
  for (let i = 0; i < 200; i++) { people[`K${i}`] = { kin: { mother: 'Mum', father: 'Dad' } }; kids.push(C.genotypeOf(`K${i}`, 'chat A', people)); }
  const mum = C.genotypeOf('Mum', 'chat A', people), dad = C.genotypeOf('Dad', 'chat A', people);
  const mendel = kids.every(k => fits(k, mum, dad));
  const brownKids = Array.from({ length: 50 }, (_, i) => C.childGenotype([0, 0, 0, 2, 0, 0], [0, 0, 0, 2, 0, 0], () => (i * 0.37) % 1)).every(k => k[3] === 2);
  // Families: P{i} first, S{i} their sibling; HERC2 (index 3) correlated across siblings, not across strangers.
  const fam = {}; for (let i = 0; i < 600; i++) { fam[`P${i}`] = { kin: { family: `P${i}` } }; fam[`S${i}`] = { kin: { family: `P${i}` } }; fam[`X${i}`] = {}; }
  const corr = (xs, ys) => { const mx = xs.reduce((a, b) => a + b, 0) / xs.length, my = ys.reduce((a, b) => a + b, 0) / ys.length; let sxy = 0, sxx = 0, syy = 0; xs.forEach((x, i) => { sxy += (x - mx) * (ys[i] - my); sxx += (x - mx) ** 2; syy += (ys[i] - my) ** 2; }); return sxy / Math.sqrt(sxx * syy); };
  const first = [], sib = [], stranger = [];
  for (let i = 0; i < 600; i++) { first.push(C.genotypeOf(`P${i}`, 'chat A', fam)[3]); sib.push(C.genotypeOf(`S${i}`, 'chat A', fam)[3]); stranger.push(C.genotypeOf(`X${i}`, 'chat A', fam)[3]); }
  const rSib = corr(first, sib), rStranger = corr(first, stranger);
  const firstStays = Array.from({ length: 20 }, (_, i) => JSON.stringify(C.genotypeOf(`P${i}`, 'chat A', fam)) === JSON.stringify(C.genotypeOf(`P${i}`, 'chat A', { [`P${i}`]: {} }))).every(Boolean);
  const tree = { Gran: {}, Mum: { kin: { mother: 'Gran' } }, Kid: { kin: { mother: 'Mum' } } }, loop = { A: { kin: { mother: 'B' } }, B: { kin: { mother: 'A' } } };
  const kid = C.genotypeOf('Kid', 'chat A', tree), mumT = C.genotypeOf('Mum', 'chat A', tree), loopOk = C.genotypeOf('A', 'chat A', loop).length === 6;
  const ok = kinOk && mendel && brownKids && rSib > 0.35 && Math.abs(rStranger) < 0.1 && firstStays && kid.every((x, i) => x <= (mumT[i] > 0 ? 1 : 0) + 1) && loopOk;
  if (!ok) { miss++; console.log(`MISS families: ${JSON.stringify({ kinOk, kin: { Ann: ppl.Ann?.kin, Will: ppl.Will?.kin, Tom: ppl.Tom?.kin }, mendel, brownKids, rSib, rStranger, firstStays, loopOk })}`); }
}
console.log(`245 checks, ${miss} miss(es)`);
process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
