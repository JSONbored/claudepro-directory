import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEventListener } from './use-event-listener.ts';

describe('useEventListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should attach window event listener', () => {
    const handler = vi.fn();
    renderHook(() => useEventListener('resize', handler));

    window.dispatchEvent(new Event('resize'));

    expect(handler).toHaveBeenCalled();
  });

  it('should attach element event listener', () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useEventListener('click', handler, ref));

    element.dispatchEvent(new MouseEvent('click'));

    expect(handler).toHaveBeenCalled();
  });

  it('should cleanup event listener on unmount', () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useEventListener('resize', handler));

    unmount();

    window.dispatchEvent(new Event('resize'));

    expect(handler).not.toHaveBeenCalled();
  });

  it('should use latest handler version', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(({ handler }) => useEventListener('resize', handler), {
      initialProps: { handler: handler1 },
    });

    window.dispatchEvent(new Event('resize'));
    expect(handler1).toHaveBeenCalledTimes(1);

    rerender({ handler: handler2 });

    window.dispatchEvent(new Event('resize'));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle null element ref', () => {
    const handler = vi.fn();
    const ref = { current: null };

    renderHook(() => useEventListener('click', handler, ref));

    // Should not crash, just not attach listener
    expect(handler).not.toHaveBeenCalled();
  });
});
