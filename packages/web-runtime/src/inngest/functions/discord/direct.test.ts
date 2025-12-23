/**
 * Discord Direct Notification Inngest Function Tests
 *
 * Tests the sendDiscordDirect function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/discord/direct.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { sendDiscordDirect } from './direct';

// Mock logging, shared-runtime, environment, and monitoring
jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'sendDiscordDirect',
    route: '/inngest/discord/direct',
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
    DISCORD_CHANGELOG_WEBHOOK_URL: 'https://discord.com/api/webhooks/changelog',
    DISCORD_SUBMISSIONS_WEBHOOK_URL: 'https://discord.com/api/webhooks/submissions',
    DISCORD_JOBS_WEBHOOK_URL: 'https://discord.com/api/webhooks/jobs',
    DISCORD_ERROR_WEBHOOK_URL: 'https://discord.com/api/webhooks/errors',
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

// Import function AFTER mocks are set up
describe('sendDiscordDirect', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;

  /**
   * Mock functions - accessed via jest.requireMock
   */
  let mockLogger: {
    info: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    error: ReturnType<typeof jest.fn>;
  };
  let mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
  let mockNormalizeError: ReturnType<typeof jest.fn>;
  let mockFetch: ReturnType<typeof jest.fn>;

  /**
   * Setup before each test
   */
  beforeEach(() => {
    // Get mocked functions via jest.requireMock
    const loggingMock = jest.requireMock('../../../logging/server') as {
      __mockLogger: {
        info: ReturnType<typeof jest.fn>;
        warn: ReturnType<typeof jest.fn>;
        error: ReturnType<typeof jest.fn>;
      };
      __mockCreateWebAppContextWithId: ReturnType<typeof jest.fn>;
    };
    const sharedRuntimeMock = jest.requireMock('@heyclaude/shared-runtime') as {
      __mockNormalizeError: ReturnType<typeof jest.fn>;
    };

    mockLogger = loggingMock.__mockLogger;
    mockCreateWebAppContextWithId = loggingMock.__mockCreateWebAppContextWithId;
    mockNormalizeError = sharedRuntimeMock.__mockNormalizeError;

    // Mock global fetch for Discord API
    mockFetch = jest.fn();
    global.fetch = mockFetch as typeof fetch;

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: sendDiscordDirect,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockFetch.mockReset();

    // Restore mock implementations after reset
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'sendDiscordDirect',
      route: '/inngest/discord/direct',
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
   * Success case: Send Discord notification successfully
   *
   * Tests that Discord notification is sent successfully.
   */
  it('should send Discord notification successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; notificationType: string } };

    expect(result.success).toBe(true);
    expect(result.notificationType).toBe('changelog');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/changelog',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Test notification',
        }),
      })
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'changelog',
      }),
      'Discord Direct: Notification sent'
    );
  });

  /**
   * Success case: Send with embeds
   *
   * Tests that Discord notification with embeds is sent successfully.
   */
  it('should send Discord notification with embeds successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'submission',
            payload: {
              embeds: [
                {
                  title: 'Test Embed',
                  description: 'Test Description',
                },
              ],
            },
          },
        },
      ],
    })) as { result: { success: boolean; notificationType: string } };

    expect(result.success).toBe(true);
    expect(result.notificationType).toBe('submission');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://discord.com/api/webhooks/submissions',
      expect.objectContaining({
        body: JSON.stringify({
          embeds: [
            {
              title: 'Test Embed',
              description: 'Test Description',
            },
          ],
        }),
      })
    );
  });

  /**
   * Error case: Missing notification type
   *
   * Tests that missing notification type returns error.
   */
  it('should return error for missing notification type', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; error: string } };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Missing notification type');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: expect.any(String),
      }),
      'Discord Direct: Missing notification type'
    );
  });

  /**
   * Error case: Payload too large
   *
   * Tests that payload exceeding 200KB returns error.
   */
  it('should return error for payload too large', async () => {
    const largePayload = {
      content: 'x'.repeat(201_000), // Exceeds 200KB limit
    };

    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: largePayload,
          },
        },
      ],
    })) as { result: { success: boolean; error: string } };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Payload too large');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        payloadSize: expect.any(Number),
        maxSize: 200_000,
      }),
      'Discord Direct: Payload too large'
    );
  });

  /**
   * Error case: Webhook URL not configured
   *
   * Tests that missing webhook URL returns error.
   */
  it('should return error for webhook URL not configured', async () => {
    // Mock env to return undefined for unknown notification type
    const envMock = jest.requireMock('@heyclaude/shared-runtime/schemas/env') as {
      env: Record<string, string | undefined>;
    };
    const originalEnv = { ...envMock.env };
    envMock.env.DISCORD_CHANGELOG_WEBHOOK_URL = undefined;

    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; error: string } };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Webhook not configured for type: changelog');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'changelog',
      }),
      'Discord Direct: Webhook URL not configured'
    );

    // Restore original env
    envMock.env = originalEnv;
  });

  /**
   * Error case: Discord webhook timeout
   *
   * Tests that Discord webhook timeout is handled gracefully.
   */
  it('should handle Discord webhook timeout gracefully', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; error: string } };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Discord webhook timed out');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: 'changelog',
      }),
      'Discord Direct: Webhook timed out'
    );
  });

  /**
   * Error case: Discord webhook failure
   *
   * Tests that Discord webhook failures are handled gracefully.
   */
  it('should handle Discord webhook failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response);

    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; error: string; status: number } };

    expect(result.success).toBe(false);
    expect(result.error).toBe('Discord webhook failed');
    expect(result.status).toBe(400);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
      }),
      'Discord Direct: Webhook failed'
    );
  });

  /**
   * Error case: Network error
   *
   * Tests that network errors are handled gracefully.
   */
  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; error: string } };

    expect(result.success).toBe(false);
    // The error message comes from the original error ("Network error")
    // normalizeError preserves the original message if it's an Error instance
    expect(result.error).toBe('Network error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        notificationType: 'changelog',
      }),
      'Discord Direct: Notification error'
    );
  });

  /**
   * Step test: send-discord-webhook step
   *
   * Tests the send-discord-webhook step individually.
   */
  it('should execute send-discord-webhook step correctly', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'discord/direct',
          data: {
            notificationType: 'changelog',
            payload: {
              content: 'Test notification',
            },
          },
        },
      ],
    })) as { result: { success: boolean; notificationType: string } };

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalled();
  });
});

