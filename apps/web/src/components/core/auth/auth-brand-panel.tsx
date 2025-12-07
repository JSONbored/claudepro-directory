/**
 * Brand panel for auth pages - Large centered branding
 */

'use client';

import { motion } from 'motion/react';

import { HeyClaudeLogo } from '@/src/components/core/layout/brand-logo';

/**
 * Renders the branded header panel with an animated logo, main title, and descriptive subtitle for authentication pages.
 *
 * @returns The JSX element containing an animated logo (HeyClaudeLogo), a large heading, and a descriptive paragraph.
 * @see ./brand-logo#HeyClaudeLogo
 */
export function AuthBrandPanel() {
  return (
    <div className="flex max-w-2xl flex-col items-start justify-center space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="mb-6">
          <HeyClaudeLogo size="xl" inView duration={1.5} />
        </div>

        <h1 className="mb-6 text-5xl leading-tight font-bold tracking-tight lg:text-6xl">
          The ultimate Claude
          <br />
          configuration resource
        </h1>

        <p className="text-muted-foreground max-w-lg text-lg lg:text-xl">
          Discover, share, and bookmark configurations for agents, MCP servers, rules, and more.
        </p>
      </motion.div>
    </div>
  );
}