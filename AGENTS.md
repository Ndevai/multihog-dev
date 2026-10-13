# Working on this repository

A SillyTavern extension where code decides outcomes and the language model narrates them. Every number in the code comes from a published source or a stated process.

## Where things are
- `src/rules/rules-tools.ts`: the tools the narrating model calls. Register a tool with `tool(name, description, props, required, fn)` and add its name to `TOOLS`.
- `src/rules/population.ts`: measured shares by country and year (literacy, numeracy, faith, language, survival, wages by trade, country facts, cities).
- `src/rules/prices.ts`: prices and wages in silver or subsistence baskets.
- `src/rules/data/*.ts`: large generated tables. `rules/*.json`: data loaded at runtime with `new URL('../../rules/x.json', import.meta.url)`.
- `docs/df-body-engine.md`: every rule with its source. §6 = body and world rules, §11 = code-level rules. `docs/superset-models.md`: the planned replacements (BioGears, census microdata, reanalysis weather) and their order.

## How to write code
- Each number carries its source in a short comment, or the flag [ASSUMED] (a stated guess) or [RAW] (a value read from data without a published meaning).
- Fixed choices are enums or string-literal unions.
- Comment density matches the surrounding file: one line above a block naming the source and the rule.
- Tool descriptions state the wanted behaviour positively: what the tool decides, when to call it, what it returns.
- Data conversion scripts go outside the repo; commit only their output.

## How to check
1. `npx tsc -p .` compiles with zero errors (it also emits the `.js` files, which are committed).
2. A Node scratch script outside the repo loads the changed functions (shim `fetch` with `fs.readFileSync`) and prints a few known values; compare them with the source.
3. The user tests inside SillyTavern; write no test suites.

## How to finish
1. Write the rule, its source, its numbers and one check line into `docs/df-body-engine.md` in the matching section, and one plain sentence into `README.md` when a player would notice the change.
2. Add an entry at the top of `docs/progress.md`: date, model used, what changed (in plain words a non-programmer reads), what was checked and the values seen, what is next.
3. Commit with a message naming what changed, then push to branch `rules-standalone`.

## Starting a task
Read `docs/progress.md` (latest entries) and `docs/superset-models.md` (the planned jobs in order) first; continue from the "next" line of the latest entry.

## Replies to the user
Conclusion first; numbers in place of degree words; one chosen option with its reason; a Sources list with links.
