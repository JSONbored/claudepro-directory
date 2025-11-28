/**
 * Split-screen auth layout - Redis-inspired design with Claude orange accent
 */

'use client';

import { DIMENSIONS } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SplitAuthLayoutProps {
  brandPanel: ReactNode;
  authPanel: ReactNode;
  mobileHeader: ReactNode;
}

export function SplitAuthLayout({ brandPanel, authPanel, mobileHeader }: SplitAuthLayoutProps) {
  return (
    <div className={`relative ${DIMENSIONS.FULL_VIEWPORT} overflow-hidden bg-background`}>
      {/* Desktop: Side-by-side layout */}
      <div className="hidden h-full lg:grid lg:grid-cols-2">
        {/* Left: Brand content */}
        <motion.div
          className="flex items-center justify-center px-16"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {brandPanel}
        </motion.div>

        {/* Right: Auth card with Claude orange accent */}
        <div className="flex items-center justify-center">
          <motion.div
            className={`${DIMENSIONS.DROPDOWN_LG} rounded-2xl bg-card p-12 shadow-2xl`}
            style={{
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'oklch(74% 0.2 35)',
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          >
            {authPanel}
          </motion.div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex h-full flex-col lg:hidden">
        {mobileHeader}
        <div className="flex flex-1 items-center justify-center p-6">
          <div
            className="w-full max-w-md rounded-2xl bg-card p-8"
            style={{
              borderWidth: '0.5px',
              borderStyle: 'solid',
              borderColor: 'oklch(74% 0.2 35)',
            }}
          >
            {authPanel}
          </div>
        </div>
      </div>
    </div>
  );
}
