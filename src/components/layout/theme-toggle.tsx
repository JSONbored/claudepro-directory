'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Switch } from '@/src/components/ui/switch';

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

  const toggleTheme = (checked: boolean) => {
    document.documentElement.classList.add('theme-transition');

    const newTheme = checked ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 300);
  };

  if (!theme) return null;

  return (
    <div className="flex items-center gap-2 min-h-[44px] min-w-[44px] justify-center">
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        className="min-h-[44px]"
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}
