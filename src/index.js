// Rules Engine for SillyTavern: code decides outcomes, the narrator writes them (docs/df-body-engine.md). Each turn a
// question pass names the outcomes in doubt and the engine decides them; the narrator gets the brief, the story time,
// [BODY], [KNOWS] and [DECIDED] as one system message; a rule check reads the reply and redoes it once when it bends a result.
import { pulseSelfTest } from './rules/pulse.js';
import { registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat, rulesBrief, RULES_BRIEF_DECIDED, knowledgeInjection, whereInjection, setPresent, possessionsInjection, scenePosition, questionPassRan, storyTime, setStoryTime, REGISTRY, historyCheck, sceneSky, scenePlace, storyYearNow, store, saveState, } from './rules/rules-tools.js';
import { pathOf, sentenceAt } from './rules/why.js';
import { toldPhrase } from './rules/memory-meaning.js';
import { onTheTongue, totPhrase } from './rules/tongue.js';
import { parseLink, groupsOfLore, linkLines, headWord } from './rules/links.js';
import { setLinks } from './rules/memory-meaning.js';
import { memoryOf, memoryAbout, reportRows, pictureFeeling, timelineOf, mapView, sensedThisTurn } from './rules/views.js';
import { FAITH_STOPS, FAITH_NAME, FAITH_SAYS, faithOf, faithLine, nextFaith } from './rules/faith.js';
import { runQuestionPass, decidedInjection, decidedResults, turnLog, setGuided, setOpen, GUIDED, actionItems, rephraseAsked, takenReading, redoneBy, voiceRead, meantReading, storyResult } from './rules/question-pass.js';
import { noteView, notesOf, platesOf, drawModes, voiceUnits, lineToTakeBack, drawNote, askPopup, askAnswer, saidOf, eraOf, toneOf, VOICE_GROUPS, mirrorParts, drawVoice, lookVars, heldParts, RUN_MARKS, NOTE_KEY } from './ui.js';
import { markWords, keyDelete, hasHidden, notateChat, visible, untagged, notateRequest, marksOf } from './rules/voice-code.js';
import { NARRATION_RULE, TELLING_RULE, narrationSchema, readNarration, proseOf } from './rules/narration.js';
import { speakersOf, takeSpeakers, SPEAKER_RULE, cutsOf, revealTimes, autoWait, slotOf, keyPhrase, boxFontPx, boxLinesAt, sceneLine, sceneBadge, cardRole, metBefore, tagFloorPx, explainParts, muffleSpeech } from './rules/box.js';
import { peek } from './rules/constants.js';
import { voiceOf, voiceLine, voiceFactsOf, voicesReady, voiceHarmonics, speakingFactsOf } from './rules/voice-body.js';
import { speechVoice, speechVoiceFile, speechTimes, scaleTimes } from './rules/speech.js';
import { POCKET_MODEL, bodyTarget, habitsOf, freeCacheLength, spokenText, pocketJob } from './rules/pocket.js';
import { blipPlan, BLIP_RAMP_S } from './rules/blips.js';
import { measureSong, songPoints, areasOf, areaWords, sceneTarget, chooseSong } from './rules/music.js';
import { onRulesAuditMessage, takeAuditNote, registerRulesStatsCommand } from './rules/rules-audit.js';
import { registerRulesEvalCommand } from './rules/eval.js';
import { bodyBlock, trackedPeople } from './rules/body-sheet.js';
import { VOCAL_FAMILY } from './rules/emotion.js';
import { parseStoryTime, formatStoryTime } from './rules/clock.js';
import { sendModel } from './send.js';
import { worldBlock, applyWorld, checkEntry, parseEntry, FILL_SYSTEM } from './rules/world.js';
import { drawStart, rollSeed, knownStart, startParts, seedCalls, kindGrowth } from './rules/seed.js';
import { yearByYear, figuresIn } from './rules/world-count.js';
import { societyOf, societyBlock, townLine, seenPer100k } from './rules/society.js';
import { townOf } from './rules/town.js';
import { startCardHtml } from './rules/start-card.js';
import { removeWithDescendants, outcomeLine, bornIn } from './rules/counterfactual.js';
import { firstYear, earlier, loadChat } from './rules/history.js';
import { loadPopulation } from './rules/population.js';
import { seededRng, gauss } from './rules/body-engine.js';
import { expressionSet, lookWords, jointOf } from './rules/expression-set.js';
import { faceTags, lookLabel, portraitTags, hordeAtOnce } from './rules/face-words.js';
import { makeFaces, drawPortrait, seedOf, lookPicture, saveSprite, spriteLabels, FaceQueue } from './faces.js';
import { colouringOf, dressOf, genotypeOf } from './rules/colouring.js';
import { loadColex } from './rules/colex.js';
import { loadLanguageYears } from './rules/languages.js';
import { loadThings } from './rules/things.js';
const NAME = 'rules-engine', KEY = 'rules_engine';
// SillyTavern extension_prompt_types.IN_CHAT and extension_prompt_roles.SYSTEM (public/script.js).
const IN_CHAT = 1, SYSTEM = 0;
// The engine's message sits this many messages above the end of the chat: 1 = just above the player's last message.
const DEPTH = 1;
const DEFAULTS = { keyboardLayout: 'auto', enabled: true, questionPass: true, ruleCheck: true, structured: true, suggest: false, distinct: true, page: true, pageColours: 'light', box: true, boxUnit: 'voice', boxPicture: 'none', boxLook: 'night', boxVoice: 'natural', boxTyping: true, boxAuto: false, musicOn: true, musicVolume: 0.6, songs: [], musicAreaNames: {}, profile: '', maxTokens: 0, effort: 'low' };
const ctx = () => SillyTavern.getContext();
const toastr = globalThis.toastr;
/** The stored settings, a default filled in for each key the store lacks. The store's own object is returned, so a value set
 * on it stays (a new object on each call lost a write whose right side read the settings again). */
function settings() {
    const all = ctx().extensionSettings, s = (all[NAME] ??= {});
    for (const [k, v] of Object.entries(DEFAULTS))
        if (!(k in s))
            s[k] = Array.isArray(v) ? [...v] : v && typeof v === 'object' ? { ...v } : v;
    if (s.boxVoice === 'speech')
        s.boxVoice = 'robotic'; // section 63's name for eSpeak
    return s;
}
// A connection that refuses the plan's schema (a 400, an unknown field) is asked again without it, and the plan goes back to
// being read from free text for the rest of the session.
const send = async (system, user, o = {}) => {
    const s = settings(), base = { profile: s.profile, maxTokens: s.maxTokens, effort: s.effort ?? 'low' };
    if (!o.schema)
        return sendModel(system, user, base);
    try {
        return await sendModel(system, user, { ...base, schema: o.schema });
    }
    catch (e) {
        // Only a refusal of the schema itself turns it off; a rate limit or a dropped connection is that turn's failure alone
        // (a 429 had turned structured output off for the rest of the session).
        if (!/schema|response_format|guided/i.test(String(e?.message ?? e)))
            throw e;
        console.warn('[Rules engine] schema refused; plans read from text from now on:', e);
        setGuided(false);
        return sendModel(system, user, base);
    }
};
// Card text shown to the question model, characters per field [ASSUMED]: enough for species, build and training.
const CARD_CHARS = 1500;
/** The player's persona, the character card and the scenario: where species, build and training are written. */
function groupMembers() {
    const c = ctx();
    const g = c.groupId ? c.groups?.find(x => x.id === c.groupId) : null;
    return g ? g.members.map(a => c.characters.find(ch => ch.avatar === a)).filter((x) => !!x) : [];
}
function castBlock() {
    const c = ctx();
    const raw = c.getCharacterCardFields?.() ?? {};
    const field = (k) => { const v = raw[k]; return String((typeof v === 'function' ? v() : v) ?? '').trim().slice(0, CARD_CHARS); };
    const lines = [
        field('persona') && `${c.name1 || 'Player'} (the player's character): ${field('persona')}`,
        field('description') && `${c.name2 || 'Character'}: ${field('description')}`,
        // A group chat's other members, each with their own card (drawn as strangers they took a random age and sex).
        ...groupMembers().filter(m => m.name !== c.name2).map(m => `${m.name}: ${String(m.description ?? m.data?.description ?? '').trim().slice(0, CARD_CHARS) || 'a character of this story'}`),
        field('scenario') && `Scenario: ${field('scenario')}`,
    ].filter(Boolean);
    return lines.length ? `[CAST]\n${lines.join('\n')}\n[/CAST]` : '';
}
// The world book belongs to the character card, so every chat with that card shares it; a group chat keeps its own.
const cardOf = () => { const c = ctx(); return !c.groupId && c.characterId !== undefined ? c.characters[Number(c.characterId)] : null; };
function getBook() {
    const card = cardOf();
    return (card ? card.data?.extensions?.rulesWorld : ctx().chatMetadata?.rulesWorld) ?? [];
}
async function saveBook(book) {
    const c = ctx(), card = cardOf();
    if (card)
        await c.writeExtensionField(Number(c.characterId), 'rulesWorld', book);
    else {
        c.chatMetadata.rulesWorld = book;
        await c.saveMetadata();
    }
    applyWorld(book);
    renderBook();
}
/** Drafts an entry from one line, shows it for editing, and saves what the user approves. The line is read in its words: the
 *  voice marks hidden in it (voice-code.ts) say how a line is spoken, which an entry of the world does not hold. */
