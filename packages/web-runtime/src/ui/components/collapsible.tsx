'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { motion } from 'motion/react';
import { SPRING, DURATION } from '../../design-system/index.ts';
import { cn } from '../utils.ts';

const Collapsible = CollapsiblePrimitive.Root;

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;

const CollapsibleContent = ({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>) => {
  return (
    <CollapsiblePrimitive.CollapsibleContent {...props} asChild>
      <motion.div
        className={cn('overflow-hidden', className)}
        initial={false}
        animate={{
          height: 'auto',
          opacity: 1,
        }}
        exit={{
          height: 0,
          opacity: 0,
        }}
        transition={{
          height: SPRING.smooth,
          opacity: {
            duration: DURATION.fast,
            ease: 'easeOut',
          },
        }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </motion.div>
    </CollapsiblePrimitive.CollapsibleContent>
  );
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
