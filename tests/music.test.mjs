// The music (src/rules/music.ts): a song's measures from its samples (BS.1770 loudness, tempo, brightness, key), the space
// songs and feelings share, its areas, and the song chosen for a scene. Synthetic songs stand in for recordings: chords of sine
// partials with a burst of noise on each beat, so each measure has a known answer.
import fs from 'node:fs';
const M = await import('../src/rules/music.js');
const ROOT = new URL('..', import.meta.url).pathname;
let miss = 0, n = 0;
const ok = (c, m, got = '') => { n++; if (!c) { miss++; console.log(`MISS ${m}${got ? `: ${got}` : ''}`); } };
const near = (a, b, d) => Math.abs(a - b) <= d;
const sine = (f, amp, sec, fs = 48000) => Float32Array.from({ length: Math.round(fs * sec) }, (_, i) => amp * Math.sin(2 * Math.PI * f * i / fs));
const hz = m => 440 * 2 ** ((m - 69) / 12);
const song = (bpm, notes, { sec = 20, amp = 0.3, rate = 44100, noise = 1 } = {}) => {
  const len = rate * sec, x = new Float32Array(len), beat = 60 / bpm, fsq = notes.map(hz);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
  for (let i = 0; i < len; i++) { const t = i / rate, ph = t % beat; let v = 0; for (const f of fsq) v += Math.sin(2 * Math.PI * f * t) / fsq.length; x[i] = amp * (0.6 * v + (ph < 0.03 ? noise * rnd() * 2 * (1 - ph / 0.03) : 0)); }
  return [x];
};

