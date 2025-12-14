'use client';

/**
 * Help Page Skeleton
 * 
 * Perfectly matches /help structure:
 * - Centered header (title + description)
 * - Help Topics Grid (4 columns)
 * - Common Questions (list of cards)
 * - Quick Actions (3 cards)
 * - Still Need Help card
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_4 = Array.from({ length: 4 }, (_, i) => `skeleton-${i + 1}`);
const KEYS_5 = Array.from({ length: 5 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Help page skeleton matching exact layout
 */
export function HelpPageSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="container mx-auto max-w-6xl px-4 py-8 sm:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.div
        className="mb-12 text-center"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className="mb-4 mx-auto h-10" />
        <Skeleton size="md" width="2xl" className="mx-auto h-6" />
      </motion.div>

      {/* Help Topics Grid */}
      <motion.section
        className="mb-16"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <Skeleton size="lg" width="md" className="mb-6 h-8" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {KEYS_4.map((key, i) => (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                    <Skeleton size="sm" width="md" className="h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton size="sm" width="3xl" className="mb-4 h-4" />
                  <ul className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <li key={j}>
                        <Skeleton size="xs" width="xs" className="h-4" />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Common Questions */}
      <motion.section
        className="mb-16"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        <Skeleton size="lg" width="md" className="mb-6 h-8" />
        <div className="space-y-6">
          {KEYS_5.map((key, i) => (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-start gap-2 text-lg">
                    <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                    <Skeleton size="md" width="lg" className="h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton size="sm" width="3xl" className="mb-3 h-4" />
                  <Skeleton size="sm" width="lg" rounded="md" className="h-5" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        className="mb-8"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.6 }}
      >
        <Skeleton size="lg" width="md" className="mb-6 h-8" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING.loading, delay: 0.7 + i * STAGGER.micro }}
            >
              <Card className="h-full cursor-pointer">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center gap-3">
                    <Skeleton size="md" width="md" rounded="md" className="h-6 w-6" />
                    <Skeleton size="sm" width="md" className="h-5" />
                  </div>
                  <Skeleton size="xs" width="xs" className="h-4" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Still Need Help Card */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.8 }}
      >
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Skeleton size="lg" width="md" className="mx-auto h-7" />
              <Skeleton size="sm" width="md" className="mx-auto h-5" />
              <div className="flex justify-center gap-4">
                <Skeleton size="md" width="lg" rounded="lg" className="h-10" />
                <Skeleton size="md" width="lg" rounded="lg" className="h-10" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
