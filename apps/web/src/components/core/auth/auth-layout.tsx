/**
 * Split-screen auth layout - Redis-inspired design with Claude orange accent
 *
 * Full-viewport centered layout with:
 * - Desktop: Side-by-side brand panel + auth card (both vertically centered)
 * - Mobile: Stacked layout with centered auth card
 */

'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SplitAuthLayoutProps {
  brandPanel: ReactNode;
  authPanel: ReactNode;
  mobileHeader: ReactNode;
}

/**
 * Responsive split authentication layout with a brand panel and an authentication card.
 *
 * Renders an animated two-column, vertically centered layout on large screens and a stacked layout
 * with a header on small screens. The auth card appears in the right column on desktop and inside
 * the centered mobile card on smaller viewports.
 *
 * @param brandPanel - Content rendered in the left (brand) column on large screens.
 * @param authPanel - Authentication card content rendered in the right column on large screens and inside the centered card on mobile.
 * @param mobileHeader - Header content displayed above the stacked mobile layout.
 * @returns The split authentication layout element.
 *
 * @see SplitAuthLayoutProps
 */
// Shared card border style for Claude orange accent
const cardBorderStyle = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'oklch(74% 0.2 35)',
} as const;

export function SplitAuthLayout({ brandPanel, authPanel, mobileHeader }: SplitAuthLayoutProps) {
  return (
    <div className="relative min-h-screen min-h-dvh overflow-hidden bg-background">
      {/* Desktop: Side-by-side layout - both sides vertically centered */}
      <div className="hidden min-h-screen min-h-dvh lg:grid lg:grid-cols-2">
        {/* Left: Brand content - centered */}
        <motion.div
          className="flex min-h-screen min-h-dvh items-center justify-center px-12 xl:px-16"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {brandPanel}
        </motion.div>

        {/* Right: Auth card - centered with Claude orange accent */}
        <div className="flex min-h-screen min-h-dvh items-center justify-center px-8">
          <motion.div
            className="w-full max-w-md rounded-2xl bg-card p-10 shadow-2xl xl:p-12"
            style={cardBorderStyle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {authPanel}
          </motion.div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex min-h-screen min-h-dvh flex-col lg:hidden">
        {mobileHeader}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-card p-8" style={cardBorderStyle}>
            {authPanel}
          </div>
        </div>
      </div>
    </div>
  );
}