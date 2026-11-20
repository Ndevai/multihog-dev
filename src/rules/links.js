const GENERAL = /^(?:the|a|an|ones|people|folk|of)$/i;
/** A phrase's head word, lower case: its last word other than an article or a word for people in general, or what comes
 *  before "of" ("the keeper of the inn": keeper). */
export function headWord(phrase) {
    const ws = (String(phrase).split(/\s+of\s+/i)[0].match(/[\p{L}\p{N}'’-]+/gu) ?? []).filter(w => !GENERAL.test(w));
    return (ws.at(-1) ?? '').toLowerCase();
}
/** One /memory-link line: "a = b = c" (the same thing), "a : b" (a is a kind of b). */
export function parseLink(line) {
    const t = String(line).trim();
    if (t.includes('=')) {
        const parts = t.split('=').map(x => x.trim()).filter(Boolean), heads = [...new Set(parts.map(headWord).filter(Boolean))];
        return heads.length >= 2 ? { same: heads } : { error: 'Give two names or more for the same thing: /memory-link the Red Lion = Pike\'s = the inn' };
    }
    const m = /^(.+?)\s*:\s*(.+)$/.exec(t);
    if (m) {
        const a = headWord(m[1]), b = headWord(m[2]);
        return a && b && a !== b ? { kind: [a, b] } : { error: 'Give a word and its kind: /memory-link the returned : monster' };
    }
    return { error: 'Write the same thing under several names with "=" (the Red Lion = Pike\'s = the inn), or a kind with ":" (the returned : monster).' };
}
/** The groups a lorebook's entries give: each enabled entry's plain keys (not /regular expressions/), by head word, when they
 *  are two words or more. */
export function groupsOfLore(entries) {
    const out = [];
    for (const e of entries) {
        if (e.disable || !Array.isArray(e.key))
            continue;
        const heads = [...new Set(e.key.map(String).filter(k => k.trim() && !/^\/.*\/[a-z]*$/.test(k.trim())).map(headWord).filter(Boolean))];
        if (heads.length >= 2)
            out.push(heads);
    }
    return out;
}
/** The lines a /memory-link listing shows. */
export const linkLines = (l) => [...l.same.map(g => g.join(' = ')), ...Object.entries(l.kinds).map(([a, b]) => `${a} : ${b}`)];
