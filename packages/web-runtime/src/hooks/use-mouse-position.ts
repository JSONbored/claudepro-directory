'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Mouse position object with global and element-relative coordinates
 */
export interface Position {
  x: number;
  y: number;
  elementX: number | undefined;
  elementY: number | undefined;
}

/**
 * React hook for tracking mouse position with global and element-relative coordinates.
 *
 * Provides real-time cursor coordinates both globally (viewport-relative) and relative
 * to a specific element. Optimized for performance with efficient event handling.
 *
 * **When to use:**
 * - ✅ Custom tooltips - Position tooltips precisely relative to cursor location
 * - ✅ Drag and drop - Track drag operations with smooth coordinate updates
 * - ✅ Interactive graphics - Canvas drawing or SVG manipulation based on cursor position
 * - ✅ Custom cursors - Create follow-cursor effects or cursor-based animations
 * - ✅ Proximity effects - Trigger animations based on cursor distance from elements
 * - ✅ Crosshair overlays - Build design tools with cursor-based measurement or selection
 * - ❌ For basic hover effects - CSS `:hover` is usually better
 *
 * **Features:**
 * - Dual coordinate systems: global (viewport) and element-relative
 * - Real-time tracking with optimized mousemove event handling
 * - Automatic cleanup - Event listeners removed on unmount
 * - Type-safe with generic element types
 * - Element coordinates only available when ref is attached
 *
 * **Performance:**
 * - Mouse events fire frequently (60+ times per second)
 * - If doing expensive calculations, wrap them in `useMemo` or `useCallback`
 * - Consider debouncing or throttling for heavy operations
 *
 * **Note:** This hook only tracks mouse events, not touch. Mobile devices don't have
 * a persistent cursor position. Consider alternative interaction patterns for mobile.
 *
 * @typeParam T - Type of the HTML element (defaults to HTMLElement)
 * @returns Tuple `[position, ref]` where position contains coordinates and ref attaches to element
 *
 * @example
 * ```tsx
 * // Global coordinates only
 * const [position, ref] = useMousePosition();
 *
 * <div>
 *   Mouse at: {position.x}, {position.y}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Element-relative coordinates
 * const [position, ref] = useMousePosition<HTMLDivElement>();
 *
 * <div ref={ref}>
 *   Mouse relative to element: {position.elementX}, {position.elementY}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Custom tooltip positioning
 * const [position, ref] = useMousePosition();
 *
 * <div ref={ref}>Hover me</div>
 * {position.elementX !== undefined && (
 *   <Tooltip
 *     style={{
 *       left: position.x + 10,
 *       top: position.y - 30,
 *     }}
 *   >
 *     Tooltip
 *   </Tooltip>
 * )}
 * ```
 */
export function useMousePosition<T extends HTMLElement = HTMLElement>(): [
  Position,
  RefObject<T | null>,
] {
  const [position, setPosition] = useState<Position>({
    x: 0,
    y: 0,
    elementX: undefined,
    elementY: undefined,
  });
  const elementRef = useRef<T | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      setPosition(() => {
        const newPosition: Position = {
          x: event.clientX,
          y: event.clientY,
          elementX: undefined,
          elementY: undefined,
        };

        // Calculate element-relative coordinates if ref is attached
        const element = elementRef.current;
        if (element) {
          const rect = element.getBoundingClientRect();
          newPosition.elementX = event.clientX - rect.left;
          newPosition.elementY = event.clientY - rect.top;
        }

        return newPosition;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return [position, elementRef];
}
