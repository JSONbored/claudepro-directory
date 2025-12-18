import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClickAnywhere } from './use-click-anywhere.ts';

describe('useClickAnywhere', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call handler on document click', () => {
    const handler = vi.fn();
    renderHook(() => useClickAnywhere(handler));

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handler).toHaveBeenCalled();
  });

  it('should use latest handler version', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const { rerender } = renderHook(
      ({ handler }) => useClickAnywhere(handler),
      { initialProps: { handler: handler1 } }
    );

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler1).toHaveBeenCalledTimes(1);

    rerender({ handler: handler2 });

    document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const handler = vi.fn();
    const removeEventListener = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickAnywhere(handler));

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });
});
