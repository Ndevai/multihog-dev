// Loads the DF raws once (browser fetch, or files passed in by Node) and hands out resolved creatures.
import { RAW_FILES, indexRaws, resolveCreature, findCreature, weapon, metal, armor, customGear, gearMaterial, ammo } from './raws.js';
import type { RawDb } from './raws.js';

let db: RawDb | null = null;
let loading: Promise<RawDb> | null = null;

export function useRaws(files: Record<string, string>) {
    db = indexRaws(files);
}

export function loadRaws(): Promise<RawDb> {
    if (db) return Promise.resolve(db);
    loading ??= (async () => {
        const base = new URL('../../../rules/df/raw/', import.meta.url);
        const texts = await Promise.all(RAW_FILES.map(f => fetch(new URL(f, base)).then(r => r.text())));
        useRaws(Object.fromEntries(RAW_FILES.map((f, i) => [f, texts[i]])));
        return db!;
    })();
    return loading;
}

export const creature = (id: string | null | undefined) => db && id ? resolveCreature(db, id) : null;
export const creatureId = (text: string | null | undefined) => db ? findCreature(db, text) : null;
export const weaponOf = (text: string | null | undefined) => db ? weapon(db, text) : null;
export const metalOf = (text: string | null | undefined) => db ? metal(db, text) : null;
export const armorOf = (text: string | null | undefined) => db ? armor(db, text) : null;
export const customGearOf = (text: string | null | undefined) => db ? customGear(db, text) : null;
export const gearMaterialOf = (text: string | null | undefined) => db ? gearMaterial(db, text) : null;
export const ammoOf = (cls: string) => db ? ammo(db, cls) : null;
