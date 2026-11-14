# Working on this repository

A SillyTavern extension where code decides outcomes and the language model narrates them. Every number in the code comes from a published source or a stated process.

## How to write code
- Each number carries its source in a short comment, or the flag [ASSUMED] (a stated guess) or [RAW] (a value read from data without a published meaning).
- Register a tool with `tool(name, description, props, required, fn)` and add its name to `TOOLS` in `src/rules/rules-tools.ts`.
- Runtime data loads with `new URL('../../rules/x.json', import.meta.url)`.
- Derive; do not look up. A value comes from the deepest layer whose laws can be computed (physics, then tissue, then anatomy, then behaviour), from the fewest causes kept with the thing; everything observable is computed forward from them (few to many). A measured spread stands in only for a cause the story leaves unspecified, and it is drawn at that cause (a tissue's stiffness), never at the outcome (a voice's pitch). Name the layer used and the next one down, and go down when the next one can be computed.
- Fixed choices are enums or string-literal unions.
- Comment density matches the surrounding file: one line above a block naming the source and the rule.
- Tool descriptions and prompts state the wanted behaviour: what the tool decides, when to call it, what it returns.
- An enum value names what is present or the criterion it stands for ("a goal, standard or taste is central"). An absence is an enum value when the absence is the content ("never married").
- Data conversion scripts go outside the repo; commit only their output.

## How to check
1. `npm test` compiles with zero errors (`tsc` also emits the `.js` files, which are committed; TypeScript is pinned to 5.6.3 in `package.json`, and 6.0.3 emits the same files) and runs the files in `tests/` with zero misses (`tests/ui.test.mjs` draws the player-facing note and popup with a stand-in document; `tests/sequences.test.mjs` plays random chats through SillyTavern's events and checks the world against the visible chat after every step). CI runs it on every push to `rules-standalone`.
2. When a rule changes routing, planning or an engine outcome, add its case to the matching `tests/*.test.mjs`. The harness seeds the chat salt and `Math.random` (`tools/st-harness.mjs`), so every run counts the same sample; a statistical check's bounds sit about 4 SD from the rate measured over a few hundred draws, so it also passes on other samples (`RULES_TEST_SEED=<n>`, or `RULES_TEST_SEED=random` for a fresh one).
3. A Node scratch script outside the repo loads the changed functions (shim `fetch` with `fs.readFileSync`) and prints a few known values; compare them with the source. To run whole tools as SillyTavern would, import `tools/st-harness.mjs` (fake context, files read from the repo): `const { call, m } = await import('./tools/st-harness.mjs'); m.setStoryTime(parseStoryTime('1990-07-15 14:00')); await call('Weather', { place: 'Recife' })`. Each call counts as a new turn.
4. A change to the state over time (snapshots, swipes, deletion, the question pass's restores, the record of changes) runs `tests/sequences.test.mjs` longer before it is done: `node tests/sequences.test.mjs 3000 40 <seed>` on two or three seeds, each reporting 0 failing sequences. A failing sequence is printed cut to its fewest steps; its case goes into `tests/engine.test.mjs`. The sequences delete only the last messages, so a change that touches deleting in the middle of the chat adds its case beside R44 there (a swipe, a swipe back and a correction after one).
5. A fix comes with the test that misses when the fix is broken: add its control to `tests/negative-controls.json` (the compiled `.js` file, a regular expression that breaks the fix, its replacement, and the `MISS` label the test prints) and run `npm run negative-controls -- <id>`. Before a release, run them all; each reports `caught`.
6. A judged number (status assumed or fitted) is registered with `def()` in `src/rules/constants.ts`'s registry with a range that holds its value, and read with `k()`, so the sensitivity reruns vary it and `docs/constants.md` lists it (`node tools/constants-doc.mjs`). A threshold read with `reaches()` and a value read with `peek()` count as used once they can change the result. Older judgements still written only as [ASSUMED] in comments are listed under "Assumptions not yet registered" in `docs/constants.md`; a change that touches one registers it.
7. After editing a prompt or a tool description, run `node tools/prompt-audit.mjs`. Each listed sentence is rewritten to the wanted behaviour, or kept with its reason when the absence is the content. The hit count stays equal or falls.
8. The user tests the narration inside SillyTavern.

## How to finish
1. Write the rule, its source, its numbers and one check line into `docs/df-body-engine.md` in the matching section, and one plain sentence into `README.md` when a player would notice the change.
2. Add an entry at the top of `docs/progress.md`: date, model used, what changed (in plain words), what was checked and the values seen, what is next.
3. Commit with a message naming what changed, then push to branch `rules-standalone`.

## Starting a task
Read the top 3 entries of `docs/progress.md` and `docs/superset-models.md` (the planned jobs in order); continue from the "next" line of the latest entry.

## Replies to the user
Follow `.claude/skills/exact-voice/SKILL.md`.
