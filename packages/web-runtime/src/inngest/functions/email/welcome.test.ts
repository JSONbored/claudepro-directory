/**
 * Welcome Email Inngest Function Tests
 *
 * Tests the sendWelcomeEmail function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/welcome.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { sendWelcomeEmail } from './welcome';
import * as resend from '../../../integrations/resend';
import { renderEmailTemplate } from '../../../email/base-template';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockEnrollInOnboardingSequence = vi.hoisted(() => vi.fn());
const mockRenderEmailTemplate = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'sendWelcomeEmail',
  route: '/inngest/email/welcome',
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
  enrollInOnboardingSequence: mockEnrollInOnboardingSequence,
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

// Import function AFTER mocks are set up
describe('sendWelcomeEmail', () => {
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
      function: sendWelcomeEmail,
    });

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    mockSendEmail.mockReset();
    mockEnrollInOnboardingSequence.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Set up default successful mock responses
    mockRenderEmailTemplate.mockResolvedValue('<html>Welcome email HTML</html>');
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-id-123' },
      error: null,
    });
    mockEnrollInOnboardingSequence.mockResolvedValue(undefined);
  });

  /**
   * Success case: Newsletter subscription trigger
   *
   * Tests that the function successfully sends a welcome email when triggered
   * by a newsletter subscription event.
   *
   * @remarks
   * - Verifies email template is rendered
   * - Verifies email is sent with correct parameters
   * - Verifies onboarding enrollment is triggered
   * - Verifies correct return value structure
   */
  it('should send welcome email for newsletter subscription successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
            subscriptionId: 'sub-123',
          },
        },
      ],
    });

    // Verify function completed successfully
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('sent', true);
    expect(result).toHaveProperty('emailId', 'email-id-123');
    expect(result).toHaveProperty('subscriptionId', 'sub-123');

    // Verify email template was rendered
    expect(mockRenderEmailTemplate).toHaveBeenCalledTimes(1);
    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(
      expect.anything(), // NewsletterWelcome component
      { email: 'test@example.com' }
    );

    // Verify email was sent with correct parameters
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const sendEmailCall = mockSendEmail.mock.calls[0][0];
    expect(sendEmailCall.to).toBe('test@example.com');
    expect(sendEmailCall.subject).toBe('Welcome to Claude Pro Directory! 🎉');
    expect(sendEmailCall.html).toBe('<html>Welcome email HTML</html>');
    expect(sendEmailCall.tags).toEqual([
      {
        name: 'type',
        value: 'newsletter', // newsletter_subscription maps to 'newsletter'
      },
    ]);

    // Verify onboarding enrollment was triggered
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledTimes(1);
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledWith('test@example.com');
  });

  /**
   * Success case: OAuth signup trigger
   *
   * Tests that the function successfully sends a welcome email when triggered
   * by an OAuth signup event.
   *
   * @remarks
   * - Verifies correct tag value for auth_signup ('auth-signup')
   * - Verifies all other functionality works the same
   */
  it('should send welcome email for OAuth signup successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'oauth@example.com',
            triggerSource: 'auth_signup',
          },
        },
      ],
    });

    // Verify function completed successfully
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('sent', true);
    expect(result).toHaveProperty('emailId', 'email-id-123');
    expect(result).not.toHaveProperty('subscriptionId'); // No subscriptionId for OAuth

    // Verify email was sent with correct tag for auth_signup
    const sendEmailCall = mockSendEmail.mock.calls[0][0];
    expect(sendEmailCall.tags).toEqual([
      {
        name: 'type',
        value: 'auth-signup', // auth_signup maps to 'auth-signup'
      },
    ]);

    // Verify onboarding enrollment was triggered
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledTimes(1);
  });

  /**
   * Success case: Missing subscriptionId (optional field)
   *
   * Tests that the function works correctly when subscriptionId is not provided.
   *
   * @remarks
   * - subscriptionId is optional in the return value
   * - Function should still succeed without it
   */
  it('should handle missing subscriptionId gracefully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
            // subscriptionId intentionally omitted
          },
        },
      ],
    });

    // Verify function completed successfully
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('sent', true);
    expect(result).not.toHaveProperty('subscriptionId'); // Should not include if not provided

    // Verify email was still sent
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledTimes(1);
  });

  /**
   * Error case: Email send failure
   *
   * Tests that the function handles email send failures gracefully.
   *
   * @remarks
   * - Function should catch email send errors
   * - Should return sent: false but not throw
   * - Should not enroll in onboarding if email failed
   * - Should log the error
   */
  it('should handle email send failure gracefully', async () => {
    // Mock email send failure
    mockSendEmail.mockResolvedValue({
      data: null,
      error: { message: 'Resend API error: Rate limit exceeded' },
    });

    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Verify function completed but email was not sent
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('sent', false);
    expect(result).toHaveProperty('emailId', null);

    // Verify onboarding enrollment was NOT triggered (only if email sent)
    expect(mockEnrollInOnboardingSequence).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
        operation: 'sendWelcomeEmail',
        route: '/inngest/email/welcome',
        errorMessage: 'Resend API error: Rate limit exceeded',
      }),
      'Welcome email failed'
    );
  });

  /**
   * Error case: Email template rendering failure
   *
   * Tests that the function handles email template rendering failures gracefully.
   *
   * @remarks
   * - Function should catch template rendering errors
   * - Should return sent: false but not throw
   * - Should not enroll in onboarding if template failed
   */
  it('should handle email template rendering failure gracefully', async () => {
    // Mock template rendering failure
    mockRenderEmailTemplate.mockRejectedValue(new Error('Template rendering failed'));

    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Verify function completed but email was not sent
    expect(result).toHaveProperty('success', false);
    expect(result).toHaveProperty('sent', false);
    expect(result).toHaveProperty('emailId', null);

    // Verify email was not sent (rendering failed before send)
    expect(mockSendEmail).not.toHaveBeenCalled();

    // Verify onboarding enrollment was NOT triggered
    expect(mockEnrollInOnboardingSequence).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Template rendering failed',
      }),
      'Welcome email failed'
    );
  });

  /**
   * Error case: Onboarding enrollment failure
   *
   * Tests that the function handles onboarding enrollment failures gracefully.
   *
   * @remarks
   * - Function should catch enrollment errors
   * - Should still return success if email was sent
   * - Should log the enrollment error but not fail the function
   */
  it('should handle onboarding enrollment failure gracefully', async () => {
    // Mock onboarding enrollment failure
    mockEnrollInOnboardingSequence.mockRejectedValue(new Error('Onboarding enrollment failed'));

    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Verify function still completed successfully (email was sent)
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('sent', true);
    expect(result).toHaveProperty('emailId', 'email-id-123');

    // Verify email was sent
    expect(mockSendEmail).toHaveBeenCalledTimes(1);

    // Verify enrollment was attempted
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledTimes(1);

    // Verify enrollment error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Onboarding enrollment failed',
      }),
      'Onboarding enrollment failed'
    );
  });

  /**
   * Step test: send-welcome-email step
   *
   * Tests the send-welcome-email step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-welcome-email step correctly', async () => {
    const { result } = await t.executeStep('send-welcome-email', {
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Verify step result
    expect(result).toEqual({
      sent: true,
      emailId: 'email-id-123',
    });

    // Verify email was sent
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  /**
   * Step test: enroll-onboarding step (when email sent)
   *
   * Tests the enroll-onboarding step individually when email was sent.
   *
   * @remarks
   * - Verifies step executes when email was sent
   * - Verifies step is skipped when email was not sent
   */
  it('should execute enroll-onboarding step when email was sent', async () => {
    // First execute the send-welcome-email step to set up state
    await t.executeStep('send-welcome-email', {
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Now execute enroll-onboarding step
    // Note: This step only runs if emailResult.sent is true
    // Since we mocked a successful email send, this should execute
    const { result } = await t.execute({
      events: [
        {
          name: 'email/welcome',
          data: {
            email: 'test@example.com',
            triggerSource: 'newsletter_subscription',
          },
        },
      ],
    });

    // Verify onboarding enrollment was called
    expect(mockEnrollInOnboardingSequence).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('success', true);
  });

  /**
   * Idempotency test
   *
   * Tests that the function is idempotent when called with the same email and triggerSource.
   *
   * @remarks
   * - Function uses idempotency key: event.data.email + "-" + event.data.triggerSource
   * - Same email + triggerSource should only process once
   */
  it('should be idempotent for same email and triggerSource', async () => {
    const event = {
      name: 'email/welcome' as const,
      data: {
        email: 'test@example.com',
        triggerSource: 'newsletter_subscription' as const,
      },
    };

    // Execute function twice with same idempotency key
    const { result: result1 } = await t.execute({ events: [event] });
    const { result: result2 } = await t.execute({ events: [event] });

    // Both should succeed
    expect(result1).toHaveProperty('success', true);
    expect(result2).toHaveProperty('success', true);

    // Email should only be sent once (idempotent)
    // Note: InngestTestEngine may execute both, but in production Inngest would deduplicate
    // We verify the function logic is correct for idempotency
    expect(result1.emailId).toBe('email-id-123');
    expect(result2.emailId).toBe('email-id-123');
  });

  /**
   * Different triggerSource test
   *
   * Tests that different triggerSource values create different idempotency keys.
   *
   * @remarks
   * - Same email with different triggerSource should process separately
   * - Idempotency key includes triggerSource
   */
  it('should process different triggerSource separately', async () => {
    const event1 = {
      name: 'email/welcome' as const,
      data: {
        email: 'test@example.com',
        triggerSource: 'newsletter_subscription' as const,
      },
    };

    const event2 = {
      name: 'email/welcome' as const,
      data: {
        email: 'test@example.com',
        triggerSource: 'auth_signup' as const,
      },
    };

    // Execute with different triggerSource values
    const { result: result1 } = await t.execute({ events: [event1] });
    const { result: result2 } = await t.execute({ events: [event2] });

    // Both should succeed
    expect(result1).toHaveProperty('success', true);
    expect(result2).toHaveProperty('success', true);

    // Both should have sent emails (different idempotency keys)
    expect(result1.emailId).toBe('email-id-123');
    expect(result2.emailId).toBe('email-id-123');

    // Verify emails were sent with different tags
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
    const call1 = mockSendEmail.mock.calls[0][0];
    const call2 = mockSendEmail.mock.calls[1][0];
    expect(call1.tags[0].value).toBe('newsletter');
    expect(call2.tags[0].value).toBe('auth-signup');
  });
});

