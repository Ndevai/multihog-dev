# Rules Engine, sixth review: run here and converged with ss.pdf

**Conclusion (evidence: each claim below was run here; output quoted).** Of the 12 findings in ss.pdf, 8 hold (finding 2 in a narrower case than stated, finding 4 in a broader one), 1 holds as a measurement whose diff would lose state (12), and 3 do not hold (3, 9, 11). This review found 8 more, the most severe a question pass that fails part way: its calls stay applied and the narrator's fallback tool calls apply them again (an hour waited became two). All 16 are fixed on a copy of section 35's tree; each fix has a check that prints `MISS` on the uploaded tree and passes after, and a negative control that breaks it.

Severity, as used below: **Critical** = an effect applied twice or lost on a path ordinary play reaches; **High** = wrong state or unintended text to a model on a narrower path; **Medium** = a wrong reading that changes the calls, the question asked or the facts recorded; **Low** = notation, display, timing within a minute, keyboard access.

Line numbers refer to the uploaded tree (`multihog-dev-rules-standalone-revised.zip`, section 35).

---

## 1. Inventory

**Read in full** (lines): `AGENTS.md` 34, `CLAUDE.md` 2, `README.md` 56, `package.json` 15, `tsconfig.json` 23, `settings.html` 32, `src/index.ts` 581, `src/send.ts` 97, `src/ui.ts` 255, `src/rules/question-pass.ts` 646, `src/rules/frame.ts` 418, `src/rules/router.ts` 199, `src/rules/ask.ts` 177, `src/rules/intent.ts` 240, `src/rules/prosody.ts` 188, `src/rules/voice-code.ts` 186, `src/rules/rules-audit.ts` 190, `src/rules/audit-flags.ts` 6, `src/rules/turn.ts` 16, `src/rules/quotes.ts` 16, `src/rules/world-log.ts` 66, `src/rules/reading.ts` 88, `src/rules/constants.ts` 72, `tools/st-harness.mjs` 38, `tools/negative-controls.mjs` 46; the bundle's `ORIGINAL-PROMPT.md`, `review-run.txt` 66, `negative-controls-run.txt` 496; `ss.pdf` 12 pages.

**Read in part** (the lines named): `src/rules/rules-tools.ts` 2581 (95–530 state, snapshots, swipes, `run`, `combined`; 700–960 sky prefetch, `registerRulesTools`, the `exec` wrapper; 1155–1235 Communicate; 1820–1890 Listen and Look; 2010–2045 the lineup); `src/rules/body-engine.ts` 1816 (280–290 knockout timer, 1595–1615 `communicate`, 1641–1700 `crossing`, `advanceAll`); `src/rules/acoustics.ts` 213 (140–213); `src/rules/social.ts` 290 (277–290); `src/rules/zone.ts` 57 (22–31); `src/rules/reanalysis.ts` 137 (41–60); `src/rules/tool-schema.ts` 111 (34–111); `src/rules/knowledge.ts` 166 (by search); `src/rules/verbs.ts` 309 (by search); `docs/df-body-engine.md` 1324 (§7.3 and the headings); `docs/progress.md` 1287 (top entries); `tests/*.test.mjs` (engine 1767, frame 310, intent 74, plan 85, route 188, sequences 135, size 12, ui 300: headers, helpers and the blocks next to each new check); `tests/negative-controls.json` 3379 (format, and the controls retargeted); the bundle's `credibility-edits.md` (sections 34–35).

**Outside the repository, to check SillyTavern's behaviour:** SillyTavern `release` branch at commit 06bde93 (2026-09-14): `public/script.js` (toastr options at 350–366, `Generate` at 4290–4300 and 4496–4570), `public/scripts/openai.js` 700–712, `public/scripts/PromptManager.js` 860–880 and 750–800.

**Skipped, and why:** generated data (`src/rules/data/*.ts`, `rules/*.json`, `rules/df/raw/*`, `rules/pulse/*`, `docs/constants.md`, `fonts/`), per the brief; the other 89 hand-written `.ts` files under `src/rules/` (thermal, vision, weather, crowd, prices, population, history and the rest) were not read, beyond the functions named above; `style.css` 159 was not read (its colours are checked by `tests/ui.test.mjs`). The `.js` files are build output: `npx tsc -p .` (TypeScript 5.6.3) on the uploaded tree leaves `git status` clean, so it reproduces every committed `.js` file.

## 2. Run results

Run here (Node 22.23.4, TypeScript 5.6.3, Chromium through Playwright). The full logs are in `review-run6.txt`.

| Run | Uploaded tree | Fixed tree |
|---|---|---|
| `npx tsc -p .` then `git status` | clean: the `.js` files are reproduced | clean after the fixes are compiled |
| route / frame / intent / plan / size / ui | 157, 193, 36, 58, 9 of 9, 48 of 48; 0 misses | 158, 196, 37, 59, 9 of 9, 51 of 51; 0 misses |
| engine | 187 checks, 0 misses | 192 checks, 0 misses |
| the new checks run on the uploaded tree | engine 5 of 5 miss, frame 3 of 3, route 1 of 1, intent 1 of 1, ui 3 of 3, plan 1 of 1 | 0 misses |
| `tests/sequences.test.mjs` | 300 run, 0 failing | 300 run, 0 failing; 1,500 × 40 on seeds 7 and 8: 0 failing each |
| ss.pdf's own tests (`review-tests/review6.test.mjs`) | 1, 3–12 REPRO; 2 OK as written; 2b (the case that holds) REPRO | 3, 9, 11, 12 REPRO (not fixed, section 5); the rest OK |
| Negative controls | 75 of 393 run before the run was stopped, all caught | 409 of 409 caught (409 controls: 16 new, RS1–RS16; Q6d and RY8 retargeted) |
| Browser (`review-tests/browser/e.mjs`) | Tab from the box: focus to the send button, toolbar hidden; touch tap: mark applied | Tab enters the toolbar; touch tap: mark applied |

## 3. Findings

