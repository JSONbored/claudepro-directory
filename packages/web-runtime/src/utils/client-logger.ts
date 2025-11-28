/**
 * Client-Side Logger Utilities
 * 
 * Centralized utilities for consistent client-side logging patterns.
 * All client-side files should use these utilities instead of calling logger directly.
 * 
 * **⚠️ IMPORTANT: Client-Only Module**
 * - ✅ **SAFE** to import in client components (`'use client'`)
 * - ❌ **DO NOT** use in server components (uses browser APIs and client-side patterns)
 * - For server-side logging, use {@link ../logging/server | Server Logging Barrel} instead
 * 
 * **Key Features:**
 * - Automatic session ID injection (via {@link ./client-session | client-session})
 * - Standardized context structure (operation, module, component, action, sessionId)
 * - Performance-optimized (fire-and-forget, batching via Pino browser transmit)
 * - Consistent error normalization (uses same {@link ../errors.normalizeError | normalizeError} as server-side)
 * - Browser transmit enabled (logs forwarded to {@link ../../../apps/web/src/app/api/logs/client/route | /api/logs/client})
 * 
 * **Patterns:**
 * - Client utilities (localStorage, hooks): Use `logClientError()`, `logClientWarn()`, etc.
 * - React components: Use {@link ../hooks/use-client-logger | useClientLogger()} hook
 * - Error boundaries: Use `logClientErrorBoundary()`
 * 
 * **Consistency with Server-Side:**
 * - Uses same {@link ../logger | logger} instance (configured via {@link @heyclaude/shared-runtime/logger/config | createPinoConfig})
 * - Uses same {@link ../errors.normalizeError | normalizeError()} function
 * - Uses same message-first API: `logger.error(message, error, context)`
 * - Uses same context structure (operation, module, component)
 * - Browser transmit automatically forwards error/warn logs to server (production only)
 * 
 * **Production Behavior:**
 * - Console logging disabled (users don't see logs)
 * - Browser transmit enabled (logs sent to server via `/api/logs/client`)
 * - Only error/warn logs transmitted (reduces network traffic)
 * 
 * @module web-runtime/utils/client-logger
 * @see {@link ../logging/client | Client Logging Barrel} - Recommended import path for client components
 * @see {@link ./client-session | Client Session Management} - Session ID generation
 * @see {@link ../hooks/use-client-logger | useClientLogger Hook} - React hook for components
 * @see {@link ../logger | Logger Instance} - Main logger instance
 * @see {@link ../errors.normalizeError | normalizeError} - Error normalization
 * @see {@link @heyclaude/shared-runtime/logger/config | Pino Configuration} - Centralized logger config
 * @see {@link ../../../apps/web/src/app/api/logs/client/route | Client Logs API} - Server endpoint for log forwarding
 */

import { normalizeError } from '../errors.ts';
import { logger, toLogContextValue, type LogContext } from '../logger.ts';
import { getOrCreateSessionId } from './client-session.ts';

/**
 * Base context for all client-side logs
 * 
 * Includes session ID for correlation across page navigations.
 * All client-side log context should extend this interface.
 * 
 * **Field Semantics:**
 * - `operation`: Operation name (required, e.g., 'DraftManager.save')
 * - `module`: Codebase module identifier (e.g., 'data/drafts', 'hooks/use-local-storage')
 * - `component`: Component/class name (e.g., 'DraftManager', 'MyComponent')
 * - `action`: Specific action within component (e.g., 'save', 'handleClick')
 * - `sessionId`: Session ID for correlation (automatically injected by {@link createClientLogContext})
 * 
 * @remarks
 * This interface matches the context structure used server-side, ensuring consistency.
 * The `sessionId` field is unique to client-side logs (server-side uses `requestId`).
 * 
 * @see {@link createClientLogContext} - Creates context with automatic session ID injection
 * @see {@link ../utils/log-context.WebAppLogContext | WebAppLogContext} - Server-side equivalent
 */
export interface ClientLogContext {
  /** Operation name (required) */
  operation: string;
  /** Codebase module identifier (e.g., 'data/drafts') */
  module?: string;
  /** Component/class name (e.g., 'DraftManager') */
  component?: string;
  /** Specific action within component (e.g., 'save') */
  action?: string;
  /** Session ID for correlation across page navigations (automatically injected) */
  sessionId: string;
  /** Additional context fields */
  [key: string]: unknown;
}

