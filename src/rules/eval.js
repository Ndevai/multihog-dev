// Scores the question pass on the scenes of eval-scenes.ts (docs/df-body-engine.md §7.4): which tools it calls (precision,
// recall), whether the arguments that decide each outcome are right, and whether it stays quiet when nothing is in doubt.
// A call counts as made only when it would run: known tool, required arguments present, arguments passing the schema check.
import { QUESTION_SYSTEM, questionPrompt, rawCalls, pickTools } from './question-pass.js';
import { REGISTRY } from './rules-tools.js';
import { checkArgs } from './tool-schema.js';
import { EVAL_SCENES, EVAL_TRACKER } from './eval-scenes.js';
// Extra calls never counted against a scene: recording a fact the scene shows, or fixing who an undescribed person is,
// takes an invention away from the narrator and is never wrong.
const ALWAYS_ALLOWED = new Set(['RecordFact', 'NewCharacter']);
const fold = (v) => String(v ?? '').toLowerCase().replace(/\s+/g, ' ').trim();
function at(args, path) {
    let v = args;
    for (const k of path.split('.'))
        v = v == null ? undefined : v[k];
    return v;
}
function passes(v, c) {
    if (v === undefined || v === null)
        return false;
    if (typeof c === 'number')
        return Number(v) === c;
    if (typeof c === 'string')
        return c.startsWith('~') ? fold(v).includes(fold(c.slice(1))) : fold(v) === fold(c);
    if (Array.isArray(c))
        return Number(v) >= c[0] && Number(v) <= c[1];
    if ('has' in c)
        return Array.isArray(v) && v.some(x => fold(x) === fold(c.has));
    return Array.isArray(v) && v.length >= c.minLen;
}
/** Scores one scene's calls: each expected call is matched to the predicted call of that tool that passes most checks. */
export function scoreScene(scene, calls) {
    const valid = [], invalid = [];
    for (const c of calls) {
        const t = REGISTRY.get(c.tool);
        const r = t ? checkArgs(t.properties, t.required, c.args) : { args: c.args, errors: ['unknown tool'] };
        if (r.errors.length)
            invalid.push(`${c.tool}: ${r.errors.join('; ')}`);
        else
            valid.push({ tool: c.tool, args: r.args });
    }
    const used = new Set(), failed = [];
    let matched = 0, checks = 0, passed = 0;
    for (const e of scene.expect) {
        const entries = Object.entries(e.args ?? {});
        checks += entries.length;
        let best = -1, bestPass = -1;
        valid.forEach((c, i) => {
            if (used.has(i) || c.tool !== e.tool)
                return;
            const n = entries.filter(([k, chk]) => passes(at(c.args, k), chk)).length;
            if (n > bestPass) {
                best = i;
                bestPass = n;
            }
        });
        if (best < 0) {
            failed.push(`missing ${e.tool}`);
            continue;
        }
        used.add(best);
        matched++;
        passed += bestPass;
        for (const [k, chk] of entries)
            if (!passes(at(valid[best].args, k), chk))
                failed.push(`${e.tool}.${k}: ${JSON.stringify(at(valid[best].args, k))} ≠ ${JSON.stringify(chk)}`);
    }
    const allow = new Set([...(scene.allow ?? []), ...ALWAYS_ALLOWED]);
    const extra = valid.filter((c, i) => !used.has(i) && !allow.has(c.tool)).map(c => c.tool);
    return { id: scene.id, ok: matched === scene.expect.length && passed === checks && !extra.length, expected: scene.expect.map(e => e.tool),
        got: calls.map(c => c.tool), matched, extra, checks, passed, failed, invalid };
}
/** Runs the scenes through `send` (the question pass's model) one after another. */
export async function runEval(send, scenes = EVAL_SCENES, onProgress, stopped = () => false) {
    const results = [];
    for (const [i, s] of scenes.entries()) {
        if (stopped()) {
            scenes = scenes.slice(0, i);
            break;
        }
        const chat = [{ name: 'NARRATOR', mes: s.context }, { is_user: true, name: 'PLAYER', mes: s.player }];
        let text = '', failedRequest = false;
        // The same two steps as play: the tool-picking call, then the question call with full arguments for the picked tools
        // only (before 2026-10-19 the eval showed every tool in full, about 15,000 tokens, which play never does).
        let only;
        try {
            only = await pickTools(chat, send) ?? undefined;
            text = await send(QUESTION_SYSTEM, questionPrompt(chat, '', s.tracker ?? EVAL_TRACKER, only));
        }
        catch (e) {
            failedRequest = true;
            console.warn('[Rules eval] scene', s.id, e);
        }
        const r = scoreScene(s, rawCalls(text));
        if (only)
            for (const e of s.expect)
                if (!only.has(e.tool))
                    r.failed.unshift(`picking step left out ${e.tool}`);
        if (failedRequest)
            r.invalid.push('request failed');
        else if (!/"calls"/.test(text))
            r.invalid.push('no JSON with "calls"');
        results.push(r);
        onProgress?.(i + 1, scenes.length);
    }
    return report(scenes, results);
}
export function report(scenes, results) {
    const sum = (f) => results.reduce((a, r) => a + f(r), 0);
    const expected = sum(r => r.expected.length), matched = sum(r => r.matched);
    const predicted = sum(r => r.matched + r.extra.length);
    const quiet = results.filter((r, i) => !scenes[i].expect.length);
    const byTool = {};
    for (const [i, s] of scenes.entries())
        for (const e of s.expect) {
            const b = byTool[e.tool] ??= { expected: 0, found: 0 };
            b.expected++;
            if (!results[i].failed.includes(`missing ${e.tool}`))
                b.found++;
        }
    const pct = (a, b) => b ? Math.round(1000 * a / b) / 10 : 100;
    return { scenes: results.length, correct: results.filter(r => r.ok).length, toolPrecision: predicted ? pct(matched, predicted) : null, toolRecall: pct(matched, expected),
        argAccuracy: pct(sum(r => r.passed), sum(r => r.checks)), quietWhenNothing: pct(quiet.filter(r => r.ok).length, quiet.length), byTool, results };
}
/** The report as text: totals, the tools most often missed, the first failing scenes. */
export function reportText(r) {
    const missed = Object.entries(r.byTool).filter(([, b]) => b.found < b.expected).sort((a, b) => (a[1].found / a[1].expected) - (b[1].found / b[1].expected))
        .slice(0, 6).map(([t, b]) => `${t} ${b.found}/${b.expected}`).join(', ') || 'none';
    const fails = r.results.filter(x => !x.ok).slice(0, 8).map(x => `#${x.id} expected [${x.expected.join(', ')}] got [${x.got.join(', ')}]${x.failed.length ? `; ${x.failed.slice(0, 2).join('; ')}` : ''}${x.extra.length ? `; extra ${x.extra.join(', ')}` : ''}${x.invalid.length ? `; invalid ${x.invalid[0]}` : ''}`).join('\n');
    return `Question pass on ${r.scenes} scenes: ${r.correct} fully correct (${Math.round(100 * r.correct / Math.max(1, r.scenes))} %). Tool precision ${r.toolPrecision ?? 'n/a (no calls)'}${r.toolPrecision == null ? '' : ' %'}, recall ${r.toolRecall} %, deciding arguments right ${r.argAccuracy} %, quiet when nothing is in doubt ${r.quietWhenNothing} %. Tools missed most: ${missed}.${fails ? `\n${fails}` : ''}`;
}
/** /rules-eval [n]: runs the first n scenes (all by default) through the question pass's model and reports the score. */
export function registerRulesEvalCommand(send) {
    const ctx = SillyTavern.getContext();
    if (!ctx.SlashCommand || !ctx.SlashCommandParser)
        return;
    const toast = globalThis.toastr;
    ctx.SlashCommandParser.addCommandObject(ctx.SlashCommand.fromProps({
        name: 'rules-eval',
        helpString: 'Score the rules question pass on built-in scenes with the State Model connection: tool precision and recall, deciding arguments, quiet when nothing is in doubt. Optional: a number of scenes from the first (10), or a range (51-53).',
        returns: 'the report as text',
        callback: async (args, value) => {
            if (!REGISTRY.size)
                return 'Turn the rules engine on first.';
            // "10" runs scenes 1–10; "51-53" runs that range; nothing runs all.
            const m = String(value ?? '').trim().match(/^(\d+)\s*-\s*(\d+)$/);
            const from = m ? Math.max(1, Number(m[1])) : 1;
            const to = Math.min(EVAL_SCENES.length, m ? Number(m[2]) : Number(value) || EVAL_SCENES.length);
            const chosen = EVAL_SCENES.filter(sc => sc.id >= from && sc.id <= to);
            const r = await runEval(send, chosen, (done, total) => { if (done % 5 === 0 && done < total)
                toast?.info(`${done} of ${total} scenes`, 'Rules eval'); }, 
            // The stop button beside the chat box ends the run after the scene in progress; the score covers the scenes done.
            () => !!args?._abortController?.signal?.aborted);
            const text = reportText(r);
            console.log('[Rules eval]', r);
            // The score stays: a notice until tapped, and a comment in the chat that is never sent to the model.
            toast?.info(text.split('\n')[0], 'Rules eval', { timeOut: 0, extendedTimeOut: 0 });
            const run = ctx.executeSlashCommandsWithOptions;
            await run?.(`/comment ${text.replace(/\|/g, '\\|').replace(/\{\{/g, '{ {')}`).catch(e => console.warn('[Rules eval] comment failed:', e));
            return text;
        },
    }));
}
