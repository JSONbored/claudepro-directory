/**
 * Request Context Utilities (Server-Only)
 * 
 * Provides server-only request context utilities for logging and error tracking.
 * These utilities use Next.js `next/headers` which is only available in Server Components.
 * 
 * **⚠️ IMPORTANT: Server-Only Module**
 * - ❌ **DO NOT** import this in client components (`'use client'`)
 * - ✅ **ONLY** import in server components, API routes, or server actions
 * - ✅ Safe to import in Edge Runtime (uses try-catch for compatibility)
 * 
 * **Client/Server Boundaries:**
 * - This module uses `require('next/headers')` which is server-only
 * - For client-side logging, use {@link ../logging/client | Client Logging Barrel}
 * 
 * **Usage:**
 * - Server components: Use `getRequestContext()` or `createLogContext()`
 * - API routes: Use `getRequestContext()` or `createLogContext()`
 * - Client components: **DO NOT USE** - use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * @module web-runtime/utils/request-context
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */

import 'server-only';

/**
 * Get request context from Next.js headers (App Router only)
 * 
 * Extracts useful information for logging and error tracking from Next.js headers.
 * This function only works in App Router Server Components.
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from server components, API routes, or server actions
 * - Uses `next/headers` which is server-only
 * 
 * **Fallback Behavior:**
 * - If `next/headers` is unavailable (Pages Router, Edge Runtime, build time), returns minimal context
 * - This ensures the function doesn't crash in non-App Router contexts
 * 
 * @returns Request context with userAgent, ip, referer, and path
 * 
 * @example
 * ```typescript
 * // Server component or API route
 * import { getRequestContext } from '@heyclaude/web-runtime/logging/server';
 * 
 * export default async function MyPage() {
 *   const context = await getRequestContext();
 *   logger.info('Page loaded', { ...context, userId: user.id });
 * }
 * ```
 * 
 * @see {@link createLogContext} - Higher-level function that uses this
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */
export async function getRequestContext(): Promise<{
  userAgent: string | undefined;
  ip: string | undefined;
  referer: string | undefined;
  path: string | undefined;
}> {
  // Try to get headers if available (App Router context only)
  try {
    // Dynamic import to avoid module-level evaluation in Pages Router
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nextHeaders = require('next/headers');
    const headersList = nextHeaders.headers();
    
    const userAgent = headersList.get('user-agent') ?? undefined;
    const ip = headersList.get('cf-connecting-ip') ?? 
               headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 
               headersList.get('x-real-ip') ??
               undefined;
    const referer = headersList.get('referer') ?? undefined;
    const path = headersList.get('x-pathname') ?? undefined;
    
    return {
      userAgent,
      ip,
      referer,
      path,
    };
  } catch {
    // next/headers not available (Pages Router, edge runtime, or build time)
    // Return minimal context
    return {
      userAgent: undefined,
      ip: undefined,
      referer: undefined,
      path: undefined,
    };
  }
}

/**
 * Create enhanced log context with request information
 * 
 * Combines request context from Next.js headers with additional context fields.
 * Use this in data fetching functions and API routes.
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from server components, API routes, or server actions
 * - Uses `getRequestContext()` which is server-only
 * 
 * @param additionalContext - Additional context fields to merge with request context
 * @returns Enhanced log context with request information and additional fields
 * 
 * @example
 * ```typescript
 * // Server component or API route
 * import { createLogContext } from '@heyclaude/web-runtime/logging/server';
 * 
 * export default async function MyPage() {
 *   const logContext = await createLogContext({
 *     userId: user.id,
 *     page: 1,
 *   });
 *   logger.info('Data loaded', logContext);
 * }
 * ```
 * 
 * @see {@link getRequestContext} - Lower-level function that extracts request info
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */
export async function createLogContext(additionalContext?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const requestContext = await getRequestContext();
  return {
    ...requestContext,
    ...(additionalContext ?? {}),
  };
}
