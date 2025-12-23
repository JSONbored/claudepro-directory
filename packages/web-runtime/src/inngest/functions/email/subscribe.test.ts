/**
 * Newsletter Subscribe Inngest Function Tests
 *
 * Tests the subscribeNewsletter function using @inngest/test.
 * This tests the function logic, not the route handler.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { subscribeNewsletter } from './subscribe';

// Mock dependencies - define mocks directly in jest.mock() factory functions
jest.mock('../../../integrations/resend', () => {
  const mockSyncContactToResend = jest.fn();
  const mockBuildContactProperties = jest.fn();
  const mockResolveNewsletterInterest = jest.fn();
  const mockSendEmail = jest.fn();
  const mockEnrollInOnboardingSequence = jest.fn();
  return {
    syncContactToResend: mockSyncContactToResend,
    buildContactProperties: mockBuildContactProperties,
    resolveNewsletterInterest: mockResolveNewsletterInterest,
    sendEmail: mockSendEmail,
    enrollInOnboardingSequence: mockEnrollInOnboardingSequence,
    __mockSyncContactToResend: mockSyncContactToResend,
    __mockBuildContactProperties: mockBuildContactProperties,
    __mockResolveNewsletterInterest: mockResolveNewsletterInterest,
    __mockSendEmail: mockSendEmail,
    __mockEnrollInOnboardingSequence: mockEnrollInOnboardingSequence,
  };
});

jest.mock('next/cache', () => {
  const mockRevalidateTag = jest.fn();
  return {
    revalidateTag: mockRevalidateTag,
    __mockRevalidateTag: mockRevalidateTag,
  };
});

jest.mock('../../../data/service-factory', () => {
  const mockGetService = jest.fn();
  return {
    getService: mockGetService,
    __mockGetService: mockGetService,
  };
});

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'subscribeNewsletter',
    route: '/inngest/email/subscribe',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockValidateEmail = jest.fn((email: string) => ({
    valid: true,
    normalized: email.toLowerCase().trim(),
    error: null,
  }));
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    // Always return an Error object with a message property
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  return {
    validateEmail: mockValidateEmail,
    normalizeError: mockNormalizeError,
    __mockValidateEmail: mockValidateEmail,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('../../../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn();
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

jest.mock('../../utils/monitoring', () => ({
  sendCronSuccessHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendBetterStackHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
  isBetterStackMonitoringEnabled: jest.fn(() => false),
  isInngestMonitoringEnabled: jest.fn(() => false),
  isCriticalFailureMonitoringEnabled: jest.fn(() => false),
  isCronSuccessMonitoringEnabled: jest.fn(() => false),
  isApiEndpointMonitoringEnabled: jest.fn(() => false),
}));

// Get mocks for use in tests
const {
  __mockSyncContactToResend: mockSyncContactToResend,
  __mockBuildContactProperties: mockBuildContactProperties,
  __mockResolveNewsletterInterest: mockResolveNewsletterInterest,
  __mockSendEmail: mockSendEmail,
  __mockEnrollInOnboardingSequence: mockEnrollInOnboardingSequence,
} = jest.requireMock('../../../integrations/resend') as {
  __mockSyncContactToResend: ReturnType<typeof jest.fn>;
  __mockBuildContactProperties: ReturnType<typeof jest.fn>;
  __mockResolveNewsletterInterest: ReturnType<typeof jest.fn>;
  __mockSendEmail: ReturnType<typeof jest.fn>;
  __mockEnrollInOnboardingSequence: ReturnType<typeof jest.fn>;
};
const { __mockRevalidateTag: mockRevalidateTag } = jest.requireMock('next/cache') as {
  __mockRevalidateTag: ReturnType<typeof jest.fn>;
};
const { __mockGetService: mockGetService } = jest.requireMock('../../../data/service-factory') as {
  __mockGetService: ReturnType<typeof jest.fn>;
};
const {
  __mockLogger: mockLogger,
  __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
} = jest.requireMock('../../../logging/server') as {
  __mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
};
const {
  __mockValidateEmail: mockValidateEmail,
  __mockNormalizeError: mockNormalizeError,
} = jest.requireMock('@heyclaude/shared-runtime') as {
  __mockValidateEmail: ReturnType<typeof jest.fn>;
  __mockNormalizeError: ReturnType<typeof jest.fn>;
};
const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock('../../../email/base-template') as {
  __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
};

describe('subscribeNewsletter', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: subscribeNewsletter,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetService.mockReset();
    mockSyncContactToResend.mockReset();
    mockBuildContactProperties.mockReset();
    mockResolveNewsletterInterest.mockReset();
    mockSendEmail.mockReset();
    mockEnrollInOnboardingSequence.mockReset();
    mockRevalidateTag.mockReset();

    // Set up default successful mock responses
    mockResolveNewsletterInterest.mockReturnValue('agents');
    mockBuildContactProperties.mockReturnValue({
      source: 'homepage',
      primaryInterest: 'agents',
    });
    mockSyncContactToResend.mockResolvedValue({
      resendContactId: 'contact-id',
      syncStatus: 'synced' as const,
      syncError: null,
      topicIds: [],
    });
    mockSendEmail.mockResolvedValue({ id: 'email-id' });
    mockEnrollInOnboardingSequence.mockResolvedValue(undefined);
    mockRenderEmailTemplate.mockResolvedValue('<html>Welcome Email</html>');
    
    // Restore normalizeError mock implementation after reset
    // jest.resetAllMocks() resets mocks to return undefined, so we need to restore it
    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });
    
    // Restore validateEmail mock implementation after reset
    mockValidateEmail.mockImplementation((email: string) => ({
      valid: true,
      normalized: email.toLowerCase().trim(),
      error: null,
    }));
  });

  it('should subscribe user successfully', async () => {
    const mockService = {
      subscribeNewsletter: jest.fn().mockResolvedValue({
        success: true,
        subscription_id: 'sub-id',
        was_resubscribed: false,
      }),
      getSubscriptionById: jest.fn().mockResolvedValue({
        id: 'sub-id',
        email: 'test@example.com',
        source: 'homepage',
      }),
    };

    mockGetService.mockResolvedValue(mockService as never);

    // Execute function - InngestTestEngine will run the actual function code
    // The mocks above will be used when the function executes
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'test@example.com',
            source: 'homepage',
          },
        },
      ],
    })) as { result: { success: boolean; subscriptionId: string } };

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('subscriptionId', 'sub-id');
    expect(mockService.subscribeNewsletter).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith('newsletter', 'default');
  });

  it('should handle invalid email', async () => {
    // Mock validateEmail to return invalid
    mockValidateEmail.mockReturnValueOnce({
      valid: false,
      normalized: null,
      error: 'Invalid email format',
    });

    // Execute function - validation will fail in the validate-email step
    const { error } = (await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'invalid-email',
            source: 'homepage',
          },
        },
      ],
    })) as { error?: Error | { message: string } };

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
      subscribeNewsletter: jest.fn().mockResolvedValue({
        success: true,
        subscription_id: 'sub-id',
        was_resubscribed: false,
      }),
      getSubscriptionById: jest.fn().mockResolvedValue({
        id: 'sub-id',
        email: 'test@example.com',
        source: 'homepage',
      }),
    };

    mockGetService.mockResolvedValue(mockService as never);

    // Mock Resend sync failure - function will catch and continue
    mockSyncContactToResend.mockRejectedValue(new Error('Resend API error'));

    // Execute function - Resend sync will fail but subscription should still succeed
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/subscribe',
          data: {
            email: 'test@example.com',
            source: 'homepage',
          },
        },
      ],
    })) as { result: { success: boolean; subscriptionId: string } };

    // Should still succeed even if Resend sync fails
    expect(result).toHaveProperty('success', true);
    expect(mockService.subscribeNewsletter).toHaveBeenCalled();
  });
});
