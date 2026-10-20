// Checks every material in the table against the laws that tie its numbers together (src/rules/materials.ts): the speed of
// sound in a rod √(E/ρ) against the measured one, Wiedemann–Franz for metals, strain at failure in its family's band.
// Usage: node tools/check-materials.mjs
const M = await import('../src/rules/materials.js');
let bad = 0;
for (const [name, m] of Object.entries(M.MATERIALS)) {
    const p = M.checkMaterial(m), c = m.c && m.E ? Math.round(Math.sqrt(m.E * 1e9 / m.rho)) : null;
    if (p.length) bad++;
    console.log(`${p.length ? 'CHECK' : 'ok   '} ${name.padEnd(28)} ρ ${String(m.rho).padStart(5)}  E ${String(m.E).padStart(5)} GPa  √(E/ρ) ${c ?? '–'} vs ${m.c ?? '–'} m/s${p.length ? `\n      ${p.join('\n      ')}` : ''}`);
}
console.log(`\n${Object.keys(M.MATERIALS).length} materials, ${bad} with a law broken.`);
console.log('\nWalls (surface mass kg/m²):', Object.keys(M.WALLS).filter(w => !w.startsWith('_')).map(w => `${w} ${Math.round(M.surfaceMass(w))}`).join(', '));
