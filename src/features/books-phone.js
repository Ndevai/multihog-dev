// Books library (in-world books written by the model, kept per chat) and phone (text threads with
// NPCs; the NPC answers in character from its lorebook entry and the recent chat). Texts exchanged
// since the user's last message are shown to the narrator for every generation of that turn.

import { getSettings } from '../../state-manager.js';
import { escapeHtml, cleanMessageContent } from '../../memo-processor.js';
import { sendStateRequest } from '../../llm-client.js';
import { getLorebookManifest } from '../../router.js';

const BOOKS = 'rtBooks';
const PHONE = 'rtPhone';

const meta = () => SillyTavern.getContext().chatMetadata;
const save = () => { const ctx = SillyTavern.getContext(); (ctx.saveMetadataDebounced || ctx.saveMetadata)?.(); };

function recentChat(n = 10) {
    const chat = SillyTavern.getContext().chat || [];
    return chat.filter(m => !m.is_system && m.mes?.trim()).slice(-n)
        .map(m => `${m.is_user ? 'Player' : (m.name || 'Narrator')}: ${cleanMessageContent(m)}`).join('\n\n');
}

function popupShell(title, html) {
    const ctx = SillyTavern.getContext();
    const id = `rt_popup_${Date.now()}`;
    const popup = ctx.callGenericPopup(`<div id="${id}" class="rt-notes"><h3>${title}</h3>${html}<div class="rt-notes-body"></div></div>`, ctx.POPUP_TYPE.TEXT, '', { wide: true, large: true, okButton: 'Close' });
    return { popup, ready: new Promise(r => setTimeout(() => r(document.getElementById(id)), 0)) };
}

const BOOK_SYSTEM = `You write a book that exists inside a roleplay's world. Match the world's setting, era and established facts from the lorebook notes and recent chat; the book's author is a person of that world. Give it a title line, then the text, 300-800 words.`;

export async function openBooks() {
    const m = meta();
    if (!m) return;
    const { popup, ready } = popupShell('Library', `<input class="text_pole rt-bk-topic" placeholder="Title or topic of the book"><div class="menu_button rt-bk-go">Write book</div>`);
    const root = await ready;
    if (!root) return popup;
    const body = root.querySelector('.rt-notes-body');
    const draw = () => {
        const list = m[BOOKS] ??= [];
        body.innerHTML = list.map((b, i) => `<details class="rt-notes-entry"><summary>${escapeHtml(b.title)}</summary><div class="rt-notes-text">${escapeHtml(b.text)}</div><div class="menu_button rt-bk-del" data-i="${i}">Delete</div></details>`).reverse().join('') || '<div class="rt-notes-meta">No books yet.</div>';
        body.querySelectorAll('.rt-bk-del').forEach(el => el.addEventListener('click', () => { list.splice(Number(el.dataset.i), 1); save(); draw(); }));
    };
    root.querySelector('.rt-bk-go').addEventListener('click', async () => {
        const topic = root.querySelector('.rt-bk-topic').value.trim();
        if (!topic) return;
        body.textContent = 'Writing…';
        const lore = (await getLorebookManifest(true).catch(() => [])).filter(e => e.is_active).map(e => `${e.label}: ${e.content}`).join('\n').slice(0, 6000);
        try {
            const text = String(await sendStateRequest(getSettings(), BOOK_SYSTEM, `## LOREBOOK NOTES\n${lore || '(none)'}\n\n## RECENT CHAT\n${recentChat()}\n\n## BOOK\n${topic}`, null, { debugSource: 'Library' })).trim();
            const [first, ...rest] = text.split('\n');
            (m[BOOKS] ??= []).push({ title: first.replace(/^#+\s*/, '').trim() || topic, text: rest.join('\n').trim() || text });
            save();
        } catch (e) {
            toastr.error(`Book not written: ${e.message}`, 'Library');
        }
        draw();
    });
    draw();
    return popup;
}

const TEXT_SYSTEM = `You are an NPC answering a text message in a roleplay. Reply as that character only, in their voice, with what they know from their profile and the recent events; keep it to the length of a text message (1-3 sentences).`;

export async function openPhone() {
    const m = meta();
    if (!m) return;
    const npcs = (await getLorebookManifest(true).catch(() => [])).filter(e => /_NPCs$/.test(e.book));
    const { popup, ready } = popupShell('Phone', `<select class="text_pole rt-ph-who">${npcs.map((e, i) => `<option value="${i}">${escapeHtml(e.label)}</option>`).join('')}</select>`);
    const root = await ready;
    if (!root) return popup;
    if (!npcs.length) {
        root.querySelector('.rt-notes-body').textContent = 'No NPCs in the campaign lorebook yet.';
        return popup;
    }
    const body = root.querySelector('.rt-notes-body');
    const select = root.querySelector('.rt-ph-who');
    const draw = () => {
        const npc = npcs[Number(select.value)];
        const thread = ((m[PHONE] ??= {})[npc.label] ??= []);
        body.innerHTML = `${thread.map(t => `<div class="rt-ph-msg rt-ph-${t.from}">${escapeHtml(t.text)}</div>`).join('')}
            <textarea class="text_pole rt-ph-input" rows="2" placeholder="Message to ${escapeHtml(npc.label)}"></textarea><div class="menu_button rt-ph-send">Send</div>`;
        body.querySelector('.rt-ph-send').addEventListener('click', async () => {
            const text = body.querySelector('.rt-ph-input').value.trim();
            if (!text) return;
            thread.push({ from: 'user', text, told: false });
            save();
            draw();
            try {
                const history = thread.slice(-12).map(t => `${t.from === 'user' ? 'Player' : npc.label}: ${t.text}`).join('\n');
                const reply = String(await sendStateRequest(getSettings(), TEXT_SYSTEM, `## ${npc.label}\n${npc.content}\n\n## RECENT EVENTS\n${recentChat(6)}\n\n## THREAD\n${history}\n\nReply as ${npc.label}.`, null, { debugSource: 'Phone' })).trim();
                thread.push({ from: 'npc', text: reply, told: false });
                save();
            } catch (e) {
                toastr.error(`No reply: ${e.message}`, 'Phone');
            }
            draw();
        });
    };
    select.addEventListener('change', draw);
    draw();
    return popup;
}

/** MESSAGE_SENT: texts shown during the previous turn count as known to the story. */
export function markPhoneTold() {
    const threads = meta()?.[PHONE];
    if (!threads) return;
    for (const thread of Object.values(threads)) for (const t of thread) t.shown && (t.told = true);
    save();
}

/** Narrator injection: texts not yet part of a finished turn. */
export function takePhoneInjection() {
    const threads = meta()?.[PHONE];
    if (!threads) return '';
    const lines = [];
    for (const [name, thread] of Object.entries(threads)) {
        for (const t of thread) {
            if (t.told) continue;
            lines.push(`${t.from === 'user' ? `{{user}} → ${name}` : `${name} → {{user}}`}: ${t.text}`);
            t.shown = true;
        }
    }
    if (!lines.length) return '';
    return `<phone>\nText messages exchanged since the last reply (they happened in the story):\n${lines.join('\n')}\n</phone>`;
}
