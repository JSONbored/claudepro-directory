'use client';

import { Check } from '../../icons.tsx';
import { cn } from '../utils.ts';
// Design System imports
import { iconSize } from '../../design-system/styles/icons.ts';
import { focusRing } from '../../design-system/styles/interactive.ts';
import { radius } from '../../design-system/styles/radius.ts';
import { display, alignItems, justify, flexGrow } from '../../design-system/styles/layout.ts';
import { borderColor, textColor, bgColor } from '../../design-system/styles/colors.ts';
import { border } from '../../design-system/styles/borders.ts';
import { opacityLevel } from '../../design-system/styles/effects.ts';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import type * as React from 'react';

const Checkbox = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
  ref?: React.Ref<React.ElementRef<typeof CheckboxPrimitive.Root>>;
}) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      `peer ${iconSize.sm} ${flexGrow.shrink0} ${radius.sm} ${border.default} ${borderColor.primary} ring-offset-background ${focusRing.default} disabled:${opacityLevel[50]} disabled:cursor-not-allowed data-[state=checked]:${bgColor.primary} data-[state=checked]:${textColor.primaryForeground}`,
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn(`${display.flex} ${alignItems.center} ${justify.center} ${textColor.current}`)}>
      <Check className={iconSize.sm} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
