// A turn is identified by the latest player message, so swipes and regenerates of the same reply share one turn.
function hash(text) {
    let h = 0;
    for (const ch of String(text ?? ''))
        h = (Math.imul(h, 31) + ch.codePointAt(0)) | 0;
    return (h >>> 0).toString(36);
}
export function turnKey(chat) {
    const users = (Array.isArray(chat) ? chat : []).filter(m => m?.is_user);
    return `${users.length}:${hash(users.at(-1)?.mes)}`;
}
/** A turn's place: how many lines the player has written, the latest included (the same for a line edited in place). */
export const placeOf = (key) => key?.split(':')[0];
/** A turn's line: the hash of the latest line's words, the same wherever a deletion before it moves the line. */
export const lineOf = (key) => key?.split(':')[1];
