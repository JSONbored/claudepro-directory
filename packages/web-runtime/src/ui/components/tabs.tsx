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

import { UI_ANIMATION } from '../../config/unified-config.ts';
import { cn } from '../utils.ts';
// Design System imports
import { absolute } from '../../design-system/styles/position.ts';
import { hoverText, focusRing } from '../../design-system/styles/interactive.ts';
import { padding, marginTop } from '../../design-system/styles/layout.ts';
import { size } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
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
      `inline-flex h-10 items-center justify-center ${radius.md} bg-muted ${padding.micro} text-muted-foreground`,
      className
    )}
    {...props}
  />
);
TabsList.displayName = TabsPrimitive.List.displayName;

/** Spring animation config from unified config */
const springBouncy = {
  type: 'spring' as const,
  stiffness: UI_ANIMATION['spring.bouncy.stiffness'],
  damping: UI_ANIMATION['spring.bouncy.damping'],
};

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
        `relative inline-flex items-center justify-center whitespace-nowrap ${radius.sm} px-3 py-1.5 font-medium ${size.sm} ring-offset-background transition-colors ${hoverText.foreground} ${focusRing.default} disabled:opacity-50 disabled:pointer-events-none data-[state=active]:text-foreground [&[data-state=active]>.tab-indicator]:block`,
        className
      )}
      {...props}
    >
      {/* Morphing active indicator - only visible on active tab via CSS */}
      <motion.span
        layoutId="tabs-indicator"
        className={`tab-indicator -z-10 ${absolute.inset} hidden ${radius.sm} bg-background ${shadow.sm}`}
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
      `data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-bottom-2 ${marginTop.compact} ring-offset-background ${focusRing.default} data-[state=active]:animate-in`,
      className
    )}
    {...props}
  />
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
