import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchCached } from './fetch-cached.ts';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';

// Mock dependencies
vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn) => fn),
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock('../supabase/server-anon.ts', () => ({
  createSupabaseAnonClient: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

vi.mock('../supabase/server.ts', () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

vi.mock('../cache-config.ts', () => ({
  getCacheTtl: vi.fn(() => 300), // 5 minutes default
}));

vi.mock('../logger.ts', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  toLogContextValue: vi.fn((v) => v),
}));

vi.mock('../errors.ts', () => ({
  normalizeError: vi.fn((error, message) => 
    error instanceof Error ? error : new Error(message || String(error))
  ),
}));

// Override @heyclaude/shared-runtime mock from vitest.setup.ts
// withTimeout needs to work with fake timers for this test file
vi.mock('@heyclaude/shared-runtime', async (importOriginal) => {
  // Get base mock from vitest.setup.ts
  const baseMock = await vi.importMock<typeof import('@heyclaude/shared-runtime')>('@heyclaude/shared-runtime');
  
  class TimeoutError extends Error {
    constructor(message: string, public readonly timeoutMs: number) {
      super(message);
      this.name = 'TimeoutError';
    }
  }
  
  // Create withTimeout that works with fake timers
  const withTimeoutImpl = <T>(promise: Promise<T>, timeoutMs: number, errorMessage?: string): Promise<T> => {
    if (timeoutMs <= 0) {
      return Promise.reject(new TimeoutError(
        errorMessage ?? `Operation timed out after ${timeoutMs}ms`,
        timeoutMs
      ));
    }
    
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          reject(new TimeoutError(
            errorMessage ?? `Operation timed out after ${timeoutMs}ms`,
            timeoutMs
          ));
        }, timeoutMs);
      }),
    ]);
  };
  
  // Wrap in a spy so we can track calls
  const withTimeoutSpy = vi.fn(withTimeoutImpl);
  
  return {
    ...baseMock,
    withTimeout: withTimeoutSpy,
    TimeoutError,
  };
});

vi.mock('../utils/request-id.ts', () => ({
  generateRequestId: vi.fn(() => 'test-request-id'),
}));

