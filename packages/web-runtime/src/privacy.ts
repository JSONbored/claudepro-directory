/**
 * Privacy Utilities - PII-safe logging helpers
 *
 * **⚠️ DEPRECATED: This file is kept for backward compatibility only.**
 * 
 * **Please import from `@heyclaude/shared-runtime` instead:**
 * ```ts
 * import { hashUserId } from '@heyclaude/shared-runtime';
 * ```
 * 
 * The `hashUserId` function has been moved to `shared-runtime` because:
 * - It's isomorphic (works in Browser/Edge/Node)
 * - It's needed by the user serializer in logger config (which is in shared-runtime)
 * - It should be available to all runtimes (web-runtime, edge-runtime, data-layer)
 * 
 * This file re-exports from `shared-runtime` to maintain backward compatibility.
 * 
 * @deprecated Import from `@heyclaude/shared-runtime` instead
 * @see {@link @heyclaude/shared-runtime/privacy | shared-runtime/privacy} - New location
 */

// Re-export from shared-runtime for backward compatibility
export { hashUserId } from '@heyclaude/shared-runtime';