async function addEntry(text) {
    const line = visible(text);
    let draft = null;
    try {
        draft = parseEntry(await send(FILL_SYSTEM, `Line: ${line}\nStory setting: ${[storyState(), castBlock()].filter(Boolean).join('\n') || 'not given'}`));
    }
    catch (e) {
        console.warn('[Rules engine] world fill failed:', e);
    }
    return approveEntry(draft ?? { what: line });
}
/** A person gone from history from `year` on: code draws, once, what becomes of each of their inventions; the user approves. */
async function removePersonEntry(arg) {
    // A year sets when the person is gone; without one, they never lived (from their birth year, when Wikidata has it).
    const m = arg.match(/^(.+?)(?:[,;]\s*(-?\d{1,4}))?\s*$/);
    if (!m || !m[1].trim())
        return 'Give a name, and a year when they are gone: /world-without Karl Benz, 1880 (no year: they never lived).';
    const name = m[1].trim(), year = m[2] != null ? Number(m[2]) : bornIn(name);
    if (year == null)
        return `No birth year for "${name}"; give the year: /world-without ${name}, 1880.`;
    const salt = ctx().chatMetadata?.rulesEngine?.salt ?? '';
    const { people, outcomes } = removeWithDescendants(name, year, seededRng(`${salt}:without:${name.toLowerCase()}:${year}`));
    if (!outcomes.length && !people.length)
        return `No invention or discovery by "${name}" from ${year} on in the lists (Wikipedia's timeline of inventions and a Wikidata export: about 2,400 with a named inventor).`;
    return approveEntry({ what: `${name} gone from ${year}`, kind: 'event', since: year, worldwide: true,
        cause: m[2] != null ? `${name} died before ${year}.` : `${name} never lived.`, reaches: ['daily life'], reflections: [...people, ...outcomes.map(outcomeLine)].slice(0, 15),
        changes: outcomes.map(changeOf) });
}
const changeOf = (o) => o.result === 'never made' ? { what: o.what, year: o.year, never: true } : { what: o.what, year: o.year, new_year: o.newYear ?? o.year };
const saltOf = () => ctx().chatMetadata?.rulesEngine?.salt ?? '';
/** An event that removes named people from a year: /world-event The plague of 1665 reaches Cambridge; Isaac Newton; 1665 */
async function eventEntry(arg) {
    const [cause, names, y] = arg.split(';').map(x => x.trim());
    const year = Number(y);
    if (!cause || !names || !Number.isFinite(year))
        return 'Give the event, the people it removes and the year: /world-event The plague reaches Cambridge; Isaac Newton; 1665';
    const all = names.split(',').map(n => n.trim()).filter(Boolean).map(n => removeWithDescendants(n, year, seededRng(`${saltOf()}:event:${n.toLowerCase()}:${year}`)));
    const people = all.flatMap(r => r.people), outcomes = all.flatMap(r => r.outcomes);
    return approveEntry({ what: cause, kind: 'event', since: year, worldwide: true, cause, reaches: ['daily life'],
        reflections: [...people, ...outcomes.map(outcomeLine)].slice(0, 15).concat(people.length || outcomes.length ? [] : [cause]), changes: outcomes.map(changeOf) });
}
/** An invention made earlier than in real history: /world-earlier telephone, 1850 */
async function earlierEntry(arg) {
    const m = arg.match(/^(.+?)[,;]\s*(-?\d{1,4})\s*$/);
    if (!m)
        return 'Give the invention and the year: /world-earlier telephone, 1850';
    const f = firstYear(m[1].trim());
    if (!f)
        return `No dated invention matches "${m[1].trim()}".`;
    const r = earlier(f.year, Number(m[2]), seededRng(`${saltOf()}:earlier:${f.label.toLowerCase()}:${m[2]}`));
    toastr.info(`${f.label}: real ${f.year}; a lead of ${f.year - Number(m[2])} years is matched by ${Math.round(r.share * 100)} % of first discoverers; drawn: ${r.year}.`, 'World book');
    return approveEntry({ what: `${f.label} made early`, kind: 'technology', since: r.year, worldwide: true, cause: `An inventor ahead of the field made ${f.label} in ${r.year}.`,
        reaches: ['daily life'], reflections: [`${f.label[0].toUpperCase()}${f.label.slice(1)} exists from ${r.year}.`], changes: [{ what: f.label, year: f.year, new_year: r.year }] });
}
/** Shows an entry for editing until it passes the check or is cancelled; saves it. */
async function approveEntry(draft) {
    const c = ctx();
    let text = JSON.stringify(draft, null, 1);
    for (;;) {
        const edited = await c.callGenericPopup('<h3>World book entry</h3><small>Edit and press OK to save; Cancel discards it.</small>', c.POPUP_TYPE.INPUT, text, { wide: true, large: true, rows: 18 });
        if (typeof edited !== 'string' || !edited.trim())
            return 'World book: nothing saved.';
        let raw;
        try {
            raw = JSON.parse(edited);
        }
        catch {
            toastr.warning('Not valid JSON; fix it and press OK.', 'World book');
            text = edited;
            continue;
        }
        const { entry, errors } = checkEntry(raw);
        if (!entry) {
            toastr.warning(errors.join('; '), 'World book');
            text = edited;
            continue;
        }
        await saveBook([...getBook(), entry]);
        return `World book: saved "${entry.what}".`;
    }
}
function renderBook() {
    const list = document.getElementById('rules_engine_world_list');
    if (!list)
        return;
    const book = getBook();
    list.innerHTML = '';
    if (!book.length) {
        list.textContent = 'No entries: the world is real history.';
        return;
    }
    book.forEach((e, i) => {
        const row = document.createElement('div');
        row.className = 'flex-container alignItemsCenter';
        const label = document.createElement('span');
        label.className = 'flex1';
        label.textContent = `${e.what} (${e.kind}, ${e.since ?? 'always'}, ${e.worldwide ? 'everywhere' : `${e.lat}, ${e.lon}, ${e.radius_km ?? 300} km`})`;
        const del = document.createElement('div');
        del.className = 'menu_button fa-solid fa-trash-can';
        del.title = 'Remove';
        del.addEventListener('click', () => { void saveBook(getBook().filter((_, j) => j !== i)); });
        row.append(label, del);
        list.append(row);
    });
}
function registerWorldCommands() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-add', helpString: 'Add to this card\'s world book: /world-add orcs in London since the 900s. The model drafts the entry; you edit and approve it.',
        callback: async (_a, v) => String(v ?? '').trim() ? addEntry(String(v).trim()) : 'Give a line: /world-add orcs in London since the 900s.',
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-without', helpString: 'A person gone from history from a year on: /world-without Karl Benz, 1880. Each of their inventions after that year is made by another inventor, made later, or never made (drawn once, from the rates of independent invention); you edit and approve the entry.',
        callback: async (_a, v) => removePersonEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-event', helpString: 'An event that removes people from a year: /world-event The plague reaches Cambridge; Isaac Newton, Isaac Barrow; 1665. Their children not yet born and their inventions follow as for /world-without.',
        callback: async (_a, v) => eventEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-earlier', helpString: 'An invention made earlier than in real history: /world-earlier telephone, 1850. The lead is drawn against how far ahead real first inventors were.',
        callback: async (_a, v) => earlierEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-list', helpString: 'Show this card\'s world book.',
        callback: async () => worldBlock(getBook(), scenePosition()) || 'The world book is empty: the world is real history.',
    }));
}
/** What the question model and the narrator read about the story now: time and bodies. */
function storyState() {
    const t = storyTime();
    const here = scenePosition();
    // Sun above the horizon at the scene, for the world book's day and night creatures (a calendar date is needed: a bare
    // "Day N" count has no season).
    const sky = t !== null && here ? sceneSky(t) : null, sunUp = sky ? sky.sunAlt >= 0 : null;
    return [worldBlock(getBook(), here, sunUp), t === null ? '' : `[TIME]\n${formatStoryTime(t)}\n[/TIME]`, bodyBlock(trackedPeople()), looksInjection(), possessionsInjection()].filter(Boolean).join('\n');
}
globalThis.rulesEngineInterceptor = async (chat, _size, abort, type) => {
    const s = settings(), c = ctx();
    c.setExtensionPrompt(KEY, '', IN_CHAT, DEPTH);
    if (!s.enabled)
        return;
    // The player's hidden voice marks become the notation the model reads (voice-code.ts); the engine reads their codes, and
    // the chat as saved keeps them hidden (SillyTavern hands interceptors copies of its messages).
    notateChat(chat);
    if (!c.chatMetadata || ['quiet', 'impersonate'].includes(type))
        return;
    // The chat this turn belongs to: opening another chat while the pass waits on the model or the player ends the turn.
    const meta = c.chatMetadata, moved = () => ctx().chatMetadata !== meta;
    // Each tracked adult's resting voice is a simulation run (voice-sound.ts), started when the chat opened; the notes wait
    // for the runs still going, so the narrator reads every pitch.
    await voicesReady(trackedPeople());
    if (moved())
        return;
    if (s.questionPass && type !== 'continue') {
        try {
            const read = await runQuestionPass(chat, send, [storyState(), castBlock()].filter(Boolean).join('\n'), choose, ask);
            if (moved()) {
                if (typeof abort === 'function')
                    abort(true);
                return;
            }
            // The player closed a question to say it another way: the reply waits for their next line (a toast confirms what
            // they just did).
            if (rephraseAsked()) {
                takeBack();
                toastr.info('Your line is back in the box: say it another way.', 'Your line');
                if (typeof abort === 'function')
                    abort(true);
                return;
            }
            // What the engine took from the player's line goes under that line and stays (src/ui.ts): a correction it redid,
            // a reading taken unasked with its change, one line per call for their character (reading.ts), the things read.
            keepNote({ redone: redoneBy(), taken: takenReading(), meant: meantReading(), voice: voiceRead(), acts: actionItems(), things: read.map(r => `${r.phrase} → ${r.label}${r.year != null ? ` (${r.year})` : ''}`) });
        }
        catch (e) {
            console.warn('[Rules engine] question pass skipped:', e);
        }
        if (moved()) {
            if (typeof abort === 'function')
                abort(true);
            return;
        }
    }
    // Suggestions: for a world that departs far from real history, the engine's outcomes are offered, and the story and the
    // world book decide; the rule check then redoes nothing and the reply is free prose.
    const suggest = settings().suggest;
    const decided = suggest ? decidedInjection().replace(/Narrate them as given; they stand\./, SUGGEST_LINE) : decidedInjection();
    // While the box is on, the narrator names the speaker before each quotation (box.ts SPEAKER_RULE), for the box's plate.
    // How closely the reply follows the player's line: its knob's stop (faith.ts).
    const line = [...(c.chat ?? [])].reverse().find(m => m.is_user), follow = line ? faithLine(faithOf(line.extra?.rulesFaith), playerName()) : '';
    const parts = [!questionPassRan() ? rulesBrief() : suggest ? SUGGEST_BRIEF : RULES_BRIEF_DECIDED, storyState(), knowledgeInjection(), whereInjection(), societyNow(), decided, follow, takeAuditNote() ?? '', TELLING_RULE, structuredNow() ? NARRATION_RULE : '', boxOn() ? SPEAKER_RULE : ''];
    // The narrator's prompt carries no hidden tag character (voice-code.ts untagged).
    c.setExtensionPrompt(KEY, untagged(parts.filter(Boolean).join('\n\n')), IN_CHAT, DEPTH, false, SYSTEM);
};
// A question's popup (src/ui.ts askPopup): one sentence with every choice linked alike, numbered, nothing chosen or focused in
// advance, in the story's period type; "Say it another way", closing it or Escape means "none of these".
const reducedMotion = () => { try {
    return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
catch {
    return false;
} };
async function pick(q) {
    const c = ctx(), p = askPopup(q, { era: eraOf(storyYearNow()), reduced: reducedMotion() });
    return askAnswer(await c.callGenericPopup(p.content, c.POPUP_TYPE.TEXT, '', p.options), q.choices.length);
}
// Two things fit the player's word equally: the player says which (a guess would change what the scene can hold).
const choose = async (phrase, [a, b]) => {
    const say = (o) => `${o.label}${o.year != null ? ` (${o.year})` : ''}`, short = (t) => t.length > 70 ? `${t.slice(0, 69).trimEnd()}…` : t;
    const i = await pick({ said: phrase, choices: [say(a), say(b)], notes: [short(a.description), short(b.description)], things: true });
    return i === 0 ? a.id : i === 1 ? b.id : null;
};
// A choice the player's line leaves open (ask.ts): the player picks one of its readings.
const ask = async (question, options) => {
    const i = await pick({ said: saidOf(question), choices: options });
    return i == null ? null : options[i];
};
// The reading note (src/ui.ts) is kept on the player's message (extra.rulesReading) and drawn under it whenever the chat is
// drawn; "change" is offered on the player's latest line only, the one a correction can redo.
// The line the player chose to say another way leaves the chat and returns to the input box, marks and all, once the
// generation it started has stopped: the next line stands in its place, so the narrator and the engine read the same line.
function takeBack() {
    const c = ctx(), back = lineToTakeBack(c.chat ?? []);
    if (!back)
        return;
    const msg = c.chat[back.index];
    setTimeout(async () => {
        if (ctx().chat?.[back.index] !== msg)
            return;
        if (c.deleteMessage)
            await c.deleteMessage(back.index);
        else if (c.deleteLastMessage) {
            await c.deleteLastMessage();
            await c.saveChat?.();
        }
        else
            return;
        fillInput(back.text);
    }, 0);
}
function lastUserIndex() { const chat = ctx().chat ?? []; for (let i = chat.length - 1; i >= 0; i--)
    if (chat[i]?.is_user)
        return i; return -1; }
// Written while the reply is generated; SillyTavern saves the chat, the note with it, when the reply arrives.
function keepNote(note) {
    const msg = ctx().chat?.[lastUserIndex()];
    if (!msg)
        return;
    msg.extra ??= {};
    if (noteView(note, true))
        msg.extra[NOTE_KEY] = { ...note, line: String(msg.mes ?? '') };
    else
        delete msg.extra[NOTE_KEY];
    drawNotes();
}
function fillInput(text) {
    const box = document.getElementById('send_textarea');
    if (!box)
        return;
    box.value = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.focus();
    box.setSelectionRange(text.length, text.length);
}
function drawNotes() {
    if (typeof document === 'undefined')
        return;
    document.querySelectorAll('#chat .rules-reading, #chat .rules-modes, #chat .rules-faith-mark').forEach(e => e.remove());
    if (!settings().enabled)
        return;
    // The story's era sets the type; the tone of what the text stands on, light or dark, sets the share each kind's colour takes.
    const look = { era: eraOf(storyYearNow()), tone: toneNow() };
    for (const { index, view } of notesOf(ctx().chat ?? [])) {
        const at = document.querySelector(`#chat .mes[mesid="${index}"] .mes_text`);
        if (at)
            at.after(drawNote(document, view, look, fillInput));
    }
    // The name plate of each player's line: after the name, what the character is doing in it (ui.ts modesOf).
    for (const { index, modes } of platesOf(ctx().chat ?? [])) {
        document.querySelector(`#chat .mes[mesid="${index}"] .name_text`)?.after(drawModes(document, modes));
    }
    // A line sent off 1.0 keeps a mark of its knob's stop after the name.
    (ctx().chat ?? []).forEach((m, i) => {
        const f = faithOf(m.is_user ? m.extra?.rulesFaith : 1);
        if (f === 1)
            return;
        const mark = document.createElement('span');
        mark.className = 'rules-faith-mark';
        mark.textContent = `${f.toFixed(1)} · ${FAITH_NAME[f]}`;
        mark.title = FAITH_SAYS[f];
        document.querySelector(`#chat .mes[mesid="${i}"] .name_text`)?.after(mark);
    });
}
// How closely the story follows the line about to be sent (the player's pick, 2026-11-13; rules/faith.ts): a knob by the message
// box with five stops. A tap turns it one stop on (past 2.0 round to 0), a drag up or down turns it, the wheel and the arrow
// keys too (a slider, WAI-ARIA Authoring Practices); the line sent keeps its stop and the knob comes back to 1.0.
let faithNow = 1;
/** The knob drawn at the stop: its notch from −100° (0) to +100° (2.0), its number beside it off 1.0, its title the stop's sentence. */
function drawFaithKnob() {
    const k = document.getElementById('rules-faith');
    if (!k)
        return;
    const turn = -100 + 200 * FAITH_STOPS.indexOf(faithNow) / (FAITH_STOPS.length - 1);
    k.querySelector('line')?.setAttribute('transform', `rotate(${turn} 13 13)`);
    k.setAttribute('data-faith', String(faithNow));
    k.setAttribute('aria-valuenow', String(faithNow));
    k.setAttribute('aria-valuetext', `${faithNow.toFixed(1)}: ${FAITH_NAME[faithNow]}`);
    k.title = `How closely the story follows this line: ${faithNow.toFixed(1)}, ${FAITH_NAME[faithNow]}. ${FAITH_SAYS[faithNow]}`;
}
function buildFaithKnob(form) {
    if (document.getElementById('rules-faith'))
        return;
    const k = document.createElement('div');
    k.id = 'rules-faith';
    k.tabIndex = 0;
    k.setAttribute('role', 'slider');
    k.setAttribute('aria-label', 'How closely the story follows this line');
    k.setAttribute('aria-valuemin', '0');
    k.setAttribute('aria-valuemax', '2');
    k.innerHTML = '<svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true"><circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" stroke-width="2"/><line x1="13" y1="13" x2="13" y2="5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    const set = (f) => { faithNow = f; drawFaithKnob(); };
    let drag = null;
    k.addEventListener('pointerdown', e => { drag = { y: e.clientY, from: faithNow, moved: false }; k.setPointerCapture?.(e.pointerId); });
    k.addEventListener('pointermove', e => {
        if (!drag)
            return;
        const steps = Math.trunc((drag.y - e.clientY) / 18);
        if (steps) {
            drag.moved = true;
            set(FAITH_STOPS[Math.max(0, Math.min(FAITH_STOPS.length - 1, FAITH_STOPS.indexOf(drag.from) + steps))]);
        }
    });
    k.addEventListener('pointerup', () => { if (drag && !drag.moved)
        set(nextFaith(faithNow)); drag = null; });
    k.addEventListener('pointercancel', () => { drag = null; });
    k.addEventListener('wheel', e => { e.preventDefault(); const i = FAITH_STOPS.indexOf(faithNow) + (e.deltaY < 0 ? 1 : -1); set(FAITH_STOPS[Math.max(0, Math.min(FAITH_STOPS.length - 1, i))]); }, { passive: false });
    k.addEventListener('keydown', e => {
        const i = FAITH_STOPS.indexOf(faithNow), last = FAITH_STOPS.length - 1;
        const to = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? Math.min(last, i + 1) : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? Math.max(0, i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'Enter' || e.key === ' ' ? (i + 1) % FAITH_STOPS.length : null;
        if (to != null) {
            e.preventDefault();
            set(FAITH_STOPS[to]);
        }
    });
    (document.getElementById('leftSendForm') ?? form).appendChild(k);
    drawFaithKnob();
}
/** The line just sent keeps the knob's stop, and the knob comes back to 1.0. */
function keepFaith(id) {
    const msg = ctx().chat?.[Number(id)];
    if (!msg?.is_user)
        return;
    if (faithNow !== 1)
        (msg.extra ??= {}).rulesFaith = faithNow;
    faithNow = 1;
    drawFaithKnob();
}
// How a line is said, marked without signs (src/rules/voice-code.ts, src/ui.ts): select words in the message box and a toolbar
// of plain words appears above it (the ♪ button by the box opens it for the word at the cursor); a pick marks the words with
// hidden codes, and a layer over the box underlines marked words in their group's soft colour. Sent, the line is typeset
// in the chat the way it sounds; before a model reads the chat, the codes become the notation the engine reads.
function buildVoice() {
    const form = document.getElementById('send_form'), box = document.getElementById('send_textarea');
    if (!form || !box || document.getElementById('rules-voice'))
        return;
    let pinned = false;
    const bar = document.createElement('div');
    bar.id = 'rules-voice';
    bar.hidden = true;
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'How the selected words are said');
    const edit = (r) => {
        box.focus();
        if (!r)
            return;
        box.setSelectionRange(r.from, r.to);
        // insertText keeps the box's own undo (Ctrl+Z); setRangeText where a browser lacks it.
        if (!document.execCommand?.('insertText', false, r.insert))
            box.setRangeText(r.insert, r.from, r.to, 'end');
        box.setSelectionRange(r.selStart, r.selEnd);
        box.dispatchEvent(new Event('input', { bubbles: true }));
    };
    for (const g of VOICE_GROUPS) {
        const group = document.createElement('span');
        group.className = `rules-voice-group rules-hl-${g.family}`;
        const name = document.createElement('span');
        name.className = 'rules-voice-name';
        name.textContent = g.group;
        group.appendChild(name);
        for (const item of g.items) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'rules-voice-btn';
            const label = document.createElement('span');
            label.className = item.mark ? `rules-v rules-v-${item.mark}` : 'rules-v';
            label.textContent = item.label;
            // Set as the chat sets them (ui.ts drawVoice): a pitch mark's curve, a stressed word's IPA stress mark, a drawn-out
            // vowel written again, a feeling in its colour.
            if (item.mark === 'up' || item.mark === 'down')
                label.setAttribute('data-pitch', item.mark);
            if (item.mark === 'stress') {
                const tick = document.createElement('span');
                tick.className = 'rules-v-add rules-v-add-tick';
                tick.textContent = 'ˈ';
                b.appendChild(tick);
            }
            const held = item.mark === 'stretch' ? heldParts(item.label.split(' ')[0]) : null;
            if (held) {
                const again = document.createElement('span');
                again.className = 'rules-v-add rules-v-add-held';
                again.textContent = held.again;
                label.replaceChildren(held.head, again, `${held.tail}${item.label.slice(item.label.indexOf(' '))}`);
            }
            if (item.id.startsWith('feeling:')) {
                label.classList.add('rules-v-feel');
                label.setAttribute('data-feeling', item.id.slice(8));
            }
            if (item.mark && RUN_MARKS.includes(item.mark))
                label.classList.add('rules-run', `rules-run-${item.mark}`);
            b.appendChild(label);
            b.title = `${g.group}: ${item.label}`;
            // The box keeps its selection: the button takes no focus on press.
            b.addEventListener('mousedown', e => e.preventDefault());
            b.addEventListener('click', () => { edit(markWords(box.value, box.selectionStart, box.selectionEnd, item.id)); paint(); });
            group.appendChild(b);
        }
        bar.appendChild(group);
    }
    form.before(bar);
    // The ♪ button beside the box: opens the toolbar for the word at the cursor, and closes it.
    const note = document.createElement('div');
    note.id = 'rules-voice-open';
    note.className = 'fa-solid fa-music interactable';
    note.title = 'How your line is said';
    note.tabIndex = 0;
    note.setAttribute('role', 'button');
    note.setAttribute('aria-pressed', 'false');
    const toggle = () => { pinned = !pinned; show(); box.focus(); };
    note.addEventListener('mousedown', e => e.preventDefault());
    note.addEventListener('click', toggle);
    // Enter and Space press it from the keyboard, as a button (WAI-ARIA Authoring Practices, Button pattern).
    note.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
    } });
    (document.getElementById('leftSendForm') ?? form).appendChild(note);
    buildFaithKnob(form);
    // Open while words are selected in the box, while the toolbar holds the focus (Tab from the box), or pinned by ♪.
    const show = () => { const focus = document.activeElement, sel = (focus === box || bar.contains(focus)) && box.selectionStart !== box.selectionEnd; bar.hidden = !(pinned || sel) || !settings().enabled; note.classList.toggle('rules-voice-on', pinned); note.setAttribute('aria-pressed', String(pinned)); };
    document.addEventListener('selectionchange', show);
    // Tab from the box enters the toolbar while it shows: the toolbar stands before the form, so the page's focus order passes it.
    box.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !bar.hidden) {
        e.preventDefault();
        bar.querySelector('button')?.focus();
    } });
    box.addEventListener('keyup', show);
    box.addEventListener('mouseup', show);
    box.addEventListener('blur', () => setTimeout(show, 0));
    bar.addEventListener('focusout', () => setTimeout(show, 0));
    // Backspace and Delete take a marked letter as one character (the browser alone takes one invisible code at a time).
    document.addEventListener('keydown', e => {
        const t = e.target;
        if (!(t instanceof HTMLTextAreaElement) || (t !== box && !t.classList.contains('edit_textarea')) || (e.key !== 'Backspace' && e.key !== 'Delete') || t.selectionStart !== t.selectionEnd || e.ctrlKey || e.altKey || e.metaKey)
            return;
        const r = keyDelete(t.value, t.selectionStart, e.key === 'Backspace');
        if (!r)
            return;
        e.preventDefault();
        t.setSelectionRange(r.from, r.to);
        const done = r.insert ? document.execCommand?.('insertText', false, r.insert) : document.execCommand?.('delete');
        if (!done) {
            t.setRangeText(r.insert, r.from, r.to, 'end');
            t.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }, true);
    // The layer over the box: the same text, invisible, in the same type and place, marked words underlined; clicks pass through.
    const layer = document.createElement('div');
    layer.id = 'rules-voice-layer';
    layer.setAttribute('aria-hidden', 'true');
    form.classList.add('rules-voice-form');
    form.appendChild(layer);
    const COPY = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth'];
    const paint = () => {
        const v = box.value;
        if (!hasHidden(v)) {
            layer.replaceChildren();
            layer.hidden = true;
            return;
        }
        layer.hidden = false;
        const cs = getComputedStyle(box);
        for (const k of COPY)
            layer.style[k] = cs[k];
        layer.style.left = `${box.offsetLeft + box.clientLeft}px`;
        layer.style.top = `${box.offsetTop + box.clientTop}px`;
        layer.style.width = `${box.clientWidth}px`;
        layer.style.height = `${box.clientHeight}px`;
        layer.replaceChildren(...mirrorParts(v).map(p => { if (!p.family)
            return document.createTextNode(p.text); const s = document.createElement('span'); s.className = `rules-hl rules-hl-${p.family}`; s.textContent = p.text; return s; }));
        layer.scrollTop = box.scrollTop;
    };
    box.addEventListener('input', paint);
    box.addEventListener('scroll', () => { layer.scrollTop = box.scrollTop; });
    new ResizeObserver(paint).observe(box);
    paint();
}
/** The player's sent lines typeset the way they sound: each text node holding hidden marks in a player's message is rewritten
 * as the words with their marks' classes (src/ui.ts drawVoice); done again whenever the message is drawn. */
function typesetChat() {
    if (typeof document === 'undefined' || !settings().enabled)
        return;
    for (const mes of document.querySelectorAll('#chat .mes[is_user="true"] .mes_text')) {
        const walk = document.createTreeWalker(mes, NodeFilter.SHOW_TEXT), nodes = [];
        for (let n = walk.nextNode(); n; n = walk.nextNode())
            if (hasHidden(n.nodeValue ?? ''))
                nodes.push(n);
        for (const n of nodes)
            n.replaceWith(...drawVoice(document, n.nodeValue ?? ''));
        // The line's feeling tints the whole message in the multiple-distinctions look (style.css).
        const f = mes.querySelector('.rules-v-add-feeling[data-feeling]')?.getAttribute('data-feeling');
        if (f)
            mes.setAttribute('data-rules-feeling', f);
        else
            mes.removeAttribute('data-rules-feeling');
    }
    markKeys();
    toneLook();
}
// The box: one unit of the chat on screen at a time, as a visual novel shows one line in its text box (ui.ts voiceUnits). Every
// message's paragraphs are set in units by change of voice, each with the one it belongs to (box.ts speakersOf); the box shows
// the unit at `boxAt` under that name, with a word at the plate's right for what the colour does not say (box.ts slotOf). A
// tap on the text, → or the bar's ›, shows the rest of a unit still appearing, then the next unit, and after a message's last
// unit the next message's first; ‹ and ← go back. "Auto" moves on by itself; "Log" shows the whole chat, scrolling, and "Box"
// returns. A message being written or edited has no units yet and shows whole.
let boxAt = null, boxLog = false;
const boxOn = () => settings().enabled && settings().box;
const unitsIn = (mes) => settings().boxUnit === 'message' ? [] : [...mes.querySelectorAll('.mes_text .rules-unit')];
const playerName = () => String(ctx().name1 || 'You');
/** The cast by name: the player's character, the character of a one-to-one chat and a group's members. */
const castNames = () => { const c = ctx(); return [c.name1, c.name2, ...groupMembers().map(m => m.name)].filter((n) => !!n); };
/** Each drawn message's text in units: a quoted stretch, the text between two of them, or a block that is no paragraph (a
 * list, a table, a block quotation) as one; each unit carries the one it belongs to (data-who). Done once per drawing of a
 * message: SillyTavern redraws its text whole. */
function unitChat() {
    const all = [...document.querySelectorAll('#chat .mes')];
    all.forEach((mes, at) => {
        const text = mes.querySelector('.mes_text');
        if (!text || text.querySelector('.rules-unit, .edit_textarea'))
            return;
        const msg = ctx().chat?.[Number(mes.getAttribute('mesid'))];
        // The names the reply wrote before its quotations (readReply), matched to the quotations by their words, in order.
        const tags = [...(msg?.extra?.rulesSpeakers?.[msg?.swipe_id ?? 0] ?? [])];
        const bare = (t) => t.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        const paragraphs = [];
        for (const block of [...text.children]) {
            if (block.tagName !== 'P') {
                block.classList.add('rules-unit');
                block.setAttribute('data-said', 'false');
                paragraphs.push([{ span: block, s: { said: false, text: block.textContent ?? '' } }]);
                continue;
            }
            const nodes = [...block.childNodes], para = [];
            for (const u of voiceUnits(nodes.map(n => ({ said: n.nodeName === 'Q', text: n.textContent ?? '' })))) {
                const span = document.createElement('span');
                span.className = 'rules-unit';
                span.setAttribute('data-said', String(u.said));
                nodes[u.from].before(span);
                for (let i = u.from; i < u.to; i++)
                    span.appendChild(nodes[i]);
                const words = span.textContent ?? '', t = u.said ? tags.findIndex(x => bare(x.q) === bare(words)) : -1;
                para.push({ span, s: { said: u.said, text: words, tag: t >= 0 ? tags.splice(t, 1)[0].who : null } });
            }
            paragraphs.push(para);
        }
        // The people the message before named, for a pronoun at this one's start.
        const named = all[at - 1] ? [...all[at - 1].querySelectorAll('.rules-unit[data-who]')].map(e => e.getAttribute('data-who') ?? '').filter(n => n && n !== playerName()) : [];
        const author = msg?.is_user ? playerName() : mes.getAttribute('ch_name') || mes.querySelector('.name_text')?.textContent || '';
        const who = speakersOf(paragraphs.map(p => p.map(x => x.s)), { player: playerName(), author, names: castNames() }, named);
        paragraphs.forEach((p, i) => p.forEach((x, j) => x.span.setAttribute('data-who', who[i][j])));
    });
}
/** A unit longer than the box goes on in the next box, cut after a sentence's end (box.ts cutsOf): measured in the message's
 * own type and width once it is drawn, at boxLines lines. Done once per unit (data-fit); a piece keeps its unit's voice and speaker. */
