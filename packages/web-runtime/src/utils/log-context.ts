/**
 * Web App Log Context Builder
 * 
 * Provides standardized log context creation for web app pages, components, and API routes.
 * Ensures consistent log structure with single requestId per request lifecycle.
 * 
 * This is the web app equivalent of edge function context builders like createDataApiContext.
 */

import { generateRequestId } from './request-context.ts';
import { toLogContextValue, type LogContext } from '../logger.ts';

export interface WebAppLogContext extends LogContext {
  requestId: string;
  route?: string;
  operation?: string;
}

/**
 * Create standardized log context for web app pages/components
 * 
 * @param route - The route path (e.g., '/account/jobs', '/api/templates')
 * @param operation - The operation name (e.g., 'JobsPage', 'TemplatesAPI')
 * @param options - Additional context fields
 * @returns Standardized log context with single requestId
 * 
 * @example
 * ```ts
 * const logContext = createWebAppContext('/account/jobs', 'JobsPage', {
 *   userId: user.id,
 *   page: 1
 * });
 * logger.info('Jobs loaded', logContext);
 * ```
 */
export function createWebAppContext(
  route: string,
  operation: string,
  options?: Record<string, unknown>
): WebAppLogContext {
  const requestId = generateRequestId();
  const context: WebAppLogContext = {
    requestId,
    route,
    operation,
  };
  
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      context[key] = toLogContextValue(value);
    }
  }
  
  return context;
}

/**
 * Create log context with pre-generated requestId
 * Use this when you've already generated a requestId at the component/function start
 * 
 * @param requestId - Pre-generated request ID (should be generated once per request)
 * @param route - The route path
 * @param operation - The operation name
 * @param options - Additional context fields
 * @returns Standardized log context
 * 
 * @example
 * ```ts
 * const requestId = generateRequestId(); // Generate once at component start
 * const logContext = createWebAppContextWithId(requestId, '/account/jobs', 'JobsPage');
 * logger.info('Jobs loaded', logContext);
 * logger.error('Failed to load', error, logContext);
 * ```
 */
export function createWebAppContextWithId(
  requestId: string,
  route: string,
  operation: string,
  options?: Record<string, unknown>
): WebAppLogContext {
  const context: WebAppLogContext = {
    requestId,
    route,
    operation,
  };
  
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      context[key] = toLogContextValue(value);
    }
  }
  
  return context;
}

/**
 * Helper to add duration to log context
 * 
 * @param context - Base log context
 * @param startTime - Start time in milliseconds (from Date.now())
 * @returns Context with duration_ms field
 */
export function withDuration(
  context: WebAppLogContext,
  startTime: number
): WebAppLogContext {
  return {
    ...context,
    duration_ms: Date.now() - startTime,
  };
}
