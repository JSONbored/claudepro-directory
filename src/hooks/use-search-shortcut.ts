'use client';

/**
 * Global Search Keyboard Shortcut Hook
 *
 * Manages ⌘K / Ctrl+K shortcut for focusing search input
 * Implements proper focus management and accessibility
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useSearchShortcut(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // ⌘K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();

        // Try to focus search input on current page first
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[name="search"], input[type="search"]'
        );

        if (searchInput) {
          // Input exists on current page - focus it and scroll into view
          searchInput.focus();
          searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          // Navigate to homepage where search lives
          router.push('/');
          // Focus will happen after navigation via useEffect in search component
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, router]);
}