| # | Severity | Status | File:lines | Statement | ss.pdf |
|---|---|---|---|---|---|
| 1 | Critical | Verified | question-pass.ts:296, 584; index.ts:243–252; rules-tools.ts:940 | A pass that fails after its calls ran leaves them applied and offers the narrator the same tools: PassTime 60 ran, then the narrator's PassTime 60 made it 120 min | new |
| 2 | Critical | Verified | question-pass.ts:357–360; rules-tools.ts:141–145 | A line edited in place into "no, Will" keeps its old start; the reply's swipe brings the corrected blow back (Tom 1, Will 1) | 1 |
| 3 | High | Verified | rules-tools.ts:391–403, 904–915, 1856 | A tool that awaits a fetch writes into the chat opened during the wait (a new "Wit" body, a history entry on the other chat's world) | new |
| 4 | High | Verified | prosody.ts:85–92 | "20 °C" opens a quieter span: planner and narrator are told "quieter: C outside" | new |
| 5 | High | Verified | prosody.ts:71–72 | "Tom (35)", "the year (1850)" are read as pauses: "pause 1850 s after year" reaches the models and the words leave the line | 6 |
| 6 | Medium | Verified (carry-over); trigger Suspected | rules-audit.ts:68–79, 108–113; audit-flags.ts:4–6 | A rule-check note and its flags outlive a redo that never started; the next chat's narrator gets the old correction | new |
| 7 | Medium | Verified | router.ts:54, 151–158 | "I drop the sword", "I trip the guard", "I fall asleep" route BodyFall | new |
| 8 | Medium | Verified | frame.ts:234–236 | "with all my might", "about my plan" become the message; Tom "learns" them in [KNOWS] | 4 (broader) |
| 9 | Medium | Verified | intent.ts:178–183 | "I nod to Ann and hit him back.": a woman named before "him" stops the "back" reading; the player is asked "Hit Tom or Will?" | 7 |
| 10 | Medium | Verified | frame.ts:381 | "*I punch **Tom**.*" drafts no blow | 5 |
| 11 | Medium | Verified | ask.ts:150–151 | "No, Will, ›run!‹" is read as a correction and redoes the last turn at Will | 2 (narrower) |
| 12 | Medium | Verified | question-pass.ts:166–176 | A brace inside a plan's string ("a smile :}") makes the whole plan unreadable | new |
| 13 | Low | Verified | voice-code.ts:93, 143; ui.ts:236 | A mark on «Stop» is written «Stop»- for the models and underlines the guillemets | 8 |
| 14 | Low | Verified | body-engine.ts:1641–1652, 1684–1688 | PassTime stops at the minute's end when someone comes to (1 min instead of 18 s) | 10 |
| 15 | Low | Verified | frame.ts:366–373 | "I glare at him" drafts Look with target "him" | new |
| 16 | Low | Verified (Chromium) | index.ts:378–381 | Tab from the message box goes to the send button and hides the toolbar; the comment's "Tab from the box" path does not exist | new |

## 4. Findings in full

Diffs show the TypeScript sources (`tsc` emits the matching `.js`). Lines longer than about 200 characters are shortened with … inside a diff; `sixth-review-pass.patch` holds every line exactly, and applies to section 35's tree with `git apply`.

### Finding 1 (Critical, Verified): a failed pass applies its calls, and the narrator applies them again

**File and lines:** `src/rules/question-pass.ts:296`, `:584`; `src/index.ts:243–252`; `src/rules/rules-tools.ts:940`.

```ts
// question-pass.ts:296 — each call's effect is written as it runs
    const runAll = async (list: Call[]) => { for (const c of list) { await held(Promise.resolve()); clearDraws(); const result = String(await REGISTRY.get(c.tool)!.exec(c.args as Args)); results.push({ tool: c.tool, result, draws: LAST_DRAWS.map(x => Math.round(x * 1e4) / 1e4) }); markUsed(c, result); } };
// question-pass.ts:584 — the pass is recorded only at the end
    s.asked = { turn, calls, results, time, read: READ, present, weatherRepeat: !!w && key === prev, ...
// index.ts:252 — a thrown pass is logged and the reply goes ahead
        } catch (e) { console.warn('[Rules engine] question pass skipped:', e); }
// rules-tools.ts:940 — with no pass recorded, the narrator is offered every tool
            shouldRegister: () => !questionPassRan() && (!MAGIC_TOOLS.has(name) || worldHasMagic()) });
```

**Trigger:** the first round runs its calls (`runAll`, line 536), then a later model call throws: the refused-call repair (540), the follow-on round (571), or any `send` after `sendModel`'s two retries of a 429 or 5xx (send.ts:85–95). A Connection Manager profile for the pass on a rate-limited endpoint reaches this while the narrator's own connection still answers.
**What happens:** the effects stay; `s.asked` still holds the previous turn, so `questionPassRan()` is false, the narrator gets `RULES_BRIEF` ("call the tool before narrating") and the tool schemas, and its own PassTime runs on the moved clock. Run: "minutes passed by the failed pass 60; questionPassRan false; after the narrator's own PassTime 120 minutes". PassTime, Act, BodyStrike and BodyWound are outside the decision ledger (rules-tools.ts:369–372), so a repeated call applies again.
**What should happen:** a failed pass leaves no effect, so the narrator's tool calls (README: "used when the question pass is off or fails") decide the turn once.

```diff
--- a/src/rules/question-pass.ts
+++ b/src/rules/question-pass.ts
@@ -276,3 +279,17 @@
+// How many calls of the running pass have run, for a pass that fails part way (runQuestionPass below).
+let RAN = 0;
+/** The pass, run once; a pass that fails after some of its calls ran takes them back, so the narrator's own tool calls decide
+ *  the turn (README: function calling is used when the question pass fails) and no call runs twice. */
 export async function runQuestionPass(chat: STMessage[], sendRaw: Send, tracker = '', choose?: Chooser, ask?: Asker): Promise<typeof READ> {
+    const meta = SillyTavern.getContext().chatMetadata;
+    RAN = 0;
+    try { return await passOnce(chat, sendRaw, tracker, choose, ask); }
+    catch (e) {
+        const c = SillyTavern.getContext(), at = (c.chat ?? []).map((m, i) => m.is_user ? i : -1).filter(i => i >= 0).pop();
+        if (RAN && at != null && c.chatMetadata === meta) restoreLineStart(at);
+        throw e;
+    }
+}
+async function passOnce(chat: STMessage[], sendRaw: Send, tracker = '', choose?: Chooser, ask?: Asker): Promise<typeof READ> {
@@ -295,3 +312,3 @@
-    const runAll = async (list: Call[]) => { … results.push({ tool: c.tool, result, draws: … }); markUsed(c, result); } };
+    const runAll = async (list: Call[]) => { … results.push({ tool: c.tool, result, draws: … }); RAN++; markUsed(c, result); } };
```

**Test** (`tests/engine.test.mjs`; the existing R-case that expected 607 after the failure now expects 600, and its resend case moved to a pass stopped by a chat change, where RY9 still guards `hasStart`):
```js
  await line('I wait 7 minutes and hum a tune.', fails).catch(() => {});
  if (T.storyTime() !== 600) { miss++; console.log(`MISS a pass that fails after its calls ran takes them back: ${T.storyTime()} (600)`); }
```
Uploaded tree: `MISS a pass that fails after its calls ran takes them back: 607 (600)`. Fixed: passes. Control RS2.

### Finding 2 (Critical, Verified; ss.pdf 1): a line edited into a correction keeps its old start

**File and lines:** `src/rules/question-pass.ts:357–360`; `src/rules/rules-tools.ts:141–145`.

```ts
        // The line's first pass keeps on it the world the line starts from (a correction's: the world put back), so a pass run
        // again for it starts there whichever order the line joined the chat in, and after later lines are deleted
        // (rules-tools.ts restoreLineStart).
        if (lineAt != null) keepStart(lineAt);
...
export function keepStart(i: number): void {
    const m = SillyTavern.getContext().chat?.[i];
    if (!m || startOf(m)) return;
```

**Trigger:** "I hit him." (Tom chosen) → reply; "I wait 5 minutes." (its pass runs, keeping the start "Tom struck"); the line is edited in place to "no, Will" and sent again; the reply is swiped.
**What happens:** the correction puts the world back before "I hit him." (Tom 0, Will 1 after the correction), but `keepStart` returns early because the line already holds a start, so the start stays "Tom struck". The swipe restores that start and replays the kept pass: Tom 1, Will 1.
**What should happen:** the world a correction put back is the line's start, so every swipe and regenerate of its reply starts there: Tom 0, Will 1.

```diff
--- a/src/rules/rules-tools.ts
+++ b/src/rules/rules-tools.ts
@@ -141,6 +141,7 @@
- * a correction's, once the world is put back). A line edited in place keeps the start it has. */
-export function keepStart(i: number): void {
+ * a correction's, once the world is put back). A line edited in place keeps the start it has, unless `put` (a correction
+ * put the world back before the line it corrects: that world is the line's start now). */
+export function keepStart(i: number, put = false): void {
     const m = SillyTavern.getContext().chat?.[i];
-    if (!m || startOf(m)) return;
+    if (!m || (startOf(m) && !put)) return;
--- a/src/rules/question-pass.ts
+++ b/src/rules/question-pass.ts
@@ -359,3 +376,3 @@
-        if (lineAt != null) keepStart(lineAt);
+        if (lineAt != null) keepStart(lineAt, !!corrFix);
```
This is ss.pdf's diff. **Test** (`tests/engine.test.mjs`, the PDF's sequence): `MISS a line edited into a correction keeps the world it put back: Tom 2, Will 1` on the uploaded tree; passes after. Control RS1 (RY8 retargeted to the new call).

