/**
 * Mode Toggle Component - shadcn/ui Pattern
 *
 * Three-option theme switcher (Light, Dark, System) using dropdown menu.
 * Replaces custom switch-based toggle with industry-standard implementation.
 *
 * Features:
 * - System preference detection
 * - Persistent theme selection via next-themes
 * - Animated sun/moon icon transitions
 * - Accessible keyboard navigation
 * - WCAG 2.1 AA compliant
 *
 * @see https://ui.shadcn.com/docs/dark-mode/next
 * @module components/layout/mode-toggle
 */

'use client';

import { useTheme } from 'next-themes';

import { Button } from '@/src/components/primitives/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/src/components/primitives/dropdown-menu';
import { Monitor, Moon, Sun } from '@/src/lib/icons';

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="h-4 w-4 mr-2" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="h-4 w-4 mr-2" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
