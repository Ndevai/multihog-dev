// The voice from the body (src/rules/voice-body.ts): the tract's length and formants, the folds' length and pitch, the
// syllables a second, each from published measurements; and the person's voice in the narrator's body notes.
const V = await import('../src/rules/voice-body.js');
const Vs = await import('../src/rules/voice-sound.js');
const A = await import('../src/rules/artsynth.js');
const Be = await import('../src/rules/body-engine.js');
const D = await import('../src/rules/data/info-rate.js');
const Bs = await import('../src/rules/body-sheet.js');
let miss = 0, n = 0;
const ok = (c, m, got = '') => { n++; if (!c) { miss++; console.log(`MISS ${m}${got ? `: ${got}` : ''}`); } };
const near = (a, b, d) => Math.abs(a - b) <= d;

// V1: the tube: c at 37 °C 353.0 m/s; a 17.5 cm tract in the neutral vowel resonates at 504, 1513, 2522 Hz (the schwa's 500,
// 1500, 2500); halving the length doubles every formant.
{
  const f = V.formantsOf(17.5), half = V.formantsOf(8.75);
  ok(near(V.SOUND_IN_TRACT, 353.0, 0.05) && JSON.stringify(f) === '[504,1513,2522]' && half.every((x, i) => near(x, 2 * f[i], 1)), 'the tract resonates as a quarter-wave tube', JSON.stringify([V.SOUND_IN_TRACT, f, half]));
}
// V2: the calibration: the mean US man (177.24 cm) and woman (163.76 cm), their draws at 0, get Hillenbrand et al.'s mean
// tract (17.79 and 15.80 cm, as formant spacing measures it) from the synthesizer's tube chain, and the folds the cadaver
// equations give (16.10 and 11.20 mm); a uniform tube in the lossless chain resonates as a quarter-wave tube.
{
  const m = V.voiceOf({ heightCm: 177.24, sex: 'male', age: 30 }), w = V.voiceOf({ heightCm: 163.76, sex: 'female', age: 30 });
  const uni = Vs.resonancesOfTubes(Array.from({ length: 27 }, () => ({ A: 3e-4, l: 0.175 / 27 })));
  ok(near(m.tractCm, 17.8, 0.05) && near(w.tractCm, 15.8, 0.05) && near(Vs.spacingCmOf(m.formantsHz), 17.79, 0.03) && near(Vs.spacingCmOf(w.formantsHz), 15.80, 0.03)
      && near(m.foldMm, 16.1, 0.05) && near(w.foldMm, 11.2, 0.05) && near(V.foldMmOf(175, true), 15.7, 1e-9) && near(V.foldMmOf(162, false), 10.78, 1e-9)
      && uni.every((f, i) => near(f, V.formantsOf(17.5)[i], 1)), "the measured speakers' mean body", JSON.stringify([m, w, uni]));
}
// V2b: the port against the time-domain run: Praat's female speaker, Praat's tutorial vowel (lungs 0.2): her folds open
// at 226 Hz, steadily (Praat itself, built from the same source, gives 226.6 Hz); the tube chain's transfer, lips over
// glottis, lies within 6 % of the run's at the median harmonic below 2.5 kHz, and the chain's formants are 562 / 1486 / 2885.
{
  const sp = A.speakerOf('female'), T = 0.5, word = { totalTime: T, targets: { Interarytenoid: [[0, 0.5], [T, 0.5]], LevatorPalatini: [[0, 1], [T, 1]], Lungs: [[0, 0.2], [0.1, 0]] } };
  const r = A.synthesize(word, sp, { rng: Be.seededRng('V2b'), watch: [36, 37], watchU: [38, 64] }), fs = 22050;
  const st = Vs.steadinessOf(Vs.glottalCycles(r.widths[0], r.widths[1], r.sound, fs, 0.2)), f0 = st.f0Hz;
  const N = Math.round(Math.floor((r.sound.length - 0.2 * fs) / (fs / f0)) * fs / f0), at = Math.round(0.2 * fs);
  const dft = (x, f) => { let re = 0, im = 0; for (let i = 0; i < N; i++) { const a = 2 * Math.PI * f * i / fs; re += x[at + i] * Math.cos(a); im -= x[at + i] * Math.sin(a); } return Math.hypot(re, im); };
  const tubes = Vs.restingTract(sp), ratio = f => dft(r.flows[1], f) / dft(r.flows[0], f) / Vs.transferAt(tubes, f), errs = [];
  for (let k = 2; k * f0 < 2500; k++) errs.push(Math.abs(ratio(k * f0) / ratio(f0) - 1));
  errs.sort((a, b) => a - b);
  ok(near(f0, 226, 2) && st.steady && errs[errs.length >> 1] < 0.06 && JSON.stringify(Vs.formantsOfTubes(tubes)) === '[562,1486,2885]', 'the port and its tube chain', JSON.stringify([f0, st, errs[errs.length >> 1], Vs.formantsOfTubes(tubes)]));
}
// V3: the rate: 39.15 bits/s over the language's bits per syllable (17 measured; others take their mean), by sex, by age, by
// the person's own draw (8.8 % per SD), and talk at 4.12 ÷ 5.08 of reading. The 17 languages' measured rates lie within
// 16 % of the rate so predicted.
{
  const eng = V.voiceOf({ language: 'English' }), jpn = V.voiceOf({ language: 'japanese' }), other = V.voiceOf({ language: 'klingon' });
  const talk = 4.12 / 5.08, mean = Object.values(D.INFO_RATE).reduce((s, r) => s + r.bits, 0) / 17;
  const errs = Object.values(D.INFO_RATE).map(r => Math.abs(39.15 / r.bits / r.sylPerS - 1));
  const fast = V.voiceOf({ language: 'english', sex: 'male', age: 30.6, rateZ: 1 }).sylPerS, old = V.voiceOf({ language: 'english', sex: 'female', age: 70.6 }).sylPerS;
  ok(near(eng.sylPerS, 39.15 / 7.09 * talk, 0.006) && near(jpn.sylPerS, 39.15 / 5.03 * talk, 0.006) && near(other.bits, mean, 0.006) && !other.bitsMeasured && eng.bitsMeasured
      && near(fast, 39.15 / 7.09 * 1.0268 * 1.0882 * talk, 0.006) && near(old, 39.15 / 7.09 * 0.9732 * (1 - 0.000794 * 40) * talk, 0.006) && Object.keys(D.INFO_RATE).length === 17 && Math.max(...errs) < 0.16,
      'syllables a second from the information rate', JSON.stringify([eng.sylPerS, jpn.sylPerS, other, fast, old, Math.max(...errs).toFixed(3)]));
}
// V4: what is not computed: no anatomy without height or sex, or under 5 (the youngest voices checked); the narrator's body
// notes carry the voice once BodySize has placed the person, its pitch once the person's run has finished, and none for
// someone without a height. Tom, 180 cm, his draws at 0: tract 17.9 cm, formants 483 / 1272 / 2458 Hz, 136 Hz.
{
  const child = V.voiceOf({ heightCm: 100, sex: 'female', age: 4 }), none = V.voiceOf({ sex: 'male' });
  const people = { Tom: { species: 'human', mass: 75, lost: 0, red: 0, wounds: [], nextId: 1, heightCm: 180, sex: 'male', age: 35, languages: ['english'], rateZ: 0 }, Ann: { species: 'human', mass: 60, lost: 0, red: 0, wounds: [], nextId: 1 } };
  const before = Bs.bodyBlock(people);
  await V.voicesReady(people);
  const block = Bs.bodyBlock(people);
  ok(child.tractCm === undefined && none.f0Hz === undefined && child.sylPerS > 0 && /Tom's voice: tract 17\.9 cm, formants 483 \/ 1272 \/ 2458 Hz, 4\.\d+ syllables\/s in talk/.test(before)
      && /Tom's voice: tract 17\.9 cm, formants 483 \/ 1272 \/ 2458 Hz, pitch about 136 Hz, 4\.\d+ syllables\/s in talk/.test(block) && !/Ann's voice/.test(block),
      "the voice in the narrator's notes", [before, block].map(b => b.split('\n').filter(l => /voice/.test(l)).join(' | ')).join(' || '));
}
// V5: the wiring: said words in the box appear at the speaker's own rate (src/index.js typeUnit); the person's rate, stretch
// and tract numbers are each drawn once from a stream of their own, so no other draw of the engine moves (src/rules/
// rules-tools.js BodySize); the narrator's notes wait for the voices' runs (src/index.js, the interceptor).
{
  const fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const idx = fs.readFileSync(`${root}/src/index.js`, 'utf8'), tools = fs.readFileSync(`${root}/src/rules/rules-tools.js`, 'utf8');
  const drawn = ['rate', 'stretch', 'tract'].every(k => new RegExp(String.raw`p\.${k}Z \?\?= gauss\(seededRng\(\`\$\{store\(\)\.salt\}:${k}:\$\{a\.who\}\`\)\)`).test(tools))
      && /timingZ = known\?\.timingZ \?\? gauss\(seededRng\(`\$\{store\(\)\.salt\}:timing:\$\{a\.who\}`\)\)/.test(tools);
  ok(/revealTimes\(text, said, own \? own\.sylPerS \/ peek\('voiceSyllablesPerS'\) : 1\)/.test(idx) && drawn && /await voicesReady\(trackedPeople\(\)\);\s*if \(moved\(\)\)\s*return;\s*if \(s\.questionPass/.test(idx),
      "the speaker's own rate in the box, the causes drawn apart, the notes after the runs", '');
}
// V6: steadiness: periods alternating 10.6 and 6.4 ms (a man's folds at low stretch, period doubling) give jitter 47 %, far
// over 1.04 %; equal periods and peaks give 0. A woman drawn just above her steady band (ln Q 0.70) speaks at the nearest
// steady stretch below it, steadily, near the band's top (about 240 Hz).
{
  const alt = Vs.steadinessOf({ periods: [0.0106, 0.0064, 0.0106, 0.0064, 0.0106], peaks: [1, 1, 1, 1, 1] }), even = Vs.steadinessOf({ periods: [0.005, 0.005, 0.005, 0.005], peaks: [2, 2, 2, 2] });
  const K = await import('../src/rules/constants.js'), z = (0.70 - Math.log(K.peek('voiceStretchFemale'))) / K.peek('voiceStretchSpreadFemale');
  const v = await Vs.restingVoiceOfCauses({ heightCm: 163.76, male: false, stretchZ: z });
  ok(near(alt.jitterPct, 47.1, 0.1) && !alt.steady && even.jitterPct === 0 && even.steady && near(even.f0Hz, 200, 1e-9)
      && v.steady && v.lnStretch < v.lnStretchDrawn - 0.01 && near(v.lnStretchDrawn, 0.70, 1e-9) && v.f0Hz > 225 && v.f0Hz < 255, 'a steady voice, steered to', JSON.stringify([alt, even, v]));
}
// V7: growing voices, all draws 0, adult height the US cohort's mean: a boy of 8 speaks near 259 Hz (Vuorenkoski et al. 1978:
// 259 Hz at 8, 247 at 10), a girl of 11 near 238 (Hillenbrand et al.'s 19 girls aged 10–12) and a boy of 11 has their boys'
// 14.77 cm tract within 1 %; a boy of 15, his voice change nearly done, below 160 Hz; under 5 no anatomy is computed.
{
  const G = await import('../src/rules/growth.js');
  const kid = (male, age) => ({ heightCm: Vs.HEIGHT[male ? 'male' : 'female'].mean * G.heightShare(male, age), male, age });
  const [b8, g11, b15] = await Promise.all([kid(true, 8), kid(false, 11), kid(true, 15)].map(c => Vs.restingVoiceOfCauses(c)));
  const tot = V.voiceOf({ heightCm: 100, sex: 'male', age: 4 });
  ok(near(b8.f0Hz, 259, 13) && near(g11.f0Hz, 238, 12) && b15.f0Hz < 160 && near(Vs.tractCmOf(kid(true, 11)), 14.77, 0.15) && b8.steady && g11.steady && b15.steady && tot.tractCm === undefined,
      'growing voices', JSON.stringify([b8.f0Hz, g11.f0Hz, b15.f0Hz, Vs.tractCmOf(kid(true, 11))]));
}
// V8: the voice blips (blips.ts; src/index.js playBlips): one tone a syllable over the time a word's letters appear, silence
// in a pause ("Sit, Anna.": 0, 367 and 567 ms, each 100 ms); the harmonics of Tom's 136 Hz weighted 1 ÷ k by his own tract,
// strongest at the 3rd and 4th (409 and 546 Hz), round his F1 of 483 Hz; the box sounds them only for said words, not for a
// whisper, with the setting Voices on blips, and stops them with the typing.
{
  const Bl = await import('../src/rules/blips.js'), X = await import('../src/rules/box.js'), fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const text = '"Sit, Anna."', plan = Bl.blipPlan(text, X.revealTimes(text, true, 1)).map(b => [Math.round(b.at), Math.round(b.dur)]);
  const f = { heightCm: 180, sex: 'male', age: 35 }; await V.voicesReady({ Tom: { ...f, species: 'human' } });
  const h = V.voiceHarmonics(f), top = h.amps.indexOf(1), idx = fs.readFileSync(`${root}/src/index.js`, 'utf8');
  ok(JSON.stringify(plan) === '[[0,100],[367,100],[567,100]]' && Math.abs(h.f0 - 136) < 1 && (top === 2 || top === 3) && h.amps[top + 3] < 0.3
      && /if \(settings\(\)\.boxVoice !== 'blips' \|\| unit\.getAttribute\('data-said'\) !== 'true' \|\| !p \|\| unit\.querySelector\('\.rules-v-whisper, \.rules-run-whisper'\)\)\s*return;/.test(idx)
      && /function stopTyping\(\) \{\s*stopBlips\(\);/.test(idx) && /playBlips\(unit, text, times\);/.test(idx),
      "a voice's blips", JSON.stringify([plan, h.f0, h.amps.slice(0, 8)]));
}
// V9: the robotic voice (speech.ts; src/index.js speakUnit; lib/espeak-ng): Tom's voice (136.4 Hz, 17.9 cm, 4.58 syllables/s)
// is eSpeak's pitch base 106 to 152 Hz, formants 98 %, 162 words a minute; a girl's (245 Hz, 14.4 cm) 190 to 274, 122 %;
// the voice file names its pitch and every formant, and a whisper takes eSpeak's own breath; letters follow the word events,
// each word's letters spread to the next word; the box speaks only said words of a tracked person, and loads the
// synthesizer (English only) from lib/espeak-ng.
{
  const Sp = await import('../src/rules/speech.js'), fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const tom = Sp.speechVoice(136.4, 17.9, 4.58), girl = Sp.speechVoice(245.2, 14.39, 4.43), file = Sp.speechVoiceFile('t', { ...tom, whisper: true });
  const t = Sp.speechTimes('"Sit, Anna."', [[2, 100], [7, 500]], 900), idx = fs.readFileSync(`${root}/src/index.js`, 'utf8');
  const data = fs.statSync(`${root}/lib/espeak-ng/espeak-ng.data`).size, js = fs.readFileSync(`${root}/lib/espeak-ng/espeak-ng.js`, 'utf8');
  ok(JSON.stringify([tom.base, tom.top, tom.formantPct, tom.wpm]) === '[106,152,98,162]' && JSON.stringify([girl.base, girl.top, girl.formantPct]) === '[190,274,122]'
      && /pitch 106 152\nformant 1 98 100 100\n[^]*formant 8 98 100 100\nvoicing 17\nbreath/.test(file)
      && JSON.stringify(t.map(Math.round)) === '[0,180,260,340,420,500,567,633,700,767,833,900]'
      && /if \(settings\(\)\.boxVoice !== 'robotic' \|\| unit\.getAttribute\('data-said'\) !== 'true' \|\| !p\)\s*return null;/.test(idx) && /new URL\(`\.\.\/lib\/espeak-ng\/\$\{p\}`, import\.meta\.url\)/.test(idx)
      && data === 877770 && /remote_package_size:877770/.test(js), 'the robotic voice', JSON.stringify([tom, girl, t.map(Math.round)]));
}
// V10: the natural voice (pocket.ts; averaged-person.ts; world-vocoder.ts; data/pocket-tokenizer.ts; src/index.js naturalJob;
// src/voice-worker.js): the tokenizer gives the original SentencePiece's ids (bytes for "…"); a stretch is prepared and split as
// the export does; quotation marks are not spoken; the typing's times end with the sound; the memory's length is freed only in
// the named inputs of a model file, 3 bytes for 3; the engine's mean man lands on free speech's male medians, his target 1.16
// higher in pitch (connected speech); an averaged-person file reads back; the envelope of a tract half as long puts a resonance
// at twice the frequency; WORLD's synthesis of a steady 200 Hz voice repeats every 120 samples; a body recording at half the
// pace is twice as long and its pitch is the body's; the box makes the voice for said words only, from the averaged person in
// the extension folder, keeps each body's encoding, and the worker stops a line at its end signal.
{
  const P = await import('../src/rules/pocket.js'), Sp = await import('../src/rules/speech.js'), Vs = await import('../src/rules/voice-sound.js');
  const A = await import('../src/rules/averaged-person.js'), Wv = await import('../src/rules/world-vocoder.js'), fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const idx = fs.readFileSync(`${root}/src/index.js`, 'utf8'), wk = fs.readFileSync(`${root}/src/voice-worker.js`, 'utf8');
  const tok = [P.pocketTokens('Sit. Will has been counting the same six coins since noon.'), P.pocketTokens("Don't—wait… it's 3:45, café?")];
  const long = 'The north wind and the sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other.';
  // A model file by hand (protobuf): the graph (field 7) with an input "state_0" [2, 1000] and an input "other" [1000], and an
  // initializer (field 5) whose bytes hold the same 03 08 E8 07.
  const len = b => { const o = []; let n = b.length; do { o.push((n & 127) | (n > 127 ? 128 : 0)); n >>= 7; } while (n); return o; };
  const ld = (f, b) => [(f << 3) | 2, ...len(b), ...b], txt = t => [...new TextEncoder().encode(t)], dim = v => ld(1, [8, ...(v > 127 ? [(v & 127) | 128, v >> 7] : [v])]);
  const vi = (name, dims) => ld(1, txt(name)).concat(ld(2, ld(1, [8, 1, ...ld(2, dims.flatMap(dim))])));
  const model = new Uint8Array(ld(7, [...ld(5, [0x03, 0x08, 0xe8, 0x07]), ...ld(11, vi('state_0', [2, 1000])), ...ld(11, vi('other', [1000]))])), before = model.slice();
  const freed = P.freeCacheLength(model, ['state_0']), diff = [...model].map((b, i) => b !== before[i] ? i : -1).filter(i => i >= 0);
  const c = P.onCopiesScale(Vs.MEASURED.male.f0Hz, Vs.MEASURED.male.tractCm), tgt = P.bodyTarget(Vs.MEASURED.male.f0Hz, Vs.MEASURED.male.tractCm, 4.4);
  // An averaged-person file by hand: 400 frames, all voiced at its own level, a flat envelope but one peak at stored bin 20
  // (WORLD bin 40, 937.5 Hz), no aperiodicity; its own pace 5 syllables/s and tract 17 cm.
  const F = 400, EB = 257, AB = 65, head = new TextEncoder().encode(JSON.stringify({ fs: 24000, framePeriodMs: 5, fftSize: 1024, frames: F, envBins: EB, apBins: AB, own: { f0: 150, tractCm: 17, sylPerS: 5 } }));
  const buf = new ArrayBuffer(8 + head.length + F + 4 * F + 2 * F * EB + F * AB), u8 = new Uint8Array(buf), dvw = new DataView(buf);
  u8.set([82, 86, 65, 80]); dvw.setUint32(4, head.length, true); u8.set(head, 8);
  let o = 8 + head.length; u8.fill(1, o, o + F); o += F; o += 4 * F;
  for (let f = 0; f < F; f++) for (let b = 0; b < EB; b++) dvw.setInt16(o + 2 * (f * EB + b), b === 20 ? 0 : -4000, true);
  o += 2 * F * EB; u8.fill(240, o, o + F * AB);
  const person = A.parseAveragedPerson(buf), peakAt = row => row.indexOf(Math.max(...row));
  const pk = [peakAt(A.envelopeRow(person, 10, 1)), peakAt(A.envelopeRow(person, 10, 0.5))];
  const rec = A.bodyRecording(person, { f0: 200, tractCm: 17, sylPerS: 2.5 });
  const lagOf = (y, from, to) => { let best = 0, bl = 0; for (let L = 60; L <= 180; L++) { let s = 0; for (let i = from; i < to; i++) s += y[i] * y[i + L]; if (s > best) { best = s; bl = L; } } return bl; };
  const steady = Wv.synthesize(new Float64Array(80).fill(200), Array.from({ length: 80 }, () => new Float64Array(513).fill(0.01)), Array.from({ length: 80 }, () => new Float64Array(513).fill(0.001)), 1024, 5, 24000, 9600);
  ok(JSON.stringify(tok) === '[[1912,274,263,2772,392,385,1026,273,265,548,925,571,356,261,1024,260,3385,263],[1201,264,274,3133,1088,562,230,132,170,275,264,261,260,450,3244,487,437,262,331,2250,745,292]]'
      && JSON.stringify(P.pocketPrepare('ok go')) === '{"text":"Ok go.","framesAfterEos":5}' && P.pocketChunks(long).length === 2 && P.pocketMaxFrames(18) === 100
      && P.spokenText('"Sit," she said') === 'Sit, she said' && JSON.stringify(Sp.scaleTimes([0, 100, 200], 1000)) === '[0,500,1000]'
      && freed === 1 && diff.length === 3 && model[diff[0] - 1] === 0x03 && model[diff[0]] === 0x12 && model[diff[0] + 2] === 0x63 && diff[0] > 8
      && Math.abs(c.f0 - 105.4) < 1e-9 && Math.abs(c.tract - 18.92) < 1e-9 && JSON.stringify(tgt) === '{"f0":122.3,"tractCm":18.92,"sylPerS":4.4}'
      && person.frames === 400 && person.own.tractCm === 17 && JSON.stringify(pk) === '[40,80]'
      && rec.length === 2 * 400 * 120 && lagOf(rec, 30000, 32000) === 120 && lagOf(steady, 3000, 5000) === 120
      && /if \(settings\(\)\.boxVoice !== 'natural' \|\| unit\.getAttribute\('data-said'\) !== 'true' \|\| !p \|\| unit\.querySelector\('\.rules-v-whisper, \.rules-run-whisper'\)\)\s*return null;/.test(idx)
      && /scaleTimes\(read, 1000 \* natural\.length \/ POCKET_MODEL\.sampleRate\)/.test(idx) && /if \(!spoken && !natural\)\s*playBlips/.test(idx)
      && /if \(nat && !voiceDone\.has\(nat\.key\)\)/.test(idx) && /indexedDB\.open\('rules-engine-voices', 1\)/.test(idx)
      && /bodyTarget\(v\.f0Hz, v\.tractCm, v\.sylPerS\)/.test(idx) && /voiceOf\(\{ \.\.\.facts, language: facts\.language \?\? 'english' \}\)/.test(idx)
      && /new URL\('\.\.\/voices\/averaged-person\.bin', import\.meta\.url\)/.test(idx) && /await storedModel\(key, r\.embedding\.buffer/.test(idx)
      && /freeCacheLength\(new Uint8Array\(files\['flow_lm_main_int8\.onnx'\]\)/.test(idx) && /if \(s\.boxVoice === 'speech'\)\s*s\.boxVoice = 'robotic';/.test(idx)
      && /bodyRecording\(person, m\.body[,)]/.test(wk) && /if \(r\.eos > -4 && eosAt < 0\)\s*eosAt = step;/.test(wk) && /normal\(LATENT, Math\.sqrt\(temperature\)\)/.test(wk) && /ort\.env\.wasm\.numThreads = 1;/.test(wk),
      'the natural voice', JSON.stringify([tok, freed, diff, c, tgt, pk, rec.length, lagOf(rec, 30000, 32000), lagOf(steady, 3000, 5000)]));
}
// V11: a child whose height the story has not set is heard at the height their age's growth gives (the adult mean × the share
// of adult height: a girl of 11 at 142.2 cm, of 12 at 149.4, of 14 at 160.8), so her voice changes year by year (tract 14.4,
// 14.9, 15.6 cm); an adult of unset height stays at the adult mean (163.8 cm).
{
  const hs = [11, 12, 14, 30].map(age => V.speakingFactsOf({ species: 'human', sex: 'female', age }).heightCm.toFixed(1));
  const tr = [11, 12, 14].map(age => V.voiceOf(V.speakingFactsOf({ species: 'human', sex: 'female', age })).tractCm);
  ok(JSON.stringify(hs) === '["142.2","149.4","160.8","163.8"]' && JSON.stringify(tr) === '[14.4,14.9,15.6]', "a child's unset height grows with age", JSON.stringify([hs, tr]));
}
// V12: children's pace (Mahr et al. 2021): a child of 3 at 0.75 of an adult's rate, 5 at 0.82, 8 at 0.92, 10 and 14 at 1; the
// adult age trend not carried below 16 (a girl of 11 as fast as one of 16).
{
  const r = [3, 5, 8, 10, 14].map(a => +V.childRate(a).toFixed(3)), rate = a => V.voiceOf({ sex: 'female', age: a, language: 'english' }).sylPerS;
  ok(JSON.stringify(r) === '[0.75,0.817,0.917,1,1]' && rate(11) === rate(16) && rate(5) < 0.85 * rate(16) && rate(40) < rate(16), "children's pace", JSON.stringify([r, rate(5), rate(11), rate(16), rate(40)]));
}
// V13: feelings in the natural voice (averaged-person.ts bodyRecording's emotion; emotion.ts VOCAL_FAMILY; Appraise's strength;
// src/index.js feelingOf): an emotion file reads back with its durations; at weight 0 the voice is the neutral one sample for
// sample; at weight 1 a family whose frames last twice as long and sit an octave higher gives twice the length and half the
// period, at 0.5 one and a half times the length; every OCC type has one of the five families (anger anger, distress sadness,
// relief tenderness, joy happiness, fear fear); Appraise keeps the feeling's strength; a line takes a feeling marked in it
// first, else the speaker's newest feeling, and each family's file from the voices folder where the player has it.
{
  const A = await import('../src/rules/averaged-person.js'), Em = await import('../src/rules/emotion.js'), fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const idx = fs.readFileSync(`${root}/src/index.js`, 'utf8'), tools = fs.readFileSync(`${root}/src/rules/rules-tools.js`, 'utf8'), wk = fs.readFileSync(`${root}/src/voice-worker.js`, 'utf8');
  const F = 400, EB = 257, AB = 65;
  const file = (melody, dur) => {
    const head = new TextEncoder().encode(JSON.stringify({ fs: 24000, framePeriodMs: 5, fftSize: 1024, frames: F, envBins: EB, apBins: AB, own: { f0: 150, tractCm: 17, sylPerS: 5 }, ...dur ? { dur: true } : {} }));
    const buf = new ArrayBuffer(8 + head.length + F + 4 * F + 2 * F * EB + F * AB + (dur ? 4 * F : 0)), u8 = new Uint8Array(buf), dv = new DataView(buf);
    u8.set([82, 86, 65, 80]); dv.setUint32(4, head.length, true); u8.set(head, 8);
    let o = 8 + head.length; u8.fill(1, o, o + F); o += F;
    for (let f = 0; f < F; f++) dv.setFloat32(o + 4 * f, melody, true); o += 4 * F;
    for (let f = 0; f < F; f++) for (let b = 0; b < EB; b++) dv.setInt16(o + 2 * (f * EB + b), b === 20 ? 0 : -4000, true);
    o += 2 * F * EB; u8.fill(240, o, o + F * AB); o += F * AB;
    if (dur) for (let f = 0; f < F; f++) dv.setFloat32(o + 4 * f, dur, true);
    return A.parseAveragedPerson(buf);
  };
  const neutral = file(0, 0), octave = file(Math.log(2), 2), body = { f0: 150, tractCm: 17, sylPerS: 5 };
  const lag = (y, a, b, lo, hi) => { let best = 0, bl = 0; for (let L = lo; L <= hi; L++) { let s = 0; for (let i = a; i < b; i++) s += y[i] * y[i + L]; if (s > best) { best = s; bl = L; } } return bl; };
  const r0 = A.bodyRecording(neutral, body), rz = A.bodyRecording(neutral, body, 1, { e: octave, w: 0 }), r1 = A.bodyRecording(neutral, body, 1, { e: octave, w: 1 }), rh = A.bodyRecording(neutral, body, 1, { e: octave, w: 0.5 });
  const same = r0.length === rz.length && r0.every((v, i) => v === rz[i]);
  const fams = Object.values(Em.VOCAL_FAMILY), five = ['anger', 'fear', 'happiness', 'sadness', 'tenderness'];
  ok(octave.dur?.length === F && Math.abs(octave.dur[0] - 2) < 1e-6 && neutral.dur === null && same
      && r1.length === 2 * r0.length && rh.length === 1.5 * r0.length && lag(r0, 20000, 22000, 100, 220) === 160 && lag(r1, 60000, 62000, 50, 110) === 80
      && Object.keys(Em.VOCAL_FAMILY).length === 22 && fams.every(f => five.includes(f)) && five.every(f => fams.includes(f))
      && Em.VOCAL_FAMILY.anger === 'anger' && Em.VOCAL_FAMILY.distress === 'sadness' && Em.VOCAL_FAMILY.relief === 'tenderness' && Em.VOCAL_FAMILY.joy === 'happiness' && Em.VOCAL_FAMILY.fear === 'fear'
      && /strength: strong \? 1 : peek\('voiceFeelingTouched'\)/.test(tools)
      && /const marked = unit\.querySelector\('\[data-feeling\]'\)\?\.getAttribute\('data-feeling'\);\s*if \(marked && emotionFiles\.has\(marked\)\)\s*return \{ family: marked, w: 1 \};/.test(idx)
      && /\.filter\(x => x\.left > 0\)\.sort\(\(a, b\) => \(b\.turn \?\? 0\) - \(a\.turn \?\? 0\)\)\[0\]/.test(idx) && /new URL\(`\.\.\/voices\/emotion-\$\{family\}\.bin`, import\.meta\.url\)/.test(idx)
      && /bodyRecording\(person, m\.body, 1, e && m\.emotion \? \{ e, w: m\.emotion\.w \} : undefined\)/.test(wk),
      'feelings in the voice', JSON.stringify([r0.length, rz.length, r1.length, rh.length, lag(r0, 20000, 22000, 100, 220), lag(r1, 60000, 62000, 50, 110), same]));
}
// V14: each person's speaking habits (pocket.ts habitsOf; averaged-person.ts bodyRecording; BodySize's draws; src/index.js
// naturalJob): a person at their sex's mean changes nothing; one SD up widens the melody by the spread over the mean, lengthens
// the pauses by the odds of the higher pause share and adds the breathiness SD; a doubled pause time lengthens only the pause
// frames (40 quiet frames of 5 ms: 40 × 120 samples more at the averaged person's own pace); half the melody range turns an
// octave leap into half an octave (period 160 → 113 samples); BodySize draws the habits once, and the voice draws the same
// from the salt and the name where they were never made.
{
  const A = await import('../src/rules/averaged-person.js'), P = await import('../src/rules/pocket.js'), fs = await import('node:fs'), root = new URL('..', import.meta.url).pathname;
  const idx = fs.readFileSync(`${root}/src/index.js`, 'utf8'), tools = fs.readFileSync(`${root}/src/rules/rules-tools.js`, 'utf8');
  const F = 400, EB = 257, AB = 65;
  // 400 frames: frames 100-139 unvoiced and silent (a pause), frames 200-399 an octave up.
  const head = new TextEncoder().encode(JSON.stringify({ fs: 24000, framePeriodMs: 5, fftSize: 1024, frames: F, envBins: EB, apBins: AB, own: { f0: 150, tractCm: 17, sylPerS: 5 } }));
  const buf = new ArrayBuffer(8 + head.length + F + 4 * F + 2 * F * EB + F * AB), u8 = new Uint8Array(buf), dv = new DataView(buf);
  u8.set([82, 86, 65, 80]); dv.setUint32(4, head.length, true); u8.set(head, 8);
  let o = 8 + head.length; for (let f = 0; f < F; f++) u8[o + f] = f >= 100 && f < 140 ? 0 : 1; o += F;
  for (let f = 0; f < F; f++) dv.setFloat32(o + 4 * f, f >= 200 ? Math.log(2) : 0, true); o += 4 * F;
  for (let f = 0; f < F; f++) for (let b = 0; b < EB; b++) dv.setInt16(o + 2 * (f * EB + b), f >= 100 && f < 140 ? -20000 : b === 20 ? 0 : -4000, true);
  o += 2 * F * EB; u8.fill(240, o, o + F * AB);
  const p = A.parseAveragedPerson(buf), body = { f0: 150, tractCm: 17, sylPerS: 5 };
  const lag = (y, a, b, lo, hi) => { let best = 0, bl = 0; for (let L = lo; L <= hi; L++) { let s = 0; for (let i = a; i < b; i++) s += y[i] * y[i + L]; if (s > best) { best = s; bl = L; } } return bl; };
  const r0 = A.bodyRecording(p, body), rp = A.bodyRecording(p, { ...body, pause: 2 }), rs = A.bodyRecording(p, { ...body, span: 0.5 });
  const pauses = A.pauseFrames(p).reduce((s, v) => s + v, 0), mean = P.habitsOf('male'), up = P.habitsOf('female', 1, 1, 1), H = P.HABITS.female;
  const odds = q => q / (1 - q);
  ok(JSON.stringify(mean) === '{"span":1,"pause":1,"breathDb":0}' && Math.abs(up.span - (1 + H.span.sd / H.span.mean)) < 0.006
      && Math.abs(up.pause - odds(H.pause.mean + H.pause.sd) / odds(H.pause.mean)) < 0.006 && Math.abs(up.breathDb - H.breath.sd) < 0.06
      && pauses === 40 && rp.length - r0.length === 40 * 120 && lag(r0, 30000, 32000, 50, 110) === 80 && lag(rs, 30000, 32000, 90, 140) === 113
      && /p\.spanZ \?\?= gauss\(seededRng\(`\$\{store\(\)\.salt\}:span:\$\{a\.who\}`\)\);/.test(tools) && /p\.breathZ \?\?= gauss/.test(tools)
      && /habitsOf\(p\.sex, p\.spanZ \?\? draw\('span'\), p\.pauseZ \?\? draw\('pause'\), p\.breathZ \?\? draw\('breath'\)\)/.test(idx),
      'speaking habits', JSON.stringify([mean, up, pauses, rp.length - r0.length, lag(r0, 30000, 32000, 50, 110), lag(rs, 30000, 32000, 90, 140)]));
}
console.log(`voice-body: ${n - miss} of ${n}`); process.exitCode = miss ? 1 : 0;
