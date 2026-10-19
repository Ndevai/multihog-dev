// Fragility census (docs/df-body-engine.md §6.21): runs a set of scenes through the real tools and counts which registered
// judgement each outcome rests on (the "Fragile" notes the tools add). The ranking says which assumptions matter most, so the
// next sources go where they change outcomes. Usage: node tools/fragility-census.mjs
process.chdir(new URL('..', import.meta.url).pathname);
const { call, ctx } = await import('./st-harness.mjs');
const { parseStoryTime } = await import('../src/rules/clock.js');
const T = await import('../src/rules/rules-tools.js');
const fresh = t => { ctx.chatMetadata = {}; T.setStoryTime(parseStoryTime(t)); };
const scenes = {
    'charcoal brazier, attic, sleeper': async () => { fresh('1890-01-12 22:00'); await call('NewCharacter', { who: 'A' }); await call('Act', { who: 'A', steps: [{ do: 'be_at', to: 'attic' }] });
        await call('Room', { room: 'attic', volume_m3: 30, air_changes_per_hour: 0.3, fires: [{ fuel: 'charcoal', kg_per_hour: 0.5 }] }); return [await call('PassTime', { minutes: 120, sleeping: ['A'] })]; },
    'wood fire, small hut, sleeper': async () => { fresh('1890-01-12 22:00'); await call('NewCharacter', { who: 'A' }); await call('Act', { who: 'A', steps: [{ do: 'be_at', to: 'hut' }] });
        await call('Room', { room: 'hut', floor_m2: 10, height_m: 2.2, air_changes_per_hour: 0.5, fires: [{ fuel: 'wood', kg_per_hour: 1.5 }] }); return [await call('PassTime', { minutes: 180, sleeping: ['A'] })]; },
    'brazier next room, door open': async () => { fresh('1890-01-12 22:00'); await call('NewCharacter', { who: 'A' }); await call('Act', { who: 'A', steps: [{ do: 'be_at', to: 'bedroom' }] });
        await call('Room', { room: 'bedroom', floor_m2: 12, height_m: 2.5, air_changes_per_hour: 0.4 });
        await call('Room', { room: 'kitchen', floor_m2: 14, height_m: 2.5, air_changes_per_hour: 0.4, fires: [{ fuel: 'charcoal', kg_per_hour: 0.4 }], doorways: [{ room: 'bedroom' }] }); return [await call('PassTime', { minutes: 240, sleeping: ['A'] })]; },
    'parlour fire, door open, standing': async () => { fresh('1890-01-12 22:00'); await call('NewCharacter', { who: 'A' }); await call('Act', { who: 'A', steps: [{ do: 'be_at', to: 'parlour' }] });
        await call('Room', { room: 'parlour', floor_m2: 16, height_m: 2.4, lining: 'gypsum board', opening_m2: 1.6, opening_height_m: 2, fires: [{ fuel: 'wood', kg_per_hour: 120 }] }); return [await call('PassTime', { minutes: 10 })]; },
    'crowded closed room, 20 people': async () => { fresh('1890-01-12 22:00'); const out = []; for (let i = 0; i < 20; i++) { await call('NewCharacter', { who: 'P' + i }); await call('Act', { who: 'P' + i, steps: [{ do: 'be_at', to: 'cell' }] }); }
        await call('Room', { room: 'cell', volume_m3: 40, air_changes_per_hour: 0.2 }); out.push(await call('PassTime', { minutes: 240 })); return out; },
    'uphill walk with load': async () => { fresh('1890-05-12 08:00'); await call('NewCharacter', { who: 'A' }); return [await call('PassTime', { minutes: 240, walking: [{ who: 'A', grade_pct: 12, load_kg: 25, terrain: 'dirt road' }] })]; },
};
const tally = {}, per = [];
for (const [name, run] of Object.entries(scenes)) {
    const outs = await run(), notes = outs.flatMap(o => String(o).match(/Fragile: [^\n]*/g) ?? []);
    const ids = [...new Set(notes.flatMap(n => [...n.matchAll(/(\w+) = [\d.]+/g)].map(m => m[1])))];
    for (const id of ids) tally[id] = (tally[id] ?? 0) + 1;
    per.push(`${name}: ${ids.length ? ids.join(', ') : 'robust'}`);
}
console.log(per.join('\n'));
console.log('\nOutcomes resting on each judgement:', Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none');
