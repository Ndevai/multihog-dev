// Loads the DF raws once (browser fetch, or files passed in by Node) and hands out resolved creatures.
import { RAW_FILES, indexRaws, resolveCreature, findCreature, weapon, metal, armor, customGear, gearMaterial, ammo } from './raws.js';
let db = null;
let loading = null;
export function useRaws(files) {
    db = indexRaws(files);
}
export function loadRaws() {
    if (db)
        return Promise.resolve(db);
    loading ??= (async () => {
        const base = new URL('../../../rules/df/raw/', import.meta.url);
        const texts = await Promise.all(RAW_FILES.map(f => fetch(new URL(f, base)).then(r => r.text())));
        useRaws(Object.fromEntries(RAW_FILES.map((f, i) => [f, texts[i]])));
        return db;
    })();
    return loading;
}
/** Melee weapon names and launcher names from the DF raws; metals that weapons are made of. Empty before the raws load. */
export const meleeWeaponNames = () => db ? Object.keys(db.ITEM_WEAPON).map(id => weapon(db, id)).filter(w => w && !w.ranged).map(w => w.name).filter(Boolean) : [];
export const weaponMetalNames = () => db ? Object.keys(db.INORGANIC).map(id => metal(db, id)).filter(m => m?.weapon && m.name).map(m => m.name) : [];
export const creature = (id) => db && id ? resolveCreature(db, id) : null;
export const creatureId = (text) => db ? findCreature(db, text) : null;
export const weaponOf = (text) => db ? weapon(db, text) : null;
export const metalOf = (text) => db ? metal(db, text) : null;
export const armorOf = (text) => db ? armor(db, text) : null;
export const customGearOf = (text) => db ? customGear(db, text) : null;
export const gearMaterialOf = (text) => db ? gearMaterial(db, text) : null;
export const ammoOf = (cls) => db ? ammo(db, cls) : null;
