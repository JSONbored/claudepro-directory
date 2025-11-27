/**
 * Client-Side Logging Barrel Export
 * 
 * Centralized barrel export for all client-side logging and error instrumentation utilities.
 * This module is safe to import in client components (`'use client'`).
 * 
 * **⚠️ IMPORTANT: Client-Only Module**
 * - ✅ **SAFE** to import in client components (`'use client'`)
 * - ❌ **DO NOT** import server-only utilities from this barrel
 * - All exports in this barrel are client-safe (no server-only dependencies)
 * 
 * **Usage:**
 * ```typescript
 * 'use client';
 * 
 * import {
 *   useClientLogger,
 *   logClientError,
 *   logClientWarn,
 *   getOrCreateSessionId,
 *   normalizeError,
 * } from '@heyclaude/web-runtime/logging/client';
 * ```
 * 
 * **What's Included:**
 * - React hook for component-level logging (`useClientLogger`)
 * - Client-side logging utilities (`logClientError`, `logClientWarn`, etc.)
 * - Session ID management (`getOrCreateSessionId`)
 * - Error normalization (`normalizeError`)
 * 
 * **Related Modules:**
 * - {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * - {@link ../logger | Logger Instance} - Main logger instance (used internally)
 * - {@link @heyclaude/shared-runtime/logger/config | Pino Configuration} - Centralized logger config
 * 
 * @module web-runtime/logging/client
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../utils/client-logger | Client Logger Utilities} - Lower-level utilities
 * @see {@link ../hooks/use-client-logger | useClientLogger Hook} - React hook for components
 */

'use client';

// React hook for component-level logging
export { useClientLogger, type UseClientLoggerOptions, type ClientLogger } from '../hooks/use-client-logger.ts';

// Client-side logging utilities
export {
  logClientError,
  logClientWarn,
  logClientInfo,
  logClientDebug,
  logClientErrorBoundary,
  createClientLogContext,
  type ClientLogContext,
} from '../utils/client-logger.ts';

// Session ID management
export { getOrCreateSessionId, clearSessionId } from '../utils/client-session.ts';

// Request ID generation (client-safe, works in all contexts)
export { generateRequestId } from '../utils/request-id.ts';

// Error normalization (client-safe, works in all contexts)
export { normalizeError } from '../errors.ts';

// Privacy utilities (PII-safe user ID hashing) - client-safe, isomorphic
export { hashUserId } from '@heyclaude/shared-runtime/privacy';
