// Dwarf Fortress 0.47.04 raws (public domain: rules/df/raw/readme.txt) read as DF defines them:
// objects → creature token list (COPY_TAGS_FROM, creature variations, castes) → body parts, tissue
// layers, materials and attacks. Spec: docs/df-body-engine.md §2.

export const RAW_FILES = [
    'body_default.txt', 'body_rcp.txt', 'b_detail_plan_default.txt', 'tissue_template_default.txt',
    'material_template_default.txt', 'c_variation_default.txt', 'item_weapon.txt', 'inorganic_metal.txt',
    'item_armor.txt', 'item_helm.txt', 'item_gloves.txt', 'item_shoes.txt', 'item_pants.txt', 'item_shield.txt', 'item_ammo.txt',
    'creature_amphibians.txt', 'creature_annelids.txt', 'creature_birds.txt', 'creature_birds_new.txt',
    'creature_bug_slug_new.txt', 'creature_desert_new.txt', 'creature_domestic.txt', 'creature_equipment.txt',
    'creature_fanciful.txt', 'creature_insects.txt', 'creature_large_mountain.txt', 'creature_large_ocean.txt',
    'creature_large_riverlake.txt', 'creature_large_temperate.txt', 'creature_large_tropical.txt',
    'creature_large_tundra.txt', 'creature_mountain_new.txt', 'creature_next_underground.txt', 'creature_ocean_new.txt',
    'creature_other.txt', 'creature_reptiles.txt', 'creature_riverlakepool_new.txt', 'creature_small_mammal_new.txt',
    'creature_small_mammals.txt', 'creature_small_ocean.txt', 'creature_small_riverlake.txt', 'creature_standard.txt',
    'creature_subterranean.txt', 'creature_temperate_new.txt', 'creature_tropical_new.txt', 'creature_tundra_taiga_new.txt',
];

const HEADS = ['BODY', 'BODY_DETAIL_PLAN', 'TISSUE_TEMPLATE', 'MATERIAL_TEMPLATE', 'CREATURE', 'CREATURE_VARIATION', 'INORGANIC'];
const MAT_KEYS = ['SOLID_DENSITY', 'IMPACT_YIELD', 'IMPACT_FRACTURE', 'IMPACT_STRAIN_AT_YIELD', 'SHEAR_YIELD', 'SHEAR_FRACTURE', 'SHEAR_STRAIN_AT_YIELD', 'MAX_EDGE'];
const TISSUE_NUM = ['RELATIVE_THICKNESS', 'HEALING_RATE', 'VASCULAR', 'PAIN_RECEPTORS'];
const TISSUE_FLAGS = ['STRUCTURAL', 'FUNCTIONAL', 'ARTERIES', 'MAJOR_ARTERIES', 'COSMETIC', 'SETTABLE', 'SPLINTABLE', 'CONNECTIVE_TISSUE_ANCHOR', 'SCARS', 'CONNECTS'];
const TISSUE_OTHER = ['TISSUE_MATERIAL', 'SUBORDINATE_TO_TISSUE', 'TISSUE_NAME', 'TISSUE_SHAPE', 'TISSUE_LEAKS', 'TISSUE_MAT_STATE',
    'THICKENS_ON_STRENGTH', 'THICKENS_ON_ENERGY_STORAGE', 'STYLEABLE', 'INSULATION', 'TISSUE_STYLE_UNIT', 'TISSUE_COLOR'];
const ARMOR_KINDS = ['ITEM_ARMOR', 'ITEM_HELM', 'ITEM_GLOVES', 'ITEM_SHOES', 'ITEM_PANTS', 'ITEM_SHIELD'];
const ORDINAL = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth'];

export function tokens(text) {
    return [...String(text).matchAll(/\[([^[\]]*)\]/g)].map(m => m[1].split(':'));
}

