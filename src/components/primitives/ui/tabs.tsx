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
import { useEffect, useState } from 'react';
import { getAnimationConfig } from '@/src/lib/actions/feature-flags.actions';
import { POSITION_PATTERNS, STATE_PATTERNS } from '@/src/lib/ui-constants';
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
}) => {
  const [springBouncy, setSpringBouncy] = useState({
    type: 'spring' as const,
    stiffness: 500,
    damping: 20,
  });

  useEffect(() => {
    getAnimationConfig()
      .then((config) => {
        setSpringBouncy({
          type: 'spring' as const,
          stiffness: (config['animation.spring.bouncy.stiffness'] as number) ?? 500,
          damping: (config['animation.spring.bouncy.damping'] as number) ?? 20,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        `relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 font-medium text-sm ring-offset-background transition-colors ${STATE_PATTERNS.HOVER_TEXT_FOREGROUND} ${STATE_PATTERNS.FOCUS_RING} ${STATE_PATTERNS.DISABLED_STANDARD} data-[state=active]:text-foreground [&[data-state=active]>.tab-indicator]:block`,
        className
      )}
      {...props}
    >
      {/* Morphing active indicator - only visible on active tab via CSS */}
      <motion.span
        layoutId="tabs-indicator"
        className={`tab-indicator -z-10 ${POSITION_PATTERNS.ABSOLUTE_INSET} hidden rounded-sm bg-background shadow-sm`}
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
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TabsPrimitive.Content> | null>;
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      `data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 mt-2 ring-offset-background ${STATE_PATTERNS.FOCUS_RING} data-[state=active]:animate-in`,
      className
    )}
    {...props}
  />
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
