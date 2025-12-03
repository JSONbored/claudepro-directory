'use client';

import { cn } from '../utils.ts';
import { focusRing, transition, cursor } from '../../design-system/styles/interactive.ts';
import { iconSize } from '../../design-system/styles/icons.ts';
import { componentSize, display, alignItems, flexGrow, pointerEvents } from '../../design-system/styles/layout.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { shadow } from '../../design-system/styles/effects.ts';
import { bgColor } from '../../design-system/styles/colors.ts';
import { borderColor } from '../../design-system/styles/colors.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import { borderWidth } from '../../design-system/styles/borders.ts';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import type * as React from 'react';

const Switch = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  ref?: React.Ref<React.ElementRef<typeof SwitchPrimitives.Root>>;
}) => (
  <SwitchPrimitives.Root
    className={cn(
      `peer ${display.inlineFlex} ${componentSize.switch} ${flexGrow.shrink0} ${cursor.pointer} ${alignItems.center} ${radius.full} ${borderWidth['2']} ${borderColor.transparent} ${transition.colors} ${focusRing.default} focus-visible:ring-offset-background disabled:${opacityLevel[50]} disabled:cursor-not-allowed data-[state=checked]:${bgColor.primary} data-[state=unchecked]:${bgColor.input}`,
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        `${pointerEvents.none} ${display.block} ${iconSize.md} ${radius.full} ${bgColor.background} ${shadow.lg} ring-0 ${transition.transform} data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0`
      )}
    />
  </SwitchPrimitives.Root>
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
