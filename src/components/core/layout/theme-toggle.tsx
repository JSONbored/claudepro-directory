'use client';

import { useEffect, useRef, useState } from 'react';
import { Switch } from '@/src/components/primitives/ui/switch';
import { useViewTransition } from '@/src/hooks/use-view-transition';
import { Moon, Sun } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Type guard for theme validation
 * Replaces Zod schema for bundle size optimization
 */
function isValidTheme(value: unknown): value is 'light' | 'dark' {
  return value === 'light' || value === 'dark';
}

/**
 * Theme Toggle Component with Circle Blur Animation
 *
 * Features:
 * - View Transitions API for smooth circular reveal animation
 * - Click position tracking for animation origin
 * - Progressive enhancement (fallback to instant transition)
 * - localStorage persistence
 * - Accessibility support (keyboard, screen readers)
 *
 * Animation:
 * - Chrome/Edge 111+: Circular blur expansion from click position
 * - Firefox/Safari: Instant theme change (no animation)
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [transitionMs, setTransitionMs] = useState(200);
  const containerRef = useRef<HTMLDivElement>(null);
  const { startTransition, isSupported } = useViewTransition();

  // Load transition duration from config
  useEffect(() => {
    import('@/src/lib/flags').then(({ timeoutConfigs }) =>
      timeoutConfigs().then((config) => {
        setTransitionMs((config['timeout.ui.transition_ms'] as number) ?? 200);
      })
    );
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const saved = savedTheme && isValidTheme(savedTheme) ? savedTheme : null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');

    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  /**
   * Calculate click position as percentage of viewport
   * Used to set animation origin for circular reveal
   */
  const getClickPosition = (event: React.MouseEvent | React.KeyboardEvent) => {
    // For keyboard events, use center of switch element
    if (!('clientX' in event)) {
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
   * Set CSS variables for animation origin
   * Must be done before view transition starts
   */
  const setAnimationOrigin = (x: number, y: number) => {
    document.documentElement.style.setProperty('--x', `${x}%`);
    document.documentElement.style.setProperty('--y', `${y}%`);
  };

  /**
   * Async localStorage write - deferred to prevent blocking animations
   * Uses requestIdleCallback for true non-blocking persistence
   */
  const saveThemeToStorage = (newTheme: 'light' | 'dark') => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        localStorage.setItem('theme', newTheme);
      });
    } else {
      // Fallback for Safari (no requestIdleCallback)
      setTimeout(() => {
        localStorage.setItem('theme', newTheme);
      }, 0);
    }
  };

  /**
   * Handle theme toggle with View Transition animation
   * Captures click position for circular reveal effect
   *
   * Performance optimizations:
   * - DOM updates before React state (prevents blocking)
   * - Deferred React state update (after animation starts)
   * - localStorage write deferred to requestIdleCallback (non-blocking)
   *
   * Performance monitoring (development only):
   * - Tracks animation start/end timing
   * - Measures total interaction latency
   */
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const startTime = performance.now();
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // If View Transitions API is supported, use it
    if (isSupported) {
      const { x, y } = getClickPosition(event);
      setAnimationOrigin(x, y);

      // Start view transition with DOM-only updates (no React state yet)
      const transition = startTransition(() => {
        // Update DOM immediately (this is what the animation sees)
        document.documentElement.setAttribute('data-theme', newTheme);
      });

      // Defer localStorage write to prevent blocking animation
      saveThemeToStorage(newTheme);

      // Update React state after animation starts (non-blocking)
      // This prevents React re-render from blocking the animation
      requestAnimationFrame(() => {
        setTheme(newTheme);
      });

      // Performance monitoring (development only)
      if (process.env.NODE_ENV === 'development' && transition) {
        transition.finished
          .then(() => {
            const endTime = performance.now();
            // biome-ignore lint/suspicious/noConsole: Development-only performance monitoring
            console.log(
              `[Theme Toggle] Animation completed in ${(endTime - startTime).toFixed(2)}ms`
            );
          })
          .catch(() => {
            // Silently ignore animation errors
          });
      }
    } else {
      // Fallback: Use CSS transition for smooth color change
      document.documentElement.classList.add('theme-transition');

      setTheme(newTheme);
      saveThemeToStorage(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);

      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, transitionMs);
    }
  };

  if (!theme) return null;

  return (
    <div ref={containerRef} className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
      <Sun className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} aria-hidden="true" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => {
          // Fallback for keyboard/programmatic changes without click event
          const newTheme = checked ? 'dark' : 'light';

          if (isSupported) {
            // Use center of switch for keyboard navigation
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
              const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
              setAnimationOrigin(x, y);
            }

            startTransition(() => {
              document.documentElement.setAttribute('data-theme', newTheme);
            });

            // Defer localStorage write to prevent blocking
            saveThemeToStorage(newTheme);

            requestAnimationFrame(() => {
              setTheme(newTheme);
            });
          } else {
            document.documentElement.classList.add('theme-transition');
            setTheme(newTheme);
            saveThemeToStorage(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme);
            setTimeout(() => {
              document.documentElement.classList.remove('theme-transition');
            }, transitionMs);
          }
        }}
        onClick={handleToggle}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      />
      <Moon className={`${UI_CLASSES.ICON_SM} text-muted-foreground`} aria-hidden="true" />
    </div>
  );
}
