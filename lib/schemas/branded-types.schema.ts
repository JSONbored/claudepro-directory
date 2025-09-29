/**
 * Branded Types Schema
 * Provides compile-time type safety for commonly used identifiers
 * Using Zod's brand feature to create nominal types
 */

import type { z } from 'zod';
import { isoDatetimeString, nonEmptyString, urlString } from '@/lib/schemas/primitives';

/**
 * RequestId - Unique identifier for API requests
 * Used for tracing and debugging
 */
export const requestIdSchema = nonEmptyString
  .uuid('Request ID must be a valid UUID')
  .brand<'RequestId'>();

export type RequestId = z.infer<typeof requestIdSchema>;

/**
 * SessionId - Unique identifier for user sessions
 * Used for analytics and session tracking
 */
export const sessionIdSchema = nonEmptyString
  .min(16, 'Session ID must be at least 16 characters')
  .max(128, 'Session ID must not exceed 128 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid session ID format')
  .brand<'SessionId'>();

export type SessionId = z.infer<typeof sessionIdSchema>;

/**
 * ApiKey - Branded type for API keys
 * Ensures API keys follow the expected format
 */
export const apiKeySchema = nonEmptyString
  .min(32, 'API key must be at least 32 characters')
  .max(256, 'API key must not exceed 256 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid API key format')
  .brand<'ApiKey'>();

export type ApiKey = z.infer<typeof apiKeySchema>;

/**
 * Timestamp - Branded ISO 8601 timestamp
 * Ensures timestamps are in the correct format
 */
export const timestampSchema = isoDatetimeString.brand<'Timestamp'>();

export type Timestamp = z.infer<typeof timestampSchema>;

/**
 * Email - Branded email address type
 * Provides strong typing for email addresses
 */
export const emailSchema = nonEmptyString
  .email('Invalid email address')
  .toLowerCase()
  .brand<'Email'>();

export type Email = z.infer<typeof emailSchema>;

/**
 * URL - Branded URL type
 * Ensures URLs are properly formatted
 */
export const urlSchema = urlString.brand<'URL'>();

export type URL = z.infer<typeof urlSchema>;

/**
 * Helper function to create a branded RequestId
 */
export function createRequestId(): RequestId {
  return requestIdSchema.parse(crypto.randomUUID());
}

/**
 * Helper function to create a branded SessionId
 */
export function createSessionId(): SessionId {
  // Use crypto.randomUUID() for cryptographically secure session IDs
  const uuid = crypto.randomUUID();
  // Convert to URL-safe base64-like format (remove hyphens, add underscores)
  const sessionId = uuid.replace(/-/g, '').substring(0, 32);
  return sessionIdSchema.parse(sessionId);
}

/**
 * Helper function to create a branded Timestamp
 */
export function createTimestamp(date: Date = new Date()): Timestamp {
  return timestampSchema.parse(date.toISOString());
}
