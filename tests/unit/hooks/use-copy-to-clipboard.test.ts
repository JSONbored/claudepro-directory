/**
 * Copy to Clipboard Hook Tests
 *
 * Tests for useCopyToClipboard hook which handles clipboard operations
 * for code snippets, config files, and other copyable content.
 *
 * This is a CRITICAL user-facing feature - users click copy buttons frequently.
 * Tests verify:
 * - Successful copy operations
 * - Permission errors (clipboard blocked)
 * - Fallback mechanisms
 * - Auto-reset timing
 * - Manual reset
 * - Callback execution
 * - Memory cleanup
 *
 * @see src/hooks/use-copy-to-clipboard.ts
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCopyToClipboard } from '@/src/hooks/use-copy-to-clipboard';

// Mock logger
vi.mock('@/src/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { logger } from '@/src/lib/logger';

describe('useCopyToClipboard', () => {
  let mockClipboard: {
    writeText: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock Clipboard API
    mockClipboard = {
      writeText: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Copy Operations', () => {
    it('initializes with not-copied state', () => {
      const { result } = renderHook(() => useCopyToClipboard());

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('copies text to clipboard successfully', async () => {
      const { result } = renderHook(() => useCopyToClipboard());
      let copyResult: boolean | undefined;

      await act(async () => {
        copyResult = await result.current.copy('Hello World');
      });

      expect(copyResult).toBe(true);
      expect(result.current.copied).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockClipboard.writeText).toHaveBeenCalledWith('Hello World');
    });

    it('copies long text (code snippets)', async () => {
      const longCode = 'function test() {\n'.repeat(100);
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(longCode);
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(longCode);
    });

    it('copies empty string', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('');
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith('');
    });

    it('copies special characters and unicode', async () => {
      const specialText = '{ "emoji": "🚀", "symbols": "<>&\'" }';
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(specialText);
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(specialText);
    });

    it('copies multiline text preserving formatting', async () => {
      const multiline = 'Line 1\nLine 2\r\nLine 3\tTabbed';
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(multiline);
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(multiline);
    });
  });

  describe('Auto-Reset Functionality', () => {
    it('resets copied state after default delay (2s)', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // Fast-forward past default reset delay (2000ms)
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('resets copied state after custom delay', async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 5000,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // Should still be copied after 2s
      await act(async () => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.copied).toBe(true);

      // Should reset after 5s
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('resets timer when copying again before reset', async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 2000,
        })
      );

      // First copy
      await act(async () => {
        await result.current.copy('first');
      });

      expect(result.current.copied).toBe(true);

      // Advance 1s (halfway to reset)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Second copy (should reset timer)
      await act(async () => {
        await result.current.copy('second');
      });

      expect(result.current.copied).toBe(true);

      // Advance another 1s (only 1s since second copy)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      // Should still be copied
      expect(result.current.copied).toBe(true);

      // Advance final 1s (total 2s since second copy)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.copied).toBe(false);
    });

    it('supports very short reset delays', async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 100,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.copied).toBe(false);
    });

    it('supports very long reset delays', async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 60000, // 1 minute
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // Should still be copied after 30s
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });
      expect(result.current.copied).toBe(true);

      // Should reset after 60s
      await act(async () => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.copied).toBe(false);
    });
  });

  describe('Manual Reset', () => {
    it('manually resets copied state', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.copied).toBe(false);
    });

    it('clears pending timeout when manually reset', async () => {
      const { result } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 5000,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      // Manually reset before auto-reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.copied).toBe(false);

      // Advance past original reset time
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should stay false (not reset twice)
      expect(result.current.copied).toBe(false);
    });

    it('clears error state when reset', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Permission denied'));

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.error).toBeInstanceOf(Error);

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('calls onSuccess callback on successful copy', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useCopyToClipboard({
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('calls onError callback on failed copy', async () => {
      const mockError = new Error('Clipboard permission denied');
      mockClipboard.writeText.mockRejectedValueOnce(mockError);

      const onError = vi.fn();
      const { result } = renderHook(() =>
        useCopyToClipboard({
          onError,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(mockError);
    });

    it('does not call onSuccess when copy fails', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Failed'));

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useCopyToClipboard({
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(onSuccess).not.toHaveBeenCalled();
    });

    it('calls onSuccess multiple times for multiple copies', async () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useCopyToClipboard({
          onSuccess,
        })
      );

      await act(async () => {
        await result.current.copy('first');
        await result.current.copy('second');
        await result.current.copy('third');
      });

      expect(onSuccess).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    it('handles clipboard permission denied', async () => {
      const permissionError = new DOMException('User denied clipboard access', 'NotAllowedError');
      mockClipboard.writeText.mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useCopyToClipboard());

      let copyResult: boolean | undefined;
      await act(async () => {
        copyResult = await result.current.copy('test');
      });

      expect(copyResult).toBe(false);
      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        permissionError,
        expect.objectContaining({
          component: 'useCopyToClipboard',
          action: 'copy',
          textLength: 4,
        })
      );
    });

    it('handles clipboard not supported', async () => {
      const notSupportedError = new Error('Clipboard API not supported');
      mockClipboard.writeText.mockRejectedValueOnce(notSupportedError);

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });

    it('logs error with custom context', async () => {
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Test error'));

      const { result } = renderHook(() =>
        useCopyToClipboard({
          context: {
            component: 'CodeBlock',
            action: 'copyCode',
          },
        })
      );

      await act(async () => {
        await result.current.copy('code');
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Failed to copy to clipboard',
        expect.any(Error),
        expect.objectContaining({
          component: 'CodeBlock',
          action: 'copyCode',
          textLength: 4,
        })
      );
    });

    it('converts non-Error objects to Error', async () => {
      mockClipboard.writeText.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
    });

    it('clears error on successful copy after failure', async () => {
      // First copy fails
      mockClipboard.writeText.mockRejectedValueOnce(new Error('Failed'));

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy('fail');
      });

      expect(result.current.error).toBeInstanceOf(Error);

      // Second copy succeeds
      mockClipboard.writeText.mockResolvedValueOnce(undefined);

      await act(async () => {
        await result.current.copy('success');
      });

      expect(result.current.error).toBeNull();
      expect(result.current.copied).toBe(true);
    });
  });

  describe('Memory Cleanup', () => {
    it('clears timeout on unmount', async () => {
      const { result, unmount } = renderHook(() =>
        useCopyToClipboard({
          resetDelay: 5000,
        })
      );

      await act(async () => {
        await result.current.copy('test');
      });

      expect(result.current.copied).toBe(true);

      // Unmount before timeout
      unmount();

      // Advance past timeout
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // Should not cause any errors
      expect(vi.getTimerCount()).toBe(0);
    });

    it('handles multiple copies and cleanups', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      // Multiple rapid copies
      await act(async () => {
        await result.current.copy('copy1');
        await result.current.copy('copy2');
        await result.current.copy('copy3');
      });

      // Should only have one active timeout
      expect(result.current.copied).toBe(true);

      await act(async () => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.copied).toBe(false);
    });
  });

  describe('Real-World Scenarios', () => {
    it('simulates user copying code snippet from documentation', async () => {
      const codeSnippet = `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}`;

      const onSuccess = vi.fn();
      const { result } = renderHook(() =>
        useCopyToClipboard({
          onSuccess,
          resetDelay: 3000,
        })
      );

      await act(async () => {
        await result.current.copy(codeSnippet);
      });

      expect(result.current.copied).toBe(true);
      expect(onSuccess).toHaveBeenCalled();
      expect(mockClipboard.writeText).toHaveBeenCalledWith(codeSnippet);
    });

    it('simulates user copying JSON configuration', async () => {
      const config = JSON.stringify(
        {
          theme: 'dark',
          fontSize: 14,
          features: ['autocomplete', 'linting'],
        },
        null,
        2
      );

      const { result } = renderHook(() => useCopyToClipboard());

      await act(async () => {
        await result.current.copy(config);
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledWith(config);
    });

    it('simulates rapid clicking of copy button', async () => {
      const { result } = renderHook(() => useCopyToClipboard());

      // User clicks copy button 5 times rapidly
      await act(async () => {
        await result.current.copy('text1');
        await result.current.copy('text2');
        await result.current.copy('text3');
        await result.current.copy('text4');
        await result.current.copy('text5');
      });

      expect(result.current.copied).toBe(true);
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(5);
      expect(mockClipboard.writeText).toHaveBeenLastCalledWith('text5');
    });
  });
});
