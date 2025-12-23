/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useClickAnywhere } from './use-click-anywhere.ts';

describe('useClickAnywhere', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call handler on document click', () => {
    const handler = jest.fn();
    renderHook(() => useClickAnywhere(handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('should use latest handler version', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const { rerender } = renderHook(({ handler }) => useClickAnywhere(handler), {
      initialProps: { handler: handler1 },
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should cleanup on unmount', () => {
    const handler = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useClickAnywhere(handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

    // Verify handler is not called after unmount
    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple clicks', () => {
    const handler = jest.fn();
    renderHook(() => useClickAnywhere(handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(3);
  });

  it('should pass MouseEvent details to handler', () => {
    const handler = jest.fn();
    renderHook(() => useClickAnywhere(handler));

    act(() => {
      const event = new MouseEvent('click', {
        bubbles: true,
        clientX: 100,
        clientY: 200,
        button: 0,
      });
      document.dispatchEvent(event);
    });

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as MouseEvent;
    expect(event.clientX).toBe(100);
    expect(event.clientY).toBe(200);
    expect(event.button).toBe(0);
  });

  it('should handle SSR (document undefined)', () => {
    const handler = jest.fn();
    const originalDocument = global.document;

    // @ts-expect-error - Testing SSR scenario
    global.document = undefined;

    // Should not throw
    const { unmount } = renderHook(() => useClickAnywhere(handler));

    // Restore document
    global.document = originalDocument;

    unmount();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle handler changing multiple times', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const handler3 = jest.fn();

    const { rerender } = renderHook(({ handler }) => useClickAnywhere(handler), {
      initialProps: { handler: handler1 },
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);

    rerender({ handler: handler2 });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);

    rerender({ handler: handler3 });

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
  });

  it('should not call handler after cleanup', () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() => useClickAnywhere(handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    unmount();

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });
});
