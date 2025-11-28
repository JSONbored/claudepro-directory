import { describe, expect, it, vi, beforeEach } from 'vitest';
import { normalizeError, logActionFailure, logClientWarning, logUnhandledPromise } from './errors.ts';

// Mock logger
vi.mock('./logger.ts', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
  toLogContextValue: vi.fn((v) => v),
}));

describe('normalizeError', () => {
  it('should return Error objects unchanged', () => {
    const error = new Error('Test error');
    const result = normalizeError(error);
    expect(result).toBe(error);
    expect(result.message).toBe('Test error');
  });

  it('should convert string to Error', () => {
    const result = normalizeError('String error');
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('String error');
  });

  it('should convert objects to Error with JSON string', () => {
    const obj = { code: 'ERR_123', details: 'Failed' };
    const result = normalizeError(obj);
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toContain('ERR_123');
    expect(result.message).toContain('Failed');
  });

  it('should use fallback message for non-stringifiable values', () => {
    const circular: any = {};
    circular.self = circular;
    const result = normalizeError(circular, 'Fallback message');
    expect(result.message).toBe('Fallback message');
  });

  it('should handle null and undefined', () => {
    const nullResult = normalizeError(null);
    expect(nullResult).toBeInstanceOf(Error);

    const undefinedResult = normalizeError(undefined);
    expect(undefinedResult).toBeInstanceOf(Error);
  });

  it('should handle primitive types', () => {
    expect(normalizeError(42).message).toBe('42');
    expect(normalizeError(true).message).toBe('true');
    expect(normalizeError(false).message).toBe('false');
  });
});

describe('logActionFailure', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log action failures with context', () => {
    const { logger } = require('./logger.ts');
    const error = new Error('Action failed');
    const context = { userId: 'user123', action: 'submit' };

    const result = logActionFailure('testAction', error, context);

    expect(logger.error).toHaveBeenCalledWith(
      '[Action] testAction failed',
      error,
      expect.objectContaining(context)
    );
    expect(result).toBe(error);
  });

  it('should normalize non-Error values', () => {
    const { logger } = require('./logger.ts');
    const result = logActionFailure('testAction', 'String error');

    expect(result).toBeInstanceOf(Error);
    expect(logger.error).toHaveBeenCalled();
  });

  it('should filter out undefined context values', () => {
    const { logger } = require('./logger.ts');
    const context = { userId: 'user123', optional: undefined };

    logActionFailure('testAction', new Error('Test'), context);

    const loggedContext = vi.mocked(logger.error).mock.calls[0][2];
    expect(loggedContext).not.toHaveProperty('optional');
    expect(loggedContext).toHaveProperty('userId');
  });

  it('should handle empty context', () => {
    const { logger } = require('./logger.ts');
    logActionFailure('testAction', new Error('Test'), undefined);
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('logClientWarning', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log warnings with err key', () => {
    const { logger } = require('./logger.ts');
    const error = new Error('Warning');
    const context = { component: 'TestComponent' };

    const result = logClientWarning('Test warning', error, context);

    expect(logger.warn).toHaveBeenCalledWith(
      'Test warning',
      expect.objectContaining({
        err: error,
        component: 'TestComponent',
      })
    );
    expect(result).toBe(error);
  });

  it('should handle missing context', () => {
    const { logger } = require('./logger.ts');
    const error = new Error('Warning');

    logClientWarning('Test warning', error);
    expect(logger.warn).toHaveBeenCalled();
  });
});

describe('logUnhandledPromise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log promise rejections', () => {
    const { logger } = require('./logger.ts');
    const error = new Error('Promise rejected');
    const context = { promiseId: 'async-123' };

    const result = logUnhandledPromise('fetchData', error, context);

    expect(logger.error).toHaveBeenCalledWith(
      '[Promise] fetchData rejected',
      error,
      expect.objectContaining(context)
    );
    expect(result).toBe(error);
  });

  it('should normalize promise rejection reasons', () => {
    const { logger } = require('./logger.ts');
    const result = logUnhandledPromise('fetchData', 'Rejection reason');

    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Rejection reason');
    expect(logger.error).toHaveBeenCalled();
  });
});

describe('error context sanitization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should remove undefined values from context', () => {
    const { logger } = require('./logger.ts');
    const context = {
      defined: 'value',
      undefined: undefined,
      null: null,
    };

    logActionFailure('test', new Error('Test'), context);

    const loggedContext = vi.mocked(logger.error).mock.calls[0][2];
    expect(loggedContext).toHaveProperty('defined');
    expect(loggedContext).not.toHaveProperty('undefined');
  });

  it('should handle all-undefined context gracefully', () => {
    const { logger } = require('./logger.ts');
    const context = { a: undefined, b: undefined };

    logActionFailure('test', new Error('Test'), context);
    expect(logger.error).toHaveBeenCalled();
  });
});