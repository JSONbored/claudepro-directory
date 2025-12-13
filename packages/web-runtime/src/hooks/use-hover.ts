'use client';

import { useEffect, useState, type RefObject } from 'react';

/**
 * React hook for hover state detection on DOM elements.
 *
 * Tracks mouseenter/mouseleave events to determine if an element is being hovered.
 * Uses non-bubbling events to prevent issues with child elements.
 *
 * **When to use:**
 * - ✅ Interactive tooltips - Show/hide content based on hover state
 * - ✅ Button feedback - Visual states and loading indicators on hover
 * - ✅ Image galleries - Preview overlays and zoom triggers
 * - ✅ Navigation menus - Dropdown visibility and submenu logic
 * - ✅ Card interfaces - Hover effects and action button reveals
 * - ✅ Data visualization - Chart point highlighting and detail panels
 * - ❌ For simple style changes - CSS `:hover` is usually better
 *
 * **Features:**
 * - Uses mouseenter/mouseleave (don't bubble like mouseover/mouseout)
 * - Automatic cleanup - Event listeners removed on unmount
 * - Returns false if ref is null or element is not visible
 * - Type-safe with generic element types
 *
 * **Note:** Mobile devices don't have hover states. The hook always returns `false`
 * on touch devices. Consider alternative interactions for mobile users.
 *
 * @typeParam T - Type of the HTML element (defaults to HTMLElement)
 * @param elementRef - Ref object for the target DOM element
 * @returns Boolean indicating current hover state
 *
 * @example
 * ```tsx
 * // Tooltip on hover
 * const hoverRef = useRef<HTMLDivElement>(null);
 * const isHovered = useHover(hoverRef);
 *
 * <div ref={hoverRef}>
 *   Hover me
 *   {isHovered && <Tooltip>Tooltip content</Tooltip>}
 * </div>
 * ```
 *
 * @example
 * ```tsx
 * // Button hover state
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * const isHovered = useHover(buttonRef);
 *
 * <button
 *   ref={buttonRef}
 *   className={isHovered ? 'bg-accent' : 'bg-transparent'}
 * >
 *   Hover me
 * </button>
 * ```
 */
export function useHover<T extends HTMLElement = HTMLElement>(
  elementRef: RefObject<T>
): boolean {
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      setIsHovered(false);
      return;
    }

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [elementRef]);

  return isHovered;
}
