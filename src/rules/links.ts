// The story's own links between words (2026-11-18, section 104; the player's question of 2026-11-17: "is it possible to
// configure the word's link?"). WordNet knows how common words relate; a story's own names (an inn, a kind that is not
// real, a family's nickname) it does not. Two links can be set, and memory drifts along them as it does along WordNet's
// (memory-meaning.ts heldBy):
// - the same thing under several names: a changed one comes out as another of them. Each SillyTavern lorebook entry's keys
//   name one thing, so the card's and the chat's lorebooks give these groups as they are; /memory-link adds more
//   ("the Red Lion = Pike's = the inn");
// - a kind of something: a lost word is held as that kind, a changed one as another of it ("the returned : monster").
// A phrase stands by its head word: English noun phrases put their head last ("the magical forest", "the Red Lion"; Quirk et
// al. 1985, ch. 17), so the last word other than a word for people in general ("the cold ones": cold) [memory drifts word by
// word, memory-drift.ts detailsOf]. A lorebook's keys are the words that bring its entry up, mostly names for the thing
// [ASSUMED: a key that is only a related word links too].
export interface Links { same: string[][]; kinds: Record<string, string> }

const GENERAL = /^(?:the|a|an|ones|people|folk|of)$/i;
/** A phrase's head word, lower case: its last word other than an article or a word for people in general, or what comes
 *  before "of" ("the keeper of the inn": keeper). */
export function headWord(phrase: string): string {
    const ws = (String(phrase).split(/\s+of\s+/i)[0]!.match(/[\p{L}\p{N}'’-]+/gu) ?? []).filter(w => !GENERAL.test(w));
    return (ws.at(-1) ?? '').toLowerCase();
}
/** One /memory-link line: "a = b = c" (the same thing), "a : b" (a is a kind of b). */
export function parseLink(line: string): { same: string[] } | { kind: [string, string] } | { error: string } {
    const t = String(line).trim();
    if (t.includes('=')) {
        const parts = t.split('=').map(x => x.trim()).filter(Boolean), heads = [...new Set(parts.map(headWord).filter(Boolean))];
        return heads.length >= 2 ? { same: heads } : { error: 'Give two names or more for the same thing: /memory-link the Red Lion = Pike\'s = the inn' };
    }
    const m = /^(.+?)\s*:\s*(.+)$/.exec(t);
    if (m) { const a = headWord(m[1]!), b = headWord(m[2]!); return a && b && a !== b ? { kind: [a, b] } : { error: 'Give a word and its kind: /memory-link the returned : monster' }; }
    return { error: 'Write the same thing under several names with "=" (the Red Lion = Pike\'s = the inn), or a kind with ":" (the returned : monster).' };
}
/** The groups a lorebook's entries give: each enabled entry's plain keys (not /regular expressions/), by head word, when they
 *  are two words or more. */
export function groupsOfLore(entries: { key?: unknown; disable?: unknown }[]): string[][] {
    const out: string[][] = [];
    for (const e of entries) {
        if (e.disable || !Array.isArray(e.key)) continue;
        const heads = [...new Set((e.key as unknown[]).map(String).filter(k => k.trim() && !/^\/.*\/[a-z]*$/.test(k.trim())).map(headWord).filter(Boolean))];
        if (heads.length >= 2) out.push(heads);
    }
    return out;
}
/** The lines a /memory-link listing shows. */
export const linkLines = (l: Links) => [...l.same.map(g => g.join(' = ')), ...Object.entries(l.kinds).map(([a, b]) => `${a} : ${b}`)];
