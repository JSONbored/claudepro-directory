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
import { SPRING, STAGGER, paddingX, paddingY, marginX, marginBottom, gap, spaceY, paddingTop, iconSize } from '@heyclaude/web-runtime/design-system';
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
      className={`container ${marginX.auto} max-w-6xl ${paddingX.default} ${paddingY.relaxed} sm:${paddingY.section}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.div
        className={`${marginBottom.loose} text-center`}
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className={`${marginBottom.default} ${marginX.auto} h-10`} />
        <Skeleton size="md" width="2xl" className={`${marginX.auto} h-6`} />
      </motion.div>

      {/* Help Topics Grid */}
      <motion.section
        className={`${marginBottom.hero}`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <Skeleton size="lg" width="md" className={`${marginBottom.comfortable} h-8`} />
        <div className={`grid ${gap.comfortable} md:grid-cols-2 lg:grid-cols-4`}>
          {KEYS_4.map((key, i) => (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center ${gap.tight} text-base`}>
                    <Skeleton size="sm" width="xs" rounded="md" className={`${iconSize.md}`} />
                    <Skeleton size="sm" width="md" className="h-5" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton size="sm" width="3xl" className={`${marginBottom.default} h-4`} />
                  <ul className={`${spaceY.compact}`}>
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
        className={`${marginBottom.hero}`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        <Skeleton size="lg" width="md" className={`${marginBottom.comfortable} h-8`} />
        <div className={`${spaceY.relaxed}`}>
          {KEYS_5.map((key, i) => (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.5 + i * STAGGER.micro }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-start ${gap.tight} text-lg`}>
                    <Skeleton size="sm" width="xs" rounded="md" className={`${iconSize.md}`} />
                    <Skeleton size="md" width="lg" className="h-6" />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton size="sm" width="3xl" className={`${marginBottom.compact} h-4`} />
                  <Skeleton size="sm" width="lg" rounded="md" className="h-5" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Quick Actions */}
      <motion.section
        className={`${marginBottom.relaxed}`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.6 }}
      >
        <Skeleton size="lg" width="md" className={`${marginBottom.comfortable} h-8`} />
        <div className={`grid ${gap.default} md:grid-cols-3`}>
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              initial={!prefersReducedMotion ? { opacity: 0, scale: 0.95 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
              transition={{ ...SPRING.loading, delay: 0.7 + i * STAGGER.micro }}
            >
              <Card className={`h-full cursor-pointer`}>
                <CardContent className={`${paddingTop.comfortable}`}>
                  <div className={`${marginBottom.compact} flex items-center ${gap.compact}`}>
                    <Skeleton size="md" width="md" rounded="md" className={`${iconSize.lg}`} />
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
          <CardContent className={`${paddingTop.comfortable}`}>
            <div className={`text-center ${spaceY.comfortable}`}>
              <Skeleton size="lg" width="md" className={`${marginX.auto} h-7`} />
              <Skeleton size="sm" width="md" className={`${marginX.auto} h-5`} />
              <div className={`flex justify-center ${gap.default}`}>
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
