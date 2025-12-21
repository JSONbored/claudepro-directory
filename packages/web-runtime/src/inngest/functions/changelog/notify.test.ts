/**
 * Changelog Notify Inngest Function Tests
 *
 * Tests the processChangelogNotifyQueue function using @inngest/test.
 * This tests the function logic, not the route handler.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InngestTestEngine } from '@inngest/test';
import { revalidateTag } from 'next/cache';

// Hoist mocks BEFORE importing the function to ensure mocks are applied
const mockPgmqRead = vi.hoisted(() => vi.fn());
const mockPgmqDelete = vi.hoisted(() => vi.fn());
const mockGetService = vi.hoisted(() => vi.fn());
const mockRevalidateTag = vi.hoisted(() => vi.fn());
const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
}));
const mockCreateWebAppContextWithId = vi.hoisted(() => vi.fn(() => ({
  requestId: 'test-request-id',
  operation: 'processChangelogNotifyQueue',
  route: '/inngest/changelog/notify',
})));
const mockNormalizeError = vi.hoisted(() => vi.fn((error) => error));
const mockGetEnvVar = vi.hoisted(() => vi.fn((key: string) => {
  if (key === 'DISCORD_CHANGELOG_WEBHOOK_URL') return 'https://discord.com/api/webhooks/test';
  if (key === 'NEXT_PUBLIC_SITE_URL') return 'https://claudepro.directory';
  return undefined;
}));
const mockSendCronSuccessHeartbeat = vi.hoisted(() => vi.fn());
const mockFetch = vi.hoisted(() => vi.fn());

vi.mock('../../../supabase/pgmq-client', () => ({
  pgmqRead: mockPgmqRead,
  pgmqDelete: mockPgmqDelete,
}));

vi.mock('../../../data/service-factory', () => ({
  getService: mockGetService,
}));

vi.mock('next/cache', () => ({
  revalidateTag: mockRevalidateTag,
}));

vi.mock('../../../logging/server', () => ({
  logger: mockLogger,
  createWebAppContextWithId: mockCreateWebAppContextWithId,
}));

vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: mockNormalizeError,
  getEnvVar: mockGetEnvVar,
}));

vi.mock('../../utils/monitoring', () => ({
  sendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
}));

// Mock global fetch for Discord webhook
global.fetch = mockFetch;

// Import function AFTER mocks are set up
import { processChangelogNotifyQueue } from './notify';

describe('processChangelogNotifyQueue', () => {
  // Create a fresh test engine for each test to avoid state caching issues
  let t: InngestTestEngine;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: processChangelogNotifyQueue,
    });

    vi.clearAllMocks();
    // Reset mocks to ensure clean state
    mockPgmqRead.mockReset();
    mockPgmqDelete.mockReset();
    mockGetService.mockReset();
    mockRevalidateTag.mockReset();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  it('should return processed: 0 when queue is empty', async () => {
    // Mock empty queue
    mockPgmqRead.mockResolvedValue([]);

    const { result } = await t.execute();

    expect(result).toEqual({ processed: 0, notified: 0 });
    expect(mockPgmqRead).toHaveBeenCalled();
    expect(mockPgmqDelete).not.toHaveBeenCalled();
  });

  it('should process changelog notifications successfully', async () => {
    const mockJob = {
      entryId: 'test-entry-id',
      slug: '1-2-0-2025-12-07',
      title: 'Test Release',
      tldr: 'Test summary',
      sections: [
        {
          type: 'feat',
          commits: [
            {
              scope: 'api',
              description: 'Add new endpoint',
              sha: 'abc123',
              author: 'test@example.com',
            },
          ],
        },
      ],
      commits: [],
      releaseDate: '2025-12-07',
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockJob,
    };

    // Mock queue read - this will be called inside the step
    // IMPORTANT: Reset mock before each test to ensure clean state
    mockPgmqRead.mockReset();
    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock service
    const mockService = {
      upsertNotification: vi.fn().mockResolvedValue(undefined),
    };
    mockGetService.mockReset();
    mockGetService.mockResolvedValue(mockService as never);

    // Mock Discord webhook
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    // Execute function - InngestTestEngine will run the actual function code
    // The mocks above will be used when the function executes
    // For cron functions, execute() without arguments triggers the cron
    const { result } = await t.execute();

    expect(result).toEqual({
      processed: 1,
      notified: 1,
    });
    expect(mockPgmqRead).toHaveBeenCalled();
    expect(mockService.upsertNotification).toHaveBeenCalled();
    expect(mockRevalidateTag).toHaveBeenCalledWith('changelog', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('changelog-1-2-0-2025-12-07', 'max');
  });

  it('should handle Discord webhook failures gracefully', async () => {
    const mockJob = {
      entryId: 'test-entry-id',
      slug: '1-2-0-2025-12-07',
      title: 'Test Release',
      tldr: 'Test summary',
      sections: [],
      commits: [],
      releaseDate: '2025-12-07',
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockJob,
    };

    // Reset mocks to ensure clean state
    mockPgmqRead.mockReset();
    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    const mockService = {
      upsertNotification: vi.fn().mockResolvedValue(undefined),
    };
    mockGetService.mockReset();
    mockGetService.mockResolvedValue(mockService as never);

    // Mock Discord webhook failure
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    // Execute function - Discord will fail but notification should still succeed
    const { result } = await t.execute();

    expect(result).toEqual({
      processed: 1,
      notified: 1, // Still notified because notification was inserted
    });
    expect(mockService.upsertNotification).toHaveBeenCalled();
  });

  it('should filter invalid messages from queue', async () => {
    const validMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: {
        entryId: 'valid-id',
        slug: 'valid-slug',
        title: 'Valid',
        tldr: 'Valid',
        sections: [],
        commits: [],
        releaseDate: '2025-12-07',
      },
    };

    const invalidMessage = {
      msg_id: BigInt(2),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: {
        // Missing required fields (entryId, slug)
        title: 'Invalid',
      },
    };

    // Reset mocks to ensure clean state
    mockPgmqRead.mockReset();
    // Mock queue to return both valid and invalid messages
    // The function will filter out invalid ones
    mockPgmqRead.mockResolvedValue([validMessage, invalidMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock service for valid message processing
    const mockService = {
      upsertNotification: vi.fn().mockResolvedValue(undefined),
    };
    mockGetService.mockReset();
    mockGetService.mockResolvedValue(mockService as never);

    // Mock Discord webhook
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const { result } = await t.execute();

    // Should only process valid message (invalid one is filtered out)
    expect(result.processed).toBe(1); // Only valid message processed
    expect(result.notified).toBe(1);
    expect(mockService.upsertNotification).toHaveBeenCalledTimes(1); // Only called for valid message
  });
});
