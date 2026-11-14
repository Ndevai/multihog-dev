// How closely the story follows the player's line (the player's pick, 2026-11-13): a knob by the message box with five stops,
// turned for the line about to be sent and back to 1.0 after it; the line keeps its stop (extra.rulesFaith). Each stop sets
// three things, as the player defined them from drawn choices: how the engine reads the line (ask.ts decide: the likeliest
// reading taken; the thresholds of today; a question whenever two readings fit), how the narrator writes the player's
// character's turn (faithLine), and what the rule check holds the reply to (faithAudit).
/** The knob's stops, from an idea (0) to the line as written (2). */
export const FAITH_STOPS = [0, 0.5, 1, 1.5, 2];
/** A stored or chosen value as a stop; 1 for anything else. */
export const faithOf = (v) => { const n = Number(v); return v != null && v !== '' && FAITH_STOPS.includes(n) ? n : 1; };
/** Each stop in a word or two, for the knob's label and the line's mark. */
export const FAITH_NAME = { 0: 'an idea', 0.5: 'loosely', 1: 'exactly', 1.5: 'to a T', 2: 'as written' };
/** Each stop in a sentence, for the knob's title. */
export const FAITH_SAYS = {
    0: 'Your line is an idea: the narrator writes your character\'s turn its own way.',
    0.5: 'Your acts, with small gestures and words added for your character; the likeliest reading is taken.',
    1: 'Exactly your acts; the engine asks when a wrong guess would hurt someone.',
    1.5: 'Your acts in your order and your words as you wrote them; the engine asks whenever two readings fit.',
    2: 'Your line stands as written and the reply begins after it; the engine asks whenever two readings fit.',
};
/** The share of the weight the likeliest reading needs to be taken unasked: 0 below 1.0 (taken, a tie included), more than
 * the whole above 1.0 (asked whenever two readings fit), and ask.ts's own thresholds at 1.0. */
export const faithNeeds = (f) => f < 1 ? 0 : f > 1 ? Infinity : null;
/** The stop after this one, turning clockwise; past 2.0 the knob comes round to 0. */
export const nextFaith = (f, step = 1) => FAITH_STOPS[(FAITH_STOPS.indexOf(f) + step + FAITH_STOPS.length) % FAITH_STOPS.length];
/** The narrator's instruction for the player's character's turn, at the line's stop. */
export function faithLine(f, player) {
    const rest = 'the rest of the reply belongs to the other characters and the world';
    const say = {
        0: `${player}'s line this turn is an idea for their turn: write ${player}'s acts and words your own way, keeping its aim.`,
        0.5: `Write ${player}'s acts and words from their line; small gestures and words of your own for ${player} may join them.`,
        1: `Write exactly the acts and words ${player}'s line gives them, in plain narration; ${rest}.`,
        1.5: `Write ${player}'s acts in the order their line gives them, and quote their words exactly as the line says them; ${rest}.`,
        2: `${player}'s line stands as written in the chat: begin the reply after it, with what the other characters and the world do next.`,
    };
    return `[THE PLAYER'S LINE]\n${say[f]}`;
}
/** The rule check's added kinds at the line's stop (empty below 1.0, where the reply is free to add): each flagged with tool
 * FAITH and its problem. */
export function faithAudit(f, player, line) {
    if (f < 1)
        return '';
    const said = `The player's line: "${line.trim()}"`;
    if (f >= 2)
        return `PLAYER'S LINE (it stands as written before the reply)\n${said}\nList each place where the reply retells the line's acts or words, with tool FAITH and problem retold_line.`;
    const act = `List each act or spoken word the reply gives ${player} beyond the acts and words of their line, with tool FAITH and problem added_act.`;
    return `PLAYER'S LINE (the reply keeps to it)\n${said}\n${act}${f >= 1.5 ? ` List each quotation of ${player} whose words differ from the words their line says, with tool FAITH and problem changed_words.` : ''}`;
}
/** What a flagged FAITH event asks of the rewrite. */
export const faithFix = (problem) => problem === 'retold_line' ? 'begin after the player\'s line: the reply holds what follows it'
    : problem === 'changed_words' ? 'quote the player\'s character\'s words as their line says them' : 'give the player\'s character the acts and words of their line, and those alone';