export function indexRaws(files) {
    const db = { ITEM_WEAPON: {}, ITEM_AMMO: {}, ARMOR: {}, cache: {}, expanded: {} };
    for (const h of HEADS) db[h] = {};
    for (const text of Object.values(files)) {
        let type = null, cur = null;
        for (const t of tokens(text)) {
            if (t[0] === 'OBJECT') { type = t[1]; cur = null; continue; }
            if (type === 'ITEM' && t.length === 2 && /^ITEM_[A-Z]+$/.test(t[0])) {
                if (t[0] === 'ITEM_WEAPON') cur = db.ITEM_WEAPON[t[1]] = [];
                else if (t[0] === 'ITEM_AMMO') cur = db.ITEM_AMMO[t[1]] = [];
                else if (ARMOR_KINDS.includes(t[0])) { cur = []; db.ARMOR[t[1]] = { kind: t[0], tokens: cur }; } else cur = null;
                continue;
            }
            if (t[0] === type && db[type] && type !== 'ITEM') { cur = db[type][t[1]] = []; continue; }
            cur?.push(t);
        }
    }
    return db;
}

const startsWith = (tok, want) => want.every((w, i) => tok[i] === w);

function materialFrom(list, db, base = {}) {
    const m = { ...base };
    for (const t of list) {
        if (t[0] === 'USE_MATERIAL_TEMPLATE' && t.length === 2) Object.assign(m, materialTemplate(db, t[1]));
        if (MAT_KEYS.includes(t[0])) m[t[0]] = Number(t[1]);
        if (t[0] === 'STATE_NAME_ADJ' && t[1] === 'ALL_SOLID') m.name = t[2];
        if (t[0] === 'ITEMS_WEAPON') m.weapon = true;
    }
    return m;
}

export const materialTemplate = (db, id) => db.MATERIAL_TEMPLATE[id] ? materialFrom(db.MATERIAL_TEMPLATE[id], db) : null;

/** A metal (INORGANIC id or its name, e.g. IRON / "iron") with the properties combat reads. */
export function metal(db, text) {
    const key = String(text || '').trim().toUpperCase();
    const id = db.INORGANIC[key] ? key : Object.keys(db.INORGANIC).find(k => materialFrom(db.INORGANIC[k], db).name?.toUpperCase() === key);
    return id ? { id, ...materialFrom(db.INORGANIC[id], db) } : null;
}

// Material words → DF material template, for non-metal gear.
const TEMPLATE_WORDS = {
    leather: 'LEATHER_TEMPLATE', hide: 'LEATHER_TEMPLATE', silk: 'SILK_TEMPLATE', cloth: 'THREAD_PLANT_TEMPLATE', linen: 'THREAD_PLANT_TEMPLATE',
    cotton: 'THREAD_PLANT_TEMPLATE', hemp: 'THREAD_PLANT_TEMPLATE', wool: 'HAIR_TEMPLATE', yarn: 'HAIR_TEMPLATE', wood: 'WOOD_TEMPLATE',
    wooden: 'WOOD_TEMPLATE', bone: 'BONE_TEMPLATE', shell: 'SHELL_TEMPLATE', chitin: 'CHITIN_TEMPLATE',
};
const THREAD = ['SILK_TEMPLATE', 'THREAD_PLANT_TEMPLATE', 'HAIR_TEMPLATE'];
export const QUALITY = { ordinary: 1, 'well-crafted': 1.2, 'finely-crafted': 1.4, superior: 1.6, exceptional: 1.8, masterwork: 2, artifact: 3 };

/** A gear material by name: a metal ("iron", "steel") or a word in TEMPLATE_WORDS ("leather", "cloth"). */
export function gearMaterial(db, text) {
    const m = metal(db, text);
    if (m) return { ...m, kind: 'metal' };
    const tpl = TEMPLATE_WORDS[String(text || '').trim().toLowerCase()];
    return tpl ? { ...materialTemplate(db, tpl), name: String(text).trim().toLowerCase(), kind: THREAD.includes(tpl) ? 'thread' : 'other' } : null;
}

