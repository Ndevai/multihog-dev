// Types shared across the rules engine: the per-character body state the engine keeps in chat metadata.
import type { Part } from './df/raws.js';

/** A random number source returning values in [0, 1): Math.random or a seeded generator. */
export type Rng = () => number;
/** A standard normal draw. */
export type Gauss = () => number;

export type WoundType = 'cut' | 'puncture' | 'bite' | 'blunt' | 'fracture' | 'severed' | 'burn' | 'frostbite';
export type BurnDepth = 'superficial' | 'partial' | 'deep_partial' | 'full';
export type Vessel = 'femoral' | 'limb_artery' | 'small';

/** What addWound needs to record a wound on a DF part. */
export interface WoundSpec {
    part: Part; type: WoundType; depth?: BurnDepth; vessel?: Vessel; functionLost?: boolean; permanent?: boolean;
    healFactor?: number; fracture?: 'spiral' | 'transverse'; openGrade?: string; open?: boolean;
}
export interface Fracture { kind: string | null; joins: number | null; full: number | null; crooked: boolean; never: boolean }
export interface Wound {
    id: number; part: string; pid: string; type: WoundType; bleed: number; age: number; cleanedAt: number | null;
    infection: boolean | null; splinted: boolean; heals: number | null; healed: boolean;
    depth?: BurnDepth | null; vessel?: Vessel; clotIn?: number | null; functionLost?: boolean; permanent?: boolean; severed?: boolean;
    fracture?: Fracture; openGrade?: string; open?: boolean;
}

/** Magic network of rule 576: capacity C, nodes N, reserve R, efficiency P, today's flow F and exercise E. */
export interface Net { C: number; N: number; R: number; P: number; F: number; E: number; width: number; maxToday: boolean }

export interface Needs {
    waterL: number; kcal: number; awake: number; slept: number; waterDeath: number | null; foodDeath: number | null;
    work?: number; alcohol?: number;
}

/** Immersion: water temperature, speed, which of the 17 JOS-3 segments are under, and how the person is in it. */
export interface WaterState {
    tc: number; speed: number; segs: boolean[]; suit: boolean; swimming: boolean; afloat: boolean; deep: boolean;
    swimMin?: number; swimLimit?: number;
}
/** The air a person is in, as set by setEnvironment. clo is local clo per JOS-3 segment. */
export interface Env {
    tdb: number; tr: number; rh: number; v: number; wind10: number; clo: number[]; met?: number | null; posture?: 'standing' | 'sitting' | 'lying' | null;
    co: number; smoke: boolean; faceBare: boolean; handsBare: boolean; water: WaterState | null;
}
/** Thermal state: JOS-3 node temperatures (humans) or the endotherm core (other warm-blooded creatures). */
export interface ThermalState {
    params?: { height: number; weight: number; age: number; sex: string };
    t?: number[] | null; freezeC?: number | null; frozen?: string[]; bareDose?: number; bareQ?: number | null;
    core?: number; skinMin?: number; coldest?: string; stageCore?: number; set?: number;
}
export interface Altitude {
    m: number; sudden: boolean; decompression: boolean; min: number; ams: boolean | null; oedema: boolean | null;
    hace?: boolean; hape?: boolean; acc0?: number; amsEnd?: number; hapeAt?: number | null; haceDeath?: number; hapeDeath?: number;
    tuc?: number | null;
}
/** A course that may end in death at deathMin minutes: sepsis, peritonitis. */
export interface Course { fatal: boolean; min: number; deathMin: number; treated?: boolean; repaired?: boolean }
export interface VenomSymptom { kind: string; sev?: number; start: number; peak: number; end: number }
export interface VenomCourse {
    species: string; kind: 'hemo' | 'neuro' | 'pain' | 'df'; fatal: boolean; min: number;
    mg?: number; ratio?: number; collapse?: number | null; shock?: number | null; death?: number | null;
    symptoms?: VenomSymptom[]; part?: string;
}
/** Per-person overrides for reaction timing (BodyStrike defence). */
export interface BodyTiming { nerve_mps?: number; limb_m?: number; sense_s?: Record<string, number>; decide_s?: number }

/** One character's body as the engine keeps it. */
export interface Person {
    species: string; mass: number; lost: number; red: number; wounds: Wound[]; nextId: number;
    dead: string | null; deathIn: number | null; deathMode?: 'bleeding' | 'stopped'; minute: number; net: Net;
    age?: number; sex?: string; region?: string | null; body?: BodyTiming;
    unconscious?: string | null; apnea?: number | null; drowning?: boolean; paralysed?: boolean; exhausted?: boolean;
    needs?: Needs; env?: Env | null; thermal?: ThermalState; weather?: string | null; workMet?: number | null;
    altitude?: Altitude | null; acclim?: number; baseAlt?: number | null;
    co?: { hb: number; o2: 'air' | 'oxygen' | 'hyperbaric' } | null; venom?: VenomCourse | null;
    sepsis?: Course | null; peritonitis?: Course | null;
    burnDeath?: { p: number; fatal: boolean; min: number; deathMin: number | null }; burnO?: number[]; burnt?: Record<string, BurnDepth>; inhalation?: boolean;
    heatStroke?: { min: number; exertional: boolean; fatal?: boolean; deathMin?: number } | null;
    swimFailed?: boolean; canSwim?: boolean; underS?: number; breathHold?: number | null;
    fitZ?: number; gripZ?: number; runZ?: number;
    /** Languages the character knows, lower case; absent when the story has not stated them. */
    languages?: string[];
}

/** A fixed fact of the story and who knows it; `from` maps a normalized knower name to how they learned it. */
export interface Fact { id: number; text: string; knowers: string[]; everyone: boolean; seq?: number; from?: Record<string, string> }

/** Rules-engine state of one chat (chatMetadata.rulesEngine.state). */
export interface RuleState {
    people?: Record<string, Person>;
    facts?: Fact[]; factSeq?: number;
    /** Story clock: the time set with /rules-time (minutes, clock.ts) and the minutes PassTime has run since. */
    clock?: { t: number; add: number };
    latitude?: number;
    /** What the scene has fixed for every tool: the last place given (a weather place key), its label and country. */
    setting?: { place?: string; label?: string; country?: string | null };
    /** What each character carries, by holder name (possessions.ts). */
    items?: Record<string, { item: string; qty: number }[]>;
    /** Holders who give only what is on record: player characters after a Claim about what they have. */
    accounted?: string[];
}