### Finding 3 (High, Verified): a tool that waits writes into the chat opened meanwhile

**File and lines:** `src/rules/rules-tools.ts:391–403` (`run`), `:904–915` (`exec`), `:1856` (Look); the same await in Weather 1536, NewCharacter 1098, PassTime 2302 (`prepareBleeding`, the Pulse run), Room 2414, Dose 2483.

```ts
    }, ['viewer', 'kind', 'distance_m'], async a => { if (!a.light) await prefetchSky(a.latitude); return run((st, rng) => {
...
function run<T>(fn: (st: RuleState, rng: Rng) => T): T {
    const s = store();
...
            const before = structuredClone(store().state), callsBefore = store().calls ?? 0;
            resetUsed();
            let out: unknown = plain(await action(args as ArgsOf<Ps, Req[number]>));
            const s = store();
```

**Trigger:** a Look on a 1990 date fetches the day's ERA5 hours (reanalysis.ts:55); the player opens another chat before the fetch returns. The question pass checks the chat only between calls (question-pass.ts:296); the narrator's own tool calls are not checked at all.
**What happens:** `run` reads `store()` of the chat now open. Run: "chat B: people ["Wit"], history 1 entries on a base with ["Wit"]; chat A: history 2 → 2": chat B gets a fresh default body named Wit and a history whose base is chat A's world; chat A loses the Look.
**What should happen:** a call that waited decides nothing once its chat is no longer open.

```diff
--- a/src/rules/rules-tools.ts
+++ b/src/rules/rules-tools.ts
@@ -390,3 +391,7 @@
+// The chat a running call belongs to: a call whose action waited (weather, sky, bleeding, chemistry data) writes nothing once
+// another chat is open.
+let CALLING: unknown = null;
 function run<T>(fn: (st: RuleState, rng: Rng) => T): T {
+    if (CALLING && SillyTavern.getContext().chatMetadata !== CALLING) throw new Error('[Rules engine] another chat was opened while a tool waited; nothing was decided');
     const s = store();
@@ -904,2 +909,7 @@
         const exec = async (raw: Args) => {
+            const was = CALLING;
+            CALLING = SillyTavern.getContext().chatMetadata;
+            try { return await execIn(raw); } finally { CALLING = was; }
+        };
+        const execIn = async (raw: Args) => {
```

**Test** (`tests/engine.test.mjs`): a gated `fetch`, the Look started, `ctx.chatMetadata` replaced, the gate released:
```js
  if (other.rulesEngine) { miss++; console.log(`MISS a waiting tool writes nothing into another chat: ${JSON.stringify(Object.keys(other.rulesEngine.state?.people ?? {}))}`); }
```
Uploaded tree: `MISS a waiting tool writes nothing into another chat: ["Wit"]`. Fixed: passes; the call throws, which the interceptor's catch and `moved()` already handle. Control RS3.

### Finding 4 (High, Verified): a temperature opens a quieter span

**File and lines:** `src/rules/prosody.ts:85–92`.

```ts
        const lead = /^["“‘'(\[]*/.exec(w)![0];
        w = w.slice(lead.length);
        for (;;) {
            const c = w.charAt(0);
            if (LEAD[c] && w.length > 1) { open.add(LEAD[c]); w = w.slice(1); marked = true; continue; }
```

