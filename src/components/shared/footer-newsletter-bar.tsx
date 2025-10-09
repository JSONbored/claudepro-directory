'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NewsletterForm } from '@/src/components/shared/newsletter-form';
import { Button } from '@/src/components/ui/button';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Sticky footer newsletter bar
 *
 * Features:
 * - Appears after 3 seconds delay (non-intrusive)
 * - Dismissible with localStorage persistence
 * - Slide-up animation on mount
 * - Responsive layout (stacks on mobile)
 * - Fixed at bottom with backdrop blur
 *
 * Usage:
 * ```tsx
 * <FooterNewsletterBar />
 * ```
 *
 * Accessibility:
 * - ARIA labels for screen readers
 * - Keyboard accessible dismiss button
 * - High contrast border
 */
export function FooterNewsletterBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Check if user has dismissed the bar before
    const isDismissed = localStorage.getItem('newsletter-bar-dismissed');

    if (!isDismissed) {
      // Show after 3 second delay (non-intrusive)
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }

    return undefined;
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    // Remember dismissal
    localStorage.setItem('newsletter-bar-dismissed', 'true');
  };

  // Don't render on server or if dismissed
  if (!(isClient && isVisible)) {
    return null;
  }

  return (
    <aside
      className={`${UI_CLASSES.FIXED} ${UI_CLASSES.BOTTOM_0} left-0 right-0 ${UI_CLASSES.Z_50} bg-[var(--color-bg-overlay)] backdrop-blur-xl border-t-2 border-[var(--color-border-medium)] shadow-xl animate-in slide-in-from-bottom duration-300`}
      aria-label="Newsletter signup"
    >
      {/* Subtle Claude orange accent border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent)]/30 to-transparent" />
      <div className="container mx-auto px-4 py-4">
        {/* Desktop layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-primary">
            Get weekly updates on{' '}
            <span className="text-[var(--color-accent-light)]">new tools & guides</span> — no spam,
            unsubscribe anytime
          </p>
          <div className="flex items-center gap-3">
            <NewsletterForm source="footer" className="w-[400px]" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              aria-label="Dismiss newsletter signup"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="flex md:hidden flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">
              <span className="text-[var(--color-accent-light)]">Weekly updates</span> on new tools
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              aria-label="Dismiss newsletter signup"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <NewsletterForm source="footer" />
        </div>
      </div>
    </aside>
  );
}
