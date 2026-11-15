import type { KeyboardLayout } from './rules/keyboard.js';
// Rules Engine for SillyTavern: code decides outcomes, the narrator writes them (docs/df-body-engine.md). Each turn a
// question pass names the outcomes in doubt and the engine decides them; the narrator gets the brief, the story time,
// [BODY], [KNOWS] and [DECIDED] as one system message; a rule check reads the reply and redoes it once when it bends a result.
import { pulseSelfTest } from './rules/pulse.js';
import {
    registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat,
    rulesBrief, RULES_BRIEF_DECIDED, knowledgeInjection, possessionsInjection, scenePosition, questionPassRan, storyTime, setStoryTime, REGISTRY,
    historyCheck, sceneSky, scenePlace, storyYearNow, store,
} from './rules/rules-tools.js';
import { pathOf, sentenceAt, type WhyStep } from './rules/why.js';
import { memoryOf, memoryAbout, voiceWords, feelingNow, pictureFeeling, timelineOf, mapView, sensedThisTurn } from './rules/views.js';
import { FAITH_STOPS, FAITH_NAME, FAITH_SAYS, faithOf, faithLine, nextFaith, type Faith } from './rules/faith.js';
import { runQuestionPass, decidedInjection, decidedResults, turnLog, setGuided, setOpen, GUIDED, actionItems, rephraseAsked, takenReading, redoneBy, voiceRead, meantReading, storyResult, type Chooser, type Asker } from './rules/question-pass.js';
import { noteView, notesOf, platesOf, drawModes, voiceUnits, lineToTakeBack, drawNote, askPopup, askAnswer, saidOf, eraOf, toneOf, VOICE_GROUPS, mirrorParts, drawVoice, lookVars, heldParts, RUN_MARKS, NOTE_KEY, type ReadingNote, type Doc } from './ui.js';
import { markWords, keyDelete, hasHidden, notateChat, visible, untagged, notateRequest, marksOf } from './rules/voice-code.js';
import { NARRATION_RULE, narrationSchema, readNarration, proseOf } from './rules/narration.js';
import { speakersOf, takeSpeakers, SPEAKER_RULE, cutsOf, revealTimes, autoWait, slotOf, keyPhrase, type Stretch, type SlotWord, boxFontPx, boxLinesAt, sceneLine, sceneBadge, cardRole, tagFloorPx, explainParts } from './rules/box.js';
import { peek } from './rules/constants.js';
import { voiceOf, voiceLine, voiceFactsOf, voicesReady, voiceHarmonics, speakingFactsOf } from './rules/voice-body.js';
import { speechVoice, speechVoiceFile, speechTimes, scaleTimes } from './rules/speech.js';
import { POCKET_MODEL, bodyTarget, habitsOf, freeCacheLength, spokenText, pocketJob } from './rules/pocket.js';
import { blipPlan, BLIP_RAMP_S } from './rules/blips.js';
import { measureSong, songPoints, areasOf, areaWords, sceneTarget, chooseSong, type Cues } from './rules/music.js';
import { onRulesAuditMessage, takeAuditNote, registerRulesStatsCommand } from './rules/rules-audit.js';
import { registerRulesEvalCommand } from './rules/eval.js';
import { bodyBlock, trackedPeople } from './rules/body-sheet.js';
import { VOCAL_FAMILY } from './rules/emotion.js';
import type { Person } from './rules/types.js';
import { parseStoryTime, formatStoryTime } from './rules/clock.js';
import { sendModel } from './send.js';
import { worldBlock, applyWorld, checkEntry, parseEntry, FILL_SYSTEM, type Entry } from './rules/world.js';
import { removeWithDescendants, outcomeLine, bornIn, type Outcome } from './rules/counterfactual.js';
import { firstYear, earlier, loadChat } from './rules/history.js';
import { loadPopulation } from './rules/population.js';
import { seededRng, gauss } from './rules/body-engine.js';
import { loadColex } from './rules/colex.js';
import { loadLanguageYears } from './rules/languages.js';
import { loadThings } from './rules/things.js';

const NAME = 'rules-engine', KEY = 'rules_engine';
// SillyTavern extension_prompt_types.IN_CHAT and extension_prompt_roles.SYSTEM (public/script.js).
const IN_CHAT = 1, SYSTEM = 0;
// The engine's message sits this many messages above the end of the chat: 1 = just above the player's last message.
const DEPTH = 1;

// distinct: the multiple-distinctions look for marked lines (style.css, body.rules-distinct), each voice dimension in a visual
// channel of its own; off, the lighter look.
// page: the chat set as a light page in the story's book serif, whatever the theme (style.css, body.rules-page); off, the theme's look.
// pageColours: the page's colours: 'light', black on ivory; 'dark', the reference's (white on black, text that is not said in light blue).
// box: one unit of the chat on screen at a time, in a box at the foot of the chat (style.css, body.rules-box); off, the scrolling chat.
// boxUnit: what a box holds: 'voice', a stretch of text with one value of [±voiced] (quoted words, or the text between them);
// 'message', a whole message.
// boxPicture: 'none', the speaker as the name plate only; 'large', also their picture, large, above the box.
// boxLook: 'night', the box a dark framed panel under a pink name tag (the player's pick, 2026-11-11); 'page', the page's own look.
// boxVoice: 'natural', keyboardLayout: 'auto', keyboardLayout: 'auto', said words spoken by the recorded voice nearest the speaker's (speech.ts, Piper); 'robotic', in the
// speaker's own computed voice by eSpeak NG; 'blips', a tone a syllable; 'off'.
// boxTyping: a stretch's letters appear one by one at its pace (box.ts revealTimes); off, at once.
// boxAuto: the box moves on by itself once a stretch has been read (box.ts autoWait); the bar's "Auto" sets it.
// musicOn: the song nearest the scene's feelings plays (rules/music.ts); musicVolume 0–1; songs: the player's songs as measured;
// musicAreaNames: the player's names for the areas, by the words an area is first named with (music.ts areaWords).
interface Settings { enabled: boolean; questionPass: boolean; ruleCheck: boolean; structured: boolean; suggest: boolean; distinct: boolean; page: boolean; pageColours: 'light' | 'dark'; box: boolean; boxUnit: 'voice' | 'message'; boxPicture: 'none' | 'large'; boxLook: 'night' | 'page'; boxVoice: 'natural' | 'robotic' | 'blips' | 'off'; keyboardLayout: KeyboardLayout; boxTyping: boolean; boxAuto: boolean; musicOn: boolean; musicVolume: number; songs: SongEntry[]; musicAreaNames: Record<string, string>; profile: string; maxTokens: number; effort: string; holdHinted?: boolean }
const DEFAULTS: Settings = { keyboardLayout: 'auto', enabled: true, questionPass: true, ruleCheck: true, structured: true, suggest: false, distinct: true, page: true, pageColours: 'light', box: true, boxUnit: 'voice', boxPicture: 'none', boxLook: 'night', boxVoice: 'natural', boxTyping: true, boxAuto: false, musicOn: true, musicVolume: 0.6, songs: [], musicAreaNames: {}, profile: '', maxTokens: 0, effort: 'low' };
/** One of the player's songs: its name, where SillyTavern keeps it (user/files), the set it belongs to ('' for none), its measures. */
interface SongEntry { id: string; name: string; path: string; set: string; cues: Cues }

interface Ctx {
    chat: STMessage[]; chatMetadata: Record<string, any>; extensionSettings: Record<string, any>;
    eventSource: { on(e: string, f: (...a: any[]) => unknown): void }; eventTypes: Record<string, string>;
    setExtensionPrompt(key: string, value: string, position: number, depth: number, scan?: boolean, role?: number): void;
    saveSettingsDebounced(): void; getCurrentChatId(): string | undefined; generate(type: string): Promise<unknown>;
    characterId?: number | string; groupId?: string | null; characters: { name: string; data?: { extensions?: Record<string, unknown> } }[];
    writeExtensionField(id: number | string, key: string, value: unknown): Promise<void>;
    saveMetadata(): Promise<void>; POPUP_TYPE: Record<string, number>;
    callGenericPopup(content: string, type: number, value?: string, options?: object): Promise<unknown>;
    renderExtensionTemplateAsync(name: string, template: string): Promise<string>;
    SlashCommand?: { fromProps(p: object): unknown }; SlashCommandParser?: { addCommandObject(c: unknown): void };
    deleteMessage?: (id: number) => Promise<void>; deleteLastMessage?: () => Promise<void>; saveChat?: () => Promise<void>;
}
const ctx = () => SillyTavern.getContext() as unknown as Ctx;
const toastr = (globalThis as unknown as { toastr: { warning(t: string, h?: string, o?: object): void; info(t: string, h?: string, o?: object): void } }).toastr;

/** The stored settings, a default filled in for each key the store lacks. The store's own object is returned, so a value set
 * on it stays (a new object on each call lost a write whose right side read the settings again). */
function settings(): Settings {
    const all = ctx().extensionSettings, s = (all[NAME] ??= {}) as Record<string, unknown>;
    for (const [k, v] of Object.entries(DEFAULTS)) if (!(k in s)) s[k] = Array.isArray(v) ? [...v] : v && typeof v === 'object' ? { ...v } : v;
    if (s.boxVoice === 'speech') s.boxVoice = 'robotic';   // section 63's name for eSpeak
    return s as unknown as Settings;
}

// A connection that refuses the plan's schema (a 400, an unknown field) is asked again without it, and the plan goes back to
// being read from free text for the rest of the session.
const send = async (system: string, user: string, o: { schema?: Record<string, unknown> } = {}) => {
    const s = settings(), base = { profile: s.profile, maxTokens: s.maxTokens, effort: s.effort ?? 'low' };
    if (!o.schema) return sendModel(system, user, base);
    try { return await sendModel(system, user, { ...base, schema: o.schema }); }
    catch (e) {
        // Only a refusal of the schema itself turns it off; a rate limit or a dropped connection is that turn's failure alone
        // (a 429 had turned structured output off for the rest of the session).
        if (!/schema|response_format|guided/i.test(String((e as Error)?.message ?? e))) throw e;
        console.warn('[Rules engine] schema refused; plans read from text from now on:', e); setGuided(false); return sendModel(system, user, base);
    }
};

// Card text shown to the question model, characters per field [ASSUMED]: enough for species, build and training.
const CARD_CHARS = 1500;
/** The player's persona, the character card and the scenario: where species, build and training are written. */
function groupMembers(): { name: string; description?: string; data?: { description?: string } }[] {
    const c = ctx() as unknown as { groupId?: string | null; groups?: { id: string; members: string[] }[]; characters: { name: string; avatar?: string; description?: string; data?: { description?: string } }[] };
    const g = c.groupId ? c.groups?.find(x => x.id === c.groupId) : null;
    return g ? g.members.map(a => c.characters.find(ch => ch.avatar === a)).filter((x): x is NonNullable<typeof x> => !!x) : [];
}
function castBlock(): string {
    const c = ctx() as Ctx & { name1?: string; name2?: string; getCharacterCardFields?: () => Record<string, unknown> };
    const raw = c.getCharacterCardFields?.() ?? {};
    const field = (k: string) => { const v = raw[k]; return String((typeof v === 'function' ? v() : v) ?? '').trim().slice(0, CARD_CHARS); };
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
function getBook(): Entry[] {
    const card = cardOf();
    return ((card ? card.data?.extensions?.rulesWorld : ctx().chatMetadata?.rulesWorld) as Entry[] | undefined) ?? [];
}
async function saveBook(book: Entry[]): Promise<void> {
    const c = ctx(), card = cardOf();
    if (card) await c.writeExtensionField(Number(c.characterId), 'rulesWorld', book);
    else { c.chatMetadata.rulesWorld = book; await c.saveMetadata(); }
    applyWorld(book);
    renderBook();
}

/** Drafts an entry from one line, shows it for editing, and saves what the user approves. The line is read in its words: the
 *  voice marks hidden in it (voice-code.ts) say how a line is spoken, which an entry of the world does not hold. */
async function addEntry(text: string): Promise<string> {
    const line = visible(text);
    let draft: Record<string, unknown> | null = null;
    try { draft = parseEntry(await send(FILL_SYSTEM, `Line: ${line}\nStory setting: ${[storyState(), castBlock()].filter(Boolean).join('\n') || 'not given'}`)); }
    catch (e) { console.warn('[Rules engine] world fill failed:', e); }
    return approveEntry(draft ?? { what: line });
}

/** A person gone from history from `year` on: code draws, once, what becomes of each of their inventions; the user approves. */
async function removePersonEntry(arg: string): Promise<string> {
    // A year sets when the person is gone; without one, they never lived (from their birth year, when Wikidata has it).
    const m = arg.match(/^(.+?)(?:[,;]\s*(-?\d{1,4}))?\s*$/);
    if (!m || !m[1].trim()) return 'Give a name, and a year when they are gone: /world-without Karl Benz, 1880 (no year: they never lived).';
    const name = m[1].trim(), year = m[2] != null ? Number(m[2]) : bornIn(name);
    if (year == null) return `No birth year for "${name}"; give the year: /world-without ${name}, 1880.`;
    const salt = ctx().chatMetadata?.rulesEngine?.salt ?? '';
    const { people, outcomes } = removeWithDescendants(name, year, seededRng(`${salt}:without:${name.toLowerCase()}:${year}`));
    if (!outcomes.length && !people.length) return `No invention or discovery by "${name}" from ${year} on in the lists (Wikipedia's timeline of inventions and a Wikidata export: about 2,400 with a named inventor).`;
    return approveEntry({ what: `${name} gone from ${year}`, kind: 'event', since: year, worldwide: true,
        cause: m[2] != null ? `${name} died before ${year}.` : `${name} never lived.`, reaches: ['daily life'], reflections: [...people, ...outcomes.map(outcomeLine)].slice(0, 15),
        changes: outcomes.map(changeOf) });
}

const changeOf = (o: Outcome) => o.result === 'never made' ? { what: o.what, year: o.year, never: true } : { what: o.what, year: o.year, new_year: o.newYear ?? o.year };
const saltOf = () => ctx().chatMetadata?.rulesEngine?.salt ?? '';

/** An event that removes named people from a year: /world-event The plague of 1665 reaches Cambridge; Isaac Newton; 1665 */
async function eventEntry(arg: string): Promise<string> {
    const [cause, names, y] = arg.split(';').map(x => x.trim());
    const year = Number(y);
    if (!cause || !names || !Number.isFinite(year)) return 'Give the event, the people it removes and the year: /world-event The plague reaches Cambridge; Isaac Newton; 1665';
    const all = names.split(',').map(n => n.trim()).filter(Boolean).map(n => removeWithDescendants(n, year, seededRng(`${saltOf()}:event:${n.toLowerCase()}:${year}`)));
    const people = all.flatMap(r => r.people), outcomes = all.flatMap(r => r.outcomes);
    return approveEntry({ what: cause, kind: 'event', since: year, worldwide: true, cause, reaches: ['daily life'],
        reflections: [...people, ...outcomes.map(outcomeLine)].slice(0, 15).concat(people.length || outcomes.length ? [] : [cause]), changes: outcomes.map(changeOf) });
}

/** An invention made earlier than in real history: /world-earlier telephone, 1850 */
async function earlierEntry(arg: string): Promise<string> {
    const m = arg.match(/^(.+?)[,;]\s*(-?\d{1,4})\s*$/);
    if (!m) return 'Give the invention and the year: /world-earlier telephone, 1850';
    const f = firstYear(m[1].trim());
    if (!f) return `No dated invention matches "${m[1].trim()}".`;
    const r = earlier(f.year, Number(m[2]), seededRng(`${saltOf()}:earlier:${f.label.toLowerCase()}:${m[2]}`));
    toastr.info(`${f.label}: real ${f.year}; a lead of ${f.year - Number(m[2])} years is matched by ${Math.round(r.share * 100)} % of first discoverers; drawn: ${r.year}.`, 'World book');
    return approveEntry({ what: `${f.label} made early`, kind: 'technology', since: r.year, worldwide: true, cause: `An inventor ahead of the field made ${f.label} in ${r.year}.`,
        reaches: ['daily life'], reflections: [`${f.label[0].toUpperCase()}${f.label.slice(1)} exists from ${r.year}.`], changes: [{ what: f.label, year: f.year, new_year: r.year }] });
}

/** Shows an entry for editing until it passes the check or is cancelled; saves it. */
async function approveEntry(draft: Record<string, unknown>): Promise<string> {
    const c = ctx();
    let text = JSON.stringify(draft, null, 1);
    for (;;) {
        const edited = await c.callGenericPopup('<h3>World book entry</h3><small>Edit and press OK to save; Cancel discards it.</small>', c.POPUP_TYPE.INPUT, text, { wide: true, large: true, rows: 18 });
        if (typeof edited !== 'string' || !edited.trim()) return 'World book: nothing saved.';
        let raw: Record<string, unknown>;
        try { raw = JSON.parse(edited); } catch { toastr.warning('Not valid JSON; fix it and press OK.', 'World book'); text = edited; continue; }
        const { entry, errors } = checkEntry(raw);
        if (!entry) { toastr.warning(errors.join('; '), 'World book'); text = edited; continue; }
        await saveBook([...getBook(), entry]);
        return `World book: saved "${entry.what}".`;
    }
}

function renderBook(): void {
    const list = document.getElementById('rules_engine_world_list');
    if (!list) return;
    const book = getBook();
    list.innerHTML = '';
    if (!book.length) { list.textContent = 'No entries: the world is real history.'; return; }
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

function registerWorldCommands(): void {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser) return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-add', helpString: 'Add to this card\'s world book: /world-add orcs in London since the 900s. The model drafts the entry; you edit and approve it.',
        callback: async (_a: unknown, v: unknown) => String(v ?? '').trim() ? addEntry(String(v).trim()) : 'Give a line: /world-add orcs in London since the 900s.',
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-without', helpString: 'A person gone from history from a year on: /world-without Karl Benz, 1880. Each of their inventions after that year is made by another inventor, made later, or never made (drawn once, from the rates of independent invention); you edit and approve the entry.',
        callback: async (_a: unknown, v: unknown) => removePersonEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-event', helpString: 'An event that removes people from a year: /world-event The plague reaches Cambridge; Isaac Newton, Isaac Barrow; 1665. Their children not yet born and their inventions follow as for /world-without.',
        callback: async (_a: unknown, v: unknown) => eventEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-earlier', helpString: 'An invention made earlier than in real history: /world-earlier telephone, 1850. The lead is drawn against how far ahead real first inventors were.',
        callback: async (_a: unknown, v: unknown) => earlierEntry(String(v ?? '')),
    }));
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'world-list', helpString: 'Show this card\'s world book.',
        callback: async () => worldBlock(getBook(), scenePosition()) || 'The world book is empty: the world is real history.',
    }));
}

