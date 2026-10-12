// Rules Engine for SillyTavern: code decides outcomes, the narrator writes them (docs/df-body-engine.md). Each turn a
// question pass names the outcomes in doubt and the engine decides them; the narrator gets the brief, the story time,
// [BODY], [KNOWS] and [DECIDED] as one system message; a rule check reads the reply and redoes it once when it bends a result.
import {
    registerRulesTools, onRulesGenerationStarted, onRulesMessageReceived, onRulesSwiped, syncRulesToChat,
    RULES_BRIEF, RULES_BRIEF_DECIDED, knowledgeInjection, possessionsInjection, questionPassRan, storyTime, setStoryTime, REGISTRY,
} from './rules/rules-tools.js';
import { runQuestionPass, decidedInjection } from './rules/question-pass.js';
import { onRulesAuditMessage, takeAuditNote, registerRulesStatsCommand } from './rules/rules-audit.js';
import { registerRulesEvalCommand } from './rules/eval.js';
import { bodyBlock, trackedPeople } from './rules/body-sheet.js';
import { parseStoryTime, formatStoryTime } from './rules/clock.js';
import { sendModel } from './send.js';

const NAME = 'rules-engine', KEY = 'rules_engine';
// SillyTavern extension_prompt_types.IN_CHAT and extension_prompt_roles.SYSTEM (public/script.js).
const IN_CHAT = 1, SYSTEM = 0;
// The engine's message sits this many messages above the end of the chat: 1 = just above the player's last message.
const DEPTH = 1;

interface Settings { enabled: boolean; questionPass: boolean; ruleCheck: boolean; profile: string; maxTokens: number }
const DEFAULTS: Settings = { enabled: true, questionPass: true, ruleCheck: true, profile: '', maxTokens: 0 };