/** A worn item from text like "masterwork steel breastplate", "leather armor", "iron mail shirt"; null when no DF armor name ends the text. */
export function armor(db, text) {
    let words = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const q = Object.keys(QUALITY).find(k => words.startsWith(`${k} `));
    if (q) words = words.slice(q.length + 1);
    let best = null;
    for (const [id, { kind, tokens: list }] of Object.entries(db.ARMOR)) {
        const name = list.find(t => t[0] === 'NAME');
        for (const n of [name?.[1], name?.[2]].filter(Boolean)) {
            if ((words === n || words.endsWith(` ${n}`)) && (!best || n.length > best.n.length)) best = { id, kind, list, n };
        }
    }
    if (!best) return null;
    const matText = words.slice(0, words.length - best.n.length).trim() || (best.list.some(t => t[0] === 'METAL') ? 'iron' : 'leather');
    const mat = gearMaterial(db, matText);
    if (!mat) return null;
    const num = k => { const t = best.list.find(x => x[0] === k); return !t ? 0 : t[1] === 'MAX' ? Infinity : Number(t[1]); };
    const flag = k => best.list.some(t => t[0] === k);
    const elastic = flag('STRUCTURAL_ELASTICITY_CHAIN_ALL') || (flag('STRUCTURAL_ELASTICITY_CHAIN_METAL') && mat.kind === 'metal')
        || (flag('STRUCTURAL_ELASTICITY_WOVEN_THREAD') && mat.kind === 'thread');
    return {
        id: best.id, kind: best.kind, name: `${q ? `${q} ` : ''}${mat.name} ${best.n}`, quality: QUALITY[q] ?? 1,
        layer: best.list.find(t => t[0] === 'LAYER')?.[1] ?? 'ARMOR', coverage: num('COVERAGE') || 100,
        ubstep: num('UBSTEP'), lbstep: num('LBSTEP'), upstep: num('UPSTEP'), mat, elastic,
    };
}

/** Gear with no DF item name ("iron skullcap"): quality + material words + any name. Its coverage comes from the caller. */
export function customGear(db, text) {
    let words = String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const q = Object.keys(QUALITY).find(k => words.startsWith(`${k} `));
    if (q) words = words.slice(q.length + 1);
    const parts = words.split(' ');
    for (const n of [2, 1]) {
        const mat = parts.length > n ? gearMaterial(db, parts.slice(0, n).join(' ')) : null;
        if (mat) return { id: null, kind: null, name: `${q ? `${q} ` : ''}${words}`, quality: QUALITY[q] ?? 1, layer: mat.kind === 'metal' ? 'ARMOR' : 'OVER',
            coverage: 100, ubstep: 0, lbstep: 0, upstep: 0, mat, elastic: mat.kind === 'thread' };
    }
    return null;
}

/** A weapon (ITEM_WEAPON id or its name, e.g. "short sword"): size and attacks. */
export function weapon(db, text) {
    const key = String(text || '').trim().toLowerCase();
    for (const [id, list] of Object.entries(db.ITEM_WEAPON)) {
        const name = list.find(t => t[0] === 'NAME')?.[1];
        if (id.toLowerCase() !== key && name !== key && `item_weapon_${key.replace(/\s+/g, '_')}` !== id.toLowerCase()) continue;
        const attacks = list.filter(t => t[0] === 'ATTACK').map(t => ({
            edge: t[1] === 'EDGE', contact: Number(t[2]), penetration: Number(t[3]), verb: t[4], noun: t[6], velocity: Number(t[7] ?? 1000),
        }));
        const ranged = list.find(t => t[0] === 'RANGED');
        const num = k => Number(list.find(t => t[0] === k)?.[1]);
        return { id, name, size: num('SIZE'), skill: list.find(t => t[0] === 'SKILL')?.[1], attacks,
            ranged: ranged ? { ammoClass: ranged[2], force: num('SHOOT_FORCE'), maxvel: num('SHOOT_MAXVEL') } : null };
    }
    return null;
}

