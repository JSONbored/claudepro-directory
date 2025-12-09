'use client';

import { cn } from '../utils.ts';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import type * as React from 'react';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof PopoverPrimitive.Content> | null>;
}) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-[--radix-popover-content-transform-origin] rounded-lg border border-border/50 backdrop-blur-xl bg-[rgba(0,0,0,0.8)] p-4 text-popover-foreground shadow-xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in overflow-hidden', // Glassmorphism design
        // Enhanced entrance animation with spring-like timing
        'data-[state=open]:duration-200 data-[state=closed]:duration-150',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