/** The box's lines at its type size (applyLook). */
let boxLinesNow = peek('boxLines');
function fitUnits(mes) {
    const text = mes.querySelector('.mes_text');
    const units = [...mes.querySelectorAll('.mes_text span.rules-unit:not([data-fit])')];
    if (!text || !units.length || !text.clientWidth)
        return;
    const probe = document.createElement('div');
    probe.style.cssText = `position: absolute; visibility: hidden; width: ${text.clientWidth}px; white-space: normal;`;
    text.appendChild(probe);
    const lh = parseFloat(getComputedStyle(probe).lineHeight) || 1;
    for (const unit of units) {
        unit.setAttribute('data-fit', '');
        const words = unit.textContent ?? '';
        probe.textContent = words;
        const lines = Math.round(probe.getBoundingClientRect().height / lh);
        if (lines <= boxLinesNow)
            continue;
        // The characters that fill the box, in proportion to the lines this unit takes.
        const cuts = cutsOf(words, Math.floor(words.length * boxLinesNow / lines));
        for (const cut of cuts.reverse()) {
            const walk = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
            let seen = 0, at = null;
            for (let n = walk.nextNode(); n; n = walk.nextNode()) {
                if (seen + n.length >= cut) {
                    at = n;
                    break;
                }
                seen += n.length;
            }
            if (!at)
                continue;
            const r = document.createRange();
            r.setStart(at, cut - seen);
            r.setEnd(unit, unit.childNodes.length);
            const piece = unit.cloneNode(false);
            piece.classList.remove('rules-unit-now');
            piece.appendChild(r.extractContents());
            unit.after(piece);
        }
    }
    probe.remove();
}
// The letters of a unit appear one by one (box.ts revealTimes): the text not yet shown is a highlight range drawn without ink
// (CSS Custom Highlight API; style.css ::highlight(rules-unshown)), so the box keeps its lines and nothing moves as letters
// appear. Without the API, with reduced motion asked for, or with the setting off, the unit shows whole.
let typing = null, autoTimer, shownKey = '', stepDir = 0, figureSrc = null;
const UNSHOWN = 'rules-unshown';
const highlights = () => globalThis.CSS?.highlights;
// The voice blips (blips.ts): one tone per syllable of a said stretch as it appears, in the speaker's own voice, while the
// music is on (the bar's ♪), under it (blipLevel × its volume). A periodic wave per voice holds its harmonics.
let blipCtx = null, blipNodes = [];
const blipWaves = new Map();
function stopBlips() { for (const o of blipNodes) {
    try {
        o.stop();
    }
    catch { /* already stopped */ }
} blipNodes = []; }
function playBlips(unit, text, times) {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'blips' || unit.getAttribute('data-said') !== 'true' || !p || unit.querySelector('.rules-v-whisper, .rules-run-whisper'))
        return;
    const h = voiceHarmonics(speakingFactsOf(p));
    const AC = globalThis.AudioContext;
    if (!h || !AC)
        return;
    blipCtx ??= new AC();
    const ac = blipCtx, key = `${h.f0}:${h.amps.join(',')}`;
    let wave = blipWaves.get(key);
    if (!wave) {
        wave = ac.createPeriodicWave(new Float32Array(h.amps.length + 1), Float32Array.from([0, ...h.amps]));
        blipWaves.set(key, wave);
    }
    const level = settings().musicVolume * peek('blipLevel'), t0 = ac.currentTime + 0.02;
    for (const b of blipPlan(text, times)) {
        const o = ac.createOscillator(), g = ac.createGain(), at = t0 + b.at / 1000, end = at + Math.max(2 * BLIP_RAMP_S, b.dur / 1000);
        o.setPeriodicWave(wave);
        o.frequency.value = h.f0;
        g.gain.setValueAtTime(0, at);
        g.gain.linearRampToValueAtTime(level, at + BLIP_RAMP_S);
        g.gain.setValueAtTime(level, end - BLIP_RAMP_S);
        g.gain.linearRampToValueAtTime(0, end);
        o.connect(g).connect(ac.destination);
        o.start(at);
        o.stop(end + 0.01);
        blipNodes.push(o);
    }
}
let speechLoad = null, speechMod = null, speechWorker = null, speechSource = null;
function loadSpeech() {
    const at = (p) => new URL(`../lib/espeak-ng/${p}`, import.meta.url).href;
    speechLoad ??= import(at('espeak-ng.js')).then(x => x.default({ locateFile: at }))
        .then(m => { speechMod = m; speechWorker = new m.eSpeakNGWorker(); return m; })
        .catch(err => { console.warn('[Rules engine] the voice could not load:', err); speechLoad = null; throw err; });
    return speechLoad;
}
function stopSpeech() { try {
    speechSource?.stop();
}
catch { /* already stopped */ } speechSource = null; }
/** Speaks a said stretch in its speaker's voice and gives when each letter appears, or null (no voice, not loaded, off). */
function speakUnit(unit, text) {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'robotic' || unit.getAttribute('data-said') !== 'true' || !p)
        return null;
    if (!speechMod || !speechWorker) {
        void loadSpeech().catch(() => undefined);
        return null;
    }
    const v = voiceOf(speakingFactsOf(p));
    if (!v.f0Hz || !v.tractCm)
        return null;
    const AC = globalThis.AudioContext;
    if (!AC)
        return null;
    const sv = speechVoice(v.f0Hz, v.tractCm, v.sylPerS, !!unit.querySelector('.rules-v-whisper, .rules-run-whisper')), name = `rules-${sv.base}-${sv.formantPct}-${sv.whisper ? 'w' : 'v'}`;
    speechMod.FS.writeFile(`/usr/share/espeak-ng-data/voices/!v/${name}`, speechVoiceFile(name, sv));
    speechWorker.set_voice(`en-us+${name}`);
    speechWorker.set_rate(sv.wpm);
    const chunks = [], words = [];
    speechWorker.synthesize(text, (samples, events) => { if (samples?.length)
        chunks.push(Int16Array.from(samples)); for (const e of events ?? [])
        if (e.type === 'word')
            words.push([e.text_position, e.audio_position]); });
    const fs = speechWorker.get_samplerate(), n = chunks.reduce((sum, c) => sum + c.length, 0);
    if (!n)
        return null;
    blipCtx ??= new AC();
    const buf = blipCtx.createBuffer(1, n, fs), data = buf.getChannelData(0);
    let o = 0;
    for (const c of chunks)
        for (let i = 0; i < c.length; i++)
            data[o++] = c[i] / 32768;
    const src = blipCtx.createBufferSource(), g = blipCtx.createGain();
    src.buffer = buf;
    g.gain.value = settings().musicVolume;
    src.connect(g).connect(blipCtx.destination);
    src.start();
    speechSource = src;
    return speechTimes(text, words, 1000 * n / fs);
}
// The natural voice (rules/pocket.ts, rules/averaged-person.ts): Pocket TTS's networks, downloaded once from Hugging Face (165
// MB) and kept in the browser's IndexedDB, run by onnxruntime-web (jsDelivr) in a worker (voice-worker.ts); each speaker's
// voice is the averaged person (voices/averaged-person.bin, sent to the player apart from the repository: CC BY-NC) spoken with
// the body's pitch, tract and pace, made and encoded once per body and its encoding kept. Each said stretch is made once, ahead,
// as its message is shown; the box waits for a stretch still being made.
const ORT_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';
let voiceWorker = null, voiceLoad = null, voiceJobId = 0, voiceWait = null;
const voiceJobs = new Map(), voiceCache = new Map(), voiceDone = new Map(), voicesMade = new Map();
/** The model kept in the browser's IndexedDB (the Cache API exists only on https and localhost pages; SillyTavern is often
 * opened over plain http on a home network): read it (no `put`), or store it. Null when it is not kept or storage fails. */
function storedModel(url, put) {
    return new Promise(done => {
        try {
            const open = indexedDB.open('rules-engine-voices', 1);
            open.onupgradeneeded = () => open.result.createObjectStore('models');
            open.onerror = () => done(null);
            open.onsuccess = () => {
                const db = open.result, tx = db.transaction('models', put ? 'readwrite' : 'readonly'), store = tx.objectStore('models');
                const req = put ? store.put(put, url) : store.get(url);
                req.onsuccess = () => { db.close(); done(put ? put : req.result ?? null); };
                req.onerror = () => { db.close(); done(null); };
            };
        }
        catch {
            done(null);
        }
    });
}
const toast = (m) => globalThis.toastr?.info(m);
const askWorker = (m, transfer = []) => new Promise(ok => {
    const id = ++voiceJobId;
    voiceJobs.set(id, ok);
    voiceWorker.postMessage({ ...m, id }, transfer);
});
function loadNatural() {
    voiceLoad ??= (async () => {
        const files = {};
        for (const f of POCKET_MODEL.files) {
            const url = POCKET_MODEL.base + f;
            let buf = await storedModel(url);
            if (!buf) {
                if (f === POCKET_MODEL.files[0])
                    toast(`Downloading the voices once (${POCKET_MODEL.megabytes} MB)…`);
                const res = await fetch(url);
                if (!res.ok)
                    throw new Error(`the voices' download answered ${res.status}`);
                buf = await res.arrayBuffer();
                await storedModel(url, buf);
            }
            files[f] = buf;
        }
        const bundle = JSON.parse(new TextDecoder().decode(files['bundle.json']));
        freeCacheLength(new Uint8Array(files['flow_lm_main_int8.onnx']), bundle.flow_lm_state_manifest.filter(e => e.shape.includes(1000)).flatMap(e => [e.input_name, e.output_name]));
        voiceWorker = new Worker(new URL('./voice-worker.js', import.meta.url), { type: 'module' });
        await new Promise((ok, bad) => {
            voiceWorker.onmessage = e => {
                const m = e.data;
                if (m.type === 'loaded')
                    ok();
                else if (m.type === 'error')
                    bad(new Error(m.error));
                else {
                    voiceJobs.get(m.id)?.(m);
                    voiceJobs.delete(m.id);
                }
            };
            voiceWorker.postMessage({ type: 'load', ortUrl: ORT_URL, files }, Object.values(files));
        });
        // The averaged person, from the extension's folder (not in the repository: the player keeps the file they were sent).
        const res = await fetch(new URL('../voices/averaged-person.bin', import.meta.url));
        if (!res.ok) {
            toast('The natural voice needs voices/averaged-person.bin in the extension folder.');
            throw new Error(`averaged-person.bin: ${res.status}`);
        }
        const buffer = await res.arrayBuffer(), r = await askWorker({ type: 'person', buffer }, [buffer]);
        if (r.error)
            throw new Error(r.error);
        // The five vocal families' files (voices/emotion-<family>.bin), where the player has them: a feeling is heard only then.
        for (const family of FAMILIES) {
            const er = await fetch(new URL(`../voices/emotion-${family}.bin`, import.meta.url)).catch(() => null);
            if (!er?.ok)
                continue;
            const eb = await er.arrayBuffer(), ok = await askWorker({ type: 'person', buffer: eb, family }, [eb]);
            if (!ok.error)
                emotionFiles.add(family);
        }
    })().catch(err => { console.warn('[Rules engine] the natural voice could not load:', err); voiceLoad = null; throw err; });
    return voiceLoad;
}
const FAMILIES = ['anger', 'fear', 'happiness', 'sadness', 'tenderness'], emotionFiles = new Set();
/** The feeling a said stretch is spoken with: a feeling the narrator's voice mark names in it (prosody.ts, data-feeling), at
 * full strength; else the speaker's newest feeling still running (Appraise), its OCC type heard as its vocal family
 * (emotion.ts VOCAL_FAMILY) at its strength (0.5 when an older save kept none); none where the family's file is missing. */
function feelingOf(unit, p) {
    const marked = unit.querySelector('[data-feeling]')?.getAttribute('data-feeling');
    if (marked && emotionFiles.has(marked))
        return { family: marked, w: 1 };
    const f = [...(p.feelings ?? [])].filter(x => x.left > 0).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
    const family = f ? VOCAL_FAMILY[f.type] : undefined;
    return family && emotionFiles.has(family) ? { family, w: f.strength ?? peek('voiceFeelingTouched') } : null;
}
/** A body's voice in the worker: the averaged person spoken with the body's causes (and a feeling, where one is heard), encoded;
 * the encoding kept in IndexedDB. */
function makeBodyVoice(voice, body, emotion = null) {
    let made = voicesMade.get(voice);
    if (!made) {
        made = (async () => {
            const key = `encoding:averaged-person:3:${voice}`, kept = await storedModel(key);
            if (kept) {
                const r = await askWorker({ type: 'voice', voice, embedding: new Float32Array(kept) });
                if (!r.error)
                    return;
            }
            const r = await askWorker({ type: 'voice', voice, body, ...emotion ? { emotion } : {} });
            if (r.error || !r.embedding)
                throw new Error(r.error ?? 'no encoding');
            await storedModel(key, r.embedding.buffer.slice(0));
        })();
        made.catch(() => voicesMade.delete(voice));
        voicesMade.set(voice, made);
    }
    return made;
}
/** A said stretch's natural voice: its key and the audio being made (null: none, as for narration, a whisper, an untracked
 * speaker, or the setting). */
function naturalJob(unit) {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'natural' || unit.getAttribute('data-said') !== 'true' || !p || unit.querySelector('.rules-v-whisper, .rules-run-whisper'))
        return null;
    // The line is English (the model's language): its pace is English's for someone whose language the story has not set.
    const facts = speakingFactsOf(p), v = voiceOf({ ...facts, language: facts.language ?? 'english' }), text = spokenText(unit.textContent ?? '');
    if (!v.f0Hz || !v.tractCm || !/\p{L}/u.test(text))
        return null;
    // The person's habits: their own draws (BodySize), or the same draws from the chat's salt and the name where never made.
    const draw = (k) => gauss(seededRng(`${saltOf()}:${k}:${who}`));
    const habits = habitsOf(p.sex, p.spanZ ?? draw('span'), p.pauseZ ?? draw('pause'), p.breathZ ?? draw('breath'));
    const body = { ...bodyTarget(v.f0Hz, v.tractCm, v.sylPerS), ...habits }, base = `${body.f0}|${body.tractCm}|${body.sylPerS}|${habits.span}|${habits.pause}|${habits.breathDb}`;
    // The feeling is read once the voices have loaded (the families' files known); the line waits for it.
    const key = `${base}|${text}|${p.feelings?.map(f => `${f.type}:${f.strength ?? ''}`).join(',') ?? ''}|${unit.querySelector('[data-feeling]')?.getAttribute('data-feeling') ?? ''}`;
    let job = voiceCache.get(key), voice = base;
    if (!job) {
        job = loadNatural().then(() => { const emo = feelingOf(unit, p); voice = emo ? `${base}|${emo.family}:${emo.w}` : base; return makeBodyVoice(voice, body, emo); })
            .then(() => askWorker({ type: 'speak', voice, chunks: pocketJob(text), temperature: POCKET_MODEL.temperature }))
            .then(r => r.audio ?? null).catch(() => null).then(a => { voiceDone.set(key, a); return a; });
        voiceCache.set(key, job);
    }
    return { key, job };
}
/** The said stretches of a message, made ahead in order. */
function prepareVoices(mes) { if (settings().boxVoice === 'natural')
    for (const u of unitsIn(mes))
        naturalJob(u); }
function playNatural(audio) {
    const AC = globalThis.AudioContext;
    if (!AC)
        return;
    blipCtx ??= new AC();
    const buf = blipCtx.createBuffer(1, audio.length, POCKET_MODEL.sampleRate);
    buf.getChannelData(0).set(audio);
    const src = blipCtx.createBufferSource(), g = blipCtx.createGain();
    src.buffer = buf;
    g.gain.value = settings().musicVolume;
    src.connect(g).connect(blipCtx.destination);
    src.start();
    speechSource = src;
}
function stopTyping() {
    stopBlips();
    stopSpeech();
    voiceWait = null;
    if (typing)
        cancelAnimationFrame(typing.raf);
    typing = null;
    document.body?.classList?.remove('rules-typing');
    highlights()?.delete(UNSHOWN);
}
/** AUTO: the next unit once this one has been read (box.ts autoWait), while the box shows it and Auto stays on. */
function scheduleAuto(unit, appearMs) {
    clearTimeout(autoTimer);
    if (!settings().boxAuto || boxLog || !boxOn())
        return;
    autoTimer = setTimeout(() => { if (settings().boxAuto && !boxLog && unit.classList.contains('rules-unit-now') && !typing)
        stepBox(1); }, autoWait(unit.textContent ?? '', appearMs));
}
/** The voice of the one a unit belongs to, when the engine tracks them (voice-body.ts): their own rate, formants and pitch. */
const voiceOfWho = (who) => { const p = who ? trackedPeople()[who] : undefined; return p ? voiceOf(voiceFactsOf(p)) : null; };
function typeUnit(unit) {
    stopTyping();
    clearTimeout(autoTimer);
    // Said words appear at the speaker's own rate (voice-body.ts) where the engine tracks them, as a share of the unmarked rate.
    const said = unit.getAttribute('data-said') === 'true', own = said ? voiceOfWho(unit.getAttribute('data-who')) : null;
    const hl = highlights(), Hl = globalThis.Highlight;
    // Never block the box on slow mobile voice synthesis: type immediately at the speaker's pace and play natural audio if it finishes while this line is still shown.
    const nat = said ? naturalJob(unit) : null;
    const natural = nat && voiceDone.has(nat.key) ? voiceDone.get(nat.key) ?? null : null;
    if (nat && !voiceDone.has(nat.key)) {
        voiceWait = unit;
        void nat.job.then(audio => {
            if (audio && voiceWait === unit && unit.isConnected && unit.classList.contains('rules-unit-now')) {
                voiceWait = null;
                playNatural(audio);
            }
        });
    }
    const text = unit.textContent ?? '', spoken = natural ? null : speakUnit(unit, text), read = revealTimes(text, said, own ? own.sylPerS / peek('voiceSyllablesPerS') : 1);
    const times = natural ? scaleTimes(read, 1000 * natural.length / POCKET_MODEL.sampleRate) : spoken ?? read, total = times.at(-1) ?? 0;
    if (natural)
        playNatural(natural);
    if (!settings().boxTyping || reducedMotion() || !hl || !Hl || !text.trim()) {
        hl?.delete(UNSHOWN);
        scheduleAuto(unit, spoken || natural ? total : 0);
        return;
    }
    const nodes = [];
    const walk = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode())
        nodes.push(n);
    const range = document.createRange(), last = nodes.at(-1);
    hl.set(UNSHOWN, new Hl(range));
    const t0 = performance.now();
    let shown = 0;
    const frame = () => {
        if (!typing || typing.unit !== unit)
            return;
        if (!unit.isConnected) {
            stopTyping();
            return;
        }
        const t = performance.now() - t0;
        while (shown < text.length && times[shown] <= t)
            shown++;
        if (shown >= text.length) {
            stopTyping();
            scheduleAuto(unit, total);
            return;
        }
        let seen = 0;
        for (const n of nodes) {
            if (seen + n.length > shown) {
                range.setStart(n, shown - seen);
                break;
            }
            seen += n.length;
        }
        range.setEnd(last, last.length);
        typing.raf = requestAnimationFrame(frame);
    };
    typing = { unit, raf: 0, total };
    document.body.classList.add('rules-typing');
    if (!spoken && !natural)
        playBlips(unit, text, times);
    frame();
}
/** The rest of a unit still appearing, at once (a tap or → while it appears). */
function finishTyping() {
    // A tap while a line's voice is still being made shows the line at once, unvoiced.
    if (voiceWait) {
        const unit = voiceWait;
        stopTyping();
        scheduleAuto(unit, 0);
        return true;
    }
    if (!typing)
        return false;
    const { unit, total } = typing;
    stopTyping();
    scheduleAuto(unit, total);
    return true;
}
/** The picture above the box (setting "Picture: large"): the one the player's character faces, as the reference shows the one
 * spoken with over the scene: the speaker of the unit shown when it is someone else, else the last one shown. A card's
 * picture is its avatar at full size; someone without a card has none, and no picture is drawn rather than another's. */
