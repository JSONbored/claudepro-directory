/**
 * BetterStack monitoring utilities
 * Handles heartbeat calls for scheduled tasks
 */

import { logWarn } from '@heyclaude/shared-runtime';
import { TIMEOUT_PRESETS, withTimeout } from '@heyclaude/shared-runtime';

/**
 * Send BetterStack heartbeat
 * @param url - Heartbeat URL (optional)
 * @param failedCount - Number of failed operations (0 = success)
 * @param logContext - Logging context
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
    const { errorToString } = await import('@heyclaude/shared-runtime');
    logWarn('BetterStack heartbeat failed', {
      ...logContext,
      error: errorToString(error),
    });
  });
}
