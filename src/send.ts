// One model call for the engine's own passes (question pass, rule check, /rules-eval): a system and a user message in,
// the reply text out. Through a Connection Manager profile when one is chosen, else through SillyTavern's own connection.
// Chat Completion requests stream, so a gateway that closes silent connections (NVIDIA, OpenRouter: about 60 s) keeps
// the request open while a model thinks.

type Chunk = string | { text?: string; content?: string; reasoning?: string; state?: { reasoning?: string } };
type Raw = unknown;
interface SendCtx {
    mainApi?: string;
    chatCompletionSettings?: Record<string, string>;
    ConnectionManagerRequestService?: { sendRequest(id: string, messages: object[], maxTokens: number | undefined, custom: object, overridePayload?: object): Promise<Raw> };
    ChatCompletionService?: { processRequest(data: object, options: object, extractData: boolean, signal?: AbortSignal | null): Promise<Raw> };
    generateRaw?: (o: object) => Promise<string>;
}

// The model setting of each Chat Completion source (SillyTavern public/scripts/openai.js, oai_settings).
const MODEL_KEYS: Record<string, string> = {
    openai: 'openai_model', claude: 'claude_model', makersuite: 'google_model', vertexai: 'vertexai_model', openrouter: 'openrouter_model',
    custom: 'custom_model', nanogpt: 'nanogpt_model', cohere: 'cohere_model', groq: 'groq_model', mistralai: 'mistralai_model',
    deepseek: 'deepseek_model', xai: 'xai_model', aimlapi: 'aimlapi_model', siliconflow: 'siliconflow_model', minimax: 'minimax_model',
    electronhub: 'electronhub_model', chutes: 'chutes_model', fireworks: 'fireworks_model', moonshot: 'moonshot_model',
    pollinations: 'pollinations_model', cometapi: 'cometapi_model', perplexity: 'perplexity_model', ai21: 'ai21_model', azure_openai: 'azure_openai_model',
};

/** Text of a reply: a stream generator drained to its last text, or a response object's message content. */
async function textOf(raw: Raw): Promise<string> {
    if (raw == null) return '';
    if (typeof raw === 'function') {
        let text = '', reasoning = '';
        for await (const c of (raw as () => AsyncIterable<Chunk>)()) {
            if (typeof c === 'string') { text = c; continue; }
            if (typeof c?.text === 'string') text = c.text; else if (typeof c?.content === 'string') text = c.content;
            reasoning = c?.state?.reasoning ?? c?.reasoning ?? reasoning;
        }
        return text || reasoning;
    }
    if (typeof raw === 'string') return raw;
    const r = raw as { content?: string; message?: { content?: string }; choices?: { message?: { content?: string }; text?: string }[] };
    return r.content ?? r.message?.content ?? r.choices?.[0]?.message?.content ?? r.choices?.[0]?.text ?? '';
}

// Thinking: GLM-5.3's chat template reads reasoning_effort ('low' or 'high'; anything else is maximum; vLLM issue 54744),
// passed as reasoning_effort and in chat_template_kwargs (how NVIDIA's endpoint hands options to the template). Measured with
// tools/run-eval.mjs on NVIDIA, 10 scenes: low 6 min, 9 of 10 right; unset 876 s for one scene, 3 of 10 right in the
// browser run.
const effortBody = (effort?: string) => effort ? { reasoning_effort: effort, chat_template_kwargs: { reasoning_effort: effort } } : {};
const effortYaml = (effort: string | undefined, body = '') => !effort || /chat_template_kwargs|reasoning_effort/.test(body) ? body : `${body ? `${body.trim()}\n` : ''}reasoning_effort: ${effort}\nchat_template_kwargs:\n  reasoning_effort: ${effort}`;

// Constrained decoding (plan-schema.ts): the schema goes out as response_format json_schema, the form the NVIDIA endpoint
// honours for GLM-5.3 (tools/probe-guided.mjs: guided_json and response_format pass, nvext is refused), and as SillyTavern's
// own json_schema field. For a Custom source the body goes through custom_include_body, which reads YAML; JSON is YAML.
const formatBody = (schema?: Record<string, unknown>) => schema ? { response_format: { type: 'json_schema', json_schema: { name: 'plan', strict: true, schema } } } : {};
const formatYaml = (schema: Record<string, unknown> | undefined, body = '') => !schema ? body : `${body ? `${body.trim()}\n` : ''}response_format: ${JSON.stringify(formatBody(schema).response_format)}`;

export async function sendModel(system: string, user: string, opts: { profile?: string; maxTokens?: number; effort?: string; schema?: Record<string, unknown> } = {}): Promise<string> {
    const ctx = SillyTavern.getContext() as unknown as SendCtx;
    const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
    const maxTokens = opts.maxTokens && opts.maxTokens > 0 ? opts.maxTokens : undefined;
    if (opts.profile && ctx.ConnectionManagerRequestService) {
        return textOf(await ctx.ConnectionManagerRequestService.sendRequest(opts.profile, messages, maxTokens,
            { stream: true, extractData: true, includePreset: true, includeInstruct: true }, { ...effortBody(opts.effort), ...formatBody(opts.schema), ...opts.schema ? { json_schema: { name: 'plan', strict: true, value: opts.schema } } : {} }));
    }
    const live = ctx.chatCompletionSettings;
    if (ctx.mainApi === 'openai' && live && ctx.ChatCompletionService) {
        const source = live.chat_completion_source;
        return textOf(await ctx.ChatCompletionService.processRequest({
            stream: true, messages, max_tokens: maxTokens, model: live[MODEL_KEYS[source]] || live.openai_model || live.custom_model,
            chat_completion_source: source, custom_url: live.custom_url, reverse_proxy: live.reverse_proxy, proxy_password: live.proxy_password,
            vertexai_region: live.vertexai_region, zai_endpoint: live.zai_endpoint, siliconflow_endpoint: live.siliconflow_endpoint,
            minimax_endpoint: live.minimax_endpoint, custom_include_body: source === 'custom' ? formatYaml(opts.schema, effortYaml(opts.effort, live.custom_include_body)) : live.custom_include_body,
            ...(opts.effort ? { reasoning_effort: opts.effort } : {}),
            ...(opts.schema ? { json_schema: { name: 'plan', strict: true, value: opts.schema } } : {}),
        }, {}, true));
    }
    if (!ctx.generateRaw) throw new Error('No model connection available for the rules engine.');
    return ctx.generateRaw({ systemPrompt: system, prompt: user, trimNames: false, responseLength: maxTokens });
}