function avatarOf(who, mes) {
    const card = ctx().characters?.find(c => c.name === who);
    if (card?.avatar)
        return `characters/${encodeURIComponent(card.avatar)}`;
    // One the engine made, with a portrait drawn for them (/rules-faces).
    const drawn = portraitFolder(who);
    if (drawn && settings().looks?.portraits?.includes(drawn))
        return `characters/${drawn}/portrait.png`;
    // Someone the engine made, shown with no picture yet: theirs is drawn in the background (section 116).
    if (drawn && trackedPeople()[who])
        wantFaces(who);
    if (who !== mes.getAttribute('ch_name'))
        return null;
    const src = mes.querySelector('.avatar img')?.getAttribute('src') ?? '', m = /[?&]type=(avatar|persona)&file=([^&]+)/.exec(src);
    return m ? `${m[1] === 'avatar' ? 'characters' : 'User Avatars'}/${m[2]}` : src || null;
}
const stageRoster = new Map();
const missingExpr = new Set();
const EXPR_FILE = { happiness: 'joy', anger: 'anger', sadness: 'sadness', fear: 'fear', tenderness: 'love' };
let lastHopKey = '', lastShockKey = '';
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, m => `\\${m}`);
/** Resolves SillyTavern native expression sprite (/characters/<Name>/<emotion>.png) with instant fallback to base avatar + OKLCH glow. */
function spriteFor(who, baseSrc, felt) {
    // The face for the person's look now (section 112), where it has been made; else the feeling's sprite, else the card.
    const look = lookSpriteOf(who);
    if (look && !missingExpr.has(look))
        return look;
    const expr = felt ? EXPR_FILE[felt] : null;
    if (!expr)
        return baseSrc;
    const candidate = `characters/${encodeURIComponent(who)}/${expr}.png`;
    return missingExpr.has(candidate) ? baseSrc : candidate;
}
function applySprite(img, who, baseSrc, felt) {
    const target = spriteFor(who, baseSrc, felt);
    if (img.getAttribute('src') !== target) {
        // A picture that is not there is not asked for again; the next one along is (the look's face, the feeling's sprite, the card).
        // A missing face is drawn only while the large picture is on (section 117): hidden, it would be drawn for no one to see.
        img.onerror = target !== baseSrc ? () => { missingExpr.add(target); img.onerror = null; if (target.includes('/look_') && settings().boxPicture === 'large')
            wantFaces(who); applySprite(img, who, baseSrc, felt); } : null;
        img.setAttribute('src', target);
    }
}
/** Physiological blood-loss / hypoxia desaturation & vignette on #chat, plus Web Audio low-pass shock on heavy impacts. */
function updatePhysiology(mes, unit) {
    const chat = document.getElementById('chat');
    if (!chat)
        return;
    const me = trackedPeople()[playerName()];
    const bloodLost = Number(me?.bloodLostL ?? me?.blood_lost ?? 0);
    const fear = me?.feelings?.filter(f => f.left > 0 && (f.type === 'fear' || f.type === 'terror' || f.type === 'panic')).reduce((m, f) => Math.max(m, f.strength ?? 0.5), 0) ?? 0;
    const strain = Math.min(1, Math.max(0, (bloodLost - 0.5) / 1.8, (fear - 0.65) * 1.4));
    if (strain > 0.04) {
        chat.style.setProperty('--rules-vital-gray', (strain * 0.65).toFixed(2));
        chat.style.setProperty('--rules-vital-vignette', `inset 0 0 ${Math.round(28 + strain * 64)}px rgba(0, 0, 0, ${(0.18 + strain * 0.48).toFixed(2)})`);
    }
    else {
        chat.style.removeProperty('--rules-vital-gray');
        chat.style.removeProperty('--rules-vital-vignette');
    }
    const text = unit?.textContent ?? '';
    const shockKey = `${mes.getAttribute('mesid') ?? ''}:${text.slice(0, 24)}`;
    if (shockKey !== lastShockKey && unit?.querySelector('mark.rules-key') && /\b(smashed|broken|fractured|bleeding|chok|gasp|blow|strike|hit)\b/i.test(text)) {
        lastShockKey = shockKey;
        triggerAudioShock(Math.max(0.6, strain));
    }
}
/** Returns recorded SII (< 0.75) if Listen reported muffled speech from speaker on this turn, else 1. */
function speakerSii(mes, speaker) {
    if (!speaker || speaker === playerName())
        return 1;
    const id = Number(mes.getAttribute('mesid'));
    const chat = ctx().chat ?? [];
    for (const idx of [id, id - 1]) {
        const pass = chat[idx]?.extra?.rulesPass;
        if (!pass?.calls || !pass.results)
            continue;
        for (let i = 0; i < pass.calls.length; i++) {
            const c = pass.calls[i], r = pass.results[i]?.result ?? '';
            if (c.tool === 'Listen' && String(c.args?.source_who ?? '').toLowerCase() === speaker.toLowerCase()) {
                const m = /\bSII\s+([0-9.]+)/i.exec(r);
                if (m)
                    return Number(m[1]);
                if (/words are lost in the noise/i.test(r))
                    return 0.1;
            }
        }
    }
    return 1;
}
function applyMuffle(mes, unit) {
    if (!unit || unit.getAttribute('data-said') !== 'true')
        return;
    const who = unit.getAttribute('data-who') ?? '';
    const sii = speakerSii(mes, who);
    if (sii >= 0.75 || unit.hasAttribute('data-muffled'))
        return;
    unit.setAttribute('data-muffled', String(sii));
    unit.classList.add('rules-muffled');
    const walker = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode())
        nodes.push(n);
    for (const n of nodes)
        if (n.nodeValue)
            n.nodeValue = muffleSpeech(n.nodeValue, sii);
}
function showFigure(mes, unit) {
    applyMuffle(mes, unit);
    const chat = document.getElementById('chat');
    if (!chat)
        return;
    updatePhysiology(mes, unit);
    let stage = document.getElementById('rules-box-stage');
    if (!stage) {
        stage = document.createElement('div');
        stage.id = 'rules-box-stage';
        stage.setAttribute('aria-hidden', 'true');
    }
    if (chat.firstElementChild !== stage)
        chat.prepend(stage);
    let fig = document.getElementById('rules-box-figure');
    if (!fig) {
        fig = document.createElement('img');
        fig.id = 'rules-box-figure';
        fig.className = 'rules-stage-fig';
        fig.alt = '';
        fig.setAttribute('aria-hidden', 'true');
    }
    if (!fig.parentElement)
        stage.appendChild(fig);
    const who = unit?.getAttribute('data-who') ?? mes.getAttribute('ch_name') ?? '';
    const said = unit?.getAttribute('data-said') === 'true';
    const unitText = unit?.textContent ?? '';
    const isRelevant = !!(unit?.querySelector('mark.rules-key') || (who && trackedPeople()[who]?.feelings?.some(f => (f.strength ?? 0) >= 0.65)));
    // Spatial coordinates from mapNow() for slot ordering (west -> left, east -> right) and directional lhide/rhide exits.
    const mv = mapNow();
    const posOf = new Map();
    for (const p of mv?.people ?? [])
        posOf.set(p.name, { x: p.x, y: p.y, player: p.player });
    const mePos = [...posOf.values()].find(p => p.player) ?? { x: 0, y: 0 };
    if (who && who !== playerName()) {
        const src = avatarOf(who, mes);
        if (src) {
            figureSrc = src;
            figureWho = who;
            stageRoster.set(who, { src, hiddenBySpotlight: false });
        }
    }
    const nowMs = Date.now();
    for (const [name, entry] of [...stageRoster.entries()]) {
        if (entry.exitUntil && nowMs >= entry.exitUntil) {
            stageRoster.delete(name);
            continue;
        }
        // Detect if character moved away (> 12 m) or explicit exit text for directional lhide/rhide
        const pPos = posOf.get(name);
        if (!entry.exiting && pPos && Math.hypot(pPos.x - mePos.x, pPos.y - mePos.y) > 12) {
            entry.exiting = pPos.x < mePos.x ? 'left' : 'right';
            entry.exitUntil = nowMs + 320;
        }
        if (entry.hiddenBySpotlight && name !== who && new RegExp(`\\b${escRe(name)}\\b`, 'i').test(unitText)) {
            entry.hiddenBySpotlight = false;
        }
        if (said && isRelevant && who && who !== playerName() && name !== who) {
            entry.hiddenBySpotlight = true;
        }
    }
    const largeOn = settings().boxPicture === 'large' && !!figureSrc;
    const hasStage = largeOn && stageRoster.size > 0;
    stage.hidden = !hasStage;
    stage.toggleAttribute('hidden', !hasStage);
    fig.hidden = !largeOn;
    // Sort visible cast by spatial x coordinate (t11/t21/t31 slot order)
    const castNames = [...stageRoster.keys()].slice(-3).sort((a, b) => (posOf.get(a)?.x ?? 0) - (posOf.get(b)?.x ?? 0));
    const slotOfName = new Map();
    castNames.forEach((n, i) => slotOfName.set(n, i));
    const activeSpeaking = said && !!who && who === figureWho;
    const felt = figureWho ? pictureFeeling(trackedPeople()[figureWho]) : null;
    if (figureSrc && figureWho)
        applySprite(fig, figureWho, figureSrc, felt);
    if (felt)
        fig.setAttribute('data-feeling', felt);
    else
        fig.removeAttribute('data-feeling');
    fig.toggleAttribute('data-speaking', activeSpeaking);
    fig.toggleAttribute('data-dimmed', said && !!who && who !== figureWho);
    const primaryEntry = figureWho ? stageRoster.get(figureWho) : undefined;
    fig.toggleAttribute('data-spotlight-hide', !!primaryEntry?.hiddenBySpotlight);
    if (primaryEntry?.exiting)
        fig.setAttribute('data-exit', primaryEntry.exiting);
    else
        fig.removeAttribute('data-exit');
    if (figureWho && slotOfName.has(figureWho))
        fig.style.order = String(slotOfName.get(figureWho));
    const hopKey = `${mes.getAttribute('mesid') ?? ''}:${unit?.textContent?.slice(0, 24) ?? ''}:${figureWho ?? ''}`;
    if (felt === 'happiness' && activeSpeaking && hopKey !== lastHopKey) {
        lastHopKey = hopKey;
        fig.removeAttribute('data-hop');
        void fig.getClientRects();
        fig.setAttribute('data-hop', 'true');
    }
    const extras = [...stageRoster.entries()].filter(([name]) => name !== figureWho).slice(-2);
    const keep = new Set([fig]);
    for (const [name, entry] of extras) {
        let img = stage.querySelector(`img[data-stage-who="${CSS.escape(name)}"]`);
        if (!img) {
            img = document.createElement('img');
            img.className = 'rules-stage-fig';
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            img.setAttribute('data-stage-who', name);
            stage.appendChild(img);
        }
        const cFelt = pictureFeeling(trackedPeople()[name]);
        applySprite(img, name, entry.src, cFelt);
        if (cFelt)
            img.setAttribute('data-feeling', cFelt);
        else
            img.removeAttribute('data-feeling');
        const cSpeaking = said && who === name;
        img.toggleAttribute('data-speaking', cSpeaking);
        img.toggleAttribute('data-dimmed', said && who !== name);
        img.toggleAttribute('data-spotlight-hide', entry.hiddenBySpotlight);
        if (entry.exiting)
            img.setAttribute('data-exit', entry.exiting);
        else
            img.removeAttribute('data-exit');
        if (slotOfName.has(name))
            img.style.order = String(slotOfName.get(name));
        if (cFelt === 'happiness' && cSpeaking && hopKey !== lastHopKey) {
            lastHopKey = hopKey;
            img.removeAttribute('data-hop');
            void img.getClientRects();
            img.setAttribute('data-hop', 'true');
        }
        keep.add(img);
    }
    for (const child of [...stage.children])
        if (!keep.has(child))
            child.remove();
}
/** The plate of the message shown: the name of the one the unit belongs to, and at its right the slot's words. */
function showPlate(mes, unit) {
    const name = mes.querySelector('.name_text');
    if (!name)
        return;
    let who = mes.querySelector('.rules-who');
    if (!who) {
        who = document.createElement('span');
        who.className = 'rules-who';
        name.after(who);
    }
    const unitWho = unit?.getAttribute('data-who')?.trim() ?? '';
    const isUser = mes.getAttribute('is_user') === 'true';
    const plateSaid = unit?.getAttribute('data-said') === 'true';
    const thinking = platesOf(ctx().chat ?? []).find(p => String(p.index) === mes.getAttribute('mesid'))?.modes.find(m => m.mode === 'thinking');
    // A description, where no one speaks or thinks, has no name on the tag, so a name always means someone's words (the
    // player's pick, 2026-11-16, of three drawn: always the player's character, who the description is about, none).
    const describes = !!unit && !plateSaid && !thinking;
    const plateLabel = describes ? '' : unitWho || (isUser || plateSaid ? (name.textContent?.trim() ?? '') : '');
    who.textContent = plateLabel;
    who.hidden = !plateLabel;
    const voice = voiceOfWho(who.textContent);
    who.title = voice ? `${who.textContent}'s voice: ${voiceLine(voice)}` : '';
    let slot = mes.querySelector('.rules-slot');
    if (!slot) {
        slot = document.createElement('span');
        slot.className = 'rules-slot';
        name.closest('.flex1')?.appendChild(slot) ?? who.after(slot);
    }
    const said = plateSaid;
    const titles = { speaking: 'Said aloud: words in quotation marks', whispering: 'Whispered: said without voicing', thinking: thinking?.title ?? 'Thinking', auto: 'The box moves on by itself' };
    const words = unit ? slotOf({ said, whispered: !!unit.querySelector('.rules-v-whisper, .rules-run-whisper'), thinking: !said && !!thinking, auto: settings().boxAuto }) : settings().boxAuto ? ['auto'] : [];
    slot.replaceChildren(...words.map(w => { const e = document.createElement('span'); e.className = `rules-mode rules-mode-${w}`; e.textContent = w; e.title = titles[w]; return e; }));
    fitTag(who);
}
/** A face's capitals' height as a share of its size (a canvas measures "H" in it), kept per face once the face has loaded. */
const capShares = new Map();
function capShare(family) {
    const known = capShares.get(family);
    if (known)
        return known;
    const c = document.createElement('canvas').getContext('2d');
    if (!c)
        return 0.7;
    c.font = `700 100px ${family}`;
    const share = c.measureText('H').actualBoundingBoxAscent / 100 || 0.7;
    if (document.fonts?.check?.(c.font))
        capShares.set(family, share);
    return share;
}
/** Whether an element's text fits its content box: a range over the text measures its widest line, a word that overflows
 * included, against the box, both in fractions of a pixel. */
function fitsBox(el) {
    const r = document.createRange();
    r.selectNodeContents(el);
    const cs = getComputedStyle(el), box = el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return r.getBoundingClientRect().width <= box + 0.5;
}
/** The night tag (the player, 2026-11-17: "I want a long name to be cut"): one line at full size; a name that fits stays
 * whole, a longer one is cut with "…" (style.css). The room is the plate's row (.ch_name) less the plate's word at its right
 * (SPEAKING, THINKING) and 8 px between, so neither covers the other. Holding the tag still shows the whole name. */
function fitTag(el) {
    el.style.maxWidth = '';
    if (!document.body.classList.contains('rules-box-night') || !el.getClientRects().length)
        return;
    const row = el.closest('.ch_name'), slot = row?.querySelector('.rules-slot');
    if (!row)
        return;
    const w = slot?.getBoundingClientRect().width ?? 0, word = w ? w + 8 : 0;
    el.style.maxWidth = `${Math.max(0, row.clientWidth - word)}px`;
}
// Hold to explain (the player's pick, 2026-11-13): a touch screen has no hover, so a word's title (a marked word's marks with
// their sizes, the mode word's call, the name tag's voice) is out of reach. Holding one for HOLD_MS [ASSUMED: Android's
// long-press default] shows it in the box's menu line, in the buttons' place, until the finger lifts; a tap still goes on.
// The first marked line shown on a touch screen says so, once, for HINT_MS [ASSUMED].
const HOLD_MS = 500, HINT_MS = 4000;
/** What a held element explains, as [name, detail] pairs (box.ts explainParts for a marked word's list of marks). */
function explainOf(el) {
    const t = el.getAttribute('title') ?? '';
    if (el.classList.contains('rules-mode'))
        return [[el.textContent ?? '', t]];
    if (el.classList.contains('rules-who'))
        return [[el.textContent ?? '', t.replace(/^[^:]*:\s*/, '')]];
    return explainParts(t);
}
/** The menu line's explanation (or a hint), or the buttons back (null). */
function showExplain(text) {
    const bar = document.getElementById('rules-box-bar'), out = document.getElementById('rules-box-explain');
    if (!bar || !out)
        return;
    bar.classList.toggle('rules-explaining', !!text);
    if (!text || typeof text === 'string') {
        out.textContent = text ?? '';
        return;
    }
    out.replaceChildren(...text.flatMap(([name, detail], i) => {
        const b = document.createElement('b');
        b.textContent = name;
        return [...i ? [document.createTextNode('; ')] : [], b, document.createTextNode(detail ? ` · ${detail}` : '')];
    }));
}
/** The one-time hint: the first marked line the box shows on a touch screen (settings().holdHinted remembers it). */
function hintHold(unit) {
    if (!unit || settings().holdHinted || !globalThis.matchMedia?.('(hover: none)').matches || !unit.querySelector('.rules-v[title]'))
        return;
    const s = settings();
    s.holdHinted = true;
    ctx().saveSettingsDebounced();
    showExplain('Hold a marked word to read its marks');
    setTimeout(() => { if (!document.querySelector('.rules-held'))
        showExplain(null); }, HINT_MS);
}
/** The box as the settings and `boxAt` have it: the classes on the page, the current message and unit, the plate, the
 * picture, the bar's count; a unit newly shown going forward appears letter by letter. */
function showBox() {
    if (typeof document === 'undefined' || !document.body?.classList)
        return;
    const on = boxOn();
    document.body.classList.toggle('rules-box', on);
    document.body.classList.toggle('rules-box-log', on && boxLog);
    document.body.classList.toggle('rules-box-night', on && settings().boxLook === 'night');
    toneLook();
    const bar = document.getElementById('rules-box-bar');
    if (bar)
        bar.hidden = !on;
    if (!on || boxLog) {
        stopTyping();
        clearTimeout(autoTimer);
        shownKey = '';
    }
    if (!on)
        return;
    unitChat();
    const all = [...document.querySelectorAll('#chat .mes')];
    const mes = all.find(m => m.getAttribute('mesid') === boxAt?.mes) ?? all.at(-1);
    if (!mes)
        return;
    for (const m of all)
        m.classList.toggle('rules-now', m === mes);
    fitUnits(mes);
    prepareVoices(mes);
    const units = unitsIn(mes), unit = Math.min(mes.getAttribute('mesid') === boxAt?.mes ? boxAt.unit : 0, Math.max(0, units.length - 1));
    boxAt = { mes: mes.getAttribute('mesid') ?? '', unit };
    document.querySelectorAll('#chat .rules-unit-now').forEach(e => e.classList.remove('rules-unit-now'));
    document.querySelectorAll('#chat .rules-advance-tri').forEach(e => e.remove());
    const now = units[unit];
    now?.classList.add('rules-unit-now');
    if (now) {
        const tri = document.createElement('span');
        tri.className = 'rules-advance-tri';
        tri.setAttribute('aria-hidden', 'true');
        tri.textContent = '▼';
        now.after(tri);
    }
    showPlate(mes, now);
    hintHold(now);
    showFigure(mes, now);
    // Where, when and the light: the scene a visual novel's background shows, from the engine (box.ts sceneLine).
    const scene = document.getElementById('rules-box-scene');
    if (scene) {
        const t = storyTime(), args = [scenePlace(), t === null ? null : formatStoryTime(t), t === null ? null : sceneSky(t)?.label];
        const line = sceneLine(...args), b = sceneBadge(...args);
        // Three lines for the night look's corner badge (clock, date, where); the page look runs them on one line.
        scene.replaceChildren(...line ? ['clock', 'date', 'where'].filter(k => b[k]).map(k => { const e = document.createElement('span'); e.className = `rules-scene-${k}`; e.textContent = b[k]; return e; }) : []);
        scene.setAttribute('aria-label', line);
    }
    const count = document.getElementById('rules-box-count');
    if (count)
        count.textContent = `${all.indexOf(mes) + 1} / ${all.length}${units.length > 1 ? ` · ${unit + 1} / ${units.length}` : ''}`;
    const log = document.getElementById('rules-box-log');
    if (log) {
        log.textContent = boxLog ? 'Box' : 'Log';
        log.setAttribute('aria-pressed', String(boxLog));
    }
    document.getElementById('rules-box-auto')?.setAttribute('aria-pressed', String(settings().boxAuto));
    document.getElementById('rules-box-music')?.setAttribute('aria-pressed', String(settings().musicOn));
    // A unit newly shown appears letter by letter unless the player stepped back to it; the same unit drawn again keeps going.
    const key = `${boxAt.mes}:${unit}:${units.length}`;
    // The first time the box reaches the first line in the chat of a character with a card of their own, going on, a card names
    // them before it (as visual novels introduce a person); the line types once the card is tapped away. Their first line: the
    // first drawn on the page that is theirs, with none in the messages before the drawn ones (box.ts metBefore). Once shown,
    // the chat keeps their name (rulesMet), so the card plays once a chat, also after the chat is opened again (2026-11-17).
    const who = now?.getAttribute('data-who') ?? '';
    if (!boxLog && now && stepDir !== -1 && key !== shownKey && who && who !== playerName() && !metIn().includes(who) && hasCard(who)
        && document.querySelector(`#chat .rules-unit[data-who="${CSS.escape(who)}"]`) === now && !metBefore(ctx().chat ?? [], Number(mes.getAttribute('mesid')), who)) {
        markMet(who);
        showCard(who, mes);
        stopTyping();
        clearTimeout(autoTimer);
        stepDir = 0;
        return;
    }
    if (!boxLog && now && key !== shownKey) {
        if (stepDir === -1) {
            stopTyping();
            clearTimeout(autoTimer);
        }
        else
            typeUnit(now);
    }
    if (!boxLog)
        shownKey = now ? key : '';
    stepDir = 0;
}
/** Whether the player made a SillyTavern character card for this name: only they get a first-meeting card (the player, 2026-11-12:
 * else every passer-by the story names would get one). */
const hasCard = (who) => !!ctx().characters?.some(c => c.name === who);
/** Characters whose first-meeting card this chat has shown, kept with the chat (its metadata); none where no chat is open. */
const metIn = () => ctx().chatMetadata?.rulesMet ?? [];
function markMet(who) {
    const c = ctx();
    if (!c.chatMetadata)
        return;
    (c.chatMetadata.rulesMet ??= []).push(who);
    void c.saveMetadata();
}
/** The first-meeting card: the person's picture, their trade or age (box.ts cardRole), their name; a tap or the next key takes
 * it away and the line goes on. Since 2026-11-17 (section 90, the player's ask: a screen of its own, as Danganronpa's) it
 * covers the whole page, SillyTavern's top bar included, so it hangs on <body> (SillyTavern pins the body and turns <html>,
 * so a fixed layer would take <html>'s height of 0; an absolute one takes the body's). */
