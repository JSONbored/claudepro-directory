/**
 * Discord Submissions Inngest Function Integration Tests
 *
 * Tests processDiscordSubmissionsQueue function → PGMQ → Discord webhook flow.
 * Uses InngestTestEngine, test PGMQ queue, and real pgmq-client functions.
 *
 * @group Inngest
 * @group Discord
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processDiscordSubmissionsQueue } from './submissions';

// Use test queue for PGMQ operations
// Mock pgmq-client to use test queue
// This allows Inngest functions to read events that were enqueued by other tests
jest.mock('../../../supabase/pgmq-client', () => {
  // Import test queue utilities inside jest.mock() factory to avoid hoisting issues
  const { createTestPgmqQueue, createPgmqMocks } = require('../../../supabase/pgmq-client.test');
  const testQueue = createTestPgmqQueue();
  return createPgmqMocks(testQueue);
});

// Import test queue utilities for use in tests (after jest.mock())
import { resetTestPgmqQueue, getTestPgmqQueue } from '../../../supabase/pgmq-client.test';

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'processDiscordSubmissionsQueue',
    route: '/inngest/discord/submissions',
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
  return {
    normalizeError: mockNormalizeError,
    __mockNormalizeError: mockNormalizeError,
  };
});

jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    DISCORD_SUBMISSIONS_WEBHOOK_URL: 'https://discord.com/api/webhooks/submissions',
    DISCORD_ANNOUNCEMENTS_WEBHOOK_URL: 'https://discord.com/api/webhooks/announcements',
    NEXT_PUBLIC_SITE_URL: 'https://claudepro.directory',
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

// Get mocks for use in tests (for verification, but tests use test queue directly)
const { __mockPgmqRead: mockPgmqRead, __mockPgmqDelete: mockPgmqDelete } = jest.requireMock(
  '../../../supabase/pgmq-client'
) as {
  __mockPgmqRead: ReturnType<typeof jest.fn>;
  __mockPgmqDelete: ReturnType<typeof jest.fn>;
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
const mockFetch = jest.fn();

// Mock global fetch for Discord webhook
global.fetch = mockFetch;

// Import function AFTER mocks are set up
describe('processDiscordSubmissionsQueue', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Clear test queue before each test (REQUIRED for test isolation)
    resetTestPgmqQueue();

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: processDiscordSubmissionsQueue,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockFetch.mockReset();
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'processDiscordSubmissionsQueue',
      route: '/inngest/discord/submissions',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Set up default successful Discord API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
    } as Response);
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
   * Success case: Process INSERT submission event successfully
   *
   * Tests that INSERT submission events are processed and sent to admin webhook.
   */
  it('should process INSERT submission event successfully', async () => {
    const mockSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      description: 'Test Description',
      category: 'mcp',
      status: 'pending',
      github_url: 'https://github.com/test/repo',
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'content_submissions',
      schema: 'public',
      record: mockSubmission,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/submissions',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('📬 **New Content Submission**'),
      })
    );

    // Verify message was deleted from queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'submission-123',
      }),
      'Discord submission notification sent'
    );
  });

  /**
   * Success case: Process UPDATE event with status change to merged
   *
   * Tests that UPDATE events with status change to 'merged' are sent to announcements webhook.
   */
  it('should process UPDATE event with status change to merged', async () => {
    const oldSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      status: 'pending',
      category: 'mcp',
    };

    const newSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      status: 'merged', // Changed to merged
      category: 'mcp',
      description: 'Test Description',
      approved_slug: 'test-slug',
      author: 'Test Author',
    };

    const mockPayload = {
      type: 'UPDATE' as const,
      table: 'content_submissions',
      schema: 'public',
      record: newSubmission,
      old_record: oldSubmission,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(1);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/announcements',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('🎉 **New Content Published**'),
      })
    );

    // Verify message was deleted from queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'submission-123',
      }),
      'Discord merged notification sent'
    );
  });

  /**
   * Success case: Skip DELETE events
   *
   * Tests that DELETE events are skipped.
   */
  it('should skip DELETE events', async () => {
    const mockPayload = {
      type: 'DELETE' as const,
      table: 'content_submissions',
      schema: 'public',
      record: {},
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);

    expect(mockFetch).not.toHaveBeenCalled();
    // Verify message was deleted from queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing
  });

  /**
   * Success case: Skip UPDATE events without merge transition
   *
   * Tests that UPDATE events without status change to 'merged' are skipped.
   */
  it('should skip UPDATE events without merge transition', async () => {
    const oldSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      status: 'pending',
      category: 'mcp',
    };

    const newSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      status: 'pending', // Still pending, not merged
      category: 'mcp',
    };

    const mockPayload = {
      type: 'UPDATE' as const,
      table: 'content_submissions',
      schema: 'public',
      record: newSubmission,
      old_record: oldSubmission,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);

    expect(mockFetch).not.toHaveBeenCalled();
    // Verify message was deleted from queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing
  });

  /**
   * Error case: Discord webhook timeout
   *
   * Tests that Discord webhook timeouts are handled gracefully.
   */
  it('should handle Discord webhook timeouts gracefully', async () => {
    const mockSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      description: 'Test Description',
      category: 'mcp',
      status: 'pending',
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'content_submissions',
      schema: 'public',
      record: mockSubmission,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'submission-123',
      }),
      'Discord submission notification timed out'
    );

    // Message should not be deleted on failure (will retry)
    // Verify message is still in queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).not.toBeNull(); // Queue should still have the message
  });

  /**
   * Error case: Discord webhook failure
   *
   * Tests that Discord webhook failures are handled gracefully.
   */
  it('should handle Discord webhook failures gracefully', async () => {
    const mockSubmission = {
      id: 'submission-123',
      name: 'Test Submission',
      description: 'Test Description',
      category: 'mcp',
      status: 'pending',
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'content_submissions',
      schema: 'public',
      record: mockSubmission,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_submissions', mockPayload);

    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
    } as Response);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(1);
    expect(result.sent).toBe(0);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        submissionId: 'submission-123',
        status: 400,
      }),
      'Discord submission notification failed'
    );

    // Message should not be deleted on failure (will retry)
    // Verify message is still in queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_submissions');
    expect(messagesAfter).not.toBeNull(); // Queue should still have the message
  });

  /**
   * Success case: Empty queue
   *
   * Tests that empty queue returns processed: 0.
   */
  it('should return processed: 0 when queue is empty', async () => {
    // Don't enqueue any messages - queue should be empty

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number } };

    expect(result.processed).toBe(0);
    expect(result.sent).toBe(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /**
   * Error case: Missing webhook URLs
   *
   * Tests that missing webhook URLs return skipped.
   */
  it('should return skipped when webhook URLs are not configured', async () => {
    // Mock env to return undefined
    const envMock = jest.requireMock('@heyclaude/shared-runtime/schemas/env') as {
      env: Record<string, string | undefined>;
    };
    const originalSubmissionsUrl = envMock.env.DISCORD_SUBMISSIONS_WEBHOOK_URL;
    const originalAnnouncementsUrl = envMock.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL;
    envMock.env.DISCORD_SUBMISSIONS_WEBHOOK_URL = undefined;
    envMock.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL = undefined;

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; sent: number; skipped: string } };

    expect(result.processed).toBe(0);
    expect(result.sent).toBe(0);
    expect(result.skipped).toBe('no_webhook_urls');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.anything(),
      'Discord submission webhook URLs not configured'
    );

    // Restore original URLs
    envMock.env.DISCORD_SUBMISSIONS_WEBHOOK_URL = originalSubmissionsUrl;
    envMock.env.DISCORD_ANNOUNCEMENTS_WEBHOOK_URL = originalAnnouncementsUrl;
  });

  /**
   * Step test: read-queue step
   *
   * Tests the read-queue step individually.
   */
  it('should execute read-queue step correctly', async () => {
    // Don't enqueue any messages - queue should be empty

    const { result } = (await t.executeStep('read-queue', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: unknown[] };

    expect(result).toEqual([]);
  });
});
