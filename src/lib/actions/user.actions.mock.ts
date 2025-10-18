/**
 * User Actions - Storybook Mock Implementation
 *
 * This file provides no-op mock implementations of user-related server actions
 * for Storybook component isolation. Real implementations are used in production.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real user.actions.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/user.actions.ts for production implementation
 */

/**
 * Mock: Add bookmark for content
 * @returns Success response with mock data
 */
export async function addBookmark() {
  return { success: true, message: 'Bookmark added (mock)' };
}

/**
 * Mock: Remove bookmark for content
 * @returns Success response with mock data
 */
export async function removeBookmark() {
  return { success: true, message: 'Bookmark removed (mock)' };
}

/**
 * Mock: Update user profile
 * @returns Success response with mock data
 */
export async function updateProfile() {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    data: { success: true },
    serverError: undefined,
  };
}

/**
 * Mock: Refresh profile data from OAuth provider
 * @returns Success response with mock data
 */
export async function refreshProfileFromOAuth() {
  // Simulate async operation
  await new Promise((resolve) => setTimeout(resolve, 800));
  return {
    data: { success: true },
    serverError: undefined,
  };
}
