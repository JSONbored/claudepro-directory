/**
 * Analytics Tracker - Storybook Mock Implementation
 *
 * This file provides a no-op mock implementation of the analytics tracker
 * for Storybook component isolation. Real implementation tracks to Umami.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real tracker.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/analytics/tracker.ts for production implementation
 */

/**
 * Helper to consume parameters and satisfy linters without underscore prefixes
 */
function noop(..._args: unknown[]): void {
  // Intentionally empty - consumes parameters to satisfy TypeScript/Biome
}

/**
 * Mock: Track analytics event
 * @param eventName - Name of the event
 * @param payload - Event payload data
 */
export function trackEvent(eventName: string, payload?: Record<string, unknown>): void {
  // No-op mock for Storybook - real implementation in tracker.ts
  noop(eventName, payload);
}
