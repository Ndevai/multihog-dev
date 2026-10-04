// DF attack resolution: momentum (wiki: Weapon) and layer-by-layer penetration (wiki: Material science).
// Spec: docs/df-body-engine.md §3–4.
import { select } from './raws.js';

export const SKILL_LEVELS = ['Dabbling', 'Novice', 'Adequate', 'Competent', 'Skilled', 'Proficient', 'Talented', 'Adept', 'Expert',
    'Professional', 'Accomplished', 'Great', 'Master', 'High Master', 'Grand Master', 'Legendary'];
export const STYLES = { normal: 1, quick: 0.5, heavy: 1.5, wild: 1.5 };
const Q = 1;

export const skillFactor = level => 1 + Math.min(Math.max(0, SKILL_LEVELS.indexOf(level)), 14) / 14;
export const partSize = (c, part, iSize) => iSize * part.relsize / c.relTotal;
// DFHack df-structures unit_wound_layerst: "Body parts and non-weapon items have contact=(size/10)^(2/3)."
export const area = size => (size / 10) ** (2 / 3);
export const tissueOf = (c, layer) => c.tissues[layer.tissue];
export const materialOf = (c, layer) => c.materials[tissueOf(c, layer)?.material] || {};
export const liveLayers = (c, part) => part.layers.filter(l => !tissueOf(c, l)?.flags.includes('COSMETIC'));

export function partDensity(c, part) {
    const layers = liveLayers(c, part);
    const thick = layers.reduce((s, l) => s + l.thick, 0);
    return thick ? layers.reduce((s, l) => s + l.thick * (materialOf(c, l).SOLID_DENSITY ?? 1000), 0) / thick : 1000;
}

/** Weapon values of a creature's natural attack; null when no matching part works. */
export function bodyWeapon(c, attack, iSize, works = () => true) {
    for (const base of select(c.parts, attack.sel[0], attack.sel[1]).filter(works)) {
        let tip = base;
        if (attack.child) {
            const kids = [base, ...c.parts.filter(p => p.parent === base.id)];
            const pool = attack.child[1] === 'ALL' ? kids : select(kids, attack.child[0], attack.child[1]);
            tip = pool.find(p => !attack.tissue || p.layers.some(l => l.tissue === attack.tissue));
            if (!tip) continue;
        }
        const outer = liveLayers(c, tip).at(-1);
        const mat = attack.tissue ? c.materials[c.tissues[attack.tissue]?.material] : outer ? materialOf(c, outer) : {};
        return {
            name: tip === base ? base.name : `${base.name} (${tip.name})`,
            size: partSize(c, base, iSize), density: partDensity(c, base),
            contact: attack.contactPerc / 100 * area(partSize(c, tip, iSize)),
            penetration: attack.penetrationPerc, edge: attack.edge, velocity: attack.velocity / 1000, mat: mat || {},
        };
    }
    return null;
}

export function itemWeapon(w, attack, metal) {
    return { name: `${metal.name} ${w.name}`, size: w.size, density: metal.SOLID_DENSITY, contact: attack.contact,
        penetration: attack.penetration, edge: attack.edge, velocity: attack.velocity / 1000, mat: metal };
}

/** M = Skill × Size × Str × Vel ÷ (10⁶ × (1 + i_Size ÷ (w_density × w_size))) × style × prone. */
export function momentum(c, iSize, w, { skill, style = 'normal', prone = false } = {}) {
    return skillFactor(skill) * c.size * c.strength * w.velocity / (1e6 * (1 + iSize / (w.density * w.size)))
        * (STYLES[style] ?? 1) * (prone ? 2 : 1);
}

/**
 * Tests the struck part's layers outermost first, then one internal part. Returns
 * { hits: [{ part, layer, result: 'cut'|'smashed' }], tested: [{ part, layer, result }], severed, left }.
 */
export function penetrate(c, struck, iSize, w, M, rng) {
    const tested = [];
    let edged = w.edge;
    const visit = part => {
        const A = Math.min(w.contact, area(partSize(c, part, iSize)));
        for (const layer of [...liveLayers(c, part)].reverse()) {
            if (M <= 0) return;
            const m = materialOf(c, layer);
            if (edged) {
                const S = (w.mat.MAX_EDGE ?? 10000) / 10000;
                const need = (m.SHEAR_YIELD / w.mat.SHEAR_YIELD + (A + 1) * m.SHEAR_FRACTURE / w.mat.SHEAR_FRACTURE) * (10 + 2 * Q) / (S * Q);
                if (M >= need) { tested.push({ part, layer, result: 'cut' }); M *= 0.95; continue; }
                M *= Math.min(1, m.SHEAR_STRAIN_AT_YIELD / 50000);
                edged = false;
            }
            const need = (2 * m.IMPACT_FRACTURE - m.IMPACT_YIELD) / 1e6 * (2 + 0.4 * Q) * A;
            if (M >= need) { tested.push({ part, layer, result: 'smashed' }); M *= 0.95; continue; }
            M *= Math.min(1, m.IMPACT_STRAIN_AT_YIELD / 50000);
            tested.push({ part, layer, result: 'held' });
        }
    };
    visit(struck);
    const outerLayers = liveLayers(c, struck);
    const severed = w.edge && !struck.flags.includes('UPPERBODY') && !struck.flags.includes('LOWERBODY') && outerLayers.length > 0
        && outerLayers.every(l => tested.some(t => t.layer === l && t.part === struck && t.result === 'cut'))
        && w.contact >= area(partSize(c, struck, iSize));
    if (M > 0 && !severed) {
        const inside = c.parts.filter(p => p.parent === struck.id && p.flags.includes('INTERNAL') && p.relsize > 0);
        const total = inside.reduce((s, p) => s + p.relsize, 0);
        let r = rng() * total;
        const pick = inside.find(p => (r -= p.relsize) < 0);
        if (pick) {
            for (const a of pick.around) {
                const outer = c.parts.find(p => p.id === a.part);
                if (outer && M > 0 && rng() < a.perc / 100) visit(outer);
            }
            if (M > 0) visit(pick);
        }
    }
    return { tested, hits: tested.filter(t => t.result !== 'held'), severed, left: M };
}
