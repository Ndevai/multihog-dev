// One model call for the engine's own passes (question pass, rule check, /rules-eval): a system and a user message in,
// the reply text out. Through a Connection Manager profile when one is chosen, else through SillyTavern's own connection.
// Chat Completion requests stream, so a gateway that closes silent connections (NVIDIA, OpenRouter: about 60 s) keeps
// the request open while a model thinks.
// The model setting of each Chat Completion source (SillyTavern public/scripts/openai.js, oai_settings).
const MODEL_KEYS = {
    openai: 'openai_model', claude: 'claude_model', makersuite: 'google_model', vertexai: 'vertexai_model', openrouter: 'openrouter_model',
    custom: 'custom_model', nanogpt: 'nanogpt_model', cohere: 'cohere_model', groq: 'groq_model', mistralai: 'mistralai_model',
    deepseek: 'deepseek_model', xai: 'xai_model', aimlapi: 'aimlapi_model', siliconflow: 'siliconflow_model', minimax: 'minimax_model',
    electronhub: 'electronhub_model', chutes: 'chutes_model', fireworks: 'fireworks_model', moonshot: 'moonshot_model',
    pollinations: 'pollinations_model', cometapi: 'cometapi_model', perplexity: 'perplexity_model', ai21: 'ai21_model', azure_openai: 'azure_openai_model',
};
/** Text of a reply: a stream generator drained to its last text, or a response object's message content. */
async function textOf(raw) {
    if (raw == null)
        return '';
    if (typeof raw === 'function') {
        let text = '', reasoning = '';
        for await (const c of raw()) {
            if (typeof c === 'string') {
                text = c;
                continue;
            }
            if (typeof c?.text === 'string')
                text = c.text;
            else if (typeof c?.content === 'string')
                text = c.content;
            reasoning = c?.state?.reasoning ?? c?.reasoning ?? reasoning;
        }
        return text || reasoning;
    }
    if (typeof raw === 'string')
        return raw;
    const r = raw;
    return r.content ?? r.message?.content ?? r.choices?.[0]?.message?.content ?? r.choices?.[0]?.text ?? '';
}
export async function sendModel(system, user, opts = {}) {
    const ctx = SillyTavern.getContext();
    const messages = [{ role: 'system', content: system }, { role: 'user', content: user }];
    const maxTokens = opts.maxTokens && opts.maxTokens > 0 ? opts.maxTokens : undefined;
    if (opts.profile && ctx.ConnectionManagerRequestService) {
        return textOf(await ctx.ConnectionManagerRequestService.sendRequest(opts.profile, messages, maxTokens, { stream: true, extractData: true, includePreset: true, includeInstruct: true }));
    }
    const live = ctx.chatCompletionSettings;
    if (ctx.mainApi === 'openai' && live && ctx.ChatCompletionService) {
        const source = live.chat_completion_source;
        return textOf(await ctx.ChatCompletionService.processRequest({
            stream: true, messages, max_tokens: maxTokens, model: live[MODEL_KEYS[source]] || live.openai_model || live.custom_model,
            chat_completion_source: source, custom_url: live.custom_url, reverse_proxy: live.reverse_proxy, proxy_password: live.proxy_password,
            vertexai_region: live.vertexai_region, zai_endpoint: live.zai_endpoint, siliconflow_endpoint: live.siliconflow_endpoint,
            minimax_endpoint: live.minimax_endpoint, custom_include_body: live.custom_include_body,
        }, {}, true));
    }
    if (!ctx.generateRaw)
        throw new Error('No model connection available for the rules engine.');
    return ctx.generateRaw({ systemPrompt: system, prompt: user, trimNames: false, responseLength: maxTokens });
}
