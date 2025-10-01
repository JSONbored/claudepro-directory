/**
 * Branded Types Schema
 * Provides compile-time type safety for commonly used identifiers
 * Using Zod's brand feature to create nominal types
 *
 * SHA-2100: Reduced from 14 exports to 3 exports (79% reduction)
 * Removed unused: SessionId, ApiKey, Timestamp, Email, URL and their helper functions
 */

import type { z } from 'zod';
import { nonEmptyString } from '@/lib/schemas/primitives/base-strings';

/**
 * RequestId - Unique identifier for API requests
 * Used for tracing and debugging in error handling and rate limiting
 */
export const requestIdSchema = nonEmptyString
  .uuid('Request ID must be a valid UUID')
  .brand<'RequestId'>();

export type RequestId = z.infer<typeof requestIdSchema>;

/**
 * Helper function to create a branded RequestId
 */
export function createRequestId(): RequestId {
  return requestIdSchema.parse(crypto.randomUUID());
}
