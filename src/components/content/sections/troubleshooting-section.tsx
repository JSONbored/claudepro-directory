'use client';

/**
 * Troubleshooting Section - Displays common issues and solutions
 */

import { motion } from 'motion/react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/ui/card';
import { Copy } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

const SCROLL_REVEAL_ANIMATION = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
} as const;

interface TroubleshootingSectionProps {
  items: Array<string | { issue: string; solution: string }>;
  description?: string;
  className?: string;
}

export default function TroubleshootingSection({
  items,
  description = 'Common issues and solutions',
  className,
}: TroubleshootingSectionProps) {
  if (items.length === 0) return null;

  return (
    <motion.div {...SCROLL_REVEAL_ANIMATION}>
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
            <Copy className={UI_CLASSES.ICON_MD} />
            Troubleshooting
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {items.map((trouble, index) => {
              if (typeof trouble === 'string') {
                return (
                  <li key={index} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                    <span className="text-sm leading-relaxed">{trouble}</span>
                  </li>
                );
              }

              return (
                <li key={index} className="space-y-2">
                  <div className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                    <div className="space-y-1">
                      <p className="font-medium text-foreground text-sm">{trouble.issue}</p>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {trouble.solution}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
