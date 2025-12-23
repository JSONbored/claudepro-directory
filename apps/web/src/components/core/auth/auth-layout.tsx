/**
 * Split-screen auth layout - Redis-inspired design with Claude orange accent
 *
 * Full-viewport centered layout with:
 * - Desktop: Side-by-side brand panel + auth card (both vertically centered)
 * - Mobile: Stacked layout with centered auth card
 */

'use client';

import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { type ReactNode } from 'react';

interface SplitAuthLayoutProps {
  authPanel: ReactNode;
  brandPanel: ReactNode;
  mobileHeader: ReactNode;
}

// Removed: Hardcoded border color - now using Tailwind class border-primary

/**
 * Renders a responsive, split authentication layout with a desktop two-column view and a stacked mobile view.
 *
 * On large screens, displays an animated two-column layout with the brand panel on the left and
 * the auth card on the right, both vertically centered. On small screens, displays a stacked
 * layout with a mobile header above the centered auth card.
 *
 * @param brandPanel - React node displayed in the left column on large screens (hidden on mobile).
 * @param authPanel - React node placed inside the emphasized auth card on desktop and inside the mobile card on small screens.
 * @param mobileHeader - React node displayed above the stacked mobile layout.
 * @returns The layout JSX element that composes the brand panel, authentication card, and optional mobile header.
 *
 * @see SplitAuthLayoutProps
 * @see cardBorderStyle
 */
export function SplitAuthLayout({ brandPanel, authPanel, mobileHeader }: SplitAuthLayoutProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div className="bg-background relative min-h-dvh min-h-screen overflow-hidden">
      {/* Desktop: Side-by-side layout - both sides vertically centered */}
      <div className="hidden min-h-dvh min-h-screen lg:grid lg:grid-cols-2">
        {/* Left: Brand content - centered */}
        <motion.div
          className="flex min-h-dvh min-h-screen items-center justify-center px-4 xl:px-4"
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -30 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
          transition={SPRING.smooth}
        >
          {brandPanel}
        </motion.div>

        {/* Right: Auth card - centered with Claude orange accent */}
        <div className="flex min-h-dvh min-h-screen items-center justify-center px-8">
          <motion.div
            className="border-primary bg-card w-full max-w-md rounded-2xl border p-4 shadow-2xl xl:p-12"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
          >
            {authPanel}
          </motion.div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex min-h-dvh min-h-screen flex-col lg:hidden">
        {mobileHeader}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="border-primary bg-card w-full max-w-md rounded-2xl border p-8">
            {authPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