function showCard(who, mes) {
    let card = document.getElementById('rules-box-card');
    if (!card) {
        card = document.createElement('div');
        card.id = 'rules-box-card';
        card.setAttribute('role', 'dialog');
        card.addEventListener('click', e => { e.stopPropagation(); hideCard(); });
        document.body.appendChild(card);
    }
    const src = avatarOf(who, mes), role = cardRole(trackedPeople()[who]);
    const face = document.createElement('img');
    face.className = 'rules-card-face';
    face.alt = '';
    if (src)
        face.src = src;
    else
        face.hidden = true;
    const band = document.createElement('div');
    band.className = 'rules-card-band';
    const r = document.createElement('span');
    r.className = 'rules-card-role';
    r.textContent = role;
    const n = document.createElement('span');
    n.className = 'rules-card-name';
    n.textContent = who;
    band.append(face, r, n);
    card.replaceChildren(band);
    card.setAttribute('aria-label', `${who}${role ? `, ${role}` : ''}`);
    document.body.classList.add('rules-card-on');
    fitCardName(n);
}
/** The card's name: its size steps down from the look's (style.css, 34 px) until no word is wider than its column, to the
 * print-size floor of its capitals (box.ts tagFloorPx); a word wider even there breaks (style.css overflow-wrap). It is
 * measured unturned, as laid out. */
function fitCardName(el) {
    el.style.fontSize = '';
    if (!el.getClientRects().length)
        return;
    const cs = getComputedStyle(el), full = parseFloat(cs.fontSize), floor = Math.min(full, tagFloorPx(capShare(cs.fontFamily)));
    el.style.overflowWrap = 'normal';
    el.style.transform = 'none';
    for (let s = full; !fitsBox(el) && s > floor;) {
        s = Math.max(floor, s - 1);
        el.style.fontSize = `${s}px`;
    }
    el.style.overflowWrap = '';
    el.style.transform = '';
}
function hideCard() {
    if (!document.body.classList.contains('rules-card-on'))
        return false;
    document.body.classList.remove('rules-card-on');
    showBox();
    return true;
}
// Shoot a word (the player's pick, 2026-11-13; rules/why.ts): words selected in a message (a long press on a phone, a drag
// with a mouse) show their path in a panel over the chat: the records that produced them, each step one relation, told
// through the player's character, each step's measures (the call's numbers and draws) folded under the path. The panel
// stays while the selection grows; a tap on the chat or a step on closes it.
/** The selection's path, drawn; a selection outside the chat's messages leaves the panel as it is. */
function showWhy() {
    const sel = document.getSelection?.(), span = String(sel ?? '').replace(/\s+/g, ' ').trim();
    if (!sel || !sel.rangeCount || !span || span.length > 300)
        return;
    const range = sel.getRangeAt(0), node = range.commonAncestorContainer, el = (node.nodeType === 1 ? node : node.parentElement);
    const text = el?.closest('#chat .mes .mes_text'), mes = el?.closest('#chat .mes');
    // A message being edited is the player's own text box: its selection is for editing.
    if (!text || !mes || el?.closest('textarea, input, [contenteditable]'))
        return;
    const chat = ctx().chat ?? [], i = Number(mes.getAttribute('mesid')), msg = chat[i];
    if (!msg)
        return;
    const keys = msg.extra?.rulesKeys?.[msg.swipe_id ?? 0];
    let pass = null;
    for (let j = i; j >= 0 && !pass; j--)
        if (chat[j]?.is_user)
            pass = chat[j].extra?.rulesPass ?? null;
    const unit = (range.startContainer.nodeType === 1 ? range.startContainer : range.startContainer.parentElement)?.closest('.rules-unit');
    const block = (unit ?? el?.closest('p') ?? text).textContent ?? '', t = storyTime();
    const steps = pathOf({
        span, sentence: sentenceAt(block, Math.max(0, block.indexOf(span))), player: playerName(),
        said: unit?.getAttribute('data-said') === 'true' ? unit.getAttribute('data-who') || msg.name || null : null,
        keys: keys ?? [], pass, story: storyResult, facts: store().state.facts ?? [],
        clock: t === null ? null : { when: formatStoryTime(t), place: scenePlace(), sky: sceneSky(t)?.label ?? null }, when: formatStoryTime,
    });
    drawWhy(span, steps);
}
/** The sheet: a window of its own over the dimmed screen (the player's review of 2026-11-17: the white card over the box
 * "collides with the rest"), made once: its title as the box's pink tag, a close button, its parts in a body that scrolls,
 * and the story's tabs at its foot when there is more than one. A tap on the dimmed screen closes it. */
function openSheet(head, parts, tab) {
    let wrap = document.getElementById('rules-sheet');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.id = 'rules-sheet';
        wrap.addEventListener('click', e => { if (e.target === wrap)
            hideWhy(); });
        (document.getElementById('sheld') ?? document.body).appendChild(wrap);
    }
    const path = document.getElementById('rules-why');
    if (path)
        path.hidden = true;
    const frame = el('div', 'rules-sheet-frame');
    frame.setAttribute('role', 'dialog');
    frame.setAttribute('aria-label', head);
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'rules-sheet-close';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => hideWhy());
    const body = el('div', 'rules-sheet-body');
    body.append(...parts);
    frame.append(el('div', 'rules-sheet-title', head), close, body);
    const tabs = tab ? sheetTabs() : [];
    if (tabs.length > 1) {
        const bar = el('div', 'rules-sheet-tabs');
        for (const t of tabs) {
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('aria-pressed', String(t === tab));
            const icon = el('i', `fa-solid ${TAB_ICON[t]}`);
            icon.setAttribute('aria-hidden', 'true');
            b.append(icon, el('span', '', TAB_NAME[t]));
            b.addEventListener('click', () => openTab(t));
            bar.append(b);
        }
        frame.append(bar);
    }
    wrap.replaceChildren(frame);
    wrap.hidden = false;
}
const TAB_NAME = { memory: 'Memory', map: 'Map', time: 'Time', world: 'World' };
const TAB_ICON = { memory: 'fa-brain', map: 'fa-map', time: 'fa-clock', world: 'fa-earth-europe' };
/** The tabs the story holds now: the map with a plan that places the player's character, the timeline with a line's time. */
const sheetTabs = () => ['memory', ...mapNow() ? ['map'] : [], ...timelineOf(ctx().chat ?? []).length ? ['time'] : [], ...worldNow() ? ['world'] : []];
/** The narrator's [SOCIETY] block for a seeded story (society.ts): how the country lives with the kind in the story's year. */
function societyNow() {
    const code = ctx().chatMetadata ? store().state.seed : undefined;
    if (!code)
        return '';
    const plan = drawStart(code, getBook());
    if ('error' in plan)
        return '';
    // A story seeded before section 101 gets its town from its own seed, as it would have at the start.
    const st = store().state;
    if (!st.town) {
        st.town = townOf(plan);
        saveState();
    }
    // The count's year (section 118): the kind's share and kills as the World tab counts them, for the stage and the town.
    const year = storyYearNow() ?? plan.year, f = figuresIn(yearByYear(plan.year, year, plan.share, plan.deaths, kindGrowth(plan)), year, plan);
    const seen = seenPer100k(plan.law, f.share, f.deaths);
    if (Math.abs(seen - st.town.seen) > 1e-9) {
        st.town.seen = seen;
        delete st.town.next;
        saveState();
    }
    return societyBlock(societyOf({ ...plan, ...f }, year), st.town);
}
/** The seeded story's world year by year (world-count.ts), from the seed's year to the story's; null without a seed or
 * outside the records. */
function worldNow() {
    const code = ctx().chatMetadata ? store().state.seed : undefined;
    if (!code)
        return null;
    const plan = drawStart(code, getBook());
    if ('error' in plan)
        return null;
    const rows = yearByYear(plan.year, storyYearNow() ?? plan.year, plan.share, plan.deaths, kindGrowth(plan));
    return rows ? { plan, rows } : null;
}
const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text != null)
    e.textContent = text; return e; };
// How a fact was learned, as a sign and in words (why.ts relOfSource's relations).
const REL_ICON = { saw: 'fa-eye', sensed: 'fa-ear-listen', heard: 'fa-ear-listen', told: 'fa-comment', said: 'fa-comment', overheard: 'fa-ear-listen',
    hearsay: 'fa-comments', 'worked out': 'fa-magnifying-glass', assumed: 'fa-lightbulb', 'found out': 'fa-circle-check', remembers: 'fa-clock-rotate-left',
    'their own': 'fa-user', knows: 'fa-brain', 'everyone knows': 'fa-users', decided: 'fa-gavel', written: 'fa-scroll', clock: 'fa-clock' };
const relWords = (rel, by) => ({ saw: 'Saw it', sensed: 'Heard, smelled or felt it', heard: 'Heard it', told: by ? `Told by ${by}` : 'Told',
    said: 'Said', overheard: by ? `Overheard ${by}` : 'Overheard it', hearsay: 'Heard it said', 'worked out': 'Worked it out', assumed: 'Assumed it',
    'found out': 'Found out', remembers: 'Remembers it happening', 'their own': 'Their own', knows: 'Knows it', 'everyone knows': 'Everyone knows',
    decided: 'Decided', written: 'Written', clock: 'The clock' }[rel] ?? rel);
const capFirst = (t) => t ? `${t[0].toUpperCase()}${t.slice(1)}` : t;
/** A list of remembered facts (the player's review of 2026-11-17, after their references: one entry a line, details on a
 * tap): each a row with a sign for how it was learned, its words in one or two lines, and ≈ where some of its details have
 * drifted or are lost; a tap opens how and when it was learned, how long ago, how sure and how clearly, and the drift; a line
 * along the row's foot as long as it is recalled. The words stay as first held: which details drifted, the telling decides. */
function memoryList(rows) {
    const ul = el('ul', 'rules-mem');
    if (!rows.length) {
        const li = el('li', 'rules-mem-none', 'Nothing on record yet.');
        ul.append(li);
        return ul;
    }
    for (const r of rows) {
        const li = el('li', 'rules-mem-item'), d = document.createElement('details'), sum = document.createElement('summary');
        const icon = el('i', `rules-mem-icon fa-solid ${REL_ICON[r.rel] ?? 'fa-brain'}`);
        icon.setAttribute('aria-hidden', 'true');
        // Since 2026-11-17 (section 97): the memory as it is held now, by meaning; the words first held under the tap.
        sum.append(icon, el('span', 'rules-mem-text', capFirst(r.held?.as ?? r.text)));
        const h = r.held, drift = !h ? '' : (() => {
            const n = (k, one, many) => `${k} of its ${h.details} details ${k === 1 ? one : many}`;
            return h.changed && h.left ? `${n(h.changed, 'has', 'have')} drifted, ${h.left} ${h.left === 1 ? 'is' : 'are'} lost` : h.changed ? `${n(h.changed, 'has', 'have')} drifted` : h.left ? `${n(h.left, 'is', 'are')} lost` : '';
        })();
        if (drift) {
            const m = el('span', 'rules-mem-mark', '≈');
            m.title = drift;
            sum.append(m);
        }
        const more = el('div', 'rules-mem-more');
        more.append(el('div', '', [relWords(r.rel, r.by), r.at != null ? formatStoryTime(r.at) : ''].filter(Boolean).join(' · ')));
        if (h)
            more.append(el('div', '', `${capFirst(h.since)} ago · ${h.sure} · ${h.clear}`));
        if (drift)
            more.append(el('div', 'rules-mem-drift', drift));
        if (h?.told?.length)
            more.append(el('div', 'rules-mem-drift', `Told now: ${h.told.map(toldPhrase).join(', ')}`));
        if (h?.as && h.as !== r.text)
            more.append(el('div', 'rules-mem-first', `First held as: ${capFirst(r.text)}`));
        const bar = el('span', 'rules-mem-bar'), fill = el('i', '');
        fill.style.width = `${Math.round(r.strength * 100)}%`;
        bar.append(fill);
        d.append(sum, more);
        li.append(d, bar);
        ul.append(li);
    }
    return ul;
}
/** The map now: the plan around the player's character, with whom they heard and saw this turn. */
function mapNow() {
    const chat = ctx().chat ?? [], line = [...chat].reverse().find(m => m.is_user), sensed = sensedThisTurn(line?.extra?.rulesPass, playerName());
    return ctx().chatMetadata ? mapView(store().state, playerName(), sensed.heard, sensed.seen) : null;
}
/** One of the story's tabs: what the player's character remembers, the scene's map, or the story's timeline. */
function openTab(tab) {
    const player = playerName();
    if (tab === 'memory') {
        // A name on the tip of the player's character's tongue this hour (tongue.ts): the player writes their lines, so it
        // stands above the memories.
        const rows = memoryOf(store().state, player), tot = onTheTongue(store().state, player);
        const tip = tot.length ? [el('p', 'rules-mem-tot', `On the tip of your tongue now: ${tot.map(t => totPhrase(t, 'you')).join('; ')}. It may come back later.`)] : [];
        openSheet(`${player} remembers`, [...tip, memoryList(rows)], tab);
        return;
    }
    if (tab === 'map') {
        const v = mapNow();
        if (!v) {
            openTab('memory');
            return;
        }
        const [x0, y0, x1, y1] = v.box, w = 320, sc = Math.min(w / (x1 - x0), 200 / (y1 - y0)), X = (x) => (x - x0) * sc, Y = (y) => (y1 - y) * sc;
        const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${Math.round((y1 - y0) * sc)}`);
        svg.setAttribute('class', 'rules-map');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', `The scene's plan around ${player}`);
        const add = (tag, attrs, text) => { const e = document.createElementNS(ns, tag); for (const [k, val] of Object.entries(attrs))
            e.setAttribute(k, String(val)); if (text)
            e.textContent = text; svg.append(e); };
        for (const r of v.rooms)
            add('polygon', { points: r.corners.map(([x, y]) => `${X(x)},${Y(y)}`).join(' '), class: 'rules-map-room' });
        for (const p of v.people) {
            add('circle', { cx: X(p.x), cy: Y(p.y), r: p.player ? 7 : 6, class: p.player ? 'rules-map-me' : p.heard || p.seen ? 'rules-map-sensed' : 'rules-map-other' });
            add('text', { x: X(p.x), y: Y(p.y) + 18, 'text-anchor': 'middle', class: 'rules-map-name' }, `${p.name}${p.heard ? ' · heard' : ''}${p.seen ? ' · seen' : ''}`);
        }
        openSheet(`Around ${player}`, [svg], tab);
        return;
    }
    if (tab === 'world') {
        const w = worldNow();
        if (!w) {
            openTab('memory');
            return;
        }
        // This year's count first, the years so far under it, and the kind folded: the seed's numbers, which the player's
        // character does not know (as the start's card folds its law).
        const n = (x) => Math.round(x).toLocaleString('en-GB'), now = w.rows.at(-1), kills = w.rows.some(r => r.killed > 0);
        const head = el('div', 'rules-world-now');
        head.append(el('div', 'rules-world-year', String(now.year)), el('div', 'rules-world-people', `${n(now.people)} people`), el('div', 'rules-world-sub', `in England and Wales${now.year === w.plan.year ? '' : `, ${n(Math.abs(now.people - w.rows[0].people))} ${now.people >= w.rows[0].people ? 'more' : 'fewer'} than in ${w.plan.year}`}`));
        const table = document.createElement('table');
        table.className = 'rules-world-table';
        const hr = document.createElement('tr');
        for (const h of ['Year', 'People', 'Of the kind', ...kills ? ['Killed by them'] : []])
            hr.append(el('th', '', h));
        const thead = document.createElement('thead');
        thead.append(hr);
        table.append(thead);
        const tbody = document.createElement('tbody');
        for (const r of [...w.rows].reverse()) {
            const tr = document.createElement('tr');
            if (r === now)
                tr.className = 'rules-world-current';
            for (const v of [String(r.year), n(r.people), n(r.kind), ...kills ? [r.year === 1921 ? '–' : n(r.killed)] : []])
                tr.append(el('td', '', v));
            tbody.append(tr);
        }
        table.append(tbody);
        // How the country lives with them this year (society.ts; history, with fiction's pattern marked).
        const soc = societyOf({ ...w.plan, ...figuresIn(w.rows, now.year, w.plan) }, now.year), life = el('section', 'rules-world-life');
        // Where the player's character lives (town.ts): what is found there, and how much since the story began; then fiction's.
        const town = store().state.town;
        life.append(el('h3', 'rules-world-sub-head', `How people live with it: ${soc.stage}`), ...soc.lines.map(l => el('p', '', l)), ...town ? [el('p', 'rules-world-town', townLine(town, 'Your character'))] : [], el('p', 'rules-world-fiction', `${soc.fiction} (fiction's pattern, not history)`));
        const kind = document.createElement('details'), sum = document.createElement('summary');
        kind.className = 'rules-world-kind';
        sum.textContent = 'The kind: the seed\'s, which your character may not know';
        const body = el('div', '');
        if (w.plan.law?.what)
            body.append(el('p', '', capFirst(w.plan.law.what)));
        body.append(el('p', '', `What it does: ${w.plan.outcome}.`));
        // How their number changes year by year (the sheet's Numbers, counted since section 110).
        if (w.plan.law?.sheet?.numbers)
            body.append(el('p', '', `How their number changes: ${w.plan.law.sheet.numbers}; they live, die and leave as people do.`));
        if (w.plan.names.length)
            body.append(el('p', '', `Names for them: ${w.plan.names.map(x => `"${x.name}", first said in ${x.year}, known to ${Math.round(x.share * 100)} % of people`).join('; ')}.`));
        kind.append(sum, body);
        const note = el('p', 'rules-world-note', `Births and deaths as the Registrar General recorded them from 1850 (the 1840s at 1850's rates), the censuses of 1841–1921, and those who left between them; the kind's number follows its sheet.${now.year === 1921 && (storyYearNow() ?? 0) > 1921 ? ' The records held end in 1921.' : ''}`);
        openSheet('The world', [head, table, life, kind, note], tab);
        return;
    }
    const points = timelineOf(ctx().chat ?? []), t0 = points[0]?.time ?? 0, t1 = points.at(-1)?.time ?? 1, strip = el('div', 'rules-time');
    // A point's clock stands under it when it lies 14 % of the strip or more from the last one labelled (the newest always).
    let labelled = -Infinity;
    points.forEach((p, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'rules-time-point';
        const left = points.length > 1 ? 4 + 92 * (p.time - t0) / Math.max(1, t1 - t0) : 50;
        b.style.left = `${left}%`;
        const clock = /\d{1,2}:\d{2}/.exec(formatStoryTime(p.time))?.[0] ?? '', last = i === points.length - 1;
        b.title = formatStoryTime(p.time);
        b.setAttribute('aria-label', `Go to the line at ${formatStoryTime(p.time)}`);
        if (last || left - labelled >= 14) {
            b.append(el('span', 'rules-time-label', clock));
            labelled = left;
        }
        b.addEventListener('click', () => { hideWhy(); if (boxOn() && !boxLog) {
            boxAt = { mes: String(p.index), unit: 0 };
            stepDir = -1;
            showBox();
        }
        else
            document.querySelector(`#chat .mes[mesid="${p.index}"]`)?.scrollIntoView({ block: 'center' }); });
        strip.append(b);
    });
    openSheet('The story\'s time', [strip], tab);
}
/** A person's report card, a screen of its own (2026-11-17, section 92, the player's pick from Danganronpa's handbook, in the
 * extension's own look): over the whole page as the first-meeting card, their picture with its shadow, their trade (or age)
 * and their name on the white label, the labelled rows of what the engine records of them (views.ts reportRows), what the
 * player's character remembers of them (one row each, as in the Story window), and the numbers folded under it. Drawn anew
 * each time it opens, so it follows the story. A tap on the name tag opens it; the close button, Escape or a step on closes
 * it (hideWhy). */