/**
 * Create standardized client-side log context
 * 
 * Automatically includes session ID and standardizes field names.
 * This is the foundation for all client-side logging - all other functions use this internally.
 * 
 * **Automatic Features:**
 * - Session ID injection (via {@link ./client-session.getOrCreateSessionId | getOrCreateSessionId()})
 * - Field standardization (operation, module, component, action)
 * - Additional context merging
 * 
 * @param operation - Operation name (required, e.g., 'DraftManager.save')
 * @param options - Additional context fields (module, component, action, and any custom fields)
 * @returns Standardized log context with session ID
 * 
 * @example
 * ```typescript
 * // Basic usage
 * const context = createClientLogContext('DraftManager.save', {
 *   module: 'data/drafts',
 *   component: 'DraftManager',
 *   action: 'save',
 *   key: this.key,
 * });
 * logger.warn('Failed to save', error, context);
 * 
 * // With custom fields
 * const context = createClientLogContext('UserAction.handleSubmit', {
 *   component: 'UserAction',
 *   formId: 'contact-form',
 *   userId: user.id,
 * });
 * logger.error('Form submission failed', error, context);
 * ```
 * 
 * @see {@link ./client-session.getOrCreateSessionId | getOrCreateSessionId} - Session ID generation
 * @see {@link logClientError} - Higher-level function that uses this internally
 * @see {@link ../hooks/use-client-logger | useClientLogger} - React hook that uses this
 */
export function createClientLogContext(
  operation: string,
  options?: {
    module?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  }
): ClientLogContext {
  const context: ClientLogContext = {
    operation,
    sessionId: getOrCreateSessionId(),
  };
  
  // Only add optional fields if they're defined (exactOptionalPropertyTypes compliance)
  if (options?.module !== undefined) {
    context.module = options.module;
  }
  if (options?.component !== undefined) {
    context.component = options.component;
  }
  if (options?.action !== undefined) {
    context.action = options.action;
  }
  
  // Include any additional fields
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      if (!['module', 'component', 'action'].includes(key) && value !== undefined) {
        context[key] = value;
      }
    }
  }
  
  return context;
}

/**
 * Log a client-side error with standardized context
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance (same as server-side)
 * - Uses {@link ../errors.normalizeError | normalizeError()} (same as server-side)
 * - Message-first API: `logger.error(message, error, context)` (matches server-side pattern)
 * - Context structure matches existing patterns (operation, module, component)
 * - Browser transmit automatically forwards to server (production only)
 * 
 * **Performance:**
 * - Fire-and-forget (doesn't block UI)
 * - Error normalization is synchronous and fast
 * - Session ID retrieved once per call (cached in sessionStorage)
 * 
 * @param message - Error message (required)
 * @param error - Error object (will be normalized via {@link ../errors.normalizeError | normalizeError})
 * @param operation - Operation name (required, e.g., 'DraftManager.save')
 * @param options - Additional context fields (module, component, action, and custom fields)
 * 
 * @example
 * ```typescript
 * // Basic usage
 * logClientError('Failed to save draft', error, 'DraftManager.save', {
 *   module: 'data/drafts',
 *   component: 'DraftManager',
 *   key: this.key,
 * });
 * 
 * // With action
 * logClientError('Form submission failed', error, 'ContactForm.submit', {
 *   component: 'ContactForm',
 *   action: 'submit',
 *   formId: 'contact-form',
 * });
 * ```
 * 
 * @see {@link createClientLogContext} - Creates the standardized context
 * @see {@link ../errors.normalizeError | normalizeError} - Error normalization
 * @see {@link ../logger | logger} - Main logger instance
 * @see {@link logClientWarn} - For warnings (non-critical errors)
 * @see {@link ../hooks/use-client-logger | useClientLogger} - React hook alternative
 */
export function logClientError(
  message: string,
  error: unknown,
  operation: string,
  options?: {
    module?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  }
): void {
  const normalized = normalizeError(error, message);
  const clientContext = createClientLogContext(operation, options);
  // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
  const context: LogContext = Object.fromEntries(
    Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
  ) as LogContext;
  logger.error(message, normalized, context);
}

