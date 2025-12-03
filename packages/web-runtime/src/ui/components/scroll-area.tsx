'use client';

import { cn } from '../utils.ts';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { radius } from '../../design-system/styles/radius.ts';
import { transition } from '../../design-system/styles/interactive.ts';
import { position, overflow, height, width, display, userSelect, flexDir, flexGrow, padding } from '../../design-system/styles/layout.ts';
import { bgColor } from '../../design-system/styles/colors.ts';
import { borderLeft, borderTop } from '../../design-system/styles/borders.ts';
import type * as React from 'react';

const ScrollArea = ({
  className,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof ScrollAreaPrimitive.Root> | null>;
}) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn(`${position.relative} ${overflow.hidden}`, className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className={`${height.full} ${width.full} ${radius.inherit}`}>
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
);
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName;

const ScrollBar = ({
  className,
  orientation = 'vertical',
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> & {
  ref?: React.RefObject<React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar> | null>;
}) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      `${display.flex} touch-none ${userSelect.none} ${transition.colors}`,
      orientation === 'vertical' && `${height.full} ${width.scrollbar} ${borderLeft.transparent} ${padding.pixel1}`,
      orientation === 'horizontal' && `${height.scrollbar} ${flexDir.col} ${borderTop.transparent} ${padding.pixel1}`,
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className={`${position.relative} ${flexGrow['1']} ${radius.full} ${bgColor.border}`} />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
);
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName;

export { ScrollArea, ScrollBar };
