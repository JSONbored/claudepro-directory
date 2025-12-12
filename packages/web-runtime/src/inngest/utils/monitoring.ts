/**
 * BetterStack Monitoring Utilities
 * 
 * Modular, feature-flagged monitoring system for Inngest functions and API endpoints.
 * Can be enabled/disabled via feature flags without code changes.
 * 
 * @module web-runtime/inngest/utils/monitoring
 */

import { getEnvVar } from '@heyclaude/shared-runtime';
import { FEATURE_FLAGS } from '@heyclaude/web-runtime/config/unified-config';
import { logger } from '../../logging/server';

/**
 * Check if BetterStack monitoring is enabled
 * 
 * Master switch: Checks 'monitoring.betterstack.enabled' flag
 * If disabled, all monitoring functions return early (no-op)
 */
export function isBetterStackMonitoringEnabled(): boolean {
  return FEATURE_FLAGS['monitoring.betterstack.enabled'] === true;
}

/**
 * Check if Inngest monitoring is enabled
 */
export function isInngestMonitoringEnabled(): boolean {
  return (
    isBetterStackMonitoringEnabled() &&
    FEATURE_FLAGS['monitoring.betterstack.inngest.enabled'] === true
  );
}

/**
 * Check if critical failure monitoring is enabled
 */
export function isCriticalFailureMonitoringEnabled(): boolean {
  return (
    isInngestMonitoringEnabled() &&
    FEATURE_FLAGS['monitoring.betterstack.inngest.critical_failures'] === true
  );
}

/**
 * Check if cron success monitoring is enabled
 */
export function isCronSuccessMonitoringEnabled(): boolean {
  return (
    isInngestMonitoringEnabled() &&
    FEATURE_FLAGS['monitoring.betterstack.inngest.cron_success'] === true
  );
}

/**
 * Check if API endpoint monitoring is enabled
 */
export function isApiEndpointMonitoringEnabled(): boolean {
  if (!isBetterStackMonitoringEnabled()) {
    return false;
  }
  // Check if the flag is explicitly true (handles both literal false and true)
  const flagValue = FEATURE_FLAGS['monitoring.betterstack.api.endpoints'];
  return Boolean(flagValue);
}

/**
 * Send BetterStack heartbeat (non-blocking, feature-flagged)
 * 
 * Follows the same pattern as existing Vercel cron job heartbeats.
 * Heartbeat failures are silent to avoid breaking function execution.
 * 
 * @param envVarName - Environment variable name containing heartbeat URL
 * @param context - Optional context for logging (function name, etc.)
 */
export function sendBetterStackHeartbeat(
  envVarName: string,
  context?: { functionName?: string; eventType?: string; route?: string; method?: string; duration?: number }
): void {
  // Feature flag check - early return if disabled
  if (!isBetterStackMonitoringEnabled()) {
    return; // Silent no-op when disabled
  }

  const heartbeatUrl = getEnvVar(envVarName);
  if (!heartbeatUrl) {
    // Only log in development to avoid noise
    if (process.env.NODE_ENV === 'development') {
      logger.debug(
        { envVarName, ...context },
        'BetterStack heartbeat URL not configured'
      );
    }
    return;
  }

  // Fire and forget - don't await to avoid blocking function execution
  fetch(heartbeatUrl, {
    method: 'GET',
    signal: AbortSignal.timeout(5000), // 5-second timeout
  }).catch(() => {
    // Silent fail - heartbeat is non-critical
    // Don't log to avoid noise in logs
  });
}

/**
 * Send BetterStack heartbeat for critical function failures
 * 
 * Used in Inngest onFailure callbacks.
 * Only sends if critical failure monitoring is enabled.
 * 
 * @param envVarName - Environment variable name (e.g., 'BETTERSTACK_HEARTBEAT_CRITICAL_FAILURE')
 * @param context - Context for logging
 */
export function sendCriticalFailureHeartbeat(
  envVarName: string,
  context?: { functionName?: string; eventType?: string; error?: string }
): void {
  if (!isCriticalFailureMonitoringEnabled()) {
    return; // Silent no-op when disabled
  }

  const heartbeatContext: { functionName?: string; eventType?: string } = {};
  if (context?.functionName) {
    heartbeatContext.functionName = context.functionName;
  }
  if (context?.eventType) {
    heartbeatContext.eventType = context.eventType;
  }

  sendBetterStackHeartbeat(envVarName, heartbeatContext);
}

/**
 * Send BetterStack heartbeat for successful cron function execution
 * 
 * Used at the end of cron-triggered Inngest functions.
 * Only sends if cron success monitoring is enabled.
 * 
 * @param envVarName - Environment variable name (e.g., 'BETTERSTACK_HEARTBEAT_INNGEST_CRON')
 * @param context - Context for logging
 */
export function sendCronSuccessHeartbeat(
  envVarName: string,
  context?: { functionName?: string; result?: unknown }
): void {
  if (!isCronSuccessMonitoringEnabled()) {
    return; // Silent no-op when disabled
  }

  sendBetterStackHeartbeat(envVarName, context);
}

/**
 * Send BetterStack heartbeat for API endpoint success
 * 
 * Used in API route handlers for endpoint monitoring.
 * Only sends if API endpoint monitoring is enabled.
 * 
 * @param envVarName - Environment variable name (e.g., 'BETTERSTACK_HEARTBEAT_API_SEARCH')
 * @param context - Context for logging
 */
export function sendApiEndpointHeartbeat(
  envVarName: string,
  context?: { operation?: string; route?: string; method?: string; duration?: number }
): void {
  if (!isApiEndpointMonitoringEnabled()) {
    return; // Silent no-op when disabled
  }

  sendBetterStackHeartbeat(envVarName, context);
}
