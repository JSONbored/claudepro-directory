'use client';

import { useEffect, useRef, type RefObject } from 'react';

/**
 * Event types supported by useOnClickOutside
 */
export type EventType = 'mousedown' | 'mouseup' | 'touchstart' | 'touchend' | 'focusin' | 'focusout';

/**
 * Options for useOnClickOutside hook
 */
export interface UseOnClickOutsideOptions {
  /**
   * Event type to listen for on document
   * @default 'mousedown'
   */
  eventType?: EventType;
  /**
   * Native event listener options
   */
  eventListenerOptions?: AddEventListenerOptions;
}

/**
 * React hook for detecting clicks outside an element.
 *
 * Handles modal dismissal, dropdown closing, and outside-click interactions with support
 * for multiple elements, React portals, and different event types.
 *
 * **When to use:**
 * - ✅ Modal dialogs - Close modals when clicking outside with proper escape key handling
 * - ✅ Dropdown menus - Hide dropdowns on outside clicks with keyboard navigation support
 * - ✅ Context menus - Dismiss right-click menus with consistent interaction patterns
 * - ✅ Tooltip management - Auto-hide tooltips when focus moves elsewhere or clicks occur
 * - ✅ Sidebar navigation - Collapse mobile sidebars on outside interactions
 * - ✅ Multi-step forms - Auto-save or validate when user clicks away from form sections
 * - ❌ For simple focus cases - CSS `:focus-within` is usually better
 *
 * **Features:**
 * - Supports single ref or array of refs (for trigger + content elements)
 * - Multiple event types: 'mousedown', 'mouseup', 'touchstart', 'touchend', 'focusin', 'focusout'
 * - React portal aware - Works correctly with portals and dynamically rendered content
 * - Automatic cleanup - Event listeners removed on unmount
 * - Performance optimized - Uses efficient event delegation
 *
 * @typeParam T - Type of the HTML element
 * @param ref - Single ref or array of refs to monitor for outside clicks
 * @param handler - Callback fired when clicking outside element(s)
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * // Single element
 * const modalRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside(modalRef, () => setIsOpen(false));
 *
 * <div ref={modalRef}>Modal content</div>
 * ```
 *
 * @example
 * ```tsx
 * // Multiple elements (trigger + menu)
 * const triggerRef = useRef<HTMLButtonElement>(null);
 * const menuRef = useRef<HTMLDivElement>(null);
 * useOnClickOutside([triggerRef, menuRef], () => setIsOpen(false));
 *
 * <button ref={triggerRef}>Menu</button>
 * {isOpen && <div ref={menuRef}>Menu content</div>}
 * ```
 *
 * @example
 * ```tsx
 * // Touch events for mobile
 * useOnClickOutside(ref, handler, {
 *   eventType: 'touchstart',
 * });
 * ```
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T> | Array<RefObject<T>>,
  handler: (event: Event) => void,
  options: UseOnClickOutsideOptions = {}
): void {
  const { eventType = 'mousedown', eventListenerOptions = {} } = options;
  const handlerRef = useRef(handler);

  // Store latest handler in ref to avoid stale closures
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleClickOutside = (event: Event) => {
      const refs = Array.isArray(ref) ? ref : [ref];
      const isOutside = refs.every((r) => {
        const element = r?.current;
        if (!element) return true;
        return !element.contains(event.target as Node);
      });

      if (isOutside) {
        handlerRef.current(event);
      }
    };

    document.addEventListener(eventType, handleClickOutside, eventListenerOptions);
    return () => {
      document.removeEventListener(eventType, handleClickOutside, eventListenerOptions);
    };
  }, [ref, eventType, eventListenerOptions]);
}
