let flags = [];
export const setFlags = (f) => { flags = f; };
export const takeFlags = () => { const f = flags; flags = []; return f; };
