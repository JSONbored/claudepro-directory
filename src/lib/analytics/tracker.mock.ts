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
 * Mock: Track analytics event
 * @param eventName - Name of the event
 * @param payload - Event payload data
 */
export function trackEvent(_eventName: string, _payload?: Record<string, unknown>): void {}
