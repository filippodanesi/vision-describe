/**
 * Detects "tokens finished" failures from the Claude API and broadcasts an
 * app-wide signal so the global reload-and-resume dialog can open.
 *
 * Works from anywhere (React hooks or plain utils) via a window CustomEvent,
 * so the call utilities (claudeUtils, visionApiUtils) can fire it without
 * needing React context.
 */
import Anthropic from '@anthropic-ai/sdk';

const QUOTA_EVENT = 'claude-quota-exhausted';

/**
 * True when a Claude call failed because the account ran out of usage:
 * credit balance too low (HTTP 400) or a usage/rate limit (HTTP 429) the retry
 * logic could not clear. These are the cases where retrying right now will not
 * help — the user has to top up or wait, then resume.
 */
export function isQuotaError(err: unknown): boolean {
  if (err instanceof Anthropic.RateLimitError) return true; // 429
  if (err instanceof Anthropic.BadRequestError) {
    return /credit balance|insufficient|quota|too low/i.test(err.message);
  }
  const msg = err instanceof Error ? err.message : String(err);
  return /credit balance (is )?too low|insufficient[^.]*(credit|quota)|\b429\b|rate[\s_-]?limit/i.test(msg);
}

/**
 * Fire the app-wide "Claude quota exhausted" signal. Safe to call from any
 * context; the QuotaExhaustedDialog listens for it.
 */
export function emitQuotaExhausted(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(QUOTA_EVENT));
  }
}

/** Subscribe to the quota-exhausted signal. Returns an unsubscribe function. */
export function onQuotaExhausted(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(QUOTA_EVENT, handler);
  return () => window.removeEventListener(QUOTA_EVENT, handler);
}
