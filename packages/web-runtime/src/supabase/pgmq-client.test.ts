/**
 * PGMQ Client Tests
 *
 * Tests for pgmq-client.ts functions (pgmqSend, pgmqRead, pgmqDelete, pgmqDeleteBatch)
 * and provides test utilities (TestPgmqQueue) for use in other test files.
 *
 * @module web-runtime/supabase/pgmq-client.test
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Use jest.requireActual to get real functions even if mocked by other test files
const pgmqClientModule = jest.requireActual('./pgmq-client') as typeof import('./pgmq-client');
const { pgmqSend, pgmqRead, pgmqDelete, pgmqDeleteBatch } = pgmqClientModule;
import type { PgmqMessage } from './pgmq-client';

// Mock logger
jest.mock('../logging/server', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

// Mock normalizeError
jest.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: jest.fn((error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  }),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// ============================================================================
// TEST UTILITIES (Exported for reuse in other test files)
// ============================================================================

/**
 * In-memory message storage for test queues
 */
interface QueuedMessage<T = Record<string, unknown>> {
  msg_id: bigint;
  read_ct: number;
  enqueued_at: Date;
  vt: Date; // Visibility timeout
  message: T;
}

/**
 * Test PGMQ Queue Implementation
 *
 * Provides an in-memory queue that simulates PGMQ behavior:
 * - Messages are stored in memory keyed by queue name
 * - Visibility timeout prevents re-reading messages until timeout expires
 * - Read count tracks how many times a message has been read
 * - Delete removes messages from the queue
 *
 * This can be used in action tests and Inngest function tests to test the full flow:
 * action → enqueue → Inngest function processes.
 */
export class TestPgmqQueue {
  private queues: Map<string, QueuedMessage[]> = new Map();
  private msgIdCounter = 0n;

  /**
   * Send a message to a queue
   * Simulates pgmq_public.send()
   */
  async send<T extends Record<string, unknown> = Record<string, unknown>>(
    queueName: string,
    msg: T,
    options?: { sleepSeconds?: number }
  ): Promise<{ msg_id: bigint } | null> {
    const queue = this.getOrCreateQueue(queueName);

    const msgId = ++this.msgIdCounter;
    const now = new Date();

    queue.push({
      msg_id: msgId,
      read_ct: 0,
      enqueued_at: now,
      vt: now, // Initially visible (no timeout)
      message: msg as Record<string, unknown>,
    });

    return { msg_id: msgId };
  }

  /**
   * Read messages from a queue
   * Simulates pgmq_public.read()
   * Only returns messages that are visible (vt has expired)
   */
  async read<T = Record<string, unknown>>(
    queueName: string,
    options?: { vt?: number; qty?: number }
  ): Promise<PgmqMessage<T>[] | null> {
    const queue = this.getOrCreateQueue(queueName);
    const now = new Date();
    const vtSeconds = options?.vt ?? 30;
    const qty = options?.qty ?? 10;

    // Filter messages that are visible (vt has expired or not set)
    const visibleMessages = queue.filter((msg) => {
      const vtExpired = msg.vt <= now;
      return vtExpired;
    });

    if (visibleMessages.length === 0) {
      return null;
    }

    // Take up to qty messages
    const messagesToRead = visibleMessages.slice(0, qty);

    // Update messages: increment read_ct, set new visibility timeout
    const result: PgmqMessage<T>[] = messagesToRead.map((msg) => {
      msg.read_ct++;
      msg.vt = new Date(now.getTime() + vtSeconds * 1000); // Set visibility timeout

      return {
        msg_id: msg.msg_id,
        read_ct: msg.read_ct,
        enqueued_at: msg.enqueued_at.toISOString(),
        vt: msg.vt.toISOString(),
        message: msg.message as T,
      };
    });

    return result.length > 0 ? result : null;
  }

