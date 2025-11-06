/**
 * Brand panel for auth pages - Large centered branding
 */

'use client';

import { motion } from 'motion/react';
import { HeyClaudeLogo } from '@/src/components/layout/heyclaude-logo';

export function AuthBrandPanel() {
  return (
    <div className="flex max-w-2xl flex-col items-start justify-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="mb-6">
          <HeyClaudeLogo size="xl" inView={true} duration={1.5} />
        </div>

        <h1 className="mb-6 font-bold text-5xl leading-tight tracking-tight lg:text-6xl">
          The ultimate Claude
          <br />
          configuration resource
        </h1>

        <p className="max-w-lg text-lg text-muted-foreground lg:text-xl">
          Discover, share, and bookmark configurations for agents, MCP servers, rules, and more.
        </p>
      </motion.div>
    </div>
  );
}
