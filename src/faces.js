// The looks' pictures (2026-11-19, section 112; rules/face-words.ts): each look of the set made once for a character from their
// card picture (the player's pick: the avatar kept and only the face changed), through the image source the player set in
// SillyTavern's Image Generation (extension_settings.sd.source). Forge or AUTOMATIC1111 ('auto'; SD.Next 'vlad'): img2img of
// the avatar with ADetailer redrawing the face alone, at faceInpaintPx a side (its skip_img2img cuts the main pass to one step,
// here at denoising 0, so the rest of the picture stays; ADetailer's face_yolov8n.pt finds the face, the largest one taken),
// sent straight or through SillyTavern's CORS proxy (config.yaml enableCorsProxy: true). ComfyUI: the player's own workflow,
// when it takes the character's picture (%char_avatar%), for the chat's own character. Any other source cannot keep the card
// picture. The face as words (face-words.ts) after the prompts the Image Generation keeps (its common prefix, the character's
// own); one seed per character. Each saved as a sprite of the character (/api/sprites/upload), labelled by its face
// (lookLabel); the box shows the one for the person's look now.
import { faceTags, lookLabel, faceDenoise, facePx, hordeAtOnce } from './rules/face-words.js';
const canvasOf = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const dataOf = (cv, type) => cv.toDataURL(type).split(',')[1] ?? '';
/** The browser's canvas. */
export const browserPainter = {
    async sourceAndMask(pic, width, height, box) {
        const bmp = await createImageBitmap(pic), cv = canvasOf(width, height), mk = canvasOf(width, height);
        cv.getContext('2d').drawImage(bmp, 0, 0, width, height);
        const m = mk.getContext('2d');
        m.fillStyle = '#000';
        m.fillRect(0, 0, width, height);
        m.fillStyle = '#fff';
        m.beginPath();
        m.ellipse((box.x + box.w / 2) * width, (box.y + box.h / 2) * height, box.w / 2 * width, box.h / 2 * height, 0, 0, Math.PI * 2);
        m.fill();
        return { image: dataOf(cv, 'image/webp'), mask: dataOf(mk, 'image/webp') };
    },
    async png(pic) {
        const bmp = await createImageBitmap(pic), cv = canvasOf(bmp.width, bmp.height);
        cv.getContext('2d').drawImage(bmp, 0, 0);
        return await new Promise((ok, no) => cv.toBlob(b => b ? ok(b) : no(new Error('no png')), 'image/png'));
    },
};
const sdOf = (c) => (c.extensionSettings?.sd ?? {});
/** Two prompts joined as SillyTavern's Image Generation joins them (its combinePrefixes): the second put where the first holds
 *  `macro`, else after it, with a comma; the commas at either end trimmed. */
export function joinPrompts(a, b, macro = '') {
    const trim = (t) => t.trim().replace(/^,|,$/g, '').trim();
    if (!b)
        return a;
    const x = trim(a), y = trim(b);
    return trim(macro && x.includes(macro) ? x.replace(macro, y) : `${x}, ${y},`);
}
/** One seed for every face of a character (FNV-1a of the name), so the faces differ by their words alone. */
export const seedOf = (who) => { let h = 2166136261; for (const ch of who) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
} return (h >>> 0) % 2147483647; };
export async function base64Of(blob) {
    const b = new Uint8Array(await blob.arrayBuffer());
    let out = '';
    for (let i = 0; i < b.length; i += 0x8000)
        out += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return btoa(out);
}
export const blobOf = (b64, type = 'image/png') => new Blob([Uint8Array.from(atob(b64), ch => ch.charCodeAt(0))], { type });
/** A call to the player's image backend (a GET when `body` is null), straight, then through SillyTavern's CORS proxy; its JSON,
 *  or null. Straight, it carries the backend's own headers only; through the proxy, SillyTavern's as well (its CSRF token,
 *  which the proxy strips before it forwards the call). */
