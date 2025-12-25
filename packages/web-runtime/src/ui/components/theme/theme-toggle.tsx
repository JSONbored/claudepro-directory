'use client';

/**
 * Theme Toggle Component with Beautiful Motion.dev Animations
 *
 * Features:
 * - Motion.dev-based smooth circle expansion animation
 * - Click position tracking for animation origin
 * - Spring physics for natural, beautiful motion
 * - localStorage persistence
 * - Accessibility support (keyboard, screen readers)
 * - Optimized performance (GPU-accelerated, no expensive filters)
 *
 * Animation:
 * - Beautiful circle expansion from click position using Motion.dev
 * - Spring physics for natural, smooth motion
 * - Opacity + clip-path for optimal GPU acceleration
 * - Respects reduced motion preferences
 *
 * Performance Optimizations:
 * - Uses only opacity and clip-path (GPU-accelerated)
 * - No blur or brightness filters (prevents jank)
 * - Spring physics for natural feel
 * - Smooth, beautiful transitions
 *
 * @module web-runtime/ui/components/theme/theme-toggle
 *
 * @example Basic usage
 * ```tsx
 * <ThemeToggle />
 * ```
 */

import { useEffect, useRef } from 'react';
import { useAnimate, useReducedMotion } from 'motion/react';
import { SPRING } from '../../../design-system/index.ts';
import { useTernaryDarkMode } from '../../../hooks/use-ternary-dark-mode.ts';
import { Moon, Sun } from '../../../icons.tsx';
import { ThemeToggleLayout } from './theme-toggle-layout.tsx';

/**
 * ThemeToggle Component
 *
 * Sun/Moon toggle with beautiful Motion.dev animations for
 * smooth, natural theme transitions with circle expansion effect.
 *
 * Enhanced with useTernaryDarkMode (Phase 2):
 * - Supports light/dark/system modes
 * - Automatically syncs with OS preference when in 'system' mode
 * - Persists user choice to localStorage
 * - Beautiful Motion.dev spring animations
 */
export function ThemeToggle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [, animate] = useAnimate();
  const shouldReduceMotion = useReducedMotion();

  // Use ternary dark mode hook for light/dark/system support
  const { isDarkMode, ternaryDarkMode, toggleTernaryDarkMode } = useTernaryDarkMode({
    defaultValue: 'system',
    localStorageKey: 'theme-mode', // Different key to avoid conflicts with old 'theme' key
  });

  // Sync data-theme attribute with computed isDarkMode
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDarkMode]);

  /**
   * Calculate click position as percentage of viewport
   * Used to set animation origin for circular reveal
   */
  const getClickPosition = (event?: React.MouseEvent | React.KeyboardEvent) => {
    // For keyboard events or no event, use center of switch element
    if (!event || !('clientX' in event)) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 50, y: 50 };
      return {
        x: ((rect.left + rect.width / 2) / window.innerWidth) * 100,
        y: ((rect.top + rect.height / 2) / window.innerHeight) * 100,
      };
    }

    // For mouse events, use actual click position
    return {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100,
    };
  };

  /**
   * Handle theme toggle with beautiful Motion.dev animation
   * Creates smooth circle expansion from click position
   *
   * Cycles through: light -> system -> dark -> light
   *
   * Animation approach:
   * - Creates a full-screen overlay with new theme background
   * - Animates circle expansion from click position
   * - Uses spring physics for natural, beautiful motion
   * - Updates theme during animation for seamless transition
   */
  const handleThemeChange = async (event?: React.MouseEvent) => {
    // Skip animation if reduced motion is preferred
    if (shouldReduceMotion) {
      toggleTernaryDarkMode();
      return;
    }

    // Get click position for animation origin
    const position = getClickPosition(event);

    // Calculate new theme
    const newIsDarkMode =
      ternaryDarkMode === 'light'
        ? false // light -> system (will compute based on OS)
        : ternaryDarkMode === 'system'
          ? true // system -> dark
          : false; // dark -> light
    const newTheme = newIsDarkMode ? 'dark' : 'light';

    // Update theme FIRST so we can get the correct background color
    const html = document.documentElement;
    html.setAttribute('data-theme', newTheme);
    html.classList.toggle('dark', newIsDarkMode);
    html.classList.remove('light');
    if (!newIsDarkMode) {
      html.classList.add('light');
    }

    // Toggle ternary mode (this will update isDarkMode and persist to localStorage)
    toggleTernaryDarkMode();

    // Force a reflow to ensure theme update is applied
    html.offsetHeight;

    // Get the new background color from computed styles (now that theme is applied)
    const newBg =
      getComputedStyle(html).getPropertyValue('--background').trim() ||
      (newTheme === 'dark' ? 'oklch(22.21% 0 0)' : 'oklch(100% 0 0)'); // fallback to tweakcn values

    // Create overlay element if it doesn't exist
    let overlay = overlayRef.current;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: var(--z-100);
        background-color: ${newBg};
        clip-path: circle(0% at ${position.x}% ${position.y}%);
        opacity: 0;
        will-change: clip-path, opacity;
        transform: translateZ(0);
      `;
      document.body.appendChild(overlay);
      overlayRef.current = overlay;
    } else {
      // Update overlay for new animation
      overlay.style.backgroundColor = newBg;
      overlay.style.clipPath = `circle(0% at ${position.x}% ${position.y}%)`;
      overlay.style.opacity = '0';
    }

    // Force a reflow to ensure overlay is ready for animation
    overlay.offsetHeight;

    // Animate circle expansion with spring physics for beautiful, natural motion
    await animate(
      overlay,
      {
        clipPath: `circle(200% at ${position.x}% ${position.y}%)`,
        opacity: [0, 1, 1, 0],
      },
      {
        ...SPRING.smooth, // Beautiful spring physics for natural motion
        duration: 0.4, // Slightly faster for snappier feel (was 0.5)
      }
    );

    // Clean up overlay after animation completes
    if (overlayRef.current) {
      overlayRef.current.remove();
      overlayRef.current = null;
    }
  };

  // Determine toggle checked state and label
  // When in 'system' mode, show the computed isDarkMode state
  const toggleChecked = isDarkMode;
  const ariaLabel =
    ternaryDarkMode === 'system'
      ? 'System theme (follows OS preference)'
      : `Switch to ${ternaryDarkMode === 'light' ? 'dark' : 'light'} mode`;

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <Sun className="text-muted-foreground h-4 w-4" aria-hidden="true" />
      <ThemeToggleLayout
        checked={toggleChecked}
        onCheckedChange={(_checked, event) => {
          // Pass the click event for animation origin
          handleThemeChange(event);
        }}
        aria-label={ariaLabel}
      />
      <Moon className="text-muted-foreground h-4 w-4" aria-hidden="true" />
    </div>
  );
}