**Trigger:** "It is 20 °C outside." (the SI form puts a space before °C), "Set the oven to 180 °C, Tom.", "-5 °F".
**What happens:** "°C" starts with the Jefferson quiet sign, so every later word is marked quieter: delivery "quieter: C outside", the plain line "It is 20 C outside.". That text goes to the planner ("HOW MARA SAYS IT … quieter: C outside", question-pass.ts:427) and to the narrator ("How Mara said the line (the player's own marks): …", question-pass.ts:638).
**What should happen:** a degree sign before C, F or K is a unit; the line has no marks.

```diff
--- a/src/rules/prosody.ts
+++ b/src/rules/prosody.ts
@@ -88,3 +89,4 @@
             const c = w.charAt(0);
-            if (LEAD[c] && w.length > 1) { open.add(LEAD[c]); w = w.slice(1); marked = true; continue; }
+            // A degree sign before C, F or K is a temperature's unit ("20 °C"), no quieter span.
+            if (LEAD[c] && w.length > 1 && !(c === '°' && /^°[CFK](?!\p{L})/u.test(w))) { open.add(LEAD[c]); w = w.slice(1); marked = true; continue; }
```

**Test** (`tests/ui.test.mjs`, shared with finding 5):
```js
  const plainOnes = ['John Smith (35) checks items (1) and (2).', 'The year (1850) was cold.', 'It is 20 °C outside.', 'Set the oven to 180 °C, Tom.', 'It is -5 °F.'];
  const read = plainOnes.filter(l => { const x = P.readProsody(l); return x.marked || x.plain !== l; });
  ok(!read.length && P.readProsody('Wait (0.5) what?').words[0]?.pause === 0.5 && P.readProsody('The °old° man.').words[1]?.marks.includes('quiet'), 'numbers in brackets and temperatures stay words', …);
```
Uploaded tree: `MISS numbers in brackets and temperatures stay words: … It is 20 °C outside. → quiet…`. Fixed: passes, and "°old°" still reads quieter. Control RS10.

### Finding 5 (High, Verified; ss.pdf 6): whole numbers in brackets read as pauses

**File and lines:** `src/rules/prosody.ts:71–72`.

```ts
        // Pauses and breaths stand alone, after or before a word.
        const pause = /^\((\d*\.\d+|\d+|\.)\)([,.;:!?]*)$/.exec(raw);
```

**Trigger:** "Tom (35) and Will (12) watch me.", "The year (1850) was cold.", "I check items (1) and (2)."
**What happens:** run: "pause 35 s after Tom · pause 12 s after Will" with the plain line "Tom and Will watch me."; "pause 1850 s after year". The delivery reaches the planner and the narrator as in finding 4, and the numbers leave the line the engine reads.
**What should happen:** a timed pause carries its decimal point, (0.5), (2.0); a whole number in brackets is text. The file's own header says single parentheses and numbers "stay as they are".

```diff
@@ -69,4 +69,5 @@
-        // Pauses and breaths stand alone, after or before a word.
-        const pause = /^\((\d*\.\d+|\d+|\.)\)([,.;:!?]*)$/.exec(raw);
+        // Pauses and breaths stand alone, after or before a word. A timed pause is written in seconds with its decimal point,
+        // (0.5), (2.0); a whole number in brackets is ordinary writing ("Tom (35)", "the year (1850)", "items (1) and (2)").
+        const pause = /^\((\d*\.\d+|\.)\)([,.;:!?]*)$/.exec(raw);
```
This is ss.pdf's diff. **Test:** the check under finding 4. Control RS9.

### Finding 6 (Medium; carry-over Verified, trigger Suspected): the rule check's note outlives a redo that never started

**File and lines:** `src/rules/rules-audit.ts:68–79`, `:108–113`; `src/rules/audit-flags.ts:4–6`; `src/index.ts:538`.

```ts
let pending: { events: AuditEvent[]; decided: boolean } | null = null;
...
    const p = pending;
    pending = null;
    if (!p) return null;
...
        pending = { events, decided: askedResults().length > 0 };
        setFlags(events.filter(e => e.tool !== 'KNOWS'));
        deps.generate('swipe');
```

**Trigger:** the check flags an event and asks for the redo; the redo's timer (index.ts:538, 75 ms) finds another chat open and skips it, or SillyTavern does not start the swipe.
**What happens:** `pending` and the flags are module variables. Run: after switching chats, `takeAuditNote()` returns "<rule_engine_correction> … "Mara scales the wall" → BodyCheck" and `takeFlags()` returns the flag. The next interceptor in any chat sends that note to the narrator, and the next swipe there runs the flagged tool.
**What should happen:** the note and flags go only to the turn they were made for.

```diff
--- a/src/rules/audit-flags.ts
+++ b/src/rules/audit-flags.ts
-let flags: Flag[] = [];
-export const setFlags = (f: Flag[]) => { flags = f; };
-export const takeFlags = () => { const f = flags; flags = []; return f; };
+// The turn they were raised for (turn.ts turnKey): a redo that never started leaves them to no other turn or chat.
+let flags: Flag[] = [], forTurn = '';
+export const setFlags = (f: Flag[], turn = '') => { flags = f; forTurn = turn; };
+export const takeFlags = (turn = '') => { const f = forTurn === turn ? flags : []; flags = []; forTurn = ''; return f; };
--- a/src/rules/rules-audit.ts
+++ b/src/rules/rules-audit.ts
-let pending: { events: AuditEvent[]; decided: boolean } | null = null;
+let pending: { events: AuditEvent[]; decided: boolean; turn: string } | null = null;
@@
-    if (!p) return null;
+    // The note belongs to the turn it was made for: a redo that never started gives it to no later turn or other chat.
+    if (!p || p.turn !== turnKey(SillyTavern.getContext().chat)) return null;
@@
-        pending = { events, decided: askedResults().length > 0 };
-        setFlags(events.filter(e => e.tool !== 'KNOWS'));
+        pending = { events, decided: askedResults().length > 0, turn: key };
+        setFlags(events.filter(e => e.tool !== 'KNOWS'), key);
--- a/src/rules/question-pass.ts
+++ b/src/rules/question-pass.ts
-        const flags = takeFlags().filter(f => REGISTRY.has(f.tool));
+        const flags = takeFlags(turn).filter(f => REGISTRY.has(f.tool));
```

**Test** (`tests/engine.test.mjs`): `MISS a rule-check note stays with its turn: <rule_engine_correction>…` on the uploaded tree; passes after. Controls RS4, RS5.

