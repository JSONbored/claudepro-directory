/**
 * Server-Side Logging Barrel Export
 * 
 * Centralized barrel export for all server-side logging and error instrumentation utilities.
 * This module is server-only and should NOT be imported in client components.
 * 
 * **⚠️ IMPORTANT: Server-Only Module**
 * - ❌ **DO NOT** import this in client components (`'use client'`)
 * - ✅ **ONLY** import in server components, API routes, or server actions
 * - Uses `import 'server-only'` to enforce server-only boundary
 * 
 * **Usage:**
 * ```typescript
 * // Server component or API route
 * import {
 *   logger,
 *   generateRequestId,
 *   createWebAppContext,
 *   createWebAppContextWithId,
 *   getRequestContext,
 *   createLogContext,
 *   normalizeError,
 *   createErrorResponse,
 * } from '@heyclaude/web-runtime/logging/server';
 * ```
 * 
 * **What's Included:**
 * - Main logger instance (`logger`)
 * - Request ID generation (`generateRequestId`) - client-safe function, but exported from server barrel
 * - Log context builders (`createWebAppContext`, `createWebAppContextWithId`)
 * - Request context utilities (`getRequestContext`, `createLogContext`) - server-only
 * - Error normalization (`normalizeError`)
 * - Error response utilities (`createErrorResponse`, `handleApiError`)
 * 
 * **Client/Server Boundaries:**
 * - `generateRequestId()` is client-safe, but exported from server barrel for convenience
 * - All other utilities are server-only (use `next/headers` or other server APIs)
 * - For client-side logging, use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * **Related Modules:**
 * - {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * - {@link ../logger | Logger Instance} - Main logger instance
 * - {@link @heyclaude/shared-runtime/logger/config | Pino Configuration} - Centralized logger config
 * 
 * @module web-runtime/logging/server
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * @see {@link ../utils/request-id | request-id} - Client-safe request ID generation
 * @see {@link ../utils/request-context | request-context} - Server-only request context utilities
 * @see {@link ../utils/log-context | log-context} - Server-only log context builders
 */

import 'server-only';

// Main logger instance
export { logger, type LogContext, type LogContextValue, toLogContextValue } from '../logger.ts';

// Request ID generation (client-safe, but exported from server barrel for convenience)
export { generateRequestId } from '../utils/request-id.ts';

// Server-only request context utilities
export { getRequestContext, createLogContext } from '../utils/request-context.ts';

// Server-only log context builders
export {
  createWebAppContext,
  createWebAppContextWithId,
  type WebAppLogContext,
} from '../utils/log-context.ts';

// Error normalization (works in all contexts, but exported from server barrel)
export { normalizeError } from '../errors.ts';

// Privacy utilities (PII-safe user ID hashing)
// Note: Use userId/user_id/user.id directly in logs - redaction automatically hashes them
export { hashUserId } from '@heyclaude/shared-runtime/privacy';

// Error response utilities (server-only, for API routes)
export { createErrorResponse, handleApiError } from '../utils/error-handler.ts';
