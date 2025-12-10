'use client';

/**
 * Search Icon Animation
 *
 * Animated search icon with typing pulse effect and focus glow.
 */

import { SPRING } from '@heyclaude/web-runtime/design-system';
import { motion, AnimatePresence } from 'motion/react';
import { Search } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';

interface SearchIconAnimationProps {
  /** Whether search is focused */
  isFocused?: boolean;
  /** Whether user is typing */
  isTyping?: boolean;
  /** Custom className */
  className?: string;
  /** Icon size class */
  iconSize?: string;
}

export function SearchIconAnimation({
  isFocused = false,
  isTyping = false,
  className,
  iconSize = 'h-5 w-5',
}: SearchIconAnimationProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Main icon */}
      <motion.div
        animate={
          isTyping
            ? {
                scale: 1.08,
              }
            : isFocused
              ? {
                  scale: 1.05,
                }
              : {
                  scale: 1,
                }
        }
        transition={
          isTyping
            ? {
                ...SPRING.smooth,
                mass: 0.8,
                repeat: Infinity,
                repeatType: 'reverse' as const,
              }
            : {
                ...SPRING.shimmer,
                mass: 0.5,
              }
        }
      >
        <Search className={cn(iconSize, 'text-accent')} aria-hidden="true" />
      </motion.div>

      {/* Focus glow ring */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-full bg-accent/20 blur-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              ...SPRING.shimmer,
              mass: 0.5,
            }}
          />
        )}
      </AnimatePresence>

      {/* Typing pulse particles */}
      <AnimatePresence>
        {isTyping && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full bg-accent/30"
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: Math.cos((i * Math.PI * 2) / 3) * 20,
                  y: Math.sin((i * Math.PI * 2) / 3) * 20,
                }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
