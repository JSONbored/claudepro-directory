/**
 * Standardized logging context builders for edge functions
 * Ensures consistent log structure across all functions
 * 
 * @deprecated BaseLogContext interface is deprecated. Use Record<string, unknown> instead.
 * The mixin function automatically injects context from logger.bindings(), so explicit
 * BaseLogContext typing is no longer needed. All context creators now return Record<string, unknown>.
 */
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

import { normalizeError } from './error-handling.ts';
import { createPinoConfig } from './logger/config.ts';

export interface BaseLogContext {
  [key: string]: unknown; // Allow additional fields
  action?: string;
  function: string;
  request_id?: string;
  started_at: string;
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
  options?: { [key: string]: unknown; email?: string; requestId?: string; subscriptionId?: string; }
): Record<string, unknown> {
  const { email, requestId, subscriptionId, ...rest } = options ?? {};
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
  options?: { [key: string]: unknown; app?: string; method?: string; path?: string; requestId?: string; resource?: string; }
): Record<string, unknown> {
  const { path, method, resource, app, requestId, ...rest } = options ?? {};
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
  app?: string;
  filters?: Record<string, unknown>;
  query?: string;
  searchType?: string;
}): Record<string, unknown> {
  return {
    function: options?.app ?? 'public-api',
    action: options?.searchType ?? 'search',
    request_id: crypto.randomUUID(),
    started_at: new Date().toISOString(),
    ...(options?.query === undefined ? {} : { query: options.query }),
    ...(options?.filters === undefined ? {} : { filters: options.filters }),
  };
}

/**
 * Builds a standardized log context for notification router operations.
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
    attempt?: number;
    entryId?: string;
    jobId?: string;
    slug?: string;
    source?: string;
    userId?: string;
  }
): Record<string, unknown> {
  return {
    function: 'notification-router',
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
  branch?: string;
  changelogId?: string;
  deploymentId?: string;
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
    category?: string;
    changelogId?: string;
    contentId?: string;
    jobId?: string;
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
 * Builds a standardized log context for shared utilities.
 *
 * @param utilityName - Name of the utility producing the log
 * @param action - Action performed by the utility
 * @param options - Additional context fields to merge into the returned object
 * @returns A log context object with `function: 'shared-utils'`, `action` set to `${utilityName}.${action}`, a generated `request_id`, a `started_at` timestamp, a `utility` field containing `utilityName`, and any fields from `options`
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
  options?: { method?: string; path?: string; }
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
 * Emit a trace-level log entry using the current logger bindings merged with the provided context.
 *
 * The provided `logContext` is combined with the logger's active bindings (for example request id, operation, user id)
 * before emitting. When the logger's trace level is not enabled, this function performs no action.
 *
 * @param {string} message - The message to record.
 * @param {Record<string, unknown>} logContext - Additional structured fields to include with the log entry; these are merged with the logger's current bindings.
 * @returns {void} No value is returned; the function emits a log entry or no-ops if trace level is disabled.
 * @see {@link logInfo}, {@link logError}, {@link logger.bindings}
 */
export function logTrace(message: string, logContext: Record<string, unknown>): void {
  // Only log if trace level is enabled (avoids unnecessary work)
  // Mixin automatically injects bindings (requestId, operation, userId, etc.) from logger.bindings()
  if (pinoLogger.isLevelEnabled('trace')) {
    pinoLogger.trace(logContext, message);
  }
}

/**
 * Emit an error-level log with optional normalized error information and wait for the logger to flush.
 *
 * Builds a log payload by merging the provided structured `logContext` with the logger's current bindings,
 * attaches a normalized `err` field when `error` is supplied, emits an error-level log via the Pino logger,
 * and awaits completion of the logger's internal flush to increase the likelihood the entry is persisted before
 * execution ends.
 *
 * @param {string} message - Human-readable log message describing the error/event.
 * @param {Record<string, unknown>} logContext - Additional structured fields to include in the log; logger bindings (for example `requestId`, `operation`, `userId`) are merged automatically by the logger mixin.
 * @param {unknown} [error] - Optional error value to normalize and attach as the `err` field in the log entry.
 * @returns {Promise<void>} Resolves once the log has been emitted and the logger flush has completed.
 * @throws {unknown} If the logger's flush callback reports an error; the implementation will attempt to write a diagnostic message to stderr (when available) or `console.error` before rejecting.
 * @see normalizeError
 * @see pinoLogger
 */
export async function logError(message: string, logContext: Record<string, unknown>, error?: unknown): Promise<void> {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  // Only include logContext fields that aren't already in bindings (mixin handles bindings automatically)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error !== null && error !== undefined) {
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
        // Fallback to console.error for Edge Runtime environments
        const errorMessage = `Failed to flush logs: ${err instanceof Error ? err.message : String(err)}\n`;
        // Check for Node.js environment (not Edge Runtime)
        // Use indirect access to avoid Turbopack static analysis warning about process.stderr
        // The globalThis['process'] pattern avoids bundler detection of Node.js APIs
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/strict-boolean-expressions -- Runtime check for Edge compatibility
        const nodeProcess = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>)['process'] as NodeJS.Process | undefined : undefined;
        const stderr = nodeProcess?.stderr;
        if (stderr && typeof stderr.write === 'function') {
          try {
            stderr.write(errorMessage);
          } catch {
            // If write fails, fall back to console (inside flush callback - rule allows this)
            // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- Last resort in flush callback
            console.error(errorMessage);
          }
        } else {
          // Fallback for Edge Runtime environments where process.stderr is not available (inside flush callback)
          // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- Last resort in flush callback
          console.error(errorMessage);
        }
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Emit a warning-level log with the provided structured context and optional error.
 *
 * @param message - The log message
 * @param logContext - Structured context fields to include in the log
 * @param error - Optional error or value to attach as the `err` field; it will be normalized for consistent output
 */
export function logWarn(message: string, logContext: Record<string, unknown>, error?: unknown): void {
  // Build log data - mixin will automatically inject bindings (requestId, operation, userId, etc.)
  const logData: Record<string, unknown> = {
    ...logContext,
  };
  
  if (error !== null && error !== undefined) {
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
    pinoLogger.info(context ?? {}, message);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.warn(context ?? {}, message);
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...context };
    if (error !== null && error !== undefined) {
      // Use normalizeError() for consistent error normalization across codebase
      // Pino's stdSerializers.err will automatically serialize the Error object
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoLogger.error(logData, message);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.debug(context ?? {}, message);
  },
  trace: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.trace(context ?? {}, message);
  },
  fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...context };
    if (error !== null && error !== undefined) {
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
  isLevelEnabled: (level: 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn'): boolean => {
    return pinoLogger.isLevelEnabled(level);
  },
};