/** The DF ammunition item of a class (BOLT, ARROW, BLOWDART): size and attack. */
export function ammo(db, ammoClass) {
    for (const [id, list] of Object.entries(db.ITEM_AMMO)) {
        if (list.find(t => t[0] === 'CLASS')?.[1] !== ammoClass) continue;
        const at = list.find(t => t[0] === 'ATTACK');
        return { id, name: list.find(t => t[0] === 'NAME')?.[1], size: Number(list.find(t => t[0] === 'SIZE')?.[1]),
            attack: { edge: at[1] === 'EDGE', contact: Number(at[2]), penetration: Number(at[3]), verb: at[4] } };
    }
    return null;
}

function tissueFrom(list, base = {}) {
    const tis = { flags: [], ...structuredClone(base) };
    for (const t of list) applyTissueToken(tis, t);
    return tis;
}

function applyTissueToken(tis, t) {
    if (t[0] === 'TISSUE_MATERIAL') tis.material = t[1] === 'LOCAL_CREATURE_MAT' ? t[2] : t.slice(1).join(':');
    else if (TISSUE_NUM.includes(t[0])) tis[t[0]] = Number(t[1]);
    else if (TISSUE_FLAGS.includes(t[0]) && !tis.flags.includes(t[0])) tis.flags.push(t[0]);
    else return false;
    return true;
}

// ---- creature token list: COPY_TAGS_FROM, GO_TO_*, creature variations ----

const CURSOR = Symbol('cursor');

function substitute(tok, args) {
    const s = tok.join(':').replace(/!ARG(\d+)/g, (_, n) => args[Number(n) - 1] ?? '').replace(/\|/g, ':');
    return s.split(':');
}

/** Removes first (bottom-up), then conversions, then adds at the cursor (wiki: Creature variation token). */
function applyVariation(list, vtoks, args) {
    const removes = [], converts = [], adds = [];
    let conv = null;
    for (const raw of vtoks) {
        let t = substitute(raw, args);
        const cond = /^CV_(NEW|ADD|REMOVE|CONVERT)_CTAG$/.exec(t[0]);
        if (cond) {
            if (args[Number(t[1]) - 1] !== t[2]) continue;
            t = [`CV_${cond[1]}_TAG`, ...t.slice(3)];
        }
        if (t[0] === 'CV_NEW_TAG' || t[0] === 'CV_ADD_TAG') adds.push(t.slice(1));
        else if (t[0] === 'CV_REMOVE_TAG') removes.push(t.slice(1));
        else if (t[0] === 'CV_CONVERT_TAG') converts.push(conv = { master: [], target: '', replacement: '' });
        else if (conv && t[0] === 'CVCT_MASTER') conv.master = t.slice(1);
        else if (conv && t[0] === 'CVCT_TARGET') conv.target = t.slice(1).join(':');
        else if (conv && t[0] === 'CVCT_REPLACEMENT') conv.replacement = t.slice(1).join(':');
    }
    for (const r of removes.reverse()) {
        for (let i = list.length - 1; i >= 0; i--) if (list[i] !== CURSOR && startsWith(list[i], r)) list.splice(i, 1);
    }
    for (const c of converts.reverse()) {
        for (let i = 0; i < list.length; i++) {
            if (list[i] === CURSOR || !startsWith(list[i], c.master) || !c.target) continue;
            const s = list[i].join(':');
            if (s.includes(c.target)) list[i] = s.split(c.target).join(c.replacement).split(':').filter((x, j) => x !== '' || j > 0);
        }
    }
    const at = list.indexOf(CURSOR);
    list.splice(at, 0, ...adds);
}

