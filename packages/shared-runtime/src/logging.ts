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
 * Builds a logging context object for email-handler functions.
 *
 * @param action - The action name performed by the handler.
 * @param options - Optional contextual fields.
 * @param options.email - The email address involved in the action.
 * @param options.requestId - The request identifier; a UUID is generated if not provided.
 * @param options.subscriptionId - The subscription identifier related to the email.
 * @returns A plain object containing standardized logging fields (`function`, `action`, `request_id`, `started_at`) and any provided additional properties.
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
 * Builds a logging context for data-api route handlers.
 *
 * @param route - The route name or identifier used as the `action` in the returned context.
 * @param options - Optional context pieces:
 *   - `path`: request path
 *   - `method`: HTTP method
 *   - `resource`: resource identifier
 *   - `app`: overrides the `function` field (defaults to `"data-api"`)
 *   - `requestId`: overrides the generated `request_id`
 *   - any other key/value pairs are merged into the resulting context
 * @returns A record containing `function`, `action`, `request_id`, and `started_at`, plus any provided `path`, `method`, `resource`, and additional properties.
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
 * Build a standardized logging context for unified search requests.
 *
 * @param options - Optional fields to include in the context.
 * @param options.query - The search query string to include when present.
 * @param options.searchType - The action name for the search (defaults to `'search'`).
 * @param options.filters - Arbitrary filters to include in the context.
 * @param options.app - The originating application name (defaults to `'public-api'`).
 * @returns A log context object containing `function`, `action`, `request_id`, `started_at`, and any provided `query` or `filters`.
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
 * Builds a standardized log context for notification router (flux-station) operations.
 *
 * @param action - The action name or operation being performed
 * @param options - Optional identifiers and metadata
 * @param options.jobId - External job identifier to include as `job_id`
 * @param options.entryId - Entry identifier to include as `entry_id`
 * @param options.slug - Content or route slug
 * @param options.attempt - Retry or attempt number
 * @param options.userId - User identifier to include as `user_id`
 * @param options.source - Source or origin of the notification
 * @returns The log context object containing `function`, `action`, `request_id`, `started_at`, and any provided optional fields
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
 * Builds a logging context for the changelog handler.
 *
 * The returned object always includes `function: 'changelog-handler'`, `action: 'sync'`,
 * a `request_id` (UUID string), and `started_at` (ISO 8601 timestamp). When provided in
 * `options`, the object also includes `deployment_id`, `branch`, `changelog_id`, and `slug`.
 *
 * @param options - Optional contextual identifiers to include in the log context:
 *   - `deploymentId` — deployment identifier to set as `deployment_id`
 *   - `branch` — branch name
 *   - `changelogId` — changelog identifier to set as `changelog_id`
 *   - `slug` — slug associated with the changelog
 * @returns A record containing standardized log fields for the changelog handler, including
 *          generated `request_id` and `started_at`, plus any provided optional fields.
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
 * Builds a logging context object for Discord handler executions.
 *
 * @param notificationType - The notification type to set as the `action` in the context.
 * @param options - Optional additional context properties.
 * @param options.contentId - Maps to `content_id` when provided.
 * @param options.jobId - Maps to `job_id` when provided.
 * @param options.changelogId - Maps to `changelog_id` when provided.
 * @param options.category - Maps to `category` when provided.
 * @param options.slug - Maps to `slug` when provided.
 * @returns A log context object containing `function`, `action`, `request_id`, `started_at`, and any of the provided optional fields (`content_id`, `job_id`, `changelog_id`, `category`, `slug`). 
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
 * Build a logging context for the notifications service.
 *
 * @param action - The action performed by the service (used as the `action` field)
 * @param options - Optional identifiers to include in the context
 * @param options.notificationId - Notification identifier to include as `notification_id`
 * @param options.userId - User identifier to include as `user_id`
 * @returns A context object containing `function`, `action`, a generated `request_id`, `started_at`, and any provided identifiers
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
 * Create a new log context by combining `base` with `additional`, where `additional` overrides conflicting keys.
 *
 * @param base - The base context object
 * @param additional - Additional fields to merge into the base context
 * @returns A new object containing keys from `base` and `additional`; when the same key exists in both, the value from `additional` is used
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
 * Build a standardized log context for shared utility functions.
 *
 * @param utilityName - Name of the utility producing the log
 * @param action - Action performed by the utility
 * @param options - Additional context fields to merge into the returned object
 * @returns A log context object containing `function: 'shared-utils'`, `action` set to `utilityName.action`, a generated `request_id`, a `started_at` timestamp, a `utility` field, and any provided `options`
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
 * Build a logging context for a transform-api route.
 *
 * @param route - The route name or identifier used as the action in the context
 * @param options - Optional metadata: `path` is the request path, `method` is the HTTP method
 * @returns A context object containing `function: 'transform-api'`, `action` set to `route`, a `request_id` (UUID), `started_at` (ISO timestamp), and optionally `path` and `method`
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
 * Log an informational message with additional structured context.
 *
 * The provided `logContext` object is merged with the logger's current bindings (such as request id, operation, user id); bindings are applied automatically when emitting the log.
 *
 * @param message - The message to record
 * @param logContext - Additional structured fields to include in the log; these are merged with the logger bindings
 */
export function logInfo(message: string, logContext: Record<string, unknown>): void {
  // Pino handles redaction automatically via config
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  // Only pass logContext fields that aren't already in bindings (mixin handles bindings automatically)
  pinoLogger.info(logContext, message);
}

/**
 * Log a trace-level message with the current logger bindings merged into the provided context.
 *
 * The logger will automatically mix in bindings (for example request id, operation, user id) when emitting this entry.
 *
 * @param message - The message to record
 * @param logContext - Context object whose fields will be merged with the logger's current bindings before logging
 */
export function logTrace(message: string, logContext: Record<string, unknown>): void {
  // Only log if trace level is enabled (avoids unnecessary work)
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  if (pinoLogger.isLevelEnabled('trace')) {
    pinoLogger.trace(logContext, message);
  }
}

/**
 * Log an error message with optional error normalization and ensure logs are flushed.
 *
 * @param message - Human-readable log message
 * @param logContext - Additional context fields to include; logger bindings (e.g., requestId, operation, userId) are mixed in automatically
 * @param error - Optional error to normalize and attach as `err` in the log
 * @returns Void when the log flush completes
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
 * Log a warning-level message including provided context and an optional error.
 *
 * @param message - The log message
 * @param logContext - Additional context fields to include; these are merged with the logger's runtime bindings before emitting
 * @param error - Optional error or value to attach as `err` in the log; the value will be normalized for consistent output
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