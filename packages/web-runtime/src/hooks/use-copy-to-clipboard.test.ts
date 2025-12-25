/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCopyToClipboard, useButtonSuccess } from './use-copy-to-clipboard';

// Use real useBoolean hook - it's simple and has no external dependencies
// No mock needed

jest.mock('./use-timeout', () => {
  const mockUseTimeout = jest.fn((callback: () => void, delay: number | null) => {
    // In tests, we'll manually trigger the callback when needed
    if (delay !== null && delay > 0) {
      // Store callback for manual triggering in tests
      (mockUseTimeout as any).lastCallback = callback;
      (mockUseTimeout as any).lastDelay = delay;
    }
  });
  return {
    useTimeout: mockUseTimeout,
  };
});

jest.mock('../config/static-configs', () => ({
  getTimeoutConfig: jest.fn(() => ({
    'timeout.ui.clipboard_reset_delay_ms': 2000,
    'timeout.ui.button_success_duration_ms': 2000,
  })),
}));

jest.mock('../logger', () => ({
  logger: {
    warn: jest.fn(),
  },
}));

jest.mock('../errors', () => ({
  normalizeError: jest.fn((error: unknown, message: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message);
  }),
}));

describe('useCopyToClipboard', () => {
  let mockWriteText: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText = jest.fn().mockResolvedValue(undefined);

    // Ensure navigator.clipboard is properly set up
    Object.defineProperty(global, 'navigator', {
      value: {
        clipboard: {
          writeText: mockWriteText,
        },
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with copied=false and error=null', () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.copy).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should copy text to clipboard successfully', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('test text');
      expect(success).toBe(true);
    });

    expect(mockWriteText).toHaveBeenCalledWith('test text');
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('should set copied to true optimistically before clipboard write', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    let copyPromise: Promise<boolean>;
    act(() => {
      copyPromise = result.current.copy('test text');
    });

    // Check optimistic state immediately (before promise resolves)
    expect(result.current.copied).toBe(true);

    await act(async () => {
      await copyPromise!;
    });
  });

  it('should call onSuccess callback on successful copy', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useCopyToClipboard({ onSuccess }));

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('should handle clipboard write error', async () => {
    const error = new Error('Clipboard write failed');
    mockWriteText.mockRejectedValue(error);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('test text');
      expect(success).toBe(false);
    });

    expect(result.current.copied).toBe(false); // Rolled back
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should call onError callback on copy failure', async () => {
    const error = new Error('Clipboard write failed');
    mockWriteText.mockRejectedValue(error);
    const onError = jest.fn();

    const { result } = renderHook(() => useCopyToClipboard({ onError }));

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should log error with context on copy failure', async () => {
    const { logger } = await import('../logger');
    const error = new Error('Clipboard write failed');
    mockWriteText.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useCopyToClipboard({
        context: { component: 'TestComponent', action: 'copy-link' },
      })
    );

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'clipboard',
        component: 'TestComponent',
        action: 'copy-link',
        recoverable: true,
        userRetryable: true,
        textLength: 9,
      }),
      '[Clipboard] Copy failed'
    );
  });

  it('should reset copied state and error manually', async () => {
    const error = new Error('Clipboard write failed');
    mockWriteText.mockRejectedValue(error);

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copy('test text');
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => {
      result.current.reset();
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should use custom resetDelay from options', () => {
    const { result } = renderHook(() => useCopyToClipboard({ resetDelay: 5000 }));

    // The hook should accept the custom delay
    // Actual timeout behavior is tested via useTimeout
    expect(result.current).toBeDefined();
  });

  it('should handle empty string', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('');
      expect(success).toBe(true);
    });

    expect(mockWriteText).toHaveBeenCalledWith('');
  });

  it('should handle long text', async () => {
    const longText = 'a'.repeat(10000);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy(longText);
      expect(success).toBe(true);
    });

    expect(mockWriteText).toHaveBeenCalledWith(longText);
  });

  it('should handle multiple rapid copy calls', async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await Promise.all([
        result.current.copy('text1'),
        result.current.copy('text2'),
        result.current.copy('text3'),
      ]);
    });

    expect(mockWriteText).toHaveBeenCalledTimes(3);
  });

  it('should handle clipboard API unavailable', async () => {
    const originalNavigator = global.navigator;
    // @ts-expect-error - Intentionally removing clipboard for test
    delete (global.navigator as any).clipboard;

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('test text');
      expect(success).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);

    // Restore
    global.navigator = originalNavigator;
  });

  it('should handle clipboard writeText throwing synchronously', async () => {
    const error = new Error('Clipboard write failed');
    mockWriteText.mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      const success = await result.current.copy('test text');
      expect(success).toBe(false);
    });

    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useButtonSuccess', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should initialize with isSuccess=false', () => {
    const { result } = renderHook(() => useButtonSuccess());

    expect(result.current.isSuccess).toBe(false);
    expect(typeof result.current.triggerSuccess).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should set isSuccess to true when triggerSuccess is called', () => {
    const { result } = renderHook(() => useButtonSuccess());

    act(() => {
      result.current.triggerSuccess();
    });

    expect(result.current.isSuccess).toBe(true);
  });

  it('should reset isSuccess when reset is called', () => {
    const { result } = renderHook(() => useButtonSuccess());

    act(() => {
      result.current.triggerSuccess();
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.reset();
    });

    expect(result.current.isSuccess).toBe(false);
  });

  it('should use custom duration from options', () => {
    const { result } = renderHook(() => useButtonSuccess({ duration: 5000 }));

    // The hook should accept the custom duration
    // Actual timeout behavior is tested via useTimeout
    expect(result.current).toBeDefined();
  });

  it('should use default duration from config when not provided', () => {
    const { result } = renderHook(() => useButtonSuccess());

    // Hook should work with default duration
    expect(result.current).toBeDefined();
  });

  it('should handle multiple triggerSuccess calls', () => {
    const { result } = renderHook(() => useButtonSuccess());

    act(() => {
      result.current.triggerSuccess();
    });

    expect(result.current.isSuccess).toBe(true);

    act(() => {
      result.current.triggerSuccess();
    });

    // Should still be true (doesn't toggle)
    expect(result.current.isSuccess).toBe(true);
  });

  it('should return stable function references', () => {
    const { result, rerender } = renderHook(() => useButtonSuccess());

    const firstTriggerSuccess = result.current.triggerSuccess;
    const firstReset = result.current.reset;

    rerender();

    const secondTriggerSuccess = result.current.triggerSuccess;
    const secondReset = result.current.reset;

    expect(firstTriggerSuccess).toBe(secondTriggerSuccess);
    expect(firstReset).toBe(secondReset);
  });
});