describe('fetchCached', () => {
  let mockClient: SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      rpc: vi.fn(),
      from: vi.fn(),
    } as unknown as SupabaseClient<Database>;
  });

  describe('successful caching', () => {
    it('should fetch and cache data successfully', async () => {
      const mockData = { id: '123', name: 'Test' };
      const serviceCall = vi.fn(async () => mockData);

      const result = await fetchCached(serviceCall, {
        keyParts: ['content', '123'],
        tags: ['content'],
        ttlKey: 'content',
        fallback: null,
      });

      expect(serviceCall).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it('should filter null/undefined from keyParts', async () => {
      const { unstable_cache } = await import('next/cache');
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['content', null, undefined, '123'],
        tags: ['content'],
        ttlKey: 'content',
        fallback: null,
      });

      // Check that unstable_cache was called with filtered keyParts
      const cacheCall = vi.mocked(unstable_cache).mock.calls[0];
      expect(cacheCall[1]).toEqual(['content', '123']);
    });

    it('should use anon client by default', async () => {
      const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
        useAuth: false,
      });

      expect(createSupabaseAnonClient).toHaveBeenCalled();
    });

    it('should use auth client when useAuth is true', async () => {
      const { createSupabaseServerClient } = await import('../supabase/server.ts');
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
        useAuth: true,
      });

      expect(createSupabaseServerClient).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should return fallback on service call failure', async () => {
      const serviceCall = vi.fn(async () => {
        throw new Error('Service failed');
      });

      const fallback = { error: 'fallback data' };
      const result = await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback,
      });

      expect(result).toEqual(fallback);
    });

    it('should log errors with request context', async () => {
      const { logger } = await import('../logger.ts');
      const serviceCall = vi.fn(async () => {
        throw new Error('Test error');
      });

      await fetchCached(serviceCall, {
        keyParts: ['content', '123'],
        tags: ['content'],
        ttlKey: 'content',
        fallback: null,
        logMeta: { source: 'test' },
      });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Service call failed'),
        expect.any(Error),
        expect.objectContaining({
          key: 'content-123',
          requestId: 'test-request-id',
          source: 'test',
        })
      );
    });

    it('should normalize errors before logging', async () => {
      const { normalizeError } = await import('../errors.ts');
      const serviceCall = vi.fn(async () => {
        throw 'String error';
      });

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      expect(normalizeError).toHaveBeenCalled();
    });
  });

  describe('timeout handling', () => {
    it('should apply timeout to service calls', async () => {
      const { withTimeout } = await import('@heyclaude/shared-runtime');
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
        timeoutMs: 5000,
      });

      // withTimeout is a spy, so we can check it was called
      expect(vi.mocked(withTimeout)).toHaveBeenCalledWith(
        expect.any(Promise),
        5000,
        expect.stringContaining('timed out')
      );
    });

    it('should return fallback on timeout', async () => {
      const { TimeoutError } = await import('@heyclaude/shared-runtime');
      const { withTimeout } = await import('@heyclaude/shared-runtime');
      
      // Make withTimeout reject with TimeoutError for this test
      vi.mocked(withTimeout).mockImplementation(() => {
        return Promise.reject(new TimeoutError('Timeout', 1000));
      });
      
      const serviceCall = vi.fn(async () => ({ data: 'test' }));
      const fallback = { error: 'timeout fallback' };

      const result = await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback,
        timeoutMs: 1000,
      });

      expect(result).toEqual(fallback);
    });

    it('should log timeout warnings', async () => {
      const { TimeoutError } = await import('@heyclaude/shared-runtime');
      const { withTimeout } = await import('@heyclaude/shared-runtime');
      const { logger } = await import('../logger.ts');
      
      // Make withTimeout reject with TimeoutError for this test
      vi.mocked(withTimeout).mockImplementation(() => {
        return Promise.reject(new TimeoutError('Timeout', 100));
      });
      
      const serviceCall = vi.fn();

      await fetchCached(serviceCall, {
        keyParts: ['slow-query'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
        timeoutMs: 100,
      });

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('timed out'),
        expect.objectContaining({
          key: 'slow-query',
          timeoutMs: 100,
        })
      );
    });
  });

  describe('performance logging', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should log slow queries as warnings', async () => {
      const { logger } = await import('../logger.ts');
      // Mock performance.now to simulate slow query (>1000ms)
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = vi.fn(() => {
        callCount++;
        // First call: start time (when fetchCached starts)
        if (callCount === 1) return 1000;
        // Second call: after 1001ms (slow query - when promise resolves)
        return 1000 + 1001;
      });

      // Create a service call that resolves after 1001ms
      const serviceCall = vi.fn(async () => {
        return new Promise<{ data: string }>((resolve) => {
          setTimeout(() => resolve({ data: 'test' }), 1001);
        });
      });

      const promise = fetchCached(serviceCall, {
        keyParts: ['slow-query'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
        timeoutMs: 5000, // Use a longer timeout so the query completes
      });

      // Advance timers by exactly 1001ms to complete the service call
      // Use advanceTimersByTimeAsync to ensure promises resolve
      await vi.advanceTimersByTimeAsync(1001);
      
      // Wait for the promise to resolve
      await promise;

      // Restore performance.now
      performance.now = originalNow;

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Slow data fetch'),
        expect.objectContaining({
          key: 'slow-query',
          cacheHit: false,
        })
      );
    });

    it('should log fast queries at info level', async () => {
      const { logger } = await import('../logger.ts');
      // Mock performance.now to simulate fast query (<1000ms)
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = vi.fn(() => {
        callCount++;
        // First call: start time
        if (callCount === 1) return 1000;
        // Second call: after 100ms (fast query)
        return 1000 + 100;
      });

      // Service call resolves immediately (synchronously)
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['fast-query'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      // Advance timers to ensure any async operations complete
      await vi.advanceTimersByTimeAsync(1);

      // Restore performance.now
      performance.now = originalNow;

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Data fetch completed'),
        expect.objectContaining({
          key: 'fast-query',
          cacheHit: false,
        })
      );
    });

    it('should include duration in logs', async () => {
      const { logger } = await import('../logger.ts');
      // Mock performance.now to ensure duration is logged
      const originalNow = performance.now;
      let callCount = 0;
      performance.now = vi.fn(() => {
        callCount++;
        // First call: start time
        if (callCount === 1) return 1000;
        // Second call: after 50ms (fast query)
        return 1000 + 50;
      });

      // Service call resolves immediately (synchronously)
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      // Advance timers to ensure any async operations complete
      await vi.advanceTimersByTimeAsync(1);

      // Restore performance.now
      performance.now = originalNow;

      // Verify logger.info was called
      expect(logger.info).toHaveBeenCalled();
      const logCall = vi.mocked(logger.info).mock.calls[0];
      expect(logCall).toBeDefined();
      expect(logCall[1]).toHaveProperty('duration');
      expect(typeof logCall[1].duration).toBe('number');
    });
  });

  describe('cache configuration', () => {
    it('should apply correct TTL from config', async () => {
      const { unstable_cache } = await import('next/cache');
      const { getCacheTtl } = await import('../cache-config.ts');
      
      vi.mocked(getCacheTtl).mockReturnValue(600);
      
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'trending',
        fallback: null,
      });

      expect(getCacheTtl).toHaveBeenCalledWith('trending');
      
      const cacheCall = vi.mocked(unstable_cache).mock.calls[0];
      expect(cacheCall[2]).toEqual({
        revalidate: 600,
        tags: ['test'],
      });
    });

    it('should pass tags to cache', async () => {
      const { unstable_cache } = await import('next/cache');
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['tag1', 'tag2', 'tag3'],
        ttlKey: 'content',
        fallback: null,
      });

      const cacheCall = vi.mocked(unstable_cache).mock.calls[0];
      expect(cacheCall[2].tags).toEqual(['tag1', 'tag2', 'tag3']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty keyParts array', async () => {
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      // Note: Empty keyParts creates an empty cache key, which Next.js unstable_cache
      // might not handle well. The service call should still execute though.
      // We'll verify the service is called, but the result might be from cache (which could be null)
      await fetchCached(serviceCall, {
        keyParts: [],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      // Service should be called (even if cache key is empty)
      // Note: With empty keyParts, Next.js might cache with empty key, so result might vary
      expect(serviceCall).toHaveBeenCalled();
    });

    it('should handle keyParts with special characters', async () => {
      const serviceCall = vi.fn(async () => ({ data: 'test' }));

      await fetchCached(serviceCall, {
        keyParts: ['user/123', 'category:test', 'tag#special'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      expect(serviceCall).toHaveBeenCalled();
    });

    it('should handle null fallback', async () => {
      const serviceCall = vi.fn(async () => {
        throw new Error('Failed');
      });

      const result = await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback: null,
      });

      expect(result).toBeNull();
    });

    it('should handle complex object fallback', async () => {
      const serviceCall = vi.fn(async () => {
        throw new Error('Failed');
      });

      const fallback = {
        items: [],
        total: 0,
        error: 'Service unavailable',
      };

      const result = await fetchCached(serviceCall, {
        keyParts: ['test'],
        tags: ['test'],
        ttlKey: 'content',
        fallback,
      });

      expect(result).toEqual(fallback);
    });
  });
});