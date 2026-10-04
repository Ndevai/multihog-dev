// Scene memory and whereabouts. A scene = the replies at one place, keyed by the first two
// segments of the footer location ("City, District"). When the key changes, the finished scene is
// summarized; the narrator sees the latest summaries, and with hiding on, the raw messages of
// scenes older than the last two leave the prompt. Whereabouts: each NPC's last known place, from
// the [SCENE] block (Present → the current location, Left → where they went).

import { getSettings } from '../../state-manager.js';
import { cleanMessageContent } from '../../memo-processor.js';
import { sendStateRequest } from '../../llm-client.js';
import { extractFooterLocation } from '../../dungeon-reality.js';

const KEY = 'rtSceneMemory';
const WHERE = 'rtWhereabouts';
const SHOWN_SCENES = 8;
const KEPT_RAW_SCENES = 2;

const SUMMARY_SYSTEM = `You write the memory of a finished roleplay scene, used later as context in place of the scene itself. Write 1-2 paragraphs, at most 300 words, with proper names. Keep the facts that matter later: what {{user}} did, learned and decided; changes to location, belongings, injuries and relationships; discoveries and clues; open goals, promises, threats and deadlines. Write the summary alone, as plain prose.`;

const meta = () => SillyTavern.getContext().chatMetadata;
const save = () => { const ctx = SillyTavern.getContext(); (ctx.saveMetadataDebounced || ctx.saveMetadata)?.(); };

export const sceneKey = location => String(location || '').split(/\s*,\s*/).filter(Boolean).slice(0, 2).join(', ');

const isReply = m => m && !m.is_user && !m.is_system && String(m.mes || '').trim();

/** MESSAGE_RECEIVED: start a new scene when the place changes; summarize the one that ended. */
export async function onSceneMemoryMessage(messageId) {
    const ctx = SillyTavern.getContext();
    const m = meta();
    const msg = ctx.chat?.[messageId];
    if (!m || !isReply(msg) || messageId !== ctx.chat.length - 1) return;
    const key = sceneKey(extractFooterLocation(msg.mes));
    if (!key) return;
    const mem = m[KEY] ??= { key: '', start: 0, scenes: [] };
    // A swipe of the reply that opened the current scene, back at the previous place, undoes that scene change.
    const last = mem.scenes.at(-1);
    if (messageId === mem.start && last && key === last.key) {
        mem.scenes.pop();
        mem.key = last.key;
        mem.start = last.from;
        save();
        return;
    }
    if (!mem.key) { mem.key = key; mem.start = messageId; save(); return; }
    if (key === mem.key || messageId === mem.start) { mem.key = key; save(); return; }
    const scene = { key: mem.key, from: mem.start, to: messageId - 1, summary: '' };
    mem.key = key;
    mem.start = messageId;
    mem.scenes.push(scene);
    save();
    const text = ctx.chat.slice(scene.from, scene.to + 1).filter(x => !x.is_system && x.mes?.trim())
        .map(x => `${x.is_user ? '{{user}}' : (x.name || 'Narrator')}: ${cleanMessageContent(x)}`).join('\n\n');
    try {
        scene.summary = String(await sendStateRequest(getSettings(), SUMMARY_SYSTEM, `## PLACE\n${scene.key}\n\n## SCENE\n${text}`, null, { debugSource: 'Scene Memory' })).trim();
        save();
    } catch (e) {
        console.warn('[RPG Tracker] Scene summary failed:', e);
        return;
    }
    if (getSettings().sceneMemoryHide) {
        const done = mem.scenes.filter(s => s.summary);
        const old = done.slice(0, Math.max(0, done.length - KEPT_RAW_SCENES)).filter(s => !s.hidden);
        for (const s of old) {
            await ctx.executeSlashCommandsWithOptions?.(`/hide ${s.from}-${s.to}`);
            s.hidden = true;
        }
        save();
    }
}

/** Narrator injection: the latest scene summaries, oldest first. */
export function sceneMemoryInjection() {
    const scenes = (meta()?.[KEY]?.scenes || []).filter(s => s.summary).slice(-SHOWN_SCENES);
    if (!scenes.length) return '';
    return `<earlier_scenes>\n${scenes.map(s => `${s.key}: ${s.summary}`).join('\n\n')}\n</earlier_scenes>`;
}

/** After a State Tracker pass: record where Present and Left characters are. */
export function updateWhereabouts(memo) {
    const m = meta();
    const block = String(memo || '').match(/\[SCENE\]([\s\S]*?)\[\/SCENE\]/i)?.[1];
    if (!m || !block) return;
    const ctx = SillyTavern.getContext();
    const here = extractFooterLocation([...(ctx.chat || [])].reverse().find(isReply)?.mes || '');
    const where = m[WHERE] ??= {};
    const line = label => block.match(new RegExp(`^\\s*${label}:\\s*(.+)$`, 'im'))?.[1] || '';
    if (here) for (const name of line('Present').split(',').map(s => s.trim()).filter(Boolean)) where[name] = here;
    for (const part of line('Left').split(/,(?![^(]*\))/)) {
        const mm = part.match(/^\s*([^(]+?)\s*\(([^)]+)\)/);
        if (mm) where[mm[1].trim()] = mm[2].trim();
    }
    save();
}

/** Narrator injection: last known places of characters named in the user's latest message. */
export function whereaboutsInjection() {
    const where = meta()?.[WHERE];
    if (!where) return '';
    const said = String([...(SillyTavern.getContext().chat || [])].reverse().find(x => x.is_user)?.mes || '');
    const named = Object.entries(where).filter(([name]) => said.includes(name.split(' ')[0]));
    if (!named.length) return '';
    return `<whereabouts>\nLast known places:\n${named.map(([n, p]) => `- ${n}: ${p}`).join('\n')}\n</whereabouts>`;
}
