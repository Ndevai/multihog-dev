// The rule check's flags for the reply being redone, read once by the question pass, so each flagged event gets its tool
// run before the rewrite (a correction asking the narrator to "call" a tool reached a narrator that calls none).
export interface Flag { quote: string; tool: string; problem?: string }
// The turn they were raised for (turn.ts turnKey): a redo that never started leaves them to no other turn or chat.
let flags: Flag[] = [], forTurn = '';
export const setFlags = (f: Flag[], turn = '') => { flags = f; forTurn = turn; };
export const takeFlags = (turn = '') => { const f = forTurn === turn ? flags : []; flags = []; forTurn = ''; return f; };
