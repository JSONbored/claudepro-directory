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
  console.log('[STORYBOOK MOCK] trackSponsoredClick called');
  return { success: true };
}

/**
 * Mock: Track sponsored content impression
 * @returns Success response with mock data
 */
export async function trackSponsoredImpression() {
  console.log('[STORYBOOK MOCK] trackSponsoredImpression called');
  return { success: true };
}
