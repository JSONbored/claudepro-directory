/**
 * Split-screen auth layout - desktop 50/50, mobile stacked
 */

'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SplitAuthLayoutProps {
  brandPanel: ReactNode;
  authPanel: ReactNode;
  mobileHeader: ReactNode;
}

export function SplitAuthLayout({ brandPanel, authPanel, mobileHeader }: SplitAuthLayoutProps) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Desktop brand panel */}
      <motion.div
        className="relative hidden overflow-hidden bg-muted/30 lg:flex"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {brandPanel}
      </motion.div>

      {/* Auth form */}
      <motion.div
        className="relative flex flex-col bg-background"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      >
        {/* Mobile header */}
        <div className="block lg:hidden">{mobileHeader}</div>

        <div className="flex flex-1 flex-col justify-center">{authPanel}</div>
      </motion.div>
    </div>
  );
}
