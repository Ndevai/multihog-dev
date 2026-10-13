// Facts the story has fixed, and who knows each (docs/df-body-engine.md §6.12). Characters forget facts learned
// earlier when only recent text is injected; listing what each one already knows, injected every turn, cut that by 73 %
// (Key Facts Injection, Xiwei 2026, ICLR workshop on memory for LLM agents). Models answer as if a character knew
// what was said while they were absent (FANToM, Kim et al. 2023), so knowledge is kept per character in code.
import type { RuleState, Fact } from './types.js';

const norm = (s: unknown) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Facts shown per character and for common knowledge [ASSUMED; the newest are kept].
export const FACTS_SHOWN = 12;

// Each fact keeps its source ("told by X", "saw it"), so a character can doubt or trace hearsay (source-tagged beliefs:
// Versu, Evans & Short 2014; LoCoMo, Maharana et al. 2024, ACL).
/**
 * Records `text` as a fixed fact, adds `knowers`, marks it common knowledge when `everyone`. `sources` maps a knower to how
 * they learned it. Returns the fact.
 */
export function learn(st: RuleState, text: string, knowers: (string | null | undefined)[] = [], everyone = false, sources: Record<string, string> = {}): Fact {
    const facts = st.facts ??= [];
    st.factSeq = (st.factSeq ?? 0) + 1;
    let f = facts.find(x => norm(x.text) === norm(text));
    if (!f) { f = { id: facts.length + 1, text: String(text).trim(), knowers: [], everyone: false }; facts.push(f); }
    f.seq = st.factSeq;
    if (everyone) f.everyone = true;
    const from = f.from ??= {};
    for (const [k, v] of Object.entries(sources)) if (v && !from[norm(k)]) from[norm(k)] = String(v).trim();
    for (const k of knowers) if (k && !f.knowers.some(x => norm(x) === norm(k))) f.knowers.push(String(k).trim());
    // Learning it again (told again, seen again, using it) restarts its forgetting clock for those knowers.
    const now = st.clock ? st.clock.t + st.clock.add : null;
    if (now !== null) {
        const at = f.at ??= {}, age = f.ageAt ??= {};
        for (const k of knowers) if (k) {
            at[norm(k)] = now;
            const p = Object.entries(st.people ?? {}).find(([n]) => norm(n) === norm(k))?.[1];
            if (p?.age != null) age[norm(k)] = p.age; else delete age[norm(k)];
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
const AGES = [4, 6, 8, 18], Y1 = [0.357, 0.48, 0.70, 0.97], Y3 = [0.137, 0.297, 0.31, 0.623];
export function recallShare(years: number, age = 30): number {
    const i = AGES.findIndex(a => a >= age), j = i <= 0 ? Math.max(0, i) : i;
    const f = i <= 0 ? 0 : (age - AGES[i - 1]) / (AGES[i] - AGES[i - 1]);
    const at = (v: number[]) => i < 0 ? v[v.length - 1] : i === 0 ? v[0] : v[j - 1] + (v[j] - v[j - 1]) * f;
    const y1 = at(Y1), m = Math.log(y1 / at(Y3)) / Math.log(3);
    if (years <= 1) return 1 - (1 - y1) * Math.max(0, years);
    return Math.min(1, y1 * years ** -m);
}
const draw = (s: string) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 100000) / 100000; };
function recalls(st: RuleState, f: Fact, who: string): boolean {
    const now = st.clock ? st.clock.t + st.clock.add : null, at = f.at?.[norm(who)];
    if (now === null || at == null || f.everyone) return true;
    // The age that sets the rate is the knower's age when they learned it (Bauer & Larkina group by age at the events).
    return draw(`${f.id}|${norm(who)}|${f.text}`) < recallShare((now - at) / 525960, f.ageAt?.[norm(who)] ?? 30);
}

export const knows = (st: RuleState, name: string, text: string) => (st.facts ?? []).some(f => norm(f.text) === norm(text) && (f.everyone || f.knowers.some(k => norm(k) === norm(name))));

// What is not in the narrator's context cannot leak into another character's mouth: models revealed private information
// where people would not 39 % (GPT-4) and 57 % (ChatGPT) of the time (ConfAIde, Mireshghallah et al. 2024, ICLR). So the
// narrator gets the lines of the characters in the scene only (`present`, named by the question pass); the rule check still
// reads every line, to catch a character acting on what only others know. A secret is a fact its knowers keep hidden.
/** The [KNOWS] block: common knowledge, then each character's own facts, newest last; only `present` characters' lines
 *  when given. Empty when nothing is recorded. */
export function knowledgeBlock(st: RuleState, present?: string[]): string {
    const facts = [...(st.facts ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    if (!facts.length) return '';
    const last = (list: Fact[], n?: string) => list.slice(-FACTS_SHOWN).map(f => `${f.text}${n && f.from?.[norm(n)] ? ` (${f.from[norm(n)]})` : ''}${f.secret ? ' [secret: kept hidden]' : ''}`).join(' | ');
    const lines = [];
    const common = facts.filter(f => f.everyone);
    if (common.length) lines.push(`Common knowledge: ${last(common)}`);
    const here = present?.length ? new Set(present.map(norm)) : null;
    const names = [...new Set(facts.flatMap(f => f.everyone ? [] : f.knowers))].filter(n => !here || here.has(norm(n)));
    for (const n of names) { const own = facts.filter(f => !f.everyone && f.knowers.some(k => norm(k) === norm(n)) && recalls(st, f, n)); if (own.length) lines.push(`${n}: ${last(own, n)}`); }
    if (!lines.length) return '';
    return `[KNOWS]\nFixed facts of the story and who knows each${here ? ', for the characters in this scene' : ''}. A character knows common knowledge, their own line, and what they perceive in the scene now. A secret is kept hidden: asked about it, its keeper evades or lies (SocialResponse decides whether a lie is believed).\n${lines.join('\n')}\n[/KNOWS]`;
}
