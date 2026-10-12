// Rules Engine for SillyTavern: code decides outcomes, the narrator writes them (docs/df-body-engine.md). Each turn a
// question pass names the outcomes in doubt and the engine decides them; the narrator gets the brief, the story time,
// [BODY], [KNOWS] and [DECIDED] as one system message; a rule check reads the reply and redoes it once when it bends a result.
import { registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat, RULES_BRIEF, RULES_BRIEF_DECIDED, knowledgeInjection, possessionsInjection, scenePosition, questionPassRan, storyTime, setStoryTime, REGISTRY, } from './rules/rules-tools.js';
import { runQuestionPass, decidedInjection } from './rules/question-pass.js';
import { onRulesAuditMessage, takeAuditNote, registerRulesStatsCommand } from './rules/rules-audit.js';
import { registerRulesEvalCommand } from './rules/eval.js';
import { bodyBlock, trackedPeople } from './rules/body-sheet.js';
import { parseStoryTime, formatStoryTime } from './rules/clock.js';
import { sendModel } from './send.js';
import { worldBlock, applyWorld, checkEntry, parseEntry, FILL_SYSTEM } from './rules/world.js';
import { removeWithDescendants, outcomeLine, bornIn } from './rules/counterfactual.js';
import { seededRng } from './rules/body-engine.js';
const NAME = 'rules-engine', KEY = 'rules_engine';
// SillyTavern extension_prompt_types.IN_CHAT and extension_prompt_roles.SYSTEM (public/script.js).
const IN_CHAT = 1, SYSTEM = 0;
// The engine's message sits this many messages above the end of the chat: 1 = just above the player's last message.
const DEPTH = 1;
const DEFAULTS = { enabled: true, questionPass: true, ruleCheck: true, profile: '', maxTokens: 0 };
const ctx = () => SillyTavern.getContext();
const toastr = globalThis.toastr;
function settings() {
    const all = ctx().extensionSettings;
    all[NAME] = { ...DEFAULTS, ...(all[NAME] || {}) };
    return all[NAME];
}
const send = (system, user) => { const s = settings(); return sendModel(system, user, { profile: s.profile, maxTokens: s.maxTokens }); };
// Card text shown to the question model, characters per field [ASSUMED]: enough for species, build and training.
const CARD_CHARS = 1500;
/** The player's persona, the character card and the scenario: where species, build and training are written. */
function castBlock() {
    const c = ctx();
    const raw = c.getCharacterCardFields?.() ?? {};
    const field = (k) => { const v = raw[k]; return String((typeof v === 'function' ? v() : v) ?? '').trim().slice(0, CARD_CHARS); };
    const lines = [
        field('persona') && `${c.name1 || 'Player'} (the player's character): ${field('persona')}`,
        field('description') && `${c.name2 || 'Character'}: ${field('description')}`,
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
/** Drafts an entry from one line, shows it for editing, and saves what the user approves. */
async function addEntry(line) {
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
        cause: m[2] != null ? `${name} died before ${year}.` : `${name} never lived.`, reaches: ['daily life'], reflections: [...people, ...outcomes.map(outcomeLine)].slice(0, 15) });
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
        name: 'world-list', helpString: 'Show this card\'s world book.',
        callback: async () => worldBlock(getBook(), scenePosition()) || 'The world book is empty: the world is real history.',
    }));
}
/** What the question model and the narrator read about the story now: time and bodies. */
function storyState() {
    const t = storyTime();
    return [worldBlock(getBook(), scenePosition()), t === null ? '' : `[TIME]\n${formatStoryTime(t)}\n[/TIME]`, bodyBlock(trackedPeople()), possessionsInjection()].filter(Boolean).join('\n');
}
globalThis.rulesEngineInterceptor = async (chat, _size, _abort, type) => {
    const s = settings(), c = ctx();
    c.setExtensionPrompt(KEY, '', IN_CHAT, DEPTH);
    if (!s.enabled || !c.chatMetadata || ['quiet', 'impersonate'].includes(type))
        return;
    if (s.questionPass && type !== 'continue') {
        try {
            await runQuestionPass(chat, send, [storyState(), castBlock()].filter(Boolean).join('\n'));
        }
        catch (e) {
            console.warn('[Rules engine] question pass skipped:', e);
        }
    }
    const parts = [questionPassRan() ? RULES_BRIEF_DECIDED : RULES_BRIEF, storyState(), knowledgeInjection(), decidedInjection(), takeAuditNote() ?? ''];
    c.setExtensionPrompt(KEY, parts.filter(Boolean).join('\n\n'), IN_CHAT, DEPTH, false, SYSTEM);
};
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
    const profile = document.getElementById('rules_engine_profile');
    const profiles = ctx().extensionSettings.connectionManager?.profiles ?? [];
    for (const p of profiles)
        profile.add(new Option(p.name, p.id));
    profile.value = profiles.some(p => p.id === s.profile) ? s.profile : '';
    profile.addEventListener('change', () => { settings().profile = profile.value; ctx().saveSettingsDebounced(); });
    const tokens = document.getElementById('rules_engine_max_tokens');
    tokens.value = String(s.maxTokens || '');
    tokens.addEventListener('change', () => { settings().maxTokens = Math.max(0, Number(tokens.value) || 0); ctx().saveSettingsDebounced(); });
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
function wireEvents() {
    const c = ctx(), on = c.eventSource.on.bind(c.eventSource), ev = c.eventTypes;
    const live = () => settings().enabled && !!ctx().chatMetadata;
    on(ev.GENERATION_STARTED, (type) => { if (live())
        onRulesGenerationStarted(type); });
    on(ev.MESSAGE_RECEIVED, (id) => { if (live())
        onRulesMessageReceived(id); });
    on(ev.MESSAGE_RECEIVED, async (id) => {
        // A greeting has no player turn to check against.
        if (!live() || !settings().ruleCheck || !ctx().chat.some(m => m.is_user))
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
    on(ev.CHAT_CHANGED, () => { if (live())
        syncRulesToChat(); refreshTime(); applyWorld(getBook()); renderBook(); });
    on(ev.MESSAGE_DELETED, () => { if (live())
        syncRulesToChat(); });
    // PassTime moves the clock; the field follows after each reply.
    on(ev.MESSAGE_RECEIVED, () => refreshTime());
}
(async () => {
    registerRulesTools(settings().enabled);
    wireEvents();
    registerRulesStatsCommand();
    registerRulesEvalCommand(send);
    registerTimeCommand();
    registerWorldCommands();
    await buildSettings();
    applyWorld(getBook());
    console.log(`[Rules engine] loaded: ${REGISTRY.size} tools`);
})();
