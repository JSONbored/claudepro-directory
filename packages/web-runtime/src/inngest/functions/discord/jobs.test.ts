/**
 * Discord Jobs Inngest Function Tests
 *
 * Tests the processDiscordJobsQueue function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/discord/jobs.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processDiscordJobsQueue } from './jobs';

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

// Get mocks for use in tests
const {
  __mockPgmqRead: mockPgmqRead,
  __mockPgmqDelete: mockPgmqDelete,
} = jest.requireMock('../../../supabase/pgmq-client') as {
  __mockPgmqRead: ReturnType<typeof jest.fn>;
  __mockPgmqDelete: ReturnType<typeof jest.fn>;
};
const {
  __mockLogger: mockLogger,
  __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
} = jest.requireMock('../../../logging/server') as {
  __mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
};
const { __mockNormalizeError: mockNormalizeError } = jest.requireMock('@heyclaude/shared-runtime') as {
  __mockNormalizeError: ReturnType<typeof jest.fn>;
};
const mockFetch = jest.fn();

// Mock global fetch for Discord webhook
global.fetch = mockFetch;

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
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: processDiscordJobsQueue,
    });

    jest.clearAllMocks();
    jest.resetAllMocks();
    mockPgmqRead.mockReset();
    mockPgmqDelete.mockReset();
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
      'https://discord.com/api/webhooks/jobs',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('🎉 **New Job Posted**'),
      })
    );

    expect(mockPgmqDelete).toHaveBeenCalledWith('discord_jobs', BigInt(1));

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
        jobId: 'job-123',
        status: 400,
      }),
      'Discord webhook failed'
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
    expect(mockPgmqRead).toHaveBeenCalledWith('discord_jobs', {
      vt: 60,
      qty: 10,
    });
  });
});

