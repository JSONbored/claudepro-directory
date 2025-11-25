/**
 * Request Context Utilities
 * 
 * Provides request ID generation and context for logging and error tracking.
 * Request IDs enable distributed tracing across async operations.
 */

import { headers } from 'next/headers';
import { generateTraceId } from '../trace.ts';

/**
 * Generate a unique request ID for tracing
 * Uses timestamp + random for uniqueness
 */
export function generateRequestId(): string {
  return generateTraceId();
}

/**
 * Get request context from Next.js headers
 * Extracts useful information for logging and error tracking
 */
export async function getRequestContext(): Promise<{
  requestId: string;
  userAgent: string | undefined;
  ip: string | undefined;
  referer: string | undefined;
  path: string | undefined;
}> {
  const headersList = await headers();
  
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
