import { def, k } from './constants.js';
import { phi } from './acoustics.js';
import { driftShares, heldAs, beliefWords, vividWords, sourceShare, kindGap, teller, withoutTeller, detailsOf } from './memory-drift.js';
import { heldBy, heldText, toldPhrase, headNouns } from './memory-meaning.js';
import { onTheTongue, totPhrase } from './tongue.js';
const massedMin = () => k('massedDays') * 1440;
const norm = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
// Facts shown per character and for common knowledge [ASSUMED; the newest are kept].
export const FACTS_SHOWN = 12;
/**
 * Records `text` as a fact, adds `knowers`, marks it common knowledge when `everyone`. `sources` maps a knower to how they
 * learned it; `standing` is how the world stands to it (the world's when not given, for a new fact). Returns the fact.
 */
export function learn(st, text, knowers = [], everyone = false, sources = {}, standing) {
    const facts = st.facts ??= [];
    st.factSeq = (st.factSeq ?? 0) + 1;
    let f = facts.find(x => norm(x.text) === norm(text));
    if (!f) {
        f = { id: facts.length + 1, text: String(text).trim(), knowers: [], everyone: false };
        facts.push(f);
        if (standing && standing !== 'world')
            f.standing = standing;
    }
    else if (standing === 'world') {
        delete f.standing;
        delete f.versionOf;
    }
    else if (standing === 'version' && f.standing === 'said')
        f.standing = 'version';
    f.seq = st.factSeq;
    if (everyone) {
        f.everyone = true;
        delete f.standing;
        delete f.versionOf;
    }
    // Where each knower met it: the spot they stand at (Person.at), for the place's cue (recallStrength).
    for (const k of knowers)
        if (k) {
            const here = Object.entries(st.people ?? {}).find(([n]) => norm(n) === norm(k))?.[1]?.at;
            if (!here)
                continue;
            const list = (f.where ??= {})[norm(k)] ??= [];
            if (!list.includes(here))
                list.push(here);
            if (list.length > 8)
                list.shift();
        }
    const from = f.from ??= {};
    for (const [k, v] of Object.entries(sources))
        if (v && !from[norm(k)])
            from[norm(k)] = String(v).trim();
    for (const k of knowers)
        if (k && !f.knowers.some(x => norm(x) === norm(k)))
            f.knowers.push(String(k).trim());
    // Learning it again (told again, seen again, using it) adds an encounter for those knowers (see recalls); a second one
    // within a day replaces the first.
    const now = st.clock ? st.clock.t + st.clock.add : null;
    if (now !== null) {
        const at = f.at ??= {}, age = f.ageAt ??= {}, times = f.times ??= {};
        for (const k of knowers)
            if (k) {
                const list = times[norm(k)] ??= at[norm(k)] != null ? [at[norm(k)]] : [];
                if (list.length && now - list[list.length - 1] < massedMin())
                    list[list.length - 1] = now;
                else
                    list.push(now);
                if (list.length > 50)
                    list.splice(0, list.length - 50);
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
/** How old the fact is in `who`'s memory, in years, as one encounter of the same strength; null for common knowledge and for
 * a fact with no time kept. */
export function memoryYears(st, f, who) {
    const now = st.clock ? st.clock.t + st.clock.add : null, at = f.at?.[norm(who)];
    if (now === null || at == null || f.everyone)
        return null;
    // The age that sets the rate is the knower's age when they learned it (Bauer & Larkina group by age at the events).
    // Every encounter counts (ACT-R base-level learning, Anderson et al. 2004, Psychol Rev 111:1036): strength = ln Σ t_j^−d
    // over the times since each encounter, d = 0.5 (the default "over a large range of applications"); the curves above are
    // for one encounter, so they are read at the single age with the same strength, (Σ t_j^−0.5)^−2. Two encounters a year
    // apart, read a year after the second, recall like one 4 months old. Encounters less than a day apart count once
    // [ASSUMED: massed repetition adds little that lasts, the spacing effect].
    const list = f.times?.[norm(who)]?.length ? f.times[norm(who)] : [at];
    const sum = list.reduce((s, t) => s + Math.max(1 / 525960, (now - t) / 525960) ** -k('actrDecay'), 0);
    return sum ** (-1 / k('actrDecay'));
}
/** Whether `who` recalls the fact now: their one fixed draw for it under its recall share (recallStrength). */
export function recalls(st, f, who) {
    return draw(`${f.id}|${norm(who)}|${f.text}`) < recallStrength(st, f, who);
}
/** The share of people like `who` who would recall the fact now (1 for common knowledge and for a fact with no time kept). */
export function recallStrength(st, f, who) {
    const years = memoryYears(st, f, who);
    if (years === null)
        return 1;
    // Importance (E33): the event curve is fitted to events a person singled out as notable, taken as importance 7 of 10; each
    // point below runs the clock faster and each above slower, by a factor 2^((7 − importance) ÷ 3) [ASSUMED: form and step],
    // so a meal (1) fades four times as fast and a death (10) half as fast. Facts with no importance keep the curve as it is.
    const pace = f.kind === 'knowledge' || f.imp == null ? 1 : 2 ** ((k('notableImportance') - f.imp) / k('importanceDoubling'));
    const share = f.kind === 'knowledge' ? knowledgeShare(years) : recallShare(years * pace, f.ageAt?.[norm(who)] ?? 30);
    // The place's cue (the player's pick, 2026-11-16: "can come back while there"): recall in the environment of learning beats
    // recall elsewhere by d = 0.28 (Smith & Vela 2001, Psychon Bull Rev 8:203, meta-analysis of environmental
    // context-dependent memory), applied as a shift of the share's probit [ASSUMED, as social.ts applies Fischer et al.'s g]
    // while the knower stands at a spot where they met the fact. The draw stays fixed, so a fact the place brings back
    // fades again when they leave.
    return atPlaceOf(st, f, who) ? phi(probit(share) + k('placeCueD')) : share;
}
/** Whether `who` stands now at a spot where they met the fact. */
export function atPlaceOf(st, f, who) {
    const here = Object.entries(st.people ?? {}).find(([n]) => norm(n) === norm(who))?.[1]?.at;
    return !!here && !!f.where?.[norm(who)]?.includes(here);
}
const probit = (p) => { if (p >= 1)
    return 8; if (p <= 0)
    return -8; let lo = -8, hi = 8; for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    if (phi(m) < p)
        lo = m;
    else
        hi = m;
} return (lo + hi) / 2; };
def({ id: 'placeCueD', value: 0.28, unit: 'Cohen\'s d of recall in the place of learning over recall elsewhere', status: 'sourced', src: 'Smith & Vela 2001, Psychon Bull Rev 8:203 (93 effect sizes); range none to twice [ASSUMED]', range: [0, 0.56], file: 'knowledge.ts' });
/** Takes `who` off a fact's knowers, with their source, times and places (a memory that gave way). */
export function unlearn(f, who) {
    const w = norm(who);
    f.knowers = f.knowers.filter(k => norm(k) !== w);
    for (const rec of [f.from, f.at, f.times, f.ageAt, f.where])
        if (rec)
            delete rec[w];
}
/** The facts `who` holds and recalls now (common knowledge included), with a recalled version standing in for the world's
 * fact it replaces: the character's memory as they would tell it. */
export function heldFacts(st, who, list = st.facts ?? []) {
    const w = norm(who), held = list.filter(f => (f.everyone || f.knowers.some(k => norm(k) === w)) && recalls(st, f, who));
    const replaced = new Set(held.filter(f => f.standing === 'version' && f.versionOf != null).map(f => f.versionOf));
    return held.filter(f => !replaced.has(f.id));
}
/** A fact's mark in [KNOWS]: what someone said, or the world's own fact where it holds otherwise. */
export function standingMark(st, f) {
    if (f.standing === 'said')
        return ' [as said]';
    if (f.standing !== 'version')
        return '';
    const w = f.versionOf != null ? (st.facts ?? []).find(x => x.id === f.versionOf) : undefined;
    return ` [the world holds otherwise${w ? `: ${w.text.replace(/[.!?]?$/, '')}` : ''}]`;
}
/**
 * How `who` holds where the fact came from now (memory-drift.ts, Bornstein & LeCompte 1995): the source as recorded; told
 * without the person when that has gone; undefined when the kind of source has gone too, or none was recorded. A fact with no
 * time kept keeps its source. Each knower keeps one fixed draw for the kind and one for the person, so a source once gone
 * stays gone while the fact weakens, and comes back with it when the fact is met again.
 */
export function heldSource(st, f, who) {
    const how = f.from?.[norm(who)];
    if (!how || memoryYears(st, f, who) === null)
        return how;
    const s = recallStrength(st, f, who);
    if (!(draw(`${f.id}|${norm(who)}|source kind`) < sourceShare(s, kindGap(how))))
        return undefined;
    if (teller(how) && !(draw(`${f.id}|${norm(who)}|source person`) < sourceShare(s, k('gapWho'))))
        return withoutTeller(how);
    return how;
}
/** Of a fact's details, how many `who` would tell the same, changed and left out now: one fixed draw per detail against the
 *  shares of memory-drift.ts driftShares, so a detail once changed stays changed as the memory ages. */
export function driftOf(st, f, who) {
    const d = driftDetails(st, f, who);
    if (!d)
        return null;
    return { details: d.words.length, changed: d.fates.filter(x => x === 'changed').length, left: d.fates.filter(x => x === 'left').length, days: d.days };
}
/** The words of the story's people's names where a text names them ("the third neighbour"). They are kept as written
 *  (2026-11-17, section 101): who a memory is about is held by its source and its knowers, and a name drifting into its kind
 *  ("the third actor") is no memory people have [ASSUMED]. */
export function nameWords(st, text) {
    const out = new Set(), low = ` ${text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
    for (const n of Object.keys(st.people ?? {})) {
        const k = n.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        if (k && low.includes(` ${k} `))
            for (const w of k.split(' '))
                out.add(w);
    }
    return out;
}
/** Each of a fact's details as `who` holds it now: kept, changed or left out, by the same fixed draw per detail driftOf counts,
 *  and for each a second fixed draw for the way it drifts (memory-meaning.ts heldBy: which neighbour, which other name); the
 *  words of a person's name kept. */
export function driftDetails(st, f, who) {
    const years = memoryYears(st, f, who);
    if (years === null || f.kind === 'knowledge')
        return null;
    const days = years * 365.25, sh = driftShares(days), words = detailsOf(f.text), names = nameWords(st, f.text);
    const fates = words.map((w, i) => { const u = draw(`${f.id}|${norm(who)}|detail ${i}`); return names.has(w.toLowerCase()) ? 'kept' : u < sh.changed ? 'changed' : u < 1 - sh.kept ? 'left' : 'kept'; });
    return { words, fates, ways: words.map((_, i) => draw(`${f.id}|${norm(who)}|detail ${i}|way`)), days };
}
/** How each drifted detail of a fact is held by `who` now, by its meaning (memory-meaning.ts), and the fact in those terms. */
export function heldMeaning(st, f, who) {
    const d = driftDetails(st, f, who);
    if (!d)
        return null;
    const nouns = headNouns(f.text), told = d.words.flatMap((w, i) => d.fates[i] === 'kept' ? [] : [heldBy(w, d.fates[i], d.ways[i], st.alike ?? [], nouns.has(w))]);
    return { told, as: told.length ? heldText(f.text, told) : f.text };
}
export const span = (days) => days < 14 ? `${Math.round(days)} days` : days < 61 ? `${Math.round(days / 7)} weeks` : days < 730 ? `${Math.round(days / 30.44)} months` : `${Math.round(days / 365.25)} years`;
/** How `who` holds a memory a day or more after learning it: the time since, how sure and how clearly in words, and of its
 *  details how many would come out changed and how many left out (memory-drift.ts); null for common knowledge, for knowledge
 *  learned by study, for a fact with no time kept, and in its first day. The narrator's mark and the player's sheet both
 *  read it. */
export function memoryState(st, f, who) {
    const d = driftOf(st, f, who);
    if (!d || d.days < 1)
        return null;
    const h = heldAs(d.days, f.imp ?? 5), m = heldMeaning(st, f, who);
    return { since: span(d.days), sure: beliefWords(h.belief), clear: vividWords(h.vivid), details: d.details, changed: d.changed, left: d.left, told: m.told, as: m.as };
}
/** A memory's mark in [KNOWS] a day or more after it was learned: the time since, how sure its holder is and how clearly they
 *  see it, and how many of its details they would tell changed or leave out. Empty for common knowledge, for knowledge
 *  learned by study, and for a fact with no time kept. */
export function memoryMark(st, f, who) {
    const m = memoryState(st, f, who);
    if (!m)
        return '';
    // Since 2026-11-17 (section 97, the memory of meaning): each drifted detail as it is held, by what it means.
    const told = m.told.map(toldPhrase).join(', ');
    return ` [${m.since} on: ${m.sure}, ${m.clear}${told ? `; told now: ${told}` : ''}]`;
}
def({ id: 'actrDecay', value: 0.5, unit: 'power of each encounter\'s decay', status: 'sourced', src: 'ACT-R default d (Anderson et al. 2004, Psychol Rev 111:1036)', range: [0.3, 0.7], file: 'knowledge.ts' });
def({ id: 'massedDays', value: 1, unit: 'days within which a repeat counts as the same encounter', status: 'assumed', src: 'spacing effect: massed repetition adds little long-term retention', range: [0.04, 3], file: 'knowledge.ts' });
def({ id: 'notableImportance', value: 7, unit: 'importance 1–10', status: 'assumed', src: 'the importance of the "notable" events of Bauer & Larkina 2016', range: [5, 9], file: 'knowledge.ts' });
def({ id: 'importanceDoubling', value: 3, unit: 'importance points per doubling of the forgetting time', status: 'assumed', src: 'event importance was the strongest predictor of memory and emotion duration (no slope held)', range: [1.5, 6], file: 'knowledge.ts' });
// Working memory (Cowan 2001, "The magical number 4 in short-term memory", Behav Brain Sci 24:87): what can be held at once
// is about four chunks; group means of adults 3–5, individual means 2 to 6. A message heard once that lists more separate
// items (a list of errands, a string of directions) leaves the listener with that many: each person's span drawn once,
// normal about 4 with SD 1, kept within 2–6 [ASSUMED form; range from Cowan §3.5]. The ones kept are the first and the last
// (primacy and recency) [ASSUMED]. Items are the parts between commas or semicolons, four or more; "and" alone does not split.
/** The items of a list-like message, or null when it is not a list of four or more. */
export function listItems(message) {
    const parts = String(message).trim().replace(/[.!?]$/, '').split(/\s*;\s*|\s*,\s*(?:(?:and|then|or|and then)\s+)?/i).map(x => x.trim()).filter(Boolean);
    return parts.length >= 4 ? parts : null;
}
/** What a listener with working-memory `span` keeps of a message heard once: the kept text and how many items fell out. */
export function heldOfMessage(message, span) {
    const items = listItems(message), n = Math.max(2, Math.min(6, Math.round(span)));
    if (!items || items.length <= n)
        return { kept: message, total: items?.length ?? 1, dropped: 0 };
    const head = Math.ceil(n / 2), tail = n - head, kept = [...items.slice(0, head), ...items.slice(items.length - tail)];
    return { kept: `${kept.join('; ')} (the rest of the list lost)`, total: items.length, dropped: items.length - n };
}
export const knows = (st, name, text) => (st.facts ?? []).some(f => norm(f.text) === norm(text) && (f.everyone || f.knowers.some(k => norm(k) === norm(name))));
// What is not in the narrator's context cannot leak into another character's mouth: models revealed private information
// where people would not 39 % (GPT-4) and 57 % (ChatGPT) of the time (ConfAIde, Mireshghallah et al. 2024, ICLR). So the
// narrator gets the lines of the characters in the scene only (`present`, named by the question pass); the rule check still
// reads every line, to catch a character acting on what only others know. A secret is a fact its knowers keep hidden.
/** The [KNOWS] block: common knowledge, then each character's own facts, newest last; only `present` characters' lines
 *  when given. Empty when nothing is recorded. */
// Which facts a character has in mind when there are more than FACTS_SHOWN: retrieval score = recency + importance +
// relevance, each min-max scaled to 0–1 over the candidates, equal weights (Park et al. 2023, "Generative Agents", UIST,
// §4.1). Recency decays × 0.995 per story hour since the fact was learned (Park: since last retrieved [ASSUMED: learned]);
// without a clock, per fact recorded since. Importance 1–10 as recorded (RecordFact `importance`, Park's scale: 1 mundane,
// 10 life-changing; 5 when not given [ASSUMED]). Relevance: share of the fact's content words found in the last two
// messages [ASSUMED: word overlap stands in for Park's embedding similarity]. The chosen facts are shown oldest first.
const STOP = new Set('the a an and or of to in on at by for with from is was were are be been his her their its this that it he she they them him as not no but into out up'.split(' '));
const words = (t) => new Set(t.toLowerCase().match(/[\p{L}\p{N}]+/gu)?.filter(w => w.length > 2 && !STOP.has(w)) ?? []);
export function pickFacts(st, list, who, scene, n = FACTS_SHOWN) {
    if (list.length <= n)
        return list;
    const now = st.clock ? st.clock.t + st.clock.add : null, maxSeq = Math.max(...list.map(f => f.seq ?? 0)), sw = words(scene);
    const raw = list.map(f => {
        const at = who ? f.at?.[norm(who)] : undefined;
        const hours = now !== null && at != null ? Math.max(0, (now - at) / 60) : maxSeq - (f.seq ?? 0);
        const fw = words(f.text), hit = [...fw].filter(w => sw.has(w)).length;
        return { f, rec: 0.995 ** hours, imp: f.imp ?? 5, rel: fw.size ? hit / fw.size : 0 };
    });
    const scale = (k) => { const v = raw.map(r => r[k]), lo = Math.min(...v), hi = Math.max(...v); return (x) => hi > lo ? (x - lo) / (hi - lo) : 0; };
    const [r, i, l] = [scale('rec'), scale('imp'), scale('rel')];
    const top = raw.map(x => ({ f: x.f, s: r(x.rec) + i(x.imp) + l(x.rel) })).sort((a, b) => b.s - a.s).slice(0, n).map(x => x.f);
    return list.filter(f => top.includes(f));
}
export function knowledgeBlock(st, present, scene = '') {
    const facts = [...(st.facts ?? [])].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
    if (!facts.length)
        return '';
    const last = (list, n) => pickFacts(st, list, n, scene).map(f => { const how = n ? heldSource(st, f, n) : undefined; return `${f.text}${how ? ` (${how})` : ''}${standingMark(st, f)}${n ? memoryMark(st, f, n) : ''}${f.secret ? ' [secret: kept hidden]' : ''}`; }).join(' | ');
    const lines = [];
    const common = facts.filter(f => f.everyone);
    if (common.length)
        lines.push(`Common knowledge: ${last(common)}`);
    const here = present?.length ? new Set(present.map(norm)) : null;
    const names = [...new Set(facts.flatMap(f => f.everyone ? [] : f.knowers))].filter(n => !here || here.has(norm(n)));
    // Names on the tip of the tongue (tongue.ts, section 103): known, and out of reach this hour.
    for (const n of names) {
        const own = heldFacts(st, n, facts.filter(f => !f.everyone)), tot = onTheTongue(st, n, own);
        if (own.length)
            lines.push(`${n}: ${last(own, n)}${tot.length ? ` | On the tip of the tongue now: ${tot.map(t => totPhrase(t)).join('; ')}` : ''}`);
    }
    if (!lines.length)
        return '';
    return `[KNOWS]\nWhat each character holds in memory and how they came by it${here ? ', for the characters in this scene' : ''}. Each item is the world's, as written, except: [as said] marks what someone said, which the world holds where an item of its own says the same; [the world holds otherwise] marks a memory or a saying the world does not hold, with the world's own item when one is recorded. A character speaks, acts and expects by what they hold; papers, signs, objects, places and the people who do not hold that item follow the world. Where it came from stands in brackets while they still hold it. [N days, weeks, months or years on] gives how sure they are of a memory and how clearly they see it, and, after "told now", how each detail that has drifted comes out when they tell it or act on it now, by its meaning: "held only as" a broader kind (say it so), "as another" of a kind (choose one), as a neighbouring day or a round number, forgotten (leave it out), or in other words; they hold a changed one as surely as the rest. Past the moment it was said, they keep what was meant, not the words: quoting it, they say it their own way. The narration of what happens follows the world. "On the tip of the tongue now" names a person whose name will not come to them this hour: they know who it is and can say what is given of the name, but reaching for it, they cannot say it, and it may come back later. A character knows common knowledge, their own line, and what they perceive in the scene now. A secret is kept hidden: asked about it, its keeper evades or lies (SocialResponse decides whether a lie is believed).\n${lines.join('\n')}\n[/KNOWS]`;
}
