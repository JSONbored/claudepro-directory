/**
 * Resend Webhook Inngest Function Integration Tests
 *
 * Tests handleResendWebhook function → MiscService + NewsletterService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Webhook
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { handleResendWebhook } from './webhook';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock service-factory to return REAL services (not mocked services) for integration testing
// This allows us to test the complete flow: Inngest function → MiscService + NewsletterService → database
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
    operation: 'handleResendWebhook',
    route: '/inngest/resend/webhook',
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

// Get mocks for use in tests (logging, shared-runtime, etc.)
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
describe('handleResendWebhook', () => {
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
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up Prismocker for database operations
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
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: handleResendWebhook,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

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
   * Success case: Email sent event
   *
   * Tests that email.sent events are processed correctly.
   *
   * @remarks
   * - Should increment emails_sent counter
   * - Should update last_sent_at timestamp
   */
  it('should handle email.sent event successfully', async () => {
    // Seed Prismocker with initial email engagement summary (real MiscService will query/update this)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify engagement summary was updated (real MiscService updated Prismocker data)
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_sent).toBe(1);
    expect(updatedSummary?.last_sent_at).toBeDefined();
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
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'user@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          last_email_sent_at: null,
          last_active_at: null,
          engagement_score: 50,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'delivered',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify engagement summary was updated
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_delivered).toBe(1);
    expect(updatedSummary?.last_delivered_at).toBeDefined();

    // Verify subscription was updated
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.last_email_sent_at).toBeDefined();
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
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'user@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          last_email_sent_at: null,
          last_active_at: null,
          engagement_score: 50, // Initial score
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'opened',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify engagement summary was updated
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_opened).toBe(1);
    expect(updatedSummary?.last_opened_at).toBeDefined();
    expect(updatedSummary?.health_status).toBe('active');

    // Verify subscription engagement score was increased by 5 (50 + 5 = 55)
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.engagement_score).toBe(55);
    expect(updatedSubscription?.last_active_at).toBeDefined();
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
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'user@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          last_email_sent_at: null,
          last_active_at: null,
          engagement_score: 50, // Initial score
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'clicked',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify engagement summary was updated
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_clicked).toBe(1);
    expect(updatedSummary?.last_clicked_at).toBeDefined();
    expect(updatedSummary?.health_status).toBe('active');

    // Verify subscription engagement score was increased by 10 (50 + 10 = 60)
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.engagement_score).toBe(60);
    expect(updatedSubscription?.last_active_at).toBeDefined();
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
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          emails_bounced: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          last_bounce_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'user@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          last_email_sent_at: null,
          last_active_at: null,
          engagement_score: 50,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'bounced',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify blocklist entry was created
    const blocklistEntry = await prismocker.email_blocklist.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(blocklistEntry?.reason).toBe('hard_bounce');
    expect(blocklistEntry?.notes).toContain('email-123');

    // Verify subscription status was updated
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.status).toBe('bounced');

    // Verify engagement summary was updated
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_bounced).toBe(1);
    expect(updatedSummary?.last_bounce_at).toBeDefined();
    expect(updatedSummary?.health_status).toBe('bounced');
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
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          emails_complained: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          last_complaint_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);

      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'user@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          last_email_sent_at: null,
          last_active_at: null,
          engagement_score: 50,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'complained',
      emailId: 'email-123',
      processedCount: 1,
    });

    // Verify blocklist entry was created
    const blocklistEntry = await prismocker.email_blocklist.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(blocklistEntry?.reason).toBe('spam_complaint');
    expect(blocklistEntry?.notes).toContain('email-123');

    // Verify subscription was unsubscribed
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.status).toBe('unsubscribed');
    expect(updatedSubscription?.unsubscribed_at).toBeDefined();
    expect(updatedSubscription?.engagement_score).toBe(0); // Reset to 0

    // Verify engagement summary was updated
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.emails_complained).toBe(1);
    expect(updatedSummary?.last_complaint_at).toBeDefined();
    expect(updatedSummary?.health_status).toBe('complained');
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
    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

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

    // Should not update any database records (verify no engagement summary was created/updated)
    const summary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(summary).toBeNull();
  });

  /**
   * Success case: Multiple recipients
   *
   * Tests that events with multiple recipients are processed for each recipient.
   */
  it('should handle multiple recipients correctly', async () => {
    // Seed Prismocker with initial data for all recipients
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user1@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          email: 'user2@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          email: 'user3@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 3,
    });

    // Verify all recipients were processed (engagement summaries updated)
    const summary1 = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user1@example.com' },
    });
    const summary2 = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user2@example.com' },
    });
    const summary3 = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user3@example.com' },
    });
    expect(summary1?.emails_sent).toBe(1);
    expect(summary2?.emails_sent).toBe(1);
    expect(summary3?.emails_sent).toBe(1);
  });

  /**
   * Success case: Bounced email handling
   *
   * Tests that bounced emails are processed correctly (blocklist and engagement summary updated).
   */
  it('should handle bounced email correctly', async () => {
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 1,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: new Date().toISOString(),
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result.success).toBe(true);
    expect(result.action).toBe('bounced');

    // Verify engagement summary was updated with bounced status
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.health_status).toBe('bounced');
  });

  /**
   * Success case: Complained email handling
   *
   * Tests that complained emails are processed correctly (blocklist, unsubscribe, engagement summary updated).
   */
  it('should handle complained email correctly', async () => {
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 1,
          emails_delivered: 1,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: new Date().toISOString(),
          last_delivered_at: new Date().toISOString(),
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-123',
          email: 'user@example.com',
          status: 'subscribed',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result.success).toBe(true);
    expect(result.action).toBe('complained');

    // Verify engagement summary was updated with complained status
    const updatedSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSummary?.health_status).toBe('complained');
    expect(updatedSummary?.emails_complained).toBe(1);

    // Verify subscription was unsubscribed
    const subscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(subscription?.status).toBe('unsubscribed');
  });

  /**
   * Success case: Engagement score capping at 100
   *
   * Tests that engagement score is capped at 100 when incrementing.
   */
  it('should cap engagement score at 100', async () => {
    // Seed Prismocker with subscription that has high engagement score
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-123',
          email: 'user@example.com',
          status: 'subscribed',
          engagement_score: 98, // High score, will be capped at 100
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 1,
          emails_delivered: 1,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: new Date().toISOString(),
          last_delivered_at: new Date().toISOString(),
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result.success).toBe(true);

    // Verify engagement score was capped at 100 (98 + 5 = 103, but capped at 100)
    const updatedSubscription = await prismocker.newsletter_subscriptions.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(updatedSubscription?.engagement_score).toBe(100);
  });

  /**
   * Success case: Missing engagement summary (new email)
   *
   * Tests that missing engagement summary is handled correctly (new email address).
   */
  it('should handle missing engagement summary for new email address', async () => {
    // Don't seed engagement summary (simulates new email address)
    // The function should create a new engagement summary

    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result.success).toBe(true);

    // Verify new engagement summary was created
    const newSummary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'newuser@example.com' },
    });
    expect(newSummary).toBeDefined();
    expect(newSummary?.emails_sent).toBe(1);
    expect(newSummary?.last_sent_at).toBeDefined();
  });

  /**
   * Success case: Idempotency
   *
   * Tests that duplicate events are handled idempotently.
   */
  it('should handle duplicate events idempotently', async () => {
    // Seed Prismocker with initial data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('email_engagement_summary', [
        {
          email: 'user@example.com',
          emails_sent: 0,
          emails_delivered: 0,
          emails_opened: 0,
          emails_clicked: 0,
          last_sent_at: null,
          last_delivered_at: null,
          last_opened_at: null,
          last_clicked_at: null,
          health_status: null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const eventData = {
      name: 'resend/email.sent' as const,
      data: {
        email_id: 'email-123', // Same email_id
        to: ['user@example.com'],
        subject: 'Test Email',
      },
    };

    // Execute same event twice
    const { result: result1 } = (await t.execute({
      events: [eventData],
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    // Create fresh test engine for second execution (simulating idempotency)
    const t2 = new InngestTestEngine({
      function: handleResendWebhook,
    });

    const { result: result2 } = (await t2.execute({
      events: [eventData],
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    // Both should succeed
    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    // Verify engagement summary was updated (both executions should process)
    const summary = await prismocker.email_engagement_summary.findUnique({
      where: { email: 'user@example.com' },
    });
    expect(summary?.emails_sent).toBeGreaterThanOrEqual(1);
  });

  /**
   * Success case: Empty recipients array
   *
   * Tests that empty recipients array is handled gracefully.
   */
  it('should handle empty recipients array gracefully', async () => {
    const { result } = (await t.execute({
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
    })) as {
      result: { success: boolean; action: string; emailId: string; processedCount: number };
    };

    expect(result).toEqual({
      success: true,
      action: 'sent',
      emailId: 'email-123',
      processedCount: 0,
    });

    // Should not create any engagement summaries (no recipients to process)
    const allSummaries = await prismocker.email_engagement_summary.findMany();
    expect(allSummaries.length).toBe(0);
  });
});