  /**
   * Delete a message from a queue
   * Simulates pgmq_public.delete()
   */
  async delete(queueName: string, msgId: bigint): Promise<boolean | null> {
    const queue = this.getOrCreateQueue(queueName);
    const index = queue.findIndex((msg) => msg.msg_id === msgId);

    if (index === -1) {
      return false; // Message not found
    }

    queue.splice(index, 1);
    return true;
  }

  /**
   * Delete multiple messages from a queue
   * Simulates batch delete
   */
  async deleteBatch(queueName: string, msgIds: bigint[]): Promise<number> {
    let deleted = 0;

    for (const msgId of msgIds) {
      const result = await this.delete(queueName, msgId);
      if (result === true) {
        deleted++;
      }
    }

    return deleted;
  }

  /**
   * Get all messages in a queue (for testing/debugging)
   */
  getAllMessages<T = Record<string, unknown>>(queueName: string): QueuedMessage<T>[] {
    const queue = this.getOrCreateQueue(queueName);
    return queue as QueuedMessage<T>[];
  }

  /**
   * Clear all messages from a queue
   */
  clearQueue(queueName: string): void {
    this.queues.delete(queueName);
  }

  /**
   * Clear all queues
   */
  clearAllQueues(): void {
    this.queues.clear();
    this.msgIdCounter = 0n;
  }

  /**
   * Get queue size
   */
  getQueueSize(queueName: string): number {
    const queue = this.getOrCreateQueue(queueName);
    return queue.length;
  }

  /**
   * Get or create a queue
   */
  private getOrCreateQueue(queueName: string): QueuedMessage[] {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    return this.queues.get(queueName)!;
  }
}

/**
 * Global test queue instance
 * Shared across all tests in the same process
 * Use globalThis to avoid hoisting/temporal dead zone issues with jest.mock()
 */

/**
 * Internal function to get or create the global test queue
 * This avoids hoisting issues with jest.mock()
 * Uses string literal directly to avoid constant hoisting issues
 */
function getGlobalTestQueue(): TestPgmqQueue {
  const key = '__testPgmqQueue';
  if (!(globalThis as any)[key]) {
    (globalThis as any)[key] = new TestPgmqQueue();
  }
  return (globalThis as any)[key];
}

/**
 * Create or get the global test queue instance
 *
 * @example
 * ```typescript
 * import { createTestPgmqQueue } from '../supabase/pgmq-client.test';
 *
 * const testQueue = createTestPgmqQueue();
 * // Use testQueue in your tests
 * ```
 */
export function createTestPgmqQueue(): TestPgmqQueue {
  return getGlobalTestQueue();
}

/**
 * Reset the global test queue (clears all queues)
 * Should be called in beforeEach hooks
 */
export function resetTestPgmqQueue(): void {
  const queue = (globalThis as any)['__testPgmqQueue'];
  if (queue) {
    queue.clearAllQueues();
  }
}

/**
 * Get the current global test queue instance
 */
export function getTestPgmqQueue(): TestPgmqQueue | null {
  return (globalThis as any)['__testPgmqQueue'] || null;
}

/**
 * Mock implementations for pgmqSend, pgmqRead, pgmqDelete
 * These can be used in jest.mock() to replace the real implementations
 *
 * @example
 * ```typescript
 * const testQueue = createTestPgmqQueue();
 * const mocks = createPgmqMocks(testQueue);
 *
 * jest.mock('../supabase/pgmq-client', () => mocks);
 * ```
 */
export function createPgmqMocks(testQueue: TestPgmqQueue) {
  const mockPgmqSend = jest.fn(
    async (
      queueName: string,
      msg: Record<string, unknown>,
      options?: { sleepSeconds?: number }
    ) => {
      return await testQueue.send(queueName, msg, options);
    }
  );

  const mockPgmqRead = jest.fn(
    async <T = Record<string, unknown>>(
      queueName: string,
      options?: { vt?: number; qty?: number }
    ) => {
      return await testQueue.read<T>(queueName, options);
    }
  );

  const mockPgmqDelete = jest.fn(async (queueName: string, msgId: bigint) => {
    return await testQueue.delete(queueName, msgId);
  });

  const mockPgmqDeleteBatch = jest.fn(async (queueName: string, msgIds: bigint[]) => {
    return await testQueue.deleteBatch(queueName, msgIds);
  });

  return {
    pgmqSend: mockPgmqSend,
    pgmqRead: mockPgmqRead,
    pgmqDelete: mockPgmqDelete,
    pgmqDeleteBatch: mockPgmqDeleteBatch,
    __mockPgmqSend: mockPgmqSend,
    __mockPgmqRead: mockPgmqRead,
    __mockPgmqDelete: mockPgmqDelete,
    __mockPgmqDeleteBatch: mockPgmqDeleteBatch,
  };
}