/**
 * Log a client-side warning with standardized context
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance
 * - Uses {@link ../errors.normalizeError | normalizeError()} when error provided
 * - Message-first API: `logger.warn(message, error?, context)` (matches server-side pattern)
 * - Context structure matches existing patterns
 * - Browser transmit automatically forwards to server (production only)
 * 
 * **When to Use:**
 * - Non-critical errors (recoverable issues)
 * - Deprecation warnings
 * - Data validation warnings
 * - Version mismatches
 * 
 * @param message - Warning message (required)
 * @param error - Error object (optional, will be normalized if provided)
 * @param operation - Operation name (required, e.g., 'DraftManager.loadRaw')
 * @param options - Additional context fields (module, component, action, and custom fields)
 * 
 * @example
 * ```typescript
 * // Warning without error
 * logClientWarn('Draft version mismatch', undefined, 'DraftManager.loadRaw', {
 *   module: 'data/drafts',
 *   stored: draft.version,
 *   current: DraftManager.VERSION,
 * });
 * 
 * // Warning with error
 * logClientWarn('Failed to sync localStorage', error, 'useLocalStorage.sync', {
 *   component: 'useLocalStorage',
 *   key: 'user-preferences',
 * });
 * ```
 * 
 * @see {@link createClientLogContext} - Creates the standardized context
 * @see {@link logClientError} - For critical errors
 * @see {@link ../errors.normalizeError | normalizeError} - Error normalization
 */
export function logClientWarn(
  message: string,
  error: unknown | undefined,
  operation: string,
  options?: {
    module?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  }
): void {
  const clientContext = createClientLogContext(operation, options);
  // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
  const context: LogContext = Object.fromEntries(
    Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
  ) as LogContext;
  if (error !== undefined) {
    const normalized = normalizeError(error, message);
    // Merge error into context - logger.warn expects (message, context, metadata)
    logger.warn(message, { ...context, err: normalized });
  } else {
    logger.warn(message, context);
  }
}

/**
 * Log a client-side info message with standardized context
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance
 * - Message-first API: `logger.info(message, context)` (matches server-side pattern)
 * - Context structure matches existing patterns
 * 
 * **Note:** Info logs are NOT transmitted to server (only error/warn are).
 * Use for development debugging or important client-side events.
 * 
 * @param message - Info message (required)
 * @param operation - Operation name (required, e.g., 'DraftManager.autoSave')
 * @param options - Additional context fields (module, component, action, and custom fields)
 * 
 * @example
 * ```typescript
 * logClientInfo('Draft auto-saved', 'DraftManager.autoSave', {
 *   module: 'data/drafts',
 *   component: 'DraftManager',
 *   qualityScore: draft.quality_score,
 * });
 * ```
 * 
 * @see {@link createClientLogContext} - Creates the standardized context
 * @see {@link logClientDebug} - For debug-level messages
 * @see {@link logClientError} - For errors
 */
export function logClientInfo(
  message: string,
  operation: string,
  options?: {
    module?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  }
): void {
  const clientContext = createClientLogContext(operation, options);
  // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
  const context: LogContext = Object.fromEntries(
    Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
  ) as LogContext;
  logger.info(message, context);
}

/**
 * Log a client-side debug message with standardized context
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance
 * - Message-first API: `logger.debug(message, context)` (matches server-side pattern)
 * - Context structure matches existing patterns
 * 
 * **Note:** Debug logs are NOT transmitted to server (only error/warn are).
 * Use for development debugging only.
 * 
 * @param message - Debug message (required)
 * @param operation - Operation name (required, e.g., 'DraftManager.calculateQuality')
 * @param options - Additional context fields (module, component, action, and custom fields)
 * 
 * @example
 * ```typescript
 * logClientDebug('Quality score calculated', 'DraftManager.calculateQuality', {
 *   module: 'data/drafts',
 *   component: 'DraftManager',
 *   score: qualityScore,
 * });
 * ```
 * 
 * @see {@link createClientLogContext} - Creates the standardized context
 * @see {@link logClientInfo} - For info-level messages
 * @see {@link logClientError} - For errors
 */
export function logClientDebug(
  message: string,
  operation: string,
  options?: {
    module?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
  }
): void {
  const clientContext = createClientLogContext(operation, options);
  // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
  const context: LogContext = Object.fromEntries(
    Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
  ) as LogContext;
  logger.debug(message, context);
}

