// The turn they were raised for (turn.ts turnKey): a redo that never started leaves them to no other turn or chat.
let flags = [], forTurn = '';
export const setFlags = (f, turn = '') => { flags = f; forTurn = turn; };
export const takeFlags = (turn = '') => { const f = forTurn === turn ? flags : []; flags = []; forTurn = ''; return f; };
