/**
 * Web App Log Context Builder (Server-Only)
 * 
 * Provides standardized log context creation for web app pages, components, and API routes.
 * 
 * **⚠️ IMPORTANT: Server-Only Module**
 * - ❌ **DO NOT** import this in client components (`'use client'`)
 * - ✅ **ONLY** import in server components, API routes, or server actions
 * 
 * **Client/Server Boundaries:**
 * - This module is designed for server-side log context creation
 * - For client-side logging, use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * This is the web app equivalent of edge function context builders like createDataApiContext.
 * 
 * **FIELD SEMANTICS:**
 * - `route`: HTTP/website URL route (user-facing endpoints)
 *   - Use for: Pages, API routes, user-facing endpoints
 *   - Examples: '/jobs', '/api/templates', '/account/jobs/new'
 *   - Purpose: Identify which user-facing endpoint generated the log
 * 
 * - `module`: Codebase module identifier (internal)
 *   - Use for: Data layer functions, utility functions, internal services
 *   - Examples: 'data/marketing/site', 'data/notifications', 'data/payments'
 *   - Purpose: Identify which codebase module/function generated the log
 * 
 * - `service`: Runtime/service identifier (set at logger instance level)
 *   - Already configured: 'web-runtime', 'edge-runtime', 'data-layer'
 *   - Purpose: Identify which service/runtime generated the log
 * 
 * @module web-runtime/utils/log-context
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */

import 'server-only';

import { toLogContextValue, type LogContext } from '../logger.ts';

export interface WebAppLogContext extends LogContext {
  route?: string; // HTTP/website URL route (user-facing)
  module?: string; // Codebase module identifier (internal)
  operation?: string;
}

/**
 * Create standardized log context for web app pages/components
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from server components, API routes, or server actions
 * - For client-side logging, use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * @param route - The HTTP/website route path (e.g., '/account/jobs', '/api/templates')
 *   This is the user-facing URL route, not a codebase path.
 * @param operation - The operation name (e.g., 'JobsPage', 'TemplatesAPI')
 * @param options - Additional context fields (can include 'module' for internal functions)
 * @returns Standardized log context
 * 
 * @example
 * ```ts
 * // Server component or API route
 * import { createWebAppContext } from '@heyclaude/web-runtime/logging/server';
 * 
 * const logContext = createWebAppContext('/account/jobs', 'JobsPage', {
 *   userId: user.id,
 *   page: 1
 * });
 * logger.info('Jobs loaded', logContext);
 * ```
 * 
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */
export function createWebAppContext(
  route: string,
  operation: string,
  options?: Record<string, unknown>
): WebAppLogContext {
  const context: WebAppLogContext = {
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
 * Create log context (alias for createWebAppContext)
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from server components, API routes, or server actions
 * - For client-side logging, use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * @param route - The HTTP/website route path (user-facing URL, e.g., '/account/jobs')
 * @param operation - The operation name (e.g., 'JobsPage')
 * @param options - Additional context fields (can include 'module' for internal functions)
 * @returns Standardized log context
 * 
 * @example
 * ```ts
 * // Server component or API route
 * import { createWebAppContextWithId } from '@heyclaude/web-runtime/logging/server';
 * 
 * const logContext = createWebAppContextWithId('/account/jobs', 'JobsPage');
 * logger.info('Jobs loaded', logContext);
 * logger.error('Failed to load', error, logContext);
 * ```
 * 
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */
export function createWebAppContextWithId(
  route: string,
  operation: string,
  options?: Record<string, unknown>
): WebAppLogContext {
  const context: WebAppLogContext = {
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

