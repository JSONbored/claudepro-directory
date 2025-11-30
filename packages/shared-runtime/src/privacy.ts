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
 *
 * **Architecture:**
 * - Located in `shared-runtime` because it's isomorphic (works in Browser/Edge/Node)
 * - Used by the user serializer in logger config to automatically hash userId fields
 * - Available to all runtimes (web-runtime, edge-runtime, data-layer) via barrel exports
 *
 * @module shared-runtime/privacy
 * @see {@link ../logger/config | Logger Config} - User serializer uses this
 */

// Note: We don't import User type here to keep this module isomorphic
// The getUserHash function accepts unknown and uses type guards for safety
// This allows it to work with any user-like object without requiring Supabase types


/**
 * Hash a user ID for privacy-compliant logging
 *
 * The hash is deterministic (same input = same output) allowing correlation
 * across log entries while protecting PII.
 *
 * Note: Uses FNV-1a for isomorphic support (works in Browser/Edge/Node).
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
 *
 * @example
 * ```ts
 * // Used automatically by user serializer when logging user objects
 * logger.info({ user: userObj }, 'User logged in');
 * // Serializer automatically hashes id, user_id, userId fields
 * ```
 */
export function hashUserId(userId: string): string {
  if (!userId || typeof userId !== 'string') {
    return 'invalid';
  }

  // FNV-1a hash implementation
  let hash = 2_166_136_261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.codePointAt(i) ?? 0;
    // Math.imul mimics C-like 32-bit multiplication
    hash = Math.imul(hash, 16_777_619);
  }
  // Convert to unsigned 32-bit integer and then to hex
  return (hash >>> 0).toString(16);
}


/**
 * Hash email address for privacy-compliant logging
 *
 * Email addresses are PII and must not be logged in plaintext.
 * This function hashes the local part (before @) while optionally
 * preserving the domain for debugging purposes.
 *
 * **Privacy Compliance:**
 * - Local part (before @) is always hashed
 * - Domain can be preserved for debugging (configurable)
 * - Complies with GDPR/CCPA by never logging raw email addresses
 *
 * @param email - The email address to hash
 * @param preserveDomain - If true, preserve domain after @ (default: false for maximum privacy)
 * @returns Hashed email in format: `{hashedLocal}@domain` or `{hashedLocal}@[REDACTED]`
 *
 * @example
 * ```ts
 * const hashedEmail = hashEmail('user@example.com', false);
 * // Returns: 'a1b2c3d4@[REDACTED]'
 *
 * const hashedEmailDebug = hashEmail('user@example.com', true);
 * // Returns: 'a1b2c3d4@example.com' (domain preserved for debugging)
 * ```
 */
export function hashEmail(email: string, preserveDomain = false): string {
  if (!email || typeof email !== 'string') {
    return '[REDACTED]';
  }

  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    // Not a valid email format, hash the entire string
    return hashUserId(email);
  }

  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Hash the local part (PII)
  const hashedLocal = hashUserId(localPart);

  // Optionally preserve domain for debugging, otherwise redact
  const domainPart = preserveDomain ? domain : '[REDACTED]';

  return `${hashedLocal}@${domainPart}`;
}


