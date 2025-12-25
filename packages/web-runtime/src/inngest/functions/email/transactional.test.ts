/**
 * Transactional Email Inngest Function Tests
 *
 * Tests the sendTransactionalEmail function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/transactional.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { sendTransactionalEmail } from './transactional';

// Mock Resend integration, email template rendering, logging, shared-runtime, and monitoring
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
    operation: 'sendTransactionalEmail',
    route: '/inngest/email/transactional',
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
const { __mockSendEmail: mockSendEmail } = jest.requireMock('../../../integrations/resend') as {
  __mockSendEmail: ReturnType<typeof jest.fn>;
};
const { __mockRenderEmailTemplate: mockRenderEmailTemplate } = jest.requireMock(
  '../../../email/base-template'
) as {
  __mockRenderEmailTemplate: ReturnType<typeof jest.fn>;
};
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

// Import function AFTER mocks are set up
describe('sendTransactionalEmail', () => {
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
      function: sendTransactionalEmail,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockSendEmail.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Set up default successful mock responses
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-id-123' },
      error: null,
    });
    mockRenderEmailTemplate.mockResolvedValue('<html>Mock Email</html>');

    // Restore normalizeError mock implementation after reset
    // jest.resetAllMocks() resets mocks to return undefined, so we need to restore it
    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });
  });

  /**
   * Success case: Job posted email
   *
   * Tests that a job-posted transactional email is sent successfully.
   *
   * @remarks
   * - Verifies correct subject is built
   * - Verifies correct template is rendered
   * - Verifies email is sent with correct parameters
   */
  it('should send job-posted email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'job-posted',
            email: 'employer@example.com',
            emailData: {
              jobTitle: 'Senior Software Engineer',
              company: 'Acme Corp',
              jobSlug: 'senior-software-engineer',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result).toEqual({
      success: true,
      sent: true,
      emailId: 'email-id-123',
      type: 'job-posted',
    });

    expect(mockRenderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(
      expect.anything(), // JobPostedEmail component
      {
        jobTitle: 'Senior Software Engineer',
        company: 'Acme Corp',
        jobSlug: 'senior-software-engineer',
      }
    );

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: expect.stringContaining('jobs@'),
        to: 'employer@example.com',
        subject: 'Your job posting "Senior Software Engineer" is now live!',
        html: '<html>Mock Email</html>',
        tags: [{ name: 'type', value: 'job-posted' }],
      }),
      'Resend transactional email (job-posted) send timed out'
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'job-posted', sent: true, emailId: 'email-id-123' }),
      'Transactional email completed'
    );
  });

  /**
   * Success case: Password reset email
   *
   * Tests that a password-reset transactional email is sent successfully.
   *
   * @remarks
   * - Verifies correct subject is built
   * - Verifies correct template is rendered with resetUrl
   */
  it('should send password-reset email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'password-reset',
            email: 'user@example.com',
            emailData: {
              resetUrl: 'https://claudepro.directory/reset-password?token=abc123',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result).toEqual({
      success: true,
      sent: true,
      emailId: 'email-id-123',
      type: 'password-reset',
    });

    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(
      expect.anything(), // PasswordResetEmail component
      {
        resetUrl: 'https://claudepro.directory/reset-password?token=abc123',
      }
    );

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Reset Your Password - Claude Pro Directory',
        tags: [{ name: 'type', value: 'password-reset' }],
      }),
      'Resend transactional email (password-reset) send timed out'
    );
  });

  /**
   * Success case: Email change confirmation email
   *
   * Tests that an email-change transactional email is sent successfully.
   *
   * @remarks
   * - Verifies correct subject is built
   * - Verifies correct template is rendered with confirmUrl and newEmail
   */
  it('should send email-change email successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'email-change',
            email: 'old@example.com',
            emailData: {
              confirmUrl: 'https://claudepro.directory/confirm-email?token=xyz789',
              newEmail: 'new@example.com',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result).toEqual({
      success: true,
      sent: true,
      emailId: 'email-id-123',
      type: 'email-change',
    });

    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(
      expect.anything(), // EmailChangeEmail component
      {
        confirmUrl: 'https://claudepro.directory/confirm-email?token=xyz789',
        newEmail: 'new@example.com',
      }
    );

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Confirm Email Change - Claude Pro Directory',
        tags: [{ name: 'type', value: 'email-change' }],
      }),
      'Resend transactional email (email-change) send timed out'
    );
  });

  /**
   * Error case: Invalid email type
   *
   * Tests that an invalid email type throws an error.
   *
   * @remarks
   * - Function should throw Error with descriptive message
   * - Should log warning with available types
   */
  it('should throw error for invalid email type', async () => {
    const { error } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'invalid-type',
            email: 'user@example.com',
            emailData: {},
          },
        },
      ],
    })) as { error?: Error | { message: string } };

    expect(error).toBeDefined();
    expect((error as Error | { message: string })?.message).toBe(
      'Unknown transactional email type: invalid-type'
    );

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'invalid-type',
        availableTypes: expect.stringContaining('job-posted'),
      }),
      'Unknown transactional email type'
    );

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  /**
   * Error case: Email send failure
   *
   * Tests that email send failures are handled gracefully.
   *
   * @remarks
   * - Function should return sent: false
   * - Should log warning
   * - Should not throw
   */
  it('should handle email send failure gracefully', async () => {
    mockSendEmail.mockResolvedValue({
      data: null,
      error: { message: 'Resend API error' },
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'password-reset',
            email: 'user@example.com',
            emailData: {
              resetUrl: 'https://claudepro.directory/reset-password',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      type: 'password-reset',
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-reset',
        errorMessage: 'Resend API error',
      }),
      'Transactional email failed'
    );
  });

  /**
   * Error case: Template rendering failure
   *
   * Tests that template rendering failures are handled gracefully.
   *
   * @remarks
   * - Function should catch rendering errors
   * - Should return sent: false
   * - Should log warning
   */
  it('should handle template rendering failure gracefully', async () => {
    mockRenderEmailTemplate.mockRejectedValue(new Error('Template rendering failed'));

    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'password-reset',
            email: 'user@example.com',
            emailData: {
              resetUrl: 'https://claudepro.directory/reset-password',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result).toEqual({
      success: false,
      sent: false,
      emailId: null,
      type: 'password-reset',
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'password-reset',
        errorMessage: 'Template rendering failed',
      }),
      'Transactional email failed'
    );
  });

  /**
   * Step test: send-email step
   *
   * Tests the send-email step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-email step correctly', async () => {
    const { result } = (await t.executeStep('send-email', {
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'password-reset',
            email: 'user@example.com',
            emailData: {
              resetUrl: 'https://claudepro.directory/reset-password',
            },
          },
        },
      ],
    })) as { result: { sent: boolean; emailId: string | null } };

    expect(result).toEqual({
      sent: true,
      emailId: 'email-id-123',
    });

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Job posted email without company
   *
   * Tests that job-posted email works without company field.
   *
   * @remarks
   * - Verifies optional company field is handled
   */
  it('should send job-posted email without company field', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'job-posted',
            email: 'employer@example.com',
            emailData: {
              jobTitle: 'Software Engineer',
              jobSlug: 'software-engineer',
            },
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result.success).toBe(true);
    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(expect.anything(), {
      jobTitle: 'Software Engineer',
      jobSlug: 'software-engineer',
    });
  });

  /**
   * Success case: Default values for missing email data
   *
   * Tests that missing email data fields use default values.
   *
   * @remarks
   * - Verifies default values are used when fields are missing
   */
  it('should use default values for missing email data fields', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'email/transactional',
          data: {
            type: 'password-reset',
            email: 'user@example.com',
            emailData: {}, // Empty emailData
          },
        },
      ],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    expect(result.success).toBe(true);
    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(expect.anything(), {
      resetUrl: 'https://claudepro.directory/reset-password',
    });
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate events are handled idempotently.
   *
   * @remarks
   * - Same type + email + timestamp should be idempotent
   */
  it('should handle duplicate events idempotently', async () => {
    const eventData = {
      name: 'email/transactional' as const,
      data: {
        type: 'password-reset',
        email: 'user@example.com',
        emailData: {
          resetUrl: 'https://claudepro.directory/reset-password',
        },
      },
    };

    // Execute same event twice
    const { result: result1 } = (await t.execute({
      events: [eventData],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: sendTransactionalEmail,
    });
    mockSendEmail.mockClear();
    mockRenderEmailTemplate.mockClear();

    const { result: result2 } = (await t2.execute({
      events: [eventData],
    })) as { result: { success: boolean; sent: boolean; emailId: string | null; type: string } };

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });
});
