// The words a face goes to the image model in (2026-11-19, section 112; the player's pick: words now, a face guide later). The
// anime models tuned on Danbooru's tagged images read its tags (Illustrious-XL, trained on them: Park et al. 2024, arXiv
// 2409.19946; the player has named no model of their own, and asked only how WAI-Illustrious, a tune of it, compares). Each action unit (expression-set.ts) takes the tag whose Danbooru wiki definition is
// that movement (danbooru.donmai.us wiki pages, read 2026-11-19; post counts then, a tag the model saw often being one it
// draws): brows by what moves together, 4 alone "v-shaped eyebrows" (slanted inwards; 274,663), 1 with 4 "furrowed brow"
// (inner tips bending up; 73,019), 1 with 2 "raised eyebrows" (45,890), 1 alone "raised inner eyebrows" (33,914); 5
// "wide-eyed" (55,745); 7 "narrowed eyes" (11,445); 41 and 45 "half-closed eyes" (150,001); 43 "closed eyes" (1,096,291); 12
// "smile" (4,311,596), at half strength "light smile" (113,240); 15 "frown" (158,575), at half "light frown" (25,862); 18
// "puckered lips" (7,552); 20 "wavy mouth" (104,378); 23 and 24 "pursed lips" (2,067); 25 "parted lips" (771,167); 26 "open
// mouth" (3,637,972); a mouth neither parted nor open "closed mouth" (2,057,656); 53 "head back" (7,197); 54 "head down"
// (3,943); 55 "head tilt" (177,104); 64 "looking down" (144,092). Danbooru has no tag for 6 (cheek raiser), 9 (nose wrinkler:
// "nose wrinkle", "wrinkled nose" and "scrunched nose" are no tags), 10 (upper lip raiser: "snarl" has no posts), 17 (chin
// raiser), 38 and 39 (the nostrils' moves: "flared nostrils" has no posts), so those units are dropped, the words' loss the
// player accepted until the face guide. Where two units' tags contradict, one shows [ASSUMED]: eyes closed over every other
// eye tag, the raised lid (5) over the tightened (7), a drooping lid over the tightened; an open mouth over parted and pursed
// lips, parted lips over pursed. A unit at half strength takes Danbooru's lighter tag where it has one, else its tag at the
// attention weight faceTagHalfWeight [ASSUMED].
import { def, k } from './constants.js';
// How strongly the face is redrawn from the card picture (index.ts lookPicture: ADetailer's denoising strength).
def({ id: 'lookFaceDenoise', value: 0.5, unit: 'denoising strength of the face redrawn for a look', status: 'assumed', src: 'above ADetailer\'s 0.4 default for mending a face, enough to change its expression and keep the person [ASSUMED]', range: [0.35, 0.7], file: 'face-words.ts' });
export const faceDenoise = () => k('lookFaceDenoise');
// The size the face is redrawn at: ADetailer otherwise redraws it at the picture's own size, and SillyTavern resizes a card
// picture to 512 × 768 (AVATAR_WIDTH, AVATAR_HEIGHT in its src/constants.js), under the size an SDXL model draws at.
def({ id: 'faceInpaintPx', value: 1024, unit: 'px, each side of the face redrawn for a look', status: 'sourced', src: 'SDXL\'s training size, 1024² pixels in buckets of several aspects (Podell et al. 2023, arXiv 2307.01952), which Illustrious-XL is tuned from', file: 'face-words.ts' });
export const facePx = () => k('faceInpaintPx');
// How many faces go to AI Horde at once (faces.ts, section 115).
def({ id: 'hordeAtOnce', value: 2, unit: 'faces sent to AI Horde at once', status: 'assumed', src: 'two requests were taken at once from the anonymous key on 2026-11-20 [ASSUMED: the Horde\'s limit for it unread]', range: [1, 4], file: 'face-words.ts' });
export const hordeAtOnce = () => k('hordeAtOnce');
def({ id: 'faceTagHalfWeight', value: 0.7, unit: 'prompt attention weight of a tag for a unit at half strength', status: 'assumed', src: 'a touched feeling\'s units drawn weaker than a central one\'s [ASSUMED]', range: [0.5, 0.9], file: 'face-words.ts' });
/** The units no Danbooru tag names. */
export const UNTAGGED = [6, 9, 10, 17, 38, 39];
/** A face's tags, strongest meaning first, and the units dropped (no tag, or contradicted by a stronger one). */
export function faceTags(face) {
    const on = (u) => (face[u] ?? 0) > 0, at = (u) => face[u] ?? 0, dropped = [];
    const tags = [];
    const tag = (t, s) => tags.push([t, s]);
    // Brows: by which move together.
    if (on(1) && on(4)) {
        tag('furrowed brow', Math.max(at(1), at(4)));
        if (on(2))
            tag('raised eyebrows', at(2));
    }
    else if (on(4))
        tag('v-shaped eyebrows', at(4));
    else if (on(1) && on(2))
        tag('raised eyebrows', Math.max(at(1), at(2)));
    else if (on(1))
        tag('raised inner eyebrows', at(1));
    else if (on(2))
        tag('raised eyebrows', at(2));
    // Eyes: closed over all, the raised lid over the tightened, a drooping lid over the tightened.
    if (on(43)) {
        tag('closed eyes', at(43));
        for (const u of [5, 7, 41, 45])
            if (on(u))
                dropped.push(u);
    }
    else if (on(5)) {
        tag('wide-eyed', at(5));
        for (const u of [7, 41, 45])
            if (on(u))
                dropped.push(u);
    }
    else if (on(41) || on(45)) {
        tag('half-closed eyes', Math.max(at(41), at(45)));
        if (on(7))
            dropped.push(7);
    }
    else if (on(7)) {
        tag('narrowed eyes', at(7));
    }
    // Mouth: corners, then lips, then how far open.
    if (on(12))
        tag(at(12) < 1 ? 'light smile' : 'smile', 1);
    if (on(15))
        tag(at(15) < 1 ? 'light frown' : 'frown', 1);
    if (on(18))
        tag('puckered lips', at(18));
    if (on(20))
        tag('wavy mouth', at(20));
    // An open mouth holds parted lips (25 shown by it, not lost); pursed lips it contradicts.
    if (on(26)) {
        tag('open mouth', at(26));
        for (const u of [23, 24])
            if (on(u))
                dropped.push(u);
    }
    else if (on(25)) {
        tag('parted lips', at(25));
        for (const u of [23, 24])
            if (on(u))
                dropped.push(u);
    }
    else {
        if (on(23) || on(24))
            tag('pursed lips', Math.max(at(23), at(24)));
        tag('closed mouth', 1);
    }
    // Head and gaze.
    if (on(53))
        tag('head back', at(53));
    if (on(54))
        tag('head down', at(54));
    if (on(55))
        tag('head tilt', at(55));
    if (on(64))
        tag('looking down', at(64));
    for (const u of UNTAGGED)
        if (on(u))
            dropped.push(u);
    const w = k('faceTagHalfWeight');
    return { tags: tags.map(([t, s]) => s >= 1 ? t : `(${t}:${w})`), dropped: [...new Set(dropped)].sort((a, b) => a - b) };
}
/** A look's sprite label: its moving units, "h" for half strength, joined by underscores ("look_12h_25h"; calm's
 *  "look_calm"); SillyTavern reads a sprite's label up to its first "-" or ".", so the label holds neither. */
