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
    return f;
}

export const knows = (st: RuleState, name: string, text: string) => (st.facts ?? []).some(f => norm(f.text) === norm(text) && (f.everyone || f.knowers.some(k => norm(k) === norm(name))));

/** The [KNOWS] block: common knowledge, then each character's own facts, newest last. Empty when nothing is recorded. */
export function knowledgeBlock(st: RuleState): string {
    const facts = [...(st.facts ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    if (!facts.length) return '';
    const last = (list: Fact[], n?: string) => list.slice(-FACTS_SHOWN).map(f => n && f.from?.[norm(n)] ? `${f.text} (${f.from[norm(n)]})` : f.text).join(' | ');
    const lines = [];
    const common = facts.filter(f => f.everyone);
    if (common.length) lines.push(`Common knowledge: ${last(common)}`);
    const names = [...new Set(facts.flatMap(f => f.everyone ? [] : f.knowers))];
    for (const n of names) lines.push(`${n}: ${last(facts.filter(f => !f.everyone && f.knowers.some(k => norm(k) === norm(n))), n)}`);
    return `[KNOWS]\nFixed facts of the story and who knows each. A character knows common knowledge, their own line, and what they perceive in the scene now.\n${lines.join('\n')}\n[/KNOWS]`;
}
