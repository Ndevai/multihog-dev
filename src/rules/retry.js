export function retryInfo(status, body, header, now = Date.now()) {
    const text = typeof body === 'string' ? body : JSON.stringify(body ?? '');
    const b = body;
    const code = Number(b?.error?.code ?? b?.code) || status;
    const permanent = /insufficient_quota|billing|payment required|invalid.api.key|unauthenticated|permission.denied|context.length|context.window|token.limit.exceeded/i.test(text);
    const retryable = !permanent && ([429, 500, 502, 503, 504].includes(code) || /RESOURCE_EXHAUSTED|Too Many Requests|temporarily unavailable|overloaded/i.test(text));
    let retryAfterMs = 0;
    if (header)
        retryAfterMs = /^\d+(\.\d+)?$/.test(header) ? Number(header) * 1000 : Math.max(0, Date.parse(header) - now) || 0;
    return { retryable, status: code || status, retryAfterMs };
}
/** The wait before retry number `attempt` (0-based), or null to stop. */
export function retryDelay(info, attempt, maxRetries = 3) {
    if (!info.retryable || attempt >= maxRetries)
        return null;
    const delay = Math.max(info.retryAfterMs || 0, Math.min(60000 * 2 ** attempt, 240000));
    return delay > 600000 ? null : delay;
}
