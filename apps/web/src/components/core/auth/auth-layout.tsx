/**
 * Split-screen auth layout - Redis-inspired design with Claude orange accent
 *
 * Full-viewport centered layout with:
 * - Desktop: Side-by-side brand panel + auth card (both vertically centered)
 * - Mobile: Stacked layout with centered auth card
 */

'use client';

import {
  bgColor,
  flexDir,
  flexGrow,
  alignItems,
  justify,
  maxWidth,
  minHeight,
  overflow,
  padding,
  radius,
  shadow,
} from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SplitAuthLayoutProps {
  brandPanel: ReactNode;
  authPanel: ReactNode;
  mobileHeader: ReactNode;
}

// Shared card border style for Claude orange accent
const cardBorderStyle = {
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'oklch(74% 0.2 35)',
} as const;

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
  return (
    <div className={`relative ${minHeight.screen} ${minHeight.dvh} ${overflow.hidden} ${bgColor.background}`}>
      {/* Desktop: Side-by-side layout - both sides vertically centered */}
      <div className={`hidden ${minHeight.screen} ${minHeight.dvh} lg:grid lg:grid-cols-2`}>
        {/* Left: Brand content - centered */}
        <motion.div
          className={`flex ${minHeight.screen} ${minHeight.dvh} ${alignItems.center} ${justify.center} ${padding.xSpacious} xl:px-16`}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {brandPanel}
        </motion.div>

        {/* Right: Auth card - centered with Claude orange accent */}
        <div className={`flex ${minHeight.screen} ${minHeight.dvh} ${alignItems.center} ${justify.center} ${padding.xRelaxed}`}>
          <motion.div
            className={`w-full ${maxWidth.md} ${radius['2xl']} ${bgColor.card} ${padding.spacious} ${shadow['2xl']} xl:${padding.section}`}
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
      <div className={`flex ${minHeight.screen} ${minHeight.dvh} ${flexDir.col} lg:hidden`}>
        {mobileHeader}
        <div className={`flex ${flexGrow['1']} ${alignItems.center} ${justify.center} ${padding.comfortable}`}>
          <div className={`w-full ${maxWidth.md} ${radius['2xl']} ${bgColor.card} ${padding.relaxed}`} style={cardBorderStyle}>
            {authPanel}
          </div>
        </div>
      </div>
    </div>
  );
}