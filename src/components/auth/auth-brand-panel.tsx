/**
 * Brand panel for auth pages - HeyClaudeLogo + animated gradient
 */

'use client';

import { motion } from 'motion/react';
import { HeyClaudeLogo } from '@/src/components/layout/heyclaude-logo';

interface AuthBrandPanelProps {
  stats?: Array<{ value: string; label: string }>;
}

export function AuthBrandPanel({ stats }: AuthBrandPanelProps) {
  return (
    <div className="relative flex flex-col items-start justify-center px-12 py-16 lg:px-16">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-purple-500/5 to-blue-500/5"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(var(--border-default)) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(var(--border-default)) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      >
        <div className="mb-8">
          <HeyClaudeLogo size="xl" inView={true} duration={1.8} />
        </div>

        <motion.h2
          className="mb-6 font-semibold text-3xl text-foreground leading-tight lg:text-4xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          The world's largest
          <br />
          Claude Desktop directory
        </motion.h2>

        <motion.p
          className="mb-12 max-w-md text-base text-muted-foreground lg:text-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          Discover, share, and bookmark configurations for agents, MCP servers, rules, and more.
        </motion.p>

        {stats && stats.length > 0 && (
          <motion.div
            className="flex gap-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="font-bold text-3xl text-foreground">{stat.value}</div>
                <div className="mt-1 text-muted-foreground text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
