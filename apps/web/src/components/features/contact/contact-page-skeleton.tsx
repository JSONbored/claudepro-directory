'use client';

/**
 * Contact Page Skeleton
 * 
 * Perfectly matches /contact structure:
 * - Centered header (title + description)
 * - Cards grid (2 columns) with contact options
 * - Prose sections (FAQ, Response Time, Contributing)
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_4 = Array.from({ length: 4 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Contact page skeleton matching exact layout
 */
export function ContactPageSkeleton() {
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
        className="mb-8 text-center"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className="mx-auto mb-4 h-10" />
        <Skeleton size="md" width="2xl" className="mx-auto h-6" />
      </motion.div>

      {/* Contact Cards Grid */}
      <motion.div
        className="mb-12"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <h2 className="mb-6 text-center text-2xl font-semibold">
          <Skeleton size="lg" width="md" className="mx-auto h-8" />
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {KEYS_4.map((key, i) => (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-1">
                    <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                    <Skeleton size="md" width="md" className="h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton size="sm" width="3xl" className="mb-4 h-4" />
                  <Skeleton size="sm" width="lg" rounded="md" className="h-6" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Prose Sections */}
      <motion.div
        className="prose prose-invert mx-auto mt-4 max-w-none space-y-12"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.section
            key={i}
            className="space-y-6"
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
          >
            <Skeleton size="lg" width="md" className="h-8" />
            <Skeleton size="sm" width="3xl" className="h-5" />
            <Skeleton size="sm" width="3xl" className="h-5" />
            <Skeleton size="sm" width="2xl" className="h-5" />
          </motion.section>
        ))}
      </motion.div>
    </motion.div>
  );
}
