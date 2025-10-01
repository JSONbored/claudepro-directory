'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from '@/lib/icons';
import { UI_CLASSES } from '@/lib/ui-constants';

const themeSchema = z.enum(['light', 'dark']);

export function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const validatedTheme = savedTheme ? themeSchema.safeParse(savedTheme) : null;
    const saved = validatedTheme?.success ? validatedTheme.data : null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');

    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transition');

    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  if (!theme) return null;

  return (
    <Button
      onClick={toggleTheme}
      variant="ghost"
      size="sm"
      className={UI_CLASSES.BUTTON_GHOST_ICON}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
}