/**
 * Log an error boundary error with standardized context
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance
 * - Uses {@link ../errors.normalizeError | normalizeError()} (same as server-side)
 * - Message-first API: `logger.error(message, error, context)` (matches server-side pattern)
 * - Includes React-specific context (route, componentStack)
 * - Browser transmit automatically forwards to server (production only)
 * 
 * **Usage:**
 * Call this from React error boundary `componentDidCatch` or error boundary fallback functions.
 * 
 * @param message - Error message (required)
 * @param error - Error object (will be normalized via {@link ../errors.normalizeError | normalizeError})
 * @param route - Current route path (e.g., `window.location.pathname`)
 * @param componentStack - React component stack from errorInfo
 * @param options - Additional context fields (errorType, and any custom fields)
 * 
 * @example
 * ```typescript
 * // In error boundary componentDidCatch
 * componentDidCatch(error: Error, errorInfo: { componentStack?: string }) {
 *   logClientErrorBoundary(
 *     'React error boundary caught error',
 *     error,
 *     typeof window !== 'undefined' ? window.location.pathname : 'unknown',
 *     errorInfo.componentStack || '',
 *     {
 *       errorType: determineErrorType(error),
 *     }
 *   );
 * }
 * ```
 * 
 * @see {@link createClientLogContext} - Creates the standardized context
 * @see {@link ../errors.normalizeError | normalizeError} - Error normalization
 * @see {@link ../client/error-handler.createErrorBoundaryFallback | createErrorBoundaryFallback} - Error boundary fallback utility
 * @see {@link logClientError} - For non-boundary errors
 */
/**
 * Create client-safe log context with requestId (compatible with server-side createWebAppContextWithId)
 * 
 * **Client-Safe Alternative to Server-Side createWebAppContextWithId**
 * - ✅ **SAFE** to use in client components
 * - Uses client-safe utilities (no server-only dependencies)
 * - Matches server-side API signature for consistency
 * 
 * **Usage:**
 * ```typescript
 * 'use client';
 * 
 * import { generateRequestId, createWebAppContextWithIdClient } from '@heyclaude/web-runtime/logging/client';
 * 
 * const requestId = generateRequestId();
 * const logContext = createWebAppContextWithIdClient(requestId, '/account/jobs', 'JobsPage', {
 *   userId: user.id,
 * });
 * logger.error('Error occurred', error, logContext);
 * ```
 * 
 * @param requestId - Pre-generated request ID (use generateRequestId())
 * @param route - The HTTP/website route path (e.g., '/account/jobs')
 * @param operation - The operation name (e.g., 'JobsPage', 'ErrorBoundary')
 * @param options - Additional context fields
 * @returns Client-safe log context compatible with server-side structure
 * 
 * @see {@link createClientLogContext} - Lower-level client context builder
 * @see {@link ../logging/server.createWebAppContextWithId | createWebAppContextWithId} - Server-side version
 */
export function createWebAppContextWithIdClient(
  requestId: string,
  route: string,
  operation: string,
  options?: Record<string, unknown>
): LogContext {
  const clientContext = createClientLogContext(operation, {
    route,
    ...options,
  });
  
  // Convert to LogContext format (compatible with logger.error signature)
  const logContext: LogContext = {
    requestId,
    route,
    operation: clientContext.operation,
    sessionId: clientContext.sessionId,
  };
  
  // Add optional fields if they exist (use bracket notation for index signature compatibility)
  if (clientContext['module'] !== undefined) {
    logContext['module'] = toLogContextValue(clientContext['module']);
  }
  if (clientContext['component'] !== undefined) {
    logContext['component'] = toLogContextValue(clientContext['component']);
  }
  if (clientContext['action'] !== undefined) {
    logContext['action'] = toLogContextValue(clientContext['action']);
  }
  
  // Add any additional fields from options, converting to LogContextValue
  if (options) {
    for (const [key, value] of Object.entries(options)) {
      if (!['module', 'component', 'action', 'route'].includes(key) && value !== undefined) {
        logContext[key] = toLogContextValue(value);
      }
    }
  }
  
  // Also include any additional fields from clientContext
  for (const [key, value] of Object.entries(clientContext)) {
    if (!['operation', 'sessionId', 'module', 'component', 'action'].includes(key) && value !== undefined) {
      logContext[key] = toLogContextValue(value);
    }
  }
  
  return logContext;
}

export function logClientErrorBoundary(
  message: string,
  error: unknown,
  route: string,
  componentStack: string,
  options?: {
    errorType?: string;
    [key: string]: unknown;
  }
): void {
  const normalized = normalizeError(error, message);
  const clientContext = createClientLogContext('ReactErrorBoundary', {
    component: 'ErrorBoundary',
    route,
    componentStack,
    ...options,
  });
  // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
  const context: LogContext = Object.fromEntries(
    Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
  ) as LogContext;
  logger.error(message, normalized, context);
}
