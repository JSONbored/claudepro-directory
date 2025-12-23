/**
 * @jest-environment jsdom
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useClientLogger } from './use-client-logger';
import type { UseClientLoggerOptions } from './use-client-logger';

// Mock dependencies - define mocks directly in jest.mock()
jest.mock('../utils/client-session', () => ({
  getOrCreateSessionId: jest.fn(() => 'session-123'),
}));

jest.mock('../utils/client-logger', () => ({
  createClientLogContext: jest.fn((operation: string, context: any) => ({
    operation,
    ...context,
  })),
}));

jest.mock('../logger', () => ({
  logger: {
    child: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
  toLogContextValue: jest.fn((value: unknown) => value),
}));

jest.mock('../errors', () => ({
  normalizeError: jest.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useClientLogger', () => {
  let mockComponentLogger: {
    error: ReturnType<typeof jest.fn>;
    warn: ReturnType<typeof jest.fn>;
    info: ReturnType<typeof jest.fn>;
    debug: ReturnType<typeof jest.fn>;
  };
  let mockChild: ReturnType<typeof jest.fn>;
  let mockGetOrCreateSessionId: ReturnType<typeof jest.fn>;
  let mockCreateClientLogContext: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get mocks from modules
    const { logger } = jest.requireMock('../logger');
    const { getOrCreateSessionId } = jest.requireMock('../utils/client-session');
    const { createClientLogContext } = jest.requireMock('../utils/client-logger');

    mockChild = logger.child;
    mockGetOrCreateSessionId = getOrCreateSessionId;
    mockCreateClientLogContext = createClientLogContext;

    mockComponentLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };

    mockChild.mockReturnValue(mockComponentLogger);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

  it('should log error without action', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const error = new Error('Test error');

    act(() => {
      result.current.error('Operation failed', error);
    });

    expect(mockComponentLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        component: 'TestComponent',
      }),
      'Operation failed'
    );
  });

  it('should log error with additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const error = new Error('Test error');

    act(() => {
      result.current.error('Operation failed', error, 'handleClick', {
        extraField: 'extraValue',
      });
    });

    expect(mockComponentLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        err: expect.any(Error),
        component: 'TestComponent',
        action: 'handleClick',
        extraField: 'extraValue',
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

  it('should log warn without action', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.warn('Warning message');
    });

    expect(mockComponentLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
      }),
      'Warning message'
    );
  });

  it('should log warn with additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.warn('Warning message', undefined, 'handleAction', {
        extraField: 'extraValue',
      });
    });

    expect(mockComponentLogger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
        extraField: 'extraValue',
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

  it('should log info without action', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.info('Info message');
    });

    expect(mockComponentLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
      }),
      'Info message'
    );
  });

  it('should log info with additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.info('Info message', 'handleAction', {
        extraField: 'extraValue',
      });
    });

    expect(mockComponentLogger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
        extraField: 'extraValue',
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

  it('should log debug without action', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.debug('Debug message');
    });

    expect(mockComponentLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
      }),
      'Debug message'
    );
  });

  it('should log debug with additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.debug('Debug message', 'handleAction', {
        extraField: 'extraValue',
      });
    });

    expect(mockComponentLogger.debug).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        action: 'handleAction',
        extraField: 'extraValue',
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

  it('should get context without additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      const context = result.current.getContext('handleClick');
      expect(context.operation).toBe('TestComponent.handleClick');
      expect(context.component).toBe('TestComponent');
      expect(context.action).toBe('handleClick');
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

  it('should create new session ID for new component instance', () => {
    const { unmount } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    expect(mockGetOrCreateSessionId).toHaveBeenCalledTimes(1);

    unmount();

    renderHook(() =>
      useClientLogger({
        component: 'OtherComponent',
      } as UseClientLoggerOptions)
    );

    // Should call again for new instance
    expect(mockGetOrCreateSessionId).toHaveBeenCalledTimes(2);
  });

  it('should return stable logger reference', () => {
    const { result, rerender } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    const firstError = result.current.error;
    const firstInfo = result.current.info;
    const firstGetContext = result.current.getContext;

    rerender();

    const secondError = result.current.error;
    const secondInfo = result.current.info;
    const secondGetContext = result.current.getContext;

    expect(firstError).toBe(secondError);
    expect(firstInfo).toBe(secondInfo);
    expect(firstGetContext).toBe(secondGetContext);
  });

  it('should return new logger reference when component changes', () => {
    const { result, rerender } = renderHook(
      ({ component }) =>
        useClientLogger({
          component,
        } as UseClientLoggerOptions),
      {
        initialProps: {
          component: 'TestComponent',
        },
      }
    );

    const firstError = result.current.error;

    rerender({ component: 'OtherComponent' });

    const secondError = result.current.error;

    expect(secondError).not.toBe(firstError);
  });

  it('should return new logger reference when module changes', () => {
    const { result, rerender } = renderHook(
      ({ component, module }) =>
        useClientLogger({
          component,
          module,
        } as UseClientLoggerOptions),
      {
        initialProps: {
          component: 'TestComponent',
          module: 'components/test',
        },
      }
    );

    const firstError = result.current.error;

    rerender({ component: 'TestComponent', module: 'components/other' });

    const secondError = result.current.error;

    expect(secondError).not.toBe(firstError);
  });

  it('should return new logger reference when context changes', () => {
    const { result, rerender } = renderHook(
      ({ component, context }) =>
        useClientLogger({
          component,
          context,
        } as UseClientLoggerOptions),
      {
        initialProps: {
          component: 'TestComponent',
          context: { userId: '123' },
        },
      }
    );

    const firstError = result.current.error;

    rerender({ component: 'TestComponent', context: { userId: '456' } });

    const secondError = result.current.error;

    expect(secondError).not.toBe(firstError);
  });

  it('should handle component name with special characters', () => {
    renderHook(() =>
      useClientLogger({
        component: 'Component-Name_123',
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'Component-Name_123',
        sessionId: 'session-123',
      })
    );
  });

  it('should handle empty context object', () => {
    renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
        context: {},
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        sessionId: 'session-123',
      })
    );
  });

  it('should handle context with various value types', () => {
    renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
        context: {
          stringValue: 'test',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
        },
      } as UseClientLoggerOptions)
    );

    expect(mockChild).toHaveBeenCalledWith(
      expect.objectContaining({
        component: 'TestComponent',
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        nullValue: null,
      })
    );
  });

  it('should handle multiple log calls', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      result.current.info('Info 1');
      result.current.warn('Warning 1');
      result.current.error('Error 1', new Error('Test'));
      result.current.debug('Debug 1');
    });

    expect(mockComponentLogger.info).toHaveBeenCalledTimes(1);
    expect(mockComponentLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockComponentLogger.error).toHaveBeenCalledTimes(1);
    expect(mockComponentLogger.debug).toHaveBeenCalledTimes(1);
  });

  it('should handle getContext with empty additional context', () => {
    const { result } = renderHook(() =>
      useClientLogger({
        component: 'TestComponent',
      } as UseClientLoggerOptions)
    );

    act(() => {
      const context = result.current.getContext('handleClick', {});
      expect(context.operation).toBe('TestComponent.handleClick');
      expect(context.component).toBe('TestComponent');
      expect(context.action).toBe('handleClick');
    });
  });
});
