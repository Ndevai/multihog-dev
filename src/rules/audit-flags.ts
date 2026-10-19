// The rule check's flags for the reply being redone, read once by the question pass, so each flagged event gets its tool
// run before the rewrite (a correction asking the narrator to "call" a tool reached a narrator that calls none).
export interface Flag { quote: string; tool: string; problem?: string }
let flags: Flag[] = [];
export const setFlags = (f: Flag[]) => { flags = f; };
export const takeFlags = () => { const f = flags; flags = []; return f; };