/** What the question model and the narrator read about the story now: time and bodies. */
function storyState(): string {
    const t = storyTime();
    const here = scenePosition();
    // Sun above the horizon at the scene, for the world book's day and night creatures (a calendar date is needed: a bare
    // "Day N" count has no season).
    const sky = t !== null && here ? sceneSky(t) : null, sunUp = sky ? sky.sunAlt >= 0 : null;
    return [worldBlock(getBook(), here, sunUp), t === null ? '' : `[TIME]\n${formatStoryTime(t)}\n[/TIME]`, bodyBlock(trackedPeople()), possessionsInjection()].filter(Boolean).join('\n');
}

(globalThis as Record<string, unknown>).rulesEngineInterceptor = async (chat: STMessage[], _size: number, abort: unknown, type: string) => {
    const s = settings(), c = ctx();
    c.setExtensionPrompt(KEY, '', IN_CHAT, DEPTH);
    if (!s.enabled) return;
    // The player's hidden voice marks become the notation the model reads (voice-code.ts); the engine reads their codes, and
    // the chat as saved keeps them hidden (SillyTavern hands interceptors copies of its messages).
    notateChat(chat);
    if (!c.chatMetadata || ['quiet', 'impersonate'].includes(type)) return;
    // The chat this turn belongs to: opening another chat while the pass waits on the model or the player ends the turn.
    const meta = c.chatMetadata, moved = () => ctx().chatMetadata !== meta;
    // Each tracked adult's resting voice is a simulation run (voice-sound.ts), started when the chat opened; the notes wait
    // for the runs still going, so the narrator reads every pitch.
    await voicesReady(trackedPeople());
    if (moved()) return;
    if (s.questionPass && type !== 'continue') {
        try {
            const read = await runQuestionPass(chat, send, [storyState(), castBlock()].filter(Boolean).join('\n'), choose, ask);
            if (moved()) { if (typeof abort === 'function') abort(true); return; }
            // The player closed a question to say it another way: the reply waits for their next line (a toast confirms what
            // they just did).
            if (rephraseAsked()) { takeBack(); toastr.info('Your line is back in the box: say it another way.', 'Your line'); if (typeof abort === 'function') abort(true); return; }
            // What the engine took from the player's line goes under that line and stays (src/ui.ts): a correction it redid,
            // a reading taken unasked with its change, one line per call for their character (reading.ts), the things read.
            keepNote({ redone: redoneBy(), taken: takenReading(), meant: meantReading(), voice: voiceRead(), acts: actionItems(), things: read.map(r => `${r.phrase} → ${r.label}${r.year != null ? ` (${r.year})` : ''}`) });
        } catch (e) { console.warn('[Rules engine] question pass skipped:', e); }
        if (moved()) { if (typeof abort === 'function') abort(true); return; }
    }
    // Suggestions: for a world that departs far from real history, the engine's outcomes are offered, and the story and the
    // world book decide; the rule check then redoes nothing and the reply is free prose.
    const suggest = settings().suggest;
    const decided = suggest ? decidedInjection().replace(/Narrate them as given; they stand\./, SUGGEST_LINE) : decidedInjection();
    // While the box is on, the narrator names the speaker before each quotation (box.ts SPEAKER_RULE), for the box's plate.
    // How closely the reply follows the player's line: its knob's stop (faith.ts).
    const line = [...(c.chat ?? [])].reverse().find(m => m.is_user), follow = line ? faithLine(faithOf(line.extra?.rulesFaith), playerName()) : '';
    const parts = [!questionPassRan() ? rulesBrief() : suggest ? SUGGEST_BRIEF : RULES_BRIEF_DECIDED, storyState(), knowledgeInjection(), decided, follow, takeAuditNote() ?? '', structuredNow() ? NARRATION_RULE : '', boxOn() ? SPEAKER_RULE : ''];
    // The narrator's prompt carries no hidden tag character (voice-code.ts untagged).
    c.setExtensionPrompt(KEY, untagged(parts.filter(Boolean).join('\n\n')), IN_CHAT, DEPTH, false, SYSTEM);
};

// A question's popup (src/ui.ts askPopup): one sentence with every choice linked alike, numbered, nothing chosen or focused in
// advance, in the story's period type; "Say it another way", closing it or Escape means "none of these".
const reducedMotion = () => { try { return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; } catch { return false; } };
async function pick(q: Parameters<typeof askPopup>[0]): Promise<number | null> {
    const c = ctx(), p = askPopup(q, { era: eraOf(storyYearNow()), reduced: reducedMotion() });
    return askAnswer(await c.callGenericPopup(p.content, c.POPUP_TYPE.TEXT, '', p.options), q.choices.length);
}

// Two things fit the player's word equally: the player says which (a guess would change what the scene can hold).
const choose: Chooser = async (phrase, [a, b]) => {
    const say = (o: typeof a) => `${o.label}${o.year != null ? ` (${o.year})` : ''}`, short = (t: string) => t.length > 70 ? `${t.slice(0, 69).trimEnd()}…` : t;
    const i = await pick({ said: phrase, choices: [say(a), say(b)], notes: [short(a.description), short(b.description)], things: true });
    return i === 0 ? a.id : i === 1 ? b.id : null;
};

// A choice the player's line leaves open (ask.ts): the player picks one of its readings.
const ask: Asker = async (question, options) => {
    const i = await pick({ said: saidOf(question), choices: options });
    return i == null ? null : options[i]!;
};

// The reading note (src/ui.ts) is kept on the player's message (extra.rulesReading) and drawn under it whenever the chat is
// drawn; "change" is offered on the player's latest line only, the one a correction can redo.
// The line the player chose to say another way leaves the chat and returns to the input box, marks and all, once the
// generation it started has stopped: the next line stands in its place, so the narrator and the engine read the same line.
function takeBack(): void {
    const c = ctx(), back = lineToTakeBack(c.chat ?? []);
    if (!back) return;
    const msg = c.chat[back.index];
    setTimeout(async () => {
        if (ctx().chat?.[back.index] !== msg) return;
        if (c.deleteMessage) await c.deleteMessage(back.index);
        else if (c.deleteLastMessage) { await c.deleteLastMessage(); await c.saveChat?.(); }
        else return;
        fillInput(back.text);
    }, 0);
}
function lastUserIndex(): number { const chat = ctx().chat ?? []; for (let i = chat.length - 1; i >= 0; i--) if (chat[i]?.is_user) return i; return -1; }
// Written while the reply is generated; SillyTavern saves the chat, the note with it, when the reply arrives.
function keepNote(note: ReadingNote): void {
    const msg = ctx().chat?.[lastUserIndex()];
    if (!msg) return;
    msg.extra ??= {};
    if (noteView(note, true)) (msg.extra as Record<string, unknown>)[NOTE_KEY] = { ...note, line: String(msg.mes ?? '') };
    else delete (msg.extra as Record<string, unknown>)[NOTE_KEY];
    drawNotes();
}
function fillInput(text: string): void {
    const box = document.getElementById('send_textarea') as HTMLTextAreaElement | null;
    if (!box) return;
    box.value = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.focus();
    box.setSelectionRange(text.length, text.length);
}
function drawNotes(): void {
    if (typeof document === 'undefined') return;
    document.querySelectorAll('#chat .rules-reading, #chat .rules-modes, #chat .rules-faith-mark').forEach(e => e.remove());
    if (!settings().enabled) return;
    // The story's era sets the type; the tone of what the text stands on, light or dark, sets the share each kind's colour takes.
    const look = { era: eraOf(storyYearNow()), tone: toneNow() };
    for (const { index, view } of notesOf(ctx().chat ?? [])) {
        const at = document.querySelector(`#chat .mes[mesid="${index}"] .mes_text`);
        if (at) at.after(drawNote(document as unknown as Doc, view, look, fillInput) as unknown as Node);
    }
    // The name plate of each player's line: after the name, what the character is doing in it (ui.ts modesOf).
    for (const { index, modes } of platesOf(ctx().chat ?? [])) {
        document.querySelector(`#chat .mes[mesid="${index}"] .name_text`)?.after(drawModes(document as unknown as Doc, modes) as unknown as Node);
    }
    // A line sent off 1.0 keeps a mark of its knob's stop after the name.
    (ctx().chat ?? []).forEach((m, i) => {
        const f = faithOf(m.is_user ? m.extra?.rulesFaith : 1);
        if (f === 1) return;
        const mark = document.createElement('span'); mark.className = 'rules-faith-mark'; mark.textContent = `${f.toFixed(1)} · ${FAITH_NAME[f]}`; mark.title = FAITH_SAYS[f];
        document.querySelector(`#chat .mes[mesid="${i}"] .name_text`)?.after(mark);
    });
}

// How closely the story follows the line about to be sent (the player's pick, 2026-11-13; rules/faith.ts): a knob by the message
// box with five stops. A tap turns it one stop on (past 2.0 round to 0), a drag up or down turns it, the wheel and the arrow
// keys too (a slider, WAI-ARIA Authoring Practices); the line sent keeps its stop and the knob comes back to 1.0.
let faithNow: Faith = 1;
/** The knob drawn at the stop: its notch from −100° (0) to +100° (2.0), its number beside it off 1.0, its title the stop's sentence. */
function drawFaithKnob(): void {
    const k = document.getElementById('rules-faith');
    if (!k) return;
    const turn = -100 + 200 * FAITH_STOPS.indexOf(faithNow) / (FAITH_STOPS.length - 1);
    k.querySelector('line')?.setAttribute('transform', `rotate(${turn} 13 13)`);
    k.setAttribute('data-faith', String(faithNow)); k.setAttribute('aria-valuenow', String(faithNow));
    k.setAttribute('aria-valuetext', `${faithNow.toFixed(1)}: ${FAITH_NAME[faithNow]}`); k.title = `How closely the story follows this line: ${faithNow.toFixed(1)}, ${FAITH_NAME[faithNow]}. ${FAITH_SAYS[faithNow]}`;
}
function buildFaithKnob(form: Element): void {
    if (document.getElementById('rules-faith')) return;
    const k = document.createElement('div');
    k.id = 'rules-faith'; k.tabIndex = 0; k.setAttribute('role', 'slider'); k.setAttribute('aria-label', 'How closely the story follows this line');
    k.setAttribute('aria-valuemin', '0'); k.setAttribute('aria-valuemax', '2');
    k.innerHTML = '<svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true"><circle cx="13" cy="13" r="11" fill="none" stroke="currentColor" stroke-width="2"/><line x1="13" y1="13" x2="13" y2="5" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    const set = (f: Faith) => { faithNow = f; drawFaithKnob(); };
    let drag: { y: number; from: Faith; moved: boolean } | null = null;
    k.addEventListener('pointerdown', e => { drag = { y: e.clientY, from: faithNow, moved: false }; k.setPointerCapture?.(e.pointerId); });
    k.addEventListener('pointermove', e => {
        if (!drag) return;
        const steps = Math.trunc((drag.y - e.clientY) / 18);
        if (steps) { drag.moved = true; set(FAITH_STOPS[Math.max(0, Math.min(FAITH_STOPS.length - 1, FAITH_STOPS.indexOf(drag.from) + steps))]!); }
    });
    k.addEventListener('pointerup', () => { if (drag && !drag.moved) set(nextFaith(faithNow)); drag = null; });
    k.addEventListener('pointercancel', () => { drag = null; });
    k.addEventListener('wheel', e => { e.preventDefault(); const i = FAITH_STOPS.indexOf(faithNow) + (e.deltaY < 0 ? 1 : -1); set(FAITH_STOPS[Math.max(0, Math.min(FAITH_STOPS.length - 1, i))]!); }, { passive: false });
    k.addEventListener('keydown', e => {
        const i = FAITH_STOPS.indexOf(faithNow), last = FAITH_STOPS.length - 1;
        const to = e.key === 'ArrowUp' || e.key === 'ArrowRight' ? Math.min(last, i + 1) : e.key === 'ArrowDown' || e.key === 'ArrowLeft' ? Math.max(0, i - 1) : e.key === 'Home' ? 0 : e.key === 'End' ? last : e.key === 'Enter' || e.key === ' ' ? (i + 1) % FAITH_STOPS.length : null;
        if (to != null) { e.preventDefault(); set(FAITH_STOPS[to]!); }
    });
    (document.getElementById('leftSendForm') ?? form).appendChild(k);
    drawFaithKnob();
}
/** The line just sent keeps the knob's stop, and the knob comes back to 1.0. */
function keepFaith(id: unknown): void {
    const msg = ctx().chat?.[Number(id)];
    if (!msg?.is_user) return;
    if (faithNow !== 1) (msg.extra ??= {}).rulesFaith = faithNow;
    faithNow = 1; drawFaithKnob();
}

