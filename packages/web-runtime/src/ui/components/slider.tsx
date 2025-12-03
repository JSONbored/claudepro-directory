'use client';

import { cn } from '../utils.ts';
import { iconSize } from '../../design-system/styles/icons.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { transition } from '../../design-system/styles/interactive.ts';
import { position, display, width, alignItems, overflow, height, flexGrow, pointerEvents } from '../../design-system/styles/layout.ts';
import { bgColor, borderColor } from '../../design-system/styles/colors.ts';
import { userSelect } from '../../design-system/styles/layout.ts';
import { borderWidth } from '../../design-system/styles/borders.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import * as SliderPrimitive from '@radix-ui/react-slider';
import type * as React from 'react';

const Slider = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof SliderPrimitive.Root> | null>;
}) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(`${position.relative} ${display.flex} ${width.full} touch-none ${userSelect.none} ${alignItems.center}`, className)}
    {...props}
  >
    <SliderPrimitive.Track className={`${position.relative} ${height.slider} ${width.full} ${flexGrow.grow} ${overflow.hidden} ${radius.full} ${bgColor.secondary}`}>
      <SliderPrimitive.Range className={`${position.absolute} ${height.full} ${bgColor.primary}`} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={`${display.block} ${iconSize.md} ${radius.full} ${borderWidth['2']} ${borderColor.primary} ${bgColor.background} ring-offset-background ${transition.colors} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:${pointerEvents.none} disabled:${opacityLevel[50]}`} />
  </SliderPrimitive.Root>
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