// ============================================================================
// UNIT TESTS FOR pgmq-client.ts
// ============================================================================

describe('pgmq-client', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<unknown[]>>().mockResolvedValue([]);
  });

  describe('pgmqSend', () => {
    it('should send a message to the queue successfully', async () => {
      const mockResult = [{ msg_id: BigInt(123) }];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await pgmqSend('test-queue', { key: 'value' });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT * FROM pgmq_public.send($1, $2, $3)',
        'test-queue',
        JSON.stringify({ key: 'value' }),
        0
      );
      expect(result).toEqual({ msg_id: BigInt(123) });
    });

    it('should send a message with sleepSeconds option', async () => {
      const mockResult = [{ msg_id: BigInt(456) }];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockResult);

      const result = await pgmqSend('test-queue', { key: 'value' }, { sleepSeconds: 5 });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT * FROM pgmq_public.send($1, $2, $3)',
        'test-queue',
        JSON.stringify({ key: 'value' }),
        5
      );
      expect(result).toEqual({ msg_id: BigInt(456) });
    });

    it('should return null when result is empty array', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      const result = await pgmqSend('test-queue', { key: 'value' });

      expect(result).toBeNull();
    });

    it('should return null when result is null', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const result = await pgmqSend('test-queue', { key: 'value' });

      expect(result).toBeNull();
    });

    it('should handle errors and throw normalized error', async () => {
      const dbError = new Error('Database connection failed');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(dbError);

      // normalizeError returns the original error if it's already an Error
      // The error message will be the original error message
      await expect(pgmqSend('test-queue', { key: 'value' })).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('pgmqRead', () => {
    it('should read messages from the queue successfully', async () => {
      const mockMessages = [
        {
          msg_id: BigInt(1),
          read_ct: 0,
          enqueued_at: '2024-01-01T00:00:00.000Z',
          vt: '2024-01-01T00:00:00.000Z',
          message: { key: 'value1' },
        },
        {
          msg_id: BigInt(2),
          read_ct: 0,
          enqueued_at: '2024-01-01T00:00:01.000Z',
          vt: '2024-01-01T00:00:01.000Z',
          message: { key: 'value2' },
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockMessages);

      const result = await pgmqRead('test-queue');

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT * FROM pgmq_public.read($1, $2, $3)',
        'test-queue',
        30, // Default vt
        10 // Default qty
      );
      expect(result).toHaveLength(2);
      expect(result?.[0]?.message).toEqual({ key: 'value1' });
      expect(result?.[1]?.message).toEqual({ key: 'value2' });
    });

    it('should read messages with custom options', async () => {
      const mockMessages = [
        {
          msg_id: BigInt(1),
          read_ct: 0,
          enqueued_at: '2024-01-01T00:00:00.000Z',
          vt: '2024-01-01T00:00:00.000Z',
          message: { key: 'value' },
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockMessages);

      const result = await pgmqRead('test-queue', { vt: 120, qty: 100 });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT * FROM pgmq_public.read($1, $2, $3)',
        'test-queue',
        120, // Custom vt
        100 // Custom qty
      );
      expect(result).toHaveLength(1);
    });

    it('should return null when queue is empty', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      const result = await pgmqRead('test-queue');

      expect(result).toBeNull();
    });

    it('should return null when result is null', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const result = await pgmqRead('test-queue');

      expect(result).toBeNull();
    });

    it('should handle typed messages', async () => {
      interface TestMessage {
        userId: string;
        action: string;
      }

      const mockMessages = [
        {
          msg_id: BigInt(1),
          read_ct: 0,
          enqueued_at: '2024-01-01T00:00:00.000Z',
          vt: '2024-01-01T00:00:00.000Z',
          message: { userId: 'user-123', action: 'click' },
        },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockMessages);

      const result = await pgmqRead<TestMessage>('test-queue');

      expect(result).toHaveLength(1);
      expect(result?.[0]?.message.userId).toBe('user-123');
      expect(result?.[0]?.message.action).toBe('click');
    });

    it('should handle errors and throw normalized error', async () => {
      const dbError = new Error('Database connection failed');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(dbError);

      // normalizeError returns the original error if it's already an Error
      // The error message will be the original error message
      await expect(pgmqRead('test-queue')).rejects.toThrow('Database connection failed');
    });
  });

  describe('pgmqDelete', () => {
    it('should delete a message successfully', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([true]);

      const result = await pgmqDelete('test-queue', BigInt(123));

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        'SELECT * FROM pgmq_public.delete($1, $2)',
        'test-queue',
        BigInt(123)
      );
      expect(result).toBe(true);
    });

    it('should return false when message not found', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([false]);

      const result = await pgmqDelete('test-queue', BigInt(999));

      expect(result).toBe(false);
    });

    it('should return null when result is empty array', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      const result = await pgmqDelete('test-queue', BigInt(123));

      expect(result).toBeNull();
    });

    it('should return null when result is null', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(null);

      const result = await pgmqDelete('test-queue', BigInt(123));

      expect(result).toBeNull();
    });

    it('should handle errors and throw normalized error', async () => {
      const dbError = new Error('Database connection failed');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(dbError);

      // normalizeError returns the original error if it's already an Error
      // The error message will be the original error message
      await expect(pgmqDelete('test-queue', BigInt(123))).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('pgmqDeleteBatch', () => {
    it('should delete multiple messages successfully', async () => {
      // Mock pgmqDelete to succeed for all messages
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>)
        .mockResolvedValueOnce([true]) // First delete
        .mockResolvedValueOnce([true]) // Second delete
        .mockResolvedValueOnce([true]); // Third delete

      const result = await pgmqDeleteBatch('test-queue', [BigInt(1), BigInt(2), BigInt(3)]);

      expect(result).toBe(3);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures', async () => {
      // Mock pgmqDelete to succeed for some, fail for others
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>)
        .mockResolvedValueOnce([true]) // First delete succeeds
        .mockResolvedValueOnce([false]) // Second delete fails (not found)
        .mockResolvedValueOnce([true]); // Third delete succeeds

      const result = await pgmqDeleteBatch('test-queue', [BigInt(1), BigInt(2), BigInt(3)]);

      expect(result).toBe(2); // Only 2 deleted successfully
    });

    it('should process messages in chunks of 10', async () => {
      const msgIds = Array.from({ length: 25 }, (_, i) => BigInt(i + 1));

      // Mock 25 successful deletes
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([true]);

      const result = await pgmqDeleteBatch('test-queue', msgIds);

      expect(result).toBe(25);
      // Should be called 25 times (one per message, processed in chunks of 10)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(25);
    });

    it('should handle errors gracefully', async () => {
      // Mock first delete to succeed, second to throw error, third to succeed
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>)
        .mockResolvedValueOnce([true])
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce([true]);

      const result = await pgmqDeleteBatch('test-queue', [BigInt(1), BigInt(2), BigInt(3)]);

      // Should count only successful deletes (2 out of 3)
      expect(result).toBe(2);
    });

    it('should return 0 when all deletions fail', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([false]);

      const result = await pgmqDeleteBatch('test-queue', [BigInt(1), BigInt(2)]);

      expect(result).toBe(0);
    });

    it('should handle empty array', async () => {
      const result = await pgmqDeleteBatch('test-queue', []);

      expect(result).toBe(0);
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });
  });
});
