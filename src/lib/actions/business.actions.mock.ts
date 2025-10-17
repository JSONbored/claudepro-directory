/**
 * Business Actions - Storybook Mock Implementation
 *
 * This file provides no-op mock implementations of business/sponsored tracking server actions
 * for Storybook component isolation. Real implementations are used in production.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real business.actions.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/business.actions.ts for production implementation
 */

/**
 * Mock: Track sponsored content click
 * @returns Success response with mock data
 */
export async function trackSponsoredClick() {
  return { success: true };
}

/**
 * Mock: Track sponsored content impression
 * @returns Success response with mock data
 */
export async function trackSponsoredImpression() {
  return { success: true };
}

/**
 * Mock: Toggle job status (active/paused)
 * @returns Success response with mock data
 */
export async function toggleJobStatus(_params: { id: string; status: string }) {
  return { data: { success: true } };
}

/**
 * Mock: Delete job listing
 * @returns Success response with mock data
 */
export async function deleteJob(_params: { id: string }) {
  return { data: { success: true } };
}
