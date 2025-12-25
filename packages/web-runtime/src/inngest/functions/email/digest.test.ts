/**
 * Weekly Digest Email Inngest Function Tests
 *
 * Tests the sendWeeklyDigest function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/digest.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';

// Mock service factory, Resend client, email template rendering, logging, shared-runtime, and monitoring
// Define mocks directly in jest.mock() factory functions to avoid hoisting issues
jest.mock('../../../data/service-factory', () => {
  const mockGetService = jest.fn();
  return {
    getService: mockGetService,
    __mockGetService: mockGetService,
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

// Get mocks for use in tests
const { __mockGetService: mockGetService } = jest.requireMock('../../../data/service-factory') as {
  __mockGetService: ReturnType<typeof jest.fn>;
};
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
   * Mock Resend batch API
   */
  let mockResendBatchSend: ReturnType<typeof jest.fn>;

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
      function: sendWeeklyDigest,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockGetService.mockReset();
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
    // Mock content service
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    // Mock newsletter service
    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber1@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
        {
          email: 'subscriber2@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
        {
          email: 'subscriber3@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

    // Execute function (cron function, no events needed)
    const { result } = await t.execute();

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 3);
    expect(result).toHaveProperty('failed', 0);
    expect(result).toHaveProperty('rate', '100.0%');

    // Verify digest content was fetched
    expect(mockContentService.getWeeklyDigest).toHaveBeenCalledTimes(1);
    const digestCall = mockContentService.getWeeklyDigest.mock.calls[0][0];
    expect(digestCall).toHaveProperty('p_week_start');
    expect(typeof digestCall.p_week_start).toBe('string');

    // Verify subscribers were fetched
    expect(mockNewsletterService.getActiveSubscribersWithPreferences).toHaveBeenCalledTimes(1);

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
    // Create 250 subscribers (3 batches: 100, 100, 50)
    const subscribers = Array.from({ length: 250 }, (_, i) => ({
      email: `subscriber${i}@example.com`,
      categories_visited: [],
      engagement_score: 0,
      primary_interest: null,
    }));

    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue(subscribers),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [], // No new content
        trending_content: [], // No trending content
      }),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([]), // No subscribers
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockRejectedValue(new Error('Database connection failed')),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockRejectedValue(new Error('Database error')),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber1@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
        {
          email: 'subscriber2@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    // Mock batch send failure
    mockResendBatchSend.mockResolvedValue({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    });

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber1@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    // Mock batch send exception
    mockResendBatchSend.mockRejectedValue(new Error('Network timeout'));

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [],
        trending_content: [],
      }),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

    const { result } = await t.executeStep('fetch-digest-content');

    // Verify step result
    expect(result).toHaveProperty('week_of', 'December 16-22, 2025');
    expect(result).toHaveProperty('new_content');
    expect(result).toHaveProperty('trending_content');

    // Verify service was called
    expect(mockContentService.getWeeklyDigest).toHaveBeenCalledTimes(1);
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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      throw new Error(`Unknown service: ${serviceName}`);
    });
    await t.executeStep('fetch-digest-content');

    // Now execute full function to test fetch-subscribers step
    // (fetch-subscribers step requires digest content to be available)
    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

    const { result } = await t.execute();

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 1);
    expect(mockNewsletterService.getActiveSubscribersWithPreferences).toHaveBeenCalledTimes(1);
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
    // Set up prerequisites
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue([
        {
          email: 'subscriber@example.com',
          categories_visited: [],
          engagement_score: 0,
          primary_interest: null,
        },
      ]),
    };

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    const mockContentService = {
      getWeeklyDigest: jest.fn().mockResolvedValue({
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
      }),
    };

    // Create 103 subscribers (first batch: 100, second batch: 3)
    const subscribers = Array.from({ length: 103 }, (_, i) => ({
      email: `subscriber${i + 1}@example.com`,
      categories_visited: [],
      engagement_score: 0,
      primary_interest: null,
    }));

    const mockNewsletterService = {
      getActiveSubscribersWithPreferences: jest.fn().mockResolvedValue(subscribers),
    };

    // Mock first batch success, second batch failure
    mockResendBatchSend
      .mockResolvedValueOnce({ data: null, error: null }) // First 100 succeed
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } }); // Next 3 fail

    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'content') return Promise.resolve(mockContentService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

    const { result } = await t.execute();

    // Verify success rate calculation
    expect(result).toHaveProperty('sent', 100);
    expect(result).toHaveProperty('failed', 3);
    expect(result).toHaveProperty('rate', '97.1%'); // 100/103 = 97.087% ≈ 97.1%
  });
});
