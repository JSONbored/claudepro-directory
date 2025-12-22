/**
 * Resend Webhook Inngest Function Tests
 *
 * Tests the handleResendWebhook function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/resend/webhook.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { handleResendWebhook } from './webhook';
import * as serviceFactory from '../../../data/service-factory';
import { logger } from '../../../logging/server';
import { normalizeError } from '@heyclaude/shared-runtime';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockGetService = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'handleResendWebhook',
  route: '/inngest/resend/webhook',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}));

// Mock service factory
vi.mock('../../../data/service-factory', () => ({
  getService: mockGetService,
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
describe('handleResendWebhook', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock services
   */
  let mockMiscService: {
    getEmailEngagementSummary: ReturnType<typeof vi.fn>;
    upsertEmailEngagementSummary: ReturnType<typeof vi.fn>;
    upsertEmailBlocklist: ReturnType<typeof vi.fn>;
  };
  let mockNewsletterService: {
    updateLastEmailSentAt: ReturnType<typeof vi.fn>;
    getSubscriptionEngagementScore: ReturnType<typeof vi.fn>;
    updateLastActiveAt: ReturnType<typeof vi.fn>;
    updateEngagementScore: ReturnType<typeof vi.fn>;
    updateSubscriptionStatus: ReturnType<typeof vi.fn>;
    unsubscribeWithTimestamp: ReturnType<typeof vi.fn>;
  };

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
      function: handleResendWebhook,
    });

    // Reset all mocks to ensure clean state
    vi.clearAllMocks();
    mockGetService.mockReset();

    // Set up mock services
    mockMiscService = {
      getEmailEngagementSummary: vi.fn().mockResolvedValue({
        email: 'test@example.com',
        emails_sent: 0,
        emails_delivered: 0,
        emails_opened: 0,
        emails_clicked: 0,
      }),
      upsertEmailEngagementSummary: vi.fn().mockResolvedValue(undefined),
      upsertEmailBlocklist: vi.fn().mockResolvedValue(undefined),
    };

    mockNewsletterService = {
      updateLastEmailSentAt: vi.fn().mockResolvedValue(undefined),
      getSubscriptionEngagementScore: vi.fn().mockResolvedValue({
        engagement_score: 50,
      }),
      updateLastActiveAt: vi.fn().mockResolvedValue(undefined),
      updateEngagementScore: vi.fn().mockResolvedValue(undefined),
      updateSubscriptionStatus: vi.fn().mockResolvedValue(undefined),
      unsubscribeWithTimestamp: vi.fn().mockResolvedValue(undefined),
    };

    // Mock getService to return appropriate service based on name
    mockGetService.mockImplementation(async (serviceName: string) => {
      if (serviceName === 'misc') {
        return mockMiscService;
      }
      if (serviceName === 'newsletter') {
        return mockNewsletterService;
      }
      return {};
    });

    mockNormalizeError.mockImplementation((error) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(String(error));
    });
  });

  /**
   * Success case: Email sent event
   *
   * Tests that email.sent events are processed correctly.
   *
   * @remarks
   * - Should increment emails_sent counter
   * - Should update last_sent_at timestamp
   */
  it('should handle email.sent event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.sent',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.getEmailEngagementSummary).toHaveBeenCalledWith('user@example.com');
    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_sent: 1,
        last_sent_at: expect.any(String),
      })
    );
  });

  /**
   * Success case: Email delivered event
   *
   * Tests that email.delivered events are processed correctly.
   *
   * @remarks
   * - Should increment emails_delivered counter
   * - Should update last_delivered_at timestamp
   * - Should update subscription last_email_sent_at
   */
  it('should handle email.delivered event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.delivered',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'delivered',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_delivered: 1,
        last_delivered_at: expect.any(String),
      })
    );
    expect(mockNewsletterService.updateLastEmailSentAt).toHaveBeenCalledWith('user@example.com');
  });

  /**
   * Success case: Email opened event
   *
   * Tests that email.opened events are processed correctly.
   *
   * @remarks
   * - Should increment emails_opened counter
   * - Should update last_opened_at timestamp
   * - Should increase engagement score by 5 (capped at 100)
   * - Should set health_status to 'active'
   */
  it('should handle email.opened event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.opened',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'opened',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_opened: 1,
        last_opened_at: expect.any(String),
        health_status: 'active',
      })
    );
    expect(mockNewsletterService.getSubscriptionEngagementScore).toHaveBeenCalledWith('user@example.com');
    expect(mockNewsletterService.updateEngagementScore).toHaveBeenCalledWith('user@example.com', 55); // 50 + 5
    expect(mockNewsletterService.updateLastActiveAt).toHaveBeenCalledWith('user@example.com');
  });

  /**
   * Success case: Email clicked event
   *
   * Tests that email.clicked events are processed correctly.
   *
   * @remarks
   * - Should increment emails_clicked counter
   * - Should update last_clicked_at timestamp
   * - Should increase engagement score by 10 (capped at 100)
   * - Should set health_status to 'active'
   */
  it('should handle email.clicked event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.clicked',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'clicked',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_clicked: 1,
        last_clicked_at: expect.any(String),
        health_status: 'active',
      })
    );
    expect(mockNewsletterService.updateEngagementScore).toHaveBeenCalledWith('user@example.com', 60); // 50 + 10
  });

  /**
   * Success case: Email bounced event
   *
   * Tests that email.bounced events are processed correctly.
   *
   * @remarks
   * - Should add email to blocklist with reason 'hard_bounce'
   * - Should update subscription status to 'bounced'
   * - Should update engagement summary with bounce info
   */
  it('should handle email.bounced event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.bounced',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'bounced',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.upsertEmailBlocklist).toHaveBeenCalledWith({
      email: 'user@example.com',
      reason: 'hard_bounce',
      notes: 'Bounced email_id: email-123',
      updated_at: expect.any(String),
    });
    expect(mockNewsletterService.updateSubscriptionStatus).toHaveBeenCalledWith('user@example.com', 'bounced');
    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_bounced: 1,
        last_bounce_at: expect.any(String),
        health_status: 'bounced',
      })
    );
  });

  /**
   * Success case: Email complained event
   *
   * Tests that email.complained events are processed correctly.
   *
   * @remarks
   * - Should add email to blocklist with reason 'spam_complaint'
   * - Should unsubscribe immediately
   * - Should update engagement summary with complaint info
   * - Should reset engagement score to 0
   */
  it('should handle email.complained event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.complained',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'complained',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockMiscService.upsertEmailBlocklist).toHaveBeenCalledWith({
      email: 'user@example.com',
      reason: 'spam_complaint',
      notes: 'Spam complaint for email_id: email-123',
      updated_at: expect.any(String),
    });
    expect(mockNewsletterService.unsubscribeWithTimestamp).toHaveBeenCalledWith('user@example.com');
    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        emails_complained: 1,
        last_complaint_at: expect.any(String),
        health_status: 'complained',
        engagement_score: 0,
      })
    );
  });

  /**
   * Success case: Email delivery_delayed event
   *
   * Tests that email.delivery_delayed events are logged but no action taken.
   *
   * @remarks
   * - Should only log warning
   * - Should not update any database records
   */
  it('should handle email.delivery_delayed event successfully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.delivery_delayed',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'delivery_delayed',
      emailId: 'email-123',
      processedCount: 1,
    });

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        emailId: 'email-123',
      }),
      'Email delivery delayed'
    );

    // Should not update any database records
    expect(mockMiscService.upsertEmailEngagementSummary).not.toHaveBeenCalled();
    expect(mockNewsletterService.updateLastEmailSentAt).not.toHaveBeenCalled();
  });

  /**
   * Success case: Multiple recipients
   *
   * Tests that events with multiple recipients are processed for each recipient.
   */
  it('should handle multiple recipients correctly', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.sent',
          data: {
            email_id: 'email-123',
            to: ['user1@example.com', 'user2@example.com', 'user3@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 3,
    });

    // Should process each recipient
    expect(mockMiscService.getEmailEngagementSummary).toHaveBeenCalledTimes(3);
    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledTimes(3);
  });

  /**
   * Error case: Blocklist update failure (bounced)
   *
   * Tests that blocklist update failures are handled gracefully for bounced emails.
   */
  it('should handle blocklist update failure gracefully for bounced email', async () => {
    mockMiscService.upsertEmailBlocklist.mockRejectedValue(new Error('Database error'));

    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.bounced',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    // Should still succeed (error is logged but doesn't stop processing)
    expect(result.success).toBe(true);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
      }),
      'Failed to add to blocklist'
    );
  });

  /**
   * Error case: Blocklist update failure (complained)
   *
   * Tests that blocklist update failures are handled gracefully for complained emails.
   */
  it('should handle blocklist update failure gracefully for complained email', async () => {
    mockMiscService.upsertEmailBlocklist.mockRejectedValue(new Error('Database error'));

    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.complained',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    // Should still succeed (error is logged but doesn't stop processing)
    expect(result.success).toBe(true);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Blocklist update failed for complaint'
    );
  });

  /**
   * Success case: Engagement score capping at 100
   *
   * Tests that engagement score is capped at 100 when incrementing.
   */
  it('should cap engagement score at 100', async () => {
    // Set initial engagement score to 98
    mockNewsletterService.getSubscriptionEngagementScore.mockResolvedValue({
      engagement_score: 98,
    });

    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.opened',
          data: {
            email_id: 'email-123',
            to: ['user@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    // Should cap at 100 (98 + 5 = 103, but capped at 100)
    expect(mockNewsletterService.updateEngagementScore).toHaveBeenCalledWith('user@example.com', 100);
  });

  /**
   * Success case: Missing engagement summary (new email)
   *
   * Tests that missing engagement summary is handled correctly (new email address).
   */
  it('should handle missing engagement summary for new email address', async () => {
    // Return null for new email address
    mockMiscService.getEmailEngagementSummary.mockResolvedValue(null);

    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.sent',
          data: {
            email_id: 'email-123',
            to: ['newuser@example.com'],
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result.success).toBe(true);
    // Should use 0 as default count
    expect(mockMiscService.upsertEmailEngagementSummary).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newuser@example.com',
        emails_sent: 1, // 0 + 1
      })
    );
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate events are handled idempotently.
   */
  it('should handle duplicate events idempotently', async () => {
    const eventData = {
      name: 'resend/email.sent' as const,
      data: {
        email_id: 'email-123', // Same email_id
        to: ['user@example.com'],
        subject: 'Test Email',
      },
    };

    // Execute same event twice
    const { result: result1 } = await t.execute({
      events: [eventData],
    });

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: handleResendWebhook,
    });
    mockMiscService.getEmailEngagementSummary.mockClear();
    mockMiscService.upsertEmailEngagementSummary.mockClear();

    const { result: result2 } = await t2.execute({
      events: [eventData],
    });

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  /**
   * Success case: Empty recipients array
   *
   * Tests that empty recipients array is handled gracefully.
   */
  it('should handle empty recipients array gracefully', async () => {
    const { result } = await t.execute({
      events: [
        {
          name: 'resend/email.sent',
          data: {
            email_id: 'email-123',
            to: [], // Empty array
            subject: 'Test Email',
          },
        },
      ],
    });

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 0,
    });

    // Should not process any emails
    expect(mockMiscService.getEmailEngagementSummary).not.toHaveBeenCalled();
  });
});

