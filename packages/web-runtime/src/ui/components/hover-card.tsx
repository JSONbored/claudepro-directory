'use client';

/**
 * Navigation Hover Card Primitives
 * Accessible hover-triggered cards with smooth animations
 * 
 * Used for navigation dropdowns that open on hover (not click)
 * Provides better UX for desktop navigation
 * 
 * Note: This is different from the animation HoverCard component.
 * This uses Radix UI HoverCard for navigation menus.
 */

import { cn } from '../utils.ts';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import * as React from 'react';

const NavigationHoverCard = HoverCardPrimitive.Root;

const NavigationHoverCardTrigger = HoverCardPrimitive.Trigger;

const NavigationHoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, sideOffset = 8, align = 'start', children, ...props }, ref) => {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 w-64 rounded-md border bg-popover p-2 text-popover-foreground shadow-md',
          'overflow-hidden', // Prevent hover bleed outside container
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
          'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      >
        {children}
        <HoverCardPrimitive.Arrow className="fill-popover" />
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Portal>
  );
});
NavigationHoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

// Export with Navigation prefix to avoid conflict with animation HoverCard
export {
  NavigationHoverCard,
  NavigationHoverCardTrigger,
  NavigationHoverCardContent,
};
