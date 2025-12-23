/**
 * IndexNow Submission Inngest Function Tests
 *
 * Tests the submitIndexNow function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/indexnow/submit.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { submitIndexNow } from './submit';

// Mock logging, shared-runtime, fetch helpers, and monitoring
jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'submitIndexNow',
    route: '/inngest/indexnow/submit',
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
    TIMEOUT_PRESETS: {
      rpc: 30000,
      external: 10000,
      storage: 15000,
    },
  };
});

jest.mock('@heyclaude/web-runtime/server/fetch-helpers', () => {
  const mockFetchWithRetryAndTimeout = jest.fn();
  return {
    fetchWithRetryAndTimeout: mockFetchWithRetryAndTimeout,
    __mockFetchWithRetryAndTimeout: mockFetchWithRetryAndTimeout,
  };
});

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
describe('submitIndexNow', () => {
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
  let mockFetchWithRetryAndTimeout: ReturnType<typeof jest.fn>;

  /**
   * Setup before each test
   * - Creates fresh test engine instance
   * - Resets all mocks to clean state
   * - Sets up default mock return values
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
    const fetchHelpersMock = jest.requireMock('@heyclaude/web-runtime/server/fetch-helpers') as {
      __mockFetchWithRetryAndTimeout: ReturnType<typeof jest.fn>;
    };

    mockLogger = loggingMock.__mockLogger;
    mockCreateWebAppContextWithId = loggingMock.__mockCreateWebAppContextWithId;
    mockNormalizeError = sharedRuntimeMock.__mockNormalizeError;
    mockFetchWithRetryAndTimeout = fetchHelpersMock.__mockFetchWithRetryAndTimeout;

    // Create fresh test engine instance for each test
    // This prevents step result memoization between tests
    t = new InngestTestEngine({
      function: submitIndexNow,
    });

    // Reset all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Restore mock implementations after reset
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'submitIndexNow',
      route: '/inngest/indexnow/submit',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Set up default successful IndexNow API response
    mockFetchWithRetryAndTimeout.mockResolvedValue({
      response: {
        ok: true,
        status: 200,
        text: async () => '',
      } as Response,
    });
  });

  /**
   * Success case: Submit URLs successfully
   *
   * Tests that valid URL list is submitted to IndexNow API.
   */
  it('should submit URLs to IndexNow successfully', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: ['https://example.com/page1', 'https://example.com/page2'],
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number } };

    expect(result.success).toBe(true);
    expect(result.submitted).toBe(2);

    expect(mockFetchWithRetryAndTimeout).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.indexnow.org/IndexNow',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('example.com'),
      }),
      expect.any(Number)
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        submitted: 2,
        host: 'example.com',
      }),
      'IndexNow: Submission successful'
    );
  });

  /**
   * Success case: Large URL list (truncated to 10,000)
   *
   * Tests that URL list is truncated to IndexNow's 10,000 URL limit.
   */
  it('should truncate URL list to 10,000 URLs', async () => {
    const largeUrlList = Array.from({ length: 15000 }, (_, i) => `https://example.com/page${i}`);

    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: largeUrlList,
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number } };

    expect(result.success).toBe(true);
    expect(result.submitted).toBe(15000); // Original count

    // Verify payload was truncated to 10,000
    const callArgs = mockFetchWithRetryAndTimeout.mock.calls[0];
    const body = JSON.parse(callArgs[0].body as string);
    expect(body.urlList.length).toBe(10000);
  });

  /**
   * Error case: Empty URL list
   *
   * Tests that empty URL list returns error.
   */
  it('should return error for empty URL list', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: [],
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number; error: string } };

    expect(result.success).toBe(false);
    expect(result.submitted).toBe(0);
    expect(result.error).toBe('Empty or invalid URL list');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        urlCount: 0,
      }),
      'IndexNow: Empty or invalid URL list'
    );
  });

  /**
   * Error case: Missing required parameters
   *
   * Tests that missing host, key, or keyLocation returns error.
   */
  it('should return error for missing required parameters', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: ['https://example.com/page1'],
            // Missing host, key, keyLocation
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number; error: string } };

    expect(result.success).toBe(false);
    expect(result.submitted).toBe(0);
    expect(result.error).toBe('Missing required parameters');

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        hasHost: false,
        hasKey: false,
        hasKeyLocation: false,
      }),
      'IndexNow: Missing required parameters'
    );
  });

  /**
   * Error case: IndexNow API failure
   *
   * Tests that API failures are handled gracefully.
   */
  it('should handle IndexNow API failure gracefully', async () => {
    mockFetchWithRetryAndTimeout.mockResolvedValue({
      response: {
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      } as Response,
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: ['https://example.com/page1'],
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number; error: string; status: number } };

    expect(result.success).toBe(false);
    expect(result.submitted).toBe(0);
    expect(result.error).toBe('IndexNow request failed');
    expect(result.status).toBe(400);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        submitted: 1,
      }),
      'IndexNow: API request failed'
    );
  });

  /**
   * Error case: Network error
   *
   * Tests that network errors are handled gracefully.
   */
  it('should handle network errors gracefully', async () => {
    mockFetchWithRetryAndTimeout.mockRejectedValue(new Error('Network error'));

    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: ['https://example.com/page1'],
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number; error: string } };

    expect(result.success).toBe(false);
    expect(result.submitted).toBe(0);
    // The error message comes from the normalized error, which preserves the original message
    expect(result.error).toBe('Network error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        submitted: 1,
      }),
      'IndexNow: Submission error'
    );
  });

  /**
   * Step test: submit-to-indexnow step
   *
   * Tests the submit-to-indexnow step individually.
   */
  it('should execute submit-to-indexnow step correctly', async () => {
    const { result } = (await t.execute({
      events: [
        {
          name: 'indexnow/submit',
          data: {
            urlList: ['https://example.com/page1'],
            host: 'example.com',
            key: 'test-key',
            keyLocation: 'https://example.com/test-key.txt',
          },
        },
      ],
    })) as { result: { success: boolean; submitted: number } };

    expect(result.success).toBe(true);
    expect(result.submitted).toBe(1);
    expect(mockFetchWithRetryAndTimeout).toHaveBeenCalled();
  });
});

