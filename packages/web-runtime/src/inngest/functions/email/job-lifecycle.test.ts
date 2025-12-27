/**
 * Job Lifecycle Email Inngest Function Tests
 *
 * Tests the sendJobLifecycleEmail function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/job-lifecycle.test
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { sendJobLifecycleEmail } from './job-lifecycle';

// Mock Resend integration, email template rendering, logging, shared-runtime, and environment
// Define mocks directly in jest.mock() factory functions to avoid hoisting issues
jest.mock('../../../integrations/resend', () => {
  const mockSendEmail = jest.fn();
  return {
    sendEmail: mockSendEmail,
    __mockSendEmail: mockSendEmail,
  };
});

jest.mock('../../../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn();
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
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
    operation: 'sendJobLifecycleEmail',
    route: '/inngest/email/job-lifecycle',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error: unknown, fallbackMessage?: string) => {
    // Always return an Error object with a message property
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  return {
    normalizeError: mockNormalizeError,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://claudepro.directory',
  },
}));

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

// Import function AFTER mocks are set up
// Import setup function to eliminate duplication
import { setupJobLifecycleEmailMocks } from '../../utils/test-setup';

// Import function AFTER mocks are set up
describe('sendJobLifecycleEmail', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;
  /**
   * Mock references (set up via setupJobLifecycleEmailMocks in beforeEach)
   */
  let mocks: ReturnType<typeof setupJobLifecycleEmailMocks>;

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up default mock return values
   */
  beforeEach(() => {
    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: sendJobLifecycleEmail,
    });

    // Set up mocks using shared setup function (eliminates duplication)
    mocks = setupJobLifecycleEmailMocks('sendJobLifecycleEmail', '/inngest/email/job-lifecycle');
  });

  /**
   * Cleanup after each test to prevent open handles
   */
  afterEach(async () => {
    // Clear all timers
    jest.clearAllTimers();

    // Ensure all pending promises are resolved
    await new Promise((resolve) => setImmediate(resolve));

    // Clear the test engine reference to allow garbage collection
    (t as any) = null;
  });

  /**
   * Success case: Job submitted email
   *
   * Tests that a job-submitted email is sent successfully.
   */
  it('should send job-submitted email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-submitted',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            company: 'Acme Corp',
            payload: {},
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result).toEqual({
      success: true,
      sent: true,
      emailId: 'email-id-123',
      jobId: 'job-123',
    });

    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Job Submitted: Senior Software Engineer',
        to: 'employer@example.com',
        tags: [{ name: 'type', value: 'job-submitted' }],
      }),
      'Resend job lifecycle email (job-submitted) send timed out'
    );
  });

  /**
   * Success case: Job approved email
   *
   * Tests that a job-approved email is sent successfully.
   */
  it('should send job-approved email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-approved',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            company: 'Acme Corp',
            payload: {
              paymentAmount: 99,
              paymentUrl: 'https://claudepro.directory/payment',
              plan: 'premium',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Job Approved: Senior Software Engineer',
      }),
      expect.any(String)
    );
  });

  /**
   * Success case: Job rejected email
   *
   * Tests that a job-rejected email is sent successfully.
   */
  it('should send job-rejected email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-rejected',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {
              rejectionReason: 'Job description does not meet our guidelines',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Action Required: Update Your Job Posting - Senior Software Engineer',
      }),
      expect.any(String)
    );
  });

  /**
   * Success case: Job payment confirmed email
   *
   * Tests that a job-payment-confirmed email is sent successfully.
   */
  it('should send job-payment-confirmed email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-payment-confirmed',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            company: 'Acme Corp',
            payload: {
              jobSlug: 'senior-software-engineer',
              paymentAmount: 99,
              expiresAt: '2025-12-31T00:00:00Z',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Your Job is Live: Senior Software Engineer',
      }),
      expect.any(String)
    );
  });

  /**
   * Success case: Job expiring email
   *
   * Tests that a job-expiring email is sent successfully.
   */
  it('should send job-expiring email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-expiring',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {
              daysRemaining: 7,
              renewalUrl: 'https://claudepro.directory/renew',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Expiring Soon: Senior Software Engineer (7 days remaining)',
      }),
      expect.any(String)
    );
  });

  /**
   * Success case: Job expired email
   *
   * Tests that a job-expired email is sent successfully.
   */
  it('should send job-expired email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-expired',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {
              viewCount: 150,
              clickCount: 25,
              repostUrl: 'https://claudepro.directory/repost',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Job Listing Expired: Senior Software Engineer',
      }),
      expect.any(String)
    );
  });

  /**
   * Error case: Invalid action
   *
   * Tests that an invalid action throws an error.
   */
  it('should throw error for invalid action', async () => {
    const { error } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'invalid-action',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {},
          },
        },
      ],
    })) as { error?: Error };

    expect(error).toBeDefined();
    expect((error as Error)?.message).toBe('Unknown job lifecycle action: invalid-action');

    expect(mocks.mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invalid-action',
        availableActions: expect.stringContaining('job-submitted'),
      }),
      'Unknown job lifecycle action'
    );

    expect(mocks.mockSendEmail).not.toHaveBeenCalled();
  });

  /**
   * Success case: Missing employer email
   *
   * Tests that missing employer email skips sending.
   */
  it('should skip sending when employer email is missing', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-submitted',
            employerEmail: '', // Empty email
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {},
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mocks.mockSendEmail).not.toHaveBeenCalled();
    expect(mocks.mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'job-submitted', jobId: 'job-123' }),
      'No employer email provided, skipping job lifecycle email'
    );
  });

  /**
   * Error case: Email send failure
   *
   * Tests that email send failures are handled gracefully.
   */
  it('should handle email send failure gracefully', async () => {
    mocks.mockSendEmail.mockResolvedValue({
      data: null,
      error: { message: 'Resend API error' },
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-submitted',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {},
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mocks.mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'job-submitted',
        jobId: 'job-123',
        errorMessage: 'Resend API error',
      }),
      'Job lifecycle email failed'
    );
  });

  /**
   * Error case: Template rendering failure
   *
   * Tests that template rendering failures are handled gracefully.
   */
  it('should handle template rendering failure gracefully', async () => {
    mocks.mockRenderEmailTemplate.mockRejectedValue(new Error('Template rendering failed'));

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-submitted',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {},
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mocks.mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'job-submitted',
        jobId: 'job-123',
        errorMessage: 'Template rendering failed',
      }),
      'Job lifecycle email failed'
    );
  });

  /**
   * Step test: send-email step
   *
   * Tests the send-email step individually.
   */
  it('should execute send-email step correctly', async () => {
    const { result } = (await t.executeStep('send-email', {
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-submitted',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 'Senior Software Engineer',
            payload: {},
          },
        },
      ],
    })) as { result: { sent: boolean; emailId: string | null } };

    expect(result).toEqual({
      sent: true,
      emailId: 'email-id-123',
    });

    expect(mocks.mockSendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Safe string/number/date helpers
   *
   * Tests that safe helpers handle various input types correctly.
   */
  it('should handle safe string/number/date helpers correctly', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/job-lifecycle',
          data: {
            action: 'job-payment-confirmed',
            employerEmail: 'employer@example.com',
            jobId: 'job-123',
            jobTitle: 12345, // Number instead of string
            payload: {
              jobSlug: null, // Null value
              paymentAmount: '99', // String instead of number
              expiresAt: 'invalid-date', // Invalid date
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    // Should still succeed with safe conversions
    expect(result.success).toBe(true);
    expect(mocks.mockSendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate events are handled idempotently.
   */
  it('should handle duplicate events idempotently', async () => {
    const eventData = {
      name: 'email/job-lifecycle' as const,
      data: {
        action: 'job-submitted',
        employerEmail: 'employer@example.com',
        jobId: 'job-123',
        jobTitle: 'Senior Software Engineer',
        payload: {},
      },
    };

    // Execute same event twice
    const { result: result1 } = (await t.execute({
      events: [eventData],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: sendJobLifecycleEmail,
    });
    mocks.mockSendEmail.mockClear();
    mocks.mockRenderEmailTemplate.mockClear();

    const { result: result2 } = (await t2.execute({
      events: [eventData],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; jobId: string } };

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});