export async function toBackend(c, url, path, body, auth) {
    const full = url.replace(/\/+$/, '') + path, own = { 'Content-Type': 'application/json', ...auth ? { Authorization: `Basic ${btoa(auth)}` } : {} };
    const routes = [[full, own], [`/proxy/${full}`, { ...c.getRequestHeaders?.() ?? {}, ...own }]];
    for (const [u, headers] of routes) {
        try {
            const r = await fetch(u, body === null ? { headers } : { method: 'POST', headers, body: JSON.stringify(body) });
            if (r.ok)
                return await r.json();
        }
        catch { /* the next route */ }
    }
    return null;
}
// AI Horde (2026-11-20, section 115; the player's pick, as SillyTavern runs on their phone with no image program of its own): a
// crowd of volunteers' machines, free, through a queue. SillyTavern's own Horde route builds its request on the server and
// sends no picture to redraw (its src/endpoints/horde.js generate-image), so the faces go to the Horde straight from the
// browser, which its API allows from any page (access-control-allow-origin *, read 2026-11-20), with the key the player gives
// in multihog's settings (section 118; SillyTavern keeps its own copy as a secret on its server), else the anonymous key. Each face is an inpainting of the base picture inside the ellipse of
// the face box the player marked, at denoising lookFaceDenoise; the picture sized for the model, each side a multiple of 64
// (the Horde's rule) and at most 1024² pixels (SDXL's size); the player's Horde model, NSFW choice, sampler, steps, CFG,
// Karras and clip skip from the Image Generation, and Animagine XL when no Horde model is chosen. Tried 2026-11-20 with a
// made-up picture, an inpainting of the face's area each time, in about 9 to 12 minutes from the anonymous queue: on
// WAI-NSFW-illustrious-SDXL (10 workers, the Danbooru-tag model with most) the worker blanked it as NSFW twice, the second
// time with "sfw" asked and "nsfw" refused; on Animagine XL (6 workers; trained on Danbooru's tags) it came back, only the
// area inside the mask redrawn [ASSUMED default: the one of the two tried that gave a picture]. A worker may still blank a
// picture it judges NSFW; that is said, and nothing is saved.
const HORDE = 'https://aihorde.net/api/v2', HORDE_AGENT = 'multihog-rules:115:anonymous', HORDE_MODEL = 'Animagine XL';
/** A picture's size for the Horde: each side a multiple of 64, the whole at most 1024² pixels, the shape kept. */
export function hordeSize(w, h) {
    const f = Math.min(1, Math.sqrt(1024 * 1024 / (w * h))), side = (x) => Math.max(64, Math.floor(x * f / 64) * 64);
    return [side(w), side(h)];
}
/** Sends one request to AI Horde and waits for it, checking every `everyMs`; the picture, or why there is none. */
export async function hordeDraw(body, toast = () => { }, everyMs = 10_000, key) {
    const json = (r) => r.json().catch(() => ({})), h = { 'Client-Agent': HORDE_AGENT };
    const sent = await fetch(`${HORDE}/generate/async`, { method: 'POST', headers: { ...h, apikey: key || '0000000000', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(async (r) => ({ ok: r.ok, j: await json(r) })).catch(() => null);
    if (!sent)
        return 'AI Horde did not answer.';
    if (!sent.ok || !sent.j.id)
        return `AI Horde did not take the request: ${sent.j.message ?? 'no reason given'}.`;
    // At most 360 checks: an hour at the 10 s between them.
    for (let i = 0; i < 360; i++) {
        await new Promise(r => setTimeout(r, everyMs));
        const ck = await fetch(`${HORDE}/generate/check/${sent.j.id}`, { headers: h }).then(json).catch(() => null);
        if (!ck)
            continue;
        if (ck.faulted)
            return 'AI Horde failed to draw it.';
        if (ck.is_possible === false)
            return 'No AI Horde worker can draw it now: none runs that model with inpainting. Choose another Horde model in Image Generation and draw again.';
        if (ck.done) {
            const g = (await fetch(`${HORDE}/generate/status/${sent.j.id}`, { headers: h }).then(json).catch(() => null))?.generations?.[0];
            if (!g?.img)
                return 'AI Horde gave no picture.';
            if (g.censored)
                return 'The AI Horde worker blanked the picture as NSFW, so nothing was saved. Draw again (another worker may take it), or allow NSFW in the Image Generation\'s Horde settings.';
            return blobOf(g.img, 'image/webp');
        }
        if (i % 6 === 0)
            toast(`AI Horde: place ${ck.queue_position ?? '?'} in the queue, about ${Math.max(1, Math.ceil((ck.wait_time ?? 0) / 60))} min.`);
    }
    return 'AI Horde took over an hour; nothing was saved.';
}
/** One look's picture of a character from their base picture, the face told by `face` (its tags), or why it cannot be made.
 *  The prompts as SillyTavern's Image Generation makes them for the character (its sendGenerationRequest): its common prefix,
 *  the character's own prompt, then the face; its negative prompt and the character's; the macros filled. */
export async function lookPicture(c, who, base, face, seed, toast = () => { }) {
    const s = sdOf(c), src = s.source ?? '', own = base.key ? s.character_prompts?.[base.key] ?? '' : '', ownNeg = base.key ? s.character_negative_prompts?.[base.key] ?? '' : '';
    const sub = (t) => c.substituteParams?.(t) ?? t;
    const prompt = sub(joinPrompts(joinPrompts(s.prompt_prefix ?? '', own), face, '{prompt}')), negative = sub(joinPrompts('', joinPrompts(s.negative_prompt ?? '', ownNeg)));
    if (src === 'horde') {
        if (!base.box)
            return `${who}'s face has not been marked on their picture.`;
        const pic = await fetch(base.url).then(r => r.ok ? r.blob() : null).catch(() => null);
        if (!pic)
            return `${who}'s picture could not be read.`;
        const paint = c.paint ?? browserPainter, bmp = await createImageBitmap(pic), [width, height] = hordeSize(bmp.width, bmp.height);
        const { image, mask } = await paint.sourceAndMask(pic, width, height, base.box);
        const out = await hordeDraw({
            prompt: `${prompt} ### ${negative}`, params: { sampler_name: /^k_/.test(s.sampler ?? '') ? s.sampler : 'k_euler_a', cfg_scale: s.scale, denoising_strength: faceDenoise(), seed: String(seed),
                width, height, steps: s.steps, karras: s.horde_karras ?? true, clip_skip: s.clip_skip, n: 1 },
            nsfw: !!s.horde_nsfw, models: [s.model || HORDE_MODEL], source_image: image, source_processing: 'inpainting', source_mask: mask, r2: false,
        }, toast, c.hordeEveryMs, c.hordeKey);
        return typeof out === 'string' ? out : paint.png(out);
    }
    if (src === 'auto' || src === 'vlad') {
        const url = (src === 'vlad' ? s.vlad_url : s.auto_url) ?? '', auth = src === 'vlad' ? s.vlad_auth : s.auto_auth;
        const scripts = await toBackend(c, url, '/sdapi/v1/scripts', null, auth);
        if (!scripts)
            return `Your image backend at ${url} did not answer. Turn on SillyTavern's CORS proxy (enableCorsProxy: true in config.yaml) or start the backend with --cors-allow-origins.`;
        if (!(scripts.img2img ?? []).some(n => n.toLowerCase() === 'adetailer'))
            return 'Your image backend has no ADetailer, which redraws the face alone. Install the ADetailer extension in it and draw again.';
        const pic = await fetch(base.url).then(r => r.ok ? r.blob() : null).catch(() => null);
        if (!pic)
            return `${who}'s picture could not be read.`;
        const bmp = await createImageBitmap(pic);
        const out = await toBackend(c, url, '/sdapi/v1/img2img', {
            init_images: [await base64Of(pic)], prompt, negative_prompt: negative, sampler_name: s.sampler, scheduler: s.scheduler, steps: s.steps, cfg_scale: s.scale,
            width: bmp.width, height: bmp.height, denoising_strength: 0, seed,
            alwayson_scripts: { ADetailer: { args: [true, true, { ad_model: 'face_yolov8n.pt', ad_prompt: prompt, ad_negative_prompt: negative, ad_denoising_strength: faceDenoise(), ad_mask_k: 1,
                            ad_use_inpaint_width_height: true, ad_inpaint_width: facePx(), ad_inpaint_height: facePx() }] } },
        }, auth);
        return out?.images?.[0] ? blobOf(out.images[0]) : 'Your image backend gave no picture.';
    }
    if (src === 'comfy') {
        // The workflow is given the picture of the chat's character, or in a group chat the last speaker's or anyone's.
        if (!base.key)
            return `ComfyUI takes a card's picture only; ${who} has no card. Forge or AUTOMATIC1111 with ADetailer can make their faces.`;
        if (who !== c.name2 || c.groupId)
            return `ComfyUI takes a character's picture only in a chat with them alone; open ${who}'s own chat to make their faces.`;
        const wf = await fetch('/api/sd/comfy/workflow', { method: 'POST', headers: c.getRequestHeaders?.() ?? {}, body: JSON.stringify({ file_name: s.comfy_workflow }) }).then(r => r.ok ? r.json() : '').catch(() => '');
        if (!String(wf).includes('%char_avatar%'))
            return 'Your ComfyUI workflow does not take the character\'s picture (%char_avatar%). Choose one that does, so the card picture is kept, and draw again.';
        // /imagine puts the common prefix and negative prompt in itself; in its free mode it leaves out the character's own, so
        // they go in here. The pipe sign would end the command; a quote, the negative prompt's argument.
        const text = joinPrompts(own, face).replace(/\|/g, ','), neg = ownNeg.replace(/[|"]/g, ' ').trim();
        const r = await c.executeSlashCommandsWithOptions?.(`/imagine quiet=true gallery=false extend=false seed=${seed}${neg ? ` negative="${neg}"` : ''} ${text}`).catch(() => undefined);
        const path = String(r?.pipe ?? '');
        return path ? await fetch(path).then(x => x.blob()) : 'Your ComfyUI workflow gave no picture.';
    }
    return `Your image source (${src || 'none'}) cannot keep the card picture. AI Horde can (free), Forge or AUTOMATIC1111 with ADetailer can, or a ComfyUI workflow that takes the character's picture (%char_avatar%).`;
}
/** The pictures in a sprite folder (their labels). */
export async function spriteLabels(c, folder) {
    const r = await fetch(`/api/sprites/get?name=${encodeURIComponent(folder)}`, { headers: c.getRequestHeaders?.() ?? {} }).catch(() => null);
    const list = r?.ok ? await r.json() : [];
    return new Set(list.map(x => x.label));
}
export async function saveSprite(c, folder, label, pic) {
    const form = new FormData(), headers = { ...c.getRequestHeaders?.() ?? {} };
    delete headers['Content-Type'];
    form.append('name', folder);
    form.append('label', label);
    form.append('avatar', new File([pic], `${label}.png`, { type: 'image/png' }));
    form.append('spriteName', label);
    const r = await fetch('/api/sprites/upload', { method: 'POST', headers, body: form }).catch(() => null);
    return !!r?.ok;
}
/** Draws a portrait of one with no card from `tags` (face-words.ts portraitTags) and keeps it in `folder` as "portrait";
 *  null when drawn, else why not. Forge, AUTOMATIC1111 or SD.Next only: ComfyUI cannot then redraw its face. */
export async function drawPortrait(c, who, folder, tags, seed) {
    const s = sdOf(c), src = s.source ?? '';
    if (src === 'horde') {
        const out = await hordeDraw({
            prompt: `${c.substituteParams?.(joinPrompts(s.prompt_prefix ?? '', tags, '{prompt}')) ?? joinPrompts(s.prompt_prefix ?? '', tags, '{prompt}')} ### ${joinPrompts('', s.negative_prompt ?? '')}`,
            params: { sampler_name: /^k_/.test(s.sampler ?? '') ? s.sampler : 'k_euler_a', cfg_scale: s.scale, seed: String(seed), width: hordeSize(s.width ?? 832, s.height ?? 1216)[0], height: hordeSize(s.width ?? 832, s.height ?? 1216)[1],
                steps: s.steps, karras: s.horde_karras ?? true, clip_skip: s.clip_skip, n: 1 },
            nsfw: !!s.horde_nsfw, models: [s.model || HORDE_MODEL], r2: false,
        }, () => { }, c.hordeEveryMs, c.hordeKey);
        if (typeof out === 'string')
            return out;
        return await saveSprite(c, folder, 'portrait', await (c.paint ?? browserPainter).png(out)) ? null : `${who}'s portrait could not be saved.`;
    }
    if (src !== 'auto' && src !== 'vlad')
        return `${who} has no card, so a portrait is drawn first, which needs AI Horde, Forge or AUTOMATIC1111 (your image source: ${src || 'none'}).`;
    const url = (src === 'vlad' ? s.vlad_url : s.auto_url) ?? '', auth = src === 'vlad' ? s.vlad_auth : s.auto_auth, sub = (t) => c.substituteParams?.(t) ?? t;
    const out = await toBackend(c, url, '/sdapi/v1/txt2img', {
        prompt: sub(joinPrompts(s.prompt_prefix ?? '', tags, '{prompt}')), negative_prompt: sub(joinPrompts('', s.negative_prompt ?? '')), sampler_name: s.sampler, scheduler: s.scheduler,
        steps: s.steps, cfg_scale: s.scale, width: s.width, height: s.height, seed,
    }, auth);
    if (!out)
        return `Your image backend at ${url} did not answer. Turn on SillyTavern's CORS proxy (enableCorsProxy: true in config.yaml) or start the backend with --cors-allow-origins.`;
    if (!out.images?.[0])
        return 'Your image backend gave no picture.';
    return await saveSprite(c, folder, 'portrait', blobOf(out.images[0])) ? null : `${who}'s portrait could not be saved.`;
}
/** Makes the faces a character lacks, one for each look, from their base picture; what was made, or why it stopped. `toast`
 *  tells the player each one as it starts. */
export async function makeFaces(c, who, base, looks, toast = () => { }) {
    const have = await spriteLabels(c, base.folder);
    const todo = looks.filter(l => !have.has(lookLabel(l.face)));
    // One at a time, or hordeAtOnce at once through AI Horde's queue; the first to fail stops the rest.
    let made = 0, started = 0, next = 0, stop = null;
    const one = async () => {
        while (!stop && next < todo.length) {
            const look = todo[next++];
            toast(`Making ${who}'s face ${++started} of ${todo.length}…`);
            const pic = await lookPicture(c, who, base, faceTags(look.face).tags.join(', '), seedOf(who), toast);
            if (typeof pic === 'string') {
                stop ??= n => n ? `${pic} (${n} made before it.)` : pic;
                return;
            }
            if (!await saveSprite(c, base.folder, lookLabel(look.face), pic)) {
                stop ??= n => `A face of ${who}'s could not be saved${n ? ` (${n} made before it)` : ''}.`;
                return;
            }
            made++;
        }
    };
    await Promise.all(Array.from({ length: Math.min(sdOf(c).source === 'horde' ? hordeAtOnce() : 1, todo.length) }, one));
    if (stop)
        return stop(made);
    return made ? `Made ${made} of ${who}'s ${looks.length} faces; the others were there.` : `${who} has all ${looks.length} faces.`;
}
/** The faces waiting to be drawn, drawn `atOnce` at a time by `draw`, which answers 'done', 'box' (the face box is not marked
 *  yet: the job waits for `marked`), or why it failed (`failed` hears it). */
export class FaceQueue {
    o;
    todo = [];
    seen = new Set();
    parked = new Map();
    running = 0;
    waiters = [];
    constructor(o) {
        this.o = o;
    }
    /** Asks for `who`'s faces, each once a session, the first given first. */
    want(who, faces) {
        for (const face of faces) {
            const key = `${who}\n${lookLabel(face)}`;
            if (this.seen.has(key))
                continue;
            this.seen.add(key);
            this.todo.push({ who, face });
        }
        this.run();
    }
    /** `who`'s face box is marked: their faces held for it go on. */
    marked(who) {
        const held = this.parked.get(who);
        if (!held)
            return;
        this.parked.delete(who);
        this.todo.push(...held);
        this.run();
    }
    /** Who waits for a face box. */
    waiting() { return [...this.parked.keys()]; }
    /** Once nothing is being drawn or waits to be (what is held for a face box aside). */
    idle() { return this.running || this.todo.length ? new Promise(r => this.waiters.push(r)) : Promise.resolve(); }
    run() {
        while (this.running < Math.max(1, this.o.atOnce()) && this.todo.length) {
            const job = this.todo.shift();
            this.running++;
            void this.o.draw(job).catch(e => String(e instanceof Error ? e.message : e)).then(r => {
                if (r === 'box')
                    this.parked.set(job.who, [...this.parked.get(job.who) ?? [], job]);
                else if (r !== 'done')
                    this.o.failed?.(job, r);
                this.running--;
                this.run();
                if (!this.running && !this.todo.length)
                    this.waiters.splice(0).forEach(w => w());
            });
        }
    }
}
