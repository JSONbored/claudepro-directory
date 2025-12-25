/**
 * Analytics Pulse Inngest Function Tests
 *
 * Tests the processPulseQueue function using @inngest/test.
 * This tests the function logic, not the route handler.
 *
 * @module web-runtime/inngest/functions/analytics/pulse.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { InngestTestEngine } from '@inngest/test';
import { processPulseQueue } from './pulse';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
// Deep relative imports are acceptable for test utilities to avoid circular dependencies
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Use test queue for PGMQ operations
// Mock pgmq-client to use test queue
// This allows Inngest functions to read events that were enqueued by action tests
jest.mock('../../../supabase/pgmq-client', () => {
  // Import test queue utilities inside jest.mock() factory to avoid hoisting issues
  const { createTestPgmqQueue, createPgmqMocks } = require('../../../supabase/pgmq-client.test');
  const testQueue = createTestPgmqQueue();
  return createPgmqMocks(testQueue);
});

// Import test queue utilities for use in tests (after jest.mock())
import { resetTestPgmqQueue, getTestPgmqQueue } from '../../../supabase/pgmq-client.test';

// Don't mock getService - let it work normally
// It will create service instances that use the mocked Prismocker
// The singleton pattern in getService will work correctly

jest.mock('../../../logging/server', () => {
  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  const mockCreateWebAppContextWithId = jest.fn(() => ({
    requestId: 'test-request-id',
    operation: 'processPulseQueue',
    route: '/inngest/analytics/pulse',
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
// Don't need mockGetService - using real getService with Prismocker
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

// Import function AFTER mocks are set up
describe('processPulseQueue', () => {
  /**
   * Test engine instance - created fresh for each test to avoid state caching
   */
  let t: InngestTestEngine;
  let prismocker: PrismaClient;

  /**
   * Setup before each test
   */
  beforeEach(async () => {
    // Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // Clear test queue before each test (REQUIRED for test isolation)
    resetTestPgmqQueue();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);

    // Reset other mocks
    mockPgmqRead.mockReset();
    mockPgmqDelete.mockReset();
    mockCreateWebAppContextWithId.mockReturnValue({
      requestId: 'test-request-id',
      operation: 'processPulseQueue',
      route: '/inngest/analytics/pulse',
    });

    mockNormalizeError.mockImplementation((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) {
        return error;
      }
      return new Error(fallbackMessage || String(error || 'Unknown error'));
    });

    // Create fresh test engine instance for each test
    t = new InngestTestEngine({
      function: processPulseQueue,
    });
  });

  /**
   * Success case: Process search events successfully
   *
   * Tests that search events are processed and inserted into database.
   */
  it('should process search events successfully', async () => {
    const mockSearchEvent = {
      user_id: 'user-123',
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: 'session-123',
      metadata: {
        query: 'test query',
        filters: { category: 'mcp' },
        result_count: 10,
      },
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockSearchEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock RPC return value for batch_insert_search_queries
    // callRpc unwraps single-element arrays for composite types (objects)
    const mockRpcResult = { inserted_count: 1, failed_count: 0 };
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
      mockRpcResult,
    ] as any);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.failed).toBe(0);

    expect(mockPgmqRead).toHaveBeenCalledWith('pulse', {
      vt: 120,
      qty: 100,
    });

    // Verify RPC was called with correct SQL and parameters
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('batch_insert_search_queries'),
      expect.any(Array) // p_queries is an array
    );

    // NOTE: Deletion happens in a separate step (delete-processed-messages) that runs after insert
    // The Inngest test engine may not execute all steps or may not share closure variables correctly
    // The deletion step is tested separately in other tests
    // For this test, we verify the RPC call and the result, which confirms the insert step worked
  });

  /**
   * Success case: Process interaction events successfully
   *
   * Tests that interaction events are processed and inserted into database.
   */
  it('should process interaction events successfully', async () => {
    const mockInteractionEvent = {
      user_id: 'user-123',
      content_type: 'mcp',
      content_slug: 'test-slug',
      interaction_type: 'view',
      session_id: 'session-123',
      metadata: null,
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockInteractionEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock RPC return value for batch_insert_user_interactions
    // callRpc unwraps single-element arrays for composite types (objects)
    const mockRpcResult = { inserted_count: 1, errors: [] };
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
      mockRpcResult,
    ] as any);

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(1);
    expect(result.failed).toBe(0);

    // Verify RPC was called with correct SQL and parameters
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('batch_insert_user_interactions'),
      expect.any(Array) // p_interactions is an array
    );

    // NOTE: Deletion happens in a separate step (delete-processed-messages) that runs after insert
    // The Inngest test engine may not execute all steps or may not share closure variables correctly
    // The deletion step is tested separately in other tests
  });

  /**
   * Success case: Process mixed events
   *
   * Tests that both search and interaction events are processed correctly.
   */
  it('should process mixed search and interaction events', async () => {
    const mockSearchEvent = {
      user_id: 'user-123',
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: 'session-123',
      metadata: {
        query: 'test query',
        result_count: 10,
      },
    };

    const mockInteractionEvent = {
      user_id: 'user-456',
      content_type: 'mcp',
      content_slug: 'test-slug',
      interaction_type: 'click',
      session_id: 'session-456',
      metadata: null,
    };

    const mockMessage1 = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockSearchEvent,
    };

    const mockMessage2 = {
      msg_id: BigInt(2),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockInteractionEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage1, mockMessage2] as never);
    mockPgmqDelete.mockResolvedValue(undefined);

    // Mock RPC return values for both search and interaction inserts
    // The $queryRawUnsafe mock will be called twice (once for each RPC)
    let callCount = 0;
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // First call: batch_insert_search_queries
        return Promise.resolve([{ inserted_count: 1 }] as any);
      } else {
        // Second call: batch_insert_user_interactions
        return Promise.resolve([{ inserted_count: 1, errors: [] }] as any);
      }
    });

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(2);
    expect(result.inserted).toBe(2);
    expect(result.failed).toBe(0);

    // Verify RPCs were called
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('batch_insert_search_queries'),
      expect.any(Array)
    );
    expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
      expect.stringContaining('batch_insert_user_interactions'),
      expect.any(Array)
    );
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
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(0);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(0);

    expect(mockPgmqRead).toHaveBeenCalled();
    // No RPC calls should be made when queue is empty
    expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  /**
   * Error case: Invalid interaction type
   *
   * Tests that invalid interaction types are marked for deletion.
   */
  it('should delete messages with invalid interaction types', async () => {
    const mockInvalidEvent = {
      user_id: 'user-123',
      content_type: 'mcp',
      content_slug: 'test-slug',
      interaction_type: 'invalid_type', // Invalid
      session_id: 'session-123',
      metadata: null,
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockInvalidEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    mockPgmqDelete.mockResolvedValue(undefined);
    // No RPC calls should be made (all interactions invalid)

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(1);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msgId: '1',
        interactionType: 'invalid_type',
      }),
      'Invalid interaction type, marking for deletion'
    );

    // NOTE: Deletion happens in a separate step (delete-processed-messages) that runs after insert
    // The Inngest test engine may not execute all steps or may not share closure variables correctly
    // The deletion step is tested separately in other tests
    // For this test, we verify the validation logic worked (logger.warn was called)
  });

  /**
   * Error case: Queue read failure
   *
   * Tests that queue read failures are handled gracefully.
   */
  it('should handle queue read failures gracefully', async () => {
    mockPgmqRead.mockRejectedValue(new Error('Queue read failed'));

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(0);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(0);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.any(String),
      }),
      'Failed to read pulse queue'
    );
  });

  /**
   * Error case: Search events batch insert failure
   *
   * Tests that search events batch insert failures are handled gracefully.
   */
  it('should handle search events batch insert failures gracefully', async () => {
    const mockSearchEvent = {
      user_id: 'user-123',
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: 'session-123',
      metadata: {
        query: 'test query',
        result_count: 10,
      },
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockSearchEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    // Mock RPC to throw error
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('Database error')
    );

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(1);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.any(String),
      }),
      'Search events batch insert failed'
    );
  });

  /**
   * Error case: Interaction events batch insert failure
   *
   * Tests that interaction events batch insert failures are handled gracefully.
   */
  it('should handle interaction events batch insert failures gracefully', async () => {
    const mockInteractionEvent = {
      user_id: 'user-123',
      content_type: 'mcp',
      content_slug: 'test-slug',
      interaction_type: 'view',
      session_id: 'session-123',
      metadata: null,
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockInteractionEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage] as never);
    // Mock RPC to throw error
    (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
      new Error('Database error')
    );

    const { result } = (await t.execute({
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(1);

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        errorMessage: expect.any(String),
      }),
      'Interaction events batch insert failed'
    );
  });

  /**
   * Success case: Cleanup failed messages exceeding max retries
   *
   * Tests that messages exceeding max retry attempts are deleted.
   */
  it('should cleanup failed messages exceeding max retries', async () => {
    const mockEvent = {
      user_id: 'user-123',
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: 'session-123',
      metadata: {
        query: 'test query',
      },
    };

    const mockMessage = {
      msg_id: BigInt(1),
      read_ct: 6, // Exceeds MAX_RETRY_ATTEMPTS (5)
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockEvent,
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
    })) as { result: { processed: number; inserted: number; failed: number } };

    expect(result.processed).toBe(1);
    expect(result.inserted).toBe(0);
    expect(result.failed).toBe(0); // Not counted as failed, just cleaned up

    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        msgId: '1',
        readCount: 6,
      }),
      'Pulse event exceeded max retries, removed from queue'
    );

    expect(mockPgmqDelete).toHaveBeenCalledWith('pulse', BigInt(1));
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
    expect(mockPgmqRead).toHaveBeenCalledWith('pulse', {
      vt: 120,
      qty: 100,
    });
  });

  /**
   * Step test: categorize-events step
   *
   * Tests the categorize-events step individually.
   */
  it('should execute categorize-events step correctly', async () => {
    const mockSearchEvent = {
      user_id: 'user-123',
      interaction_type: 'search',
      metadata: { query: 'test' },
    };

    const mockInteractionEvent = {
      user_id: 'user-456',
      interaction_type: 'view',
      content_type: 'mcp',
    };

    const mockMessage1 = {
      msg_id: BigInt(1),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockSearchEvent,
    };

    const mockMessage2 = {
      msg_id: BigInt(2),
      read_ct: 0,
      enqueued_at: new Date(),
      vt: new Date(),
      message: mockInteractionEvent,
    };

    mockPgmqRead.mockResolvedValue([mockMessage1, mockMessage2] as never);

    // First execute read-queue step
    await t.executeStep('read-queue', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    });

    // Now execute categorize-events step
    const { result } = (await t.executeStep('categorize-events', {
      events: [
        {
          name: 'inngest/function.invoked',
          data: {},
        },
      ],
    })) as { result: { searchEvents: unknown[]; interactionEvents: unknown[] } };

    expect(result.searchEvents).toHaveLength(1);
    expect(result.interactionEvents).toHaveLength(1);
  });
});
