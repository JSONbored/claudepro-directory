'use client';

import { cn } from '../utils.ts';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion } from 'motion/react';
import type * as React from 'react';
import { MICROINTERACTIONS } from '../design-tokens/index.ts';

const TooltipProvider = ({ 
  children, 
  delayDuration = 300,
  skipDelayDuration = 0,
  ...props 
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) => {
  // Ensure consistent defaults to prevent hydration mismatches
  return (
    <TooltipPrimitive.Provider
      delayDuration={delayDuration}
      skipDelayDuration={skipDelayDuration}
      {...props}
    >
      {children}
    </TooltipPrimitive.Provider>
  );
};

const Tooltip = ({ children, defaultOpen = false, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) => (
  <TooltipPrimitive.Root defaultOpen={defaultOpen} {...props}>
    {children}
  </TooltipPrimitive.Root>
);

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>) => (
  <TooltipPrimitive.Content
    sideOffset={sideOffset}
    asChild
    {...props}
  >
    <motion.div
      initial={MICROINTERACTIONS.tooltip.initial}
      animate={MICROINTERACTIONS.tooltip.animate}
      exit={MICROINTERACTIONS.tooltip.exit}
      transition={MICROINTERACTIONS.tooltip.transition}
      className={cn(
        'z-50 overflow-hidden rounded-md border border-border/50 bg-popover px-3 py-1.5 text-popover-foreground text-sm shadow-lg shadow-black/20 dark:shadow-black/40 backdrop-blur-sm',
        className
      )}
    >
      {props.children}
    </motion.div>
  </TooltipPrimitive.Content>
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
