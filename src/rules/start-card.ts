// The start's card (the seed's popup, src/index.ts registerSeedCommand; style.css .rules-start): the same words as
// seed.ts knownStart, laid out to be read on a phone (decided by Claude on 2026-11-17, the player: "just say what to do";
// photographed before as one block in a typewriter face). The place and night first; who the player's character is; the
// people around them, each with their tie, then age, sex and work, then what they want where it is not kept secret; what the
// character calls the kind. The world's law, which the character may not know, is folded under one tap, so the start does not
// tell the player at a glance what the story keeps for them to find; its sheet is folded again inside it. The seed's code
// stands last, to be copied.
import type { startParts } from './seed.js';

type Parts = ReturnType<typeof startParts>;
const esc = (t: string) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (t: string) => t ? `${t[0]!.toUpperCase()}${t.slice(1)}` : t;

/** The start's card as HTML, every word escaped. */
export function startCardHtml(s: Parts): string {
    const people = s.people.map(x => `<li><span class="rules-start-who">${esc(x.who)}</span> <span class="rules-start-note">${esc(x.relation)}</span>`
        + `<div>${esc(cap(x.line))}</div>${x.wants ? `<div class="rules-start-wants">Wants: ${esc(x.wants)}</div>` : ''}</li>`).join('');
    const names = s.names ? `${esc(s.names.main)}${s.names.also.length ? ` <span class="rules-start-note">· also heard: ${esc(s.names.also.join(', '))}</span>` : ''}`
        : '<span class="rules-start-note">No name: you have never heard of them.</span>';
    const sheet = s.sheet.length ? `<details><summary>Its sheet</summary><ul class="rules-start-sheet">${s.sheet.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>` : '';
    return `<div class="rules-start">`
        + `<div class="rules-start-title">Your start</div><div class="rules-start-note">${esc(s.town[0]!.toUpperCase() + s.town.slice(1))} in ${esc(s.where)} · ${esc(s.when)}</div>`
        + `<div class="rules-start-head">You</div><div>${esc(cap(s.you))}</div>`
        + `<div class="rules-start-head">Around you</div><ul class="rules-start-people">${people}</ul>`
        + `<div class="rules-start-head">What you call them</div><div>${names}</div>`
        + (s.law ? `<details class="rules-start-law"><summary>The world's law <span class="rules-start-note">your character may not know it</span></summary>`
            + `<p>${esc(cap(s.law))}.</p>${sheet}<p class="rules-start-note">Its ratings: ${esc(s.ratings)}. What it does: ${esc(s.outcome)}.${s.among ? ` ${esc(s.among)}` : ''}</p></details>` : '')
        + `<div class="rules-start-code">Seed ${esc(s.code)}</div></div>`;
}
