'use client';

import { cn } from '../utils.ts';
import { size } from '../../design-system/styles/typography.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow, zLayer } from '../../design-system/styles/effects.ts';
import { overflow, padding } from '../../design-system/styles/layout.ts';
import { bgColor, textColor } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import type * as React from 'react';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = ({
  className,
  sideOffset = 4,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<typeof TooltipPrimitive.Content> | null>;
}) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      `fade-in-0 zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${zLayer.modal} animate-in ${overflow.hidden} ${radius.md} ${border.default} ${bgColor.popover} ${padding.xCompact} ${padding.ySnug} ${textColor.popoverForeground} ${size.sm} ${shadow.md} data-[state=closed]:animate-out`,
      className
    )}
    {...props}
  />
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
