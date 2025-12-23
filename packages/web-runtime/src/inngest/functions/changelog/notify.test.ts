/**
 * Changelog Notify Inngest Function Tests
 *
 * Tests the processChangelogNotifyQueue function using @inngest/test.
 * This tests the function logic, not the route handler.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { revalidateTag } from 'next/cache';

// Mock next/cache, supabase/pgmq-client, data/service-factory, logging/server, shared-runtime, monitoring
// Define mocks directly in jest.mock() factory functions to avoid hoisting issues
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

jest.mock('../../../data/service-factory', () => {
  const mockGetService = jest.fn();
  return {
    getService: mockGetService,
    __mockGetService: mockGetService,
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
const {
  __mockPgmqRead: mockPgmqRead,
  __mockPgmqDelete: mockPgmqDelete,
} = jest.requireMock('../../../supabase/pgmq-client');
const { __mockGetService: mockGetService } = jest.requireMock('../../../data/service-factory');
const { __mockRevalidateTag: mockRevalidateTag } = jest.requireMock('next/cache');
const {
  __mockLogger: mockLogger,
  __mockCreateWebAppContextWithId: mockCreateWebAppContextWithId,
} = jest.requireMock('../../../logging/server');
const {
  __mockNormalizeError: mockNormalizeError,
  __mockGetEnvVar: mockGetEnvVar,
} = jest.requireMock('@heyclaude/shared-runtime');
const { __mockSendCronSuccessHeartbeat: mockSendCronSuccessHeartbeat } = jest.requireMock('../../utils/monitoring');
const mockFetch = jest.fn();

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

    jest.clearAllMocks();
    jest.resetAllMocks();
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

    // Mock services
    const mockMiscService = {
      upsertNotification: jest.fn().mockResolvedValue(undefined),
    };
    const mockNewsletterService = {
      getActiveSubscribers: jest.fn().mockResolvedValue([]), // No subscribers for this test
    };
    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'misc') return Promise.resolve(mockMiscService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    expect(mockMiscService.upsertNotification).toHaveBeenCalled();
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

    // Mock services
    const mockMiscService = {
      upsertNotification: jest.fn().mockResolvedValue(undefined),
    };
    const mockNewsletterService = {
      getActiveSubscribers: jest.fn().mockResolvedValue([]),
    };
    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'misc') return Promise.resolve(mockMiscService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    expect(mockMiscService.upsertNotification).toHaveBeenCalled();
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

    // Mock services for valid message processing
    const mockMiscService = {
      upsertNotification: jest.fn().mockResolvedValue(undefined),
    };
    const mockNewsletterService = {
      getActiveSubscribers: jest.fn().mockResolvedValue([]),
    };
    mockGetService.mockReset();
    mockGetService.mockImplementation((serviceName: string) => {
      if (serviceName === 'misc') return Promise.resolve(mockMiscService);
      if (serviceName === 'newsletter') return Promise.resolve(mockNewsletterService);
      throw new Error(`Unknown service: ${serviceName}`);
    });

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
    expect(mockMiscService.upsertNotification).toHaveBeenCalledTimes(1); // Only called for valid message
  });
});
