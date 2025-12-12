'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect current theme mode
 * 
 * Reads the `data-theme` attribute from document.documentElement
 * which is set by the ThemeToggle component.
 * 
 * @returns Current theme mode ('light' | 'dark')
 */
export function useTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // SSR-safe: default to 'dark' if document not available
    if (typeof window === 'undefined') return 'dark';
    
    // Read from data-theme attribute
    const dataTheme = document.documentElement.getAttribute('data-theme');
    if (dataTheme === 'light' || dataTheme === 'dark') {
      return dataTheme;
    }
    
    // Fallback to prefers-color-scheme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });

  useEffect(() => {
    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme');
          if (newTheme === 'light' || newTheme === 'dark') {
            setTheme(newTheme);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
