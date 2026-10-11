// A turn is identified by the latest player message, so swipes and regenerates of the same reply share one turn.

function hash(text: unknown): string {
    let h = 0;
    for (const ch of String(text ?? '')) h = (Math.imul(h, 31) + ch.codePointAt(0)!) | 0;
    return (h >>> 0).toString(36);
}

export function turnKey(chat: STMessage[] | undefined): string {
    const users = (Array.isArray(chat) ? chat : []).filter(m => m?.is_user);
    return `${users.length}:${hash(users.at(-1)?.mes)}`;
}
