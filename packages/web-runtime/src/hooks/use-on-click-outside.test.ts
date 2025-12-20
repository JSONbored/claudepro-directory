import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOnClickOutside } from './use-on-click-outside.ts';

describe('useOnClickOutside', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call handler when clicking outside element', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler));

    // Click outside
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).toHaveBeenCalled();
  });

  it('should not call handler when clicking inside element', () => {
    const handler = vi.fn();
    const element = document.createElement('div');
    const ref = { current: element };

    renderHook(() => useOnClickOutside(ref, handler));

    // Click inside
    const insideEvent = new MouseEvent('mousedown', { bubbles: true });
    Object.defineProperty(insideEvent, 'target', { value: element });

    document.dispatchEvent(insideEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle multiple refs', () => {
    const handler = vi.fn();
    const ref1 = { current: document.createElement('div') };
    const ref2 = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside([ref1, ref2], handler));

    // Click outside both
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(handler).toHaveBeenCalled();
  });

  it('should cleanup on unmount', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') };
    const removeEventListener = vi.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => useOnClickOutside(ref, handler));

    unmount();

    expect(removeEventListener).toHaveBeenCalled();
  });

  it('should handle different event types', () => {
    const handler = vi.fn();
    const ref = { current: document.createElement('div') };

    renderHook(() => useOnClickOutside(ref, handler, { eventType: 'mouseup' }));

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(handler).toHaveBeenCalled();
  });
});
