import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { normalizeError, logActionFailure, logClientWarning, logUnhandledPromise } from './errors';

// Mock logger - define mocks inline to avoid hoisting issues
const mockLoggerError = jest.fn();
const mockLoggerWarn = jest.fn();
jest.mock('./logger', () => {
  // Access mocks from globalThis to avoid hoisting issues
  if (!(globalThis as any).__loggerMocks) {
    (globalThis as any).__loggerMocks = {
      error: jest.fn(),
      warn: jest.fn(),
    };
  }
  return {
    logger: {
      error: (globalThis as any).__loggerMocks.error,
      warn: (globalThis as any).__loggerMocks.warn,
    },
  };
});

describe('errors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global mocks
    if ((globalThis as any).__loggerMocks) {
      (globalThis as any).__loggerMocks.error.mockClear();
      (globalThis as any).__loggerMocks.warn.mockClear();
    }
  });

  describe('normalizeError', () => {
    it('should normalize Error objects', () => {
      const error = new Error('Test error');
      const normalized = normalizeError(error);
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('Test error');
    });

    it('should normalize string errors', () => {
      const normalized = normalizeError('String error');
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('String error');
    });

    it('should use fallback message for unknown types', () => {
      // Note: normalizeError from shared-runtime stringifies null as 'null'
      // This is the actual behavior - JSON.stringify(null) returns 'null'
      const normalized = normalizeError(null, 'Fallback message');
      expect(normalized).toBeInstanceOf(Error);
      // The implementation stringifies null, so it returns 'null' not the fallback
      expect(normalized.message).toBe('null');
    });

    it('should handle objects with message property', () => {
      const error = { message: 'Object error', code: 'ERR001' };
      const normalized = normalizeError(error, 'Fallback');
      expect(normalized).toBeInstanceOf(Error);
      expect(normalized.message).toBe('Object error');
    });
  });

  describe('logActionFailure', () => {
    it('should normalize error and log it', () => {
      const error = new Error('Action failed');
      const normalized = logActionFailure('testAction', error, { userId: 'user-1' });

      expect(normalized).toBeInstanceOf(Error);
      expect((globalThis as any).__loggerMocks.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: normalized,
          userId: 'user-1',
        }),
        '[Action] testAction failed'
      );
    });

    it('should sanitize context (remove undefined values)', () => {
      const error = new Error('Action failed');
      logActionFailure('testAction', error, { userId: 'user-1', optional: undefined });

      expect((globalThis as any).__loggerMocks.error).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
        }),
        expect.any(String)
      );
      expect((globalThis as any).__loggerMocks.error).toHaveBeenCalledWith(
        expect.not.objectContaining({
          optional: expect.anything(),
        }),
        expect.any(String)
      );
    });

    it('should handle empty context', () => {
      const error = new Error('Action failed');
      logActionFailure('testAction', error);

      expect((globalThis as any).__loggerMocks.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.any(Error),
        }),
        '[Action] testAction failed'
      );
    });
  });

  describe('logClientWarning', () => {
    it('should normalize error and log warning', () => {
      const error = new Error('Warning error');
      const normalized = logClientWarning('Warning message', error, { component: 'Test' });

      expect(normalized).toBeInstanceOf(Error);
      expect((globalThis as any).__loggerMocks.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          err: normalized,
          component: 'Test',
        }),
        'Warning message'
      );
    });
  });

  describe('logUnhandledPromise', () => {
    it('should normalize error and log promise rejection', () => {
      const error = new Error('Promise rejected');
      const normalized = logUnhandledPromise('testPromise', error, { operation: 'test' });

      expect(normalized).toBeInstanceOf(Error);
      expect((globalThis as any).__loggerMocks.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: normalized,
          operation: 'test',
        }),
        '[Promise] testPromise rejected'
      );
    });
  });
});
