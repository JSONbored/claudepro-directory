/**
 * Dynamic Drip Campaign Inngest Function Integration Tests
 *
 * Tests newsletterDripCampaign and jobPostingDripCampaign functions → NewsletterService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Email
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { newsletterDripCampaign, jobPostingDripCampaign } from './drip-campaigns';

// Mock email templates, integrations/resend, data/service-factory, logging, shared-runtime, environment, and monitoring
jest.mock('../../../email/base-template', () => {
  // @ts-expect-error - TypeScript incorrectly infers 'never' for jest.fn() in factory functions
  const mockRenderEmailTemplate = jest.fn().mockResolvedValue('<html>Test Email</html>');
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

jest.mock('../../../integrations/resend', () => {
  // @ts-expect-error - TypeScript incorrectly infers 'never' for jest.fn() in factory functions
  const mockSendEmail = jest.fn().mockResolvedValue({
    data: { id: 'email-123' },
    error: null,
  });
  return {
    sendEmail: mockSendEmail,
    __mockSendEmail: mockSendEmail,
  };
});

// Mock service-factory to return REAL services (not mocked services) for integration testing
// This allows us to test the complete flow: Inngest function → NewsletterService → database
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
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
    operation: 'newsletterDripCampaign',
    route: '/inngest/email/drip-campaigns/newsletter',
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
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  const mockEscapeHtml = jest.fn((text: string) => text);
  return {
    normalizeError: mockNormalizeError,
    escapeHtml: mockEscapeHtml,
    __mockNormalizeError: mockNormalizeError,
    __mockEscapeHtml: mockEscapeHtml,
  };
});

jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    RESEND_FROM_EMAIL: 'Claude Pro Directory <hello@claudepro.directory>',
  },
}));

jest.mock('../../utils/monitoring', () => ({
  isBetterStackMonitoringEnabled: jest.fn().mockReturnValue(false),
  isInngestMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCriticalFailureMonitoringEnabled: jest.fn().mockReturnValue(false),
  isCronSuccessMonitoringEnabled: jest.fn().mockReturnValue(false),
  isApiEndpointMonitoringEnabled: jest.fn().mockReturnValue(false),
  sendBetterStackHeartbeat: jest.fn(),
  sendCriticalFailureHeartbeat: jest.fn(),
  sendCronSuccessHeartbeat: jest.fn(),
  sendApiEndpointHeartbeat: jest.fn(),
}));

// Import Prismocker for database integration testing
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';
const { __mockLogger: mockLogger, __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId } =
  jest.requireMock('../../../logging/server') as {
    __mockLogger: {
      info: ReturnType<typeof jest.fn>;
      warn: ReturnType<typeof jest.fn>;
      error: ReturnType<typeof jest.fn>;
    };
    __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  };
const { __mockNormalizeError: mockNormalizeError } = jest.requireMock(
  '@heyclaude/shared-runtime'
) as {
  __mockNormalizeError: ReturnType<typeof jest.fn>;
};
const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock(
  '../../../email/base-template'
) as {
  __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
};
const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../../integrations/resend') as {
  __mockSendEmail: ReturnType<typeof jest.fn>;
};

// Import function AFTER mocks are set up
describe('newsletterDripCampaign', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Prismocker instance for database integration testing
   */
  let prismocker: PrismaClient;

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: newsletterDripCampaign,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockSendEmail.mockReset();
    mockRenderEmailTemplate.mockReset();
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'newsletterDripCampaign',
      route: '/inngest/email/drip-campaigns/newsletter',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Restore mock implementations after reset
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    });
    mockRenderEmailTemplate.mockResolvedValue('<html>Test Email</html>');
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
    // Note: InngestTestEngine doesn't have an explicit cleanup method,
    // but clearing the reference helps ensure no lingering handles
    (t as any) = null;
  });

  /**
   * Success case: User clicks email (engaged path)
   *
   * Tests that when user clicks email, power user tips are sent.
   */
  it('should send power user tips when user clicks email', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_signup',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-engagement',
          handler: () => {
            // Mock waitForEvent to return the click event immediately
            return {
              name: 'resend/email.clicked',
              data: {
                to: ['test@example.com'],
                click: {
                  link: 'https://example.com',
                },
              },
            };
          },
        },
        {
          id: 'delay-tips-email',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-digest',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { email: string; engaged: boolean; completed: boolean } };

    expect(result.email).toBe('test@example.com');
    expect(result.engaged).toBe(true);
    expect(result.completed).toBe(true);

    // Should send power user tips after delay
    expect(mockRenderEmailTemplate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: '🚀 Pro tips for getting the most out of Claude',
      })
    );
  });

  /**
   * Success case: User does not click email (nudge path)
   *
   * Tests that when user does not click email, engagement nudge is sent.
   */
  it('should send engagement nudge when user does not click email', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_signup',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-engagement',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no click event)
            return null;
          },
        },
        {
          id: 'wait-for-digest',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { email: string; engaged: boolean; completed: boolean } };

    expect(result.email).toBe('test@example.com');
    expect(result.engaged).toBe(false);
    expect(result.completed).toBe(true);

    // Should send engagement nudge
    expect(mockRenderEmailTemplate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Did you know? 5 ways to supercharge your Claude experience',
      })
    );
  });

  /**
   * Success case: Still subscribed - send digest preview
   *
   * Tests that digest preview is sent if user is still subscribed.
   */
  it('should send digest preview if user is still subscribed', async () => {
    // Seed Prismocker with subscription data (real NewsletterService will query this)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-123',
          email: 'test@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          subscribed_at: new Date('2024-01-01'),
        },
      ]);
    }

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_signup',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-engagement',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no click event)
            return null;
          },
        },
        {
          id: 'wait-for-digest',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { email: string; engaged: boolean; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should send digest preview after wait period
    expect(mockRenderEmailTemplate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: '📬 Your first Claude Pro Directory digest is coming!',
      })
    );
  });

  /**
   * Success case: Unsubscribed - skip digest preview
   *
   * Tests that digest preview is skipped if user is unsubscribed.
   */
  it('should skip digest preview if user is unsubscribed', async () => {
    // Seed Prismocker with unsubscribed subscription (real NewsletterService will query this)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-123',
          email: 'test@example.com',
          status: 'unsubscribed',
          confirmed: true,
          unsubscribed_at: new Date('2024-01-02'),
          subscribed_at: new Date('2024-01-01'),
        },
      ]);
    }

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_signup',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-engagement',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no click event)
            return null;
          },
        },
        {
          id: 'wait-for-digest',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { email: string; engaged: boolean; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should not send digest preview
    const sendEmailCalls = mockSendEmail.mock.calls;
    const digestPreviewCall = sendEmailCalls.find((call) =>
      call[0]?.subject?.includes('digest is coming')
    );
    expect(digestPreviewCall).toBeUndefined();
  });

  /**
   * Step test: record-campaign-start step
   *
   * Tests the record-campaign-start step individually.
   */
  it('should execute record-campaign-start step correctly', async () => {
    const { result } = (await t.executeStep('record-campaign-start', {
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_signup',
          },
        },
      ],
    })) as { result: void };

    expect(result).toBeNull();
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        triggerSource: 'newsletter_signup',
      }),
      'Newsletter drip campaign started'
    );
  });
});