// How a line is said, marked without signs (src/rules/voice-code.ts, src/ui.ts): select words in the message box and a toolbar
// of plain words appears above it (the ♪ button by the box opens it for the word at the cursor); a pick marks the words with
// hidden codes, and a layer over the box underlines marked words in their group's soft colour. Sent, the line is typeset
// in the chat the way it sounds; before a model reads the chat, the codes become the notation the engine reads.
function buildVoice(): void {
    const form = document.getElementById('send_form'), box = document.getElementById('send_textarea') as HTMLTextAreaElement | null;
    if (!form || !box || document.getElementById('rules-voice')) return;
    let pinned = false;
    const bar = document.createElement('div');
    bar.id = 'rules-voice'; bar.hidden = true;
    bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'How the selected words are said');
    const edit = (r: { from: number; to: number; insert: string; selStart: number; selEnd: number } | null) => {
        box.focus();
        if (!r) return;
        box.setSelectionRange(r.from, r.to);
        // insertText keeps the box's own undo (Ctrl+Z); setRangeText where a browser lacks it.
        if (!document.execCommand?.('insertText', false, r.insert)) box.setRangeText(r.insert, r.from, r.to, 'end');
        box.setSelectionRange(r.selStart, r.selEnd);
        box.dispatchEvent(new Event('input', { bubbles: true }));
    };
    for (const g of VOICE_GROUPS) {
        const group = document.createElement('span');
        group.className = `rules-voice-group rules-hl-${g.family}`;
        const name = document.createElement('span'); name.className = 'rules-voice-name'; name.textContent = g.group; group.appendChild(name);
        for (const item of g.items) {
            const b = document.createElement('button');
            b.type = 'button'; b.className = 'rules-voice-btn';
            const label = document.createElement('span'); label.className = item.mark ? `rules-v rules-v-${item.mark}` : 'rules-v'; label.textContent = item.label;
            // Set as the chat sets them (ui.ts drawVoice): a pitch mark's curve, a stressed word's IPA stress mark, a drawn-out
            // vowel written again, a feeling in its colour.
            if (item.mark === 'up' || item.mark === 'down') label.setAttribute('data-pitch', item.mark);
            if (item.mark === 'stress') { const tick = document.createElement('span'); tick.className = 'rules-v-add rules-v-add-tick'; tick.textContent = 'ˈ'; b.appendChild(tick); }
            const held = item.mark === 'stretch' ? heldParts(item.label.split(' ')[0]!) : null;
            if (held) { const again = document.createElement('span'); again.className = 'rules-v-add rules-v-add-held'; again.textContent = held.again; label.replaceChildren(held.head, again, `${held.tail}${item.label.slice(item.label.indexOf(' '))}`); }
            if (item.id.startsWith('feeling:')) { label.classList.add('rules-v-feel'); label.setAttribute('data-feeling', item.id.slice(8)); }
            if (item.mark && RUN_MARKS.includes(item.mark)) label.classList.add('rules-run', `rules-run-${item.mark}`);
            b.appendChild(label); b.title = `${g.group}: ${item.label}`;
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
    note.id = 'rules-voice-open'; note.className = 'fa-solid fa-music interactable'; note.title = 'How your line is said'; note.tabIndex = 0;
    note.setAttribute('role', 'button'); note.setAttribute('aria-pressed', 'false');
    const toggle = () => { pinned = !pinned; show(); box.focus(); };
    note.addEventListener('mousedown', e => e.preventDefault());
    note.addEventListener('click', toggle);
    // Enter and Space press it from the keyboard, as a button (WAI-ARIA Authoring Practices, Button pattern).
    note.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
    (document.getElementById('leftSendForm') ?? form).appendChild(note);
    buildFaithKnob(form);
    // Open while words are selected in the box, while the toolbar holds the focus (Tab from the box), or pinned by ♪.
    const show = () => { const focus = document.activeElement, sel = (focus === box || bar.contains(focus)) && box.selectionStart !== box.selectionEnd; bar.hidden = !(pinned || sel) || !settings().enabled; note.classList.toggle('rules-voice-on', pinned); note.setAttribute('aria-pressed', String(pinned)); };
    document.addEventListener('selectionchange', show);
    // Tab from the box enters the toolbar while it shows: the toolbar stands before the form, so the page's focus order passes it.
    box.addEventListener('keydown', e => { if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !bar.hidden) { e.preventDefault(); bar.querySelector('button')?.focus(); } });
    box.addEventListener('keyup', show); box.addEventListener('mouseup', show); box.addEventListener('blur', () => setTimeout(show, 0)); bar.addEventListener('focusout', () => setTimeout(show, 0));
    // Backspace and Delete take a marked letter as one character (the browser alone takes one invisible code at a time).
    document.addEventListener('keydown', e => {
        const t = e.target as HTMLTextAreaElement | null;
        if (!(t instanceof HTMLTextAreaElement) || (t !== box && !t.classList.contains('edit_textarea')) || (e.key !== 'Backspace' && e.key !== 'Delete') || t.selectionStart !== t.selectionEnd || e.ctrlKey || e.altKey || e.metaKey) return;
        const r = keyDelete(t.value, t.selectionStart, e.key === 'Backspace');
        if (!r) return;
        e.preventDefault();
        t.setSelectionRange(r.from, r.to);
        const done = r.insert ? document.execCommand?.('insertText', false, r.insert) : document.execCommand?.('delete');
        if (!done) { t.setRangeText(r.insert, r.from, r.to, 'end'); t.dispatchEvent(new Event('input', { bubbles: true })); }
    }, true);
    // The layer over the box: the same text, invisible, in the same type and place, marked words underlined; clicks pass through.
    const layer = document.createElement('div');
    layer.id = 'rules-voice-layer'; layer.setAttribute('aria-hidden', 'true');
    form.classList.add('rules-voice-form');
    form.appendChild(layer);
    const COPY = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'tabSize', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderLeftWidth'] as const;
    const paint = () => {
        const v = box.value;
        if (!hasHidden(v)) { layer.replaceChildren(); layer.hidden = true; return; }
        layer.hidden = false;
        const cs = getComputedStyle(box);
        for (const k of COPY) (layer.style as unknown as Record<string, string>)[k] = cs[k];
        layer.style.left = `${box.offsetLeft + box.clientLeft}px`; layer.style.top = `${box.offsetTop + box.clientTop}px`;
        layer.style.width = `${box.clientWidth}px`; layer.style.height = `${box.clientHeight}px`;
        layer.replaceChildren(...mirrorParts(v).map(p => { if (!p.family) return document.createTextNode(p.text); const s = document.createElement('span'); s.className = `rules-hl rules-hl-${p.family}`; s.textContent = p.text; return s; }));
        layer.scrollTop = box.scrollTop;
    };
    box.addEventListener('input', paint); box.addEventListener('scroll', () => { layer.scrollTop = box.scrollTop; });
    new ResizeObserver(paint).observe(box);
    paint();
}

/** The player's sent lines typeset the way they sound: each text node holding hidden marks in a player's message is rewritten
 * as the words with their marks' classes (src/ui.ts drawVoice); done again whenever the message is drawn. */
