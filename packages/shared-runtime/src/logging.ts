/**
 * Standardized logging context builders for edge functions
 * Ensures consistent log structure across all functions
 * 
 * @deprecated BaseLogContext interface is deprecated. Use Record<string, unknown> instead.
 * The mixin function automatically injects context from logger.bindings(), so explicit
 * BaseLogContext typing is no longer needed. All context creators now return Record<string, unknown>.
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
): Record<string, unknown> {
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
): Record<string, unknown> {
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
}): Record<string, unknown> {
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
): Record<string, unknown> {
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
}): Record<string, unknown> {
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
): Record<string, unknown> {
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
): Record<string, unknown> {
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
  base: Record<string, unknown>,
  additional: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...base,
    ...additional,
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
): Record<string, unknown> {
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
): Record<string, unknown> {
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
import { normalizeError } from './error-handling.ts';

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
export function logInfo(message: string, logContext: Record<string, unknown>): void {
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
export function logTrace(message: string, logContext: Record<string, unknown>): void {
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
 * NOTE: This function is async to ensure flush() completes before returning.
 * In edge functions, await this call to ensure logs are written before response.
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 * @param error - Optional error object to include in log
 * @returns Promise that resolves when logs are flushed
 */
export async function logError(message: string, logContext: Record<string, unknown>, error?: unknown): Promise<void> {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  // Only include logContext fields that aren't already in bindings (mixin handles bindings automatically)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error) {
    // Use normalizeError() for consistent error normalization across codebase
    // Pino's stdSerializers.err will automatically serialize the Error object
    const normalized = normalizeError(error, message);
    logData['err'] = normalized;
  }
  
  // Pino's mixin function will automatically inject:
  // - requestId, operation, function (from logger.bindings())
  // - userId, method, route, path (from logger.bindings())
  // - category, slug, correlationId (from logger.bindings())
  pinoLogger.error(logData, message);
  
  // Flush logs for errors to ensure they're written before response
  // This is especially important in edge functions where execution may terminate quickly
  // Use Promise wrapper to await the flush callback
  await new Promise<void>((resolve, reject) => {
    pinoLogger.flush((err) => {
      if (err) {
        // Write directly to stderr as a last resort (can't use logger here to avoid infinite loops)
        // This is the only acceptable use of process.stderr.write in the codebase
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`Failed to flush logs: ${err instanceof Error ? err.message : String(err)}\n`);
        }
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Log a warning-level message
 * Mixin function automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
 * 
 * @param message - Log message
 * @param logContext - Log context (can be partial - mixin will add missing fields from bindings)
 * @param error - Optional error object to include in log
 */
export function logWarn(message: string, logContext: Record<string, unknown>, error?: unknown): void {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error) {
    // Use normalizeError() for consistent error normalization across codebase
    // Pino's stdSerializers.err will automatically serialize the Error object
    const normalized = normalizeError(error, message);
    logData['err'] = normalized;
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
      // Use normalizeError() for consistent error normalization across codebase
      // Pino's stdSerializers.err will automatically serialize the Error object
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
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
      // Use normalizeError() for consistent error normalization across codebase
      // Pino's stdSerializers.err will automatically serialize the Error object
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
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
