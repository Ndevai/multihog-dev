// Lorebook suggestions with review: the model proposes entries from the recent chat; each one is
// edited, added to the campaign's lorebook, or discarded by the user before anything is saved.

import { getSettings } from '../../state-manager.js';
import { escapeHtml, cleanMessageContent } from '../../memo-processor.js';
import { sendStateRequest } from '../../llm-client.js';
import { addLorebookEntry, getLivePrefix, getLorebookManifest, rememberCampaignBook } from '../../router.js';
import { MODULE_BOOK_CATEGORY } from '../state/default-modules.js';

const CATEGORIES = [...new Set(Object.values(MODULE_BOOK_CATEGORY))];

const SYSTEM = `You suggest lorebook entries for a roleplay. Read the recent chat and propose entries for people, places, groups, objects or facts that recur or will matter later and have no entry yet.
Each entry: a title, 2-5 trigger keywords that appear in text when the subject comes up, a category from the list given, and content stating what the chat established about the subject, in third person, 40-120 words.
Reply with JSON only: {"entries":[{"title":"","category":"","keys":[""],"content":""}]}`;

function recentChat(n = 12) {
    const chat = SillyTavern.getContext().chat || [];
    return chat.filter(m => !m.is_system && m.mes?.trim()).slice(-n)
        .map(m => `${m.is_user ? 'Player' : (m.name || 'Narrator')}: ${cleanMessageContent(m)}`).join('\n\n');
}

function parse(text) {
    const m = String(text ?? '').match(/\{[\s\S]*\}/);
    if (!m) return [];
    try {
        const list = JSON.parse(m[0]).entries;
        return Array.isArray(list) ? list.filter(e => e?.title && e?.content) : [];
    } catch {
        return [];
    }
}

export async function openLoreSuggestions() {
    const ctx = SillyTavern.getContext();
    const prefix = getLivePrefix();
    if (!prefix) {
        toastr.info('This chat has no campaign lorebooks yet.', 'Lorebook suggestions');
        return;
    }
    const id = `rt_lore_suggest_${Date.now()}`;
    const popup = ctx.callGenericPopup(`<div id="${id}" class="rt-notes"><h3>Lorebook suggestions</h3>
        <input class="text_pole rt-ls-hint" placeholder="Optional: what to focus on">
        <div class="menu_button rt-ls-go">Suggest entries</div>
        <div class="rt-notes-body"></div></div>`, ctx.POPUP_TYPE.TEXT, '', { wide: true, okButton: 'Close' });
    await new Promise(r => setTimeout(r, 0));
    const root = document.getElementById(id);
    if (!root) return popup;
    const body = root.querySelector('.rt-notes-body');
    root.querySelector('.rt-ls-go').addEventListener('click', async () => {
        body.textContent = 'Asking the model…';
        const manifest = await getLorebookManifest(true).catch(() => []);
        const existing = manifest.map(e => e.label).filter(Boolean);
        const hint = root.querySelector('.rt-ls-hint').value.trim();
        const user = `## CATEGORIES\n${CATEGORIES.join(', ')}\n\n## EXISTING ENTRIES\n${existing.join(', ') || '(none)'}\n\n${hint ? `## FOCUS\n${hint}\n\n` : ''}## RECENT CHAT\n${recentChat()}`;
        let entries = [];
        try {
            entries = parse(await sendStateRequest(getSettings(), SYSTEM, user, null, { debugSource: 'Lorebook Suggestions' }));
        } catch (e) {
            body.textContent = `Request failed: ${e.message}`;
            return;
        }
        if (!entries.length) {
            body.textContent = 'No new entries suggested.';
            return;
        }
        body.innerHTML = entries.map((e, i) => `<div class="rt-notes-entry" data-i="${i}">
            <input class="text_pole rt-ls-title" value="${escapeHtml(e.title)}">
            <select class="text_pole rt-ls-cat">${CATEGORIES.map(c => `<option${c === e.category ? ' selected' : ''}>${c}</option>`).join('')}</select>
            <input class="text_pole rt-ls-keys" value="${escapeHtml((e.keys || []).join(', '))}">
            <textarea class="text_pole rt-ls-content" rows="4">${escapeHtml(e.content)}</textarea>
            <div class="menu_button rt-ls-add">Add to lorebook</div><div class="menu_button rt-ls-drop">Discard</div></div>`).join('');
        body.querySelectorAll('.rt-notes-entry').forEach(card => {
            card.querySelector('.rt-ls-drop').addEventListener('click', () => card.remove());
            card.querySelector('.rt-ls-add').addEventListener('click', async () => {
                const book = `${prefix}_${card.querySelector('.rt-ls-cat').value}`;
                await addLorebookEntry(book, {
                    label: card.querySelector('.rt-ls-title').value.trim(),
                    keys: card.querySelector('.rt-ls-keys').value.split(',').map(k => k.trim()).filter(Boolean),
                    content: card.querySelector('.rt-ls-content').value.trim(),
                });
                rememberCampaignBook(book, getSettings());
                document.dispatchEvent(new CustomEvent('rt_lore_agent_updated'));
                toastr.success(`Added to ${book}.`, 'Lorebook suggestions');
                card.remove();
            });
        });
    });
    return popup;
}
