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
console.log(`203 checks, ${miss} miss(es)`);
process.exitCode = miss ? 1 : 0; // exitCode lets output queued for a pipe finish (process.exit() can cut it)
