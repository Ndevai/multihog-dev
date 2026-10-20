// Provider retries, from Simulation Blackboard's retry.js (st1ksi, github.com/st1ksi/Extension-Blackboard, v1.15.0), used
// with its author's permission (2026-10-20). Which errors are worth another try (429, 500, 502, 503, 504, "overloaded"; never
// billing, a bad key or a context overflow), how long to wait (the server's Retry-After, else 60 s doubling to 240 s), and
// when to stop (a cooldown over 10 minutes is handed back instead of waited out).
export interface RetryInfo { retryable: boolean; status: number; retryAfterMs: number }
export function retryInfo(status: number, body: unknown, header: string | null, now = Date.now()): RetryInfo {
    const text = typeof body === 'string' ? body : JSON.stringify(body ?? '');
    const b = body as { error?: { code?: unknown }; code?: unknown } | null;
    const code = Number(b?.error?.code ?? b?.code) || status;
    const permanent = /insufficient_quota|billing|payment required|invalid.api.key|unauthenticated|permission.denied|context.length|context.window|token.limit.exceeded/i.test(text);
    const retryable = !permanent && ([429, 500, 502, 503, 504].includes(code) || /RESOURCE_EXHAUSTED|Too Many Requests|temporarily unavailable|overloaded/i.test(text));
    let retryAfterMs = 0;
    if (header) retryAfterMs = /^\d+(\.\d+)?$/.test(header) ? Number(header) * 1000 : Math.max(0, Date.parse(header) - now) || 0;
    return { retryable, status: code || status, retryAfterMs };
}
/** The wait before retry number `attempt` (0-based), or null to stop. */
export function retryDelay(info: RetryInfo, attempt: number, maxRetries = 3): number | null {
    if (!info.retryable || attempt >= maxRetries) return null;
    const delay = Math.max(info.retryAfterMs || 0, Math.min(60000 * 2 ** attempt, 240000));
    return delay > 600000 ? null : delay;
}
