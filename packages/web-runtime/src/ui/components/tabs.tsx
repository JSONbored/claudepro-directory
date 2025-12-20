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

import { SPRING } from '../../design-system/index.ts';
import { cn } from '../utils.ts';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'motion/react';
import type * as React from 'react';

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
      'bg-muted text-muted-foreground inline-flex h-10 items-center justify-center rounded-md p-1',
      className
    )}
    {...props}
  />
);
TabsList.displayName = TabsPrimitive.List.displayName;

/** Spring animation config from design system */
const springBouncy = SPRING.bouncy;

const TabsTrigger = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Trigger> | null>;
}) => {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'ring-offset-background hover:text-foreground focus-visible:ring-ring data-[state=active]:text-foreground relative inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&[data-state=active]>.tab-indicator]:block',
        className
      )}
      {...props}
    >
      {/* Morphing active indicator - only visible on active tab via CSS */}
      <motion.span
        layoutId="tabs-indicator"
        className="tab-indicator bg-background absolute inset-0 -z-10 hidden rounded-sm shadow-sm"
        transition={springBouncy}
      />
      {props.children}
    </TabsPrimitive.Trigger>
  );
};
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = ({
  className,
  ref,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>;
}) => (
  <TabsPrimitive.Content ref={ref} asChild {...props}>
    <motion.div
      layout
      transition={SPRING.smooth}
      className={cn(
        'data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 ring-offset-background focus-visible:ring-ring data-[state=active]:animate-in mt-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
        className
      )}
    >
      {children}
    </motion.div>
  </TabsPrimitive.Content>
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
