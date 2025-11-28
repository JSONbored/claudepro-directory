import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { withTimeout, TimeoutError, TIMEOUT_PRESETS } from './timeout.ts';

describe('TimeoutError', () => {
  it('should create TimeoutError with correct properties', () => {
    const error = new TimeoutError('Operation timed out', 5000);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('TimeoutError');
    expect(error.message).toBe('Operation timed out');
    expect(error.timeoutMs).toBe(5000);
  });

  it('should be instanceof TimeoutError', () => {
    const error = new TimeoutError('Timeout', 1000);
    expect(error instanceof TimeoutError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('successful operations', () => {
    it('should resolve when promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      
      const result = withTimeout(promise, 1000);
      
      await expect(result).resolves.toBe('success');
    });

    it('should resolve with complex data types', async () => {
      const data = { id: '123', items: [1, 2, 3], meta: { count: 3 } };
      const promise = Promise.resolve(data);
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toEqual(data);
    });

    it('should handle async function results', async () => {
      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'async result';
      };
      
      const promise = asyncFn();
      const resultPromise = withTimeout(promise, 1000);
      
      // Advance timers to complete the async function
      await vi.advanceTimersByTimeAsync(100);
      
      const result = await resultPromise;
      expect(result).toBe('async result');
    });
  });

  describe('timeout behavior', () => {
    it('should reject with TimeoutError when timeout exceeded', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = withTimeout(promise, 1000, 'Custom timeout message');
      
      // Advance past timeout
      vi.advanceTimersByTime(1001);
      
      await expect(result).rejects.toThrow(TimeoutError);
      await expect(result).rejects.toThrow('Custom timeout message');
    });

    it('should use default error message when not provided', async () => {
      // Create a promise that never resolves (to test timeout)
      const promise = new Promise(() => {
        // Never resolves
      });
      
      const result = withTimeout(promise, 5000);
      
      vi.advanceTimersByTime(5001);
      
      await expect(result).rejects.toThrow('Operation timed out after 5000ms');
    });

    it('should include timeoutMs in TimeoutError', async () => {
      // Create a promise that never resolves (to test timeout)
      const promise = new Promise(() => {
        // Never resolves
      });
      
      const result = withTimeout(promise, 3000);
      
      vi.advanceTimersByTime(3001);
      
      try {
        await result;
        expect.fail('Should have thrown TimeoutError');
      } catch (error) {
        expect(error).toBeInstanceOf(TimeoutError);
        expect((error as TimeoutError).timeoutMs).toBe(3000);
      }
    });

    it('should reject immediately with very small timeouts', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 1000));
      
      const result = withTimeout(promise, 1);
      
      vi.advanceTimersByTime(2);
      
      await expect(result).rejects.toThrow(TimeoutError);
    });
  });

  describe('promise rejection', () => {
    it('should propagate promise rejections before timeout', async () => {
      const error = new Error('Promise rejected');
      const promise = Promise.reject(error);
      
      await expect(withTimeout(promise, 1000)).rejects.toThrow('Promise rejected');
    });

    it('should propagate custom error types', async () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message);
          this.name = 'CustomError';
        }
      }
      
      const promise = Promise.reject(new CustomError('Custom error'));
      
      await expect(withTimeout(promise, 1000)).rejects.toThrow(CustomError);
    });

    it('should prefer promise rejection over timeout', async () => {
      const promise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Rejected')), 500);
      });
      
      const result = withTimeout(promise, 1000);
      
      // Advance to rejection time (before timeout)
      await vi.advanceTimersByTimeAsync(500);
      
      // The rejection should happen before timeout
      // Catch the rejection to verify it's the right error
      try {
        await result;
        expect.fail('Should have rejected');
      } catch (error) {
        expect(error).not.toBeInstanceOf(TimeoutError);
        expect((error as Error).message).toBe('Rejected');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle zero timeout', async () => {
      const promise = Promise.resolve('immediate');
      
      const result = withTimeout(promise, 0);
      
      // With 0 timeout, should reject immediately (no timer needed)
      await expect(result).rejects.toThrow(TimeoutError);
      await expect(result).rejects.toThrow('Operation timed out after 0ms');
    });

    it('should handle negative timeout gracefully', async () => {
      const promise = Promise.resolve('value');
      
      const result = withTimeout(promise, -100);
      
      // Negative timeout should reject immediately (no timer needed)
      await expect(result).rejects.toThrow(TimeoutError);
      await expect(result).rejects.toThrow('Operation timed out after -100ms');
    });

    it('should handle already resolved promises', async () => {
      const promise = Promise.resolve('already resolved');
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBe('already resolved');
    });

    it('should handle already rejected promises', async () => {
      const promise = Promise.reject(new Error('already rejected'));
      
      await expect(withTimeout(promise, 1000)).rejects.toThrow('already rejected');
    });

    it('should handle undefined return values', async () => {
      const promise = Promise.resolve(undefined);
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBeUndefined();
    });

    it('should handle null return values', async () => {
      const promise = Promise.resolve(null);
      
      const result = await withTimeout(promise, 1000);
      
      expect(result).toBeNull();
    });
  });

  describe('race conditions', () => {
    it('should only resolve/reject once', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('late'), 2000));
      
      const result = withTimeout(promise, 1000);
      
      vi.advanceTimersByTime(1001);
      
      await expect(result).rejects.toThrow(TimeoutError);
      
      // Advance past original promise resolution
      vi.advanceTimersByTime(1000);
      
      // Should still be rejected with timeout (not resolved with 'late')
      await expect(result).rejects.toThrow(TimeoutError);
    });

    it('should handle multiple concurrent timeouts', async () => {
      const promise1 = new Promise(resolve => setTimeout(() => resolve('p1'), 500));
      const promise2 = new Promise(resolve => setTimeout(() => resolve('p2'), 1500));
      
      const result1 = withTimeout(promise1, 1000);
      const result2 = withTimeout(promise2, 1000);
      
      await vi.advanceTimersByTimeAsync(500);
      await expect(result1).resolves.toBe('p1');
      
      await vi.advanceTimersByTimeAsync(501);
      await expect(result2).rejects.toThrow(TimeoutError);
      
      // Ensure all promises are handled
      try {
        await result2;
      } catch {
        // Expected timeout rejection
      }
    });
  });
});

describe('TIMEOUT_PRESETS', () => {
  it('should have expected timeout values', () => {
    expect(TIMEOUT_PRESETS.rpc).toBe(30000); // 30 seconds
    expect(TIMEOUT_PRESETS.external).toBe(10000); // 10 seconds
    expect(TIMEOUT_PRESETS.storage).toBe(15000); // 15 seconds
  });

  it('should be readonly', () => {
    expect(() => {
      // @ts-expect-error - Testing runtime immutability
      TIMEOUT_PRESETS.rpc = 5000;
    }).toThrow();
  });

  it('should be usable with withTimeout', async () => {
    const promise = Promise.resolve('test');
    
    const result = await withTimeout(promise, TIMEOUT_PRESETS.external);
    
    expect(result).toBe('test');
  });
});

describe('real-world scenarios', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('should timeout actual slow operations', async () => {
    const slowOperation = new Promise(resolve => {
      setTimeout(() => resolve('slow'), 100);
    });
    
    await expect(withTimeout(slowOperation, 50)).rejects.toThrow(TimeoutError);
  }, 200);

  it('should complete fast operations before timeout', async () => {
    const fastOperation = new Promise(resolve => {
      setTimeout(() => resolve('fast'), 10);
    });
    
    const result = await withTimeout(fastOperation, 100);
    expect(result).toBe('fast');
  }, 200);
});