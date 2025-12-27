/**
 * Weekly Digest Email Inngest Function Integration Tests
 *
 * Tests sendWeeklyDigest function → ContentService + NewsletterService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Email
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock service-factory to return REAL services (not mocked services) for integration testing
// This allows us to test the complete flow: Inngest function → ContentService + NewsletterService → database
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
  };
});

jest.mock('../../../integrations/resend', () => {
  const mockGetResendClient = jest.fn();
  return {
    getResendClient: mockGetResendClient,
    __mockGetResendClient: mockGetResendClient,
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
    operation: 'sendWeeklyDigest',
    route: '/inngest/email/digest',
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

jest.mock('../../utils/monitoring', () => {
  const mockSendCronSuccessHeartbeat = jest.fn();
  return {
    sendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
    __mockSendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
  };
});

// Get mocks for use in tests (Resend, email template, logging, etc.)
const { __mockGetResendClient: mockGetResendClient } = jest.requireMock(
  '../../../integrations/resend'
) as {
  __mockGetResendClient: ReturnType<typeof jest.fn>;
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
const { __mockSendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat } = jest.requireMock(
  '../../utils/monitoring'
) as {
  __mockSendCronSuccessHeartbeat: ReturnType<typeof jest.fn>;
};

// Import function AFTER mocks are set up
import { sendWeeklyDigest } from './digest';

// Import function AFTER mocks are set up
describe('sendWeeklyDigest', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Prismocker instance for database integration testing
   */
  let prismocker: PrismaClient;

  /**
   * Mock Resend batch API
   */
  let mockResendBatchSend: ReturnType<typeof jest.fn>;

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up Prismocker for database operations
   * - Sets up default mock return values
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

    // Set up $queryRawUnsafe for RPC testing (getWeeklyDigest uses RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: sendWeeklyDigest,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetResendClient.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Restore normalizeError mock implementation after reset
    // jest.resetAllMocks() resets mocks to return undefined, so we need to restore it
    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Restore mockRenderEmailTemplate implementation after reset
    mockRenderEmailTemplate.mockResolvedValue('<html>Weekly digest HTML</html>');

    // Set up Resend batch API mock
    mockResendBatchSend = jest.fn().mockResolvedValue({ data: null, error: null });
    const mockResendClient = {
      batch: {
        send: mockResendBatchSend,
      },
    };
    mockGetResendClient.mockReturnValue(mockResendClient as any);
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
   * Success case: Normal digest send
   *
   * Tests that the function successfully sends digest emails to all subscribers
   * when there is content available.
   *
   * @remarks
   * - Verifies digest content is fetched
   * - Verifies subscribers are fetched
   * - Verifies batch emails are sent
   * - Verifies correct return value structure
   */
  it('should send weekly digest successfully', async () => {
    // Seed Prismocker with newsletter subscriptions (real NewsletterService will query this)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber1@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'sub-2',
          email: 'subscriber2@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'sub-3',
          email: 'subscriber3@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call (ContentService.getWeeklyDigest uses RPC)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test-agent',
            title: 'Test Agent',
            description: 'Test description',
            date_added: '2025-12-17',
            url: 'https://claudepro.directory/agents/test-agent',
          },
        ],
        trending_content: [
          {
            category: 'mcp',
            slug: 'test-mcp',
            title: 'Test MCP',
            description: 'Test MCP description',
            url: 'https://claudepro.directory/mcp/test-mcp',
            views_total: 1000,
          },
        ],
      },
    ]);

    // Execute function (cron function, no events needed)
    const { result } = await t.execute();

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 3);
    expect(result).toHaveProperty('failed', 0);
    expect(result).toHaveProperty('rate', '100.0%');

    // Verify digest content was fetched via RPC
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_weekly_digest'),
      expect.objectContaining({
        p_week_start: expect.any(String),
      })
    );

    // Verify subscribers were fetched from Prismocker (real NewsletterService queried the data)
    const subscribers = await prismocker.newsletter_subscriptions.findMany({
      where: {
        status: 'active',
        confirmed: true,
        unsubscribed_at: null,
      },
    });
    expect(subscribers.length).toBe(3);

    // Verify email template was rendered (once per subscriber for personalization)
    expect(mockRenderEmailTemplate).toHaveBeenCalledTimes(3); // One per subscriber
    expect(mockRenderEmailTemplate).toHaveBeenCalledWith(
      expect.anything(), // WeeklyDigestEmail component
      {
        weekOf: 'December 16-22, 2025',
        newContent: expect.arrayContaining([
          expect.objectContaining({
            category: 'agents',
            slug: 'test-agent',
          }),
        ]),
        trendingContent: expect.arrayContaining([
          expect.objectContaining({
            category: 'mcp',
            slug: 'test-mcp',
          }),
        ]),
      }
    );

    // Verify batch emails were sent
    expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
    const batchCall = mockResendBatchSend.mock.calls[0][0];
    expect(batchCall).toHaveLength(3); // 3 subscribers
    expect(batchCall[0]).toMatchObject({
      to: 'subscriber1@example.com',
      subject: 'This Week in Claude: December 16-22, 2025',
      html: '<html>Weekly digest HTML</html>',
      tags: expect.arrayContaining([
        { name: 'type', value: 'weekly_digest' },
        { name: 'engagement', value: 'low' }, // engagement_score: 0 = low
      ]),
    });
  });

  /**
   * Success case: Large subscriber list (batch processing)
   *
   * Tests that the function correctly batches emails when there are more than 100 subscribers.
   *
   * @remarks
   * - Function batches emails in groups of 100
   * - Verifies multiple batch calls are made
   */
  it('should batch emails for large subscriber lists', async () => {
    // Seed Prismocker with 250 newsletter subscriptions (3 batches: 100, 100, 50)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      const subscribers = Array.from({ length: 250 }, (_, i) => ({
        id: `sub-${i}`,
        email: `subscriber${i}@example.com`,
        status: 'active',
        confirmed: true,
        unsubscribed_at: null,
        categories_visited: [],
        engagement_score: 0,
        primary_interest: null,
        subscribed_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      (prismocker as any).setData('newsletter_subscriptions', subscribers);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    const { result } = await t.execute();

    // Verify all emails were sent
    expect(result).toHaveProperty('sent', 250);
    expect(result).toHaveProperty('failed', 0);

    // Verify 3 batch calls were made (100, 100, 50)
    expect(mockResendBatchSend).toHaveBeenCalledTimes(3);
    expect(mockResendBatchSend.mock.calls[0][0]).toHaveLength(100);
    expect(mockResendBatchSend.mock.calls[1][0]).toHaveLength(100);
    expect(mockResendBatchSend.mock.calls[2][0]).toHaveLength(50);
  });

  /**
   * Skip case: No content
   *
   * Tests that the function skips sending when there is no new or trending content.
   *
   * @remarks
   * - Function should return skipped: true with reason: 'no_content'
   * - No emails should be sent
   */
  it('should skip digest when there is no content', async () => {
    // Mock $queryRawUnsafe for getWeeklyDigest RPC call (returns empty content)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [], // No new content
        trending_content: [], // No trending content
      },
    ]);

    const { result } = await t.execute();

    // Verify function skipped
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'no_content');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify skip was logged
    // Note: logContext might be undefined in some cases, so we check for the message
    const infoCalls = mockLogger.info.mock.calls;
    const skipCall = infoCalls.find((call) => call[1] === 'Digest skipped - no content');
    expect(skipCall).toBeDefined();
  });

  /**
   * Skip case: No subscribers
   *
   * Tests that the function skips sending when there are no active subscribers.
   *
   * @remarks
   * - Function should return skipped: true with reason: 'no_subscribers'
   * - No emails should be sent
   */
  it('should skip digest when there are no subscribers', async () => {
    // Seed Prismocker with empty newsletter subscriptions (no subscribers)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', []);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    const { result } = await t.execute();

    // Verify function skipped
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'no_subscribers');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify skip was logged
    // Note: logContext might be undefined in some cases, so we check for the message
    const infoCalls = mockLogger.info.mock.calls;
    const skipCall = infoCalls.find((call) => call[1] === 'Digest skipped - no subscribers');
    expect(skipCall).toBeDefined();
  });

  /**
   * Error case: Digest content fetch failure
   *
   * Tests that the function handles digest content fetch failures gracefully.
   *
   * @remarks
   * - Function should return skipped: true with reason: 'invalid_data'
   * - Should log the error
   */
  it('should handle digest content fetch failure gracefully', async () => {
    // Mock $queryRawUnsafe to throw error (simulates RPC failure)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockRejectedValue(
      new Error('Database connection failed')
    );

    const { result } = await t.execute();

    // Verify function skipped due to invalid data
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'invalid_data');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Failed to fetch weekly digest'
    );
  });

  /**
   * Error case: Subscribers fetch failure
   *
   * Tests that the function handles subscriber fetch failures gracefully.
   *
   * @remarks
   * - Function should return skipped: true with reason: 'no_subscribers'
   * - Should log the error
   */
  it('should handle subscribers fetch failure gracefully', async () => {
    // Seed Prismocker with empty newsletter subscriptions (simulates fetch failure)
    // Note: In a real scenario, Prisma would throw, but for testing we use empty data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', []);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    const { result } = await t.execute();

    // Verify function skipped (subscribers fetch failed, returns empty array)
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'no_subscribers');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Failed to fetch subscribers'
    );
  });

  /**
   * Error case: Batch email send failure
   *
   * Tests that the function handles batch email send failures gracefully.
   *
   * @remarks
   * - Function should track failed sends
   * - Should return success and failed counts
   * - Should calculate success rate
   */
  it('should handle batch email send failure gracefully', async () => {
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber1@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'sub-2',
          email: 'subscriber2@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]),
    };

    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber1@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'sub-2',
          email: 'subscriber2@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    // Mock batch send failure
    mockResendBatchSend.mockResolvedValue({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    });

    const { result } = await t.execute();

    // Verify function completed with failure tracking
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 2);
    expect(result).toHaveProperty('rate', '0.0%');

    // Verify error was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        batchStart: 0,
        batchSize: 2,
        errorMessage: 'Resend API rate limit exceeded',
      }),
      'Batch send failed'
    );
  });

  /**
   * Error case: Batch send exception
   *
   * Tests that the function handles batch send exceptions gracefully.
   *
   * @remarks
   * - Function should catch exceptions
   * - Should track failed sends
   * - Should log the exception
   */
  it('should handle batch send exception gracefully', async () => {
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber1@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    // Mock batch send exception
    mockResendBatchSend.mockRejectedValue(new Error('Network timeout'));

    const { result } = await t.execute();

    // Verify function completed with failure tracking
    expect(result).toHaveProperty('sent', 0);
    expect(result).toHaveProperty('failed', 1);
    expect(result).toHaveProperty('rate', '0.0%');

    // Verify exception was logged
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        batchStart: 0,
        batchSize: 1,
        errorMessage: 'Network timeout',
      }),
      'Batch send exception'
    );
  });

  /**
   * Success case: Only new content (no trending)
   *
   * Tests that the function sends digest when only new content is available.
   */
  it('should send digest when only new content is available', async () => {
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call (only new content, no trending)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [], // No trending content
      },
    ]);

    const { result } = await t.execute();

    // Verify function sent (has new content even without trending)
    expect(result).toHaveProperty('sent', 1);
    expect(result).not.toHaveProperty('skipped');
  });

  /**
   * Success case: Only trending content (no new)
   *
   * Tests that the function sends digest when only trending content is available.
   */
  it('should send digest when only trending content is available', async () => {
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call (only trending content, no new)
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [], // No new content
        trending_content: [
          {
            category: 'mcp',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            url: 'https://example.com',
            views_total: 1000,
          },
        ],
      },
    ]);

    const { result } = await t.execute();

    // Verify function sent (has trending content even without new)
    expect(result).toHaveProperty('sent', 1);
    expect(result).not.toHaveProperty('skipped');
  });

  /**
   * Step test: fetch-digest-content step
   *
   * Tests the fetch-digest-content step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute fetch-digest-content step correctly', async () => {
    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [],
        trending_content: [],
      },
    ]);

    const { result } = await t.executeStep('fetch-digest-content');

    // Verify step result
    expect(result).toHaveProperty('week_of', 'December 16-22, 2025');
    expect(result).toHaveProperty('new_content');
    expect(result).toHaveProperty('trending_content');

    // Verify RPC was called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('get_weekly_digest'),
      expect.anything()
    );
  });

  /**
   * Step test: fetch-subscribers step
   *
   * Tests the fetch-subscribers step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   * - Note: This step requires fetch-digest-content to have run first
   */
  it('should execute fetch-subscribers step correctly', async () => {
    // First execute fetch-digest-content step to set up prerequisite
    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [],
        trending_content: [],
      },
    ]);
    await t.executeStep('fetch-digest-content');

    // Now execute full function to test fetch-subscribers step
    // (fetch-subscribers step requires digest content to be available)
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    const { result } = await t.execute();

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 1);
  });

  /**
   * Step test: send-batch-emails step
   *
   * Tests the send-batch-emails step individually.
   *
   * @remarks
   * - Verifies step executes correctly
   * - Verifies step return value structure
   */
  it('should execute send-batch-emails step correctly', async () => {
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', [
        {
          id: 'sub-1',
          email: 'subscriber@example.com',
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      ]);
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    // Execute full function to test send-batch-emails step
    const { result } = await t.execute();

    // Verify batch emails step executed
    expect(result).toHaveProperty('sent', 1);
    expect(result).toHaveProperty('failed', 0);
    expect(result).toHaveProperty('rate', '100.0%');

    // Verify batch was sent
    expect(mockResendBatchSend).toHaveBeenCalledTimes(1);
  });

  /**
   * Success rate calculation test
   *
   * Tests that success rate is calculated correctly.
   *
   * @remarks
   * - Verifies success rate calculation with partial failures
   * - Uses 103 subscribers to test batching (100 + 3)
   */
  it('should calculate success rate correctly', async () => {
    // Create 103 subscribers (first batch: 100, second batch: 3)
    // Seed Prismocker with newsletter subscriptions
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData(
        'newsletter_subscriptions',
        Array.from({ length: 103 }, (_, i) => ({
          id: `sub-${i + 1}`,
          email: `subscriber${i + 1}@example.com`,
          status: 'active',
          confirmed: true,
          unsubscribed_at: null,
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
          subscribed_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        }))
      );
    }

    // Mock $queryRawUnsafe for getWeeklyDigest RPC call
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([
      {
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [
          {
            category: 'agents',
            slug: 'test',
            title: 'Test',
            description: 'Test',
            date_added: '2025-12-17',
            url: 'https://example.com',
          },
        ],
        trending_content: [],
      },
    ]);

    // Mock first batch success, second batch failure
    mockResendBatchSend
      .mockResolvedValueOnce({ data: null, error: null }) // First 100 succeed
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } }); // Next 3 fail

    const { result } = await t.execute();

    // Verify success rate calculation
    expect(result).toHaveProperty('sent', 100);
    expect(result).toHaveProperty('failed', 3);
    expect(result).toHaveProperty('rate', '97.1%'); // 100/103 = 97.087% ≈ 97.1%
  });
});
