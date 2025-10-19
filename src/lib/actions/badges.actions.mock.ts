/**
 * Badges Actions Mock for Storybook
 *
 * Provides no-op mock implementations of badge-related server actions
 * for Storybook component isolation. Real implementations are used in production.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real badges.actions.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/badges.actions.ts for production implementation
 */

/**
 * Mock: Toggle badge featured status
 * @param input - Badge toggle input { badgeId, featured }
 * @returns Success response with mock data
 */
export async function toggleBadgeFeatured(input: { badgeId: string; featured: boolean }) {
  // Mock implementation - simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    data: { success: true, badgeId: input.badgeId, featured: input.featured },
    serverError: undefined,
  };
}
