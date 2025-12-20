import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClientLogger } from './use-client-logger';
import type { UseClientLoggerOptions } from './use-client-logger';

// Mock dependencies - use vi.hoisted() for variables used in vi.mock()
const mockGetOrCreateSessionId = vi.hoisted(() => vi.fn(() => 'session-123'));
vi.mock('../utils/client-session', () => ({
  getOrCreateSessionId: mockGetOrCreateSessionId,
}));

const mockCreateClientLogContext = vi.hoisted(() =>
  vi.fn((operation: string, context: any) => ({
    operation,
    ...context,
  }))
);
vi.mock('../utils/client-logger', () => ({
  createClientLogContext: mockCreateClientLogContext,
}));

const mockChild = vi.hoisted(() =>
  vi.fn((bindings: any) => ({
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  }))
);
const mockLogger = vi.hoisted(() => ({
  child: mockChild,
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
}));
vi.mock('../logger', () => ({
  logger: mockLogger,
  toLogContextValue: vi.fn((value: unknown) => value),
}));

vi.mock('../errors', () => ({
  normalizeError: vi.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useClientLogger', () => {
  let mockComponentLogger: {
    error: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    debug: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockComponentLogger = {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    mockChild.mockReturnValue(mockComponentLogger);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return logger with all methods', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    expect(typeof result.current.error).toBe('function');
    expect(typeof result.current.warn).toBe('function');
    expect(typeof result.current.info).toBe('function');
    expect(typeof result.current.debug).toBe('function');
    expect(typeof result.current.getContext).toBe('function');
  });

  it('should create child logger with component and session ID', () => {
    renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        sessionId: 'session-123',
      })
    );
  });

  it('should include module in bindings when provided', () => {
    renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
        module: 'components/test',
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        module: 'components/test',
        sessionId: 'session-123',
      })
    );
  });

  it('should include additional context in bindings', () => {
    renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
        context: { userId: '123', feature: 'test' },
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        userId: '123',
        feature: 'test',
      })
    );
  });

  it('should log error with normalized error', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const error = new Error('Test error');

    act(() => {
      result.current.error('Operation failed', error, 'handleClick');
    });

    expect(mockComponentLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        component: 'TestComponent',
        action: 'handleClick',
      }),
      'Operation failed'
    );
  });

  it('should log warn with optional error', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const error = new Error('Warning');

    act(() => {
      result.current.warn('Warning message', error, 'handleAction');
    });

    expect(mockComponentLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
      }),
      'Warning message'
    );
  });

  it('should log warn without error', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.warn('Warning message', undefined, 'handleAction');
    });

    expect(mockComponentLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
      }),
      'Warning message'
    );
  });

  it('should log info message', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.info('Info message', 'handleAction');
    });

    expect(mockComponentLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
      }),
      'Info message'
    );
  });

  it('should log debug message', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.debug('Debug message', 'handleAction');
    });

    expect(mockComponentLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
      }),
      'Debug message'
    );
  });

  it('should get context with operation and metadata', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
        module: 'components/test',
      } as UseClientLoggerOptions)
    );

    act(() => {
      const context = result.current.getContext('handleClick', { extra: 'data' });
      expect(context).toEqual(
        expect.objectContaining({
          operation: 'TestComponent.handleClick',
          component: 'TestComponent',
          module: 'components/test',
          action: 'handleClick',
          extra: 'data',
        })
      );
    });
  });

  it('should use component name as operation when action is not provided', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      const context = result.current.getContext();
      expect(context.operation).toBe('TestComponent');
    });
  });

  it('should include extra context in log calls', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.info('Message', 'action', { extraField: 'extraValue' });
    });

    expect(mockComponentLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        extraField: 'extraValue',
      }),
      'Message'
    );
  });

  it('should memoize session ID', () => {
    const { rerender } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    expect(mockGetOrCreateSessionId).toHaveBeenCalledTimes(1);

    rerender();

    // Should not call again
    expect(mockGetOrCreateSessionId).toHaveBeenCalledTimes(1);
  });

  it('should return stable logger reference', () => {
    const { result, rerender } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const firstError = result.current.error;
    const firstInfo = result.current.info;

    rerender();

    const secondError = result.current.error;
    const secondInfo = result.current.info;

    expect(firstError).toBe(secondError);
    expect(firstInfo).toBe(secondInfo);
  });
});
