/**
 * Branded Types Schema
 * Provides compile-time type safety for commonly used identifiers
 * Using Zod's brand feature to create nominal types
 *
 * Branded types prevent accidental mixing of IDs from different domains,
 * providing stronger type safety than plain strings at compile time.
 *
 * Updated: Re-added UserId, SessionId, ContentId based on actual usage (53 occurrences)
 */

import type { z } from 'zod';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';

/**
 * RequestId - Unique identifier for API requests
 * Used for tracing and debugging in error handling and rate limiting
 */
export const requestIdSchema = nonEmptyString
  .uuid('Request ID must be a valid UUID')
  .brand<'RequestId'>();

export type RequestId = z.infer<typeof requestIdSchema>;

/**
 * UserId - Unique identifier for users
 * Used throughout authentication, personalization, and activity tracking
 * Format: UUID v4
 */
export const userIdSchema = nonEmptyString.uuid('User ID must be a valid UUID').brand<'UserId'>();

export type UserId = z.infer<typeof userIdSchema>;

/**
 * SessionId - Unique identifier for user sessions
 * Used in authentication and session management
 * Format: UUID v4
 */
export const sessionIdSchema = nonEmptyString
  .uuid('Session ID must be a valid UUID')
  .brand<'SessionId'>();

export type SessionId = z.infer<typeof sessionIdSchema>;

/**
 * ContentId - Unique identifier for content items (agents, rules, commands, etc.)
 * Used in analytics, trending, and content tracking
 * Format: Slug string (alphanumeric with hyphens)
 */
export const contentIdSchema = nonEmptyString
  .max(200, 'Content ID must be less than 200 characters')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Content ID must be a valid slug (lowercase alphanumeric with hyphens)'
  )
  .brand<'ContentId'>();

export type ContentId = z.infer<typeof contentIdSchema>;

/**
 * Helper function to create a branded RequestId
 */
export function createRequestId(): RequestId {
  return requestIdSchema.parse(crypto.randomUUID());
}

/**
 * Helper function to create a branded UserId
 */
export function createUserId(): UserId {
  return userIdSchema.parse(crypto.randomUUID());
}

/**
 * Helper function to create a branded SessionId
 */
export function createSessionId(): SessionId {
  return sessionIdSchema.parse(crypto.randomUUID());
}

/**
 * Helper function to convert a slug string to ContentId
 * @param slug - The slug string to convert
 * @returns Validated ContentId
 */
export function toContentId(slug: string): ContentId {
  return contentIdSchema.parse(slug);
}
