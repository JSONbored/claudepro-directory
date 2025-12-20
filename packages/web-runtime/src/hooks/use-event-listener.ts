'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * React hook for DOM event listeners with automatic cleanup and TypeScript safety.
 *
 * Simplifies adding and removing event listeners with proper cleanup, ref handling,
 * and support for multiple event targets (window, document, DOM elements, media queries).
 *
 * **When to use:**
 * - ✅ Keyboard shortcuts - Global key handlers
 * - ✅ Scroll tracking - Window or element scroll monitoring
 * - ✅ Outside click detection - Close dropdowns and modals on outside clicks
 * - ✅ Resize handling - Responsive behavior for window size changes
 * - ✅ Visibility tracking - Detect when elements enter/leave viewport
 * - ✅ Mouse interactions - Track mouse movements and gestures
 * - ✅ Touch events - Mobile touch and swipe gesture handling
 * - ✅ Media query changes - Responsive breakpoint detection
 * - ❌ For simple component clicks - Use `onClick` props instead
 *
 * **Features:**
 * - Versatile targets - window, document, DOM elements, or media query lists
 * - Automatic cleanup - Event listeners removed on unmount or dependency changes
 * - Type safety - Full TypeScript support with proper event type inference
 * - Performance optimized - Handler function stored in ref to prevent unnecessary re-renders
 * - Multiple overloads - Different interfaces for different event targets
 * - Modern API - Uses standard addEventListener/removeEventListener
 *
 * @typeParam K - Type of the event name
 * @typeParam T - Type of the event target
 * @param eventName - The event type to listen for
 * @param handler - The event handler function
 * @param element - Optional element ref (defaults to window)
 * @param options - Optional addEventListener options
 *
 * @example
 * ```tsx
 * // Window events
 * useEventListener('resize', () => {
 *   console.log('Window resized');
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Element events with ref
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useEventListener('click', handleClick, buttonRef);
 * ```
 *
 * @example
 * ```tsx
 * // Keyboard shortcuts
 * useEventListener('keydown', (e) => {
 *   if (e.key === 'Escape') {
 *     closeModal();
 *   }
 * });
 * ```
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: undefined,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener<K extends keyof DocumentEventMap, T extends Document = Document>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element: RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener<
  K extends keyof HTMLElementEventMap,
  T extends HTMLElement = HTMLElement,
>(
  eventName: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  element: RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener<
  K extends string,
  T extends HTMLElement | MediaQueryList = HTMLElement,
>(
  eventName: K,
  handler: (event: Event) => void,
  element?: RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
): void;
export function useEventListener<
  K extends keyof WindowEventMap | keyof DocumentEventMap | keyof HTMLElementEventMap | string,
  T extends Window | Document | HTMLElement | MediaQueryList = Window,
>(
  eventName: K,
  handler: (event: any) => void,
  element?: RefObject<T> | T | null,
  options?: boolean | AddEventListenerOptions
): void {
  const handlerRef = useRef(handler);

  // Store latest handler in ref to avoid stale closures
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement: T | null =
      element === undefined
        ? (window as unknown as T)
        : element && 'current' in element
          ? element.current
          : element;

    if (!targetElement) {
      return;
    }

    const eventListener = (event: Event) => {
      handlerRef.current(event);
    };

    targetElement.addEventListener(eventName as string, eventListener, options);

    return () => {
      targetElement.removeEventListener(eventName as string, eventListener, options);
    };
  }, [eventName, element, options]);
}
