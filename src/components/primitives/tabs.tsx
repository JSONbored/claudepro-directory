'use client';

/**
 * Tabs Primitives
 * Accessible tabs with Motion.dev layout animations
 *
 * Enhanced with Motion.dev (Phase 1.5 - October 2025):
 * - Smooth morphing indicator using layoutId (CSS-driven, zero JS state)
 * - Spring physics for natural transitions
 * - Respects prefers-reduced-motion
 * - Production-optimized: Radix handles state, Motion handles visuals
 */

import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import type * as React from 'react';

import { cn } from '@/src/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.List> | null>;
}) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
      className
    )}
    {...props}
  />
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Trigger> | null>;
}) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors data-[state=active]:text-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&[data-state=active]>.tab-indicator]:block',
      className
    )}
    {...props}
  >
    {/* Morphing active indicator - only visible on active tab via CSS */}
    <motion.span
      layoutId="tabs-indicator"
      className="tab-indicator absolute inset-0 bg-background rounded-sm shadow-sm -z-10 hidden"
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
    />
    {props.children}
  </TabsPrimitive.Trigger>
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>;
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2',
      className
    )}
    {...props}
  />
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