interface Ctx {
    chat: STMessage[]; chatMetadata: Record<string, any>; extensionSettings: Record<string, any>;
    eventSource: { on(e: string, f: (...a: any[]) => unknown): void }; eventTypes: Record<string, string>;
    setExtensionPrompt(key: string, value: string, position: number, depth: number, scan?: boolean, role?: number): void;
    saveSettingsDebounced(): void; getCurrentChatId(): string | undefined; generate(type: string): Promise<unknown>;
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

const send = (system: string, user: string) => { const s = settings(); return sendModel(system, user, { profile: s.profile, maxTokens: s.maxTokens }); };

// Card text shown to the question model, characters per field [ASSUMED]: enough for species, build and training.
const CARD_CHARS = 1500;
/** The player's persona, the character card and the scenario: where species, build and training are written. */
function castBlock(): string {
    const c = ctx() as Ctx & { name1?: string; name2?: string; getCharacterCardFields?: () => Record<string, unknown> };
    const raw = c.getCharacterCardFields?.() ?? {};
    const field = (k: string) => { const v = raw[k]; return String((typeof v === 'function' ? v() : v) ?? '').trim().slice(0, CARD_CHARS); };
    const lines = [
        field('persona') && `${c.name1 || 'Player'} (the player's character): ${field('persona')}`,
        field('description') && `${c.name2 || 'Character'}: ${field('description')}`,
        field('scenario') && `Scenario: ${field('scenario')}`,
    ].filter(Boolean);
    return lines.length ? `[CAST]\n${lines.join('\n')}\n[/CAST]` : '';
}

/** What the question model and the narrator read about the story now: time and bodies. */
function storyState(): string {
    const t = storyTime();
    return [t === null ? '' : `[TIME]\n${formatStoryTime(t)}\n[/TIME]`, bodyBlock(trackedPeople()), possessionsInjection()].filter(Boolean).join('\n');
}

(globalThis as Record<string, unknown>).rulesEngineInterceptor = async (chat: STMessage[], _size: number, _abort: unknown, type: string) => {
    const s = settings(), c = ctx();
    c.setExtensionPrompt(KEY, '', IN_CHAT, DEPTH);
    if (!s.enabled || !c.chatMetadata || ['quiet', 'impersonate'].includes(type)) return;
    if (s.questionPass && type !== 'continue') {
        try { await runQuestionPass(chat, send, [storyState(), castBlock()].filter(Boolean).join('\n')); } catch (e) { console.warn('[Rules engine] question pass skipped:', e); }
    }
    const parts = [questionPassRan() ? RULES_BRIEF_DECIDED : RULES_BRIEF, storyState(), knowledgeInjection(), decidedInjection(), takeAuditNote() ?? ''];
    c.setExtensionPrompt(KEY, parts.filter(Boolean).join('\n\n'), IN_CHAT, DEPTH, false, SYSTEM);
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
    const bind = (id: string, key: 'enabled' | 'questionPass' | 'ruleCheck', after?: () => void) => {
        const el = document.getElementById(id) as HTMLInputElement;
        el.checked = s[key];
        el.addEventListener('change', () => { settings()[key] = el.checked; ctx().saveSettingsDebounced(); after?.(); });
    };
    bind('rules_engine_enabled', 'enabled', () => registerRulesTools(settings().enabled));
    bind('rules_engine_question_pass', 'questionPass');
    bind('rules_engine_rule_check', 'ruleCheck');
    const profile = document.getElementById('rules_engine_profile') as HTMLSelectElement;
    const profiles: { id: string; name: string }[] = ctx().extensionSettings.connectionManager?.profiles ?? [];
    for (const p of profiles) profile.add(new Option(p.name, p.id));
    profile.value = profiles.some(p => p.id === s.profile) ? s.profile : '';
    profile.addEventListener('change', () => { settings().profile = profile.value; ctx().saveSettingsDebounced(); });
    const tokens = document.getElementById('rules_engine_max_tokens') as HTMLInputElement;
    tokens.value = String(s.maxTokens || '');
    tokens.addEventListener('change', () => { settings().maxTokens = Math.max(0, Number(tokens.value) || 0); ctx().saveSettingsDebounced(); });
    const time = document.getElementById('rules_engine_time') as HTMLInputElement;
    time.addEventListener('change', () => {
        const t = parseStoryTime(time.value);
        if (t === null) { toastr.warning('Use 1850-03-14 18:40, 1850-03-14, or Day 3 07:15.', 'Story time'); refreshTime(); return; }
        if (ctx().chatMetadata) { setStoryTime(t); refreshTime(); }
    });
    refreshTime();
}

/** This extension's folder under scripts/extensions/third-party, from the URL this module loaded from. */
const folder = () => decodeURIComponent(new URL('.', import.meta.url).pathname.replace(/\/src\/$/, '').split('/').pop() || NAME);

function wireEvents(): void {
    const c = ctx(), on = c.eventSource.on.bind(c.eventSource), ev = c.eventTypes;
    const live = () => settings().enabled && !!ctx().chatMetadata;
    on(ev.GENERATION_STARTED, (type: string) => { if (live()) onRulesGenerationStarted(type); });
    on(ev.MESSAGE_RECEIVED, (id: number) => { if (live()) onRulesMessageReceived(id); });
    on(ev.MESSAGE_RECEIVED, async (id: number) => {
        // A greeting has no player turn to check against.
        if (!live() || !settings().ruleCheck || !ctx().chat.some(m => m.is_user)) return;
        const chatId = ctx().getCurrentChatId();
        const ownsChat = () => ctx().getCurrentChatId() === chatId;
        await onRulesAuditMessage(id, {
            send, ownsChat,
            generate: type => setTimeout(() => { if (ownsChat()) void Promise.resolve(ctx().generate(type)).catch(e => console.error('[Rules engine] redo failed:', e)); }, 75),
            toast: text => toastr.warning(text, 'Rule check', { timeOut: 12000 }),
        }).catch(e => console.warn('[Rules engine] rule check skipped:', e));
    });
    on(ev.MESSAGE_SWIPED, (id: number) => { if (live()) onRulesSwiped(id); });
    on(ev.CHAT_CHANGED, () => { if (live()) syncRulesToChat(); refreshTime(); });
    on(ev.MESSAGE_DELETED, () => { if (live()) syncRulesToChat(); });
    // PassTime moves the clock; the field follows after each reply.
    on(ev.MESSAGE_RECEIVED, () => refreshTime());
}

(async () => {
    registerRulesTools(settings().enabled);
    wireEvents();
    registerRulesStatsCommand();
    registerRulesEvalCommand(send);
    registerTimeCommand();
    await buildSettings();
    console.log(`[Rules engine] loaded: ${REGISTRY.size} tools`);
})();