function showPerson(name, mes) {
    let screen = document.getElementById('rules-report');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'rules-report';
        screen.setAttribute('role', 'dialog');
        document.body.appendChild(screen);
    }
    const p = trackedPeople()[name], v = voiceOfWho(name), rows = reportRows(p, v), role = p?.occupation ?? '';
    // The picture and, beside it on a wide screen, the rest (on a phone the rest's parts stand in the page's own grid).
    const page = el('div', 'rules-report-page'), info = el('div', 'rules-report-info'), src = mes ? avatarOf(name, mes) : null;
    if (src) {
        const img = document.createElement('img');
        img.className = 'rules-report-face';
        img.alt = '';
        img.src = src;
        page.append(img);
    }
    page.append(info);
    const head = el('div', 'rules-report-head'), label = el('span', 'rules-report-name', name);
    if (role)
        head.append(el('span', 'rules-report-role', role));
    head.append(label);
    info.append(head);
    if (rows.length) {
        const dl = el('dl', 'rules-report-rows');
        for (const [k, val] of rows)
            dl.append(el('dt', '', k), el('dd', '', val));
        info.append(dl);
    }
    const about = memoryAbout(store().state, playerName(), name), notes = el('section', 'rules-report-notes');
    if (about.length) {
        notes.append(el('h3', 'rules-report-sub', `What ${playerName()} remembers`), memoryList(about));
        info.append(notes);
    }
    if (v) {
        const d = document.createElement('details'), sum = document.createElement('summary'), ul = document.createElement('ul');
        d.className = 'rules-report-measures';
        sum.textContent = 'the measures';
        for (const m of [v.f0Hz ? `pitch: ${Math.round(v.f0Hz)} Hz` : '', v.sylPerS ? `pace: ${v.sylPerS.toFixed(1)} syllables a second` : '', voiceLine(v)].filter(Boolean)) {
            const li = document.createElement('li');
            li.textContent = m;
            ul.append(li);
        }
        d.append(sum, ul);
        info.append(d);
    }
    if (!rows.length && !about.length && !v)
        info.append(el('p', 'rules-report-none', `Nothing on record about ${name} yet.`));
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'rules-sheet-close';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => hideWhy());
    const scroll = el('div', 'rules-report-scroll');
    scroll.append(page);
    screen.replaceChildren(scroll, close);
    screen.setAttribute('aria-label', name);
    hideWhy();
    screen.hidden = false;
    fitCardName(label);
}
/** The path's card (shoot a word), rebuilt on 2026-11-17 in the sheet's look after the player's review of the white card:
 * the shot words as the pink tag, a close button, one row per step (a sign for its relation, what it names, and under it the
 * relation in words with who and when), the measures folded under them. It stays a card, not a window, so a selection can
 * still grow under it; it never covers the box or its tag, and it stands under the scene's badge when it fits there. */
function drawWhy(span, steps) {
    let panel = document.getElementById('rules-why');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'rules-why';
        panel.setAttribute('role', 'status');
        panel.setAttribute('aria-live', 'polite');
        (document.getElementById('sheld') ?? document.body).appendChild(panel);
    }
    const sheet = document.getElementById('rules-sheet');
    if (sheet)
        sheet.hidden = true;
    const top = el('div', 'rules-why-top'), close = document.createElement('button');
    close.type = 'button';
    close.className = 'rules-sheet-close';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => hideWhy());
    top.append(el('div', 'rules-why-title', `The path to “${span.length > 40 ? `${span.slice(0, 37)}…` : span}”`), close);
    const list = el('ul', 'rules-why-path');
    for (const s of steps) {
        const li = el('li', ''), icon = el('i', `rules-why-icon fa-solid ${REL_ICON[s.rel] ?? 'fa-circle'}`), words = el('div', 'rules-why-text');
        icon.setAttribute('aria-hidden', 'true');
        words.append(el('div', '', capFirst(s.text)), el('div', 'rules-why-note', [relWords(s.rel), s.note].filter(Boolean).join(' · ')));
        li.append(icon, words);
        list.append(li);
    }
    const body = el('div', 'rules-why-body');
    body.append(list);
    const measures = steps.flatMap(s => s.measures ?? []);
    if (measures.length) {
        const d = document.createElement('details'), sum = document.createElement('summary'), ul = document.createElement('ul');
        d.className = 'rules-why-measures';
        sum.textContent = 'the measures';
        for (const m of measures) {
            const li = document.createElement('li');
            li.textContent = m;
            ul.append(li);
        }
        d.append(sum, ul);
        body.append(d);
    }
    panel.replaceChildren(top, body);
    panel.hidden = false;
    // Its place: in the box, never over the box or its tag (34 px over the box); under the scene's badge when the card fits
    // in the room between them, else from the top of the screen down to the tag, its rows scrolling.
    panel.style.top = '';
    panel.style.maxHeight = 'none';
    const host = (panel.parentElement ?? document.body).getBoundingClientRect(), badge = document.getElementById('rules-box-scene'), box = document.querySelector('#chat .mes.rules-now');
    if (boxOn() && !boxLog && box) {
        const tag = box.getBoundingClientRect().top - 34 - 8 - host.top, b = badge?.getClientRects().length ? badge.getBoundingClientRect().bottom - host.top + 8 : 12;
        const tall = panel.getBoundingClientRect().height, top = tall <= tag - b ? b : 12;
        panel.style.top = `${Math.round(top)}px`;
        panel.style.maxHeight = `${Math.max(96, Math.floor(tag - top))}px`;
    }
    else
        panel.style.maxHeight = '';
}
/** Closes the panel; true when it was open. */
function hideWhy() {
    let was = false;
    for (const id of ['rules-why', 'rules-sheet', 'rules-report']) {
        const panel = document.getElementById(id);
        if (panel && !panel.hidden) {
            panel.hidden = true;
            was = true;
        }
    }
    return was;
}
/** One unit on (1) or back (−1); past a message's last or first unit, the neighbouring message's nearest one. Going on while
 * a unit still appears shows the rest of it first. */
function stepBox(d) {
    if (!boxOn() || boxLog || !boxAt)
        return;
    hideWhy();
    if (d === 1 && hideCard())
        return;
    if (d === 1 && finishTyping())
        return;
    const all = [...document.querySelectorAll('#chat .mes')], i = all.findIndex(m => m.getAttribute('mesid') === boxAt.mes);
    if (i < 0)
        return;
    const u = boxAt.unit + d;
    if (u >= 0 && u < Math.max(1, unitsIn(all[i]).length))
        boxAt = { mes: boxAt.mes, unit: u };
    else if (all[i + d])
        boxAt = { mes: all[i + d].getAttribute('mesid') ?? '', unit: d > 0 ? 0 : Math.max(0, unitsIn(all[i + d]).length - 1) };
    else
        return;
    stepDir = d;
    showBox();
}
/** The box's bar above the message box (back, the count, on, auto, the log) and its keys and taps; built once. */
function buildBox() {
    const form = document.getElementById('form_sheld'), chat = document.getElementById('chat');
    if (!form || !chat || document.getElementById('rules-box-bar'))
        return;
    const bar = document.createElement('div');
    bar.id = 'rules-box-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'The text box');
    const button = (id, text, label, act) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = text; b.title = label; b.setAttribute('aria-label', label); b.addEventListener('click', act); bar.appendChild(b); return b; };
    button('rules-box-back', '◀', 'Back', () => stepBox(-1));
    const count = document.createElement('span');
    count.id = 'rules-box-count';
    count.setAttribute('aria-live', 'off');
    bar.appendChild(count);
    button('rules-box-next', '▶', 'Next', () => stepBox(1));
    button('rules-box-auto', 'Auto', 'Move on by itself once a box has been read', () => {
        // settings() rebuilds the stored object on each call, so the toggle reads and writes one object.
        const s = settings();
        s.boxAuto = !s.boxAuto;
        ctx().saveSettingsDebounced();
        showBox();
        const now = document.querySelector('#chat .rules-unit-now');
        if (settings().boxAuto && now && !typing)
            scheduleAuto(now, Infinity);
        else if (!settings().boxAuto)
            clearTimeout(autoTimer);
    });
    const musicBtn = button('rules-box-music', '♪', 'Music', () => { const s = settings(); s.musicOn = !s.musicOn; ctx().saveSettingsDebounced(); musicNow(); musicBtn.setAttribute('aria-pressed', String(s.musicOn)); const box = document.getElementById('rules_engine_music'); if (box)
        box.checked = s.musicOn; });
    musicBtn.setAttribute('aria-pressed', String(settings().musicOn));
    button('rules-box-story', 'Story', 'What your character remembers, the scene\'s map and the story\'s timeline', () => openTab(mapNow() ? 'map' : 'memory'));
    button('rules-box-log', 'Log', 'The whole chat, or one box at a time', () => { boxLog = !boxLog; showBox(); if (boxLog)
        document.querySelector('#chat .rules-now')?.scrollIntoView({ block: 'center' }); });
    const explain = document.createElement('span');
    explain.id = 'rules-box-explain';
    explain.setAttribute('aria-live', 'polite');
    bar.appendChild(explain);
    form.before(bar);
    const scene = document.createElement('div');
    scene.id = 'rules-box-scene';
    scene.setAttribute('aria-live', 'off');
    chat.before(scene);
    if (!document.getElementById('rules-top-fold')) {
        const fold = document.createElement('button');
        fold.type = 'button';
        fold.id = 'rules-top-fold';
        fold.textContent = '▲';
        fold.title = 'Fold or unfold SillyTavern top toolbar';
        fold.setAttribute('aria-label', 'Toggle top bar');
        fold.setAttribute('aria-expanded', 'true');
        fold.addEventListener('click', () => {
            const folded = document.body.classList.toggle('rules-top-folded');
            fold.textContent = folded ? '▼' : '▲';
            fold.setAttribute('aria-expanded', String(!folded));
        });
        document.body.appendChild(fold);
    }
    let rulesSwipeX = null, rulesSwipeY = null;
    chat.addEventListener('touchstart', e => {
        const t = e.target;
        if (!boxOn() || boxLog || !t?.closest?.('.rules-now') || t.closest('button, a, input, textarea, [role="button"]') || e.touches.length !== 1) {
            rulesSwipeX = null;
            return;
        }
        rulesSwipeX = e.touches[0].clientX;
        rulesSwipeY = e.touches[0].clientY;
    }, { passive: true });
    chat.addEventListener('touchend', e => {
        if (rulesSwipeX === null || rulesSwipeY === null || e.changedTouches.length !== 1)
            return;
        const dx = e.changedTouches[0].clientX - rulesSwipeX, dy = e.changedTouches[0].clientY - rulesSwipeY;
        rulesSwipeX = null;
        rulesSwipeY = null;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4)
            return;
        if (String(document.getSelection?.() ?? '') || document.querySelector('#chat .rules-held'))
            return;
        stepBox(dx < 0 ? 1 : -1);
    }, { passive: true });
    // A tap on the badge (the story's clock) opens the timeline.
    scene.addEventListener('click', () => openTab('time'));
    // A tap on the box's text is "next"; a tap on anything that acts by itself (a link, a button, the note, an edit) is its own,
    // and so is a tap that ends a selection of text.
    const explainable = (t) => t?.closest?.('.rules-now .rules-v[title], .rules-now .rules-mode[title]') ?? null;
    chat.addEventListener('click', e => { const tag = e.target?.closest?.('.rules-now .rules-who'); if (tag && boxOn() && !boxLog) {
        e.stopPropagation();
        showPerson(tag.textContent ?? '', tag.closest('.mes'));
    } }, true);
    let holdTimer, swallowUntil = 0;
    chat.addEventListener('pointerdown', e => {
        clearTimeout(holdTimer);
        const t = explainable(e.target);
        if (!boxOn() || boxLog || e.pointerType === 'mouse' || !t?.getAttribute('title'))
            return;
        holdTimer = setTimeout(() => { t.classList.add('rules-held'); showExplain(explainOf(t)); }, HOLD_MS);
    });
    // Lifting the finger ends the explanation; the click that follows the lift is the hold's, not a step on.
    const release = () => {
        clearTimeout(holdTimer);
        const held = document.querySelectorAll('.rules-held');
        if (!held.length)
            return;
        held.forEach(e => e.classList.remove('rules-held'));
        showExplain(null);
        swallowUntil = performance.now() + 400;
    };
    chat.addEventListener('pointerup', release);
    chat.addEventListener('pointercancel', release);
    // A long press opens the device's menu and selection on a word; on a word that explains, the hold is the box's.
    chat.addEventListener('contextmenu', e => { if (boxOn() && !boxLog && explainable(e.target))
        e.preventDefault(); });
    // Shoot a word: a selection in a message shows its path (rules/why.ts), redrawn as the selection grows.
    let whyTimer;
    document.addEventListener('selectionchange', () => { clearTimeout(whyTimer); whyTimer = setTimeout(showWhy, 150); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape')
        hideWhy(); });
    globalThis.addEventListener?.('resize', () => { const w = document.querySelector('#chat .rules-now .rules-who'); if (w)
        fitTag(w); });
    chat.addEventListener('click', e => {
        const t = e.target;
        if (performance.now() < swallowUntil)
            return;
        if (!boxOn() || boxLog || !t?.closest?.('.rules-now .mes_text') || t.closest('a, button, summary, details, textarea, input, .mes_buttons, [role="button"]') || String(document.getSelection?.() ?? ''))
            return;
        if (hideWhy())
            return;
        stepBox(1);
    });
    document.addEventListener('keydown', e => {
        const t = e.target;
        if (!boxOn() || boxLog || e.ctrlKey || e.altKey || e.metaKey || t?.closest?.('textarea, input, select, [contenteditable]'))
            return;
        if (e.key === 'ArrowRight') {
            e.preventDefault();
            stepBox(1);
        }
        else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            stepBox(-1);
        }
    });
}
// The music (rules/music.ts; the player's picks, 2026-11-11: the characters' feelings set the target, songs measured in the
// browser as they are added, named sets first and measured areas otherwise). Each song is uploaded to SillyTavern's files
// (/api/files/upload, served at user/files) and measured from its decoded samples; the one nearest the scene's feelings plays,
// one song giving way to the next over musicCrossfadeS, equal-power (gains cos and sin of a quarter turn, so two unrelated
// songs keep their summed power), looping until the scene moves to another area.
let figureWho = null;
let players = [], playing = 0, nowSong = null, fadeTimer;
const songsNow = () => settings().songs ?? [];
/** The feelings in the scene: the one the player's latest line is marked with (the voice toolbar's feeling, Juslin & Laukka's
 * five), and each tracked character's appraised feelings still running (Appraise, [BODY]). */
function sceneFeelings() {
    const out = [], chat = ctx().chat ?? [];
    // Each feeling's turn: the number of the player's lines up to it (rules-tools.ts records an appraised one's).
    const turns = chat.filter(m => m?.is_user).length;
    for (let i = chat.length - 1; i >= 0; i--)
        if (chat[i]?.is_user) {
            const f = marksOf(String(chat[i].mes ?? '')).feeling;
            if (f)
                out.push({ who: playerName(), type: `voice:${f}`, turn: turns });
            break;
        }
    for (const [who, p] of Object.entries(trackedPeople()))
        for (const f of p.feelings ?? [])
            if (f.left > 0)
                out.push({ who, type: f.type, turn: f.turn ?? 0 });
    return out;
}
let musicFilter = null;
const wiredAudio = new WeakSet();
function wireMusicFilter(a) {
    if (wiredAudio.has(a))
        return;
    const AC = globalThis.AudioContext;
    if (!AC)
        return;
    try {
        blipCtx ??= new AC();
        if (!musicFilter) {
            musicFilter = blipCtx.createBiquadFilter();
            musicFilter.type = 'lowpass';
            musicFilter.frequency.value = 20000;
            musicFilter.Q.value = 0.8;
            musicFilter.connect(blipCtx.destination);
        }
        const src = blipCtx.createMediaElementSource(a);
        src.connect(musicFilter);
        wiredAudio.add(a);
    }
    catch { /* fallback to direct audio output if CORS or context blocks routing */ }
}
function triggerAudioShock(intensity = 1) {
    if (!blipCtx || !musicFilter)
        return;
    const now = blipCtx.currentTime;
    const cutoff = Math.max(420, 900 - intensity * 450);
    musicFilter.frequency.cancelScheduledValues(now);
    musicFilter.frequency.setValueAtTime(Math.max(420, musicFilter.frequency.value), now);
    musicFilter.frequency.exponentialRampToValueAtTime(cutoff, now + 0.12);
    musicFilter.frequency.exponentialRampToValueAtTime(20000, now + 1.65);
}
const player = (i) => {
    if (!players[i]) {
        const a = new Audio();
        a.loop = true;
        a.preload = 'auto';
        players[i] = a;
        wireMusicFilter(a);
    }
    return players[i];
};
/** A song on, the one playing out, equal-power over musicCrossfadeS. A browser that holds sound until the page is touched
 * gets it at the next touch. */
function playSong(song) {
    const from = nowSong ? players[playing] : undefined, to = player(1 - playing), vol = settings().musicVolume;
    playing = 1 - playing;
    nowSong = song.id;
    to.src = song.path;
    to.volume = 0;
    void to.play().catch(() => document.addEventListener('pointerdown', () => { void to.play().catch(() => { }); }, { once: true }));
    clearInterval(fadeTimer);
    const t0 = performance.now(), span = peek('musicCrossfadeS') * 1000;
    fadeTimer = setInterval(() => {
        const x = Math.min(1, (performance.now() - t0) / span);
        to.volume = vol * Math.sin(x * Math.PI / 2);
        if (from)
            from.volume = vol * Math.cos(x * Math.PI / 2);
        if (x >= 1) {
            clearInterval(fadeTimer);
            from?.pause();
        }
    }, 50);
}
function stopMusic() { nowSong = null; clearInterval(fadeTimer); for (const p of players)
    p.pause(); }
/** The library's points and areas, each area's key (the words it is first named with, a number after two alike) and its name
 * (the player's, else the key). */
function musicSpace(list) {
    const points = songPoints(list.map(x => x.cues)), areas = areasOf(points), keys = new Map(), names = new Map(), seen = new Map();
    for (const a of [...new Set(areas)].sort((x, y) => x - y)) {
        const words = areaWords(points.filter((_, i) => areas[i] === a)), n = (seen.get(words) ?? 0) + 1;
        seen.set(words, n);
        const key = n > 1 ? `${words} ${n}` : words;
        keys.set(a, key);
        names.set(a, settings().musicAreaNames?.[key] || key);
    }
    return { points, areas, keys, names };
}
/** The song for the scene as it stands (music.ts chooseSong), played if it is not the one playing. */
function musicNow() {
    const s = settings(), list = songsNow();
    if (!s.enabled || !s.musicOn || !list.length) {
        stopMusic();
        drawMusicNow();
        return;
    }
    const { points, areas } = musicSpace(list), cur = list.findIndex(x => x.id === nowSong);
    const place = trackedPeople()[playerName()]?.at ?? null;
    const pick = chooseSong({ points, areas, sets: list.map(x => x.set), target: sceneTarget(sceneFeelings()), place, current: cur >= 0 ? cur : null });
    if (pick != null && list[pick].id !== nowSong)
        playSong(list[pick]);
    drawMusicNow();
}
/** What plays, in the settings and on the box's ♪ button. */
function drawMusicNow() {
    const list = songsNow(), i = list.findIndex(x => x.id === nowSong), space = i < 0 ? null : musicSpace(list);
    const text = i < 0 ? 'No song playing' : `Playing: ${list[i].name} (${space.names.get(space.areas[i])})`;
    const now = document.getElementById('rules_engine_music_now');
    if (now)
        now.textContent = text;
    const b = document.getElementById('rules-box-music');
    if (b) {
        b.title = `Music: ${settings().musicOn ? text : 'off'}`;
        b.setAttribute('aria-pressed', String(settings().musicOn));
    }
}
/** A file's bytes as base64, in pieces small enough for String.fromCharCode. */
const base64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000)
    s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const headers = () => (ctx().getRequestHeaders?.() ?? { 'Content-Type': 'application/json' });
/** Songs picked from the device: each decoded, measured (music.ts measureSong), uploaded under a name SillyTavern accepts
 * (letters, digits, '-', '_', '.') and kept with its measures; then the list is drawn again and the music chosen again. */
async function addSongs(files) {
    const status = document.getElementById('rules_engine_music_status');
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    const ac = new AC();
    for (const [i, f] of files.entries()) {
        if (status)
            status.textContent = `Measuring ${i + 1} of ${files.length}: ${f.name}`;
        try {
            const buf = await f.arrayBuffer(), audio = await ac.decodeAudioData(buf.slice(0));
            const cues = await measureSong(Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c)), audio.sampleRate, () => new Promise(r => setTimeout(r, 0)));
            const ext = (/\.([a-z0-9]{1,5})$/i.exec(f.name)?.[1] ?? 'audio').toLowerCase(), id = `rules-song-${Date.now()}-${f.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40)}.${ext}`;
            const r = await fetch('/api/files/upload', { method: 'POST', headers: headers(), body: JSON.stringify({ name: id, data: base64(buf) }) });
            if (!r.ok)
                throw new Error(await r.text());
            const { path } = await r.json();
            const s = settings();
            s.songs = [...s.songs, { id, name: f.name.replace(/\.[^.]*$/, ''), path, set: '', cues }];
            ctx().saveSettingsDebounced();
        }
        catch (e) {
            toastr.warning(`${f.name}: ${e instanceof Error ? e.message : String(e)}`, 'Music');
        }
    }
    if (status)
        status.textContent = '';
    void ac.close();
    drawSongs();
    musicNow();
}
/** The songs in the settings: each with its measures, its area, a field for its set and a remove button; then the areas, each
 * with a field for its name. Every text is set as text. */
