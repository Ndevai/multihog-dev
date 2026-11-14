// Each family at full strength against neutral, for the woman of 30, made by the extension's own code (averaged-person.js):
// writes probe/emo-<family>.wav and probe/emo-neutral.wav for measuring.
import fs from 'node:fs';
const [root, dir, ...fams] = process.argv.slice(2);
const A = await import(`${root}/src/rules/averaged-person.js`);
const load = f => { const b = fs.readFileSync(f); return A.parseAveragedPerson(b.buffer.slice(b.byteOffset, b.byteOffset + b.length)); };
const p = load(`${dir}/averaged-person.bin`), body = { f0: 199.7, tractCm: 16.78, sylPerS: 4.36 };
const wav = (y, f) => { const pcm = Buffer.alloc(y.length * 2); y.forEach((s, i) => pcm.writeInt16LE(Math.round(s * 32767), i * 2));
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40); fs.writeFileSync(f, Buffer.concat([h, pcm])); };
wav(A.bodyRecording(p, body), `${dir}/probe/emo-neutral.wav`);
for (const fam of fams) for (const w of [0.5, 1]) wav(A.bodyRecording(p, body, 1, { e: load(`${dir}/emotion-${fam}.bin`), w }), `${dir}/probe/emo-${fam}-${w}.wav`);
console.log('written');