### Finding 7 (Medium, Verified): verbs of falling with an object route BodyFall

**File and lines:** `src/rules/router.ts:54` and `:151–158`.

```ts
    fall: ['BodyFall'], drop: ['BodyFall'], tumble: ['BodyFall'], trip: ['BodyFall'], stumble: ['BodyFall'], slip: ['BodyFall'],
...
        for (const v of lemmas(w)) {
            ...
            const tools = toolsOf(v, words[i + 1] ?? '', after);
            for (const t of tools ?? []) why[t] ??= w;
```

**Trigger and what happens:** "I drop the sword." → BodyFall; "I slip the note into his pocket." → BodyFall, Act; "I trip the guard." → BodyFall (the player's fall); "I fall asleep.", "I fall silent.", "I fall in love with Ann." → BodyFall. The planner then gets BodyFall's full arguments and nothing else in full.
**What should happen:** a verb of falling with an object moves the object, and with a predicative complement ("asleep", "silent", "in love") it changes a state; neither is a fall of the body. With no tool routed, the model's tool picker reads the line (router.ts:196–199). "I drop down from the wall", "I slip on the ice" and "I fall into the river" still route BodyFall.

```diff
--- a/src/rules/router.ts
+++ b/src/rules/router.ts
@@ -150,2 +150,7 @@
         }
+        // A verb of falling with an object moves the object ("drop the sword", "slip the note into his pocket", "trip the guard"),
+        // and with a predicative complement it changes a state ("fall asleep", "fall silent", "fall in love": fall as a
+        // complex-intransitive verb, CGEL ch. 4 §5): no fall of the speaker's body.
+        if (lemmas(w).some(v => VERB_TOOL[v]?.[0] === 'BodyFall') && (/^(?:the|a|an|my|his|her|their|our|your|its|this|that|these|those|him|them|it|some)$/.test(words[i + 1] ?? '')
+            || /^(?:asleep|silent|quiet|still|ill|sick|short|prey|victim)$/.test(words[i + 1] ?? '') || (words[i + 1] === 'in' && words[i + 2] === 'love'))) continue;
         for (const v of lemmas(w)) {
```

**Test** (`tests/route.test.mjs`):
```js
  const wrong = ['I drop the sword.', 'I slip the note into his pocket.', 'I trip the guard.', 'I fall asleep.', 'I fall silent.', 'I fall in love with Ann.'].filter(t => routeTurn(t).tools.includes('BodyFall'));
  const kept = ['I drop down from the wall.', 'I slip on the ice.', 'I fall into the river.'].filter(t => !routeTurn(t).tools.includes('BodyFall'));
  if (wrong.length || kept.length) { miss++; console.log(`MISS a fall verb with an object is no fall: …`); }
```
Uploaded tree: all six listed. Control RS12.

### Finding 8 (Medium, Verified; ss.pdf 4, broader): a manner or a topic becomes the message

**File and lines:** `src/rules/frame.ts:234–236`.

```ts
    const message0 = quoted ?? rest.replace(new RegExp(String.raw`^\s+(?:out\s+)?(?:to|at|with)?\s*(?:${listener.replace(/^the /, '(?:the )?')}|him|her|them)\b`, 'i'), '').replace(/^[\s,]+|[.!?]+$/g, '').trim();
    // A place phrase after the listener is where, not what ("call out to Tom across the square").
    const message = !quoted && /^(?:across|through|over|from|under|behind|in|into|toward|towards|down|up|along|near|beside|outside|inside|at|on|by|past|around)\b/i.test(message0) ? '' : message0;
```

**Trigger and what happens:** "I shout to Tom with all my might." → message "with all my might"; "I tell Tom about my plan." → message "about my plan". When the planner's Communicate leaves `message` out, code's stands (frame.ts:409–413), and Communicate records it as a fact Tom was told (rules-tools.ts, Communicate's `learn`), shown in [KNOWS].
**What should happen:** a manner or a topic after the listener is no message; the planner supplies the words. "ask the costermonger for a pound of apples" keeps its message, as `tests/frame.test.mjs` requires; ss.pdf's list (with, without) is kept and "about" added.

```diff
-    // A place phrase after the listener is where, not what ("call out to Tom across the square").
-    const message = !quoted && /^(?:across|through|…|around)\b/i.test(message0) ? '' : message0;
+    // A place phrase after the listener is where, not what ("call out to Tom across the square"); so are a manner ("with all my
+    // might") and a topic ("about my plan"): the words said are the planner's to give.
+    const message = !quoted && /^(?:with|without|about|across|through|…|around)\b/i.test(message0) ? '' : message0;
```

**Test** (`tests/frame.test.mjs`): `MISS a manner or a topic is no message: I shout to Tom with all my might. → with all my might | I tell Tom about my plan. → about my plan` on the uploaded tree. Control RS7 (Q6d retargeted).

### Finding 9 (Medium, Verified; ss.pdf 7): a woman named before "him" blocks "him back"

**File and lines:** `src/rules/intent.ts:178–183`.

```ts
function pronouns(text: string, sit: Situation, changes: Change[], open: Open[]): string {
    return text.replace(/\b([a-z]+)\s+(?:(?:at|to|with|toward|towards|after)\s+)?(him|her)\b(\s+back\b)?/gi, (all, verb: string, pro: string, back: string | undefined, at: number) => {
        if (!lemmas(verb.toLowerCase()).some(v => VERBNET[v])) return all;
        const before = text.slice(0, at);
        // Named before it in the line: the frame reader settles it (frame.ts personFor).
        if (sit.people.some(p => p.name !== sit.player && new RegExp(String.raw`\b${p.name.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\b`, 'i').test(before))) return all;
```

**Trigger:** narration "Will laughs. Tom shoves you hard."; the line "I nod to Ann and hit him back."
**What happens:** Ann is named before "him", so the function returns before reading "back"; frame.ts finds no man named before "him", and the player is asked "Hit him": who? Hit Tom, Hit Will.
**What should happen:** only a person whose sex fits (or is unknown) settles the pronoun; "him back" is Tom, who struck.

```diff
-        // Named before it in the line: the frame reader settles it (frame.ts personFor).
-        if (sit.people.some(p => p.name !== sit.player && new RegExp(…).test(before))) return all;
+        // Named before it in the line, one whose sex fits the pronoun (or is not known): the frame reader settles it (frame.ts
+        // personFor). A woman named before "him" leaves him open ("I nod to Ann and hit him back").
+        const want = /^her$/i.test(pro) ? 'female' : 'male', sexOf = (p: { name: string; sex?: string | null }) => p.sex ?? wordSex(p.name.toLowerCase());
+        if (sit.people.some(p => p.name !== sit.player && (!sexOf(p) || sexOf(p) === want) && new RegExp(…).test(before))) return all;
```
ss.pdf's diff. **Test** (`tests/intent.test.mjs`): `MISS a woman named before him back: I nod to Ann and hit him back.` on the uploaded tree. Control RS11.

### Finding 10 (Medium, Verified; ss.pdf 5): emphasis inside emphasis loses the blow

**File and lines:** `src/rules/frame.ts:381`.

```ts
export const unEmphasis = (text: string) => text.replace(/(\*{1,3})(?=\S)([^*\n]*?\S)\1/g, '$2').replace(/(?<![\p{L}\p{N}_])(_{1,3})(?=\S)([^_\n]*?\S)\1(?![\p{L}\p{N}_])/gu, '$2');
```

**Trigger:** "*I punch **Tom**.*".
**What happens:** the group's last `\S` may itself be a star, so the outer `*` closes on the first star of `**Tom**`; the line becomes "I punch *Tom*." and BodyStrike gets no one (`who=undefined`).
**What should happen:** the inner run goes first; the line reads "I punch Tom." ss.pdf's diff (`[^\n]*?` inside) turns "I pay 2*3 coins and *smile*." into "I pay 23 coins and *smile." (run here); this one keeps the run's own sign out of its first and last character:

```diff
-export const unEmphasis = (text: string) => text.replace(/(\*{1,3})(?=\S)([^*\n]*?\S)\1/g, '$2').replace(/(?<![\p{L}\p{N}_])(_{1,3})(?=\S)([^_\n]*?\S)\1(?![\p{L}\p{N}_])/gu, '$2');
+// Runs of three, then two, then one: an emphasis inside another ("*I punch **Tom**.*") goes before the one around it, and a
+// run's words neither start nor end with its own sign.
+export const unEmphasis = (text: string) => [3, 2, 1].reduce((t, n) => t.replace(new RegExp(String.raw`(\*{${n}})(?=[^\s*])([^*\n]*?[^*\s])\1`, 'g'), '$2')
+    .replace(new RegExp(String.raw`(?<![\p{L}\p{N}_])(_{${n}})(?=[^\s_])([^_\n]*?[^_\s])\1(?![\p{L}\p{N}_])`, 'gu'), '$2'), text);
```

**Test** (`tests/frame.test.mjs`): `MISS emphasis inside emphasis: who undefined; …` on the uploaded tree; the same check holds "I pay 2*3 coins and smile." Control RS8.

### Finding 11 (Medium, Verified; ss.pdf 2, narrower): a line quoting in guillemets is read as a correction

**File and lines:** `src/rules/ask.ts:150–151`.

```ts
export function correctionOf(line: string): string | null {
    if (/["“”]/.test(line)) return null;
```

**ss.pdf's trigger does not reproduce:** "›No, Will!‹", "«No, Will»" and "„No, Will!“" return null on the uploaded tree, since the pattern is anchored at the line's start (`^\s*(?:no|…)`) and these lines open with a quotation mark.
**The case that holds:** "No, Will, ›run!‹" → correction "Will, ›run!‹"; "No, Will «stop»" → "Will «stop»". The same line with "…" is an ordinary line. Read as a correction, it puts the world back before the last line and redoes it at Will (question-pass.ts:348–354).
**What should happen:** a line that quotes in any of quotes.ts's marks is an ordinary line, as the comment above `CORRECTION` says ("short, unquoted").

```diff
+import { OPENS } from './quotes.js';
@@
 export function correctionOf(line: string): string | null {
-    if (/["“”]/.test(line)) return null;
+    // Quoted words are speech (quotes.ts: "…", „…“, «…», ›…‹ and the rest): a line that quotes is an ordinary line.
+    if (OPENS.test(line)) return null;
```
**Test** (`tests/ui.test.mjs`): `MISS a line that quotes is no correction: Will, ›run!‹ | Will «stop»` on the uploaded tree. Control RS6.

### Finding 12 (Medium, Verified): a brace inside a plan's string loses the plan

**File and lines:** `src/rules/question-pass.ts:166–176`.

```ts
    const starts = [...s.matchAll(/\{\s*"calls"/g)].map(m => m.index!).reverse();
    for (const at of starts) {
        let depth = 0, end = -1;
        for (let i = at; i < s.length && end < 0; i++) {
            if (s[i] === '{') depth++;
            else if (s[i] === '}' && --depth === 0) end = i;
        }
        if (end < 0) continue;
```

**Trigger:** a plan whose message holds an unpaired brace: `"message":"a smile :}"`, or a whispered span the planner copies in part, `"message":"{W meet me"` (the planner reads VoQS braces in the notation).
**What happens:** the depth count ends inside the string; `JSON.parse` fails; `rawPlan` returns `{ calls: [] }` (run: `[]`). The pass marks the plan unread and asks again (question-pass.ts:459–472); a repeat of the same text drops every planner call.
**What should happen:** braces inside a JSON string are text.

```diff
-        for (let i = at; i < s.length && end < 0; i++) {
-            if (s[i] === '{') depth++;
+        // Braces inside a JSON string are text (a message quoting ":}" or a whispered "{W …"), not the object's own.
+        for (let i = at, str = false; i < s.length && end < 0; i++) {
+            if (str) { if (s[i] === '\\') i++; else if (s[i] === '"') str = false; continue; }
+            if (s[i] === '"') str = true;
+            else if (s[i] === '{') depth++;
             else if (s[i] === '}' && --depth === 0) end = i;
```
**Test** (`tests/plan.test.mjs`): `MISS a brace inside a message is text: [null,null]` on the uploaded tree. Control RS15. The world book's draft reader (world.ts:116–120) counts braces the same way; it was left as it is, since the player edits that JSON in a popup before it is saved.

### Finding 13 (Low, Verified; ss.pdf 8): marks on words in guillemets sit outside the quote

**File and lines:** `src/rules/voice-code.ts:93`, `:143`; `src/ui.ts:236`.

```ts
        const m = /^(["“'(]*)(.*?)([,.;:!?"”')]*)$/u.exec(k.word)!;
```

**What happens:** «Stop» marked "cut off" is written «Stop»- for the models, typeset «Stop»— in the chat, and the box underlines the guillemets with the word. **What should happen:** «Stop-», «Stop—», the underline under Stop. The engine reads the codes (`marksOf`), so the outcome is unchanged.

```diff
+/** A word's signs before and after its letters: quotation marks of every pair quotes.ts reads, brackets, and the dashes and
+ * ellipsis after it; the marks' signs go on the letters between. */
+export const WORD_PARTS = /^(["“„‚'‘(\[«»‹›]*)(.*?)([,.;:!?"”“'’)\]»«›‹—–…]*)$/su;
@@ toNotation, typeset (voice-code.ts), mirrorParts (ui.ts)
-        const m = /^(["“'(]*)(.*?)([,.;:!?"”')]*)$/u.exec(k.word)!;
+        const m = WORD_PARTS.exec(k.word)!;
```
**Test** (`tests/ui.test.mjs`): `MISS marks on the letters inside guillemets: «Stop»- ["«Stop󠁋󠁿»"]` on the uploaded tree. Control RS13.

### Finding 14 (Low, Verified; ss.pdf 10): PassTime stops at the minute's end when someone comes to

**File and lines:** `src/rules/body-engine.ts:1641–1652` (`crossing` has no knockout level), `:1684–1688`.

```ts
            const before = watch(p), lv = levels(p);
            advance(p, 1, resting.has(who), rng, { active: active.has(who), sleeping: sleeping.has(who) });
            const ev = changes(who, before, watch(p));
            if (ev.length) { events.push(...ev); frac = Math.min(frac, crossing(lv, levels(p))); }
```
**What happens:** a choke with 0.3 min left: "Time stopped after 1 min of 5 minutes: Kit comes to." **What should happen:** "after 0 min 18 s", as the other thresholds are timed inside the minute.

```diff
-            const before = watch(p), lv = levels(p);
+            const before = watch(p), lv = levels(p), ko = p.koLeft;
             advance(p, 1, resting.has(who), rng, { active: active.has(who), sleeping: sleeping.has(who) });
             const ev = changes(who, before, watch(p));
-            if (ev.length) { events.push(...ev); frac = Math.min(frac, crossing(lv, levels(p))); }
+            // A knockout or choke ends when its drawn time runs out, inside the minute (koLeft, minutes).
+            const woke = ko != null && ko > 0 && ko <= 1 && p.koLeft == null ? ko : 1;
+            if (ev.length) { events.push(...ev); frac = Math.min(frac, crossing(lv, levels(p)), woke); }
```
**Test** (`tests/engine.test.mjs`): `MISS PassTime stops when a person comes to: Time stopped after 1 min of 5 minutes: Kit comes to. 4 min remain.` on the uploaded tree. Control RS14.

### Finding 15 (Low, Verified): a pronoun looked at stays a pronoun

**File and lines:** `src/rules/frame.ts:366–373`.
```ts
    const seen = both && (/^[A-Z]/.test(both[1]!) && /^[A-Z]/.test(target!) || /^the\s/.test(both[1]!) && /^the\s/i.test(target!)) ? `${target} and ${both[1]}` : target;
    if (look) out.push(placed(lv!.at, { tool: 'Look', args: { viewer: player, ...seen ? { target: seen } : {} } }));
```
**What happens:** "Tom laughs at me. I glare at him." drafts Look with target "him" (the note shows "Sight him"; a planner call without a target keeps it). **What should happen:** the person the grammar finds, as BodyStrike does (frame.ts:350), else no target.
```diff
+    // "Him" or "her" looked at is the person the grammar finds for it (personFor), else left to the scene ("I glare at him").
+    const at = seen && PRONOUN.test(seen) ? personFor(seen, text, lv!.end, player) : seen;
-    if (look) out.push(placed(lv!.at, { tool: 'Look', args: { viewer: player, ...seen ? { target: seen } : {} } }));
+    if (look) out.push(placed(lv!.at, { tool: 'Look', args: { viewer: player, ...at ? { target: at } : {} } }));
```
**Test** (`tests/frame.test.mjs`): `MISS a pronoun looked at is its person: ["him","him"]` on the uploaded tree. Control RS16.

### Finding 16 (Low, Verified in Chromium): Tab from the box never reaches the toolbar

**File and lines:** `src/index.ts:367`, `:378–381`.
```ts
    form.before(bar);
...
    // Open while words are selected in the box, while the toolbar holds the focus (Tab from the box), or pinned by ♪.
    const show = () => { const focus = document.activeElement, sel = (focus === box || bar.contains(focus)) && box.selectionStart !== box.selectionEnd; bar.hidden = !(pinned || sel) || !settings().enabled; … };
    document.addEventListener('selectionchange', show);
    box.addEventListener('keyup', show); box.addEventListener('mouseup', show); box.addEventListener('blur', () => setTimeout(show, 0)); bar.addEventListener('focusout', () => setTimeout(show, 0));
```
**What happens** (the extension's `index.js` loaded in a stand-in SillyTavern page, Chromium): words selected, Tab → focus on the send button, toolbar hidden. Shift+Tab reaches ♪ and hides it too. A keyboard player reaches the toolbar only by pinning it with ♪ and then pressing Shift+Tab past ♪ and the options button, arriving at its last button. **What should happen:** Tab from the box enters the toolbar while it shows, as the comment says.
```diff
     document.addEventListener('selectionchange', show);
+    // Tab from the box enters the toolbar while it shows: the toolbar stands before the form, so the page's focus order passes it.
+    box.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !bar.hidden) { e.preventDefault(); bar.querySelector('button')?.focus(); } });
```
**Test** (`review-tests/browser/e.mjs`, Playwright; Node's tests load no `index.js`): `MISS Tab from the box enters the toolbar while it shows` on the uploaded tree; none after.

---

## 5. Checked and found sound

**ss.pdf findings that do not hold:**
- **3 (Look sighting on a miss).** The sighting is recorded, but it changes no outcome: `faceStrength` returns 0 whenever `identified` is false (social.ts:279), so a missed Look and no Look give the same lineup draw; the line "Wit never made out Rob's face" is true of a miss. A miss does not overwrite an identified sighting (rules-tools.ts:1887, `if (id || !was?.identified)`).
- **9 (touch blurs the box).** Not reproduced: with Chromium's touch emulation (`hasTouch`, `isMobile`, `tap()`), words selected and "louder" tapped, the box got the mark (2 tag characters) and kept the focus. Browsers move focus on the compatibility `mousedown`, which the toolbar already cancels. Its test greps the source for a `pointerdown` listener, so it fails on any code without that string, whatever the behaviour.
- **11 (SII level distortion below 0).** The arithmetic holds at 230 dB, but `reach()` has one caller, Communicate (body-engine.ts:1607), which passes a speech effort: shout is 82.3 dB overall (acoustics.ts:26) plus at most 12 dB of Lombard rise, more than 100 dB below the level where L turns negative. No input reaches it.
- **12 (prune and growth).** The growth is real (area H below). The O(N²) cost is not material: 51 ms per turn at turn 120. Its diff deletes `pulse` tracks from old replies' worlds, which a deletion back to that reply needs to continue the bleed, so it was not applied.

**Areas traced:**
- **A. State over time.** Normal turn → swipe → swipe back (`onRulesGenerationStarted` rewrite branch, `onRulesSwiped`, `truncateTo`, `settle`), deletion mid-chat (`syncRulesToChat`, `keptPass` by `lineOf`), branch (CHAT_CHANGED → `syncRulesToChat`, the kept pass cleared by place), stopped generation (the line keeps its result), regenerate of a line with no reply (`restoreLineStart`): sound, beyond findings 1 and 2. SillyTavern's dry runs (`PromptManager.tryGenerate` → `Generate('normal', {}, true)` after each message received or deleted, openai.js:707–709) emit GENERATION_STARTED; interceptors are skipped for them (script.js:4562–4564), and the normal branch they reach is idempotent.
- **B. Text to models and the page.** `sendModel` removes the Tags block from system and user (send.ts:85), the narrator prompt is untagged (index.ts:261) and the chat copies are notated (index.ts:238; SillyTavern passes `{ ...chatItem, mes }` copies to interceptors, script.js:4496–4564), tool results are untagged (rules-tools.ts:936), the rule check sends through the same `send`. Page: `askPopup` escapes the line, choices, notes and lead (ui.ts:162–175); `drawNote`, `drawVoice` and `renderBook` set text only; toasts are escaped by SillyTavern (`escapeHtml: true`, script.js:360). Unintended text found: findings 4, 5 and 6.
- **C. Reading the player's line.** 61 lines run through prosody, intent, router, frame and ask, and 37 more through prosody alone (quoted speech, asterisks, bold and underscores, Portuguese, German with »…« and ›…‹, temperatures, times, years, abbreviations, emoticons). Wrong readings: findings 4, 5, 7, 8, 9, 10, 11, 15; those left unfixed are in section 7.
- **D. Async and races.** `held()` between model calls and between tool calls; `moved()` in the interceptor; the rule check's `ownsChat` and message identity check; `takeBack`'s index check; listeners registered once per page load (`buildVoice` is guarded by `#rules-voice`). Defect: finding 3 (inside a tool's own wait).
- **E. Interface** (Chromium): `typesetChat` twice gives the same HTML and one span; Backspace after a marked letter keeps the mark on "sto"; the caret steps over a letter and its block as one; Ctrl+Z restores; a touch tap marks. Defects: findings 13 and 16.
- **F. Numbers against sources.** `combined()` is the equal-weight log-odds mean it cites (rules-tools.ts:449–455); `heardRight` solves Rosenthal & Rubin's π for p correctly (prosody.ts:184–187); speech levels 62.35/68.34/74.85/82.30 dB are ANSI S3.5-1997's; SII's L ≤ 1 and K in [0, 1] (acoustics.ts:183–188); Lombard 0.6 dB/dB above 48 dB to 12 dB (acoustics.ts:145); the Bayesian pronoun weights are likelihoods under a flat prior (intent.ts:142–165); shares enter as enum bands, so percent and fraction cannot mix (tool-schema.ts:53–62).
- **G. Tests.** Every new check misses on the uploaded tree; the full run of 409 controls on the fixed tree caught all 409 (16 new). The pre-existing case for a failed pass encoded the doubled state (607 after the failure); it now checks 600, and RY9 is still caught by its resend case.
- **H. Cost** (120 turns, 4 people, one new fact every 4 turns): chat 1.09 MB, metadata 0.44 MB, 51 ms per turn. Capped: the change record at 400 entries (world-log.ts:12), snapshots at 30, player lines' worlds pruned past 30 messages. Unbounded: one world per reply (`rulesResult`), and the facts list inside each world (knowledge.ts:20–23), so the saved chat grows with the square of its length.

## 6. Not covered

- 89 hand-written rule files were not read beyond the functions named in section 1; the numbers of area F were checked for those formulas only, not against every primary source.
- The statistical checks' bounds (4 SD by AGENTS.md) were not recomputed one by one.
- Real phones and SillyTavern itself: touch and keyboard were run in Chromium with a stand-in page, not in SillyTavern on iOS or Android; Android keyboards that send key "Unidentified" for Backspace were not tried.
- A live model: the question pass and rule check were run with scripted model answers.

## 7. Suggestions

- **Bound the world kept on every reply** (area H): keep full worlds on the last 30 replies and every tenth one before, and store the others as a diff (world-log.ts `diff`) against the full world before them; a deletion back to any reply then still restores it exactly.
- **Idioms routed by their verb:** "I take a seat" → Transfer, "I force a smile" → BodyCheck, "I break the silence" → Break, "I sneak past the guard" → Act and Transfer (no Look for the guard). The breath and lock phrases at router.ts:179–185 show the form for these.
- **Shouted names:** in "I SHOUT AT WILL TO RUN", capitals are lowered to "will", and the listener is lost (prosody.ts:115–121 lowers a capitalised word that is also a common word). A word the scene names as a person could keep its capital.
- **The toolbar as one tab stop** with arrow keys between its buttons (WAI-ARIA Authoring Practices, Toolbar pattern); and after a feeling mark, the selection moves to the line's first word, so the next mark lands there.

## Sources

- SillyTavern source, release branch, commit 06bde93: [github.com/SillyTavern/SillyTavern](https://github.com/SillyTavern/SillyTavern)
- WAI-ARIA Authoring Practices, Toolbar pattern: [w3.org/WAI/ARIA/apg/patterns/toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
- Huddleston & Pullum 2002, *The Cambridge Grammar of the English Language*, ch. 4 §5 (complex-intransitive clauses), as cited in router.ts
