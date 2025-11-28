import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { CircuitBreaker } from './circuit-breaker.ts';

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;
  let mockFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    circuitBreaker = new CircuitBreaker({
      failureThreshold: 3,
      resetTimeout: 5000,
      halfOpenMaxAttempts: 1,
    });
    mockFn = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('CLOSED state (normal operation)', () => {
    it('allows requests to pass through when circuit is closed', async () => {
      mockFn.mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('increments failure count on error', async () => {
      mockFn.mockRejectedValue(new Error('failure'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getFailureCount()).toBe(1);
    });

    it('opens circuit after reaching failure threshold', async () => {
      mockFn.mockRejectedValue(new Error('failure'));

      // Trigger 3 failures (threshold)
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');

      expect(circuitBreaker.getState()).toBe('OPEN');
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('resets failure count on successful execution', async () => {
      mockFn.mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValue('success');

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      expect(circuitBreaker.getFailureCount()).toBe(1);

      await circuitBreaker.execute(mockFn);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('OPEN state (circuit tripped)', () => {
    beforeEach(async () => {
      mockFn.mockRejectedValue(new Error('failure'));
      // Trip the circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('rejects all requests immediately when circuit is open', async () => {
      mockFn.mockResolvedValue('success'); // Would succeed, but circuit is open

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
      
      // Function should not be called
      expect(mockFn).toHaveBeenCalledTimes(3); // Only the initial 3 calls
    });

    it('transitions to HALF_OPEN after reset timeout', async () => {
      expect(circuitBreaker.getState()).toBe('OPEN');

      // Fast-forward time by reset timeout
      vi.advanceTimersByTime(5000);

      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
    });

    it('does not allow requests before reset timeout expires', async () => {
      vi.advanceTimersByTime(4000); // Not enough time
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('Circuit breaker is OPEN');
      expect(circuitBreaker.getState()).toBe('OPEN');
    });
  });

  describe('HALF_OPEN state (testing recovery)', () => {
    beforeEach(async () => {
      mockFn.mockRejectedValue(new Error('failure'));
      // Trip the circuit
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('failure');
      
      // Advance time to enter HALF_OPEN state
      vi.advanceTimersByTime(5000);
      expect(circuitBreaker.getState()).toBe('HALF_OPEN');
      vi.clearAllMocks();
    });

    it('allows limited requests in HALF_OPEN state', async () => {
      mockFn.mockResolvedValue('success');

      const result = await circuitBreaker.execute(mockFn);

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledOnce();
    });

    it('transitions to CLOSED on successful request in HALF_OPEN', async () => {
      mockFn.mockResolvedValue('success');

      await circuitBreaker.execute(mockFn);

      expect(circuitBreaker.getState()).toBe('CLOSED');
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });

    it('transitions back to OPEN on failure in HALF_OPEN', async () => {
      mockFn.mockRejectedValue(new Error('still failing'));

      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow('still failing');

      expect(circuitBreaker.getState()).toBe('OPEN');
    });

    it('limits concurrent requests in HALF_OPEN state', async () => {
      const slowFn = vi.fn(() => new Promise(resolve => setTimeout(() => resolve('success'), 1000)));
      
      // First request is allowed
      const promise1 = circuitBreaker.execute(slowFn);
      
      // Second request should be rejected (exceeds halfOpenMaxAttempts)
      await expect(circuitBreaker.execute(slowFn)).rejects.toThrow('Circuit breaker is HALF_OPEN');
      
      await promise1; // Wait for first request to complete
    });
  });

  describe('edge cases', () => {
    it('handles custom failure threshold', () => {
      const cb = new CircuitBreaker({ failureThreshold: 5, resetTimeout: 1000 });
      expect(cb.getState()).toBe('CLOSED');
    });

    it('handles custom reset timeout', async () => {
      const cb = new CircuitBreaker({ failureThreshold: 2, resetTimeout: 10000 });
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      
      await expect(cb.execute(fn)).rejects.toThrow('fail');
      await expect(cb.execute(fn)).rejects.toThrow('fail');
      expect(cb.getState()).toBe('OPEN');
      
      vi.advanceTimersByTime(9999);
      expect(cb.getState()).toBe('OPEN');
      
      vi.advanceTimersByTime(1);
      expect(cb.getState()).toBe('HALF_OPEN');
    });

    it('handles immediate success after opening', async () => {
      const fn = vi.fn();
      fn.mockRejectedValue(new Error('fail'));
      
      // Trip circuit
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('fail');
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('fail');
      await expect(circuitBreaker.execute(fn)).rejects.toThrow('fail');
      expect(circuitBreaker.getState()).toBe('OPEN');
      
      // Enter HALF_OPEN
      vi.advanceTimersByTime(5000);
      
      // Succeed immediately
      fn.mockResolvedValue('recovered');
      await circuitBreaker.execute(fn);
      
      expect(circuitBreaker.getState()).toBe('CLOSED');
    });
  });

  describe('metrics and observability', () => {
    it('tracks total requests', async () => {
      mockFn.mockResolvedValue('success');
      
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getMetrics().totalRequests).toBe(3);
    });

    it('tracks successful requests', async () => {
      mockFn.mockResolvedValue('success');
      
      await circuitBreaker.execute(mockFn);
      await circuitBreaker.execute(mockFn);
      
      expect(circuitBreaker.getMetrics().successfulRequests).toBe(2);
    });

    it('tracks failed requests', async () => {
      mockFn.mockRejectedValue(new Error('fail'));
      
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      await expect(circuitBreaker.execute(mockFn)).rejects.toThrow();
      
      expect(circuitBreaker.getMetrics().failedRequests).toBe(2);
    });
  });
});