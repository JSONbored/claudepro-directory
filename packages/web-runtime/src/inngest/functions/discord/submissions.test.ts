/**
 * Discord Submissions Inngest Function Tests
 *
 * Tests the processDiscordSubmissionsQueue function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/discord/submissions.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processDiscordSubmissionsQueue } from './submissions';

// Mock supabase/pgmq-client, logging, shared-runtime, environment, and monitoring
jest.mock('../../../supabase/pgmq-client', () => {
  const mockPgmqRead = jest.fn();
  const mockPgmqDelete = jest.fn();
  return {
    pgmqRead: mockPgmqRead,
    pgmqDelete: mockPgmqDelete,
    __mockPgmqRead: mockPgmqRead,
    __mockPgmqDelete: mockPgmqDelete,
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

// Get mocks for use in tests
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
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: processDiscordSubmissionsQueue,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockPgmqRead.mockReset();
    mockPgmqDelete.mockReset();
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

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockPayload,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

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

    expect(mockPgmqDelete).toHaveBeenCalledWith('discord_submissions', BigInt(1));

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

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockPayload,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

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
    expect(mockPgmqDelete).toHaveBeenCalled(); // Message still deleted
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

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockPayload,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);

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
    expect(mockPgmqDelete).not.toHaveBeenCalled();
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

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockPayload,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
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
    expect(mockPgmqDelete).not.toHaveBeenCalled();
  });

  /**
   * Success case: Empty queue
   *
   * Tests that empty queue returns processed: 0.
   */
  it('should return processed: 0 when queue is empty', async () => {
    mockPgmqRead.mockResolvedValue([]);

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
    expect(mockPgmqRead).toHaveBeenCalled();
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
    mockPgmqRead.mockResolvedValue([]);

    const { result } = (await t.executeStep('read-queue', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: unknown[] };

    expect(result).toEqual([]);
    expect(mockPgmqRead).toHaveBeenCalledWith('discord_submissions', {
      vt: 60,
      qty: 10,
    });
  });
});
