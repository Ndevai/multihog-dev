// What the planner and the narrator read for six ordinary lines in 1300, 1850 and 1990: node scene-words.mjs <tree> (absolute path).
// What the planner and the narrator read for ordinary lines, by year: node measure.mjs <tree>
const dir = process.argv[2]; process.chdir(dir);
const H = await import(dir + '/tools/st-harness.mjs');
const T = await import(dir + '/src/rules/rules-tools.js'), Q = await import(dir + '/src/rules/question-pass.js'), R = await import(dir + '/src/rules/router.js');
const { parseStoryTime } = await import(dir + '/src/rules/clock.js');
const OUT = /sneakers|bra\+panty|panty hose|t-shirt|antibiotics|hyperbaric|antivenom|transfuse|Propofol|Midazolam|Ketamine|homosexuality|abortion|euthanasia|SARS|asphalt|aluminium|gypsum|dorm lounge|movies|elevator|football game|adamantine|giant wolf|dragon|telepathy|\belves\b|goblins|Dwarf Fortress|DF creature|CastSpell|welder|bus driver|phone|police|milkman|cartridge|propane|John's house|Rue de Rivoli|loot|sètï|Lyon|revolver|pistol|car exhaust|aircraft/gi;
const LINES = ['I punch Tom.', 'I wade into the icy river in my coat.', 'I ask the innkeeper what a room costs.', 'I bandage the cut on his arm.', 'I listen at the door.', 'Mara tells the guard she is a merchant.'];
const tok = s => Math.round(s.length / 4);
const ctx = globalThis.SillyTavern.getContext();
const rows = [];
for (const year of [1300, 1850, 1990]) {
  let plTok = 0, naTok = 0, plHits = new Set(), naHits = new Set(), brief;
  for (const line of LINES) {
    ctx.chatMetadata = {}; H.m.setStoryTime(parseStoryTime(`${year}-06-01 12:00`)); ctx.chat = [{ is_user: true, mes: line }];
    const routed = R.routedTools(line, n => T.REGISTRY.has(n)) ?? undefined;
    const pl = Q.toolCatalogue(routed); plTok += tok(pl); for (const m of pl.match(OUT) ?? []) plHits.add(m.toLowerCase());
    const narr = []; for (const t of H.tools.values()) if (await t.shouldRegister()) narr.push(JSON.stringify({ name: t.name, description: t.description, parameters: t.parameters }));
    const nt = narr.join('\n'); naTok += tok(nt); for (const m of nt.match(OUT) ?? []) naHits.add(m.toLowerCase());
    brief = T.rulesBrief?.() ?? T.RULES_BRIEF;
  }
  const bh = [...new Set((brief.match(OUT) ?? []).map(x => x.toLowerCase()))];
  rows.push({ year, planner_tokens_per_line: Math.round(plTok / LINES.length), narrator_tokens_per_line: Math.round(naTok / LINES.length), brief_tokens: tok(brief), planner_words: [...plHits].sort().join(', '), narrator_words: [...naHits].sort().join(', '), brief_words: bh.join(', ') });
}
console.log(JSON.stringify(rows, null, 1));
