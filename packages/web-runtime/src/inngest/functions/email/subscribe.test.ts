/**
 * Newsletter Subscribe Inngest Function Tests
 *
 * Tests the subscribeNewsletter function using @inngest/test.
 * This tests the function logic, not the route handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { subscribeNewsletter } from './subscribe';
import * as resend from '../../../integrations/resend';
import { revalidateTag } from 'next/cache';

// Mock dependencies
vi.mock('../../../integrations/resend', () => ({
  syncContactToResend: vi.fn(),
  buildContactProperties: vi.fn(),
  resolveNewsletterInterest: vi.fn(),
  sendEmail: vi.fn(),
  enrollInOnboardingSequence: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

// Hoist mocks to ensure they're available when function executes
const mockGetService = vi.hoisted(() => vi.fn());

vi.mock('../../../data/service-factory', () => ({
  getService: mockGetService,
}));

vi.mock('../../../logging/server', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  createWebAppContextWithId: vi.fn(() => ({
    requestId: 'test-request-id',
    operation: 'subscribeNewsletter',
    route: '/inngest/email/subscribe',
  })),
}));

vi.mock('@heyclaude/shared-runtime', () => ({
  validateEmail: vi.fn((email: string) => ({
    valid: true,
    normalized: email.toLowerCase().trim(),
    error: null,
  })),
  normalizeError: vi.fn((error) => error),
}));

describe('subscribeNewsletter', () => {
  const t = new InngestTestEngine({
    function: subscribeNewsletter,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(resend.resolveNewsletterInterest).mockReturnValue('agents');
    vi.mocked(resend.buildContactProperties).mockReturnValue({
      source: 'homepage',
      primaryInterest: 'agents',
    });
    vi.mocked(resend.syncContactToResend).mockResolvedValue({
      resendContactId: 'contact-id',
      syncStatus: 'synced' as const,
      syncError: null,
      topicIds: [],
    });
    vi.mocked(resend.sendEmail).mockResolvedValue({ id: 'email-id' });
    vi.mocked(resend.enrollInOnboardingSequence).mockResolvedValue(undefined);
  });

  it('should subscribe user successfully', async () => {
    const mockService = {
      subscribeNewsletter: vi.fn().mockResolvedValue({
        success: true,
        subscription_id: 'sub-id',
        was_resubscribed: false,
      }),
      getSubscriptionById: vi.fn().mockResolvedValue({
        id: 'sub-id',
        email: 'test@example.com',
        source: 'homepage',
      }),
    };

    mockGetService.mockResolvedValue(mockService as never);

    // Execute function - InngestTestEngine will run the actual function code
    // The mocks above will be used when the function executes
    const { result } = await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'test@example.com',
            source: 'homepage',
          },
        },
      ],
    });

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('subscriptionId', 'sub-id');
    expect(mockService.subscribeNewsletter).toHaveBeenCalled();
    expect(resend.sendEmail).toHaveBeenCalled();
    expect(resend.enrollInOnboardingSequence).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith('newsletter', 'default');
  });

  it('should handle invalid email', async () => {
    // Mock validateEmail to return invalid
    const { validateEmail } = await import('@heyclaude/shared-runtime');
    vi.mocked(validateEmail).mockReturnValueOnce({
      valid: false,
      normalized: null,
      error: 'Invalid email format',
    });

    // Execute function - validation will fail in the validate-email step
    const { error } = await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'invalid-email',
            source: 'homepage',
          },
        },
      ],
    });

    expect(error).toBeDefined();
    
    // InngestTestEngine returns errors as objects with message property, not Error instances
    // Handle both Error instances and error objects
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toContain('Invalid email format');
  });

  it('should handle Resend sync failure gracefully', async () => {
    const mockService = {
      subscribeNewsletter: vi.fn().mockResolvedValue({
        success: true,
        subscription_id: 'sub-id',
        was_resubscribed: false,
      }),
      getSubscriptionById: vi.fn().mockResolvedValue({
        id: 'sub-id',
        email: 'test@example.com',
        source: 'homepage',
      }),
    };

    mockGetService.mockResolvedValue(mockService as never);

    // Mock Resend sync failure - function will catch and continue
    vi.mocked(resend.syncContactToResend).mockRejectedValue(new Error('Resend API error'));

    // Execute function - Resend sync will fail but subscription should still succeed
    const { result } = await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'test@example.com',
            source: 'homepage',
          },
        },
      ],
    });

    // Should still succeed even if Resend sync fails
    expect(result).toHaveProperty('success', true);
    expect(mockService.subscribeNewsletter).toHaveBeenCalled();
  });
});
