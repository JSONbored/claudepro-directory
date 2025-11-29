/**
 * BetterStack monitoring utilities
 * Handles heartbeat calls for scheduled tasks
 */

import { logWarn } from '@heyclaude/shared-runtime/logging.ts';
import { TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime/timeout.ts';

/**
 * Send a BetterStack heartbeat for a scheduled task and record failures.
 *
 * If `url` is undefined the function returns without performing any request.
 *
 * @param url - Heartbeat endpoint; when omitted no request is sent
 * @param failedCount - Number of failed operations; when equal to 0 the success endpoint is called, otherwise `/fail` is appended to `url`
 * @param logContext - Additional context merged into the warning log if the heartbeat request fails or times out
 */
export async function sendBetterStackHeartbeat(
  url: string | undefined,
  failedCount: number,
  logContext: Record<string, unknown>
): Promise<void> {
  if (!url) {
    return;
  }

  const heartbeatUrl = failedCount === 0 ? url : `${url}/fail`;

  await withTimeout(
    fetch(heartbeatUrl, { method: 'GET' }),
    TIMEOUT_PRESETS.external,
    'BetterStack heartbeat timed out'
  ).catch(async (error) => {
    const { normalizeError } = await import('@heyclaude/shared-runtime');
    logWarn('BetterStack heartbeat failed', {
      ...logContext,
      error: normalizeError(error, "Operation failed").message,
    });
  });
}