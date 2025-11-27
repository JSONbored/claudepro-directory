/**
 * Standardized logging context builders for edge functions
 * Ensures consistent log structure across all functions
 */

export interface BaseLogContext {
  function: string;
  action?: string;
  request_id?: string;
  started_at: string;
  [key: string]: unknown; // Allow additional fields
}

/**
 * Create logContext for email-handler functions
 */
export function createEmailHandlerContext(
  action: string,
  options?: { email?: string; requestId?: string; subscriptionId?: string; [key: string]: unknown }
): BaseLogContext {
  const { email, requestId, subscriptionId, ...rest } = options || {};
  return {
    function: 'email-handler',
    action,
    request_id: requestId ?? crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(email && { email }),
    ...(subscriptionId && { subscription_id: subscriptionId }),
    ...rest, // Include any additional properties
  };
}

/**
 * Create logContext for data-api routes
 */
export function createDataApiContext(
  route: string,
  options?: { path?: string; method?: string; resource?: string; app?: string; requestId?: string; [key: string]: unknown }
): BaseLogContext {
  const { path, method, resource, app, requestId, ...rest } = options || {};
  return {
    function: app ?? 'data-api',
    action: route,
    request_id: requestId ?? crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(path && { path }),
    ...(method && { method }),
    ...(resource && { resource }),
    ...rest, // Include any additional properties
  };
}

/**
 * Create logContext for unified-search
 */
export function createSearchContext(options?: {
  query?: string;
  searchType?: string;
  filters?: Record<string, unknown>;
  app?: string;
}): BaseLogContext {
  return {
    function: options?.app ?? 'public-api',
    action: options?.searchType ?? 'search',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.query !== undefined ? { query: options.query } : {}),
    ...(options?.filters !== undefined ? { filters: options.filters } : {}),
  };
}

/**
 * Create logContext for edge functions (legacy name - used by flux-station and other functions)
 */
export function createNotificationRouterContext(
  action: string,
  options?: {
    jobId?: string;
    entryId?: string;
    slug?: string;
    attempt?: number;
    userId?: string;
    source?: string;
  }
): BaseLogContext {
  return {
    function: 'flux-station',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.jobId && { job_id: options.jobId }),
    ...(options?.entryId && { entry_id: options.entryId }),
    ...(options?.slug && { slug: options.slug }),
    ...(options?.attempt !== undefined && { attempt: options.attempt }),
    ...(options?.userId && { user_id: options.userId }),
    ...(options?.source && { source: options.source }),
  };
}

/**
 * Create logContext for changelog handler
 */
export function createChangelogHandlerContext(options?: {
  deploymentId?: string;
  branch?: string;
  changelogId?: string;
  slug?: string;
}): BaseLogContext {
  return {
    function: 'changelog-handler',
    action: 'sync',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.deploymentId && { deployment_id: options.deploymentId }),
    ...(options?.branch && { branch: options.branch }),
    ...(options?.changelogId && { changelog_id: options.changelogId }),
    ...(options?.slug && { slug: options.slug }),
  };
}

/**
 * Create logContext for discord handler
 */
export function createDiscordHandlerContext(
  notificationType: string,
  options?: {
    contentId?: string;
    jobId?: string;
    changelogId?: string;
    category?: string;
    slug?: string;
  }
): BaseLogContext {
  return {
    function: 'discord-handler',
    action: notificationType,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.contentId && { content_id: options.contentId }),
    ...(options?.jobId && { job_id: options.jobId }),
    ...(options?.changelogId && { changelog_id: options.changelogId }),
    ...(options?.category && { category: options.category }),
    ...(options?.slug && { slug: options.slug }),
  };
}

/**
 * Create logContext for notifications service
 */
export function createNotificationsServiceContext(
  action: string,
  options?: { notificationId?: string; userId?: string }
): BaseLogContext {
  return {
    function: 'notifications-service',
    action,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.notificationId && { notification_id: options.notificationId }),
    ...(options?.userId && { user_id: options.userId }),
  };
}

/**
 * Helper to merge context with additional fields
 */
export function withContext(
  base: BaseLogContext,
  additional: Record<string, unknown>
): BaseLogContext {
  return {
    ...base,
    ...additional,
  };
}

/**
 * Helper to add duration to logContext
 */
export function withDuration(base: BaseLogContext, startTime: number): BaseLogContext {
  return {
    ...base,
    duration_ms: Date.now() - startTime,
  };
}

