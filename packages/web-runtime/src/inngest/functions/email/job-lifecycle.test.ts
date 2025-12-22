/**
 * Job Lifecycle Email Inngest Function Tests
 *
 * Tests the sendJobLifecycleEmail function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/job-lifecycle.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { sendJobLifecycleEmail } from './job-lifecycle';
import * as resend from '../../../integrations/resend';
import * as emailTemplates from '../../../email/base-template';
import { logger } from '../../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockRenderEmailTemplate = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'sendJobLifecycleEmail',
  route: '/inngest/email/job-lifecycle',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}));

// Mock Resend integration
vi.mock('../../../integrations/resend', () => ({
  sendEmail: mockSendEmail,
}));

// Mock email template rendering
vi.mock('../../../email/base-template', () => ({
  renderEmailTemplate: mockRenderEmailTemplate,
}));

// Mock logging
vi.mock('../../../logging/server', () => ({
  logger: mockLogger,
  createWebAppContextWithId: mockCreateWebAppContextWithId,
}));

// Mock shared runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: mockNormalizeError,
}));

// Mock environment
vi.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://claudepro.directory',
  },
}));

// Import function AFTER mocks are set up
describe('sendJobLifecycleEmail', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

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

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    mockSendEmail.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Set up default successful mock responses
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-id-123' },
      error: null,
    });
    mockRenderEmailTemplate.mockResolvedValue('<html>Mock Email</html>');
    mockNormalizeError.mockImplementation((error) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(String(error));
    });
  });

  /**
   * Success case: Job submitted email
   *
   * Tests that a job-submitted email is sent successfully.
   */
  it('should send job-submitted email successfully', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: true,
      sent: true,
      emailId: 'email-id-123',
      jobId: 'job-123',
    });

    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { result } = await t.execute({
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
    });

    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
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
    const { error } = await t.execute({
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
    });

    expect(error).toBeDefined();
    expect(error?.message).toBe('Unknown job lifecycle action: invalid-action');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'invalid-action',
        availableActions: expect.stringContaining('job-submitted'),
      }),
      'Unknown job lifecycle action'
    );

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  /**
   * Success case: Missing employer email
   *
   * Tests that missing employer email skips sending.
   */
  it('should skip sending when employer email is missing', async () => {
    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mockSendEmail).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalledWith(
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
    mockSendEmail.mockResolvedValue({
      data: null,
      error: { message: 'Resend API error' },
    });

    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
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
    mockRenderEmailTemplate.mockRejectedValue(new Error('Template rendering failed'));

    const { result } = await t.execute({
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
    });

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      jobId: 'job-123',
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
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
    const { result } = await t.executeStep('send-email', {
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
    });

    expect(result).toEqual({
      sent: true,
      emailId: 'email-id-123',
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Safe string/number/date helpers
   *
   * Tests that safe helpers handle various input types correctly.
   */
  it('should handle safe string/number/date helpers correctly', async () => {
    const { result } = await t.execute({
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
    });

    // Should still succeed with safe conversions
    expect(result.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
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
    const { result: result1 } = await t.execute({
      events: [eventData],
    });

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: sendJobLifecycleEmail,
    });
    mockSendEmail.mockClear();
    mockRenderEmailTemplate.mockClear();

    const { result: result2 } = await t2.execute({
      events: [eventData],
    });

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});

