/**
 * Async Test Helpers
 *
 * Utilities for testing asynchronous operations, promises, and timing.
 * Provides type-safe helpers for common async testing scenarios.
 *
 * **Features:**
 * - Promise resolution/rejection testing
 * - Timeout and retry utilities
 * - Polling helpers
 * - Async state management
 * - Race condition testing
 *
 * @module tests/utils/async-helpers
 */

import { waitFor } from '@testing-library/react';

// =============================================================================
// Wait Utilities
// =============================================================================

/**
 * Wait for condition to be true with timeout
 *
 * Polls condition function until it returns true or timeout is reached.
 *
 * @param condition - Function that returns true when condition is met
 * @param options - Wait options
 * @returns Promise that resolves when condition is met
 *
 * @example
 * ```ts
 * await waitForCondition(() => data.loaded === true, { timeout: 5000 })
 * ```
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
    errorMessage?: string;
  } = {}
): Promise<void> {
  const {
    timeout = 5000,
    interval = 50,
    errorMessage = 'Condition not met within timeout',
  } = options;

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) {
      return;
    }
    await sleep(interval);
  }

  throw new Error(errorMessage);
}

/**
 * Wait for value to change from initial value
 *
 * @param getValue - Function that returns current value
 * @param initialValue - Initial value to wait to change from
 * @param options - Wait options
 * @returns Promise that resolves with new value
 *
 * @example
 * ```ts
 * const newValue = await waitForValueChange(() => store.counter, 0)
 * expect(newValue).toBe(1)
 * ```
 */
export async function waitForValueChange<T>(
  getValue: () => T,
  initialValue: T,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 50 } = options;

  await waitForCondition(() => getValue() !== initialValue, {
    timeout,
    interval,
    errorMessage: 'Value did not change within timeout',
  });

  return getValue();
}

/**
 * Wait for async function to succeed (no errors thrown)
 *
 * Retries function until it succeeds or timeout is reached.
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Promise that resolves with function result
 *
 * @example
 * ```ts
 * const result = await waitForSuccess(async () => {
 *   const data = await fetchData()
 *   if (!data) throw new Error('No data')
 *   return data
 * })
 * ```
 */
export async function waitForSuccess<T>(
  fn: () => Promise<T>,
  options: { timeout?: number; interval?: number } = {}
): Promise<T> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();
  let lastError: Error | undefined;

  while (Date.now() - startTime < timeout) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await sleep(interval);
    }
  }

  throw new Error(
    `Function did not succeed within timeout. Last error: ${lastError?.message || 'Unknown'}`
  );
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 *
 * @example
 * ```ts
 * await sleep(1000) // Wait 1 second
 * ```
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// =============================================================================
// Promise Testing Utilities
// =============================================================================

/**
 * Expect promise to resolve within timeout
 *
 * @param promise - Promise to test
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with result
 *
 * @example
 * ```ts
 * const result = await expectResolves(fetchData(), 1000)
 * expect(result).toBeDefined()
 * ```
 */