function typesetChat(): void {
    if (typeof document === 'undefined' || !settings().enabled) return;
    for (const mes of document.querySelectorAll('#chat .mes[is_user="true"] .mes_text')) {
        const walk = document.createTreeWalker(mes, NodeFilter.SHOW_TEXT), nodes: Text[] = [];
        for (let n = walk.nextNode(); n; n = walk.nextNode()) if (hasHidden(n.nodeValue ?? '')) nodes.push(n as Text);
        for (const n of nodes) n.replaceWith(...drawVoice(document as unknown as Doc, n.nodeValue ?? '') as unknown as Node[]);
        // The line's feeling tints the whole message in the multiple-distinctions look (style.css).
        const f = mes.querySelector('.rules-v-add-feeling[data-feeling]')?.getAttribute('data-feeling');
        if (f) mes.setAttribute('data-rules-feeling', f); else mes.removeAttribute('data-rules-feeling');
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
let boxAt: { mes: string; unit: number } | null = null, boxLog = false;
const boxOn = () => settings().enabled && settings().box;
const unitsIn = (mes: Element) => settings().boxUnit === 'message' ? [] : [...mes.querySelectorAll('.mes_text .rules-unit')];
const playerName = () => String((ctx() as Ctx & { name1?: string }).name1 || 'You');
/** The cast by name: the player's character, the character of a one-to-one chat and a group's members. */
const castNames = () => { const c = ctx() as Ctx & { name1?: string; name2?: string }; return [c.name1, c.name2, ...groupMembers().map(m => m.name)].filter((n): n is string => !!n); };
/** Each drawn message's text in units: a quoted stretch, the text between two of them, or a block that is no paragraph (a
 * list, a table, a block quotation) as one; each unit carries the one it belongs to (data-who). Done once per drawing of a
 * message: SillyTavern redraws its text whole. */
function unitChat(): void {
    const all = [...document.querySelectorAll('#chat .mes')];
    all.forEach((mes, at) => {
        const text = mes.querySelector('.mes_text');
        if (!text || text.querySelector('.rules-unit, .edit_textarea')) return;
        const msg = ctx().chat?.[Number(mes.getAttribute('mesid'))] as STMessage | undefined;
        // The names the reply wrote before its quotations (readReply), matched to the quotations by their words, in order.
        const tags = [...((msg?.extra?.rulesSpeakers as Record<number, { q: string; who: string }[]> | undefined)?.[msg?.swipe_id ?? 0] ?? [])];
        const bare = (t: string) => t.replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
        const paragraphs: { span: Element; s: Stretch }[][] = [];
        for (const block of [...text.children]) {
            if (block.tagName !== 'P') { block.classList.add('rules-unit'); block.setAttribute('data-said', 'false'); paragraphs.push([{ span: block, s: { said: false, text: block.textContent ?? '' } }]); continue; }
            const nodes = [...block.childNodes], para: { span: Element; s: Stretch }[] = [];
            for (const u of voiceUnits(nodes.map(n => ({ said: n.nodeName === 'Q', text: n.textContent ?? '' })))) {
                const span = document.createElement('span');
                span.className = 'rules-unit'; span.setAttribute('data-said', String(u.said));
                nodes[u.from]!.before(span);
                for (let i = u.from; i < u.to; i++) span.appendChild(nodes[i]!);
                const words = span.textContent ?? '', t = u.said ? tags.findIndex(x => bare(x.q) === bare(words)) : -1;
                para.push({ span, s: { said: u.said, text: words, tag: t >= 0 ? tags.splice(t, 1)[0]!.who : null } });
            }
            paragraphs.push(para);
        }
        // The people the message before named, for a pronoun at this one's start.
        const named = all[at - 1] ? [...all[at - 1]!.querySelectorAll('.rules-unit[data-who]')].map(e => e.getAttribute('data-who') ?? '').filter(n => n && n !== playerName()) : [];
        const author = msg?.is_user ? playerName() : mes.getAttribute('ch_name') || mes.querySelector('.name_text')?.textContent || '';
        const who = speakersOf(paragraphs.map(p => p.map(x => x.s)), { player: playerName(), author, names: castNames() }, named);
        paragraphs.forEach((p, i) => p.forEach((x, j) => x.span.setAttribute('data-who', who[i]![j]!)));
    });
}
/** A unit longer than the box goes on in the next box, cut after a sentence's end (box.ts cutsOf): measured in the message's
 * own type and width once it is drawn, at boxLines lines. Done once per unit (data-fit); a piece keeps its unit's voice and speaker. */
/** The box's lines at its type size (applyLook). */
let boxLinesNow = peek('boxLines');
function fitUnits(mes: Element): void {
    const text = mes.querySelector('.mes_text') as HTMLElement | null;
    const units = [...mes.querySelectorAll('.mes_text span.rules-unit:not([data-fit])')];
    if (!text || !units.length || !text.clientWidth) return;
    const probe = document.createElement('div');
    probe.style.cssText = `position: absolute; visibility: hidden; width: ${text.clientWidth}px; white-space: normal;`;
    text.appendChild(probe);
    const lh = parseFloat(getComputedStyle(probe).lineHeight) || 1;
    for (const unit of units) {
        unit.setAttribute('data-fit', '');
        const words = unit.textContent ?? '';
        probe.textContent = words;
        const lines = Math.round(probe.getBoundingClientRect().height / lh);
        if (lines <= boxLinesNow) continue;
        // The characters that fill the box, in proportion to the lines this unit takes.
        const cuts = cutsOf(words, Math.floor(words.length * boxLinesNow / lines));
        for (const cut of cuts.reverse()) {
            const walk = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
            let seen = 0, at: Text | null = null;
            for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) { if (seen + n.length >= cut) { at = n; break; } seen += n.length; }
            if (!at) continue;
            const r = document.createRange();
            r.setStart(at, cut - seen); r.setEnd(unit, unit.childNodes.length);
            const piece = unit.cloneNode(false) as Element;
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
let typing: { unit: Element; raf: number; total: number } | null = null, autoTimer: ReturnType<typeof setTimeout> | undefined, shownKey = '', stepDir: 1 | -1 | 0 = 0, figureSrc: string | null = null;
const UNSHOWN = 'rules-unshown';
const highlights = () => (globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights;
// The voice blips (blips.ts): one tone per syllable of a said stretch as it appears, in the speaker's own voice, while the
// music is on (the bar's ♪), under it (blipLevel × its volume). A periodic wave per voice holds its harmonics.
let blipCtx: AudioContext | null = null, blipNodes: OscillatorNode[] = [];
const blipWaves = new Map<string, PeriodicWave>();
function stopBlips(): void { for (const o of blipNodes) { try { o.stop(); } catch { /* already stopped */ } } blipNodes = []; }
function playBlips(unit: Element, text: string, times: number[]): void {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'blips' || unit.getAttribute('data-said') !== 'true' || !p || unit.querySelector('.rules-v-whisper, .rules-run-whisper')) return;
    const h = voiceHarmonics(speakingFactsOf(p));
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!h || !AC) return;
    blipCtx ??= new AC();
    const ac = blipCtx, key = `${h.f0}:${h.amps.join(',')}`;
    let wave = blipWaves.get(key);
    if (!wave) { wave = ac.createPeriodicWave(new Float32Array(h.amps.length + 1), Float32Array.from([0, ...h.amps])); blipWaves.set(key, wave); }
    const level = settings().musicVolume * peek('blipLevel'), t0 = ac.currentTime + 0.02;
    for (const b of blipPlan(text, times)) {
        const o = ac.createOscillator(), g = ac.createGain(), at = t0 + b.at / 1000, end = at + Math.max(2 * BLIP_RAMP_S, b.dur / 1000);
        o.setPeriodicWave(wave); o.frequency.value = h.f0;
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(level, at + BLIP_RAMP_S); g.gain.setValueAtTime(level, end - BLIP_RAMP_S); g.gain.linearRampToValueAtTime(0, end);
        o.connect(g).connect(ac.destination); o.start(at); o.stop(end + 0.01);
        blipNodes.push(o);
    }
}
// The full voice (speech.ts): eSpeak NG (lib/espeak-ng, English only, 1.7 MB) loaded on first use; a said stretch is spoken
// in the speaker's own voice and its letters appear as its words are heard. Until it has loaded, blips stand in.
type SpeechWorker = { set_voice(name: string): unknown; set_rate(wpm: number): unknown; get_samplerate(): number; synthesize(text: string, cb: (samples: Int16Array | null, events: { type: string; text_position: number; audio_position: number }[] | null) => void): unknown };
type SpeechModule = { FS: { writeFile(path: string, data: string): void }; eSpeakNGWorker: new () => SpeechWorker };
let speechLoad: Promise<SpeechModule> | null = null, speechMod: SpeechModule | null = null, speechWorker: SpeechWorker | null = null, speechSource: AudioBufferSourceNode | null = null;
function loadSpeech(): Promise<SpeechModule> {
    const at = (p: string) => new URL(`../lib/espeak-ng/${p}`, import.meta.url).href;
    speechLoad ??= (import(at('espeak-ng.js')) as Promise<{ default: (o: object) => Promise<SpeechModule> }>).then(x => x.default({ locateFile: at }))
        .then(m => { speechMod = m; speechWorker = new m.eSpeakNGWorker(); return m; })
        .catch(err => { console.warn('[Rules engine] the voice could not load:', err); speechLoad = null; throw err; });
    return speechLoad;
}
function stopSpeech(): void { try { speechSource?.stop(); } catch { /* already stopped */ } speechSource = null; }
/** Speaks a said stretch in its speaker's voice and gives when each letter appears, or null (no voice, not loaded, off). */
function speakUnit(unit: Element, text: string): number[] | null {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'robotic' || unit.getAttribute('data-said') !== 'true' || !p) return null;
    if (!speechMod || !speechWorker) { void loadSpeech().catch(() => undefined); return null; }
    const v = voiceOf(speakingFactsOf(p));
    if (!v.f0Hz || !v.tractCm) return null;
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!AC) return null;
    const sv = speechVoice(v.f0Hz, v.tractCm, v.sylPerS, !!unit.querySelector('.rules-v-whisper, .rules-run-whisper')), name = `rules-${sv.base}-${sv.formantPct}-${sv.whisper ? 'w' : 'v'}`;
    speechMod.FS.writeFile(`/usr/share/espeak-ng-data/voices/!v/${name}`, speechVoiceFile(name, sv));
    speechWorker.set_voice(`en-us+${name}`); speechWorker.set_rate(sv.wpm);
    const chunks: Int16Array[] = [], words: [number, number][] = [];
    speechWorker.synthesize(text, (samples, events) => { if (samples?.length) chunks.push(Int16Array.from(samples)); for (const e of events ?? []) if (e.type === 'word') words.push([e.text_position, e.audio_position]); });
    const fs = speechWorker.get_samplerate(), n = chunks.reduce((sum, c) => sum + c.length, 0);
    if (!n) return null;
    blipCtx ??= new AC();
    const buf = blipCtx.createBuffer(1, n, fs), data = buf.getChannelData(0);
    let o = 0;
    for (const c of chunks) for (let i = 0; i < c.length; i++) data[o++] = c[i]! / 32768;
    const src = blipCtx.createBufferSource(), g = blipCtx.createGain();
    src.buffer = buf; g.gain.value = settings().musicVolume;
    src.connect(g).connect(blipCtx.destination); src.start(); speechSource = src;
    return speechTimes(text, words, 1000 * n / fs);
}
// The natural voice (rules/pocket.ts, rules/averaged-person.ts): Pocket TTS's networks, downloaded once from Hugging Face (165
// MB) and kept in the browser's IndexedDB, run by onnxruntime-web (jsDelivr) in a worker (voice-worker.ts); each speaker's
// voice is the averaged person (voices/averaged-person.bin, sent to the player apart from the repository: CC BY-NC) spoken with
// the body's pitch, tract and pace, made and encoded once per body and its encoding kept. Each said stretch is made once, ahead,
// as its message is shown; the box waits for a stretch still being made.
const ORT_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';
let voiceWorker: Worker | null = null, voiceLoad: Promise<void> | null = null, voiceJobId = 0, voiceWait: Element | null = null;
const voiceJobs = new Map<number, (m: { audio?: Float32Array; embedding?: Float32Array; error?: string }) => void>(), voiceCache = new Map<string, Promise<Float32Array | null>>(), voiceDone = new Map<string, Float32Array | null>(), voicesMade = new Map<string, Promise<void>>();
/** The model kept in the browser's IndexedDB (the Cache API exists only on https and localhost pages; SillyTavern is often
 * opened over plain http on a home network): read it (no `put`), or store it. Null when it is not kept or storage fails. */
function storedModel(url: string, put?: ArrayBuffer): Promise<ArrayBuffer | null> {
    return new Promise(done => {
        try {
            const open = indexedDB.open('rules-engine-voices', 1);
            open.onupgradeneeded = () => open.result.createObjectStore('models');
            open.onerror = () => done(null);
            open.onsuccess = () => {
                const db = open.result, tx = db.transaction('models', put ? 'readwrite' : 'readonly'), store = tx.objectStore('models');
                const req = put ? store.put(put, url) : store.get(url);
                req.onsuccess = () => { db.close(); done(put ? put : (req.result as ArrayBuffer | undefined) ?? null); };
                req.onerror = () => { db.close(); done(null); };
            };
        } catch { done(null); }
    });
}
const toast = (m: string) => (globalThis as unknown as { toastr?: { info(m: string): void } }).toastr?.info(m);
const askWorker = (m: Record<string, unknown>, transfer: Transferable[] = []) => new Promise<{ audio?: Float32Array; embedding?: Float32Array; error?: string }>(ok => {
    const id = ++voiceJobId; voiceJobs.set(id, ok); voiceWorker!.postMessage({ ...m, id }, transfer);
});
function loadNatural(): Promise<void> {
    voiceLoad ??= (async () => {
        const files: Record<string, ArrayBuffer> = {};
        for (const f of POCKET_MODEL.files) {
            const url = POCKET_MODEL.base + f;
            let buf = await storedModel(url);
            if (!buf) {
                if (f === POCKET_MODEL.files[0]) toast(`Downloading the voices once (${POCKET_MODEL.megabytes} MB)…`);
                const res = await fetch(url);
                if (!res.ok) throw new Error(`the voices' download answered ${res.status}`);
                buf = await res.arrayBuffer();
                await storedModel(url, buf);
            }
            files[f] = buf;
        }
        const bundle = JSON.parse(new TextDecoder().decode(files['bundle.json'])) as { flow_lm_state_manifest: { input_name: string; output_name: string; shape: number[] }[] };
        freeCacheLength(new Uint8Array(files['flow_lm_main_int8.onnx']!), bundle.flow_lm_state_manifest.filter(e => e.shape.includes(1000)).flatMap(e => [e.input_name, e.output_name]));
        voiceWorker = new Worker(new URL('./voice-worker.js', import.meta.url), { type: 'module' });
        await new Promise<void>((ok, bad) => {
            voiceWorker!.onmessage = e => {
                const m = e.data as { type: string; id?: number; audio?: Float32Array; embedding?: Float32Array; error?: string };
                if (m.type === 'loaded') ok(); else if (m.type === 'error') bad(new Error(m.error));
                else { voiceJobs.get(m.id!)?.(m); voiceJobs.delete(m.id!); }
            };
            voiceWorker!.postMessage({ type: 'load', ortUrl: ORT_URL, files }, Object.values(files));
        });
        // The averaged person, from the extension's folder (not in the repository: the player keeps the file they were sent).
        const res = await fetch(new URL('../voices/averaged-person.bin', import.meta.url));
        if (!res.ok) { toast('The natural voice needs voices/averaged-person.bin in the extension folder.'); throw new Error(`averaged-person.bin: ${res.status}`); }
        const buffer = await res.arrayBuffer(), r = await askWorker({ type: 'person', buffer }, [buffer]);
        if (r.error) throw new Error(r.error);
        // The five vocal families' files (voices/emotion-<family>.bin), where the player has them: a feeling is heard only then.
        for (const family of FAMILIES) {
            const er = await fetch(new URL(`../voices/emotion-${family}.bin`, import.meta.url)).catch(() => null);
            if (!er?.ok) continue;
            const eb = await er.arrayBuffer(), ok = await askWorker({ type: 'person', buffer: eb, family }, [eb]);
            if (!ok.error) emotionFiles.add(family);
        }
    })().catch(err => { console.warn('[Rules engine] the natural voice could not load:', err); voiceLoad = null; throw err; });
    return voiceLoad;
}
const FAMILIES = ['anger', 'fear', 'happiness', 'sadness', 'tenderness'] as const, emotionFiles = new Set<string>();
/** The feeling a said stretch is spoken with: a feeling the narrator's voice mark names in it (prosody.ts, data-feeling), at
 * full strength; else the speaker's newest feeling still running (Appraise), its OCC type heard as its vocal family
 * (emotion.ts VOCAL_FAMILY) at its strength (0.5 when an older save kept none); none where the family's file is missing. */
function feelingOf(unit: Element, p: Person): { family: string; w: number } | null {
    const marked = unit.querySelector('[data-feeling]')?.getAttribute('data-feeling');
    if (marked && emotionFiles.has(marked)) return { family: marked, w: 1 };
    const f = [...(p.feelings ?? [])].filter(x => x.left > 0).sort((a, b) => (b.turn ?? 0) - (a.turn ?? 0))[0];
    const family = f ? VOCAL_FAMILY[f.type] : undefined;
    return family && emotionFiles.has(family) ? { family, w: f!.strength ?? peek('voiceFeelingTouched') } : null;
}
/** A body's voice in the worker: the averaged person spoken with the body's causes (and a feeling, where one is heard), encoded;
 * the encoding kept in IndexedDB. */
function makeBodyVoice(voice: string, body: { f0: number; tractCm: number; sylPerS: number; span?: number; pause?: number; breathDb?: number }, emotion: { family: string; w: number } | null = null): Promise<void> {
    let made = voicesMade.get(voice);
    if (!made) {
        made = (async () => {
            const key = `encoding:averaged-person:3:${voice}`, kept = await storedModel(key);
            if (kept) { const r = await askWorker({ type: 'voice', voice, embedding: new Float32Array(kept) }); if (!r.error) return; }
            const r = await askWorker({ type: 'voice', voice, body, ...emotion ? { emotion } : {} });
            if (r.error || !r.embedding) throw new Error(r.error ?? 'no encoding');
            await storedModel(key, r.embedding.buffer.slice(0) as ArrayBuffer);
        })();
        made.catch(() => voicesMade.delete(voice));
        voicesMade.set(voice, made);
    }
    return made;
}
/** A said stretch's natural voice: its key and the audio being made (null: none, as for narration, a whisper, an untracked
 * speaker, or the setting). */
function naturalJob(unit: Element): { key: string; job: Promise<Float32Array | null> } | null {
    const who = unit.getAttribute('data-who'), p = who ? trackedPeople()[who] : undefined;
    if (settings().boxVoice !== 'natural' || unit.getAttribute('data-said') !== 'true' || !p || unit.querySelector('.rules-v-whisper, .rules-run-whisper')) return null;
    // The line is English (the model's language): its pace is English's for someone whose language the story has not set.
    const facts = speakingFactsOf(p), v = voiceOf({ ...facts, language: facts.language ?? 'english' }), text = spokenText(unit.textContent ?? '');
    if (!v.f0Hz || !v.tractCm || !/\p{L}/u.test(text)) return null;
    // The person's habits: their own draws (BodySize), or the same draws from the chat's salt and the name where never made.
    const draw = (k: string) => gauss(seededRng(`${saltOf()}:${k}:${who}`));
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
function prepareVoices(mes: Element): void { if (settings().boxVoice === 'natural') for (const u of unitsIn(mes)) naturalJob(u); }
function playNatural(audio: Float32Array): void {
    const AC = (globalThis as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
    if (!AC) return;
    blipCtx ??= new AC();
    const buf = blipCtx.createBuffer(1, audio.length, POCKET_MODEL.sampleRate);
    buf.getChannelData(0).set(audio);
    const src = blipCtx.createBufferSource(), g = blipCtx.createGain();
    src.buffer = buf; g.gain.value = settings().musicVolume;
    src.connect(g).connect(blipCtx.destination); src.start(); speechSource = src;
}
function stopTyping(): void {
    stopBlips(); stopSpeech(); voiceWait = null;
    if (typing) cancelAnimationFrame(typing.raf);
    typing = null; document.body?.classList?.remove('rules-typing');
    highlights()?.delete(UNSHOWN);
}
/** AUTO: the next unit once this one has been read (box.ts autoWait), while the box shows it and Auto stays on. */
function scheduleAuto(unit: Element, appearMs: number): void {
    clearTimeout(autoTimer);
    if (!settings().boxAuto || boxLog || !boxOn()) return;
    autoTimer = setTimeout(() => { if (settings().boxAuto && !boxLog && unit.classList.contains('rules-unit-now') && !typing) stepBox(1); }, autoWait(unit.textContent ?? '', appearMs));
}
/** The voice of the one a unit belongs to, when the engine tracks them (voice-body.ts): their own rate, formants and pitch. */
const voiceOfWho = (who: string | null | undefined) => { const p = who ? trackedPeople()[who] : undefined; return p ? voiceOf(voiceFactsOf(p)) : null; };
function typeUnit(unit: Element): void {
    stopTyping(); clearTimeout(autoTimer);
    // Said words appear at the speaker's own rate (voice-body.ts) where the engine tracks them, as a share of the unmarked rate.
    const said = unit.getAttribute('data-said') === 'true', own = said ? voiceOfWho(unit.getAttribute('data-who')) : null;
    const hl = highlights(), Hl = (globalThis as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
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
    if (natural) playNatural(natural);
    if (!settings().boxTyping || reducedMotion() || !hl || !Hl || !text.trim()) { hl?.delete(UNSHOWN); scheduleAuto(unit, spoken || natural ? total : 0); return; }
    const nodes: Text[] = [];
    const walk = document.createTreeWalker(unit, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) nodes.push(n as Text);
    const range = document.createRange(), last = nodes.at(-1)!;
    hl.set(UNSHOWN, new Hl(range));
    const t0 = performance.now();
    let shown = 0;
    const frame = () => {
        if (!typing || typing.unit !== unit) return;
        if (!unit.isConnected) { stopTyping(); return; }
        const t = performance.now() - t0;
        while (shown < text.length && times[shown]! <= t) shown++;
        if (shown >= text.length) { stopTyping(); scheduleAuto(unit, total); return; }
        let seen = 0;
        for (const n of nodes) { if (seen + n.length > shown) { range.setStart(n, shown - seen); break; } seen += n.length; }
        range.setEnd(last, last.length);
        typing.raf = requestAnimationFrame(frame);
    };
    typing = { unit, raf: 0, total }; document.body.classList.add('rules-typing');
    if (!spoken && !natural) playBlips(unit, text, times);
    frame();
}
/** The rest of a unit still appearing, at once (a tap or → while it appears). */
function finishTyping(): boolean {
    // A tap while a line's voice is still being made shows the line at once, unvoiced.
    if (voiceWait) { const unit = voiceWait; stopTyping(); scheduleAuto(unit, 0); return true; }
    if (!typing) return false;
    const { unit, total } = typing;
    stopTyping(); scheduleAuto(unit, total);
    return true;
}

/** The picture above the box (setting "Picture: large"): the one the player's character faces, as the reference shows the one
 * spoken with over the scene: the speaker of the unit shown when it is someone else, else the last one shown. A card's
 * picture is its avatar at full size; someone without a card has none, and no picture is drawn rather than another's. */
function avatarOf(who: string, mes: Element): string | null {
    const card = (ctx().characters as { name: string; avatar?: string }[] | undefined)?.find(c => c.name === who);
    if (card?.avatar) return `characters/${encodeURIComponent(card.avatar)}`;
    if (who !== mes.getAttribute('ch_name')) return null;
    const src = mes.querySelector('.avatar img')?.getAttribute('src') ?? '', m = /[?&]type=(avatar|persona)&file=([^&]+)/.exec(src);
    return m ? `${m[1] === 'avatar' ? 'characters' : 'User Avatars'}/${m[2]}` : src || null;
}
const stageRoster = new Map<string, { src: string; hiddenBySpotlight: boolean }>();
let lastHopKey = '';
const escRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, m => `\\${m}`);
function showFigure(mes: Element, unit: Element | undefined): void {
    const chat = document.getElementById('chat');
    if (!chat) return;
    let stage = document.getElementById('rules-box-stage');
    if (!stage) { stage = document.createElement('div'); stage.id = 'rules-box-stage'; stage.setAttribute('aria-hidden', 'true'); }
    if (chat.firstElementChild !== stage) chat.prepend(stage);
    let fig = document.getElementById('rules-box-figure') as HTMLImageElement | null;
    if (!fig) { fig = document.createElement('img'); fig.id = 'rules-box-figure'; fig.className = 'rules-stage-fig'; fig.alt = ''; fig.setAttribute('aria-hidden', 'true'); }
    if (!fig.parentElement) stage.appendChild(fig);

    const who = unit?.getAttribute('data-who') ?? mes.getAttribute('ch_name') ?? '';
    const said = unit?.getAttribute('data-said') === 'true';
    const unitText = unit?.textContent ?? '';
    const isRelevant = !!(unit?.querySelector('mark.rules-key') || (who && trackedPeople()[who]?.feelings?.some(f => (f.strength ?? 0) >= 0.65)));

    if (who && who !== playerName()) {
        const src = avatarOf(who, mes);
        if (src) {
            figureSrc = src; figureWho = who;
            stageRoster.set(who, { src, hiddenBySpotlight: false });
        }
    }
    for (const [name, entry] of stageRoster) {
        if (entry.hiddenBySpotlight && name !== who && new RegExp(`\\b${escRe(name)}\\b`, 'i').test(unitText)) {
            entry.hiddenBySpotlight = false;
        }
        if (said && isRelevant && who && who !== playerName() && name !== who) {
            entry.hiddenBySpotlight = true;
        }
    }

    const largeOn = settings().boxPicture === 'large' && !!figureSrc;
    stage.hidden = !largeOn;
    fig.hidden = !largeOn;
    if (figureSrc && fig.getAttribute('src') !== figureSrc) fig.setAttribute('src', figureSrc);

    const activeSpeaking = said && !!who && who === figureWho;
    const felt = figureWho ? pictureFeeling(trackedPeople()[figureWho]) : null;
    if (felt) fig.setAttribute('data-feeling', felt); else fig.removeAttribute('data-feeling');
    fig.toggleAttribute('data-speaking', activeSpeaking);
    fig.toggleAttribute('data-dimmed', said && !!who && who !== figureWho);
    fig.toggleAttribute('data-spotlight-hide', !!(figureWho && stageRoster.get(figureWho)?.hiddenBySpotlight));

    const hopKey = `${mes.getAttribute('mesid') ?? ''}:${unit?.textContent?.slice(0, 24) ?? ''}:${figureWho ?? ''}`;
    if (felt === 'happiness' && activeSpeaking && hopKey !== lastHopKey) {
        lastHopKey = hopKey;
        fig.removeAttribute('data-hop');
        void fig.getClientRects();
        fig.setAttribute('data-hop', 'true');
    }

    const extras = [...stageRoster.entries()].filter(([name]) => name !== figureWho).slice(-2);
    const keep = new Set<Element>([fig]);
    for (const [name, entry] of extras) {
        let img = stage.querySelector(`img[data-stage-who="${CSS.escape(name)}"]`) as HTMLImageElement | null;
        if (!img) {
            img = document.createElement('img');
            img.className = 'rules-stage-fig';
            img.alt = '';
            img.setAttribute('aria-hidden', 'true');
            img.setAttribute('data-stage-who', name);
            stage.appendChild(img);
        }
        if (img.getAttribute('src') !== entry.src) img.setAttribute('src', entry.src);
        const cFelt = pictureFeeling(trackedPeople()[name]);
        if (cFelt) img.setAttribute('data-feeling', cFelt); else img.removeAttribute('data-feeling');
        const cSpeaking = said && who === name;
        img.toggleAttribute('data-speaking', cSpeaking);
        img.toggleAttribute('data-dimmed', said && who !== name);
        img.toggleAttribute('data-spotlight-hide', entry.hiddenBySpotlight);
        if (cFelt === 'happiness' && cSpeaking && hopKey !== lastHopKey) {
            lastHopKey = hopKey;
            img.removeAttribute('data-hop');
            void img.getClientRects();
            img.setAttribute('data-hop', 'true');
        }
        keep.add(img);
    }
    for (const child of [...stage.children]) if (!keep.has(child)) child.remove();
}

/** The plate of the message shown: the name of the one the unit belongs to, and at its right the slot's words. */
function showPlate(mes: Element, unit: Element | undefined): void {
    const name = mes.querySelector('.name_text');
    if (!name) return;
    let who = mes.querySelector('.rules-who');
    if (!who) { who = document.createElement('span'); who.className = 'rules-who'; name.after(who); }
    who.textContent = unit?.getAttribute('data-who') || name.textContent || '';
    const voice = voiceOfWho(who.textContent);
    (who as HTMLElement).title = voice ? `${who.textContent}'s voice: ${voiceLine(voice)}` : '';
    let slot = mes.querySelector('.rules-slot');
    if (!slot) { slot = document.createElement('span'); slot.className = 'rules-slot'; name.closest('.flex1')?.appendChild(slot) ?? who.after(slot); }
    const said = unit?.getAttribute('data-said') === 'true';
    const thinking = platesOf(ctx().chat ?? []).find(p => String(p.index) === mes.getAttribute('mesid'))?.modes.find(m => m.mode === 'thinking');
    const titles: Record<SlotWord, string> = { speaking: 'Said aloud: words in quotation marks', whispering: 'Whispered: said without voicing', thinking: thinking?.title ?? 'Thinking', auto: 'The box moves on by itself' };
    const words = unit ? slotOf({ said, whispered: !!unit.querySelector('.rules-v-whisper, .rules-run-whisper'), thinking: !said && !!thinking, auto: settings().boxAuto }) : settings().boxAuto ? ['auto' as const] : [];
    slot.replaceChildren(...words.map(w => { const e = document.createElement('span'); e.className = `rules-mode rules-mode-${w}`; e.textContent = w; e.title = titles[w]; return e; }));
    fitTag(who as HTMLElement);
}
/** A face's capitals' height as a share of its size (a canvas measures "H" in it), kept per face once the face has loaded. */
const capShares = new Map<string, number>();
function capShare(family: string): number {
    const known = capShares.get(family);
    if (known) return known;
    const c = document.createElement('canvas').getContext('2d');
    if (!c) return 0.7;
    c.font = `700 100px ${family}`;
    const share = c.measureText('H').actualBoundingBoxAscent / 100 || 0.7;
    if (document.fonts?.check?.(c.font)) capShares.set(family, share);
    return share;
}
/** Whether an element's text fits its content box: a range over the text measures its widest line, a word that overflows
 * included, against the box, both in fractions of a pixel. */
function fitsBox(el: HTMLElement): boolean {
    const r = document.createRange(); r.selectNodeContents(el);
    const cs = getComputedStyle(el), box = el.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return r.getBoundingClientRect().width <= box + 0.5;
}
/** The night tag's name on one line (the player's pick, 2026-11-13): its size steps down from the look's (style.css) to the
 * print-size floor of the era's face (box.ts tagFloorPx); a name that does not fit even there keeps the full size and wraps
 * upward (style.css), so smaller letters are used only where they buy one line. */
function fitTag(el: HTMLElement): void {
    el.style.fontSize = ''; el.style.whiteSpace = '';
    if (!document.body.classList.contains('rules-box-night') || !el.getClientRects().length) return;
    const cs = getComputedStyle(el), full = parseFloat(cs.fontSize), floor = Math.min(full, tagFloorPx(capShare(cs.fontFamily)));
    el.style.whiteSpace = 'nowrap';
    for (let s = full; !fitsBox(el) && s > floor;) { s = Math.max(floor, s - 0.5); el.style.fontSize = `${s}px`; }
    if (!fitsBox(el)) el.style.fontSize = '';
    el.style.whiteSpace = '';
}
// Hold to explain (the player's pick, 2026-11-13): a touch screen has no hover, so a word's title (a marked word's marks with
// their sizes, the mode word's call, the name tag's voice) is out of reach. Holding one for HOLD_MS [ASSUMED: Android's
// long-press default] shows it in the box's menu line, in the buttons' place, until the finger lifts; a tap still goes on.
// The first marked line shown on a touch screen says so, once, for HINT_MS [ASSUMED].
const HOLD_MS = 500, HINT_MS = 4000;
/** What a held element explains, as [name, detail] pairs (box.ts explainParts for a marked word's list of marks). */
function explainOf(el: Element): [string, string][] {
    const t = el.getAttribute('title') ?? '';
    if (el.classList.contains('rules-mode')) return [[el.textContent ?? '', t]];
    if (el.classList.contains('rules-who')) return [[el.textContent ?? '', t.replace(/^[^:]*:\s*/, '')]];
    return explainParts(t);
}
/** The menu line's explanation (or a hint), or the buttons back (null). */
function showExplain(text: [string, string][] | string | null): void {
    const bar = document.getElementById('rules-box-bar'), out = document.getElementById('rules-box-explain');
    if (!bar || !out) return;
    bar.classList.toggle('rules-explaining', !!text);
    if (!text || typeof text === 'string') { out.textContent = text ?? ''; return; }
    out.replaceChildren(...text.flatMap(([name, detail], i) => {
        const b = document.createElement('b'); b.textContent = name;
        return [...i ? [document.createTextNode('; ')] : [], b, document.createTextNode(detail ? ` · ${detail}` : '')];
    }));
}
/** The one-time hint: the first marked line the box shows on a touch screen (settings().holdHinted remembers it). */
function hintHold(unit: Element | undefined): void {
    if (!unit || settings().holdHinted || !globalThis.matchMedia?.('(hover: none)').matches || !unit.querySelector('.rules-v[title]')) return;
    const s = settings(); s.holdHinted = true; ctx().saveSettingsDebounced();
    showExplain('Hold a marked word to read its marks');
    setTimeout(() => { if (!document.querySelector('.rules-held')) showExplain(null); }, HINT_MS);
}

/** The box as the settings and `boxAt` have it: the classes on the page, the current message and unit, the plate, the
 * picture, the bar's count; a unit newly shown going forward appears letter by letter. */
function showBox(): void {
    if (typeof document === 'undefined' || !document.body?.classList) return;
    const on = boxOn();
    document.body.classList.toggle('rules-box', on); document.body.classList.toggle('rules-box-log', on && boxLog);
    document.body.classList.toggle('rules-box-night', on && settings().boxLook === 'night'); toneLook();
    const bar = document.getElementById('rules-box-bar');
    if (bar) bar.hidden = !on;
    if (!on || boxLog) { stopTyping(); clearTimeout(autoTimer); shownKey = ''; }
    if (!on) return;
    unitChat();
    const all = [...document.querySelectorAll('#chat .mes')];
    const mes = all.find(m => m.getAttribute('mesid') === boxAt?.mes) ?? all.at(-1);
    if (!mes) return;
    for (const m of all) m.classList.toggle('rules-now', m === mes);
    fitUnits(mes); prepareVoices(mes);
    const units = unitsIn(mes), unit = Math.min(mes.getAttribute('mesid') === boxAt?.mes ? boxAt!.unit : 0, Math.max(0, units.length - 1));
    boxAt = { mes: mes.getAttribute('mesid') ?? '', unit };
    document.querySelectorAll('#chat .rules-unit-now').forEach(e => e.classList.remove('rules-unit-now'));
    const now = units[unit];
    now?.classList.add('rules-unit-now');
    showPlate(mes, now);
    hintHold(now);
    showFigure(mes, now);
    // Where, when and the light: the scene a visual novel's background shows, from the engine (box.ts sceneLine).
    const scene = document.getElementById('rules-box-scene');
    if (scene) {
        const t = storyTime(), args = [scenePlace(), t === null ? null : formatStoryTime(t), t === null ? null : sceneSky(t)?.label] as const;
        const line = sceneLine(...args), b = sceneBadge(...args);
        // Three lines for the night look's corner badge (clock, date, where); the page look runs them on one line.
        scene.replaceChildren(...line ? (['clock', 'date', 'where'] as const).filter(k => b[k]).map(k => { const e = document.createElement('span'); e.className = `rules-scene-${k}`; e.textContent = b[k]; return e; }) : []);
        scene.setAttribute('aria-label', line);
    }
    const count = document.getElementById('rules-box-count');
    if (count) count.textContent = `${all.indexOf(mes) + 1} / ${all.length}${units.length > 1 ? ` · ${unit + 1} / ${units.length}` : ''}`;
    const log = document.getElementById('rules-box-log');
    if (log) { log.textContent = boxLog ? 'Box' : 'Log'; log.setAttribute('aria-pressed', String(boxLog)); }
    document.getElementById('rules-box-auto')?.setAttribute('aria-pressed', String(settings().boxAuto));
    // A unit newly shown appears letter by letter unless the player stepped back to it; the same unit drawn again keeps going.
    const key = `${boxAt.mes}:${unit}:${units.length}`;
    // The first time the box reaches the first line in the chat of a character with a card of their own, going on, a card names
    // them before it (as visual novels introduce a person); the line types once the card is tapped away.
    const who = now?.getAttribute('data-who') ?? '';
    if (!boxLog && now && stepDir !== -1 && key !== shownKey && who && who !== playerName() && !metShown.has(who) && hasCard(who)
        && document.querySelector(`#chat .rules-unit[data-who="${CSS.escape(who)}"]`) === now) {
        metShown.add(who); showCard(who, mes); stopTyping(); clearTimeout(autoTimer); stepDir = 0; return;
    }
    if (!boxLog && now && key !== shownKey) { if (stepDir === -1) { stopTyping(); clearTimeout(autoTimer); } else typeUnit(now); }
    if (!boxLog) shownKey = now ? key : '';
    stepDir = 0;
}
/** Whether the player made a SillyTavern character card for this name: only they get a first-meeting card (the player, 2026-11-12:
 * else every passer-by the story names would get one). */
const hasCard = (who: string) => !!(ctx().characters as { name: string }[] | undefined)?.some(c => c.name === who);
/** Characters whose first-meeting card was shown in this chat's session. */
const metShown = new Set<string>();
/** The first-meeting card: the person's picture, their trade or age (box.ts cardRole), their name; a tap, the next key or
 * the next button takes it away and the line goes on. */
function showCard(who: string, mes: Element): void {
    let card = document.getElementById('rules-box-card');
    if (!card) {
        card = document.createElement('div'); card.id = 'rules-box-card'; card.setAttribute('role', 'dialog');
        card.addEventListener('click', e => { e.stopPropagation(); hideCard(); });
        (document.getElementById('sheld') ?? document.body).appendChild(card);
    }
    const src = avatarOf(who, mes), role = cardRole(trackedPeople()[who]);
    const face = document.createElement('img'); face.className = 'rules-card-face'; face.alt = ''; if (src) face.src = src; else face.hidden = true;
    const band = document.createElement('div'); band.className = 'rules-card-band';
    const r = document.createElement('span'); r.className = 'rules-card-role'; r.textContent = role;
    const n = document.createElement('span'); n.className = 'rules-card-name'; n.textContent = who;
    band.append(face, r, n); card.replaceChildren(band); card.setAttribute('aria-label', `${who}${role ? `, ${role}` : ''}`);
    document.body.classList.add('rules-card-on');
    fitCardName(n);
}
/** The card's name: its size steps down from the look's (style.css, 34 px) until no word is wider than its column, to the
 * print-size floor of its capitals (box.ts tagFloorPx); a word wider even there breaks (style.css overflow-wrap). It is
 * measured unturned, as laid out. */
function fitCardName(el: HTMLElement): void {
    el.style.fontSize = '';
    if (!el.getClientRects().length) return;
    const cs = getComputedStyle(el), full = parseFloat(cs.fontSize), floor = Math.min(full, tagFloorPx(capShare(cs.fontFamily)));
    el.style.overflowWrap = 'normal'; el.style.transform = 'none';
    for (let s = full; !fitsBox(el) && s > floor;) { s = Math.max(floor, s - 1); el.style.fontSize = `${s}px`; }
    el.style.overflowWrap = ''; el.style.transform = '';
}
function hideCard(): boolean {
    if (!document.body.classList.contains('rules-card-on')) return false;
    document.body.classList.remove('rules-card-on'); showBox();
    return true;
}
// Shoot a word (the player's pick, 2026-11-13; rules/why.ts): words selected in a message (a long press on a phone, a drag
// with a mouse) show their path in a panel over the chat: the records that produced them, each step one relation, told
// through the player's character, each step's measures (the call's numbers and draws) folded under the path. The panel
// stays while the selection grows; a tap on the chat or a step on closes it.
/** The selection's path, drawn; a selection outside the chat's messages leaves the panel as it is. */
function showWhy(): void {
    const sel = document.getSelection?.(), span = String(sel ?? '').replace(/\s+/g, ' ').trim();
    if (!sel || !sel.rangeCount || !span || span.length > 300) return;
    const range = sel.getRangeAt(0), node = range.commonAncestorContainer, el = (node.nodeType === 1 ? node : node.parentElement) as Element | null;
    const text = el?.closest('#chat .mes .mes_text'), mes = el?.closest('#chat .mes');
    // A message being edited is the player's own text box: its selection is for editing.
    if (!text || !mes || el?.closest('textarea, input, [contenteditable]')) return;
    const chat = ctx().chat ?? [], i = Number(mes.getAttribute('mesid')), msg = chat[i];
    if (!msg) return;
    const keys = (msg.extra?.rulesKeys as Record<number, { phrase: string; result: string; tool?: string }[]> | undefined)?.[msg.swipe_id ?? 0];
    let pass = null;
    for (let j = i; j >= 0 && !pass; j--) if (chat[j]?.is_user) pass = (chat[j]!.extra?.rulesPass as Parameters<typeof pathOf>[0]['pass']) ?? null;
    const unit = (range.startContainer.nodeType === 1 ? range.startContainer as Element : range.startContainer.parentElement)?.closest('.rules-unit');
    const block = (unit ?? el?.closest('p') ?? text).textContent ?? '', t = storyTime();
    const steps = pathOf({
        span, sentence: sentenceAt(block, Math.max(0, block.indexOf(span))), player: playerName(),
        said: unit?.getAttribute('data-said') === 'true' ? unit.getAttribute('data-who') || msg.name || null : null,
        keys: keys ?? [], pass, story: storyResult, facts: store().state.facts ?? [],
        clock: t === null ? null : { when: formatStoryTime(t), place: scenePlace(), sky: sceneSky(t)?.label ?? null }, when: formatStoryTime,
    });
    drawWhy(span, steps);
}
/** The sheet over the chat (the path's panel), made once; filled with a title and its parts. */
function openSheet(head: string, parts: Node[], tab?: SheetTab): void {
    let panel = document.getElementById('rules-why');
    if (!panel) {
        panel = document.createElement('div'); panel.id = 'rules-why'; panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
        (document.getElementById('sheld') ?? document.body).appendChild(panel);
    }
    const nodes: Node[] = [];
    if (tab) {
        const tabs = document.createElement('div'); tabs.className = 'rules-sheet-tabs';
        for (const t of sheetTabs()) {
            const b = document.createElement('button'); b.type = 'button'; b.textContent = TAB_NAME[t]; b.setAttribute('aria-pressed', String(t === tab));
            b.addEventListener('click', () => openTab(t)); tabs.append(b);
        }
        nodes.push(tabs);
    }
    const h = document.createElement('div'); h.className = 'rules-why-head'; h.textContent = head;
    panel.replaceChildren(...nodes, h, ...parts);
    panel.hidden = false;
}
type SheetTab = 'memory' | 'map' | 'time';
const TAB_NAME: Record<SheetTab, string> = { memory: 'Memory', map: 'Map', time: 'Time' };
/** The tabs the story holds now: the map with a plan that places the player's character, the timeline with a line's time. */
const sheetTabs = (): SheetTab[] => ['memory', ...mapNow() ? ['map' as const] : [], ...timelineOf(ctx().chat ?? []).length ? ['time' as const] : []];
const el = (tag: string, cls: string, text?: string) => { const e = document.createElement(tag); e.className = cls; if (text != null) e.textContent = text; return e; };
/** A list of remembered facts: each its words, a bar as long as it is recalled, how and when it was learned. */
function memoryList(rows: ReturnType<typeof memoryOf>): HTMLElement {
    const ul = el('ul', 'rules-memory');
    for (const r of rows) {
        const li = el('li', 'rules-memory-row'), bar = el('span', 'rules-memory-bar'), fill = el('i', '');
        fill.style.width = `${Math.round(r.strength * 100)}%`; bar.append(fill);
        li.append(el('span', 'rules-memory-text', r.text), bar, el('span', 'rules-why-note', [r.rel, r.by, r.at != null ? formatStoryTime(r.at) : ''].filter(Boolean).join(' · ')));
        ul.append(li);
    }
    return ul;
}
/** The map now: the plan around the player's character, with whom they heard and saw this turn. */
function mapNow() {
    const chat = ctx().chat ?? [], line = [...chat].reverse().find(m => m.is_user), sensed = sensedThisTurn(line?.extra?.rulesPass as Parameters<typeof sensedThisTurn>[0], playerName());
    return ctx().chatMetadata ? mapView(store().state, playerName(), sensed.heard, sensed.seen) : null;
}
/** One of the story's tabs: what the player's character remembers, the scene's map, or the story's timeline. */
function openTab(tab: SheetTab): void {
    const player = playerName();
    if (tab === 'memory') { const rows = memoryOf(store().state, player); openSheet(`What ${player} remembers`, [memoryList(rows)], tab); return; }
    if (tab === 'map') {
        const v = mapNow();
        if (!v) { openTab('memory'); return; }
        const [x0, y0, x1, y1] = v.box, w = 320, sc = Math.min(w / (x1 - x0), 200 / (y1 - y0)), X = (x: number) => (x - x0) * sc, Y = (y: number) => (y1 - y) * sc;
        const ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('viewBox', `0 0 ${w} ${Math.round((y1 - y0) * sc)}`); svg.setAttribute('class', 'rules-map'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `The scene's plan around ${player}`);
        const add = (tag: string, attrs: Record<string, string | number>, text?: string) => { const e = document.createElementNS(ns, tag); for (const [k, val] of Object.entries(attrs)) e.setAttribute(k, String(val)); if (text) e.textContent = text; svg.append(e); };
        for (const r of v.rooms) add('polygon', { points: r.corners.map(([x, y]) => `${X(x)},${Y(y)}`).join(' '), class: 'rules-map-room' });
        for (const p of v.people) {
            add('circle', { cx: X(p.x), cy: Y(p.y), r: p.player ? 7 : 6, class: p.player ? 'rules-map-me' : p.heard || p.seen ? 'rules-map-sensed' : 'rules-map-other' });
            add('text', { x: X(p.x), y: Y(p.y) + 18, 'text-anchor': 'middle', class: 'rules-map-name' }, `${p.name}${p.heard ? ' · heard' : ''}${p.seen ? ' · seen' : ''}`);
        }
        openSheet(`Around ${player}`, [svg], tab); return;
    }
    const points = timelineOf(ctx().chat ?? []), t0 = points[0]?.time ?? 0, t1 = points.at(-1)?.time ?? 1, strip = el('div', 'rules-time');
    // A point's clock stands under it when it lies 14 % of the strip or more from the last one labelled (the newest always).
    let labelled = -Infinity;
    points.forEach((p, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'rules-time-point';
        const left = points.length > 1 ? 4 + 92 * (p.time - t0) / Math.max(1, t1 - t0) : 50;
        b.style.left = `${left}%`;
        const clock = /\d{1,2}:\d{2}/.exec(formatStoryTime(p.time))?.[0] ?? '', last = i === points.length - 1;
        b.title = formatStoryTime(p.time); b.setAttribute('aria-label', `Go to the line at ${formatStoryTime(p.time)}`);
        if (last || left - labelled >= 14) { b.append(el('span', 'rules-time-label', clock)); labelled = left; }
        b.addEventListener('click', () => { hideWhy(); if (boxOn() && !boxLog) { boxAt = { mes: String(p.index), unit: 0 }; stepDir = -1; showBox(); } else document.querySelector(`#chat .mes[mesid="${p.index}"]`)?.scrollIntoView({ block: 'center' }); });
        strip.append(b);
    });
    openSheet('The story\'s time', [strip], tab);
}
/** A person's card: their picture, body, voice and feeling in plain words, what the player's character remembers of them,
 * and the numbers folded under it. */
function showPerson(name: string, mes: Element | null): void {
    const p = trackedPeople()[name], parts: Node[] = [], row = el('div', 'rules-person');
    const src = mes ? avatarOf(name, mes) : null;
    if (src) { const img = document.createElement('img'); img.className = 'rules-person-face'; img.alt = ''; img.src = src; row.append(img); }
    const facts = el('div', 'rules-person-facts'), v = voiceOfWho(name), f = feelingNow(p);
    const body = [p?.heightCm ? `${Math.round(p.heightCm)} cm` : '', p?.age != null ? `${Math.floor(p.age)} years` : '', p?.sex ?? ''].filter(Boolean).join(' · ');
    if (body) facts.append(el('div', '', body));
    const said = voiceWords(v?.f0Hz, v?.sylPerS);
    if (said) facts.append(el('div', '', said));
    if (f) facts.append(el('div', '', `feeling ${f.type}, ${f.strength >= 0.75 ? 'strongly' : f.strength >= 0.4 ? 'clearly' : 'faintly'}`));
    row.append(facts); parts.push(row);
    const about = memoryAbout(store().state, playerName(), name);
    if (about.length) { parts.push(el('div', 'rules-person-sub', `What ${playerName()} remembers of ${name}`), memoryList(about)); }
    if (v) {
        const d = document.createElement('details'), sum = document.createElement('summary'), ul = document.createElement('ul');
        d.className = 'rules-why-measures'; sum.textContent = 'the measures';
        for (const m of [v.f0Hz ? `pitch: ${Math.round(v.f0Hz)} Hz` : '', v.sylPerS ? `pace: ${v.sylPerS.toFixed(1)} syllables a second` : '', voiceLine(v)].filter(Boolean)) { const li = document.createElement('li'); li.textContent = m; ul.append(li); }
        d.append(sum, ul); parts.push(d);
    }
    openSheet(name, parts);
}
/** The panel: its title, the path as one line per step (the relation, what it names, a note), the measures folded under it. */
function drawWhy(span: string, steps: WhyStep[]): void {
    let panel = document.getElementById('rules-why');
    if (!panel) {
        panel = document.createElement('div'); panel.id = 'rules-why'; panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
        (document.getElementById('sheld') ?? document.body).appendChild(panel);
    }
    const head = document.createElement('div'); head.className = 'rules-why-head'; head.textContent = `The path to “${span.length > 60 ? `${span.slice(0, 57)}…` : span}”`;
    const list = document.createElement('ul'); list.className = 'rules-why-path';
    for (const s of steps) {
        const li = document.createElement('li'), rel = document.createElement('span');
        rel.className = 'rules-why-rel'; rel.textContent = s.rel;
        li.append(rel, document.createTextNode(s.text));
        if (s.note) { const n = document.createElement('span'); n.className = 'rules-why-note'; n.textContent = s.note; li.append(n); }
        list.append(li);
    }
    panel.replaceChildren(head, list);
    const measures = steps.flatMap(s => s.measures ?? []);
    if (measures.length) {
        const d = document.createElement('details'), sum = document.createElement('summary'), ul = document.createElement('ul');
        d.className = 'rules-why-measures'; sum.textContent = 'the measures';
        for (const m of measures) { const li = document.createElement('li'); li.textContent = m; ul.append(li); }
        d.append(sum, ul); panel.append(d);
    }
    panel.hidden = false;
}
/** Closes the panel; true when it was open. */
function hideWhy(): boolean {
    const panel = document.getElementById('rules-why');
    if (!panel || panel.hidden) return false;
    panel.hidden = true;
    return true;
}
/** One unit on (1) or back (−1); past a message's last or first unit, the neighbouring message's nearest one. Going on while
 * a unit still appears shows the rest of it first. */
function stepBox(d: 1 | -1): void {
    if (!boxOn() || boxLog || !boxAt) return;
    hideWhy();
    if (d === 1 && hideCard()) return;
    if (d === 1 && finishTyping()) return;
    const all = [...document.querySelectorAll('#chat .mes')], i = all.findIndex(m => m.getAttribute('mesid') === boxAt!.mes);
    if (i < 0) return;
    const u = boxAt.unit + d;
    if (u >= 0 && u < Math.max(1, unitsIn(all[i]!).length)) boxAt = { mes: boxAt.mes, unit: u };
    else if (all[i + d]) boxAt = { mes: all[i + d]!.getAttribute('mesid') ?? '', unit: d > 0 ? 0 : Math.max(0, unitsIn(all[i + d]!).length - 1) };
    else return;
    stepDir = d;
    showBox();
}
/** The box's bar above the message box (back, the count, on, auto, the log) and its keys and taps; built once. */
function buildBox(): void {
    const form = document.getElementById('form_sheld'), chat = document.getElementById('chat');
    if (!form || !chat || document.getElementById('rules-box-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'rules-box-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'The text box');
    const button = (id: string, text: string, label: string, act: () => void) => { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = text; b.title = label; b.setAttribute('aria-label', label); b.addEventListener('click', act); bar.appendChild(b); return b; };
    button('rules-box-back', '‹', 'Back', () => stepBox(-1));
    const count = document.createElement('span'); count.id = 'rules-box-count'; count.setAttribute('aria-live', 'off'); bar.appendChild(count);
    button('rules-box-next', '›', 'Next', () => stepBox(1));
    button('rules-box-auto', 'Auto', 'Move on by itself once a box has been read', () => {
        // settings() rebuilds the stored object on each call, so the toggle reads and writes one object.
        const s = settings(); s.boxAuto = !s.boxAuto; ctx().saveSettingsDebounced(); showBox();
        const now = document.querySelector('#chat .rules-unit-now');
        if (settings().boxAuto && now && !typing) scheduleAuto(now, Infinity); else if (!settings().boxAuto) clearTimeout(autoTimer);
    });
    button('rules-box-music', '♪', 'Music', () => { const s = settings(); s.musicOn = !s.musicOn; ctx().saveSettingsDebounced(); musicNow(); const box = document.getElementById('rules_engine_music') as HTMLInputElement | null; if (box) box.checked = s.musicOn; });
    button('rules-box-story', 'Story', 'What your character remembers, the scene\'s map and the story\'s timeline', () => openTab(mapNow() ? 'map' : 'memory'));
    button('rules-box-log', 'Log', 'The whole chat, or one box at a time', () => { boxLog = !boxLog; showBox(); if (boxLog) document.querySelector('#chat .rules-now')?.scrollIntoView({ block: 'center' }); });
    const explain = document.createElement('span'); explain.id = 'rules-box-explain'; explain.setAttribute('aria-live', 'polite'); bar.appendChild(explain);
    form.before(bar);
    const scene = document.createElement('div'); scene.id = 'rules-box-scene'; scene.setAttribute('aria-live', 'off'); chat.before(scene);
    // A tap on the badge (the story's clock) opens the timeline.
    scene.addEventListener('click', () => openTab('time'));
    // A tap on the box's text is "next"; a tap on anything that acts by itself (a link, a button, the note, an edit) is its own,
    // and so is a tap that ends a selection of text.
    const explainable = (t: EventTarget | null) => (t as Element | null)?.closest?.('.rules-now .rules-v[title], .rules-now .rules-mode[title]') ?? null;
    chat.addEventListener('click', e => { const tag = (e.target as Element | null)?.closest?.('.rules-now .rules-who'); if (tag && boxOn() && !boxLog) { e.stopPropagation(); showPerson(tag.textContent ?? '', tag.closest('.mes')); } }, true);
    let holdTimer: ReturnType<typeof setTimeout> | undefined, swallowUntil = 0;
    chat.addEventListener('pointerdown', e => {
        clearTimeout(holdTimer);
        const t = explainable(e.target);
        if (!boxOn() || boxLog || e.pointerType === 'mouse' || !t?.getAttribute('title')) return;
        holdTimer = setTimeout(() => { t.classList.add('rules-held'); showExplain(explainOf(t)); }, HOLD_MS);
    });
    // Lifting the finger ends the explanation; the click that follows the lift is the hold's, not a step on.
    const release = () => {
        clearTimeout(holdTimer);
        const held = document.querySelectorAll('.rules-held');
        if (!held.length) return;
        held.forEach(e => e.classList.remove('rules-held')); showExplain(null); swallowUntil = performance.now() + 400;
    };
    chat.addEventListener('pointerup', release); chat.addEventListener('pointercancel', release);
    // A long press opens the device's menu and selection on a word; on a word that explains, the hold is the box's.
    chat.addEventListener('contextmenu', e => { if (boxOn() && !boxLog && explainable(e.target)) e.preventDefault(); });
    // Shoot a word: a selection in a message shows its path (rules/why.ts), redrawn as the selection grows.
    let whyTimer: ReturnType<typeof setTimeout> | undefined;
    document.addEventListener('selectionchange', () => { clearTimeout(whyTimer); whyTimer = setTimeout(showWhy, 150); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hideWhy(); });
    globalThis.addEventListener?.('resize', () => { const w = document.querySelector('#chat .rules-now .rules-who'); if (w) fitTag(w as HTMLElement); });
    chat.addEventListener('click', e => {
        const t = e.target as Element | null;
        if (performance.now() < swallowUntil) return;
        if (!boxOn() || boxLog || !t?.closest?.('.rules-now .mes_text') || t.closest('a, button, summary, details, textarea, input, .mes_buttons, [role="button"]') || String(document.getSelection?.() ?? '')) return;
        if (hideWhy()) return;
        stepBox(1);
    });
    document.addEventListener('keydown', e => {
        const t = e.target as Element | null;
        if (!boxOn() || boxLog || e.ctrlKey || e.altKey || e.metaKey || t?.closest?.('textarea, input, select, [contenteditable]')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); stepBox(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); stepBox(-1); }
    });
}

// The music (rules/music.ts; the player's picks, 2026-11-11: the characters' feelings set the target, songs measured in the
// browser as they are added, named sets first and measured areas otherwise). Each song is uploaded to SillyTavern's files
// (/api/files/upload, served at user/files) and measured from its decoded samples; the one nearest the scene's feelings plays,
// one song giving way to the next over musicCrossfadeS, equal-power (gains cos and sin of a quarter turn, so two unrelated
// songs keep their summed power), looping until the scene moves to another area.
let figureWho: string | null = null;
let players: HTMLAudioElement[] = [], playing = 0, nowSong: string | null = null, fadeTimer: ReturnType<typeof setInterval> | undefined;
const songsNow = () => settings().songs ?? [];
/** The feelings in the scene: the one the player's latest line is marked with (the voice toolbar's feeling, Juslin & Laukka's
 * five), and each tracked character's appraised feelings still running (Appraise, [BODY]). */
function sceneFeelings(): { who: string; type: string; turn: number }[] {
    const out: { who: string; type: string; turn: number }[] = [], chat = ctx().chat ?? [];
    // Each feeling's turn: the number of the player's lines up to it (rules-tools.ts records an appraised one's).
    const turns = chat.filter(m => m?.is_user).length;
    for (let i = chat.length - 1; i >= 0; i--) if (chat[i]?.is_user) { const f = marksOf(String(chat[i]!.mes ?? '')).feeling; if (f) out.push({ who: playerName(), type: `voice:${f}`, turn: turns }); break; }
    for (const [who, p] of Object.entries(trackedPeople())) for (const f of p.feelings ?? []) if (f.left > 0) out.push({ who, type: f.type, turn: f.turn ?? 0 });
    return out;
}
const player = (i: number) => {
    if (!players[i]) { const a = new Audio(); a.loop = true; a.preload = 'auto'; players[i] = a; }
    return players[i]!;
};
/** A song on, the one playing out, equal-power over musicCrossfadeS. A browser that holds sound until the page is touched
 * gets it at the next touch. */
function playSong(song: SongEntry): void {
    const from = nowSong ? players[playing] : undefined, to = player(1 - playing), vol = settings().musicVolume;
    playing = 1 - playing; nowSong = song.id;
    to.src = song.path; to.volume = 0;
    void to.play().catch(() => document.addEventListener('pointerdown', () => { void to.play().catch(() => {}); }, { once: true }));
    clearInterval(fadeTimer);
    const t0 = performance.now(), span = peek('musicCrossfadeS') * 1000;
    fadeTimer = setInterval(() => {
        const x = Math.min(1, (performance.now() - t0) / span);
        to.volume = vol * Math.sin(x * Math.PI / 2);
        if (from) from.volume = vol * Math.cos(x * Math.PI / 2);
        if (x >= 1) { clearInterval(fadeTimer); from?.pause(); }
    }, 50);
}
function stopMusic(): void { nowSong = null; clearInterval(fadeTimer); for (const p of players) p.pause(); }
/** The library's points and areas, each area's key (the words it is first named with, a number after two alike) and its name
 * (the player's, else the key). */
function musicSpace(list: SongEntry[]) {
    const points = songPoints(list.map(x => x.cues)), areas = areasOf(points), keys = new Map<number, string>(), names = new Map<number, string>(), seen = new Map<string, number>();
    for (const a of [...new Set(areas)].sort((x, y) => x - y)) {
        const words = areaWords(points.filter((_, i) => areas[i] === a)), n = (seen.get(words) ?? 0) + 1;
        seen.set(words, n);
        const key = n > 1 ? `${words} ${n}` : words;
        keys.set(a, key); names.set(a, settings().musicAreaNames?.[key] || key);
    }
    return { points, areas, keys, names };
}
/** The song for the scene as it stands (music.ts chooseSong), played if it is not the one playing. */
function musicNow(): void {
    const s = settings(), list = songsNow();
    if (!s.enabled || !s.musicOn || !list.length) { stopMusic(); drawMusicNow(); return; }
    const { points, areas } = musicSpace(list), cur = list.findIndex(x => x.id === nowSong);
    const place = trackedPeople()[playerName()]?.at ?? null;
    const pick = chooseSong({ points, areas, sets: list.map(x => x.set), target: sceneTarget(sceneFeelings()), place, current: cur >= 0 ? cur : null });
    if (pick != null && list[pick]!.id !== nowSong) playSong(list[pick]!);
    drawMusicNow();
}
/** What plays, in the settings and on the box's ♪ button. */
function drawMusicNow(): void {
    const list = songsNow(), i = list.findIndex(x => x.id === nowSong), space = i < 0 ? null : musicSpace(list);
    const text = i < 0 ? 'No song playing' : `Playing: ${list[i]!.name} (${space!.names.get(space!.areas[i]!)})`;
    const now = document.getElementById('rules_engine_music_now');
    if (now) now.textContent = text;
    const b = document.getElementById('rules-box-music');
    if (b) { b.title = `Music: ${settings().musicOn ? text : 'off'}`; b.setAttribute('aria-pressed', String(settings().musicOn)); }
}
/** A file's bytes as base64, in pieces small enough for String.fromCharCode. */
const base64 = (buf: ArrayBuffer) => { const u = new Uint8Array(buf); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s); };
const headers = () => ((ctx() as Ctx & { getRequestHeaders?: () => Record<string, string> }).getRequestHeaders?.() ?? { 'Content-Type': 'application/json' });
/** Songs picked from the device: each decoded, measured (music.ts measureSong), uploaded under a name SillyTavern accepts
 * (letters, digits, '-', '_', '.') and kept with its measures; then the list is drawn again and the music chosen again. */
async function addSongs(files: File[]): Promise<void> {
    const status = document.getElementById('rules_engine_music_status');
    const AC = (globalThis as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ?? (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ac = new AC();
    for (const [i, f] of files.entries()) {
        if (status) status.textContent = `Measuring ${i + 1} of ${files.length}: ${f.name}`;
        try {
            const buf = await f.arrayBuffer(), audio = await ac.decodeAudioData(buf.slice(0));
            const cues = await measureSong(Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c)), audio.sampleRate, () => new Promise(r => setTimeout(r, 0)));
            const ext = (/\.([a-z0-9]{1,5})$/i.exec(f.name)?.[1] ?? 'audio').toLowerCase(), id = `rules-song-${Date.now()}-${f.name.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 40)}.${ext}`;
            const r = await fetch('/api/files/upload', { method: 'POST', headers: headers(), body: JSON.stringify({ name: id, data: base64(buf) }) });
            if (!r.ok) throw new Error(await r.text());
            const { path } = await r.json() as { path: string };
            const s = settings();
            s.songs = [...s.songs, { id, name: f.name.replace(/\.[^.]*$/, ''), path, set: '', cues }];
            ctx().saveSettingsDebounced();
        } catch (e) { toastr.warning(`${f.name}: ${e instanceof Error ? e.message : String(e)}`, 'Music'); }
    }
    if (status) status.textContent = '';
    void ac.close();
    drawSongs(); musicNow();
}
/** The songs in the settings: each with its measures, its area, a field for its set and a remove button; then the areas, each
 * with a field for its name. Every text is set as text. */
function drawSongs(): void {
    const box = document.getElementById('rules_engine_music_list'), areasBox = document.getElementById('rules_engine_music_areas');
    if (!box || !areasBox) return;
    const list = songsNow(), { areas, names, keys } = musicSpace(list);
    const el = (tag: string, cls: string, text = '') => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
    box.replaceChildren(...list.map((song, i) => {
        const row = el('div', 'rules-song'), c = song.cues;
        row.append(el('span', 'rules-song-name', song.name), el('small', 'rules-song-cues', `${c.bpm} BPM · ${c.lufs} LUFS · ${(c.centroidHz / 1000).toFixed(1)} kHz · ${c.key} · ${names.get(areas[i]!)}`));
        const set = el('input', 'text_pole rules-song-set') as HTMLInputElement;
        set.placeholder = 'set: a character or a place'; set.value = song.set; set.setAttribute('aria-label', `Set of ${song.name}`);
        set.addEventListener('change', () => { const s = settings(); s.songs = s.songs.map(x => x.id === song.id ? { ...x, set: set.value.trim() } : x); ctx().saveSettingsDebounced(); musicNow(); });
        const rm = el('button', 'menu_button rules-song-remove', 'Remove') as HTMLButtonElement;
        rm.type = 'button';
        rm.addEventListener('click', async () => {
            await fetch('/api/files/delete', { method: 'POST', headers: headers(), body: JSON.stringify({ path: song.path }) }).catch(() => null);
            const s = settings(); s.songs = s.songs.filter(x => x.id !== song.id); ctx().saveSettingsDebounced();
            if (nowSong === song.id) stopMusic();
            drawSongs(); musicNow();
        });
        row.append(set, rm);
        return row;
    }));
    areasBox.replaceChildren(...[...names.keys()].map(a => {
        const row = el('label', 'rules-area'), key = keys.get(a)!, name = el('input', 'text_pole') as HTMLInputElement;
        name.value = names.get(a)!; name.setAttribute('aria-label', `Name of the area ${key}`);
        name.addEventListener('change', () => { const s = settings(); s.musicAreaNames = { ...s.musicAreaNames, [key]: name.value.trim() }; ctx().saveSettingsDebounced(); drawSongs(); drawMusicNow(); });
        row.append(el('small', '', `${areas.filter(x => x === a).length} song(s), first named “${key}”: `), name);
        return row;
    }));
}

/** The look of the chat: the dialogue page while its setting is on (style.css, body.rules-page), and for marked lines the
 * multiple-distinctions look while its setting is on (body.rules-distinct), its sizes set from the sound of each mark (ui.ts
 * lookVars), so the stylesheet draws the engine's quantities. */
function applyLook(): void {
    if (typeof document === 'undefined') return;
    document.body?.classList?.toggle('rules-page', settings().page);
    document.body?.classList?.toggle('rules-page-dark', settings().page && settings().pageColours === 'dark');
    // The box's type: the page's size, or the size the farthest phone reader needs (box.ts boxFontPx); its lines hold the
    // letters boxLines lines of the page's size hold.
    const page = (parseFloat(getComputedStyle(document.body).getPropertyValue('--mainFontSize')) || 15) * 1.19, box = boxFontPx(page);
    boxLinesNow = boxLinesAt(page, box);
    document.body?.style?.setProperty('--rules-box-lines', String(boxLinesNow));
    document.body?.style?.setProperty('--rules-box-font', `${Math.round(box * 10) / 10}px`);
    document.body?.classList?.toggle('rules-distinct', settings().distinct);
    for (const [name, value] of Object.entries(lookVars())) document.body?.style?.setProperty(`--rules-${name}`, String(value));
    toneLook();
}
/** The tone of what the chat's text stands on: light on the dialogue page, whose ground is its own; off the page the theme's,
 * read from its text colour (light text is a dark theme). */
const toneNow = () => boxOn() && !boxLog && settings().boxLook === 'night' ? 'dark' : settings().page ? (settings().pageColours === 'dark' ? 'dark' : 'light') : toneOf(getComputedStyle(document.documentElement).getPropertyValue('--SmartThemeBodyColor'));
/** The tone, for the feeling colours' lightness (style.css, body[data-rules-tone]), and on the dialogue page the story's era on
 * the chat, for its type (style.css, .rules-era-…); both read again whenever the chat is drawn, as the player can change the
 * theme and the story's time moves. */
function toneLook(): void {
    if (typeof document === 'undefined' || !document.body?.setAttribute) return;
    document.body.setAttribute('data-rules-tone', toneNow());
    const chat = document.getElementById('chat');
    if (!chat) return;
    for (const c of [...chat.classList]) if (c.startsWith('rules-era-')) chat.classList.remove(c);
    if (settings().page) chat.classList.add(`rules-era-${eraOf(storyYearNow())}`);
}

function registerTimeCommand(): void {
    const c = ctx();
    if (!c.SlashCommand || !c.SlashCommandParser) return;
    c.SlashCommandParser.addCommandObject(c.SlashCommand.fromProps({
        name: 'rules-time',
        helpString: 'Show the story time, or set it: /rules-time 1850-03-14 18:40, /rules-time 1850-03-14, /rules-time Day 3 07:15. PassTime moves it on from there.',
        returns: 'the story time',
        callback: async (_args: unknown, value: unknown) => {
            const text = String(value ?? '').trim();
            if (text) {
                const t = parseStoryTime(text);
                if (t === null) return 'Not a story time. Use 1850-03-14 18:40, 1850-03-14, or Day 3 07:15.';
                setStoryTime(t);
                refreshTime();
            }
            const now = storyTime();
            return now === null ? 'No story time set. Set one with /rules-time 1850-03-14 18:40.' : `Story time: ${formatStoryTime(now)}.`;
        },
    }));
}

function refreshTime(): void {
    const t = ctx().chatMetadata ? storyTime() : null;
    const el = document.getElementById('rules_engine_time') as HTMLInputElement | null;
    if (el && document.activeElement !== el) el.value = t === null ? '' : formatStoryTime(t);
}

async function buildSettings(): Promise<void> {
    const html = await ctx().renderExtensionTemplateAsync(`third-party/${folder()}`, 'settings');
    document.getElementById('extensions_settings2')?.insertAdjacentHTML('beforeend', html);
    const s = settings();
    const bind = (id: string, key: 'enabled' | 'questionPass' | 'ruleCheck' | 'structured' | 'suggest' | 'distinct' | 'page' | 'box' | 'boxTyping' | 'musicOn', after?: () => void) => {
        const el = document.getElementById(id) as HTMLInputElement;
        el.checked = s[key];
        el.addEventListener('change', () => { settings()[key] = el.checked; ctx().saveSettingsDebounced(); after?.(); });
    };
    bind('rules_engine_enabled', 'enabled', () => registerRulesTools(settings().enabled));
    bind('rules_engine_question_pass', 'questionPass');
    bind('rules_engine_rule_check', 'ruleCheck');
    if (document.getElementById('rules_engine_structured')) bind('rules_engine_structured', 'structured');
    if (document.getElementById('rules_engine_suggest')) bind('rules_engine_suggest', 'suggest');
    if (document.getElementById('rules_engine_distinct')) bind('rules_engine_distinct', 'distinct', applyLook);
    // The notes are drawn again with the page: their kind colours take the tone of what they stand on.
    if (document.getElementById('rules_engine_page')) bind('rules_engine_page', 'page', () => { applyLook(); drawNotes(); showBox(); });
    if (document.getElementById('rules_engine_box_typing')) bind('rules_engine_box_typing', 'boxTyping');
    // A setting given as a choice of named values: the select shows the saved one and saves the one picked.
    const choice = <K extends 'pageColours' | 'boxPicture' | 'boxLook' | 'boxVoice' | 'keyboardLayout'>(id: string, key: K, values: Settings[K][], after: () => void) => {
        const el = document.getElementById(id) as HTMLSelectElement | null;
        if (!el) return;
        el.value = String(s[key]);
        el.addEventListener('change', () => { settings()[key] = values.find(v => v === el.value) ?? values[0]!; ctx().saveSettingsDebounced(); after(); });
    };
    choice('rules_engine_page_colours', 'pageColours', ['light', 'dark'], () => { applyLook(); drawNotes(); showBox(); });
    choice('rules_engine_box_picture', 'boxPicture', ['none', 'large'], showBox);
    choice('rules_engine_box_look', 'boxLook', ['night', 'page'], showBox);
    choice('rules_engine_box_voice', 'boxVoice', ['natural', 'robotic', 'blips', 'off'], () => { if (settings().boxVoice === 'robotic') void loadSpeech().catch(() => undefined); if (settings().boxVoice === 'natural') void loadNatural().catch(() => undefined); });
    choice('rules_engine_keyboard', 'keyboardLayout', ['auto', 'qwerty', 'qwertz', 'azerty', 'dvorak', 'colemak'], () => undefined);
    // The music: on or off, the volume, songs added from the device, and the list of songs and areas.
    if (document.getElementById('rules_engine_music')) bind('rules_engine_music', 'musicOn', musicNow);
    const volume = document.getElementById('rules_engine_music_volume') as HTMLInputElement | null;
    if (volume) { volume.value = String(Math.round(s.musicVolume * 100)); volume.addEventListener('input', () => { settings().musicVolume = Number(volume.value) / 100; ctx().saveSettingsDebounced(); const p = players[playing]; if (p && nowSong) p.volume = settings().musicVolume; }); }
    const files = document.getElementById('rules_engine_music_files') as HTMLInputElement | null;
    document.getElementById('rules_engine_music_add')?.addEventListener('click', () => files?.click());
    files?.addEventListener('change', () => { const f = [...(files.files ?? [])]; files.value = ''; if (f.length) void addSongs(f); });
    drawSongs(); drawMusicNow();
    if (document.getElementById('rules_engine_box')) bind('rules_engine_box', 'box', () => { boxLog = false; drawNotes(); showBox(); });
    const boxUnit = document.getElementById('rules_engine_box_unit') as HTMLSelectElement | null;
    if (boxUnit) { boxUnit.value = s.boxUnit; boxUnit.addEventListener('change', () => { settings().boxUnit = boxUnit.value === 'message' ? 'message' : 'voice'; ctx().saveSettingsDebounced(); boxAt = boxAt && { mes: boxAt.mes, unit: 0 }; showBox(); }); }
    const profile = document.getElementById('rules_engine_profile') as HTMLSelectElement;
    const profiles: { id: string; name: string }[] = ctx().extensionSettings.connectionManager?.profiles ?? [];
    for (const p of profiles) profile.add(new Option(p.name, p.id));
    profile.value = profiles.some(p => p.id === s.profile) ? s.profile : '';
    profile.addEventListener('change', () => { settings().profile = profile.value; ctx().saveSettingsDebounced(); });
    const tokens = document.getElementById('rules_engine_max_tokens') as HTMLInputElement;
    tokens.value = String(s.maxTokens || '');
    tokens.addEventListener('change', () => { settings().maxTokens = Math.max(0, Number(tokens.value) || 0); ctx().saveSettingsDebounced(); });
    const effort = document.getElementById('rules_engine_effort') as HTMLSelectElement | null;
    if (effort) { effort.value = s.effort ?? 'low'; effort.addEventListener('change', () => { settings().effort = effort.value; ctx().saveSettingsDebounced(); }); }
    const time = document.getElementById('rules_engine_time') as HTMLInputElement;
    time.addEventListener('change', () => {
        const t = parseStoryTime(time.value);
        if (t === null) { toastr.warning('Use 1850-03-14 18:40, 1850-03-14, or Day 3 07:15.', 'Story time'); refreshTime(); return; }
        if (ctx().chatMetadata) { setStoryTime(t); refreshTime(); }
    });
    refreshTime();
    const line = document.getElementById('rules_engine_world_line') as HTMLInputElement;
    document.getElementById('rules_engine_world_fill')?.addEventListener('click', () => {
        if (!line.value.trim()) return;
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
function addReplySchema(data: Record<string, unknown>): void {
    if (!structuredNow()) return;
    const schema = narrationSchema(decidedResults().length), rf = { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema } };
    data.response_format = rf;
    data.json_schema = { name: 'reply', strict: true, value: schema };
    if (data.chat_completion_source === 'custom') data.custom_include_body = `${String(data.custom_include_body ?? '').trim()}${data.custom_include_body ? '\n' : ''}response_format: ${JSON.stringify(rf)}`;
}
function readReply(id: number): void {
    const c = ctx() as Ctx & { saveChatDebounced?: () => void; updateMessageBlock?: (id: number, m: STMessage) => void };
    const msg = c.chat?.[id] as (STMessage & { swipes?: string[] }) | undefined;
    if (!msg || msg.is_user || msg.is_system) return;
    const before = msg.mes, swipe = msg.swipe_id ?? 0, nar = readNarration(msg.mes);
    msg.extra ??= {};
    if (nar) { msg.mes = proseOf(nar); ((msg.extra.rulesNarration ??= {}) as Record<number, unknown>)[swipe] = nar; }
    setOpen(nar?.open ?? []);
    // The names the narrator wrote before its quotations (box.ts takeSpeakers) leave the text; the box's plate reads them.
    const sp = takeSpeakers(msg.mes);
    msg.mes = sp.text;
    if (sp.said.length) ((msg.extra.rulesSpeakers ??= {}) as Record<number, unknown>)[swipe] = sp.said;
    // The words that name what the engine decided this turn (box.ts keyPhrase), set apart in the chat as the reference sets
    // important words in yellow (style.css mark.rules-key).
    const people = castNames(), keys = decidedResults().flatMap(r => { const phrase = keyPhrase(r.result, msg.mes, people); return phrase ? [{ phrase, result: r.result, tool: r.tool }] : []; });
    if (keys.length) ((msg.extra.rulesKeys ??= {}) as Record<number, unknown>)[swipe] = keys;
    if (msg.mes === before && !keys.length) return;
    // The swipe keeps the text shown, so swiping back to it shows prose, not the reply's raw form.
    if (Array.isArray(msg.swipes) && msg.swipes[swipe] === before) msg.swipes[swipe] = msg.mes;
    try { c.updateMessageBlock?.(id, msg); } catch { /* the block is drawn after this event */ }
    c.saveChatDebounced?.();
}
/** Each reply's key words (readReply) marked where they first stand in its text, with the result they name on hover. */
function markKeys(): void {
    for (const mes of document.querySelectorAll('#chat .mes[is_user="false"]')) {
        const text = mes.querySelector('.mes_text'), msg = ctx().chat?.[Number(mes.getAttribute('mesid'))];
        const keys = (msg?.extra?.rulesKeys as Record<number, { phrase: string; result: string }[]> | undefined)?.[msg?.swipe_id ?? 0];
        if (!text || !keys?.length || text.querySelector('mark.rules-key, .edit_textarea')) continue;
        for (const k of keys) {
            const walk = document.createTreeWalker(text, NodeFilter.SHOW_TEXT);
            for (let n = walk.nextNode() as Text | null; n; n = walk.nextNode() as Text | null) {
                const at = n.data.indexOf(k.phrase);
                if (at < 0 || n.parentElement?.closest('mark.rules-key')) continue;
                const m = document.createElement('mark');
                m.className = 'rules-key'; m.title = `What the engine decided: ${k.result}`;
                const rest = n.splitText(at); rest.splitText(k.phrase.length);
                rest.replaceWith(m); m.appendChild(rest);
                break;
            }
        }
    }
}

function wireEvents(): void {
    const c = ctx(), on = c.eventSource.on.bind(c.eventSource), ev = c.eventTypes;
    const live = () => settings().enabled && !!ctx().chatMetadata;
    // First of the reply's handlers: the rule check and the saved state read the prose.
    on(ev.MESSAGE_RECEIVED, (id: number) => { if (live()) readReply(id); });
    if (ev.CHAT_COMPLETION_SETTINGS_READY) on(ev.CHAT_COMPLETION_SETTINGS_READY, (data: Record<string, unknown>) => { if (live()) addReplySchema(data); });
    // Every request to a model leaves with the player's hidden marks as notation, whoever built it: the interceptor notates the
    // reply's own chat, and an extension's raw prompt (the summary's "raw" builder) reads the lines as saved.
    for (const e of [ev.CHAT_COMPLETION_SETTINGS_READY, ev.TEXT_COMPLETION_SETTINGS_READY]) if (e) on(e, (data: { messages?: unknown; prompt?: unknown }) => notateRequest(data));
    on(ev.GENERATION_STARTED, (type: string) => { if (live()) onRulesGenerationStarted(type); });
    on(ev.MESSAGE_RECEIVED, (id: number) => { if (live()) onRulesMessageReceived(id); });
    on(ev.MESSAGE_RECEIVED, async (id: number) => {
        // A greeting has no player turn to check against.
        if (!live() || !settings().ruleCheck || settings().suggest || !ctx().chat.some(m => m.is_user)) return;
        const chatId = ctx().getCurrentChatId();
        const ownsChat = () => ctx().getCurrentChatId() === chatId;
        await onRulesAuditMessage(id, {
            send, ownsChat,
            generate: type => setTimeout(() => { if (ownsChat()) void Promise.resolve(ctx().generate(type)).catch(e => console.error('[Rules engine] redo failed:', e)); }, 75),
            toast: text => toastr.warning(text, 'Rule check', { timeOut: 12000 }),
        }).catch(e => console.warn('[Rules engine] rule check skipped:', e));
    });
    on(ev.MESSAGE_SWIPED, (id: number) => { if (live()) onRulesSwiped(id); });
    // The line sent keeps the knob's stop before the turn's passes read it.
    const sent = (ev as Record<string, string | undefined>).MESSAGE_SENT ?? ev.USER_MESSAGE_RENDERED;
    if (sent) on(sent, (id: number) => keepFaith(id));
    // The music follows the scene's feelings: a new chat, the player's line drawn, a reply after the engine decided its turn.
    for (const e of [ev.CHAT_CHANGED, ev.USER_MESSAGE_RENDERED, ev.MESSAGE_RECEIVED]) if (e) on(e, () => { try { musicNow(); } catch (err) { console.warn('[Rules engine] music skipped:', err); } });
    // The tracked people's voices are simulated in the background from the chat's opening, and the plates redrawn once known.
    for (const e of [ev.CHAT_CHANGED, ev.MESSAGE_RECEIVED]) if (e) on(e, () => { void voicesReady(trackedPeople()).then(() => { if (boxOn()) showBox(); }).catch(err => console.warn('[Rules engine] voice skipped:', err)); });
    on(ev.CHAT_CHANGED, () => { metShown.clear(); document.body.classList.remove('rules-card-on'); if (live()) syncRulesToChat(); refreshTime(); applyWorld(getBook()); renderBook(); drawNotes(); typesetChat(); boxAt = null; figureSrc = null; showBox(); });
    on(ev.MESSAGE_DELETED, () => { if (live()) syncRulesToChat(); drawNotes(); showBox(); });
    // The reading notes follow the chat as it is drawn: a new or re-drawn message, older messages loaded, an edit (a line
    // edited since its reading shows no note, ui.ts notesOf).
    for (const e of [ev.USER_MESSAGE_RENDERED, ev.CHARACTER_MESSAGE_RENDERED, ev.MESSAGE_UPDATED, ev.MORE_MESSAGES_LOADED]) if (e) on(e, (id?: unknown) => {
        drawNotes(); typesetChat();
        // A message just drawn (the player's line, a reply) is read from its first unit.
        if ((e === ev.USER_MESSAGE_RENDERED || e === ev.CHARACTER_MESSAGE_RENDERED) && (typeof id === 'number' || typeof id === 'string')) boxAt = { mes: String(id), unit: 0 };
        showBox();
    });
    // PassTime moves the clock; the field follows after each reply.
    on(ev.MESSAGE_RECEIVED, () => refreshTime());
}

(async () => {
    registerRulesTools(settings().enabled);
    // Constrained decoding on by default; a connection that refuses it turns it off on the first refusal (send above).
    setGuided(true);
    void loadColex(); void loadLanguageYears(); void loadThings(); void loadChat(); void loadPopulation();
    wireEvents();
    registerRulesStatsCommand();
    const c = ctx() as Ctx & { SlashCommand?: { fromProps(p: object): unknown }; SlashCommandParser?: { addCommandObject(x: unknown): void } };
    c.SlashCommandParser?.addCommandObject(c.SlashCommand!.fromProps({ name: 'rules-pulse-test', helpString: 'Runs the body simulation (Pulse) for 2 minutes of a leg bleed and reports the vital signs and the time it took.', callback: async () => {
        // A command's return value is not shown in the chat, so the result appears as a notice that stays until tapped.
        const t = (globalThis as { toastr?: { info: (m: string) => void; success: (m: string, t: string, o: object) => void } }).toastr;
        t?.info('Pulse test running (up to a minute)…');
        const r = await pulseSelfTest();
        t?.success(r, 'Pulse', { timeOut: 0, extendedTimeOut: 0 });
        return r;
    } }));
    c.SlashCommandParser?.addCommandObject(c.SlashCommand!.fromProps({ name: 'rules-replay', helpString: 'Replays every recorded change of the world and says whether it rebuilds the current state exactly.', callback: async () => {
        const r = historyCheck();
        (globalThis as { toastr?: { success: (m: string, t: string, o: object) => void } }).toastr?.success(r, 'History', { timeOut: 0, extendedTimeOut: 0 });
        return r;
    } }));
    c.SlashCommandParser?.addCommandObject(c.SlashCommand!.fromProps({ name: 'rules-log', helpString: 'This turn\'s decisions: each call, its arguments, the random draws it used and its result.', callback: async () => turnLog() }));
    registerRulesEvalCommand(send);
    registerTimeCommand();
    registerWorldCommands();
    await buildSettings();
    try { buildVoice(); } catch (e) { console.warn('[Rules engine] voice toolbar skipped:', e); }
    try { buildBox(); } catch (e) { console.warn('[Rules engine] text box skipped:', e); }
    applyLook();
    showBox();
    applyWorld(getBook());
    console.log(`[Rules engine] loaded: ${REGISTRY.size} tools`);
})();
