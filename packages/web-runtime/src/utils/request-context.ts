/**
 * Request Context Utilities
 * 
 * Provides request ID generation and context for logging and error tracking.
 * Request IDs enable distributed tracing across async operations.
 * 
 * NOTE: This module works in both App Router and Pages Router contexts.
 * In Pages Router or when next/headers is unavailable, request IDs are generated
 * without using next/headers.
 */

import { generateTraceId } from '../trace.ts';

/**
 * Generate a unique request ID for tracing
 * Uses timestamp + random for uniqueness
 * Works in all contexts (App Router, Pages Router, Edge Runtime, Client)
 */
export function generateRequestId(): string {
  return generateTraceId();
}

/**
 * Get request context from Next.js headers (App Router only)
 * Extracts useful information for logging and error tracking
 * 
 * NOTE: This function only works in App Router Server Components.
 * In Pages Router or other contexts, it returns minimal context.
 */
export async function getRequestContext(): Promise<{
  requestId: string;
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
      requestId: generateRequestId(),
      userAgent,
      ip,
      referer,
      path,
    };
  } catch {
    // next/headers not available (Pages Router, edge runtime, or build time)
    // Return minimal context with just request ID
    return {
      requestId: generateRequestId(),
      userAgent: undefined,
      ip: undefined,
      referer: undefined,
      path: undefined,
    };
  }
}

/**
 * Create enhanced log context with request information
 * Use this in data fetching functions and API routes
 */
export async function createLogContext(additionalContext?: Record<string, unknown>): Promise<Record<string, unknown>> {
  const requestContext = await getRequestContext();
  return {
    ...requestContext,
    ...(additionalContext ?? {}),
  };
}
