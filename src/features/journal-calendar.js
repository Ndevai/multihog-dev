// Journal (player notes) and calendar (dated in-game events), stored per chat in chat metadata.
// Calendar events due within the next 24 in-game hours are shown to the narrator.

import { getSettings } from '../../state-manager.js';
import { escapeHtml, parseInWorldTime, formatInWorldTime } from '../../memo-processor.js';

const JOURNAL = 'rtJournal';
const CALENDAR = 'rtCalendar';

function meta() {
    return SillyTavern.getContext().chatMetadata;
}

function save() {
    const ctx = SillyTavern.getContext();
    (ctx.saveMetadataDebounced || ctx.saveMetadata)?.();
}

/** Current in-game time in minutes from the State Tracker's [TIME] block, or null. */
export function nowMinutes(memo = getSettings().currentMemo) {
    const block = String(memo || '').match(/\[TIME\]([\s\S]*?)\[\/TIME\]/i)?.[1];
    return block ? parseInWorldTime(block) : null;
}

function nowLabel() {
    const t = nowMinutes();
    return t === null ? '' : formatInWorldTime(t);
}

/** A popup whose body is redrawn by draw(root) after every change. */
function livePopup(title, draw) {
    const ctx = SillyTavern.getContext();
    const id = `rt_popup_${Date.now()}`;
    const popup = ctx.callGenericPopup(`<div id="${id}" class="rt-notes"><h3>${title}</h3><div class="rt-notes-body"></div></div>`, ctx.POPUP_TYPE.TEXT, '', { wide: true, okButton: 'Close' });
    setTimeout(() => {
        const root = document.getElementById(id);
        if (root) draw(root.querySelector('.rt-notes-body'));
    }, 0);
    return popup;
}

export function openJournal() {
    const m = meta();
    if (!m) return;
    const draw = body => {
        const list = m[JOURNAL] ??= [];
        body.innerHTML = `
            <textarea class="text_pole rt-notes-input" rows="3" placeholder="New entry"></textarea>
            <div class="menu_button rt-notes-add">Add</div>
            ${list.map((e, i) => `<div class="rt-notes-entry"><div class="rt-notes-meta">${escapeHtml(e.time || '')}</div><div class="rt-notes-text">${escapeHtml(e.text)}</div><div class="menu_button rt-notes-del" data-i="${i}">Delete</div></div>`).reverse().join('')}`;
        body.querySelector('.rt-notes-add').addEventListener('click', () => {
            const text = body.querySelector('.rt-notes-input').value.trim();
            if (!text) return;
            list.push({ time: nowLabel(), text });
            save();
            draw(body);
        });
        body.querySelectorAll('.rt-notes-del').forEach(el => el.addEventListener('click', () => {
            list.splice(Number(el.dataset.i), 1);
            save();
            draw(body);
        }));
    };
    return livePopup('Journal', draw);
}

export function openCalendar() {
    const m = meta();
    if (!m) return;
    const draw = body => {
        const list = (m[CALENDAR] ??= []).sort((a, b) => a.at - b.at);
        const now = nowMinutes();
        body.innerHTML = `
            <div class="rt-notes-meta">Now: ${escapeHtml(now === null ? 'no [TIME] block yet' : formatInWorldTime(now))}</div>
            <input class="text_pole rt-cal-when" placeholder="When, in the chat's time format (e.g. ${escapeHtml(formatInWorldTime((now ?? 0) + 1440))})">
            <input class="text_pole rt-cal-what" placeholder="What happens">
            <div class="menu_button rt-notes-add">Add event</div>
            ${list.map((e, i) => `<div class="rt-notes-entry${now !== null && e.at < now ? ' rt-notes-past' : ''}"><div class="rt-notes-meta">${escapeHtml(formatInWorldTime(e.at))}</div><div class="rt-notes-text">${escapeHtml(e.text)}</div><div class="menu_button rt-notes-del" data-i="${i}">Delete</div></div>`).join('')}`;
        body.querySelector('.rt-notes-add').addEventListener('click', () => {
            const at = parseInWorldTime(body.querySelector('.rt-cal-when').value);
            const text = body.querySelector('.rt-cal-what').value.trim();
            if (at === null || !text) {
                toastr.warning('Give a time the chat understands and a description.', 'Calendar');
                return;
            }
            list.push({ at, text });
            save();
            draw(body);
        });
        body.querySelectorAll('.rt-notes-del').forEach(el => el.addEventListener('click', () => {
            list.splice(Number(el.dataset.i), 1);
            save();
            draw(body);
        }));
    };
    return livePopup('Calendar', draw);
}

/** Narrator injection: events from now to 24 in-game hours ahead, or '' when none. */
export function calendarInjection(memo) {
    const list = meta()?.[CALENDAR] || [];
    const now = nowMinutes(memo);
    if (now === null || !list.length) return '';
    const due = list.filter(e => e.at >= now && e.at <= now + 1440).sort((a, b) => a.at - b.at);
    if (!due.length) return '';
    return `<calendar>\nScheduled in the next 24 hours:\n${due.map(e => `- ${formatInWorldTime(e.at)}: ${e.text}`).join('\n')}\n</calendar>`;
}
