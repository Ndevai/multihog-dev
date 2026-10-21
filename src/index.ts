// Rules Engine for SillyTavern: code decides outcomes, the narrator writes them (docs/df-body-engine.md). Each turn a
// question pass names the outcomes in doubt and the engine decides them; the narrator gets the brief, the story time,
// [BODY], [KNOWS] and [DECIDED] as one system message; a rule check reads the reply and redoes it once when it bends a result.
import { pulseSelfTest } from './rules/pulse.js';
import {
    registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat,
    RULES_BRIEF, RULES_BRIEF_DECIDED, knowledgeInjection, possessionsInjection, scenePosition, questionPassRan, storyTime, setStoryTime, REGISTRY,
    historyCheck,
} from './rules/rules-tools.js';
import { runQuestionPass, decidedInjection, decidedResults, turnLog, setGuided, setOpen, GUIDED, type Chooser } from './rules/question-pass.js';
import { NARRATION_RULE, narrationSchema, readNarration, proseOf } from './rules/narration.js';
import { onRulesAuditMessage, takeAuditNote, registerRulesStatsCommand } from './rules/rules-audit.js';
import { registerRulesEvalCommand } from './rules/eval.js';
import { bodyBlock, trackedPeople } from './rules/body-sheet.js';
import { parseStoryTime, formatStoryTime } from './rules/clock.js';
import { sendModel } from './send.js';
import { worldBlock, applyWorld, checkEntry, parseEntry, FILL_SYSTEM, type Entry } from './rules/world.js';
import { removeWithDescendants, outcomeLine, bornIn, type Outcome } from './rules/counterfactual.js';
import { firstYear, earlier, loadChat } from './rules/history.js';
import { loadPopulation } from './rules/population.js';
import { seededRng } from './rules/body-engine.js';
import { loadColex } from './rules/colex.js';
import { skyLight } from './rules/sky.js';
import { loadLanguageYears } from './rules/languages.js';
import { loadThings } from './rules/things.js';

const NAME = 'rules-engine', KEY = 'rules_engine';
// SillyTavern extension_prompt_types.IN_CHAT and extension_prompt_roles.SYSTEM (public/script.js).
const IN_CHAT = 1, SYSTEM = 0;
// The engine's message sits this many messages above the end of the chat: 1 = just above the player's last message.
const DEPTH = 1;

interface Settings { enabled: boolean; questionPass: boolean; ruleCheck: boolean; structured: boolean; suggest: boolean; profile: string; maxTokens: number; effort: string }
const DEFAULTS: Settings = { enabled: true, questionPass: true, ruleCheck: true, structured: true, suggest: false, profile: '', maxTokens: 0, effort: 'low' };

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
}
const ctx = () => SillyTavern.getContext() as unknown as Ctx;
const toastr = (globalThis as unknown as { toastr: { warning(t: string, h?: string, o?: object): void; info(t: string, h?: string): void } }).toastr;

