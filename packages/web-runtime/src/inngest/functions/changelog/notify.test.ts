/**
 * Changelog Notify Inngest Function Integration Tests
 *
 * Tests processChangelogNotifyQueue function → MiscService/NewsletterService → database flow.
 * Uses InngestTestEngine, Prismocker for in-memory database, and real service factory.
 *
 * @group Inngest
 * @group Changelog
 * @group Integration
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { revalidateTag } from 'next/cache';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock PGMQ client (external dependency)
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

// Use real service factory (return actual services)
jest.mock('../../../data/service-factory', () => {
  // Import real service factory to return real services
  const actual = jest.requireActual('../../../data/service-factory');
  return {
    ...actual,
    getService: actual.getService, // Use real getService which returns real services
  };
});

jest.mock('next/cache', () => {
  const mockRevalidateTag = jest.fn();
  return {
    revalidateTag: mockRevalidateTag,
    __mockRevalidateTag: mockRevalidateTag,
  };
});

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'processChangelogNotifyQueue',
    route: '/inngest/changelog/notify',
  }));
  return {
    logger: mockLogger,
    createWebAppContextWithId: mockCreateWebAppContextWithId,
    __mockLogger: mockLogger,
    __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
  };
});

jest.mock('@heyclaude/shared-runtime', () => {
  const mockNormalizeError = jest.fn((error, fallbackMessage) => {
    // Always return an Error object with a message property
    if (error instanceof Error) {
      return error;
    }
    return new Error(fallbackMessage || String(error || 'Unknown error'));
  });
  const mockGetEnvVar = jest.fn((key: string) => {
    if (key === 'DISCORD_CHANGELOG_WEBHOOK_URL') return 'https://discord.com/api/webhooks/test';
    if (key === 'NEXT_PUBLIC_SITE_URL') return 'https://claudepro.directory';
    return undefined;
  });
  const mockCreatePinoConfig = jest.fn((options?: { service?: string }) => ({
    level: 'info',
    service: options?.service || 'test',
  }));
  return {
    normalizeError: mockNormalizeError,
    getEnvVar: mockGetEnvVar,
    createPinoConfig: mockCreatePinoConfig,
    __mockNormalizeError: mockNormalizeError,
    __mockGetEnvVar: mockGetEnvVar,
    __mockCreatePinoConfig: mockCreatePinoConfig,
  };
});

jest.mock('../../utils/monitoring', () => {
  const mockSendCronSuccessHeartbeat = jest.fn();
  return {
    sendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
    __mockSendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat,
  };
});

jest.mock('../../../email/base-template', () => {
  const mockRenderEmailTemplate = jest.fn().mockResolvedValue('<html>Test Email</html>');
  return {
    renderEmailTemplate: mockRenderEmailTemplate,
    __mockRenderEmailTemplate: mockRenderEmailTemplate,
  };
});

jest.mock('../../../integrations/resend', () => {
  const mockBatchSend = jest.fn().mockResolvedValue({
    data: { length: 0 },
  });
  const mockResendClient = {
    batch: {
      send: mockBatchSend,
    },
  };
  const mockGetResendClient = jest.fn(() => mockResendClient);
  return {
    getResendClient: mockGetResendClient,
    __mockGetResendClient: mockGetResendClient,
    __mockBatchSend: mockBatchSend,
  };
});

// Get mocks for use in tests
const { __mockPgmqRead: mockPgmqRead, __mockPgmqDelete: mockPgmqDelete } = jest.requireMock(
  '../../../supabase/pgmq-client'
);
const { __mockRevalidateTag: mockRevalidateTag } = jest.requireMock('next/cache');
const mockFetch = jest.fn();

// Mock global fetch for Discord webhook
global.fetch = mockFetch;

// Import function AFTER mocks are set up
import { processChangelogNotifyQueue } from './notify';

describe('processChangelogNotifyQueue', () => {
  let t: InngestTestEngine;
  let prismocker: PrismaClient;

  beforeEach(() => {
    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: processChangelogNotifyQueue,
    });

    // Initialize Prismocker and clear cache for a clean test state
    prismocker = prisma as unknown as PrismaClient;
    clearRequestCache();

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Reset PGMQ mocks
    mockPgmqRead.mockReset();
    mockPgmqDelete.mockReset();
    mockRevalidateTag.mockReset();
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
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

  it('should return processed: 0 when queue is empty', async () => {
    // Mock empty queue
    mockPgmqRead.mockResolvedValue([]);

    const { result } = await t.execute();

    expect(result).toEqual({ processed: 0, notified: 0 });
    expect(mockPgmqRead).toHaveBeenCalled();
    expect(mockPgmqDelete).not.toHaveBeenCalled();
  });

  it('should process changelog notifications successfully', async () => {
    // Seed Prismocker with newsletter subscriptions (empty for this test)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', []);
    }

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
    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock Discord webhook
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    // Execute function - InngestTestEngine will run the actual function code
    // For cron functions, execute() without arguments triggers the cron
    const { result } = await t.execute();

    expect(result).toEqual({
      processed: 1,
      notified: 1,
    });
    expect(mockPgmqRead).toHaveBeenCalled();

    // Verify notification was created/upserted in Prismocker
    const notification = await prismocker.notifications.findUnique({
      where: { id: 'test-entry-id' },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Release');
    expect(notification?.message).toBe('Test summary');
    expect(notification?.type).toBe('announcement');
    expect(notification?.priority).toBe('high');
    expect(notification?.action_label).toBe('Read release notes');
    expect(notification?.action_href).toBe('/changelog/1-2-0-2025-12-07');

    expect(mockRevalidateTag).toHaveBeenCalledWith('changelog', 'max');
    expect(mockRevalidateTag).toHaveBeenCalledWith('changelog-1-2-0-2025-12-07', 'max');
  });

  it('should handle Discord webhook failures gracefully', async () => {
    // Seed Prismocker with newsletter subscriptions (empty for this test)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', []);
    }

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

    // Mock queue read
    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock Discord webhook failure
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

    // Verify notification was still created/upserted in Prismocker (even though Discord failed)
    const notification = await prismocker.notifications.findUnique({
      where: { id: 'test-entry-id' },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Test Release');
  });

  it('should filter invalid messages from queue', async () => {
    // Seed Prismocker with newsletter subscriptions (empty for this test)
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('newsletter_subscriptions', []);
    }

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

    // Mock queue to return both valid and invalid messages
    // The function will filter out invalid ones
    mockPgmqRead.mockResolvedValue([validMessage, invalidMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock Discord webhook
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const { result } = await t.execute();

    // Should only process valid message (invalid one is filtered out)
    expect(result.processed).toBe(1); // Only valid message processed
    expect(result.notified).toBe(1);

    // Verify only valid notification was created in Prismocker
    const notification = await prismocker.notifications.findUnique({
      where: { id: 'valid-id' },
    });
    expect(notification).toBeDefined();
    expect(notification?.title).toBe('Valid');

    // Verify invalid notification was not created
    const invalidNotifications = await prismocker.notifications.findMany({
      where: { title: 'Invalid' },
    });
    expect(invalidNotifications.length).toBe(0);
  });
});
