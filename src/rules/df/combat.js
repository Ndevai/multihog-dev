// DF attack resolution: momentum (wiki: Weapon) and layer-by-layer penetration (wiki: Material science).
// Spec: docs/df-body-engine.md §3–4.
import { select } from './raws.js';
import { randomSublocation, shareOf } from './sublocations.js';

export const SKILL_LEVELS = ['Dabbling', 'Novice', 'Adequate', 'Competent', 'Skilled', 'Proficient', 'Talented', 'Adept', 'Expert',
    'Professional', 'Accomplished', 'Great', 'Master', 'High Master', 'Grand Master', 'Legendary'];
export const STYLES = { normal: 1, quick: 0.5, heavy: 1.5, wild: 1.5 };
const Q = 1;
// Blunt test on rigid tissue (STRUCTURAL, not FUNCTIONAL) × this factor. Fit (docs/df-body-engine.md §4.6): a
// Professional 70 kg human's punch breaks the skull on 0.153 % of landed head punches (27 facial fractures, 301 bouts).
export const RIGID_BLUNT_FACTOR = 19.985;
// Momentum × this factor for natural cutting attacks (bites, scratches, gores). Fit (docs/df-body-engine.md §4.7): a dog's
// bite to a human forearm breaks the skin on 87.4 % of bites (475 ED-treated adult dog bites, Morzycki 2019).
export const NATURAL_EDGE_FACTOR = 2.243;
// Share of the striking part's contact area a natural cutting attack crushes with once it stops cutting. Fit (§4.7):
// 2 % of those dog bites fracture bone (Morzycki 2019).
export const CRUSH_AREA_SHARE = 0.232;

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
            // a cutting attack that stops cutting crushes with the whole striking part (jaw, paw) [ASSUMED]
            bluntContact: attack.edge ? attack.contactPerc / 100 * area(partSize(c, base, iSize)) * CRUSH_AREA_SHARE : undefined,
            penetration: attack.penetrationPerc, edge: attack.edge, velocity: attack.velocity / 1000, mat: mat || {}, natural: true,
        };
    }
    return null;
}

export function itemWeapon(w, attack, metal) {
    return { name: `${metal.name} ${w.name}`, size: w.size, density: metal.SOLID_DENSITY, contact: attack.contact,
        penetration: attack.penetration, edge: attack.edge, velocity: attack.velocity / 1000, mat: metal };
}

const LAYER_ORDER = ['COVER', 'ARMOR', 'OVER', 'UNDER'];
const external = p => !p.flags.includes('INTERNAL') && !p.flags.includes('EMBEDDED');

/** Steps from an ancestor along the CON chain, or Infinity when anc is not above part. */
function steps(c, part, anc) {
    let n = 0;
    for (let q = part; q; q = c.parts.find(x => x.id === q.parent), n++) if (q === anc) return n;
    return Infinity;
}

/** Whether a worn item covers a part (wiki Armor: helms the head; gloves and shoes the hands and feet + UPSTEP; body armor the torso + UBSTEP / LBSTEP; pants the lower body + LBSTEP). */
export function covers(c, item, part) {
    if (!external(part)) return false;
    const has = f => part.flags.includes(f);
    const roots = f => c.parts.filter(x => x.flags.includes(f));
    const limbish = has('LIMB') || part.cats.includes('NECK');
    const extremity = f => roots(f).some(r => r === part || (part.parent === r.id && has('DIGIT')) || (has('LIMB') && steps(c, r, part) <= item.upstep));
    const down = (root, n) => root.some(r => limbish && !has('GRASP') && !has('STANCE') && steps(c, part, r) <= n);
    const up = n => roots('UPPERBODY').some(r => limbish && !has('GRASP') && !has('STANCE') && !has('HEAD') && steps(c, part, r) <= n
        && !roots('LOWERBODY').some(l => steps(c, part, l) < Infinity));
    switch (item.kind) {
        case 'ITEM_HELM': return has('HEAD');
        case 'ITEM_GLOVES': return extremity('GRASP');
        case 'ITEM_SHOES': return extremity('STANCE');
        case 'ITEM_PANTS': return has('LOWERBODY') || down(roots('LOWERBODY'), item.lbstep);
        case 'ITEM_ARMOR': return has('UPPERBODY') || has('LOWERBODY') || up(item.ubstep) || down(roots('LOWERBODY'), item.lbstep);
        default: return false;
    }
}

/** Armor size [WIKI]: part size × coverage/100 × (1 + (UPSTEP + UBSTEP + LBSTEP) ÷ 4), MAX counted as 3. */
export const armorSize = (partCm3, item) => partCm3 * item.coverage / 100 * (1 + [item.upstep, item.ubstep, item.lbstep].reduce((s, x) => s + Math.min(x, 3), 0) / 4);