/**
 * Create logContext for shared utility functions
 * Use this for generic utilities that don't belong to a specific function
 */
export function createUtilityContext(
  utilityName: string,
  action: string,
  options?: Record<string, unknown>
): BaseLogContext {
  return {
    function: 'shared-utils',
    action: `${utilityName}.${action}`,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    utility: utilityName,
    ...options,
  };
}

/**
 * Create logContext for transform-api routes
 */
export function createTransformApiContext(
  route: string,
  options?: { path?: string; method?: string }
): BaseLogContext {
  return {
    function: 'transform-api',
    action: route,
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.path && { path: options.path }),
    ...(options?.method && { method: options.method }),
  };
}

/**
 * Logging functions - use these instead of console.log/error/warn directly
 * All logging should use logContext for consistent structured logging
 * 
 * Now uses Pino logger with centralized configuration for consistent logging
 * across the codebase. Pino automatically handles:
 * - Error serialization (via stdSerializers.err)
 * - Sensitive data redaction (via redact option in config)
 */

import pino from 'pino';
import { createPinoConfig } from './logger/config.ts';

// Create Pino logger instance with centralized configuration
// Pino automatically handles error serialization and redaction
const pinoLogger = pino(createPinoConfig({ service: 'shared-runtime' }));

/**
 * Log an info-level message
 * Mixin function automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 */
export function logInfo(message: string, logContext: Partial<BaseLogContext> & Record<string, unknown>): void {
  // Pino handles redaction automatically via config
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  // Only pass logContext fields that aren't already in bindings (mixin handles bindings automatically)
  pinoLogger.info(logContext, message);
}

/**
 * Log a trace-level message (finest-grained logging)
 * Use for detailed debugging, performance tracing, request/response logging
 * Mixin function automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 */
export function logTrace(message: string, logContext: Partial<BaseLogContext> & Record<string, unknown>): void {
  // Only log if trace level is enabled (avoids unnecessary work)
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  if (pinoLogger.isLevelEnabled('trace')) {
    pinoLogger.trace(logContext, message);
  }
}

/**
 * Log an error-level message
 * Mixin function automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
 * Flushes logs for critical errors to ensure they're written
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 * @param error - Optional error object to include in log
 */
export function logError(message: string, logContext: Partial<BaseLogContext> & Record<string, unknown>, error?: unknown): void {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  // Only include logContext fields that aren't already in bindings (mixin handles bindings automatically)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logData['err'] = errorObj;
  }
  
  // Pino's mixin function will automatically inject:
  // - requestId, operation, function (from logger.bindings())
  // - userId, method, route, path (from logger.bindings())
  // - category, slug, correlationId (from logger.bindings())
  pinoLogger.error(logData, message);
  
  // Flush logs synchronously for errors to ensure they're written before response
  // This is especially important in edge functions where execution may terminate quickly
  pinoLogger.flush();
}

/**
 * Log a warning-level message
 * Mixin function automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 * @param error - Optional error object to include in log
 */
export function logWarn(message: string, logContext: Partial<BaseLogContext> & Record<string, unknown>, error?: unknown): void {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logData['err'] = errorObj;
  }
  
  // Pino handles redaction automatically via config
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  pinoLogger.warn(logData, message);
}

/**
 * Lightweight Logger for Shared Runtime
 * Compatible with Web Runtime Logger interface
 * Now uses Pino for consistent logging across the codebase
 */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.info(context || {}, message);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.warn(context || {}, message);
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logData['err'] = errorObj;
    }
    pinoLogger.error(logData, message);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.debug(context || {}, message);
  },
  trace: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.trace(context || {}, message);
  },
  fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logData['err'] = errorObj;
    }
    pinoLogger.fatal(logData, message);
  },
  /**
   * Get current logger bindings (context that will be included in all logs)
   */
  bindings: (): Record<string, unknown> => {
    return pinoLogger.bindings();
  },
  /**
   * Update logger bindings dynamically (adds to existing bindings)
   */
  setBindings: (bindings: Record<string, unknown>): void => {
    pinoLogger.setBindings(bindings);
  },
  /**
   * Flush buffered logs synchronously
   */
  flush: (callback?: (err?: Error) => void): void => {
    pinoLogger.flush(callback);
  },
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => {
    return pinoLogger.isLevelEnabled(level);
  },
};
