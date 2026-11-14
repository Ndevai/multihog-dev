// What the engine took from the player's line, shown back to the player in one short line per call (the "Read as" note,
// src/index.ts), the way a compiler shows what it parsed: the player sees which tool decides their act and with which
// person, distance or words, and can say it otherwise in the next line. Only the calls made for the player's character.
import { OWN_KIND } from './verbs.js';
// The argument naming who acts in each tool's call ("who" is the one struck in BodyStrike, the one acting elsewhere).
const ACTOR = { BodyStrike: ['attacker'], Look: ['viewer'], Listen: ['listener'], Communicate: ['speaker'], Interpret: ['listener'],
    Chase: ['pursuer', 'fleeing'], Transfer: ['from'], SocialResponse: ['speaker', 'requester_name', 'who'] };
const s = (v) => typeof v === 'string' ? v : v == null ? '' : String(v);
const cut = (t, n) => t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
/** Whether a call is made for the player's character: they act in it (or rest, sleep or walk in a PassTime). */
export function byPlayer(c, player) {
    if ((ACTOR[c.tool] ?? ['who']).some(k => c.args[k] === player))
        return true;
    return ['resting', 'sleeping', 'walking', 'active'].some(k => Array.isArray(c.args[k]) && c.args[k].includes(player));
}
/** One short line for a call, in the story's words (a paraphrase, as Attempto Controlled English shows its reading of a
 * sentence): who does what to whom, with the numbers that decide it. */
const SAYS = { whisper: 'whispers', normal: 'says', loud: 'calls', shout: 'shouts' };
export function readingOf(c) {
    const a = c.args;
    switch (c.tool) {
        case 'Look': return `${s(a.viewer)} looks at ${s(a.target) || 'the scene'}${typeof a.distance_m === 'number' ? `, ${a.distance_m} m away` : ''}`;
        case 'Listen': return `${s(a.listener)} listens${a.sound ? ` for ${s(a.sound)}` : ''}${typeof a.distance_m === 'number' ? `, ${a.distance_m} m off` : ''}`;
        case 'Communicate': return `${s(a.speaker)} ${SAYS[s(a.effort)] ?? 'says'} to ${s(a.listener)}${a.message ? `: "${cut(s(a.message), 48)}"` : ''}`;
        case 'BodyStrike': return `${s(a.attacker) || 'Someone'} strikes at ${s(a.who)}${a.attack ? ` (${s(a.attack)})` : ''}${a.part ? `, at the ${s(a.part)}` : ''}`;
        case 'Act': return `${s(a.who)} ${cut(s(a.action), 56)}${typeof a.distance_m === 'number' ? ` (${a.distance_m} m)` : ''}`;
        case 'PassTime': return `${s(a.minutes)} minutes pass${Array.isArray(a.sleeping) && a.sleeping.length ? ' in sleep' : ''}`;
        case 'Transfer': return `${s(a.from)} hands ${s(a.item)} to ${s(a.to)}`;
        case 'BodyCheck': return `${s(a.who)} tries to ${cut(s(a.task), 56)}${a.share ? ` (${s(a.share).replace(/^(\d+)%.*$/, '$1 %')} of such tries succeed)` : ''}${a.task_kind && a.task_kind !== OWN_KIND ? `, as ${s(a.task_kind)}` : ''}`;
        case 'Chase': return `${s(a.pursuer)} runs after ${s(a.fleeing)}${typeof a.gap_m === 'number' ? `, ${a.gap_m} m behind` : ''}`;
        case 'HoldOn': return `${s(a.who)} holds on${typeof a.load_kg === 'number' ? ` under ${a.load_kg} kg` : ''}`;
        case 'WorkOut': return `${s(a.who)} works out ${cut(s(a.problem), 40)}${a.kind ? ` (${s(a.kind)})` : ''}${typeof a.seconds === 'number' ? `, ${a.seconds} s` : ''}`;
        case 'SocialResponse': return `${s(a.who)} answers ${s(a.speaker) || s(a.requester_name) || 'the moment'}: ${cut(s(a.situation), 48)}`;
        default: {
            const parts = Object.entries(a).filter(([, v]) => typeof v === 'string' || typeof v === 'number').slice(0, 2).map(([, v]) => cut(s(v), 32));
            return `${c.tool}: ${parts.join(', ')}`;
        }
    }
}
/** The call itself, for the line's hover text (the way Disco Elysium keeps a check's modifiers in its tooltip): the tool and
 * the arguments that decide it. */
