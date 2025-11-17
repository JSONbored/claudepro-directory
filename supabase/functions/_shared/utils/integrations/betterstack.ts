/**
 * BetterStack monitoring utilities
 * Handles heartbeat calls for scheduled tasks
 */

import type { BaseLogContext } from '../logging.ts';
import { logWarn } from '../logging.ts';
import { TIMEOUT_PRESETS, withTimeout } from '../timeout.ts';

/**
 * Send BetterStack heartbeat
 * @param url - Heartbeat URL (optional)
 * @param failedCount - Number of failed operations (0 = success)
 * @param logContext - Logging context
 */
export async function sendBetterStackHeartbeat(
  url: string | undefined,
  failedCount: number,
  logContext: BaseLogContext
): Promise<void> {
  if (!url) {
    return;
  }

  const heartbeatUrl = failedCount === 0 ? url : `${url}/fail`;

  await withTimeout(
    fetch(heartbeatUrl, { method: 'GET' }),
    TIMEOUT_PRESETS.external,
    'BetterStack heartbeat timed out'
  ).catch((error) => {
    logWarn('BetterStack heartbeat failed', {
      ...logContext,
      error: error instanceof Error ? error.message : String(error),
    });
  });
}
