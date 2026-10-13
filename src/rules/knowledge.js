const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Facts shown per character and for common knowledge [ASSUMED; the newest are kept].
export const FACTS_SHOWN = 12;
// Each fact keeps its source ("told by X", "saw it"), so a character can doubt or trace hearsay (source-tagged beliefs:
// Versu, Evans & Short 2014; LoCoMo, Maharana et al. 2024, ACL).
/**
 * Records `text` as a fixed fact, adds `knowers`, marks it common knowledge when `everyone`. `sources` maps a knower to how
 * they learned it. Returns the fact.
 */
export function learn(st, text, knowers = [], everyone = false, sources = {}) {
    const facts = st.facts ??= [];
    st.factSeq = (st.factSeq ?? 0) + 1;
    let f = facts.find(x => norm(x.text) === norm(text));
    if (!f) {
        f = { id: facts.length + 1, text: String(text).trim(), knowers: [], everyone: false };
        facts.push(f);
    }
    f.seq = st.factSeq;
    if (everyone)
        f.everyone = true;
    const from = f.from ??= {};
    for (const [k, v] of Object.entries(sources))
        if (v && !from[norm(k)])
            from[norm(k)] = String(v).trim();
    for (const k of knowers)
        if (k && !f.knowers.some(x => norm(x) === norm(k)))
            f.knowers.push(String(k).trim());
    // Learning it again (told again, seen again, using it) restarts its forgetting clock for those knowers.
    const now = st.clock ? st.clock.t + st.clock.add : null;
    if (now !== null) {
        const at = f.at ??= {};
        for (const k of knowers)
            if (k)
                at[norm(k)] = now;
    }
    return f;
}
// Forgetting. Events a person singled out as notable were recalled, unprompted, by adults after 1 year 97 %; the odds fell
// 14.6-fold by 2 years and 20.7-fold by 3 (Bauer & Larkina 2016, Memory 24:1345, Table 4 and text; 4-year prospective study):
// 69 % and 61 %. Retention curves of every kind are fit as well by a power function as by any (Rubin & Wenzel 1996, Psychol
// Rev 103:734, 210 data sets), so y = 0.97 t^(−0.42), t in years (the 1- and 3-year points), at most 1; under 1 year from
// 100 % to 97 % linearly [ASSUMED]. Adults' events only: children forget faster (4-year-olds recalled 39 % after 1 year)
// [OPEN: per-age rates]. Common knowledge does not fade. A fact is not deleted: it drops out of [KNOWS] for that knower, the
// record stays, and learning it again brings it back. Each knower keeps one fixed draw per fact, so a fact once forgotten
// stays forgotten (the curve only falls) until relearned.
export function recallShare(years) {
    if (years <= 1)
        return 1 - 0.03 * Math.max(0, years);
    return Math.min(1, 0.97 * years ** -0.42);
}
const draw = (s) => { let h = 2166136261; for (const c of s)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
function recalls(st, f, who) {
    const now = st.clock ? st.clock.t + st.clock.add : null, at = f.at?.[norm(who)];
    if (now === null || at == null || f.everyone)
        return true;
    return draw(`${f.id}|${norm(who)}|${f.text}`) < recallShare((now - at) / 525960);
}
export const knows = (st, name, text) => (st.facts ?? []).some(f => norm(f.text) === norm(text) && (f.everyone || f.knowers.some(k => norm(k) === norm(name))));
// What is not in the narrator's context cannot leak into another character's mouth: models revealed private information
// where people would not 39 % (GPT-4) and 57 % (ChatGPT) of the time (ConfAIde, Mireshghallah et al. 2024, ICLR). So the
// narrator gets the lines of the characters in the scene only (`present`, named by the question pass); the rule check still
// reads every line, to catch a character acting on what only others know. A secret is a fact its knowers keep hidden.
/** The [KNOWS] block: common knowledge, then each character's own facts, newest last; only `present` characters' lines
 *  when given. Empty when nothing is recorded. */
export function knowledgeBlock(st, present) {
    const facts = [...(st.facts ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    if (!facts.length)
        return '';
    const last = (list, n) => list.slice(-FACTS_SHOWN).map(f => `${f.text}${n && f.from?.[norm(n)] ? ` (${f.from[norm(n)]})` : ''}${f.secret ? ' [secret: kept hidden]' : ''}`).join(' | ');
    const lines = [];
    const common = facts.filter(f => f.everyone);
    if (common.length)
        lines.push(`Common knowledge: ${last(common)}`);
    const here = present?.length ? new Set(present.map(norm)) : null;
    const names = [...new Set(facts.flatMap(f => f.everyone ? [] : f.knowers))].filter(n => !here || here.has(norm(n)));
    for (const n of names) {
        const own = facts.filter(f => !f.everyone && f.knowers.some(k => norm(k) === norm(n)) && recalls(st, f, n));
        if (own.length)
            lines.push(`${n}: ${last(own, n)}`);
    }
    if (!lines.length)
        return '';
    return `[KNOWS]\nFixed facts of the story and who knows each${here ? ', for the characters in this scene' : ''}. A character knows common knowledge, their own line, and what they perceive in the scene now. A secret is kept hidden: asked about it, its keeper evades or lies (SocialResponse decides whether a lie is believed).\n${lines.join('\n')}\n[/KNOWS]`;
}
