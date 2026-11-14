// Builds src/rules/data/framenet.ts from FrameNet 1.7 (Berkeley; nltk_data packages/corpora/framenet_v17.zip, unzipped):
// each lexical unit (lemma.pos) of the frames the tools decide, with its frames, and each such frame's elements (its
// participants), each with its standing (Core, Peripheral, Extra-Thematic). FrameNet 1.7 is licensed under a Creative Commons
// Attribution-Only license, which asks users to cite FrameNet (https://framenet.icsi.berkeley.edu) and a current
// publication (Fillmore & Baker 2010, "A Frame Semantic Approach to Linguistic Analysis", in Heine & Narrog (eds.), Oxford
// Handbook of Linguistic Analysis).
// Usage: node tools/build-framenet.mjs <path to framenet_v17>
import fs from 'node:fs';
const dir = process.argv[2];
// The frames verbs.ts routes (FRAME_ROUTES); a frame added there is added here.
const FRAMES = ['Perception_active', 'Perception_experience', 'Punctual_perception', 'Becoming_aware', 'Scrutiny', 'Seeking', 'Bringing', 'Manipulation', 'Cotheme',
    'Fleeing', 'Evading', 'Prevarication', 'Manipulate_into_doing', 'Suasion', 'Attempt_suasion', 'Forming_relationships', 'Personal_relationship', 'Conquering',
    'Attack', 'Besieging', 'Invading', 'Hostile_encounter', 'Killing', 'Cause_harm', 'Hit_target', 'Use_firearm', 'Shoot_projectiles', 'Cure', 'Rescuing', 'Self_motion'];
const index = fs.readFileSync(`${dir}/luIndex.xml`, 'utf8');
const lus = {};
for (const m of index.matchAll(/<lu [^>]*frameName="([^"]+)"[^>]*name="([^"]+)"/g)) {
    const [, frame, name] = m;
    if (!FRAMES.includes(frame)) continue;
    // Self_motion: only its climbing verbs (climb, clamber, scramble, shin), which BodyCheck decides; the rest are walking.
    if (frame === 'Self_motion' && !/^(climb|clamber|scramble|shin|scale)\.v$/.test(name)) continue;
    (lus[name] ??= []).includes(frame) || lus[name].push(frame);
}
const fes = {};
for (const f of FRAMES) {
    const x = fs.readFileSync(`${dir}/frame/${f}.xml`, 'utf8');
    fes[f] = Object.fromEntries([...x.matchAll(/<FE [^>]*coreType="([^"]+)"[^>]*name="([^"]+)"/g)].map(m => [m[2], m[1]]));
}
const keys = Object.keys(lus).sort();
fs.writeFileSync(new URL('../src/rules/data/framenet.ts', import.meta.url), `// FrameNet 1.7 lexical units of the frames the tools decide, with their frames, and each frame's elements; built by
// tools/build-framenet.mjs (${keys.length} lexical units, ${FRAMES.length} frames). Source: FrameNet Release 1.7, International Computer
// Science Institute, Berkeley (https://framenet.icsi.berkeley.edu), Creative Commons Attribution-Only licence; Fillmore &
// Baker 2010, "A Frame Semantic Approach to Linguistic Analysis", Oxford Handbook of Linguistic Analysis.
export const FRAMENET: Record<string, string[]> = ${JSON.stringify(Object.fromEntries(keys.map(k => [k, lus[k]])))};
export const FRAME_FES: Record<string, Record<string, string>> = ${JSON.stringify(fes)};
`);
console.log(`${keys.length} lexical units in ${FRAMES.length} frames`);
