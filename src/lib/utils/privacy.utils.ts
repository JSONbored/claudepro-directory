/**
 * Privacy Utilities - PII-safe logging helpers
 *
 * Provides utilities to hash/redact user identifiers for compliance with
 * privacy regulations (GDPR, CCPA). User IDs are hashed using SHA-256
 * to maintain traceability while protecting PII.
 *
 * Log retention: Logs containing hashed user IDs follow standard retention
 * policies. Hashed IDs cannot be reversed but can be used for correlation
 * across log entries.
 */

import { createHash } from 'node:crypto';

/**
 * Hash a user ID using SHA-256 for privacy-compliant logging
 *
 * The hash is deterministic (same input = same output) allowing correlation
 * across log entries while protecting PII. The hash cannot be reversed.
 *
 * @param userId - The user ID to hash
 * @returns A hex-encoded SHA-256 hash of the user ID (first 16 chars for brevity)
 *
 * @example
 * ```ts
 * const hashedId = hashUserId('user-123');
 * logger.warn('Action failed', { userIdHash: hashedId });
 * ```
 */
export function hashUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') {
    return 'invalid';
  }

  // Use SHA-256 for deterministic hashing
  // Take first 16 characters for brevity (collision risk is acceptable for logging)
  return createHash('sha256').update(userId).digest('hex').slice(0, 16);
}
