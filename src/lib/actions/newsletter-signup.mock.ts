/**
 * Newsletter Signup Action - Storybook Mock
 *
 * Mock implementation for Storybook component isolation.
 *
 * @see src/lib/actions/newsletter-signup.ts for production implementation
 */

export interface SubscribeToNewsletterInput {
  email: string;
  source: string;
  referrer?: string;
}

export interface SubscribeToNewsletterResult {
  success: boolean;
  contactId?: string;
  message?: string;
  error?: string;
}

/**
 * Mock: Subscribe to newsletter
 * Returns a structure matching next-safe-action response format
 */
export async function subscribeToNewsletter(_input: SubscribeToNewsletterInput) {
  return {
    data: {
      success: true,
      contactId: 'mock-contact-id',
    },
  };
}
