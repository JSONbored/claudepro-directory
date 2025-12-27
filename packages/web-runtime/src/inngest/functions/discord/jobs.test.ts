/**
 * Discord Jobs Inngest Function Integration Tests
 *
 * Tests processDiscordJobsQueue function → PGMQ → Discord webhook flow.
 * Uses InngestTestEngine, test PGMQ queue, and real pgmq-client functions.
 *
 * @group Inngest
 * @group Discord
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processDiscordJobsQueue } from './jobs';

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
    operation: 'processDiscordJobsQueue',
    route: '/inngest/discord/jobs',
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
  const mockSanitizeForDiscord = jest.fn((text: string, maxLength?: number) => {
    if (maxLength && text.length > maxLength) {
      return text.slice(0, maxLength - 3) + '...';
    }
    return text;
  });
  return {
    normalizeError: mockNormalizeError,
    sanitizeForDiscord: mockSanitizeForDiscord,
    __mockNormalizeError: mockNormalizeError,
    __mockSanitizeForDiscord: mockSanitizeForDiscord,
  };
});

jest.mock('@heyclaude/shared-runtime/schemas/env', () => ({
  env: {
    DISCORD_JOBS_WEBHOOK_URL: 'https://discord.com/api/webhooks/jobs',
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
const mockFetch = jest.fn<typeof fetch>();

// Mock global fetch for Discord webhook
global.fetch = mockFetch as typeof fetch;

// Import function AFTER mocks are set up
describe('processDiscordJobsQueue', () => {
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
      function: processDiscordJobsQueue,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockFetch.mockReset();
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'processDiscordJobsQueue',
      route: '/inngest/discord/jobs',
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
   * Success case: Process INSERT job event successfully
   *
   * Tests that INSERT job events are processed and sent to Discord.
   */
  it('should process INSERT job event successfully', async () => {
    const mockJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Test Job',
      company: 'Test Company',
      location: 'Remote',
      remote: true,
      type: 'Full-time',
      salary: '$100k',
      tier: 'premium',
      status: 'active',
      is_placeholder: false,
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'jobs',
      schema: 'public',
      record: mockJob,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);

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
      'https://discord.com/api/webhooks/jobs',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('🎉 **New Job Posted**'),
      })
    );

    // Verify message was deleted from queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_jobs');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'job-123',
        type: 'INSERT',
      }),
      'Discord job notification sent'
    );
  });

  /**
   * Success case: Process UPDATE job event successfully
   *
   * Tests that UPDATE job events with monitored field changes are processed.
   */
  it('should process UPDATE job event with monitored field changes', async () => {
    const oldJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Old Title',
      company: 'Old Company',
      status: 'active',
    };

    const newJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'New Title', // Changed
      company: 'New Company', // Changed
      status: 'active',
    };

    const mockPayload = {
      type: 'UPDATE' as const,
      table: 'jobs',
      schema: 'public',
      record: newJob,
      old_record: oldJob,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);

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
      expect.anything(),
      expect.objectContaining({
        body: expect.stringContaining('📝 **Job Updated**'),
      })
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
      table: 'jobs',
      schema: 'public',
      record: {},
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);

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
    const messagesAfter = await testQueue!.read('discord_jobs');
    expect(messagesAfter).toBeNull(); // Queue should be empty after processing
  });

  /**
   * Success case: Skip draft or placeholder jobs
   *
   * Tests that draft or placeholder jobs are skipped for INSERT events.
   */
  it('should skip draft or placeholder jobs for INSERT', async () => {
    const mockJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Test Job',
      status: 'draft',
      is_placeholder: false,
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'jobs',
      schema: 'public',
      record: mockJob,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);

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
  });

  /**
   * Success case: Skip UPDATE events without monitored field changes
   *
   * Tests that UPDATE events without monitored field changes are skipped.
   */
  it('should skip UPDATE events without monitored field changes', async () => {
    const oldJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Same Title',
      company: 'Same Company',
      status: 'active',
    };

    const newJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Same Title', // No change
      company: 'Same Company', // No change
      status: 'active',
    };

    const mockPayload = {
      type: 'UPDATE' as const,
      table: 'jobs',
      schema: 'public',
      record: newJob,
      old_record: oldJob,
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockPayload,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);

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
  });

  /**
   * Error case: Invalid slug
   *
   * Tests that jobs with invalid slugs are skipped.
   */
  it('should skip jobs with invalid slugs', async () => {
    const mockJob = {
      id: 'job-123',
      slug: 'invalid slug!', // Invalid (contains space and special char)
      title: 'Test Job',
      status: 'active',
      is_placeholder: false,
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'jobs',
      schema: 'public',
      record: mockJob,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);

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
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'invalid slug!',
      }),
      'Invalid job slug, skipping embed'
    );
  });

  /**
   * Error case: Discord webhook failure
   *
   * Tests that Discord webhook failures are handled gracefully.
   */
  it('should handle Discord webhook failures gracefully', async () => {
    const mockJob = {
      id: 'job-123',
      slug: 'test-job',
      title: 'Test Job',
      status: 'active',
      is_placeholder: false,
    };

    const mockPayload = {
      type: 'INSERT' as const,
      table: 'jobs',
      schema: 'public',
      record: mockJob,
      old_record: null,
    };

    // Enqueue message to test queue (integration test - uses real test queue)
    const testQueue = getTestPgmqQueue();
    expect(testQueue).not.toBeNull();
    await testQueue!.send('discord_jobs', mockPayload);
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
        jobId: 'job-123',
        status: 400,
      }),
      'Discord webhook failed'
    );

    // Message should not be deleted on failure (will retry)
    // Verify message is still in queue (integration test - uses real test queue)
    const messagesAfter = await testQueue!.read('discord_jobs');
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
   * Error case: Missing webhook URL
   *
   * Tests that missing webhook URL returns skipped.
   */
  it('should return skipped when webhook URL is not configured', async () => {
    // Mock env to return undefined
    const envMock = jest.requireMock('@heyclaude/shared-runtime/schemas/env') as {
      env: Record<string, string | undefined>;
    };
    const originalUrl = envMock.env.DISCORD_JOBS_WEBHOOK_URL;
    envMock.env.DISCORD_JOBS_WEBHOOK_URL = undefined;

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
    expect(result.skipped).toBe('no_webhook_url');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.anything(),
      'Discord jobs webhook URL not configured'
    );

    // Restore original URL
    envMock.env.DISCORD_JOBS_WEBHOOK_URL = originalUrl;
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
