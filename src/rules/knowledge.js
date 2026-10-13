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
        const at = f.at ??= {}, age = f.ageAt ??= {};
        for (const k of knowers)
            if (k) {
                at[norm(k)] = now;
                const p = Object.entries(st.people ?? {}).find(([n]) => norm(n) === norm(k))?.[1];
                if (p?.age != null)
                    age[norm(k)] = p.age;
                else
                    delete age[norm(k)];
            }
    }
    return f;
}
// Forgetting. Events a person singled out as notable, recalled unprompted (Bauer & Larkina 2016, Memory 24:1345, Table 7:
// share of 3 target events recalled after 1, 2 and 3 years, by age at the events): age 4: 36, 27, 14 %; age 6: 48, 32,
// 30 %; age 8: 70, 54, 31 %; adults: 97, 70, 62 %. Retention curves of every kind are fit as well by a power function as by
// any (Rubin & Wenzel 1996, Psychol Rev 103:734, 210 data sets), so y = y1 · t^(−m), t in years, through each age's 1- and
// 3-year points; under 1 year from 100 % to y1 linearly [ASSUMED]; ages between the groups linear, adult from 18 [ASSUMED].
// Common knowledge does not fade. A fact is not deleted: it drops out of [KNOWS] for that knower, the record stays, and
// learning it again brings it back. Each knower keeps one fixed draw per fact, so a fact once forgotten stays forgotten
// (the curve only falls) until relearned.
// Age 3 (childhood amnesia: Bauer & Larkina 2014, Memory 22:907): events from age 3 were recalled by 60 % or more of
// their number at ages 5–7 and 64 % at 7, then 36 % at 8 and 34 % at 9; read as 62 % to 4 years, 36 % at 5, 34 % at 6,
// then the age-4 slope [ASSUMED beyond the data].
const AGE3 = [[0, 1], [2, 0.62], [4, 0.62], [5, 0.36], [6, 0.34]];
// Knowledge learned by study (names, concepts, facts of a field), not events: cued recall fell over the first 36–48 months
// and then held for the remaining 8 years (Conway, Cohen & Stanhope 1991, J Exp Psychol Gen 120:395, Figure 2: about 58 %
// at 3 months, 27 % from 39 months, read from the figure); a level that then holds for decades (Bahrick 1984's permastore).
// So knowledge = 0.47 + 0.53 e^(−t / 1.16 y): 47 % = 27/58 kept for good, the time constant through the 15-month point.
export function knowledgeShare(years) {
    return 0.47 + 0.53 * Math.exp(-Math.max(0, years) / 1.16);
}
const AGES = [4, 6, 8, 18], Y1 = [0.357, 0.48, 0.70, 0.97], Y3 = [0.137, 0.297, 0.31, 0.623];
export function recallShare(years, age = 30) {
    if (age < 4) {
        const t = Math.max(0, years), i = AGE3.findIndex(([y]) => y >= t);
        if (i < 0)
            return 0.34 * (t / 6) ** -(Math.log(Y1[0] / Y3[0]) / Math.log(3));
        if (i === 0)
            return 1;
        const [y0, p0] = AGE3[i - 1], [y1, p1] = AGE3[i];
        return p0 + (p1 - p0) * (t - y0) / (y1 - y0);
    }
    const i = AGES.findIndex(a => a >= age), j = i <= 0 ? Math.max(0, i) : i;
    const f = i <= 0 ? 0 : (age - AGES[i - 1]) / (AGES[i] - AGES[i - 1]);
    const at = (v) => i < 0 ? v[v.length - 1] : i === 0 ? v[0] : v[j - 1] + (v[j] - v[j - 1]) * f;
    const y1 = at(Y1), m = Math.log(y1 / at(Y3)) / Math.log(3);
    if (years <= 1)
        return 1 - (1 - y1) * Math.max(0, years);
    return Math.min(1, y1 * years ** -m);
}
const draw = (s) => { let h = 2166136261; for (const c of s)
    h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
export function recalls(st, f, who) {
    const now = st.clock ? st.clock.t + st.clock.add : null, at = f.at?.[norm(who)];
    if (now === null || at == null || f.everyone)
        return true;
    // The age that sets the rate is the knower's age when they learned it (Bauer & Larkina group by age at the events).
    const years = (now - at) / 525960;
    return draw(`${f.id}|${norm(who)}|${f.text}`) < (f.kind === 'knowledge' ? knowledgeShare(years) : recallShare(years, f.ageAt?.[norm(who)] ?? 30));
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
