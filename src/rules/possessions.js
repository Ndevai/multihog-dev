export const HOW = ['given', 'sold', 'bought', 'stolen', 'taken by force', 'found', 'made', 'lost', 'used up', 'dropped'];
const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/^(a|an|the|some)\s+/, '').trim();
/** Same item, singular or plural ("shilling", "Shillings", "boxes"). */
const same = (a, b) => { const x = norm(a), y = norm(b); return x === y || `${x}s` === y || `${y}s` === x || `${x}es` === y || `${y}es` === x; };
const count = (n, item) => n === 1 ? item : /s$/.test(item) ? `${n} ${item}` : `${n} ${item}s`;
function holding(st, who) {
    st.items ??= {};
    return (st.items[who] ??= []);
}
/** Adds quantity of item to who. */
/** Marks who's belongings as accounted: from now on they give only what is on record. */
export function account(st, who) {
    st.accounted ??= [];
    if (!st.accounted.includes(who))
        st.accounted.push(who);
    holding(st, who);
}
export function give(st, who, item, qty = 1) {
    const list = holding(st, who), have = list.find(x => same(x.item, item));
    if (have)
        have.qty += qty;
    else
        list.push({ item: item.trim(), qty });
}
/**
 * Moves an item. from/to absent = the world (found, made, bought from no one tracked; lost, used up, sold away).
 * A holder whose belongings are accounted (a player's character, after Claim decided something they have) gives only
 * what is on record; anyone else is taken at the story's word: a baker has bread without a list of it.
 */
export function transfer(st, a) {
    const qty = Math.max(1, Math.round(a.quantity ?? 1));
    if (a.from) {
        const list = holding(st, a.from), have = list.find(x => same(x.item, a.item));
        if (!have && st.accounted?.includes(a.from))
            return `${a.from} has no ${a.item} on record (holds: ${list.map(x => count(x.qty, x.item)).join(', ') || 'nothing'}). Nothing recorded.`;
        if (have && have.qty < qty)
            return `${a.from} has only ${count(have.qty, have.item)}. Nothing recorded.`;
        if (have) {
            have.qty -= qty;
            if (!have.qty)
                list.splice(list.indexOf(have), 1);
        }
    }
    if (a.to)
        give(st, a.to, a.item, qty);
    const where = a.to ? `${a.to} now has it` : 'it is gone from the story';
    return `${count(qty, a.item)} ${a.how}${a.from ? ` from ${a.from}` : ''}${a.to ? ` to ${a.to}` : ''}; ${where}. Recorded.`;
}
/** "[HAS] … [/HAS]", one line per holder, or '' when nothing is recorded. */
export function possessionsBlock(st) {
    const lines = Object.entries(st.items ?? {}).filter(([, l]) => l.length).map(([who, l]) => `${who}: ${l.map(x => count(x.qty, x.item)).join(', ')}`);
    return lines.length ? `[HAS]\nWhat each character carries, as the story last recorded it.\n${lines.join('\n')}\n[/HAS]` : '';
}
