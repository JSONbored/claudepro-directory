'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Options for useScrollLock hook
 */
export interface UseScrollLockOptions {
  /**
   * Whether to lock scroll automatically on component mount
   * @default true
   */
  autoLock?: boolean;
  /**
   * Target element to lock (element or CSS selector)
   * @default document.body
   */
  lockTarget?: HTMLElement | string;
  /**
   * Whether to prevent width reflow by adding padding compensation
   * @default true
   */
  widthReflow?: boolean;
}

/**
 * React hook for preventing document or element scrolling.
 *
 * Locks scrolling on the target element (default: document.body) to prevent background
 * scrolling when modals or overlays are active. Automatically compensates for scrollbar
 * width to prevent layout shifts.
 *
 * **When to use:**
 * - ✅ Modal dialogs - Prevent background scrolling when overlays are active
 * - ✅ Mobile navigation - Lock body scroll when slide-out menus are open
 * - ✅ Lightbox galleries - Stop page scrolling during image/video viewing
 * - ✅ Form overlays - Prevent background interaction during multi-step processes
 * - ✅ Loading screens - Lock scroll during full-screen loading states
 * - ✅ Game interfaces - Prevent accidental scrolling during interactive gameplay
 * - ❌ For basic scroll management - CSS overflow controls are usually better
 *
 * **Features:**
 * - Automatic locking on mount (configurable)
 * - Manual control with lock/unlock functions
 * - Width reflow prevention - Compensates for scrollbar width to prevent layout shifts
 * - Custom targets - Lock scroll on specific elements or document body
 * - Style restoration - Automatically restores original styles when unlocking
 * - SSR compatible - Safely handles server-side rendering
 *
 * **Note:** The hook measures scrollbar width and adds padding compensation to prevent
 * content jumping when scrollbars hide. This calculation happens on mount and when locking.
 *
 * @param options - Configuration options
 * @returns Object with `isLocked`, `lock`, and `unlock` methods
 *
 * @example
 * ```tsx
 * // Automatic locking
 * const { isLocked } = useScrollLock();
 *
 * {isLocked && <Modal>Content</Modal>}
 * ```
 *
 * @example
 * ```tsx
 * // Manual control
 * const { lock, unlock } = useScrollLock({ autoLock: false });
 *
 * <button onClick={lock}>Lock Scroll</button>
 * <button onClick={unlock}>Unlock Scroll</button>
 * ```
 *
 * @example
 * ```tsx
 * // Custom target element
 * const { lock } = useScrollLock({
 *   lockTarget: '.my-scrollable-container',
 * });
 * ```
 */
export function useScrollLock(options: UseScrollLockOptions = {}): {
  isLocked: boolean;
  lock: () => void;
  unlock: () => void;
} {
  // SSR-safe default: Use function to lazily evaluate document.body
  const getDefaultLockTarget = (): HTMLElement | string => {
    if (typeof document === 'undefined') {
      return 'body'; // Fallback to string selector for SSR
    }
    return document.body;
  };

  const { autoLock = true, lockTarget = getDefaultLockTarget(), widthReflow = true } = options;

  const [isLocked, setIsLocked] = useState(false);
  const originalStyleRef = useRef<{
    overflow: string;
    paddingRight: string;
  } | null>(null);

  const getTargetElement = (): HTMLElement | null => {
    if (typeof document === 'undefined') {
      return null;
    }

    if (typeof lockTarget === 'string') {
      return document.querySelector<HTMLElement>(lockTarget);
    }

    return lockTarget;
  };

  const getScrollbarWidth = (): number => {
    if (typeof document === 'undefined') {
      return 0;
    }

    // Create a temporary element to measure scrollbar width
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    // @ts-expect-error - msOverflowStyle is IE-specific and not in types
    outer.style.msOverflowStyle = 'scrollbar';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  };

  const lock = () => {
    const element = getTargetElement();
    if (!element) {
      return;
    }

    // Save original styles
    if (!originalStyleRef.current) {
      originalStyleRef.current = {
        overflow: element.style.overflow,
        paddingRight: element.style.paddingRight,
      };
    }

    // Calculate scrollbar width and apply padding
    if (widthReflow) {
      const scrollbarWidth = getScrollbarWidth();
      const currentPaddingRight = parseInt(window.getComputedStyle(element).paddingRight, 10) || 0;

      element.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    // Lock scroll
    element.style.overflow = 'hidden';
    setIsLocked(true);
  };

  const unlock = () => {
    const element = getTargetElement();
    if (!element || !originalStyleRef.current) {
      return;
    }

    // Restore original styles
    element.style.overflow = originalStyleRef.current.overflow;
    element.style.paddingRight = originalStyleRef.current.paddingRight;

    originalStyleRef.current = null;
    setIsLocked(false);
  };

  // Auto-lock on mount
  useEffect(() => {
    if (autoLock) {
      lock();
    }

    return () => {
      if (autoLock) {
        unlock();
      }
    };
  }, [autoLock]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isLocked,
    lock,
    unlock,
  };
}