function drawSongs() {
    const box = document.getElementById('rules_engine_music_list'), areasBox = document.getElementById('rules_engine_music_areas');
    if (!box || !areasBox)
        return;
    const list = songsNow(), { areas, names, keys } = musicSpace(list);
    const el = (tag, cls, text = '') => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
    box.replaceChildren(...list.map((song, i) => {
        const row = el('div', 'rules-song'), c = song.cues;
        row.append(el('span', 'rules-song-name', song.name), el('small', 'rules-song-cues', `${c.bpm} BPM · ${c.lufs} LUFS · ${(c.centroidHz / 1000).toFixed(1)} kHz · ${c.key} · ${names.get(areas[i])}`));
        const set = el('input', 'text_pole rules-song-set');
        set.placeholder = 'set: a character or a place';
        set.value = song.set;
        set.setAttribute('aria-label', `Set of ${song.name}`);
        set.addEventListener('change', () => { const s = settings(); s.songs = s.songs.map(x => x.id === song.id ? { ...x, set: set.value.trim() } : x); ctx().saveSettingsDebounced(); musicNow(); });
        const rm = el('button', 'menu_button rules-song-remove', 'Remove');
        rm.type = 'button';
        rm.addEventListener('click', async () => {
            await fetch('/api/files/delete', { method: 'POST', headers: headers(), body: JSON.stringify({ path: song.path }) }).catch(() => null);
            const s = settings();
            s.songs = s.songs.filter(x => x.id !== song.id);
            ctx().saveSettingsDebounced();
            if (nowSong === song.id)
                stopMusic();
            drawSongs();
            musicNow();
        });
        row.append(set, rm);
        return row;
    }));
    areasBox.replaceChildren(...[...names.keys()].map(a => {
        const row = el('label', 'rules-area'), key = keys.get(a), name = el('input', 'text_pole');
        name.value = names.get(a);
        name.setAttribute('aria-label', `Name of the area ${key}`);
        name.addEventListener('change', () => { const s = settings(); s.musicAreaNames = { ...s.musicAreaNames, [key]: name.value.trim() }; ctx().saveSettingsDebounced(); drawSongs(); drawMusicNow(); });
        row.append(el('small', '', `${areas.filter(x => x === a).length} song(s), first named “${key}”: `), name);
        return row;
    }));
}
/** The look of the chat: the dialogue page while its setting is on (style.css, body.rules-page), and for marked lines the
 * multiple-distinctions look while its setting is on (body.rules-distinct), its sizes set from the sound of each mark (ui.ts
 * lookVars), so the stylesheet draws the engine's quantities. */
function applyLook() {
    if (typeof document === 'undefined')
        return;
    document.body?.classList?.toggle('rules-page', settings().page);
    document.body?.classList?.toggle('rules-page-dark', settings().page && settings().pageColours === 'dark');
    // The box's type: the page's size, or the size the farthest phone reader needs (box.ts boxFontPx); its lines hold the
    // letters boxLines lines of the page's size hold.
    const page = (parseFloat(getComputedStyle(document.body).getPropertyValue('--mainFontSize')) || 15) * 1.19, box = boxFontPx(page);
    boxLinesNow = boxLinesAt(page, box);
    document.body?.style?.setProperty('--rules-box-lines', String(boxLinesNow));
    document.body?.style?.setProperty('--rules-box-font', `${Math.round(box * 10) / 10}px`);
    document.body?.classList?.toggle('rules-distinct', settings().distinct);
    for (const [name, value] of Object.entries(lookVars()))
        document.body?.style?.setProperty(`--rules-${name}`, String(value));
    toneLook();
}
/** The tone of what the chat's text stands on: light on the dialogue page, whose ground is its own; off the page the theme's,
 * read from its text colour (light text is a dark theme). */
const toneNow = () => boxOn() && !boxLog && settings().boxLook === 'night' ? 'dark' : settings().page ? (settings().pageColours === 'dark' ? 'dark' : 'light') : toneOf(getComputedStyle(document.documentElement).getPropertyValue('--SmartThemeBodyColor'));
/** The tone, for the feeling colours' lightness (style.css, body[data-rules-tone]), and on the dialogue page the story's era on
 * the chat, for its type (style.css, .rules-era-…); both read again whenever the chat is drawn, as the player can change the
 * theme and the story's time moves. */
function toneLook() {
    if (typeof document === 'undefined' || !document.body?.setAttribute)
        return;
    document.body.setAttribute('data-rules-tone', toneNow());
    const chat = document.getElementById('chat');
    if (!chat)
        return;
    for (const c of [...chat.classList])
        if (c.startsWith('rules-era-'))
            chat.classList.remove(c);
    if (settings().page)
        chat.classList.add(`rules-era-${eraOf(storyYearNow())}`);
}
// The seed (seed.ts): a code, given or rolled, written into the engine's records through the tools, as the story would
// write them: the world's law into the card's world book, the date at nine at night, the player's character and the people
// around them (NewCharacter with what the code drew), their ties and wants (RecordFact; a secret want known to its keeper
// alone), and who is truly of the law's kind (TrueNature). The player is shown what their character knows.
/** The parts of the last start written, for its card (start-card.ts); taken by the command's popup. */
let lastStart = null;
/** Nine at night on the seed's date, in the engine's story minutes. */
export const seedTime = (plan) => parseStoryTime(`${plan.year}-${String(plan.month).padStart(2, '0')}-${String(plan.day).padStart(2, '0')} 21:00`);
async function applySeed(arg) {
    const book = getBook(), code = arg.trim() || rollSeed(Math.random, book.filter(e => e.tells?.length).length);
    const plan = drawStart(code, book);
    if ('error' in plan)
        return plan.error;
    // The seed's law is the authority for its kind: an entry of the same kind from an earlier seed (with that seed's sheet: its
    // active hours, attributes and resistances drawn from its own code) gives way to this one (since section 106).
    if (plan.law) {
        const old = book.find(e => e.what === plan.law.what);
        if (!old || JSON.stringify(old) !== JSON.stringify(plan.law))
            await saveBook([...book.filter(e => e.what !== plan.law.what), plan.law]);
    }
    // The engine's clock counts minutes from 1 January of year 1 (clock.ts), not from 1970.
    setStoryTime(seedTime(plan));
    const st = store().state;
    st.setting = { ...st.setting ?? {}, country: 'United Kingdom' };
    st.seed = plan.code;
    // The player's character gets no usual day (days.ts): the player decides what they do.
    setPresent(undefined, playerName());
    // The names people use for the kind stand for one thing (memory-meaning.ts): a changed name comes out as another of them.
    {
        const words = [...new Set(plan.names.map(x => headWord(x.name)).filter(Boolean))];
        if (words.length > 1)
            st.alike = [words];
    }
    for (const c of seedCalls(plan, playerName()))
        await REGISTRY.get(c.tool).exec(c.args);
    // The town the player's character lives in, and the kind's work among its people (town.ts).
    store().state.town = townOf(plan);
    // What each person wants toward another of the story, and who shares the player's roof (meetings.ts).
    {
        const me = playerName(), people = store().state.people ?? {};
        for (const x of plan.people) {
            const p = people[x.label];
            if (!p)
                continue;
            if (x.want.toward)
                p.want = { text: x.want.text, toward: x.want.toward === 'you' ? me : x.want.toward, secret: x.want.secret };
            if (/under your roof/.test(x.relation)) {
                p.home = 'the player\'s';
                if (people[me])
                    people[me].home = 'the player\'s';
            }
        }
        saveState();
    }
    refreshTime();
    lastStart = startParts(plan);
    return knownStart(plan);
}
// The story's own links between words (links.ts, section 104): /memory-link's, kept with the card (or the chat without one),
// and the groups the card's and the chat's lorebook entries give by their keys; memory drifts along them.
function getLinks() {
    const card = cardOf(), l = (card ? card.data?.extensions?.rulesLinks : ctx().chatMetadata?.rulesLinks);
    return { same: l?.same ?? [], kinds: l?.kinds ?? {} };
}
async function saveLinks(l) {
    const c = ctx(), card = cardOf();
    if (card)
        await c.writeExtensionField(Number(c.characterId), 'rulesLinks', l);
    else {
        c.chatMetadata.rulesLinks = l;
        await c.saveMetadata();
    }
    await refreshLinks();
}
/** The lorebook groups now: the card's own lorebook and the chat's. */
async function loreGroups() {
    const c = ctx(), names = [cardOf()?.data?.extensions?.world, c.chatMetadata?.world_info].filter((x) => typeof x === 'string' && !!x);
    const out = [];
    for (const n of [...new Set(names)]) {
        try {
            const book = await c.loadWorldInfo?.(n);
            out.push(...groupsOfLore(Object.values((book?.entries ?? {}))));
        }
        catch (e) {
            console.warn('[Rules engine] lorebook not read:', e);
        }
    }
    return out;
}
async function refreshLinks() { const own = getLinks(); setLinks({ same: [...own.same, ...await loreGroups()], kinds: own.kinds }); }
function registerLinkCommand() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'memory-link',
        helpString: 'Link words as memory holds them: /memory-link the Red Lion = Pike\'s = the inn (one thing under several names: a misremembered one comes out as another), /memory-link the returned : monster (a kind: a forgotten word is held as it). /memory-link alone lists the links; /memory-link remove 2 removes the second. A lorebook entry\'s keys link themselves.',
        returns: 'the links',
        callback: async (_a, value) => {
            const t = String(value ?? '').trim(), own = getLinks();
            const rm = /^remove\s+(\d+)$/i.exec(t);
            if (rm) {
                const i = Number(rm[1]) - 1, n = own.same.length;
                if (i < 0 || i >= n + Object.keys(own.kinds).length)
                    return `There is no link ${rm[1]}.`;
                if (i < n)
                    own.same.splice(i, 1);
                else
                    delete own.kinds[Object.keys(own.kinds)[i - n]];
                await saveLinks(own);
            }
            else if (t) {
                const p = parseLink(t);
                if ('error' in p)
                    return p.error;
                if ('same' in p)
                    own.same.push(p.same);
                else
                    own.kinds[p.kind[0]] = p.kind[1];
                await saveLinks(own);
            }
            const lore = await loreGroups(), mine = linkLines(own);
            return [mine.length ? `Your links:\n${mine.map((l, i) => `${i + 1}. ${l}`).join('\n')}` : 'No links of your own yet.', lore.length ? `From the lorebook's keys:\n${lore.map(g => g.join(' = ')).join('\n')}` : ''].filter(Boolean).join('\n\n');
        },
    }));
}
// The looks a character's picture takes (section 111; rules/expression-set.ts): one set for every chat (the player's pick),
// worked out from how often each look state was on a character as replies came, pooled over the chats whose counts the player
// added, and kept in the settings until worked out again.
function looksFrom(chats) {
    const sum = {};
    for (const c of Object.values(chats))
        for (const [k, n] of Object.entries(c))
            sum[k] = (sum[k] ?? 0) + n;
    return sum;
}
/** The set kept in the settings, worked out (again, with `recompute`: this chat's counts added to the pooled ones) when asked
 *  or when there is none yet. */
async function looksSet(recompute = false) {
    const s = settings(), looks = s.looks ??= { chats: {} };
    if (recompute)
        looks.chats[ctx().getCurrentChatId() ?? 'chat'] = { ...store().state.faced ?? {} };
    if (recompute || !looks.set) {
        toastr.info('Working out the looks…');
        await new Promise(r => setTimeout(r, 0));
        const counts = looksFrom(looks.chats), n = Object.values(counts).reduce((a, b) => a + b, 0), set = expressionSet(counts);
        looks.set = { made: new Date().toISOString(), from: n, chats: Object.keys(looks.chats).length, looks: set.knee.looks.map(l => ({ face: l.face, calm: l.calm, keys: l.keys })) };
        ctx().saveSettingsDebounced();
    }
    return looks.set;
}
/** A command's result in plain words, shown to the player and given back: SillyTavern shows nothing of a command typed in
 *  the chat box but its errors. The window is left open while a script that pipes the result goes on. */
function showText(text) {
    const c = ctx();
    void c.callGenericPopup(`<pre style="white-space:pre-wrap;text-align:left">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`, c.POPUP_TYPE.TEXT, '', {});
    return text;
}
function registerLooksCommand() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'rules-looks',
        helpString: 'The looks every character\'s picture takes, the same in every chat: /rules-looks shows the set; /rules-looks recompute adds this chat\'s counts (what each character looked like as replies came) to those of the chats added before and works the set out again (some seconds).',
        returns: 'the looks and what each stands for',
        callback: async (_a, value) => {
            const set = await looksSet(/^\s*recompute\s*$/i.test(String(value ?? '')));
            return showText([`${set.looks.length} looks, calm among them, from ${set.from} look${set.from === 1 ? '' : 's'} seen in ${set.chats} chat${set.chats === 1 ? '' : 's'}${set.from ? '' : ' (none yet: every state counted alike)'}:`,
                ...set.looks.map((l, i) => `${i + 1}. ${lookWords({ ...l, weights: [] })} → ${faceTags(l.face).tags.join(', ')}`)].join('\n'));
        },
    }));
}
// The looks' pictures (section 112; faces.ts): /rules-faces makes a character's faces from their card picture.
function registerFacesCommand() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'rules-faces',
        helpString: 'Make a character\'s faces, one for each look of the set, from their card picture with only the face redrawn: /rules-faces for this chat\'s character, /rules-faces Mary for another with a card. Faces already made are kept.',
        returns: 'how many faces were made',
        callback: async (_a, value) => {
            // The context read now, for the chat open when the command runs.
            const now = facesCtx(), who = String(value ?? '').trim() || now.name2 || '', card = (now.characters ?? []).find(x => x.name === who);
            const base = await baseOf(who, m => toastr.info(m));
            if (typeof base === 'string')
                return showText(base);
            // AI Horde redraws an area the player marks once on the picture (section 115).
            if ((now.extensionSettings?.sd?.source) === 'horde') {
                const boxes = (settings().looks ??= { chats: {} }).faceBoxes ??= {};
                const box = boxes[base.folder] ?? await markFace(base.url, who);
                if (!box)
                    return showText(`No face was marked on ${who}'s picture, so no face was drawn.`);
                boxes[base.folder] = base.box = box;
                now.saveSettingsDebounced();
            }
            const said = await makeFaces(now, who, base, (await looksSet()).looks, m => toastr.info(m));
            // A face the box found missing before may be there now.
            const theirs = `characters/${card?.avatar ? encodeURIComponent(who) : base.folder}/look_`;
            for (const m of [...missingExpr])
                if (m.startsWith(theirs))
                    missingExpr.delete(m);
            return showText(said);
        },
    }));
}
/** SillyTavern's context with the player's AI Horde key, for the faces (section 118). */
const facesCtx = () => ({ ...ctx(), hordeKey: settings().hordeKey || undefined });
const portraitDrawing = new Map();
/** The picture `who`'s faces are made from: their card's, or for one the engine made a portrait drawn once from their record
 *  (section 113; once at a time, however many ask); why there is none, else. */
async function baseOf(who, say = () => { }) {
    const now = facesCtx(), card = (now.characters ?? []).find(x => x.name === who);
    if (card?.avatar)
        return { url: `/characters/${encodeURIComponent(card.avatar)}`, folder: who, key: card.avatar.replace(/\.[^/.]+$/, '') };
    const p = trackedPeople()[who], folder = portraitFolder(who);
    if (!p || !folder)
        return `${who || 'This chat'} has no card and is no one the engine keeps in this chat, so there is no picture to make faces from.`;
    const looks = settings().looks ??= { chats: {} };
    if (!looks.portraits?.includes(folder)) {
        let drawing = portraitDrawing.get(folder);
        if (!drawing) {
            say(`Drawing ${who}'s portrait…`);
            drawing = drawPortrait(now, who, folder, portraitTags(p, storyYearNow(), colouringNow(who)).join(', '), seedOf(who)).then(why => {
                if (!why) {
                    (looks.portraits ??= []).push(folder);
                    now.saveSettingsDebounced();
                }
                portraitDrawing.delete(folder);
                return why;
            });
            portraitDrawing.set(folder, drawing);
        }
        const why = await drawing;
        if (why)
            return why;
    }
    return { url: `/characters/${folder}/portrait.png`, folder };
}
// Faces drawn in the background (section 116; faces.ts FaceQueue): for AI Horde, Forge, AUTOMATIC1111 or SD.Next, whenever the
// box shows someone whose look has no face yet, that face and their calm one are drawn, two at a time through AI Horde. On AI
// Horde the face is first marked once: a note the player taps when they like, the faces held until then.
const imageSource = () => (ctx().extensionSettings?.sd?.source) ?? '';
const faceTold = new Set(), faceBoxAsked = new Set();
let looksPending = null;
const faceQueue = new FaceQueue({
    atOnce: () => imageSource() === 'horde' ? hordeAtOnce() : 1,
    draw: drawQueuedFace,
    failed: (_job, why) => { if (!faceTold.has(why)) {
        faceTold.add(why);
        toastr.warning(why, 'Faces');
    } },
});
/** Asks for the faces of the look `who` is in now and of calm, in the background. */
function wantFaces(who) {
    const p = trackedPeople()[who];
    if (!p || !['horde', 'auto', 'vlad'].includes(imageSource()))
        return;
    // The set worked out once, however many ask while it is.
    const set = settings().looks?.set;
    void (set ? Promise.resolve(set) : looksPending ??= looksSet().finally(() => { looksPending = null; })).then(set => {
        const key = jointOf(p, storyTime()), now = set.looks.find(l => l.keys.includes(key)), calm = set.looks.find(l => l.calm);
        faceQueue.want(who, [now?.face, calm?.face].filter((f) => !!f));
    });
}
async function drawQueuedFace(job) {
    const now = facesCtx(), base = await baseOf(job.who);
    if (typeof base === 'string')
        return base;
    const label = lookLabel(job.face);
    if ((await spriteLabels(now, base.folder)).has(label))
        return 'done';
    if (imageSource() === 'horde') {
        const box = settings().looks?.faceBoxes?.[base.folder];
        if (!box) {
            askFaceBox(job.who, base);
            return 'box';
        }
        base.box = box;
    }
    const pic = await lookPicture(now, job.who, base, faceTags(job.face).tags.join(', '), seedOf(job.who));
    if (typeof pic === 'string')
        return pic;
    if (!await saveSprite(now, base.folder, label, pic))
        return `A face of ${job.who}'s could not be saved.`;
    missingExpr.delete(`characters/${base.key ? encodeURIComponent(job.who) : base.folder}/${label}.png`);
    return 'done';
}
/** A note the player taps to mark `who`'s face, once a session; their faces go on once it is marked. */
function askFaceBox(who, base) {
    if (faceBoxAsked.has(base.folder))
        return;
    faceBoxAsked.add(base.folder);
    toastr.info(`Tap here to mark ${who}'s face on their picture, so their faces can be drawn.`, 'Faces', {
        timeOut: 0, extendedTimeOut: 0, closeButton: true,
        onclick: () => void markFace(base.url, who).then(box => {
            if (!box) {
                faceBoxAsked.delete(base.folder);
                return;
            }
            ((settings().looks ??= { chats: {} }).faceBoxes ??= {})[base.folder] = box;
            ctx().saveSettingsDebounced();
            faceQueue.marked(who);
        }),
    });
}
/** Asks the player once to mark a face on a picture, by dragging a box over it from brow to chin; the box as shares of the
 *  picture's width and height, or null when none was marked. */
