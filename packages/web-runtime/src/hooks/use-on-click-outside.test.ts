/**
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useOnClickOutside } from './use-on-click-outside.ts';
import type { RefObject } from 'react';

describe('useOnClickOutside', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call handler when clicking outside element', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.any(MouseEvent));
  });

  it('should not call handler when clicking inside element', () => {
    const handler = jest.fn();
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: element, configurable: true });
      document.dispatchEvent(insideEvent);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple refs', () => {
    const handler = jest.fn();
    const ref1 = { current: document.createElement('div') };
    const ref2 = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not call handler when clicking inside any of multiple refs', () => {
    const handler = jest.fn();
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const ref1 = { current: element1 };
    const ref2 = { current: element2 };

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: element1, configurable: true });
      document.dispatchEvent(insideEvent);
    });

    expect(handler).not.toHaveBeenCalled();

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: element2, configurable: true });
      document.dispatchEvent(insideEvent);
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), {});

    // Verify handler is not called after unmount
    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle different event types', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'mouseup' }));

    act(() => {
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle touchstart event type', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'touchstart' }));

    act(() => {
      document.dispatchEvent(new TouchEvent('touchstart', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle touchend event type', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'touchend' }));

    act(() => {
      document.dispatchEvent(new TouchEvent('touchend', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle focusin event type', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'focusin' }));

    act(() => {
      const focusEvent = new FocusEvent('focusin', { bubbles: true });
      document.dispatchEvent(focusEvent);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle focusout event type', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'focusout' }));

    act(() => {
      const focusEvent = new FocusEvent('focusout', { bubbles: true });
      document.dispatchEvent(focusEvent);
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle null ref', () => {
    const handler = jest.fn();
    const ref: RefObject<HTMLDivElement> = { current: null };

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    // Should still call handler when ref is null (treated as outside)
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle null ref in array', () => {
    const handler = jest.fn();
    const ref1: RefObject<HTMLDivElement> = { current: null };
    const ref2 = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    // Should call handler if clicking outside the non-null ref
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should handle ref changing from null to element', () => {
    const handler = jest.fn();
    const ref: RefObject<HTMLDivElement> = { current: null };

    const { rerender } = renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);

    // Update ref to have an element
    ref.current = document.createElement('div');
    rerender();

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: ref.current, configurable: true });
      document.dispatchEvent(insideEvent);
    });
    expect(handler).toHaveBeenCalledTimes(1); // Not called again
  });

  it('should handle ref changing from element to null', () => {
    const handler = jest.fn();
    const element = document.createElement('div');
    const ref: RefObject<HTMLDivElement> = { current: element };

    const { rerender } = renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: element, configurable: true });
      document.dispatchEvent(insideEvent);
    });
    expect(handler).not.toHaveBeenCalled();

    // Update ref to null
    ref.current = null;
    rerender();

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should use latest handler version', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    const ref = { current: document.createElement('div') };

    const { rerender } = renderHook(({ handler }) => useOnClickOutside(ref, handler), {
      initialProps: { handler: handler1 },
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).not.toHaveBeenCalled();

    rerender({ handler: handler2 });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('should handle event listener options', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    renderHook(() =>
      useOnClickOutside(ref, handler, {
        eventType: 'mousedown',
        eventListenerOptions: { capture: true, once: true },
      })
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), {
      capture: true,
      once: true,
    });
  });

  it('should handle SSR (document undefined)', () => {
    const handler = jest.fn();
    const ref = { current: document.createElement('div') };
    const originalDocument = global.document;

    // @ts-expect-error - Testing SSR scenario
    global.document = undefined;

    // Should not throw
    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    // Restore document
    global.document = originalDocument;

    unmount();
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle nested elements (child of ref element)', () => {
    const handler = jest.fn();
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    const ref = { current: parent };

    renderHook(() => useOnClickOutside(ref, handler));

    act(() => {
      const insideEvent = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(insideEvent, 'target', { value: child, configurable: true });
      document.dispatchEvent(insideEvent);
    });

    // Should not call handler when clicking on child (inside parent)
    expect(handler).not.toHaveBeenCalled();
  });
});
