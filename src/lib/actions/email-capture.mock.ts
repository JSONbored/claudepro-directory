/**
 * Email Capture Actions - Storybook Mock Implementation
 *
 * This file provides no-op mock implementations of email capture server actions
 * for Storybook component isolation. Real implementations use next-safe-action.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real email-capture.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/actions/email-capture.ts for production implementation
 */

/**
 * Mock: Capture email after copy action
 * @returns Success response with mock data
 */
export const postCopyEmailCaptureAction = async (_params: {
  email: string;
  copyType: string;
  category?: string;
  slug?: string;
}) => {
  // Simulate a delay like the real server action
  await new Promise((resolve) => setTimeout(resolve, 300));

  return {
    data: {
      success: true,
      message: 'Email captured successfully (mock)',
    },
  };
};
