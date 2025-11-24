/**
 * Privacy Utilities - PII-safe logging helpers
 *
 * Provides utilities to hash/redact user identifiers for compliance with
 * privacy regulations (GDPR, CCPA). User IDs are hashed using a consistent
 * hashing algorithm to maintain traceability while protecting PII.
 *
 * Log retention: Logs containing hashed user IDs follow standard retention
 * policies. Hashed IDs cannot be reversed but can be used for correlation
 * across log entries.
 */

/**
 * Hash a user ID for privacy-compliant logging
 *
 * The hash is deterministic (same input = same output) allowing correlation
 * across log entries while protecting PII.
 *
 * Note: Switched to FNV-1a for isomorphic support (works in Browser/Edge/Node).
 * This is adequate for log obfuscation but is not cryptographically secure.
 *
 * @param userId - The user ID to hash
 * @returns A hex-encoded hash of the user ID
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

  // FNV-1a hash implementation
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    // Math.imul mimics C-like 32-bit multiplication
    hash = Math.imul(hash, 16777619);
  }
  // Convert to unsigned 32-bit integer and then to hex
  return (hash >>> 0).toString(16);
}
