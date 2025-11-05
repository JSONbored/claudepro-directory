/**
 * Mobile header for auth pages - condensed HeyClaudeLogo
 */

'use client';

import { motion } from 'motion/react';
import { HeyClaudeLogo } from '@/src/components/layout/heyclaude-logo';

export function AuthMobileHeader() {
  return (
    <motion.div
      className="border-border border-b bg-background/80 px-6 py-6 backdrop-blur-sm"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3">
        <HeyClaudeLogo size="md" inView={true} duration={1.2} />
      </div>

      <motion.p
        className="mt-2 text-muted-foreground text-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Claude Desktop Directory
      </motion.p>
    </motion.div>
  );
}
