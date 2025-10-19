/**
 * Track View Actions - Storybook Mock Implementation
 *
 * This file provides no-op mock implementations of analytics tracking server actions
 * for Storybook component isolation. Real implementations are used in production.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real track-view.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/track-view.ts for production implementation
 */

/**
 * Mock: Track view event for content
 * @returns Success response with mock data
 */
export async function trackView() {
  return { success: true };
}

/**
 * Mock: Track copy event for content
 * @returns Success response with mock data
 */
export async function trackCopy() {
  return { success: true };
}