export async function expectResolves<T>(promise: Promise<T>, timeout = 5000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Promise did not resolve within ${timeout}ms`)), timeout);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Expect promise to reject within timeout
 *
 * @param promise - Promise to test
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with error
 *
 * @example
 * ```ts
 * const error = await expectRejects(fetchInvalidData())
 * expect(error.message).toContain('Invalid')
 * ```
 */
export async function expectRejects(promise: Promise<unknown>, timeout = 5000): Promise<Error> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`Promise did not reject within ${timeout}ms`)), timeout);
  });

  try {
    await Promise.race([promise, timeoutPromise]);
    throw new Error('Promise resolved when rejection was expected');
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Expect promise to reject with specific error message
 *
 * @param promise - Promise to test
 * @param expectedMessage - Expected error message (string or RegExp)
 *
 * @example
 * ```ts
 * await expectRejectsWithMessage(
 *   fetchData(),
 *   'Network error'
 * )
 * ```
 */
export async function expectRejectsWithMessage(
  promise: Promise<unknown>,
  expectedMessage: string | RegExp
): Promise<void> {
  const error = await expectRejects(promise);

  if (typeof expectedMessage === 'string') {
    expect(error.message).toContain(expectedMessage);
  } else {
    expect(error.message).toMatch(expectedMessage);
  }
}

/**
 * Expect promise to resolve with specific value
 *
 * @param promise - Promise to test
 * @param expectedValue - Expected resolved value
 *
 * @example
 * ```ts
 * await expectResolvesTo(fetchCount(), 5)
 * ```
 */
export async function expectResolvesTo<T>(promise: Promise<T>, expectedValue: T): Promise<void> {
  const result = await expectResolves(promise);
  expect(result).toEqual(expectedValue);
}

// =============================================================================
// Polling Utilities
// =============================================================================

/**
 * Poll function until it returns truthy value
 *
 * @param fn - Function to poll
 * @param options - Polling options
 * @returns Promise that resolves with result
 *
 * @example
 * ```ts
 * const data = await poll(() => store.getData(), { interval: 100 })
 * ```
 */
export async function poll<T>(
  fn: () => T | Promise<T>,
  options: { timeout?: number; interval?: number; condition?: (value: T) => boolean } = {}
): Promise<T> {
  const { timeout = 5000, interval = 100, condition = (value) => Boolean(value) } = options;
  const startTime = Date.now();
  let lastValue: T | undefined;

  while (Date.now() - startTime < timeout) {
    lastValue = await fn();
    if (condition(lastValue)) {
      return lastValue;
    }
    await sleep(interval);
  }

  throw new Error(`Polling timeout after ${timeout}ms. Last value: ${JSON.stringify(lastValue)}`);
}

/**
 * Poll until array has expected length
 *
 * @param getArray - Function that returns array
 * @param expectedLength - Expected array length
 * @param options - Polling options
 * @returns Promise that resolves with array
 *
 * @example
 * ```ts
 * const items = await pollUntilLength(() => store.items, 5)
 * expect(items).toHaveLength(5)
 * ```
 */
export async function pollUntilLength<T>(
  getArray: () => T[] | Promise<T[]>,
  expectedLength: number,
  options: { timeout?: number; interval?: number } = {}
): Promise<T[]> {
  return poll(getArray, {
    ...options,
    condition: (array) => array.length === expectedLength,
  });
}

// =============================================================================
// Debounce/Throttle Testing
// =============================================================================

/**
 * Wait for debounced function to execute
 *
 * Useful for testing debounced callbacks and effects.
 *
 * @param debounceDelay - Debounce delay in milliseconds
 * @param buffer - Additional buffer time in milliseconds
 *
 * @example
 * ```ts
 * // Function has 300ms debounce
 * triggerDebouncedFunction()
 * await waitForDebounce(300)
 * expect(mockCallback).toHaveBeenCalled()
 * ```
 */
export async function waitForDebounce(debounceDelay: number, buffer = 50): Promise<void> {
  await sleep(debounceDelay + buffer);
}

/**
 * Trigger multiple calls rapidly and wait for debounced result
 *
 * @param fn - Function to call
 * @param count - Number of times to call
 * @param debounceDelay - Expected debounce delay
 *
 * @example
 * ```ts
 * await triggerDebounced(() => updateSearch('query'), 5, 300)
 * // Only last call should execute after debounce
 * ```
 */
export async function triggerDebounced(
  fn: () => void,
  count: number,
  debounceDelay: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    fn();
    await sleep(10); // Small delay between calls
  }
  await waitForDebounce(debounceDelay);
}

// =============================================================================
// Race Condition Testing
// =============================================================================

/**
 * Run multiple promises concurrently and verify all succeed
 *
 * Useful for testing concurrent operations and race conditions.
 *
 * @param promises - Array of promises to run
 * @returns Promise that resolves with all results
 *
 * @example
 * ```ts
 * const results = await runConcurrently([
 *   fetchUser(),
 *   fetchPosts(),
 *   fetchComments()
 * ])
 * expect(results).toHaveLength(3)
 * ```
 */
export async function runConcurrently<T>(promises: Promise<T>[]): Promise<T[]> {
  return Promise.all(promises);
}

/**
 * Run multiple async functions with delays between them
 *
 * @param fns - Array of async functions
 * @param delayMs - Delay between executions in milliseconds
 * @returns Promise that resolves with all results
 *
 * @example
 * ```ts
 * await runWithDelay([
 *   () => updateState(1),
 *   () => updateState(2),
 *   () => updateState(3)
 * ], 100)
 * ```
 */
export async function runWithDelay<T>(fns: Array<() => Promise<T>>, delayMs: number): Promise<T[]> {
  const results: T[] = [];

  for (const fn of fns) {
    results.push(await fn());
    if (fns.indexOf(fn) < fns.length - 1) {
      await sleep(delayMs);
    }
  }

  return results;
}

// =============================================================================
// Testing Library Integration
// =============================================================================

/**
 * Wait for element using Testing Library's waitFor
 *
 * Re-export with type-safe wrapper.
 *
 * @param callback - Callback to wait for
 * @param options - waitFor options
 */
export async function waitForElement<T>(
  callback: () => T | Promise<T>,
  options?: Parameters<typeof waitFor>[1]
): Promise<T> {
  return waitFor(callback, options);
}

/**
 * Wait for multiple conditions to be true
 *
 * @param conditions - Array of condition functions
 * @param options - Wait options
 *
 * @example
 * ```ts
 * await waitForAll([
 *   () => dataLoaded,
 *   () => userAuthenticated,
 *   () => componentsReady
 * ])
 * ```
 */
export async function waitForAll(
  conditions: Array<() => boolean | Promise<boolean>>,
  options: { timeout?: number; interval?: number } = {}
): Promise<void> {
  await waitForCondition(
    async () => {
      const results = await Promise.all(conditions.map((c) => c()));
      return results.every((r) => r === true);
    },
    {
      ...options,
      errorMessage: 'Not all conditions met within timeout',
    }
  );
}

/**
 * Wait for any condition to be true
 *
 * @param conditions - Array of condition functions
 * @param options - Wait options
 * @returns Index of first condition that became true
 *
 * @example
 * ```ts
 * const index = await waitForAny([
 *   () => errorOccurred,
 *   () => successOccurred
 * ])
 * if (index === 0) {
 *   // Handle error
 * }
 * ```
 */
export async function waitForAny(
  conditions: Array<() => boolean | Promise<boolean>>,
  options: { timeout?: number; interval?: number } = {}
): Promise<number> {
  const { timeout = 5000, interval = 50 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    for (let i = 0; i < conditions.length; i++) {
      const result = await conditions[i]();
      if (result) {
        return i;
      }
    }
    await sleep(interval);
  }

  throw new Error('No conditions met within timeout');
}

// =============================================================================
// Timeout Utilities
// =============================================================================

/**
 * Create promise that rejects after timeout
 *
 * @param ms - Timeout in milliseconds
 * @param message - Error message
 * @returns Promise that rejects after timeout
 */
export function timeout(ms: number, message = 'Operation timed out'): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Wrap promise with timeout
 *
 * @param promise - Promise to wrap
 * @param ms - Timeout in milliseconds
 * @returns Promise that rejects if original promise doesn't resolve in time
 *
 * @example
 * ```ts
 * const result = await withTimeout(fetchData(), 3000)
 * ```
 */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promise, timeout(ms)]);
}