export function expandCreature(db, id, depth = 0) {
    if (db.expanded[id]) return db.expanded[id];
    const src = db.CREATURE[id];
    if (!src || depth > 8) return null;
    const list = [CURSOR];
    const insert = toks => list.splice(list.indexOf(CURSOR), 0, ...toks);
    // where(list without the cursor) → index the cursor goes to
    const moveCursor = where => { list.splice(list.indexOf(CURSOR), 1); list.splice(where(list), 0, CURSOR); };
    let pending = [];
    for (const t of src) {
        const k = t[0];
        if (k === 'COPY_TAGS_FROM') insert(structuredClone(expandCreature(db, t[1], depth + 1) || []));
        else if (k === 'GO_TO_END') moveCursor(l => l.length);
        else if (k === 'GO_TO_START') moveCursor(() => 0);
        else if (k === 'GO_TO_TAG') moveCursor(l => { const j = l.findIndex(x => startsWith(x, t.slice(1))); return j < 0 ? l.length : j + 1; });
        else if (k.startsWith('CV_') || k.startsWith('CVCT_')) pending.push(t);
        else if (k === 'APPLY_CURRENT_CREATURE_VARIATION') { applyVariation(list, pending, []); pending = []; }
        else if (k === 'APPLY_CREATURE_VARIATION') { if (db.CREATURE_VARIATION[t[1]]) applyVariation(list, db.CREATURE_VARIATION[t[1]], t.slice(2)); }
        else insert([t]);
    }
    return (db.expanded[id] = list.filter(x => x !== CURSOR));
}

/** Tokens of the first declared caste (plus SELECT_CASTE:ALL and creature-level tokens). */
function casteTokens(list) {
    const first = list.find(t => t[0] === 'CASTE')?.[1];
    let on = true;
    const out = [];
    for (const t of list) {
        if (t[0] === 'CASTE') on = t[1] === first;
        else if (t[0] === 'SELECT_CASTE') on = t[1] === 'ALL' || t[1] === first;
        else if (t[0] === 'SELECT_ADDITIONAL_CASTE') on = on || t[1] === first;
        else if (on) out.push(t);
    }
    return out;
}

// ---- body ----

function bodyTemplates(db, ids) {
    const out = [];
    for (const id of ids) {
        let cur = null;
        for (const t of db.BODY[id] || []) {
            if (t[0] === 'BP') { cur = { token: t[1], name: t[2], flags: [], cats: [], relsize: 0, number: 1, names: null }; out.push(cur); continue; }
            if (!cur) continue;
            if (t[0] === 'CON') cur.con = t[1];
            else if (t[0] === 'CON_CAT') cur.conCat = t[1];
            else if (t[0] === 'CONTYPE') cur.conType = t[1];
            else if (t[0] === 'CATEGORY') cur.cats.push(t[1]);
            else if (t[0] === 'DEFAULT_RELSIZE') cur.relsize = Number(t[1]);
            else if (t[0] === 'NUMBER') cur.number = Number(t[1]);
            else if (t[0] === 'INDIVIDUAL_NAME') (cur.names ??= []).push(t[1]);
            else if (t.length === 1) cur.flags.push(t[0]);
        }
    }
    return out;
}