export function detailOf(c) {
    const v = (x) => Array.isArray(x) ? x.map(v).join(' + ') : typeof x === 'object' && x ? JSON.stringify(x) : s(x);
    return cut(`${c.tool}: ${Object.entries(c.args).filter(([, x]) => x !== undefined && x !== '' && x !== null).map(([k, x]) => `${k} ${v(x)}`).join(', ')}`, 240);
}
const KIND = {
    Look: 'sight', Listen: 'sound', Communicate: 'speech', Interpret: 'speech', SocialResponse: 'speech',
    BodyStrike: 'body', BodyCheck: 'body', BodyWound: 'body', BodyTreat: 'body', BodyChoke: 'body', BodyFall: 'body', HoldOn: 'body', BodyIntake: 'body',
    BodyEnvironment: 'body', BodyContact: 'body', BodyStatus: 'body', BodySize: 'body', Sickness: 'body', Disease: 'body', Dose: 'body', Battle: 'body',
    Act: 'move', Chase: 'move', Room: 'move', Layout: 'move', PlaceProfile: 'move',
    WorkOut: 'mind', Trust: 'mind', Claim: 'mind', RecordFact: 'mind', Choose: 'mind', RollTheDice: 'mind', CastSpell: 'mind', NewCharacter: 'mind', NameCharacter: 'mind',
    PassTime: 'time', Weather: 'time', Transfer: 'thing', Price: 'thing', Appraise: 'thing', Break: 'thing', Substance: 'thing',
};
export const kindOf = (tool) => KIND[tool] ?? 'mind';
export const modeOf = (c) => c.tool === 'Communicate' && c.args.means !== 'gesture' ? 'speaking' : c.tool === 'WorkOut' ? 'thinking' : undefined;
/** The call in the fewest words that still decide it, for the note's line after its tag: the player's character, who makes
 * every call the note shows, is left out, and the tag says the kind of act. */
const WORD = { whisper: 'whisper', normal: 'say', loud: 'call', shout: 'shout' };
export function briefOf(c, player) {
    const a = c.args, m = (k) => typeof a[k] === 'number' ? ` · ${a[k]} m` : '';
    switch (c.tool) {
        case 'Look': return `${s(a.target) || 'the scene'}${m('distance_m')}`;
        case 'Listen': return `${s(a.sound) || 'listening'}${m('distance_m')}`;
        case 'Communicate': return `${WORD[s(a.effort)] ?? 'say'} → ${s(a.listener)}${a.message ? `: “${cut(s(a.message), 40)}”` : ''}`;
        case 'BodyStrike': return `${s(a.attack) || 'blow'} → ${s(a.who)}${a.part ? ` · ${s(a.part)}` : ''}`;
        case 'Act': return `${cut(s(a.action), 48)}${m('distance_m')}`;
        case 'Chase': return a.pursuer === player ? `after ${s(a.fleeing)}${m('gap_m')}` : `away from ${s(a.pursuer)}${m('gap_m')}`;
        case 'PassTime': return `${s(a.minutes)} min${Array.isArray(a.sleeping) && a.sleeping.length ? ' · asleep' : ''}`;
        case 'Transfer': return `${s(a.item)} → ${s(a.to)}`;
        case 'BodyCheck': return `${cut(s(a.task), 48)}${a.share ? ` · ${s(a.share).replace(/^(\d+)%.*$/, '$1 %')}` : ''}`;
        case 'HoldOn': return `holding on${typeof a.load_kg === 'number' ? ` · ${a.load_kg} kg` : ''}`;
        case 'WorkOut': return `${cut(s(a.problem), 40)}${typeof a.seconds === 'number' ? ` · ${a.seconds} s` : ''}`;
        case 'SocialResponse': return `${s(a.speaker) || s(a.requester_name) ? `${s(a.speaker) || s(a.requester_name)}: ` : ''}${cut(s(a.situation), 40)}`;
        default: return Object.entries(a).filter(([k, v]) => (typeof v === 'string' || typeof v === 'number') && v !== player && k !== 'who').slice(0, 2).map(([, v]) => cut(s(v), 32)).join(' · ');
    }
}
/** The lines for the player's calls this turn, at most four, each with its call for the hover text, its kind, its brief
 * form and, for speaking and thinking, its mode. */
export function readingItems(calls, player) {
    if (!player)
        return [];
    return calls.filter(c => byPlayer(c, player)).slice(0, 4).map(c => { const mode = modeOf(c); return { text: readingOf(c), detail: detailOf(c), kind: kindOf(c.tool), brief: briefOf(c, player), ...mode ? { mode } : {} }; });
}
export const readingLines = (calls, player) => readingItems(calls, player).map(i => i.text);
