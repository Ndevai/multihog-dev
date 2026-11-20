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
    /** Pulse Hemorrhage severity (0–1) fixed when Pulse first ran the wound. */
    pulseSev?: number;
}

/** Magic network of rule 576: capacity C, nodes N, reserve R, efficiency P, today's flow F and exercise E. */
export interface Net { C: number; N: number; R: number; P: number; F: number; E: number; width: number; maxToday: boolean }

export interface Needs {
    waterL: number; kcal: number; awake: number; slept: number; waterDeath: number | null; foodDeath: number | null;
    work?: number; alcohol?: number; debt?: number;
    /** Minutes of work since the last break of 15 min or more, the current break's length, and minutes worked since the last sleep. */
    onTask?: number; restRun?: number; duty?: number;
    /** Energy eaten beyond the day's need, kcal (body-engine.ts settleMass). */
    surplus?: number;
    /** Alcohol drunk and not yet absorbed, as the blood alcohol it will add (%), and minutes since the last meal. */
    gut?: number; sinceMeal?: number;
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
    /** The world-book kind this person truly is, kept hidden (tells.ts; TrueNature); it shows only through its tells. */
    truly?: string;
    /** Body switches of their kind, as Dwarf Fortress creature tokens (NOBREATHE, NO_SLEEP, NO_EAT, NO_DRINK, NOPAIN, NOFEAR)
     * and NO_HEAT (no warmth of its own); body-engine.ts `has` reads them with the creature's own (tells.ts BODY). */
    bodyFlags?: string[];
    /** Dwarf Fortress attributes of their kind (kind-sheet.ts KindSheet), a human's median 1000; strength scales grip. */
    attrs?: Record<string, number>;
    /** Named spot the character is at (actions.ts), e.g. "John's house: living room". */
    at?: string;
    /** Sitting or standing, as the last Act left them (actions.ts). */
    posture?: 'sitting' | 'standing' | 'lying';
    /** Height above the ground the character stands at, m, when a climb set it: the top of a wall climbed, 0 at its foot after a
     *  failed climb. Cleared by a walk or a fall (rules-tools.ts BodyCheck, BodyFall, Act). */
    raised_m?: number;
    /** Standing height, cm, as BodySize drew it (sizes.ts scales a person's seen breadth by it). */
    heightCm?: number;
    /** The room whose air this person last breathed (rooms.ts). */
    airFrom?: string | null;
    species: string; mass: number; lost: number; red: number; wounds: Wound[]; nextId: number;
    dead: string | null; deathIn: number | null; deathMode?: 'bleeding' | 'stopped'; minute: number; net: Net;
    age?: number; sex?: string; region?: string | null; body?: BodyTiming;
    /** The country the character comes from, when the story gives one other than the scene's (swimming, trust games). */
    country?: string;
    /** Whether a room's fire set the character's air temperature at the last minute (rooms.ts feelHeat). */
    fireHeat?: boolean;
    unconscious?: string | null; apnea?: number | null; drowning?: boolean; paralysed?: boolean; exhausted?: boolean;
    needs?: Needs; env?: Env | null; thermal?: ThermalState; weather?: string | null; workMet?: number | null;
    /** Pulse: minute-by-minute flow and vital signs prepared for the coming PassTime, and wounds already applied to its engine. */
    pulse?: { track: { rate: number; hr: number; map: number; sys: number; dia: number; rr: number; spo2: number; dies?: boolean }[]; at: number; table?: boolean } | null; pulseWounds?: number[];
    /** A bleed run from the precomputed Pulse tables: its wounds, limb, severity and the minute reached. */
    pulseTab?: { ids: string; limb: 'Leg' | 'Arm' | 'Aorta' | 'Muscle'; sev: number; minute: number } | null;
    /** Vital signs at the end of the last Pulse minute. */
    pulseLast?: { hr: number; map: number; sys: number; dia: number; rr: number; spo2: number } | null;
    altitude?: Altitude | null; acclim?: number; baseAlt?: number | null;
    co?: { hb: number; o2: 'air' | 'oxygen' | 'hyperbaric' } | null; venom?: VenomCourse | null;
    sepsis?: Course | null; peritonitis?: Course | null;
    burnDeath?: { p: number; fatal: boolean; min: number; deathMin: number | null }; burnO?: number[]; burnt?: Record<string, BurnDepth>; inhalation?: boolean;
    heatStroke?: { min: number; exertional: boolean; fatal?: boolean; deathMin?: number } | null;
    swimFailed?: boolean; canSwim?: boolean; underS?: number; breathHold?: number | null;
    fitZ?: number; gripZ?: number; runZ?: number; jumpZ?: number; liftZ?: number;
    /** Minutes left of a knockout or a choke (body-engine.ts advance); minutes since waking from a knockout (concussion). */
    koLeft?: number; concussedMin?: number;
    /** Story minute on the local clock, set by each rule call and moved with the body's minutes (body clock for alertness). */
    clockMin?: number;
    /** General reasoning ability, a z-score among people, drawn once (WorkOut). */
    gZ?: number;
    /** The light the eyes were last at (lux) and the story minute they left it (vision.ts adaptedLux). */
    eye?: { lux: number; t: number };
    /** Feelings still running (Appraise): the OCC type, what it is about, minutes left. */
    /** Appraised feelings still running: the OCC type, what it is about, minutes left, and the turn it was recorded in (the
     *  number of the player's lines then; the music's newest feeling, music.ts sceneTarget). */
    feelings?: { type: string; about?: string; left: number; turn?: number; strength?: number; state?: string }[];
    /** Where the person's BMI sits among their sex in their country and year (BodySize, or a build the story states). */
    bmiZ?: number;
    /** Their usual day (days.ts): the minute of the day they rise, how long they sleep, and their hours of work if they work;
     *  drawn by NewCharacter where the time and place have it (England and Wales, 1841–1921). */
    day?: { rise: number; sleep: number; work?: { start: number; end: number }; shift?: number };
    /** For one truly of a kind that lives on flesh or blood (hunger.ts): minutes between feedings, the next one due (story
     *  minute), the diet, and how many feedings so far. Set by TrueNature where the story has a clock. */
    hunger?: { every: number; next: number; food: 'flesh' | 'blood'; prey: 'K' | 'S' | 'R' | 'O'; fed?: number };
    /** What the person wants toward another of the story (seed.ts want; meetings.ts): the want's words, whom it is toward,
     *  whether it is kept secret, and how many times they have acted on it while the player's character was away. */
    want?: { text: string; toward: string; secret: boolean; met?: number };
    /** The household the person lives in (seed.ts: under the player's roof), for how often its people meet. */
    home?: string;
    /** The activity under way, as BodyEnvironment named it (mood.ts). */
    doing?: string;
    /** Working-memory span, chunks (knowledge.ts heldOfMessage), drawn once. */
    span?: number;
    /** How quick the person's speech is against their language, sex and age, a z-score drawn once when BodySize first places
     *  them (voice-body.ts voiceOf), from a random stream of its own so no other draw moves. */
    rateZ?: number;
    /** The folds' habitual stretch and the tract's size against the person's sex (voice-sound.ts), z-scores drawn once when
     *  BodySize first places them, each from a random stream of its own. */
    stretchZ?: number;
    tractZ?: number;
    /** The person's speaking habits against people of their sex (pocket.ts HABITS): melody range, time in pauses, breathiness;
     *  standard normal draws, made once (BodySize), or drawn from the chat's salt and the name where never made. */
    spanZ?: number;
    pauseZ?: number;
    breathZ?: number;
    /** The timing of the person's growth against their sex (growth.ts: the centre of their growth spurt), a z-score drawn once
     *  when BodySize first places them, from a stream of its own. */
    timingZ?: number;
    /** The trade the story or NewCharacter gave the person, as named (the first-meeting card shows it). */
    occupation?: string;
    /** Their family as the story fixes it (section 120; NewCharacter mother, father, sibling_of): their mother and father by
     *  name, where they are among the story's people, and the family they share with their brothers and sisters (a key: the
     *  name of the first of them recorded), whose parents the story may never show. Their genes come from these (colouring.ts). */
    kin?: { mother?: string; father?: string; family?: string };
    /** Body stores spent by the food deficit (body-engine.ts settleMass): mass before the deficit, fat and glycogen left, the
     * deficit already taken from them (kcal). */
    stores?: { mass0: number; fatKg: number; glycogenG: number; applied: number; lethalBmi?: number };
    /** Languages the character knows, lower case; absent when the story has not stated them. */
    languages?: string[];
    /** How the character produces voice: absent = normal; 'whisper' = no vocal-fold vibration. */
    voice?: 'whisper';
    /** The last speech this character heard: from whom, at what speech-to-noise ratio (dB). */
    heard?: { from: string; snr: number; whisper?: boolean };
}

