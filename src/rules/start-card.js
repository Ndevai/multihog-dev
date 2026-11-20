const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cap = (t) => t ? `${t[0].toUpperCase()}${t.slice(1)}` : t;
/** The start's card as HTML, every word escaped. */
export function startCardHtml(s) {
    const people = s.people.map(x => `<li><span class="rules-start-who">${esc(x.who)}</span> <span class="rules-start-note">${esc(x.relation)}</span>`
        + `<div>${esc(cap(x.line))}</div>${x.wants ? `<div class="rules-start-wants">Wants: ${esc(x.wants)}</div>` : ''}</li>`).join('');
    const names = s.names ? `${esc(s.names.main)}${s.names.also.length ? ` <span class="rules-start-note">· also heard: ${esc(s.names.also.join(', '))}</span>` : ''}`
        : '<span class="rules-start-note">No name: you have never heard of them.</span>';
    const sheet = s.sheet.length ? `<details><summary>Its sheet</summary><ul class="rules-start-sheet">${s.sheet.map(l => `<li>${esc(l)}</li>`).join('')}</ul></details>` : '';
    return `<div class="rules-start">`
        + `<div class="rules-start-title">Your start</div><div class="rules-start-note">${esc(s.town[0].toUpperCase() + s.town.slice(1))} in ${esc(s.where)} · ${esc(s.when)}</div>`
        + `<div class="rules-start-head">You</div><div>${esc(cap(s.you))}</div>`
        + `<div class="rules-start-head">Around you</div><ul class="rules-start-people">${people}</ul>`
        + `<div class="rules-start-head">What you call them</div><div>${names}</div>`
        + (s.law ? `<details class="rules-start-law"><summary>The world's law <span class="rules-start-note">your character may not know it</span></summary>`
            + `<p>${esc(cap(s.law))}.</p>${sheet}<p class="rules-start-note">Its ratings: ${esc(s.ratings)}. What it does: ${esc(s.outcome)}.${s.among ? ` ${esc(s.among)}` : ''}</p></details>` : '')
        + `<div class="rules-start-code">Seed ${esc(s.code)}</div></div>`;
}