/** M = Skill × Size × Str × Vel ÷ (10⁶ × (1 + i_Size ÷ (w_density × w_size))) × style × prone. */
export function momentum(c, iSize, w, { skill, style = 'normal', prone = false } = {}) {
    return skillFactor(skill) * c.size * c.strength * w.velocity / (1e6 * (1 + iSize / (w.density * w.size)))
        * (STYLES[style] ?? 1) * (prone ? 2 : 1) * (w.natural && w.edge ? NATURAL_EDGE_FACTOR : 1);
}

/**
 * Tests worn armor covering the struck part (outermost layer first, each met with chance = coverage), then the struck
 * part's tissue layers outermost first, then one internal part. Returns
 * { tested: [{ part, layer, result: 'cut'|'smashed'|'held', armor? }], hits (tissue only), severed, left }.
 */
export function penetrate(c, struck, iSize, w, M, rng, worn = [], side = 'front') {
    const tested = [];
    // CDDA outfit::absorb_damage: the hit lands on one sub-location; one roll 1–100 decides every worn layer.
    const sub = randomSublocation(struck, rng, side);
    const first = { M: 0, edged: w.edge };  // momentum and edge reaching the struck part's tissue, after armour
    const roll = rng() * 100;
    let edged = w.edge;
    // One layer test (wiki Material science); returns 'cut' | 'smashed' | 'held' and updates M and edged.
    const test = (m, A, Qa, factor, Ablunt = A) => {
        if (edged) {
            const S = (w.mat.MAX_EDGE ?? 10000) / 10000;
            const need = (m.SHEAR_YIELD / w.mat.SHEAR_YIELD + (A + 1) * m.SHEAR_FRACTURE / w.mat.SHEAR_FRACTURE) * (10 + 2 * Qa) / (S * Q);
            if (M >= need) { M *= 0.95; return 'cut'; }
            M *= Math.min(1, m.SHEAR_STRAIN_AT_YIELD / 50000);
            edged = false;
        }
        const need = (2 * m.IMPACT_FRACTURE - m.IMPACT_YIELD) / 1e6 * (2 + 0.4 * Qa) * Ablunt * factor;
        if (M >= need) { M *= 0.95; return 'smashed'; }
        M *= Math.min(1, m.IMPACT_STRAIN_AT_YIELD / 50000);
        return 'held';
    };
    const visit = part => {
        const size = partSize(c, part, iSize);
        if (part === struck) {
            // The item's portion over the hit sub-location: explicit portions (CDDA armor portions), else DF's item coverage.
            const portion = it => {
                if (it.blocking) return { coverage: 100, subs: null };
                if (!it.parts) return covers(c, it, part) ? { coverage: it.coverage, subs: null } : null;
                return (it.parts[part.id] || []).find(p => (!p.subs || !sub || p.subs.includes(sub)) && (!p.sides || p.sides.includes(side))) ?? null;
            };
            const items = worn.map(it => [it, portion(it)]).filter(([, p]) => p && p.coverage > 0)
                .sort(([x], [y]) => (y.blocking ? 1 : 0) - (x.blocking ? 1 : 0) || LAYER_ORDER.indexOf(x.layer) - LAYER_ORDER.indexOf(y.layer));
            for (const [it, p] of items) {
                if (M <= 0) return;
                if (roll >= p.coverage) continue;
                const mat = p.mat ?? it.mat;
                let m = { IMPACT_FRACTURE: mat.IMPACT_YIELD, SHEAR_FRACTURE: mat.SHEAR_YIELD, ...mat };
                if (p.elastic ?? it.elastic) m = { ...m, SHEAR_STRAIN_AT_YIELD: 50000, IMPACT_STRAIN_AT_YIELD: 50000 };
                const cm3 = it.held ? it.size : it.parts ? size * shareOf(part, p.subs) * Math.min(p.coverage, 100) / 100 : armorSize(size, it);
                tested.push({ part, layer: { tissue: p.mat ? `${it.name} (${p.mat.name})` : it.name }, armor: true, result: test(m, Math.min(w.contact, area(cm3)), it.quality, 1, Math.min(w.bluntContact ?? w.contact, area(cm3))) });
            }
        }
        if (part === struck) { first.M = M; first.edged = edged; }
        const A = Math.min(w.contact, area(size));
        const Ab = Math.min(w.bluntContact ?? w.contact, area(size));
        for (const layer of [...liveLayers(c, part)].reverse()) {
            if (M <= 0) return;
            const flags = tissueOf(c, layer)?.flags || [];
            const rigid = flags.includes('STRUCTURAL') && !flags.includes('FUNCTIONAL');
            tested.push({ part, layer, result: test(materialOf(c, layer), A, Q, rigid ? RIGID_BLUNT_FACTOR : 1, Ab) });
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
    return { tested, hits: tested.filter(t => t.result !== 'held' && !t.armor), severed, left: M, sub, side, first };
}
