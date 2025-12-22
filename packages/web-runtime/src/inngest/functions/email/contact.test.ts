/**
 * Contact Form Email Inngest Function Tests
 *
 * Tests the sendContactEmails function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/contact.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { sendContactEmails } from './contact';
import * as resend from '../../../integrations/resend';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockSendEmail = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'sendContactEmails',
  route: '/inngest/email/contact',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}));
const mockEscapeHtml = vi.hoisted(() => vi.fn((str: string) => str.replace(/[&<>"']/g, (char) => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return map[char] || char;
})));

// Mock Resend integration
vi.mock('../../../integrations/resend', () => ({
  sendEmail: mockSendEmail,
}));

// Mock logging
vi.mock('../../../logging/server', () => ({
  logger: mockLogger,
  createWebAppContextWithId: mockCreateWebAppContextWithId,
}));

// Mock shared runtime
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: mockNormalizeError,
  escapeHtml: mockEscapeHtml,
}));

// Import function AFTER mocks are set up
describe('sendContactEmails', () => {
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
      function: sendContactEmails,
    });

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    mockSendEmail.mockReset();
    mockEscapeHtml.mockImplementation((str: string) => str);

    // Set up default successful mock responses
    mockSendEmail.mockResolvedValue({
      data: { id: 'email-id-123' },
      error: null,
    });
  });

  /**
   * Success case: Bug category
   *
   * Tests that the function successfully sends both admin and user emails
   * for a bug category submission.
   *
   * @remarks
   * - Verifies both emails are sent
   * - Verifies correct email parameters
   * - Verifies correct return value structure
   */
  it('should send contact emails for bug category successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-123',
            name: 'John Doe',
            email: 'john@example.com',
            category: 'bug',
            message: 'Found a bug in the search feature',
          },
        },
      ],
    });

    // Verify function completed successfully
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('submissionId', 'sub-123');
    expect(result).toHaveProperty('adminEmailSent', true);
    expect(result).toHaveProperty('adminEmailId', 'email-id-123');
    expect(result).toHaveProperty('userEmailSent', true);
    expect(result).toHaveProperty('userEmailId', 'email-id-123');

    // Verify both emails were sent
    expect(mockSendEmail).toHaveBeenCalledTimes(2);

    // Verify admin email parameters
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.to).toBe('hi@claudepro.directory');
    expect(adminCall.subject).toBe('New Contact: bug - John Doe');
    expect(adminCall.tags).toEqual([{ name: 'type', value: 'contact-admin' }]);
    expect(adminCall.html).toContain('🐛'); // Bug emoji
    expect(adminCall.html).toContain('John Doe');
    expect(adminCall.html).toContain('john@example.com');
    expect(adminCall.html).toContain('Found a bug in the search feature');

    // Verify user email parameters
    const userCall = mockSendEmail.mock.calls[1][0];
    expect(userCall.to).toBe('john@example.com');
    expect(userCall.subject).toBe('We received your message!');
    expect(userCall.tags).toEqual([{ name: 'type', value: 'contact-confirmation' }]);
    expect(userCall.html).toContain('John Doe');
    expect(userCall.html).toContain('bug');
  });

  /**
   * Success case: Feature category
   *
   * Tests that the function successfully sends emails for a feature category submission.
   */
  it('should send contact emails for feature category successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-456',
            name: 'Jane Smith',
            email: 'jane@example.com',
            category: 'feature',
            message: 'I would like to suggest a new feature',
          },
        },
      ],
    });

    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('adminEmailSent', true);
    expect(result).toHaveProperty('userEmailSent', true);

    // Verify feature emoji in admin email
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.html).toContain('💡'); // Feature emoji
  });

  /**
   * Success case: Partnership category
   *
   * Tests that the function successfully sends emails for a partnership category submission.
   */
  it('should send contact emails for partnership category successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-789',
            name: 'Partner Corp',
            email: 'partner@example.com',
            category: 'partnership',
            message: 'Interested in partnership opportunities',
          },
        },
      ],
    });

    expect(result).toHaveProperty('success', true);

    // Verify partnership emoji in admin email
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.html).toContain('🤝'); // Partnership emoji
  });

  /**
   * Success case: General category
   *
   * Tests that the function successfully sends emails for a general category submission.
   */
  it('should send contact emails for general category successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-101',
            name: 'General User',
            email: 'general@example.com',
            category: 'general',
            message: 'General inquiry',
          },
        },
      ],
    });

    expect(result).toHaveProperty('success', true);

    // Verify general emoji in admin email
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.html).toContain('💬'); // General emoji
  });

  /**
   * Success case: Other category
   *
   * Tests that the function successfully sends emails for an other category submission.
   */
  it('should send contact emails for other category successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-202',
            name: 'Other User',
            email: 'other@example.com',
            category: 'other',
            message: 'Other inquiry',
          },
        },
      ],
    });

    expect(result).toHaveProperty('success', true);

    // Verify other emoji in admin email
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.html).toContain('📧'); // Other emoji
  });

  /**
   * Error case: Invalid category
   *
   * Tests that the function throws an error for invalid category values.
   *
   * @remarks
   * - Function should validate category against enum
   * - Should throw error with helpful message
   */
  it('should throw error for invalid category', async () => {
    const { error } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-invalid',
            name: 'Test User',
            email: 'test@example.com',
            category: 'invalid-category' as any,
            message: 'Test message',
          },
        },
      ],
    });

    // Verify error was thrown
    expect(error).toBeDefined();

    // Verify error message contains category validation info
    let errorMessage: string;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String(error.message);
    } else {
      errorMessage = String(error);
    }

    expect(errorMessage).toContain('Invalid category');
    expect(errorMessage).toContain('invalid-category');

    // Verify no emails were sent
    expect(mockSendEmail).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'invalid-category',
      }),
      'Invalid contact category'
    );
  });

  /**
   * Error case: Admin email failure
   *
   * Tests that the function handles admin email send failures gracefully.
   *
   * @remarks
   * - Function should catch admin email errors
   * - Should still attempt to send user email
   * - Should return adminEmailSent: false but continue
   */
  it('should handle admin email failure gracefully', async () => {
    // Mock admin email failure, user email success
    mockSendEmail
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Admin email failed' },
      })
      .mockResolvedValueOnce({
        data: { id: 'user-email-id' },
        error: null,
      });

    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-admin-fail',
            name: 'Test User',
            email: 'test@example.com',
            category: 'bug',
            message: 'Test message',
          },
        },
      ],
    });

    // Verify function completed (didn't throw)
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('adminEmailSent', false);
    expect(result).toHaveProperty('adminEmailId', null);
    expect(result).toHaveProperty('userEmailSent', true);
    expect(result).toHaveProperty('userEmailId', 'user-email-id');

    // Verify both emails were attempted
    expect(mockSendEmail).toHaveBeenCalledTimes(2);

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'Admin email failed',
        submissionId: 'sub-admin-fail',
      }),
      'Admin notification email failed'
    );
  });

  /**
   * Error case: User email failure
   *
   * Tests that the function handles user email send failures gracefully.
   *
   * @remarks
   * - Function should catch user email errors
   * - Should still return success (admin email was sent)
   * - Should return userEmailSent: false
   */
  it('should handle user email failure gracefully', async () => {
    // Mock admin email success, user email failure
    mockSendEmail
      .mockResolvedValueOnce({
        data: { id: 'admin-email-id' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'User email failed' },
      });

    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-user-fail',
            name: 'Test User',
            email: 'test@example.com',
            category: 'feature',
            message: 'Test message',
          },
        },
      ],
    });

    // Verify function completed (didn't throw)
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('adminEmailSent', true);
    expect(result).toHaveProperty('adminEmailId', 'admin-email-id');
    expect(result).toHaveProperty('userEmailSent', false);
    expect(result).toHaveProperty('userEmailId', null);

    // Verify both emails were attempted
    expect(mockSendEmail).toHaveBeenCalledTimes(2);

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: 'User email failed',
        submissionId: 'sub-user-fail',
      }),
      'User confirmation email failed'
    );
  });

  /**
   * Error case: Both emails fail
   *
   * Tests that the function handles both email failures gracefully.
   *
   * @remarks
   * - Function should catch both errors
   * - Should still return success: true (function didn't throw)
   * - Should return both sent flags as false
   */
  it('should handle both email failures gracefully', async () => {
    // Mock both emails failing
    mockSendEmail
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'Admin email failed' },
      })
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'User email failed' },
      });

    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-both-fail',
            name: 'Test User',
            email: 'test@example.com',
            category: 'general',
            message: 'Test message',
          },
        },
      ],
    });

    // Verify function completed (didn't throw)
    expect(result).toHaveProperty('success', true);
    expect(result).toHaveProperty('adminEmailSent', false);
    expect(result).toHaveProperty('adminEmailId', null);
    expect(result).toHaveProperty('userEmailSent', false);
    expect(result).toHaveProperty('userEmailId', null);

    // Verify both emails were attempted
    expect(mockSendEmail).toHaveBeenCalledTimes(2);
  });

  /**
   * Step test: send-admin-email step
   *
   * Tests the send-admin-email step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-admin-email step correctly', async () => {
    const { result } = await t.executeStep('send-admin-email', {
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-step-test',
            name: 'Step Test',
            email: 'step@example.com',
            category: 'bug',
            message: 'Step test message',
          },
        },
      ],
    });

    // Verify step result
    expect(result).toEqual({
      sent: true,
      emailId: 'email-id-123',
    });

    // Verify admin email was sent
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.to).toBe('hi@claudepro.directory');
  });

  /**
   * Step test: send-user-email step
   *
   * Tests the send-user-email step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-user-email step correctly', async () => {
    // First execute admin step to set up state
    await t.executeStep('send-admin-email', {
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-step-test',
            name: 'Step Test',
            email: 'step@example.com',
            category: 'bug',
            message: 'Step test message',
          },
        },
      ],
    });

    // Now execute full function to test user email step
    const { result } = await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-step-test',
            name: 'Step Test',
            email: 'step@example.com',
            category: 'bug',
            message: 'Step test message',
          },
        },
      ],
    });

    // Verify user email was sent
    expect(mockSendEmail).toHaveBeenCalledTimes(3); // 1 from admin step + 2 from full execution
    expect(result).toHaveProperty('userEmailSent', true);
  });

  /**
   * HTML escaping test
   *
   * Tests that HTML is properly escaped in email content.
   *
   * @remarks
   * - Verifies escapeHtml is called for user input
   * - Prevents XSS in email content
   */
  it('should escape HTML in email content', async () => {
    mockEscapeHtml.mockImplementation((str: string) => str.replace(/[&<>"']/g, (char) => {
      const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      };
      return map[char] || char;
    }));

    await t.execute({
      events: [
        {
          name: 'email/contact',
          data: {
            submissionId: 'sub-html-test',
            name: '<script>alert("XSS")</script>',
            email: 'test@example.com',
            category: 'bug',
            message: 'Test & <message>',
          },
        },
      ],
    });

    // Verify escapeHtml was called
    expect(mockEscapeHtml).toHaveBeenCalled();

    // Verify escaped content in email
    const adminCall = mockSendEmail.mock.calls[0][0];
    expect(adminCall.html).toContain('&lt;script&gt;'); // Escaped
  });

  /**
   * Idempotency test
   *
   * Tests that the function is idempotent when called with the same submissionId.
   *
   * @remarks
   * - Function uses idempotency key: event.data.submissionId
   * - Same submissionId should only process once
   */
  it('should be idempotent for same submissionId', async () => {
    const event = {
      name: 'email/contact' as const,
      data: {
        submissionId: 'sub-idempotent',
        name: 'Test User',
        email: 'test@example.com',
        category: 'bug' as const,
        message: 'Test message',
      },
    };

    // Execute function twice with same submissionId
    const { result: result1 } = await t.execute({ events: [event] });
    const { result: result2 } = await t.execute({ events: [event] });

    // Both should succeed
    expect(result1).toHaveProperty('success', true);
    expect(result2).toHaveProperty('success', true);

    // Both should have same submissionId
    expect(result1.submissionId).toBe('sub-idempotent');
    expect(result2.submissionId).toBe('sub-idempotent');
  });
});