// M1: K-weighting gives BS.1770's 48 kHz tables; a 0 dB FS tone near 1 kHz in one channel reads −3.0 LUFS (the
// Recommendation's check; 997 Hz, as its test signals use), in two channels 0.0; −20 dB reads 20 lower; the relative gate
// leaves out blocks more than 10 LU under the rest (half a signal 20 dB quieter lowers it by the 0.13 LU of the blocks that
// straddle the change, not by the 3 LU an ungated mean would); silence is −Infinity.
{
  const [s1, s2] = M.kWeighting(48000), r = x => x.map(v => v.toFixed(14)).join(' ');
  const table = r(s1.b) === '1.53512485958697 -2.69169618940638 1.19839281085285' && r(s1.a) === '1.00000000000000 -1.69065929318241 0.73248077421585' && r(s2.a) === '1.00000000000000 -1.99004745483398 0.99007225036621' && r(s2.b) === '1.00000000000000 -2.00000000000000 1.00000000000000';
  const one = M.loudness([sine(997, 1, 10)], 48000), two = M.loudness([sine(997, 1, 10), sine(997, 1, 10)], 48000), low = M.loudness([sine(997, 0.1, 10)], 48000);
  const mixed = new Float32Array([...sine(997, 0.1, 5), ...sine(997, 0.01, 5)]), gated = M.loudness([mixed], 48000);
  ok(table && near(one, -3.01, 0.02) && near(two, 0, 0.02) && near(low, -23.01, 0.02) && near(gated, -23.01, 0.2) && M.loudness([new Float32Array(48000)], 48000) === -Infinity,
      'loudness as BS.1770 measures it', JSON.stringify([table, one, two, low, gated]));
}
// M2–M4: tempo, key and brightness of songs whose answers are known; the key's lowest pitch follows from its frame.
{
  const cases = [[120, [60, 64, 67, 72], 'C major'], [90, [57, 60, 64, 69], 'A minor'], [140, [52, 55, 59, 64], 'E minor'], [75, [55, 59, 62, 67], 'G major']];
  const got = [];
  for (const [bpm, notes] of cases) got.push(await M.measureSong(song(bpm, notes), 44100));
  // A beat that falls between two spectrum frames once split its peak and read at half its tempo (140 BPM at 22.05 kHz, 150 at
  // 44.1 kHz); the envelope read at 250 Hz keeps it whole.
  const between = [await M.measureSong(song(140, [64, 67, 71], { rate: 22050, amp: 0.5, noise: 1.5 }), 22050), await M.measureSong(song(150, [64, 67, 71], { amp: 0.5, noise: 1.5 }), 44100)];
  ok(got.every((c, i) => near(c.bpm, cases[i][0], 1)) && near(between[0].bpm, 140, 1.5) && near(between[1].bpm, 150, 1.5), 'tempo of a beat', JSON.stringify([...got, ...between].map(c => c.bpm)));
  ok(got.every((c, i) => c.key === cases[i][2] && Math.sign(c.majorness) === (cases[i][2].endsWith('major') ? 1 : -1)) && near(M.chromaLowHz(44100), 91.9, 0.1), 'key and mode by Krumhansl and Kessler', JSON.stringify(got.map(c => [c.key, c.majorness])));
  // Half the signal a 1 kHz tone, half a hiss at −80 dB: the hiss is under musicSilenceDbfs and takes no part.
  let seed = 3; const hiss = Float32Array.from({ length: 48000 * 4 }, () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2e-4);
  const tone = await M.measureSong([new Float32Array([...sine(1000, 0.5, 4), ...hiss])], 48000);
  ok(near(tone.centroidHz, 1000, 15) && tone.seconds === 8, 'brightness is the spectral centroid, silence left out', JSON.stringify(tone));
}
// M5: feelings placed by the words that name them (data/feeling-va.ts): 22 OCC types and Juslin & Laukka's five, each on the
// norms' 1–9 scales; anger and fear more aroused than sadness and tenderness, happiness and tenderness more pleasant than
// anger, fear and sadness; a scene's point is the strongest feeling's at 0.9 and the newest one's at 0.1 (the player's
// weighting), its set named by the strongest one's holder.
{
  const D = await import('../src/rules/data/feeling-va.js'), E = await import('../src/rules/emotion.js');
  const keys = Object.keys(D.FEELING_VA), p = f => M.feelingPoint(f);
  const all = Object.keys(E.TYPES).every(t => keys.includes(t)) && ['anger', 'fear', 'happiness', 'sadness', 'tenderness'].every(f => keys.includes(`voice:${f}`)) && keys.length === 27
      && Object.values(D.FEELING_VA).every(f => f.v >= 1 && f.v <= 9 && f.a >= 1 && f.a <= 9);
  const order = p('voice:anger').a > p('voice:sadness').a && p('voice:fear').a > p('voice:tenderness').a && p('voice:happiness').v > p('voice:anger').v && p('voice:tenderness').v > p('voice:sadness').v && p('nothing') === null;
  const t = M.sceneTarget([{ who: 'Mara', type: 'relief', turn: 3 }, { who: 'Tom', type: 'voice:sadness', turn: 2 }, { who: 'Ann', type: 'unknown', turn: 3 }]);
  const same = M.sceneTarget([{ who: 'Mara', type: 'relief', turn: 3 }, { who: 'Tom', type: 'voice:sadness', turn: 3 }]);
  const mix = (a, b, k) => 0.9 * p(a)[k] + 0.1 * p(b)[k];
  ok(all && order && near(t.at.v, mix('voice:sadness', 'relief', 'v'), 1e-9) && near(t.at.a, mix('voice:sadness', 'relief', 'a'), 1e-9) && t.who === 'Tom'
      && near(same.at.v, p('voice:sadness').v, 1e-9) && same.who === 'Tom' && M.sceneTarget([]) === null, 'feelings have a place among feelings', JSON.stringify([all, order, t, same]));
}
// M6: songs placed against the library: faster, louder and brighter is more aroused, major more pleasant; areas are found
// farthest-first, four at least (the axes' quarters), √(n ÷ 2) when that is more; an area's first name says its middle.
{
  const cue = (bpm, lufs, centroidHz, majorness) => ({ bpm, lufs, centroidHz, majorness, key: '', seconds: 60 });
  const lib = [cue(70, -20, 800, -0.3), cue(72, -21, 900, -0.25), cue(150, -9, 3000, 0.3), cue(145, -10, 2800, 0.25), cue(140, -9, 3200, -0.3), cue(150, -8, 3100, -0.28), cue(68, -22, 700, 0.3), cue(75, -20, 850, 0.28)];
  const pts = M.songPoints(lib), areas = M.areasOf(pts);
  const sameArea = (i, j) => areas[i] === areas[j];
  const many = M.areasOf(Array.from({ length: 50 }, (_, i) => ({ v: Math.cos(i), a: Math.sin(i * 1.7) })));
  ok(pts[2].a > pts[0].a && pts[6].v > pts[0].v && new Set(areas).size === 4 && sameArea(0, 1) && sameArea(2, 3) && sameArea(4, 5) && sameArea(6, 7) && !sameArea(0, 6) && !sameArea(2, 4)
      && JSON.stringify(M.areasOf(pts)) === JSON.stringify(areas) && M.areasOf([]).length === 0 && new Set(M.areasOf(pts.slice(0, 3))).size === 3 && new Set(many).size === 5,
      'songs have a place among songs, in areas', JSON.stringify([pts.map(p => [p.v.toFixed(2), p.a.toFixed(2)]), areas]));
  ok(M.areaWords([{ v: -1, a: 1 }]) === 'intense, minor' && M.areaWords([{ v: 0.2, a: -0.9 }]) === 'calm, mixed', "an area's first name says its middle", M.areaWords([{ v: -1, a: 1 }]));
}
// M7: the song chosen: the nearest to the scene; the one playing gives way when the nearest lies in another area or is 1.5
// standard deviations nearer (the player's picks), else stays; a set named after the one whose feeling leads the scene,
// else after the place the player's character is at, else the songs in no set; no feeling, what plays goes on.
{
  const points = [{ v: -1, a: 1 }, { v: -0.8, a: 0.9 }, { v: 1, a: -1 }, { v: 0.9, a: 1 }, { v: -1, a: -1 }];
  const areas = [0, 0, 1, 2, 3], sets = ['', '', '', 'Tom', 'harbour'];
  const pick = (target, current, place = null, s = sets) => M.chooseSong({ points, areas, sets: s, target, current, place });
  const angry = { at: { v: -1, a: 1 }, who: 'Mara' };
  const got = [pick(angry, null), pick({ at: { v: -0.78, a: 0.9 }, who: 'Mara' }, 0), pick({ at: { v: 1, a: -1 }, who: 'Mara' }, 0), pick({ at: { v: -1, a: 1 }, who: 'tom' }, null),
    pick(angry, null, 'the harbour: the north quay'), pick(null, 2), pick(null, null), M.chooseSong({ points: [], areas: [], sets: [], target: angry, current: null })];
  // One area: a song 2 SD nearer takes over, one 1.2 SD nearer does not; another area takes over even 0.58 SD nearer.
  const line = [{ v: 0, a: 0 }, { v: 1.2, a: 0 }, { v: 2, a: 0 }, { v: 0.5, a: 0.3 }];
  const inLine = (at) => M.chooseSong({ points: line, areas: [0, 0, 0, 1], sets: ['', '', '', ''], target: { at, who: 'Mara' }, current: 0 });
  got.push(inLine({ v: 2, a: 0 }), inLine({ v: 1.2, a: 0 }), inLine({ v: 0.5, a: 0.3 }));
  ok(JSON.stringify(got) === JSON.stringify([0, 0, 2, 3, 4, 2, 1, null, 2, 0, 3]), 'the song for the scene', JSON.stringify(got));
}
// M8: the wiring (src/index.js): the music is chosen again on a new chat, the player's line and a reply; songs are uploaded
// to SillyTavern's files and measured from their decoded samples; songs cross equal-power; the settings keep one object.
{
  const idx = fs.readFileSync(`${ROOT}/src/index.js`, 'utf8'), html = fs.readFileSync(`${ROOT}/settings.html`, 'utf8');
  ok(/\[ev\.CHAT_CHANGED, ev\.USER_MESSAGE_RENDERED, ev\.MESSAGE_RECEIVED\]\) *\n?\s*if \(e\)\s*\n?\s*on\(e, \(\) => \{\s*\n?\s*try \{\s*\n?\s*musicNow\(\);/.test(idx) && /fetch\('\/api\/files\/upload'/.test(idx) && /measureSong\(Array\.from/.test(idx)
      && /to\.volume = vol \* Math\.sin\(x \* Math\.PI \/ 2\)/.test(idx) && /from\.volume = vol \* Math\.cos\(x \* Math\.PI \/ 2\)/.test(idx) && /\(all\[NAME\] \?\?= \{\}\)/.test(idx)
      && ['rules_engine_music', 'rules_engine_music_volume', 'rules_engine_music_add', 'rules_engine_music_list', 'rules_engine_music_areas'].every(id => html.includes(`id="${id}"`)), 'the music follows the chat', '');
}
console.log(`music: ${n - miss} of ${n}`); process.exitCode = miss ? 1 : 0;
