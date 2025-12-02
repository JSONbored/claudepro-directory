/**
 * Client-Side Session Management
 * 
 * Provides session ID generation and management for client-side logging.
 * Session IDs enable correlation of user actions across page navigations.
 * 
 * **⚠️ IMPORTANT: Client-Only Module**
 * - ✅ **SAFE** to import in client components (`'use client'`)
 * - ❌ **DO NOT** use in server components (uses `sessionStorage` which is browser-only)
 * - Uses sessionStorage (persists across page navigations, clears on tab close)
 * 
 * **Client/Server Boundaries:**
 * - This module uses `sessionStorage` which is only available in the browser
 * - For server-side request tracking, use {@link ../utils/request-id.generateRequestId | generateRequestId} from {@link ../logging/server | Server Logging Barrel} instead
 * 
 * **Related Modules:**
 * - {@link ../utils/client-logger | Client Logger Utilities} - Uses session IDs in log context
 * - {@link ../hooks/use-client-logger | useClientLogger Hook} - React hook that uses session IDs
 * - {@link ../logger | Logger Instance} - Main logger that receives logs with session IDs
 * - {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * 
 * @module web-runtime/utils/client-session
 * @see {@link ../utils/client-logger | Client Logger Utilities}
 * @see {@link ../hooks/use-client-logger | useClientLogger Hook}
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */

/**
 * Session storage key for session ID
 */
const SESSION_ID_KEY = 'app_session_id';

/**
 * Generate a cryptographically secure random string
 * 
 * Uses crypto.getRandomValues() for secure randomness in browser environments.
 * Falls back to Math.random() only if crypto API is unavailable (shouldn't happen in modern browsers).
 * 
 * @param length - Length of random string to generate (default: 8)
 * @returns Random alphanumeric string
 */
function generateSecureRandomString(length: number = 8): string {
  // Check if crypto API is available (should be in all modern browsers)
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Use cryptographically secure random number generator
    // Generate enough values to guarantee sufficient characters
    // Each Uint32 produces at minimum 1 char, but average ~6-7 chars in base36
    // Generate length values to ensure we always have enough characters
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
    
    // Convert to base36 string (0-9, a-z) and slice to exact length
    return Array.from(array)
      .map((n) => n.toString(36))
      .join('')
      .slice(0, length);
  }
  
  // Fallback (shouldn't happen in modern browsers, but included for safety)
  // This is still insecure, but better than crashing
  return Math.random().toString(36).slice(2, 2 + length);
}

/**
 * Get or create a session ID for the current browser session
 * 
 * Session IDs persist across page navigations but are unique per browser tab.
 * They're cleared when the tab is closed.
 * 
 * **Performance:**
 * - Uses sessionStorage (fast, synchronous)
 * - Cached per component lifecycle (via {@link ../hooks/use-client-logger | useClientLogger})
 * - Graceful fallback if sessionStorage unavailable (returns temporary ID)
 * 
 * **Security:**
 * - Uses cryptographically secure random number generation (crypto.getRandomValues)
 * - Prevents session ID prediction attacks
 * 
 * **Usage:**
 * - Automatically called by {@link createClientLogContext} - no need to call directly
 * - Can be used directly if you need session ID for custom logging
 * 
 * @returns Session ID string (format: `session_<timestamp><random>` or `temp_<timestamp><random>` if sessionStorage unavailable)
 * 
 * @example
 * ```typescript
 * // Direct usage (rare - usually handled by client-logger utilities)
 * const sessionId = getOrCreateSessionId();
 * logger.error('Action failed', error, { sessionId, operation: 'Action' });
 * 
 * // Typical usage (via client-logger utilities)
 * import { logClientError } from '../utils/client-logger';
 * logClientError('Action failed', error, 'MyComponent.handleClick');
 * // Session ID automatically included via createClientLogContext()
 * ```
 * 
 * @see {@link createClientLogContext} - Automatically includes session ID
 * @see {@link ../hooks/use-client-logger | useClientLogger} - React hook that manages session ID
 */
export function getOrCreateSessionId(): string {
  // SSR check - return placeholder for server-side
  if (typeof window === 'undefined') {
    return 'ssr';
  }

  try {
    // Check if session ID already exists
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    
    if (!sessionId) {
      // Generate new session ID using cryptographically secure randomness
      const randomPart = generateSecureRandomString(10);
      sessionId = `session_${Date.now().toString(36)}${randomPart}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // sessionStorage might be unavailable (private browsing, quota exceeded, etc.)
    // Return a temporary ID that won't persist (using secure randomness)
    const randomPart = generateSecureRandomString(8);
    return `temp_${Date.now().toString(36)}${randomPart}`;
  }
}

/**
 * Clear the current session ID
 * 
 * Useful for testing or explicit session reset.
 * A new session ID will be generated on the next call to {@link getOrCreateSessionId}.
 * 
 * @remarks
 * This is primarily for testing scenarios. In normal operation, session IDs
 * should persist for the lifetime of the browser tab.
 * 
 * @example
 * ```typescript
 * // Testing: Reset session
 * clearSessionId();
 * const newSessionId = getOrCreateSessionId(); // New ID generated
 * ```
 * 
 * @see {@link getOrCreateSessionId} - Generates new session ID after clearing
 */
export function clearSessionId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(SESSION_ID_KEY);
  } catch {
    // Ignore errors (sessionStorage might be unavailable)
  }
}
