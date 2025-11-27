/**
 * Request ID Generation (Client-Safe)
 * 
 * Provides client-safe request ID generation for tracing.
 * This module can be safely imported in both client and server components.
 * 
 * **Client/Server Compatibility:**
 * - ✅ Safe to import in client components (`'use client'`)
 * - ✅ Safe to import in server components (`'use server'` or server-only)
 * - ✅ Works in Edge Runtime
 * - ✅ Works in all Next.js contexts (App Router, Pages Router)
 * 
 * **Usage:**
 * - Client components: Can use `generateRequestId()` directly
 * - Server components: Use `generateRequestId()` or import from {@link ./request-context | request-context} (server-only utilities)
 * 
 * @module web-runtime/utils/request-id
 * @see {@link ./request-context | request-context} - Server-only utilities that use this
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */

import { generateTraceId } from '../trace';

/**
 * Generate a unique request ID for tracing
 * 
 * Uses timestamp + random for uniqueness. This function is client-safe and can be
 * used in any context (client components, server components, edge runtime).
 * 
 * **Client/Server Compatibility:**
 * - ✅ Safe in client components (no server-only dependencies)
 * - ✅ Safe in server components (no Node.js-specific APIs)
 * - ✅ Works in Edge Runtime (no Node.js APIs)
 * - ✅ Works in all Next.js contexts
 * 
 * **When to Use:**
 * - Client components: Use directly for client-side tracing
 * - Server components: Use directly or via {@link ./request-context.generateRequestId | request-context} (which re-exports this)
 * - Edge functions: Use directly for edge-side tracing
 * 
 * @returns Unique request ID string (format: `trace_<timestamp><random>`)
 * 
 * @example
 * ```typescript
 * // Client component
 * 'use client';
 * import { generateRequestId } from '@heyclaude/web-runtime/logging/client';
 * 
 * function MyComponent() {
 *   const requestId = generateRequestId();
 *   // Use for client-side tracing
 * }
 * 
 * // Server component
 * import { generateRequestId } from '@heyclaude/web-runtime/logging/server';
 * 
 * export default async function MyPage() {
 *   const requestId = generateRequestId();
 *   // Use for server-side tracing
 * }
 * ```
 * 
 * @see {@link ./request-context | request-context} - Server-only utilities (getRequestContext, createLogContext)
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */
export function generateRequestId(): string {
  return generateTraceId();
}