describe('jobPostingDripCampaign', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock services
   */
  let mockJobsService: {
    getJobStatsById: ReturnType<typeof jest.fn>;
    getJobStatusById: ReturnType<typeof jest.fn>;
  };

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: jobPostingDripCampaign,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetService.mockReset();
    mockSendEmail.mockReset();
    mockRenderEmailTemplate.mockReset();
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'jobPostingDripCampaign',
      route: '/inngest/email/drip-campaigns/job-posting',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Restore mock implementations after reset
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-123' },
      error: null,
    });
    mockRenderEmailTemplate.mockResolvedValue('<html>Test Email</html>');

    // Set up mock JobsService
    mockJobsService = {
      // @ts-expect-error - TypeScript incorrectly infers 'never' for jest.fn() in mock setup
      getJobStatsById: jest.fn().mockResolvedValue({
        status: 'active',
        view_count: 100,
        click_count: 10,
      }),
      // @ts-expect-error - TypeScript incorrectly infers 'never' for jest.fn() in mock setup
      getJobStatusById: jest.fn().mockResolvedValue({
        status: 'active',
      }),
    };

    (mockGetService as any).mockResolvedValue(mockJobsService);
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
    // Note: InngestTestEngine doesn't have an explicit cleanup method,
    // but clearing the reference helps ensure no lingering handles
    (t as any) = null;
  });

  /**
   * Success case: Send confirmation email successfully
   *
   * Tests that confirmation email is sent when job is published.
   */
  it('should send confirmation email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.jobId).toBe('job-123');
    expect(result.employerEmail).toBe('employer@example.com');
    expect(result.completed).toBe(true);

    expect(mockRenderEmailTemplate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'employer@example.com',
        subject: expect.stringContaining('Your job posting'),
      })
    );
  });

  /**
   * Success case: User views posting - skip share reminder
   *
   * Tests that share reminder is skipped if user views posting.
   */
  it('should skip share reminder if user views posting', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return the view event immediately
            return {
              name: 'resend/email.clicked',
              data: {
                to: ['employer@example.com'],
                click: {
                  link: 'https://example.com',
                },
              },
            };
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should not send share reminder
    const sendEmailCalls = mockSendEmail.mock.calls;
    const shareReminderCall = sendEmailCalls.find((call) =>
      call[0]?.subject?.includes('Boost visibility')
    );
    expect(shareReminderCall).toBeUndefined();
  });

  /**
   * Success case: User does not view posting - send share reminder
   *
   * Tests that share reminder is sent if user does not view posting.
   */
  it('should send share reminder if user does not view posting', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should send share reminder
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'employer@example.com',
        subject: expect.stringContaining('Boost visibility'),
      })
    );
  });

  /**
   * Success case: Send performance report at 7 days
   *
   * Tests that performance report is sent at 7 days.
   */
  it('should send performance report at 7 days', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should send performance report
    expect(mockJobsService.getJobStatsById).toHaveBeenCalledWith('job-123');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'employer@example.com',
        subject: expect.stringContaining('Your job posting stats'),
      })
    );
  });

  /**
   * Success case: Send expiration reminder at 25 days
   *
   * Tests that expiration reminder is sent at 25 days if job is still active.
   */
  it('should send expiration reminder at 25 days if job is still active', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should check job status and send expiration reminder
    expect(mockJobsService.getJobStatusById).toHaveBeenCalledWith('job-123');
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'employer@example.com',
        subject: expect.stringContaining('expires in 5 days'),
      })
    );
  });

  /**
   * Success case: Skip expiration reminder if job is not active
   *
   * Tests that expiration reminder is skipped if job is not active.
   */
  it('should skip expiration reminder if job is not active', async () => {
    mockJobsService.getJobStatusById.mockResolvedValue({
      status: 'expired',
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    // Should not send expiration reminder
    const sendEmailCalls = mockSendEmail.mock.calls;
    const expirationReminderCall = sendEmailCalls.find((call) =>
      call[0]?.subject?.includes('expires in 5 days')
    );
    expect(expirationReminderCall).toBeUndefined();
  });

  /**
   * Error case: Email send failure
   *
   * Tests that email send failures are handled gracefully.
   */
  it('should handle email send failures gracefully', async () => {
    mockSendEmail.mockResolvedValue({
      data: null,
      error: {
        message: 'Resend API error: Rate limit exceeded',
      },
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
      steps: [
        {
          id: 'wait-for-view',
          handler: () => {
            // Mock waitForEvent to return null (timeout - no view event)
            return null;
          },
        },
        {
          id: 'wait-for-report',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
        {
          id: 'wait-for-expiration-reminder',
          handler: () => {
            // Mock step.sleep to return immediately (no-op)
          },
        },
      ],
    })) as { result: { jobId: string; employerEmail: string; completed: boolean } };

    expect(result.completed).toBe(true);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-123',
        errorMessage: 'Resend API error: Rate limit exceeded',
      }),
      'Failed to send job confirmation email'
    );
  });

  /**
   * Step test: send-confirmation step
   *
   * Tests the send-confirmation step individually.
   */
  it('should execute send-confirmation step correctly', async () => {
    const { result } = (await t.executeStep('send-confirmation', {
      events: [
        {
          name: 'job/published',
          data: {
            jobId: 'job-123',
            employerEmail: 'employer@example.com',
            employerName: 'Test Employer',
            jobTitle: 'Test Job',
            jobSlug: 'test-job',
          },
        },
      ],
    })) as { result: string | undefined };

    expect(result).toBe('email-123');
    expect(mockRenderEmailTemplate).toHaveBeenCalled();
    expect(mockSendEmail).toHaveBeenCalled();
  });
});