function buildParts(templates) {
    const parts = [];
    let pending = templates.slice();
    for (let pass = 0; pending.length && pass < 10; pass++) {
        const later = [];
        for (const tp of pending) {
            let parents = [null];
            if (tp.con) parents = parts.filter(p => p.token === tp.con);
            else if (tp.conCat) parents = parts.filter(p => p.cats.includes(tp.conCat));
            else if (tp.conType) parents = parts.filter(p => p.flags.includes(tp.conType));
            if (!parents.length) { later.push(tp); continue; }
            for (const parent of parents) {
                for (let n = 0; n < tp.number; n++) {
                    let name = tp.number > 1 ? (tp.names?.[n] ?? `${ORDINAL[n] ?? `#${n + 1}`} ${tp.name}`) : tp.name;
                    if (parents.length > 1) name = `${parent.name} ${name}`;
                    const id = `${tp.token}${tp.number > 1 ? n + 1 : ''}${parents.length > 1 ? `@${parent.id}` : ''}`;
                    parts.push({ id, token: tp.token, name, flags: [...tp.flags], cats: [...tp.cats], relsize: tp.relsize, parent: parent?.id ?? null, layers: [], around: [] });
                }
            }
        }
        if (later.length === pending.length) break;
        pending = later;
    }
    return parts;
}

export function select(parts, kind, value) {
    if (value === 'ALL') return parts;
    if (kind === 'BY_CATEGORY') return parts.filter(p => p.cats.includes(value));
    if (kind === 'BY_TYPE') return parts.filter(p => p.flags.includes(value));
    if (kind === 'BY_TOKEN') return parts.filter(p => p.token === value);
    return [];
}

/** A creature resolved for combat and wounds, or null. Cached per id. */
export function resolveCreature(db, id) {
    if (id in db.cache) return db.cache[id];
    const expanded = expandCreature(db, id);
    if (!expanded) return (db.cache[id] = null);
    const list = casteTokens(expanded);
    const bodyIds = list.filter(t => t[0] === 'BODY').flatMap(t => t.slice(1));
    const parts = buildParts(bodyTemplates(db, bodyIds));
    const materials = {}, tissues = {};
    const c = { id, name: id.toLowerCase(), size: 0, sizePerc: 100, strength: 1000, blood: false, flags: [], parts, materials, tissues, attacks: [] };
    let curTissue = null, curMat = null, tlSel = [], attack = null;

    const layerSel = (tissue, kind, value) => select(parts, kind, value).flatMap(p => p.layers.filter(l => l.tissue === tissue));
    const run = (t, args = []) => {
        if (args.length) t = t.map(x => /^ARG\d+$/.test(x) ? args[Number(x.slice(3)) - 1] : x);
        const k = t[0];
        if (curTissue && applyTissueToken(tissues[curTissue], t)) return;
        if (TISSUE_OTHER.includes(k) && curTissue) return;
        curTissue = null;
        if (curMat && MAT_KEYS.includes(k)) { materials[curMat][k] = Number(t[1]); return; }
        if (!MAT_KEYS.includes(k)) curMat = null;
        switch (k) {
            case 'ADD_MATERIAL': case 'USE_MATERIAL_TEMPLATE': materials[t[1]] = materialTemplate(db, t[2]) || {}; curMat = t[1]; break;
            case 'SELECT_MATERIAL': if (materials[t[1]]) curMat = t[1]; break;
            case 'REMOVE_MATERIAL': delete materials[t[1]]; break;
            case 'ADD_TISSUE': case 'USE_TISSUE_TEMPLATE': tissues[t[1]] = tissueFrom(db.TISSUE_TEMPLATE[t[2]] || []); curTissue = t[1]; break;
            case 'TISSUE': tissues[t[1]] ??= { flags: [] }; curTissue = t[1]; break;
            case 'SELECT_TISSUE': if (tissues[t[1]]) curTissue = t[1]; break;
            case 'REMOVE_TISSUE': delete tissues[t[1]]; break;
            case 'BODY_DETAIL_PLAN': for (const pt of db.BODY_DETAIL_PLAN[t[1]] || []) run(pt, t.slice(2)); break;
            case 'BP_LAYERS': {
                const targets = select(parts, t[1], t[2]);
                for (let i = 3; i + 1 < t.length; i += 2) {
                    if (t[i] === 'NONE' || !t[i]) continue;
                    for (const p of targets) p.layers.push({ tissue: t[i], thick: Number(t[i + 1]) });
                }
                break;
            }
            case 'BP_RELSIZE': case 'RELSIZE': for (const p of select(parts, t[1], t[2])) p.relsize = Number(t[3]); break;
            case 'BP_RELATION':
                if (t[3] === 'AROUND') {
                    const outer = select(parts, t[1], t[2]);
                    for (const p of select(parts, t[4], t[5])) for (const o of outer) p.around.push({ part: o.id, perc: Number(t[6] ?? 100) });
                }
                break;
            case 'TISSUE_LAYER': case 'TISSUE_LAYER_OVER': case 'TISSUE_LAYER_UNDER':
                for (const p of select(parts, t[1], t[2])) {
                    const layer = { tissue: t[3], thick: null };
                    if (k === 'TISSUE_LAYER_UNDER') p.layers.unshift(layer); else p.layers.push(layer);
                }
                break;
            case 'SELECT_TISSUE_LAYER': tlSel = layerSel(t[1], t[2], t[3]); break;
            case 'PLUS_TISSUE_LAYER': tlSel = tlSel.concat(layerSel(t[1], t[2], t[3])); break;
            case 'TL_MAJOR_ARTERIES': for (const l of tlSel) l.major = true; break;
            case 'TL_RELATIVE_THICKNESS': for (const l of tlSel) l.thick = Number(t[1]); break;
            case 'TL_HEALING_RATE': for (const l of tlSel) l.healing = Number(t[1]); break;
            case 'BODY_SIZE': c.size = Number(t[3]); break;
            case 'CHANGE_BODY_SIZE_PERC': c.sizePerc = c.sizePerc * Number(t[1]) / 100; break;
            case 'GRAVITATE_BODY_SIZE': c.gravitate = Number(t[1]); break;
            case 'PHYS_ATT_RANGE': if (t[1] === 'STRENGTH') c.strength = Number(t[5]); break;
            case 'BLOOD': c.blood = true; break;
            case 'HOMEOTHERM': c.homeotherm = Number(t[1]); break;
            case 'NAME': c.name = t[1]; break;
            case 'ATTACK': {
                const kind = t[2];
                attack = { id: t[1], kind, sel: t.slice(3, 5), child: kind === 'BODYPART' ? null : t.slice(5, 7), tissue: kind === 'CHILD_TISSUE_LAYER_GROUP' ? t[7] : null,
                    contactPerc: 100, penetrationPerc: 0, edge: false, velocity: 1000, verb: t[1].toLowerCase() };
                c.attacks.push(attack);
                break;
            }
            case 'ATTACK_CONTACT_PERC': if (attack) attack.contactPerc = Number(t[1]); break;
            case 'ATTACK_PENETRATION_PERC': if (attack) attack.penetrationPerc = Number(t[1]); break;
            case 'ATTACK_FLAG_EDGE': if (attack) attack.edge = true; break;
            case 'SPECIALATTACK_INJECT_EXTRACT': if (attack) attack.inject = true; break;
            case 'ATTACK_VELOCITY_MODIFIER': if (attack) attack.velocity = Number(t[1]); break;
            case 'ATTACK_VERB': if (attack) attack.verb = t[1]; break;
            case 'ATTACK_SKILL': if (attack) attack.skill = t[1]; break;
            default: if (t.length === 1 && !k.startsWith('ATTACK_')) c.flags.push(k);
        }
    };
    for (const t of list) if (t[0] !== 'BODY') run(t);
    for (const p of parts) {
        p.layers = p.layers.filter(l => tissues[l.tissue]);
        for (const l of p.layers) l.thick ??= tissues[l.tissue].RELATIVE_THICKNESS ?? 1;
    }
    if (c.gravitate) c.size = (c.size + c.gravitate) / 2;
    c.size = Math.round(c.size * c.sizePerc / 100);
    c.relTotal = parts.reduce((s, p) => s + p.relsize, 0);
    return (db.cache[id] = c);
}

/** Creature id from an id or a name ("wolf", "giant wolf", "HUMAN"); null when none matches. */
export function findCreature(db, text) {
    const key = String(text || '').trim();
    if (!key) return null;
    const up = key.toUpperCase().replace(/\s+/g, '_');
    if (db.CREATURE[up]) return up;
    const low = key.toLowerCase();
    return Object.keys(db.CREATURE).find(id => expandCreature(db, id)?.some(t => t[0] === 'NAME' && (t[1] === low || t[2] === low))) ?? null;
}
