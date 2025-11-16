/**
 * HoverCard - Reusable hover animation wrapper with gentle/strong variants
 */
'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface HoverCardProps {
  children: ReactNode;
  variant?: 'gentle' | 'strong';
  className?: string;
  disabled?: boolean;
}

const VARIANTS = {
  gentle: {
    hover: { y: -2, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
    tap: { y: 0 },
  },
  strong: {
    hover: { y: -4, scale: 1.01, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } },
    tap: { scale: 0.99 },
  },
} as const;

export function HoverCard({ children, variant = 'gentle', className, disabled }: HoverCardProps) {
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const config = VARIANTS[variant];

  return (
    <motion.div className={className} whileHover={config.hover} whileTap={config.tap}>
      {children}
    </motion.div>
  );
}
