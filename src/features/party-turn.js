// Party turn planner: one action per [PARTY] member, added to the user's message as a single turn.

import { getSettings } from '../../state-manager.js';
import { escapeHtml } from '../../memo-processor.js';

/** Member names from [PARTY]: "Name (72 kg)" headers or "Name (Class): 26/45 HP" headers. */
export function partyNames(memo) {
    const body = String(memo || '').match(/\[PARTY\]([\s\S]*?)\[\/PARTY\]/i)?.[1] || '';
    const names = [];
    for (const line of body.split('\n')) {
        const m = line.match(/^\s*([^:()\n]+?)\s*\(\d+(?:\.\d+)?\s*kg\)\s*$/i)
            || line.match(/^\s*([^:()\n]+?)\s*(?:\([^)]*\))?\s*:\s*[\d?,]+\s*\/\s*[\d?,]+\s*HP/i);
        if (m) names.push(m[1].trim());
    }
    return names;
}

export async function openPartyTurn() {
    const ctx = SillyTavern.getContext();
    const names = partyNames(getSettings().currentMemo);
    if (!names.length) {
        toastr.info('No party members in [PARTY].', 'Party turn');
        return;
    }
    const actions = {};
    const html = `<div class="rt-party-turn"><h3>Party turn</h3>${names.map((n, i) => `<label class="rt-party-turn-row"><span>${escapeHtml(n)}</span><input class="text_pole" data-i="${i}" placeholder="action this turn"></label>`).join('')}</div>`;
    const popup = ctx.callGenericPopup(html, ctx.POPUP_TYPE.CONFIRM, '', { okButton: 'Add to message', cancelButton: 'Cancel', wide: true });
    setTimeout(() => document.querySelectorAll('.rt-party-turn input').forEach(el => {
        el.addEventListener('input', () => { actions[names[Number(el.dataset.i)]] = el.value; });
    }), 0);
    if (!await popup) return;
    const lines = names.filter(n => actions[n]?.trim()).map(n => `- ${n}: ${actions[n].trim()}`);
    if (!lines.length) return;
    const input = /** @type {HTMLTextAreaElement} */ (document.getElementById('send_textarea'));
    const own = input.value.trim();
    input.value = `${own ? `${own}\n\n` : ''}Party actions this turn:\n${lines.join('\n')}`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
}