async function markFace(url, who) {
    const c = ctx(), id = `rules-facebox-${Date.now()}`, esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let box = null;
    const shown = c.callGenericPopup(`<div style="text-align:left;margin-bottom:6px">Drag a box over ${esc(who)}'s face, from brow to chin, then press OK. AI Horde redraws only inside it.</div>`
        + `<div id="${id}" style="position:relative;display:inline-block;touch-action:none;user-select:none"><img src="${url}" draggable="false" style="max-width:100%;max-height:60vh;display:block">`
        + `<div class="rules-facebox" style="position:absolute;border:2px solid #f44;border-radius:50%;display:none;pointer-events:none"></div></div>`, c.POPUP_TYPE.CONFIRM, '', {});
    await new Promise(r => setTimeout(r, 0));
    const wrap = document.getElementById(id), img = wrap?.querySelector('img'), mark = wrap?.querySelector('.rules-facebox');
    if (wrap && img && mark) {
        let from = null;
        const at = (e) => { const r = img.getBoundingClientRect(), cl = (v) => Math.min(1, Math.max(0, v)); return [cl((e.clientX - r.left) / r.width), cl((e.clientY - r.top) / r.height)]; };
        wrap.addEventListener('pointerdown', e => { from = at(e); wrap.setPointerCapture(e.pointerId); });
        wrap.addEventListener('pointermove', e => {
            if (!from)
                return;
            const p = at(e), b = { x: Math.min(from[0], p[0]), y: Math.min(from[1], p[1]), w: Math.abs(p[0] - from[0]), h: Math.abs(p[1] - from[1]) };
            box = b;
            Object.assign(mark.style, { display: 'block', left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` });
        });
        wrap.addEventListener('pointerup', () => { from = null; });
    }
    const ok = await shown, b = box;
    return ok && b && b.w > 0.02 && b.h > 0.02 ? b : null;
}
/** The face for a person's look now, from the set kept in the settings: their sprite labelled by the look's face. */
function lookSpriteOf(who) {
    const set = settings().looks?.set, p = trackedPeople()[who];
    if (!set || !p)
        return null;
    const key = jointOf(p, storyTime()), look = set.looks.find(l => l.keys.includes(key));
    const card = ctx().characters?.some(c => c.name === who && c.avatar), drawn = portraitFolder(who);
    const folder = card ? encodeURIComponent(who) : drawn && settings().looks?.portraits?.includes(drawn) ? drawn : null;
    return look && folder ? `characters/${folder}/${lookLabel(look.face)}.png` : null;
}
/** The hair and eyes of one the engine made, with no card and other than the player's character, drawn from measured
 *  shares where they fit (colouring.ts); null otherwise. */
function colouringNow(who) {
    const c = ctx(), id = c.getCurrentChatId?.(), p = trackedPeople()[who];
    if (!id || !p || who === c.name1 || (c.characters ?? []).some(x => x.name === who && x.avatar))
        return null;
    return colouringOf(who, id, p.region, !!(c.chatMetadata ? store().state.seed : undefined), p.age, genotypeOf(who, id, trackedPeople()));
}
/** What the narrator is told of how the people with no card look (section 114): the hair and eyes drawn for them and the dress
 *  of their trade and year, so the story and their pictures agree. */
function looksInjection() {
    const year = storyYearNow(), lines = Object.entries(trackedPeople()).flatMap(([who, p]) => {
        const col = colouringNow(who);
        return col ? [`${who}: ${[col.hair, col.eyes].filter(Boolean).join(', ')}; wears ${dressOf(p.occupation, year)}.`] : [];
    });
    return lines.length ? `[LOOKS]\n${lines.join('\n')}\n[/LOOKS]` : '';
}
/** The sprite folder of one the engine made in this chat (rules-people/<name>_<hash of chat and name>): the same name in
 *  another chat is another person. Letters and digits only, so SillyTavern keeps it as it is. */
function portraitFolder(who) {
    const id = ctx().getCurrentChatId?.();
    return who && id ? `rules-people/${who.replace(/[^\p{L}\p{N}]+/gu, '_')}_${seedOf(`${id}\n${who}`).toString(36)}` : null;
}
function registerSeedCommand() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'rules-seed',
        helpString: 'Start from a seed: /rules-seed rolls one; /rules-seed EW1881-BH.RA-N4-D2-K5-7f2c gives that start again. Place and year; the law on axes (body: B breath, H warmth, S sleep, E food, D drink, P pain, F fear it lacks; a dot; origin: B born so, M made, R came back from death, E from elsewhere; passing: A looks like anyone, C copies one person, H keeps out of sight; with E, a dot and its diet: F flesh or B blood, then K the living killed, S spared, R the dead, O their own kind; and then no D where feeding kills, since how deadly they are follows); W and their mass in kg, if not 70, or WB1… for your world book\'s kinds; how many are of the kind, N (one in 10^N); how deadly, D (10^(D−1) deaths per 100,000 people a year); K and 3–7 people; the draw. Best in a new chat.',
        returns: 'what your character knows of the start',
        callback: async (_args, value) => {
            lastStart = null;
            const out = await applySeed(String(value ?? ''));
            // The start as a card (start-card.ts); a refusal (a code that does not read) as the plain words it is.
            const card = lastStart ? startCardHtml(lastStart) : `<pre style="white-space:pre-wrap;text-align:left">${out.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</pre>`;
            lastStart = null;
            await c.callGenericPopup(card, c.POPUP_TYPE.TEXT, '', {});
            return out;
        },
    }));
}
function registerTimeCommand() {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser)
        return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'rules-time',
        helpString: 'Show the story time, or set it: /rules-time 1850-03-14 18:40, /rules-time 1850-03-14, /rules-time Day 3 07:15. PassTime moves it on from there.',
        returns: 'the story time',
        callback: async (_args, value) => {
            const text = String(value ?? '').trim();
            if (text) {
                const t = parseStoryTime(text);
                if (t === null)
                    return 'Not a story time. Use 1850-03-14 18:40, 1850-03-14, or Day 3 07:15.';
                setStoryTime(t);
                refreshTime();
            }
            const now = storyTime();
            return now === null ? 'No story time set. Set one with /rules-time 1850-03-14 18:40.' : `Story time: ${formatStoryTime(now)}.`;
        },
    }));
}
function refreshTime() {
    const t = ctx().chatMetadata ? storyTime() : null;
    const el = document.getElementById('rules_engine_time');
    if (el && document.activeElement !== el)
        el.value = t === null ? '' : formatStoryTime(t);
}
async function buildSettings() {
    const html = await ctx().renderExtensionTemplateAsync(`third-party/${folder()}`, 'settings');
    document.getElementById('extensions_settings2')?.insertAdjacentHTML('beforeend', html);
    const s = settings();
    const bind = (id, key, after) => {
        const el = document.getElementById(id);
        el.checked = s[key];
        el.addEventListener('change', () => { settings()[key] = el.checked; ctx().saveSettingsDebounced(); after?.(); });
    };
    bind('rules_engine_enabled', 'enabled', () => registerRulesTools(settings().enabled));
    bind('rules_engine_question_pass', 'questionPass');
    bind('rules_engine_rule_check', 'ruleCheck');
    if (document.getElementById('rules_engine_structured'))
        bind('rules_engine_structured', 'structured');
    if (document.getElementById('rules_engine_suggest'))
        bind('rules_engine_suggest', 'suggest');
    if (document.getElementById('rules_engine_distinct'))
        bind('rules_engine_distinct', 'distinct', applyLook);
    // The notes are drawn again with the page: their kind colours take the tone of what they stand on.
    if (document.getElementById('rules_engine_page'))
        bind('rules_engine_page', 'page', () => { applyLook(); drawNotes(); showBox(); });
    if (document.getElementById('rules_engine_box_typing'))
        bind('rules_engine_box_typing', 'boxTyping');
    // A setting given as a choice of named values: the select shows the saved one and saves the one picked.
    const choice = (id, key, values, after) => {
        const el = document.getElementById(id);
        if (!el)
            return;
        el.value = String(s[key]);
        el.addEventListener('change', () => { settings()[key] = values.find(v => v === el.value) ?? values[0]; ctx().saveSettingsDebounced(); after(); });
    };
    choice('rules_engine_page_colours', 'pageColours', ['light', 'dark'], () => { applyLook(); drawNotes(); showBox(); });
    choice('rules_engine_box_picture', 'boxPicture', ['none', 'large'], showBox);
    choice('rules_engine_box_look', 'boxLook', ['night', 'page'], showBox);
    choice('rules_engine_box_voice', 'boxVoice', ['natural', 'robotic', 'blips', 'off'], () => { if (settings().boxVoice === 'robotic')
        void loadSpeech().catch(() => undefined); if (settings().boxVoice === 'natural')
        void loadNatural().catch(() => undefined); });
    choice('rules_engine_keyboard', 'keyboardLayout', ['auto', 'qwerty', 'qwertz', 'azerty', 'dvorak', 'colemak'], () => undefined);
    // The music: on or off, the volume, songs added from the device, and the list of songs and areas.
    if (document.getElementById('rules_engine_music'))
        bind('rules_engine_music', 'musicOn', musicNow);
    const volume = document.getElementById('rules_engine_music_volume');
    if (volume) {
        volume.value = String(Math.round(s.musicVolume * 100));
        volume.addEventListener('input', () => { settings().musicVolume = Number(volume.value) / 100; ctx().saveSettingsDebounced(); const p = players[playing]; if (p && nowSong)
            p.volume = settings().musicVolume; });
    }
    const files = document.getElementById('rules_engine_music_files');
    document.getElementById('rules_engine_music_add')?.addEventListener('click', () => files?.click());
    files?.addEventListener('change', () => { const f = [...(files.files ?? [])]; files.value = ''; if (f.length)
        void addSongs(f); });
    drawSongs();
    drawMusicNow();
    if (document.getElementById('rules_engine_box'))
        bind('rules_engine_box', 'box', () => { boxLog = false; drawNotes(); showBox(); });
    const boxUnit = document.getElementById('rules_engine_box_unit');
    if (boxUnit) {
        boxUnit.value = s.boxUnit;
        boxUnit.addEventListener('change', () => { settings().boxUnit = boxUnit.value === 'message' ? 'message' : 'voice'; ctx().saveSettingsDebounced(); boxAt = boxAt && { mes: boxAt.mes, unit: 0 }; showBox(); });
    }
    const profile = document.getElementById('rules_engine_profile');
    const profiles = ctx().extensionSettings.connectionManager?.profiles ?? [];
    for (const p of profiles)
        profile.add(new Option(p.name, p.id));
    profile.value = profiles.some(p => p.id === s.profile) ? s.profile : '';
    profile.addEventListener('change', () => { settings().profile = profile.value; ctx().saveSettingsDebounced(); });
    const hordeKey = document.getElementById('rules_engine_horde_key');
    if (hordeKey) {
        hordeKey.value = s.hordeKey ?? '';
        hordeKey.addEventListener('change', () => { settings().hordeKey = hordeKey.value.trim(); ctx().saveSettingsDebounced(); });
    }
    const tokens = document.getElementById('rules_engine_max_tokens');
    tokens.value = String(s.maxTokens || '');
    tokens.addEventListener('change', () => { settings().maxTokens = Math.max(0, Number(tokens.value) || 0); ctx().saveSettingsDebounced(); });
    const effort = document.getElementById('rules_engine_effort');
    if (effort) {
        effort.value = s.effort ?? 'low';
        effort.addEventListener('change', () => { settings().effort = effort.value; ctx().saveSettingsDebounced(); });
    }
    const time = document.getElementById('rules_engine_time');
    time.addEventListener('change', () => {
        const t = parseStoryTime(time.value);
        if (t === null) {
            toastr.warning('Use 1850-03-14 18:40, 1850-03-14, or Day 3 07:15.', 'Story time');
            refreshTime();
            return;
        }
        if (ctx().chatMetadata) {
            setStoryTime(t);
            refreshTime();
        }
    });
    refreshTime();
    const line = document.getElementById('rules_engine_world_line');
    document.getElementById('rules_engine_world_fill')?.addEventListener('click', () => {
        if (!line.value.trim())
            return;
        void addEntry(line.value.trim()).then(msg => { toastr.info(msg, 'World book'); line.value = ''; });
    });
    renderBook();
}
/** This extension's folder under scripts/extensions/third-party, from the URL this module loaded from. */
const folder = () => decodeURIComponent(new URL('.', import.meta.url).pathname.replace(/\/src\/$/, '').split('/').pop() || NAME);
// Structured narration (narration.ts) on the main reply: when the question pass decided this turn and the connection takes
// a schema, the reply's request carries the beats schema; the reply is read into prose when it arrives.
const SUGGEST_LINE = 'They are what the real world of this time and place would most likely give. Take each as a suggestion: keep it where this world and the story agree with it, and change it where they differ.';
const SUGGEST_BRIEF = `<rule_engine>
This story's world departs from real history. The rule engine works out what the real world of the story's time and place would most likely give ([DECIDED]); this world's own rules, its world book and the story come first. Use each outcome as a guide to likelihood and detail, and keep the story's own laws and established facts. [BODY], [TIME] and the belongings list hold what the engine recorded; where the story has already told an outcome differently, the story's version stands.
</rule_engine>`;
const structuredNow = () => { const s = settings(); return s.enabled && s.structured && !s.suggest && s.questionPass && GUIDED && questionPassRan(); };
function addReplySchema(data) {
    if (!structuredNow())
        return;
    const schema = narrationSchema(decidedResults().length), rf = { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema } };
    data.response_format = rf;
    data.json_schema = { name: 'reply', strict: true, value: schema };
    if (data.chat_completion_source === 'custom')
        data.custom_include_body = `${String(data.custom_include_body ?? '').trim()}${data.custom_include_body ? '\n' : ''}response_format: ${JSON.stringify(rf)}`;
}
function readReply(id) {
    const c = ctx();
    const msg = c.chat?.[id];
    if (!msg || msg.is_user || msg.is_system)
        return;
    const before = msg.mes, swipe = msg.swipe_id ?? 0, nar = readNarration(msg.mes);
    msg.extra ??= {};
    if (nar) {
        msg.mes = proseOf(nar);
        (msg.extra.rulesNarration ??= {})[swipe] = nar;
    }
    setOpen(nar?.open ?? []);
    // The names the narrator wrote before its quotations (box.ts takeSpeakers) leave the text; the box's plate reads them.
    const sp = takeSpeakers(msg.mes);
    msg.mes = sp.text;
    if (sp.said.length)
        (msg.extra.rulesSpeakers ??= {})[swipe] = sp.said;
    // The words that name what the engine decided this turn (box.ts keyPhrase), set apart in the chat as the reference sets
    // important words in yellow (style.css mark.rules-key).
    const people = castNames(), keys = decidedResults().flatMap(r => { const phrase = keyPhrase(r.result, msg.mes, people); return phrase ? [{ phrase, result: r.result, tool: r.tool }] : []; });
    if (keys.length)
        (msg.extra.rulesKeys ??= {})[swipe] = keys;
    if (msg.mes === before && !keys.length)
        return;
    // The swipe keeps the text shown, so swiping back to it shows prose, not the reply's raw form.
    if (Array.isArray(msg.swipes) && msg.swipes[swipe] === before)
        msg.swipes[swipe] = msg.mes;
    try {
        c.updateMessageBlock?.(id, msg);
    }
    catch { /* the block is drawn after this event */ }
    c.saveChatDebounced?.();
}
/** Each reply's key words (readReply) marked where they first stand in its text, with the result they name on hover. */
function markKeys() {
    for (const mes of document.querySelectorAll('#chat .mes[is_user="false"]')) {
        const text = mes.querySelector('.mes_text'), msg = ctx().chat?.[Number(mes.getAttribute('mesid'))];
        const keys = msg?.extra?.rulesKeys?.[msg?.swipe_id ?? 0];
        if (!text || !keys?.length || text.querySelector('mark.rules-key, .edit_textarea'))
            continue;
        for (const k of keys) {
            const walk = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
            for (let n = walk.nextNode(); n; n = walk.nextNode()) {
                const at = n.data.indexOf(k.phrase);
                if (at < 0 || n.parentElement?.closest('mark.rules-key'))
                    continue;
                const m = document.createElement('mark');
                m.className = 'rules-key';
                m.title = `What the engine decided: ${k.result}`;
                const rest = n.splitText(at);
                rest.splitText(k.phrase.length);
                rest.replaceWith(m);
                m.appendChild(rest);
                break;
            }
        }
    }
}
function wireEvents() {
    const c = ctx(), on = c.eventSource.on.bind(c.eventSource), ev = c.eventTypes;
    const live = () => settings().enabled && !!ctx().chatMetadata;
    // First of the reply's handlers: the rule check and the saved state read the prose.
    on(ev.MESSAGE_RECEIVED, (id) => { if (live())
        readReply(id); });
    if (ev.CHAT_COMPLETION_SETTINGS_READY)
        on(ev.CHAT_COMPLETION_SETTINGS_READY, (data) => { if (live())
            addReplySchema(data); });
    // Every request to a model leaves with the player's hidden marks as notation, whoever built it: the interceptor notates the
    // reply's own chat, and an extension's raw prompt (the summary's "raw" builder) reads the lines as saved.
    for (const e of [ev.CHAT_COMPLETION_SETTINGS_READY, ev.TEXT_COMPLETION_SETTINGS_READY])
        if (e)
            on(e, (data) => notateRequest(data));
    on(ev.GENERATION_STARTED, (type) => { if (live())
        onRulesGenerationStarted(type); });
    on(ev.MESSAGE_RECEIVED, (id) => { if (live())
        onRulesMessageReceived(id); });
    on(ev.MESSAGE_RECEIVED, async (id) => {
        // A greeting has no player turn to check against.
        if (!live() || !settings().ruleCheck || settings().suggest || !ctx().chat.some(m => m.is_user))
            return;
        const chatId = ctx().getCurrentChatId();
        const ownsChat = () => ctx().getCurrentChatId() === chatId;
        await onRulesAuditMessage(id, {
            send, ownsChat,
            generate: type => setTimeout(() => { if (ownsChat())
                void Promise.resolve(ctx().generate(type)).catch(e => console.error('[Rules engine] redo failed:', e)); }, 75),
            toast: text => toastr.warning(text, 'Rule check', { timeOut: 12000 }),
        }).catch(e => console.warn('[Rules engine] rule check skipped:', e));
    });
    on(ev.MESSAGE_SWIPED, (id) => { if (live())
        onRulesSwiped(id); });
    // The line sent keeps the knob's stop before the turn's passes read it.
    const sent = ev.MESSAGE_SENT ?? ev.USER_MESSAGE_RENDERED;
    if (sent)
        on(sent, (id) => keepFaith(id));
    // The music follows the scene's feelings: a new chat, the player's line drawn, a reply after the engine decided its turn.
    for (const e of [ev.CHAT_CHANGED, ev.USER_MESSAGE_RENDERED, ev.MESSAGE_RECEIVED])
        if (e)
            on(e, () => { try {
                musicNow();
            }
            catch (err) {
                console.warn('[Rules engine] music skipped:', err);
            } });
    // The tracked people's voices are simulated in the background from the chat's opening, and the plates redrawn once known.
    for (const e of [ev.CHAT_CHANGED, ev.MESSAGE_RECEIVED])
        if (e)
            on(e, () => { void voicesReady(trackedPeople()).then(() => { if (boxOn())
                showBox(); }).catch(err => console.warn('[Rules engine] voice skipped:', err)); });
    on(ev.CHAT_CHANGED, () => { void refreshLinks(); });
    on(ev.CHAT_CHANGED, () => { document.body.classList.remove('rules-card-on'); if (live())
        syncRulesToChat(); refreshTime(); applyWorld(getBook()); renderBook(); drawNotes(); typesetChat(); boxAt = null; figureSrc = null; showBox(); });
    on(ev.MESSAGE_DELETED, () => { if (live())
        syncRulesToChat(); drawNotes(); showBox(); });
    // The reading notes follow the chat as it is drawn: a new or re-drawn message, older messages loaded, an edit (a line
    // edited since its reading shows no note, ui.ts notesOf).
    for (const e of [ev.USER_MESSAGE_RENDERED, ev.CHARACTER_MESSAGE_RENDERED, ev.MESSAGE_UPDATED, ev.MORE_MESSAGES_LOADED])
        if (e)
            on(e, (id) => {
                drawNotes();
                typesetChat();
                // A message just drawn (the player's line, a reply) is read from its first unit.
                if ((e === ev.USER_MESSAGE_RENDERED || e === ev.CHARACTER_MESSAGE_RENDERED) && (typeof id === 'number' || typeof id === 'string'))
                    boxAt = { mes: String(id), unit: 0 };
                showBox();
            });
    // PassTime moves the clock; the field follows after each reply.
    on(ev.MESSAGE_RECEIVED, () => refreshTime());
}
(async () => {
    registerRulesTools(settings().enabled);
    // Constrained decoding on by default; a connection that refuses it turns it off on the first refusal (send above).
    setGuided(true);
    void loadColex();
    void loadLanguageYears();
    void loadThings();
    void loadChat();
    void loadPopulation();
    wireEvents();
    registerRulesStatsCommand();
    const c = ctx();
    c.SlashCommandParser?.addCommandObject(c.SlashCommand.fromProps({ name: 'rules-pulse-test', helpString: 'Runs the body simulation (Pulse) for 2 minutes of a leg bleed and reports the vital signs and the time it took.', callback: async () => {
            // A command's return value is not shown in the chat, so the result appears as a notice that stays until tapped.
            const t = globalThis.toastr;
            t?.info('Pulse test running (up to a minute)…');
            const r = await pulseSelfTest();
            t?.success(r, 'Pulse', { timeOut: 0, extendedTimeOut: 0 });
            return r;
        } }));
    c.SlashCommandParser?.addCommandObject(c.SlashCommand.fromProps({ name: 'rules-replay', helpString: 'Replays every recorded change of the world and says whether it rebuilds the current state exactly.', callback: async () => {
            const r = historyCheck();
            globalThis.toastr?.success(r, 'History', { timeOut: 0, extendedTimeOut: 0 });
            return r;
        } }));
    c.SlashCommandParser?.addCommandObject(c.SlashCommand.fromProps({ name: 'rules-log', helpString: 'This turn\'s decisions: each call, its arguments, the random draws it used and its result.', callback: async () => turnLog() }));
    registerRulesEvalCommand(send);
    registerTimeCommand();
    registerSeedCommand();
    registerLinkCommand();
    registerLooksCommand();
    registerFacesCommand();
    registerWorldCommands();
    await buildSettings();
    try {
        buildVoice();
    }
    catch (e) {
        console.warn('[Rules engine] voice toolbar skipped:', e);
    }
    try {
        buildBox();
    }
    catch (e) {
        console.warn('[Rules engine] text box skipped:', e);
    }
    applyLook();
    showBox();
    applyWorld(getBook());
    console.log(`[Rules engine] loaded: ${REGISTRY.size} tools`);
})();
