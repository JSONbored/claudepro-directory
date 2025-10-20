'use client';

/**
 * Floating Mobile Search Button
 *
 * A floating action button that appears only on mobile devices,
 * allowing users to quickly jump to the search input on the page.
 *
 * Features:
 * - Only visible on mobile (< 768px)
 * - Motion.dev spring animations
 * - Fixed positioning above bottom nav
 * - Smooth scroll to search input
 * - Accessibility optimized
 *
 * @module components/layout/floating-mobile-search
 */

import { motion } from 'motion/react';
import { Button } from '@/src/components/primitives/button';
import { Search } from '@/src/lib/icons';

export function FloatingMobileSearch() {
  const handleSearchClick = () => {
    // Find and focus the search input
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[type="search"], input[name="search"]'
    );

    if (searchInput) {
      searchInput.focus();
      searchInput.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  };

  return (
    <motion.div
      className="md:hidden fixed bottom-20 right-4 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Button
        variant="default"
        size="lg"
        className="w-14 h-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl transition-shadow duration-200"
        onClick={handleSearchClick}
        aria-label="Open search"
      >
        <Search className="h-6 w-6" />
      </Button>
    </motion.div>
  );
}
