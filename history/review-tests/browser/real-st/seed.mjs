// The chat and settings every page starts from (shoot.mjs calls seed() before each page load: a tap on AUTO is saved to
// SillyTavern's settings, a step to the chat). Seraphina ships with SillyTavern; the last message opens on an NVL beat (one
// sentence of 443 characters, which fitUnits cannot cut), message 3 is a short spoken beat. Two scenes, as the engine stamps
// lines (extra.rulesScene): Recife at 14:00 on 15 July 1990 (messages 0–2), then Olinda 85 minutes later (3–4); the engine's
// clock and place are the last line's, so the clock chip shows; the first scene has a woven chapter with two open threads.
// The older screens have their data too: the player's "Where am I?" said louder with a rise on "I" (the toolbar's hidden
// codes, voice-code.js markWords), a reading note under "I look out of the window" with its other readings and the knob at
// 1.5, and "warm broth" a key word (gold, held to explain, selected to show its path).
// Usage: ST_DIR=<SillyTavern checkout, started once so data/default-user exists> node seed.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
export async function seed(stDir = process.env.ST_DIR, ext = process.env.EXT_AFTER) {
  const d = path.join(stDir, 'data/default-user'), sf = path.join(d, 'settings.json');
  const s = JSON.parse(fs.readFileSync(sf, 'utf8'));
  s.firstRun = false; s.username = 'Mara';
  (s.extension_settings ??= {})['rules-engine'] = { boxVoice: 'off', boxTyping: false, musicOn: false };
  fs.writeFileSync(sf, JSON.stringify(s, null, 4));
  const t = '2026-11-24T12:00:00.000Z';
  // 1990-07-15 14:00 in the engine's minutes (clock.js parseStoryTime).
  const T0 = 1046394120, at = (m, place) => ({ t: T0 + m, place });
  const bot = (m, st) => ({ name: 'Seraphina', is_user: false, is_system: false, send_date: t, mes: m, swipes: [m], swipe_id: 0, extra: { rulesScene: { 0: st } } });
  const user = (m, st) => ({ name: 'Mara', is_user: true, is_system: false, send_date: t, mes: m, extra: { rulesScene: st } });
  const long = 'The glade is quiet in the late light, with moss over the roots of the old oaks and a thin stream running past the cottage door, '
    + 'bright where the sun falls through the leaves, while beyond the clearing the forest grows dark again and somewhere far off a bird calls twice and stops, '
    + 'and Seraphina sets a bowl of warm broth on the table and opens the shutters wide so that the evening air comes in and fills the small room with the smell of pine.';
  const V = await import(pathToFileURL(path.join(ext, 'src/rules/voice-code.js')).href), Rd = await import(pathToFileURL(path.join(ext, 'src/rules/reading.js')).href);
  const mark = (t, word, id) => { const i = t.indexOf(word), r = V.markWords(t, i, i + word.length, id); return r ? t.slice(0, r.from) + r.insert + t.slice(r.to) : t; };
  const where = mark(mark('*I sit up slowly.* "Where am I?"', 'Where', 'loud'), 'I?', 'up');
  const lines = [bot('*Seraphina leans over you, her amber eyes bright.* "Ah, you are awake at last. You were hurt in the forest, but you are safe now."', at(0, 'Recife')),
    user(where, at(5, 'Recife')), bot('"You are in my glade," Seraphina says. "Rest a while longer."', at(6, 'Recife')),
    user('*I look out of the window at the forest.*', at(90, 'Olinda')), bot(`${long} "Eat," she says softly. "It will help."`, at(95, 'Olinda'))];
  const look = lines[3]; look.extra.rulesFaith = 1.5;
  look.extra.rulesReading = { taken: { label: 'Look out of the window at the forest', others: ['Lean out of the window', 'Open the window and look out'] },
    acts: Rd.readingItems([{ tool: 'Look', args: { viewer: 'Mara', target: 'the forest', distance_m: 40 } }], 'Mara'), things: ['window → casement window (1600)'], line: look.mes };
  lines[4].extra.rulesKeys = { 0: [{ phrase: 'warm broth', tool: 'Thing', result: 'broth: meat or vegetables simmered in water; served warm it holds 60–70 °C' }] };
  // The first scene's chapter, hashed as index.ts weaveScene hashes it, so it reads as current.
  const B = await import(pathToFileURL(path.join(ext, 'src/rules/book.js')).href);
  const first = B.scenesOf(lines)[0];
  const chapter = { at: 'Chapter 1 · Recife', title: 'The Glade', mode: 'faithful', from: first.from, to: first.to, hash: B.hashOf(B.spanText(lines, first, 'Mara')),
    prose: 'Mara woke in a room of warm light. Seraphina leaned over her and said she was safe now, that the forest had hurt her. "Where am I?" Mara asked. "You are in my glade," Seraphina said. "Rest a while longer."',
    threads: ['what hurt Mara in the forest', 'why Seraphina keeps the glade'] };
  const meta = { rulesEngine: { state: { people: {}, clock: { t: T0 + 95, add: 0 }, setting: { place: 'olinda', label: 'Olinda', country: 'Brazil' }, latitude: -8.01, longitude: -34.85 }, snapshots: {}, version: 2, salt: 'shots' }, rulesChronicle: [chapter] };
  const msgs = [{ user_name: 'Mara', character_name: 'Seraphina', create_date: t, chat_metadata: meta }, ...lines];
  // The card's own chat name, so choosing Seraphina opens this chat.
  const dir = path.join(d, 'chats/default_Seraphina'); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'Seraphina - 2023-5-12 @21h 32m 29s 224ms.jsonl'), msgs.map(m => JSON.stringify(m)).join('\n') + '\n');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { await seed(); console.log('seeded', process.env.ST_DIR); }
