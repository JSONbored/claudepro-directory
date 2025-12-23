/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useEventListener } from './use-event-listener.ts';
import type { RefObject } from 'react';

describe('useEventListener', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should attach window event listener', () => {
    const handler = jest.fn();
    renderHook(() => useEventListener('resize', handler));

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(Event));
  });

  it('should attach element event listener', () => {
    const handler = jest.fn();
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    renderHook(() => useEventListener('click', handler, ref));

    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('should cleanup event listener on unmount', () => {
    const handler = jest.fn();
    const { unmount } = renderHook(() => useEventListener('resize', handler));

    unmount();

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should use latest handler version', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();

    const { rerender } = renderHook(({ handler }) => useEventListener('resize', handler), {
      initialProps: { handler: handler1 },
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle null element ref', () => {
    const handler = jest.fn();
    const ref: RefObject<HTMLDivElement> = { current: null };

    renderHook(() => useEventListener('click', handler, ref));

    // Should not crash, just not attach listener
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle different window event types', () => {
    const resizeHandler = jest.fn();
    const scrollHandler = jest.fn();
    const keydownHandler = jest.fn();

    renderHook(() => useEventListener('resize', resizeHandler));
    renderHook(() => useEventListener('scroll', scrollHandler));
    renderHook(() => useEventListener('keydown', keydownHandler));

    act(() => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('scroll'));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    });

    expect(resizeHandler).toHaveBeenCalledTimes(1);
    expect(scrollHandler).toHaveBeenCalledTimes(1);
    expect(keydownHandler).toHaveBeenCalledTimes(1);
    expect(keydownHandler).toHaveBeenCalledWith(expect.objectContaining({ key: 'Enter' }));
  });

  it('should handle event listener options', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('resize', handler, undefined, { capture: true, once: true }));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'resize',
      expect.any(Function),
      { capture: true, once: true }
    );
  });

  it('should handle boolean options (capture)', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    renderHook(() => useEventListener('resize', handler, undefined, true));

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), true);
  });

  it('should handle ref changing from null to element', () => {
    const handler = jest.fn();
    const ref1: RefObject<HTMLDivElement> = { current: null };

    const { rerender } = renderHook(({ ref }) => useEventListener('click', handler, ref), {
      initialProps: { ref: ref1 },
    });

    // Handler should not be called when ref is null
    expect(handler).not.toHaveBeenCalled();

    // Create new ref with element (ref object changes, triggering useEffect)
    const element = document.createElement('div');
    const ref2: RefObject<HTMLDivElement> = { current: element };
    rerender({ ref: ref2 });

    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle ref changing from element to null', () => {
    const handler = jest.fn();
    const element = document.createElement('div');
    const ref1: RefObject<HTMLDivElement> = { current: element };

    const { rerender } = renderHook(({ ref }) => useEventListener('click', handler, ref), {
      initialProps: { ref: ref1 },
    });

    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    // Create new ref with null (ref object changes, triggering useEffect)
    const ref2: RefObject<HTMLDivElement> = { current: null };
    rerender({ ref: ref2 });

    // Handler should not be called after ref becomes null
    // Note: The old listener is still attached to the element, but since we're using a new ref,
    // the effect cleanup removed the listener. However, we can still dispatch to the element.
    // The handler won't be called because the listener was removed.
    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
  });

  it('should handle event name changing', () => {
    const handler = jest.fn();

    const { rerender } = renderHook(({ eventName }) => useEventListener(eventName, handler), {
      initialProps: { eventName: 'resize' as keyof WindowEventMap },
    });

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    rerender({ eventName: 'scroll' as keyof WindowEventMap });

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should handle options changing', () => {
    const handler = jest.fn();
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    const { rerender } = renderHook(({ options }) => useEventListener('resize', handler, undefined, options), {
      initialProps: { options: { capture: true } },
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { capture: true });

    rerender({ options: { capture: false, once: true } });

    // Should remove old listener and add new one with new options
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { capture: false, once: true });
  });

  it('should handle document events', () => {
    const handler = jest.fn();
    const documentRef: RefObject<Document> = { current: document };

    renderHook(() => useEventListener('click', handler, documentRef));

    act(() => {
      document.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle direct element (not ref)', () => {
    const handler = jest.fn();
    const element = document.createElement('div');

    renderHook(() => useEventListener('click', handler, element));

    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle SSR (window undefined)', () => {
    const handler = jest.fn();
    const originalWindow = global.window;

    // @ts-expect-error - Testing SSR scenario
    global.window = undefined;

    // Should not throw
    const { unmount } = renderHook(() => useEventListener('resize', handler));

    // Restore window
    global.window = originalWindow;

    unmount();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple event listeners on same element', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const element = document.createElement('div');

    renderHook(() => useEventListener('click', handler1, element));
    renderHook(() => useEventListener('click', handler2, element));

    act(() => {
      element.dispatchEvent(new MouseEvent('click'));
    });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle custom event types', () => {
    const handler = jest.fn();
    const element = document.createElement('div');

    renderHook(() => useEventListener('custom-event', handler, element));

    act(() => {
      element.dispatchEvent(new CustomEvent('custom-event', { detail: { test: 'data' } }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ type: 'custom-event' }));
  });
});
