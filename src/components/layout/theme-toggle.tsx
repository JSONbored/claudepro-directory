'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Switch } from '@/src/components/ui/switch';
import { useViewTransition } from '@/src/hooks/use-view-transition';
import { Moon, Sun } from '@/src/lib/icons';

const themeSchema = z.enum(['light', 'dark']);

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
  const containerRef = useRef<HTMLDivElement>(null);
  const { startTransition, isSupported } = useViewTransition();

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const validatedTheme = savedTheme ? themeSchema.safeParse(savedTheme) : null;
    const saved = validatedTheme?.success ? validatedTheme.data : null;
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
   * Handle theme toggle with View Transition animation
   * Captures click position for circular reveal effect
   */
  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const checked = theme === 'light'; // Toggle to opposite
    const newTheme = checked ? 'dark' : 'light';

    // If View Transitions API is supported, use it
    if (isSupported) {
      const { x, y } = getClickPosition(event);
      setAnimationOrigin(x, y);

      startTransition(() => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
      });
    } else {
      // Fallback: Use CSS transition for smooth color change
      document.documentElement.classList.add('theme-transition');

      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);

      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition');
      }, 300);
    }
  };

  if (!theme) return null;

  return (
    <div ref={containerRef} className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={(checked) => {
          // Fallback for keyboard/programmatic changes without click event
          const newTheme = checked ? 'dark' : 'light';
          document.documentElement.classList.add('theme-transition');
          setTheme(newTheme);
          localStorage.setItem('theme', newTheme);
          document.documentElement.setAttribute('data-theme', newTheme);
          setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
          }, 300);
        }}
        onClick={handleToggle}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