/** A fixed fact of the story and who knows it; `from` maps a normalized knower name to how they learned it. */
export interface Fact { id: number; text: string; imp?: number; knowers: string[]; everyone: boolean; seq?: number; from?: Record<string, string>; secret?: boolean; at?: Record<string, number>; times?: Record<string, number[]>; ageAt?: Record<string, number>; kind?: 'event' | 'knowledge';
    /** How the world stands to it (knowledge.ts): absent, the world's own (it happened as written); 'said', what someone said,
     * which the world holds where a fact of its own says the same; 'version', a memory or a saying the world holds otherwise. */
    standing?: 'said' | 'version';
    /** For a version: the id of the world's fact it stands in for in its holders' memory. */
    versionOf?: number;
    /** The spots (Person.at) where each knower met it, by knower, for the place's cue (knowledge.ts recallStrength). */
    where?: Record<string, string[]> }

/** Rules-engine state of one chat (chatMetadata.rulesEngine.state). */
export interface RuleState {
    people?: Record<string, Person>;
    /** How often each look state (expression-set.ts jointKey: a feeling's appraisal or calm, with the body's state) was on a
     *  character as a reply came in this chat. */
    faced?: Record<string, number>;
    facts?: Fact[]; factSeq?: number;
    /** Trust between two characters after a betrayal, by "truster→betrayer" (social.ts trustAgain). */
    trust?: Record<string, { lied: boolean; repair: string; kept: number }>;
    /** Who has looked at whom (Look with target_who): when, story minutes, and whether the face was made out; for lineups. */
    sightings?: Record<string, Record<string, { t: number | null; identified: boolean; stressed?: boolean; weapon?: boolean }>>;
    /** The last small favour asked of each person (SocialResponse), for a bigger one later: agreed, story minutes, who asked. */
    favours?: Record<string, { agreed: boolean; t: number | null; by: string | null }>;
    /** Listener|speaker pairs who have talked (Communicate): a baseline for judging lies. */
    acquainted?: Record<string, boolean>;
    /** Story clock: the time set with /rules-time (minutes, clock.ts) and the minutes PassTime has run since. */
    clock?: { t: number; add: number; sec?: number };
    /** Distances between named spots, metres, keyed 'a|b' with a < b (actions.ts); recorded once, reused after. */
    links?: Record<string, number>;
    /** Air of rooms by spot name (rooms.ts). */
    rooms?: Record<string, import('./rooms.js').Room>;
    /** Positions of spots and outlines of rooms (map.ts). */
    map?: import('./map.js').MapState;
    /** Open doorways between rooms (rooms.ts). */
    openings?: import('./rooms.js').Opening[];
    latitude?: number;
    /** Big Five place of each character, z-scores by trait (acts.ts), drawn once when first needed. */
    traits?: Record<string, Record<string, number>>;
    longitude?: number;
    /** What the scene has fixed for every tool: the last place given (a weather place key), its label and country. */
    setting?: { place?: string; label?: string; country?: string | null };
    /** The town the player's character lives in (town.ts): its people, what the living find of the kind's work a year per
     *  100,000 (society.ts seenPer100k), what is found (a body drained of blood, one with its flesh gone, one dead of no cause
     *  anyone can name, or a grave opened), the next kill (story minute), the kills waiting to be found the same morning, and
     *  how many so far. */
    town?: { people: number; seen: number; how: 'blood' | 'flesh' | 'unknown' | 'grave'; next?: number; found?: { at: number; n: number }; killed?: number };
    /** Groups of words that stand for one thing (memory-meaning.ts): a changed detail comes out as another of its group. The
     *  seed sets the names people use for the kind; a story can add its own. */
    alike?: string[][];
    /** News still on its way (hunger.ts, retell.ts): `who` hears the world's fact `of` at story minute `at`, through `chain`
     *  tellers; an item with no `who` (kept by chats saved before section 98) becomes common knowledge then. */
    pending?: { at: number; text: string; who?: string; of?: number; chain?: number }[];
    /** The seed the story started from (seed.ts), when it did. */
    seed?: string;
    /** What each character carries, by holder name (possessions.ts). */
    items?: Record<string, { item: string; qty: number; owner?: string }[]>;
    /** Holders who give only what is on record: player characters after a Claim about what they have. */
    accounted?: string[];
}
