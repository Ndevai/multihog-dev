// How strongly the scene points to each sense a verb can still mean (docs/df-body-engine.md §7.3, 2026-10-27 (108)).
// senses.ts leaves out the senses the object cannot meet; among those left, each cue the scene holds raises or lowers a
// sense's chance, and the cues add up: the senses start equal, each cue multiplies the odds of the senses it fits by its
// likelihood ratio, and the result is normalized (cue combination as in perception, Ernst & Banks 2002; word senses read
// from many weighted constraints at once, MacDonald, Pearlmutter & Seidenberg 1994). Senses that name the same tools are one
// reading: the outcome turns on the tool.
// Cues: the verb's sense earlier in this chat (one sense per discourse, Gale, Church & Yarowsky 1992), with the same object
// (one sense per collocation, Yarowsky 1993); a weapon the actor holds; a tool decided in the last messages; the scene's
// words that the sense's WordNet definition shares (Lesk 1986).
import { def, k } from './constants.js';
import { readings, kindsOf } from './senses.js';
import { toolsOfClass } from './router.js';
import { SENSE_GLOSS } from './data/sense-gloss.js';
def({ id: 'senseOneDiscourse', value: 0.94, unit: 'share of a word\'s later uses in one discourse with its earlier sense', status: 'sourced', src: 'Gale, Church & Yarowsky 1992 (HLT, "One sense per discourse"): 51 of 54 pairs of a polysemous noun in one encyclopedia article shared a sense; 98 % adjusted for unambiguous words', range: [0.9, 0.98], file: 'sense-odds.ts' });
def({ id: 'senseOneCollocation', value: 0.95, unit: 'share of a verb\'s uses with one object that keep one sense', status: 'sourced', src: 'Yarowsky 1993 (HLT, "One sense per collocation"), Table 3: verb-object pairs .95, binary ambiguities in 380 million words', range: [0.9, 0.97], file: 'sense-odds.ts' });
def({ id: 'senseInstrumentLR', value: 3, unit: 'likelihood ratio for a blow or a shot when the actor holds a weapon', status: 'assumed', src: 'a weapon in hand makes the sense that uses one likelier; no measure for roleplay', range: [1.5, 6], file: 'sense-odds.ts' });
def({ id: 'senseRecentLR', value: 2, unit: 'likelihood ratio for a sense whose tool was decided in the last messages', status: 'assumed', src: 'an act going on in the scene (a fight, a sale) makes its sense likelier, as topics persist; no measure for roleplay', range: [1.2, 4], file: 'sense-odds.ts' });
def({ id: 'senseGlossLR', value: 1.5, unit: 'likelihood ratio per scene word a sense\'s WordNet definition shares (at most 3)', status: 'assumed', src: 'Lesk 1986 counts the overlap; its weight per word is no published value', range: [1.1, 3], file: 'sense-odds.ts' });
def({ id: 'senseDraftShare', value: 0.8, unit: 'chance of the blow reading at which code drafts the blow itself', status: 'assumed', src: 'below it the planner reads the sense from the scene', range: [0.6, 0.95], file: 'sense-odds.ts' });
let CUES = null;
export const setSceneCues = (c) => { CUES = c; };
export const sceneCues = () => CUES;
const stem = (w) => w.toLowerCase().replace(/(?:ing|ed|es|s)$/, '').slice(0, 6);
const STOPWORD = /^(?:the|and|that|this|with|from|have|they|them|then|there|what|when|your|into|just|like|will|would|could|about|their|over|said|says|does)$/;
/** The readings of `verb` the line can still mean, grouped by the tools they name, each with its chance and the cues behind
 *  it; null when the senses left name one set of tools (nothing to weigh). */
export function senseOdds(verb, after, raw = '', names = [], cues = CUES) {
    const rd = readings(verb, after, raw, names);
    if (!rd)
        return null;
    const groups = new Map();
    for (const r of rd) {
        const t = toolsOfClass(r.cls), key = [...t].sort().join('+');
        (groups.get(key) ?? groups.set(key, { tools: t, classes: [] }).get(key)).classes.push(r.cls);
    }
    if (groups.size < 2)
        return null;
    const n = groups.size, logw = new Map([...groups.keys()].map(key => [key, 0])), why = new Map([...groups.keys()].map(key => [key, []]));
    const bump = (key, lr, cue) => { logw.set(key, logw.get(key) + Math.log(lr)); why.get(key).push(cue); };
    if (cues) {
        // The verb's earlier reading in this chat, by the tools its turn called; with the same object, the stronger cue.
        const head = (() => { const i = after.findIndex(w => kindsOf(w)); return i >= 0 ? after[i] : ''; })();
        const prev = [...cues.earlier].reverse().filter(e => e.verb === verb);
        const same = prev.find(e => e.head && e.head === head), last = same ?? prev[0];
        if (last) {
            const key = [...groups.entries()].find(([, g]) => g.tools.length && g.tools.some(t => last.tools.includes(t)))?.[0] ?? (last.tools.length ? null : '');
            if (key != null && groups.has(key)) {
                const p = same ? k('senseOneCollocation') : k('senseOneDiscourse');
                bump(key, p * (n - 1) / (1 - p), same ? `read so earlier with "${head}"` : 'read so earlier in this chat');
            }
        }
        // A weapon in the actor's hand: the blow or the shot.
        const weapon = cues.held.find(h => { const kk = kindsOf(h.split(' ').pop() ?? h); return !!kk && /[wgp]/.test(kk.all); });
        if (weapon)
            for (const [key, g] of groups)
                if (g.tools.some(t => t === 'BodyStrike' || t === 'BodyCheck'))
                    bump(key, k('senseInstrumentLR'), `holds ${weapon}`);
        // A tool decided in the last messages: the act going on.
        for (const [key, g] of groups) {
            const t = g.tools.find(x => cues.recentTools.includes(x));
            if (t)
                bump(key, k('senseRecentLR'), `${t} decided just before`);
        }
        // The scene's words a sense's definition shares (Lesk 1986), at most three per reading.
        const scene = new Set(cues.words.map(w => w.toLowerCase()).filter(w => w.length > 3 && !STOPWORD.test(w) && w !== verb).map(stem));
        for (const [key, g] of groups) {
            const bag = new Set(g.classes.flatMap(c => (SENSE_GLOSS[verb]?.[c] ?? '').split(' ')).filter(Boolean).map(stem));
            const shared = [...bag].filter(w => scene.has(w)).slice(0, 3);
            if (shared.length)
                bump(key, k('senseGlossLR') ** shared.length, `the scene says ${shared.join(', ')}`);
        }
    }
    const max = Math.max(...logw.values()), z = [...logw.values()].reduce((s, v) => s + Math.exp(v - max), 0);
    return [...groups.entries()].map(([key, g]) => ({ tools: g.tools, p: Math.exp(logw.get(key) - max) / z, why: why.get(key) })).sort((a, b) => b.p - a.p);
}
/** The chance of the readings that name `tool`. */
export const shareOf = (odds, tool) => odds.filter(o => o.tools.includes(tool)).reduce((s, o) => s + o.p, 0);