function settings(): Settings {
    const all = ctx().extensionSettings;
    all[NAME] = { ...DEFAULTS, ...(all[NAME] || {}) };
    return all[NAME];
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

/** Drafts an entry from one line, shows it for editing, and saves what the user approves. */
async function addEntry(line: string): Promise<string> {
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
    const sunUp = t !== null && here && t / 1440 > 146097 ? skyLight(t, here.lat).sunAlt >= 0 : null;
    return [worldBlock(getBook(), here, sunUp), t === null ? '' : `[TIME]\n${formatStoryTime(t)}\n[/TIME]`, bodyBlock(trackedPeople()), possessionsInjection()].filter(Boolean).join('\n');
}

(globalThis as Record<string, unknown>).rulesEngineInterceptor = async (chat: STMessage[], _size: number, _abort: unknown, type: string) => {
    const s = settings(), c = ctx();
    c.setExtensionPrompt(KEY, '', IN_CHAT, DEPTH);
    if (!s.enabled || !c.chatMetadata || ['quiet', 'impersonate'].includes(type)) return;
    if (s.questionPass && type !== 'continue') {
        try {
            const read = await runQuestionPass(chat, send, [storyState(), castBlock()].filter(Boolean).join('\n'), choose);
            if (read.length) toastr.info(read.map(r => `${r.phrase} → ${r.label}${r.year != null ? ` (${r.year})` : ''}`).join('; '), 'Read as');
        } catch (e) { console.warn('[Rules engine] question pass skipped:', e); }
    }
    // Suggestions: for a world that departs far from real history, the engine's outcomes are offered, and the story and the
    // world book decide; the rule check then redoes nothing and the reply is free prose.
    const suggest = settings().suggest;
    const decided = suggest ? decidedInjection().replace(/Narrate them as given; they stand\./, SUGGEST_LINE) : decidedInjection();
    const parts = [!questionPassRan() ? RULES_BRIEF : suggest ? SUGGEST_BRIEF : RULES_BRIEF_DECIDED, storyState(), knowledgeInjection(), decided, takeAuditNote() ?? '', structuredNow() ? NARRATION_RULE : ''];
    c.setExtensionPrompt(KEY, parts.filter(Boolean).join('\n\n'), IN_CHAT, DEPTH, false, SYSTEM);
};

// Two things fit the player's word equally: the player says which (a guess would change what the scene can hold).
const choose: Chooser = async (phrase, [a, b]) => {
    const esc = (t: string) => t.replace(/[&<>"]/g, ch => `&#${ch.charCodeAt(0)};`);
    const c = ctx(), say = (o: typeof a) => esc(`${o.label}${o.year != null ? ` (${o.year})` : ''}`);
    const r = await c.callGenericPopup(`<h3>Which "${esc(phrase)}"?</h3><p>${say(a)}: ${esc(a.description)}</p><p>${say(b)}: ${esc(b.description)}</p>`,
        c.POPUP_TYPE.CONFIRM, '', { okButton: say(a), cancelButton: say(b) });
    return r === 1 ? a.id : r === 0 ? b.id : null;
};

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
    const bind = (id: string, key: 'enabled' | 'questionPass' | 'ruleCheck' | 'structured' | 'suggest', after?: () => void) => {
        const el = document.getElementById(id) as HTMLInputElement;
        el.checked = s[key];
        el.addEventListener('change', () => { settings()[key] = el.checked; ctx().saveSettingsDebounced(); after?.(); });
    };
    bind('rules_engine_enabled', 'enabled', () => registerRulesTools(settings().enabled));
    bind('rules_engine_question_pass', 'questionPass');
    bind('rules_engine_rule_check', 'ruleCheck');
    if (document.getElementById('rules_engine_structured')) bind('rules_engine_structured', 'structured');
    if (document.getElementById('rules_engine_suggest')) bind('rules_engine_suggest', 'suggest');
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
    const msg = c.chat?.[id];
    if (!msg || msg.is_user || msg.is_system) return;
    const nar = readNarration(msg.mes);
    if (!nar) { setOpen([]); return; }
    msg.mes = proseOf(nar);
    msg.extra ??= {};
    ((msg.extra.rulesNarration ??= {}) as Record<number, unknown>)[msg.swipe_id ?? 0] = nar;
    setOpen(nar.open ?? []);
    try { c.updateMessageBlock?.(id, msg); } catch { /* the block is drawn after this event */ }
    c.saveChatDebounced?.();
}

function wireEvents(): void {
    const c = ctx(), on = c.eventSource.on.bind(c.eventSource), ev = c.eventTypes;
    const live = () => settings().enabled && !!ctx().chatMetadata;
    // First of the reply's handlers: the rule check and the saved state read the prose.
    on(ev.MESSAGE_RECEIVED, (id: number) => { if (live()) readReply(id); });
    if (ev.CHAT_COMPLETION_SETTINGS_READY) on(ev.CHAT_COMPLETION_SETTINGS_READY, (data: Record<string, unknown>) => { if (live()) addReplySchema(data); });
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
    on(ev.CHAT_CHANGED, () => { if (live()) syncRulesToChat(); refreshTime(); applyWorld(getBook()); renderBook(); });
    on(ev.MESSAGE_DELETED, () => { if (live()) syncRulesToChat(); });
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
    applyWorld(getBook());
    console.log(`[Rules engine] loaded: ${REGISTRY.size} tools`);
})();