export function lookLabel(face) {
    const us = Object.keys(face).map(Number).filter(u => (face[u] ?? 0) > 0).sort((a, b) => a - b);
    return us.length ? `look_${us.map(u => `${u}${face[u] < 1 ? 'h' : ''}`).join('_')}` : 'look_calm';
}
// A portrait for one the engine made, who has no card (2026-11-20, section 113; the player's pick: one drawn from their record,
// then their faces from it as from a card). Only what the record holds, in Danbooru's tags (post counts read 2026-11-20): one
// person, "1girl" (8,678,934) or "1boy" (2,209,944) by sex, else "solo" (7,279,314); by age, "child" (83,462) under 13,
// "mature female" or "mature male" (51,778; 46,419) from 35, "old woman" or "old man" (3,840; 15,488) from 60 [ASSUMED bands];
// by build, "skinny" (12,219) at portraitBuildZ or more below the middle of their sex in their country and year (bmiZ), "plump"
// (45,640) at as much above; "victorian" (1,523) in a story year from 1837 to 1901 (no tag after it holds many posts:
// "edwardian" 42); their trade as the story named it; framed for the box, "portrait" (150,888), "upper body" (1,242,749),
// "looking at viewer" (5,097,128), "simple background" (3,005,297) [ASSUMED]. Where they grew up is left out, since it does
// not tell how a person looks; hair, eyes and dress the record does not hold.
def({ id: 'portraitBuildZ', value: 1.5, unit: 'z of BMI among their sex at which a portrait says skinny or plump', status: 'assumed', src: 'a build far enough from the middle to be seen [ASSUMED]', range: [1, 2], file: 'face-words.ts' });
/** The tags of a portrait of one with no card, from their record and the story's year, and their hair and eyes where drawn
 *  (colouring.ts, section 114). */
export function portraitTags(p, year, colour) {
    const f = p.sex === 'female', m = p.sex === 'male', age = p.age, z = p.bmiZ, w = k('portraitBuildZ');
    return [f ? '1girl' : m ? '1boy' : 'solo',
        ...age == null ? [] : age < 13 ? ['child'] : age >= 60 ? [f ? 'old woman' : m ? 'old man' : ''] : age >= 35 ? [f ? 'mature female' : m ? 'mature male' : ''] : [],
        ...z == null ? [] : z <= -w ? ['skinny'] : z >= w ? ['plump'] : [],
        ...year != null && year >= 1837 && year <= 1901 ? ['victorian'] : [],
        ...colour ? [colour.hairTag ?? '', colour.eyeTag] : [],
        ...p.occupation ? [p.occupation.toLowerCase()] : [],
        'portrait', 'upper body', 'looking at viewer', 'simple background'].filter(Boolean);
}
