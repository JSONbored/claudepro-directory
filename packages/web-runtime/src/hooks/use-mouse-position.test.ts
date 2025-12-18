import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMousePosition, type Position } from './use-mouse-position';

describe('useMousePosition', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let mouseMoveHandler: ((event: MouseEvent) => void) | null = null;

  beforeEach(() => {
    // Mock window.addEventListener to capture the handler
    addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'mousemove') {
        mouseMoveHandler = handler as (event: MouseEvent) => void;
      }
    });

    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener').mockImplementation(() => {});

    // Mock getBoundingClientRect for element refs
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 100,
      top: 200,
      right: 300,
      bottom: 400,
      width: 200,
      height: 200,
      x: 100,
      y: 200,
      toJSON: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mouseMoveHandler = null;
  });

  it('should initialize with default position (0, 0, undefined, undefined)', () => {
    const { result } = renderHook(() => useMousePosition());

    const [position, ref] = result.current;

    expect(position).toEqual({
      x: 0,
      y: 0,
      elementX: undefined,
      elementY: undefined,
    });
    expect(ref.current).toBeNull();
  });

  it('should attach mousemove event listener on mount', () => {
    renderHook(() => useMousePosition());

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should update global position on mouse move', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 250,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    const [position] = result.current;
    expect(position.x).toBe(150);
    expect(position.y).toBe(250);
    expect(position.elementX).toBeUndefined();
    expect(position.elementY).toBeUndefined();
  });

  it('should calculate element-relative coordinates when ref is attached', () => {
    const { result } = renderHook(() => useMousePosition<HTMLDivElement>());

    // Attach ref to a mock element
    const mockElement = document.createElement('div');
    act(() => {
      result.current[1].current = mockElement as HTMLDivElement;
    });

    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 250,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    const [position] = result.current;
    expect(position.x).toBe(150);
    expect(position.y).toBe(250);
    // elementX = 150 - 100 (rect.left) = 50
    expect(position.elementX).toBe(50);
    // elementY = 250 - 200 (rect.top) = 50
    expect(position.elementY).toBe(50);
  });

  it('should not calculate element-relative coordinates when ref is null', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 250,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    const [position] = result.current;
    expect(position.elementX).toBeUndefined();
    expect(position.elementY).toBeUndefined();
  });

  it('should update element-relative coordinates when ref changes', () => {
    const { result } = renderHook(() => useMousePosition<HTMLDivElement>());

    // First, move mouse without ref
    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 150,
          clientY: 250,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    let [position] = result.current;
    expect(position.elementX).toBeUndefined();
    expect(position.elementY).toBeUndefined();

    // Attach ref
    const mockElement = document.createElement('div');
    act(() => {
      result.current[1].current = mockElement as HTMLDivElement;
    });

    // Move mouse again
    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 200,
          clientY: 300,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    [position] = result.current;
    expect(position.elementX).toBe(100); // 200 - 100
    expect(position.elementY).toBe(100); // 300 - 200
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useMousePosition());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('should handle multiple mouse move events', () => {
    const { result } = renderHook(() => useMousePosition());

    act(() => {
      if (mouseMoveHandler) {
        mouseMoveHandler(new MouseEvent('mousemove', { clientX: 100, clientY: 200 }));
      }
    });

    let [position] = result.current;
    expect(position.x).toBe(100);
    expect(position.y).toBe(200);

    act(() => {
      if (mouseMoveHandler) {
        mouseMoveHandler(new MouseEvent('mousemove', { clientX: 300, clientY: 400 }));
      }
    });

    [position] = result.current;
    expect(position.x).toBe(300);
    expect(position.y).toBe(400);
  });

  it('should handle element with different bounding rect', () => {
    const { result } = renderHook(() => useMousePosition<HTMLDivElement>());

    const mockElement = document.createElement('div');
    (mockElement.getBoundingClientRect as ReturnType<typeof vi.fn>) = vi.fn(() => ({
      left: 50,
      top: 75,
      right: 250,
      bottom: 275,
      width: 200,
      height: 200,
      x: 50,
      y: 75,
      toJSON: vi.fn(),
    }));

    act(() => {
      result.current[1].current = mockElement as HTMLDivElement;
    });

    act(() => {
      if (mouseMoveHandler) {
        const mockEvent = new MouseEvent('mousemove', {
          clientX: 125,
          clientY: 150,
        });
        mouseMoveHandler(mockEvent);
      }
    });

    const [position] = result.current;
    expect(position.elementX).toBe(75); // 125 - 50
    expect(position.elementY).toBe(75); // 150 - 75
  });

  it('should return stable ref across re-renders', () => {
    const { result, rerender } = renderHook(() => useMousePosition());

    const firstRef = result.current[1];

    rerender();

    const secondRef = result.current[1];
    expect(firstRef).toBe(secondRef);
  });

  it('should handle SSR (window undefined)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - Intentionally setting window to undefined for SSR test
    global.window = undefined;

    const { result } = renderHook(() => useMousePosition());

    const [position, ref] = result.current;
    expect(position).toEqual({
      x: 0,
      y: 0,
      elementX: undefined,
      elementY: undefined,
    });
    expect(ref.current).toBeNull();
    expect(addEventListenerSpy).not.toHaveBeenCalled();

    // Restore window
    global.window = originalWindow;
  });
});
