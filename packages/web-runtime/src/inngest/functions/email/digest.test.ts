/**
 * Weekly Digest Email Inngest Function Tests
 *
 * Tests the sendWeeklyDigest function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/email/digest.test
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { sendWeeklyDigest } from './digest';
import { getResendClient } from '../../../integrations/resend';
import { renderEmailTemplate } from '../../../email/base-template';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockGetService = vi.hoisted(() => vi.fn());
const mockGetResendClient = vi.hoisted(() => vi.fn());
const mockRenderEmailTemplate = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'sendWeeklyDigest',
  route: '/inngest/email/digest',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error: unknown) => {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}));
const mockSendCronSuccessHeartbeat = vi.hoisted(() => vi.fn());

// Mock service factory
vi.mock('../../../data/service-factory', () => ({
  getService: mockGetService,
}));

// Mock Resend client
vi.mock('../../../integrations/resend', () => ({
  getResendClient: mockGetResendClient,
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

// Mock monitoring
vi.mock('../../utils/monitoring', () => ({
  sendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
}));

// Import function AFTER mocks are set up
describe('sendWeeklyDigest', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock Resend batch API
   */
  let mockResendBatchSend: ReturnType<typeof vi.fn>;

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
    vi.clearAllMocks();
    mockGetService.mockReset();
    mockGetResendClient.mockReset();
    mockRenderEmailTemplate.mockReset();

    // Set up Resend batch API mock
    mockResendBatchSend = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockResendClient = {
      batch: {
        send: mockResendBatchSend,
      },
    };
    mockGetResendClient.mockReturnValue(mockResendClient as any);

    // Set up default successful mock responses
    mockRenderEmailTemplate.mockResolvedValue('<html>Weekly digest HTML</html>');
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
      getWeeklyDigest: vi.fn().mockResolvedValue({
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
      getActiveSubscribers: vi.fn().mockResolvedValue([
        'subscriber1@example.com',
        'subscriber2@example.com',
        'subscriber3@example.com',
      ]),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never) // First call: content service
      .mockResolvedValueOnce(mockNewsletterService as never); // Second call: newsletter service

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
    expect(mockNewsletterService.getActiveSubscribers).toHaveBeenCalledTimes(1);

    // Verify email template was rendered
    expect(mockRenderEmailTemplate).toHaveBeenCalledTimes(1);
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
      tags: [{ name: 'type', value: 'weekly_digest' }],
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
    const subscribers = Array.from({ length: 250 }, (_, i) => `subscriber${i}@example.com`);

    const mockContentService = {
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(subscribers),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [], // No new content
        trending_content: [], // No trending content
      }),
    };

    mockGetService.mockResolvedValueOnce(mockContentService as never);

    const { result } = await t.execute();

    // Verify function skipped
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'no_content');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify skip was logged
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
        operation: 'sendWeeklyDigest',
        route: '/inngest/email/digest',
      }),
      'Digest skipped - no content'
    );
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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue([]), // No subscribers
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

    const { result } = await t.execute();

    // Verify function skipped
    expect(result).toHaveProperty('skipped', true);
    expect(result).toHaveProperty('reason', 'no_subscribers');

    // Verify no emails were sent
    expect(mockResendBatchSend).not.toHaveBeenCalled();

    // Verify skip was logged
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: 'test-request-id',
      }),
      'Digest skipped - no subscribers'
    );
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
      getWeeklyDigest: vi.fn().mockRejectedValue(new Error('Database connection failed')),
    };

    mockGetService.mockResolvedValueOnce(mockContentService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockRejectedValue(new Error('Database error')),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue([
        'subscriber1@example.com',
        'subscriber2@example.com',
      ]),
    };

    // Mock batch send failure
    mockResendBatchSend.mockResolvedValue({
      data: null,
      error: { message: 'Resend API rate limit exceeded' },
    });

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue([
        'subscriber1@example.com',
      ]),
    };

    // Mock batch send exception
    mockResendBatchSend.mockRejectedValue(new Error('Network timeout'));

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [], // No trending content
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(['subscriber@example.com']),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [], // No new content
        trending_content: [{ category: 'mcp', slug: 'test', title: 'Test', description: 'Test', url: 'https://example.com', views_total: 1000 }],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(['subscriber@example.com']),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [],
        trending_content: [],
      }),
    };

    mockGetService.mockResolvedValueOnce(mockContentService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    mockGetService.mockResolvedValueOnce(mockContentService as never);
    await t.executeStep('fetch-digest-content');

    // Now execute full function to test fetch-subscribers step
    // (fetch-subscribers step requires digest content to be available)
    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(['subscriber@example.com']),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never) // For fetch-digest-content
      .mockResolvedValueOnce(mockNewsletterService as never); // For fetch-subscribers

    const { result } = await t.execute();

    // Verify function completed successfully
    expect(result).toHaveProperty('sent', 1);
    expect(mockNewsletterService.getActiveSubscribers).toHaveBeenCalledTimes(1);
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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(['subscriber@example.com']),
    };

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

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
      getWeeklyDigest: vi.fn().mockResolvedValue({
        week_of: 'December 16-22, 2025',
        week_start: '2025-12-16',
        week_end: '2025-12-22',
        new_content: [{ category: 'agents', slug: 'test', title: 'Test', description: 'Test', date_added: '2025-12-17', url: 'https://example.com' }],
        trending_content: [],
      }),
    };

    // Create 103 subscribers (first batch: 100, second batch: 3)
    const subscribers = Array.from({ length: 103 }, (_, i) => `subscriber${i + 1}@example.com`);

    const mockNewsletterService = {
      getActiveSubscribers: vi.fn().mockResolvedValue(subscribers),
    };

    // Mock first batch success, second batch failure
    mockResendBatchSend
      .mockResolvedValueOnce({ data: null, error: null }) // First 100 succeed
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed' } }); // Next 3 fail

    mockGetService
      .mockResolvedValueOnce(mockContentService as never)
      .mockResolvedValueOnce(mockNewsletterService as never);

    const { result } = await t.execute();

    // Verify success rate calculation
    expect(result).toHaveProperty('sent', 100);
    expect(result).toHaveProperty('failed', 3);
    expect(result).toHaveProperty('rate', '97.1%'); // 100/103 = 97.087% ≈ 97.1%
  });
});

